# Uniform native scaling after scoped grammar reuse

Current twelve-unit compilation is fastest at four workers: **5.8353 to
4.3181 seconds, 1.351x**. Twelve workers take4.7984s and7.17x the serial CPU.
The4096-body single unit gains only1.152x at twelve workers; the small unit
regresses at every parallel width. Real overlap and bounded cleanup pass.
Profitable full-partition utilization remains open. No production code changed.

## Frozen identities and method

- Published source `3ad7d5f0fc639b9e7a270cf736156139fbab84b2`, tree
  `36d06b86110b0815e3a1331f3b6bd9f7c6397681`. Required pull was documentation-only;
  all compiler/build inputs match the previously validated75c15ee7 inputs.
  This includes accepted54f3baab/05edbfb3 reuse/error propagation and already
  published semantic repairs. L1/L2 uncommitted drafts and later changes are
  excluded. Source manifest SHA256
  `f9181a1ff1df81ba06a37d45fa697445c84b5499f04485b7b6bdd1f03efc2da5`
  passed unchanged after all measurements.
- Existing B1 `tower_ecs_b1`, CPU0-11, six physical cores/twelve SMT lanes,
  memory25769803776 bytes. CPU quota is unset; the cpuset bounds execution.
  Linux6.18.33.2 WSL2, Ubuntu24.04, Clang/LLVM19.1.1, native x64, Release,
  production allocator/transport. This is partition evidence on a shared host,
  without frequency pinning or a whole-host isolation claim. Initial Windows
  free space114GiB; owned container idle before and after the batch.
- Public bootstrap SHA256
  `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`.
  `env -u TOWER_BOOTSTRAP_COMPILER cmake --build /cache/native --parallel 6
  --target tower-frontend-units-profile` reported **no work**. Cached public
  predecessor path, compiler jobs1, full CMake flags and Ninja graph retained.
  No leaf build, compiler generation or private predecessor override.
- Frozen measured profile SHA256
  `f092a2aa9ef57e926f201c863f41405f5b0b4ba279d17827410130d0d413e3b5`.
  Profile source SHA256
  `3fa3430df1c23811837197288e5a5bc58660267175c81c5b70514238cea4d779`
  equals B2's actual fixture, including its then-uncommitted uniform-mode delta.

Read the original [within-unit receipt](compiler_within_unit_e0e3530b.md) and
[uniform scaling receipt](compiler_core_acceptance_56c892c1.md) before dispatch.
Use their actual three workloads: **1x16, 1x4096, and12x256 bodies each**. All
use `dependencies uniform`, pointer width8, backend0, optimized0. Every unit
includes the same forward/type/decltype/generic/comptime dependency helper and
ordinary loop bodies. The asymmetric four-world shape is not used.

```sh
/cache/uniform_3ad7d5f0/profile /cache/uniform_3ad7d5f0/input \
  UNITS WORKERS BODIES dependencies uniform [grammar] artifacts DIRECTORY
```

Fresh processes/worlds, warm filesystem, no persistent grammar cache; n2 at
workers1/4/8/12. First round: small/single/multi, ascending widths. Second:
multi/single/small, descending widths. No warmup compilation or discarded timed
sample. All24 timed runs omit `grammar`; the existing outer boundary clocks
remain, exactly as in B2's profiler. Six separate diagnostic controls enable
`grammar` at workers1/12 for each workload. They alone support inner-thread and
phase attribution, not the throughput medians. Timing excludes reference
execution, canonical formatting, artifact writes and owner destruction; external
whole-process wall/user/system/RSS is also retained for every command.

## Checked throughput

n2 medians (midpoint of the two observations), seconds and MiB. RSS is process
peak through the timed compilation. Ratios compare the identical workload only.

| Workload | Workers | Wall | CPU | Peak RSS | Serial/wall |
| --- | ---: | ---: | ---: | ---: | ---: |
|1x16|1|0.4118|0.3735|173.33|1.000|
|1x16|4|0.4713|0.4777|177.32|0.874|
|1x16|8|0.4760|0.4863|176.52|0.865|
|1x16|12|0.4773|0.4891|176.51|0.863|
|1x4096|1|2.2666|2.2298|793.42|1.000|
|1x4096|4|1.9890|2.7114|797.90|1.140|
|1x4096|8|1.9823|3.2444|796.40|1.143|
|1x4096|12|1.9679|3.7524|796.87|1.152|
|12x256|1|5.8353|5.4881|816.93|1.000|
|12x256|4|4.3181|13.9048|1101.91|1.351|
|12x256|8|4.5545|22.0804|1491.82|1.281|
|12x256|12|4.7984|39.3634|1857.48|1.216|

Single-unit serial observations are2.3734/2.1597s; retain that variation. Its
four/eight/twelve-worker medians differ by only21ms, so this does not establish
a uniquely optimal width. Multi-unit four-worker observations are4.2545/4.3816s,
versus serial5.8176/5.8529s and twelve4.7972/4.7997s. Small serial is
0.4194/0.4041s; every parallel sample is slower.

