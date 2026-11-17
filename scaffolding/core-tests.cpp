#include "core.hpp"
#include <cassert>
#include <fstream>
#include <sstream>

namespace {
std::string structure(TowerNode* node) {
  if (!node) return "-";
  const auto& n = core_node(node);
  std::ostringstream out;
  out << '(' << int(n.kind) << ':' << core_type_name(n.type) << ':' << int(n.op)
      << ':' << n.name << ':' << n.constant << ':' << n.indirect << ':' << n.bits;
  if (n.binding) {
    const auto& b = core_node(n.binding);
    out << "->" << int(b.kind) << ':' << b.name << ':' << b.index;
  }
  for (auto* child : {n.left,n.right,n.value,n.target,n.body,n.otherwise}) out << structure(child);
  for (auto* child : n.parameters) out << structure(child);
  for (auto* child : n.items) out << structure(child);
  out << ')'; return out.str();
}
}

void core_tests() {
  std::ifstream file("foundation.tower", std::ios::binary); assert(file);
  std::ostringstream text; text << file.rdbuf(); const auto grammar = text.str();
  core_set_foundation(grammar);
  auto execute = [&](const std::string& source) {
    CoreMachine machine(core_compile((grammar + source).c_str()));
    machine.step(10000); return machine;
  };
  { auto warm = execute("print 1;"); }
  auto before = tower_node_get_allocated_count();
  {
  auto sum = execute("var a: i32; var b: i32; a = 1; b = a + 2; print b;");
  assert(sum.done && sum.error.empty() && sum.output == "3\n");
  {
    const auto source = "fn `add-one`(`odd name`: i32): i32 { var `var`: i32 = `odd name` + 1; return `var`; } var `x-y`: i32 = `add-one`(41); print `x-y`;";
    auto original = core_compile(source);
    assert(original.error.empty());
    auto formatted = core_format(original);
    auto reparsed = core_compile_foundation(formatted.source.c_str());
    assert(reparsed.error.empty() && structure(original.root) == structure(reparsed.root));
    CoreMachine quoted(std::move(reparsed)); quoted.step(10000);
    assert(quoted.done && quoted.error.empty() && quoted.output == "42\n");
  }
  auto alias = execute("var a: i32; var p: i32*; var q: i32*; p = &a; q = p; *q = 42; print a;");
  assert(alias.error.empty() && alias.output == "42\n");
  auto lifetime = execute("var p: i32*; { var a: i32; a = 1; p = &a; } var b: i32; b = *p;");
  assert(lifetime.error.find("expired") != std::string::npos);
  auto mismatch = execute("var a: i32; var b: u32; a = b;");
  assert(mismatch.error.find("Expected i32, got u32") != std::string::npos && mismatch.steps == 0);
  auto loop = execute("var a: i32; var stop: bool; a = 0; loop { a = a + 1; stop = a == 4; if stop { break; } } print a;");
  assert(loop.done && loop.error.empty() && loop.output == "4\n");
  auto forever = execute("loop {}");
  assert(!forever.done && forever.error.empty() && forever.steps == 10000);
  auto unwind = execute("loop { print 1; break; loop { print 99; break; } print 2; } print 3;");
  assert(unwind.error.empty() && unwind.output == "1\n3\n");
  auto recursive = execute("var x: i32; x = f(6); print x; fn f(n: i32): i32 { var b: bool; b = n <= 1; if b { return 1; } var p: i32; p = n - 1; p = f(p); p = p * n; return p; }");
  assert(recursive.done && recursive.error.empty() && recursive.output == "720\n");
  auto escaped = execute("fn f(): i32* { var n: i32; n = 5; var p: i32*; p = &n; return p; } var p: i32*; p = f(); var n: i32; n = *p;");
  assert(escaped.error.find("expired") != std::string::npos);
  auto missing_return = execute("fn f(b: bool): i32 { if b { return 1; } }");
  assert(missing_return.error.find("without returning") != std::string::npos && missing_return.steps == 0);
  auto wrong_arg = execute("fn f(n: i32): void {} f(true);");
  assert(!wrong_arg.error.empty() && wrong_arg.steps == 0);
  auto calls = execute("fn call(value: i32): i32 { return value; } var call: i32 = call(4); print call;");
  assert(calls.error.empty() && calls.output == "4\n");
  auto shadow = execute("var i32: i32 = 4; { var i32: i32 = 9; print i32; } print i32;");
  assert(shadow.error.empty() && shadow.output == "9\n4\n");
  auto unknown = execute("var x: Unknown;");
  assert(unknown.error.find("Unknown") != std::string::npos);
  auto pair = execute("struct Pair { x: i32; y: i32; } var p: Pair; p.x = 20; p.y = 22; var ref: Pair* = &p; add(ref); print p.x; fn add(p: Pair*): void { p.x = p.x + p.y; }");
  assert(pair.error.empty() && pair.output == "42\n");
  assert(pair.program.types.size() == 5);
  auto& record = core_node(pair.program.types.back());
  assert(record.size == 8 && record.alignment == 4 && record.cell_count == 2);
  assert(core_node(record.items[0]).byte_offset == 0 && core_node(record.items[1]).byte_offset == 4);
  assert(tower_node_get_component_userdata(pair.program.types.back(), parser_match_get_type()));
  auto layout = execute("struct Inner { flag: bool; value: i32; } struct Outer { lead: bool; nested: Inner; tail: bool; link: Outer*; }");
  assert(layout.error.empty());
  auto& outer = core_node(layout.program.types.back());
  assert(outer.size == 40 && outer.alignment == 8 && core_node(outer.items.back()).byte_offset == 16);
  auto field_expired = execute("struct A { x: i32; } var p: i32*; { var a: A; p = &a.x; } var n: i32 = *p;");
  assert(field_expired.error.find("expired") != std::string::npos);
  auto recursive_type = execute("struct A { a: A; }");
  assert(recursive_type.error.find("Recursive by-value") != std::string::npos && recursive_type.steps == 0);
  auto malformed = execute("parse CoreIf = 'broken'; broken");
  assert(malformed.error.find("missing capture") != std::string::npos && malformed.steps == 0);
  for (auto* original : {&sum, &alias, &lifetime, &loop, &recursive, &escaped, &shadow, &pair, &layout, &field_expired}) {
    const auto formatted = core_format(original->program);
    assert(!formatted.source.empty());
    auto decoded = core_compile_foundation(formatted.source.c_str());
    assert(decoded.error.empty());
    assert(core_format(decoded).source == formatted.source);
    assert(structure(decoded.root) == structure(original->program.root));
    for (auto* item : core_node(decoded.root).items) {
      // Semantics enrich the retained parser entity itself.
      assert(tower_node_get_component_userdata(item, parser_match_get_type()));
      assert(core_get(item));
    }
    CoreMachine transported(std::move(decoded)); transported.step(10000);
    assert(transported.output == original->output && transported.error == original->error);
  }
  }
  assert(tower_node_get_allocated_count() == before);
}
