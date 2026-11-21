# The old C++ interpreter/reference harness is replaced by Tower graph/cache
# contracts. Native hosts run TowerExecutionTests.cmake with TOWER_NATIVE; the
# portable WASI path reuses the identical suite and a small Tower fixture entry.
if(NOT CMAKE_SYSTEM_NAME STREQUAL "WASI")
  return()
endif()
get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
set(execution_object "${CMAKE_CURRENT_BINARY_DIR}/tower-execution-wasi-tests.o")
add_custom_command(OUTPUT "${execution_object}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/execution_wasi.tower"
    --library --target "${triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${execution_object}" --depfile "${execution_object}.d"
  DEPFILE "${execution_object}.d"
  DEPENDS scaffolding/tests/execution_wasi.tower "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
set_source_files_properties("${execution_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
get_target_property(interpreter_test_sources tower-parser-tests SOURCES)
# Borrow only native service adapters. The parser target's independently compiled
# fixture objects may carry host bindings that belong to their own test entry.
list(FILTER interpreter_test_sources EXCLUDE REGEX "scaffolding/tests/|\\.(o|obj)$")
add_executable(tower-interpreter-tests ${interpreter_test_sources} "${execution_object}")
set_target_properties(tower-interpreter-tests PROPERTIES LINKER_LANGUAGE CXX)
target_compile_options(tower-interpreter-tests PRIVATE -UNDEBUG -fno-exceptions)
target_link_libraries(tower-interpreter-tests PRIVATE tower-compiler-interpreter
  tower-compiler-parser-nodes tower-compiler-semantics tower-compiler-entities tower-compiler-utilities tower-compiler-memory)
