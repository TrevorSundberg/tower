# Independent raw-owner page acceptance

Reviewed repair `4c38796de5d89a423572f28086eee52bf002c7a6`, integrated source `da58efaca39684ef77ced3021acf99a715d597e1` / tree `c080d68619355fc6e8bbfe3d39697edc160a419e`; baseline `7c5cfce8a00be7fcf6e103f94b5477dd007f730c`.
Disposition: no concrete producer/oracle defect found; actual final candidate retains the raw-slot change. No peer production/test edit or rebuild.
Raw evidence: [`build/d2_ecs/entity_memory_peer_r4/`](../build/d2_ecs/entity_memory_peer_r4/); exact descriptor `release.json`, 11 changed blobs/physical hashes `changed_identity.tsv`, finite 34-path producer/reader/recipe map `reviewed_blobs.tsv`.
Immutable delivery remains `/home/deck/tower_coord_ecs_20261122/D2/entity_memory_r4/`; complete archive bytes and extracted originals retained.
Binary/source/owner archive SHA256 respectively: `62865183801eff42e77616679e1bf99292c12c64094bf3da29b87d971919d16d`, `608fda21955a78e64d2d55e2accd490839ca67ea3372d8c25b0a0f44cd73d665`, `eabe3cfb045b7f0191f93802dcbdb79695a2d515a8a657fcaee996ea745cf0b3`.
Safe relative regular-file/directory membership, modes and all archive hashes pass; all 17 ELF hashes match `owner/evidence/checked_binaries.sha256`, before and after execution. Linux x64/LLVM19 dependencies resolve in existing `tower-d2-ecs`.
Public compiler identity `160a5a20ed1c97bb473d177ef064391c120fb247cdaff3a2c379b17a697f5ff1` matches delivered source; no private compiler substitution.
Initial full raw Git-byte comparison failed (retained `verify_inputs.raw_failure.*`): 1,898 members agree, 1,306 raw blobs match, 592 differ only by CRLF. Both explicit CR-at-EOL removal and Git clean filtering produce each exact published blob (`source_newline_proof.tsv`); originals were not rewritten. All 11 changed Tower files already match raw Git and supplied SHA.

`entity_storage_reserve` preserves checked size+prefix/alignment/stride arithmetic; raw metadata=0, semantic metadata=sizeof(EntityComponent). At least-two-slot page multiplication stays bounded by existing page policy; standalone header overflow is checked before allocation.
For pointer widths4/8, raw alignment=2*sizeof(usize) leaves an aligned pointer prefix and at least one dead-slot usize; zero/tiny owners cannot overwrite the next prefix. Standalone receipt recovery rounds the complete WorkBuffer+prefix header; disposal copies the receipt before freeing it.
Bucket collisions require exact id/stride AND raw/semantic discriminator. Live raw prefixes identify pages; retired payloads alone store free links. Semantic components remain40B with stable payload/back-pointer identity; no pointer tagging/truncation, packed-payload claim or new authoritative allocator.
Creation consumes no identity before successful allocation; existing Invalid/Capacity/Memory producers, rollback, first errors and full physical charges remain. First/last-live detach/disown, full-page transfer and stage private-pool destruction ordering are intact.
Queries, names, descriptors and leases retain their existing owner/revision/pin contracts. Stage hold/publication/discard and coordinator finalizers are unchanged; a pin still grants lifetime, not payload mutation permission.
Raw and semantic census branches now differ explicitly: page receipts count once, standalone semantic receipts remain EntityComponentAllocation, standalone raw receipts use WorkBuffer; inline indices/leased nodes are not double-counted. Other authored prefix/layout readers remain semantic-only or enumerate actual physical pages.
New page-reuse assertions independently cover same-class raw/component separation, saturated-budget reuse without a grant, survivor bytes/address, transfer, zero/tiny/oversized raw blocks, overflow Invalid, Capacity and final zero. Existing4096 alignment, denial/retry, leases, finalizers and property checks remain.

| Peer validation (ordinary, unchanged supplied binaries) | Result | Wall / CPU seconds | Peak RSS KiB |
|---|---|---:|---:|
| Archive extraction/hash | PASS | .77 / .85 | 4,424 |
| Raw-source comparison, retained failure | exit1, CRLF-only attribution | 7.36 / 7.40 | 11,592 |
| Newline/source/binary verification | PASS | 9.00 / 11.30 | 19,356 |
| Initial component-budget invocation | exit134, affinity admission mismatch | 1.02 / .02 | 2,036 |
| 18 final focused selections | 18 executed/pass, zero skip/timeout/unstarted | .17 / .11 summed | 50,680 |

Initial affinity2,3 exposed only two logical CPUs (one physical core), so `work_pool_open_impl` clamped the fixture's required four slots. Retained logs/disassembly identify this admission boundary; no assertion/binary changed. Drained, then used affinity2–5 (two physical cores), unchanged two-CPU quota/3GiB/swap0 and original30s guards. Reused the first two passing checks; reran only the affected case and remaining16 selections (19 total process attempts).
Exact commands/results/output are in `peer_runs_initial/`, `peer_runs/`, `final_results.tsv`: 12 entity/constructor controls, three syntax resource consumers, accounting cap/profile and mixed locality. Zero outputs were compared exactly where specified; diagnostic/property/census outputs and in-fixture literal/state assertions are retained completely.
Production-allocator component/stage fixtures assert distinct two/four workers simultaneously admitted behind barriers, cancel/drain/stale tickets and coordinator finalizers. This is overlap under a two-CPU quota, not four-core scaling; serial fault injection supplies separate allocation-failure evidence.
All final exits0; full ledgers/censuses reconcile, final bytes/grants/lanes/owners0 or original runner baseline, no cgroup max/OOM/swap events. No owned child remains; disk132,137,578,496B free at final check; sources/binaries remain frozen through execution.
[L1's receipt](entity_raw_pages_7c5cfce8.md) owns the 20-run n2 performance matrix, eight32/64 phases and two observer runs. Supplied20 artifact-hash manifests agree per shape, exits/logs corroborate; full generated matrix directories were not supplied, so their byte comparisons remain owner-attributed.
L1's single4096 retained458914350→416283482B/grants283676→275200 and unchanged semantic payload census are scoped measured gains, not D2 remeasurement or leak claims. Original owner build/census failures remain in delivered logs.
No new runtime/ABI adoption beyond these ordinary Linux x64 fixtures:32/64 canonical evidence is attributed to L1; current browser/native packages, instrumentation, pooled-slot safety and universal race freedom are not closed here. ROOT retains integration/publication ownership.
