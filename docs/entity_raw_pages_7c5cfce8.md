# Raw ECS owner pages: measured metadata removal

Frozen main `7c5cfce8a00be7fcf6e103f94b5477dd007f730c`, tree `4270d4ae9b9cf2163f63372644647caeea079aef`; ROOT r4 next-work descriptor authorized this family after 03e adoption.
Public compiler SHA256 `160a5a20ed1c97bb473d177ef064391c120fb247cdaff3a2c379b17a697f5ff1`; no private predecessor, pin, reactor or vendor build.
Orchestral-Revng/LLVM19, CPU0–3, outer2/compiler1, 4GiB cgroup/swap0, ordinary `l1_combined_73cc82ab/build`; ASan caches untouched.

`entity_storage_reserve` now distinguishes semantic components from raw owner blocks. Raw pooled slots retain a page prefix and put the free link in retired payload space; they no longer reserve an unused 40-byte EntityComponent each.
Semantic EntityComponent remains 40B; Entity/Store/Stage/Page field layouts, eight buckets, row/byte policies, stable payloads, tables and IDs are unchanged. Raw standalone blocks retain a complete WorkBuffer receipt, copied before release.
Immediate owners: Entity, EntityLayout, EntityView, EntityTable/types, EntityTableQuery/types/matches/columns, names and EntityStage/private descriptors. Existing reclaim/query-close/stage-publish/discard paths still call entity_owned_free; private pages unlink/transfer before stage destruction.
Immediate readers migrated: accounting/fault/locality censuses, component/constructor denial setup, syntax resource fixtures and storage/child-geometry observers. Semantic payload readers keep entity_component_from_data. New entity_owned_page/buffer borrows require a live raw owner; provider and these readers must be adopted together.
No extra authoritative graph, pointer tagging, uncharged allocation, implicit mutation permission or noalias claim. This is metadata/page occupancy reduction, not packed component payload storage.

The new existing page-reuse regression covers raw/component same-class separation, full-page release/reuse with a saturated ledger, survivor identity, pool transfer, empty/tiny/standalone owners, alignment/endpoints, Invalid overflow, Capacity and final zero.
Smallest page-reuse target passed first. A build attempt then exited1 because execution tests were disabled in this cache; enabling their existing option completed the dependency build (64 actions, 73.18s wall/102.78s CPU/867084KiB maximum child RSS; cgroup1413472256B).
First focused run preserved a real census assertion failure (CTest8, aborted component fault child): its shared raw-owner reader also handled standalone semantic components. The reader now counts semantic standalone receipts explicitly; no ownership/error oracle was relaxed. Only affected fault targets were rebuilt; nine passing tests were reused.
Final coverage: 15/15 selected CTests, accounting cap/profile and locality (3/3), plus eight width phases pass. These include production-allocator concurrent stage/component checks, serial allocation-denial sweeps, leases/reentrancy, constructor errors and syntax reset/expansion consumers.
32/64 entity_pages: workers1/4 canonical bytes agree; original source Graph returns literal0; independent canonical Graph/Fast workers1/4 return0 with identical text and zero owners. No LLVM reconstruction/backend/browser matrix was repeated.

One n2 counterbalanced before/after matrix: small1x16 workers1/4, single1x4096 workers1/4, multi12x256 workers4; 20/20 runs. All generated source/import/canonical files compare completely, with ordinary answer/body literal42 checks and joined zero lanes; frontend_units_close validates drained worlds and budget disposal.
Both arms use the identical frozen LF resource archive SHA256 `c36485410b34bb3172177969624c62039468b0a0cac4160c8878651889d7734e`. Prior public/profile receipts are context only.

| Shape / workers | Compile wall s before→after | CPU s before→after | Whole-process peak RSS KiB, mean | Retained bytes before→after |
|---|---:|---:|---:|---:|
| small / 1 | .3850→.3838 | .3864→.3852 | 158312→154760 | 14468742→13381071 |
| small / 4 | .4367→.4370 | .4738→.4740 | 163184→159694 | 14465918→13378247 |
| single / 1 | 2.0656→1.9920 | 2.0652→1.9881 | 665362→620744 | 458914350→416283482 |
| single / 4 | 1.7757→1.7097 | 2.6443→2.4821 | 672034→627248 | 458911526→416280658 |
| multi / 4 | 2.4517→2.4033 | 9.0165→8.8538 | 907894→854404 | 494034965→451658669 |

Table timing is the profiler compilation interval; GNU whole-process wall/CPU is separately retained in `process_costs.csv` (single1 2.340/2.340→2.260/2.250s; multi4 2.775/9.330→2.710/9.155s). Small4's +0.0003s compile delta is noise-scale; no repeated material regression or broad speed promise from n2.
Retained single/multi falls9.29%/8.58%; process RSS falls6.71%/5.89%. Single live grants283676→275200, multi328067→320171; ledger backing stays20/40MiB. These pre-close live receipts are owners, not leaks.
Separate untimed 4096 census: same611785 entities/753031 components and138013176B live payload; payload pages remain207015942B. Raw pages196292640→153664076B, page count49216→40740, reserved slots867436→839047, live slots771555 unchanged; Entity page occupancy16→19 slots. Full physical census reconciles to the ledger.
Census charged live458524822→415896258B, peak538016459→492813081B, metadata20MiB unchanged; disposed bytes/grants0. Its workload differs slightly from units-profile; do not mix their totals. RSS also includes allocator/foreign/unattributed storage and is not a ledger subtotal.
Two separate existing observer runs preserve identical output and observe four threads/peak overlap4 in shared kernels; timed runs have no grammar observer. Matrix cgroup peak943980544B, max/OOM/swap events0; all owned jobs drained. No physical sanitizer, pooled-slot sanitizer, TSan/race-freedom or foreign-memory proof claimed here; ROOT owns final combined instrumentation.

E: `C:/Sandbox/build/codex_ecs_20261122/L1/entity_owned_r4/`: exact scripts, failed/passing logs, source patch/blob+SHA manifest, checked binaries, census and paired timings; immutable before/after binaries/resources/full output comparisons also under `/root/.cache/tower/l1_entity_owned_r4/`.
Profiler SHA256 before `7dded447ed35c2f6c51ba94c392b68bab6f89c3a1f2c4836c8237812190ff9e5`, after `2aecdc83ba966a8eb97dae80be2ab3901e2202f47fb9551f473371032211bb2c`; entities.o before `19320bf9730313abc088bf951f71e59094b76c86b25de105047e8dddeb19d1d5`, after `9e8e254f4beadb584f647d06a9e0faf68bd6af24b74c359600be75022a2c57f2`.
Evidence applies to this finite patch on the frozen source, not later parser/semantic candidates. ROOT retains pin, package and hosted adoption; unchanged prior sanitizer/generation evidence is not relabeled current.
