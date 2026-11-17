// LLVM lowers the same foundation components attached to the expanded parse nodes.
#include "core.hpp"
#include <llvm/IR/IRBuilder.h>
#include <llvm/IR/LegacyPassManager.h>
#include <llvm/IR/Module.h>
#include <llvm/IR/Verifier.h>
#include <llvm/MC/TargetRegistry.h>
#include <llvm/Support/FileSystem.h>
#include <llvm/Support/JSON.h>
#include <llvm/Support/MemoryBuffer.h>
#include <llvm/Support/TargetSelect.h>
#include <llvm/Target/TargetMachine.h>
#include <llvm/Target/TargetOptions.h>
#include <llvm-c/Transforms/PassBuilder.h>
#include <lld/Common/Driver.h>
#include <lld/Common/CommonLinkerContext.h>
#include <map>
#include <memory>
#include <chrono>

LLD_HAS_DRIVER(wasm)
using namespace llvm;
namespace {
std::string before_ir, after_ir, response;
std::vector<uint8_t> executable;
struct Backend {
  const CoreProgram& program;
  LLVMContext context;
  Module module{"Tower", context};
  IRBuilder<> b{context};
  IntegerType *i32 = b.getInt32Ty(), *i64 = b.getInt64Ty(), *i1 = b.getInt1Ty();
  StructType* pointer_type = StructType::create(context, {i32, i64, i32}, "tower.pointer");
  StructType* cell_type = StructType::create(context, {i32, pointer_type, i1, i1, i64}, "tower.cell");
  ArrayType* cells_type = ArrayType::get(cell_type, CORE_MAX_CELLS);
  GlobalVariable *cells, *stack, *depth, *generation;
  Function *print, *trap;
  std::vector<Function*> functions;
  std::vector<std::string> errors;
  std::map<std::string, size_t> error_ids;
  const CoreNode* core = nullptr;
  Function* fn = nullptr;
  Value *base = nullptr, *old_depth = nullptr;
  struct Local { Value *data = nullptr, *init = nullptr, *active = nullptr, *cell = nullptr; };
  std::vector<Local> locals;

