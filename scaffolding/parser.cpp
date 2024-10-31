#include "parser.hpp"
#include <unordered_map>
#include <string>
#include <vector>
#include <cassert>
#include <sstream>
#include <algorithm>
#include <memory>

// We don't use -1 just to ensure it never gets mixed with TOWER_INVALID_INDEX
const uint32_t PARSER_ID_EOF = (uint32_t)-2;
const uint32_t PARSER_ID_LOOKAHEAD = (uint32_t)-3;

// The tests come first so that we don't see the definition of any structs
void parser_tests_internal();
void parser_tests() {
  parser_tests_internal();

  const uint32_t tower_node_initial_count = tower_node_get_allocated_count();
  const uint32_t tower_component_initial_count = tower_component_get_allocated_count();
  const uint32_t tower_memory_initial_count = tower_memory_get_allocated_count();

  {
    assert(parser_rule_get_type() != nullptr);
    assert(parser_reference_get_type() != nullptr);
    assert(parser_string_get_type() != nullptr);
    assert(parser_range_get_type() != nullptr);
    assert(parser_match_get_type() != nullptr);
  }

  // Test stream (ascii/unicode)
  {
    Stream* stream = parser_stream_utf8_null_terminated_create("aé€🏰");
    uint32_t id = 0;
    uint32_t start = 0;
    uint32_t length = 0;
    TowerNode* node = nullptr;
    node = parser_stream_read(stream, &id, &start, &length);
    assert(id == U'a');
    assert(start == 0);
    assert(length == 1);
    assert(node == nullptr);
    node = parser_stream_read(stream, &id, &start, &length);
    assert(id == U'é');
    assert(start == 1);
    assert(length == 2);
    assert(node == nullptr);
    node = parser_stream_read(stream, &id, &start, &length);
    assert(id == U'€');
    assert(start == 3);
    assert(length == 3);
    assert(node == nullptr);
    node = parser_stream_read(stream, &id, &start, &length);
    assert(id == U'🏰');
    assert(start == 6);
    assert(length == 4);
    assert(node == nullptr);
    node = parser_stream_read(stream, &id, &start, &length);
    assert(id == PARSER_ID_EOF);
    assert(start == PARSER_ID_EOF);
    assert(length == 0);
    assert(node == nullptr);
    // Attempting to read again should stay at EOF
    node = parser_stream_read(stream, &id, &start, &length);
    assert(id == PARSER_ID_EOF);
    assert(start == PARSER_ID_EOF);
    assert(length == 0);
    assert(node == nullptr);
    parser_stream_destroy(stream);
  }
  
  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);
  assert(tower_memory_get_allocated_count() == tower_memory_initial_count);

  // Test the rule component (create_subtree calls create + all setters)
  {
    TowerNode* root = tower_node_create();
    TowerNode* child = parser_rule_create_subtree(root, "A", false);
    assert(child);
    assert(tower_node_get_parent(child) == root);
    Rule* component = (Rule*)tower_node_get_component_userdata(child, parser_rule_get_type());
    assert(component);
    assert(strcmp(parser_rule_get_name(component), "A") == 0);
    assert(parser_rule_get_generated(component) == false);
    tower_node_release_ref(root);
  }

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);
  assert(tower_memory_get_allocated_count() == tower_memory_initial_count);

  // Test the reference component (create_subtree calls create + all setters)
  {
    TowerNode* root = tower_node_create();
    TowerNode* child = parser_reference_create_subtree(root, "A");
    assert(child);
    assert(tower_node_get_parent(child) == root);
    Reference* component = (Reference*)tower_node_get_component_userdata(child, parser_reference_get_type());
    assert(component);
    assert(strcmp(parser_reference_get_name(component), "A") == 0);
    tower_node_release_ref(root);
  }

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);
  assert(tower_memory_get_allocated_count() == tower_memory_initial_count);

  // Test the string component (create_subtree calls create + all setters)
  {
    TowerNode* root = tower_node_create();
    assert(root);
    TowerNode* child = parser_string_create_subtree_utf8_null_terminated(root, "AZ");
    assert(child);
    assert(tower_node_get_parent(child) == root);
    String* component = (String*)tower_node_get_component_userdata(child, parser_string_get_type());
    assert(component);
    assert(parser_string_get_length(component) == 2);
    assert(parser_string_get_id(component, 0) == U'A');
    assert(parser_string_get_id(component, 1) == U'Z');

    // Grow the array, the fill should be PARSER_ID_EOF
    parser_string_set_length(component, 3);
    assert(parser_string_get_id(component, 2) == PARSER_ID_EOF);

    // Grows the array and leaves a gap at index 3
    parser_string_set_id(component, 4, 123);
    assert(parser_string_get_id(component, 4) == 123);
    assert(parser_string_get_id(component, 3) == PARSER_ID_EOF);

    tower_node_release_ref(root);
  }

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);
  assert(tower_memory_get_allocated_count() == tower_memory_initial_count);

  // Test the range component (create_subtree calls create + all setters)
  {
    TowerNode* root = tower_node_create();
    TowerNode* child = parser_range_create_subtree(root, 'a', 'z');
    assert(child);
    assert(tower_node_get_parent(child) == root);
    Range* component = (Range*)tower_node_get_component_userdata(child, parser_range_get_type());
    assert(component);
    assert(parser_range_get_start(component) == 'a');
    assert(parser_range_get_end(component) == 'z');
    tower_node_release_ref(root);
  }

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);
  assert(tower_memory_get_allocated_count() == tower_memory_initial_count);

  // Test the match component (create_subtree calls create + all setters)
  {
    TowerNode* root = tower_node_create();
    TowerNode* child = parser_match_create_subtree(root, 123, 10, 5);
    assert(child);
    assert(tower_node_get_parent(child) == root);
    Match* component = (Match*)tower_node_get_component_userdata(child, parser_match_get_type());
    assert(component);
    assert(parser_match_get_id(component) == 123);
    assert(parser_match_get_start(component) == 10);
    assert(parser_match_get_length(component) == 5);
    tower_node_release_ref(root);
  }

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);
  assert(tower_memory_get_allocated_count() == tower_memory_initial_count);

  // Test infinite recursion (rules with no base case)
  // Test missing rules (which we actually want to be able to iteratively add rules and have it work...)
  // Test orphaned rules (no references to them)
  // Test token strings
  // Test recursive rules
  // Test character ranges
  // Test parse rule referring to token rules
  // Tets parse rule with direct strings
  // Test SLR failure case
  // Test associativity
  // Test precedence
  // Test callbacks, ah hmm we have to be able to specify a callback...
  // Ideally, just write test cases for the actual rules we write
  // e.g. lets actually implement the parser for BNF (identifiers, etc)
  // and then setup tests to run against those, as they will test all features

/*
  // token E = T E'
  // token E' = '+' T E';
  // token E' = ;
  // token T = F T';
  // token T' = '*' F T';
  // token T' = ;
  // token F = '(' E ')';
  // token F = '1'
  {
    TowerNode* token_rules = tower_node_create();

    TowerNode* e0 = parser_rule_create_subtree(token_rules, "E", false);
    parser_reference_create_subtree(e0, "T");
    parser_reference_create_subtree(e0, "E'");

    TowerNode* e1 = parser_rule_create_subtree(token_rules, "E'", false);
    parser_string_create_subtree_utf8_null_terminated(e1, "+");
    parser_reference_create_subtree(e1, "T");
    parser_reference_create_subtree(e1, "E'");

    parser_rule_create_subtree(token_rules, "E'", false); // epsilon rule, no children


    TowerNode* t0 = parser_rule_create_subtree(token_rules, "T", false);
    parser_reference_create_subtree(t0, "F");
    parser_reference_create_subtree(t0, "T'");

    TowerNode* t1 = parser_rule_create_subtree(token_rules, "T'", false);
    parser_string_create_subtree_utf8_null_terminated(t1, "*");
    parser_reference_create_subtree(t1, "F");
    parser_reference_create_subtree(t1, "T'");

    parser_rule_create_subtree(token_rules, "T'", false); // epsilon rule, no children

    TowerNode* f0 = parser_rule_create_subtree(token_rules, "F", false);
    parser_string_create_subtree_utf8_null_terminated(f0, "(");
    parser_reference_create_subtree(f0, "E");
    parser_string_create_subtree_utf8_null_terminated(f0, ")");

    TowerNode* f1 = parser_rule_create_subtree(token_rules, "F", false);
    parser_string_create_subtree_utf8_null_terminated(f1, "1");
    
    Table* table = parser_table_create(token_rules, nullptr, nullptr, parser_table_utf8_id_to_string);
    Stream* stream = parser_stream_utf8_null_terminated_create("1+1*1");
    Recognizer* recognizer = parser_recognizer_create(table, stream);

    bool running = true;
    TowerNode* node = nullptr;
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);

    // Test it actually parsing a value

    parser_recognizer_destroy(recognizer);
    parser_table_destroy(table);
    parser_stream_destroy(stream);
    tower_node_release_ref(token_rules);
  }
*/

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);
  assert(tower_memory_get_allocated_count() == tower_memory_initial_count);
/*
  // token E = E '+' T;
  // token E = T;
  // token T = T '*' F;
  // token T = F;
  // token F = '(' E ')';
  // token F = '1'
  {
    TowerNode* token_rules = tower_node_create();

    TowerNode* e0 = parser_rule_create_subtree(token_rules, "E", false);
    parser_reference_create_subtree(e0, "E");
    parser_string_create_subtree_utf8_null_terminated(e0, "+");
    parser_reference_create_subtree(e0, "T");

    TowerNode* e1 = parser_rule_create_subtree(token_rules, "E", false);
    parser_reference_create_subtree(e1, "T");

    TowerNode* t0 = parser_rule_create_subtree(token_rules, "T", false);
    parser_reference_create_subtree(t0, "T");
    parser_string_create_subtree_utf8_null_terminated(t0, "*");
    parser_reference_create_subtree(t0, "F");

    TowerNode* t1 = parser_rule_create_subtree(token_rules, "T", false);
    parser_reference_create_subtree(t1, "F");

    TowerNode* f0 = parser_rule_create_subtree(token_rules, "F", false);
    parser_string_create_subtree_utf8_null_terminated(f0, "(");
    parser_reference_create_subtree(f0, "E");
    parser_string_create_subtree_utf8_null_terminated(f0, ")");

    TowerNode* f1 = parser_rule_create_subtree(token_rules, "F", false);
    parser_string_create_subtree_utf8_null_terminated(f1, "1");
    
    Table* table = parser_table_create(token_rules, nullptr, nullptr, parser_table_utf8_id_to_string);
    Stream* stream = parser_stream_utf8_null_terminated_create("1*1+1");
    Recognizer* recognizer = parser_recognizer_create(table, stream);

    bool running = true;
    TowerNode* node = nullptr;
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);

    // Test it actually parsing a value

    parser_recognizer_destroy(recognizer);
    parser_table_destroy(table);
    parser_stream_destroy(stream);
    tower_node_release_ref(token_rules);
  }
  */

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);
  assert(tower_memory_get_allocated_count() == tower_memory_initial_count);


  // Non-SLR grammar
  // token S = L '=' R;
  // token S = R;
  // token L = '*' R;
  // token L = 'i';
  // token R = L;
  {
    TowerNode* token_rules = tower_node_create();

    TowerNode* s0 = parser_rule_create_subtree(token_rules, "S", false);
    parser_reference_create_subtree(s0, "L");
    parser_string_create_subtree_utf8_null_terminated(s0, "=");
    parser_reference_create_subtree(s0, "R");

    TowerNode* s1 = parser_rule_create_subtree(token_rules, "S", false);
    parser_reference_create_subtree(s1, "R");

    TowerNode* l0 = parser_rule_create_subtree(token_rules, "L", false);
    parser_string_create_subtree_utf8_null_terminated(l0, "*");
    parser_reference_create_subtree(l0, "R");

    TowerNode* l1 = parser_rule_create_subtree(token_rules, "L", false);
    parser_string_create_subtree_utf8_null_terminated(l1, "i");

    TowerNode* r0 = parser_rule_create_subtree(token_rules, "R", false);
    parser_reference_create_subtree(r0, "L");

    Table* table = parser_table_create(token_rules, nullptr, nullptr, parser_table_utf8_id_to_string);
    Stream* stream = parser_stream_utf8_null_terminated_create("**i=*i");
    Recognizer* recognizer = parser_recognizer_create(table, stream);

    bool running = true;
    TowerNode* node = nullptr;
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);
    node = parser_recognizer_step(recognizer, &running);

    // Test it actually parsing a value

    parser_recognizer_destroy(recognizer);
    parser_table_destroy(table);
    parser_stream_destroy(stream);
    tower_node_release_ref(token_rules);
  }


  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);
  assert(tower_memory_get_allocated_count() == tower_memory_initial_count);

