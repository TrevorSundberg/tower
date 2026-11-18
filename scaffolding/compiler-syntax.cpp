#include "compiler-generics.hpp"
#include "parser.hpp"
#include "syntax.hpp"
#include "format.hpp"
#include <cstring>
#include <string>
#include <vector>

namespace {
Match* match(TowerNode* n) { return n ? static_cast<Match*>(tower_node_get_component_userdata(n, parser_match_get_type())) : nullptr; }
std::string name(TowerNode* n) {
  std::string text; std::vector<TowerNode*> pending; if (n) pending.push_back(n);
  while (!pending.empty()) {
    auto* at = pending.back(); pending.pop_back(); auto* m = match(at);
    if (m && parser_match_get_rule_index(m) == TOWER_INVALID_INDEX) text += parser_match_get_label(m);
    else for (auto i = tower_node_get_child_count(at); i; --i) pending.push_back(tower_node_get_child(at, i - 1));
  }
  return tower_identifier_value(text);
}
}
// Transitional accessors for existing C++ payloads. No specialization algorithm
// or alternate node layout lives in this bridge.
extern "C" {
bool compiler_node_label(TowerNode* n, const char* text) { auto* m = match(n); return m && !std::strcmp(parser_match_get_label(m), text); }
bool compiler_name_is(TowerNode* n, const char* text) { return name(n) == text; }
bool compiler_name_equal(TowerNode* a, TowerNode* b) { return name(a) == name(b); }
TowerNode* compiler_generic_type(size_t index) {
  static TowerNode* types[] = {tower_node_create(), tower_node_create(), tower_node_create(), tower_node_create()};
  return index < 4 ? types[index] : nullptr;
}
void* compiler_component_add(TowerNode* n, TowerNode* type, size_t bytes) {
  return tower_component_get_userdata(tower_component_create(n, type, bytes, nullptr));
}
void compiler_node_copy_metadata(TowerNode* from, TowerNode* to) {
  if (auto* m = match(from)) {
    auto* copy = parser_match_create(to);
    parser_match_set_id(copy, parser_match_get_id(m));
    parser_match_set_start(copy, parser_match_get_start(m));
    parser_match_set_length(copy, parser_match_get_length(m));
    parser_match_set_rule_index(copy, parser_match_get_rule_index(m));
    parser_match_set_label(copy, parser_match_get_label(m));
  }
  syntax_copy_origin(from, to);
}
}
