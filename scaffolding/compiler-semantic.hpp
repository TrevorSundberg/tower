#pragma once
#include "core.hpp"
// Borrowed native ABI view. Tower owns the algorithms and temporary indexes;
// every result refers to the original Foundation components on shared entities.
struct SemanticProgram {
  unsigned pointer_bytes;
  TowerNode* root;
  CoreNodes functions, types;
  TowerByteBuffer error;
  size_t error_offset;
};
extern "C" {
CoreNode* sem_get(TowerNode*);
CoreNode* sem_attach(TowerNode*, unsigned);
// Explicit component identity; allocation failure returns null without attaching.
CoreNode* semantic_component_get(TowerNode*, TowerNode* type);
CoreNode* semantic_component_attach(TowerNode*, TowerNode* type, unsigned kind);
void semantic_initialize(SemanticProgram*, TowerNode*, unsigned);
void semantic_compile(SemanticProgram*, TowerNode** roots, size_t* bases, size_t count, const char* source);
void semantic_program_dispose(SemanticProgram*);
bool semantic_type_equal(const CoreType*, const CoreType*);
bool semantic_aggregate(const CoreType*);
bool semantic_integer(const CoreType*);
bool semantic_signed(const CoreType*);
size_t semantic_size(const CoreType*);
size_t semantic_alignment(const CoreType*);
unsigned semantic_width(const CoreType*);
uint64_t semantic_mask(const CoreType*);
void semantic_format_type(const CoreType*, TowerByteBuffer*);
void semantic_format_number(uint64_t, const CoreType*, TowerByteBuffer*);
const char* semantic_scalar_name(unsigned);
const char* semantic_operator(unsigned);
const char* semantic_builtin_name(unsigned);
size_t semantic_builtin_arity(unsigned);
unsigned semantic_builtin_kind(const char*);
unsigned semantic_builtin_at(size_t);
}
