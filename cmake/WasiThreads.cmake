# wasi-sdk 34 ships the current wasip1-threads sysroot but its legacy pthread
# CMake file still selects wasm32-wasi-threads. Use the installed p1 platform
# setup with the actual SDK target and shared-memory link contract.
if(NOT WASI_SDK_PREFIX)
  set(WASI_SDK_PREFIX "$ENV{WASI_SDK_PATH}")
endif()
list(APPEND CMAKE_TRY_COMPILE_PLATFORM_VARIABLES WASI_SDK_PREFIX)
include("${WASI_SDK_PREFIX}/share/cmake/wasi-sdk-p1.cmake")
set(CMAKE_C_COMPILER_TARGET wasm32-wasip1-threads)
set(CMAKE_CXX_COMPILER_TARGET wasm32-wasip1-threads)
set(CMAKE_ASM_COMPILER_TARGET wasm32-wasip1-threads)
set(CMAKE_C_FLAGS_INIT "-pthread")
set(CMAKE_CXX_FLAGS_INIT "-pthread")
set(CMAKE_EXE_LINKER_FLAGS_INIT "-Wl,--import-memory,--export-memory")
