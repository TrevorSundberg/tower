#include "../lex-pattern.hpp"
#include "../parser.hpp"
#include <cassert>
#include <cstdio>
#include <random>
#include <string>
#include <vector>
std::shared_ptr<const LexPattern> reference_lex_pattern_compile(const std::string&, std::string&);
namespace {
std::string pattern(std::mt19937& random, unsigned depth) {
  static const char* atoms[] = {"a", "b", ".", "[a-c]", "[^b]", "\\x61", "\\u{e9}", "[a\\-c]", "[\\]\\\\]"};
  if (!depth) return atoms[random() % 9];
  switch (random() % 5) {
    case 0: return pattern(random, depth - 1) + pattern(random, depth - 1);
    case 1: return "(" + pattern(random, depth - 1) + "|" + pattern(random, depth - 1) + ")";
    case 2: return "(" + pattern(random, depth - 1) + ")*";
    case 3: return "(" + pattern(random, depth - 1) + ")+";
    default: return "(" + pattern(random, depth - 1) + ")?";
  }
}
void compare(const std::string& source, std::mt19937& random) {
  std::string actual_error, reference_error;
  auto actual = lex_pattern_compile(source, actual_error);
  auto reference = reference_lex_pattern_compile(source, reference_error);
  if (bool(actual) != bool(reference)) std::fprintf(stderr, "Regex disagreement: %s\nnew: %s\nold: %s\n", source.c_str(), actual_error.c_str(), reference_error.c_str());
  assert(bool(actual) == bool(reference));
  if (!actual) { assert(!actual_error.empty() && !reference_error.empty()); return; }
  assert(actual->grammar && actual_error.empty() && reference_error.empty());
  auto* root = static_cast<Match*>(tower_node_get_component_userdata(actual->grammar.get(), parser_match_get_type()));
  assert(root && parser_match_get_start(root) == 0 && parser_match_get_length(root) == source.size());
  const std::vector<std::string> alphabet{"a", "b", "c", "]", "\\", "\n", "\xc3\xa9", "\xf0\x9f\x8f\xb0", "\xff", std::string(1, '\0')};
  for (unsigned sample = 0; sample < 60; ++sample) {
    std::string input;
    for (unsigned i = 0; i < sample % 20; ++i) input += alphabet[random() % alphabet.size()];
    for (size_t offset = 0; offset <= input.size(); ++offset) assert(actual->match(input, offset) == reference->match(input, offset));
  }
}
}
void regex_tests() {
  std::mt19937 random(0x52454758);
  for (unsigned i = 0; i < 300; ++i) compare(pattern(random, 3), random);
  for (const auto* source : {"()a", "a()", "a(b?)*", "(a|)b", "[^^]", "[a-b-c]", "[a\\-z]", "[a-]", "[]", "[^]", "a**", "\\x0", "\\u{}", "\\u{0000000}", "\\u{d800}", "[z-a]", "[a--b]", "]", "a|ab"}) compare(source, random);
  const std::string characters = "abc[]()|*+?\\nrtxu{}012-F^.$";
  for (unsigned i = 0; i < 500; ++i) {
    std::string source;
    for (unsigned j = 0; j < i % 13; ++j) source += characters[random() % characters.size()];
    compare(source, random);
  }
  compare(std::string("a\0b", 3), random);
  compare("a\xff", random);
}
