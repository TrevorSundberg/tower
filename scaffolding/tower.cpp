#include "tower.hpp"
#include <cassert>
#include <vector>
#include <string>
#include <atomic>

// The tests come first so that we don't see the definition of any structs
void tower_tests() {
  // TODO(trevor): Make sure adding a component twice by the same interface destroys the previous one (or fails)
  // or make it like "has or add"...
  const uint32_t tower_node_initial_count = tower_node_get_allocated_count();
  const uint32_t tower_component_initial_count = tower_component_get_allocated_count();

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

    assert(tower_node_get_parent(child) == parent);
    assert(tower_node_get_child_count(parent) == 1);
    assert(tower_node_get_child(parent, 0) == child);

    // Release the automatic reference when we create the child
    tower_node_release_ref(child);
    assert(tower_node_get_ref_count(child) == 1);
    assert(tower_node_get_ref_count(parent) == 1);
    assert(tower_node_get_allocated_count() == tower_node_initial_count + 2);

    // Both parent and child are destroyed here
    uint32_t parent_ref_count = tower_node_release_ref(parent);
    assert(parent_ref_count == 0);
  }

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);

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
    uint32_t parent_ref_count = tower_node_release_ref(parent);
    assert(parent_ref_count == 0);
  }

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);

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
    uint32_t parent_ref_count = tower_node_release_ref(parent);
    assert(parent_ref_count == 0);
    uint32_t child_ref_count = tower_node_release_ref(child);
    assert(child_ref_count == 0);
  }

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);

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
    uint32_t parent_ref_count = tower_node_release_ref(parent);
    assert(parent_ref_count == 0);

    // Since we held a reference to child2, it's still alive even though the parent died
    assert(tower_node_get_ref_count(child1) == 1);
    assert(tower_node_get_ref_count(child2) == 1);
    assert(tower_node_get_allocated_count() == tower_node_initial_count + 2);

    assert(tower_node_get_parent(child1) == nullptr);
    assert(tower_node_get_parent(child2) == nullptr);

    // Release the and destroy the children
    uint32_t child1_ref_count = tower_node_release_ref(child1);
    assert(child1_ref_count == 0);
    uint32_t child2_ref_count = tower_node_release_ref(child2);
    assert(child2_ref_count == 0);
  }

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count);

  // Attach component, destroy owner (destroys both)
  {
    TowerNode* owner = tower_node_create();

    TowerNode* type = tower_node_create();
    assert(tower_node_get_ref_count(type) == 1);
    assert(tower_node_get_component_count(owner) == 0);
    assert(tower_node_get_component_by_index(owner, 0) == nullptr);
    assert(tower_component_get_data(nullptr) == nullptr);
    assert(tower_component_get_from_data(nullptr) == nullptr);
    TowerComponent* component = tower_component_create(owner, type, 1, [](TowerComponent* component, uint8_t* data) {
      assert(tower_component_get_data(component) == data);
      assert(*data == 123);
      assert(tower_component_get_owner(component) != nullptr);
      assert(tower_component_get_type(component) != nullptr);
    });
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

    *tower_component_get_data(component) = 123;
    assert(tower_component_get_from_data(tower_component_get_data(component)) == component);

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
}

struct TowerNodeChild {
  std::string member_name;
  TowerNode* /*strong*/ child = nullptr;
};

struct TowerNode {
  static std::atomic<uint32_t> allocated_count;
  uint32_t reference_count = 1;

  TowerNode* /*weak*/ parent = nullptr;

  std::vector<TowerComponent*> components;
  std::vector<TowerNodeChild> children;
};
std::atomic<uint32_t> TowerNode::allocated_count = 0;

struct TowerComponent {
  static std::atomic<uint32_t> allocated_count;
  TowerComponentDestructor destructor = nullptr;
  TowerNode* type = nullptr;
  TowerNode* owner = nullptr;
};
std::atomic<uint32_t> TowerComponent::allocated_count = 0;

void* tower_allocate(uint32_t size) {
  return malloc(size);
}

void tower_free(void* memory) {
  free(memory);
}

uint32_t tower_node_get_allocated_count() {
  return TowerNode::allocated_count;
}

TowerNode* tower_node_create() {
  void* memory = tower_allocate(sizeof(TowerNode));
  ++TowerNode::allocated_count;
  return new (memory) TowerNode();
}

uint32_t tower_node_add_ref(TowerNode* node) {
  assert(node->reference_count >= 1);
  return ++node->reference_count;
}

uint32_t tower_node_release_ref(TowerNode* node) {
  assert(node->reference_count >= 1);
  uint32_t new_count = --node->reference_count;

  // Destruct the node and all it's components, and release references to children
  if (new_count == 0) {
    for (uint32_t i = 0; i < node->children.size(); ++i) {
      auto& child = node->children[i];
      // This logic needs to mimic tower_node_detach
      child.child->parent = nullptr;
      tower_node_release_ref(child.child);
    }

    for (uint32_t i = 0; i < node->components.size(); ++i) {
      TowerComponent* component = node->components[i];
      tower_node_release_ref(component->type);
      if (component->destructor) {
        component->destructor(component, tower_component_get_data(component));
      }

      --TowerComponent::allocated_count;
      component->~TowerComponent();
      tower_free(component);
    }

    --TowerNode::allocated_count;
    node->~TowerNode();
    tower_free(node);
  }

  return new_count;
}

