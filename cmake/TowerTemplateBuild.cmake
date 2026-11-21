# Keep template orchestration in one Tower unit with explicit production APIs.
set(template_input "${CMAKE_CURRENT_BINARY_DIR}/tower_compiler_template_build.tower")
file(GENERATE OUTPUT "${template_input}" CONTENT "import compiler.syntax_template_build;\nimport compiler.syntax_inspection;\nimport compiler.syntax_session_view;\n")
set(template_object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-template-build.o")
add_custom_command(OUTPUT "${template_object}"
  COMMAND "${bootstrap}" "${template_input}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    --library --target "${triple}" -o "${template_object}" --depfile "${template_object}.d"
  DEPFILE "${template_object}.d"
  DEPENDS ${dependency} "${template_input}" scaffolding/compiler/syntax_template_build.tower scaffolding/compiler/syntax_inspection.tower scaffolding/compiler/syntax_session_view.tower
  VERBATIM)
set_source_files_properties("${template_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
target_sources(tower-compiler-parser-nodes INTERFACE "${template_object}")
