# Compiler ECS file ownership roster

Completeness index at `6282238779034442e0578d76b921ca117df819f1`:
1,011 tracked `.tower` files, from `git ls-files '*.tower'`.
This is not substantive audit evidence. Each owner must provide a reviewed
commit, content findings, disposition and applicable validation in their lane
audit. D1 reconciles this list with parent assignments and new integrated files.

Domain routing and all residual/unit assignments are confirmed by coordinator
inbox on 2026-11-22. Specific regression fixture edits stay with implementation
owners; D1 remains responsible for inventory/audit of tests. Shared manifests and
type definitions require coordination. D2's 45 bootstrap resource entries require
provenance/equivalence audit against originals only: never hand-edit pinned copies.
Original language/library/backend owners retain their implementation scope.
The shared semantics unit is A1's integration boundary; it does not confer
ownership of L2 semantic/type files. L2 constructor changes remain coordinated
with A1's shared context/protocol.

All 1,011 paths have exactly one roster owner. The sorted union matches the
tracked list with no duplicate or missing path. Counts measure inventory only,
not substantive audit completion. Each section is sorted by exact repository path.

Incoming paths and their historical receipt states are listed separately from
the immutable baseline count above. Subsequent receipt updates follow the tables.
Per-file substantive reviews are in `compiler_ecs_audit_d1.md`; they are source
reviews, not integrated compiler execution receipts.

| Incoming path | Roster owner | Specific implementation reservation | Exact draft |
| --- | --- | --- | --- |
| `scaffolding/tests/sanitizer_memory_probe.tower` | D1 | A2 | instrumentation handoff SHA256 `93cee185858581ccac9381557b057a1e641fd12db8e2d0e17c774950e1fd4331` |
| `scaffolding/tests/sanitizer_race_probe.tower` | D1 | A2 | same instrumentation handoff |
| `scaffolding/tools/instrument_llvm.tower` | D2 | A2 | same instrumentation handoff |
| `scaffolding/tests/build_tool_budget_checks.tower` | D1 | D2 | budget source `6a2536b`, patch SHA256 `0eb43211d08bd6428916f6ed8b831c9689e66b6f55e755930a6c25af0d66de55` |
| `scaffolding/benchmarks/compiler_wide_functions.tower` | D2 | D2 | exact path reported in D2 status; source/commit receipt pending, not reviewed by D1 |
| `scaffolding/tests/semantic_lifecycle_checks.tower` | D1 | A1 | exact path and body_runs hooks reserved in root inbox; source/commit receipt pending, not reviewed by D1 |
| `scaffolding/benchmarks/compiler_reference_inputs.tower` | D2 | D2 | exact path reported in D2 status; source/commit receipt pending, not reviewed by D1 |
| `scaffolding/tests/work_ready.tower` | D1 | A2 | `0b57994d`, validated checkpoints bundle |
| `scaffolding/tests/work_select.tower` | D1 | A2 | `0b57994d`, measurement fixture |
| `scaffolding/library/work_budget.tower` | A2 | A2 | `8d8faee3`, validated checkpoints bundle |
| `scaffolding/tests/work_budget.tower` | D1 | A2 | `8d8faee3` |
| `scaffolding/tests/work_budget_profile.tower` | D1 | A2 | `8d8faee3`, measurement fixture |
| `scaffolding/tests/work_budget_shared.tower` | D1 | A2 | `8d8faee3` |
| `scaffolding/tests/work_kernel_admission.tower` | D1 | A2 | `07246521` |
| `scaffolding/tests/work_kernel_overhead.tower` | D1 | A2 | `07246521`, measurement fixture |
| `scaffolding/tests/work_kernel_profile.tower` | D1 | A2 | `07246521`, measurement fixture |
| `scaffolding/tests/tool_output_identity.tower` | D1 | A2 | `5911d9cc` |
| `scaffolding/tests/work_signal_observe.tower` | D1 | A2 | `21c2b43d`, valid semaphore observer |
| `scaffolding/library/work_budget_types.tower` | A2 | A1 extraction, A2 shared contract | A1 boundary patch SHA256 `8263db9a9050823b31619952ccdad3fed43e554d54d091fd4b12ceeba4dbce47` |
| `scaffolding/tests/parser_retention.tower` | D1 | B1 diagnostic experiment | source SHA256 `f0033081ec3a8623b01d0ecc38c4d00e3f92b436b50c6ef57a4e2cb7086c4688`; reviewed one-off, not a second permanent benchmark |

The ten new A2 test sources above were reviewed from
`validated_checkpoints.patch`, SHA256
`9809853d1cfe6802e0427671a7c1e6d7dcd6dc74a89bd6f1352f20885f7fe011`.
Existing-path graph, pool, kernel and tool-file changes retain their established
owners and require refreshed owner receipts. The projection delta is SHA256
`19ddf885590763d28a41ef43bbf7a9d253825e2f7125a8f27d835dac1d6d5fee`.
After source review, D1 applied the A2 graph/budget/pool/kernel/tool-file and ten
fixture prerequisites plus projection delta, preserving the earlier D2
build/sanitizer drafts. At that import boundary they were unvalidated locally. The A1 extraction did
not pass its header-context check and remains unapplied; no partial application
or foreign world/unit change occurred. The twenty supplied/reported paths above
are supplemented by the coordinator's live inventory below. Additional source
identities and substantive receipts are still required.

### Historical eight-clone inventory received 2026-11-22 20:38 UTC

Coordinator inventory `new_tower_audit_inventory.json`, SHA256
`3ee5aa6b5afad479e24db33b7e89d36391b6b164a028379054638343f65cee63`,
reports 51 distinct added/nonignored-untracked Tower paths relative to main
`60741c5` (the baseline remains1,011). Physical occurrence in several clones is
neither ownership nor review credit. The following31 paths complete that live
inventory alongside the20 above. These sources are not all delivered to D1.
Production ownership follows the agreed domain rules; ambiguous regression
implementation reservations need coordinator confirmation. All test paths retain
D1 substantive audit responsibility even where another lane implements them.

| Additional path | Roster owner | Implementation/source evidence and remaining receipt |
| --- | --- | --- |
| `scaffolding/compiler/completion_types.tower` | B2 | A1 API extraction, patch `899a10ae`; defining types remain B2 domain |
| `scaffolding/compiler/language_grammar_types.tower` | B2 | Same A1 API extraction; owner source audit required |
| `scaffolding/compiler/semantic_constructor_types.tower` | L2 | Constructor/shared-context boundary; exact owner receipt needed |
| `scaffolding/compiler/semantic_context_types.tower` | A1 | Semantic API extraction; exact owner receipt needed |
| `scaffolding/compiler/semantic_declaration_types.tower` | A1 | Semantic API extraction; exact owner receipt needed |
| `scaffolding/compiler/semantic_evaluation_types.tower` | A1 | Semantic query types; interpreter implementation remains L1 |
| `scaffolding/compiler/semantic_known_types.tower` | A1 | Known-query shared declarations; exact owner receipt needed |
| `scaffolding/compiler/semantic_query_api.tower` | A1 | Query boundary; exact owner receipt needed |
| `scaffolding/compiler/semantic_query_pipeline.tower` | A1 | Query lifecycle boundary; exact owner receipt needed |
| `scaffolding/compiler/semantic_source_binding_types.tower` | A1 | Declaration/frame proof boundary; exact owner receipt needed |
| `scaffolding/compiler/semantic_type_execution.tower` | L2 | Type-execution domain; coordinate L1 interpreter contract |
| `scaffolding/tests/backend_type_construction.tower` | D1 | L2/B2 implementation reservation needs confirmation; source not supplied |
| `scaffolding/tests/driver_unit_budget.tower` | D1 | B2 unit/driver budget handoff; source and full audit pending |
| `scaffolding/tests/entity_locality.tower` | D1 | A2 source reported by coordinator; source and full audit pending |
| `scaffolding/tests/execution_rejection.tower` | D1 | L1 execution rejection reservation; source and full audit pending |
| `scaffolding/tests/execution_type_construction.tower` | D1 | L1/L2 implementation reservation needs confirmation; source not supplied |
| `scaffolding/tests/foreign_tool_checks.tower` | D1 | B2 source reported by coordinator; source and full audit pending |
| `scaffolding/tests/frontend_units_allocation.tower` | D1 | B2 implementation, D1 generic hook authorized; exact helper pending |
| `scaffolding/tests/frontend_units_memory.tower` | D1 | B2 unit budget domain; source and full audit pending |
| `scaffolding/tests/frontend_units_profile.tower` | D1 | B2 unit measurement domain; source and full audit pending |
| `scaffolding/tests/layout_frontier_profile.tower` | D1 | A2 source reported by coordinator; source and full audit pending |
| `scaffolding/tests/lr_budget.tower` | D1 | B1 parser budget handoff; source and full audit pending |
| `scaffolding/tests/lr_state_benchmark.tower` | D1 | B1 measurement source reported; full audit pending |
| `scaffolding/tests/module_cache_checks.tower` | D1 | B2 source reported by coordinator; source and full audit pending |
| `scaffolding/tests/module_cache_profile.tower` | D1 | B2 source reported by coordinator; source and full audit pending |
| `scaffolding/tests/parser_retention_observer.tower` | D1 | B1 experiment reported; distinct from delivered combined diagnostic, source pending |
| `scaffolding/tests/semantic_source_proof_checks.tower` | D1 | A1 v2 source-proof fixture; current source and full audit pending |
| `scaffolding/tests/type_construction_execution.tower` | D1 | L2/L1 implementation reservation needs confirmation; source not supplied |
| `scaffolding/tests/type_execution_receipts.tower` | D1 | L2 current receipt fixture; exact source and full audit pending |
| `scaffolding/tests/work_budget_allocation.tower` | D1 | A2 source reported by coordinator; source and full audit pending |
| `scaffolding/tests/world_budget.tower` | D1 | B2 world-budget domain; exact source and full audit pending |

