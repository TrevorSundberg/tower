#pragma once
#include "tower.hpp"
#include <utility>

// An owning reference to an entity, not a second node representation.
class TowerNodeRef {
  TowerNode* value = nullptr;
public:
  TowerNodeRef() = default;
  explicit TowerNodeRef(TowerNode* node) : value(node) { if (value) tower_node_add_ref(value); }
  static TowerNodeRef adopt(TowerNode* node) { TowerNodeRef ref; ref.value = node; return ref; }
  TowerNodeRef(const TowerNodeRef& other) : TowerNodeRef(other.value) {}
  TowerNodeRef(TowerNodeRef&& other) noexcept : value(std::exchange(other.value, nullptr)) {}
  ~TowerNodeRef() { if (value) tower_node_release_ref(value); }
  TowerNodeRef& operator=(TowerNodeRef other) noexcept { std::swap(value, other.value); return *this; }
  TowerNode* get() const { return value; }
  explicit operator bool() const { return value != nullptr; }
};
