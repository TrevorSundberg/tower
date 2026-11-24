# Native large ECS checkpoint — partial acceptance

L1 froze published `b862499b73349b241e7e384d17a1dcab8a8c0800`, tree `68be1836e4cd573a82901c59c210cb745df278fe`; later compiler candidates are excluded.
Default public59d predecessor SHA256 `eeb005717318086c145428edc3b6b784d4729df7ef0514c7329e0a18b76dda9c`; no private override, repin or production change.
Ubuntu24/LLVM19, Orchestral-Revng, CPU0–3, existing l1_ecs_native cache, build jobs4/compiler jobs1. Actual WSL15GiB; external8GiB cgroup/no swap; L2 separately used CPUs4–7.
One dependency build of towerc/execution/source runners:60 actions, exit0,67.37wall/165.61CPU seconds/893608KiB maximum child RSS; process-group peak2170105856B, OOM events0.
Compiler SHA256 `482aa811fc7f69af4b27619d9d91c19dbae7af1e53694d3d0045a0d465af8841`; execution `47175240c4547e4fc2449cd7152a33cfb74a2d0dda2f57c940d16334646b36bf`.
Source runner `b7a2fa37a15c245f96f27943110d58a2bee16755a01e1058495b5f16b0a88353`; binaries remained unchanged after the fixture-only repair below.
Inventory: T8 compiler-entities has4 registrations; selected views and generic registries. “entity_registry” here is its actual `tests.generic_registry` program, not the separate native storage utility.
Existing semantic-port supplies entity_pages. Native equivalents reuse towerc, backend-pointer-execute and source/recheck APIs; no dedicated native T8-named CTest or new test framework was invented.
The three original fixtures plus registry_body_budget match d962222a exactly; known literal output remains `0\n`. Previous receipts remain historical, not current performance baselines.

Views COMPLETE: both layouts32/64, workers1/4, Graph/Fast, full canonical reparse/equality, raw/O2 LLVM reconstruction/recheck/equality and native Linux x64 raw/O2 outputs0.
Registry initially passed both interpreter/reconstruction widths, then raw native link failed: `undefined ELF symbol: tower_entity_finalize`, exit1,1.72wall/1.38CPU/179796KiB.
The standalone fixture lacked the lifecycle ABI supplied by the browser adapter. generic_registry_type_result registers lifecycle0; entities dispatches the owning callback only for nonzero.
Small repair adds the same fail-fast Tower callback as entity_views; no registry/storage/compiler policy changes. New fixture SHA256 `e2a6709f804288c297f372dc1b01480b67988dbf95d3cfe2cbeef940fa87c6da`.
Smallest changed-fixture native link now passes1.84wall/1.34CPU/175072KiB and executes0. Only registry's affected checks were repeated; all32/64/raw/O2/Graph/Fast/canonical/native paths now COMPLETE.
Source-worlds/recheck CTests2/2 PASS: retained output, wrong/missing world, object/link/invalid-input failure, typed Capacity rollback/retry and cleanup;1.36wall/1.03CPU/170236KiB.
Current accepted evidence totals60 successful command phases, including those2 CTests;52 Graph/Fast trials,5 original Graph and4 native executions independently return0. Old registry checks are separately retained.

Pages PARTIAL:32-bit source Graph/direct canonical Graph/Fast pass; worker1/4 canonical bytes and fresh reparse match. Raw LLVM import/recheck succeeds both workers with identical4769423B Foundation output.
Both imports report resource0 and finalbytes/grants/lanes0; peak charged bytes2274158856/2274158080, ledger metadata83886080B retained until disposal.
The subsequent existing2GiB execution-world profile rejects reparse: `Semantic memory budget exceeded`, expanded Foundation line110976:5, then `Pointer canonical execution`; actual test-child PID723 exits134/SIGABRT after17.80wall/9.62CPU/2433156KiB.
This message maps to WorkBudgetError.Capacity. The helper closes the failed session and checks world/budget zero before returning false to its outer assertion; no post-abort heap census is claimed.
Failing input SHA256 `a4e1eaaf5503f4f8596afe49352e74078f349938029b26f536833a0a32b51b46`; canonical input983366B/SHA256 `47f43eaa4e547f5e83097c03597a22862b9d611b5ef73139fc748d650aca296c`.
The2GiB helper limit,24GiB reconstruction ledger,100000000 fuel and180s phase guards stayed unchanged. External process-group peak2908897280B; all OOM/max events0, so this was not the8GiB host cap or timeout.
STOPPED there:18 later planned command phases unstarted—pages optimized32, all64-bit and native executable paths. Full milestone is BLOCKED, not passed; exact command/input/location in E/ROOT_handoff.txt.

Accepted phase sums (wall/CPU seconds; maximum child RSS KiB): views116.30/126.31/1766304; repaired registry188.51/200.37/1959712; pages' seven passing phases31.49/34.29/2596432.
These are n1 validation costs, not uninterrupted end-to-end timing or speedup. GNU time's signal case prints “Exit status:0”; actual shell134 and “terminated by signal6” are retained and authoritative.
One earlier OS-only failure is also preserved: a global logging label corrupted the views native launch path, exit127 before execution; final hash check used wrong cwd. Scoped OS fixes resumed only unstarted phases and reused already-built bytes.
No assertions, compiler semantics or expected outputs were weakened; full Foundation/optimized IR and native reference bytes remain retained, with actual byte comparisons before hashes.
Ownership evidence is explicit world/ledger cleanup and fixture store/component/finalizer assertions, not global allocator coverage, packed-payload/noalias proof or universal race freedom. No new deliberate finalizer injection ran.
E: `C:/Sandbox/build/codex_ecs_20261122/L1/native_ecs_b862499b/`; complete scripts, PIDs, commands, failures, source/output/IR/native artifacts, timings and manifests. `fixed/` identifies the sole fixture overlay.
No browser/vendor/reactor/generation/package/sanitizer/deployment run. ROOT retains integrated package/hosted adoption and the remaining capacity-profile decision.
Integration: main887f2539 preserves incoming lr_lalr, tool and unrelated fixture changes; exact scope is in E/incoming_source_scope.txt. They are excluded from b862499b runtime evidence; the five-line registry patch and all frozen binaries still match the tested hashes. Billing recovery reran no build/test/profile.
