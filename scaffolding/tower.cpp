#include "tower.hpp"
#include <cassert>
#include <vector>
#include <string>
#include <atomic>
#include <algorithm>

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

struct TowerNodeChild {
  std::string member_name;
  TowerNode* /*strong*/ child = nullptr;
};

struct TowerNode {
  static std::atomic<size_t> allocated_count;
  static std::atomic<size_t> id_counter;
  size_t id = TOWER_INVALID_INDEX;
  size_t reference_count = 1;

  TowerNode* /*weak*/ parent = nullptr;

  std::vector<TowerComponent*> components;
  std::vector<TowerNodeChild> children;
};
std::atomic<size_t> TowerNode::allocated_count = 0;
std::atomic<size_t> TowerNode::id_counter = 0;

struct TowerComponent {
  static std::atomic<size_t> allocated_count;
  TowerComponentDestructor destructor = nullptr;
  TowerNode* type = nullptr;
  TowerNode* owner = nullptr;
};
std::atomic<size_t> TowerComponent::allocated_count = 0;

std::atomic<size_t> tower_allocated_count = 0;

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

size_t tower_node_get_allocated_count() {
  return TowerNode::allocated_count;
}

TowerNode* tower_node_create() {
  void* memory = tower_memory_allocate(sizeof(TowerNode));
  ++TowerNode::allocated_count;
  size_t id = TowerNode::id_counter++;
  TowerNode* node = new (memory) TowerNode();
  node->id = id;
  return node;
}

size_t tower_node_add_ref(TowerNode* node) {
  assert(node->reference_count >= 1);
  return ++node->reference_count;
}

size_t tower_node_release_ref(TowerNode* node) {
  assert(node->reference_count >= 1);
  size_t new_count = --node->reference_count;

  // Destruct the node and all it's components, and release references to children
  if (new_count == 0) {
    for (size_t i = 0; i < node->children.size(); ++i) {
      auto& child = node->children[i];
      // This logic needs to mimic tower_node_detach
      child.child->parent = nullptr;
      tower_node_release_ref(child.child);
    }

    for (size_t i = 0; i < node->components.size(); ++i) {
      TowerComponent* component = node->components[i];
      tower_node_release_ref(component->type);
      if (component->destructor) {
        component->destructor(component, tower_component_get_userdata(component));
      }

      --TowerComponent::allocated_count;
      component->~TowerComponent();
      tower_memory_free(component);
    }

    --TowerNode::allocated_count;
    node->~TowerNode();
    tower_memory_free(node);
  }

  return new_count;
}

size_t tower_node_get_ref_count(TowerNode* node) {
  return node->reference_count;
}

size_t tower_node_get_id(TowerNode* node) {
  return node->id;
}

void tower_node_attach(TowerNode* child, TowerNode* new_parent) {
  tower_node_attach_member(child, new_parent, nullptr);
}

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

size_t tower_node_get_child_count(TowerNode* parent) {
  return parent->children.size();
}

TowerNode* tower_node_get_child(TowerNode* parent, size_t index) {
  if (index < parent->children.size()) {
    return parent->children[index].child;
  }
  return nullptr;
}

TowerNode* tower_node_get_child_member(TowerNode* parent, const char* member_name) {
  size_t index = tower_node_get_child_member_index(parent, member_name);
  return (index == TOWER_INVALID_INDEX) ? nullptr : parent->children[index].child;
}

size_t tower_node_get_child_member_index(TowerNode* parent, const char* member_name) {
  assert(member_name && *member_name != '\0');

  for (size_t i = 0; i < parent->children.size(); ++i) {
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

  auto& children = child->parent->children;
  for (size_t i = 0; i < children.size(); ++i) {
    auto& current_child = children[i];
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

size_t tower_node_get_parent_child_index(TowerNode* child) {
  if (!child->parent) {
    return TOWER_INVALID_INDEX;
  }

  auto& children = child->parent->children;
  for (size_t i = 0; i < children.size(); ++i) {
    auto& current_child = children[i];
    if (current_child.child == child) {
      return i;
    }
  }

  // Should not ever get here, the child should be within the parent
  assert(false);
  return TOWER_INVALID_INDEX;
}

TowerComponent* tower_node_get_component(TowerNode* owner, TowerNode* type) {
  for (size_t i = 0; i < owner->components.size(); ++i) {
    TowerComponent* component = owner->components[i];
    if (component->type == type) {
      return component;
    }
  }
  return nullptr;
}

void* tower_node_get_component_userdata(TowerNode* owner, TowerNode* type) {
  return tower_component_get_userdata(tower_node_get_component(owner, type));
}

size_t tower_node_get_component_count(TowerNode* owner) {
  return owner->components.size();
}

TowerComponent* tower_node_get_component_by_index(TowerNode* owner, size_t index) {
  if (index < owner->components.size()) {
    return owner->components[index];
  }
  return nullptr;
}

size_t tower_component_get_allocated_count() {
  return TowerComponent::allocated_count;
}

TowerComponent* tower_component_create(
  TowerNode* owner,
  TowerNode* type,
  size_t data_bytes,
  TowerComponentDestructor destructor
) {
  // Never add the same component twice
  TowerComponent* found_component = tower_node_get_component(owner, type);
  if (found_component) {
    assert(found_component->destructor == destructor);
    return found_component;
  }

  void* memory = tower_memory_allocate(sizeof(TowerComponent) + data_bytes);
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

void* tower_component_get_userdata(TowerComponent* component) {
  if (component == nullptr) {
    return nullptr;
  }
  return ((uint8_t*)component) + sizeof(TowerComponent);
}

TowerComponent* tower_component_from_userdata(void* userdata) {
  if (userdata == nullptr) {
    return nullptr;
  }
  return (TowerComponent*)((uint8_t*)userdata - sizeof(TowerComponent));
}

