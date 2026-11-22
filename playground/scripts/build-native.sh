#!/usr/bin/env bash
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
bootstrap="$(bash "$repo/playground/scripts/build-bootstrap.sh")"
config="${LLVM_CONFIG:-llvm-config-19}"
# Use the matching Clang to consume LLVM IR produced by this compiler. The
# system's unversioned clang may be older than the selected LLVM installation.
compiler_bin="$("$config" --bindir)"
export PATH="$compiler_bin:$PATH"
native="${TOWER_NATIVE_BUILD:-$HOME/.cache/tower/native}"
cmake "$@" -S "$repo" -B "$native" -G Ninja -DTOWER_NATIVE=ON -DTOWER_BOOTSTRAP_COMPILER="$bootstrap" \
  -DCMAKE_PROJECT_scaffolding_INCLUDE="$repo/cmake/TowerBackend.cmake" \
  -DLLVM_DIR="$("$config" --cmakedir)" -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_C_COMPILER="$compiler_bin/clang" -DCMAKE_CXX_COMPILER="$compiler_bin/clang++"
cmake --build "$native" --target towerc --parallel "${TOWER_BUILD_JOBS:-4}"
mkdir -p "$repo/build/native"
cp "$native/towerc" "$repo/build/native/towerc"
cp -R "$native/share" "$repo/build/native/"
