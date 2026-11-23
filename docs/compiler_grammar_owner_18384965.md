# Grammar-plan reuse trial: rejected on resource-error behavior

Production is unchanged. A bounded world-owned structural-plan candidate reduced
duplicate construction and measured latency, but failed an existing exact
resource-error assertion. The original sources and all four native executables
were restored byte for byte. No changed compiler, cache policy or test assertion
is adopted by this receipt.

## Frozen inputs and actual producer

Source `18384965d21ee5f710b05db3623f13668d68c993`, tree
`2b31d12666e99f53ee9d2d92636d2f6d81361e47`; KinmenB Linux x64, CPU0-11/24GiB,
one B1 native cache, LLVM/Clang19 and checked-in public768 predecessor, with
`TOWER_BOOTSTRAP_COMPILER` unset. Disk was115GiB free; prior jobs were drained.
Dependency-aware builds used at most six object jobs. No Node, generation,
browser or sanitizer matrix was repeated.

`frontend_unit_compile` installs Bedrock/Foundation in each independent world,
then calls `frontend_compile_sources`. `syntax_baseline_install` destroys its
syntax session and resets module compilation caches. Each session's
`SyntaxVersionCache.structures` owns its own bounded immutable LR index.
Consequently, later imports in that same world can reconstruct a numeric LR
structure already built during installation. The audit did not justify sharing
module entities, semantic identities or mutable cache indexes across worlds.

The candidate reused the existing `ParserStructureCache` through an explicit
world-owned `SyntaxStructureOwner`, charged through `WorkBuffer`. It retained the
existing64-entry limit and exact ordered production/symbol/name, precedence,
associativity, mode and specialization comparison. World, budget and immutable
Bedrock revision changes reset its scope. Version-specific emission, userdata,
replacement bindings, source provenance and grammar activation stayed separate.
Workers borrowed finished tables; only the owning coordinator mutated the index.
There was no disk cache, global cache, second grammar or changed LR algorithm.

The first lifetime shape retained about55MiB extra per world and broke the old
cache-only cleanup check. A refinement preserved the old `syntax_version_cached`
API's private lifetime, made session reuse explicit, and dropped surplus cache
pins after source parsing joined, before semantic work. Live versions retained
their own table pins. This refinement is also rejected, not shipped.

## Measurements, including the failed candidate

Existing `compiler_reference_inputs`16/1000-function fixtures and their independent
C sources were copied unchanged. Tower SHA256 small
`5966271c7144afe728376214c0289d60c0e682be71a0c7f29da386f962ba9fd2`, large
`583024d07c2c70a84e6c8cf5167d972fb44e8e2d0c6c74645bd4fb75da120639`.
Commands used native x64 object output, explicit frozen Bedrock/Foundation,
jobs1/4, production allocator, fresh processes and warm filesystem. GNU time
records whole-process wall/user/system/peakRSS. Final serial samples alternate
before/after order, n2; four-worker control n1. Initial lifetime trial n3 logs
remain distinct and are not relabeled as the refinement's evidence.

| Final candidate observation | Wall s before / candidate | CPU s before / candidate | Peak RSS KiB before / candidate |
| --- | ---: | ---: | ---: |
| Small, jobs1, n2 median | .49 / .45 | .42 / .38 | 186216 / 187310 |
| Large, jobs1, n2 median | .63 / .60 | .56 / .525 | 238760 / 231796 |
| Small, jobs4, n1 | .55 / .50 | .50 / .45 | 187764 / 189220 |
| Large, jobs4, n1 | .70 / .66 | .67 / .62 | 240468 / 235552 |
| Frozen parser_table production unit, jobs1, n1 | 1.18 / 1.09 | .80 / .72 | 229364 / 220892 |

All12 final fixture objects match their original known-good objects; all12 linked
executions print exact15/999. Both production-unit objects match, SHA256
`c8831519174e410abf5116ebb6b25610696e11644bd8283ef1a15194b659fd56`.
The earlier matched Clang19 `-O2 -fwrapv` controls remain .04/.09s from the
12722151 receipt; they were not rerun or relabeled current. The serial gap remains.

Existing `frontend_units_profile`4 independently owned units/16 bodies, n2,
alternating before/after, no grammar observer during these timings:

