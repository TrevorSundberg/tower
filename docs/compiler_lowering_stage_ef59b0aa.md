# Lowering stage allocation attribution

The first amplified measured subpath is the shared byte-admission call used for
a new entity's component-pointer list. It belongs to B1's current WorkBudget
attribution scope. No local lowering optimization was demonstrated, so this task
ships evidence only. All temporary probes are restored, including the cached
profile executable, and the earlier fast-append candidate remains rejected.

## Freeze and baseline

Published source `ef59b0aa2400676a2f76ea20588e3e273a7bbba3`; Linux6.18 WSL2,
LLVM19.1.1 Release, public768 bootstrap; B2 CPU12–23/quota12/24GiB, compilerjobs1,
outer buildjobs6, owned `/cache/native`. Container idle before work;923GiB cache/
112GiB host free. The initial pull's DNS failure was recovered with a freshly
resolved per-command address and unchanged HTTPS validation. Accepted b8 browser
package/receipts remain untouched; no browser run or deployment.

Used the existing `tower-frontend-units-profile` generator, one unit,16/4096
ordinary loop bodies with `decltype`, imported generic/type/comptime and untaken
dependency controls. Width8, same source/resources/flags across worker counts;
production allocator, fresh worlds, warm filesystem. One warmup and one baseline
sample per combination; no scaling sweep or optimization claim. The profile
times compilation before reference execution/formatting/artifact writing.

| Bodies | Workers | Wall s | CPU s | Peak RSS KiB |
| --- | ---: | ---: | ---: | ---: |
|16|1|0.357359|0.355897|177876|
|16|4|0.431233|0.472183|180856|
|4096|1|1.987156|1.985475|812672|
|4096|4|1.940013|2.700806|816624|

Separate existing coarse observations retain4105 lowering kernels, real peaks1/4,
and summed lowering CPU117.553/317.013ms, or2.70×. No queue-width inference.
Retained charged bytes are20183153/20180329 small and566923302/566920478 large;
large peak656513170/656475698 bytes, below1342177280. Ledger storage is separately
10485760/83886080 bytes for small/large. These charges are not aggregate RSS.

## One sparse diagnostic control

Temporary Tower code samples function ordinals divisible by128, independent of
worker assignment. Each result owns its counters; its stage borrows the probe
only during that kernel. Collection uses the existing world observer after join.
No shared unsynchronized counters, changed scheduling, skipped allocation charge
or extra pool. All135194 generated nodes are counted through their owning stages;
timing covers only1056 nodes in33 selected kernels, about0.78% of node operations.
The fine probe makes16896 clock calls, not a clock pair on every generated node.

The selected paths time stage creation, complete semantic attachment, payload
allocation and component-list allocation. The existing WorkBuffer resize body
temporarily accepts an optional private probe: reservation and physical heap
allocation are separated without replacing either operation. Nothing changes
the admission result, byte charge, allocator or ownership transfer.

| Same1056 sampled nodes | Serial CPU ms | Four-worker CPU ms | Serial wall ms | Four-worker wall ms |
| --- | ---: | ---: | ---: | ---: |
| Stage entity creation |0.874489|1.440467|0.877392|1.525370|
| Complete semantic attachment |3.573878|5.191415|3.547183|5.685903|
| Payload allocation, inside attachment |0.664801|0.813793|0.676558|0.827590|
| Component-list budget reservation, inside attachment |0.511376|1.448382|0.522526|1.908984|
| Component-list physical heap allocation, inside attachment |0.579928|0.707038|0.588811|0.758746|

Every selected node makes exactly one component-list allocation:1056 requests,
109824 requested bytes,104 each. Reservation CPU grows2.83× and wall3.65×;
physical allocation and payload allocation CPU each grow about1.22×. The
reservation interval accounts for about58% of the sampled attachment CPU
increase. These are nested diagnostic intervals, not additive production phase
percentages or a prediction of attainable speedup.

Both widths create135194 nodes and identical private storage:

| Storage | Pages | Slots | Live slots | Occupancy |
| --- | ---: | ---: | ---: | ---: |
| Entity descriptors |8198|139366|135194|97.0%|
| Component payloads |4102|164080|135194|82.4%|

No duplicated node creation or different page occupancy explains the increase.
Existing private pages already amortize descriptor/payload allocation; no severe
unused-capacity problem is evident in these particular pages. This is not a
whole-world fragmentation or hardware cache-miss measurement. Scratch/name work
was not re-tuned, and aggregate/defer-heavy workloads were not represented by
this scalar loop fixture.

