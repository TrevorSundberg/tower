# Complete combined Linux x64 development candidate

**39 actual binaries match across Gen1/2/3; all 57 payloads plus SHA256SUMS match across Gen2/3. All 77 package checks pass.** No production repair or public-pin change was needed.

- Frozen published source `03e344d24cda60a31765b974348081fb1b2e022b`, tree `40d53c13732e5b216e77292cb14aefc9d464a1a5`; source/build ancestry verified. Immutable LF snapshot, all 1291 provenance source hashes and empty before/after source patches verify.
- Followed [611 generation procedure](compiler_generation_6117723b.md). Gen1: `env -u TOWER_BOOTSTRAP_COMPILER TOWER_NATIVE_BUILD=/cache/generation_03e344d2_r3/gen1_build TOWER_BUILD_JOBS=2 bash playground/scripts/build-native.sh -DTOWER_COMPILER_JOBS=1`; checked-in public predecessor SHA256 `04ae22d0e73e3674e43895ea2d1efc13da8b7a6b4704df5815369490e6fcfc47`.
- Gen2/3 used verified complete predecessors at the same `successor_build` path; each generation completed 53 dependency actions. Gen2's complete build was copied/hash-verified before clean. Native package volume `a2-final-native-r2-packages/generation_03e344d2_r3` preserves atomic publication; no Windows bind-mount packaging or vendor rebuild.
- Actual inventory: 31 top-level objects, one archive, three executables, four configure probes; all 39 compared by hashes and full bytes. Gen2/3: 46 Tower resources, nine runtimes, compiler and LLVM license, 11293548 B payload. Required types/Foundation syntax/work_gate/graph_components/foreign grammar resources verified.
- Raw Gen1/2 runtime ModuleID build-path differences and Gen2/3 development-manifest predecessor-path differences remain in `logs/*payload.diff` and `logs/*provenance.diff`. No normalization: complete payload/SUMS convergence does not claim identical provenance documents.

| Delivered identity | SHA256 |
|---|---|
| All three compilers, 2303472 B / 0755 | `160a5a20ed1c97bb473d177ef064391c120fb247cdaff3a2c379b17a697f5ff1` |
| generation3.tar.gz, 2757102 B | `5824798bce66ce4c79758874195d17717b524fa3154637c4003febe81b545b32` |
| Gen3 development.json | `e3a2544cca4165c19552e95cba6f388c97b91baafe59ef60ed4e0113ba75d52f` |
| Gen2/3 SHA256SUMS | `5c7b60985eb3d72e88c9b278f1a414ebbb3fdd4a14dd746d7d98887c934566f2` |
| LF source_snapshot.tar, 36362240 B | `0374f2860cdad05b58ce76e48959aa89cc214d9292593ba36b299d3b44ef827e` |

- Fresh checks: 21 development per generation plus 14 expected-missing-Clang controls, 77 total; Gen3 relocated into a fresh path containing spaces. Original diagnostics, guards, repeated object bytes, imported-grammar Graph/Fast/native ABI42 and cleanup assertions passed. No skipped case or unexpected build/test failure.
- Ten actual Linux object symbol closures and current exact-policy/rejection fixture passed. Original 16/1000-function complete objects match reference hashes `cdc5a6ec0f2b12f1f7a622f45a27859e374558867df97470c8120cd81ddfb407` / `ae9e824d75213b15baa1811f9ec4db04a2f044cce25746d291b888c7952f4e08`; native output exactly 15/999, exit0 and empty stderr.
- Packager/verify_compiler and host object reused only after full dependency blob equality. Initial old-policy source equality failed because published allowlist/test ordering differed; raw diff retained. Current policy fixture then verifier rebuilt through public04ae, with no exemption added. Verifier SHA256 `ed548b11478113537699a68a32d70858ae75cfe73d21b2437f3f335937b22244`; compile/link diagnostics checked.

| Measured phase | Wall s | Waited-child CPU s | Maximum child RSS KiB |
|---|---:|---:|---:|
| Gen1 / Gen2 / Gen3 build |66.306 /65.755 /63.199|73.523 /72.959 /72.539|867260 /867944 /867176|
| Gen1 / Gen2 / relocated Gen3 development |5.937 /5.976 /7.735|5.920 /5.964 /6.289|186528 /185536 /187088|
| Relocated expected-missing-Clang |5.939|4.773|185740|
| Small / large object controls |.439 /.563|.322 /.445|170892 /190384|

- KinmenA Linux x64/Ubuntu24, LLVM/Clang19.1.1, CMake3.28.3/Ninja1.11.1 Release; CPU0-11/quota12/24GiB/swap0, outer2/compiler1. One build family cgroup peak 1509953536 B, limit/OOM counters0. Phase RSS is maximum waited-child RSS, not summed concurrent RSS; cgroup checkpoints are cumulative, not independent peaks. These are validation costs, not speedups.
- Delivery: [generation_03e344d2_r3](C:/Sandbox/build/codex_ecs_20261122/A2/generation_03e344d2_r3/), with `DELIVERY.json`, `SHA256SUMS`, `manifest_summary.json`, `manifests/generations.json`, exact recipes, `checks/`, `symbols/`, `policy/`, `observations/`, `costs.csv` and logs. Full raw builds remain in `A2/cache/generation_03e344d2_r3`; peer_metadata.tar.gz is a compact evidence copy.
- Read-only archive/source transfer hashes independently checked on Windows; fresh archive extraction matches all 188 files and compiler0755. All three complete builds/packages retained. Both owned containers exited0/PID0; disk329.6 GB free, four stashes/todo and old611/03e timing artifacts preserved.
- Current compiler exactly matches the accepted [03e ordinary performance CLI](compiler_combined_performance_03e344d2.md); prior measurements and A1's source-bound native acceptance remain separate evidence, not reruns. Documentation reconciliation retains this exact compiler/source boundary.
- Requires host LLVM19/Clang and 19 recorded dynamic-dependency entries. Expected-missing-Clang controls do not pass standalone release; generated other-host runtimes do not establish execution acceptance. ROOT/D1 independent review, B1 clean-default adoption and ROOT pin/deployment remain downstream; no browser/sanitizer/full-native repetition.