The L2 prelude handoff SHA256
`c8c9eadb518f9ff96edd9b4a63bd1c15f106492fdc67e4e7ac4693164c8a9fc6`
deletes these14 baseline L2 paths while consolidating their definitions in
`scaffolding/types.tower`: `scaffolding/types/{bool,f32,f64,i8,i16,i32,i64,integer,u8,u16,u32,u64,usize,void}.tower`.
They remain in the historical1,011-file roster below until actual integration;
do not edit or delete the complete pinned bootstrap copies independently.
Prelude source changes do not imply a new published bootstrap or a passing
current type/constructor matrix. The live51 include experiments that may not
ship; do not turn inventory arithmetic into a final release count.

Other reported new cross-lane files need exact integrated paths and content
receipts; a status mention alone is not an inventory or review claim.

### Receipt update after local checkpoint0313651

All twenty initially missing test bodies in the additional table and
semantic_lifecycle_checks have now arrived as exact owner snapshots and received
substantive per-file reviews. The ten measurement/ownership snapshots and eleven
additional new test paths have separate hash/owner/provenance rows in the D1 audit;
work_ready's derived-count update is a refreshed receipt for an existing path.
The earlier table's pending-source states are preserved as the historical request,
not current missing-body blockers. Root confirmed execution_type_construction and
execution_rejection are L1, type_construction_execution/type_execution_receipts L2,
and backend_type_construction shared L2/B2. World-budget binding fixture is B2
with A2's shared ledger contract; physical copies through L2 confer no ownership.

Local b8ae879/0313651 commit the coordinated prerequisites and focused registration.
Eight selected regressions pass actual ASan and TSan with no skips; three valid
concurrent workloads each pass20repeats in both modes. That evidence covers the
hashed focused source closure only. Constructor/capture, parser retention, whole
compiler, browser/generation and publication gates remain separate. New production
module audits remain each owner's responsibility; no count implies their closure.

The following paragraph preserves the earlier2fbeffe checkpoint, before those
incoming paths were committed locally; it is not a current source-change claim.
At D1 checkpoint `2fbeffe` (based on published `60741c5`), the tracked count
remains 1,011. The only changed tracked Tower files since the baseline are D1's
`body_runs.tower`, `driver_c_cases.tower`, `driver_execution_cases.tower` and
`work_pool.tower` under `scaffolding/tests`; their original audit receipts are
supplemented by implementation/validation sections in the D1 audit and journal.
Production Tower source is unchanged at this checkpoint. A1 semantic data/API
modules, L2 constructor producer/receipts and the other reported backend/source
proof fixtures require exact incoming path/commit lists before reconciliation.
A1's reserved lifecycle hooks will change `body_runs.tower`; D1's earlier full
body matrix does not validate that incoming fixture/call until integrated checks
run. Preserve D1's explicit Foundation root import when merging those hooks.

## A1

```text
scaffolding/compiler/semantic_aggregates.tower
scaffolding/compiler/semantic_attributes.tower
scaffolding/compiler/semantic_body_work.tower
scaffolding/compiler/semantic_call_inference.tower
scaffolding/compiler/semantic_capture_work.tower
scaffolding/compiler/semantic_context.tower
scaffolding/compiler/semantic_control.tower
scaffolding/compiler/semantic_declarations.tower
scaffolding/compiler/semantic_defer.tower
scaffolding/compiler/semantic_definitions.tower
scaffolding/compiler/semantic_enums.tower
scaffolding/compiler/semantic_evaluation.tower
scaffolding/compiler/semantic_evaluation_aggregates.tower
scaffolding/compiler/semantic_evaluation_work.tower
scaffolding/compiler/semantic_execution_work.tower
scaffolding/compiler/semantic_expression_lowering.tower
scaffolding/compiler/semantic_expressions.tower
scaffolding/compiler/semantic_flow.tower
scaffolding/compiler/semantic_iteration.tower
scaffolding/compiler/semantic_iteration_work.tower
scaffolding/compiler/semantic_known_bindings.tower
scaffolding/compiler/semantic_known_work.tower
scaffolding/compiler/semantic_layout.tower
scaffolding/compiler/semantic_layout_kernel.tower
scaffolding/compiler/semantic_lifecycle.tower
scaffolding/compiler/semantic_lowering_work.tower
scaffolding/compiler/semantic_modules.tower
scaffolding/compiler/semantic_program_types.tower
scaffolding/compiler/semantic_source_bindings.tower
scaffolding/compiler/semantic_statements.tower
scaffolding/compiler/semantic_support.tower
scaffolding/compiler/semantic_values.tower
scaffolding/compiler/semantic_work_ids.tower
scaffolding/compiler/units/semantics.tower
scaffolding/compiler/units/semantics_checks.tower
```

## A2

```text
scaffolding/compiler/compiler_kernel.tower
scaffolding/compiler/compiler_kernels.tower
scaffolding/compiler/component_kinds.tower
scaffolding/compiler/entity_require.tower
scaffolding/compiler/units/entities.tower
scaffolding/compiler/units/shared_checks.tower
scaffolding/compiler/worker_policy.tower
scaffolding/compiler/world.tower
scaffolding/library/ar_archive.tower
scaffolding/library/bytes.tower
scaffolding/library/bytes_interface.tower
scaffolding/library/bytes_types.tower
scaffolding/library/coff_import_object.tower
scaffolding/library/compiler_work.tower
scaffolding/library/compiler_work_types.tower
scaffolding/library/crc32.tower
scaffolding/library/deflate.tower
scaffolding/library/entities.tower
scaffolding/library/entity_api.tower
scaffolding/library/entity_stage.tower
scaffolding/library/entity_types.tower
scaffolding/library/float_bits.tower
scaffolding/library/float_text.tower
scaffolding/library/gzip.tower
scaffolding/library/platform.tower
scaffolding/library/queue.tower
scaffolding/library/sha256.tower
scaffolding/library/stack.tower
scaffolding/library/storage.tower
scaffolding/library/vector.tower
scaffolding/library/work_graph.tower
scaffolding/library/work_pool.tower
scaffolding/library/zip_archive.tower
```

## B1

