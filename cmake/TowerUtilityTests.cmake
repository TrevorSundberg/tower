# Functional coverage, test allocator and independent reference oracles are Tower.
get_property(utility_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
get_property(utility_trap GLOBAL PROPERTY TOWER_RUNTIME_TRAP_OBJECT)
set(utility_entry main)
if(utility_triple MATCHES "^wasm")
  # wasi-libc expects Clang's lowered argc/argv symbol; Tower exports literally.
  set(utility_entry __main_argc_argv)
endif()

set(utf8_input "${CMAKE_CURRENT_BINARY_DIR}/tower_utf8_tests.tower")
set(utf8_source "import tower;\nimport tests.utf8_test;\nimport tests.utility_checks;\n")
set(utf8_boundary "")
if(CMAKE_SYSTEM_NAME STREQUAL "Linux" OR CMAKE_SYSTEM_NAME STREQUAL "Darwin")
  set(utf8_anonymous 32)
  if(CMAKE_SYSTEM_NAME STREQUAL "Darwin")
    set(utf8_anonymous 4096)
  endif()
  set(map_input "${CMAKE_CURRENT_BINARY_DIR}/utf8_test_map.tower")
  file(GENERATE OUTPUT "${map_input}" CONTENT
    "import tower;\nimport tests.utf8_boundary;\nexport fn utf8_test_map(length: usize): void* { return utf8_map_pages(length, ${utf8_anonymous}); }\n")
  tower_runtime_object(utf8-test-map "${map_input}" "${utility_triple}")
  string(APPEND utf8_source "import tests.utf8_boundary_test;\n")
  set(utf8_boundary "utf8_boundary_tests(state);")
endif()
string(APPEND utf8_source "export fn ${utility_entry}(argc: i32, argv: u8**): i32 { var state = utf8_tests(); ${utf8_boundary} puts(\"Tower-written UTF-8: exhaustive scalars, malformed inputs and buffer boundaries passed.\"); return 0; }\n")
file(GENERATE OUTPUT "${utf8_input}" CONTENT "${utf8_source}")
tower_runtime_object(tower-utf8-tests "${utf8_input}" "${utility_triple}")
add_executable(tower-utf8-tests "${tower-utf8-tests_OBJECT}" "${utility_trap}" ${utf8-test-map_OBJECT})
set_target_properties(tower-utf8-tests PROPERTIES LINKER_LANGUAGE CXX)
target_link_libraries(tower-utf8-tests PRIVATE tower-compiler-utilities tower-compiler-memory)
add_test(NAME tower-utf8-tests COMMAND tower-utf8-tests)

set(bytes_input "${CMAKE_CURRENT_BINARY_DIR}/tower_bytes_tests.tower")
file(GENERATE OUTPUT "${bytes_input}" CONTENT
  "import tower;\nimport tests.bytes_test;\nimport tests.utility_checks;\nexport fn ${utility_entry}(argc: i32, argv: u8**): i32 { byte_buffer_tests(); puts(\"Tower byte buffers: moving growth, failure atomicity, aliasing, guards and overflow passed.\"); return 0; }\n")
tower_runtime_object(tower-bytes-tests "${bytes_input}" "${utility_triple}" SOURCE
  byte_test_reallocate tower_reallocate byte_test_deallocate tower_deallocate)
add_executable(tower-bytes-tests "${tower-bytes-tests_OBJECT}" "${utility_trap}")
set_target_properties(tower-bytes-tests PROPERTIES LINKER_LANGUAGE CXX)
target_link_libraries(tower-bytes-tests PRIVATE tower-compiler-utilities)
add_test(NAME tower-bytes-tests COMMAND tower-bytes-tests)

if(NOT CMAKE_CROSSCOMPILING AND CMAKE_SYSTEM_NAME STREQUAL "Linux" AND utility_triple MATCHES "^x86_64-.*linux.*gnu")
  tower_guest_runtime(native-test "${utility_triple}" posix ON UNINSTRUMENTED)
  tower_guest_runtime(host-library "${utility_triple}" posix OFF UNINSTRUMENTED)
  tower_selected_test_count("${utility_triple}")
  get_property(utility_runtime GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
  tower_runtime_object(bytes-test-abi "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/bytes_test_allocator_abi.tower"
    "${utility_triple}" byte_abi_reallocate tower_reallocate byte_abi_deallocate tower_deallocate)
  add_custom_target(tower-bytes-test-abi DEPENDS "${bytes-test-abi_OBJECT}")
  add_dependencies(tower-bytes-tests tower-bytes-test-abi tower-guest-native-test tower-selected-test-count)
  add_dependencies(tower-utf8-tests tower-guest-native-test tower-selected-test-count)

  function(tower_utility_selection file summary)
    set(entry "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${file}.tower")
    foreach(jobs IN ITEMS 1 4)
      set(name "tower-utility-${file}-jobs-${jobs}")
      add_test(NAME "${name}" COMMAND tower-selected-test-count "${summary} for ${entry}"
        "${TOWER_BOOTSTRAP_COMPILER}" --test "${entry}" --jobs "${jobs}" --test-details
        --test-native-runtime "${utility_runtime}" ${ARGN})
      set_tests_properties("${name}" PROPERTIES LABELS "native;focused" TIMEOUT 60)
    endforeach()
  endfunction()

  set(utf8_link --link "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-utf8.o")
  foreach(file IN ITEMS utf8 utf8_test)
    tower_utility_selection(${file} "1 test passed" ${utf8_link})
  endforeach()
  # Boundary owner discovery also reaches the portable companion.
  tower_utility_selection(utf8_boundary "2 tests passed" ${utf8_link} --link "${utf8-test-map_OBJECT}")
  tower_utility_selection(utf8_boundary_test "1 test passed" ${utf8_link} --link "${utf8-test-map_OBJECT}")
  foreach(file IN ITEMS bytes bytes_test)
    tower_utility_selection(${file} "1 test passed" --link "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-bytes.o"
      --link "${bytes-test-abi_OBJECT}")
  endforeach()
endif()
