#!/usr/bin/env bash
set -euo pipefail
# Pin Clang, wasi-libc and libc++. Tower is compiled with -fno-exceptions.
version=34.0
archive=wasi-sdk-${version}-x86_64-linux.tar.gz
destination="${1:-$HOME/.cache/tower/wasi-sdk}"
mkdir -p "$destination"
checksum=b761e3a0721dbae9c09a0059e5fdb2bf917d1b4a8a7b430fb3b5aafb0984b2c4
release="$destination/wasi-sdk-${version}-x86_64-linux"
if [ ! -f "$release/.tower-sdk-ready" ] || [ ! -x "$release/bin/clang++" ]; then
  if ! printf '%s  %s\n' "$checksum" "$destination/$archive" | sha256sum -c - >/dev/null 2>&1; then
    curl -fL --retry 2 "https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-34/$archive" -o "$destination/$archive"
  fi
  printf '%s  %s\n' "$checksum" "$destination/$archive" | sha256sum -c -
  tar -xzf "$destination/$archive" -C "$destination"
  touch "$release/.tower-sdk-ready"
fi
printf 'WASI_SDK_PATH=%s/wasi-sdk-%s-x86_64-linux\n' "$destination" "$version"
