cmake_minimum_required(VERSION 3.20)

project(scaffolding LANGUAGES C CXX VERSION 1)
include(cmake/TowerCompilerUtilities.cmake)

option(TOWER_NATIVE "Build Tower's native compiler/linker driver against an installed LLVM" OFF)
if(TOWER_NATIVE)
  find_package(LLVM REQUIRED CONFIG)
  add_library(tower-native-compiler OBJECT scaffolding/driver.cpp scaffolding/llvm-engine.cpp
    scaffolding/core.cpp scaffolding/core-nodes.cpp scaffolding/core-machine.cpp
    scaffolding/tests/nodes.cpp scaffolding/parser.cpp scaffolding/parser-tree-tests.cpp
    scaffolding/syntax.cpp scaffolding/compiler-syntax.cpp scaffolding/syntax-nodes.cpp scaffolding/bedrock.cpp
    scaffolding/format.cpp scaffolding/lex-pattern-common.cpp scaffolding/syntax-tests.cpp)
  target_include_directories(tower-native-compiler PRIVATE ${LLVM_INCLUDE_DIRS})
  target_compile_features(tower-native-compiler PRIVATE cxx_std_20)
  target_compile_definitions(tower-native-compiler PRIVATE TOWER_SOURCE_DIR="${CMAKE_CURRENT_SOURCE_DIR}")
  target_compile_options(tower-native-compiler PRIVATE -fno-exceptions)
  add_executable(towerc-seed $<TARGET_OBJECTS:tower-native-compiler> scaffolding/bootstrap/utf8-seed.cpp scaffolding/bootstrap/bytes-seed.cpp scaffolding/bootstrap/nodes-seed.cpp scaffolding/bootstrap/parse-tree-seed.cpp scaffolding/bootstrap/generics-seed.cpp scaffolding/bootstrap/parser-nodes-seed.cpp)
  target_compile_features(towerc-seed PRIVATE cxx_std_20)
  target_sources(towerc-seed PRIVATE scaffolding/bootstrap/foundation-nodes-seed.cpp)
  target_sources(towerc-seed PRIVATE scaffolding/bootstrap/syntax-lexer-seed.cpp)
  target_sources(towerc-seed PRIVATE scaffolding/bootstrap/lr-analysis-seed.cpp scaffolding/bootstrap/lr-grammar-seed.cpp scaffolding/bootstrap/lexer-table-seed.cpp scaffolding/bootstrap/lex-pattern-seed.cpp)
  target_link_libraries(towerc-seed PRIVATE LLVM tower-compiler-memory)
  tower_compiler_utilities()
  # The seed builds the Tower specializer; this stage can then build generic
  # compiler components. Keep the dependency graph acyclic from a clean checkout.
  add_executable(towerc-stage1 $<TARGET_OBJECTS:tower-native-compiler> scaffolding/tower.cpp scaffolding/bootstrap/parser-nodes-seed.cpp)
  target_compile_features(towerc-stage1 PRIVATE cxx_std_20)
  target_sources(towerc-stage1 PRIVATE scaffolding/bootstrap/foundation-nodes-seed.cpp)
  target_sources(towerc-stage1 PRIVATE scaffolding/bootstrap/syntax-lexer-seed.cpp)
  target_sources(towerc-stage1 PRIVATE scaffolding/bootstrap/lr-analysis-seed.cpp scaffolding/bootstrap/lr-grammar-seed.cpp scaffolding/bootstrap/lexer-table-seed.cpp scaffolding/bootstrap/lex-pattern-seed.cpp)
  target_link_libraries(towerc-stage1 PRIVATE tower-compiler-entities tower-compiler-utilities tower-compiler-memory LLVM)
  tower_compiler_parser_nodes()
  add_executable(towerc $<TARGET_OBJECTS:tower-native-compiler> scaffolding/tower.cpp scaffolding/lex-pattern.cpp)
  target_compile_features(towerc PRIVATE cxx_std_20)
  target_link_libraries(towerc PRIVATE tower-compiler-parser-nodes tower-compiler-entities tower-compiler-utilities tower-compiler-memory)
  target_link_libraries(towerc PRIVATE LLVM)
  return()
