# KinmenB compiler partition utilization

On 2026-11-23, frozen production source
`b0f507c6ad4bdaec4a3b87ddd943e647ba393eaa` (tree
`0eb8242708b77adbc8daa63378c22aea2a57fbea`) compiled the same checked inputs at
1/4/8/12 workers. Eight workers were the best measured multi-unit setting:
2.70x serial throughput. The substantial single unit improved only1.07x at12.
No production scheduler or optimization policy changed: the observations did
not expose a lost wake, avoidable outer batch barrier or byte-cap starvation.
Within-unit profitable utilization remains limited; twelve requested workers
does not establish twelve useful concurrent compiler kernels.

## Frozen environment and method

`tower-b2-work` on KinmenB used CPU12-23, quota12 and24GiB, Linux
6.18.33.2-microsoft-standard-WSL2, Ubuntu Clang/LLVM19.1.1, CMake3.28.3 and
Ninja1.11.1. Topology identifies six physical cores with two SMT siblings each.
Other lanes retained their partitions; these are partition measurements, not
whole-machine32-core acceptance or an otherwise idle-host claim.

The checked-in public bootstrap was
`768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`.
One dependency-aware production rebuild used `/cache/native`, compiler jobs1,
outer build parallel6, and targets `towerc`, `tower-frontend-units-profile` and
`tower-lr-work-tests`. Test authoring corrections rebuilt only affected objects.
No private compiler override, new pool, benchmark framework or semantic change.
Production compiler SHA256:
`9306f12149f9fc984054b2df49270f147a3c22b0aec759043ea8ba0ff6ab8fdf`.
Profile executable:
`55cb5c989fc71cd9c867fcbdbdc9fd3f07d88aeb26d0a4470ce6e83dd87790ba`.
Final focused runner:
`63baa57aa3d9bf7179431b9377ca3817dc1cd0a5ddfb57b033fb2381e80b2d95`.

The existing Tower generator/profile ran these explicit inputs, always optimized
x86_64-pc-linux-gnu library objects, with the existing O2/default codegen policy:

```sh
tower-frontend-units-profile /work/scaffolding 1 W 4096 backend optimized artifacts DIR
tower-frontend-units-profile /work/scaffolding 16 W 1024 backend optimized spread dependencies artifacts DIR
```

The single unit has4096 independent exported loop bodies, each returning input+6,
plus a staged answer42. Multi-unit input has16 independent root worlds, repeating
256/512/768/1024 bodies (10240 total), each importing the same helper source with
forward type/value dependencies, generic inference, `decltype`, `comptime` and
executed-only branch discovery. Its shared input is snapshotted into each owned
module environment before dispatch. This is actual compilation and LLVM emission.

Each workload had one discarded warmup at4 workers, then two retained samples:
workers1/4/8/12 followed by12/8/4/1, alternating single/multi. Processes/worlds
were fresh, filesystem caches warm. Time covers snapshot/configuration through
frontend/backend join, excluding postjoin formatting, artifact writes and
reference execution. Rusage supplies process CPU and peak RSS; private callback
slots record outer intervals and thread CPU. `pidstat12.6.1 -H -h -t -u -r -w`
sampled live threads every second. The shell waited for the actual compiler PID
and retained its exit code independently: `pidstat -e /bin/false` itself returns0
and is not a valid child-success check.

## Results

Two-sample means; raw individual observations are retained. RSS is MiB.

| Input | Workers | Wall s | CPU s | RSS MiB | Speedup | Exact outer peak |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Single4096 | 1 | 4.600 | 4.556 | 824.7 | 1.00 | 1 |
| Single4096 | 4 | 4.488 | 5.425 | 848.0 | 1.03 | 1 |
| Single4096 | 8 | 4.383 | 5.847 | 846.9 | 1.05 | 1 |
| Single4096 | 12 | 4.312 | 6.314 | 845.3 | 1.07 | 1 |
| Multi16 | 1 | 25.181 | 24.490 | 2022.2 | 1.00 | 1 |
| Multi16 | 4 | 10.022 | 34.450 | 2370.6 | 2.51 | 4 |
| Multi16 | 8 | 9.323 | 55.739 | 2788.0 | 2.70 | 8 |
| Multi16 | 12 | 10.367 | 79.265 | 3245.0 | 2.43 | 12 |

Single-unit live thread samples observed1/4/8/12 TIDs consuming CPU within an
interval, with peak aggregate process CPU100/149/183/226 percent. This proves
real nested worker activity, not sustained full utilization or per-body overlap.
Its mean CPU/wall rises from0.99 to1.46 while throughput improves only7 percent.
The final backend kernel remains serial: at12 workers it takes1.915/1.935s,
including1.368/1.371s in optimization/verification. Its shared LLVM context is
not concurrently mutated. Frontend wall is2.400/2.366s versus2.628/2.653s serial;
the outer frontend thread alone uses approximately2.07s at12 workers. The
remaining measured serial path is frontend coordinator work plus LLVM passes,
not an outer ready queue that could fill the otherwise unused lanes.

Multi-unit callbacks directly observe4/8/12 simultaneous outer kernels on
distinct threads; matching objects validate the useful throughput. Live OS
intervals peak at379/732/1014 percent CPU. More TIDs may consume CPU within one
second than the lane ceiling because completed, outer and nested workers reuse
lanes during that interval; this is not instantaneous oversubscription evidence.
The shared ledger's peak lanes equal1/4/8/12, and zero lanes remain after join.

