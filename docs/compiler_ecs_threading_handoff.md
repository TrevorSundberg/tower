# Compiler ECS, threading, and compile-time execution handoff

## R4 publication and subsequent implementation work (2026-11-24)

The r4 native compiler is published and independently adopted. The exact tested
site is atomically published and verified as Pages
`6313a0a86bb18196056647adb659007b4244b848`, manifest SHA256
`6810d9f089568d3380144b01977dfaa695bb1ad80e9b435bdb4c0591ef3f3ce1`.
Its runtime/UI/resources remain `3c0ccdce9704cb2020d0a3df0b11235f10af1711`;
the reused asset packager retains actual build `1bfe0657`, not a relabeled build.
Later main changes are separate candidates, not code validated by this release.

| Accepted r4 boundary | Evidence |
| --- | --- |
| Native and instrumentation | [81 registrations plus21 direct checks](native_combined_3c0ccdce.md), [ASan53](final_asan_3c0ccdce.md), [creation-fault supplement](entity_create_faults_asan_03de36a8.md), [TSan29](compiler_thread_combined_r4_3c0ccdce.md); source/host/coverage limits retained |
| Complete native distribution | [39 products across three generations](compiler_generation_3c0ccdce.md), [independent package peer](native_candidate_peer_3c0ccdce.md), [public745afa2f pin](bootstrap_pin_3c0ccdce.md), [clean default adoption](bootstrap_adoption_5ebde29f.md) |
| Browser and exact site artifacts | [B2 runtime/local-site acceptance](final_browser_static_3c0ccdce.md), [D2 independent source/artifact review](browser_static_peer_3c0ccdce.md), including actual two-generation binary sets |
| Hosted behavior | [Full current hosted acceptance](hosted_acceptance_3c0ccdce.md):104 served members, desktop/mobile/real Linux3/3, redirects/TLS and worker drain pass. The [original input wait failure](hosted_r4_wait_6496eb01.md) remains historical, not relabeled. |

