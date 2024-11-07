#pragma once
#include <cstdint>

struct TowerNode;
struct TowerComponent;

const size_t TOWER_INVALID_INDEX = (size_t)-1;

// Run a suite of tests over tower nodes and components
void tower_tests();


// Allocate memory and return a pointer to it, or null if the allocation fails
void* tower_memory_allocate(size_t size);

// Free a pointer to allocated memory
void tower_memory_free(void* memory);

// Get how many tower allocations there have been
size_t tower_memory_get_allocated_count();


// Get how many tower nodes are allocated
size_t tower_node_get_allocated_count();

// Construct a tower node at the specified location in memory
// The reference count will be 1 (reference is returned to caller)
TowerNode* tower_node_create();

// Increment the reference count of a node in tower and returns the new count
size_t tower_node_add_ref(TowerNode* node);

// Decrement the reference count of a node in tower and returns the new count
// When the ref count reaches zero, the node and it's components will be destructed
// Any child nodes that have no references holding them alive (or only weak references) will be destroyed
size_t tower_node_release_ref(TowerNode* node);

// Get the current reference count of a tower node
size_t tower_node_get_ref_count(TowerNode* node);

// Every tower node has a unique id that counts up from the start of the program
// This is useful to uniquely identify a node without pointing at it, or to maintin creation order
size_t tower_node_get_id(TowerNode* node);

// Attach a child tower node to a parent, automatically detaching it from any parent it's attached to
// If parent is null, then this will detach the child from any parent it's currently attached to
// On attach reference count is incremented, on detach it's decremented
void tower_node_attach(TowerNode* child, TowerNode* new_parent);

// Attach a child tower node to a parent, automatically detaching it from any parent it's attached to
// If parent is null, then this will detach the child from any parent it's currently attached to
// If member_name is not null, it overwrites any member of the same name and is copied / stored internally
// On attach reference count is incremented, on detach it's decremented
void tower_node_attach_member(TowerNode* child, TowerNode* new_parent, const char* member_name);

// Detach a child node from a parent (or do nothing if it has no parent)
// If the child was attached, the reference could will be decremented
void tower_node_detach(TowerNode* child);

// Get the parent of a child, or null if it's is the root
// This does NOT increment the reference count of the returned node
TowerNode* tower_node_get_parent(TowerNode* child);

// Return how many children the parent node has
size_t tower_node_get_child_count(TowerNode* parent);

// Get a specfic child node by index, or null if it's out of range
// Children cannot be null by themselves, so null always indicates out of range
// This does NOT increment the reference count of the returned node
TowerNode* tower_node_get_child(TowerNode* parent, size_t index);

// Get a specfic child node by member name, or null if the member is not found
// This does NOT increment the reference count of the returned node
TowerNode* tower_node_get_child_member(TowerNode* parent, const char* member_name);

// Get the index of a specfic child node by member name, or TOWER_INVALID_INDEX if the member is not found
size_t tower_node_get_child_member_index(TowerNode* parent, const char* member_name);

// Get the member name of a specific child from the parent
// The string memory is owned by the parent node, and will be destroyed if the parent
// is destroyed, or if the child is removed as a member
// If the child has no name, or the child has no parent, null will be returned
const char* tower_node_get_parent_member_name(TowerNode* child);

// Get the index of a specfic child node, or TOWER_INVALID_INDEX if the child has no parent
size_t tower_node_get_parent_child_index(TowerNode* child);

// Lookup a component on a tower node by type id, or returns null if it's not found
// This does NOT increment the reference count of the owner or the type
TowerComponent* tower_node_get_component(TowerNode* owner, TowerNode* type);

// Lookup a component on a tower node by type id, or returns null if it's not found
// This then offsets to the reserved userdata section of the component
// This does NOT increment the reference count of the owner or the type
void* tower_node_get_component_userdata(TowerNode* owner, TowerNode* type);

// Return how many components the node has
size_t tower_node_get_component_count(TowerNode* owner);

// Get a specfic component by index, or null if it's out of range
// Components cannot be null by themselves, so null always indicates out of range
// This does NOT increment the reference count of the owner
TowerComponent* tower_node_get_component_by_index(TowerNode* owner, size_t index);


// Virtual destructor for a component
typedef void (*TowerComponentDestructor)(TowerComponent* component, void* userdata);

// Get how many tower components are allocated
size_t tower_component_get_allocated_count();

// Construct a tower component at the specified location in memory
// If a component of the same type exists, it will be returned instead
// The owner owns the memory for the component, any any references held to
// the component must increase the reference count of the owner
// This does NOT change the reference count of the owner,
// but does increase type's ref count by 1
TowerComponent* tower_component_create(
  TowerNode* owner,
  TowerNode* type,
  size_t data_bytes,
  TowerComponentDestructor destructor
);

// Get the owner node that owns the tower component
// This does NOT increment the reference count of the returned node
TowerNode* tower_component_get_owner(TowerComponent* component);

// Retrieve the runtime type of a component
// This does NOT increment the reference count of the returned node
TowerNode* tower_component_get_type(TowerComponent* component);

// Get a pointer to the arbitrary userdata section of the tower component
// The size of the userdata section matches data_bytes passed in tower_component_create
void* tower_component_get_userdata(TowerComponent* component);

// From a pointer to a component's userdata section, get the original TowerComponent
TowerComponent* tower_component_from_userdata(void* userdata);

