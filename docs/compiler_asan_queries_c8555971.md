# A1 integrated compiler ASan boundary

2026-11-24; freeze `c8555971ff4e20c5ab6de2ea9d50da8906d7cf35`, tree `e01c8a00c4ddcb37d9d0a1ced9b69146c00238ff`. **Partial acceptance: query passes; type times out; control unstarted.**
B1 baseline/import-snapshot reuse is absent at this freeze; its conditional module-cache/baseline target is excluded. Later production inputs are outside this receipt.
Default public bootstrap SHA256 `31a385c616b889987d68f8eb9714020f3928aac97591a1569f905ab706f52ed6`; development manifest `d104f4fbf2b68d0b925162ff91dbd98f342680955658fdb3ca623f3ce6040f4c`.
Checked the complete default bootstrap SHA256SUMS through build-bootstrap.sh; no private override. No source edit/pull during owned jobs.
Linux x64 WSL2 6.18.54.1, installed Clang/LLVM19.1.1, CMake3.28.3; existing tower-a1-environment CPU12-23,24GiB resident/cgroup cap, unlimited virtual address space. No security change or vendor build.
Exclusive cache/raw root `C:/Sandbox/build/codex_ecs_20261122/A1/cache/asan_c8555971/` (RAW); native target triple `x86_64-pc-linux-gnu`.
Configured existing native CMake path with `TOWER_SANITIZER=address`, WORK/BACKEND_TESTS=ON, four outer build jobs/one bootstrap worker; built only `tower-lr-work-tests` and dependencies (72 actions).
Tower instrument_llvm adds function attributes/runs ASan after required binding; Clang compiles instrumented IR at O1 without a second sanitizer pass; final link uses `-fsanitize=address`.

Actual link: **28 direct objects plus four byte-matched memory-archive members**, all32 checked against emitted IR, actual commands and undefined ASan symbols; not inferred from C/CXX flags.
First metadata inspection exited1 because configured sanitizer-objects.tsv omits deferred LR/receipt entries. Preserved that check; actual Ninja recipes/IR prove those objects were instrumented. No production workaround or test fallback.
Original modules contain5,993 definitions; instrumented IR contains99,580 load-report and68,367 store-report call sites. These static counts demonstrate inserted checks, not executed branch coverage.
Three wrappers have no load/store report sites: legacy global-address accessors, generated registry thunk and allocation wrappers with safe local accesses; all carry ASan initialization/global instrumentation. They are not missing objects.
Executable contains `__asan_init`, `__asan_report_load8`, `__asan_report_store8` and dynamic production `work_thread_entry`/`named_worker_entry`; host source imports work_linux/work_dispatch, with production allocation providers.
ELF17,579,888B SHA256 `8170411e3d60e5f46921e4902119d32b45c19e1470ba9da9c8f69313e0560d3a`; instrument_llvm `2ae3dab3bf8ff7d8327a1c9783cde1226b0190534077f3e5d3f295e40f14fa12`.
Linked compiler-rt archive SHA256 `1050d83b513bef5d532f1a7ddca8fdb3760aa9af99228ced681ee8140ce8b600`; all IR/object/executable/dependency hashes unchanged after execution.

Each selected command: `ASAN_OPTIONS=detect_leaks=1:halt_on_error=1 ASAN_SYMBOLIZER_PATH=/usr/lib/llvm-19/bin/llvm-symbolizer timeout --signal=TERM --kill-after=5s 180s RAW/native/tower-lr-work-tests /work/scaffolding SELECTOR` (Linux RAW=/cache/asan_c8555971).
| Phase | Exit | Wall s | CPU user+system s | Peak RSS KiB |
| --- | ---: | ---: | ---: | ---: |
| Configure | 0 | 11.04 | 2.21 | 95,952 |
| Build | 0 | 72.29 | 179.35 | 920,608 |
| query-smoke | 0 | 71.60 | 77.96 | 928,412 |
| type-smoke | **124** | **180.05** | 183.31 | 813,432 |
| control-smoke | unstarted | — | — | — |

Query covers registered32/64 serial/four staging, executed lazy dependencies, module/generic/aggregate/indirect extents, captures, canonical execution, ordered failures and resumed queries. Its four-worker module trials report distinct semantic_threads4/peak4; clone publication/cancel/failed-peer trials record actual thread IDs and overlapping intervals.
Existing clone/stage/cancellation oracles assert joined jobs, stale completion rejection, correct publication/discard and final zero bytes/lanes/live grants. Pre-close retained module bytes in stdout are not terminal leaks; no peaks are added across exclusive phases.
First runtime failure is the unchanged type-smoke180s guard. Both stdout/stderr are empty; no finer completed subphase is observable from this buffered run. No ASan finding was emitted, but neither successful completion nor leak-scan completion is established. Parent PowerShell transport exit1; actual guarded child exit124 is authoritative.
Family stopped at that failure; no timeout extension, rerun, reduced fixture or control pass. All owned processes drained; terminal Docker list contains only preexisting sleep; cgroup OOM/limit events0. Query stderr empty and normal exit permits its leak check to complete.
GNU time costs are validation costs: CPU includes child work; build RSS is maximum process RSS, not simultaneous aggregate. No throughput, full compiler, universal lifetime or thread-race claim.
L1's current ASan sensitivity/storage receipt is pending at freeze, a separate prerequisite. Historical negative probes are not newly executed evidence; this run does not cover source-language UBSan, TSan, uninstrumented installed LLVM/libc/C++ dependencies or subsequently compiled guest programs.
Raw: `build.sh`, `run.sh`, `environment.txt`, `source.git`, `bootstrap.sha256`, `actual_commands.txt`, `instrumentation.tsv`, `linked.sha256`, `archive_members.sha256`, `depfiles.sha256`, original/instrumented IR and36 depfiles retained in native/.
Raw outcomes: configure/build `.out/.err/.time`, build/selector exit files and started-selector logs/timings, `selectors.tsv`, terminal process/memory records, symbol/foreign-library lists and preserved first metadata-inspection failure. Existing inputs/todo unchanged; no production fix justified by an unattributed timeout.
Pending: type-smoke timeout attribution, control-smoke execution, independent sensitivity prerequisite and ROOT's final joined adoption. No broad matrix/browser/generation/deployment operation.
