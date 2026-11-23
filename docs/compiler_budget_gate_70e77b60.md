# Exclusive budget gates: matched native improvement

Keep the candidate. Replacing the shared budget's counting-semaphore gate with
a native exclusive lock reduces uniform12x256 frontend wall time **24.2% at four
workers and19.5% at twelve** in the bounded paired sample. Canonical/reference
outputs and retained bytes match exactly. Serial time and RSS have no material
regression. Counting pool/completion signals and all receipt accounting remain
unchanged. This is source-level acceptance, not public-bootstrap/runtime adoption.

## Change and ownership contract

`library/work_gate.tower` declares four opaque host operations: open an unlocked
stable owner, enter, leave on the same thread, and close after every borrower and
waiter has drained. Entry is nonrecursive. Callbacks executed under a budget gate
must notify only, never reenter the budget. Open failure returns null without
ownership. `frontend_units_open` binds this gate only for a parallel budget;
serial budgets still have no gate. Close follows pool/world/receipt teardown.
The existing constructor maps gate allocation/initialization failure to Memory.

Host implementations are thin Tower foreign-call boundaries:

- Linux glibc LP64 uses `pthread_mutex_init` with null attributes and normal
  `pthread_mutex_lock/unlock/destroy`. The inspected native headers specify
  40-byte x86_64 mutex storage; the [glibc AArch64 header](https://raw.githubusercontent.com/bminor/glibc/glibc-2.39/sysdeps/aarch64/nptl/bits/pthreadtypes-arch.h)
  specifies48. The named48-byte ABI bound allocates a derived count of aligned
  `u64` words. libc alone accesses the opaque state. [glibc initialization](https://raw.githubusercontent.com/bminor/glibc/glibc-2.39/nptl/pthread_mutex_init.c)
  confirms a normal process-private default; no custom spin or adaptive policy.
- Windows uses pointer-sized SRW storage and exclusive acquisition/release.
  It is initialized through `InitializeSRWLock`, then freed only after drain.
  [The API contract](https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-initializesrwlock)
  requires a stable opaque owner and no destruction for an idle unlocked lock;
  [SRW documentation](https://learn.microsoft.com/en-us/windows/win32/sync/slim-reader-writer--srw--locks)
  specifies pointer-sized storage and nonrecursive exclusive mode.
- macOS10.12+ uses a stable zero-initialized `u32` and `os_unfair_lock_lock/unlock`,
  matching [Apple's header](https://raw.githubusercontent.com/apple-oss-distributions/libplatform/main/include/os/lock.h).
- WASI retains the existing semaphore implementation with one initial permit.
  Gate entry calls the unchanged timed `work_signal_wait`, preserving
  `work_host_check`, failure detection and deadline behavior. Other signals still
  start at zero. The portable transport returns null for open and traps on entry;
  it does not claim unsupported parallel execution.

No WorkBudget fields, ledger algorithms, replacement charges, receipt generations,
Capacity/Memory propagation, lane wake arming/refill, scheduling policy or Entity
storage changed. Existing callback-based users remain compatible. The existing
shared budget/buffer/arena/schedule fixtures and three native storage profiles
use the new budget gate; their barriers/completion signals remain counting.

Host lock storage remains the explicitly foreign transport allocation, as the
old semaphore was. Linux reserves48 instead of32 payload bytes per parallel
batch, not per receipt. It is not charged as compiler buffer payload or equated
with RSS; it is released after the budget. All compiler buffers retain exact
old-plus-new coexistence charging, stable owners and checked cleanup.

## Source, build and measurement identities

Freeze after required pull: `70e77b60844ecd19554fed58d824fc115ea90479`, tree
`1d65fc61682e94df844088549802ef8e2ed7b5d4`. This includes published module/body
repairs. B2's later Entity first-component-list candidate is **excluded** from
both sides. No pull/edit overlapped any frozen build or measurement.

| Identity | SHA256 |
| --- | --- |
|Before source manifest|aa8c3044cd1854113f4cb2cac5109c38be9dd385a182862b88f57dc0f88e8930|
|Candidate source manifest|7b0c41427986d60368df70457e9c1d4aae69fdf14f65e0157e779ed8c2243bc4|
|Before profiler|f89f1e3b268d0ba437760e3da398085d20f0a58bb5745d0442e215b0bbf8adf5|
|Candidate profiler|3e7005a1eb12dcc294f93cdf67182d00b49b1ba310ad391c2770b195a8d5ab44|
|Before LR/units runner|6c8f36349333532079ff3ff6a1525078bffa4102507bb9f02a6de98aad3b3af0|
|Candidate LR/units runner|82e65faa04d4b909a3f4c40c0026abb2d8501ef890885829e4e2db98c9ad8b4d|

Public predecessor remains768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138.
`TOWER_BOOTSTRAP_COMPILER` unset, existing `/cache/native`, Clang/LLVM19.1.1
Release x64, Linux6.18.33.2 WSL2, B1 CPU0-11/24GiB (six physical cores/twelve
SMT lanes), production allocator. Shared host, warm filesystem/fresh processes,
no hidden grammar cache or frequency-isolation claim. About112GiB free initially.

Before dependency build:4 actions,34.18s wall/26.64s CPU/1074304KiB. Candidate:
21 actions across the requested profile/LR/focused work targets,14.95s/19.20s/
257004KiB; unchanged compiler providers reused. Additional changed profile
fixtures compiled once through their existing targets/manual leaf entry.
No duplicate public-leaf/provider build, compiler generation or reactor rebuild.

Use the exact [existing uniform fixture](compiler_uniform_reuse_3ad7d5f0.md),
1x16 and12x256 bodies each, `dependencies uniform`, pointer width8, backend0,
optimized0. Profiler source remains3fa3430df1c23811837197288e5a5bc58660267175c81c5b70514238cea4d779.
Every generated `.tower` source equals the preserved prior source, including the
helper. This frontend workload checks interpreted42/42; it does not emit native
objects, link executables or substitute the C-like15/999 fixture.

```sh
/cache/budget_gate_70e77b60/{before,candidate}/profile \
  /cache/budget_gate_70e77b60/input UNITS WORKERS BODIES \
  dependencies uniform artifacts DIRECTORY
```

n2 pairs,16 total runs: first small1 then multi1/4/12, before/candidate in each
pair; reverse width and candidate/before order in round2, ending small1. No
optional grammar hooks, temporary probes, discarded samples or warmup compilation. Existing outer
boundary clocks remain. Timed compilation excludes reference execution,
canonical formatting, output writes and teardown; complete-process time is
recorded separately with `/usr/bin/time -v`.

## Matched results

Medians are midpoints of the two retained observations; times in seconds,
RSS in KiB. Each cell is before -> candidate.

| Input/workers | Frontend wall | Frontend CPU | Compilation peak RSS |
| --- | --- | --- | --- |
|1x16 /1|0.4134 ->0.4073|0.3776 ->0.3718|177884 ->177602|
|12x256 /1|5.7833 ->5.7235|5.4428 ->5.3844|836804 ->836898|
|12x256 /4|4.3231 ->3.2776|13.8563 ->10.7426|1127356 ->1126546|
|12x256 /12|4.8076 ->3.8714|39.3488 ->31.8293|1901240 ->1900702|

Four-worker wall pairs are4.2507/4.3955 ->3.3818/3.1734; twelve-worker pairs
4.7039/4.9113 ->3.8527/3.8901. Both pairs improve, with a larger spread at four.
Small serial0.4265/0.4003 ->0.4011/0.4136 is noise-sized; no serial speedup claim.
Candidate multi throughput is1.746x at four and1.478x at twelve relative to its
own serial control. Twelve workers still trail four.

| Multi workers | Whole-process wall | Whole-process CPU | Whole-process system | Voluntary switches in compilation |
| --- | --- | --- | --- | --- |
|1|6.300 ->6.240|5.870 ->5.815|0.470 ->0.350|2337.5 ->2328.5|
|4|4.915 ->3.870|14.360 ->11.245|5.230 ->3.135|230195 ->130559|
|12|5.470 ->4.530|39.910 ->32.390|23.940 ->17.740|1087734 ->791869.5|

Whole-process small wall0.460 ->0.455 and CPU0.405 ->0.400 remain flat; system
time rises0.050 ->0.090. Preserve that variation rather than claiming all metrics
improve. Serial budgets do not create a gate; no cause is established for this
small system-time shift. No new stack attribution was mixed with timed samples.

Retention and live receipts match exactly before/candidate: small20,183,137 bytes/
33,239; multi1 633,110,239/1,044,815; multi4 633,076,519/1,044,827; multi12
633,077,031/1,044,827. Candidate maximum charged peak1,585,061,984 bytes stays
below the fixture4GiB limit; four-worker transient peak varies up to934,615,805
versus912,102,814 before. Ledger metadata remains separately reported. These are
live/peak retention measurements, not allocation-call counts or total OS memory.
Every run has bounded peak lanes, zero joined lanes and checked zero-grant owner
teardown. Full source and canonical byte comparisons pass for every unit and run;
multi canonical hash4862529756567954301, small13444352409005731276.

The remaining12-worker31.83CPU seconds and17.74 whole-process system seconds are
still substantial. This result does not establish that all residual cost is the
mutex, or license a second lock/cache/storage optimization. B2's independently
owned Entity work remains separate.

## Focused validation and limits

- Concurrent shared budget test: four actual threads,2048 rounds each, live parent
  validation, bounded reserve/release, per-call Capacity denial, stale generation
  rejection and zero final grants. New exact controls cover slot reuse, ledger
  revision reuse on the same gate, byte release not notifying a denied lane request, one-shot
  lane notification, unarmed release and clean gate destruction.
- Existing work-budget, allocation-failure, shared buffer/arena and schedule
  fixtures pass; physical Memory stays distinct from Capacity. The schedule
  fixture cancels a graph and drains workers before retained storage disposal.
- Existing native LR/reference/shared-budget controls pass1.73s wall/2.25s CPU/
  115144KiB. Full units pass12.47s/20.14s/833468KiB: original finite-memory cause,
  retry, ordered errors, independent worlds, nested budgets, cycles/cancellation.
- Changed buffer/arena/vector profiles compile and their four-worker checked
  invocations pass. They are wiring checks, not additional throughput evidence.
- Linux host resolves exactly the four new pthread mutex imports. The separate
  frontend-units object imports exactly four gate operations; classified bootstrap
  component imports are unchanged. All nine native strict symbol closures and
  the current positive/negative policy fixture pass without policy relaxation.
- Windows x64, macOS ARM64, WASI and portable **host objects** compile with their
  four gate exports and expected foreign imports. WASI retains `work_host_check`
  and `work_host_time`. This is compile/symbol coverage, not runtime execution on
  those hosts or a browser trapped-worker acceptance run. Linux ARM64 execution,
  sanitizers and full release matrices remain pending ROOT's integrated milestone.

No compiler/test failure was hidden. The optional vector profile was initially
requested as a nonexistent CMake target; Ninja rejected it before compiling.
Its original log remains, and the existing unregistered leaf was compiled once
with the public compiler and linked through the existing guest runtime. Two
editing-hunk errors and unavailable documentation URLs did not change inputs or
checks. Final build logs have no compiler warnings/errors. No rejected security
or sanitizer operation was retried.

Raw frozen inputs/binaries/manifests/logs/artifacts:
`build/ecs_b1/cache/budget_gate_70e77b60` (`/cache/budget_gate_70e77b60`). Concise
handoff: `C:/Sandbox/build/codex_ecs_20261122/B1/budget_gate_70e77b60`.
`budget_gate_{freeze,build,checks,samples,host_checks,profiles}.sh` in the owned
build directory retain exact commands. `todo.txt`, public pin, old attribution
and rejected LR receipts are unchanged. ROOT owns release/adoption/deployment.
