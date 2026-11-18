#include "lex-pattern.hpp"
#include "compiler-utf8.hpp"
#include "parser.hpp"
#include <algorithm>
#include <utility>

extern "C" TowerNode* regex_grammar_create();
extern "C" const char* regex_compile_tree(TowerNode*, const char*, TowerNode*, LexerTable*, size_t*);
namespace {
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
}

std::shared_ptr<const LexPattern> lex_pattern_compile(const std::string& pattern, std::string& error) {
  error.clear();
  if (pattern.size() > 4096) { error = "Token pattern exceeds 4096 bytes"; return nullptr; }
  auto root = parse_pattern(pattern, error);
  if (!root) return nullptr;
  auto result = std::make_shared<LexPattern>();
  result->grammar = std::move(root);
  size_t offset = 0;
  if (const auto* message = regex_compile_tree(result->grammar.get(), pattern.data(), parser_match_get_type(), result->table, &offset)) {
    error = std::string(message) + " at pattern character " + std::to_string(character_position(pattern, offset));
    return nullptr;
  }
  return result;
}