Instrumentation remains intrusive despite sparse clocks: serial coarse lowering
CPU rises117.553→191.503ms, parallel317.013→352.306ms. Optional-wrapper calls,
larger result records and page census also perturb execution. The diagnostic
end-to-end costs are2.197070s/2.189850CPU/813212KiB and
1.983574s/2.786189CPU/818824KiB. Absolute diagnostic times must not be extrapolated
to production; no fine-probe time is labeled a production percentage.

## Concrete handoff, decision and limitations

The measured chain is:
`sem_control_node` → `sem_node_result`/`sem_attach_result` →
`entity_component_add_result` → `entity_reserve_components` →
`entity_buffer_resize_result` → `work_buffer_resize` →
`work_budget_reserve_result`.

A new entity starts with an empty component list. Its first attachment reserves
the existing four-pointer capacity through a standalone checked WorkBuffer,
separate from the private descriptor/payload pages. The exact measured1056
allocations agree with that source path. Applying one such first-list allocation
to all135194 new nodes is a source-based inference, not an independent global
allocation counter.

The timed reservation includes the shared gate, ledger slot/generation updates
and occasional ledger-vector growth. It does **not** identify gate waiting versus
critical-section work/cache-line traffic, nor prove that this explains the entire
2.70× kernel amplification. B1's next precise boundary is gate acquisition versus
`work_budget_reserve_locked` on this same frozen workload. No synchronization
implementation is duplicated here. A private component-index allocation change
would also need a checked release/ownership contract; this sample does not
establish its net benefit. No local production candidate is shipped.

## Checks, failures and restoration

All baseline, diagnostic and restoration runs pass the profile's independent
known outputs42/42 and resource cleanup checks. Complete generated source,
imported source and canonical Foundation match across workers1/4 and probes.
No expected diagnostic was changed. There is no accepted runtime candidate, so
no new body/alias/defer/error-cleanup suite, optimized-object comparison,
sanitizer, Node, browser or generation matrix is claimed.

Two diagnostic build errors are retained: an opaque-stage foreign declaration
mismatch and a nominal clock-argument mismatch. After owned jobs drained, only
the temporary declarations were made consistent; the final diagnostic target
build passed. No service-rejected operation was retried.

Only the ten probe files were restored from the freeze, after preserving their
patch and source archive. The dependency-aware restoration rebuild produces the
**exact baseline executable bytes**. Restored small serial and large four-worker
checks pass full artifact equality, but their times were0.646078s/0.644714CPU/
177816KiB and3.199438s/4.527355CPU/817596KiB. This later variation has identical
binary/input identities; its host cause was not measured. It is retained, not
treated as a source regression or grounds for another tuning loop.

Build costs wall/CPU/peakRSS: baseline14actions29.477s/73.815s/1074652KiB;
first diagnostic failure32.660s/82.545s/1075500KiB; declaration-repair failure
7.853s/22.177s/441152KiB; final2actions3.830s/2.612s/278036KiB;
restoration22actions37.649s/114.708s/1074316KiB. No public-leaf/full-build pair.

Evidence: `C:/Sandbox/build/codex_ecs_20261122/B2/lowering_stage_ef59b0aa` and
`/cache/lowering_stage_ef59b0aa`, with commands, exact sources/inputs/canonical
outputs, binaries, sparse probe patch, failures and all measurements.

| Artifact | SHA256 |
| --- | --- |
| Frozen source archive | `01fbbf81a510f057fa8995cf4f17deb0272283c7537cf17e4f5480e2c020199e` |
| Baseline and restored executable | `486996f61cc242fb7c61e6477949729a38f1b42ff3ff5a32d1c135bfc6bb2b77` |
| Diagnostic executable | `c004a7cee83b7a9349f975fb76d8f879358b69209079e982fb1d88529f5da657` |
| Preserved probe patch | `655b50408b54b60beee70342bb828a12485fa594a0ed88bd312cd29084830f31` |
|4096-body source| `60ffa29256c9463c899ffc907d9bedd9fe1611f9c8f1a406c1eb5c4dd2a5a2a9` |
|4096-body canonical| `79b43b59b1adabbbc407fafd674ab534f33ddf70fe72c5ae4c529a010e1879ce` |

All owned jobs drained. ROOT retains current runtime/release ownership; B1 owns
the common-budget follow-up. The previous lowering rejection and accepted b8
browser package identities remain intact.
