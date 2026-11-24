# Integrated compiler ASan acceptance — 2026-11-24

Frozen source `28ffe2ebaaaab5fc38bfc785f6c74219e669bdc9`, tree `91b6d72f239be1f47e640298ffe1061b4c543269`: **query, full type and full control pass**.
Includes A2 page buckets `2cdb3eba`, B1 initial import reuse/seed guard `699dc1b1`/`b271305b`, constructor first-cause repair `3f1e515f`, L1 startup Capacity oracle `0d4d686d`, and deferred sanitizer inventory repair `646c3276`. Later sources, including D1 reset/expansion repairs, are excluded from this frozen result.
Public bootstrap SHA256 `31a385c616b889987d68f8eb9714020f3928aac97591a1569f905ab706f52ed6`; development manifest `d104f4fbf2b68d0b925162ff91dbd98f342680955658fdb3ca623f3ce6040f4c`. Default bootstrap verification, no private override.
Existing Linux x64 WSL2/Clang LLVM19.1.1 container, target `x86_64-pc-linux-gnu`, CPU 12–23/12-CPU quota/24GiB resident cgroup, unlimited virtual addresses; production allocator and pthread transport. No security changes.
The entire old c855 native cache was copied to `RAW/frozen_c855_native` before refresh; its original [180s failures and attribution](compiler_asan_type_attribution_c8555971.md) remain failures. This is **not** acceptance of that ordinary performance contract.
ROOT explicitly authorized **1200s instrumented allowances** for each original full type/control selector, based on the measured prefix and 168 lifecycle trials. Query retains 180s; internal caps, liveness checks, cases, ordering and assertions remain unchanged.

One dependency-aware address build of `tower-lr-work-tests`: 21 actions; ten linked objects changed, 22 retained byte identity. Configure 20.15s wall/2.83s CPU; build 67.48s/154.07s/927,584KiB maximum process RSS; both exit 0, stderr empty.
Actual link closure is 28 direct objects plus four byte-matched memory-archive members. All 32 actual recipes/IR/objects and now-complete configured manifest checked: 5,996 original definitions, 99,586 inserted load-report sites and68,367 store-report sites.
Three wrapper modules have no instrumentable load/store sites but retain ASan initialization/global checks. Final ELF contains ASan initialization/report routines and real exported worker entries; C/CXX flags alone are not the evidence.
Unmarked query ELF 17,577,768B SHA256 `d43a9f2b009e839588de6cc711deec22ddefd07d177a68e270b85a309864ac9d`.
Separate diagnostic entry preserves all original type/control work, adding only flushed Tower phase boundaries to copies of lr_work_main/body_runs/semantic_lifecycle_checks; cleanup end markers run after original defers. Runtime resources are a separate **unmodified** Git archive.
Entry-only compile/instrument/link 23.22s wall/9.66s CPU/383,008KiB RSS, exit 0; 31 provider objects reused exactly. Entry: 274 definitions; real ASan load/store/init references verified. No production or registered test source changed.
Diagnostic ELF 17,586,256B SHA256 `3c517cce93f11b44e136d34e7347c13f5a087654278fd8a77af685aeb1ac176b`; source patches, IR, depfile, object and link recipe retained.
Unchanged instrument_llvm SHA256 `2ae3dab3bf8ff7d8327a1c9783cde1226b0190534077f3e5d3f295e40f14fa12` and compiler-rt `1050d83b513bef5d532f1a7ddca8fdb3760aa9af99228ced681ee8140ce8b600` reuse [L1's actual sensitivity evidence](storage_asan_1bfe0657.md); no repeated negative/storage suite.

Each command uses `ASAN_OPTIONS=detect_leaks=1:halt_on_error=1`, installed llvm-symbolizer, GNU time and `timeout --signal=TERM --kill-after=5s GUARD ELF RAW/resources/scaffolding SELECTOR`; no stdbuf/preload alteration.
Query ran first. Type/control then ran concurrently in independent processes/worlds, read-only resources and separate logs, each maximum four admitted lanes (combined eight within 12); no shared cache writes/builds. Costs are n1 validation, including marker I/O and concurrency, not speedups.

| Original selector | Guard s | Exit | Wall s | CPU user+system s | Peak process RSS KiB |
| --- | ---: | ---: | ---: | ---: | ---: |
| query-smoke | 180 | 0 | 64.71 | 68.11 | 1,017,064 |
| type-smoke, complete same process | 1200 | 0 | 886.80 | 893.34 | 836,888 |
| control-smoke, complete same process | 1200 | 0 | 205.94 | 209.25 | 814,476 |

**3 selected/3 executed/3 passed/0 unstarted.** All three sanitizer stderr files are empty; normal process completion permits the enabled leak scan. No sanitizer finding, new timeout or production repair was needed.
Type completes 16 nominal +28 numeric +8 alias negatives; **168 lifecycle original trials and 52 canonical reconstructions**, then 3 body units, 30 ordered type-error trials, 28 imported-alias units and 22 integer-argument units: 355 fixture frontend compilations, not 355 independent test registrations.
All 168 lifecycle end markers and 52 reconstruction markers are present; final imported-alias/integer success and `type complete` reached. Original width32 then64, case order and serial/four sequence preserved; no smaller-selector union substitutes for the gate.
Control completes 68 frontend units: body/header/defer/ordered-error group 32, then 36 module-loop queries at 32/64 and workers 1/4. Exact diagnostics/offsets, first-error retention, terminal retry ownership and `control complete` reached.
Query completes receipt/failure-order, ordinary staging extents, malformed captures, lifecycle frontier, clone overlap, publication/cancellation and evaluation-query groups at 32/64 and 1/4. Imported module logs show actual semantic_threads=4/peak=4; clone logs show distinct thread IDs and overlapping intervals, including cancellation/failed-peer outcomes.
Existing batch close drains pools, disposes module/world ownership and requires successful budget disposal; clone controls explicitly require zero bytes/live grants/lanes. Retained pre-close module ownership in query output is not a terminal leak. No mutually exclusive peaks are added.
All linked object/IR/archive/tool/runtime, 36 depfile, diagnostic executable and resource hashes match after execution. No source edits/pulls during jobs; terminal container process list contains only its preexisting sleep. Memory-limit/OOM events 0; todo unchanged.
Current integrated paths are covered; L1's separate module-cache/storage receipt remains attributed to its own source. This does not repeat or relabel those families as current bucket-ABI execution.
Limits: physical ASan does not generally poison retired pooled subslots; installed LLVM/libc/C++ internals and subsequently compiled guests are uninstrumented. No source-language UBSan, TSan/race proof, browser, generation or hosted acceptance implied.
RAW=`C:/Sandbox/build/codex_ecs_20261122/A1/cache/asan_integrated_28ffe2eb`; refreshed native cache remains `../asan_c8555971/native` (directory name is historical).
Raw commands/builds: `build.sh`, `build_progress.sh`, `run_query.sh`, `run_long.sh`, `.out/.err/.time/.exit`; full selector traces, source archive and diagnostic patches preserved.
Raw identities/drain: `source.git`, `bootstrap.sha256`, `actual_commands.txt`, `instrumentation.tsv`, `linked.sha256`, `depfiles.sha256`, `resources.sha256`, `progress.sha256`, post-check logs, `terminal_processes.txt`, `terminal_memory_events.txt`. ROOT owns final adoption/deployment.
