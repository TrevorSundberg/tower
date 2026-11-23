# Within-unit compiler attribution, B2

Frozen source: `e0e3530b84472be5ba1bc4e331b74bab4dba01bd`. This retains the
accepted worker-grain implementation and its separate receipt. This change adds
optional observations and an observer ownership regression, **not a scheduler
policy change or claimed speedup**. No demonstrated ready-work starvation justifies
changing grain, dependency order or publication boundaries in this experiment.

The existing world-owned `GrammarObserver` now also observes frontend parsing,
semantic coordinator phases, admission, shared dispatch and stage publication.
`WorkPool.observe` borrows a frozen callback/context until synchronous batch join;
each kernel writes only its ordinal's private slot. The coordinator reads slots
after drain, including the failure path. Slots derive from actual job count.
There are no compiler clocks, global counters, new pools or semantic dependencies.
The observer is absent in throughput runs. Existing serial dispatch still runs
inline without a semaphore. Enum additions preserve previous numeric members.

## Method and throughput

KinmenB Docker `tower-b2-work`, CPU12–23 (six physical cores/twelve SMT lanes),
quota12,24GiB, Linux x64, LLVM/Clang19.1.1, Release `/cache/native`, public bootstrap
SHA256 `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`.
Dependency-aware builds use compiler jobs1, outer build jobs6. No sibling cache
or concurrent owned workload. This is partition evidence, not whole-host scaling.

The unchanged `frontend_units_profile` generator supplies one unit with16 or4096
independent loop bodies using `decltype`, plus an imported module, type-producing
calls, forward `comptime` calls, generic identity and an untaken dependency.
Pointer width8, identical source/resource snapshots, explicit workers1/4; fresh
worlds, warm filesystem, one warmup per executable, three counterbalanced samples.
Timed compilation excludes post-join interpretation/formatting/artifact writes.
Every sample checks answer42 and body_0(36)=42 independently of timing.

Median wall/CPU seconds and process peak RSS MiB, observation disabled:

| Bodies | Workers | Before wall/CPU/RSS | Observer-capable wall/CPU/RSS |
| --- | --- | --- | --- |
|16|1|0.460 /0.420 /172.8|0.461 /0.422 /172.8|
|16|4|0.554 /0.563 /175.5|0.546 /0.555 /175.6|
|4096|1|2.279 /2.239 /817.8|2.330 /2.290 /817.9|
|4096|4|2.169 /2.930 /820.2|2.170 /2.924 /819.8|

Large serial ranges overlap: before2.183–2.403s, after2.231–2.437s. The observed
2.2% median serial increase is retained, not dismissed as a proven zero-cost
observer or presented as a significant regression. Parallel medians are unchanged.
Within-unit1/4 throughput is only about1.07x; parallel CPU/wall is1.35, despite
genuine peak4. Small-unit parallelism remains slower than serial.

## Attribution

Final optional diagnostic runs, milliseconds, workers1/4. Phases nest; do not
add their inclusive times. Kernel spans include clock callback overhead.

| Boundary |1 worker|4 workers|
| --- | ---: | ---: |
|Frontend source parsing/assembly|616.6|710.5|
|Semantic root checking (`sem_run`)|842.0|578.2|
|Body pipeline, included above|550.8|328.6|
|Body discovery, included above|156.6|50.6|
|Body waves, including leases/join/publication|295.8|164.9|
|Known inference/snapshot frontier|146.3|133.7|
|Later lifecycle frontier|391.4|422.7|
|Lowering pumps, included in lifecycle|355.4|375.0|
|All shared stage publication joins|91.1|90.5|

Root checking outside the body pipeline is291.3/249.6ms: coordinator declaration
and type preparation remain substantial. Body input/layout/declaration/query
pumps and preparation have separate raw fields; no function-body time is
attributed to LLVM. The distinct lifecycle `sem_phase_publish` boundary is only
0.02/0.03ms, not the90ms of structural stage publication across semantic work.

