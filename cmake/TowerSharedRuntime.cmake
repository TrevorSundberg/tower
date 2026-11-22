# Do not attach graph finalization to the allocator's archive member: byte/UTF-8
# clients use allocation without linking compiler entities or semantic nodes.
tower_runtime_object(tower-shared-lifecycle "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/entity_lifecycle.tower" "${triple}")
target_sources(tower-compiler-entities INTERFACE "${tower-shared-lifecycle_OBJECT}")
include("${CMAKE_CURRENT_LIST_DIR}/TowerLegacyHost.cmake")

if(TOWER_PARSER_ONLY)
  tower_runtime_object(tower-shared-runtime-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/units/shared_checks.tower" "${triple}")
  target_sources(tower-compiler-entities INTERFACE "${tower-shared-runtime-tests_OBJECT}")
endif()
