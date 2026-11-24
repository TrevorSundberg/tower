# Stable component metadata: one duplicate pointer removed

Accepted candidate: native component descriptors shrink48→40B; stable payloads, ownership receipts and page/index authority remain intact.
Frozen main45b78c48fad837c01d971d6a77731d48078d01f9/tree7dd336750dce6a1e4aa4df70e3c1bd997e53b892; candidate is the accompanying scoped Entity/test change.
Default public bootstrap44ae8f731d8991e5cd063e86512923ac5f9c1bd151943c8f235ee4025de11c44; no override. Native x64 Release, LLVM19.1.1, CMake4.2.3/Ninja1.13, compiler jobs1/build jobs4.
KinmenB Linux/WSL2 container tower-b2-work, CPU12–23/quota12/24GiB; production allocator except the two explicitly serial fault runners. Initial disk917GiB free; owned jobs drained.
Raw commands, source/input/output manifests, preserved executables, every log and samples.csv: `C:/Sandbox/build/codex_ecs_20261122/B2/component_metadata_45b78c48` and matching `/cache/component_metadata_45b78c48`.
Candidate source-manifest SHA2566fed09556e19286b06e043e3b543d2a683e16352fcadfbb9c96d0e98b81a1856; frozen resource-manifest550011c4e32ec3dbe2c168409d2c77718eb07f526c77f9095a222ec038d02e20. Read-only Linux Git metadata stalled on a Windows submodule alternate path; owned commands stopped, manifests completed with Windows Git, no runtime check repeated.

Reviewed L2 [large-page census](native_pages_scratch_effab4bd.md), prior occupancy, rejected table seeding/block snapshot and payload-slack findings before choosing this single metadata candidate.
Existing Tower frontend-storage observer, current4096-body dependency input: ParserMatch444794 live/444806 used/444928 reserved slots,6952 pages;99.9699% live occupancy.
Its51437848 physical bytes decompose exactly:24908464 live payload +21350112 live descriptors +3558352 live back-pointers +15008 empty-slot bytes +1605912 page/receipt/alignment overhead. Logical payload is included, never added again.
Empty slots comprise12 retired and122 never-used rows. Most of the payload/page gap is metadata, not wasteful capacity; descriptor/name pools separately own204289533B across49491 pages.
Audit: allocation had two writes and one production read, standalone free; pooled rows already identify their physical page. All remaining readers were test censuses. ParserMatch labels/finalizers and data→component back-pointers remain unchanged.
Remove the duplicate pointer and put EntityComponent first in EntityComponentAllocation; standalone free copies its receipt before releasing the header. No pointer tagging, address packing, payload moves, new pool, uncharged storage or alias guarantee.
Existing sizeof-derived slot capacity/charges adapt automatically, including normal Foundation40→41 rows where the page-byte limit permits; configured page policies, stage holds/transfers/free lists, query publication and leases are unchanged.
All direct census consumers now recover the actual standalone first-member owner; page tests count page identities. Layout checks prove receipt base,4096-byte alignment, back-pointer identity, failed admission and exact last-live retirement.

