#!/usr/bin/env bash
# Small target support packs for browser exports; no full SDKs are bundled.
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
out="$repo/build/targets"
mkdir -p "$out"
runtime_build="${TOWER_NATIVE_BUILD:-$HOME/.cache/tower/native}"
cmake --build "$runtime_build" --target tower-guest-linux-x64 tower-guest-linux-arm64 tower-guest-windows-x64 tower-guest-macos-x64 tower-guest-macos-arm64
for target in x86_64-unknown-linux-gnu aarch64-unknown-linux-gnu x86_64-pc-windows-msvc x86_64-apple-macos11 arm64-apple-macos11; do
  case "$target" in
    x86_64*linux*) profile=linux-x64;;
    aarch64*linux*) profile=linux-arm64;;
    *windows*) profile=windows-x64;;
    x86_64*macos*) profile=macos-x64;;
    arm64*macos*) profile=macos-arm64;;
  esac
  cp "$runtime_build/guest-$profile.o" "$out/$target-runtime.o"
done
llvm-dlltool-19 -m i386:x86-64 -d "$repo/scaffolding/targets/kernel32.def" -l "$out/kernel32.lib"
cp "$repo/scaffolding/targets/libSystem.tbd" "$out/libSystem.tbd"
printf 'Built target runtime objects and minimal Windows/macOS import descriptions.\n'
