#include "syntax.hpp"
#include "lex-pattern.hpp"
#include "syntax-nodes.hpp"
#include "format.hpp"
#include <algorithm>
#include <cassert>
#include <cstring>
#include <map>
#include <memory>
#include <set>
#include <string>
#include <vector>
#include <unordered_set>

namespace {
bool diagnostic_peek(void*, size_t&, ParserDiagnosticAccepts, void*, uint32_t&);
constexpr uint32_t MetaName = 0x110000, MetaString = MetaName + 1, FirstHole = 0x300000;
constexpr uint32_t FirstToken = 0x120000, FirstLiteral = 0x200000;

using Node = std::unique_ptr<TowerNode, decltype(&tower_node_release_ref)>;
Node owned(TowerNode* node) { return Node(node, tower_node_release_ref); }

using Term = TowerNodeRef;
using Sequence = TowerNodeRef;
using Alternatives = std::vector<Sequence>;
using Definitions = std::map<std::string, Alternatives>;
using TokenDefinitions = std::vector<TowerNodeRef>;
struct PendingRule { std::string dependency; size_t offset = TOWER_INVALID_INDEX; };
using PendingRules = std::map<std::string, PendingRule>;
SyntaxNode& semantic(const TowerNodeRef& node) { return syntax_node(node.get()); }
bool same(const std::vector<TowerNodeRef>& a, const std::vector<TowerNodeRef>& b) {
  if (a.size() != b.size()) return false;
  for (size_t i = 0; i < a.size(); ++i) if (!syntax_equal(a[i].get(), b[i].get(), true)) return false;
  return true;
}
bool same(const Definitions& a, const Definitions& b) {
  if (a.size() != b.size()) return false;
  auto right = b.begin();
  for (const auto& [name, alternatives] : a) {
    if (name != right->first || !same(alternatives, right->second)) return false;
    ++right;
  }
  return true;
}
std::shared_ptr<const TokenDefinitions> bootstrap;
std::shared_ptr<const Definitions> foundation_definitions;
struct Bedrock {
  TowerNodeRef document;
  Definitions definitions;
  TokenDefinitions tokens;
};
std::shared_ptr<const Bedrock> installed_bedrock;
std::shared_ptr<const Bedrock> native_bedrock() {
  static const auto value = [] {
    auto result = std::make_shared<Bedrock>(); result->document = TowerNodeRef(syntax_native_bedrock());
    for (auto* entity : semantic(result->document).items) {
      const auto& node = syntax_node(entity);
      if (node.kind == SyntaxKind::Rule) {
        auto& alternatives = result->definitions[node.name];
        for (auto* alternative : node.items) alternatives.emplace_back(alternative);
      } else result->tokens.emplace_back(entity);
    }
    return result;
  }();
  return value;
}
std::shared_ptr<const Bedrock> current_bedrock() { return installed_bedrock ? installed_bedrock : native_bedrock(); }
TowerNode* origin_type = tower_node_create();
SyntaxOrigin* origin(TowerNode* node) {
  auto* existing = (SyntaxOrigin*)tower_node_get_component_userdata(node, origin_type);
  if (existing) return existing;
  auto* component = tower_component_create(node, origin_type, sizeof(SyntaxOrigin),
    [](TowerComponent*, void* data) { ((SyntaxOrigin*)data)->~SyntaxOrigin(); });
  return new (tower_component_get_userdata(component)) SyntaxOrigin();
}

using ProductionKey = std::pair<std::string, size_t>;
struct Replacement {
  std::string rule, category;
  size_t start = 0, end = 0;
  size_t error_offset = 0;
  Node tree = owned(nullptr);
  std::map<std::string, Term> captures;
  std::map<std::string, size_t> uses;
};

struct Version {
  Definitions definitions; // references to shared source entities, for diagnostics
  Node rules = owned(tower_node_create());
  Table* table = nullptr;
  std::map<std::string, uint32_t> literals;
  std::map<uint32_t, std::string> names;
  TokenDefinitions tokens;
  PendingRules pending;
  std::shared_ptr<const Bedrock> bedrock;
  std::set<std::string> used_names;
  std::map<std::string, std::string> template_tokens;
  std::map<std::string, TowerNode*> capture_sources;
  std::map<TowerNode*, std::string> capture_names;
  std::map<std::string, uint32_t> declaration_literals;
  std::set<std::string> declaration_starts;
  std::map<size_t, ProductionKey> productions;
  std::map<ProductionKey, size_t> indices;
  std::map<std::string, size_t> named_indices;
  std::map<std::string, Term> repetitions;
  std::map<size_t, Replacement> replacements;
  bool templating = false;
  size_t replacement_error_offset = TOWER_INVALID_INDEX;
  size_t helper = 0;
  ~Version() { parser_table_destroy(table); }
};

bool letter(char c) { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_'; }
bool digit(char c) { return c >= '0' && c <= '9'; }
bool space(char c) { return c == ' ' || c == '\n' || c == '\r' || c == '\t'; }
bool word(const std::string& s) {
  return !s.empty() && letter(s[0]) && std::all_of(s.begin(), s.end(), [](char c) { return letter(c) || digit(c); });
}

char* copy_string(const std::string& text) {
  auto* result = (char*)tower_memory_allocate(text.size() + 1);
  memcpy(result, text.c_str(), text.size() + 1);
  return result;
}

std::string source_location(const SyntaxNode& node) {
  if (!node.source || node.start == TOWER_INVALID_INDEX) return "native seed";
  size_t line = 1, column = 1;
  for (size_t i = 0; i < std::min(node.start, node.source->text.size()); ++i) {
    const auto c = static_cast<unsigned char>(node.source->text[i]);
    if (c == '\n') { ++line; column = 1; }
    else if ((c & 0xc0) != 0x80) ++column;
  }
  return node.source->name + ", line " + std::to_string(line) + ", column " + std::to_string(column);
}
std::string describe_production(const Version& version, const Definitions& definitions, size_t index, bool name_only = false) {
  auto found = version.productions.find(index);
  if (found == version.productions.end()) return {};
  const auto& [name, alternative] = found->second;
  auto rule = definitions.find(name);
  if (rule == definitions.end() || alternative >= rule->second.size()) return {};
  if (name_only) return name + " (" + source_location(semantic(rule->second.front())) + ")";
  const auto& sequence = semantic(rule->second[alternative]);
  std::string spelling;
  for (auto* term : sequence.items) {
    if (!spelling.empty()) spelling += ' ';
    spelling += tower_format(term).source;
    if (spelling.size() > 120) {
      size_t end = 120;
      while ((static_cast<unsigned char>(spelling[end]) & 0xc0) == 0x80) --end;
      spelling.resize(end); spelling += " ..."; break;
    }
  }
  return name + " = " + (spelling.empty() ? "<empty>" : spelling) + " (" + source_location(sequence) + ")";
}
std::string describe_rule(void* context, size_t index) {
  const auto& v = *static_cast<Version*>(context);
  // Generated repetition/capture rules refer back to the user's term.
  auto text = describe_production(v, v.definitions, index);
  if (!text.empty()) return text;
  auto* node = index ? tower_node_get_child(v.rules.get(), index - 1) : nullptr;
  if (!node) return "start of input";
  auto* rule = static_cast<Rule*>(tower_node_get_component_userdata(node, parser_rule_get_type()));
  std::string name = parser_rule_get_name(rule);
  for (const auto& [key, entity] : v.repetitions) if (key == name)
    return "repetition " + tower_format(entity.get()).source + " (" + source_location(semantic(entity)) + ")";
  for (const auto& [key, entity] : v.capture_sources) if (key == name)
    return "capture " + tower_format(entity).source + " (" + source_location(syntax_node(entity)) + ")";
  return "start of a statement or grammar declaration";
}

std::string quoted(const std::string& source, size_t& cursor, std::string& result) {
  char quote = source[cursor++];
  while (cursor < source.size()) {
    char c = source[cursor++];
    if (c == quote) return {};
    if (c == '\n' || c == '\r') return "Newline in quoted literal";
    if (c == '\\') {
      if (cursor == source.size()) break;
      c = source[cursor++];
      switch (c) {
        case 'n': c = '\n'; break;
        case 'r': c = '\r'; break;
        case 't': c = '\t'; break;
        case '\\': case '\'': case '"': break;
        default: return "Unsupported literal escape";
      }
    }
    result += c;
  }
  return "Unterminated quoted literal";
}

std::string literal_error(const std::string& text) {
  if (text.empty()) return "Token literal is empty. Expected at least one character between the quotes.";
  // Keep lexical categories deterministic. Words become keywords; punctuation
  // uses longest match. Mixed word/punctuation literals need an explicit lexer rule.
  if (text.find('\0') != std::string::npos ||
      std::any_of(text.begin(), text.end(), space) || text.find_first_of("\"'") != std::string::npos ||
      (std::any_of(text.begin(), text.end(), [](char c) { return letter(c) || digit(c); }) && !word(text)) ||
      text.starts_with("//") || text.starts_with("/*"))
    return "Unsupported token literal: " + text;
  return {};
}

void add_literal(Version& version, const std::string& text) {
  if (version.literals.contains(text)) return;
  uint32_t id = FirstLiteral + (uint32_t)version.literals.size();
  version.literals.emplace(text, id);
  version.names.emplace(id, "'" + text + "'");
}

uint32_t token_id(const std::string& name, size_t index) {
  if (name == "Identifier") return MetaName;
  if (name == "String") return MetaString;
  return FirstToken + (uint32_t)index;
}
uint32_t resolve_token(const TokenDefinitions& tokens, const std::string& name) {
  for (size_t i = 0; i < tokens.size(); ++i)
    if (semantic(tokens[i]).kind != SyntaxKind::Skip && semantic(tokens[i]).name == name) return token_id(name, i);
  return PARSER_ID_EOF;
}
uint32_t resolve(void* context, const char* name) {
  return resolve_token(((Version*)context)->tokens, name);
}

// Generated table symbols cannot collide with any source-defined name. No
// spelling or prefix is reserved for users; these are derived parser helpers.
std::string helper_name(Version& version, const std::string& kind) {
  std::string name;
  do { name = kind + "(" + std::to_string(version.helper++) + ")"; }
  while (!version.used_names.insert(name).second);
  return name;
}
std::string template_token(Version& version, const std::string& name) {
  auto [it, added] = version.template_tokens.try_emplace(name);
  if (added) it->second = helper_name(version, "token " + name);
  return it->second;
}

char* token_name(void* context, uint32_t id) {
  auto& version = *(Version*)context;
  auto found = version.names.find(id);
  return found == version.names.end() ? nullptr : copy_string(found->second);
}

TowerNode* production(Version& version, const std::string& name, bool generated = false) {
  auto* result = parser_rule_create_subtree(version.rules.get(), name.c_str(), generated);
  version.named_indices.try_emplace(name, tower_node_get_child_count(version.rules.get()));
  return result;
}

void reference(TowerNode* rule, const std::string& name, const std::string& capture = {}) {
  auto* node = parser_reference_create_subtree(rule, name.c_str());
  auto* ref = (Reference*)tower_node_get_component_userdata(node, parser_reference_get_type());
  parser_reference_set_capture(ref, capture.c_str());
}

void literal(Version& version, TowerNode* rule, const std::string& text) {
  add_literal(version, text);
  auto* node = tower_node_create();
  tower_node_attach(node, rule);
  auto* value = parser_string_create(node);
  parser_string_set_id(value, 0, version.literals.at(text));
  tower_node_release_ref(node);
}

std::string emit_token_set(Version& version, const SyntaxNode& term) {
  std::set<std::string> excluded;
  for (auto* item : term.items) excluded.insert(syntax_node(item).text);
  std::set<uint32_t> ids;
  for (size_t i = 0; i < version.tokens.size(); ++i) {
    const auto& token = semantic(version.tokens[i]);
    if (token.kind != SyntaxKind::Skip && !token.contextual) ids.insert(token_id(token.name, i));
  }
  for (const auto& [name, id] : version.literals) if (!excluded.contains(name)) ids.insert(id);
  auto helper = helper_name(version, "token set");
  // Singleton terminals share the existing ACTION table, including lookaheads
  // already named by other productions. No runtime token-set search is needed.
  for (uint32_t id : ids) parser_range_create_subtree(production(version, helper, true), id, id);
  return helper;
}

void atom(Version& version, TowerNode* rule, TowerNode* entity) {
  const auto& term = syntax_node(entity);
  if (term.terminal_set) reference(rule, emit_token_set(version, term), term.capture);
  else if (term.literal) literal(version, rule, term.text);
  else reference(rule, version.templating && resolve_token(version.tokens, term.text) != PARSER_ID_EOF
    ? template_token(version, term.text) : term.text);
}

void emit(Version& version, const std::string& name, const Sequence& sequence, size_t alternative) {
  auto* rule = production(version, name);
  size_t index = tower_node_get_child_count(version.rules.get());
  version.productions[index] = {name, alternative};
  version.indices[{name, alternative}] = index;
  for (auto* entity : semantic(sequence).items) {
    const auto& term = syntax_node(entity);
    if (!term.repetition) {
      if (term.terminal_set) reference(rule, emit_token_set(version, term), term.capture);
      else if (term.literal) literal(version, rule, term.text);
      else reference(rule, version.templating && resolve_token(version.tokens, term.text) != PARSER_ID_EOF
        ? template_token(version, term.text) : term.text, term.capture);
      continue;
    }
    std::string list = helper_name(version, "repeat");
    version.repetitions[list] = TowerNodeRef(entity);
    if (term.repetition != '+') production(version, list, true);
    else atom(version, production(version, list, true), entity);
    auto* repeated = production(version, list, true);
    if (term.repetition != '?') reference(repeated, list);
    atom(version, repeated, entity);
    if (!term.capture.empty()) {
      // Capture the entire repetition under one named node, including zero items.
      std::string capture = helper_name(version, "capture");
      version.capture_sources[capture] = entity;
      version.capture_names[entity] = capture;
      reference(production(version, capture), list);
      reference(rule, capture, term.capture);
    } else reference(rule, list);
  }
}

// Seed and loaded bedrock share the exact same grammar entities and emission.
void seed(Version& v, const Definitions& definitions) {
  for (const auto& [name, alternatives] : definitions)
    for (const auto& alternative : alternatives) for (auto* entity : semantic(alternative).items) {
      const auto& term = syntax_node(entity);
      if (term.literal) add_literal(v, term.text);
      if (term.terminal_set) for (auto* item : term.items) add_literal(v, syntax_node(item).text);
    }
  auto top = helper_name(v, "document");
  auto* r = production(v, top); reference(r, "GrammarDeclaration");
  reference(production(v, top), "GrammarTokenDeclaration");
  reference(production(v, top), "GrammarSkipDeclaration");
  if (definitions.contains("Statement")) reference(production(v, top), "Statement");
  for (const auto& [name, alternatives] : definitions)
    for (size_t i = 0; i < alternatives.size(); ++i) emit(v, name, alternatives[i], i);
  std::set<std::string> visited;
  std::vector<std::string> pending{"GrammarDeclaration", "GrammarTokenDeclaration", "GrammarSkipDeclaration"};
  while (!pending.empty()) {
    auto name = std::move(pending.back()); pending.pop_back();
    if (!visited.insert(name).second || !definitions.contains(name)) continue;
    for (const auto& alternative : definitions.at(name)) for (auto* entity : semantic(alternative).items) {
      const auto& term = syntax_node(entity);
      if (term.literal) v.declaration_literals.emplace(term.text, v.literals.at(term.text));
      else pending.push_back(term.text);
    }
  }
  // Declarations are intent-first. Compute their leading literal keywords from
  // bedrock, so renaming parse/token/skip changes the downstream reader.
  std::map<std::string, std::set<std::string>> first;
  std::map<std::string, bool> nullable;
  bool changed;
  do {
    changed = false;
    for (const auto& [name, alternatives] : definitions) for (const auto& alternative : alternatives) {
      bool empty = true;
      for (auto* entity : semantic(alternative).items) {
        const auto& term = syntax_node(entity);
        if (term.literal) changed |= first[name].insert(term.text).second;
        else if (!definitions.contains(term.text)) changed |= first[name].insert("\1" + term.text).second;
        else for (const auto& literal : first[term.text]) changed |= first[name].insert(literal).second;
        if (term.repetition != '*' && term.repetition != '?' && (term.literal || !nullable[term.text])) { empty = false; break; }
      }
      if (empty && !nullable[name]) { nullable[name] = true; changed = true; }
    }
  } while (changed);
  for (const auto* name : {"GrammarDeclaration", "GrammarTokenDeclaration", "GrammarSkipDeclaration"})
    v.declaration_starts.insert(first[name].begin(), first[name].end());
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
  std::map<std::string, std::vector<std::pair<std::string, size_t>>> dependents;
  PendingRules pending; std::vector<std::string> queue;
  for (const auto& [name, alternatives] : defs) for (const auto& sequence : alternatives)
    for (auto* entity : semantic(sequence).items) {
      const auto& term = syntax_node(entity);
      if (term.literal || term.terminal_set || resolve_token(tokens, term.text) != PARSER_ID_EOF) continue;
      dependents[term.text].push_back({name, term.start});
      if (!defs.contains(term.text) && pending.try_emplace(name, PendingRule{term.text, term.start}).second) queue.push_back(name);
    }
  for (size_t i = 0; i < queue.size(); ++i) {
    auto dependency = queue[i];
    for (const auto& [name, offset] : dependents[dependency])
      if (pending.try_emplace(name, PendingRule{dependency, offset}).second) queue.push_back(name);
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

bool prepare_replacements(Version& version, const Definitions& defs, std::string& message);
std::unique_ptr<Version> build(const Definitions& defs, const TokenDefinitions& tokens,
    std::shared_ptr<const Bedrock> bedrock, std::string& message, size_t* error_offset) {
  // Import by reference: both readers and downstream grammars use the original
  // semantic entities until a local declaration replaces or extends a binding.
  auto definitions = bedrock->definitions;
  for (const auto& [name, alternatives] : defs) definitions[name] = alternatives;
  auto effective_tokens = bedrock->tokens;
  for (const auto& entity : tokens) {
    auto found = std::find_if(effective_tokens.begin(), effective_tokens.end(), [&](const auto& old) { return semantic(old).name == semantic(entity).name; });
    if (found == effective_tokens.end()) effective_tokens.push_back(entity); else *found = entity;
  }
  PendingRules pending;
  message = validate(definitions, effective_tokens, error_offset, pending);
  if (!message.empty()) return nullptr;
  auto v = std::make_unique<Version>();
  v->definitions = definitions;
  v->pending = std::move(pending);
  v->tokens = std::move(effective_tokens);
  v->bedrock = std::move(bedrock);
  v->names = {{MetaName, "declaration name"}, {MetaString, "quoted grammar literal"}};
  for (const auto& token : v->tokens) {
    const auto& value = semantic(token); v->used_names.insert(value.name);
    if (value.kind != SyntaxKind::Skip) v->names[resolve_token(v->tokens, value.name)] = value.name;
  }
  for (const auto& [name, alternatives] : definitions) v->used_names.insert(name);
  for (const auto& [name, dependency] : v->pending) v->used_names.insert(name);
  seed(*v, definitions);
  char* error = nullptr;
  v->table = parser_table_create(v->rules.get(), v.get(), resolve, token_name, &error, ParserTableMode::Constructs, describe_rule);
  if (!v->table) {
    message = error ? error : "Unable to build grammar";
    tower_memory_free(error);
    return nullptr;
  }
  if (!prepare_replacements(*v, definitions, message)) {
    if (error_offset && v->replacement_error_offset != TOWER_INVALID_INDEX) *error_offset = v->replacement_error_offset;
    return nullptr;
  }
  return v;
}

Match* match(TowerNode* node) {
  return (Match*)tower_node_get_component_userdata(node, parser_match_get_type());
}
TowerNode* child(TowerNode* node, size_t i) { return tower_node_get_child(node, i); }
std::string text(TowerNode* node, const std::string& source) {
  auto* m = match(node);
  return source.substr(parser_match_get_start(m), parser_match_get_length(m));
}

TowerNode* member(TowerNode* node, const char* name) { return node ? tower_node_get_child_member(node, name) : nullptr; }
TowerNode* required(TowerNode* node, const char* name, std::string& error) {
  auto* value = member(node, name);
  if (!value && error.empty()) error = "Malformed bedrock tree: missing capture '" + std::string(name) + "'";
  return value;
}
void location(SyntaxNode& value, TowerNode* node) {
  value.start = parser_match_get_start(match(node)); value.end = value.start + parser_match_get_length(match(node));
}
TowerNode* read_term(TowerNode* node, const std::string& source, std::string& error) {
  auto& term = syntax_attach(node, SyntaxKind::Term); location(term, node);
  auto* atom = required(node, "atom", error); auto* suffix = required(node, "suffix", error);
  if (!error.empty()) return node;
  auto* literal = member(atom, "literal"); auto* ref = member(atom, "reference"); auto* capture = member(atom, "capture");
  if (auto* set = member(atom, "set")) {
    term.terminal_set = true;
    while (set && tower_node_get_child_count(set) && error.empty()) {
      auto* item = required(set, "literal", error); if (!item) break;
      auto& exclusion = syntax_attach(item, SyntaxKind::Term); location(exclusion, item); exclusion.literal = true;
      size_t start = parser_match_get_start(match(item)); error = quoted(source, start, exclusion.text);
      if (error.empty()) error = literal_error(exclusion.text);
      term.items.push_back(item); set = member(set, "previous");
    }
    std::reverse(term.items.begin(), term.items.end());
  } else if (literal) {
    term.literal = true; size_t start = parser_match_get_start(match(literal));
    error = quoted(source, start, term.text);
  } else if (ref || capture) {
    term.text = tower_identifier_value(text(ref ? ref : capture, source));
    if (capture) term.capture = tower_identifier_value(text(capture, source));
  } else error = "Malformed bedrock atom: expected literal, reference or capture";
  const auto repetition = text(suffix, source);
  if (!repetition.empty()) {
    if (repetition != "*" && repetition != "+" && repetition != "?") error = "Unknown grammar repetition: " + repetition;
    else term.repetition = repetition[0];
  }
  return node;
}
Sequence read_sequence(TowerNode* node, const std::string& source, std::string& error) {
  Sequence result(node); auto& sequence = syntax_attach(node, SyntaxKind::Alternative); location(sequence, node);
  while (tower_node_get_child_count(node) && error.empty()) {
    auto* term = required(node, "term", error); auto* previous = required(node, "previous", error);
    if (!error.empty()) break;
    sequence.items.push_back(read_term(term, source, error)); node = previous;
  }
  std::reverse(sequence.items.begin(), sequence.items.end()); return result;
}
Alternatives read_alternatives(TowerNode* node, const std::string& source, std::string& error) {
  Alternatives result;
  while (node && error.empty()) {
    auto* sequence = required(node, "sequence", error); if (!sequence) break;
    result.push_back(read_sequence(sequence, source, error)); node = member(node, "previous");
  }
  std::reverse(result.begin(), result.end()); return result;
}

}

struct SyntaxSession {
  std::string source;
  std::shared_ptr<const SyntaxSource> source_info;
  size_t cursor = 0;
  size_t revision = 0;
  Definitions definitions, baseline_definitions;
  TokenDefinitions tokens, baseline;
  Recognizer* recognizer = nullptr; // borrowed only while reading this stream
  bool bootstrapping = false, declaration = false;
  bool building_bedrock = false, finalized = false, declarations_only = true;
  bool formatting = false;
  size_t comment_cursor = 0;
  std::shared_ptr<const Bedrock> bedrock;
  std::shared_ptr<Version> version;
  struct CachedVersion { Definitions definitions; TokenDefinitions tokens; std::shared_ptr<Version> version; };
  std::vector<CachedVersion> cache;
  size_t builds = 0, hits = 0;
  SyntaxExpansionStats expansion_stats;
  std::string error;
  size_t error_offset = 0;
  bool error_insertion = false;
  std::vector<SyntaxHighlight> highlights;
  TowerNodeRef document;
};

namespace {
void record_source(TowerNode* entity, const std::shared_ptr<const SyntaxSource>& source) {
  auto& value = syntax_node(entity); value.source = source;
  for (auto* item : value.items) record_source(item, source);
}
std::string syntax_diagnostic(SyntaxSession& session, Recognizer* recognizer, bool repairs = true) {
  const auto diagnostic = parser_recognizer_diagnostic(recognizer, repairs ? diagnostic_peek : nullptr, &session);
  if (diagnostic.expected.empty()) return parser_recognizer_get_error(recognizer);
  auto definitions = session.bedrock->definitions;
  for (const auto& [name, alternatives] : session.definitions) definitions[name] = alternatives;
  const auto& expected = diagnostic.expected;
  std::string actual = "end of input";
  if (diagnostic.offset < session.source.size()) {
    size_t end = std::min(session.cursor, diagnostic.offset + 48);
    while (end < session.source.size() && (static_cast<unsigned char>(session.source[end]) & 0xc0) == 0x80) --end;
    actual = "'";
    for (size_t i = diagnostic.offset; i < end; ++i) {
      const char c = session.source[i];
      if (c == '\n') actual += "\\n";
      else if (c == '\r') actual += "\\r";
      else if (c == '\t') actual += "\\t";
      else { if (c == '\\' || c == '\'') actual += '\\'; actual += c; }
    }
    if (end < session.cursor) actual += "...";
    actual += "'";
  }
  const ParserExpectation* repair = nullptr; size_t repair_count = 0;
  const ParserExpectation* boundary = nullptr; size_t boundary_count = 0;
  for (const auto& option : expected) {
    // Try every expected grammar literal, including user-defined keywords.
    // Token patterns have no unique spelling: never invent names or values.
    auto literal = std::find_if(session.version->literals.begin(), session.version->literals.end(),
      [&](const auto& value) { return value.second == option.id; });
    if (option.insertion && literal != session.version->literals.end()) {
      ++repair_count; repair = &option;
      if (option.completes) { ++boundary_count; boundary = &option; }
    }
  }
  bool suggested = false;
  if (repair_count != 1) {
    repair = nullptr;
    // A line break can suggest a new construct when multiple insertions are
    // valid. Prefer a unique grammar-completing choice, but label it as a hint:
    // continuing the expression on the next line may also be intentional.
    const auto gap = session.source.substr(std::min(diagnostic.insertion_offset, session.source.size()),
      diagnostic.offset >= diagnostic.insertion_offset ? diagnostic.offset - diagnostic.insertion_offset : 0);
    if (boundary_count == 1 && gap.find_first_of("\r\n") != std::string::npos) { repair = boundary; suggested = true; }
  }
  if (!repairs || !diagnostic.complete) repair = nullptr;
  std::string message;
  if (repair) {
    message = std::string(suggested ? "Possible missing " : "Missing ") + repair->label + " before " + actual + ".";
    session.error_offset = diagnostic.insertion_offset;
    session.error_insertion = true;
  } else {
    const std::string original = parser_recognizer_get_error(recognizer);
    message = original.starts_with("Unexpected ") ? "Unexpected " + actual + "." : original + ".";
    // A new top-level parse has not entered any statement. Listing arbitrary
    // leaf rules here (e.g. CoreCall) falsely suggests that the user began one.
    // Template parsers have a different root and keep their checked expectations.
    if (repairs && diagnostic.at_start) {
      message += definitions.contains("Statement") ? " Expected a statement or grammar declaration." : " Expected a grammar declaration.";
      return message;
    }
    message += diagnostic.complete ? " Expected " : " Expected a valid continuation such as ";
    for (size_t i = 0; i < std::min(expected.size(), size_t(6)); ++i) {
      if (i) message += i + 1 == expected.size() ? " or " : ", ";
      message += expected[i].label;
    }
    if (expected.size() > 6) message += ", among other valid continuations";
    message += ".";
  }
  std::set<size_t> seen;
  std::map<std::string, std::vector<size_t>> contexts;
  for (const auto& option : expected) {
    if (repair && &option != repair) continue;
    for (const auto& position : option.contexts) {
      if (!seen.insert(position.production).second) continue;
      auto found = session.version->productions.find(position.production);
      if (found != session.version->productions.end()) contexts[found->second.first].push_back(position.production);
    }
  }
  // A unique active rule is useful provenance. Multiple possible rules are not
  // proof that any particular one was intended; don't pick arbitrary examples.
  if (contexts.size() == 1) {
    const auto& alternatives = contexts.begin()->second;
    auto description = describe_production(*session.version, definitions, alternatives.front(), alternatives.size() > 1);
    if (!description.empty()) message += "\nIn rule " + description + ".";
  }
  return message;
}

std::shared_ptr<Version> compiled(SyntaxSession& session, const Definitions& definitions, const TokenDefinitions& tokens, std::string& error) {
  // The complete structural grammar is the key, including literals, captures,
  // alternatives and repetition. Source positions and the numeric revision are
  // deliberately absent. Only successful immutable tables enter this cache.
  for (size_t i = 0; i < session.cache.size(); ++i) {
    if (!same(session.cache[i].definitions, definitions) || !same(session.cache[i].tokens, tokens)) continue;
    auto hit = std::move(session.cache[i]);
    session.cache.erase(session.cache.begin() + i);
    session.cache.push_back(std::move(hit));
    ++session.hits; error.clear();
    return session.cache.back().version;
  }
  ++session.builds;
  std::shared_ptr<Version> version = build(definitions, tokens, session.bedrock, error, &session.error_offset);
  if (version) {
    session.cache.push_back({definitions, tokens, version});
    if (session.cache.size() > SYNTAX_MAX_CACHED_GRAMMARS) session.cache.erase(session.cache.begin());
  }
  return version;
}

std::string skip_meta(SyntaxSession& session, size_t& pos, std::vector<SyntaxHighlight>& highlights) {
  while (pos < session.source.size()) {
    const SyntaxNode* chosen = nullptr; size_t length = 0;
    for (const auto& entity : session.version->tokens) {
      const auto& token = semantic(entity);
      if (token.kind != SyntaxKind::Skip) continue;
      const auto count = token.compiled->match(session.source, pos);
      if (count > length) { chosen = &token; length = count; }
    }
    if (!chosen) break;
    if (!chosen->style.empty()) highlights.push_back({pos, pos + length, session.revision, chosen->style});
    pos += length;
  }
  return {};
}

struct Choice { size_t length = 0; uint32_t id = PARSER_ID_EOF; std::string kind; bool skip = false; };
Choice choose(const SyntaxSession& session, size_t pos, ParserDiagnosticAccepts accept = nullptr, void* context = nullptr) {
  Choice choice;
  const auto accepts = [&](uint32_t id) { return accept ? accept(context, id) : parser_recognizer_accepts(session.recognizer, id); };
  for (size_t i = 0; i < session.version->tokens.size(); ++i) {
    const auto& token = semantic(session.version->tokens[i]);
    if (token.contextual && !accepts(token_id(token.name, i))) continue;
    size_t length = token.compiled->match(session.source, pos);
    // Longest match, then declaration order. Replacements retain their slot.
    if (length > choice.length || (length && length == choice.length && token.contextual && !accepts(choice.id)))
      choice = {length, token_id(token.name, i), token.style, token.kind == SyntaxKind::Skip};
  }
  // Grammar literals beat token patterns on equal length. A longer identifier
  // still beats a keyword prefix, including custom Unicode identifier rules.
  for (const auto& [literal, id] : session.version->literals)
    if ((!session.declaration || session.version->declaration_literals.contains(literal) || accepts(id)) && (literal.size() >= choice.length && session.source.compare(pos, literal.size(), literal) == 0))
      choice = {literal.size(), id, word(literal) ? "keyword" : "operator", false};
  return choice;
}
bool diagnostic_peek(void* context, size_t& pos, ParserDiagnosticAccepts accepts, void* stack, uint32_t& id) {
  const auto& session = *static_cast<SyntaxSession*>(context);
  // The same lexer and candidate's parser state determine contextual tokens.
  // Only a local cursor changes; no highlights, declarations or trees are made.
  // Cap skipped tokens as well as parser actions on this error-only path.
  for (size_t count = 0; count < 32; ++count) {
    if (pos == session.source.size()) { id = PARSER_ID_EOF; return true; }
    auto choice = choose(session, pos, accepts, stack);
    if (!choice.length) return false;
    pos += choice.length;
    if (!choice.skip) { id = choice.id; return true; }
  }
  return false;
}

size_t capture_name_length(const SyntaxSession& session, size_t pos) {
  const auto& tokens = session.version->tokens;
  for (const auto& entity : tokens) if (semantic(entity).name == "Identifier")
    return semantic(entity).compiled->match(session.source, pos);
  return 0;
}

bool declaration_at(const SyntaxSession& session, size_t pos) {
  const auto& source = session.source;
  for (const auto& keyword : session.version->declaration_starts) {
    if (source.compare(pos, keyword.size(), keyword) != 0) continue;
    bool prefix = false;
    for (const auto& entity : session.version->tokens) {
      const auto& token = semantic(entity);
      if (token.kind != SyntaxKind::Skip && !token.contextual && token.compiled->match(source, pos) > keyword.size()) { prefix = true; break; }
    }
    if (!prefix) return true;
  }
  return false;
}
std::string skip_source(SyntaxSession& session, size_t& pos, std::vector<SyntaxHighlight>& highlights) {
  if (session.bootstrapping || session.declaration) return skip_meta(session, pos, highlights);
  while (pos < session.source.size() && !declaration_at(session, pos)) {
    auto choice = choose(session, pos);
    if (!choice.length || !choice.skip) break;
    if (!choice.kind.empty()) highlights.push_back({pos, pos + choice.length, session.revision, choice.kind});
    pos += choice.length;
  }
  return {};
}
std::string scan(SyntaxSession& session, size_t& pos, std::vector<SyntaxHighlight>& highlights,
    uint32_t& id, size_t& start, size_t& length) {
  id = PARSER_ID_EOF; length = 0; start = pos;
  std::string error = skip_source(session, pos, highlights);
  if (!error.empty()) { start = highlights.back().start; return error; }
  start = pos;
  if (pos == session.source.size()) return {};
  auto choice = choose(session, pos);
  if (!choice.length) {
    uint32_t value; choice.length = lex_codepoint(session.source, pos, value);
    if (!choice.length) choice.length = 1;
    choice.kind = "invalid"; error = "No token rule matches source";
  }
  pos += choice.length; length = choice.length; id = choice.id;
  if (!choice.kind.empty()) highlights.push_back({start, pos, session.revision, choice.kind});
  return error;
}

TowerNode* lex(Stream* stream, void* userdata, uint32_t* id, size_t* start, size_t* length) {
  auto& session = **(SyntaxSession**)userdata;
  std::string error = scan(session, session.cursor, session.highlights, *id, *start, *length);
  session.error_offset = *start;
  if (!error.empty()) {
    parser_stream_set_error(stream, error.c_str());
    *id = PARSER_ID_EOF;
    return nullptr;
  }
  if (*id == PARSER_ID_EOF) return nullptr;
  auto* node = tower_node_create();
  auto* m = parser_match_create(node);
  parser_match_set_id(m, *id);
  parser_match_set_start(m, *start);
  parser_match_set_length(m, *length);
  std::string label = session.source.substr(*start, *length);
  parser_match_set_label(m, label.c_str());
  return node;
}

struct TemplateInput {
  SyntaxSession session;
  std::map<std::string, uint32_t> holes;
  size_t base = 0;
};

TowerNode* template_lex(Stream* stream, void* userdata, uint32_t* id, size_t* start, size_t* length) {
  auto& input = **(TemplateInput**)userdata;
  auto& s = input.session;
  skip_source(s, s.cursor, s.highlights);
  *start = s.cursor; *length = 0;
  s.error_offset = *start;
  TowerNode* result = nullptr;
  if (s.cursor < s.source.size() && s.source[s.cursor] == '$') {
    ++s.cursor;
    size_t begin = s.cursor;
    s.cursor += capture_name_length(s, s.cursor);
    std::string name = tower_identifier_value(s.source.substr(begin, s.cursor - begin));
    auto found = input.holes.find(name);
    if (found == input.holes.end()) {
      parser_stream_set_error(stream, ("Unknown replacement capture: $" + name).c_str());
      *id = PARSER_ID_EOF; return nullptr;
    }
    *id = found->second; *length = s.cursor - *start;
    result = tower_node_create();
    auto* m = parser_match_create(result);
    parser_match_set_id(m, *id);
    parser_match_set_label(m, ("$" + name).c_str());
  } else {
    auto* pointer = &s;
    result = lex(stream, &pointer, id, start, length);
  }
  *start += input.base;
  if (result) {
    parser_match_set_start(match(result), *start);
    parser_match_set_length(match(result), *length);
  }
  return result;
}

void hole_production(Version& version, const std::string& category, uint32_t id, bool append = false) {
  auto* rule = production(version, category, true);
  if (append) reference(rule, category);
  auto node = owned(tower_node_create());
  tower_node_attach(node.get(), rule);
  parser_string_set_id(parser_string_create(node.get()), 0, id);
}

bool compile_template(Version& version, const Definitions& defs, const Sequence& seq,
    Replacement& replacement, std::string& error, bool& grammar_error) {
  grammar_error = false;
  replacement.error_offset = replacement.start;
  replacement.uses.clear();
  auto grammar = std::make_shared<Version>();
  grammar->definitions = defs;
  grammar->templating = true; grammar->tokens = version.tokens;
  grammar->bedrock = version.bedrock;
  grammar->used_names = version.used_names;
  grammar->literals = version.literals; grammar->names = version.names;
  reference(production(*grammar, helper_name(*grammar, "template")), replacement.category);
  for (const auto& [name, alternatives] : defs)
    for (size_t i = 0; i < alternatives.size(); ++i) emit(*grammar, name, alternatives[i], i);
  for (const auto& entity : version.tokens) {
    const auto& token = semantic(entity);
    if (token.kind != SyntaxKind::Skip) reference(production(*grammar, template_token(*grammar, token.name), true), token.name);
  }
  TemplateInput input;
  input.base = replacement.start;
  input.session.source = semantic(semantic(seq).replacement).text;
  input.session.tokens = version.tokens;
  input.session.definitions = defs;
  input.session.bedrock = version.bedrock;
  input.session.version = grammar;
  for (const auto& [name, entity] : replacement.captures) {
    const auto& term = semantic(entity);
    uint32_t id = FirstHole + (uint32_t)input.holes.size();
    input.holes[name] = id; grammar->names[id] = "$" + name;
    if (!term.repetition) {
      hole_production(*grammar, resolve_token(version.tokens, term.text) == PARSER_ID_EOF
        ? term.text : template_token(*grammar, term.text), id);
    } else {
      for (const auto& [helper, target_entity] : grammar->repetitions) {
        const auto& target = semantic(target_entity);
        bool compatible = target.repetition == '*' || target.repetition == term.repetition;
        if (!target.literal && target.text == term.text && compatible) {
          if (target.repetition != '*') hole_production(*grammar, helper, id);
          if (target.repetition != '?') hole_production(*grammar, helper, id, true);
        }
      }
    }
  }
  char* diagnostic = nullptr;
  grammar->table = parser_table_create(grammar->rules.get(), grammar.get(), resolve, token_name, &diagnostic,
    ParserTableMode::WholeInput, describe_rule);
  if (!grammar->table) {
    grammar_error = true;
    error = diagnostic ? diagnostic : "Cannot build replacement parser";
    if (diagnostic) tower_memory_free(diagnostic);
    return false;
  }
  std::unique_ptr<Stream, decltype(&parser_stream_destroy)> stream(
    parser_stream_create(sizeof(TemplateInput*), nullptr, template_lex), parser_stream_destroy);
  *(TemplateInput**)parser_stream_get_userdata(stream.get()) = &input;
  std::unique_ptr<Recognizer, decltype(&parser_recognizer_destroy)> recognizer(
    parser_recognizer_create(grammar->table, stream.get()), parser_recognizer_destroy);
  input.session.recognizer = recognizer.get();
  Node root = owned(nullptr);
  bool running = true;
  while (running) root = owned(parser_recognizer_step(recognizer.get(), &running));
  if (!root) {
    replacement.error_offset = replacement.start + input.session.error_offset;
    // Holes are typed subtrees rather than ordinary lexer tokens; report
    // checked expectations here without guessing an insertion around a hole.
    error = syntax_diagnostic(input.session, recognizer.get(), false); return false;
  }
  auto* body = child(root.get(), 0);
  if (!body) { error = "Replacement must produce one syntax tree"; return false; }
  tower_node_add_ref(body); tower_node_detach(body); replacement.tree = owned(body);
  // Template tables have extra productions. Remap user productions back to the
  // active grammar so subsequent expansion uses the correct alternative.
  std::vector<TowerNode*> pending{body};
  while (!pending.empty()) {
    auto* node = pending.back(); pending.pop_back();
    auto* m = match(node);
    if (parser_match_get_id(m) >= FirstHole && parser_match_get_id(m) < FirstHole + input.holes.size()) {
      ++replacement.uses[std::string(parser_match_get_label(m)).substr(1)];
    } else if (parser_match_get_rule_index(m) != TOWER_INVALID_INDEX) {
      auto key = grammar->productions.find(parser_match_get_rule_index(m));
      std::string label = parser_match_get_label(m);
      if (auto source = grammar->capture_sources.find(label); source != grammar->capture_sources.end())
        label = version.capture_names.at(source->second);
      auto helper = version.named_indices.find(label);
      parser_match_set_rule_index(m, key != grammar->productions.end() ? version.indices.at(key->second)
        : helper != version.named_indices.end() ? helper->second : TOWER_INVALID_INDEX);
      parser_match_set_label(m, label.c_str());
      uint32_t id = parser_table_non_terminal_resolve_reference(version.table, label.c_str());
      parser_match_set_id(m, id);
    }
    for (size_t i = 0; i < tower_node_get_child_count(node); ++i) pending.push_back(child(node, i));
  }
  return true;
}

std::string replacement_excerpt(const std::string& source) {
  size_t first = 0, last = source.size();
  while (first < last && space(source[first])) ++first;
  while (last > first && space(source[last - 1])) --last;
  if (first == last) return "<empty>";
  // Keep diagnostics bounded without splitting a UTF-8 character. Preserve
  // whitespace inside strings/comments rather than pretending to reformat code.
  size_t end = std::min(last, first + 160);
  while (end < last && (static_cast<unsigned char>(source[end]) & 0xc0) == 0x80) --end;
  std::string result = "\"";
  for (size_t i = first; i < end; ++i) {
    switch (source[i]) {
      case '\n': result += "\\n"; break;
      case '\r': result += "\\r"; break;
      case '\t': result += "\\t"; break;
      case '\\': result += "\\\\"; break;
      case '"': result += "\\\""; break;
      default: result += source[i]; break;
    }
  }
  if (end < last) result += "...";
  return result + "\"";
}

bool prepare_replacements(Version& version, const Definitions& defs, std::string& message) {
  // Unattached helper rules cannot yet determine their destination. Validate
  // their templates atomically when a Statement path makes them usable.
  std::set<std::string> reachable;
  std::vector<std::string> pending;
  if (defs.contains("Statement")) pending.push_back("Statement");
  while (!pending.empty()) {
    auto name = pending.back(); pending.pop_back();
    if (!reachable.insert(name).second) continue;
    auto found = defs.find(name);
    if (found != defs.end()) for (const auto& seq : found->second)
      for (auto* entity : semantic(seq).items) {
        const auto& term = syntax_node(entity);
        if (!term.literal) pending.push_back(term.text);
      }
  }
  std::map<std::string, std::set<std::string>> parents;
  for (const auto& [name, alternatives] : defs) if (reachable.contains(name))
    for (const auto& seq : alternatives) if (semantic(seq).items.size() == 1) {
      const auto& term = syntax_node(semantic(seq).items[0]);
      if (!term.literal && !term.repetition) parents[term.text].insert(name);
    }
  for (const auto& [name, alternatives] : defs) {
    for (size_t i = 0; i < alternatives.size(); ++i) {
      const auto& seq = alternatives[i];
      if (!semantic(seq).replacement || !reachable.contains(name)) continue;
      const auto& body = semantic(semantic(seq).replacement);
      Replacement replacement;
      replacement.rule = name; replacement.start = body.start;
      replacement.end = body.end;
      for (auto* entity : semantic(seq).items) {
        const auto& term = syntax_node(entity);
        if (!term.capture.empty()) replacement.captures[term.capture] = TowerNodeRef(entity);
      }
      // Prefer the declared rule. A named helper can acquire a destination from
      // its nearest unit-rule parent. This happens only when compiling grammar;
      // source recognition remains deterministic LR with no backtracking.
      std::set<std::string> ancestors;
      pending = {name};
      bool ready = false;
      bool grammar_failed = false;
      std::vector<std::string> destinations;
      std::string original_error;
      size_t original_offset = replacement.start;
      while (!pending.empty()) {
        auto level = std::move(pending); pending.clear();
        Node selected = owned(nullptr);
        std::string selected_category;
        std::map<std::string, size_t> selected_uses;
        for (const auto& category : level) {
          if (!ancestors.insert(category).second) continue;
          destinations.push_back(category);
          replacement.category = category;
          std::string error;
          bool grammar_error = false;
          if (compile_template(version, defs, seq, replacement, error, grammar_error)) {
            if (selected) {
              message = "Ambiguous replacement destination for " + name + "; attach the handler to its destination rule";
              version.replacement_error_offset = replacement.start; return false;
            }
            selected = std::move(replacement.tree); selected_category = category; selected_uses = replacement.uses;
          } else if (original_error.empty()) { original_error = error; original_offset = replacement.error_offset; }
          grammar_failed |= grammar_error;
          for (const auto& parent : parents[category]) pending.push_back(parent);
        }
        if (selected) {
          replacement.tree = std::move(selected); replacement.category = selected_category; replacement.uses = std::move(selected_uses);
          ready = true; break;
        }
      }
      if (!ready) {
        message = "Replacement for " + name + " must produce ";
        if (destinations.size() == 1) message += "a valid " + destinations.front();
        else {
          message += "one of these syntax categories: ";
          for (size_t j = 0; j < destinations.size(); ++j) {
            if (j) message += ", ";
            message += destinations[j];
          }
        }
        message += ". ";
        const auto excerpt = replacement_excerpt(body.text);
        if (grammar_failed) message += "Could not validate " + excerpt + ".";
        else if (destinations.size() == 1) message += excerpt + " is not a valid " + destinations.front() + ".";
        else message += excerpt + " is not valid in any of these categories.";
        message += "\n" + original_error;
        version.replacement_error_offset = original_offset;
        return false;
      }
      version.replacements.emplace(version.indices.at({name, i}), std::move(replacement));
    }
  }
  return true;
}

Node copy_match(TowerNode* source) {
  auto result = owned(tower_node_create());
  auto* from = match(source); auto* to = parser_match_create(result.get());
  parser_match_set_id(to, parser_match_get_id(from));
  parser_match_set_rule_index(to, parser_match_get_rule_index(from));
  parser_match_set_start(to, parser_match_get_start(from));
  parser_match_set_length(to, parser_match_get_length(from));
  parser_match_set_label(to, parser_match_get_label(from));
  if (auto* previous = syntax_get_origin(source)) *origin(result.get()) = *previous;
  return result;
}

struct Expander {
  SyntaxSession& session;
  std::unordered_set<size_t> normal;
  static constexpr size_t max_steps = 4096, max_nodes = 65536, max_trace = 256;

  bool count_node(bool copied) {
    auto& stats = session.expansion_stats;
    if (stats.generated_nodes + stats.copied_nodes >= max_nodes) {
      session.error = "Replacement output limit exceeded (65536 nodes)"; return false;
    }
    if (copied) ++stats.copied_nodes; else ++stats.generated_nodes;
    return true;
  }
  Node copy_tree(TowerNode* source) {
    if (!count_node(true)) return owned(nullptr);
    auto result = copy_match(source);
    normal.insert(tower_node_get_id(result.get()));
    struct Pair { TowerNode* from; TowerNode* to; };
    std::vector<Pair> pending{{source, result.get()}};
    while (!pending.empty()) {
      auto [from, to] = pending.back(); pending.pop_back();
      for (size_t i = 0; i < tower_node_get_child_count(from); ++i) {
        if (!count_node(true)) return owned(nullptr);
        auto part = copy_match(child(from, i));
        normal.insert(tower_node_get_id(part.get()));
        tower_node_attach_member(part.get(), to, tower_node_get_child_member_name(from, i));
        pending.push_back({child(from, i), part.get()});
      }
    }
    return result;
  }
  Node instantiate(const Replacement& replacement, TowerNode* invocation, TowerNode* captured_from) {
    auto* span = match(invocation);
    auto trace = std::make_shared<SyntaxExpansion>();
    trace->rule = replacement.rule;
    trace->start = parser_match_get_start(span);
    trace->end = trace->start + parser_match_get_length(span);
    trace->definition_start = replacement.start; trace->definition_end = replacement.end;
    if (auto* previous = syntax_get_origin(invocation)) trace->previous = previous->expansion;
    size_t depth = 0;
    for (auto previous = trace->previous; previous; previous = previous->previous)
      if (++depth >= max_trace) { session.error = "Replacement recursion limit exceeded (256 expansions in one chain)"; return owned(nullptr); }
    std::map<std::string, TowerNode*> captures;
    for (const auto& [name, type] : replacement.captures) {
      auto* capture = tower_node_get_child_member(captured_from, name.c_str());
      if (!capture) { session.error = "Missing replacement capture: $" + name; return owned(nullptr); }
      captures[name] = capture;
    }
    auto remaining = replacement.uses;
    auto container = owned(tower_node_create());
    struct Work { TowerNode* source; TowerNode* parent; std::string role; };
    std::vector<Work> pending{{replacement.tree.get(), container.get(), {}}};
    while (!pending.empty()) {
      auto work = std::move(pending.back()); pending.pop_back();
      auto* m = match(work.source);
      std::string label = parser_match_get_label(m);
      if (parser_match_get_id(m) >= FirstHole && label.starts_with("$")) {
        const std::string name = label.substr(1);
        Node value = owned(nullptr);
        if (--remaining.at(name)) value = copy_tree(captures.at(name));
        else { tower_node_add_ref(captures.at(name)); value = owned(captures.at(name)); tower_node_detach(value.get()); }
        if (!value) return owned(nullptr);
        auto attach_capture = [&](TowerNode* capture, const std::string& role) {
          // Captured leaves keep their source spans and own expansion history.
          // Record the splice at its root, sharing the invocation trace.
          if (!syntax_get_origin(capture)) {
            auto* o = origin(capture); o->generated = false; o->expansion = trace;
            o->template_start = parser_match_get_start(m);
            o->template_end = o->template_start + parser_match_get_length(m);
          } else origin(capture)->splices.push_back(trace);
          tower_node_attach_member(capture, work.parent, role.empty() ? nullptr : role.c_str());
        };
        if (semantic(replacement.captures.at(name)).repetition) {
          std::vector<Node> items;
          while (auto* item = tower_node_take_last_child(value.get())) items.push_back(owned(item));
          if (!work.role.empty() && items.size() > 1) { session.error = "List capture requires a repeated destination"; return owned(nullptr); }
          for (auto it = items.rbegin(); it != items.rend(); ++it) attach_capture(it->get(), work.role);
        } else attach_capture(value.get(), work.role);
        continue;
      }
      if (!count_node(false)) return owned(nullptr);
      auto made = copy_match(work.source);
      auto* made_match = match(made.get());
      parser_match_set_start(made_match, trace->start);
      parser_match_set_length(made_match, trace->end - trace->start);
      auto* o = origin(made.get()); o->generated = true; o->expansion = trace;
      o->template_start = parser_match_get_start(m); o->template_end = o->template_start + parser_match_get_length(m);
      tower_node_attach_member(made.get(), work.parent, work.role.empty() ? nullptr : work.role.c_str());
      for (size_t i = tower_node_get_child_count(work.source); i > 0; --i) {
        auto* role = tower_node_get_child_member_name(work.source, i - 1);
        pending.push_back({child(work.source, i - 1), made.get(), role ? role : ""});
      }
    }
    if (tower_node_get_child_count(container.get()) != 1) { session.error = "Replacement must produce one root"; return owned(nullptr); }
    return owned(tower_node_take_last_child(container.get()));
  }
  std::pair<const Replacement*, TowerNode*> applicable(TowerNode* root) {
    std::string category = parser_match_get_label(match(root));
    auto* candidate = root;
    for (;;) {
      auto found = session.version->replacements.find(parser_match_get_rule_index(match(candidate)));
      if (found != session.version->replacements.end() && found->second.category == category)
        return {&found->second, candidate};
      if (tower_node_get_child_count(candidate) != 1) return {nullptr, nullptr};
      auto* next = child(candidate, 0);
      if (parser_match_get_rule_index(match(next)) == TOWER_INVALID_INDEX) return {nullptr, nullptr};
      candidate = next;
    }
  }
  bool run(Node& root) {
    struct Frame { TowerNode* node; size_t next; size_t index; };
    std::vector<Frame> stack{{root.get(), 0, 0}};
    while (!stack.empty()) {
      auto& frame = stack.back();
      if (normal.contains(tower_node_get_id(frame.node))) { stack.pop_back(); continue; }
      if (frame.next < tower_node_get_child_count(frame.node)) {
        size_t i = frame.next++;
        stack.push_back({child(frame.node, i), 0, i}); continue;
      }
      auto [replacement, captures] = applicable(frame.node);
      if (!replacement) {
        auto deferred = session.version->replacements.find(parser_match_get_rule_index(match(frame.node)));
        if (deferred != session.version->replacements.end()) {
          bool destination = false;
          for (size_t i = stack.size() - 1; i > 0; --i) {
            auto* parent = stack[i - 1].node;
            if (tower_node_get_child_count(parent) != 1) break;
            if (deferred->second.category == parser_match_get_label(match(parent))) { destination = true; break; }
          }
          if (!destination) {
            session.error_offset = parser_match_get_start(match(frame.node));
            session.error = "Replacement for " + deferred->second.rule + " requires a " + deferred->second.category + " destination";
            return false;
          }
        }
        normal.insert(tower_node_get_id(frame.node)); stack.pop_back(); continue;
      }
      session.error_offset = parser_match_get_start(match(frame.node));
      if (session.expansion_stats.replacements++ >= max_steps) {
        session.error = "Replacement step limit exceeded (4096)"; return false;
      }
      auto expanded = instantiate(*replacement, frame.node, captures);
      if (!expanded) { session.error += " while replacing " + replacement->rule; return false; }
      auto* next = expanded.get();
      if (stack.size() == 1) root = std::move(expanded);
      else tower_node_replace_child(stack[stack.size() - 2].node, frame.index, expanded.get());
      frame.node = next; frame.next = 0;
    }
    return true;
  }
};
}

const SyntaxOrigin* syntax_get_origin(TowerNode* node) {
  return (const SyntaxOrigin*)tower_node_get_component_userdata(node, origin_type);
}
SyntaxExpansionStats syntax_get_expansion_stats(SyntaxSession* session) { return session->expansion_stats; }

SyntaxSession* syntax_create(const char* source) {
  auto session = std::make_unique<SyntaxSession>();
  if (!bootstrap) { session->error = "Load foundation.tower before creating a syntax session"; return session.release(); }
  session->baseline = *bootstrap;
  session->baseline_definitions = *foundation_definitions;
  session->bedrock = current_bedrock();
  syntax_reset(session.get(), source);
  return session.release();
}

SyntaxSession* syntax_create_foundation(const char* source) {
  auto session = std::make_unique<SyntaxSession>();
  session->bootstrapping = true;
  session->bedrock = current_bedrock();
  session->baseline = session->bedrock->tokens;
  session->baseline_definitions = session->bedrock->definitions;
  syntax_reset(session.get(), source);
  return session.release();
}

SyntaxSession* syntax_create_bedrock(const char* source) {
  auto session = std::make_unique<SyntaxSession>();
  session->bootstrapping = session->building_bedrock = true;
  session->bedrock = native_bedrock();
  session->baseline = session->bedrock->tokens;
  session->baseline_definitions = session->bedrock->definitions;
  syntax_reset(session.get(), source);
  return session.release();
}

void syntax_reset(SyntaxSession* session, const char* source) {
  session->source = source;
  session->source_info = std::make_shared<SyntaxSource>(SyntaxSource{
    session->building_bedrock ? "bedrock.tower" : session->bootstrapping ? "foundation.tower" : "this file", source});
  session->cursor = session->revision = session->error_offset = 0;
  session->error_insertion = false;
  session->builds = session->hits = 0;
  session->expansion_stats = {};
  session->finalized = false; session->declarations_only = true; session->comment_cursor = 0;
  session->error.clear(); session->highlights.clear(); session->definitions = session->baseline_definitions;
  session->declaration = false; session->tokens = session->baseline;
  session->document = TowerNodeRef::adopt(tower_node_create());
  syntax_attach(session->document.get(), SyntaxKind::Document);
  session->version = compiled(*session, session->definitions, session->tokens, session->error);
}
SyntaxCacheStats syntax_get_cache_stats(SyntaxSession* session) {
  return {session->builds, session->hits, session->cache.size()};
}

void syntax_destroy(SyntaxSession* session) { delete session; }
const char* syntax_get_error(SyntaxSession* session) { return session->error.c_str(); }
size_t syntax_get_revision(SyntaxSession* session) { return session->revision; }
size_t syntax_get_offset(SyntaxSession* session) { return session->cursor; }
size_t syntax_get_error_offset(SyntaxSession* session) { return session->error_offset; }
bool syntax_get_error_insertion(SyntaxSession* session) { return session->error_insertion; }
TowerNode* syntax_document(SyntaxSession* session) { return session->document.get(); }
namespace {
bool same_formatted_tree(TowerNode* a, TowerNode* b, std::string_view source_a, std::string_view source_b) {
  if (syntax_get(a) || syntax_get(b)) return syntax_get(a) && syntax_get(b) && syntax_equal(a, b);
  auto* x = match(a); auto* y = match(b);
  if (!x || !y || std::string_view(parser_match_get_label(x)) != parser_match_get_label(y) ||
      parser_match_get_rule_index(x) != parser_match_get_rule_index(y) ||
      tower_node_get_child_count(a) != tower_node_get_child_count(b)) return false;
  if (parser_match_get_rule_index(x) == TOWER_INVALID_INDEX &&
      source_a.substr(parser_match_get_start(x), parser_match_get_length(x)) !=
      source_b.substr(parser_match_get_start(y), parser_match_get_length(y))) return false;
  for (size_t i = 0; i < tower_node_get_child_count(a); ++i)
    if (!same_formatted_tree(tower_node_get_child(a, i), tower_node_get_child(b, i), source_a, source_b)) return false;
  return true;
}
}
bool syntax_can_format(SyntaxSession* session) {
  return session->error.empty() && session->finalized;
}
TowerText syntax_format(SyntaxSession* session) {
  if (!syntax_can_format(session)) return {};
  // Formatting is opt-in: retain original trees only for this pass, before
  // replacements rewrite them. Ordinary live parsing does no extra tree copies.
  SyntaxSession copy;
  copy.baseline = session->baseline; copy.baseline_definitions = session->baseline_definitions;
  copy.bedrock = session->bedrock; copy.bootstrapping = session->bootstrapping;
  copy.building_bedrock = session->building_bedrock; copy.cache = session->cache;
  copy.formatting = true; syntax_reset(&copy, session->source.c_str());
  std::vector<TowerNodeRef> owned; std::vector<TowerNode*> roots;
  while (auto* root = syntax_next(&copy)) { owned.push_back(TowerNodeRef::adopt(root)); roots.push_back(root); }
  if (!copy.error.empty()) return {};
  std::vector<TowerCommentSpan> comments;
  for (const auto& token : copy.highlights) if (token.kind == "comment") comments.push_back({token.start, token.end});
  auto result = tower_format_source(roots, copy.source, comments);
  // User grammars may give punctuation or whitespace a different meaning.
  // Accept layout changes only if the same grammar reads the same source trees.
  SyntaxSession verify;
  verify.baseline = copy.baseline; verify.baseline_definitions = copy.baseline_definitions;
  verify.bedrock = copy.bedrock; verify.bootstrapping = copy.bootstrapping;
  verify.building_bedrock = copy.building_bedrock; verify.formatting = true; verify.cache = copy.cache;
  syntax_reset(&verify, result.source.c_str());
  size_t index = 0; bool same = true;
  while (auto* raw = syntax_next(&verify)) {
    auto node = TowerNodeRef::adopt(raw);
    same &= index < roots.size() && same_formatted_tree(roots[index], raw, copy.source, verify.source); ++index;
  }
  if (!same || index != roots.size() || !verify.error.empty())
    return {{}, {}, "Formatting would change the parsed source under this grammar; source was left unchanged"};
  return result;
}

namespace {
std::string validate_bedrock(const Bedrock& module, size_t& error_offset) {
  auto definitions = module.definitions; PendingRules pending;
  auto error = validate(definitions, module.tokens, &error_offset, pending);
  if (!error.empty()) return error;
  if (!pending.empty()) return "Unresolved grammar reference at end of module: " + pending_message(pending, pending.begin()->first, &error_offset);
  for (const auto& [name, alternatives] : module.definitions) {
    for (const auto& alternative : alternatives) if (semantic(alternative).replacement)
      return "Bedrock declaration rules cannot use replacement handlers yet";
  }
  bool name_token = false;
  for (const auto& entity : module.tokens) {
    const auto& token = semantic(entity);
    if (token.name == "Identifier" && token.kind == SyntaxKind::Token) name_token = true;
  }
  if (!name_token) return "Bedrock must define token Identifier";
  return {};
}
std::shared_ptr<Bedrock> collected_bedrock(SyntaxSession& session) {
  auto module = std::make_shared<Bedrock>(); module->document = session.document;
  module->definitions = session.definitions; module->tokens = session.tokens;
  return module;
}
void preserve_comments(SyntaxSession& session, SyntaxNode& declaration, size_t through) {
  for (const auto& token : session.highlights) {
    if (token.kind != "comment" || token.start < session.comment_cursor || token.end > through) continue;
    if (declaration.replacement) {
      const auto& body = semantic(declaration.replacement);
      if (token.start >= body.start && token.end <= body.end) continue;
    }
    declaration.comments.push_back(session.source.substr(token.start, token.end - token.start));
  }
  session.comment_cursor = through;
}
}

TowerNode* syntax_next(SyntaxSession* session) {
  if (!session->error.empty()) return nullptr;
  session->expansion_stats = {};
  std::string trivia_error = skip_source(*session, session->cursor, session->highlights);
  if (!trivia_error.empty()) {
    session->error_offset = session->highlights.back().start;
    session->error = trivia_error;
    return nullptr;
  }
  if (session->cursor == session->source.size()) {
    if (!session->finalized) {
      preserve_comments(*session, semantic(session->document), session->cursor);
      if (!session->version->pending.empty())
        session->error = "Unresolved grammar reference at end of module: " + pending_message(session->version->pending, session->version->pending.begin()->first, &session->error_offset);
      if (session->building_bedrock && session->error.empty()) {
        auto module = collected_bedrock(*session);
        session->error = validate_bedrock(*module, session->error_offset);
        if (session->error.empty()) {
          auto version = build({}, {}, module, session->error, &session->error_offset);
          if (version) for (const auto& keyword : version->declaration_starts)
            if (!word(keyword)) session->error = "Bedrock declarations must begin with literal keywords";
        }
      }
      session->finalized = true;
    }
    return nullptr;
  }
  session->declaration = declaration_at(*session, session->cursor);
  if (session->bootstrapping && !session->declaration) {
    session->error_offset = session->cursor;
    session->error = session->building_bedrock ? "Bedrock may contain only token, skip and parse declarations" : "Foundation may contain only token, skip and parse declarations";
    return nullptr;
  }
  size_t construct_start = session->cursor;
  const auto fail = [&](const std::string& error) -> TowerNode* {
    session->error = error;
    return nullptr;
  };
  {
    Node root = owned(nullptr);
    {
      std::unique_ptr<Stream, decltype(&parser_stream_destroy)> stream(
        parser_stream_create(sizeof(SyntaxSession*), nullptr, lex), parser_stream_destroy);
      *(SyntaxSession**)parser_stream_get_userdata(stream.get()) = session;
      std::unique_ptr<Recognizer, decltype(&parser_recognizer_destroy)> recognizer(
        parser_recognizer_create_prefix(session->version->table, stream.get()), parser_recognizer_destroy);
      session->recognizer = recognizer.get();
      bool running = true;
      while (running) root = owned(parser_recognizer_step(recognizer.get(), &running));
      session->recognizer = nullptr;
      if (!root) return fail(syntax_diagnostic(*session, recognizer.get()));
      // The recognizer may have inspected one following token. Keep only the
      // committed span; the next construct gets its own declaration/lexer mode.
      auto* span = match(root.get());
      session->cursor = parser_match_get_start(span) + parser_match_get_length(span);
      while (!session->highlights.empty() && session->highlights.back().start >= session->cursor)
        session->highlights.pop_back();
      session->error_offset = session->cursor;
    } // No recognizer or lookahead survives the grammar swap.
    TowerNode* construct = child(root.get(), 0);
    const std::string construct_kind = parser_match_get_label(match(construct));
    if (construct_kind == "GrammarTokenDeclaration" || construct_kind == "GrammarSkipDeclaration") {
      session->error_offset = construct_start;
      std::string error;
      auto* name = required(construct, "name", error); auto* pattern = required(construct, "pattern", error);
      auto* style = required(construct, "style", error); if (!error.empty()) return fail(error);
      auto& token = syntax_attach(construct, construct_kind == "GrammarSkipDeclaration" ? SyntaxKind::Skip : SyntaxKind::Token);
      location(token, construct); token.source = session->source_info;
      token.name = tower_identifier_value(text(name, session->source));
      if (token.name.empty()) return fail("Token name cannot be empty");
      if (session->definitions.contains(token.name)) return fail("Name already defines a parse rule: " + token.name);
      if (auto* kind = member(style, "kind")) token.style = tower_identifier_value(text(kind, session->source));
      else token.style = token.kind == SyntaxKind::Skip ? "" : "identifier";
      const auto envelope = text(pattern, session->source);
      if (envelope.size() < 2) return fail("Token pattern must contain opening and closing delimiters");
      token.text = envelope.substr(1, envelope.size() - 2);
      if (auto* mode = member(construct, "mode")) token.contextual = !text(mode, session->source).empty();
      if (token.contextual && token.kind == SyntaxKind::Skip) return fail("Skip rules cannot be contextual");
      for (const auto& entry : session->cache) for (const auto& old : entry.tokens)
        if (semantic(old).text == token.text) token.compiled = semantic(old).compiled;
      if (!token.compiled) token.compiled = lex_pattern_compile(token.text, error);
      if (!token.compiled) return fail(error);
      auto candidate = session->tokens;
      auto old = std::find_if(candidate.begin(), candidate.end(), [&](const auto& t) { return semantic(t).name == token.name; });
      if (old != candidate.end()) *old = TowerNodeRef(construct);
      else {
        if (candidate.size() >= 64) return fail("Token rule limit is 64");
        candidate.emplace_back(construct);
      }
      auto version = compiled(*session, session->definitions, candidate, error);
      if (!version) return fail(error);
      session->version = std::move(version);
      session->tokens = std::move(candidate);
      ++session->revision;
    }
    if (construct_kind == "GrammarDeclaration") {
      session->error_offset = construct_start;
      std::string error;
      auto* name_node = required(construct, "name", error); auto* op_node = required(construct, "op", error);
      auto* alternatives_node = required(construct, "alternatives", error); auto* replacement = required(construct, "replacement", error);
      if (!error.empty()) return fail(error);
      std::string name = tower_identifier_value(text(name_node, session->source)), op = text(op_node, session->source);
      if (name.empty()) return fail("Rule name cannot be empty");
      if (op != "=" && op != "|=") return fail("Unknown grammar assignment: " + op);
      Alternatives alternatives = read_alternatives(alternatives_node, session->source, error);
      if (!error.empty()) return fail(error);
      auto& rule = syntax_attach(construct, SyntaxKind::Rule);
      rule.name = name; rule.append = op == "|=";
      for (const auto& alternative : alternatives) rule.items.push_back(alternative.get());
      record_source(construct, session->source_info);
      if (auto* entity = member(replacement, "body")) {
        auto* body = match(entity);
        size_t start = parser_match_get_start(body) + 1;
        size_t length = parser_match_get_length(body) - 2;
        auto& value = syntax_attach(entity, SyntaxKind::Template);
        value.start = start; value.end = start + length;
        value.text = session->source.substr(start, length);
        rule.replacement = TowerNodeRef(entity);
        for (auto& seq : alternatives) {
          semantic(seq).replacement = TowerNodeRef(entity);
        }
      }
      Definitions candidate = session->definitions;
      if (op == "|=") {
        if (!candidate.contains(name)) return fail("Cannot extend undefined rule: " + name);
        auto& target = candidate[name];
        target.insert(target.end(), alternatives.begin(), alternatives.end());
      } else candidate[name] = std::move(alternatives);
      auto version = compiled(*session, candidate, session->tokens, error);
      if (!version) return fail(error);
      session->version = std::move(version);
      session->definitions = std::move(candidate);
      ++session->revision;
    }
    if (session->declaration) {
      auto& declaration = syntax_node(construct);
      declaration.start = construct_start; declaration.end = session->cursor;
      preserve_comments(*session, declaration, session->cursor);
      tower_node_attach(root.get(), session->document.get());
      semantic(session->document).items.push_back(construct);
      // These are roles of the fixed declaration language, not application
      // tokens. Patterns and quoted literals keep their own classification.
      bool capture = false;
      size_t template_start = TOWER_INVALID_INDEX;
      if (declaration.replacement) template_start = semantic(declaration.replacement).start - 1;
      for (auto& token : session->highlights) {
        if (token.start < construct_start) continue;
        if (token.start >= template_start) continue;
        if (token.kind == "comment") continue;
        if (token.kind == "identifier") token.kind = capture ? "capture" : "rule";
        capture = session->source.substr(token.start, token.end - token.start) == "$";
      }
    } else {
      session->declarations_only = false;
      if (!session->formatting && !session->version->replacements.empty()) {
        Expander expander{*session};
        if (!expander.run(root)) return nullptr;
      }
      session->comment_cursor = session->cursor;
    }
    return root.release();
  }
}

std::vector<SyntaxHighlight> syntax_get_highlights(SyntaxSession* session) {
  auto result = session->highlights;
  size_t pos = session->cursor;
  // After an error, colour the suffix with the last committed grammar. This
  // preview never installs declarations or changes the parsing cursor.
  if (session->version) while (pos < session->source.size()) {
    skip_source(*session, pos, result);
    if (pos == session->source.size()) break;
    bool meta = declaration_at(*session, pos);
    // Preview declarations with the active reader but never install them.
    do {
      uint32_t id; size_t start, length;
      bool saved = session->declaration; session->declaration = meta;
      scan(*session, pos, result, id, start, length);
      session->declaration = saved;
      if (!meta || (length == 1 && session->source[start] == ';') || pos == session->source.size()) break;
    } while (true);
  }
  return result;
}

std::vector<SyntaxTokenInfo> syntax_get_tokens(SyntaxSession* session) {
  std::vector<SyntaxTokenInfo> result;
  for (const auto& entity : session->tokens) {
    const auto& token = semantic(entity);
    result.push_back({token.name, token.text, token.style, token.kind == SyntaxKind::Skip, token.contextual});
  }
  return result;
}

std::string syntax_set_bedrock(const char* source) {
  static std::string installed;
  if (installed_bedrock && installed == source) return {};
  std::unique_ptr<SyntaxSession> session(syntax_create_bedrock(source));
  while (auto* root = syntax_next(session.get())) tower_node_release_ref(root);
  if (!session->error.empty()) return session->error;
  installed_bedrock = collected_bedrock(*session);
  installed = source;
  // Foundation must be reloaded under the new bedrock. Existing syntax sessions
  // retain their own foundation and bedrock entities and remain valid.
  bootstrap.reset(); foundation_definitions.reset();
  return {};
}

std::string syntax_set_bootstrap(const char* source) {
  static std::string installed;
  if (bootstrap && installed == source) return {};
  std::unique_ptr<SyntaxSession> session(syntax_create_foundation(source));
  while (auto* root = syntax_next(session.get())) tower_node_release_ref(root);
  if (!session->error.empty()) return session->error;
  if (session->tokens.empty()) return "Bootstrap must define at least one token or skip rule";
  // Baselines reference the same semantic declaration entities. Existing
  // sessions retain their baseline; a new module affects only new sessions.
  bootstrap = std::make_shared<const TokenDefinitions>(session->tokens);
  foundation_definitions = std::make_shared<const Definitions>(session->definitions);
  installed = source;
  return {};
}

#ifdef __wasi__
extern "C" __attribute__((export_name("tw_set_bedrock"))) const char* syntax_wasm_bedrock(const char* source, size_t bytes) {
  static std::string error;
  if (!source || bytes > 65536 || std::string(source, bytes).find('\0') != std::string::npos)
    error = "Bedrock must be at most 64 KiB without NUL bytes";
  else { std::string copy(source, bytes); error = syntax_set_bedrock(copy.c_str()); }
  return error.c_str();
}
extern "C" __attribute__((export_name("tw_bedrock_seed"))) const char* syntax_wasm_seed() {
  static const auto source = tower_format(syntax_native_bedrock()).source;
  return source.c_str();
}
extern "C" __attribute__((export_name("tw_set_bootstrap"))) const char* syntax_wasm_bootstrap(const char* source, size_t bytes) {
  static std::string error;
  if (!source || bytes > 65536 || std::string(source, bytes).find('\0') != std::string::npos)
    error = "Bootstrap must be at most 64 KiB without NUL bytes";
  else { std::string copy(source, bytes); error = syntax_set_bootstrap(copy.c_str()); }
  return error.c_str();
}
#endif

std::vector<std::string> syntax_get_keywords(SyntaxSession* session) {
  std::vector<std::string> result;
  if (session->version) for (const auto& [literal, id] : session->version->literals)
    if (word(literal)) result.push_back(literal);
  return result;
}

std::vector<SyntaxRuleInfo> syntax_get_rules(SyntaxSession* session) {
  std::vector<SyntaxRuleInfo> result;
  for (const auto& [name, alternatives] : session->definitions) {
    std::string definition;
    for (const auto& sequence : alternatives) {
      if (!definition.empty()) definition += " | ";
      const auto part = tower_format(sequence.get()).source;
      definition += part.empty() ? "ε" : part;
    }
    result.push_back({name, definition, session->version && session->version->pending.contains(name)});
  }
  return result;
}
