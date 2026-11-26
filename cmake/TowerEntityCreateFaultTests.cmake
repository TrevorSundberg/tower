# Selected guests supply main and trap. Link the same declaration providers and
# single-owner allocator/transport as the instrumentable standalone executable.
if(NOT CMAKE_CROSSCOMPILING AND NOT TOWER_SANITIZER AND policy_triple MATCHES "^x86_64-.*linux.*gnu")
  add_dependencies(tower-entity-create-faults-tests tower-guest-native-test tower-selected-test-count)
  get_property(create_guest GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
  get_target_property(create_transport tower-compiler-work-serial INTERFACE_SOURCES)
  set(create_oracle "${CMAKE_CURRENT_BINARY_DIR}/entity_create_faults.stdout")
  file(GENERATE OUTPUT "${create_oracle}" CONTENT "0\n")
  foreach(selection IN ITEMS owner direct)
    set(entry "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/entity_create_faults.tower")
    if(selection STREQUAL "direct")
      set(entry "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/entity_create_faults_test.tower")
    endif()
    foreach(jobs IN ITEMS 1 4)
      set(test_name "tower-entity-create-faults-${selection}-jobs-${jobs}")
      add_test(NAME "${test_name}" COMMAND tower-selected-test-count "1 test passed for ${entry}"
        "${TOWER_BOOTSTRAP_COMPILER}" --test "${entry}" --jobs "${jobs}" --test-details
        --test-oracle "${create_oracle}" --test-native-runtime "${create_guest}"
        --link "${host_memory_OBJECT}" --link "${entity-create-provider_OBJECT}"
        --link "${policy_runtime}" --link "${create_transport}")
      set_tests_properties("${test_name}" PROPERTIES LABELS "native;focused" TIMEOUT 60)
    endforeach()
  endforeach()
endif()
