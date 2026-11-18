#!/usr/bin/env bash
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
# An explicitly supplied compiler can be a later Tower-built bootstrap binary.
if [ -n "${TOWER_BOOTSTRAP_COMPILER:-}" ]; then
  test -x "$TOWER_BOOTSTRAP_COMPILER"
  printf '%s\n' "$TOWER_BOOTSTRAP_COMPILER"
  exit 0
fi
config="${LLVM_CONFIG:-llvm-config-19}"
native="${TOWER_NATIVE_BUILD:-$HOME/.cache/tower/native}"
cmake -S "$repo" -B "$native" -G Ninja -DTOWER_NATIVE=ON \
  -DLLVM_DIR="$("$config" --cmakedir)" -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_COMPILER=clang++ >&2
cmake --build "$native" --target towerc-stage1 --parallel "${TOWER_BUILD_JOBS:-4}" >&2
printf '%s\n' "$native/towerc-stage1"