```text
scaffolding/bedrock.tower
scaffolding/compiler/automaton.tower
scaffolding/compiler/format.tower
scaffolding/compiler/format_api.tower
scaffolding/compiler/format_dependent.tower
scaffolding/compiler/format_diagnostic.tower
scaffolding/compiler/format_diagnostic_types.tower
scaffolding/compiler/format_foundation.tower
scaffolding/compiler/format_grammar.tower
scaffolding/compiler/format_parser.tower
scaffolding/compiler/format_parser_table.tower
scaffolding/compiler/format_parser_table_types.tower
scaffolding/compiler/format_source.tower
scaffolding/compiler/format_syntax_preview.tower
scaffolding/compiler/format_types.tower
scaffolding/compiler/grammar_attributes.tower
scaffolding/compiler/grammar_builder.tower
scaffolding/compiler/grammar_types.tower
scaffolding/compiler/lexer_table.tower
scaffolding/compiler/lr_analysis.tower
scaffolding/compiler/lr_api.tower
scaffolding/compiler/lr_first_work.tower
scaffolding/compiler/lr_grammar.tower
scaffolding/compiler/lr_lalr.tower
scaffolding/compiler/lr_parser.tower
scaffolding/compiler/lr_runtime.tower
scaffolding/compiler/lr_runtime_work.tower
scaffolding/compiler/lr_state_work.tower
scaffolding/compiler/lr_states.tower
scaffolding/compiler/lr_tree.tower
scaffolding/compiler/lr_types.tower
scaffolding/compiler/lr_work.tower
scaffolding/compiler/parse_tree.tower
scaffolding/compiler/parser_diagnostic_types.tower
scaffolding/compiler/parser_integration.tower
scaffolding/compiler/parser_markers.tower
scaffolding/compiler/parser_nodes.tower
scaffolding/compiler/parser_presentation.tower
scaffolding/compiler/parser_state.tower
scaffolding/compiler/parser_stream.tower
scaffolding/compiler/parser_table.tower
scaffolding/compiler/parser_table_types.tower
scaffolding/compiler/parser_types.tower
scaffolding/compiler/parser_workers.tower
scaffolding/compiler/regex_grammar.tower
scaffolding/compiler/regex_lowering.tower
scaffolding/compiler/source_comments.tower
scaffolding/compiler/syntax_baselines.tower
scaffolding/compiler/syntax_emission.tower
scaffolding/compiler/syntax_emission_lexical.tower
scaffolding/compiler/syntax_emission_types.tower
scaffolding/compiler/syntax_expansion.tower
scaffolding/compiler/syntax_expansion_types.tower
scaffolding/compiler/syntax_highlights.tower
scaffolding/compiler/syntax_inspection.tower
scaffolding/compiler/syntax_lexer.tower
scaffolding/compiler/syntax_nodes.tower
scaffolding/compiler/syntax_pending.tower
scaffolding/compiler/syntax_provenance.tower
scaffolding/compiler/syntax_reader.tower
scaffolding/compiler/syntax_replacement_owner.tower
scaffolding/compiler/syntax_replacement_types.tower
scaffolding/compiler/syntax_replacements.tower
scaffolding/compiler/syntax_revision.tower
scaffolding/compiler/syntax_scan.tower
scaffolding/compiler/syntax_session_diagnostic.tower
scaffolding/compiler/syntax_session_format.tower
scaffolding/compiler/syntax_session_inputs.tower
scaffolding/compiler/syntax_session_next.tower
scaffolding/compiler/syntax_session_pins.tower
scaffolding/compiler/syntax_session_scan.tower
scaffolding/compiler/syntax_session_setup.tower
scaffolding/compiler/syntax_session_state.tower
scaffolding/compiler/syntax_session_types.tower
scaffolding/compiler/syntax_session_view.tower
scaffolding/compiler/syntax_source.tower
scaffolding/compiler/syntax_tags.tower
scaffolding/compiler/syntax_template.tower
scaffolding/compiler/syntax_template_build.tower
scaffolding/compiler/syntax_template_types.tower
scaffolding/compiler/syntax_types.tower
scaffolding/compiler/syntax_validation.tower
scaffolding/compiler/syntax_version.tower
scaffolding/compiler/syntax_version_build.tower
scaffolding/compiler/syntax_version_cache.tower
scaffolding/compiler/syntax_version_presentation.tower
scaffolding/compiler/syntax_version_types.tower
scaffolding/compiler/syntax_view.tower
scaffolding/compiler/units/parser.tower
scaffolding/compiler/units/parser_check_cases.tower
scaffolding/compiler/units/parser_checks.tower
scaffolding/compiler/units/parser_core.tower
scaffolding/compiler/units/parser_replacement_checks.tower
scaffolding/compiler/units/parser_work.tower
scaffolding/compiler/units/parser_work_checks.tower
scaffolding/compiler/units/template_build.tower
scaffolding/compiler/utf8.tower
scaffolding/foundation.tower
scaffolding/foundation_syntax.tower
scaffolding/tower.tower
```

## B2

