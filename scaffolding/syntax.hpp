#pragma once
#include "parser.hpp"
#include "syntax-nodes.hpp"
#include "format.hpp"
#include <string>
#include <memory>

struct SyntaxSession;
// Bedrock starts from the world's immutable Tower-built seed, then applies declarations
// incrementally like every file. Existing sessions retain their own baselines.
extern "C" TowerNode* syntax_native_bedrock(); // read-only borrowed document of generated shared nodes
std::string syntax_set_bedrock(const char* source);
SyntaxSession* syntax_create_bedrock(const char* source);
inline constexpr size_t SYNTAX_MAX_CACHED_GRAMMARS = 64;
// Load foundation with the installed bedrock reader (world seed for legacy
// callers that have not installed bedrock). Same source is idempotent; failures
// are atomic.
// Existing sessions keep their original baseline even if this is called again.
std::string syntax_set_bootstrap(const char* source);
// Inspect/edit foundation over bedrock's shared definitions, without importing
// its previous foundation definitions.
SyntaxSession* syntax_create_foundation(const char* source);

// Incremental reader for Tower's in-source `parse` declarations. Owns a copy of
// the source and a grammar revision. Declarations activate after their semicolon.
struct FrontendModule;
extern "C" SyntaxSession* syntax_create(const char* source, FrontendModule* module = nullptr);
extern "C" void syntax_destroy(SyntaxSession* session);
// Restart from grammar revision zero, retaining a bounded cache of compiled
// grammars. Source, errors, highlights and parse progress are always reset.
extern "C" void syntax_reset(SyntaxSession* session, const char* source, FrontendModule* module = nullptr);

// Parse/install one declaration or parse one Statement, transferring one root
// reference to the caller. Null means EOF or error; inspect syntax_get_error.
// Earlier trees remain valid across grammar changes and session destruction.
extern "C" TowerNode* syntax_next(SyntaxSession* session);
extern "C" const char* syntax_get_error(SyntaxSession* session);
extern "C" size_t syntax_get_revision(SyntaxSession* session);

extern "C" void syntax_completion_enable(SyntaxSession*);
extern "C" FrontendModule* syntax_completion_module(SyntaxSession*);
// Borrowed shared entities from the active grammar; callers retain as needed.
extern "C" TowerNode* syntax_inspection_reference(SyntaxSession*, const char*, size_t, size_t, size_t*);
extern "C" TowerNode* syntax_inspection_match(SyntaxSession*, TowerNode*);
extern "C" TowerNode* syntax_inspection_template(SyntaxSession*, TowerNode*, const char**, size_t*);
extern "C" TowerNode* syntax_inspection_capture(SyntaxSession*, TowerNode*, size_t);
extern "C" bool syntax_completion_accepts(SyntaxSession*, const char*, bool);
extern "C" bool syntax_completion_callable(SyntaxSession*);
extern "C" bool syntax_completion_identifier(SyntaxSession*, const char*);
extern "C" const char* syntax_completion_close(SyntaxSession*, const char*);
extern "C" SyntaxSession* syntax_completion_create(const char*, unsigned);
extern "C" size_t syntax_get_error_offset(SyntaxSession* session);

// Copied source coordinates and shared expansion history survive the session.
// Match spans on generated nodes point to the invocation, while this component
// records the template source. Captured subtrees keep their original spans.
struct SyntaxExpansion {
  CoreName rule;
  size_t start = 0, end = 0, definition_start = 0, definition_end = 0;
  const SyntaxExpansion* previous;
};
struct SyntaxOrigin {
  size_t template_start = 0, template_end = 0;
  bool generated = false;
  const SyntaxExpansion* expansion;
  // Additional splices preserve the history of an already-generated capture.
  struct { const SyntaxExpansion** data; size_t length, capacity; } splices;
};
extern "C" const SyntaxOrigin* syntax_get_origin(TowerNode* node);
extern "C" void syntax_copy_origin(TowerNode* source, TowerNode* destination);
struct SyntaxExpansionStats { size_t replacements = 0, generated_nodes = 0, copied_nodes = 0; };

extern "C" void syntax_tests();
