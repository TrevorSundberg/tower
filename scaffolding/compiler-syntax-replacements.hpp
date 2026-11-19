#pragma once
#include "compiler-syntax-validation.hpp"
#include "byte-buffer.hpp"

struct SyntaxReplacementPlan {
  const SyntaxRuleView* rules;
  size_t count;
  TowerNode* kind;
  void* host;
  TowerByteBuffer error;
  size_t offset;
};
extern "C" bool syntax_replacements_prepare(SyntaxReplacementPlan*);
extern "C" void syntax_replacements_dispose(SyntaxReplacementPlan*);

// Temporary grammar/table and revision-storage facade; all destination policy
// and diagnostic construction are Tower code. Input names/entities are borrowed.
extern "C" void syntax_replacement_begin(void*, const char*, TowerNode*, size_t, size_t);
extern "C" void syntax_replacement_capture(void*, const char*, TowerNode*);
extern "C" unsigned syntax_replacement_attempt(void*, const char*);
extern "C" const char* syntax_replacement_diagnostic(void*);
extern "C" size_t syntax_replacement_offset(void*);
extern "C" void syntax_replacement_select(void*);
extern "C" void syntax_replacement_commit(void*, size_t);
