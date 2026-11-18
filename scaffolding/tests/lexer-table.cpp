#include "../compiler-lexer-table.hpp"
#include <cassert>
#include <random>
#include <string>
#include <vector>
#include <algorithm>
#include <cstdio>
struct ReferenceLexerTable;
extern "C" {
ReferenceLexerTable* reference_lex_table_create();
void reference_lex_table_destroy(ReferenceLexerTable*);
bool reference_lex_table_set_alphabet(ReferenceLexerTable*, const uint32_t*, size_t);
bool reference_lex_table_append(ReferenceLexerTable*, const int32_t*, size_t, bool);
size_t reference_lex_table_match(ReferenceLexerTable*, const uint8_t*, size_t, size_t);
size_t tower_test_buffer_count();
void tower_test_buffer_fail_next();
void tower_test_buffer_fail_after(size_t);
}

namespace {
struct NfaState {
  uint32_t kind, first, last;
  int32_t out, other;
  bool negated;
};
std::vector<int> closure(const std::vector<NfaState>& nfa, std::vector<int> pending) {
  std::vector<bool> visited(nfa.size()); std::vector<int> result;
  while (!pending.empty()) {
    int at = pending.back(); pending.pop_back();
    if (at < 0 || visited[at]) continue;
    visited[at] = true;
    if (nfa[at].kind == 1) { pending.push_back(nfa[at].out); pending.push_back(nfa[at].other); }
    else result.push_back(at);
  }
  std::sort(result.begin(), result.end()); return result;
}
void automaton_tests() {
  const auto baseline = tower_test_buffer_count();
  // Every allocation failure in create/compile releases owned buffers. A
  // failed optional compilation may discard its partially filled output table.
  for (size_t fail = 0; fail < 2; ++fail) {
    tower_test_buffer_fail_after(fail);
    assert(!automaton_create(128));
    assert(tower_test_buffer_count() == baseline);
  }
  bool reached_success = false;
  for (size_t fail = 0; fail < 64 && !reached_success; ++fail) {
    auto* nfa = automaton_create(128); auto* table = lex_table_create();
    assert(automaton_add(nfa, 0, 1, -1, false) == 0);
    assert(automaton_range(nfa, 0, 'a', 'z'));
    assert(automaton_add(nfa, 2, -1, -1, false) == 1);
    tower_test_buffer_fail_after(fail);
    const auto status = automaton_compile(nfa, 0, 1, table, true);
    tower_test_buffer_fail_after(SIZE_MAX);
    assert(status == 0 || status == 2); reached_success = status == 0;
    lex_table_destroy(table); automaton_destroy(nfa);
    assert(tower_test_buffer_count() == baseline);
  }
  assert(reached_success);
  // Random NFAs with epsilon cycles, complements and token IDs outside Unicode.
  // Compare each DFA step against a separate direct NFA simulation, not another
  // implementation of subset construction.
  std::mt19937 random(0x444641);
  constexpr uint32_t base = 0x200000, limit = base + 16;
  for (unsigned trial = 0; trial < 150; ++trial) {
    const unsigned count = 2 + random() % 30;
    std::vector<NfaState> states;
    auto* nfa = automaton_create(limit); auto* table = lex_table_create();
    for (unsigned i = 0; i < count; ++i) {
      NfaState s{uint32_t(random() % 2), uint32_t(base + random() % 16), 0, int32_t(random() % count), int32_t(random() % count), bool(random() % 2)};
      if (i == count - 1) s.kind = 2;
      s.last = std::min<uint32_t>(limit - 1, s.first + random() % 4);
      states.push_back(s);
      assert(automaton_add(nfa, s.kind, s.out, s.other, s.negated) == int32_t(i));
      if (!s.kind) assert(automaton_range(nfa, i, s.first, s.last));
    }
    const auto status = automaton_compile(nfa, 0, count - 1, table, false);
    assert(status == 0 || status == 3); // Explicit bounded subset explosion.
    if (!status) for (unsigned sample = 0; sample < 25; ++sample) {
      auto active = closure(states, {0}); int32_t state = 0;
      assert(lex_table_accepts(table, state) == std::binary_search(active.begin(), active.end(), count - 1));
      for (unsigned step = 0; step < 20; ++step) {
        const uint32_t symbol = sample % 2 ? base + random() % 16 : random() % 32;
        std::vector<int> next;
        for (int index : active) {
          const auto& s = states[index];
          if (!s.kind && ((symbol >= s.first && symbol <= s.last) != s.negated)) next.push_back(s.out);
        }
        active = closure(states, std::move(next));
        if (state >= 0) state = lex_table_step(table, state, symbol);
        assert((state < 0) == active.empty());
        assert(lex_table_accepts(table, state < 0 ? SIZE_MAX : size_t(state)) == std::binary_search(active.begin(), active.end(), count - 1));
      }
      assert(lex_table_step(table, 0, limit) == -1);
    }
    lex_table_destroy(table); automaton_destroy(nfa);
    assert(tower_test_buffer_count() == baseline);
  }
  puts("Tower automata: allocation failures and 150 random integer-symbol NFAs agree with direct simulation.");
}
}

