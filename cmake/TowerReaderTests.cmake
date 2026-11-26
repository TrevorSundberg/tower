get_property(reader_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
tower_runtime_object(tower-reader-cases "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_reader.tower" "${reader_triple}")
target_sources(tower-parser-tests PRIVATE "${tower-reader-cases_OBJECT}")
add_test(NAME tower-reader COMMAND tower-parser-tests --suite reader)
set_tests_properties(tower-reader PROPERTIES WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")

# The selected guest uses the same serial, fault-injectable parser services.
# Its result descriptor and trap runtime are specific to native Linux GNU.
if(NOT CMAKE_CROSSCOMPILING AND CMAKE_SYSTEM_NAME STREQUAL "Linux" AND reader_triple MATCHES "^x86_64-.*linux.*gnu")
  tower_guest_runtime(native-test "${reader_triple}" posix ON UNINSTRUMENTED)
  tower_guest_runtime(host-library "${reader_triple}" posix OFF UNINSTRUMENTED)
  tower_selected_test_count("${reader_triple}")
  get_property(reader_runtime GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
  tower_compiler_evaluation()
  add_library(tower-reader-test-services SHARED)
  set_target_properties(tower-reader-test-services PROPERTIES LINKER_LANGUAGE C)
  target_link_libraries(tower-reader-test-services PRIVATE tower-compiler-parser-nodes tower-compiler-semantics
    tower-compiler-entities tower-compiler-utilities tower-compiler-memory tower-compiler-evaluation)
  target_link_options(tower-reader-test-services PRIVATE "LINKER:-z,defs")
  add_dependencies(tower-reader-test-services tower-guest-native-test tower-selected-test-count)
  foreach(selection IN ITEMS owner direct)
    set(reader_file syntax_reader_test)
    set(reader_count 7)
    if(selection STREQUAL "owner")
      # Default discovery also reaches the five work_budget declarations.
      set(reader_file syntax_reader)
      set(reader_count 12)
    endif()
    set(reader_entry "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${reader_file}.tower")
    foreach(jobs IN ITEMS 1 4)
      set(reader_test tower-reader-${selection}-jobs-${jobs})
      add_test(NAME "${reader_test}" COMMAND tower-selected-test-count
        "${reader_count} tests passed for ${reader_entry}" "${TOWER_BOOTSTRAP_COMPILER}" --test "${reader_entry}"
        --jobs "${jobs}" --test-details --test-native-runtime "${reader_runtime}"
        --link "$<TARGET_FILE:tower-reader-test-services>" --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-reader-test-services>")
      set_tests_properties("${reader_test}" PROPERTIES WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" TIMEOUT 60)
    endforeach()
  endforeach()
endif()
