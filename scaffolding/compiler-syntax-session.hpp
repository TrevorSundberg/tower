#pragma once
#include "compiler-syntax-version.hpp"
#include "syntax.hpp"

struct SyntaxSessionPins {
  const FrontendRevision *grammar, *baseline, *bedrock;
  SyntaxVersion *version, *completion_version;
};
struct LRCompletion;
struct SyntaxHighlightSpan {
  size_t start, end, revision;
  const char* kind;
  bool opaque;
  uint32_t token;
};
struct SyntaxHighlights {
  struct { SyntaxHighlightSpan* data; size_t length, capacity; } items;
  struct { TowerByteBuffer* data; size_t length, capacity; } styles;
};
// Mechanical ABI view. Tower owns every allocation and retained reference.
struct SyntaxSession {
  SyntaxSessionInputs inputs;
  const char* source;
  size_t source_length, cursor, revision;
  SyntaxSessionPins pins;
  Recognizer* recognizer;
  bool completing;
  LRCompletion* completion;
  char* completion_suffix;
  bool bootstrapping, declaration, building_bedrock, finalized, declarations_only, formatting;
  size_t comment_cursor;
  SyntaxVersionCache cache;
  SyntaxExpansionStats expansion_stats;
  CoreName error;
  size_t error_offset;
  bool error_insertion;
  SyntaxHighlights highlights;
};
extern "C" SyntaxSession* syntax_session_allocate(void*, void*);
extern "C" void syntax_session_completion(SyntaxSession*, LRCompletion*);
extern "C" char* syntax_session_suffix(SyntaxSession*, char*);
extern "C" void syntax_session_progress(SyntaxSession*);
struct TowerFormatResult;
extern "C" bool syntax_format_into(SyntaxSession*, TowerFormatResult*, const char**);
extern "C" void syntax_highlights_dispose(SyntaxHighlights*);
extern "C" bool syntax_highlights_copy(SyntaxHighlights*, const SyntaxHighlights*);
extern "C" void syntax_highlights_style(SyntaxHighlights*, size_t, const char*);
extern "C" void syntax_session_pin_revision(const FrontendRevision**, const FrontendRevision*);
extern "C" void syntax_session_pin_version(SyntaxVersion**, SyntaxVersion*);
extern "C" void syntax_session_pins_baseline(SyntaxSessionPins*, const SyntaxSessionPins*);
extern "C" void syntax_session_pins_dispose(SyntaxSessionPins*);
