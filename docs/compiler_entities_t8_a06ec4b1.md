# T8 compiler entities: joined a06ec4b1 Wasm acceptance

Both unchanged selected tests **PASS completely**, each in a fresh Node process:

- `^Tower world views pin query ranges and defer ownership reclamation$`
- `^Tower generic registries belong to their programs and reclaim their types$`

The first finished before the second started. Each reports tests1/pass1/fail0,
skipped0/cancelled0 and exit0. No unstarted phase, timeout or remaining failure
in these two cases. Other filtered tests are excluded. This closes these exact
T8 cases; it does not replace ROOT's other framework, generation or release gates.

## Frozen identities and transport

Compiled source: **a06ec4b1f9f44419882477bc1a55b6ed39e2200b**, ROOT's public768
build `/root/.cache/tower/root_release_a06ec4b1`, no private override. The single
authorized READY/FAILED OS wait ended ready after105.194s of600s (5s checks).
READY records source above, all builds exit0,32 artifacts/168232639B and matching
before/after source manifests. All32 lengths and full SHA256s were verified.
Only the selected pair is copied into ignored `build/l2_t8_a06ec4b1/build/`;
this test's imports eagerly read no other build artifact. ROOT's old25 bundle is
unchanged and both old reactor hashes were reverified.

| Selected artifact | Bytes | SHA256 |
| --- | ---: | --- |
| `browser-wasi/tower.wasm` | 1665728 | `f065757480f1b94ad4f181aadeb8e0a63bc06b781a546aed11ac12796a64a25d` |
| `browser-wasi-llvm/tower-llvm.wasm` | 35420122 | `8acbaf08545d0ce972f2de7db2a89fcfc7ef434f95f775feca06dde759107697` |

Host/test/resources freeze: **6b74889b0ca29f1261af0dd55f5c9b27f6ce6ccc**,
tree2d2d1424bea3b0d86f09942e97552380182e0933. The only later Tower resource delta
from compileda06 is the unimported packaging tool; host and selected test bytes
are identical. Mounted resources include the published inline component-index
storage changef9565c46, explaining new canonical inputs versus the prior25 run.
Fixture files are unchanged: entity_views SHA4e6d34ede6f1e26989c61c95888e0b6bd4cc3b54ca76954100f9539d61230712,
generic_registry SHA4f8c3825ad31f2a47b222405cc9cf81858f27fb78902e710430cebd65ea9910f.
No source reduction or relabeling of the old706287/764205B requests.

Full manifests retained with raw evidence:

- host.sha256: `a3a337ca453a61309b65025468161c837c3918402a9d21c16b03c8e1834a5a69`
- resources.sha256 (1189 mounted Tower paths): `deb226d49e402a6172052d165b9cf52b45843ad8517f8ba92b27fb06ee3a6815`
- ROOT files.json: `e5f5ba72ac761a70f6773dd05f052b2e83b22a248f3081a1b70aa927a80c87eb`
- results.sha256: `ab34e478c22d8b9b2471fde0af90612f0ba820a3459e327813bda42d853c552c`

The host/resources and both copied reactors were hash-checked again after drain.
Initial manifest verification stopped before copying/testing because Windows
PowerShell wrapped ConvertFrom-Json's array in another array; actual count32 was
confirmed, assignment corrected, all hashes verified. The transport error is
preserved in transport_count_error.txt; no test failure was suppressed.

Node22.23.5 SHA247e9693d316da9857e44990e5e11709f596f18112251b8026ec6eed80bdf38a,
Windows, CPU4-7 (affinity240), one heavy process. Commands use the original file,
`--test --experimental-test-isolation=none --test-concurrency=1 --test-timeout=600000`
and each exact anchored pattern above. TOWER_TEST_WASM/LLVM_WASM point to the
verified copies; TOWER_TEST_PHASES=1 and a fresh TOWER_TEST_ARTIFACTS per case.
The existing Windows process meter was copied locally with the same600s OS
kill guard, never hit. No-isolation measures the actual Node test process and its
threads, not a parent of an unmeasured test child. PIDs18456 and7228 both drained.

## Complete phase coverage

For each fixture, both pointer widths4/8 execute original Graph output0 and
canonical Fast output0 with exact canonical equality. Each width then runs both
unoptimized and optimized LLVM-to-Foundation reconstruction, internal recheck,
and fresh portable Fast reparse/format/execution with exact0 newline. Finally
both unoptimized and optimized emitted wasm32 executables run to done/output0.
All original fuel100000, canonical, allocation/ownership and output assertions
are untouched. Thus each test runs six LLVM calls and ten known-output executions.
The fixtures' own zero entity/component/store teardown assertions pass; no new
global compiler allocation/grant telemetry is inferred from those assertions.
Returned Foundation formatting is exercised; the explicit byte-equality assertion
is the original Graph/Fast canonical round-trip, not an added LLVM fixed-point test.

