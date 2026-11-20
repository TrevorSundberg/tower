#pragma once
#include "tower.hpp"
#include "byte-buffer.hpp"

// Borrowed indexes over immutable replacement trees on the shared entities.
// Rule slots are parser production numbers; capture order is the typed-hole ID.
struct SyntaxExpansionCapture { const char* name; size_t uses; bool repeated; };
struct SyntaxExpansionRule {
  TowerNode* tree;
  const char* rule;
  const char* category;
  size_t start, end;
  const SyntaxExpansionCapture* captures;
  size_t count;
};
struct SyntaxExpansionInput {
  const SyntaxExpansionRule* const* rules;
  size_t count;
  TowerNode* match_kind;
};
struct SyntaxExpansionResult {
  TowerNode* root; // one owning reference in/out, including on failure
  size_t replacements, generated_nodes, copied_nodes, error_offset;
  TowerByteBuffer error;
};
extern "C" bool syntax_expand(const SyntaxExpansionInput*, SyntaxExpansionResult*);
extern "C" void syntax_expansion_result_dispose(SyntaxExpansionResult*);

// Tower-owned provenance on the same world entities.
extern "C" const void* syntax_expansion_history(TowerNode*);
extern "C" const void* syntax_expansion_previous(const void*);
extern "C" const void* syntax_expansion_trace(const char*, size_t, size_t, TowerNode*);
extern "C" bool syntax_expansion_origin(const void*, TowerNode*, TowerNode*, bool);
extern "C" bool syntax_expansion_copy_origin(TowerNode*, TowerNode*);
