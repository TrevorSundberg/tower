# Independent LR analysis/control oracle and production ownership fixtures.
get_property(lr_analysis_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
tower_runtime_object(tower-lr-analysis-suite "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/lr_analysis.tower" "${lr_analysis_triple}")
target_sources(tower-parser-tests PRIVATE "${tower-lr-analysis-suite_OBJECT}")
add_test(NAME tower-lr-analysis COMMAND tower-parser-tests --suite lr-analysis)
