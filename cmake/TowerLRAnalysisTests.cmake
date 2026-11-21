# Independent Tower LR analysis/control oracle and production ownership fixtures.
get_property(lr_analysis_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
set(lr_analysis_object "${CMAKE_CURRENT_BINARY_DIR}/tower-lr-analysis-suite.o")
add_custom_command(OUTPUT "${lr_analysis_object}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/lr_analysis.tower"
    --library --target "${lr_analysis_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${lr_analysis_object}" --depfile "${lr_analysis_object}.d"
  DEPFILE "${lr_analysis_object}.d"
  DEPENDS scaffolding/tests/lr_analysis.tower scaffolding/tests/lr_analysis_oracle.tower scaffolding/tests/lr_analysis_comparisons.tower
    scaffolding/tests/mt19937.tower "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
set_source_files_properties("${lr_analysis_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
add_library(tower-lr-analysis-suite INTERFACE)
target_sources(tower-lr-analysis-suite INTERFACE "${lr_analysis_object}")
target_link_libraries(tower-parser-tests PRIVATE tower-lr-analysis-suite)

set(lr_analysis_entry main)
if(lr_analysis_triple MATCHES "^wasm")
  set(lr_analysis_entry __main_argc_argv)
endif()
set(lr_analysis_input "${CMAKE_CURRENT_BINARY_DIR}/tower_lr_analysis_main.tower")
set(lr_analysis_main_object "${CMAKE_CURRENT_BINARY_DIR}/tower-lr-analysis-main.o")
file(GENERATE OUTPUT "${lr_analysis_input}" CONTENT
  "import tower;\nextern fn lr_analysis_tests(): void;\nexport fn ${lr_analysis_entry}(argc: i32, argv: u8**): i32 { lr_analysis_tests(); return 0; }\n")
add_custom_command(OUTPUT "${lr_analysis_main_object}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${lr_analysis_input}" --library --target "${lr_analysis_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${lr_analysis_main_object}" --depfile "${lr_analysis_main_object}.d"
  DEPFILE "${lr_analysis_main_object}.d"
  DEPENDS "${lr_analysis_input}" "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
set_source_files_properties("${lr_analysis_main_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
get_target_property(lr_analysis_sources tower-parser-tests SOURCES)
list(FILTER lr_analysis_sources EXCLUDE REGEX "scaffolding/tests/|scaffolding/bootstrap/|\\.(o|obj)$")
list(APPEND lr_analysis_sources scaffolding/tests/nodes.cpp)
add_executable(tower-lr-analysis-tests ${lr_analysis_sources} "${lr_analysis_main_object}")
target_compile_features(tower-lr-analysis-tests PRIVATE cxx_std_20)
target_compile_definitions(tower-lr-analysis-tests PRIVATE TOWER_EXPANSION_TESTS=1)
if(MSVC)
  target_compile_options(tower-lr-analysis-tests PRIVATE /UNDEBUG)
  target_compile_definitions(tower-lr-analysis-tests PRIVATE _HAS_EXCEPTIONS=0)
else()
  target_compile_options(tower-lr-analysis-tests PRIVATE -UNDEBUG -fno-exceptions)
endif()
target_link_libraries(tower-lr-analysis-tests PRIVATE tower-lr-analysis-suite tower-lr-grammar-suite
  tower-compiler-parser-nodes tower-compiler-semantics tower-compiler-entities
  tower-compiler-utilities tower-compiler-memory)
add_test(NAME tower-lr-analysis COMMAND tower-lr-analysis-tests)
