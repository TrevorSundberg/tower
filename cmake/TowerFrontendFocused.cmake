# Opt-in native frontend checks beside the existing backend API tests.
# All test behavior is Tower; reuse the production compiler objects and the
# existing allocator's failure-injection mode without enabling sanitizers.
tower_runtime_object(tower-frontend-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/frontend_main.tower" "${triple}")
get_property(runtime_instrumented GLOBAL PROPERTY TOWER_RUNTIME_INSTRUMENTED_OBJECT)
add_executable(tower-frontend-tests ${test_sources} "${tower-frontend-tests_OBJECT}" "${runtime_instrumented}")
set_target_properties(tower-frontend-tests PROPERTIES LINKER_LANGUAGE CXX)
target_compile_options(tower-frontend-tests PRIVATE -fno-exceptions)
target_compile_definitions(tower-frontend-tests PRIVATE TOWER_COMPILER_MEMORY_TESTS=1)
target_link_libraries(tower-frontend-tests PRIVATE ${test_libraries})
enable_testing()
add_test(NAME tower-frontend COMMAND tower-frontend-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
add_test(NAME tower-frontend-structure-reuse COMMAND tower-frontend-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" structure-reuse)
# Match focused producer checks; the full frontend suite keeps its own policy.
set_tests_properties(tower-frontend-structure-reuse PROPERTIES TIMEOUT 60 LABELS "native;focused")
foreach(selector IN ITEMS graph-components lr-components lr-scratch-budget)
  add_test(NAME tower-frontend-${selector} COMMAND tower-frontend-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" ${selector})
  set_tests_properties(tower-frontend-${selector} PROPERTIES TIMEOUT 60 LABELS "native;focused")
endforeach()
