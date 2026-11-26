# Independent LR analysis/control oracle and production ownership fixtures.
get_property(lr_analysis_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
tower_runtime_object(tower-lr-analysis-suite "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/lr_analysis.tower" "${lr_analysis_triple}")
target_sources(tower-parser-tests PRIVATE "${tower-lr-analysis-suite_OBJECT}")
add_test(NAME tower-lr-analysis COMMAND tower-parser-tests --suite lr-analysis)

# The reader target supplies the production parser and serial fault allocator.
if(TARGET tower-reader-test-services)
  get_property(lr_analysis_runtime GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
  function(tower_lr_analysis_selection selection file count)
    set(entry "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${file}.tower")
    foreach(jobs IN ITEMS 1 4)
      set(name "tower-lr-analysis-${selection}-jobs-${jobs}")
      add_test(NAME "${name}" COMMAND tower-selected-test-count
        "${count} tests passed for ${entry}" "${TOWER_BOOTSTRAP_COMPILER}" --test "${entry}"
        --jobs "${jobs}" --test-details --test-native-runtime "${lr_analysis_runtime}"
        ${ARGN} --link "$<TARGET_FILE:tower-reader-test-services>"
        --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-reader-test-services>")
      set_tests_properties("${name}" PROPERTIES LABELS "native;focused" TIMEOUT 60)
    endforeach()
  endfunction()

  tower_lr_analysis_selection(direct-tree lr_tree_checks_test 3)
  tower_lr_analysis_selection(direct-failures lr_analysis_failures_test 9)
  tower_lr_analysis_selection(direct-precedence lr_precedence_checks_test 3)
  tower_lr_analysis_selection(direct-comparisons lr_analysis_comparisons_test 6)
  # 21 analysis cases plus five work_budget cases. Linking the existing grammar
  # suite resolves the exported aggregate's call without discovering grammar tests.
  tower_lr_analysis_selection(owner lr_analysis 26 --link "${tower-lr-grammar-suite_OBJECT}")
endif()
