#pragma once
#include "tower.hpp"
struct ParseForest { size_t first = TOWER_INVALID_INDEX, last = TOWER_INVALID_INDEX; };
struct ParseForestStore;
extern "C" {
ParseForestStore* parse_forest_create();
void parse_forest_destroy(ParseForestStore*);
bool parse_forest_leaf(ParseForestStore*, TowerNode*, ParseForest*);
bool parse_forest_join(ParseForestStore*, ParseForest*, size_t, size_t, const char*);
bool parse_forest_attach(ParseForestStore*, TowerNode*, size_t);
TowerNode* parse_forest_take(ParseForestStore*, size_t);
size_t parse_forest_visits(ParseForestStore*);
}
