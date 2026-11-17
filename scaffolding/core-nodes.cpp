#include "core.hpp"
#include <cassert>
#include <new>
#include <utility>
#include <set>

TowerNode* core_component_type() { static auto* type = tower_node_create(); return type; }
CoreNode* core_get(TowerNode* n) {
  return n ? static_cast<CoreNode*>(tower_node_get_component_userdata(n, core_component_type())) : nullptr;
}
CoreNode& core_node(TowerNode* n) { auto* c = core_get(n); assert(c); return *c; }
CoreNode& core_attach(TowerNode* n, CoreKind kind) {
  if (auto* c = core_get(n)) { c->kind = kind; return *c; }
  auto* component = tower_component_create(n, core_component_type(), sizeof(CoreNode),
    [](TowerComponent*, void* data) { static_cast<CoreNode*>(data)->~CoreNode(); });
  auto* c = new(tower_component_get_userdata(component)) CoreNode;
  c->kind = kind; return *c;
}
TowerNode* core_binding(TowerNode* n) { return core_node(n).binding ? core_node(n).binding : n; }
CoreProgram::CoreProgram() {
  root = tower_node_create(); auto& n = core_attach(root, CoreKind::Program);
  n.type = {CoreScalar::Void}; functions.push_back(root);
  for (auto kind : {CoreScalar::I32, CoreScalar::U32, CoreScalar::Bool, CoreScalar::Void}) {
    auto* entity = tower_node_create(); tower_node_attach(entity, root);
    auto& t = core_attach(entity, CoreKind::Type); t.type = {kind}; t.name = core_type_name(t.type);
    t.size = core_type_size(t.type); t.alignment = core_type_alignment(t.type);
    types.push_back(entity); tower_node_release_ref(entity);
  }
}
CoreProgram::~CoreProgram() { if (root) tower_node_release_ref(root); }
CoreProgram::CoreProgram(CoreProgram&& other) noexcept : root(std::exchange(other.root, nullptr)),
  functions(std::move(other.functions)), types(std::move(other.types)), names(std::move(other.names)), error(std::move(other.error)), error_offset(other.error_offset) {}
CoreProgram& CoreProgram::operator=(CoreProgram&& other) noexcept {
  if (this != &other) {
    if (root) tower_node_release_ref(root); root = std::exchange(other.root, nullptr);
    functions = std::move(other.functions); names = std::move(other.names);
    types = std::move(other.types);
    error = std::move(other.error); error_offset = other.error_offset;
  }
  return *this;
}
std::string core_type_name(CoreType type) {
  const char* names[] = {"i32", "u32", "bool", "void"};
  return (type.scalar == CoreScalar::Struct ? core_node(type.record).name : std::string(names[size_t(type.scalar)])) + std::string(type.pointers, '*');
}
bool core_aggregate(CoreType t) { return !t.pointers && t.scalar == CoreScalar::Struct; }
size_t core_type_size(CoreType t) {
  if (t.pointers) return 24; // portable checked-pointer value layout; not a host address
  if (core_aggregate(t)) return core_node(t.record).size;
  return t.scalar == CoreScalar::Void ? 0 : t.scalar == CoreScalar::Bool ? 1 : 4;
}
size_t core_type_alignment(CoreType t) {
  if (t.pointers) return 8;
  if (core_aggregate(t)) return core_node(t.record).alignment;
  return t.scalar == CoreScalar::Void || t.scalar == CoreScalar::Bool ? 1 : 4;
}
size_t core_type_cells(CoreType t) { return core_aggregate(t) ? core_node(t.record).cell_count : 1; }
std::string core_place_name(TowerNode* node) {
  auto& n = core_node(node);
  return n.kind == CoreKind::Field ? core_place_name(n.left) + "." + n.name : core_node(core_binding(node)).name;
}
const char* core_operator(CoreOp op) {
  constexpr const char* names[] = {"+","-","*","/","%","&","|","^","==","!=","<","<=",">",">="};
  return names[size_t(op)];
}

CoreText core_format(const CoreProgram& program) {
  return program.error.empty() ? tower_format(program.root) : CoreText{};
}
