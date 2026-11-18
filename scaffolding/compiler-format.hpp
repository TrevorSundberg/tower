#pragma once
#include "format.hpp"
#include "byte-buffer.hpp"

// Borrowed shared entities in; owned text/spans out. No serialized graph or
// formatter AST. Kind arguments identify the existing registered components.
// Initialize result to zero; dispose it after either success or failure. Input
// entities/components and UTF-8 ranges must remain valid for the entire call.
// Source leaves and lexer comments must have nonoverlapping ranges within source.
// Failure is sticky and the C++ entry points discard partial text and spans.
// A null foundation kind requests lazy registration (grammar-only formatting
// must not initialize the foundation registry as an observable side effect).
struct TowerFormatSpans { TowerSourceSpan* data; size_t length, capacity; };
struct TowerFormatResult { TowerByteBuffer text; TowerFormatSpans spans; size_t depth; bool failed; };
extern "C" {
void format_entity(TowerFormatResult*, TowerNode*, TowerNode* syntax, TowerNode* foundation, TowerNode* match);
void format_source(TowerFormatResult*, TowerNode**, size_t, const char*, size_t,
  const TowerCommentSpan*, size_t, TowerNode* syntax, TowerNode* foundation, TowerNode* match);
void format_dispose(TowerFormatResult*);
}
