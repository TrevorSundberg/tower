# Tower compiler services

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
Early grammar phases, entity attachment and some candidate allocation outcomes
still need complete propagation; the getters do not establish coverage of every
allocation path.

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

The in-progress bounded API is
`frontend_units_create_bounded(count, budget, retained_bytes, pointer_bytes,
revision, profile, bedrock, foundation, library)`. It rejects zero and the
unbounded sentinel. The original create entry remains an explicit compatibility
wrapper without a finite declared-byte cap. Copied grammar/library/path/source
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

The draft shares one synchronized budget between outer unit jobs and each world's
nested parser/semantic kernels. Each outer job reserves one lane; nested work
reserves available extras and also runs on its caller. Empty grants run inline
without waiting for capacity. Grants survive joins and result publication.
This bounds admitted compilation lanes, not retained idle OS threads or all heap
allocations. Portable hosts use the same queries with
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
wrapper preserves compatibility. These new paths still await the complete joined
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
borrowed and must outlive them. Browser compilation-pool close terminates each
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

Compiler-owned parser/diagnostic buffers use `compiler_buffer_allocate/free` and
the ordinary compiler allocator. Their private header records allocator and
optional diagnostic ownership so legacy host frees remain compatible. This is
not Foundation pointer metadata. The legacy `tower_memory_*` counter measures
its explicit single-owner allocation clients, not all compiler allocations;
production workers do not access it. Fault-injection tests use the serial runtime
and check exact buffer cleanup separately from real worker-overlap tests.