At4/8/12 workers, voluntary context switches are180222-211136,
922418-978013 and1530840-1534372, versus4640-4650 serial. First-sample OS intervals
average approximately49/186/304 percent system CPU, versus4 percent serial.
The growing synchronization/kernel cost is real, but those counters do not
attribute it to a particular semaphore, allocator or dispatch call. Shared
budget receipts serialize through the existing gate, and WorkPool uses blocking
signals; there is no spin-poll replacement here. Isolating budget-gate versus
allocator/worker-dispatch cost is the actionable next scaling investigation,
before changing admission, choosing another default, or adding infrastructure.
The six-core SMT topology also limits interpretation of8-to12 scaling.

While unstarted outer units remain, integrated vacant outer slots total only
3.2-11.1ms-lanes; nested jobs can occupy those slots, so this is an upper bound
on eligible idle time. Ordinary refill gaps stay below0.201ms except one6.392ms
outlier at12 (reverse sample maximum0.119ms). There is no repeated multi-second
batch barrier. Once all units have started, the last uneven wave contributes
3.45-4.03s at8/12, including useful compilation and serial per-unit backend work.
Removing ordered grammar/effect/stage publication is not justified by these data.

Single-unit tracked retention after join is615.9MB, peak713.4MB against1.25GiB;
multi-unit retention is1.790GB, peak1.882-2.002GB against5GiB (35.1-37.3 percent).
Ledger vector capacity is80MiB/160MiB respectively and is reported separately.
RSS includes allocator, LLVM and thread memory outside this payload ledger;
peak retention is not an allocation-call count or total heap bound. Byte-cap
saturation did not cause these scaling limits. Disposing every profile and
failure fixture succeeds through the production allocator and requires zero
live budget receipts, drained pools and no borrowed worlds; this is targeted
ownership evidence, not a substitute for a heap/race sanitizer.

## Correctness and focused regression

All16 retained runs exited0. Exact byte comparisons cover136 optimized objects,
136 complete canonical Foundation artifacts,136 generated root sources and8
import sources, including the baseline self-comparisons. No normalization.
Interpreter checks return42 for each answer and body0(36). The current native
CLI linked `frontend_units_profile_result.tower` with the single-unit object and
each of the four multi-unit body bands separately; every executable returned
exactly42/42. All other samples have identical complete objects to these controls.

`dependency-scaling` passes serial versus4/8/12: complete canonical output,
actual distinct-thread outer overlap, imported forward/generic/type/staged work,
and identical diagnostic bytes/offsets for the executed cycle before a later
unknown-name error. This four-unit correctness fixture has at most four outer
jobs, independent of its requested budget. The16-unit profile supplies the
larger ready frontier.

`unit-admission` passes: a real nested grammar lane release starts an already
ready outer unit112088ns later, while its parent is still live. It also verifies
canonical equality, bounded lane/byte usage and cancellation drain on the
production allocator. `backend-ir` passes optimized/unoptimized exact object
equality, calls/types/globals, ordered target errors and cancellation.
`backend-overlap-calibrated` passes actual backend/frontend overlap and exact
objects after a test-only accounting correction described below.

The original overlap run FAILED its exact disposal assertion. Actual released
grants were136 bytes (component-kind instance index),232 bytes (archetype row/
column index), and16359 bytes (component page); disposal restores a200-byte
archetype index. The old observer counted only component pages, omitting168 net
bytes. A partial index-only correction still FAILED by32 bytes. The final Tower
observer deduplicates actual physical receipts for pages, kind indexes and
archetype row/column buffers. Original exact byte/live-owner equations remain;
no semantic weakening, magic byte adjustment or runtime accounting change.
Initial test build failures (nominal clock ABI collision, global string startup,
explicit pointer/aggregate-borrow diagnostics) and all failed runs remain in logs.

## Scope and retained evidence

Runtime/build inputs are the frozen published commit above. New code is confined
to existing Tower profile/regression support, a shared source fixture and the
native result check. B1 parser/import preparation, A1 body admission, L1 backend
reconstruction and optimization policy remain untouched. Later source must get
its own affected-path acceptance; this receipt never relabels that source as
tested. The accepted252b424a whole-generation receipt and artifact identities
remain unchanged. Full platform, hosted release, later-source scaling and
sanitizer acceptance remain pending ROOT milestones.

Host evidence:
`C:\Sandbox\build\codex_ecs_20261122\B2\utilization_b0f507c6`.
It retains warmups, all16 profile JSON/exit-code/live-thread logs, generated
sources/canonical/object artifacts, reference SHA256 manifest, compiler/profile
executables, tool/topology identities and every focused build/failure/pass log.
Linux originals remain `/cache/b2_util_*`. No package or public pin was changed.

Publication reconciliation preserved incoming histories through `ce4f7240` in
merge `48ff2499df991c43e9b40f2a9b06b5c49ef72cfa`. Its affected native closure
rebuilt in8 actions. Unit-admission, backend-ir, dependency-units and calibrated
backend overlap pass on that merge. A small16-unit/32-body dependency control
at1/8 workers produces identical complete source/canonical/optimized objects;
the merged native object returns42/42. These are focused integration checks,
not a rerun or relabeling of the frozen scaling samples above. Logs are prefixed
`b2_util_merged_`; broader later-source acceptance remains ROOT-owned.
