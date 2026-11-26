if(NOT policy_triple MATCHES "^x86_64-.*linux")
  return()
endif()

# The fixture imports the portable transport and links the single-owner allocator.
tower_runtime_object(entity-mutation-results
  "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/entity_mutation_results_main.tower" "${policy_triple}")
add_executable(tower-entity-mutation-results-tests
  "${entity-mutation-results_OBJECT}" "${policy_runtime}" "${policy_trap}")
set_target_properties(tower-entity-mutation-results-tests PROPERTIES LINKER_LANGUAGE C TOWER_SERIAL_WORK_TRANSPORT TRUE)
target_link_libraries(tower-entity-mutation-results-tests PRIVATE Threads::Threads ${CMAKE_DL_LIBS})
add_test(NAME tower-entity-mutation-results-tests COMMAND tower-entity-mutation-results-tests)
set_tests_properties(tower-entity-mutation-results-tests PROPERTIES TIMEOUT 30)

if(CMAKE_CROSSCOMPILING OR TOWER_SANITIZER OR NOT policy_triple MATCHES "^x86_64-.*linux.*gnu")
  return()
endif()

get_property(mutation_guest GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
add_dependencies(tower-entity-mutation-results-tests tower-guest-native-test tower-selected-test-count)
foreach(selection IN ITEMS owner direct)
  set(entry "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/entity_mutation_results.tower")
  # Owner discovery also runs five work-budget tests.
  set(count 12)
  if(selection STREQUAL "direct")
    set(count 7)
    set(entry "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/entity_mutation_results_test.tower")
  endif()
  foreach(jobs IN ITEMS 1 4)
    set(name "tower-entity-mutation-results-${selection}-jobs-${jobs}")
    add_test(NAME "${name}" COMMAND tower-selected-test-count "${count} tests passed for ${entry}"
      "${TOWER_BOOTSTRAP_COMPILER}" --test "${entry}" --jobs "${jobs}" --test-details
      --test-native-runtime "${mutation_guest}" --link "${policy_runtime}")
    set_tests_properties("${name}" PROPERTIES LABELS "native;focused" TIMEOUT 60)
  endforeach()
endforeach()
