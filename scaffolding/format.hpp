#pragma once
#include "tower.hpp"
#include <string>
#include <string_view>
#include <vector>

struct TowerSourceSpan { size_t begin, end, source; };
struct TowerText { std::string source; std::vector<TowerSourceSpan> spans; std::string error; };
// One formatter dispatches on semantic components on ordinary Tower entities.
// Executable foundation nodes and grammar declarations share this entry point.
// Production traversal/layout is implemented in compiler/format*.tower.
TowerText tower_format(TowerNode* node);
// Source layout uses original parse nodes before replacement. Comments are
// lexer-derived trivia spans, never rescanned with a second token grammar.
struct TowerCommentSpan { size_t start, end; };
TowerText tower_format_source(const std::vector<TowerNode*>& roots, std::string_view source,
  const std::vector<TowerCommentSpan>& comments);
// Shared quoted Identifier decoding for grammar and executable foundation.
std::string tower_identifier_value(std::string_view text);