void lexer_table_tests() {
  automaton_tests();
  const auto baseline = tower_test_buffer_count();
  tower_test_buffer_fail_next(); assert(!lex_table_create());
  {
    auto* table = lex_table_create();
    const uint32_t alphabet[] = {0, 'a', 'z' + 1, 0x110000};
    const int32_t row[] = {-1, 0, -1};
    assert(!lex_table_set_alphabet(table, alphabet, 1));
    assert(!lex_table_append(table, row, 3, true));
    tower_test_buffer_fail_next(); assert(!lex_table_set_alphabet(table, alphabet, 4));
    assert(lex_table_set_alphabet(table, alphabet, 4));
    assert(!lex_table_append(table, row, 2, true));
    tower_test_buffer_fail_next(); assert(!lex_table_append(table, row, 3, true));
    for (int i = 0; i < 8; ++i) assert(lex_table_append(table, row, 3, true));
    assert(!lex_table_set_alphabet(table, alphabet, 4));
    // Transition capacity already fits this row. Fail accepting-state growth.
    tower_test_buffer_fail_next(); assert(!lex_table_append(table, row, 3, true));
    assert(lex_table_match(table, reinterpret_cast<const uint8_t*>("abc!"), 4, 0) == 3);
    assert(lex_table_append(table, row, 3, true));
    lex_table_destroy(table);
  }
  assert(tower_test_buffer_count() == baseline);
  std::mt19937 random(0x746f7765);
  const std::vector<uint32_t> alphabet{0, 1, 32, '0', '9' + 1, 'A', 'Z' + 1, 'a', 'z' + 1, 0x80, 0x800, 0x10000, 0x110000};
  const std::vector<std::string> fragments{"a", "Z", "7", " ", std::string(1, '\0'), "\xc3\xa9", "\xe2\x82\xac", "\xf0\x9f\x8f\xb0", "\xff", "\xc0\xaf", "\xf4\x90\x80\x80", "\xe2\x82"};
  for (int trial = 0; trial < 500; ++trial) {
    auto* actual = lex_table_create(); auto* reference = reference_lex_table_create();
    assert(lex_table_set_alphabet(actual, alphabet.data(), alphabet.size()));
    assert(reference_lex_table_set_alphabet(reference, alphabet.data(), alphabet.size()));
    const int rows = 1 + random() % 16;
    for (int i = 0; i < rows; ++i) {
      std::vector<int32_t> row;
      for (size_t j = 1; j < alphabet.size(); ++j) row.push_back(int32_t(random() % (rows + 1)) - 1);
      const bool accepting = random() % 2;
      assert(lex_table_append(actual, row.data(), row.size(), accepting));
      assert(reference_lex_table_append(reference, row.data(), row.size(), accepting));
    }
    for (int sample = 0; sample < 20; ++sample) {
      std::string source;
      for (int i = 0; i < sample; ++i) source += fragments[random() % fragments.size()];
      const auto* bytes = reinterpret_cast<const uint8_t*>(source.data());
      for (size_t start = 0; start <= source.size() + 1; ++start)
        assert(lex_table_match(actual, bytes, source.size(), start) == reference_lex_table_match(reference, bytes, source.size(), start));
    }
    lex_table_destroy(actual); reference_lex_table_destroy(reference);
  }
  assert(tower_test_buffer_count() == baseline);
}
