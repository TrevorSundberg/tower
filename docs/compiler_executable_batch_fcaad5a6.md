# Executable coordinator batch: explicit world budget

A2, 2026-11-23. Published input `fcaad5a64d9504fda35c4260204811d5458db0ef`,
tree `34c396cea58a872edebf1d772314fee132594df0`, plus this scoped change.
Only `semantic_execution_work.tower` changes in production. Its final SHA256 is
`6b0d3cf5285587c8c8e3796bd54611bf16de6af5d7ce4461618cbfc77e59fd95`.

## Ownership and bound

`sem_executables_pump` now owns a `work_vector(SemanticExecutable*)`, charged to
`compiler_world_work_budget(compiler_node_world(c.program.root))`. The coordinator
alone grows/disposes it; joined kernels borrow its pointer array. Its existing
8-slot initial capacity, doubling growth, 256-result preparation window, take
order and pending/progress behavior remain unchanged. Each push uses the checked
result API before opening that result's stage. Capacity denial stays `Capacity`;
an allocator failure stays `Memory`. Persistent per-result `query_reads` pushes
keep their existing separate `Memory` path and occur in the same order.

The existing dispatcher joins before returning. Cleanup still discards remaining
private stages while an input view, if opened, remains alive; cancels unsettled
queries on semantic failure; releases the lane receipt; then disposes the batch.
The view's outer defer closes last. Hold/publish, dependency reads, result
publication and first-cause selection are unchanged. A failed batch push has no
stage of its own; graph cancellation invalidates its already-taken ticket.

On this native x64 host the first batch allocation charges **96 B** (8 pointers
plus the 32 B compiler header). Maximum retained batch storage is **2,080 B**;
the 128-to-256 replacement charges both allocations, **3,136 B**, before freeing
the old one. These bounds derive from `SemanticPreparationWindow`,
`WorkBufferInitialElements`, host pointer size and `compiler_buffer_allocation_size`.
Guest 32/64-bit profiles do not change the native host pointer size. Empty pumps
allocate no batch buffer. The vector descriptor/receipt is stack-owned; the
shared budget's grant metadata is separate existing accounting.

This closes only the temporary batch gap. Persistent `query_reads`, aliases and
other raw vectors remain separate limits. Explicit standalone null-ledger worlds
retain that existing behavior. Allocator internals, foreign LLVM allocations and
untracked owners are not covered by a whole-process memory cap.

## Focused evidence

The existing `semantic_executable_admission_checks.tower` gains `batch` and
`batch-partial`, registered in its existing CMake target. They use the production
allocator and synchronized explicit world budget, not allocation injection.
Graph/control/worker setup is complete before pressure is applied. The partial
case measures the actual first stage/lease cost, then leaves exactly that plus
the shared vector's first physical allocation available. It checks the exact
peak, Capacity/offset 17, cancelled tickets, no ready input/stage/context/function,
unchanged entity/component counts, returned byte/lane grants, terminal retry,
fresh-context recovery in the same world, empty-pump behavior and final zero
world ownership. Source owners stay alive through both outcomes.

Before the production edit, `batch-partial` exited **1**, with exactly four
missing-charge assertions (32/64-bit x workers 1/4); healthy exited 0. After:

| Check | Result | Wall / CPU seconds | Peak RSS KiB |
| --- | --- | ---: | ---: |
| Executable admission, all 15 selectors | 15/15, 60 width/worker configurations | 0.541 / 0.282 | 51,848 |
| `query-smoke` | pass, staged dependencies/cancellation/resource checks | 4.157 / 5.705 | 409,160 |
| `lifecycle 0 0` | queried type/helper, output 42, serial/four-worker canonical equality at 32/64, serial Foundation round trip | 2.201 / 2.078 | 222,268 |

One dependency-aware incremental build compiled the changed standalone fixture
and production semantics provider, then linked those three existing targets:
35.561 wall / 43.196 CPU seconds, 1,091,940 KiB. The admission fixture directly
imports the production implementation and excludes the separate semantics object
from its link, preserving a single provider. Existing exact symbol policy needed
no changes. No compiler/browser/generation/sanitizer matrix was run.

## Matched healthy sample

KinmenA Windows 11 / Docker Linux x64, LLVM 19, production allocator, Release
cache, CPU 0-11, container cap 24 GiB, build parallelism 2 and Tower `--jobs 1`.
Public bootstrap SHA256
`768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`;
target `x86_64-pc-linux-gnu`, explicit Bedrock/Foundation resources, no override.
The existing `frontend-storage-profile /work/scaffolding 8 WORKERS plain` uses
an explicit 2 GiB world budget. The optional detailed observer is disabled.
Three paired fresh processes per variant/worker count used warm shared caches,
reversing order in pair 2. All 12 runs checked output 42, source hash
10240961210026777659, imported-source hash 9841053087281335157 and canonical hash
14243253176332855356 / 13,848 bytes; all returned zero bytes, lanes and live grants.

