// Legacy string/ownership boundary. Character parsing and regex lowering run in Tower.
#include "lex-pattern.hpp"
#include "compiler-frontend.hpp"
#include "compiler-format.hpp"

LexPatternRef lex_pattern_compile(const std::string& pattern, std::string& error) {
  TowerFormatResult diagnostic{};
  auto result = LexPatternRef::adopt(frontend_host_pattern_read(pattern.data(), pattern.size(), &diagnostic));
  error.clear();
  if (diagnostic.failed) error = "Unable to allocate token pattern diagnostic";
  else if (diagnostic.text.length) error.assign(reinterpret_cast<const char*>(diagnostic.text.data), diagnostic.text.length);
  format_dispose(&diagnostic);
  return result;
}
