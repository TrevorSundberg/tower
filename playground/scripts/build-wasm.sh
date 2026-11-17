#!/usr/bin/env bash
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
sdk="${WASI_SDK_PATH:-$HOME/.cache/tower/wasi-sdk/wasi-sdk-34.0-x86_64-linux}"
if [ ! -x "$sdk/bin/clang++" ]; then
  echo 'Set WASI_SDK_PATH or first run playground/scripts/setup-wasi.sh' >&2
  exit 1
fi
cmake "$@" -S "$repo" -B "$repo/build/browser-wasi" -G Ninja \
  -DCMAKE_TOOLCHAIN_FILE="$sdk/share/cmake/wasi-sdk-p1.cmake" \
  -DCMAKE_BUILD_TYPE=Release -DTOWER_BROWSER=ON
cmake --build "$repo/build/browser-wasi" --parallel 4