```text
scaffolding/backend/bindings.tower
scaffolding/backend/coff_import.tower
scaffolding/backend/coff_object.tower
scaffolding/backend/context.tower
scaffolding/backend/disassembly.tower
scaffolding/backend/elf_dynamic_emit.tower
scaffolding/backend/elf_dynamic_layout.tower
scaffolding/backend/elf_dynamic_link.tower
scaffolding/backend/elf_dynamic_metadata.tower
scaffolding/backend/elf_dynamic_plan.tower
scaffolding/backend/elf_dynamic_symbols.tower
scaffolding/backend/elf_link.tower
scaffolding/backend/elf_link_emit.tower
scaffolding/backend/elf_link_jobs.tower
scaffolding/backend/elf_link_symbols.tower
scaffolding/backend/elf_link_world.tower
scaffolding/backend/elf_object.tower
scaffolding/backend/elf_properties.tower
scaffolding/backend/elf_relocate.tower
scaffolding/backend/elf_shared.tower
scaffolding/backend/elf_types.tower
scaffolding/backend/elf_unwind.tower
scaffolding/backend/embed_runtime.tower
scaffolding/backend/file_api.tower
scaffolding/backend/file_posix.tower
scaffolding/backend/file_windows.tower
scaffolding/backend/foreign_api.tower
scaffolding/backend/foreign_declarators.tower
scaffolding/backend/foreign_grammar.tower
scaffolding/backend/foreign_itanium.tower
scaffolding/backend/foreign_microsoft.tower
scaffolding/backend/foreign_operators.tower
scaffolding/backend/foreign_reader.tower
scaffolding/backend/foreign_symbol.tower
scaffolding/backend/foreign_tool.tower
scaffolding/backend/import_bindings.tower
scaffolding/backend/import_foundation.tower
scaffolding/backend/import_instructions.tower
scaffolding/backend/import_module.tower
scaffolding/backend/import_values.tower
scaffolding/backend/link_inputs.tower
scaffolding/backend/link_types.tower
scaffolding/backend/linker.tower
scaffolding/backend/linker_tower_elf.tower
scaffolding/backend/linker_tower_hosted_elf.tower
scaffolding/backend/linker_tower_macho.tower
scaffolding/backend/linker_tower_native.tower
scaffolding/backend/linker_tower_pe.tower
scaffolding/backend/linker_tower_wasm.tower
scaffolding/backend/linker_wasi.tower
scaffolding/backend/linker_wasi_cross.tower
scaffolding/backend/linker_wasi_wasm.tower
scaffolding/backend/lowering.tower
scaffolding/backend/macho_emit.tower
scaffolding/backend/macho_jobs.tower
scaffolding/backend/macho_layout.tower
scaffolding/backend/macho_link.tower
scaffolding/backend/macho_metadata.tower
scaffolding/backend/macho_object.tower
scaffolding/backend/macho_relocate.tower
scaffolding/backend/macho_sign.tower
scaffolding/backend/macho_symbols.tower
scaffolding/backend/macho_tbd.tower
scaffolding/backend/macho_types.tower
scaffolding/backend/macho_unwind.tower
scaffolding/backend/macho_world.tower
scaffolding/backend/pe_link.tower
scaffolding/backend/pe_link_emit.tower
scaffolding/backend/pe_link_jobs.tower
scaffolding/backend/pe_link_layout.tower
scaffolding/backend/pe_link_symbols.tower
scaffolding/backend/pe_link_world.tower
scaffolding/backend/pe_relocate.tower
scaffolding/backend/pe_types.tower
scaffolding/backend/pipeline.tower
scaffolding/backend/reactor.tower
scaffolding/backend/session.tower
scaffolding/backend/session_wasi.tower
scaffolding/backend/source_api.tower
scaffolding/backend/source_session.tower
scaffolding/backend/target.tower
scaffolding/backend/target_api.tower
scaffolding/backend/target_once_linux.tower
scaffolding/backend/target_once_macos.tower
scaffolding/backend/target_once_state.tower
scaffolding/backend/target_once_wasi.tower
scaffolding/backend/target_once_windows.tower
scaffolding/backend/target_registry_source.tower
scaffolding/backend/target_registry_tool.tower
scaffolding/backend/targets_native.tower
scaffolding/backend/targets_wasm.tower
scaffolding/backend/text.tower
scaffolding/backend/units.tower
scaffolding/backend/wasi_support.tower
scaffolding/backend/wasm_archive.tower
scaffolding/backend/wasm_bytes.tower
scaffolding/backend/wasm_link.tower
scaffolding/backend/wasm_link_archives.tower
scaffolding/backend/wasm_link_emit.tower
scaffolding/backend/wasm_link_jobs.tower
scaffolding/backend/wasm_link_layout.tower
scaffolding/backend/wasm_link_live.tower
scaffolding/backend/wasm_link_memory.tower
scaffolding/backend/wasm_link_options.tower
scaffolding/backend/wasm_link_plan.tower
scaffolding/backend/wasm_link_prepare.tower
scaffolding/backend/wasm_link_relocate.tower
scaffolding/backend/wasm_link_symbols.tower
scaffolding/backend/wasm_link_synthetic.tower
scaffolding/backend/wasm_link_types.tower
scaffolding/backend/wasm_link_world.tower
scaffolding/backend/wasm_names.tower
scaffolding/backend/wasm_object.tower
scaffolding/backend/wasm_object_linking.tower
scaffolding/backend/wasm_object_sections.tower
scaffolding/backend/wasm_object_types.tower
scaffolding/compiler/completion.tower
scaffolding/compiler/frontend_bedrock.tower
scaffolding/compiler/frontend_cache.tower
scaffolding/compiler/frontend_compilation.tower
scaffolding/compiler/frontend_diagnostic_types.tower
scaffolding/compiler/frontend_diagnostics.tower
scaffolding/compiler/frontend_modules.tower
scaffolding/compiler/frontend_pattern.tower
scaffolding/compiler/frontend_revision_types.tower
scaffolding/compiler/frontend_table.tower
scaffolding/compiler/frontend_units.tower
scaffolding/compiler/frontend_world.tower
scaffolding/compiler/host_entities.tower
scaffolding/compiler/host_handle_types.tower
scaffolding/compiler/host_handles.tower
scaffolding/compiler/host_metadata.tower
scaffolding/compiler/host_parser_components.tower
scaffolding/compiler/host_parser_constructors.tower
scaffolding/compiler/host_provenance.tower
scaffolding/compiler/host_text.tower
scaffolding/compiler/host_world.tower
scaffolding/compiler/inspection_policy.tower
scaffolding/compiler/language_components.tower
scaffolding/compiler/language_generics.tower
scaffolding/compiler/language_grammar.tower
scaffolding/compiler/language_query.tower
scaffolding/compiler/services.tower
scaffolding/compiler/units/backend_checks.tower
scaffolding/compiler/units/backend_core.tower
scaffolding/compiler/units/backend_native_linux.tower
scaffolding/compiler/units/backend_native_macos.tower
scaffolding/compiler/units/backend_native_windows.tower
scaffolding/compiler/units/backend_wasi.tower
scaffolding/compiler/units/backend_wasi_checks.tower
scaffolding/compiler/units/backend_wasi_native.tower
scaffolding/compiler/units/backend_wasi_wasm.tower
scaffolding/compiler/units/foreign.tower
scaffolding/compiler/units/host_check_cases.tower
scaffolding/compiler/units/host_driver.tower
scaffolding/compiler/units/host_linux.tower
scaffolding/compiler/units/host_linux_checks.tower
scaffolding/compiler/units/host_linux_driver.tower
scaffolding/compiler/units/host_macos.tower
scaffolding/compiler/units/host_macos_checks.tower
scaffolding/compiler/units/host_macos_driver.tower
scaffolding/compiler/units/host_platform_linux.tower
scaffolding/compiler/units/host_platform_macos.tower
scaffolding/compiler/units/host_platform_wasi.tower
scaffolding/compiler/units/host_platform_windows.tower
scaffolding/compiler/units/host_services.tower
scaffolding/compiler/units/host_wasi.tower
scaffolding/compiler/units/host_wasi_checks.tower
scaffolding/compiler/units/host_wasi_driver.tower
scaffolding/compiler/units/host_windows.tower
scaffolding/compiler/units/host_windows_checks.tower
scaffolding/compiler/units/host_windows_driver.tower
scaffolding/compiler/units/parser_frontend.tower
scaffolding/compiler/units/parser_modules.tower
scaffolding/compiler/units/parser_modules_checks.tower
scaffolding/compiler/units/parser_modules_work.tower
scaffolding/compiler/units/parser_modules_work_checks.tower
scaffolding/host/driver_api.tower
scaffolding/host/driver_compile.tower
scaffolding/host/driver_entry.tower
scaffolding/host/driver_execution.tower
scaffolding/host/driver_files.tower
scaffolding/host/driver_format.tower
scaffolding/host/driver_link.tower
scaffolding/host/driver_link_flags.tower
scaffolding/host/driver_link_input.tower
scaffolding/host/driver_link_objects.tower
scaffolding/host/driver_linux.tower
scaffolding/host/driver_linux_libraries.tower
scaffolding/host/driver_macos.tower
scaffolding/host/driver_map_posix.tower
scaffolding/host/driver_map_windows.tower
scaffolding/host/driver_mapped_file.tower
scaffolding/host/driver_options.tower
scaffolding/host/driver_paths.tower
scaffolding/host/driver_paths_posix.tower
scaffolding/host/driver_paths_windows.tower
scaffolding/host/driver_platform.tower
scaffolding/host/driver_posix.tower
scaffolding/host/driver_posix_api.tower
scaffolding/host/driver_prepare.tower
scaffolding/host/driver_request.tower
scaffolding/host/driver_services.tower
scaffolding/host/driver_stat_libc.tower
scaffolding/host/driver_stat_linux_arm64.tower
scaffolding/host/driver_stat_linux_x64.tower
scaffolding/host/driver_stat_macos.tower
scaffolding/host/driver_stat_macos_arm64.tower
scaffolding/host/driver_stat_macos_x64.tower
scaffolding/host/driver_support.tower
scaffolding/host/driver_timing.tower
scaffolding/host/driver_types.tower
scaffolding/host/driver_units.tower
scaffolding/host/driver_windows.tower
scaffolding/host/driver_windows_arguments.tower
scaffolding/host/entity_lifecycle.tower
scaffolding/host/guest_bytes.tower
scaffolding/host/guest_entry.tower
scaffolding/host/guest_libc.tower
scaffolding/host/guest_linux.tower
scaffolding/host/guest_linux_arm64.tower
scaffolding/host/guest_linux_x64.tower
scaffolding/host/guest_memory.tower
scaffolding/host/guest_output.tower
scaffolding/host/guest_posix.tower
scaffolding/host/guest_runtime.tower
scaffolding/host/guest_wasm.tower
scaffolding/host/guest_wasm_runtime.tower
scaffolding/host/guest_windows.tower
scaffolding/host/ide_api.tower
scaffolding/host/ide_artifacts.tower
scaffolding/host/ide_candidate.tower
scaffolding/host/ide_completion.tower
scaffolding/host/ide_execution.tower
scaffolding/host/ide_parser.tower
scaffolding/host/ide_protocol.tower
scaffolding/host/ide_selftest.tower
scaffolding/host/ide_state.tower
scaffolding/host/ide_syntax.tower
scaffolding/host/ide_text.tower
scaffolding/host/ide_tree.tower
scaffolding/host/ide_types.tower
scaffolding/host/invocation_execution.tower
scaffolding/host/legacy.tower
scaffolding/host/legacy_storage.tower
scaffolding/host/llvm_worker.tower
scaffolding/host/memory.tower
scaffolding/host/memory_instrumented.tower
scaffolding/host/memory_libc.tower
scaffolding/host/memory_output_posix.tower
scaffolding/host/memory_output_windows.tower
scaffolding/host/memory_runtime.tower
scaffolding/host/memory_trap.tower
scaffolding/host/memory_types.tower
scaffolding/host/module_path.tower
scaffolding/host/module_path_linux.tower
scaffolding/host/module_path_macos.tower
scaffolding/host/module_path_posix.tower
scaffolding/host/module_path_wasi.tower
scaffolding/host/module_path_windows.tower
scaffolding/host/platform_output.tower
scaffolding/host/runtime_bind.tower
scaffolding/host/runtime_output_tags.tower
scaffolding/host/runtime_platform.tower
scaffolding/host/syntax_baseline.tower
scaffolding/host/syntax_baseline_api.tower
scaffolding/host/work_dispatch.tower
scaffolding/host/work_linux.tower
scaffolding/host/work_macos.tower
scaffolding/host/work_memory_wasi.tower
scaffolding/host/work_portable.tower
scaffolding/host/work_wasi.tower
scaffolding/host/work_windows.tower
```

## L1

```text
scaffolding/compiler/bytecode_package.tower
scaffolding/compiler/c_control.tower
scaffolding/compiler/c_emitter.tower
scaffolding/compiler/c_runtime.tower
scaffolding/compiler/execution_package.tower
scaffolding/compiler/execution_profiles.tower
scaffolding/compiler/execution_session.tower
scaffolding/compiler/fast_interpreter.tower
scaffolding/compiler/foundation_nodes.tower
scaffolding/compiler/foundation_tags.tower
scaffolding/compiler/foundation_types.tower
scaffolding/compiler/interpreter.tower
scaffolding/compiler/interpreter_abi.tower
scaffolding/compiler/interpreter_context.tower
scaffolding/compiler/interpreter_context_types.tower
scaffolding/compiler/interpreter_storage.tower
scaffolding/compiler/interpreter_types.tower
scaffolding/compiler/roku_emitter.tower
scaffolding/compiler/roku_runtime.tower
scaffolding/compiler/source_emitter_api.tower
scaffolding/compiler/units/evaluation.tower
scaffolding/compiler/units/evaluation_checks.tower
scaffolding/compiler/units/interpreter.tower
scaffolding/compiler/units/interpreter_browser.tower
scaffolding/compiler/units/interpreter_checks.tower
```

