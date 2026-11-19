#!/usr/bin/env bash
# Execute the Tower host policies and interpreter differential suite on wasm32.
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
sdk="${WASI_SDK_PATH:-$HOME/.cache/tower/wasi-sdk/wasi-sdk-34.0-x86_64-linux}"
build="${TOWER_HOST_WASI_TEST_BUILD:-$HOME/.cache/tower/host-wasi-tests}"
bootstrap="$(bash "$repo/playground/scripts/build-bootstrap.sh")"
cmake -S "$repo" -B "$build" -G Ninja \
  -DCMAKE_TOOLCHAIN_FILE="$sdk/share/cmake/wasi-sdk-p1.cmake" \
  -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_FLAGS=-fno-exceptions \
  -DCMAKE_EXE_LINKER_FLAGS=-Wl,-z,stack-size=8388608 \
  -DTOWER_PARSER_ONLY=ON -DTOWER_BOOTSTRAP_COMPILER="$bootstrap"
cmake --build "$build" --target tower-parser-tests tower-interpreter-tests \
  --parallel "${TOWER_BUILD_JOBS:-4}"
node "$repo/scaffolding/tests/interpreter-wasi.mjs" "$build/tower-parser-tests" --host-only
node "$repo/scaffolding/tests/interpreter-wasi.mjs" "$build/tower-interpreter-tests"
