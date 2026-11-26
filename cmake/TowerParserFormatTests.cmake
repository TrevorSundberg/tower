# Separate unit avoids importing the complete test suite into compiler objects.
get_property(format_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
if(NOT format_triple MATCHES "^wasm32-" AND NOT format_triple MATCHES "^x86_64-.*linux")
  message(FATAL_ERROR "Revalidate the formatter fixture syntax ABI for ${format_triple}")
endif()
tower_runtime_object(format-cases "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/format_suite.tower" "${format_triple}")
target_sources(tower-parser-tests PRIVATE "${format-cases_OBJECT}")
if(format_triple MATCHES "^wasm32-")
  tower_runtime_object(tower-format-wasi "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/format_wasi.tower" "${format_triple}")
  add_executable(tower-format-tests "${tower-format-wasi_OBJECT}")
  set_target_properties(tower-format-tests PROPERTIES LINKER_LANGUAGE CXX)
  target_compile_options(tower-format-tests PRIVATE -fno-exceptions)
  target_link_libraries(tower-format-tests PRIVATE tower-compiler-parser-nodes tower-compiler-semantics
    tower-compiler-entities tower-compiler-utilities tower-compiler-memory)
endif()

if(NOT CMAKE_CROSSCOMPILING AND CMAKE_SYSTEM_NAME STREQUAL "Linux" AND format_triple MATCHES "^x86_64-.*linux.*gnu")
  tower_guest_runtime(native-test "${format_triple}" posix ON UNINSTRUMENTED)
  get_property(format_runtime GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
  foreach(selection IN ITEMS owner direct)
    set(format_file format_suite_test)
    set(format_count 17)
    if(selection STREQUAL "owner")
      # Import discovery also reaches the five work_budget tests.
      set(format_file format_suite)
      set(format_count 22)
    endif()
    set(format_entry "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${format_file}.tower")
    foreach(jobs IN ITEMS 1 4)
      set(name "tower-parser-format-${selection}-jobs-${jobs}")
      add_test(NAME "${name}" COMMAND tower-selected-test-count
        "${format_count} tests passed for ${format_entry}" "${TOWER_BOOTSTRAP_COMPILER}"
        --test "${format_entry}" --jobs "${jobs}" --test-details --test-native-runtime "${format_runtime}"
        --link "$<TARGET_FILE:tower-reader-test-services>" --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-reader-test-services>")
      set_tests_properties("${name}" PROPERTIES WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" LABELS "native;focused" TIMEOUT 60)
    endforeach()
  endforeach()
endif()
