# Tower-only execution contracts against production compiler/interpreter objects.
option(TOWER_EXECUTION_TESTS "Build Tower execution and package tests" OFF)
function(tower_execution_tests)
  if(NOT TOWER_EXECUTION_TESTS OR NOT TARGET towerc)
    return()
  endif()
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  get_property(source GLOBAL PROPERTY TOWER_DRIVER_PRODUCTION_SOURCE)
  get_property(syntax_abi GLOBAL PROPERTY TOWER_DRIVER_SYNTAX_ABI)
  get_property(runtime_bind GLOBAL PROPERTY TOWER_RUNTIME_BIND)
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_execution_tests.tower")
  set(ir "${CMAKE_CURRENT_BINARY_DIR}/tower-execution-tests-unbound.ll")
  set(bound "${CMAKE_CURRENT_BINARY_DIR}/tower-execution-tests.ll")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-execution-tests.o")
  file(GENERATE OUTPUT "${input}" CONTENT "${source}import tests.execution_main;\n")
  add_custom_command(OUTPUT "${ir}" "${bound}" "${object}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${input}" --library --target "${triple}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --emit llvm-optimized -o "${ir}" --depfile "${object}.d"
    COMMAND "${runtime_bind}" "${ir}" "${bound}" --driver "${syntax_abi}"
    COMMAND "${CMAKE_C_COMPILER}" --target=${triple} -O2 -c "${bound}" -o "${object}"
    DEPFILE "${object}.d"
    DEPENDS "${input}" "${TOWER_BOOTSTRAP_COMPILER}" "${runtime_bind}" tower-runtime-bind VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  get_target_property(sources towerc SOURCES)
  list(REMOVE_ITEM sources "${CMAKE_CURRENT_BINARY_DIR}/tower-driver.o")
  get_target_property(libraries towerc LINK_LIBRARIES)
  add_executable(tower-execution-tests ${sources} "${object}")
  target_compile_features(tower-execution-tests PRIVATE cxx_std_20)
  target_compile_options(tower-execution-tests PRIVATE -fno-exceptions)
  target_link_libraries(tower-execution-tests PRIVATE ${libraries})
  enable_testing()
  add_test(NAME tower-execution COMMAND tower-execution-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
endfunction()
