#!/usr/bin/env bash
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
bash "$repo/playground/scripts/build-native.sh"
native="${TOWER_NATIVE_BUILD:-$HOME/.cache/tower/native}"
out="$repo/build/bootstrap-check"
mkdir -p "$out"
# A production compiler already uses Tower-written utilities when it reads the
# utility source again. Compare its output with the independent C++ seed.
for utility in utf8 bytes entities parser-nodes host interpreter semantics; do
  source="$repo/scaffolding/compiler/utf8.tower"
  if [ "$utility" = bytes ]; then source="$repo/scaffolding/library/bytes.tower"; fi
  if [ "$utility" = entities ]; then source="$native/tower-compiler-entities.tower"; fi
  if [ "$utility" = parser-nodes ]; then source="$native/tower-compiler-parser-nodes.tower"; fi
  if [ "$utility" = host ]; then source="$native/tower-compiler-host.tower"; fi
  if [ "$utility" = interpreter ]; then source="$native/tower-compiler-interpreter.tower"; fi
  if [ "$utility" = semantics ]; then source="$native/tower-compiler-semantics.tower"; fi
  for target in x86_64-pc-linux-gnu wasm32-unknown-unknown x86_64-pc-windows-msvc aarch64-apple-darwin; do
    for stage in seed tower; do
      compiler="$native/towerc"
      if [ "$stage" = seed ]; then compiler="$native/towerc-seed"; fi
      if { [ "$utility" = parser-nodes ] || [ "$utility" = interpreter ] || [ "$utility" = semantics ]; } && [ "$stage" = seed ]; then compiler="$native/towerc-stage1"; fi
      "$compiler" "$source" --library --target "$target" \
        --bedrock "$repo/scaffolding/bedrock.tower" --foundation "$repo/scaffolding/foundation.tower" \
        --optimized-ir "$out/$utility-$target-$stage.ll" -o "$out/$utility-$target-$stage.o"
      "${LLVM_NM:-llvm-nm-19}" --undefined-only "$out/$utility-$target-$stage.o" > "$out/symbols.txt"
      python3 - "$utility" "$out/symbols.txt" <<'PY'
import pathlib, sys
allowed = set() if sys.argv[1] == 'utf8' else {'tower_reallocate', 'tower_deallocate', 'memcpy', 'memmove', 'memset', 'bzero', 'stack_pointer', 'memory_base'}
if sys.argv[1] == 'interpreter': allowed |= {
    'abort', 'tower_allocate', 'tower_trap',
    'im_append', 'im_fail', 'im_foreign', 'im_has_foreign', 'im_missing_foreign',
    'im_node', 'im_pointee_size', 'im_pointer_bytes', 'im_root',
    'im_type_alignment', 'im_type_mask', 'im_type_signed', 'im_type_size'}
if sys.argv[1] == 'host': allowed |= {
    'compiler_host_reallocate', 'compiler_host_deallocate', 'tower_allocate',
    'bytes_reserve', 'bytes_push'}
if sys.argv[1] == 'entities': allowed |= {
    'compiler_entity_store', 'abort',
    'tower_allocate', 'tower_entity_finalize', 'compiler_node_label',
    'compiler_name_is', 'compiler_name_equal', 'compiler_node_copy_metadata',
    'compiler_generic_type', 'compiler_component_add'}
if sys.argv[1] == 'parser-nodes': allowed |= {
    'syntax_scan_highlight',
    'syntax_replacement_begin', 'syntax_replacement_capture', 'syntax_replacement_attempt',
    'syntax_replacement_diagnostic', 'syntax_replacement_offset',
    'syntax_replacement_select', 'syntax_replacement_commit'}
if sys.argv[1] == 'parser-nodes': allowed |= {
    'entity_id', 'entity_replace_child', 'entity_take_last_child', 'entity_child_name',
    'syntax_expansion_history', 'syntax_expansion_previous', 'syntax_expansion_trace',
    'syntax_expansion_origin', 'syntax_expansion_copy_origin'}
if sys.argv[1] == 'parser-nodes': allowed |= {
    'tower_utf8_decode', 'tower_allocate', 'compiler_grammar_root',
    'compiler_grammar_rule', 'compiler_grammar_reference',
    'compiler_grammar_literal', 'compiler_grammar_range',
    'entity_component_get', 'entity_component_data', 'entity_component_add', 'entity_member_index',
    'entity_create_related', 'entity_attach', 'entity_child_at', 'entity_child_count', 'entity_parent', 'entity_release', 'entity_retain',
    'compiler_parse_match', 'parse_forest_leaf', 'parse_forest_join',
    'parse_forest_attach', 'parse_forest_take', 'bytes_assign_text', 'bytes_append'}
if sys.argv[1] == 'parser-nodes': allowed |= {
    'format_foundation_kind', 'format_builtin', 'format_operator', 'format_scalar_name',
    'format_array', 'format_record', 'format_boolean', 'format_signed', 'format_mask', 'format_sign'}
if sys.argv[1] == 'parser-nodes': allowed |= {
    'format_is_' + kind for kind in
    'Program Function Parameter Declare Assign Operand Binary Address Load Convert Bits Call Block If Loop Break Continue Print Return Type FieldDeclaration Field Index String SizeOf AlignOf Allocate Reallocate Free Copy Fill'.split()}
if sys.argv[1] == 'semantics': allowed |= {
    'tower_allocate', 'tower_trap', 'sem_get', 'sem_attach', 'sem_create', 'sem_match',
    'sem_child', 'sem_child_count', 'sem_parent', 'sem_member', 'sem_decode_identifier',
    'sem_require', 'generic_begin', 'generic_error', 'generic_register',
    'generic_parameter_count', 'generic_type_parameter', 'generic_instantiate',
    'generic_lookup', 'generic_type_result', 'generic_origin',
    'foundation_name_append', 'foundation_nodes_prepend'}
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
