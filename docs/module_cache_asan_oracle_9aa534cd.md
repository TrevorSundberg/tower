# Module-cache ASan oracle correction and complete regression

Initial published base `9aa534cde4d5dc150a2b28ac4ca0c0fe3bf3613c`, tree `5f2aef4cd2176f39c72939fcea1fe94a48d40380`; B1 import-snapshot/empty-cache guard included.
Public predecessor SHA256 `31a385c616b889987d68f8eb9714020f3928aac97591a1569f905ab706f52ed6`; same exclusive native ASan cache/toolchain as [the failed baseline](module_cache_asan_c1ae62b1.md).
Only `tests/frontend_modules.tower:372–374` changes: the representable allocation exceeding a one-byte initialized budget expects **Capacity**, with the corresponding comment/diagnostic corrected.
`module_cache_checks.tower` remains the unchanged entry into `frontend_modules_tests`; no duplicate fixture or packaging/production logic added. Audit found no other equivalent oversized-byte Invalid expectation in this fixture.
The actual path remains `frontend_units_create_bounded_result` → `work_pool_open_kernel_budget` → one `WorkSlot` → `work_buffer_resize`, whose explicit oversized physical-byte rule returns Capacity.
Malformed/null/wrong-owner/overflow/lane Invalid rules, actual allocation Memory failures, caps/counts, denied-owner conservation and healthy retry assertions are unchanged; no allocation-policy change.

## Preserved baseline and focused execution

Original exit134/signal6 at `Unit startup preserves invalid total budget` remains failed evidence: 0.21s wall/0.20s CPU/113,064KiB RSS, before the new baseline-import checks.
Its original logs, failed executable and original/instrumented parser-unit IR/object/depfile are preserved in the new task's `baseline/`; no failing-before speedup comparison.
One dependency-aware target refresh rebuilt only the parser unit containing the fixture, instrumented/compiled it, and relinked: **3 actions**, other **28 linked objects and IR byte-identical**.
Actual link remains 25 direct objects plus four archive members, **29 instrumented Tower objects /5,570 original definitions**; changed-unit ASan load/store hooks and executable initialization/worker export rechecked.
Unchanged `instrument_llvm`, guest/provider/compiler-rt hashes and the 86e8d553 sensitivity evidence reused explicitly; no repeated negative/26-storage/query/type/control/browser/generation suite.
Command: from `scaffolding`, `ASAN_OPTIONS=detect_leaks=1:halt_on_error=1 timeout 180 /root/.cache/tower/l1_storage_asan_1bfe0657/build/tower-module-cache-tests`.
Existing CTest registration `tower-module-cache-regressions`, original180s guard; **1 selected /2 source-bound executions /2 passed /0 failed /0 unstarted** for the original complete fixture, including the changed-provider check below.
Actual exit0; exact output `Module cache, resolution, immutable grammar and session checks passed.`; stderr empty, normal completion with LeakSanitizer enabled.
The entry runs resolution/seed/diamond/clone isolation, changed imported input and transitive resolution, cycles/missing inputs, session reuse/retirement and active-lease disposal controls, both clone-budget variants and startup admission/retry.
It now also completes `module_baseline_imports_test`: initial empty-cache Foundation installation, exact declaration reuse, unchanged generation, failed replacement preservation, changed-input invalidation, successful replacement and world-clear purge.
Outstanding request declaration ownership survives replacement. Final module/world teardown asserts **used_bytes=0, live grants=0, used_lanes=0**, then successful budget disposal; no assertions skipped or capped inputs reduced.

## Cost and source boundary

Orchestral-Revng Ubuntu24/LLVM-Clang19.1.1, CPU0–3, outer2/compiler1; systemd4GiB resident/no-swap scope, unlimited virtual addresses, source frozen through build and execution.
Changed-fixture build **49.58s wall /42.49s CPU /791,108KiB peak child RSS**; cgroup peak1,193,029,632B, memory max/OOM events0.
Complete passing run **0.27s wall /0.25s CPU /127,868KiB RSS**; cgroup peak83,070,976B, memory max/OOM events0. RSS, cgroup charges and ledger ownership are distinct scopes.
These are test-validation costs with different completed coverage before/after, not a production throughput/regression claim. L1 changed no compiler policy.
Corrected fixture SHA256 `90300b38673150967e6e8b14f785454eb0d85b71f2dd9f0cb49a8537c97024d2`; executable `9a1b1ce9f7042f9338bc68a0e672bce8cc69208cdd0220efcf6a4d421aee9c9b`.
After adopting ROOT constructor-result fix3f1e515f, frozen merge `8102727a35eed06990b1390f4a64ddb504537ba0` rebuilt only its affected entities/parser objects and relink (5 actions): 54.08s wall/52.72s CPU/790,476KiB; cgroup1,022,902,272B.
Same complete gate passes again: 0.30s wall/0.29s CPU/127,284KiB, cgroup86,892,544B, exit0/empty stderr/final zero assertions; executable `d7573e996f564061b614c35325e92137d13b182172507f06703aa5e50ccb5e9d` and rechecked29-object closure retained in `merged_8102727a/`.
Source/import/provider hashes verified after each run; jobs drained, todo untouched. Incoming7248827c thread-only CMake control is inactive for address mode. Later2cdb3eba Entity bucket ABI is preserved in history but outside these frozen runtime results.
B2's separately owned combined old-idle/active-lease/world-clear addition was not published through origin3e29944b; this receipt covers the complete original fixture, not that later extension. No current-main bucket-ABI ASan claim.
Physical ASan does not generally cover retired pooled subslots; external LLVM/libc internals, source-language UBSan, TSan/race proof and other-host coverage remain separate.

Raw commands, registration, original failure/binary, patch, full source/import/object/IR/nm hashes and process status/time/cgroup logs: `C:/Sandbox/build/codex_ecs_20261122/L1/module_cache_asan_9aa534cd`.
No public pin/deployment change; ROOT retains combined adoption and publication.
