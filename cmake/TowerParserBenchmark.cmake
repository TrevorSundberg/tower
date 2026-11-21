# Optional measurement target, reusing the production native test link closure.
# May be included after TowerBackend.cmake to measure a saved source snapshot.
function(tower_parser_benchmark)
  if(NOT TARGET tower-frontend-tests)
    return()
  endif()
  set(source "${CMAKE_CURRENT_FUNCTION_LIST_DIR}/../scaffolding/tests/parser_benchmark.tower")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-parser-benchmark.o")
  set(expanded "${CMAKE_CURRENT_BINARY_DIR}/tower_parser_benchmark_expanded.tower")
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  add_custom_command(OUTPUT "${object}"
    COMMAND "${CMAKE_CURRENT_BINARY_DIR}/tower-foreign" "${triple}" "${source}" "${expanded}"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different "${source}" "${expanded}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${expanded}" --library --target "${triple}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      -o "${object}" --depfile "${object}.d"
    DEPFILE "${object}.d" DEPENDS "${source}" "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_BINARY_DIR}/tower-foreign" VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  get_target_property(sources tower-frontend-tests SOURCES)
  list(REMOVE_ITEM sources "${CMAKE_CURRENT_BINARY_DIR}/tower-frontend-tests.o")
  get_target_property(libraries tower-frontend-tests LINK_LIBRARIES)
  add_executable(tower-parser-benchmark ${sources} "${object}")
  set_target_properties(tower-parser-benchmark PROPERTIES LINKER_LANGUAGE CXX)
  target_compile_options(tower-parser-benchmark PRIVATE -fno-exceptions)
  target_compile_definitions(tower-parser-benchmark PRIVATE TOWER_COMPILER_MEMORY_TESTS=1)
  target_link_libraries(tower-parser-benchmark PRIVATE ${libraries})
  target_link_options(tower-parser-benchmark PRIVATE "-Wl,@${expanded}.wrap.rsp")
endfunction()
cmake_language(DEFER CALL tower_parser_benchmark)
