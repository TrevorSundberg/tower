# Keep functional world checks in their own Tower unit. They call the production
# ABI and need no native harness or enlarged bootstrap compilation-unit limit.
if(TOWER_PARSER_ONLY)
  tower_runtime_object(tower-frontend-world-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/frontend_world.tower" "${triple}")
  target_sources(tower-compiler-parser-nodes INTERFACE "${tower-frontend-world-tests_OBJECT}")
endif()
