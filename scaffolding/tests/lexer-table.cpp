#include "../compiler-lexer-table.hpp"
#include <cassert>
#include <random>
#include <string>
#include <vector>
struct ReferenceLexerTable;
extern "C" {
ReferenceLexerTable* reference_lex_table_create();
void reference_lex_table_destroy(ReferenceLexerTable*);
bool reference_lex_table_set_alphabet(ReferenceLexerTable*, const uint32_t*, size_t);
bool reference_lex_table_append(ReferenceLexerTable*, const int32_t*, size_t, bool);
size_t reference_lex_table_match(ReferenceLexerTable*, const uint8_t*, size_t, size_t);
size_t tower_test_buffer_count();
void tower_test_buffer_fail_next();
}

void lexer_table_tests() {
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
