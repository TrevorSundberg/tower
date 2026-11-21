# Functional coverage and test allocator are Tower. Native seeds remain isolated
# reference oracles until independent Tower differential successors replace them.
get_property(utility_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
get_property(utility_trap GLOBAL PROPERTY TOWER_RUNTIME_TRAP_OBJECT)
set(utf8_input "${CMAKE_CURRENT_BINARY_DIR}/tower_utf8_tests.tower")
set(utf8_source "import tower;\nimport tests.utf8;\nimport tests.utility_checks;\n")
set(utf8_boundary "")
set(utility_entry main)
set(utility_entry_binding "")
if(utility_triple MATCHES "^wasm")
  # wasi-libc expects Clang's lowered argc/argv symbol; Tower exports literally.
  set(utility_entry __main_argc_argv)
  set(utility_entry_binding main __main_argc_argv)
endif()
if(CMAKE_SYSTEM_NAME STREQUAL "Linux")
  string(APPEND utf8_source "import tests.utf8_boundary;\n")
  set(utf8_boundary "utf8_boundary_tests(32, state);")
elseif(CMAKE_SYSTEM_NAME STREQUAL "Darwin")
  string(APPEND utf8_source "import tests.utf8_boundary;\n")
  set(utf8_boundary "utf8_boundary_tests(4096, state);")
endif()
string(APPEND utf8_source "export fn ${utility_entry}(argc: i32, argv: u8**): i32 { var state = utf8_tests(); ${utf8_boundary} puts(\"Tower-written UTF-8: exhaustive scalars, malformed inputs and buffer boundaries passed.\"); return 0; }\n")
file(GENERATE OUTPUT "${utf8_input}" CONTENT "${utf8_source}")
set(utf8_object "${CMAKE_CURRENT_BINARY_DIR}/tower-utf8-tests.o")
add_custom_command(OUTPUT "${utf8_object}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${utf8_input}" --library --target "${utility_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${utf8_object}" --depfile "${utf8_object}.d"
  DEPFILE "${utf8_object}.d"
  DEPENDS "${utf8_input}" "${TOWER_BOOTSTRAP_COMPILER}"
    scaffolding/tests/utf8.tower scaffolding/tests/utf8_boundary.tower scaffolding/tests/utility_checks.tower VERBATIM)
set_source_files_properties("${utf8_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
add_executable(tower-utf8-tests "${utf8_object}" "${utility_trap}")
set_target_properties(tower-utf8-tests PROPERTIES LINKER_LANGUAGE CXX)
target_link_libraries(tower-utf8-tests PRIVATE tower-compiler-utilities tower-compiler-memory tower-utf8-reference)
add_test(NAME tower-utf8-tests COMMAND tower-utf8-tests)

# Use the established LLVM symbol binding tool for reserved allocator exports.
# The moving/guarded allocator is test-local and links no production allocator.
get_property(utility_bind GLOBAL PROPERTY TOWER_RUNTIME_BIND)
set(bytes_ir "${CMAKE_CURRENT_BINARY_DIR}/tower-bytes-tests-unbound.ll")
set(bytes_bound "${CMAKE_CURRENT_BINARY_DIR}/tower-bytes-tests.ll")
set(bytes_object "${CMAKE_CURRENT_BINARY_DIR}/tower-bytes-tests.o")
add_custom_command(OUTPUT "${bytes_object}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/bytes.tower"
    --target "${utility_triple}" --emit llvm-optimized -o "${bytes_ir}" --depfile "${bytes_ir}.d"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
  COMMAND "${utility_bind}" "${bytes_ir}" "${bytes_bound}"
    byte_test_reallocate tower_reallocate byte_test_deallocate tower_deallocate ${utility_entry_binding}
  COMMAND "${CMAKE_C_COMPILER}" --target=${utility_triple} -O2 -c "${bytes_bound}" -o "${bytes_object}"
  DEPFILE "${bytes_ir}.d"
  DEPENDS scaffolding/tests/bytes.tower scaffolding/tests/utility_checks.tower
    "${TOWER_BOOTSTRAP_COMPILER}" "${utility_bind}" VERBATIM)
set_source_files_properties("${bytes_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
add_executable(tower-bytes-tests "${bytes_object}" "${utility_trap}")
set_target_properties(tower-bytes-tests PROPERTIES LINKER_LANGUAGE CXX)
target_link_libraries(tower-bytes-tests PRIVATE tower-compiler-utilities tower-bytes-reference)
add_test(NAME tower-bytes-tests COMMAND tower-bytes-tests)
