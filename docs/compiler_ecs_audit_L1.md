# L1 execution ownership audit

This is an in-progress audit of `6282238779034442e0578d76b921ca117df819f1`,
begun on 2026-11-22. It is not an acceptance or publication receipt. Paths below
are relative to `scaffolding/compiler/` unless qualified. Tests cited here are
existing coverage identified by reading; fresh results are recorded separately.

## Contracts and sources

Read the compiler services and ECS/threading handoff with the journal's newer
type-value continuation. Production helper readiness uses `IMFunctionInput`;
the handoff's earlier missing-producer experiment is historical.

[Flecs systems](https://www.flecs.dev/flecs/Systems.html) motivates declared query
access and ordered publication. [Component traits](https://www.flecs.dev/flecs/ComponentTraits.html)
distinguishes dense traversal from stable sparse payloads.
[Burst aliasing](https://docs.unity3d.com/Packages/com.unity.burst@1.8/manual/aliasing.html)
requires justified disjointness before alias-sensitive optimization. These are
design inputs, not evidence of Tower performance or race freedom.

## File review

| File | Storage, ownership, scheduling and disposition |
| --- | --- |
| `foundation_types.tower` | Foundation components augment original entities. Ordered operands/locals/parameters and bound declaration links remain semantic authority. Vector payloads are contiguous separately allocated lists, not packed component SoA. No new IR proposed. |
| `foundation_nodes.tower` | Component initializer/disposer own six vector fields; relationship handles borrow graph ownership. Prepend repairs an aliased source after growth and checks source extent/alignment. Coordinator/stage ownership is supplied by callers; it is not an independently synchronized container. |
| `interpreter_types.tower` | Private task/frame, sorted map and memory vectors index original Foundation handles. Reused depth buffers require disposal across capacity, which storage implements. No public entity-address encoding. |
| `interpreter_storage.tower` | Sorted maps and task buffers are dense per invocation, with exact lower-bound key checks. Frame pop retains capacity; disposal visits every initialized capacity slot. Guest memory is explicit target-offset storage. Allocation instrumentation is not concurrency evidence. |
| `interpreter_abi.tower` | Component memoization checks the complete entity key while the checked graph is immutable. Function tables retain declaration identities; target values use private indexes. Graph/cache indirect calls check membership and ABI-compatible signatures; staged result relocation requires exact source signatures. Low-level runtime bits casts retain the documented compatibility contract. Host callbacks are explicit ABI boundaries; no index is serialized as public type/function identity. |
| `interpreter_context_types.tower` | `IMInvocation` owns machine/context, diagnostics, initialization map and result. Constructor request adds owner/sequence, original subject, evaluated operands and full descriptors; diagnostic vector belongs to the invocation. Readiness/value/function components are coordinator-published borrowed metadata, not locks or persistent cache identities. |
| `interpreter_context.tower` | Strict frame initialization and diagnostics/output are invocation-private; ambient callbacks apply only when context is absent. Explicit capabilities reject foreign calls. Strict initialization policy is limited to staged execution and does not alter raw Foundation. |
| `interpreter.tower` | Full arithmetic, guest memory, calls, task suspension, control, printing and lifecycle review. Finish-call task retains already evaluated arguments; explicit dependency reads suspend without worker-side semantic forcing. Captures validate declaring frame identity. Constructor FinishValue retains evaluated operands and owner/sequence, waits without effect replay and relocates full descriptor receipts privately. Isolated protocol passes both target widths; joined semantic producer and sanitizer evidence remain pending. |
| `fast_interpreter.tower` | Reviewed complete lowering, packed encoding/patching, cache/state, dispatch/call/disposal and statistics. Packed words/constants are private derived cache; cold source/type/function tables borrow the graph. Registers/frames are private. No JIT, shared mutation or invented noalias. Opcode27 rejects reached construction after operands. Allocation guard and type_values storage accounting compile; isolated protocol and encoder/session regressions pass with the rebuilt interpreter unit. Factory callers and guarded step/disposal/stat paths reviewed; initial allocation-failure branch is not fault-injected. Joined compiler and performance validation remain open. |
| `bytecode_package.tower` | Reader checks envelope bounds/version/width/profile/checksum before section access. Fresh canonical reconstruction and cache equality remain necessary. Confirmed invalid-profile stale length; fixed unconditional length reset, width/profile validation and checked remaining-size arithmetic before section multiplication. Focused invalid profile/width/maximum source and valid envelope tests pass. Cache equivalence/full package corpus remains to rerun. |
| `execution_session.tower` | Bound environment selects its world; explicit world constructor owns root and snapshot buffers. Close releases cache before graph. Confirmed early-rejection start crash; fixed terminal failure/start guards. Confirmed bounded-source NUL truncation; now reject owned snapshot before frontend invocation, preserve first error/offset and dispose all snapshots. Reuse, closed/failed start, no-effects and explicit source-bound tests pass. |
| `execution_package.tower` | Validates before reads, rejects embedded source NUL, recompiles canonical Foundation and compares cache. Early failures clear the previous session and leave no graph; the confirmed start crash is fixed at the shared session boundary. Re-encoding uses a temporary owned session. Core package subphase passes byte-identical canonical reconstruction and corrupt/cache-mismatch rejection. |
| `execution_profiles.tower` | Explicit canonical/optimized/normalized ABI values; no state, allocation or scheduling. |
| `semantic_evaluation.tower` | Original subject owns result/invocation/readiness components. Shared WorkGraph access/tickets reserve bounded ready frontiers; dispatcher joins before readiness/result publication. Executed calls/bindings demand producers. Cycle diagnosis is separate from pumping. Alias, aggregate and relocation results publish after join. Review failure propagation and demand scans with A1 before edits. |
| `semantic_evaluation_work.tower` | Private context/program diagnostic and scratch copies; stages lease subject/function before dispatch, views close after join, all stages publish before aliases. Typed expression vectors are derived queues. Shared finite dispatcher is already used. |
| `semantic_evaluation_types.tower` | A1's extracted declaration module preserves the same evaluation/result component identities and invocation ownership. It supplies shared payload types without importing execution implementation into fixture clients. Joined query receipts and the complete semantic corpus pass with this split. |
| `semantic_execution_work.tower` | Checked source identity maps to derived executable Foundation snapshot. Body dependency/access is reserved before dispatch. Context/scratch/errors are private; stages publish after drain. Contains a manual refill loop equivalent to shared dispatch; do not rewrite without measured need. Failure readiness semantics require comparison with graph failure propagation. |
| `semantic_evaluation_aggregates.tower` | Projection records retain original field identity until layout exists. Final frame is retained until scalar leaf relocation; no padding or interpreter address is serialized. Rejects nonzero raw pointers; type/function values relocate via shared interpreter. |
| `units/interpreter.tower` | Import-only production closure; includes ordinary call-readiness fixture. Changing membership requires manifest coordination. |
| `units/interpreter_checks.tower` | Import-only storage/invocation/readiness test closure. No independent evaluator or state. |
| `units/evaluation.tower` | Import-only ordinary interpreter/invocation execution closure plus readiness fixture. |
| `units/evaluation_checks.tower` | Import-only evaluation/storage/readiness fixture closure. |
| `units/interpreter_browser.tower` | Same graph/fast/package implementation plus invocation/readiness fixture. Browser transport is not a separate evaluator; cancellation is owned by its host worker. |
| `foundation_tags.tower` | Named internal tags/representation limits, no per-world mutable registry. KTypeConstruct37 and TypeConstructionKind enum are implemented after all owner ACKs and compile with the public predecessor. No successor public pin or syntax adoption is claimed. |
| `source_emitter_api.tower` | Extern-only read interface. Vector ABI declarations belong to emitter compilation units; host/test callers use existing ByteBuffer declarations with matching layout. Mixing both nominal declarations in one unit fails explicitly. |
| `c_control.tower` | Monotone reachability and returnability over original entities with private active/returning indexes. Ordered statements/labels and branch control stay serial. Assumes collection accepted the graph: indirect calls have no direct binding. This precondition exposed the confirmed emitter crash below. |
| `c_emitter.tower` | Private entity/owner indexes and output buffers; reads frozen checked graph. Linear ID searches are a possible measured optimization target, not grounds for a speculative rewrite. Confirmed continuing after unsupported function collection reaches invalid direct-call state; fixed with early return and shared deferred cleanup. No graph mutation or noalias claim. |
| `c_runtime.tower` | Platform source-output boundary with explicit pointer width/alignment checks, unsigned wrapping and checked signed views. Loads/stores use memcpy rather than unsupported alias assertions. Runtime guest allocation remains raw platform ownership. No host process state is retained by generation. |
| `roku_emitter.tower` | Reuses CEmitter's private entity index; explicit 32-bit target and output/label/conditional limits. Shares corrected early collection rejection and deferred cleanup, including width failure. Ordered values remain temporaries. Physical-device behavior is not verified here. |
| `roku_runtime.tower` | Platform text boundary owns byte-address VM per TowerRun; limb arithmetic, bounded memory and per-invocation globals. Private rem helper follows its Wasm numerical corpus; production CLI always normalizes through LLVM, which emits the Foundation signed-overflow guard before remainder. Do not infer a production discrepancy from the isolated helper or change its independent corpus semantics without caller evidence. |
| `../host/invocation_execution.tower` | Compile-only callbacks bind IMState to its containing invocation; private output, explicit target/root, no implicit foreign capability. ABI adapter, not an ambient registry. |
| `../host/driver_execution.tower` | Thin ExecutionSession ownership/host I/O adapter. Foreign platform_write uses guest bytes and explicit streams; output flush preserves effect order. Session fixes apply directly. |
| `../host/ide_execution.tower` | Reviewed boundary with B2 ownership: typed handles own independent program/memory/cache; taking handle precedes destruction. Legacy default host world remains an ordered transport boundary. This lane makes no host-service edits. |

Pending evidence: complete numerical/native/browser differential and actual-thread
stress, joined fast-cache allocation/accounting and constructor validation,
supported sanitizer runs and publication. Formatter
ownership is B1; shared semantic lifecycle/capture is coordinated with A1, shared
core scheduling with A2 and type construction with L2.

## Environment and evidence

Initial checkout was clean and `git pull --rebase` succeeded. The native baseline
uses WSL Orchestral-Revng, Ubuntu 24.04.5, Linux x64 kernel
6.18.33.2-microsoft-standard-WSL2, LLVM/Clang 19. WSL exposes about 15 GiB RAM
(14 GiB initially available) and 4 GiB swap; C: initially had 127.31 GiB free.
The reported host budget is 8 cores/16 logical threads. L1 reserved one heavy
build slot at `/tmp/tower_l1_ecs_native` with two build jobs. No private bootstrap
override is set. The default `build-native.sh` build is in progress; its retained
log is outside the repository at `C:/Sandbox/build/codex_ecs_20261122/L1/logs/baseline_build.log`.

No fresh runtime, overlap, sanitizer, deployment or speedup result is claimed yet.
Audit documentation itself changes no runtime path; runtime performance and
memory comparisons apply to subsequent implementation fixes.

### First measured failure fixes

The initial default native build passed all 51 steps: 101.11 s wall,
157.20 s user + 19.48 s system CPU, 845660 KiB maximum RSS. WSL discarded
`/tmp` between invocations, so its test reconfigure failed (missing native
selection/cache); no result was hidden. Moved the owned cache to
`/root/.cache/tower/l1_ecs_native`, repeated the public build (103.00 s wall,
177.75 s CPU, 845804 KiB peak RSS), and built execution/driver/work tests
(15.81 s wall, 23.65 s CPU, 336092 KiB peak RSS). The baseline compiler and
resources are retained at `/root/.cache/tower/l1_ecs_baseline`. Build timings
are environment evidence, not a before/after performance comparison.

`tower-lr-work-tests RESOURCE_ROOT query-smoke` passes serial/threaded 32/64-bit
staging/readiness. The unmodified `tower-execution-tests ... core` fails on its
first old literal fixture because it lacks an explicit language import. Reported
to D1; full-suite acceptance remains open. Added task-specific `rejection` and
`source-rejection` selectors, without adding implicit imports in shared helpers.

The same focused fixtures terminate by signal 11 on baseline code:
`rejection_baseline.time` (failed envelope then step; 0.64 s wall, 0.21 s CPU,
90984 KiB peak RSS) and `source_rejection_baseline.time` (unsupported indirect
function graph to C; 3.18 s wall, 1.84 s CPU, 174540 KiB peak RSS). The ordinary
CLI `function_values.tower --emit c --no-optimize` independently reproduces
signal 11. Its first timing overlapped a build and is excluded from performance
comparisons. Tests now pass after terminal session guards and early C/Roku
collection rejection. Existing checked graph remains executable after repeated
failed source emissions. Baseline/candidate invalid runs execute different
outcomes; these measurements establish defects, not speedups.

Test-unit development retained failures for nominal `vector(u8)` versus
`ByteBuffer` extern collisions, then the missing bytes import. Reused the existing
host ABI declarations; no new adapter. An initial smallest-target command selected
parser-format.o and did no work; actual emitter code belongs to parser-nodes.o,
which rebuilt successfully. Fresh valid-input profiles, remaining malformed
source/encoder tests, instrumentation and publication are still pending.

### Current checkpoint
The journal records current evidence. All 156 graph/cache trials plus the
canonical-package subphase passed; focused core-static and its negative binding
oracle now also pass against the fresh joined compiler. A fresh joined public
bootstrap build includes A1v2's receipt-copy fix, shared declaration/query-unit
split and root-demand fix. Query smoke and the complete semantic corpus pass at
both target widths, preserving the exact single-instantiation diagnostic oracle.
The corpus also checks inferred type-value arguments through graph execution,
fast execution and canonical reconstruction. Published 8/5 assets remain distinct
from current 9/6 source. Shared budget integration, final profiles, instrumentation,
successor publication and hosted acceptance remain open.


### Execution ownership boundary

One interpreter invocation executes its ordered effects serially. Parallelism is
across independently ready compiler evaluation requests and compilation units,
through A1's shared work dispatcher; this lane does not add a second scheduler or
parallelize a dependent instruction stream. Each invocation owns memory, frames,
value/function/type indexes, diagnostics and output. It borrows a checked graph
whose lifetime and publication barriers are controlled by the owning pipeline.
The coordinator must drain jobs before closing those owners. Pinning a graph is
not permission to mutate its payload while an invocation reads it.

FoundationNode payloads remain stable components with explicit ordered edges and
bound declaration references. The interpreter's dense vectors and direct-mapped
lookup table are private derived indexes; they do not turn the world component
store into packed SoA storage. No new cache-locality or parallel-scaling improvement
is claimed from this audit. The relevant fresh measurements and integrated overlap
checks remain separate release evidence.

The joined snapshot also passes the session, emitter, envelope and constructor
protocol suites, plus type/control smoke with serial/worker equivalence and
canonical reconstruction. A five-pair ordinary call profile shows overlapping
before/after execution times and essentially unchanged peak RSS; it establishes
no material regression or speedup. Moving byte-identical test resources from the
Windows mount to the owned Linux cache reduced one complete semantic run from
144.17s to 7.05s with identical output. This is filesystem transport evidence.

New shared-budget owner patches are integrated after that tested snapshot and
still require a complete coherent build. The earlier successful semantic-unit
preflight preceded B2's second bounded-input bundle. It must not be used to
discount the newer aggregate's reported public-bootstrap component limit.
### Current integrated-source limits and reconstruction finding

New owner handoffs change shared WorkTask, SemanticDeclaration and FrontendUnits
layouts and consolidate the standard prelude. They require fresh dependent objects
and matching resources. Old complete execution receipts above remain tied to their
recorded source identities. A1's required-stage continuation fix is still pending;
full constructor acceptance, final instrumentation/profiles and publication remain
open. The current semantic executable pump now uses shared admitted dispatch,
replacing the earlier manual-loop observation in the inventory.

Exact valid signed32 attribution reproduced D1's baseline package byte for byte.
Its normalized Foundation is118962bytes and reconstruction dominates runtime.
The newer fast package uses a different profile because imported type helpers
trigger Foundation preservation; it is not equivalent normalized coverage. Both
outputs match the independent saturation oracle. See the journal for timings,
identities, unresolved reconstruction cost and limited debugger observations.

ExecutionSession's input snapshot is temporary and is disposed after synchronous
frontend compilation. The newly bounded frontend owns SyntaxSource storage.
The session's extra copy is now a potential simplification, not a demonstrated
retention requirement or measured bottleneck. No unvalidated removal was made.

### Current role and runtime-root corrections

The subsequent f17 identity/readiness compiler fails the original independent-world
semantic fixture at an unfinished staged callee, and scalar C emission rejects
unused imported type helpers. These supersede earlier snapshot passes as current
acceptance blockers. Required-stage readiness, separate required/optional producers
in the same IMValueInput component, and shared runtime root/reference policy are
now integrated drafts. All readers and publishers require a matching ABI rebuild.
Private execution indexes preserve graph identity; Foundation declarations remain
intact. Exact failures, owner changes and pending verification are recorded in the
journal and lane status. No newer full semantic, control, browser or publication
pass is claimed.

The next coherent b28 compiler passes the original semantic/world crash case,
query/control smoke and source emitter ownership/capability cases. Required-stage
snapshot receipts prevent repeated lowering. These are concrete partial results;
full types currently fails a new unused-alias reachability expectation, and editor
completion's unimported fixture fails its candidate assertion. Owner review is
pending. The journal retains exact binary/source identities and failed logs.

The corrected seven-case reachability oracle now preserves the unused local alias
as a negative and tests retained type values positively. L2's independent full
suite passes; L1's a78b474f source-root/parser rebuild passes source-rejection,
type-smoke and full semantics. The imported editor fixture exposes a separate
body-admission assertion, routed to A1/B2. This supersedes the prior fixture-only
status without hiding either failure. Terminal capture review supports the
current post-evaluation publication boundary, subject to dynamic late/generic
regressions and range ownership/memory evidence. The matched-resource signed32
control still has substantial normalized reconstruction cost; exact artifacts
are retained. Final acceptance and publication remain open.