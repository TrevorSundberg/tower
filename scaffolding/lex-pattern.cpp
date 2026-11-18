#include "lex-pattern.hpp"
#include "compiler-utf8.hpp"
#include <algorithm>
#include <map>
#include <utility>
#include <cstdlib>

LexPattern::LexPattern() : table(lex_table_create()) { if (!table) std::abort(); }
LexPattern::~LexPattern() { lex_table_destroy(table); }

size_t lex_codepoint(std::string_view source, size_t start, uint32_t& value) {
  if (start >= source.size()) { value = 0; return 0; }
  return tower_utf8_decode(reinterpret_cast<const uint8_t*>(source.data() + start), source.size() - start, &value);
}

namespace {
using Range = std::pair<uint32_t, uint32_t>;
struct State {
  enum Kind { Character, Split, Accept } kind;
  int out = -1, other = -1;
  std::vector<Range> ranges;
  bool negated = false;
};
struct Patch { int state; bool other; };
struct Fragment { int start; std::vector<Patch> ends; };
struct Compiler {
  const std::string& pattern;
  std::string& error;
  size_t cursor = 0, depth = 0;
  std::vector<State> states;
  bool take(char c) { if (cursor < pattern.size() && pattern[cursor] == c) { ++cursor; return true; } return false; }
  void fail(const std::string& message) { if (error.empty()) error = message + " at pattern byte " + std::to_string(cursor); }
  int add(State state) {
    if (states.size() >= 512) { fail("Token pattern exceeds 512 NFA states"); return -1; }
    states.push_back(std::move(state)); return (int)states.size() - 1;
  }
  void patch(const std::vector<Patch>& ends, int target) {
    for (auto end : ends) if (end.state >= 0) (end.other ? states[end.state].other : states[end.state].out) = target;
  }
  uint32_t character() {
    if (cursor == pattern.size()) { fail("Expected character"); return 0; }
    if (take('\\')) {
      if (cursor == pattern.size()) { fail("Incomplete escape"); return 0; }
      char c = pattern[cursor++];
      if (c == 'n') return '\n';
      if (c == 'r') return '\r';
      if (c == 't') return '\t';
      if (c == 'u' || c == 'x') {
        bool braces = c == 'u';
        if (braces && !take('{')) { fail("Use \\u{hex} for Unicode escapes"); return 0; }
        uint32_t value = 0; size_t digits = 0;
        while (cursor < pattern.size() && (braces ? pattern[cursor] != '}' : digits < 2)) {
          char h = pattern[cursor++];
          int digit = h >= '0' && h <= '9' ? h - '0' : h >= 'a' && h <= 'f' ? h - 'a' + 10 : h >= 'A' && h <= 'F' ? h - 'A' + 10 : -1;
          if (digit < 0 || ++digits > 6) { fail("Invalid hexadecimal escape"); return 0; }
          value = value * 16 + digit;
        }
        if (!digits || (!braces && digits != 2) || (braces && !take('}')) || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff))
          fail("Invalid Unicode scalar escape");
        return value;
      }
      if (std::string("\\/[]()|*+?.^-{}$\"'").find(c) != std::string::npos) return (unsigned char)c;
      fail("Unsupported escape (use explicit character ranges)"); return 0;
    }
    uint32_t value = 0; size_t count = lex_codepoint(pattern, cursor, value);
    if (!count) { fail("Invalid UTF-8"); return 0; }
    cursor += count; return value;
  }
  Fragment atom() {
    if (take('(')) {
      if (++depth > 64) { fail("Token pattern nesting exceeds 64"); return {-1, {}}; }
      auto result = expression(); --depth;
      if (!take(')')) fail("Expected closing parenthesis");
      return result;
    }
    State state{State::Character};
    if (take('[')) {
      state.negated = take('^');
      while (cursor < pattern.size() && pattern[cursor] != ']' && error.empty()) {
        uint32_t low = character(), high = low;
        if (cursor + 1 < pattern.size() && pattern[cursor] == '-' && pattern[cursor + 1] != ']') {
          ++cursor; high = character();
          if (high < low) fail("Reversed character range");
        }
        state.ranges.push_back({low, high});
      }
      if (!take(']')) fail("Expected closing character bracket");
      if (state.ranges.empty()) fail("Empty character class");
    } else if (take('.')) {
      state.negated = true; state.ranges = {{'\n', '\n'}, {'\r', '\r'}};
    } else {
      if (cursor < pattern.size() && std::string("*+?^${}").find(pattern[cursor]) != std::string::npos) {
        fail("Unsupported or misplaced pattern operator"); return {-1, {}};
      }
      uint32_t value = character(); state.ranges = {{value, value}};
    }
    int index = add(std::move(state)); return {index, {{index, false}}};
  }
  Fragment repeat() {
    auto result = atom();
    if (!error.empty() || cursor == pattern.size()) return result;
    char c = pattern[cursor];
    if (c == '*' || c == '+' || c == '?') {
      ++cursor;
      int split = add({State::Split, result.start});
      if (c == '?') result.ends.push_back({split, true});
      else { patch(result.ends, split); result.ends = {{split, true}}; }
      if (c != '+') result.start = split;
      if (cursor < pattern.size() && std::string("*+?").find(pattern[cursor]) != std::string::npos) fail("Repeated quantifier");
    }
    return result;
  }
  Fragment sequence() {
    Fragment result{-1, {}};
    while (cursor < pattern.size() && pattern[cursor] != ')' && pattern[cursor] != '|' && error.empty()) {
      auto next = repeat();
      if (result.start < 0) result = std::move(next);
      else { patch(result.ends, next.start); result.ends = std::move(next.ends); }
    }
    if (result.start < 0 && error.empty()) { int index = add({State::Split}); result = {index, {{index, false}}}; }
    return result;
  }
  Fragment expression() {
    auto result = sequence();
    while (error.empty() && take('|')) {
      auto next = sequence();
      result.start = add({State::Split, result.start, next.start});
      result.ends.insert(result.ends.end(), next.ends.begin(), next.ends.end());
    }
    return result;
  }
  std::vector<int> closure(const std::vector<int>& seeds) const {
    std::vector<bool> visited(states.size()); std::vector<int> pending = seeds, result;
    while (!pending.empty()) {
      int index = pending.back(); pending.pop_back();
      if (index < 0 || visited[index]) continue;
      visited[index] = true;
      if (states[index].kind == State::Split) { pending.push_back(states[index].out); pending.push_back(states[index].other); }
      else result.push_back(index);
    }
    std::sort(result.begin(), result.end()); return result;
  }
};
}

