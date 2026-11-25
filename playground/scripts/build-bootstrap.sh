#!/usr/bin/env bash
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
if [ "$#" -gt 2 ] || { [ "$#" -gt 0 ] && [ "$1" != --tools ]; }; then
  printf 'Usage: build-bootstrap.sh [--tools [NAME]]\n' >&2
  exit 2
fi
# An explicit compiler remains useful for predecessor/successor comparisons.
# Otherwise verify and run the checked-in compiler/resources directly.
if [ -n "${TOWER_BOOTSTRAP_COMPILER:-}" ]; then
  test -x "$TOWER_BOOTSTRAP_COMPILER"
  bootstrap="$TOWER_BOOTSTRAP_COMPILER"
else
  (cd "$repo/bootstrap/linux-x64" && sha256sum --check --quiet SHA256SUMS >&2)
  bootstrap="$repo/bootstrap/linux-x64/towerc"
  test -x "$bootstrap"
fi
if [ "${1:-}" = --tools ]; then
  config="${LLVM_CONFIG:-llvm-config-19}"
  compiler_bin="$("$config" --bindir)"
  export PATH="$compiler_bin:$PATH"
  tools="${TOWER_TOOLS_BUILD:-$HOME/.cache/tower/tools}"
  cmake -S "$repo" -B "$tools" -G Ninja -DTOWER_TOOLS_ONLY=ON \
    -DTOWER_BOOTSTRAP_COMPILER="$bootstrap" -DTOWER_TOOL="${2:-}" -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_C_COMPILER="$compiler_bin/clang" -DCMAKE_CXX_COMPILER="$compiler_bin/clang++" >&2
  cmake --build "$tools" --target tower-tools --parallel "${TOWER_BUILD_JOBS:-2}" >&2
  printf '%s/bin\n' "$tools"
else
  printf '%s\n' "$bootstrap"
fi
