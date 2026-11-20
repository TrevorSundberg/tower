# Separate Tower unit: diagnostic formatting shares the canonical formatter ABI
# without growing the parser/test aggregate or depending on native algorithms.
set(parser_format_input "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-parser-format.tower")
set(parser_format_object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-parser-format.o")
file(GENERATE OUTPUT "${parser_format_input}"
  CONTENT "import \"${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/parser-presentation\";\n")
add_custom_command(OUTPUT "${parser_format_object}"
  COMMAND "${bootstrap}" "${parser_format_input}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    --library --target "${triple}" -o "${parser_format_object}" --depfile "${parser_format_object}.d"
  DEPFILE "${parser_format_object}.d"
  DEPENDS ${dependency} "${parser_format_input}" scaffolding/compiler/format-parser.tower
    scaffolding/bedrock.tower scaffolding/foundation.tower
  VERBATIM)
set_source_files_properties("${parser_format_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
target_sources(tower-compiler-parser-nodes INTERFACE "${parser_format_object}")
