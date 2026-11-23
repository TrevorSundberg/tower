# Sorted LR suffix seed batching: rejected

The candidate passes correctness and ownership checks but fails the useful
end-to-end latency gate. Production sources are restored and **all four rebuilt
executables match the original bytes**. The accepted gate, Entity storage and
grammar reuse remain intact; no bulk-seeding API or test hook ships.

## Frozen boundary and selection

Source `8ff77438c507ee8667eaccd181abe7d417bf6745`, tree
`d7a4c54892878cd6d6d98141525c198b812c025a`; source manifest SHA256
`4476a1d180a351f143ff497737cbfd99337252c35f25f8dae58491e88824f9bf`.
The required pull was documentation-only. Existing binaries were preserved
before refreshing the current dependency targets. No source changed during
builds or measurements.

B1 `tower_ecs_b1`, CPU0-11/24GiB, Linux6.18.33.2 WSL2, Clang/LLVM19.1.1,
native x64 Release, compiler jobs1/build jobs6, production allocator. Public
bootstrap768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138,
environment override unset. Fresh processes/worlds and warm filesystem, shared
host without frequency isolation. Initial/final free disk111GiB; owned jobs
drained before edits. Old receipts and binaries remain unchanged.

Read the rejected [exact-range bitmap](lr_range_membership_415a54e9.md),
[closure scratch](lr_closure_scratch_e7558fa8.md) and
[admission](compiler_lr_admission_902f7c4d.md) receipts, plus the retained
frontier-order profile/patch in `serial_remaining_1272`. None was retried.
The accepted [joined observer](compiler_joined_gate_entity_cabc2062.md) places
263.10ms in tables, including63.60ms item-graph preparation and60.31ms solving
on its separate large12 observation. Those are prior, different-input clocks.

Inspection of `lr_states_propagation_items_result` found a concrete repeated
operation: each immutable sorted suffix-FIRST set is inserted one exact range
at a time into every destination production. One temporary Tower counter run of
the existing cold observer measured **3,787,107 seed-range visits**,1,232,914
destination batches,619,969 with multiple ranges, across117 item graphs.
Counters were local to each construction and printed once per completed graph;
there were no per-operation clocks, global shared counters or worker mutation.
Its instrumented timings/allocation totals are attribution only. The counter
source/patch/log are preserved and the hook was removed before timed builds.

## Candidate contract

Four files changed only in the preserved rejected patch: `lr_analysis.tower`,
`lr_lalr.tower`, and their API/failure fixtures. A small bulk-seed helper borrowed
a sorted unique range span with explicit count and reused
`lr_range_merge_result`. It reserved before changing destination length or
queue state, returned exact Invalid/Memory and retained no source pointer.

The item-graph builder split the immutable suffix around propagation markers
once per item. Ordinary spans merged once per destination; each marker still
created its original edge between the same spans. Nullable edges stayed first.
The destination queues only on its first newly added range, so source/destination
queue order and duplicate edge order remain unchanged. Overlapping ranges are
distinct exact pairs, never numeric interval unions. The original LIFO solver,
range fallback, FIRST producer, activation, identity, version and worker policy
were untouched.

The borrow expires synchronously before dispatch and graph publication. Analysis
and graph are private construction owners; no cross-world entity pointers,
cache, new allocator or additional retained storage was introduced. Existing
graph vectors remain ordinary derived allocations; this trial does not pretend
to migrate them into WorkBudget. Existing explicit scratch/table grants and their
first-cause cleanup remain in place. A denied bulk seed leaves its destination
unchanged and permits direct retry.

Rejected patch SHA256:
`f7e29e2ba5cdd3e1ffc621647ec65b2c309d8491ddb547d3d436b942a8a4383e`.
Candidate source manifest:
`da3d38f271e64b289b64d493daf78c0f9cc4d8aacb1d879a04eaf62448463ff3`.

## Matched results

