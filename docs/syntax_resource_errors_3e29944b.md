# D1 — preserve checked syntax resource failures

Frozen base `3e29944ba578f1b573727e89b203891856e02375`, tree `4b928af285f4ac3a7b2e2a0e863ca4a5e3e50bb1`; fixes the accepted [E1/E2 findings](entity_typed_errors_peer_fe0fe605.md).
Exact final producer/test/callee bytes: [23-path Git/SHA256 map](syntax_resource_errors_3e29944b_blobs.tsv); unchanged mounted resources retain the base identity.
Existing D1 container image `4be584fb42a6cefb921b8f8bd686f61ef6e7e721eee2393b2ab1dfce16a7f4f6`, LLVM19, Release cache `~/.cache/tower-d1-ecs-20261122/native-coherent-127ca98`.
Public bootstrap SHA256 `31a385c616b889987d68f8eb9714020f3928aac97591a1569f905ab706f52ed6`; CPU0–1, outer build1, memory/swap limit3221225472B, native mkdir-owned heavy lock.
Before executables: storage `9d7d4e8a640ff31946c6ce88f20cdbdab4613fd60c2e885fe44f05a467f5e37c`, profile `400e331e0fac20652c8eb0e7534942a69176cd7bdb773db73f5b8ceb5e2cc6a5` (SHA256).
The before boundary exposes the existing expansion helpers/types for direct testing; their bodies and reset behavior still precede the repair. `before.patch`/`before.sha256` preserve this distinction.
**Actually reproduced:** reset descriptor denial returned None instead of Capacity; expansion descriptor denial returned Memory instead of Capacity. Both processes aborted134; original logs/status retained.
Reset now carries immediate bind/create/component/module errors through progress reset before diagnostic allocation, preparing replacement source/document/module before retiring old ownership. Bool compatibility remains.
Expansion now feeds checked related-create/component/allocating-attach results into its existing first-error path before cleanup/fallback. Detach behavior, traversal, limits, trace/root/container ownership remain unchanged.
No store error latch or cap increase. Shared expansion types and fixture helpers provide one ordinary Tower test boundary; no compiler model or new runtime harness.

| Actual focused execution | Result and scope |
| --- | --- |
| `tower-syntax-reset-resources` | Two geometry-derived descriptor/component Capacity trials; exact next-id phase, old source/document/provenance, release/retry; real Memory, Busy, malformed Invalid; diagnostic Capacity cannot overwrite earlier Memory. |
| `tower-syntax-expansion-resources` | Four descriptor/component/child-vector/standalone-name Capacity trials; phase/containment/trace/span preservation, retry, Memory/Busy/Invalid and first-error controls. |
| `tower-syntax-expansion-success` | Public expansion: literal42, span12/11, one replacement/two generated nodes and provenance. Also executes the unchanged original allocator-prefix failure/cleanup/retry oracle;256 is its guard, not a reported execution count. |
| `tower-syntax-session-old` | Original100 resets, failure/recovery, retained source and exact allocator conservation pass. |
| `tower-lr-work-tests scaffolding syntax-unit-controls` | Four32/64/requested1/4 configurations,12 independent42/43/44 results, source/input bounds and serial/parallel canonical equality. Affinity clamps4 to2 actual lanes. |

Resource trials and public expansion explicitly assert final zero budget bytes/grants/global allocator owners. Unit controls check joined lanes/bounded retained inputs and use existing close; no new global census claim.
Four CTests passed with no skips/timeouts:0.65wall/0.61CPU/91324KiB peak; unit controls17.38/21.75/422748. After sharing the original expansion oracle, only its affected CTest reran:0.07/0.06/50080, pass.
Old session control first exposed1054 retained optional grammar-plan buffers (61880→62934), not session-owned leakage. At joined fixture boundaries, clear the documented world-owned structure cache; exact equality remains required. Both failed logs and successful rerun remain.
Matched n1 profile command: `tower-frontend-units-profile scaffolding 4 WORKERS 4 uniform dependencies artifacts DIR`, workers1/2; nine generated source/canonical files are byte-identical before/after and between worker counts.

| Workers | Before wall / CPU / peak KiB | After wall / CPU / peak KiB |
| --- | --- | --- |
| 1 | 6.50 / 6.35 / 201568 | 5.82 / 5.71 / 201532 |
| 2 | 4.77 / 9.11 / 294968 | 4.69 / 8.97 / 295140 |

Canonical hash16239500726545994389 throughout; two-worker spans show actual overlap, joined lanes0. Retained bytes/grants unchanged52701941/42079 serial and52690253/42083 parallel (observed before close). No material regression observed; n1 is not a speedup claim.
Only existing storage/LR-unit/profile targets built, one cache/process: initial stale-cache refresh41 actions; captured17 build attempts include9 resolved compile/link failures,783.00wall/755.50CPU/886280KiB maximum child RSS total cost. Final affected provider/link rebuild4.22/4.04/199320. These are validation costs, not equivalent-build performance comparisons.
Final SHA256: storage `e2805ee0fb3ffe3a01b9f24f46f9304bd6f5d9b641ff89ce71f3d891d221be9b`; LR `1d0cc45029712439462d04ccdf16dccd84fb56c64bbe63b88d60292ed7d91c62`; profile `e6fc6cc4cc97530f749167c64f96e87f701bef0cd931b822a88450d4c9d5b660`.
Raw evidence: `build/d1_ecs/syntax_errors_3e29944b/` (`run_before.sh`, `before.status`, `validate.sh`, `ctest.log`, `unit-controls.log`, `old_expansion.log`, all `.time`/build failures, before/final patches and hashes, artifact directories/diff).
No full storage/parser/type/Node/browser/generation/sanitizer matrix, compiler/reactor build or deployment. Actual four-core adoption and final integrated release remain ROOT-owned; previously failed evidence stays failed. Disk125GiB, owned jobs drained, todo/history preserved.
