# A2 static release-artifact review: b0f507c6

2026-11-23. Thread 01a2046f-fec2-7c71-be46-cad28f9ac147. Documentation only.

## Boundary

Reviewed the four supplied metadata files in ROOT_release_artifact_audit_b0, checked-in packaging/consumer contracts, and Git source objects. No compiler, instrumentation, fault injection, target/browser program, archive extraction or reconstructed executable was run for this review. Metadata agreement is not runtime validation, whole-generation acceptance or standalone portability.

The previously started tower-a2-ownership-fixed-build had already exited0 at the first inspection. Earlier source edits, binaries, logs and the ASan null-source failure remain preserved. The user-reported service-level rejection remains binding; the final sanitizer gate is OPEN. No rejected operation was retried. The old52-case unchanged storage evidence retains its separate frozen scope.

## Supplied identities

| File | Actual SHA256 read here | Result |
| --- | --- | --- |
| project.json | 748997326a3a385e7f31a2bd5d0150d51df492202749493dc8669699620d5ef9 | Matches both artifacts.sha256 and files.json; 4,978,659 bytes |
| files.json | 40ea99408983c7284e045125ee0b2b580b05980eaf55dfd0c052cf763aad7d63 | 20 unique named files; valid positive sizes/64-digit hashes |
| artifacts.sha256 | a945d7392812ee5863e8149353d79e6dfa451a3d19a52a6daaf60e35849942ce | Three reactor hash assertions plus project.json |
| identity.txt | d6eadea9a272d717c0c113946cf2bf9048d87b4d9328789465071d2ae877cb25 | Claims frozen b0f507c6ad4bdaec4a3b87ddd943e647ba393eaa, public768 bootstrap, normal IDE_OFF/LLVM_CROSS_ON build; explicitly says release NOT accepted |

Only project.json payload bytes were supplied here. Reactor/support hashes below are recorded assertions, not independently rehashed binary payloads. No archive member listing or object-by-object build/provenance manifest was supplied.

| Reactor path | Supplied SHA256 |
| --- | --- |
| build/browser-wasi/tower.wasm | 308150ecab0ff80e3985f06305530ffa68e763e64a5b8c35ac04cd1729f4b23d |
| build/browser-wasi-llvm/tower-llvm.wasm | 64f508684f74eff491a78128820497bcb00d4270c6fba1cbb6d20395635468bb |
| build/browser-wasi-llvm/tower-cross.wasm | 7e874158f03bc2e9ab43b746dd28ad4d702edef2d03b7ab1ca656a6bbeb6491b |

## Recipe closure

| Recipe | Editable units / linked .o | Function exports / matching link flags | Referenced support | Compressed bytes (inventory) | Declared expanded support bytes |
| --- | ---: | ---: | --- | ---: | ---: |
| tower | 19 / 19 | 1241 / 1241 | support-tower-0.a.gz; imports-tower-13.txt.gz | 177856 | 424175 |
| llvm | 20 / 20 | 1281 / 1281 | support-llvm-0 through3.a.gz | 29231314 | 85742072 |
| cross | 21 / 21 | 1284 / 1284 | support-cross-0 through4.a.gz | 36867048 | 114757684 |

All24 unit keys/entry paths/object names are unique; each entry is present. Every recipe key resolves to its corresponding .o exactly once. All11 named support files are inventoried, and decompressed names match link arguments. Every one of3806 export entries matches an --export-if-defined argument; no duplicate export occurs within a recipe. work_thread_entry appears in all three; tw_candidate_check belongs to the portable candidate. Actual Wasm export presence is deferred: the consumer checks it after linking.

All recipes use tower-wasm-ld, no entry, exported memory, stack-first, link threads1, stack8MiB, initial memory32MiB, maximum2GiB and strip-all. Link threads1 is not evidence of compiler-worker overlap or shared linear memory. The portable recipe explicitly preserves tw_foreign_call and its allow-import file; LLVM/cross preserve both mapped-memory wrappers. All paths are relative and have no traversal, absolute prefix or backslash. This validates the supplied names, not a universal path-security proof.

The consumer compiles optimized wasm32 object profile1 with library '.', using each entry/import closure and packaged grammars. These profile/target semantics live in compiler-build.mjs/compiler-unit.mjs and host bindings, not explicit project.json fields. Keep their source identity with the recipe.

