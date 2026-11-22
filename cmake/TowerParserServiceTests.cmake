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

set(entity_input "${CMAKE_CURRENT_BINARY_DIR}/tower_entity_tests.tower")
file(GENERATE OUTPUT "${entity_input}" CONTENT
  "import tower;\nimport tests.entity_store;\nexport fn ${service_entry}(argc: i32, argv: u8**): i32 { entity_store_tests(); return 0; }\n")
tower_runtime_object(tower-entity-tests "${entity_input}" "${service_triple}")
add_executable(tower-entity-tests "${tower-entity-tests_OBJECT}")
set_target_properties(tower-entity-tests PROPERTIES LINKER_LANGUAGE CXX)
target_link_libraries(tower-entity-tests PRIVATE tower-compiler-memory tower-compiler-utilities)
add_test(NAME tower-entity-tests COMMAND tower-entity-tests)

# Keep storage coverage in the existing aggregate as well as the opt-in focused
# native runner. This object imports only layouts/interfaces and test fixtures.
set(storage_input "${CMAKE_CURRENT_BINARY_DIR}/tower_storage_cases.tower")
file(GENERATE OUTPUT "${storage_input}" CONTENT "import tower;\nimport tests.compiler_storage;\nimport tests.entity_registry;\n")
tower_runtime_object(tower-storage-cases "${storage_input}" "${service_triple}")
target_sources(tower-parser-tests PRIVATE "${tower-storage-cases_OBJECT}")
