#include "lex-pattern.hpp"
size_t LexPattern::match(std::string_view source, size_t start) const {
  return lex_table_match(table, reinterpret_cast<const uint8_t*>(source.data()), source.size(), start);
}
