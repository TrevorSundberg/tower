#include "compiler-utf8.hpp"
#include "compiler-bytes.hpp"
#include "compiler-parse-tree.hpp"
#include "compiler-lexer-table.hpp"
#include "compiler-lr.hpp"
#include <cstdlib>
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

TowerNode* create_attached_child_without_ref(TowerNode* parent) {
  TowerNode* child = tower_node_create();
  tower_node_attach(child, parent);
  tower_node_release_ref(child);
  return child;
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

TowerNode* parser_reference_create_subtree(TowerNode* parent, const char* name) {
  TowerNode* child = create_attached_child_without_ref(parent);
  Reference* component = parser_reference_create(child);
  parser_reference_set_name(component, name);
  return child;
}

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
  assert(parser_string_get_length(component) == 0);
  parser_string_append_utf8(component, utf8_begin, utf8_end);
  return child;
}

TowerNode* parser_range_create_subtree(TowerNode* parent, uint32_t start_id, uint32_t end_id) {
  TowerNode* child = create_attached_child_without_ref(parent);
  Range* component = parser_range_create(child);
  parser_range_set_start(component, start_id);
  parser_range_set_end(component, end_id);
  return child;
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
      bool is_rule = parser_match_get_rule_index(match) != TOWER_INVALID_INDEX;
      out << (is_rule ? "rule " : "token ");
      out << (*parser_match_get_label(match) ? parser_match_get_label(match) : std::to_string(parser_match_get_id(match)));
      if (is_rule) out << " #" << parser_match_get_rule_index(match);
      out << " [" << parser_match_get_start(match) << ", " << parser_match_get_start(match) + parser_match_get_length(match) << ")";
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
    *id = parser_match_get_id(match);
    *start_index = parser_match_get_start(match);
    *length = parser_match_get_length(match);
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
  // Disposable numeric view of the entity-backed grammar, borrowed by Tower.
  std::vector<LRProduction> lr_rules;
  std::vector<LRSymbol> lr_symbols;
  std::vector<const GrammarSymbol*> lr_origins;
  std::unique_ptr<LRAnalysis, decltype(&lr_analysis_destroy)> analysis{nullptr, lr_analysis_destroy};
  mutable bool analysis_failed = false;
};

