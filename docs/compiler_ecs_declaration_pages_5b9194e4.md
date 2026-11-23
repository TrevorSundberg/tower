# Four-slot declaration stage pages: retained experiment

Retain the registration-time policy for `SemanticDeclaration` only. The real
512-body compile saves **5,947,392 B** of requested page storage and world grants,
with identical live records, page count and outputs. This confirms the estimate
in [the occupancy receipt](compiler_ecs_occupancy_9d9329db.md). It is not an RSS
cap, packed component representation, scheduler speedup or compiler completion.

## Frozen implementation and contract

Published base `5b9194e428903bdbcd7bb57075de31ca6a13b128`, tree
`815869aa31d46f09a6aabbcb18dde2b11ba26520`, plus this batch's ten Tower files.
Baseline contains only the identical profile extension; candidate additionally
contains the registration/allocator/declaration changes and focused fixtures.
The common allocator previously had fixed64-row/16KiB limits, no per-kind policy.

`entity_register_stage_result(kind, size, alignment, lifecycle, stage_rows)`
returns `WorkBudgetError`. Zero selects the default;2..64 limits newly allocated
private-stage pages, still bounded by existing byte/alignment rules. Invalid
alignment/row policy returns `Invalid`; a staged kind or changed registered
contract returns `Busy`. First registration under a view is `Busy`. Repeating
identical registration is read-only. Even an empty registered kind cannot change
policy. The old `entity_register` wrapper preserves an installed policy and
layout/lifecycle compatibility.

The `u8` field occupies existing native descriptor padding: `sizeof(Entity)`
remains184 B, confirmed by every census. `sem_kind_stage_result` preserves the
exact admission cause and detaches a failed kind. Only declaration kind creation
requests four rows, before coordinator dispatch/context handoff. Other kinds
request zero. No body scheduling/admission method changes.

`entity_component_allocate` selects this immutable limit only for staged owners.
Store allocations retain the default. Workers still own separate pools;
published pages transfer unchanged and may be reused by the store. Reuse matches
type/stride, not a new capacity requirement: it must not strand a published
four-slot page. Queued holds, leases, joins, finalizers, stage publication and
cancellation are unchanged. Payload addresses never move. Dense pointer columns
remain indexes over stable strided payloads, not packed payload arrays or
evidence of nonaliasing. No early declaration disposal occurs.

## Measured storage

Production allocator, native x64. The fuller stream has8 bodies with256 additional
ordinary local declarations each; all are compiled/formatted. Observer runs are
separate at coordinator joins. Counts agree at workers1/4. Declaration used
slots equal live slots at the compiled join.

| Bodies / extra locals per body | Live / used | Payload B | Pages before → after | Slots before → after | Page B before → after | Occupancy before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 8 /0 | 80 | 72,960 | 12 →12 | 192 →96 | 188,628 →95,700 | 41.67% →83.33% |
| 512 /0 | 2,096 | 1,911,552 | 579 →579 | 9,264 →3,120 | 9,101,301 →3,153,909 | 22.63% →67.18% |
| 8 /256 | 2,128 | 1,940,736 | 140 →524 | 2,240 →2,144 | 2,200,660 →2,196,436 | 95.00% →99.25% |

Large retained world ledger:93,825,589 →87,878,197 B at one worker (−6.34%);
peak184,234,774 →178,287,382 B. Four-worker retained93,822,765 →87,875,373 B,
peak184,184,486 →178,237,094 B. Small saves92,928 B. These are actual charged
allocation requests including headers/alignment, not necessarily resident bytes.
RSS is separate below. Payload/index identities and lengths, descriptor bytes
and every other kind's storage remain unchanged.

At one worker, joined live grants / successful admission generation:

| Input | Before | After |
| --- | ---: | ---: |
| 8 /0 | 31,362 /535,669 | 31,362 /535,669 |
| 512 /0 | 144,447 /686,619 | 144,447 /686,619 |
| 8 /256 | 85,881 /595,309 | 86,265 /595,693 |

Four-worker values:31,363/538,395 unchanged;144,448/689,364 unchanged;
85,882/598,035 →86,266/598,419. Generation includes lane/buffer admissions,
**not raw malloc calls**. Each extra owned page requires one allocation/grant.
The fuller stream exposes384 extra pages/grants and88,704 B additional overhead
(231 B/page), offset by92,928 B less unused slot storage: only4,224 B net saving.
Ledger metadata remains20,971,520 B. Perfectly full pages would instead add about
4.4% payload-page allocation bytes: a layout estimate, not measured whole-compiler
regression. Arbitrarily longer dense streams remain outside this sample.

Large one-worker phase ledger after program release19,112,002 B, module release
9,045,194 B, cache clear2,322,406 B, world disposal0: unchanged. Residual empty
kind-index capacity is not hidden. All84 compilation processes check zero final
byte/lane/live grants, then dispose separate ledger metadata. Raw vectors,
foreign/allocator internals and observer storage retain the original exclusions.

## Matched plain cost

KinmenA Windows11/WSL2 Linux6.18.54.1, Ryzen AI MAX+395, `tower_build:latest`,
network-none container CPU0-11/memory24GiB. Shared compiler ledger2GiB, workers1/4,
production allocator, LLVM19 native Release, public compiler768a0cdf,
`TOWER_ALLOCATOR_TESTS=OFF`, empty `TOWER_SANITIZER`, compiler jobs1/build parallel2.
Fresh processes/warm filesystem; optional census disabled for timing.

