# Native partition utilization, frozen 56c892c1

Real twelve-way overlap passes; profitable twelve-worker throughput remains open.
The confirmed best sampled widths improve median wall time by 9.3% within one
unit and 15.4% across twelve units. Admission/refill gaps are small; increased
work cost, particularly grammar construction across units, dominates. No runtime
scheduler policy was changed. This receipt does not close the browser gate.

## Inputs and reproduction

- Published compiler/runtime source: `56c892c1e9422f2c667bc7976a5fdc44bd48481a`.
  The only build-input delta is the accompanying profile fixture: `uniform`
  gives every unit the requested body count, and JSON exposes post-join lanes
  and live grants. Default/tail and `spread` behavior remain; conflicting modes
  fail with exit 2. No compiler, allocator, scheduling or observer ABI change.
- B2 `tower-b2-work`, own `/cache/native`; Linux 6.18.33.2 WSL2, Ubuntu 24.04,
  LLVM/Clang 19.1.1, Release, compiler jobs 1. CPU12–23/quota12/24GiB: six physical
  cores with twelve SMT logical CPUs, **partition scaling**, not whole-host scaling.
  Owned jobs were idle before changes and drained after checks. Initial free
  space: cache 924GiB, Windows host 114GiB. No sibling cache/build used.
- Native production allocator and worker transport; allocator instrumentation
  OFF, sanitizer unset. Linux x64, pointer width 8, frontend only, backend and
  optimized flags both 0. No object/codegen performance or identity claim.
- Public bootstrap SHA256:
  `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`.
  One dependency-aware `cmake --build /cache/native --target tower-frontend-units-profile --parallel 6`:
  9 actions, 29.317s wall, 61.376s CPU, 1065876KiB maximum waited-child RSS.
- Measured executable SHA256:
  `cf43fd17ae9fd326fbb3c3094fb8ea26ea4acff008ff11635f8ce8fe64197654`.
  Profile source SHA256:
  `3fa3430df1c23811837197288e5a5bc58660267175c81c5b70514238cea4d779`.
  Frozen `.tower` resource-file manifest SHA256:
  `6288c9f2b06069412284847606b2446af6ed81a5ac7cd9f76296f1a768bfb84a`.
  All compiler/runtime inputs are from the freeze; the manifest includes the
  stated fixture delta. The retained older profile executable SHA256
  `6db91eccec25334d0ddcf80699e88d96661d5dc41c966deb3935eff16c647dfc`
  is historical evidence, not a matched current-source baseline.

Raw commands, build/config/host records, binaries, source manifests, JSON,
stderr, generated source/canonical files and comparison receipts:
`C:\Sandbox\build\codex_ecs_20261122\B2\core_acceptance_56c892c1`
(container copy `/cache/core_acceptance_56c892c1`). No large archive required.

```sh
/cache/core_acceptance_56c892c1/profile /work/scaffolding UNITS WORKERS BODIES \
  dependencies uniform [grammar] artifacts DIRECTORY
```

Fixed workloads: one unit/4096 bodies; twelve units/256 bodies **each**; one
unit/16 bodies as serial control. Each body has ordinary loop/control work.
The existing imported dependency helper exercises forward `decltype`, type
production, generics, comptime and an untaken cyclic branch. Unit count is not
a scaling axis: each workload is compared only against itself.

Fresh processes/worlds, warm filesystem, no overlapping owned runs. One initial
sample at workers 1/4/8/12 with optional grammar observer disabled, then the same
widths with it enabled for attribution. Only serial and the best initial width
were repeated in counterbalanced order: single 1/8/8/1, multi 1/4/4/1. Together
with the initial sweep these give n3 for those candidates; no confidence interval
or uniquely optimal width is claimed. The small serial run precedes the sweep.
The existing outer interval clock stays enabled even when `grammar` is absent.

## Throughput, observer disabled

Initial n1, wall/process CPU seconds; RSS is MiB at completion of the timed
compilation, before reference execution and canonical formatting.

| Fixed workload | Workers | Wall | CPU | Peak RSS | Actual outer overlap |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 × 16 | 1 | 0.4594 | 0.4183 | 172.63 | 1 |
| 1 × 4096 | 1 | 2.1888 | 2.1418 | 802.64 | 1 |
| 1 × 4096 | 4 | 1.9938 | 2.7177 | 804.30 | 1 |
| 1 × 4096 | 8 | 1.9715 | 3.2149 | 802.44 | 1 |
| 1 × 4096 | 12 | 1.9809 | 3.8066 | 803.07 | 1 |
| 12 × 256 | 1 | 6.5038 | 6.0055 | 820.76 | 1 |
| 12 × 256 | 4 | 5.6472 | 17.4713 | 1129.84 | 4 |
| 12 × 256 | 8 | 5.7957 | 27.4218 | 1546.32 | 8 |
| 12 × 256 | 12 | 6.1868 | 49.4640 | 1964.06 | 12 |

