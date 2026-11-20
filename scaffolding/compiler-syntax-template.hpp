#pragma once
#include "compiler-syntax-emission.hpp"
#include "compiler-lr.hpp"
struct Table;
// Borrowed immutable grammar index; valid until the table is destroyed.
extern "C" LRGrammar* parser_table_grammar(const Table*);

struct SyntaxTemplateCapture { const char* name; TowerNode* source; const char* wrapper; };
struct SyntaxTemplateGrammar {
  SyntaxEmissionInput emission;
  const SyntaxTemplateCapture* captures; size_t count;
  const SyntaxEmissionHelper* repetitions; size_t repetition_count;
};
struct SyntaxTemplateAlias { const char* name; const char* target; };
struct SyntaxTemplateName { const char* name; size_t index; };
struct SyntaxTemplateRemap {
  TowerNode* root;
  TowerNode* match_kind;
  const SyntaxEmissionProduction* source; size_t source_count; // sorted by index
  const SyntaxEmissionProduction* destination; size_t destination_count; // name, alternative
  const SyntaxTemplateAlias* aliases; size_t alias_count; // sorted by name
  const SyntaxTemplateName* names; size_t name_count; // sorted by name
  LRGrammar* grammar;
  size_t* uses; size_t count;
};
extern "C" bool syntax_template_holes(const SyntaxTemplateGrammar*);
extern "C" bool syntax_template_remap(const SyntaxTemplateRemap*);
