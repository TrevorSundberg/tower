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
  void* host; // transitional provenance storage, never expansion decisions
};
struct SyntaxExpansionResult {
  TowerNode* root; // one owning reference in/out, including on failure
  size_t replacements, generated_nodes, copied_nodes, error_offset;
  TowerByteBuffer error;
};
extern "C" bool syntax_expand(const SyntaxExpansionInput*, SyntaxExpansionResult*);
extern "C" void syntax_expansion_result_dispose(SyntaxExpansionResult*);

// Leaf storage callbacks while the public provenance facade is still native.
extern "C" const void* syntax_expansion_history(TowerNode*);
extern "C" const void* syntax_expansion_previous(const void*);
extern "C" size_t syntax_expansion_trace(void*, const SyntaxExpansionRule*, TowerNode*);
extern "C" bool syntax_expansion_origin(void*, size_t, TowerNode*, TowerNode*, bool);
extern "C" bool syntax_expansion_copy_origin(TowerNode*, TowerNode*);
