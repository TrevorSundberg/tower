#!/usr/bin/env bash
# Complete Linux validation; also usable directly with the documented tools.
set -euo pipefail
repo="$(cd "$(dirname "$0")" && pwd)"
cd "$repo"
native="${TOWER_NATIVE_BUILD:-$HOME/.cache/tower/native}"
sdk="${WASI_SDK_PATH:-$HOME/.cache/tower/wasi-sdk/wasi-sdk-34.0-x86_64-linux}"
llvm_bin="$("${LLVM_CONFIG:-llvm-config-19}" --bindir)"
llvm_lib="$("${LLVM_CONFIG:-llvm-config-19}" --libdir)"
bash playground/scripts/setup-wasi.sh
bash playground/scripts/build-native.sh -DTOWER_DRIVER_TESTS=ON -DTOWER_FORMAT_TESTS=ON
cmake --build "$native" --target tower-driver-tests tower-format-tests --parallel "${TOWER_BUILD_JOBS:-2}"
ctest --test-dir "$native" -R '^(tower-format|tower-driver-formatting)$' --output-on-failure
tools="$(bash playground/scripts/build-bootstrap.sh --tools verify_compiler)"
"$tools/verify_compiler" --development-package "$repo/build/native/towerc" "$repo/scaffolding/tests" "$repo/build/distribution"
bootstrap="$(bash playground/scripts/build-bootstrap.sh)"
core_tools="$(bash playground/scripts/build-bootstrap.sh --tools check_core)"
"$core_tools/check_core" native "$repo" "${TOWER_CORE_TEST_BUILD:-$HOME/.cache/tower/core}" "$bootstrap"
"$core_tools/check_core" wasi "$repo" "${TOWER_HOST_WASI_TEST_BUILD:-$HOME/.cache/tower/host-wasi-tests}" "$bootstrap" "$sdk"
tools="$(bash playground/scripts/build-bootstrap.sh --tools verify_bootstrap_symbols)"
"$tools/verify_bootstrap_symbols" --compare "$bootstrap" "$native/towerc" "$repo/scaffolding" "$native" "$llvm_bin/llvm-nm" "$repo/build/bootstrap-check"
bash playground/scripts/build-wasm.sh -DTOWER_IDE_TESTS=ON
npm ci --prefix playground
npm run test:ide --prefix playground
# The compiler project and the static site both consume build/browser-wasi.
bash playground/scripts/build-wasm.sh -DTOWER_IDE_TESTS=OFF
TOWER_WORK_TESTS=ON bash playground/scripts/build-threads.sh
TOWER_BROWSER_CROSS=ON bash playground/scripts/build-llvm.sh
(cd build/linking && "$native/tower-driver-tests" --linking "$native/towerc" "$repo/scaffolding" \
  "$llvm_bin/clang" "$llvm_bin/llvm-ar" "$sdk/bin/wasm-ld" "$repo/build/linking/wasm-fixture.a" "$llvm_lib/libLLVM.so")
tools="$(bash playground/scripts/build-bootstrap.sh --tools package_targets)"
"$tools/package_targets" "$repo/build/native/share/tower" "$repo/scaffolding/targets" "$llvm_bin/clang" "$repo/build/targets"
mkdir -p build/target-checks
(cd build/target-checks && "$native/tower-driver-tests" --target-packs "$native/towerc" "$repo/scaffolding" "$llvm_bin" "$repo/build/targets")
(cd build/linking && "$native/tower-driver-tests" --windows-linking "$native/towerc" "$repo/scaffolding" \
  "$llvm_bin/clang" "$llvm_bin/llvm-ar" "$llvm_bin/lld-link" "${TOWER_KERNEL32:-$repo/build/targets/kernel32.lib}")
TOWER_REQUIRE_THREADS=1 TOWER_REQUIRE_BACKENDS=1 npm run build --prefix playground
TOWER_REQUIRE_THREADS=1 npm run test:node --prefix playground
(cd build/cross && "$native/tower-driver-tests" --browser-exports "$(command -v qemu-aarch64 || true)")
(cd playground && npx playwright install chromium && npm run test:browser)
npm run test:deployment --prefix playground
printf 'Linux build and local deployment validation passed. Website: playground/dist/\n'
