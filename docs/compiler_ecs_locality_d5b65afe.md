# Bounded ECS locality and fragmentation receipt

A2, 2026-11-23. Frozen published source
`d5b65afee426f2576d44a60f44249010a15ace1d`.

**Decision:** retain stable payload pages plus dense pointer indexes for the measured
1,024/2,048/65,536-owner workloads. Indexed scans are substantially cheaper than
per-owner lookup; refill preserves live addresses and reuses payload pages.
There is no measured production consumer here that justifies authoritative packed
payloads. This accepts the measured storage trade-off, not whole-compiler locality,
packed ECS storage, universal scaling or final instrumentation.

The concrete remaining compiler-locality requirement is a normal-allocator census
at real parser/body/import phase boundaries: component size, live slots/retained
pages, descriptor/index bytes and repeated scan counts for the same frozen world.
It must show whether the adverse one-survivor-per-page case actually persists and
whether a named consumer can amortize packing. These existing fixtures establish
the costs and bounds below; they cannot establish that lifetime distribution.

## Inputs, method and preservation

KinmenA Windows11/WSL2 Linux6.18.54.1, AMD Ryzen AI MAX+395,16 cores/32 threads,
32MiB shared L3. Own Docker image `tower_build:latest`
(`ba707de6a29fd47e22b186ce711f82e51146fd0d38f7c557dadaf77f7e087156`), CPU0-11
**logical CPUs**,24GiB, network-none, one build/run owner. Siblings use other CPU
ranges but still share host memory/cache/frequency resources. No frequency lock,
cache flush, hardware cache-miss/NUMA/false-sharing counter or process-tree RSS
measurement. Fresh processes on warm host caches; first scans follow allocation
and planning and are not cold-cache experiments.

Existing production-allocator fixtures only; no fixture/production/build-manifest
edit, fault injection or sanitizer invocation. Named path-limited stash
`37894097de0fd0465c75e1e5097c10f6d96c7643` preserves only the unfinished
`frontend_modules.tower` (+1) and `storage_main.tower` (+8) edits. It is retained,
unapplied and unpublished; todo was excluded. No A2 child was active initially.
The separate service-blocked sanitizer gate remains OPEN. The accepted static
package review retains its exact b0/252b/2013 boundaries.

Public compiler SHA256
`768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`,
LLVM/Clang19.1.1, native x86_64-pc-linux-gnu. One incremental CMake target
`tower-entity-locality-tests` in the existing `/cache/native`, Release,
`TOWER_SANITIZER=` empty, jobs2/compiler1:5 actions,3.792s wall/5.116s CPU,
259248KiB peak. It uses direct public object emission. The already-existing node
profile has no CMake target: its prior ordinary direct recipe was reused once
(public `--library --emit llvm --jobs 1`, Clang19 `-O1`, existing
`guest-work-tests.o`, pthread/dl and exported `work_thread_entry`). That compile
cost2.769s/2.428s/294668KiB. No duplicate node or compiler rebuild occurred.
The differing fixture lowering paths are explicit; compare variants within each
fixture, not their absolute timing against one another.

Receipt collection initially used the nonexistent `guest-work-tests.ll.d` name
and exited1 **after both successful builds**. Original `build.log/status1` remain;
metadata continuation used the existing `guest-work-tests.d` with no rebuild.
`run.status0` covers31 checked ordinary processes:3 four-path traversal samples,
4 homogeneous/mixed order-counterbalanced layout samples, and24 node samples
(3 repetitions of2 sizes x2 shapes x1/4 workers, reverse worker order on repeat2).
Each process had a60s bound; no timeout, failing reference or skipped case.

All32 actual depfile source inputs stayed unchanged through the run. They also
match the earlier physical-accounting source `42c1e142`; that census/ownership
contract is reused. The public compiler changed since earlier performance
receipts, so old timings are not relabeled as a matched before/after optimization.
The paired baselines below are current direct/indexed/packed paths on identical
values, and serial/parallel creation of the same eight ordered subtrees.

Raw logs, every output/exit, original failure, depfiles, commands, host and hashes:
`C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/locality_d5b65afe`.

| Identity | SHA256 |
| --- | --- |
|32-input manifest | `1431ca39a9895eb2049ea215b323b482b9c8037d428b908602d42aadf1b7b9e2` |
| Artifact manifest | `28c67352191ce87d02b123bc228ce2c3d7d704a4824a3defaf25edb90fe3e208` |
|31-case status CSV | `c9c83865a9f381a62fffdf4e33feb120571cd5f36537f1ce6a478efcf8afc064` |
| Locality executable | `645bd4ec64103449c12454f84ce47c8324a5f0d402c82ee67a1022384f978bf1` |
| Node executable | `0aa8197d1698c31db110f4c26a70793816b8478dfc717098c357a2d09757baca` |
| Reused normal guest runtime object | `f74001da316e6d14af4f699033e8239ee70a3f597ce442675c63737f225459ff` |

