# Reserved runtime-symbol connections are emitted by a Tower tool using upstream
# LLVM C APIs. Keep this target artifact separate from canonical Tower source.
include("${CMAKE_CURRENT_LIST_DIR}/TowerGuestRuntime.cmake")
function(tower_runtime_tools)
  if(TARGET tower-runtime-bind)
    return()
  endif()
  find_program(TOWER_RUNTIME_HOST_CC NAMES clang REQUIRED)
  find_program(TOWER_RUNTIME_LLVM_CONFIG NAMES llvm-config-19 llvm-config REQUIRED)
  execute_process(COMMAND "${TOWER_RUNTIME_HOST_CC}" -print-target-triple
    OUTPUT_VARIABLE host_triple OUTPUT_STRIP_TRAILING_WHITESPACE COMMAND_ERROR_IS_FATAL ANY)
  execute_process(COMMAND "${TOWER_RUNTIME_LLVM_CONFIG}" --libdir
    OUTPUT_VARIABLE llvm_libdir OUTPUT_STRIP_TRAILING_WHITESPACE COMMAND_ERROR_IS_FATAL ANY)
  execute_process(COMMAND "${TOWER_RUNTIME_LLVM_CONFIG}" --link-shared --libnames
    OUTPUT_VARIABLE llvm_libname OUTPUT_STRIP_TRAILING_WHITESPACE COMMAND_ERROR_IS_FATAL ANY)
  set(object "${CMAKE_CURRENT_BINARY_DIR}/runtime-bind.o")
  set(program "${CMAKE_CURRENT_BINARY_DIR}/runtime_bind${CMAKE_HOST_EXECUTABLE_SUFFIX}")
  add_custom_command(OUTPUT "${program}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/runtime_bind.tower"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --library --target "${host_triple}" -o "${object}" --depfile "${object}.d"
    COMMAND "${TOWER_RUNTIME_HOST_CC}" "${object}" "${llvm_libdir}/${llvm_libname}" -o "${program}"
    DEPFILE "${object}.d"
    DEPENDS scaffolding/host/runtime_bind.tower "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
  add_custom_target(tower-runtime-bind DEPENDS "${program}")
  set_property(GLOBAL PROPERTY TOWER_RUNTIME_BIND "${program}")
endfunction()

function(tower_runtime_object name input triple)
  tower_runtime_tools()
  get_property(bind GLOBAL PROPERTY TOWER_RUNTIME_BIND)
  set(ir "${CMAKE_CURRENT_BINARY_DIR}/${name}-unbound.ll")
  set(bound "${CMAKE_CURRENT_BINARY_DIR}/${name}.ll")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/${name}.o")
  add_custom_command(OUTPUT "${object}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${input}" --library --target "${triple}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --emit llvm-optimized -o "${ir}" --depfile "${ir}.d"
    COMMAND "${bind}" "${ir}" "${bound}" ${ARGN}
    COMMAND "${CMAKE_C_COMPILER}" --target=${triple} -O2 -c "${bound}" -o "${object}"
    DEPFILE "${ir}.d"
    DEPENDS "${input}" "${bind}" tower-runtime-bind "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  if(input STREQUAL "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/memory_instrumented.tower")
    set_property(GLOBAL APPEND PROPERTY TOWER_INSTRUMENTED_RUNTIME_OBJECTS "${object}")
  endif()
  set(${name}_OBJECT "${object}" PARENT_SCOPE)
endfunction()

function(tower_compiler_runtime triple)
  if(TOWER_PARSER_ONLY OR TOWER_ALLOCATOR_TESTS OR TOWER_BACKEND_TESTS OR TOWER_DRIVER_TESTS)
    tower_runtime_object(runtime-instrumented "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/memory_instrumented.tower" "${triple}"
      compiler_runtime_allocate tower_allocate compiler_runtime_reallocate tower_reallocate
      compiler_runtime_deallocate tower_deallocate --state compiler-tests)
    set_property(GLOBAL PROPERTY TOWER_RUNTIME_INSTRUMENTED_OBJECT "${runtime-instrumented_OBJECT}")
  endif()
  if(NOT TOWER_PARSER_ONLY)
    tower_runtime_object(runtime-allocate "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/memory_runtime.tower" "${triple}"
      compiler_runtime_allocate tower_allocate compiler_runtime_reallocate tower_reallocate
      compiler_runtime_deallocate tower_deallocate)
    target_sources(tower-compiler-memory PRIVATE "${runtime-allocate_OBJECT}")
  else()
    target_sources(tower-compiler-memory PRIVATE "${runtime-instrumented_OBJECT}")
  endif()
  set(platform posix)
  if(triple MATCHES "windows")
    set(platform windows)
  endif()
  set(input "${CMAKE_CURRENT_BINARY_DIR}/runtime_trap.tower")
  file(GENERATE OUTPUT "${input}" CONTENT "import tower;\nimport host.memory_trap;\nimport host.memory_output_${platform};\n")
  tower_runtime_object(runtime-trap "${input}" "${triple}" compiler_runtime_trap tower_trap)
  target_sources(tower-compiler-memory PRIVATE "${runtime-trap_OBJECT}")
  set_property(GLOBAL PROPERTY TOWER_RUNTIME_TRAP_OBJECT "${runtime-trap_OBJECT}")
  set_target_properties(tower-compiler-memory PROPERTIES LINKER_LANGUAGE C)
endfunction()