std::shared_ptr<const LexPattern> lex_pattern_compile(const std::string& pattern, std::string& error) {
  error.clear();
  if (pattern.size() > 4096) { error = "Token pattern exceeds 4096 bytes"; return nullptr; }
  Compiler compiler{pattern, error};
  auto fragment = compiler.expression();
  if (compiler.cursor != pattern.size()) compiler.fail("Unexpected pattern character");
  if (!error.empty()) return nullptr;
  int accept = compiler.add({State::Accept}); compiler.patch(fragment.ends, accept);
  if (!error.empty()) return nullptr;
  auto result = std::make_shared<LexPattern>();
  std::vector<uint32_t> alphabet = {0, 0x110000};
  for (const auto& state : compiler.states) for (auto [low, high] : state.ranges) {
    alphabet.push_back(low); alphabet.push_back(high + 1);
  }
  std::sort(alphabet.begin(), alphabet.end()); alphabet.erase(std::unique(alphabet.begin(), alphabet.end()), alphabet.end());
  if (!lex_table_set_alphabet(result->table, alphabet.data(), alphabet.size())) { error = "Unable to allocate lexer alphabet"; return nullptr; }
  std::vector<std::vector<int>> subsets{compiler.closure({fragment.start})};
  if (std::binary_search(subsets[0].begin(), subsets[0].end(), accept)) { error = "Token pattern must not match empty input"; return nullptr; }
  std::map<std::vector<int>, int> indices{{subsets[0], 0}};
  for (size_t i = 0; i < subsets.size(); ++i) {
    const bool accepting = std::binary_search(subsets[i].begin(), subsets[i].end(), accept);
    std::vector<int> row;
    for (size_t c = 0; c + 1 < alphabet.size(); ++c) {
      std::vector<int> next;
      for (int index : subsets[i]) {
        const auto& state = compiler.states[index];
        if (state.kind != State::Character) continue;
        bool inside = std::any_of(state.ranges.begin(), state.ranges.end(), [&](Range r) { return r.first <= alphabet[c] && alphabet[c] <= r.second; });
        if (inside != state.negated) next.push_back(state.out);
      }
      auto closed = compiler.closure(next);
      if (closed.empty()) { row.push_back(-1); continue; }
      auto found = indices.find(closed);
      if (found == indices.end()) {
        if (subsets.size() >= 1024 || (subsets.size() + 1) * alphabet.size() > 262144) {
          error = "Token pattern exceeds DFA complexity limit"; return nullptr;
        }
        int id = (int)subsets.size(); indices.emplace(closed, id); subsets.push_back(std::move(closed)); row.push_back(id);
      } else row.push_back(found->second);
    }
    if (!lex_table_append(result->table, row.data(), row.size(), accepting)) { error = "Unable to allocate lexer transitions"; return nullptr; }
  }
  return result;
}

size_t LexPattern::match(std::string_view source, size_t start) const {
  return lex_table_match(table, reinterpret_cast<const uint8_t*>(source.data()), source.size(), start);
}