## Actual storage and borrowing contract

`EntityTable.rows` and its per-kind columns occupy one geometric-capacity index
buffer. Each column element is an `EntityComponent*`, followed by a load of
`component.data`; these are dense pointers, not packed component values.
`entity_view_query` borrows the kind's dense instance-pointer range.
`entity_view_tables_result` caches matching table ranges/column offsets in the
view. Direct `entity_component_get` also loads the owner's table and searches
its type IDs. Published query/table order is not source/effect order.

`entity_storage_allocate` uses separate kind/stride-tagged payload pages and
nonsemantic size-class descriptor pages. Payload pages cap at64 slots/16KiB;
descriptor pages at32 slots/4KiB, with actual capacity derived from stride plus
component metadata. Oversized objects use individual owners. For this32B record,
64 live values occupy a40B stride (8B back-reference between payloads), with
separate48B component descriptors: adjacent values are not adjacent32B records.
A complete page requests5863B including headers/alignment; only2048B is live
value data. Entity descriptors are184B here. Independently replaceable
child/component/instance/table indexes carry their own buffer receipts.

Workers allocate canonical nodes in private stage pools. Joins precede held
references, view closure and source-order publication; full and partial pages
transfer their physical owners to the world without moving data. Dead slots
are reused; an empty page is released, but one surviving slot pins its page.
Views postpone structural reclamation; they do not authorize payload mutation or
establish non-aliasing. Finalizers, source owners, leases and joined jobs retain
their existing contracts; no address compaction or new ownership policy is proposed.

