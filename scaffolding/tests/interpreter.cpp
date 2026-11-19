#include "../bootstrap/interpreter-reference.hpp"
#include "../core.hpp"
#include "../interpreter-abi.hpp"
#include <algorithm>
#include <cassert>
#include <chrono>
#include <cstdio>
#include <cstring>
#include <fstream>
#include <iostream>
#include <sstream>
#include <tuple>
#include <string_view>

static void same_node(TowerNode *a, TowerNode *b) {
  assert(bool(a) == bool(b));
  if (!a)
    return;
  auto &x = core_node(a);
  auto &y = core_node(b);
  assert(x.kind == y.kind && x.start == y.start && x.name == y.name);
}
static TowerNode* cache_node(TowerNode* node) { return node; }
static TowerNode* cache_node(uint64_t node) { return reinterpret_cast<TowerNode*>(uintptr_t(node)); }
static uint64_t cache_bits(CoreValue value) { return value.bits; }
static uint64_t cache_bits(uint64_t value) { return value; }
static auto map_values(const CoreMachineArray<CoreMachineEntry>& entries) {
  std::map<uint64_t, size_t> result;
  for (const auto& entry : entries) result.emplace(entry.key, size_t(entry.value));
  return result;
}
template <class Cache> static auto cache_values(const Cache &cache) {
  std::vector<std::tuple<int, size_t, size_t, uint64_t>> values;
  for (const auto &[node, value] : cache) {
    const auto &n = core_node(cache_node(node));
    values.emplace_back(int(n.kind), n.start, n.end, cache_bits(value));
  }
  std::sort(values.begin(), values.end());
  return values;
}
static void compare(const CoreMachine &a, const NativeCoreMachine &b) {
  assert(a.done == b.done && a.steps == b.steps);
  assert(a.error == b.error && a.error_offset == b.error_offset);
  assert(a.output == b.output && a.output_bytes == b.output_bytes &&
         a.output_truncated == b.output_truncated);
  assert(a.memory_size() == b.memory.size());
  assert(std::memcmp(a.memory_data(), b.memory.data(), a.memory_size()) == 0);
  assert(a.stack == b.stack && a.heap == b.heap);
  assert(map_values(a.allocations) == b.allocations && map_values(a.free_blocks) == b.free_blocks);
  assert(a.frames.size() == b.frames.size());
  for (size_t i = 0; i < a.frames.size(); ++i) {
    auto &x = a.frames[i];
    auto &y = b.frames[i];
    assert(cache_values(x.values) == cache_values(y.values));
    assert(cache_values(x.addresses) == cache_values(y.addresses));
    same_node(x.function, y.function);
    same_node(x.call, y.call);
    assert(x.base == y.base && x.call_offset == y.call_offset &&
           x.tasks.size() == y.tasks.size());
    for (size_t j = 0; j < x.tasks.size(); ++j) {
      auto &p = x.tasks[j];
      auto &q = y.tasks[j];
      same_node(p.node, q.node);
      assert(p.loop_resume == q.loop_resume &&
             size_t(p.phase) == size_t(q.phase) && p.offset == q.offset);
    }
  }
}
template <class M> static void foreign(M &m, unsigned width) {
  m.foreign = [width](auto &machine, TowerNode *fn,
                      const std::vector<CoreValue> &args) -> CoreValue {
    auto name = core_node(fn).name;
    if (name == "increment") {
      CoreType t{CoreScalar::I32, 0, nullptr, width};
      auto value = machine.load(args[0].bits, t);
      ++value.bits;
      machine.write(args[0].bits, value, t);
      return value;
    }
    if (name == "failure") {
      machine.fail("foreign failure", 17);
      return {};
    }
    // Exercise callback-driven memory relocation while an expression is
    // suspended.
    auto address = machine.allocate(1024);
    machine.bytes(address, 1024)[0] = 93;
    address = machine.reallocate(address, 8192);
    auto value = machine.bytes(address, 1)[0];
    machine.deallocate(address);
    return {value};
  };
}
static void benchmarks() {
  const char *cases[] = {
      "var i: i32 = 0; loop { i = i + 1; var done = i == 100000; if done { "
      "break; } } print(i);",
      "fn sum(n: i32): i32 { var done = n == 0; if done { return 0; } var p = "
      "n - 1; var r = sum(p); r = r + n; return r; } var i: i32 = 0; loop { "
      "var r = sum(50); i = i + 1; var done = i == 1000; if done { print(r); "
      "break; } }",
      "var i: i32 = 0; loop { var p = alloc(u8, 16); fill(p, 42, 16); p = "
      "realloc(u8, p, 64); free(p); i = i + 1; var done = i == 10000; if done "
      "{ break; } }",
      "var i: i32 = 0; loop { print(i); i = i + 1; var done = i == 10000; if "
      "done { break; } }"};
  const char *names[] = {"scalar-loop", "recursive-calls", "allocation",
                         "output"};
  for (size_t fixture = 0; fixture < 4; ++fixture) {
    std::vector<double> tower_times, native_times;
    for (int sample = 0; sample < 8; ++sample) {
      CoreMachine tower(core_compile(cases[fixture]));
      NativeCoreMachine native(core_compile(cases[fixture]));
      auto run = [](auto &machine) {
        auto start = std::chrono::steady_clock::now();
        machine.step(10000000);
        return std::chrono::duration<double, std::milli>(
                   std::chrono::steady_clock::now() - start)
            .count();
      };
      double t, n;
      if (sample % 2) {
        t = run(tower);
        n = run(native);
      } else {
        n = run(native);
        t = run(tower);
      }
      compare(tower, native);
      assert(tower.done && tower.error.empty());
      if (sample) {
        tower_times.push_back(t);
        native_times.push_back(n);
      }
    }
    std::sort(tower_times.begin(), tower_times.end());
    std::sort(native_times.begin(), native_times.end());
    std::cout << names[fixture] << " Tower median ms: " << tower_times[3]
              << "; native median ms: " << native_times[3] << '\n';
  }
}
int main(int argc, char **argv) {
  assert(interpreter_state_size() == sizeof(CoreMachineState));
  assert(interpreter_state_offset(0) == offsetof(CoreMachineState, stack));
  assert(interpreter_state_offset(1) == offsetof(CoreMachineState, heap));
  assert(interpreter_state_offset(2) ==
         offsetof(CoreMachineState, error_offset));
  assert(interpreter_state_offset(3) ==
         offsetof(CoreMachineState, output_bytes));
  assert(interpreter_state_offset(4) == offsetof(CoreMachineState, steps));
  assert(interpreter_state_offset(5) == offsetof(CoreMachineState, done));
  assert(interpreter_state_offset(6) ==
         offsetof(CoreMachineState, output_truncated));
  assert(interpreter_state_offset(7) == offsetof(CoreMachineState, failed));
  assert(interpreter_state_offset(8) ==
         offsetof(CoreMachineState, frame_count));
  assert(interpreter_state_offset(9) == offsetof(CoreMachineState, task_count));
  assert(interpreter_state_offset(10) == offsetof(CoreMachineState, cached));
  assert(interpreter_state_offset(11) == offsetof(CoreMachineState, memory_storage));
  assert(interpreter_state_offset(12) == offsetof(CoreMachineState, allocations));
  assert(interpreter_state_offset(13) == offsetof(CoreMachineState, free_blocks));
  assert(interpreter_state_offset(14) == offsetof(CoreMachineState, strings));
  assert(interpreter_state_offset(15) == offsetof(CoreMachineState, sequenced));
  assert(interpreter_state_offset(16) == offsetof(CoreMachineState, frames));
  assert(interpreter_state_offset(17) == offsetof(CoreMachineState, node_cache));
  std::ifstream file("foundation.tower");
  assert(file);
  std::ostringstream grammar;
  grammar << file.rdbuf();
  core_set_foundation(grammar.str());
  if (argc == 2 && std::string(argv[1]) == "--benchmark") {
    benchmarks();
    return 0;
  }
  const char *cases[] = {
      "print(1); print(true); print(false);",
      "var p: u8* = \"Tower\"; print(p[0]); print(p[4]); print(p[5]); var q = "
      "p; var same = p == q; print(same); var empty: u8* = \"\"; "
      "print(empty[0]);",
      "var p = alloc(u8, 16); p[0] = 1; p[1] = 2; p[2] = 3; var q = p + 1; "
      "copy(q, p, 3); print(p[3]); q = p + 2; var negative: i32 = -1; "
      "print(q[negative]); p = realloc(u8, p, "
      "0); print(p);",

      "var x: i32 = f(7); print(x); fn f(n: i32): i32 { var b = n <= 1; if b { "
      "return 1; } var p = n - 1; p = f(p); p = p * n; return p; }",
      "var n: i32 = 0; fn next(): i32 { n = n + 1; return n; } fn add(a: i32, "
      "b: i32): i32 { var result = a + b; return result; } print(add(next(), "
      "add(next(), next()))); print(n);",
      "var a: i32[3]; var index: i32 = 0; fn change(): i32 { index = 1; return "
      "42; } a[index] = change(); print(a[0]); print(a[1]);",
      "var n: i32 = 0; loop { n = n + 1; var omitted = n < 3; if omitted { "
      "continue; } loop { print(n); break; } var stop = n == 5; if stop { "
      "break; } }",
      "struct Pair { a: u8; b: i32; p: void*; } var pair: Pair; "
      "print(sizeof(Pair)); print(alignof(Pair)); print(sizeof(usize)); var p "
      "= &pair.b; *p = 42; print(pair.b); print(bits(usize, p)); print(p);",
      "var a: i32[4]; a[2] = 31; var p = &a[2]; p = p - 1; p = p + 1; "
      "print(*p); var raw = bits(usize, p); var q = bits(i32*, raw); "
      "print(*q);",
      "var p = alloc(u8, 1); fill(p, 9, 1); p = realloc(u8, p, 80); "
      "print(p[0]); var q = alloc(u8, 80); copy(q, p, 80); print(q[0]); "
      "free(p); free(q); var r = alloc(u8, 96); print(r); free(r);",
      "extern fn increment(p: i32*): i32; extern fn relocate(): i32; var a: "
      "i32 = 40; var sum = increment(&a) + increment(&a); print(sum); "
      "print(a); print(relocate());",
      "extern fn failure(): i32; print(failure());",
      "var x: u32 = 4294967295; x = x + 1; print(x); var y: i32 = -2147483648; "
      "y = y - 1; print(y); var z: u64 = 18446744073709551615; z = z + 1; "
      "print(z); var high: u64 = 9223372036854775808; print(bits(i64, high));",
      "var x: i64 = -9223372036854775808; var y: i64 = -1; var r = x / y; "
      "print(r);",
      "var x: i32 = -2147483648; var r = x % -1; print(r);",
      "var x: u32 = 1; var r = x / 0; print(r);",
      "var x: i32 = -1; print(convert(u32, x));",
      "var x: u64 = 18446744073709551615; print(convert(i64, x));",
      "var x: i64 = -9223372036854775808; print(convert(i64, x)); "
      "print(convert(bool, x));",
      "fn recurse(): void { recurse(); } recurse();",
      "var p = bits(u8*, convert(usize, 268435456)); print(*p);",
      "free(bits(u8*, convert(usize, 17)));",
      "var p = realloc(u8, bits(u8*, convert(usize, 17)), 32);",
      "var count: usize = 0; count = count - 1; var p = alloc(u64, count); "
      "print(p);",
      "loop { print(1234567890); }",
      "loop { continue; }"};
  size_t runs = 0;
  for (unsigned width : {4u, 8u})
    for (auto source : cases)
      for (size_t budget : {size_t(1), size_t(7), size_t(1000)}) {
        if (argc == 2 && std::string(argv[1]) == "--trace")
          std::fprintf(stderr, "case %zu width %u budget %zu\n", runs, width,
                       budget);
        CoreMachine tower(core_compile(source, width));
        NativeCoreMachine native(core_compile(source, width));
        if (!tower.error.empty()) {
          std::cerr << source << '\n' << tower.error << '\n';
          return 1;
        }
        foreign(tower, width);
        foreign(native, width);
        compare(tower, native);
        // Every suspension is observable; zero-budget steps must leave state
        // alone.
        tower.step(0);
        native.step(0);
        compare(tower, native);
        const bool endless = std::string_view(source).starts_with("loop {");
        const size_t limit = endless ? 128 : 12000;
        for (size_t i = 0; i < limit && !tower.done; i += budget) {
          tower.step(budget);
          native.step(budget);
          compare(tower, native);
        }
        if (endless) {
          assert(!tower.done);
          tower.step(12000);
          native.step(12000);
          compare(tower, native);
          if (std::string_view(source).find("print") != std::string_view::npos)
            assert(tower.output_truncated);
        } else {
          assert(tower.done);
          CoreMachine compact(core_compile(source, width));
          foreign(compact, width);
          assert(compact.use_fast());
          compact.step(0);
          assert(compact.steps == 0);
          for (size_t i = 0; i < 1000000 && !compact.done; i += budget) compact.step(budget);
          assert(compact.done);
          assert(compact.output == tower.output);
          assert(compact.error == tower.error);
          assert(compact.error_offset == tower.error_offset);
          assert(compact.output_truncated == tower.output_truncated);
          assert(compact.memory_size() == tower.memory_size());
          assert(std::equal(compact.memory_data(), compact.memory_data() + compact.memory_size(), tower.memory_data()));
        }
        tower.step(0);
        native.step(0);
        compare(tower, native);
        ++runs;
      }
  // Allocation ordering, splitting/coalescing, zero-size and failed realloc.
  for (unsigned width : {4u, 8u}) {
    CoreMachine source(core_compile("var p = alloc(i32, 2); p[0] = 42; print(p[0]); print(sizeof(usize)); free(p);", width));
    std::string error;
    const auto bytes = core_encode_bytecode(source.program, error);
    assert(error.empty() && bytes.size() >= 56);
    auto decoded = core_load_bytecode(bytes.data(), bytes.size(), error);
    assert(decoded && error.empty() && decoded->program.pointer_bytes == width);
    assert(core_encode_bytecode(decoded->program, error) == bytes);
    source.step(10000); decoded->step(10000);
    assert(source.done && decoded->done && source.output == decoded->output);
    auto corrupted = bytes; corrupted.back() ^= 1;
    assert(!core_load_bytecode(corrupted.data(), corrupted.size(), error));
    assert(error.find("checksum") != std::string::npos);
  }
  CoreMachine tower(core_compile(""));
  NativeCoreMachine native(core_compile(""));
  std::vector<uint64_t> blocks;
  for (size_t i = 0; i < 100; ++i) {
    auto a = tower.allocate(i * 7);
    auto b = native.allocate(i * 7);
    assert(a == b);
    blocks.push_back(a);
  }
  for (size_t i = 0; i < blocks.size(); i += 2) {
    tower.deallocate(blocks[i]);
    native.deallocate(blocks[i]);
  }
  for (size_t i = 1; i < blocks.size(); i += 2) {
    tower.deallocate(blocks[i]);
    native.deallocate(blocks[i]);
  }
  compare(tower, native);
  auto a = tower.reallocate(0, 0), b = native.reallocate(0, 0);
  assert(a == b);
  assert(tower.reallocate(a, 268435457) == native.reallocate(b, 268435457));
  compare(tower, native);
  assert(tower.reallocate(a, 0) == native.reallocate(b, 0));
  compare(tower, native);
  const char *benchmark = "var i: i32 = 0; loop { i = i + 1; var done = i == "
                          "100000; if done { break; } } print(i);";
  CoreMachine fast(core_compile(benchmark));
  NativeCoreMachine reference(core_compile(benchmark));
  auto begin = std::chrono::steady_clock::now();
  fast.step(10000000);
  auto middle = std::chrono::steady_clock::now();
  reference.step(10000000);
  auto end = std::chrono::steady_clock::now();
  compare(fast, reference);
  std::cout << "Differential runs: " << runs << "; Tower ms: "
            << std::chrono::duration<double, std::milli>(middle - begin).count()
            << "; native ms: "
            << std::chrono::duration<double, std::milli>(end - middle).count()
            << '\n';
}
