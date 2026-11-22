cmake_minimum_required(VERSION 3.20)

# Ninja owns outer build parallelism. Bootstrap children must not each admit
# the full host capacity; ordinary towerc invocations keep their existing policy.
set(TOWER_COMPILER_JOBS "1" CACHE STRING "Worker budget for each bootstrap compiler invocation")
if(NOT TOWER_COMPILER_JOBS MATCHES "^[1-9][0-9]*$")
  message(FATAL_ERROR "TOWER_COMPILER_JOBS must be a positive decimal worker count; outer parallelism is controlled by TOWER_BUILD_JOBS")
endif()
set(TOWER_SANITIZER "" CACHE STRING "Optional native Tower object instrumentation: address or thread")
if(NOT TOWER_SANITIZER STREQUAL "" AND NOT TOWER_SANITIZER MATCHES "^(address|thread)$")
  message(FATAL_ERROR "TOWER_SANITIZER must be empty, address or thread")
endif()

project(scaffolding LANGUAGES C CXX VERSION 1)

if(TOWER_SANITIZER)
  if(NOT TOWER_NATIVE OR NOT CMAKE_SYSTEM_NAME STREQUAL "Linux"
      OR NOT CMAKE_HOST_SYSTEM_NAME STREQUAL "Linux"
      OR NOT CMAKE_SYSTEM_PROCESSOR MATCHES "^(x86_64|AMD64)$"
      OR NOT CMAKE_C_COMPILER_ID STREQUAL "Clang"
      OR NOT CMAKE_CXX_COMPILER_ID STREQUAL "Clang"
      OR CMAKE_C_COMPILER_VERSION VERSION_LESS 19 OR NOT CMAKE_C_COMPILER_VERSION VERSION_LESS 20
      OR CMAKE_CXX_COMPILER_VERSION VERSION_LESS 19 OR NOT CMAKE_CXX_COMPILER_VERSION VERSION_LESS 20)
    message(FATAL_ERROR "TOWER_SANITIZER requires the native Linux x64 profile and Clang/LLVM 19")
  endif()
  # Object IR is instrumented explicitly; only the final link gets this flag.
  add_link_options("-fsanitize=${TOWER_SANITIZER}")
endif()

# Minimal bootstrap bridge: Tower owns the tool recipes and process execution.
# Requires only the published compiler and installed host LLVM.
option(TOWER_TOOLS_ONLY "Bootstrap the Linux x64 Tower build tools" OFF)
if(TOWER_TOOLS_ONLY)
  set(TOWER_TOOL "" CACHE STRING "Optional Tower build tool")
  if(NOT TOWER_BOOTSTRAP_COMPILER OR NOT CMAKE_HOST_SYSTEM_NAME STREQUAL "Linux"
      OR NOT CMAKE_HOST_SYSTEM_PROCESSOR MATCHES "^(x86_64|AMD64)$")
    message(FATAL_ERROR "Tower tools require the verified Linux x64 bootstrap; see bootstrap/README.md")
  endif()
  include(cmake/TowerRuntime.cmake)
  set(tool_triple x86_64-unknown-linux-gnu)
  tower_guest_runtime(host-library "${tool_triple}" posix OFF UNINSTRUMENTED)
  get_property(tool_runtime GLOBAL PROPERTY TOWER_GUEST_host-library_OBJECT)
  if(TOWER_TOOL STREQUAL "instrument_llvm")
    tower_instrumentation_tool()
    add_custom_target(tower-tools DEPENDS tower-instrument-llvm)
    return()
  endif()
  set(tool_object "${CMAKE_CURRENT_BINARY_DIR}/build_tools.o")
  set(tool_builder "${CMAKE_CURRENT_BINARY_DIR}/build_tools")
  add_custom_command(OUTPUT "${tool_object}" "${tool_builder}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tools/build_tools.tower"
      --jobs "${TOWER_COMPILER_JOBS}" --library --target "${tool_triple}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      -o "${tool_object}" --depfile "${tool_object}.d"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" --jobs "${TOWER_COMPILER_JOBS}" --link-executable "${tool_object}" "${tool_runtime}" -o "${tool_builder}"
    DEPFILE "${tool_object}.d"
    DEPENDS scaffolding/tools/build_tools.tower "${TOWER_BOOTSTRAP_COMPILER}" "${tool_runtime}" VERBATIM)
  add_custom_target(tower-tools
    COMMAND "${tool_builder}" "${TOWER_BOOTSTRAP_COMPILER}"
      "${CMAKE_CURRENT_SOURCE_DIR}" "${CMAKE_CURRENT_BINARY_DIR}/bin" "${tool_runtime}" "${TOWER_COMPILER_JOBS}" ${TOWER_TOOL}
    DEPENDS "${tool_builder}" VERBATIM)
  return()