## L2

```text
scaffolding/compiler/generic_body_types.tower
scaffolding/compiler/generic_registry.tower
scaffolding/compiler/generics.tower
scaffolding/compiler/semantic_constructor_work.tower
scaffolding/compiler/semantic_generic_body_work.tower
scaffolding/compiler/semantic_generic_info.tower
scaffolding/compiler/semantic_generic_values.tower
scaffolding/compiler/semantic_type_values.tower
scaffolding/compiler/semantic_types.tower
scaffolding/compiler/type_objects.tower
scaffolding/compiler/type_primitives.tower
scaffolding/types.tower
scaffolding/types/bool.tower
scaffolding/types/f32.tower
scaffolding/types/f64.tower
scaffolding/types/i16.tower
scaffolding/types/i32.tower
scaffolding/types/i64.tower
scaffolding/types/i8.tower
scaffolding/types/integer.tower
scaffolding/types/u16.tower
scaffolding/types/u32.tower
scaffolding/types/u64.tower
scaffolding/types/u8.tower
scaffolding/types/usize.tower
scaffolding/types/void.tower
```

## D1

```text
editors/tower/tests/grammar.tower
editors/tower/tests/highlighting.tower
playground/tests/fixtures/foundation_legacy.tower
scaffolding/examples/collections.tower
scaffolding/examples/execution.tower
scaffolding/examples/foreach.tower
scaffolding/examples/functions.tower
scaffolding/examples/increment.tower
scaffolding/examples/inference.tower
scaffolding/examples/match.tower
scaffolding/examples/memory.tower
scaffolding/examples/replacements.tower
scaffolding/examples/structs.tower
scaffolding/examples/templates.tower
scaffolding/examples/tokens.tower
scaffolding/tests/allocator_glue.tower
scaffolding/tests/allocator_wasi_entry.tower
scaffolding/tests/allocator_wasm.tower
scaffolding/tests/attribute_cycle_a.tower
scaffolding/tests/attribute_cycle_b.tower
scaffolding/tests/backend.tower
scaffolding/tests/backend_foreign_calls.tower
scaffolding/tests/backend_foreign_library.tower
scaffolding/tests/backend_foreign_surface.tower
scaffolding/tests/backend_import_constants.tower
scaffolding/tests/backend_main.tower
scaffolding/tests/backend_popcount.tower
scaffolding/tests/backend_semantics.tower
scaffolding/tests/backend_source.tower
scaffolding/tests/backend_stack.tower
scaffolding/tests/backend_units.tower
scaffolding/tests/body_continuation.tower
scaffolding/tests/body_runs.tower
scaffolding/tests/bootstrap_symbols_checks.tower
scaffolding/tests/bytes.tower
scaffolding/tests/bytes_oracle.tower
scaffolding/tests/coff_import_checks.tower
scaffolding/tests/compiler_batch.tower
scaffolding/tests/compiler_buffer_owner.tower
scaffolding/tests/compiler_project_compare.tower
scaffolding/tests/compiler_project_units.tower
scaffolding/tests/compiler_scans.tower
scaffolding/tests/compiler_storage.tower
scaffolding/tests/compiler_support_checks.tower
scaffolding/tests/compiler_support_program.tower
scaffolding/tests/compiler_work.tower
scaffolding/tests/compiler_work_owner.tower
scaffolding/tests/comptime.tower
scaffolding/tests/comptime_aggregate_checks.tower
scaffolding/tests/comptime_aggregates.tower
scaffolding/tests/comptime_flow.tower
scaffolding/tests/computed_type_arguments.tower
scaffolding/tests/cross_target_program.tower
scaffolding/tests/declaration_attribute_checks.tower
scaffolding/tests/declaration_attributes.tower
scaffolding/tests/declaration_continuations.tower
scaffolding/tests/declaration_inference.tower
scaffolding/tests/declaration_operands.tower
scaffolding/tests/decltype.tower
scaffolding/tests/decltype_aggregate.tower
scaffolding/tests/decltype_expressions.tower
scaffolding/tests/decltype_generic_headers.tower
scaffolding/tests/decltype_headers.tower
scaffolding/tests/decltype_layout.tower
scaffolding/tests/decltype_lazy_body.tower
scaffolding/tests/decltype_type_fields.tower
scaffolding/tests/default_initialization.tower
scaffolding/tests/defer_scopes.tower
scaffolding/tests/deflate_checks.tower
scaffolding/tests/distribution_invalid.tower
scaffolding/tests/distribution_library.tower
scaffolding/tests/distribution_link.tower
scaffolding/tests/distribution_program.tower
scaffolding/tests/driver.tower
scaffolding/tests/driver_c_cases.tower
scaffolding/tests/driver_c_validation.tower
scaffolding/tests/driver_compilation.tower
scaffolding/tests/driver_differentials.tower
scaffolding/tests/driver_execution_cases.tower
scaffolding/tests/driver_formatting.tower
scaffolding/tests/driver_linking.tower
scaffolding/tests/driver_main.tower
scaffolding/tests/driver_measure.tower
scaffolding/tests/driver_measure_cases.tower
scaffolding/tests/driver_measure_timings.tower
scaffolding/tests/driver_module_paths.tower
scaffolding/tests/driver_msvc.tower
scaffolding/tests/driver_platform_api.tower
scaffolding/tests/driver_posix.tower
scaffolding/tests/driver_request.tower
scaffolding/tests/driver_standalone.tower
scaffolding/tests/driver_target_cases.tower
scaffolding/tests/driver_targets.tower
scaffolding/tests/driver_units.tower
scaffolding/tests/driver_windows.tower
scaffolding/tests/driver_windows_unit.tower
scaffolding/tests/editor_observations.tower
scaffolding/tests/editor_units.tower
scaffolding/tests/editor_world.tower
scaffolding/tests/elf_hosted_arrays.tower
scaffolding/tests/elf_hosted_checks.tower
scaffolding/tests/elf_hosted_driver.tower
scaffolding/tests/elf_hosted_program.tower
scaffolding/tests/elf_link_checks.tower
scaffolding/tests/elf_link_driver.tower
scaffolding/tests/elf_link_library.tower
scaffolding/tests/elf_link_program.tower
scaffolding/tests/elf_shared_checks.tower
scaffolding/tests/entities.tower
scaffolding/tests/entity_page_faults.tower
scaffolding/tests/entity_pages.tower
scaffolding/tests/entity_registry.tower
scaffolding/tests/entity_stage_faults.tower
scaffolding/tests/entity_stage_ownership.tower
scaffolding/tests/entity_store.tower
scaffolding/tests/entity_table_faults.tower
scaffolding/tests/entity_tables.tower
scaffolding/tests/entity_views.tower
scaffolding/tests/enum_expressions.tower
scaffolding/tests/evaluation_query_checks.tower
scaffolding/tests/execution_cases.tower
scaffolding/tests/execution_core.tower
scaffolding/tests/execution_core_cases.tower
scaffolding/tests/execution_graph.tower
scaffolding/tests/execution_main.tower
scaffolding/tests/execution_packages.tower
scaffolding/tests/execution_semantic_cases.tower
scaffolding/tests/execution_semantics.tower
scaffolding/tests/execution_suite.tower
scaffolding/tests/execution_support.tower
scaffolding/tests/execution_wasi.tower
scaffolding/tests/execution_world.tower
scaffolding/tests/fixture_json_rows.tower
scaffolding/tests/float_bits.tower
scaffolding/tests/float_reference.tower
scaffolding/tests/float_text.tower
scaffolding/tests/floating_checks.tower
scaffolding/tests/floating_foreign.tower
scaffolding/tests/floating_oracle.tower
scaffolding/tests/floating_output.tower
scaffolding/tests/floating_point.tower
scaffolding/tests/for_loops.tower
scaffolding/tests/foreign_fixture.tower
scaffolding/tests/foreign_names.tower
scaffolding/tests/format_abi.tower
scaffolding/tests/format_expected.tower
scaffolding/tests/format_main.tower
scaffolding/tests/format_repository.tower
scaffolding/tests/format_suite.tower
scaffolding/tests/format_wasi.tower
scaffolding/tests/forward.tower
scaffolding/tests/frontend_baselines.tower
scaffolding/tests/frontend_bedrock.tower
scaffolding/tests/frontend_cache.tower
scaffolding/tests/frontend_diagnostic_revision.tower
scaffolding/tests/frontend_diagnostic_text.tower
scaffolding/tests/frontend_emission.tower
scaffolding/tests/frontend_format.tower
scaffolding/tests/frontend_host_baseline.tower
scaffolding/tests/frontend_main.tower
scaffolding/tests/frontend_modules.tower
scaffolding/tests/frontend_parser_text.tower
scaffolding/tests/frontend_pending.tower
scaffolding/tests/frontend_replacement_owner.tower
scaffolding/tests/frontend_revision.tower
scaffolding/tests/frontend_session_format.tower
scaffolding/tests/frontend_session_inputs.tower
scaffolding/tests/frontend_session_scan.tower
scaffolding/tests/frontend_session_state.tower
scaffolding/tests/frontend_session_view.tower
scaffolding/tests/frontend_session_world.tower
scaffolding/tests/frontend_syntax_preview.tower
scaffolding/tests/frontend_syntax_version.tower
scaffolding/tests/frontend_table_owner.tower
scaffolding/tests/frontend_template_build.tower
scaffolding/tests/frontend_units.tower
scaffolding/tests/frontend_world.tower
scaffolding/tests/function_checks.tower
scaffolding/tests/function_foreign_client.tower
scaffolding/tests/function_foreign_provider.tower
scaffolding/tests/function_values.tower
scaffolding/tests/generic_body_budget.tower
scaffolding/tests/generic_body_cases.tower
scaffolding/tests/generic_body_lazy.tower
scaffolding/tests/generic_registry.tower
scaffolding/tests/guest_runtime.tower
scaffolding/tests/guest_runtime_abi.tower
scaffolding/tests/guest_runtime_growth.tower
scaffolding/tests/guest_runtime_main.tower
scaffolding/tests/guest_windows_library.tower
scaffolding/tests/gzip_checks.tower
scaffolding/tests/host.tower
scaffolding/tests/host_runtime.tower
scaffolding/tests/host_services.tower
scaffolding/tests/ide.tower
scaffolding/tests/ide_candidate_checks.tower
scaffolding/tests/ide_completion_checks.tower
scaffolding/tests/ide_hover_checks.tower
scaffolding/tests/ide_hover_generic_checks.tower
scaffolding/tests/ide_hover_grammar_checks.tower
scaffolding/tests/ide_package_checks.tower
scaffolding/tests/ide_query_support.tower
scaffolding/tests/imports/left.tower
scaffolding/tests/imports/main.tower
scaffolding/tests/imports/right.tower
scaffolding/tests/imports/shared.tower
scaffolding/tests/increment_builtin.tower
scaffolding/tests/increment_rules.tower
scaffolding/tests/inferred_parallel_unit.tower
scaffolding/tests/integer_negation.tower
scaffolding/tests/integer_negation_checks.tower
scaffolding/tests/interpreter_call_query.tower
scaffolding/tests/interpreter_invocation.tower
scaffolding/tests/interpreter_storage.tower
scaffolding/tests/iteration_parallel_unit.tower
scaffolding/tests/known_binding_checks.tower
scaffolding/tests/known_binding_library.tower
scaffolding/tests/known_bindings.tower
scaffolding/tests/known_cycle_a.tower
scaffolding/tests/known_cycle_b.tower
scaffolding/tests/known_cycle_bad_a.tower
scaffolding/tests/known_cycle_bad_b.tower
scaffolding/tests/known_parallel_unit.tower
scaffolding/tests/language_collections.tower
scaffolding/tests/language_control.tower
scaffolding/tests/language_enums.tower
scaffolding/tests/layout_depth_source.tower
scaffolding/tests/lexer_table.tower
scaffolding/tests/lexer_table_oracle.tower
scaffolding/tests/lexicon_oracle.tower
scaffolding/tests/link_fixture_file.tower
scaffolding/tests/linking.tower
scaffolding/tests/llvm_c.tower
scaffolding/tests/llvm_scripts_checks.tower
scaffolding/tests/lr_analysis.tower
scaffolding/tests/lr_analysis_api.tower
scaffolding/tests/lr_analysis_comparisons.tower
scaffolding/tests/lr_analysis_failures.tower
scaffolding/tests/lr_analysis_oracle.tower
scaffolding/tests/lr_analysis_oracle_types.tower
scaffolding/tests/lr_control_checks.tower
scaffolding/tests/lr_control_types.tower
scaffolding/tests/lr_grammar.tower
scaffolding/tests/lr_grammar_fixtures.tower
scaffolding/tests/lr_grammar_oracle.tower
scaffolding/tests/lr_graph_checks.tower
scaffolding/tests/lr_parser_oracle.tower
scaffolding/tests/lr_precedence_checks.tower
scaffolding/tests/lr_runtime_faults.tower
scaffolding/tests/lr_runtime_oracle.tower
scaffolding/tests/lr_states_oracle.tower
scaffolding/tests/lr_tree_checks.tower
scaffolding/tests/lr_work.tower
scaffolding/tests/lr_work_main.tower
scaffolding/tests/macho_link_checks.tower
scaffolding/tests/macho_link_driver.tower
scaffolding/tests/macho_link_library.tower
scaffolding/tests/macho_link_program.tower
scaffolding/tests/module_paths.tower
scaffolding/tests/mt19937.tower
scaffolding/tests/named_initialization.tower
scaffolding/tests/named_initialization_checks.tower
scaffolding/tests/narrow_checks.tower
scaffolding/tests/narrow_floats.tower
scaffolding/tests/narrow_foreign.tower
scaffolding/tests/narrow_foreign_library.tower
scaffolding/tests/narrow_integers.tower
scaffolding/tests/narrow_output.tower
scaffolding/tests/narrow_scalar.tower
scaffolding/tests/nodes.tower
scaffolding/tests/null_operators.tower
scaffolding/tests/operators.tower
scaffolding/tests/parallel_unit.tower
scaffolding/tests/parser_benchmark.tower
scaffolding/tests/parser_failures.tower
scaffolding/tests/parser_fixture_setup.tower
scaffolding/tests/parser_integration.tower
scaffolding/tests/parser_main.tower
scaffolding/tests/parser_state.tower
scaffolding/tests/pe_link_checks.tower
scaffolding/tests/pe_link_driver.tower
scaffolding/tests/pe_link_library.tower
scaffolding/tests/pe_link_program.tower
scaffolding/tests/platform.tower
scaffolding/tests/reader_oracle.tower
scaffolding/tests/regex.tower
scaffolding/tests/regex_oracle.tower
scaffolding/tests/runtime_abi.tower
scaffolding/tests/runtime_windows_entry.tower
scaffolding/tests/semantic_invalid/aggregate_inferred_copy.tower
scaffolding/tests/semantic_invalid/argument_type.tower
scaffolding/tests/semantic_invalid/comptime_capture.tower
scaffolding/tests/semantic_invalid/comptime_cycle.tower
scaffolding/tests/semantic_invalid/comptime_dead_pointer.tower
scaffolding/tests/semantic_invalid/comptime_defer_cycle.tower
scaffolding/tests/semantic_invalid/comptime_fuel.tower
scaffolding/tests/semantic_invalid/comptime_generic_selected.tower
scaffolding/tests/semantic_invalid/comptime_output.tower
scaffolding/tests/semantic_invalid/comptime_return.tower
scaffolding/tests/semantic_invalid/comptime_uninitialized.tower
scaffolding/tests/semantic_invalid/declaration_index_cycle.tower
scaffolding/tests/semantic_invalid/declaration_index_type.tower
scaffolding/tests/semantic_invalid/decltype_aggregate_operator.tower
scaffolding/tests/semantic_invalid/decltype_body_comptime.tower
scaffolding/tests/semantic_invalid/decltype_body_runtime.tower
scaffolding/tests/semantic_invalid/decltype_cycle.tower
scaffolding/tests/semantic_invalid/decltype_field_cycle.tower
scaffolding/tests/semantic_invalid/decltype_generic_header_cycle.tower
scaffolding/tests/semantic_invalid/decltype_header_cycle.tower
scaffolding/tests/semantic_invalid/decltype_layout_cycle.tower
scaffolding/tests/semantic_invalid/decltype_parameter_cycle.tower
scaffolding/tests/semantic_invalid/decltype_parameter_field_cycle.tower
scaffolding/tests/semantic_invalid/decltype_type_field_cycle.tower
scaffolding/tests/semantic_invalid/decltype_unknown.tower
scaffolding/tests/semantic_invalid/enum_address.tower
scaffolding/tests/semantic_invalid/enum_duplicate.tower
scaffolding/tests/semantic_invalid/enum_index.tower
scaffolding/tests/semantic_invalid/enum_mix.tower
scaffolding/tests/semantic_invalid/enum_number.tower
scaffolding/tests/semantic_invalid/enum_operation.tower
scaffolding/tests/semantic_invalid/enum_overflow.tower
scaffolding/tests/semantic_invalid/generic_body_demanded.tower
scaffolding/tests/semantic_invalid/inference_alias_invalid.tower
scaffolding/tests/semantic_invalid/inference_cycle.tower
scaffolding/tests/semantic_invalid/inference_generic_cycle.tower
scaffolding/tests/semantic_invalid/layout_cycle.tower
scaffolding/tests/semantic_invalid/literal_range.tower
scaffolding/tests/semantic_invalid/match_break.tower
scaffolding/tests/semantic_invalid/match_duplicate.tower
scaffolding/tests/semantic_invalid/match_range.tower
scaffolding/tests/semantic_invalid/match_scope.tower
scaffolding/tests/semantic_invalid/match_type.tower
scaffolding/tests/semantic_invalid/missing_return.tower
scaffolding/tests/semantic_invalid/template_origin.tower
scaffolding/tests/semantic_invalid/while_type.tower
scaffolding/tests/semantic_invalid/worker_body_errors.tower
scaffolding/tests/semantic_invalid/worker_field_errors.tower
scaffolding/tests/semantic_invalid/worker_first_error.tower
scaffolding/tests/semantic_invalid/worker_generic_errors.tower
scaffolding/tests/semantic_invalid/worker_generic_mismatch.tower
scaffolding/tests/semantic_invalid/worker_index_errors.tower
scaffolding/tests/semantic_invalid/worker_later_error.tower
scaffolding/tests/semantic_invalid/worker_leaf_errors.tower
scaffolding/tests/semantic_invalid/worker_operator_cycle.tower
scaffolding/tests/semantic_invalid/worker_prefix_error.tower
scaffolding/tests/semantic_invalid/worker_suffix_error.tower
scaffolding/tests/semantic_invalid/worker_type_errors.tower
scaffolding/tests/semantic_world.tower
scaffolding/tests/semantics.tower
scaffolding/tests/sha256_checks.tower
scaffolding/tests/shared_entities.tower
scaffolding/tests/statement_queries.tower
scaffolding/tests/storage.tower
scaffolding/tests/storage_api.tower
scaffolding/tests/storage_main.tower
scaffolding/tests/stress/annotated.tower
scaffolding/tests/stress/annotated_operators.tower
scaffolding/tests/stress/comment_functions.tower
scaffolding/tests/stress/generic_explicit.tower
scaffolding/tests/stress/generic_inferred.tower
scaffolding/tests/stress/generic_workers.tower
scaffolding/tests/stress/inferred.tower
scaffolding/tests/stress/inferred_operators.tower
scaffolding/tests/stress/llvm_functions.tower
scaffolding/tests/stress/type_fields.tower
scaffolding/tests/stress/wide_declarations.tower
scaffolding/tests/stress/wide_functions.tower
scaffolding/tests/stress/wide_registers.tower
scaffolding/tests/stress/window.tower
scaffolding/tests/stress/workers.tower
scaffolding/tests/stress_sources.tower
scaffolding/tests/struct_value_checks.tower
scaffolding/tests/struct_values.tower
scaffolding/tests/syntax_emission.tower
scaffolding/tests/syntax_emission_api.tower
scaffolding/tests/syntax_emission_entry.tower
scaffolding/tests/syntax_emission_oracle.tower
scaffolding/tests/syntax_expansion.tower
scaffolding/tests/syntax_invalid/match_default.tower
scaffolding/tests/syntax_invalid/while_braces.tower
scaffolding/tests/syntax_lexer.tower
scaffolding/tests/syntax_live.tower
scaffolding/tests/syntax_live_attributes.tower
scaffolding/tests/syntax_live_grammar.tower
scaffolding/tests/syntax_live_lexical.tower
scaffolding/tests/syntax_live_replacements.tower
scaffolding/tests/syntax_live_support.tower
scaffolding/tests/syntax_nodes.tower
scaffolding/tests/syntax_reader.tower
scaffolding/tests/syntax_replacements.tower
scaffolding/tests/syntax_scan.tower
scaffolding/tests/syntax_template.tower
scaffolding/tests/syntax_validation.tower
scaffolding/tests/syntax_validation_fixture.tower
scaffolding/tests/target_once.tower
scaffolding/tests/target_pack_import_checks.tower
scaffolding/tests/target_registry_checks.tower
scaffolding/tests/target_runner_exit.tower
scaffolding/tests/tool_archive_checks.tower
scaffolding/tests/tool_files_checks.tower
scaffolding/tests/tool_process_checks.tower
scaffolding/tests/tool_words_checks.tower
scaffolding/tests/type_binding_checks.tower
scaffolding/tests/type_bindings.tower
scaffolding/tests/type_object_values.tower
scaffolding/tests/utf8.tower
scaffolding/tests/utf8_boundary.tower
scaffolding/tests/utf8_oracle.tower
scaffolding/tests/utility_checks.tower
scaffolding/tests/validation_oracle.tower
scaffolding/tests/wasm_link_exports.tower
scaffolding/tests/wasm_link_fixture.tower
scaffolding/tests/wasm_link_job_checks.tower
scaffolding/tests/wasm_link_library.tower
scaffolding/tests/wasm_link_program.tower
scaffolding/tests/wasm_link_reactor.tower
scaffolding/tests/wasm_link_reader.tower
scaffolding/tests/wasm_link_reader_native.tower
scaffolding/tests/wasm_link_reader_threads.tower
scaffolding/tests/wasm_link_reader_wasi.tower
scaffolding/tests/wasm_link_shared.tower
scaffolding/tests/wasm_link_shared_generate.tower
scaffolding/tests/wasm_link_tls.tower
scaffolding/tests/wasm_link_tls_generate.tower
scaffolding/tests/work_access.tower
scaffolding/tests/work_graph.tower
scaffolding/tests/work_graph_scale.tower
scaffolding/tests/work_instrumented.tower
scaffolding/tests/work_named.tower
scaffolding/tests/work_observe.tower
scaffolding/tests/work_order.tower
scaffolding/tests/work_pool.tower
scaffolding/tests/work_resume.tower
scaffolding/tests/worker_iteration.tower
scaffolding/tests/worker_modules/left.tower
scaffolding/tests/worker_modules/main.tower
scaffolding/tests/worker_modules/right.tower
```

