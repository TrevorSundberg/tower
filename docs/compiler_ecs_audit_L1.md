# L1 execution ownership audit

Current counted-diagnostic correction after e3c5f00 rejects fixed semantic resource failures at
execution and package boundaries even when presentation text is absent. Public
leaves, coherent rebuild and six native gates pass, including first-error/replay
and canonical-package regressions at both pointer widths. Corrected4511ed9 adds
32 checked CLI measurements;32 frontend observations reuse the identical binary.
Five address/leak and five thread gates pass with actual four-unit overlap4 and
matching canonical output. Small-process peak RSS grows about4MiB and frontend
median wall time about1-2%; those costs remain explicit. Frontend producer
integration, remaining allocation owners and final release gates stay open.
Independent ROOT review rejected e3's assumption that frontend diagnostics are
NUL-terminated. Both valid counted-buffer regressions reproduce that failure on
e3 and pass after the explicit-length correction. Earlier e3 passes/profiles keep
their original source identity and do not establish this corrected contract.

Earlier f46b3e2 uses the shared budgeted TypeObjectIndex in graph and fast execution.
Four public-bootstrap leaves, five native gates, ten new caller cases,100 checked
profile/control processes, six address/leak gates and six thread gates pass on
that frozen source. Actual four-unit overlap4 and canonical output agree. Narrow
fast controls retain about2%/1% small/large wall-time cost; broader variance and
occasional non-CPU gaps outside compilation remain explicit in the journal.

Earlier frame/task checkpoint: main15ff plus the six-file WorkVector change
passes a coherent native rebuild and query/storage/control/units/backend-overlap/
aggregate/types checks. The existing low-level storage fixture passes three times,
including physical denial, exact rollback and retained child-owner cleanup.
FastInterpreter's graph handoff disposes the matching new owners. All 64 paired
profile processes preserve outputs and canonical hashes. Large call-heavy runs
cost about 2-3% end to end; separate phase timing shows about 7.5% execution cost.
Two slow process exits outside compilation did not recur in twelve Linux-local
output controls; their original measurements remain recorded, cause unproven.
Current e68 thread instrumentation passes three query runs, two four-unit runs
with actual outer overlap and identical canonical hashes, and full aggregate
execution. The latter finishes in533.78s within its unchanged600s bound. This
does not cover later merged sources, native UBSan or foreign libraries. Integrated
memory instrumentation/bootstrap/browser/publication remain pending. Preserve
older evidence below as historical; see the journal for identities and limits.

This is an in-progress audit of `6282238779034442e0578d76b921ca117df819f1`,
begun on 2026-11-22. It is not an acceptance or publication receipt. Paths below
are relative to `scaffolding/compiler/` unless qualified. Tests cited here are
existing coverage identified by reading; fresh results are recorded separately.

## Contracts and sources

The current coherent snapshot is b8dfc67 plus A1's exact resource-error hook
76e1a971. Compiler 452f2fc0 passes independent resource failure checks three times
and query, units, backend overlap, serial snapshot/parser, known bindings,
aggregate stages, types, narrow integers and negation. The query now covers both
startup buffers and partial-owner cleanup. All source hashes remain frozen;
earlier failed receipts remain historical evidence. Resource tests check two
peers and drain at requested worker counts 1/4; actual overlap is established
separately by the production unit/backend controls. Paired 1f37-to-452f measurements
preserve every output and show small timing changes: serial effects 1.43 to 1.40s,
serial aggregates 1.41 to 1.44s, four-worker cases 1.19/1.21 to 1.17/1.18s.
No large regression appears in these two workloads; the serial aggregate cost
and all samples remain recorded. On this snapshot, TSan query checks pass three
times, production units pass, and the separately instrumented resource fixture
passes three times. Backend overlap fails its existing deadline under TSan;
the later aggregate/type/known checks did not run. This remains a coverage gap,
alongside final union instrumentation/public bootstrap/browser/publication.

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
The later frozen2460878 build resolves the editor body-admission abort and passes
editor observations at1/2/4/8 workers, source roots, core round trips, query smoke,
request ownership and actual backend overlap. The B2 root index also preserves
45,2 effects across graph/package/native execution and the uncalled export11.
Normalized signed32 source is now byte-identical to the old118962-byte baseline;
remaining33.86s emission misses the unchanged30s limit. Periodic native samples
point to table preparation/stage ownership, with limited unwind evidence; A2 owns
attribution. Exact receipts and gaps are in the journal. Capture-rangev3 is newly
integrated after drain, not represented by these passes. Its producer storage
review is positive; aggregate consumer input/address handling requires current
runtime diagnosis. The Linux-only type microprofile selector must move out of the
portable default runner through the coordinated D1/L2 target handoff.
### Required aggregate inputs and consumer lifetime

