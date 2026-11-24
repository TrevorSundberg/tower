# Clean native adoption of the c49 public bootstrap

**The documented build from public main reproduced all 39 Gen3 native products.** The fresh, relocated development package passed all 21 verifier checks, the two exact-object/native controls (15 and 999), and the imported foreign-grammar checks (42). No compiler or package repair was needed.

The build used published `7388dcd309df724a9b70911bd675fb4d262c47d6`, tree `e0c46b3c91e7965b1b362be9c025ac3f3a50736f`, including pin `30932ad8d975e7b30850ca94dd62a4d0d4f18093`. An LF Git archive with executable bits intact was extracted on fresh Linux storage. The pinned compiler measured 2,312,440 bytes, mode 0755, SHA256 `77f23db6124377e49dd677714aaca147d507a80f05928a71c3cc18faa0040a0c`. [Pin provenance](bootstrap_pin_c49c8b37.md)

Before compiling, the complete pin matched the delivered Gen3 archive (`7aada892f2c11066a5da00c018a8cf6352070f01c56f24ebf6b0d3534f5e78db`), including its development manifest and SHA256SUMS. All 57 payloads (11,305,096 bytes), all 1,292 source hashes against c49, and the five installed toolchain hashes verified. [Generation evidence](compiler_generation_c49c8b37.md)
An empty native directory ran `env -u TOWER_BOOTSTRAP_COMPILER TOWER_NATIVE_BUILD="$base/native" TOWER_BUILD_JOBS=2 bash playground/scripts/build-native.sh -DTOWER_COMPILER_JOBS=1`. All 53 actions completed. The verbose execution log includes 40 command lines invoking the checked-in public compiler, including the final link. The documented output copy also matched the native build directory.

| Verified output | Actual result |
|---|---|
| Native inventory from file magic and complete member comparison | 31 objects, one archive, three executables and four CMake probes. All 39 full hashes match c49, including the parser object and `towerc`. |
| Default compiler dependency closure | 434 source paths in actual depfiles, including 11 unchanged test fixtures. The default parser aggregate imports `compiler.units.parser`. The changed LR exports are selected by other profiles. None of the seven changed Tower paths appears in the default native depfiles. |
| Fresh package | 57 payloads, 11,305,168 bytes. Compiler, license and 46 authored resources match. Each of the nine generated runtimes has exactly one changed line, its build-path `ModuleID` comment (+8 bytes each). The evidence retains raw diffs and both checksums. |
| Fresh provenance | Identifies public `7388dcd3`, the actual public predecessor and 19 host dependencies. All 1,293 source entries and 57 payload hashes verified. The nine changed source records comprise two CMake registrations, test/fixture changes and the updated symbol verifier. |
| Relocated development checks | 21/21 passed under the original child guards. Eighteen children returned 0 and three expected negatives returned 1. Graph, Fast and linked native foreign execution each printed 42. The native object defines both expected C and C++ ABI symbols. |
| Native references | Objects for 16 and 1,000 functions byte-matched the delivered reference files (`cdc5a6ec…fb407`, `ae9e824d…f4e08`). Linked against the fresh adjacent Linux runtime, they printed exactly 15 and 999 with empty stderr. |

Relocation used a path with spaces and made the source/cache roots inaccessible to the verifier process. The verifier, seven isolated source fixtures, two reference inputs and complete adjacent package were hash-checked. Full native product equality resolved the c49 comparison in the single public build. [Prior adoption procedure](bootstrap_adoption_5ebde29f.md)

| Validation phase | Wall s | CPU s | Peak process RSS KiB |
|---|---:|---:|---:|
| Clean default build | 53.79 | 100.41 | 790,176 |
| Fresh packager / verifier builds | 4.08 / 0.76 | 3.70 / 0.73 | 171,612 / 163,752 |
| Packaging / relocated 21 checks | 0.81 / 6.24 | 0.25 / 6.35 | 15,436 / 166,824 |
| Small / large reference compilation | 0.32 / 0.56 | 0.32 / 0.55 | 150,200 / 159,112 |

Orchestral-Revng WSL, x86-64, LLVM/Clang 19.1.1, CPU0–3/quota4, 4 GiB cgroup, swap0. Build and retained relocation cgroup peaks were 1,672,830,976 and 302,403,584 bytes, with zero OOM events. Fresh source/native/tools/package used 50/34/2.5/12 MiB. WSL had 913 GiB free after validation. All owned services finished with PID0.
Two transport issues are recorded. A tool-cache path check incorrectly required CMake type FILEPATH where the tools-only entry uses UNINITIALIZED. The exact path and existing binaries verified and packaging resumed. The first relocated run passed, but WSL cleared its temporary directory before log collection. Only relocation and its controls repeated in persistent storage. Collection resumed past an existing depfile directory. The table uses the retained run.

[181-entry evidence manifest](C:/Sandbox/build/codex_ecs_20261122/L1/public_native_adoption_7388dcd3/evidence.sha256), SHA256 `753807609df20bc19e8c2e0582e70eaed7c2f800e33e6b25e8bbb302f41bb3f0`, covers commands, complete product/resource/provenance comparisons, depfiles, results and validation costs. Linux products remain at `/root/.cache/tower/l1_public_adoption_7388dcd3/` and the full verifier outputs at `/root/L1 relocated public 7388dcd3/`. Acceptance covers the Linux x64 development package with system LLVM/Clang.
