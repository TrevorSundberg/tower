#!/usr/bin/env bash
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
bash "$repo/playground/scripts/build-native.sh"
native="${TOWER_NATIVE_BUILD:-$HOME/.cache/tower/native}"
out="$repo/build/bootstrap-check"
mkdir -p "$out"
# Compare the supplied import-capable Tower bootstrap with its built successor.
bootstrap="$(bash "$repo/playground/scripts/build-bootstrap.sh")"
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
      python3 - "$utility" "$out/symbols.txt" "$target" <<'PY'
import pathlib, sys
allowed = set() if sys.argv[1] == 'utf8' else {'tower_reallocate', 'tower_deallocate', 'memcpy', 'memmove', 'memset', 'bzero', 'stack_pointer', 'memory_base'}
if sys.argv[1] == 'interpreter': allowed |= {
    'abort', 'tower_allocate', 'tower_trap',
    'im_append', 'im_fail', 'im_foreign', 'im_has_foreign', 'im_missing_foreign',
    'im_pointer_bytes', 'im_root', 'sem_get',
    'semantic_alignment', 'semantic_mask', 'semantic_signed', 'semantic_size'}
if sys.argv[1] == 'host': allowed |= {
    'malloc', 'realloc', 'free', 'tower_allocate', 'abort',
    'bytes_reserve', 'bytes_push', 'bytes_append', 'bytes_dispose', 'tower_utf8_validate',
    'fopen', 'fread', 'fwrite', 'ferror', 'feof', 'fclose'}
# LLVM's Windows lowering probes the file reader's 16 KiB stack buffer. This
# compiler-rt/platform dependency must be bundled in a future Windows compiler;
# permitting it here verifies module output, not a complete executable closure.
if sys.argv[1] == 'host' and 'windows' in sys.argv[3]: allowed.add('chkstk')
if sys.argv[1] == 'entities': allowed |= {
    'compiler_entity_store', 'abort',
    'tower_allocate', 'tower_entity_finalize', 'compiler_node_label',
    'compiler_name_is', 'compiler_name_equal', 'compiler_node_copy_metadata',
    'compiler_generic_type', 'compiler_component_add'}
if sys.argv[1] == 'parser-nodes': allowed |= {
    'parse_forest_create', 'parse_forest_destroy', 'tower_utf8_validate',
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
    'core_component_type', 'semantic_builtin_name', 'semantic_operator', 'semantic_scalar_name',
    'semantic_signed', 'semantic_mask'}
if sys.argv[1] == 'semantics': allowed |= {
    'syntax_create', 'syntax_destroy', 'syntax_next', 'syntax_get_error',
    'syntax_get_revision', 'syntax_get_error_offset', 'bytes_append',
    'tower_allocate', 'tower_trap', 'sem_match', 'core_component_type', 'abort',
    'entity_component_get', 'entity_component_data', 'entity_component_add', 'entity_register',
    'tower_node_create', 'entity_attach', 'entity_release', 'entity_child_at',
    'entity_child_count', 'entity_parent', 'entity_member_index', 'foundation_node_init',
    'syntax_identifier_decode_in_place', 'generic_begin', 'generic_error', 'generic_register',
    'generic_parameter_count', 'generic_type_parameter', 'generic_instantiate',
    'generic_lookup', 'generic_type_result', 'generic_origin',
    'foundation_name_append', 'foundation_nodes_prepend'}