  ConstantInt* c32(uint32_t n) { return b.getInt32(n); }
  Type* type(CoreType t) { return t.pointers ? (Type*)pointer_type : t.scalar == CoreScalar::Void ? b.getVoidTy() : i32; }
  GlobalVariable* global(Type* t, const char* name) {
    return new GlobalVariable(module, t, false, GlobalValue::InternalLinkage, Constant::getNullValue(t), name);
  }
  Function* imported(const char* name, ArrayRef<Type*> args) {
    auto* f = Function::Create(FunctionType::get(b.getVoidTy(), args, false), GlobalValue::ExternalLinkage, name, module);
    f->addFnAttr("wasm-import-module", "tower"); f->addFnAttr("wasm-import-name", name); return f;
  }
  explicit Backend(const CoreProgram& p) : program(p) {
    cells = global(cells_type, "tower.cells"); stack = global(i32, "tower.stack");
    depth = global(i32, "tower.depth"); generation = global(i64, "tower.generation");
    print = imported("print", {i32, i32, i32}); trap = imported("trap", {i32, i32});
    for (size_t i = 0; i < p.functions.size(); ++i) {
      auto& f = core_node(p.functions[i]); std::vector<Type*> args;
      for (size_t j = 0; j < f.parameters.size(); ++j) args.push_back(type(core_node(f.parameters[j]).type));
      if (i) args.push_back(i32); // Caller source location for frame-limit errors.
      auto* result = Function::Create(FunctionType::get(type(f.type), args, false),
        i ? GlobalValue::InternalLinkage : GlobalValue::ExternalLinkage,
        i ? "tower.fn." + f.name : "tower_main", module);
      functions.push_back(result);
    }
  }
  void guard(Value* valid, const std::string& message, Value* offset) {
    auto found = error_ids.emplace(message, errors.size());
    if (found.second) errors.push_back(message);
    auto* ok = BasicBlock::Create(context, "checked", fn);
    auto* bad = BasicBlock::Create(context, "error", fn);
    b.CreateCondBr(valid, ok, bad); b.SetInsertPoint(bad);
    b.CreateCall(trap, {c32(uint32_t(found.first->second)), offset}); b.CreateUnreachable(); b.SetInsertPoint(ok);
  }
  void guard(Value* valid, const std::string& message, size_t offset) { guard(valid, message, c32(uint32_t(offset))); }
  Value* field(Value* cell, unsigned index) { return b.CreateStructGEP(cell_type, cell, index); }
  Value* cell(Value* index) { return b.CreateGEP(cells_type, cells, {c32(0), index}); }
  Value* lifetime(Value* offset) {
    auto* old = b.CreateLoad(i64, generation);
    guard(b.CreateICmpNE(old, b.getInt64(UINT64_MAX)), "Local lifetime counter exhausted", offset);
    auto* next = b.CreateAdd(old, b.getInt64(1)); b.CreateStore(next, generation); return next;
  }
  Value* checked_cell(Value* pointer, size_t offset) {
    auto* index = b.CreateExtractValue(pointer, 0);
    guard(b.CreateICmpULT(index, c32(CORE_MAX_CELLS)), "Pointer refers to an expired local", offset);
    auto* address = cell(index);
    auto* active = b.CreateLoad(i1, field(address, 3));
    auto* same = b.CreateICmpEQ(b.CreateLoad(i64, field(address, 4)), b.CreateExtractValue(pointer, 1));
    guard(b.CreateAnd(active, same), "Pointer refers to an expired local", offset);
    return address;
  }
  Value* load_cell(Value* address, CoreType t) { return b.CreateLoad(type(t), field(address, t.pointers ? 1 : 0)); }
  void store_cell(Value* address, CoreType t, Value* value) {
    b.CreateStore(value, field(address, t.pointers ? 1 : 0)); b.CreateStore(b.getTrue(), field(address, 2));
  }
  Value* read(TowerNode* node, size_t offset) {
    auto& n = core_node(node); if (n.constant) return c32(n.bits);
    if (n.kind == CoreKind::Field || n.kind == CoreKind::Load) {
      auto* target = checked_cell(address(node, offset), offset);
      guard(b.CreateLoad(i1, field(target, 2)), n.kind == CoreKind::Field ? "Read of uninitialized field '" + core_place_name(node) + "'" : "Pointer load of uninitialized local", offset);
      return load_cell(target, n.type);
    }
    auto& binding = core_node(core_binding(node)); auto& local = locals[binding.index];
    guard(b.CreateAnd(b.CreateLoad(i1, local.init), b.CreateLoad(i1, local.active)), "Read of uninitialized local '" + binding.name + "'", offset);
    return local.cell ? load_cell(local.cell, n.type) : b.CreateLoad(type(n.type), local.data);
  }
  Value* address(TowerNode* node, size_t offset) {
    auto& n = core_node(node);
    if (n.kind == CoreKind::Load) return read(n.value, offset);
    if (n.kind == CoreKind::Field) {
      auto* pointer = n.indirect ? read(n.left, offset) : address(n.left, offset);
      checked_cell(pointer, offset);
      pointer = b.CreateInsertValue(pointer, b.CreateAdd(b.CreateExtractValue(pointer, 0), c32(uint32_t(n.index))), 0);
      return b.CreateInsertValue(pointer, c32(uint32_t(n.name_id)), 2);
    }
    auto& binding = core_node(core_binding(node)); Value* value = UndefValue::get(pointer_type);
    value = b.CreateInsertValue(value, b.CreateAdd(base, c32(uint32_t(binding.index))), 0);
    value = b.CreateInsertValue(value, b.CreateLoad(i64, field(locals[binding.index].cell, 4)), 1);
    return b.CreateInsertValue(value, c32(uint32_t(binding.name_id)), 2);
  }
  void store(TowerNode* node, Value* value, size_t offset, Value* pointer = nullptr) {
    auto& n = core_node(node);
    if (n.kind == CoreKind::Field || n.kind == CoreKind::Load) {
      if (!pointer) pointer = address(node, offset);
      store_cell(checked_cell(pointer, offset), n.type, value);
    } else {
      auto& local = locals[core_node(core_binding(node)).index];
      if (local.cell) store_cell(local.cell, n.type, value);
      else { b.CreateStore(value, local.data); b.CreateStore(b.getTrue(), local.init); }
    }
  }
  Value* call(TowerNode* node, TowerNode* destination, size_t offset) {
    auto& n = core_node(node); std::vector<Value*> args;
    for (auto* arg : n.items) args.push_back(read(arg, offset));
    auto* pointer = destination && (core_node(destination).kind == CoreKind::Field || core_node(destination).kind == CoreKind::Load) ? address(destination, offset) : nullptr;
    args.push_back(c32(uint32_t(offset)));
    auto* value = b.CreateCall(functions[core_node(n.binding).index], args);
    if (destination) store(destination, value, offset, pointer); return value;
  }
  Value* expression(TowerNode* node, size_t offset) {
    auto& n = core_node(node);
    if (n.kind == CoreKind::Operand || n.kind == CoreKind::Field) return read(node, offset);
    if (n.kind == CoreKind::Address) return address(n.value, offset);
    auto* a = expression(n.kind == CoreKind::Binary ? n.left : n.value, offset); Value* value = a;
    if (n.kind == CoreKind::Load) {
      auto* address = checked_cell(a, offset);
      guard(b.CreateLoad(i1, field(address, 2)), "Pointer load of uninitialized local", offset); value = load_cell(address, n.type);
    } else if (n.kind == CoreKind::Convert) {
      auto from = core_node(n.value).type;
      if (n.type.scalar == CoreScalar::Bool) value = b.CreateZExt(b.CreateICmpNE(a, c32(0)), i32);
      else if (n.type.scalar != from.scalar && from.scalar != CoreScalar::Bool)
        guard(b.CreateICmpULE(a, c32(0x7fffffff)), "Numeric conversion out of range; use bits for bit reinterpretation", offset);
    } else if (n.kind == CoreKind::Binary) {
      auto* right = expression(n.right, offset); auto input = core_node(n.left).type; bool sign = input.scalar == CoreScalar::I32;
      switch (n.op) {
        case CoreOp::Add: value = b.CreateAdd(a, right); break;
        case CoreOp::Sub: value = b.CreateSub(a, right); break;
        case CoreOp::Mul: value = b.CreateMul(a, right); break;
        case CoreOp::Div: case CoreOp::Rem:
          guard(b.CreateICmpNE(right, c32(0)), "Division by zero", offset);
          if (sign) guard(b.CreateNot(b.CreateAnd(b.CreateICmpEQ(a, c32(0x80000000)), b.CreateICmpEQ(right, c32(0xffffffff)))), "Signed division overflow", offset);
          value = n.op == CoreOp::Div ? (sign ? b.CreateSDiv(a, right) : b.CreateUDiv(a, right)) : (sign ? b.CreateSRem(a, right) : b.CreateURem(a, right)); break;
        case CoreOp::And: value = b.CreateAnd(a, right); break;
        case CoreOp::Or: value = b.CreateOr(a, right); break;
        case CoreOp::Xor: value = b.CreateXor(a, right); break;
        case CoreOp::Eq: case CoreOp::Ne:
          if (input.pointers) value = b.CreateAnd(b.CreateICmpEQ(b.CreateExtractValue(a, 0), b.CreateExtractValue(right, 0)), b.CreateICmpEQ(b.CreateExtractValue(a, 1), b.CreateExtractValue(right, 1)));
          else value = b.CreateICmpEQ(a, right);
          if (n.op == CoreOp::Ne) value = b.CreateNot(value); value = b.CreateZExt(value, i32); break;
        case CoreOp::Lt: value = b.CreateZExt(sign ? b.CreateICmpSLT(a, right) : b.CreateICmpULT(a, right), i32); break;
        case CoreOp::Le: value = b.CreateZExt(sign ? b.CreateICmpSLE(a, right) : b.CreateICmpULE(a, right), i32); break;
        case CoreOp::Gt: value = b.CreateZExt(sign ? b.CreateICmpSGT(a, right) : b.CreateICmpUGT(a, right), i32); break;
        case CoreOp::Ge: value = b.CreateZExt(sign ? b.CreateICmpSGE(a, right) : b.CreateICmpUGE(a, right), i32); break;
      }
    }
    return value;
  }
  void assign(TowerNode* target, TowerNode* value, size_t offset) {
    if (core_node(value).kind == CoreKind::Call) call(value, target, offset);
    else store(target, expression(value, offset), offset);
  }
  std::vector<TowerNode*> scopes;
  struct Loop { BasicBlock *head, *after; size_t scope; };
  std::vector<Loop> loops;
  void cleanup(size_t first) {
    for (size_t i = scopes.size(); i > first; --i) for (auto* n : core_node(scopes[i - 1]).locals)
      for (size_t j = 0; j < core_node(n).cell_count; ++j) b.CreateStore(b.getFalse(), locals[core_node(n).index + j].active);
  }
  void release() {
    for (auto& local : locals) if (local.cell) b.CreateStore(b.getFalse(), local.active);
    b.CreateStore(base, stack); b.CreateStore(old_depth, depth);
  }
  void block(TowerNode* node) {
    scopes.push_back(node);
    for (auto* item : core_node(node).items) {
      if (b.GetInsertBlock()->getTerminator()) break;
      statement(item);
    }
    if (!b.GetInsertBlock()->getTerminator()) cleanup(scopes.size() - 1);
    scopes.pop_back();
  }
  void statement(TowerNode* node) {
    auto& n = core_node(node);
    switch (n.kind) {
      case CoreKind::Function: case CoreKind::Type: break;
      case CoreKind::Block: block(node); break;
      case CoreKind::Declare: {
        auto* generation = n.address_taken ? lifetime(c32(uint32_t(n.start))) : nullptr;
        for (size_t i = 0; i < n.cell_count; ++i) {
          auto& local = locals[n.index + i]; b.CreateStore(b.getFalse(), local.init); b.CreateStore(b.getTrue(), local.active);
          if (local.cell) b.CreateStore(generation, field(local.cell, 4));
        }
        if (n.value) assign(node, n.value, n.start); break;
      }
      case CoreKind::Assign: assign(n.target, n.value, n.start); break;
      case CoreKind::Call: call(node, nullptr, n.start); break;
      case CoreKind::Return: {
        auto* value = n.value ? read(n.value, n.start) : nullptr; release();
        if (value) b.CreateRet(value); else b.CreateRetVoid(); break;
      }
      case CoreKind::Print: {
        auto* value = read(n.value, n.start); auto t = core_node(n.value).type;
        b.CreateCall(print, {c32(t.pointers ? 3 : uint32_t(t.scalar)), t.pointers ? c32(0) : value, t.pointers ? b.CreateExtractValue(value, 2) : c32(0)}); break;
      }
      case CoreKind::If: {
        auto* condition = read(n.value, n.start);
        auto* yes = BasicBlock::Create(context, "if.body", fn); auto* no = BasicBlock::Create(context, "if.else", fn); auto* after = BasicBlock::Create(context, "if.end", fn);
        b.CreateCondBr(b.CreateICmpNE(condition, c32(0)), yes, no);
        b.SetInsertPoint(yes); block(n.body); if (!b.GetInsertBlock()->getTerminator()) b.CreateBr(after);
        b.SetInsertPoint(no); if (n.otherwise) block(n.otherwise); if (!b.GetInsertBlock()->getTerminator()) b.CreateBr(after);
        b.SetInsertPoint(after); break;
      }
      case CoreKind::Loop: {
        auto* head = BasicBlock::Create(context, "loop", fn); auto* after = BasicBlock::Create(context, "loop.end", fn);
        b.CreateBr(head); b.SetInsertPoint(head); loops.push_back({head, after, scopes.size()});
        block(n.body); if (!b.GetInsertBlock()->getTerminator()) b.CreateBr(head); loops.pop_back(); b.SetInsertPoint(after); break;
      }
      case CoreKind::Break: case CoreKind::Continue:
        cleanup(loops.back().scope); b.CreateBr(n.kind == CoreKind::Break ? loops.back().after : loops.back().head); break;
      default: llvm_unreachable("Invalid foundation statement");
    }
  }
  void lower(size_t index) {
    core = &core_node(program.functions[index]); fn = functions[index]; locals.clear(); scopes.clear(); loops.clear();
    b.SetInsertPoint(BasicBlock::Create(context, "entry", fn));
    for (auto& slot : core->slots) {
      auto& local = core_node(slot.local); Local l;
      if (!local.address_taken) {
        l.data = b.CreateAlloca(type(slot.type), nullptr, local.name);
        l.init = b.CreateAlloca(i1, nullptr, local.name + ".initialized"); l.active = b.CreateAlloca(i1, nullptr, local.name + ".active");
      }
      locals.push_back(l);
    }
    base = b.CreateLoad(i32, stack); old_depth = b.CreateLoad(i32, depth);
    auto* call_offset = index ? (Value*)fn->getArg(unsigned(core->parameters.size())) : c32(0);
    guard(b.CreateAnd(b.CreateICmpULE(base, c32(uint32_t(CORE_MAX_CELLS - core->slots.size()))), b.CreateICmpULT(old_depth, c32(CORE_MAX_FRAMES))), "Tower call stack limit exceeded", call_offset);
    b.CreateStore(b.CreateAdd(base, c32(uint32_t(core->slots.size()))), stack); b.CreateStore(b.CreateAdd(old_depth, c32(1)), depth);
    for (size_t i = 0; i < locals.size(); ++i) {
      auto& l = locals[i]; auto& local = core_node(core->slots[i].local);
      if (local.address_taken) {
        l.cell = cell(b.CreateAdd(base, c32(uint32_t(i)))); l.init = field(l.cell, 2); l.active = field(l.cell, 3); b.CreateStore(b.getInt64(0), field(l.cell, 4));
      }
      b.CreateStore(b.getInt1(i < core->parameters.size()), l.init); b.CreateStore(b.getInt1(i < core->parameters.size()), l.active);
      if (i < core->parameters.size()) {
        if (l.cell) { store_cell(l.cell, local.type, fn->getArg(unsigned(i))); b.CreateStore(lifetime(call_offset), field(l.cell, 4)); }
        else b.CreateStore(fn->getArg(unsigned(i)), l.data);
      }
    }
    block(index ? core->body : program.root);
    if (!b.GetInsertBlock()->getTerminator()) {
      if (core->type.scalar == CoreScalar::Void) { release(); b.CreateRetVoid(); } else b.CreateUnreachable();
    }
  }
};

std::string text_ir(Module& module) { std::string out; raw_string_ostream stream(out); module.print(stream, nullptr); return out; }
std::string verify(Module& module) { std::string error; raw_string_ostream stream(error); if (!verifyModule(module, &stream)) return {}; return error; }
const char* failure(const std::string& error, size_t offset = 0) {
  executable.clear(); response.clear(); raw_string_ostream out(response);
  out << json::Value(json::Object{{"status", "error"}, {"error", error}, {"errorOffset", int64_t(offset)}}); return response.c_str();
}
}

