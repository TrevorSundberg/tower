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
bash playground/scripts/build-native.sh -DTOWER_DRIVER_TESTS=ON
cmake --build "$native" --target tower-driver-tests --parallel "${TOWER_BUILD_JOBS:-2}"
tools="$(bash playground/scripts/build-bootstrap.sh --tools verify_compiler)"
"$tools/verify_compiler" --development-package "$repo/build/native/towerc" "$repo/scaffolding/tests" "$repo/build/distribution"
bash playground/scripts/test-native-core.sh
bootstrap="$(bash playground/scripts/build-bootstrap.sh)"
tools="$(bash playground/scripts/build-bootstrap.sh --tools verify_bootstrap_symbols)"
"$tools/verify_bootstrap_symbols" --compare "$bootstrap" "$native/towerc" "$repo/scaffolding" "$native" "$llvm_bin/llvm-nm" "$repo/build/bootstrap-check"
bash playground/scripts/test-host-runtime.sh
bash playground/scripts/build-wasm.sh
TOWER_BROWSER_CROSS=ON bash playground/scripts/build-llvm.sh
(cd build/linking && "$native/tower-driver-tests" --linking "$native/towerc" "$repo/scaffolding" \
  "$llvm_bin/clang" "$llvm_bin/llvm-ar" "$sdk/bin/wasm-ld" "$repo/build/linking/wasm-fixture.a" "$llvm_lib/libLLVM.so")
tools="$(bash playground/scripts/build-bootstrap.sh --tools package_targets)"
"$tools/package_targets" "$repo/build/native/share/tower" "$repo/scaffolding/targets" "$llvm_bin/clang" "$repo/build/targets"
mkdir -p build/target-checks
(cd build/target-checks && "$native/tower-driver-tests" --target-packs "$native/towerc" "$repo/scaffolding" "$llvm_bin" "$repo/build/targets")
(cd build/linking && "$native/tower-driver-tests" --windows-linking "$native/towerc" "$repo/scaffolding" \
  "$llvm_bin/clang" "$llvm_bin/llvm-ar" "$llvm_bin/lld-link" "${TOWER_KERNEL32:-$repo/build/targets/kernel32.lib}")
npm ci --prefix playground
TOWER_REQUIRE_BACKENDS=1 npm run build --prefix playground
npm test --prefix playground
(cd build/cross && "$native/tower-driver-tests" --browser-exports "$(command -v qemu-aarch64 || true)")
npm run check:format --prefix playground
(cd playground && npx playwright install chromium && npm run test:browser)
npm run test:deployment --prefix playground
printf 'Linux build and local deployment validation passed. Website: playground/dist/\n'