## D2

```text
bootstrap/linux-x64/share/tower/backend/foreign_grammar.tower
bootstrap/linux-x64/share/tower/bedrock.tower
bootstrap/linux-x64/share/tower/foundation.tower
bootstrap/linux-x64/share/tower/foundation_syntax.tower
bootstrap/linux-x64/share/tower/library/ar_archive.tower
bootstrap/linux-x64/share/tower/library/bytes.tower
bootstrap/linux-x64/share/tower/library/bytes_interface.tower
bootstrap/linux-x64/share/tower/library/bytes_types.tower
bootstrap/linux-x64/share/tower/library/coff_import_object.tower
bootstrap/linux-x64/share/tower/library/compiler_work.tower
bootstrap/linux-x64/share/tower/library/compiler_work_types.tower
bootstrap/linux-x64/share/tower/library/crc32.tower
bootstrap/linux-x64/share/tower/library/deflate.tower
bootstrap/linux-x64/share/tower/library/entities.tower
bootstrap/linux-x64/share/tower/library/entity_api.tower
bootstrap/linux-x64/share/tower/library/entity_stage.tower
bootstrap/linux-x64/share/tower/library/entity_types.tower
bootstrap/linux-x64/share/tower/library/float_bits.tower
bootstrap/linux-x64/share/tower/library/float_text.tower
bootstrap/linux-x64/share/tower/library/gzip.tower
bootstrap/linux-x64/share/tower/library/platform.tower
bootstrap/linux-x64/share/tower/library/queue.tower
bootstrap/linux-x64/share/tower/library/sha256.tower
bootstrap/linux-x64/share/tower/library/stack.tower
bootstrap/linux-x64/share/tower/library/storage.tower
bootstrap/linux-x64/share/tower/library/vector.tower
bootstrap/linux-x64/share/tower/library/work_graph.tower
bootstrap/linux-x64/share/tower/library/work_pool.tower
bootstrap/linux-x64/share/tower/library/zip_archive.tower
bootstrap/linux-x64/share/tower/tower.tower
bootstrap/linux-x64/share/tower/types.tower
bootstrap/linux-x64/share/tower/types/bool.tower
bootstrap/linux-x64/share/tower/types/f32.tower
bootstrap/linux-x64/share/tower/types/f64.tower
bootstrap/linux-x64/share/tower/types/i16.tower
bootstrap/linux-x64/share/tower/types/i32.tower
bootstrap/linux-x64/share/tower/types/i64.tower
bootstrap/linux-x64/share/tower/types/i8.tower
bootstrap/linux-x64/share/tower/types/integer.tower
bootstrap/linux-x64/share/tower/types/u16.tower
bootstrap/linux-x64/share/tower/types/u32.tower
bootstrap/linux-x64/share/tower/types/u64.tower
bootstrap/linux-x64/share/tower/types/u8.tower
bootstrap/linux-x64/share/tower/types/usize.tower
bootstrap/linux-x64/share/tower/types/void.tower
scaffolding/benchmarks/interpreter_arithmetic.tower
scaffolding/benchmarks/interpreter_branch.tower
scaffolding/benchmarks/interpreter_calls.tower
scaffolding/benchmarks/interpreter_memory.tower
scaffolding/benchmarks/interpreter_profile.tower
scaffolding/tools/bootstrap_comparison.tower
scaffolding/tools/bootstrap_package.tower
scaffolding/tools/bootstrap_symbols.tower
scaffolding/tools/build_tools.tower
scaffolding/tools/check_core.tower
scaffolding/tools/compiler_project_files.tower
scaffolding/tools/compiler_project_inputs.tower
scaffolding/tools/compiler_project_output.tower
scaffolding/tools/compiler_project_package.tower
scaffolding/tools/compiler_support.tower
scaffolding/tools/link_wasi.tower
scaffolding/tools/llvm_scripts.tower
scaffolding/tools/package_bootstrap.tower
scaffolding/tools/package_compiler_project.tower
scaffolding/tools/package_playground_assets.tower
scaffolding/tools/package_roku.tower
scaffolding/tools/package_targets.tower
scaffolding/tools/prepare_llvm.tower
scaffolding/tools/remove_const.tower
scaffolding/tools/roku_package.tower
scaffolding/tools/target_pack.tower
scaffolding/tools/target_pack_imports.tower
scaffolding/tools/tool_capture_linux.tower
scaffolding/tools/tool_files_linux.tower
scaffolding/tools/tool_files_posix.tower
scaffolding/tools/tool_process_linux.tower
scaffolding/tools/tool_streams_posix.tower
scaffolding/tools/tool_words.tower
scaffolding/tools/verify_bootstrap_symbols.tower
scaffolding/tools/verify_compiler.tower
scaffolding/tools/wasi_link_recipe.tower
scaffolding/tools/wasm_link_audit.tower
```

