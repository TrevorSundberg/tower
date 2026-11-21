#include "syntax.hpp"
#include "compiler-syntax-validation.hpp"
#include "compiler-syntax-emission.hpp"
#include "compiler-syntax-version.hpp"
#include "compiler-syntax-session.hpp"
#include "compiler-frontend.hpp"
#include "compiler-entities.hpp"
#include "compiler-generics.hpp"
#include "syntax-nodes.hpp"
#include "format.hpp"
#include "compiler-format.hpp"
#include <string>
#include <vector>

ModuleEnvironment* syntax_modules = nullptr;

namespace {
SyntaxNode& semantic(TowerNode* node) { return syntax_node(node); }
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
