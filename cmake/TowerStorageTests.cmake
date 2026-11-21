# Focused storage/lifetime coverage using production compiler services. Functional
# assertions and the entry are Tower; native files are existing service adapters.
option(TOWER_STORAGE_TESTS "Build Tower compiler storage tests" OFF)
function(tower_storage_tests)
  if(NOT TOWER_STORAGE_TESTS OR NOT TARGET towerc)
    return()
  endif()
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  get_property(source GLOBAL PROPERTY TOWER_DRIVER_PRODUCTION_SOURCE)
  get_property(syntax_abi GLOBAL PROPERTY TOWER_DRIVER_SYNTAX_ABI)
  get_property(runtime_bind GLOBAL PROPERTY TOWER_RUNTIME_BIND)
  get_property(runtime_instrumented GLOBAL PROPERTY TOWER_RUNTIME_INSTRUMENTED_OBJECT)
  if(NOT runtime_instrumented)
    tower_runtime_object(storage-instrumented "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/memory_instrumented.tower" "${triple}"
      compiler_runtime_allocate tower_allocate compiler_runtime_reallocate tower_reallocate
      compiler_runtime_deallocate tower_deallocate --state compiler-tests)
    set(runtime_instrumented "${storage-instrumented_OBJECT}")
  endif()
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_storage_tests.tower")
  set(ir "${CMAKE_CURRENT_BINARY_DIR}/tower-storage-tests-unbound.ll")
  set(bound "${CMAKE_CURRENT_BINARY_DIR}/tower-storage-tests.ll")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-storage-tests.o")
  file(GENERATE OUTPUT "${input}" CONTENT "${source}import tests.storage_main;\n")
  add_custom_command(OUTPUT "${object}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${input}" --library --target "${triple}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --emit llvm-optimized -o "${ir}" --depfile "${object}.d"
    COMMAND "${runtime_bind}" "${ir}" "${bound}" --driver "${syntax_abi}"
    COMMAND "${CMAKE_C_COMPILER}" --target=${triple} -O2 -c "${bound}" -o "${object}"
    DEPFILE "${object}.d"
    DEPENDS "${input}" "${TOWER_BOOTSTRAP_COMPILER}" "${runtime_bind}" VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  get_target_property(sources towerc SOURCES)
  list(REMOVE_ITEM sources "${CMAKE_CURRENT_BINARY_DIR}/tower-driver.o")
  get_target_property(libraries towerc LINK_LIBRARIES)
  add_executable(tower-storage-tests ${sources} "${object}" "${runtime_instrumented}")
  target_compile_features(tower-storage-tests PRIVATE cxx_std_20)
  target_compile_options(tower-storage-tests PRIVATE -fno-exceptions)
  target_link_libraries(tower-storage-tests PRIVATE ${libraries})
  target_link_options(tower-storage-tests PRIVATE -Wl,--wrap=work_thread_available -Wl,--wrap=work_thread_capacity)
  enable_testing()
  add_test(NAME tower-storage COMMAND tower-storage-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
endfunction()
cmake_language(DEFER CALL tower_storage_tests)
