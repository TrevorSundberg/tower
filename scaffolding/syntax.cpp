#include "syntax.hpp"
#include "compiler-syntax-validation.hpp"
#include "compiler-syntax-version.hpp"
#include "compiler-syntax-session.hpp"
#include "compiler-frontend.hpp"
#include "format.hpp"
#include <string>

ModuleEnvironment* syntax_modules = nullptr;

SyntaxSession* syntax_create(const char* source, FrontendModule* module) {
  return syntax_session_open(compiler_host_world(), syntax_modules, source, module, SyntaxBaselineMode::Foundation);
}
SyntaxSession* syntax_create_foundation(const char* source) {
  return syntax_session_open(compiler_host_world(), syntax_modules, source, nullptr, SyntaxBaselineMode::Bedrock);
}
SyntaxSession* syntax_create_bedrock(const char* source) {
  return syntax_session_open(compiler_host_world(), syntax_modules, source, nullptr, SyntaxBaselineMode::Seed);
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