#define EXPORT(name) extern "C" __attribute__((export_name(name)))
EXPORT("tw_llvm_compile") const char* tw_llvm_compile(const char* source, size_t length) {
  using Clock = std::chrono::steady_clock;
  const auto started = Clock::now();
  const auto elapsed = [](auto a, auto b) { return std::chrono::duration<double, std::milli>(b - a).count(); };
  before_ir.clear(); after_ir.clear(); executable.clear();
  if (!source || length > 8 * 1024 * 1024) return failure("Invalid foundation source length");
  std::string text(source, length);
  if (text.find('\0') != std::string::npos) return failure("Foundation source cannot contain NUL bytes");
  auto program = core_compile_foundation(text.c_str());
  if (!program.error.empty()) return failure(program.error, program.error_offset);
  const auto parsed = Clock::now();
  InitializeAllTargets(); InitializeAllTargetMCs(); InitializeAllAsmPrinters(); InitializeAllAsmParsers();
  std::string error; auto* target = TargetRegistry::lookupTarget("wasm32-unknown-unknown", error);
  if (!target) return failure(error);
  TargetOptions options;
  std::unique_ptr<TargetMachine> machine(target->createTargetMachine("wasm32-unknown-unknown", "generic", "", options, Reloc::Static));
  if (!machine) return failure("Unable to create the LLVM target machine");
  Backend backend(program); backend.module.setTargetTriple("wasm32-unknown-unknown"); backend.module.setDataLayout(machine->createDataLayout());
  for (size_t i = 0; i < program.functions.size(); ++i) backend.lower(i);
  if (auto error = verify(backend.module); !error.empty()) return failure(error);
  before_ir = text_ir(backend.module);
  const auto lowered = Clock::now();
  auto pass_options = LLVMCreatePassBuilderOptions();
  LLVMPassBuilderOptionsSetVerifyEach(pass_options, true);
  auto result = LLVMRunPasses(wrap(&backend.module), "function(sroa,mem2reg,instcombine,simplifycfg),default<O2>", reinterpret_cast<LLVMTargetMachineRef>(machine.get()), pass_options);
  LLVMDisposePassBuilderOptions(pass_options);
  if (result) { char* message = LLVMGetErrorMessage(result); std::string copy(message); LLVMDisposeErrorMessage(message); return failure(copy); }
  if (auto error = verify(backend.module); !error.empty()) return failure(error);
  after_ir = text_ir(backend.module);
  const auto optimized = Clock::now();
  {
    std::error_code ec; raw_fd_ostream object("tower-input.o", ec, sys::fs::OF_None);
    if (ec) return failure("Cannot create the object file: " + ec.message());
    legacy::PassManager passes;
    if (machine->addPassesToEmitFile(passes, object, nullptr, CodeGenFileType::ObjectFile)) return failure("LLVM cannot emit this target");
    passes.run(backend.module);
  }
  std::string link_out, link_error; raw_string_ostream output(link_out), diagnostics(link_error);
  const char* args[] = {"wasm-ld", "--no-entry", "--export=tower_main", "--allow-undefined", "--threads=1",
    "--stack-first", "-z", "stack-size=4194304", "--initial-memory=8388608", "--max-memory=16777216", "tower-input.o", "-o", "tower-output.wasm"};
  bool linked = lld::wasm::link(args, output, diagnostics, false, false);
  lld::CommonLinkerContext::destroy();
  if (!linked) return failure("Link failed: " + link_error);
  auto file = MemoryBuffer::getFile("tower-output.wasm");
  if (!file) return failure("Cannot read the linked WebAssembly module: " + file.getError().message());
  auto buffer = (*file)->getBuffer(); executable.assign(buffer.bytes_begin(), buffer.bytes_end());
  json::Array names, errors;
  for (const auto& name : program.names) names.push_back(name);
  for (const auto& error : backend.errors) errors.push_back(error);
  response.clear(); raw_string_ostream report(response);
  report << json::Value(json::Object{{"status", "compiled"}, {"names", std::move(names)}, {"errors", std::move(errors)},
    {"timings", json::Object{{"parse", elapsed(started, parsed)}, {"before", elapsed(parsed, lowered)},
      {"after", elapsed(lowered, optimized)}, {"emit", elapsed(optimized, Clock::now())}}},
    {"bytes", int64_t(executable.size())}, {"passes", "sroa, mem2reg, instcombine, simplifycfg, O2"}});
  return response.c_str();
}
EXPORT("tw_llvm_before") const char* tw_llvm_before() { return before_ir.c_str(); }
EXPORT("tw_llvm_after") const char* tw_llvm_after() { return after_ir.c_str(); }
EXPORT("tw_llvm_bytes") const uint8_t* tw_llvm_bytes() { return executable.data(); }
EXPORT("tw_llvm_size") size_t tw_llvm_size() { return executable.size(); }
