# Windows x64 exclusive-budget gate runtime

**PASS: actual Windows-native execution**, not host-object compilation or Linux
performance inference. Frozen published `cabc2062` includes B1 implementation
`05780abb`; this batch changes test boundaries/oracles only. Production
`host.work_windows`, `library.work_gate`, WorkBudget and WorkPool are unchanged.

## Composition and coverage

`work_budget_shared` now imports the gate API instead of the Linux provider;
its existing Linux CMake target supplies that same host object explicitly.
One additional assertion checks exact byte Capacity rejection while all bytes
are reserved, preserving inactive denied ownership and unchanged lane/byte totals.
The rebuilt plain Linux target passes its existing checks and this assertion.

Two small Tower Windows entries reuse the actual shared-budget and complete
pool tests. `work_thread_windows` returns native GetCurrentThreadId, widened
from SDK DWORD to the fixtures' existing opaque usize identity API. Its
`pthread_self` name is the existing test ABI, not a Windows POSIX implementation
or simulated thread. All locks, signals, worker creation and joins use production
`host.work_windows`; no C/JS/PowerShell lock or compiler model is present.

Gate modes1/4 each execute eight owner cycles. Mode4 checks four distinct native
threads simultaneously held behind a counting barrier; after release the SRW
gate protects an exact8192-increment counter per cycle. The reused shared-budget
test executes2048 rounds per each of four workers, validating actual receipt
generations, allocation bytes, snapshot bounds, releases and zero live grants.
Its gate-reuse test retains exact lane/byte Capacity denial, slot generation,
stale old-revision rejection and one wake notification. Each cancelled counter
wave sets cancellation only after every worker borrows its job/gate and before
the release handoff: it drains with zero increments, then the next cycle reuses
the ordinary path. Pool close joins users before gate and signals are freed.

Three permits are posted before consumption and consumed exactly once: a binary
gate cannot replace this counting-signal oracle. The **unchanged original pool
test** additionally runs all sixteen normal rounds, real four-thread overlap,
allocation/growth, completion counting, partial/full injected failure drain and
existing stale/revision/order checks. Its nonzero main result is forwarded to
ExitProcess; success is never manufactured by the wrapper.

## Windows/toolchain identity

- KinmenA Windows11 x64; CPU12-23 inherited affinity,24GiB Windows job cap,
  one process tree at a time. All measured jobs end with zero active processes.
- Public pinned bootstrap SHA256
  `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`;
  its published Windows runtime IR `ddc6e658...85bda6c`. No private compiler used.
- Target `x86_64-pc-windows-msvc`; LLVM clang/lld19.1.1 in the existing container.
  Runtime assembly emits the normal same-architecture target-triple warning;
  all object/link commands exit0. The compiler emits dependency files.
- Existing Windows SDK10.0.26100.0 x64 `kernel32.lib`
  `341c7d56...6f3134bb` and `ucrt.lib` `7ef4eac9...4a03d66` were copied unchanged
  to the owned cache. No SDK install, security setting, resource-pack change or
  unpublished resource adoption. Installed SDK headers define SRWLOCK as one
  pointer-sized word and the three WINAPI functions with PSRWLOCK arguments.
  Actual kernel32 version10.0.26100.9278, UCRT10.0.26100.9444.
- Final gate EXE `9e62ce7ebe8154fd03e5fa9c711c79a89475eb6f07f6448fdc5ef6d2159fe78f`;
  pool EXE `c4e9d21fedb1d98c0e9de57a001c38f0bb8c6f2531f1ab50c7844fd8c754eb2f`.
  Final source/provider/runtime/import-library hashes and dependency lists are
  retained alongside each object, PE import/export dump and link map.

The map resolves work_gate_open/close/enter/leave and work_windows_entry from
the actual Tower unit. PE imports include InitializeSRWLock,
AcquireSRWLockExclusive, ReleaseSRWLockExclusive, CreateThread, GetCurrentThreadId,
CreateSemaphoreW and ReleaseSemaphore from KERNEL32. The exported
work_windows_entry is the actual callback resolved by the production host.
This proves linked provider identity, not merely separate symbol compilation.

## Executed results and cost

Final frozen native runs, n1 fresh process/hash-warmed files:

| Executable/control | Exit / exact result | Wall s | CPU s | Native peak working set B |
| --- | --- | ---: | ---: | ---: |
| Gate serial1 | 0 / `0\n` | .0159975 | .015625 | 3821568 |
| Gate contended4, including cancellation | 0 / `0\n` | .0416744 | .078125 | 4259840 |
| Original full pool | 0 / `0\nWork graph: reversed dependency completions retain deterministic continuation order.\r\n` | .0236705 | .015625 | 37318656 |
| Invalid mode3 | 1 / stderr `Set TOWER_GATE_WORKERS to 1 or 4\n`, no stdout | .0152662 | 0 | 3780608 |

CPU is the native process's user+kernel time with coarse Windows clock resolution;
zero for the short negative control does not mean no execution. Peak working set
comes from successful K32GetProcessMemoryInfo on the retained process handle.
Native timings exclude the outer PowerShell accounting/launch parent. Separate
job receipts include that OS transport, sampled aggregate RSS and peak commit;
none is mislabeled as guest allocation bytes. Serial and contended runs perform
different work/extra checks and are **not a speedup comparison**. There was no
Windows before/after production change to profile: this closes first runtime
coverage for the already-published gate. Earlier pre-cancellation successes remain
separately retained; final values above include the complete fixture.

Plain Linux compatibility: dependency-aware target rebuilt five actions and
prints0/exit0, GNUtime .00s wall/.01s CPU/1652KiB RSS (coarse timing, not a Windows
comparison). Initially the wrong existing thread-instrumented cache was selected;
that build completed but its binary was **not run**. Its log remains and is not
sanitizer acceptance. An initial Windows fixture compile diagnosed a missing
direct signal API import; fixed before linking. Initial .NET after-exit RSS was
unavailable; final runs use the successful native OS query instead. No error or
failed measurement was relabeled as a pass.

Commands and raw logs: `C:/Sandbox/build/codex_ecs_20261122/A1/cache/a1_windows_gate`;
the [focused-test README](../scaffolding/tests/README.md#focused-native-scheduler-regressions)
contains the complete cross-build/run recipe. Fixture logic and oracles are Tower;
external scripts only launch, enforce limits, inspect symbols and measure OS data.
All owned workers drain; todo unchanged. No compiler rebuild, browser/generation
matrix, new sanitizer run or deployment. Windows ARM64 and end-to-end Windows
compiler acceptance remain outside this focused x64 contract; ROOT owns release.
