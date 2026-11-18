// Transitional bootstrap/reference; production grammar validation runs in Tower.
#include "../compiler-syntax-validation.hpp"
#include "../compiler-syntax-reader.hpp"
#include <algorithm>
#include <map>
#include <set>
#include <string>
#include <vector>
namespace {
using Sequence = TowerNodeRef;
using Alternatives = std::vector<Sequence>;
using Definitions = std::map<std::string, Alternatives>;
using TokenDefinitions = std::vector<TowerNodeRef>;
struct PendingRule { std::string dependency; size_t offset; TowerNode* term; };
using PendingRules = std::map<std::string, PendingRule>;
SyntaxNode& semantic(const TowerNodeRef& node) { return syntax_node(node.get()); }
constexpr auto PARSER_ID_EOF = UINT32_MAX;
uint32_t resolve_token(const TokenDefinitions& tokens,const std::string& name) {
  for(const auto& token:tokens) if(semantic(token).kind!=SyntaxKind::Skip && semantic(token).name==name) return 0;
  return PARSER_ID_EOF;
}
std::string literal_error(const std::string& text) {
  auto status=syntax_literal_check(text.data(),text.size());
  if(status==1) return "Token literal is empty. Expected at least one character between the quotes.";
  return status==2?"Unsupported token literal: "+text:"";
}
std::string validate_declaration_rules(const Definitions& definitions, size_t* error_offset) {
  // Native declaration handlers require these semantic roles regardless of the
  // file that changes the reader. Reject incompatible updates before installing.
  static const std::map<std::string, std::vector<std::string>> required_captures = {
    {"GrammarDeclaration", {"name", "op", "alternatives", "replacement"}},
    {"GrammarTokenDeclaration", {"name", "pattern", "style"}}, {"GrammarSkipDeclaration", {"name", "pattern", "style"}},
    {"GrammarAlternatives", {"sequence"}}, {"GrammarSequence", {"previous", "term"}}, {"GrammarTerm", {"atom", "suffix"}},
    {"GrammarReplacement", {"body"}}, {"GrammarStyle", {"kind"}}, {"GrammarAtom", {}}, {"GrammarAssignment", {}}, {"GrammarSuffix", {}}
  };
  for (const auto& [name, captures] : required_captures) {
    auto found = definitions.find(name);
    if (found == definitions.end()) return "Missing declaration rule: " + name;
    for (const auto& alternative : found->second) {
      if (semantic(alternative).items.empty() && (name == "GrammarSequence" || name == "GrammarReplacement" || name == "GrammarStyle")) continue;
      std::set<std::string> present;
      for (auto* term : semantic(alternative).items) present.insert(syntax_node(term).capture);
      for (const auto& capture : captures) if (!present.contains(capture)) {
        if (error_offset && semantic(alternative).start != TOWER_INVALID_INDEX) *error_offset = semantic(alternative).start;
        return "Declaration rule " + name + " must preserve capture '" + capture + "'";
      }
      if (name == "GrammarAtom" && !present.contains("literal") && !present.contains("reference") && !present.contains("capture") && !present.contains("set"))
        return "GrammarAtom must capture a literal, reference or capture name";
    }
  }
  return {};
}
PendingRules pending_rules(const Definitions& defs, const TokenDefinitions& tokens) {
  std::map<std::string, std::vector<std::pair<std::string, TowerNode*>>> dependents;
  PendingRules pending; std::vector<std::string> queue;
  for (const auto& [name, alternatives] : defs) for (const auto& sequence : alternatives)
    for (auto* entity : semantic(sequence).items) {
      const auto& term = syntax_node(entity);
      if (term.literal || term.terminal_set || resolve_token(tokens, term.text) != PARSER_ID_EOF) continue;
      dependents[term.text].push_back({name, entity});
      if (!defs.contains(term.text) && pending.try_emplace(name, PendingRule{term.text, term.start, entity}).second) queue.push_back(name);
    }
  for (size_t i = 0; i < queue.size(); ++i) {
    auto dependency = queue[i];
    for (const auto& [name, entity] : dependents[dependency])
      if (pending.try_emplace(name, PendingRule{dependency, syntax_node(entity).start, entity}).second) queue.push_back(name);
  }
  return pending;
}
std::string pending_message(const PendingRules& pending, std::string name, size_t* error_offset) {
  std::string message = name;
  while (pending.contains(name)) {
    const auto& missing = pending.at(name);
    if (error_offset && missing.offset != TOWER_INVALID_INDEX) *error_offset = missing.offset;
    name = missing.dependency; message += " -> " + name;
  }
  return message + " (undefined rule '" + name + "')";
}
std::string validate(Definitions& defs, const TokenDefinitions& tokens, size_t* error_offset, PendingRules& pending) {
  std::map<std::string, bool> nullable, productive;
  for (const auto& [name, alternatives] : defs) {
    if (std::any_of(tokens.begin(), tokens.end(), [&](const auto& t) { return semantic(t).name == name; }))
      return "Name already defines a token or skip rule: " + name;
    for (const auto& seq : alternatives) {
      std::set<std::string> captures;
      for (auto* entity : semantic(seq).items) {
        const auto& term = syntax_node(entity);
        if (term.literal) {
          std::string error = literal_error(term.text);
          if (!error.empty()) {
            if (error_offset && term.start != TOWER_INVALID_INDEX) *error_offset = term.start;
            return error;
          }
        }
        if (!term.capture.empty() && !captures.insert(term.capture).second)
          return "Duplicate capture: " + term.capture;
      }
    }
  }
  auto declaration_error = validate_declaration_rules(defs, error_offset);
  if (!declaration_error.empty()) return declaration_error;
  pending = pending_rules(defs, tokens);
  for (const char* root : {"GrammarDeclaration", "GrammarTokenDeclaration", "GrammarSkipDeclaration", "Statement"})
    if (pending.contains(root)) return "Cannot activate incomplete grammar: " + pending_message(pending, root, error_offset);
  // Keep the declarations as shared semantic nodes. Only the derived executable
  // table excludes incomplete, unreachable definitions until their names resolve.
  for (const auto& [name, dependency] : pending) defs.erase(name);
  bool changed;
  do {
    changed = false;
    for (const auto& [name, alternatives] : defs) {
      for (const auto& seq : alternatives) {
        bool n = true, p = true;
        for (auto* entity : semantic(seq).items) {
          const auto& term = syntax_node(entity);
          bool optional = term.repetition == '*' || term.repetition == '?';
          n &= optional || (!term.literal && !term.terminal_set && nullable[term.text]);
          p &= optional || term.literal || resolve_token(tokens, term.text) != PARSER_ID_EOF || term.terminal_set || productive[term.text];
        }
        if (n && !nullable[name]) { nullable[name] = true; changed = true; }
        if (p && !productive[name]) { productive[name] = true; changed = true; }
      }
    }
  } while (changed);
  if (nullable["Statement"]) return "Statement must consume input";
  for (const auto& [name, alternatives] : defs) {
    if (!productive[name]) return "Unproductive grammar rule: " + name;
    for (const auto& seq : alternatives)
      for (auto* entity : semantic(seq).items) {
        const auto& term = syntax_node(entity);
        if ((term.repetition == '*' || term.repetition == '+') && !term.literal && nullable[term.text])
          return "Cannot repeat nullable rule: " + term.text;
      }
  }
  return {};
}

}
extern "C" bool syntax_validate(const SyntaxRuleView* rules,size_t count,TowerNode* const* tokens,size_t token_count,
  TowerNode*,TowerByteBuffer* error,size_t* offset,TowerNode** output) {
  Definitions definitions; TokenDefinitions terminals; PendingRules pending;
  for(size_t i=0;i<count;++i) {
    auto& list=definitions[std::string(rules[i].name,rules[i].name_length)];
    for(size_t j=0;j<rules[i].count;++j) list.emplace_back(rules[i].alternatives[j]);
    output[i]=nullptr;
  }
  for(size_t i=0;i<token_count;++i) terminals.emplace_back(tokens[i]);
  auto message=validate(definitions,terminals,offset,pending);
  for(size_t i=0;i<count;++i) {
    auto found=pending.find(std::string(rules[i].name,rules[i].name_length));
    if(found!=pending.end()) output[i]=found->second.term;
  }
  if(message.empty()) return true;
  bytes_assign_text(error,reinterpret_cast<const uint8_t*>(message.data()),message.size());
  return false;
}
