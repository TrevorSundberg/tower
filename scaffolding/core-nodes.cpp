#include "core.hpp"
#include <cassert>
#include "compiler-foundation.hpp"
#include "compiler-semantic.hpp"
#include "compiler-syntax-reader.hpp"
#include <cstring>
#include <new>
#include <utility>

const std::vector<CoreBuiltin>& core_builtins() {
  static const auto definitions = [] {
    std::vector<CoreBuiltin> result;
    for (size_t i = 0; auto kind = semantic_builtin_at(i); ++i)
      result.push_back({semantic_builtin_name(kind), CoreKind(kind), semantic_builtin_arity(kind)});
    return result;
  }();
  return definitions;
}
const char* core_builtin_name(CoreKind kind) {
  return semantic_builtin_name(unsigned(kind));
}

TowerNode* core_component_type() { static auto* type = tower_node_create(); return type; }
CoreNode* core_get(TowerNode* n) {
  return n ? static_cast<CoreNode*>(tower_node_get_component_userdata(n, core_component_type())) : nullptr;
}
CoreNode& core_node(TowerNode* n) { auto* c = core_get(n); assert(c); return *c; }
CoreNode& core_attach(TowerNode* n, CoreKind kind) {
  if (auto* c = core_get(n)) { c->kind = kind; return *c; }
  const auto bytes = foundation_node_size();
  assert(bytes == sizeof(CoreNode));
  auto* component = tower_component_create(n, core_component_type(), bytes,
    [](TowerComponent*, void* data) { foundation_node_dispose(static_cast<CoreNode*>(data)); });
  auto* c = new(tower_component_get_userdata(component)) CoreNode;
  foundation_node_init(c);
  c->kind = kind; return *c;
}
TowerNode* core_binding(TowerNode* n) { return core_node(n).binding ? core_node(n).binding : n; }
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
CoreProgram& CoreProgram::operator=(CoreProgram&& other) noexcept {
  if (this != &other) {
    if (root) tower_node_release_ref(root); root = std::exchange(other.root, nullptr);
    pointer_bytes = other.pointer_bytes; functions = std::move(other.functions);
    types = std::move(other.types);
    error = std::move(other.error); error_offset = other.error_offset;
  }
  return *this;
}
bool CoreType::operator==(const CoreType& other) const { return semantic_type_equal(this, &other); }
std::string core_type_name(CoreType t) {
  TowerByteBuffer text{}; semantic_format_type(&t, &text);
  std::string result(reinterpret_cast<const char*>(text.data), text.length);
  bytes_dispose(&text); return result;
}
bool core_aggregate(CoreType t) { return semantic_aggregate(&t); }
size_t core_type_size(CoreType t) { return semantic_size(&t); }
size_t core_type_alignment(CoreType t) { return semantic_alignment(&t); }
bool core_integer(CoreType t) { return semantic_integer(&t); }
bool core_signed(CoreType t) { return semantic_signed(&t); }
unsigned core_width(CoreType t) { return semantic_width(&t); }
uint64_t core_mask(CoreType t) { return semantic_mask(&t); }
std::string core_number(uint64_t bits, CoreType t) {
  TowerByteBuffer text{}; semantic_format_number(bits, &t, &text);
  std::string result(reinterpret_cast<const char*>(text.data), text.length);
  bytes_dispose(&text); return result;
}
std::string core_place_name(TowerNode* node) {
  auto& n = core_node(node);
  return n.kind == CoreKind::Field ? core_place_name(n.left) + "." + n.name :
    n.kind == CoreKind::Index ? core_place_name(n.left) + "[]" : core_node(core_binding(node)).name;
}
const char* core_operator(CoreOp op) { return semantic_operator(unsigned(op)); }

CoreText core_format(const CoreProgram& program) {
  return program.error.empty() ? tower_format(program.root) : CoreText{};
}

// Mechanical access to existing entities and payloads. No semantic decisions.
extern "C" {
CoreNode* sem_get(TowerNode* n) { return core_get(n); }
CoreNode* sem_attach(TowerNode* n, unsigned kind) { return &core_attach(n, CoreKind(kind)); }
TowerNode* sem_create(TowerNode* parent) {
  auto* n = tower_node_create(); tower_node_attach(n, parent); tower_node_release_ref(n); return n;
}
void* sem_match(TowerNode* n) { return n ? tower_node_get_component_userdata(n, parser_match_get_type()) : nullptr; }
TowerNode* sem_child(TowerNode* n, size_t i) { return n ? tower_node_get_child(n, i) : nullptr; }
size_t sem_child_count(TowerNode* n) { return n ? tower_node_get_child_count(n) : 0; }
TowerNode* sem_parent(TowerNode* n) { return tower_node_get_parent(n); }
TowerNode* sem_member(TowerNode* n, const char* name) { return n ? tower_node_get_child_member(n, name) : nullptr; }
void sem_decode_identifier(char* text) {
  const auto length = syntax_identifier_decode_in_place(text, std::strlen(text)); text[length] = 0;
}
void sem_require(bool ok) { if (!ok) std::abort(); }
}
