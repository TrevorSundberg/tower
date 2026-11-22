# Independent Tower grammar snapshots over production shared nodes.
get_property(lr_grammar_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
tower_runtime_object(tower-lr-grammar-suite "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/lr_grammar.tower" "${lr_grammar_triple}")
target_sources(tower-parser-tests PRIVATE "${tower-lr-grammar-suite_OBJECT}")
add_test(NAME tower-lr-grammar COMMAND tower-parser-tests --suite lr-grammar)
