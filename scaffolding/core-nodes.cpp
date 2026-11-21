#include "core.hpp"
#include <cassert>
#include "compiler-semantic.hpp"
#include <utility>

const char* core_builtin_name(CoreKind kind) {
  return semantic_builtin_name(unsigned(kind));
}

CoreNode* core_get(TowerNode* n) {
  return sem_get(n);
}
CoreNode& core_node(TowerNode* n) { auto* c = core_get(n); assert(c); return *c; }
CoreNode& core_attach(TowerNode* n, CoreKind kind) {
  return *sem_attach(n, unsigned(kind));
}
CoreProgram::CoreProgram(unsigned width) : pointer_bytes(width) {
  root = tower_node_create();
  SemanticProgram view{};
  semantic_initialize(&view, root, width);
  functions.assign(view.functions.begin(), view.functions.end());
  types.assign(view.types.begin(), view.types.end());
  semantic_program_dispose(&view);
}

CoreProgram::~CoreProgram() { if (root) tower_node_release_ref(root); }
CoreProgram::CoreProgram(CoreProgram&& other) noexcept : pointer_bytes(other.pointer_bytes), root(std::exchange(other.root, nullptr)),
  functions(std::move(other.functions)), types(std::move(other.types)), error(std::move(other.error)), error_offset(other.error_offset) {}
std::string core_type_name(CoreType t) {
  TowerByteBuffer text{}; semantic_format_type(&t, &text);
  std::string result(reinterpret_cast<const char*>(text.data), text.length);
  bytes_dispose(&text); return result;
}
std::string core_number(uint64_t bits, CoreType t) {
  TowerByteBuffer text{}; semantic_format_number(bits, &t, &text);
  std::string result(reinterpret_cast<const char*>(text.data), text.length);
  bytes_dispose(&text); return result;
}
const char* core_operator(CoreOp op) { return semantic_operator(unsigned(op)); }
