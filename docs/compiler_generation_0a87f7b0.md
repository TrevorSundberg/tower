# Complete native successor for component-first allocation

**39 actual binaries match across Gen1/2/3; all57 payloads plus SHA256SUMS match across Gen2/3, byte-for-byte. All77 requested package checks passed.** This is a development candidate; ROOT retains pin/default-adoption/deployment ownership.
- Freeze `0a87f7b0832a58158da9677c51b9799775f382f8`, tree `f7b27dc189b0d908dea7221db4c2d1b1afa85f06`, includes75eba778/bb72b8c5:40-byte EntityComponent and component-first standalone allocation. No optimization or production edit in this batch.
- Compiler/library/bootstrap trees: `cb12d9e9e59ff6529371950a42b65ad2cae7a199` / `04b93a24ada98384f72ada097760806fd933f4b3` / `4a3074e80675a08542af7645efe8a9a640e719d1`. Immutable LF Git archive inputs stayed fixed through all builds/packaging; later producers are excluded.
- Gen1 used the complete checked-in default31a385c6 with `TOWER_BOOTSTRAP_COMPILER` unset. Gen2/3 used only the preceding verified complete executable/resources as explicit successor-test overrides, never public adoption.
- Exact Gen1 command: `env -u TOWER_BOOTSTRAP_COMPILER TOWER_NATIVE_BUILD=/root/.cache/tower/l1_generation_0a87f7b0/gen1_build TOWER_BUILD_JOBS=2 bash playground/scripts/build-native.sh -DTOWER_COMPILER_JOBS=1`, from the frozen source directory. All53 dependency actions completed in each generation; no duplicate leaf/compiler/vendor build.
- Actual inventories derive31 top-level objects,1 archive,3 executables and4 configure probes; membership equals6c83. Every binary has both hash and full-byte comparisons across all three generations. Gen2's complete build was copied and hash-verified before the existing clean target; Gen3 reused that successor path. Surviving configure probes remain in the comparison.
- Gen1's nine runtime IR ModuleID comments name its distinct build path and change their checksums. Gen2/3 development.json differs only in the actual predecessor command path. Full raw diffs/commands remain; no byte normalization or filtering into equality.
- Package membership remains57 payloads: executable,46 Tower resources,nine generated runtimes and LLVM license; checksum file is additional. All payload hashes, required types/Foundation syntax/work_gate/graph_components/foreign grammar,0755 compiler mode and archive extraction were verified. Total payload11288192B; compiler2299088B.

| Identity | SHA256 |
|---|---|
| Gen1 public predecessor | `31a385c616b889987d68f8eb9714020f3928aac97591a1569f905ab706f52ed6` |
| Compiler, all three generations | `0f9220edff0c2ec90eefab0d5814cdbc2adaa8b2bb6fdd896231fcb04e878bd0` |
| Delivered generation3.tar.gz,2671813B | `0fffb93b33831ac1396e60a4d5896ff0146fdab34042edede74a6dbed00b7d02` |
| Gen3 development.json | `eabe2aebc7947260af08ce8f025a5fe5b9691e3a726f2c15f432e5f7454be8bd` |
| Gen2/3 SHA256SUMS | `8a82f32c13963f999ded17522d448779a8d1b210ca85a85667845b275fd4ec33` |
| LF source_snapshot.tar | `ec4f91c1643a8ec08318cb4c9c2679d232620ec4532adbad0e2756af97a99d1d` |

- Current Tower package_bootstrap/verify_compiler/verify_bootstrap_symbols built through public31a. All1285 recorded source hashes independently match the extracted LF archive;1368 broader input hashes (including Docker/scripts/bootstrap) remain fixed. Source patches before/after are empty. The archived public executable was chmod0755 without byte change; verified public LLVM license supplies the absent submodule license file.
- Each generation passed21 development checks; Gen3 ran from `relocated complete generation three`, then passed14 expected-missing-Clang controls:77 total. Existing checks assert literal42, repeat object bytes, exact negative diagnostics and native linkage; failed expected invocations and outputs remain raw. Clean child environment/isolated copied fixtures, not OS namespace isolation.
- Imported optional grammar Graph/Fast and actual linked native ABI all produce42. The independent quoted-name caller consumes `_ZN15foreign_fixture9incrementEi` and `foreign_twice`; both actual exports retained. No duplicate inline grammar or reader fallback.
- All10 strict native symbol closures and the existing exact-policy/rejection Tower fixture pass. Small16/large1000-function object bytes equal saved independent references; linked executables return0, print exactly15/999 and have empty stderr. No reduced input, changed policy, cap increase, unexpected build/check failure or skipped check.

| Phase | Wall s | CPU s | Peak process/child RSS KiB |
|---|---:|---:|---:|
| Gen1 / Gen2 / Gen3 build |57.41 /57.65 /54.14|95.22 /95.16 /96.30|881060 /862716 /862364|
| Gen1 / Gen2 / relocated Gen3 development |7.64 /7.63 /7.52|7.87 /7.86 /7.86|188204 /188972 /188436|
| Relocated expected-missing-Clang |5.76|6.06|188288|
| Small / large object controls |.44 /.64|.43 /.63|173664 /193348|

- Ubuntu24/LLVM-Clang19.1.1 WSL2 Orchestral-Revng, CPU0–3,4GiB/no-swap family, outer2/compiler1, one sequential owned cache. GNU-time measures actual waited-child CPU/high-water RSS, not concurrent sums. Build scope peaks1693020160B Gen1 and1909878784B successors; package/tools573255680B, final checks209752064B. Limit/OOM counters0. These n1 acceptance costs are not speedup/scaling evidence.
- Delivery: `C:/Sandbox/build/codex_ecs_20261122/L1/current_generation_0a87f7b0/generation3.tar.gz`, read-only, Windows rehash and extracted complete-file/mode verification passed. Compact evidence/provenance accompany the archive; source archive, full logs, checks, symbols, observations and costs.csv are alongside it. Raw cache `/root/.cache/tower/l1_generation_0a87f7b0/` retains all builds and preceding packages.
- Initial PowerShell metadata call rejected an unquoted Git tree argument; corrected before building, with exact quoted identities retained. No passing build/check was restarted. Disk remained~90GiB free on Windows/~922GiB on WSL; owned jobs drained, public pin/todo/main build outputs untouched.
- Requires system LLVM19/Clang and19 recorded dynamic dependency entries. Generated foreign runtimes are not non-Linux execution acceptance; missing-Clang success explicitly does not pass restricted release. No integrated64/pages, browser, generations for other hosts, sanitizer or deployment repeat. ROOT must independently adopt/pin this frozen candidate; later main is not relabeled as its source.
