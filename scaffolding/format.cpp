// Transitional ABI only. Formatting policy and traversal live in compiler/format*.tower.
#include "compiler-format.hpp"
#include <string_view>
#include "compiler-syntax-reader.hpp"
#include "syntax-nodes.hpp"
#include "parser.hpp"

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
  return result;
}

TowerText tower_format_source(const std::vector<TowerNode*>& roots, std::string_view source,
    const std::vector<TowerCommentSpan>& comments) {
  TowerFormatResult output{};
  format_source(&output, const_cast<TowerNode**>(roots.data()), roots.size(), source.data(), source.size(),
    comments.data(), comments.size(), syntax_component_type(), nullptr, parser_match_get_type());
  auto result = take(output);
  return result;
}
