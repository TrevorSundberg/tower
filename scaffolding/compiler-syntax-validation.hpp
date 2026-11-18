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
extern "C" {
// Initialize error to {} and pending to count writable pointers. A pending slot
// identifies the source term causing that rule to wait for a forward reference.
// Neither source nodes nor the caller's revision are changed. On allocation
// failure error is empty and all pending slots are cleared. Dispose error after
// either result. offset changes only when the diagnostic has a source location.
bool syntax_validate(const SyntaxRuleView*, size_t count, TowerNode* const* tokens,
  size_t token_count, TowerNode* syntax_type, TowerByteBuffer* error,
  size_t* offset, TowerNode** pending);
}
