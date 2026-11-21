#!/usr/bin/env bash
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
if [ "$#" -gt 1 ] || { [ "$#" -eq 1 ] && [ "$1" != --tools ]; }; then
  printf 'Usage: build-bootstrap.sh [--tools]\n' >&2
  exit 2
fi
# An explicit compiler remains useful for predecessor/successor comparisons.
# Otherwise install the checked-in, hash-pinned development bootstrap.
if [ -n "${TOWER_BOOTSTRAP_COMPILER:-}" ]; then
  test -x "$TOWER_BOOTSTRAP_COMPILER"
  bootstrap="$TOWER_BOOTSTRAP_COMPILER"
else
  bootstrap="$(python3 "$repo/bootstrap/install.py")"
fi
if [ "${1:-}" = --tools ]; then
  config="${LLVM_CONFIG:-llvm-config-19}"
  compiler_bin="$("$config" --bindir)"
  export PATH="$compiler_bin:$PATH"
  tools="${TOWER_TOOLS_BUILD:-$HOME/.cache/tower/tools}"
  cmake -S "$repo" -B "$tools" -G Ninja -DTOWER_TOOLS_ONLY=ON \
    -DTOWER_BOOTSTRAP_COMPILER="$bootstrap" -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_C_COMPILER="$compiler_bin/clang" -DCMAKE_CXX_COMPILER="$compiler_bin/clang++" >&2
  cmake --build "$tools" --target tower-tools --parallel "${TOWER_BUILD_JOBS:-2}" >&2
  printf '%s/bin\n' "$tools"
else
  printf '%s\n' "$bootstrap"
fi
