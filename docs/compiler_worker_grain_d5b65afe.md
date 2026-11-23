# LR worker grain: current frontend

Frozen base `d5b65afee426f2576d44a60f44249010a15ace1d`, tree
`f8401989a29b55aa85bfe35fd50493a33c166e16`, includes B1's published LR state-item
graph and the current semantic/backend ownership work. B2 changes one scheduling
policy: `LRPropagationGrain` rises from64 to512 **actual ready destinations per
job**. Narrow frontiers use the already existing in-place worklist fallback.
This is a measured scheduling grain, not a grammar limit or forced serial mode.
B1's `lr_lalr.tower` graph algorithm, closure/range fallback, action ordering,
shared admission, tickets, leases, cancellation and pool lifecycle are unchanged.

## Attribution

Optional sparse phases extend the existing world-owned GrammarObserver. The
compiler performs no clock calls or global writes. The native Tower profile owns
clocks/counters; each worker writes its private ordinal slot, then the coordinator
reads after join. Other phases remain coordinator-only. Observation is disabled
for throughput samples and enabled separately for attribution.

Same cold16-body input, workers4, before/after:

| Observation | Before | After |
| --- | ---: | ---: |
| Pool open/close lease calls |209/209|209/209|
| Pool creations/growth, total created slots |3,9|3,9|
| Open plus lease-close wall |1.911ms|1.865ms|
| Coordinator item-graph construction |66.672ms|69.889ms|
| Complete lookahead solver |211.261ms|157.048ms|
| Propagation dispatch waves |621|44|
| Ready destination visits in dispatched waves |340239|72852|
| Propagation dispatch wall |173.432ms|31.802ms|
| Coordinator off-CPU during dispatch |70.222ms|5.890ms|
| Summed propagation kernel CPU |248.404ms|59.498ms|
| Actual simultaneous propagation kernels / distinct threads |4/4|4/4|
| Action dispatch waves |92|92|
| Action dispatch wall |14.180ms|13.722ms|

Early pool creation is not the material cost: the pool already survives revisions
and almost all opens reuse it. Changing its lifetime would target under2ms here.
The old grain dispatches many tiny rounds through private-vector preparation,
query/range tickets, view leases, semaphore wake/claim/join and ordered publication.
The coarser grain removes577 such rounds while still dispatching44 substantial
frontiers on up to four simultaneous kernels. It reduces repeated copy/frontier
work as well as handoff cost; these measurements do not isolate a semaphore's
individual cost. Off-CPU is wall minus thread CPU, including waits/preemption;
it is not proof that all cores were idle. Phase times nest and kernel times
overlap. Remaining solver time includes serial worklist completion and coordinator
preparation/publication; the unchanged graph construction belongs to B1.

## Matched cost and outputs

KinmenB Linux/LLVM19.1.1, existing `/cache/native`, public bootstrap
`768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`, compiler jobs1,
outer build jobs6, CPU12-23/quota12/24GiB. This partition has six physical cores
with SMT; other lanes kept their partitions. No whole-machine scaling claim.
Fresh processes/worlds, warm filesystem caches, identical generated sources,
resource tree and target. Timed interval covers frontend creation through join;
reference execution/formatting/cleanup follow and must also succeed.

Initial unpaired n3 observations are retained. Their serial variation warranted
the final paired n3: before/after, after/before, before/after for each input and
worker setting. No intervening builds or sibling use of this cache. The table
reports those final paired means, including noisy samples, not selected minima.

| Bodies | Workers | Wall before/after s | CPU before/after s | Peak RSS before/after MiB |
| --- | ---: | ---: | ---: | ---: |
|16|1|0.646 /0.671|0.610 /0.632|171.7 /172.0|
|16|4|0.772 /0.712|0.905 /0.748|175.8 /175.8|
|1000|1|0.927 /0.934|0.889 /0.897|326.3 /326.2|
|1000|4|0.989 /0.942|1.295 /1.153|328.6 /327.6|

Workers4 improve mean wall7.9%/4.7% and CPU17.4%/11.0%; voluntary switches fall
6405->2108 and7330->3610. Serial mean wall varies+3.8%/+0.7%; the intended serial
path is unchanged, and these small samples do not establish a zero-regression
bound. The small case remains slower at4 than1; no default is changed to hide it.
Raw n3 wall pairs (before -> after), in seconds:

```text
16/1:   .777447->.833149  .597451->.612270  .563780->.566711
16/4:   .894361->.762094  .734245->.742778  .688421->.630007
1000/1: 1.030887->.981489 .897572->.948338  .853194->.871323
1000/4: 1.071376->1.050898 .951878->.911978 .942840->.863269
```

