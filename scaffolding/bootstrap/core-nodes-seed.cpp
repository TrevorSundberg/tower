// Frozen transitional bootstrap/reference for the Tower semantic port.
#include "../core.hpp"
#include <cassert>
#include "../compiler-foundation.hpp"
#include <new>
#include <utility>
#include <set>

const std::vector<CoreBuiltin>& core_builtins() {
  static const std::vector<CoreBuiltin> definitions{
    {"print", CoreKind::Print, 1}, {"alloc", CoreKind::Allocate, 2}, {"realloc", CoreKind::Reallocate, 3},
    {"free", CoreKind::Free, 1}, {"copy", CoreKind::Copy, 3}, {"fill", CoreKind::Fill, 3},
    {"sizeof", CoreKind::SizeOf, 1}, {"alignof", CoreKind::AlignOf, 1},
    {"convert", CoreKind::Convert, 2}, {"bits", CoreKind::Bits, 2}
  };
  return definitions;
}
const char* core_builtin_name(CoreKind kind) {
  for (const auto& definition : core_builtins()) if (definition.kind == kind) return definition.name;
  return nullptr;
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
  root = tower_node_create(); auto& n = core_attach(root, CoreKind::Program);
  n.type = {CoreScalar::Void}; functions.push_back(root);
  for (auto kind : {CoreScalar::I32, CoreScalar::U32, CoreScalar::Bool, CoreScalar::Void,
       CoreScalar::U8, CoreScalar::I64, CoreScalar::U64, CoreScalar::USize}) {
    auto* entity = tower_node_create(); tower_node_attach(entity, root);
    auto& t = core_attach(entity, CoreKind::Type); t.type = {kind, 0, nullptr, width}; t.name = core_type_name(t.type);
    t.size = core_type_size(t.type); t.alignment = core_type_alignment(t.type);
    types.push_back(entity); tower_node_release_ref(entity);
  }
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
std::string core_type_name(CoreType type) {
  const char* names[] = {"i32", "u32", "bool", "void", "", "u8", "i64", "u64", "usize"};
  std::string name;
  if (type.scalar == CoreScalar::Array) { auto& a = core_node(type.record); name = core_type_name(a.element) + "[" + std::to_string(a.length) + "]"; }
  else name = type.scalar == CoreScalar::Struct ? core_node(type.record).name : std::string(names[size_t(type.scalar)]);
  return name + std::string(type.pointers, '*');
}
bool core_aggregate(CoreType t) { return !t.pointers && (t.scalar == CoreScalar::Struct || t.scalar == CoreScalar::Array); }
size_t core_type_size(CoreType t) {
  if (t.pointers || t.scalar == CoreScalar::USize) return t.pointer_bytes;
  if (core_aggregate(t)) return core_node(t.record).size;
  return t.scalar == CoreScalar::Void ? 0 : t.scalar == CoreScalar::Bool || t.scalar == CoreScalar::U8 ? 1 :
    t.scalar == CoreScalar::I64 || t.scalar == CoreScalar::U64 ? 8 : 4;
}
size_t core_type_alignment(CoreType t) {
  if (t.pointers || t.scalar == CoreScalar::USize) return t.pointer_bytes;
  if (core_aggregate(t)) return core_node(t.record).alignment;
  return std::max(size_t(1), core_type_size(t));
}
bool core_integer(CoreType t) { return !t.pointers && (t.scalar == CoreScalar::I32 || t.scalar == CoreScalar::U32 || t.scalar == CoreScalar::U8 || t.scalar == CoreScalar::I64 || t.scalar == CoreScalar::U64 || t.scalar == CoreScalar::USize); }
bool core_signed(CoreType t) { return !t.pointers && (t.scalar == CoreScalar::I32 || t.scalar == CoreScalar::I64); }
unsigned core_width(CoreType t) { return unsigned(core_type_size(t) * 8); }
uint64_t core_mask(CoreType t) { unsigned width = core_width(t); return width == 64 ? UINT64_MAX : (uint64_t(1) << width) - 1; }
std::string core_number(uint64_t bits, CoreType t) {
  bits &= core_mask(t);
  if (core_signed(t) && (bits & (uint64_t(1) << (core_width(t) - 1))))
    return "-" + std::to_string((uint64_t(0) - bits) & core_mask(t));
  return std::to_string(bits);
}
std::string core_place_name(TowerNode* node) {
  auto& n = core_node(node);
  return n.kind == CoreKind::Field ? core_place_name(n.left) + "." + n.name :
    n.kind == CoreKind::Index ? core_place_name(n.left) + "[]" : core_node(core_binding(node)).name;
}
const char* core_operator(CoreOp op) {
  constexpr const char* names[] = {"+","-","*","/","%","&","|","^","==","!=","<","<=",">",">="};
  return names[size_t(op)];
}

CoreText core_format(const CoreProgram& program) {
  return program.error.empty() ? tower_format(program.root) : CoreText{};
}

bool CoreType::operator==(const CoreType& b) const {
  return scalar == b.scalar && pointers == b.pointers && record == b.record &&
    (!(pointers || scalar == CoreScalar::USize) || pointer_bytes == b.pointer_bytes);
}
