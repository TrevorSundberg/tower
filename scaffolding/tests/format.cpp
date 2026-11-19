#include "../core.hpp"
#include "../compiler-format.hpp"
#include "../compiler-frontend.hpp"
#include <cassert>
#include <algorithm>
#include <cstdio>
#include <filesystem>
#include <fstream>
#include <sstream>

extern "C" size_t tower_test_buffer_count();
extern "C" void tower_test_buffer_fail_after(size_t);
void tower_format_compare_reference(bool);

namespace {
std::string read(const std::filesystem::path& path) {
  std::ifstream stream(path, std::ios::binary);
  assert(stream);
  std::ostringstream text; text << stream.rdbuf(); return text.str();
}
TowerText source(const std::string& text, int baseline = 0) {
  auto* session = baseline == 1 ? syntax_create_bedrock(text.c_str()) :
    baseline == 2 ? syntax_create_foundation(text.c_str()) : syntax_create(text.c_str());
  while (auto* root = syntax_next(session)) tower_node_release_ref(root);
  if (*syntax_get_error(session)) fprintf(stderr, "%s\nInput:\n%s\n", syntax_get_error(session), text.c_str());
  assert(!*syntax_get_error(session));
  auto result = syntax_format(session);
  assert(result.error.empty());
  syntax_destroy(session);
  return result;
}
void roundtrip(const std::string& input) {
  auto program = core_compile(input.c_str());
  if (!program.error.empty()) fprintf(stderr, "%s\n", program.error.c_str());
  assert(program.error.empty());
  auto text = tower_format(program.root);
  assert(text.error.empty());
  auto again = core_compile(text.source.c_str());
  assert(again.error.empty());
  assert(tower_format(again.root).source == text.source);
}
}