The [whole-scope audit](compiler_ecs_reconciliation_7e9c91a0.md) still requires
cold serial cost, profitable core efficiency and acceptance of bounded LR scratch
accounting. L1's published migration and pending peer are recorded below.
L2's [published adaptive-gate candidate](compiler_worker_gate_98624850.md)
has a [B1 peer and published AArch64 attribute-storage repair](worker_sync_peer_13b2d718.md).
[D1 independently accepted that repair](worker_gate_abi_peer_740d891e.md) and
made the contention fixture respect available workers while requiring real overlap.
Generated ARM IR is not native ARM execution.
[Further transaction attribution](compiler_budget_transactions_13b2d718.md)
retains no speculative budget-layer change; the next measured target is buffer
lifetime churn. [Staged-index growth](compiler_buffer_owners_50e1a833.md) was
rejected and restored after a reproducible serial regression despite much less
copying. Local12 measurements do not establish32-thread efficiency.
[A2's published LR prediction sharing](compiler_cold_prediction_d56de4ff.md) improves
cold serial CLI means10.1%/6.0% at its frozen source and has
[independent acceptance](parser_latency_peer_455e0f3c.md).
[Semantic helper borrowing](compiler_semantic_scan_455e0f3c.md) and
[startup reader reuse](compiler_startup_ba65dd1c.md) were rejected and restored;
fewer operations alone did not establish an ordinary performance gain.
[B2's published grammar-construction candidate](compiler_grammar_closure_1661857b.md)
retains complete lexical inputs and emits only construct-reachable parser productions.
Its matched CLI means improve15.64-29.10%, with lower memory and exact outputs.
[D1 independently accepted the source and behavior](grammar_emission_peer_5fac6131.md):
six focused selections pass and complete owner outputs reconcile. The performance
measurements remain attributed to their stated source and host.
[L1's bounded parser-scratch accounting](lr_scratch_accounting_b7ba9df6.md) is
published as `bf9429d900`: nine focused checks and twenty paired compilations pass,
followed by nine merged-source checks and a complete four-worker multi-file comparison.
The ownership-only cohort retains small serial11.5% and multi-file16.7% wall cost;
those measurements cannot be combined arithmetically with the separate grammar gains.
[D2 independently accepted its accounting and lifetime contract](lr_scratch_peer_bf9429d9.md):
ten focused selections pass, with complete source, seven executable identities and
owner-output reconciliation; no production or fixture repair was required.
The frozen combined candidate is `bf9429d900c6679724cb3c2c4c8960bcf306e83b`, tree
`9fa65da4d4d4ad697b4a97e56bb894021076d106`. A1 native acceptance, A2 package
generations, L1 address instrumentation, L2 thread instrumentation and B1 whole-host
performance are released to proceed alongside that peer. These are pending checks,
not a validated runtime release. B1 must match provider flags and bootstrap closure;
B2 browser builds wait for its exclusive measurements and real public package inputs.
Final joined instrumentation and release
must cover accepted subsequent production changes. The original goal is open.

ROOT starts agents only when their concrete task, inputs and host availability
are ready. Agents never wait for release descriptors or other external prerequisites;
their windows stay closed until ROOT can assign runnable work. Completed agents stop.
Whole-host performance runs require the other lane's heavy work to drain and
check actual processes; focused development uses disjoint CPU/memory partitions.
Caches, bandwidth, power and OS work remain shared, so those measurements retain
their shared-host and counterbalanced-sample limitations. ROOT publishes one
KinmenB-built, independently reviewed site; GitHub Pages serves the prebuilt
gh-pages branch. Documentation-only reconciliation reuses exact tested assets.

## Current scope reconciliation (2026-11-24, 7e9c91a0)

[Independent whole-scope reconciliation](compiler_ecs_reconciliation_7e9c91a0.md)
accounts for all1281 tracked Tower paths and identifies five remaining acceptance
items: cold serial cost, useful-core efficiency, bounded parser scratch accounting,
independent current browser artifact peer and hosted adoption. Current r4
native/ASan/TSan, public745afa2f clean default adoption and B2's browser/static
controls pass at their exact boundaries; hosted03e evidence remains historical. The tables below
retain their original source identities and pending states, superseded only by
the linked current requirement/evidence map. There is no completion percentage.

## Published 03e milestone and next performance work (2026-11-24)

The supported functional, instrumentation and release milestone is accepted.
**The original performance goal remains open.** Implementation source is
`03e344d24cda60a31765b974348081fb1b2e022b`, tree
`40d53c13732e5b216e77292cb14aefc9d464a1a5`. Four independently reviewed lexer,
LR-order, lowering-frontier and capture-scan improvements are included. Rejected
pool range claims remain reverted to released per-job behavior; stronger tests remain.

| Current-source acceptance | Evidence |
| --- | --- |
| Native correctness | [70 registrations and two direct controls](native_combined_03e344d2.md), exact outputs and drained ownership |
| Supported instrumentation | [20 final ASan selections](final_asan_03e344d2.md), [18 TSan controls with real 8/12-thread overlap](compiler_thread_combined_03e344d2.md); coverage limits remain explicit |
| Browser and generations | [Full browser/static and two edited generations](final_browser_static_03e344d2.md), [independent static review](browser_static_peer_03e344d2.md) |
| Native package | [39 products across three generations, 57 payloads, 77 checks](compiler_generation_03e344d2.md), [independent provenance and relocated execution](native_candidate_peer_03e344d2.md) |
| Public distribution | [Complete compiler160a5a20 and resources](bootstrap_pin_03e344d2.md) published by ce0a6fed; B1's fresh default build reproduces all 39 native products and passes 21 development plus 15/999/ABI42 controls |
| Hosted release | Pagesab4bb7c3, exact HTTPS manifesta4115153 and [full hosted acceptance](hosted_acceptance_03e344d2.md); all 104 assets, desktop/mobile/Linux, redirects and process drain pass |

Public compiler is 2,303,472 B; complete 57-payload package is 11,293,548 B;
archive is 2,757,102 B. This remains an LLVM19/Clang-dependent Linux development
bootstrap. Raw Gen1/build-path differences and B1's nine runtime ModuleID comment
differences remain preserved; complete resource equality is not fabricated.
ASan's original 180-second timeout remains failed historical evidence. Matched
ordinary/instrumented attribution supports its documented 240-second ASan-only
allowance; internal assertions, waits and ordinary guards were unchanged.

[Combined ordinary performance](compiler_combined_performance_03e344d2.md) covers
48 paired profiles, 16 separate observations, an extra diagnostic pair and 20 CLI
controls. Best eight-worker means are 1.191x within one unit and 2.473x across
units versus serial. Actual 32-thread overlap exists but costs more wall/CPU time.
Small serial frontend improves 8.25%; four/32-worker and large serial CLI
regressions, including the extra single4 outlier, are retained. C-like latency
parity, full-width efficiency and a universal performance win are not achieved.

The next batch starts from published7c5cfce8/public160a5a20 after B1's clean
adoption. Two improvements are now pushed through47e05f73 and independently
accepted; combined release acceptance remains pending:

- [Raw owner pages](entity_raw_pages_7c5cfce8.md), repair4c38796d: single/multi
  retained memory falls9.29%/8.58%; 20 paired runs preserve complete outputs.
  Semantic component layout is unchanged. D2 received the exact source, owner
  evidence and17 checked executables; this changes an allocator ownership contract.
- [LR shift index](lr_shift_index_7c5cfce8.md), repaire9363377: small CLI means
  improve5.7-6.3%, large2.2-2.4%; the eight-worker frontend is0.95% slower.
  Equal-order nonterminals and overlapping ranges retain ordinary matching.
  A1 received the full owner evidence and three binaries checked after the memory
  merge. The original slower draft samples remain recorded.

Both changes now have independent acceptance: [memory peer](entity_raw_pages_peer_4c38796d.md)
passes18 focused selections, and [parser peer](lr_shift_index_peer_47e05f73.md)
passes8 and verifies the complete owner outputs. LR index scratch uses the existing
raw-vector contract; its allocation is not fully represented by WorkBudget peaks.

The [filtered-ready experiment](compiler_semantic_selection_7c5cfce8.md) is
**rejected and fully restored**. Copying back an old source timestamp initially
left a stale profiler object; the first96 timing samples cannot decide acceptance.
A corrected20-process comparison still regresses multi-unit12 wall/CPU by
3.53%/4.70%. Exact original source, semantics object and profiler were recovered;
no cursor, probe, phase or test delta ships. Coordinator performance remains open.

The selected r4 runtime is frozen at `3c0ccdce9704cb2020d0a3df0b11235f10af1711`,
tree `9d3aac3ba80c99f3709d50765da73b20eb3df590`:15 Tower paths differ from7c5.
A2's [restoration peer](semantic_dispatch_peer_r4_restored.md) passes five current
controls and verifies the rejected experiment's actual harness/ELF identity;
D1's [joined interaction review](combined_source_peer_067ef517.md) covers all15
paths and passes a fresh query-smoke with actual two-worker overlap.

[Combined ordinary measurements](compiler_combined_performance_3c0ccdce.md) now
pass48 profiles,16 separate observers and20 CLI/reference controls. Serial
small/single/multi frontend means improve7.37%/11.71%/4.88%; retained bytes fall
to13.38/416.28/451.69MB. Eleven configurations improve in mean; multi8 is flat.
Best8-worker means are1.196x single and2.322x multi versus their current serial
paths. At32, wall/CPU costs still rise; small/large CLI remains about.400/.525s
versus Clang.03/.08s. These n2 shared-host results retain the C-like latency and
full-width efficiency gaps, rather than closing the original performance goal.

ROOT verified actual ordinary/observer/CLI exit records and idle processes before
releasing B2's browser build. A1 native and L1 ASan report completed selections;
their published final receipts and L2's remaining TSan controls are still pending.
A1 corrected one additional test-only raw-page allocation-failure assumption in
`entity_create_faults.tower`; production inputs remain3c. That correction needs
its own exact receipt/affected validation, without relabeling the original fixture
failure. A2 is generating the complete native successor; D1 owns its independent
package peer, B1 the subsequent clean public-default adoption, and D2 the static
peer. The native and browser releases are not yet adopted.

Exactly eight existing UUIDs remain the limit; completed owners resume the next
bounded task in the same context. A2's original45-minute input timeout remains a
failed wait; it resumed only after actual artifacts arrived, with focused checks
instead of a duplicate timing cohort. Public native/bootstrap/Pages identities
remain03e until the new batch completes final acceptance and publication.

Normal A/B/Deck clones were clean-pulled to5c46d6fb and disks checked; protected
local todo remains untouched. This handoff is documentation only. Historical611
release evidence below remains unchanged and source-bound.

## Current integration checkpoint: published 611 compiler and runtime (2026-11-24)

The original goal remains **open**. The combined compiler correctness batch is now
packaged and published. Performance work continues: useful within-unit scaling
and C-like compilation latency have measurable remaining costs. New optimization
work is a separate source batch; it does not alter the frozen611 release evidence.

Published compiler/runtime source is `6117723b22b019e48938927ad22ce3ea8f643c63`,
tree `69baf4529875dce04645e80af1a877aac85eb0e0`. The complete public Linux
development bootstrap is **04ae22d0**, adopted by `8d724fbd2e` and atomically
published at `6fb579766b`. Browser Pages is
`f16f1a5b3b485ddb5008a4a28935030212b63fcc`; ROOT verified the exact hosted
**d2ef59be** manifest after atomic publication with main `5b8468eb8c`.
Runtime/project/UI/resources are611; the reused packager's actual build remains
`1bfe0657`. An HTTP identity check is not the full hosted behavioral gate.
[Clean public-default adoption](bootstrap_adoption_6fb57976.md) and the
[complete hosted verifier](hosted_acceptance_6117723b.md) both pass.

| Original scope | Current evidence / remaining work |
| --- | --- |
| Authoritative ECS / storage | World-owned entities, explicit relationships and stable payload pages remain authoritative. [40-byte metadata](entity_component_metadata_45b78c48.md) and [eight-bucket page selection](entity_page_buckets_c8555971.md) have measured storage/search gains and [independent source review](entity_page_buckets_peer_3e29944b.md). Pointer indexes are not packed payload SoA; cache layout and sparse/dense choices remain workload-specific. |
| Lazy decltype / comptime / dependencies | Shared producers suspend/resume through dependency tickets; captures retain owning declaration/frame identity and ordered effects. [Guarded import reuse](compiler_baseline_imports_0a87f7b0.md), [complete old/active lease cases](module_cache_leases_c99aba8d.md), final native/query and current browser controls pass. Persistent semantic caching and arbitrary mid-compile edits are not claimed. |
| Within-unit concurrency | Bodies/subtrees/queries actually overlap; [joined ordinary measurements](compiler_combined_performance_73cc82ab.md) reach1.249x at8 workers. [Current TSan width gate](compiler_thread_width_6117723b.md) observes real8/12-thread overlap with exact outputs and zero joined grants. Serial parsing/preparation still limits useful scaling; arbitrary parse-subtree/cross-phase structural overlap is not an implemented guarantee. |
| Cross-unit / shared admission | The joined ordinary workload reaches2.456x at8. Twelve costs65.63% more CPU/25.27% more RSS and is2.12% slower on that workload. Shared outer/nested limits, refill and cancellation remain exercised; current TSan multi-unit width controls pass. No claim that requesting maximum width is always profitable. |
| Determinism / cancellation | Final [native acceptance](native_final_6117723b.md) and [browser adoption](final_browser_static_6117723b.md) preserve serial/parallel canonical results, diagnostics, stale/cycle/failure behavior and drain-before-release. Passing tests are scoped evidence, not proof over every schedule. |
| Checked resource ownership | D1's reset/expansion first-error and cleanup repair is included in611. Its [ordinary focused evidence](syntax_resource_errors_3e29944b.md), [independent source peer](syntax_resource_peer_6117723b.md), native64+4 registrations plus unit command, focused ASan and TSan all pass. The earlier constructor/property repairs remain accepted at their stated source boundaries. |
| Source audit | Original full audits and finite delta maps remain the base; actual bucket, constructor and all11 D1 patch paths have independent review. New optimization candidates require their own finite source review; unpublished drafts are not accepted code. The [concurrency map](compiler_concurrency_completeness_dec17663.md) records actual producers and ordered boundaries. |
| Serial / scaling / memory / size | [Joined ordinary serial gains](compiler_combined_performance_73cc82ab.md) are5.64% small/15.49% single/5.60% multi at that freeze. [Final611 CLI controls](final_cli_6117723b.md): all20 pass, exact reference objects/15/999, no material RSS regression; small/large serial means .410/.595s versus fresh Clang .025/.105s, n2/shared-host limits disclosed. C-like parity is not achieved. ELF2,299,272B; ELF+55 required resources11,274,261B; complete delivery gzip2,818,813B; system LLVM separate. |
| Supported sanitizers | [Integrated ASan](compiler_asan_integrated_28ffe2eb.md) and [ten-suite TSan](compiler_thread_integrated_fca5df98.md) retain their exact earlier freezes. [Final611 focused ASan](final_asan_6117723b.md) passes5 cases/34 linked objects; [syntax/query TSan](compiler_thread_syntax_delta_6117723b.md) passes5; [higher-width TSan](compiler_thread_width_6117723b.md) passes6 real1/8/12-width processes. Physical pooled-subslot coverage, source-language UBSan, foreign LLVM and unsupported-host limits remain explicit. |
| Native generations / public bootstrap | [All39 binaries/three generations/57 payloads/77 package checks](compiler_generation_6117723b.md) pass. [Independent package peer](native_candidate_peer_6117723b.md) verifies source/provenance/recorded checks plus actual relocated42. ROOT [published the complete pin](bootstrap_pin_6117723b.md); [Clean public-default adoption](bootstrap_adoption_6fb57976.md) reproduces the compiler and passes21 development/relocation/reference checks, with precise39-binary/resource comparison limits. |
| Browser generations / static assembly | [Final611 bundle](final_browser_static_6117723b.md) passes affected Node1/2/4/8, browser/ownership, two edited generations with25-object/three-reactor equality, current pages controls, four static controls and full local verifier. [Independent static peer](browser_static_peer_6117723b.md) verifies105 files/104 asset hashes/13 gzip streams and source/provenance; absent redundant handoff sidecars are disclosed. |
| Atomic hosted release | ROOT atomically published exact tested Pagesf16 with reachable runtime/packager sources and verified hosted manifestd2ef. [Full hosted acceptance](hosted_acceptance_6117723b.md) passes desktop/mobile/real Linux, all104 served hashes and three redirects:96.71s, no verifier/page errors, all workers drained. Identity and behavioral evidence remain distinct. Publication raw record: `ROOT_static_final_611_publication.json`. |

Exactly eight existing CLI contexts remain the limit. Four scoped next-batch
owners target lowering selection, capture traversal, parser setup and shared
pool/budget overhead; Deck peers prepare independent lowering/capture checks.
Owners retain diagnosis, scoped fixes, focused testing and normal push in the
same task. Quiet artifact waits have concrete identities and finite deadlines.
B1's original input timeout remains a timeout; the same UUID resumed when the
published pin arrived. ROOT alone launches replacements and owns final deployment.

This checkpoint changes documentation only. Runtime profiling/memory evidence
belongs to the linked immutable receipts; no new runtime benchmark is implied.
Historical checkpoints follow.


## Historical fixed completion ledger — frozen a06ec4b1 (2026-11-23)

Compiler/library/backend source is published **`a06ec4b1f9f44419882477bc1a55b6ed39e2200b`**:
compiler tree `1830db721a8d96a54a2e38a5d2ef20ece56561f3`, library tree
`c6fed2e3602a422e120bfcafa67d5a31f18e4a0b`, backend tree
`e6f2cf5da2d358ddeab719d4b08098f81aa590bc`. Packaging is separately adopted at
**`6b74889b0ca29f1261af0dd55f5c9b27f6ce6ccc`**. **The original goal remains open.**
These are the same twelve requirements; implementation, independent source review,
source-bound execution and final release are distinct. No runtime/build/profile or
instrumentation was run for this documentation reconciliation; profiling is inapplicable.

The earlier full Tower audits and [finite review through1e60c511](compiler_ecs_audit_d1.md#2026-11-23-d1-finite-pending-source-review-at-1e60c511)
remain the base. The [current delta map](compiler_ecs_audit_d2.md#completion-ledger-delta-at-a06ec4b1-2026-11-23)
accounts for every one of the43 later authored `.tower` paths, plus the separate
packager boundary, with exact review identities and named pending files. Owner
checks and D2 rereads of D2-authored changes are not independent peer review.

The earlier broad reactor boundary is **`25dddd0420258bc5174a3039293c447fd60ef367`**;
its mounted host/resource freezes are recorded separately in each receipt.
It excludes A2's125efb11 and subsequent B1 gate/B2 storage/L2 overflow changes.
Publication reconciliation includes receipts through `41c8a5db`: ROOT's a06
builds, L2's two full T8 cases and B2's shared Node/browser adoption now passed;
A2's exact entity_pages request fits, but its complete differential remains open.
Later Windows/fault/observer fixtures have separate source boundaries in the map.
Native T2/T3/T9 retain their own sources; neither those runs nor later mounted
Tower sources turn25 into an a06 executable.

| Original scope | Implementation at this freeze | Exact evidence source | Remaining acceptance action / owner |
| --- | --- | --- | --- |
| Authoritative ECS / storage | World-owned components and ordered relationships remain authoritative. B2 f9565c46/4a8694da adds the descriptor-owned first component pointer and checked promotion to the existing heap index. Payload pages stay stable; pointer columns are not packed payload SoA. | [Inline-storage receipt](entity_inline_component_70e77b60.md), [L1 independent review d7635e9c](entity_budget_gate_review_6019450c.md). Later [B2 full fault correction2f4361f6/a18d584e](entity_fault_accounting_6019450c.md) passes both default modes with exact physical-owner conservation; production blobs unchanged. | Original `component_fault_trial` / `stage_fault_publish` failures stay historical failures, not erased by the corrected capacity/publication oracle. Peer review of the three later fault-fixture files remains open. Final integrated ownership acceptance remains ROOT/B2; no whole-process cap or invented noalias contract. |
| Lazy decltype / comptime / dependencies | L1 mutable module-header captures, A2 module-body forwarding125efb11 and A1 executable-alias publication ef59b0aa are implemented. Shared producer demand/resume and owning declaration/frame captures remain; ordered effects are not replayed. | [D1 capture/alias review](compiler_ecs_audit_d1.md#2026-11-23-d1-three-correctness-fixes-at-ea606d32), [module-body review](compiler_ecs_audit_d1.md#2026-11-23-d1-module-local-declaration-queries-at-0ffba950); final owner44 module-body sessions at fd8f8dac. D2 independently reviews the later initializer/location oracles in the delta map. Alias scalar-negative and exact-output registration451bea0c are closed, with original inference diagnostics retained. | These former source defects are not still missing implementations. Adopt changed producers in the new pair;25 cannot cover125efb11. Native query/T9 receipts and b8 alias execution keep their stated widths/workers/source boundaries. ROOT/A1/A2/L1. |
| Within-unit concurrency | Shared graph/pool/kernel scheduling, worker-private scratch/stages and ordered grammar/publication boundaries remain. B1's exclusive budget gate changes admission synchronization, not scheduling semantics. | [Current25 Node T5](node_threads_25dddd04.md),52b2640e: all3 registrations and full1/2/4/8 dependency matrix. [Joined B1 observation05daa172](compiler_joined_gate_entity_cabc2062.md): actual12 semantic threads, but only about11% of observed frontend wall within dispatches. | Joined large single-unit best measured frontend scaling is only1.063x at8. Parsing/grammar construction and ordered preparation/publication dominate; there is no measured ready-work starvation justifying a scheduler rewrite. Profitable whole-compiler core acceptance remains ROOT/B1/producer owners. |
| Cross-unit / shared worker budget | Outer/nested work shares lane/byte admission, refill and drain-before-close. B1 gate05780abb/6019450c preserves the serial no-gate path; host locks have explicit ABI/lifetime contracts. | [L1 gate review](entity_budget_gate_review_6019450c.md); [25 T6/T7](compiler_workers_cross_25dddd04.md),27f0c671: all8 T6, serial/2/4 equality/peak4. [Windows607f9ce9](windows_budget_gate_cabc2062.md): actual x64 gate1/4/full pool/negative. [B2 a06 shared adoption e71956ab](shared_wasm_a06_a18d584e.md): complete Node3 and strict browser gates. | Windows and shared-Wasm gate coverage now execute; four later Windows test files still need peer review. macOS/Linux ARM64 runtime remains unaccepted. Joined outer overlap1/4/8/12 is measured; do not add mutually exclusive outer/inner peaks. |
| Deterministic ordering / cancellation | A1 validates aliases before ready publication; f2c35cb8/30e60c94 suppresses retired-group errors while preserving first active failure. Tickets, source-order diagnostics and joined publication remain. | D1 ea606 review and [earlier b8 Windows controls](browser_retired_error_repair_3e355d9e.md). [a06/B2 e71956ab](shared_wasm_a06_a18d584e.md): Linux Chromium159 strict pool/compiler1/compiler4 closes5/2/5 with zero targets, nine ownership modes pass; Node23 matching actual ends. Original30s retirement unchanged. | This closes scoped current Linux shared retirement, not current static UI/hosted behavior or every native queued-error timing. Original failed receipts remain failed. ROOT retains final UI/isolation/release acceptance; no universal race-freedom claim. |
| Checked resource ownership | L2 pointer-result repair through74ccfb00 and unsigned-overflow reconstruction a5ffb99d/3bc5f626 are published. Explicit owners remain; foreign heaps are not a whole-process world cap. | [L2 a06 full T8 pair55a6a91f](compiler_entities_t8_a06ec4b1.md): views and registry complete32/64/both profiles/actual Wasm. [A2 exact entity_pages request2bad3e52](entity_pages_wasm_storage_a06ec4b1.md): same965691B input succeeds, native-identical output,1978990592B linear capacity below unchanged2GiB cap. Older25 failures remain preserved. | entity_pages complete reconstructed execution/optimized/package/remaining target gate still OPEN/ROOT/L2; isolated request success is narrower. [D1 review833657a1](compiler_ecs_audit_d1.md#published-unsigned-multiply-overflow-review--2026-11-23) finds admitted `i1` in `bi_multiply_overflow` emits bool `OGt`, rejected by Foundation recheck (**This operation requires integer operands**): source-confirmed, not executed; L2 owns correction/regression. |
| Source audit | Prior full audits retained; all43 deltas since1e60 plus packaging mapped. D2 independently reads counted-byte/storage and later module-body oracles. Reconciled L1 gate/storage and D1 overflow reviews match a06 blobs. | [Finite map](compiler_ecs_audit_d2.md#completion-ledger-delta-at-a06ec4b1-2026-11-23) gives exact source/review/dispositions, including D1's source-confirmed i1 defect. New peer review is not a new runtime run. | Matching independent review still missing for D2 `backend_void_returns_direct`, `driver_differentials` and packager; D1 reviews the C case list. Eight named post-freeze B2/A1/A2 fixture/probe paths plus CMake/read-only LLVM host accessor retain owner evidence only. ROOT must record peer adoption; no whole-repository re-audit. |
| Measured serial / scaling / memory | Isolated gate/inline measurements retained; a matched joined1/4/8/12 study is now published at cabc2062, with unchanged frontend/library/host production blobs at a06. | [B1 joined05daa172/bcd854aa](compiler_joined_gate_entity_cabc2062.md), n2 counterbalanced:12x256 workers4 frontend4.323→2.394s, CPU13.856→8.180s, RSS1100.9→990.2MiB; current serial5.053s gives2.11x inner/1.90x whole-process speedup. Source/canonical outputs and cleanup checked; later linked-backend refresh has separate controls. | This closes the missing combined measurement, not full-core completion. Eight/twelve offer little latency gain with larger CPU/RSS; single-unit dispatch fraction remains low. Strong serial comparisons retain prior workload/source limits. Raw payload, transfer, installed package, Wasm capacity and RSS remain separate. |
| Current supported sanitizers | Historical supported Linux x64 LLVM19 ownership/storage checks remain source-bound; the current ownership milestone is unfinished. | [Sanitizer receipt](compiler_sanitizer_checks.md), including historical failures/unsupported coverage; no new instrumentation here. | **OPEN/service-blocked: do not retry or bypass the rejected operation.** Supported current-source acceptance remains ROOT's gate; source-language UBSan/other unsupported hosts are not passed. Serial denial tests do not sanitize threaded execution. |
| Whole-generation / public bootstrap | Public2013ad28 still pins768a0cdf. L1's a18d584e development candidate now matches38 actual build binaries across generations1/2/3 and all54 package payloads plus checksums across2/3; compiler/library trees equal a06. | [Current generation receipt088baa95/41c8a5db](compiler_generation_a18d584e.md): public no-override Gen1, source/line-ending provenance, transferred archive checks and controls; complete candidate, not repin. | ROOT's public package/pin and clean default successor adoption remain OPEN; restricted standalone release has not passed. This is Linux x64 development bootstrap requiring system LLVM/Clang, not cross-host runtime acceptance. Changed Entity ABI requires coherent consumers. |
| Normal / shared / browser generations |25 executed T4 four, T5 all3/23 worker ends, T6 all8/T7 all7, T8 four files15 plus full struct. ROOT b520e436 records a06 public768 builds/source checks; L2 views/registry and B2 complete shared Node/strict browser adoption now pass. | Linked25 and new a06 receipts retain distinct mounted sources6b74889b/a18d584e. [Full struct25](wasm_struct_values_25dddd04.md) has complete phases but null wrapper exit field. a06 two T8 processes exit0; shared Node3/browser3+9 selections pass. Full artifact hashes remain in those receipts. | entity_pages remaining full differential, final normal/shared and edited browser generations/current UI remain OPEN/ROOT. Prior edited9d generations retain their old identity. Older25 failed/unstarted modes are not rewritten as passes; successors have their own receipts. T7 emitted formats are not native OS runtime proof. |
| Final atomic hosted release | **No new runtime deployed.** Last recorded Pages6f142bef names build98ade8cc; public768 unchanged. D2 packaging6b removes only the unused raw LLVM dist duplicate after gzip succeeds. | [Packaging receipt](compiler_distribution_size_25dddd04.md): exact35,416,018B installed saving on25 input, unchanged gzip/load bytes; focused synthetic asset/hash/rejection gate passed. This is not real hosted acceptance. No new network verification in this review. | OPEN/ROOT: finish final gates, preserve current manifests/CNAME, publish reachable source/build commits by normal atomic main+gh-pages push, then verify workflow, served hashes and behavior. |

Live owner work named above is pending information, not silently included in the
frozen source or its receipts. No new future Stronghold policy, optional backend
ambition, packed-SoA claim or percentage has been added to these requirements.
Historical checkpoints below remain unchanged, including their then-open defects.

## Historical fixed completion ledger - published 3ea43517 (2026-11-23)

Frozen published source **`3ea435174a3529aabbeeea8544aa640653214bb3`**; root tree
`1648e0fc9ae12bd778612a7ccb07fb942f7bd497`, compiler tree
`609b9513b3919c7d3116e37a8099179c72aea06c`, library tree
`25701c2535dc418f32b6c575a1ff6d9bbc384a67`. The original goal is **not complete**.
These are the same twelve acceptance rows, updated in place at one exact freeze.

The [finite later-delta source map](compiler_ecs_audit_a2.md#l2-finite-later-source-adoption-at-3ea43517-2026-11-23)
reads all39 changed authored Tower paths since A2's3a7f4b39 review, including
providers, callers, tests and registration. Unchanged blobs inherit that review
and D1's6767cd30 full/finite review. No packaged Tower path changed; all53 public
bootstrap files match their manifest and42 Tower copies map to252b source.
The newer authored WorkPool observer ABI is explicitly not the packaged
predecessor's ABI. This closes the old hash-only pending appendix at this freeze,
not a new census or future-source approval.

No compiler, test, profile, browser, generation or instrumentation operation was
run for this documentation review; runtime profiling is inapplicable. Owner-run
receipts remain source-bound. Full48d791a8, nativef7 generations,984 shared trials,
9d edited browser generations and eac artifact builds are different boundaries.
The preserved stash37894097 and service-rejected instrumentation remain excluded.

| Original scope | Implementation at this freeze | Exact evidence source | Remaining acceptance action / owner |
| --- | --- | --- | --- |
| Authoritative ECS / storage | World-owned identity/components and ordered/named relationships remain authoritative; stable payload pages and dense pointer indexes are not packed payload SoA. Actual compiler phase/kind census now includes dynamic stage kinds. | A2 [real occupancy](compiler_ecs_occupancy_9d9329db.md), adopted through578437af:28 ordinary processes across recorded boundaries, zero final grants. Declaration pages22.63% occupied,9.10MB physical/1.91MB live. Earlier locality receipts retained. | Real-workload measurement gap closed; packed payloads not justified. Four-slot page experiment is IN PROGRESS, no policy/result adopted. Raw client vectors, ledger metadata and foreign allocation exclusions remain. A2/ROOT. |
| Lazy decltype / comptime / dependencies | Shared query graph and ordinary interpreter preserve executed-branch demand, declaration/frame captures and owning-pipeline cycles. H1 inspection constructors prepare before leases; module deferred aliases now use ordinary expression queries. | A164450fc1 hover; L296cd1eda/1a5241cb28 alias trials; [native integration](native_dependency_acceptance_e7558fa8.md) published3ea43517:query/dependency/capture32/64-bit workers1/4, known outputs, canonical/errors. Full48d791a8 remains its full42-case source. | A1 H1 and imported-stack defect closed at their scoped inputs. L1 zero-argument/wrapper type-composition failures remain IN PROGRESS. ROOT adopts only affected later producers; no complete new full matrix implied. |
| Within-unit concurrency | Shared WorkGraph/WorkPool/kernel admission, private scratch/stages and joined publication retained. Optional world observer writes private job ordinals and collects after drain. A1 body scheduling was not replaced. | B2f16cde13 [observer receipt](compiler_within_unit_e0e3530b.md); L2 large4096-body semantic peak4/four actual threads over311 dispatches; registered callback failure/drain checks. | Real intervals establish observed schedules, not universal full-core use, useful speedup or race freedom. Final affected instrumented compiler gate remains open/service-blocked; retain strong serial execution. ROOT/owners. |
| Cross-unit / shared worker budget | Unit worlds share explicit outer/nested lane/byte budget; release refills ready outer work and cancellation drains before close. | L2e755 freeze/7340 merged adoption:four units peak4/distinct threads4, answers42/43/44/45 and canonical/ordered cycle errors match; nested refill49836ns. Joined lanes0, inactive nested grant, final live grants0. B2 partition receipts retain their own source. | Scoped functional adoption closed. Retained input/output byte grants intentionally persist until close, not zero at join. Final-source useful-core coverage remains ROOT/B2; no32-core or universal outer/inner simultaneous-execution claim. |
| Deterministic ordering / cancellation | Source-ordered errors, typed first cause, no failed ready prefix, stale-ticket rejection and drain-before-release remain. Deferred cleanup retains lexical/effect order; optional observers do not confer ownership. | L2 query/capture/module/error/retry controls and prior A1 body receipts; D2fa65b305/984 actual browser retirement3 trials plus27 Node checks pass, zero remaining targets and equal canonical strings. | Old D2 retirement failure is closed at984; current shared-reactor adoption belongs to B2. ROOT still needs final affected runtime/stale/alias/failure/cancel adoption, not a universal safety claim. |
| Checked resource ownership | Physical entity cap, body/backend/module/scan first-cause paths retain checked ownership. H1 private-kind preparation and package fixture preconditions repaired; no weakened assertion or fake empty success. | A1 fullIDE523f29ad through94ddfa7a and bytecode5/5; ROOTeac16533 actual local registration/portable capacity:Node3/3 and native24 resource/query before/after578 merge; L2 merged query pass. Earlier L1 backend denial and scan/metadata receipts retained. | A1 direct large-package memory path is IN PROGRESS; preliminary24.52s/1.35GiB vs54.69s/2GiB failure is not full LLVM acceptance. D2 struct/LLVM resource and remaining D1 Node failures remain open. Excluded raw/system/LLVM heaps are not covered by a whole-process cap. |
| Source audit | Every39-path later authored delta read/mapped; no packaged changes. Actual provider/caller/test registration and owner evidence replace the prior pending hash-only list; unchanged A2/D1 blobs adopted. | [Complete map and provenance](compiler_ecs_audit_a2.md#l2-finite-later-source-adoption-at-3ea43517-2026-11-23); source/root/compiler/library identities above; CMake native backend/hover/pointer and existing native/Node selectors traced. | Finite static review complete only at3ea43517. Later input changes require explicit adoption or exclusion. Registration is not execution; package identity is not current-runtime acceptance. ROOT/owners. |
| Measured serial / scaling / memory | Accepted LR grain/range work and observed overlap coexist with serial limits and parallel CPU/RSS costs. No rejected bitmap/frontier/lowering fast path ships. | [B1 frontier](compiler_serial_remaining_12722151.md), [bitmap rejection](lr_range_membership_415a54e9.md), [B2 lowering rejection](compiler_lowering_cost_7facb35f.md) preserve negatives/restored binaries. L2 small16:0.712/0.804s; large4096:3.051/2.783s at1/4, more parallel CPU; validation cost, no implementation speedup. | Original strong-serial/useful-core requirement NOT fully accepted. Multi-unit gains/four threads do not prove universal within-unit core use. Preserve small serial advantage, allocation/retention and negative performance evidence; ROOT/B1/B2 own remaining measured work. |
| Current supported sanitizers | Earlier supported Linux x64 LLVM19 storage/owner receipts remain scoped. Current compiler ownership milestone remains unfinished after service rejection. | [Sanitizer receipt](compiler_sanitizer_checks.md):prior c13c2631/42c1e142 inputs only; failure logs/stash retained. No new instrumented operation in this audit. | **OPEN/service-blocked. Do not retry, reconstruct or bypass the rejected operation.** Source-language UBSan and other OS/browser instrumentation remain unsupported. Serial allocation faults do not sanitize threaded allocation. ROOT. |
| Whole-generation / public bootstrap | Public2013ad28 remains252b executable768a0cdf/resources. Later nativef7 generation2/3 is a complete candidate, not the new public pin. | [f7 receipt](compiler_generation_f7e764ab.md), published12722151:34 actual binaries plus four configure probes and53 payloads match; exact predecessor/package/source manifests retained. All53 current public payload hashes verified by this read-only audit. | Old claim that only252b completed generations is superseded. Final current-source generations, complete packs and clean no-override adoption remain ROOT-owned; no pin change, standalone portability or current hosted acceptance inferred. |
| Normal / shared / browser generations | Qualified alias141ef1e4, hover64450fc1 and fullIDE523f29ad/94ddfa7a passed their scoped gates. D2 retirement passed984. ROOT actually completed both edited browser generations at9d; current eac normal/LLVM/cross build also completed. | ROOT0c4ac94a/cc21bb4e:two edited generations110.248/94.796s, all three reactor outputs equal and edited diagnostic checked. eac source-frozen build artifacts portabledf541c16/LLVM87c8fbc9/crosse860e9c5/project420d6de1, exact manifests in source map. | Historical failures remain recorded but are not the current blanket status. B2 current shared reactor, A1 direct package/full LLVM, D1 remaining Node and D2 struct/LLVM resource slices are IN PROGRESS. ROOT final current-source normal/shared/LLVM/cross packs/runtime/generations remain pending. Builds are not execution. |
| Final atomic hosted release | **No new runtime deployed.** Pages6f142bef remains old build98ade8cc with reachable source/build. Source publication and newer artifact existence do not advance hosted acceptance. | ROOT recorded20:02:20UTC verification of manifesteb70f5388bee6b7ca318583eddfaa8e9a8a907c642a14a6fde85375ac8b1643c. This audit made no fresh network/hosted check. | ROOT only: finish current release gates, preserve newer assets/receipts/CNAME, publish reachable source/build with normal atomic main+gh-pages update, verify workflow and exact served assets/behavior. Pending, not waived by this audit. |

Publication after this freeze merged0d789444: A2's four-slot policy is now
published, with D1 browser fixtures/reproducers and B1's additional rejected
closure-scratch receipt. They are explicitly mapped as **excluded later inputs**
in the source audit's publication reconciliation. The twelve rows retain their
3ea boundary; no later policy, old reactor or test result is silently adopted.
H1 is no longer a live inspection-array defect: the source map traces its ordinary
query preparation and full IDE follow-up. KnownScan K1, metadata ID0 and the
suspected declaration-call append concern retain their separately established
resolutions. This does not close the current independent type-composition,
large-package, Node/LLVM resource or final release work. No percentage or ETA is
invented. The current ledger ends here; all historical sections below retain
their original bytes and evidence boundaries.
## Historical fixed completion ledger — published c20dc56 (2026-11-23)

Frozen source: **`c20dc56ac5344834a95e8de1f505abe9aea515ac`**; compiler tree
`42eb931b70b90c778ba1c4d0f92b1e0a1ea2ee63`. The original compiler goal is **not
accepted as complete**. Implementation, source review and executed acceptance
are separate below; there is no completion percentage. These twelve rows are
the fixed closeout scope, not an instruction to start another audit cycle.
Other workers' unpushed memory/body work is **in progress and excluded** from
this checkpoint. Later changes need affected owner receipts at final integration.

Publication reconciliation preserved subsequent main87a5da1, including ownership
and scratch changes with their own receipts. They are outside this review: an
open defect at c20 is not a claim that its later fix is absent or unvalidated.

Evidence references name frozen receipts in the [journal](temporal-opcode-research-journal.md),
[services](compiler-services.md) and [D1 composed-source review](compiler_ecs_audit_d1.md#frozen-integration-review-at-c20dc56-2026-11-23).
`ff6820e2` and this freeze have identical runtime sources/build configuration;
their only difference is the integration journal receipt. Thus B1's merged
focused checks cover this source, within their stated selection. Earlier
receipts retain their own identities and do not validate the whole union.

| Original scope | Implementation at this freeze | Exact evidence source | Remaining acceptance action / owner |
| --- | --- | --- | --- |
| Authoritative ECS / storage | World-owned entities, components, ordered/named relations and derived indexes implemented. Stable payload pages plus sparse lookup/archetype pointer columns; not packed payload SoA. | ec01291 finite51 adoption / 98d69cf; A2 storage receipts; D2 stable-page receipt frozen3bee18e2 plus recorded fixture hash. | Close declared storage/accounting omissions; assess locality, fragmentation and representative memory cost without inventing alias guarantees. A2 with production owners; ROOT acceptance. |
| Lazy decltype / comptime / dependencies | Ordinary interpreter, executable-readiness producers, shared demand/suspend/resume graph and owning-pipeline cycle detection implemented. B2 layout-frontier and executed-wrapper inference fixes present. | ROOT5b05d6bb dependency-units/query; B2 6081ceb4 and 0e9db271/5b16b584 focused regressions, canonical checks and type-smoke; D1 current source review. | Run affected combined staging/import/forward/untaken/capture/cycle/failure cases on final inputs. A1/L1/L2/B2 own remaining implementation; ROOT integrated acceptance. |
| Within-unit concurrency | Parser/semantic/body/lowering kernels, private scratch/stages and resumable continuations implemented; grammar/effects/interner/publication retain ordered contracts. | A1 cc2d4e6a mixed-kernel rendezvous; 3e9ba56 checked joined completion; earlier body/query receipts. | Finish in-progress body work, validate its final source and show useful overlap, serial cost, idle/critical path and scaling on representative units. A1/B1/L1/L2, ROOT. |
| Cross-unit / shared worker budget | Isolated unit worlds share outer/nested lane/byte admission and capacity wake/refill; workers without nested transport run inline. Cross-unit immutable import reuse is not implemented. | B2 baf2a5a0 refill/cancellation observer; ROOT5b05 dependency-units observed four threads/peak4; B1 ff6820e2 three-unit control peaks1/3 at workers1/4. | Final shared-budget/cancellation/output checks and profitable-core scaling/memory evidence. Import reuse remains a measured performance option, not a replacement for the goal. B2/ROOT. |
| Deterministic ordering / cancellation | Source-ordered joins, stale-ticket rejection, hold-before-unpin and drain-before-release contracts implemented. D2 sort restores the same rule/dot/range order before publication. | d9e1b348/1906afcd lr-order and native LR receipts; ff6820e2 canonical unit hash1173729914654460811; ec01291 stage/cancellation review. | Revalidate final-source deterministic errors, aliases, stale/cancel/failure lifetimes and canonical serial/parallel results. Passing selected schedules are not race-freedom proof. ROOT with owners. |
| Checked resource ownership | Checked components, stages, work buffers and new B1 provenance/formatter/session receipts implemented. Whole-world accounting is incomplete. | 4bc51044/ff6820e2 presentation-budget: diagnostic peak597595 bytes, zero grants after teardown; D2 6b04a149 entity-accounting cap failure. | **Confirmed open defect:** entity_create_result publishes a raw descriptor despite an exhausted store ledger. Finish A2 memory work and required raw-container/interpreter/output/foreign-boundary accounting and typed failure propagation; ROOT validates omissions/cleanup explicitly. |
| Source audit | ec01291 finite51 adopted; this bounded c20 review adopts the B1/B2/D2 composed closure. Three CTest registration gaps closed. | D1 98d69cf and d75a39ee; current path-specific receipts with exact blob comparisons; owner audits/roster retain earlier unchanged reviews. | At final freeze reconcile only later deltas against owner receipts. Execute registered structure-reuse/unit-admission/backend-ir on the final binaries; registration is not execution. ROOT/owners. |
| Measured serial / scaling / memory | Some useful overlap and bounded optimizations measured; original strong-serial/profitable-core goal **not met by current evidence**. | D2 d9e1b348 paired cold median2.05→1.93s (n3); B1 4bc51044 adjacent serial3.34→3.51s (n1, about5% slower); baf2a5a0 Deck large jobs4 slower than serial; B2 three-unit4096-body receipt4.642→2.372s with CPU/RSS growth. | Final comparable small/large body/parser/import/staging and C-like reference inputs, checked outputs, wall/CPU/RSS/allocations, serial and observed useful scaling, scheduler/idle/critical-path costs. Investigate excessive memory and regressions. D2/production owners/ROOT; no queue-width or cross-language superiority claim. |
| Current supported sanitizers | Supported Linux x64 LLVM19 address/leak and thread instrumentation exists; no complete c20 source pass. | ROOT b83eeca7 receipt on5c5a308c; B1 ac65b3e9 focused address/thread and real-overlap receipts. These precede the new presentation/layout/inference union. | Run applicable final-source ASan/LSan/TSan and targeted stress with instrumented identities. Source-language UBSan and Windows/macOS/browser sanitizers remain unsupported, explicitly reported. Serial allocation faults do not sanitize threading. ROOT. |
| Whole-generation / public bootstrap | Public predecessor remains pinned; successor prerequisites repaired. Actual generation2 semantics object now compiles. Whole-generation closure remains pending. | B2 6081ceb4 saved-before abort134/fixed frontend_units; 0e9db271 actual semantics target pass and development verifier; public executable9653f8187a104ca84ab5d8601f336d7e1ed8200206544c70a81415018d623d02. | Clean canonical Linux x64 Docker/no-override build; complete generations2/3, all object/executable/resource comparisons and lineage. Earlier predecessor/successor object mismatch is not waived by partial success. B2/ROOT. |
| Normal / shared / browser generations | Portable normal/shared paths exist with earlier scoped WASI/browser receipts; this union has no complete platform/generation receipt. | L1 shared-Wasm/browser journal receipt on b9f2c443, manifestec2a16a85c5b083a8b103514a2d504cdceaae7838c7a4b9a769c0e0efaedd1db; existing playground checks; B2 generation receipts above. | Build actual normal/shared/LLVM/cross closures, both browser compiler generations, mandatory threads reactor (TOWER_REQUIRE_THREADS=1), IDE, cancellation, errors and real host behavior. Keep unsupported targets explicit. L1/ROOT. |
| Final atomic hosted release | No hosted release of this frozen compiler is established. Historical Pages/assets stay provenance-only. | Last handoff receipt: Pages6f142bef, manifesteb70f5388bee6b7ca318583eddfaa8e9a8a907c642a14a6fde85375ac8b1643c, build source98ade8cc. This is not a fresh remote check. | After integrated gates, preserve newer assets/receipts/CNAME, require reachable source/build commits, atomic normal main+gh-pages push, workflow plus exact served manifest/assets and applicable hosted behavior. ROOT only. |

The earlier 300s frontend run remains a failed deadline. ROOT's separate full
suite at5b05d6bb passed in328.14s under a declared900s deadline; it neither passes
the old limit nor validates c20's later changes. B1's historical “timeout open”
wording must be read with that receipt. This review ran no builds, runtime tests,
profiles or sanitizers; documentation-only profiling is inapplicable.

## Historical checkpoint and receipts (superseded for current status)

Everything below retains its original source/evidence boundary. The fixed ledger
above supersedes its current-status and remaining-work wording, including the
formerly unbudgeted B1 text/splice paths and the now-repaired inference blocker.

Historical source review: **2026-11-23**, frozen published main
**`b83eeca71edbe3770e7b576692a5702cb3ff42fa`** (published origin/main).
Compiler tree `ba5457d083698335be45801b65bf7f282298d574`; scaffolding tree
`32581bcb8ba150a0038e81e44513f9f4de827310`; CMake tree
`6d3db921295697f16f936f2278d7fb3bb3748c6b`. This final boundary incorporates
the complete Fast/staging/sanitizer history received during publication; it
supersedes the initial `68f89640` draft. Later merges do not silently move
this review's boundary. This documentation review ran no compiler or runtime
tests. The old completion percentage is retired; there is no measured percentage
or ETA for the remaining gates.

**Executable helpers and type staging are implemented.** Production
`semantic_execution_work.tower::sem_executable_request/sem_executables_pump`
publish function-owned `IMFunctionInput` through the `executable_ready` kind after
body/lowering dependencies complete; `executable_functions` holds the producer
work components. `semantic_type_execution.tower` and
`semantic_constructor_work.tower` consume the ordinary interpreter's executed
requests. The former `IMCallInput` experiment and rejected producer below are
historical, not missing production capabilities. See [type values](type-values.md),
[computed type arguments](computed-type-arguments.md), [services](compiler-services.md)
and the scoped [journal receipts](temporal-opcode-research-journal.md).

## Historical implemented contracts and evidence boundary

### Shared entities, storage, and ownership

Syntax, parse metadata, Foundation operations, and semantic metadata use
world-owned entities/components: `world.tower`, `library/entities.tower`,
`entity_types.tower` and `entity_stage.tower` retain the
authoritative graph and ordered/named owning relationships. Stable component
pages and sparse identity lookup coexist with dense archetype row/pointer
columns and contiguous work buffers. These indexes are not packed payload SoA;
parser tables, interpreter caches and query indexes remain derived state.
Stable addresses help leased workers but can retain fragmented pages. A2's
page-churn receipts demonstrate free-slot reuse, not universal locality or a
whole-compiler memory bound. Raw node/index and stage-vector accounting remains
open below. Neither converting every traversal to a query nor adding `noalias`
without proof is a completion criterion.

Workers receive immutable published inputs and own their scratch, diagnostics,
interpreter state, and staged output. Structural writes and shared-index changes
publish after joins. Views pin input lifetimes; leases/access declarations govern
mutation. A pinned view is not a payload lock. Generic clone batches retain their
existing memory budget and acquire queued stage ownership before the last input
view closes. Explicit `frontend_units` worlds, module environments,
`execution_session` and backend source owners now exist; legacy `host_world`,
document/completion adapters and `host/llvm_worker` remain boundary contracts,
not permission to share a default world between workers. The latter retains its
latest request until reuse/VM retirement and has no Tower close export.

### Queries and worker execution

`library/work_graph.tower` provides demand, dependency edges, suspension,
resumption, cycle discovery, access ranges, cancellation, and stale
revision/profile/dispatch-ticket rejection. Declaration, expression, array/type
construction, layout, body checking, lowering, flow, known-value analysis, and
evaluation have worker/query paths. Parser table construction has parallel
subsystems too. Native CLI unit compilation uses the production unit services,
with isolated frontend worlds and backend contexts.

`SemanticPumpResult` distinguishes progress, waiting, completion, and failure.
A phase with no ready task can yield to another producer without inventing a
cycle. Body continuations retain lexical state and structural preparation state;
they do not replay checked statements when a dependency completes. Bounded
source windows are independent of worker count and can admit later producers
while an earlier body waits.

The lifecycle now interleaves AggregatePrepare and Lowering through
`sem_lifecycle_lowering_pump`/`sem_lower_pipeline_pump`: each function waits on
its own Body/KnownSnapshot/signature producers. A1's `cc2d4e6a` receipt includes
two real mixed-kernel rendezvous trials in `semantic_lifecycle_frontier_checks`.
B2's `baf2a5a0` unit-admission receipt observes distinct live threads and outer
refill after nested lane release (80,877 ns); its backend trace starts one LLVM
job while another frontend remains live. These are observed overlap at their
recorded sources, not current-release scaling results. `frontend_units_step`,
`work_budget_set_wake` and `work_pool_receive_event` share admission/wakeups;
an empty nested grant executes inline. Requested workers or pool occupancy
alone prove neither overlap nor useful speedup.

A1 `7cea85cf` additionally replaces the blanket lowering-before-evaluation drain
with `sem_lifecycle_queries_pump` and root-owned `semantic_phase_work` joins.
At that checkpoint explicit stages waited on signature publication and their
owner's lowering; inferred execution still waited for all canonical lowering.
Pumps alternate after joins, so this establishes resumable admission while unrelated lowering remains
ready, **not simultaneous lowering/evaluation kernels**. Merged `b235f2f4`
passes 46 focused flow/lifecycle/staging trials, query smoke and checked workers1/4
execution/canonical reparse. All three fixtures now have supported CMake targets.
L1 `908515e4` also charges the Fast descriptor, all 15 arrays and lexical scratch
to their owning budget; final merged core evidence is `127cfa00`, not a new
whole-union instrumentation pass.

A1 `d9112a01` removes that inferred execution barrier: both policies request
reached calls through the existing executable snapshots and depend on their own
owner's lowering and shared signature publication. Inferred work retains its
known proof/clone receipts. Optional capture/effect capabilities and runtime fallback remain
unchanged. The extended staging fixture covers actual parallel evaluations while
unrelated lowering stays Ready, suspended inferred calls, distinct required/known
capture producers and lazy branches. Its input-specific 56-case/query/control
and canonical receipts do not replace integrated sanitizer or release gates.
Full lowering still precedes visible evaluation diagnostics; joined phase windows
still protect alias, reference and structural publication.

Remaining lifecycle boundaries are checking, foreign-signature validation,
defer hygiene, known-write/order proof and snapshots, joined transformation and
evaluation windows with explicit phase edges, attributes, known publication, module initialization and late
flow. Grammar activation, effects, interning and callback/publication mutation
have ordered contracts. Remove a boundary only after proving narrower dependency
and publication ownership and measuring useful work; the remaining phase calls
alone are not evidence of a scheduler bug. Cycles belong to the owning pipeline's
quiescent wrapper, not an individual waiting pump.

### `decltype`, staging, and inferred values

Unevaluated type queries and computed integer type arguments use the shared
semantic model. Lazy lexical proof jobs are requested only when a type expression
needs a local binding; they are not an eager scan of every function. Facts attach
to the original declaration identity. Lexical shadowing, writes, address escapes,
deferred writes, and loop updates participate in the proof.

Immutability and known value are independent facts. Eligible captured initializers
become ordinary interpreter jobs. Executed reads demand their producers; merely
mentioning a capture in an untaken branch does not force its value or create a
cycle. `semantic_source_bindings.tower` resolves module aliases and lexical
declarations; `semantic_capture_work.tower` retains the owning declaration/frame.
`semantic_lifecycle_checks` covers two aliases of one imported capture, writes,
escapes, early initialization, untaken mutable/forward reads and nested stages.
Conservative rejection of an unproved extension statement or runtime-storage
capture is a supported limit, not permission to infer knownness from spelling.
Nested explicit stage expressions retain the same behavior. Snapshot
receipts protect inferred initializers before runtime lowering changes them.

No pre-LLVM arithmetic folding implementation was introduced. Known-value
execution uses the ordinary Tower interpreter and its target/semantic contract.
This remains a hard requirement for future inference and specialization.

### Ordering, failure and ownership

Graph revision/profile/dispatch tickets and read/write ranges precede dispatch;
worker scratch, diagnostics, interpreter state and output stages remain private.
Source/phase ordering selects diagnostics after joins, including failed peers.
`work_order.tower`'s portable stale-revision/profile fixture is unchanged from
`be0d123bb`; that is source-specific evidence, not a new current run.
A2 `0aee8b07` and ROOT `d56c2903` supersede the queued-provenance gap:
`entity_stage_hold_result` checks the pending suffix atomically (duplicates
included); cancellable unheld fields clear before finalization. Generic and
executable pumps hold or discard before the last input view closes, and publish
before later structural mutation. Unit/backend cancellation drains workers before
world/view disposal. Remaining unchecked callers are listed separately below;
passing these fixtures is not universal race freedom.

## Historical completion gates at b83eeca7

### Blocking implementation and contract closures

These are source-confirmed gaps, not new failure-injection results. Each owner
must either close the listed boundary or document a justified supported limit;
do not reopen helper readiness, module captures or the completed hold protocol.
Paths below are relative to `scaffolding/`.

| Gate / owner | Precise remaining boundary and acceptance action |
| --- | --- |
| Checked semantic failure paths — L2 shared helpers, B1 diagnostics | A1 lowering/flow coordinator admission now uses checked graph/kind/component/lease/view/pool/work-vector paths and the published joined-stage helper. Completion reserves queue growth before any successful ticket; registered denial fixtures verify offsets, no ready prefix, drained ownership and terminal retries. See `compiler_ecs_audit_a1.md`. ROOT196d93c7 checks executable aggregate-signature component admission. Shared `sem_control_names`, `sem_known_edges`, private lowering node/text/list helpers and `sem_restore_error` still contain fatal allocation wrappers; these are not covered by the coordinator gate. Retained pump assertions enforce component/ordinal/lifetime invariants, not allocation admission. |
| Physical ownership accounting — A2; L1 execution; B1/B2 presentation/host | `library/entities.tower::entity_create_result` allocates raw `Entity` storage outside `store.budget`; node/index storage and `entity_stage.tower` node/reference/cancellation/lease vectors remain outside the charged component-page owners. Fast arrays and L1 interpreter error/output/constructor-message owners now use checked work vectors; package encoding admits, validates and transfers a complete checked owner transactionally. The focused L1 receipt is recorded in the journal; it does not cover the remaining presentation/host heaps. `syntax_provenance` splice scratch and shared formatter/final diagnostic text remain ordinary allocations. Missing contract: complete declared ownership/peak accounting and typed failure at required compiler boundaries, with rollback and zero retained grants; the unit retained-byte cap explicitly excludes these heaps and LLVM. Owner-specific source review must delimit coverage rather than call that cap a process limit. |

Cross-unit shared import/revision reuse is **not implemented** by independent
unit worlds. It is a performance option with an outstanding immutable
world/Bedrock/import/profile/provenance identity contract, not a correctness
prerequisite for the existing isolated-unit API. Likewise the remaining
source-defined primitive operation protocol and constructor compatibility forms
in [type values](type-values.md) are separate language milestones; they do not
mean executed type constructors are absent. Stronghold safety/initialization,
fixed vectors and optional backend ambitions are outside these compiler gates.

### Measured cost and pending acceptance

| Gate / owner | Existing evidence and exact remaining work |
| --- | --- |
| Representative serial/scaling cost — B1/B2/A1, D2 measurements, ROOT final | D2's frozen `baf2a5a0` Linux/LLVM19 Deck comparison uses matched generated 16/1000-function Tower/C bodies, outputs 15/999, optimized object output, warm filesystem/fresh processes, one warmup each, small n=3 and large n=1. Tower wall/CPU/peak RSS: 2.26/2.22 s/183,576 KiB small medians, 2.44/2.41/212,312 large; Clang .04/.03/97,536 and .16/.15/108,196. Large Tower jobs4 on two admitted CPUs costs 3.28/3.65/224,544, with identical object/output and no measured useful speedup. Parse/check accounts for about 86% of Tower's internal time; these timers do not split parsing from semantics. Link/startup are separately recorded in the journal, not hidden in those object times. Repeat affected small/large body/parser/import/staging costs on the final source, record real overlap, CPU/idle/critical path and memory, and investigate regressions. This is a specific workload gap, not a language ranking. |
| Actionable frontend cost — B1 with B2 cache ownership | B1 `f2f12e5b` measures one ordinary answer42 request: 185 lookups, 155 version builds, 159 tables. Fresh-session construction 1004.855 ms includes table work 930.539 ms; lookup .513 ms (warm filesystem, n=1). Installed baselines retain the same request counts. The merged `00d3f856` check retains those counts and canonical output at 1.05 wall/1.00 CPU s/165,596 KiB; neither receipt covers this later Fast/staging union. Largest identified subcost is repeated LR construction through `syntax_session_declare -> syntax_version_cached/build -> parser_table_open_result`. Establish which versions are equivalent and separate per-version userdata/emission/provenance before reuse. Counts do not prove avoidable misses. Historical full-frontend 300 s/124 timeout remains unresolved; this approximately 1 s request does not reproduce it. Isolate its named request/phase rather than claim it fixed or silently extend a deadline. |
| Integrated behavior and instruments — ROOT, D1 | Earlier query/type/control/storage/units fixtures cover captures, executed dependencies, aliases, canonical round trips, failures and real worker overlap at the journal's distinct sources. No one receipt covers this entire frozen union. Confirm combined lazy staging/imported-unit/forward/untaken coverage through the existing unit observer; independent outer jobs are not a cross-file declaration-query cache. ROOT's `b83eeca7` receipt now records **passing** Linux x64 LLVM19 address/leak and thread ownership checks on frozen `5c5a308c`: work, concurrent stages, query, unit-admission and 44 executable-admission trials per mode. LR hashes are address `2034ada65cc7f0b8739762c99f9f1dfde06d7cf6af9b48d4c3f23f68bd37705d`, thread `d67356813bea8f06cd32245a7f3bed8208282e07cf96f767857a3b796e4fcfbd`. The original Docker TSan startup failure remains failed; identical binaries passed with the documented per-container seccomp accommodation. Later B1 grammar, L1 Fast and A1 staging inputs are explicitly excluded. Source-language UBSan and Windows/macOS/browser sanitizers are unsupported. The documented negative probe has a known missing buffer-provider link; preserve its earlier sensitivity receipts and ROOT's instruction not to rerun it. Serial allocator faults do not sanitize threaded work. |
| Public bootstrap, providers and portable execution — ROOT, D2 policy | Current predecessor manifest SHA256 `cf7d84b11d025c708310827c56f3071fa69e36b010ea50dd992855ecc438e896`, executable `9653f8187a104ca84ab5d8601f336d7e1ed8200206544c70a81415018d623d02`, remains unchanged. Its complete resources are usable bootstrap inputs, not the new compiler. Finish one clean canonical Linux x64 Docker/no-override build and predecessor/successor checks on frozen inputs. Rebuild the affected dependency closure and collect actual native/WASI consumer/provider/export identities; exact generic/module/diagnostic policy fixes do not establish new WASI reports. Current shared prelude/layout changes prevent reusing old complete compiler objects merely because entry files are unchanged. Implemented portable code and target-policy strings are not Windows runtime acceptance. |
| Browser, generations and deployment — ROOT | Pages ref remains `6f142bef15f58380831ed344ab5eac5c4b3c2840`; its recorded manifest `eb70f5388bee6b7ca318583eddfaa8e9a8a907c642a14a6fde85375ac8b1643c` builds from `98ade8cc`, not this compiler. Old runtime assets/receipts stay historical. Re-export current project/actual link recipe, build normal/threads/LLVM/cross Tower closures, run mandatory thread/IDE/worker cancellation and deterministic-error checks, both compiler generations, local deployment and exact hosted assets/desktop/mobile behavior. Reuse unchanged vendor/UI assets only with matching inputs; preserve CNAME and newer receipts. Source/build must be reachable from published main and final main+Pages pushed atomically. No current browser/generation/hosted pass is asserted here. |

B2's earlier bounded cost receipt supplies a complementary large-unit observation:
three units, 4096 bodies in the last, warm filesystem/fresh processes, n=1 on its
Linux x64 LLVM19 host. After the wake fix, budgets1/4 take 4.642/2.372 s wall,
4.534/5.572 s CPU and 679,528/941,284 KiB peak RSS, with equal canonical output.
Observed outer peaks are1/3 and shared lane peaks1/4. This is useful work at a
recorded source/host with a memory tradeoff, not a statistical scaling result or
evidence for the newer Deck compiler. Full timing, allocation/retention and host
identities remain in the journal's B2 nested-lane receipt.

Use the existing commands in [D2's publication-readiness checklist](compiler_ecs_audit_d2.md#bounded-publication-readiness-review-2026-11-23),
[sanitizer checks](compiler_sanitizer_checks.md#shared-build-entry) and
[playground checks](../playground/README.md#checks), with the **new frozen input
identity**, not the earlier checklist's cached objects. In particular,
`TOWER_REQUIRE_THREADS=1` must make the separate test reactor mandatory;
use distinct `-DTOWER_SANITIZER=address`/`thread` native caches and record actual
instrumented object/link and execution identities. No broad matrix was run for
this documentation change; runtime profiling is inapplicable.
The new `tower-semantic-staging-smoke` target builds the three registered
frontier executables; it does not run them. Their existing CTest selection is
`ctest --test-dir "$TOWER_NATIVE_BUILD" --output-on-failure -R '^tower-semantic-(flow|lifecycle-frontier|staging-frontier)-tests$'`.

### Full-file inventory ownership and review freshness

The current finite adoption checkpoint is published main
ec01291eaf8706c29f3bec62ec85a2e7561530d4. ROOT delegated independent review of the
entire51-path union to D1, whose [path/blob receipts](compiler_ecs_audit_d1.md#delegated-finite-source-adoption-at-ec01291-2026-11-23)
close all26 earlier freshness actions and33 later deltas (eight overlaps),
including all15 later D1 fixtures and the three composed semantic/frontend
exceptions. Zero substantive adoption actions remain in that frozen set. The
[roster closure](compiler_ecs_file_roster.md#finite-review-closure-at-published-ec01291-2026-11-23)
retains exact1146 ownership coverage: A1 45, A2 43, B1 102, B2 277, L1 26,
L2 17, D1 551, D2 85. Unchanged reviews and matching B1 wrapper receipts remain
reusable; later compiler changes need their own receipts at final integration.

This closes source adoption, not runtime acceptance. The demonstrated raw Entity
allocation bypass of a fully consumed store ledger remains an A2 accounting
defect: the existing entity_accounting cap target fails nonzero after cleanup.
The three registration gaps are now closed by CTest names
`tower-frontend-structure-reuse`, `tower-native-unit-admission` and
`tower-native-backend-ir`, using existing binaries/selectors and resources.
Configuration/discovery and dependency wiring are checked; execution on the final
merged compiler remains pending ROOT's integrated milestone. Earlier explicit
selector passes retain their source identities. Existing assertions,
raw-storage omissions and integrated instrument/bootstrap/browser/generation/
deployment limits remain explicit. This docs-only review ran no builds or
runtime profiles; ROOT retains final integrated validation and publication.

The following records the prior5b05/36ad reconciliation history, superseded only
for source-adoption status by the ec01291 receipt above:

Frozen published source `5b05d6bb5288591794d378c1802c2a790357b204` contains
**1,144 tracked `.tower` paths**. ROOT assigned the bounded reconciliation to D1.
The [current roster](compiler_ecs_file_roster.md#frozen-adoption-reconciliation-at-5b05d6bb-2026-11-23)
proves exact ownership-set equality: baseline1011 +147 additions -14 retirements,
with13 additions after b042 and no further retirements. Inventory counts are
A1 45, A2 43, B1 102, B2 276, L1 26, L2 17, D1 550 and D2 85.

D1's current path-specific review covers the32 new/changed fixtures since its
last complete540-path audit;518 unchanged reviews are reused. The grammar/generic
result omissions are closed, including the current756-line generic-result file.
All three B2 parser-module wrappers match B1's original reviewed blobs and are
explicitly adopted into B2's inventory. Thirteen additional matching production
handoff receipts are adopted with their domain ownership and limitations intact.

The roster lists **26 exact remaining production source-review actions**; no
blanket current-source approval follows from the census. Three merged files
differ from their latest non-merge implementation receipts, so source hashes,
not last-commit labels, govern adoption. D1 also records that structure-reuse and
unit-admission require explicit focused invocation: default/units/backend CTest
commands do not reach those cases. ROOT's separate focused runtime receipts are
preserved; this documentation batch ran no compiler tests or profiles.

Historical journal material and D2's45 pinned resource rows remain provenance-only.
The unchanged public resources must not be edited or treated as current compiler
acceptance. ROOT retains integrated instrumentation/bootstrap/browser/generation
and hosted-release ownership; those gates remain separate and pending.

Publication reconciliation later merged36ad337 without changing this substantive
freeze. Its inventory is1146 (B2277/D1551); the roster separately enumerates its
two additions and28 modifications, including13 D1 deltas pending adoption. Those
later inputs do not inherit the5b05 source or runtime receipts.

Audit principles: [Flecs systems](https://www.flecs.dev/flecs/Systems.html)
and [storage traits](https://www.flecs.dev/flecs/ComponentTraits.html) motivate
explicit access, staged publication and deliberate stable/sparse storage;
[Burst aliasing](https://docs.unity3d.com/Packages/com.unity.burst@1.8/manual/aliasing.html)
requires actual alias information before optimization. These principles supply
neither Tower implementation credit nor performance measurements.

## Historical November 22 helper experiment (superseded)

The numbered experiment below predates production executable readiness. Its
failed budget/build attempts and proposed APIs are retained as history; it is
**not the current remaining-work list**. Production uses `IMFunctionInput`,
not the experimental `IMCallInput`. The current gates above supersede it.

At that checkpoint, the proposed sequence was:

### 1. Remove the bootstrap unit-size bottleneck

The checked-in predecessor currently allows 128 MiB of Foundation semantic
components. This is a resource policy, not total process memory or a language
limit. The attempted helper producer pushed `compiler/units/semantics_checks.tower`
past that policy. Initial failure appeared in `tests/semantic_world.tower`; after
moving the new interpreter-only fixture, it appeared in generated vector code.
The location is where the allowance runs out, not proof of a bug in that function.

Moving an implementation to another file does not partition its transitive import
closure. Importing the same semantic implementation into two object units also
duplicates exported definitions; that failure already occurred earlier in this
chain. Audit the object and browser compiler-project manifests before splitting.

Prefer a genuine boundary between production semantic code and test construction,
or another existing unit boundary with a narrow exported interface. Keep shared
types in one authoritative Tower definition; do not copy `SemanticContext` or
component layouts into a test ABI. Retain meaningful scheduler coverage. The
interpreter-only fixture separation in this checkpoint is a useful small step,
but did not by itself make the experimental producer fit.

If a larger-budget successor is actually needed, build it using the public
predecessor and publish its complete executable/resources with hashes/provenance
through the documented bootstrap path before relying on it. Then repeat a clean
build without a private bootstrap override. A local cache binary is insufficient.
Do not silently alter tests to use a private compiler.

### 2. Add a function-owned executable-readiness query

The intended dependency path is:

```text
integer type argument
  -> ordinary evaluation (suspends at an executed call)
  -> staged executable snapshot of the called function
  -> checked body
  -> signature / lexical expression / layout / other value queries
```

Use a component on the original function entity for the work ticket, stage,
source ordinal, snapshot handle, diagnostic, query-read log, and evaluation
aliases. Register its readiness in `IMCallInput`. The graph owns scheduling;
the component owns continuation/result state. Do not add another semantic graph.

The consumer may request a Body identity before body admission. Admission must
attach the producer to that existing Building query instead of treating every
existing query as completed work. Request only bodies needed by executed calls
for early stages; an untaken branch must not acquire an evaluation dependency.
Keep ordinary runtime reachability requirements distinct from early staged demand.

### 3. Prepare a canonical executable snapshot

Preserve the checked source body for later binding proofs and runtime lowering.
Clone its ordinary Foundation nodes into a worker-owned stage, remap parameter
and local declaration identities, assign independent frame slots, and invoke the
existing aggregate, expression, and defer lowering. Publish all stages after
joining, then publish call-input readiness. Query/read observations and nested
evaluation aliases publish on the coordinator too.

The attempted implementation used `sem_defer_clone`, a shared clone map, ordinary
aggregate metadata, `sem_lift_block`, and `sem_defer_depth`. Reuse is plausible,
but this combination was **not executed successfully**. Verify that every helper
is valid before the normal lowering phase and only mutates the private snapshot.
Do not assume existing phase-local helpers are safe at an earlier lifecycle point.

Particular care is needed for aggregate parameters/returns and indirect function
calls. The source function identity/signature must remain suitable for type and
function-reference checks while execution selects the lowered snapshot. Do not
rewrite shared callback/type metadata on a worker. A derived executable snapshot
is allowed; an independent public IR or instruction ABI is not.

### 4. Interleave producers through the pumps

When declaration/evaluation work waits on a body, service ready body, binding
proof, layout, and executable-preparation work on the same graph. Preserve the
caller's declaration-subject list, `declaration_isolated`, lexical ownership,
and any early-demand policy across each pump. A pump must return with no active
worker borrow. Avoid recursive phase draining and worker-blocking waits.

Do not simply delete whole-body/proof/lowering prerequisites. Replace each with
a narrower readiness proof that protects the data actually read. Likewise,
guarding every `sem_layout_all` call with an early-mode flag is insufficient:
layout admission must wait for field declarations, and `layout_checked` must not
skip pending types. Existing helpers can diagnose cycles prematurely when called
outside the phase in which they were designed.

Retain failed body diagnostics on the producing receipt until the owning consumer
selects them in source order. The attempted integration could let an early helper
error escape through the coordinator's program error, or lose it when body work
was cleared. Extend dependency-failure traversal and cleanup deliberately.

Finally, separate early demand from normal body completion/pruning. Restarting a
completed admission cursor must not recheck completed functions. Normal checking
must still visit required non-generic bodies and collect root operations added
after early staging. Do not prune a signature-only instance before a later
executed dependency can demand it.

### 5. Validate this feature at its actual boundaries

Use the existing Tower fixtures and focused runners. Add coverage for:

- A callee unavailable across repeated interpreter attempts; argument mutation
  occurs exactly once. The primitive fixture in this checkpoint covers this.
- A distinct published snapshot and failed publication (primitive fixture), plus
  an indirect callee through the production producer once implemented.
- Nested helper calls and mutable local computation inside the staged invocation.
- An immutable captured initializer that calls a helper and feeds an array extent.
- Generic helpers and aggregate arguments/returns using the ordinary ABI lowering.
- A helper that needs a local type query/proof/layout before its body can finish.
- A true body/type/value cycle; a noncyclic unfinished producer; an untaken branch
  containing an unsupported call or invalid capture.
- Cancellation while waiting, discarded/published stage ownership, and cleanup
  of interpreter frames, aliases, diagnostics, and input views.
- Canonical output and source-ordered diagnostics at 1/2/4/8 workers, both target
  pointer widths, and real overlap. Queue width alone is not overlap evidence.

For the future end-to-end fixture, the attempted cases included
`u8[combine(increment(&count), increment(&count))]` inside an ordinary helper,
`u8[identity(i32, 3)]`, an aggregate extent helper, and an indirect callback.
Those cases were removed from the passing suite with the unvalidated integration;
they are acceptance ideas, not current supported syntax/behavior claims.

That paragraph records the historical checkpoint. The [current focused native
acceptance](staging_extent_acceptance_e3958206.md) checks all four dispositions:
generic identity, aggregate and indirect extents execute at32/64 bits and workers1/4;
the exact mutable/address-escaped local capture is rejected by the documented
capture contract. Invocation-local mutations inside an extent helper execute once
in order, including controlled waits on compiled helper inputs. Single-unit and
ordinary imported-module canonical execution pass; controlled post-compile waits
remain distinct from natural frontend scheduling observations.

## Disposition of the former numbered remaining chain

1. **Module captures:** implemented with initialization/effect and alias proofs;
   current-source integrated acceptance is separate from those older fixtures.
2. **Lifecycle integration:** mixed aggregate/lowering frontier implemented;
   retain justified ordered boundaries and close the specific failure callers above.
3. **Explicit ownership:** production world/session APIs and checked startup are
   implemented; legacy VM lifetime and uncharged/fatal allocation boundaries are
   explicitly scoped above and in services, not an unperformed blanket audit.
4. **Shared imports/revisions:** isolated worlds are supported; broader immutable
   cache reuse remains a measured optimization candidate requiring a complete key.
5. **Scaling:** bounded observations now exist, including useful overlap and a
   slower Deck jobs4 control. The final representative cost/critical-path gate
   remains open; queue width cannot close it.

Ordered grammar changes, effects, type interning, and short publication sections
can legitimately remain serialized. Completion means independent eligible work
can run safely, dependencies are explicit and resumable, and results are
deterministic—not that every loop runs on multiple threads.

## Development and publication instructions

- Work on `main`; pull/rebase before work and after committing. Preserve others'
  changes. Do not edit `todo.txt` or introduce new C++/Python/JavaScript logic.
- Freeze the compiler import closure while a build or compiler-project package
  is reading it. Reap a failed build before editing/restarting. Concurrent Ninja
  processes in one cache and truncating their shared log obscure failures.
- Compile the smallest changed Tower unit first. Use `query-smoke` for scheduler
  continuations, `type-smoke` for type/query changes, and `control-smoke` for
  lexical control changes. Reuse passing unaffected evidence.
- Run the complete public-bootstrap/native/browser/generation publication checks
  once per coherent milestone. Do not repeatedly restart them for each handler.
  Follow [AGENTS.md](../AGENTS.md#validation-and-performance) for profiling and
  final supported memory/race sanitization; the 2026-11-22 policy audit supersedes
  this handoff's former sanitizer prohibition. No repository-wide formatting or
  broad cleanup sweeps.
- Keep runtime build identity distinct from documentation publication identity.
  Documentation-only deploys reuse verified assets. Preserve concurrent manifest
  receipts; if a newer manifest appears, compare assets/build identity before
  adopting it. Do not call an exact-manifest mismatch a passing verification.
- Publish and verify the hosted result, then leave a clean tree and update this
  report/journal with the actual source/deployment identities and test outcomes.

The November 22 development cache was container-local at
`/tmp/tower-home/.cache/tower/ecs-local-query-new-pin` in `tower-parser-retirement`;
it is historical evidence, not a current shared build location.
`cmake --build` does not copy the executable into `build/native`; the documented
`playground/scripts/build-native.sh` does. Do not infer a current `build/native`
binary from a successful cache build. The public Linux x64 bootstrap is a
platform-specific development bootstrap, not a portable compiler release.

## Future direction that must not expand this checkpoint

Stronghold should eventually enforce ownership/access and initialization policy
over the shared nodes and ECS contracts. Tower retains explicit low-level options;
do not impose universal safe-handle overhead now. Safe handles, pinned views,
borrow scopes, and non-ECS owned allocation need a separately specified memory
model. Null-only race behavior does not by itself prove memory safety.

Compile-time parser/regex tables and ordinary interpreter-produced constants are
motivating future workloads. LLVM can optimize known data and inline eligible
code, but constant tables do not make the input stream known, guarantee full
loop unrolling, or guarantee the fastest possible DFA. Preserve that distinction.
Explicit compile-time code generation may coexist with inferred staging, with
portable interpretation and explicit effects/target/cache identities. Do not
introduce a separate pre-LLVM folding evaluator to chase that goal.

## Validation and publication receipt

The previous local-capture release `ecc4333` passed the public-bootstrap native
build and successor proof-unit compilation, native type/query checks, all three
real-browser worker checks, and two identical edited browser compiler generations.
Its native SHA-256 is
`7343162d925e0abe9a1449f5cf42028e84b30a46bb6cd53060e9284275658d68`;
project SHA-256 is
`b3a0e80ac402f1cc18c98a57bf73bc30d83c681b4d40ba20cba15f1ab2b92cfb`.
Hosted verification passed all 104 assets and desktop/mobile checks after adopting
a concurrently published documentation manifest with identical runtime identity.

Checkpoint-specific validation and deployment receipts are appended below only
after those steps complete. Failed experimental evidence remains in local
`build/language-next-audit/staged-bodies-*.log`; those ignored logs are not release
artifacts and are not guaranteed to exist in another checkout.

The checkpoint's runtime source is
`b5bc8173899d2f5daa618d9f181cdfd2902468ab`, rebased onto `9d84f04`'s verified
Bedrock/import/inspection changes. Its scaffolding tree is
`4946ca80ae2e85232c51f885e62c3201c19bc5c6`.

| Check | Result |
| --- | --- |
| Documented native build after source rebase | Pass with the private bootstrap override unset. |
| Successor compiles `semantic_binding_proofs.tower` to LLVM | Pass. |
| Native query-smoke and type-smoke | Pass, including serial/worker and 32/64-bit profiles. |
| Browser worker suite | 3/3 pass, zero skips; overlap, failure interruption, and 1/2/4/8-worker determinism. |
| Edited browser compiler generations | Both pass, with identical bytes and edited semantic behavior. |
| Reused target support | All seven hashes match upstream Pages `b40bb38`. |

The first target-pack comparison found four stale local files. Restore the exact
verified upstream files before regenerating compressed assets and their manifest;
do not represent that first comparison as passing. The runtime implementation was
not changed by this checkpoint. The resulting bundle contains all 104 assets.

Native compiler SHA-256:
`142459861bd0f5eecec96891cbf5d6d035f131e387408eabab31276883afb92a`.
Compiler-project SHA-256:
`406a401a9af04b7d0f1be8e1a7603c2317d6c4528bad0c7b606f284aa6d6c112`.
The browser/runtime build used predecessor
`18664657c3ff9142a6d59bef8ffa794fd10d12313d55f91dd47f5575141a29f9`.

Identical edited generation outputs:

| Reactor | Bytes | SHA-256 |
| --- | ---: | --- |
| Tower | 1,383,764 | `200e867b73aaa8437126cb1f7f8b153e6995649842e73ee2afcd695c76bf8a47` |
| LLVM | 35,179,281 | `3e2effc4b43f1fa2b2d8df615038cd312cc6f39f393ef273f2d4efaa68a93545` |
| Cross | 56,323,462 | `ab8bd1351e645c970a844b96619631712c8e0260d46b7767756457d3d25c5a8c` |

Local evidence is under `build/language-next-audit/staging-checkpoint-*`:
`rebased-native.log`, `rebased-successor.log`, `rebased-query.log`,
`rebased-types.log`, `browser-build.log`, `browser-workers.log`, `generations.log`,
`workbench/generation1.json`, `workbench/generation2.json`, and `targets.sha256`.
Hosted publication is recorded separately after deployment verification.

The final source rebase incorporates `60a276e`'s IDE-fixture migration and changes
the checkpoint commit to `f494e22042172ebd72ddffff8051ec0128029899`. Its scaffolding
tree is `6e3234202311e435df01ec2120389cde1e68ef6d`. The added/changed IDE fixtures
are absent from the compiler-project recipe; compiler/runtime, grammar, library,
backend, build-tool, and browser asset sources are unchanged from the frozen
build above. Repeat the documented native build and successor proof-unit compile
after this rebase: both pass, and the native compiler hash remains identical.
Reuse the unaffected browser/generation results and record the source equivalence
explicitly in the deployment manifest. Preserve upstream Pages `3937cad`'s
additional IDE-migration receipt and its unchanged target assets.

## Historical publication and later upstream integration

The final documentation-only rebase produced implementation commit
`cf47b568f34c39249aee8e4377d47a1c3fbeddd0` and report commit
`d51164fd60f8dd06806a5c21f57602f2bf717a0b`. Both were pushed atomically with Pages
`f1a5dd372f80d86580ad6cafa24b96ba6cbe83ea`; workflow
[45048091240](https://github.com/TrevorSundberg/tower/actions/runs/45048091240)
succeeded. The first attempted atomic push was rejected by a concurrent main
update; it published neither ref. It was rebased and retried normally.

The hosted asset check passed, but the first UI run timed out waiting five
seconds for contextual completion. An unchanged retry passed the complete desktop
checks and hit the same deadline on mobile. The language service already permits
ten-second queries, so `verify-deployment.mjs` now gives its completion-popup
assertions the same named 60-second deadline used for asynchronous compiler
responses elsewhere in that verifier. Expected counts, labels, and typed filtering
are unchanged. This is a browser validation-boundary adjustment, not a compiler
implementation or removal of a check. Keep both initial failure logs.

Concurrent publications then changed the increment example and its documentation
receipt. Compare the manifests: only `increment.tower` changed among the 104
assets, while the compiler/project/runtime identities stayed at `cf47b56`.
Preserve that published example and the newer manifest instead of overwriting
them or accepting a mismatched manifest. The exact manifest used for that
final hosted run has SHA-256
`2264cdbfd0dc671a4404f3971be5e4552a80f3fc24267a72dff181bdadeb46f8`.

Upstream also merged the separate hosted-linker/bootstrap milestone through
`8c51600fa6160e81aa2e7efd60bbebcd7b1be39d`. The repository's then-current public
Linux x64 bootstrap at that historical integration hashed to
`c59e8bab69340cfcea7f03e3fa081b339dcf12230e84fd0c51870eb766551a75`.
A fresh documented native build with the private override unset and its successor
proof-unit compilation both pass after this integration. That native executable
hashes to `f51533b17340518e00b2f5ae1f000445280df77c227770aafb7d20f19d4c3098`.
Evidence: `staging-checkpoint-linker-rebase-native.log` and
`staging-checkpoint-linker-rebase-successor.log`. This is native rebase validation;
it does not relabel the already published browser artifacts as a new linker build.

The earlier budget failure was measured with that older predecessor; it remains
evidence of the attempted integration's failure. Production helper readiness and
the current public pin are described above; do not resume this superseded
experiment or transfer its failure to a later bootstrap.
