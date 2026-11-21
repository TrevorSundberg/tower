// Transitional ABI only. Formatting policy and traversal live in compiler/format*.tower.
#include "compiler-format.hpp"
#include <string_view>
#include "compiler-syntax-reader.hpp"
#include "syntax-nodes.hpp"
#include "parser.hpp"
#ifdef TOWER_FORMAT_DIFFERENTIAL
#include <cstdio>
#include <cstdlib>
// Fault-injection tests exercise the production boundary independently of the
// reference oracle, whose shared semantic queries may allocate too.
static bool compare_reference = true;
void tower_format_compare_reference(bool enabled) { compare_reference = enabled; }
TowerText reference_tower_format(TowerNode*);
TowerText reference_tower_format_source(const std::vector<TowerNode*>&, std::string_view, const std::vector<TowerCommentSpan>&);
static void compare(const TowerText& actual, const TowerText& expected) {
  bool same = actual.source == expected.source && actual.error == expected.error && actual.spans.size() == expected.spans.size();
  if (same) for (size_t i = 0; i < actual.spans.size(); ++i) {
    auto a = actual.spans[i], b = expected.spans[i];
    same &= a.begin == b.begin && a.end == b.end && a.source == b.source;
  }
  if (!same) {
    fprintf(stderr, "Formatter differential mismatch: %zu/%zu spans\nActual:\n%s\nExpected:\n%s\n",
      actual.spans.size(), expected.spans.size(), actual.source.c_str(), expected.source.c_str());
    std::abort();
  }
}
#endif

std::string tower_identifier_value(std::string_view text) {
  std::string result(text);
  result.resize(syntax_identifier_decode_in_place(result.data(), result.size()));
  return result;
}

namespace {
TowerText take(TowerFormatResult& output) {
  TowerText result;
  if (output.failed) result.error = "Unable to allocate canonical formatted source";
  else {
    if (output.text.length)
      result.source.assign(reinterpret_cast<const char*>(output.text.data), output.text.length);
    if (output.spans.length)
      result.spans.assign(output.spans.data, output.spans.data + output.spans.length);
  }
  format_dispose(&output);
  return result;
}
}

TowerText tower_format(TowerNode* node) {
  TowerFormatResult output{};
  format_entity(&output, node, syntax_component_type(), nullptr, parser_match_get_type());
  auto result = take(output);
#ifdef TOWER_FORMAT_DIFFERENTIAL
  if (!output.failed && compare_reference) compare(result, reference_tower_format(node));
#endif
  return result;
}

TowerText tower_format_source(const std::vector<TowerNode*>& roots, std::string_view source,
    const std::vector<TowerCommentSpan>& comments) {
  TowerFormatResult output{};
  format_source(&output, const_cast<TowerNode**>(roots.data()), roots.size(), source.data(), source.size(),
    comments.data(), comments.size(), syntax_component_type(), nullptr, parser_match_get_type());
  auto result = take(output);
#ifdef TOWER_FORMAT_DIFFERENTIAL
  if (!output.failed && compare_reference) compare(result, reference_tower_format_source(roots, source, comments));
#endif
  return result;
}
