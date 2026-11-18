#include "syntax-nodes.hpp"
#include <cassert>
#include <new>
#include <utility>

namespace {
void dispose_syntax(TowerComponent*, void* data) { syntax_node_dispose(static_cast<SyntaxNode*>(data)); }
}
TowerNode* syntax_component_type() {
  static auto* type = [] {
    auto* value = tower_node_create();
    if (!tower_component_register(value, syntax_node_size(), dispose_syntax)) std::abort();
    return value;
  }();
  return type;
}
SyntaxNode* syntax_get(TowerNode* node) {
  return node ? static_cast<SyntaxNode*>(tower_node_get_component_userdata(node, syntax_component_type())) : nullptr;
}
SyntaxNode& syntax_node(TowerNode* node) { auto* value = syntax_get(node); assert(value); return *value; }
SyntaxNode& syntax_attach(TowerNode* node, SyntaxKind kind) {
  if (auto* value = syntax_get(node)) { value->kind = kind; return *value; }
  auto* component = tower_component_create(node, syntax_component_type(), sizeof(SyntaxNode), dispose_syntax);
  auto* value = new(tower_component_get_userdata(component)) SyntaxNode;
  syntax_node_init(value);
  value->kind = kind; return *value;
}
bool syntax_equal(TowerNode* a, TowerNode* b, bool locations) {
  auto result = syntax_nodes_equal(a, b, syntax_component_type(), locations);
  if (result < 0) std::abort();
  return result != 0;
}
const char* syntax_kind_name(SyntaxKind kind) {
  const char* names[] = {"document", "parse", "token", "skip", "alternative", "term", "template"};
  return names[static_cast<size_t>(kind)];
}