Uninstrumented n2 counterbalanced before/after, then reversed variants/shapes; frozen resources, one unit, dependencies/uniform, target pointer8/revision81/profile19, no backend. Mean frontend wall/CPU seconds and process peakRSS KiB:
| Bodies/workers | Wall before→after | CPU before→after | RSS before→after |
| --- | ---: | ---: | ---: |
|16/1|.301839→.293366|.300566→.291992|161382→159988|
|16/4|.371901→.377764|.399907→.406184|165884→164250|
|4096/1|1.842559→1.792449|1.837422→1.791024|680394→666934|
|4096/4|1.771201→1.756518|2.511713→2.489465|687104→673470|
Large serial/four improve2.72%/.83%; small serial improves2.81%. Small-four is5.86ms/1.58% slower, retained as a tradeoff, not a claimed universal speedup. No extra samples or second candidate.
Whole-process wall/CPU, including reference/format/output/teardown: small1 .331142/.328261→.321486/.318063; small4 .402503/.429950→.407354/.434662; large1 2.167507/2.157954→2.111506/2.109873; large4 2.125430/2.864090→2.105304/2.837365.
Frontend-units retained serial474003846→460728178B, saving13275668B/2.80%; four474001022→460725354. Live grants285548→285504 serial,285549→285505 four; joined lanes0. Small saves462118B and2 grants.
Large mean charged peaks554186039→539978760B serial,554148439→539940864 four; ledger metadata20971520B separately. Checked final world/ledger teardown returns all owned bytes/grants/lanes to zero.
Separate storage census (different entry, not pooled timing): payload pages213808183→207516067B, descriptor/name pages204289533→197306461B; retained473613956→460338768B. ParserMatch saves exactly444928×8=3559424B, unchanged occupancy/stride64.
Sixteen timed processes preserve every full generated source/import/Foundation byte and independently execute answer()/body_0(36)=42. Extra observer run reports4 distinct simultaneous semantic workers/peak4; its clocks/census are excluded from throughput samples.
Eleven focused invocations pass: layout; component budget; complete component faults plus inline; stage result; complete stage-result faults; production concurrent stage success/cancel/partial/failure; page reuse; accounting cap; mixed-column locality/query; standalone entity_pages exact0.
Preserved failures: accounting invoked without required selector returned usage; cap then failed “View descriptor denial”. Untouched baseline independently reproduces that failure. Kind layout already owns reusable view-size slots; fixture now exhausts paid slots, requires exact Capacity, preserves charges/pins and checks complete retirement. No conservation assertion removed.
Single large reconstruction uses retained972596B requestSHA403fdc6b0b6c9cd38cbf4e9c6b20858e1cb0c64a8d3342d91f54c72501807e2e, target32/workers4; all4709291 output bytes match referenceSHA452132b90d4a73b43ec3f19153d8b344b201955640c7e6fd0a97203f2d858218.
That census run reports resource0/final bytes/grants/lanes0,11.406794wall/14.317287CPU s/2261848KiB peakRSS; peak charged1936403544B, ledger metadata83886080B. Rechecked ParserMatch3015445/3015488 slots uses324494779B; descriptor/name868428187B; Foundation452835 payload155775240B occupies231734804B physical pages.
This is the previously accepted B2 large request, not L2's4769423B expanded execution reparse; no child-only, scratch-only, large-case before/after or full2GiB execution acceptance claim is made.
Before profile ELFe8dda6cb39a7b2a037a5c7efed45e794997224feb8b7eec29b6b9b1477f45314; after8f820c535fd3a52a8079986a42011d01aeed24cc2ad9cfe2f5700766853ecbf6. Full canonical SHA16/4096:76849f7eb1b152387a9afa31a160e20ff922940f94c4fcce6c2a74f028e04796 /79b43b59b1adabbbc407fafd674ab534f33ddf70fe72c5ae4c529a010e1879ce.
Dependency-aware baseline27.56wall/71.91CPU s/892868KiB; smallest layout2.62/2.58/250256; candidate closure22.33/52.43/891300; fixture correction1.71/1.27/256924; remaining census consumer6.57/7.34/386944. No duplicate full build or vendor build.
Component-layout ABI changed: current native consumers were rebuilt; existing browser bundles/static dist/public pin are untouched. Wasm/generations/integrated instrumentation remain ROOT gates; no rejected operation or deployment verifier was attempted.
Final integration: implementation75eba778 merged complete origin/f10d3637 asf43ad663. Incoming documents/public31a385c616b889987d68f8eb9714020f3928aac97591a1569f905ab706f52ed6 preserve all tested compiler/library/build blobs. Default-bootstrap affected rebuild28.69wall/80.40CPU/879616KiB yields byte-identical profile8f820c53; five ownership controls and small1/large4 canonical comparisons pass. Frozen44ae timings remain labeled44ae; no later-source or Wasm acceptance is inferred.