# Shared entity, parser, module, formatter and editor interfaces now cross these
# units. Keep the closure explicit; these are declared by the project-owned
# frontend/host APIs, not new untracked runtime libraries.
if sys.argv[1] == 'entities': allowed |= {
    'bytes_assign_text',
    'compiler_host_world',
    'foundation_node_init',
    'node_match_id',
    'node_match_label',
    'node_match_length',
    'node_match_rule',
    'node_match_set_id',
    'node_match_set_label',
    'node_match_set_length',
    'node_match_set_rule',
    'node_match_set_start',
    'node_match_start',
    'node_payload_init',
    'node_range_end',
    'node_range_set_end',
    'node_range_set_start',
    'node_range_start',
    'node_reference_capture',
    'node_reference_name',
    'node_reference_set_capture',
    'node_reference_set_name',
    'node_rule_generated',
    'node_rule_name',
    'node_rule_set_generated',
    'node_rule_set_name',
    'node_string_append',
    'node_string_data',
    'node_string_length',
    'node_string_resize',
    'node_string_set',
    'syntax_identifier_decode_in_place',
    'syntax_node_init',
    'syntax_nodes_equal',
    'tower_utf8_decode',
    'tower_utf8_encode',
}
if sys.argv[1] == 'parser-nodes': allowed |= {
    'abort',
    'compiler_clone_tree',
    'compiler_host_world',
    'compiler_world_get',
    'compiler_world_grammar',
    'compiler_world_pinned',
    'compiler_world_type',
    'entity_register',
    'fclose',
    'ferror',
    'fopen',
    'format_parser_host_text',
    'format_parser_label_text',
    'fread',
    'fwrite',
    'module_file_case_matches',
    'parse_forest_visits',
    'parser_match_get_type',
    'parser_presentation_text',
    'parser_trace_step',
    'semantic_enum',
    'semantic_source_comments',
    'syntax_capture_comments',
    'syntax_component_type',
    'syntax_create',
    'syntax_destroy',
    'syntax_get_error',
    'syntax_get_error_offset',
    'syntax_next',
    'syntax_parser_diagnostic_read',
    'syntax_parser_read',
    'syntax_parser_template_read',
    'syntax_reset',
    'syntax_trace_release',
    'tower_memory_allocate',
    'tower_memory_free',
    'tower_node_create',
}
if sys.argv[1] == 'host': allowed |= {
    'closedir',
    'opendir',
    'readdir',
    'strcmp',
}
if sys.argv[1] == 'semantics': allowed |= {
    'compiler_clone_tree',
    'entity_child_name',
    'entity_component_at',
    'entity_component_count',
    'entity_component_type',
    'entity_id',
    'entity_retain',
    'entity_view_close',
    'entity_view_open',
    'format_dependent_summary',
    'format_dependent_view',
    'format_dispose',
    'format_grammar_preview',
    'format_summary',
    'frontend_module_alias',
    'frontend_module_at',
    'frontend_module_attach_comments',
    'frontend_module_comments',
    'frontend_module_count',
    'frontend_module_dependency_at',
    'frontend_module_destroy',
    'frontend_module_diagnostic',
    'frontend_module_error',
    'frontend_module_finish',
    'frontend_module_import_at',
    'frontend_module_import_count',
    'frontend_module_location',
    'frontend_module_name',
    'frontend_module_position',
    'frontend_module_root',
    'frontend_module_roots',
    'frontend_module_session',
    'frontend_module_size',
    'frontend_module_source',
    'frontend_module_tree',
    'generic_definition',
    'host_json_quote',
    'host_json_unsigned',
    'host_source_error',
    'host_text_terminate',
    'parser_match_get_type',
    'syntax_capture_comments',
    'syntax_completion_accepts',
    'syntax_completion_callable',
    'syntax_completion_close',
    'syntax_completion_create',
    'syntax_completion_enable',
    'syntax_completion_identifier',
    'syntax_completion_module',
    'syntax_component_type',
    'syntax_inspection_capture',
    'syntax_inspection_match',
    'syntax_inspection_reference',
    'syntax_inspection_template',
    'syntax_source_location',
    'tower_node_get_parent_member_name',
}
symbols = {line.split()[-1].lstrip('_') for line in pathlib.Path(sys.argv[2]).read_text().splitlines() if line.strip()}
assert symbols <= allowed, f'Unexpected runtime dependencies: {symbols - allowed}'
PY
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
