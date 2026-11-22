get_property(payload_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
tower_runtime_object(tower-syntax-nodes-cases "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_nodes.tower" "${payload_triple}")
target_sources(tower-parser-tests PRIVATE "${tower-syntax-nodes-cases_OBJECT}")
add_test(NAME tower-syntax-nodes-tests COMMAND tower-parser-tests --suite nodes)
