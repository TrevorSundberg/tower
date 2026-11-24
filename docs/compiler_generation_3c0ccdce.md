# Complete r4 Linux x64 development candidate

**39 actual binaries match across Gen1/2/3; all 57 payloads plus SHA256SUMS match across Gen2/3. All 77 package checks pass.** No production repair or public-pin change was needed.

- Frozen published source `3c0ccdce9704cb2020d0a3df0b11235f10af1711`, tree `9d3aac3ba80c99f3709d50765da73b20eb3df590`; source/build ancestry verified. Immutable LF snapshot, all 1291 provenance source hashes and empty before/after source patches verify. Memory4c38796d and LR e9363377 are included; scheduler candidates remain reverted.
- Reused the [03e generation procedure](compiler_generation_03e344d2.md). Gen1: `env -u TOWER_BOOTSTRAP_COMPILER TOWER_NATIVE_BUILD=/cache/generation_3c0ccdce_r4/gen1_build TOWER_BUILD_JOBS=2 bash playground/scripts/build-native.sh -DTOWER_COMPILER_JOBS=1`; checked-in public predecessor SHA256 `160a5a20ed1c97bb473d177ef064391c120fb247cdaff3a2c379b17a697f5ff1`, complete resources verified.
- Gen2/3 used verified complete predecessors at the same `successor_build` path; each generation completed 53 dependency actions. Gen2's complete build was copied/hash-verified before clean. Native package volume `a2-final-native-r2-packages/generation_3c0ccdce_r4` preserves atomic packaging; old packages/builds remain intact.
- Actual inventory: 31 top-level objects, one archive, three executables, four configure probes; all 39 compared by hashes and full bytes. Gen2/3: 46 Tower resources, nine runtimes, compiler and LLVM license, 11300376 B payload. Required types/Foundation syntax/work_gate/graph_components/foreign grammar resources verified.
- Raw Gen1/2 runtime ModuleID/build-path differences and Gen2/3 development-manifest predecessor-path differences remain in `logs/*payload.diff` and `logs/*provenance.diff`. Nothing normalized; payload/SUMS convergence does not claim identical provenance documents.

| Delivered identity | SHA256 |
|---|---|
| All three compilers, 2308056 B / 0755 | `745afa2fcb983c289d02331f9a8b77f5e6a5da1900d05a6ade13feacfd8b1cd2` |
| generation3.tar.gz, 2759417 B | `4b9e6959fcd30e2d7618bf953dbf45ff08cfe304641543101821affcc87cfc74` |
| Gen3 development.json | `905326fd229445295b72e3ff2f5042cd0b8217f575690e1892e2334b1801f4aa` |
| Gen2/3 SHA256SUMS | `0e1e977742641ab65675bcb62243fa8370204bdd10808eaff628b05a8a97abdd` |
| LF source_snapshot.tar, 36577280 B | `78d1b5c1c134692a60b0aa82e5cc3d7ffa1be411ccea6915dfad8d7ebd3a8669` |
| Metadata-only peer_metadata.tar.gz, 563232 B | `a96f3afac04c741c2d896c3e9fbf0044e046fcf38cb5bb4ca52c38097b90b288` |

- Fresh checks: 21 development per generation plus 14 expected-missing-Clang controls, 77 total; Gen3 relocated into a fresh path with spaces. Original guards, diagnostics, repeated object bytes, imported-grammar Graph/Fast/native ABI42 and cleanup assertions passed. No skipped case or unexpected build/test failure.
- Ten actual Linux object symbol closures and the exact-policy/rejection fixture passed. Original 16/1000-function complete objects match references `cdc5a6ec0f2b12f1f7a622f45a27859e374558867df97470c8120cd81ddfb407` / `ae9e824d75213b15baa1811f9ec4db04a2f044cce25746d291b888c7952f4e08`; native output exactly 15/999, exit0 and empty stderr.
- Packager/verifiers/policy fixture reused only after actual dependency-blob proof (67 recorded entries); no vendor/tool rebuild. Exact tool hashes, commands, flags and diagnostics are retained. Fresh roots avoided restored-mtime stale objects.

| Measured phase | Wall s | Waited-child CPU s | Maximum child RSS KiB |
|---|---:|---:|---:|
| Gen1 / Gen2 / Gen3 build |66.659 /65.888 /62.178|74.308 /72.988 /70.798|866460 /818344 /818916|
| Gen1 / Gen2 / relocated Gen3 development |5.678 /5.728 /7.528|5.670 /5.741 /6.058|181884 /182052 /183384|
| Relocated expected-missing-Clang |5.737|4.566|182748|
| Small / large object controls |.421 /.541|.307 /.426|167584 /186324|

- KinmenA Linux x64/Ubuntu24, LLVM/Clang19.1.1, CMake3.28.3/Ninja1.11.1 Release; CPU0-11/quota12/24GiB/swap0, outer2/compiler1. One build-family cgroup peak1287360512 B, limit/OOM counters0. Phase RSS is maximum waited-child RSS, not summed concurrent RSS; cgroup checkpoints are cumulative. These are validation costs, not speedups between predecessors.
- [Delivery and raw metadata](C:/Sandbox/build/codex_ecs_20261122/A2/generation_3c0ccdce_r4/) contain `DELIVERY.json`, `SHA256SUMS`, `manifest_summary.json`, `manifests/generations.json`, exact recipes/checks/logs/modes/costs. Full 39-binary sets remain under `A2/cache/generation_3c0ccdce_r4/{gen1_build,gen2_build,successor_build}`; peer metadata explicitly excludes generated binaries.
- Windows independently verified seven delivered hashes; read-only archive/source transfer and fresh extraction match all 169 files and compiler0755. Both owned containers exited0/PID0; disk328.6 GB free. Four stashes/todo and old native/performance artifacts preserved. An external PowerShell array-index serialization mistake produced null summary counts; original JSON retained and corrected against unchanged manifests, without altering archives or rerunning checks.
- Compiler bytes independently match B1's [current ordinary CLI](compiler_combined_performance_3c0ccdce.md). A1's later test-only `entity_create_faults.tower` repair b432fdae and [native acceptance](native_combined_3c0ccdce.md) are separate: excluded from this explicit frozen snapshot, production unchanged. Reconciliation through98624850 changes only that fixture and documentation; no runtime evidence is relabeled.
- Host LLVM19/Clang and 19 recorded dynamic-dependency entries remain required. Expected-missing-Clang diagnostics do not establish standalone release; generated other-target resources are not execution acceptance. ROOT/D1 review, B1 clean-default adoption and ROOT pin/deployment remain downstream. No browser/sanitizer/full-native repetition or new performance claim.
