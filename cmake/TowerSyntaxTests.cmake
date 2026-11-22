# Keep the live fixtures' existing interface-object contract across profiles.
get_property(live_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
tower_runtime_object(tower-syntax-live-cases "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_live.tower" "${live_triple}")
target_sources(tower-compiler-parser-nodes INTERFACE "${tower-syntax-live-cases_OBJECT}")

function(tower_syntax_test_runner)
  add_test(NAME tower-live-syntax COMMAND tower-parser-tests --suite live)
  set_tests_properties(tower-live-syntax PROPERTIES WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
endfunction()
