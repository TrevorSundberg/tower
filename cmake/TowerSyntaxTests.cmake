if(TOWER_BROWSER OR TOWER_PARSER_ONLY OR TOWER_BACKEND_TESTS)
  tower_runtime_object(tower-syntax-live-cases "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_live.tower" "${triple}")
  tower_runtime_object(tower-compiler-parser-fixtures "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/parser_integration.tower" "${triple}")
  if(TOWER_BROWSER)
    # tw_self_test and the editable browser compiler use the original object order.
    target_sources(tower-compiler-parser-nodes INTERFACE "${tower-syntax-live-cases_OBJECT}")
    set(browser_parser_fixture "${tower-compiler-parser-fixtures_OBJECT}")
  else()
    add_library(tower-parser-fixtures INTERFACE)
    target_sources(tower-parser-fixtures INTERFACE "${tower-syntax-live-cases_OBJECT}" "${tower-compiler-parser-fixtures_OBJECT}")
  endif()
endif()

function(tower_syntax_test_runner)
  target_link_libraries(tower-parser-tests PRIVATE tower-parser-fixtures)
  add_test(NAME tower-live-syntax COMMAND tower-parser-tests --suite live)
  add_test(NAME tower-live-replacements COMMAND tower-parser-tests --suite replacements)
  if(TARGET tower-reader-test-services)
    get_property(runtime GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
    tower_native_test_selections(live-replacements syntax_live_replacements "7 tests" "2 tests"
      --test-native-runtime "${runtime}" --link "$<TARGET_FILE:tower-reader-test-services>"
      --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-reader-test-services>")
    # Selected seed readers install the same relative grammar files as --suite live.
    set_tests_properties(
      tower-live-replacements-owner-jobs-1 tower-live-replacements-direct-jobs-1
      tower-live-replacements-owner-jobs-4 tower-live-replacements-direct-jobs-4
      PROPERTIES WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
  endif()
  set_tests_properties(tower-live-syntax tower-live-replacements PROPERTIES WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
endfunction()
