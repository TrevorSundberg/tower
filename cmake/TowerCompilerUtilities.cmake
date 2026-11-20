# Build actual Tower source for the compiler's target, using a host bootstrap.
# Generated objects are ordinary platform artifacts, never Tower interchange files.
set(TOWER_BOOTSTRAP_COMPILER "" CACHE FILEPATH "Host Tower compiler used to build Tower-written compiler code")
option(TOWER_MODULE_TESTS "Include Tower module loader functional checks" OFF)
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
  else()
    message(FATAL_ERROR "Set TOWER_BOOTSTRAP_COMPILER to an import-capable Tower-built host towerc; see docs/modules.md.")
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
  include("${CMAKE_CURRENT_SOURCE_DIR}/cmake/TowerHost.cmake")
  tower_compiler_host("${bootstrap}" "${bootstrap_dependency}" "${triple}")
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
          -DHOST_ENTITIES=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/host-entities.tower
          -DOUTPUT=${input} -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/ComposeTowerSources.cmake"
        DEPENDS scaffolding/library/entities.tower scaffolding/compiler/parse-tree.tower scaffolding/compiler/generics.tower
          scaffolding/compiler/host-entities.tower cmake/ComposeTowerSources.cmake
        VERBATIM)
    endif()
    add_custom_command(OUTPUT "${object}"
      COMMAND "${bootstrap}" "${input}"
        --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
        --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
        --library --target "${triple}" -o "${object}" --depfile "${object}.d"
      DEPFILE "${object}.d"
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
  include("${CMAKE_CURRENT_SOURCE_DIR}/cmake/TowerSharedRuntime.cmake")
endfunction()

# Compiler modules use explicit imports and the Tower-written specializer.
function(tower_compiler_parser_nodes)
  include("${CMAKE_CURRENT_FUNCTION_LIST_DIR}/TowerFrontend.cmake")
  if(TARGET tower-compiler-parser-nodes)
    return()
  endif()
  if(TOWER_BOOTSTRAP_COMPILER)
    set(bootstrap "${TOWER_BOOTSTRAP_COMPILER}")
    set(dependency "${TOWER_BOOTSTRAP_COMPILER}")
  else()
    message(FATAL_ERROR "Parser components require an import-capable Tower-built host compiler.")
  endif()
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-parser-nodes.tower")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-parser-nodes.o")
  set(emission_tests "")
  set(expansion_tests "")
  set(replacement_tests "")
  if(TOWER_PARSER_ONLY)
    set(emission_tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax-emission.tower")
    set(expansion_tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax-expansion.tower")
    set(replacement_tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax-replacements.tower")
  endif()
  add_custom_command(OUTPUT "${input}"
    COMMAND "${CMAKE_COMMAND}"
      -DVECTOR=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/library/vector.tower
      -DPAYLOADS=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/parser-nodes.tower
      -DLEXER=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lexer-table.tower
      -DREGEX=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/regex-grammar.tower
      -DAUTOMATON=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/automaton.tower
      -DLOWERING=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/regex-lowering.tower
      -DLR=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lr-analysis.tower
      -DSTATES=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lr-states.tower
      -DLALR=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lr-lalr.tower
      -DRUNTIME=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lr-runtime.tower
      -DPARSER=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lr-parser.tower
      -DGRAMMAR=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lr-grammar.tower
      -DFOUNDATION=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/foundation-nodes.tower
      -DTREE=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lr-tree.tower
      -DSYNTAX_LEXER=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax-lexer.tower
      -DSOURCE=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax-source.tower
      -DSYNTAX=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax-nodes.tower
      -DREADER=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax-reader.tower
      -DVALIDATION=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax-validation.tower
      -DEMISSION=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax-emission.tower
      -DEXPANSION=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax-expansion.tower
      -DREPLACEMENTS=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax-replacements.tower
      -DTEMPLATE=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax-template.tower
      -DSCAN=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax-scan.tower
      -DEMISSION_TESTS=${emission_tests}
      -DTEMPLATE_TESTS=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax-template.tower
      -DSCAN_TESTS=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax-scan.tower
      -DEXPANSION_TESTS=${expansion_tests}
      -DMODULE_TESTS=${TOWER_MODULE_TESTS}
      -DREPLACEMENT_TESTS=${replacement_tests}
      -DFORMAT_DIR=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler
      -DOUTPUT=${input} -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/ComposeParserNodes.cmake"
    DEPENDS scaffolding/library/vector.tower scaffolding/compiler/parser-nodes.tower scaffolding/compiler/lexer-table.tower scaffolding/compiler/regex-grammar.tower scaffolding/compiler/automaton.tower scaffolding/compiler/regex-lowering.tower scaffolding/compiler/lr-analysis.tower scaffolding/compiler/lr-states.tower scaffolding/compiler/lr-lalr.tower scaffolding/compiler/lr-runtime.tower scaffolding/compiler/lr-parser.tower scaffolding/compiler/lr-grammar.tower scaffolding/compiler/lr-tree.tower scaffolding/compiler/foundation-nodes.tower scaffolding/compiler/syntax-lexer.tower scaffolding/compiler/syntax-source.tower cmake/ComposeParserNodes.cmake
    DEPENDS scaffolding/compiler/syntax-nodes.tower scaffolding/compiler/syntax-reader.tower scaffolding/compiler/syntax-validation.tower
    DEPENDS scaffolding/compiler/format.tower scaffolding/compiler/format-foundation.tower scaffolding/compiler/format-grammar.tower scaffolding/compiler/format-source.tower
    DEPENDS scaffolding/compiler/syntax-emission.tower ${emission_tests}
    DEPENDS scaffolding/compiler/syntax-expansion.tower ${expansion_tests}
    DEPENDS scaffolding/compiler/syntax-replacements.tower ${replacement_tests}
    DEPENDS scaffolding/compiler/syntax-template.tower
    DEPENDS ${TOWER_FRONTEND_SOURCES} cmake/TowerFrontend.cmake
    DEPENDS scaffolding/tests/frontend-bedrock.tower scaffolding/tests/frontend-cache.tower
    DEPENDS scaffolding/compiler/syntax-scan.tower
    DEPENDS scaffolding/tests/syntax-template.tower
    DEPENDS scaffolding/tests/syntax-scan.tower
    VERBATIM)
  add_custom_command(OUTPUT "${object}"
    COMMAND "${bootstrap}" "${input}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --library --target "${triple}" -o "${object}" --depfile "${object}.d"
    DEPFILE "${object}.d"
    DEPENDS ${dependency} "${input}" scaffolding/bedrock.tower scaffolding/foundation.tower
    COMMENT "Compiling Tower-owned parser components for ${triple}" VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  tower_compiler_semantics()
  add_library(tower-compiler-parser-nodes INTERFACE)
  target_sources(tower-compiler-parser-nodes INTERFACE "${object}")
  include("${CMAKE_CURRENT_SOURCE_DIR}/cmake/TowerParserFormatting.cmake")
  include("${CMAKE_CURRENT_SOURCE_DIR}/cmake/TowerParserTable.cmake")
  include("${CMAKE_CURRENT_SOURCE_DIR}/cmake/TowerFrontendTests.cmake")
endfunction()

function(tower_compiler_semantics)
  if(TARGET tower-compiler-semantics)
    return()
  endif()
  if(TOWER_BOOTSTRAP_COMPILER)
    set(bootstrap "${TOWER_BOOTSTRAP_COMPILER}")
    set(dependency "${TOWER_BOOTSTRAP_COMPILER}")
  else()
    message(FATAL_ERROR "Set TOWER_BOOTSTRAP_COMPILER to an import-capable Tower-built host compiler.")
  endif()
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-semantics.tower")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-semantics.o")
  set(sources scaffolding/library/vector.tower scaffolding/compiler/foundation-nodes.tower scaffolding/compiler/parser-nodes.tower scaffolding/compiler/frontend-compilation.tower scaffolding/compiler/completion.tower scaffolding/compiler/services.tower)
  list(APPEND sources scaffolding/compiler/source-comments.tower scaffolding/compiler/c-emitter.tower scaffolding/compiler/c-runtime.tower scaffolding/compiler/c-control.tower scaffolding/compiler/roku-emitter.tower scaffolding/compiler/roku-runtime.tower)
  foreach(name IN ITEMS context definitions support types values statements lifecycle)
    list(APPEND sources scaffolding/compiler/semantic-${name}.tower)
  endforeach()
  add_custom_command(OUTPUT "${input}"
    COMMAND "${CMAKE_COMMAND}" -DROOT=${CMAKE_CURRENT_SOURCE_DIR} -DOUTPUT=${input}
      -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/ComposeSemanticSources.cmake"
    DEPENDS ${sources} cmake/ComposeSemanticSources.cmake VERBATIM)
  add_custom_command(OUTPUT "${object}"
    COMMAND "${bootstrap}" "${input}" --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --library --target "${triple}" -o "${object}" --depfile "${object}.d"
    DEPFILE "${object}.d"
    DEPENDS ${dependency} "${input}" scaffolding/bedrock.tower scaffolding/foundation.tower
    COMMENT "Compiling Tower semantic compiler for ${triple}" VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  add_library(tower-compiler-semantics INTERFACE)
  target_sources(tower-compiler-semantics INTERFACE "${object}")
endfunction()
