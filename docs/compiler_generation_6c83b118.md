# Complete native development generations after the scratch fix

**39 actual binaries match across Gen1/2/3;57 payloads plus SHA256SUMS match across Gen2/3, byte-for-byte.** All requested package checks pass. This is a Linux x64 development candidate; public-pin adoption remains ROOT-owned.
Frozen published `6c83b1189f6931359126102103b74b5ba1e80ff5`, tree `049bfb59b5ddab77925ac05ba7969436fc3d4693`, includes `bd86046f` semantic scratch-memory policy. No source edits/pulls during builds; 2026-11-24 UTC.
Gen1 uses default public44ae/ca1 with override unset. Gen2/3 use preceding complete, verified packages only in isolated successor tests. All three builds complete53 dependency actions at outer4/compiler1; no private candidate is adopted as a release.
Delivery: `C:/Sandbox/build/codex_ecs_20261122/A2/current_generation_6c83b118/generation3.tar.gz`,2,528,600B. Compiler2,299,088B/mode0755;57 payloads total11,287,988B. Complete executable/resources, license, development.json, build/source evidence and usage accompany the archive.

| Identity | SHA256 |
| --- | --- |
| Public Gen1 predecessor | `44ae8f731d8991e5cd063e86512923ac5f9c1bd151943c8f235ee4025de11c44` |
| towerc, all generations | `31a385c616b889987d68f8eb9714020f3928aac97591a1569f905ab706f52ed6` |
| Delivered generation3.tar.gz | `8a32761f348680dc4ad5d550045ace6d86ce3ca3ddc1452e811a1c1a33d9b17a` |
| Gen3 development.json | `d104f4fbf2b68d0b925162ff91dbd98f342680955658fdb3ca623f3ce6040f4c` |
| Gen2/3 SHA256SUMS | `6ca96a20d86d2ae7f10b976354be303e2def84395ee0ab7c1a5978bb53b0c648` |
| Source archive | `06304df18d491eed9c2139be8308a37bf2778dc3e09eb88a957e848f838e58ed` |

Reused [59d](compiler_generation_59d7dc9e.md)/[ca1](compiler_generation_ca1c893e.md) workflow: `env -u TOWER_BOOTSTRAP_COMPILER TOWER_NATIVE_BUILD=.../gen1_build TOWER_BUILD_JOBS=4 bash playground/scripts/build-native.sh -DTOWER_COMPILER_JOBS=1`. Subsequent commands retain their explicit complete predecessor path in provenance.
Actual inventory derives31 objects,1 archive,3 executables and4 configure probes; no new target/member relative to ca1. Both hashes and `cmp` cover every binary. Gen2's entire build is copied and verified before CMake clean; Gen3 uses the identical successor path. Unchanged CMake configure probes survive clean, explicitly included in comparisons.
Gen1's nine runtime IR ModuleID path comments and consequent checksums differ; raw diffs remain. Gen2/3 original development.json differ only in their actual predecessor command path. Neither difference is normalized into equality.
All1284 provenance source hashes and1366 broader inputs remain frozen. Published LF archive bytes produce empty source.patch/source_after.patch. Extracted predecessor0775 is set to0755 without byte changes; the absent archived LLVM submodule license is supplied from verified public payload SHA8d85c1057d742e597985c7d4e6320b015a9139385cff4cbae06ffc0ebe89afee.
Type prelude, Foundation syntax, work_gate, graph_components, host runtimes and optional foreign grammar are present. Current Tower package_bootstrap/verify_compiler/verify_bootstrap_symbols tools are public-pin built; exact tool hashes, command lists, depfiles, generated-input hashes, flags and CMake caches are retained.
Strict actual native symbol policies pass for all10 supported units; the unchanged Tower exact-policy/rejection fixture passes. No source patch, relaxed wildcard, ignored symbol or new fallback.
Current verify_compiler passes21 development checks for each generation and14 expected-missing-Clang checks in fresh relocation: **77 checks**. Imported grammar Graph/Fast print42; native ABI independently executes42, with actual `_ZN15foreign_fixture9incrementEi` and `foreign_twice` exports recorded.
Windows rehash verifies16 transferred archive/source/tool/fixture/control files. A fresh network-none container has no original source/cache, extracts to `/tmp/A2 6c83b118 complete package`, verifies every member/mode before and after, and uses adjacent resources without overrides.
Existing small16/large1000-function inputs emit objects identical to saved independent references and native outputs exactly15/999. No reduced input, raised cap, implementation change, build/check failure or skipped check; original earlier-task failures stay preserved.

| Successful phase | Wall s | CPU s | Peak process/child RSS KiB |
| --- | ---: | ---: | ---: |
| Gen1 / Gen2 / Gen3 build |43.190 /42.863 /40.066|79.980 /79.392 /79.629|893208 /880820 /879720|
| Gen1 / Gen2 / relocated Gen3 development |6.826 /6.825 /6.263|6.372 /6.351 /6.268|190556 /190144 /190180|
| Relocated expected-missing-Clang |4.661|4.714|190080|
| Small / large object control |.324 /.440|.317 /.433|174540 /194764|

KinmenA Windows/WSL2 Ubuntu24/LLVM-Clang19.1.1/CMake3.28.3/Ninja1.11.1, CPU0–11/24GiB, one sequential family; process profiler includes waited-child CPU/high-water RSS, not concurrent sums. Build-family cgroup peak2,304,741,376B; isolated relocation158,846,976B, limit/OOM events0. These n1 acceptance costs are not predecessor speedup/scaling claims.
Raw `A2/cache/generation_6c83b118/{logs,manifests,checks,gen1_build,gen2_build,successor_build}` remains complete; delivery includes checksummed logs/manifests, generation checks, relocation, controls, source snapshot and README_CANDIDATE. Initial/final free disk335.97/335.30GB; no cleanup, owned jobs drained, stashes/todo preserved.
Requires installed LLVM19/Clang and the exact dynamic requirements in development.json; restricted standalone release remains unpassed. No repeated64/type/query/profile/native-platform/browser/instrumentation/deployment operation. ROOT owns independent default/public-pin and final integrated release adoption; later source remains outside this freeze.

Integration: receipt `4ae83a39` preserves published `45b78c48` through merge `0700d1fb0abdf8f57a23c64318f27fe6a58bcc0b`. Compiler/library/backend/host/bootstrap blobs remain identical to the freeze. Incoming storage-only registrations/fixtures (disabled in these builds), target-pack triple transport and owner receipts are preserved but excluded from this candidate's source manifest and execution claims. No generations repeated; ROOT decides adoption.