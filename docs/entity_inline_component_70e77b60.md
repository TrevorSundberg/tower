# Inline first component index: B2 acceptance

Accepted candidate on frozen published source
`70e77b60844ecd19554fed58d824fc115ea90479`. This is the Entity storage
change only; B1's budget gate/native mutex candidate is absent. The earlier
lowering fast-append rejection and sparse attribution remain intact.

## Ownership and implementation

`Entity` gains one pointer slot at its end. First attachment points the index
at that descriptor-owned slot. Second attachment reserves the existing minimum
four-pointer heap array privately, copies the first pointer, and commits only
after payload/table preparation succeeds. Failure disposes the pending receipt
and preserves the prior inline index/payload. Subsequent heap growth retains the
existing doubling, simultaneous old/new admission and capacity-retention policy.
No WorkBudget transaction, synchronization, scheduling or component identity changes.

Audit covered both zero-initializing constructors (`entity_create_result` and
`entity_stage_create_result`), descriptor reuse, all component-index assignments
and reserve callers, remove/re-add, stage publication/discard, exclusive leases,
reclaim and census readers. No whole-Entity copy path was found. Descriptor pages
and payload addresses stay stable when ownership transfers to the store.
Reclaim and stage discard distinguish inline storage before freeing an index.
The generic heap reserve helper remains unchanged; its three fixture prewarm
callers operate on empty descriptors. Type-instance indexes remain heap arrays.
Removal does not shrink/demote; cancelled leases restore the old component count
and retain any grown capacity as before. Accounting/locality census skips the
inline slot as an independent buffer/index because it is included in the descriptor.

## Matched measurements

KinmenB Docker `tower-b2-work`, Linux x64/WSL2 kernel6.18.33.2, LLVM19.1.1,
Release, CPU12–23, quota12,24GiB. Public bootstrap768, native owned cache,
compilerjobs1/buildjobs6. No sibling cache/build overlap. Target/input options:
width8, revision81, profile19, one unit, existing ordinary16/4096-body generator
with imported dependency and decltype/comptime reference checks; backend off.
All resources come from the frozen source archive. Original and candidate
executables are retained separately; no compiler pin/package/deployment changed.

One4096/w4 warmup per executable. Two samples per case, before/after then
after/before, sequential bounded processes. Existing semantic/grammar observer
disabled for these samples. Values below are arithmetic means; raw samples and
process wrapper measurements are retained. Canonical formatting and cleanup are
outside the inner compilation timer but included in whole-process time.

| Bodies/workers | Compile wall s before → after | Compile CPU s | Whole-process wall s | Whole-process CPU s | Peak RSS KiB |
| --- | --- | --- | --- | --- | --- |
|16/1|0.367916 →0.335907|0.366591 →0.334703|0.402272 →0.367961|0.399469 →0.366617|177616 →165574|
|4096/1|2.026969 →1.962165|2.021262 →1.956696|2.414117 →2.302414|2.406941 →2.296763|812630 →734012|
|4096/4|1.955642 →1.834748|2.709567 →2.541891|2.375276 →2.207618|3.126900 →2.911201|817216 →739682|

Whole-process wall improves8.5%,4.6%,7.1% respectively in these small samples.
This is a bounded storage improvement, not full-core scalability acceptance.
Four-worker CPU remains above serial CPU. Host variation and n2 limit precision.

| Joined accounting | Before | After |
| --- | ---: | ---: |
|16/w1 retained physical grants, bytes|20183152|18321486|
|16/w1 live receipts|33239|17118|
|4096/w1 retained physical grants, bytes|566923301|521369980|
|4096/w1 live receipts|948686|432300|
|4096/w1 peak physical grants, bytes (sample1)|656513441|603662622|
|4096/w1 retained ledger metadata, bytes|83886080|41943040|
|4096/w4 retained physical grants, bytes|566920477|521367156|

The large workload retains516386 fewer receipts, not a measured total allocation
call count. The serial injected-allocator control proves a first attachment using
an already allocated private payload page performs **zero new physical allocations
and zero new receipts**. Previously its four-pointer index alone requested104
bytes,136 bytes including the native allocator header. Production overlap uses
the ordinary allocator, never that single-owner injection state.

Descriptor cost is included: x64 `sizeof(Entity)`184→192, payload stride192→208,
and descriptor-page capacity17→16. The source uses
`compiler_buffer_alignment() == 2 * sizeof(usize) == 16`, including for owned
Entity descriptors. With `sizeof(EntityComponent)==48` and
`sizeof(EntityComponentPage)==184`, the unchanged formula requests4319→4335
physical bytes per full descriptor page, including the32-byte compiler allocator
header. A33-descriptor private size class therefore needs three pages instead of
two (13005 versus8638 bytes), a real layout cost. These are source-derived values,
not a new measured compiler page census. L1's independent joined-source review
corrected the earlier8-byte-alignment derivation (stride200; pages4311/4199;
group8622/12597); the retained runtime measurements below are unchanged.
Measured accounting fixture node bytes6256→6528 and component/instance index
bytes1280→256; created-query physical bytes34857→34872 actually increase15 bytes,
while ledger metadata2560→640. Private-stage physical bytes45567→45054 and its
ledger metadata2560→1280. Whole-compiler RSS/grant measurements above include the
descriptor/page cost, and support acceptance despite these local tradeoffs.

