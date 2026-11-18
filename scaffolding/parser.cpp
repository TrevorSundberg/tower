#include "compiler-utf8.hpp"
#include "compiler-bytes.hpp"
#include "parser.hpp"
#include <unordered_map>
#include <string>
#include <vector>
#include <cassert>
#include <sstream>
#include <algorithm>
#include <memory>
#include <cstdio>
#include <cstring>
#include <cstdarg>

// Note that IDs are always uint32_t, this is because realistically a language will never need
// more than this many ids to represent all tokens / characters. We also put unicode code-points
// within the uint32_t and it makes no sense for it to expand to anything greater in size
// We don't use -1 just to ensure it never gets mixed with TOWER_INVALID_INDEX
const uint32_t PARSER_ID_LOOKAHEAD = (uint32_t)-3;

static bool parser_debug_trace = false;

void parser_set_debug_trace(bool enabled) {
  parser_debug_trace = enabled;
}

static void parser_trace_write(const char* format, ...) {
  va_list args;
  va_start(args, format);
  vprintf(format, args);
  va_end(args);
}

// Guard the call, not just its body: constructing LR-state debug strings is
// much more expensive than building the table itself. Disabled tracing must
// not evaluate those arguments.
#define parser_trace(...) do { if (parser_debug_trace) parser_trace_write(__VA_ARGS__); } while (false)

// The tests come first so that we don't see the definition of any structs
void parser_tests_internal();
void parser_tree_tests();
void parser_tests() {
  parser_tests_internal();

  const size_t tower_memory_initial_count = tower_memory_get_allocated_count();

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
    size_t start = 0;
    size_t length = 0;
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

  assert(tower_memory_get_allocated_count() == tower_memory_initial_count);

  // Test infinite recursion (rules with no base case)
  // Test missing rules (which we actually want to be able to iteratively add rules and have it work...)
  // Test orphaned rules (no references to them)
  // Test token strings
  // Test recursive rules
  parser_tree_tests();
  assert(tower_memory_get_allocated_count() == tower_memory_initial_count);
}

