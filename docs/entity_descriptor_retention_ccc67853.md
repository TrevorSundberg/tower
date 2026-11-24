# Private-stage entity descriptor pages

On Deck at `ccc67853bff321b1a2258e800720232fd838a586`, the joined serial 16-body unit reproduced the earlier 2,690,877 B descriptor/name pool. Its 8,848 stable entity descriptors occupied 1,840,384 B at a 208-byte stride. Their 600 pages held 530,816 B of unused slots. Names occupied 4,868 slots for 32,383 bytes of text including terminators. Only 43 spellings occurred, with `atom` on 563 distinct edges. The census followed parent/child and component-kind links and checked distinct allocations and endpoints for repeated spellings. Lookup and replacement are parent-local. Shared spelling supplies no identity or lifetime guarantee. The module environment separately retains an unattached anchor.

| Joined pool, bytes | Occupied slots | Unused slots | Page/allocator overhead | Total charge |
|---|---:|---:|---:|---:|
| Raw, original | 1,940,144 | 562,640 | 188,093 | 2,690,877 |
| Raw, eight-slot stage descriptors | 1,940,144 | 475,696 | 201,238 | 2,617,078 |
| Semantic component pages, both | 1,813,720 | 909,600 | 141,372 | 2,864,692 |

Occupied bytes include slot prefixes, alignment and applicable component metadata. Each physical page is counted once. The raw pool also contains 38 registered layouts, 33 table descriptors and their type-ID arrays. After program release both arms retained 1,744,939 B in 533 raw pages, with 5,379 entities and 3,940 named edges. After the environment and grammar caches closed, 7 entities, no names and 10,908 B of raw pages remained before world disposal. This places the saving in the live program interval. [Joined census by raw stride and semantic kind](entity_descriptor_retention_ccc67853.tsv) · [Prior unit retirement](frontend_unit_retention_7388dcd3.md) · [Declaration-page precedent](compiler_ecs_declaration_pages_5b9194e4.md)

Only new private-stage Entity descriptor pages request at most eight rows. Ordinary store creation keeps its existing 19-row geometry on x64. The same checked allocator finds compatible partial pages, preserves alignment and addresses, transfers pages at publication, reuses retired slots and frees the last live page. Names, semantic kinds, payloads and Entity layout use their existing contracts. The serial unit traded 86,944 B of unused slots for 13,145 B of extra headers across 55 additional grants, saving **73,799 B per unit**.

Three paired fresh-process samples per cell, alternating order, public c49 compiler, Linux x64 LLVM 19, CPU 2–5/quota 2, 3 GiB/swap 0, original program byte limits. Columns give original → eight-slot mean. MB is decimal. Time includes reference evaluation, formatting and close.

| Units × bodies / workers | Joined MB | Peak charged MB | Peak RSS KiB | Wall / CPU seconds |
|---|---:|---:|---:|---:|
| 1 × 16 / 1 | 7.387→7.314 | 76.84→76.84 | 136249→136203 | .443/.420→.470/.450 |
| 1 × 16 / 2 | 7.387→7.314 | 81.06→81.06 | 141313→141276 | .530/.540→.530/.537 |
| 4 × 16 / 1 | 29.430→29.135 | 98.88→98.66 | 160359→160191 | 1.603/1.547→1.590/1.523 |
| 4 × 16 / 2 | 29.431→29.136 | 161.01→159.55 | 242125→241901 | 1.107/2.003→1.120/2.007 |

The initial single-unit serial compile interval rose 6.9%. Four further serial pairs had wall deltas of +2.4, −0.5, −1.6 and −62.8 ms. A repeatable slowdown was not established. The scope of the result is retained charge. Both ordinary profile executables were 2,397,264 B. All 32 ordinary processes compared complete source/import/Foundation artifacts, evaluated both literal 42 results per unit and closed successfully. Both joined censuses passed. Five focused CTests passed for page reuse, seeded transitions, concurrent stage publication, component budget and stage-result faults, including denial/retry, finalization and zero owners. The two initial observer syntax errors are preserved with their corrections.

**Cloud handoff.** To check the cost on a dense private stage, reproduce `tower-frontend-units-profile scaffolding 4 2 16 dependencies uniform artifacts DIR` using the parent and this change, then compare one many-body unit at the same widths. Check canonical output, grants, peak charge, wall/CPU and RSS before extending the page policy. Deck raw source, builds, per-page and per-role rows, timing pairs and logs are in `build/d2_ecs/raw_retention_ccc67853/` (`obs.sh`, `pairs.sh`, `paired.tsv`, `confirm.sh`, `stage8_checks.log`). No full-host scaling or release result is claimed.
