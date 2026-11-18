#pragma once
#include <cstdint>
#include <memory>
#include <string>
#include <string_view>
#include <vector>
#include "compiler-lexer-table.hpp"

// A compiled regular token pattern. UTF-8 input, Unicode scalar character
// ranges, longest prefix match. No exceptions or recursive backtracking.
struct LexPattern {
  LexerTable* table;
  LexPattern();
  ~LexPattern();
  LexPattern(const LexPattern&) = delete;
  LexPattern& operator=(const LexPattern&) = delete;
  size_t match(std::string_view source, size_t start) const;
};
std::shared_ptr<const LexPattern> lex_pattern_compile(const std::string& pattern, std::string& error);
// Returns bytes consumed, or zero for invalid/truncated UTF-8.
size_t lex_codepoint(std::string_view source, size_t start, uint32_t& value);
