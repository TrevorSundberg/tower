#include "compiler-entities.hpp"
#include <atomic>
#include <cassert>
#include <cstddef>
#include <cstdlib>
#include <cstring>
#include <vector>

// These are adapters to the same entities, not native copies of their fields.
namespace {
EntityStore* store() {
  static auto* value = entity_store_create();
  if (!value) std::abort();
  return value;
}
void require(bool ok) { if (!ok) std::abort(); }
std::vector<TowerComponentDestructor>& finalizers() {
  // Like the seed type entities, this bridge has process lifetime. Static
  // grammar caches may release components after ordinary C++ statics destruct.
  static auto* values = new std::vector<TowerComponentDestructor>{nullptr};
  return *values;
}
size_t lifecycle(TowerComponentDestructor callback) {
  auto& values = finalizers();
  for (size_t i = 0; i < values.size(); ++i) if (values[i] == callback) return i;
  values.push_back(callback); return values.size() - 1;
}
}
extern "C" void tower_entity_finalize(size_t kind, TowerComponent* component, void* data) {
  auto callback = finalizers().at(kind);
  if (callback) callback(component, data);
}
static std::atomic<size_t> tower_allocated_count = 0;
// This will truncate to 4 bytes on 32 bit systems
const size_t TOWER_MEMORY_GUARD = (size_t)0xDEADBEEFDEADBEEF;

void* tower_memory_allocate(size_t size) {
  ++tower_allocated_count;
#ifdef NDEBUG
  return malloc(size);
#else
  // Round up to make sure the size is aligned
  if (size % sizeof(size_t) != 0) {
    size += sizeof(size_t) - (size % sizeof(size_t));
  }

  // One for a guard at the beginning, one for the size, and one for the guard at the end
  size_t* mem = (size_t*)malloc(size + sizeof(size_t) * 3);
  size_t end_guard_index = (size / sizeof(size_t)) + 2;
  mem[0] = size;
  mem[1] = TOWER_MEMORY_GUARD;
  mem[end_guard_index] = TOWER_MEMORY_GUARD;

  // Clear the memory to a pattern that simulates uninitialized memory
  void* result = &mem[2];
  memset(result, 0xDB, size);
  return result;
#endif
}

void tower_memory_free(void* memory) {
  // If the allocation count was already 0, it will wrap around
  auto new_count = --tower_allocated_count;
  assert(new_count != (size_t)-1);

#ifdef NDEBUG
  free(memory);
#else
  // Back up to the start of the allocation
  size_t* mem = ((size_t*)memory) - 2;

  // Validate the first guard before checking size in case size has been corrupted
  assert(mem[1] == TOWER_MEMORY_GUARD);

  size_t size = mem[0];
  size_t end_guard_index = (size / sizeof(size_t)) + 2;
  assert(mem[end_guard_index] == TOWER_MEMORY_GUARD);

  // Clear the guards and all memory so that we can possibly detect double free
  memset(mem, 0xFE, size + sizeof(size_t) * 3);
  free(mem);
#endif
}

size_t tower_memory_get_allocated_count() {
  return tower_allocated_count;
}


size_t tower_node_get_allocated_count() { return entity_store_count(store()); }
size_t tower_component_get_allocated_count() { return entity_store_component_count(store()); }
TowerNode* tower_node_create() { auto* node = entity_create(store()); require(node); return node; }
size_t tower_node_add_ref(TowerNode* node) { return entity_retain(node); }
size_t tower_node_release_ref(TowerNode* node) { return entity_release(node); }
size_t tower_node_get_ref_count(TowerNode* node) { return entity_references(node); }
size_t tower_node_get_id(TowerNode* node) { return entity_id(node); }
void tower_node_attach(TowerNode* child, TowerNode* parent) { require(entity_attach(child, parent, nullptr)); }
void tower_node_attach_member(TowerNode* child, TowerNode* parent, const char* name) { require(entity_attach(child, parent, name)); }
void tower_node_detach(TowerNode* child) { require(entity_attach(child, nullptr, nullptr)); }
TowerNode* tower_node_get_parent(TowerNode* child) { return entity_parent(child); }
size_t tower_node_get_child_count(TowerNode* parent) { return entity_child_count(parent); }
TowerNode* tower_node_get_child(TowerNode* parent, size_t index) { return entity_child_at(parent, index); }
void tower_node_replace_child(TowerNode* parent, size_t index, TowerNode* node) { require(entity_replace_child(parent, index, node)); }
TowerNode* tower_node_take_last_child(TowerNode* parent) { return entity_take_last_child(parent); }
size_t tower_node_get_child_member_index(TowerNode* parent, const char* name) { assert(name && *name); return entity_member_index(parent, name); }
TowerNode* tower_node_get_child_member(TowerNode* parent, const char* name) { return entity_child_at(parent, tower_node_get_child_member_index(parent, name)); }
const char* tower_node_get_parent_member_name(TowerNode* child) {
  auto* parent = entity_parent(child);
  return parent ? entity_child_name(parent, entity_child_index(parent, child)) : nullptr;
}
const char* tower_node_get_child_member_name(TowerNode* parent, size_t index) { return entity_child_name(parent, index); }
size_t tower_node_get_parent_child_index(TowerNode* child) {
  auto* parent = entity_parent(child); return parent ? entity_child_index(parent, child) : TOWER_INVALID_INDEX;
}
TowerComponent* tower_node_get_component(TowerNode* owner, TowerNode* type) { return entity_component_get(owner, type); }
void* tower_node_get_component_userdata(TowerNode* owner, TowerNode* type) { return entity_component_data(entity_component_get(owner, type)); }
size_t tower_node_get_component_count(TowerNode* owner) { return entity_component_count(owner); }
TowerComponent* tower_node_get_component_by_index(TowerNode* owner, size_t index) { return entity_component_at(owner, index); }
TowerComponent* tower_component_create(TowerNode* owner, TowerNode* type, size_t size, TowerComponentDestructor destructor) {
  require(tower_component_register(type, size, destructor));
  auto* component = entity_component_add(owner, type); require(component); return component;
}
bool tower_component_register(TowerNode* type, size_t size, TowerComponentDestructor destructor) {
  return entity_register(type, size, alignof(std::max_align_t), lifecycle(destructor));
}
TowerNode* tower_component_get_owner(TowerComponent* component) { return entity_component_owner(component); }
TowerNode* tower_component_get_type(TowerComponent* component) { return entity_component_type(component); }
void* tower_component_get_userdata(TowerComponent* component) { return entity_component_data(component); }
TowerComponent* tower_component_from_userdata(void* data) { return entity_component_from_data(data); }
size_t tower_component_type_count(TowerNode* type) { return entity_query_count(type); }
TowerComponent* tower_component_type_at(TowerNode* type, size_t index) { return entity_query_at(type, index); }
bool tower_node_remove_component(TowerNode* owner, TowerNode* type) { return entity_component_remove(owner, type); }
