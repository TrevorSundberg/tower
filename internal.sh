#!/bin/bash
#rm -rf build
#mkdir build
cd build

#cmake -DCMAKE_TOOLCHAIN_FILE=/opt/wasi-sdk/share/cmake/wasi-sdk-pthread.cmake -DCMAKE_BUILD_TYPE=Debug ..
make -j 12