endif()

option(TOWER_BROWSER "Build the static playground's WASI reactor" OFF)
option(TOWER_BROWSER_LLVM "Also build the LLVM compiler experiment as a separate reactor" OFF)
option(TOWER_BROWSER_CROSS "Include CPU backends and native linkers in a separate browser compiler" OFF)
if(TOWER_BROWSER)
  tower_compiler_utilities()
  tower_compiler_parser_nodes()
  add_executable(tower-browser scaffolding/browser.cpp
    scaffolding/core.cpp scaffolding/core-nodes.cpp scaffolding/core-machine.cpp
    scaffolding/tower.cpp scaffolding/tests/nodes.cpp scaffolding/parser.cpp scaffolding/parser-tree-tests.cpp
    scaffolding/syntax.cpp scaffolding/compiler-syntax.cpp scaffolding/syntax-nodes.cpp scaffolding/bedrock.cpp scaffolding/format.cpp scaffolding/lex-pattern.cpp scaffolding/lex-pattern-common.cpp scaffolding/syntax-tests.cpp)
  target_compile_features(tower-browser PRIVATE cxx_std_20)
  target_link_libraries(tower-browser PRIVATE tower-compiler-parser-nodes tower-compiler-entities tower-compiler-utilities tower-compiler-memory)
  target_compile_options(tower-browser PRIVATE -fno-exceptions -UNDEBUG)
  target_link_options(tower-browser PRIVATE -mexec-model=reactor
    -Wl,-z,stack-size=2097152 -Wl,--initial-memory=8388608 -Wl,--max-memory=268435456)
  set_target_properties(tower-browser PROPERTIES OUTPUT_NAME tower SUFFIX .wasm)
  if(TOWER_BROWSER_LLVM)
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
    set(LLVM_ENABLE_PROJECTS lld CACHE STRING "" FORCE)
    set(LLD_BUILD_TOOLS OFF CACHE BOOL "" FORCE)
    set(LLVM_BUILD_TOOLS OFF CACHE BOOL "" FORCE)
    set(LLVM_INCLUDE_UTILS OFF CACHE BOOL "" FORCE)
    set(LLVM_ENABLE_PIC OFF CACHE BOOL "" FORCE)
    set(LLVM_BUILD_LLVM_DYLIB OFF CACHE BOOL "" FORCE)
    # This checkout's WASI support predates the SDK's uppercase platform name.
    set(tower_sdk_system_name "${CMAKE_SYSTEM_NAME}")
    set(CMAKE_SYSTEM_NAME Wasi)
    add_subdirectory(${TOWER_LLVM_SOURCE_DIR}/llvm third_party/llvm-project/llvm)
    set(CMAKE_SYSTEM_NAME "${tower_sdk_system_name}")
    set(tower_llvm_sources scaffolding/main.cpp
      scaffolding/llvm-backend.cpp scaffolding/llvm-engine.cpp scaffolding/llvm-wasi.cpp scaffolding/core.cpp scaffolding/core-nodes.cpp
      scaffolding/tower.cpp scaffolding/tests/nodes.cpp scaffolding/parser.cpp scaffolding/parser-tree-tests.cpp
      scaffolding/syntax.cpp scaffolding/compiler-syntax.cpp scaffolding/syntax-nodes.cpp scaffolding/bedrock.cpp scaffolding/format.cpp scaffolding/lex-pattern.cpp scaffolding/lex-pattern-common.cpp scaffolding/syntax-tests.cpp)
    get_filename_component(tower_sdk_bin "${CMAKE_C_COMPILER}" DIRECTORY)
    add_custom_command(OUTPUT "${CMAKE_CURRENT_BINARY_DIR}/tower-runtime.inc"
      COMMAND "${CMAKE_C_COMPILER}" --target=wasm32-unknown-unknown -O2 -ffreestanding -fno-builtin
        -c "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/runtime.c" -o "${CMAKE_CURRENT_BINARY_DIR}/tower-runtime.o"
      COMMAND python3 "${CMAKE_CURRENT_SOURCE_DIR}/playground/scripts/embed-object.py"
        "${CMAKE_CURRENT_BINARY_DIR}/tower-runtime.o" "${CMAKE_CURRENT_BINARY_DIR}/tower-runtime.inc"
      DEPENDS scaffolding/runtime.c playground/scripts/embed-object.py)
    function(tower_llvm_reactor name output)
      add_executable(${name} ${tower_llvm_sources} "${CMAKE_CURRENT_BINARY_DIR}/tower-runtime.inc")
      target_include_directories(${name} PRIVATE ${TOWER_LLVM_SOURCE_DIR}/lld/include
        ${TOWER_LLVM_SOURCE_DIR}/llvm/include ${CMAKE_CURRENT_BINARY_DIR}/third_party/llvm-project/llvm/include
        "${CMAKE_CURRENT_BINARY_DIR}")
      target_compile_features(${name} PRIVATE cxx_std_20)
      target_link_libraries(${name} PRIVATE tower-compiler-parser-nodes tower-compiler-entities tower-compiler-utilities tower-compiler-memory)
      target_compile_options(${name} PRIVATE -fno-exceptions -UNDEBUG)
      target_link_options(${name} PRIVATE -mexec-model=reactor
        -Wl,--export=malloc -Wl,--export=free
        -Wl,-z,stack-size=8388608 -Wl,--initial-memory=33554432 -Wl,--max-memory=536870912)
      target_link_libraries(${name} PRIVATE LLVMCore LLVMWebAssemblyCodeGen LLVMWebAssemblyAsmParser LLVMWebAssemblyDisassembler LLVMMCDisassembler LLVMPasses lldWasm)
      set_target_properties(${name} PROPERTIES OUTPUT_NAME ${output} SUFFIX .wasm)
    endfunction()
    tower_llvm_reactor(tower-browser-llvm tower-llvm)
    target_compile_definitions(tower-browser-llvm PRIVATE TOWER_LLVM_WASM_ONLY=1)
    if(TOWER_BROWSER_CROSS)
      tower_llvm_reactor(tower-browser-cross tower-cross)
      target_compile_definitions(tower-browser-cross PRIVATE TOWER_BROWSER_CROSS=1)
      target_link_libraries(tower-browser-cross PRIVATE LLVMX86CodeGen LLVMAArch64CodeGen LLVMX86Disassembler LLVMAArch64Disassembler LLVMMCDisassembler lldELF lldCOFF lldMachO)
    endif()
  endif()
  return()