The311 semantic dispatches total675.4/306.6ms. Actual private kernel intervals
reach four simultaneous threads in Body, BodyDiscovery, Declaration,
DeclarationType, KnownBinding and Lower work. At workers4, their interval sum is
1143.7 lane-ms against1219.5 admitted lane-ms:93.8% dispatch occupancy. The union
of active intervals is294.0ms;12.5ms has no executing kernel. The remaining75.8
lane-ms includes end-of-batch imbalance, transport and scheduling, not proven
idle eligible work. Admission itself costs1.28ms. Shared lanes peak4 and return
to zero; there is no oversubscription. The collector costs7.0/7.5ms across all
semantic dispatches, reported separately and included in enclosing phase times.
Outside dispatch, ordered preparation/publication dominates; these measurements
do not prove that every such interval is inherently serial.

The4105 lowering kernels use120.7/330.3ms summed thread CPU and122.9/429.3ms
summed wall, with peak1/4. This amplification is actual kernel work/waiting, not
collector overhead or queued width. Next bounded producer: attribute
`sem_lower_frontier` registration/capture/lease preparation and
`semantic_lowering_kernel` private scratch/`sem_lift_block` work, distinguishing
repeated traversal from allocator/cache contention before changing admission.
The current trace does not identify a particular lock or justify forcing these
kernels serial. B1's serial grammar producer remains a separate large limit.

Optimized x86_64-pc-linux-gnu object controls at1/4 take4.185/4.063s total,
4.133/4.850s CPU,827.8/830.8MiB RSS. Backend preparation47/47ms, IR106/106ms,
optimization1358/1382ms, emission361/377ms; other backend phases are retained.
The existing optimized policy is unchanged. Its serial LLVM work further limits
end-to-end within-unit scaling and is outside this scheduling change.

## Correctness, memory and retained evidence

Exact source and complete canonical bytes match before/after and1/4 for both
sizes; complete optimized objects also match1/4 (204208 bytes). The independently
public-compiled native reference links that object with Clang and checks42/42.
Body smoke, query smoke, real LR overlap, unit admission/cancellation, WorkBudget
stale receipts, WorkGraph ready/revision checks and typed dispatch failure/retry
pass. The new dispatch observer regression covers real allocator/transport,
private projected ordinals, serial and parallel calls, rejected semaphore
creation and post-drain callback ownership. No error is waived.

Retained budget bytes are20.28MB small and614.41MB large; peak charged bytes
109.62MB/712.74MB versus1.25GiB, with10/20MiB ledger storage separately. Byte
admission is not saturated. The additional world/pool observer fields retain16
bytes in this fixture. RSS includes allocator/LLVM/threads outside tracked payload;
production allocation-call counts are unavailable. Cancellation checks verify
grant release and owning-world cleanup, not a general leak/race proof.

Raw artifacts, commands, source patch, resource/artifact hashes and logs:
`C:\Sandbox\build\codex_ecs_20261122\B2\within_unit_e0e3530b`, plus
`/cache/b2_within_*`. Original throughput executables remain intact; the last
profile-only rebuild adds collector-cost reporting with unchanged runtime objects.
SHA256 before / throughput-after / final diagnostic:

```
588aceaf1c8e6659f5239707dd5e9742b44306bdbef3688b592aafe93b555c3d
87c5e63a155155996307b019aafaf96794d7836dd61d5cea374a34587bf2fb9b
b8d93e557e433d388f5be095b1cb55b69f4fefc1b3e819552575d810317fa91d
```

Commands: `tower-frontend-units-profile /work/scaffolding 1 W N dependencies
[grammar] [backend optimized] [artifacts DIR]`; existing test selectors and
build logs retain exact invocations. Later-source integrated platform,
generation, browser and sanitizer acceptance remain pending and ROOT-owned.
The accepted whole-generation receipt and public pin are unchanged.

Publication reconciliation: implementation `f16cde13` merged complete incoming
history through `cc21bb4e` as `4fd5ab83c11dbcb41a39eaff166a0a9d6dbacadc`.
No observation/scheduling file conflicted and both journal histories remain.
Incoming generic-inspection inputs required four native build actions; query
smoke and unit-admission/cancellation pass again. Merged4096-body1/4 controls
retain exact source/canonical bytes, known42 results and peak4 semantic kernels.
Their canonical SHA256 is
`9c0daad4b6b7d0d94eeb27c99fe30c27e37cee1cabc3555c7db83a67278d0039`.
These are separate affected-source correctness checks, not a relabeling of the
frozen performance samples. `b2_within_merged_*` logs retain this validation.
