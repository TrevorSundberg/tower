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
#include "compiler-format.hpp"
#include <array>
#include <cassert>
#include <cstring>
#include <map>
#include <memory>
#include <string>
#include <vector>

ModuleEnvironment* syntax_modules = nullptr;

namespace {
extern "C" bool syntax_parser_diagnostic_read(void*, size_t*, const ParserLookahead*, uint32_t*);
constexpr uint32_t MetaName = 0x110000, MetaString = MetaName + 1;
constexpr uint32_t FirstToken = 0x120000;

using Node = std::unique_ptr<TowerNode, decltype(&tower_node_release_ref)>;
Node owned(TowerNode* node) { return Node(node, tower_node_release_ref); }

using Term = TowerNodeRef;
using Sequence = TowerNodeRef;
using Revision = std::shared_ptr<const FrontendRevision>;
using PendingRules = std::unique_ptr<SyntaxPendingRevision, decltype(&syntax_pending_destroy)>;
SyntaxNode& semantic(const TowerNodeRef& node) { return syntax_node(node.get()); }
SyntaxNode& semantic(TowerNode* node) { return syntax_node(node); }

struct Replacement {
  std::string rule, category;
  size_t start = 0, end = 0;
  size_t error_offset = 0;
  Node tree = owned(nullptr);
  std::map<std::string, Term> captures;
  std::map<std::string, size_t> uses;
};

struct Version {
  Revision grammar; // pinned shared source entities and immutable lookup views
  Node rules = owned(tower_node_create());
  Table* table = nullptr;
  SyntaxLexicon* lexicon = nullptr;
  std::unique_ptr<SyntaxEmission, decltype(&syntax_emission_destroy)> emission{nullptr, syntax_emission_destroy};
  PendingRules pending{nullptr, syntax_pending_destroy};
  Revision bedrock;
  std::map<size_t, Replacement> replacements;
  std::vector<std::vector<SyntaxExpansionCapture>> expansion_captures;
  std::vector<SyntaxExpansionRule> expansion_rules;
  std::vector<const SyntaxExpansionRule*> expansion_index;
  size_t replacement_error_offset = TOWER_INVALID_INDEX;
  ~Version() { lexicon_destroy(lexicon); parser_table_destroy(table); }
};

char* copy_string(const std::string& text) {
  auto* result = (char*)tower_memory_allocate(text.size() + 1);
  memcpy(result, text.c_str(), text.size() + 1);
  return result;
}

std::string describe_production(const Version& version, const Revision& definitions, size_t index, bool name_only = false) {
  auto* found = syntax_emission_find_index(version.emission.get(), index);
  if (!found) return {};
  auto* rule = syntax_revision_rule(definitions.get(), found->name, std::strlen(found->name));
  if (!rule || found->alternative >= rule->count) return {};
  auto* text = syntax_description_text(rule->alternatives[name_only ? 0 : found->alternative], found->name, name_only,
    syntax_component_type(), parser_match_get_type());
  std::string result(text); tower_memory_free(text); return result;
}
extern "C" char* syntax_parser_describe(void* context, size_t index) {
  const auto& v = *static_cast<Version*>(context);
  // Generated repetition/capture rules refer back to the user's term.
  auto text = describe_production(v, v.grammar, index);
  if (!text.empty()) return copy_string(text);
  auto* node = index ? tower_node_get_child(v.rules.get(), index - 1) : nullptr;
  if (!node) return copy_string("start of input");
  auto* rule = static_cast<Rule*>(tower_node_get_component_userdata(node, parser_rule_get_type()));
  const auto* helper = syntax_emission_find_helper(v.emission.get(), parser_rule_get_name(rule));
  if (helper) return syntax_origin_text(helper->source, helper->capture ? "capture " : "repetition ",
    syntax_component_type(), parser_match_get_type());
  return copy_string("start of a statement or grammar declaration");
}

bool build_lexicon(Version& version) {
  assert(!version.lexicon);
  version.lexicon = syntax_emission_lexicon(version.emission.get());
  return version.lexicon != nullptr;
}
extern "C" uint32_t syntax_parser_resolve(void* context, const char* name) {
  return syntax_emission_terminal(((Version*)context)->emission.get(), name);
}

extern "C" char* syntax_parser_token_name(void* context, uint32_t id) {
  auto& version = *(Version*)context;
  return syntax_emission_token_text(version.emission.get(), id);
}

// Borrowed source views; Tower owns the derived revision indexes.
bool seed(Version& version, const Revision& definitions, const char* category = nullptr, const SyntaxEmission* parent = nullptr) {
  std::vector<const char*> reserved;
  for (size_t i = 0; i < syntax_pending_count(version.pending.get()); ++i)
    reserved.push_back(syntax_pending_name(version.pending.get(), i));
  SyntaxEmissionInput input{definitions->rules.data, definitions->rules.length, definitions->tokens.data, definitions->tokens.length,
    reserved.data(), reserved.size(), nullptr, 0, category,
    version.rules.get(), syntax_component_type(), parser_rule_get_type(), parser_reference_get_type(),
    parser_string_get_type(), parser_range_get_type()};
  auto& emitted = version.emission;
  emitted.reset(syntax_emit_inherit(&input, parent));
  return emitted != nullptr;
}

std::string validate(Revision& defs, size_t* error_offset, PendingRules& pending) {
  if (!defs) return "Unable to allocate grammar revision";
  std::vector<TowerNode*> waiting(defs->rules.length);
  TowerByteBuffer error{}; size_t location = TOWER_INVALID_INDEX;
  bool ok = syntax_validate(defs->rules.data, defs->rules.length, defs->tokens.data, defs->tokens.length, syntax_component_type(),
    &error, error_offset ? error_offset : &location, waiting.data());
  std::string message = ok ? "" : error.length ? std::string(reinterpret_cast<const char*>(error.data), error.length)
    : "Unable to allocate grammar validation";
  bytes_dispose(&error);
  SyntaxPendingRevision* revision = nullptr;
  if (ok && !syntax_pending_create(defs->rules.data, defs->rules.length, waiting.data(), syntax_component_type(), &revision))
    return "Unable to allocate grammar validation";
  pending.reset(revision);
  // Only the executable revision excludes pending rules. Source entities survive.
  if (ok) {
    Revision ready(syntax_revision_ready(defs.get(), waiting.data()), frontend_revision_release);
    if (!ready) return "Unable to allocate grammar validation";
    defs = std::move(ready);
  }
  return message;
}

bool prepare_replacements(Version& version, const Revision& defs, std::string& message);
std::unique_ptr<Version> build(const Revision& defs,
    Revision bedrock, std::string& message, size_t* error_offset) {
  // Import by reference: both readers and downstream grammars use the original
  // semantic entities until a local declaration replaces or extends a binding.
  Revision definitions(syntax_revision_overlay(bedrock.get(),
    defs ? defs->rules.data : nullptr, defs ? defs->rules.length : 0,
    defs ? defs->tokens.data : nullptr, defs ? defs->tokens.length : 0, syntax_component_type()), frontend_revision_release);
  PendingRules pending{nullptr, syntax_pending_destroy};
  message = validate(definitions, error_offset, pending);
  if (!message.empty()) return nullptr;
  auto v = std::make_unique<Version>();
  v->grammar = definitions;
  v->pending = std::move(pending);
  v->bedrock = std::move(bedrock);
  if (!seed(*v, definitions)) { message = "Unable to allocate grammar construction"; return nullptr; }
  char* error = nullptr;
  v->table = parser_table_create(v->rules.get(), v.get(), ParserPresentation::Syntax, &error, ParserTableMode::Constructs);
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
  SyntaxSessionInputs inputs{compiler_host_world(), syntax_modules};
  std::string_view source; // Borrowed from the Tower-owned source snapshot.
  size_t cursor = 0;
  size_t revision = 0;
  Revision grammar, baseline;
  Recognizer* recognizer = nullptr; // borrowed only while reading this stream
  bool completing = false;
  std::unique_ptr<LRCompletion, decltype(&lr_completion_destroy)> completion{nullptr, lr_completion_destroy};
  std::shared_ptr<Version> completion_version;
  std::unique_ptr<char, decltype(&tower_memory_free)> completion_suffix{nullptr, tower_memory_free};
  bool bootstrapping = false, declaration = false;
  bool building_bedrock = false, finalized = false, declarations_only = true;
  bool formatting = false;
  size_t comment_cursor = 0;
  Revision bedrock;
  std::shared_ptr<Version> version;
  FrontendCache cache{};
  std::array<std::shared_ptr<Version>, SYNTAX_MAX_CACHED_GRAMMARS> versions;
  ~SyntaxSession() { frontend_cache_dispose(&cache); syntax_session_inputs_dispose(&inputs); }
  SyntaxExpansionStats expansion_stats;
  std::string error;
  size_t error_offset = 0;
  bool error_insertion = false;
  std::vector<SyntaxHighlight> highlights;
};

namespace {
std::string syntax_diagnostic(SyntaxSession& session, Recognizer* recognizer, bool repairs = true) {
  const std::unique_ptr<ParserDiagnostic, decltype(&parser_diagnostic_destroy)> diagnostic(
    parser_recognizer_diagnostic(recognizer, repairs ? ParserDiagnosticReader::Syntax : ParserDiagnosticReader::None, &session), parser_diagnostic_destroy);
  // Cached tables retain their original declarations; diagnostic provenance
  // follows the current source revision, including source-only edits.
  Revision definitions(syntax_revision_overlay(session.bedrock.get(),
    session.grammar ? session.grammar->rules.data : nullptr, session.grammar ? session.grammar->rules.length : 0,
    nullptr, 0, syntax_component_type()), frontend_revision_release);
  const SyntaxDiagnosticInput input{session.source.data(), session.source.size(), session.cursor,
    diagnostic->offset, diagnostic->insertion_offset, parser_recognizer_get_error(recognizer),
    diagnostic->options.data, diagnostic->options.length,
    syntax_emission_literal_ids(session.version->emission.get()), syntax_emission_literal_count(session.version->emission.get()),
    syntax_emission_productions(session.version->emission.get()), syntax_emission_production_count(session.version->emission.get()),
    repairs, diagnostic->complete, diagnostic->at_start, syntax_revision_rule(definitions.get(), "Statement", 9) != nullptr};
  SyntaxDiagnosticText output{};
  format_syntax_diagnostic(&input, &output);
  if (output.insertion) { session.error_offset = diagnostic->insertion_offset; session.error_insertion = true; }
  const auto description = describe_production(*session.version, definitions, output.production, output.multiple);
  auto* text = syntax_diagnostic_text_finish(&output, description.c_str());
  std::string result(text); tower_memory_free(text); return result;
}

std::shared_ptr<Version> compiled(SyntaxSession& session, const Revision& definitions, std::string& error) {
  if (!definitions) { error = "Unable to allocate grammar revision"; return nullptr; }
  const auto slot = frontend_cache_find(&session.cache, definitions->rules.data, definitions->rules.length,
    definitions->tokens.data, definitions->tokens.length, syntax_component_type());
  if (slot != TOWER_INVALID_INDEX) { error.clear(); return session.versions[slot]; }
  std::shared_ptr<Version> version = build(definitions, session.bedrock, error, &session.error_offset);
  if (version) {
    const auto stored = frontend_cache_store(&session.cache, definitions->rules.data, definitions->rules.length, definitions->tokens.data, definitions->tokens.length);
    if (stored != TOWER_INVALID_INDEX) session.versions[stored] = version;
  }
  return version;
}

extern "C" void syntax_scan_highlight(void* host, size_t start, size_t end, size_t revision, const char* style, uint32_t id, bool skipped) {
  static_cast<std::vector<SyntaxHighlight>*>(host)->push_back({start, end, revision, style, skipped || id == MetaString, id});
}
SyntaxScanInput scan_input(const SyntaxSession& session, size_t pos, std::vector<SyntaxHighlight>* highlights,
    const ParserLookahead* expected = nullptr) {
  ParserLookahead context;
  if (expected) context = *expected; else parser_request_lookahead(session.recognizer, &context);
  SyntaxScanInput input{};
  input.lexicon = session.version->lexicon; input.source = session.source.data(); input.size = session.source.size();
  input.cursor = pos; input.revision = session.revision;
  input.declaration = session.declaration; input.bootstrapping = session.bootstrapping;
  input.runtime = context.runtime; input.state = context.state; input.highlights = highlights;
  input.context = session.version->rules.get(); input.match_kind = parser_match_get_type();
  return input;
}
extern "C" bool syntax_parser_diagnostic_read(void* context, size_t* pos, const ParserLookahead* expected, uint32_t* id) {
  auto input = scan_input(*static_cast<SyntaxSession*>(context), *pos, nullptr, expected);
  const bool ok = syntax_scan_peek(&input, id);
  *pos = input.cursor;
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
extern "C" TowerNode* syntax_parser_read(Stream* stream, void* userdata, uint32_t* id, size_t* start, size_t* length) {
  auto& session = **static_cast<SyntaxSession**>(userdata);
  auto input = scan_input(session, session.cursor, &session.highlights);
  return read_scan(stream, session, input, id, start, length);
}
struct TemplateInput {
  SyntaxSession session;
  const SyntaxTemplateCapture* captures = nullptr;
  size_t count = 0, base = 0;
};
extern "C" TowerNode* syntax_parser_template_read(Stream* stream, void* userdata, uint32_t* id, size_t* start, size_t* length) {
  auto& host = **static_cast<TemplateInput**>(userdata);
  auto input = scan_input(host.session, host.session.cursor, &host.session.highlights);
  input.replacement = true; input.captures = host.captures; input.count = host.count; input.base = host.base;
  return read_scan(stream, host.session, input, id, start, length);
}

bool compile_template(Version& version, const Revision& defs, const Sequence& seq,
    Replacement& replacement, std::string& error, bool& grammar_error) {
  grammar_error = false;
  replacement.error_offset = replacement.start;
  replacement.uses.clear();
  auto grammar = std::make_shared<Version>();
  grammar->grammar = defs;
  grammar->bedrock = version.bedrock;
  if (!seed(*grammar, defs, replacement.category.c_str(), version.emission.get())) {
    error = "Unable to allocate replacement grammar"; return false;
  }
  TemplateInput input;
  input.base = replacement.start;
  const auto& text = semantic(semantic(seq).replacement).text;
  if (!syntax_session_inputs_source(&input.session.inputs, text.data(), text.size(), "replacement")) {
    error = "Unable to allocate replacement source text"; return false;
  }
  input.session.source = input.session.inputs.source->text.view();
  input.session.grammar = defs;
  input.session.bedrock = version.bedrock;
  input.session.version = grammar;
  std::vector<SyntaxTemplateCapture> captures;
  for (const auto& [name, entity] : replacement.captures) {
    const auto& term = semantic(entity);
    captures.push_back({name.c_str(), entity.get(), syntax_emission_wrapper(grammar->emission.get(), term.text.c_str())});
  }
  input.captures = captures.data(); input.count = captures.size();
  SyntaxTemplateGrammar holes{};
  holes.emission.root = grammar->rules.get(); holes.emission.syntax_kind = syntax_component_type();
  holes.emission.rule_kind = parser_rule_get_type(); holes.emission.reference_kind = parser_reference_get_type();
  holes.emission.string_kind = parser_string_get_type();
  holes.captures = captures.data(); holes.count = captures.size();
  holes.repetitions = syntax_emission_repetitions(grammar->emission.get());
  holes.repetition_count = syntax_emission_repetition_count(grammar->emission.get());
  if (!syntax_template_holes_revision(&holes, grammar->emission.get())) { error = "Unable to allocate replacement hole productions"; return false; }
  char* diagnostic = nullptr;
  grammar->table = parser_table_create(grammar->rules.get(), grammar.get(), ParserPresentation::Syntax, &diagnostic,
    ParserTableMode::WholeInput);
  if (!grammar->table) {
    grammar_error = true;
    error = diagnostic ? diagnostic : "Cannot build replacement parser";
    if (diagnostic) tower_memory_free(diagnostic);
    return false;
  }
  if (!build_lexicon(*grammar)) { error = "Unable to allocate replacement lexical indexes"; return false; }
  std::unique_ptr<Stream, decltype(&parser_stream_destroy)> stream(
    parser_stream_create(sizeof(TemplateInput*), ParserInputService::Template), parser_stream_destroy);
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
  std::vector<size_t> uses(captures.size());
  SyntaxTemplateRemap remap{body, parser_match_get_type(),
    syntax_emission_productions(grammar->emission.get()), syntax_emission_production_count(grammar->emission.get()),
    syntax_emission_productions(version.emission.get()), syntax_emission_production_count(version.emission.get()),
    nullptr, 0, nullptr, 0,
    parser_table_grammar(version.table), uses.data(), uses.size()};
  if (!syntax_template_remap_revisions(&remap, grammar->emission.get(), version.emission.get())) { error = "Unable to allocate replacement template mapping"; return false; }
  for (size_t i = 0; i < captures.size(); ++i) if (uses[i]) replacement.uses[captures[i].name] = uses[i];
  return true;
}

struct ReplacementPlanHost {
  Version& version;
  const Revision& definitions;
  Replacement current;
  TowerNodeRef sequence;
  Node selected = owned(nullptr);
  std::string selected_category, diagnostic;
  std::map<std::string, size_t> selected_uses;
};

bool prepare_replacements(Version& version, const Revision& defs, std::string& message) {
  ReplacementPlanHost host{version, defs};
  SyntaxReplacementPlan plan{defs->rules.data, defs->rules.length, syntax_component_type(), &host, {}, TOWER_INVALID_INDEX};
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

bool expand(SyntaxSession& session, Node& root) {
  SyntaxExpansionInput input{session.version->expansion_index.data(),
    session.version->expansion_index.size(), parser_match_get_type()};
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
}

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
  auto index = syntax_emission_find_name(host.version.emission.get(), host.current.rule.c_str(), alternative);
  host.version.replacements.emplace(index, std::move(host.current));
}
SyntaxExpansionStats syntax_get_expansion_stats(SyntaxSession* session) { return session->expansion_stats; }

#ifdef TOWER_EXPANSION_TESTS
extern "C" size_t syntax_expansion_tests(const SyntaxExpansionInput*, TowerNode*);
size_t syntax_expansion_test_entry() {
  SyntaxExpansionInput input{nullptr, 0, parser_match_get_type()};
  FrontendKinds kinds{parser_rule_get_type(), parser_reference_get_type(), parser_string_get_type(),
    parser_range_get_type(), parser_match_get_type(), syntax_component_type()};
  if (auto status = frontend_bedrock_tests(&kinds)) return status;
  if (auto status = frontend_modules_tests()) return status;
  return syntax_expansion_tests(&input, syntax_native_bedrock());
}
#endif

SyntaxSession* syntax_create(const char* source, FrontendModule* module) {
  auto session = std::make_unique<SyntaxSession>();
  syntax_session_inputs_module(&session->inputs, source, module);
  if (const auto* grammar = module ? frontend_module_grammar(module) : nullptr) {
    session->baseline = Revision(syntax_revision_create(grammar->rules.data, grammar->rules.length,
      grammar->tokens.data, grammar->tokens.length), frontend_revision_release);
    session->bedrock = Revision(syntax_world_revision(compiler_host_world(), SyntaxBaselineMode::Seed), frontend_revision_release);
    if (!session->bedrock) { session->error = "Unable to allocate Bedrock revision"; return session.release(); }
    syntax_reset(session.get(), source);
    return session.release();
  }
  session->baseline = Revision(syntax_world_revision(compiler_host_world(), SyntaxBaselineMode::Foundation), frontend_revision_release);
  if (!session->baseline) { session->error = "Load foundation.tower before creating a syntax session"; return session.release(); }
  session->bedrock = Revision(syntax_world_revision(compiler_host_world(), SyntaxBaselineMode::Bedrock), frontend_revision_release);
  if (!session->bedrock) { session->error = "Unable to allocate Bedrock revision"; return session.release(); }
  syntax_reset(session.get(), source);
  return session.release();
}

SyntaxSession* syntax_create_foundation(const char* source) {
  auto session = std::make_unique<SyntaxSession>();
  session->bootstrapping = true;
  session->bedrock = Revision(syntax_world_revision(compiler_host_world(), SyntaxBaselineMode::Bedrock), frontend_revision_release);
  if (!session->bedrock) { session->error = "Unable to allocate Bedrock revision"; return session.release(); }
  session->baseline = session->bedrock;
  syntax_reset(session.get(), source);
  return session.release();
}

SyntaxSession* syntax_create_bedrock(const char* source) {
  auto session = std::make_unique<SyntaxSession>();
  session->bootstrapping = session->building_bedrock = true;
  session->bedrock = Revision(syntax_world_revision(compiler_host_world(), SyntaxBaselineMode::Seed), frontend_revision_release);
  if (!session->bedrock) { session->error = "Unable to allocate Bedrock revision"; return session.release(); }
  session->baseline = session->bedrock;
  syntax_reset(session.get(), source);
  return session.release();
}

void syntax_reset(SyntaxSession* session, const char* source, FrontendModule* module) {
  const bool source_ready = syntax_session_inputs_reset(&session->inputs, source, std::strlen(source),
    session->building_bedrock ? SyntaxBaselineMode::Seed : session->bootstrapping ? SyntaxBaselineMode::Bedrock : SyntaxBaselineMode::Foundation, module);
  session->source = session->inputs.source ? session->inputs.source->text.view() : std::string_view{};
  session->cursor = session->revision = session->error_offset = 0;
  session->error_insertion = false;
  session->cache.builds = session->cache.hits = 0;
  session->expansion_stats = {};
  session->finalized = false; session->declarations_only = true; session->comment_cursor = 0;
  session->error.clear(); session->highlights.clear(); session->grammar = session->baseline;
  session->declaration = false;
  if (!source_ready) { session->error = "Unable to allocate source text"; session->version.reset(); return; }
  session->version = compiled(*session, session->grammar, session->error);
}
SyntaxCacheStats syntax_get_cache_stats(SyntaxSession* session) {
  return {session->cache.builds, session->cache.hits, session->cache.entries.length};
}

void syntax_destroy(SyntaxSession* session) { delete session; }
const char* syntax_get_error(SyntaxSession* session) { return session->error.c_str(); }
size_t syntax_get_revision(SyntaxSession* session) { return session->revision; }
size_t syntax_get_offset(SyntaxSession* session) { return session->cursor; }
size_t syntax_get_error_offset(SyntaxSession* session) { return session->error_offset; }
bool syntax_get_error_insertion(SyntaxSession* session) { return session->error_insertion; }
TowerNode* syntax_document(SyntaxSession* session) { return session->inputs.document; }
bool syntax_can_format(SyntaxSession* session) {
  return session->error.empty() && session->finalized;
}
TowerText syntax_format(SyntaxSession* session) {
  if (!syntax_can_format(session)) return {};
  // Formatting is opt-in: retain original trees only for this pass, before
  // replacements rewrite them. Ordinary live parsing does no extra tree copies.
  SyntaxSession copy;
  copy.baseline = session->baseline;
  copy.bedrock = session->bedrock; copy.bootstrapping = session->bootstrapping;
  copy.building_bedrock = session->building_bedrock;
  if (frontend_cache_copy(&copy.cache, &session->cache)) copy.versions = session->versions;
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
  verify.baseline = copy.baseline;
  verify.bedrock = copy.bedrock; verify.bootstrapping = copy.bootstrapping;
  verify.building_bedrock = copy.building_bedrock; verify.formatting = true;
  if (frontend_cache_copy(&verify.cache, &copy.cache)) verify.versions = copy.versions;
  syntax_reset(&verify, result.source.c_str());
  size_t index = 0; bool same = true;
  while (auto* raw = syntax_next(&verify)) {
    auto node = TowerNodeRef::adopt(raw);
    same &= index < roots.size() && format_same_tree(roots[index], raw, copy.source.data(), copy.source.size(),
      verify.source.data(), verify.source.size(), syntax_component_type(), parser_match_get_type()); ++index;
  }
  if (!same || index != roots.size() || !verify.error.empty())
    return {{}, {}, "Formatting would change the parsed source under this grammar; source was left unchanged"};
  return result;
}

namespace {
std::string validate_bedrock(const Revision& module, size_t& error_offset) {
  auto definitions = module; PendingRules pending{nullptr, syntax_pending_destroy};
  auto error = validate(definitions, &error_offset, pending);
  if (!error.empty()) return error;
  if (syntax_pending_count(pending.get())) return syntax_pending_message(pending.get(), &error_offset);
  return syntax_revision_bedrock_error(module.get(), syntax_component_type());
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
      preserve_comments(*session, semantic(session->inputs.document), session->cursor);
      if (syntax_pending_count(session->version->pending.get()))
        session->error = syntax_pending_message(session->version->pending.get(), &session->error_offset);
      if (session->building_bedrock && session->error.empty()) {
        const auto& module = session->grammar;
        session->error = validate_bedrock(module, session->error_offset);
        if (session->error.empty()) {
          auto version = build({}, module, session->error, &session->error_offset);
          if (version && !syntax_emission_keyword_starts(version->emission.get()))
            session->error = "Bedrock declarations must begin with literal keywords";
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
        parser_stream_create(sizeof(SyntaxSession*), ParserInputService::Syntax), parser_stream_destroy);
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
      syntax_session_inputs_module(&session->inputs, session->inputs.source->text.c_str(), nullptr);
      if (!frontend_module_import(session->inputs.module, construct, session->inputs.source)) return fail(frontend_module_error(session->inputs.module));
      const auto* grammar = frontend_module_grammar(session->inputs.module);
      Revision candidate(syntax_revision_create(grammar->rules.data, grammar->rules.length,
        grammar->tokens.data, grammar->tokens.length), frontend_revision_release);
      std::string error;
      auto version = compiled(*session, candidate, error);
      if (!version) return fail(error);
      session->version = std::move(version);
      session->grammar = std::move(candidate);
      ++session->revision;
    }
    if (construct_kind == "GrammarTokenDeclaration" || construct_kind == "GrammarSkipDeclaration") {
      session->error_offset = construct_start;
      auto error = read_declaration(construct, session->inputs.source,
        construct_kind == "GrammarSkipDeclaration" ? SyntaxKind::Skip : SyntaxKind::Token);
      if (!error.empty()) return fail(error);
      auto& token = syntax_node(construct);
      if (syntax_revision_rule(session->grammar.get(), token.name.data(), token.name.size()))
        return fail("Name already defines a parse rule: " + token.name);
      frontend_cache_pattern(&session->cache, construct, syntax_component_type());
      if (!token.compiled) { auto pattern = lex_pattern_compile(token.text, error); syntax_node_pattern(&token, pattern.get()); }
      if (!token.compiled) return fail(error);
      TowerByteBuffer edit_error{};
      Revision candidate(syntax_revision_declare(session->grammar.get(), construct, syntax_component_type(), &edit_error), frontend_revision_release);
      if (edit_error.length) error.assign(reinterpret_cast<const char*>(edit_error.data), edit_error.length);
      bytes_dispose(&edit_error);
      if (!candidate) return fail(error.empty() ? "Unable to allocate grammar revision" : error);
      auto version = compiled(*session, candidate, error);
      if (!version) return fail(error);
      session->version = std::move(version);
      session->grammar = std::move(candidate);
      ++session->revision;
    }
    if (construct_kind == "GrammarDeclaration") {
      session->error_offset = construct_start;
      auto error = read_declaration(construct, session->inputs.source, SyntaxKind::Rule);
      if (!error.empty()) return fail(error);
      TowerByteBuffer edit_error{};
      Revision candidate(syntax_revision_declare(session->grammar.get(), construct, syntax_component_type(), &edit_error), frontend_revision_release);
      if (edit_error.length) error.assign(reinterpret_cast<const char*>(edit_error.data), edit_error.length);
      bytes_dispose(&edit_error);
      if (!candidate) return fail(error.empty() ? "Unable to allocate grammar revision" : error);
      auto version = compiled(*session, candidate, error);
      if (!version) return fail(error);
      session->version = std::move(version);
      session->grammar = std::move(candidate);
      ++session->revision;
    }
    if (session->declaration) {
      auto& declaration = syntax_node(construct);
      declaration.start = construct_start; declaration.end = session->cursor;
      preserve_comments(*session, declaration, session->cursor);
      tower_node_attach(root.get(), session->inputs.document);
      semantic(session->inputs.document).items.push_back(construct);
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
        if (!expand(*session, root)) return nullptr;
      }
      session->comment_cursor = session->cursor;
    }
    if (session->inputs.module && !session->formatting) frontend_module_record(session->inputs.module, root.get(), session->declaration);
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
  for (auto& span : result) if (session->grammar && span.token >= FirstToken && span.token - FirstToken < session->grammar->tokens.length)
    span.opaque = span.opaque || semantic(session->grammar->tokens.data[span.token - FirstToken]).name == "GrammarPattern";
  return result;
}

std::vector<SyntaxHighlight> syntax_get_highlights(SyntaxSession* session) {
  auto result = syntax_get_lexemes(session);
  std::erase_if(result, [](const auto& span) { return span.kind.empty(); });
  return result;
}

extern "C" void frontend_module_comment(FrontendModule*, size_t, size_t);
extern "C" void syntax_capture_comments(SyntaxSession* session, FrontendModule* module) {
  for (const auto& token : session->highlights)
    if (token.kind == "comment")
      frontend_module_comment(module, token.start, token.end);
}

std::vector<SyntaxTokenInfo> syntax_get_tokens(SyntaxSession* session) {
  std::vector<SyntaxTokenInfo> result;
  if (session->grammar) for (size_t i = 0; i < session->grammar->tokens.length; ++i) {
    const auto entity = session->grammar->tokens.data[i];
    const auto& token = semantic(entity);
    result.push_back({token.name, token.text, token.style, token.kind == SyntaxKind::Skip, token.contextual});
  }
  return result;
}

std::string syntax_set_bedrock(const char* source) {
  if (syntax_world_matches(compiler_host_world(), source, std::strlen(source), false)) return {};
  std::unique_ptr<SyntaxSession> session(syntax_create_bedrock(source));
  while (auto* root = syntax_next(session.get())) tower_node_release_ref(root);
  if (!session->error.empty()) return session->error;
  if (!syntax_world_publish(compiler_host_world(), source, std::strlen(source), session->inputs.document, session->grammar.get(), false))
    return "Unable to allocate grammar baseline";
  frontend_modules_reset_compilation(syntax_modules);
  // Foundation must be reloaded under the new bedrock. Existing syntax sessions
  // retain their own foundation and bedrock entities and remain valid.
  return {};
}

std::string syntax_set_bootstrap(const char* source) {
  if (syntax_world_matches(compiler_host_world(), source, std::strlen(source), true)) return {};
  std::unique_ptr<SyntaxSession> session(syntax_create_foundation(source));
  while (auto* root = syntax_next(session.get())) tower_node_release_ref(root);
  if (!session->error.empty()) return session->error;
  if (session->grammar->tokens.length == 0) return "Bootstrap must define at least one token or skip rule";
  // Baselines reference the same semantic declaration entities. Existing
  // sessions retain their baseline; a new module affects only new sessions.
  if (!syntax_world_publish(compiler_host_world(), source, std::strlen(source), session->inputs.document, session->grammar.get(), true))
    return "Unable to allocate grammar baseline";
  frontend_modules_reset_compilation(syntax_modules);
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
extern "C" FrontendModule* syntax_completion_module(SyntaxSession* session) { return session->inputs.module; }
// Read-only migration bridges to the current derived grammar tables. Tower
// retains the returned shared entities before the next declaration can replace
// or evict this version. No parser or presentation policy is duplicated here.
extern "C" TowerNode* syntax_inspection_reference(SyntaxSession* session, const char* text,
                                                 size_t length, size_t index, size_t* count) {
  *count = 0;
  if (!session->version) return nullptr;
  const auto& version = *session->version;
  return syntax_revision_reference(version.grammar.get(), text, length, index, count, syntax_component_type());
}
extern "C" TowerNode* syntax_inspection_match(SyntaxSession* session, TowerNode* node) {
  if (!session->version) return nullptr;
  auto* span = match(node);
  if (!span) return nullptr;
  const auto& version = *session->version;
  const std::string name = parser_match_get_label(span);
  auto* production = syntax_emission_find_index(version.emission.get(), parser_match_get_rule_index(span));
  if (production && production->name == name) {
    auto* found = syntax_revision_rule(version.grammar.get(), production->name, std::strlen(production->name));
    if (found && production->alternative < found->count)
      return found->alternatives[production->alternative];
  }
  return nullptr;
}
static const Replacement* inspection_replacement(SyntaxSession* session, TowerNode* body) {
  if (!session->version) return nullptr;
  const auto& version = *session->version;
  for (const auto& [index, replacement] : version.replacements) {
    auto* production = syntax_emission_find_index(version.emission.get(), index);
    if (!production) continue;
    auto* rule = syntax_revision_rule(version.grammar.get(), production->name, std::strlen(production->name));
    if (rule && production->alternative < rule->count &&
        semantic(rule->alternatives[production->alternative]).replacement == body) return &replacement;
  }
  return nullptr;
}
extern "C" TowerNode* syntax_inspection_template(SyntaxSession* session, TowerNode* body,
                                                const char** category, size_t* captures) {
  *category = ""; *captures = 0;
  auto* replacement = inspection_replacement(session, body);
  if (!replacement) return nullptr;
  *category = replacement->category.c_str(); *captures = replacement->captures.size();
  return replacement->tree.get();
}
extern "C" TowerNode* syntax_inspection_capture(SyntaxSession* session, TowerNode* body, size_t index) {
  auto* replacement = inspection_replacement(session, body);
  if (!replacement || index >= replacement->captures.size()) return nullptr;
  auto capture = replacement->captures.begin(); std::advance(capture, index);
  return capture->second.get();
}
static uint32_t completion_token(SyntaxSession* session, const char* text) {
  if (!session->completion) return PARSER_ID_EOF;
  ParserLookahead context{lr_completion_runtime(session->completion.get()), lr_completion_state(session->completion.get())};
  auto input = scan_input(*session, 0, nullptr, &context);
  input.source = text; input.size = std::strlen(text);
  SyntaxScanResult result{};
  syntax_scan_token(&input, &result);
  const bool complete = !result.error && result.start == 0 && result.length == input.size;
  const auto id = complete ? result.id : PARSER_ID_EOF;
  syntax_scan_dispose(&result);
  return id;
}
extern "C" bool syntax_completion_identifier(SyntaxSession* session, const char* text) {
  return completion_token(session, text) == MetaName && lr_completion_accepts(session->completion.get(), MetaName);
}
extern "C" bool syntax_completion_accepts(SyntaxSession* session, const char* text, bool literal) {
  if (!session->completion) return false;
  uint32_t id = PARSER_ID_EOF;
  if (literal) {
    id = syntax_emission_literal(session->completion_version->emission.get(), text);
    if (id == PARSER_ID_EOF) return false;
  } else id = completion_token(session, text);
  return lr_completion_accepts(session->completion.get(), id);
}
extern "C" bool syntax_completion_callable(SyntaxSession* session) {
  if (!session->completion) return false;
  auto id = syntax_emission_literal(session->completion_version->emission.get(), "(");
  return id != PARSER_ID_EOF && lr_completion_follows(session->completion.get(), MetaName, id);
}
extern "C" const char* syntax_completion_close(SyntaxSession* session, const char* type_name) {
  if (!session->completion) return nullptr;
  session->completion_suffix.reset(syntax_emission_completion_close(
    session->completion_version->emission.get(), session->completion.get(), type_name));
  return session->completion_suffix.get();
}
std::vector<std::string> syntax_get_keywords(SyntaxSession* session) {
  std::vector<std::string> result;
  if (session->version) for (size_t i = 0; i < syntax_emission_keyword_count(session->version->emission.get()); ++i)
    result.emplace_back(syntax_emission_keywords(session->version->emission.get())[i]);
  return result;
}

std::vector<SyntaxRuleInfo> syntax_get_rules(SyntaxSession* session) {
  std::vector<SyntaxRuleInfo> result;
  if (session->grammar) for (size_t i = 0; i < session->grammar->rules.length; ++i) {
    const auto& rule = session->grammar->rules.data[i];
    std::string definition;
    for (size_t j = 0; j < rule.count; ++j) {
      if (!definition.empty()) definition += " | ";
      const auto part = tower_format(rule.alternatives[j]).source;
      definition += part.empty() ? "ε" : part;
    }
    result.push_back({std::string(rule.name, rule.name_length), definition,
      session->version && syntax_pending_contains(session->version->pending.get(), rule.name)});
  }
  return result;
}
