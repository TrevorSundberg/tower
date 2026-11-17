#!/usr/bin/env bash
# Validate startup/runtime packs independently of the browser compiler build.
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
out="$repo/build/target-checks"
compiler="${TOWER_NATIVE_BUILD:-$HOME/.cache/tower/native}/towerc"
mkdir -p "$out"
bash "$repo/playground/scripts/build-targets.sh"
for target in x86_64-unknown-linux-gnu aarch64-unknown-linux-gnu x86_64-pc-windows-msvc x86_64-apple-macos11 arm64-apple-macos11; do
  "$compiler" "$repo/scaffolding/examples/memory.tower" --target "$target" --emit object -o "$out/$target.o"
  runtime="$repo/build/targets/$target-runtime.o"
  case "$target" in
    *linux*) ld.lld-19 -static --build-id=none -e _start "$out/$target.o" "$runtime" -o "$out/$target.elf";;
    *windows*) lld-link-19 /entry:mainCRTStartup /subsystem:console /machine:x64 /timestamp:0 "/out:$out/$target.exe" "$out/$target.o" "$runtime" "$repo/build/targets/kernel32.lib";;
    *macos*) arch=x86_64; if [[ "$target" == arm64* ]]; then arch=arm64; fi
      ld64.lld-19 -arch "$arch" -platform_version macos 11.0 11.0 -e _main "$out/$target.o" "$runtime" "$repo/build/targets/libSystem.tbd" -o "$out/$target.macho";;
  esac
done
printf '5\n84\n42\n' > "$out/expected.txt"
"$out/x86_64-unknown-linux-gnu.elf" > "$out/linux.txt"
"$out/x86_64-pc-windows-msvc.exe" > "$out/windows.txt"
diff -u "$out/expected.txt" "$out/linux.txt"
diff -u "$out/expected.txt" "$out/windows.txt"
if command -v qemu-aarch64 >/dev/null; then
  qemu-aarch64 "$out/aarch64-unknown-linux-gnu.elf" > "$out/linux-arm.txt"
  diff -u "$out/expected.txt" "$out/linux-arm.txt"
fi
printf 'All target packs link; x64 Linux and Windows execute. macOS needs a Mac for execution validation.\n'
