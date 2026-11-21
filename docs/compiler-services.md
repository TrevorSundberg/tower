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

This is an incremental library boundary, not a claim that the whole compiler is
already pure Tower or independently concurrent. Legacy host adapters and backend
publication still need migration. Explicit compiler worlds, module environments
and editor jobs now have independent ownership. No new AST, symbol table, instruction
ABI, or host-dependent type resolver is introduced by these IDE services.


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
embedded NUL is rejected. Configure every unit before calling
`frontend_units_step(batch, wait)` repeatedly until it returns true. One
coordinator owns these calls; workers exclusively own the admitted unit worlds.

For document/hover work, select `frontend_units_inspect(batch, ordinal, mode)`
before stepping. Compile and inspection jobs may share a batch and the same ECS
query protocol. After a successful join, `frontend_units_document` borrows an
inspection job's JSON; `frontend_units_program` returns only compilation jobs.
Invalid or incomplete inspected source may produce a recovered document with
`complete: false`; failure to create the query fails the batch. Cancellation or
any failed unit suppresses both kinds of result. Debug entity IDs/component counts
describe temporary world storage and are not stable semantic identifiers.

The immutable budget is split between outer unit lanes and each world's nested
parser/semantic kernels. It bounds concurrently executing compilation lanes, not
the number of retained idle OS threads. Portable hosts use the same queries with
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

This service currently finishes at checked Foundation programs. Native CLI
project-recipe wiring and parallel LLVM/LLD execution remain separate work;
backend target initialization and linker globals must retain explicit ownership.
The outer executor does not remove remaining structural coordinator phases inside
one unit.

Compiler-owned parser/diagnostic buffers use `compiler_buffer_allocate/free` and
the ordinary compiler allocator. Their private header records allocator and
optional diagnostic ownership so legacy host frees remain compatible. This is
not Foundation pointer metadata. The legacy `tower_memory_*` counter measures
its explicit single-owner allocation clients, not all compiler allocations;
production workers do not access it. Fault-injection tests use the serial runtime
and check exact buffer cleanup separately from real worker-overlap tests.
