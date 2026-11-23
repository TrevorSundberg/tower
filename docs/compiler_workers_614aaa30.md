# Eight real Node compiler-worker cases: passed

All eight existing cases in `playground/tests/compiler-workers.test.mjs` pass
after correcting their language-resource setup. Each ran once in a fresh Node
process with concurrency 1 and an unchanged 180-second outer guard. Each report
contains exactly one selected test, one pass, no failures/skips/cancellations.
No compiler was rebuilt, no assertion or Tower fixture was weakened, and no
other Node file, generation, browser or sanitizer matrix was run.

## Artifact and source boundaries

Current host/fixture freeze: `614aaa304501cd52e9941675346c7d45f64c1082`, tree
`7b1f48e3adf5f76ed623d77c468261029db2d5da`, plus the recorded test-transport patch.
Measured test SHA256:
`3ca1e2ebf994e58a6f8612deb31455075f9793bd51601cb5da077bca8c34b6d5`.
ROOT's supplied artifacts and embedded project sources remain **eac16533**:

| Artifact | SHA256 |
| --- | --- |
| tower-llvm.wasm | `87c8fbc90a9e0e56a3399155c5d63bcab9dcd57e4de5d89996f40c0238230472` |
| tower-cross.wasm | `e860e9c59717800e416d4dc0eeeda5938be24049c7dd55a05d5efbcd3af561d1` |
| project.json | `420d6de1421f4c3c7ae2efe40ed235537860b61168c13f4dea72e8b7c1b875d9` |
| cross_target_eac.tar.gz | `3ae60fc20303f8b91b8398e3eda0dd6c2939c60bdb4a6c03e5c207fec1c452a1` |

The supplied portable hash `df541c16c626453fae94553cae2e6d1285b6879bfe7778be363fe537a0d8fd99`
was also verified; this test file does not instantiate that reactor. Only the
cross reactor and `files.json` were extracted, by exact member names into a new
owned directory. All three consumed files were checked against that manifest's
byte counts and SHA256 values. Existing LLVM/cross/project defaults were copied
with hashes into `defaults_before` before installing matching copies at the
test's required `build/browser-wasi-llvm` and `build/compiler-project` paths.
No target/support pack is consumed by these library-object tests, so none was
installed or rebuilt.

The parent loads the verified LLVM bytes into `compiler.module`; `compilerPool`
sends that same compiled WebAssembly module and frozen files/grammar to every
real `compiler-unit-node.mjs` worker. `compilerUnitMessages` instantiates the
received module, not an independently selected artifact. Vectorization loads
the verified cross default directly. Generic fixture override environment
variables were not relied upon for these raw-loader paths.

The project contains 557 source files. Its five language/type root resources
match this current checkout, but embedded `library/entities.tower`,
`library/entity_types.tower`, `compiler/semantic_context.tower` and
`compiler/semantic_type_values.tower` differ. Their separate hashes are retained
in `selected_resource_identities.json`; these tests do not validate a rebuilt
compiler or those newer embedded-source replacements. The six directly read
Tower fixtures are unchanged from eac16533. All measured host/fixture and
installed-artifact hashes passed their post-run checks.

## Concrete setup repair

The original first-case invocation failed before worker execution:
`input.tower: Cannot read imported module: foundation_syntax`.
Its failure/log/source are preserved: .55 s wall, .38 CPU, 163432 KiB peak RSS,
exit 1. It did not execute any of the eight assertions successfully.

The old test supplied only bedrock/foundation/tower and omitted the complete
resource dictionary from its parent and cross loader options. It now derives
the same language/type dictionary as production `compileUnits` from the actual
project files and passes it through `builtins`. No names, types, grammar or import
semantics moved into JavaScript. The rest of the change is optional transport
observation: save returned objects, call timings and actual LLVM IR when requested.
Workers, scheduler, cancellation, output publication, source diagnostics and
all original assertions remain unchanged. Tower owns every functional fixture.

## Checked behavior and costs

