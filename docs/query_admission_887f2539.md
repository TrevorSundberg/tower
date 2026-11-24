# Native query admission follow-up — 887f2539

Freeze `887f25392374b65234e858fbf3f94a3d824441c8`, tree `c11a726172d1f55c1161e043e19ef2653970f8e8`, plus the single fixture patch below; 2026-11-24 UTC.
Public default `/work/bootstrap/linux-x64/towerc` SHA256 `eeb005717318086c145428edc3b6b784d4729df7ef0514c7329e0a18b76dda9c`; documented selector, no environment/private override.
KinmenA Linux Docker `tower_build:latest`, CPU0–11/24GiB, Release cache `/cache/native`, compiler jobs1/build parallel4; production allocator, synchronized world budget.
Original failure remains in [native acceptance](native_ecs_acceptance_1072141e.md): constructor32/64 × workers1/4 returned pumpFailed/programCapacity/graphNone/both interpreterCapacity, before suspension. It is not relabeled passed.
Source attribution: prepared invocations already own entry frames/node caches; `ix_step` → `ix_needs` → `im_sequenced_set` grows the initially empty sequencing map. Full remaining shared-byte pressure denies that first execution allocation.
Constructor/body producer metadata also precedes graph insertion (`sem_type_execution_request`, `sem_body_request`); merely warming interpreter storage would not isolate graph admission.
Only `semantic_query_failure_checks.tower` changes. A setup-only calibration uses the original shared1MiB cap and records its actual peak, including replacement overlap, then checks complete teardown.
The real trial partitions that unchanged total: graph allowance = measured setup peak (a conservative bound for its graph subset); world/interpreter/pool allowance =1MiB minus it. Both ledgers are installed before owners/dispatch; no live rebinding or guessed headroom.
The coordinator exhausts only the graph ledger after preparation; interpreter/producer storage remains ordinarily budgeted. Graph mutation is coordinator-owned; concurrent private interpreters use the synchronized world ledger.
No production hook, allocator injection, cap increase, forced serial transport, replay, altered suspension/result oracle or production implementation change.
The original failure/retry/drain assertions remain. Added checks require peer value42, both interpreter storage errorsNone, and unchanged graph task storage/identities on denial.

| Registration / requirement | Actual result and coverage |
| --- | --- |
| `tower-semantic-query-failure-constructor` | Pass;32/64 × workers1/4: real waiting_type, peer42, graph/programCapacity, no successful value publication, terminal retry, zero owners. |
| `tower-semantic-query-failure-body` | Pass; same four configurations, real waiting_function and peer completion before denied new producer. |
| `tower-semantic-query-failure-declaration` | Pass; same four configurations, denied executing-index admission, no retained running ticket. |
| `tower-semantic-dispatch-{default,admission,source}` | Three pass; ten existing width/configuration trials preserve Memory versus Capacity, source-first errors, no publication/replay, cancellation and zero receipts. |
| `tower-retained-source-updates` | Pass; workers1/2, exact edit/repeat/failure-repair and suspended-execution replacement; observed LR overlap0/2 and zero owners. |
| Earlier native selection | Reuse the57 passes and merged pool pass at their exact recorded sources; no rerun or attribution to newly changed LR/staging inputs. Combined ledger:64 selected registrations have source-bound passes, not one current64-test run. |

Actual CTest count7, pass7/fail0/skip0/unstarted0;12 query-denial trials plus12 setup calibrations. Original timeouts60s (six) /90s (retained), `--stop-on-failure --no-tests=error -j1`.
One dependency-aware build: query-failure fixture object plus three links; targets `tower-semantic-query-failure-tests tower-semantic-dispatch-tests tower-execution-tests`.
Build2.841751wall/1.273225CPU s/219140KiB peak RSS; selected CTest1.860365wall/1.273456CPU s/206860KiB; both exit0, container exit0/no OOM.
Profiler CPU includes waited processes; RSS is maximum process/child high-water, not summed simultaneous memory. Functional lane limits/one retained overlap interval are not scaling or race-freedom claims.
Before/after production profiling is inapplicable to this fixture-only correction. Prior failed constructor cost0.031147wall/0.020051CPU s/51716KiB is a failure receipt, not a successful timing baseline; A1 owns combined measurements.
Fixture SHA256 `4c32553ccb590ccc33bb3792ab2af453e1eec7ff4e416377a22704b8d0428bdf`; full input-manifest SHA256 `9d0939751e095114cd0784191afc2277984758d68b6803a5142510ecab069af2`; all recorded hashes unchanged through execution.
Query binary `a8a452df705703e01a3d05dbd94ab1605e46b80ed40a10f610043c068b4a4229`; dispatch `bd3c877e3c022988fc565e6e577ffa25186e170df620421dfe595c357549952d`; execution `177a4ddb816d92ca81c11ff581e7f830d4d62cf8bf34554467f679b2b7c8a4a3`.
Raw directory `C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/query_admission_887f2539`: `run.sh`, `source.txt`, `fixture.patch`, `inputs.sha256`, predecessor/binary hashes, configure/build logs, timings, `registrations.json`, `results.xml`, `LastTest.log`, statuses and input check.
Earlier failures/raw logs and all four stashes remain untouched; no sanitizer/service-rejected operation, profile, generation, browser or deployment check ran. These remain separate ROOT gates; package/release adoption is not claimed.

Integration: `3a0dd322` joined complete `bb953466` as `24f5a67711d3648061935c9f32182bdf525f4408`. The only incoming non-document delta is `generic_registry.tower` (an independent lifecycle ABI fixture, absent from the selected target inputs); every other frozen input hash matches. Original seven passing binaries/results remain authoritative without a rerun. See `merged_*` and `excluded_incoming_fixture.sha256`; the whole-input comparison reports that one changed, excluded fixture.