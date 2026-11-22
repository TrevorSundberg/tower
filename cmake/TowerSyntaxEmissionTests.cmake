# Preserve the independently compiled production-API fixtures and oracle.
get_property(emission_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
tower_runtime_object(tower-emission-oracle "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_emission_oracle.tower" "${emission_triple}")
tower_runtime_object(tower-emission-cases "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_emission.tower" "${emission_triple}")
target_sources(tower-compiler-parser-nodes INTERFACE "${tower-emission-oracle_OBJECT}" "${tower-emission-cases_OBJECT}")
add_test(NAME tower-emission-tests COMMAND tower-parser-tests --suite emission)
