#include "syntax.hpp"
#include "compiler-syntax-reader.hpp"
#include "compiler-syntax-validation.hpp"
#include "compiler-syntax-emission.hpp"
#include "compiler-syntax-expansion.hpp"
#include "compiler-syntax-replacements.hpp"
#include "compiler-syntax-version.hpp"
#include "compiler-syntax-session.hpp"
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
#include <cstring>
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

using Revision = std::shared_ptr<const FrontendRevision>;

SyntaxNode& semantic(const TowerNodeRef& node) { return syntax_node(node.get()); }
SyntaxNode& semantic(TowerNode* node) { return syntax_node(node); }

using Version = SyntaxVersion;

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

namespace {
std::string syntax_diagnostic(SyntaxSession& session, Recognizer* recognizer, bool repairs = true) {
  const std::unique_ptr<ParserDiagnostic, decltype(&parser_diagnostic_destroy)> diagnostic(
    parser_recognizer_diagnostic(recognizer, repairs ? ParserDiagnosticReader::Syntax : ParserDiagnosticReader::None, &session), parser_diagnostic_destroy);
  // Cached tables retain their original declarations; diagnostic provenance
  // follows the current source revision, including source-only edits.
  Revision definitions(syntax_revision_overlay(session.pins.bedrock,
    session.pins.grammar ? session.pins.grammar->rules.data : nullptr, session.pins.grammar ? session.pins.grammar->rules.length : 0,
    nullptr, 0, syntax_component_type()), frontend_revision_release);
  const SyntaxDiagnosticInput input{session.source, session.source_length, session.cursor,
    diagnostic->offset, diagnostic->insertion_offset, parser_recognizer_get_error(recognizer),
    diagnostic->options.data, diagnostic->options.length,
    syntax_emission_literal_ids(session.pins.version->emission), syntax_emission_literal_count(session.pins.version->emission),
    syntax_emission_productions(session.pins.version->emission), syntax_emission_production_count(session.pins.version->emission),
    repairs, diagnostic->complete, diagnostic->at_start, syntax_revision_rule(definitions.get(), "Statement", 9) != nullptr};
  SyntaxDiagnosticText output{};
  format_syntax_diagnostic(&input, &output);
  if (output.insertion) { session.error_offset = diagnostic->insertion_offset; session.error_insertion = true; }
  auto* description = syntax_version_description(session.pins.version, definitions.get(), output.production, output.multiple);
  auto* text = syntax_diagnostic_text_finish(&output, description ? description : "");
  tower_memory_free(description);
  std::string result(text); tower_memory_free(text); return result;
}

std::shared_ptr<Version> compiled(SyntaxSession& session, const FrontendRevision* definitions, std::string& error) {
  SyntaxVersionDiagnostic diagnostic{{}, nullptr, session.error_offset};
  std::shared_ptr<Version> version(syntax_version_cached(&session.cache, session.inputs.world, definitions, session.pins.bedrock, &diagnostic), syntax_version_release);
  error = syntax_version_diagnostic_text(&diagnostic);
  session.error_offset = diagnostic.offset;
  syntax_version_diagnostic_dispose(&diagnostic);
  return version;
}

SyntaxScanInput scan_input(const SyntaxSession& session, size_t pos, SyntaxHighlights* highlights,
    const ParserLookahead* expected = nullptr) {
  ParserLookahead context;
  if (expected) context = *expected; else parser_request_lookahead(session.recognizer, &context);
  SyntaxScanInput input{};
  input.lexicon = session.pins.version->lexicon; input.source = session.source; input.size = session.source_length;
  input.cursor = pos; input.revision = session.revision;
  input.declaration = session.declaration; input.bootstrapping = session.bootstrapping;
  input.runtime = context.runtime; input.state = context.state; input.highlights = highlights;
  input.context = session.pins.version->rules; input.match_kind = parser_match_get_type();
  return input;
}
extern "C" bool syntax_parser_diagnostic_read(void* context, size_t* pos, const ParserLookahead* expected, uint32_t* id) {
  auto input = scan_input(*static_cast<SyntaxSession*>(context), *pos, nullptr, expected);
  const bool ok = syntax_scan_peek(&input, id);
  *pos = input.cursor;
  return ok;
}
bool declaration_at(const SyntaxSession& session, size_t pos) {
  return lexicon_declaration(session.pins.version->lexicon, session.source, session.source_length, pos);
}
std::string skip_source(SyntaxSession& session, size_t& pos, SyntaxHighlights& highlights) {
  auto input = scan_input(session, pos, &highlights);
  SyntaxScanResult result{};
  syntax_scan_skip(&input, &result);
  pos = input.cursor; parser_recognizer_account_lookahead(session.recognizer, result.checks);
  return {};
}
std::string scan(SyntaxSession& session, size_t& pos, SyntaxHighlights& highlights,
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
  SyntaxSession* session;
  const SyntaxTemplateCapture* captures = nullptr;
  size_t count = 0, base = 0;
};
extern "C" TowerNode* syntax_parser_template_read(Stream* stream, void* userdata, uint32_t* id, size_t* start, size_t* length) {
  auto& host = **static_cast<TemplateInput**>(userdata);
  auto input = scan_input(*host.session, host.session->cursor, &host.session->highlights);
  input.replacement = true; input.captures = host.captures; input.count = host.count; input.base = host.base;
  return read_scan(stream, *host.session, input, id, start, length);
}

bool compile_template(Version& version, const Revision& defs, TowerNode* seq,
    SyntaxReplacementOwner* owner, SyntaxReplacement& replacement, std::string& error, bool& grammar_error) {
  grammar_error = false;
  std::shared_ptr<Version> grammar(syntax_version_create(compiler_host_world(), defs.get(), version.bedrock), syntax_version_release);
  if (!grammar) { error = "Unable to allocate replacement grammar"; return false; }
  if (!syntax_version_seed(grammar.get(), defs.get(), replacement.category.c_str(), version.emission)) {
    error = "Unable to allocate replacement grammar"; return false;
  }
  std::unique_ptr<SyntaxSession, decltype(&syntax_destroy)> session(
    syntax_session_allocate(compiler_host_world(), syntax_modules), syntax_destroy);
  if (!session) { error = "Unable to allocate replacement session"; return false; }
  TemplateInput input{session.get()};
  input.base = replacement.start;
  const auto& text = semantic(semantic(seq).replacement).text;
  if (!syntax_session_inputs_source(&input.session->inputs, text.data(), text.size(), "replacement")) {
    error = "Unable to allocate replacement source text"; return false;
  }
  syntax_session_progress(input.session);
  syntax_session_pin_revision(&input.session->pins.grammar, defs.get());
  syntax_session_pin_revision(&input.session->pins.bedrock, version.bedrock);
  syntax_session_pin_version(&input.session->pins.version, grammar.get());
  std::vector<SyntaxTemplateCapture> captures;
  for (size_t i = 0; i < replacement.captures.length; ++i) {
    const auto& capture = replacement.captures.data[i];
    const auto& term = semantic(capture.source);
    captures.push_back({capture.name.c_str(), capture.source, syntax_emission_wrapper(grammar->emission, term.text.c_str())});
  }
  input.captures = captures.data(); input.count = captures.size();
  SyntaxTemplateGrammar holes{};
  holes.emission.root = grammar->rules; holes.emission.syntax_kind = syntax_component_type();
  holes.emission.rule_kind = parser_rule_get_type(); holes.emission.reference_kind = parser_reference_get_type();
  holes.emission.string_kind = parser_string_get_type();
  holes.captures = captures.data(); holes.count = captures.size();
  holes.repetitions = syntax_emission_repetitions(grammar->emission);
  holes.repetition_count = syntax_emission_repetition_count(grammar->emission);
  if (!syntax_template_holes_revision(&holes, grammar->emission)) { error = "Unable to allocate replacement hole productions"; return false; }
  char* diagnostic = nullptr;
  grammar->table = parser_table_create(grammar->rules, grammar.get(), ParserPresentation::Syntax, &diagnostic,
    ParserTableMode::WholeInput);
  if (!grammar->table) {
    grammar_error = true;
    error = diagnostic ? diagnostic : "Cannot build replacement parser";
    if (diagnostic) tower_memory_free(diagnostic);
    return false;
  }
  if (!syntax_version_lexicon(grammar.get())) { error = "Unable to allocate replacement lexical indexes"; return false; }
  std::unique_ptr<Stream, decltype(&parser_stream_destroy)> stream(
    parser_stream_create(sizeof(TemplateInput*), ParserInputService::Template), parser_stream_destroy);
  *(TemplateInput**)parser_stream_get_userdata(stream.get()) = &input;
  std::unique_ptr<Recognizer, decltype(&parser_recognizer_destroy)> recognizer(
    parser_recognizer_create(grammar->table, stream.get()), parser_recognizer_destroy);
  input.session->recognizer = recognizer.get();
  Node root = owned(nullptr);
  bool running = true;
  while (running) root = owned(parser_recognizer_step(recognizer.get(), &running));
  if (!root) {
    replacement.error_offset = replacement.start + input.session->error_offset;
    // Holes are typed subtrees rather than ordinary lexer tokens; report
    // checked expectations here without guessing an insertion around a hole.
    error = syntax_diagnostic(*input.session, recognizer.get(), false); return false;
  }
  auto* body = child(root.get(), 0);
  if (!body) { error = "Replacement must produce one syntax tree"; return false; }
  tower_node_add_ref(body); tower_node_detach(body); syntax_replacement_tree(owner, body);
  std::vector<size_t> uses(captures.size());
  SyntaxTemplateRemap remap{body, parser_match_get_type(),
    syntax_emission_productions(grammar->emission), syntax_emission_production_count(grammar->emission),
    syntax_emission_productions(version.emission), syntax_emission_production_count(version.emission),
    nullptr, 0, nullptr, 0,
    parser_table_grammar(version.table), uses.data(), uses.size()};
  if (!syntax_template_remap_revisions(&remap, grammar->emission, version.emission)) { error = "Unable to allocate replacement template mapping"; return false; }
  for (size_t i = 0; i < captures.size(); ++i) replacement.captures.data[i].uses = uses[i];
  return true;
}

bool expand(SyntaxSession& session, Node& root) {
  SyntaxExpansionResult result{root.release(), session.expansion_stats.replacements,
    session.expansion_stats.generated_nodes, session.expansion_stats.copied_nodes,
    session.error_offset, {}};
  const bool ok = syntax_expand(syntax_replacement_input(session.pins.version->replacements), &result);
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

extern "C" unsigned syntax_replacement_attempt(void* context, const char* category) {
  auto* owner = static_cast<SyntaxReplacementOwner*>(context);
  auto* current = syntax_replacement_candidate(owner, category);
  if (!current) return 0;
  auto& host = *static_cast<Version*>(syntax_replacement_host(owner));
  Revision definitions(frontend_revision_retain(host.grammar), frontend_revision_release);
  std::string diagnostic;
  bool grammar_error = false;
  const bool ok = compile_template(host, definitions, syntax_replacement_sequence(owner), owner, *current, diagnostic, grammar_error);
  syntax_replacement_error(owner, diagnostic.c_str());
  return ok ? 1 : grammar_error ? 2 : 0;
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
  std::unique_ptr<SyntaxSession, decltype(&syntax_destroy)> session(
    syntax_session_allocate(compiler_host_world(), syntax_modules), syntax_destroy);
  if (!session) std::abort();
  syntax_session_inputs_module(&session->inputs, source, module);
  if (const auto* grammar = module ? frontend_module_grammar(module) : nullptr) {
    session->pins.baseline = syntax_revision_create(grammar->rules.data, grammar->rules.length,
      grammar->tokens.data, grammar->tokens.length);
    session->pins.bedrock = syntax_world_revision(compiler_host_world(), SyntaxBaselineMode::Seed);
    if (!session->pins.bedrock) { session->error = "Unable to allocate Bedrock revision"; return session.release(); }
    syntax_reset(session.get(), source);
    return session.release();
  }
  session->pins.baseline = syntax_world_revision(compiler_host_world(), SyntaxBaselineMode::Foundation);
  if (!session->pins.baseline) { session->error = "Load foundation.tower before creating a syntax session"; return session.release(); }
  session->pins.bedrock = syntax_world_revision(compiler_host_world(), SyntaxBaselineMode::Bedrock);
  if (!session->pins.bedrock) { session->error = "Unable to allocate Bedrock revision"; return session.release(); }
  syntax_reset(session.get(), source);
  return session.release();
}

SyntaxSession* syntax_create_foundation(const char* source) {
  std::unique_ptr<SyntaxSession, decltype(&syntax_destroy)> session(
    syntax_session_allocate(compiler_host_world(), syntax_modules), syntax_destroy);
  if (!session) std::abort();
  session->bootstrapping = true;
  session->pins.bedrock = syntax_world_revision(compiler_host_world(), SyntaxBaselineMode::Bedrock);
  if (!session->pins.bedrock) { session->error = "Unable to allocate Bedrock revision"; return session.release(); }
  syntax_session_pin_revision(&session->pins.baseline, session->pins.bedrock);
  syntax_reset(session.get(), source);
  return session.release();
}

SyntaxSession* syntax_create_bedrock(const char* source) {
  std::unique_ptr<SyntaxSession, decltype(&syntax_destroy)> session(
    syntax_session_allocate(compiler_host_world(), syntax_modules), syntax_destroy);
  if (!session) std::abort();
  session->bootstrapping = session->building_bedrock = true;
  session->pins.bedrock = syntax_world_revision(compiler_host_world(), SyntaxBaselineMode::Seed);
  if (!session->pins.bedrock) { session->error = "Unable to allocate Bedrock revision"; return session.release(); }
  syntax_session_pin_revision(&session->pins.baseline, session->pins.bedrock);
  syntax_reset(session.get(), source);
  return session.release();
}

void syntax_reset(SyntaxSession* session, const char* source, FrontendModule* module) {
  const bool source_ready = syntax_session_inputs_reset(&session->inputs, source, std::strlen(source),
    session->building_bedrock ? SyntaxBaselineMode::Seed : session->bootstrapping ? SyntaxBaselineMode::Bedrock : SyntaxBaselineMode::Foundation, module);
  syntax_session_progress(session);
  if (!source_ready) { session->error = "Unable to allocate source text"; syntax_session_pin_version(&session->pins.version, nullptr); return; }
  std::string error;
  syntax_session_pin_version(&session->pins.version, compiled(*session, session->pins.grammar, error).get());
  session->error = error;
}
SyntaxCacheStats syntax_get_cache_stats(SyntaxSession* session) {
  return {session->cache.index.builds, session->cache.index.hits, session->cache.index.entries.length};
}

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
  std::unique_ptr<SyntaxSession, decltype(&syntax_destroy)> copy_owner(
    syntax_session_allocate(compiler_host_world(), syntax_modules), syntax_destroy);
  if (!copy_owner) return {};
  auto& copy = *copy_owner;
  syntax_session_pins_baseline(&copy.pins, &session->pins);
  copy.bootstrapping = session->bootstrapping;
  copy.building_bedrock = session->building_bedrock;
  syntax_version_cache_copy(&copy.cache, &session->cache);
  copy.formatting = true; syntax_reset(&copy, session->source);
  std::vector<TowerNodeRef> owned; std::vector<TowerNode*> roots;
  while (auto* root = syntax_next(&copy)) { owned.push_back(TowerNodeRef::adopt(root)); roots.push_back(root); }
  if (!copy.error.empty()) return {};
  std::vector<TowerCommentSpan> comments;
  for (size_t i = 0; i < copy.highlights.items.length; ++i) {
    const auto& token = copy.highlights.items.data[i];
    if (std::string_view(token.kind) == "comment") comments.push_back({token.start, token.end});
  }
  auto result = tower_format_source(roots, std::string_view(copy.source, copy.source_length), comments);
  // User grammars may give punctuation or whitespace a different meaning.
  // Accept layout changes only if the same grammar reads the same source trees.
  std::unique_ptr<SyntaxSession, decltype(&syntax_destroy)> verify_owner(
    syntax_session_allocate(compiler_host_world(), syntax_modules), syntax_destroy);
  if (!verify_owner) return {};
  auto& verify = *verify_owner;
  syntax_session_pins_baseline(&verify.pins, &copy.pins);
  verify.bootstrapping = copy.bootstrapping;
  verify.building_bedrock = copy.building_bedrock; verify.formatting = true;
  syntax_version_cache_copy(&verify.cache, &copy.cache);
  syntax_reset(&verify, result.source.c_str());
  size_t index = 0; bool same = true;
  while (auto* raw = syntax_next(&verify)) {
    auto node = TowerNodeRef::adopt(raw);
    same &= index < roots.size() && format_same_tree(roots[index], raw, copy.source, copy.source_length,
      verify.source, verify.source_length, syntax_component_type(), parser_match_get_type()); ++index;
  }
  if (!same || index != roots.size() || !verify.error.empty())
    return {{}, {}, "Formatting would change the parsed source under this grammar; source was left unchanged"};
  return result;
}

namespace {
void preserve_comments(SyntaxSession& session, SyntaxNode& declaration, size_t through) {
  for (size_t i = 0; i < session.highlights.items.length; ++i) {
    const auto& token = session.highlights.items.data[i];
    if (std::string_view(token.kind) != "comment" || token.start < session.comment_cursor || token.end > through) continue;
    if (declaration.replacement) {
      const auto& body = semantic(declaration.replacement);
      if (token.start >= body.start && token.end <= body.end) continue;
    }
    declaration.comments.emplace_back(std::string_view(session.source, session.source_length).substr(token.start, token.end - token.start));
  }
  session.comment_cursor = through;
}
}

TowerNode* syntax_next(SyntaxSession* session) {
  if (!session->error.empty()) return nullptr;
  session->expansion_stats = {};
  std::string trivia_error = skip_source(*session, session->cursor, session->highlights);
  if (!trivia_error.empty()) {
    session->error_offset = session->highlights.items.data[session->highlights.items.length - 1].start;
    session->error = trivia_error;
    return nullptr;
  }
  if (session->cursor == session->source_length) {
    if (session->completing) {
      syntax_session_completion(session, parser_table_completion(session->pins.version->table));
      syntax_session_pin_version(&session->pins.completion_version, session->pins.version);
    }
    if (!session->finalized) {
      preserve_comments(*session, semantic(session->inputs.document), session->cursor);
      if (syntax_pending_count(session->pins.version->pending))
        session->error = syntax_pending_message(session->pins.version->pending, &session->error_offset);
      if (session->building_bedrock && session->error.empty()) {
        const auto& module = session->pins.grammar;
        SyntaxVersionDiagnostic diagnostic{{}, nullptr, session->error_offset};
        syntax_version_bedrock(module, syntax_component_type(), &diagnostic);
        session->error = syntax_version_diagnostic_text(&diagnostic);
        session->error_offset = diagnostic.offset;
        syntax_version_diagnostic_dispose(&diagnostic);
        if (session->error.empty()) {
          std::shared_ptr<Version> version(syntax_version_build(session->inputs.world, nullptr, module, &diagnostic), syntax_version_release);
          session->error = syntax_version_diagnostic_text(&diagnostic);
          session->error_offset = diagnostic.offset;
          syntax_version_diagnostic_dispose(&diagnostic);
          if (version && !syntax_emission_keyword_starts(version->emission))
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
        parser_recognizer_create_prefix(session->pins.version->table, stream.get()), parser_recognizer_destroy);
      session->recognizer = recognizer.get();
      if (session->completing) parser_recognizer_capture_completion(recognizer.get());
      bool running = true;
      while (running) root = owned(parser_recognizer_step(recognizer.get(), &running));
      session->recognizer = nullptr;
      if (!root) {
        if (session->completing) {
          syntax_session_completion(session, parser_recognizer_take_completion(recognizer.get()));
          syntax_session_pin_version(&session->pins.completion_version, session->pins.version);
        }
        return fail(syntax_diagnostic(*session, recognizer.get()));
      }
      // The recognizer may have inspected one following token. Keep only the
      // committed span; the next construct gets its own declaration/lexer mode.
      auto* span = match(root.get());
      session->cursor = parser_match_get_start(span) + parser_match_get_length(span);
      while (session->highlights.items.length != 0 && session->highlights.items.data[session->highlights.items.length - 1].start >= session->cursor)
        --session->highlights.items.length;
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
      auto version = compiled(*session, candidate.get(), error);
      if (!version) return fail(error);
      syntax_session_pin_version(&session->pins.version, version.get());
      syntax_session_pin_revision(&session->pins.grammar, candidate.get());
      ++session->revision;
    }
    if (construct_kind == "GrammarTokenDeclaration" || construct_kind == "GrammarSkipDeclaration") {
      session->error_offset = construct_start;
      auto error = read_declaration(construct, session->inputs.source,
        construct_kind == "GrammarSkipDeclaration" ? SyntaxKind::Skip : SyntaxKind::Token);
      if (!error.empty()) return fail(error);
      auto& token = syntax_node(construct);
      if (syntax_revision_rule(session->pins.grammar, token.name.data(), token.name.size()))
        return fail("Name already defines a parse rule: " + token.name);
      frontend_cache_pattern(&session->cache.index, construct, syntax_component_type());
      if (!token.compiled) { auto pattern = lex_pattern_compile(token.text, error); syntax_node_pattern(&token, pattern.get()); }
      if (!token.compiled) return fail(error);
      TowerByteBuffer edit_error{};
      Revision candidate(syntax_revision_declare(session->pins.grammar, construct, syntax_component_type(), &edit_error), frontend_revision_release);
      if (edit_error.length) error.assign(reinterpret_cast<const char*>(edit_error.data), edit_error.length);
      bytes_dispose(&edit_error);
      if (!candidate) return fail(error.empty() ? "Unable to allocate grammar revision" : error);
      auto version = compiled(*session, candidate.get(), error);
      if (!version) return fail(error);
      syntax_session_pin_version(&session->pins.version, version.get());
      syntax_session_pin_revision(&session->pins.grammar, candidate.get());
      ++session->revision;
    }
    if (construct_kind == "GrammarDeclaration") {
      session->error_offset = construct_start;
      auto error = read_declaration(construct, session->inputs.source, SyntaxKind::Rule);
      if (!error.empty()) return fail(error);
      TowerByteBuffer edit_error{};
      Revision candidate(syntax_revision_declare(session->pins.grammar, construct, syntax_component_type(), &edit_error), frontend_revision_release);
      if (edit_error.length) error.assign(reinterpret_cast<const char*>(edit_error.data), edit_error.length);
      bytes_dispose(&edit_error);
      if (!candidate) return fail(error.empty() ? "Unable to allocate grammar revision" : error);
      auto version = compiled(*session, candidate.get(), error);
      if (!version) return fail(error);
      syntax_session_pin_version(&session->pins.version, version.get());
      syntax_session_pin_revision(&session->pins.grammar, candidate.get());
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
      for (size_t i = 0; i < session->highlights.items.length; ++i) {
        auto& token = session->highlights.items.data[i];
        if (token.start < construct_start) continue;
        if (token.start >= template_start) continue;
        if (std::string_view(token.kind) == "comment") continue;
        if (std::string_view(token.kind) == "identifier") {
          if (construct_kind == "GrammarDeclaration") syntax_highlights_style(&session->highlights, i, capture ? "capture" : "rule");
          else if ((construct_kind == "GrammarTokenDeclaration" || construct_kind == "GrammarSkipDeclaration") &&
                   token.start == parser_match_get_start(declared_name) &&
                   token.end == parser_match_get_start(declared_name) + parser_match_get_length(declared_name)) syntax_highlights_style(&session->highlights, i, "rule");
        }
        capture = std::string_view(session->source, session->source_length).substr(token.start, token.end - token.start) == "$";
      }
    } else {
      session->declarations_only = false;
      if (!session->formatting && syntax_replacement_count(session->pins.version->replacements)) {
        if (!expand(*session, root)) return nullptr;
      }
      session->comment_cursor = session->cursor;
    }
    if (session->inputs.module && !session->formatting) frontend_module_record(session->inputs.module, root.get(), session->declaration);
    return root.release();
  }
}

std::vector<SyntaxHighlight> syntax_get_lexemes(SyntaxSession* session) {
  SyntaxHighlights spans{};
  if (!syntax_highlights_copy(&spans, &session->highlights)) std::abort();
  size_t pos = session->cursor;
  // After an error, colour the suffix with the last committed grammar. This
  // preview never installs declarations or changes the parsing cursor.
  if (session->pins.version) while (pos < session->source_length) {
    skip_source(*session, pos, spans);
    if (pos == session->source_length) break;
    bool meta = declaration_at(*session, pos);
    // Preview declarations with the active reader but never install them.
    do {
      uint32_t id; size_t start, length;
      bool saved = session->declaration; session->declaration = meta;
      scan(*session, pos, spans, id, start, length);
      session->declaration = saved;
      if (!meta || (length == 1 && session->source[start] == ';') || pos == session->source_length) break;
    } while (true);
  }
  // Token overrides replace their existing ordered slot, while additions append.
  // Resolve the private lexical id back to its shared declaration metadata;
  // changing `as style` must never turn identifiers into strings or comments.
  std::vector<SyntaxHighlight> result;
  for (size_t i = 0; i < spans.items.length; ++i) {
    auto& span = spans.items.data[i];
    if (session->pins.grammar && span.token >= FirstToken && span.token - FirstToken < session->pins.grammar->tokens.length)
      span.opaque = span.opaque || semantic(session->pins.grammar->tokens.data[span.token - FirstToken]).name == "GrammarPattern";
    result.push_back({span.start, span.end, span.revision, span.kind, span.opaque, span.token});
  }
  syntax_highlights_dispose(&spans);
  return result;
}

std::vector<SyntaxHighlight> syntax_get_highlights(SyntaxSession* session) {
  auto result = syntax_get_lexemes(session);
  std::erase_if(result, [](const auto& span) { return span.kind.empty(); });
  return result;
}

extern "C" void frontend_module_comment(FrontendModule*, size_t, size_t);
extern "C" void syntax_capture_comments(SyntaxSession* session, FrontendModule* module) {
  for (size_t i = 0; i < session->highlights.items.length; ++i) {
    const auto& token = session->highlights.items.data[i];
    if (std::string_view(token.kind) == "comment")
      frontend_module_comment(module, token.start, token.end);
  }
}

std::vector<SyntaxTokenInfo> syntax_get_tokens(SyntaxSession* session) {
  std::vector<SyntaxTokenInfo> result;
  if (session->pins.grammar) for (size_t i = 0; i < session->pins.grammar->tokens.length; ++i) {
    const auto entity = session->pins.grammar->tokens.data[i];
    const auto& token = semantic(entity);
    result.push_back({token.name, token.text, token.style, token.kind == SyntaxKind::Skip, token.contextual});
  }
  return result;
}

std::string syntax_set_bedrock(const char* source) {
  if (syntax_world_matches(compiler_host_world(), source, std::strlen(source), false)) return {};
  std::unique_ptr<SyntaxSession, decltype(&syntax_destroy)> session(syntax_create_bedrock(source), syntax_destroy);
  while (auto* root = syntax_next(session.get())) tower_node_release_ref(root);
  if (!session->error.empty()) return session->error;
  if (!syntax_world_publish(compiler_host_world(), source, std::strlen(source), session->inputs.document, session->pins.grammar, false))
    return "Unable to allocate grammar baseline";
  frontend_modules_reset_compilation(syntax_modules);
  // Foundation must be reloaded under the new bedrock. Existing syntax sessions
  // retain their own foundation and bedrock entities and remain valid.
  return {};
}

std::string syntax_set_bootstrap(const char* source) {
  if (syntax_world_matches(compiler_host_world(), source, std::strlen(source), true)) return {};
  std::unique_ptr<SyntaxSession, decltype(&syntax_destroy)> session(syntax_create_foundation(source), syntax_destroy);
  while (auto* root = syntax_next(session.get())) tower_node_release_ref(root);
  if (!session->error.empty()) return session->error;
  if (session->pins.grammar->tokens.length == 0) return "Bootstrap must define at least one token or skip rule";
  // Baselines reference the same semantic declaration entities. Existing
  // sessions retain their baseline; a new module affects only new sessions.
  if (!syntax_world_publish(compiler_host_world(), source, std::strlen(source), session->inputs.document, session->pins.grammar, true))
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
  if (!session->pins.version) return nullptr;
  const auto& version = *session->pins.version;
  return syntax_revision_reference(version.grammar, text, length, index, count, syntax_component_type());
}
extern "C" TowerNode* syntax_inspection_match(SyntaxSession* session, TowerNode* node) {
  if (!session->pins.version) return nullptr;
  auto* span = match(node);
  if (!span) return nullptr;
  const auto& version = *session->pins.version;
  const std::string name = parser_match_get_label(span);
  auto* production = syntax_emission_find_index(version.emission, parser_match_get_rule_index(span));
  if (production && production->name == name) {
    auto* found = syntax_revision_rule(version.grammar, production->name, std::strlen(production->name));
    if (found && production->alternative < found->count)
      return found->alternatives[production->alternative];
  }
  return nullptr;
}
static const SyntaxReplacement* inspection_replacement(SyntaxSession* session, TowerNode* body) {
  if (!session->pins.version) return nullptr;
  const auto& version = *session->pins.version;
  return syntax_replacement_inspect(version.replacements, version.grammar, body);
}
extern "C" TowerNode* syntax_inspection_template(SyntaxSession* session, TowerNode* body,
                                                const char** category, size_t* captures) {
  *category = ""; *captures = 0;
  auto* replacement = inspection_replacement(session, body);
  if (!replacement) return nullptr;
  *category = replacement->category.c_str(); *captures = replacement->captures.length;
  return replacement->tree;
}
extern "C" TowerNode* syntax_inspection_capture(SyntaxSession* session, TowerNode* body, size_t index) {
  auto* replacement = inspection_replacement(session, body);
  if (!replacement || index >= replacement->captures.length) return nullptr;
  return replacement->captures.data[index].source;
}
static uint32_t completion_token(SyntaxSession* session, const char* text) {
  if (!session->completion) return PARSER_ID_EOF;
  ParserLookahead context{lr_completion_runtime(session->completion), lr_completion_state(session->completion)};
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
  return completion_token(session, text) == MetaName && lr_completion_accepts(session->completion, MetaName);
}
extern "C" bool syntax_completion_accepts(SyntaxSession* session, const char* text, bool literal) {
  if (!session->completion) return false;
  uint32_t id = PARSER_ID_EOF;
  if (literal) {
    id = syntax_emission_literal(session->pins.completion_version->emission, text);
    if (id == PARSER_ID_EOF) return false;
  } else id = completion_token(session, text);
  return lr_completion_accepts(session->completion, id);
}
extern "C" bool syntax_completion_callable(SyntaxSession* session) {
  if (!session->completion) return false;
  auto id = syntax_emission_literal(session->pins.completion_version->emission, "(");
  return id != PARSER_ID_EOF && lr_completion_follows(session->completion, MetaName, id);
}
extern "C" const char* syntax_completion_close(SyntaxSession* session, const char* type_name) {
  if (!session->completion) return nullptr;
  return syntax_session_suffix(session, syntax_emission_completion_close(
    session->pins.completion_version->emission, session->completion, type_name));
}
std::vector<std::string> syntax_get_keywords(SyntaxSession* session) {
  std::vector<std::string> result;
  if (session->pins.version) for (size_t i = 0; i < syntax_emission_keyword_count(session->pins.version->emission); ++i)
    result.emplace_back(syntax_emission_keywords(session->pins.version->emission)[i]);
  return result;
}

std::vector<SyntaxRuleInfo> syntax_get_rules(SyntaxSession* session) {
  std::vector<SyntaxRuleInfo> result;
  if (session->pins.grammar) for (size_t i = 0; i < session->pins.grammar->rules.length; ++i) {
    const auto& rule = session->pins.grammar->rules.data[i];
    std::string definition;
    for (size_t j = 0; j < rule.count; ++j) {
      if (!definition.empty()) definition += " | ";
      const auto part = tower_format(rule.alternatives[j]).source;
      definition += part.empty() ? "ε" : part;
    }
    result.push_back({std::string(rule.name, rule.name_length), definition,
      session->pins.version && syntax_pending_contains(session->pins.version->pending, rule.name)});
  }
  return result;
}
