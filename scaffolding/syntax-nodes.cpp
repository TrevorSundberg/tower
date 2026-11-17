#include "syntax-nodes.hpp"
#include <cassert>
#include <new>
#include <utility>

TowerNode* syntax_component_type() { static auto* type = tower_node_create(); return type; }
SyntaxNode* syntax_get(TowerNode* node) {
  return node ? static_cast<SyntaxNode*>(tower_node_get_component_userdata(node, syntax_component_type())) : nullptr;
}
SyntaxNode& syntax_node(TowerNode* node) { auto* value = syntax_get(node); assert(value); return *value; }
SyntaxNode& syntax_attach(TowerNode* node, SyntaxKind kind) {
  if (auto* value = syntax_get(node)) { value->kind = kind; return *value; }
  auto* component = tower_component_create(node, syntax_component_type(), sizeof(SyntaxNode),
    [](TowerComponent*, void* data) { static_cast<SyntaxNode*>(data)->~SyntaxNode(); });
  auto* value = new(tower_component_get_userdata(component)) SyntaxNode;
  value->kind = kind; return *value;
}
bool syntax_equal(TowerNode* a, TowerNode* b, bool locations) {
  std::vector<std::pair<TowerNode*, TowerNode*>> pending{{a, b}};
  while (!pending.empty()) {
    auto [left, right] = pending.back(); pending.pop_back();
    if (left == right) continue;
    if (!left || !right) return false;
    auto& x = syntax_node(left); auto& y = syntax_node(right);
    if (x.kind != y.kind || x.name != y.name || x.text != y.text || x.capture != y.capture ||
        x.style != y.style || x.literal != y.literal || x.append != y.append ||
        x.repetition != y.repetition || x.items.size() != y.items.size()) return false;
    // Compiled templates retain definition coordinates. Other locations/comments
    // do not affect parser-table identity and stay on the current source nodes.
    if (locations && x.kind == SyntaxKind::Template && (x.start != y.start || x.end != y.end)) return false;
    for (size_t i = 0; i < x.items.size(); ++i) pending.emplace_back(x.items[i], y.items[i]);
    pending.emplace_back(x.replacement.get(), y.replacement.get());
  }
  return true;
}
const char* syntax_kind_name(SyntaxKind kind) {
  const char* names[] = {"document", "parse", "token", "skip", "alternative", "term", "template"};
  return names[static_cast<size_t>(kind)];
}
