#pragma once
#include "node-ref.hpp"
#include "lex-pattern.hpp"
#include <string>
#include <vector>

enum class SyntaxKind { Document, Rule, Token, Skip, Alternative, Term, Template };
struct SyntaxSource { std::string name, text; };

// Grammar meaning lives ON the declaration's actual parse nodes. items are
// non-owning edges to descendants; a replacement reference owns a sibling
// template so an indexed alternative can outlive its declaration's parse tree.
struct SyntaxNode {
  SyntaxKind kind = SyntaxKind::Document;
  std::string name, text, capture, style;
  std::shared_ptr<const SyntaxSource> source;
  bool literal = false, append = false, contextual = false, terminal_set = false;
  char repetition = 0;
  std::vector<TowerNode*> items;
  TowerNodeRef replacement;
  std::vector<std::string> comments;
  size_t start = TOWER_INVALID_INDEX, end = TOWER_INVALID_INDEX;
  std::shared_ptr<const LexPattern> compiled; // derived lexer cache only
};
TowerNode* syntax_component_type();
SyntaxNode* syntax_get(TowerNode* node);
SyntaxNode& syntax_node(TowerNode* node);
SyntaxNode& syntax_attach(TowerNode* node, SyntaxKind kind);
bool syntax_equal(TowerNode* a, TowerNode* b, bool locations = false);
const char* syntax_kind_name(SyntaxKind kind);
