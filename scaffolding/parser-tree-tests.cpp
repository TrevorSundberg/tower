#include "parser.hpp"
#include <cassert>
#include <cstdio>
#include <cstring>
#include <string>
#include <vector>
#include <new>

namespace {
struct AllocationCheck {
  size_t nodes = tower_node_get_allocated_count();
  size_t components = tower_component_get_allocated_count();
  size_t allocations = tower_memory_get_allocated_count();
  ~AllocationCheck() {
    assert(nodes == tower_node_get_allocated_count());
    assert(components == tower_component_get_allocated_count());
    assert(allocations == tower_memory_get_allocated_count());
  }
};

struct Parse {
  TowerNode* rules = tower_node_create();
  Table* table = nullptr;
  Stream* stream = nullptr;
  Recognizer* recognizer = nullptr;
  ~Parse() {
    parser_recognizer_destroy(recognizer);
    if (stream) parser_stream_destroy(stream);
    parser_table_destroy(table);
    tower_node_release_ref(rules);
  }
  void begin(const char* input) {
    table = parser_table_create(rules, nullptr, nullptr, parser_table_utf8_id_to_string);
    stream = parser_stream_utf8_null_terminated_create(input);
    recognizer = parser_recognizer_create(table, stream);
  }
};

TowerNode* finish(Recognizer* recognizer, bool success = true) {
  bool running = true;
  TowerNode* root = nullptr;
  size_t steps = 0;
  while (running) {
    root = parser_recognizer_step(recognizer, &running);
    assert(++steps < 1000000);
    assert(!root || !running);
  }
  if (success && !root) fprintf(stderr, "%s\n", parser_recognizer_get_error(recognizer));
  assert(bool(root) == success);
  assert((*parser_recognizer_get_error(recognizer) == '\0') == success);
  TowerNode* repeated = parser_recognizer_step(recognizer, &running);
  assert(!repeated && !running);
  return root;
}

Match* match(TowerNode* node, uint32_t id, size_t start, size_t length) {
  auto* value = (Match*)tower_node_get_component_userdata(node, parser_match_get_type());
  assert(value);
  assert(parser_match_get_id(value) == id);
  assert(parser_match_get_start(value) == start);
  assert(parser_match_get_length(value) == length);
  return value;
}

void expression_grammar(TowerNode* rules) {
  auto* node = parser_rule_create_subtree(rules, "E", false);
  parser_reference_create_subtree(node, "E");
  parser_string_create_subtree_utf8_null_terminated(node, "+");
  parser_reference_create_subtree(node, "T");
  node = parser_rule_create_subtree(rules, "E", false);
  parser_reference_create_subtree(node, "T");
  node = parser_rule_create_subtree(rules, "T", false);
  parser_reference_create_subtree(node, "T");
  parser_string_create_subtree_utf8_null_terminated(node, "*");
  parser_reference_create_subtree(node, "F");
  node = parser_rule_create_subtree(rules, "T", false);
  parser_reference_create_subtree(node, "F");
  node = parser_rule_create_subtree(rules, "F", false);
  parser_string_create_subtree_utf8_null_terminated(node, "(");
  parser_reference_create_subtree(node, "E");
  parser_string_create_subtree_utf8_null_terminated(node, ")");
  node = parser_rule_create_subtree(rules, "F", false);
  parser_range_create_subtree(node, '0', '9');
}

struct NodeStream {
  std::vector<TowerNode*> nodes;
  size_t next = 0;
};

Stream* node_stream_create() {
  auto* stream = parser_stream_create(sizeof(NodeStream), [](Stream*, void* data) {
    auto* nodes = (NodeStream*)data;
    for (size_t i = nodes->next; i < nodes->nodes.size(); ++i) tower_node_release_ref(nodes->nodes[i]);
    nodes->~NodeStream();
  }, [](Stream*, void* data, uint32_t* id, size_t* start, size_t* length) -> TowerNode* {
    auto* nodes = (NodeStream*)data;
    if (nodes->next == nodes->nodes.size()) {
      *id = PARSER_ID_EOF; *start = PARSER_ID_EOF; *length = 0;
      return nullptr;
    }
    TowerNode* node = nodes->nodes[nodes->next++];
    auto* m = (Match*)tower_node_get_component_userdata(node, parser_match_get_type());
    *id = parser_match_get_id(m); *start = parser_match_get_start(m); *length = parser_match_get_length(m);
    return node;
  });
  new (parser_stream_get_userdata(stream)) NodeStream();
  return stream;
}

TowerNode* add_token(Stream* stream, uint32_t id, size_t start, size_t length) {
  auto* node = tower_node_create();
  auto* m = parser_match_create(node);
  parser_match_set_id(m, id);
  parser_match_set_start(m, start);
  parser_match_set_length(m, length);
  ((NodeStream*)parser_stream_get_userdata(stream))->nodes.push_back(node);
  return node;
}
}

