# Task 3's isolated runtime objects; included from the utility composition.
# Do not attach graph finalization to the allocator's archive member: byte/UTF-8
# clients use allocation without linking compiler entities or semantic nodes.
set(shared_lifecycle "${CMAKE_CURRENT_BINARY_DIR}/tower-shared-lifecycle.o")
add_custom_command(OUTPUT "${shared_lifecycle}"
  COMMAND "${bootstrap}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/entity_lifecycle.tower"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    --library --target "${triple}" -o "${shared_lifecycle}" --depfile "${shared_lifecycle}.d"
  DEPFILE "${shared_lifecycle}.d"
    DEPENDS ${bootstrap_dependency} scaffolding/host/entity_lifecycle.tower
    scaffolding/bedrock.tower scaffolding/foundation.tower VERBATIM)
set_source_files_properties("${shared_lifecycle}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
target_sources(tower-compiler-entities INTERFACE "${shared_lifecycle}")
include("${CMAKE_CURRENT_LIST_DIR}/TowerLegacyHost.cmake")

if(TOWER_PARSER_ONLY)
  set(shared_tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/units/shared_checks.tower")
  set(shared_tests_object "${CMAKE_CURRENT_BINARY_DIR}/tower-shared-runtime-tests.o")
  add_custom_command(OUTPUT "${shared_tests_object}"
    COMMAND "${bootstrap}" "${shared_tests}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --library --target "${triple}" -o "${shared_tests_object}" --depfile "${shared_tests_object}.d"
    DEPFILE "${shared_tests_object}.d"
    DEPENDS ${bootstrap_dependency} "${shared_tests}" scaffolding/bedrock.tower scaffolding/foundation.tower VERBATIM)
  set_source_files_properties("${shared_tests_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  target_sources(tower-compiler-entities INTERFACE "${shared_tests_object}")
endif()
