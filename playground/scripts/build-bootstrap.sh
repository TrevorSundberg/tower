#!/usr/bin/env bash
set -euo pipefail
# Imports are implemented in Tower. Do not recreate them in a native seed.
if [ -z "${TOWER_BOOTSTRAP_COMPILER:-}" ]; then
  printf '%s\n' 'Set TOWER_BOOTSTRAP_COMPILER to a scope-capable Tower-built towerc (see docs/modules.md).' >&2
  exit 1
fi
test -x "$TOWER_BOOTSTRAP_COMPILER"
printf '%s\n' "$TOWER_BOOTSTRAP_COMPILER"
