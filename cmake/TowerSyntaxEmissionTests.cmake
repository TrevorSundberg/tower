# Preserve the independently compiled production-API fixtures and oracle.
get_property(emission_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
tower_runtime_object(tower-emission-oracle "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_emission_oracle.tower" "${emission_triple}")
tower_runtime_object(tower-emission-cases "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_emission.tower" "${emission_triple}")
target_sources(tower-compiler-parser-nodes INTERFACE "${tower-emission-oracle_OBJECT}" "${tower-emission-cases_OBJECT}")
add_test(NAME tower-emission-tests COMMAND tower-parser-tests --suite emission)

# The reader's shared test services already link the parser-only allocator,
# production units and the independently compiled emission oracle.
if(NOT CMAKE_CROSSCOMPILING AND CMAKE_SYSTEM_NAME STREQUAL "Linux" AND emission_triple MATCHES "^x86_64-.*linux.*gnu")
  get_property(emission_runtime GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
  foreach(entry IN ITEMS syntax_emission syntax_emission_test)
    set(path "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${entry}.tower")
    foreach(jobs IN ITEMS 1 4)
      set(name "tower-selected-${entry}-jobs-${jobs}")
      add_test(NAME "${name}" COMMAND tower-selected-test-count "9 tests passed for ${path}"
        "${TOWER_BOOTSTRAP_COMPILER}" --test "${path}" --jobs "${jobs}" --test-details
        --test-native-runtime "${emission_runtime}" --link "$<TARGET_FILE:tower-reader-test-services>"
        --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-reader-test-services>")
      set_tests_properties("${name}" PROPERTIES LABELS "native;focused" TIMEOUT 180)
    endforeach()
  endforeach()
endif()
