// Legacy string/ownership boundary. Character parsing and regex lowering run in Tower.
#include "lex-pattern.hpp"
#include "compiler-frontend.hpp"
#include "compiler-format.hpp"
#include "syntax-nodes.hpp"
#include <memory>

LexPatternRef lex_pattern_compile(const std::string& pattern, std::string& error) {
  static const FrontendKinds kinds{parser_rule_get_type(), parser_reference_get_type(), parser_string_get_type(),
    parser_range_get_type(), parser_match_get_type(), syntax_component_type()};
  static const std::unique_ptr<FrontendPatternCompiler, decltype(&frontend_pattern_destroy)> compiler(
    frontend_pattern_create(&kinds), frontend_pattern_destroy);
  TowerFormatResult diagnostic{};
  auto result = LexPatternRef::adopt(frontend_pattern_read(compiler.get(), pattern.data(), pattern.size(), &diagnostic));
  error.clear();
  if (diagnostic.failed) error = "Unable to allocate token pattern diagnostic";
  else if (diagnostic.text.length) error.assign(reinterpret_cast<const char*>(diagnostic.text.data), diagnostic.text.length);
  format_dispose(&diagnostic);
  return result;
}
