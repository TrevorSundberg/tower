#pragma once
#include "tower.hpp"
#include "byte-buffer.hpp"
#include <cstdlib>
#include <iterator>
#include <ostream>
#include <string>
#include <string_view>

// Temporary native views of Tower-owned component storage. These have no
// destructor/ownership of their own; foundation_node_dispose owns cleanup.
struct CoreNodes;
extern "C" bool foundation_nodes_push(CoreNodes*, TowerNode*);
extern "C" bool foundation_nodes_erase(CoreNodes*, size_t, size_t);
extern "C" bool foundation_nodes_prepend(CoreNodes*, TowerNode* const*, size_t);
extern "C" bool foundation_name_append(TowerByteBuffer*, uint8_t);

struct CoreName {
  TowerByteBuffer storage;
  const char* c_str() const { return storage.data ? reinterpret_cast<const char*>(storage.data) : ""; }
  const char* data() const { return c_str(); }
  size_t size() const { return storage.length; }
  bool empty() const { return !storage.length; }
  std::string_view view() const { return {c_str(), size()}; }
  operator std::string() const { return std::string(view()); }
  operator std::string_view() const { return view(); }
  CoreName& operator=(std::string_view text) {
    if (!bytes_assign_text(&storage, reinterpret_cast<const uint8_t*>(text.data()), text.size())) std::abort();
    return *this;
  }
  CoreName& operator=(const CoreName& other) { return *this = other.view(); }
  CoreName& operator+=(char byte) {
    if (!foundation_name_append(&storage, uint8_t(byte))) std::abort();
    return *this;
  }
  friend bool operator==(const CoreName& a, const CoreName& b) { return a.view() == b.view(); }
  friend bool operator==(const CoreName& a, std::string_view b) { return a.view() == b; }
  friend std::string operator+(const char* a, const CoreName& b) { return std::string(a) + std::string(b.view()); }
  friend std::string operator+(std::string a, const CoreName& b) { return a.append(b.view()); }
  friend std::string operator+(const CoreName& a, const char* b) { return std::string(a.view()) + b; }
  friend std::string operator+(const CoreName& a, const std::string& b) { return std::string(a.view()) + b; }
  friend std::ostream& operator<<(std::ostream& out, const CoreName& value) { return out << value.view(); }
};

struct CoreNodes {
  TowerNode** data;
  size_t length, capacity;
  size_t size() const { return length; }
  bool empty() const { return !length; }
  TowerNode*& operator[](size_t i) { return data[i]; }
  TowerNode* const& operator[](size_t i) const { return data[i]; }
  TowerNode*& front() { return data[0]; }
  TowerNode*& back() { return data[length - 1]; }
  TowerNode* const& front() const { return data[0]; }
  TowerNode* const& back() const { return data[length - 1]; }
  TowerNode** begin() { return data; }
  TowerNode** end() { return data ? data + length : data; }
  TowerNode* const* begin() const { return data; }
  TowerNode* const* end() const { return data ? data + length : data; }
  auto rbegin() { return std::make_reverse_iterator(end()); }
  auto rend() { return std::make_reverse_iterator(begin()); }
  auto rbegin() const { return std::make_reverse_iterator(end()); }
  auto rend() const { return std::make_reverse_iterator(begin()); }
  void push_back(TowerNode* node) { if (!foundation_nodes_push(this, node)) std::abort(); }
  void erase(TowerNode** first, TowerNode** last) {
    if (first != last && !foundation_nodes_erase(this, size_t(first - data), size_t(last - first))) std::abort();
  }
  void prepend(TowerNode* const* source, size_t count) {
    if (!foundation_nodes_prepend(this, source, count)) std::abort();
  }
};