| LLVM call, per fresh process | entity_views wall/CPU s | generic_registry wall/CPU s |
| --- | ---: | ---: |
| 1: Foundation32 unoptimized | 82.950 /143.593 | 99.381 /167.874 |
| 2: Foundation32 optimized | 3.150 /4.890 | 3.364 /5.125 |
| 3: Foundation64 unoptimized | 7.197 /7.282 | 8.918 /9.016 |
| 4: Foundation64 optimized | 2.647 /2.891 | 2.982 /3.313 |
| 5: emitted wasm32 unoptimized | 1.202 /2.000 | 1.435 /2.453 |
| 6: emitted wasm32 optimized | 1.331 /3.016 | 1.528 /3.406 |

Every phase JSON reports compiled; complete TAP pass establishes the following
execution assertions also passed. The old25 optimized32 scalar-type failure is
retained separately in compiler_entities_25dddd04_fd1725d8. The repair is now
exercised in the real LLVM reactor; prior native evidence remains source-bound.

| Process | Wall s | CPU s | Observed Windows peak bytes | Largest logged Node maxRSS KiB |
| --- | ---: | ---: | ---: | ---: |
| entity_views | 188.618808 | 306.625 | 2656043008 | 2625916 |
| generic_registry | 230.258430 | 364.875 | 2903080960 | 2835040 |

These are n1 artifact-adoption costs, not throughput improvements. Whole-process
CPU/RSS includes both reactors, host sources, V8 compilation/JIT and execution;
it is not isolated compiler work or proof of within-unit concurrency. The meter
samples PeakWorkingSet64; it missed a late entity_views peak reported by Node.
Node maxRSS is sampled at phase returns, not a final per-instance allocator census.
The unchanged2GiB Wasm linear-memory maximum is distinct from this host RSS.
These requests complete within the actual reactors' bounds; the unchanged host
API does not expose LLVM's peak/live linear-memory capacity, so no such value or
zero global compiler allocation count is invented.

## Captured input and returned text

Inputs for calls1/2 and3/4 are byte-identical within each pair. Full hashes:

| Case/width | Canonical bytes | Canonical SHA256 |
| --- | ---: | --- |
| views32 | 615658 | `3841574f7f591a7b3db3055ad710337c7cce94339a3c66a1af3302f60eac2258` |
| views64 | 616088 | `9f301838bc562858626f93a62661e8090b149a6d140369969c771471e0280da5` |
| registry32 | 665008 | `9b539d3815e7c13078b6e66ad9cd40292d29e2974f8b258455260dcd73d1d589` |
| registry64 | 665438 | `dc758c614a62667545ee4bd70819ff81f7a807cf748ed7c11788078e9d862191` |

| Returned Foundation | Bytes | SHA256 |
| --- | ---: | --- |
| views32 unoptimized | 2880877 | `31bdefb86a4d382330f9eee005dee560c64cdb48087b73f3d0613666ea5a4656` |
| views32 optimized | 969773 | `16349973c92f515767bfb371dd745f1f39732da9f4fddf3a59e02d93f9329291` |
| views64 unoptimized | 2888706 | `e6209730eea400cbcb2214112a3e266af3afe411acec914c62b4c7beccd42ebb` |
| views64 optimized | 966561 | `ce0675f43d09169584d2da4250e9f3adb31b12118ae26e9cbb1b7b974cb822a5` |
| registry32 unoptimized | 3174829 | `fccacf79564e051a5731622e2a0f6389a15c329be72b06f78640a68d914bfbdd` |
| registry32 optimized | 1005584 | `40ce0e8acd6da4de6837af443e62c2b7677d846dcd7afe0a728ee894bcaed023` |
| registry64 unoptimized | 3182688 | `7b9e87587eba4167fda27021caa1b685c3931830fffe61695839a89b93d38a57` |
| registry64 optimized | 1004033 | `dde3a7ab9550f6a526c82a66517a5a3bbbbfaec4313f390dddeca11e9179b3b8` |

Executable calls5/6 use unchanged46B views source SHA4e0ee0fcaa7269f94a5e85a23513c0371d1031900d27ab760bfaa34506a31c7f
and50B registry source SHAcf1a9aaa0cb7be52d61e9e9fc691f59813c8f34cc07c52b0906c23af2d78330e.
The unchanged test executes both binaries but does not serialize them; no binary
output hash is claimed. All captured files/phase JSON/process logs/manifests and
OS launch scripts live at
`C:/Sandbox/build/codex_ecs_20261122/L2/compiler_entities_a06ec4b1_6b74889b`.
No production/test implementation change, reactor/native rebuild, broad matrix,
sanitizer/service retry or deployment was needed. ROOT retains final release.