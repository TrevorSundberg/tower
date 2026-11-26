# Independent Tower grammar snapshots over production shared nodes.
get_property(lr_grammar_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
tower_runtime_object(tower-lr-grammar-suite "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/lr_grammar.tower" "${lr_grammar_triple}")
target_sources(tower-parser-tests PRIVATE "${tower-lr-grammar-suite_OBJECT}")
add_test(NAME tower-lr-grammar COMMAND tower-parser-tests --suite lr-grammar)

# TowerReaderTests supplies these native GNU/Linux parser services and fault allocator.
if(TARGET tower-reader-test-services)
  get_property(lr_grammar_runtime GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
  foreach(selection IN ITEMS owner direct)
    set(lr_grammar_file lr_grammar_test)
    set(lr_grammar_count 4)
    if(selection STREQUAL "owner")
      # Default discovery includes five transitive work_budget declarations.
      set(lr_grammar_file lr_grammar)
      set(lr_grammar_count 9)
    endif()
    set(lr_grammar_entry "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${lr_grammar_file}.tower")
    foreach(jobs IN ITEMS 1 4)
      set(lr_grammar_test tower-lr-grammar-${selection}-jobs-${jobs})
      add_test(NAME "${lr_grammar_test}" COMMAND tower-selected-test-count
        "${lr_grammar_count} tests passed for ${lr_grammar_entry}"
        "${TOWER_BOOTSTRAP_COMPILER}" --test "${lr_grammar_entry}" --jobs "${jobs}" --test-details
        --test-native-runtime "${lr_grammar_runtime}" --link "$<TARGET_FILE:tower-reader-test-services>"
        --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-reader-test-services>")
      set_tests_properties("${lr_grammar_test}" PROPERTIES LABELS "native;focused" TIMEOUT 60)
    endforeach()
  endforeach()
endif()
