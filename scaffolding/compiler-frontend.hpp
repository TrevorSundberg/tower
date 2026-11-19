#pragma once
#include "parser.hpp"

// Borrowed kinds from the shared entity registry. No independent node layout.
struct FrontendKinds {
  TowerNode *rule, *reference, *string, *range, *match, *syntax;
};
extern "C" TowerNode* frontend_bedrock_create(FrontendKinds*);
extern "C" size_t frontend_bedrock_tests(FrontendKinds*);

struct FrontendPatternCompiler;
struct TowerFormatResult;
struct LexPattern;
extern "C" {
FrontendPatternCompiler* frontend_pattern_create(const FrontendKinds*);
void frontend_pattern_destroy(FrontendPatternCompiler*);
LexPattern* frontend_pattern_read(FrontendPatternCompiler*, const char*, size_t, TowerFormatResult*);
}

struct FrontendSource { const char* data; size_t length; };
struct SemanticProgram;
extern "C" void frontend_compile_sources(SemanticProgram*, const FrontendSource*, size_t);

struct SyntaxRuleView;
struct FrontendRevision;
struct FrontendCache {
  struct { FrontendRevision** data; size_t length, capacity; } entries;
  size_t builds, hits;
};
extern "C" {
void frontend_cache_dispose(FrontendCache*);
bool frontend_cache_copy(FrontendCache*, const FrontendCache*);
size_t frontend_cache_find(FrontendCache*, const SyntaxRuleView*, size_t, TowerNode* const*, size_t, TowerNode*);
size_t frontend_cache_store(FrontendCache*, const SyntaxRuleView*, size_t, TowerNode* const*, size_t);
void frontend_cache_pattern(FrontendCache*, TowerNode*, TowerNode*);
}

struct FrontendDiagnostic;
struct FrontendContextPosition {
  size_t production, term;
  uint32_t first, last;
  bool terminal;
};
struct FrontendExpectation {
  uint32_t id;
  bool insertion, completes;
  struct { ParserRulePosition* data; size_t length, capacity; } contexts;
};
struct LRParser;
extern "C" {
FrontendDiagnostic* frontend_diagnostic_create(LRParser*, bool, bool, bool, uint32_t, size_t);
void frontend_diagnostic_destroy(FrontendDiagnostic*);
uint32_t frontend_diagnostic_next(FrontendDiagnostic*);
void frontend_diagnostic_contexts(FrontendDiagnostic*, const FrontendContextPosition*, size_t);
void frontend_diagnostic_feed(FrontendDiagnostic*, bool, size_t, uint32_t);
size_t frontend_diagnostic_state(FrontendDiagnostic*);
size_t frontend_diagnostic_position(FrontendDiagnostic*);
size_t frontend_diagnostic_count(FrontendDiagnostic*);
const FrontendExpectation* frontend_diagnostic_expected(FrontendDiagnostic*, size_t);
bool frontend_diagnostic_complete(FrontendDiagnostic*);
}
