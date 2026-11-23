# B2: complete Entity fault controls repaired

Frozen published source `6019450c23be2453987351d4847de37a78fab7b9`, including
the accepted inline index and B1 gate history. **Fixture-only correction:**
Entity/stage/WorkBudget/host production code is unchanged. Both previously
failing default full modes now pass; inline-only success is not substituted.

## Reproduced causes

The original failures/stacks under `entity_inline_70e77b60` remain historical
FAILED evidence. Both modes also exit134 on this coherent current baseline.
Temporary Tower diagnostics identify the first violated assertions:

* `component_fault_trial(failure=3, staged=false, large=false)` returns exactly
  `WorkBudgetError.Memory`. Bytes20908→21044, receipts7→8. The next component
  type legitimately retains its newly reserved four-pointer instance index:
  sizeof(EntityBufferAllocation)72 + four x8-byte pointers +32-byte allocator
  header =136 bytes. Payload creation fails later; no component membership is
  published. The pending inline promotion is discarded. The fixture incorrectly
  required all retained capacity to disappear as well.
* The first **successful**, uninjected `stage_fault_publish` returns None but
  changes bytes36887→32664 and receipts17→15. Publication allocates destination
  indexes, transfers private pages/names and frees stage vectors/descriptor.
  Requiring its pre-publication total after successful destruction of the stage
  is invalid. The same fixed-total assumption was also present on failed
  preparation and in the component fixture's staged success check.

The existing producer contract in `entity_stage_prepare_result` explicitly keeps
semantic identities, links and index lengths unchanged on failure while allowing
capacity growth. `entity_component_add_result` similarly reserves published type
instance capacity before allocating/preparing a payload. No leak or incorrect
rollback was found; these capacities remain reachable, charged and later freed.

## Correction and conservation

The shared **test-only** `entity_fault_accounting.tower` walks disjoint published
root trees, both store pools, independent buffers, table storage, private stage
pages/vectors/nodes/names and individual oversized payloads. Inline indexes count
only in their descriptor page; leased nodes count through the published tree.
Every physical allocation's receipt must validate against its actual budget and
match its independently calculated allocator request. The sum must exactly equal
budget bytes and live receipts, with zero lanes. The injected allocator's live
buffer count must equal those owners plus its one retained ledger vector and the
pre-trial baseline. The census itself allocates nothing.

Component failure additionally checks the **exact** allowed136-byte/index delta
(derived from the actual retained buffer), unchanged owner index/capacity,
payload/address/value, table, entity/component counts and next identity.
All existing Memory causes, successful retries and dynamic allocation-boundary
sweeps remain. Staged publication now uses its typed result instead of a Boolean.
Stage failures keep old table membership, pending-table cleanup, references,
identity, payloads and both private/leased ownership checks. Successful publication
is censused after stage destruction; finalizers are explicitly counted, must not
run on failed preparation, and must run exactly once per new payload at teardown.
Every trial still requires zero entities, components, live grants, bytes and
allocator buffers after drain; budgeted cases also explicitly require zero lanes.

No cases are excluded and no arbitrary tolerance replaces conservation. The
original separate inline failure/old+new-charge/cancellation assertions remain.

## Final checks and cost

CPU12–23/quota12/24GiB, existing B2 native cache, public768 bootstrap, Linux x64,
LLVM19 Release, compilerjobs1/buildjobs6. Fault injection remains serial; the
concurrent targets use production allocation/transport. No compiler/runtime
performance claim: fixture-only edits do not change a compiled program's runtime
path, so repeating the retained16/4096 performance matrix is inapplicable.

| Complete selection | Result | Wall ms | CPU ms | Peak RSS KiB |
| --- | --- | ---: | ---: | ---: |
|component-faults default|PASS|0.877308|0 reported|1384|
|stage-result-faults default|PASS|1.370116|1.147|1600|
|component-faults inline|PASS|1.116837|0 reported|1388|
|component-layout|PASS|0.842500|0 reported|1404|
|component-budget, real concurrent production allocator|PASS|29.495286|28.856|1656|
|stage-concurrent, real concurrent production allocator|PASS|101.536712|97.660|1596|

Short-process zero CPU readings are the profiler's reported resolution, not a
claim that the tests do no work. Costs include diagnostics/census and process
startup. The component default sweeps all6/6/2/2 physical allocation boundaries
for published-small/published-large/staged-small/staged-large, with uninjected
and after-last-boundary successes. Each staged trial also preserves its injected
publication failure/retry. Stage default covers open/view denial, the sole lease
allocation boundary, idempotent lease and all5 publication boundaries plus retry.
Concurrent stage controls retain57792 finalizers, publication/cancellation/worker
failure/name collision/partial admission; all owners drain. No sanitizer,
generation, browser or unrelated compiler matrix is claimed.

Baseline dependency build4actions costs3.530380wall/3.564494CPU seconds,
281504KiB peak. Diagnostic setup failures are retained: `print` lacked its runtime
link symbol, and the new helper initially omitted its own `work_vector_types`
import (inference/constructor diagnostics). The import was supplied and ordinary
inferred calls retained. Two stale diagnostic executions after that failed build
are preserved as failures, **not** candidate validation. Final successful rebuild
and the bounded `final_checks.sh` supply the passing evidence; final stage-fixture
build costs2.723021wall/2.252174CPU seconds,290476KiB peak.

## Evidence and reproduction

```sh
cmake --build /cache/native --target tower-entity-component-faults-tests \
  tower-entity-stage-result-faults-tests tower-entity-component-layout-tests \
  tower-entity-component-budget-tests tower-entity-stage-concurrent-tests --parallel 6
/cache/native/tower-entity-component-faults-tests
/cache/native/tower-entity-stage-result-faults-tests
/cache/native/tower-entity-component-faults-tests inline
```

Full sources, before/after executables, phase logs, failed attempts, commands and
timings: `C:/Sandbox/build/codex_ecs_20261122/B2/entity_faults_6019450c` and
`/cache/entity_faults_6019450c`. Source archive SHA256
`b1a4fe23d7332d87e0f66a4578e0604d36f7922df6c3b97d2c05df25d9adb22e`.

| Executable | SHA256 |
| --- | --- |
|Before component fault|`fe03cba00bb1f7ba351eac764a93f3de692832c2e4cb591dda66abf200215227`|
|Before stage fault|`9ccdb97bfaf6aa5f317bd383f7c2fba0c9fc5c31281b015b6c54ce14bc756d6e`|
|After component fault|`b3c778e904164c427ed67be3ffd4cf693efba3a834b8a6184cf810c38a650d07`|
|After stage fault|`18ecb7f48ff18cbbe6d522151d0c240955d8111d5893ea3588d64a7d2314a0a0`|

ROOT retains final runtime/publication ownership. The earlier inline timing and
memory receipts remain unchanged; this closes their two named failing controls.

Publication reconciliation: fixture implementation `2f4361f6` is preserved through
merge `8bcd4a366f7f9819a88eaab124dd1b2aad1aa7b9` with published `d21fb20d`.
Incoming LLVM importer, packaging, module-body test and documentation changes are
outside this acceptance. Entity/host/budget and selected fixture inputs remain
identical: the merged dependency build reports no work, both executable hashes
match, and both complete default modes pass again. The incoming independent
review's correction to the earlier inline receipt's **derived** descriptor-page
alignment/cost is preserved; its measured tables and this ownership census are
unchanged. No unrelated runtime checks are implied by this reconciliation.