External whole-process median wall/CPU: small1/12 =0.47/0.53s and0.400/0.520s;
single1/12 =2.705/2.440s and2.605/4.175s; multi1/4/12 =6.370/4.930/5.470s
and5.925/14.410/39.925s. These include checks/formatting/cleanup and are not the
frontend throughput numbers above. Multi12 system CPU is23.935s median, versus
0.440s serial; voluntary switches exceed1.10million per timed sample versus
about2330 serial. This establishes substantial synchronization/OS cost, not the
identity of a lock or proof that all system time is avoidable.

### Relation to prior source-bound measurements

Generated source, dependency helper and complete canonical bytes match B2's
retained references **for every unit in every run**. Input/runtime flags match;
compiler identities and CPU partitions differ. Since56c892c1 there are14 changed
compiler files, including published semantic/body/admission repairs as well as
B1 reuse. The original fixture-only delta has the exact matching hash above.
Consequently these are historical comparisons, **not an isolated causal A/B of
54f3baab**, and the previous matched serial receipt remains unchanged.

| Same workload/width | B2 prior wall | Current wall | Observation |
| --- | ---: | ---: | --- |
|1x16/1|0.4594 (n1)|0.4118|10.4% lower|
|1x4096/1|2.1888 (n3)|2.2666|3.6% higher; current serial spread retained|
|1x4096/8|1.9856 (n3)|1.9823|essentially unchanged|
|12x256/1|6.5253 (n3)|5.8353|10.6% lower|
|12x256/4|5.5206 (n3)|4.3181|21.8% lower|
|12x256/12|6.1868 (n1)|4.7984|22.4% lower|

Best measured multi-unit scaling rises from1.182x to1.351x. Useful improvement
is visible across units, but this does not establish profitable twelve-core use.
The earlier C-like16/1000-function CLI and Clang controls have different sources,
backend work and timing boundaries; no C ratio is computed from this frontend
fixture. No new object/executable-output claim is made.

## Separate phase and overlap controls

One diagnostic run at each endpoint. Phase times nest/overlap and must not be
added. Grammar events include baseline preparation outside `FrontendParse`;
they are not wholly nested in that phase. Multi-unit wall is a sum across
concurrent units, not elapsed critical-path time.

| Workload | Phase | Workers1 wall/CPU ms | Workers12 wall/CPU ms |
| --- | --- | ---: | ---: |
|1x16|Grammar build|302.8/297.7|364.0/326.9|
|1x16|Frontend parse|295.2/273.4|349.7/302.2|
|1x4096|Grammar build|292.0/291.3|373.7/335.1|
|1x4096|LR table|206.6/206.5|276.8/238.8|
|1x4096|Frontend parse|574.1/556.7|660.3/610.8|
|1x4096|Semantic run|838.5/826.9|546.4/529.1|
|1x4096|Body discovery|160.5/154.0|32.3/30.7|
|1x4096|Body wave|292.4/292.2|143.8/138.1|
|1x4096|Known values|138.7/138.7|134.3/129.5|
|1x4096|Lifecycle|431.3/431.3|431.8/400.0|
|1x4096|Lowering, inside lifecycle|397.2/397.1|376.2/344.7|
|12x256|Grammar build aggregate|3581.6/3579.4|31781.7/22221.1|
|12x256|LR table aggregate|2480.5/2478.6|17101.3/12314.5|
|12x256|Frontend parse aggregate|3805.7/3599.6|33335.2/23111.8|
|12x256|Semantic run aggregate|391.7/388.1|1682.5/1444.7|

Every world builds117 tables and records127 structure reuses, versus B2's
183/61. Version builds remain239 per world. The reduction in real LR construction
confirms reuse reaches the uniform workload; it is not by itself a speedup claim.
Across twelve worlds, aggregate grammar-build CPU is still22.22s of38.58s process
CPU at width12, versus3.58s of5.41s serial. Per-world isolation and ordered
activation remain; no entity/table is shared across worlds.

Actual distinct simultaneous semantic threads reach12 inside the large single
unit (body, declaration, known and lowering kernels). Twelve uniform outer unit
spans overlap on12 distinct threads. Their local semantic peak is1 because
outer grants already occupy the shared budget; summing the peaks would double
count. All measured shared peaks stay within the requested width.

| Diagnostic workload | Workers | Dispatch wall ms | Admitted lane-ms | Executing interval occupancy | No kernel ms | Collector ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
|1x4096|1|743.08|743.08|99.74%|1.90|8.01|
|1x4096|12|250.16|2946.26|84.83%|15.03|9.44|
|12x256|1|342.85|342.85|99.15%|2.92|6.81|
|12x256|12|2059.86|2059.86|99.71%|6.03|10.11|

The large single-unit width12 control has447.09 unoccupied admitted lane-ms,
including tail imbalance/transport, and admission costs1.38ms. Outer-ready
vacancy at multi12 is1.415lane-ms, with all inputs initially ready. Across timed
multi samples the largest vacancy is1.827lane-ms and refill maximum0.149ms.
These upper bounds can include legitimate nested occupancy and publication.
They do not demonstrate a ready-work starvation or batch-barrier defect.
The small unit's semantic occupancy is only31.91% at12, but that dispatch totals
8.46ms; it cannot explain the larger grammar/parse overhead. No grain change.

