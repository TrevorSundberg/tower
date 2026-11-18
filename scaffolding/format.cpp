// Transitional ABI only. Formatting policy and traversal live in compiler/format*.tower.
#include "compiler-format.hpp"
#include "core.hpp"
#include "compiler-syntax-reader.hpp"
#include "syntax-nodes.hpp"
#include "parser.hpp"
#ifdef TOWER_FORMAT_DIFFERENTIAL
#include <cstdio>
#include <cstdlib>
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

extern "C" {
TowerNode* format_foundation_kind() { return core_component_type(); }
bool format_is_Program(const CoreNode* n) { return n->kind == CoreKind::Program; }
bool format_is_Function(const CoreNode* n) { return n->kind == CoreKind::Function; }
bool format_is_Parameter(const CoreNode* n) { return n->kind == CoreKind::Parameter; }
bool format_is_Declare(const CoreNode* n) { return n->kind == CoreKind::Declare; }
bool format_is_Assign(const CoreNode* n) { return n->kind == CoreKind::Assign; }
bool format_is_Operand(const CoreNode* n) { return n->kind == CoreKind::Operand; }
bool format_is_Binary(const CoreNode* n) { return n->kind == CoreKind::Binary; }
bool format_is_Address(const CoreNode* n) { return n->kind == CoreKind::Address; }
bool format_is_Load(const CoreNode* n) { return n->kind == CoreKind::Load; }
bool format_is_Convert(const CoreNode* n) { return n->kind == CoreKind::Convert; }
bool format_is_Bits(const CoreNode* n) { return n->kind == CoreKind::Bits; }
bool format_is_Call(const CoreNode* n) { return n->kind == CoreKind::Call; }
bool format_is_Block(const CoreNode* n) { return n->kind == CoreKind::Block; }
bool format_is_If(const CoreNode* n) { return n->kind == CoreKind::If; }
bool format_is_Loop(const CoreNode* n) { return n->kind == CoreKind::Loop; }
bool format_is_Break(const CoreNode* n) { return n->kind == CoreKind::Break; }
bool format_is_Continue(const CoreNode* n) { return n->kind == CoreKind::Continue; }
bool format_is_Print(const CoreNode* n) { return n->kind == CoreKind::Print; }
bool format_is_Return(const CoreNode* n) { return n->kind == CoreKind::Return; }
bool format_is_Type(const CoreNode* n) { return n->kind == CoreKind::Type; }
bool format_is_FieldDeclaration(const CoreNode* n) { return n->kind == CoreKind::FieldDeclaration; }
bool format_is_Field(const CoreNode* n) { return n->kind == CoreKind::Field; }
bool format_is_Index(const CoreNode* n) { return n->kind == CoreKind::Index; }
bool format_is_String(const CoreNode* n) { return n->kind == CoreKind::String; }
bool format_is_SizeOf(const CoreNode* n) { return n->kind == CoreKind::SizeOf; }
bool format_is_AlignOf(const CoreNode* n) { return n->kind == CoreKind::AlignOf; }
bool format_is_Allocate(const CoreNode* n) { return n->kind == CoreKind::Allocate; }
bool format_is_Reallocate(const CoreNode* n) { return n->kind == CoreKind::Reallocate; }
bool format_is_Free(const CoreNode* n) { return n->kind == CoreKind::Free; }
bool format_is_Copy(const CoreNode* n) { return n->kind == CoreKind::Copy; }
bool format_is_Fill(const CoreNode* n) { return n->kind == CoreKind::Fill; }
const char* format_builtin(const CoreNode* n) { return core_builtin_name(n->kind); }
const char* format_operator(const CoreNode* n) { return core_operator(n->op); }
bool format_array(const CoreType* t) { return t->scalar == CoreScalar::Array; }
bool format_record(const CoreType* t) { return t->scalar == CoreScalar::Struct; }
bool format_boolean(const CoreType* t) { return t->scalar == CoreScalar::Bool; }
bool format_signed(const CoreType* t) { return core_signed(*t); }
uint64_t format_mask(const CoreType* t) { return core_mask(*t); }
uint64_t format_sign(const CoreType* t) { return uint64_t(1) << (core_width(*t) - 1); }
bool format_scalar_name(const CoreType* t, TowerByteBuffer* output) {
  // Query the shared type-name helper, not a formatter type registry.
  auto base = *t; base.pointers = 0;
  const auto name = core_type_name(base);
  return bytes_assign_text(output, reinterpret_cast<const uint8_t*>(name.data()), name.size());
}
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
  if (!output.failed) compare(result, reference_tower_format(node));
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
  if (!output.failed) compare(result, reference_tower_format_source(roots, source, comments));
#endif
  return result;
}
