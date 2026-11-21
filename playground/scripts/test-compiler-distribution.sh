#!/usr/bin/env bash
# Transitional CLI relocation checks. This is explicitly not a portable release.
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
out="$repo/build/distribution"
mkdir -p "$out"
stage="$(mktemp -d "$out/moved compiler.XXXXXX")"
trap 'rm -rf "$stage"' EXIT
cp "$repo/build/native/towerc" "$stage/towerc"
cp -R "$repo/build/native/share" "$stage/share"
python3 "$repo/playground/scripts/verify-compiler.py" "$stage/towerc" \
  --output "$out/relocated-development" --allow-development-tools
# The development compiler still requires Clang to compile the Tower-generated
# target LLVM artifact. Keep this portable-release dependency gate visible.
if python3 "$repo/playground/scripts/verify-compiler.py" "$stage/towerc" \
    --output "$out/relocated-restricted"; then
  echo 'Restricted-path checks now pass; retire the transitional expected failure after auditing dependency closure.' >&2
  exit 1
fi
python3 - "$out/relocated-restricted" <<'PY'
import json, pathlib, sys
root = pathlib.Path(sys.argv[1])
report = json.loads((root / 'report.json').read_text())
assert not report['passed']
assert report['checks'][-1]['name'] == 'link', report
assert all(check['passed'] for check in report['checks'][:-1]), report
assert 'Cannot find tool: clang' in (root / 'link.stderr').read_text()
print('Relocated host checks pass; portable link gate correctly rejects the missing runtime compiler.')
PY
