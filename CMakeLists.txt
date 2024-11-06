cmake_minimum_required(VERSION 3.20)

project(scaffolding LANGUAGES C CXX VERSION 1)

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
  scaffolding/wasm-exceptions.cpp)

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

target_link_options(scaffolding PRIVATE -mexec-model=reactor)
