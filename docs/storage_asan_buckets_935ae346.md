# Eight-bucket storage and typed-constructor ASan acceptance

Frozen published source `935ae3465d1b05f3d0c13b917760a48aec8ffc2c`, tree `ef21ccb9ee5752ea70194138881c688617ac981a`; includes A2 eight-bucket pool2cdb3eba and B1 typed constructor cleanup3f1e515f.
Public predecessor SHA256 `31a385c616b889987d68f8eb9714020f3928aac97591a1569f905ab706f52ed6`; unchanged default, no private compiler or source changes during the build/run.
Result: **16 selected executables /28 selected cases /28 executed /28 passed /0 failed /0 unstarted**. No repair, stale oracle, raised cap, removed assertion or skipped case in this batch.
One dependency-aware refresh in existing exclusive `/root/.cache/tower/l1_storage_asan_1bfe0657/build`, `TOWER_SANITIZER=address`, outer2/compiler1: **34 build actions**, only the original14 storage targets and two constructor targets.
Orchestral-Revng Ubuntu24/Clang-LLVM19.1.1, CPU0–3, systemd4GiB resident/no swap, unlimited virtual addresses; source/import/provider hashes verified before and after execution.
Reused exact `instrument_llvm`, compiler-rt, guest-tool runtime and [86e8d553 sensitivity evidence](storage_asan_1bfe0657.md); no repeated negative probe or original sensitivity build.

## Actual ABI and linked instrumentation

Native pointer8B; EntityComponent40B, EntityComponentPool72B with eight heads, EntityStore2336B, EntityStage480B. Source/retained LLVM constants and actual layout/accounting outputs establish the boundary.
Actual store charge is2368B including compiler allocation header, replacing the old2256B census; the fixture derives it from the owner rather than increasing a fixed cap.
Component layout still reports WorkBuffer72B/page184B/standalone descriptor112B; exact pooled/standalone grants, alignment/back-pointers and live-to-stale receipt checks pass.
Actual16-executable links contain **22 distinct Tower objects /2,412 original definitions**, including the five additional constructor fixture/fault/serial transport/trap objects beyond the old17-object storage closure.
Every linked object has the Tower address-pass IR and ASan initialization reference; 21 have actual memory-access hooks. The serial transport stub has no access hook and is not overlap evidence.
All16 executables define `__asan_init`; the five concurrent fixtures export real `work_thread_entry`. Actual commands/IR/object/nm evidence, not the configured manifest alone, establishes instrumentation.
Original14 storage plus constructor-budget use production allocation. Constructor-fault uses its existing serial failure allocator and serial transport, both instrumented; no claim that injection proves concurrent safety.

## Executed cases and ownership

**Page reuse ran first**, including exact-class/hash collisions, paid-slot reuse under pressure, missing-class Capacity/retry, full-to-partial transitions, owner-chain transfer, id0 stride collisions and empty buckets/owners.
Then accounting cap/profile, stage-result normal/queued, stage-concurrent×3, component-budget×3, component-layout, stage-reentrant, attach-leases, buffer, buffer-shared×3, arena, arena-shared×3, arena-linkage and budget-shared×3.
The original26 settings remain unchanged: 30s process guards, queued65,536×8 stress, production pthread/barrier/identity checks in the five repeated concurrent fixtures, cancellation/publish/finalizer and lease/pin assertions.
Added original constructor-budget and constructor-fault controls, both30s: all derived Capacity caps, original1MiB healthy completion, malformed Invalid checks, nonempty-output protection and final zero bytes/grants/lanes pass.
Fault control preserves exact Memory/null output for denied prefixes, eight-unit and actual-page-capacity sweeps,512-attempt bound, successful recovery, restored allocator count and final zero ledger/lanes. Success-prefix counts are not printed.
All28 raw exits0 and sanitizer stderr empty with `ASAN_OPTIONS=detect_leaks=1:halt_on_error=1`; normal completion reaches LeakSanitizer and every existing owner teardown assertion.
Accounting physical/charged peak **43,030B**, omitted bytes0, final world/ledger0; store-cap denial remains Capacity1 with no node publication. Each concurrent-stage repetition reports **57,792 finalizers**.
No universal race or packed-payload claim; current TSan/integrated compiler/other-host acceptance remains separately owned.

## Costs and retained evidence

Build: **37.05s wall /60.39s CPU /277,720KiB maximum child RSS**; cgroup peak602,390,528B, all max/OOM events0.
All28 case totals: **1.65s wall /2.16s CPU /100,944KiB maximum process RSS**; execution cgroup peak102,838,272B, no max/OOM events. Ledger/live bytes, RSS and cgroup charges are distinct scopes.
Page reuse cost0.01s wall/0.01s CPU/9,252KiB; constructor budget0.01s/0.00s/7,452KiB; constructor faults0.01s/0.01s/14,524KiB. GNU time precision retained; these are validation costs, not new throughput claims.
Source manifest SHA256 `81d75c0c3f154a5a0e835e740d87753aa206c650c9f10f487606b5a1aab05a7b`;16-executable manifest `7030e6b48897772c6329e50cbe9d6c908b0ed6b96684e78be5e6712528cde677`; object/IR manifest `338560d58064d85858e63a6696120cd582626af40e179c6b743f879f8f87801c`.
Raw commands, case logs/status/time/cgroup counts, source/depfile/IR/object/executable hashes, layout extracts and old14 binaries: `C:/Sandbox/build/codex_ecs_20261122/L1/storage_asan_buckets_935ae346`; original failures/receipts remain preserved in their earlier directories.
Incoming28ffe2eb changes only sanitizer inventory scheduling/metadata and docs: Tower sources and emitted-object recipe unchanged; actual-link evidence remains source-bound. B2's added module-lease case was not published at this boundary and is excluded.
Physical ASan does not generally poison retired subslots in live pools; foreign LLVM/libc internals, source-language UBSan and universal race freedom are not covered. All owned jobs drained; todo/public pin unchanged; ROOT owns adoption/deployment.
