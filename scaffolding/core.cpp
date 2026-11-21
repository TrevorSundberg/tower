#include "core.hpp"
#include "compiler-semantic.hpp"
#include "compiler-frontend.hpp"

namespace {
// Temporary native API ownership view. Source orchestration and semantic work
// execute in Tower on the same entities; only strings/containers cross this ABI.
CoreProgram compile(const std::vector<std::string>& sources, unsigned width) {
  CoreProgram program(width);
  std::vector<FrontendSource> files;
  for (const auto& file : sources) files.push_back({file.c_str(), file.size()});
  SemanticProgram view{}; view.root = program.root; view.pointer_bytes = width;
  for (auto* n : program.functions) view.functions.push_back(n);
  for (auto* n : program.types) view.types.push_back(n);
  frontend_compile_sources(&view, files.data(), files.size(), syntax_modules);
  program.functions.assign(view.functions.begin(), view.functions.end());
  program.types.assign(view.types.begin(), view.types.end());
  if (view.error.length) program.error.assign(reinterpret_cast<const char*>(view.error.data), view.error.length);
  program.error_offset = view.error_offset;
  semantic_program_dispose(&view);
  return program;
}
}
CoreProgram core_compile(const char* source, unsigned pointer_bytes) { return compile({source}, pointer_bytes); }
