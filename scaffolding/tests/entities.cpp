#include "../compiler-entities.hpp"
#include "../core.hpp"
#include <cassert>
#include <cstdint>
#include <cstring>
#include <vector>

extern "C" void tower_test_buffer_fail_next();

void entity_store_tests() {
  // The reusable Tower store has no compiler-specific payload or type registry.
  auto* store = entity_store_create();
  auto* type = entity_create(store);
  assert(entity_register(type, 48, 128, 0));
  assert(entity_register(type, 48, 128, 0));
  assert(!entity_register(type, 49, 128, 0));
  assert(!entity_register(type, 48, 3, 0));
  auto* other_store = entity_store_create();
  auto* other = entity_create(other_store);
  assert(!entity_component_add(other, type));
  assert(!entity_attach(other, type, nullptr));
  assert(!entity_store_dispose(store));
  std::vector<TowerNode*> nodes;
  std::vector<void*> addresses;
  for (size_t i = 0; i < 1000; ++i) {
    auto* node = entity_create(store); nodes.push_back(node);
    auto* component = entity_component_add(node, type);
    auto* data = entity_component_data(component); addresses.push_back(data);
    assert(reinterpret_cast<uintptr_t>(data) % 128 == 0);
    assert(entity_component_from_data(data) == component);
    assert(entity_component_add(node, type) == component);
    assert(entity_component_owner(component) == node);
    assert(entity_component_type(component) == type);
    assert(entity_id(node) == i + 1);
    std::memset(data, int(i % 256), 48);
  }
  assert(entity_query_count(type) == 1000);
  // Query indexes grow, while payload addresses and values stay fixed.
  for (size_t i = 0; i < nodes.size(); ++i) {
    auto* component = entity_component_get(nodes[i], type);
    assert(entity_component_data(component) == addresses[i]);
    for (size_t j = 0; j < 48; ++j) assert(static_cast<uint8_t*>(addresses[i])[j] == i % 256);
    assert(entity_component_owner(entity_query_at(type, i)) == nodes[i]);
  }
  for (size_t i = 0; i < nodes.size(); i += 2) {
    assert(entity_component_remove(nodes[i], type));
    assert(!entity_component_remove(nodes[i], type));
  }
  assert(entity_query_count(type) == 500);
  for (size_t i = 0; i < 500; ++i) {
    auto* component = entity_query_at(type, i);
    auto* owner = entity_component_owner(component);
    assert(entity_id(owner) % 2 == 0);
    assert(entity_component_get(owner, type) == component);
  }
  assert(!entity_query_at(type, 500));
  // Layout/ownership failures must leave semantic membership unchanged.
  tower_test_buffer_fail_next();
  assert(!entity_component_add(nodes[0], type));
  assert(entity_component_count(nodes[0]) == 0 && entity_query_count(type) == 500);
  auto* parent = entity_create(store);
  assert(entity_attach(nodes[0], parent, "value"));
  const auto* borrowed_name = entity_child_name(parent, 0);
  // A borrowed name may be reused while reattaching its own child.
  assert(entity_attach(nodes[0], parent, borrowed_name));
  assert(std::strcmp(entity_child_name(parent, 0), "value") == 0);
  tower_test_buffer_fail_next();
  assert(!entity_attach(nodes[1], parent, "value"));
  assert(entity_child_at(parent, 0) == nodes[0] && !entity_parent(nodes[1]));
  assert(entity_attach(nodes[1], parent, "value"));
  assert(!entity_parent(nodes[0]) && entity_child_at(parent, 0) == nodes[1]);
  assert(entity_replace_child(parent, 0, nodes[2]));
  assert(!entity_parent(nodes[1]) && entity_parent(nodes[2]) == parent);
  assert(std::strcmp(entity_child_name(parent, 0), "value") == 0);
  auto* transferred = entity_take_last_child(parent);
  assert(transferred == nodes[2] && !entity_parent(transferred));
  entity_release(transferred);
  entity_release(parent);
  // Type identity remains live until all component users are gone.
  entity_release(type);
  for (auto* node : nodes) entity_release(node);
  assert(entity_store_count(store) == 0 && entity_store_component_count(store) == 0);
  assert(entity_store_dispose(store));
  entity_release(other); assert(entity_store_dispose(other_store));

  const auto baseline_nodes = tower_node_get_allocated_count();
  const auto baseline_components = tower_component_get_allocated_count();
  {
    static int destroyed;
    auto* type_node = tower_node_create();
    auto* node = tower_node_create();
    auto callback = [](TowerComponent* component, void* data) {
      assert(tower_component_from_userdata(data) == component);
      assert(tower_component_get_type(component));
      ++destroyed;
    };
    auto* component = tower_component_create(node, type_node, 16, callback);
    assert(tower_component_type_count(type_node) == 1);
    assert(tower_component_type_at(type_node, 0) == component);
    assert(tower_node_remove_component(node, type_node));
    assert(destroyed == 1 && tower_component_type_count(type_node) == 0);
    tower_component_create(node, type_node, 16, callback);
    tower_node_release_ref(type_node);
    tower_node_release_ref(node); assert(destroyed == 2);
  }
  {
    auto program = core_compile("var answer: i32 = 42; print(answer);");
    assert(program.error.empty());
    bool found = false;
    for (size_t i = 0; i < tower_component_type_count(core_component_type()); ++i) {
      auto* component = tower_component_type_at(core_component_type(), i);
      auto* owner = tower_component_get_owner(component);
      assert(core_get(owner) == tower_component_get_userdata(component));
      if (owner == program.root) found = true;
    }
    assert(found); // Actual parser/Foundation/backend entities inhabit this store.
  }
  assert(tower_node_get_allocated_count() == baseline_nodes);
  assert(tower_component_get_allocated_count() == baseline_components);
}