Confirmed n3 medians (initial plus two retained repeats):

| Workload | Serial wall/CPU | Candidate wall/CPU | Wall speedup |
| --- | ---: | ---: | ---: |
| 1 × 4096, workers 8 | 2.1888 / 2.1418 | 1.9856 / 3.2553 | 1.102× |
| 12 × 256, workers 4 | 6.5253 / 6.0316 | 5.5206 / 17.0070 | 1.182× |

The first sweep's eight/twelve-worker single-unit results are close. More CPU
consumption is not speedup: median CPU rises about 1.52× and 2.82× respectively.
Multi-unit workers12 consume about eight logical CPUs on average, but complete
more slowly than workers4 while using substantially more memory.

## Actual overlap and critical path, observer enabled

Observers use existing private per-worker spans, aggregated after join. Measured
distinct simultaneous semantic threads within the single unit are **1/4/8/12**.
At width12, body, discovery, declaration, type, known-binding and lowering
kernels each reach twelve; this is execution overlap, not requested width.
Multi-unit outer spans likewise prove **1/4/8/12** distinct concurrent threads.
At width12 its local semantic dispatches are serial because twelve outer jobs
already hold the shared lanes. Adding local and outer peaks would double-count.

Single-unit phase wall milliseconds, in worker order 1/4/8/12:

| Existing phase | 1 | 4 | 8 | 12 |
| --- | ---: | ---: | ---: | ---: |
| Frontend parse | 619.4 | 703.3 | 712.8 | 705.8 |
| Grammar build (inside parse) | 323.3 | 396.6 | 401.7 | 400.3 |
| Semantic run | 789.8 | 575.4 | 564.2 | 538.4 |
| Body discovery | 150.3 | 50.5 | 35.6 | 31.7 |
| Body wave | 278.3 | 165.3 | 153.7 | 143.6 |
| Known values | 133.0 | 129.1 | 136.7 | 128.1 |
| Lifecycle | 359.5 | 399.5 | 400.2 | 408.4 |
| Lowering | 329.4 | 356.4 | 354.6 | 360.2 |
| Stage publication | 92.1 | 90.1 | 91.3 | 85.2 |
| Semantic admission | 0.6 | 1.3 | 1.4 | 1.3 |

Phases overlap/nest; do not sum them into total time. Body/discovery frontier
speedups are real. Parsing and lowering do not improve. Separate lifecycle
publication remains negligible (0.023ms at12), unlike total stage publication.

Single-unit semantic dispatch, 312 calls at each width:

| Workers | Dispatch wall ms | Kernel CPU ms | Admitted lane-ms | Kernel interval occupancy | No executing kernel ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 660.5 | 638.1 | 660.5 | 99.73% | 1.806 |
| 4 | 304.7 | 996.7 | 1211.4 | 93.85% | 12.465 |
| 8 | 256.3 | 1484.3 | 2029.5 | 88.30% | 14.054 |
| 12 | 246.5 | 1983.4 | 2918.5 | 85.02% | 14.460 |

Occupancy divides summed executing-kernel intervals by admitted lane time, not
CPU time. Kernel intervals can include preemption/locking; they do not prove
every instruction is useful. Unoccupied admitted lane time is respectively
1.806/74.475/237.486/437.056 lane-ms. The small uncovered gaps do not establish
an eligible-work starvation defect. Non-dispatch phases lack this coverage
measure; their wall minus zero coverage must not be labeled idle time.

Across twelve units, aggregate grammar-build CPU grows from
**4.018 to 9.931/14.484/27.151 seconds** at4/8/12. Aggregate parse CPU is
4.166/10.682/15.890/30.340s; table construction alone is
2.854/6.208/8.617/16.137s (nested, not additive). Semantic-run CPU is
0.390/0.801/0.910/1.764s. Multi-unit phase wall values are sums across concurrent
units, not elapsed critical-path time. This is work-cost amplification, not
evidence that ready work has no worker.

Multi-unit semantic admitted lane-ms: 355.6/1011.6/1650.7/2632.2;
kernel-interval occupancy: 99.17/99.19/94.87/99.74%. Summed dispatch gaps:
2.963/5.309/14.476/6.741ms. Outer-ready vacancy is at most 1.44 lane-ms and
maximum observed refill delay 0.13ms. This upper bound includes legitimate
nested occupancy/publication and is not all avoidable idle time.
Pool-open wall summed across units is 21.1/20.2/31.5ms at4/8/12, with36 pool
creations and108 cached slots across worlds; slots are not concurrent kernels.

