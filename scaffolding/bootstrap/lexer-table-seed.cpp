// Transitional reference for the Tower-owned DFA cache and matcher.
#include "../compiler-lexer-table.hpp"
#include "../compiler-utf8.hpp"
#include <algorithm>
#include <vector>
struct SymbolSequence { std::vector<std::pair<uint32_t, uint32_t>> symbols; };
extern "C" SymbolSequence* symbol_sequence_create(size_t count) { return new SymbolSequence{std::vector<std::pair<uint32_t, uint32_t>>(count)}; }
extern "C" void symbol_sequence_destroy(SymbolSequence* sequence) { delete sequence; }
extern "C" void symbol_sequence_set(SymbolSequence* sequence, size_t state, uint32_t first, uint32_t last) { sequence->symbols[state] = {first, last}; }
extern "C" bool symbol_sequence_accepts(SymbolSequence* sequence, size_t state, uint32_t symbol) {
  return state < sequence->symbols.size() && symbol >= sequence->symbols[state].first && symbol <= sequence->symbols[state].second;
}
struct LexerTable {
  std::vector<uint32_t> alphabet;
  std::vector<std::vector<int32_t>> transitions;
  std::vector<bool> accepting;
};
extern "C" LexerTable* lex_table_create() { return new LexerTable; }
extern "C" void lex_table_destroy(LexerTable* table) { delete table; }
extern "C" bool lex_table_set_alphabet(LexerTable* table, const uint32_t* values, size_t count) {
  if (count < 2 || !table->accepting.empty()) return false;
  table->alphabet.assign(values, values + count); return true;
}
extern "C" bool lex_table_append(LexerTable* table, const int32_t* values, size_t count, bool accepting) {
  if (table->alphabet.size() < 2 || count != table->alphabet.size() - 1) return false;
  table->transitions.emplace_back(values, values + count); table->accepting.push_back(accepting); return true;
}
extern "C" size_t lex_table_match(LexerTable* table, const uint8_t* source, size_t length, size_t start) {
  size_t position = start, longest = 0; int32_t state = 0;
  while (position < length) {
    uint32_t scalar; const auto bytes = tower_utf8_decode(source + position, length - position, &scalar);
    if (!bytes) break;
    const auto column = std::upper_bound(table->alphabet.begin(), table->alphabet.end(), scalar) - table->alphabet.begin() - 1;
    state = table->transitions[state][column];
    if (state < 0) break;
    position += bytes;
    if (table->accepting[state]) longest = position - start;
  }
  return longest;
}
extern "C" int32_t lex_table_step(LexerTable* table, size_t state, uint32_t symbol) {
  if (state >= table->transitions.size() || symbol < table->alphabet.front() || symbol >= table->alphabet.back()) return -1;
  const auto column = std::upper_bound(table->alphabet.begin(), table->alphabet.end(), symbol) - table->alphabet.begin() - 1;
  return table->transitions[state][column];
}
extern "C" bool lex_table_accepts(LexerTable* table, size_t state) {
  return state < table->accepting.size() && table->accepting[state];
}