Current-v3 d09 independently reproduces global/local aggregate rejection while
scalar address-derived capture incorrectly succeeds. The joint L1/A1 draft now
shares the existing canonical projection vector through explicit required-input
metadata and materializes private target bytes in the consuming frame. Scalar,
copy and fill writes share the strict immutable-range guard; nested returns drop
only ended-frame copies and retained root storage survives result publication.
Type/function references are re-interned in the consumer, never copied as producer
indexes. The producer arrays remain alive until all consumer invocations are
disposed. There is no new evaluator, authoritative IR, global state or scheduler.

A1 freezes exact required-capture relocation policy before dispatch. The expanded
42 lifecycle cases and new private invocation/source fixtures are current gates.
Smallest predecessor units pass; full coherent native/runtime evidence is pending.
The journal records exact source handoffs, measurements, failed experiments and
remaining publication/instrumentation/performance requirements.

### CURRENT remaining scope after interpreter buffer validation

The path census is **34/34 reviewed production/unit/host-boundary Tower files**:
30 compiler/unit paths in the inventory above, its three named host boundaries,
and the newly enumerated L2-owned `semantic_type_execution.tower` boundary below.
No newly discovered file in that explicit lane census remains unread. This is a
read/audit count, not34 accepted release gates. Both changed aggregate regression
files (`tests/interpreter_call_query.tower`, `tests/aggregate_capture_inputs.tower`)
have complete source review; D1's ordinary fixture registration and the new
whole-empty/exact-diagnostic edges now pass. Other lanes retain ownership/audit of their broader library/parser/
backend/semantic families; this count does not claim those families were audited
in full by L1. Current source is mainb3ffb231 plus reviewed shared-buffer,
interpreter, parser and frontend ownership changes. Isolated interpreter cc8ad2ad
passes query/aggregate/types; joint1f37dee4 passes query and production units.
The backend retained-owner assertion failed and its owner correction is newly
applied, awaiting rerun. Exact manifests and failures are in the journal.
Four shared library buffer/type modules were also read completely in coordination
with A2; this does not enlarge L1's assigned compiler-file census. Older per-row
comments are historical.

