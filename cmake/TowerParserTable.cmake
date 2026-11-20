# Own parser table lifetime and derived diagnostic indexes in a Tower unit.
set(parser_table_input "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-parser-table.tower")
set(parser_table_object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-parser-table.o")
file(GENERATE OUTPUT "${parser_table_input}"
  CONTENT "import \"${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/parser-table\";\n")
add_custom_command(OUTPUT "${parser_table_object}"
  COMMAND "${bootstrap}" "${parser_table_input}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    --library --target "${triple}" -o "${parser_table_object}" --depfile "${parser_table_object}.d"
  DEPFILE "${parser_table_object}.d"
  DEPENDS ${dependency} "${parser_table_input}" scaffolding/compiler/parser-table.tower
    scaffolding/bedrock.tower scaffolding/foundation.tower
  VERBATIM)
set_source_files_properties("${parser_table_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
target_sources(tower-compiler-parser-nodes INTERFACE "${parser_table_object}")
