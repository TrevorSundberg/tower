# Inline first child index: B2 measured acceptance

Frozen base `5fc00c8597760ac9c21613cbd78063ddf9f4236d`, public bootstrap768;
one owned Linux/LLVM19 Release cache, CPU12-23/quota12/24GiB, production allocator.
Read the prior inline-component acceptance and ROOT child-transfer experiment;
no transfer/refcount shortcut, allocator policy, WorkBudget gate or scheduler change.

The existing profile's optional `children` census walks joined indexed entities,
without per-operation clocks/shared counters. Large4096: zero/one/many children
348824/204122/61633; small16:10184/4202/4513. Each excludes46 unindexed kind nodes.
Measured one-child heap storage33,700,320B justified testing one inline EntityChild.
Entity192->208B, aligned descriptor stride208->224, actual rows/page16->15:
the cost applies to leaves too. Descriptor size-class pages may also hold names.
Whole-Entity copies were searched; only the two zero-initializing constructors exist.

First attachment uses the descriptor-owned slot; promotion uses a checked private
heap allocation/copy, then commits. Ordinary growth keeps minimum4/doubling;
staged preparation keeps exact requested capacities. Heap old+new charges overlap.
Failed allocation retains old indexes/edges. Later name/publication failure may
retain admitted capacity as before. Removal/take do not demote or shrink indexes.
Reclaim/discard never free inline storage as a buffer; page transfer keeps addresses
stable. Refcounts, ordered names, leases/views and coordinator publication stay intact.
Physical census consumers distinguish inline ownership; no second payload graph.

| Joined storage, large4096 serial | Before | After |
| --- | ---: | ---: |
| Child heap allocations / bytes |265756 /47485936|61634 /13785328|
| Descriptor size-class page bytes |192569370|199930829|
| Total retained charged bytes / live grants |521369982 /432300|495030649 /230046|
| Retained ledger metadata bytes |41943040|20971520|

Net retained reduction26,339,333B (5.05%); RSS falls about37MiB. Counts are live
allocations/grants, not cumulative malloc calls. No retained heap is hidden.
Frozen ordinary16/4096 inputs include decltype/comptime/import checks; target8,
revision81/profile19, one unit/backend off. Observers disabled for timed pairs.

| Bodies/workers, alternating n2 | Process wall s before -> after | CPU s | Peak RSS KiB |
| --- | ---: | ---: | ---: |
|16/1|0.375164 ->0.376073|0.373755 ->0.373897|165492 ->162988|
|4096/1|2.503750 ->2.387955|2.502214 ->2.386321|734054 ->696690|
|4096/4|2.355054 ->2.212271|3.088590 ->2.914402|739494 ->703148|

Small +0.24% is within these samples; large wall improves4.6%/6.1%. Preliminary
noninterleaved n2 groups were slower6.5%/1.9%/2.3%; all retained, prompting only
the alternating confirmation above. Small-n host variation limits generalization.
All24 timed checks plus4 census controls retain exact source/import/Foundation
bytes and known42 results; world/budget disposal passes, joined lanes0.
Before/after executable SHAs `1e93352a8d7f612544005a1823b919b62ad15c31730b0c52fb412d1942ad6d16`
/`2cc9449b8475f23b92a58c972da52a34eef0147e14711a865cfd08375336a507`.

PASS first/second/fifth, cap-denied promotion/old+new growth/retry, ordered edges,
take/re-add, published/discarded private inline lifetime and exact descriptor reuse;
existing lease, stage-result, production concurrent publish/cancel/failure, page-reuse,
component-budget and physical-accounting profile/cap controls pass with zero owners.
The old cap fixture first-child-heap assumption failed: now it proves inline success
without a new charge, then denies actual second-child promotion, preserving rollback.
Observer import/print link errors and a runner usage/quoting error are retained too.
Dependency build27.289s/76.820CPU/1072844KiB; focused observer/test refresh8.200s.
Small native reconstruction census:0.480wall/0.457CPU/175804KiB; zero bytes/grants/lanes,
58057B output SHA45f35d6fd27696d04461a44a0f22cdee93eecfe397d16c1b951147557607aca4.
A2's exact965691B request is unavailable locally: its large native/Wasm acceptance
remains pending, not inferred from this small control. No generations/reactors or
instrumentation run; D2's prior observer review does not cover these new bytes.
Evidence: `C:/Sandbox/build/codex_ecs_20261122/B2/entity_children_5fc00c85` and same
`/cache/` basename: source archive, patch/hashes, before/after binaries, all logs,
canonical artifacts, `samples.json`, `paired_samples.json`, exact command wrappers.
ROOT owns integrated later-source/release checks; the blocked verifier was untouched.

Integration: implementation `c12c2189`, complete-history joins `1dcb396f`/`b20678d3`
preserve427d6aca/ae99ce12, including lowering-registration and B1 Foundation page
policy/observer work. Affected provider/profile/service refreshes pass16/w1,4096/w4
and small reconstruction with exact outputs and zero teardown; raw merged/joined logs retained.
Those checks are separate from the frozen storage timings; codec/browser changes
are excluded. Entity layout changed: all consumers require a coherent rebuild.
The two manual partial-memory profiles and serial fault-census guard were updated
by ownership inspection; those manual/injected modes were not executed here.