| Boundary or requirement | Current disposition and concrete remaining work |
| --- | --- |
| `semantic_type_execution.tower`: `sem_type_execution_request/current/pump` | Newly added boundary review: original owner/subject components, full revision/profile/dispatch/sequence and exact invocation-pointer validation; coordinator-owned interning/layout demand; suspended invocation operands never replay. Uses explicit world checks and canonical descriptors, not private numeric indexes. L2 implementation is present and query/lifecycle coverage passes; no historical missing-helper claim remains. Revalidate current joined stale/cancel/type-constructor cases under final instrumentation. |
| `interpreter.tower`: `ix_input_storage`, `ix_returned`, invocation disposal; `interpreter_context.tower`: `ix_initialized` | Implemented and measured functional closure: private target bytes, exact required producer, ordinary leaf/reference reads, immutable scalar/copy/fill paths, caller/root retention and disposal. Original aggregate/full42 gates pass on6b32 and independently on L2ba48. Current596e passes complex32/64 graph/cache/canonical/workers1/2/4/8, an entire empty aggregate input (zero projections, distinct aggregate flag), and exact guard diagnostics. Remaining: supported final memory/thread instrumentation on the joined ownership source and independent verification of the new test edges. Non-null captured raw-pointer relocation remains an explicit unsupported staging capability, not a portable value or silent fallback. |
| World/component storage and locality: `foundation_nodes.tower`, `interpreter_storage.tower`, `fast_interpreter.tower` | Original entities remain authoritative; private frame/task/map/memory/cache vectors are dense derived data. Foundation payloads are stable components with indirection, not a claim of packed SoA. Control counts show no retained entity/component growth. Current small/large private-input query fixture passes three times across32/64-bit entry points: two8-byte copies occupy32 aligned bytes and128-byte memory/initialization capacities; two65536-byte copies occupy131072 bytes and131136-byte capacities. Both use256 metadata capacity bytes and release all observed vectors after normal, retained and cancelled completion. These are vector observations, not all allocations or total heap accounting. Remaining: whole-compiler physical budget accounting and allocation/retention, plus A2's table/stage profiling; no measured fragmentation/cache-locality/false-sharing conclusion for all compiler traversals yet. |
| Ready-work scheduling: `semantic_evaluation_work.tower`, `semantic_execution_work.tower`, `compiler_kernel_dispatch_admitted` | Current source uses shared admitted dispatch and explicit stages; the old manual executable-loop row is superseded. Between-unit frontend/backend overlap has distinct-worker and exact-object evidence on246. Within-unit query readiness and deterministic42-case execution pass on6b32. Missing acceptance evidence remains useful end-to-end profitable-core scaling at1/2/4/8, idle/coordination costs and shared nested-budget behavior on the final source. A single ordered interpreter invocation remains intentionally serial to preserve effects. Browser nested workers have the documented inline inner-transport limit; browser overlap/cancellation coverage must be rerun. |
| Decltype/comptime effects/invalidation: `semantic_evaluation.tower`, `semantic_capture_work.tower`, `semantic_type_execution.tower` | Required/optional producer roles, lazy executed-path discovery, prepared executable receipts, immutable initializer ranges and exact capture relocation policy are implemented; full42 includes untaken branches, early reads, effects, nominal/type/function captures and failures. Work tickets reject stale revision/profile/dispatch within a compilation. Persistent cross-session incremental invalidation is not provided by these tickets and must not be claimed. Confirm final cache/source/profile identities and unchanged diagnostics after owner integrations; coordinate any broader incremental capability requirement with A1/B2 rather than treating IDs as persistent validity. |
| Fail/cancel/drain/stale: invocation/session disposal and A1 pumps | Query tests include waiting-body resumption, failure, cancellation/disposal and constructor stale-receipt cases; borrowed aggregate arrays now outlive all consumer disposals. Source review and focused tests are evidence, not universal race freedom. Final concurrent cancellation/failure stress and ASan/UBSan/TSan coverage on this exact ownership source remain mandatory. A1's scratch allocator migration is still pending here: worker cleanup in `semantic_evaluation_work.tower`/`semantic_execution_work.tower` currently calls `free` for context allocations; require its matched compiler_buffer allocation/free handoff before final closure. |
| Serial cost and normalized packages: `execution_package.tower`, `bytecode_package.tower`; A2 `entity_stage_prepare/publish` | Original30s emission/load gate now passes on596e after reviewed452cfa58:11.52s wall/11.58s CPU/275720KiB emit,5.20s/5.23s/205932KiB load. Same source and adjacent resources; profile2, exact output,118962-byte canonical6f257 and178846-byte package retained. Earlier6b32 timeout124 remains a failed before measurement, not a completed comparable timing. Current query/aggregate/storage and three real-worker stage stress runs pass. Final matched repeated serial/parallel performance, allocation/locality and instrumented ownership evidence remain. |
| Native/browser cache and source emitters: `fast_interpreter_create/step`, `execution_package_load`, `c_emitter`, `roku_emitter` | Earlier core/session/envelope/source-rejection/root-preservation checks pass. New ownership still needs final current graph/cache/package/type/known matrix and browser differential/cancellation receipts. Raw runtime type construction unsupported by the packed cache must retain the explicit checked fallback/capability contract. Physical Roku-device execution is unavailable here; source/reference tests cannot be presented as hardware validation. |
| Portable measurement and packaging | Coordinated D1/L2 standalone Linux x64 target and exact L1 shared-selector removal compile/link/run successfully. The normal Tower execution wrapper has no undefined getrusage; only the opt-in profile imports it. Same checked16/256/1000-function workload and zero-retention/canonical assertions pass. Final clean portable/browser runner coverage remains; Linux symbol inspection alone is not a cross-host build. |
| Physical interpreter buffer ownership: `IMState.memory`, `IMContext.initialized/input_storage` | Implemented through shared work_vector receipts, borrowing the immutable root-world budget. Small/64KiB query cases pass bound and standalone modes, exact ledger sums, denied growth preserving old bytes/receipt, suspended/root retention and zero grants after disposal. Two invocations retain1216/525248 physical bytes; measured peaks1312/590848 include allocator headers and replacement overlap. Paired d1c/cc8 effects and aggregate programs at1/4 workers show no material regression. Shared type-only imports fix the measured predecessor component-budget failure without raising limits. Other frame/task/map/cache/type-reference/diagnostic vectors and opaque allocations remain outside this slice; it is not whole-heap accounting. Final independent/current instrumentation and joined ownership closure remain. |
| Required/optional staging and cache attribution | Exact same Foundation root executes raw0,7,7 through graph and direct packed cache at32/64 bits. LLVM-normalized CLI7,7,7 is attributable to optimizing an undefined early read, not a demonstrated engine defect. Fully initialized effect source yields1,1,7 across direct graph/cache/canonical and independent CLI/native controls. Original raw-source admission and exact demanded-earlier rejection remain. D1's shared known-binding oracle integration is still pending; no full-known pass is claimed. |
| Final source/bootstrap/browser/publication | No new syntax requires private adoption. Incremental public-pin builds pass; final clean documented Linux x64 build from the merged source, complete executable/resources/provenance and generation/browser matrix remain unrun. Keep actual source/build commits reachable from main, preserve concurrent publication receipts, obtain the named coordinator lease, atomically push main+gh-pages and verify served manifest/assets/behavior. No lease or hosted acceptance exists yet. |

