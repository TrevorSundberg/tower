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
  FrontendKinds kinds;
};
struct SyntaxVersionDiagnostic { TowerByteBuffer text; const char* fallback; size_t offset; };
extern "C" SyntaxVersion* syntax_version_create(void*, const FrontendRevision*, const FrontendRevision*);
extern "C" SyntaxVersion* syntax_version_retain(SyntaxVersion*);
extern "C" void syntax_version_release(SyntaxVersion*);
extern "C" SyntaxVersion* syntax_version_build(void*, const FrontendRevision*, const FrontendRevision*, SyntaxVersionDiagnostic*);
extern "C" bool syntax_version_seed(SyntaxVersion*, const FrontendRevision*, const char*, const SyntaxEmission*);
extern "C" bool syntax_version_lexicon(SyntaxVersion*);
extern "C" bool syntax_version_bedrock(const FrontendRevision*, TowerNode*, SyntaxVersionDiagnostic*);
extern "C" const char* syntax_version_diagnostic_text(SyntaxVersionDiagnostic*);
extern "C" void syntax_version_diagnostic_dispose(SyntaxVersionDiagnostic*);
extern "C" char* syntax_version_description(const SyntaxVersion*, const FrontendRevision*, size_t, bool);
