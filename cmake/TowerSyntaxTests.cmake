# A separate Tower translation unit keeps fixtures out of production lowering.
get_property(live_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
set(live_cases "${CMAKE_CURRENT_BINARY_DIR}/tower-syntax-live-cases.o")
add_custom_command(OUTPUT "${live_cases}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_live.tower"
    --library --target "${live_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${live_cases}" --depfile "${live_cases}.d"
  DEPFILE "${live_cases}.d" DEPENDS scaffolding/tests/syntax_live.tower "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
set_source_files_properties("${live_cases}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
target_sources(tower-compiler-parser-nodes INTERFACE "${live_cases}")

function(tower_syntax_test_runner)
get_property(live_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
set(live_entry main)
set(live_bedrock _Z18syntax_set_bedrockB5cxx11PKc)
set(live_foundation _Z20syntax_set_bootstrapB5cxx11PKc)
if(live_triple MATCHES "^wasm32-")
  set(live_entry __main_argc_argv)
  set(live_bedrock _Z18syntax_set_bedrockPKc)
  set(live_foundation _Z20syntax_set_bootstrapPKc)
endif()
set(live_input "${CMAKE_CURRENT_BINARY_DIR}/tower_syntax_live_main.tower")
file(GENERATE OUTPUT "${live_input}" CONTENT "import tower;\nimport tests.parser_fixture_setup;\nextern fn syntax_tests(): void;\nexport fn ${live_entry}(argc: i32, argv: u8**): i32 { parser_fixture_setup(); syntax_tests(); return 0; }\n")
tower_runtime_object(live-main "${live_input}" "${live_triple}"
  --declare fixture_bedrock ${live_bedrock} --declare fixture_foundation ${live_foundation}
  --declare driver_syntax_delete _ZdlPv)
add_executable(tower-live-syntax-tests "${live-main_OBJECT}"
  scaffolding/tower.cpp scaffolding/syntax.cpp scaffolding/syntax-nodes.cpp scaffolding/format.cpp)
target_compile_features(tower-live-syntax-tests PRIVATE cxx_std_20)
target_compile_options(tower-live-syntax-tests PRIVATE -fno-exceptions)
target_link_libraries(tower-live-syntax-tests PRIVATE tower-compiler-parser-nodes tower-compiler-semantics
  tower-compiler-entities tower-compiler-utilities tower-compiler-memory)
add_test(NAME tower-live-syntax COMMAND tower-live-syntax-tests)
set_tests_properties(tower-live-syntax PROPERTIES WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
endfunction()
