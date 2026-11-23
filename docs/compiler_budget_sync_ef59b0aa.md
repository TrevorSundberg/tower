# Uniform compilation: shared budget semaphore contention

The native twelve-unit workload reaches the **same `WorkBudget` semaphore from
eight of twelve active compilation threads** in one bounded stack snapshot.
Six are posting a wake after receipt bookkeeping and two are waiting to enter.
Sixty retained pool threads are asleep on different signals. Existing thread
clocks independently place nearly all measured process CPU inside the outer
compilation callbacks. This identifies a concrete contention boundary, not the
fraction of total time caused by that boundary.

Production is unchanged. The audit did not establish a redundant transaction
that can be removed while preserving exact admission and receipt validation.
No lock replacement, reservation cache, LR change or scheduling change was tried.
The rejected [LR admission candidate](compiler_lr_admission_902f7c4d.md) remains
restored; deleting its wrapper observations would not remove graph construction.

## Frozen inputs and method

- Published source `ef59b0aa2400676a2f76ea20588e3e273a7bbba3`, tree
  `0c193f76c2d23d0e74cb9b765ca329740bf19133`, obtained with the required pull.
  Compiler/build source manifest SHA256
  `c4eff1ff504a75947551e8fadece6ea59064917ee6d8f329b9803b7dbc733afe`
  passes again after every run. Later incoming sources are outside this freeze.
- Existing B1 `tower_ecs_b1`, CPU0-11, six physical cores/twelve SMT lanes,
  25769803776-byte container limit; Linux6.18.33.2 WSL2, Ubuntu24.04,
  Clang/LLVM19.1.1, native x64 Release. Production allocator and transport.
  Shared host, warm filesystem, fresh processes/worlds; no frequency isolation
  or persistent grammar cache. Owned builds/tests drained; about113GiB free.
- Public predecessor SHA256
  `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`.
  With `TOWER_BOOTSTRAP_COMPILER` unset, one dependency build of
  `tower-frontend-units-profile` updated backend/semantics and linked the profiler
  in33.96s wall/26.10s CPU/1073872KiB peak RSS. No duplicate leaf build.
- Frozen profiler SHA256
  `486996f61cc242fb7c61e6477949729a38f1b42ff3ff5a32d1c135bfc6bb2b77`.
  Existing Tower profiler source SHA256
  `3fa3430df1c23811837197288e5a5bc58660267175c81c5b70514238cea4d779`
  matches the [prior uniform fixture](compiler_uniform_reuse_3ad7d5f0.md).

Use that fixture's actual **1x16** and **uniform12x256** body inputs, pointer
width8, `dependencies uniform`, backend0, optimized0. Every generated `.tower`
file matches the preserved prior source bytes, including the dependency helper.
This is frontend compilation and reference interpretation, not native object
emission, linking or a C/Tower CLI comparison.

```sh
/cache/budget_sync_ef59/before/profile /cache/budget_sync_ef59/input \
  UNITS WORKERS BODIES dependencies uniform artifacts DIRECTORY
```

Eight uninstrumented controls: small1 then multi1/4/12; multi12/4/1 then small1.
No `grammar` hooks, warmup compilation, discarded sample or profiler timing in
the throughput table. Existing sparse outer-boundary clocks remain. The measured
interval excludes canonical formatting, reference execution, artifact writes and
owner destruction; external `/usr/bin/time -v` covers the complete process.

## Actual stack attribution

`perf`, `strace` and `bpftrace` were unavailable. GDB15.1 was available. One
ordinary child launch, interrupted after three seconds for `thread apply all
bt 14`, then continued to normal checked completion, took less than the60-second
observation guard. No privilege/security change or rejected instrumentation
operation occurred. ASLR remained enabled. Optimized Tower frames partly unwind
as `??`; missing glibc source text produced a retained warning, not a failed run.

| Threads in that snapshot | Actual boundary |
| --- | --- |
|13,9,3|`work_budget_reserve_result` -> `work_signal_post` -> `sem_post`/`futex_wake`; `work_buffer_resize` visible below|
|12|`work_buffer_resize` -> `work_buffer_dispose` -> `work_budget_release_result` -> same wake|
|8,2|`entity_reclaim` -> `work_budget_release_result` -> same wake|
|6|`work_buffer_resize` -> disposal/release -> `sem_wait` on the budget gate|
|5|`work_budget_reserve_result` -> `sem_wait` on the budget gate|
|11,10,7|allocation/reallocation in emission inheritance, parallel LR solve and range merge respectively|
|4|`lr_grammar_create_result`|
|14-73|idle retained pool threads in `work_thread_entry`, waiting on separate slot signals|
|1|coordinator in `work_pool_receive_event`/`frontend_units_step`, waiting on the distinct completion signal|

All eight budget stacks name semaphore `0x61e37ea69810`; the coordinator's
completion signal is `0x61e37ea69840`. These are addresses in this one process,
not persistent identities. Source confirms that `frontend_units_open` binds one
gate to the batch budget before dispatch, and its separately owned worlds borrow
that budget. This is shared outer-budget receipt contention, not a shared mutable
grammar/world, pool claim semaphore or the optional outer lane-refill callback.
Byte-only release does not invoke that callback; semaphore unlock can still wake
a competing receipt operation.

The snapshot distinguishes executing futex wake paths, budget waiters, allocator
work and idle pool waits. It does **not** measure time fractions, semaphore call
counts or prove allocator-lock contention. Its elapsed time is attribution only.
The diagnostic process passed known42 results, exact canonical/source comparison
against the uninstrumented serial control, and normal owner destruction.

