#include "parser.hpp"
#include <unordered_map>
#include <string>
#include <vector>
#include <cassert>
#include <set>
#include <map>
#include <sstream>
#include <algorithm>

// We don't use -1 just to ensure it never gets mixed with TOWER_INVALID_INDEX
const uint32_t PARSER_ID_EOF = (uint32_t)-2;
const uint32_t PARSER_ID_LOOKAHEAD = (uint32_t)-3;

// The tests come first so that we don't see the definition of any structs
void parser_tests_internal();
void parser_tests() {
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
    Stream* stream = parser_stream_utf8_null_terminated_create("a");
    //Recognizer* recognizer = parser_recognizer_create(table, stream);

    //TowerNode* parser_recognizer_step(recognizer);

    // Test it actually parsing a value

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

  parser_tests_internal();
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

struct GrammarSymbol {
  TowerNode* symbol_node = nullptr;

  // Set if this represents a non-terminal (a reference to other rules)
  // If this is set, the start/end are ignored
  GrammarNonTerminal* non_terminal = nullptr;
  GrammarTerminal terminal;
};

struct GrammarSymbolLess {
  bool operator()(const GrammarSymbol* lhs, const GrammarSymbol* rhs) const {
    // Note that our operator does not consider the symbol_node, it is extra information
    if (lhs->non_terminal) {
      if (rhs->non_terminal) {
        // Quick case for equals
        if (lhs->non_terminal == rhs->non_terminal) {
          return false;
        }

        return lhs->non_terminal->name < rhs->non_terminal->name;
      } else {
        // Non-terminals are always < terminals
        return true;
      }
    } else {
      if (rhs->non_terminal) {
        // Terminals are always > non-terminals
        return false;
      } else {
        // Both are non-terminals, compare the ranges
        return lhs->terminal < rhs->terminal;
      }
    }
  }
};

struct GrammarRule {
  Rule* rule = nullptr;
  GrammarNonTerminal* non_terminal = nullptr;
  std::vector<GrammarSymbol> symbols;
};

struct Grammar {
  // The first non-terminal is the starting non-terminal S'
  std::vector<GrammarNonTerminal> non_terminals;
  // The first rule is the starting rule S'
  std::vector<GrammarRule> rules;
};

void parser_grammar_create(Grammar* grammar, TowerNode* root, uint8_t* userdata, ParserTableResolveReference resolve) {
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

  // WARNING: This is required as we MUST ensure that grammar->rules
  // does not reallocate (we store direct pointers into the array)
  // This is an overestimation / worst case every rule has a unique non terminal
  std::unordered_map<std::string, GrammarNonTerminal*> non_terminals;
  size_t rule_count_with_start = rules.size() + 1;
  grammar->rules.reserve(rule_count_with_start);
  non_terminals.reserve(rule_count_with_start);
  grammar->non_terminals.reserve(rule_count_with_start);

  // Reserve a spot for the starting rule at index 0 (has no associated Rule*)
  GrammarRule& starting_rule = grammar->rules.emplace_back();
  GrammarNonTerminal& starting_non_terminal = grammar->non_terminals.emplace_back();
  starting_non_terminal.rules.push_back(&starting_rule);
  starting_non_terminal.name = "S'";
  starting_non_terminal.index = 0;
  starting_rule.non_terminal = &starting_non_terminal;

  // Now build our grammar rules and map from the sorted rules above
  for (uint32_t i = 0; i < rules.size(); ++i) {
    Rule* rule = rules[i];

    GrammarRule& grammar_rule = grammar->rules.emplace_back();
    grammar_rule.rule = rule;

    GrammarNonTerminal*& non_terminal = non_terminals[rule->name];
    // If this is the first time we're seeing this name, create a new non-terminal for it and set the name
    if (non_terminal == nullptr) {
      size_t index = grammar->non_terminals.size();
      non_terminal = &grammar->non_terminals.emplace_back();
      non_terminal->name = rule->name;
      non_terminal->index = index;
    }
    grammar_rule.non_terminal = non_terminal;
    non_terminal->rules.push_back(&grammar_rule);
  }

  // As long as we have a non-terminal that isn't the starting rule
  if (grammar->non_terminals.size() > 1) {
    GrammarSymbol& symbol = starting_rule.symbols.emplace_back();
    symbol.non_terminal = &grammar->non_terminals[1];
  }

  // Walk through the rules in sorted order (skipping the starting rule 0)
  // Now we can map all rule names/references
  for (uint32_t r = 1; r < grammar->rules.size(); ++r) {
    GrammarRule& grammar_rule = grammar->rules[r];
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

struct LR0Item;
bool parser_table_is_kernel_item(const LR0Item& item);

struct LR0Item {
  uint32_t rule_index = TOWER_INVALID_INDEX;
  uint32_t symbol_index = TOWER_INVALID_INDEX;

  // Note: We use std::set<LR0Item> so that we have a deterministic order
  bool operator<(const LR0Item& rhs) const {
    // First we compare kernels to make sure 
    int lhs_nonkernel = (int)!parser_table_is_kernel_item(*this);
    int rhs_nonkernel = (int)!parser_table_is_kernel_item(rhs);
    if (lhs_nonkernel < rhs_nonkernel) {
      return true;
    }
    if (rhs_nonkernel < lhs_nonkernel) {
      return false;
    }

    // Once we've sorted by kernel items, lets sort by rules next so the first rules come first
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

struct LR0ItemHash {
  std::size_t operator()(const LR0Item& key) const {
    return std::hash<uint32_t>()(key.rule_index) ^ std::hash<uint32_t>()(key.symbol_index);
  }
};

bool parser_table_is_kernel_item(const LR0Item& item) {
  // A kernel item is an item whose dots are not at
  // the left side (0) or the initial item (0, 0)
  return item.symbol_index != 0 || item.rule_index == 0;
}

void debug_append_id(uint32_t id, std::stringstream& stream, uint8_t* userdata, ParserTableIdToString to_string) {
  switch (id) {
    case PARSER_ID_EOF:
    stream << '$';
    return;
    case PARSER_ID_LOOKAHEAD:
    stream << '#';
    return;
  }

  char* str = nullptr;
  if (to_string) {
    str = to_string(userdata, id);
  }

  if (str) {
    stream << str;
    tower_memory_free((void*)str);
  } else {
    stream << id;
  }
};

std::string debug_str(const GrammarTerminal& terminal, uint8_t* userdata, ParserTableIdToString to_string) {
  std::stringstream stream;
  if (terminal.start == terminal.end) {
    debug_append_id(terminal.start, stream, userdata, to_string);
  } else {
    stream << '[';
    debug_append_id(terminal.start, stream, userdata, to_string);
    stream << '-';
    debug_append_id(terminal.end, stream, userdata, to_string);
    stream << ']';
  }
  return stream.str();
}

std::string debug_str(const GrammarSymbol& symbol, uint8_t* userdata, ParserTableIdToString to_string) {
  if (symbol.non_terminal) {
    return symbol.non_terminal->name;
  } else {
    return debug_str(symbol.terminal, userdata, to_string);
  }
}

std::string debug_str(const LR0Item& item, const Grammar& grammar, uint8_t* userdata, ParserTableIdToString to_string) {
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
    stream << debug_str(symbol, userdata, to_string);
  }

  return stream.str();
}

std::string debug_str(const std::set<LR0Item>& items, const Grammar& grammar, uint8_t* userdata, ParserTableIdToString to_string) {
  std::stringstream stream;
  stream << "==========\n";
  for (const auto& item : items) {
    stream << debug_str(item, grammar, userdata, to_string) << "\n";
  }
  stream << "----------";
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

struct GrammarSets;
void parser_table_closure(const Grammar& grammar, const GrammarSets* sets, std::set<LR0Item>& items) {
  // Note: This should closely match the LR1 version
  std::vector<LR0Item> unprocessed(items.begin(), items.end());
  
  while (!unprocessed.empty()) {
    LR0Item item = unprocessed.back();
    unprocessed.pop_back();
    
    // For each item in the closure, find the next grammar symbol after the dot
    const GrammarSymbol* symbol = parser_table_get_grammar_symbol_or_null(grammar, item);

    // We only care if the grammar symbol is a reference (another rule to expand)
    if (symbol && symbol->non_terminal) {
      for (GrammarRule* rule : symbol->non_terminal->rules) {
        LR0Item nonkernel_item = {
          .rule_index = (uint32_t)(rule - grammar.rules.data()),
          .symbol_index = 0,
        };

        // Attempt to insert it and if it's the first time it's been inserted, we need to process it
        if (items.insert(nonkernel_item).second) {
          unprocessed.push_back(nonkernel_item);
        }
      }
    }
  }
}

template <typename LRItem>
void parser_table_filter_kernels_only(std::set<LRItem>& items) {
  for (auto it = items.begin(); it != items.end(); ) {
    if (!parser_table_is_kernel_item(*it)) {
      it = items.erase(it);
    } else {
      ++it;
    }
  }
}

template <typename LRItem = LR0Item>
std::set<const GrammarSymbol*, GrammarSymbolLess> parser_table_grammar_symbols_from_items(
  const Grammar& grammar,
  const std::set<LRItem>& items
) {
  std::set<const GrammarSymbol*, GrammarSymbolLess> symbols;
  for (auto& item : items) {
    const GrammarSymbol* symbol = parser_table_get_grammar_symbol_or_null(grammar, item);
    if (symbol) {
      symbols.insert(symbol);
    }
  }
  return symbols;
}

template <typename LRItem>
std::set<LRItem> parser_table_goto(
  const Grammar& grammar,
  const GrammarSets* sets, // GrammarSets may be null for lr0 (passed only to make this generic/templated)
  const std::set<LRItem>& items,
  const GrammarSymbol& goto_symbol
) {
  std::set<LRItem> result;
  for (const LRItem& item : items) {
    const GrammarSymbol* symbol = parser_table_get_grammar_symbol_or_null(grammar, item);
  
    // If they're the same non-terminal, or both null / terminals
    if (symbol && symbol->non_terminal == goto_symbol.non_terminal) {
      LRItem next_item = item;
      ++next_item.symbol_index;

      // Non-terminals or terminals?
      if (symbol->non_terminal) {
        result.insert(next_item);
      } else {
        // TODO(trevor): Optimize this, right now the query goto_symbol must always be a single value, not a range
        // I believe instead of passing in every single character value we can break up the ranges, but I really need to
        // sit down and figure that one out. To move on for now, I'm just going to do it character by character
        printf("%d - %d\n", goto_symbol.terminal.start, goto_symbol.terminal.end);
        assert(goto_symbol.terminal.start == goto_symbol.terminal.end);

        if (goto_symbol.terminal.start >= symbol->terminal.start && goto_symbol.terminal.start <= symbol->terminal.end) {
          result.insert(next_item);
        }
      }
    }
  }
  parser_table_closure(grammar, sets, result);
  return result;
}

std::set<std::set<LR0Item>> parser_table_lr0_items(const Grammar& grammar, uint8_t* userdata, ParserTableIdToString to_string) {
  std::set<LR0Item> starting = {
    LR0Item{0, 0}
  };
  parser_table_closure(grammar, nullptr, starting);

  std::set<std::set<LR0Item>> states; // C in dragon book
  auto start_result = states.insert(std::move(starting));

  std::vector<const std::set<LR0Item>*> unprocessed {
    &*start_result.first
  };
  
  while (!unprocessed.empty()) {
    const std::set<LR0Item>* state = unprocessed.back(); // I in dragon book
    unprocessed.pop_back();
    
    printf("state %s\n", debug_str(*state, grammar, userdata, to_string).c_str());
    // X in dragon book
    for (const GrammarSymbol* symbol : parser_table_grammar_symbols_from_items(grammar, *state)) {
      printf("symbol %s\n", debug_str(*symbol, userdata, to_string).c_str());
      std::set<LR0Item> gotos = parser_table_goto(grammar, nullptr, *state, *symbol);
      // Our gotos should never be empty since we only query with symbols that are valid
      assert(!gotos.empty());
      printf("gotos %s\n", debug_str(gotos, grammar, userdata, to_string).c_str());
      auto result = states.insert(std::move(gotos));
      if (result.second) {
        printf("added state\n");
        unprocessed.push_back(&*result.first);
      }
    }
  }

  return states;
}

//std::set<LR0Item> parser_table_kernel_items(const std::set<LR0Item>& items) {
//  std::set<LR0Item> result;
//  for (auto& item : items) {
//    if (parser_table_is_kernel_item(item)) {
//      result.insert(item);
//    }
//  }
//  return result;
//}

struct GrammarSets {
  // Sized exactly to the size of the the Grammar's non_terminals
  std::vector<std::set<GrammarTerminal>> first;
  std::vector<bool> nullable;
};

std::string debug_str(const GrammarSets& sets, const Grammar& grammar, uint8_t* userdata, ParserTableIdToString to_string) {
  std::stringstream stream;

  stream << "++++++++++\n";
  for (size_t i = 0; i < grammar.non_terminals.size(); ++i) {
    stream << "FIRST(" << grammar.non_terminals[i].name << ") = {";

    auto& first = sets.first[i];
    for (auto& terminal : first) {
      stream << ' ' << debug_str(terminal, userdata, to_string);
    }

    if (sets.nullable[i]) {
      stream << " ε";
    }

    stream << " }\n";
  }

  stream << "----------";
  return stream.str();
}

void parser_table_compute_grammar_sets(const Grammar& grammar, GrammarSets& sets) {
  sets.first.resize(grammar.non_terminals.size());
  sets.nullable.resize(grammar.non_terminals.size());

  bool has_changed = false;
  do {
    has_changed = false;

    for (auto& rule : grammar.rules) {      
      // X = Y1 Y2 Y3...
      auto rule_non_terminal_index = rule.non_terminal->index;
      auto& rule_first_set = sets.first[rule_non_terminal_index];

      // This also handles the case where X = 
      bool is_all_nullable = true;

      // Loop until we find a non-nullable symbol
      for (auto& symbol : rule.symbols) {
        if (symbol.non_terminal) {
          auto symbol_non_terminal_index = symbol.non_terminal->index;
          auto& symbol_first_set = sets.first[symbol_non_terminal_index];

          // Everything in FIRST(Yn) is in FIRST(X) except epsilon (but we use nullable for epsilon)
          size_t size_before = rule_first_set.size();
          rule_first_set.insert(symbol_first_set.begin(), symbol_first_set.end());
          if (size_before != rule_first_set.size()) {
            has_changed = true;
          }

          // If this non-terminal is not known to be nullable, then 
          if (!sets.nullable[symbol_non_terminal_index]) {
            is_all_nullable = false;
            break;
          }
        } else {
          // FIRST(terminal) = {terminal}
          if (rule_first_set.insert(symbol.terminal).second) {
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


struct LR1Item : LR0Item {
  GrammarTerminal lookahead;

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
};

std::set<LR0Item> parser_table_lr0_kernels_from_lr1_items(const std::set<LR1Item>& items) {
  std::set<LR0Item> result;
  for (const LR1Item& lr1_item : items) {
    if (parser_table_is_kernel_item(lr1_item)) {
      result.insert(lr1_item);
    }
  }
  return result;
}

std::string debug_str(const LR1Item& item, const Grammar& grammar, uint8_t* userdata, ParserTableIdToString to_string) {
  std::stringstream stream;
  stream << '[';
  stream << debug_str(static_cast<const LR0Item&>(item), grammar, userdata, to_string);
  stream << ", ";
  stream << debug_str(item.lookahead, userdata, to_string);
  stream << ']';
  return stream.str();
}

std::string debug_str(const std::set<LR1Item>& items, const Grammar& grammar, uint8_t* userdata, ParserTableIdToString to_string) {
  std::stringstream stream;
  stream << "==========\n";
  for (const auto& item : items) {
    stream << debug_str(item, grammar, userdata, to_string) << "\n";
  }
  stream << "----------";
  return stream.str();
}

void parser_table_closure(const Grammar& grammar, const GrammarSets* sets, std::set<LR1Item>& items) {
  // Note: This should closely match the LR0 version
  std::vector<LR1Item> unprocessed(items.begin(), items.end());
  
  while (!unprocessed.empty()) {
    // [A = α.Bβ, a] in dragon book
    LR1Item item = unprocessed.back();
    unprocessed.pop_back();
    
    // For each item in the closure, find the next grammar symbol after the dot (B in the dragon book)
    const GrammarSymbol* symbol = parser_table_get_grammar_symbol_or_null(grammar, item);

    // Also find the grammar symbol after (β in the dragon book)
    const GrammarSymbol* after = parser_table_get_grammar_symbol_or_null(grammar, {
      .rule_index = item.rule_index,
      .symbol_index = item.symbol_index + 1
    });

    // β might be a non-terminal with epsilon     FIRST(βa) = {x, y..., a}    (uses first_set + first_terminal)
    // β might be a non-terminal with no epsilon  FIRST(βa) = {x, y...}       (uses first_set)
    // β might be a terminal                      FIRST(βa) = {β}             (uses first_terminal)
    // β might be null (end of production)        FIRST(βa) = {a}             (uses first_terminal)
    const std::set<GrammarTerminal>* first_set = nullptr;
    const GrammarTerminal* first_terminal = nullptr;

    // Do we have β?
    if (after) {
      // Is β a non-terminal?
      if (after->non_terminal) {
        // At this point we know no matter what we're going to use FIRST(β) terminals
        first_set = &sets->first[after->non_terminal->index];

        // If β contain epsilon then we also need to inlude the lookahead (if not then FIRST(βa) = FIRST(β))
        if (sets->nullable[after->non_terminal->index]) {
          first_terminal = &item.lookahead;
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
      first_terminal = &item.lookahead;
    }

    // We only care if the grammar symbol is a reference (another rule to expand)
    if (symbol && symbol->non_terminal) {
      for (GrammarRule* rule : symbol->non_terminal->rules) {

        auto add_item = [&](const GrammarTerminal& terminal) {
          LR1Item nonkernel_item;
          nonkernel_item.rule_index = (uint32_t)(rule - grammar.rules.data());
          nonkernel_item.symbol_index = 0;
          nonkernel_item.lookahead = terminal;

          // Attempt to insert it and if it's the first time it's been inserted, we need to process it
          if (items.insert(nonkernel_item).second) {
            unprocessed.push_back(nonkernel_item);
          }
        };

        // Add new LR1 items with lookahead for
        if (first_set) {
          for (const GrammarTerminal& terminal : *first_set) {
            add_item(terminal);
          }
        }
        if (first_terminal) {
            add_item(*first_terminal);
        }
      }
    }
  }
}

struct LR0ItemInKernelState {
  LR0Item item;
  const std::set<LR0Item>& kernel_state;

  bool operator<(const LR0ItemInKernelState& rhs) const {
    if (item < rhs.item) {
      return true;
    }
    if (rhs.item < item) {
      return false;
    }
    // This could be optimized to just compare pointers, but we want determanism
    return kernel_state < rhs.kernel_state;
  }
};

void parser_table_lalr_lookaheads(
  const Grammar& grammar,
  const GrammarSets& sets,
  const std::set<std::set<LR0Item>>& kernel_states,
  uint8_t* userdata,
  ParserTableIdToString to_string
) {
  // Note: We could use unordered_map but we have to make a copy for lookahead_terminals instead of a reference
  //std::unordered_map<LR0Item, std::vector<GrammarTerminal>, LR0ItemHash> lookaheads;
  std::map<LR0ItemInKernelState, std::set<GrammarTerminal>> lookaheads;

  // The propegation isn't just an LR0 item, it's a specific LR0 item in a state
  // It's significant because when we go to look up 
  std::map<LR0ItemInKernelState, std::set<LR0ItemInKernelState>> propegation;

  // By default the starting rulne has an implict lookahead of EOF / $
  // Note that the kernel_states set should be sorted and the first state should always be the starting state
  // Since we filter to kernels only, it should be guaranteed to have one element only (S` = S...)
  const std::set<LR0Item>& start_state = *kernel_states.begin();
  assert(start_state.size() == 1);
  assert(start_state.begin()->rule_index == 0);
  assert(start_state.begin()->symbol_index == 0);
  LR0ItemInKernelState start_item {
    .item = *start_state.begin(), // can also construct 0,0, showing where it comes from here
    .kernel_state = start_state
  };
  lookaheads[start_item].insert(GrammarTerminal {
    .start = PARSER_ID_EOF,
    .end = PARSER_ID_EOF,
  });

  for (auto& kernel_state : kernel_states) {
    for (auto& kernel_item : kernel_state) {
      assert(parser_table_is_kernel_item(kernel_item));
      printf("KERNEL ITEM: %s\n", debug_str(kernel_item, grammar, userdata, to_string).c_str());
      std::set<LR1Item> lr1_items;
      LR1Item lr1_item;
      lr1_item.rule_index = kernel_item.rule_index,
      lr1_item.symbol_index = kernel_item.symbol_index,
      lr1_item.lookahead = {
        .start = PARSER_ID_LOOKAHEAD,
        .end = PARSER_ID_LOOKAHEAD,
      };
      lr1_items.insert(lr1_item);
    
      parser_table_closure(grammar, &sets, lr1_items);

      for (const GrammarSymbol* symbol : parser_table_grammar_symbols_from_items(grammar, lr1_items)) {
        // Note that if we did goto on 'kernel_state' we would need to run closure first as the state is kernel items only
        // Goto also preserves the lookaheads
        printf("SYMBOL: %s\n", debug_str(*symbol, userdata, to_string).c_str());
        std::set<LR1Item> goto_state_lr1 = parser_table_goto(grammar, &sets, lr1_items, *symbol);
        printf("GOTO: %s\n", debug_str(goto_state_lr1, grammar, userdata, to_string).c_str());
        // Always should have items since we only query with valid symbols from lr1_items
        assert(goto_state_lr1.size() != 0);
        parser_table_filter_kernels_only(goto_state_lr1);
        assert(goto_state_lr1.size() != 0);
        printf("GOTO KERNELS: %s\n", debug_str(goto_state_lr1, grammar, userdata, to_string).c_str());
        std::set<LR0Item> goto_state_lr0 = parser_table_lr0_kernels_from_lr1_items(goto_state_lr1);
        assert(goto_state_lr0.size() != 0);

        // The goto LR0 items should combine to make a state that exists in our kernel states
        // We want to find it because goto_state_lr0 will go out of scope / destructed
        // However, we hold a reference to it inside LR0ItemInKernelState
        auto found_state = kernel_states.find(goto_state_lr0);
        assert(found_state != kernel_states.end());

        for (const LR1Item& propegate_to : goto_state_lr1) {
          LR0ItemInKernelState propegation_dest {
            .item = propegate_to,
            .kernel_state = *found_state
          };

          // Is lookahead propegated?
          if (propegate_to.lookahead.start == PARSER_ID_LOOKAHEAD) {
            assert(propegate_to.lookahead.end == PARSER_ID_LOOKAHEAD);
            LR0ItemInKernelState propegation_source {
              .item = kernel_item,
              .kernel_state = kernel_state
            };

            propegation[propegation_source].insert(propegation_dest);
          } else {
            // Otherwise it's generated / spontaneous
            // TODO(trevor): Verifty this is correct, I'm not sure if the lookaheads are supposed to be attached
            // to the individual items or 
            lookaheads[propegation_dest].insert(propegate_to.lookahead);
          }
        }
      }

      printf("%s\n", debug_str(lr1_items, grammar, userdata, to_string).c_str());
    }
  }

  for (auto entry : propegation) {
    printf("FROM: %s\n", debug_str(entry.first.item, grammar, userdata, to_string).c_str());
    printf("IN: %s\n", debug_str(entry.first.kernel_state, grammar, userdata, to_string).c_str());
    for (const auto& to_states : entry.second) {
      printf("  TO:\n%s\n", debug_str(to_states.item, grammar, userdata, to_string).c_str());
      printf("  IN: %s\n", debug_str(to_states.kernel_state, grammar, userdata, to_string).c_str());
    }
  }

  // From the above algorithm, we produced spontaneous lookaheads (real symbols)
  // as well as the propegation map. Now propegate lookaheads until there's none left
  bool has_changed = false;
  do {
    has_changed = false;

    // PRINT DEBUG LOOKAHEADS
    printf("LOOKAHEADS:\n");
    for (auto entry : lookaheads) {
      printf("ITEM: %s\n", debug_str(entry.first.item, grammar, userdata, to_string).c_str());
      printf("IN: %s\n", debug_str(entry.first.kernel_state, grammar, userdata, to_string).c_str());
      for (const auto& lookahead : entry.second) {
        printf(" %s", debug_str(lookahead, userdata, to_string).c_str());
      }
      printf("\n");
    }

    for (auto propegate_pair : propegation) {
      // This is an unsafe reference if we use an unordered_map as it might rehash
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

struct State;
struct StateEdge {
  const State* shift_state = nullptr;
  const GrammarRule* reduce_rule = nullptr;
  // TODO(trevor): Error edges / recovery
};

struct StateEdgeRange {
  GrammarTerminal range;
  StateEdge edge;

  bool operator<(const StateEdgeRange& rhs) const {
    // We only compare range here and do not look at edge because we use the range
    // effectively as a key (almost like a map, except it's not a specific value it's a range)
    // However we're storing this in a vector for performance and coherency
    return range < rhs.range;
  }

  // Used to binary search ids in a sorted vector of ranges
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

  // TODO(trevor): Need to be able to hash this and join them
};

struct State {
  // This is a pointer because there are many states
  // that share the same exact set of transitions
  // This is effectively ACTION[state, terminal] in the dragon book
  const StateTransitions* transitions = nullptr;

  // We never need to share these as there will never be a goto that has the same state within it
  // This is effectively GOTO[state, rule] in the dragon book
  std::unordered_map<const GrammarRule*, const State*> reductions;

  // This is useful for debug printing and tracking back to the source
  const GrammarSymbol* symbol = nullptr;
};

struct Table {
  static std::atomic<uint32_t> allocated_count;

  std::vector<State> states;
  std::vector<StateTransitions> transitions;
};
std::atomic<uint32_t> Table::allocated_count = 0;

Table* parser_table_create(
  TowerNode* root,
  uint8_t* userdata,
  ParserTableResolveReference resolve,
  ParserTableIdToString to_string
) {
  Grammar grammar;
  parser_grammar_create(&grammar, root, userdata, resolve);

  auto states = parser_table_lr0_items(grammar, userdata, to_string);
  std::set<std::set<LR0Item>> kernel_states;

  printf("completed - states: %zu\n", states.size());
  for (auto it = states.begin(); it != states.end();) {
    printf("%s\n", debug_str(*it, grammar, userdata, to_string).c_str());
    auto state = std::move(states.extract(it++).value());
    parser_table_filter_kernels_only(state);
    assert(!state.empty());
    printf("KERNELS ONLY: %s\n", debug_str(state, grammar, userdata, to_string).c_str());
    kernel_states.insert(std::move(state));

    // TODO(trevor): Build the actual final states here for the table
    // We know kernel_states is the same size as states, and the indices will always match up
    // so I think at this point we can allocate all the states and start using state indices or pointers
    // this might even affect later algorithms, instead of using std::set<std::set<LR0Item>> because we can
    // concretely talk about specific states (we know they will never change), lets look into this
    // can probably also get rid of std::set for ordering in some places, since we have a determanistic order
    // like the LR0ItemInKernelState, that state can just be an index and compared faster

    // We can also compute the goto's on terminals in parser_table_lr0_items for
    // each state, maybe it can just output State*s?
    // ah, so we know state indices, so our gotos is really just index to index on action
    // but we can really do this by making states as we go

    // parser_table_lr0_items will take in Table* and create states (every time it inserts into the set of sets)
    // if it's already there, it needs to link it up to an existing state index
    // hmm, it has to create a StateTransitions object that we fill out, and we won't know when its done until the end
    // maybe give every state it's own StateTransitions until the end when we're done building it
    // then insert them all into an unordered_map<StateTransitions, uint32_t> and share them (to the index into the
    // std::vector<StateTransitions> transitions;

    // We can't build reductions yet (we can build the reductions table, but not knowing if a state transition is a reduce)
    // or... we know it's a reduce but we don't know the lookahead yet

    // maybe we can hold off on create reduce edges until the end when we have the lookahead
  }

  GrammarSets sets;
  parser_table_compute_grammar_sets(grammar, sets);

  assert(sets.first.size() == grammar.non_terminals.size());
  assert(sets.nullable.size() == grammar.non_terminals.size());

  printf("%s\n", debug_str(sets, grammar, userdata, to_string).c_str());

  parser_table_lalr_lookaheads(grammar, sets, kernel_states, userdata, to_string);

  //void* memory = tower_memory_allocate(sizeof(Table) + userdata_bytes);
  //++Table::allocated_count;
  //Table* table = new (memory) Table();
  //return table;

  return nullptr;
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
  std::vector<State*> stack;

  // TODO(trevor): The recgonizer needs to hold on to these (reference count?)
  Stream* stream = nullptr;

  // Note thhat we never actually use the table, we just need to keep the states inside the table alive
  const Table* table = nullptr;
  const Grammar* grammar = nullptr;
};

Recognizer* parser_recognizer_create(Table* table, Stream* stream) {
  abort();
  return nullptr;
}

// Destructs the parser and frees it's memory
void parser_recognizer_destroy(Recognizer* recognizer) {
  abort();
}

TowerNode* parser_recognizer_step(Recognizer* recognizer, bool* running) {
  assert(*running);

  uint32_t id = PARSER_ID_EOF;
  uint32_t start = PARSER_ID_EOF;
  uint32_t length = 0;

  TowerNode* node_or_null = parser_stream_read(recognizer->stream, &id, &start, &length);
  const State* state = recognizer->stack.back();
  const StateTransitions* transitions = state->transitions;

  const StateEdge* found_edge = nullptr;

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
    if (found_edge->shift_state) {
      recognizer->stack.push_back(found_edge->shift_state);
    } else if (found_edge->reduce_rule) {
      // We should always have at least one state on the stack after reducing
      assert(recognizer->stack.size() > found_edge->reduce_rule->symbols.size());
      size_t erase_index = recognizer->stack.size() - found_edge->reduce_rule->symbols.size();
      recognizer->stack.erase(recognizer->stack.begin() + erase_index, recognizer->stack.end());
      State* top_state = recognizer->stack.back();
      auto found_reduction = top_state->reductions.find(found_edge->reduce_rule);
      // We should always find it otherwise we built the table wrong
      assert(found_reduction != top_state->reductions.end());
      // The next state is the dictated by the GOTO[state, 
      recognizer->stack.push_back(found_reduction->second);

      // TODO(trevor): Report the reduction to the user, callback?
      // Or maybe we return some sort of structure that indicates what happened so we allow the user to call
    } else {
      abort(); // ERROR!
    }
  } else {
    abort(); // ERROR!
  }

  abort();
  return node_or_null;
}

void parser_tests_internal() {
  
}
