#pragma once
#include "syntax-nodes.hpp"
// Read fresh declaration parse entities. The caller retains the tree/source and
// commits the grammar only on success. Failed partial components belong to the
// input tree and are reclaimed with it. Initialize error to {}; dispose it after
// either result. An empty error on failure means allocation of the message failed.
extern "C" {
bool syntax_read_rule(TowerNode*, const SyntaxSource*, TowerNode* match_type, TowerNode* syntax_type, TowerByteBuffer* error);
bool syntax_read_token(TowerNode*, const SyntaxSource*, TowerNode* match_type, TowerNode* syntax_type, bool skipped, TowerByteBuffer* error);
bool syntax_identifier_decode(const char*, size_t, TowerByteBuffer* result);
size_t syntax_identifier_decode_in_place(char*, size_t);
uint32_t syntax_literal_check(const char*, size_t);
}
