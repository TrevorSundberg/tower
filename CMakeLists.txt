cmake_minimum_required(VERSION 3.20)

project(scaffolding LANGUAGES C CXX VERSION 1)

# Disable gtest requirement
option(BUILD_TESTS "" OFF)
option(BUILD_TOOLS "" OFF)
option(BUILD_STATIC_LIB "" ON)
add_subdirectory(third_party/binaryen)

add_executable(scaffolding
  scaffolding/main.cpp
  scaffolding/tower.cpp
  scaffolding/parser.cpp
  scaffolding/wasm-exceptions.cpp)

target_include_directories(scaffolding PRIVATE third_party/binaryen/src)
target_link_libraries(scaffolding PRIVATE binaryen)

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fstack-protector-all -fno-optimize-sibling-calls -fno-omit-frame-pointer")
set(  CMAKE_C_FLAGS   "${CMAKE_C_FLAGS} -fstack-protector-all -fno-optimize-sibling-calls -fno-omit-frame-pointer")

string(REPLACE "-Wl,--import-memory" "" CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS}")
set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -Wl,--initial-memory=134217728")

target_link_options(scaffolding PRIVATE -mexec-model=reactor)
