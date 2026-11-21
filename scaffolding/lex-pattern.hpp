#pragma once
#include <cstdint>
#include <string>
#include <string_view>
#include <vector>
#include "compiler-lexer-table.hpp"
#include "node-ref.hpp"

// A compiled regular token pattern. UTF-8 input, Unicode scalar character
// ranges, longest prefix match. No exceptions or recursive backtracking.
struct LexPattern {
  mutable size_t references;
  LexerTable* table;
  TowerNode* grammar; // retained shared entities; tables are derived
  size_t match(std::string_view source, size_t start) const;
};
extern "C" {
size_t syntax_pattern_size();
LexPattern* syntax_pattern_create(TowerNode* grammar);
void syntax_pattern_retain(const LexPattern*);
void syntax_pattern_release(const LexPattern*);
}
class LexPatternRef {
  const LexPattern* value = nullptr;
public:
  LexPatternRef() = default;
  LexPatternRef(std::nullptr_t) {}
  static LexPatternRef adopt(const LexPattern* pattern) { LexPatternRef result; result.value = pattern; return result; }
  LexPatternRef(const LexPatternRef& other) : value(other.value) { syntax_pattern_retain(value); }
  LexPatternRef(LexPatternRef&& other) noexcept : value(std::exchange(other.value, nullptr)) {}
  ~LexPatternRef() { syntax_pattern_release(value); }
  LexPatternRef& operator=(LexPatternRef other) noexcept { std::swap(value, other.value); return *this; }
  const LexPattern* get() const { return value; }
  const LexPattern* operator->() const { return value; }
  explicit operator bool() const { return value != nullptr; }
};
LexPatternRef lex_pattern_compile(const std::string& pattern, std::string& error);
