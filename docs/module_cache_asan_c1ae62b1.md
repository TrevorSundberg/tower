# Import-snapshot ASan delta — blocked before the new regression

Frozen published source `c1ae62b10523976d834cb0ca594f97e51a50a562`, tree `0e39926c55ebb3a20ad62605b713a72680ab7b42`, includes B1 `b36a5f7c` and its empty-cache/seed guard.
Public default SHA256 `31a385c616b889987d68f8eb9714020f3928aac97591a1569f905ab706f52ed6`; no private override, producer/test edits, or source changes during build/run.
Selection: existing `tower-module-cache-regressions`, executable `tower-module-cache-tests`, working directory `scaffolding`, original 180s guard. No broader selectors ran.
Actual result: **1 selected / 1 executed / 0 passed / 1 failed**; the new `module_baseline_imports_test` and following cleanup assertions were **unstarted**, not passed.

## Build and instrumentation boundary

Reused the exclusively owned `/root/.cache/tower/l1_storage_asan_1bfe0657/build` with `TOWER_SANITIZER=address`, native/work/backend/module tests enabled; built only `tower-module-cache-tests` (62 dependency actions).
Orchestral-Revng Ubuntu24/Clang-LLVM19.1.1; CPU0–3, jobs2/compiler1, 4GiB resident scope/no swap, unlimited virtual addresses; source and imported dependency hashes unchanged before/after.
Reused [86e8d553 sensitivity/storage evidence](storage_asan_1bfe0657.md) by exact unchanged tool/runtime/compiler-rt hashes; did not rerun its memory negative, ready positive or 26 storage cases.
Actual link has 25 direct Tower objects plus four members of `libtower-compiler-memory.a`: allocation, trap, compiler host and worker host; **29 objects / 5,570 original definitions**.
Every linked object maps to the actual Tower `instrument_llvm address` recipe, instrumented IR with `sanitize_address`, and ASan initialization references; 25 objects contain memory-access hooks, four small entry/forwarding/storage-address helpers have initialization without access hooks.
Executable defines `__asan_init` and exports real `work_thread_entry`; uninstrumented LLVM/libc remain foreign dependencies. Build-host tools are outside this executable closure.
Changed `frontend_modules` and `syntax_session_setup` are in `tower-compiler-parser-nodes.o`: actual depfile, retained definitions of `syntax_baseline_install`, `frontend_modules_retire_session`, `module_reset_compilation`, and load/store hooks verified.
Executable SHA256 `5657fd3503bb523b7a4d4097c763a6ed5d068bf730478dfb01d93ad9251aa29d`; all original/instrumented IR, objects, source maps and archive membership retained.

## Exact first failure and scope

`ASAN_OPTIONS=detect_leaks=1:halt_on_error=1 timeout 180 .../tower-module-cache-tests` exits **134 / signal6**, not a timeout or ASan finding.
Stderr: `Tower compiler internal trap at 0: Unit startup preserves invalid total budget`; stdout empty. GNU time's `Exit status: 0` accompanies signal6 and does not override raw process134.
The failing unchanged fixture is `tests/frontend_modules.tower:374`, introduced in `b21bdb2d2`: `frontend_units_create_bounded_result(1,1,1,8,1,1,"","","",&error)` is required there to return null/**Invalid**.
Source trace: `frontend_units_open` initializes a one-byte ledger, then calls `work_pool_open_kernel_budget`; `work_pool_open_impl:143` requests one `WorkSlot` through `work_buffer_resize`.
Current `work_buffer:35` explicitly returns **Capacity** for a representable physical allocation exceeding the total byte cap; frontend unit startup propagates the pool error after closing the private batch. The typed cause follows from this exact source path; the original trap does not print its numeric value.
This is a pre-existing fixture/policy expectation mismatch, not evidence of a B1 snapshot-lifetime defect. No speculative B1 edit, changed assertion, budget relaxation, new probe or retry was made.
The entry calls `module_session_tests`, both clone-budget variants and `module_startup_test` before `module_baseline_imports_test`; reaching this trap does not establish full selector completion.
Earlier startup checks reached world disposal and asserted zero used bytes/live grants. Its final unit-admission retry, new Foundation retention/replacement/world-clear checks and their final zero bytes/grants/lanes remain unstarted.
Failed process drained; no surviving owned worker/build. Normal completion and final LeakSanitizer scan were not reached, so no whole-process leak/zero-owner pass is claimed.

## Costs, evidence and handoff

Build: **127.82s wall /219.81s CPU /925,704KiB peak child RSS**, cgroup peak1,330,798,592B; one build, no vendor/compiler-generation rebuild.
Failed run: **0.21s wall /0.20s CPU /113,064KiB peak RSS**, cgroup peak69,701,632B; no swapping/max/OOM events. RSS and cgroup page charges are different scopes, not ledger/live ownership.
Acceptance costs only; no performance comparison or improvement claim. Physical ASan cannot generally detect retired subslots within live pools; foreign-library internals, source-language UBSan, TSan and A1 type/control attribution remain separate.
Raw commands, registration, original failure, logs/status/times, actual link/IR/nm/depfile/source proof: `C:/Sandbox/build/codex_ecs_20261122/L1/module_cache_asan_c1ae62b1`; existing cache retains executable and all IR/objects.
SHA256 manifests: frozen sources `312e37aaecf6299cfa4a0997f8c9aa89875327c038e29e3c5287eacc1c514fe9`; linked objects/IR `a15d82909118542223e3d0bdedfbf5303fd84f7df7363c2412b77b0d1452669e0`.
`ROOT_handoff.txt` identifies the unchanged assertion and exact call chain for owner reconciliation; B1 ASan ownership acceptance remains blocked. ROOT retains adoption/publication; no public pin/deployment change.
