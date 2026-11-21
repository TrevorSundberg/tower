# Opt-in native frontend checks beside the existing backend API tests.
# All test behavior is Tower; reuse the production compiler objects and the
# existing allocator's failure-injection mode without enabling sanitizers.
set(frontend_test_object "${CMAKE_CURRENT_BINARY_DIR}/tower-frontend-tests.o")
add_custom_command(OUTPUT "${frontend_test_object}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/frontend_main.tower"
    --library --target "${triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${frontend_test_object}" --depfile "${frontend_test_object}.d"
  DEPFILE "${frontend_test_object}.d"
  DEPENDS scaffolding/tests/frontend_main.tower "${TOWER_BOOTSTRAP_COMPILER}"
  VERBATIM)
set_source_files_properties("${frontend_test_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
get_property(runtime_instrumented GLOBAL PROPERTY TOWER_RUNTIME_INSTRUMENTED_OBJECT)
add_executable(tower-frontend-tests ${test_sources} "${frontend_test_object}" "${runtime_instrumented}")
set_target_properties(tower-frontend-tests PROPERTIES LINKER_LANGUAGE CXX)
target_compile_options(tower-frontend-tests PRIVATE -fno-exceptions)
target_compile_definitions(tower-frontend-tests PRIVATE TOWER_COMPILER_MEMORY_TESTS=1)
target_link_libraries(tower-frontend-tests PRIVATE ${test_libraries})
enable_testing()
add_test(NAME tower-frontend COMMAND tower-frontend-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
