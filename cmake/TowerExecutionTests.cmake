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
  add_test(NAME tower-forward-references COMMAND tower-execution-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" forward-references)
  set_tests_properties(tower-forward-references PROPERTIES TIMEOUT 60 LABELS "native;focused")
  add_test(NAME tower-execution-resource-root COMMAND tower-execution-tests
    "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" floating)
  set_tests_properties(tower-execution-resource-root PROPERTIES
    WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
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
    if(TARGET tower-backend-source-tests)
      foreach(workers IN ITEMS 1 4)
        set(import_test "tower-backend-constant-address-${pointer_bytes}-${workers}")
        get_test_property("${import_test}" WORKING_DIRECTORY constant_workdir)
        set(execution_test "tower-reconstructed-constant-address-${pointer_bytes}-${workers}")
        add_test(NAME "${execution_test}" COMMAND tower-execution-tests
          "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" backend-pointer-execute
          "${constant_workdir}/constant_address_${pointer_bytes}_${workers}.tower" "${pointer_bytes}")
        set_tests_properties("${execution_test}" PROPERTIES WORKING_DIRECTORY "${constant_workdir}"
          FIXTURES_REQUIRED "${import_test}" TIMEOUT 90 LABELS "native;backend;focused")
      endforeach()
    endif()
  endforeach()

  if(TOWER_NATIVE AND CMAKE_SYSTEM_NAME STREQUAL "Linux" AND triple MATCHES "^x86_64-.*linux")
    add_test(NAME tower-retained-source-updates COMMAND tower-execution-tests
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" retained-sources)
    set_tests_properties(tower-retained-source-updates PROPERTIES TIMEOUT 90 LABELS "native;focused;query")
    set(capture_input "${CMAKE_CURRENT_BINARY_DIR}/tower_staged_capture_test.tower")
    file(GENERATE OUTPUT "${capture_input}" CONTENT "${source}import tests.staged_capture_identity;\n")
    tower_runtime_object(tower-staged-capture-test "${capture_input}" "${triple}")
    add_executable(tower-staged-capture-test ${sources} "${tower-staged-capture-test_OBJECT}")
    set_target_properties(tower-staged-capture-test PROPERTIES LINKER_LANGUAGE CXX)
    # Keep the ordinary publication kernel and redirect its single external call in this fixture.
    tower_runtime_object(capture-interpreter "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/units/interpreter.tower"
      "${triple}" semantic_known_publish_kernel capture_publish_original)
    target_sources(tower-staged-capture-test PRIVATE "${capture-interpreter_OBJECT}")
    set(capture_libraries ${libraries})
    list(REMOVE_ITEM capture_libraries tower-compiler-interpreter)
    target_link_libraries(tower-staged-capture-test PRIVATE ${capture_libraries})
    add_test(NAME tower-staged-capture-identity COMMAND tower-staged-capture-test
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
    set_tests_properties(tower-staged-capture-identity PROPERTIES TIMEOUT 90 LABELS "native;focused;query")
    # The measurement owns a Linux x64 getrusage ABI. Keep it outside the
    # portable execution runner and reuse this same production link closure.
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
