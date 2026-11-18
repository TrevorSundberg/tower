# Build actual Tower source for the compiler's target, using a host bootstrap.
# Generated objects are ordinary platform artifacts, never Tower interchange files.
set(TOWER_BOOTSTRAP_COMPILER "" CACHE FILEPATH "Host Tower compiler used to build Tower-written compiler code")
set(TOWER_UTILITIES_TARGET "" CACHE STRING "Override the compiler utility object's target triple")
function(tower_compiler_utilities)
  if(TARGET tower-compiler-utilities)
    return()
  endif()
  if(TOWER_BOOTSTRAP_COMPILER)
    if(NOT EXISTS "${TOWER_BOOTSTRAP_COMPILER}")
      message(FATAL_ERROR "TOWER_BOOTSTRAP_COMPILER does not exist: ${TOWER_BOOTSTRAP_COMPILER}")
    endif()
    set(bootstrap "${TOWER_BOOTSTRAP_COMPILER}")
    set(bootstrap_dependency "${TOWER_BOOTSTRAP_COMPILER}")
  elseif(TARGET towerc-seed)
    set(bootstrap "$<TARGET_FILE:towerc-seed>")
    set(bootstrap_dependency towerc-seed)
  else()
    message(FATAL_ERROR "Set TOWER_BOOTSTRAP_COMPILER to a host towerc (playground/scripts/build-bootstrap.sh builds the transitional C++ seed).")
  endif()
  if(TOWER_UTILITIES_TARGET)
    set(triple "${TOWER_UTILITIES_TARGET}")
  elseif(TOWER_BROWSER)
    set(triple wasm32-unknown-unknown)
  elseif(CMAKE_CXX_COMPILER_TARGET)
    set(triple "${CMAKE_CXX_COMPILER_TARGET}")
  elseif(MSVC)
    if(CMAKE_SYSTEM_PROCESSOR MATCHES "ARM64|aarch64")
      set(triple aarch64-pc-windows-msvc)
    else()
      set(triple x86_64-pc-windows-msvc)
    endif()
  else()
    execute_process(COMMAND "${CMAKE_CXX_COMPILER}" -dumpmachine
      OUTPUT_VARIABLE triple OUTPUT_STRIP_TRAILING_WHITESPACE COMMAND_ERROR_IS_FATAL ANY)
  endif()
  add_library(tower-compiler-memory STATIC scaffolding/compiler-memory.cpp)
  set_property(GLOBAL PROPERTY TOWER_COMPILER_TRIPLE "${triple}")
  add_library(tower-compiler-utilities INTERFACE)
  add_library(tower-compiler-entities INTERFACE)
  foreach(source IN ITEMS scaffolding/compiler/utf8.tower scaffolding/library/bytes.tower scaffolding/library/entities.tower)
    get_filename_component(name "${source}" NAME_WE)
    set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-${name}.o")
    set(input "${CMAKE_CURRENT_SOURCE_DIR}/${source}")
    if(name STREQUAL "entities")
      set(input "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-entities.tower")
      add_custom_command(OUTPUT "${input}"
        COMMAND "${CMAKE_COMMAND}"
          -DENTITIES=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/library/entities.tower
          -DPARSER=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/parse-tree.tower
          -DGENERICS=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/generics.tower
          -DOUTPUT=${input} -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/ComposeTowerSources.cmake"
        DEPENDS scaffolding/library/entities.tower scaffolding/compiler/parse-tree.tower scaffolding/compiler/generics.tower cmake/ComposeTowerSources.cmake
        VERBATIM)
    endif()
    add_custom_command(OUTPUT "${object}"
      COMMAND "${bootstrap}" "${input}"
        --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
        --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
        --library --target "${triple}" -o "${object}"
      DEPENDS ${bootstrap_dependency} "${source}" "${input}"
        scaffolding/bedrock.tower scaffolding/foundation.tower
      COMMENT "Compiling Tower-written ${name} compiler code for ${triple}" VERBATIM)
    set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
    if(name STREQUAL "entities")
      target_sources(tower-compiler-entities INTERFACE "${object}")
    else()
      target_sources(tower-compiler-utilities INTERFACE "${object}")
    endif()
  endforeach()
endfunction()

# These components use the Tower-written specializer (vector(T)), so compile
# them with stage1 or a supplied recent compiler, not the pre-template seed.
function(tower_compiler_parser_nodes)
  if(TARGET tower-compiler-parser-nodes)
    return()
  endif()
  if(TOWER_BOOTSTRAP_COMPILER)
    set(bootstrap "${TOWER_BOOTSTRAP_COMPILER}")
    set(dependency "${TOWER_BOOTSTRAP_COMPILER}")
  elseif(TARGET towerc-stage1)
    set(bootstrap "$<TARGET_FILE:towerc-stage1>")
    set(dependency towerc-stage1)
  else()
    message(FATAL_ERROR "Parser components require a template-capable host Tower compiler.")
  endif()
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-parser-nodes.tower")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-parser-nodes.o")
  add_custom_command(OUTPUT "${input}"
    COMMAND "${CMAKE_COMMAND}"
      -DVECTOR=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/library/vector.tower
      -DPAYLOADS=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/parser-nodes.tower
      -DLEXER=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lexer-table.tower
      -DREGEX=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/regex-grammar.tower
      -DAUTOMATON=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/automaton.tower
      -DLOWERING=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/regex-lowering.tower
      -DOUTPUT=${input} -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/ComposeParserNodes.cmake"
    DEPENDS scaffolding/library/vector.tower scaffolding/compiler/parser-nodes.tower scaffolding/compiler/lexer-table.tower scaffolding/compiler/regex-grammar.tower scaffolding/compiler/automaton.tower scaffolding/compiler/regex-lowering.tower cmake/ComposeParserNodes.cmake
    VERBATIM)
  add_custom_command(OUTPUT "${object}"
    COMMAND "${bootstrap}" "${input}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --library --target "${triple}" -o "${object}"
    DEPENDS ${dependency} "${input}" scaffolding/bedrock.tower scaffolding/foundation.tower
    COMMENT "Compiling Tower-owned parser components for ${triple}" VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  add_library(tower-compiler-parser-nodes INTERFACE)
  target_sources(tower-compiler-parser-nodes INTERFACE "${object}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/parser-nodes.cpp" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler-grammar.cpp")
endfunction()