## Uninstrumented results and limits

All pairs are retained, including the substantial first-round serial variation.
Seconds below are frontend wall/CPU; RSS is KiB through compilation.

| Input/workers | Wall pair | CPU pair | Peak RSS pair | Voluntary switches pair |
| --- | --- | --- | --- | --- |
|1x16 /1|0.5589 /0.4040|0.5183 /0.3690|177412 /178060|353 /279|
|12x256 /1|8.1662 /5.7191|7.8119 /5.3611|836680 /836812|2492 /2335|
|12x256 /4|4.9393 /4.4349|15.9779 /14.2049|1127792 /1127088|245405 /244480|
|12x256 /12|5.4289 /5.2208|44.9152 /42.8703|1902172 /1900156|1113380 /1109175|

Twelve-worker outer callback CPU is44.9057/42.8614s, within9.5/8.9ms of
process CPU. Thus the sixty sleeping pool threads are not where the measured
CPU amplification runs. This does not assign all callback CPU or switches to
the budget gate. Outer-ready vacancy is1.456/1.299lane-ms; no material starvation
is established. Actual outer/reserved peaks are1/4/12, always within the bound.

Whole-process median wall/user/system/RSS for multi1/4/12 is respectively
7.52s/6.545s/0.515s/836746KiB,
5.30s/9.870s/5.735s/1128336KiB, and
6.02s/17.460s/27.025s/1901548KiB. The12-worker system pair is28.27/25.78s.
The small control is0.535s wall/0.470s CPU median. No production candidate exists,
so these are controls, not before/after improvement. Prior3ad7 and902 receipts
use the same generated source but different compiler inputs/binaries; neither
their timings nor canonical outputs are relabeled as this freeze. The serial
variation prevents attributing an apparent scaling-ratio change to this task.

After compilation, small retains20,183,133 charged bytes/33,239 live receipts.
Multi1/4/12 retain633,110,235 /633,076,515 /633,077,027 bytes and
1,044,815 /1,044,827 /1,044,827 receipts. Maximum observed charged peak is
1,584,546,833 bytes, below the fixture's4GiB limit. Ledger metadata is reported
separately:10,485,760 bytes small,83,886,080 multi1/4 and167,772,160 multi12.
These are retained storage/receipt counts, **not allocation-call counts**.
Allocator-private arena/metadata and host thread storage are not equated with
charged bytes; RSS remains a separate whole-process observation.

All eight runs pass reference execution42 for both the answer and ordinary loop
body, complete byte comparison of every generated source and canonical output,
zero joined lanes, then checked zero-grant budget/world destruction. Multi
canonical hash is4862529756567954301; small13444352409005731276. Full bytes, not
only hashes, are compared. No filtered case is claimed passed.

## Decision, focused gates and finite next boundary

`work_buffer_resize` must reserve the full replacement before allocating and
copying: old and new physically coexist. Charging only their difference would
weaken peak admission. Disposal frees physical memory then validates/releases
its owning receipt. Entity page release occurs when its last component dies;
the private arena already has a gate-free bump fast path between growths.
No redundant operation was established at these sites. Holding the budget gate
across allocation/copy or recursive finalization would lengthen the critical
section and risk reentry. Delayed/batched credit changes require a separate
exact-admission and error-order contract; they are not a demonstrated local fix.

The finite next producer is the **synchronized byte-receipt transaction boundary
in `work_budget_reserve_result`/`work_budget_release_result`**, bound by
`frontend_units_open`. An independently scoped change there must retain exact
old/new charging, receipt-generation validation, first Capacity/Memory errors,
lane wake/refill and teardown. Existing counting pool signals cannot simply be
replaced with a binary mutex. This receipt supports that boundary for further
work, not a particular new lock/cache design or another LR algorithm.

The dependency cache additionally compiled the changed existing test entry and
linked `tower-lr-work-tests` in8.87s wall/6.02s CPU/443156KiB, reusing the already
built providers. Runner SHA256
`ec17d2722793d621132935db200b9db7f9be26014bcb163a6e59d113b051018b`.
Focused `lr` passed1.74s wall/2.26s CPU/117324KiB; full `units` passed
13.71s/23.39s/846216KiB, including shared nested budgets, independent worlds,
original finite-memory failure/retry, deterministic errors, dependency cycles,
cancellation and cleanup. No new test implementation or production edit, no
sanitizer/generation/browser matrix. Those broader gates remain outside scope.

Raw evidence and frozen inputs/binaries:
`build/ecs_b1/cache/budget_sync_ef59` (`/cache/budget_sync_ef59`). Concise copy:
`C:/Sandbox/build/codex_ecs_20261122/B1/budget_sync_ef59b0aa`. Preserved scripts
are `build/ecs_b1/budget_sync_{freeze,stacks,samples,checks}.sh`; command/time/log,
source/toolchain/artifact manifests and diagnostic warning are retained.
Public predecessor and `todo.txt` unchanged. ROOT retains final publication.

Publication reconciliation: receipt `c4660ec0` merged complete published
`8f9bb924` history at `550cac6e` after the required ff-only pull refused
divergence. Both journal histories remain. Incoming semantic declaration/
statement and fixture changes are outside the ef59 freeze. The audited budget,
buffer, arena, entity, pool and native semaphore sources remain identical;
frozen input/binary hashes pass and receipt diff checks pass. This documentation
merge does not rebuild or claim integrated runtime acceptance of those later
compiler inputs.
