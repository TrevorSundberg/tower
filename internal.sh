#!/bin/bash
set -ex

rm -rf third_party/llvm-project/llvm/build
mkdir -p third_party/llvm-project/llvm/build
pushd third_party/llvm-project/llvm/build
cmake -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_COMPILER_LAUNCHER=ccache -DCMAKE_C_COMPILER=/usr/bin/clang -DCMAKE_CXX_COMPILER=/usr/bin/clang++ ..
cmake --build . --parallel
popd

rm -rf build
mkdir -p build
cd build

cmake -G Ninja -DCMAKE_BUILD_TYPE=Debug -DCMAKE_CXX_COMPILER_LAUNCHER=ccache -DCMAKE_TOOLCHAIN_FILE=/opt/wasi-sdk/share/cmake/wasi-sdk-pthread.cmake ..
cmake --build . --parallel
