# Test-only Tower contextual selector oracle. Production parsing and DFA services remain the
# same objects used by the compiler; no native lexicon implementation is embedded.
get_property(lexicon_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
set(lexicon_object "${CMAKE_CURRENT_BINARY_DIR}/tower-lexicon-suite.o")
add_custom_command(OUTPUT "${lexicon_object}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_lexer.tower"
    --library --target "${lexicon_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${lexicon_object}" --depfile "${lexicon_object}.d"
  DEPFILE "${lexicon_object}.d"
  DEPENDS scaffolding/tests/syntax_lexer.tower scaffolding/tests/lexicon_oracle.tower
    scaffolding/tests/mt19937.tower "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
set_source_files_properties("${lexicon_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
add_library(tower-lexicon-suite INTERFACE)
target_sources(tower-lexicon-suite INTERFACE "${lexicon_object}")
target_link_libraries(tower-parser-tests PRIVATE tower-lexicon-suite)

set(lexicon_entry main)
if(lexicon_triple MATCHES "^wasm")
  set(lexicon_entry __main_argc_argv)
endif()
set(lexicon_input "${CMAKE_CURRENT_BINARY_DIR}/tower_lexicon_main.tower")
set(lexicon_main_object "${CMAKE_CURRENT_BINARY_DIR}/tower-lexicon-main.o")
file(GENERATE OUTPUT "${lexicon_input}" CONTENT
  "import tower;\nextern fn syntax_lexer_tests(): void;\nexport fn ${lexicon_entry}(argc: i32, argv: u8**): i32 { syntax_lexer_tests(); return 0; }\n")
add_custom_command(OUTPUT "${lexicon_main_object}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${lexicon_input}" --library --target "${lexicon_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${lexicon_main_object}" --depfile "${lexicon_main_object}.d"
  DEPFILE "${lexicon_main_object}.d"
  DEPENDS "${lexicon_input}" "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
set_source_files_properties("${lexicon_main_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
get_target_property(lexicon_sources tower-parser-tests SOURCES)
list(FILTER lexicon_sources EXCLUDE REGEX "scaffolding/tests/|scaffolding/bootstrap/|scaffolding/core.*cpp|\\.(o|obj)$")
list(APPEND lexicon_sources scaffolding/tests/nodes.cpp)
add_executable(tower-lexicon-tests ${lexicon_sources} "${lexicon_main_object}")
target_compile_features(tower-lexicon-tests PRIVATE cxx_std_20)
target_compile_definitions(tower-lexicon-tests PRIVATE TOWER_EXPANSION_TESTS=1)
if(MSVC)
  target_compile_options(tower-lexicon-tests PRIVATE /UNDEBUG)
  target_compile_definitions(tower-lexicon-tests PRIVATE _HAS_EXCEPTIONS=0)
else()
  target_compile_options(tower-lexicon-tests PRIVATE -UNDEBUG -fno-exceptions)
endif()
target_link_libraries(tower-lexicon-tests PRIVATE tower-lexicon-suite
  tower-compiler-parser-nodes tower-compiler-semantics tower-compiler-entities
  tower-compiler-utilities tower-compiler-memory)
add_test(NAME tower-lexicon COMMAND tower-lexicon-tests)
