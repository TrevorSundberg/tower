#pragma once
#include "parser.hpp"

// Borrowed kinds from the shared entity registry. No independent node layout.
struct FrontendKinds {
  TowerNode *rule, *reference, *string, *range, *match, *syntax;
};
extern "C" Table* parser_table_open_host(TowerNode*, void*, ParserPresentation, uint32_t);
extern "C" bool parser_table_build(Table*, bool);
extern "C" size_t parser_table_rule_next(const Table*, size_t, size_t);
extern "C" TowerNode* frontend_bedrock_create(FrontendKinds*);
extern "C" size_t frontend_bedrock_tests(FrontendKinds*);
extern "C" size_t frontend_modules_tests();

struct FrontendPatternCompiler;
struct TowerFormatResult;
struct LexPattern;
extern "C" {
FrontendPatternCompiler* frontend_pattern_create(const FrontendKinds*);
void frontend_pattern_destroy(FrontendPatternCompiler*);
LexPattern* frontend_pattern_read(FrontendPatternCompiler*, const char*, size_t, TowerFormatResult*);
LexPattern* frontend_host_pattern_read(const char*, size_t, TowerFormatResult*);
}

struct FrontendSource { const char* data; size_t length; };
struct SemanticProgram;
struct ModuleEnvironment;
extern ModuleEnvironment* syntax_modules;
extern "C" void frontend_compile_sources(SemanticProgram*, const FrontendSource*, size_t, ModuleEnvironment*);

struct FrontendModule;
struct SyntaxSource;
struct ModuleGrammar {
  struct { struct SyntaxRuleView* data; size_t length, capacity; } rules;
  struct { TowerNode** data; size_t length, capacity; } tokens;
};
extern "C" {
ModuleEnvironment* frontend_modules_create();
void frontend_modules_destroy(ModuleEnvironment*);
void frontend_modules_configure(ModuleEnvironment*, const char*, const char*);
void frontend_modules_clear(ModuleEnvironment*);
void frontend_modules_fallback(ModuleEnvironment*, const char*);
void frontend_modules_reset_compilation(ModuleEnvironment*);
void frontend_modules_builtin(ModuleEnvironment*, const char*, const char*);
bool frontend_modules_source(ModuleEnvironment*, const char*, const char*, size_t);
bool frontend_modules_depfile(ModuleEnvironment*, const char*, const char*);
const char* frontend_modules_location(ModuleEnvironment*, size_t, size_t*, size_t*);
FrontendModule* frontend_module_root(const char*, ModuleEnvironment*);
void frontend_module_destroy(FrontendModule*);
const char* frontend_module_name(FrontendModule*);
const char* frontend_module_location(FrontendModule*, size_t, size_t*, size_t*);
const char* frontend_module_error(FrontendModule*);
ModuleGrammar* frontend_module_grammar(FrontendModule*);
bool frontend_module_import(FrontendModule*, TowerNode*, const SyntaxSource*);
void frontend_module_record(FrontendModule*, TowerNode*, bool);
}

struct SyntaxRuleView;
struct FrontendRevision {
  size_t references, slot;
  struct { SyntaxRuleView* data; size_t length, capacity; } rules;
  struct { unsigned char* data; size_t length, capacity; } names;
  struct { TowerNode** data; size_t length, capacity; } alternatives, tokens;
};
struct FrontendCache {
  struct { FrontendRevision** data; size_t length, capacity; } entries;
  size_t builds, hits;
};
extern "C" {
void frontend_revision_release(const FrontendRevision*);
const FrontendRevision* frontend_revision_retain(const FrontendRevision*);
const FrontendRevision* syntax_revision_create(const SyntaxRuleView*, size_t, TowerNode* const*, size_t);
const FrontendRevision* syntax_revision_overlay(const FrontendRevision*, const SyntaxRuleView*, size_t, TowerNode* const*, size_t, TowerNode*);
const FrontendRevision* syntax_revision_declare(const FrontendRevision*, TowerNode*, TowerNode*, struct TowerByteBuffer*);
const FrontendRevision* syntax_revision_ready(const FrontendRevision*, TowerNode* const*);
const FrontendRevision* syntax_revision_document(TowerNode*, TowerNode*);
const SyntaxRuleView* syntax_revision_rule(const FrontendRevision*, const char*, size_t);
TowerNode* syntax_revision_reference(const FrontendRevision*, const char*, size_t, size_t, size_t*, TowerNode*);
const char* syntax_revision_bedrock_error(const FrontendRevision*, TowerNode*);
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
