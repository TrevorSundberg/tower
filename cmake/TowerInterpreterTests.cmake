# The old C++ interpreter/reference harness is replaced by Tower graph/cache
# contracts. Native hosts run TowerExecutionTests.cmake with TOWER_NATIVE; the
# portable WASI path reuses the identical suite and a small Tower fixture entry.
if(NOT CMAKE_SYSTEM_NAME STREQUAL "WASI")
  return()
endif()
get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
tower_runtime_object(tower-execution-wasi-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/execution_wasi.tower" "${triple}")
get_target_property(interpreter_test_sources tower-parser-tests SOURCES)
# Borrow only native service adapters. The parser target's independently compiled
# fixture objects may carry host bindings that belong to their own test entry.
list(FILTER interpreter_test_sources EXCLUDE REGEX "scaffolding/tests/|\\.(o|obj)$")
add_executable(tower-interpreter-tests ${interpreter_test_sources} "${tower-execution-wasi-tests_OBJECT}")
set_target_properties(tower-interpreter-tests PROPERTIES LINKER_LANGUAGE CXX)
target_compile_options(tower-interpreter-tests PRIVATE -UNDEBUG -fno-exceptions)
target_link_libraries(tower-interpreter-tests PRIVATE tower-compiler-interpreter
  tower-compiler-parser-nodes tower-compiler-semantics tower-compiler-entities tower-compiler-utilities tower-compiler-memory)
