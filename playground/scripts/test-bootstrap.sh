#!/usr/bin/env bash
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
bash "$repo/playground/scripts/build-native.sh"
native="${TOWER_NATIVE_BUILD:-$HOME/.cache/tower/native}"
out="$repo/build/bootstrap-check"
mkdir -p "$out"
# A production compiler already uses Tower-written utilities when it reads the
# utility source again. Compare its output with the independent C++ seed.
for target in x86_64-pc-linux-gnu wasm32-unknown-unknown x86_64-pc-windows-msvc aarch64-apple-darwin; do
  for stage in seed tower; do
    compiler="$native/towerc"
    if [ "$stage" = seed ]; then compiler="$native/towerc-seed"; fi
    "$compiler" "$repo/scaffolding/compiler/utf8.tower" --library --target "$target" \
      --bedrock "$repo/scaffolding/bedrock.tower" --foundation "$repo/scaffolding/foundation.tower" \
      --optimized-ir "$out/$target-$stage.ll" -o "$out/$target-$stage.o"
    # The utility must not drag a print/trap/allocator runtime into its host.
    if [ -n "$("${LLVM_NM:-llvm-nm-19}" --undefined-only "$out/$target-$stage.o")" ]; then
      echo "Unexpected undefined symbols in $target-$stage.o" >&2
      exit 1
    fi
  done
  cmp "$out/$target-seed.ll" "$out/$target-tower.ll"
  cmp "$out/$target-seed.o" "$out/$target-tower.o"
  printf 'Bootstrap utility agreement: %s\n' "$target"
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
