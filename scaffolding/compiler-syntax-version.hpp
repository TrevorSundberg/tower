#pragma once
#include "compiler-frontend.hpp"

struct SyntaxEmission;
struct SyntaxPendingRevision;
struct SyntaxReplacementOwner;
struct SyntaxLexicon;
// Mechanical view of the Tower owner. Native shared_ptr leases currently carry
// its single transport reference; construction and final release are Tower code.
struct SyntaxVersion {
  size_t references;
  const FrontendRevision* grammar;
  TowerNode* rules;
  Table* table;
  SyntaxLexicon* lexicon;
  SyntaxEmission* emission;
  SyntaxPendingRevision* pending;
  const FrontendRevision* bedrock;
  SyntaxReplacementOwner* replacements;
  size_t replacement_error_offset;
};
extern "C" SyntaxVersion* syntax_version_create(void*, const FrontendRevision*, const FrontendRevision*);
extern "C" SyntaxVersion* syntax_version_retain(SyntaxVersion*);
extern "C" void syntax_version_release(SyntaxVersion*);