The34-file census is closed for reading; release acceptance remains open in the
specific rows above. The next owned work is the exact known-binding oracle review,
final joined instrumentation and performance/allocation coverage, while L2
independently validates the newest portable harness. Historical helper/readiness/aggregate bugs are not restated as
unimplemented capabilities. No deliberate invalid-memory/race sensitivity probe
will be repeated; supported valid-program instrumentation remains required.

### Remaining execution allocation scope after e68e2b2

The preceding rows retain their historical snapshot identities. Current memory,
initialization/input, frame and task owners have shared physical receipts; native
seven-suite and exact rollback/reuse checks pass. Frame/task cost and source-specific
instrumentation limits are recorded in the latest journal entry.

Remaining work is concrete: graph value/address/heap/string/sequencing maps,
node/function/type indexes, fast-cache arrays and diagnostic/opaque owners still
have separate allocation boundaries. L2's proposed TypeObjectIndex is the next
shared dependency; its resource result must survive graph/fast consumers and
optional semantic queries. No API draft is credited as implemented. Incoming
resource-growth tests must prove they reach the nested allocation after the newly
charged entry owners. Current supported instrumentation, merged source rebuilds,
public-bootstrap/generation/browser closure and leased publication remain open.

### Type-value owner migration after the frame/task milestone

The six-path11f6b5b6 caller patch now uses L2's shared TypeObjectIndex in graph and
fast engines. Its descriptors remain borrowed canonical Foundation types; private
one-based indexes never become another semantic graph. The world budget is passed
on every intern request, including existing-value hits. Both graph interning sites
retain the first resource error, failed constructor delivery stays unconsumed, and
fast construction disposes its partial cache before returning a failed session.
Capacity-owned graph scheduling storage remains available for normal failed-session
disposal. Retained index reads, disposal and fast payload statistics use the shared
owner layout. Existing semantic evaluation already preserves storage_error before
optional source-diagnostic clearing. Both implementation imports remain present.

Four public-bootstrap leaves, a coherent14-step native rebuild, the new ten caller
cases at32/64bits, query/type smoke, full types, and calibrated exact-object overlap
all pass on c1560f8 plus this patch. Complete ad79 baseline binaries/resources were
saved before adoption. Journal/raw receipts retain exact hashes, costs and the
concurrent-validation qualification. L2 reviewed the full caller patch. Its newly
registered serial Memory-prefix suite is separate and still awaiting actual exit;
paired performance and current instrumented gates are pending, not passed.

