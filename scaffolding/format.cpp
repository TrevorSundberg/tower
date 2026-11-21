// Transitional ABI only. Formatting policy and traversal live in compiler/format*.tower.
#include "compiler-format.hpp"
#include "syntax-nodes.hpp"
#include "parser.hpp"

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
