#include "../compiler-generics.hpp"
#include "../parser.hpp"
#include <cstring>
#include <vector>
// The transitional seed only compiles the nongeneric Tower specializer.
// It deliberately has no second specialization implementation.
struct GenericContext { const char* error = nullptr; };
GenericContext* generic_begin(TowerNode*) { static GenericContext context; context.error = nullptr; return &context; }
const char* generic_error(GenericContext* c) { return c->error; }
unsigned generic_register(GenericContext* c, TowerNode* n) {
  auto visit = [&](auto&& self, TowerNode* at) -> bool {
    auto* m = static_cast<Match*>(tower_node_get_component_userdata(at, parser_match_get_type()));
    if (m && !std::strcmp(parser_match_get_label(m), "CoreType")) {
      auto* name = tower_node_get_child_member(at, "name");
      auto* leaf = name ? tower_node_get_child(name, 0) : nullptr;
      auto* text = leaf ? static_cast<Match*>(tower_node_get_component_userdata(leaf, parser_match_get_type())) : nullptr;
      if (text && !std::strcmp(parser_match_get_label(text), "type")) return true;
    }
    for (size_t i = 0; i < tower_node_get_child_count(at); ++i) if (self(self, tower_node_get_child(at, i))) return true;
    return false;
  };
  if (visit(visit, n)) c->error = "This bootstrap seed cannot specialize templates; use the full Tower compiler";
  return 0;
}
size_t generic_parameter_count(GenericContext*, TowerNode*) { return 0; }
bool generic_type_parameter(GenericContext*, TowerNode*, size_t) { return false; }
TowerNode* generic_instantiate(GenericContext*, TowerNode*, TowerNode*, TowerNode**, size_t) { return nullptr; }
TowerNode* generic_lookup(GenericContext*, TowerNode*, TowerNode*) { return nullptr; }
TowerNode* generic_type_result(GenericContext*, TowerNode*) { return nullptr; }
TowerNode* generic_origin(GenericContext*, TowerNode*) { return nullptr; }
TowerNode* generic_definition(GenericContext*, TowerNode* n) { return n; }

extern "C" void compiler_node_copy_metadata(TowerNode*, TowerNode*);
TowerNode* compiler_clone_tree(TowerNode* source, size_t limit, size_t* copied) {
  *copied = 0; if (!limit) return nullptr;
  auto* root = tower_node_create(); compiler_node_copy_metadata(source, root); ++*copied;
  struct Pair { TowerNode* from; TowerNode* to; size_t depth; };
  std::vector<Pair> pending{{source, root, 0}};
  while (!pending.empty()) {
    auto [from, to, depth] = pending.back(); pending.pop_back();
    for (size_t i = 0; i < tower_node_get_child_count(from); ++i) {
      if (*copied == limit) { tower_node_release_ref(root); return nullptr; }
      auto* child = tower_node_get_child(from, i); auto* copy = tower_node_create();
      compiler_node_copy_metadata(child, copy); ++*copied;
      tower_node_attach_member(copy, to, tower_node_get_child_member_name(from, i));
      tower_node_release_ref(copy); pending.push_back({child, copy, depth + 1});
    }
  }
  return root;
}
