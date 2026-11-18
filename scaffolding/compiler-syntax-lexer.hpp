#pragma once
#include "compiler-lr.hpp"
#include "compiler-lexer-table.hpp"
struct SyntaxLexicon;
struct LexiconChoice { size_t length; uint32_t id; const char* style; bool skipped; size_t checks; };
extern "C" {
SyntaxLexicon* lexicon_create();
void lexicon_destroy(SyntaxLexicon*);
bool lexicon_token(SyntaxLexicon*, LexerTable*, uint32_t, const char*, bool, bool, bool);
bool lexicon_literal(SyntaxLexicon*, const char*, size_t, uint32_t, bool);
bool lexicon_start(SyntaxLexicon*, const char*, size_t);
void lexicon_choose(SyntaxLexicon*, const char*, size_t, size_t, bool, LRRuntime*, size_t, LexiconChoice*);
void lexicon_skip(SyntaxLexicon*, const char*, size_t, size_t, LexiconChoice*);
size_t lexicon_identifier(SyntaxLexicon*, const char*, size_t, size_t);
bool lexicon_declaration(SyntaxLexicon*, const char*, size_t, size_t);
}
