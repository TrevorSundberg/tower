# Joined budget gate and Entity storage: useful-core acceptance

The joined implementation improves the measured frontend workload without a
serial or memory regression. Uniform12x256 at four workers falls **4.323 to
2.394 seconds**, with CPU13.856 to8.180 seconds and compilation peak RSS1100.9
to990.2MiB. Its current serial time is5.053 seconds, giving **2.11x** useful
frontend speedup. Eight/twelve workers offer little additional latency benefit
and substantially greater CPU/RSS. Keep the accepted joined implementation;
this evidence does not justify another scheduler change or full-core completion.

## Frozen inputs and method

- Current published source `cabc2062fd67283bc78cf235981741e917671d24`, tree
  `0e1a94bcd0766ba27862561f2f455c3ba374b874`. Both published changes are present:
  [exclusive WorkBudget gate](compiler_budget_gate_70e77b60.md) and
  [inline Entity component index](entity_inline_component_70e77b60.md).
  No production source was edited in this task. Later independent producer
  changes are excluded from this freeze.
- Baseline is the retained exact70e77b60 executable from the gate receipt,
  SHA256 `f89f1e3b268d0ba437760e3da398085d20f0a58bb5745d0442e215b0bbf8adf5`.
  Joined executable:
  `caf213eb8a1236f0656a4ac8994e1a428510e3922eb3c706c17b51403fa30b0e`,
  identical to the already checked ba8816e4 joined binary. Incoming changes
  through this freeze affect documentation and unrelated module-body fixtures.
  Other later backend fixture composition is not attributed to gate/Entity.
- Current source manifest SHA256
  `57445cb20b47f09503a97e5ea340a675600eb2d658c7b4bdf0d57746f8114d4a`;
  resource manifest `680acf0b8b20f984068b6615e33a990d47a967f001261efd4136c1a9950868dd`.
  Every invocation uses the unchanged absolute resource root
  `/cache/budget_gate_70e77b60/input`. Those frozen resource bytes are distinct
  from the current compiled providers; do not relabel that whole tree current.
  Bedrock, Foundation, Foundation syntax, Tower and types match current bytes.
- Existing `frontend_units_profile.tower` SHA256 remains
  `3fa3430df1c23811837197288e5a5bc58660267175c81c5b70514238cea4d779`.
  Actual [uniform fixtures](compiler_uniform_reuse_3ad7d5f0.md), not the asymmetric
  default:1x16,1x4096,12x256; `dependencies uniform`, target pointer8,
  revision81/profile19, backend0/optimized0. Imported generic/type/decltype,
  forward comptime and untaken-dependency inputs remain byte-identical.
- B1 KinmenB container `tower_ecs_b1`, CPU0-11 (six physical cores/twelve SMT
  lanes),24GiB, no CPU quota beyond cpuset. Linux6.18.33.2 WSL2, Ubuntu
  Clang/LLVM19.1.1, native x64 Release, production allocator/transport.
  Shared host, fresh processes/worlds, warm filesystem; no hidden persistent
  grammar cache, frequency isolation or whole-host speedup claim.
- One dependency-aware `tower-frontend-units-profile` target, parallel6,
  compiler jobs1, `TOWER_BOOTSTRAP_COMPILER` unset: **Ninja no work**,
  0.88s wall/0.11CPU/18260KiB. Checked-in public768 predecessor unchanged.
  Same cached flags on both binaries; no duplicate leaf or compiler rebuild.
- n2 at1/4/8/12. Reuse eight exact previous baseline samples: small1 and
  multi1/4/12. Their original commands/logs remain unchanged. Fill16 missing
  baseline observations and run24 joined observations. Round1 ascends widths,
  before then joined; round2 reverses shapes/widths and executable order.
  Thus reused observations are matched historical samples, not claimed to be
  freshly interleaved. No warmup compilation or discarded timed observation.
- All48 timed observations omit `grammar`; only the existing sparse outer
  boundary clocks remain. One separate joined1x4096/12 `grammar` run supplies
  inner overlap/phase attribution. It is excluded from throughput medians.

Exact command transport is retained in `combined_freeze.sh`,
`combined_samples.sh`, `commands.txt` and each GNU time log:

