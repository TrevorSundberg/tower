# Current native dependency acceptance, L2

Frozen published source `e7558fa836b46c61bc5c46398ba672117c6a3d05`,
2026-11-23. This bounded integration checkpoint passes. No production or fixture
change was needed. It adopts the affected native paths below; it does not relabel
the full frontend/body/lifecycle receipt on `48d791a8` as a current full matrix.

## Delta and selector overlap

The production delta from `48d791a8` contains LR sorted-range merging
(`253af949`), LR propagation grain (`52895b4f`), qualified module/completion
ownership (`5fdb4827`), generic inspection preparation (`64450fc1`), module/defer
expression-query admission (`96cd1eda`), and optional world/pool/lifecycle/kernel
observers (`f16cde13`). Backend WASI source-check registration also changed;
that separate host gate is outside this native dependency checkpoint.
There is no further production delta from accepted publication `1a5241cb` to
this freeze: the two intervening files are documentation only.

All 1,218 Tower/CMake inputs in `imported_alias_merged_source.sha256` and the
accepted native test binary hash were verified unchanged before execution.
The following receipts are **reused**, not rerun:

| Receipt | Exact scope retained |
| --- | --- |
| `48d791a8`, published through `3a7f4b39` | Full frontend/body, all 42 lifecycle cases, workers 1/2/4/8 and 32/64-bit continuation contract on that source |
| `96cd1eda` | Full type-smoke on that source; not extended to later observer inputs |
| `8f656429` plus the `1a5241cb` bare selector | Query-smoke: receipts, failure order, lifecycle frontier drain, actual clone overlap, publication/cancellation, and 32/64-bit workers 1/4 evaluation continuations |
| Same hash-identical published inputs | All 28 imported-alias trials: original ten-line output, vector reference, explicit/inferred specialization, deferred effects, qualified distinct same-named aliases, deterministic nominal failure/retry/fresh compile, canonical reconstruction |

New execution uses only existing selectors, without `all`, `units`, `bodies`,
`type-smoke` or `capture-policy` (which would repeat included cases):

| Selector | Current-source adoption |
| --- | --- |
| `dependency-units` | Four independent worlds, imported helpers, forward decltype/comptime, ordinary type-producing functions and generic identity; untaken cyclic read; answers 42/43/44/45; canonical bytes and ordered cycle diagnostic bytes/offsets agree at workers 1/4 |
| `unit-admission` | Serial/two-worker canonical match; actual nested grammar lane exhausts the shared budget, releases it, and starts ready outer work before its parent completes; cancellation drains and hides every result |
| `lifecycle 17` | CaptureReuse: early runtime read remains 0 while staged layout captures the initializer 9 |
| `lifecycle 21` | ParameterCapture: a parameter in another frame cannot borrow a local capture's known value; exact diagnostic agreement |
| `lifecycle 24` | ModuleCapture: two aliases preserve one module's capture identity, output 14 |
| `lifecycle 38 39` | Untaken effect output 7; executed output requires an explicit effect capability and publishes no partial program |

The five lifecycle cases run both widths and workers 1/4: 20 original trials
plus six successful canonical reconstruction/execution trials. They are a
selected adoption of changed observers/module consumers, not another 42-case run.
The profile workload adds imported dependency helpers and 16/4096 loop bodies
using decltype; every sample independently executes answer()=42 and body_0(36)=42.

## Environment and measurements

Windows host / Orchestral-Revng WSL Linux x64, Ryzen 9 5900HX, CPU4-7;
existing `/root/.cache/tower/l2_ecs_native`, public bootstrap SHA256
`768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`.
One cache owner, compiler jobs1, dependency build parallel2. No private bootstrap,
whole LLVM rebuild or injected allocator. Other lanes may use the shared host;
ROOT's separately owned browser build used CPU8-15 during this checkpoint.

One dependency-aware build requested `tower-lr-work-tests` and
`tower-frontend-units-profile`. Only the profile object/link needed refreshing:
5.47 s wall, 3.79 s CPU, 270584 KiB peak RSS. The test runner stayed byte-identical.
All checks exit 0 with empty stderr and frozen-source verification 0.

| New selector | Wall s | CPU s | Peak RSS KiB |
| --- | ---: | ---: | ---: |
| dependency-units | 7.04 | 13.45 | 817048 |
| unit-admission | 4.31 | 4.92 | 476460 |
| lifecycle 17 | 3.01 | 2.87 | 224968 |
| lifecycle 21 | 2.63 | 2.55 | 218428 |
| lifecycle 24 | 3.11 | 2.88 | 224900 |
| lifecycle 38-39 | 5.91 | 5.57 | 229632 |

One checked sample per size/worker setting, fresh worlds/processes, warm filesystem,
64-bit target, optional production observer enabled. Profile timing covers creation
through join; reference execution, canonical comparison and final close also pass
but follow that timed interval. No runtime implementation changed: these are
validation costs, not before/after optimization evidence.

| Bodies | Workers | Compile wall s | CPU s | Peak RSS KiB |
| --- | ---: | ---: | ---: | ---: |
| 16 | 1 | 0.711594 | 0.634907 | 177480 |
| 16 | 4 | 0.804294 | 0.794435 | 181308 |
| 4096 | 1 | 3.051238 | 2.957531 | 838048 |
| 4096 | 4 | 2.783281 | 3.630374 | 840504 |

