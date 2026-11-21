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
set(lexer_object "${CMAKE_CURRENT_BINARY_DIR}/tower-lexer-tests.o")
add_custom_command(OUTPUT "${lexer_object}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${lexer_input}" --library --target "${service_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${lexer_object}" --depfile "${lexer_object}.d"
  DEPFILE "${lexer_object}.d"
  DEPENDS "${lexer_input}" "${TOWER_BOOTSTRAP_COMPILER}"
    scaffolding/tests/lexer_table.tower scaffolding/tests/lexer_table_oracle.tower
    scaffolding/tests/mt19937.tower scaffolding/tests/utility_checks.tower VERBATIM)
set_source_files_properties("${lexer_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
add_executable(tower-lexer-tests "${lexer_object}")
set_target_properties(tower-lexer-tests PROPERTIES LINKER_LANGUAGE CXX)
target_link_libraries(tower-lexer-tests PRIVATE tower-compiler-memory tower-compiler-utilities)
add_test(NAME tower-lexer-tests COMMAND tower-lexer-tests)

set(entity_input "${CMAKE_CURRENT_BINARY_DIR}/tower_entity_tests.tower")
file(GENERATE OUTPUT "${entity_input}" CONTENT
  "import tower;\nimport tests.entity_store;\nexport fn ${service_entry}(argc: i32, argv: u8**): i32 { entity_store_tests(); return 0; }\n")
set(entity_object "${CMAKE_CURRENT_BINARY_DIR}/tower-entity-tests.o")
add_custom_command(OUTPUT "${entity_object}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${entity_input}" --library --target "${service_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${entity_object}" --depfile "${entity_object}.d"
  DEPFILE "${entity_object}.d"
  DEPENDS "${entity_input}" "${TOWER_BOOTSTRAP_COMPILER}"
    scaffolding/tests/entity_store.tower scaffolding/tests/utility_checks.tower VERBATIM)
set_source_files_properties("${entity_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
add_executable(tower-entity-tests "${entity_object}")
set_target_properties(tower-entity-tests PROPERTIES LINKER_LANGUAGE CXX)
target_link_libraries(tower-entity-tests PRIVATE tower-compiler-memory tower-compiler-utilities)
add_test(NAME tower-entity-tests COMMAND tower-entity-tests)

# Keep storage coverage in the existing aggregate as well as the opt-in focused
# native runner. This object imports only layouts/interfaces and test fixtures.
set(storage_cases "${CMAKE_CURRENT_BINARY_DIR}/tower-storage-cases.o")
set(storage_input "${CMAKE_CURRENT_BINARY_DIR}/tower_storage_cases.tower")
file(GENERATE OUTPUT "${storage_input}" CONTENT "import tower;\nimport tests.compiler_storage;\nimport tests.entity_registry;\n")
add_custom_command(OUTPUT "${storage_cases}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${storage_input}"
    --library --target "${service_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${storage_cases}" --depfile "${storage_cases}.d"
  DEPFILE "${storage_cases}.d"
  DEPENDS "${storage_input}" scaffolding/tests/compiler_storage.tower scaffolding/tests/entity_registry.tower "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
set_source_files_properties("${storage_cases}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
target_sources(tower-parser-tests PRIVATE "${storage_cases}")