```sh
/cache/combined_cabc2062/{before,joined}/profile \
  /cache/budget_gate_70e77b60/input UNITS WORKERS BODIES \
  dependencies uniform artifacts DIRECTORY
```

## Checked frontend and process costs

Each value is the n2 midpoint; seconds and MiB. Before → joined. Inner timing
includes batch construction, inputs and frontend compilation; excludes reference
interpretation, canonical formatting/artifact writes and destruction. Inner RSS
is process high-water through that point, not an allocation count.

|Bodies|Workers|Inner wall|Inner CPU|Compilation peak RSS|
|---|---:|---:|---:|---:|
|1×16|1|0.413 → 0.397|0.378 → 0.362|173.7 → 161.7|
|1×16|4|0.489 → 0.443|0.494 → 0.437|177.6 → 165.1|
|1×16|8|0.487 → 0.447|0.495 → 0.447|176.6 → 164.7|
|1×16|12|0.482 → 0.447|0.494 → 0.447|176.3 → 164.2|
|1×4096|1|2.151 → 1.968|2.107 → 1.929|793.4 → 716.4|
|1×4096|4|2.004 → 1.897|2.717 → 2.544|797.8 → 721.6|
|1×4096|8|1.973 → 1.851|3.237 → 2.872|796.6 → 722.1|
|1×4096|12|2.190 → 1.940|4.082 → 3.407|796.9 → 721.5|
|12×256|1|5.783 → 5.053|5.443 → 4.716|817.2 → 734.6|
|12×256|4|4.323 → 2.394|13.856 → 8.180|1100.9 → 990.2|
|12×256|8|4.614 → 2.359|22.305 → 12.219|1490.3 → 1347.9|
|12×256|12|4.808 → 2.353|39.349 → 20.608|1856.7 → 1669.8|

Whole-process GNU time includes startup, independent output checks, artifact
writes and complete teardown. CPU is user+system. Its RSS is process high-water,
not summed worker peaks.

|Bodies|Workers|Process wall|Process CPU|System CPU|Process peak RSS|
|---|---:|---:|---:|---:|---:|
|1×16|1|0.460 → 0.440|0.405 → 0.385|0.050 → 0.060|173.7 → 161.7|
|1×16|4|0.540 → 0.490|0.530 → 0.460|0.130 → 0.095|177.6 → 165.1|
|1×16|8|0.535 → 0.495|0.525 → 0.465|0.145 → 0.110|176.6 → 164.7|
|1×16|12|0.535 → 0.495|0.525 → 0.475|0.140 → 0.115|176.3 → 164.2|
|1×4096|1|2.570 → 2.350|2.480 → 2.265|0.395 → 0.320|793.4 → 716.4|
|1×4096|4|2.460 → 2.305|3.135 → 2.905|0.625 → 0.520|797.8 → 721.6|
|1×4096|8|2.430 → 2.255|3.655 → 3.230|0.895 → 0.670|796.6 → 722.1|
|1×4096|12|2.670 → 2.345|4.520 → 3.770|1.285 → 0.920|796.9 → 721.5|
|12×256|1|6.300 → 5.500|5.870 → 5.075|0.470 → 0.395|817.2 → 734.6|
|12×256|4|4.915 → 2.900|14.360 → 8.595|5.230 → 1.965|1101.7 → 991.0|
|12×256|8|5.255 → 2.915|22.845 → 12.680|11.860 → 4.450|1491.0 → 1348.6|
|12×256|12|5.470 → 2.920|39.910 → 21.080|23.940 → 9.665|1857.1 → 1670.3|

Small serial is fastest; parallel is11-13% slower than current serial. Large
within-unit best observed width8 gives only1.063x frontend speedup; twelve trails
eight and has more CPU cost. Preserve the noisy12-worker large samples:
baseline2.3061/2.0733s, joined1.8873/1.9918s. Small serial is0.4167/0.3781s;
this bounded sample supports no material regression, not a precise3.9% claim.

Multi4 is the useful latency/CPU/memory point:2.3761/2.4116s versus multi12
2.3008/2.4047s. Their ranges overlap. Compared with four, twelve saves only1.7%
of median inner wall, uses2.52x CPU and1.69x RSS; whole-process wall is slightly
worse (2.920 versus2.900s). Current process speedup at four is1.90x
(5.500/2.900), distinct from2.11x inner frontend speedup.

