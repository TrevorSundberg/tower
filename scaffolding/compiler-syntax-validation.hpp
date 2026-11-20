#pragma once
#include "syntax-nodes.hpp"

// Borrowed, name-sorted revision index over shared alternative/term entities.
// No ownership or grammar meaning is transferred to this disposable view.
struct SyntaxRuleView {
  const char* name;
  size_t name_length;
  TowerNode* const* alternatives;
  size_t count;
};
struct SyntaxPendingRevision;
extern "C" {
// Initialize error to {} and pending to count writable pointers. A pending slot
// identifies the source term causing that rule to wait for a forward reference.
// Neither source nodes nor the caller's revision are changed. On allocation
// failure error is empty and all pending slots are cleared. Dispose error after
// either result. offset changes only when the diagnostic has a source location.
bool syntax_validate(const SyntaxRuleView*, size_t count, TowerNode* const* tokens,
  size_t token_count, TowerNode* syntax_type, TowerByteBuffer* error,
  size_t* offset, TowerNode** pending);
// Frozen Tower-owned pending views retain their shared source alternatives.
// Returned names/messages are borrowed until destruction; queries do not mutate.
// Success with no pending rules sets out to null without allocating.
bool syntax_pending_create(const SyntaxRuleView*, size_t,
  TowerNode* const* waiting, TowerNode* syntax_type, SyntaxPendingRevision** out);
void syntax_pending_destroy(SyntaxPendingRevision*);
size_t syntax_pending_count(const SyntaxPendingRevision*);
const char* syntax_pending_name(const SyntaxPendingRevision*, size_t);
bool syntax_pending_contains(const SyntaxPendingRevision*, const char*);
const char* syntax_pending_message(const SyntaxPendingRevision*, size_t* offset);
}