Initial sequential n3 cohorts appeared substantially faster after the change;
large serial median828.528 →689.720 ms. Host/order variability made that
unsuitable as a speedup claim. One bounded interleaved n3 repeat used the preserved
baseline executable, reversing pair order in sample2. Resulting medians:
**milliseconds wall/CPU**, whole-process peak RSS KiB.

| Bodies / locals / workers | Compile before → after | Process before → after | RSS before → after |
| --- | ---: | ---: | ---: |
| 8 /0 /1 | 370.086/341.490 →363.902/334.598 | 505.036/448.678 →498.002/441.708 | 176,996 →176,916 |
| 8 /0 /4 | 433.326/451.059 →439.178/457.381 | 576.682/568.189 →583.757/576.925 | 178,944 →179,320 |
| 512 /0 /1 | 508.228/478.376 →509.357/480.280 | 681.524/626.238 →687.755/630.719 | 255,688 →253,768 |
| 512 /0 /4 | 557.930/649.422 →555.300/644.700 | 751.077/818.942 →748.664/813.395 | 257,752 →255,968 |
| 8 /256 /1 | 417.339/386.867 →416.862/387.833 | 568.735/508.785 →563.711/507.581 | 208,184 →208,460 |
| 8 /256 /4 | 475.624/512.888 →481.315/519.998 | 637.700/650.723 →646.219/660.328 | 209,900 →210,588 |

Process median changes −1.39%..+1.34%, CPU −1.55%..+1.54%; no material observed
regression justifies discarding the retained-byte saving. Three samples are not
a statistical bound. Four workers remain slower on these short grammar-heavy
inputs. Separate concurrent fixtures establish real overlap, not useful compiler
scaling. Individual samples, including the earlier cohort, remain preserved.

Original source/reference checksums remain exact. Imported FNV64:
9841053087281335157; `answer()` and `body_0(36)` return42. Canonical FNV64/length:
8 bodies14243253176332855356/13,848 B;512 bodies2835124221996493538/754,804 B;
fuller stream8211171274327935316/260,424 B, source FNV18405473143997887955.
These checksums/lengths are not cryptographic byte equality or execution of every
generated body.

## Checks and exact identities

Smallest changed closure `tower-entity-component-layout-tests`: build12.218 wall/
3.909 CPU s,281,516 KiB, pass. Then one dependency-aware invocation built the
profile, four stage/page fixtures and LR runner (22 actions):48.095 wall/
76.298 CPU s,1,066,272 KiB. Public pin compiled all changed Tower units. No private
compiler, symbol exemption, sanitizer or broad matrix.

Focused checks all exit0: component-layout (invalid/immutable/pinned policy,
finite-cap fifth-slot denial, unchanged first cause/count/identity, retry, stable
publication, zero teardown); page-reuse at default/four rows; concurrent-stage
publication/cancellation/leases; component-budget48 real2/4-worker publish/cancel/
denial trials with synchronized ledger, private pages, pinned source and joined
finalizers; stage-result ordinary and default queued-ownership cases; query-smoke
(0.301 wall/0.319 CPU s,103,236 KiB); declaration-calls (3.780/3.606 s,220,616 KiB).
Every profile checks healthy compilation, references/canonical checksums and
teardown. No compile/test failure occurred. Earlier failed receipts and all three
preexisting stashes remain untouched.

External evidence and preserved baseline executable:
`C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/declaration_stage_pages_5b9194e4`.
`baseline.sh`, `candidate_build.sh`, `candidate_runs.sh`, `paired.sh` contain exact
commands. `candidate.patch`, `changed_sources.sha256`, expanded imported depfiles,
actual link-object and allocator/transport manifests bind inputs. Source hashes
were checked after paired samples. Existing profile arguments:
`RESOURCE_ROOT BODIES WORKERS plain|observe [LOCALS_PER_BODY]`.

| Identity | SHA256 |
| --- | --- |
| Public compiler | `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138` |
| Baseline executable | `fd3892a557499ed2b256ca0bb3ffd6c3b9378f127b1cffc7208fdcf1ae63dc8f` |
| Candidate executable | `4ccdd459fdecc7df0874ddb54c52fd864222f5bfa63d3b8523db35e7dbe80016` |
| Identical profile source | `971fd1c591e7006b541eaf602c28d03fc0cb437c8691cd5ac7260a9807d87015` |
| Changed-source manifest | `3d8f8e7f3ebe34178f47441e9bf2d8cea352b5ce2b2ec87f64bc05cecfe3625a` |
| Imported-source manifest | `2336a45979f062f6e1618c8aa03ad4ae33381577227077613d35cc063b6a6071` |
| Link-object manifest | `5551d0c6a960bfae947299bab9235edfe090f11e9545accfb31e6e115748cd2e` |
| Memory/transport manifest | `f1d424e46694304b5a1e1cbf60ab0b42540369296854e9330db4ab58fca441c2` |

ROOT owns final affected-source adoption, bootstrap/generation/browser and release.
Old storage sanitizer evidence is not relabeled as validating these new producer
fields/branches. The service-rejected instrumentation gate remains open; no
retry/reconstruction occurred. No universal race-freedom claim.
