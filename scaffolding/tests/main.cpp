#include "../tower.hpp"
#include "../parser.hpp"
#include "../syntax.hpp"
void core_tests();
void compiler_storage_tests();
void entity_store_tests();
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
#ifdef _MSC_VER
  _CrtSetReportMode(_CRT_ASSERT, _CRTDBG_MODE_FILE);
  _CrtSetReportFile(_CRT_ASSERT, _CRTDBG_FILE_STDERR);
  _set_abort_behavior(0, _WRITE_ABORT_MSG | _CALL_REPORTFAULT);
#endif
  const char* path = nullptr;
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
    else if (strcmp(argv[i], "--parse") == 0 && i + 1 < argc) path = argv[++i];
    else { fprintf(stderr, "Usage: tower-parser-tests [--trace] [--parse file.tower]\n"); return 1; }
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
  tower_tests();
  parser_tests();
  syntax_tests();
  core_tests();
  compiler_storage_tests();
  entity_store_tests();
  puts("Tower and parser tests passed.");
}
