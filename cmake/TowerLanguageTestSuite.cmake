# The optional kit owns a private compiler/resource tree. Its test sources
# and providers never enter the ordinary native or browser compiler packages.
get_property(scc_runtime GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
get_property(scc_allocator GLOBAL PROPERTY TOWER_RUNTIME_INSTRUMENTED_OBJECT)
set(scc_providers "${scc_runtime}" "${scc_allocator}" "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-bytes.o"
  "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-utf8.o" "$<TARGET_FILE:tower-compiler-memory>")
tower_selected_test_count("${triple}")
add_custom_target(tower-entity-tests ALL DEPENDS towerc tower-selected-test-count tower-guest-native-test
  "${scc_allocator}" tower-compiler-memory)
add_custom_target(tower-language-tests DEPENDS tower-entity-tests ${scc_providers})
if(narrow_abi_tests)
  # The native test guest uses the same ELF profile as its uninstrumented runtime.
  tower_runtime_object(narrow-foreign-library
    "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/narrow_foreign_library.tower" "${triple}" UNINSTRUMENTED)
  add_custom_target(tower-narrow-foreign-provider DEPENDS "${narrow-foreign-library_OBJECT}")
  add_custom_target(tower-narrow-foreign-tests ALL DEPENDS
    tower-narrow-foreign-provider towerc tower-selected-test-count tower-guest-native-test)
  add_dependencies(tower-language-tests tower-narrow-foreign-tests)
  list(APPEND scc_providers "${narrow-foreign-library_OBJECT}")
endif()
add_custom_target(tower-scc-suite DEPENDS tower-language-tests)
# Retain the original component and prefix for consumers of the SCC installation.
# CTest reads the same registrations in the build and after relocation.
set(scc_bin "${CMAKE_CURRENT_BINARY_DIR}")
set(scc_objects "${CMAKE_CURRENT_BINARY_DIR}")
set(scc_root "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
configure_file("${CMAKE_CURRENT_LIST_DIR}/TowerLanguageTests.cmake.in" "scc-tests.cmake" @ONLY)
set_property(DIRECTORY APPEND PROPERTY TEST_INCLUDE_FILES "${CMAKE_CURRENT_BINARY_DIR}/scc-tests.cmake")

set(scc_bin ".")
set(scc_objects "${scc_bin}/providers")
set(scc_root "${scc_bin}/share/tower")
configure_file("${CMAKE_CURRENT_LIST_DIR}/TowerLanguageTests.cmake.in" "scc-install/CTestTestfile.cmake" @ONLY)
set(scc_install COMPONENT SccTests EXCLUDE_FROM_ALL)
install(PROGRAMS "$<TARGET_FILE:towerc>" "$<TARGET_FILE:tower-selected-test-count>" DESTINATION scc-suite ${scc_install})
install(FILES bootstrap/linux-x64/LLVM-LICENSE.txt "${CMAKE_CURRENT_BINARY_DIR}/scc-install/CTestTestfile.cmake" DESTINATION scc-suite ${scc_install})
install(FILES ${scc_providers} DESTINATION scc-suite/providers ${scc_install})
foreach(resource IN LISTS builtin_modules)
  get_filename_component(dir "${resource}" DIRECTORY)
  install(FILES "${CMAKE_CURRENT_BINARY_DIR}/share/tower/${resource}" DESTINATION "scc-suite/share/tower/${dir}" ${scc_install})
endforeach()
get_property(scc_runtimes GLOBAL PROPERTY TOWER_GUEST_NATIVE_RESOURCES)
install(FILES ${scc_runtimes} DESTINATION scc-suite/share/tower ${scc_install})
install(FILES scaffolding/library/bytes_test.tower scaffolding/library/graph_components_test.tower scaffolding/library/graph_components_wrong.tower
  scaffolding/library/graph_components_expectations.tower scaffolding/library/sha256_test.tower
  scaffolding/library/test_data.tower scaffolding/library/work_graph_test.tower scaffolding/library/work_budget_test.tower
  scaffolding/library/entity_stage_ownership_test.tower
  scaffolding/library/stack_test.tower scaffolding/library/queue_test.tower
  scaffolding/library/gzip_test.tower scaffolding/library/gzip_test_data.tower
  DESTINATION scc-suite/share/tower/library ${scc_install})
install(FILES scaffolding/host/memory.tower scaffolding/host/memory_libc.tower scaffolding/host/memory_types.tower
  DESTINATION scc-suite/share/tower/host ${scc_install})
install(FILES scaffolding/compiler/generic_registry.tower scaffolding/compiler/generic_registry_types.tower
  scaffolding/compiler/entity_require.tower DESTINATION scc-suite/share/tower/compiler ${scc_install})
install(FILES scaffolding/tests/entities.tower scaffolding/tests/entities_test.tower scaffolding/tests/entities.expected
  scaffolding/tests/entity_views.tower scaffolding/tests/entity_views_test.tower scaffolding/tests/entity_views.expected
  scaffolding/tests/generic_registry.tower scaffolding/tests/generic_registry_test.tower scaffolding/tests/generic_registry.expected
  scaffolding/tests/generic_body_budget.tower scaffolding/tests/entity_store.tower scaffolding/tests/entity_store_test.tower
  scaffolding/tests/entity_stage_ownership_cases.tower
  scaffolding/tests/graph_components_checks.tower scaffolding/tests/utility_checks.tower
  scaffolding/tests/narrow_foreign.tower scaffolding/tests/narrow_foreign_test.tower
  DESTINATION scc-suite/share/tower/tests ${scc_install})
install(FILES scaffolding/compiler/semantic_statements_cfg_output.tower
  DESTINATION scc-suite/share/tower/compiler ${scc_install})
install(FILES scaffolding/tests/semantic_statements_cfg_inputs/exchange.tower
  scaffolding/tests/semantic_statements_cfg_inputs/exchange_test.tower
  scaffolding/tests/semantic_statements_cfg_inputs/exchange.expected
  DESTINATION scc-suite/share/tower/tests/semantic_statements_cfg_inputs ${scc_install})
