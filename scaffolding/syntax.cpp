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
  SyntaxTemplateInput input{session.get(), nullptr, 0, 0};
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
    parser_stream_create(sizeof(SyntaxTemplateInput*), ParserInputService::Template), parser_stream_destroy);
  *(SyntaxTemplateInput**)parser_stream_get_userdata(stream.get()) = &input;
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

SyntaxSession* syntax_create(const char* source, FrontendModule* module) {
  return syntax_session_open(compiler_host_world(), syntax_modules, source, module, SyntaxBaselineMode::Foundation);
}
SyntaxSession* syntax_create_foundation(const char* source) {
  return syntax_session_open(compiler_host_world(), syntax_modules, source, nullptr, SyntaxBaselineMode::Bedrock);
}
SyntaxSession* syntax_create_bedrock(const char* source) {
  return syntax_session_open(compiler_host_world(), syntax_modules, source, nullptr, SyntaxBaselineMode::Seed);
}
SyntaxCacheStats syntax_get_cache_stats(SyntaxSession* session) {
  return {session->cache.index.builds, session->cache.index.hits, session->cache.index.entries.length};
}

size_t syntax_get_offset(SyntaxSession* session) { return session->cursor; }
bool syntax_get_error_insertion(SyntaxSession* session) { return session->error_insertion; }
TowerNode* syntax_document(SyntaxSession* session) { return session->inputs.document; }
bool syntax_can_format(SyntaxSession* session) {
  return session->error.empty() && session->finalized;
}
TowerText syntax_format(SyntaxSession* session) {
  TowerFormatResult output{};
  const char* error = "";
  syntax_format_into(session, &output, &error);
  TowerText result;
  result.error = error;
  if (output.text.length)
    result.source.assign(reinterpret_cast<const char*>(output.text.data), output.text.length);
  if (output.spans.length)
    result.spans.assign(output.spans.data, output.spans.data + output.spans.length);
  format_dispose(&output);
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
  syntax_session_skip(session, &session->cursor, &session->highlights);
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
  session->declaration = syntax_session_declaration(session, session->cursor);
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
  if (!syntax_session_lexemes(session, &spans)) std::abort();
  std::vector<SyntaxHighlight> result;
  for (size_t i = 0; i < spans.items.length; ++i) {
    auto& span = spans.items.data[i];
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
  SyntaxVersionDiagnostic diagnostic{};
  syntax_baseline_install(compiler_host_world(), syntax_modules, source, false, &diagnostic);
  std::string result = syntax_version_diagnostic_text(&diagnostic);
  syntax_version_diagnostic_dispose(&diagnostic);
  return result;
}
std::string syntax_set_bootstrap(const char* source) {
  SyntaxVersionDiagnostic diagnostic{};
  syntax_baseline_install(compiler_host_world(), syntax_modules, source, true, &diagnostic);
  std::string result = syntax_version_diagnostic_text(&diagnostic);
  syntax_version_diagnostic_dispose(&diagnostic);
  return result;
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
