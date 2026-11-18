// Temporary native API adapter. Component layout, text and arrays live in Tower.
#include "compiler-parser-nodes.hpp"
#include <cassert>
#include <cstdlib>

namespace {
void require(bool ok) { if (!ok) std::abort(); }
template<unsigned Kind> void dispose(TowerComponent*, void* data) { node_payload_dispose(Kind, data); }
template<unsigned Kind> TowerNode* type() {
  static auto* node = [] {
    auto* value = tower_node_create();
    require(tower_component_register(value, node_payload_size(Kind), dispose<Kind>));
    return value;
  }();
  return node;
}
template<class T, unsigned Kind> T* create(TowerNode* owner) {
  if (auto* data = tower_node_get_component_userdata(owner, type<Kind>())) return static_cast<T*>(data);
  auto* component = tower_component_create(owner, type<Kind>(), node_payload_size(Kind), dispose<Kind>);
  auto* data = tower_component_get_userdata(component);
  require(data != nullptr);
  node_payload_init(Kind, data);
  return static_cast<T*>(data);
}
}

TowerNode* parser_rule_get_type() { return type<0>(); }
Rule* parser_rule_create(TowerNode* owner) { return create<Rule, 0>(owner); }
TowerNode* parser_reference_get_type() { return type<1>(); }
Reference* parser_reference_create(TowerNode* owner) { return create<Reference, 1>(owner); }
TowerNode* parser_string_get_type() { return type<2>(); }
String* parser_string_create(TowerNode* owner) { return create<String, 2>(owner); }
TowerNode* parser_range_get_type() { return type<3>(); }
Range* parser_range_create(TowerNode* owner) { return create<Range, 3>(owner); }
TowerNode* parser_match_get_type() { return type<4>(); }
Match* parser_match_create(TowerNode* owner) { return create<Match, 4>(owner); }

const char* parser_rule_get_name(Rule* value) { assert(value); return node_rule_name(value); }
void parser_rule_set_name(Rule* value, const char* data) { assert(value); require(node_rule_set_name(value, data)); }

bool parser_rule_get_generated(Rule* value) { assert(value); return node_rule_generated(value); }
void parser_rule_set_generated(Rule* value, bool data) { assert(value); node_rule_set_generated(value, data); }

const char* parser_reference_get_name(Reference* value) { assert(value); return node_reference_name(value); }
void parser_reference_set_name(Reference* value, const char* data) { assert(value); require(node_reference_set_name(value, data)); }

const char* parser_reference_get_capture(Reference* value) { assert(value); return node_reference_capture(value); }
void parser_reference_set_capture(Reference* value, const char* data) { assert(value); require(node_reference_set_capture(value, data)); }

uint32_t parser_range_get_start(Range* value) { assert(value); return node_range_start(value); }
void parser_range_set_start(Range* value, uint32_t data) { assert(value); node_range_set_start(value, data); }

uint32_t parser_range_get_end(Range* value) { assert(value); return node_range_end(value); }
void parser_range_set_end(Range* value, uint32_t data) { assert(value); node_range_set_end(value, data); }

uint32_t parser_match_get_id(Match* value) { assert(value); return node_match_id(value); }
void parser_match_set_id(Match* value, uint32_t data) { assert(value); node_match_set_id(value, data); }

size_t parser_match_get_start(Match* value) { assert(value); return node_match_start(value); }
void parser_match_set_start(Match* value, size_t data) { assert(value); node_match_set_start(value, data); }

size_t parser_match_get_length(Match* value) { assert(value); return node_match_length(value); }
void parser_match_set_length(Match* value, size_t data) { assert(value); node_match_set_length(value, data); }

size_t parser_match_get_rule_index(Match* value) { assert(value); return node_match_rule(value); }
void parser_match_set_rule_index(Match* value, size_t data) { assert(value); node_match_set_rule(value, data); }

const char* parser_match_get_label(Match* value) { assert(value); return node_match_label(value); }
void parser_match_set_label(Match* value, const char* data) { assert(value); require(node_match_set_label(value, data)); }

size_t parser_string_get_length(String* value) { assert(value); return node_string_length(value); }
const uint32_t* parser_string_get_data(String* value) { assert(value); return node_string_data(value); }
uint32_t parser_string_get_id(String* value, size_t index) {
  assert(value && index < node_string_length(value));
  return node_string_data(value)[index];
}
void parser_string_set_length(String* value, size_t length) { assert(value); require(node_string_resize(value, length)); }
void parser_string_set_id(String* value, size_t index, uint32_t id) { assert(value); require(node_string_set(value, index, id)); }
void parser_string_append_utf8(String* value, const char* begin, const char* end) {
  assert(value && end >= begin); require(node_string_append(value, begin, size_t(end - begin)));
}
