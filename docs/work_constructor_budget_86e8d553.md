# Constructor byte-cap oracle correction and exposed producer failure

- Result: stale fixture expectations corrected; constructor-budget acceptance remains **BLOCKED** by a separately exposed Capacity-to-Memory propagation defect. No production changes.
- Freeze `86e8d55369982d8bae0f3817ff3b00bde516685a`, tree `522e0fed8b2b5200a6aeb4907b34da4741e6f528`, includes accepted b36a5f7c. Later Entity geometry is outside this boundary.
- Public default compiler SHA256 `31a385c616b889987d68f8eb9714020f3928aac97591a1569f905ab706f52ed6`; no bootstrap override. Existing Linux x64/Clang19 native cache, CPU0–11/24GiB, two build jobs, 97GiB initially free; no owned live work at start.
- D1's source finding is in `entity_partial_buckets_peer_c8555971.md`; this task supplies the previously missing untouched-fixture execution.
- Original fixture blob `469d828f39c060ae624b0918c14ccf894bf1ef70`; original executable SHA256 `9cf67e05f9750676ff04ec171ee28766cfcfb066404532b90ab068b8dcc06a06` retained.
- Original command: `cmake --build /cache/native --parallel 2 --target tower-work-constructor-budget-tests`, then `/usr/bin/time -v ... stdbuf -oL -eL before`. Line buffering preserves diagnostics; no allocator/producer substitution.
- Actual first original output: `1`, `2`, `1`, `Work constructor budget regression`; exit **1**. These mean cap1, wanted Invalid(2), actual Capacity(1).
- Contract: `work_buffer.tower:35` returns Capacity for a representable physical allocation exceeding an initialized byte cap; `compiler_work_create_result:68–69` directly forwards that first allocation result.
- Four stale expectation branches now require Capacity; the existing fifth Capacity case is unchanged. No cap, allocation order, success condition, failure check or production error code was relaxed.
- Physical self/store sizes still come from `compiler_buffer_allocation_size(sizeof(...))`; page/index sizes still come from the actual standalone probe's buffers. No duplicated layout constant or padded admission.
- Six configured caps remain:1, self, self+store, self+store+index, self+store+page,1048576. The final1MiB success case and store/nonempty-output checks remain intact.
- Added missing direct null-output/zero-unit/zero-worker Invalid assertions before each cap trial; they must leave null output and zero bytes/grants/lanes. Existing nonempty-output Invalid assertions remain.
- Final budget-trial conservation now explicitly checks zero lanes as well as zero charged bytes/live grants and successful ledger disposal.
- Adjacent existing `work_buffer.tower` malformed-preserve/overflow/foreign-owner Invalid assertions remain unchanged; that separate executable was not rerun or counted as passed here.
- Corrected executable SHA256 `67d3ff153828af15e2b70a93bce19675cbadc86c4e4fd24364d3dff10d22a461`; its actual first failure is `3360`, `1`, `3`, `Work constructor budget regression`; exit **1**.
- Thus the corrected fixture reaches a later derived cap and exposes wanted Capacity(1), actual Memory(3). The malformed-input checks before that failure pass; later cap/success/teardown assertions are **unreached**, not passed.
- Source handoff: `compiler_work.tower:76–77` calls `entity_create` for owner/kind. `entities.tower:64–66` discards the per-call result from `entity_create_result`.
- `entities.tower:84–85` returns the checked owned-allocation failure through that result; it does not latch `store.resource_error`. `compiler_work_create_failed:51–53` instead reads graph/store legacy errors, then substitutes Memory when both are None.
- This establishes a concrete lost typed-result boundary consistent with the cap3360 failure. The production fix must carry the first per-call entity admission cause through cleanup; do not map all Memory to Capacity or restore a shared error latch.
- Producer blobs: compiler_work `5dea21fc96a24cdfc87a337943cd29a39ac831c2`, entities `cbcb1b7f56fd6a74062101ddd8f10e140967fd3f`, work_buffer `2a0ebee833cdb59241413526d18ba89a39949687`. No production edit was authorized or made.
- Corrected build requested only constructor-budget and the adjacent constructor-fault target. The budget failure stopped the first run script; the already-built independent fault control then ran once separately.
- Original constructor-fault settings unchanged:8 units/4 workers,1MiB cap, serial allocation prefixes bounded by512, Memory/null-output on denied allocation and first successful retry. PASS output `0`, exit0; every executed trial checks zero charged bytes/live grants, ledger disposal and allocator count restored.
- Fault executable SHA256 `135966ec34e843ec3cacdc61bd4fcec31ea2fbe6798f8441a48f0d25308f1edb`. Exact first-success prefix count is not emitted; do not claim all512 prefixes executed or concurrent sanitizer coverage.

| Validation | Wall / CPU seconds | Peak RSS KiB | Result |
| --- | ---: | ---: | --- |
| Original build,4 actions | 1.69 / 2.12 | 236052 | pass |
| Untouched budget fixture | <.01 / <.01 | 1600 | failed, exit1 |
| Corrected + fault build,4 actions | 1.57 / 2.08 | 237780 | pass |
| Corrected budget fixture | <.01 / <.01 | 1624 | failed, exit1 |
| Independent original fault control | <.01 / <.01 | 1384 | pass |

- These are validation costs at GNU time's displayed precision, not a before/after runtime performance claim. Production is unchanged; prior import-reuse performance sets remain untouched.
- Raw commands, logs, source hashes, depfiles and both executables: `build/ecs_b1/cache/constructor_budget_86e8d553/`; handoff `C:/Sandbox/build/codex_ecs_20261122/B1/constructor_budget_86e8d553/`.
- Required next gate: fix the production per-call result handoff, then rerun these original caps through the1MiB success and all final owner checks. This receipt does not grant constructor-budget/native acceptance.
- No broader native/browser/generation/profile/sanitizer or deployment operation; no cap increase, source substitution, other-owner change or new optimization. ROOT owns production assignment and final integration.
