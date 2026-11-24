# Tower-only execution contracts against production compiler/interpreter objects.
option(TOWER_EXECUTION_TESTS "Build Tower execution and package tests" OFF)
function(tower_execution_tests)
  if(NOT TOWER_EXECUTION_TESTS OR NOT TARGET towerc)
    return()
  endif()
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  get_property(source GLOBAL PROPERTY TOWER_DRIVER_PRODUCTION_SOURCE)
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_execution_tests.tower")
  file(GENERATE OUTPUT "${input}" CONTENT "${source}import tests.execution_main;\n")
  tower_runtime_object(tower-execution-tests "${input}" "${triple}")
  get_target_property(sources towerc SOURCES)
  list(REMOVE_ITEM sources "${CMAKE_CURRENT_BINARY_DIR}/tower-driver.o")
  get_target_property(libraries towerc LINK_LIBRARIES)
  add_executable(tower-execution-tests ${sources} "${tower-execution-tests_OBJECT}")
  set_target_properties(tower-execution-tests PROPERTIES LINKER_LANGUAGE CXX)
  target_compile_options(tower-execution-tests PRIVATE -fno-exceptions)
  target_link_libraries(tower-execution-tests PRIVATE ${libraries})
  enable_testing()
  add_test(NAME tower-execution COMMAND tower-execution-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
  foreach(pointer_bytes IN ITEMS 4 8)
    add_test(NAME "tower-canonical-pointer-order-${pointer_bytes}" COMMAND tower-execution-tests
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" backend-pointer-execute
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/backend_pointer_order.tower" "${pointer_bytes}")
    set_tests_properties("tower-canonical-pointer-order-${pointer_bytes}" PROPERTIES
      TIMEOUT 180 LABELS "native;backend;focused")
    add_test(NAME "tower-signed-pointer-order-${pointer_bytes}" COMMAND tower-execution-tests
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" backend-signed-pointer
      "${CMAKE_CURRENT_BINARY_DIR}/signed_pointer_${pointer_bytes}.tower" "${pointer_bytes}")
    set_tests_properties("tower-signed-pointer-order-${pointer_bytes}" PROPERTIES
      TIMEOUT 180 LABELS "native;backend;focused")
    add_test(NAME "tower-canonical-constant-address-${pointer_bytes}" COMMAND tower-execution-tests
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" backend-pointer-execute
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/backend_constant_address.tower" "${pointer_bytes}")
    set_tests_properties("tower-canonical-constant-address-${pointer_bytes}" PROPERTIES
      TIMEOUT 90 LABELS "native;backend;focused")
  endforeach()

  # The measurement owns a Linux x64 getrusage ABI. Keep it outside the
  # portable execution runner and reuse this same production link closure.
  if(TOWER_NATIVE AND CMAKE_SYSTEM_NAME STREQUAL "Linux" AND triple MATCHES "^x86_64-.*linux")
    set(profile_input "${CMAKE_CURRENT_BINARY_DIR}/tower_type_reachability_profile.tower")
    file(GENERATE OUTPUT "${profile_input}" CONTENT "${source}import tests.type_reachability_profile;\n")
    tower_runtime_object(tower-type-reachability-profile "${profile_input}" "${triple}")
    add_executable(tower-type-reachability-profile EXCLUDE_FROM_ALL
      ${sources} "${tower-type-reachability-profile_OBJECT}")
    set_target_properties(tower-type-reachability-profile PROPERTIES LINKER_LANGUAGE CXX)
    target_link_libraries(tower-type-reachability-profile PRIVATE ${libraries})
    add_custom_target(tower-measure-type-reachability
      COMMAND "$<TARGET_FILE:tower-type-reachability-profile>" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding"
      DEPENDS tower-type-reachability-profile USES_TERMINAL VERBATIM)
  endif()
endfunction()