### Every unit

T=tower, L=llvm, C=cross. Entries are under units/; their names use underscores, corresponding object names retain the established hyphen/underscore ABI.

| Object | Entry | Recipes | Direct source imports |
| --- | --- | --- | --- |
| compiler-ide.o | units/compiler_ide.tower | tower | tower; host.ide_state; host.ide_selftest; host.ide_parser; host.ide_tree; host.ide_completion; host.ide_execution; host.ide_artifacts; host.ide_candidate |
| compiler-interpreter.o | units/compiler_interpreter.tower | tower | tower; .compiler.units.interpreter_browser |
| compiler-parser-nodes.o | units/compiler_parser_nodes.tower | tower, llvm, cross | compiler.units.parser |
| syntax-live-cases.o | units/syntax_live_cases.tower | tower, llvm, cross | tower; .tests.syntax_live |
| compiler-parser-format.o | units/compiler_parser_format.tower | tower, llvm, cross | tower; .compiler.parser_presentation |
| compiler-parser-integration.o | units/compiler_parser_integration.tower | tower, llvm, cross | tower; .compiler.parser_integration |
| compiler-parser-fixtures.o | units/compiler_parser_fixtures.tower | tower, llvm, cross | tower; .tests.parser_integration |
| compiler-template-build.o | units/compiler_template_build.tower | tower, llvm, cross | tower; .compiler.units.template_build |
| compiler-syntax-host.o | units/compiler_syntax_host.tower | tower, llvm, cross | tower; .host.syntax_baseline |
| compiler-semantics.o | units/compiler_semantics.tower | tower, llvm, cross | tower; .compiler.units.semantics_checks |
| compiler-frontend-units.o | units/compiler_frontend_units.tower | tower, llvm, cross | tower; .compiler.frontend_units |
| compiler-query-checks.o | units/compiler_query_checks.tower | tower, llvm, cross | tower; .tests.evaluation_query_checks |
| compiler-entities.o | units/compiler_entities.tower | tower, llvm, cross | tower; .compiler.units.entities |
| shared-lifecycle.o | units/shared_lifecycle.tower | tower, llvm, cross | tower; .host.entity_lifecycle |
| compiler-legacy.o | units/compiler_legacy.tower | tower, llvm, cross | tower; .host.legacy |
| compiler-utf8.o | units/compiler_utf8.tower | tower, llvm, cross | tower; .compiler.utf8 |
| compiler-bytes.o | units/compiler_bytes.tower | tower, llvm, cross | tower; .library.bytes |
| compiler-host.o | units/compiler_host.tower | tower, llvm, cross | compiler.units.host_wasi |
| tower_work_host.o | units/tower_work_host.tower | tower, llvm, cross | tower; host.work_dispatch; host.work_portable |
| compiler-evaluation.o | units/compiler_evaluation.tower | llvm, cross | tower; .compiler.units.evaluation |
| backend-wasm.o | units/backend_wasm.tower | llvm | tower; compiler.units.backend_core; backend.file_posix; backend.targets_wasm; compiler.units.backend_wasi_wasm; tower_runtime |
| backend-linker.o | units/backend_linker.tower | llvm, cross | tower; backend.linker_tower_wasm |
| backend-native.o | units/backend_native.tower | cross | tower; compiler.units.backend_core; backend.file_posix; backend.targets_native; compiler.units.backend_wasi_native; tower_runtime |
| backend-macho.o | units/backend_macho.tower | cross | tower; backend.linker_tower_macho |

### Referenced support identities (metadata only)

