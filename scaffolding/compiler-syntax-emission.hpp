#pragma once
#include "compiler-syntax-validation.hpp"

struct SyntaxEmission;
struct SyntaxEmissionLiteral { const char* text; size_t length; uint32_t id; };
// Borrowed revision views. root must be empty; component types must already be
// registered. A non-null category selects replacement-template construction.
// Literal IDs and reserved names then come from the enclosing revision.
struct SyntaxEmissionInput {
  const SyntaxRuleView* rules; size_t count;
  TowerNode* const* tokens; size_t token_count;
  const char* const* reserved; size_t reserved_count;
  const SyntaxEmissionLiteral* literals; size_t literal_count;
  const char* category;
  TowerNode *root, *syntax_kind, *rule_kind, *reference_kind, *string_kind, *range_kind;
};
// Disposable diagnostic/lexer indexes, not another grammar representation.
// Strings are borrowed from the emission result; source pointers from the input.
struct SyntaxEmissionName {
  const char* text; size_t length;
  const char* wrapper;
  uint32_t literal;
  bool used, declaration, start;
};
struct SyntaxEmissionProduction { const char* name; size_t alternative, index; };
struct SyntaxEmissionHelper { const char* name; TowerNode* source; bool capture; };
extern "C" {
// On failure returns null, frees temporary indexes, and leaves only partial
// output children owned by root. Discard that root; input entities are unchanged.
SyntaxEmission* syntax_emit(const SyntaxEmissionInput*);
void syntax_emission_destroy(SyntaxEmission*);
size_t syntax_emission_name_count(const SyntaxEmission*);
void syntax_emission_name(const SyntaxEmission*, size_t, SyntaxEmissionName*);
size_t syntax_emission_production_count(const SyntaxEmission*);
void syntax_emission_production(const SyntaxEmission*, size_t, SyntaxEmissionProduction*);
// Borrowed immutable rows, valid for the emission's lifetime. Lookup does not
// allocate or mutate shared entities; the caller keeps source entities pinned.
const SyntaxEmissionProduction* syntax_emission_productions(const SyntaxEmission*);
const SyntaxEmissionProduction* syntax_emission_find_index(const SyntaxEmission*, size_t);
size_t syntax_emission_find_name(const SyntaxEmission*, const char*, size_t);
size_t syntax_emission_rule_index(const SyntaxEmission*, const char*);
size_t syntax_emission_helper_count(const SyntaxEmission*);
void syntax_emission_helper(const SyntaxEmission*, size_t, SyntaxEmissionHelper*);
}
