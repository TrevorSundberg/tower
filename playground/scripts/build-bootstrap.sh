#!/usr/bin/env bash
set -euo pipefail
# An explicit compiler remains useful for predecessor/successor comparisons.
# Otherwise install the checked-in, hash-pinned development bootstrap.
if [ -n "${TOWER_BOOTSTRAP_COMPILER:-}" ]; then
  test -x "$TOWER_BOOTSTRAP_COMPILER"
  printf '%s\n' "$TOWER_BOOTSTRAP_COMPILER"
else
  repo="$(cd "$(dirname "$0")/../.." && pwd)"
  python3 "$repo/bootstrap/install.py"
fi
