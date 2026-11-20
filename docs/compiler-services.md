# Tower compiler services

`scaffolding/compiler/services.tower` is the compiler-services library entry
module. The native and Wasm builds import this same Tower module. It brings
together semantic checking, completion, document inspection, source metadata,
and the compiler's existing formatting services. These queries inspect the
ordinary syntax and Foundation entities and their components, bindings, named
relationships, and resolved types. Their result indexes are disposable views.

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
snapshot active at that source position. Keyword and punctuation queries follow
their nearest checked operation: declarations and initializers, assignment
destinations, pointer loads/stores, return statements, calls, block boundaries and
control flow. A closing function brace identifies that function. Structural
statements receive descriptions without fabricated value types. Unchecked custom
syntax uses its actual matched rules and captures instead of claiming a runtime
type. Whitespace and unattached comment text do not fabricate symbol hovers.

UI locations use `path/file.tower:line:column` consistently. A function signature
already contains `fn` and its return type, so the tooltip omits those duplicate
rows while retaining result size/alignment, comments and location.

This is an incremental library boundary, not a claim that the whole compiler is
already pure Tower or independently concurrent. Parser/session adapters and some
diagnostic presentation remain native, and the module registry still has its
existing lifetime/concurrency constraints. No new AST, symbol table, instruction
ABI, or host-dependent type resolver is introduced by these IDE services.
