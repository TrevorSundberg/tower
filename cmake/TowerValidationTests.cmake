# Functional validation tests stay Tower; retain the existing independent oracle.
get_property(validation_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
set(validation_entry main)
set(validation_bedrock _Z18syntax_set_bedrockB5cxx11PKc)
set(validation_foundation _Z20syntax_set_bootstrapB5cxx11PKc)
if(validation_triple MATCHES "^wasm32-")
  set(validation_entry __main_argc_argv)
  set(validation_bedrock _Z18syntax_set_bedrockPKc)
  set(validation_foundation _Z20syntax_set_bootstrapPKc)
endif()
set(validation_input "${CMAKE_CURRENT_BINARY_DIR}/tower_validation_main.tower")
file(GENERATE OUTPUT "${validation_input}" CONTENT "import tower;\nimport tests.parser_fixture_setup;\nextern fn syntax_validation_tests(): void;\nexport fn ${validation_entry}(argc: i32, argv: u8**): i32 { parser_fixture_setup(); syntax_validation_tests(); return 0; }\n")
tower_runtime_object(validation-main "${validation_input}" "${validation_triple}"
  --declare fixture_bedrock ${validation_bedrock} --declare fixture_foundation ${validation_foundation}
  --declare driver_syntax_delete _ZdlPv)
set(validation_cases "${CMAKE_CURRENT_BINARY_DIR}/tower-validation-cases.o")
add_custom_command(OUTPUT "${validation_cases}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_validation.tower"
    --library --target "${validation_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${validation_cases}" --depfile "${validation_cases}.d"
  DEPFILE "${validation_cases}.d" DEPENDS scaffolding/tests/syntax_validation.tower "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
set_source_files_properties("${validation_cases}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
target_sources(tower-parser-tests PRIVATE "${validation_cases}")
add_executable(tower-validation-tests "${validation-main_OBJECT}" "${validation_cases}"
  scaffolding/tower.cpp scaffolding/syntax.cpp scaffolding/syntax-nodes.cpp scaffolding/format.cpp
  scaffolding/lex-pattern.cpp scaffolding/lex-pattern-common.cpp)
target_compile_features(tower-validation-tests PRIVATE cxx_std_20)
target_compile_options(tower-validation-tests PRIVATE -fno-exceptions)
target_link_libraries(tower-validation-tests PRIVATE tower-compiler-parser-nodes tower-compiler-semantics
  tower-compiler-entities tower-compiler-utilities tower-compiler-memory tower-syntax-emission-reference tower-syntax-validation-reference)
add_test(NAME tower-validation COMMAND tower-validation-tests)
set_tests_properties(tower-validation PROPERTIES WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
