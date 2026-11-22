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
