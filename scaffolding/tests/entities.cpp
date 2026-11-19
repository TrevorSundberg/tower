#include "../compiler-entities.hpp"
#include "../core.hpp"
#include <cassert>
#include <cstdint>
#include <cstring>
#include <vector>

extern "C" void shared_entity_tests();

void entity_store_tests() {
  shared_entity_tests();

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
