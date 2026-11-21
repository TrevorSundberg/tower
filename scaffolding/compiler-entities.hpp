#pragma once
#include "tower.hpp"
// Opaque C ABI to the actual Tower entities. No second native node layout.
struct CompilerWorld;
extern "C" {
CompilerWorld* compiler_host_world_create();
bool entity_register(TowerNode*, size_t, size_t, size_t);
TowerComponent* entity_component_add(TowerNode*, TowerNode*);
}
