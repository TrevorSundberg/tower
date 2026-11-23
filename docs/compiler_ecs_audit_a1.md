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
