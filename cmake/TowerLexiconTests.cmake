# Contextual selector fixtures retain their independent Tower oracle.
get_property(lexicon_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
tower_runtime_object(tower-lexicon-suite "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_lexer.tower" "${lexicon_triple}")
target_sources(tower-parser-tests PRIVATE "${tower-lexicon-suite_OBJECT}")
add_test(NAME tower-lexicon COMMAND tower-parser-tests --suite lexicon)
