#pragma once
#include "compiler-syntax-validation.hpp"
#include "byte-buffer.hpp"

struct SyntaxEmission;
struct SyntaxExpansionInput;
struct FrontendRevision;
struct SyntaxReplacementOwner;
struct SyntaxReplacementCapture { CoreName name; TowerNode* source; size_t uses; };
struct SyntaxReplacement {
  CoreName rule, category;
  size_t start, end, error_offset;
  TowerNode* tree;
  struct { SyntaxReplacementCapture* data; size_t length, capacity; } captures;
};
extern "C" {
SyntaxReplacementOwner* syntax_replacement_owner_create(void*, SyntaxEmission*, TowerNode*, TowerNode*);
void syntax_replacement_owner_destroy(SyntaxReplacementOwner*);
SyntaxReplacement* syntax_replacement_candidate(SyntaxReplacementOwner*, const char*);
void* syntax_replacement_host(SyntaxReplacementOwner*);
TowerNode* syntax_replacement_sequence(SyntaxReplacementOwner*);
void syntax_replacement_tree(SyntaxReplacementOwner*, TowerNode*);
void syntax_replacement_error(SyntaxReplacementOwner*, const char*);
bool syntax_replacement_freeze(SyntaxReplacementOwner*);
const SyntaxExpansionInput* syntax_replacement_input(const SyntaxReplacementOwner*);
size_t syntax_replacement_count(const SyntaxReplacementOwner*);
const SyntaxReplacement* syntax_replacement_inspect(const SyntaxReplacementOwner*, const FrontendRevision*, TowerNode*);
}

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

// Tower owns candidates, selected templates, capture leases and frozen indexes.
// Only the temporary grammar/table attempt still calls the native orchestrator.
extern "C" void syntax_replacement_begin(void*, const char*, TowerNode*, size_t, size_t);
extern "C" void syntax_replacement_capture(void*, const char*, TowerNode*);
extern "C" unsigned syntax_replacement_attempt(void*, const char*);
extern "C" const char* syntax_replacement_diagnostic(void*);
extern "C" size_t syntax_replacement_offset(void*);
extern "C" void syntax_replacement_select(void*);
extern "C" void syntax_replacement_commit(void*, size_t);
