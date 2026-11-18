// Transitional C++ node store, used only to bootstrap/reference the Tower store.
#include "../tower.hpp"
#include <cassert>
#include <vector>
#include <string>
#include <atomic>
#include <algorithm>
#include <cstdlib>
#include <cstring>

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

void tower_node_replace_child(TowerNode* parent, size_t index, TowerNode* replacement) {
  assert(index < parent->children.size() && replacement && !replacement->parent && replacement != parent);
  auto*& slot = parent->children[index].child;
  auto* previous = slot;
  tower_node_add_ref(replacement);
  replacement->parent = parent;
  slot = replacement;
  previous->parent = nullptr;
  tower_node_release_ref(previous);
}

TowerNode* tower_node_take_last_child(TowerNode* parent) {
  if (parent->children.empty()) return nullptr;
  auto* result = parent->children.back().child;
  parent->children.pop_back();
  result->parent = nullptr;
  return result;
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

const char* tower_node_get_child_member_name(TowerNode* parent, size_t index) {
  if (index >= parent->children.size() || parent->children[index].member_name.empty()) return nullptr;
  return parent->children[index].member_name.c_str();
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
