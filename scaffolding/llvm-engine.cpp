#include "llvm-engine.hpp"
#include "core.hpp"
#include <llvm/IR/IRBuilder.h>
#include <llvm/IR/Module.h>
#include <llvm/IR/LegacyPassManager.h>
#include <llvm/IR/Verifier.h>
#include <llvm/MC/TargetRegistry.h>
#include <llvm/Support/TargetSelect.h>
#include <llvm/Target/TargetMachine.h>
#include <llvm/Target/TargetOptions.h>
#include <llvm-c/Transforms/PassBuilder.h>
#include <llvm-c/Disassembler.h>
#include <llvm/Object/ObjectFile.h>
#include <llvm/Object/Wasm.h>
#include <llvm/Support/Format.h>
#include <chrono>
#include <memory>
#include <map>
#include <set>

using namespace llvm;
namespace {
struct Backend {
  const CoreProgram& program;
  LLVMContext context;
  Module module{"Tower", context};
  IRBuilder<> b{context};
  IntegerType *i8 = b.getInt8Ty(), *i32 = b.getInt32Ty(), *i64 = b.getInt64Ty(), *usize;
  PointerType* ptr = b.getPtrTy();
  std::vector<Function*> functions;
  std::vector<Value*> locals;
  std::map<TowerNode*, GlobalVariable*> globals;
  std::map<TowerNode*, Value*> strings;
  Function *print, *trap, *allocate, *reallocate, *deallocate, *fn = nullptr;
  struct Loop { BasicBlock *head, *after; };
  std::vector<Loop> loops;
  bool wasm;
  size_t source_offset = 0;
  explicit Backend(const CoreProgram& p, bool wasm, bool library) : program(p), usize(b.getIntNTy(p.pointer_bytes * 8)), wasm(wasm) {
    print = runtime("tower_print", b.getVoidTy(), {i32, i64, i32}, "print");
    trap = runtime("tower_trap", b.getVoidTy(), {ptr, usize}, "trap");
    allocate = runtime("tower_allocate", ptr, {usize, usize});
    reallocate = runtime("tower_reallocate", ptr, {ptr, usize, usize});
    deallocate = runtime("tower_deallocate", b.getVoidTy(), {ptr});
    for (size_t i = 0; i < p.functions.size(); ++i) {
      if (!i && library) { functions.push_back(nullptr); continue; }
      auto& f = core_node(p.functions[i]); std::vector<Type*> args;
      for (auto* param : f.parameters) args.push_back(type(core_node(param).type));
      auto linkage = i && !f.external && !f.exported ? GlobalValue::InternalLinkage : GlobalValue::ExternalLinkage;
      auto name = i ? f.external || f.exported ? f.name : "tower.fn." + f.name : "tower_main";
      auto* value = Function::Create(FunctionType::get(type(f.type), args, false), linkage, name, module);
      if (f.external || f.exported) {
        if (narrow(f.type)) value->addRetAttr(Attribute::ZExt);
        for (unsigned j = 0; j < f.parameters.size(); ++j) if (narrow(core_node(f.parameters[j]).type)) value->addParamAttr(j, Attribute::ZExt);
      }
      if (wasm && f.external) { value->addFnAttr("wasm-import-module", "env"); value->addFnAttr("wasm-import-name", f.name); }
      if (wasm && f.exported) value->addFnAttr("wasm-export-name", f.name);
      functions.push_back(value);
    }
  }
  bool narrow(CoreType t) { return !t.pointers && (t.scalar == CoreScalar::U8 || t.scalar == CoreScalar::Bool); }
  Type* type(CoreType t) {
    if (t.pointers) return ptr;
    if (core_aggregate(t)) return ArrayType::get(i8, core_type_size(t));
    return t.scalar == CoreScalar::Void ? b.getVoidTy() : b.getIntNTy(core_width(t));
  }
  ConstantInt* size(uint64_t n) { return ConstantInt::get(usize, n); }
  Constant* constant(CoreType t, uint64_t bits) {
    return t.pointers ? (Constant*)ConstantPointerNull::get(ptr) : ConstantInt::get(type(t), bits);
  }
  Function* runtime(const char* name, Type* result, ArrayRef<Type*> args, const char* import = nullptr) {
    auto* f = Function::Create(FunctionType::get(result, args, false), GlobalValue::ExternalLinkage, name, module);
    if (wasm && import) { f->addFnAttr("wasm-import-module", "tower"); f->addFnAttr("wasm-import-name", import); }
    return f;
  }
  void guard(Value* valid, const std::string& message, size_t offset) {
    auto* ok = BasicBlock::Create(context, "valid", fn); auto* bad = BasicBlock::Create(context, "error", fn);
    b.CreateCondBr(valid, ok, bad); b.SetInsertPoint(bad);
    b.CreateCall(trap, {b.CreateGlobalStringPtr(message), size(offset)}); b.CreateUnreachable(); b.SetInsertPoint(ok);
  }
  Value* address(TowerNode* node) {
    auto& n = core_node(node);
    if (n.kind == CoreKind::Load) return read(n.value);
    if (n.kind == CoreKind::Field || n.kind == CoreKind::Index) {
      auto* p = n.indirect ? read(n.left) : address(n.left);
      Value* offset = size(n.byte_offset);
      if (n.kind == CoreKind::Index) {
        auto* index = b.CreateIntCast(read(n.right), usize, core_signed(core_node(n.right).type));
        offset = b.CreateMul(index, size(core_type_size(n.type)));
      }
      return b.CreateGEP(i8, p, offset); // deliberately not inbounds
    }
    auto* binding = core_binding(node);
    if (core_node(binding).global) {
      auto& global = globals[binding];
      if (!global) {
        auto& value = core_node(binding);
        global = new GlobalVariable(module, type(value.type), false, GlobalValue::InternalLinkage,
          UndefValue::get(type(value.type)), "tower.global." + value.name);
        global->setAlignment(Align(core_type_alignment(value.type)));
      }
      return global;
    }
    return locals[core_node(binding).index];
  }
  Value* read(TowerNode* node) {
    auto& n = core_node(node);
    if (n.kind == CoreKind::Address) return address(n.value);
    if (n.kind != CoreKind::Operand && n.kind != CoreKind::String && n.kind != CoreKind::Field && n.kind != CoreKind::Index) return expression(node);
    if (n.kind == CoreKind::String) {
      auto it = strings.find(node); if (it != strings.end()) return it->second;
      auto* data = ConstantDataArray::getString(context, n.name);
      auto* global = new GlobalVariable(module, data->getType(), false, GlobalValue::PrivateLinkage, data, "tower.string");
      global->setAlignment(Align(1)); strings[node] = global; return global;
    }
    if (n.constant) return constant(n.type, n.bits);
    return b.CreateAlignedLoad(type(n.type), address(node), Align(1));
  }
  void store(TowerNode* target, Value* value, Value* p = nullptr) { b.CreateAlignedStore(value, p ? p : address(target), Align(1)); }
  Value* call(TowerNode* node) {
    auto& n = core_node(node); std::vector<Value*> args;
    for (auto* arg : n.items) args.push_back(read(arg));
    auto* callee = functions[core_node(n.binding).index]; auto* result = b.CreateCall(callee, args);
    result->setAttributes(callee->getAttributes());
    return result;
  }
  Value* expression(TowerNode* node) {
    auto& n = core_node(node);
    if (n.kind == CoreKind::Operand || n.kind == CoreKind::String || n.kind == CoreKind::Field || n.kind == CoreKind::Index || n.kind == CoreKind::Address) return read(node);
    if (n.kind == CoreKind::Call) return call(node);
    if (n.kind == CoreKind::SizeOf || n.kind == CoreKind::AlignOf) return size(n.kind == CoreKind::SizeOf ? core_type_size(n.element) : core_type_alignment(n.element));
    if (n.kind == CoreKind::Allocate) return b.CreateCall(allocate, {read(n.right), size(core_type_size(n.element))});
    if (n.kind == CoreKind::Reallocate) { auto* p = read(n.left); auto* count = read(n.right); return b.CreateCall(reallocate, {p, count, size(core_type_size(n.element))}); }
    auto* a = expression(n.kind == CoreKind::Binary ? n.left : n.value);
    if (n.kind == CoreKind::Load) return b.CreateAlignedLoad(type(n.type), a, Align(1));
    auto from = core_node(n.kind == CoreKind::Binary ? n.left : n.value).type;
    if (n.kind == CoreKind::Bits) {
      if (n.type.pointers && from.pointers) return a;
      if (n.type.pointers) return b.CreateIntToPtr(a, ptr);
      if (from.pointers) return b.CreatePtrToInt(a, type(n.type));
      return a;
    }
    if (n.kind == CoreKind::Convert) {
      if (n.type.scalar == CoreScalar::Bool) return b.CreateZExt(b.CreateICmpNE(a, ConstantInt::get(a->getType(), 0)), i8);
      auto* wide = b.CreateIntCast(a, b.getInt128Ty(), core_signed(from));
      unsigned width = core_width(n.type); auto max = APInt::getMaxValue(width).zext(128);
      APInt min(128, 0);
      if (core_signed(n.type)) { max = APInt::getSignedMaxValue(width).sext(128); min = APInt::getSignedMinValue(width).sext(128); }
      auto* valid = b.CreateAnd(b.CreateICmpSGE(wide, ConstantInt::get(context, min)), b.CreateICmpSLE(wide, ConstantInt::get(context, max)));
      guard(valid, "Numeric conversion out of range; use bits for bit reinterpretation", source_offset);
      return b.CreateIntCast(a, type(n.type), core_signed(from));
    }
    auto* right = expression(n.right);
    if (from.pointers && (n.op == CoreOp::Add || n.op == CoreOp::Sub)) {
      auto element = from; --element.pointers;
      auto* delta = b.CreateMul(b.CreateIntCast(right, usize, core_signed(core_node(n.right).type)), size(core_type_size(element)));
      if (n.op == CoreOp::Sub) delta = b.CreateNeg(delta);
      return b.CreateGEP(i8, a, delta);
    }
    switch (n.op) {
      case CoreOp::Add: return b.CreateAdd(a, right);
      case CoreOp::Sub: return b.CreateSub(a, right);
      case CoreOp::Mul: return b.CreateMul(a, right);
      case CoreOp::And: return b.CreateAnd(a, right);
      case CoreOp::Or: return b.CreateOr(a, right);
      case CoreOp::Xor: return b.CreateXor(a, right);
      case CoreOp::Div: case CoreOp::Rem: {
        guard(b.CreateICmpNE(right, ConstantInt::get(right->getType(), 0)), "Division by zero", source_offset);
        if (core_signed(from)) {
          auto* minimum = ConstantInt::get(context, APInt::getSignedMinValue(core_width(from)));
          auto* minus_one = ConstantInt::get(context, APInt::getAllOnes(core_width(from)));
          guard(b.CreateNot(b.CreateAnd(b.CreateICmpEQ(a, minimum), b.CreateICmpEQ(right, minus_one))), "Signed division overflow", source_offset);
        }
        return n.op == CoreOp::Div ? core_signed(from) ? b.CreateSDiv(a, right) : b.CreateUDiv(a, right) : core_signed(from) ? b.CreateSRem(a, right) : b.CreateURem(a, right);
      }
      default: break;
    }
    Value* cmp = nullptr;
    switch (n.op) {
      case CoreOp::Eq: cmp = b.CreateICmpEQ(a, right); break;
      case CoreOp::Ne: cmp = b.CreateICmpNE(a, right); break;
      case CoreOp::Lt: cmp = core_signed(from) ? b.CreateICmpSLT(a, right) : b.CreateICmpULT(a, right); break;
      case CoreOp::Le: cmp = core_signed(from) ? b.CreateICmpSLE(a, right) : b.CreateICmpULE(a, right); break;
      case CoreOp::Gt: cmp = core_signed(from) ? b.CreateICmpSGT(a, right) : b.CreateICmpUGT(a, right); break;
      case CoreOp::Ge: cmp = core_signed(from) ? b.CreateICmpSGE(a, right) : b.CreateICmpUGE(a, right); break;
      default: llvm_unreachable("Invalid comparison");
    }
    return b.CreateZExt(cmp, i8);
  }
  void assign(TowerNode* target, TowerNode* value) {
    auto* destination = address(target);
    store(target, expression(value), destination);
  }
  void block(TowerNode* node) { for (auto* item : core_node(node).items) { if (b.GetInsertBlock()->getTerminator()) break; statement(item); } }
  void statement(TowerNode* node) {
    auto& n = core_node(node); source_offset = n.start;
    switch (n.kind) {
      case CoreKind::Function: case CoreKind::Type: break;
      case CoreKind::Block: block(node); break;
      case CoreKind::Declare: if (n.value) assign(node, n.value); break;
      case CoreKind::Assign: assign(n.target, n.value); break;
      case CoreKind::Call: call(node); break;
      case CoreKind::Allocate: case CoreKind::Reallocate: case CoreKind::SizeOf: case CoreKind::AlignOf: case CoreKind::Convert: case CoreKind::Bits:
        expression(node); break;
      case CoreKind::Free: b.CreateCall(deallocate, {read(n.left)}); break;
      case CoreKind::Copy: case CoreKind::Fill: {
        auto* dest = read(n.left); auto* source = read(n.right); auto* count = read(n.value);
        if (n.kind == CoreKind::Copy) b.CreateMemMove(dest, Align(1), source, Align(1), count);
        else b.CreateMemSet(dest, source, count, Align(1)); break;
      }
      case CoreKind::Return: if (n.value) b.CreateRet(read(n.value)); else b.CreateRetVoid(); break;
      case CoreKind::Print: {
        auto t = core_node(n.value).type; auto* value = read(n.value);
        if (t.pointers) value = b.CreatePtrToInt(value, i64); else value = b.CreateZExtOrTrunc(value, i64);
        b.CreateCall(print, {b.getInt32(t.pointers ? 3 : unsigned(t.scalar)), value, b.getInt32(program.pointer_bytes)}); break;
      }
      case CoreKind::If: {
        auto* condition = read(n.value); auto* yes = BasicBlock::Create(context, "if.body", fn);
        auto* no = BasicBlock::Create(context, "if.else", fn); auto* after = BasicBlock::Create(context, "if.end", fn);
        b.CreateCondBr(b.CreateICmpNE(condition, b.getInt8(0)), yes, no);
        b.SetInsertPoint(yes); block(n.body); if (!b.GetInsertBlock()->getTerminator()) b.CreateBr(after);
        b.SetInsertPoint(no); if (n.otherwise) block(n.otherwise); if (!b.GetInsertBlock()->getTerminator()) b.CreateBr(after);
        b.SetInsertPoint(after); break;
      }
      case CoreKind::Loop: {
        auto* head = BasicBlock::Create(context, "loop", fn); auto* after = BasicBlock::Create(context, "loop.end", fn);
        b.CreateBr(head); b.SetInsertPoint(head); loops.push_back({head, after});
        block(n.body); if (!b.GetInsertBlock()->getTerminator()) b.CreateBr(head); loops.pop_back(); b.SetInsertPoint(after); break;
      }
      case CoreKind::Break: case CoreKind::Continue: b.CreateBr(n.kind == CoreKind::Break ? loops.back().after : loops.back().head); break;
      default: llvm_unreachable("Invalid foundation statement");
    }
  }
  void lower(size_t index) {
    auto& core = core_node(program.functions[index]); if (core.external || !functions[index]) return;
    fn = functions[index]; locals.clear(); loops.clear(); b.SetInsertPoint(BasicBlock::Create(context, "entry", fn));
    for (auto* node : core.locals) {
      auto& n = core_node(node);
      if (n.global) { locals.push_back(nullptr); continue; }
      auto* storage = b.CreateAlloca(type(n.type), nullptr, n.name); storage->setAlignment(Align(core_type_alignment(n.type))); locals.push_back(storage);
    }
    for (unsigned i = 0; i < core.parameters.size(); ++i) store(core.parameters[i], fn->getArg(i));
    block(index ? core.body : program.root);
    if (!b.GetInsertBlock()->getTerminator()) { if (fn->getReturnType()->isVoidTy()) b.CreateRetVoid(); else b.CreateUnreachable(); }
  }
};
std::string text_ir(Module& module) { std::string out; raw_string_ostream stream(out); module.print(stream, nullptr); return out; }
std::string verify(Module& module) { std::string out; raw_string_ostream stream(out); if (!verifyModule(module, &stream)) return {}; return out; }
std::unique_ptr<TargetMachine> target_machine(const std::string& triple, std::string& error) {
#ifdef TOWER_LLVM_WASM_ONLY
  LLVMInitializeWebAssemblyTargetInfo(); LLVMInitializeWebAssemblyTarget();
  LLVMInitializeWebAssemblyTargetMC(); LLVMInitializeWebAssemblyAsmPrinter();
#else
  InitializeAllTargets(); InitializeAllTargetMCs(); InitializeAllAsmPrinters();
#endif
  auto* target = TargetRegistry::lookupTarget(triple, error); if (!target) return {};
  TargetOptions options;
  std::unique_ptr<TargetMachine> machine(target->createTargetMachine(triple, "generic", "", options, Reloc::PIC_));
  if (!machine) { error = "Unable to create LLVM target"; return {}; }
  auto layout = machine->createDataLayout(); LLVMContext context;
  unsigned width = layout.getPointerSize();
  if (!layout.isLittleEndian() || (width != 4 && width != 8) ||
      layout.getPointerABIAlignment(0).value() != width ||
      layout.getABITypeAlign(Type::getInt64Ty(context)).value() != 8 ||
      layout.getABITypeAlign(Type::getInt32Ty(context)).value() != 4) {
    error = "Unsupported target memory layout"; return {};
  }
  return machine;
}
}
unsigned tower_target_pointer_bytes(const std::string& triple, std::string& error) {
  auto machine = target_machine(triple, error); return machine ? machine->createDataLayout().getPointerSize() : 0;
}
std::string tower_disassemble(const std::vector<uint8_t>& bytes, const std::string& triple) {
  LLVMInitializeWebAssemblyDisassembler();
#if defined(TOWER_BROWSER_CROSS)
  LLVMInitializeX86Disassembler(); LLVMInitializeAArch64Disassembler();
#elif !defined(TOWER_LLVM_WASM_ONLY)
  InitializeAllDisassemblers();
#endif
  auto* decoder = LLVMCreateDisasm(triple.c_str(), nullptr, 0, nullptr, nullptr);
  if (!decoder) return "Disassembler unavailable for " + triple;
  LLVMSetDisasmOptions(decoder, LLVMDisassembler_Option_PrintImmHex |
    (triple.starts_with("x86") ? LLVMDisassembler_Option_AsmPrinterVariant : 0));
  auto object = object::ObjectFile::createObjectFile(MemoryBufferRef(StringRef((const char*)bytes.data(), bytes.size()), "Tower"));
  if (!object) { auto error = toString(object.takeError()); LLVMDisasmDispose(decoder); return error; }
  std::map<uint64_t, std::string> labels;
  for (auto symbol : (*object)->symbols()) {
    auto name = symbol.getName(); auto address = symbol.getAddress();
    if (name && address && !name->empty()) labels[*address] = name->str();
    else { if (!name) consumeError(name.takeError()); if (!address) consumeError(address.takeError()); }
  }
  std::string result; raw_string_ostream out(result);
  auto instructions = [&](ArrayRef<uint8_t> contents, uint64_t base) {
    size_t offset = 0;
    while (offset < contents.size() && result.size() < 2 * 1024 * 1024) {
      auto address = base + offset;
      if (auto found = labels.find(address); found != labels.end()) out << found->second << ":\n";
      char line[1024];
      auto size = LLVMDisasmInstruction(decoder, const_cast<uint8_t*>(contents.data()) + offset, contents.size() - offset, address, line, sizeof(line));
      out << format_hex(address, 10) << "  ";
      if (size) out << line;
      else { out << ".byte " << format_hex(contents[offset],4); size = 1; }
      out << '\n'; offset += size;
    }
  };
  if (auto* wasm = dyn_cast<object::WasmObjectFile>(object->get())) {
    // Code-section lengths and local declarations are not instructions. LLVM's
    // object reader provides each exact function body, including linked inputs.
    labels.clear(); out << "; Wasm instructions; addresses are file offsets.\n";
    for (const auto& fn : wasm->functions()) {
      auto name = fn.DebugName.empty() ? fn.ExportName.value_or(fn.SymbolName) : fn.DebugName;
      out << "\nfunc[" << fn.Index << "]"; if (!name.empty()) out << " <" << name << ">"; out << ":\n";
      instructions(fn.Body, fn.Body.data() - bytes.data());
      if (result.size() >= 2 * 1024 * 1024) break;
    }
  } else {
  for (auto section : (*object)->sections()) {
    if (!section.isText()) continue;
    auto contents = section.getContents(); auto name = section.getName();
    if (!contents) { consumeError(contents.takeError()); if (!name) consumeError(name.takeError()); continue; }
    out << '\n'; if (name) out << *name; else consumeError(name.takeError()); out << ":\n";
    instructions(ArrayRef<uint8_t>((const uint8_t*)contents->data(), contents->size()), section.getAddress());
    if (result.size() >= 2 * 1024 * 1024) break;
  }
  }
  if (result.size() >= 2 * 1024 * 1024) out << "Disassembly display limited to 2 MiB.\n";
  LLVMDisasmDispose(decoder); return result;
}
TowerObject tower_emit_object(const char* source, const std::string& triple, bool optimize, bool library) {
  using Clock = std::chrono::steady_clock; auto started = Clock::now(); TowerObject result;
  auto elapsed = [](auto a, auto b) { return std::chrono::duration<double, std::milli>(b - a).count(); };
  auto machine = target_machine(triple, result.error); if (!machine) return result;
  auto layout = machine->createDataLayout(); result.pointer_bytes = layout.getPointerSize();
  auto program = core_compile_foundation(source, result.pointer_bytes);
  if (!program.error.empty()) { result.error = program.error; result.error_offset = program.error_offset; return result; }
  if (library) for (auto* node : core_node(program.root).items) {
    auto& n = core_node(node);
    if (n.kind != CoreKind::Type && n.kind != CoreKind::Function) { result.error = "Library source cannot contain top-level executable statements"; result.error_offset = n.start; return result; }
  }
  static const std::set<std::string> runtime_symbols{"tower_main", "tower_print", "tower_trap", "tower_allocate", "tower_reallocate", "tower_deallocate"};
  for (size_t i = 1; i < program.functions.size(); ++i) {
    auto& fn = core_node(program.functions[i]);
    if ((fn.external || fn.exported) && runtime_symbols.contains(fn.name)) { result.error = "Function symbol conflicts with Tower runtime: " + fn.name; result.error_offset = fn.start; return result; }
    if (fn.external) result.imports.push_back(fn.name); if (fn.exported) result.exports.push_back(fn.name);
    if (fn.external) { auto& signature = result.signatures[fn.name]; for (auto* p : fn.parameters) signature.push_back(core_type_name(core_node(p).type)); }
  }
  auto parsed = Clock::now(); Backend backend(program, triple.starts_with("wasm"), library);
  backend.module.setTargetTriple(triple); backend.module.setDataLayout(layout);
  for (size_t i = 0; i < program.functions.size(); ++i) backend.lower(i);
  result.error = verify(backend.module); if (!result.error.empty()) return result;
  result.raw = text_ir(backend.module); auto lowered = Clock::now();
  if (optimize) {
    auto opts = LLVMCreatePassBuilderOptions(); LLVMPassBuilderOptionsSetVerifyEach(opts, true);
    auto error = LLVMRunPasses(wrap(&backend.module), "function(sroa,mem2reg,instcombine,simplifycfg),default<O2>", reinterpret_cast<LLVMTargetMachineRef>(machine.get()), opts);
    LLVMDisposePassBuilderOptions(opts);
    if (error) { auto* message = LLVMGetErrorMessage(error); result.error = message; LLVMDisposeErrorMessage(message); return result; }
  }
  result.error = verify(backend.module); if (!result.error.empty()) return result;
  result.optimized = text_ir(backend.module); auto optimized = Clock::now();
  SmallVector<char, 0> bytes; raw_svector_ostream output(bytes); legacy::PassManager passes;
  if (machine->addPassesToEmitFile(passes, output, nullptr, CodeGenFileType::ObjectFile)) { result.error = "Target cannot emit object files"; return result; }
  passes.run(backend.module); result.bytes.assign(bytes.begin(), bytes.end());
  result.timings = {{"parse", elapsed(started, parsed)}, {"before", elapsed(parsed, lowered)}, {"after", elapsed(lowered, optimized)}, {"emit", elapsed(optimized, Clock::now())}};
  return result;
}