### D1 integrated inventory at eabc88e, before latest execution handoff

Exact tracked census:1,035 Tower paths = baseline1,011 +38 new -14 deleted.
The deleted paths are precisely the consolidated primitive type forwarders;
bootstrap's pinned historical resources remain untouched. D1's direct tracked
scope is461 = initial437 +24 new tests. All24 new bodies have substantive source
receipts in the D1 audit, including preserved historical negative sanitizer
fixtures that are not registered or rerun. New source reviews outside the current
tracked tree stay incoming receipts rather than inflating integrated coverage.

Authorized incoming `scaffolding/tests/entity_stage_concurrent.tower` is D1 roster,
A2 implementation, SHA26265ebb52427481465d0fe88101e4ccded781e356be71cc9244b84d5882f0e7.
Its complete ownership/staging/overlap review is now in the D1 audit; pending
commit will increase the tracked totals to1,036 and462 respectively. This index
is inventory accounting, not final merged compiler/runtime acceptance.

Latest execution handoff adds `scaffolding/tests/execution_rejection.tower`,
`execution_type_construction.tower` and `source_execution_reachability.tower`:
all D1 roster, L1 specific implementation. First two advance existing incoming
rows to integrated, third is new and substantively reviewed in the D1 audit.
After this handoff commit:1,039 total tracked Tower paths,465 D1 direct paths.
These arithmetic counts preserve the separate14 deleted forwarders and do not
include unintegrated owner measurement snapshots as tracked files.

