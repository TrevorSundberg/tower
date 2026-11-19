#!/usr/bin/env bash
# Complete Linux validation; also usable directly with the documented tools.
set -euo pipefail
repo="$(cd "$(dirname "$0")" && pwd)"
cd "$repo"
bash playground/scripts/setup-wasi.sh
bash playground/scripts/build-native.sh
bash playground/scripts/test-compiler-distribution.sh
bash playground/scripts/test-native-core.sh
bash playground/scripts/test-bootstrap.sh
bash playground/scripts/test-host-runtime.sh
bash playground/scripts/build-wasm.sh
TOWER_BROWSER_CROSS=ON bash playground/scripts/build-llvm.sh
bash playground/scripts/test-linking.sh
bash playground/scripts/test-target-packs.sh
bash playground/scripts/test-windows-linking.sh
npm ci --prefix playground
TOWER_REQUIRE_BACKENDS=1 npm run build --prefix playground
npm test --prefix playground
bash playground/scripts/test-browser-exports.sh
npm run check:format --prefix playground
(cd playground && npx playwright install chromium && npm run test:browser)
npm run test:deployment --prefix playground
printf 'Linux build and local deployment validation passed. Website: playground/dist/\n'
