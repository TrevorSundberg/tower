#include "llvm-engine.hpp"
#include "core.hpp"
#include <chrono>

// Transitional transport adapter. All target decisions, LLVM calls, validation,
// lowering, passes, emission and disassembly execute in backend/*.tower.
extern "C" {
void* backend_open(const char*);
void backend_close(void*);
const char* backend_error(void*);
size_t backend_error_offset(void*);
unsigned backend_pointer_bytes(void*);
bool backend_lower(void*, TowerNode*, TowerNode**, size_t, unsigned, bool);
bool backend_optimize(void*, bool);
bool backend_optimize_interpreter(void*, bool);
bool backend_import_foundation(void*, TowerNode*);
bool backend_emit(void*);
const char* backend_raw(void*);
const char* backend_optimized(void*);
const uint8_t* backend_bytes(void*);
size_t backend_size(void*);
const char* backend_function_name(void*, size_t);
void* backend_disassemble(const uint8_t*, size_t, const char*);
const char* backend_disassembly_text(void*);
void backend_disassembly_close(void*);
}

TowerObject tower_optimize_foundation(const char* source, unsigned width, bool optimize) {
  TowerObject result;
  result.pointer_bytes = width;
  auto* backend = backend_open(width == 4 ? "wasm32-unknown-unknown" : "wasm64-unknown-unknown");
  if (!backend) { result.error = "Unable to allocate backend storage"; return result; }
  auto program = core_compile_foundation(source, width);
  result.error = program.error; result.error_offset = program.error_offset;
  if (result.error.empty()) result.error = backend_error(backend);
  if (result.error.empty() && backend_lower(backend, program.root, program.functions.data(), program.functions.size(), width, false)
      && backend_optimize_interpreter(backend, optimize)) {
    result.raw = backend_raw(backend); result.optimized = backend_optimized(backend);
    CoreProgram imported(width);
    if (backend_import_foundation(backend, imported.root)) {
      auto text = core_format(imported);
      result.error = text.error; result.foundation = std::move(text.source);
    }
  }
  if (result.error.empty()) result.error = backend_error(backend);
  if (!result.error.empty()) result.error_offset = backend_error_offset(backend);
  backend_close(backend);
  return result;
}

unsigned tower_target_pointer_bytes(const std::string& triple, std::string& error) {
  auto* backend = backend_open(triple.c_str());
  if (!backend) { error = "Unable to allocate backend storage"; return 0; }
  error = backend_error(backend);
  auto width = error.empty() ? backend_pointer_bytes(backend) : 0;
  backend_close(backend); return width;
}
std::string tower_disassemble(const std::vector<uint8_t>& bytes, const std::string& triple) {
  auto* result = backend_disassemble(bytes.data(), bytes.size(), triple.c_str());
  if (!result) return "Unable to allocate backend storage";
  std::string text = backend_disassembly_text(result);
  backend_disassembly_close(result); return text;
}
TowerObject tower_emit_object(const char* source, const std::string& triple, bool optimize, bool library) {
  using Clock = std::chrono::steady_clock;
  auto started = Clock::now(); TowerObject result;
  auto elapsed = [](auto a, auto b) { return std::chrono::duration<double, std::milli>(b - a).count(); };
  auto* backend = backend_open(triple.c_str());
  if (!backend) { result.error = "Unable to allocate backend storage"; return result; }
  result.error = backend_error(backend);
  if (!result.error.empty()) { backend_close(backend); return result; }
  result.pointer_bytes = backend_pointer_bytes(backend);
  auto program = core_compile_foundation(source, result.pointer_bytes);
  if (!program.error.empty()) {
    result.error = program.error; result.error_offset = program.error_offset;
    backend_close(backend); return result;
  }
  auto parsed = Clock::now();
  if (!backend_lower(backend, program.root, program.functions.data(), program.functions.size(), program.pointer_bytes, library)) {
    result.error = backend_error(backend); result.error_offset = backend_error_offset(backend);
    backend_close(backend); return result;
  }
  result.raw = backend_raw(backend); auto lowered = Clock::now();
  if (!backend_optimize(backend, optimize)) {
    result.error = backend_error(backend); result.error_offset = backend_error_offset(backend);
    backend_close(backend); return result;
  }
  result.optimized = backend_optimized(backend); auto optimized = Clock::now();
  if (!backend_emit(backend)) {
    result.error = backend_error(backend); result.error_offset = backend_error_offset(backend);
    backend_close(backend); return result;
  }
  result.bytes.assign(backend_bytes(backend), backend_bytes(backend) + backend_size(backend));
  for (size_t i = 1; i < program.functions.size(); ++i) {
    auto& fn = core_node(program.functions[i]);
    if (fn.external) result.imports.push_back(backend_function_name(backend, i));
    if (fn.exported) result.exports.push_back(backend_function_name(backend, i));
    if (fn.external) {
      auto& signature = result.signatures[backend_function_name(backend, i)];
      for (auto* p : fn.parameters) signature.push_back(core_type_name(core_node(p).type));
    }
  }
  result.timings = {{"parse", elapsed(started, parsed)}, {"before", elapsed(parsed, lowered)},
    {"after", elapsed(lowered, optimized)}, {"emit", elapsed(optimized, Clock::now())}};
  backend_close(backend); return result;
}
