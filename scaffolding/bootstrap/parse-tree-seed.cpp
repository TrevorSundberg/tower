// Transitional reference for the parser's former C++ forest assembly algorithm.
#include "../compiler-parse-tree.hpp"
#include <vector>
#include <string>
struct ParseChild {
  TowerNode* node = nullptr;
  std::string capture;
  size_t first = TOWER_INVALID_INDEX, next = TOWER_INVALID_INDEX;
};
struct ParseForestStore { std::vector<ParseChild> children; size_t visits = 0; };
extern "C" ParseForestStore* parse_forest_create() { return new ParseForestStore(); }
extern "C" void parse_forest_destroy(ParseForestStore* store) {
  for (auto& child : store->children) if (child.node) tower_node_release_ref(child.node);
  delete store;
}
extern "C" bool parse_forest_leaf(ParseForestStore* store, TowerNode* node, ParseForest* out) {
  out->first = out->last = store->children.size(); store->children.push_back({.node = node}); return true;
}
extern "C" bool parse_forest_join(ParseForestStore* store, ParseForest* out, size_t first, size_t last, const char* capture) {
  if (first == TOWER_INVALID_INDEX) return true;
  if (capture && *capture) {
    auto wrapper = store->children.size(); store->children.push_back({.capture = capture, .first = first});
    first = last = wrapper;
  }
  if (out->first == TOWER_INVALID_INDEX) out->first = first;
  else store->children[out->last].next = first;
  out->last = last; return true;
}
extern "C" bool parse_forest_attach(ParseForestStore* store, TowerNode* parent, size_t first) {
  struct Visit { size_t index; const std::string* capture; };
  std::vector<Visit> pending;
  if (first != TOWER_INVALID_INDEX) pending.push_back({first, nullptr});
  while (!pending.empty()) {
    auto visit = pending.back(); pending.pop_back();
    auto& child = store->children[visit.index]; ++store->visits;
    if (child.next != TOWER_INVALID_INDEX) pending.push_back({child.next, visit.capture});
    const auto* capture = visit.capture ? visit.capture : child.capture.empty() ? nullptr : &child.capture;
    if (child.node) {
      tower_node_attach_member(child.node, parent, capture ? capture->c_str() : nullptr);
      tower_node_release_ref(child.node); child.node = nullptr;
    } else if (child.first != TOWER_INVALID_INDEX) pending.push_back({child.first, capture});
  }
  return true;
}
extern "C" TowerNode* parse_forest_take(ParseForestStore* store, size_t index) {
  auto* node = store->children[index].node; store->children[index].node = nullptr; return node;
}
extern "C" size_t parse_forest_visits(ParseForestStore* store) { return store->visits; }
