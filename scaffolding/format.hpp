#pragma once
#include "tower.hpp"
#include <string>
#include <vector>

struct TowerSourceSpan { size_t begin, end, source; };
struct TowerText { std::string source; std::vector<TowerSourceSpan> spans; std::string error; };
// One formatter dispatches on semantic components on ordinary Tower entities.
// Executable foundation nodes and grammar declarations share this entry point.
// Production traversal/layout is implemented in compiler/format*.tower.
TowerText tower_format(TowerNode* node);
