#pragma once
#include "tower.hpp"
// Opaque payloads on the SAME entities used by parsing and foundation semantics.
// The algorithms and component layouts are defined in compiler/generics.tower.
struct GenericContext;
extern "C" {
GenericContext* generic_begin(TowerNode* root);
const char* generic_error(GenericContext*);
unsigned generic_register(GenericContext*, TowerNode* definition);
size_t generic_parameter_count(GenericContext*, TowerNode* definition);
bool generic_type_parameter(GenericContext*, TowerNode* definition, size_t index);
TowerNode* generic_instantiate(GenericContext*, TowerNode* definition, TowerNode* use,
  TowerNode** arguments, size_t count);
TowerNode* generic_lookup(GenericContext*, TowerNode* node, TowerNode* name);
TowerNode* generic_type_result(GenericContext*, TowerNode* instance);
TowerNode* generic_origin(GenericContext*, TowerNode* node);
TowerNode* generic_definition(GenericContext*, TowerNode* node);
// Also used by the parser's replacement expander; copies Match/provenance only.
TowerNode* compiler_clone_tree(TowerNode*, size_t limit, size_t* copied);
}