void formatter_tests() {
  // Legacy Foundation fixtures compare all ordered span triples and exact UTF-8
  // text with the independent pre-port implementation, which predates imports.
  for (const auto& input : {
    "// before\nvar x:i32=1; // inline\n\n/* block */ fn f(a:i32*):i32{return *a;} // after\n",
    "parse Statement |= 'show' $x:CoreOperand ';' => replace { print($x); }; show 42;",
    "parse Prefix = '~~' Identifier; parse Statement |= 'prefix' Prefix ';'; prefix ~~ x;",
    "parse Statement |= 'postfix' Identifier '!!' ';'; postfix x !!;",
    "token Context = /abc/ when expected as identifier; parse Extra = Context; parse Statement = Extra ';'; abc;",
    "var `if`:i32=1; var `with space`:i32=`if`; print(`with space`);",
    "struct Pair{a:i32;b:u8;} fn f(p:Pair*):i32{if true{return p.a;}else{return 0;}}",
    "var a:i32[2]; var p:i32*=&a[0]; *p=1; var x:i32=*p + a[1];",
    "// only comment\n\n/* final */"
  }) {
    auto formatted = source(input);
    assert(source(formatted.source).source == formatted.source);
  }
  roundtrip("var lo:i64=-9223372036854775808; var hi:u64=18446744073709551615; var b:bool=true; var p:i32*=null;");
  roundtrip("struct S { x:i32; } extern fn ext(a:i32):i32; export fn f(a:i32):i32 { var x:i32=ext(a); return x; }");
  roundtrip("var p:i32*=alloc(i32,2); p=realloc(i32,p,3); fill(p,0,12); copy(p,p,12); var x:usize=sizeof(i32); x=alignof(i32); free(p);");
  roundtrip("var x:u32=convert(u32,1); var y:i32=bits(i32,x); loop { if true { break; } else { continue; } } print(y);");

  // Generated entities need no fabricated provenance; names/literals are byte
  // strings, including NUL, backticks, quotes and non-ASCII UTF-8.
  {
    auto entity = TowerNodeRef::adopt(tower_node_create());
    auto& n = core_attach(entity.get(), CoreKind::Declare);
    n.name = std::string("a\0\n\r\t`\\", 7) + "\xc3\xa9";
    auto value = TowerNodeRef::adopt(tower_node_create());
    auto& literal = core_attach(value.get(), CoreKind::String);
    literal.name = std::string("quote'\\\n\r\t\0", 11);
    n.type = {CoreScalar::U8, 1};
    n.value = value.get();
    auto formatted = tower_format(entity.get());
    assert(formatted.error.empty() && formatted.spans.size() == 1);
  }
  {
    const char* input = "// header\nfn f():void { /* body */ print(1); /* after */ } // tail\n";
    auto* session = syntax_create(input);
    std::vector<TowerNode*> roots;
    while (auto* root = syntax_next(session)) roots.push_back(root);
    assert(!*syntax_get_error(session));
    std::vector<TowerCommentSpan> comments;
    for (auto& highlight : syntax_get_highlights(session))
      if (highlight.kind == "comment") comments.push_back({highlight.start, highlight.end});
    tower_format_source(roots, input, comments);
    std::reverse(comments.begin(), comments.end());
    tower_format_source(roots, input, comments); // unsorted-caller fallback
    const auto buffers = tower_test_buffer_count();
    for (size_t fail = 0; fail < 32; ++fail) {
      tower_test_buffer_fail_after(fail);
      auto result = tower_format_source(roots, input, comments);
      tower_test_buffer_fail_after(SIZE_MAX);
      assert(result.error.empty() || (result.source.empty() && result.spans.empty()));
      assert(tower_test_buffer_count() == buffers);
    }
    for (auto* root : roots) tower_node_release_ref(root);
    syntax_destroy(session);
  }
  // Allocation failures must release partial output and temporary layout indexes.
  {
    auto program = core_compile("fn f():i32 { return 42; } var x:i32=f();");
    // Establish the differential oracle before injecting allocator failures.
    const auto expected = tower_format(program.root);
    const auto buffers = tower_test_buffer_count();
    tower_format_compare_reference(false);
    for (size_t fail = 0; fail < 32; ++fail) {
      tower_test_buffer_fail_after(fail);
      auto result = tower_format(program.root);
      tower_test_buffer_fail_after(SIZE_MAX);
      assert(result.error.empty() || (result.source.empty() && result.spans.empty()));
      if (result.error.empty()) {
        assert(result.source == expected.source && result.spans.size() == expected.spans.size());
        for (size_t i = 0; i < result.spans.size(); ++i) {
          const auto a = result.spans[i], b = expected.spans[i];
          assert(a.begin == b.begin && a.end == b.end && a.source == b.source);
        }
      }
      assert(tower_test_buffer_count() == buffers);
    }
    tower_format_compare_reference(true);
  }
  size_t files = 0, invalid_files = 0;
  const auto library = std::filesystem::path(__FILE__).parent_path().parent_path();
  auto* previous_modules = syntax_modules;
  syntax_modules = frontend_modules_create();
  // Repository files use module constructs absent from the frozen reference.
  // Still require exact canonical text and idempotence through the shared engine,
  // with actual filenames so relative imports resolve against their own module.
  tower_format_compare_reference(false);
  for (const auto& entry : std::filesystem::recursive_directory_iterator(library)) {
    if (entry.path().extension() != ".tower") continue;
    frontend_modules_configure(syntax_modules, entry.path().generic_string().c_str(), library.generic_string().c_str());
    const auto name = entry.path().filename().string();
    const int baseline = name == "bedrock.tower" ? 1 : name == "foundation.tower" ? 2 : 0;
    const auto input = read(entry.path());
    if (entry.path().parent_path().filename() == "syntax-invalid") {
      auto* session = syntax_create(input.c_str());
      while (auto* root = syntax_next(session)) tower_node_release_ref(root);
      assert(*syntax_get_error(session));
      syntax_destroy(session);
      ++invalid_files;
      continue;
    }
    auto formatted = source(input, baseline);
    assert(formatted.source == input);
    assert(source(formatted.source, baseline).source == formatted.source);
    ++files;
  }
  tower_format_compare_reference(true);
  frontend_modules_destroy(syntax_modules);
  syntax_modules = previous_modules;
  printf("Formatter: legacy reference text/spans, module round trips, failure cleanup, %zu canonical files, %zu invalid fixtures rejected.\n", files, invalid_files);
}
