#include "syntax-nodes.hpp"
#include <cassert>

SyntaxNode& syntax_node(TowerNode* node) { auto* value = syntax_get(node); assert(value); return *value; }
SyntaxNode& syntax_attach(TowerNode* node, SyntaxKind kind) { return *syntax_component_attach(node, kind); }