| Workers | Median wall seconds before -> after | Median CPU seconds before -> after | Median peak RSS KiB before -> after | Peak ledger bytes before -> after |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0.492520 -> 0.494902 (+0.48%) | 0.435881 -> 0.438038 (+0.49%) | 176,672 -> 177,004 | 108,204,003 -> 108,204,099 |
| 4 | 0.578747 -> 0.576727 (-0.35%) | 0.572917 -> 0.568868 (-0.71%) | 179,496 -> 178,504 | 108,153,715 -> 108,153,811 |

The measured peak increases by exactly the first **96 B** batch charge. Budget
metadata retained before ledger disposal remains 10,485,760 B in both variants.
These small samples establish no material healthy regression; they do not prove
speedup or parallel overlap. This small workload remains slower with four workers.

## Reproducibility and adoption

Preserved logs, exit statuses, patches, commands, depfile-derived hashes and the
baseline binary: `C:\Sandbox\build\codex_ecs_20261122\A2\cache\logs\executable_batch_fcaad5a6`.
`baseline.sh` preserves the failed baseline; `candidate.sh` fails fast on any
build/check/output mismatch. Container image:
`sha256:ba707de6a29fd47e22b186ce711f82e51146fd0d38f7c557dadaf77f7e087156`.
The 368-entry profile and 140-entry fixture input manifests are checked after
execution; their SHA256 values are respectively
`92483944fbec4a189a90e8a8c391fc0b15995cdf04b1db579080fa74c7083d19` and
`b3353ae72369207420e213d6258a9494265309322ffc4b0abd4d44e3d36b1cb3`.
The command manifest SHA256 is
`752cd2b7c3ea78c59bd8370c2a7e8ff97833b349cd4860c50cf47361537388f9`.

| Artifact | SHA256 |
| --- | --- |
| Before profile | `635c0a192110fa30fe8e85fc52d52114692e062991e60a2836feebec443a4bf5` |
| After profile | `409c20d5709d1e6f8228186a316e742fafb158d8e806fa650c004cb6d7bcf256` |
| Production semantics object | `003a1ebf8a3247b8a03f0f51c563f1968c0c42101cbb8d51288fbbdfe7f8a4ab` |
| Executable admission test | `6d54f22593e93f4b44489505fe7e2bd6520eefe04396ed48e267e08920fd5bcc` |
| Query/lifecycle test | `8c53d3372e23324abd266d52817bdffe4795fc5126e53220b0bce61c28f0214a` |

ROOT's joined reactor/release adoption remains pending. The earlier service-blocked
instrumentation gate remains open and was not retried. No final integrated,
browser, unsupported-host or universal race-freedom claim follows from this batch.

## Merged-source verification

Implementation commit `995af4d8` was merged with published `b8d65c37` using a
normal history-preserving merge after the required ff-only pull refused
ordinary divergence. Validated merge `478353f99080ba37390dc597aa51ae8f3b73df1b`,
tree `8f2037c546bf631f3554736e10adae09681acca5`, includes L1's module-condition
and inference changes. Their actual semantic import closure changed, so the six
affected build actions were rebuilt once: 43.371 wall / 47.929 CPU seconds,
1,091,920 KiB. `merged.sh` then passed all 15 admission selectors (0.574/0.312 s,
51,760 KiB), query-smoke (4.253/5.808 s, 407,056 KiB), and lifecycle 0
(2.219/2.096 s, 211,968 KiB). Two healthy samples at workers 1/4 passed the same
reference/canonical hashes and zero teardown: 0.510/0.452 s, 176,464 KiB and
0.580/0.572 s, 179,488 KiB. Ledger peaks remain 108,204,099/108,153,811 B.
These are merged checks, not a replacement for the earlier matched comparison.

Merged executable admission SHA256
`06359a7f561dc0741bf8320d84870ca0e3def9ff44067667226d7e7ff5dc4ff2`;
query/lifecycle `16a21160b79386a92b5af07de34954acbb87cb23ea93b9e80f9ead52f59a5aee`;
profile `9ea85ce2888223ff1191feda74b5da0b287c6eabbbd01a8cf4bfb43cb09a0cce`;
semantics object `b3fcbecd5e6b3fc67ba1e6861f8784d0433e2b3303a5f4c0da515c860ceb4122`.
The 141-entry fixture and 368-entry profile manifests were checked after running;
SHA256 `0e61607668917fd8c88c4927190594c6867e3ecde0be47161fb0a17a6ec13219` and
`d0fcc246751a2856859306bf2ab18e41002aedb5390905a5701a29d2eb63fc19` respectively.
All processes exited 0 and drained. Old stashes and unrelated sources remain
preserved; runtime deployment remains ROOT's separate gate.