/*
  // token A = 'a';
  {
    TowerNode* token_rules = tower_node_create();

    TowerNode* rule_node = parser_rule_create_subtree(token_rules, "A", false);
    Rule* rule = (Rule*)tower_node_get_component_userdata(rule_node, parser_rule_get_type());
    assert(rule != nullptr);
    assert(strcmp(parser_rule_get_name(rule), "A") == 0);
    assert(parser_rule_get_generated(rule) == false);

    parser_string_create_subtree_utf8_null_terminated(rule_node, "a");
    
    Table* table = parser_table_create(token_rules, nullptr, nullptr, parser_table_utf8_id_to_string);
    Stream* stream = parser_stream_utf8_null_terminated_create("a");
    //Recognizer* recognizer = parser_recognizer_create(table, stream);

    //TowerNode* parser_recognizer_step(recognizer);

    // Test it actually parsing a value

    tower_node_release_ref(token_rules);
    parser_table_destroy(table);
  }
  */

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);
  assert(tower_memory_get_allocated_count() == tower_memory_initial_count);
}

template <typename T>
T* create_component(TowerNode* owner) {
  TowerComponent* component =
    tower_component_create(owner, T::compiletime_type, sizeof(T), [](TowerComponent* component, uint8_t* userdata) {
      ((T*)userdata)->~T();
    });


  uint8_t* userdata = tower_component_get_userdata(component);
  return new (userdata) T();
}

