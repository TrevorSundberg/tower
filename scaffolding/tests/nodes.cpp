#include "../tower.hpp"
#include <cassert>
#include <vector>
#include <string>
#include <atomic>
#include <algorithm>
#include <cstdlib>
#include <cstring>

// The tests come first so that we don't see the definition of any structs
void tower_tests() {
  const size_t tower_node_initial_count = tower_node_get_allocated_count();
  const size_t tower_component_initial_count = tower_component_get_allocated_count();
  const size_t tower_memory_initial_count = tower_memory_get_allocated_count();

  // Attach child and release parent (destroys both)
  {
    TowerNode* parent = tower_node_create();
    assert(tower_node_get_allocated_count() == tower_node_initial_count + 1);
    assert(parent != nullptr);
    assert(tower_node_get_parent(parent) == nullptr);
    assert(tower_node_get_ref_count(parent) == 1);
    assert(tower_node_get_child_count(parent) == 0);
    assert(tower_node_get_component_count(parent) == 0);

    TowerNode* child = tower_node_create();
    assert(tower_node_get_allocated_count() == tower_node_initial_count + 2);
    tower_node_attach(child, parent);
    assert(tower_node_get_ref_count(parent) == 1);
    assert(tower_node_get_ref_count(child) == 2);
    assert(tower_node_get_id(child) > tower_node_get_id(parent));

    assert(tower_node_get_parent(child) == parent);
    assert(tower_node_get_child_count(parent) == 1);
    assert(tower_node_get_child(parent, 0) == child);
    assert(tower_node_get_parent_child_index(child) == 0);

    // Release the automatic reference when we create the child
    tower_node_release_ref(child);
    assert(tower_node_get_ref_count(child) == 1);
    assert(tower_node_get_ref_count(parent) == 1);
    assert(tower_node_get_allocated_count() == tower_node_initial_count + 2);

    // Both parent and child are destroyed here
    size_t parent_ref_count = tower_node_release_ref(parent);
    assert(parent_ref_count == 0);
  }

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);
  assert(tower_memory_get_allocated_count() == tower_memory_initial_count);

  // Attach child, release child ref, detach child (destroys it), release parent (destroys it)
  {
    TowerNode* parent = tower_node_create();
    TowerNode* child = tower_node_create();
    tower_node_attach(child, parent);
    assert(tower_node_get_ref_count(parent) == 1);
    assert(tower_node_get_ref_count(child) == 2);

    // Release the automatic reference when we create the child
    tower_node_release_ref(child);
    assert(tower_node_get_ref_count(parent) == 1);
    assert(tower_node_get_ref_count(child) == 1);
    assert(tower_node_get_allocated_count() == tower_node_initial_count + 2);

    // Detach the child which should destroy it
    tower_node_detach(child);
    assert(tower_node_get_ref_count(parent) == 1);
    assert(tower_node_get_allocated_count() == tower_node_initial_count + 1);

    // Release the last reference to the parent and destroy it
    size_t parent_ref_count = tower_node_release_ref(parent);
    assert(parent_ref_count == 0);
  }

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);
  assert(tower_memory_get_allocated_count() == tower_memory_initial_count);

  // Attach child, detach child, release parent (destroys it), release child (destroys it)
  {
    TowerNode* parent = tower_node_create();
    TowerNode* child = tower_node_create();
    assert(tower_node_get_ref_count(parent) == 1);
    assert(tower_node_get_ref_count(child) == 1);
    tower_node_attach(child, parent);
    assert(tower_node_get_ref_count(parent) == 1);
    assert(tower_node_get_ref_count(child) == 2);

    // Detach the child, but it should stay alive
    tower_node_detach(child);
    assert(tower_node_get_ref_count(child) == 1);
    assert(tower_node_get_allocated_count() == tower_node_initial_count + 2);

    // Release the last references to the parent and child and destroy both
    size_t parent_ref_count = tower_node_release_ref(parent);
    assert(parent_ref_count == 0);
    size_t child_ref_count = tower_node_release_ref(child);
    assert(child_ref_count == 0);
  }

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);
  assert(tower_memory_get_allocated_count() == tower_memory_initial_count);

  // Attach named member, attach another of the same name
  {
    const char* member1 = "member1";
    const char* member2 = "member2";

    TowerNode* parent = tower_node_create();
    assert(tower_node_get_parent_member_name(parent) == nullptr);

    assert(tower_node_get_child_member_index(parent, member1) == TOWER_INVALID_INDEX);
    assert(tower_node_get_child_member_index(parent, member2) == TOWER_INVALID_INDEX);

    TowerNode* child1 = tower_node_create();
    tower_node_attach_member(child1, parent, member1);
    assert(tower_node_get_ref_count(parent) == 1);
    assert(tower_node_get_ref_count(child1) == 2);

    assert(tower_node_get_parent(child1) == parent);
    assert(strcmp(tower_node_get_parent_member_name(child1), member1) == 0);
    assert(tower_node_get_child_member_index(parent, member1) == 0);
    assert(tower_node_get_child_member(parent, member1) == child1);
    assert(tower_node_get_parent_child_index(child1) == 0);

    // Attach the second child by the same name
    TowerNode* child2 = tower_node_create();
    tower_node_attach_member(child2, parent, member2);
    assert(tower_node_get_ref_count(parent) == 1);
    assert(tower_node_get_ref_count(child1) == 2);
    assert(tower_node_get_ref_count(child2) == 2);
    assert(tower_node_get_allocated_count() == tower_node_initial_count + 3);

    assert(tower_node_get_parent(child2) == parent);
    assert(strcmp(tower_node_get_parent_member_name(child2), member2) == 0);
    assert(tower_node_get_child_member_index(parent, member2) == 1);
    assert(tower_node_get_child_member(parent, member2) == child2);
    assert(tower_node_get_parent_child_index(child2) == 1);

    // Re-attach child2 as the same member name as child1, which detaches child1
    tower_node_attach_member(child2, parent, member1);
    assert(tower_node_get_ref_count(parent) == 1);
    assert(tower_node_get_ref_count(child1) == 1);
    assert(tower_node_get_ref_count(child2) == 2);
    assert(tower_node_get_allocated_count() == tower_node_initial_count + 3);

    assert(tower_node_get_parent(child1) == nullptr);
    assert(tower_node_get_parent_member_name(child1) == nullptr);
    assert(tower_node_get_parent(child2) == parent);
    assert(strcmp(tower_node_get_parent_member_name(child2), member1) == 0);
    assert(tower_node_get_child_member_index(parent, member1) == 0);
    assert(tower_node_get_child_member_index(parent, member2) == TOWER_INVALID_INDEX);
    assert(tower_node_get_child_member(parent, member1) == child2);
    assert(tower_node_get_child_member(parent, member2) == nullptr);;

    // Release the last reference to the parent and destroy the parent, as well as release child2
    size_t parent_ref_count = tower_node_release_ref(parent);
    assert(parent_ref_count == 0);

    // Since we held a reference to child2, it's still alive even though the parent died
    assert(tower_node_get_ref_count(child1) == 1);
    assert(tower_node_get_ref_count(child2) == 1);
    assert(tower_node_get_allocated_count() == tower_node_initial_count + 2);

    assert(tower_node_get_parent(child1) == nullptr);
    assert(tower_node_get_parent(child2) == nullptr);

    // Release the and destroy the children
    size_t child1_ref_count = tower_node_release_ref(child1);
    assert(child1_ref_count == 0);
    size_t child2_ref_count = tower_node_release_ref(child2);
    assert(child2_ref_count == 0);
  }

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);
  assert(tower_memory_get_allocated_count() == tower_memory_initial_count);

  // Attach component, destroy owner (destroys both)
  {
    TowerNode* owner = tower_node_create();

    TowerNode* type = tower_node_create();
    assert(tower_node_get_ref_count(type) == 1);
    assert(tower_node_get_component_count(owner) == 0);
    assert(tower_node_get_component_by_index(owner, 0) == nullptr);
    assert(tower_component_get_userdata(nullptr) == nullptr);
    assert(tower_component_from_userdata(nullptr) == nullptr);
    TowerComponentDestructor destructor = [](TowerComponent* component, void* userdata) {
      assert(tower_component_get_userdata(component) == userdata);
      assert(*static_cast<uint8_t*>(userdata) == 123);
      assert(tower_component_get_owner(component) != nullptr);
      assert(tower_component_get_type(component) != nullptr);
    };
    TowerComponent* component = tower_component_create(owner, type, 1, destructor);
    assert(tower_node_get_allocated_count() == tower_node_initial_count + 2);
    assert(tower_component_get_allocated_count() == tower_component_initial_count + 1);

    assert(tower_node_get_ref_count(type) == 2);
    assert(tower_node_get_ref_count(owner) == 1);

    assert(tower_node_get_component_count(owner) == 1);
    assert(tower_node_get_component_by_index(owner, 0) == component);
    assert(tower_node_get_component_by_index(owner, 1) == nullptr);
    assert(tower_node_get_component(owner, type) == component);
    assert(tower_component_get_type(component) == type);
    assert(tower_component_get_owner(component) == owner);

    *static_cast<uint8_t*>(tower_component_get_userdata(component)) = 123;
    assert(tower_component_from_userdata(tower_component_get_userdata(component)) == component);

    // Create another of the same type, which will return the original instead
    TowerComponent* new_component = tower_component_create(owner, type, 1, destructor);
    assert(new_component == component);

    // Release the node, which should destruct it's component first, and then itself
    tower_node_release_ref(owner);

    // One left just for the runtime type
    assert(tower_node_get_allocated_count() == tower_node_initial_count + 1);
    assert(tower_component_get_allocated_count() == tower_component_initial_count);

    // The component is no longer referencing the type, now release it
    assert(tower_node_get_ref_count(type) == 1);
    tower_node_release_ref(type);
  }

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);
  assert(tower_memory_get_allocated_count() == tower_memory_initial_count);
}
