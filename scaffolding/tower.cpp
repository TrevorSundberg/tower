#include "compiler-entities.hpp"
#include "compiler-host.hpp"
#include <cassert>
#include <cstddef>
#include <cstdlib>
#include <cstring>
#include <vector>

// These are adapters to the same entities, not native copies of their fields.
namespace {
CompilerWorld* world() {
  static auto* value = compiler_host_world_create();
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
extern "C" void compiler_native_finalize(size_t kind, TowerComponent* component, void* data) {
  auto callback = finalizers().at(kind);
  if (callback) callback(component, data);
}
static CompilerNodeMemoryState node_memory{};
#ifdef NDEBUG
static constexpr bool node_diagnostics = false;
#else
static constexpr bool node_diagnostics = true;
#endif
void* tower_memory_allocate(size_t size) {
  return compiler_node_allocate(&node_memory, size, node_diagnostics);
}
void tower_memory_free(void* memory) {
  compiler_node_free(&node_memory, memory, node_diagnostics);
}
extern "C" CompilerWorld* compiler_host_world() { return world(); }
size_t tower_memory_get_allocated_count() {
  return node_memory.live_allocations;
}
TowerComponent* tower_component_create(TowerNode* owner, TowerNode* type, size_t size, TowerComponentDestructor destructor) {
  require(tower_component_register(type, size, destructor));
  auto* component = entity_component_add(owner, type); require(component); return component;
}
bool tower_component_register(TowerNode* type, size_t size, TowerComponentDestructor destructor) {
  return entity_register(type, size, alignof(std::max_align_t), lifecycle(destructor));
}
