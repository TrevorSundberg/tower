#!/usr/bin/env bash
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
config="${LLVM_CONFIG:-llvm-config-19}"
native="${TOWER_NATIVE_BUILD:-$HOME/.cache/tower/native}"
cmake -S "$repo" -B "$native" -G Ninja -DTOWER_NATIVE=ON \
  -DLLVM_DIR="$("$config" --cmakedir)" -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_COMPILER=clang++
cmake --build "$native" --parallel "${TOWER_BUILD_JOBS:-4}"
mkdir -p "$repo/build/native"
cp "$native/towerc" "$repo/build/native/towerc"
cp "$native/towerc-seed" "$repo/build/native/towerc-seed"