| File | Bytes | SHA256 |
| --- | ---: | --- |
| imports-tower-13.txt.gz | 37 | b08119bfd12d127bcdf6c7b7cc82f1754a7c4baa9290a1cb4807cc1f60070c5d |
| support-cross-0.a.gz | 8994052 | d583c8ede97ce7440bb4c0caac0cbd34deb4e2306cb9a5e8244d4c5aa3556a6c |
| support-cross-1.a.gz | 9348146 | 62a068e5b1b879686c45a94d02978014e9afe6dfdea2b15e682098586148e9ad |
| support-cross-2.a.gz | 9053107 | 2847b6babd5d4830ba8cc4e97f8584b530f887b788de0337bb0b51c1b038db37 |
| support-cross-3.a.gz | 7267649 | f6b1ba67c7bd22c145b3743a38cecc1767817d83edb65bcba837fb3afc16ee40 |
| support-cross-4.a.gz | 2204094 | 50c8cce713d11c1a06bc8c08bf58148ea49a5a492b980a2ee7967e19e6e3a6ab |
| support-llvm-0.a.gz | 9566225 | 3530b758d64b26bf5f99e35057235f1908588f90d762b1b79baef355e20348e5 |
| support-llvm-1.a.gz | 8773146 | 73217ae30d464ee0b0684927fd3cd3f8ff07e01a8e8d59b280e03517e00ae5cf |
| support-llvm-2.a.gz | 9638326 | 324555f177bfc494bdb205f48bd7ac824093a7b53840fbcda2135bec7464ac8c |
| support-llvm-3.a.gz | 1253617 | f30b08e476b9a3f8e874630f2aa5070125af8195c6ecee4dfe8d0e320f42ca10 |
| support-tower-0.a.gz | 177819 | ee7d1dd96ab64748c050c93a31928cc1ea46e6e8ea767bf179a1a62eb4d5d8c2 |

Eight inventory entries are unreferenced: imports-tower-18.txt.gz, support-llvm-4.a.gz, and {tower,llvm,cross}-runtime-{allocate,trap}.o. Both import-file hashes agree; the six runtime names form two equal-hash groups. They are not evidence of missing current recipe inputs. compiler_project_publish replaces current products but deliberately does not clean stale output; build.mjs copies project.json plus only the current recipe.support lists. Do not deploy a raw directory glob or treat these eight extras as verified active support. No deletion is needed for this review.

## Sources, support policy and limits

557 unique embedded paths comprise compiler259, backend119, host96, library36, tests17, five root preludes and25 generated units/runtime files. No unsafe/duplicate source path was found. All five root modules, backend/foreign_grammar.tower and units/tower_runtime.tower are present. The generated runtime is37,956 UTF-8 bytes, SHA256d3ca12af728705777420ca9d98dc869ae8bb593c5151442ed778ef1ae0eba831.

A lexical check of simple top-level imports in the declared recipe closures found304/359/395 reachable files for tower/llvm/cross and no missing lexical candidate. This is static source inspection, not the compiler's import resolver or proof for dynamic syntax. Whole-tree copying also includes unused check/tool profiles with25 simple import edges to unbundled test/tool modules; these are outside all three declared recipe closures. The package is an editable browser recipe closure, not a complete development checkout. D1's broader source-delta/Semantics import audit remains separate.

compiler_project_files collects compiler/host/backend/library trees and five preludes, then compiler .d imports for selected units; wrappers map to the actual Tower sources. compiler_project_memory splits the memory archive: compiler-host/work-host remain editable, reserved runtime ABI objects stay exact prebuilt support. compiler_support selects transitive strong references from actual object symbols, preserves stable archive order/duplicate physical rows, excludes rebuilt Tower objects, renames selected support members by ordinal, and emits fresh archive indexes/gzip. These inspected algorithms explain the intended closure; the supplied aggregate hashes cannot independently prove which members were emitted. Final support verification needs physical member identity, source/provider and hash mappings, including reserved runtime objects, upstream LLVM/libc/compiler-rt, licenses and target profile. Duplicate archive basenames are allowed physical rows and must not be silently deduplicated.

compiler_project_file/unit replace repeated names when collecting multiple profiles. The current single embedded runtime and shared source entries therefore need producer depfiles/hashes from each actual build to establish cross-profile agreement. No divergent overwrite is proven by this metadata. project.json omits per-unit object hashes, source/predecessor/build identities, compiler/tool versions, exact build flags, support-member provenance and hashes embedded per support item; retain a companion release manifest instead of treating schema version1 as a standalone release attestation.

## Remaining publication requirements