Multi compilation voluntary switches before → joined at1/4/8/12:
2337.5→2333.5;230195→68727;549965→193853.5;1087734→414438.5.
Whole-process system CPU falls sharply, but joined12 still spends9.665s versus
1.965s at4 and0.395s serial. Small serial system time rises0.050→0.060s;
do not hide that variation. System time/context switches are not measured mutex
wait duration or proof that one remaining lock accounts for all residual cost.

## Retention, ownership and executable size

MiB except live receipt count. These are post-join retained payload, live grants,
peak admitted payload and separately retained ledger metadata. Peak values can
vary by execution order; they are n2 midpoints, not guaranteed limits.

|Bodies|Workers|Retained bytes|Live grants before close|Peak byte grants|Ledger metadata|
|---|---:|---:|---:|---:|---:|
|1×16|1|19.25 → 17.47|33239 → 17118|102.50 → 93.77|10 → 10|
|1×16|4|19.25 → 17.47|33240 → 17119|102.45 → 93.72|10 → 10|
|1×16|8|19.25 → 17.47|33240 → 17119|102.45 → 93.72|10 → 10|
|1×16|12|19.25 → 17.47|33240 → 17119|102.45 → 93.72|10 → 10|
|1×4096|1|540.66 → 497.22|948686 → 432300|626.10 → 575.70|80 → 40|
|1×4096|4|540.66 → 497.21|948687 → 432301|626.06 → 575.66|80 → 40|
|1×4096|8|540.66 → 497.21|948687 → 432301|626.06 → 575.66|80 → 40|
|1×4096|12|540.66 → 497.21|948687 → 432301|626.06 → 575.66|80 → 40|
|12×256|1|603.78 → 553.08|1044815 → 498239|681.14 → 623.48|80 → 40|
|12×256|4|603.75 → 553.05|1044827 → 498251|856.02 → 799.92|80 → 40|
|12×256|8|603.75 → 553.05|1044827 → 498251|979.95 → 901.67|80 → 80|
|12×256|12|603.75 → 553.05|1044827 → 498251|1501.38 → 1345.06|160 → 80|

Every run remains below its unchanged byte limit (1.25GiB for one unit;4GiB for
twelve), with peak lanes no greater than requested and zero lanes after join.
The displayed nonzero grants legitimately own the returned programs. The deferred
`frontend_units_close` drains, releases worlds/results and requires successful
`work_budget_dispose` (zero live grants) before gate destruction; the unchanged
receipt invariants govern byte release and the joined snapshot checks zero lanes.
Every process exits0 through that check. RSS includes foreign/OS allocation and
does not equal admitted payload plus ledger metadata; allocation calls were not
newly instrumented. Full exact-byte snapshots remain in the JSON files.

Same-flags profile ELF grows2,343,320→2,347,968 bytes: **+4,648 (+0.198%)**.
llvm-size text/data/bss total2,165,728→2,168,465: +2,737 (+0.126%).
This small code-size increase is separate from the lower runtime retention/RSS;
the complete composition delta is not assigned solely to either implementation.

## Attribution and scheduling decision

Multi-unit spans record distinct actual threads and outer overlap1/4/8/12.
Single-unit observer separately records12 simultaneous semantic kernel threads;
its outer coordinator also participates, so these are not13 additive workers.
The shared lane ledger peaks12, then returns to zero.

Current joined startup is2.2-3.8ms. Multi outer-ready vacancy is at most
**1.386 lane-ms**, with individual refill maximum0.152ms. This is an upper bound:
nested work may legitimately occupy apparently vacant outer lanes. There is no
measured extended ready-work starvation.

The separate large12 observer takes1.860s inner wall/3.367CPU,738124KiB.
Inclusive phase milliseconds, never summed as disjoint work:

|Boundary|Wall ms|Coordinator CPU ms|
|---|---:|---:|
|Frontend parsing/assembly|591.84|547.72|
|Grammar version construction, inside parsing|346.67|313.50|
|Parser tables, inside version construction|263.10|230.33|
|Semantic root checking|543.00|516.14|
|Body pipeline, inside root checking|317.26|299.76|
|Known inference/snapshots|131.46|128.13|
|Later lifecycle|379.29|358.05|
|Lowering pumps, inside lifecycle|322.85|308.40|
|All semantic stage joins/publication, cross-cutting above|88.91|88.77|
|Final semantic publication/flow|72.72|70.88|
|Semantic lane admission|1.30|0.92|

