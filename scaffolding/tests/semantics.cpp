#include "../core.hpp"
#include "../compiler-semantic.hpp"
#include <cassert>
#include <fstream>
#include <filesystem>
#include <sstream>
#include <iostream>
#include <unordered_map>

CoreProgram reference_core_compile(const char*, unsigned);
CoreProgram reference_core_compile_files(const std::vector<std::string>&, unsigned);
namespace {
// Encode every semantic field and graph edge using deterministic traversal IDs.
// This is test evidence only, never a program storage or interchange format.
std::string snapshot(const CoreProgram& p) {
  std::vector<TowerNode*> nodes{p.root};
  for (size_t i = 0; i < nodes.size(); ++i)
    for (size_t j = 0; j < tower_node_get_child_count(nodes[i]); ++j)
      nodes.push_back(tower_node_get_child(nodes[i], j));
  std::unordered_map<TowerNode*, size_t> ids{{nullptr, 0}};
  for (size_t i = 0; i < nodes.size(); ++i) ids[nodes[i]] = i + 1;
  std::ostringstream out;
  const auto edge = [&](TowerNode* n) { assert(ids.contains(n)); out << ids.at(n) << ','; };
  const auto type = [&](CoreType t) { out << unsigned(t.scalar) << ',' << t.pointers << ',' << t.pointer_bytes << ','; edge(t.record); };
  const auto list = [&](const auto& values) { out << '['; for (auto* n : values) edge(n); out << ']'; };
  out << p.pointer_bytes << ':' << p.error_offset << ':' << p.error << '\n';
  list(p.functions); list(p.types);
  for (auto* n : nodes) if (auto* v = core_get(n)) {
    edge(n); out << unsigned(v->kind) << ':' << unsigned(v->op) << ':' << v->name.size() << ':' << v->name << ':';
    type(v->type); type(v->element);
    for (auto* link : {v->binding, v->left, v->right, v->value, v->target, v->body, v->otherwise}) edge(link);
    list(v->items); list(v->locals); list(v->parameters);
    out << v->size << ',' << v->alignment << ',' << v->length << ',' << v->byte_offset << ',' << v->frame_size << ','
        << v->index << ',' << v->start << ',' << v->end << ',' << v->bits << ',' << v->constant << ',' << v->indirect << ','
        << v->external << ',' << v->exported << ',' << v->global << '\n';
  }
  return out.str();
}
void compare(const std::vector<std::string>& files, unsigned width, bool valid) {
  auto reference = reference_core_compile_files(files, width);
  auto actual = core_compile_files(files, width);
  assert(actual.error.empty() == valid);
  if (actual.error != reference.error || actual.error_offset != reference.error_offset) {
    std::cerr << "Semantic diagnostic mismatch (pointer width " << width << ")\n"
              << "actual: " << actual.error << " at " << actual.error_offset << '\n'
              << "reference: " << reference.error << " at " << reference.error_offset << '\n';
    for (const auto& file : files) std::cerr << file << '\n';
  }
  assert(actual.error == reference.error && actual.error_offset == reference.error_offset);
  // Error trees are intentionally incomplete; they are not public results.
  if (!valid) return;
  assert(snapshot(actual) == snapshot(reference));
  auto canonical = core_format(actual).source;
  // The frozen semantic reference predates lexer comment attachment. Compare
  // executable Foundation after stripping metadata, then round-trip the full text.
  core_strip_comments(actual);
  assert(core_format(actual).source == core_format(reference).source);
  auto round = core_compile_foundation(canonical.c_str(), width);
  assert(round.error.empty() && core_format(round).source == canonical);
  CoreMachine a(std::move(actual)), b(std::move(reference)), r(std::move(round));
  a.step(100000); b.step(100000); r.step(100000);
  assert(a.done && b.done && r.done);
  assert(a.error == b.error && a.error == r.error);
  assert(a.output == b.output && a.output == r.output);
}
}
void semantic_port_tests() {
  for (unsigned width : {4u, 8u}) {
    std::ifstream file(std::filesystem::path(__FILE__).parent_path() / "semantics.tower"); assert(file);
    std::string source{std::istreambuf_iterator<char>(file), {}};
    // This frozen reference compares Foundation semantics, including exact byte
    // offsets; it predates module source maps. Exercise the same fixture under
    // the implicit Foundation baseline, retaining its byte positions. Imports
    // have their own Tower module and LLVM/cache differential suites.
    assert(source.starts_with("import tower;"));
    source.replace(0, 13, 13, ' ');
    compare({source}, width, true);
    compare({"b = 0; var a = b; fn f(): i32 { return a; }", "var b: i32 = 42; print(f());"}, width, true);
    for (const char* source : {
        "var `odd name`: i32 = 42; print(`odd name`);",
        "fn f(x: i32): i32 { var z = x; var a = z; { var z = a; print(z); } return a; } print(f(42));",
        "struct A { b: B; } struct B { value: u64; } var a: A; a.b.value = 42; print(a.b.value);",
        "fn arr(T: type, n: usize): type { return T[n]; } var a: arr(i32, 3); a[2] = 42; print(a[2]);",
        "fn alias(T: type): type { return T; } var a: alias(i32) = 42; print(a);",
        "var p = alloc(i32, 2); p[1] = 42; var q = p + 1; print(*q); p = realloc(i32, p, 3); free(p);",
        "var p: u8* = null; var q: u8* = null; var same = p == q; print(same);",
        "fn f(): i32 { if true { return 1; } } print(f());",
        "var a: u8[3]; fill(&a, 7, 3); var b: u8[3]; copy(&b, &a, 3); print(b[2]);",
        "var a: u64 = 18446744073709551615; var b: i64 = -9223372036854775808; print(a); print(b);",
        "fn f(): void { loop { if false { continue; } break; } return; } f();"
    }) compare({source}, width, true);
    // The frozen reference predates the work graph's cycle-path diagnostics.
    // Check both contracts exactly instead of weakening all error comparisons.
    for (const auto& [source, message] : {
        std::pair{"struct A { a: A; }", "Recursive by-value layout: A -> A; use a pointer"},
        std::pair{"struct A { b: B; } struct B { a: A; }", "Recursive by-value layout: A -> B -> A; use a pointer"}
    }) {
      auto reference = reference_core_compile(source, width);
      auto actual = core_compile(source, width);
      assert(reference.error == "Recursive by-value layout for 'A'; use a pointer" && reference.error_offset == 0);
      assert(actual.error == message && actual.error_offset == 0);
    }
    for (const char* source : {
        "var a: Mystery;", "var a: void;", "var a: i32; var a: i32;", "var a = b; var b = a;",
        "var a = a;", "var a = f(); fn f(): void {}", "fn f(): i32 {}", "break;", "continue;",
        "fn f(a: i32): void {} f(true);", "fn f(): void {} f(1);", "unknown();", "print();",
        "struct A { a: void; }",
        "var a: i32[0];", "var a: i32[1048577];", "var a: void[1];", "var a: i32[1048576][2];",
        "var a: u8 = 256;", "var a: u64 = -1;", "var a: i64 = 9223372036854775808;",
        "var a: i32 = true;", "var a: i32 = null;", "var a: bool = 1;",
        "var a: i32; print(a.no);", "struct A { a: i32; } var a: A; print(a.no);",
        "var a: i32; print(a[0]);", "var a: void*; print(a[0]);", "var a: i32*; print(a[true]);",
        "var a: i32; print(*a);", "var a: i32; *a = 1;", "print(alloc(void, 1));", "free(1);",
        "var a: i32; copy(&a, 1, 4);", "var a: i32; print(convert(usize, &a));",
        "print(bits(u8, 1));", "print(bits(bool, true));", "var a: void*; a = a + 1;",
        "var a: bool = true; var b = a + a;", "struct A { a: i32; } var a: A; print(a);",
        "fn f(): void { return 1; }", "fn f(): i32 { return; }", "fn f(): void { fn g(): void {} }",
        "fn f(): void { struct S { a: i32; } }", "fn f(a: i32, a: i32): void {}",
        "fn print(): void {}", "fn f(): void {} fn f(): void {}", "fn f(T: type, T: type): T { return 1; }",
        "fn f(T: type, v: T): T { return v; } f(i32);",
        "fn typefn(T: type): type { return T; } print(typefn(i32));",
        "fn bad(T: type): type { return bad(T); } var a: bad(i32);",
        "fn bad(T: type): T { return true; } print(bad(i32));",
        "fn a(T: type, n: bool): type { return T; } var a: a(i32, true);"
    }) compare({source}, width, false);

    compare({"fn fail(): i32 { return missing; }", "print(fail());"}, width, false);
  }
}