| Boundary | Checked static mapping | Required evidence still outside this review |
| --- | --- | --- |
| Normal frontend | Portable19-unit recipe, preludes/library/foreign grammar, declared exports/support | Rehash actual final reactor and support payloads; bind depfiles/object/link/compiler identities and complete builtin/resource/asset manifest to one source snapshot |
| Shared frontend | Separate build-threads.sh path; build.mjs copies tower-threads.wasm only when present | Mandatory TOWER_REQUIRE_THREADS=1, exact shared artifact/source/resource hash and shared-memory/link/export profile; D2's actual browser overlap/cancel/stale/cleanup results; hosted isolation/worker lifecycle checks |
| LLVM |20-unit wasm backend recipe, four support packs, mapped-memory wrappers | Actual object/archive/member hashes and link identities; candidate LLVM/Graph/Fast/reconstruction execution acceptance; LLVM/toolchain/licenses closure |
| Cross |21-unit native backend recipe, five support packs | Five runtime objects for x86_64-pc-windows-msvc, x86_64-unknown-linux-gnu, aarch64-unknown-linux-gnu, x86_64-apple-macos11, arm64-apple-macos11, plus kernel32.lib/libSystem.tbd. None of these seven target-pack identities is in supplied files.json. Preserve exact target/foreign ABI/loader policy; object emission is not actual-host standalone execution |
| Browser generations | test-compiler-project builds all24 units and three reactors twice with an edited diagnostic; successor checks precede activation; hashes must match | First edited generation is explicitly failed at module completion. A1 owns repair. Both complete successful generation receipts, all object/reactor hashes, executed edit, exports, canonical/Graph/Fast/LLVM/native checks and cancellation/stale publication remain pending |
| Complete release provenance | Source/predecessor/native-generation boundaries are separate | Bind normal/shared/LLVM/cross + target packs + compiler project + UI/builtins/licenses to the final frozen source and actual public predecessor/build toolchains. Native fixed point does not validate b0 browser inputs, later fixes or clean standalone hosts |
| Pages | Existing Pages6f142bef runtime is old | ROOT must preserve current CNAME/manifests, require backends and threads, hash complete tested dist, keep source/build commits reachable from published main, and normal atomic-push main with deployment commit to gh-pages. Verify exact served manifest/assets/workflow and applicable hosted behavior. No deployment occurred here |

Do not loosen candidate checks or interpret --export-if-defined, inventory presence, successful packaging or native-generation equality as browser acceptance. This review found actionable missing provenance/coverage, not a demonstrated packaging-source algorithm defect requiring an implementation edit. Runtime profiling is inapplicable: documentation-only work, no production code change.

## Independently checked source/provenance boundary

Git fetched complete published history, then the required pull fast-forwarded this clone to ce4f7240392b283a2af9d8cf378a359b32aa7dda. b0f507c6ad4bdaec4a3b87ddd943e647ba393eaa (tree0eb8242708b77adbc8daa63378c22aea2a57fbea), 2013ad28ce57d5ce6bb18683aa89062603526aee and252b424ab770a0b334f31fa68eede1f1584a5acc are all reachable from fetched published main;252b and2013 precede b0. This is Git ancestry, not additional execution evidence.

All532 non-generated embedded source texts exactly match their b0 Git blob hashes. No compiler/host/backend/library .tower source in b0 is omitted. The remaining25 entries are24 packaging-generated wrappers plus the generated runtime; their mappings were reviewed above, but no original build depfiles/generated-input hashes accompanied the supplied metadata. The exact comparison is retained as embedded_source_git_utf8.csv in the external report directory. An initial Windows-default-decoding comparison showed four false mismatches in non-ASCII source; explicit UTF-8 reading produces532/532 exact matches. The initial CSV is retained separately, not used as evidence of a source defect.

The reviewed packaging/consumer sources are byte-identical between b0 and the reconciled main: compiler_project_{inputs,files,package,output}.tower, compiler_support.tower, package_compiler_project.tower, package_playground_assets.tower, bootstrap_package.tower; playground compiler-build/compiler-unit/llvm-host/targets and build/test-compiler-project sources. Their exact b0 blob IDs are retained in reviewed_sources_git.txt. This does not freeze unrelated current compiler code.

