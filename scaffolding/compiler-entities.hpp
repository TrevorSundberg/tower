#pragma once
#include "tower.hpp"
// Opaque C ABI to the actual Tower entities. No second native node layout.
struct EntityStore;
struct CompilerWorld;
extern "C" {
CompilerWorld* compiler_world_create();
EntityStore* entity_store_create();
bool entity_store_dispose(EntityStore*);
size_t entity_store_count(EntityStore*);
size_t entity_store_component_count(EntityStore*);
TowerNode* entity_create(EntityStore*);
size_t entity_retain(TowerNode*);
size_t entity_release(TowerNode*);
size_t entity_id(TowerNode*);
size_t entity_references(TowerNode*);
TowerNode* entity_parent(TowerNode*);
bool entity_attach(TowerNode*, TowerNode*, const char*);
bool entity_replace_child(TowerNode*, size_t, TowerNode*);
TowerNode* entity_take_last_child(TowerNode*);
size_t entity_child_count(TowerNode*);
TowerNode* entity_child_at(TowerNode*, size_t);
const char* entity_child_name(TowerNode*, size_t);
size_t entity_child_index(TowerNode*, TowerNode*);
size_t entity_member_index(TowerNode*, const char*);
bool entity_register(TowerNode*, size_t, size_t, size_t);
TowerComponent* entity_component_add(TowerNode*, TowerNode*);
TowerComponent* entity_component_get(TowerNode*, TowerNode*);
bool entity_component_remove(TowerNode*, TowerNode*);
size_t entity_component_count(TowerNode*);
TowerComponent* entity_component_at(TowerNode*, size_t);
void* entity_component_data(TowerComponent*);
TowerComponent* entity_component_from_data(void*);
TowerNode* entity_component_owner(TowerComponent*);
TowerNode* entity_component_type(TowerComponent*);
size_t entity_query_count(TowerNode*);
TowerComponent* entity_query_at(TowerNode*, size_t);
}
