#include "syntax-nodes.hpp"
#include <cassert>
#include <initializer_list>

namespace {
TowerNodeRef entity(SyntaxKind kind) {
  auto node = TowerNodeRef::adopt(tower_node_create()); syntax_attach(node.get(), kind); return node;
}
void append(TowerNode* parent, const TowerNodeRef& child) {
  tower_node_attach(child.get(), parent); syntax_node(parent).items.push_back(child.get());
}
TowerNodeRef reference(const char* name, const char* capture = "") {
  auto node = entity(SyntaxKind::Term); auto& term = syntax_node(node.get());
  term.text = name; term.capture = capture; return node;
}
TowerNodeRef literal(const char* value) {
  auto node = reference(value); syntax_node(node.get()).literal = true; return node;
}
TowerNodeRef alternative(std::initializer_list<TowerNodeRef> terms) {
  auto node = entity(SyntaxKind::Alternative);
  for (const auto& term : terms) append(node.get(), term);
  return node;
}
void rule(TowerNode* document, const char* name, std::initializer_list<TowerNodeRef> alternatives) {
  auto node = entity(SyntaxKind::Rule); syntax_node(node.get()).name = name;
  for (const auto& alternative : alternatives) append(node.get(), alternative);
  append(document, node);
}
void token(TowerNode* document, SyntaxKind kind, const char* name, const char* pattern, const char* style = "") {
  auto node = entity(kind); auto& value = syntax_node(node.get());
  value.name = name; value.text = pattern; value.style = style;
  std::string error; value.compiled = lex_pattern_compile(pattern, error); assert(error.empty());
  append(document, node);
}
}

// The immutable C++ seed starts bedrock.tower. These are ordinary entities
// with grammar components; the same formatter serializes them to bedrock text.
// Each session applies local overrides without mutating this shared baseline.
TowerNode* syntax_native_bedrock() {
  static TowerNodeRef document = [] {
    auto root = entity(SyntaxKind::Document); auto* doc = root.get();
    token(doc, SyntaxKind::Skip, "Whitespace", R"([ \t\r\n]+)");
    token(doc, SyntaxKind::Skip, "LineComment", R"(\/\/[^\r\n]*)", "comment");
    token(doc, SyntaxKind::Skip, "BlockComment", R"(\/\*([^*]|\*+[^*/])*\*+\/)", "comment");
    token(doc, SyntaxKind::Token, "Identifier", R"([A-Za-z_][A-Za-z0-9_]*|`([^`\\\r\n]|\\[nrt\\`])*`)", "identifier");
    token(doc, SyntaxKind::Token, "String", R"("([^"\\\r\n]|\\[nrt\\'"])*"|'([^'\\\r\n]|\\[nrt\\'"])*')", "string");
    syntax_node(syntax_node(doc).items.front()).comments = {
      "// This bedrock.tower is loaded first, then foundation.tower.",
      "// GrammarPattern reads /patterns/ for token and skip rules.",
      "// GrammarTemplate reads {replacement bodies} with balanced braces."
    };
    rule(doc, "GrammarDeclaration", {alternative({literal("parse"), reference("Identifier", "name"),
      reference("GrammarAssignment", "op"), reference("GrammarAlternatives", "alternatives"),
      reference("GrammarReplacement", "replacement"), literal(";")})});
    rule(doc, "GrammarTokenDeclaration", {alternative({literal("token"), reference("Identifier", "name"), literal("="),
      reference("GrammarPattern", "pattern"), reference("GrammarStyle", "style"), literal(";")})});
    rule(doc, "GrammarSkipDeclaration", {alternative({literal("skip"), reference("Identifier", "name"), literal("="),
      reference("GrammarPattern", "pattern"), reference("GrammarStyle", "style"), literal(";")})});
    rule(doc, "GrammarAssignment", {alternative({literal("=")}), alternative({literal("|=")})});
    rule(doc, "GrammarReplacement", {alternative({}), alternative({literal("=>"), literal("replace"), reference("GrammarTemplate", "body")})});
    rule(doc, "GrammarAlternatives", {
      alternative({reference("GrammarAlternatives", "previous"), literal("|"), reference("GrammarSequence", "sequence")}),
      alternative({reference("GrammarSequence", "sequence")})});
    rule(doc, "GrammarSequence", {
      alternative({reference("GrammarSequence", "previous"), reference("GrammarTerm", "term")}), alternative({})});
    rule(doc, "GrammarTerm", {alternative({reference("GrammarAtom", "atom"), reference("GrammarSuffix", "suffix")})});
    rule(doc, "GrammarSuffix", {alternative({literal("*")}), alternative({literal("+")}), alternative({literal("?")}), alternative({})});
    rule(doc, "GrammarAtom", {alternative({reference("String", "literal")}), alternative({reference("Identifier", "reference")}),
      alternative({literal("$"), reference("Identifier", "capture")}),
      alternative({literal("$"), reference("Identifier", "capture"), literal(":"), reference("Identifier", "reference")})});
    rule(doc, "GrammarStyle", {alternative({}), alternative({literal("as"), reference("Identifier", "kind")})});
    return root;
  }();
  return document.get();
}
