#!/usr/bin/env bash
# Small target support packs for browser exports; no full SDKs are bundled.
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
out="$repo/build/targets"
mkdir -p "$out"
for target in x86_64-unknown-linux-gnu aarch64-unknown-linux-gnu x86_64-pc-windows-msvc x86_64-apple-macos11 arm64-apple-macos11; do
  flags=()
  case "$target" in
    *linux*) flags+=(-DTOWER_FREESTANDING_LINUX);;
    *macos*) flags+=(-DTOWER_MACOS);;
  esac
  clang --target="$target" -O2 -ffreestanding -fno-builtin -fno-stack-protector "${flags[@]}" \
    -c "$repo/scaffolding/runtime.c" -o "$out/$target-runtime.o"
done
llvm-dlltool-19 -m i386:x86-64 -d "$repo/scaffolding/targets/kernel32.def" -l "$out/kernel32.lib"
cp "$repo/scaffolding/targets/libSystem.tbd" "$out/libSystem.tbd"
printf 'Built target runtime objects and minimal Windows/macOS import descriptions.\n'