These choices use the separation between staged structural mutation and active
iteration described by [Flecs Systems](https://www.flecs.dev/flecs/Systems.html#staging),
and the stable-pointer trade-off of the
[Flecs Sparse trait](https://www.flecs.dev/flecs/ComponentTraits.html#sparse-trait).
The distinction is architectural, not a performance claim imported from Flecs.
[Burst's aliasing contract](https://docs.unity3d.com/Packages/com.unity.burst@1.8/manual/aliasing.html)
requires real overlap information: pinning cannot supply `noalias`. No foreign
implementation or alias annotation was added.

## Four traversal paths and packed-copy cost

Median of3, each cell **wall/CPU milliseconds**, exactly4,194,304 record visits
per mode. Direct/type-index/archetype-column/derived-packed all check the same
independently computed sum on every round. Packed data is a disposable read-only
copy of four scalar values, never authoritative ECS storage.

| Original owners / phase / live rows | Direct | Type index | Table column | Packed copy scan | Copy-only median ms |
| --- | ---: | ---: | ---: | ---: | ---: |
|1024 full /1024 |9.506/9.499|3.117/3.119|3.232/3.234|1.018/1.020|0.009508|
|1024 sparse /16 |7.688/7.690|1.880/1.882|2.593/2.594|1.204/1.207|0.000330|
|65536 full /65536 |21.795/21.801|4.643/4.645|4.630/4.634|1.512/1.517|0.986922|
|65536 sparse /1024 |16.321/16.325|4.670/4.672|3.743/3.746|1.007/1.024|0.019748|

Rounds are4096/262144/64/4096 respectively. Full sums are8,386,560 and
34,359,607,296; sparse sums122,976 and536,352,768. Query counts, unchanged survivor
addresses and final empty store/page ownership pass. One process includes both
sizes: median165.340ms wall/121.159ms CPU, peak37164-37176KiB, including setup,
copy/allocation, checks, output and teardown. Peak RSS is cumulative, not a
per-path memory delta; it cannot attribute a separate peak to packed traversal.

The snapshot adds32*live_rows bytes (2MiB for65536), plus allocator overhead;
its allocation and view/query setup are outside the **copy-only** timer, but
inside the whole-process measurement. Thus0.987ms is a lower bound on the large
snapshot's build cost, not a free prerequisite. Against the best indexed path,
copy alone requires about21 full large traversals or19 small traversals to pay
back; allocation, invalidation/rebuild and ownership work can increase that.
The measured64/4096 repeated scans are artificial reuse, not evidence that a
compiler phase repeats that many scans. No unconditional packed-policy adoption.

## Sparse retention and steady refill

The layout fixture retains2048 entity owners. Mixed membership adds1024 dense
and128 sparse secondary components; all use the same stable storage class.
Both direct-first and columns-first runs pass full/fragmented/refilled sums
33,550,336 /508,096 /33,550,336. Direct examines2048 owners; fragmented columns
visit only32 matches. That gain includes filtering, not solely cache locality.

| Physical census | Homogeneous full / sparse / refill | Mixed full / sparse / refill |
| --- | --- | --- |
| Payload pages / slots |32/2048 throughout|50/3200 throughout|
| Live component slots |2048 /32 /2048|3200 /1184 /3200|
| Live payload bytes |65536 /1024 /65536|102400 /37888 /102400|
| Physical payload-page bytes |187616 throughout|293150 throughout|
| Strided slot bytes |81920 throughout|128000 throughout|
| Logical descriptors/indexes, excluding plans |491792 throughout|513864 /492360 /513864|
| Logical view/plan bytes |112 throughout|176 /112 /176|
| Physical world+plan bytes = charged bytes |1053539 throughout|1185328 /1159489 /1185328|
| Observed peak charge |1053539 throughout|1185328 /1203594 /1209226|
| Live allocation owners |2208 throughout|2231 /2230 /2231|
| Separate ledger metadata |163840 throughout|163840 throughout|

Logical rows are subsets of physical ownership, not additional bytes to add.
Physical includes pooled-page slack, descriptor/back-reference/header/alignment
bytes and independent indexes; it excludes allocator-private bookkeeping,
fixture stacks/raw pointer arrays, I/O and private census scratch. Scratch is
16416/288/16416B homogeneous and25632/9504/25632B mixed, explicitly untimed.
Ledger metadata is separate from its charged world and is released on disposal;
this is not a whole-process cap. The existing source census exactly matches the
accepted post-accounting mixed full1,185,328B receipt.

One primary survivor per64-slot page yields1.5625% slot occupancy. The large
homogeneous traversal retains6,003,712B for32,768B live payload:183.219x. In the
mixed layout overall occupancy is37% after primary deletion because other kinds
remain full; homogeneous is1.5625%. Empty entity descriptors and their spare
indexes intentionally remain while owners live; this is retention, not a leak.
Refill allocates **zero new payload pages**, retains survivor addresses, restores
full sums, and returns physical world ownership to its full baseline. Index/query
allocations can still occur; the modest replacement peaks are counted. Final
worlds, components, pages, views, grants and ledger storage all dispose to zero.

Warm256-round traversal wall/CPU ranges (two counterbalanced processes), ms:

| Population / phase | Direct | Table columns |
| --- | ---: | ---: |
| Homogeneous full |1.154-1.163 /1.157-1.165|0.385-0.503 /0.387-0.505|
| Homogeneous sparse |1.076-1.124 /1.073-1.127|0.00786-0.00790 /0.010-0.011|
| Homogeneous refill |1.135-1.139 /1.137-1.141|0.379-0.382 /0.381-0.385|
| Mixed full |1.168-1.232 /1.172-1.234|0.569-0.747 /0.571-0.749|
| Mixed sparse |1.144-1.179 /1.146-1.180|0.00462-0.00463 /0.006-0.007|
| Mixed refill |1.172-1.689 /1.174-1.691|0.524-0.569 /0.525-0.565|

Fresh full plans cost5.89-9.15us wall/8-11us CPU; reused-world phase plans
1.26-1.86us/2-4us. Full homogeneous/mixed queries have1/3 ranges; fragmented1.
Create0.457-0.531ms, remove0.025-0.063ms, refill0.036-0.073ms wall. Whole layout
processes cost71.42-73.83ms wall/16.17-17.13ms CPU, peak2624-2668KiB.
Output/census/setup dominate much of whole-process time; warm scan totals are
separate. Small CPU values have microsecond resolution; outliers are retained.

## Ordinary stage/node creation and real overlap

Same eight canonical subtrees for every worker count,1024 or65536 nodes, flat
or binary-tree relationships. Production WorkPool uses private stages, explicit
synchronized budget and queued publication; no serial fault transport. All exact
world/identity/order/parent/refcount checks pass. Every4-worker trial observes
four overlapping job intervals; this is timestamp overlap, not a barrier proof
of four simultaneously busy cores. Published node counts are1025/65537 before
root release; final world, grant bytes, live grants and lanes are zero.

Median of3; phase wall ms excludes startup; lifecycle CPU includes reference
checking. Whole-process wall/CPU includes startup, checks, output and shutdown.

| Nodes / shape / workers | Create+join | Publish | Release | Lifecycle CPU ms | Process wall/CPU ms | Peak RSS KiB range |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
|1024 flat /1|0.108|0.029|0.010|0.161|8.562/2.407|1604-1624|
|1024 flat /4|0.289|0.053|0.007|0.773|9.308/3.533|1620-1872|
|1024 tree /1|0.109|0.065|0.023|0.206|8.773/2.482|1588-1616|
|1024 tree /4|0.234|0.101|0.054|0.785|9.631/3.701|1856-1948|
|65536 flat /1|6.717|4.005|1.830|12.902|22.097/15.372|20468-20772|
|65536 flat /4|4.501|3.956|1.831|20.074|20.797/23.300|20080-20200|
|65536 tree /1|6.452|5.793|3.155|16.179|27.491/20.378|24840-24852|
|65536 tree /4|4.697|5.510|3.740|24.416|26.081/28.780|24336-24636|

Raw descriptor bytes are188416/12058624. For serial/four workers respectively:

| Nodes / shape | Peak charged bytes | Physical grant generations | Separate retained ledger bytes before dispose |
| --- | ---: | ---: | ---: |
|1024 flat|326390 /326558|126 /127|5120|
|1024 tree|365198 /365366|638 /639|40960|
|65536 flat|19155494 /19155662|3966 /3967|163840|
|65536 tree|21645758 /21645926|36734 /36735|2621440|

These peaks include stage descriptors/vectors, stable node pages and relationship
indexes; they are not just sizeof(Entity). The tree has32768 additional child
index grants versus the flat large case; ledger capacity/metadata consequently
also grows. Grant generation is an ownership counter, not all libc allocations;
worker stacks, derived check arrays and allocator internals are outside that
charge. This fixture does not separately census per-stage descriptor-page
occupancy. Do not invent such a measurement from its peak/grant totals.

Four workers reduce large creation time by1.49x flat/1.37x tree, but ordered
publication/reclamation and setup leave only1.06x/1.05x whole-process speedup
and increase CPU. Both small workloads favor serial. Preserve the existing serial
path; queue width/interval overlap is not enough to justify wider dispatch.
No scheduling threshold or compiler algorithm was changed here.

## Architectural disposition and precise follow-up boundary

Existing `semantic_flow.tower::sem_flows_pump` deliberately reads the world-owned
single-kind instance index, then builds an ordered **pointer** job list. It does
not repeatedly copy mutable SemanticFlow payloads. Similar body/query cleanup
passes use `entity_query_at`. These callers have no demonstrated twenty-pass
frozen-field hot loop; replacing their index with a packed payload copy would
add unmeasured synchronization/ownership cost. Existing type indexes and cached
multi-kind plans remain the appropriate available APIs.

The measured gap is sparse-page retention, not a demonstrated need to relocate
payloads. A narrowly reviewable **proposal, not implementation** if real phase
census confirms that gap: compare the existing component-page row policy64
against16 at `entities.tower::entity_component_allocate/entity_storage_allocate`
on exactly these ordinary inputs plus the identified high-retention kind/phase.
Freeze the retained entity IDs from the64-slot baseline and replay those IDs;
do not select a new first survivor from each candidate page, which would change
the live population and invalidate the comparison.
For this32B value, the source layout predicts1639B per16-slot page versus5863B
per64-slot page: one-survivor retention would fall, while full-page overhead and
allocation/grant counts rise. Measure those trade-offs before any production
per-kind policy; do not globally adopt the experimental limit. Existing registered
kinds/source owners must remain fixed before dispatch, page addresses stable,
reference/finalizer semantics unchanged, and replacements charged at peak.
A new authoritative packed policy is higher risk and is not proposed by this data.

This is a finite ordinary performance receipt. It neither retries the rejected
sanitizer work nor claims broad platform, compiler, browser, generation or hosted
acceptance. No production performance regression is introduced: only this receipt
and the journal change. ROOT retains final affected-input integration and release.

## Subsequent real compiler census

The [9d9329db real compiler receipt](compiler_ecs_occupancy_9d9329db.md) supplies
this receipt's requested phase/kind census on 8/512-body imported/staged programs.
It distinguishes never-filled private pages from holes in surviving pages, measures
index/ledger retention and verifies ordinary zero-grant teardown. The material
case is underfilled SemanticDeclaration pages, not a compiler-wide183x survivor
pattern. Its bounded four-slot policy proposal remains an experiment, not an
implemented packing change. These later measurements do not relabel the original
synthetic results or close the separate sanitizer/release gates.