Existing frozen16/1000-function Tower/C fixtures, identical paths/flags for
before and candidate. Native Tower command: `--jobs 1|4 --emit object --target
x86_64-pc-linux-gnu`, explicit frozen Bedrock/Foundation; default optimization
enabled. One4096-body dependency unit uses `dependencies uniform`,
pointer8/revision81/profile19, frontend-only backend0/optimized0, same original
generated sources/helper. Resources are copied unchanged into
`/cache/table_seed_8ff77438/input`; this path is one byte shorter than the prior
joined receipt's root. Both current sides use it, explaining the one-byte
retention difference from that prior receipt; old timings are not relabeled.

n2 opposite-order rounds at1/4, with no discarded sample or compilation warmup.
No8/12 sweep: grain, dispatch and admission are unchanged. Below are midpoint
wall/CPU seconds and process peak RSS KiB. CLI timing covers object compilation;
linking/execution are separately checked, outside the compilation clock.

|CLI input/workers|Wall before → candidate|CPU before → candidate|RSS before → candidate|
|---|---:|---:|---:|
|16 /1|0.420 →0.430|0.350 →0.365|177308 →177732|
|1000 /1|0.560 →0.570|0.490 →0.495|218342 →218842|
|16 /4|0.475 →0.480|0.435 →0.435|179404 →179940|
|1000 /4|0.600 →0.620|0.570 →0.580|222818 →222886|

Both serial rounds have the same wall values above. Four-worker large is
0.59/0.61 before and0.61/0.63 candidate. Small four-worker differences are near
the timer's0.01s reporting resolution; they are not hidden or claimed beneficial.

|4096-body dependency unit|Inner wall|Inner CPU|Peak RSS|
|---|---:|---:|---:|
|1 worker|2.0604 →1.9761|2.0173 →1.9344|733656 →734102|
|4 workers|1.8464 →1.9117|2.4842 →2.5566|738722 →739392|

Serial improvement is real in the observed pair:2.0689/2.0519 before versus
1.9833/1.9688 candidate (-4.1% midpoint). Preserve it alongside the four-worker
regression (+3.5%):1.8333/1.8595 versus1.8637/1.9598. These mixed results do not
establish a general table-construction win. No mechanism is asserted for the
serial unit improvement outside the separately measured table boundary.

Whole-process4096 wall/CPU is2.435/2.350 →2.345/2.265 serial and
2.240/2.835 →2.305/2.905 at4, including reference interpretation, formatting,
artifact writes and teardown. Whole-process RSS equals the listed high-water.

All16 Tower objects match the current before reference byte-for-byte; all16
linked executions print exact15/999. Four Clang controls use
`clang-19 --target=x86_64-pc-linux-gnu -O2 -fwrapv -c` on the original corresponding
C inputs, then link/execute exact15/999. Small wall0.04/0.03s, CPU0.01/0.02s,
RSS99288/99200KiB; large0.08/0.08s, CPU0.07/0.06s,RSS109972/109296KiB.
The current serial compile gap remains substantial. These are the existing
C-like fixture controls, not identical language/import/checking work or a
general cross-language superiority claim.

## Cold/installed allocation and lifetime observations

Existing single cold and preinstalled observers, separate from n2 throughput:

|Boundary|Before|Candidate|
|---|---:|---:|
|Cold table time,115 builds|205.73ms|210.61ms|
|Cold lookahead,117 calls, included in tables|124.28ms|130.26ms|
|Installed request table time,63 builds|174.94ms|176.31ms|
|Installed request lookahead,63 calls|112.83ms|114.45ms|
|Cold allocation calls|1,947,816|1,842,552|
|Installed allocation calls|2,064,545|1,959,279|

Cold allocations drop105,264 (5.4%) and installed105,266 (5.1%); that is not
latency acceptance. Cold whole-process wall/CPU remains0.39/0.33s; installed
0.43/0.36s. RSS160860→160940KiB cold,163796→164252KiB installed. The installed
initialization phase is reported separately in the raw logs, not silently added
to the request table time or mixed with nested phases.

Canonical observer output stays960 bytes/hash12359216075843495177. Charged
live/peak/ledger metadata remain1,965,224/58,721,312/5,242,880 bytes cold and
1,981,656/58,737,744/5,242,880 installed. Retained buffers stay26,561/35,286.
Both observers require zero grants/buffer owners after destruction.