void parser_tree_tests() {
  {
    AllocationCheck check;
    Parse parse; expression_grammar(parse.rules);
    size_t formatted = 0;
    parser_set_debug_trace(false);
    parse.table = parser_table_create(parse.rules, &formatted, nullptr,
      [](void* count, uint32_t id) {
        ++*static_cast<size_t*>(count);
        return parser_table_utf8_id_to_string(nullptr, id);
      });
    assert(parse.table && formatted == 0); // No display-name work without tracing/errors.
  }
  // Exact tree, precedence, alternative production identity, and ownership after
  // parser/table/source destruction. Labels must not borrow grammar storage.
  {
    AllocationCheck allocations;
    TowerNode* root = nullptr;
    {
      Parse parse;
      expression_grammar(parse.rules);
      parse.begin("1+2*3");
      root = finish(parse.recognizer);
      match(root, 1, 0, 5);
      assert(tower_node_get_ref_count(root) == 1);
    }
    const char* expected =
      "rule E #1 [0, 5)\n"
      "  rule E #2 [0, 1)\n"
      "    rule T #4 [0, 1)\n"
      "      rule F #6 [0, 1)\n"
      "        token '1' [0, 1)\n"
      "  token '+' [1, 2)\n"
      "  rule T #3 [2, 5)\n"
      "    rule T #4 [2, 3)\n"
      "      rule F #6 [2, 3)\n"
      "        token '2' [2, 3)\n"
      "    token '*' [3, 4)\n"
      "    rule F #6 [4, 5)\n"
      "      token '3' [4, 5)\n";
    char* dump = parser_tree_debug_string(root);
    assert(strcmp(dump, expected) == 0);
    tower_memory_free(dump);
    puts("Parse tree for 1+2*3:");
    parser_tree_debug_print(root);
    tower_node_release_ref(root);
  }
  for (const char* input : {"(1+2)*3", "1+2+3", "0", "9"}) {
    AllocationCheck allocations;
    Parse parse;
    expression_grammar(parse.rules);
    parse.begin(input);
    auto* root = finish(parse.recognizer);
    match(root, 1, 0, strlen(input));
    if (strcmp(input, "1+2+3") == 0) {
      auto* left = tower_node_get_child(root, 0);
      assert(parser_match_get_rule_index(match(left, 1, 0, 3)) == 1);
    }
    if (strcmp(input, "(1+2)*3") == 0) {
      auto* product = tower_node_get_child(root, 0);
      assert(parser_match_get_rule_index(match(product, 2, 0, 7)) == 3);
      auto* factor = tower_node_get_child(tower_node_get_child(product, 0), 0);
      assert(parser_match_get_rule_index(match(factor, 3, 0, 5)) == 5);
    }
    tower_node_release_ref(root);
  }
  // Empty start, empty helpers both before lookahead and at EOF.
  {
    AllocationCheck allocations;
    Parse parse;
    parser_rule_create_subtree(parse.rules, "Empty", true);
    parse.begin("");
    auto* root = finish(parse.recognizer);
    match(root, 1, 0, 0);
    assert(tower_node_get_child_count(root) == 0);
    tower_node_release_ref(root);
  }
  {
    AllocationCheck allocations;
    Parse parse;
    auto* rule = parser_rule_create_subtree(parse.rules, "S", false);
    parser_reference_create_subtree(rule, "Before");
    parser_string_create_subtree_utf8_null_terminated(rule, "a");
    parser_reference_create_subtree(rule, "After");
    parser_rule_create_subtree(parse.rules, "Before", false);
    parser_rule_create_subtree(parse.rules, "After", false);
    parse.begin("a");
    auto* root = finish(parse.recognizer);
    match(root, 1, 0, 1);
    assert(tower_node_get_child_count(root) == 3);
    match(tower_node_get_child(root, 0), 2, 0, 0);
    match(tower_node_get_child(root, 1), 'a', 0, 1);
    match(tower_node_get_child(root, 2), 3, 1, 0);
    tower_node_release_ref(root);
  }
  // Nullable suffix lookahead must reach past more than one symbol.
  {
    AllocationCheck allocations;
    Parse parse;
    auto* rule = parser_rule_create_subtree(parse.rules, "S", false);
    parser_reference_create_subtree(rule, "A");
    parser_reference_create_subtree(rule, "B");
    parser_string_create_subtree_utf8_null_terminated(rule, "c");
    parser_rule_create_subtree(parse.rules, "A", false);
    parser_rule_create_subtree(parse.rules, "B", false);
    parse.begin("c");
    auto* root = finish(parse.recognizer);
    match(root, 1, 0, 1);
    assert(tower_node_get_child_count(root) == 3);
    match(tower_node_get_child(root, 0), 2, 0, 0);
    match(tower_node_get_child(root, 1), 3, 0, 0);
    tower_node_release_ref(root);
  }
  // LALR lookahead (not SLR): S -> L '=' R | R; L -> '*' R | 'i'; R -> L.
  for (const char* input : {"**i=*i", "i", "*i=i"}) {
    AllocationCheck allocations;
    Parse parse;
    auto* rule = parser_rule_create_subtree(parse.rules, "S", false);
    parser_reference_create_subtree(rule, "L");
    parser_string_create_subtree_utf8_null_terminated(rule, "=");
    parser_reference_create_subtree(rule, "R");
    rule = parser_rule_create_subtree(parse.rules, "S", false);
    parser_reference_create_subtree(rule, "R");
    rule = parser_rule_create_subtree(parse.rules, "L", false);
    parser_string_create_subtree_utf8_null_terminated(rule, "*");
    parser_reference_create_subtree(rule, "R");
    rule = parser_rule_create_subtree(parse.rules, "L", false);
    parser_string_create_subtree_utf8_null_terminated(rule, "i");
    rule = parser_rule_create_subtree(parse.rules, "R", false);
    parser_reference_create_subtree(rule, "L");
    parse.begin(input);
    auto* root = finish(parse.recognizer);
    auto* m = match(root, 1, 0, strlen(input));
    assert(parser_match_get_rule_index(m) == (strcmp(input, "i") == 0 ? 2 : 1));
    tower_node_release_ref(root);
  }
  // Generated helpers flatten all their children, including an empty helper.
  {
    AllocationCheck allocations;
    Parse parse;
    auto* rule = parser_rule_create_subtree(parse.rules, "S", false);
    parser_string_create_subtree_utf8_null_terminated(rule, "a");
    parser_reference_create_subtree(rule, "Helper");
    parser_reference_create_subtree(rule, "Empty");
    rule = parser_rule_create_subtree(parse.rules, "Helper", true);
    parser_string_create_subtree_utf8_null_terminated(rule, "bc");
    parser_rule_create_subtree(parse.rules, "Empty", true);
    parse.begin("abc");
    auto* root = finish(parse.recognizer);
    assert(tower_node_get_child_count(root) == 3);
    for (size_t i = 0; i < 3; ++i) match(tower_node_get_child(root, i), 'a' + (uint32_t)i, i, 1);
    tower_node_release_ref(root);
  }
  // UTF-8 spans count bytes, not codepoints.
  {
    AllocationCheck allocations;
    Parse parse;
    auto* rule = parser_rule_create_subtree(parse.rules, "Unicode", false);
    const char* input = "\xC3\xA9\xF0\x9F\x8F\xB0";
    parser_string_create_subtree_utf8_null_terminated(rule, input);
    parse.begin(input);
    auto* root = finish(parse.recognizer);
    match(root, 1, 0, 6);
    match(tower_node_get_child(root, 0), 0xE9, 0, 2);
    match(tower_node_get_child(root, 1), 0x1F3F0, 2, 4);
    tower_node_release_ref(root);
  }
  // Debug output escapes control characters instead of breaking the tree layout.
  {
    AllocationCheck allocations;
    Parse parse;
    auto* rule = parser_rule_create_subtree(parse.rules, "Escaped", false);
    parser_string_create_subtree_utf8_null_terminated(rule, "\n\t\\'");
    parse.begin("\n\t\\'");
    auto* root = finish(parse.recognizer);
    char* dump = parser_tree_debug_string(root);
    assert(strstr(dump, "token '\\n' [0, 1)"));
    assert(strstr(dump, "token '\\t' [1, 2)"));
    assert(strstr(dump, "token '\\\\' [2, 3)"));
    tower_memory_free(dump);
    tower_node_release_ref(root);
  }
  // Invalid input terminates with a diagnostic and releases partial trees.
  for (const char* input : {"", "1+", "1x", "(1", ":"}) {
    AllocationCheck allocations;
    Parse parse;
    expression_grammar(parse.rules);
    parse.begin(input);
    finish(parse.recognizer, false);
    assert(strstr(parser_recognizer_get_error(parse.recognizer), "Unexpected "));
    assert(!strstr(parser_recognizer_get_error(parse.recognizer), "byte "));
    auto work = parser_recognizer_get_work(parse.recognizer);
    auto diagnostic = parser_recognizer_diagnostic(parse.recognizer);
    assert(!diagnostic.expected.empty());
    assert(parser_recognizer_get_work(parse.recognizer).actions == work.actions);
  }
  // Early destruction with a nonempty stack and an owned lookahead.
  for (int shifts : {0, 1, 2}) {
    AllocationCheck allocations;
    Parse parse;
    auto* rule = parser_rule_create_subtree(parse.rules, "S", false);
    parser_string_create_subtree_utf8_null_terminated(rule, "ab");
    parse.table = parser_table_create(parse.rules, nullptr, nullptr, parser_table_utf8_id_to_string);
    parse.stream = node_stream_create();
    add_token(parse.stream, 'a', 10, 2);
    add_token(parse.stream, 'b', 15, 3);
    parse.recognizer = parser_recognizer_create(parse.table, parse.stream);
    for (int i = 0; i < shifts; ++i) {
      bool running;
      auto* result = parser_recognizer_step(parse.recognizer, &running);
      assert(!result && running);
    }
  }
  // Stream node identity and additional payload survive; span includes gaps.
  {
    AllocationCheck allocations;
    Parse parse;
    auto* rule = parser_rule_create_subtree(parse.rules, "S", false);
    parser_string_create_subtree_utf8_null_terminated(rule, "ab");
    parse.table = parser_table_create(parse.rules, nullptr, nullptr, parser_table_utf8_id_to_string);
    parse.stream = node_stream_create();
    auto* first = add_token(parse.stream, 'a', 10, 2);
    auto* payload = parser_string_create(first);
    parser_string_append_utf8_null_terminated(payload, "retained payload");
    auto* second = add_token(parse.stream, 'b', 15, 3);
    parse.recognizer = parser_recognizer_create(parse.table, parse.stream);
    auto* root = finish(parse.recognizer);
    match(root, 1, 10, 8);
    assert(tower_node_get_child(root, 0) == first);
    assert(tower_node_get_child(root, 1) == second);
    assert(tower_node_get_component_userdata(first, parser_string_get_type()) == payload);
    assert(parser_string_get_length(payload) == 16);
    tower_node_release_ref(root);
  }
  // Layered recognizer stream transfers one entire root, then stable EOF.
  for (bool valid : {true, false}) {
    AllocationCheck allocations;
    Parse inner;
    auto* rule = parser_rule_create_subtree(inner.rules, "Word", false);
    parser_string_create_subtree_utf8_null_terminated(rule, "ab");
    inner.begin(valid ? "ab" : "ax");
    Parse outer;
    rule = parser_rule_create_subtree(outer.rules, "Wrapper", false);
    parser_reference_create_subtree(rule, "Word");
    outer.table = parser_table_create(outer.rules, inner.table,
      parser_table_non_terminal_resolve_reference, parser_table_non_terminal_id_to_string);
    outer.stream = parser_stream_recognizer_create(inner.recognizer);
    outer.recognizer = parser_recognizer_create(outer.table, outer.stream);
    auto* root = finish(outer.recognizer, valid);
    if (root) {
      match(root, 1, 0, 2);
      auto* word = tower_node_get_child(root, 0);
      assert(strcmp(parser_match_get_label(match(word, 1, 0, 2)), "Word") == 0);
      assert(tower_node_get_child_count(word) == 2);
      tower_node_release_ref(root);
    }
  }
  // Prefix mode performs no speculative stream read beyond a construct. Swap
  // tables on the same stream, retaining the earlier root and its copied labels.
  {
    AllocationCheck allocations;
    Parse parse;
    auto* rule = parser_rule_create_subtree(parse.rules, "First", false);
    parser_string_create_subtree_utf8_null_terminated(rule, "a");
    parse.table = parser_table_create(parse.rules, nullptr, nullptr, parser_table_utf8_id_to_string, nullptr, ParserTableMode::Constructs);
    parse.stream = node_stream_create();
    add_token(parse.stream, 'a', 0, 1);
    add_token(parse.stream, 'b', 1, 1);
    parse.recognizer = parser_recognizer_create_prefix(parse.table, parse.stream);
    auto* first = finish(parse.recognizer);
    assert(((NodeStream*)parser_stream_get_userdata(parse.stream))->next == 1);
    parser_recognizer_destroy(parse.recognizer);
    parser_table_destroy(parse.table);
    tower_node_release_ref(parse.rules);
    parse.rules = tower_node_create();
    rule = parser_rule_create_subtree(parse.rules, "Second", false);
    parser_string_create_subtree_utf8_null_terminated(rule, "b");
    parse.table = parser_table_create(parse.rules, nullptr, nullptr, parser_table_utf8_id_to_string, nullptr, ParserTableMode::Constructs);
    parse.recognizer = parser_recognizer_create_prefix(parse.table, parse.stream);
    auto* second = finish(parse.recognizer);
    assert(((NodeStream*)parser_stream_get_userdata(parse.stream))->next == 2);
    assert(strcmp(parser_match_get_label(match(first, 1, 0, 1)), "First") == 0);
    assert(strcmp(parser_match_get_label(match(second, 1, 1, 1)), "Second") == 0);
    tower_node_release_ref(first);
    tower_node_release_ref(second);
  }
  {
    AllocationCheck allocations;
    Parse parse;
    parser_rule_create_subtree(parse.rules, "Empty", false);
    parse.table = parser_table_create(parse.rules, nullptr, nullptr, parser_table_utf8_id_to_string, nullptr, ParserTableMode::Constructs);
    parse.stream = parser_stream_utf8_null_terminated_create("");
    parse.recognizer = parser_recognizer_create_prefix(parse.table, parse.stream);
    finish(parse.recognizer, false);
  }
  // A lookahead token is read once and returned with its owned payload. It is
  // preserved even when it does not belong to this table's token vocabulary.
  {
    AllocationCheck allocations;
    Parse parse;
    auto* rule = parser_rule_create_subtree(parse.rules, "A", false);
    parser_string_create_subtree_utf8_null_terminated(rule, "a");
    rule = parser_rule_create_subtree(parse.rules, "A", false);
    parser_string_create_subtree_utf8_null_terminated(rule, "ab");
    parse.table = parser_table_create(parse.rules, nullptr, nullptr, parser_table_utf8_id_to_string, nullptr, ParserTableMode::Constructs);
    parse.stream = node_stream_create();
    add_token(parse.stream, 'a', 0, 1);
    auto* following = add_token(parse.stream, 'c', 1, 1);
    parse.recognizer = parser_recognizer_create_prefix(parse.table, parse.stream);
    auto* root = finish(parse.recognizer);
    match(root, 1, 0, 1); tower_node_release_ref(root);
    uint32_t id; size_t start, length;
    auto* returned = parser_stream_read(parse.stream, &id, &start, &length);
    assert(returned == following && id == 'c' && start == 1 && length == 1);
    assert(((NodeStream*)parser_stream_get_userdata(parse.stream))->next == 2);
    tower_node_release_ref(returned);
  }
  // Fixed grammar, increasing nesting: count actual actions and popped frames.
  // Generated lists in BOTH recursion directions also stay linear to flatten.
  for (int shape = 0; shape < 3; ++shape) {
    size_t previous_work = 0;
    for (size_t n : {256u, 512u, 1024u, 2048u}) {
      AllocationCheck allocations;
      Parse parse;
      auto* root_rule = parser_rule_create_subtree(parse.rules, "Root", false);
      parser_reference_create_subtree(root_rule, "Items");
      parser_string_create_subtree_utf8_null_terminated(root_rule, ";");
      auto* rule = parser_rule_create_subtree(parse.rules, "Items", true);
      if (shape == 0) parser_string_create_subtree_utf8_null_terminated(rule, "(");
      if (shape == 2) parser_string_create_subtree_utf8_null_terminated(rule, "x");
      parser_reference_create_subtree(rule, "Items");
      parser_string_create_subtree_utf8_null_terminated(rule, shape == 0 ? ")" : shape == 1 ? "x" : "");
      rule = parser_rule_create_subtree(parse.rules, "Items", true);
      parser_string_create_subtree_utf8_null_terminated(rule, "x");
      const std::string source = shape == 0 ? std::string(n, '(') + 'x' + std::string(n, ')') + ';' : std::string(n, 'x') + ';';
      parse.table = parser_table_create(parse.rules, nullptr, nullptr, parser_table_utf8_id_to_string, nullptr, ParserTableMode::Constructs);
      assert(parse.table);
      parse.stream = parser_stream_utf8_null_terminated_create(source.c_str());
      parse.recognizer = parser_recognizer_create_prefix(parse.table, parse.stream);
      auto* root = finish(parse.recognizer);
      assert(parser_match_get_length((Match*)tower_node_get_component_userdata(root, parser_match_get_type())) == source.size());
      assert(tower_node_get_child_count(root) == source.size());
      const auto work = parser_recognizer_get_work(parse.recognizer);
      const size_t total = work.actions + work.popped + work.forest_visits;
      assert(work.shifts == source.size() && work.reads == source.size());
      assert(total < source.size() * 12);
      assert(!previous_work || total <= previous_work * 2 + 12);
      previous_work = total;
      printf("Linear parser work: shape=%d n=%zu actions=%zu popped=%zu forest=%zu\n", shape, n, work.actions, work.popped, work.forest_visits);
      tower_node_release_ref(root);
    }
  }
  // Checked construction rejects bad grammars without aborting or leaking tables.
  for (int kind = 0; kind < 3; ++kind) {
    AllocationCheck allocations;
    Parse parse;
    if (kind == 1) {
      auto* rule = parser_rule_create_subtree(parse.rules, "S", false);
      parser_reference_create_subtree(rule, "Missing");
    } else if (kind == 2) {
      for (int i = 0; i < 2; ++i) {
        auto* rule = parser_rule_create_subtree(parse.rules, "S", false);
        parser_string_create_subtree_utf8_null_terminated(rule, "a");
      }
    }
    char* error = nullptr;
    parse.table = parser_table_create(parse.rules, nullptr, nullptr, parser_table_utf8_id_to_string, &error);
    assert(!parse.table && error && *error);
    tower_memory_free(error);
  }
  puts("Parser tree checks passed (precedence, spans, generated rules, streams, errors, ownership).");
}
