// Transitional payload reference. Production field ownership lives in parser-nodes.tower.
#include "../parser.hpp"
#include <cassert>
#include <cstring>
#include <new>
#include <string>
#include <vector>
template <typename T>
T* create_component(TowerNode* owner) {
  if (auto* data = tower_node_get_component_userdata(owner, T::compiletime_type)) return static_cast<T*>(data);
  TowerComponent* component =
    tower_component_create(owner, T::compiletime_type, sizeof(T), [](TowerComponent* component, void* userdata) {
      ((T*)userdata)->~T();
    });


  void* userdata = tower_component_get_userdata(component);
  return new (userdata) T();
}



struct Rule {
  static TowerNode* compiletime_type;

  std::string name;
  bool generated = false;
};
TowerNode* Rule::compiletime_type = tower_node_create();

TowerNode* parser_rule_get_type() {
  return Rule::compiletime_type;
}

Rule* parser_rule_create(TowerNode* owner) {
  return create_component<Rule>(owner);
}

void parser_rule_set_name(Rule* component, const char* name) {
  assert(name);
  assert(component);
  component->name = name;
}

const char* parser_rule_get_name(Rule* component) {
  assert(component);
  return component->name.c_str();
}

void parser_rule_set_generated(Rule* component, bool generated) {
  assert(component);
  component->generated = generated;
}

bool parser_rule_get_generated(Rule* component) {
  assert(component);
  return component->generated;
}



struct Reference {
  static TowerNode* compiletime_type;
  std::string name;
  std::string capture;
};
TowerNode* Reference::compiletime_type = tower_node_create();

TowerNode* parser_reference_get_type() {
  return Reference::compiletime_type;
}

Reference* parser_reference_create(TowerNode* owner) {
  return create_component<Reference>(owner);
}

void parser_reference_set_name(Reference* component, const char* name) {
  assert(name);
  component->name = name;
}

const char* parser_reference_get_name(Reference* component) {
  return component->name.c_str();
}

void parser_reference_set_capture(Reference* component, const char* name) {
  component->capture = name;
}



struct String {
  static TowerNode* compiletime_type;
  std::vector<uint32_t> ids;
};
TowerNode* String::compiletime_type = tower_node_create();

TowerNode* parser_string_get_type() {
  return String::compiletime_type;
}

String* parser_string_create(TowerNode* owner) {
  return create_component<String>(owner);
}

void parser_string_set_id(String* component, size_t index, uint32_t id) {
  assert(component);
  if (index >= component->ids.size()) {
    size_t new_size = index + 1;
    component->ids.reserve(new_size * 2);
    component->ids.resize(new_size, PARSER_ID_EOF);
  }
  component->ids[index] = id;
}

uint32_t parser_string_get_id(String* component, size_t index) {
  assert(component);
  assert(index < component->ids.size());
  return component->ids[index];
}

void parser_string_set_length(String* component, size_t length) {
  assert(component);
  component->ids.resize(length, PARSER_ID_EOF);
}

size_t parser_string_get_length(String* component) {
  assert(component);
  return component->ids.size();
}

// The same Tower-written scalar codec is used by the token lexer and raw streams.






void parser_string_append_utf8(String* component, const char* utf8_begin, const char* utf8_end) {
  assert(component);

  // This will overshoot allocation if we have unicode characters, but it's alright
  size_t reserved = component->ids.size() + (utf8_end - utf8_begin);
  component->ids.reserve(component->ids.size() + (utf8_end - utf8_begin));

  for (;;) {
    uint32_t codepoint = 0;
    size_t bytes_read = parser_decode_utf8_codepoint(utf8_begin, utf8_end, &codepoint);
    if (bytes_read == 0) {
      break;
    }
    utf8_begin += bytes_read;
    assert(utf8_begin <= utf8_end);
    component->ids.push_back(codepoint);
  }
}





struct Range {
  static TowerNode* compiletime_type;
  // Inclusive start and end of characters
  uint32_t start = '\0';
  uint32_t end = '\0';
};
TowerNode* Range::compiletime_type = tower_node_create();

TowerNode* parser_range_get_type() {
  return Range::compiletime_type;
}

Range* parser_range_create(TowerNode* owner) {
  return create_component<Range>(owner);
}

void parser_range_set_start(Range* component, uint32_t start_id) {
  assert(component);
  component->start = start_id;
}

uint32_t parser_range_get_start(Range* component) {
  assert(component);
  return component->start;
}

void parser_range_set_end(Range* component, uint32_t end_id) {
  assert(component);
  component->end = end_id;
}

uint32_t parser_range_get_end(Range* component) {
  assert(component);
  return component->end;
}



struct Match {
  static TowerNode* compiletime_type;
  uint32_t id = PARSER_ID_EOF;
  size_t start = 0;
  size_t length = 0;
  size_t rule_index = TOWER_INVALID_INDEX;
  std::string label;
};
TowerNode* Match::compiletime_type = tower_node_create();

TowerNode* parser_match_get_type() {
  return Match::compiletime_type;
}

Match* parser_match_create(TowerNode* owner) {
  return create_component<Match>(owner);
}

void parser_match_set_id(Match* component, uint32_t id) {
  assert(component);
  component->id = id;
}

uint32_t parser_match_get_id(Match* component) {
  assert(component);
  return component->id;
}

void parser_match_set_start(Match* component, size_t start) {
  assert(component);
  component->start = start;
}

size_t parser_match_get_start(Match* component) {
  assert(component);
  return component->start;
}

void parser_match_set_length(Match* component, size_t length) {
  assert(component);
  component->length = length;
}

size_t parser_match_get_length(Match* component) {
  assert(component);
  return component->length;
}

size_t parser_match_get_rule_index(Match* component) {
  return component->rule_index;
}
void parser_match_set_rule_index(Match* component, size_t index) {
  component->rule_index = index;
}

const char* parser_match_get_label(Match* component) {
  return component->label.c_str();
}

void parser_match_set_label(Match* component, const char* label) {
  component->label = label;
}


const char* parser_reference_get_capture(Reference* component) { return component->capture.c_str(); }
const uint32_t* parser_string_get_data(String* component) { return component->ids.data(); }