Concrete followup for B1's parser integration: `lr_states_lalr_parallel_result`
chooses the item-graph path using nominal `compiler_worker_capacity` before
actual per-phase extra-lane admission. Solver/actions fall inline on
`admission.extra == 0`. At multi4 and multi12 there are **zero parallel LR
propagation/action waves**, despite paying item-graph preparation; multi8 has
some tail nested waves (150 propagation,345 action, peak4). Isolate that
algorithm-selection cost under exhausted outer grants before changing policy.
These observations do not attribute all amplification to this branch or prove
a particular lock/bandwidth cause. No lock or hardware bandwidth counters were
collected. A new LR tuning/algorithm change overlaps B1 and is outside this
bounded small-scheduler-repair criterion. Rejected bitmap/scratch/lowering
experiments were not repeated.

Observer-on wall/CPU seconds (one diagnostic sample, not throughput medians):

| Workload | 1 | 4 | 8 | 12 |
| --- | ---: | ---: | ---: | ---: |
| 1 × 4096 | 2.1510/2.1117 | 2.0420/2.7953 | 2.0490/3.3662 | 2.0106/3.8623 |
| 12 × 256 | 6.6403/6.1521 | 5.6629/17.5088 | 5.7258/26.7490 | 6.1399/49.0138 |

Measured post-join semantic observer collection is7.9–9.5ms single and
6.8–10.4ms summed multi, outside dispatch clocks. Per-kernel timestamp overhead
is included in spans, not separately calibrated. ON/OFF n1 differences include
noise; they are not a precise total observer-overhead estimate. Observer-off
runs alone supply throughput claims. Full phase CPU/wall data remain in JSON.

## Ownership, memory and independent checks

All runs: shared lane peak equals requested width, post-join used lanes0,
peak charged bytes within budget. Single-unit byte limit1.25GiB, live retained
results566.83MB, peak665.11–665.16MB (~50%); twelve-unit limit4GiB, live retained
results632.02–632.05MB, peaks721.91/906.35/1104.90/1688.89MB (<40%). No observed
byte-budget saturation. Budget ledger storage is separately80MiB, except
multi12 at160MiB; it is not total RSS. Small control retains20.09MB and peaks
109.44MB charged. Live pre-close grants single948630/948631 and
multi1044143/1044155 reflect owned results, not leaks or allocation-call counts.

Successful exit executes existing `frontend_units_close`: cancel/drain, close
pools, release worlds/borrows/buffers/work graph, and require successful budget
disposal with no live grants. Every run passes these checks. No new cancellation
or sanitizer campaign, nor claim of complete race/leak freedom; runtime ownership
code is unchanged. All25 primary samples pass (small +16 sweep +8 confirmation).

Independent known execution checks require `answer()==42` and `body_0(36)==42`
in every unit, using the ordinary interpreter outside timing. Complete canonical
Foundation bytes and generated source are compared with `cmp` against worker1
for every observer/worker/repeat case. Twelve uniform source files are identical.
The one-unit legacy mode also matches uniform source/canonical bytes; both
`spread uniform` and `uniform spread` reject with exit2. No failed sample hidden.

SHA256 references (per unit; all12 units share the multi identities):

| Input | Generated source | Complete Foundation |
| --- | --- | --- |
| 4096 | `60ffa29256c9463c899ffc907d9bedd9fe1611f9c8f1a406c1eb5c4dd2a5a2a9` | `9c0daad4b6b7d0d94eeb27c99fe30c27e37cee1cabc3555c7db83a67278d0039` |
| 256 | `084941739f90daa7ad231edb376526a341c9fa750e734e24ee46580d94c93468` | `a350599c7f87acc4a940511e6d61a5369ce28acf6f311ff825a4052c4a844860` |
| 16 | `d74504966bd4570b94f619db589647288c70d5fa99bf4694f31f7751166b45b3` | `5a75ae4154714f9a84397c4e3fef46c4cbb9cf1639b3e53063f84267e79b4c6f` |

Imported dependency source SHA256:
`f5643e359d8a130f384db6b9ff20a7287d36328e9fc5c39dd41b175db364d1a7`.
Broader object/generation/browser/platform/sanitizer acceptance remains ROOT's
separate milestone. Current evidence establishes overlap, deterministic checked
outputs, bounded ownership and modest useful speedups; it does **not** establish
profitable full-partition utilization or validate later compiler changes.
