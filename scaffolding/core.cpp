#include "core.hpp"
#include "compiler-semantic.hpp"
#include <utility>

namespace {
std::string foundation_grammar;
bool label(TowerNode* n, const char* name) {
  auto* m = n ? static_cast<Match*>(tower_node_get_component_userdata(n, parser_match_get_type())) : nullptr;
  return m && std::string_view(parser_match_get_label(m)) == name;
}
// Parser loading remains in this native boundary. All binding, type resolution,
// validation, specialization integration and flow analysis execute in Tower.
CoreProgram compile(const std::vector<std::string>& sources, unsigned width) {
  CoreProgram program(width);
  size_t count = 0, base = 0;
  std::string source;
  std::vector<TowerNode*> roots;
  std::vector<size_t> bases;
  for (const auto& file : sources) { source += file; source += '\n'; }
  auto& statements = core_node(program.root).items;
  for (const auto& file : sources) {
    auto* session = syntax_create(file.c_str());
    while (program.error.empty()) {
      auto revision = syntax_get_revision(session); auto* root = syntax_next(session); if (!root) break;
      if (revision == syntax_get_revision(session)) {
        auto* n = tower_node_get_child(root, 0);
        if (label(n, "Statement") && tower_node_get_child_count(n) == 1) n = tower_node_get_child(n, 0);
        tower_node_attach(root, program.root); statements.push_back(n);
        roots.push_back(root); bases.push_back(base);
      }
      tower_node_release_ref(root);
      if (++count > 1024) program.error = "Foundation source limit is 1,024 top-level nodes";
    }
    if (program.error.empty() && *syntax_get_error(session)) {
      program.error = syntax_get_error(session); program.error_offset = base + syntax_get_error_offset(session);
    }
    syntax_destroy(session);
    base += file.size() + 1;
    if (!program.error.empty()) break;
  }
  if (!program.error.empty()) return program;
  SemanticProgram view{}; view.root = program.root; view.pointer_bytes = width;
  for (auto* n : program.functions) view.functions.push_back(n);
  for (auto* n : program.types) view.types.push_back(n);
  semantic_compile(&view, roots.data(), bases.data(), roots.size(), source.c_str());
  program.functions.assign(view.functions.begin(), view.functions.end());
  program.types.assign(view.types.begin(), view.types.end());
  if (view.error.length) program.error.assign(reinterpret_cast<const char*>(view.error.data), view.error.length);
  program.error_offset = view.error_offset;
  semantic_program_dispose(&view);
  return program;
}
}
CoreProgram core_compile(const char* source, unsigned pointer_bytes) { return compile({source}, pointer_bytes); }
CoreProgram core_compile_files(const std::vector<std::string>& sources, unsigned pointer_bytes) { return compile(sources, pointer_bytes); }
void core_set_foundation(const std::string& grammar) { foundation_grammar = syntax_set_bootstrap(grammar.c_str()); }
CoreProgram core_compile_foundation(const char* source, unsigned pointer_bytes) {
  if (!foundation_grammar.empty()) { CoreProgram p; p.error = foundation_grammar; return p; }
  return compile({source}, pointer_bytes);
}
#if defined(__wasm__)
extern "C" __attribute__((export_name("tw_set_foundation"))) int tw_set_foundation(const char* source, size_t length) {
  if (!source || length > 131072) return 0; core_set_foundation(std::string(source, length)); return 1;
}
#endif
