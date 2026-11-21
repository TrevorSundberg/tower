#!/usr/bin/env bash
# Transitional CLI relocation checks. This is explicitly not a portable release.
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
out="$repo/build/distribution"
mkdir -p "$out"
tools="$(bash "$repo/playground/scripts/build-bootstrap.sh" --tools verify_compiler)"
reports="$(mktemp -d "$out/relocation.XXXXXX")"
stage="$(mktemp -d "$out/moved compiler.XXXXXX")"
trap 'rm -rf "$stage"' EXIT
cp "$repo/build/native/towerc" "$stage/towerc"
cp -R "$repo/build/native/share" "$stage/share"
"$tools/verify_compiler" "$stage/towerc" "$repo/scaffolding/tests" "$reports/development" development
# The development compiler still requires Clang to compile the Tower-generated
# target LLVM artifact. Keep this portable-release dependency gate visible.
"$tools/verify_compiler" "$stage/towerc" "$repo/scaffolding/tests" "$reports/restricted" expect_missing_clang
