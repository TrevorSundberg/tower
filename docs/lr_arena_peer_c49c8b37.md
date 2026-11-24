# Charged LR propagation arena: independent B2 acceptance

Accepted at `c49c8b37afd39011bc7894961e16791f25c1c478` (tree `4bea985b8248e7f2bc29e310787a6ec8d0a89e9a`); production repair `f17fee95`, baseline `bf9429d9`. No production correction was necessary.
Verified descriptor and exact owner blobs: compiler `5386b9bd3939ae0b7c581bd333ab49406bf826d3`, fixture `11446ed10eb3c42a5d9d66b82f694d7f2ffe510c`.
Independent complete build-source census: 1,374/1,374 files match both owner inputs and published source; final 61 binaries/resources, 39 reference files and 1,245 resource files match their manifests.
All 1,168 handoff metadata hashes match. Inspected/rechecked 74 ordinary samples, 882 complete source/canonical comparisons, 28 CLI output controls (24 Tower exact objects; four Clang outputs), nine Graph/Fast/native ABI-42 results, and 13 separate observers/171 further artifact comparisons.
The remaining native cache matches all 47 CLI object hashes; two of 46 earlier profile objects were subsequently replaced by ordinary CLI configuration. Their recorded profile hashes and immutable executable remain distinct; no claim that the mutable cache is the old profile link set.
Full source/runner/archive hashes and comparison records are in the raw directory below; three owner source archives and the `225b0997...` evidence archive were independently rehashed.

Reviewed reserve/merge failure atomicity, create/seed/SCC/dispose, arena allocation/append/dispose, dispatch/join/cancel, component creation and owner/view cleanup, including all two-file changes.
Incoming rows have coordinator lifetime; destination rows are unique per wave. Results never alias that wave's input rows. Job arenas transfer only after synchronous dispatch joins and every task error is checked, before any row swap.
Only initialized jobs are disposed after partial setup. Failed work leaves input rows/pending intact; private chunks retire, already-transferred chunks remain graph-owned. Independent old buffers retire once; borrowed rows are never individually freed.
Append rejects incompatible budget/configuration before mutation. Every valid job starts with the graph budget and workers cannot alter that identity; a later append failure cannot arise from resource denial. Already-transferred chunks remain safely graph-owned even on an error return before publication.
Narrow/denied-lane fallback uses existing SCC materialization; it does not share mutable row payloads. Existing null-ledger, late independent-buffer promotion, repeated waves, partial dispatch/drain and world refusal tests remain enabled.
Added one Tower fixture for the uncovered borrowed-result reuse boundary: transfer an initial worker chunk, force later growth Capacity, assert unchanged input/queue and live old borrow, release/retry, reject a foreign-budget append without mutation, publish, dispose the private arena and read every literal row before final graph disposal.
It restores the exact prior charged bytes/grants/lanes; the enclosing existing LR suite requires final zero ownership. New fixture blob `bc1dd0e2a1f72f04071817b6f316d643c3ff7d55`; production blob unchanged.

| Independently executed selection | Wall s | CPU s | Peak RSS KiB | Result |
|---|---:|---:|---:|---|
| Exact owner LR runner | 1.037796 | 1.650373 | 550024 | pass |
| Exact owner scratch-budget/literal/transaction | .014680 | .014392 | 50872 | pass |
| Exact owner eager LR oracle, 150 randomized cases | .254463 | .217338 | 56384 | pass |
| Rebuilt LR runner + borrowed-result case | 1.249616 | 1.849953 | 544564 | pass |
| Exact owner shared-budget runner | .009355 | .017491 | 1616 | pass |

The LR runs include real caller/worker barrier overlap with production allocation, exact serial/parallel records/conflicts, capacity denial/retry, lane competition and world cleanup. Serial allocation-failure oracle evidence is separate from concurrent coverage.
Only `tower-lr-work-tests` was rebuilt through the owned dependency cache, public SHA `745afa2f...`, Clang19/CMake4.2.3, outer2/compiler1; final dependency check reported no work. New ELF SHA256 `ba7896ab551ce884d948e7d6a80a99a81ef67fd7d97ca62ae16a40b80ce0776b`.
Preserved three fixture compile errors (reserved `token`, missing explicit work_vector import, usize/u32 comparison) and fixes. Four build attempts cost 75.207wall/78.323CPU s, peak child RSS815988KiB; successful final build19.123/26.017s. No production performance claim applies to this test-only addition.
Preserved one selector transport failure: a trailing CR from the wrapper became part of `lr-order`, returning1; corrected LF wrapper passed unchanged oracle. Initial metadata path lookups were corrected to retained round1/round2 directories, with no missing evidence excused.
Owner timing is attributed evidence, not rerun: original multi32 regression +37.58%; final paired bf3.268021/33.743464 -> repair1.612418/16.583174 wall/CPU s. A and final B cohorts remain separate.
Final paired small serial .244678 -> .250498s (+2.38%, mixed pairs); repaired multi32 remains slower/higher CPU than multi8 (1.258237/6.366841s). No full-core profitability or Clang parity claim.
Owner final multi32 retained446458659B/grants319919 are pre-close ownership, not leaks; peak charged903500104B, ledger83886080B and RSS1261812KiB are separate scopes. Own tests assert exact restoration and zero final owners; no new allocator counter was invented.
Host partition CPU12-23/quota12/12GiB/swap0; one build family. All owned active build/test jobs drained; cgroup max/OOM/kill events0, ~75.6GB disk free. Old container zombies are historical, not live workers.
Raw: `C:/Sandbox/build/codex_ecs_20261122/B2/lr_arena_peer_c49c8b37/` and `/cache/lr_arena_peer_c49c8b37/`; commands, source/patch, runners, failures, process_profile output, owner hash/sample/artifact reviews and SHA256SUMS retained.
Owner source-bound cohorts remain at `C:/Sandbox/tower-agent-1/build/ecs_b1/cache/combined_performance_20261124_r5/`; see [owner receipt](compiler_combined_r5_bf9429d9.md).
Scope: independent native review/targeted execution, not ASan/TSan, full frontend, Wasm/browser/generation/release acceptance. L1/L2 instrumentation remains separate and must explicitly adopt this added fixture. No full-host benchmark, pin, deployment or r4 artifact mutation.
Publication reconciliation retains this frozen validation identity; later unrelated changes are excluded unless the relevant source closure is equal.
