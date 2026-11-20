# One production Tower unit owns table construction orchestration. Parser state
# and stream execution remain in the existing shared frontend aggregate.
set(parser_integration_input "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-parser-integration.tower")
file(GENERATE OUTPUT "${parser_integration_input}"
  CONTENT "import \"${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/parser-integration\";\n")
set(parser_integration_object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-parser-integration.o")
add_custom_command(OUTPUT "${parser_integration_object}"
  COMMAND "${bootstrap}" "${parser_integration_input}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    --library --target "${triple}" -o "${parser_integration_object}" --depfile "${parser_integration_object}.d"
  DEPFILE "${parser_integration_object}.d"
  DEPENDS ${dependency} "${parser_integration_input}" scaffolding/compiler/parser-integration.tower
  VERBATIM)
set_source_files_properties("${parser_integration_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
target_sources(tower-compiler-parser-nodes INTERFACE "${parser_integration_object}")

# Replaces parser-tree-tests.cpp, including the browser self-test export.
set(parser_fixture_object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-parser-fixtures.o")
set(parser_fixture_input "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-parser-fixtures.tower")
file(GENERATE OUTPUT "${parser_fixture_input}"
  CONTENT "import \"${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/parser-integration\";\n")
add_custom_command(OUTPUT "${parser_fixture_object}"
  COMMAND "${bootstrap}" "${parser_fixture_input}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    --library --target "${triple}" -o "${parser_fixture_object}" --depfile "${parser_fixture_object}.d"
  DEPFILE "${parser_fixture_object}.d"
  DEPENDS ${dependency} "${parser_fixture_input}" scaffolding/tests/parser-integration.tower VERBATIM)
set_source_files_properties("${parser_fixture_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
target_sources(tower-compiler-parser-nodes INTERFACE "${parser_fixture_object}")
