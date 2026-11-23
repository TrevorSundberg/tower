# Checked grammar attachment and scoped plan reuse

The previously rejected same-world plan candidate now passes the original
finite-budget units gate. The prerequisite repair preserves the actual checked
attachment error in `syntax_emission.tower::emission_child`; no budget, assertion,
error mapping, parser reconstruction, importer or backend implementation changed.

## First incorrect cause

Starting evidence remains the rejected patch
`527b62b3a7fb0183466b208bc52558b3cc9eddbf3fb8dcfd59e7f8dfb75d76e0`
and original before/candidate binaries in `build/ecs_b1/cache/grammar_owner_1838`.
Fresh source freeze: `7e46f0250a790023130b05292759716eb31ce133`, tree
`f6397fa6fdc217412742ed7e625dc3acf7938a73`. Sparse temporary Tower caller logs
reproduced the original failure using its exact frozen resource path:

```
session cause=Memory source=.../grammar_owner_1838/input/tower.tower offset=5685
detail=Unable to allocate grammar construction
before semantics cause=Memory offset=13
```

`syntax_emit_inherit_result` starts with a Memory fallback for ordinary allocation
failures. `emission_child` already used checked entity creation/component APIs,
but attached the child through boolean `entity_attach`. That wrapper returns
`entity_attach_result(...) == None`, discarding the actual cause. On false, the
emission owner set its failed flag and left its Memory fallback unchanged.

The checked-call trace establishes the first incorrect conversion, without a
guess from the fixture name or a global allocator error:

```
producer cause=1 stage=emission_child/entity_attach_result prior=3
session cause=1 source=.../tower.tower offset=5685
before semantics cause=1 offset=13
```

Here1 is Capacity and3 is Memory. Recording that result before returning failure
makes the original fixture report `Semantic memory budget exceeded`. The local
result survives child cleanup; successful attachments leave the fallback intact,
and actual Memory results remain Memory. The legacy boolean declaration stays
available to its other callers. All trace hooks were removed from measured builds.

## Same candidate, explicit lifetime

The implementation adopts the same refined structural reuse from the prior
receipt. `syntax_world_structures` owns the existing bounded
`ParserStructureCache` through a checked `WorkBuffer`. Sessions explicitly opt
in through `syntax_version_cached_reusing`; the old cache API keeps its private
lifetime. A denied optional metadata reservation returns no index and publishes
no owner; required construction still follows its checked private-cache path.

Only immutable derived numeric LR structure is shared, within one world and
budget binding. Exact ordered productions/symbols/names, precedence, associativity,
parser mode and specialization remain the structural key. A different immutable
Bedrock revision resets the index. Target/semantic revisions do not bypass that
comparison: version-specific grammar entities, emission, replacements, userdata,
provenance and incremental declaration activation are rebuilt normally. No table
or entity pointer crosses worlds; no new disk cache or grammar authority exists.

The coordinator alone updates the index. Parser workers borrow completed tables.
`frontend_compile_sources` releases surplus cache pins after parsing joins and
before semantic work; live versions retain their own table pins. World teardown
also releases the owner, including failed or cancelled requests. The existing
`FrontendCacheLimit` is unchanged. Required allocation failures remain errors.

## Focused validation

The uninstrumented full `tower-lr-work-tests RESOURCE_ROOT units` selection
passes in13.74s wall/23.46s CPU/783156KiB peakRSS. It includes the unchanged
`frontend_units_memory.tower:189` source `import tower; fn answer():i32{return 42;}`,
`memory.tower`, workers1/width8, derived constructor/input bytes plus64MiB.
Peak-minus-one denial, retries, no failed publication, cancellation/drain,
independent-world canonical results, executed dependencies and ordered errors
also complete. No partial selection is labeled a complete pass.

Structural reuse, explicit metadata denial/retry, seed/profile/world isolation,
live-version lifetime and zero-grant cleanup pass. Grammar-resource allocation
failure tests and grammar-equivalence/override/revision tests pass unchanged.
The same candidate's prior independent150-grammar oracle and native LR evidence
are reused: no LR algorithm or successful structural identity changed here.

