#include "lex-pattern.hpp"
#include "compiler-utf8.hpp"
#include "parser.hpp"
#include <algorithm>
#include <cassert>
#include <cstring>
#include <unordered_map>
#include <utility>

extern "C" TowerNode* regex_grammar_create();
namespace {
Match* match(TowerNode* node) { return static_cast<Match*>(tower_node_get_component_userdata(node, parser_match_get_type())); }
bool named(TowerNode* node, const char* name) { return node && !std::strcmp(parser_match_get_label(match(node)), name); }
TowerNode* member(TowerNode* node, const char* name) { return tower_node_get_child_member(node, name); }
size_t character_position(const std::string& source, size_t offset) {
  size_t character = 1;
  for (size_t at = 0; at < std::min(offset, source.size()); ++character) {
    uint32_t value; auto size = lex_codepoint(source, at, value); at += size ? size : 1;
  }
  return character;
}
TowerNodeRef parse_pattern(const std::string& source, std::string& error) {
  if (!tower_utf8_validate(reinterpret_cast<const uint8_t*>(source.data()), source.size(), 0)) {
    error = "Invalid UTF-8 in token pattern"; return {};
  }
  struct Grammar {
    TowerNodeRef root = TowerNodeRef::adopt(regex_grammar_create());
    Table* table = nullptr;
    std::string error;
    Grammar() {
      char* message = nullptr;
      table = parser_table_create(root.get(), nullptr, nullptr, parser_table_utf8_id_to_string, &message);
      if (message) { error = message; tower_memory_free(message); }
    }
    ~Grammar() { parser_table_destroy(table); }
  };
  static Grammar grammar;
  if (!grammar.table) { error = "Invalid regex grammar: " + grammar.error; return {}; }
  auto* stream = parser_stream_utf8_create(source.data(), source.data() + source.size());
  auto* parser = parser_recognizer_create(grammar.table, stream);
  TowerNode* result = nullptr; bool running = true;
  while (running) { if (auto* node = parser_recognizer_step(parser, &running)) result = node; }
  if (!result) {
    auto diagnostic = parser_recognizer_diagnostic(parser);
    error = std::string(parser_recognizer_get_error(parser)) + " In token pattern at character " +
      std::to_string(character_position(source, diagnostic.offset));
  }
  parser_recognizer_destroy(parser); parser_stream_destroy(stream);
  return TowerNodeRef::adopt(result);
}

using ScalarRange = std::pair<uint32_t, uint32_t>;
struct State {
  enum Kind { Character, Split, Accept } kind;
  int out = -1, other = -1;
  std::vector<ScalarRange> ranges;
  bool negated = false;
};
struct Patch { int state; bool other; };
struct Fragment { int start = -1; std::vector<Patch> ends; };
// NFA lowering consumes the ordinary parser entities. It does not read pattern
// structure from characters; source slices are used only to decode scalar values.
struct Compiler {
  const std::string& pattern;
  std::string& error;
  size_t cursor = 0;
  Automaton* automaton = automaton_create(0x110000);
  Compiler(const std::string& source, std::string& message): pattern(source), error(message) {
    if (!automaton) error = "Unable to allocate token automaton";
  }
  ~Compiler() { automaton_destroy(automaton); }
  void fail(const std::string& message) {
    if (error.empty()) error = message + " at pattern character " + std::to_string(character_position(pattern, cursor));
  }
  int add(State state) {
    if (!automaton) return -1;
    int index = automaton_add(automaton, state.kind, state.out, state.other, state.negated);
    if (index < 0) { fail("Token pattern exceeds 512 NFA states"); return -1; }
    for (auto [first, last] : state.ranges)
      if (!automaton_range(automaton, index, first, last)) { fail("Unable to allocate token ranges"); return -1; }
    return index;
  }
  void patch(const std::vector<Patch>& ends, int target) {
    for (auto end : ends) if (end.state >= 0) automaton_patch(automaton, end.state, end.other, target);
  }
  uint32_t scalar(TowerNode* node) {
    auto* m = match(node); cursor = parser_match_get_start(m);
    const auto text = std::string_view(pattern).substr(cursor, parser_match_get_length(m));
    assert(!text.empty());
    if (text.front() != '\\') { uint32_t value = 0; lex_codepoint(text, 0, value); return value; }
    const char escape = text[1];
    if (escape == 'n') return '\n';
    if (escape == 'r') return '\r';
    if (escape == 't') return '\t';
    if (escape != 'u' && escape != 'x') return static_cast<unsigned char>(escape);
    const auto digits = text.substr(escape == 'u' ? 3 : 2, text.size() - (escape == 'u' ? 4 : 2));
    if (digits.empty() || digits.size() > 6) { fail("Invalid Unicode scalar escape"); return 0; }
    uint32_t value = 0;
    for (char c : digits) value = value * 16 + (c <= '9' ? c - '0' : c <= 'F' ? c - 'A' + 10 : c - 'a' + 10);
    if (value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) fail("Invalid Unicode scalar escape");
    return value;
  }
  Fragment atom(TowerNode* node) {
    State state{State::Character};
    if (named(node, "RegexClass")) {
      state.negated = member(node, "negated") != nullptr;
      std::vector<TowerNode*> pending{state.negated ? member(node, "negated") : member(node, "body")}, characters;
      while (!pending.empty()) {
        auto* at = pending.back(); pending.pop_back();
        if (named(at, "RegexClassFirst") || named(at, "RegexClassCharacter")) characters.push_back(at);
        else for (size_t i = tower_node_get_child_count(at); i; --i) pending.push_back(tower_node_get_child(at, i - 1));
      }
      if (characters.empty()) { fail("Empty character class"); return {}; }
      for (size_t i = 0; i < characters.size();) {
        uint32_t low = scalar(characters[i++]), high = low;
        if (i + 1 < characters.size()) {
          auto* dash = match(characters[i]);
          if (parser_match_get_length(dash) == 1 && pattern[parser_match_get_start(dash)] == '-') {
            ++i; high = scalar(characters[i++]);
            if (high < low) fail("Reversed character range");
          }
        }
        state.ranges.push_back({low, high});
      }
    } else if (named(node, "RegexAtom")) {
      state.negated = true; state.ranges = {{'\n', '\n'}, {'\r', '\r'}};
    } else { auto value = scalar(node); state.ranges = {{value, value}}; }
    const int index = add(std::move(state)); return {index, {{index, false}}};
  }
  Fragment lower(TowerNode* root) {
    struct Visit { TowerNode* node; size_t depth; bool finish; };
    std::vector<Visit> pending{{root, 0, false}};
    std::unordered_map<TowerNode*, Fragment> fragments;
    while (!pending.empty() && error.empty()) {
      auto visit = pending.back(); pending.pop_back(); auto* node = visit.node;
      cursor = parser_match_get_start(match(node));
      if (visit.depth > 64) { fail("Token pattern nesting exceeds 64"); break; }
      auto take = [&](const char* name) { return std::move(fragments[member(node, name)]); };
      if (!visit.finish) {
        pending.push_back({node, visit.depth, true});
        if (named(node, "Regex") || named(node, "RegexChoice")) {
          if (auto* left = member(node, "left")) {
            pending.push_back({member(node, "right"), visit.depth, false}); pending.push_back({left, visit.depth, false});
          } else pending.push_back({member(node, "value"), visit.depth, false});
        } else if (named(node, "RegexSequence")) {
          if (auto* left = member(node, "left")) {
            pending.push_back({member(node, "right"), visit.depth, false}); pending.push_back({left, visit.depth, false});
          }
        } else if (named(node, "RegexRepeat")) pending.push_back({member(node, "atom"), visit.depth, false});
        else if (auto* group = member(node, "group")) pending.push_back({group, visit.depth + 1, false});
        continue;
      }
      Fragment result;
      if (named(node, "Regex")) result = take("value");
      else if (named(node, "RegexChoice")) {
        if (member(node, "left")) {
          auto left = take("left"), right = take("right");
          result.start = add({State::Split, left.start, right.start});
          result.ends = std::move(left.ends); result.ends.insert(result.ends.end(), right.ends.begin(), right.ends.end());
          if (left.start < 0) result.ends.push_back({result.start, false});
          if (right.start < 0) result.ends.push_back({result.start, true});
        } else result = take("value");
      } else if (named(node, "RegexSequence")) {
        if (member(node, "left")) {
          auto left = take("left"), right = take("right");
          if (left.start < 0) result = std::move(right);
          else if (right.start < 0) result = std::move(left);
          else { patch(left.ends, right.start); result = {left.start, std::move(right.ends)}; }
        }
      } else if (named(node, "RegexRepeat")) {
        result = take("atom"); auto* suffix = match(member(node, "suffix"));
        if (result.start >= 0 && parser_match_get_length(suffix)) {
          const char operation = pattern[parser_match_get_start(suffix)];
          const int split = add({State::Split, result.start});
          if (operation == '?') result.ends.push_back({split, true});
          else { patch(result.ends, split); result.ends = {{split, true}}; }
          if (operation != '+') result.start = split;
        }
      } else if (member(node, "group")) result = take("group");
      else result = atom(member(node, "value") ? member(node, "value") : node);
      fragments[node] = std::move(result);
    }
    return std::move(fragments[root]);
  }
};
}

std::shared_ptr<const LexPattern> lex_pattern_compile(const std::string& pattern, std::string& error) {
  error.clear();
  if (pattern.size() > 4096) { error = "Token pattern exceeds 4096 bytes"; return nullptr; }
  auto root = parse_pattern(pattern, error);
  if (!root) return nullptr;
  Compiler compiler{pattern, error};
  auto fragment = compiler.lower(root.get());
  if (fragment.start < 0 && error.empty()) error = "Token pattern must not match empty input";
  if (!error.empty()) return nullptr;
  int accept = compiler.add({State::Accept}); compiler.patch(fragment.ends, accept);
  if (!error.empty()) return nullptr;
  auto result = std::make_shared<LexPattern>();
  result->grammar = std::move(root);
  if (!result->table) { error = "Unable to allocate lexer table"; return nullptr; }
  const auto status = automaton_compile(compiler.automaton, fragment.start, accept, result->table, true);
  if (status) {
    error = status == 1 ? "Token pattern exceeds 512 NFA states" : status == 3 ? "Token pattern exceeds DFA complexity limit" :
      status == 4 ? "Token pattern must not match empty input" : "Unable to allocate token automaton";
    return nullptr;
  }
  return result;
}
