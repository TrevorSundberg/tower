#!/usr/bin/env bash
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
bash "$repo/playground/scripts/build-native.sh"
native="${TOWER_NATIVE_BUILD:-$HOME/.cache/tower/native}"
out="$repo/build/bootstrap-check"
mkdir -p "$out"
# A production compiler already uses Tower-written utilities when it reads the
# utility source again. Compare its output with the independent C++ seed.
for utility in utf8 bytes entities; do
  source="$repo/scaffolding/compiler/utf8.tower"
  if [ "$utility" = bytes ]; then source="$repo/scaffolding/library/bytes.tower"; fi
  if [ "$utility" = entities ]; then source="$native/tower-compiler-entities.tower"; fi
  for target in x86_64-pc-linux-gnu wasm32-unknown-unknown x86_64-pc-windows-msvc aarch64-apple-darwin; do
    for stage in seed tower; do
      compiler="$native/towerc"
      if [ "$stage" = seed ]; then compiler="$native/towerc-seed"; fi
      "$compiler" "$source" --library --target "$target" \
        --bedrock "$repo/scaffolding/bedrock.tower" --foundation "$repo/scaffolding/foundation.tower" \
        --optimized-ir "$out/$utility-$target-$stage.ll" -o "$out/$utility-$target-$stage.o"
      "${LLVM_NM:-llvm-nm-19}" --undefined-only "$out/$utility-$target-$stage.o" > "$out/symbols.txt"
      python3 - "$utility" "$out/symbols.txt" <<'PY'
import pathlib, sys
allowed = set() if sys.argv[1] == 'utf8' else {'tower_reallocate', 'tower_deallocate', 'memcpy', 'memmove', 'memset', 'stack_pointer'}
if sys.argv[1] == 'entities': allowed |= {'tower_allocate', 'tower_entity_finalize'}
symbols = {line.split()[-1].lstrip('_') for line in pathlib.Path(sys.argv[2]).read_text().splitlines() if line.strip()}
assert symbols <= allowed, f'Unexpected runtime dependencies: {symbols - allowed}'
PY
    done
    cmp "$out/$utility-$target-seed.ll" "$out/$utility-$target-tower.ll"
    cmp "$out/$utility-$target-seed.o" "$out/$utility-$target-tower.o"
    printf 'Bootstrap utility agreement: %s %s\n' "$utility" "$target"
  done
done
# A supplied bootstrap must use this checkout's explicitly passed grammar, not
# silently use paths belonging to the checkout where that binary was built.
cat "$repo/scaffolding/foundation.tower" > "$out/custom-foundation.tower"
cat >> "$out/custom-foundation.tower" <<'TOWER'

parse Statement |= 'bootstrap_check' ';' => replace { print(42); };
TOWER
printf 'bootstrap_check;\n' > "$out/custom-source.tower"
"$native/towerc" "$out/custom-source.tower" --interpret \
  --bedrock "$repo/scaffolding/bedrock.tower" --foundation "$out/custom-foundation.tower" > "$out/custom-output.txt"
printf '42\n' > "$out/custom-expected.txt"
cmp "$out/custom-output.txt" "$out/custom-expected.txt"
if "$native/towerc" "$out/custom-source.tower" --interpret --foundation "$out/does-not-exist.tower" > "$out/missing.log" 2>&1; then
  echo 'Missing grammar module unexpectedly accepted' >&2
  exit 1
fi
printf 'Explicit bootstrap grammar inputs passed.\n'
