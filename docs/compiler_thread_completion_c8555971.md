# L2 TSan query and backend completion — 2026-11-24

**Completed:** all seven selected TSan positives plus the distinct full backend case now have passing source-bound evidence. The original180s query/backend failures remain failed. No new sanitizer finding or production defect was demonstrated; the fix is two measured thread-mode outer deadlines.
Frozen runtime remains `c8555971ff4e20c5ab6de2ea9d50da8906d7cf35`, public/default `31a385c6`; the original source/object/hook proof and sensitivity/five positives are [reused unchanged](compiler_thread_milestone_c8555971.md), not repeated.
TSan ELF SHA256 `1835374ee425fc30e596f2604d988a6190b8c9bd78b871df50608898e4548300`; same-original-IR plain ELF `7595decb499bc4acfa1176bdcba42848364421404272bc51c7391ff4e0caba52`.
Unprivileged Orchestral-Revng WSL2, LLVM19.1.1, CPU4–7, one owned family, 4GiB resident/swap0, unlimited virtual address space; no security change, service rejection or private bootstrap.
The same absolute resource root is byte-checked against the original freeze. Five later compiled-only provider/test files are excluded from that runtime-module manifest; the frozen ELF does not adopt B1's later import-cache policy or constructor-budget correction.

| Exact selector/run | Exit | Wall s | CPU s | Peak RSS KiB |
| --- | ---: | ---: | ---: | ---: |
| query-smoke, authorized900s diagnostic | 0 | 219.10 | 244.44 | 755712 |
| unit-admission, original180s | 0 | 51.20 | 61.43 | 971604 |
| backend, original180s | 124 | 180.13 | 232.06 | 1653240 |
| backend, one matched plain control | 0 | 23.45 | 33.70 | 1190064 |
| backend, bounded600s | 0 | 387.66 | 598.55 | 2152260 |

The prior query124/180.06s and this backend124 are preserved failures, not relabeled passes. `stdbuf`/timestamped OS transport exposes existing output without changing the Tower executable, assertions, effects, allocator or inputs.
Query staging combinations complete at40.539/86.601/133.529/180.690s; full staging ends185.084s, malformed-tree controls210.092s, remaining lifecycle/clone/publication/evaluation checks finish219.050s. These are cumulative wall boundaries, not exclusive phase CPU or idle estimates.
Full query retains32/64 and1/4 canonical/known/effect/lazy/capture/error/cancel checks; observed four distinct semantic threads, peak4,571 kernels per module trial. Compared with the already-passing14.49s plain query, instrumentation wall is15.12x; no repeated query control or performance-speedup claim.
Unit admission measures110689ns nested-release-to-next-outer start, checks distinct live threads, serial/parallel canonical equality, cancellation, source readiness and joined zero lanes/grants.
Backend completes all original32/64 object-byte, budget1/2/4 streaming, ordered failure, retry, active/idle cancellation and release assertions. Its64 stream events prove four held-frontend/backend handshakes on distinct live threads; waits9.305/11.787/9.911/11.556s remain below the unchanged30s guard. The original180s run completed the32-bit trials before timeout; no internal deadline failure recurred. The historical458.83s/SIGABRT remains historical, not current evidence.
All successful returns pass existing world/budget disposal checks: borrowed workers/stages/worlds or nonzero budget.live trap rather than silently clear. Intermediate retained module owners and object/graph receipts are expected live inputs, not claimed zero before release.
Successful scope peaks: query740974592B, unit-admission1072697344B, backend2292277248B; all measured runs have cgroup max/OOM events0. GNU-time RSS and charged cgroup memory are distinct. No owned native/test family remains; timed-out runs have no successful Tower teardown claim.

`TowerWorkPolicyTests.cmake` sets only thread-mode query360s/backend600s. Query has64% headroom over219.10s; backend600 was selected before its run from the measured15.12x query overhead times23.45s plain backend (~355s), then validated at387.66s (55% headroom). These finite per-selector allowances do not change ordinary180s, unit-admission180s, memory budgets or internal30s liveness; no blanket sanitizer multiplier.
Only CTest metadata changes; no producer, fixture, input, cap, ordinary deadline, inner liveness guard or calibrated-overlap selector changes. Validation costs are not production profiling. No broad builds/tests, sanitizer sensitivity repeat, browser/generation or deployment.
Metadata-only CMake configure passes4.02wall/0.75CPU/74824KiB; CTest JSON verifies360/600 and unchanged180 for admission/other integration selectors. The original seven command arrays match exactly; backend retains its original command. Both ELF hashes remain identical after configuration, so passing executions are reused without rebuilding/repeating tests.
Instrumentation proof is the original actual40-object link union/37 memory-hook units/4 byte-equal archive members plus initializer/exported worker entry. Build-host tools/prebuilt LLVM and future guest outputs are outside that proof; no whole-program race-freedom claim.
Current ASan remains A1/L1's separate evidence; source-language UBSan and unsupported hosts remain explicit. Later combined source/artifact acceptance belongs to ROOT.
Review/configuration base `7248827c19dc2a0334a5bd195cffbe3b7f4252e8`; runtime acceptance deliberately stays at c855. Later producer changes are outside these ELF receipts. Documentation-only integration reuses matching policy/test inputs; ROOT owns the later combined adoption.
Raw: `C:/Sandbox/build/codex_ecs_20261122/L2/thread_completion_c8555971/` — exact commands, timestamps, raw streams, status/time/memory/events, runtime manifest and pre-run600s rationale; prior failures/artifact proof remain in `thread_milestone_c8555971/`.