endif()

option(TOWER_PARSER_ONLY "Build native parser tests without LLVM or WASI" OFF)
if(TOWER_PARSER_ONLY)
  tower_compiler_utilities()
  tower_compiler_parser_nodes()
  target_compile_definitions(tower-compiler-memory PRIVATE TOWER_COMPILER_MEMORY_TESTS=1)
  add_executable(tower-parser-tests scaffolding/tests/main.cpp
    scaffolding/tests/compiler-storage.cpp scaffolding/tests/entities.cpp scaffolding/tests/lexer-table.cpp scaffolding/tests/regex.cpp scaffolding/tests/lr-analysis.cpp scaffolding/tests/lr-grammar.cpp scaffolding/tests/syntax-lexer.cpp
    scaffolding/core.cpp scaffolding/core-nodes.cpp scaffolding/core-machine.cpp scaffolding/core-tests.cpp
    scaffolding/tower.cpp scaffolding/tests/nodes.cpp scaffolding/parser.cpp scaffolding/parser-tree-tests.cpp
    scaffolding/syntax.cpp scaffolding/compiler-syntax.cpp scaffolding/syntax-nodes.cpp scaffolding/bedrock.cpp scaffolding/format.cpp scaffolding/lex-pattern.cpp scaffolding/lex-pattern-common.cpp scaffolding/syntax-tests.cpp)
  target_compile_features(tower-parser-tests PRIVATE cxx_std_20)
  target_link_libraries(tower-parser-tests PRIVATE tower-compiler-parser-nodes tower-compiler-entities tower-compiler-utilities tower-compiler-memory)
  if(MSVC)
    string(REPLACE "/EHsc" "" CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS}")
    target_compile_options(tower-parser-tests PRIVATE /utf-8 /UNDEBUG)
    target_compile_definitions(tower-parser-tests PRIVATE _HAS_EXCEPTIONS=0)
  else()
    target_compile_options(tower-parser-tests PRIVATE -UNDEBUG -fno-exceptions)
  endif()
  enable_testing()
  add_library(tower-lexer-reference STATIC scaffolding/bootstrap/lexer-table-seed.cpp)
  target_compile_features(tower-lexer-reference PRIVATE cxx_std_20)
  target_compile_definitions(tower-lexer-reference PRIVATE LexerTable=ReferenceLexerTable
    SymbolSequence=ReferenceSymbolSequence symbol_sequence_create=reference_symbol_sequence_create
    symbol_sequence_destroy=reference_symbol_sequence_destroy symbol_sequence_set=reference_symbol_sequence_set
    symbol_sequence_accepts=reference_symbol_sequence_accepts
    lex_table_create=reference_lex_table_create lex_table_destroy=reference_lex_table_destroy
    lex_table_set_alphabet=reference_lex_table_set_alphabet lex_table_append=reference_lex_table_append
    lex_table_match=reference_lex_table_match lex_table_step=reference_lex_table_step lex_table_accepts=reference_lex_table_accepts)
  target_link_libraries(tower-parser-tests PRIVATE tower-lexer-reference)
  add_library(tower-syntax-lexer-reference STATIC scaffolding/bootstrap/syntax-lexer-seed.cpp)
  target_compile_features(tower-syntax-lexer-reference PRIVATE cxx_std_20)
  foreach(name IN ITEMS create destroy token literal start choose skip identifier declaration)
    target_compile_definitions(tower-syntax-lexer-reference PRIVATE lexicon_${name}=reference_lexicon_${name})
  endforeach()
  target_link_libraries(tower-parser-tests PRIVATE tower-syntax-lexer-reference)
  add_library(tower-regex-reference STATIC scaffolding/bootstrap/lex-pattern-seed.cpp)
  target_compile_features(tower-regex-reference PRIVATE cxx_std_20)
  target_compile_definitions(tower-regex-reference PRIVATE lex_pattern_compile=reference_lex_pattern_compile)
  target_link_libraries(tower-parser-tests PRIVATE tower-regex-reference)
  add_library(tower-lr-reference STATIC scaffolding/bootstrap/lr-analysis-seed.cpp scaffolding/bootstrap/lr-grammar-seed.cpp)
  target_compile_features(tower-lr-reference PRIVATE cxx_std_20)
  foreach(name IN ITEMS analysis_create analysis_destroy analysis_compute analysis_failed analysis_nullable
      analysis_first_count analysis_first_data items_create items_destroy items_insert items_count items_data items_close items_goto
      propagation_create propagation_destroy propagation_seed propagation_edge propagation_solve propagation_count propagation_data
      analysis_order states_create states_destroy states_count states_items states_origin states_edge_count states_edges
      states_lalr states_action_count states_actions runtime_create runtime_destroy runtime_conflict runtime_row_count
      runtime_action_count runtime_actions runtime_default runtime_action runtime_goto_count runtime_goto_data runtime_goto
      runtime_specialize runtime_sequence parser_create parser_destroy parser_step parser_commit parser_frame_count parser_frame
      parser_frames parser_sequence_forest parser_consumed parser_shifted parser_work
      probe_create probe_clone probe_destroy probe_reset probe_count probe_frames probe_accepts probe_step
      grammar_create grammar_destroy grammar_rule_count grammar_rule_data grammar_rule_node grammar_generated
      grammar_symbol_count grammar_symbol_data grammar_symbol_node grammar_capture grammar_name_count grammar_name grammar_name_order
      grammar_missing_count grammar_missing_name grammar_resolve grammar_finish
      tree_needs_label tree_shift tree_reduce tree_accept)
    target_compile_definitions(tower-lr-reference PRIVATE lr_${name}=reference_lr_${name})
  endforeach()
  target_link_libraries(tower-parser-tests PRIVATE tower-lr-reference)
  add_library(tower-utf8-reference STATIC scaffolding/bootstrap/utf8-seed.cpp)
  target_compile_definitions(tower-utf8-reference PRIVATE
    tower_utf8_decode=reference_utf8_decode tower_utf8_encode=reference_utf8_encode
    tower_utf8_validate=reference_utf8_validate)
  add_executable(tower-utf8-tests scaffolding/tests/utf8.cpp)
  target_compile_features(tower-utf8-tests PRIVATE cxx_std_20)
  target_link_libraries(tower-utf8-tests PRIVATE tower-compiler-utilities tower-compiler-memory tower-utf8-reference)
  if(MSVC)
    target_compile_options(tower-utf8-tests PRIVATE /UNDEBUG)
  else()
    target_compile_options(tower-utf8-tests PRIVATE -UNDEBUG -fno-exceptions)
  endif()
  add_test(NAME tower-utf8-tests COMMAND tower-utf8-tests)
  add_library(tower-bytes-reference STATIC scaffolding/bootstrap/bytes-seed.cpp)
  target_compile_features(tower-bytes-reference PRIVATE cxx_std_20)
  target_compile_definitions(tower-bytes-reference PRIVATE
    bytes_init=reference_bytes_init bytes_reserve=reference_bytes_reserve
    bytes_append=reference_bytes_append bytes_push=reference_bytes_push
    bytes_assign_text=reference_bytes_assign_text bytes_dispose=reference_bytes_dispose)
  add_executable(tower-bytes-tests scaffolding/tests/bytes.cpp)
  target_compile_features(tower-bytes-tests PRIVATE cxx_std_20)
  target_link_libraries(tower-bytes-tests PRIVATE tower-compiler-utilities tower-bytes-reference)
  if(MSVC)
    target_compile_options(tower-bytes-tests PRIVATE /UNDEBUG)
  else()
    target_compile_options(tower-bytes-tests PRIVATE -UNDEBUG -fno-exceptions)
  endif()
  add_test(NAME tower-bytes-tests COMMAND tower-bytes-tests)
  add_test(NAME tower-parser-tests COMMAND tower-parser-tests)
  add_test(NAME tower-foreach-example COMMAND tower-parser-tests --parse
    "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/examples/foreach.tower")
  set_tests_properties(tower-parser-tests tower-foreach-example PROPERTIES
    WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
  return()
endif()

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fstack-protector-all -fno-optimize-sibling-calls -fno-omit-frame-pointer")
set(  CMAKE_C_FLAGS   "${CMAKE_C_FLAGS} -fstack-protector-all -fno-optimize-sibling-calls -fno-omit-frame-pointer")

string(REPLACE "-Wl,--import-memory" "" CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS}")
set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -Wl,--initial-memory=134217728")

include_directories(third_party/llvm-project/wasi-include)

set(CMAKE_CROSSCOMPILING ON CACHE INTERNAL "")
set(LLVM_LINK_LLVM_DYLIB OFF CACHE INTERNAL "")
set(CAN_BUILD_LLVM_DYLIB OFF CACHE INTERNAL "")
set(LLVM_BUILD_LLVM_DYLIB_VIS OFF CACHE INTERNAL "")
set(LLVM_BUILD_LLVM_DYLIB OFF CACHE INTERNAL "")
set(LLVM_DYLIB_EXPORT_INLINES OFF CACHE INTERNAL "")
set(ARG_DISABLE_LLVM_LINK_LLVM_DYLIB ON CACHE INTERNAL "")
set(LLVM_TARGET_ARCH "wasm32" CACHE INTERNAL "")
set(LLVM_HOST_TRIPLE "wasm32-wasi-thread" CACHE INTERNAL "")
set(LLVM_TARGETS_TO_BUILD "WebAssembly" CACHE INTERNAL "")
set(LLVM_ENABLE_PIC OFF CACHE INTERNAL "")
set(CMAKE_SYSTEM_NAME "Wasi" CACHE INTERNAL "")
set(LLVM_NATIVE_TOOL_DIR "/src/third_party/llvm-project/llvm/build/bin" CACHE PATH "")
set(LLVM_USE_HOST_TOOLS ON CACHE INTERNAL "")
set(LLVM_BUILD_STATIC ON CACHE INTERNAL "")
set(LLVM_ENABLE_PLUGINS OFF CACHE INTERNAL "")
set(LLVM_INCLUDE_TOOLS OFF CACHE INTERNAL "")
set(LLVM_BUILD_TOOLS OFF CACHE INTERNAL "")
set(LLVM_INCLUDE_UTILS OFF CACHE INTERNAL "")
set(LLVM_BUILD_UTILS OFF CACHE INTERNAL "")
set(LLVM_INCLUDE_EXAMPLES OFF CACHE INTERNAL "")
set(LLVM_BUILD_TESTS OFF CACHE INTERNAL "")
set(LLVM_INCLUDE_TESTS OFF CACHE INTERNAL "")
set(LLVM_BUILD_BENCHMARKS OFF CACHE INTERNAL "")
set(LLVM_INCLUDE_BENCHMARKS OFF CACHE INTERNAL "")
add_subdirectory(third_party/llvm-project/llvm)

add_executable(scaffolding
  scaffolding/main.cpp
  scaffolding/tower.cpp
  scaffolding/parser.cpp
  scaffolding/parser-tree-tests.cpp
  scaffolding/syntax.cpp scaffolding/compiler-syntax.cpp scaffolding/syntax-nodes.cpp scaffolding/bedrock.cpp scaffolding/format.cpp
  scaffolding/lex-pattern.cpp scaffolding/lex-pattern-common.cpp
  scaffolding/syntax-tests.cpp)
tower_compiler_utilities()
tower_compiler_parser_nodes()
target_link_libraries(scaffolding PRIVATE tower-compiler-parser-nodes tower-compiler-entities tower-compiler-utilities tower-compiler-memory)

target_compile_features(scaffolding PRIVATE cxx_std_20)
target_compile_options(scaffolding PRIVATE -fno-exceptions)

# Disable gtest requirement
#option(BUILD_TESTS "" OFF)
#option(BUILD_TOOLS "" OFF)
#option(BUILD_STATIC_LIB "" ON)
#add_subdirectory(third_party/binaryen)
#target_include_directories(scaffolding PRIVATE third_party/binaryen/src)
#target_link_libraries(scaffolding PRIVATE binaryen)

target_include_directories(scaffolding PRIVATE third_party/llvm-project/llvm/include build/third_party/llvm-project/llvm/include)
target_link_libraries(scaffolding PRIVATE
  LLVMSupport
  LLVMCore
  LLVMMCJIT
  LLVMBitWriter
  LLVMWebAssemblyInfo
  LLVMWebAssemblyCodeGen
  LLVMWebAssemblyDesc
  LLVMWebAssemblyAsmParser
  LLVMWebAssemblyDisassembler
)

target_link_options(scaffolding PRIVATE -mexec-model=reactor -Wl,--export=malloc -Wl,--export=free)
