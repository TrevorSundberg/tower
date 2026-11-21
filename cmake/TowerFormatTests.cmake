# Focused Tower formatter fixtures with independently verified exact text/spans.
# The repository sweep remains separately opt-in.
option(TOWER_FORMAT_TESTS "Build focused Tower formatter tests" OFF)
option(TOWER_FORMAT_SWEEP "Run the broad repository formatter sweep" OFF)
function(tower_format_tests)
  if(NOT TOWER_FORMAT_TESTS OR NOT TARGET towerc)
    return()
  endif()
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  if(NOT triple MATCHES "^x86_64-.*linux")
    message(FATAL_ERROR "Revalidate the formatter test syntax ABI for ${triple}")
  endif()
  get_property(source GLOBAL PROPERTY TOWER_DRIVER_PRODUCTION_SOURCE)
  get_property(syntax_abi GLOBAL PROPERTY TOWER_DRIVER_SYNTAX_ABI)
  get_property(runtime_bind GLOBAL PROPERTY TOWER_RUNTIME_BIND)
  tower_runtime_object(format-instrumented "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/memory_instrumented.tower" "${triple}"
    compiler_runtime_allocate tower_allocate compiler_runtime_reallocate tower_reallocate
    compiler_runtime_deallocate tower_deallocate --state compiler-tests)
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_format_tests.tower")
  set(ir "${CMAKE_CURRENT_BINARY_DIR}/tower-format-tests-unbound.ll")
  set(bound "${CMAKE_CURRENT_BINARY_DIR}/tower-format-tests.ll")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-format-tests.o")
  file(GENERATE OUTPUT "${input}" CONTENT "${source}import tests.format_main;\n")
  add_custom_command(OUTPUT "${object}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${input}" --library --target "${triple}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --emit llvm-optimized -o "${ir}" --depfile "${object}.d"
    COMMAND "${runtime_bind}" "${ir}" "${bound}" --driver "${syntax_abi}"
    COMMAND "${CMAKE_C_COMPILER}" --target=${triple} -O2 -c "${bound}" -o "${object}"
    DEPFILE "${object}.d" DEPENDS "${input}" "${TOWER_BOOTSTRAP_COMPILER}" "${runtime_bind}" VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  get_target_property(sources towerc SOURCES)
  list(REMOVE_ITEM sources "${CMAKE_CURRENT_BINARY_DIR}/tower-driver.o")
  get_target_property(libraries towerc LINK_LIBRARIES)
  add_executable(tower-format-tests ${sources} "${object}" "${format-instrumented_OBJECT}")
  target_compile_features(tower-format-tests PRIVATE cxx_std_20)
  target_compile_options(tower-format-tests PRIVATE -fno-exceptions)
  target_link_libraries(tower-format-tests PRIVATE ${libraries})
  enable_testing()
  add_test(NAME tower-format COMMAND tower-format-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
  if(TOWER_FORMAT_SWEEP)
    file(GLOB_RECURSE format_files CONFIGURE_DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/*.tower")
    list(SORT format_files)
    string(REPLACE ";" "\n" format_listing "${format_files}")
    set(format_manifest "${CMAKE_CURRENT_BINARY_DIR}/tower_format_files.txt")
    file(GENERATE OUTPUT "${format_manifest}" CONTENT "${format_listing}\n")
    add_test(NAME tower-format-repository COMMAND tower-format-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" "${format_manifest}")
  endif()
endfunction()
cmake_language(DEFER CALL tower_format_tests)
