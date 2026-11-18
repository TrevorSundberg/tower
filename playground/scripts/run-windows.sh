#!/usr/bin/env bash
# Exit 77 means execution is unavailable; compilation/linking still get tested.
set -euo pipefail
if command -v cmd.exe >/dev/null 2>&1; then
  exec "$@"
elif command -v wine >/dev/null 2>&1; then
  exec wine "$@"
else
  echo 'SKIP Windows execution: requires WSL interop or Wine.' >&2
  exit 77
fi
