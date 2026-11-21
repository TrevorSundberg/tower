# Test-only Tower reader/oracle. Production parsing and DFA services remain the
# same objects used by the compiler; no native regex implementation is embedded.
get_property(regex_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
set(regex_object "${CMAKE_CURRENT_BINARY_DIR}/tower-regex-suite.o")
add_custom_command(OUTPUT "${regex_object}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/regex.tower"
    --library --target "${regex_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${regex_object}" --depfile "${regex_object}.d"
  DEPFILE "${regex_object}.d"
  DEPENDS scaffolding/tests/regex.tower scaffolding/tests/regex_oracle.tower
    scaffolding/tests/mt19937.tower "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
set_source_files_properties("${regex_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
add_library(tower-regex-suite INTERFACE)
target_sources(tower-regex-suite INTERFACE "${regex_object}")
target_link_libraries(tower-parser-tests PRIVATE tower-regex-suite)

set(regex_entry main)
if(regex_triple MATCHES "^wasm")
  set(regex_entry __main_argc_argv)
endif()
set(regex_input "${CMAKE_CURRENT_BINARY_DIR}/tower_regex_main.tower")
set(regex_main_object "${CMAKE_CURRENT_BINARY_DIR}/tower-regex-main.o")
file(GENERATE OUTPUT "${regex_input}" CONTENT
  "import tower;\nextern fn regex_tests(): void;\nexport fn ${regex_entry}(argc: i32, argv: u8**): i32 { regex_tests(); return 0; }\n")
add_custom_command(OUTPUT "${regex_main_object}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${regex_input}" --library --target "${regex_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${regex_main_object}" --depfile "${regex_main_object}.d"
  DEPFILE "${regex_main_object}.d"
  DEPENDS "${regex_input}" "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
set_source_files_properties("${regex_main_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
get_target_property(regex_sources tower-parser-tests SOURCES)
list(FILTER regex_sources EXCLUDE REGEX "scaffolding/tests/|scaffolding/bootstrap/|scaffolding/core.*cpp|\\.(o|obj)$")
list(APPEND regex_sources scaffolding/tests/nodes.cpp)
add_executable(tower-regex-tests ${regex_sources} "${regex_main_object}")
target_compile_features(tower-regex-tests PRIVATE cxx_std_20)
target_compile_definitions(tower-regex-tests PRIVATE TOWER_EXPANSION_TESTS=1)
if(MSVC)
  target_compile_options(tower-regex-tests PRIVATE /UNDEBUG)
  target_compile_definitions(tower-regex-tests PRIVATE _HAS_EXCEPTIONS=0)
else()
  target_compile_options(tower-regex-tests PRIVATE -UNDEBUG -fno-exceptions)
endif()
target_link_libraries(tower-regex-tests PRIVATE tower-regex-suite
  tower-compiler-parser-nodes tower-compiler-semantics tower-compiler-entities
  tower-compiler-utilities tower-compiler-memory tower-syntax-emission-reference)
add_test(NAME tower-regex COMMAND tower-regex-tests)
