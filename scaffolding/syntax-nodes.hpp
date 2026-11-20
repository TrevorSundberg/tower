#pragma once
#include "node-ref.hpp"
#include "compiler-bytes.hpp"
#include "compiler-source.hpp"
#include "lex-pattern.hpp"
#include <string>
#include <vector>

struct SyntaxComments;
extern "C" bool syntax_comments_push(SyntaxComments*, const char*, size_t);
struct SyntaxComments {
  CoreName* data;
  size_t length, capacity;
  const CoreName* begin() const { return data; }
  const CoreName* end() const { return data ? data + length : data; }
  size_t size() const { return length; }
  void emplace_back(std::string_view text) { if (!syntax_comments_push(this, text.data(), text.size())) std::abort(); }
};

enum class SyntaxKind { Document, Rule, Token, Skip, Alternative, Term, Template, Import };

// Grammar meaning lives ON the declaration's actual parse nodes. items are
// non-owning edges to descendants; a replacement reference owns a sibling
// template so an indexed alternative can outlive its declaration's parse tree.
struct SyntaxNode {
  SyntaxKind kind = SyntaxKind::Document;
  CoreName name, text, capture, style;
  const SyntaxSource* source = nullptr;
  bool literal = false, append = false, contextual = false, terminal_set = false;
  char repetition = 0;
  CoreNodes items;
  TowerNode* replacement = nullptr;
  SyntaxComments comments;
  size_t start = TOWER_INVALID_INDEX, end = TOWER_INVALID_INDEX;
  const LexPattern* compiled = nullptr; // derived lexer cache only
  uint32_t precedence = 0, associativity = 0;
};
extern "C" {
size_t syntax_node_size();
size_t syntax_node_offset(size_t);
void syntax_node_init(SyntaxNode*);
void syntax_node_dispose(SyntaxNode*);
void syntax_node_source(SyntaxNode*, const SyntaxSource*);
void syntax_node_replacement(SyntaxNode*, TowerNode*);
void syntax_node_pattern(SyntaxNode*, const LexPattern*);
int32_t syntax_nodes_equal(TowerNode*, TowerNode*, TowerNode* type, bool locations);
}
extern "C" TowerNode* syntax_component_type();
extern "C" SyntaxNode* syntax_get(TowerNode* node);
extern "C" SyntaxNode* syntax_component_attach(TowerNode* node, SyntaxKind kind);
SyntaxNode& syntax_node(TowerNode* node);
SyntaxNode& syntax_attach(TowerNode* node, SyntaxKind kind);
extern "C" bool syntax_equal(TowerNode* a, TowerNode* b, bool locations = false);
extern "C" const char* syntax_kind_name(SyntaxKind kind);
