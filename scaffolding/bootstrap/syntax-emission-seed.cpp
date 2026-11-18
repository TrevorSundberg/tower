// Transitional bootstrap/reference for syntax-emission.tower. The production
// compiler uses Tower; these algorithms retain the pre-port native behavior.
#include "../compiler-syntax-emission.hpp"
#include "../parser.hpp"
#include <map>
#include <set>
#include <string>
#include <vector>
#include <memory>
namespace {
constexpr uint32_t MetaName=0x110000, MetaString=MetaName+1, FirstToken=0x120000, FirstLiteral=0x200000;
using Sequence=TowerNodeRef;
using Definitions=std::map<std::string,std::vector<Sequence>>;
using TokenDefinitions=std::vector<TowerNodeRef>;
using Term=TowerNodeRef;
SyntaxNode& semantic(TowerNode* node) { return syntax_node(node); }
SyntaxNode& semantic(const TowerNodeRef& node) { return syntax_node(node.get()); }
struct Version {
  struct Root { TowerNode* node; TowerNode* get() const { return node; } } rules;
  std::map<std::string,uint32_t> literals;
  std::map<uint32_t,std::string> names;
  TokenDefinitions tokens;
  std::set<std::string> used_names;
  std::map<std::string,std::string> template_tokens;
  std::map<std::string,TowerNode*> capture_sources;
  std::map<TowerNode*,std::string> capture_names;
  std::map<std::string,uint32_t> declaration_literals;
  std::set<std::string> declaration_starts;
  std::map<size_t,std::pair<std::string,size_t>> productions;
  std::map<std::pair<std::string,size_t>,size_t> indices;
  std::map<std::string,size_t> named_indices;
  std::map<std::string,Term> repetitions;
  bool templating=false;
  size_t helper=0;
};
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


}
struct SyntaxEmission {
  Version version;
  std::vector<std::string> names;
  std::vector<SyntaxEmissionProduction> productions;
  std::vector<SyntaxEmissionHelper> helpers;
};
extern "C" {
SyntaxEmission* syntax_emit(const SyntaxEmissionInput* input) {
  auto result=std::make_unique<SyntaxEmission>(); auto& v=result->version;
  v.rules.node=input->root; v.templating=input->category!=nullptr;
  Definitions definitions;
  for(size_t i=0;i<input->count;++i) {
    const auto& rule=input->rules[i]; auto name=std::string(rule.name,rule.name_length);
    auto& list=definitions[name]; v.used_names.insert(name);
    for(size_t a=0;a<rule.count;++a) list.emplace_back(rule.alternatives[a]);
  }
  for(size_t i=0;i<input->token_count;++i) { v.tokens.emplace_back(input->tokens[i]); v.used_names.insert(semantic(input->tokens[i]).name); }
  for(size_t i=0;i<input->reserved_count;++i) v.used_names.insert(input->reserved[i]);
  for(size_t i=0;i<input->literal_count;++i) { const auto& x=input->literals[i]; v.literals.emplace(std::string(x.text,x.length),x.id); }
  if(!v.templating) seed(v,definitions);
  else {
    reference(production(v,helper_name(v,"template")),input->category);
    for(const auto& [name,alternatives]:definitions) for(size_t i=0;i<alternatives.size();++i) emit(v,name,alternatives[i],i);
    for(const auto& entity:v.tokens) { const auto& token=semantic(entity); if(token.kind!=SyntaxKind::Skip) reference(production(v,template_token(v,token.name),true),token.name); }
  }
  auto names=v.used_names;
  for(const auto& [text,id]:v.literals) names.insert(text);
  for(const auto& [text,id]:v.declaration_literals) names.insert(text);
  names.insert(v.declaration_starts.begin(),v.declaration_starts.end());
  result->names.assign(names.begin(),names.end());
  for(const auto& [index,key]:v.productions) result->productions.push_back({key.first.c_str(),key.second,index});
  for(const auto& [name,source]:v.repetitions) result->helpers.push_back({name.c_str(),source.get(),false});
  for(const auto& [name,source]:v.capture_sources) result->helpers.push_back({name.c_str(),source,true});
  return result.release();
}
void syntax_emission_destroy(SyntaxEmission* value) { delete value; }
size_t syntax_emission_name_count(const SyntaxEmission* value) { return value->names.size(); }
void syntax_emission_name(const SyntaxEmission* value,size_t index,SyntaxEmissionName* out) {
  const auto& name=value->names[index]; const auto& v=value->version;
  auto literal=v.literals.find(name); auto wrapper=v.template_tokens.find(name);
  *out={name.data(),name.size(),wrapper==v.template_tokens.end()?nullptr:wrapper->second.c_str(),
    literal==v.literals.end()?PARSER_ID_EOF:literal->second,v.used_names.contains(name),v.declaration_literals.contains(name),v.declaration_starts.contains(name)};
}
size_t syntax_emission_production_count(const SyntaxEmission* value) { return value->productions.size(); }
void syntax_emission_production(const SyntaxEmission* value,size_t index,SyntaxEmissionProduction* out) { *out=value->productions[index]; }
size_t syntax_emission_helper_count(const SyntaxEmission* value) { return value->helpers.size(); }
void syntax_emission_helper(const SyntaxEmission* value,size_t index,SyntaxEmissionHelper* out) { *out=value->helpers[index]; }
}
