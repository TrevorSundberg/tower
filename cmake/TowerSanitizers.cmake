include_guard(GLOBAL)

# OS/LLVM transport only. Instrumentation policy and module checks live in Tower.
function(tower_instrumentation_tool)
  if(TARGET tower-instrument-llvm)
    return()
  endif()
  if(NOT CMAKE_HOST_SYSTEM_NAME STREQUAL "Linux"
      OR NOT CMAKE_HOST_SYSTEM_PROCESSOR MATCHES "^(x86_64|AMD64)$")
    message(FATAL_ERROR "Tower sanitizer tooling requires a Linux x64 build host")
  endif()
  tower_runtime_tools()
  execute_process(COMMAND "${TOWER_RUNTIME_LLVM_CONFIG}" --version
    OUTPUT_VARIABLE version OUTPUT_STRIP_TRAILING_WHITESPACE COMMAND_ERROR_IS_FATAL ANY)
  if(NOT version MATCHES "^19\\.")
    message(FATAL_ERROR "Tower sanitizer tooling requires LLVM 19; found ${version}")
  endif()
  set(triple x86_64-unknown-linux-gnu)
  tower_guest_runtime(host-library "${triple}" posix OFF UNINSTRUMENTED)
  get_property(runtime GLOBAL PROPERTY TOWER_GUEST_host-library_OBJECT)
  get_property(llvm GLOBAL PROPERTY TOWER_RUNTIME_LLVM_LIBRARY)
  tower_host_linker(link "${TOWER_RUNTIME_HOST_CC}")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/instrument_llvm.o")
  set(program "${CMAKE_CURRENT_BINARY_DIR}/bin/instrument_llvm")
  add_custom_command(OUTPUT "${object}" "${program}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tools/instrument_llvm.tower"
      --jobs "${TOWER_COMPILER_JOBS}" --library --target "${triple}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      -o "${object}" --depfile "${object}.d"
    COMMAND "${CMAKE_COMMAND}" -E make_directory "${CMAKE_CURRENT_BINARY_DIR}/bin"
    COMMAND ${link} "${object}" "${runtime}" "${llvm}" -o "${program}"
    DEPFILE "${object}.d"
    DEPENDS scaffolding/tools/instrument_llvm.tower "${TOWER_BOOTSTRAP_COMPILER}" "${runtime}" "${llvm}" VERBATIM)
  add_custom_target(tower-instrument-llvm DEPENDS "${program}")
  set_property(GLOBAL PROPERTY TOWER_INSTRUMENT_LLVM "${program}")
endfunction()

function(tower_sanitizer_object name input triple)
  if(NOT TOWER_SANITIZER MATCHES "^(address|thread)$"
      OR NOT TOWER_NATIVE OR NOT CMAKE_SYSTEM_NAME STREQUAL "Linux"
      OR NOT triple MATCHES "^x86_64-.*linux")
    message(FATAL_ERROR "Tower object instrumentation requires address/thread mode and a native Linux x64 target; got ${triple}")
  endif()
  tower_instrumentation_tool()
  get_property(tool GLOBAL PROPERTY TOWER_INSTRUMENT_LLVM)
  set(ir "${CMAKE_CURRENT_BINARY_DIR}/${name}-${TOWER_SANITIZER}.ll")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/${name}.o")
  add_custom_command(OUTPUT "${ir}" "${object}"
    COMMAND "${tool}" "${TOWER_SANITIZER}" "${input}" "${ir}"
    # Do not pass -fsanitize here: the Tower tool has already run the IR pass.
    COMMAND "${CMAKE_C_COMPILER}" --target=${triple} -O1 ${ARGN} -c "${ir}" -o "${object}"
    DEPENDS "${input}" "${tool}" tower-instrument-llvm VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  set_property(GLOBAL APPEND PROPERTY TOWER_SANITIZER_OBJECTS "${object}\t${input}\t${ir}\t${TOWER_SANITIZER}\n")
  set(${name}_OBJECT "${object}" PARENT_SCOPE)
endfunction()

function(tower_sanitizer_manifest)
  if(TOWER_SANITIZER)
    get_property(objects GLOBAL PROPERTY TOWER_SANITIZER_OBJECTS)
    string(JOIN "" entries ${objects})
    file(GENERATE OUTPUT "${CMAKE_CURRENT_BINARY_DIR}/sanitizer-objects.tsv"
      CONTENT "# Configured objects, not an execution receipt. Object\tOriginal IR\tInstrumented IR\tMode\n${entries}")
  endif()
endfunction()
cmake_language(DEFER CALL tower_sanitizer_manifest)
