#pragma once
#include "parser.hpp"
#include "syntax-nodes.hpp"
#include "format.hpp"
#include <string>
#include <vector>
#include <memory>

struct SyntaxSession;
// Bedrock starts from the immutable native grammar, then applies declarations
// incrementally like every file. Existing sessions retain their own baselines.
TowerNode* syntax_native_bedrock(); // read-only borrowed document of generated shared nodes
std::string syntax_set_bedrock(const char* source);
SyntaxSession* syntax_create_bedrock(const char* source);
TowerNode* syntax_document(SyntaxSession* session); // borrowed declaration document
TowerText syntax_format(SyntaxSession* session);
bool syntax_can_format(SyntaxSession* session);
inline constexpr size_t SYNTAX_MAX_CACHED_GRAMMARS = 64;
// Load foundation with the installed bedrock reader (native seed for legacy
// callers that have not installed bedrock). Same source is idempotent; failures
// are atomic.
// Existing sessions keep their original baseline even if this is called again.
std::string syntax_set_bootstrap(const char* source);
// Inspect/edit foundation over bedrock's shared definitions, without importing
// its previous foundation definitions.
SyntaxSession* syntax_create_foundation(const char* source);

// Native bootstrap for Tower's in-source `parse` declarations. Owns a copy of
// the source and a grammar revision. Declarations activate after their semicolon.
extern "C" SyntaxSession* syntax_create(const char* source);
extern "C" void syntax_destroy(SyntaxSession* session);
// Restart from grammar revision zero, retaining a bounded cache of compiled
// grammars. Source, errors, highlights and parse progress are always reset.
void syntax_reset(SyntaxSession* session, const char* source);
struct SyntaxCacheStats { size_t builds, hits, entries; };
SyntaxCacheStats syntax_get_cache_stats(SyntaxSession* session);

// Parse/install one declaration or parse one Statement, transferring one root
// reference to the caller. Null means EOF or error; inspect syntax_get_error.
// Earlier trees remain valid across grammar changes and session destruction.
extern "C" TowerNode* syntax_next(SyntaxSession* session);
extern "C" const char* syntax_get_error(SyntaxSession* session);
extern "C" size_t syntax_get_revision(SyntaxSession* session);
size_t syntax_get_offset(SyntaxSession* session);

// Tooling uses the same lexer as parsing. Offsets are UTF-8 bytes; revision is
// the grammar active when this token was read. No browser-side keyword list.
struct SyntaxHighlight {
  size_t start, end, revision;
  std::string kind;
  bool opaque = false; // lexical classification, independent of presentation style
  uint32_t token = PARSER_ID_EOF; // disposable lexer index, never persisted
};
struct SyntaxRuleInfo { std::string name, definition; bool pending = false; };
struct SyntaxTokenInfo { std::string name, pattern, kind; bool skip, contextual = false; };
std::vector<SyntaxTokenInfo> syntax_get_tokens(SyntaxSession* session);
std::vector<SyntaxHighlight> syntax_get_highlights(SyntaxSession* session);
std::vector<SyntaxHighlight> syntax_get_lexemes(SyntaxSession* session);
std::vector<SyntaxRuleInfo> syntax_get_rules(SyntaxSession* session);
std::vector<std::string> syntax_get_keywords(SyntaxSession* session);
extern "C" size_t syntax_get_error_offset(SyntaxSession* session);
bool syntax_get_error_insertion(SyntaxSession* session);

// Copied source coordinates and shared expansion history survive the session.
// Match spans on generated nodes point to the invocation, while this component
// records the template source. Captured subtrees keep their original spans.
struct SyntaxExpansion {
  std::string rule;
  size_t start = 0, end = 0, definition_start = 0, definition_end = 0;
  std::shared_ptr<const SyntaxExpansion> previous;
};
struct SyntaxOrigin {
  size_t template_start = 0, template_end = 0;
  bool generated = false;
  std::shared_ptr<const SyntaxExpansion> expansion;
  // Additional splices preserve the history of an already-generated capture.
  std::vector<std::shared_ptr<const SyntaxExpansion>> splices;
};
const SyntaxOrigin* syntax_get_origin(TowerNode* node);
void syntax_copy_origin(TowerNode* source, TowerNode* destination);
struct SyntaxExpansionStats { size_t replacements = 0, generated_nodes = 0, copied_nodes = 0; };
SyntaxExpansionStats syntax_get_expansion_stats(SyntaxSession* session);

void syntax_tests();
