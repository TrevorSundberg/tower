# Keep the independent Tower oracle in its own unit. Its declarations preserve
# the existing fixture boundary without growing the parser's bootstrap closure.
get_property(emission_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
set(emission_oracle "${CMAKE_CURRENT_BINARY_DIR}/tower-emission-oracle.o")
add_custom_command(OUTPUT "${emission_oracle}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_emission_oracle.tower"
    --library --target "${emission_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${emission_oracle}" --depfile "${emission_oracle}.d"
  DEPFILE "${emission_oracle}.d"
  DEPENDS scaffolding/tests/syntax_emission_oracle.tower "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
set_source_files_properties("${emission_oracle}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
target_sources(tower-compiler-parser-nodes INTERFACE "${emission_oracle}")

# The ordinary fixtures stay with the parser; only this entry is standalone.
set(emission_entry main)
if(emission_triple MATCHES "^wasm")
  set(emission_entry __main_argc_argv)
endif()
set(emission_input "${CMAKE_CURRENT_BINARY_DIR}/tower_emission_main.tower")
set(emission_main "${CMAKE_CURRENT_BINARY_DIR}/tower-emission-main.o")
file(GENERATE OUTPUT "${emission_input}" CONTENT
  "import tower;\nimport tests.syntax_emission_entry;\nexport fn ${emission_entry}(argc: i32, argv: u8**): i32 { syntax_emission_test_entry(); return 0; }\n")
add_custom_command(OUTPUT "${emission_main}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${emission_input}" --library --target "${emission_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${emission_main}" --depfile "${emission_main}.d"
  DEPFILE "${emission_main}.d"
  DEPENDS "${emission_input}" scaffolding/tests/syntax_emission_entry.tower
    scaffolding/tests/syntax_emission.tower scaffolding/tests/syntax_emission_oracle.tower
    "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
set_source_files_properties("${emission_main}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
get_target_property(emission_sources tower-parser-tests SOURCES)
list(FILTER emission_sources EXCLUDE REGEX "scaffolding/tests/|scaffolding/bootstrap/|\\.(o|obj)$")
list(APPEND emission_sources scaffolding/tests/nodes.cpp)
add_executable(tower-emission-tests ${emission_sources} "${emission_main}")
target_compile_features(tower-emission-tests PRIVATE cxx_std_20)
if(MSVC)
  target_compile_options(tower-emission-tests PRIVATE /UNDEBUG)
  target_compile_definitions(tower-emission-tests PRIVATE _HAS_EXCEPTIONS=0)
else()
  target_compile_options(tower-emission-tests PRIVATE -UNDEBUG -fno-exceptions)
endif()
target_link_libraries(tower-emission-tests PRIVATE tower-compiler-parser-nodes tower-compiler-semantics
  tower-compiler-entities tower-compiler-utilities tower-compiler-memory)
add_test(NAME tower-emission-tests COMMAND tower-emission-tests)
