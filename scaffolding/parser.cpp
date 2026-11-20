#include "compiler-utf8.hpp"
#include "compiler-bytes.hpp"
#include "compiler-parse-tree.hpp"
#include "compiler-lexer-table.hpp"
#include "compiler-lr.hpp"
#include "foundation-values.hpp"
#include <cstdlib>
#include "parser.hpp"
#include <string_view>
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

// The tests come first so that we do not see the definition of any structs.
void parser_tree_tests();
void parser_tests() {
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


// Borrowed layout of Tower's request-owned stream; only native callback calls remain.
struct Stream {
  ParserStreamDestructor destructor;
  ParserStreamRead read;
  uint32_t kind;
  CoreName error;
  bool buffered;
  TowerNode* buffered_node;
  uint32_t buffered_id;
  size_t buffered_start, buffered_length;
  CoreName buffered_error;
};

void parser_stream_destroy(Stream* stream) {
  parser_stream_discard(stream);
  if (stream->destructor) stream->destructor(stream, parser_stream_get_userdata(stream));
  parser_stream_dispose(stream);
}

TowerNode* parser_stream_read(Stream* stream, uint32_t* id, size_t* start_index, size_t* length) {
  TowerNode* node = nullptr;
  if (parser_stream_poll(stream, id, start_index, length, &node)) return node;
  return stream->read(stream, parser_stream_get_userdata(stream), id, start_index, length);
}

struct GrammarRule;
struct GrammarNonTerminal {
  size_t index = TOWER_INVALID_INDEX;
  std::string_view name;
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

struct GrammarSymbol {
  // Set if this represents a non-terminal (a reference to other rules)
  // If this is set, the start/end are ignored
  GrammarNonTerminal* non_terminal = nullptr;
  GrammarTerminal terminal;

};

struct GrammarRule {
  size_t index = (size_t)-1;
  GrammarNonTerminal* non_terminal = nullptr;
  std::vector<GrammarSymbol> symbols;
};

struct Grammar {
  std::unique_ptr<LRGrammar, decltype(&lr_grammar_destroy)> view{nullptr, lr_grammar_destroy};
  // The first non-terminal is the starting non-terminal S'
  std::vector<GrammarNonTerminal> non_terminals;
  // The first rule is the starting rule S'
  std::vector<GrammarRule> rules;

  void* userdata = nullptr;
  ParserTableIdToString to_string = nullptr;
  // Disposable numeric view of the entity-backed grammar, borrowed by Tower.
  std::vector<const GrammarSymbol*> lr_origins;
  std::unique_ptr<LRAnalysis, decltype(&lr_analysis_destroy)> analysis{nullptr, lr_analysis_destroy};
};

bool parser_grammar_analyze(Grammar& grammar) {
  auto* view = grammar.view.get();
  grammar.analysis.reset(lr_analysis_create(lr_grammar_rule_data(view), lr_grammar_rule_count(view),
    lr_grammar_symbol_data(view), lr_grammar_symbol_count(view), lr_grammar_name_count(view)));
  if (!grammar.analysis) return false;
  for (size_t i = 0; i < lr_grammar_name_count(view); ++i)
    lr_analysis_order(grammar.analysis.get(), i, lr_grammar_name_order(view, i));
  return lr_analysis_compute(grammar.analysis.get());
}

std::string parser_grammar_create(Grammar& grammar, TowerNode* root, void* userdata, ParserTableResolveReference resolve) {
  grammar.view.reset(lr_grammar_create(root, parser_rule_get_type(), parser_reference_get_type(),
    parser_string_get_type(), parser_range_get_type()));
  auto* view = grammar.view.get();
  if (!view) return "Unable to allocate grammar indexes";
  for (size_t i = 0; i < lr_grammar_missing_count(view); ++i) {
    const auto* name = lr_grammar_missing_name(view, i);
    const auto id = resolve ? resolve(userdata, name) : PARSER_ID_EOF;
    if (!lr_grammar_resolve(view, i, id)) return std::string("Unresolved grammar rule: ") + name;
  }
  // Temporary borrowed presentation/tree-adapter views. Tower owns name binding,
  // source order, numeric table inputs and the immutable name/capture snapshots.
  grammar.non_terminals.resize(lr_grammar_name_count(view));
  for (size_t i = 0; i < grammar.non_terminals.size(); ++i) {
    auto& nonterminal = grammar.non_terminals[i];
    nonterminal.index = i; nonterminal.name = lr_grammar_name(view, i);
  }
  grammar.rules.resize(lr_grammar_rule_count(view));
  grammar.lr_origins.resize(lr_grammar_symbol_count(view));
  const auto* rules = lr_grammar_rule_data(view);
  const auto* symbols = lr_grammar_symbol_data(view);
  for (size_t i = 0; i < grammar.rules.size(); ++i) {
    auto& rule = grammar.rules[i]; const auto& input = rules[i];
    rule.index = i;
    rule.non_terminal = &grammar.non_terminals[input.owner];
    rule.non_terminal->rules.push_back(&rule);
    rule.symbols.resize(input.count);
    for (size_t j = 0; j < input.count; ++j) {
      auto& symbol = rule.symbols[j]; const auto position = input.begin + j;
      const auto& source = symbols[position];
      if (source.nonterminal != SIZE_MAX) symbol.non_terminal = &grammar.non_terminals[source.nonterminal];
      symbol.terminal = {source.first, source.last};
      grammar.lr_origins[position] = &symbol;
    }
  }
  return {};
}

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
    return std::string(symbol.non_terminal->name);
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

struct Table;
struct State;
struct StateEdge {
  const State* shift_state = nullptr;
  const GrammarRule* reduce_rule = nullptr;
  operator bool() const { return shift_state || reduce_rule; }
};

struct State {
  const Table* table = nullptr;
  LRRuntime* runtime = nullptr;
  size_t index = 0;
  std::vector<LR0Item> diagnostic_items; // derived grammar positions, error path only
  const GrammarSymbol* symbol = nullptr;
};

struct Table {
  ParserDescribeRule describe_rule = nullptr;
  Grammar grammar;
  std::vector<State> states;
  LRRuntime* runtime = nullptr;
  ParserTableMode mode = ParserTableMode::WholeInput;
  ~Table() { lr_runtime_destroy(runtime); }
};

bool parser_table_uses_dfa(const Table* table) { return table && lr_runtime_sequence(table->runtime) != SIZE_MAX; }

LRGrammar* parser_table_grammar(const Table* table) { return table ? table->grammar.view.get() : nullptr; }

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

static StateEdge parser_state_edge(const Table& table, const LRAction& action) {
  return {action.state == SIZE_MAX ? nullptr : &table.states[action.state],
    action.rule == SIZE_MAX ? nullptr : &table.grammar.rules[action.rule]};
}

std::string debug_str(const State& state, const Table& table) {
  std::stringstream stream;
  stream << debug_str_header(state, table) << ":\n";
  const auto* actions = lr_runtime_actions(table.runtime, state.index);
  for (size_t i = 0; i < lr_runtime_action_count(table.runtime, state.index); ++i) {
    const auto& action = actions[i];
    stream << "  edge(" << debug_str(GrammarTerminal{action.first, action.last}, table.grammar)
      << ", " << debug_str(parser_state_edge(table, action), table) << ")\n";
  }
  const auto* gotos = lr_runtime_goto_data(table.runtime, state.index);
  for (size_t i = 0; i < lr_runtime_goto_count(table.runtime, state.index); ++i)
    stream << "  goto(" << table.grammar.non_terminals[gotos[i].nonterminal].name
      << ", " << debug_str_header(table.states[gotos[i].state], table) << ")\n";
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

std::string parser_table_build_lr(Table& table, bool specialize) {
  auto& grammar = table.grammar;
  std::unique_ptr<LRStates, decltype(&lr_states_destroy)> states(
    lr_states_create(grammar.analysis.get()), lr_states_destroy);
  if (!states || !lr_states_lalr(states.get(), table.mode == ParserTableMode::Constructs))
    return "Unable to construct LR parser tables";
  table.states.resize(lr_states_count(states.get()));
  for (size_t i = 0; i < table.states.size(); ++i) {
    auto& state = table.states[i]; state.table = &table; state.index = i;
    const auto origin = lr_states_origin(states.get(), i);
    if (origin != SIZE_MAX) state.symbol = grammar.lr_origins[origin];
    auto* items = lr_states_items(states.get(), i);
    const auto* values = lr_items_data(items);
    for (bool kernel : {true, false}) for (size_t j = 0; j < lr_items_count(items); ++j) {
      LR0Item item(values[j].rule, values[j].position);
      if (parser_table_is_kernel_item(grammar, item) == kernel) state.diagnostic_items.push_back(item);
    }
  }
  table.runtime = lr_runtime_create(states.get());
  if (!table.runtime) return "Unable to allocate LR runtime tables";
  LRConflict conflict;
  if (lr_runtime_conflict(table.runtime, &conflict)) {
    const bool left_reduce = conflict.left.rule != SIZE_MAX, right_reduce = conflict.right.rule != SIZE_MAX;
    const char* kind = left_reduce && right_reduce ? "reduce/reduce" :
      left_reduce || right_reduce ? "shift/reduce" : "shift/shift";
    const auto describe = [&](const LRAction& action) {
      const auto rule_text = [&](const GrammarRule& rule) {
        if (table.describe_rule) {
          auto text = table.describe_rule(grammar.userdata, rule.index);
          if (!text.empty()) return text;
        }
        return debug_str(rule, grammar);
      };
      if (action.rule != SIZE_MAX) return "finish " + rule_text(grammar.rules[action.rule]);
      const GrammarTerminal terminal{action.first, action.last};
      std::string text = "continue "; size_t count = 0;
      for (bool kernel : {true, false}) {
        for (const auto& item : table.states[conflict.state].diagnostic_items) {
          if (parser_table_is_kernel_item(grammar, item) != kernel) continue;
          const auto* symbol = parser_table_get_grammar_symbol_or_null(grammar, item);
          if (!symbol || symbol->non_terminal || symbol->terminal.entirely_less(terminal) || terminal.entirely_less(symbol->terminal)) continue;
          if (count++) text += " or ";
          text += rule_text(grammar.rules[item.rule_index]);
          if (count == 3) break;
        }
        if (count) break;
      }
      return text;
    };
    return "Grammar conflict (" + std::string(kind) + ") on "
      + debug_str(GrammarTerminal{conflict.right.first, conflict.right.last}, grammar)
      + ": the parser could " + describe(conflict.left) + ", or " + describe(conflict.right)
      + ". Make these alternatives distinct; their order does not resolve the conflict.";
  }
  if (specialize) lr_runtime_specialize(table.runtime, states.get());
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
  return parser_copy_string(std::string(table->grammar.non_terminals[id].name));
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
    message = parser_table_build_lr(*table, specialize);
    if (!message.empty()) return fail(message);
    grammar.analysis.reset();
    lr_grammar_finish(grammar.view.get());
    std::vector<const GrammarSymbol*>().swap(grammar.lr_origins);
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

struct Recognizer {
  bool capture_completion = false;
  LRCompletion* completion = nullptr;
  LRParser* control = nullptr;
  ParseForestStore* forest = nullptr;
  Stream* stream = nullptr;       // Borrowed; caller keeps both dependencies alive.
  const Table* table = nullptr;
  LRRuntime* runtime = nullptr;
  TowerNode* read_node_or_null = nullptr; // Owned lookahead, transferred on shift.
  uint32_t read_id = PARSER_ID_EOF;
  size_t read_start = 0;
  size_t read_length = 0;
  bool complete = false;
  bool has_lookahead = false;
  bool prefix = false;
  CoreName lookahead_error;
  CoreName error;
  ParserWork work;
};

LRCompletion* parser_table_completion(Table* table) {
  auto* parser = lr_parser_create(table->runtime, true, false);
  auto* result = lr_completion_create(parser); lr_parser_destroy(parser); return result;
}

static Recognizer* parser_recognizer_create_mode(Table* table, Stream* stream, bool prefix) {
  assert(table && !table->states.empty() && stream);
  auto* recognizer = parser_request_create(table->runtime, table, stream, prefix, !parser_debug_trace);
  if (!recognizer) std::abort();
  return recognizer;
}

Recognizer* parser_recognizer_create(Table* table, Stream* stream) {
  return parser_recognizer_create_mode(table, stream, false);
}

Recognizer* parser_recognizer_create_prefix(Table* table, Stream* stream) {
  assert(table->mode == ParserTableMode::Constructs);
  return parser_recognizer_create_mode(table, stream, true);
}

ParserWork parser_recognizer_get_work(const Recognizer* recognizer) {
  ParserWork result; parser_request_work(recognizer, &result); return result;
}

ParserLookahead parser_recognizer_lookahead(Recognizer* recognizer) {
  ParserLookahead result; parser_request_lookahead(recognizer, &result); return result;
}

#ifdef TOWER_EXPANSION_SEED
ParserDiagnostic parser_recognizer_diagnostic(Recognizer* r, ParserDiagnosticRead read, void* source) {
  ParserDiagnostic result{r->read_start, lr_parser_consumed(r->control)};
  result.at_start = !lr_parser_shifted(r->control);
  const auto stack_size = lr_parser_frame_count(r->control);
  if (!stack_size || stack_size > 4096) return result;
  LRProbeBudget budget{8192, true};
  using Probe = std::unique_ptr<LRProbe, decltype(&lr_probe_destroy)>;
  Probe original(lr_probe_create(r->control, &budget), lr_probe_destroy);
  if (!original) { result.complete = false; return result; }
  const auto clone = [](const Probe& source) { return Probe(lr_probe_clone(source.get()), lr_probe_destroy); };
  const auto probe = [&](const Probe& value, uint32_t id, const State** before) -> uint32_t {
    if (!value) return 0;
    size_t state;
    const auto status = lr_probe_step(value.get(), id, &state);
    if (before && state != SIZE_MAX) *before = &r->table->states[state];
    return status;
  };
  std::vector<uint32_t> candidates;
  const auto state_index = lr_probe_frames(original.get())[stack_size - 1].state;
  const auto* actions = lr_runtime_actions(r->table->runtime, state_index);
  for (size_t i = 0; i < lr_runtime_action_count(r->table->runtime, state_index); ++i) candidates.push_back(actions[i].first);
  std::sort(candidates.begin(), candidates.end());
  // A large grammar must not turn one error into an unbounded repair search.
  if (candidates.size() > 64) { candidates.resize(64); result.complete = false; }
  for (auto id : candidates) {
    auto stack = clone(original); const State* before = nullptr;
    if (!stack) break;
    const auto accepted = probe(stack, id, &before);
    if (!accepted) continue;
    ParserExpectation expected{id, id == PARSER_ID_EOF ? "end of input" : debug_str(id, r->table->grammar)};
    if (before) for (const auto& item : before->diagnostic_items) {
      // Closure items at position zero are possible future rules, not context
      // already read from the source. Never attribute the error to those rules.
      if (!item.symbol_index) continue;
      // Empty reductions do not establish context either. The final stack entry
      // is the hypothetical expected token, so only inspect its preceding prefix.
      const auto count = lr_probe_count(stack.get());
      const auto* frames = lr_probe_frames(stack.get());
      if (item.symbol_index >= count - 1 ||
          !std::any_of(frames + count - 1 - item.symbol_index, frames + count - 1,
            [](const auto& entry) { return entry.consumed; })) continue;
      const auto* symbol = parser_table_get_grammar_symbol_or_null(r->table->grammar, item);
      if (symbol && !symbol->non_terminal && id >= symbol->terminal.start && id <= symbol->terminal.end)
        expected.contexts.push_back({item.rule_index, item.symbol_index});
    }
    if (accepted == 1 && id != PARSER_ID_EOF && (read || r->lookahead_error.empty())) {
      auto continuation = clone(stack);
      const auto consume = [&](uint32_t token) {
        if (!continuation) return uint32_t(0);
        auto previous = clone(continuation);
        if (!previous) return uint32_t(0);
        auto status = probe(continuation, token, nullptr);
        if (r->prefix && token != PARSER_ID_EOF &&
            (status == 2 || (!status && probe(previous, PARSER_ID_EOF, nullptr) == 2))) {
          lr_probe_reset(continuation.get());
          status = probe(continuation, token, nullptr);
        }
        return status;
      };
      expected.insertion = continuation && (read ? true : consume(r->read_id) != 0);
      size_t position = r->read_start;
      for (size_t ahead = 0; expected.insertion && read && ahead < 3; ++ahead) {
        uint32_t token;
        const auto count = lr_probe_count(continuation.get());
        ParserLookahead context{r->table->runtime, lr_probe_frames(continuation.get())[count - 1].state};
        if (!read(source, position, context, token)) { expected.insertion = false; result.complete = false; break; }
        expected.insertion = consume(token) != 0;
        if (token == PARSER_ID_EOF) break;
      }
      if (expected.insertion && r->prefix) {
        auto end = clone(stack);
        expected.completes = probe(end, PARSER_ID_EOF, nullptr) == 2;
      }
    }
    result.expected.push_back(std::move(expected));
  }
  result.complete = result.complete && budget.complete;
  return result;
}
#else
#include "compiler-frontend.hpp"
ParserDiagnostic parser_recognizer_diagnostic(Recognizer* r, ParserDiagnosticRead read, void* source) {
  ParserDiagnostic result{r->read_start, lr_parser_consumed(r->control)};
  result.at_start = !lr_parser_shifted(r->control);
  std::unique_ptr<FrontendDiagnostic, decltype(&frontend_diagnostic_destroy)> diagnostic(
    frontend_diagnostic_create(r->control, r->prefix,
      read != nullptr, !r->lookahead_error.empty(), r->read_id, r->read_start), frontend_diagnostic_destroy);
  if (!diagnostic) { result.complete = false; return result; }
  while (auto request = frontend_diagnostic_next(diagnostic.get())) {
    const auto state = frontend_diagnostic_state(diagnostic.get());
    if (request == 1) {
      std::vector<FrontendContextPosition> positions;
      for (const auto& item : r->table->states[state].diagnostic_items) {
        const auto* symbol = parser_table_get_grammar_symbol_or_null(r->table->grammar, item);
        const bool terminal = symbol && !symbol->non_terminal;
        positions.push_back({item.rule_index, item.symbol_index,
          terminal ? symbol->terminal.start : 0, terminal ? symbol->terminal.end : 0, terminal});
      }
      frontend_diagnostic_contexts(diagnostic.get(), positions.data(), positions.size());
    } else {
      auto position = frontend_diagnostic_position(diagnostic.get());
      uint32_t id = PARSER_ID_EOF;
      const bool valid = read(source, position, {r->table->runtime, state}, id);
      frontend_diagnostic_feed(diagnostic.get(), valid, position, id);
    }
  }
  for (size_t i = 0; i < frontend_diagnostic_count(diagnostic.get()); ++i) {
    const auto* value = frontend_diagnostic_expected(diagnostic.get(), i);
    ParserExpectation expected{value->id, value->id == PARSER_ID_EOF ? "end of input" : debug_str(value->id, r->table->grammar), value->insertion, value->completes};
    for (size_t j = 0; j < value->contexts.length; ++j) expected.contexts.push_back(value->contexts.data[j]);
    result.expected.push_back(std::move(expected));
  }
  result.complete = frontend_diagnostic_complete(diagnostic.get());
  return result;
}
#endif

static void parser_unexpected(Recognizer* recognizer) {
  recognizer->error = recognizer->lookahead_error.empty() ?
    "Unexpected " + (recognizer->read_id == PARSER_ID_EOF ? std::string("end of input") : debug_str(recognizer->read_id, recognizer->table->grammar))
    + "." : std::string(recognizer->lookahead_error.view());
  recognizer->complete = true;
}

TowerNode* parser_recognizer_step(Recognizer* recognizer, bool* running) {
  assert(recognizer && running);
  *running = false;
  if (recognizer->complete) return nullptr;
  LRStep step;
  auto kind = parser_request_next(recognizer, &step);
  if (kind == LR_UNEXPECTED) { parser_unexpected(recognizer); return nullptr; }
  if (kind == LR_EMPTY_PREFIX) {
    recognizer->error = "Prefix construct must consume input";
    recognizer->complete = true; return nullptr;
  }
  if (kind == LR_ACCEPT) {
    auto* root = static_cast<TowerNode*>(lr_tree_accept(recognizer->control, recognizer->forest));
    assert(root);
    if (recognizer->prefix) parser_return_lookahead(recognizer);
    recognizer->complete = true; return root;
  }
  if (kind == LR_INVALID || kind == LR_NEED_INPUT) std::abort();
  const bool shift = kind == LR_SHIFT || kind == LR_SEQUENCE_SHIFT;
  if (parser_debug_trace) {
    StateEdge edge{shift ? &recognizer->table->states[step.next] : nullptr,
      shift ? nullptr : &recognizer->table->grammar.rules[step.rule]};
    parser_trace("STEP: %s at byte %zu\n", debug_str(edge, *recognizer->table).c_str(), recognizer->read_start);
  }
  if (shift) {
    void* input = recognizer->read_node_or_null;
    const auto label = lr_tree_needs_label(input, parser_match_get_type()) ? debug_str(step.id, recognizer->table->grammar) : std::string{};
    const auto status = lr_tree_shift(recognizer->control, recognizer->forest, recognizer->table->grammar.view.get(),
      parser_match_get_type(), &step, &input, label.c_str());
    recognizer->read_node_or_null = static_cast<TowerNode*>(input);
    if (status == 2) {
      recognizer->error = "Stream returned an attached node"; recognizer->complete = true; return nullptr;
    }
    if (!status) std::abort();
    recognizer->has_lookahead = false;
  } else {
    void* result = nullptr;
    if (!lr_tree_reduce(recognizer->control, recognizer->forest, recognizer->table->grammar.view.get(), &step, &result)) std::abort();
    if (result) { recognizer->complete = true; return static_cast<TowerNode*>(result); }
  }
  *running = true;
  return nullptr;
}