**Finite next producer:** admission-aware selection in
`lr_states_lalr_parallel_result`. Current code selects item-graph preparation
from nominal `compiler_worker_capacity`, before solve/actions obtain extra
lanes. Multi12 builds852 item graphs (1274.95ms aggregate CPU) but dispatches
zero propagation/action waves. Solve/actions then use their existing inline
fallback. A candidate would select the existing serial preparation using a
properly held admission contract before constructing worker-only state, retaining
range fallback, first errors and ownership. An unsynchronized availability peek
is not that contract. This is the most concrete avoidable preparation identified
here, not a new LR algorithm or scheduler. Its graph setup is only part of the
remaining cost; the counters do not predict net savings or identify a particular
allocator/lock. No plainly demonstrated small scheduling repair justifies a
production edit in this measurement batch.

Subsequent [bounded admission trial](compiler_lr_admission_902f7c4d.md) corrects
the proposed graph-saving attribution above: the existing serial preparation
also constructs the same item graph. `LookaheadGraph` observes only the parallel
wrapper, so selecting serial can remove the event without removing construction.
The held-receipt candidate passed correctness but was rejected on measurements;
the original code was restored. The earlier1.275s observation remains valid for
that wrapper, but is not evidence of removable graph work.

## Ownership and correctness

All30 runs pass independent ordinary interpreter results `answer()==42` and
`body_0(36)==42` for every unit, complete prior canonical/source `cmp`, and
checked nonfailed compilation. No failed diagnostics or skipped mode is called
passed. Reference hashes remain:

| Bodies | Source SHA256 | Canonical Foundation SHA256 |
| --- | --- | --- |
|16|d74504966bd4570b94f619db589647288c70d5fa99bf4694f31f7751166b45b3|5a75ae4154714f9a84397c4e3fef46c4cbb9cf1639b3e53063f84267e79b4c6f|
|4096|60ffa29256c9463c899ffc907d9bedd9fe1611f9c8f1a406c1eb5c4dd2a5a2a9|9c0daad4b6b7d0d94eeb27c99fe30c27e37cee1cabc3555c7db83a67278d0039|
|256|084941739f90daa7ad231edb376526a341c9fa750e734e24ee46580d94c93468|a350599c7f87acc4a940511e6d61a5369ce28acf6f311ff825a4052c4a844860|

Imported helper SHA256
`f5643e359d8a130f384db6b9ff20a7287d36328e9fc5c39dd41b175db364d1a7`.
All twelve unit source/canonical files are identical within the uniform workload.

Post-join lanes are zero in all runs. Retained bytes before owner destruction:
small20,180,309-20,183,133; single566,920,458-566,923,282;
multi633,076,515-633,110,235. Serial retention versus B2 increases88,404bytes
for the single-world inputs and1,060,716bytes total across twelve worlds
(about88,393bytes/world). Peak charged bytes remain below107.48MB/656.52MB/1578.57MB for
small/single/multi, within1.25GiB/1.25GiB/4GiB explicit budgets. Ledger storage
is separately10MiB/80MiB and80-160MiB. Live preclose grants own results; they
are not allocation-call counts or leaks. Production allocation counts unavailable.

Every successful exit runs the existing deferred `frontend_units_close`, draining
workers and destroying pools/worlds/results before `work_budget_dispose` requires
zero live grants. Thus cleanup is checked, not inferred from RSS. RSS also includes
foreign allocator, threads and other uncharged system storage. Original finite
budget/cancellation/error-order gates from the unchanged75c15ee7 inputs remain
their prior evidence; this task does not relabel them as new stress/sanitizer runs.

Raw source snapshot, original manifests, binary, generated files, JSON, empty
diagnostic stderr, command lines and process times remain in
`build/ecs_b1/cache/uniform_3ad7d5f0` (`/cache/uniform_3ad7d5f0`). Concise handoff:
`C:/Sandbox/build/codex_ecs_20261122/B1/uniform_3ad7d5f0`. OS shell files only
transport the existing Tower profiler. No failed compiler/test sample occurred.
Initial inspection wildcard/missing-file errors and an oversized report parse
were tooling errors, corrected without rerunning any sample. No generation,
browser, sanitizer, public pin or hosted deployment; ROOT owns final acceptance.

Publication reconciliation: receipt `2ed6d839` merged complete published
`d55d1c0d` history at `14a03cf4a898123abad2c46b6055262009ab3ed6` after the
required ff-only pull refused divergence. Both journal histories survive.
Incoming L2 formatter/reconstruction changes and D1 review are outside the
measured freeze. The profile source and receipt are unchanged; all frozen
resource bytes were rechecked against the original expected hashes, and the
measured executable is unchanged. This source-bound documentation does not
claim those later compiler inputs passed these timings or rebuild them.
