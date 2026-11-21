function(tower_compiler_interpreter)
  if(TARGET tower-compiler-interpreter)
    return()
  endif()
  if(TOWER_BOOTSTRAP_COMPILER)
    set(bootstrap "${TOWER_BOOTSTRAP_COMPILER}")
    set(dependency "${TOWER_BOOTSTRAP_COMPILER}")
  else()
    message(FATAL_ERROR "Set TOWER_BOOTSTRAP_COMPILER to an import-capable Tower-built host compiler.")
  endif()
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_compiler_interpreter.tower")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-interpreter.o")
  add_custom_command(OUTPUT "${input}"
    COMMAND "${CMAKE_COMMAND}" -DROOT=${CMAKE_CURRENT_SOURCE_DIR} -DOUTPUT=${input} -DTESTS=${TOWER_PARSER_ONLY} -DBROWSER=${TOWER_BROWSER}
      -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/ComposeInterpreter.cmake"
    DEPENDS scaffolding/compiler/interpreter.tower scaffolding/compiler/interpreter_abi.tower scaffolding/compiler/fast_interpreter.tower
      scaffolding/compiler/interpreter_storage.tower scaffolding/tests/interpreter_storage.tower
      scaffolding/compiler/interpreter_context.tower scaffolding/tests/interpreter_invocation.tower
      scaffolding/compiler/bytecode_package.tower
      scaffolding/library/vector.tower scaffolding/compiler/foundation_nodes.tower
      scaffolding/compiler/foundation_tags.tower cmake/ComposeInterpreter.cmake VERBATIM)
  add_custom_command(OUTPUT "${object}"
    COMMAND "${bootstrap}" "${input}" --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --library --target "${triple}" -o "${object}" --depfile "${object}.d"
    DEPFILE "${object}.d"
    DEPENDS ${dependency} "${input}" scaffolding/bedrock.tower scaffolding/foundation.tower VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  add_library(tower-compiler-interpreter INTERFACE)
  target_sources(tower-compiler-interpreter INTERFACE "${object}")
endfunction()

# LLVM reactors evaluate ordinary Tower code through the same interpreter core,
# with an explicit invocation host rather than the IDE/native-driver ABI owner.
function(tower_compiler_evaluation)
  if(TARGET tower-compiler-evaluation)
    return()
  endif()
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_compiler_evaluation.tower")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-evaluation.o")
  add_custom_command(OUTPUT "${input}"
    COMMAND "${CMAKE_COMMAND}" -DROOT=${CMAKE_CURRENT_SOURCE_DIR} -DOUTPUT=${input}
      -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/ComposeEvaluation.cmake"
    DEPENDS cmake/ComposeEvaluation.cmake VERBATIM)
  add_custom_command(OUTPUT "${object}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${input}" --library --target "${triple}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      -o "${object}" --depfile "${object}.d"
    DEPFILE "${object}.d"
    DEPENDS "${TOWER_BOOTSTRAP_COMPILER}" "${input}" VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  add_library(tower-compiler-evaluation INTERFACE)
  target_sources(tower-compiler-evaluation INTERFACE "${object}")
endfunction()
