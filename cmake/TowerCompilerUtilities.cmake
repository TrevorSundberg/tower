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
  add_library(tower-compiler-memory STATIC)
  include("${CMAKE_CURRENT_SOURCE_DIR}/cmake/TowerRuntime.cmake")
  tower_compiler_runtime("${triple}")
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
      set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_compiler_entities.tower")
      add_custom_command(OUTPUT "${input}"
        COMMAND "${CMAKE_COMMAND}"
          -DENTITIES=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/library/entities.tower
          -DPARSER=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/parse_tree.tower
          -DGENERICS=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/generics.tower
          -DHOST_ENTITIES=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/host_entities.tower
          -DOUTPUT=${input} -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/ComposeTowerSources.cmake"
        DEPENDS scaffolding/library/entities.tower scaffolding/compiler/parse_tree.tower scaffolding/compiler/generics.tower
          scaffolding/compiler/host_entities.tower cmake/ComposeTowerSources.cmake
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
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_compiler_parser_nodes.tower")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-parser-nodes.o")
  set(emission_tests "")
  set(expansion_tests "")
  set(replacement_tests "")
  if(TOWER_PARSER_ONLY)
    set(emission_tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_emission.tower")
    set(expansion_tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_expansion.tower")
    set(replacement_tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_replacements.tower")
  endif()
  add_custom_command(OUTPUT "${input}"
    COMMAND "${CMAKE_COMMAND}"
      -DVECTOR=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/library/vector.tower
      -DPAYLOADS=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/parser_nodes.tower
      -DLEXER=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lexer_table.tower
      -DREGEX=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/regex_grammar.tower
      -DAUTOMATON=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/automaton.tower
      -DLOWERING=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/regex_lowering.tower
      -DLR=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lr_analysis.tower
      -DSTATES=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lr_states.tower
      -DLALR=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lr_lalr.tower
      -DRUNTIME=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lr_runtime.tower
      -DPARSER=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lr_parser.tower
      -DGRAMMAR=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lr_grammar.tower
      -DFOUNDATION=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/foundation_nodes.tower
      -DTREE=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lr_tree.tower
      -DSYNTAX_LEXER=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax_lexer.tower
      -DSOURCE=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax_source.tower
      -DSYNTAX=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax_nodes.tower
      -DREADER=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax_reader.tower
      -DVALIDATION=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax_validation.tower
      -DEMISSION=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax_emission.tower
      -DEXPANSION=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax_expansion.tower
      -DREPLACEMENTS=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax_replacements.tower
      -DTEMPLATE=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax_template.tower
      -DSCAN=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax_scan.tower
      -DEMISSION_TESTS=${emission_tests}
      -DTEMPLATE_TESTS=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_template.tower
      -DSCAN_TESTS=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_scan.tower
      -DEXPANSION_TESTS=${expansion_tests}
      -DMODULE_TESTS=${TOWER_MODULE_TESTS}
      -DWORK_TESTS=${TOWER_WORK_TESTS}
      -DBACKEND_TESTS=${TOWER_BACKEND_TESTS}
      -DNATIVE=${TOWER_NATIVE}
      -DREPLACEMENT_TESTS=${replacement_tests}
      -DFORMAT_DIR=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler
      -DOUTPUT=${input} -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/ComposeParserNodes.cmake"
    DEPENDS scaffolding/library/vector.tower scaffolding/compiler/parser_nodes.tower scaffolding/compiler/lexer_table.tower scaffolding/compiler/regex_grammar.tower scaffolding/compiler/automaton.tower scaffolding/compiler/regex_lowering.tower scaffolding/compiler/lr_analysis.tower scaffolding/compiler/lr_states.tower scaffolding/compiler/lr_lalr.tower scaffolding/compiler/lr_runtime.tower scaffolding/compiler/lr_parser.tower scaffolding/compiler/lr_grammar.tower scaffolding/compiler/lr_tree.tower scaffolding/compiler/foundation_nodes.tower scaffolding/compiler/syntax_lexer.tower scaffolding/compiler/syntax_source.tower cmake/ComposeParserNodes.cmake
    DEPENDS scaffolding/compiler/syntax_nodes.tower scaffolding/compiler/syntax_reader.tower scaffolding/compiler/syntax_validation.tower
    DEPENDS scaffolding/compiler/format.tower scaffolding/compiler/format_foundation.tower scaffolding/compiler/format_grammar.tower scaffolding/compiler/format_source.tower
    DEPENDS scaffolding/compiler/syntax_emission.tower ${emission_tests}
    DEPENDS scaffolding/compiler/syntax_expansion.tower ${expansion_tests}
    DEPENDS scaffolding/compiler/syntax_replacements.tower ${replacement_tests}
    DEPENDS scaffolding/compiler/syntax_template.tower
    DEPENDS ${TOWER_FRONTEND_SOURCES} cmake/TowerFrontend.cmake
    DEPENDS scaffolding/tests/frontend_bedrock.tower scaffolding/tests/frontend_cache.tower
    DEPENDS scaffolding/tests/lr_work.tower
    DEPENDS scaffolding/compiler/syntax_scan.tower
    DEPENDS scaffolding/tests/syntax_template.tower
    DEPENDS scaffolding/tests/syntax_scan.tower
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
  include("${CMAKE_CURRENT_SOURCE_DIR}/cmake/TowerSyntaxTests.cmake")
  include("${CMAKE_CURRENT_SOURCE_DIR}/cmake/TowerParserFormatting.cmake")
  include("${CMAKE_CURRENT_SOURCE_DIR}/cmake/TowerParserIntegration.cmake")
  include("${CMAKE_CURRENT_SOURCE_DIR}/cmake/TowerTemplateBuild.cmake")
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
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_compiler_semantics.tower")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-semantics.o")
  set(sources scaffolding/library/vector.tower scaffolding/compiler/foundation_nodes.tower scaffolding/compiler/parser_nodes.tower scaffolding/compiler/frontend_compilation.tower scaffolding/compiler/completion.tower scaffolding/compiler/services.tower)
  list(APPEND sources scaffolding/compiler/source_comments.tower scaffolding/compiler/c_emitter.tower scaffolding/compiler/c_runtime.tower scaffolding/compiler/c_control.tower scaffolding/compiler/roku_emitter.tower scaffolding/compiler/roku_runtime.tower)
  foreach(name IN ITEMS context definitions support types values statements lifecycle)
    list(APPEND sources scaffolding/compiler/semantic_${name}.tower)
  endforeach()
  add_custom_command(OUTPUT "${input}"
    COMMAND "${CMAKE_COMMAND}" -DROOT=${CMAKE_CURRENT_SOURCE_DIR} -DOUTPUT=${input}
      -DBROWSER=${TOWER_BROWSER} -DTESTS=${TOWER_PARSER_ONLY} -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/ComposeSemanticSources.cmake"
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
  if(triple MATCHES "linux")
    find_package(Threads REQUIRED)
    target_link_libraries(tower-compiler-semantics INTERFACE Threads::Threads ${CMAKE_DL_LIBS})
    target_link_options(tower-compiler-semantics INTERFACE -Wl,--export-dynamic-symbol=work_thread_entry)
  elseif(triple MATCHES "apple|darwin")
    target_link_options(tower-compiler-semantics INTERFACE -Wl,-exported_symbol,_work_thread_entry)
  elseif(triple MATCHES "windows")
    target_link_libraries(tower-compiler-semantics INTERFACE kernel32)
    if(MSVC)
      target_link_options(tower-compiler-semantics INTERFACE /EXPORT:work_windows_entry)
    else()
      target_link_options(tower-compiler-semantics INTERFACE -Wl,--export-all-symbols)
    endif()
  endif()
endfunction()
