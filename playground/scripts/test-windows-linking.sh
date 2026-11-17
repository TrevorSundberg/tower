#!/usr/bin/env bash
# Run under WSL. Our small import description is enough for this console runtime.
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
out="$repo/build/linking"
compiler="${TOWER_NATIVE_BUILD:-$HOME/.cache/tower/native}/towerc"
kernel="${TOWER_KERNEL32:-$repo/build/targets/kernel32.lib}"
test -f "$kernel"
mkdir -p "$out"
clang --target=x86_64-pc-windows-msvc -ffreestanding -fno-builtin -O2 -c "$repo/scaffolding/tests/foreign-fixture.c" -o "$out/windows-fixture.obj"
llvm-ar-19 rcs "$out/windows-fixture.lib" "$out/windows-fixture.obj"
"$compiler" "$repo/scaffolding/tests/linking.tower" --target x86_64-pc-windows-msvc --link "$out/windows-fixture.lib" --link "$kernel" -o "$out/tower-linking.exe"
"$compiler" "$repo/scaffolding/examples/memory.tower" --target x86_64-pc-windows-msvc --link "$kernel" -o "$out/tower-memory.exe"
"$out/tower-linking.exe" > "$out/windows.txt"
"$out/tower-memory.exe" > "$out/windows-memory.txt"
diff -u "$out/expected.txt" "$out/windows.txt"
diff -u "$out/memory-expected.txt" "$out/windows-memory.txt"
printf 'Windows PE executables passed: C archive, exported Tower callback, buffers and allocation.\n'