KinmenB Linux x64/WSL2, Ubuntu 24.04.5, Node v22.23.5, CPU 0-11, 24 GiB,
one owned container. Disk check before work: 115 GiB workspace and 924 GiB Linux
storage available. Fresh processes/warm filesystem; GNU time includes the actual
test process and its worker threads using `--experimental-test-isolation=none`.
CPU is user plus system and may exceed wall. No swaps or deadline/cap increases.

| Existing case | Wall s | CPU s | Peak RSS KiB | Preserved assertions |
| --- | ---: | ---: | ---: | --- |
| Objects/publication | 3.85 | 12.02 | 694832 | Serial vs 2/4 exact bytes, source-order publication, peak lanes and real overlapping compilation intervals |
| Generic inference | 3.43 | 10.24 | 700456 | Independent worlds, exact 1/2/4 objects and publication order |
| Cancellation/recovery | 1.65 | 2.12 | 348712 | Both child exit observers resolve, zero partial publication, fresh independent build produces an object |
| Staged dependencies | 2.82 | 7.53 | 662928 | Inferred staged values isolated across worlds, exact 1/2/4 objects |
| Ordered diagnostics | 1.73 | 3.08 | 428640 | Parallel error equals serial first-source error, only two admissions, no failed-build object publication |
| Held later receipt | 1.79 | 3.24 | 426900 | Earlier failure terminates the worker whose irrelevant result is withheld; exit observers resolve without the unchanged 30-second guard firing |
| Native vectorization | 1.98 | 2.79 | 434416 | Actual x86/ARM optimized IR contains vector i32 operations; Wasm stays scalar; all objects nonempty |
| Borrowed iteration | 3.17 | 9.13 | 699832 | Independent owned worlds, exact 1/2/4 objects and publication order |

The ordered diagnostic remains
`tests/batch-a.tower: Enum values require a named member or an explicit conversion`.
Cancellation returns `Compiler build cancelled`. These expected failures are
checked by the passing tests, not suppressed errors.

Optional call measurements include preparation, compilation, publication and
worker drain, excluding artifact-write time. Each row below is one ordered
1/2/4 observation inside that case; no counterbalanced scaling campaign:

| Fixture | Workers 1 / 2 / 4 wall ms |
| --- | ---: |
| Dense kernel | 950.36 / 993.23 / 1177.76 |
| Generic inference | 889.33 / 905.87 / 976.46 |
| Staged dependencies | 655.82 / 725.85 / 851.40 |
| Borrowed iteration | 897.89 / 788.04 / 902.55 |

Dense-kernel CPU is 1757.80/3189.68/6320.91 ms, cumulative process RSS high-water
278552/491296/694832 KiB. Other call CPU/RSS and per-unit intervals are retained
in JSON. The serial path reuses its parent compiler; pools create fresh worker
instances. Four workers do not improve these small observed workloads, and the
single borrowed two-worker result is not a general speedup claim. Peak RSS is
not live allocator retention or proof of zero retained allocations.

Saved native IR contains actual `<4 x i32>` loads/multiplies/adds/stores on both
x86_64 and aarch64; the scalar Wasm assertion passes on the actual `after` text.
The raw-pointer Tower kernel is unchanged: no invented noalias annotation or
native performance/execution claim. All 48 positive batch objects are retained
(serial/2/4 for four fixtures), plus the recovery object and three target objects.

## Evidence and limits

Full evidence: `build/ecs_b1/cache/worker_integration_614a`; OS runners:
`build/ecs_b1/worker_integration_case.sh` and `worker_integration_all.sh`.
It contains exact selectors/commands, the original setup failure, current eight
reports, time/CPU/RSS, output objects/IR, before/after test source, supplied and
installed manifests, selected embedded/current source identities and preserved
old defaults. No failed sample or assertion was discarded. All owned jobs drained.

This closes these eight assertions for the declared eac reactor/project and
current host/fixture combination only. L1 numeric-wrapper specialization, L2's
four failed ECS LLVM reconstruction cases, other assigned Node files and ROOT's
final release remain independent. The accepted native generation freeze and
artifacts are unchanged; no public pin or hosted deployment was performed.
