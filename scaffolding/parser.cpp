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
#include <cassert>
#include "compiler-format.hpp"
#include <memory>
#include <cstdio>
#include <cstring>
#include <cstdarg>

// Note that IDs are always uint32_t, this is because realistically a language will never need
// more than this many ids to represent all tokens / characters. We also put unicode code-points
// within the uint32_t and it makes no sense for it to expand to anything greater in size
// We don't use -1 just to ensure it never gets mixed with TOWER_INVALID_INDEX

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

// Existing callback transport; traversal, fallback and text composition are Tower.
std::string debug_str(ParserFormatKind kind, const Table& table, size_t first = 0, size_t second = 0) {
  std::unique_ptr<ParserFormat, decltype(&parser_format_destroy)> request(
    parser_format_create(&table, kind, first, second, table.to_string != nullptr, table.describe_rule != nullptr),
    parser_format_destroy);
  if (!request) std::abort();
  for (auto need = parser_format_next(request.get()); need != ParserFormatNeed::Done;
       need = parser_format_next(request.get())) {
    const auto index = parser_format_index(request.get());
    if (need == ParserFormatNeed::Name) {
      char* text = table.to_string(table.userdata, uint32_t(index));
      parser_format_reply(request.get(), text, text ? strlen(text) : 0);
      if (text) tower_memory_free(text);
    } else {
      const auto text = table.describe_rule(table.userdata, index);
      parser_format_reply(request.get(), text.data(), text.size());
    }
  }
  const auto* output = parser_format_result(request.get());
  if (output->failed) std::abort();
  std::string text;
  if (output->text.length) text.assign(reinterpret_cast<const char*>(output->text.data), output->text.length);
  return text;
}

std::string parser_grammar_create(Table& table, ParserTableResolveReference resolve) {
  auto* view = table.grammar;
  for (size_t i = 0; i < lr_grammar_missing_count(view); ++i) {
    const auto* name = lr_grammar_missing_name(view, i);
    const auto id = resolve ? resolve(table.userdata, name) : PARSER_ID_EOF;
    if (!lr_grammar_resolve(view, i, id)) return debug_str(ParserFormatKind::Missing, table, i);
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
    parser_trace("%s\n", debug_str(ParserFormatKind::Grammar, *table).c_str());

    if (!parser_table_build(table, specialize)) return fail(table->error);
    message = debug_str(ParserFormatKind::Conflict, *table);
    if (!message.empty()) return fail(message);
    parser_trace("%s\n", debug_str(ParserFormatKind::Tables, *table).c_str());

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
    ParserExpectation expected{value->id, debug_str(ParserFormatKind::Expected, *r->table, value->id), value->insertion, value->completes};
    for (size_t j = 0; j < value->contexts.length; ++j) expected.contexts.push_back(value->contexts.data[j]);
    result.expected.push_back(std::move(expected));
  }
  result.complete = frontend_diagnostic_complete(diagnostic.get());
  return result;
}


static void parser_unexpected(Recognizer* recognizer) {
  recognizer->error = recognizer->lookahead_error.empty() ?
    debug_str(ParserFormatKind::Unexpected, *recognizer->table, recognizer->read_id) : std::string(recognizer->lookahead_error.view());
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
    parser_trace("STEP: %s at byte %zu\n", debug_str(ParserFormatKind::Edge, *recognizer->table,
      shift ? SIZE_MAX : step.rule, shift ? step.next : SIZE_MAX).c_str(), recognizer->read_start);
  }
  if (shift) {
    void* input = recognizer->read_node_or_null;
    const auto label = lr_tree_needs_label(input, parser_match_get_type()) ? debug_str(ParserFormatKind::Scalar, *recognizer->table, step.id) : std::string{};
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