The remaining map/cache/diagnostic/opaque owners in the previous section still
need closure. Node-cache accounting additionally requires binding the budget before
invocation_init's first cached function lookup; no such migration is claimed here.
The newly coordinated SemanticProgram.resource receipt also requires an execution
session success-boundary update after its exact shared header lands. Neither this
native milestone nor the earlier frame/task sanitizer receipt is final merged
bootstrap/browser/generation/hosted acceptance.

The frozen f46 milestone now also has100 checked before/after profile processes,
six address/leak gates and six thread gates, all completed successfully. The small
and large fast controls retain roughly2%/1% median end-to-end costs and wider
original variance; unexplained external delays occurred in both binaries and are
preserved. Actual four-unit overlap reaches4 with unchanged canonical output and
reported retention. Instrumented calibrated backend checks preserve exact objects
and distinct-worker overlap. Source manifests and actual generated IR/binary hashes
are retained; foreign libraries/native Tower UBSan remain outside coverage.
L2's corrected301 fixture independently passes three serial allocation-prefix
suites with unchanged production API; its new source hook still awaits adoption
here. These receipts supersede the preceding pending labels only for their exact
source scopes. Shared resource consumer and remaining map/cache work stays open.

### Fixed semantic resource receipts at execution boundaries

The execution_session compile/start/cache/step gates and execution_package encode
now honor A1's shared SemanticProgram.resource independently of optional diagnostic
text. Static shared fallback messages and the first offset remain available; an
already failed session cannot acquire a later error's text or resume after text is
cleared. Error-report allocation failure preserves failed/done and package false/
zero-output, without aborting to format the failure. Existing ordinary diagnostics
and recoverable guest allocation-null behavior retain their contracts.

Initial patchafb3cc69 plus exact A1V2b255 atop ROOT72/L2301 passed public leaves,
coherent native rebuild and six native gates including full execution/canonical
packages and actual backend overlap. New fixtures cover both pointer widths,
empty/present diagnostics, no effects/replay, root cleanup and clean recompile.
Actual diagnostic allocator denial and full frontend producer integration remain
separate evidence gaps; hand-seeded shared receipts do not prove those producers.
Independent ROOT review subsequently rejected its NUL assumption for counted
frontend diagnostics. The valid trailing-buffer regressions fail on that initial
implementation and pass on corrected4511ed9/fac27420. Corrected32 CLI samples,
32 unchanged-binary frontend samples and five address/leak plus five thread gates
now pass; costs and coverage limits remain in the headline and journal. Final
publication and integrated producer acceptance remain open.

### Node-cache ownership after the shared receipt/page join

Reviewed ROOT75 joins at eafc5c9. Its coherent public-pin native baseline passes
query/core/type-construction/editor; this is not full source-union acceptance.
An added zero-allowance startup assertion reproduces the hidden ordinary-vector
cache allocation before budget binding. The harness reports both small/large
32-bit failures then aborts134; later width/worker cases do not run on that failed
before candidate. Raw statuses and the wrapper's incorrect expected1 remain.

The current seven-path draft moves node_cache to shared work_vector admission in
ix_init, validates the initial function through plain im_node, and retires the
receipt in normal/Fast disposal. Lookup masks and clear sizes derive from actual
cache extent; the fixed power-of-two policy has one named declaration. Startup
fixtures derive five admission allowances from observed successful owners and
name retained-owner expectations. They check exact grants, no effects and no
retry after pressure is released. The existing serial storage entry separately
checks capacity and physical allocation failure; it is not invoked by ordinary
execution core and must run explicitly. It now passes three serial runs; coherent
native core-static/core also pass. Query catches the shared old1KiB growth
allowance denying the newly charged cache at startup. D1's exact-phase fixture
update now passes the exact startup-cache/gated-growth query on the original 16KiB budget.
The other three native gates and64 frozen process profiles also pass their output
oracles. Recorded graph/setup/RSS regressions keep performance acceptance open;
allocator controls and current instrumentation are pending. Graph
maps, function indexes, Fast arrays and diagnostic/
opaque owners remain open; type indexes and counted receipt consumers are
implemented with their source-specific evidence above.
