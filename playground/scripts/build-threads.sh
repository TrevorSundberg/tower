#!/usr/bin/env bash
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
sdk="${WASI_SDK_PATH:-$HOME/.cache/tower/wasi-sdk/wasi-sdk-34.0-x86_64-linux}"
bootstrap="$(bash "$repo/playground/scripts/build-bootstrap.sh")"
cmake "$@" -S "$repo" -B "$repo/build/browser-wasi-threads" -G Ninja \
  -DCMAKE_TOOLCHAIN_FILE="$repo/cmake/WasiThreads.cmake" \
  -DWASI_SDK_PREFIX="$sdk" -DCMAKE_BUILD_TYPE=Release \
  -DTOWER_BROWSER=ON -DTOWER_BROWSER_THREADS=ON \
  -DTOWER_WORK_TESTS="${TOWER_WORK_TESTS:-ON}" \
  -DTOWER_BOOTSTRAP_COMPILER="$bootstrap"
cmake --build "$repo/build/browser-wasi-threads" --parallel "${TOWER_BUILD_JOBS:-4}"