bool parser_grammar_analyze(Grammar& grammar) {
  for (const auto& rule : grammar.rules) {
    grammar.lr_rules.push_back({rule.non_terminal->index, grammar.lr_symbols.size(), rule.symbols.size()});
    for (const auto& symbol : rule.symbols) {
      grammar.lr_symbols.push_back({symbol.non_terminal ? symbol.non_terminal->index : SIZE_MAX,
        symbol.terminal.start, symbol.terminal.end});
      grammar.lr_origins.push_back(&symbol);
    }
  }
  grammar.analysis.reset(lr_analysis_create(grammar.lr_rules.data(), grammar.lr_rules.size(),
    grammar.lr_symbols.data(), grammar.lr_symbols.size(), grammar.non_terminals.size()));
  if (!grammar.analysis) return false;
  std::vector<const GrammarNonTerminal*> names;
  for (const auto& nonterminal : grammar.non_terminals) names.push_back(&nonterminal);
  std::sort(names.begin(), names.end(), [](auto* a, auto* b) { return a->name < b->name; });
  for (size_t i = 0; i < names.size(); ++i) lr_analysis_order(grammar.analysis.get(), names[i]->index, i);
  return lr_analysis_compute(grammar.analysis.get());
}

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
    grammar_rule.generated = parser_rule_get_generated(rule);
    grammar_rule.index = grammar_rule_index;

    GrammarNonTerminal*& non_terminal = non_terminals[parser_rule_get_name(rule)];
    // If this is the first time we're seeing this name, create a new non-terminal for it and set the name
    if (non_terminal == nullptr) {
      size_t index = grammar.non_terminals.size();
      non_terminal = &grammar.non_terminals.emplace_back();
      non_terminal->name = parser_rule_get_name(rule);
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
        auto it = non_terminals.find(parser_reference_get_name(reference));
        if (it != non_terminals.end()) {
          GrammarSymbol& symbol = symbols.emplace_back();
          symbol.non_terminal = it->second;
          symbol.symbol_node = symbol_node;
          symbol.capture = parser_reference_get_capture(reference);
        } else {
          uint32_t id = PARSER_ID_EOF;
          // Otherwise, this might be a reference to a terminal
          if (resolve) {
            id = resolve(userdata, parser_reference_get_name(reference));
          }

          if (id == PARSER_ID_EOF) {
            return std::string("Unresolved grammar rule: ") + parser_reference_get_name(reference);
          } else {
            GrammarSymbol& symbol = symbols.emplace_back();
            symbol.symbol_node = symbol_node;
            symbol.capture = parser_reference_get_capture(reference);
            symbol.terminal.start = id;
            symbol.terminal.end = id;
          }
        }
      }

      String* string = (String*)tower_node_get_component_userdata(symbol_node, parser_string_get_type());
      if (string) {
        const size_t count = parser_string_get_length(string);
        const uint32_t* ids = parser_string_get_data(string);
        symbols.reserve(symbols.size() + count);
        for (size_t i = 0; i < count; ++i) {
          const uint32_t id = ids[i];
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
        if (parser_range_get_start(range) < parser_range_get_end(range)) {
          symbol.terminal.start = parser_range_get_start(range);
          symbol.terminal.end = parser_range_get_end(range);
        } else {
          symbol.terminal.start = parser_range_get_end(range);
          symbol.terminal.end = parser_range_get_start(range);
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

struct LR0Item {
  size_t rule_index = TOWER_INVALID_INDEX;
  size_t symbol_index = TOWER_INVALID_INDEX;

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

// Borrowed grammar positions retained for diagnostics while native presentation
// adapters remain. Tower owns item closure, interning and lookahead computation.
struct DiagnosticItems {
  std::vector<LR0Item> kernels, nonkernels;
};

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
    size_t rhs_rule_index = rhs.reduce_rule ? rhs.reduce_rule->index : (size_t)-1;
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
  DiagnosticItems items;

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


  // How many kernel lr items we have in total, used for reserving memory
  size_t total_kernel_lr_items = 0;
};

void parser_lr_result(const Grammar& grammar, LRItems* result, DiagnosticItems& items) {
  const auto* values = lr_items_data(result);
  for (size_t i = 0; i < lr_items_count(result); ++i) {
    const auto& value = values[i];
    LR0Item item(value.rule, value.position);
    (parser_table_is_kernel_item(grammar, item) ? items.kernels : items.nonkernels).push_back(item);
  }
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
  SymbolSequence* sequence = nullptr;
  const GrammarRule* sequence_rule = nullptr;
  std::vector<const State*> sequence_states; // LR equivalents for diagnostics/context
  ~Table() { symbol_sequence_destroy(sequence); }
};

static void parser_prepare_sequence(Table* table);
bool parser_table_uses_dfa(const Table* table) { return table && table->sequence; }

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

void parser_table_build_lr(TableBuilder& table_builder, const Grammar& grammar, ParserTableMode mode) {
  std::unique_ptr<LRStates, decltype(&lr_states_destroy)> states(
    lr_states_create(grammar.analysis.get()), lr_states_destroy);
  if (!states || !lr_states_lalr(states.get(), mode == ParserTableMode::Constructs)) {
    grammar.analysis_failed = true; return;
  }
  table_builder.states.reserve(lr_states_count(states.get()));
  for (size_t i = 0; i < lr_states_count(states.get()); ++i) {
    auto state = std::make_unique<StateBuilder>();
    state->state_index = i;
    const auto origin = lr_states_origin(states.get(), i);
    if (origin != SIZE_MAX) state->symbol = grammar.lr_origins[origin];
    parser_lr_result(grammar, lr_states_items(states.get(), i), state->items);
    table_builder.total_kernel_lr_items += state->items.kernels.size();
    const auto* edges = lr_states_edges(states.get(), i);
    for (size_t j = 0; j < lr_states_edge_count(states.get(), i); ++j) {
      const auto& edge = edges[j];
      const auto* symbol = grammar.lr_origins[edge.symbol];
      if (symbol->non_terminal)
        state->gotos_after_reduction.push_back({symbol->non_terminal, edge.state});

    }
    const auto* actions = lr_states_actions(states.get(), i);
    for (size_t j = 0; j < lr_states_action_count(states.get(), i); ++j) {
      const auto& action = actions[j];
      state->edges.insert(StateBuilderEdge{.terminal = {action.first, action.last},
        .reduce_rule = action.rule == SIZE_MAX ? nullptr : &grammar.rules[action.rule],
        .shift_state_index = action.state});
    }
    table_builder.states.push_back(std::move(state));
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
    // LALR lookahead unions can contain overlapping character ranges for the
    // same action. Union them before conflict checks and transition sharing.
    // Different actions must stay distinct so real conflicts are diagnosed.
    SortedVector<StateBuilderEdge> normalized;
    normalized.reserve(builder.edges.size());
    for (const auto& edge : builder.edges) {
      if (!normalized.empty() && normalized.back().reduce_rule == edge.reduce_rule &&
          normalized.back().shift_state_index == edge.shift_state_index &&
          uint64_t(edge.terminal.start) <= uint64_t(normalized.back().terminal.end) + 1) {
        normalized.back().terminal.end = std::max(normalized.back().terminal.end, edge.terminal.end);
      } else normalized.push_back(edge);
    }
    builder.edges = std::move(normalized);
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
  ParserDescribeRule describe_rule,
  bool specialize
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

    if (!parser_grammar_analyze(grammar)) return fail("Unable to allocate LR grammar analysis");
    TableBuilder table_builder;
    parser_table_build_lr(table_builder, grammar, mode);
    if (grammar.analysis_failed) return fail("Unable to construct LR parser tables");
    assert(table_builder.states.size() > 0);
    assert(table_builder.total_kernel_lr_items > 0);

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
    grammar.analysis.reset();
    std::vector<LRProduction>().swap(grammar.lr_rules);
    std::vector<LRSymbol>().swap(grammar.lr_symbols);
    std::vector<const GrammarSymbol*>().swap(grammar.lr_origins);
    if (specialize) parser_prepare_sequence(table);
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

struct StackState {
  const State* state = nullptr;
  // Arena-linked forests concatenate in O(1), including generated repetitions.
  ParseForest nodes;
  size_t start = 0;
  size_t length = 0;
};

struct Recognizer {
  std::vector<StackState> stack;
  ParseForestStore* forest = nullptr;
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
  bool sequence = false;
  ParseForest sequence_nodes;
  std::vector<bool> sequence_consumed; // one bit per symbol, error-context evidence
  size_t sequence_start = 0, sequence_end = 0;
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
  recognizer->forest = parse_forest_create();
  if (!recognizer->forest) std::abort();
  recognizer->stream = stream;
  recognizer->table = table;
  recognizer->sequence = table->sequence && !parser_debug_trace;
  recognizer->stack.push_back(StackState{.state = &table->states[0]});
  return recognizer;
}

Recognizer* parser_recognizer_create_prefix(Table* table, Stream* stream) {
  assert(table->mode == ParserTableMode::Constructs);
  auto* recognizer = parser_recognizer_create(table, stream);
  recognizer->prefix = true;
  return recognizer;
}

ParserWork parser_recognizer_get_work(const Recognizer* recognizer) {
  auto work = recognizer->work; work.forest_visits = parse_forest_visits(recognizer->forest); return work;
}

static const StateEdge* parser_find_action(const State* state, uint32_t id) {
  const auto& transitions = *state->transitions;
  auto direct = transitions.direct_edges.find(id);
  if (direct != transitions.direct_edges.end()) return &direct->second;
  auto range = std::lower_bound(transitions.range_edges.begin(), transitions.range_edges.end(), id);
  return range != transitions.range_edges.end() && id >= range->range.start ? &range->edge : nullptr;
}

static void parser_prepare_sequence(Table* table) {
  const auto& alternatives = table->grammar.non_terminals[1].rules;
  if (alternatives.size() != 1) return;
  const auto* rule = alternatives.front();
  // First proven case: one nonempty, finite terminal sequence. No nonterminal
  // expansion or greedy choice can change the surrounding grammar's decisions.
  if (rule->symbols.empty() || rule->symbols.size() > 4096) return;
  for (const auto& symbol : rule->symbols)
    if (symbol.non_terminal || symbol.terminal.end >= PARSER_ID_LOOKAHEAD) return;
  std::vector<const State*> states{&table->states.front()};
  states.reserve(rule->symbols.size() + 1);
  for (const auto& symbol : rule->symbols) {
    auto* action = parser_find_action(states.back(), symbol.terminal.start);
    if (!action || !action->shift_state) return;
    states.push_back(action->shift_state);
  }
  auto* sequence = symbol_sequence_create(rule->symbols.size());
  if (!sequence) return; // Optional cache allocation must not change acceptance.
  for (size_t i = 0; i < rule->symbols.size(); ++i)
    symbol_sequence_set(sequence, i, rule->symbols[i].terminal.start, rule->symbols[i].terminal.end);
  table->sequence = sequence; table->sequence_rule = rule; table->sequence_states = std::move(states);
}
static const StateEdge* parser_action(Recognizer* recognizer, const State* state, uint32_t id) {
  ++recognizer->work.actions;
  return parser_find_action(state, id);
}

bool parser_recognizer_accepts(Recognizer* recognizer, uint32_t id) {
  if (!recognizer || recognizer->stack.empty()) return false;
  auto* state = recognizer->sequence ? recognizer->table->sequence_states[recognizer->sequence_consumed.size()] : recognizer->stack.back().state;
  return parser_action(recognizer, state, id);
}

static ParseForest parser_forest_leaf(Recognizer* recognizer, TowerNode* node) {
  ParseForest result;
  if (!parse_forest_leaf(recognizer->forest, node, &result)) std::abort();
  return result;
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
  parse_forest_destroy(recognizer->forest);
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
  const auto stack_size = r->sequence ? r->sequence_consumed.size() + 1 : r->stack.size();
  if (!stack_size || stack_size > 4096) return result;
  struct DiagnosticState { const State* state; bool consumed; };
  using States = std::vector<DiagnosticState>;
  States original;
  if (r->sequence) {
    for (size_t i = 0; i < stack_size; ++i)
      original.push_back({r->table->sequence_states[i], i ? r->sequence_consumed[i - 1] : false});
  } else for (const auto& entry : r->stack) original.push_back({entry.state, entry.length != 0});
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

static void parser_unexpected(Recognizer* recognizer) {
  recognizer->error = recognizer->lookahead_error.empty() ?
    "Unexpected " + (recognizer->read_id == PARSER_ID_EOF ? std::string("end of input") : debug_str(recognizer->read_id, recognizer->table->grammar))
    + "." : recognizer->lookahead_error;
  recognizer->complete = true;
}

static TowerNode* parser_shift_value(Recognizer* recognizer, uint32_t id) {
  TowerNode* node = recognizer->read_node_or_null;
  if (node && tower_node_get_parent(node)) {
    recognizer->error = "Stream returned an attached node"; recognizer->complete = true; return nullptr;
  }
  if (!node) node = tower_node_create();
  auto* match = (Match*)tower_node_get_component_userdata(node, parser_match_get_type());
  if (!match) {
    match = parser_match_create(node);
    parser_match_set_id(match, id);
    parser_match_set_start(match, recognizer->read_start);
    parser_match_set_length(match, recognizer->read_length);
  }
  if (!*parser_match_get_label(match)) parser_match_set_label(match, debug_str(id, recognizer->table->grammar).c_str());
  return node;
}

static TowerNode* parser_reduction_value(Recognizer* recognizer, const GrammarRule& rule,
    size_t start, size_t end, ParseForest children) {
  TowerNode* node = tower_node_create();
  Match* match = parser_match_create(node);
  parser_match_set_id(match, (uint32_t)rule.non_terminal->index);
  parser_match_set_rule_index(match, rule.index);
  parser_match_set_label(match, rule.non_terminal->name.c_str());
  parser_match_set_start(match, start);
  parser_match_set_length(match, end - start);
  if (!parse_forest_attach(recognizer->forest, node, children.first)) std::abort();
  return node;
}

static TowerNode* parser_sequence_step(Recognizer* recognizer, bool* running) {
  const auto& rule = *recognizer->table->sequence_rule;
  const size_t position = recognizer->sequence_consumed.size();
  ++recognizer->work.actions;
  if (position == rule.symbols.size()) {
    // Prefix grammars finish at the boundary without reading the next revision.
    // Whole-input grammars must still observe EOF and any stream error.
    if (!recognizer->prefix) {
      if (!recognizer->has_lookahead) parser_recognizer_read_id(recognizer);
      if (recognizer->read_id != PARSER_ID_EOF || !recognizer->lookahead_error.empty()) {
        parser_unexpected(recognizer); return nullptr;
      }
    }
    ++recognizer->work.reductions;
    auto* root = parser_reduction_value(recognizer, rule, recognizer->sequence_start,
      recognizer->sequence_end, recognizer->sequence_nodes);
    auto* next = recognizer->stack.front().state->gotos_after_reduction.at(rule.non_terminal);
    recognizer->stack.push_back(StackState{.state = next, .start = recognizer->sequence_start,
      .length = recognizer->sequence_end - recognizer->sequence_start});
    recognizer->sequence = false; recognizer->complete = true;
    return root;
  }
  if (!recognizer->has_lookahead) parser_recognizer_read_id(recognizer);
  if (!recognizer->lookahead_error.empty() ||
      !symbol_sequence_accepts(recognizer->table->sequence, position, recognizer->read_id)) {
    parser_unexpected(recognizer); return nullptr;
  }
  auto* node = parser_shift_value(recognizer, recognizer->read_id);
  if (!node) return nullptr;
  const auto part = parser_forest_leaf(recognizer, node);
  if (!parse_forest_join(recognizer->forest, &recognizer->sequence_nodes, part.first, part.last,
      rule.symbols[position].capture.c_str())) std::abort();
  recognizer->read_node_or_null = nullptr;
  if (!position) recognizer->sequence_start = recognizer->read_start;
  recognizer->consumed_end = recognizer->read_start + recognizer->read_length;
  recognizer->sequence_end = std::max(recognizer->sequence_end, recognizer->consumed_end);
  recognizer->sequence_consumed.push_back(recognizer->read_length != 0);
  recognizer->has_lookahead = false; recognizer->shifted = true;
  ++recognizer->work.shifts; *running = true;
  return nullptr;
}

TowerNode* parser_recognizer_step(Recognizer* recognizer, bool* running) {
  assert(recognizer && running);
  *running = false;
  if (recognizer->complete) return nullptr;
  if (recognizer->sequence) return parser_sequence_step(recognizer, running);
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
    parser_unexpected(recognizer);
    return nullptr;
  }
  if (parser_debug_trace)
    parser_trace("STEP: %s at byte %zu\n", debug_str(*edge, *recognizer->table).c_str(), recognizer->read_start);

  if (edge->shift_state) {
    ++recognizer->work.shifts;
    TowerNode* node = parser_shift_value(recognizer, id);
    if (!node) return nullptr;
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
      TowerNode* root = parse_forest_take(recognizer->forest, roots.first);
      assert(root); // Transfer the existing reference.
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
      const auto part = recognizer->stack[i].nodes;
      const auto& capture = rule.symbols[i - begin].capture;
      if (!parse_forest_join(recognizer->forest, &children, part.first, part.last, capture.c_str())) std::abort();
    }
    recognizer->stack.resize(begin);
    auto next = recognizer->stack.back().state->gotos_after_reduction.find(rule.non_terminal);
    assert(next != recognizer->stack.back().state->gotos_after_reduction.end());
    // Keep the public start root even when its declaration is generated.
    if (!rule.generated || rule.non_terminal->index == 1) {
      TowerNode* node = parser_reduction_value(recognizer, rule, start, end, children);
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
  {
    GrammarRule first, second; first.index = 1; second.index = 2;
    StateBuilderEdge a{.terminal = {'a', 'z'}, .reduce_rule = &first};
    StateBuilderEdge b{.terminal = {'a', 'z'}, .reduce_rule = &second};
    assert(a < b && !(b < a) && !(a < a));
    SortedVector<StateBuilderEdge> edges;
    assert(edges.insert(a) && edges.insert(b) && edges.size() == 2);
  }
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

}