TowerNode* create_attached_child_without_ref(TowerNode* parent) {
  TowerNode* child = tower_node_create();
  tower_node_attach(child, parent);
  tower_node_release_ref(child);
  return child;
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

TowerNode* parser_rule_create_subtree(
  TowerNode* parent,
  const char* name,
  bool generated) {
  TowerNode* child = create_attached_child_without_ref(parent);
  Rule* component = parser_rule_create(child);
  parser_rule_set_name(component, name);
  parser_rule_set_generated(component, generated);
  return child;
}

struct Reference {
  static TowerNode* compiletime_type;
  std::string name;
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

TowerNode* parser_reference_create_subtree(TowerNode* parent, const char* name) {
  TowerNode* child = create_attached_child_without_ref(parent);
  Reference* component = parser_reference_create(child);
  parser_reference_set_name(component, name);
  return child;
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

void parser_string_set_id(String* component, uint32_t index, uint32_t id) {
  assert(component);
  if (index >= component->ids.size()) {
    size_t new_size = index + 1;
    component->ids.reserve(new_size * 2);
    component->ids.resize(new_size, PARSER_ID_EOF);
  }
  component->ids[index] = id;
}

uint32_t parser_string_get_id(String* component, uint32_t index) {
  assert(component);
  assert(index < component->ids.size());
  return component->ids[index];
}

void parser_string_set_length(String* component, uint32_t length) {
  assert(component);
  component->ids.resize(length, PARSER_ID_EOF);
}

uint32_t parser_string_get_length(String* component) {
  assert(component);
  return component->ids.size();
}

// Returns the amount of bytes that were read (or 0 if it wasn't successful)
uint32_t parser_decode_utf8_codepoint(const char* utf8_begin, const char* utf8_end, uint32_t* codepoint) {
  *codepoint = 0;

  uintptr_t length = utf8_end - utf8_begin;

  // Determine the number of bytes in the UTF-8 character
  if ((utf8_begin[0] & 0x80) == 0) { // 1-byte character (ASCII)
      if (length < 1) {
        return 0;
      }
      *codepoint |= utf8_begin[0];
      return 1;
  } else if ((utf8_begin[0] & 0xE0) == 0xC0) { // 2-byte character
      if (length < 2) {
        return 0;
      }
      *codepoint |= (utf8_begin[0] & 0x1F) << 6;
      *codepoint |= (utf8_begin[1] & 0x3F);
      return 2;
  } else if ((utf8_begin[0] & 0xF0) == 0xE0) { // 3-byte character
      if (length < 3) {
        return 0;
      }
      *codepoint |= (utf8_begin[0] & 0x0F) << 12;
      *codepoint |= (utf8_begin[1] & 0x3F) << 6;
      *codepoint |= (utf8_begin[2] & 0x3F);
      return 3;
  } else if ((utf8_begin[0] & 0xF8) == 0xF0) { // 4-byte character
      if (length < 4) {
        return 0;
      }
      *codepoint |= (utf8_begin[0] & 0x07) << 18;
      *codepoint |= (utf8_begin[1] & 0x3F) << 12;
      *codepoint |= (utf8_begin[2] & 0x3F) << 6;
      *codepoint |= (utf8_begin[3] & 0x3F);
      return 4;
  } else {
    // Unknown character
    return 0;
  }
}

void parser_string_append_utf8_null_terminated(String* component, const char* utf8) {
  const char* utf8_end = utf8 + strlen(utf8);
  return parser_string_append_utf8(component, utf8, utf8_end);
}

void parser_string_append_utf8(String* component, const char* utf8_begin, const char* utf8_end) {
  assert(component);
  
  // This will overshoot allocation if we have unicode characters, but it's alright
  size_t reserved = component->ids.size() + (utf8_end - utf8_begin);
  component->ids.reserve(component->ids.size() + (utf8_end - utf8_begin));

  for (;;) {
    uint32_t codepoint = 0;
    uint32_t bytes_read = parser_decode_utf8_codepoint(utf8_begin, utf8_end, &codepoint);
    if (bytes_read == 0) {
      break;
    }
    utf8_begin += bytes_read;
    assert(utf8_begin <= utf8_end);
    component->ids.push_back(codepoint);
  }
}

TowerNode* parser_string_create_subtree_utf8_null_terminated(TowerNode* parent, const char* utf8) {
  const char* utf8_end = utf8 + strlen(utf8);
  return parser_string_create_subtree_utf8(parent, utf8, utf8_end);
}

TowerNode* parser_string_create_subtree_utf8(TowerNode* parent, const char* utf8_begin, const char* utf8_end) {
  assert(utf8_end >= utf8_begin);
  TowerNode* child = create_attached_child_without_ref(parent);
  assert(child);
  String* component = parser_string_create(child);
  assert(component);
  assert(component->ids.size() == 0);
  parser_string_append_utf8(component, utf8_begin, utf8_end);
  return child;
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

void parser_range_set_start(Range* component, uint32_t start) {
  assert(component);
  component->start = start;
}

uint32_t parser_range_get_start(Range* component) {
  assert(component);
  return component->start;
}

void parser_range_set_end(Range* component, uint32_t end) {
  assert(component);
  component->end = end;
}

uint32_t parser_range_get_end(Range* component) {
  assert(component);
  return component->end;
}

TowerNode* parser_range_create_subtree(TowerNode* parent, uint32_t start, uint32_t end) {
  TowerNode* child = create_attached_child_without_ref(parent);
  Range* component = parser_range_create(child);
  parser_range_set_start(component, start);
  parser_range_set_end(component, end);
  return child;
}

struct Match {
  static TowerNode* compiletime_type;
  uint32_t id = PARSER_ID_EOF;
  uint32_t start = 0;
  uint32_t length = 0;
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

void parser_match_set_start(Match* component, uint32_t start) {
  assert(component);
  component->start = start;
}

uint32_t parser_match_get_start(Match* component) {
  assert(component);
  return component->start;
}

void parser_match_set_length(Match* component, uint32_t length) {
  assert(component);
  component->length = length;
}

uint32_t parser_match_get_length(Match* component) {
  assert(component);
  return component->length;
}

TowerNode* parser_match_create_subtree(TowerNode* parent, uint32_t id, uint32_t start, uint32_t length) {
  TowerNode* child = create_attached_child_without_ref(parent);
  Match* component = parser_match_create(child);
  parser_match_set_id(component, id);
  parser_match_set_start(component, start);
  parser_match_set_length(component, length);
  return child;
}


struct Stream {
  static std::atomic<uint32_t> allocated_count;
  ParserStreamDestructor destructor = nullptr;
  ParserStreamRead read = nullptr;
};
std::atomic<uint32_t> Stream::allocated_count = 0;

Stream* parser_stream_create(uint32_t userdata_bytes, ParserStreamDestructor destructor, ParserStreamRead read) {
  void* memory = tower_memory_allocate(sizeof(Stream) + userdata_bytes);
  ++Stream::allocated_count;
  Stream* stream = new (memory) Stream();
  stream->destructor = destructor;
  stream->read = read;
  return stream;
}

void parser_stream_destroy(Stream* stream) {
  if (stream->destructor) {
    stream->destructor(stream, parser_stream_get_userdata(stream));
  }
  --Stream::allocated_count;
  stream->~Stream();
  tower_memory_free(stream);
}

uint8_t* parser_stream_get_userdata(Stream* stream) {
  if (stream == nullptr) {
    return nullptr;
  }
  return ((uint8_t*)stream) + sizeof(Stream);
}

Stream* parser_stream_from_userdata(uint8_t* userdata) {
  if (userdata == nullptr) {
    return nullptr;
  }
  return (Stream*)(userdata - sizeof(Stream));
}

TowerNode* parser_stream_read(
  Stream* stream,
  uint32_t* id,
  uint32_t* start,
  uint32_t* length
) {
  return stream->read(stream, parser_stream_get_userdata(stream), id, start, length);
}

struct StreamUtf8 {
  std::string data;
  const char* utf8_begin = nullptr;
};

TowerNode* parser_stream_utf8_read(
  Stream* stream,
  uint8_t* userdata,
  uint32_t* id,
  uint32_t* start,
  uint32_t* length
) {
  StreamUtf8* stream_utf8 = (StreamUtf8*)userdata;
  std::string& data = stream_utf8->data;
  const char*& utf8_begin = stream_utf8->utf8_begin;

  uint32_t bytes_read = parser_decode_utf8_codepoint(utf8_begin, data.c_str() + data.size(), id);
  if (bytes_read > 0) {
    *length = bytes_read;
    *start = utf8_begin - data.c_str();
    utf8_begin += bytes_read;
  } else {
    *id = PARSER_ID_EOF;
    *start = PARSER_ID_EOF;
    *length = 0;
  }

  // The utf8 stream does not create tower nodes
  return nullptr;
}

Stream* parser_stream_utf8_null_terminated_create(const char* utf8) {
  const char* utf8_end = utf8 + strlen(utf8);
  return parser_stream_utf8_create(utf8, utf8_end);
}

Stream* parser_stream_utf8_create(const char* utf8_begin, const char* utf8_end) {
  Stream* stream = parser_stream_create(sizeof(StreamUtf8), nullptr, parser_stream_utf8_read);
  uint8_t* userdata = parser_stream_get_userdata(stream);
  StreamUtf8* stream_utf8 = new (userdata) StreamUtf8();
  stream_utf8->data.assign(utf8_begin, utf8_end);
  stream_utf8->utf8_begin = stream_utf8->data.c_str();
  return stream;
}


struct StreamRecognizer {
  Recognizer* recognizer = nullptr;
};

TowerNode* parser_stream_recognizer_read(
  Stream* stream,
  uint8_t* userdata,
  uint32_t* id,
  uint32_t* start,
  uint32_t* length
) {
  StreamRecognizer* stream_recognizer = (StreamRecognizer*)userdata;
  bool running = false;
  TowerNode* node = nullptr;
  do {
    node = parser_recognizer_step(stream_recognizer->recognizer, &running);
  } while (running && !node);

  if (node) {
    Match* match = (Match*)tower_node_get_component_userdata(node, parser_match_get_type());
    assert(match);
    *id = match->id;
    *start = match->start;
    *length = match->length;
    return node;
  }

  *id = PARSER_ID_EOF;
  *start = PARSER_ID_EOF;
  *length = 0;
  return nullptr; 
}

Stream* parser_stream_recognizer_create(Recognizer* recognizer) {
  Stream* stream = parser_stream_create(sizeof(StreamRecognizer), nullptr, parser_stream_recognizer_read);
  uint8_t* userdata = parser_stream_get_userdata(stream);
  StreamRecognizer* stream_recognizer = new (userdata) StreamRecognizer();
  stream_recognizer->recognizer = recognizer;
  return stream;
}

struct GrammarRule;
struct GrammarNonTerminal {
  uint32_t index = TOWER_INVALID_INDEX;
  std::string name;
  // Rules that all share the same non-terminal (productions)
  // Since these pointers are internal to rules, they must be built after (and rules never resized)
  std::vector<GrammarRule*> rules;
};

struct GrammarTerminal {
  // Inclusive start and end to terminals (these will be the same for a single terminal)
  // We guarantee that start is always <= to end
  // If start == PARSER_ID_EOF it indicates end of file ($)
  uint32_t start = PARSER_ID_EOF;
  uint32_t end = PARSER_ID_EOF;

  bool entirely_less(const GrammarTerminal& rhs) const {
    assert(start <= end);
    assert(rhs.start <= rhs.end);
    return end < rhs.start;
  }

  bool operator<(const GrammarTerminal& rhs) const {
    if (start < rhs.start) {
      return true;
    }
    if (rhs.start < start) {
      return false;
    }
    return end < rhs.end;
  }

  bool operator==(const GrammarTerminal& rhs) const {
    return start == rhs.start && end == rhs.end;
  }
};

inline size_t hash_combine(size_t seed, size_t hash) {
  return seed ^ (hash + 0x9e3779b9 + (seed << 6) + (seed >> 2));
}

template <>
struct std::hash<GrammarTerminal> {
  std::size_t operator()(const GrammarTerminal& key) const {
    size_t hash = std::hash<uint32_t>()(key.start);
    return hash_combine(hash, std::hash<uint32_t>()(key.end));
  }
};

struct GrammarSymbol {
  TowerNode* symbol_node = nullptr;

  // Set if this represents a non-terminal (a reference to other rules)
  // If this is set, the start/end are ignored
  GrammarNonTerminal* non_terminal = nullptr;
  GrammarTerminal terminal;

  bool operator<(const GrammarSymbol& rhs) const {
    // Note that our operator does not consider the symbol_node, it is extra information
    if (non_terminal) {
      if (rhs.non_terminal) {
        // Quick case for equals
        if (non_terminal == rhs.non_terminal) {
          return false;
        }

        return non_terminal->name < rhs.non_terminal->name;
      } else {
        // Non-terminals are always < terminals
        return true;
      }
    } else {
      if (rhs.non_terminal) {
        // Terminals are always > non-terminals
        return false;
      } else {
        // Both are non-terminals, compare the ranges
        return terminal < rhs.terminal;
      }
    }
  }
  
  bool operator==(const GrammarSymbol& rhs) const {
    if (non_terminal) {
      // We only need to compare non-terminals
      return non_terminal == rhs.non_terminal;
    } else {
      // If the rhs has a non-terminal, we can't be equal
      if (rhs.non_terminal) {
        return false;
      } else {
        // Both are non-terminals, compare the ranges
        return terminal == rhs.terminal;
      }
    }
  }
};

struct GrammarSymbolRef {
  const GrammarSymbol* symbol = nullptr;

  bool operator<(const GrammarSymbolRef& rhs) const {
    printf("MAKE SURE const GrammarSymbol* LESS CALLED\n");
    return *symbol < *rhs.symbol;
  }
  bool operator==(const GrammarSymbolRef& rhs) const {
    printf("MAKE SURE const GrammarSymbol* EQUALS CALLED\n");
    return *symbol == *rhs.symbol;
  }
};

struct GrammarRule {
  size_t index = (size_t)-1;
  Rule* rule = nullptr;
  GrammarNonTerminal* non_terminal = nullptr;
  std::vector<GrammarSymbol> symbols;
};

struct Grammar {
  // The first non-terminal is the starting non-terminal S'
  std::vector<GrammarNonTerminal> non_terminals;
  // The first rule is the starting rule S'
  std::vector<GrammarRule> rules;

  uint8_t* userdata = nullptr;
  ParserTableIdToString to_string = nullptr;
};

void parser_grammar_create(Grammar& grammar, TowerNode* root, uint8_t* userdata, ParserTableResolveReference resolve) {
  std::vector<Rule*> rules;
  rules.reserve(tower_node_get_child_count(root));

  // Walk all the rules we have
  for (uint32_t p = 0;; ++p) {
    TowerNode* rule_node = tower_node_get_child(root, p);
    if (!rule_node) {
      break;
    }
    
    Rule* rule = (Rule*)tower_node_get_component_userdata(rule_node, parser_rule_get_type());
    assert(rule);
    
    rules.push_back(rule);
  }

  // WARNING: This is required as we MUST ensure that grammar.rules
  // does not reallocate (we store direct pointers into the array)
  // This is an overestimation / worst case every rule has a unique non terminal
  std::unordered_map<std::string, GrammarNonTerminal*> non_terminals;
  size_t rule_count_with_start = rules.size() + 1;
  grammar.rules.reserve(rule_count_with_start);
  non_terminals.reserve(rule_count_with_start);
  grammar.non_terminals.reserve(rule_count_with_start);

  // Reserve a spot for the starting rule at index 0 (has no associated Rule*)
  GrammarRule& starting_rule = grammar.rules.emplace_back();
  GrammarNonTerminal& starting_non_terminal = grammar.non_terminals.emplace_back();
  starting_non_terminal.rules.push_back(&starting_rule);
  starting_non_terminal.name = "S'";
  starting_non_terminal.index = 0;
  starting_rule.index = 0;
  starting_rule.non_terminal = &starting_non_terminal;

  // Now build our grammar rules and map from the sorted rules above
  for (uint32_t i = 0; i < rules.size(); ++i) {
    Rule* rule = rules[i];

    size_t grammar_rule_index = grammar.rules.size();
    GrammarRule& grammar_rule = grammar.rules.emplace_back();
    grammar_rule.rule = rule;
    grammar_rule.index = grammar_rule_index;

    GrammarNonTerminal*& non_terminal = non_terminals[rule->name];
    // If this is the first time we're seeing this name, create a new non-terminal for it and set the name
    if (non_terminal == nullptr) {
      size_t index = grammar.non_terminals.size();
      non_terminal = &grammar.non_terminals.emplace_back();
      non_terminal->name = rule->name;
      non_terminal->index = index;
    }
    grammar_rule.non_terminal = non_terminal;
    non_terminal->rules.push_back(&grammar_rule);
  }

  // As long as we have a non-terminal that isn't the starting rule
  if (grammar.non_terminals.size() > 1) {
    GrammarSymbol& symbol = starting_rule.symbols.emplace_back();
    symbol.non_terminal = &grammar.non_terminals[1];
  }

  // Walk through the rules in sorted order (skipping the starting rule 0)
  // Now we can map all rule names/references
  for (uint32_t r = 1; r < grammar.rules.size(); ++r) {
    GrammarRule& grammar_rule = grammar.rules[r];
    TowerNode* rule_node = tower_component_get_owner(tower_component_from_userdata((uint8_t*) grammar_rule.rule));
    
    // Assume we will have at least as many grammar symbols as we have children
    // Note that strings often contain many grammar symbols packed in a single component
    std::vector<GrammarSymbol>& symbols = grammar_rule.symbols;
    symbols.reserve(tower_node_get_child_count(rule_node));

    // Walk over all the grammar symbols
    for (uint32_t g = 0;; ++g) {
      TowerNode* symbol_node = tower_node_get_child(rule_node, g);
      if (!symbol_node) {
        break;
      }

      // TODO(trevor): Add the concept of component interfaces, and in this case we register a base type
      // for grammar symbols (so that we can only have one, and fetching it is quick)
      // kind of throws a wrench in has or add...

      Reference* reference = (Reference*)tower_node_get_component_userdata(symbol_node, parser_reference_get_type());
      if (reference) {
        // First we look internally to see if have satisfied a name
        auto it = non_terminals.find(reference->name);
        if (it != non_terminals.end()) {
          GrammarSymbol& symbol = symbols.emplace_back();
          symbol.non_terminal = it->second;
          symbol.symbol_node = symbol_node;
        } else {
          uint32_t id = PARSER_ID_EOF;
          // Otherwise, this might be a reference to a terminal
          if (resolve) {
            id = resolve(userdata, reference->name.c_str());
          }

          if (id == PARSER_ID_EOF) {
            assert(false && "unable to resolve rule by name");
          } else {
            GrammarSymbol& symbol = symbols.emplace_back();
            symbol.symbol_node = symbol_node;
            symbol.terminal.start = id;
            symbol.terminal.end = id;
          }
        }
      }

      String* string = (String*)tower_node_get_component_userdata(symbol_node, parser_string_get_type());
      if (string) {
        symbols.reserve(symbols.size() + string->ids.size());
        for (uint32_t id : string->ids) {
          GrammarSymbol& symbol = symbols.emplace_back();
          symbol.symbol_node = symbol_node;
          symbol.terminal.start = id;
          symbol.terminal.end = id;
        }
      }

      Range* range = (Range*)tower_node_get_component_userdata(symbol_node, parser_range_get_type());
      if (range) {
        GrammarSymbol& symbol = symbols.emplace_back();
        symbol.symbol_node = symbol_node;
        if (range->start < range->end) {
          symbol.terminal.start = range->start;
          symbol.terminal.end = range->end;
        } else {
          symbol.terminal.start = range->end;
          symbol.terminal.end = range->start;
        }
      }
    }
  }
}

template <typename T>
struct SortedVector : std::vector<T> {
  using std::vector<T>::vector;

  bool insert(const T& item) {
    auto result = std::lower_bound(this->begin(), this->end(), item);
    // As long as we didn't find the same item
    if (result == this->end() || !(*result == item)) {
      std::vector<T>::insert(result, item);
      return true;
    }
    return false;
  }

  template <typename I>
  bool insert(I begin, const I& end) {
    bool any_inserted = false;
    while (begin != end) {
      if (insert(*begin)) {
        any_inserted = true;
      }
      ++begin;
    }
    return any_inserted;
  }
};

template <typename T>
struct std::hash<SortedVector<T>> {
  std::size_t operator()(const SortedVector<T>& set) const {
    size_t hash = 0;
    // We only need to hash the kernels
    for (const auto& item : set) {
      hash = hash_combine(hash, std::hash<T>()(item));
    }
    return hash;
  }
};

struct GrammarSets {
  // Sized exactly to the size of the the Grammar's non_terminals
  std::vector<SortedVector<GrammarTerminal>> first;
  std::vector<bool> nullable;
};

void parser_table_compute_grammar_sets(const Grammar& grammar, GrammarSets& sets) {
  sets.first.resize(grammar.non_terminals.size());
  sets.nullable.resize(grammar.non_terminals.size());

  bool has_changed = false;
  do {
    has_changed = false;

    for (const auto& rule : grammar.rules) {      
      // X = Y1 Y2 Y3...
      auto rule_non_terminal_index = rule.non_terminal->index;
      auto& rule_first_set = sets.first[rule_non_terminal_index];

      // This also handles the case where X = 
      bool is_all_nullable = true;

      // Loop until we find a non-nullable symbol
      for (const auto& symbol : rule.symbols) {
        if (symbol.non_terminal) {
          auto symbol_non_terminal_index = symbol.non_terminal->index;
          auto& symbol_first_set = sets.first[symbol_non_terminal_index];

          // Everything in FIRST(Yn) is in FIRST(X) except epsilon (but we use nullable for epsilon)
          if (rule_first_set.insert(symbol_first_set.begin(), symbol_first_set.end())) {
            has_changed = true;
          }

          // If this non-terminal is not known to be nullable, then 
          if (!sets.nullable[symbol_non_terminal_index]) {
            is_all_nullable = false;
            break;
          }
        } else {
          // FIRST(terminal) = {terminal}
          if (rule_first_set.insert(symbol.terminal)) {
            has_changed = true;
          }

          // We know terminals are are not nullable so we're done
          is_all_nullable = false;
          break;
        }
      }

      // If everything was nullable
      if (is_all_nullable && !sets.nullable[rule_non_terminal_index]) {
        sets.nullable[rule_non_terminal_index] = true;
        has_changed = true;
      }
    }
  } while(has_changed);
}

struct LR0Item {
  uint32_t rule_index = TOWER_INVALID_INDEX;
  uint32_t symbol_index = TOWER_INVALID_INDEX;

  // Note that GrammarTerminal is only passed here for compatability with the LR1Item constructor
  inline LR0Item(uint32_t rule_index, uint32_t symbol_index, const GrammarTerminal* lookahead) :
    LR0Item(rule_index, symbol_index) {
  }
  LR0Item(uint32_t rule_index_, uint32_t symbol_index_) :
    rule_index(rule_index_),
    symbol_index(symbol_index_) {
  }

  // Note: We use std::set<LR0Item> so that we have a deterministic order
  bool operator<(const LR0Item& rhs) const {
    // Sort by rules next so the first rules come first
    if (rule_index < rhs.rule_index) {
      return true;
    }
    if (rhs.rule_index < rule_index) {
      return false;
    }

    // Finally, sort by symbol index
    return symbol_index < rhs.symbol_index;
  }

  bool operator==(const LR0Item& rhs) const {
    return rule_index == rhs.rule_index && symbol_index == rhs.symbol_index;
  }
};

template <>
struct std::hash<LR0Item> {
  std::size_t operator()(const LR0Item& key) const {
    size_t hash = std::hash<uint32_t>()(key.rule_index);
    return hash_combine(hash, std::hash<uint32_t>()(key.symbol_index));
  }
};

struct LR1Item : LR0Item {
  GrammarTerminal lookahead;

  inline LR1Item(uint32_t rule_index, uint32_t symbol_index, const GrammarTerminal* lookahead) :
    LR0Item(rule_index, symbol_index),
    lookahead(*lookahead) {
  }
  LR1Item(const LR0Item& lr0_item, const GrammarTerminal* lookahead) :
    LR0Item(lr0_item),
    lookahead(*lookahead) {
  }

  // Note: We use std::set<LR1Item> so that we have a deterministic order
  bool operator<(const LR1Item& rhs) const {
    const LR0Item& lhs_lr0 = *this;
    const LR0Item& rhs_lr0 = rhs;
    if (lhs_lr0 < rhs_lr0) {
      return true;
    }
    if (rhs_lr0 < lhs_lr0) {
      return false;
    }
    return lookahead < rhs.lookahead;
  }

  bool operator==(const LR1Item& rhs) const {
    const LR0Item& lhs_lr0 = *this;
    const LR0Item& rhs_lr0 = rhs;
    return lhs_lr0 == rhs_lr0 && lookahead == rhs.lookahead;
  }
};

bool parser_table_is_kernel_item(const Grammar& grammar, const LR0Item& item) {
  // A kernel item is an item whose dots are not at
  // the left side (0) or the initial item (0, 0)
  if (item.symbol_index != 0) {
    return true;
  } else if (item.rule_index == 0) {
    return true;
  }

  // Special case for empty productions, since the dot is always at the end
  const GrammarRule& rule = grammar.rules[item.rule_index];
  if (rule.symbols.size() == 0) {
    return true;
  }
  return false;
}

void debug_append_id(uint32_t id, std::stringstream& stream, const Grammar& grammar) {
  switch (id) {
    case PARSER_ID_EOF:
    stream << '$';
    return;
    case PARSER_ID_LOOKAHEAD:
    stream << '#';
    return;
  }

  char* str = nullptr;
  if (grammar.to_string) {
    str = grammar.to_string(grammar.userdata, id);
  }

  if (str) {
    stream << str;
    tower_memory_free((void*)str);
  } else {
    stream << id;
  }
};

std::string debug_str(uint32_t id, const Grammar& grammar) {
  std::stringstream stream;
  debug_append_id(id, stream, grammar);
  return stream.str();
}

std::string debug_str(const GrammarTerminal& terminal, const Grammar& grammar) {
  std::stringstream stream;
  if (terminal.start == terminal.end) {
    debug_append_id(terminal.start, stream, grammar);
  } else {
    stream << '[';
    debug_append_id(terminal.start, stream, grammar);
    stream << '-';
    debug_append_id(terminal.end, stream, grammar);
    stream << ']';
  }
  return stream.str();
}

std::string debug_str(const GrammarSymbol& symbol, const Grammar& grammar) {
  if (symbol.non_terminal) {
    return symbol.non_terminal->name;
  } else {
    return debug_str(symbol.terminal, grammar);
  }
}

std::string debug_str(const LR0Item& item, const Grammar& grammar) {
  std::stringstream stream;
  
  const GrammarRule& grammar_rule = grammar.rules[item.rule_index];
  stream << grammar_rule.non_terminal->name << " =";

  for (size_t g = 0; g <= grammar_rule.symbols.size(); ++g) {
    stream << ' ';
    if (g == item.symbol_index) {
      stream << "•";
    }

    if (g == grammar_rule.symbols.size()) {
      break;
    }

    const GrammarSymbol& symbol = grammar_rule.symbols[g];
    stream << debug_str(symbol, grammar);
  }

  return stream.str();
}

std::string debug_str(const GrammarRule& rule, const Grammar& grammar) {
  LR0Item lr0_print_item(rule.index, TOWER_INVALID_INDEX);
  return debug_str(lr0_print_item, grammar);
}

std::string debug_str(const GrammarNonTerminal& non_terminal, const Grammar& grammar) {
  std::stringstream stream;
  stream << "non_terminal(" << non_terminal.index << ", " << non_terminal.name << ")\n";
  for (const auto& rule : non_terminal.rules) {
    stream << "  " << debug_str(*rule, grammar) << "\n";
  }
  return stream.str();
}

std::string debug_str(const Grammar& grammar) {
  std::stringstream stream;
  for (const auto& rule : grammar.rules) {
    stream << debug_str(rule, grammar) << "\n";
  }
  for (const auto& non_terminal : grammar.non_terminals) {
    stream << debug_str(non_terminal, grammar);
  }
  return stream.str();
}

std::string debug_str(const LR1Item& item, const Grammar& grammar) {
  std::stringstream stream;
  stream << '[';
  stream << debug_str(static_cast<const LR0Item&>(item), grammar);
  stream << ", ";
  stream << debug_str(item.lookahead, grammar);
  stream << ']';
  return stream.str();
}

const GrammarSymbol* parser_table_get_grammar_symbol_or_null(const Grammar& grammar, const LR0Item& item) {
  // Find the next grammar symbol after the dot
  const GrammarRule& grammar_rule = grammar.rules[item.rule_index];

  // This item may have the dot after all symbols (an accepting/reduce production)
  // Also allow it to past for getting the FIRST of the symbol after the end in LALR parsers
  if (item.symbol_index >= grammar_rule.symbols.size()) {
    return nullptr;
  }
  return &grammar_rule.symbols[item.symbol_index];
}

// These items are always insertion sorted and lexographically comparable
template <typename LRItem>
struct LRSet {
  // All of these vectors are sorted with custom comparison operators
  SortedVector<LRItem> kernels;
  SortedVector<LRItem> nonkernels;
  SortedVector<GrammarSymbolRef> symbols;

  bool insert(const Grammar& grammar, const LRItem& item) {
    SortedVector<LRItem>& items = parser_table_is_kernel_item(grammar, item)
      ? kernels
      : nonkernels;

    bool inserted = items.insert(item);
    if (inserted) {
      // Lookup the symbol for this item and add it to our sorted list of symbols
      // Note that this symbol may already exist, but this item may have just been inserted
      // (for example two items with a dot before a the same non-terminal)
      const GrammarSymbol* symbol = parser_table_get_grammar_symbol_or_null(grammar, item);
      if (symbol) {
        symbols.insert(GrammarSymbolRef{ .symbol = symbol });
      }
    }
    return inserted;
  }

  // Equalty only needs to compare kernels to see if two sets are fundamentally
  // the same as all non-kernel items can be built from kernel items
  bool operator==(const LRSet& rhs) const {
    return this->kernels == rhs.kernels;
  }

  bool empty() {
    return kernels.empty() && nonkernels.empty();
  }

  struct Iterator {
    const LRSet<LRItem>* set = nullptr;
    size_t index = 0;

    Iterator& operator++() {
      ++index;
      return *this;
    }
    const LRItem& operator*() const {
      return index < set->kernels.size()
        ? set->kernels[index]
        : set->nonkernels[index - set->kernels.size()];
    }
    bool operator!=(const Iterator& other) const {
      return index != other.index;
    }
  };

  // Always start with kernel items first
  Iterator begin() const {
    return Iterator {
      .set = this,
      .index = 0,
    };
  }
  Iterator end() const {
    return Iterator {
      .set = this,
      .index = kernels.size() + nonkernels.size(),
    };
  }
};

template <>
struct std::hash<LRSet<LR0Item>> {
  std::size_t operator()(const LRSet<LR0Item>& set) const {
    return std::hash<SortedVector<LR0Item>>()(set.kernels);
  }
};

template <>
struct std::hash<const LRSet<LR0Item>*> {
  std::size_t operator()(const LRSet<LR0Item>* set) const {
    printf("MAKE SURE const LRSet<LR0Item>* HASH CALLED\n");
    return std::hash<LRSet<LR0Item>>()(*set);
  }
};

template <>
struct std::equal_to<const LRSet<LR0Item>*> {
  bool operator()(const LRSet<LR0Item>* lhs, const LRSet<LR0Item>* rhs) const {
    printf("MAKE SURE const LRSet<LR0Item>* EQUALS CALLED\n");
    return *lhs == *rhs;
  }
};

template <typename LRItem>
std::string debug_str(const LRSet<LRItem>& items, const Grammar& grammar) {
  std::stringstream stream;
  stream << "==========\n";
  for (const auto& item : items) {
    stream << debug_str(item, grammar) << "\n";
  }
  stream << "----------";
  return stream.str();
}

struct StateBuilderEdge {
  GrammarTerminal terminal;
  // If this is a valid pointer, then this will be considered a reduction, otherwise shift
  const GrammarRule* reduce_rule = nullptr;
  size_t shift_state_index = (size_t)-1;

  bool operator<(const StateBuilderEdge& rhs) const {
    if (terminal < rhs.terminal) {
      return true;
    }
    if (rhs.terminal < terminal) {
      return false;
    }
    if (shift_state_index < rhs.shift_state_index) {
      return true;
    }
    if (rhs.shift_state_index < shift_state_index) {
      return false;
    }
    size_t lhs_rule_index =     reduce_rule ? reduce_rule->index : (size_t)-1;
    size_t rhs_rule_index = rhs.reduce_rule ? reduce_rule->index : (size_t)-1;
    return lhs_rule_index < rhs_rule_index;
  }

  bool operator==(const StateBuilderEdge& rhs) const {
    return
      terminal == rhs.terminal &&
      shift_state_index == rhs.shift_state_index &&
      reduce_rule == rhs.reduce_rule;
  }
};

template <>
struct std::hash<StateBuilderEdge> {
  std::size_t operator()(const StateBuilderEdge& edge) const {
    printf("MAKE SURE StateBuilderEdge HASH CALLED\n");
    size_t hash = std::hash<GrammarTerminal>()(edge.terminal);
    hash = hash_combine(hash, std::hash<size_t>()(edge.shift_state_index));
    if (edge.reduce_rule) {
      hash = hash_combine(hash, std::hash<size_t>()(edge.reduce_rule->index));
    }
    return hash;
  }
};

struct StateBuilderGotoAfterReduction {
  const GrammarNonTerminal* non_terminal = nullptr;
  size_t shift_state_index = (size_t)-1;
};

struct StateBuilder {
  size_t state_index = (size_t)-1;
  // No terminal range should ever overlap with these edges
  SortedVector<StateBuilderEdge> edges;
  // There shouldn never be a reduction upon the same grammar symbol
  // This is effectively GOTO[state, rule] in the dragon book
  std::vector<StateBuilderGotoAfterReduction> gotos_after_reduction;

  // These items are always insertion sorted and lexographically comparable
  LRSet<LR0Item> items;

  // This is useful for debug printing and tracking back to the source
  const GrammarSymbol* symbol = nullptr;
};

template <>
struct std::hash<const SortedVector<StateBuilderEdge>*> {
  std::size_t operator()(const SortedVector<StateBuilderEdge>* set) const {
    printf("MAKE SURE const SortedVector<StateBuilderEdge>* HASH CALLED\n");
    return std::hash<SortedVector<StateBuilderEdge>>()(*set);
  }
};

template <>
struct std::equal_to<const SortedVector<StateBuilderEdge>*> {
  bool operator()(const SortedVector<StateBuilderEdge>* lhs, const SortedVector<StateBuilderEdge>* rhs) const {
    printf("MAKE SURE const SortedVector<StateBuilderEdge>* EQUALS CALLED\n");
    return *lhs == *rhs;
  }
};

struct TableBuilder {
  std::vector<std::unique_ptr<StateBuilder>> states;

  // These should only be inserted once the LR item vector is completed
  // Note that this only compares kernels
  std::unordered_map<const LRSet<LR0Item>*, size_t> item_sets_to_state_index;

  // How many kernel lr items we have in total, used for reserving memory
  size_t total_kernel_lr_items = 0;
};

// For compatability with LR1Items
inline const GrammarTerminal* parser_table_get_lookahead(const LR0Item&) {
  return nullptr;
}
inline const GrammarTerminal* parser_table_get_lookahead(const LR1Item& item) {
  return &item.lookahead;
}

template <typename LRItem>
void parser_table_closure(const Grammar& grammar, const GrammarSets* sets_for_lr1, LRSet<LRItem>& items) {
  // Note: This should closely match the LR0 version
  std::vector<LRItem> unprocessed;
  unprocessed.reserve(items.kernels.size() + items.nonkernels.size());
  unprocessed.insert(unprocessed.end(), items.kernels.begin(), items.kernels.end());
  unprocessed.insert(unprocessed.end(), items.nonkernels.begin(), items.nonkernels.end());
  
  while (!unprocessed.empty()) {
    // [A = α.Bβ, a] in dragon book
    LRItem item = unprocessed.back();
    unprocessed.pop_back();
    
    // For each item in the closure, find the next grammar symbol after the dot or null at the end (B in the dragon book)
    const GrammarSymbol* symbol = parser_table_get_grammar_symbol_or_null(grammar, item);

    // β might be a non-terminal with epsilon     FIRST(βa) = {x, y..., a}    (uses first_set + first_terminal)
    // β might be a non-terminal with no epsilon  FIRST(βa) = {x, y...}       (uses first_set)
    // β might be a terminal                      FIRST(βa) = {β}             (uses first_terminal)
    // β might be null (end of production)        FIRST(βa) = {a}             (uses first_terminal)
    const SortedVector<GrammarTerminal>* first_set = nullptr;
    const GrammarTerminal* first_terminal = nullptr;

    // We only need to examine FIRST for the lookaheads of LR1 items
    if (sets_for_lr1) {
      // Also find the grammar symbol after (β in the dragon book)
      const GrammarSymbol* after = parser_table_get_grammar_symbol_or_null(grammar, LR0Item(
        item.rule_index,
        item.symbol_index + 1
      ));

      // Do we have β?
      if (after) {
        // Is β a non-terminal?
        if (after->non_terminal) {
          // At this point we know no matter what we're going to use FIRST(β) terminals
          first_set = &sets_for_lr1->first[after->non_terminal->index];

          // If β contain epsilon then we also need to inlude the lookahead (if not then FIRST(βa) = FIRST(β))
          if (sets_for_lr1->nullable[after->non_terminal->index]) {
            first_terminal = parser_table_get_lookahead(item);
          }
        } else {
          // β is be a terminal, easy case FIRST(βa) = {β}
          first_terminal = &after->terminal;
        }
      } else {
        // We're at the end of the production and there is no β, so FIRST(βa) = FIRST(a) = {a}
        // Conceptually, we would have to know the FOLLOW of the production then since there is no FIRST after
        // However, the LR1 item contains 'a' the lookahead passed down to us from our parent rule caller
        // So we do not need FOLLOW here because 'a' essentially is the FOLLOW
        first_terminal = parser_table_get_lookahead(item);
      }
    }

    // We only care if the grammar symbol is a reference (another rule to expand)
    if (symbol && symbol->non_terminal) {
      for (GrammarRule* rule : symbol->non_terminal->rules) {
        auto add_item = [&](const GrammarTerminal* terminal_or_null) {
          LRItem nonkernel_item(rule->index, 0, terminal_or_null);

          // Attempt to insert it and if it's the first time it's been inserted, we need to process it
          if (terminal_or_null) {
            printf("adding terminal: %d\n", (int)terminal_or_null->start);
          }
          if (items.insert(grammar, nonkernel_item)) {
            printf("added\n");
            unprocessed.push_back(nonkernel_item);
          } else {
            printf("did not add\n");
          }
        };

        // If this is LR1, we need to walk all the terminals in the FIRST(βa) set and add new items for each lookahead
        if (sets_for_lr1) {
          printf("first_set %p first_terminal %p\n", first_set, first_terminal); 
          // Add new LR1 items with lookahead for
          if (first_set) {
            for (const GrammarTerminal& terminal : *first_set) {
              add_item(&terminal);
            }
          }
          if (first_terminal) {
            printf("terminal: %d\n", (int)first_terminal->start);
            add_item(first_terminal);
          }
        } else {
          // Otherwise, this is LR0 and we only need to add a single item with no lookahead
          add_item(nullptr);
        }
      }
    }
  }
}

template <typename LRItem>
LRSet<LRItem> parser_table_goto(
  const Grammar& grammar,
  const GrammarSets* sets, // GrammarSets may be null for lr0 (passed only to make this generic/templated)
  const LRSet<LRItem>& items,
  const GrammarSymbol& goto_symbol
) {
  LRSet<LRItem> result;
  for (const LRItem& item : items) {
    const GrammarSymbol* symbol = parser_table_get_grammar_symbol_or_null(grammar, item);
  
    // If they're the same non-terminal, or both null / terminals
    if (symbol && symbol->non_terminal == goto_symbol.non_terminal) {
      LRItem next_item = item;
      ++next_item.symbol_index;

      // Non-terminals or terminals?
      if (symbol->non_terminal) {
        result.insert(grammar, next_item);
      } else {
        // TODO(trevor): Optimize this, right now the query goto_symbol must always be a single value, not a range
        // I believe instead of passing in every single character value we can break up the ranges, but I really need to
        // sit down and figure that one out. To move on for now, I'm just going to do it character by character
        printf("%d - %d\n", goto_symbol.terminal.start, goto_symbol.terminal.end);
        assert(goto_symbol.terminal.start == goto_symbol.terminal.end);

        if (goto_symbol.terminal.start >= symbol->terminal.start && goto_symbol.terminal.start <= symbol->terminal.end) {
          result.insert(grammar, next_item);
        }
      }
    }
  }
  parser_table_closure(grammar, sets, result);
  return result;
}

struct State;
struct StateEdge {
  const State* shift_state = nullptr;
  const GrammarRule* reduce_rule = nullptr;
  // TODO(trevor): Error edges / recovery
};

struct StateEdgeRange {
  GrammarTerminal range;
  StateEdge edge;

  // Used to binary search ids in a sorted vector of ranges (lower_bound)
  bool operator<(uint32_t id) const {
    if (range.end < id) {
      return true;
    }
    return false;
  }
};

struct StateTransitions {
  // These edges are sorted by the start symbol so that you can use binary search to find
  // There will never be any overlap in edges with ranges
  std::vector<StateEdgeRange> range_edges;
  // For non-ranges we can use a more optimal hash map to directly move to an edge
  std::unordered_map<uint32_t, StateEdge> direct_edges;
};

struct State {
  // This is a pointer because there are many states
  // that share the same exact set of transitions
  // This is effectively ACTION[state, terminal] in the dragon book
  const StateTransitions* transitions = nullptr;

  // We never need to share these as there will never be a goto that has the same state within it
  // This is effectively GOTO[state, rule] in the dragon book
  std::unordered_map<const GrammarNonTerminal*, const State*> gotos_after_reduction;

  // This is useful for debug printing and tracking back to the source
  const GrammarSymbol* symbol = nullptr;
};

struct Table {
  static std::atomic<uint32_t> allocated_count;

  Grammar grammar;
  std::vector<State> states;
  std::vector<StateTransitions> shared_transitions;
};
std::atomic<uint32_t> Table::allocated_count = 0;


std::string debug_str_header(const State& state, const Table& table, const char* prefix = "state") {
  std::stringstream stream;
  size_t state_index = &state - table.states.data();
  stream << prefix << "(" << state_index;
  if (state.symbol) {
    stream << ", " << debug_str(*state.symbol, table.grammar);
  }
  stream << ")";
  return stream.str();
}

// Only call this on edges/states that have been compacted withing the table
std::string debug_str(const StateEdge& edge, const Table& table) {
  std::stringstream stream;
  if (edge.reduce_rule) {
    LR0Item reduce(
      edge.reduce_rule->index,
      edge.reduce_rule->symbols.size()
    );
    stream << "reduce(" << reduce.rule_index << ", " << debug_str(reduce, table.grammar) << ")";
  } else {
    assert(edge.shift_state);
    assert(!edge.reduce_rule);
    stream << debug_str_header(*edge.shift_state, table, "shift");
  }
  return stream.str();
}

// Only call this on transitions that have been compacted withing the table
std::string debug_str(const StateTransitions& transitions, const Table& table) {
  std::stringstream stream;
  for (const auto& edge : transitions.direct_edges) {
    stream << "  edge(";
    debug_append_id(edge.first, stream, table.grammar);
    stream << ", " << debug_str(edge.second, table) << ")\n";
  }
  for (const auto& edge : transitions.range_edges) {
    stream << "  edge(";
    stream << debug_str(edge.range, table.grammar);
    stream << ", " << debug_str(edge.edge, table) << ")\n";
  }
  return stream.str();
}

// Only call this on states that have been compacted withing the table
std::string debug_str(const State& state, const Table& table) {
  std::stringstream stream;

  stream << debug_str_header(state, table);
  stream << ":\n";
  stream << debug_str(*state.transitions, table);
  
  for (const auto& goto_reduction : state.gotos_after_reduction) {
    stream << "  goto(" << goto_reduction.first->name;
    stream << ", " << debug_str_header(*goto_reduction.second, table) << ")\n";
  }

  return stream.str();
}

std::string debug_str(const Table& table) {
  std::stringstream stream;

  stream << "~~~~~~~~~~\n";
  for (const auto& state : table.states) {
    stream << debug_str(state, table) << "\n";
  }

  stream << "..........\n";
  return stream.str();
}

void parser_table_lr0_items(TableBuilder& table_builder, const Grammar& grammar) {
  std::vector<StateBuilder*> unprocessed;

  // Rough guess on the number of states
  table_builder.states.reserve(grammar.rules.size()); // C in dragon book
  table_builder.item_sets_to_state_index.reserve(grammar.rules.size());
  unprocessed.reserve(grammar.rules.size());

  // Build the starting state
  {
    table_builder.states.push_back(std::make_unique<StateBuilder>());
    StateBuilder& starting = *table_builder.states.back().get();
    starting.state_index = 0;
    starting.items.insert(grammar, LR0Item{0, 0});
    parser_table_closure(grammar, nullptr, starting.items);
    unprocessed.push_back(&starting);
  }

  const auto find_or_add_state = [&](const LRSet<LR0Item>& set, const GrammarSymbol* symbol) -> StateBuilder& {
    auto result = table_builder.item_sets_to_state_index.find(&set);
    if (result != table_builder.item_sets_to_state_index.end()) {
      return *table_builder.states[result->second].get();
    }

    size_t state_index = table_builder.states.size();
    table_builder.states.push_back(std::make_unique<StateBuilder>());
    StateBuilder& builder = *table_builder.states.back().get();
    builder.state_index = state_index;
    builder.items = std::move(set);
    builder.symbol = symbol;
    unprocessed.push_back(&builder);
    table_builder.item_sets_to_state_index.insert(std::pair<const LRSet<LR0Item>*, size_t>(&builder.items, state_index));
    table_builder.total_kernel_lr_items += set.kernels.size();
    printf("added state\n");
    return builder;
  };

  while (!unprocessed.empty()) {
    assert(table_builder.states.size() < 50);

    StateBuilder& state_builder = *unprocessed.back(); // I in dragon book;
    unprocessed.pop_back();
    
    printf("state %s\n", debug_str(state_builder.items, grammar).c_str());
    // X in dragon book
    // This is potentially unsafe because we resize the number of states as we add more
    // However, upon resizing each element is moved, and since we don't use any custom allocators
    // then the moved memory should be unchanged (pointers and iterators to it should be valid, but not guaranteed by std)
    // https://stackoverflow.com/questions/11021764/does-moving-a-vector-invalidate-iterators
    for (GrammarSymbolRef symbol_ref : state_builder.items.symbols) {
      const GrammarSymbol* symbol = symbol_ref.symbol;
      printf("capacity %d size %d\n", (int)table_builder.states.capacity(), (int)table_builder.states.size());
      printf("from state %s\n", debug_str(state_builder.items, grammar).c_str());
      printf("symbol %s\n", debug_str(*symbol, grammar).c_str());
      LRSet<LR0Item> gotos = parser_table_goto(grammar, nullptr, state_builder.items, *symbol);
      printf("gotos %s\n", debug_str(gotos, grammar).c_str());
      // Our gotos should never be empty since we only query with symbols that are valid
      assert(!gotos.empty());
      
      StateBuilder& next_state = find_or_add_state(gotos, symbol);

      if (symbol->non_terminal) {
        StateBuilderGotoAfterReduction& goto_after_reductions = state_builder.gotos_after_reduction.emplace_back();
        goto_after_reductions.non_terminal = symbol->non_terminal;
        goto_after_reductions.shift_state_index = next_state.state_index;
      } else {
        StateBuilderEdge edge {
          .terminal = symbol->terminal,
          .shift_state_index = next_state.state_index,
        };
        
        bool inserted = state_builder.edges.insert(edge);
        assert(inserted); // We should never have collisions
      }
    }
  }
}

std::string debug_str(const GrammarSets& sets, const Grammar& grammar) {
  std::stringstream stream;

  stream << "++++++++++\n";
  for (size_t i = 0; i < grammar.non_terminals.size(); ++i) {
    stream << "FIRST(" << grammar.non_terminals[i].name << ") = {";

    auto& first = sets.first[i];
    for (const auto& terminal : first) {
      stream << ' ' << debug_str(terminal, grammar);
    }

    if (sets.nullable[i]) {
      stream << " ε";
    }

    stream << " }\n";
  }

  stream << "----------";
  return stream.str();
}

struct LR0ItemInKernelState : LR0Item {
  size_t state_index = 0;

  LR0ItemInKernelState(const LR0Item& lr0_item, size_t state_index_) :
    LR0Item(lr0_item),
    state_index(state_index_) {
  }

  bool operator==(const LR0ItemInKernelState& rhs) const {
    const LR0Item& lhs_lr0 = *this;
    const LR0Item& rhs_lr0 = rhs;
    return lhs_lr0 == rhs_lr0 && state_index == rhs.state_index;
  }
};

template <>
struct std::hash<LR0ItemInKernelState> {
  std::size_t operator()(const LR0ItemInKernelState& key) const {
    size_t hash = std::hash<LR0Item>()(key);
    return hash_combine(hash, std::hash<size_t>()(key.state_index));
  }
};

LRSet<LR0Item> parser_table_lr0_from_lr1_kernels(const LRSet<LR1Item>& items) {
  // Note that we cannot just assign kernels from LRSet<LR1Item> to LRSet<LR0Item>
  // because the LRSet<LR1Item> may have the same LR0Item in it multiple times with different lookaheads
  // Assigning directly from LR1 kernels would cause a potential duplicate LR0 item
  LRSet<LR0Item> result;
  result.kernels.reserve(items.kernels.size());

  // Since we know the LR1 items are sorted (first by LR0 item and then by lookahead)
  // then we know that duplicate LR0 items will be next to each other
  // Note that last_inserted_item is initialized to an invalid default (will never be ==)
  LR0Item last_inserted_item(TOWER_INVALID_INDEX, TOWER_INVALID_INDEX);
  // Note that we loop through LR1Items but they inherit from LR0Item so we grab that reference
  for (const LR0Item& item : items.kernels) {
    if (!(item == last_inserted_item)) {
      result.kernels.push_back(item);
      last_inserted_item = item;
    }
  }
  return result;
}

// If I had my druthers this would be implemented as an intrusively linked list inside the buckets
// However since we're working within the STL, and since the cases we need only add to the container
// then a vector + unordered_map should be fine
template <typename Key, typename Value>
struct OrderedMap {
  struct LinkedNode {
    LinkedNode* next = nullptr;
    LinkedNode* prev = nullptr;

    LinkedNode() :
      next(this), prev(this) {
    };
    LinkedNode(LinkedNode&& moved) {
      next = moved.next;
      prev = moved.prev;
      next->prev = this;
      prev->next = this;
      moved.next = &moved;
      moved.prev = &moved;
    }
    LinkedNode(const LinkedNode& copy) = delete;

    ~LinkedNode() {
      next->prev = prev;
      prev->next = next;
    }

    void prepend(LinkedNode& prepended) {
      LinkedNode* this_prev = prev;
      prev = &prepended;
      this_prev->next = &prepended;
      prepended.prev = this_prev;
      prepended.next = this;
    }
  };

  struct LinkedKey : LinkedNode {
    Key key;

    LinkedKey() {}
    LinkedKey(const Key& key) : key(key) {}
    LinkedKey(LinkedKey&& moved) :
      LinkedNode(std::move(moved)),
      key(std::move(moved.key)) {
    }
    LinkedKey(const LinkedKey& copy) = delete;
  };

  struct Hasher {
    size_t operator()(const LinkedKey& value) const {
      return std::hash<Key>()(value.key);
    }
  };
  struct EqualTo {
    bool operator()(const LinkedKey& lhs, const LinkedKey& rhs) const {
      return std::equal_to<Key>()(lhs.key, rhs.key);
    }
  };

  std::unordered_map<LinkedKey, Value, Hasher, EqualTo> map;
  LinkedNode sentinel;

  void reserve(size_t size) {
    map.reserve(size);
  }

  Value& operator[](const Key& key) {
    auto result = map.emplace(key, Value());
    if (result.second) {
      // We modify the key which is unsafe, however we never use that part of the key
      // for hashing or equality, so we can't change the key value by modifying it
      LinkedKey& inserted_key = const_cast<LinkedKey&>(result.first->first);
      assert(inserted_key.next == &inserted_key && inserted_key.prev == &inserted_key);
      // We use prepend because we don't want the last thing inserted to be at the front
      sentinel.prepend(inserted_key);
      return result.first->second;
    } else {
      return result.first->second;
    }
  }

  bool contains(const Key& key) {
    LinkedKey linked_key(key);
    return map.find(linked_key) != map.end();
  }

  struct Iterator {
    const OrderedMap* map = nullptr;
    const LinkedNode* current = nullptr;

    Iterator& operator++() {
      current = current->next;
      return *this;
    }
    std::pair<Key, const Value&> operator*() const {
      assert(current != &map->sentinel);
      const LinkedKey& linked_key = *static_cast<const LinkedKey*>(current);
      // I wish there was a way to get to the value without having to hash/find
      // but maybe this is where we need to use boost containers
      auto found = map->map.find(linked_key);
      assert(found != map->map.end());
      return std::pair<Key, const Value&>(linked_key.key, found->second);
    }
    bool operator==(const Iterator& other) const {
      return current == other.current;
    }
    bool operator!=(const Iterator& other) const {
      return current != other.current;
    }
  };

  // Always start with kernel items first
  Iterator begin() const {
    return Iterator {
      .map = this,
      .current = sentinel.next,
    };
  }
  Iterator end() const {
    return Iterator {
      .map = this,
      .current = &sentinel,
    };
  }
};

void parser_table_lalr_lookaheads(
  TableBuilder& table_builder,
  const Grammar& grammar,
  const GrammarSets& sets
) {
  // By reserving the total maximum amount we have, we guarantee this will never reallocate
  OrderedMap<LR0ItemInKernelState, SortedVector<GrammarTerminal>> lookaheads;
  lookaheads.reserve(table_builder.total_kernel_lr_items);

  // The propegation isn't just an LR0 item, it's a specific LR0 item in a state
  // It's significant because when we go to look up 
  OrderedMap<LR0ItemInKernelState, SortedVector<LR0ItemInKernelState>> propegation;
  propegation.reserve(table_builder.total_kernel_lr_items);

  // By default the starting rulne has an implict lookahead of EOF / $
  // The first state should only have the generated starting rule as the only kernel item
  assert(table_builder.states.size() > 0);
  StateBuilder& state = *table_builder.states[0].get();
  assert(state.items.kernels.size() == 1);
  const LR0Item& start_kernel = state.items.kernels[0];
  assert(start_kernel.rule_index == 0);
  assert(start_kernel.symbol_index == 0);
  LR0ItemInKernelState start_item(start_kernel, 0);
  lookaheads[start_item].insert(GrammarTerminal {
    .start = PARSER_ID_EOF,
    .end = PARSER_ID_EOF,
  });

  for (const auto& state_builder : table_builder.states) {
    for (const auto& kernel_item : state_builder->items.kernels) {
      assert(parser_table_is_kernel_item(grammar, kernel_item));
      printf("KERNEL ITEM BEGIN: %s\n", debug_str(kernel_item, grammar).c_str());
      LRSet<LR1Item> lr1_items;
      GrammarTerminal lookahead {
        .start = PARSER_ID_LOOKAHEAD,
        .end = PARSER_ID_LOOKAHEAD,
      };
      LR1Item lr1_item(kernel_item, &lookahead);
      lr1_items.insert(grammar, lr1_item);

      parser_table_closure(grammar, &sets, lr1_items);

      for (GrammarSymbolRef symbol_ref : lr1_items.symbols) {
        const GrammarSymbol* symbol = symbol_ref.symbol;
        // Note that if we did goto on 'kernel_state' we would need to run closure first as the state is kernel items only
        // Goto also preserves the lookaheads
        printf("KERNEL ITEM: %s\n", debug_str(kernel_item, grammar).c_str());
        printf("KERNEL ITEM CLOSURE: %s\n", debug_str(lr1_items, grammar).c_str());
        printf("SYMBOL: %s\n", debug_str(*symbol, grammar).c_str());
        LRSet<LR1Item> goto_state_lr1 = parser_table_goto(grammar, &sets, lr1_items, *symbol);
        printf("GOTO: %s\n", debug_str(goto_state_lr1, grammar).c_str());
        // Always should have items since we only query with valid symbols from lr1_items
        assert(goto_state_lr1.kernels.size() != 0);
        printf("GOTO KERNELS: %s\n", debug_str(goto_state_lr1, grammar).c_str());
        
        // TODO(trevor): Ideally we would be able to look into the unordered map using heterogenous lookup
        // e.g. no need to convert the LRSet<LR1Item> to LRSet<LR0Item>, we can just look up wtih LRSet<LR1Item> kernels
        // We would need to filter LRSet<LR1Item> kernels for duplicate LR0 kernels however (same LR0 item, different lookahead)
        // However heterogenous lookups are not supported until C++20 on unordered_map, and C++20 breaks wasi-sdk for some reason
        // https://www.reddit.com/r/cpp_questions/comments/12xw3sn/find_stdstring_view_in_unordered_map_with/
        // However, one advantage that we have here is we can only assign the kernels because that's all we need to look up
        LRSet<LR0Item> goto_state_lr0 = parser_table_lr0_from_lr1_kernels(goto_state_lr1);
        assert(!goto_state_lr0.kernels.empty());
        auto found_state = table_builder.item_sets_to_state_index.find(&goto_state_lr0);
        assert(found_state != table_builder.item_sets_to_state_index.end());

        for (const LR1Item& propegate_to : goto_state_lr1.kernels) {
          LR0ItemInKernelState propegation_dest(propegate_to, found_state->second);

          // Is lookahead propegated?
          if (propegate_to.lookahead.start == PARSER_ID_LOOKAHEAD) {
            assert(propegate_to.lookahead.end == PARSER_ID_LOOKAHEAD);
            LR0ItemInKernelState propegation_source(kernel_item, state_builder->state_index);
            propegation[propegation_source].insert(propegation_dest);
          } else {
            // Otherwise it's generated / spontaneous
            printf("SPONTANEOUS %s\n", debug_str(propegate_to.lookahead, grammar).c_str());
            lookaheads[propegation_dest].insert(propegate_to.lookahead);
          }
        }
      }

      printf("%s\n", debug_str(lr1_items, grammar).c_str());
    }
  }

  for (const auto& entry : propegation) {
    printf("FROM: %s\n", debug_str(entry.first, grammar).c_str());
    printf("IN: %s\n", debug_str(table_builder.states[entry.first.state_index]->items, grammar).c_str());
    for (const auto& to_states : entry.second) {
      printf("  TO:\n%s\n", debug_str(to_states, grammar).c_str());
      printf("  IN: %s\n", debug_str(table_builder.states[to_states.state_index]->items, grammar).c_str());
    }
  }

  // From the above algorithm, we produced spontaneous lookaheads (real symbols)
  // as well as the propegation map. Now propegate lookaheads until there's none left
  bool has_changed = false;
  do {
    has_changed = false;

    // PRINT DEBUG LOOKAHEADS
    printf("LOOKAHEADS:\n");
    for (const auto& entry : lookaheads) {
      printf("ITEM: %s\n", debug_str(entry.first, grammar).c_str());
      printf("IN: %s\n", debug_str(table_builder.states[entry.first.state_index]->items, grammar).c_str());
      for (const auto& lookahead : entry.second) {
        printf(" %s", debug_str(lookahead, grammar).c_str());
      }
      printf("\n");
    }

    for (const auto& propegate_pair : propegation) {
      // Normally it would not be safe to hold this reference as we possibly insert into lookaheads below
      // however we avoid any rehash because we reserved the maxmium size that lookaheads can be already
      // Therefore this reference will always be safe to hold
      auto& lookahead_terminals = lookaheads[propegate_pair.first];
      for (const auto& to_states : propegate_pair.second) {
        auto& propegate_to_terminals = lookaheads[to_states];
        size_t size_before = propegate_to_terminals.size();
        propegate_to_terminals.insert(lookahead_terminals.begin(), lookahead_terminals.end());
        if (propegate_to_terminals.size() != size_before) {
          has_changed = true;
        }
      }
    }
  } while(has_changed);

  // Validate that all the reduce items have
#ifndef NDEBUG
  for (const auto& state_builder : table_builder.states) {
    // Note that only kernel items can be reduce items
    for (const auto& kernel_item : state_builder->items.kernels) {
      const GrammarRule& rule = grammar.rules[kernel_item.rule_index];
      // If this is a reduce rule (dot at the end)
      // Note that this may be an empty production
      if (kernel_item.symbol_index == rule.symbols.size()) {
        LR0ItemInKernelState item_in_kernel(kernel_item, state_builder->state_index);
        assert(lookaheads.contains(item_in_kernel));
      }
    }
  }
#endif

  // Finally, take care of all the reduce transitions since we now know the lookaheads
  for (const auto& entry : lookaheads) {
    const GrammarRule& rule = grammar.rules[entry.first.rule_index];

    // If this is a reduction (the dot is at the end of the production / no grammar symbols left)
    if (entry.first.symbol_index == rule.symbols.size()) {
      StateBuilder& state_builder = *table_builder.states[entry.first.state_index].get();

      // For each lookahead
      for (const auto& lookahead_terminal : entry.second) {
        StateBuilderEdge edge {
          .terminal = lookahead_terminal,
          .reduce_rule = &rule,
        };
        
        bool inserted = state_builder.edges.insert(edge);
        assert(inserted); // We should never have collisions
      }
    }
  }
}

void parser_table_build_states(
  Table& table,
  TableBuilder& table_builder
) {
  // We must resize the states so that no re-allocation can occur
  table.states.resize(table_builder.states.size());

  std::unordered_map<const SortedVector<StateBuilderEdge>*, StateTransitions*> shared_transitions;

  for (size_t i = 0; i < table_builder.states.size(); ++i) {
    StateBuilder& builder = *table_builder.states[i].get();
    State& state = table.states[i];
    state.symbol = builder.symbol;

    StateTransitions*& transitions = shared_transitions[&builder.edges];
    if (!transitions) {
      transitions = new StateTransitions();

      const auto add_edge = [&](const GrammarTerminal& terminal) -> StateEdge& {
        if (terminal.start == terminal.end) {
          // Make sure there are no duplicates
          assert(transitions->direct_edges.find(terminal.start) == transitions->direct_edges.end());
          return transitions->direct_edges[terminal.start];
        } else {
          // These will be already sorted as they are coming from SortedVector<StateBuilderEdge>
          StateEdgeRange& edge_range = transitions->range_edges.emplace_back();
          edge_range.range = terminal;
          return edge_range.edge;
        }
      };

      const StateBuilderEdge* last_edge = nullptr;
      for (const auto& builder_edge : builder.edges) {
        if (last_edge) {
          assert(last_edge->terminal.entirely_less(builder_edge.terminal));
        }

        StateEdge& state_edge = add_edge(builder_edge.terminal);
        if (builder_edge.reduce_rule) {
          state_edge.reduce_rule = builder_edge.reduce_rule;
        } else {
          state_edge.shift_state = &table.states[builder_edge.shift_state_index];
        }

        last_edge = &builder_edge;
      }
    }
    state.transitions = transitions;

    for (const auto& builder_gotos : builder.gotos_after_reduction) {
      const State*& goto_state = state.gotos_after_reduction[builder_gotos.non_terminal];
      // As mentioned in the dragon book, there should never be any duplicates on gotos with non-terminals
      assert(!goto_state);
      goto_state = &table.states[builder_gotos.shift_state_index];
    }
  }

  printf("REDUCED SHARED TRANSITIONS: %d to %d\n", (int)table.states.size(), (int)shared_transitions.size());
}

char* parser_table_utf8_id_to_string(uint8_t* userdata, uint32_t id) {
  // TODO(trevor): This should be a lot more efficient, but currently we don't have a way to measure utf8 size
  std::stringstream stream;
  stream << '\'' << (char)id << '\'';
  std::string str = stream.str();
  // Include the null terminator
  void* str_mem = tower_memory_allocate(str.size() + 1);
  memcpy(str_mem, str.c_str(), str.size() + 1);
  return (char*)str_mem;
}

Table* parser_table_create(
  TowerNode* root,
  uint8_t* userdata,
  ParserTableResolveReference resolve,
  ParserTableIdToString to_string
) {
  void* memory = tower_memory_allocate(sizeof(Table));
  ++Table::allocated_count;
  Table* table = new (memory) Table();

  Grammar& grammar = table->grammar;
  grammar.userdata = userdata;
  grammar.to_string = to_string;
  parser_grammar_create(grammar, root, userdata, resolve);
  assert(grammar.rules.size() > 0);
  assert(grammar.non_terminals.size() > 0);
  printf("%s\n", debug_str(grammar).c_str());

  TableBuilder table_builder;
  parser_table_lr0_items(table_builder, grammar);
  assert(table_builder.states.size() > 0);
  assert(table_builder.item_sets_to_state_index.size() > 0);
  assert(table_builder.total_kernel_lr_items > 0);

  GrammarSets sets;
  parser_table_compute_grammar_sets(grammar, sets);
  assert(sets.first.size() == grammar.non_terminals.size());
  assert(sets.nullable.size() == grammar.non_terminals.size());
  printf("%s\n", debug_str(sets, grammar).c_str());

  parser_table_lalr_lookaheads(table_builder, grammar, sets);

  parser_table_build_states(*table, table_builder);
  printf("%s\n", debug_str(*table).c_str());

  return table;
}

void parser_table_destroy(Table* table) {
  if (!table) {
    return;
  }

  --Table::allocated_count;
  table->~Table();
  tower_memory_free(table);
}

struct Recognizer {
  static std::atomic<uint32_t> allocated_count;
  std::vector<const State*> stack;

  // TODO(trevor): The recgonizer needs to hold on to these (reference count?)
  Stream* stream = nullptr;

  // Note that we never actually use the table, we just need to keep the states inside the table alive
  const Table* table = nullptr;

  // Holds the last read value from the stream
  TowerNode* read_node_or_null = nullptr;
  uint32_t read_id = PARSER_ID_EOF;
  uint32_t read_start = PARSER_ID_EOF;
  uint32_t read_length = 0;
};
std::atomic<uint32_t> Recognizer::allocated_count = 0;

void parser_recognizer_read_id(Recognizer* recognizer) {
  // To start the algorithm, we must read in a single character (even if it's EOF)
  recognizer->read_node_or_null = parser_stream_read(
    recognizer->stream,
    &recognizer->read_id,
    &recognizer->read_start,
    &recognizer->read_length
  );

  printf("READ: %s id(%d) start(%d) len(%d)\n",
    debug_str(recognizer->read_id, recognizer->table->grammar).c_str(),
    (int)recognizer->read_id,
    (int)recognizer->read_start,
    (int)recognizer->read_length);
}

Recognizer* parser_recognizer_create(Table* table, Stream* stream) {
  void* memory = tower_memory_allocate(sizeof(Recognizer));
  ++Recognizer::allocated_count;
  Recognizer* recognizer = new (memory) Recognizer();
  recognizer->stream = stream;
  recognizer->table = table;
  recognizer->stack.push_back(&table->states[0]);
  parser_recognizer_read_id(recognizer);
  return recognizer;
}

// Destructs the parser and frees it's memory
void parser_recognizer_destroy(Recognizer* recognizer) {
  --Recognizer::allocated_count;
  recognizer->~Recognizer();
  tower_memory_free(recognizer);
}

TowerNode* parser_recognizer_step(Recognizer* recognizer, bool* running) {
  assert(*running);

  const State* state = recognizer->stack.back();
  const StateTransitions* transitions = state->transitions;

  printf("STACK:\n");
  for (size_t i = 0; i < recognizer->stack.size(); ++i) {
    printf("  %s\n", debug_str_header(*recognizer->stack[i], *recognizer->table).c_str());
  }

  const StateEdge* found_edge = nullptr;

  const auto id = recognizer->read_id;
  printf("LAST READ: %s id(%d) start(%d) len(%d)\n",
    debug_str(recognizer->read_id, recognizer->table->grammar).c_str(),
    (int)recognizer->read_id,
    (int)recognizer->read_start,
    (int)recognizer->read_length);

  // If we found a direct edge then follow it (fast path)
  auto found = transitions->direct_edges.find(id);
  if (found != transitions->direct_edges.end()) {
    found_edge = &found->second;
  } else {
    // Otherwise, look for any character range
    auto found = std::lower_bound(
      transitions->range_edges.begin(),
      transitions->range_edges.end(),
      id
    );
    // The value we found may not be the range we're looking for (just lower/closest in binary search)
    if (found != transitions->range_edges.end() && id >= found->range.start && id <= found->range.end) {
      found_edge = &found->edge;
    }
  }

  if (found_edge) {
    printf("STEP: %s\n", debug_str(*found_edge, *recognizer->table).c_str());
    if (found_edge->shift_state) {
      recognizer->stack.push_back(found_edge->shift_state);
      // Read the id for the next step/iteration
      parser_recognizer_read_id(recognizer);
    } else if (found_edge->reduce_rule) {
      if (found_edge->reduce_rule->index == 0) {
        printf("ACCEPT\n");
      } else {
        // We should always have at least one state on the stack after reducing
        const size_t pop_size = found_edge->reduce_rule->symbols.size();
        assert(recognizer->stack.size() > pop_size);
        size_t erase_index = recognizer->stack.size() - pop_size;
        recognizer->stack.erase(recognizer->stack.begin() + erase_index, recognizer->stack.end());
        const State* top_state = recognizer->stack.back();
        auto found_reduction = top_state->gotos_after_reduction.find(found_edge->reduce_rule->non_terminal);
        // We should always find it otherwise we built the table wrong
        assert(found_reduction != top_state->gotos_after_reduction.end());
        // The next state is the dictated by the GOTO[state, non-terminal]
        recognizer->stack.push_back(found_reduction->second);
        printf("REDUCE: pop(%d) to %s\n", (int)pop_size, debug_str(*found_reduction->second, *recognizer->table).c_str());
      }

      // TODO(trevor): Report the reduction to the user, callback?
      // Or maybe we return some sort of structure that indicates what happened so we allow the user to call
    } else {
      assert(false && "bad edge"); // ERROR!
    }
  } else {
    assert(false && "unable to find edge, parse error"); // ERROR!
  }

  // TODO(trevor): Return parse tree here, and use read_node_or_null too
  return nullptr;
}

void parser_tests_internal() {
  // Test SortedVector
  {
    SortedVector<int32_t> values;
    values.insert(0);
    values.insert(0);
    assert(values.size() == 1);
    values.insert(1);
    assert(values.size() == 2);
    values.insert(2);
    assert(values.size() == 3);
    values.insert(0);
    values.insert(1);
    values.insert(2);
    assert(values.size() == 3);
    values.insert(3);
    assert(values.size() == 4);
    values.insert(0);
    assert(values.size() == 4);
    assert(values[0] == 0);
    assert(values[1] == 1);
    assert(values[2] == 2);
    assert(values[3] == 3);
    values.insert(-1);
    assert(values.size() == 5);
    assert(values[0] == -1);
    assert(values[1] == 0);
    assert(values[2] == 1);
    assert(values[3] == 2);
    assert(values[4] == 3);
  }

  // Test OrderedMap
  {
    OrderedMap<uint32_t, uint32_t> map;
    assert(map.begin() == map.end());
    assert(map.contains(1) == false);
    map[1] = 100;
    assert(map[1] == 100);
    assert(map.contains(1) == true);
    assert(map.begin() != map.end());
    assert(++map.begin() == map.end());
    assert((*map.begin()).first == 1);
    assert((*map.begin()).second == 100);

    assert(map.contains(2) == false);
    map[2] = 200;
    assert(map[2] == 200);
    assert(map.contains(1) == true);
    assert(map.contains(2) == true);

    assert(map.contains(3) == false);
    map[3] = 300;
    assert(map[3] == 300);
    assert(map.contains(1) == true);
    assert(map.contains(2) == true);
    assert(map.contains(3) == true);

    {
      auto it = map.begin();
      assert((*it).first == 1);
      assert((*it).second == 100);
      ++it;
      assert((*it).first == 2);
      assert((*it).second == 200);
      ++it;
      assert((*it).first == 3);
      assert((*it).second == 300);
      ++it;
      assert(it == map.end());
    }
  
    map.reserve(100);

    {
      auto it = map.begin();
      assert((*it).first == 1);
      assert((*it).second == 100);
      ++it;
      assert((*it).first == 2);
      assert((*it).second == 200);
      ++it;
      assert((*it).first == 3);
      assert((*it).second == 300);
      ++it;
      assert(it == map.end());
    }
  
    assert(map[1] == 100);
    assert(map[2] == 200);
    assert(map[3] == 300);

    assert(map.contains(0) == false);
    map[0] = 0;
    assert(map[0] == 0);
    assert(map.contains(0) == true);

    {
      auto it = map.begin();
      assert((*it).first == 1);
      assert((*it).second == 100);
      ++it;
      assert((*it).first == 2);
      assert((*it).second == 200);
      ++it;
      assert((*it).first == 3);
      assert((*it).second == 300);
      ++it;
      assert((*it).first == 0);
      assert((*it).second == 0);
      ++it;
      assert(it == map.end());
    }
  }
}
