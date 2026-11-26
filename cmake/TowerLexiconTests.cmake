# Contextual selector fixtures retain their independent Tower oracle.
get_property(lexicon_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
tower_runtime_object(tower-lexicon-suite "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_lexer.tower" "${lexicon_triple}")
target_sources(tower-parser-tests PRIVATE "${tower-lexicon-suite_OBJECT}")
add_test(NAME tower-lexicon COMMAND tower-parser-tests --suite lexicon)

# The reader registers the native GNU/Linux parser services and fault allocator.
if(TARGET tower-reader-test-services)
  get_property(lexicon_runtime GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
  foreach(selection IN ITEMS owner direct)
    set(lexicon_file syntax_lexer_test)
    if(selection STREQUAL "owner")
      set(lexicon_file syntax_lexer)
    endif()
    set(lexicon_entry "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${lexicon_file}.tower")
    foreach(jobs IN ITEMS 1 4)
      set(lexicon_test tower-lexicon-${selection}-jobs-${jobs})
      add_test(NAME "${lexicon_test}" COMMAND tower-selected-test-count
        "4 tests passed for ${lexicon_entry}" "${TOWER_BOOTSTRAP_COMPILER}" --test "${lexicon_entry}"
        --jobs "${jobs}" --test-details --test-native-runtime "${lexicon_runtime}"
        --link "$<TARGET_FILE:tower-reader-test-services>" --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-reader-test-services>")
      set_tests_properties("${lexicon_test}" PROPERTIES LABELS "native;focused" TIMEOUT 60)
    endforeach()
  endforeach()
endif()
