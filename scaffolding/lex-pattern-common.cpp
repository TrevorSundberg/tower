#include "lex-pattern.hpp"
#include "compiler-utf8.hpp"
#include <cstdlib>

size_t lex_codepoint(std::string_view source, size_t start, uint32_t& value) {
  if (start >= source.size()) { value = 0; return 0; }
  return tower_utf8_decode(reinterpret_cast<const uint8_t*>(source.data() + start), source.size() - start, &value);
}

size_t LexPattern::match(std::string_view source, size_t start) const {
  return lex_table_match(table, reinterpret_cast<const uint8_t*>(source.data()), source.size(), start);
}
