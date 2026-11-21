#!/usr/bin/env bash
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
bash "$repo/playground/scripts/build-native.sh"
native="${TOWER_NATIVE_BUILD:-$HOME/.cache/tower/native}"
out="$repo/build/bootstrap-check"
mkdir -p "$out"
# Compare the supplied import-capable Tower bootstrap with its built successor.
bootstrap="$(bash "$repo/playground/scripts/build-bootstrap.sh")"
tools="$(bash "$repo/playground/scripts/build-bootstrap.sh" --tools verify_bootstrap_symbols)"
if [ "$#" -eq 0 ]; then set -- utf8 bytes entities parser-nodes host interpreter semantics; fi
for utility in "$@"; do
  case "$utility" in
    utf8|bytes|entities|parser-nodes|host|interpreter|semantics) ;;
    *) echo "Unknown bootstrap component: $utility" >&2; exit 1 ;;
  esac
  source="$repo/scaffolding/compiler/utf8.tower"
  if [ "$utility" = bytes ]; then source="$repo/scaffolding/library/bytes.tower"; fi
  if [ "$utility" = entities ]; then source="$native/tower_compiler_entities.tower"; fi
  if [ "$utility" = parser-nodes ]; then source="$native/tower_compiler_parser_nodes.tower"; fi
  if [ "$utility" = host ]; then source="$native/tower_compiler_host.tower"; fi
  if [ "$utility" = interpreter ]; then source="$native/tower_compiler_interpreter.tower"; fi
  if [ "$utility" = semantics ]; then source="$native/tower_compiler_semantics.tower"; fi
  for target in x86_64-pc-linux-gnu wasm32-unknown-unknown x86_64-pc-windows-msvc aarch64-apple-darwin; do
    for stage in bootstrap tower; do
      compiler="$native/towerc"
      if [ "$stage" = bootstrap ]; then compiler="$bootstrap"; fi
      "$compiler" "$source" --library --target "$target" \
        --bedrock "$repo/scaffolding/bedrock.tower" --foundation "$repo/scaffolding/foundation.tower" \
        --optimized-ir "$out/$utility-$target-$stage.ll" -o "$out/$utility-$target-$stage.o"
      "${LLVM_NM:-llvm-nm-19}" --undefined-only "$out/$utility-$target-$stage.o" > "$out/symbols.txt"
      "$tools/verify_bootstrap_symbols" "$utility" "$out/symbols.txt" "$target"
    done
    cmp "$out/$utility-$target-bootstrap.ll" "$out/$utility-$target-tower.ll"
    cmp "$out/$utility-$target-bootstrap.o" "$out/$utility-$target-tower.o"
    printf 'Bootstrap utility agreement: %s %s\n' "$utility" "$target"
  done
done
# A supplied bootstrap must use this checkout's explicitly passed grammar, not
# silently use paths belonging to the checkout where that binary was built.
cat "$repo/scaffolding/foundation.tower" > "$out/custom_foundation.tower"
cat >> "$out/custom_foundation.tower" <<'TOWER'

parse Statement |= 'bootstrap_check' ';' => replace { print(42); };
TOWER
printf 'bootstrap_check;\n' > "$out/custom_source.tower"
"$native/towerc" "$out/custom_source.tower" --interpret \
  --bedrock "$repo/scaffolding/bedrock.tower" --foundation "$out/custom_foundation.tower" > "$out/custom-output.txt"
printf '42\n' > "$out/custom-expected.txt"
cmp "$out/custom-output.txt" "$out/custom-expected.txt"
if "$native/towerc" "$out/custom_source.tower" --interpret --foundation "$out/does_not_exist.tower" > "$out/missing.log" 2>&1; then
  echo 'Missing grammar module unexpectedly accepted' >&2
  exit 1
fi
printf 'Explicit bootstrap grammar inputs passed.\n'