Actual nm reports exposed exactly the new Semantics import
`syntax_world_structures_clear`. Its exact allowlist entry and the existing
truncated/suffixed/wrong-owner negative fixture pass; ParserNodes and Semantics
object checks pass. The old validator's rejection is retained. No broad symbol
allowance or new native implementation was added.

Two setup failures remain in the evidence: removing the old `entity_attach`
declaration broke a transitive Bedrock caller, so it was preserved; the first
grammar-equivalence launcher ran from `/work` and could not resolve relative
Bedrock, so only that failed check and the unstarted units check were run from
the frozen resource directory. No assertions were weakened.

## Checked measurements

KinmenB Linux x64, CPU0-11/24GiB, one owned native cache, public768 bootstrap
with `TOWER_BOOTSTRAP_COMPILER` unset, LLVM/Clang19. Inputs/binaries/manifests
were frozen; no running jobs overlapped builds. Native x64 object compilation,
warm filesystem/fresh process, production allocator. Serial n2 alternates order;
jobs4 is one control. Existing16/1000-function Tower/C fixture bytes are unchanged.

| CLI fixture / workers | Wall median before / after s | CPU before / after s | Peak RSS before / after KiB |
| --- | ---: | ---: | ---: |
| Small / 1 | .500 / .445 | .425 / .375 | 185782 / 187306 |
| Large / 1 | .635 / .600 | .565 / .530 | 238004 / 230716 |
| Small / 4 | .550 / .500 | .500 / .450 | 188952 / 190096 |
| Large / 4 | .680 / .640 | .650 / .610 | 239232 / 235092 |

All12 objects equal the original independent reference objects; all12 linked
executions print exact15/999. Small before samples .52/.48 are retained, not
selected for a larger gain. The earlier Clang19 `-O2 -fwrapv` .04/.09s controls
remain separate prior evidence, not newly measured results. Four-worker CLI
latency still trails serial on these inputs; the large fixed frontend gap remains.

Existing `frontend_units_profile` n2, four worlds, default16-body shape (only the
last unit has the additional bodies), no grammar observer in timed samples:

| Workers | Compilation wall before / after s | CPU before / after s | Peak RSS before / after KiB |
| --- | ---: | ---: | ---: |
| 1 | 1.7349 / 1.5225 | 1.6265 / 1.4154 | 231882 / 232858 |
| 4 | 1.4429 / 1.1389 | 4.5614 / 3.6466 | 557626 / 560384 |

All eight known-result/canonical checks pass, hash14671003786951432625; all
report zero lanes after join. Retention increases352512 bytes across four worlds.
This does not claim B2's uniform12-unit throughput result or backend scaling.

Separate serial observers show cold table builds123 to115, installed60+123 to53+63.
Allocation calls2144125/2562398 become2067635/2222326 cold/installed. Live bytes
1893528 become1965224/1981656; peaks58035248 become58721312/58737744; ledger metadata
stays5242880. Teardown asserts zero grants and buffers. One instrumented installed
request table interval regressed205.08 to213.83ms despite fewer builds; that noisy
observation is preserved and is not used as a speedup claim. Acceptance uses the
checked alternating end-to-end samples and the now-passing failure contract.

## Evidence boundary

Raw evidence: `build/ecs_b1/cache/grammar_cause_7e46`, including exact source
snapshots, manifests, before/after binaries, trace patches/logs, full units output,
objects/executions, JSON profiles, original failures and symbol reports.
Measured final compiler SHA256:
`771bb0e964501a1f7096f9e606247255f291231bb6ddf03504440f595bede1e5`.
Measured source patch SHA256:
`3559ae5a3de2926368844d036f6ef2615078a25b0d49f09232313365aea7bb51`.
No compiler generation, Node/browser matrix, sanitizer campaign, public pin
adoption or hosted deployment is claimed. Prior rejected evidence and generation
freezes remain intact. ROOT retains final integrated publication.
