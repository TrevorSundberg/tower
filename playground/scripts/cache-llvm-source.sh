#!/usr/bin/env bash
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
source="$repo/third_party/llvm-project"
# Use Windows Git for a Windows checkout under WSL. Its index stat cache is
# compatible with the checkout and avoids a very slow cross-filesystem refresh.
git_source() {
  if [[ "$source" == /mnt/* ]] && command -v git.exe >/dev/null; then
    git.exe -C "$(wslpath -w "$source")" "$@"
  else
    git -C "$source" "$@"
  fi
}
revision="$(git_source rev-parse HEAD | tr -d '\r')"
destination="${1:-$HOME/.cache/tower/llvm-source-$revision}"
# Only snapshot a clean vendor checkout. Use TOWER_LLVM_SOURCE_DIR directly if
# testing local LLVM patches; never silently omit them from the build.
if [ -n "$(git_source status --porcelain)" ]; then
  echo 'LLVM checkout has local edits. Set TOWER_LLVM_SOURCE_DIR to that checkout instead.' >&2
  exit 1
fi
if [ ! -f "$destination/.tower-revision" ]; then
  mkdir -p "$destination"
  git_source archive HEAD llvm libunwind/include cmake third-party wasi-include | tar -x -C "$destination"
  printf '%s\n' "$revision" > "$destination/.tower-revision"
fi
test "$(cat "$destination/.tower-revision")" = "$revision"
if [ ! -f "$destination/libunwind/include/mach-o/compact_unwind_encoding.h" ]; then
  git_source archive HEAD libunwind/include | tar -x -C "$destination"
fi
printf '%s\n' "$destination"