endif()

include(cmake/TowerCompilerUtilities.cmake)
include(cmake/TowerInterpreter.cmake)

if(CMAKE_SYSTEM_NAME STREQUAL "Linux" AND NOT TOWER_SANITIZER)
  # Owned native compiler, parser and test targets use the published Tower
  # linker. Object emission and third-party compiler tools keep their toolchain.
  set(CMAKE_LINK_DEPENDS_USE_LINKER FALSE)
  set(CMAKE_C_LINK_EXECUTABLE "\"${TOWER_BOOTSTRAP_COMPILER}\" --jobs ${TOWER_COMPILER_JOBS} --link-executable <LINK_FLAGS> <OBJECTS> -o <TARGET> <LINK_LIBRARIES>")
  set(CMAKE_CXX_LINK_EXECUTABLE "${CMAKE_C_LINK_EXECUTABLE}")
endif()

option(TOWER_NATIVE "Build Tower's native compiler/linker driver against an installed LLVM" OFF)
if(TOWER_NATIVE)
  find_package(LLVM REQUIRED CONFIG)
  if(TOWER_SANITIZER AND NOT LLVM_PACKAGE_VERSION MATCHES "^19\\.")
    message(FATAL_ERROR "Tower sanitizer mode requires LLVM 19; configured package is ${LLVM_PACKAGE_VERSION}")
  endif()
  # Relocatable resources include the generated Tower runtime target artifacts.
  file(MAKE_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/share/tower")
  foreach(resource IN ITEMS bedrock.tower foundation.tower foundation_syntax.tower types.tower tower.tower)
    configure_file("scaffolding/${resource}" "share/tower/${resource}" COPYONLY)
  endforeach()
  file(GLOB builtin_modules CONFIGURE_DEPENDS RELATIVE "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding"
    "scaffolding/library/*.tower" "scaffolding/types/*.tower" "scaffolding/backend/foreign_grammar.tower")
  foreach(resource IN LISTS builtin_modules)
    configure_file("scaffolding/${resource}" "share/tower/${resource}" COPYONLY)
  endforeach()
  tower_compiler_utilities()
  tower_compiler_parser_nodes()
  tower_compiler_interpreter()
  add_executable(towerc)
  set_target_properties(towerc PROPERTIES LINKER_LANGUAGE CXX)
  target_link_libraries(towerc PRIVATE tower-compiler-parser-nodes tower-compiler-semantics tower-compiler-entities tower-compiler-utilities tower-compiler-memory)
  target_link_libraries(towerc PRIVATE LLVM tower-compiler-interpreter)
  include(cmake/TowerDriver.cmake)
  include(cmake/TowerStorageTests.cmake)
  include(cmake/TowerFormatTests.cmake)
  include(cmake/TowerWorkTests.cmake)
  foreach(host IN ITEMS towerc)
    target_compile_options(${host} PRIVATE -fno-exceptions)
  endforeach()
  return()
endif()

option(TOWER_BROWSER "Build the static playground's WASI reactor" OFF)
option(TOWER_BROWSER_LLVM "Also build the LLVM compiler experiment as a separate reactor" OFF)
option(TOWER_BROWSER_CROSS "Include CPU backends and native linkers in a separate browser compiler" OFF)
option(TOWER_BROWSER_THREADS "Use the WASI threads transport for compiler work" OFF)
if(TOWER_BROWSER_THREADS)
  add_link_options(-Wl,--wrap=malloc,--wrap=calloc,--wrap=realloc,--wrap=free
    -Wl,--wrap=aligned_alloc,--wrap=posix_memalign)
endif()
if(TOWER_BROWSER)
  tower_compiler_utilities()
  tower_compiler_parser_nodes()
  tower_compiler_interpreter()
  add_executable(tower-browser)
  set_target_properties(tower-browser PROPERTIES LINKER_LANGUAGE CXX)
  target_link_libraries(tower-browser PRIVATE tower-compiler-interpreter tower-compiler-parser-nodes tower-compiler-semantics tower-compiler-entities tower-compiler-utilities tower-compiler-memory)
  target_compile_options(tower-browser PRIVATE -fno-exceptions -UNDEBUG)
  target_link_options(tower-browser PRIVATE -mexec-model=reactor
    -Wl,--export=tw_abi_version -Wl,--export=tw_alloc -Wl,--export=tw_free
    $<$<CONFIG:Release>:-Wl,--strip-all>
    $<$<CONFIG:MinSizeRel>:-Wl,--strip-all>
    # Match the LLVM and self-built compiler allowance. Expanded Foundation
    # round trips can exceed 512 MiB; this ceiling does not preallocate memory.
    -Wl,-z,stack-size=2097152 -Wl,--initial-memory=8388608 -Wl,--max-memory=2147483648)
  if(TOWER_BROWSER_THREADS)
    target_link_options(tower-browser PRIVATE
      -Wl,--export=work_thread_entry -Wl,--export-table -Wl,--growable-table
      "-Wl,--allow-undefined-file=${CMAKE_CURRENT_SOURCE_DIR}/cmake/WorkImports.txt")
  endif()
  set_target_properties(tower-browser PROPERTIES OUTPUT_NAME tower SUFFIX .wasm)
  include(cmake/TowerIde.cmake)
  tower_ide_integrate(tower-browser)
  include(cmake/TowerWorkTests.cmake)
  if(TOWER_BROWSER_LLVM)
    tower_compiler_evaluation()
    set(TOWER_LLVM_SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/third_party/llvm-project" CACHE PATH "LLVM source checkout")
    include_directories(${TOWER_LLVM_SOURCE_DIR}/wasi-include)
    if(TOWER_BROWSER_CROSS)
      set(LLVM_TARGETS_TO_BUILD "WebAssembly;X86;AArch64" CACHE STRING "" FORCE)
    else()
      set(LLVM_TARGETS_TO_BUILD WebAssembly CACHE STRING "" FORCE)
    endif()
    set(LLVM_HOST_TRIPLE wasm32-unknown-wasi CACHE STRING "" FORCE)
    set(LLVM_DEFAULT_TARGET_TRIPLE wasm32-unknown-wasi CACHE STRING "" FORCE)
    set(LLVM_ENABLE_THREADS OFF CACHE BOOL "" FORCE)
    set(LLVM_ENABLE_EH OFF CACHE BOOL "" FORCE)
    set(LLVM_ENABLE_ZLIB OFF CACHE BOOL "" FORCE)
    set(LLVM_ENABLE_ZSTD OFF CACHE BOOL "" FORCE)
    set(LLVM_ENABLE_LIBXML2 OFF CACHE BOOL "" FORCE)
    set(LLVM_ENABLE_TERMINFO OFF CACHE BOOL "" FORCE)
    set(LLVM_ENABLE_LIBEDIT OFF CACHE BOOL "" FORCE)
    set(LLVM_ENABLE_BACKTRACES OFF CACHE BOOL "" FORCE)
    set(LLVM_INCLUDE_TESTS OFF CACHE BOOL "" FORCE)
    set(LLVM_INCLUDE_EXAMPLES OFF CACHE BOOL "" FORCE)
    set(LLVM_INCLUDE_BENCHMARKS OFF CACHE BOOL "" FORCE)
    set(LLVM_INCLUDE_TOOLS ON CACHE BOOL "" FORCE)
    set(LLVM_ENABLE_PROJECTS "" CACHE STRING "" FORCE)
    set(LLVM_BUILD_TOOLS OFF CACHE BOOL "" FORCE)
    set(LLVM_INCLUDE_UTILS OFF CACHE BOOL "" FORCE)
    set(LLVM_ENABLE_PIC OFF CACHE BOOL "" FORCE)
    set(LLVM_BUILD_LLVM_DYLIB OFF CACHE BOOL "" FORCE)
    # This checkout's WASI support predates the SDK's uppercase platform name.
    set(tower_sdk_system_name "${CMAKE_SYSTEM_NAME}")
    set(CMAKE_SYSTEM_NAME Wasi)
    add_subdirectory(${TOWER_LLVM_SOURCE_DIR}/llvm third_party/llvm-project/llvm)
    set(CMAKE_SYSTEM_NAME "${tower_sdk_system_name}")
    function(tower_llvm_reactor name output)
      add_executable(${name})
      target_include_directories(${name} PRIVATE ${TOWER_LLVM_SOURCE_DIR}/llvm/include ${CMAKE_CURRENT_BINARY_DIR}/third_party/llvm-project/llvm/include
        "${CMAKE_CURRENT_BINARY_DIR}")
      set_target_properties(${name} PROPERTIES LINKER_LANGUAGE CXX)
      target_link_libraries(${name} PRIVATE tower-compiler-evaluation tower-compiler-parser-nodes tower-compiler-semantics tower-compiler-entities tower-compiler-utilities tower-compiler-memory)
      target_compile_options(${name} PRIVATE -fno-exceptions -UNDEBUG)
      target_link_options(${name} PRIVATE -mexec-model=reactor
        -Wl,--export=malloc -Wl,--export=free
        -Wl,-z,stack-size=8388608 -Wl,--initial-memory=33554432 -Wl,--max-memory=2147483648)
      target_link_libraries(${name} PRIVATE LLVMCore LLVMWebAssemblyCodeGen LLVMWebAssemblyAsmParser LLVMWebAssemblyDisassembler LLVMMCDisassembler LLVMPasses)
      set_target_properties(${name} PROPERTIES OUTPUT_NAME ${output} SUFFIX .wasm)
    endfunction()
    tower_llvm_reactor(tower-browser-llvm tower-llvm)
    target_compile_definitions(tower-browser-llvm PRIVATE TOWER_LLVM_WASM_ONLY=1)
    if(TOWER_BROWSER_CROSS)
      tower_llvm_reactor(tower-browser-cross tower-cross)
      target_compile_definitions(tower-browser-cross PRIVATE TOWER_BROWSER_CROSS=1)
      target_link_libraries(tower-browser-cross PRIVATE LLVMX86CodeGen LLVMAArch64CodeGen LLVMX86Disassembler LLVMAArch64Disassembler LLVMMCDisassembler)
    endif()
  endif()
  cmake_language(DEFER CALL tower_wasi_linker)
  return()
endif()

option(TOWER_PARSER_ONLY "Build native parser tests without LLVM or WASI" OFF)
if(TOWER_PARSER_ONLY)
  tower_compiler_utilities()
  tower_compiler_parser_nodes()
  target_compile_definitions(tower-compiler-memory PRIVATE TOWER_COMPILER_MEMORY_TESTS=1)
  tower_compiler_interpreter()
  add_executable(tower-parser-tests)
  set_target_properties(tower-parser-tests PROPERTIES LINKER_LANGUAGE CXX)
  if(CMAKE_CXX_COMPILER_TARGET MATCHES "^wasm")
    target_compile_options(tower-parser-tests PRIVATE "-ffile-prefix-map=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding=source")
  endif()
  include(cmake/TowerParserMain.cmake)
  target_link_libraries(tower-parser-tests PRIVATE tower-compiler-parser-nodes tower-compiler-semantics tower-compiler-entities tower-compiler-utilities tower-compiler-memory)
  if(MSVC)
    string(REPLACE "/EHsc" "" CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS}")
    target_compile_options(tower-parser-tests PRIVATE /utf-8 /UNDEBUG)
    target_compile_definitions(tower-parser-tests PRIVATE _HAS_EXCEPTIONS=0)
  else()
    target_compile_options(tower-parser-tests PRIVATE -UNDEBUG -fno-exceptions)
  endif()
  enable_testing()
  include(cmake/TowerUtilityTests.cmake)
  include(cmake/TowerParserServiceTests.cmake)
  include(cmake/TowerParserFormatTests.cmake)
  include(cmake/TowerSyntaxPayloadTests.cmake)
  include(cmake/TowerReaderTests.cmake)
  tower_syntax_test_runner()
  include(cmake/TowerValidationTests.cmake)
  include(cmake/TowerSyntaxEmissionTests.cmake)
  add_test(NAME tower-parser-tests COMMAND tower-parser-tests)
  add_test(NAME tower-foreach-example COMMAND tower-parser-tests --parse
    "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/examples/foreach.tower")
  set_tests_properties(tower-parser-tests tower-foreach-example PROPERTIES
    WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
  include(cmake/TowerRegexTests.cmake)
  include(cmake/TowerLexiconTests.cmake)
  include(cmake/TowerLRGrammarTests.cmake)
  include(cmake/TowerLRAnalysisTests.cmake)
  include(cmake/TowerInterpreterTests.cmake)
  include(cmake/TowerParserEvaluation.cmake)
  if(CMAKE_CXX_COMPILER_TARGET MATCHES "^wasm")
    cmake_language(DEFER CALL tower_wasi_linker)
  endif()
  return()
endif()

message(FATAL_ERROR "Select TOWER_NATIVE, TOWER_BROWSER or TOWER_PARSER_ONLY. The obsolete constant-return LLVM scaffolding target has been retired.")
