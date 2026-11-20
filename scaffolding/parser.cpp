#include "compiler-frontend.hpp"
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
#include <span>
#include <cassert>
#include <sstream>
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

void parser_tree_debug_print(TowerNode* root) {
  char* text = parser_tree_debug_string(root);
  fputs(text, stdout);
  tower_memory_free(text);
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

// Borrowed ABI of Tower's parser-table owner and its diagnostic indexes.
struct State {
  size_t origin, kernels;
  struct { FrontendContextPosition* data; size_t length, capacity; } contexts;
};
struct Table {
  LRGrammar* grammar;
  LRRuntime* runtime;
  struct { State* data; size_t length, capacity; } states;
  void* userdata;
  ParserTableIdToString to_string;
  ParserDescribeRule describe_rule;
  ParserTableMode mode;
  const char* error;
  bool built;
};

std::string parser_grammar_create(Table& table, ParserTableResolveReference resolve) {
  auto* view = table.grammar;
  for (size_t i = 0; i < lr_grammar_missing_count(view); ++i) {
    const auto* name = lr_grammar_missing_name(view, i);
    const auto id = resolve ? resolve(table.userdata, name) : PARSER_ID_EOF;
    if (!lr_grammar_resolve(view, i, id)) return std::string("Unresolved grammar rule: ") + name;
  }
  return {};
}

void debug_append_id(uint32_t id, std::stringstream& stream, const Table& grammar) {
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

std::string debug_str(uint32_t id, const Table& grammar) {
  std::stringstream stream;
  debug_append_id(id, stream, grammar);
  return stream.str();
}

std::string debug_str(const SymbolRange& terminal, const Table& grammar) {
  std::stringstream stream;
  if (terminal.first == terminal.last) {
    debug_append_id(terminal.first, stream, grammar);
  } else {
    stream << '[';
    debug_append_id(terminal.first, stream, grammar);
    stream << '-';
    debug_append_id(terminal.last, stream, grammar);
    stream << ']';
  }
  return stream.str();
}

std::string debug_str(const LRSymbol& symbol, const Table& grammar) {
  if (symbol.nonterminal != SIZE_MAX) {
    return lr_grammar_name(grammar.grammar, symbol.nonterminal);
  } else {
    return debug_str(SymbolRange{symbol.first, symbol.last}, grammar);
  }
}

std::string debug_str(const ParserRulePosition& item, const Table& grammar) {
  std::stringstream stream;

  const auto& grammar_rule = lr_grammar_rule_data(grammar.grammar)[item.production];
  stream << lr_grammar_name(grammar.grammar, grammar_rule.owner) << " =";

  for (size_t g = 0; g <= grammar_rule.count; ++g) {
    stream << ' ';
    if (g == item.term) {
      stream << "•";
    }

    if (g == grammar_rule.count) {
      break;
    }

    const auto& symbol = lr_grammar_symbol_data(grammar.grammar)[grammar_rule.begin + g];
    stream << debug_str(symbol, grammar);
  }

  return stream.str();
}

std::string debug_rule(size_t index, const Table& grammar) {
  ParserRulePosition lr0_print_item{index, TOWER_INVALID_INDEX};
  return debug_str(lr0_print_item, grammar);
}

std::string debug_nonterminal(size_t index, const Table& grammar) {
  std::stringstream stream;
  stream << "non_terminal(" << index << ", " << lr_grammar_name(grammar.grammar, index) << ")\n";
  for (auto rule = parser_table_rule_next(&grammar, index, 0); rule != SIZE_MAX;
       rule = parser_table_rule_next(&grammar, index, rule + 1)) {
    stream << "  " << debug_rule(rule, grammar) << "\n";
  }
  return stream.str();
}

std::string debug_grammar(const Table& grammar) {
  std::stringstream stream;
  for (size_t rule = 0; rule < lr_grammar_rule_count(grammar.grammar); ++rule) {
    stream << debug_rule(rule, grammar) << "\n";
  }
  for (size_t name = 0; name < lr_grammar_name_count(grammar.grammar); ++name) {
    stream << debug_nonterminal(name, grammar);
  }
  return stream.str();
}

struct StateEdge {
  const State* shift_state = nullptr;
  const LRProduction* reduce_rule = nullptr;
  operator bool() const { return shift_state || reduce_rule; }
};

std::string debug_str_header(const State& state, const Table& table, const char* prefix = "state") {
  std::stringstream stream;
  size_t state_index = &state - table.states.data;
  stream << prefix << "(" << state_index;
  if (state.origin != SIZE_MAX) {
    stream << ", " << debug_str(lr_grammar_symbol_data(table.grammar)[state.origin], table);
  }
  stream << ")";
  return stream.str();
}

// Only call this on edges/states that have been compacted within the table.
std::string debug_str(const StateEdge& edge, const Table& table) {
  std::stringstream stream;
  if (edge.reduce_rule) {
    ParserRulePosition reduce{
      size_t(edge.reduce_rule - lr_grammar_rule_data(table.grammar)),
      edge.reduce_rule->count
    };
    stream << "reduce(" << reduce.production << ", " << debug_str(reduce, table) << ")";
  } else {
    assert(edge.shift_state);
    assert(!edge.reduce_rule);
    stream << debug_str_header(*edge.shift_state, table, "shift");
  }
  return stream.str();
}

static StateEdge parser_state_edge(const Table& table, const LRAction& action) {
  return {action.state == SIZE_MAX ? nullptr : &table.states.data[action.state],
    action.rule == SIZE_MAX ? nullptr : &lr_grammar_rule_data(table.grammar)[action.rule]};
}

std::string debug_str(const State& state, const Table& table) {
  std::stringstream stream;
  stream << debug_str_header(state, table) << ":\n";
  const auto index = size_t(&state - table.states.data);
  const auto* actions = lr_runtime_actions(table.runtime, index);
  for (size_t i = 0; i < lr_runtime_action_count(table.runtime, index); ++i) {
    const auto& action = actions[i];
    stream << "  edge(" << debug_str(SymbolRange{action.first, action.last}, table)
      << ", " << debug_str(parser_state_edge(table, action), table) << ")\n";
  }
  const auto* gotos = lr_runtime_goto_data(table.runtime, index);
  for (size_t i = 0; i < lr_runtime_goto_count(table.runtime, index); ++i)
    stream << "  goto(" << lr_grammar_name(table.grammar, gotos[i].nonterminal)
      << ", " << debug_str_header(table.states.data[gotos[i].state], table) << ")\n";
  return stream.str();
}

std::string debug_str(const Table& table) {
  std::stringstream stream;

  stream << "~~~~~~~~~~\n";
  for (const auto& state : std::span(table.states.data, table.states.length)) {
    stream << debug_str(state, table) << "\n";
  }

  stream << "..........\n";
  return stream.str();
}

std::string parser_table_build_lr(Table& table, bool specialize) {
  if (!parser_table_build(&table, specialize)) return table.error;
  LRConflict conflict;
  if (lr_runtime_conflict(table.runtime, &conflict)) {
    const bool left_reduce = conflict.left.rule != SIZE_MAX, right_reduce = conflict.right.rule != SIZE_MAX;
    const char* kind = left_reduce && right_reduce ? "reduce/reduce" :
      left_reduce || right_reduce ? "shift/reduce" : "shift/shift";
    const auto describe = [&](const LRAction& action) {
      const auto rule_text = [&](size_t index) {
        if (table.describe_rule) {
          auto text = table.describe_rule(table.userdata, index);
          if (!text.empty()) return text;
        }
        return debug_rule(index, table);
      };
      if (action.rule != SIZE_MAX) return "finish " + rule_text(action.rule);
      const SymbolRange terminal{action.first, action.last};
      std::string text = "continue "; size_t count = 0;
      const auto& state = table.states.data[conflict.state];
      for (bool kernel : {true, false}) {
        for (const auto& item : std::span(state.contexts.data, state.contexts.length)) {
          if ((size_t(&item - state.contexts.data) < state.kernels) != kernel) continue;
          if (!item.terminal || item.last < terminal.first || terminal.last < item.first) continue;
          if (count++) text += " or ";
          text += rule_text(item.production);
          if (count == 3) break;
        }
        if (count) break;
      }
      return text;
    };
    return "Grammar conflict (" + std::string(kind) + ") on "
      + debug_str(SymbolRange{conflict.right.first, conflict.right.last}, table)
      + ": the parser could " + describe(conflict.left) + ", or " + describe(conflict.right)
      + ". Make these alternatives distinct; their order does not resolve the conflict.";
  }
  return {};
}

char* parser_copy_string(const std::string& str) {
  // Include the null terminator
  void* str_mem = tower_memory_allocate(str.size() + 1);
  memcpy(str_mem, str.c_str(), str.size() + 1);
  return (char*)str_mem;
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
  Table* table = parser_table_open_host(root, userdata, to_string, describe_rule, uint32_t(mode));
  if (!table) std::abort();
  const auto fail = [&](const std::string& message) -> Table* {
    if (error) *error = parser_copy_string(message);
    parser_table_destroy(table);
    return nullptr;
  };
  {
    if (table->error) return fail(table->error);
    std::string message = parser_grammar_create(*table, resolve);
    if (!message.empty()) return fail(message);
    parser_trace("%s\n", debug_grammar(*table).c_str());

    message = parser_table_build_lr(*table, specialize);
    if (!message.empty()) return fail(message);
    parser_trace("%s\n", debug_str(*table).c_str());

    return table;
  }
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
  assert(table && table->states.length && stream);
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
      const auto& positions = r->table->states.data[state].contexts;
      frontend_diagnostic_contexts(diagnostic.get(), positions.data, positions.length);
    } else {
      auto position = frontend_diagnostic_position(diagnostic.get());
      uint32_t id = PARSER_ID_EOF;
      const bool valid = read(source, position, {r->table->runtime, state}, id);
      frontend_diagnostic_feed(diagnostic.get(), valid, position, id);
    }
  }
  for (size_t i = 0; i < frontend_diagnostic_count(diagnostic.get()); ++i) {
    const auto* value = frontend_diagnostic_expected(diagnostic.get(), i);
    ParserExpectation expected{value->id, value->id == PARSER_ID_EOF ? "end of input" : debug_str(value->id, *r->table), value->insertion, value->completes};
    for (size_t j = 0; j < value->contexts.length; ++j) expected.contexts.push_back(value->contexts.data[j]);
    result.expected.push_back(std::move(expected));
  }
  result.complete = frontend_diagnostic_complete(diagnostic.get());
  return result;
}


