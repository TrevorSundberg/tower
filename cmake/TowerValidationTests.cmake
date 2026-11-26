get_property(validation_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
tower_runtime_object(tower-validation-cases "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_validation.tower" "${validation_triple}")
target_sources(tower-parser-tests PRIVATE "${tower-validation-cases_OBJECT}")
add_test(NAME tower-validation COMMAND tower-parser-tests --suite validation)
set_tests_properties(tower-validation PROPERTIES WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")

# The native reader registers the parser services with the serial fault allocator.
if(TARGET tower-reader-test-services)
  get_property(validation_runtime GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
  foreach(selection IN ITEMS owner direct)
    set(validation_file syntax_validation_test)
    set(validation_count 5)
    if(selection STREQUAL "owner")
      set(validation_file syntax_validation)
      # Owner discovery also reaches five work_budget declarations.
      set(validation_count 10)
    endif()
    set(validation_entry "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${validation_file}.tower")
    foreach(jobs IN ITEMS 1 4)
      set(validation_test tower-validation-${selection}-jobs-${jobs})
      add_test(NAME "${validation_test}" COMMAND tower-selected-test-count
        "${validation_count} tests passed for ${validation_entry}" "${TOWER_BOOTSTRAP_COMPILER}"
        --test "${validation_entry}" --jobs "${jobs}" --test-details --test-native-runtime "${validation_runtime}"
        --link "$<TARGET_FILE:tower-reader-test-services>" --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-reader-test-services>")
      set_tests_properties("${validation_test}" PROPERTIES WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" TIMEOUT 60)
    endforeach()
  endforeach()
endif()
