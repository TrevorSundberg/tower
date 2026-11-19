#include "core.hpp"
#include "tower-runtime.inc"
#include <string>

// Mechanical legacy worker boundary. Tower owns backend state, target/input
// validation, LLVM/lld integration, diagnostics, results and JSON serialization.
// Source-to-Foundation orchestration remains the frontend owner's interface.
extern "C" {
void* backend_session_create(const uint8_t*, size_t);
bool backend_session_set_target(void*, const char*);
void backend_session_clear_inputs(void*);
bool backend_session_add_input(void*, const char*, const uint8_t*, size_t);
unsigned backend_session_begin(void*, const char*, size_t);
const char* backend_session_failure(void*, const char*, size_t);
const char* backend_session_compile(void*, TowerNode*, TowerNode**, size_t, unsigned, unsigned);
const char* backend_session_response(void*);
const char* backend_session_before(void*);
const char* backend_session_after(void*);
const char* backend_session_disassembly(void*);
const uint8_t* backend_session_bytes(void*);
size_t backend_session_size(void*);
}
namespace {
void* session() {
  static auto* value = backend_session_create(tower_runtime_object, sizeof(tower_runtime_object));
  return value;
}
}
#define EXPORT(name) extern "C" __attribute__((export_name(name)))
EXPORT("tw_llvm_set_target") int tw_llvm_set_target(const char* target) {
  return backend_session_set_target(session(), target);
}
EXPORT("tw_llvm_clear_inputs") void tw_llvm_clear_inputs() { backend_session_clear_inputs(session()); }
EXPORT("tw_llvm_add_input") int tw_llvm_add_input(const char* name, const uint8_t* bytes, size_t length) {
  return backend_session_add_input(session(), name, bytes, length);
}
EXPORT("tw_llvm_compile_options") const char* tw_llvm_compile_options(const char* source, size_t length, unsigned flags) {
  auto* state = session();
  auto width = backend_session_begin(state, source, length);
  if (!width) return backend_session_response(state);
  std::string text(source, length);
  auto program = core_compile_foundation(text.c_str(), width);
  if (!program.error.empty()) return backend_session_failure(state, program.error.c_str(), program.error_offset);
  return backend_session_compile(state, program.root, program.functions.data(), program.functions.size(), width, flags);
}
EXPORT("tw_llvm_compile") const char* tw_llvm_compile(const char* source, size_t length) { return tw_llvm_compile_options(source, length, 0); }
EXPORT("tw_llvm_before") const char* tw_llvm_before() { return backend_session_before(session()); }
EXPORT("tw_llvm_after") const char* tw_llvm_after() { return backend_session_after(session()); }
EXPORT("tw_llvm_disassembly") const char* tw_llvm_disassembly() { return backend_session_disassembly(session()); }
EXPORT("tw_llvm_bytes") const uint8_t* tw_llvm_bytes() { return backend_session_bytes(session()); }
EXPORT("tw_llvm_size") size_t tw_llvm_size() { return backend_session_size(session()); }
