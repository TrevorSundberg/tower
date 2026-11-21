#include "../tower.hpp"
#include "../parser.hpp"
#include "../syntax.hpp"
#include "../compiler-syntax-emission.hpp"
#include <cassert>
extern "C" int host_runtime_tests();
void formatter_tests();
extern "C" void compiler_storage_tests();
extern "C" void shared_entity_tests();
extern "C" void entity_registry_tests();
void regex_tests();
void syntax_lexer_tests();
void syntax_nodes_tests();
void syntax_reader_tests();
void syntax_validation_tests();
size_t syntax_expansion_test_entry();
extern "C" size_t syntax_emission_tests(const SyntaxEmissionInput*);
extern "C" int32_t host_support_tests();
extern "C" int32_t interpreter_storage_tests();
void lr_analysis_tests();
#include <cstdio>
#include <cstring>
#include <fstream>
#include <sstream>
#include <string>
#ifdef _MSC_VER
#include <crtdbg.h>
#include <cstdlib>
#endif

int main(int argc, char** argv) {
  const auto host_result = host_runtime_tests();
  if (host_result) { fprintf(stderr, "Tower host test failed: %d\n", host_result); return 1; }
#ifdef _MSC_VER
  _CrtSetReportMode(_CRT_ASSERT, _CRTDBG_MODE_FILE);
  _CrtSetReportFile(_CRT_ASSERT, _CRTDBG_FILE_STDERR);
  _set_abort_behavior(0, _WRITE_ABORT_MSG | _CALL_REPORTFAULT);
#endif
  const char* path = nullptr;
  bool host_only = false;
  std::ifstream bedrock("bedrock.tower", std::ios::binary);
  if (!bedrock) { fprintf(stderr, "Cannot read bedrock.tower\n"); return 1; }
  std::ostringstream bedrock_text; bedrock_text << bedrock.rdbuf();
  auto bedrock_error = syntax_set_bedrock(bedrock_text.str().c_str());
  if (!bedrock_error.empty()) { fprintf(stderr, "%s\n", bedrock_error.c_str()); return 1; }
  std::ifstream seed("foundation.tower", std::ios::binary);
  if (!seed) { fprintf(stderr, "Cannot read foundation.tower\n"); return 1; }
  std::ostringstream seed_text; seed_text << seed.rdbuf();
  std::string seed_error = syntax_set_bootstrap(seed_text.str().c_str());
  if (!seed_error.empty()) { fprintf(stderr, "%s\n", seed_error.c_str()); return 1; }
  for (int i = 1; i < argc; ++i) {
    if (strcmp(argv[i], "--trace") == 0) parser_set_debug_trace(true);
    else if (strcmp(argv[i], "--host-only") == 0) host_only = true;
    else if (strcmp(argv[i], "--parse") == 0 && i + 1 < argc) path = argv[++i];
    else { fprintf(stderr, "Usage: tower-parser-tests [--trace] [--host-only] [--parse file.tower]\n"); return 1; }
  }
  if (path) {
    std::ifstream input(path, std::ios::binary);
    if (!input) { fprintf(stderr, "Cannot read %s\n", path); return 1; }
    std::ostringstream text; text << input.rdbuf();
    SyntaxSession* session = syntax_create(text.str().c_str());
    while (TowerNode* root = syntax_next(session)) {
      auto* construct = tower_node_get_child(root, 0);
      auto* m = (Match*)tower_node_get_component_userdata(construct, parser_match_get_type());
      if (strcmp(parser_match_get_label(m), "GrammarDeclaration") == 0)
        printf("Installed grammar revision %zu; next byte %zu\n", syntax_get_revision(session), syntax_get_offset(session));
      else parser_tree_debug_print(construct);
      tower_node_release_ref(root);
    }
    bool failed = *syntax_get_error(session) != '\0';
    if (failed) fprintf(stderr, "%s\n", syntax_get_error(session));
    syntax_destroy(session);
    return failed ? 1 : 0;
  }
  const auto transport_result = host_support_tests();
  if (transport_result) { fprintf(stderr, "Tower transport test failed: %d\n", transport_result); return 1; }
  const auto storage_result = interpreter_storage_tests();
  if (storage_result) { fprintf(stderr, "Tower interpreter storage test failed: %d\n", storage_result); return 1; }
  if (host_only) { puts("Tower host and interpreter storage tests passed."); return 0; }
  tower_tests();
  parser_tests();
  syntax_tests();
  formatter_tests();
  compiler_storage_tests();
  regex_tests();
  syntax_lexer_tests();
  syntax_nodes_tests();
  syntax_reader_tests();
  syntax_validation_tests();
  SyntaxEmissionInput emission{};
  emission.root = syntax_native_bedrock(); emission.syntax_kind = syntax_component_type();
  emission.rule_kind = parser_rule_get_type(); emission.reference_kind = parser_reference_get_type();
  emission.string_kind = parser_string_get_type(); emission.range_kind = parser_range_get_type();
  auto emission_failure = syntax_emission_tests(&emission);
  if (emission_failure) fprintf(stderr, "Tower grammar emission test failed: %zu\n", emission_failure);
  assert(!emission_failure);
  auto expansion_failure = syntax_expansion_test_entry();
  if (expansion_failure) fprintf(stderr, "Tower replacement expansion test failed: %zu\n", expansion_failure);
  assert(!expansion_failure);
  lr_analysis_tests();
  shared_entity_tests();
  entity_registry_tests();
  puts("Tower and parser tests passed.");
}