| Provenance boundary | Exact identity and established receipt | Exclusions |
| --- | --- | --- |
| Complete native fixed point | docs/compiler_generation_252b424a.md; frozen source252b424a/tree14675a432d410badc6c548370b8632d506b6861e;34 complete compiler/runtime/helper objects/archive/executables and53 payload files plus checksums match in generations2/3;1166 source hashes | Later L2 module/inspection and A1/L1 deltas; old predecessor/object adjacency mismatch remains historical FAILED; standalone restricted environment still lacked Clang |
| Public predecessor lineage | Old pin9653f8187a104ca84ab5d8601f336d7e1ed8200206544c70a81415018d623d02 -> native gen1 e885c76780e2e00c5e8ca80786ac87ca1f93f294276867a33923a2a0d342f65c -> gen2/gen3 768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138 | Compiler equality does not erase distinct predecessor/build-command provenance |
| Published package adopted2013ad28 | Actual read here: towerc768a0cdf (2236032 bytes); development.json5b6f9a0fed461fcdc1640a2be948ff47cb7712e41bb80915062ae2a8735db857; SHA256SUMSbd4639d8b9cf9e9ed0b7052725466856b585d094841b2e54c4ec835d4646bd80. All53 manifest payload hashes independently matched checked-in files. Manifest source252b and predecessor768a0cdf match the generation3 receipt | Hash reads only; no executable launched. Dynamic dependency names/paths include external LLVM/OS libraries and do not establish portable closure |
| ROOT canonical2013 adoption | Published journal says fresh52-action normal build with override unset selected public pin;45.83wall/124.90CPU/1016164KiB; relocated development checks7.41wall/9.04CPU/217384KiB; resulting compilerfeed7d647835c9c305487b38faa783f19d120c2528baeebc1b2e2f45af1b8e8b | This is a reviewed existing receipt, not a rerun or later-source native fixed point |
| b0 browser build | Published ROOT receipt196a2d0f agrees with all four supplied artifact hashes. Normal28 actions65.96wall/125.41CPU/1041372KiB; LLVM/cross40 actions plus packaging109.12wall/199.56CPU/1041676KiB. Public768 pin, LLVM19.1.1/WASI SDK34, CPU8-15,16GiB, jobs4/compiler1, IDE_OFF/CROSS_ON | Build success only; before later A1/L1/B1/L2 inputs. b0 and2013 compiler/build/transport sources match, but the native clean-build receipt is not browser execution evidence |
| First edited browser generation | All24 units compiled/all three reactors linked, then Candidate module completion check failed; no candidate accepted; generation2 never ran | Wrapper0 is explicitly invalid evidence: native exit was not captured. Preserve result_review.json and first failure; A1 repair and both generations remain required |
| D2 separate shared receipt | Frozen2013, IDE_ON portable0b9d22e60d545e82e6079addd6c67e8e6c6ebc607036c5b4a8143ff4aca08bae; shared631030b76e2856ec74e417f100f3fcac8bb9fa1827647f8b536f468786b40a82; worka1f9a66e310478ff2e27b650f865c2896f3cbafb92e1bfb96186f9435d4ca3b0. Published report records a successful production pool trial and failed coordinator-retirement acceptance | Compiler1/4 query/stage/LR/world/canonical phases were not reached; normal IDE alias completion also failed. No complete shared acceptance or b0 normal artifact equivalence; later affected semantics needs D2/ROOT adoption |
| Current Pages | Git6f142bef15f58380831ed344ab5eac5c4b3c2840 contains manifest blobc0c17f4ac2b3ef7747e044c91022c72842dd35ed; ROOT journal records served SHA256eb70f5388bee6b7ca318583eddfaa8e9a8a907c642a14a6fde85375ac8b1643c | Old runtime, no new fetch/probe/hosted validation performed here |

## Preserved workspace and handoff

The pull encountered a new concurrent upstream backend-import test selector after the initial non-overlap check. The conflict was resolved by retaining both that upstream selector/import and the prior ownership-delta selector/import. No test assertion or ownership behavior was changed for this task. Existing frontend_modules +1 and storage_main +8 remain unstaged and excluded from this documentation commit. The auto-stash ba4408aa and original frozen source patches/logs remain retained; nothing was dropped. Both prior tasks' failed/passed evidence remains scoped to its actual input hashes; no new instrumentation started and no current sanitizer acceptance is claimed.

Later published body/declaration/backend/suffix changes in reconciled main are not represented by b0 project.json and must be adopted at ROOT's final freeze. This review does not repeat D1's delta ledger, certify later methods, or authorize a runtime publication. Only the static receipt/journal is committed; no executable source is included. No active A2 build/container or Git child remains at closure. Runtime performance measurements are inapplicable to this documentation-only task.