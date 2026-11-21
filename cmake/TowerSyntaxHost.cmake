# Baseline transport uses the shared Tower session/formatter APIs on every host.
set(syntax_host_input "${CMAKE_CURRENT_BINARY_DIR}/tower_compiler_syntax_host.tower")
file(GENERATE OUTPUT "${syntax_host_input}" CONTENT "import host.syntax_baseline;\n")
set(syntax_host_object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-syntax-host.o")
add_custom_command(OUTPUT "${syntax_host_object}"
  COMMAND "${bootstrap}" "${syntax_host_input}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    --library --target "${triple}" -o "${syntax_host_object}" --depfile "${syntax_host_object}.d"
  DEPFILE "${syntax_host_object}.d"
  DEPENDS ${dependency} "${syntax_host_input}" scaffolding/host/syntax_baseline.tower VERBATIM)
set_source_files_properties("${syntax_host_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
target_sources(tower-compiler-parser-nodes INTERFACE "${syntax_host_object}")
