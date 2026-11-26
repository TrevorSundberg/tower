get_property(payload_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
tower_runtime_object(tower-syntax-nodes-cases "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_nodes.tower" "${payload_triple}")
target_sources(tower-parser-tests PRIVATE "${tower-syntax-nodes-cases_OBJECT}")
add_test(NAME tower-syntax-nodes-tests COMMAND tower-parser-tests --suite nodes)

# The payload and reader guests use the same serial, fault-injectable parser services.
if(NOT CMAKE_CROSSCOMPILING AND CMAKE_SYSTEM_NAME STREQUAL "Linux" AND payload_triple MATCHES "^x86_64-.*linux.*gnu")
  tower_guest_runtime(native-test "${payload_triple}" posix ON UNINSTRUMENTED)
  get_property(payload_runtime GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
  # The payload imports work_budget_types only. Both routes select four payload cases.
  foreach(selection IN ITEMS owner direct)
    set(payload_file syntax_nodes)
    if(selection STREQUAL "direct")
      set(payload_file syntax_nodes_test)
    endif()
    set(payload_entry "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${payload_file}.tower")
    foreach(jobs IN ITEMS 1 4)
      set(name "tower-syntax-nodes-${selection}-jobs-${jobs}")
      add_test(NAME "${name}" COMMAND tower-selected-test-count
        "4 tests passed for ${payload_entry}" "${TOWER_BOOTSTRAP_COMPILER}" --test "${payload_entry}"
        --jobs "${jobs}" --test-details --test-native-runtime "${payload_runtime}"
        --link "$<TARGET_FILE:tower-reader-test-services>" --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-reader-test-services>")
      set_tests_properties("${name}" PROPERTIES LABELS "native;focused" TIMEOUT 60)
    endforeach()
  endforeach()
endif()
