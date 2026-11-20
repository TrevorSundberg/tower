# Tower compiler services

`scaffolding/compiler/services.tower` is the compiler-services library entry
module. The native and Wasm builds import this same Tower module. It brings
together semantic checking, completion, document inspection, source metadata,
and the compiler's existing formatting services. These queries inspect the
ordinary syntax and Foundation entities and their components, bindings, named
relationships, and resolved types. Their result indexes are disposable views.

The entry composes a link unit; it does not implicitly re-export source names.
Tower callers import the defining modules (`language-query`, `completion`,
`frontend-compilation` or `frontend-modules`) and their needed type modules.
Source visibility follows the [module scope rules](modules.md#module-scopes-and-aliases).
Completion and hover resolve aliases through those same scopes and display
original declaration names when flattened Foundation needs a unique spelling.

An IDE links these services directly. It does not need a language-server process
or protocol. The browser runs them in its existing cancellable worker and keeps
the returned document index for synchronous mouse lookup. It owns positioning,
dwell, painting and UI labels; it does not parse source or resolve types.

| Query | Tower entry points | Ownership |
| --- | --- | --- |
| Document / hover | `language_document(source, length, mode, pointer_bytes)`, `language_document_result(query)` | Copy the UTF-8 JSON result before `completion_dispose(query)`. |
| Completion | `completion_begin`, `completion_analyze`, `completion_symbols`, `completion_offer`, `completion_end` | One query owns recovery text and temporary analysis; dispose it after copying the result. The current native adapter supplies the active parser and lexical/grammar views. |
| Checking / diagnostics | `frontend_compile_sources`, `frontend_modules_error_file`, `frontend_modules_error_offset`, `frontend_modules_location` | Results belong to the semantic program and module environment. Keep them alive while reading diagnostics. |
| Module source position | `frontend_module_location(module, offset, line, column)` | Returned filename is borrowed from the module's source metadata. Offsets are UTF-8 bytes; line and Unicode-scalar column are one-based. |

Document modes are `0` for ordinary source, `1` for Foundation, and `2` for
Bedrock. Pointer width is explicit (`4` or `8` bytes). Configure the module
environment and its source files before querying. The returned ranges are UTF-8
byte ranges; JavaScript maps them to UTF-16 offsets solely for editor rendering.

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
already pure Tower or independently concurrent. Parser/session adapters and some
diagnostic presentation remain native, and the module registry still has its
existing lifetime/concurrency constraints. No new AST, symbol table, instruction
ABI, or host-dependent type resolver is introduced by these IDE services.