template <typename T>
T* create_component(TowerNode* owner) {
  TowerComponent* component =
    tower_component_create(owner, T::compiletime_type, sizeof(T), [](TowerComponent* component, void* userdata) {
      ((T*)userdata)->~T();
    });


  void* userdata = tower_component_get_userdata(component);
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
size_t parser_decode_utf8_codepoint(const char* begin, const char* end, uint32_t* codepoint) {
  return tower_utf8_decode(reinterpret_cast<const uint8_t*>(begin), size_t(end - begin), codepoint);
}

size_t parser_encode_utf8_codepoint(uint32_t codepoint, char* buffer, size_t buffer_size) {
  return tower_utf8_encode(codepoint, reinterpret_cast<uint8_t*>(buffer), buffer_size);
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
    size_t bytes_read = parser_decode_utf8_codepoint(utf8_begin, utf8_end, &codepoint);
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

TowerNode* parser_range_create_subtree(TowerNode* parent, uint32_t start_id, uint32_t end_id) {
  TowerNode* child = create_attached_child_without_ref(parent);
  Range* component = parser_range_create(child);
  parser_range_set_start(component, start_id);
  parser_range_set_end(component, end_id);
  return child;
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

char* parser_copy_string(const std::string& str);

char* parser_tree_debug_string(TowerNode* root) {
  std::ostringstream out;
  struct Entry { TowerNode* node; size_t depth; };
  std::vector<Entry> pending;
  if (root) pending.push_back({root, 0});
  else out << "<empty tree>\n";
  while (!pending.empty()) {
    Entry entry = pending.back();
    pending.pop_back();
    out << std::string(entry.depth * 2, ' ');
    const char* member = tower_node_get_parent_member_name(entry.node);
    if (member && *member) out << member << ": ";
    auto* match = (Match*)tower_node_get_component_userdata(entry.node, parser_match_get_type());
    if (match) {
      bool is_rule = match->rule_index != TOWER_INVALID_INDEX;
      out << (is_rule ? "rule " : "token ");
      out << (match->label.empty() ? std::to_string(match->id) : match->label);
      if (is_rule) out << " #" << match->rule_index;
      out << " [" << match->start << ", " << match->start + match->length << ")";
    } else {
      out << "node";
    }
    out << '\n';
    for (size_t i = tower_node_get_child_count(entry.node); i > 0; --i) {
      pending.push_back({tower_node_get_child(entry.node, i - 1), entry.depth + 1});
    }
  }
  return parser_copy_string(out.str());
}

void parser_tree_debug_print(TowerNode* root) {
  char* text = parser_tree_debug_string(root);
  fputs(text, stdout);
  tower_memory_free(text);
}

TowerNode* parser_match_create_subtree(TowerNode* parent, uint32_t id, size_t start, size_t length) {
  TowerNode* child = create_attached_child_without_ref(parent);
  Match* component = parser_match_create(child);
  parser_match_set_id(component, id);
  parser_match_set_start(component, start);
  parser_match_set_length(component, length);
  return child;
}


struct Stream {
  ParserStreamDestructor destructor = nullptr;
  ParserStreamRead read = nullptr;
  std::string error;
  bool buffered = false;
  TowerNode* buffered_node = nullptr;
  uint32_t buffered_id = PARSER_ID_EOF;
  size_t buffered_start = 0, buffered_length = 0;
  std::string buffered_error;
};

Stream* parser_stream_create(size_t userdata_bytes, ParserStreamDestructor destructor, ParserStreamRead read) {
  void* memory = tower_memory_allocate(sizeof(Stream) + userdata_bytes);
  Stream* stream = new (memory) Stream();
  stream->destructor = destructor;
  stream->read = read;
  return stream;
}

void parser_stream_destroy(Stream* stream) {
  if (stream->buffered_node) tower_node_release_ref(stream->buffered_node);
  if (stream->destructor) {
    stream->destructor(stream, parser_stream_get_userdata(stream));
  }
  stream->~Stream();
  tower_memory_free(stream);
}

void* parser_stream_get_userdata(Stream* stream) {
  if (stream == nullptr) {
    return nullptr;
  }
  return ((uint8_t*)stream) + sizeof(Stream);
}

Stream* parser_stream_from_userdata(void* userdata) {
  if (userdata == nullptr) {
    return nullptr;
  }
  return (Stream*)((uint8_t*)userdata - sizeof(Stream));
}

TowerNode* parser_stream_read(
  Stream* stream,
  uint32_t* id,
  size_t* start_index,
  size_t* length
) {
  if (stream->buffered) {
    stream->buffered = false;
    *id = stream->buffered_id; *start_index = stream->buffered_start; *length = stream->buffered_length;
    stream->error = std::move(stream->buffered_error);
    auto* node = stream->buffered_node; stream->buffered_node = nullptr;
    return node;
  }
  stream->error.clear();
  return stream->read(stream, parser_stream_get_userdata(stream), id, start_index, length);
}

const char* parser_stream_get_error(Stream* stream) {
  return stream->error.c_str();
}

void parser_stream_set_error(Stream* stream, const char* error) {
  stream->error = error;
}

struct StreamUtf8 {
  CompilerText data;
  const char* utf8_begin = nullptr;
  bool allocation_failed = false;
};

TowerNode* parser_stream_utf8_read(
  Stream* stream,
  void* userdata,
  uint32_t* id,
  size_t* start_index,
  size_t* length
) {
  StreamUtf8* stream_utf8 = (StreamUtf8*)userdata;
  const auto& data = stream_utf8->data;
  const char*& utf8_begin = stream_utf8->utf8_begin;

  if (stream_utf8->allocation_failed) parser_stream_set_error(stream, "Unable to allocate UTF-8 stream source");
  size_t bytes_read = stream_utf8->allocation_failed ? 0 : parser_decode_utf8_codepoint(utf8_begin, data.c_str() + data.size(), id);
  if (bytes_read > 0) {
    *length = bytes_read;
    *start_index = utf8_begin - data.c_str();
    utf8_begin += bytes_read;
  } else {
    *id = PARSER_ID_EOF;
    *start_index = PARSER_ID_EOF;
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
  Stream* stream = parser_stream_create(sizeof(StreamUtf8), [](Stream*, void* userdata) {
    ((StreamUtf8*)userdata)->~StreamUtf8();
  }, parser_stream_utf8_read);
  void* userdata = parser_stream_get_userdata(stream);
  StreamUtf8* stream_utf8 = new (userdata) StreamUtf8();
  stream_utf8->allocation_failed = !stream_utf8->data.assign({utf8_begin, size_t(utf8_end - utf8_begin)});
  stream_utf8->utf8_begin = stream_utf8->data.c_str();
  return stream;
}


struct StreamRecognizer {
  Recognizer* recognizer = nullptr;
  bool complete = false;
};

TowerNode* parser_stream_recognizer_read(
  Stream* stream,
  void* userdata,
  uint32_t* id,
  size_t* start_index,
  size_t* length
) {
  StreamRecognizer* stream_recognizer = (StreamRecognizer*)userdata;
  bool running = !stream_recognizer->complete;
  TowerNode* node = nullptr;
  while (running && !node) {
    node = parser_recognizer_step(stream_recognizer->recognizer, &running);
  }
  stream_recognizer->complete = !running;
  stream->error = parser_recognizer_get_error(stream_recognizer->recognizer);

  if (node) {
    Match* match = (Match*)tower_node_get_component_userdata(node, parser_match_get_type());
    assert(match);
    *id = match->id;
    *start_index = match->start;
    *length = match->length;
    return node;
  }

  *id = PARSER_ID_EOF;
  *start_index = PARSER_ID_EOF;
  *length = 0;
  return nullptr; 
}

Stream* parser_stream_recognizer_create(Recognizer* recognizer) {
  Stream* stream = parser_stream_create(sizeof(StreamRecognizer), nullptr, parser_stream_recognizer_read);
  void* userdata = parser_stream_get_userdata(stream);
  StreamRecognizer* stream_recognizer = new (userdata) StreamRecognizer();
  stream_recognizer->recognizer = recognizer;
  return stream;
}

struct GrammarRule;
struct GrammarNonTerminal {
  size_t index = TOWER_INVALID_INDEX;
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
  std::string capture;

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
    parser_trace("MAKE SURE const GrammarSymbol* LESS CALLED\n");
    return *symbol < *rhs.symbol;
  }
  bool operator==(const GrammarSymbolRef& rhs) const {
    parser_trace("MAKE SURE const GrammarSymbol* EQUALS CALLED\n");
    return *symbol == *rhs.symbol;
  }
};

struct GrammarRule {
  size_t index = (size_t)-1;
  Rule* rule = nullptr;
  bool generated = false;
  GrammarNonTerminal* non_terminal = nullptr;
  std::vector<GrammarSymbol> symbols;
};

struct Grammar {
  // The first non-terminal is the starting non-terminal S'
  std::vector<GrammarNonTerminal> non_terminals;
  // The first rule is the starting rule S'
  std::vector<GrammarRule> rules;

  void* userdata = nullptr;
  ParserTableIdToString to_string = nullptr;
};

std::string parser_grammar_create(Grammar& grammar, TowerNode* root, void* userdata, ParserTableResolveReference resolve) {
  std::vector<Rule*> rules;
  rules.reserve(tower_node_get_child_count(root));

  // Walk all the rules we have
  for (size_t p = 0;; ++p) {
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
  for (size_t i = 0; i < rules.size(); ++i) {
    Rule* rule = rules[i];

    size_t grammar_rule_index = grammar.rules.size();
    GrammarRule& grammar_rule = grammar.rules.emplace_back();
    grammar_rule.rule = rule;
    grammar_rule.generated = rule->generated;
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
  for (size_t r = 1; r < grammar.rules.size(); ++r) {
    GrammarRule& grammar_rule = grammar.rules[r];
    TowerNode* rule_node = tower_component_get_owner(tower_component_from_userdata(grammar_rule.rule));
    
    // Assume we will have at least as many grammar symbols as we have children
    // Note that strings often contain many grammar symbols packed in a single component
    std::vector<GrammarSymbol>& symbols = grammar_rule.symbols;
    symbols.reserve(tower_node_get_child_count(rule_node));

    // Walk over all the grammar symbols
    for (size_t g = 0;; ++g) {
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
          symbol.capture = reference->capture;
        } else {
          uint32_t id = PARSER_ID_EOF;
          // Otherwise, this might be a reference to a terminal
          if (resolve) {
            id = resolve(userdata, reference->name.c_str());
          }

          if (id == PARSER_ID_EOF) {
            return "Unresolved grammar rule: " + reference->name;
          } else {
            GrammarSymbol& symbol = symbols.emplace_back();
            symbol.symbol_node = symbol_node;
            symbol.capture = reference->capture;
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
  return {};
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
  size_t rule_index = TOWER_INVALID_INDEX;
  size_t symbol_index = TOWER_INVALID_INDEX;

  // Note that GrammarTerminal is only passed here for compatability with the LR1Item constructor
  inline LR0Item(size_t rule_index, size_t symbol_index, const GrammarTerminal* lookahead) :
    LR0Item(rule_index, symbol_index) {
  }
  LR0Item(size_t rule_index_, size_t symbol_index_) :
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
    size_t hash = std::hash<size_t>()(key.rule_index);
    return hash_combine(hash, std::hash<size_t>()(key.symbol_index));
  }
};

struct LR1Item : LR0Item {
  GrammarTerminal lookahead;

  inline LR1Item(size_t rule_index, size_t symbol_index, const GrammarTerminal* lookahead) :
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
    parser_trace("MAKE SURE const LRSet<LR0Item>* HASH CALLED\n");
    return std::hash<LRSet<LR0Item>>()(*set);
  }
};

template <>
struct std::equal_to<const LRSet<LR0Item>*> {
  bool operator()(const LRSet<LR0Item>* lhs, const LRSet<LR0Item>* rhs) const {
    parser_trace("MAKE SURE const LRSet<LR0Item>* EQUALS CALLED\n");
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
    parser_trace("MAKE SURE StateBuilderEdge HASH CALLED\n");
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
    parser_trace("MAKE SURE const SortedVector<StateBuilderEdge>* HASH CALLED\n");
    return std::hash<SortedVector<StateBuilderEdge>>()(*set);
  }
};

template <>
struct std::equal_to<const SortedVector<StateBuilderEdge>*> {
  bool operator()(const SortedVector<StateBuilderEdge>* lhs, const SortedVector<StateBuilderEdge>* rhs) const {
    parser_trace("MAKE SURE const SortedVector<StateBuilderEdge>* EQUALS CALLED\n");
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

    // Compute FIRST of the entire suffix followed by the item's lookahead.
    // Looking at only the next symbol loses tokens after nullable sequences.
    SortedVector<GrammarTerminal> closure_lookaheads;
    if (sets_for_lr1) {
      bool nullable_suffix = true;
      const auto& symbols = grammar.rules[item.rule_index].symbols;
      for (size_t i = item.symbol_index + 1; i < symbols.size(); ++i) {
        const auto& after = symbols[i];
        if (!after.non_terminal) {
          closure_lookaheads.insert(after.terminal);
          nullable_suffix = false;
          break;
        }
        const auto& first = sets_for_lr1->first[after.non_terminal->index];
        closure_lookaheads.insert(first.begin(), first.end());
        if (!sets_for_lr1->nullable[after.non_terminal->index]) {
          nullable_suffix = false;
          break;
        }
      }
      if (nullable_suffix) closure_lookaheads.insert(*parser_table_get_lookahead(item));
    }

    // We only care if the grammar symbol is a reference (another rule to expand)
    if (symbol && symbol->non_terminal) {
      for (GrammarRule* rule : symbol->non_terminal->rules) {
        auto add_item = [&](const GrammarTerminal* terminal_or_null) {
          LRItem nonkernel_item(rule->index, 0, terminal_or_null);

          // Attempt to insert it and if it's the first time it's been inserted, we need to process it
          if (terminal_or_null) {
            parser_trace("adding terminal: %d\n", (int)terminal_or_null->start);
          }
          if (items.insert(grammar, nonkernel_item)) {
            parser_trace("added\n");
            unprocessed.push_back(nonkernel_item);
          } else {
            parser_trace("did not add\n");
          }
        };

        if (sets_for_lr1) {
          for (const auto& terminal : closure_lookaheads) add_item(&terminal);
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
        // A disjoint/equal terminal range has the same transition for every
        // member. Partially overlapping ranges still require table partitioning.
        if (goto_symbol.terminal.start >= symbol->terminal.start && goto_symbol.terminal.end <= symbol->terminal.end) {
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
  std::vector<LR0Item> diagnostic_items; // derived grammar positions, error path only
  // This is a pointer because there are many states
  // that share the same exact set of transitions
  // This is effectively ACTION[state, terminal] in the dragon book
  const StateTransitions* transitions = nullptr;
  // Safe default reduction: every populated action is the same EOF reduction.
  // This lets self-delimiting declarations finish without lexing the next revision.
  const GrammarRule* default_reduce = nullptr;

  // We never need to share these as there will never be a goto that has the same state within it
  // This is effectively GOTO[state, rule] in the dragon book
  std::unordered_map<const GrammarNonTerminal*, const State*> gotos_after_reduction;

  // This is useful for debug printing and tracking back to the source
  const GrammarSymbol* symbol = nullptr;
};

struct Table {
  ParserDescribeRule describe_rule = nullptr;
  Grammar grammar;
  std::vector<State> states;
  std::vector<std::unique_ptr<StateTransitions>> shared_transitions;
  ParserTableMode mode = ParserTableMode::WholeInput;
};

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
    table_builder.total_kernel_lr_items += starting.items.kernels.size();
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
    parser_trace("added state\n");
    return builder;
  };

  while (!unprocessed.empty()) {

    StateBuilder& state_builder = *unprocessed.back(); // I in dragon book;
    unprocessed.pop_back();
    
    parser_trace("state %s\n", debug_str(state_builder.items, grammar).c_str());
    // X in dragon book
    // This is potentially unsafe because we resize the number of states as we add more
    // However, upon resizing each element is moved, and since we don't use any custom allocators
    // then the moved memory should be unchanged (pointers and iterators to it should be valid, but not guaranteed by std)
    // https://stackoverflow.com/questions/11021764/does-moving-a-vector-invalidate-iterators
    for (GrammarSymbolRef symbol_ref : state_builder.items.symbols) {
      const GrammarSymbol* symbol = symbol_ref.symbol;
      parser_trace("capacity %d size %d\n", (int)table_builder.states.capacity(), (int)table_builder.states.size());
      parser_trace("from state %s\n", debug_str(state_builder.items, grammar).c_str());
      parser_trace("symbol %s\n", debug_str(*symbol, grammar).c_str());
      LRSet<LR0Item> gotos = parser_table_goto(grammar, nullptr, state_builder.items, *symbol);
      parser_trace("gotos %s\n", debug_str(gotos, grammar).c_str());
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
  const GrammarSets& sets,
  ParserTableMode mode
) {
  // By reserving the total maximum amount we have, we guarantee this will never reallocate
  OrderedMap<LR0ItemInKernelState, SortedVector<GrammarTerminal>> lookaheads;
  lookaheads.reserve(table_builder.total_kernel_lr_items);

  // The propegation isn't just an LR0 item, it's a specific LR0 item in a state
  // It's significant because when we go to look up 
  OrderedMap<LR0ItemInKernelState, SortedVector<LR0ItemInKernelState>> propegation;
  propegation.reserve(table_builder.total_kernel_lr_items);

  // By default the starting rulne has an implict lookahead of EOF / $
  // Empty productions may also be kernels in the starting closure.
  assert(table_builder.states.size() > 0);
  StateBuilder& state = *table_builder.states[0].get();
  assert(!state.items.kernels.empty());
  const LR0Item& start_kernel = state.items.kernels[0];
  assert(start_kernel.rule_index == 0);
  assert(start_kernel.symbol_index == 0);
  LR0ItemInKernelState start_item(start_kernel, 0);
  lookaheads[start_item].insert(GrammarTerminal {
    .start = PARSER_ID_EOF,
    .end = PARSER_ID_EOF,
  });
  if (mode == ParserTableMode::Constructs) {
    // Equivalent boundary lookaheads to a sequence of start-rule constructs.
    // Keep these in the ordinary LALR conflict check, not a runtime shift bias.
    const auto& first = sets.first[grammar.rules[0].symbols[0].non_terminal->index];
    lookaheads[start_item].insert(first.begin(), first.end());
  }

  for (const auto& state_builder : table_builder.states) {
    for (const auto& kernel_item : state_builder->items.kernels) {
      assert(parser_table_is_kernel_item(grammar, kernel_item));
      parser_trace("KERNEL ITEM BEGIN: %s\n", debug_str(kernel_item, grammar).c_str());
      LRSet<LR1Item> lr1_items;
      GrammarTerminal lookahead {
        .start = PARSER_ID_LOOKAHEAD,
        .end = PARSER_ID_LOOKAHEAD,
      };
      LR1Item lr1_item(kernel_item, &lookahead);
      lr1_items.insert(grammar, lr1_item);

      parser_table_closure(grammar, &sets, lr1_items);

      // Empty productions reduce in this state without traversing a GOTO edge.
      for (const auto& closure_item : lr1_items.kernels) {
        if (!grammar.rules[closure_item.rule_index].symbols.empty()) continue;
        LR0ItemInKernelState destination(closure_item, state_builder->state_index);
        if (closure_item.lookahead.start == PARSER_ID_LOOKAHEAD) {
          LR0ItemInKernelState source(kernel_item, state_builder->state_index);
          propegation[source].insert(destination);
        } else {
          lookaheads[destination].insert(closure_item.lookahead);
        }
      }

      for (GrammarSymbolRef symbol_ref : lr1_items.symbols) {
        const GrammarSymbol* symbol = symbol_ref.symbol;
        // Note that if we did goto on 'kernel_state' we would need to run closure first as the state is kernel items only
        // Goto also preserves the lookaheads
        parser_trace("KERNEL ITEM: %s\n", debug_str(kernel_item, grammar).c_str());
        parser_trace("KERNEL ITEM CLOSURE: %s\n", debug_str(lr1_items, grammar).c_str());
        parser_trace("SYMBOL: %s\n", debug_str(*symbol, grammar).c_str());
        LRSet<LR1Item> goto_state_lr1 = parser_table_goto(grammar, &sets, lr1_items, *symbol);
        parser_trace("GOTO: %s\n", debug_str(goto_state_lr1, grammar).c_str());
        // Always should have items since we only query with valid symbols from lr1_items
        assert(goto_state_lr1.kernels.size() != 0);
        parser_trace("GOTO KERNELS: %s\n", debug_str(goto_state_lr1, grammar).c_str());
        
        // Use the full LR0 state's transition. A single kernel's closure may
        // advance only a subset of the destination's kernels.
        size_t destination_state = TOWER_INVALID_INDEX;
        if (symbol->non_terminal) {
          for (const auto& transition : state_builder->gotos_after_reduction)
            if (transition.non_terminal == symbol->non_terminal)
              destination_state = transition.shift_state_index;
        } else {
          for (const auto& transition : state_builder->edges)
            if (!transition.reduce_rule && transition.terminal == symbol->terminal)
              destination_state = transition.shift_state_index;
        }
        assert(destination_state != TOWER_INVALID_INDEX);

        for (const LR1Item& propegate_to : goto_state_lr1.kernels) {
          LR0ItemInKernelState propegation_dest(propegate_to, destination_state);

          // Is lookahead propegated?
          if (propegate_to.lookahead.start == PARSER_ID_LOOKAHEAD) {
            assert(propegate_to.lookahead.end == PARSER_ID_LOOKAHEAD);
            LR0ItemInKernelState propegation_source(kernel_item, state_builder->state_index);
            propegation[propegation_source].insert(propegation_dest);
          } else {
            // Otherwise it's generated / spontaneous
            parser_trace("SPONTANEOUS %s\n", debug_str(propegate_to.lookahead, grammar).c_str());
            lookaheads[propegation_dest].insert(propegate_to.lookahead);
          }
        }
      }

      parser_trace("%s\n", debug_str(lr1_items, grammar).c_str());
    }
  }

  for (const auto& entry : propegation) {
    parser_trace("FROM: %s\n", debug_str(entry.first, grammar).c_str());
    parser_trace("IN: %s\n", debug_str(table_builder.states[entry.first.state_index]->items, grammar).c_str());
    for (const auto& to_states : entry.second) {
      parser_trace("  TO:\n%s\n", debug_str(to_states, grammar).c_str());
      parser_trace("  IN: %s\n", debug_str(table_builder.states[to_states.state_index]->items, grammar).c_str());
    }
  }

  // From the above algorithm, we produced spontaneous lookaheads (real symbols)
  // as well as the propegation map. Now propegate lookaheads until there's none left
  bool has_changed = false;
  do {
    has_changed = false;

    // PRINT DEBUG LOOKAHEADS
    parser_trace("LOOKAHEADS:\n");
    for (const auto& entry : lookaheads) {
      parser_trace("ITEM: %s\n", debug_str(entry.first, grammar).c_str());
      parser_trace("IN: %s\n", debug_str(table_builder.states[entry.first.state_index]->items, grammar).c_str());
      for (const auto& lookahead : entry.second) {
        parser_trace(" %s", debug_str(lookahead, grammar).c_str());
      }
      parser_trace("\n");
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

std::string parser_table_build_states(
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
    state.diagnostic_items.assign(builder.items.kernels.begin(), builder.items.kernels.end());
    state.diagnostic_items.insert(state.diagnostic_items.end(), builder.items.nonkernels.begin(), builder.items.nonkernels.end());

    StateTransitions*& transitions = shared_transitions[&builder.edges];
    if (!transitions) {
      table.shared_transitions.push_back(std::make_unique<StateTransitions>());
      transitions = table.shared_transitions.back().get();

      const auto add_edge = [&](const GrammarTerminal& terminal) -> StateEdge& {
        if (terminal.start == terminal.end) {
          // Make sure there are no duplicates
          assert(!transitions->direct_edges.contains(terminal.start));
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
          if (!last_edge->terminal.entirely_less(builder_edge.terminal)) {
            const char* kind = last_edge->reduce_rule && builder_edge.reduce_rule ? "reduce/reduce" :
              last_edge->reduce_rule || builder_edge.reduce_rule ? "shift/reduce" : "shift/shift";
            const auto describe = [&](const StateBuilderEdge& edge) {
              const auto rule_text = [&](const GrammarRule& rule) {
                if (table.describe_rule) {
                  auto text = table.describe_rule(table.grammar.userdata, rule.index);
                  if (!text.empty()) return text;
                }
                return debug_str(rule, table.grammar);
              };
              if (edge.reduce_rule) return "finish " + rule_text(*edge.reduce_rule);
              std::string text = "continue "; size_t count = 0;
              const auto append = [&](const auto& items) {
                for (const auto& item : items) {
                  const auto* symbol = parser_table_get_grammar_symbol_or_null(table.grammar, item);
                  if (!symbol || symbol->non_terminal || symbol->terminal.entirely_less(edge.terminal) || edge.terminal.entirely_less(symbol->terminal)) continue;
                  if (count++) text += " or ";
                  text += rule_text(table.grammar.rules[item.rule_index]);
                  if (count == 3) break;
                }
              };
              append(builder.items.kernels);
              if (!count) append(builder.items.nonkernels);
              return text;
            };
            return "Grammar conflict (" + std::string(kind) + ") on " + debug_str(builder_edge.terminal, table.grammar)
              + ": the parser could " + describe(*last_edge) + ", or " + describe(builder_edge)
              + ". Make these alternatives distinct; their order does not resolve the conflict.";
          }
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

  parser_trace("REDUCED SHARED TRANSITIONS: %d to %d\n", (int)table.states.size(), (int)shared_transitions.size());
  return {};
}

uint32_t parser_table_non_terminal_resolve_reference(void* userdata, const char* name) {
  assert(userdata);
  Table* table = (Table*)userdata;
  // A few sanity checks to make sure we got a proper Table object
  assert(table->states.size() > 0);
  assert(table->grammar.non_terminals.size() > 0);
  assert(table->grammar.rules.size() >= table->grammar.non_terminals.size());

  for (const auto& non_terminal : table->grammar.non_terminals) {
    if (non_terminal.name == name) {
      return non_terminal.index;
    }
  }
  return PARSER_ID_EOF;
}

char* parser_copy_string(const std::string& str) {
  // Include the null terminator
  void* str_mem = tower_memory_allocate(str.size() + 1);
  memcpy(str_mem, str.c_str(), str.size() + 1);
  return (char*)str_mem;
}

char* parser_table_utf8_id_to_string(void* userdata, uint32_t id) {
  switch (id) {
    case '\n': return parser_copy_string("'\\n'");
    case '\r': return parser_copy_string("'\\r'");
    case '\t': return parser_copy_string("'\\t'");
    case '\0': return parser_copy_string("'\\0'");
    case '\\': return parser_copy_string("'\\\\'");
    case '\'': return parser_copy_string("'\\\''");
  }
  size_t encode_size = parser_encode_utf8_codepoint(id, nullptr, 0);
  if (!encode_size) return nullptr;
  // Include the null terminator, and two '' characters
  char* str_mem = (char*)tower_memory_allocate(encode_size + 3);
  str_mem[0] = '\'';
  str_mem[encode_size + 1] = '\'';
  str_mem[encode_size + 2] = 0;
  parser_encode_utf8_codepoint(id, str_mem + 1, encode_size);
  return str_mem;

}

char* parser_table_non_terminal_id_to_string(void* userdata, uint32_t id) {
  assert(userdata);
  Table* table = (Table*)userdata;
  // A few sanity checks to make sure we got a proper Table object
  assert(table->states.size() > 0);
  assert(table->grammar.non_terminals.size() > 0);
  assert(table->grammar.rules.size() >= table->grammar.non_terminals.size());
  if (id >= table->grammar.non_terminals.size()) return nullptr;
  return parser_copy_string(table->grammar.non_terminals[id].name);
}

Table* parser_table_create(
  TowerNode* root,
  void* userdata,
  ParserTableResolveReference resolve,
  ParserTableIdToString to_string,
  char** error,
  ParserTableMode mode,
  ParserDescribeRule describe_rule
) {
  if (error) *error = nullptr;
  void* memory = tower_memory_allocate(sizeof(Table));
  Table* table = new (memory) Table();
  table->mode = mode;
  table->describe_rule = describe_rule;
  const auto fail = [&](const std::string& message) -> Table* {
    if (error) *error = parser_copy_string(message);
    parser_table_destroy(table);
    return nullptr;
  };
  {
    if (!root || !tower_node_get_child_count(root)) return fail("Empty grammar");
    Grammar& grammar = table->grammar;
    grammar.userdata = userdata;
    grammar.to_string = to_string;
    std::string message = parser_grammar_create(grammar, root, userdata, resolve);
    if (!message.empty()) return fail(message);
    assert(grammar.rules.size() > 0);
    assert(grammar.non_terminals.size() > 0);
    parser_trace("%s\n", debug_str(grammar).c_str());

    TableBuilder table_builder;
    parser_table_lr0_items(table_builder, grammar);
    assert(table_builder.states.size() > 0);
    assert(table_builder.total_kernel_lr_items > 0);

    GrammarSets sets;
    parser_table_compute_grammar_sets(grammar, sets);
    assert(sets.first.size() == grammar.non_terminals.size());
    assert(sets.nullable.size() == grammar.non_terminals.size());
    parser_trace("%s\n", debug_str(sets, grammar).c_str());

    parser_table_lalr_lookaheads(table_builder, grammar, sets, mode);

    message = parser_table_build_states(*table, table_builder);
    if (!message.empty()) return fail(message);
    for (auto& state : table->states) {
      const auto& transitions = *state.transitions;
      auto eof = transitions.direct_edges.find(PARSER_ID_EOF);
      if (eof == transitions.direct_edges.end() || !eof->second.reduce_rule) continue;
      auto* rule = eof->second.reduce_rule;
      bool same = true;
      for (const auto& [id, edge] : transitions.direct_edges) same &= edge.reduce_rule == rule;
      for (const auto& edge : transitions.range_edges) same &= edge.edge.reduce_rule == rule;
      if (same) state.default_reduce = rule;
    }
    parser_trace("%s\n", debug_str(*table).c_str());

    return table;
  }
}

void parser_table_destroy(Table* table) {
  if (!table) {
    return;
  }

  table->~Table();
  tower_memory_free(table);
}

struct ParseChild {
  TowerNode* node = nullptr; // Owned leaf; null denotes a capture wrapper.
  std::string capture;
  size_t first = TOWER_INVALID_INDEX, next = TOWER_INVALID_INDEX;
};

struct ParseForest {
  size_t first = TOWER_INVALID_INDEX, last = TOWER_INVALID_INDEX;
};

struct StackState {
  const State* state = nullptr;
  // Arena-linked forests concatenate in O(1), including generated repetitions.
  ParseForest nodes;
  size_t start = 0;
  size_t length = 0;
};

struct Recognizer {
  std::vector<StackState> stack;
  std::vector<ParseChild> forest;
  Stream* stream = nullptr;       // Borrowed; caller keeps both dependencies alive.
  const Table* table = nullptr;
  TowerNode* read_node_or_null = nullptr; // Owned lookahead, transferred on shift.
  uint32_t read_id = PARSER_ID_EOF;
  size_t read_start = 0;
  size_t read_length = 0;
  size_t consumed_end = 0;
  bool complete = false;
  bool has_lookahead = false;
  bool prefix = false;
  bool shifted = false;
  bool finishing = false;
  std::string lookahead_error;
  std::string error;
  ParserWork work;
};

void parser_recognizer_read_id(Recognizer* recognizer) {
  assert(!recognizer->read_node_or_null);
  ++recognizer->work.reads;
  recognizer->read_node_or_null = parser_stream_read(
    recognizer->stream, &recognizer->read_id,
    &recognizer->read_start, &recognizer->read_length);
  if (recognizer->read_id == PARSER_ID_EOF) {
    // Streams historically report the EOF sentinel as the position. Empty
    // reductions instead need a real source gap, including on an empty input.
    if (recognizer->read_start == PARSER_ID_EOF || recognizer->read_start == TOWER_INVALID_INDEX)
      recognizer->read_start = recognizer->consumed_end;
    recognizer->read_length = 0;
  }
  recognizer->lookahead_error = parser_stream_get_error(recognizer->stream);
  recognizer->has_lookahead = true;
}

Recognizer* parser_recognizer_create(Table* table, Stream* stream) {
  assert(table && !table->states.empty() && stream);
  void* memory = tower_memory_allocate(sizeof(Recognizer));
  Recognizer* recognizer = new (memory) Recognizer();
  recognizer->stream = stream;
  recognizer->table = table;
  recognizer->stack.push_back(StackState{.state = &table->states[0]});
  return recognizer;
}

Recognizer* parser_recognizer_create_prefix(Table* table, Stream* stream) {
  assert(table->mode == ParserTableMode::Constructs);
  auto* recognizer = parser_recognizer_create(table, stream);
  recognizer->prefix = true;
  return recognizer;
}

ParserWork parser_recognizer_get_work(const Recognizer* recognizer) { return recognizer->work; }

static const StateEdge* parser_find_action(const State* state, uint32_t id) {
  const auto& transitions = *state->transitions;
  auto direct = transitions.direct_edges.find(id);
  if (direct != transitions.direct_edges.end()) return &direct->second;
  auto range = std::lower_bound(transitions.range_edges.begin(), transitions.range_edges.end(), id);
  return range != transitions.range_edges.end() && id >= range->range.start ? &range->edge : nullptr;
}
static const StateEdge* parser_action(Recognizer* recognizer, const State* state, uint32_t id) {
  ++recognizer->work.actions;
  return parser_find_action(state, id);
}

bool parser_recognizer_accepts(Recognizer* recognizer, uint32_t id) {
  return recognizer && !recognizer->stack.empty() && parser_action(recognizer, recognizer->stack.back().state, id);
}

static ParseForest parser_forest_leaf(Recognizer* recognizer, TowerNode* node) {
  const size_t index = recognizer->forest.size();
  recognizer->forest.push_back({.node = node});
  return {index, index};
}

static void parser_return_lookahead(Recognizer* recognizer) {
  if (!recognizer->has_lookahead) return;
  auto* stream = recognizer->stream;
  assert(!stream->buffered);
  stream->buffered = true;
  stream->buffered_node = recognizer->read_node_or_null;
  stream->buffered_id = recognizer->read_id;
  stream->buffered_start = recognizer->read_start;
  stream->buffered_length = recognizer->read_length;
  stream->buffered_error = std::move(recognizer->lookahead_error);
  stream->error.clear();
  recognizer->read_node_or_null = nullptr;
  recognizer->has_lookahead = false;
}

void parser_recognizer_destroy(Recognizer* recognizer) {
  if (!recognizer) return;
  for (auto& child : recognizer->forest) if (child.node) tower_node_release_ref(child.node);
  if (recognizer->read_node_or_null) tower_node_release_ref(recognizer->read_node_or_null);
  recognizer->~Recognizer();
  tower_memory_free(recognizer);
}

const char* parser_recognizer_get_error(Recognizer* recognizer) {
  return recognizer->error.c_str();
}

ParserDiagnostic parser_recognizer_diagnostic(Recognizer* r, ParserDiagnosticRead read, void* source) {
  ParserDiagnostic result{r->read_start, r->consumed_end};
  result.at_start = !r->shifted;
  if (r->stack.empty() || r->stack.size() > 4096) return result;
  struct DiagnosticState { const State* state; bool consumed; };
  using States = std::vector<DiagnosticState>;
  States original;
  for (const auto& entry : r->stack) original.push_back({entry.state, entry.length != 0});
  size_t budget = 8192;
  // 0 = not proven, 1 = shifted, 2 = accepted. No semantic actions or lexing.
  const auto probe = [&](States& stack, uint32_t id, const State** before) {
    for (size_t steps = 0; steps < 128 && budget; ++steps) {
      --budget;
      const State* state = stack.back().state;
      const auto* edge = parser_find_action(state, id);
      if (!edge) return 0;
      if (edge->shift_state) {
        if (before) *before = state;
        stack.push_back({edge->shift_state, false}); return 1;
      }
      const auto& rule = *edge->reduce_rule;
      if (!rule.index) return 2;
      if (rule.symbols.size() >= stack.size()) return 0;
      const auto first = stack.end() - rule.symbols.size();
      bool consumed = std::any_of(first, stack.end(), [](const auto& entry) { return entry.consumed; });
      stack.erase(first, stack.end());
      auto next = stack.back().state->gotos_after_reduction.find(rule.non_terminal);
      if (next == stack.back().state->gotos_after_reduction.end()) return 0;
      stack.push_back({next->second, consumed});
    }
    result.complete = false; return 0;
  };
  std::vector<uint32_t> candidates;
  for (const auto& [id, edge] : original.back().state->transitions->direct_edges) candidates.push_back(id);
  for (const auto& range : original.back().state->transitions->range_edges) candidates.push_back(range.range.start);
  std::sort(candidates.begin(), candidates.end());
  // A large grammar must not turn one error into an unbounded repair search.
  if (candidates.size() > 64) { candidates.resize(64); result.complete = false; }
  for (auto id : candidates) {
    auto stack = original; const State* before = nullptr;
    const auto accepted = probe(stack, id, &before);
    if (!accepted) continue;
    ParserExpectation expected{id, id == PARSER_ID_EOF ? "end of input" : debug_str(id, r->table->grammar)};
    if (before) for (const auto& item : before->diagnostic_items) {
      // Closure items at position zero are possible future rules, not context
      // already read from the source. Never attribute the error to those rules.
      if (!item.symbol_index) continue;
      // Empty reductions do not establish context either. The final stack entry
      // is the hypothetical expected token, so only inspect its preceding prefix.
      if (item.symbol_index >= stack.size() - 1 ||
          !std::any_of(stack.end() - 1 - item.symbol_index, stack.end() - 1,
            [](const auto& entry) { return entry.consumed; })) continue;
      const auto* symbol = parser_table_get_grammar_symbol_or_null(r->table->grammar, item);
      if (symbol && !symbol->non_terminal && id >= symbol->terminal.start && id <= symbol->terminal.end)
        expected.contexts.push_back({item.rule_index, item.symbol_index});
    }
    if (accepted == 1 && id != PARSER_ID_EOF && (read || r->lookahead_error.empty())) {
      auto continuation = stack;
      const auto consume = [&](uint32_t token) {
        auto previous = continuation;
        int status = probe(continuation, token, nullptr);
        if (r->prefix && token != PARSER_ID_EOF &&
            (status == 2 || (!status && probe(previous, PARSER_ID_EOF, nullptr) == 2))) {
          continuation = {{&r->table->states.front(), false}};
          status = probe(continuation, token, nullptr);
        }
        return status;
      };
      expected.insertion = read ? true : consume(r->read_id) != 0;
      size_t position = r->read_start;
      for (size_t ahead = 0; expected.insertion && read && ahead < 3; ++ahead) {
        uint32_t token;
        auto accepts = [](void* context, uint32_t token) {
          return parser_find_action(static_cast<States*>(context)->back().state, token) != nullptr;
        };
        if (!read(source, position, accepts, &continuation, token)) { expected.insertion = false; result.complete = false; break; }
        expected.insertion = consume(token) != 0;
        if (token == PARSER_ID_EOF) break;
      }
      if (expected.insertion && r->prefix) {
        auto end = stack;
        expected.completes = probe(end, PARSER_ID_EOF, nullptr) == 2;
      }
    }
    result.expected.push_back(std::move(expected));
  }
  return result;
}

TowerNode* parser_recognizer_step(Recognizer* recognizer, bool* running) {
  assert(recognizer && running);
  *running = false;
  if (recognizer->complete) return nullptr;
  const State* state = recognizer->stack.back().state;
  uint32_t id = PARSER_ID_EOF;
  StateEdge default_edge;
  const StateEdge* edge = nullptr;
  if (recognizer->prefix && !recognizer->has_lookahead && state->default_reduce) {
    ++recognizer->work.actions;
    default_edge.reduce_rule = state->default_reduce; edge = &default_edge;
  } else {
    if (!recognizer->has_lookahead && !recognizer->finishing) parser_recognizer_read_id(recognizer);
    id = recognizer->finishing ? PARSER_ID_EOF : recognizer->read_id;
    if (recognizer->lookahead_error.empty() || recognizer->finishing) edge = parser_action(recognizer, state, id);
    if (!edge && recognizer->prefix && recognizer->shifted && !recognizer->finishing) {
      // An unrecognized following token can end this construct. Perform EOF
      // reductions once on the real stack; never probe, copy, rewind, or retry.
      // A failed continuation remains an error, not a fallback to an older match.
      edge = parser_action(recognizer, state, PARSER_ID_EOF);
      if (edge) { recognizer->finishing = true; id = PARSER_ID_EOF; }
    }
  }
  if (!edge) {
    recognizer->error = recognizer->lookahead_error.empty() ?
      "Unexpected " + (recognizer->read_id == PARSER_ID_EOF ? std::string("end of input") : debug_str(recognizer->read_id, recognizer->table->grammar))
      + "." : recognizer->lookahead_error;
    recognizer->complete = true;
    return nullptr;
  }
  if (parser_debug_trace)
    parser_trace("STEP: %s at byte %zu\n", debug_str(*edge, *recognizer->table).c_str(), recognizer->read_start);

  if (edge->shift_state) {
    ++recognizer->work.shifts;
    TowerNode* node = recognizer->read_node_or_null;
    if (node && tower_node_get_parent(node)) {
      recognizer->error = "Stream returned an attached node";
      recognizer->complete = true;
      return nullptr;
    }
    if (!node) node = tower_node_create();
    auto* match = (Match*)tower_node_get_component_userdata(node, parser_match_get_type());
    if (!match) {
      match = parser_match_create(node);
      match->id = id;
      match->start = recognizer->read_start;
      match->length = recognizer->read_length;
    }
    if (match->label.empty()) match->label = debug_str(id, recognizer->table->grammar);
    recognizer->read_node_or_null = nullptr;
    recognizer->stack.push_back(StackState{
      .state = edge->shift_state, .nodes = parser_forest_leaf(recognizer, node),
      .start = recognizer->read_start, .length = recognizer->read_length
    });
    recognizer->consumed_end = recognizer->read_start + recognizer->read_length;
    recognizer->has_lookahead = false;
    recognizer->shifted = true;
  } else {
    const GrammarRule& rule = *edge->reduce_rule;
    if (rule.index == 0) {
      if (recognizer->prefix && !recognizer->shifted) {
        recognizer->error = "Prefix construct must consume input";
        recognizer->complete = true;
        return nullptr;
      }
      const auto roots = recognizer->stack.back().nodes;
      assert(recognizer->stack.size() == 2 && roots.first == roots.last && roots.first != TOWER_INVALID_INDEX);
      auto& leaf = recognizer->forest[roots.first];
      TowerNode* root = leaf.node;
      assert(root); leaf.node = nullptr; // Transfer the existing reference.
      if (recognizer->prefix) parser_return_lookahead(recognizer);
      recognizer->complete = true;
      return root;
    }
    const size_t count = rule.symbols.size();
    ++recognizer->work.reductions;
    recognizer->work.popped += count;
    assert(count < recognizer->stack.size());
    const size_t begin = recognizer->stack.size() - count;
    size_t start = recognizer->has_lookahead && !recognizer->finishing ? recognizer->read_start : recognizer->consumed_end;
    size_t end = start;
    // Empty productions span the current gap; other reductions cover the RHS,
    // not the unconsumed lookahead.
    if (count) {
      start = recognizer->stack[begin].start;
      end = start;
      for (size_t i = begin; i < recognizer->stack.size(); ++i)
        end = std::max(end, recognizer->stack[i].start + recognizer->stack[i].length);
    }
    ParseForest children;
    for (size_t i = begin; i < recognizer->stack.size(); ++i) {
      auto part = recognizer->stack[i].nodes;
      if (part.first == TOWER_INVALID_INDEX) continue;
      const auto& capture = rule.symbols[i - begin].capture;
      if (!capture.empty()) {
        size_t wrapper = recognizer->forest.size();
        recognizer->forest.push_back({.capture = capture, .first = part.first});
        part = {wrapper, wrapper};
      }
      if (children.first == TOWER_INVALID_INDEX) children = part;
      else { recognizer->forest[children.last].next = part.first; children.last = part.last; }
    }
    recognizer->stack.resize(begin);
    auto next = recognizer->stack.back().state->gotos_after_reduction.find(rule.non_terminal);
    assert(next != recognizer->stack.back().state->gotos_after_reduction.end());
    // Keep the public start root even when its declaration is generated.
    if (!rule.generated || rule.non_terminal->index == 1) {
      TowerNode* node = tower_node_create();
      Match* match = parser_match_create(node);
      match->id = (uint32_t)rule.non_terminal->index;
      match->rule_index = rule.index;
      match->label = rule.non_terminal->name;
      match->start = start;
      match->length = end - start;
      // Flatten each generated fragment once, when attached to a real node.
      // Capture wrappers apply lazily; outer captures override inner ones.
      struct Visit { size_t index; const std::string* capture; };
      std::vector<Visit> pending;
      if (children.first != TOWER_INVALID_INDEX) pending.push_back({children.first, nullptr});
      while (!pending.empty()) {
        auto visit = pending.back(); pending.pop_back();
        auto& child = recognizer->forest[visit.index];
        ++recognizer->work.forest_visits;
        if (child.next != TOWER_INVALID_INDEX) pending.push_back({child.next, visit.capture});
        const auto* capture = visit.capture ? visit.capture : child.capture.empty() ? nullptr : &child.capture;
        if (child.node) {
          tower_node_attach_member(child.node, node, capture ? capture->c_str() : nullptr);
          tower_node_release_ref(child.node); child.node = nullptr;
        } else if (child.first != TOWER_INVALID_INDEX) pending.push_back({child.first, capture});
      }
      children = parser_forest_leaf(recognizer, node);
    }
    recognizer->stack.push_back(StackState{
      .state = next->second, .nodes = std::move(children), .start = start, .length = end - start
    });
  }
  *running = true;
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
    OrderedMap<size_t, size_t> map;
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
