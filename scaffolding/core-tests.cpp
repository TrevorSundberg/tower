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
      << ':' << n.name << ':' << n.constant << ':' << n.indirect << ':' << n.bits
      << ':' << core_type_name(n.element) << ':' << n.length << ':' << n.external << ':' << n.exported << ':' << n.global;
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
  { auto warm = execute("print(1);"); }
  auto before = tower_node_get_allocated_count();
  {
  auto sum = execute("var a: i32; var b: i32; a = 1; b = a + 2; print(b);");
  assert(sum.done && sum.error.empty() && sum.output == "3\n");
  {
    const auto source = "fn `add-one`(`odd name`: i32): i32 { var `var`: i32 = `odd name` + 1; return `var`; } var `x-y`: i32 = `add-one`(41); print(`x-y`);";
    auto original = core_compile(source);
    assert(original.error.empty());
    auto formatted = core_format(original);
    auto reparsed = core_compile_foundation(formatted.source.c_str());
    assert(reparsed.error.empty() && structure(original.root) == structure(reparsed.root));
    CoreMachine quoted(std::move(reparsed)); quoted.step(10000);
    assert(quoted.done && quoted.error.empty() && quoted.output == "42\n");
  }
  auto alias = execute("var a: i32; var p: i32*; var q: i32*; p = &a; q = p; *q = 42; print(a);");
  assert(alias.error.empty() && alias.output == "42\n");
  auto mismatch = execute("var a: i32; var b: u32; a = b;");
  assert(mismatch.error.find("Expected i32, got u32") != std::string::npos && mismatch.steps == 0);
  auto loop = execute("var a: i32; var stop: bool; a = 0; loop { a = a + 1; stop = a == 4; if stop { break; } } print(a);");
  assert(loop.done && loop.error.empty() && loop.output == "4\n");
  auto forever = execute("loop {}");
  assert(!forever.done && forever.error.empty() && forever.steps == 10000);
  auto unwind = execute("loop { print(1); break; loop { print(99); break; } print(2); } print(3);");
  assert(unwind.error.empty() && unwind.output == "1\n3\n");
  auto recursive = execute("var x: i32; x = f(6); print(x); fn f(n: i32): i32 { var b: bool; b = n <= 1; if b { return 1; } var p: i32; p = n - 1; p = f(p); p = p * n; return p; }");
  assert(recursive.done && recursive.error.empty() && recursive.output == "720\n");
  auto missing_return = execute("fn f(b: bool): i32 { if b { return 1; } }");
  assert(missing_return.error.find("without returning") != std::string::npos && missing_return.steps == 0);
  auto wrong_arg = execute("fn f(n: i32): void {} f(true);");
  assert(!wrong_arg.error.empty() && wrong_arg.steps == 0);
  auto calls = execute("fn call(value: i32): i32 { return value; } var call: i32 = call(4); print(call);");
  assert(calls.error.empty() && calls.output == "4\n");
  auto composed = execute("fn next(p: i32*): i32 { var old: i32 = *p; *p = old + 1; return old; } parse CoreCall |= $target:CoreLocation '++' => replace { next(&$target) }; var a: i32 = 1; a++; print(a++); print(a);");
  assert(composed.error.empty() && composed.output == "2\n3\n");
  auto module = execute("fn field(): i32 { return state.value; } fn index(): i32 { return values[1]; } var state: Later; state.value = 42; var values: i32[2]; values[1] = 73; var a: i32 = field(); var b: i32 = index(); print(a); print(b); struct Later { value: i32; }");
  assert(module.error.empty() && module.output == "42\n73\n");
  auto shadow = execute("var i32: i32 = 4; { var i32: i32 = 9; print(i32); } print(i32);");
  assert(shadow.error.empty() && shadow.output == "9\n4\n");
  auto unknown = execute("var x: Unknown;");
  assert(unknown.error.find("Unknown") != std::string::npos);
  auto pair = execute("struct Pair { x: i32; y: i32; } var p: Pair; p.x = 20; p.y = 22; var ref: Pair* = &p; add(ref); print(p.x); fn add(p: Pair*): void { p.x = p.x + p.y; }");
  assert(pair.error.empty() && pair.output == "42\n");
  assert(pair.program.types.size() == 9);
  auto& record = core_node(pair.program.types.back());
  assert(record.size == 8 && record.alignment == 4);
  assert(core_node(record.items[0]).byte_offset == 0 && core_node(record.items[1]).byte_offset == 4);
  assert(tower_node_get_component_userdata(pair.program.types.back(), parser_match_get_type()));
  auto layout = execute("struct Inner { flag: bool; value: i32; } struct Outer { lead: bool; nested: Inner; tail: bool; link: Outer*; }");
  assert(layout.error.empty());
  auto& outer = core_node(layout.program.types.back());
  assert(outer.size == 20 && outer.alignment == 4 && core_node(outer.items.back()).byte_offset == 16);
  auto raw = execute("var a: i32[3]; a[1] = 42; var p: i32* = &a[1]; var raw_address: usize = bits(usize, p); var q: i32* = bits(i32*, raw_address); *q = 7; print(a[1]); var b: u8* = alloc(u8, 4); fill(b, 9, 4); b = realloc(u8, b, 32); print(b[3]); free(b);");
  assert(raw.error.empty() && raw.output == "7\n9\n");
  auto foreign_program = core_compile("extern fn increment(p: i32*): i32; var a: i32 = 41; var answer: i32 = increment(&a); print(answer); print(a);");
  const auto foreign_text = core_format(foreign_program);
  auto foreign_round = core_compile_foundation(foreign_text.source.c_str());
  assert(foreign_round.error.empty() && structure(foreign_program.root) == structure(foreign_round.root));
  CoreMachine foreign(std::move(foreign_program));
  foreign.foreign = [](CoreMachine& m, TowerNode* fn, const std::vector<CoreValue>& args) {
    assert(core_node(fn).name == "increment"); auto value = m.load(args[0].bits, {CoreScalar::I32}); ++value.bits;
    m.write(args[0].bits, value, {CoreScalar::I32}); return value;
  };
  foreign.step(10000); assert(foreign.error.empty() && foreign.output == "42\n42\n");
  for (unsigned width : {4, 8}) {
    auto target = core_compile("struct P { tag: u8; ptr: i32*; } var size: usize = sizeof(P); print(size);", width);
    assert(target.error.empty()); auto& p = core_node(target.types.back());
    assert(p.size == width * 2 && p.alignment == width && core_node(p.items.back()).byte_offset == width);
    CoreMachine m(std::move(target)); m.step(10000); assert(m.output == (width == 4 ? "8\n" : "16\n"));
  }
  auto recursive_type = execute("struct A { a: A; }");
  assert(recursive_type.error.find("Recursive by-value") != std::string::npos && recursive_type.steps == 0);
  auto malformed = execute("parse CoreIf = 'broken'; broken");
  assert(malformed.error.find("missing capture") != std::string::npos && malformed.steps == 0);
  for (auto* original : {&sum, &alias, &loop, &recursive, &shadow, &pair, &layout, &raw, &module, &composed}) {
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
