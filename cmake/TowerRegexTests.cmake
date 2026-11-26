# Preserve the parser CLI and aggregate entry alongside selected Tower tests.
get_property(regex_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
tower_runtime_object(tower-regex-suite "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/regex_test.tower" "${regex_triple}")
target_sources(tower-parser-tests PRIVATE "${tower-regex-suite_OBJECT}")
add_test(NAME tower-regex COMMAND tower-parser-tests --suite regex)

# Supply the guest with the real parser services and the serial fault allocator.
if(NOT CMAKE_CROSSCOMPILING AND regex_triple MATCHES "^x86_64-.*linux.*gnu")
  tower_guest_runtime(native-test "${regex_triple}" posix ON UNINSTRUMENTED)
  tower_guest_runtime(host-library "${regex_triple}" posix OFF UNINSTRUMENTED)
  tower_selected_test_count("${regex_triple}")
  tower_compiler_evaluation()
  add_library(tower-regex-test-services STATIC)
  set_target_properties(tower-regex-test-services PROPERTIES LINKER_LANGUAGE C)
  target_link_libraries(tower-regex-test-services PRIVATE tower-compiler-parser-nodes
    tower-compiler-semantics tower-compiler-entities tower-compiler-utilities
    tower-compiler-evaluation tower-compiler-memory)
  add_custom_target(tower-regex-language-tests ALL DEPENDS tower-regex-test-services
    tower-guest-native-test tower-selected-test-count)
  get_property(regex_runtime GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
  foreach(selection IN ITEMS regex regex_test)
    set(count 7)
    if(selection STREQUAL "regex")
      # Owner discovery also runs the five tests of its work_budget dependency.
      set(count 12)
    endif()
    set(path "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${selection}.tower")
    foreach(jobs IN ITEMS 1 4)
      set(name "tower-selected-${selection}-jobs-${jobs}")
      add_test(NAME "${name}" COMMAND tower-selected-test-count "${count} tests passed for ${path}"
        "${TOWER_BOOTSTRAP_COMPILER}" --test "${path}" --jobs "${jobs}" --test-details
        --test-native-runtime "${regex_runtime}" --link "$<TARGET_FILE:tower-regex-test-services>"
        --link "$<TARGET_FILE:tower-compiler-memory>")
      set_tests_properties("${name}" PROPERTIES LABELS "native;focused" TIMEOUT 60)
    endforeach()
  endforeach()
endif()
