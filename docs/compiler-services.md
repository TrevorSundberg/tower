# Tower compiler services

Coverage review: frozen published main
`b83eeca71edbe3770e7b576692a5702cb3ff42fa`, 2026-11-23. The API contracts below
describe implemented source. They are not a final native/browser acceptance
receipt. The [completion gates](compiler_ecs_threading_handoff.md#finite-completion-gates-at-the-frozen-revision)
separate exact-source checks, older focused receipts, unchecked callers and
pending release evidence. ROOT's positive address/leak/thread receipt on
`5c5a308c` now passes its selected ownership cases; subsequent grammar, Fast
storage and staging-frontier changes remain outside those binaries. No runtime
build was run for this review.

`scaffolding/compiler/services.tower` is the compiler-services library entry
module. The native and Wasm builds import this same Tower module. It brings
together semantic checking, completion, document inspection, source metadata,
and the compiler's existing formatting services. These queries inspect the
ordinary syntax and Foundation entities and their components, bindings, named
relationships, and resolved types. Their result indexes are disposable views.

The entry composes a link unit; it does not implicitly re-export source names.
Tower callers import the defining modules (`language_query`, `completion`,
`frontend_compilation` or `frontend_modules`) and their needed type modules.
Source visibility follows the [module scope rules](modules.md#module-scopes-and-aliases).
Completion and hover resolve aliases through those same scopes and display
original declaration names when flattened Foundation needs a unique spelling.

An IDE links these services directly. It does not need a language-server process
or protocol. The browser runs them in its existing cancellable worker and keeps
the returned document index for synchronous mouse lookup. It owns positioning,
dwell, painting and UI labels; it does not parse source or resolve types.

| Query | Tower entry points | Ownership |
| --- | --- | --- |
| Document / hover | `language_document_world(world, environment, source, length, mode, pointer_bytes)`, `language_document_result(query)` | Borrow the world/environment until `completion_dispose(query)`; copy the result before disposal. |
| Completion | `completion_begin_world`, `completion_analyze`, `completion_symbols`, `completion_offer`, `completion_end` | The constructor takes world/environment before the existing source/span arguments. The active parser must have the same owners. Dispose after copying the result. |
| Checking / diagnostics | `frontend_compile_sources`, `frontend_modules_error_file`, `frontend_modules_error_offset`, `frontend_modules_location` | Results belong to the semantic program and module environment. Keep them alive while reading diagnostics. |
| Module source position | `frontend_module_location(module, offset, line, column)` | Returned filename is borrowed from the module's source metadata. Offsets are UTF-8 bytes; line and Unicode-scalar column are one-based. |

Document modes are `0` for ordinary source, `1` for Foundation, and `2` for
Bedrock. Document inspection takes an explicit pointer width (`4` or `8` bytes).
Completion retains its existing 4-byte semantic target; explicit world ownership
does not yet add completion target selection. Configure the module environment and its source files before querying. The returned ranges are UTF-8
byte ranges; JavaScript maps them to UTF-16 offsets solely for editor rendering.

The explicit services create recovery sessions and semantic roots in the supplied
world. Formatting and component inspection read each node's own world, including
implicit component kinds. Independent worlds can run concurrently; one active
writer owns each world/environment. These synchronous constructors do not acquire
a shared-world payload lock. Use the unit executor below for isolated worker jobs.
`language_document` and `completion_begin` remain legacy host adapters; browser
transport entry points still select their host context at that boundary.

Module snapshots and supported parser/grammar failures retain their typed
`WorkBudgetError` through `frontend_module_resource_error`,
`syntax_session_resource_error` and `completion_resource_error`. Completion reads
the session cause before the module cause, stops recovery after resource failure,
and returns an error object from `completion_end`; document inspection returns
null. Ordinary incomplete syntax still permits partial inspection. Typed coverage
currently includes supported table construction, LR control storage, and entity
or match-component creation during tree shifts/reductions. Tree creation retains
the per-call entity result in the request's existing LR control error field.
Recognizer forests charge their descriptor, child index and traversal stack to
the runtime world's budget. Their per-call result preserves allocation denials
through shifts/reductions; the legacy standalone forest constructor uses no ledger.
Forest attachment also preserves the entity producer's structural admission and
allocation results before transferring the leaf, including `Busy` and `Invalid`.
Checked grammar/pattern/table constructors, module startup, parser diagnostic
owners and generic result producers now propagate per-call errors. This
supersedes the earlier blanket missing-grammar/startup claim. Shared formatter
scratch/final diagnostic text and other unchecked semantic callers still need
complete propagation; the getters do not establish coverage of every allocation
path. Ordinary presentation vectors can report Memory without being charged to
the world's ledger.

Hover results include a canonical signature, resolved type/layout where present,
attached comments, and file/line/column locations. Grammar references retain the
snapshot active at that source position. One tree walk covers every leaf and
selects the nearest entity with supported components across its whole source
span. There are no keyword/punctuation spelling checks or operation allow-lists
in this lookup. `language_components.tower` dispatches presentation by actual ECS
component type with explicit priority, independent of component storage order.
The Foundation component presenter uses its operation tag and resolved bindings
to choose details; syntax and resolved-type presenters handle their own metadata.
New surface spellings therefore work through the same nodes without adding hover
cases. Generic definitions retain their own symbolic signatures and bindings;
hover never substitutes the first concrete instance for the definition. Structural statements
receive descriptions without fabricated value types. Unchecked custom syntax
uses its actual matched rules and captures instead of claiming a runtime
type. Whitespace and unattached comment text do not fabricate symbol hovers.

`sem_type_uses_begin` enables shared type-use observations for a semantic context.
Every successful `sem_type` resolution then attaches a `SemanticTypeUse` component
to the source entity, linking the ordinary reflected type entity. This includes
annotations, template call arguments and built-in call arguments, regardless of
their parsed spelling or wrapper. Query consumers can reuse these links; hover
does not run a second annotation-specific resolver during presentation. Normal
compilation leaves observations disabled. The observation component and any
temporary type entities belong to the query's existing lifetime. Original generic
definitions still use symbolic metadata rather than a particular instantiation;
failed checks retain independently resolved primitive uses while withholding
unfinished named layouts.

UI locations use `path/file.tower:line:column` consistently. A function signature
already contains `fn` and its return type, so the tooltip omits those duplicate
rows while retaining result size/alignment, comments and location.
Component descriptions explain what the construct does in plain language rather
than restating its name: variables store values that can change, parameters are
inputs supplied by a call, and functions are reusable code. Function explanations
use checked parameter/result metadata, including no-input and void-result cases.

`semantic_generic_info.tower` supplies an optional bounded inspection pass over
the original template entities. It attaches `GenericInfo` components linking
declarations, parameter uses and their actual type-expression trees, reusing
semantic scope tables for lexical bindings. Type parameters and compile-time
integer inputs remain symbolic; fields can display `T[size]` without claiming
a concrete layout. Independent annotations use ordinary type resolution and the
explicit target profile. Concrete uses retain their separately checked types and
layouts. Inspection of registered generic definitions also runs when another
part of the document has a semantic error. Executable Foundation presentation
and nominal layout resolution remain gated by successful checking; failed
documents retain symbolic annotations/bindings without exposing unfinished type
layouts. Independently known primitive field types remain usable after errors.
Inspection node quotas may produce a truncated result. A clone storage failure
instead disposes the query and returns null; it cannot become a successful
partial document. Module-cache cloning likewise reports failure and retires its
private graph before changing any existing cache entry.

`semantic_generic_values.tower` follows member paths through those annotations
and declaration-based argument bindings. A type function with direct struct
declarations followed by a return of one of those structs has a fixed field
shape, cached on its original definition. For example, `stack(T)*` can expose
`count: usize`, `storage: buffer(T, 4)`, `storage.data: T[4]`, and an indexed
element of type `T`, without choosing an instance or evaluating a runtime value.
Branch-dependent returns and other arbitrary type programs remain unknown.

Concrete subexpressions use the ordinary semantic checker on temporary cloned
query subtrees, seeded with already known operand types. This shares operator
legality, contextual integer literals, range checks, comparison result types,
and target data. It never lowers the original template body or suppresses an
executable compilation diagnostic. The query also propagates inferred local
types and gives unresolved operations their own metadata instead of showing the
enclosing function. It does not fully check unused bodies or infer every
dependent expression; ordinary instantiation still performs those checks.
Depth/node limits report an incomplete index when reached.

`language_generics.tower` presents these components through the same dispatcher,
including preceding lexer-captured comments and declaration locations. Canonical
generic signatures and dependent type expressions use `format_dependent.tower`
in the shared formatting engine, with disposable substitution views of the
original annotation entities. `inspection_policy.tower` names query limits
and the `LanguagePresentation` priority enum. The browser still only renders the
returned data and uses its cached position index for mouse movement.

These Tower services have explicit compiler worlds, module environments and editor
job ownership. Remaining default-world compatibility entry points and structural
semantic preparation still require ordered ownership. They use the existing AST,
symbol lookup and Foundation graph rather than defining another semantic model.

## Lazy semantic execution

`semantic_source_bindings` and `semantic_capture_work` prove module/local binding
identity, writes/escapes and initialization order before a type or known-value
consumer uses a capture. Declaration/frame ownership survives suspension.
`semantic_execution_work::sem_executable_request/sem_executables_pump` requests
the ordinary body/lowering producers and publishes `IMFunctionInput` only when
the checked executable is ready. Unevaluated `decltype` retains the shared
semantic type-query contract. `semantic_type_execution` and
`semantic_constructor_work` use the ordinary interpreter for helper calls,
`comptime` and supported representation construction; only executed reads/calls/
constructions demand their value producers. Untaken branches
do not manufacture value dependencies. Runtime type construction remains an
explicit capability rejection, not a constant-folder fallback.

Two demanded `comptime` initializers in the same function body can run on
different native threads once their inputs are ready. On `fe008af5`, two jobs
shortened compilation for a pair of long independent loops. Making the second
initializer read the first result eliminated their overlap. The short independent
loops were fastest with one job. [Paired measurements and dependency control](temporal-opcode-research-journal.md#native-scaling-of-two-demanded-expressions-in-one-body)

The shared `SemanticPumpResult` protocol preserves continuations, cached
arguments and source effects across progress/waiting/completion/failure.
`sem_lifecycle_lowering_pump` mixes independent AggregatePrepare/Lowering work
with function-specific dependencies. `sem_lifecycle_queries_pump` now alternates
joined lowering and ready executed-stage producers through root-owned
`semantic_phase_work` joins. Required and inferred stages wait on signatures and
their owner; inferred work retains its KnownProof/KnownClone prerequisites.
Reached calls request the existing executable snapshots, so unrelated canonical
lowering no longer gates inference. Optional capture/effect policy is unchanged;
diagnostic publication still preserves the full lowering priority. Pumps join
before cross-phase mutation. Global initialization/effect proofs
and publication remain ordered. Only the owning quiescent pipeline diagnoses cycles.
The lifecycle/capture/type fixtures and actual mixed-kernel rendezvous have
source-specific journal receipts. They do not prove every staging capability,
all structural failure paths or final release equivalence. Current lowering/flow
admission and executable aggregate-component admission use checked result APIs,
typed resource failures and cancellation. Remaining invariant assertions are not
evidence that those allocations still use the historical fatal-admission path.
This is not a proof of every failure path; see the current
[source/evidence reconciliation](compiler_ecs_reconciliation_7e9c91a0.md), including
the separate uncharged LR scratch boundary.


## Retained source owners

One coordinator may replace explicit module snapshots through
`frontend_modules_source` between synchronous compilation calls. A bound
`ModuleEnvironment` and its compiler world stay alive; cached grammar snapshots
check source bytes and dependency paths before reuse. Invalid source-byte admission
preserves the previous input. This is not a persistent semantic-query cache.
`execution_session_compile[_sources_world]` closes the previous program, interpreter
storage and Fast cache before constructing a new checked program in that same world.
An explicitly stepped VM may be replaced at a call boundary; there is no supported
mid-compilation live-edit/cancel operation on this synchronous session API.

`tower-retained-source-updates` exercises same-name source edits and repeats,
dependent `decltype`/layout/comptime/body results, ordered effects, exact semantic
failure/repair and partial Fast execution replacement on retained owners. It uses
target64, serial/native2-worker budgets, observes actual LR overlap and checks
joined admission/final zero owners; it does not claim semantic-kernel overlap.
WorkGraph revision/profile/dispatch receipt validation remains a separate contract:
`work_reset` requires drained terminal tasks and a new identity, and rejects a
cancelled graph. `frontend_units_source` rejects started/finished batches;
`frontend_units_cancel` drains admitted workers before releasing borrows, and that
batch cannot be edited/restarted. Fresh-batch recovery is not retained invalidation.

## Concurrent compilation units

`compiler/frontend_units.tower` runs independent compilation units through the
same Tower worker dispatcher used by parser and semantic kernels. `CompilerWork`
queries name ordinary ECS entities; unit input/result components live on those
entities. Each unit owns an exclusive compiler world and module environment.
Within it, normal parsing, dependency queries, lazy `decltype`/`comptime` and
interpreter evaluation use the existing compiler services.

Create a batch with `frontend_units_create(count, budget, pointer_bytes, revision,
profile, bedrock, foundation, library)`. The grammar/library strings are copied.
Supply each one-based ordinal with `frontend_units_source(batch, ordinal, path,
source, length)` before stepping. Paths and bounded source bytes are copied;
bytes after the explicit length are excluded. Embedded NUL is rejected before
parsing; `frontend_units_error` and `frontend_units_error_offset` describe that
configuration failure immediately. The next valid configuration attempt clears
that diagnostic, and failed replacement preserves the prior source. Configure every unit before calling
`frontend_units_step(batch, wait)` repeatedly until it returns true. One
coordinator owns these calls; workers exclusively own the admitted unit worlds.
`frontend_units_environment` borrows a unit's environment before dispatch or after
all workers join, for module configuration, diagnostics and dependency output.
Do not retain that borrow across a step or disposal. `frontend_units_error_offset`
supplies the selected failure's source offset.

After a failed batch finishes joining, `frontend_units_failure_resource(batch)`
returns the resource cause recorded by the selected unit's program or grammar
diagnostic. The shared ledger reports `Capacity` on denial and the underlying
allocator reports `Memory` on physical refusal. A successful batch, cancellation,
or ordinary source error yields `None`. Inspect the existing source diagnostic
alongside this value. If several units fail, the lowest failing source ordinal
owns both the diagnostic and its resource cause. A later-arriving ordinary
failure at a lower ordinal clears a previously recorded capacity cause. A
failure at a higher ordinal leaves the selected cause intact. The accessor
returns `None` while workers are still draining.
At this boundary the recursive parser has already unwound,
and a new import read can observe changed bytes.

The implemented bounded API is
`frontend_units_create_bounded(count, budget, retained_bytes, pointer_bytes,
revision, profile, bedrock, foundation, library)`. It rejects zero and the
unbounded sentinel. The original create entry remains an explicit compatibility
wrapper without a finite declared-byte cap. Its `_result` variant preserves the
typed startup cause. `frontend_modules_create_result`,
`frontend_modules_bind_world_result` and `frontend_module_root_world_size_result`
likewise use checked module/root-world startup; failed construction retires
private owners before exposing an environment. Copied grammar/library/path/source
buffers reserve their exact capacity including NUL before allocation. Replacing
a configured input reserves the entire new snapshot while the old snapshot is
still live, then commits all buffers together. A denied cap or allocation failure
preserves the old configured input and receipt. Temporary replacement capacity
therefore counts against the limit. These are retained-byte reservations, not a
bound on parser/semantic/LLVM allocations, entity stores, or total process RSS.

For document/hover work, select `frontend_units_inspect(batch, ordinal, mode)`
before stepping. Compile and inspection jobs may share a batch and the same ECS
query protocol. After a successful join, `frontend_units_document` borrows an
inspection job's JSON; `frontend_units_program` returns only compilation jobs.
Invalid or incomplete inspected source may produce a recovered document with
`complete: false`; failure to create the query fails the batch. Cancellation or
any failed unit suppresses both kinds of result. Debug entity IDs/component counts
describe temporary world storage and are not stable semantic identifiers.

The implementation shares one synchronized budget between outer unit jobs and
each world's nested parser/semantic kernels. Each outer job reserves one lane; nested work
reserves available extras and also runs on its caller. Empty grants run inline
without waiting for capacity. Grants survive joins and result publication.
`work_budget_set_wake` arms a one-shot notification after denied outer lane
admission; nested release wakes the existing pool receiver, and
`frontend_units_step` refills eligible work while other units remain live.
B2's `baf2a5a0` admission fixture observes this on distinct threads, including
cancellation and byte/lane ceilings; it is not a full scaling result.
This bounds admitted compilation lanes, not retained idle OS threads or all heap
allocations. Hosts without a thread transport use the same queries with
the serial transport. Pools also respect transport capacity; nested browser
workers run their inner phases inline instead of waiting for occupied outer slots.
Worker count does not affect program semantics, canonical
Foundation or diagnostic order. Revision/profile tokens validate receipts; these
are not persistent incremental-cache identities.

After completion, check `frontend_units_cancelled` and `frontend_units_failed`.
The latter returns zero or the earliest failing source ordinal;
`frontend_units_error` borrows its diagnostic text. A successful batch exposes
borrowed `SemanticProgram` values through `frontend_units_program(batch, ordinal)`.
No failed or cancelled batch exposes programs. Keep the batch alive while using
its programs, entities or text. `frontend_units_cancel` drains admitted work;
`frontend_units_close` cancels if needed, joins, and releases all owned worlds.

Native `backend/units.tower` extends a configured frontend batch with backend
components and queries on those same unit entities. Call
`backend_units_create(frontend, count, budget, triple, library, optimize)` and step
with `backend_units_step(batch, wait)`. Attach before the first frontend step to
stream both phases through the frontend's shared pool. Each LLVM query depends
only on its own frontend query, so it can run while other units still compile.
The frontend budget bounds both phases together; the backend budget additionally
caps simultaneous LLVM jobs. A backend may also attach after frontend completion
to compile another target using its own pool. Attaching midway through frontend
dispatch is rejected. Each job owns its LLVM context/module/target machine and
borrows pinned Foundation input after its producer joins. Slots refill as jobs complete;
`backend_units_result(batch, ordinal)` exposes borrowed backend results only after
whole-batch success. Check `backend_units_failed`, `backend_units_error` and
`backend_units_cancelled`; cancellation drains admitted work before releasing views.
Before dispatch, `backend_units_library(batch, ordinal, library)` may override
the default entry-point policy for a unit. `backend_units_error_offset` supplies
the selected backend failure's source offset.
Streaming backends inherit that same declared-byte cap. Their copied target text
reserves capacity before allocation; LLVM exposes object length only after its
foreign allocation returns. The coordinator obtains a retained-output receipt
before publication, or destroys the rejected LLVM owner and reports failure.
Execution grants remain live through publication/bookkeeping. For a later
standalone backend phase, `backend_units_create_bounded(frontend, count, budget,
retained_bytes, triple, library, optimize)` caps its own retained target/object
bytes; the frontend's separately owned inputs remain live. In streaming mode the
explicit cap must equal the existing frontend cap. The original backend create
wrapper preserves compatibility. B2's bounded unit and backend-overlap checks
have recorded native passes; these paths still await the complete joined
threading, allocation-failure and sanitizer milestone described in the journal.
Close the backend batch before its frontend owner. A second backend batch cannot
acquire that frontend while the first still holds its lease. Failed target queries
settle without discarding completed frontend queries; explicit cancellation makes
the graph terminal. See [backend API](../scaffolding/backend/README.md).

Optional `frontend_units_observer(batch, context, event)` traces worker entry and
exit with `(context, CompilerQuery, ordinal, entering)`. Configure it before
dispatch and keep its context alive through all joins. The callback may execute
concurrently; it owns its synchronization and must not mutate compiler state.
`frontend_units_peak` reports shared pool occupancy, not a speedup measurement.

Target registration uses native platform once primitives. Browser backends use
isolated reactors. Linking retains exclusive ownership. The outer executor does
not remove remaining structural coordinator phases inside one unit.

The standalone ELF, PE, Mach-O and Wasm linker requests use `link.workers` as
their own pool ceiling; they do not borrow a frontend `WorkBudget`. Callers must
reserve that capacity in any enclosing executor. Current CLI multi-unit linking
starts after its frontend/backend jobs drain. Ordinary `BackendSession` link
plans explicitly select one linker worker, and browser compiler builds close
their compilation worker pool before linking the reactor. The standalone Wasm
link tool and linker fixtures also own their synchronous request. These caller
contracts do not establish shared admission for arbitrary concurrent embedders.

The legacy `host/llvm_worker.tower` transport owns one `BackendSource` and decoded
runtime object in its VM's default world. It has no per-request close export or
component finalizer: callers retain the VM through each synchronous compile and
copy returned bytes before reuse. A following request resets the previous LLVM
backend/decoder and generated link plan, while reusable vector capacity remains.
The latest backend result, canonical text, response, target, input/output capacity
and runtime bytes can therefore outlive a request. Explicit `BackendSource`
owners instead call `backend_source_close`; their supplied runtime bytes remain
borrowed and must outlive them. Foundation reconstruction retains the previous
valid text until recheck succeeds. Joined input/imported graphs and formatter
scratch retire before that recheck; frontend resource category and offset pass
to the existing backend receipt. A static allocation-failure response keeps the
category where supported; its source offset remains in the backend receipt.
Browser compilation-pool close terminates each
worker VM and awaits the transport's termination result. Dropping a cached
`loadLLVM` object relies on host garbage collection; its optional `close` call
does not currently perform a Tower teardown. Whole-VM retention measurements
remain separate from the native unit snapshot/object budget described above.

The native CLI accepts independent library units alongside its entry source:

```sh
towerc main.tower --unit math.tower --unit data.tower --jobs 4 -o app --depfile app.d
```

Each `--unit` is a separate compilation boundary, connected by ordinary exported
and external functions. Imports within each unit retain their normal semantics;
this is not shared import deduplication across units. The frontend and backend
batches use the services above with one total worker budget; `--jobs` also sets
the world budget for ordinary single-unit invocations. Omitted budgets use host
capacity. All units must compile successfully before linking. Failures select
the earliest unit in input order, and depfiles include each unit's imports.
Additional units currently require executable output; interpreter/library modes
and single-unit IR outputs are rejected. Multi-unit timings report aggregate
compile wall time, since frontend and LLVM work overlap.

Multi-unit CLI compilation selects the bounded API. `--unit-retained-bytes N`
overrides `DriverUnitRetainedByteLimit`, provisionally 268435456 bytes (256 MiB),
and requires an additional `--unit`. It accepts a positive finite decimal count;
missing, nondecimal, zero and overflowing values fail. The default remains under
validation against representative retained-byte peaks. It covers the service's
copied inputs/target and exposed retained objects; original driver input snapshots,
import caches, compiler/LLVM heaps and linker memory remain outside that count.
It is neither an OS memory limit nor a promise that compilation fits in 256 MiB.

The packaged driver measures the first unit's charged peak and uses it to
estimate how many later frontends can run together. At `aeba5225`, the default
cap admitted four later units after a light entry, then failed during their
overlapping semantic work. Each unit fit alone, and the batch completed with
one or two workers. The same four-job request passed on a host whose affinity
limited the pool to two lanes. [Invoice reproduction and measured overlap](temporal-opcode-research-journal.md#a-light-invoice-entry-can-over-admit-later-compilation-units)

Compiler-owned parser/diagnostic buffers use `compiler_buffer_allocate/free` and
the ordinary compiler allocator. Their private header records allocator and
optional diagnostic ownership so legacy host frees remain compatible. This is
not Foundation pointer metadata. The legacy `tower_memory_*` counter measures
its explicit single-owner allocation clients, not all compiler allocations;
production workers do not access it. Fault-injection tests use the serial runtime
and check exact buffer cleanup separately from real worker-overlap tests.

Entity stores install their borrowed `WorkBudget` at creation, before worker
handoff. The budget and its synchronization gate outlive every allocation.
Entity descriptors (including staged nodes), names, component/child/instance
indexes, archetype descriptors/signatures/rows, views/query plans and stage
descriptors/queues now own charged physical storage. Small descriptors reuse
stable pages; full and partial pages retain explicit owners. Workers allocate in
private stage pools, transferred to the store after joins and publication.
Replaceable indexes carry independent `WorkBuffer` receipts so a leased worker
never frees through a shared pool. Replacement admission includes the complete
old/new peak before releasing old storage. Denial preserves identities,
membership and links; successfully reserved capacity may remain with its owner.
Cancellation runs payload cleanup before releasing storage; pinned owners retire
only after the last joined view closes. No payload address or `Entity` layout
changes are required.

`entity_view_tables_result(view, terms, count, error)` and
`entity_component_remove_result(owner, type)` expose exact resource causes;
pointer/bool compatibility wrappers remain. A valid physical buffer larger than
its configured allowance returns `Capacity`, while malformed/overflowing sizes
remain `Invalid`. Flow uses its existing instance index and checked view/scratch
admission, preserving the original receipt before dispatch. The entity census
compares actual physical owners with charged live bytes and the strict cap
fixture requires real denial.
Ledger backing metadata is separately reported, not charged recursively to
itself. Client-owned allocations reachable through component pointers need their
own producer receipts; the entity library cannot account for arbitrary pointers.
Foreign LLVM heaps and allocator internals are outside this ownership budget.
This is an explicit ownership budget, not a process RSS
cap or a claim that all compiler allocations are charged.

Metadata copying exposes per-call `WorkBudgetError` results through
`compiler_node_copy_metadata_result` and
`compiler_node_copy_metadata_staged_result`; provenance uses the matching
`syntax_origin_copy_result` and `syntax_origin_copy_staged_result` functions.
The existing void/bool wrappers remain. Component admission and staged reference
queuing preserve their producer's exact result. Serial copies reject leased or
pinned mutation; staged copies require a new private destination in the supplied
stage and world. Serial same-store copies without a compiler world preserve the
metadata-free no-op used by standalone entity cloning. Callers discard an
incomplete destination on failure: this is
not transactional replacement of an existing payload. Provenance rule and splice
vectors now use their producer's world-budgeted work vectors, including staged
copy scratch; admission preserves `Capacity` versus physical allocation `Memory`.
Staged history fields remain borrowed after queue admission. The producer uses
`entity_stage_references_cancellable_result(stage, nodes, count, cancel, context)`
to register stable private cancellation metadata before installing those fields.
After joining workers, the coordinator calls `entity_stage_hold_result(stage)`
before closing the last input view. It acquires all pending references, including
duplicate targets, or returns `Exhausted`/`Busy` without transferring any of that
pending ownership; earlier successful holds remain owned. Repeated holds do not
retain twice. Publication also checks the combined component-type and queued
reference counts before committing either ownership transfer.

`entity_stage_discard_result` clears only unheld borrowed fields through their
callbacks, then runs ordinary finalizers so owned buffers still release. Source
owners/views must survive this cleanup on hold failure. Cancellation callbacks
must not release the borrowed targets, mutate the queue, or change other payloads.
Legacy `entity_stage_references[_result]` callers retain their existing behavior,
but without cancellation metadata discard must first acquire their ownership;
failure leaves the stage intact and returns its exact error. The void hold/discard
wrappers trap on error instead of wrapping counters or finalizing unowned fields.
Production provenance uses the cancellable protocol and releases its charged
private vectors through ordinary payload finalizers.

Joined body, declaration/discovery, evaluation-preparation and lowering waves
use `sem_stage_wave`. Its shared `compiler_kernel_stages_result` boundary consumes
the wave's input view: check every hold, close the view, then check every
structural publication before callers expose readiness. A prior dispatch error
skips transfer/publication. Hold failure discards partially held peers under the
view; publication failure discards the remaining held peers. Published structure
is not rolled back, but the failed wave exposes no ready results. The first
dispatch/graph cause wins; a worker resource receipt already present when an
ownership operation fails keeps its original message/offset. Ordinary deferred
worker diagnostics retain the owning pipeline's source-order policy.

The optional private-result cancellation callback runs for every job on failure,
before any remaining stage is discarded or job context cleared. Body/declaration
callbacks dispose unpublished evaluation buffers while their component addresses
are live; untransferred lexical lists/allocations remain result-owned until
pipeline teardown. Workers must already be joined, stages must use cancellable
borrowed payloads, and sources must remain owned through either outcome. A
transport `Busy` on entry admits no jobs from this wave and does not authorize
joining another owner's jobs. This helper does not dispatch, allocate, create
leases, or infer alias guarantees. Generic-body cloning and executable-function
preparation retain their own checked ownership boundaries; ROOT's execution
adoption is integrated with this caller migration.

Ordered containment also offers `entity_replace_child_result(parent, index,
replacement)` and `entity_take_last_child_result(parent, error)`. Replacement
checks all affected leases, including the displaced child, before changing links
or retaining the replacement; overflow reports `Exhausted`. Taking a child checks
that child's lease and transfers the parent's existing reference without retaining
or allocating. A null result with `None` means an empty valid parent. Existing
bool/pointer wrappers remain; callers needing an exact cause use the result APIs.

### Interpreter text and package owners

Interpreter diagnostics/output, including the reached type-constructor diagnostic,
use checked `work_vector(u8)` storage bound to the invocation/session world budget
before execution. Appending admits the entire replacement (including the NUL
presentation byte) before changing the counted value. A denied append sets the
first `IMState.storage_error`, fails immediately and preserves prior output;
returning capacity does not resume effects. Diagnostic allocation is optional:
failed state and the first offset survive an empty diagnostic. Constructor failure
moves its counted owner/grant to the invocation without allocating another copy.
Runtime driver/IDE and invocation callbacks use the same text operations.

Semantic diagnostic construction binds private scratch to the explicit source
node for its duration and restores the lexical current node on every exit. A
resource denial while constructing that message retains the same source offset,
including when a generated Foundation span differs. Already terminal declaration
admission returns without allocating or inventing a new `Memory` receipt from a
checked append's failure result. Plain diagnostics need no trace scratch list.

`execution_package_encode` and `bytecode_encode` return `WorkBudgetError` and take
initialized `work_vector(u8)` output owners. The old output remains live while a
complete replacement is admitted and survives every failed request. Encoding
checks bounds, envelope/checksum, the Fast cache's frozen target, profile and
encoded cache before publication. Canonical reconstruction remains the ordinary
Foundation formatter/checker; loading verifies that graph against the cache.
Package canonical formatting and IDE program formatting bind B1's checked
`FormatResult` storage to the session/world ledger. A formatter denial retains
its typed cause and leaves the caller's previous package intact, even when no
diagnostic allocation fits.
Package transfers include the physical budget grant. Keep its ledger/world alive
until consumers drain and dispose the owner. The browser transport copies bytes
before `tw_exec_bytecode_release`; failed replacement preserves the last owner.

Null-ledger standalone callers remain explicitly unbounded. This contract does
not account for untouched semantic presentation vectors, legacy unchecked
formatter callers, foreign diagnostic
formatting, host JSON/transport buffers, legacy IDE descriptors, allocator-private
overhead or VM/RSS. The semantic counted-error consumer reports allocation failure
without asserting, but its separate presentation vector remains outside this
ledger. Integrated physical allocator faults, sanitizers and release coverage are
separate ROOT-owned gates, not implied by these focused checks.
