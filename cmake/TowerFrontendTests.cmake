# Keep functional world checks in their own Tower unit. They call the production
# ABI and need no native harness or enlarged bootstrap compilation-unit limit.
if(TOWER_PARSER_ONLY)
  set(frontend_tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/frontend_world.tower")
  set(frontend_tests_object "${CMAKE_CURRENT_BINARY_DIR}/tower-frontend-world-tests.o")
  add_custom_command(OUTPUT "${frontend_tests_object}"
    COMMAND "${bootstrap}" "${frontend_tests}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --library --target "${triple}" -o "${frontend_tests_object}" --depfile "${frontend_tests_object}.d"
    DEPFILE "${frontend_tests_object}.d"
    DEPENDS ${dependency} "${frontend_tests}" scaffolding/bedrock.tower scaffolding/foundation.tower
    VERBATIM)
  set_source_files_properties("${frontend_tests_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  target_sources(tower-compiler-parser-nodes INTERFACE "${frontend_tests_object}")
endif()