| Workers | Timed wall s before / candidate | CPU s before / candidate | Peak RSS KiB before / candidate |
| --- | ---: | ---: | ---: |
| 1 | 1.7293 / 1.5382 | 1.6237 / 1.4332 | 231736 / 233154 |
| 4 | 1.3775 / 1.1501 | 4.4050 / 3.6960 | 557212 / 560648 |

All eight profile runs independently check the known result and canonical hash
`14671003786951432625`. These frontend-only runs do not claim backend/object
scaling. Final retained bytes rise by352512 across four worlds; parallel observed
peak-budget bytes span424242445-425462285 before and422862006-427985785 candidate.
This is a small matched observation, not B2's independent12-unit campaign.

Separate existing grammar observers show actual avoided work: installed startup
tables60 to53, subsequent request123 to63; four units732 to464 total constructions.
Cold request123 to115. Cold/installed allocation calls2144109/2562404 become
2067619/2222332. Final cold/installed live grants retain1965224/1981656 bytes
versus1893528, with peaks58721312/58737744 versus58035248. Metadata remains5242880.
Both observer programs require zero grants/buffers after world teardown.
Canonical output remains976 bytes, hash13832670361687071853. Observed table
intervals include instrumentation overhead and are not end-to-end speed claims.

## Required gate that failed

The refined candidate passes structural identity/profile/seed/world isolation,
optional metadata denial/retry and zero-grant cleanup, grammar equivalence and
local revisions/overrides, grammar-resource denial coverage, the independent
150-grammar closure/state/action oracle, and actual native threaded LR control.

It **fails** `tower-lr-work-tests RESOURCE_ROOT units` at
`scaffolding/tests/frontend_units_memory.tower:189`. The minimal existing source
is `import tower; fn answer():i32{return 42;}`, path `memory.tower`, workers1,
pointer width8. The unchanged test derives constructor/input costs, then grants
64MiB of compilation allowance. It requires `WorkBudgetError.Capacity`, rendered
as `Semantic memory budget exceeded`. The candidate instead renders
`Cannot allocate semantic storage`, the exact `WorkBudgetError.Memory` message.
The assertion terminates by signal6 at .59s; later unit cancellation/dependency
assertions in that candidate invocation are unstarted, not passed.

The frozen **before** executable completes the same full units selection:
16.36s wall,27.23s CPU, including cancellation/drain, exact serial/worker canonical
results and dependency error order. The new retained-plan allocation/lifetime
changes expose a different failure route. The exact internal producer which
reports Memory has not been isolated; the assertion's name does not prove that
the candidate failure occurs during parsing. No assertion, byte cap or error
mapping was changed to accommodate it.

This exact typed-cause regression blocks adoption despite useful timings.
The finite prerequisite is preserving the first checked allocation cause under
this existing bounded unit fixture before reconsidering shared plan lifetime.
ROOT can route that producer after isolation; this receipt does not assign a
speculative parser/backend root cause or enter L2's retention/reconstruction work.

## Preserved evidence and restoration

Full B1 evidence: `build/ecs_b1/cache/grammar_owner_1838`, including frozen source,
fixtures, compiler binaries, original and refined patches, per-command logs,
objects/executions, JSON profiles, manifests, failed checks and rebuild logs.
The initial missing extern declaration and an unbound-budget test setup failure
were corrected with their failed logs retained. No failed observation is omitted.

Rejected final patch SHA256:
`527b62b3a7fb0183466b208bc52558b3cc9eddbf3fb8dcfd59e7f8dfb75d76e0`.
Candidate compiler SHA256:
`91fb1f139dcd4ceb0cda55658f8a53f4670fee67ee1ed6feeb7295aa415210e1`.
Restored compiler SHA256:
`a5e3f65b93b0ff6ff0854ed7391ce4cc991ecb1e2c4fa7ff119ef9fd8d72165d`.
Source SHA manifests pass before/after restoration. Restored `towerc`,
`tower-frontend-tests`, `tower-lr-work-tests` and `tower-frontend-units-profile`
equal their frozen originals byte for byte, so their unchanged evidence is reused.
The candidate's additional `syntax_world_structures_clear` object import is
retained in its nm report only; no public symbol-policy expansion is adopted.
Prior Node passes, native generation freezes and public bootstrap remain intact.
