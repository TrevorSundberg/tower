#include "core.hpp"
#include "syntax-nodes.hpp"
#include "format.hpp"
#include <cassert>
#include <set>

std::string tower_identifier_value(std::string_view text) {
  if (text.size() < 2 || text.front() != '`' || text.back() != '`') return std::string(text);
  std::string out;
  for (size_t i = 1; i + 1 < text.size(); ++i) {
    char c = text[i];
    if (c == '\\' && i + 2 < text.size()) {
      c = text[++i];
      if (c == 'n') c = '\n'; else if (c == 'r') c = '\r'; else if (c == 't') c = '\t';
    }
    out += c;
  }
  return out;
}

namespace {
std::string identifier(const std::string& name) {
  const auto alpha = [](char c) { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_'; };
  bool plain = !name.empty() && alpha(name.front());
  for (char c : name) plain &= alpha(c) || (c >= '0' && c <= '9');
  // These are the fixed canonical spellings emitted by this formatter and the
  // declaration reader, independent of the editable input grammar's keywords.
  static const std::set<std::string> keywords{"var", "fn", "if", "else", "loop", "break", "continue", "return",
    "true", "false", "null", "parse", "token", "skip", "as", "replace", "struct", "extern", "export", "when", "expected"};
  if (plain && !keywords.contains(name)) return name;
  std::string out = "`";
  for (char c : name) {
    if (c == '\n') out += "\\n";
    else if (c == '\r') out += "\\r";
    else if (c == '\t') out += "\\t";
    else { if (c == '`' || c == '\\') out += '\\'; out += c; }
  }
  return out + '`';
}
struct Formatter {
  TowerText result;
  size_t depth = 0;
  void text(const std::string& s) { result.source += s; }
  void indent() { text(std::string(depth * 4, ' ')); }
  void quote(const std::string& value) {
    text("'");
    for (char c : value) {
      if (c == '\n') text("\\n");
      else if (c == '\r') text("\\r");
      else if (c == '\t') text("\\t");
      else { if (c == '\\' || c == '\'') text("\\"); text(std::string(1, c)); }
    }
    text("'");
  }
  void grammar_term(TowerNode* entity) {
    const auto& term = syntax_node(entity);
    if (!term.capture.empty()) {
      text("$" + identifier(term.capture));
      if (term.capture != term.text) text(":");
      else { if (term.repetition) text(std::string(1, term.repetition)); return; }
    }
    if (term.terminal_set) {
      text("[^");
      for (size_t i = 0; i < term.items.size(); ++i) { if (i) text(" "); quote(syntax_node(term.items[i]).text); }
      text("]");
    } else if (term.literal) quote(term.text); else text(identifier(term.text));
    if (term.repetition) text(std::string(1, term.repetition));
  }
  void grammar_alternative(TowerNode* entity) {
    const auto& alternative = syntax_node(entity);
    for (size_t i = 0; i < alternative.items.size(); ++i) {
      if (i) text(" "); grammar_term(alternative.items[i]);
    }
  }
  void comments(const SyntaxNode& n) {
    for (const auto& comment : n.comments) { indent(); text(comment); text("\n"); }
  }
  void replacement(const SyntaxNode& n) {
    if (!n.replacement) return;
    text(" => replace {"); text(syntax_node(n.replacement.get()).text); text("}");
  }
  void grammar(TowerNode* entity) {
    const auto& n = syntax_node(entity);
    if (n.kind == SyntaxKind::Document) {
      for (auto* item : n.items) node(item);
      comments(n); return;
    }
    comments(n); indent(); const size_t begin = result.source.size();
    if (n.kind == SyntaxKind::Rule) {
      text("parse " + identifier(n.name) + (n.append ? " |=" : " ="));
      for (size_t i = 0; i < n.items.size(); ++i) {
        if (i) text(" |");
        if (!syntax_node(n.items[i]).items.empty()) text(" ");
        grammar_alternative(n.items[i]);
      }
      // Preserve the template's language, holes and trivia. Its syntax belongs
      // to this declaration's grammar, not a later one.
      replacement(n);
      if (!n.replacement && !n.items.empty() && syntax_node(n.items.back()).items.empty()) text(" ");
      text(";\n");
    } else if (n.kind == SyntaxKind::Token || n.kind == SyntaxKind::Skip) {
      text(n.kind == SyntaxKind::Skip ? "skip " : "token ");
      text(identifier(n.name) + " = /" + n.text + "/");
      if (n.contextual) text(" when expected");
      if (!n.style.empty()) text(" as " + identifier(n.style));
      text(";\n");
    } else if (n.kind == SyntaxKind::Alternative) { grammar_alternative(entity); replacement(n); }
    else if (n.kind == SyntaxKind::Term) grammar_term(entity);
    else text(n.text);
    if (n.start != TOWER_INVALID_INDEX) result.spans.push_back({begin, result.source.size(), n.start});
  }
  void node(TowerNode* entity) {
    if (syntax_get(entity)) grammar(entity);
    else if (core_node(entity).kind == CoreKind::Program) {
      for (auto* item : core_node(entity).items) node(item);
    } else statement(entity);
  }
  void type(CoreType t) {
    if (t.scalar == CoreScalar::Array) { auto& a = core_node(t.record); type(a.element); text("[" + std::to_string(a.length) + "]"); }
    else { auto base = t; base.pointers = 0; text(identifier(core_type_name(base))); }
    text(std::string(t.pointers, '*'));
  }
  void expression(TowerNode* node) {
    auto& n = core_node(node);
    if (auto* name = core_builtin_name(n.kind)) {
      text(std::string(name) + "(");
      switch (n.kind) {
        case CoreKind::Print: expression(n.value); break;
        case CoreKind::SizeOf: case CoreKind::AlignOf: type(n.element); break;
        case CoreKind::Allocate: case CoreKind::Reallocate:
          type(n.element); text(", "); if (n.left) { expression(n.left); text(", "); } expression(n.right); break;
        case CoreKind::Convert: case CoreKind::Bits: type(n.type); text(", "); expression(n.value); break;
        case CoreKind::Free: expression(n.left); break;
        case CoreKind::Copy: case CoreKind::Fill:
          expression(n.left); text(", "); expression(n.right); text(", "); expression(n.value); break;
        default: assert(false);
      }
      text(")"); return;
    }
    switch (n.kind) {
      case CoreKind::Operand:
        if (!n.constant) text(identifier(core_node(n.binding).name));
        else if (n.type.pointers) text("null");
        else if (n.type.scalar == CoreScalar::Bool) text(n.bits ? "true" : "false");
        else text(core_number(n.bits, n.type));
        break;
      case CoreKind::String: quote(n.name); break;
      case CoreKind::Binary: expression(n.left); text(" "); text(core_operator(n.op)); text(" "); expression(n.right); break;
      case CoreKind::Field: expression(n.left); text("." + identifier(n.name)); break;
      case CoreKind::Index: expression(n.left); text("["); expression(n.right); text("]"); break;
      case CoreKind::Address: text("&"); expression(n.value); break;
      case CoreKind::Load: text("*"); expression(n.value); break;
      case CoreKind::Call:
        text(identifier(core_node(n.binding).name) + "(");
        for (size_t i = 0; i < n.items.size(); ++i) { if (i) text(", "); expression(n.items[i]); }
        text(")"); break;
      default: assert(false);
    }
  }
  void block(TowerNode* node) {
    text("{\n"); ++depth;
    for (auto* item : core_node(node).items) statement(item);
    --depth; indent(); text("}");
  }
  void statement(TowerNode* node) {
    auto& n = core_node(node); indent(); size_t begin = result.source.size();
    switch (n.kind) {
      case CoreKind::Declare:
        text("var " + identifier(n.name) + ": "); type(n.type);
        if (n.value) { text(" = "); expression(n.value); }
        text(";"); break;
      case CoreKind::Assign:
        expression(n.target); text(" = "); expression(n.value); text(";"); break;
      case CoreKind::Return: text("return"); if (n.value) { text(" "); expression(n.value); } text(";"); break;
      case CoreKind::Call: case CoreKind::Print: case CoreKind::Free: case CoreKind::Copy: case CoreKind::Fill:
      case CoreKind::Allocate: case CoreKind::Reallocate: case CoreKind::SizeOf: case CoreKind::AlignOf: case CoreKind::Convert: case CoreKind::Bits:
        expression(node); text(";"); break;
      case CoreKind::Break: text("break;"); break;
      case CoreKind::Continue: text("continue;"); break;
      case CoreKind::Block: block(node); break;
      case CoreKind::Loop: text("loop "); block(n.body); break;
      case CoreKind::If:
        text("if "); expression(n.value); text(" "); block(n.body);
        if (n.otherwise) { text(" else "); block(n.otherwise); } break;
      case CoreKind::Function:
        if (n.external) text("extern "); else if (n.exported) text("export ");
        text("fn " + identifier(n.name) + "(");
        for (size_t i = 0; i < n.parameters.size(); ++i) {
          if (i) text(", "); auto& p = core_node(n.parameters[i]); text(identifier(p.name) + ": "); type(p.type);
        }
        text("): "); type(n.type); if (n.external) text(";"); else { text(" "); block(n.body); } break;
      case CoreKind::Type:
        text("struct " + identifier(n.name) + " {\n"); ++depth;
        for (auto* field : n.items) { auto& f = core_node(field); indent(); text(identifier(f.name) + ": "); type(f.type); text(";\n"); }
        --depth; indent(); text("}"); break;
      default: assert(false);
    }
    result.spans.push_back({begin, result.source.size(), n.start}); text("\n");
  }
};
}
TowerText tower_format(TowerNode* node) {
  Formatter f; f.node(node);
  return std::move(f.result);
}