static void parser_unexpected(Recognizer* recognizer) {
  recognizer->error = recognizer->lookahead_error.empty() ?
    "Unexpected " + (recognizer->read_id == PARSER_ID_EOF ? std::string("end of input") : debug_str(recognizer->read_id, *recognizer->table))
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
    StateEdge edge{shift ? &recognizer->table->states.data[step.next] : nullptr,
      shift ? nullptr : &lr_grammar_rule_data(recognizer->table->grammar)[step.rule]};
    parser_trace("STEP: %s at byte %zu\n", debug_str(edge, *recognizer->table).c_str(), recognizer->read_start);
  }
  if (shift) {
    void* input = recognizer->read_node_or_null;
    const auto label = lr_tree_needs_label(input, parser_match_get_type()) ? debug_str(step.id, *recognizer->table) : std::string{};
    const auto status = lr_tree_shift(recognizer->control, recognizer->forest, recognizer->table->grammar,
      parser_match_get_type(), &step, &input, label.c_str());
    recognizer->read_node_or_null = static_cast<TowerNode*>(input);
    if (status == 2) {
      recognizer->error = "Stream returned an attached node"; recognizer->complete = true; return nullptr;
    }
    if (!status) std::abort();
    recognizer->has_lookahead = false;
  } else {
    void* result = nullptr;
    if (!lr_tree_reduce(recognizer->control, recognizer->forest, recognizer->table->grammar, &step, &result)) std::abort();
    if (result) { recognizer->complete = true; return static_cast<TowerNode*>(result); }
  }
  *running = true;
  return nullptr;
}
