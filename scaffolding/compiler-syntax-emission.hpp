#pragma once
#include "compiler-syntax-validation.hpp"

struct SyntaxEmission;
struct SyntaxLexicon;
struct LRCompletion;
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
SyntaxEmission* syntax_emit_inherit(const SyntaxEmissionInput*, const SyntaxEmission*);
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
const char* syntax_emission_wrapper(const SyntaxEmission*, const char*);
const SyntaxEmissionHelper* syntax_emission_find_helper(const SyntaxEmission*, const char*);
const char* syntax_emission_capture_name(const SyntaxEmission*, TowerNode*);
size_t syntax_emission_repetition_count(const SyntaxEmission*);
const SyntaxEmissionHelper* syntax_emission_repetitions(const SyntaxEmission*);
size_t syntax_emission_helper_count(const SyntaxEmission*);
void syntax_emission_helper(const SyntaxEmission*, size_t, SyntaxEmissionHelper*);
uint32_t syntax_emission_literal(const SyntaxEmission*, const char*);
uint32_t syntax_emission_terminal(const SyntaxEmission*, const char*);
size_t syntax_emission_literal_count(const SyntaxEmission*);
const SyntaxEmissionLiteral* syntax_emission_literals(const SyntaxEmission*);
const uint32_t* syntax_emission_literal_ids(const SyntaxEmission*);
size_t syntax_emission_keyword_count(const SyntaxEmission*);
const char* const* syntax_emission_keywords(const SyntaxEmission*);
bool syntax_emission_keyword_starts(const SyntaxEmission*);
SyntaxLexicon* syntax_emission_lexicon(const SyntaxEmission*);
// Owned host strings, released with tower_memory_free.
char* syntax_emission_token_text(const SyntaxEmission*, uint32_t);
char* syntax_emission_completion_close(const SyntaxEmission*, LRCompletion*, const char*);
}
