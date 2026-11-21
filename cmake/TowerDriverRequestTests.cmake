# Real compiler environments, instrumented allocations and Tower-only checks.
# This fragment runs after the ordinary driver/backend target composition.
function(tower_driver_request_tests)
  if(NOT TOWER_DRIVER_TESTS OR NOT TARGET tower-backend-native)
    return()
  endif()
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  get_property(source GLOBAL PROPERTY TOWER_DRIVER_SOURCE)
  string(APPEND source "import tests.driver_request;\n")
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_driver_request_tests.tower")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-driver-request-tests.o")
  file(GENERATE OUTPUT "${input}" CONTENT "${source}")
  add_custom_command(OUTPUT "${object}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${input}" --library --target "${triple}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      -o "${object}" --depfile "${object}.d"
    DEPFILE "${object}.d"
    DEPENDS "${input}" "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  get_target_property(sources towerc SOURCES)
  list(REMOVE_ITEM sources "${CMAKE_CURRENT_BINARY_DIR}/tower-driver.o")
  get_target_property(libraries towerc LINK_LIBRARIES)
  list(REMOVE_ITEM libraries tower-compiler-interpreter)
  tower_compiler_evaluation()
  list(APPEND libraries tower-compiler-evaluation)
  get_property(runtime_instrumented GLOBAL PROPERTY TOWER_RUNTIME_INSTRUMENTED_OBJECT)
  add_executable(tower-driver-request-tests ${sources} "${object}" "${runtime_instrumented}")
  target_compile_features(tower-driver-request-tests PRIVATE cxx_std_20)
  target_compile_options(tower-driver-request-tests PRIVATE -fno-exceptions)
  target_compile_definitions(tower-driver-request-tests PRIVATE TOWER_COMPILER_MEMORY_TESTS=1)
  target_link_libraries(tower-driver-request-tests PRIVATE ${libraries})
  target_link_options(tower-driver-request-tests PRIVATE -Wl,--wrap=work_thread_available -Wl,--wrap=work_thread_capacity)
  add_test(NAME tower-driver-request COMMAND tower-driver-request-tests "${CMAKE_CURRENT_BINARY_DIR}/share/tower")
  set_tests_properties(tower-driver-request PROPERTIES WORKING_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/tower-driver-checks")
endfunction()
