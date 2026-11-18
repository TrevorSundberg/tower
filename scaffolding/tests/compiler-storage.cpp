#include "../compiler-bytes.hpp"
#include "../syntax.hpp"
#include "../syntax-nodes.hpp"
#include "../compiler-generics.hpp"
#include "../compiler-parser-nodes.hpp"
#include <cassert>
#include <cstring>
#include <string>

extern "C" size_t tower_test_buffer_count();
extern "C" size_t tower_test_buffer_allocations();
extern "C" void tower_test_buffer_fail_next();

void compiler_storage_tests() {
  const auto baseline = tower_test_buffer_count();
  {
    auto owner = TowerNodeRef::adopt(tower_node_create());
    auto* rule = parser_rule_create(owner.get());
    assert(!*parser_rule_get_name(rule) && !parser_rule_get_generated(rule));
    parser_rule_set_name(rule, "prefix-name");
    parser_rule_set_name(rule, parser_rule_get_name(rule) + 7);
    assert(!std::strcmp(parser_rule_get_name(rule), "name"));
    assert(parser_rule_create(owner.get()) == rule);
    assert(!std::strcmp(parser_rule_get_name(rule), "name"));
    tower_test_buffer_fail_next();
    assert(!node_rule_set_name(rule, std::string(4096, 'r').c_str()));
    assert(!std::strcmp(parser_rule_get_name(rule), "name"));
    parser_rule_set_name(rule, "");
    assert(!*parser_rule_get_name(rule));
    auto* ref = parser_reference_create(owner.get());
    assert(!*parser_reference_get_name(ref) && !*parser_reference_get_capture(ref));
    parser_reference_set_name(ref, "Rule"); parser_reference_set_capture(ref, "argument");
    assert(!std::strcmp(parser_reference_get_capture(ref), "argument"));
    auto* range = parser_range_create(owner.get());
    assert(!parser_range_get_start(range) && !parser_range_get_end(range));
    auto* match = parser_match_create(owner.get());
    assert(parser_match_get_id(match) == PARSER_ID_EOF);
    assert(parser_match_get_rule_index(match) == TOWER_INVALID_INDEX);
    assert(!parser_match_get_start(match) && !parser_match_get_length(match) && !*parser_match_get_label(match));
    parser_match_set_label(match, "retained");
    tower_test_buffer_fail_next();
    assert(!node_match_set_label(match, std::string(4096, 'm').c_str()));
    assert(!std::strcmp(parser_match_get_label(match), "retained"));
    auto* string = parser_string_create(owner.get());
    assert(!parser_string_get_length(string));
    parser_string_append_utf8_null_terminated(string, "A\xc3\xa9\xf0\x9f\x8f\xb0");
    assert(parser_string_get_length(string) == 3);
    assert(parser_string_get_id(string, 0) == 'A' && parser_string_get_id(string, 1) == 0xe9);
    assert(parser_string_get_id(string, 2) == 0x1f3f0);
    parser_string_set_length(string, 1); parser_string_set_id(string, 4, 'Z');
    assert(parser_string_get_length(string) == 5 && parser_string_get_id(string, 4) == 'Z');
    for (size_t i = 1; i < 4; ++i) assert(parser_string_get_id(string, i) == PARSER_ID_EOF);
    assert(!node_string_resize(string, SIZE_MAX));
    assert(!node_string_set(string, SIZE_MAX, 'X'));
    tower_test_buffer_fail_next();
    assert(!node_string_resize(string, 4096));
    assert(parser_string_get_length(string) == 5 && parser_string_get_id(string, 4) == 'Z');
    // Removing a component must release its Tower-owned vector as well as the payload.
    assert(tower_node_remove_component(owner.get(), parser_string_get_type()));
    string = parser_string_create(owner.get()); assert(!parser_string_get_length(string));
  }
  assert(tower_test_buffer_count() == baseline);
  {
    auto root = TowerNodeRef::adopt(tower_node_create()); auto* at = root.get();
    for (size_t i = 0; i < 600; ++i) {
      auto* child = tower_node_create(); auto* m = parser_match_create(child);
      parser_match_set_start(m, i); parser_match_set_length(m, 1); parser_match_set_label(m, "deep");
      tower_node_attach_member(child, at, "next"); tower_node_release_ref(child); at = child;
    }
    size_t copied = 0; auto clone = TowerNodeRef::adopt(compiler_clone_tree(root.get(), 601, &copied));
    assert(clone.get() && copied == 601); at = clone.get();
    for (size_t i = 0; i < 600; ++i) {
      at = tower_node_get_child_member(at, "next"); assert(at);
      auto* m = static_cast<Match*>(tower_node_get_component_userdata(at, parser_match_get_type()));
      assert(m && parser_match_get_start(m) == i && !std::strcmp(parser_match_get_label(m), "deep"));
    }
    const auto live = tower_node_get_allocated_count();
    assert(!compiler_clone_tree(root.get(), 300, &copied)); assert(copied == 300);
    assert(tower_node_get_allocated_count() == live);
    tower_test_buffer_fail_next();
    assert(!compiler_clone_tree(root.get(), 601, &copied)); assert(copied == 0);
    assert(tower_node_get_allocated_count() == live);
  }
  assert(tower_test_buffer_count() == baseline);
  {
    CompilerText text;
    assert(text.assign("original"));
    auto* original = text.c_str();
    tower_test_buffer_fail_next();
    assert(!text.assign(std::string(100, 'x')));
    assert(text.c_str() == original && text.view() == "original");
    CompilerText moved(std::move(text));
    assert(text.view().empty() && moved.view() == "original");
    CompilerText other; assert(other.assign("released"));
    other = std::move(moved);
    assert(moved.view().empty() && other.view() == "original");
  }
  assert(tower_test_buffer_count() == baseline);
  {
    std::string source = "parse Keep = 'old';";
    const auto allocations = tower_test_buffer_allocations();
    auto* session = syntax_create(source.c_str());
    // Parsing/source provenance still share a buffer. The allocator now also
    // serves the Tower entity store, so total allocations include tree storage.
    assert(tower_test_buffer_allocations() > allocations);
    source.assign(source.size(), 'x');
    auto root = TowerNodeRef::adopt(syntax_next(session)); assert(root.get());
    auto* declaration = tower_node_get_child(root.get(), 0);
    auto* semantic = syntax_get(declaration); assert(semantic && semantic->source);
    auto retained = semantic->source;
    assert(retained->text.view() == "parse Keep = 'old';");
    const auto* original = retained->text.c_str();
    for (int i = 0; i < 100; ++i) {
      syntax_reset(session, "print(42);");
      auto item = TowerNodeRef::adopt(syntax_next(session)); assert(item.get());
      assert(!syntax_next(session) && !*syntax_get_error(session));
      assert(retained->text.c_str() == original && retained->text.view() == "parse Keep = 'old';");
    }
    tower_test_buffer_fail_next();
    syntax_reset(session, "print(99);");
    assert(std::string(syntax_get_error(session)) == "Unable to allocate source text");
    assert(!syntax_next(session));
    syntax_reset(session, "print(7);");
    auto item = TowerNodeRef::adopt(syntax_next(session)); assert(item.get());
    syntax_destroy(session);
    assert(retained->text.view() == "parse Keep = 'old';");
  }
  assert(tower_test_buffer_count() == baseline);
  {
    std::string source = "a\xc3\xa9";
    auto* stream = parser_stream_utf8_create(source.data(), source.data() + source.size());
    source.assign(500, 'x');
    uint32_t id; size_t start, length;
    parser_stream_read(stream, &id, &start, &length); assert(id == 'a' && start == 0 && length == 1);
    parser_stream_read(stream, &id, &start, &length); assert(id == 0xe9 && start == 1 && length == 2);
    parser_stream_destroy(stream);
    tower_test_buffer_fail_next();
    stream = parser_stream_utf8_null_terminated_create("a");
    parser_stream_read(stream, &id, &start, &length);
    assert(id == PARSER_ID_EOF && std::string(parser_stream_get_error(stream)) == "Unable to allocate UTF-8 stream source");
    parser_stream_destroy(stream);
  }
  assert(tower_test_buffer_count() == baseline);
}
