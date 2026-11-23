# Full struct-values Wasm reconstruction and package acceptance

The exact selected test passed once: `LLVM matches interpreter: struct values`
in `playground/tests/llvm-execution.test.mjs`. TAP reports1pass/0fail/0cancelled;
the other50 tests are explicit name-filter exclusions, not executed passes.
Both `complete` and final `released` phases are present. No compiler, reactor,
fixture, assertion, guest ceiling or producer implementation changed.

## Frozen identities and command

- Compiled compiler: `25dddd0420258bc5174a3039293c447fd60ef367`.
- Portable1663850B SHA256:
  `35379f42d09a199c1f2ff83327b861fcc50f65d0c70f57006ba5065adfd773fb`.
- LLVM35416018B SHA256:
  `c1280ba15b9d529acf45f5165d83e47b7f233b2273a982767ec80ab87e63ecfa`.
- Mounted host/tests/resources: published
  `e932b54673930a8651261f79ace9da7583c318d8`, tree
  `5d6f45c168796dc7aa89a475d0aa7df405a50feb`. All1234 recorded host/resource files
  and both reactors were hashed before/after, unchanged. The test, transport,
  primitive/type resources and full fixture have no diff from25dddd04.
- These reactors include the joined pointer-return/reconstruction, module-capture
  and alias-publication repairs. They **exclude125efb11**, the newer module-body
  declaration-query repair. Mounted compiler source is not executable adoption.

Windows11/KinmenA, Node21.7.3 x64, CPU0-11 affinity, production allocators,
one fresh test-runner process with one test-file child. No guest memory override.
The parent and child stayed far below the24GiB lane budget; no Windows Job Object
memory cap was installed. Node21 does not support the single-process test isolation
option, so the requested command was retained exactly, from the repository root:

```powershell
$env:TOWER_TEST_WASM = 'C:\Sandbox\build\codex_ecs_20261122\root_release_25dddd04\tower.wasm'
$env:TOWER_TEST_LLVM_WASM = 'C:\Sandbox\build\codex_ecs_20261122\root_release_25dddd04\tower-llvm.wasm'
$env:TOWER_TEST_PHASES = '1'
$env:TOWER_TEST_ARTIFACTS = 'C:\Sandbox\build\codex_ecs_20261122\A2\cache\logs\struct_values_25dddd04_e932b546\artifacts'
node --test --test-concurrency=1 --test-timeout=600000 "--test-name-pattern=^LLVM matches interpreter: struct values$" playground/tests/llvm-execution.test.mjs
```

Interpreter-only environment switches were removed. The exact supplied pair was
used directly; no native result or reduced source substituted for a phase.

## Completed assertions and memory observations

| Existing phase | Checked result | Portable capacity after phase |
| --- | --- | ---: |
| Original Graph and Fast | done, identical status/error/offset/truncation and output | 108003328B |
| Unoptimized LLVM Foundation | compiled, optimizationProfile2 | 108003328B |
| Unoptimized prepare/Fast/independent load/execute | all assertions pass, expected profile2 | 410845184B |
| Optimized LLVM Foundation | compiled, optimizationProfile1 | 410845184B |
| Optimized prepare/Fast/independent load/execute | all assertions pass, expected profile1 | 410845184B |
| Canonical Foundation round trip | byte-identical formatted source | 410845184B |
| LLVM Wasm compile/decode/execute | complete decoding; reference-equal result, exact `0\n` | 410845184B |

No production error occurred; no remaining selected phase was left unstarted.
The test retains its original execution budgets, error-offset checks, package
header checks and independent package reconstruction after retiring each guest.

Child PID7968 reports cumulative CPU through `released`:22.890user+3.453system
=26.343s, and cumulative peak RSS912784KiB. These belong to the actual compiler
test child, including both reactors, JS host, JIT and setup. Its phase window
Graph-compile→released is12.042367s; TAP selected-case duration12.047501s,
test-runner duration12.615165s. Phase RSS at release919896064B is distinct from
peak RSS and from portable linear-memory capacity. Portable capacity starts
32702464B, reaches402456576B during unoptimized package preparation, then
410845184B (391.8125MiB) and stays there through release. LLVM linear-memory
capacity is not exposed by this existing phase logger; process RSS covers both.

The OS wrapper separately observed12.712728s elapsed and sampled only parent
PID24760 CPU0.046875s/peak working set35475456B. Those are **not** total compiler
CPU/RSS. Its `Process.ExitCode` property became null after exit: `exit.status` is
empty and `parent_metrics.json` records null. The wrapper returned0, but that is
not a captured Node exit code. This measurement gap is preserved explicitly;
the pass is established by the complete TAP assertions/phases and empty stderr,
not a fabricated process status. The test was not rerun to replace the receipt.

All guest handles reached their existing destruction paths. Portable node count
is5383 at the first phase, peaks596384, and ends16160 after releasing the original
handle; the compiler host/world remains alive until process exit. This selector
does not establish zero world-owned nodes or classify that retained10777-node
delta. Legacy allocation count is0 throughout, which is not a census of modern
budgeted storage. The package-byte counter is also0 at logged boundaries because
`tower-host.mjs` copies the package then calls `tw_exec_bytecode_release`; it is
not evidence of an empty package. Copied package bytes and emitted executable
Wasm bytes are not saved by this existing selector. Their assertions/execution
passed, but no package or executable-byte hash is claimed.

## Retained full artifacts

| Artifact | Bytes | SHA256 |
| --- | ---: | --- |
| Unchanged struct_values source | 4152 | `2ce1c260ebe11faeb2dc7524f1e0f239208caf8afc629962b800200e7052f285` |
| Current canonical Foundation input | 112287 | `e5b67088c3e4926f6d1c9ab6a26e422061f1a5b9047e834a04fb0d697cfe7a29` |
| Complete unoptimized reconstruction | 826172 | `fc16d06bb0d2fb0cebf1494617b0728c191c5b1876357c69b4e847922edd49b1` |
| Complete optimized reconstruction | 42165 | `43897a5ef680f74d4378737f6245e1a99833907c5fa3dc0d9c03613f855ee868` |

The unoptimized emitted bytes exactly match L2's native f0485e83/c2c97058 receipt.
Its retained original canonical input was138853B/hash2f4602e2…, whereas this
reactor produced the112287B input above. Those inputs remain distinct; the new
Wasm execution is independent evidence of fit and correctness, not native RSS
relabeled as wasm32 memory. This single sample is validation, not a performance
comparison or scaling claim. No production code changed, so before/after profiling
of an implementation change is inapplicable.

Raw command, parent/child identities, phase JSON, TAP, empty stderr, original
measurement-status gap, file hashes and all saved artifacts remain under
`C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/struct_values_25dddd04_e932b546`.
TAP SHA256 `317a68340f6202574f5f0a17248b6478c1dd73193914d857c22ffd3b8cd1a455`.
No target or owned child remains running. All prior stashes/todo are preserved.
The separately service-rejected instrumentation gate stays open. ROOT owns later
compiler-source/reactor adoption and final release; no hosted publication claimed.
