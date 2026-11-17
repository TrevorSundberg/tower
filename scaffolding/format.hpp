#pragma once
#include "tower.hpp"
#include <string>
#include <string_view>
#include <vector>

struct TowerSourceSpan { size_t begin, end, source; };
struct TowerText { std::string source; std::vector<TowerSourceSpan> spans; };
// One formatter dispatches on semantic components on ordinary Tower entities.
// Executable foundation nodes and grammar declarations share this entry point.
TowerText tower_format(TowerNode* node);
// Shared quoted Identifier decoding for grammar and executable foundation.
std::string tower_identifier_value(std::string_view text);
