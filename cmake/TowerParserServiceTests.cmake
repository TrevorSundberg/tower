# Small independent translation units keep focused native-test successors below
# the published bootstrap specialization budget without changing compiler limits.
get_property(service_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
set(service_entry main)
if(service_triple MATCHES "^wasm")
  set(service_entry __main_argc_argv)
endif()
set(lexer_input "${CMAKE_CURRENT_BINARY_DIR}/tower_lexer_tests.tower")
file(GENERATE OUTPUT "${lexer_input}" CONTENT
  "import tower;\nimport tests.lexer_table;\nexport fn ${service_entry}(argc: i32, argv: u8**): i32 { lexer_table_tests(); return 0; }\n")
tower_runtime_object(tower-lexer-tests "${lexer_input}" "${service_triple}")
add_executable(tower-lexer-tests "${tower-lexer-tests_OBJECT}")
set_target_properties(tower-lexer-tests PROPERTIES LINKER_LANGUAGE CXX)
target_link_libraries(tower-lexer-tests PRIVATE tower-compiler-memory tower-compiler-utilities)
add_test(NAME tower-lexer-tests COMMAND tower-lexer-tests)

if(NOT CMAKE_CROSSCOMPILING AND service_triple MATCHES "^x86_64-.*linux.*gnu")
  tower_guest_runtime(native-test "${service_triple}" posix ON UNINSTRUMENTED)
  tower_guest_runtime(host-library "${service_triple}" posix OFF UNINSTRUMENTED)
  tower_selected_test_count("${service_triple}")
  add_dependencies(tower-lexer-tests tower-guest-native-test tower-selected-test-count)
  get_property(lexer_runtime GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
  foreach(selection IN ITEMS lexer_table lexer_table_test)
    set(lexer_count 6)
    if(selection STREQUAL "lexer_table")
      # The owner also discovers the five work_budget tests.
      set(lexer_count 11)
    endif()
    set(lexer_path "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${selection}.tower")
    foreach(jobs IN ITEMS 1 4)
      set(lexer_name "tower-selected-${selection}-jobs-${jobs}")
      add_test(NAME "${lexer_name}" COMMAND tower-selected-test-count "${lexer_count} tests passed for ${lexer_path}"
        "${TOWER_BOOTSTRAP_COMPILER}" --test "${lexer_path}" --jobs "${jobs}" --test-details
        --test-native-runtime "${lexer_runtime}" --link "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-bytes.o"
        --link "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-utf8.o" --link "$<TARGET_FILE:tower-compiler-memory>")
      set_tests_properties("${lexer_name}" PROPERTIES LABELS "native;focused" TIMEOUT 60)
    endforeach()
  endforeach()
endif()

set(entity_input "${CMAKE_CURRENT_BINARY_DIR}/tower_entity_tests.tower")
file(GENERATE OUTPUT "${entity_input}" CONTENT
  "import tower;\nimport tests.entity_store;\nexport fn ${service_entry}(argc: i32, argv: u8**): i32 { entity_store_tests(); return 0; }\n")
tower_runtime_object(tower-entity-tests "${entity_input}" "${service_triple}")
add_executable(tower-entity-tests "${tower-entity-tests_OBJECT}")
set_target_properties(tower-entity-tests PROPERTIES LINKER_LANGUAGE CXX)
target_link_libraries(tower-entity-tests PRIVATE tower-compiler-memory tower-compiler-utilities)
add_test(NAME tower-entity-tests COMMAND tower-entity-tests)
if(NOT CMAKE_CROSSCOMPILING AND service_triple MATCHES "^x86_64-.*linux.*gnu")
  add_dependencies(tower-entity-tests tower-guest-native-test tower-selected-test-count)
  get_property(entity_runtime GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
  foreach(selection IN ITEMS entity_store entity_store_native_test)
    set(entity_path "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${selection}.tower")
    foreach(jobs IN ITEMS 1 4)
      set(entity_name "tower-selected-${selection}-native-jobs-${jobs}")
      add_test(NAME "${entity_name}" COMMAND tower-selected-test-count "1 test passed for ${entity_path}"
        "${TOWER_BOOTSTRAP_COMPILER}" --test "${entity_path}" --jobs "${jobs}" --test-details
        --test-suffix _native_test.tower --test-native-runtime "${entity_runtime}"
        --test-oracle "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/entity_store_native.expected"
        --link "$<TARGET_FILE:tower-compiler-memory>")
      set_tests_properties("${entity_name}" PROPERTIES LABELS "native;focused" TIMEOUT 60)
    endforeach()
  endforeach()
endif()

# Keep storage coverage in the existing aggregate as well as the opt-in focused
# native runner. This object imports only layouts/interfaces and test fixtures.
set(storage_input "${CMAKE_CURRENT_BINARY_DIR}/tower_storage_cases.tower")
file(GENERATE OUTPUT "${storage_input}" CONTENT "import tower;\nimport tests.compiler_storage;\nimport tests.entity_registry;\n")
tower_runtime_object(tower-storage-cases "${storage_input}" "${service_triple}")
target_sources(tower-parser-tests PRIVATE "${tower-storage-cases_OBJECT}")