The4096 unit retains521,369,964 bytes/432,300 grants serial and
521,367,140/432,301 at4 on both sides; ledger40MiB. Peak admitted bytes stay
about603,662,918→603,662,846 serial and603,625,206→603,625,118 at4, well below
the unchanged1.25GiB limit. Every run has bounded peak lanes, zero lanes at join
and successful zero-live-grant budget disposal after owner teardown. These
charged payload/metadata values are distinct from RSS and foreign allocations.

## Checks, restoration and remaining cost

Candidate checks pass without assertion changes:
- New focused bulk seeding: exact sorted equal-start/overlap identities, immutable
  borrowed inputs, explicit span bounds, first physical Memory denial, unchanged
  destination and direct retry, allocation-free subset and complete cleanup.
- Existing `lr-order`: storage failures, Capacity/retry lifetime controls and
  independent150-grammar closure/state/action/propagation oracle.
- `grammar-equivalence`, `structure-reuse`, `grammar-resource`, `parser`,
  `regex`, and native `tower-lr-work-tests ... lr`: nullable/recursive/empty
  FIRST, range fallback, seed/revision/world/override identities, deterministic
  actions, cancellation, native overlap/shared budget and cleanup.
- All8 dependency-unit outputs pass42/42 and complete canonical/source file
  comparisons; generated Tower/helper sources match the original uniform input.

No compiler/test failure was hidden. Incorrect read-only path/wildcard lookups
were corrected before using their results. The failed gate is performance.
No owner-specific A2 observer/semantic storage method was edited.

One dependency batch per required variant, no duplicate leaf compilation:
baseline6 actions13.64wall/18.68CPU/667232KiB; candidate6 actions21.76/25.63/
924928; restoration6 actions21.72/25.42/921100. A separate counter-only provider
build and cold observation supply attribution, not throughput. Restored source
timestamps were advanced before rebuilding; full source manifest and all four
binary comparisons pass.

|Executable|Original/restored SHA256|Rejected candidate SHA256|
|---|---|---|
|towerc|b7d399ee69fbcc3fa661ed0e25756eebb1317b77004a0f10d70cfe5c2a4a1949|a66cbc325c2da013ee2cd86d03a46a5b92e0dd86b545dbde7b2142236e561aec|
|frontend tests|37fd93d0c0b0537b3e7ad4bcaae1c675fcdf74d0fafbe6148f5add1394e724b2|a1145732cca3a88dd47d9799003b797ba15300bf8dde980489c2ac8715fa3eda|
|LR tests|b1605b94512c130400ed96a9484dddbf6eff0174cfd83ddff2e221d9a6c5c705|9feacceecb4b24a3000432a65e2b69b888cf29eceecd59d83d3db61194c85920|
|units profile|e8398c4a0389522b8ee42a6ddd0cae33ac9241a6a679ba61b4f13cd6e764249c|7ab564d95b601cf206b769a9d19add1b14560044616884ca9106e275123a4a50|

Remaining measured cold table cost is primarily the lookahead boundary:
124.28ms of205.73ms, covering item-graph construction, exact-set propagation and
actions. Bulk seeding did not remove its dominant latency. The unresolved
dependency is how to reduce that exact fixed-point/preparation work without
changing activation/range identity/order or adding more setup than it saves.
Fewer seed searches/allocations alone are insufficient evidence. No second
candidate, scheduler rewrite, bitmap/frontier retry or tuning sweep follows.

Raw freeze, counter/rejected sources, original/candidate binaries, all logs and
objects: `build/ecs_b1/cache/table_seed_8ff77438`. Scripts
`table_seed_{freeze,samples,restore}.sh` retain commands. Concise handoff:
`C:/Sandbox/build/codex_ecs_20261122/B1/table_seed_8ff77438`.
No todo/public pin change, full native generation, browser, sanitizer or hosted
deployment claim. ROOT retains integrated release ownership.
