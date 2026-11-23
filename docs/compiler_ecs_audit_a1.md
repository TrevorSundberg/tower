# A1 semantic ECS and continuation audit

Review baseline: `6282238779034442e0578d76b921ca117df819f1`, KinmenA,
2026-11-22. This is a living review receipt, not acceptance closure. A1 owns
34 baseline `scaffolding/compiler/semantic_*.tower` files excluding the five
type/generic files, plus `units/semantics.tower` and `units/semantics_checks.tower`.
The new A1 `semantic_query_pipeline.tower` is included below as a working-tree
implementation. Upstream through `60312d3a` changed documentation only in this
clone; baseline compiler inspection remains applicable.
`semantic_constructor_work.tower` is reviewed here but implementation is reserved
to L2. Shared context/layout/expression interfaces require routed agreement.
Existing test files belong to D1; A1 owns new focused regression fixtures.

The current `executable_functions` / `IMFunctionInput` producer is implemented.
The older handoff's missing-helper text is historical, not a task to reimplement.
Review distinguishes canonical world-owned Foundation entities, derived indexes,
and private executable snapshots. Stable component payloads and dense pointer
columns are not evidence of packed payload storage or measured locality.

## Sources and review rules

- [Flecs systems](https://www.flecs.dev/flecs/Systems.html): declared accesses,
  scheduler ordering and deferred structural publication guide the audit.
- [Flecs component traits](https://www.flecs.dev/flecs/ComponentTraits.html):
  storage choice must follow actual lifetime/access requirements; an acyclic
  relationship annotation is not proof that every cycle is detected.
- [Burst aliasing](https://docs.unity3d.com/Packages/com.unity.burst@1.8/manual/aliasing.html):
  optimization requires supported alias facts; Tower does not gain disjointness
  merely from a view, index or separate job name.
- Local contracts: compiler ECS completion/handoff, compiler services, modules,
  computed type arguments, type values, function values, bootstrap distribution,
  and the journal's newer type-value continuation.

All entries below refer to the baseline above unless a newer revision is named.
“Reviewed” means source inspection of the stated surface, not a passing test.
Unlisted source regions remain open; no file is accepted solely from its name.

## File receipts in progress

| Path under `scaffolding/compiler/` | Review, ownership/storage and scheduling findings | Evidence gap / disposition |
| --- | --- | --- |
| `semantic_lifecycle.tower` | Entire file reviewed. Context owns derived tables, graph, pool and scratch; semantics stay on program entities. `semantic_compile_budget` drains checking, defer, known proof, lowering, evaluation, attributes, known publication, module initialization and flow in sequence. Disposal delegates to phase owners before freeing shared scratch. | Trace narrower readiness before replacing barriers; verify all disposal paths drain the pool. No measured change yet. |
| `semantic_program_types.tower` | Entire file reviewed. Program owns function/type/error vectors; module registry stores world-local component kinds. No duplicate authoritative IR or scheduler. | Preserve ABI with B2/L2; explicit world is derived from root. |
| `semantic_work_ids.tower` | Entire file reviewed. Shared phase result and stable query/access IDs; bounded 256-job preparation windows independent of pool width. | A bounded window is neither overlap evidence nor a performance result. Extend only through cross-owner agreement where needed. |
| `semantic_context.tower` | Entire file reviewed, including editor observations. Root determines component kinds and world budget; lexical state lives in `SemanticBodyScope`. Query observations publish after joins. `sem_query_pending` also treats terminal failures as pending, so the owning finalizer must distinguish failure from a cycle. | L2/coordinator agreed the new `source_binding_pipeline` kind field. Allocation ownership and cancellation still need end-to-end evidence. |
| `semantic_capture_work.tower` | Entire file reviewed. One declaration-owned capture component retains proof, checked expression and evaluation across waits. Completed lexical-prefix evidence replaces a whole-body prerequisite. Global initializer publication updates the same binding once; interpreter input records owner/ordinal. Failure text remains on the producer. | `sem_source_binding_require` synchronously drains proof scans inside the pump; replace only with explicit resumable proof readiness. Test alias invalidation and repeated waits. |
| `semantic_source_bindings.tower` | Entire file reviewed. Syntax scan binds original declarations, lexical shadow scopes and module aliases; writes/address escapes invalidate candidates. Per-job vectors publish into declaration components after joins. Unknown statement contracts conservatively deny proof. Initial demand scans program functions and templates; later specializations may not invalidate an already consumed cross-owner proof. | Whole-program scan is a measured-target candidate, not yet a demonstrated bottleneck. Need lazy proof pump, deterministic failure, alias/shadow/defer/loop and specialization evidence. |
| `semantic_execution_work.tower` | Entire file reviewed. Existing body producer prepares derived Foundation snapshots, remaps local bindings, retains original function identity and publishes `IMFunctionInput` only after joined stages. Explicit Body/Layout/Expression accesses precede dispatch. Snapshot scratch/errors/aliases are private. | Replace bespoke submission loop only if shared dispatcher preserves semantics; verify frame capture ownership, failed snapshot and nested helper evidence. Helper readiness is already implemented. |
| `semantic_evaluation.tower` | Entire file reviewed, including relocation/disposal. Persistent ordinary interpreter invocation discovers executed dependencies and retains state over suspend/yield. Queries own preparation readiness; alias publication follows joins. Type/function results relocate through ordinary declaration/descriptor identity. Early errors are retained when declarations are isolated. | Ordinary and early type execution still differ in prerequisites. Deterministic failure selection and quiescence require focused tests. New constructor bridge awaits coordinated L1/L2 inputs; no separate evaluator is proposed. |
| `semantic_evaluation_work.tower` | Entire file reviewed. Per-subject clone/preparation components own stages and scratch; graph accesses reserve expression output and immutable input domains. Dispatch joins all readers, publishes every stage, then aliases and receipts. Registration cursor prevents repeated preparation. | `sem_evaluation_work_all` drains all ready windows inside another pump; assess bounded pumping without weakening snapshot readiness. |
| `semantic_known_bindings.tower` | Entire file reviewed. Independent immutability/order/known-value metadata on declarations; inferred values use the ordinary interpreter. Canonical scan, module-order scan, mandatory-input admission and snapshot receipt precede lowering. Publication compacts derived item/local indexes after patches. | Order scan conservatively follows both branches/called bodies; reproduce whether untaken module reads incorrectly prevent fixed initialization. Source and checked proof systems overlap; unify only with preserved extension/alias contracts. |
| `semantic_known_work.tower` | Entire file reviewed. Shared kernel actions own candidates/mutations/patches/storage and private scan state. Table query produces a source-ordered pointer vector, not packed payloads. Bounded shared dispatch fronts reserve tickets before frozen worker context; joins precede graph observations/publication. | `sem_known_jobs` assumes every requested producer can immediately be taken, preventing general interleaving. Need resumable proof ownership and failure/cancellation coverage. |
| `semantic_modules.tower` | Entire file reviewed. Module/import ownership is retained on parse entities with named/ordered relationships; tables are derived. Qualified aliases respect lexical shadowing. Link-symbol coalescing occurs after signatures; canonical names/publication are coordinator ordered. Cyclic module initialization uses fixed-value proof receipts. | Module proof semantics and source-order diagnostics need reproduced tests; no permission to change frontend resolver or type policy. Linear scope/name scans need profiling before optimization. |
| `semantic_body_work.tower` | Entire file reviewed. Per-body ECS continuations retain block/control/defer cursors, lexical scopes, prepared values and for/protocol phases. Declaration binding/storage and assignment destination queries precede initializer/RHS demand. Worker scratch transfers at joins; all leased stages publish before bookkeeping. Source windows admit later producers while earlier bodies wait; errors remain producer-owned until source-order selection. | Compatibility fallback and declaration/for publication still call `sem_layout_all`; `layout_checked` can advance to all types. Static call discovery versus executed demand and these phase boundaries need focused validation. New value-constructor admission is coordinated; no overlap/speedup claim from window width. |
| `semantic_declarations.tower` | Entire file reviewed. Declaration/expression/array components retain call index, type frontier, lexical owner, prepared inference and constructed-layout obligations. Discovery distinguishes type/value roles; workers read frozen names/types and record observations. Structural call/nominal publication occurs after joins and all stages publish first. Failed dependency traversal reuses producer diagnostics instead of recursive checking. | Query failure traversal currently follows graph edge insertion order, requiring deterministic multi-failure tests. Layout compatibility and source-order module range drains remain. `decltype` borrows existing place type; semantic execution must stay in the ordinary interpreter. New constructor admission retains worker-private descriptor-only checking. |
| `semantic_statements.tower` | Entire file reviewed. Ordered registration builds source/module indexes and forward identities. Block cursors retain source position, labeled flow and deferred boundary; bind/storage/initializer phases avoid rebinding or appending slots after suspension. Scope-local output sorts names rather than hash/pointer order. | Synchronous compatibility checking and global layout drains remain. New late ABI hook traverses complete descriptors before lowering under L2 agreement; runtime/recursive ABI evidence pending. |
| `semantic_lowering_work.tower` | Entire file reviewed. Function-owned output stages, private diagnostics/aliases and all-stage publication precede mutation/receipt publication. Registration depends on Body, KnownSnapshot and per-function AggregatePrepare. Signature preparation reserves function/parameter entities. | Callback signature publication remains a coordinated global barrier. Compatibility wrapper finalization needs inclusion in full lifecycle quiescence. Ordinary lowering must not race snapshot/signature consumers. |
| `semantic_aggregates.tower` | Entire file reviewed. Original signatures live on function entities; lowered pointer ABI uses derived signature metadata. Aggregate copies snapshot their source before field/array transfers, preserving overlap. Call preparation preserves callee/argument order. | Callback type rewriting recursively mutates shared signature entities after the aggregate preparation barrier. A narrow producer is possible only with complete alias/read access evidence; no `noalias` is inferred. |
| `semantic_attributes.tower` | Entire file reviewed. Declaration wrapper attributes remain associated with original entities; typed staged values are checked against exact metadata fields and published after evaluation. Duplicate nominal attribute identity is rejected. | Attribute checking still occurs in the ordered registration phase; generic uninstantiated attributes are explicitly unsupported. Need affected staged-failure/source-order evidence when lifecycle changes. |
| `semantic_call_inference.tower` | Full inference path reviewed. Query-private constraint arrays derive generic bindings from actual argument types. Worker inference defers reflected type interning to coordinator publication. Already-checked protocol arguments are retained. | Expected-type discovery can visit typed peers before literals; emitted runtime calls must still preserve callee-before-argument/LTR effects. Recursive matching depth is bounded; policy changes belong with L2. |
| `semantic_constructor_work.tower` | Entire baseline file reviewed, implementation reserved to L2. Constructor continuations retain original definition scope, clone/alias/execute phases, ordinary evaluation and early nominal identity before field completion. | New executed representation requests use owner+sequence rather than a source-node singleton under the coordinated L1/L2 contract. A1 integrates readiness/disposal only after exact producer imports arrive. |
| `semantic_control.tower` | Entire file reviewed. Match and loop cursors retain header values, lexical scope, arm index and flow. Counted-loop update moves to a guarded loop head when `continue` requires it, avoiding duplicate effects. Generated control names use source reservation rather than pointer order. | Match pattern/count and Foundation nesting limits are explicit. Retained header scope and nested continues require continuation tests; control code itself has no scheduler or authoritative alternate tree. |
| `semantic_defer.tower` | Entire file reviewed. Canonical node clones remap internal bindings in a second pass; staged aliases retain shared producer relationships. Prototype local/frame cursors roll back before per-exit clones; return expressions are saved once. Hygiene follows source encounter order. | Verify prototype-local rollback against `checked_locals` and suspended body prefixes; no reproduced defect yet. Reverse cleanup and Foundation raw-storage contracts must remain intact. |
| `semantic_definitions.tower` | Entire file reviewed. Defines semantic scalar/operator names, constructor arities and builtin classification; no mutable scheduler/storage owner. | Legacy numeric builtin tags remain a type-policy consolidation concern, not an A1 mechanical rewrite. Use L2's ordinary policy definitions when its complete checkpoint lands. |
| `semantic_enums.tower` | Entire file reviewed. Nominal declaration identity precedes completed integer representation/fields. Discriminant duplicate checks, wrapping increment and source field order are explicit; derived lookup respects lexical binding. | Enum literal grammar is restricted deliberately. No independent constant evaluator added; type legality remains coordinated with L2. |
| `semantic_evaluation_aggregates.tower` | Entire file reviewed. Aggregate results retain ordered field identity/projection paths until layout exists. Private interpreter storage remains retained until scalar leaves are materialized; nonzero raw pointers cannot escape as relocatable values. | Layout/field producer readiness must be preserved for early aggregate captures. Relocation and failure cleanup need independent malformed/round-trip coverage. |
| `semantic_expression_lowering.tower` | Entire file reviewed. Normalization mutates canonical world entities through owner stages. Lazy paths lower to selected blocks; stores snapshot destination before RHS, aggregate copies preserve overlap, calls lower callee before ordered arguments. Pending staged enum conversions use consumer-owned projections. | Known-binding initializer ranges are recorded for later storage removal. Constructor opcode must preserve operand effects under the new agreed capability contract. This lowering is not a second evaluator. |
| `semantic_expressions.tower` | Entire file reviewed. Transient surface classifications enrich the same nodes and are removed by ordinary lowering. Exact types and addressability govern writes; nullable scalars require guarded fallback. Unary minus preserves signed-minimum literal semantics and floating signed zero without a separate arithmetic folder. | Type inference may inspect a typed peer first, but emitted lazy/LTR effects remain ordered. Named initialization synchronously calls layout compatibility; worker admission must establish readiness. Type/operator policy changes require coordinated L2 work. |
| `semantic_flow.tower` | Entire file reviewed. Function-owned flow queries depend on actual staged conditions and traverse lowered canonical blocks without executing expressions. Source-order result vector chooses deterministic errors. | `sem_flows` still drains a late batch and assumes readiness; lowering readiness is an implicit phase contract. Convert only with explicit prerequisites and owning-pipeline finalization. |
| `semantic_iteration.tower` | Entire file reviewed. Iterator protocol handles belong to retained body work; Begin/Next/Element/End lower through ordinary functions. Source is evaluated once and cleanup uses lexical defer. Prepared storage consumes layout evidence. | Compatibility path can synchronously request layout; new lazy admission must keep it off workers. Raw array iteration remains explicitly unsupported. Protocol/generic legality changes need L2 coordination. |
| `semantic_iteration_work.tower` | Entire file reviewed. One protocol role resolves at a time in body-owned continuation. Private inference copies avoid worker interning; TypeIndex read claims end before structural specialization/publication. | Shared-budget/real-overlap evidence still needed; role count alone proves neither. Preserve already-checked arguments and owner scope across waits. |
| `semantic_layout.tower` | Entire file reviewed. Query components own stable layout state; derived work IDs/indexes schedule field prerequisites and refill worker slots. Source-earliest IDs select failures. Completed dependency payloads are immutable inputs. | `sem_layout`/`sem_layout_all` compatibility drains can diagnose before other producers run; callsites need full audit. This module also closes the shared worker pool during disposal, an implicit lifecycle responsibility. |
| `semantic_layout_kernel.tower` | Entire file reviewed. Kernel consumes explicit target pointer width and completed field layouts, writes one retained layout result and private diagnostic. Packed payload locality is not established by its component index. | No layout parallel speedup claimed. Recursive records and array overflow need preserved independent tests under L2 policy. |
| `semantic_query_pipeline.tower` (new) | Working-tree implementation reviewed. Services existing interpreter, capture, source-proof, body and executable producers once per call, preserving explicit Progress/Waiting/Complete/Failed results. Does not finalize cycles or introduce another graph. | Public predecessor compiles the closure. Runtime fixture and full lifecycle integration remain pending; shared type-execution producer import follows L2 delivery. |
| `semantic_support.tower` | Entire file reviewed. Nominal types compare entity identity; callbacks compare signatures structurally. Semantic tables are derived pointer-key/name indexes, with separately allocated stable entries. Worker contexts own temporary text, scopes, lists and diagnostic buffers; diagnostic instantiation provenance is bounded and source based. | Old hash bucket arrays and every token spelling copy remain retained until context disposal. Profile allocation/retention before replacement. `sem_allocate` still uses `alloc/free` through compiler runtime rather than explicit world buffer APIs; A2 allocation contract coordination is required. No packed payload or locality claim. |
| `semantic_values.tower` | Entire file reviewed. Locations resolve original module/local declarations and field identities; index type checking separates layout from inference. Prepared generic calls retain argument syntax/instances; indirect callee checks precede arguments. Literal parsing and representation decoding preserve exact types; all arithmetic/staged evaluation remains elsewhere. `decltype` permits only its complete place operand to borrow aggregate type without copying storage. | Field lookup still invokes layout compatibility after readiness admission. Full-depth type/layout proofs must hold on worker paths. New representation-value hook follows indirect-call precedence and emits the shared capability operation; runtime effects and independent-body admission need joined tests. |
| `units/semantics.tower` | Entire file reviewed: imports production services and kernels only. No scheduler, payload or lifetime of its own. | Joined owner drafts compile with the public predecessor; no production-unit split required. |
| `units/semantics_checks.tower` | Entire file reviewed: same production imports plus `tests.semantic_world`. This is a true compilation closure, not a new semantic ABI. | Enlarged query fixtures exceed the public predecessor's component budget. Requested a coordinated separate fixture object; do not duplicate exported definitions, raise an undocumented budget or hide the failed check. |

Source inspection now covers all 34 baseline assigned production files, both
semantics units and the new query-pipeline file. This closes the inspection
inventory only. Every evidence gap/disposition above remains subject to measured
implementation and integrated acceptance; the lane goal is not complete.

## Implementation and evidence in progress

The agreed source-proof change adds world-owned retained result vectors and an
aggregate query. Captures suspend before scans dispatch. `sem_known_jobs_begin`
and `sem_known_jobs_pump` share existing kernels/graph/pool; one frontier joins
before returning, later ready work can pass an earlier waiting task, and facts
publish only after the proof receipt is runnable. Disposal releases unfinished
vectors after workers drain. Late known-analysis compatibility wrappers still
drain synchronously; this is not full lifecycle acceptance.

`scaffolding/tests/semantic_source_proof_checks.tower` is new A1-owned test logic.
It creates real world/graph/scan work, blocks an earlier scan, exceeds one
256-job frontier, repeats waits, checks dispatch counts and publication, and
exercises prerequisite failure, stale tickets, cancellation and world cleanup.
The public predecessor compiles it. The coordinator authorized the narrow
import/call in D1's existing `evaluation_query_tests` matrix; that hook is now in
the working tree, with execution pending. The fixture explicitly does not equate
queue width with actual overlap.

The combined fixture import now also calls L2's receipt test under the exact
coordinator-approved harness contract. Its owner v2 adds wrong-dependency
rejection. The enlarged semantics_checks closure fails the public pin's fixed
component budget; the production semantics closure passes (wall 19.66 s,
user 14.46 s, system 1.10 s, peak RSS 795876 KiB). Fixture execution is pending
a coordinated unit split, not skipped or reported as passing.

Smallest complete semantic unit compilation, public Linux x64 bootstrap,
`--jobs 1 --library --emit object --timings`, Docker affinity 0-1 / 2 CPUs / 4 GiB,
one fresh-process sample each: baseline wall 19.52 s, user 14.34 s, system 1.17 s,
peak RSS 777360 KiB; changed closure wall 19.13 s, user 14.26 s, system 1.11 s,
peak RSS 793636 KiB. These are compile-closure checks, not execution profiles of
the changed pump or evidence of a speedup. The first changed compile failed on
missing explicit foreign query declarations; its log is preserved, declarations
were corrected, and the second compile passed. Logs are under the external A1
cache (`semantics_checks_before`, `semantics_checks_pump`,
`semantics_checks_pump2`, `source_proof_fixture_compile`).

The public pin reproduces a separate ordinary capture failure: an untaken
`if false { return Later; }` in an earlier initializer's helper prevents later
`comptime(Later)`. Static KnownOrder follows that dead read. Removing the scan
alone would be unsound: actually executed early reads must keep runtime storage
and prevent later constant substitution at those uses. An executed proof must
preserve that distinction through ordinary interpretation. No fix/acceptance is
claimed yet. The two-module cyclic probe also failed, but its dependency-first
runtime order needs contract review before asserting a positive expectation.

Final runtime profiling, allocation/retention measurements, supported
instrumentation, canonical clean bootstrap, native/browser/generation matrices
and leased hosted publication remain open. Documentation-only parts of this
receipt do not alter runtime performance; the production change above does and
requires the pending measurements.

## Additional declaration/API boundary receipts

Reviewed against the working tree after documentation-only 60741c51. These
modules move the existing component definitions; they do not introduce a second
semantic graph. Original struct fields and enum values are retained.

| Path under scaffolding/compiler | Storage/world/scheduling/ownership review | Evidence and disposition |
| --- | --- | --- |
| `semantic_context_types.tower` | Single context/table/scope/observation declarations, explicit program/world ownership through existing fields. No implementation exports or scheduler. | Public predecessor compiles the data unit; all concrete type consumers require direct imports. Runtime layout equivalence and full linked tests remain gates. |
| `semantic_evaluation_types.tower` | Retained invocation, result, aliases and projection leaves keep the same per-evaluation ownership and lifetime. | Source-only relocation; type/request identity remains world/owner based. Joined compile passes; runtime suspension/cleanup still needs tests. |
| `semantic_declaration_types.tower` | Existing declaration continuation, lexical state and call metadata are defined once. Derived vectors remain producer-owned. | No query logic moved into this module. Explicit imports avoid implementation cycles; production compile passes. |
| `semantic_constructor_types.tower` | L2-owned constructor phase/payload relocated under explicit coordinator agreement. Same nominal descriptors and evaluation pointer. | Mechanical handoff exported separately; constructor algorithms remain L2-owned. |
| `semantic_known_types.tower` | Existing scan/patch/storage payloads retain private traversal results and source ordinals. Pointer vectors remain derived indexes, not packed component payload claims. | Preserves original fixture inspection of retained jobs. No locality or throughput claim from relocation. |
| `semantic_source_binding_types.tower` | Immutable-binding facts and aggregate proof continuation retain their owning declaration/program components. | Request/pump implementation remains separate. Publication and cleanup assertions remain intact. |
| `semantic_query_api.tower` | Declaration-only linked interface over the actual shared types. Coordinator owns mutation; worlds and inputs outlive joined pumps/disposal. | Query fixture object exports only its three test entrypoints; no duplicate compiler API bodies. Native/browser/package linkage and runtime acceptance remain pending. |

Together with the earlier 37 paths, source review now covers 44 A1 paths. This
count records review coverage only. Build evidence: full query fixture object
3.04 s wall / 2.05 s user / 0.16 s system / 216404 KiB peak RSS after separation;
earlier whole-implementation import object 16.05/11.69/0.95 s / 741176 KiB.
Single samples share the public pin and 2 CPU/4 GiB profile but are not a runtime
benchmark. All remaining lane acceptance gaps listed above stay open.

## Working receipts after root-demand and admission investigation

- semantic_body_work: early pipeline creation must not cache an unfinished
  module root's call graph. Ordinary root_calls publication now occurs exactly
  once at body_roots; existing executed-helper demand remains separate. Reproduced
  missing demanded generic body and runtime fault, then type/control-smoke and
  one-trace negative oracle pass. Source-order call proof is a derived index.
- semantic_support/declarations/body/capture/evaluation: complete producer error
  receipts restore bytes/offset once, preserving an earlier selected diagnostic.
  Original L1 oracle remains an independent acceptance gate.
- semantic_expressions: inferred init(Type) may be checked twice with a later
  expected type; reuse canonical checked fields through sem_surface_expected.
  No field replay, clearing or ownership transfer. Reproduced failure; fix and
  new owned lifecycle fixture compile evidence do not yet constitute runtime pass.
- semantic_context and body/declaration/evaluation/evaluation_work/execution_work/
  flow/iteration_work/known_work/lowering_work/layout: shared admission draft
  reserves extra lanes before dispatch and retains grants through publication.
  Layout preserves continuous refill and deterministic failed-query selection;
  executable preparation uses the shared dispatcher. Whole object currently
  exceeds public128MiB payload allowance. Typed ledger boundary proposed to A2/B2;
  no concurrency/throughput acceptance is claimed from source inspection.
- New owned tests/semantic_lifecycle_checks.tower: source fixtures and assertions
  use existing frontend/world/compiler paths, ordinary interpreter and canonical
  Foundation reconstruction. Typed program/format/invocation ownership is explicit;
  batches outlive borrowed programs, formatting and interpretation.32/64-bit,
  serial/worker byte equality, one diagnostic trace and nested initializer effect
  counts are asserted. Public-pin unit compile passes; linked runtime pending.

The44 compiler-path audit coverage remains source review, not completion. New
owned test receipts are listed separately from D1's general test-file audit.

### Current frontier and lifetime review supplement

- semantic_values/declarations/statements: nominal static identities now use the
  existing type-query receipt; ordinary type-valued callables remain execution
  dependencies. Module call/discard operands use the same expression query and
  lexical owner as body operands. Core unit compile passes; runtime, source-order
  errors and serial/parallel canonical equivalence remain pending, so this is an
  implementation draft rather than closed acceptance.
- semantic_body_work/semantic_lowering_work/semantic_evaluation_work/
  semantic_execution_work: audited stage references through sem_control_node and
  sem_defer_clone. These emit Foundation payloads and borrowed canonical links;
  their source trees/programs remain strongly owned. They do not queue SyntaxOrigin
  references. syntax_origin_copy_staged is the sole production queue caller;
  generic clone executor already holds its references before view closure. No
  demonstrated UAF in these four paths and no unsupported lifetime guarantee.
- units/semantics_checks and tests/semantic_world: same all-fixture linkage, now
  in the existing separate query object. Declaration-only world test boundary
  compiles3.51s/223476KiB; nm shows five fixture exports, no compiler duplicates.
- Compiler input closure limitation: core lifecycle passes; whole services unit
  still fails the public128MiB component budget even after mechanical shared
  budget declarations and the smaller A2 dispatcher projection. Proposed separate
  outer frontend service boundary is owner-routed; no raised bootstrap limit.

2026-11-22 continuation: semantic_declarations/declaration_types retain distinct
nominal VALUE identity provenance. First explicit-layout suppression compiled but
did not fix recursive alias: automatic newly-created-type transfer still adds the
same edge. construction_identity propagation is a coordinated draft, not acceptance.
semantic_body_work review found a potential unfinished global type-alias VALUE
admission path; exact consolidated L2 prelude handoff is pending. Lifecycle fixture
now has a ninth recursive nominal case; previous eight cases completed before the
existing type-smoke regression. Complete API closure and query-smoke pass; failed
type-smoke and remaining layout fanout/profiling/instrumentation are explicit in
the journal. Relevant exact log/input hashes appear there; no storage packing or
parallel speedup claim follows from successful compilation or queue width.

### Current receipt update after required-stage integration

These source-specific receipts supersede the unresolved draft descriptions above;
they do not close lane acceptance. Reviewed baseline main60741c51 with the routed
owner drafts identified in the journal and A1 status; no A1 commit yet.

| Assigned path(s) | Updated conclusion and evidence | Remaining disposition |
| --- | --- | --- |
| semantic_declarations.tower, semantic_declaration_types.tower | VALUE nominal identity carries construction_identity; both explicit and automatic layout edges respect this role. Coordinated constructor owner propagation is exact. Recursive pointer alias16 and identity-first/default/sizeof0,true,16 pass; illegal by-value layout rejects. | Full integrated target/thread/revision acceptance remains open. |
| semantic_body_work.tower | Bare global type aliases require their declaration producer; TYPE aggregate storage requires layout before worker admission. Existing lexical continuation handles unmet producers. Consolidated u8 capture1 and body_continuation0 pass against controlled earlier failures. | New construct admission must preserve lexical shadowing and executed dependencies. |
| semantic_expressions.tower | Checked named initializer reuse now validates expected type without appending fields again. Independent L2 inferred initializer/effect cases pass; concrete mismatch rejects. | Runtime/scaling/sanitizer milestone remains open. |
| semantic_evaluation.tower | Required stages use existing capture/executable services and omit the false whole-owning-body edge; inferred candidates retain Body/KnownProof/KnownClone. Local staged type7 and full L2 construction fixture0 pass. | Final failed-dependency selection and late captures still under correction; no blanket stage completion claim. |
| semantic_known_bindings.tower, semantic_capture_work.tower | One IMValueInput now has separate required and optional producer receipts under the coordinated L1 ABI. Fresh components alone are reset. Required source ordinal/owner survive optional publication. Reproduced9,9 miscompile now returns independent0,9 oracle. | Late capture after lowering currently loses initializer operations; precise rejection oracle remains failing. |
| semantic_execution_work.tower | Late snapshots observe completed lowering/preparation receipts, clone metadata with remapped result parameter and do not lower twice. Valid staged-array7 passes; control-smoke31.70wall/32.74user/1.36sys/254136KiB passes serial/worker/reparse/cleanup/ordered errors. | More aggregate and early/late snapshot coverage, ownership instrumentation and profiling remain. |
| semantic_layout.tower | Existing manual pump publishes completed payload ranges before releasing dependencies and drains failures deterministically. Initial-only extra-lane reservation can leave a chain-released fanout serial. | Representative chain/fanout measurement and bounded safe grant refresh are still required. |
| semantic_query_pipeline.tower, semantic_support.tower | Shared pump services existing producer kinds and preserves quiescence ownership; complete error receipts restore bytes/offset rather than reformatting. | Final evaluation wrapper still needs failed-edge traversal before cycle classification. |
| semantic_context.tower and admitted phase callers | Public-pin complete native closure now passes after typed ledger, frontend API and linked-unit boundaries. Shared reservations outlive joins through publication; prior128MiB closure failure is resolved for this snapshot. | This is not measured compiler scaling, packed payload storage or race proof. |

Own semantic_lifecycle_checks.tower now has24 independent literal/error cases;
new required capture cases include known failing diagnostic coverage. The first13
passed earlier type matrix; all24 are not claimed passed. Its batch owns program,
formatting and interpreter borrows until disposal; each width compares1/4worker
canonical bytes and serial reconstruction. New staged-array case covers late
snapshot lowering. Full before/after profiles, actual useful overlap, alias/module
invalidation, cancellation, sanitizers and merged public release gates remain open.

### Source-specific receipt after the 27-case lifecycle matrix

The27-case matrix now passes on compiler18ab1adc (native_reachability1), with
source-root fix and corrected owner recursion oracle;157.97wall/168.01CPU seconds,
256044KiB. This supersedes the older unrun24-case note only for that frozen input.
New30-case fixture adds complex and aggregate captures and is not yet passed.

| Assigned path | Additional audit finding / disposition |
| --- | --- |
| semantic_source_bindings.tower | Late root proof formerly missed writes dropped by lowering: confirmed alias miscompile7. Frozen original root references now preserve effect syntax and program lifetime; alias-write rejection and positive14 pass. New extension/invalidation tests pending runtime after fixture registry repair. |
| semantic_source_binding_types.tower | Existing pipeline adds owned source_roots vector plus snapshot flag; sparse per-program/per-extension component remains appropriate for stable query lifetime. Dispose releases derived index; it is not packed AST storage. |
| semantic_capture_work.tower | Partial optional snapshot reuse is superseded by exact lowered initializer ranges, cloned only on demand with independent strict proof/invocation. Complex early-read diagnostic fixed in narrow runtime probe. Aggregate storage capability remains L1-routed failure. Payload120 bytes per initialized source declaration, retention/profile gate open. |
| semantic_expression_lowering.tower | Records full scalar/self-reference/aggregate initializer ranges under reserved function ownership, including all generated temporaries. Early and late inputs keep distinct handling. Finalization revision/compaction contract pending owner review. |
| semantic_lowering_work.tower | Coordinator attaches source declaration metadata before exclusive leases and worker views; existing lowering ticket records revision/profile/dispatch. Coherent native compile passes; instrumented ownership/scaling validation remains. |
| semantic_evaluation.tower | Failed-edge traversal now precedes cycle diagnosis. Supplied private canonical functions skip duplicate lowering; ordinary aggregate publication still requires interpreter-owned capture storage transport. |

Baseline reviewed commit remains60741c51 plus explicitly routed owner drafts.
No per-file completion or integrated publication closure follows from these narrow
receipts. Full range profiling, layout chain/fanout scaling, real concurrency and
sanitizer/clean public bootstrap/native/browser/generation/release gates stay open.

### Current per-file closure update: range leases and layout measurement

Reviewed main60741c51 with routed draft sources; native314108b4 proves editor/lease snapshot and9b6b0425 includes measured layout granularity. Full acceptance remains open.

| Assigned path | Storage/world/scheduling/ownership conclusion and evidence | Disposition |
| --- | --- | --- |
| semantic_capture_work.tower | Lowering preattaches120-byte stable payloads and now explicitly leases each initialized declaration; nonrecursive parent leases were insufficient. Exact Lowering revision/profile/dispatch gates range reads. Closed admission is program-root membership attached after required quiescence, not query existence. Baseline0 to33/2049 instances costs6056/377000 measured payload+headers+index bytes before final sentinel; root adds168 if capacity unchanged. Query extension/invalidation tests pass. | General scalar/complex range behavior passes focused probes; aggregate storage awaits L1. Final lifetime instrumentation and resource samples remain. |
| semantic_lowering_work.tower | Opens stage before metadata reservation, leases descendants plus subject/parameters before view/dispatch. Joined stages publish before receipts and ledger release. No shared context ABI addition. Native public-pin build and query/control smoke pass. | v3 supersedes unsafe v2 ownership draft; final actual concurrent sanitizer coverage pending. |
| semantic_expression_lowering.tower | Full initializer ranges preserve generated temporary ownership and source declaration identity; metadata writes now have explicit descendant leases. Source-order and precise early-read scalar probes pass. | Aggregate input-address transport remains an interpreter-owner gap, not accepted restriction. |
| semantic_body_work.tower | Required dependency body outside completion hole now disables only its worker-private editor copy, genuinely checks producer, and publishes normal type/read observations. Hole body keeps lexical scope observation; resetting borrowed editor data owns no allocation. Before native SIGABRT, after editor1/2/4/8 canonical observations/teardown and control continuation smoke pass. | Browser completion and final instrumented joins remain integrated gates. |
| semantic_layout.tower | Initial single dependency previously fixed extra grant at0 forever. Refresh is now after all current jobs join and publish. Only >=8192-field work is admitted after measured smaller-span regressions; smaller/mixed jobs stay caller-side. Existing world ledger/WorkGraph/work pool remain sole scheduler. Failure selection drains then uses discovery ordinal. | First corrected checks pass with real4-way overlap, bounded eligible prefix and occupied-lane control. Repeated profile receipts below; no global CPU speedup claim. |
| semantic_layout_kernel.tower | Unchanged read-only typed inputs/private offsets and diagnostic outputs. Coordinator commits offsets before dependent readiness. Per-job scalar work does not imply packed FoundationNode storage or invented noalias. | Kernel reference sizes/offsets validated in new profile; final sanitizer milestone pending. |
| semantic_query_api.tower | Exactly two additional exports expose existing layout discover/execute implementation for owned measurement; signatures preserve SemanticContext and one link owner. Narrow API handoff reviewed by coordinator/D1. | No second layout implementation; D1 opt-in target pending integration. |
| semantic_known_bindings.tower | Terminal known publication explicitly closes new capture admission only after required producer drain. Existing dual required/optional inputs preserve distinct order/ownership. | Full known positives run; two obsolete generic error wrappers now reveal underlying precise capture diagnostics. D1 exact oracle review requested, not silently changed. |
| semantic_source_bindings.tower / semantic_source_binding_types.tower | Original syntax roots remain program-owned through lowering; retained derived vector does not clone AST. Generic extension uses fresh proof jobs and cannot silently invalidate consumed proof. Root deletion/extension/invalidation query fixture now passes32/64 and1/4 workers. | Final integrated instrumentation and module matrix still required. |
| scaffolding/tests/semantic_layout_profile.tower (new, full file) | Actual world-owned chain/fanout graph, private per-type callback intervals/thread IDs, exact sizes/offsets/11calls and ledger/world teardown. Derived observation component is fixture-only; no forced barrier or production instrumentation. Two warmups/three reports per eleven worker/field/occupied configurations. | Measurement code only, not default semantic workload or proof that all programs scale. |
| scaffolding/tests/semantic_lifecycle_checks.tower / semantic_capture_module.tower (full current files) | Thirty independent literal/error cases compare canonical bytes and reconstructed execution across32/64 and1/4 workers. Module alias mutation/escape and source ordering preserve original identity. Separate owned module resource contains Captured7/read. | First27 passed recorded matrix; full30 is deliberately still failing aggregate storage. No full30 pass claimed. |
| scaffolding/tests/semantic_source_proof_checks.tower (full current file) | Producer-owned vectors, blocked frontier, repeated waits, stale/failure/cancel cleanup, retained original root syntax and late specialization invalidation. Real generic registry is now initialized in fixture; previous null-registry crash retained in logs. | query-smoke passes; serial fault instrumentation is not threaded sanitizer evidence. |

The full assignment also includes the existing semantic-named test sources, beyond the production table. Both were reread against main60741c51 plus routed declaration boundary.

| Path | Complete file audit and ownership evidence | Disposition |
| --- | --- | --- |
| scaffolding/tests/semantic_world.tower | Two unrelated worlds own Foundation/parser kinds and four private interpreter invocations; one actual pool dispatches them without switching ambient worlds. Views survive all normal joins, invocation disposal precedes closing views/worlds. Stage tests assert private rows, stable payload addresses, conflicting lease rejection, joined publication and discard finalization. Declaration-only imports bind the existing production implementation. | Normal query matrix passes. Early setup/submission failure returns can bypass cleanup of already-created worlds/invocations/pool; D1 review requested rather than silently treating the happy path as complete failure-lifetime coverage. |
| scaffolding/tests/semantics.tower | Explicit Tower import, source-ordered global write/read/initialization, width-dependent record layout, nominal generic recursive pointer identity, lexical loop/return and signed-minimum fixture. It owns ordinary runtime storage only; compiler worlds/jobs remain harness-owned. Independent output/canonical checks belong to existing driver/body matrices. | Used by the existing nine-pair semantics measurement and normal suites; this fixture alone does not prove concurrency or cancellation. No implementation change or separate timing claim from this audit. |

The first v3 transport was withdrawn: an accidentally copied semantic_evaluation.tower appeared as an added fifth path. The corrected four-path artifact f5d3f2bd was forward-applied to its exact baseline and compared byte-for-byte with current source; coordinator accepted it for integration/validation only. No production source was overwritten by the malformed artifact. Forward closure verification is now part of the handoff receipt, beyond reverse applicability.

### Current A1 follow-up audit before coherent7ac integration

Reviewed source: main60741c51 plus routed drafts, native6ee2f1b5 (public bootstrap9653f818); snapshot commit follows this entry. This is implementation/evidence, not final acceptance.

| Assigned path | Current ownership/storage/query conclusion | Evidence and remaining gate |
| --- | --- | --- |
| scaffolding/compiler/semantic_capture_work.tower | Required-capture classification observes exact original parent component and evaluation identity. Publication remains coordinator-owned; descendant lowering leases are explicit. No spelling or coincident frame offset substitutes for provenance. |12 new policy cases pass across4/8-byte targets and1/4 workers. Aggregate transport remains open with L1. |
| scaffolding/compiler/semantic_evaluation_work.tower | Coordinator freezes required-capture relocation policy in existing private work component before dispatch. Preparation worker receives the bool and never reads parent capture payload. |Public unit/native build and focused matrix pass; updated ASan/TSan still required. |
| scaffolding/compiler/semantic_evaluation.tower | Existing ordinary interpreter enforces executed address/effect policy using supplied role. Required stages remain distinct from inferred evaluations. |Address/comparison false acceptance corrected; direct explicit address and untaken controls pass. Aggregate consumer and diagnostic source provenance remain review items. |
| scaffolding/tests/semantic_lifecycle_checks.tower |42 owned cases retain all earlier30; added12 independent expected-value/error controls. Canonical serial/parallel output and reparse compared. |Only focused new12 passed on current source; full42, including existing aggregate positives, is not passed. |
| scaffolding/tests/semantic_world.tower | Supersedes earlier cleanup gap: private trial owner drains pool before releasing invocations/views/worlds; unpublished stages discarded on every return. Ordinary capacity denial and early cancellation exercise partial ownership. |Three before/after query runs and actual ASan+leak query after cleanup pass. Latest production policy is newer than this sanitizer receipt. |
| scaffolding/compiler/semantic_evaluation_types.tower | Existing leaf vector remains evaluation-owned; upcoming authorized shared projection type must retain exact canonical scalar/type/function values and lifetime through consumer joins. |Joint ABI is proposed, not yet implemented or tested at this checkpoint. |
| scaffolding/compiler/semantic_evaluation_aggregates.tower | Aggregate producer uses private retained result frame, emits only canonical relocatable leaves with target offsets, then releases interpreter storage. No padding/address export. |Current producer output reaches a consumer storage rejection; exact two repros supplied L1. Final joint ABI and sanitizer checks required. |

The canonical ASan control, query and2/4-worker stage fixtures passed on their recorded pre-policy source. No universal race-freedom, packed payload, automatic world-budget charging or full lane acceptance claim follows. Current container is4CPU8GiB; all owned jobs drained before edits/integration. Per-file earlier audit history is retained, and newer files discovered during integration will be included.

### CURRENT remaining A1 acceptance scope after joined aggregate validation

Reviewed checkpoint b40f00bab5339ed0a15e2b570f6d05b950beb541 plus joint API2792/producer997aa4/consumer27a71, test correctionef0147 and A2 stage452. Current compiler a51d828d3bb694529a7116271b738b3dbd6958d540b48aadd13b1a260834464d. Path census:50/50 assigned semantic*.tower paths reviewed (44 compiler paths including two semantic units, six test/resource paths), excluding semantic_type*.tower and semantic_generic*.tower. No newly discovered in-scope path is unreviewed. Earlier full-file receipts and subsequent touched-region reviews together form the audit; this count is not an acceptance percentage. Constructor algorithms and shared type contracts remain coordinated with L2.

| Requirement and exact current surface | Current disposition | Next concrete work or required evidence |
| --- | --- | --- |
| World/component ownership and locality: semantic_body_work.sem_body_wave; semantic_declarations.sem_declarations_pump; semantic_support.sem_allocate and nine scratch cleanup sites | World-owned canonical entities and private work components are implemented. Sparse job/capture payloads keep stable identity; contiguous derived vectors are not packed Foundation payloads. Private observer attributes109443702 leases to three bodies,106916379 to initialize18 alone. Raw sem_allocate/free still violates the required compiler-buffer boundary. | Implement and measure a proven bounded root-block leaf lease span with complete-function fallback, preserving actual write ownership. Apply granted compiler_buffer_allocate/free conversion to every paired cleanup; measure header/cardinality/CPU/RSS. A2 owns packed storage/unchanged-membership optimization; its measured stage fix is integrated, not credited to A1. |
| Between/within-unit ready work: semantic_body_work.sem_body_wave/sem_bodies, semantic_layout.sem_layout_execute, semantic_query_pipeline.sem_query_pipeline_pump | Shared pools/graph/budget admission and source-order joined publication are implemented; B2 owns inter-unit transport. Layout chain-to-fanout fix demonstrates real four-way overlap on8192-field jobs and preserves small caller execution. Ordinary normalized body workload still runs slower at4 workers than1; profitable general body scaling is not established. | Measure serial plus useful multi-body work after lease cost removal, including idle/scheduling cost. Review sem_bodies initial sem_layout_all and bounded frontier publication costs with L2/A2 before changing dependency/layout contracts. Do not remove justified ordered publication or claim queue width proves overlap. |
| Decltype/comptime lifecycle: semantic_query_pipeline, semantic_capture_work.sem_capture_pump, semantic_source_bindings, semantic_evaluation, semantic_evaluation_aggregates | Executed producer demand, retained lexical continuations, source roots, aliases/invalidation, failure propagation, frozen capture relocation policy and joint aggregate projections are implemented. Production executable_functions/IMFunctionInput was already complete. Full42 type/lifecycle matrix passed217.24wall seconds on36314926; corrected joined query and aggregate bundle passed on a51d828d. | Complete existing known suite with D1's independently justified address/equal diagnostic updates, expanded owner aggregate registration and final repeated-wait/capture/module/cycle/stale cases. The terminal capture-admission sentinel is valid only after required producer quiescence; future live revision reopening is not implemented, and is not claimed by this bounded compilation lifecycle. |
| Failure/cancellation/lifetimes: semantic_evaluation_dispose; semantic_world trial owners; source-proof/query receipts | All consumer invocations dispose before producer projection arrays. Actual query cancellation, immutable store/copy/fill, frame reuse, source-proof invalidation and partial stage/pool cleanup pass on their exact recorded sources. Corrected observer fixture retains all original lifetime assertions. | Re-run affected supported sanitizer/stress gates after final ownership edits; verify deterministic earliest failure and source-order publication in merged closure. Do not infer universal race freedom from these cases. |
| Serial CPU/RSS and retention | Capture-range metadata120bytes plus component/index retention is measured (large377168bytes including terminal sentinel); layout small-work regression was rejected and measured cutoff retained. Joint aggregate build/runtime and full42 resource receipts exist. Required final policy/aggregate paired small/large performance comparisons are incomplete. | Freeze exact before/after packages, compare checked small and representative large Foundation/body/staging inputs at1/4 lanes with warmups/repeated wall/CPU/RSS and allocation/retention observations. Investigate regressions rather than attributing all differences to one patch. |
| Supported instrumentation and host limits | Earlier actual ASan query/control/stage checks passed before the newest capture policy/aggregate ABI. A2's changed stage has independent native/ASan/TSan evidence. Current A1 joint ABI has not yet passed its final ASan/TSan milestone. Linux LLVM pipeline does not implement source-language UBSan. Host budget remains own4CPU8GiB within granted<=12CPU24GiB, shared with A2; Windows/browser do not inherit Linux instrumentation evidence. | Run actual updated valid compiler workloads under supported ASan/leaks and TSan with the documented scoped container policy and concurrency stress, without deliberate invalid-memory/race probes. Record unsupported UBSan and browser/native host gaps explicitly. |
| Bootstrap/browser/publication | Current complete native closure builds through checked-in Linux bootstrap9653f818 without override; no new syntax adopted. This is development-bootstrap evidence, not a portable release. Browser/generation/final clean bootstrap and hosted acceptance have not passed for the final merged source. | Finish owned fixes, reconcile queued owner changes and current audits, commit/rebase preserving merge history, validate frozen public-bootstrap/native/browser/generation closure, then REQUEST_PUBLICATION. Wait for named A1 lease, preserve concurrent runtime/build identities and publish main+gh-pages in one normal atomic push. Verify workflow, exact served manifest/assets/behavior and release lease. No lease or publication is currently held. |

This list separates implemented evidence, unvalidated implementation, the missing buffer-boundary migration and unresolved measured iteration cost. Passing42 cases does not close the lane, justify a release or demote remaining required work to optional future work.

### Follow-up ownership review: leaf leases and scratch buffers

Reviewed b40f00ba plus provisional c2b952 leaf interval and current nine-site scratch boundary migration; all50 assigned paths remain audited, with no new semantic path. semantic_body_work retains first-dispatch whole-tree label coverage, excludes nested/deferred/header/for-tail state from narrowing, leases exact complete syntax subtrees through the stop plus owning function/root block, and preserves full fallback. sem_function_finish/scope_locals read existing bindings and write the leased root block; declaration storage and assignment location writes are confined to current leased syntax/function storage. A2's independent footprint review and current stress/ASan/TSan are still gates. Actual large leases109443702->403581 and wall3.16x/2.81x improvements are source-specific; small/jobs4 has a confirmed~1% cost, and useful body multicore scaling remains open.

semantic_support.sem_allocate is the only producer tracked by sem_track. Its allocation is now compiler_buffer_allocate; all paired frees in semantic_body_work(two), semantic_declarations, semantic_known_work, semantic_evaluation_work, semantic_execution_work, semantic_lifecycle, semantic_lowering_work and semantic_source_bindings use compiler_buffer_free. semantic_iteration_work, SemanticDeclaration and SemanticBodyWork still transfer raw payload ownership after joins to the compilation owner, whose final cleanup frees it exactly once. Their vector backing and nested list disposal retain their own allocator. Smallest public-pin unit passed; paired metadata/CPU/RSS and final sanitizers remain pending. This closes the raw allocation boundary in source only; retained-byte WorkBuffer accounting requires coordinated typed owner slots and is not claimed implemented.

Known-order review preserves ordinary runtime0,7,7 while rejecting demanded earlier capture. Newer ROOT/L1/L2 decision authorizes only D1 oracle alignment, not a production language restriction. Full42 passed on prior joint closure; updated edge/harness/lease/scratch closure is currently rebuilding. See the matching journal receipt for exact packages, failed experiments, timings and unresolved acceptance gates. No status in the preceding table should be read as final lane completion.

Raw initializer scope correction: the preceding0,7,7 statement is a graph-engine observation only. Foundation325-326/365-367 excludes uninitialized reads from portable differential guarantees. Fast/native7,7,7 is therefore not itself a defect. Preserve raw admission and strict early-capture rejection; portable order/effect validation uses fully initializedstate++ with1,1,7. No production zero-initialization policy is introduced.

### Current token and retained-memory follow-up (2026-11-23)

Reviewed b40f00ba plus the current432da781 source closure. Assigned census remains50/50; new work_buffer/work_vector/parser_table_budget/input-storage additions belong to routed A2/B1/L1 ownership and do not replace semantic audit rows.

| Assigned surface | Review conclusion and evidence | Remaining disposition |
| --- | --- | --- |
| semantic_support.tower | sem_token_text borrows only private token scratch until the next query. Three immediate probes consume it without intervening queries; sem_tokens keeps all existing owned-copy and identifier-mutation contracts. compiler_buffer_allocate/free boundary covers every tracked payload. | Large tiny requests453931->430450 with balanced final cleanup; qualified token timing and later instrumentation pending. Header-only migration measurably adds about9-10MiB RSS and is not retained-budget completion. |
| semantic_values.tower | Owned token text is now acquired only inside the literal branch that consumes it; nested float/type queries still see stable owned text. No effect/order/type or shared ABI change. | Smallest predecessor unit passes; current query passes. Existing narrow missing-import and floating structural-roundtrip failures reproduce before the change and remain open owner gates. |
| semantic_context_types.tower / semantic_declaration_types.tower / semantic_iteration_work.tower / semantic_body_work.tower | Existing allocation vectors describe four common-lifetime owners. Bodies/declarations/iterations transfer only after joins; pending WorkArena must splice identical budget ownership without relocation or double release, after nested list-vector disposal. No layout change has been made. | A2 validated artifact and explicit L2 shared-layout agreement plus failure/drain policy are prerequisites. Infallible sem_allocate cannot return null on budget denial. |
| semantic_lifecycle.tower and the nine scratch retirement sites | All paired compiler-buffer frees were rechecked. Current pre-token ASan/leaks query and real2/4-worker stage pass on09015046; current432da781 query adds L1 private-storage bounds and exact zero-cleanup checks. | Later code is not covered by the older sanitizer receipt; current type/control/capture, TSan and final merged closure remain required. |

Joined retained parser tables expose an integration gate in B2's input-only bounded-unit fixture: exact source capacity leaves no parser budget, so units exits1 at retained-source compilation. Input-only whole-ledger live9/11 checks also need coordinated owner accounting. This was predicted before integration and reproduced after; no production rollback or weaker total is substituted. Full current type/lifecycle matrix is active. The journal records exact hashes, timings, failed experiments and correction of the original raw-initializer portability claim. No lane/publication milestone is complete.

### Resource-failure regression audit addition

The newly assigned scaffolding/tests/semantic_resource_checks.tower raises the current semantic-file census to51 reviewed paths. It creates explicit worlds and bound budgets, source-ordered literal evaluation components and an already completed immutable-input proof, then uses production preparation/evaluation pumps. Its expected resource-failure receipts distinguish required, inferred and isolated selection; cleanup drains the owned pool before context/world disposal and checks zero ledger ownership. This is a full source review, not a passing test receipt: baseline execution and the resource-error hook remain pending. token_text.tower is additional A1-owned focused evidence outside the semantic filename census and passes before/after32/64-bit graph/CLI-fast/canonical/worker comparisons. Latest joined4b7 query/units/control/aggregate pass; latest full42 receipt remains earlier432da781. See the journal for exact token allocation savings and measured CPU cost, and for queued owner changes not covered by those receipts.

### Current joined resource checkpoint (2026-11-23)

All51 assigned semantic paths remain reviewed. The new resource fixture now passes all12 required/inferred/isolated,32/64-bit,1/4-worker trials on compiler1ac577a8, while the same source fails optional cases on frozen4b7. semantic_evaluation.tower preserves a typed failure beyond invocation disposal in both completion paths and isolated finalization. semantic_evaluation_work.tower reserves short diagnostic storage before dispatch; every peer joins before receipts are selected. semantic_evaluation_types.tower has the reviewed retained WorkBudgetError field, with no SemanticContext change. Query, units, control and aggregate checks pass on the complete new shared ABI. Direct interpreter growth denial is covered by L1 query cases; coordinator execution-growth and terminal materialization-specific denial still need focused evidence.

This checkpoint supersedes earlier pending-startup statements only. The current Publish WorkArena migration is approved but unimplemented; all four legacy scratch-owner slots and checked transitive failure propagation remain required. The buffer-header conversion and token-copy reduction are measured, not full budget adoption. A2 remains owner of constructors/packed payload policy. Current physical-allocator semantic ASan/TSan, profitable body scaling, remaining known/numeric/floating suite gates, clean merged bootstrap/generation/browser and named-lease atomic publication are still open. Full42 latest pass remains432da781, older than this resource ABI. No final lane or integrated acceptance is claimed.

### Publish scratch draft review and strengthened resource fixture

Current assigned census is52/52 reviewed paths after adding scaffolding/compiler/semantic_known_publish.tower; this is coverage, not completion. Reviewed against04d63191 plus the current owned draft.

| Path | Full-file/touched-contract review | Evidence and disposition |
| --- | --- | --- |
| scaffolding/compiler/semantic_known_publish.tower | New complete-file review: private arena-backed SemanticTable indexes retain world entity identity; WorkVector traversal contains borrowed nodes under the existing frozen view. Null edges are skipped without reordering. All fallible calls return before dereference; partial canonical vectors are disposed or transferred once. Worker scratch retires on return, all publication waits for coordinator joins. No canonical graph is replaced by these indexes. | Public predecessor leaf unit passes. Aggregate semantics input exceeds component capacity; runtime/denial/stress/instrumentation/performance remain unproved. |
| scaffolding/compiler/semantic_known_work.tower / semantic_known_types.tower / semantic_known_bindings.tower | Complete WorkArena owner and latched result belong only to the Publish work component. Coordinator freezes budget, reserves diagnostic capacity, joins all peers, finishes all tickets, then reports first source-ordered failure and suppresses every output publication. Unstarted owners and partial output vectors retire during common disposal. Other actions keep the existing allocation path. | Implemented draft; no merged runtime acceptance. General scratch arenas and canonical output memory charging remain required. |
| scaffolding/compiler/semantic_support.tower / semantic_context.tower / semantic_query_api.tower | New checked arena index shares sem_find/sem_insert identity; overflow and failed allocations preserve live indexes/output. Checked read-log helpers retain existing void callers' fatal policy and permit bounded Publish failure. Existing late Publish entry is exposed with prerequisite/drain contract; no general context layout change. | Leaf compile only. Shared-unit/API coordination requested for measured aggregate-size bottleneck; no component-limit inflation. |
| scaffolding/tests/semantic_resource_checks.tower | Full updated24case fixture uses a synchronized independent capacity holder, actual startup/nested-call denial, existing required helper readiness, typed error survival, ordered diagnosis, repeated-pump stability and exact teardown. | v2 passes on1ac. Previous one-byte requests were Invalid, not Capacity; failed fixture assumptions and earlier passing generic-resource evidence remain recorded separately. |

Supported current semantic instrumentation, final clean public-bootstrap/browser/generation, profitable body scaling, remaining generic/type cross-owner work and atomic named-lease publication remain open. ROOT's1fec source union is unbuilt and not yet adopted at this entry. No partial milestone is complete.

### Joined source boundary and Publish fixture

Current complete source review coverage is53/53 assigned paths, including new scaffolding/tests/semantic_publish_checks.tower. Its explicit worlds, synchronized independent budget holder, three ordinary Foundation jobs, source-ordered receipts, all-output suppression and joined cleanup are source-reviewed; public leaf compile passes but runtime is pending. The existing semantic_known_publish.tower draft now reuses stable private identity entries as an ordered traversal chain and removed-node set, avoiding duplicate pending/container indexes. No canonical payload or shared SemanticContext layout is changed; actual behavior/performance is unproved until coherent build.

Arena API-only linkage measurably advances the current aggregate bootstrap failure but does not eliminate its component cap. The current union itself is unbuilt; an independent root3915 baseline check is required before attributing all excess to this draft. False transport return cleanup remains an actual missing semantic capability; A2 owns precise typed failure result and A1 owns affected callsites. Valid-entry deferred draining must not be generalized to Busy/preexisting jobs. Existing admitted lane grants, revision/profile/dispatch rejection and joined stage publication already work and must not be reimplemented. L2 constructor/type/generic ownership remains reserved. Final fullscope/instrumentation/bootstrap/browser/publication gates remain open.

### Publish declaration boundary and complete dispatch-site review

Reviewed f9c40fad plus the owned boundary draft. Census remains53 assigned
semantic paths; no new implementation file was introduced by this boundary.
Source review is complete for these changed paths, while runtime acceptance is
explicitly pending the coherent provider/link and instrumentation.

| Path | Current finding, ownership and disposition |
| --- | --- |
| scaffolding/compiler/semantic_known_publish.tower | Complete worker traverses first-seen stable arena entries; frozen proof/evaluation reads use typed linked declarations. No global context or second semantic graph. Private output vectors transfer only after all jobs succeed; failed peers suppress every canonical replacement. Public leaf compiles;18-case runtime fixture pending. |
| scaffolding/compiler/semantic_known_types.tower | Existing binding proof declaration moves here unchanged; one nominal definition, same fields/order, no extra registry or context layout. Work component retains complete arena owner and fixed error receipt. Dependent source rebuild required. |
| scaffolding/compiler/semantic_known_bindings.tower | Existing typed binding lookup exported; late phase still gates all value/storage publication on complete success. Function source order defines publication, independent of archetype row or completion order. |
| scaffolding/compiler/semantic_query_api.tower | Five existing helper declarations and one private kernel declaration preserve one implementation each. Read-only worker borrows and scratch ownership documented; provider placement requires D2/B2/A2 coordination. |
| scaffolding/compiler/semantic_support.tower | Exported common lookup/checked arena insertion preserve identity and stable entry addresses. Capacity growth remains arena-retained until worker disposal; canonical output backing is still outside that ledger. |
| scaffolding/compiler/semantic_context.tower | Checked query input exported with unchanged algorithm. Shared admission still traps on nonNone; needs typed caller propagation. Existing receipt outlives join AND structural publication. |
| scaffolding/compiler/semantic_evaluation.tower | Lookup exported with unchanged component ownership. Interpreter dispatch failure must mark all claimed tickets failed, retain resource receipt, drain invocations before producer projection disposal and avoid literal/alias publication. Existing helper readiness remains implemented, not reintroduced. |
| scaffolding/compiler/semantic_body_work.tower | Both discovery and continuation transports still trap. Joined continuation failure must preserve structural node ownership and retire/adopt all transferred scratch/evaluations without replaying lexical effects. Whole-function fallback remains required whenever bounded lease proof fails. |
| scaffolding/compiler/semantic_evaluation_work.tower | Failed preparation can have canonical links to generated nodes: structural stages must publish after all joins for normal graph cleanup. Do not equate failure with permission to discard referenced nodes. Readiness/error tickets require explicit transport failure handling. |
| scaffolding/compiler/semantic_declarations.tower | Shared dispatch serves discovery and checking; typed failure must be returned to both owners. Preserve constructor reservation with L2; no constructor semantics edited. |
| scaffolding/compiler/semantic_execution_work.tower | Producer already publishes IMFunctionInput after joined preparation. On transport failure, preserve owned stage nodes but suppress ready/function success, retire error/query/alias arrays; no second helper-readiness service. |
| scaffolding/compiler/semantic_iteration_work.tower | Resolution worker owns retained scratch/type/order arrays; normal publication transfers owners before signature construction. Failed transport must retire owners and skip signature construction, preserving suspended preparation failure. |
| scaffolding/compiler/semantic_lowering_work.tower | All stages currently publish before cross-job aliases and ticket completion. That structural lifetime requirement also applies after partial transport failure; semantic success must not be inferred from untouched empty error vectors. |
| scaffolding/compiler/semantic_flow.tower | Source-ordered result vector and private flow state; transport failure must not turn default flow/error fields into successful checks. No staged node owner to publish. |
| scaffolding/compiler/semantic_known_work.tower | Private Publish kernel now typed external boundary; aggregate public unit passes. All known actions share the currently trapping transport; failed valid batches may have run any/all jobs and may never be replayed. |
| scaffolding/tests/semantic_publish_checks.tower | Full fixture review: fixed-array type determines count, real capped world, first/middle source failure, parallel all-denied peers, all-output suppression, repeated dispatch identity and zero ledger after cleanup. Compiles; runtime still pending. |

L2-owned semantic_generic_body_work is excluded from the assigned file audit;
its single transport site was discovered by the cross-caller search and routed
for owner adaptation. Eleven sites total across ten files is a callsite count,
not a completed cleanup claim. No runtime profiling applies to the audit text
itself; changed implementation profiling and current ABI checks remain required.

Separate retained layout stream: semantic_layout.tower has one direct
work_pool_submit and blocking/nonblocking receive loop in addition to the
eleven finite batch sites. Failed submit currently traps while earlier jobs may
remain active. Its replacement must drain those owned peers and retire the
claimed ticket, preserving the disjoint completed-layout publication contract
and deterministic query-order errors. A2 was asked for precise submit failure
semantics; L2 review remains required before changing layout behavior.

Focused Publish runtime supersedes pending-runtime wording above: all18 cases pass with current refreshed LR objects plus the one typed kernel object. Production provider placement, canonical linked targets, current ASan/TSan and end-to-end profiles remain open.

Cancellation follow-up: semantic_known_bindings.sem_known_publish now checks
work_ok before capture finalization or query/component creation. Valid joined
cancellation previously aborted; four width/worker cases now preserve graph,
storage, zero dispatched work and zero live scratch receipts across repeated
entry. semantic_publish_checks owns these cases through its separate
cancellation export; existing18 pressure tests also pass on final source.
This is joined-frontier cancellation coverage, not mid-kernel stop latency.

### Shared constructor join and checked known-work draft

Reviewed e54c1df9 plus the current owned draft. Full census54/54 assigned paths
includes the new focused source below; a full per-file review is not acceptance.
Current constructor ABI fails the public semantic aggregate, with exact failed
receipts in the journal. Earlier22 Publish passes cover the preconstructor ABI.

| Assigned path | Complete current review, evidence and disposition |
| --- | --- |
| scaffolding/tests/semantic_dispatch_checks.tower | All source reviewed: explicit world/budget/context and real four-worker pool; coordinator-only one-shot host semaphore denial; normal and Memory controls, source-order error, private canonical output, repeated entry and final ownership cleanup. Type-derived array count. Public object compiles after correcting command entry mode; linked runtime/instrumentation pending. |
| scaffolding/compiler/semantic_context.tower | Checked admission returns the owner's typed reserve result; old wrapper remains for unconverted callers. Checked observation can fail after graph mutation; joined-only cancellation captures the fixed graph resource error and invalidates outstanding receipts. No context layout or worker-shared error mutation. Source implemented, runtime pending. |
| scaffolding/compiler/semantic_known_work.tower | All borrows cleared after guaranteed drain before graph settlement. Transport or terminal graph failure suppresses all output; only a joined coordinator cancels the graph, preserving the first fixed error. Result vectors and arenas still owned by job disposal. New resource checks before dispatch remain infallible initialization boundaries; not a claim that every allocation path is recovered. Source cap blocks current leaf validation. |
| scaffolding/compiler/semantic_known_bindings.tower | Scan/Order/Inputs stop and dispose private job storage on a checked wave error. Publish retains atomic all-jobs output gate and cancelled-frontier guard. Proof/snapshot construction still has older sem_require graph allocation boundaries; these are explicit remaining work. |
| scaffolding/tests/semantic_resource_checks.tower | Merge retains D1 runner signature plus both startup and nested executed-growth modes and all Capacity/cleanup/repeated-wait assertions. New shared constructor ABI requires rerun; older24-case receipt is not reused as current. |

A2's graph arrays are borrowed directly only for reads in the assigned semantic
callers. L2 generic/type/constructor reservation remains in force. D2 owns the
five entrypoint imports after L1 agreement; no competing provider is added here.

Follow-up full review of semantic_dispatch_checks: six trials now include actual
terminal scratch-denial setup through the existing WorkGraph API, with all
relationships sealed before dispatch and only a synchronized ledger hold in the
coordinator claim wrapper. Graph cancellation is expected after partial terminal
mutation; the first dispatch failure remains the diagnostic. Public object
passes; runtime still pending. The failure occurs before worker admission, so
this fixture is not evidence for partial-submission overlap or threaded allocator
sanitization. Separate earlier22 Publish tests retain their exact ABI scope.

Remaining scheduling barriers: sem_workers_open can eagerly create configured
thread capacity before a one-job inline wave; semantic_layout_execute owns its
typed receive stream and cannot consume body jobs safely. A2 received concrete
lazy-opening and mixed-frontier contract findings, with no claimed speedup,
unmeasured cutoff or competing scheduler implementation.

Primary-source refresh for the storage/dispatch audit (2026-11-23): Flecs
[systems and staging](https://www.flecs.dev/flecs/Systems.html) distinguishes
deferred structural commands from direct component writes, and derives required
merge points from declared access. Applied here as a design principle: pins
retain lifetime, while semantic leases and query accesses protect actual writes;
joins alone do not publish structural ownership. Current whole-wave barriers
remain justified until mixed phase access/publication is explicitly supported.

Flecs [component traits](https://www.flecs.dev/flecs/ComponentTraits.html) separates
sparse stable-address storage from table fragmentation policy. Applied to Tower:
stable SemanticEntry/work payloads and dense pointer/query indexes satisfy
different requirements; neither a dense handle array nor the new WorkGraph
borrowed view proves packed Foundation payloads or reduced fragmentation.

Unity's [Burst aliasing documentation](https://docs.unity3d.com/Packages/com.unity.burst@1.8/manual/aliasing.html)
shows why overlap assumptions can change loop results. The semantic context copy
intentionally aliases frozen graph/component storage; distinct view types do not
imply disjoint memory. No noalias annotation or vectorization guarantee follows
from these patches or passing stress tests. These are interpreted design
principles, not adoption of another implementation language or borrowed
performance claims. This documentation review changes no runtime and needs no
new performance sample.

### Joined failure ownership follow-up at 25b4aacf (2026-11-23)

The production provider and focused-test registrations from ROOT0c8b7d66 are
now merged. This source checkpoint does not validate the newer constructor ABI.

| Re-reviewed path under scaffolding/compiler | Failure ownership and next required change |
| --- | --- |
| semantic_execution_work.tower | Every frozen context and staged executable snapshot survives until dispatch joins. Publish stage ownership for disposal, but withhold IMFunctionInput.ready and aliases on transport/graph failure. Existing helper readiness is complete; the missing work is checked failure retirement. |
| semantic_evaluation_work.tower | Clone/preparation stages may already be referenced by canonical payloads. Join, publish all stage ownership, then suppress aliases and successful preparation receipts on failure. Existing 128-byte interpreter diagnostics cover preparation storage failure, not all transport/graph failures. |
| semantic_lowering_work.tower | Signature and ordinary lowering share private stages and may change leased canonical payloads. Discarding a stage could leave dangling links. Keep all-stage ownership publication before graph settlement; suppress downstream readiness and retain the first diagnostic after a terminal graph allocation fails. |
| semantic_body_work.tower | Publication also transfers allocation/list owners, evaluations, capture state and lexical prefixes. Failure cleanup must retire those owners without replaying a continuation or creating new queries after graph cancellation. Existing result disposal is the ownership reference, not a replacement scheduler. |
| semantic_iteration_work.tower | All TypeIndex reads must retire before signature interning or preparation write claims. A failed batch must clear every borrowed context and dispose result vectors without calling the normal signature/publication path. |
| semantic_flow.tower | Workers only calculate private flow facts; no staged ownership transfer is needed. Source-ordinal diagnostic order and terminal receipt cleanup can use the same checked transport contract. The current loop still assumes all requested jobs are immediately ready. |
| semantic_known_work.tower | The checked dispatch draft handles joined transport/observation/finish failure, but graph request/access/seal/demand and take-time growth remain asserted. An empty batch after resource failure must not be reported as ordinary Waiting. Proof/snapshot callers also remain fallible-work gaps. |
| semantic_query_pipeline.tower | Phase pumps own their frontiers; cycle selection belongs to the caller after all producers quiesce. Isolated layout diagnostics are deliberately deferred, but future infrastructure errors must not be cleared as ordinary producer diagnostics. |

These are source-reviewed obligations, not newly passing runtime cases or a
claim that every allocation is world-budgeted. No runtime code changed in this
review, so a new performance sample is inapplicable. A2's public predecessor
LLVM shows aggregate reset already uses memset; the earlier proposed default
expansion attribution is withdrawn without a cosmetic source rewrite.

### A1 numeric source-boundary experiment, not acceptance (2026-11-23)

At25b4aacf plus the checked-dispatch draft, public9653 still exceeds its semantic
component allowance after the constructor merge. A2's separately linked graph/
pool candidate also fails its aggregate, so ROOT approved an A1-owned literal
leaf experiment before any broader compiler split. No numeric library changed.

New scaffolding/compiler/semantic_literals.tower is the55th assigned semantic
path, fully reviewed here: it contains the unchanged borrowed-token classifier
and the existing float_parse/status diagnostic block. It calls the same ordinary
float_text implementation, uses the caller's private context, retains no pointer,
and creates no numeric policy, constant folder, registry or scheduler. Its four
declarations call the existing semantic owners. sem_literal, sem_token_text and
sem_fail gain exports; semantic_support/semantic_values call two typed leaf
functions instead of importing the full numeric implementation. KBits sign
classification compares the same ASCII byte through an ordinary local "-" string.

The isolated public object passes2.48wall/1.88user/.15sys/233300KiB
(semantic_literals_leaf1, Linux x64 jobs1, LLVM19, own4CPU8GiB). First aggregate
attempt failed on the remaining FloatDecimalMinus use. A quoted '-' is a string,
not a scalar byte; direct indexing of the literal is also unsupported. Both
failed attempts are retained, not new syntax or bootstrap adoption. The corrected
local-string form compiles past those errors but still hits the component cap
at semantic_types217 (semantic_literals_aggregate4); all jobs exited/reaped.
This result is before A2's new API/borrowed-view package. No linked/runtime,
performance-equivalence, provider, WASI or generation acceptance is claimed.
D2 provider routing is conditional on a successful aggregate. Required later
evidence includes float literals, exact bits/signed zero, malformed diagnostics,
canonical roundtrips and matched small/large before/after profiling.

The dispatch fixture now has a separate admission selector for two pointer
widths with the graph's available ledger held before query creation. It expects
failure before dispatch, a retained Capacity receipt, no value publication and
no replay. Its public object passes3.09wall/2.33user/.16sys/221092KiB
(semantic_dispatch_unit4). The original six default trials are unchanged.
Neither selector has current-ABI linked runtime evidence yet.

Numeric-leaf follow-up: exact A2 review package dbe38d was adopted after drain;
nine shared-owner conflicts retained the owner's latest API/types/storage and
terminal-denial fixture. A1's literal extern/import change was preserved. The
newly merged Publish fixture also needed API-only graph/pool imports to avoid
duplicate providers; A2 independently included that correction in v2.

Removing float_text alone still fails at semantic_types359,
13.55wall/7.96user/1.02sys/734636KiB (semantic_literals_api1).
The remaining full float_bits import in semantic_expression_lowering constructs
floating one for increment/decrement. Moving that exact expression into the
same leaf also fails the aggregate at semantic_attributes69
(semantic_literals_api2). Both failures are preserved; no numeric boundary is
accepted or routed into production providers. The draft is checkpointed before
restoring its original callers for the next independent experiment.

A2 v2 package3833050c corrects the serial provider's unconditional default-kernel
reference with four API-local selection wrappers and12 implementation exports.
Reviewed conflicts preserve the exact owner version; no deliberate memory/race
probe is run. A1 has no complete current-ABI runtime receipt.

The more direct candidate is repeated fieldwise SemanticContext copy expansion:
the actual aggregate lowering recursively emits each field, including every
new WorkBuffer owner descriptor. ROOT02:51:26 authorized one exported typed
helper whose body remains ordinary *destination = *source. This preserves
source evaluation/snapshot timing, padding and shallow borrowed ownership;
raw byte copying and general copy-policy changes are excluded. Compare this
helper alone with the same API/constructor inputs before retaining numeric
module splits. Runtime outputs and matched profiles remain required.

### Typed context snapshot restores public aggregate closure (2026-11-23)

ROOT and A2 approved the ordinary typed helper, excluding raw copies. The exact
11-file delta is A1_semantic_context_snapshot.patch SHA256
04589f9cdb863f998e2e6ec81a7f2f20c4414d4e188c779e2c185d858662732d.
One sem_context_snapshot definition retains *destination = *source;16 A1 worker
and coordinator sites use fresh locals and call it at their original snapshot
point. Graph/pool descriptors remain shallow borrows. Every private scratch
replacement, stage pin/lease, join and disposal remains at its existing site.
The thin Publish client uses the existing query API declaration; the existing
semantic unit owns the export. No new provider, layout or semantic copy rule.

On frozen A2 API v2/constructor inputs and the A1 checked-known draft, with ALL
original numeric callers restored, public9653 before fails at semantic_values523:
13.67wall/7.92user/1.10sys/739744KiB (semantic_context_before1).
After only the typed snapshot delta, semantics_checks PASSES
19.90wall/14.25user/1.06sys/706836KiB (semantic_context_after1).
A failed compile and a completed compile cannot establish a speedup ratio.
The thin Publish leaf also passes3.10wall/2.32user/.16sys/193860KiB.
Linux x64, LLVM19, jobs1,4CPU8GiB, single build receipts; no runtime speed claim.
All child processes are reaped before further source edits.

The numeric-boundary candidate is retired: original semantic_support/values/
expression_lowering code is restored, and semantic_literals.tower is removed
from production sources. Its full55th-path audit remains historical above;
the actual experiment is retained in Git and the owned cache's
semantic_literals_experiment.tower. Current assigned-file census returns to54.
No literal-provider import or numeric library change is needed.

Per-file review of the snapshot delta: semantic_context owns the sole ordinary
copy; semantic_query_api only declares it. semantic_body_work (three sites),
semantic_declarations (one), semantic_evaluation_work (two),
semantic_execution_work (two), semantic_iteration_work (two),
semantic_known_work (two), semantic_lowering_work (two),
semantic_source_bindings (one), and semantic_known_publish (one) preserve their
original source expression, capture timing and private destination. The source
expressions contain no effects and are evaluated once. No type/generic owner
site is changed. Current-ABI runtime, supported instrumentation, canonical
outputs and matched profiles remain open. A2 is asked to test the smaller
nominal graph variant without the provisional graph/pool API split.

### Minimal selected scheduler closure (2026-11-23)

A2's reviewed selected package8e4e2d085a55de95e73fb041929aa75d3de3a22b3ba5b5e98abc55c4cebbbc2c
retains nominal borrowed graph views, nongeneric WorkBuffer owners, checked
constructor/dispatch receipts and typed length overflow. It removes the
experimental graph/pool API/type split and restores the original providers.
A2 independently compiled the actual parser and semantic aggregates with the
unchanged public bootstrap and this lane's ordinary snapshot helper. A1 adopts
that exact owner transition, generated between the two review-package trees
in a temporary Git index; application is clean. Library/kernel/manifest trees
match the selected package exactly. The only extra import reversal is A1's new
semantic_dispatch_checks fixture, which was absent from A2's original base.
All sixteen snapshot sites and A1's pending checked-known draft remain intact.
No numeric provider or literal module remains. The API experiments and their
cost/failure receipts remain in history, not in selected production source.

The root-compatible snapshot-only patch5acefe43f2ac7926fbf2e5168990947fb25842baa6fcec5d14064b3fb17c2991
passes git apply --cached --check against exact ROOT0c8; its one-line context
avoids the newer checked-dispatch context in the first patch. Neither patch
is a runtime acceptance claim. Next, rebuild all affected current-ABI objects
before linking the focused dispatch/admission tests. Earlier cached objects
and preconstructor runtime results cannot establish this joined source.
### Joined admission failure and source-proof retry (2026-11-23)

The selected nominal graph/helper closure exposed two provider integration
errors before runtime. The host syntax adapter declared compiler_buffer_allocate
and free with u8* despite the defining void* ABI. ROOT03:06:33 authorized the
two declaration corrections and explicit casts at both uses. The first compile
correctly rejected the missing free cast; the final public smallest unit passes
2.37wall/1.69user/.16sys/193240KiB. This declaration-only correction preserves
the generated allocation behavior; no runtime speed claim is attached to it.
A separate LR runner link failed because the selected A2 work_named helper
imported host.memory while its aggregate already linked that provider. The
exact duplicate is confirmed by llvm-nm. A2 owns the one-import undo; no
multiple-definition workaround or test success is claimed for that failed link.
The current native compiler itself linked successfully.

On this coherent ABI, semantic_dispatch_checks' six original trials pass:
32/64-bit target widths with normal execution, failed batch claim, and a claim
failure followed by terminal graph scratch denial. Real four-worker transport,
fixed first source offset11, no canonical compaction on failure, invalidated
remaining tickets, repeated entry and zero final ledger are checked. The
admission selector reproduces an earlier boundary abort134/signal6 with the
available graph ledger held before request. Before: .14wall/.02sys/49088KiB,
semantic_dispatch_selected_admission_before1. After: both width cases pass,
.02wall/.01sys/50824KiB, semantic_dispatch_admission_after2. A failed run is
not a performance baseline for successful compilation.

semantic_known_work now reserves its fixed diagnostic before graph admission.
Request/dependency/access/seal/demand and pool-construction failure return
source-ordered jobs for disposal, retaining the typed error and cancelling only
at the joined coordinator. A failed take cannot become Waiting; already claimed
but undispatched peers are invalidated. Existing dispatch/terminal publication
errors use the same fixed diagnostic writer. Source-binding begin returns zero
after failed job admission, and its capture caller stops before reading that
absent proof. No shared type, context layout or work-graph algorithm changes.

A new source selector then reproduced a separate retry bug: after the first
typed denial, a repeated proof request created more entities/components even
though no query ran. Both widths failed the exact count oracle. The request
entry now checks semantic/graph failure before touching proof metadata. The
same frozen fixture object passes after that guard; .02wall/51040KiB. All ten
focused cases pass; public known_work leaf passes16.52wall/11.95user/.91sys/
671636KiB and the final provider/compiler refresh22.93/16.25/1.15/732828KiB.
All failed jobs are reaped and their logs retained in the owned A1 cache.
The pinned link driver rejects --wrap; only this host-denial fixture links with
installed clang++19 -no-pie and the same current production objects. There is
no replacement compiler or private bootstrap claim.

Per-file follow-up at parent9c1927a: semantic_known_work owns the bounded error
writer and graph-admission retirement; semantic_source_bindings preserves
pipeline-owned jobs for context cleanup and suppresses failed-entry replay;
semantic_capture_work stops after failed proof creation; semantic_dispatch_checks
adds the real-ledger source proof and exact entity/component retry counts. These
source reviews and ten runtime cases do not close remaining proof/snapshot
assertions, other phase transport failures, all scratch accounting or global
cycle/failure coverage. Normal graph/pool callers still need coordinated world
budget adoption. Matched successful small/large serial/four-worker profiling,
current instrumentation and the final integrated release gates remain pending.
### Frozen admission before/after profile and native gates (2026-11-23)

The selected native compiler/LR/execution/frontend targets now link after the
reviewed work_named provider correction. Query-smoke passes with the current
22 Publish and24 interpreter-resource cases; these are before L1's new frame
owners, so they do not substitute D1's calibrated successor. Control-smoke
passes34.61wall/35.58user/2.08sys/256480KiB. Type-smoke passes224.84wall/
229.00user/12.62sys/262596KiB, below its existing240s bound without retry.
The ten focused dispatch/source-admission cases also pass.

A2 granted a fresh quiet window03:21:40 UTC. After all owned tests drained,
A1 ran32 checked executions (one warmup and three alternating measured pairs)
on the same frozen small staged expression and larger aggregate/capture program.
Native Linux x64 compiler, public9653 bootstrap/LLVM19, targetwasm32 interpretation,
explicit identical packaged Bedrock/Foundation/types, requested workers1/4,
warm filesystem after the excluded warmup; own affinity0-3,4CPU/8GiB.
Before compiler7c5e9d3812d5bb110efd8ccdd73ff8e7b100dd50162e1eea0e8fd07658627859
is9c1927a; after013a08f9435087a353a2c50fe3f54e02f77ece2147b3526bea496b5c8f6727c3
is the three production-path872df0e admission/retry change. Resources and source
hashes are retained in semantic_admission_paired1.log. This comparison does not
attribute earlier snapshot/graph-constructor changes to the admission fix.

| Input/workers | Median wall seconds before -> after | Median CPU seconds before -> after | Median peak RSS KiB before -> after |
| --- | --- | --- | --- |
| small/1 |1.18 ->1.18|1.08 ->1.09|178568 ->178880|
| small/4 |1.08 ->1.06|1.22 ->1.21|194596 ->193140|
| larger/1 |1.22 ->1.17|1.12 ->1.08|178168 ->179112|
| larger/4 |1.09 ->1.07|1.23 ->1.21|196600 ->196812|

All outputs match their reference, all four before/after serial/parallel
Foundation products are byte-identical, and the after-four-worker product
reparses/executes to the same output. The small serial CPU median increases10ms;
larger serial peak RSS increases944KiB. Retain those costs; three samples do not
prove neutrality or a stable speedup. Four requested workers give modest9-11%
end-to-end wall savings in these inputs, not evidence of four-lane semantic
overlap, all-core scaling or packed payload locality. No scheduler idle/critical
path or full-heap allocation counter is measured here. The focused tests
separately check real transport, exact retained ownership, zero final ledger
and unchanged entity/component counts across failed retries. Supported current
instrumentation and final merged bootstrap/browser/generation remain open.
The quiet window was released immediately after process exit0 and drain.
### Shared semantic resource receipt interface (2026-11-23)

ROOT authorized one fixed `SemanticResourceFailure { error, offset }` on
SemanticProgram, with allocation-free first-error `sem_resource_record` in the
existing context provider and a thin query API declaration. `sem_ok` now checks
both the receipt and ordinary diagnostic. Only fresh program initialization may
reset it. Workers may record only on their private SemanticProgram; work that
borrows the coordinator program must retain its result and publish after joins
in source order. No numeric offset sort substitutes declaration/module order.

At parent ab4f440, the four-path interface compiles with public bootstrap9653:
semantic_program_types succeeds; context16.64wall/11.94user/.92sys/676736KiB;
query API2.79/2.07/.18/203960KiB. Logs are semantic_resource_contract_*1 in the
owned A1 cache. Exported exact patch4ff9a47670e9ffe9cf5b35f94c70ebddc48586e12c38457a2bd0be3647b5e9af
also passes ROOT's apply check on its selected storage/parser/editor union.
This is an interface checkpoint, not producer/consumer or runtime acceptance.
All affected objects must be rebuilt for the added field. A1 owns ordinary
semantic worker result transfer, L2 type/generic adoption, B2 output/inspection
consumers. Allocation-free presentation pairing, cancellation tests, successful
before/after profiles and current instrumentation remain to be implemented and
validated before claiming the resource receipt closes recovery failures.

### Resource receipt transfers and joined-source review (2026-11-23)

Review parent460a29b5 preserves ROOT9b318 and A1's checked admission history.
The persistent interface checkpoint9a35996 is followed by producer integration,
not a claim of complete allocator coverage. ROOT03:34 approved bounded diagnostic
restoration: select the first resource receipt in caller source order, retain
its offset, and copy only into sufficient existing capacity including NUL.
Otherwise retain an empty text vector and the fatal fixed receipt. Ordinary
restoration cannot attach another producer's text after that selection. Valid
message owners have separate buffers or are the exact destination vector; the
self case captures metadata first and skips copying. A shared static enum message
serves output consumers without allocating. sem_query_error classifies an actual
failed graph operation; it neither drains nor cancels and must not classify an
ordinary empty ready queue on a healthy graph as failure.

| Reviewed path | Ownership and failure disposition at this checkpoint |
| --- | --- |
| semantic_context.tower | Existing provider owns allocation-free record, static fallback and pure graph classifier. The existing joined-only cancellation helper keeps its cleanup boundary. No shared last-error slot. |
| semantic_program_types.tower | One fixed resource pair on the program, initialized only with the fresh program. B2/L2 coordinated ABI; no independent semantic graph or value registry. |
| semantic_support.tower | Sticky success check and bounded paired restoration keep failure selection independent of presentation. Distinct producer vectors retain their ownership; insufficient destination capacity is explicitly supported. |
| semantic_query_api.tower | Thin declarations for the same implementation. Capture request/pump exports expose existing resumable production entrypoints; no second implementation. |
| semantic_declaration_types.tower | Fixed receipt added beside producer-owned diagnostic; lexical captures, query identity and scratch ownership remain on the same component. |
| semantic_declarations.tower | Private worker receipt transfers at join. Failure walk recognizes text-free resource failure; isolated error clearing and earlier ordinary error restoration cannot replace selected resource provenance. |
| semantic_body_work.tower | Discovery/body workers copy private receipts to retained continuations. Prefix/call/success publication excludes failed receipts. Isolated layout text clearing preserves a selected resource error; lexical/scratch ownership still transfers after all stages publish. |
| semantic_evaluation.tower | Interpreter storage_error survives invocation disposal and optional inference. Existing source-ordered failure restoration now publishes the fixed program receipt. Isolated producers retain their receipt until the owning dependency consumer selects it. |
| semantic_evaluation_work.tower | Private preparation receipt transfers into its existing evaluation producer, including when no message survives. All stages publish before observations and fixed receipts; failed preparation cannot mark its ticket successful. |
| semantic_execution_work.tower | Private snapshot receipt remains on the original function's producer. IMFunctionInput.ready rejects text-free failure; existing dependency failure walk restores that receipt. Completed helper readiness is reused. |
| semantic_iteration_work.tower | Protocol resolution workers retain their private receipt. Joined publication enters failure cleanup instead of interning/signature continuation on resource failure. |
| semantic_lowering_work.tower | All-stage publication still precedes result processing. Source-ordered paired restore and typed ticket success keep text-free failure from becoming successful lowering. |
| semantic_known_work.tower | Coordinator formats its pre-reserved bounded error before recording the selected typed failure. Known scan/Publish/Inputs workers never mutate the borrowed shared program receipt. |
| semantic_capture_work.tower | Cancelled entry now fails before taking work instead of interpreting Cancelled demanded tickets as Waiting. Retained capture failure includes the resource pair without clearing the selected program text. |
| semantic_query_pipeline.tower | Existing phase order and quiescence ownership unchanged; isolated layout recovery cannot clear selected resource text. No cycle is diagnosed at an intermediate empty phase queue. |

Smallest public9653 units declaration-types, support, capture and query API and
both focused test objects pass. support15.99wall/11.37user/.90sys/680124KiB;
receipt fixture2.97/2.22/.16/213160; dispatch fixture3.06/2.35/.12/215148.
The first attempt failed unsupported else-if syntax; its log is preserved and
the two handlers use supported nested if. No runtime result is inferred from
these object compiles. Native refresh and focused runtime checks are next.
The root-applicable four-path contract patch b255ff124c9c1bb0e2c39a38fb9690630e4cbb09fb0e1ab529ec6ef5f72a1e31
passes a temporary-index apply check on ROOT9b318; excludes incidental capture
exports and the checked-owner helper refactor. L2 retains constructor/type/generic
ownership, B2 output and inspection consumers, D1 generic harness.

Further review found private source-binding analysis still discards its resource
receipt and completion visibility clears its text. Those two small corrections
are queued until the current source build drains. Other phase graph/dispatch
assertions, normal world-budget adoption, per-phase cancellation and complete
allocation-failure coverage remain open. No shared-worker race freedom, packed
locality or whole-compiler scheduling completion is claimed. A frozen matching
pre-receipt source tree8490874169ce199f7f69a3ffecb3624a0caab545 was archived in
the owned cache (ROOT9b318 plus A1 admission, with only the interface removed)
for before/after profiling, not as a private bootstrap or release prerequisite.

The two queued paths are now updated: semantic_source_bindings transfers a
private program resource error to its existing SemanticKnownWork receipt before
scratch disposal, and marks the proof incomplete on semantic failure. Its
coordinator retains existing job/source-order error publication. In
semantic_modules, completion visibility stops on a sticky resource receipt and
clears only ordinary source diagnostics. No module binding/proof policy changed.

Native compiler/LR/execution/frontend rebuild succeeds182.66wall/134.54user/
10.74sys/737008KiB on the larger joined tree. The affected semantic provider
refresh after these two corrections succeeds22.00/15.19/1.15/728796KiB. All ten
strengthened real-transport dispatch/admission/source-retry cases and five new
receipt/capture-cancellation cases pass; the latter .01wall/.01sys/50748KiB.
The first OS link-script generation selected a PowerShell character instead of
the full command and left the receipt executable absent; corrected host linking
passes, with the original script failure preserved. Query-smoke also passes on
the final provider, including existing22 Publish and24 interpreter-resource
cases. These are still before L1's charged frame owners and do not replace D1's
required successor calibration. Control's first invocation used the packaged
resource directory instead of the harness source RESOURCE_ROOT and aborted at
resource open; type did not run. Corrected /work/scaffolding invocations retain
the unchanged120/240s bounds and have no claimed result yet. Current matching
profiles, supported sanitizers, B2/L2 producer/consumer integration and release
acceptance remain open. ROOT03:50 independently reviewed V2 b255ff12 and verified
its application on9b318; that is source review, not independent runtime proof.

At25c3a63e, corrected control-smoke passes32.57wall/33.41user/2.00sys/
273172KiB and type-smoke passes221.90/226.34/12.13/283672KiB within the existing
240s bound. Query/control/type and the15 focused cases are current native
behavior evidence, not current sanitizer or final release evidence. ROOT's V2
review found Stale/Exhausted fell through to an Invalid fallback message; the
shared static helper now names stale reservation and exhausted identifiers
truthfully. The typed receipt and all success/ownership paths are unchanged.
Smallest public context5 compiles; affected binary refresh is still running.

Postcommit pull with --rebase=merges preserved25c but replayed335 commits against
unchanged published60741. The next native refresh scheduled62 actions after
only two message lines changed, whereas the preceding genuine provider refresh
needed5 actions/22s. Refreshed tracked/bootstrap mtimes are the apparent trigger,
not changed compiler behavior; hash/mtime attribution and a fast-forward-only
pull fast path with rebase fallback remain to be checked after jobs drain. This
iteration issue was routed to ROOT/D2 without weakening dependency checks or
changing shared build tools. Matching pre-receipt baseline build and quiet paired
profiling follow the current immutable build. ROOTc917 entity/backend integration
is queued after that freeze so its changes cannot confound the comparison.

The current census atc6ed1d2d is55 assigned semantic*.tower paths: the earlier54
plus scaffolding/tests/semantic_receipt_checks.tower. Full source review of this
new file: its receipt trials own distinct diagnostic vectors with scoped disposal,
exercise both pre-reserved and absent destination storage plus exact self-alias,
and assert unchanged pointer/capacity, first-caller provenance despite a later
smaller numeric offset, and persistence across ordinary text clearing. Cancellation
trials use actual world/context/capture queries at32/64-bit widths, show a healthy
undemanded capture completes without a false failure, then cancel demanded work
and repeat entry three times. Exact entity/component counts and final world
cleanup check no replay/retention. Five native trials pass; supported current
instrumentation remains pending. No scheduler, allocator or evaluator is mocked.
semantic_dispatch_checks additionally asserts typed transport/admission failures
survive ordinary diagnostic clearing before repeated entry. Its ELF semaphore
wrapper remains coordinator-only and delegates all normal production operations.

ROOT identified these two owner's fixtures lack durable runtime registration.
D1 owns the existing runner/CMake/README integration. A1 authorized receipt entry
conversion to a callable query test after its freeze. Dispatch needs the existing
production semantic sources plus ELF --wrap=work_signal_open, so a normal unwrapped
LR import or serial allocation-fault substitute is invalid. The proposed existing
CMake source/library composition with three bounded default/admission/source
registrations preserves all assertions; exact harness choice remains coordinated.
Formatting-glob discovery is explicitly not a runtime registration receipt.

### A1 resumed receipt profile and deterministic-selection investigation (2026-11-23)

Same session 01a2046f-fec2-7cd1-bdc9-0a0c6127c6f7 resumed with Codex PID32512.
The required merge-preserving ff-only pull returned Already up to date and kept
c6ed1d2d and the two pending documentation edits. No old usage-limit response or
lost job was counted as progress. Both own container and tower-c-validation were
idle. The authorized own container is now CPU0-11, 12CPU/24GiB, one compiler
process; A2 has CPU12-23. All current measurements below use this same environment.

The immutable pre-receipt tree8490874169ce199f7f69a3ffecb3624a0caab545 now
builds successfully with the shipped Linux x64 compiler9653f818 and LLVM19.
Raw CMake attempts1/2 failed before compilation for missing native/bootstrap
arguments. Attempts3/4 reached linking but lacked backend_units_close. Matching
test flags alone did not resolve it: the actual omitted setting was
CMAKE_PROJECT_scaffolding_INCLUDE pointing to the archived TowerBackend.cmake.
Corrected build5 passed53 actions,146.19wall/123.36user/21.63sys/778640KiB peakRSS,
explicit jobs12, CMake parallel1. This is a profiling build, not documented
clean-bootstrap closure evidence. All failures remain in the lane cache logs.

Receipt comparison uses before binary4e8acdd69f66c80bf54b52a7de1d1b376554b97a5a48ed2fc71e6d1d0a61359e
and afterc6ed binaryb8bc2055e3394419eed6ccab12b027974fc260765ba574d11b116afba7e57560.
The existing resource_hook_profile small/large Tower staged inputs, packaged
Foundation/Bedrock/type resources, targetwasm32-unknown-unknown and --interpret
are identical; hashes and every command are in semantic_receipt_paired1.log and
the per-run time logs. One excluded warmup plus three alternating pairs per case
ran under a fresh A2 quiet ACK. All32 executions matched expected output;
before/after serial/4worker canonical Foundation matched bytewise and reparsed
to the expected result. All jobs drained before A2's subsequent quiet profile.

| Input/jobs | Before median wall / CPU seconds / peakRSS KiB | After median wall / CPU seconds / peakRSS KiB |
| --- | --- | --- |
| Small/1 | 1.20 / 1.10 / 179080 | 1.19 / 1.10 / 178208 |
| Small/4 | 1.07 / 1.22 / 194520 | 1.08 / 1.23 / 195664 |
| Large/1 | 1.22 / 1.13 / 177984 | 1.22 / 1.13 / 178024 |
| Large/4 | 1.08 / 1.21 / 198636 | 1.08 / 1.22 / 197256 |

CPU is user+system per sample. These short workloads show no material receipt
regression at this resolution; they do not establish general multicore scaling,
critical-path/idle costs or a cross-language advantage. Current15 focused cases
supply exact zero-retention/receipt-lifetime checks, not a complete allocation
profile. Current sanitizer, integrated provider and final release gates remain
open. The earlier4CPU/8GiB admission profile is separate, not this comparison.

ROOT's evaluation-order source triage is confirmed in current code: immediate
restoration in sem_evaluation_fail and preparation publication uses ready batch
order. Planned fix retains per-producer failures until the canonical
evaluation_jobs owner-publication frontier permits selection, including an
earlier demanded producer waiting across pumps. Dispatch order remains ready
order. A focused before-failure fixture and actual D1 phase receipt are still
needed; this paragraph is design/source evidence, not an implementation pass.
L2's historical constructor proposal already exists with the stronger fourth
WorkTicket* parameter; no new helper/opcode or constructor edit is needed.

### A1 canonical evaluation failure frontier (2026-11-23, implementation checkpoint)

Reviewed base7e4bb885 joins ROOT72a218 provider history after the receipt profile.
No semantic ABI changed in that merge. Its ten affected native actions passed
40.56wall/27.25user/2.53sys/429280KiB. New own fixture
scaffolding/tests/semantic_failure_order_checks.tower compiles with the public
predecessor. Draft compile failures (missing enum base, reserved local name,
inferred i32 offset) remain as unit1-3 logs; unit4 is the successful object.

That unchanged fixture object fails against the actual merged production
provider (exit1, .03wall/.01CPU/50792KiB), reproducing premature diagnostics from
later ready stages, blocked earlier continuations and isolated unmask selection.
After the two-file production fix, all28 cases pass (.03wall/.02CPU/51276KiB).
The fixed public semantic_evaluation leaf passes16.32wall/11.79user/.86sys/
680972KiB; the coherent five-action native compiler/LR/execution/frontend
refresh passes21.92/15.06/1.18/738160KiB. Before compiler SHA6b1810dd7d38899385b04b4e2d7e91b62405c28b1e9e5e891e0ac02e323b7fd6,
after6d74458011cb0cde914086d96e21ba79e3b070b088533f1e776531aab75c7ef5.
Matched performance, existing query/control/type and current instrumentation
are pending at this checkpoint, not silently inherited from an older source.

Full updated per-file audit (56 assigned semantic paths, plus the historical
retired literal row retained in this document):
- scaffolding/compiler/semantic_evaluation.tower: retain ordinary/resource
  errors on stable world-owned producer components. A coordinator-only scan of
  the existing evaluation_jobs owner-publication index selects failed dependency
  receipts after joins, skipping undemanded/succeeded producers and deferring
  behind the earliest demanded pending producer. No offset sort or added cursor,
  scheduler, context layout or authoritative graph. Quiescent finalization uses
  the same owner order and checks failed dependencies before inferred fallback.
  Ready dispatch, access reservations, suspension and peer result publication
  stay unchanged. The additional scan uses the existing hash work_find index;
  its cost still requires the matched measurements.
- scaffolding/compiler/semantic_evaluation_work.tower: preparation keeps its
  error/typed receipt on the evaluation component instead of publishing it in
  readiness order. Stages still join and publish before receipt handling. Other
  graph/transport assertion-to-typed-failure migrations remain open.
- scaffolding/tests/semantic_failure_order_checks.tower: full new file reviewed.
  Real Foundation division-by-zero and bound-budget startup denial execute via
  ordinary interpreter/CompilerWork/WorkPool. Separate Body-query gates are
  owned by this fixture, sealed before evaluation registration and retired by
  the joined coordinator; they never replace the scheduler/evaluator. Source
  order83 then11 deliberately differs from numeric order. At widths4/8 and
  workers1/4, reversed gates, separate frontiers/repeated waits, earlier success,
  isolated selection, undemanded earlier work and resource receipts cover28
  trials. Dispatch/entity/component counts reject replay; invocation storage,
  world cleanup and exact zero byte/lane/live grants cover retained ownership.
  Diagnostic observers run after joins. Budget capacity/revision are named
  fixture inputs, available pressure derives from the actual snapshot. Current
  sanitizer and durable D1 runner registration remain pending.

ROOT's D1 phase artifact was located at the supplied parent path and verified:
D1_resource_phase_current.tower SHA1f1f2f29334e478f47b041ce148c7a59554ad8a8e0f8ec4c9fdb2589ff38a223,
probe_v4 patch0851e3e1fea6344958fafa70555e1a31082e6d8a695912c41a7b6a2fcea97eae.
Source review confirms its workers observe the actual startup/growth failure
before invocation disposal and its gate completion can reverse readiness.
ROOT reports independent required/inferred immediate failures selecting29 while
receipts retain11/29; isolated selects11. That is D1's receipt, not a locally
rerun successor claim. It remains owner-controlled; no competing harness edit.
L2 constructor request failure paths need the same owning selection discipline,
and the complete shared-budget/transport/cancellation acceptance remains open.

### A1 owner-order measurements and direct clone-owner correction (2026-11-23)

The a693465 checkpoint passes query/control/type smoke on its frozen input;
type221.03wall/225.32user/12.05sys/268148KiB within the unchanged240s bound.
Matched before6b1810dd/after6d744580 profiling used the same environment/resources/
inputs as the receipt trial, one warmup and three alternating pairs per case.
All32 outputs, serial/4worker canonical Foundation and reparse matched.

| Input/jobs | Before wall / CPU seconds / peakRSS KiB | After wall / CPU seconds / peakRSS KiB |
| --- | --- | --- |
| Small/1 | 1.17 / 1.07 / 178024 | 1.20 / 1.10 / 178472 |
| Small/4 | 1.06 / 1.20 / 195960 | 1.09 / 1.23 / 193636 |
| Large/1 | 1.19 / 1.10 / 178372 | 1.21 / 1.12 / 178304 |
| Large/4 | 1.08 / 1.22 / 197348 | 1.08 / 1.22 / 195544 |

The apparent small2-3% cost was investigated with another fresh A2 quiet window,
the same frozen binaries/inputs, one excluded warmup and nine alternating pairs
for small1/4 only. All40 outputs plus canonical/reparse checks passed. Medians:
serial1.19/1.10/178420 ->1.19/1.09/178616; four workers1.07/1.21/195692 ->
1.07/1.20/195696. Thus the initial difference was not reproduced. Both data sets
remain in semantic_failure_order_paired1/investigation1 logs. This is bounded
short-workload evidence, not a proof of zero cost or general useful scaling.

After all jobs drained, verified ROOT75fdf0bf bundle5fe3be67 fast-forwarded main,
including the corrected L1 charged-frame/diagnostic and L2 TypeIndex history and
A2 physical-page result changes. Matching17 native compiler/LR/execution/frontend
actions passed98.53wall/68.88user/5.48sys/737804KiB. These are new integrated
inputs; older a693 smoke results are not relabelled as this source.

A subsequent full caller audit found sem_known_infer invokes clone_all directly
before taking KnownSnapshot. Deferring clone errors without restoring them to
that owner could leave a failed snapshot ticket with no program diagnostic.
Four new direct-owner trials use the legitimate Foundation component limit,
normal clone kernels/stages and ordinary error receipts. The same32-case object
fails with exactly those four diagnostic assertions on the new merged before
provider (.03wall/.02CPU/50988KiB); the existing28 cases still pass.

Updated file review:
- semantic_evaluation.tower: the existing source-order selector now accepts the
  owning query kind. Evaluation pumping drains clone work directly and selects
  only the Evaluation frontier, preserving an earlier pending evaluation even
  when a later clone has failed. No new storage/index is added.
- semantic_evaluation_work.tower: existing clone_all is the clone-only owner
  boundary used by KnownSnapshot. It selects canonical KnownClone failures after
  all stages join/publish. Its declaration-only export allows the focused client
  to call the real owner path; no implementation is copied into the test.
- semantic_declarations.tower: the existing failed-edge walker recognizes
  KnownClone as another producer of SemanticEvaluation's retained error, so
  isolated/dependent consumers do not lose clone diagnostics.
- semantic_query_api.tower: adds only the existing clone_all entry declaration,
  with no context/expression layout change or second provider.
- semantic_failure_order_checks.tower: four direct clone-owner cases at4/8-byte
  targets and1/4workers assert joined peers, selected retained text/offset, no
  interpreter start, repeated-call count stability and world teardown. The
  semantic path census remains56; no new file is introduced.

The public evaluation-work leaf passes16.56wall/12.07user/.77sys/681392KiB and
five affected native actions pass22.23/15.24/1.23/738504KiB. All32 unchanged
fixture cases then pass (.03wall/.02CPU/51040KiB). Before compiler4981de5936cf2380de00c414c2dd30ccedcc05f4ed30da47d36b8d6619e53b3f,
after5ac7fa876183d64283ead6315a8f77f845ce9925509bada144d67e6aebd08e1c.
Matched clone-wrapper profiles and current supported instrumentation remain
pending. D1's exact phase successor applies cleanly but is not silently installed
or counted as run; owner coordination for its two harness paths is pending.
No publication lease or final acceptance has been requested.

### A1 integrated phase and memory instrumentation receipt (2026-11-23)

ROOT authorized exact D1_resource_phase_probe_v4.patch0851e3 adoption after the
freeze. The two D1-owned test paths were applied without changing assertions.
Its fixture SHA5a6e7bfdedfE43b9b92c49b3ab2d021a1eebfc94a0c617bbdc202e0132a83bd1
differs from separately supplied current1f1f2f29 only by ten additional
failure-reporting puts lines in the latter. This receipt uses the exact patch
variant, not a claim of byte identity with that separate current file.
All24 actual startup/nested-growth cases pass on ROOT75+3bda7128, followed by
query-smoke. D1 retains durable registration ownership; no new harness is added.

The existing native-address1 cache was rebuilt coherently through the public
predecessor and the supported LLVM19 Tower instrumentation tool:64 actions,
240.41wall/168.21user/14.87sys/738432KiB. With
ASAN_OPTIONS=detect_leaks=1:halt_on_error=1, actual resource-smoke24 and query-smoke
pass. The own32-case failure-order fixture was separately emitted as LLVM IR,
instrumented by the same Tower tool, compiled and linked with those matching
instrumented production objects and the ASan runtime; it passes.10wall/.06CPU/
76600KiB with leak detection. The external LLVM library remains uninstrumented.
This is actual memory/leak evidence, not TSan/UBSan coverage or universal race
freedom. TSan and later caller changes still require their own validation.

All owned jobs drained. A2's new stage checks occupy its independent budget, so
the ready clone-wrapper performance pair4981de59/5ac7fa87 remains immutable and
queued for a fresh quiet window; its measured before/after correctness is
already recorded above, but its performance is not yet claimed complete.

ROOT's actual L2 eight-path source draft411046678aaea89119e6030c71eb755ccb00cf48d41dc1e88f805ca535efc64a
has now been verified/read and applies cleanly. This supersedes the stale status
written across its delivery. It remains L2's draft implementation, not A1-authored
code or final acceptance. Next A1 work covers three routed callers: retiring
evaluation after a failed/cancelled type request, stopping body discovery after
generic-body failure, and checking failure independently of the generic-copy
progress boolean at an empty declaration frontier. Transitive executable request
and evaluation wait cleanup also need guards to avoid suspend(0) and finishing
cancelled peers. Current instrumentation above predates that integration.

The queued clone-wrapper profile4981de59/5ac7fa87 has now run under fresh A2
quiet coordination: all32 expected outputs, serial/4worker canonical equality
and reparse pass. Same frozen inputs/resources/target and one excluded warmup
plus three alternating pairs, CPU0-11/24GiB. Medians wall/CPU seconds/RSS KiB:
small1 1.19/1.09/178760 ->1.20/1.11/178424;
small4 1.06/1.20/196508 ->1.06/1.20/193872;
large1 1.19/1.09/175164 ->1.20/1.10/175924;
large4 1.07/1.21/195876 ->1.07/1.21/196508.
The serial difference is .01wall seconds in these short samples; no claim of
exactly zero overhead or broad scaling follows. semantic_clone_order_paired1 and
all per-run logs preserve inputs and results. L2's subsequently applied draft is
not a profile input and is not attributed to this comparison.

### A1 joined dependency-request failure callers (2026-11-23)

Implementation under review: b58489fe plus the unchanged, ROOT-routed L2
resource-pump draft411046678aaea89119e6030c71eb755ccb00cf48d41dc1e88f805ca535efc64a.
L2 owns its eight paths; this receipt does not attribute that draft to A1 or
close its pending typed stage/view/publication classifications. A1 changed only
semantic_evaluation, semantic_body_work, semantic_execution_work and
semantic_declarations for this caller milestone.

A joined type request may return zero after the graph has failed. The old
caller asserted while finishing that invalid ticket. A failed generic-body
request likewise flowed into body discovery and executable registration; the
consumer could then suspend on zero. The declaration pump's empty batch only
checked failure when generic execution returned progress, allowing false idle
success. The fix stops registration on the sticky program/graph receipt, checks
failure independently of progress, and retires only valid evaluation tickets.
After all workers join, it disposes every remaining invocation and withholds
peer/alias publication after the first global failure. Existing source-ordered
ordinary evaluation failure selection remains separate.

The new semantic_query_failure_checks.tower uses real world ownership, the
ordinary interpreter, generic registry/header APIs and a budget-bound WorkGraph.
A worker-private probe delegates unchanged Evaluate work and records actual
constructor/function suspension before coordinator cleanup; a peer must really
complete. It exhausts remaining ledger bytes from the actual snapshot and task
capacity, never a guessed allocation count. Twelve cases cover pointer widths
4/8 and workers1/4 across constructor, body and empty declaration failure.
They assert Capacity, drained graph/pool, disposed invocations, no peer value
publication, repeated failure without entity/component growth, and zero final
ledger grants/world ownership. This is targeted failure evidence, not general
scheduler scaling or production graph-budget adoption.

The first fixture version exposed an EARLIER failure: WorkGraph work_request
can grow its derived hash index before even an existing-key lookup. Thus the
original constructor/body aborts and the first after abort did not establish
the intended producer path. Logs and gdb backtraces are preserved. The corrected
fixture prewarms that index and adds actual worker-phase assertions. The exact
same fixture2 object linked against a frozen b584+L2draft semantics object then
reproduces constructor exit134 at the evaluation finish assertion, body exit134
inside body_request called by executable_request, and declaration exit1 with
four false-idle assertions. Matching fixed providers pass all12. Each selector
status is0; the copied baseline collection script deliberately ends1 after
collecting all statuses, so its wrapper exit is not a product failure or a pass.
No assertion was removed and no failed selector was hidden.

Host Windows11/Docker Linux x64, public predecessor9653f818, LLVM19, own
CPU0-11/24GiB, one compiler/jobs1. Corrected fixture compilation:3.52wall,
2.64user/.17sys,220124KiB. Smallest changed semantic_evaluation unit:16.70wall,
11.97user/.88sys,680584KiB. Matching three-action native refresh:21.88wall,
15.13user/1.20sys,735316KiB. Reconstructed before semantics provider:23.32wall,
16.12user/1.32sys,730876KiB. These are compilation costs, not runtime speedups.
Logs semantic_query_failure_{unit2,leaf1,native2,before_provider2} and
before/after_{constructor,body,declaration}2 retain exact commands/results.
Frozen before compiler1adcfd8b040a93d10f9cdd2467fd6a460e2b4166df1a8c611af12a474a391690
and after6910c461bbae3db425dfbb367c72c362cd1c8d185d033ebe833b70bbecefc254
are ready for equivalent checked profiles. Current instrumentation and broader
smokes still need refresh; prior ASan evidence predates this L2/caller union.

New per-file audit receipt: scaffolding/tests/semantic_query_failure_checks.tower,
reviewed in this b584-based working tree. Stack-owned probes live through joined
pool/context teardown, each worker writes only its own probe, all graph and
publication decisions stay on the coordinator. Filler tasks are undemanded
identities in the existing graph, not a second scheduler/IR. Raw pointers carry
existing explicit counts; bounds derive from actual task capacity and ledger
snapshot. The fixture opens a real budget-bound pool to retain probe ownership;
it does not establish that normal sem_workers_open is budgeted. Disposition:
12 native cases pass; durable D1 registration, instrumented union and final
release remain open. This increases the living A1 semantic census from56 to57.

ROOT's next physical-accounting request is accepted: normal sem_workers_open
still calls unbudgeted work_pool_open. All11 production call sites are A1-owned;
most assert its boolean, so binding the existing world ledger also requires
honest typed failure returns and cleanup at those owners. No new shared layout
or scheduler API is proposed. Normal sem_context_init also uses unbudgeted
work_init; this remains a separate explicit gap. The earlier existing-key
allocation assertion is another open caller gap, not silently classified as
fixed by these targeted changes.

Current caller-union validation now completed: native query-smoke and
control-smoke pass; the matching AddressSanitizer refresh passes all28 actions
(110.25wall/67.39user/9.09sys/736136KiB). With
ASAN_OPTIONS=detect_leaks=1:halt_on_error=1, phase resource-smoke24, query-smoke
and the instrumented new12-case dependency-failure fixture all pass. No live
owned jobs remain. Logs semantic_query_failure_address_* preserve the exact
commands. TSan/current full type/bootstrap/browser/generation/release evidence
remains pending; external LLVM is uninstrumented and source-language UBSan is
not supplied by this path. The matched runtime profile is ready but waiting for
a fresh quiet window; no old profile is being relabeled for this caller change.

### A1 caller profile and nested pool accounting follow-up (2026-11-23)

The committed caller fix0beeb8aa now has its matched quiet-window profile:
source pair b584+L2draft411 before/after the four A1 callers, frozen native
compilers1adcfd8b/6910c461 and a separately preserved identical resource tree.
The later ROOT556/L2history/B2 draft and pool edits are not profile inputs.
One excluded warmup plus three alternating pairs for small/large staged inputs,
workers1/4, Linux x64 host/wasm32 interpreted target, CPU0-11/24GiB. All32
expected outputs, serial/parallel canonical Foundation comparisons and reparse
pass. Medians wall seconds / CPU seconds / peak RSS KiB:

| Input/workers | Before | After |
| --- | --- | --- |
| small/1 | 1.19 / 1.12 / 178972 | 1.16 / 1.09 / 179372 |
| small/4 | 1.05 / 1.21 / 195968 | 1.05 / 1.21 / 197108 |
| large/1 | 1.16 / 1.10 / 178776 | 1.16 / 1.09 / 179320 |
| large/4 | 1.06 / 1.23 / 196964 | 1.06 / 1.22 / 195272 |

No wall regression is observed in these short samples; the small serial change
is not a broad speedup claim. Actual failure cases independently check zero
live ledger grants after teardown and unchanged entity/component counts on
repeated failed pumps. No allocation/idle-time census or universal race-freedom
claim follows. Logs semantic_query_failure_paired1 and every per-run time/output
retain the exact commands. A2 granted/released the bounded quiet window; no
compiler build overlapped it. These results close this caller's pending matched
profile only, not A1 acceptance or final integrated instrumentation/publication.

Full ROOT556 history was merged as2ae4a81d. The sole runner conflict retained
EXACT incoming D1 receipt/order registration; the already adopted phase fixture
was identical. L2 fullf035 history was then verified against every path of the
local411 draft before replacing that identical draft with owner history in
d8a2b7b7. Its sole context conflict preserves A1's Stale/Exhausted messages.
L2's stage/view/publication Memory classification is still present in f035;
full history does not imply that pending correction has landed.

ROOT authorized exact B2_world_output_import_current.patch f2607e12 for the
actual peak-minus-one reproduction. All source/audit hunks were applied without
rewriting B2 logic; the exact WASM cancellation hunk was already present and
verified in reverse. The309-line append-only B2 journal addition was preserved
verbatim at the current journal end because the old EOF/base blob could not
support an automatic three-way application. That failed atomic attempt changed
no files. B2 draft files remain separately owned/uncommitted pending its history.
The resulting pre-pool native21-action build passed116.89wall/83.77user/6.16sys/
746728KiB and saved compiler05dfe8a3.

A narrow temporary Tower driver at A1 cache/semantic_peak_probe.tower calls
UNCHANGED B2 frontend_units_memory_tests, reusing units_read to load resource
text. Its first version passed filenames instead of source text and failed
Bedrock validation before the target; that orchestration failure is preserved.
Corrected driver reproduces actual reference answer42 followed by the
peak-minus-one Capacity oracle failing with Cannot allocate semantic storage.
The first GDB receipt breakpoints were optimized away at the call sites and
only observed the final oracle abort; they did NOT identify the producer.
Further localization is open. No null-to-Memory assumption or oracle change
has been adopted, and no L2/B2 production function is edited by A1.

New complete file audit: scaffolding/tests/semantic_pool_budget_checks.tower,
reviewed at d8a2b7b7 plus this draft; living semantic census58. The fixture owns
a synchronized world budget and real semantic context, derives slot payload
bytes from actual pool count/type and physical bytes from
compiler_buffer_allocation_size, and checks byte-only reservation ownership,
healthy retention, denied direct/declaration/layout entries, terminal failure
after pressure release, repeated no-growth calls and complete teardown. Widths
4/8 and workers1/4 produce16 cases. The existing generic fixture still binds
after its legacy world constructor: this tests pool grants, not prebound world
constructor accounting. Public unit1 failed on unavailable nonexported sem_ok;
unit2 uses the actual public program receipt/text observations and compiles.
Same fixture2 on the coherent before union exits1 (.02wall/.01CPU/50716KiB),
showing unaccounted slots and ignored denial. Runtime after validation is pending.

Implementation draft, nine A1 production files: semantic_context binds the
existing work_pool_open_budget to the root's world ledger, preserves its typed
failure without allocating diagnostics and rejects retries after sticky failure.
The ten formerly asserting opens in evaluation, preparation, executable,
declaration, body, layout, flow and lowering return to their owning pump; the
existing checked known-work path remains. Body pumping also stops after failed
layout inputs. No shared layout, second scheduler, extra lane grant or ownership
policy was introduced. These opens precede worker dispatch; failed pool cleanup
belongs to the existing WorkPool constructor and normal context teardown.
Smallest context compilation passes. New before/after pool profiles, current
ASan/TSan, additional affected smokes and integrated release remain pending.
Normal semantic graph construction and other assertion-based resource paths
remain explicit open work.

### A1 pool budget validation and producer trace (2026-11-23)

The nine-path pool change passes the same immutable16-case fixture that failed
before: after .02wall/.01CPU/51184KiB versus before .02wall/.01CPU/50716KiB.
The incremental native build took22.19wall/15.31user/1.24sys/746624KiB.
Two existing A1 fixtures had applied pressure before the formerly uncharged
pool allocation. query1 therefore failed32 order cases before their intended
interpreter-startup denial; after moving actual pool admission before pressure,
query2 reached a separate publication-fixture null assumption and SIGSEGV.
GDB localized publish_trial. That fixture now opens its actual pool after input
construction, reserves measured remaining bytes minus the unchanged phase
allowance, and requires postjoin retention to equal the measured pool baseline
plus its independent pressure grant. Cancelled entry still opens no pool.
All publication, ordering, atomic-output, retry and failure assertions remain.
The first order-unit rebuild also rejected imports after the new extern; moving
the declaration below imports fixes that syntax error. Failed logs are retained.
Smallest corrected units, runner3 and full query3 pass, including32 order cases.
The new16 cases independently cover pool admission denial and terminal retries.

Matched pool profile: frozen d8a2b7b7+B2f260 before compiler05dfe8a3fac9a968064e8065ff84d71b26cbbda7257f29da0b281232aaa5ff61,
after5192ae8294e721f1b96541e84cd5a22f5ecf76b979cd71a1e596b7b13a545471;
only the nine owned production paths differ. Identical saved resources and
small/large resource_hook_profile programs; native Linux x64 compiler,
wasm32-unknown-unknown interpreted target, explicit jobs1/4, CPU0-11/24GiB.
One excluded warmup then three alternating pairs per cell, all32 outputs checked;
serial/parallel canonical Foundation and reparse also pass. A2 fresh reciprocal
quiet grant09:22:07, A1 run09:23:49, session3672 drained0 and released immediately.
Medians below are wall/CPU seconds and peak RSS KiB (CPU=user+system per sample).

| Input/workers | Before wall/CPU/RSS | After wall/CPU/RSS |
| --- | --- | --- |
| small/1 | 1.17/1.10/178740 | 1.18/1.12/178592 |
| small/4 | 1.06/1.21/197040 | 1.05/1.21/196020 |
| large/1 | 1.16/1.09/178504 | 1.17/1.10/178260 |
| large/4 | 1.05/1.22/197056 | 1.06/1.24/196588 |

The observed .01second wall changes and <=.02CPU changes are small in these
short samples; three pairs do not establish statistical neutrality or broad
speedup. RSS medians fall slightly in every cell. The implementation adds a
terminal receipt check and charges retained slots once, without an extra lane
grant; repeated admission and teardown assert exact grants, physical header
bytes and zero final retention. No excessive-memory growth was observed. This
is not a scheduler idle-time/critical-path census or whole compiler heap budget.
All commands and samples remain in semantic_pool_budget_paired1/per-run logs.

The B2 peak-minus-one cause is now localized beyond the earlier optimized
breakpoint attempt. A public-pin --no-optimize semantic aggregate, linked with
the actual unchanged other providers, reaches sem_resource_record(Memory,3436)
from frontend_compile_sources before semantic_compile. Actual getters report
syntax_session_resource_error=Memory, syntax_get_error="Unable to allocate
replacement preparation storage", frontend_module_resource_error=None and
empty module text. Thus the cause already comes from B1 syntax replacement
preparation; the underlying failing replacement operation remains unlocalized.
No claim that semantic attachment or a generic constructor caused this denial.
The optimized unchanged fixture independently preserves its failed Capacity
oracle. Debugger stack offsets were derived from that exact unoptimized binary,
not adopted as source layout assumptions. ROOT requested/routed the handoff:
A1_peak_replacement_trace.zip SHA256b1c1ab5963a7cbd4ababc1454d90b0f8629ff7b32a839a4627895d4b6eda2b96
contains the Tower driver, trace2/3, source deltas, public-pin/provider recipes
and explicit provenance/limitations. B1 owns the producer correction. L2's
separate pending stage Memory fallback is not resolved by this finding.

After all jobs drained, complete ROOT351 history was verified and merged as
9f1b8021. Every B2 draft production path matched incoming history; only incoming
backend_units refined physical component receipts and B2 audit additions were
newer, so those are retained. New world_constructor content matched its incoming
Git blob exactly. Full premerge state remains in stash38de7892 and a binary
patch; the owned11-file delta/new fixture and unique journal append were restored
separately. No copied B2 production remains as an A1 draft or commit. Existing
owner histories and todo are preserved. Current merged native/instrumented
checks are pending; earlier results retain their exact frozen source identities.
The full A1 goal, semantic graph constructor/assertion paths, final public
bootstrap/native/browser/generation and leased release evidence remain open.
### A1 merged pool instrumentation and bounded control investigation (2026-11-23)

Frozen source32f860d9 includes full ROOT351 and the pool change. Its coherent
native11-action build passes78.34wall/52.78user/4.60sys/747212KiB; focused16 pool,
query-smoke, resource-smoke24 and control-smoke pass. Native control costs
33.22wall/34.10user/2.01sys/275700KiB. ASan35-action refresh passes209.26wall/
143.45user/12.85sys/746332KiB. Actual ASan+leak query/resource24 and separately
compiled16pool plus12constructor/body/declaration callers pass without reports.
Pool fixture: .06wall/.03CPU/65564KiB; caller selectors .06-.07wall/.03CPU/
64076-67020KiB. All use the production allocator and shared worker provider.

Fresh supported TSan configuration initially omitted the documented
CMAKE_PROJECT_scaffolding_INCLUDE=/work/cmake/TowerBackend.cmake hook; configure
succeeded but the LR target was absent. That setup failure is preserved in
thread_configure1/build1, and no TSan test ran. Corrected recipe matches existing
native/ASan integration and host clang. Public9653 predecessor, LLVM/Clang19,
Release, explicit jobs1/build parallel1, CPU0-11/24GiB;68 actions pass174.45wall/
125.51user/10.95sys/746024KiB. No project CMake policy was changed.
The first ephemeral base-image runtime attempt then lacked /usr/bin/time, which
was installed in the active validation container. Its failed fixture-build log
is preserved. Capturing the idle assigned container package environment produced
A1-only image sha256ab6292a9f1c285bd386bb14928b1308a597747794fe4697061f4061da34d64b2;
bind-mounted source/cache were not embedded. The successful retry uses this
exact environment, no network, source read-only, assigned cache writable and
the established sanitizer-only seccomp=unconfined startup policy. No host or
sibling security setting changed.

TSan16pool+12caller, three complete query runs and resource24 pass without
reports. A separate ten-repeat stress run passes160pool and120actual dependency
cases. Query cases include real workers, captures, executed/untaken staged
reads, continuation/failure and lifetime checks. These are scoped evidence,
not universal race freedom; system LLVM and browser execution are outside it,
and source-language UBSan is unsupported by this instrumentation pipeline.

The combined TSan control-smoke times out124 at120.06wall/131.63user/5.57sys/
808988KiB, without a sanitizer report; it is NOT a pass. Buffered output did
not locate the phase. The following stress loop was not reached and was run
separately only after the failed process/container drained. A cache-only Tower
semantic_control_phase_probe then invokes every unchanged control helper in
core/errors1/errors4 groups, retaining canonical comparisons and the shared
serial/worker deferred-depth diagnostic oracle, with progress text. No generic
fixture/harness or production file was edited. Smallest probe unit1 failed
unknown puts because imports do not reexport helper names; explicit direct
frontend_units import and OS declarations fixed unit2. Failed logs remain.
Core (positive1/4, canonical reparse, header error, deferred depth1/4) passes
100.80wall/112.76user/4.86sys/810324KiB. errors1 completes all five loop-failure
helpers and enters EarlierArm before its own120s timeout; errors4 is unrun.
This shows substantial instrumented compilation cost with observable progress,
not a proven deadlock or a completed control gate. No deadline was increased
and no unchanged whole matrix is scheduled again merely for acknowledgement.
D1/ROOT have the exact grouping/coverage gap; finer selectors or a measured
instrumented-test policy remain an integration decision, separate from compiler
performance. Raw semantic_control_phase_thread logs and Tower driver are retained.

Read-only follow-up at32f860: semantic_capture_work.sem_capture_request still
creates capture/value metadata before checking failed/cancelled admission and
asserts request/seal. Its evaluation caller already handles a zero dependency
and retires joined invocations. A cache-only16-case real bounded-graph fixture
is drafted for healthy identity, Capacity, cancellation, prior resource failure
and repeated no-growth requests; no implementation/reproduction pass yet.
Normal semantic_context_init still calls unbudgeted work_init. Binding that
ledger globally requires completing checked phase callers, not assuming all
172 remaining graph assertions are allocation-free invariants. The count is
an audit search result, not a completion measure. semantic_aggregates also
continues callback-signature mutation after failed sem_lower_transform; that
source-review gap has no runtime reproduction yet. A preceding status shorthand
claiming every inner lowering path guarded was corrected explicitly.

All owned jobs drained before the next integration. ROOT302 then newerROOT9d73
bundles are distinct inputs, not covered by these32f860 receipts. The latest
complete owner history includes A2's changed component-page header, so a coherent
affected rebuild is required; do not combine old object layouts with new callers.
Full semantic graph/capture/resource closure, remaining control instrumentation,
clean public-bootstrap/native/browser/generation and leased publication remain
open. No publication lease was requested or granted.
### A1 terminal capture admission (2026-11-23)

Full per-file follow-up: semantic_capture_work.tower reviewed at4baa1544
(ROOT9d73 full owner history) plus this change. Requests are coordinator-owned;
existing evaluation callers already retire a zero dependency after all workers
join. The old request created declaration/value component kinds and storage
before checking graph admission, then asserted request/seal. It could abort on
valid cancellation/Capacity or create new metadata after a retained program
failure. Admission now rejects terminal state first, reuses an existing query,
reserves/seals the graph query before attaching capture metadata, and records
actual failed graph cause/owning declaration offset through the existing joined
cancellation and allocation-free resource helpers. The successful finalization
sentinel remains an invariant; no live-revision reopening, new scheduler, shared
layout or constructor policy is introduced. Subsequent component allocations
and other capture/proof continuation assertions are not claimed fully checked.

New full audit row: scaffolding/tests/semantic_capture_admission_checks.tower,
reviewed4baa1544 plus this draft; current assigned semantic census59 (excluding
type/generic families and retaining L2 constructor reservation). The fixture owns
its world/context and a separate actual WorkGraph ledger. It derives task and
hash-index preparation from current retained capacity, fills only undemanded
identities, then reserves exact remaining bytes. World component storage is
intentionally outside that graph-only pressure, isolating query denial rather
than pretending to test entity allocation. Four modes at widths4/8 and world
worker budgets1/4 give16 cases: healthy undemanded identity, cancellation,
actual Capacity, prior fixed Memory receipt. Requests on the same and a later
numerically earlier declaration preserve metadata/task counts and first receipt;
pressure is released before retries. Final context/world/graph teardown asserts
zero retained grants. These admission cases execute no workers themselves;
separate existing dependency/query cases supply actual worker coverage. The
prior Memory case is receipt preservation, not injected allocator ENOMEM.

Public smallest fixture unit1 rejected the identifier expected under imported
grammar; wanted_error fixes unit2 without changing the oracle. Coherent before
native10-action build passes80.65wall/55.87user/4.48sys/747100KiB. Immutable fixture2
before: healthy0, cancelled134, capacity134, prior-failure1 with metadata/retry
violations. The collector's exit0 means those expected BEFORE failures matched;
it does not label the aborts successful regressions. All failures were reaped.
Smallest changed capture unit passes17.11wall/12.34user/.85sys/686692KiB; after
native5 actions25.87wall/18.07user/1.41sys/747736KiB. Same fixture2 now passes all16;
D1's newly registered12 constructor/body/declaration cases, query, resource24
and control smoke all pass on this coherent4baa+capture union.

Matched profile uses before compiler8318e3872a07107745134ad1549e27996fcc560b23ebc50276b38ea8d99e1bd3
and afterf06d565c8bd3843dea7a023961185e479d8159ac19babdbbfc8d61f182867c4f,
identical frozen ROOT9d73 resources and existing small/large staged inputs. Only
semantic_capture_work production changes. Native Linux x64 compiler, interpreted
wasm32-unknown-unknown target, CPU0-11/24GiB, explicit jobs1/4; one excluded
warmup and three alternating pairs per cell. All32 outputs plus canonical1/4
Foundation equivalence and reparse pass. Fresh A2 quiet grant10:00:13; timed work
finished10:01:18 inside the bounded run, release sent after completion polling.
Medians are wall/CPU seconds and peak RSS KiB; CPU sums user+system per sample.

| Input/workers | Before wall/CPU/RSS | After wall/CPU/RSS |
| --- | --- | --- |
| small/1 | 1.17/1.10/178816 | 1.17/1.10/178664 |
| small/4 | 1.05/1.22/196452 | 1.04/1.21/194436 |
| large/1 | 1.19/1.13/178216 | 1.18/1.11/178340 |
| large/4 | 1.06/1.23/196580 | 1.06/1.22/197216 |

No wall regression is observed in these short pairs; this is not a broad speedup
or statistical-neutrality claim. The largest RSS median rise is636KiB, with no
monotonic retained-owner growth in the repeated admission/teardown assertions.
No scheduling idle-time or whole-heap census is implied. Raw commands/samples
remain semantic_capture_admission_paired1/per-run logs. Current capture ASan/TSan
is pending the queued coherent L1 IMState change; the earlier32f860 sanitizer
receipt does not cover this new change or later owner inputs.

The control instrumentation handoff is exported as A1_control_tsan_probe.zip,
SHA2562d63011f1ebfcea3e75f326e0f37d11e66236dcc51b8ac99be1f9584f7d0ca21,
with the exact Tower driver, logs, recipes and explicit incomplete coverage.
ROOT76d now includes B1's actual LR Capacity producer repair and L1 cache
ownership after ROOT9d/A2 pages. It will replace queued intermediate bundles
only after this matched freeze; earlier peak-minus-one failures retain their
old input identity until independently rerun. No publication/goal closure.
### A1 fixed-path capture control and ROOT76d validation (2026-11-23)

Correction to the preceding capture/pool/caller timing interpretation: those
older comparisons invoked different executable paths. Their checked outputs
remain valid, but isolated code-cost attribution and neutrality are unproven.
ROOT's10:01:22 instruction follows L1's demonstrated executable-derived resource
path allocation confound. No unchanged historical matrix was blindly repeated.

The bounded capture control uses the same saved8318e387/f06d565c pair, actual
/cache/semantic_capture_admission_fixed/towerc installation path, that directory
as cwd, and identical installed ROOT9d73 resources under share/tower. Binary
copy, byte comparison and SHA256 are outside every timing; each compiler runs
in the foreground and exits before replacement. All resource hashes match
before/after (manifest SHA256bcb931ded43b503a69a73c9b166ba4faba6cf00e81c5477e240c01c222ba52ec).
Inputs, native Linux x64 host/LLVM19.1.1, interpreted wasm32 target, CPU0-11,
24GiB, jobs1/4, one excluded warmup and three alternating pairs per cell are
unchanged. These are warm-process samples, not a cold-filesystem experiment.

First control exited1 on OS cp 'Text file busy' after13 checked executions;
immediate process census showed init only, with no surviving compiler/worker.
This does not establish the OS cause. Retained logs are fixed1. Atomic staging
into towerc.next then rename onto the SAME towerc path resolved replacement.
Fresh reciprocal A2 windows cover both portions. Control2 revalidated Exit0 and
expected output before reusing13 saved samples, executed only19 missing samples,
then passed canonical1/4 equality, Foundation reparse and full resource-hash
comparison. No failed install became a successful sample or lost log. Automatic
quiet-release status was written by the OS wrapper immediately after child exit.

| Input/workers | Before median wall/CPU/RSS KiB | After median wall/CPU/RSS KiB |
| --- | --- | --- |
| small/1 | 1.18/1.09/178940 | 1.18/1.09/179644 |
| small/4 | 1.08/1.22/195196 | 1.07/1.21/195468 |
| large/1 | 1.20/1.11/178324 | 1.21/1.12/178816 |
| large/4 | 1.08/1.23/196852 | 1.08/1.23/195324 |

CPU is per-sample user+system before selecting its median. The largest wall
median increase is0.01s; small/4 before includes a1.28s sample, demonstrating
noise. Three pairs split by the preserved installation failure do not prove
statistical neutrality or broad speedup. Peak-RSS changes are small and mixed;
separate16-case admission assertions check repeated metadata/graph retention
and final zero grants. No whole-heap, idle-time or universal race-freedom claim.

After the old capture pair froze, complete ROOT76d297c history merged as9549559a:
new L1 IMState cache layout and B1 exact LR runtime producer are present.
Fresh public9653 fixture3 and unchanged B2 peak driver3 compile; native15-action
refresh passes82.81wall/59.82user/4.40sys/747348KiB. Actual16 capture cases,
D1 registered12 caller cases, query/resource24/control/capture-policy all pass.
The unchanged measured-peak-minus-one Capacity/no-output/retry oracle now passes
6.54wall/6.12user/.15sys/173344KiB; old before2 Memory failure retains its identity.
Control33.11wall/34.12user/1.90sys/274368KiB and capture-policy53.03wall/53.84user/
3.18sys/223828KiB are validation samples, not equivalent before/after profiles.
Current merged ASan/TSan are queued; old32f860 instrumentation is not relabeled.
The earlier TSan full-control timeout remains an explicit coverage gap.

Further per-file review at9549559a: semantic_context.sem_create has no context,
asserts create_related and bool attach, and cannot preserve precise creation
or attachment errors. semantic_control.sem_control_node immediately dereferences
shared/staged creation through sem_node.110 textual own-scope call sites are
an audit search, not a completion count. A2's raw-node WorkBuffer page proposal
has no adoptable implementation yet. A1 requested typed entity_attach_result
(or equivalent combined admission) because existing bool attach conflates
Busy/Invalid/Memory; successful unattached nodes need release on attach failure.
Stage cleanup must retain discarded ownership. No nullable signature-only port,
shared layout change or competing A2 implementation was made.

semantic_aggregates.sem_aggregate_prepare still mutates callback signatures after
failed sem_lower_transform. A cache-only Tower probe now exercises healthy,
prior failure, cancellation and actual lowering failure with unchanged callback
identity/repeated-entry assertions. It is not yet compiled or claimed a repro.
Full lifecycle/graph allocation closure, clean bootstrap/native/browser/generation,
current instrumentation and leased atomic publication remain open. No lease.

### A1 coherent capture instrumentation receipt (2026-11-23)

Frozen compiler inputs9549559a (ROOT76d plus capturede806), Linux x64/public9653,
Clang19.1.1, CPU0-11/24GiB/jobs1. Current ASan+leak32-action rebuild passes
216.24wall/139.81user/15.09sys/747864KiB. Current TSan32-action rebuild passes
144.29wall/94.45user/9.85sys/747724KiB. Each runs16capture admission cases,
registered12caller cases, query smoke and resource24, then ten full capture/query
repetitions. All pass with halt-on-error and no sanitizer report. The capture
fixture itself admits no workers; query/caller coverage supplies real dispatched
work. These targeted repetitions do not prove race freedom for all executions.

TSan uses the own ephemeral tower-a1-capture-thread3 container, network disabled,
source read-only, own cache writable and seccomp=unconfined solely for the
supported runtime's personality startup. tower-a1-validation:32f860 is the OS
package environment snapshot, not old compiler inputs: actual providers rebuilt
from9549559a. Both sessions78314/6678 exited0 and drained; ephemeral container
was reaped before any source mutation. Raw recipes and logs remain
semantic_capture_admission_sanitizers3 / instrumented3 / *_union3 / *_merged3.

The previous32f860 full TSan control timeout and incomplete errors1/errors4
coverage remain open. No identical expensive control matrix was rerun. Source
UBSan and system LLVM/browser instrumentation remain unsupported or separate;
serial allocator checks do not sanitize concurrent workers. Current native
control/capture-policy passed as recorded above. Clean public bootstrap, browser,
generation, whole integrated release and leased publication remain outstanding.
Documentation records actual receipts and adds no runtime behavior, so separate
runtime profiling for these documentation edits is inapplicable.

### A1 proof admission and failed callback publication (2026-11-23)

Reviewed b4e09673 plus the owned two-file production delta. Actual new failures
were reproduced before edits; this is implementation/evidence, not a proposal.
semantic_source_bindings created scan jobs through checked shared work helpers,
then asserted its aggregate proof query/dependencies/seal. It also asserted
completion after publishing joined facts, although waking dependent consumers
can grow the shared ready index. Those operations now use existing
sem_known_query_check: retain exact resource cause/owning source offset, cancel
only after workers joined, and return failure. An empty take on a healthy graph
remains waiting; graph failure is no longer silently waiting. Facts already
published are not replayed or rolled back: mark the pipeline published and retire
its private job vectors before reporting completion failure. Canonical payloads
remain world-owned. This changes no query layout, scheduler or type policy.

semantic_aggregates.sem_aggregate_prepare called sem_lower_transform and then
rewrote shared callback parameter/result signatures even after failure or graph
cancellation. It now requires both semantic and graph health before that ordered
publication. The global signature barrier remains intentional: later lowering
workers consume shared callback identities. No disjointness/noalias is inferred.

| New assigned file; review b4e09673 plus this draft | Ownership, storage, scheduling and evidence |
| --- | --- |
| scaffolding/tests/semantic_source_proof_admission_checks.tower |24 cases at widths4/8 and worker budgets1/4. Own world/context plus separate real bounded graph ledger isolate query allocation from component allocation. Preparation uses actual access/ready/dispatch operations and retained capacities; pressure reserves measured remaining bytes. Query/edge denial occurs after real scan admission, and finish denial wakes more consumers than the retained ready capacity. Before2 query/edge/finish abort134; after3 retains Capacity at root83, cancels waiting consumers, preserves first receipt after pressure release/retries, adds no repeated metadata/tasks, and tears down to zero graph grants. Healthy proof, prior Memory receipt and cancellation remain checked. Root-only scan is not claimed parallel overlap; ordinary query tests cover real workers. |
| scaffolding/tests/semantic_aggregate_admission_checks.tower |16 cases with own initialized world/context, ordinary Foundation callback/aggregate entities and actual production lowering. Healthy callback parameters/result lower once; prior Memory, graph cancellation and a real lowering-worker component-limit failure preserve callback identity across repeated calls. Before2 negative cases exit1; after3 all pass. Full semantic services/kernels are imported, so this fixture object REPLACES the production semantic provider in its link; other production providers appear once. No copied implementation or test-only exported semantic ABI. Worker-budget4 with one eligible job is not claimed useful overlap. |

Assigned census61 now includes both new files; L2 constructor reservation and
excluded type/generic families are unchanged. Existing source-proof/capture
fixtures in query smoke continue to cover lexical owners, alias invalidation,
executed/untaken reads and repeated suspended effects; these new tests isolate
admission/publication rather than replacing those semantic oracles.

First aggregate probe omitted generic_begin, so its synthetic worker error
crashed139 in generic_origin via sem_fail. GDB localized this test setup defect;
production generic/source initialization fixes probe2. The failed log remains.
GDB independently locates the source-proof finish abort inside the actual
sem_source_bindings_pump, not the fixture's precondition. Collector exit0 only
means expected BEFORE failure codes matched; the failing oracles remain failures.

Public9653 smallest aggregate closure (also imports changed source proof) passes
16.78wall/12.23user/.79sys/687544KiB. Source-proof fixture3 passes3.11wall/2.39user/
.13sys/214008KiB; full semantic-provider aggregate fixture3 passes21.15wall/
15.57user/1.01sys/750416KiB. Coherent native4-action refresh passes22.54wall/
15.70user/1.22sys/748212KiB. All40 new cases, registered12 caller failures, query,
control and capture-policy pass. Control33.22wall/36.12CPU/271668KiB includes the
existing nested aggregate callback signature_invokes(41)==42 at runtime/comptime,
serial/worker canonical equality and reparse; this supplies an independent
ordinary-language reference beyond direct metadata assertions. Capture-policy
53.17wall/57.15CPU/222880KiB passes executed/untaken dependency/effect cases.

Before compiler0f8f226d79388195969e113cccd52a941065b5cedf296c5d502d0158c53837b7
and after376fa7da6ccf6713b1be5ffe7a4311a14041c07f4415a59786a0ac87800eb75a
are saved with identical ROOT76d resources for the pending fixed-path control.
Current ASan/TSan refresh is also pending; preceding954955 receipts are not
relabeled for this delta. D1 registration proposal describes the aggregate
provider replacement explicitly. No shared harness, type/generic/constructor,
SemanticContext layout or node producer was edited. General graph/entity
allocation closure and final integrated release remain open; no publication lease.

A1 proof/publication matched control now passes32 checked executions plus
canonical serial/parallel equality, Foundation reparse and unchanged full
resource hashes. Frozen0f8f226d/376fa7da pair uses SAME actual
/cache/semantic_proof_publication_fixed/towerc path/cwd; atomic installed copy,
byte/hash checks are outside timing after each child drains. Fresh A2 reciprocal
window10:36:20; automatic release follows all canonical children. Same native
Linux x64/Clang19.1.1 environment, interpreted wasm32 target, CPU0-11/24GiB,
explicit jobs1/4, one excluded warmup and three alternating pairs per cell.
Resource manifest SHA256bcb931ded43b503a69a73c9b166ba4faba6cf00e81c5477e240c01c222ba52ec.

| Input/workers | Before median wall/CPU/RSS KiB | After median wall/CPU/RSS KiB |
| --- | --- | --- |
| small/1 | 1.16/1.07/179684 | 1.17/1.08/178732 |
| small/4 | 1.07/1.20/194716 | 1.07/1.21/197412 |
| large/1 | 1.19/1.10/178476 | 1.17/1.08/178548 |
| large/4 | 1.08/1.22/197412 | 1.07/1.21/197348 |

CPU sums user+system per sample before selecting its median. The small/4 RSS
median rises2696KiB(1.38%); after samples span194140-197520KiB, while large/4
is nearly unchanged. Normal-path checks add no new owned allocation and the
focused repeated-failure fixtures verify stable metadata/zero graph grants;
this does not establish whole-heap neutrality. Short three-pair differences
(up to0.01s wall increase) and noisy RSS are not a precise cost or broad speedup
claim. No scheduling-idle/critical-path or cross-language superiority claim is
made. Current ASan/TSan validation remains separate from these timing samples.

A1 proof/publication instrumentation after the frozen two-file delta now passes.
ASan+LSan coherent4-action refresh64.19wall/31.62user/6.52sys/748044KiB;
TSan coherent4-action refresh37.77wall/21.42user/3.01sys/747760KiB. Both run
source-proof24+aggregate16, registered12caller, query/resource24, then ten full
40-case/query repetitions (400 focused cases per mode plus query repetitions).
All exit0 with halt-on-error and no sanitizer report. The unchanged public
LLVM fixture inputs generated for ASan were hash-verified and reused for TSan;
only the supported instrumentation/lowering/link step differs. The aggregate
fixture replaces the semantic provider exactly once in both modes.

Sessions44129/91392 fully drained; TSan ephemeral tower-a1-proof-thread1 reaped.
Same own CPU0-11/24GiB/job1, source read-only TSan container, no-network and the
previously documented personality startup exception. Raw logs/recipes are
semantic_proof_publication_{address,thread}1 and corresponding fixture
*_publication1; original LLVM hashes are retained separately. No production
allocator fault injection substitutes for these real worker runs. Full-control
TSan timeout, source UBSan/systemLLVM/browser coverage, graph/entity allocation
closure and integrated release/publication remain explicit gaps. Last disk
free349245087744bytes. No sibling cache edits, todo changes or publication lease.

## Capture continuation transition review on d60fc743 successor

The full scoped census is62 files, including the new fixture below. This updates
the prior capture-work row; older baseline findings remain historical evidence.

| Path | Reviewed source and ownership/storage findings | Evidence and disposition |
| --- | --- | --- |
| `scaffolding/compiler/semantic_capture_work.tower` | Entire current file reviewed at d60fc743 plus this delta. Stable declaration-owned proof/expression/evaluation/lowering records retain continuations; no new storage layout or scheduler. Coordinator checks take/observe/suspend/finish failures through the existing allocation-free cancellation/receipt contract. Before-ticket failures belong to the phase/root; after-ticket failures belong to the binding. Structural invariant assertions remain distinct from recoverable graph operations. | Corrected20-case fixture passes; admission16/source-proof24/registered12/query/control/capture-policy pass. Failed-finish propagation cancels dependent consumers; repeated pumps do not replay metadata or overwrite receipts. Initial Take pressure hypothesis was invalid and is withdrawn. Entity/component creation assertions remain open; no universal allocation-failure coverage. |
| `scaffolding/tests/semantic_capture_continuation_checks.tower` | Entire new file reviewed. Own world/context and bounded graph ledger; real source-proof producer, actual retained buffer capacities and explicit pointer-width/worker samples. No mock scheduler or duplicate semantic implementation. Exact pressure reservations are released before context/world/ledger disposal. | Five modes x widths4/8 x workers1/4 =20 cases, zero retained graph grants after disposal. Healthy repeat-wait and four distinct graph transition failures pass. Single eligible producer is policy coverage, not useful overlap. Durable generic registration routed to D1; current joined sanitizers pending ROOT565 IMState coherence rebuild. |

The journal's "checked capture continuation graph transitions" entry records
invalid probes, corrected before/after identities, exact commands/environment,
measurements and still-open acceptance gates. Source review and focused passing
cases do not close lifecycle scheduling, typed entity allocation, final clean
bootstrap/browser/generation, independent review or hosted publication. Fixed-path
performance control awaits a fresh A2 grant; no obsolete sanitizer rerun is used
as acceptance of the incoming layout union.

Capture fixed-path32+canonical/reparse/resource control now PASS on immutable
376fa7da/769c489e (commit2872820b delta). Journal table records all wall/CPU/RSS
medians, including small/4 control's +0.02s/+0.03s and the lack of a neutrality or
speedup claim. Complete ROOT565 joined0362eb08 without conflicts; its changed
IMState has not yet received this lane's coherent runtime acceptance. Durable
pool-budget registration is reused for the next92-case milestone. This does not
resolve the remaining unchecked executable/flow/body/declaration graph paths.

ROOT565/capture287 joined0362 native92focused+12caller/query/resource/control/
capture-policy/type now PASS (type223.91s, no timeout increase). These are coherent
IMState providers rebuilt through the public bootstrap. The next ROOTbff/A2dfcef
history union is queued after drain; this lane intentionally avoids an obsolete
premerge sanitizer matrix. Typed entity producers are available, but checked
semantic callers and failure cleanup remain implementation work, not an inferred
pass from new API signatures. Journal records exact identities, timings and gaps.

## Capture milestone on complete union60159efc

The source review of capture_work and its new continuation fixture remains the
2872820b delta; complete ROOTd3/A2dfcef histories are now joined. Native92focused
(including durable capture/pool targets)+12caller/query/resource/units/control/
capture-policy/type/parser/grammar-resource PASS. Current ASan+LSan92/12/query/
resource and ten92-case/query repetitions PASS. TSan is still running; independent
ROOT/D1 review and new20-case registration remain pending. Exact source/build,
profiling limits, artifact hashes and unrun next executable probe are in the
journal's union60159 entry. These receipts do not close unconverted typed entity/
metadata callers or the full integrated release gates. No A1 publication lease.

Current60159 TSan also PASS:92focused+12caller/query/resource24 and ten92-case/
query stress repetitions, no report, session5992 drained/container reaped.
Together with native/ASan/LSan this completes the bounded capture-transition
validation milestone. It does not complete the full lane, independent review,
unsupported/full-control instrumentation, or clean-bootstrap/browser/generation/
publication gates. ROOTdba metadata-result history remains a subsequent input.

## ROOT executable-query continuation checkpoint on c944

After the original A1 service stop, ROOT preserves its completed capture history
and unfinished executable fixture. `semantic_execution_work.tower` now reserves
and checks query/dependency/access/seal admission before attaching executable
metadata, distinguishes failed take from waiting, discards undispatched stages
before cancellation, and checks observed reads/completion before exposing ready
function input. Capture and executable phases share the unchanged cancellation
and provenance helper through `semantic_context.tower`; no public layout changes.

The new `semantic_executable_admission_checks.tower` is reviewed in full:
eight modes at two target widths and worker budgets cover healthy completion,
query/edge/access denial, take exhaustion, partial batch cleanup, observation and
finish failures, exact resource provenance, cancelled consumers, terminal replay
and final world/ledger cleanup. These budget variants alone are not overlap.
Native32 plus capture20/admission16/query/fullunits pass; supported address/leak
and thread modes each pass three repetitions of32+20 cases, query and real
three-unit/four-lane compilation. Fixed-path32 paired profiles preserve canonical
output and retained memory; costs and failed attempts are in the journal.

Executable component/dispatch/stage-publication failures, hold-before-last-view
discipline and other body/declaration paths still need their separate ownership
closures. The scoped query repair does not claim universal failure/race coverage
or final bootstrap/browser/generation/publication. Durable fixture registration
is routed to D1; no restarted or replacement A1 session.

## 2026-11-23 bounded late-flow follow-up

Reviewed main82b994886e99b0197a5eb2e38a313c36f4c8760c plus this scoped patch.
This supersedes the earlier flow readiness/transport findings only; it does not
close the full campaign audit or change another owner's scope.

| File | Storage, ownership and scheduling conclusion | Evidence / remaining limits |
| --- | --- | --- |
| `scaffolding/compiler/semantic_flow.tower` | Entire file and callers reviewed. Stable world-owned flow components, immutable canonical input view, derived source-ordinal index, private kernel fields and existing graph access claims. Idempotent request reserves graph operations before publishing metadata. Ready selection uses task identity, preserving results across waits; shared grants and dispatch join precede graph completion and source-ordered failure selection. No stages to publish. Lowering/evaluation/known publication/module initializers remain mandatory late-boundary prerequisites; only the final wrapper diagnoses cycles. | Focused 26-trial fixture, query-smoke and checked workers1/4 before/after pass; journal records exact inputs. No packed-payload, universal race-freedom or scaling claim. Existing structural/view/vector allocation assertions remain shared-owner work. |
| `scaffolding/tests/semantic_flow_checks.tower` | Entire new declaration-only fixture reviewed. It calls the production flow implementation, constructs canonical function/evaluation nodes with diagnostic provenance, and uses actual graph grants/states. Counts derive from the mode array and graph capacities. Tests retain input worlds through joins and verify graph/world cleanup. | 13 modes with budgets1/4: replay, waiting, reversed readiness, source errors, admission/finish failures, cancellation and cycles. Standard CMake registration and integrated instrumentation remain pending; exact standalone build/link receipt is in the journal/cache. |

## 2026-11-23 lifecycle transformation frontier follow-up

Reviewed afca69b171c790ce9386ae85c3f3d493d21cec59 plus this bounded patch. This
updates only the following files; earlier campaign gaps are not closed by it.

| File | Review, ownership/storage and scheduling disposition | Evidence / remaining limits |
| --- | --- | --- |
| `scaffolding/compiler/semantic_lifecycle.tower` | Whole orchestration reviewed; changes limited to the new transformation pump/wrapper and compile call. L2 initialization/admission preserved. Shared callback ABI mutates only on successful joined completion. Existing checking/hygiene/known-snapshot prerequisites remain. | Mixed frontier fixture, query/control smoke, LR overlap and exact serial/parallel canonical comparison pass. Outer known/evaluation/publication/module/flow barriers remain. |
| `scaffolding/compiler/semantic_lowering_work.tower` | Whole file reviewed. Per-function Body/AggregatePrepare/KnownSnapshot dependencies replace the blanket signature drain. Stable work components, private scratch/errors/stages, shared budget and existing dispatcher. Refresh body after its prelude producer publishes. Narrow aggregate read range matches own-return-metadata use. Retain errors until phase/source ordering permits selection; join all peers before stages/graph publication and cancellation. | Actual mixed-kernel rendezvous, waits, failure priority, cancellation and partial admission tested. Structural allocation assertions, phase-window joins and separate queued-stage hold work remain. No packed-storage or universal noalias/race claim. |
| `scaffolding/compiler/semantic_lowering_types.tower` | Entire new declaration-only module reviewed. Existing work layout moved unchanged; named phase enum records the two admitted query kinds. Result context is borrowed only through the dispatch join; vectors stay component-owned until cleanup. | Production and linked fixture compile with the public predecessor; context disposal releases retained results. |
| `scaffolding/compiler/semantic_aggregates.tower` | Entire signature/argument/result helper closure reviewed for mixed admission. Own result metadata is read after its preparation; call lowering uses checked expression types, not other functions' signature payloads. Only ownership comments changed here. Legacy single-phase callback path is retained. | Aggregate/callback staged program canonical output matches before/after and workers1/4; callback failed-entry behavior covered by new fixture. |
| `scaffolding/tests/semantic_lifecycle_frontier_checks.tower` | Entire new fixture reviewed. Production-provider linkage, function-owned probe components, explicit signal lifetimes and real kernels. Malformed depth/parameter data are named fixture inputs; dispatch bounds derive from function/query data. |10 trials pass, including two mixed-phase rendezvous trials, repeated waits, source/phase errors, cancellation, prelude refresh and cleanup. Standard harness registration and integrated instrumentation pending. |

## 2026-11-23 bounded lowering/executed-stage frontier

Reviewed main189e3927 plus this batch. Earlier full-campaign gaps remain open.

| File | Review, storage/ownership and scheduling disposition | Evidence / limits |
| --- | --- | --- |
| `scaffolding/compiler/semantic_phase_work.tower` | Entire new module reviewed. Root-owned WorkGraph joins index existing function entities; no duplicate AST, scheduler, registry or context layout. Signature/known-snapshot and per-owner lowering edges gate explicit stages; inferred execution waits for all canonical lowering. Existing tickets suspend/observe before dispatch; shared callback mutation occurs only after joined producers. | New natural ready-backlog and delayed-owner tests. Frozen ordinary function set required; joins remain serial publication points. |
| `scaffolding/compiler/semantic_lifecycle.tower` | Whole orchestration reviewed, L2 initialization/admission untouched. One mixed lowering frontier alternates with ready evaluation/dependency producers; only owning quiescence finalizes waits. Earlier lexical/proof and later attributes/known/module/flow prerequisites remain. | Focused fixtures/query/control, canonical comparison and small checked profile pass. No simultaneous lowering/evaluation kernels or universal concurrency claim. |
| `scaffolding/compiler/semantic_work_ids.tower` | Entire enum reviewed; append-only phase identities preserve existing IDs and window limits. World graph owns revision/profile/dispatch validity. | Production and tests compile through the pinned predecessor. |
| `scaffolding/compiler/semantic_evaluation_work.tower` | Registration/pump callers reviewed. Only late-phase prerequisite edges added before sealing non-clone preparation. Existing private buffers, leases, joins, L2 admission and A2 hold/cancel ownership preserved. | Existing query/control smoke and focused stage prerequisites pass. Legacy allocation/registration failure gaps remain. |
| `scaffolding/compiler/semantic_evaluation.tower` | Pump/failure/cleanup closure reviewed. Existing prepared tasks admit through checked late-phase suspend/observe. Any graph admission failure stops undispatched selected invocations. Retain source errors until lowering completes; no worker waits for producers. | Nested/lazy waits, stable interpreter state, cancellation, error ordering and terminal replay pass. Existing type/capture/executable producer ownership unchanged. |
| `scaffolding/tests/semantic_staging_frontier_checks.tower` | Entire new production-provider fixture reviewed. World-owned canonical input, actual graph gates, private invocation state; count derives from production window. No second evaluator or scheduler. Dispose after worker/ticket drain. |10 trials at budgets1/4; natural Ready backlog, waiting owner, inferred join, untaken branch, nested local effect, failures/cancellation. No sanitizer claim. |
| `scaffolding/tests/semantic_flow_checks.tower`, `scaffolding/tests/semantic_lifecycle_frontier_checks.tower` | Unchanged prior fixtures now registered in existing CMake harness with exactly one semantic provider. |26+10 trials, including actual mixed signature/lowering overlap, pass. Earlier registration gap closed; integrated instrumentation remains pending. |

No payload storage migration or allocation/locality speed claim. Full measurements,
failed experiments and exact remaining barriers are in the matching journal entry.

## 2026-11-23 inferred-stage scheduling follow-up

Reviewed b9f2c443 plus this batch; supersedes only the prior all-lowering
inference gate and its fixture expectations, not the full campaign acceptance.

| File | Ownership, storage and scheduling review | Evidence / remaining limits |
| --- | --- | --- |
| `scaffolding/compiler/semantic_phase_work.tower` | Entire helper reviewed. Existing world-owned joins and tickets; inferred stages now share the signature/own-owner gate with required stages. Their KnownProof/KnownClone prerequisites remain per subject. Full lowering join still controls diagnostic publication/completion, not inferred execution. | Real early Ready-backlog progress, own-owner wait, repeated waits, errors/cancellation. Shared signature and join/mutation barriers remain. |
| `scaffolding/compiler/semantic_evaluation.tower` | Request/start/pump/failure closure reviewed. Both policies reserve ROOT's existing executable metadata before dispatch. Reached calls request body/snapshot work through the same pump. Optional relocation, constructor/capture capability flags and known_producer role remain unchanged. L2 allocation admission, A2 stage transitions, ROOT producer preserved. | Inferred nested calls, module/local capture identities, optional fallback/required and resource errors, lazy calls, canonical equivalence. No new layout, allocator, scheduler or alternative IR. |
| `scaffolding/tests/semantic_staging_frontier_checks.tower` | Entire extended fixture reviewed. Canonical nodes and actual WorkGraph inputs, invocation-owned probe components, bounded shared worker budget; signal lifetimes end after joins. Counts follow the production window and modes. |20 trials: real evaluation rendezvous at4, early progress, known versus required captures including coincident offsets, suspended callee, optional fallback/source errors, untouched lazy dependencies and teardown. Budget width alone is not overlap. |
| `scaffolding/tests/semantic_resource_checks.tower` | Directly affected setup reviewed. Publish the existing checked IMFunctionInput in both policies so denial still targets executed nested frame growth. Ownership, budget injection, exact receipt and order assertions unchanged. | First stale-oracle failure preserved; corrected query-smoke passes at32/64-bit targets and workers1/4. This is targeted resource coverage, not threaded sanitization. |

Source evidence includes known_bindings before/after canonical equivalence,
module alias capture, invalid import-cycle diagnostics and aggregate/callback
identity. Journal records n1 wall/CPU/RSS and exact retained barriers. No packed
storage, universal alias/race freedom or integrated release completion claim.

## 2026-11-23 checked lowering/flow failure gate

Reviewed 294194a0 plus this bounded batch; previous full file audit remains.

| File | Ownership/storage/scheduling conclusion | Evidence and limits |
| --- | --- | --- |
| `scaffolding/compiler/semantic_lowering_work.tower` | Full registrar/frontier/cleanup closure reviewed. Checked graph and structural admission, lazy world-budgeted scratch, checked view/leases, published A2 joined transition. Source-owned resource errors cancel before retry; all query observations and completion capacity precede ready publication. Shared canonical payloads remain entity-owned; no packed-storage claim. | Real registered graph/kind/component/lease/anchor/scratch/finish denials at1/4, no successful prefix, preserved foreign lease, zero retained reservations. Shared L2 kernel/traversal allocations remain unchecked. |
| `scaffolding/compiler/semantic_flow.tower` | Whole file reviewed. World kind instance index is sufficient under pin; no duplicate query-plan allocation. Checked metadata/view/pool/work-vector paths preserve source order. Flow dependency collection reports a private typed failure; its immediate control consumers only return flow bits. |36 trials at1/4: pool/scratch/view/pin denials, graph pressure, ordered diagnostics, repeated waits, cancellation and exactly-once execution. Remaining assertions are registration/ordinal invariants. |
| `scaffolding/compiler/semantic_completion_work.tower` | Entire new helper reviewed. Existing graph-owned buffers only, with counts from actual consumer edges; no second queue or scheduler. Joined tickets validated before any successful completion. | Flow and lowering completion pressure proves no successful prefix or downstream dispatch; graph budget releases to zero. Conservative failure-scratch bound is edge count plus root. |
| `scaffolding/compiler/semantic_phase_work.tower` | Registration caller stops on typed failure before root joins; no change to inferred/required prerequisite edges. | Existing20 stage frontier trials and query-smoke. |
| `scaffolding/compiler/semantic_body_work.tower` | Immediate flow-request consumer and following joined peers reviewed. Preserve buffer transfers while skipping cancelled observations/finish and dependent metadata. | Focused query/control consumers; broader body admission/worker allocation assertions remain other-owned work. |
| `scaffolding/compiler/semantic_capture_work.tower` | Only immediate lowering lease call changed to typed denial. L2 constructor/metadata/proof admission unchanged. | Existing capture/lazy staging coverage; shared traversal scratch remains L2 work. |
| `scaffolding/tests/semantic_flow_checks.tower` | Full fixture extension reviewed: canonical production provider, synchronized world budget, actual pins/graph pressure; no test-only successful recovery. |36 trials, source offsets17/29/41, zero retention and terminal retry checks. |
| `scaffolding/tests/semantic_lifecycle_frontier_checks.tower` | Existing A2 hold fixture retained; new denial cases use actual registered lowering pump and private per-function effect probes. |30 trials including real overlap and18 denial trials; source offsets3/17/29, partial cleanup, no successful prefix. |

Measurements, retained failures, build identity and exact deferred checks are in
the corresponding journal entry. This closes coordinator admission paths, not
every shared semantic allocator or the compiler-wide release gate.

## A1 body/declaration admission follow-up, 2026-11-23

Reviewed fae7f9c6 plus this bounded batch; final integration identity is recorded
in the journal. The existing full file census above remains the lane audit.

| Reviewed path | Storage/world/scheduling and ownership conclusion | Evidence/disposition |
| --- | --- | --- |
| scaffolding/compiler/semantic_body_work.tower | Stable world component owns one lexical continuation; nullable checked pipeline/kind/work admission, graph claims/transitions and world-budgeted discovery/lease windows. Joined capacity and completion storage precede logical success; common wave helper drains/discards before closing views. Dispose includes components denied before window append. | 24 real body cases at workers1/4; query/control/overlap and canonical checks. Shared allocation/list/table internals remain L2; layout assertions preserved for B2. |
| scaffolding/compiler/semantic_declarations.tower | Checked metadata/request indices, discovery and type/expression pumps; graph takes distinguish denial from blocked readiness. Joined diagnostics retained per producer; final successful tickets wait until the whole metadata wave admits. Failure traversal does not cancel retained semantic outcomes. | 22 real declaration cases at workers1/4; source-only offset pins, partial takes, actual ledger pressure, cancellation/retry and zero retained owners. Shared scratch tables remain L2. |
| scaffolding/compiler/semantic_completion_work.tower | Thin checked graph/vector/resource adapters, no additional graph/scheduler or authoritative data. Canonical syntax/Foundation ownership; reserve graph's existing ready/failure scratch using real consumer edges. | Denied discovery/body/declaration completion leaves no successful check prefix; existing lowering/flow regressions retained. |
| scaffolding/compiler/semantic_statements.tower | Immediate nullable declaration-state/parameter-scope guards preserve lexical owner; no storage producer rewrite. | Control/query smoke, canonical execution; L2 shared allocations untouched. |
| scaffolding/compiler/semantic_iteration.tower | Synthetic lexical item stops on denied declaration metadata. | Existing control continuation regression; no protocol/scheduling change. |
| scaffolding/compiler/semantic_types.tower | Immediate declaration-state null guard; retained capture-error consumer already checks null. | Query/control smoke; type registry/layout untouched. |
| scaffolding/compiler/semantic_type_values.tower | Checked dependency-vector context and immediate failed-admission guard avoid interpreting denial as no prerequisite. | Query smoke required/optional and executed dependencies; no inference-policy change. |
| scaffolding/compiler/semantic_constructor_work.tower | Scan calls forward owning context for typed scratch-growth error; constructor producer unchanged. | Query smoke and smallest semantics target. |
| scaffolding/tests/semantic_body_admission_checks.tower | Focused Tower fixture links actual production providers. Opaque body component handles remain provider-owned; no parallel body structure or test-only success fallback. Source nodes and actual graph/world caps drive denials. | 46 trials, workers1/4, all teardown ledgers zero; terminal metadata/dispatch stability. |
| scaffolding/tests/semantic_lifecycle_frontier_checks.tower | Imports/calls new fixture in existing durable focused executable and query selector. Existing overlap probes unchanged. | Total flow/lifecycle/staging trials now132; actual rendezvous retained. |

Actual remaining unchecked shared-helper sites in this scope include sem_push
transfers/collectors in sem_body_publish/sem_body_collect/sem_body_sources and
sem_declaration_error/dependencies/constructed, plus sem_table/sem_state/sem_scope
used in lexical checking. Their underlying allocation and 25-file callers are
L2's active closure, not passed by these checks. Prepared syntax/identity and
completed-layout assertions remain structural contracts. This audit does not
claim whole-compiler allocator closure or universal race freedom.

Merged-boundary qualification: cb4bb586 plus complete upstream e116e966 was
merged as0866fa73. L2's shared scratch replacements, A2 physical accounting and
B2 layout reconciliation supersede the pending shared-helper list above. The
merged public-bootstrap semantics provider fails its component-memory limit;
a bounded generic-completion consolidation still fails. Final helper/lexical
edits are committed but unvalidated. The132 focused trials and profiles are
pre-merge evidence only. Shared statement/control sem_node wrappers still have
allocation assertions before some begin helpers can return. No whole-worker
allocator or integrated-release acceptance is claimed. See the journal blocker
and retained a1_body_build_merged/concrete.log; no main push or deployment.
