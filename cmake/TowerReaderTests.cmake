# Functional reader tests stay Tower; retain the existing independent oracle.
get_property(reader_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
set(reader_entry main)
set(reader_bedrock _Z18syntax_set_bedrockB5cxx11PKc)
set(reader_foundation _Z20syntax_set_bootstrapB5cxx11PKc)
if(reader_triple MATCHES "^wasm32-")
  set(reader_entry __main_argc_argv)
  set(reader_bedrock _Z18syntax_set_bedrockPKc)
  set(reader_foundation _Z20syntax_set_bootstrapPKc)
endif()
set(reader_input "${CMAKE_CURRENT_BINARY_DIR}/tower_reader_main.tower")
file(GENERATE OUTPUT "${reader_input}" CONTENT "import tower;\nimport tests.parser_fixture_setup;\nextern fn syntax_reader_tests(): void;\nexport fn ${reader_entry}(argc: i32, argv: u8**): i32 { parser_fixture_setup(); syntax_reader_tests(); return 0; }\n")
tower_runtime_object(reader-main "${reader_input}" "${reader_triple}"
  --declare fixture_bedrock ${reader_bedrock} --declare fixture_foundation ${reader_foundation}
  --declare driver_syntax_delete _ZdlPv)
set(reader_cases "${CMAKE_CURRENT_BINARY_DIR}/tower-reader-cases.o")
add_custom_command(OUTPUT "${reader_cases}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_reader.tower"
    --library --target "${reader_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${reader_cases}" --depfile "${reader_cases}.d"
  DEPFILE "${reader_cases}.d" DEPENDS scaffolding/tests/syntax_reader.tower "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
set_source_files_properties("${reader_cases}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
target_sources(tower-parser-tests PRIVATE "${reader_cases}")
add_executable(tower-reader-tests "${reader-main_OBJECT}" "${reader_cases}"
  scaffolding/tower.cpp scaffolding/syntax.cpp scaffolding/syntax-nodes.cpp scaffolding/format.cpp
  scaffolding/lex-pattern.cpp scaffolding/lex-pattern-common.cpp)
target_compile_features(tower-reader-tests PRIVATE cxx_std_20)
target_compile_options(tower-reader-tests PRIVATE -fno-exceptions)
target_link_libraries(tower-reader-tests PRIVATE tower-compiler-parser-nodes tower-compiler-semantics
  tower-compiler-entities tower-compiler-utilities tower-compiler-memory tower-syntax-emission-reference tower-syntax-reader-reference)
add_test(NAME tower-reader COMMAND tower-reader-tests)
set_tests_properties(tower-reader PROPERTIES WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
