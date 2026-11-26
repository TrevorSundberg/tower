# Reserved runtime-symbol connections are emitted by a Tower tool using upstream
# LLVM C APIs. Keep this target artifact separate from canonical Tower source.
include("${CMAKE_CURRENT_LIST_DIR}/TowerSanitizers.cmake")
include("${CMAKE_CURRENT_LIST_DIR}/TowerGuestRuntime.cmake")
function(tower_host_linker output fallback)
  if(CMAKE_HOST_SYSTEM_NAME STREQUAL "Linux")
    set(${output} "${TOWER_BOOTSTRAP_COMPILER}" --jobs "${TOWER_COMPILER_JOBS}" --link-executable PARENT_SCOPE)
  else()
    set(${output} "${fallback}" PARENT_SCOPE)
  endif()
endfunction()

function(tower_wasi_link_tool)
  if(TARGET tower-wasi-link)
    return()
  endif()
  tower_runtime_tools()
  execute_process(COMMAND "${TOWER_RUNTIME_HOST_CC}" -print-target-triple
    OUTPUT_VARIABLE host_triple OUTPUT_STRIP_TRAILING_WHITESPACE COMMAND_ERROR_IS_FATAL ANY)
  tower_guest_runtime(host-library "${host_triple}" posix OFF UNINSTRUMENTED)
  get_property(runtime GLOBAL PROPERTY TOWER_GUEST_host-library_OBJECT)
  set(object "${CMAKE_CURRENT_BINARY_DIR}/link_wasi.o")
  set(program "${CMAKE_CURRENT_BINARY_DIR}/link_wasi")
  add_custom_command(OUTPUT "${object}" "${program}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tools/link_wasi.tower"
      --jobs "${TOWER_COMPILER_JOBS}" --library --target "${host_triple}" -o "${object}" --depfile "${object}.d"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" --jobs "${TOWER_COMPILER_JOBS}" --link-executable "${object}" "${runtime}" -o "${program}"
      -ldl -Wl,--export-dynamic-symbol=work_thread_entry
    DEPFILE "${object}.d"
    DEPENDS scaffolding/tools/link_wasi.tower "${runtime}" "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
  add_custom_target(tower-wasi-link DEPENDS "${program}")
  set_property(GLOBAL PROPERTY TOWER_WASI_LINK_TOOL "${program}")
endfunction()

function(tower_wasi_linker)
  tower_wasi_link_tool()
  get_property(program GLOBAL PROPERTY TOWER_WASI_LINK_TOOL)
  execute_process(COMMAND "${CMAKE_C_COMPILER}" "--target=${CMAKE_C_COMPILER_TARGET}" --print-file-name=libc.a
    OUTPUT_VARIABLE wasi_libc OUTPUT_STRIP_TRAILING_WHITESPACE COMMAND_ERROR_IS_FATAL ANY)
  execute_process(COMMAND "${CMAKE_C_COMPILER}" "--target=${CMAKE_C_COMPILER_TARGET}" --print-libgcc-file-name
    OUTPUT_VARIABLE wasi_builtins OUTPUT_STRIP_TRAILING_WHITESPACE COMMAND_ERROR_IS_FATAL ANY)
  get_filename_component(wasi_libraries "${wasi_libc}" DIRECTORY)
  if(NOT EXISTS "${wasi_libc}" OR NOT EXISTS "${wasi_builtins}")
    message(FATAL_ERROR "The explicit WASI target must provide libc and compiler builtins")
  endif()
  get_property(targets DIRECTORY PROPERTY BUILDSYSTEM_TARGETS)
  foreach(target IN LISTS targets)
    get_target_property(kind ${target} TYPE)
    if(kind STREQUAL "EXECUTABLE")
      add_dependencies(${target} tower-wasi-link)
      set_property(TARGET ${target} APPEND PROPERTY LINK_DEPENDS "${program}")
    endif()
  endforeach()
  set(profile "")
  if(TOWER_BROWSER_THREADS)
    set(profile "--shared-memory")
  endif()
  # Set after the upstream LLVM subdirectory is configured: only owned reactor
  # targets inherit this link recipe, not third-party compiler/tool builds.
  set(rule "\"${program}\" \"${wasi_libraries}\" \"${wasi_builtins}\" ${profile} --threads=4 <LINK_FLAGS> <OBJECTS> -o <TARGET> <LINK_LIBRARIES>")
  set(CMAKE_LINK_DEPENDS_USE_LINKER FALSE PARENT_SCOPE)
  set(CMAKE_C_LINK_EXECUTABLE "${rule}" PARENT_SCOPE)
  set(CMAKE_CXX_LINK_EXECUTABLE "${rule}" PARENT_SCOPE)
endfunction()

function(tower_runtime_tools)
  if(TARGET tower-runtime-bind)
    return()
  endif()
  find_program(TOWER_RUNTIME_HOST_CC NAMES clang REQUIRED)
  tower_host_linker(host_link "${TOWER_RUNTIME_HOST_CC}")
  find_program(TOWER_RUNTIME_LLVM_CONFIG NAMES llvm-config-19 llvm-config REQUIRED)
  execute_process(COMMAND "${TOWER_RUNTIME_HOST_CC}" -print-target-triple
    OUTPUT_VARIABLE host_triple OUTPUT_STRIP_TRAILING_WHITESPACE COMMAND_ERROR_IS_FATAL ANY)
  execute_process(COMMAND "${TOWER_RUNTIME_LLVM_CONFIG}" --libdir
    OUTPUT_VARIABLE llvm_libdir OUTPUT_STRIP_TRAILING_WHITESPACE COMMAND_ERROR_IS_FATAL ANY)
  execute_process(COMMAND "${TOWER_RUNTIME_LLVM_CONFIG}" --link-shared --libnames
    OUTPUT_VARIABLE llvm_libname OUTPUT_STRIP_TRAILING_WHITESPACE COMMAND_ERROR_IS_FATAL ANY)
  set_property(GLOBAL PROPERTY TOWER_RUNTIME_LLVM_LIBRARY "${llvm_libdir}/${llvm_libname}")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/runtime-bind.o")
  set(program "${CMAKE_CURRENT_BINARY_DIR}/runtime_bind${CMAKE_HOST_EXECUTABLE_SUFFIX}")
  # The primary output must match the compiler's depfile target. Otherwise Ninja
  # rejects that depfile and rebuilds this tool and its consumers on every run.
  add_custom_command(OUTPUT "${object}" "${program}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/runtime_bind.tower"
      --jobs "${TOWER_COMPILER_JOBS}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --library --target "${host_triple}" -o "${object}" --depfile "${object}.d"
    COMMAND ${host_link} "${object}" "${llvm_libdir}/${llvm_libname}" -o "${program}"
    DEPFILE "${object}.d"
    DEPENDS scaffolding/host/runtime_bind.tower "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
  add_custom_target(tower-runtime-bind DEPENDS "${program}")
  set_property(GLOBAL PROPERTY TOWER_RUNTIME_BIND "${program}")
endfunction()

function(tower_runtime_object name input triple)
  set(object_jobs "${TOWER_COMPILER_JOBS}")
  if(TOWER_NATIVE AND name STREQUAL "tower-compiler-semantics" AND TOWER_SEMANTICS_JOBS)
    set(object_jobs "${TOWER_SEMANTICS_JOBS}")
  endif()
  # Ordinary entries initialize mutable top-level values. Keep library mode as
  # the default and consume this opt-in before forwarding symbol bindings.
  set(source_mode --library)
  set(bindings ${ARGN})
  if(ARGV3 STREQUAL "SOURCE")
    set(source_mode)
    list(REMOVE_AT bindings 0)
  elseif(ARGV3 STREQUAL "UNINSTRUMENTED")
    set(TOWER_SANITIZER "")
    list(REMOVE_AT bindings 0)
  endif()
  if(TOWER_SANITIZER)
    set(ir "${CMAKE_CURRENT_BINARY_DIR}/${name}-original.ll")
    set(bound "${ir}")
    set(outputs "${ir}")
    set(binding_command)
    set(binding_dependencies)
    if(bindings)
      tower_runtime_tools()
      get_property(bind GLOBAL PROPERTY TOWER_RUNTIME_BIND)
      set(bound "${CMAKE_CURRENT_BINARY_DIR}/${name}-bound.ll")
      list(APPEND outputs "${bound}")
      set(binding_command COMMAND "${bind}" "${ir}" "${bound}" ${bindings})
      set(binding_dependencies "${bind}" tower-runtime-bind)
    endif()
    add_custom_command(OUTPUT ${outputs}
      COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${input}" --jobs "${object_jobs}" ${source_mode} --target "${triple}"
        --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
        --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
        --emit llvm -o "${ir}" --depfile "${ir}.d"
      ${binding_command}
      DEPFILE "${ir}.d"
      DEPENDS "${input}" "${TOWER_BOOTSTRAP_COMPILER}" ${binding_dependencies} VERBATIM)
    tower_sanitizer_object("${name}" "${bound}" "${triple}" "${input}")
    if(input STREQUAL "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/memory_instrumented.tower")
      set_property(GLOBAL APPEND PROPERTY TOWER_INSTRUMENTED_RUNTIME_OBJECTS "${${name}_OBJECT}")
    endif()
    set(${name}_OBJECT "${${name}_OBJECT}" PARENT_SCOPE)
    set(${name}_PRIMARY_OUTPUT "${ir}" PARENT_SCOPE)
    return()
  endif()
  if(NOT bindings)
    # No foreign rewrites remain: emit the Tower object directly.
    if(NOT source_mode)
      set(source_mode --emit object)
    endif()
    set(object "${CMAKE_CURRENT_BINARY_DIR}/${name}.o")
    add_custom_command(OUTPUT "${object}"
      COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${input}" --jobs "${object_jobs}" ${source_mode} --target "${triple}"
        --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
        --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
        -o "${object}" --depfile "${object}.d"
      DEPFILE "${object}.d"
      DEPENDS "${input}" "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
    set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
    set(${name}_OBJECT "${object}" PARENT_SCOPE)
    return()
  endif()
  tower_runtime_tools()
  get_property(bind GLOBAL PROPERTY TOWER_RUNTIME_BIND)
  set(ir "${CMAKE_CURRENT_BINARY_DIR}/${name}-unbound.ll")
  set(bound "${CMAKE_CURRENT_BINARY_DIR}/${name}.ll")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/${name}.o")
  add_custom_command(OUTPUT "${ir}" "${bound}" "${object}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${input}" --jobs "${object_jobs}" ${source_mode} --target "${triple}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --emit llvm-optimized -o "${ir}" --depfile "${ir}.d"
    COMMAND "${bind}" "${ir}" "${bound}" ${bindings}
    COMMAND "${CMAKE_C_COMPILER}" --target=${triple} -O2 -c "${bound}" -o "${object}"
    DEPFILE "${ir}.d"
    DEPENDS "${input}" "${bind}" tower-runtime-bind "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  if(input STREQUAL "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/memory_instrumented.tower")
    set_property(GLOBAL APPEND PROPERTY TOWER_INSTRUMENTED_RUNTIME_OBJECTS "${object}")
  endif()
  set(${name}_OBJECT "${object}" PARENT_SCOPE)
endfunction()

function(tower_target_registry_runtime triple)
  get_property(object GLOBAL PROPERTY TOWER_TARGET_REGISTRY_RUNTIME)
  if(NOT object)
    tower_runtime_object(backend_registry_runtime "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/backend/target_once_state.tower"
      "${triple}" --state backend-registry)
    set_property(GLOBAL PROPERTY TOWER_TARGET_REGISTRY_RUNTIME "${backend_registry_runtime_OBJECT}")
  endif()
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
