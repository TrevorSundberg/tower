# Current Windows x64 worker/budget acceptance

- Freeze: `effab4bd4fdd3fc789a877de8c3cb170e1d6acf0`, clean main; prior [accepted Windows receipt](windows_budget_gate_cabc2062.md) and all old binaries/logs preserved.
- Both old/current compiler-generated depfiles contain the same union of26 Tower inputs; every SHA256 matches the accepted final Windows snapshot before and after execution. No production or fixture change was needed.
- Compiler/runtime inputs **did** change: public bootstrap768→`eeb005717318086c145428edc3b6b784d4729df7ef0514c7329e0a18b76dda9c`; published Windows IR `ddc6e658…85bda6c`→`5455ba71f0859308d219157ea47e28e173b3b1cbfe0372d59db2cff974d2aba8`. Therefore rebuild only the two existing Windows entry objects and runtime/link outputs, rather than relabel old native runs as current-pin evidence.
- Current default manifest SHA256 `e2e3766ae241bd4fc83142f0124dfc3295a501a7cb48aadc66f71e5c6b1776cb`. ROOT's separate44ae/ca1 candidate adoption is not included; no private compiler/resource override.

| Unchanged closure group | Actual paths (under scaffolding, `.tower`) |
|---|---|
| Language5 | bedrock, foundation, foundation_syntax, tower, types |
| Host5 | host/{memory,memory_libc,memory_types,work_dispatch,work_windows} |
| Library9 | library/{vector,work_budget,work_budget_types,work_buffer,work_buffer_types,work_gate,work_graph,work_pool,work_view_types} |
| Fixtures7 | tests/{utility_checks,work_budget_shared,work_gate_windows,work_order,work_pool,work_pool_windows,work_thread_windows} |

- Exact path/hash map: raw `source_equivalence.json` and `verified_closure_paths.txt`; original `a1_windows_gate/dependency_hashes.json` remains unchanged. Core host SRWLOCK/gate, shared budget, pool and graph contracts were read together with actual callers, not inferred from filenames.
- Existing LLVM clang/lld19.1.1, target `x86_64-pc-windows-msvc`, public default runtime; one sequential build family, compiler `--jobs4`, container CPU12–23/24GiB. Gate/pool object compile exit0:1.14/.79s CPU/197280KiB and1.13/.92/213532 respectively (wall/CPU/RSS, validation only).
- Existing SDK10.0.26100.0 x64 imports unchanged: kernel32.lib SHA256 `341c7d56125a03b458e4d5093e4c79b33123ccfdfd610fe236937b8e6f3134bb`, ucrt.lib `7ef4eac926bf597d2f243f16cdfed7e0db22cb3ca34a1d7e088a84c994a03d66`. No SDK install or ABI guess; pointer-sized SRWLOCK and DWORD/native-word signatures remain the reviewed provider.
- Native kernel32/UCRT versions remain10.0.26100.9278/10.0.26100.9444. Same existing assembly warning retained: `overriding the module target triple with x86_64-pc-windows-msvc19.33.0 [-Woverride-module]`; no new warning or suppression, all object/link commands exit0.
- Gate PE SHA256 `4d28e034d6e95307f872cec651c97ad748f16f61e01ae309f7a7dc90363f729f`; pool `12c9606b475b62cd4422f35379fbdc3a7f3ac8a1e92cae8aea5f49d776e02f75`; runtime object `1142a9bd72d8bb7c9a5dc0cb3dcfc4410ae71b7c13fd181c3acb51635c52a8ba`. All source/runtime/object/EXE/import hashes checked after execution.
- Link maps resolve work_gate_open/close/enter/leave and work_windows_entry from actual gate.obj, and the pool callback/close from pool.obj. AMD64 PE imports real Initialize/Acquire/ReleaseSRWLockExclusive, CreateThread, GetCurrentThreadId, CreateSemaphoreW/ReleaseSemaphore; work_windows_entry exported. No stub, C shim or emulated Windows runtime.

| Actual native control, once each | Exit and exact output | Wall s | CPU s | Peak working set B |
|---|---|---:|---:|---:|
| gate1 |0, `0\n`|0.0170994|0|4337664|
| gate4 |0, `0\n`|0.0412536|0.109375|4218880|
| full pool |0, `0\nWork graph: reversed dependency completions retain deterministic continuation order.\r\n`|0.0246470|0.062500|37208064|
| invalid mode3 |1, no stdout; stderr `Set TOWER_GATE_WORKERS to 1 or 4\n`|0.0145915|0|3784704|

- Unchanged gate4 oracle requires four distinct actual GetCurrentThreadId values, all waiting behind a counting barrier before release; eight owner cycles each check8192 protected increments, four-worker shared-budget2048 rounds/worker, and cancellation after borrow with zero increments followed by reuse. Gate1 retains its eight2048-increment serial cycles.
- Exact lane/byte Capacity denial leaves inactive ownership/totals unchanged; stale slot/generation and old revision reject, release produces exactly one wake, and snapshots return zero live grants/bytes/lanes before disposal. Three queued permits remain independently consumable: binary gates cannot replace counting signals.
- Full pool runs the original sixteen four-worker rounds, real overlap, allocation/growth and completion counting, reversed graph order/stale controls, plus partial/full injected-failure drain. Wrapper forwards nonzero main status; no skip, swallowed failure or changed oracle. All four stdout/stderr/exit triples exactly match the accepted old controls.
- Measurements use byte-identical retained-handle OS launch/accounting scripts: K32GetProcessMemoryInfo succeeds for each **native child**, CPU is native user+kernel time (coarse Windows resolution; zero is not no work). PowerShell-parent totals are retained separately, not substituted for native RSS/CPU. Fresh process/hash-warmed files, n1 validation costs; serial/contended controls differ and are not a speedup comparison.
- Windows job affinity `0xFFF000`/CPU12–23,24GiB; all four jobs report activeProcesses0/guardHitfalse. Pool joins precede gate/signal release; all owned Linux/Windows processes drained, todo unchanged,312GiB free.
- Raw build recipe, maps, PE imports, dependency/SDK hashes, four native outputs and retained-handle/job receipts: `C:/Sandbox/build/codex_ecs_20261122/A1/cache/windows_current_effab4bd/`. Prior accepted binaries still hash-match and are untouched.
- No compiler rebuild, Linux matrix/profile rerun, browser/static/generation, sanitizer, SDK/security change or deployment. Windows ARM64, full Windows compiler and later bootstrap adoption remain outside this focused x64 closure; ROOT owns final release.
