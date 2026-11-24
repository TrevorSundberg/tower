# A2: large target64 native reconstruction and second normalization

Receipt root `E = C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/large64_d962222a`.
Frozen published source `d962222af10bb062a1ad18c7beb8531ed00dc7ee`, tree `a911c7fb8b00c1c1a647caa48fdda47a2d391329`; no production/test edits. Actual repository `scaffolding/tests/entity_pages.tower` and `entity_stage_ownership.tower` are snapshotted in E with original hashes and import depfiles.
KinmenA Windows11/Docker Linux x64, LLVM19, production allocator, CPU0–11/24GiB, one existing A2 cache. Existing public bootstrap SHA256 `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`; three affected link actions refreshed once, 18.195wall/7.469CPU seconds/499536KiB.
`run.sh` and `acceptance.sh` retain exact commands. Fresh canonical generation uses CLI `--target wasm64-unknown-unknown --emit foundation`; reconstruction uses explicit width8, optimized profile, workers1/4. Both retained LLVM files declare pointer64 and `wasm64-unknown-unknown`. Earlier target32 requests were not reused.
Binary hashes, link commands, 31 object/archive hashes, 24 direct build-input hashes and 468 Tower dependency hashes: `native.sha256`, `link_commands.txt`, `linked_objects.sha256`, `build_inputs.sha256`, `dependency_sources.sha256`; generated inputs without their own Tower depfile are identified separately in `metadata.txt`.
Source probe SHA256 `6d59b3d1ec6cb351adb98bab5c0a6de22830f511746ad7ecc8fea14294cd22a7`; execution runner `57ed7f198164be332535a2790d1eb687285e8526182d23f481e648251d273ae6`; CLI `797e8a034b1ad41498ef19f5873cbf16ed1b6c64ac06c093814ce688f29f46c0`.

| Fixture | Fresh canonical64 bytes / SHA256 | Optimized returned Foundation bytes / SHA256 |
| --- | --- | --- |
| entity_pages | 977812 / `e68e7d86902d0cbd7be985d51c9c20f7d67afb293397be3d83bfe75e4c238453` | 1318427 / `c9c668b8c4b1bab06d356efdb254ded1a08d741d5b47c0ec7d7f09eff254abed` |
| entity_stage_ownership | 958950 / `72013c829fd9dbe6a3963c3b6f9ac4cd3ecfe4a144282216fe365e15a9fd686f` | 1306888 / `04458ec98095cba116b144f94cda3befd71910e18d4ec3c081a5d19a616527a0` |

Both fixtures pass optimized reconstruction and canonical recheck at workers1/4: four requests, byte-identical returned Foundation and LLVM per fixture. Every request ends with resourceNone and bytes/grants/lanes0. First optimized IR sizes are610240/602193B; second-normalization IR sizes600741/595600B. Complete source/canonical/LLVM/result/native hashes and sizes are in each `*.artifacts.sha256` and `*.sizes.txt`.
Direct canonical and optimized-result execution passes Graph/Fast×workers1/4 for each fixture: four selections, sixteen configurations, exact terminal `0\n`, identical canonical text and checked zero world owners. Existing `backend-pointer-execute` supplies its explicit100000000 fuel; its2GiB world budget is unchanged.
CLI Fast separately normalizes each optimized64 result again (`--interpret-fast --optimized-ir`, jobs1/4): four successful processes, exact `0\n`, identical second LLVM per fixture. This is additional evidence beyond direct Fast.
Existing CLI native x64 emission/linking from each original repository path succeeds; both independent native executables exit0 and print exactly `0\n`. No separate backend/reference implementation was introduced.
Reconstruction peak charged bytes, workers1/4: entity_pages506795342/506794566; entity_stage_ownership502918289/502917513. Ledger metadata20971520B is retained until disposal; final owners0. The existing24GiB reconstruction ledger excludes LLVM/allocator internals and is not a process cap.

| Trial | entity_pages wall / CPU s / peak KiB | entity_stage_ownership wall / CPU s / peak KiB |
| --- | --- | --- |
| Canonical64 generation | .972 / .713 /232648 | .963 / .695 /231588 |
| Optimized reconstruction, workers1 | 2.906 /2.829 /639172 | 3.237 /3.162 /635368 |
| Optimized reconstruction, workers4 | 2.625 /3.389 /659280 | 2.582 /3.345 /653232 |
| Direct canonical Graph/Fast, workers1/4 | 3.011 /3.478 /415640 | 2.704 /3.176 /411784 |
| Direct optimized Graph/Fast, workers1/4 | 7.356 /8.255 /679460 | 6.197 /7.117 /676780 |
| CLI second normalization, jobs1 | 3.849 /3.768 /750324 | 3.860 /3.773 /745308 |
| CLI second normalization, jobs4 | 3.232 /4.053 /761480 | 3.229 /4.063 /757772 |
| Native x64 compile / execute | 1.597 /1.329 /245136; .00438 /.00196 /1612 | 1.572 /1.305 /244420; .00394 /.00165 /1636 |

Each row is one bounded process measurement, including waited child CPU; peak RSS is maximum child usage, not a simultaneous process-tree sum. These are acceptance costs, not before/after speedups. The cache was reused; no deliberate cache flush. Per-command `.log`, `.time`, `.status` preserve outputs and actual exits; final `acceptance_transport.status` is0.
Preserved failed harness invocation: feeding raw `entity_pages` source to the canonical execution helper loses its entry filename, so relative `../host/memory` resolution fails under synthetic `module_body_type_input.tower`, then its assertion exits134 (.739wall/.435CPU/162828KiB). `entity_pages_direct64_source.*` and original `transport.status=134` remain failures; raw-source helper execution is not claimed. The ordinary CLI had already resolved that source correctly; the helper subsequently received the freshly generated canonical input it supports. Original source execution is independently covered by the native executable.
The first metadata-only pass mishandled absolute `/cache` object paths; partial hash files remain preserved, and corrected records are explicit. No compiler error was hidden or repaired, no optimization/fuel/memory limits were relaxed, and no assertions or fixtures changed.
No target32 matrix, reactor/browser build, generation, sanitizer or deployment ran. Source-language/host instrumentation gaps and the service-blocked gate remain open; native64 results do not establish browser/wasm32 memory acceptance or universal race freedom. ROOT owns integrated artifact adoption/release. Documentation-only profiling changes are inapplicable; actual acceptance costs are above.
All four stashes and previous logs remain intact. Final publication reconciliation, with this fixed evidence boundary, is recorded once in A2 status.
