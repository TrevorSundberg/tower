#include "core.hpp"
#include "compiler-syntax-reader.hpp"
#include "syntax-nodes.hpp"
#include "format.hpp"
#include "parser.hpp"
#include <algorithm>
#include <cassert>
#include <set>

std::string tower_identifier_value(std::string_view text) {
  std::string result(text);
  result.resize(syntax_identifier_decode_in_place(result.data(), result.size()));
  return result;
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
  void newline(bool blank = false) {
    while (!result.source.empty() && (result.source.back() == ' ' || result.source.back() == '\t')) result.source.pop_back();
    if (result.source.empty()) return;
    const size_t wanted = blank ? 2 : 1;
    size_t count = 0;
    for (auto at = result.source.size(); at && result.source[at - 1] == '\n'; --at) ++count;
    while (count++ < wanted) text("\n");
  }
  void separate(bool before, bool after) { if (before || after) newline(true); }
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
    text("\n"); ++depth; indent(); --depth;
    text("=> replace {"); text(syntax_node(n.replacement).text); text("}");
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
      const auto continuation = result.source.size() - result.source.rfind('\n') - 1;
      for (size_t i = 0; i < n.items.size(); ++i) {
        if (i) {
          Formatter probe; probe.grammar_alternative(n.items[i]);
          auto column = result.source.size() - result.source.rfind('\n') - 1;
          if (column + 3 + probe.result.source.size() > 110) text("\n" + std::string(continuation, ' ') + "|");
          else text(" |");
        }
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
      bool previous = false;
      for (auto* item : core_node(entity).items) {
        auto kind = core_node(item).kind;
        bool declaration = kind == CoreKind::Function || kind == CoreKind::Type;
        separate(previous, declaration); node(item); previous = declaration;
      }
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
    if (core_node(node).items.empty()) { text("{}"); return; }
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
  static bool symbolic_operator(std::string_view value) {
    return !value.empty() && value.find_first_not_of("+-*/%&|^~!<>=?") == std::string_view::npos;
  }
  static bool operator_leaf(TowerNode* node, std::string_view source) {
    auto* match = static_cast<Match*>(tower_node_get_component_userdata(node, parser_match_get_type()));
    return match && parser_match_get_rule_index(match) == TOWER_INVALID_INDEX &&
      symbolic_operator(source.substr(parser_match_get_start(match), parser_match_get_length(match)));
  }
  struct SourceToken {
    size_t start, end;
    bool comment = false, pointer = false, unary = false, call = false, prefix = false, postfix = false;
  };
  void source_tokens(TowerNode* entity, std::string_view source, std::vector<SourceToken>& out,
      bool pointer = false, bool unary = false, bool call = false) {
    auto* match = static_cast<Match*>(tower_node_get_component_userdata(entity, parser_match_get_type()));
    if (!match) return;
    std::string_view label = parser_match_get_label(match);
    pointer |= label == "CoreType" || label == "CorePointerArgument";
    unary |= label == "CoreAddress" || label == "CoreLoad" || label == "CoreTarget" || label == "CoreOperand";
    call |= label == "CoreCall" || label == "CoreFunction" || label == "CoreExternal" || label == "CoreExport" || label == "CoreType";
    if (parser_match_get_rule_index(match) == TOWER_INVALID_INDEX) {
      auto start = parser_match_get_start(match), end = start + parser_match_get_length(match);
      if (end > start) out.push_back({start, end, false, pointer, unary, call});
    } else {
      const auto begin = out.size(), children = tower_node_get_child_count(entity);
      for (size_t i = 0; i < children; ++i)
        source_tokens(tower_node_get_child(entity, i), source, out, pointer, unary, call);
      // A symbol and one operand form an affix. Derive its spacing from the
      // matched production, including user rules, without naming an operator.
      if (children == 2 && out.size() > begin + 1) {
        const bool first = operator_leaf(tower_node_get_child(entity, 0), source);
        const bool last = operator_leaf(tower_node_get_child(entity, 1), source);
        if (first != last) {
          if (first) out[begin].prefix = true;
          else out.back().postfix = true;
        }
      }
    }
  }
  bool source_declaration(TowerNode* node) {
    auto* match = static_cast<Match*>(tower_node_get_component_userdata(node, parser_match_get_type()));
    if (!match) return false;
    std::string_view label = parser_match_get_label(match);
    if (label == "CoreFunction" || label == "CoreExternal" || label == "CoreExport" || label == "CoreStruct") return true;
    return tower_node_get_child_count(node) == 1 && source_declaration(tower_node_get_child(node, 0));
  }
  void source_statement(TowerNode* entity, std::string_view original, size_t from, size_t end,
      const std::vector<TowerCommentSpan>& comments) {
    std::vector<SourceToken> tokens; source_tokens(entity, original, tokens);
    for (auto comment : comments) if (comment.start >= from && comment.end <= end)
      tokens.push_back({comment.start, comment.end, true});
    std::sort(tokens.begin(), tokens.end(), [](auto a, auto b) { return a.start < b.start; });
    SourceToken previous{}; std::string_view last;
    size_t previous_end = from, parentheses = 0;
    for (auto token : tokens) {
      auto value = original.substr(token.start, token.end - token.start);
      auto gap = original.substr(previous_end, token.start - previous_end);
      auto lines = std::count(gap.begin(), gap.end(), '\n');
      if (!token.comment && value == "}" && depth) --depth;
      bool close_empty = value == "}" && last == "{";
      bool break_line = !last.empty() && !close_empty &&
        (previous.comment || (last == ";" && !parentheses && !(token.comment && !lines)) ||
         last == "{" || value == "}" || (last == "}" && value != ";" && value != "else" && value != "," && value != ")") || lines);
      if (break_line) newline(lines > 1 && last != "{");
      bool line_start = result.source.empty() || result.source.back() == '\n';
      if (line_start) indent();
      else if (!close_empty) {
        bool tight = value == ";" || value == "," || value == ")" || value == "]" || value == "." || value == ":" || value == "[" ||
          last == "(" || last == "[" || last == "." ||
          (value == "(" && (token.call || gap.empty())) ||
          (value == "*" && token.pointer) ||
          ((previous.prefix || token.postfix) && !previous.comment &&
            !(symbolic_operator(last) && symbolic_operator(value))) ||
          ((last == "*" || last == "&" || last == "-") && previous.unary && !previous.pointer);
        if (!tight || token.comment) text(" ");
      }
      const auto begin = result.source.size(); text(std::string(value));
      result.spans.push_back({begin, result.source.size(), token.start});
      if (!token.comment) {
        if (value == "{") ++depth;
        if (value == "(") ++parentheses;
        if (value == ")" && parentheses) --parentheses;
      }
      previous = token; previous_end = token.end; last = value;
    }
    newline();
  }
};
}
TowerText tower_format(TowerNode* node) {
  Formatter f; f.node(node);
  return std::move(f.result);
}
TowerText tower_format_source(const std::vector<TowerNode*>& roots, std::string_view source,
    const std::vector<TowerCommentSpan>& comments) {
  Formatter f; size_t previous_end = 0; bool previous_declaration = false;
  for (auto* root : roots) {
    auto* match = static_cast<Match*>(tower_node_get_component_userdata(root, parser_match_get_type()));
    assert(match);
    auto start = parser_match_get_start(match), end = start + parser_match_get_length(match);
    auto first = start;
    for (auto comment : comments) if (comment.start >= previous_end && comment.start < first) first = comment.start;
    auto gap = source.substr(previous_end, first - previous_end);
    const bool declaration = f.source_declaration(root);
    f.separate(previous_declaration, declaration);
    if (std::count(gap.begin(), gap.end(), '\n') > 1) f.newline(true);
    auto* grammar = root;
    while (!syntax_get(grammar) && tower_node_get_child_count(grammar) == 1) grammar = tower_node_get_child(grammar, 0);
    if (syntax_get(grammar)) f.grammar(grammar);
    else f.source_statement(root, source, previous_end, end, comments);
    previous_end = end; previous_declaration = declaration;
  }
  for (auto comment : comments) if (comment.start >= previous_end) {
    f.text(std::string(source.substr(comment.start, comment.end - comment.start))); f.newline();
  }
  return std::move(f.result);
}