One separate existing-observer run per executable at4096/w4 records actual
four-way semantic kernel overlap and four distinct grammar worker threads;
shared peak lanes4, lanes after join0. Lowering has4105 jobs in both, summed
kernel CPU368.800→224.610ms, measured peak4. Observed whole compilation
1.977745→1.846718s, CPU2.785656→2.600358s. These diagnostic observations are
separate from throughput evidence; no new per-operation clocks/counters added.

## Focused correctness and limits

All twelve timed runs and both observer runs pass known42/42 execution, checked
queries, bounded admission and owning frontend teardown. Complete generated
source, imported source and Foundation bytes match across before/after and1/4
workers. Entity/component totals remain614625/756408 for4096 bodies.

Passed existing targets: component-layout, component-budget, stage-concurrent,
stage-result, attach-leases, page-reuse, accounting `profile`/`cap`, and locality
`layout mixed direct`. Added component-layout cases cover first/second/fifth
transitions, denied growth preserving payload/index, net-growth-only admission
denying an old+new heap replacement, published inline lifetime, remove/re-add,
exclusive lease conflict and promotion cancellation under a pinned view.
New component-faults `inline` mode injects every observed physical allocation in
promotion, checks exact Memory errors/unchanged prior charges, retry and discard.
All tested entity stores, physical grants and ledger owners return to zero.
Production concurrent stage/budget fixtures retain real2/4-worker overlap,
publication, cancellation, worker failure, name collision, partial admission and
reference/finalizer cleanup assertions. Stage-concurrent completes57792 finalizers.

**Pre-existing failures retained:** before editing production sources, the default
`tower-entity-component-faults-tests` and `tower-entity-stage-result-faults-tests`
abort on the frozen baseline. Retained gdb stacks place their first traps in
`component_fault_trial` and `stage_fault_publish`. Their exact accounting assertions
were not weakened; the full old fault matrices remain FAILED, not replaced by a
passing inline-mode claim. The new focused promotion control is independently
passing. No sanitizer/browser/Node/object/bootstrap-generation matrix claimed;
final integrated acceptance belongs to ROOT.

Baseline dependency build4actions:25.074459wall/21.371698CPU seconds,
1073896KiB peak. Candidate dependency build24actions:27.160029/74.761547,
1072936KiB. Final test-only6actions:2.860150/6.811701,286100KiB. No duplicate
public leaf/full compiler build. The profile executable stayed byte-identical
through final test-only additions.

## Reproduction and identities

```sh
cmake --build /cache/native --target tower-frontend-units-profile \
  tower-entity-component-layout-tests tower-entity-component-faults-tests \
  tower-entity-accounting-tests tower-entity-stage-concurrent-tests \
  tower-entity-component-budget-tests tower-entity-stage-result-tests \
  tower-entity-attach-leases-tests tower-entity-page-reuse-tests --parallel 6
/cache/entity_inline_70e77b60/before /cache/entity_inline_70e77b60/source/scaffolding 1 4 4096 dependencies artifacts OUTPUT
# Same command with after, and workers1 / bodies16. See paired.sh for order.
/cache/native/tower-entity-component-faults-tests inline
```

Evidence: `C:/Sandbox/build/codex_ecs_20261122/B2/entity_inline_70e77b60` and
`/cache/entity_inline_70e77b60`: frozen sources/resources, binaries, commands,
raw logs, failed baseline logs/stacks, full source/canonical artifacts and means.

| Artifact | SHA256 |
| --- | --- |
|Frozen source archive|`b8c13458a6b9b358378cc7b4045f1b68249a87b5470e1be693e8db19b0f39b26`|
|Before profile|`f89f1e3b268d0ba437760e3da398085d20f0a58bb5745d0442e215b0bbf8adf5`|
|After profile|`53186f76ad891dd805997a2db991e8f6e7d5ad6645c09229a782a9d8109c8b42`|
|Public bootstrap|`768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`|
|4096-body source|`60ffa29256c9463c899ffc907d9bedd9fe1611f9c8f1a406c1eb5c4dd2a5a2a9`|
|4096-body Foundation|`79b43b59b1adabbbc407fafd674ab534f33ddf70fe72c5ae4c529a010e1879ce`|
|16-body source|`d74504966bd4570b94f619db589647288c70d5fa99bf4694f31f7751166b45b3`|
|16-body Foundation|`76849f7eb1b152387a9afa31a160e20ff922940f94c4fcce6c2a74f028e04796`|

Entity layout changed: consumers must rebuild from a coherent source/package;
old and new Entity layouts cannot be mixed. No public bootstrap adoption implied.

## Publication reconciliation

Implementation/evidence commit `f9565c46` is preserved through merge
`280429f67c4f5c2835e023905b8fcba5963d2680` with published `0fe314ef`.
Incoming browser changes and counted-byte backend test fixtures are excluded from
frozen performance claims. The ECS/compiler/host producer files and focused test
inputs are unchanged. CMake reconfiguration rebuilt the native backend binding
object because its checks import the incoming backend fixture, then relinked the
profile; no measured frontend producer object rebuilt. The merged profile hash is
`f170b5f208f66e9e4c605b1adb82ccb5c135a9f35b9beb69e3d63da32747c11e`.
Merged16/w1 and4096/w4 independently pass known outputs, exact frozen canonical
comparison and cleanup; inline growth/cancellation and injected failure controls
also pass. These checks validate the merged boundary without relabeling the
retained before/after measurements. B1's gate change is still absent. All owned
work is drained. No Pages/runtime deployment was requested or performed.