uint32_t tower_node_get_ref_count(TowerNode* node) {
  return node->reference_count;
}

void tower_node_attach(TowerNode* child, TowerNode* new_parent) {
  tower_node_attach_member(child, new_parent, nullptr);
}

// TODO(trevor): BUG, if we change the membrer_name but keep the same parent, it won't change
// actually, another bug, we don't just want to remove a child's name if
// we get another with the same name, it should unlink the child
// ... is that an obvious behavior?
void tower_node_attach_member(TowerNode* child, TowerNode* new_parent, const char* member_name) {
  assert(child != nullptr);
  assert(child != new_parent);

  if (child->parent == nullptr && new_parent == nullptr) {
    return;
  }

  // We know we're changing parents at this point (attaching to a new one or detaching)
  // Check if we need to detach from the current parent
  if (child->parent) {
    for (auto it = child->parent->children.begin(); it != child->parent->children.end(); ++it) {
      if (it->child == child) {
        child->parent->children.erase(it);
        break;
      }
    }
  } else {
    // Since the child has no parent, we know the new parent can't
    // be null so we are transitioning from detached to attached
    tower_node_add_ref(child);
  }

  child->parent = new_parent;

  // Finally, if we have a new parent, add ourselves
  if (new_parent) {
    const char* member = "";
    if (member_name && *member_name != '\0') {
      member = member_name;
      
      // Find a member of the same name and detach it
      // Note: This may destroy the child if this is the last reference to this child
      TowerNode* child_with_same_member_name = tower_node_get_child_member(new_parent, member_name);
      if (child_with_same_member_name) {
        tower_node_detach(child_with_same_member_name);
      }
    }

    new_parent->children.push_back({member, child});
  } else {
    // Since the child had a parent, if the new parent is null
    // we are transitioning from attached to detached
    // This MUST come at the end as this could be the last reference
    // to child and could cause the child pointer to be freed
    tower_node_release_ref(child);
  }
}

void tower_node_detach(TowerNode* child) {
  tower_node_attach_member(child, nullptr, nullptr);
}

TowerNode* tower_node_get_parent(TowerNode* child) {
  return child->parent;
}

uint32_t tower_node_get_child_count(TowerNode* parent) {
  return parent->children.size();
}

TowerNode* tower_node_get_child(TowerNode* parent, uint32_t index) {
  if (index < parent->children.size()) {
    return parent->children[index].child;
  }
  return nullptr;
}

TowerNode* tower_node_get_child_member(TowerNode* parent, const char* member_name) {
  uint32_t index = tower_node_get_child_member_index(parent, member_name);
  return (index == TOWER_INVALID_INDEX) ? nullptr : parent->children[index].child;
}

uint32_t tower_node_get_child_member_index(TowerNode* parent, const char* member_name) {
  assert(member_name && *member_name != '\0');

  for (uint32_t i = 0; i < parent->children.size(); ++i) {
    auto& child = parent->children[i];
    if (child.member_name == member_name) {
      return i;
    }
  }
  return TOWER_INVALID_INDEX;
}

const char* tower_node_get_parent_member_name(TowerNode* child) {
  if (child->parent == nullptr) {
    return nullptr;
  }

  for (uint32_t i = 0; i < child->parent->children.size(); ++i) {
    auto& current_child = child->parent->children[i];
    if (current_child.child == child) {
      if (current_child.member_name.empty()) {
        return nullptr;
      } else {
        return current_child.member_name.c_str();
      }
    }
  }

  // Should not ever get here, the child should be within the parent
  assert(false);
  return nullptr;
}

TowerComponent* tower_node_get_component(TowerNode* owner, TowerNode* type) {
  for (uint32_t i = 0; i < owner->components.size(); ++i) {
    TowerComponent* component = owner->components[i];
    if (component->type == type) {
      return component;
    }
  }
  return nullptr;
}

uint8_t* tower_node_get_component_data(TowerNode* owner, TowerNode* type) {
  return tower_component_get_data(tower_node_get_component(owner, type));
}

uint32_t tower_node_get_component_count(TowerNode* owner) {
  return owner->components.size();
}

TowerComponent* tower_node_get_component_by_index(TowerNode* owner, uint32_t index) {
  if (index < owner->components.size()) {
    return owner->components[index];
  }
  return nullptr;
}

uint32_t tower_component_get_allocated_count() {
  return TowerComponent::allocated_count;
}

TowerComponent* tower_component_create(
  TowerNode* owner,
  TowerNode* type,
  uint32_t data_bytes,
  TowerComponentDestructor destructor
) {
  void* memory = tower_allocate(sizeof(TowerComponent) + data_bytes);
  ++TowerComponent::allocated_count;
  TowerComponent* component = new (memory) TowerComponent();
  component->destructor = destructor;
  tower_node_add_ref(type);
  component->type = type;
  component->owner = owner;
  owner->components.push_back(component);
  return component;
}

TowerNode* tower_component_get_owner(TowerComponent* component) {
  return component->owner;
}

TowerNode* tower_component_get_type(TowerComponent* component) {
  return component->type;
}

uint8_t* tower_component_get_data(TowerComponent* component) {
  if (component == nullptr) {
    return nullptr;
  }
  return ((uint8_t*)component) + sizeof(TowerComponent);
}

TowerComponent* tower_component_get_from_data(uint8_t* data) {
  if (data == nullptr) {
    return nullptr;
  }
  return (TowerComponent*)(data - sizeof(TowerComponent));
}

