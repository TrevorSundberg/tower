# Retire a completed unit’s parser and import snapshots

At `7388dcd309df724a9b70911bd675fb4d262c47d6`, a successful one-shot compile kept its idle parser and cloned import graphs until batch close. Releasing them at frontend completion saves **5,560,338 charged bytes per serial unit** on the measured inputs. A queued unit can use that capacity while callers still borrow the earlier program.

`module_session_release` parks the parser on the private environment. `module_cache_store` clones cacheable import graphs, copies roots and retains declarations so the same environment can parse again. Once `frontend_compile_sources` returns to `frontend_unit_compile`, this unit has completed its only compile. It now calls the existing `frontend_modules_reset_compilation` on success, before signaling completion to the coordinator or backend. Program roots, source-location references, depfile names, explicit inputs and the world remain separately owned. Inspection, retained-world compilation and failed-unit diagnostics keep their existing lifetimes. [Unit service](../scaffolding/compiler/frontend_units.tower) · [Module owners](../scaffolding/compiler/frontend_modules.tower)

**Direct attribution.** In one serial 16-body unit, the live charge fell from 12,947,672 B to 9,488,043 B on destroying the idle session, then to 7,387,334 B on destroying four cached graphs. The two releases returned 3,377 and 2,582 grants. The session destructor drops version/table pins, inputs, highlights and scratch. The same two deltas occurred at 64 bodies. At two workers the respective single-unit deltas were 3,456,549 B and 2,100,709 B. These are changes in shared physical reservations, including pages actually retired.

The joined 16-body world still owned 8,848 entities and 10,575 components. A walk of actual store-owned allocations found 2,864,692 B of component pages, 2,690,877 B of descriptor/name pool pages, 365,672 B of table rows/columns and 767,552 B of kind indexes. Program/root release left 4,346,818 B, environment destruction left the same charge, grammar clear left 813,433 B and world disposal left 41,381 B in batch owners. Close reached zero live bytes/grants/lanes before disposing separate ledger metadata. These release deltas depend on ownership order. The existing declaration page policy and shared worker budget apply throughout. [Prior page census](compiler_ecs_declaration_pages_5b9194e4.md)

**Ordinary runs.** Each cell gives old → repaired. Joined and peak charges are decimal MB. RSS is whole-process KiB. Wall/CPU are whole-process seconds including formatting and close. Values are means of two fresh processes per arm, with order reversed in the second pair. All source, imported helper and canonical Foundation bytes were compared. Both `answer()` and `body_0(36)` returned 42 per unit.

| Units × bodies | Workers | Joined MB | Peak charged MB | Peak RSS KiB | Wall / CPU s |
|---|---:|---:|---:|---:|---:|
| 1 × 64 | 1 / 2 | 17.96→12.40 / 17.96→12.40 | 76.84→76.84 / 81.07→81.07 | 136204→136066 / 141210→141030 | .490/.470→.505/.480 / .575/.590→.565/.580 |
| 2 × 32 | 1 / 2 | 28.95→17.83 / 28.95→17.83 | 91.30→85.74 / 152.49→153.19 | 152804→146260 / 226282→224328 | .910/.870→.770/.735 / .530/.955→.505/.915 |
| 4 × 16 | 1 / 2 | 51.67→29.43 / 51.66→29.43 | 115.56→98.88 / 178.03→166.01 | 179166→160362 / 253988→241408 | 1.400/1.345→1.360/1.310 / .915/1.680→.895/1.665 |
| 1 × 16 | 1 / 2 | 12.95→7.39 / 12.94→7.39 | 76.84→76.84 / 81.06→81.06 | 136198→136092 / 141098→140760 | .410/.390→.420/.400 / .490/.500→.490/.495 |
| 2 × 16 | 1 / 2 | 25.86→14.74 / 25.85→14.74 | 89.75→84.19 / 154.24→152.22 | 151064→144660 / 225202→223810 | .735/.700→.740/.715 / .500/.900→.515/.945 |

**Fixed bytes and phase boundaries.** The ordinary fixed-64-body rows repeat a small wrapper/import per unit. A separate observer also held aggregate explicit input at exactly 8,192 B by padding trailing whitespace, counting the 333-byte import once per world. All six shape/worker cells per arm kept their unpadded canonical bytes. In the four-unit case, synchronized batch charges in MB were:

| Boundary | One worker, old → repaired | Two workers, old → repaired |
|---|---:|---:|
| Inputs admitted | .075→.075 | .075→.075 |
| Baselines installed, entering source parse | 56.32→39.64 | 61.01→49.89 |
| Source parse complete | 106.43→89.75 | 159.81→149.98 |
| Lowering pump exit | 92.66→75.98 | 133.61→122.49 |
| All joined / explicit close | 51.67→29.43 / 0 | 51.66→29.43 / 0 |

Phase rows use the last sampled callback of that kind. Another world may be at a different phase. Building the grammar still produces a peak within a single world. Its serial 16-body high-water rose from 72.32 to 76.84 MB during LR lookahead, before output retirement. Two-worker multi-unit runs observed two distinct overlapping outer workers. Charged peaks, separate ledger slot capacity and process RSS measure different things. The Deck results support earlier retirement and locate continuing parse pressure, without extrapolating peak savings or throughput to B1’s 8/32-worker host. [Full-host baseline](compiler_combined_r5_bf9429d9.md)

**Validation.** Linux x64, public c49 compiler `77f23db6`, LLVM 19, CPU 2–5/quota 2, 3 GiB, swap 0, native allocator and unchanged profile byte limits. 82/82 profiles passed, including 40 ordinary paired processes, plus five focused CTest registrations covering finite denial/retry, cancellation/drain, streaming backend, retained imported-leaf edits and dependency continuations (47.30 wall/61.80 CPU s, 923,728 KiB). The new retirement assertion failed at the intended site with the original provider (134). Temporary observer setup errors were an implicit time conversion, an output-directory collision and duplicate helper exports. Only the isolated Tower measurement function was linked on the corrected diagnostic run. Timing uses ordinary binaries. Final native/hosted release validation remains with ROOT.

Deck evidence under `build/d2_ecs/unit_retention_7388/` includes `ordinary.tsv`, `phases.tsv`, `identities.sha256`, complete artifacts, commands, probe source, before/after binaries and original failure logs.
