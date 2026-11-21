#!/usr/bin/env bash
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
sdk="${WASI_SDK_PATH:-$HOME/.cache/tower/wasi-sdk/wasi-sdk-34.0-x86_64-linux}"
bootstrap="$(bash "$repo/playground/scripts/build-bootstrap.sh")"
revision="$(git -C "$repo/third_party/llvm-project" rev-parse HEAD)"
source="${TOWER_LLVM_SOURCE_DIR:-$(bash "$repo/playground/scripts/cache-llvm-source.sh")}"
tools="$(TOWER_BOOTSTRAP_COMPILER="$bootstrap" bash "$repo/playground/scripts/build-bootstrap.sh" --tools)"
"$tools/prepare_lld_compat" "$source"
# Native tablegen must be built with the same LLVM source revision. Keep the
# large intermediate builds on the Linux filesystem when called through WSL.
host="${TOWER_LLVM_HOST_BUILD:-$HOME/.cache/tower/llvm-tablegen-$revision}"
cross="${TOWER_LLVM_WASM_BUILD:-$HOME/.cache/tower/llvm-wasi-$revision}"
# Windows Git checkouts may use CRLF. These upstream shell scripts must have LF
# for sh under WSL. Restore their exact original bytes when this build exits.
backup="$(mktemp -d)"
restore_scripts() {
  python3 - "$source/llvm/cmake" "$backup" <<'PY'
import pathlib, sys
directory, backup = map(pathlib.Path, sys.argv[1:])
for saved in backup.iterdir():
    path, original = directory / saved.name, saved.read_bytes()
    if path.read_bytes() == original.replace(b'\r\n', b'\n'):
        path.write_bytes(original)
    saved.unlink()
backup.rmdir()
PY
}
trap restore_scripts EXIT
python3 - "$source/llvm/cmake" "$backup" <<'PY'
import pathlib, sys
directory, backup = map(pathlib.Path, sys.argv[1:])
for name in ['config.guess', 'config.sub']:
    path = directory / name
    if path.exists():
        data = path.read_bytes()
        (backup / name).write_bytes(data)
        if b'\r\n' in data:
            path.write_bytes(data.replace(b'\r\n', b'\n'))
PY
if [ ! -f "$host/build.ninja" ]; then
  cmake -S "$source/llvm" -B "$host" -G Ninja \
  -DCMAKE_BUILD_TYPE=Release -DCMAKE_C_COMPILER=clang -DCMAKE_CXX_COMPILER=clang++ \
  -DLLVM_HOST_TRIPLE="$(clang -dumpmachine)" \
  -DLLVM_TARGETS_TO_BUILD=WebAssembly -DLLVM_INCLUDE_TESTS=OFF \
  -DLLVM_INCLUDE_BENCHMARKS=OFF -DLLVM_INCLUDE_EXAMPLES=OFF -DLLVM_ENABLE_ZSTD=OFF
fi
cmake --build "$host" --target llvm-tblgen --parallel "${TOWER_BUILD_JOBS:-6}"
cmake -S "$repo" -B "$cross" -G Ninja \
  -DCMAKE_PROJECT_scaffolding_INCLUDE="$repo/cmake/TowerBackend.cmake" \
  -DCMAKE_TOOLCHAIN_FILE="$sdk/share/cmake/wasi-sdk-p1.cmake" \
  -DCMAKE_BUILD_TYPE=Release -DTOWER_BROWSER=ON -DTOWER_BROWSER_LLVM=ON \
  -DTOWER_BOOTSTRAP_COMPILER="$bootstrap" \
  -DLLVM_ENABLE_ASSERTIONS=OFF \
  -DTOWER_BROWSER_CROSS="${TOWER_BROWSER_CROSS:-OFF}" \
  -DTOWER_LLVM_SOURCE_DIR="$source" \
  -DLLVM_TABLEGEN="$host/bin/llvm-tblgen" -DLLVM_NATIVE_TOOL_DIR="$host/bin"
targets=(tower-browser-llvm)
if [ "${TOWER_BROWSER_CROSS:-OFF}" = ON ]; then targets+=(tower-browser-cross); fi
cmake --build "$cross" --target "${targets[@]}" --parallel "${TOWER_BUILD_JOBS:-6}"
mkdir -p "$repo/build/browser-wasi-llvm"
cp "$cross/tower-llvm.wasm" "$repo/build/browser-wasi-llvm/tower-llvm.wasm"
"$sdk/bin/llvm-strip" "$repo/build/browser-wasi-llvm/tower-llvm.wasm"
if [ "${TOWER_BROWSER_CROSS:-OFF}" = ON ]; then
  cp "$cross/tower-cross.wasm" "$repo/build/browser-wasi-llvm/tower-cross.wasm"
  "$sdk/bin/llvm-strip" "$repo/build/browser-wasi-llvm/tower-cross.wasm"
  python3 "$repo/playground/scripts/package-compiler-project.py" \
    --parser-build "$repo/build/browser-wasi" --llvm-build "$cross"
fi
