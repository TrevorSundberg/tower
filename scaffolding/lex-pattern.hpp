#pragma once
#include <cstdint>
#include <memory>
#include <string>
#include <vector>

// A compiled regular token pattern. UTF-8 input, Unicode scalar character
// ranges, longest prefix match. No exceptions or recursive backtracking.
struct LexPattern {
  std::vector<uint32_t> alphabet;
  std::vector<std::vector<int>> transitions;
  std::vector<bool> accepting;
  size_t match(const std::string& source, size_t start) const;
};
std::shared_ptr<const LexPattern> lex_pattern_compile(const std::string& pattern, std::string& error);
// Returns bytes consumed, or zero for invalid/truncated UTF-8.
size_t lex_codepoint(const std::string& source, size_t start, uint32_t& value);
