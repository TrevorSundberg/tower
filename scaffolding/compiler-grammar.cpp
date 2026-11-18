// Temporary ABI for constructing ordinary grammar entities from Tower code.
#include "parser.hpp"
extern "C" {
TowerNode* compiler_grammar_root() { return tower_node_create(); }
TowerNode* compiler_grammar_rule(TowerNode* root, const char* name, bool generated) {
  return parser_rule_create_subtree(root, name, generated);
}
void compiler_grammar_reference(TowerNode* rule, const char* name, const char* capture) {
  auto* node = parser_reference_create_subtree(rule, name);
  auto* value = static_cast<Reference*>(tower_node_get_component_userdata(node, parser_reference_get_type()));
  parser_reference_set_capture(value, capture);
}
void compiler_grammar_literal(TowerNode* rule, const char* text) { parser_string_create_subtree_utf8_null_terminated(rule, text); }
void compiler_grammar_range(TowerNode* rule, uint32_t first, uint32_t last) { parser_range_create_subtree(rule, first, last); }
}
