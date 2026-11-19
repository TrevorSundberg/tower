#pragma once
#include "compiler-syntax-template.hpp"
#include "compiler-syntax-lexer.hpp"
// Borrowed session state. cursor is the only in/out field. The lexical tables,
// parser lookahead and shared entity kinds stay owned by the current revision.
struct SyntaxScanInput {
  SyntaxLexicon* lexicon;
  const char* source; size_t size, cursor, revision;
  bool declaration, bootstrapping;
  LRRuntime* runtime; size_t state;
  void* highlights;
  TowerNode *context, *match_kind;
  bool replacement;
  const SyntaxTemplateCapture* captures; size_t count, base;
};
struct SyntaxScanResult {
  uint32_t id;
  size_t start, length, checks;
  const char* error;
  TowerByteBuffer message;
};
extern "C" {
void syntax_scan_skip(SyntaxScanInput*, SyntaxScanResult*);
void syntax_scan_token(SyntaxScanInput*, SyntaxScanResult*);
TowerNode* syntax_scan_read(SyntaxScanInput*, SyntaxScanResult*);
bool syntax_scan_peek(SyntaxScanInput*, uint32_t*);
void syntax_scan_dispose(SyntaxScanResult*);
void syntax_scan_highlight(void*, size_t, size_t, size_t, const char*);
}