Incoming A1 capture successor adds `scaffolding/tests/semantic_capture_module.tower`
(D1 roster/A1 implementation), delivered in full lifecycle patch0ceb023a and
reviewed with its30-case consumer. It is not yet integrated: tracked totals stay
1,039/465direct at3125aaf; eventual adoption adds exactly one path, not three,
since lifecycle/source-proof files already exist. Their new hashes are update
receipts, not duplicate inventory rows.

After40768d9, the next prepared closure adds three source paths:

| Path | Audit lane | Implementation owner | Review |
| --- | --- | --- | --- |
| scaffolding/tests/backend_execution_roots.tower | D1 | B2 | Full32-line fixture, SHA dda143e6; native file registration and exact45,2 oracle reviewed, runtime pending. |
| scaffolding/tests/semantic_layout_profile.tower | D1 | A1 | Full191-line v2, SHA dc299e61; explicit world/budget/job spans/cleanup and limitations recorded in D1 audit, opt-in only. |
| scaffolding/benchmarks/compiler_wide_functions.tower | D2 | D2 | Exact0caf05cc handoff; D1 read12-line shared-generator/import/cleanup wrapper as integration review, not duplicate ownership credit. |

When these prepared additions enter the index, totals are1,042 Tower paths and
467 D1 direct paths. Pending A1 semantic_capture_module remains unintegrated
and would add one more D1 path; its lifecycle/source-proof consumers are updates,
not additional files. These counts are scope accounting, not runtime acceptance.

Post2451cfd preparation adds semantic_capture_module.tower (A1 implementation,
D1 audit, full5-line3019815e) and standalone type_reachability_profile.tower
(L2 implementation/D1 harness, full153-line9f1c9657). Lifecycle/source-proof
updates are not new paths. Once staged, totals are1,044 tracked Tower paths
and469 D1 direct paths; all added bodies have substantive D1 review above.
This is review coverage, not full v3 or cross-host runtime acceptance.

B2's additional104-line `scaffolding/tests/backend_execution_index.tower` is
now fully reviewed and adopted (patchdb1807dd), D1 roster/B2 implementation.
Including the two additions above gives1,045 tracked Tower paths and470 D1
direct paths when staged. Generic registration is pending the owning backend
object's narrow import handoff; presence is not an executed test. Updated
registry/editor/parser/driver consumers are existing rows, not new inventory.

After453d8b1, two additional D1 paths are fully reviewed: new
`scaffolding/tests/aggregate_capture_inputs.tower` (L1 source0a47c49d) and
`scaffolding/tests/parser_trace_failures.tower` (B1 source6df8c085). Their full
ownership/coverage findings are in the audit. Once staged, totals are1,047
tracked Tower files /472direct D1 files. Updated42-case lifecycle, call-query,
entity tables/stage, parser/storage and generic runners remain existing paths.
These totals exclude incoming unadopted backend helper files and do not imply
runtime or release acceptance.

Post01946 adds `scaffolding/tests/comptime_capture_values.tower`, D1 source/audit,
full8-lineebf8e86a. It imports the unchanged original capture fixture and checks
value/type independently. After staging:1048tracked Tower paths/473D1direct.
All new/current test bodies have substantive audit receipts; normal/fault/query
updates above are existing paths, not additional inventory. Aggregate source
current25e8 plusd982 supersedes initial0a47 draft; failed receipts remain historical.

Postbab4c34 retained-buffer handoff71d28d31 adds six exact owner sources:

| Path | Audit lane | Implementation owner | Review |
| --- | --- | --- | --- |
| scaffolding/library/work_buffer.tower | A2 | A2 | D1 supporting API review ccc61ca8; allocation/grant transfer and rollback, no production-owner credit inferred. |
| scaffolding/library/work_vector.tower | A2 | A2 | D1 supporting API review7e95b161; distinct budgeted descriptor/alignment/borrow lifetime. |
| scaffolding/tests/work_buffer.tower | D1 | A2 | Full88lines e08c4c2f; explicit retention/denial/move/swap/stale/alignment/cleanup oracles. |
| scaffolding/tests/work_buffer_faults.tower | D1 | A2 | Full46lines d2f6c729; serial ledger/physical failure rollback and exact allocator cleanup. |
| scaffolding/tests/work_buffer_shared.tower | D1 | A2 | Full105lines8d5f8a5a; actual four-worker barriers, cancel/denial, retained ownership after join. |
| scaffolding/tests/work_buffer_profile.tower | D1 | A2; D2 measurement audit | Full129lines16821eb3; equivalent baseline/accounted buffers and measured overlap/cost, explicit accounting/timing limits. |

Once staged, totals are1054tracked Tower paths/477D1direct. Existing allocator,
known-order and generic harness updates are not new paths. All added bodies have
substantive D1 review in the audit; no local compile/runtime pass is claimed yet.

After 4a5d872, the previously incoming-only
`scaffolding/tests/module_cache_profile.tower` is adopted as the exact 175-line
B2 source 0930654a, with D2 measurement ownership and D1 full audit/registration.
The existing frontend profile is updated to D2's 57e392d9 transport guard; it is
not a second path. This gives 1,055 tracked Tower files / 478 D1 direct paths once
staged. Both full bodies have substantive audit receipts; registration/runtime
acceptance is still pending.
