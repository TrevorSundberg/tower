#!/usr/bin/env bash
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
build="${TOWER_CORE_TEST_BUILD:-$HOME/.cache/tower/core-asan}"
bootstrap="$(bash "$repo/playground/scripts/build-bootstrap.sh")"
cmake -S "$repo" -B "$build" -G Ninja -DTOWER_PARSER_ONLY=ON -DCMAKE_BUILD_TYPE=RelWithDebInfo \
  -DTOWER_BOOTSTRAP_COMPILER="$bootstrap" \
  -DCMAKE_CXX_COMPILER=clang++ -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined -fno-omit-frame-pointer"
cmake --build "$build" --parallel "${TOWER_BUILD_JOBS:-4}"
ctest --test-dir "$build" --output-on-failure
