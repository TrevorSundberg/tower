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

struct Table;
struct ParserFormat;
enum class ParserFormatKind : uint32_t {
  Scalar, Range, Item, Rule, Grammar, State, Tables, Edge, Conflict,
  Expected, Unexpected, Missing
};
enum class ParserFormatNeed : uint32_t { Done, Name, Description };
extern "C" {
ParserFormat* parser_format_create(const Table*, ParserFormatKind, size_t, size_t, bool, bool);
void parser_format_destroy(ParserFormat*);
ParserFormatNeed parser_format_next(ParserFormat*);
size_t parser_format_index(const ParserFormat*);
void parser_format_reply(ParserFormat*, const char*, size_t);
const TowerFormatResult* parser_format_result(const ParserFormat*);
}
