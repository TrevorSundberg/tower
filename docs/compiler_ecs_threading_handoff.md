# Compiler ECS, threading, and compile-time execution handoff

## Fixed completion ledger — published c20dc56 (2026-11-23)

Frozen source: **`c20dc56ac5344834a95e8de1f505abe9aea515ac`**; compiler tree
`42eb931b70b90c778ba1c4d0f92b1e0a1ea2ee63`. The original compiler goal is **not
accepted as complete**. Implementation, source review and executed acceptance
are separate below; there is no completion percentage. These twelve rows are
the fixed closeout scope, not an instruction to start another audit cycle.
Other workers' unpushed memory/body work is **in progress and excluded** from
this checkpoint. Later changes need affected owner receipts at final integration.

Publication reconciliation preserved subsequent main87a5da1, including ownership
and scratch changes with their own receipts. They are outside this review: an
open defect at c20 is not a claim that its later fix is absent or unvalidated.

Evidence references name frozen receipts in the [journal](temporal-opcode-research-journal.md),
[services](compiler-services.md) and [D1 composed-source review](compiler_ecs_audit_d1.md#frozen-integration-review-at-c20dc56-2026-11-23).
`ff6820e2` and this freeze have identical runtime sources/build configuration;
their only difference is the integration journal receipt. Thus B1's merged
focused checks cover this source, within their stated selection. Earlier
receipts retain their own identities and do not validate the whole union.

| Original scope | Implementation at this freeze | Exact evidence source | Remaining acceptance action / owner |
| --- | --- | --- | --- |
| Authoritative ECS / storage | World-owned entities, components, ordered/named relations and derived indexes implemented. Stable payload pages plus sparse lookup/archetype pointer columns; not packed payload SoA. | ec01291 finite51 adoption / 98d69cf; A2 storage receipts; D2 stable-page receipt frozen3bee18e2 plus recorded fixture hash. | Close declared storage/accounting omissions; assess locality, fragmentation and representative memory cost without inventing alias guarantees. A2 with production owners; ROOT acceptance. |
| Lazy decltype / comptime / dependencies | Ordinary interpreter, executable-readiness producers, shared demand/suspend/resume graph and owning-pipeline cycle detection implemented. B2 layout-frontier and executed-wrapper inference fixes present. | ROOT5b05d6bb dependency-units/query; B2 6081ceb4 and 0e9db271/5b16b584 focused regressions, canonical checks and type-smoke; D1 current source review. | Run affected combined staging/import/forward/untaken/capture/cycle/failure cases on final inputs. A1/L1/L2/B2 own remaining implementation; ROOT integrated acceptance. |
| Within-unit concurrency | Parser/semantic/body/lowering kernels, private scratch/stages and resumable continuations implemented; grammar/effects/interner/publication retain ordered contracts. | A1 cc2d4e6a mixed-kernel rendezvous; 3e9ba56 checked joined completion; earlier body/query receipts. | Finish in-progress body work, validate its final source and show useful overlap, serial cost, idle/critical path and scaling on representative units. A1/B1/L1/L2, ROOT. |
| Cross-unit / shared worker budget | Isolated unit worlds share outer/nested lane/byte admission and capacity wake/refill; workers without nested transport run inline. Cross-unit immutable import reuse is not implemented. | B2 baf2a5a0 refill/cancellation observer; ROOT5b05 dependency-units observed four threads/peak4; B1 ff6820e2 three-unit control peaks1/3 at workers1/4. | Final shared-budget/cancellation/output checks and profitable-core scaling/memory evidence. Import reuse remains a measured performance option, not a replacement for the goal. B2/ROOT. |
| Deterministic ordering / cancellation | Source-ordered joins, stale-ticket rejection, hold-before-unpin and drain-before-release contracts implemented. D2 sort restores the same rule/dot/range order before publication. | d9e1b348/1906afcd lr-order and native LR receipts; ff6820e2 canonical unit hash1173729914654460811; ec01291 stage/cancellation review. | Revalidate final-source deterministic errors, aliases, stale/cancel/failure lifetimes and canonical serial/parallel results. Passing selected schedules are not race-freedom proof. ROOT with owners. |
| Checked resource ownership | Checked components, stages, work buffers and new B1 provenance/formatter/session receipts implemented. Whole-world accounting is incomplete. | 4bc51044/ff6820e2 presentation-budget: diagnostic peak597595 bytes, zero grants after teardown; D2 6b04a149 entity-accounting cap failure. | **Confirmed open defect:** entity_create_result publishes a raw descriptor despite an exhausted store ledger. Finish A2 memory work and required raw-container/interpreter/output/foreign-boundary accounting and typed failure propagation; ROOT validates omissions/cleanup explicitly. |
| Source audit | ec01291 finite51 adopted; this bounded c20 review adopts the B1/B2/D2 composed closure. Three CTest registration gaps closed. | D1 98d69cf and d75a39ee; current path-specific receipts with exact blob comparisons; owner audits/roster retain earlier unchanged reviews. | At final freeze reconcile only later deltas against owner receipts. Execute registered structure-reuse/unit-admission/backend-ir on the final binaries; registration is not execution. ROOT/owners. |
| Measured serial / scaling / memory | Some useful overlap and bounded optimizations measured; original strong-serial/profitable-core goal **not met by current evidence**. | D2 d9e1b348 paired cold median2.05→1.93s (n3); B1 4bc51044 adjacent serial3.34→3.51s (n1, about5% slower); baf2a5a0 Deck large jobs4 slower than serial; B2 three-unit4096-body receipt4.642→2.372s with CPU/RSS growth. | Final comparable small/large body/parser/import/staging and C-like reference inputs, checked outputs, wall/CPU/RSS/allocations, serial and observed useful scaling, scheduler/idle/critical-path costs. Investigate excessive memory and regressions. D2/production owners/ROOT; no queue-width or cross-language superiority claim. |
| Current supported sanitizers | Supported Linux x64 LLVM19 address/leak and thread instrumentation exists; no complete c20 source pass. | ROOT b83eeca7 receipt on5c5a308c; B1 ac65b3e9 focused address/thread and real-overlap receipts. These precede the new presentation/layout/inference union. | Run applicable final-source ASan/LSan/TSan and targeted stress with instrumented identities. Source-language UBSan and Windows/macOS/browser sanitizers remain unsupported, explicitly reported. Serial allocation faults do not sanitize threading. ROOT. |
| Whole-generation / public bootstrap | Public predecessor remains pinned; successor prerequisites repaired. Actual generation2 semantics object now compiles. Whole-generation closure remains pending. | B2 6081ceb4 saved-before abort134/fixed frontend_units; 0e9db271 actual semantics target pass and development verifier; public executable9653f8187a104ca84ab5d8601f336d7e1ed8200206544c70a81415018d623d02. | Clean canonical Linux x64 Docker/no-override build; complete generations2/3, all object/executable/resource comparisons and lineage. Earlier predecessor/successor object mismatch is not waived by partial success. B2/ROOT. |
| Normal / shared / browser generations | Portable normal/shared paths exist with earlier scoped WASI/browser receipts; this union has no complete platform/generation receipt. | L1 shared-Wasm/browser journal receipt on b9f2c443, manifestec2a16a85c5b083a8b103514a2d504cdceaae7838c7a4b9a769c0e0efaedd1db; existing playground checks; B2 generation receipts above. | Build actual normal/shared/LLVM/cross closures, both browser compiler generations, mandatory threads reactor (TOWER_REQUIRE_THREADS=1), IDE, cancellation, errors and real host behavior. Keep unsupported targets explicit. L1/ROOT. |
| Final atomic hosted release | No hosted release of this frozen compiler is established. Historical Pages/assets stay provenance-only. | Last handoff receipt: Pages6f142bef, manifesteb70f5388bee6b7ca318583eddfaa8e9a8a907c642a14a6fde85375ac8b1643c, build source98ade8cc. This is not a fresh remote check. | After integrated gates, preserve newer assets/receipts/CNAME, require reachable source/build commits, atomic normal main+gh-pages push, workflow plus exact served manifest/assets and applicable hosted behavior. ROOT only. |

The earlier 300s frontend run remains a failed deadline. ROOT's separate full
suite at5b05d6bb passed in328.14s under a declared900s deadline; it neither passes
the old limit nor validates c20's later changes. B1's historical “timeout open”
wording must be read with that receipt. This review ran no builds, runtime tests,
profiles or sanitizers; documentation-only profiling is inapplicable.

## Historical checkpoint and receipts (superseded for current status)

Everything below retains its original source/evidence boundary. The fixed ledger
above supersedes its current-status and remaining-work wording, including the
formerly unbudgeted B1 text/splice paths and the now-repaired inference blocker.

Historical source review: **2026-11-23**, frozen published main
**`b83eeca71edbe3770e7b576692a5702cb3ff42fa`** (published origin/main).
Compiler tree `ba5457d083698335be45801b65bf7f282298d574`; scaffolding tree
`32581bcb8ba150a0038e81e44513f9f4de827310`; CMake tree
`6d3db921295697f16f936f2278d7fb3bb3748c6b`. This final boundary incorporates
the complete Fast/staging/sanitizer history received during publication; it
supersedes the initial `68f89640` draft. Later merges do not silently move
this review's boundary. This documentation review ran no compiler or runtime
tests. The old completion percentage is retired; there is no measured percentage
or ETA for the remaining gates.

**Executable helpers and type staging are implemented.** Production
`semantic_execution_work.tower::sem_executable_request/sem_executables_pump`
publish function-owned `IMFunctionInput` through the `executable_ready` kind after
body/lowering dependencies complete; `executable_functions` holds the producer
work components. `semantic_type_execution.tower` and
`semantic_constructor_work.tower` consume the ordinary interpreter's executed
requests. The former `IMCallInput` experiment and rejected producer below are
historical, not missing production capabilities. See [type values](type-values.md),
[computed type arguments](computed-type-arguments.md), [services](compiler-services.md)
and the scoped [journal receipts](temporal-opcode-research-journal.md).

## Historical implemented contracts and evidence boundary

### Shared entities, storage, and ownership

Syntax, parse metadata, Foundation operations, and semantic metadata use
world-owned entities/components: `world.tower`, `library/entities.tower`,
`entity_types.tower` and `entity_stage.tower` retain the
authoritative graph and ordered/named owning relationships. Stable component
pages and sparse identity lookup coexist with dense archetype row/pointer
columns and contiguous work buffers. These indexes are not packed payload SoA;
parser tables, interpreter caches and query indexes remain derived state.
Stable addresses help leased workers but can retain fragmented pages. A2's
page-churn receipts demonstrate free-slot reuse, not universal locality or a
whole-compiler memory bound. Raw node/index and stage-vector accounting remains
open below. Neither converting every traversal to a query nor adding `noalias`
without proof is a completion criterion.

Workers receive immutable published inputs and own their scratch, diagnostics,
interpreter state, and staged output. Structural writes and shared-index changes
publish after joins. Views pin input lifetimes; leases/access declarations govern
mutation. A pinned view is not a payload lock. Generic clone batches retain their
existing memory budget and acquire queued stage ownership before the last input
view closes. Explicit `frontend_units` worlds, module environments,
`execution_session` and backend source owners now exist; legacy `host_world`,
document/completion adapters and `host/llvm_worker` remain boundary contracts,
not permission to share a default world between workers. The latter retains its
latest request until reuse/VM retirement and has no Tower close export.

### Queries and worker execution

`library/work_graph.tower` provides demand, dependency edges, suspension,
resumption, cycle discovery, access ranges, cancellation, and stale
revision/profile/dispatch-ticket rejection. Declaration, expression, array/type
construction, layout, body checking, lowering, flow, known-value analysis, and
evaluation have worker/query paths. Parser table construction has parallel
subsystems too. Native CLI unit compilation uses the production unit services,
with isolated frontend worlds and backend contexts.

`SemanticPumpResult` distinguishes progress, waiting, completion, and failure.
A phase with no ready task can yield to another producer without inventing a
cycle. Body continuations retain lexical state and structural preparation state;
they do not replay checked statements when a dependency completes. Bounded
source windows are independent of worker count and can admit later producers
while an earlier body waits.

The lifecycle now interleaves AggregatePrepare and Lowering through
`sem_lifecycle_lowering_pump`/`sem_lower_pipeline_pump`: each function waits on
its own Body/KnownSnapshot/signature producers. A1's `cc2d4e6a` receipt includes
two real mixed-kernel rendezvous trials in `semantic_lifecycle_frontier_checks`.
B2's `baf2a5a0` unit-admission receipt observes distinct live threads and outer
refill after nested lane release (80,877 ns); its backend trace starts one LLVM
job while another frontend remains live. These are observed overlap at their
recorded sources, not current-release scaling results. `frontend_units_step`,
`work_budget_set_wake` and `work_pool_receive_event` share admission/wakeups;
an empty nested grant executes inline. Requested workers or pool occupancy
alone prove neither overlap nor useful speedup.

A1 `7cea85cf` additionally replaces the blanket lowering-before-evaluation drain
with `sem_lifecycle_queries_pump` and root-owned `semantic_phase_work` joins.
At that checkpoint explicit stages waited on signature publication and their
owner's lowering; inferred execution still waited for all canonical lowering.
Pumps alternate after joins, so this establishes resumable admission while unrelated lowering remains
ready, **not simultaneous lowering/evaluation kernels**. Merged `b235f2f4`
passes 46 focused flow/lifecycle/staging trials, query smoke and checked workers1/4
execution/canonical reparse. All three fixtures now have supported CMake targets.
L1 `908515e4` also charges the Fast descriptor, all 15 arrays and lexical scratch
to their owning budget; final merged core evidence is `127cfa00`, not a new
whole-union instrumentation pass.

A1 `d9112a01` removes that inferred execution barrier: both policies request
reached calls through the existing executable snapshots and depend on their own
owner's lowering and shared signature publication. Inferred work retains its
known proof/clone receipts. Optional capture/effect capabilities and runtime fallback remain
unchanged. The extended staging fixture covers actual parallel evaluations while
unrelated lowering stays Ready, suspended inferred calls, distinct required/known
capture producers and lazy branches. Its input-specific 56-case/query/control
and canonical receipts do not replace integrated sanitizer or release gates.
Full lowering still precedes visible evaluation diagnostics; joined phase windows
still protect alias, reference and structural publication.

Remaining lifecycle boundaries are checking, foreign-signature validation,
defer hygiene, known-write/order proof and snapshots, joined transformation and
evaluation windows with explicit phase edges, attributes, known publication, module initialization and late
flow. Grammar activation, effects, interning and callback/publication mutation
have ordered contracts. Remove a boundary only after proving narrower dependency
and publication ownership and measuring useful work; the remaining phase calls
alone are not evidence of a scheduler bug. Cycles belong to the owning pipeline's
quiescent wrapper, not an individual waiting pump.

### `decltype`, staging, and inferred values

Unevaluated type queries and computed integer type arguments use the shared
semantic model. Lazy lexical proof jobs are requested only when a type expression
needs a local binding; they are not an eager scan of every function. Facts attach
to the original declaration identity. Lexical shadowing, writes, address escapes,
deferred writes, and loop updates participate in the proof.

Immutability and known value are independent facts. Eligible captured initializers
become ordinary interpreter jobs. Executed reads demand their producers; merely
mentioning a capture in an untaken branch does not force its value or create a
cycle. `semantic_source_bindings.tower` resolves module aliases and lexical
declarations; `semantic_capture_work.tower` retains the owning declaration/frame.
`semantic_lifecycle_checks` covers two aliases of one imported capture, writes,
escapes, early initialization, untaken mutable/forward reads and nested stages.
Conservative rejection of an unproved extension statement or runtime-storage
capture is a supported limit, not permission to infer knownness from spelling.
Nested explicit stage expressions retain the same behavior. Snapshot
receipts protect inferred initializers before runtime lowering changes them.

No pre-LLVM arithmetic folding implementation was introduced. Known-value
execution uses the ordinary Tower interpreter and its target/semantic contract.
This remains a hard requirement for future inference and specialization.

### Ordering, failure and ownership

Graph revision/profile/dispatch tickets and read/write ranges precede dispatch;
worker scratch, diagnostics, interpreter state and output stages remain private.
Source/phase ordering selects diagnostics after joins, including failed peers.
`work_order.tower`'s portable stale-revision/profile fixture is unchanged from
`be0d123bb`; that is source-specific evidence, not a new current run.
A2 `0aee8b07` and ROOT `d56c2903` supersede the queued-provenance gap:
`entity_stage_hold_result` checks the pending suffix atomically (duplicates
included); cancellable unheld fields clear before finalization. Generic and
executable pumps hold or discard before the last input view closes, and publish
before later structural mutation. Unit/backend cancellation drains workers before
world/view disposal. Remaining unchecked callers are listed separately below;
passing these fixtures is not universal race freedom.

## Historical completion gates at b83eeca7

### Blocking implementation and contract closures

These are source-confirmed gaps, not new failure-injection results. Each owner
must either close the listed boundary or document a justified supported limit;
do not reopen helper readiness, module captures or the completed hold protocol.
Paths below are relative to `scaffolding/`.

| Gate / owner | Precise remaining boundary and acceptance action |
| --- | --- |
| Checked semantic failure paths — L2 shared helpers, B1 diagnostics | A1 lowering/flow coordinator admission now uses checked graph/kind/component/lease/view/pool/work-vector paths and the published joined-stage helper. Completion reserves queue growth before any successful ticket; registered denial fixtures verify offsets, no ready prefix, drained ownership and terminal retries. See `compiler_ecs_audit_a1.md`. ROOT196d93c7 checks executable aggregate-signature component admission. Shared `sem_control_names`, `sem_known_edges`, private lowering node/text/list helpers and `sem_restore_error` still contain fatal allocation wrappers; these are not covered by the coordinator gate. Retained pump assertions enforce component/ordinal/lifetime invariants, not allocation admission. |
| Physical ownership accounting — A2; L1 execution; B1/B2 presentation/host | `library/entities.tower::entity_create_result` allocates raw `Entity` storage outside `store.budget`; node/index storage and `entity_stage.tower` node/reference/cancellation/lease vectors remain outside the charged component-page owners. Fast arrays are now checked work vectors; the remaining L1 boundaries include `compiler/interpreter_context.tower` error/output vectors and `bytecode_package.tower::bytecode_encode`'s raw package allocation. `syntax_provenance` splice scratch and shared formatter/final diagnostic text remain ordinary allocations. Missing contract: complete declared ownership/peak accounting and typed failure at required compiler boundaries, with rollback and zero retained grants; the unit retained-byte cap explicitly excludes these heaps and LLVM. Owner-specific source review must delimit coverage rather than call that cap a process limit. |

Cross-unit shared import/revision reuse is **not implemented** by independent
unit worlds. It is a performance option with an outstanding immutable
world/Bedrock/import/profile/provenance identity contract, not a correctness
prerequisite for the existing isolated-unit API. Likewise the remaining
source-defined primitive operation protocol and constructor compatibility forms
in [type values](type-values.md) are separate language milestones; they do not
mean executed type constructors are absent. Stronghold safety/initialization,
fixed vectors and optional backend ambitions are outside these compiler gates.

### Measured cost and pending acceptance

| Gate / owner | Existing evidence and exact remaining work |
| --- | --- |
| Representative serial/scaling cost — B1/B2/A1, D2 measurements, ROOT final | D2's frozen `baf2a5a0` Linux/LLVM19 Deck comparison uses matched generated 16/1000-function Tower/C bodies, outputs 15/999, optimized object output, warm filesystem/fresh processes, one warmup each, small n=3 and large n=1. Tower wall/CPU/peak RSS: 2.26/2.22 s/183,576 KiB small medians, 2.44/2.41/212,312 large; Clang .04/.03/97,536 and .16/.15/108,196. Large Tower jobs4 on two admitted CPUs costs 3.28/3.65/224,544, with identical object/output and no measured useful speedup. Parse/check accounts for about 86% of Tower's internal time; these timers do not split parsing from semantics. Link/startup are separately recorded in the journal, not hidden in those object times. Repeat affected small/large body/parser/import/staging costs on the final source, record real overlap, CPU/idle/critical path and memory, and investigate regressions. This is a specific workload gap, not a language ranking. |
| Actionable frontend cost — B1 with B2 cache ownership | B1 `f2f12e5b` measures one ordinary answer42 request: 185 lookups, 155 version builds, 159 tables. Fresh-session construction 1004.855 ms includes table work 930.539 ms; lookup .513 ms (warm filesystem, n=1). Installed baselines retain the same request counts. The merged `00d3f856` check retains those counts and canonical output at 1.05 wall/1.00 CPU s/165,596 KiB; neither receipt covers this later Fast/staging union. Largest identified subcost is repeated LR construction through `syntax_session_declare -> syntax_version_cached/build -> parser_table_open_result`. Establish which versions are equivalent and separate per-version userdata/emission/provenance before reuse. Counts do not prove avoidable misses. Historical full-frontend 300 s/124 timeout remains unresolved; this approximately 1 s request does not reproduce it. Isolate its named request/phase rather than claim it fixed or silently extend a deadline. |
| Integrated behavior and instruments — ROOT, D1 | Earlier query/type/control/storage/units fixtures cover captures, executed dependencies, aliases, canonical round trips, failures and real worker overlap at the journal's distinct sources. No one receipt covers this entire frozen union. Confirm combined lazy staging/imported-unit/forward/untaken coverage through the existing unit observer; independent outer jobs are not a cross-file declaration-query cache. ROOT's `b83eeca7` receipt now records **passing** Linux x64 LLVM19 address/leak and thread ownership checks on frozen `5c5a308c`: work, concurrent stages, query, unit-admission and 44 executable-admission trials per mode. LR hashes are address `2034ada65cc7f0b8739762c99f9f1dfde06d7cf6af9b48d4c3f23f68bd37705d`, thread `d67356813bea8f06cd32245a7f3bed8208282e07cf96f767857a3b796e4fcfbd`. The original Docker TSan startup failure remains failed; identical binaries passed with the documented per-container seccomp accommodation. Later B1 grammar, L1 Fast and A1 staging inputs are explicitly excluded. Source-language UBSan and Windows/macOS/browser sanitizers are unsupported. The documented negative probe has a known missing buffer-provider link; preserve its earlier sensitivity receipts and ROOT's instruction not to rerun it. Serial allocator faults do not sanitize threaded work. |
| Public bootstrap, providers and portable execution — ROOT, D2 policy | Current predecessor manifest SHA256 `cf7d84b11d025c708310827c56f3071fa69e36b010ea50dd992855ecc438e896`, executable `9653f8187a104ca84ab5d8601f336d7e1ed8200206544c70a81415018d623d02`, remains unchanged. Its complete resources are usable bootstrap inputs, not the new compiler. Finish one clean canonical Linux x64 Docker/no-override build and predecessor/successor checks on frozen inputs. Rebuild the affected dependency closure and collect actual native/WASI consumer/provider/export identities; exact generic/module/diagnostic policy fixes do not establish new WASI reports. Current shared prelude/layout changes prevent reusing old complete compiler objects merely because entry files are unchanged. Implemented portable code and target-policy strings are not Windows runtime acceptance. |
| Browser, generations and deployment — ROOT | Pages ref remains `6f142bef15f58380831ed344ab5eac5c4b3c2840`; its recorded manifest `eb70f5388bee6b7ca318583eddfaa8e9a8a907c642a14a6fde85375ac8b1643c` builds from `98ade8cc`, not this compiler. Old runtime assets/receipts stay historical. Re-export current project/actual link recipe, build normal/threads/LLVM/cross Tower closures, run mandatory thread/IDE/worker cancellation and deterministic-error checks, both compiler generations, local deployment and exact hosted assets/desktop/mobile behavior. Reuse unchanged vendor/UI assets only with matching inputs; preserve CNAME and newer receipts. Source/build must be reachable from published main and final main+Pages pushed atomically. No current browser/generation/hosted pass is asserted here. |

B2's earlier bounded cost receipt supplies a complementary large-unit observation:
three units, 4096 bodies in the last, warm filesystem/fresh processes, n=1 on its
Linux x64 LLVM19 host. After the wake fix, budgets1/4 take 4.642/2.372 s wall,
4.534/5.572 s CPU and 679,528/941,284 KiB peak RSS, with equal canonical output.
Observed outer peaks are1/3 and shared lane peaks1/4. This is useful work at a
recorded source/host with a memory tradeoff, not a statistical scaling result or
evidence for the newer Deck compiler. Full timing, allocation/retention and host
identities remain in the journal's B2 nested-lane receipt.

Use the existing commands in [D2's publication-readiness checklist](compiler_ecs_audit_d2.md#bounded-publication-readiness-review-2026-11-23),
[sanitizer checks](compiler_sanitizer_checks.md#shared-build-entry) and
[playground checks](../playground/README.md#checks), with the **new frozen input
identity**, not the earlier checklist's cached objects. In particular,
`TOWER_REQUIRE_THREADS=1` must make the separate test reactor mandatory;
use distinct `-DTOWER_SANITIZER=address`/`thread` native caches and record actual
instrumented object/link and execution identities. No broad matrix was run for
this documentation change; runtime profiling is inapplicable.
The new `tower-semantic-staging-smoke` target builds the three registered
frontier executables; it does not run them. Their existing CTest selection is
`ctest --test-dir "$TOWER_NATIVE_BUILD" --output-on-failure -R '^tower-semantic-(flow|lifecycle-frontier|staging-frontier)-tests$'`.

### Full-file inventory ownership and review freshness

The current finite adoption checkpoint is published main
ec01291eaf8706c29f3bec62ec85a2e7561530d4. ROOT delegated independent review of the
entire51-path union to D1, whose [path/blob receipts](compiler_ecs_audit_d1.md#delegated-finite-source-adoption-at-ec01291-2026-11-23)
close all26 earlier freshness actions and33 later deltas (eight overlaps),
including all15 later D1 fixtures and the three composed semantic/frontend
exceptions. Zero substantive adoption actions remain in that frozen set. The
[roster closure](compiler_ecs_file_roster.md#finite-review-closure-at-published-ec01291-2026-11-23)
retains exact1146 ownership coverage: A1 45, A2 43, B1 102, B2 277, L1 26,
L2 17, D1 551, D2 85. Unchanged reviews and matching B1 wrapper receipts remain
reusable; later compiler changes need their own receipts at final integration.

This closes source adoption, not runtime acceptance. The demonstrated raw Entity
allocation bypass of a fully consumed store ledger remains an A2 accounting
defect: the existing entity_accounting cap target fails nonzero after cleanup.
The three registration gaps are now closed by CTest names
`tower-frontend-structure-reuse`, `tower-native-unit-admission` and
`tower-native-backend-ir`, using existing binaries/selectors and resources.
Configuration/discovery and dependency wiring are checked; execution on the final
merged compiler remains pending ROOT's integrated milestone. Earlier explicit
selector passes retain their source identities. Existing assertions,
raw-storage omissions and integrated instrument/bootstrap/browser/generation/
deployment limits remain explicit. This docs-only review ran no builds or
runtime profiles; ROOT retains final integrated validation and publication.

The following records the prior5b05/36ad reconciliation history, superseded only
for source-adoption status by the ec01291 receipt above:

Frozen published source `5b05d6bb5288591794d378c1802c2a790357b204` contains
**1,144 tracked `.tower` paths**. ROOT assigned the bounded reconciliation to D1.
The [current roster](compiler_ecs_file_roster.md#frozen-adoption-reconciliation-at-5b05d6bb-2026-11-23)
proves exact ownership-set equality: baseline1011 +147 additions -14 retirements,
with13 additions after b042 and no further retirements. Inventory counts are
A1 45, A2 43, B1 102, B2 276, L1 26, L2 17, D1 550 and D2 85.

D1's current path-specific review covers the32 new/changed fixtures since its
last complete540-path audit;518 unchanged reviews are reused. The grammar/generic
result omissions are closed, including the current756-line generic-result file.
All three B2 parser-module wrappers match B1's original reviewed blobs and are
explicitly adopted into B2's inventory. Thirteen additional matching production
handoff receipts are adopted with their domain ownership and limitations intact.

The roster lists **26 exact remaining production source-review actions**; no
blanket current-source approval follows from the census. Three merged files
differ from their latest non-merge implementation receipts, so source hashes,
not last-commit labels, govern adoption. D1 also records that structure-reuse and
unit-admission require explicit focused invocation: default/units/backend CTest
commands do not reach those cases. ROOT's separate focused runtime receipts are
preserved; this documentation batch ran no compiler tests or profiles.

Historical journal material and D2's45 pinned resource rows remain provenance-only.
The unchanged public resources must not be edited or treated as current compiler
acceptance. ROOT retains integrated instrumentation/bootstrap/browser/generation
and hosted-release ownership; those gates remain separate and pending.

Publication reconciliation later merged36ad337 without changing this substantive
freeze. Its inventory is1146 (B2277/D1551); the roster separately enumerates its
two additions and28 modifications, including13 D1 deltas pending adoption. Those
later inputs do not inherit the5b05 source or runtime receipts.

Audit principles: [Flecs systems](https://www.flecs.dev/flecs/Systems.html)
and [storage traits](https://www.flecs.dev/flecs/ComponentTraits.html) motivate
explicit access, staged publication and deliberate stable/sparse storage;
[Burst aliasing](https://docs.unity3d.com/Packages/com.unity.burst@1.8/manual/aliasing.html)
requires actual alias information before optimization. These principles supply
neither Tower implementation credit nor performance measurements.

## Historical November 22 helper experiment (superseded)

The numbered experiment below predates production executable readiness. Its
failed budget/build attempts and proposed APIs are retained as history; it is
**not the current remaining-work list**. Production uses `IMFunctionInput`,
not the experimental `IMCallInput`. The current gates above supersede it.

At that checkpoint, the proposed sequence was:

### 1. Remove the bootstrap unit-size bottleneck

The checked-in predecessor currently allows 128 MiB of Foundation semantic
components. This is a resource policy, not total process memory or a language
limit. The attempted helper producer pushed `compiler/units/semantics_checks.tower`
past that policy. Initial failure appeared in `tests/semantic_world.tower`; after
moving the new interpreter-only fixture, it appeared in generated vector code.
The location is where the allowance runs out, not proof of a bug in that function.

Moving an implementation to another file does not partition its transitive import
closure. Importing the same semantic implementation into two object units also
duplicates exported definitions; that failure already occurred earlier in this
chain. Audit the object and browser compiler-project manifests before splitting.

Prefer a genuine boundary between production semantic code and test construction,
or another existing unit boundary with a narrow exported interface. Keep shared
types in one authoritative Tower definition; do not copy `SemanticContext` or
component layouts into a test ABI. Retain meaningful scheduler coverage. The
interpreter-only fixture separation in this checkpoint is a useful small step,
but did not by itself make the experimental producer fit.

If a larger-budget successor is actually needed, build it using the public
predecessor and publish its complete executable/resources with hashes/provenance
through the documented bootstrap path before relying on it. Then repeat a clean
build without a private bootstrap override. A local cache binary is insufficient.
Do not silently alter tests to use a private compiler.

### 2. Add a function-owned executable-readiness query

The intended dependency path is:

```text
integer type argument
  -> ordinary evaluation (suspends at an executed call)
  -> staged executable snapshot of the called function
  -> checked body
  -> signature / lexical expression / layout / other value queries
```

Use a component on the original function entity for the work ticket, stage,
source ordinal, snapshot handle, diagnostic, query-read log, and evaluation
aliases. Register its readiness in `IMCallInput`. The graph owns scheduling;
the component owns continuation/result state. Do not add another semantic graph.

The consumer may request a Body identity before body admission. Admission must
attach the producer to that existing Building query instead of treating every
existing query as completed work. Request only bodies needed by executed calls
for early stages; an untaken branch must not acquire an evaluation dependency.
Keep ordinary runtime reachability requirements distinct from early staged demand.

### 3. Prepare a canonical executable snapshot

Preserve the checked source body for later binding proofs and runtime lowering.
Clone its ordinary Foundation nodes into a worker-owned stage, remap parameter
and local declaration identities, assign independent frame slots, and invoke the
existing aggregate, expression, and defer lowering. Publish all stages after
joining, then publish call-input readiness. Query/read observations and nested
evaluation aliases publish on the coordinator too.

The attempted implementation used `sem_defer_clone`, a shared clone map, ordinary
aggregate metadata, `sem_lift_block`, and `sem_defer_depth`. Reuse is plausible,
but this combination was **not executed successfully**. Verify that every helper
is valid before the normal lowering phase and only mutates the private snapshot.
Do not assume existing phase-local helpers are safe at an earlier lifecycle point.

Particular care is needed for aggregate parameters/returns and indirect function
calls. The source function identity/signature must remain suitable for type and
function-reference checks while execution selects the lowered snapshot. Do not
rewrite shared callback/type metadata on a worker. A derived executable snapshot
is allowed; an independent public IR or instruction ABI is not.

### 4. Interleave producers through the pumps

When declaration/evaluation work waits on a body, service ready body, binding
proof, layout, and executable-preparation work on the same graph. Preserve the
caller's declaration-subject list, `declaration_isolated`, lexical ownership,
and any early-demand policy across each pump. A pump must return with no active
worker borrow. Avoid recursive phase draining and worker-blocking waits.

Do not simply delete whole-body/proof/lowering prerequisites. Replace each with
a narrower readiness proof that protects the data actually read. Likewise,
guarding every `sem_layout_all` call with an early-mode flag is insufficient:
layout admission must wait for field declarations, and `layout_checked` must not
skip pending types. Existing helpers can diagnose cycles prematurely when called
outside the phase in which they were designed.

Retain failed body diagnostics on the producing receipt until the owning consumer
selects them in source order. The attempted integration could let an early helper
error escape through the coordinator's program error, or lose it when body work
was cleared. Extend dependency-failure traversal and cleanup deliberately.

Finally, separate early demand from normal body completion/pruning. Restarting a
completed admission cursor must not recheck completed functions. Normal checking
must still visit required non-generic bodies and collect root operations added
after early staging. Do not prune a signature-only instance before a later
executed dependency can demand it.

### 5. Validate this feature at its actual boundaries

Use the existing Tower fixtures and focused runners. Add coverage for:

- A callee unavailable across repeated interpreter attempts; argument mutation
  occurs exactly once. The primitive fixture in this checkpoint covers this.
- A distinct published snapshot and failed publication (primitive fixture), plus
  an indirect callee through the production producer once implemented.
- Nested helper calls and mutable local computation inside the staged invocation.
- An immutable captured initializer that calls a helper and feeds an array extent.
- Generic helpers and aggregate arguments/returns using the ordinary ABI lowering.
- A helper that needs a local type query/proof/layout before its body can finish.
- A true body/type/value cycle; a noncyclic unfinished producer; an untaken branch
  containing an unsupported call or invalid capture.
- Cancellation while waiting, discarded/published stage ownership, and cleanup
  of interpreter frames, aliases, diagnostics, and input views.
- Canonical output and source-ordered diagnostics at 1/2/4/8 workers, both target
  pointer widths, and real overlap. Queue width alone is not overlap evidence.

For the future end-to-end fixture, the attempted cases included
`u8[combine(increment(&count), increment(&count))]` inside an ordinary helper,
`u8[identity(i32, 3)]`, an aggregate extent helper, and an indirect callback.
Those cases were removed from the passing suite with the unvalidated integration;
they are acceptance ideas, not current supported syntax/behavior claims.

## Disposition of the former numbered remaining chain

1. **Module captures:** implemented with initialization/effect and alias proofs;
   current-source integrated acceptance is separate from those older fixtures.
2. **Lifecycle integration:** mixed aggregate/lowering frontier implemented;
   retain justified ordered boundaries and close the specific failure callers above.
3. **Explicit ownership:** production world/session APIs and checked startup are
   implemented; legacy VM lifetime and uncharged/fatal allocation boundaries are
   explicitly scoped above and in services, not an unperformed blanket audit.
4. **Shared imports/revisions:** isolated worlds are supported; broader immutable
   cache reuse remains a measured optimization candidate requiring a complete key.
5. **Scaling:** bounded observations now exist, including useful overlap and a
   slower Deck jobs4 control. The final representative cost/critical-path gate
   remains open; queue width cannot close it.

Ordered grammar changes, effects, type interning, and short publication sections
can legitimately remain serialized. Completion means independent eligible work
can run safely, dependencies are explicit and resumable, and results are
deterministic—not that every loop runs on multiple threads.

## Development and publication instructions

- Work on `main`; pull/rebase before work and after committing. Preserve others'
  changes. Do not edit `todo.txt` or introduce new C++/Python/JavaScript logic.
- Freeze the compiler import closure while a build or compiler-project package
  is reading it. Reap a failed build before editing/restarting. Concurrent Ninja
  processes in one cache and truncating their shared log obscure failures.
- Compile the smallest changed Tower unit first. Use `query-smoke` for scheduler
  continuations, `type-smoke` for type/query changes, and `control-smoke` for
  lexical control changes. Reuse passing unaffected evidence.
- Run the complete public-bootstrap/native/browser/generation publication checks
  once per coherent milestone. Do not repeatedly restart them for each handler.
  Follow [AGENTS.md](../AGENTS.md#validation-and-performance) for profiling and
  final supported memory/race sanitization; the 2026-11-22 policy audit supersedes
  this handoff's former sanitizer prohibition. No repository-wide formatting or
  broad cleanup sweeps.
- Keep runtime build identity distinct from documentation publication identity.
  Documentation-only deploys reuse verified assets. Preserve concurrent manifest
  receipts; if a newer manifest appears, compare assets/build identity before
  adopting it. Do not call an exact-manifest mismatch a passing verification.
- Publish and verify the hosted result, then leave a clean tree and update this
  report/journal with the actual source/deployment identities and test outcomes.

The November 22 development cache was container-local at
`/tmp/tower-home/.cache/tower/ecs-local-query-new-pin` in `tower-parser-retirement`;
it is historical evidence, not a current shared build location.
`cmake --build` does not copy the executable into `build/native`; the documented
`playground/scripts/build-native.sh` does. Do not infer a current `build/native`
binary from a successful cache build. The public Linux x64 bootstrap is a
platform-specific development bootstrap, not a portable compiler release.

## Future direction that must not expand this checkpoint

Stronghold should eventually enforce ownership/access and initialization policy
over the shared nodes and ECS contracts. Tower retains explicit low-level options;
do not impose universal safe-handle overhead now. Safe handles, pinned views,
borrow scopes, and non-ECS owned allocation need a separately specified memory
model. Null-only race behavior does not by itself prove memory safety.

Compile-time parser/regex tables and ordinary interpreter-produced constants are
motivating future workloads. LLVM can optimize known data and inline eligible
code, but constant tables do not make the input stream known, guarantee full
loop unrolling, or guarantee the fastest possible DFA. Preserve that distinction.
Explicit compile-time code generation may coexist with inferred staging, with
portable interpretation and explicit effects/target/cache identities. Do not
introduce a separate pre-LLVM folding evaluator to chase that goal.

## Validation and publication receipt

The previous local-capture release `ecc4333` passed the public-bootstrap native
build and successor proof-unit compilation, native type/query checks, all three
real-browser worker checks, and two identical edited browser compiler generations.
Its native SHA-256 is
`7343162d925e0abe9a1449f5cf42028e84b30a46bb6cd53060e9284275658d68`;
project SHA-256 is
`b3a0e80ac402f1cc18c98a57bf73bc30d83c681b4d40ba20cba15f1ab2b92cfb`.
Hosted verification passed all 104 assets and desktop/mobile checks after adopting
a concurrently published documentation manifest with identical runtime identity.

Checkpoint-specific validation and deployment receipts are appended below only
after those steps complete. Failed experimental evidence remains in local
`build/language-next-audit/staged-bodies-*.log`; those ignored logs are not release
artifacts and are not guaranteed to exist in another checkout.

The checkpoint's runtime source is
`b5bc8173899d2f5daa618d9f181cdfd2902468ab`, rebased onto `9d84f04`'s verified
Bedrock/import/inspection changes. Its scaffolding tree is
`4946ca80ae2e85232c51f885e62c3201c19bc5c6`.

| Check | Result |
| --- | --- |
| Documented native build after source rebase | Pass with the private bootstrap override unset. |
| Successor compiles `semantic_binding_proofs.tower` to LLVM | Pass. |
| Native query-smoke and type-smoke | Pass, including serial/worker and 32/64-bit profiles. |
| Browser worker suite | 3/3 pass, zero skips; overlap, failure interruption, and 1/2/4/8-worker determinism. |
| Edited browser compiler generations | Both pass, with identical bytes and edited semantic behavior. |
| Reused target support | All seven hashes match upstream Pages `b40bb38`. |

The first target-pack comparison found four stale local files. Restore the exact
verified upstream files before regenerating compressed assets and their manifest;
do not represent that first comparison as passing. The runtime implementation was
not changed by this checkpoint. The resulting bundle contains all 104 assets.

Native compiler SHA-256:
`142459861bd0f5eecec96891cbf5d6d035f131e387408eabab31276883afb92a`.
Compiler-project SHA-256:
`406a401a9af04b7d0f1be8e1a7603c2317d6c4528bad0c7b606f284aa6d6c112`.
The browser/runtime build used predecessor
`18664657c3ff9142a6d59bef8ffa794fd10d12313d55f91dd47f5575141a29f9`.

Identical edited generation outputs:

| Reactor | Bytes | SHA-256 |
| --- | ---: | --- |
| Tower | 1,383,764 | `200e867b73aaa8437126cb1f7f8b153e6995649842e73ee2afcd695c76bf8a47` |
| LLVM | 35,179,281 | `3e2effc4b43f1fa2b2d8df615038cd312cc6f39f393ef273f2d4efaa68a93545` |
| Cross | 56,323,462 | `ab8bd1351e645c970a844b96619631712c8e0260d46b7767756457d3d25c5a8c` |

Local evidence is under `build/language-next-audit/staging-checkpoint-*`:
`rebased-native.log`, `rebased-successor.log`, `rebased-query.log`,
`rebased-types.log`, `browser-build.log`, `browser-workers.log`, `generations.log`,
`workbench/generation1.json`, `workbench/generation2.json`, and `targets.sha256`.
Hosted publication is recorded separately after deployment verification.

The final source rebase incorporates `60a276e`'s IDE-fixture migration and changes
the checkpoint commit to `f494e22042172ebd72ddffff8051ec0128029899`. Its scaffolding
tree is `6e3234202311e435df01ec2120389cde1e68ef6d`. The added/changed IDE fixtures
are absent from the compiler-project recipe; compiler/runtime, grammar, library,
backend, build-tool, and browser asset sources are unchanged from the frozen
build above. Repeat the documented native build and successor proof-unit compile
after this rebase: both pass, and the native compiler hash remains identical.
Reuse the unaffected browser/generation results and record the source equivalence
explicitly in the deployment manifest. Preserve upstream Pages `3937cad`'s
additional IDE-migration receipt and its unchanged target assets.

## Historical publication and later upstream integration

The final documentation-only rebase produced implementation commit
`cf47b568f34c39249aee8e4377d47a1c3fbeddd0` and report commit
`d51164fd60f8dd06806a5c21f57602f2bf717a0b`. Both were pushed atomically with Pages
`f1a5dd372f80d86580ad6cafa24b96ba6cbe83ea`; workflow
[45048091240](https://github.com/TrevorSundberg/tower/actions/runs/45048091240)
succeeded. The first attempted atomic push was rejected by a concurrent main
update; it published neither ref. It was rebased and retried normally.

The hosted asset check passed, but the first UI run timed out waiting five
seconds for contextual completion. An unchanged retry passed the complete desktop
checks and hit the same deadline on mobile. The language service already permits
ten-second queries, so `verify-deployment.mjs` now gives its completion-popup
assertions the same named 60-second deadline used for asynchronous compiler
responses elsewhere in that verifier. Expected counts, labels, and typed filtering
are unchanged. This is a browser validation-boundary adjustment, not a compiler
implementation or removal of a check. Keep both initial failure logs.

Concurrent publications then changed the increment example and its documentation
receipt. Compare the manifests: only `increment.tower` changed among the 104
assets, while the compiler/project/runtime identities stayed at `cf47b56`.
Preserve that published example and the newer manifest instead of overwriting
them or accepting a mismatched manifest. The exact manifest used for that
final hosted run has SHA-256
`2264cdbfd0dc671a4404f3971be5e4552a80f3fc24267a72dff181bdadeb46f8`.

Upstream also merged the separate hosted-linker/bootstrap milestone through
`8c51600fa6160e81aa2e7efd60bbebcd7b1be39d`. The repository's then-current public
Linux x64 bootstrap at that historical integration hashed to
`c59e8bab69340cfcea7f03e3fa081b339dcf12230e84fd0c51870eb766551a75`.
A fresh documented native build with the private override unset and its successor
proof-unit compilation both pass after this integration. That native executable
hashes to `f51533b17340518e00b2f5ae1f000445280df77c227770aafb7d20f19d4c3098`.
Evidence: `staging-checkpoint-linker-rebase-native.log` and
`staging-checkpoint-linker-rebase-successor.log`. This is native rebase validation;
it does not relabel the already published browser artifacts as a new linker build.

The earlier budget failure was measured with that older predecessor; it remains
evidence of the attempted integration's failure. Production helper readiness and
the current public pin are described above; do not resume this superseded
experiment or transfer its failure to a later bootstrap.
