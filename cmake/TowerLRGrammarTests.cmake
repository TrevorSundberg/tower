# Independent Tower grammar snapshots and fixtures over production shared nodes.
get_property(lr_grammar_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
set(lr_grammar_object "${CMAKE_CURRENT_BINARY_DIR}/tower-lr-grammar-suite.o")
add_custom_command(OUTPUT "${lr_grammar_object}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/lr_grammar.tower"
    --library --target "${lr_grammar_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${lr_grammar_object}" --depfile "${lr_grammar_object}.d"
  DEPFILE "${lr_grammar_object}.d"
  DEPENDS scaffolding/tests/lr_grammar.tower scaffolding/tests/lr_grammar_oracle.tower
    scaffolding/tests/mt19937.tower "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
set_source_files_properties("${lr_grammar_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
add_library(tower-lr-grammar-suite INTERFACE)
target_sources(tower-lr-grammar-suite INTERFACE "${lr_grammar_object}")
target_link_libraries(tower-parser-tests PRIVATE tower-lr-grammar-suite)

set(lr_grammar_entry main)
if(lr_grammar_triple MATCHES "^wasm")
  set(lr_grammar_entry __main_argc_argv)
endif()
set(lr_grammar_input "${CMAKE_CURRENT_BINARY_DIR}/tower_lr_grammar_main.tower")
set(lr_grammar_main_object "${CMAKE_CURRENT_BINARY_DIR}/tower-lr-grammar-main.o")
file(GENERATE OUTPUT "${lr_grammar_input}" CONTENT
  "import tower;\nextern fn lr_grammar_tests(): void;\nexport fn ${lr_grammar_entry}(argc: i32, argv: u8**): i32 { lr_grammar_tests(); return 0; }\n")
add_custom_command(OUTPUT "${lr_grammar_main_object}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${lr_grammar_input}" --library --target "${lr_grammar_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${lr_grammar_main_object}" --depfile "${lr_grammar_main_object}.d"
  DEPFILE "${lr_grammar_main_object}.d"
  DEPENDS "${lr_grammar_input}" "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
set_source_files_properties("${lr_grammar_main_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
get_target_property(lr_grammar_sources tower-parser-tests SOURCES)
list(FILTER lr_grammar_sources EXCLUDE REGEX "scaffolding/tests/|scaffolding/bootstrap/|\\.(o|obj)$")
list(APPEND lr_grammar_sources scaffolding/tests/nodes.cpp)
add_executable(tower-lr-grammar-tests ${lr_grammar_sources} "${lr_grammar_main_object}")
target_compile_features(tower-lr-grammar-tests PRIVATE cxx_std_20)
target_compile_definitions(tower-lr-grammar-tests PRIVATE TOWER_EXPANSION_TESTS=1)
if(MSVC)
  target_compile_options(tower-lr-grammar-tests PRIVATE /UNDEBUG)
  target_compile_definitions(tower-lr-grammar-tests PRIVATE _HAS_EXCEPTIONS=0)
else()
  target_compile_options(tower-lr-grammar-tests PRIVATE -UNDEBUG -fno-exceptions)
endif()
target_link_libraries(tower-lr-grammar-tests PRIVATE tower-lr-grammar-suite
  tower-compiler-parser-nodes tower-compiler-semantics tower-compiler-entities
  tower-compiler-utilities tower-compiler-memory)
add_test(NAME tower-lr-grammar COMMAND tower-lr-grammar-tests)
