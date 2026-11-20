#include "syntax.hpp"
#include "compiler-syntax-reader.hpp"
#include "compiler-syntax-validation.hpp"
#include "compiler-syntax-emission.hpp"
#include "compiler-syntax-expansion.hpp"
#include "compiler-syntax-replacements.hpp"
#include "compiler-syntax-template.hpp"
#include "compiler-syntax-scan.hpp"
#include "compiler-frontend.hpp"
#include "compiler-lr.hpp"
#include "compiler-entities.hpp"
#include "compiler-generics.hpp"
#include "compiler-syntax-lexer.hpp"
#include "lex-pattern.hpp"
#include "syntax-nodes.hpp"
#include "format.hpp"
#include <algorithm>
#include <array>
#include <cassert>
#include <cstring>
#include <map>
#include <memory>
#include <set>
#include <string>
#include <vector>
#include <unordered_set>

ModuleEnvironment* syntax_modules = nullptr;

namespace {
bool diagnostic_peek(void*, size_t&, const ParserLookahead&, uint32_t&);
constexpr uint32_t MetaName = 0x110000, MetaString = MetaName + 1, FirstHole = 0x300000;
constexpr uint32_t FirstToken = 0x120000;

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
SyntaxNode& semantic(TowerNode* node) { return syntax_node(node); }
#ifdef TOWER_EXPANSION_SEED
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
#endif
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
  const auto dispose = +[](TowerComponent*, void* data) { ((SyntaxOrigin*)data)->~SyntaxOrigin(); };
#ifdef TOWER_EXPANSION_SEED
  auto* component = tower_component_create(node, origin_type, sizeof(SyntaxOrigin), dispose);
#else
  if (!tower_component_register(origin_type, sizeof(SyntaxOrigin), dispose)) return nullptr;
  auto* component = entity_component_add(node, origin_type);
  if (!component) return nullptr;
#endif
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
  SyntaxLexicon* lexicon = nullptr;
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
#ifndef TOWER_EXPANSION_SEED
  std::vector<std::vector<SyntaxExpansionCapture>> expansion_captures;
  std::vector<SyntaxExpansionRule> expansion_rules;
  std::vector<const SyntaxExpansionRule*> expansion_index;
#endif
  size_t replacement_error_offset = TOWER_INVALID_INDEX;
  ~Version() { lexicon_destroy(lexicon); parser_table_destroy(table); }
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
  size_t line, column; syntax_source_location(node.source, node.start, &line, &column);
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

uint32_t token_id(const std::string& name, size_t index) {
  if (name == "Identifier") return MetaName;
  if (name == "String") return MetaString;
  return FirstToken + (uint32_t)index;
}
bool build_lexicon(Version& version) {
  assert(!version.lexicon);
  version.lexicon = lexicon_create();
  if (!version.lexicon) return false;
  for (size_t i = 0; i < version.tokens.size(); ++i) {
    const auto& token = semantic(version.tokens[i]);
    if (!lexicon_token(version.lexicon, token.compiled->table, token_id(token.name, i), token.style.c_str(),
        token.kind == SyntaxKind::Skip, token.contextual, token.name == "Identifier")) return false;
  }
  for (const auto& [literal, id] : version.literals)
    if (!lexicon_literal(version.lexicon, literal.c_str(), literal.size(), id, version.declaration_literals.contains(literal))) return false;
  for (const auto& text : version.declaration_starts)
    if (!lexicon_start(version.lexicon, text.c_str(), text.size())) return false;
  return true;
}
uint32_t resolve_token(const TokenDefinitions& tokens, const std::string& name) {
  for (size_t i = 0; i < tokens.size(); ++i)
    if (semantic(tokens[i]).kind != SyntaxKind::Skip && semantic(tokens[i]).name == name) return token_id(name, i);
  return PARSER_ID_EOF;
}
uint32_t resolve(void* context, const char* name) {
  return resolve_token(((Version*)context)->tokens, name);
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

// Borrowed ABI views and native presentation indexes around Tower emission.
bool seed(Version& version, const Definitions& definitions, const char* category = nullptr) {
  std::vector<std::vector<TowerNode*>> alternatives;
  std::vector<SyntaxRuleView> rules;
  std::vector<TowerNode*> tokens;
  std::vector<const char*> reserved;
  std::vector<SyntaxEmissionLiteral> literals;
  alternatives.reserve(definitions.size()); rules.reserve(definitions.size());
  for (const auto& [name, sequences] : definitions) {
    auto& list = alternatives.emplace_back();
    for (const auto& sequence : sequences) list.push_back(sequence.get());
    rules.push_back({name.data(), name.size(), list.data(), list.size()});
  }
  for (const auto& token : version.tokens) tokens.push_back(token.get());
  for (const auto& name : version.used_names) reserved.push_back(name.c_str());
  for (const auto& [text, id] : version.literals) literals.push_back({text.data(), text.size(), id});
  SyntaxEmissionInput input{rules.data(), rules.size(), tokens.data(), tokens.size(),
    reserved.data(), reserved.size(), literals.data(), literals.size(), category,
    version.rules.get(), syntax_component_type(), parser_rule_get_type(), parser_reference_get_type(),
    parser_string_get_type(), parser_range_get_type()};
  std::unique_ptr<SyntaxEmission, decltype(&syntax_emission_destroy)> emitted(syntax_emit(&input), syntax_emission_destroy);
  if (!emitted) return false;
  for (size_t i = 0; i < syntax_emission_name_count(emitted.get()); ++i) {
    SyntaxEmissionName entry{}; syntax_emission_name(emitted.get(), i, &entry);
    std::string name(entry.text, entry.length);
    if (entry.used) version.used_names.insert(name);
    if (entry.literal != PARSER_ID_EOF) { version.literals[name] = entry.literal; version.names[entry.literal] = "'" + name + "'"; }
    if (entry.wrapper) version.template_tokens[name] = entry.wrapper;
    if (entry.declaration) version.declaration_literals[name] = entry.literal;
    if (entry.start) version.declaration_starts.insert(name);
  }
  for (size_t i = 0; i < syntax_emission_production_count(emitted.get()); ++i) {
    SyntaxEmissionProduction entry{}; syntax_emission_production(emitted.get(), i, &entry);
    ProductionKey key{entry.name, entry.alternative};
    version.productions[entry.index] = key; version.indices[key] = entry.index;
  }
  for (size_t i = 0; i < syntax_emission_helper_count(emitted.get()); ++i) {
    SyntaxEmissionHelper entry{}; syntax_emission_helper(emitted.get(), i, &entry);
    if (entry.capture) { version.capture_sources[entry.name] = entry.source; version.capture_names[entry.source] = entry.name; }
    else version.repetitions.emplace(entry.name, TowerNodeRef(entry.source));
  }
  for (size_t i = 0; i < tower_node_get_child_count(version.rules.get()); ++i) {
    auto* node = tower_node_get_child(version.rules.get(), i);
    auto* rule = static_cast<Rule*>(tower_node_get_component_userdata(node, parser_rule_get_type()));
    version.named_indices.try_emplace(parser_rule_get_name(rule), i + 1);
  }
  return true;
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
  std::vector<std::vector<TowerNode*>> alternatives;
  std::vector<SyntaxRuleView> rules;
  std::vector<TowerNode*> terminals, waiting(defs.size());
  alternatives.reserve(defs.size()); rules.reserve(defs.size()); terminals.reserve(tokens.size());
  for (const auto& [name, sequences] : defs) {
    auto& list = alternatives.emplace_back(); list.reserve(sequences.size());
    for (const auto& sequence : sequences) list.push_back(sequence.get());
    rules.push_back({name.data(), name.size(), list.data(), list.size()});
  }
  for (const auto& token : tokens) terminals.push_back(token.get());
  TowerByteBuffer error{}; size_t location = TOWER_INVALID_INDEX;
  bool ok = syntax_validate(rules.data(), rules.size(), terminals.data(), terminals.size(), syntax_component_type(),
    &error, error_offset ? error_offset : &location, waiting.data());
  std::string message = ok ? "" : error.length ? std::string(reinterpret_cast<const char*>(error.data), error.length)
    : "Unable to allocate grammar validation";
  bytes_dispose(&error);
  for (size_t i = 0; i < rules.size(); ++i) if (waiting[i]) {
    const auto& term = syntax_node(waiting[i]);
    pending.emplace(std::string(rules[i].name, rules[i].name_length), PendingRule{term.text, term.start});
  }
  // Only the executable revision excludes pending rules. Source entities survive.
  if (ok) for (const auto& [name, dependency] : pending) defs.erase(name);
  return message;
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
    const auto& value = semantic(token);
    if (value.kind != SyntaxKind::Skip) v->names[resolve_token(v->tokens, value.name)] = value.name;
  }
  for (const auto& [name, dependency] : v->pending) v->used_names.insert(name);
  if (!seed(*v, definitions)) { message = "Unable to allocate grammar construction"; return nullptr; }
  char* error = nullptr;
  v->table = parser_table_create(v->rules.get(), v.get(), resolve, token_name, &error, ParserTableMode::Constructs, describe_rule);
  if (!v->table) {
    message = error ? error : "Unable to build grammar";
    tower_memory_free(error);
    return nullptr;
  }
  if (!build_lexicon(*v)) { message = "Unable to allocate lexical indexes"; return nullptr; }
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
std::string text(TowerNode* node, std::string_view source) {
  auto* m = match(node);
  return std::string(source.substr(parser_match_get_start(m), parser_match_get_length(m)));
}

TowerNode* member(TowerNode* node, const char* name) { return node ? tower_node_get_child_member(node, name) : nullptr; }
std::string read_declaration(TowerNode* node, const SyntaxSource* source, SyntaxKind kind) {
  TowerByteBuffer error{};
  const auto match_kind = parser_match_get_type(), syntax_kind = syntax_component_type();
  const bool ok = kind == SyntaxKind::Rule ? syntax_read_rule(node, source, match_kind, syntax_kind, &error) :
    syntax_read_token(node, source, match_kind, syntax_kind, kind == SyntaxKind::Skip, &error);
  std::string message;
  if (!ok) message = error.length ? std::string(reinterpret_cast<const char*>(error.data), error.length) : "Unable to allocate grammar declaration";
  bytes_dispose(&error); return message;
}

}

struct SyntaxSession {
  FrontendModule* module = nullptr;
  bool owns_module = false;
  std::string_view source; // Borrowed from source_info, retained by source nodes.
  SyntaxSourceRef source_info;
  size_t cursor = 0;
  size_t revision = 0;
  Definitions definitions, baseline_definitions;
  TokenDefinitions tokens, baseline;
  Recognizer* recognizer = nullptr; // borrowed only while reading this stream
  bool completing = false;
  std::unique_ptr<LRCompletion, decltype(&lr_completion_destroy)> completion{nullptr, lr_completion_destroy};
  std::shared_ptr<Version> completion_version;
  std::string completion_suffix;
  bool bootstrapping = false, declaration = false;
  bool building_bedrock = false, finalized = false, declarations_only = true;
  bool formatting = false;
  size_t comment_cursor = 0;
  std::shared_ptr<const Bedrock> bedrock;
  std::shared_ptr<Version> version;
#ifdef TOWER_EXPANSION_SEED
  struct CachedVersion { Definitions definitions; TokenDefinitions tokens; std::shared_ptr<Version> version; };
  std::vector<CachedVersion> cache;
  size_t builds = 0, hits = 0;
#else
  FrontendCache cache{};
  std::array<std::shared_ptr<Version>, SYNTAX_MAX_CACHED_GRAMMARS> versions;
  ~SyntaxSession() { frontend_cache_dispose(&cache); if (owns_module) frontend_module_destroy(module); }
#endif
  SyntaxExpansionStats expansion_stats;
  std::string error;
  size_t error_offset = 0;
  bool error_insertion = false;
  std::vector<SyntaxHighlight> highlights;
  TowerNodeRef document;
};

namespace {
bool set_source(SyntaxSession& session, std::string_view text, const char* name) {
  auto source = SyntaxSourceRef::adopt(syntax_source_create(name, text.data(), text.size()));
  if (!source) return false;
  session.source_info = std::move(source);
  session.source = session.source_info->text.view();
  return true;
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
#ifdef TOWER_EXPANSION_SEED
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
#else
  std::vector<TowerNode*> alternatives;
  std::vector<SyntaxRuleView> rules;
  std::vector<TowerNode*> token_nodes;
  size_t alternative_count = 0;
  for (const auto& [name, sequences] : definitions) alternative_count += sequences.size();
  alternatives.reserve(alternative_count); rules.reserve(definitions.size());
  for (const auto& [name, sequences] : definitions) {
    const auto begin = alternatives.size();
    for (const auto& sequence : sequences) alternatives.push_back(sequence.get());
    rules.push_back({name.data(), name.size(), alternatives.data() + begin, sequences.size()});
  }
  for (const auto& token : tokens) token_nodes.push_back(token.get());
  const auto slot = frontend_cache_find(&session.cache, rules.data(), rules.size(),
    token_nodes.data(), token_nodes.size(), syntax_component_type());
  if (slot != TOWER_INVALID_INDEX) { error.clear(); return session.versions[slot]; }
  std::shared_ptr<Version> version = build(definitions, tokens, session.bedrock, error, &session.error_offset);
  if (version) {
    const auto stored = frontend_cache_store(&session.cache, rules.data(), rules.size(), token_nodes.data(), token_nodes.size());
    if (stored != TOWER_INVALID_INDEX) session.versions[stored] = version;
  }
  return version;
#endif
}

#ifdef TOWER_EXPANSION_SEED
#include "bootstrap/syntax-scan-seed.inc"
#else
extern "C" void syntax_scan_highlight(void* host, size_t start, size_t end, size_t revision, const char* style, uint32_t id, bool skipped) {
  static_cast<std::vector<SyntaxHighlight>*>(host)->push_back({start, end, revision, style, skipped || id == MetaString, id});
}
SyntaxScanInput scan_input(const SyntaxSession& session, size_t pos, std::vector<SyntaxHighlight>* highlights,
    const ParserLookahead* expected = nullptr) {
  const auto context = expected ? *expected : parser_recognizer_lookahead(session.recognizer);
  SyntaxScanInput input{};
  input.lexicon = session.version->lexicon; input.source = session.source.data(); input.size = session.source.size();
  input.cursor = pos; input.revision = session.revision;
  input.declaration = session.declaration; input.bootstrapping = session.bootstrapping;
  input.runtime = context.runtime; input.state = context.state; input.highlights = highlights;
  input.context = session.version->rules.get(); input.match_kind = parser_match_get_type();
  return input;
}
bool diagnostic_peek(void* context, size_t& pos, const ParserLookahead& expected, uint32_t& id) {
  auto input = scan_input(*static_cast<SyntaxSession*>(context), pos, nullptr, &expected);
  const bool ok = syntax_scan_peek(&input, &id);
  pos = input.cursor;
  return ok;
}
bool declaration_at(const SyntaxSession& session, size_t pos) {
  return lexicon_declaration(session.version->lexicon, session.source.data(), session.source.size(), pos);
}
std::string skip_source(SyntaxSession& session, size_t& pos, std::vector<SyntaxHighlight>& highlights) {
  auto input = scan_input(session, pos, &highlights);
  SyntaxScanResult result{};
  syntax_scan_skip(&input, &result);
  pos = input.cursor; parser_recognizer_account_lookahead(session.recognizer, result.checks);
  return {};
}
std::string scan(SyntaxSession& session, size_t& pos, std::vector<SyntaxHighlight>& highlights,
    uint32_t& id, size_t& start, size_t& length) {
  auto input = scan_input(session, pos, &highlights);
  SyntaxScanResult result{};
  syntax_scan_token(&input, &result);
  pos = input.cursor; id = result.id; start = result.start; length = result.length;
  parser_recognizer_account_lookahead(session.recognizer, result.checks);
  return result.error ? result.error : "";
}
TowerNode* read_scan(Stream* stream, SyntaxSession& session, SyntaxScanInput& input,
    uint32_t* id, size_t* start, size_t* length) {
  SyntaxScanResult result{};
  auto* node = syntax_scan_read(&input, &result);
  session.cursor = input.cursor; session.error_offset = result.start;
  parser_recognizer_account_lookahead(session.recognizer, result.checks);
  *id = result.id; *start = result.start + input.base; *length = result.length;
  if (result.error) { parser_stream_set_error(stream, result.error); *id = PARSER_ID_EOF; }
  syntax_scan_dispose(&result);
  return node;
}
TowerNode* lex(Stream* stream, void* userdata, uint32_t* id, size_t* start, size_t* length) {
  auto& session = **static_cast<SyntaxSession**>(userdata);
  auto input = scan_input(session, session.cursor, &session.highlights);
  return read_scan(stream, session, input, id, start, length);
}
struct TemplateInput {
  SyntaxSession session;
  const SyntaxTemplateCapture* captures = nullptr;
  size_t count = 0, base = 0;
};
TowerNode* template_lex(Stream* stream, void* userdata, uint32_t* id, size_t* start, size_t* length) {
  auto& host = **static_cast<TemplateInput**>(userdata);
  auto input = scan_input(host.session, host.session.cursor, &host.session.highlights);
  input.replacement = true; input.captures = host.captures; input.count = host.count; input.base = host.base;
  return read_scan(stream, host.session, input, id, start, length);
}
#endif

#ifdef TOWER_EXPANSION_SEED
#include "bootstrap/syntax-template-seed.inc"
#else
bool compile_template(Version& version, const Definitions& defs, const Sequence& seq,
    Replacement& replacement, std::string& error, bool& grammar_error) {
  grammar_error = false;
  replacement.error_offset = replacement.start;
  replacement.uses.clear();
  auto grammar = std::make_shared<Version>();
  grammar->definitions = defs;
  grammar->tokens = version.tokens;
  grammar->bedrock = version.bedrock;
  grammar->used_names = version.used_names;
  grammar->literals = version.literals; grammar->names = version.names;
  if (!seed(*grammar, defs, replacement.category.c_str())) {
    error = "Unable to allocate replacement grammar"; return false;
  }
  TemplateInput input;
  input.base = replacement.start;
  if (!set_source(input.session, semantic(semantic(seq).replacement).text, "replacement")) {
    error = "Unable to allocate replacement source text"; return false;
  }
  input.session.tokens = version.tokens;
  input.session.definitions = defs;
  input.session.bedrock = version.bedrock;
  input.session.version = grammar;
  std::vector<SyntaxTemplateCapture> captures;
  std::vector<SyntaxEmissionHelper> repetitions;
  for (const auto& [name, entity] : replacement.captures) {
    const auto id = FirstHole + static_cast<uint32_t>(captures.size());
    grammar->names[id] = "$" + name;
    const auto& term = semantic(entity);
    const auto wrapper = grammar->template_tokens.find(term.text);
    captures.push_back({name.c_str(), entity.get(), wrapper == grammar->template_tokens.end() ? nullptr : wrapper->second.c_str()});
  }
  for (const auto& [name, entity] : grammar->repetitions) repetitions.push_back({name.c_str(), entity.get(), false});
  input.captures = captures.data(); input.count = captures.size();
  SyntaxTemplateGrammar holes{};
  holes.emission.root = grammar->rules.get(); holes.emission.syntax_kind = syntax_component_type();
  holes.emission.rule_kind = parser_rule_get_type(); holes.emission.reference_kind = parser_reference_get_type();
  holes.emission.string_kind = parser_string_get_type();
  holes.captures = captures.data(); holes.count = captures.size();
  holes.repetitions = repetitions.data(); holes.repetition_count = repetitions.size();
  const auto first_added = tower_node_get_child_count(grammar->rules.get());
  if (!syntax_template_holes(&holes)) { error = "Unable to allocate replacement hole productions"; return false; }
  for (size_t i = first_added; i < tower_node_get_child_count(grammar->rules.get()); ++i) {
    auto* node = child(grammar->rules.get(), i);
    auto* rule = static_cast<Rule*>(tower_node_get_component_userdata(node, parser_rule_get_type()));
    grammar->named_indices.try_emplace(parser_rule_get_name(rule), i + 1);
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
  if (!build_lexicon(*grammar)) { error = "Unable to allocate replacement lexical indexes"; return false; }
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
  std::vector<SyntaxEmissionProduction> source, destination;
  std::vector<SyntaxTemplateAlias> aliases;
  std::vector<SyntaxTemplateName> names;
  std::vector<size_t> uses(captures.size());
  source.reserve(grammar->productions.size()); destination.reserve(version.indices.size());
  aliases.reserve(grammar->capture_sources.size()); names.reserve(version.named_indices.size());
  for (const auto& [index, key] : grammar->productions) source.push_back({key.first.c_str(), key.second, index});
  for (const auto& [key, index] : version.indices) destination.push_back({key.first.c_str(), key.second, index});
  for (const auto& [name, entity] : grammar->capture_sources)
    aliases.push_back({name.c_str(), version.capture_names.at(entity).c_str()});
  for (const auto& [name, index] : version.named_indices) names.push_back({name.c_str(), index});
  SyntaxTemplateRemap remap{body, parser_match_get_type(), source.data(), source.size(),
    destination.data(), destination.size(), aliases.data(), aliases.size(), names.data(), names.size(),
    parser_table_grammar(version.table), uses.data(), uses.size()};
  if (!syntax_template_remap(&remap)) { error = "Unable to allocate replacement template mapping"; return false; }
  for (size_t i = 0; i < captures.size(); ++i) if (uses[i]) replacement.uses[captures[i].name] = uses[i];
  return true;
}
#endif

#ifdef TOWER_EXPANSION_SEED
#include "bootstrap/syntax-replacements-seed.inc"
#else
struct ReplacementPlanHost {
  Version& version;
  const Definitions& definitions;
  Replacement current;
  TowerNodeRef sequence;
  Node selected = owned(nullptr);
  std::string selected_category, diagnostic;
  std::map<std::string, size_t> selected_uses;
};

bool prepare_replacements(Version& version, const Definitions& defs, std::string& message) {
  ReplacementPlanHost host{version, defs};
  std::vector<TowerNode*> alternatives;
  std::vector<SyntaxRuleView> rules;
  size_t count = 0;
  for (const auto& [name, sequences] : defs) count += sequences.size();
  alternatives.reserve(count); rules.reserve(defs.size());
  for (const auto& [name, sequences] : defs) {
    const auto start = alternatives.size();
    for (const auto& sequence : sequences) alternatives.push_back(sequence.get());
    rules.push_back({name.c_str(), name.size(), alternatives.data() + start, sequences.size()});
  }
  SyntaxReplacementPlan plan{rules.data(), rules.size(), syntax_component_type(), &host, {}, TOWER_INVALID_INDEX};
  const bool ok = syntax_replacements_prepare(&plan);
  if (!ok) {
    version.replacement_error_offset = plan.offset;
    message = plan.error.length ? std::string(reinterpret_cast<const char*>(plan.error.data), plan.error.length)
      : "Unable to allocate replacement preparation storage";
  }
  syntax_replacements_dispose(&plan);
  if (!ok) return false;
  version.expansion_captures.resize(version.replacements.size());
  version.expansion_rules.reserve(version.replacements.size());
  if (!version.replacements.empty()) version.expansion_index.resize(version.replacements.rbegin()->first + 1);
  for (const auto& [index, replacement] : version.replacements) {
    auto& captures = version.expansion_captures[version.expansion_rules.size()];
    for (const auto& [name, source] : replacement.captures) {
      auto used = replacement.uses.find(name);
      captures.push_back({name.c_str(), used == replacement.uses.end() ? 0 : used->second,
        semantic(source).repetition != 0});
    }
    version.expansion_rules.push_back({replacement.tree.get(), replacement.rule.c_str(),
      replacement.category.c_str(), replacement.start, replacement.end, captures.data(), captures.size()});
    version.expansion_index[index] = &version.expansion_rules.back();
  }
  return true;
}
#endif

#ifdef TOWER_EXPANSION_SEED
#include "bootstrap/syntax-expansion-seed.inc"
#else
struct ExpansionHost {
  std::vector<std::shared_ptr<const SyntaxExpansion>> traces;
};

bool expand(SyntaxSession& session, Node& root) {
  ExpansionHost host;
  SyntaxExpansionInput input{session.version->expansion_index.data(),
    session.version->expansion_index.size(), parser_match_get_type(), &host};
  SyntaxExpansionResult result{root.release(), session.expansion_stats.replacements,
    session.expansion_stats.generated_nodes, session.expansion_stats.copied_nodes,
    session.error_offset, {}};
  const bool ok = syntax_expand(&input, &result);
  root = owned(result.root);
  session.expansion_stats = {result.replacements, result.generated_nodes, result.copied_nodes};
  session.error_offset = result.error_offset;
  if (!ok) session.error = result.error.data
    ? std::string(reinterpret_cast<const char*>(result.error.data), result.error.length)
    : "Unable to allocate replacement expansion storage";
  syntax_expansion_result_dispose(&result);
  return ok;
}
#endif
}

const SyntaxOrigin* syntax_get_origin(TowerNode* node) {
  return (const SyntaxOrigin*)tower_node_get_component_userdata(node, origin_type);
}
void syntax_copy_origin(TowerNode* source, TowerNode* destination) {
  if (auto* previous = syntax_get_origin(source)) {
    auto* copy = origin(destination); if (!copy) std::abort(); *copy = *previous;
  }
}
#ifndef TOWER_EXPANSION_SEED
extern "C" void syntax_replacement_begin(void* context, const char* name, TowerNode* sequence, size_t start, size_t end) {
  auto& host = *static_cast<ReplacementPlanHost*>(context);
  host.current = Replacement{}; host.current.rule = name;
  host.current.start = start; host.current.end = end;
  host.sequence = TowerNodeRef(sequence); host.selected = owned(nullptr); host.selected_uses.clear();
}
extern "C" void syntax_replacement_capture(void* context, const char* name, TowerNode* source) {
  static_cast<ReplacementPlanHost*>(context)->current.captures[name] = TowerNodeRef(source);
}
extern "C" unsigned syntax_replacement_attempt(void* context, const char* category) {
  auto& host = *static_cast<ReplacementPlanHost*>(context);
  host.current.category = category; host.diagnostic.clear();
  bool grammar_error = false;
  const bool ok = compile_template(host.version, host.definitions, host.sequence, host.current, host.diagnostic, grammar_error);
  return ok ? 1 : grammar_error ? 2 : 0;
}
extern "C" const char* syntax_replacement_diagnostic(void* context) {
  return static_cast<ReplacementPlanHost*>(context)->diagnostic.c_str();
}
extern "C" size_t syntax_replacement_offset(void* context) {
  return static_cast<ReplacementPlanHost*>(context)->current.error_offset;
}
extern "C" void syntax_replacement_select(void* context) {
  auto& host = *static_cast<ReplacementPlanHost*>(context);
  host.selected = std::move(host.current.tree); host.selected_category = host.current.category;
  host.selected_uses = std::move(host.current.uses);
}
extern "C" void syntax_replacement_commit(void* context, size_t alternative) {
  auto& host = *static_cast<ReplacementPlanHost*>(context);
  host.current.tree = std::move(host.selected); host.current.category = std::move(host.selected_category);
  host.current.uses = std::move(host.selected_uses);
  auto index = host.version.indices.at({host.current.rule, alternative});
  host.version.replacements.emplace(index, std::move(host.current));
}
extern "C" const void* syntax_expansion_history(TowerNode* node) {
  auto* previous = syntax_get_origin(node); return previous ? previous->expansion.get() : nullptr;
}
extern "C" const void* syntax_expansion_previous(const void* trace) {
  return static_cast<const SyntaxExpansion*>(trace)->previous.get();
}
extern "C" size_t syntax_expansion_trace(void* context, const SyntaxExpansionRule* rule, TowerNode* invocation) {
  auto& host = *static_cast<ExpansionHost*>(context);
  auto trace = std::make_shared<SyntaxExpansion>();
  trace->rule = rule->rule;
  auto* span = match(invocation);
  trace->start = parser_match_get_start(span); trace->end = trace->start + parser_match_get_length(span);
  trace->definition_start = rule->start; trace->definition_end = rule->end;
  if (auto* previous = syntax_get_origin(invocation)) trace->previous = previous->expansion;
  host.traces.push_back(std::move(trace)); return host.traces.size() - 1;
}
extern "C" bool syntax_expansion_copy_origin(TowerNode* source, TowerNode* destination) {
  auto* previous = syntax_get_origin(source); if (!previous) return true;
  auto* copy = origin(destination); if (!copy) return false; *copy = *previous; return true;
}
extern "C" bool syntax_expansion_origin(void* context, size_t trace_index, TowerNode* node, TowerNode* source, bool generated) {
  auto& trace = static_cast<ExpansionHost*>(context)->traces.at(trace_index);
  const bool splice = !generated && syntax_get_origin(node);
  auto* value = origin(node); if (!value) return false;
  if (splice) value->splices.push_back(trace);
  else {
    value->generated = generated; value->expansion = trace;
    auto* span = match(source); value->template_start = parser_match_get_start(span);
    value->template_end = value->template_start + parser_match_get_length(span);
  }
  return true;
}
#endif
SyntaxExpansionStats syntax_get_expansion_stats(SyntaxSession* session) { return session->expansion_stats; }

#ifdef TOWER_EXPANSION_TESTS
extern "C" size_t syntax_expansion_tests(const SyntaxExpansionInput*, TowerNode*);
size_t syntax_expansion_test_entry() {
  ExpansionHost host;
  SyntaxExpansionInput input{nullptr, 0, parser_match_get_type(), &host};
  FrontendKinds kinds{parser_rule_get_type(), parser_reference_get_type(), parser_string_get_type(),
    parser_range_get_type(), parser_match_get_type(), syntax_component_type()};
  if (auto status = frontend_bedrock_tests(&kinds)) return status;
  if (auto status = frontend_modules_tests()) return status;
  return syntax_expansion_tests(&input, syntax_native_bedrock());
}
#endif

SyntaxSession* syntax_create(const char* source, FrontendModule* module) {
  auto session = std::make_unique<SyntaxSession>();
  session->module = module ? module : frontend_module_root(source, syntax_modules);
  session->owns_module = !module;
  if (const auto* grammar = module ? frontend_module_grammar(module) : nullptr) {
    for (size_t i = 0; i < grammar->rules.length; ++i) {
      const auto& rule = grammar->rules.data[i];
      auto& alternatives = session->baseline_definitions[std::string(rule.name, rule.name_length)];
      for (size_t j = 0; j < rule.count; ++j) alternatives.emplace_back(rule.alternatives[j]);
    }
    for (size_t i = 0; i < grammar->tokens.length; ++i) session->baseline.emplace_back(grammar->tokens.data[i]);
    session->bedrock = native_bedrock();
    syntax_reset(session.get(), source);
    return session.release();
  }
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

void syntax_reset(SyntaxSession* session, const char* source, FrontendModule* module) {
  if (module) session->module = module;
  // Preserve the recoverable source-allocation boundary before module rebuilding.
  // A failed reset clears version, but the next successful reset must still
  // replace the old module graph rather than reuse its recorded declarations.
  const bool replace_module = session->owns_module && session->source_info;
  bool source_ready = set_source(*session, source,
    session->module ? frontend_module_name(session->module) : session->building_bedrock ? "bedrock.tower" : session->bootstrapping ? "foundation.tower" : "this file");
  if (source_ready && replace_module) {
    frontend_module_destroy(session->module);
    session->module = frontend_module_root(session->source_info->text.c_str(), syntax_modules);
    const auto* name = frontend_module_name(session->module);
    if (session->source_info->name.view() != name) source_ready = set_source(*session, session->source, name);
  }
  session->cursor = session->revision = session->error_offset = 0;
  session->error_insertion = false;
#ifdef TOWER_EXPANSION_SEED
  session->builds = session->hits = 0;
#else
  session->cache.builds = session->cache.hits = 0;
#endif
  session->expansion_stats = {};
  session->finalized = false; session->declarations_only = true; session->comment_cursor = 0;
  session->error.clear(); session->highlights.clear(); session->definitions = session->baseline_definitions;
  session->declaration = false; session->tokens = session->baseline;
  session->document = TowerNodeRef::adopt(tower_node_create());
  syntax_attach(session->document.get(), SyntaxKind::Document);
  if (!source_ready) { session->error = "Unable to allocate source text"; session->version.reset(); return; }
  session->version = compiled(*session, session->definitions, session->tokens, session->error);
}
SyntaxCacheStats syntax_get_cache_stats(SyntaxSession* session) {
#ifdef TOWER_EXPANSION_SEED
  return {session->builds, session->hits, session->cache.size()};
#else
  return {session->cache.builds, session->cache.hits, session->cache.entries.length};
#endif
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
  copy.building_bedrock = session->building_bedrock;
#ifdef TOWER_EXPANSION_SEED
  copy.cache = session->cache;
#else
  if (frontend_cache_copy(&copy.cache, &session->cache)) copy.versions = session->versions;
#endif
  copy.formatting = true; syntax_reset(&copy, session->source.data());
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
  verify.building_bedrock = copy.building_bedrock; verify.formatting = true;
#ifdef TOWER_EXPANSION_SEED
  verify.cache = copy.cache;
#else
  if (frontend_cache_copy(&verify.cache, &copy.cache)) verify.versions = copy.versions;
#endif
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
    declaration.comments.emplace_back(session.source.substr(token.start, token.end - token.start));
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
    if (session->completing) {
      session->completion.reset(parser_table_completion(session->version->table));
      session->completion_version = session->version;
    }
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
      if (session->completing) parser_recognizer_capture_completion(recognizer.get());
      bool running = true;
      while (running) root = owned(parser_recognizer_step(recognizer.get(), &running));
      session->recognizer = nullptr;
      if (!root) {
        if (session->completing) {
          session->completion.reset(parser_recognizer_take_completion(recognizer.get()));
          session->completion_version = session->version;
        }
        return fail(syntax_diagnostic(*session, recognizer.get()));
      }
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
    if (construct_kind == "ImportDeclaration") {
      if (!session->module) { session->module = frontend_module_root(session->source_info->text.c_str(), syntax_modules); session->owns_module = true; }
      if (!frontend_module_import(session->module, construct, session->source_info.get())) return fail(frontend_module_error(session->module));
      const auto* grammar = frontend_module_grammar(session->module);
      session->definitions.clear(); session->tokens.clear();
      for (size_t i = 0; i < grammar->rules.length; ++i) {
        const auto& rule = grammar->rules.data[i];
        auto& alternatives = session->definitions[std::string(rule.name, rule.name_length)];
        for (size_t j = 0; j < rule.count; ++j) alternatives.emplace_back(rule.alternatives[j]);
      }
      for (size_t i = 0; i < grammar->tokens.length; ++i) session->tokens.emplace_back(grammar->tokens.data[i]);
      std::string error;
      auto version = compiled(*session, session->definitions, session->tokens, error);
      if (!version) return fail(error);
      session->version = std::move(version);
      ++session->revision;
    }
    if (construct_kind == "GrammarTokenDeclaration" || construct_kind == "GrammarSkipDeclaration") {
      session->error_offset = construct_start;
      auto error = read_declaration(construct, session->source_info.get(),
        construct_kind == "GrammarSkipDeclaration" ? SyntaxKind::Skip : SyntaxKind::Token);
      if (!error.empty()) return fail(error);
      auto& token = syntax_node(construct);
      if (session->definitions.contains(token.name)) return fail("Name already defines a parse rule: " + token.name);
#ifdef TOWER_EXPANSION_SEED
      for (const auto& entry : session->cache) for (const auto& old : entry.tokens)
        if (semantic(old).text == token.text) syntax_node_pattern(&token, semantic(old).compiled);
#else
      frontend_cache_pattern(&session->cache, construct, syntax_component_type());
#endif
      if (!token.compiled) { auto pattern = lex_pattern_compile(token.text, error); syntax_node_pattern(&token, pattern.get()); }
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
      auto error = read_declaration(construct, session->source_info.get(), SyntaxKind::Rule);
      if (!error.empty()) return fail(error);
      auto& rule = syntax_node(construct);
      const std::string name = rule.name;
      Alternatives alternatives;
      for (auto* item : rule.items) alternatives.emplace_back(item);
      Definitions candidate = session->definitions;
      if (rule.append) {
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
      // Grammar roles apply only to grammar names/references and captures.
      // Imports and `as style` values are ordinary identifiers, not rule names.
      // Patterns, quoted paths and replacement bodies keep their token styles.
      bool capture = false;
      auto* declared_name = match(member(construct, "name"));
      size_t template_start = TOWER_INVALID_INDEX;
      if (declaration.replacement) template_start = semantic(declaration.replacement).start - 1;
      for (auto& token : session->highlights) {
        if (token.start < construct_start) continue;
        if (token.start >= template_start) continue;
        if (token.kind == "comment") continue;
        if (token.kind == "identifier") {
          if (construct_kind == "GrammarDeclaration") token.kind = capture ? "capture" : "rule";
          else if ((construct_kind == "GrammarTokenDeclaration" || construct_kind == "GrammarSkipDeclaration") &&
                   token.start == parser_match_get_start(declared_name) &&
                   token.end == parser_match_get_start(declared_name) + parser_match_get_length(declared_name)) token.kind = "rule";
        }
        capture = session->source.substr(token.start, token.end - token.start) == "$";
      }
    } else {
      session->declarations_only = false;
      if (!session->formatting && !session->version->replacements.empty()) {
#ifdef TOWER_EXPANSION_SEED
        Expander expander{*session};
        if (!expander.run(root)) return nullptr;
#else
        if (!expand(*session, root)) return nullptr;
#endif
      }
      session->comment_cursor = session->cursor;
    }
    if (session->module && !session->formatting) frontend_module_record(session->module, root.get(), session->declaration);
    return root.release();
  }
}

std::vector<SyntaxHighlight> syntax_get_lexemes(SyntaxSession* session) {
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
  // Token overrides replace their existing ordered slot, while additions append.
  // Resolve the private lexical id back to its shared declaration metadata;
  // changing `as style` must never turn identifiers into strings or comments.
  for (auto& span : result) if (span.token >= FirstToken && span.token - FirstToken < session->tokens.size())
    span.opaque = span.opaque || semantic(session->tokens[span.token - FirstToken]).name == "GrammarPattern";
  return result;
}

std::vector<SyntaxHighlight> syntax_get_highlights(SyntaxSession* session) {
  auto result = syntax_get_lexemes(session);
  std::erase_if(result, [](const auto& span) { return span.kind.empty(); });
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
  frontend_modules_reset_compilation(syntax_modules);
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
  frontend_modules_reset_compilation(syntax_modules);
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
extern "C" __attribute__((export_name("tw_set_bootstrap"))) const char* syntax_wasm_bootstrap(const char* source, size_t bytes, ModuleEnvironment* environment) {
  if (environment) syntax_modules = environment;
  static std::string error;
  if (!source || bytes > 65536 || std::string(source, bytes).find('\0') != std::string::npos)
    error = "Bootstrap must be at most 64 KiB without NUL bytes";
  else { std::string copy(source, bytes); error = syntax_set_bootstrap(copy.c_str()); }
  return error.c_str();
}
#endif

extern "C" SyntaxSession* syntax_completion_create(const char* source, unsigned mode) {
  return mode == 2 ? syntax_create_bedrock(source) : mode == 1 ? syntax_create_foundation(source) : syntax_create(source);
}
extern "C" void syntax_completion_enable(SyntaxSession* session) { session->completing = true; }
extern "C" FrontendModule* syntax_completion_module(SyntaxSession* session) { return session->module; }
static uint32_t completion_token(SyntaxSession* session, const char* text) {
  if (!session->completion) return PARSER_ID_EOF;
#ifdef TOWER_EXPANSION_SEED
  return PARSER_ID_EOF; // The seed has no editor host; the Tower scanner replaces it.
#else
  ParserLookahead context{lr_completion_runtime(session->completion.get()), lr_completion_state(session->completion.get())};
  auto input = scan_input(*session, 0, nullptr, &context);
  input.source = text; input.size = std::strlen(text);
  SyntaxScanResult result{};
  syntax_scan_token(&input, &result);
  const bool complete = !result.error && result.start == 0 && result.length == input.size;
  const auto id = complete ? result.id : PARSER_ID_EOF;
  syntax_scan_dispose(&result);
  return id;
#endif
}
extern "C" bool syntax_completion_identifier(SyntaxSession* session, const char* text) {
  return completion_token(session, text) == MetaName && lr_completion_accepts(session->completion.get(), MetaName);
}
extern "C" bool syntax_completion_accepts(SyntaxSession* session, const char* text, bool literal) {
  if (!session->completion) return false;
  uint32_t id = PARSER_ID_EOF;
  if (literal) {
    auto found = session->completion_version->literals.find(text);
    if (found == session->completion_version->literals.end()) return false;
    id = found->second;
  } else id = completion_token(session, text);
  return lr_completion_accepts(session->completion.get(), id);
}
extern "C" bool syntax_completion_callable(SyntaxSession* session) {
  if (!session->completion) return false;
  auto found = session->completion_version->literals.find("(");
  return found != session->completion_version->literals.end() &&
    lr_completion_follows(session->completion.get(), MetaName, found->second);
}
extern "C" const char* syntax_completion_close(SyntaxSession* session, const char* type_name) {
  if (!session->completion) return nullptr;
  std::vector<std::string> words;
  std::vector<uint32_t> ids;
  const auto& version = *session->completion_version;
  // Prioritize terminators. The search itself is Tower LR simulation; these
  // spellings are merely concrete lexer inputs for its scratch parse snapshot.
  const auto add = [&](const std::string& text, uint32_t id) { words.push_back(text); ids.push_back(id); };
  for (const char* text : {";", ")", "]", "}", "{", "=", "false", "true", "null"}) {
    auto found = version.literals.find(text);
    if (found != version.literals.end()) add(found->first, found->second);
  }
  for (const auto& [text, id] : version.literals) {
    if (text == "(" || text == "[" || text == "." || text == ",") continue;
    if (std::find(words.begin(), words.end(), text) == words.end()) add(text, id);
  }
  for (size_t i = 0; i < version.tokens.size(); ++i)
    if (semantic(version.tokens[i]).name == "Number") add("0", token_id("Number", i));
  // A supplied foundation type can complete an unwritten signature tail.
  // Its spelling comes from the shared Tower semantic definitions.
  add(type_name, MetaName);
  std::array<size_t, 24> path;
  auto size = lr_completion_suffix(session->completion.get(), ids.data(), ids.size(), path.data(), path.size());
  if (size == TOWER_INVALID_INDEX) return nullptr;
  session->completion_suffix.clear();
  for (size_t i = 0; i < size; ++i) { session->completion_suffix += ' '; session->completion_suffix += words[path[i]]; }
  return session->completion_suffix.c_str();
}
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
