#!/usr/bin/env bash
# cross-compilation.test.mjs emits these through the browser's WASM compiler.
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
out="$repo/build/cross"
printf '5\n84\n42\n8\n41\n42\n' > "$out/expected.txt"
printf '42\n' > "$out/library-expected.txt"
for prefix in '' library-; do
  chmod +x "$out/${prefix}linux.elf" "$out/${prefix}linux-arm.elf"
  "$out/${prefix}linux.elf" > "$out/${prefix}linux-output.txt"
  diff -u "$out/${prefix}expected.txt" "$out/${prefix}linux-output.txt"
  if command -v qemu-aarch64 >/dev/null 2>&1; then
    qemu-aarch64 "$out/${prefix}linux-arm.elf" > "$out/${prefix}linux-arm-output.txt"
    diff -u "$out/${prefix}expected.txt" "$out/${prefix}linux-arm-output.txt"
  else
    echo 'SKIP browser-exported ARM64 execution: install qemu-user.' >&2
  fi
done
echo 'Browser-exported Linux executables and linked libraries execute correctly.'