312 semantic dispatches total205.66ms, with active-kernel union190.48ms:
only15.18ms has no executing kernel. Summed kernel wall1,983.50 lane-ms versus
2,414.71 admitted lane-ms is82.14% occupancy within dispatch. The431.21 lane-ms
difference includes tail imbalance, transport and scheduling; it is not proof of
idle eligible jobs. Collector cost9.44ms wall/9.54CPU is separately reported,
outside dispatch/kernel clocks but inside enclosing phase clocks.

Only~11% of the observed frontend wall lies within semantic dispatches. Parsing,
ordered checking and preparation/publication dominate the remainder. Lowering's
4,105 actual kernels use405.13ms summed thread CPU/522.40ms summed wall; body
kernels546.45/702.94ms, with real peak12. Thread wall minus CPU also includes
preemption/waiting and does not identify a lock. Existing LR waves still execute
(39 propagation,67 action waves); their phase timings are not scheduler savings.

Read the actual `frontend_units_step`/receive loop: it refills after each
completion or nested-lane wake, rather than draining an outer batch first.
`work_pool_batch_result` dispatches an already-ready, pre-leased finite frontier;
`compiler_kernel_stages_result` must join/hold before source-ordered publication
and view release. The separate pool claim semaphore is not the budget gate.
No observation here proves that replacing it or removing a join is safe or useful.
Admission1.3ms, small refill gaps and15.2ms dispatch-without-kernel do not justify
a second synchronization change. No rejected admission/LR fast path was revived.

The concrete remaining limit is low within-unit dispatched fraction plus CPU
amplification when independently active worlds contend at high width. Parsing's
591.8ms (including346.7ms grammar construction) is the largest named coordinator
boundary here; lifecycle/lowering preparation is another substantial owner.
This run does not separate their residual lock waits or establish removable
ready-work barriers. Preserve those producer boundaries for a future scoped task,
not a speculative scheduler rewrite now.

## Correctness, reused gates and limits

All48 timed cases plus the separate observer pass original checked answer42 and
body_0(36)=42, including imported generic/decltype/comptime dependencies. Generated
Tower/dependency sources match the original uniform fixture byte-for-byte.
Complete saved canonical Foundation files match the corresponding baseline for
every unit/width/round; no hash-only equivalence, tolerance or skipped output.

No production/test change requires rerunning the same negative matrices. Reuse
the exact joined ba8816e4 LR/units evidence: LR1.74wall/2.26CPU/117356KiB; full
units10.78/16.78/880448KiB. Runtime inputs and those selected fixtures are unchanged
through cabc2062, as are the profile binary and joined LR runner
`eb3b8514e5994644468be4c39437077503bffd47aea0f149cf1fab0a4e88fbde`.
That source-bound evidence covers the original64MiB Capacity first cause,
physical Memory distinction, retry, ordered diagnostics, independent worlds,
nested budgets, cancellation/drain and zero owners. Existing concurrent gate
reserve/release/revision/generation/wake controls and nine strict native symbol
closures retain their recorded evidence; they are not relabeled newly executed.
B2's two older Entity fault-suite failures remain separate pending repairs.

No new compiler/test failure or timed sample was discarded. Two read-only source
lookups used a nonexistent path/Windows wildcard and were corrected; no work ran
against those paths. No code candidate was introduced/rejected in this task.
Whole native generations, sanitizers, host runtime matrices and hosted deployment
are not repeated or claimed. Previous gate-only and Entity-only boundaries stay
unchanged; these results are the joined composition, not additive isolated gains.
This frontend-only fixture emits no native object/backend; earlier C/LLVM CLI
measurements retain their different scope and are not a matched comparison here.

Raw evidence: `build/ecs_b1/cache/combined_cabc2062`, with binaries, source/
resource manifests, cache flags, commands, all outputs and original reused logs.
Concise handoff: `C:/Sandbox/build/codex_ecs_20261122/B1/combined_cabc2062`.
All source/resource/binary hashes verify after execution. Owned work is drained;
disk remains111GiB free. No todo, public pin or deployment changes. ROOT owns
integrated generations and release; profitable full-core completion remains open.

