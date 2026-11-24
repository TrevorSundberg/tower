# Sparse immutable kind layout — A1, 2026-11-23

Accepted native candidate on frozen main3011c77febe8b2c628ce0396a1446b66a99d59d5. This changes the internal Entity ABI; ROOT must rebuild/adopt the combined runtime before release. No reactor, generation or hosted acceptance is claimed.

`EntityLayout` moves only data_size/data_alignment/lifecycle into a stable kind-owned block. Canonical identity remains the world-owned Entity; instances/count/capacity, registration/page policy, child storage, tables and leases stay in place. B1's compiler/world registration/four-row policy and B2's child implementation were not edited.
Registration allocates through existing entity_owned_allocate_result/store.buffers/WorkBuffer and the same borrowed budget. It publishes the pointer/flag only after admission; duplicate matching registration is allocation-free even under a view, mismatch is Busy, invalid alignment is Invalid. No component registration recursion or global registry exists.
Registration is coordinator-only before views/dispatch; private/leased nodes are Busy and registered kinds cannot be leased. Immutable layout remains alive through component type references, queued holds and view-deferred reclamation. Joined finalizers read it before kind reclaim frees it. Private stage nodes never own a layout.
Audited immediate callers: compiler_work, generic_registry, frontend module/unit admission, LR first/state/runtime/action/link/propagation/closure and semantic kind producers now preserve the actual checked registration error. Existing boolean linker APIs retain fail-fast/owner cleanup; legacy IDE/LLVM/syntax bootstrap wrappers still fail fast. No new success fallback or error normalization.
Finalizer, layout/locality, parser retention/benchmark and source-reconstruction observers follow the sparse pointer; physical pages remain counted once. Instance indexes and stage prepare/hold/publication algorithms are unchanged.

## Frozen measurement

KinmenA Windows11 host, Linux x64 tower-a1-environment CPU12-23/24GiB, Clang19 Release native link, documented public bootstrap768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138, --jobs1. One cache/owner, no concurrent owned jobs. Fresh processes/warm filesystem, n2 before then n2 after, no instrumentation in timed paths.
Profile: tower-frontend-storage-profile /work/scaffolding {16,4096} {1,4} plain. Wall/CPU=user+system seconds and whole-process peak RSS KiB (GNU time), two-sample means:

| Bodies / workers | Wall before→after | CPU before→after | Peak RSS before→after |
|---|---:|---:|---:|
|16 /1|0.475→0.425|0.410→0.365|164814→163890|
|16 /4|0.540→0.510|0.520→0.485|168596→167212|
|4096 /1|2.660→2.280|2.595→2.210|725230→698508|
|4096 /4|2.375→2.260|3.130→2.960|730870→703978|

No material time regression observed; these short samples are not a compiler-throughput claim. All16 runs preserve source/import fingerprints, full canonical byte counts/hashes and independent reference result42, with final bytes/grants/lanes0. Canonical16:20738B/hash13444352409005731276;4096:4984138B/hash9440401453049844906. Profiles compare fingerprints, not saved full-text byte diffs; query-smoke supplies separate exact canonical controls.
Before executable70899cc6d25d29e071a4c4fd8d833d3a886e146cf10e1eb2354fb450680a141e; after55cbbb04d9b264c2d8b93753e52677d81cceee932d9ca27992feab86fc468763. Raw files retain the source patch and unchanged bootstrap identity.
Actual x64 Entity192→176B, allocator alignment16, payload stride208→192, descriptor slots/page16→17. Including component descriptors/page headers/allocator header: full pages4335→4319B. Sparse layout24B, stride32,80B occupied slot,32 slots/page2799B. These are target-specific; no Wasm byte claim.
At4096 compile join:614625 entities,40 indexed kinds (not a census of every unused kind); layout logical960B/occupied slots3200B, touched shared size-class pages22392B already included in descriptor totals. Descriptor/name physical pages204283935→178835230B (−25448705B),49489→43762 pages. Measured pool occupancy/reuse, not merely sizeof subtraction, determines this net saving.
Live charged bytes507308966→481860261; peak589614248→563127338 (−26486910B/4.49%); live physical grants489643→483916; grant generation1076831→1070612; ledger metadata41943040 unchanged. Counts are grants, not global malloc calls. At16: descriptor bytes6614307→6276268, peak98280252→96939760; final owners0 for both sizes.

## Focused evidence and limits

Smallest changed entity-component-faults target passed first. Seven focused CTests pass: component-faults/layout/budget, page-reuse, stage-result/result-faults/concurrent. New registered checks cover real Memory and Capacity metadata denial, unchanged publication/ledger, retry, allocation-free duplicate/Busy, stable self-kind query payload and zero cleanup; existing tests cover partial preparation, cancellation, joins and address conservation.
Query-smoke passes serial/four-worker32/64 staging/canonical/lazy dependency controls; resource-smoke passes its24 startup/growth cases across32/64 and1/4. grammar-resource passes, including public nondefault-world type registration/denial and Foundation page-policy checks. Existing locality mixed/direct passes stable survivors and full cleanup. Parser benchmark/retention observers compile; their unrelated benchmark matrices were not run.
Large independent unoptimized reconstruction also passed once, workers4/targetwidth4:972596B input SHA403fdc6b0b6c9cd38cbf4e9c6b20858e1cb0c64a8d3342d91f54c72501807e2e, output4709291B SHA452132b90d4a73b43ec3f19153d8b344b201955640c7e6fd0a97203f2d858218, cmp equals the preserved full reference. Probe77a96c548bc8c9bc8697bd1ae5950dcddfc6c973b52b4ff9cba61e5a7f3b3609:12.28s wall/15.15s CPU/2790488KiB peakRSS, peak charged2415628359B, final bytes/grants/lanes0. Joined descriptor pages851112862B; no equivalent rebuilt before-probe was retained, so this is correctness/size evidence, not a paired speed comparison. Prior B1/A2 census numbers remain attributed historical measurements.
Preserved failures: first observer compile lacked its existing entity_component_from_data ABI declaration; fixed after drain. Optional tower-parser-benchmark target was absent in this cache; its changed Tower provider and retention observer were compiled directly with the same public compiler/target instead. No failed check counted as passed.
Remaining: mutable kind indexes still cost every descriptor; no broader migration attempted. Single-owner denial controls do not sanitize threaded code. Combined B2 inline-child ABI/performance, supported instrumentation, public bootstrap generations and browser/release adoption belong to ROOT and remain pending.
Raw logs/binaries/patch/commands: C:/Sandbox/build/codex_ecs_20261122/A1/cache/kind_metadata_3011 — baseline.sh/candidate.sh/large.sh/consumers.sh, before/after_*.log/.time, *_census.log, focused_ctest.log, query_smoke.log, resource_smoke.log, grammar_resource.log, locality.log, build/failure logs and large_identity.txt. todo untouched.