The substantial4096-body frontend control (one observed sample/setting) retains
useful parallelism: after1/4 workers2.254/2.115s wall,2.219/2.858s CPU,
811.9/813.7MiB RSS; before2.210/2.146s wall. Actual propagation peak remains4,
not merely four queued jobs. This is modest6.2% within-unit throughput evidence,
not sustained four-core utilization. Frontend and serial LLVM/ordered grammar
boundaries remain separate limits.

The existing16-unit uneven imported/staged dependency control uses1024 maximum
bodies and optimized x86_64-pc-linux-gnu objects. Before1/8 workers17.438/8.620s
wall and16.784/49.026s CPU; after17.269/8.612s and16.603/48.955s. Actual outer peak8
and about2.00x serial throughput are retained; no multi-unit speedup from this
grain change is claimed. Peak RSS after1/8 is2018.5/2738.3MiB. This bound already
keeps the outer workers busy, leaving fewer extra lanes for nested work.

Exact retained bytes and peak charges are unchanged in the paired single-unit
cases: small ~19.04MB/~108.4MB, large ~162.14MB/~253.4MB, against1.25GiB; ledger
capacity10/20MiB separately. Multi-unit retention1.790GB, peak~1.984GB at8 against
5GiB. Allocation-call counts are not available from this production allocator;
RSS includes LLVM/allocator/thread memory outside tracked payload. All profiles
join with zero active lanes and dispose with zero live grants/borrowed worlds.

## Checks and provenance

PASS: exact before/after and serial/parallel source/canonical bytes for small and
large; complete optimized multi-unit objects, source and canonical bytes; every
profile's known interpreter answer/body42; independent native link of the changed
object returns42/42. The public pin builds that reference harness separately.
The native LR suite covers serial/threaded tables, overlapping range fallback,
pool reuse/isolation, admission denial/retry and drain. Its cyclic propagation
fixture now independently checks the expected two ordered range values, both a
narrow no-dispatch frontier and a wide frontier with multiple joined waves; the
unseeded cycle stays empty. Existing shared-budget unit-admission passes, including
real nested release-to-ready-outer entry122771ns and cancellation drain.
Backend-ir and dependency-scaling pass (exact canonical/error bytes and offsets).
The serial instrumented `lr-order` oracle passes150 randomized grammar/propagation
comparisons and storage failures; it is not threaded sanitizer evidence.

Commands use existing dependency-aware targets and selectors:
`tower-frontend-units-profile /work/scaffolding 1 W BODIES [grammar] [artifacts DIR]`,
`16 W 1024 backend optimized spread dependencies artifacts DIR`,
`tower-lr-work-tests /work/scaffolding lr|unit-admission|backend-ir|dependency-scaling`,
and `tower-frontend-tests /work/scaffolding lr-order` from the resource directory.
One observer build failed on a missing explicit WorkPool import; its log remains.
Only affected dependency closures/test objects were rebuilt; no public-leaf
double build, generation, browser or sanitizer matrix was run.

Before/after frozen profile SHA256:
`ce6d4b78668d3917f0e1b2e956e43d47c4adcd8d50528d618daed72707a7fe06` /
`bfb558aac7e44418eb12aa5d94469f17310494cdc7ea89780d177cf72ca3b0e0`.
Raw initial/paired observations, source/resource hashes, exact artifacts, patch,
executables and all build/failure/pass logs are retained at
`C:\Sandbox\build\codex_ecs_20261122\B2\worker_grain_d5b65afe` and
`/cache/b2_admission_*`. The older complete-generation and partition receipts
remain unchanged. Current data supports this grain on these workloads; grammars
with different range densities may have different crossover points. Full later-
source/platform/sanitizer/hosted acceptance remains ROOT-owned and pending.

Publication merged complete incoming history through `3a7f4b39` as
`e292754d32a313bb9b527a8b6751967630a4c375`, including B1's range-union optimization.
No scheduling-file conflict or interface rewrite occurred. Nine affected native
actions rebuilt; LR/pool/budget, nested-admission/cancellation, dependency outputs
and the150-trial oracle pass again. Merged1000-body controls at1/4 have exact
canonical/source bytes and known42 results; parallel propagation still observes
44 waves and four simultaneous kernels. Their0.759/0.814s wall is a separate
single observation on changed source, not the paired grain speedup above. Logs
and artifacts named `b2_admission_merged_*` are retained with the frozen receipt.
