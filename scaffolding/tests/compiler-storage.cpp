#include "../compiler-bytes.hpp"
#include "../syntax.hpp"
#include "../syntax-nodes.hpp"
#include <cassert>
#include <cstring>
#include <string>

extern "C" size_t tower_test_buffer_count();
extern "C" size_t tower_test_buffer_allocations();
extern "C" void tower_test_buffer_fail_next();

void compiler_storage_tests() {
  const auto baseline = tower_test_buffer_count();
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
    // Parsing and source provenance share one owned buffer, not two string copies.
    assert(tower_test_buffer_allocations() == allocations + 1);
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
