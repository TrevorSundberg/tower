# Independent Tower oracle remains a separate object in the shared test command.
get_property(regex_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
tower_runtime_object(tower-regex-suite "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/regex.tower" "${regex_triple}")
target_sources(tower-parser-tests PRIVATE "${tower-regex-suite_OBJECT}")
add_test(NAME tower-regex COMMAND tower-parser-tests --suite regex)
