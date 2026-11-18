function(tower_compiler_interpreter)
  if(TARGET tower-compiler-interpreter)
    return()
  endif()
  if(TOWER_BOOTSTRAP_COMPILER)
    set(bootstrap "${TOWER_BOOTSTRAP_COMPILER}")
    set(dependency "${TOWER_BOOTSTRAP_COMPILER}")
  else()
    set(bootstrap "$<TARGET_FILE:towerc-stage1>")
    set(dependency towerc-stage1)
  endif()
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-interpreter.tower")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-interpreter.o")
  add_custom_command(OUTPUT "${input}"
    COMMAND "${CMAKE_COMMAND}" -DROOT=${CMAKE_CURRENT_SOURCE_DIR} -DOUTPUT=${input}
      -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/ComposeInterpreter.cmake"
    DEPENDS scaffolding/compiler/interpreter.tower scaffolding/compiler/interpreter-abi.tower
      scaffolding/library/vector.tower scaffolding/compiler/foundation-nodes.tower
      scaffolding/core.hpp cmake/ComposeInterpreter.cmake VERBATIM)
  add_custom_command(OUTPUT "${object}"
    COMMAND "${bootstrap}" "${input}" --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --library --target "${triple}" -o "${object}"
    DEPENDS ${dependency} "${input}" scaffolding/bedrock.tower scaffolding/foundation.tower VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  add_library(tower-compiler-interpreter INTERFACE)
  target_sources(tower-compiler-interpreter INTERFACE "${object}")
endfunction()