Exact generated/imported source and complete canonical bytes match workers 1/4.
Canonical SHA256: small
`5a75ae4154714f9a84397c4e3fef46c4cbb9cf1639b3e53063f84267e79b4c6f`;
large `9c0daad4b6b7d0d94eeb27c99fe30c27e37cee1cabc3555c7db83a67278d0039`.
The large canonical hash also matches B2's independently retained observer receipt.
Small parallel work is slower. Large wall improves about 1.10x with more CPU;
one sample under four-CPU affinity is not a general scaling or regression bound.

## Actual overlap and ownership

Four-unit success records peak4 and four distinct overlapping threads (serial1/1).
Compile intervals are 2.674542/1.538794 s at workers1/4; cyclic failure intervals
1.232637/1.372761 s. Success peak charged bytes are160688527/418267420;
failure125052917/415214306, below the fixture's2GiB shared byte budget.
The earlier cycle beats a later missing-name error identically; failed batches
publish no partial unit. Nested release starts ready outer work after49836ns,
with distinct parent/nested/next thread identities asserted by the fixture.

Within one large unit the semantic dispatch observer records peak1/4 and
distinct threads1/4 across311 dispatches. Body, BodyDiscovery, Declaration,
DeclarationType, KnownBinding and Lower intervals actually overlap at4.
Dispatch wall is830.298/338.387ms, active interval union827.927/329.233ms;
parallel kernel interval sum1286.141 lane-ms versus1346.641 admitted lane-ms.
Observer collection itself costs12.035/12.736ms and is included in enclosing
phases. Inclusive spans nest and must not be summed. Lowering remains costly:
kernel CPU171.390/367.175ms, despite actual peak4; this is attribution, not a
scheduler fix or a claim that queued jobs prove concurrency.

Every joined success/failure/cancellation asserts used execution lanes=0 and
peak lanes within its shared ceiling; the nested grant is explicitly inactive.
Byte grants are deliberately **not zero at join**: inputs and published worlds
still own them. Profile retained bytes are20280608/20277784 small and
614414037/614411213 large; peak charged bytes stay below712739625 against the
1.25GiB limit. Ledger storage is10MiB small/80MiB large, reported separately.
At final close, real worlds drain/release, inputs and pools dispose, and
`work_budget_dispose` succeeds only with live grants=0; otherwise these runners
trap. All closes succeeded, including failure and cancellation. This is checked
owned-budget/world cleanup, not a whole-process heap cap or race-freedom proof.

## Reproduction and retained artifacts

External lane `C:\Sandbox\build\codex_ecs_20261122\L2`, prefix
`current_dependency_e7558fa8`: build/test shell transport scripts, exact commands,
revision/delta, source/binary/artifact SHA256 manifests, raw stdout/stderr,
`time -v` reports and exit/freeze receipts. The source-manifest SHA256 is
`1bd5d946ab80049b192ad84bb569d2def1ca90831140dead49f1f32c9cbe1b9b`.
Native test executable:
`1229edf325bc37168c1b4a11fd3401441e3b8b8fe810b9eefa00f916b0e7139a`;
profile executable:
`fd4e281e0c49b5a4f42be78b1723bcb6fa3226071c842f2aba8fc02566ad5e27`.

Profile command: `tower-frontend-units-profile RESOURCE_ROOT 1 W N dependencies
grammar artifacts DIR`, W=1/4, N=16/4096. Other commands use
`tower-lr-work-tests RESOURCE_ROOT SELECTOR`. Existing frozen baseline executables,
earlier failed logs, full acceptance and fault receipts remain intact.

No functional blocker was found in this slice. At the freeze, ROOT's unmerged
interpreter/resource portable fixes, other owners' independent work, browser/reactor adoption,
sanitizers, generations and hosted release remain separate gates. They are not
suppressed or marked passed by this native receipt. No owner implementation,
cache or todo file was changed; all owned jobs drained before reconciliation.

## Publication reconciliation

Receipt commit `2f0220bd`; the required ff-only pull then found normal divergence.
Full-history merge `7340d7ba0cab406ea75ea24230e83f6832c0b368` preserves published
`5b9194e4` and both journal histories without conflict. Incoming changes include
ROOT's test-only invocation/resource fixes `eac16533`, L1's pointer-alias fixtures,
A2's separate storage profile and D2's browser transport/tests. Compiler, library,
language resources, selected dependency/admission/lifecycle/profile fixtures and
the imported-alias fixtures are byte-identical to the frozen checkpoint.

The invocation edit is in `scaffolding/tests/interpreter_invocation.tower`, not
the production interpreter used by these oracles. The one affected selected
consumer is query-smoke: `evaluation_query_tests` invokes
`semantic_resource_tests`, whose host-capacity setup changed. The dependency target
therefore rebuilt only `tower-compiler-query-checks.o` and the native test link
after CMake regeneration:9.49wall/4.49CPU seconds/290068KiB peak RSS. Merged
query-smoke passes0, .38wall/.37CPU/104448KiB, empty stderr and source/status0.
Its new executable SHA256 is
`35f769a662dc57b9592c7ba5c380c1c9b6c34e57816940843938047f3e62bf28`.
Logs/manifests use external prefix `current_dependency_merged_7340d7ba`.

The original whole-tree manifest is not claimed unchanged across that merge.
Unchanged selected inputs retain their exact frozen results and performance
samples; only the affected query consumer was rerun. No repeat type/body/profile
matrix, independent owner fixture campaign, production edit or deployment.
