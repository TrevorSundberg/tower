# Tower browser playground

The real Tower node runtime, LALR parser, grammar bootstrap and lexer run in
`tower.wasm`, compiled with **Clang / WASI SDK and `-fno-exceptions`**. CodeMirror 6
provides the temporary desktop/mobile editor. The JavaScript UI receives parse
trees, grammar snapshots, diagnostics and highlight spans from Tower.
The immutable C++ seed initializes `bedrock.tower`; its result initializes
`foundation.tower`, which initializes user source. Every file applies declarations
incrementally to its own active grammar. Both modules are loaded at runtime.
C++ retains the pattern engine, pattern/template scanners, literal decoding and
the implementations of grammar installation and foundation operations.

## Try the built page

Live playground: **https://trevorsundberg.github.io/tower/**.

From this directory:

```powershell
npm run serve
```

Open **http://127.0.0.1:4173/**. The server only serves static files; parsing runs
in a browser worker. Source edits remain on the device and the latest document
is saved with its filename and selected document in this origin's local storage,
so refreshing keeps the dropdown and editor in agreement. **Restore** reloads the selected document's bundled source;
editor undo can restore the previous text. **Save** downloads a `.tower` file.

Recognized older Foundation files saved by the editor upgrade automatically,
including the old lexer-only file. Unchanged shared definitions now inherit from
Bedrock; custom lexical and grammar edits are retained. Before replacing a saved
module, its original text is kept locally under
`tower-playground-foundation-before-inheritance-v1`. Unrecognized modules are
preserved. The migration also handles old text stored beside a newer baseline.

The parse tree shows the entire source under one **Document** root, in reading
order. Expand any declaration or statement and select a node to highlight its
source. Replacement entries highlight their invocation and show the fully expanded
text inline at the affected subtree. Children are rendered lazily.
**Show tokens** reveals punctuation and terminals. **Active grammar** shows the
final installed rules; earlier tokens retain their original classifications.
Edits automatically reparse using the warm worker and cached grammar tables.

Source errors appear directly below the affected editor line, with an underline,
gutter marker and line/column location. Missing syntax at end of input gets a
caret marker. The error card has a filled trapezoid connecting it to the width
of the marked text; wrapped tokens connect at their final visual row. Its border
and rounded corners form one outline, including at the left and right edges.
At an edge the adjacent top corner becomes straight, keeping the connector a
trapezoid rather than leaving an inset notch.
Select **Error · Ln …** in the editor footer to jump to an offscreen
error. Editing retains the diagnostic through the debounce. A successful parse
clears parse errors immediately; successful semantic compilation clears old
semantic/runtime errors before execution finishes. Grammar-driven diagnostics
list valid continuations and cite the requiring rules and their definition
locations. A bounded insertion probe can suggest a missing literal (including
custom keywords), with its caret at the insertion gap. It never changes source
or executes a repaired program. Ambiguous repairs remain expected alternatives.
The parser still stops at its first error. File-loading and runtime
failures without source locations appear separately below the workspace.

Shared prefixes use lookahead: `parse Statement |= ForEach | 'for';` supports
both the complete loop and the standalone keyword. A malformed loop after `for (`
is an error; parsing does not backtrack to the shorter statement. Ambiguous
boundaries such as `'x' | 'x' 'x'` report a shift/reduce conflict when the grammar
is installed. Failed declarations leave the previous grammar intact.

Choose **Token rules** in the example selector to redefine identifiers, numbers,
strings and comments in Tower. Select **Bedrock** or **Foundation** in the editor
dropdown (Bedrock, Foundation, ForEach, then the other examples) to switch to either real module. **Bedrock** edits the declaration grammar;
its edits affect following declarations in Bedrock as well as downstream modules.
**Foundation** edits the ordinary tokens and function/statement grammar. Both
execution workers use the selected modules. Source, Bedrock and Foundation have
separate buffers and undo histories. **Restore** reloads the selected document's
bundled version. All three files persist in local storage;
**Save** downloads the current file. A static page does not write to the repository.
See [token syntax and precedence](TOKENS.md).

Foundation inherits Bedrock's actual grammar/token entities. Whitespace, line and
block comments, Identifier and String are defined only in Bedrock; Foundation adds
Number and executable syntax. Changing a shared Bedrock pattern affects both
downstream declaration reading and ordinary source. A local override creates a new
binding without mutating the imported entity. The file's declaration lexer uses
that active binding too; no separate fixed lexer protects later declarations.
Declaration-specific names use `Grammar` consistently, such as GrammarAssignment
and GrammarSequence. These rules can be referenced, replaced or extended normally.
There is no reserved `__` prefix. Generated table helpers avoid all declared names.

All files use the same execution area and controls. Its instruction column shows
compiled foundation operations, never a copy of the grammar declarations being
edited. Grammar declarations use the same formatter as executable foundation
nodes through the formatting API. Grammar declarations,
alternatives, terms and replacement templates carry semantic components on their
actual parse nodes. The native seed uses this same entity model; its formatter
output is the bundled bedrock file. Declaration order, `=` versus `|=`, token
styles, captures, replacement bodies and comments survive formatting/reloading.
Canonical declaration text uses the native/default bedrock spelling, even if an
edited input bedrock renames keywords. Templates retain their source language.
Comments within a declaration may move before it; template comments stay inside.

For example, changing `'parse'` to `'rule'` in `GrammarDeclaration` uses `parse` for
that declaration, then requires `rule` for following declarations in the same file
and downstream modules. Required semantic capture names remain part of
the current native handler contract. Grammar errors install atomically; existing
sessions pin their original module versions. Bedrock declaration-rule replacement
handlers are not implemented; ordinary source replacements remain supported.
The host currently performs this load order. Future imports should express
foundation importing bedrock and user modules importing foundation.

Choose **Replacements** to try `=> replace { ... }` in the real
WASM compiler. The example expands `increment`, an `add_one` chain, nested
`foreach` forms into Loop trees, and repeated statement captures. The tree pane
shows the expanded result and replacement count. Generated nodes are marked;
select one to see its invocation span and template source coordinates. Named
captures remain visible even with Show tokens disabled.

Each replacement preview reconstructs its own final subtree, including nested
chains and duplicated captures. Chains share a preview at their resulting root;
copied captures retain separate previews at each occurrence.
It uses final token text, with readable spacing and indentation. String contents
are preserved; skipped comments and original whitespace are not reconstructed.

Replacement templates are parsed when the grammar becomes usable, and ordinary
invocations splice trees without reparsing source text. Single-use captures move;
repeated uses get independent copies. Errors in templates are shown inline.
See [replacement semantics and current limits](../docs/parser.md#rule-replacements).

The bottom status line describes the current parser session. Grammar revisions
count declarations in the open document, excluding its imported foundation.
Future declarations are only
installed when the parser reaches them. After an error, suffix highlighting
uses the last successfully committed grammar.

To test from a phone on your local network, serve on a LAN interface, then use
the computer's LAN address in the phone's browser (local firewall rules apply):

```powershell
$env:HOST = '0.0.0.0'
npm run serve
```

Alternatively upload the **contents of `dist/`** to any ordinary static HTTP(S)
host. All dependencies are bundled; there are no CDN scripts, API servers,
cross-origin isolation requirements or shared-memory requirements. Keep the
relative file layout. Serve `.wasm` as `application/wasm`. Opening `index.html`
directly with `file://` does not provide the fetch/worker environment required.

## Build

Prerequisites: Node/npm; CMake, Ninja and WASI SDK 34 for C++ compilation.
Windows can use WSL for the SDK build and Windows Node for the page bundle.
The SDK setup script pins the release and verifies its SHA-256.

From the repository root on Windows:

```powershell
wsl --exec bash /mnt/c/Sandbox/tower/playground/scripts/setup-wasi.sh
wsl --exec bash /mnt/c/Sandbox/tower/playground/scripts/build-wasm.sh
cd playground
npm ci
npm run build
npm run serve
```

On Linux, run `bash playground/scripts/setup-wasi.sh`, then
`bash playground/scripts/build-wasm.sh`. Set `WASI_SDK_PATH` to use another SDK
location. The core build output is `build/browser-wasi/tower.wasm`. An equivalent
direct CMake configuration is:

```sh
cmake -S . -B build/browser-wasi -G Ninja \
  -DCMAKE_TOOLCHAIN_FILE="$WASI_SDK_PATH/share/cmake/wasi-sdk-p1.cmake" \
  -DTOWER_BOOTSTRAP_COMPILER="$(bash playground/scripts/build-bootstrap.sh)" \
  -DCMAKE_BUILD_TYPE=Release -DTOWER_BROWSER=ON
cmake --build build/browser-wasi
```

If moving the SDK after configuring a build, pass `--fresh` to `build-wasm.sh`
(CMake 3.24+) to reset the cached toolchain path.

The module uses WASI Preview 1 as a reactor (`-mexec-model=reactor`). It links
wasi-libc and libc++; it does not use Emscripten, exception handling or threads.
Expected parse and grammar errors use explicit return values. Internal invariant
assertions and unrecoverable allocation failures can still stop an instance.
The worker reports failures and the next analysis can create a fresh instance.

## Execute Tower's foundation

Choose **Execution** in the example selector. **Auto execute** is on by default,
so the example runs immediately and runs again as you edit. The example
prints `15` and `16`: its Tower-defined `increment` syntax expands to addition,
and a pointer aliases the accumulated total. Disable **Auto execute** for manual **Execute** runs; the preference
is saved in this browser. Five persistent columns show Tower instructions as
compilable Foundation source, LLVM raw, LLVM optimized, interpreter output,
and LLVM output. There is no separate compact interpreter bytecode yet.
Choose **Functions** for typed calls, recursion and pointer arguments; it prints
`720` and `721`. Every execution starts interpreter and LLVM workers in parallel.
Choose **Increment** for Tower-defined prefix/postfix syntax on assignable places.
The same two CoreCall replacements work as standalone statements, assigned values,
call arguments and arithmetic operands. They take the place's address once and
call ordinary i32 helpers; this example is not a type-generic function facility.
It prints `5`, `6`, `7`, `7`, `9`: postfix returns the old value and prefix the new
value. Inspect LLVM optimized for eliminated helper calls and temporaries.
Completion automatically compares output, status, trap messages/locations and
truncation. A missing backend reports comparison unavailable; a difference is
shown as a mismatch. Matching truncated output is explicitly labelled as captured
results, not a comparison of text beyond the output limit.

`scaffolding/foundation.tower` defines the shared editable module. Examples inherit
it without a generated grammar prefix. The C++ compiler consumes the expanded
trees directly, attaches typed semantic components to those same nodes, and uses
them for interpretation and LLVM lowering. It never executes the debug token reconstruction. The current bootstrap semantic ABI recognizes the
`Core*` rule labels and their named captures. Renaming a keyword while retaining
those trees works; introducing an entirely new semantic operation still needs a
native handler or a replacement into existing operations.

The current subset supports `i32`, `u32`, `u8`, `i64`, `u64`, `usize`, `bool`, raw typed pointers, lexical blocks,
mutable declarations, one-operation assignments, comparisons, arithmetic and bit
operations, `if`/`else`, `loop`, `break`, `continue`, `print`, typed functions,
arguments, calls, returns and named structs with typed fields. Forward calls,
type references and recursive pointer fields are supported. Conditions must
be bool. There is no base precedence hierarchy. `convert(u32, a)` checks numeric
range; `bits(Type, a)` reinterprets equal-width integers/pointers. Fixed arrays,
indexing, heap allocation/reallocation/free, byte copy/fill, pointer arithmetic,
UTF-8 string literals, sizeof/alignof(and) extern/export functions are implemented.
Floats, closures, indirect calls and aggregate-by-value ABIs remain future work.

Calls, address-taking and loads are operands, including inside arguments, returns,
conditions and indices. Arguments and binary operands evaluate left to right;
assignment captures its destination address before evaluating the right side.
Nested calls remain resumable and cancellable. Foundation still has no arithmetic
precedence hierarchy: a binary value contains two operands and one operator.

Integer addition/subtraction/multiplication wrap at the operand width. Division by zero
and signed division overflow trap. All statements are type-checked before any
execution, including unreachable branches. Pointers are raw target addresses;
there are no implicit object bounds, initialization or lifetime checks. Invalid
raw access and uninitialized reads have no portable defined result. Safe layers
belong above this foundation. Functions have lexical locals and explicit arguments;
they cannot capture the entry program's locals. Returning a pointer does not extend
a local's lifetime. The interpreter models addresses in its own byte memory;
compiled code uses real target pointers.
Generated operations retain invocation source locations for errors; captured
operands retain their original locations.

Choose **Structs** for the new data/type milestone: define a `Pair`, initialize its
fields, pass its address to a function, modify a field, and alias a field through
an `i32*`. Both runners print `42`, `22`, `7`. `pair.first` works on a value or a
single pointer to a struct; `&pair.first` takes a raw field pointer. Nested
inline structs and recursive pointer fields work. Whole-struct copies,
printing and passing/returning structs by value are currently diagnosed.

Built-ins and user structs resolve through one type-object registry, with size,
alignment, field types and offsets. See the [struct layout and alias contract](../docs/foundation.md#struct-milestone).
Reflected layouts now match actual byte storage for the selected target. The
included C fixtures verify scalar, pointer, buffer and struct-pointer ABI calls.
Choose **Memory** for a growing byte buffer and indexed arrays.
Unmodified saved Foundation defaults upgrade with the bundled module;
customized modules are retained and can be reset with **Foundation → Restore**.

Typing waits for a **200 ms quiet period**, reset by each edit, before parsing,
highlighting, diagnostics and auto execution update together. There is no second
execution delay. Opening a document and explicit Execute bypass the debounce;
IME composition defers automatic work. Syntax-only examples remain parser
demos. Cancel stops the current source revision until another edit or explicit
execution; re-inspecting it does not restart a cancelled infinite loop.

Compilation and execution run in **one worker per backend**, separate from live parsing.
Each column shows its own progress. **Cancel** terminates whichever workers remain;
editing also cancels them and keeps the last output/errors visible until new
results arrive. Completed workers retain
their compiler and grammar state; each new run gets fresh program memory and
obsolete replies are rejected. Execution has no elapsed-time cutoff;
the interpreter runs bounded instruction slices. LLVM compiles, optimizes, links
and executes inside that same worker; terminating it also interrupts
a non-cooperative compiled infinite loop. Output is batched and capped at
64 KiB so a printing loop cannot flood the UI. Core compilation is limited to
256 functions, 64 parameters per function, 4 MiB storage per function,
65,536 semantic nodes and 128 nested blocks. Runtime limits are 128 call frames
(including entry), 4 MiB of interpreter stack and 256 MiB of execution memory.

The toolbar combines the brand and file controls. The page fits the
viewport on desktop and mobile; editor, tree, output and instruction panes scroll
internally when needed. On phones the equal-width result columns scroll horizontally.
Steps and separate compilation/execution timings sit at the bottom. Interpreter
Execution and Wasm Execution have separate output columns. Wasm disassembly decodes
the actual linked binary using LLVM, including linked runtime functions; its addresses
are file offsets. Its download footer shares the native disassembly-column layout.

The compilation path is expanded Tower nodes enriched with typed foundation
components -> interpreter or LLVM -> linked executable WASM. Across isolated WASM
modules, the program is shared as canonical foundation text and resolved with the
same foundation grammar, node schema and verifier. No binary Tower program format
or separate debug instruction language remains. It lowers ordinary locals to entry allocas, runs
SROA/mem2reg plus O2, verifies the LLVM IR, emits an object and links it with LLD.
Address-taken locals remain ordinary allocas; typed raw pointers lower to LLVM ptr.
No language exceptions or user phi nodes.
Dispatch canonicalization and incremental compilation remain future work.

Current spelling is `var answer: i32 = add(20, 22);` and
`fn add(a: i32, b: i32): i32 { ... }`; void calls use `f();`.
Types are parsed as ordinary identifiers and checked by the semantic registry.
An initializer can supply the variable type: `var answer = add(20, 22);`.
Choose **Inference** to try calls, comparisons and raw addresses with inferred
types. Canonical Foundation output writes the checked types explicitly.
Bare integer literals default to i32; typed operands constrain literal peers,
and mixed typed operands still require explicit conversions. Module variables
can infer through forward references, with dependency cycles diagnosed before
execution; initialization order is unchanged. Local scope remains lexical.
Inference uses the initializer only; parameters and return types remain explicit.
Language-level reflection remains follow-up work.
Canonical output uses backtick-quoted identifiers when an extended lexer allows
names such as `player-name` or names colliding with foundation keywords. Escapes
preserve backticks, backslashes, tabs and newlines; semantic names remain unchanged.
See [foundation direction/tasks](../docs/foundation.md).

## Native output and browser cross-compilation

The checkbox picker left of **Auto execute** enumerates these supported executable
profiles. Each native entry displays its actual compiler triple:

| Target | Compiler triple | Download |
| --- | --- | --- |
| WebAssembly | `wasm32-unknown-unknown` (browser module) | `.wasm` |
| Windows x64 | `x86_64-pc-windows-msvc` | `.exe` |
| Linux x64 | `x86_64-unknown-linux-gnu` | `.elf` |
| Linux ARM64 | `aarch64-unknown-linux-gnu` | `.elf` |
| macOS x64 | `x86_64-apple-macos11` | `.macho` |
| macOS ARM64 | `arm64-apple-macos11` | `.macho` |

The interpreter always runs. WebAssembly adds LLVM execution and automatic result
comparison. Each selected target has its own disassembly pane and download footer;
native pane titles are just the target name plus "disassembly". Native profiles
compile sequentially in one retained worker, sharing a single LLVM instance and
loading only the selected profiles' support packs. LLVM raw/optimized panes label
each profile when several are selected. Columns stay equally sized and scroll
horizontally when needed. With every target unchecked, only Tower instructions
and the interpreter remain. **Cancel** or an edit terminates pending workers;
completed compiler workers and target inputs are reused. Disabling all native
profiles releases their idle worker; canceling active work discards its cache.

First visits select WebAssembly plus a suggested supported native profile.
OS and architecture are inferred independently, preferring browser client hints
with a bounded 200 ms wait. When architecture is hidden, macOS defaults to ARM64
(an "Intel" UA is ambiguous), Windows/Linux to x64; completely unknown browsers
default to Windows x64. These are explicit heuristics, not measured market-share
claims or CPU capability detection. Known unsupported OS/architecture combinations
(including Android, iOS, Chrome OS, Windows ARM64 and 32-bit native hosts) default
to WebAssembly. The picker explains its suggestion; users can always override it.
Saved selections take precedence, including all-off selections. Older x86/ARM
group choices migrate to the corresponding platform entries. No probing or
network lookup is used, and detection never changes a target's layout or semantics.

Tower instructions, LLVM raw/optimized and x86/ARM64/Wasm disassembly use read-only
CodeMirror views with incremental display lexers and viewport rendering. Unchanged
output is not re-highlighted on phase/timing updates. Full documents remain
selectable/copyable while only visible lines create DOM nodes. These display lexers
do not parse or define Tower semantics; the compiler still supplies canonical
foundation source through its shared formatter.

32-bit native support remains planned: Cortex-M (for example `thumbv6m-none-eabi`
and `thumbv7em-none-eabi`) and RV32 (`riscv32-unknown-elf`, with explicit ISA/ABI
profiles) are useful embedded candidates. They require backend inclusion, target
legality/layout tests, board startup/linker scripts and runtime/effect policies
before they become supported downloads. WebAssembly already uses 32-bit addresses.
Windows ARM64, mobile platforms and GPU profiles also need their own validated
runtime/ABI implementations; they are not silently aliased to an existing profile.

**Link files** adds matching objects/archives; **Clear link files** removes them.
Prefix an input name with `windows--`, `linux--`, `linux-arm--`, `mac--`, `mac-arm--`
or `wasm--` to restrict it to that target. Unprefixed files go to all selected
targets and must therefore be compatible. Files stay local to the browser.
Object/library emission remains available through the compiler API and CLI;
library objects omit `tower_main` and reject executable top-level statements.

All compilation/linking runs in Wasm, with our in-memory WASI host. Native targets
load the larger `tower-cross.wasm.gz` only when requested and decompress it in the
worker using the browser's native gzip support. Small support packs provide
Linux syscall startup/allocation, Windows console/heap imports and macOS libSystem
imports. These are not full SDKs: extra libraries and their transitive dependencies
must be supplied for the selected target. This compiles Tower, not arbitrary C++
source; build third-party C/C++ libraries for that target with their own toolchain.
Native files run on their target OS, not inside the page. macOS files need execution
validation on a Mac and normal platform signing/distribution treatment as applicable.

Build the native-target browser module/support packs under Linux or WSL:

```sh
TOWER_BROWSER_CROSS=ON bash playground/scripts/build-llvm.sh
bash playground/scripts/build-targets.sh
npm run build --prefix playground
```

Build the standalone native compiler with an installed LLVM development package
(tested with LLVM 19, clang and lld on Ubuntu 24.04 under WSL):

```sh
bash playground/scripts/build-native.sh
build/native/towerc scaffolding/examples/memory.tower -o build/memory
build/native/towerc scaffolding/tests/linking.tower --link build/linking/native-fixture.a -o build/linked
build/native/towerc scaffolding/library/storage.tower --library -o build/storage.o
build/native/towerc scaffolding/library/bytes.tower --library -o build/bytes.o
build/native/towerc source.tower --target wasm32-unknown-unknown --link library.a -o build/program.wasm
```

`--emit object|llvm|llvm-optimized|exe`, `--target`, `--link`, `--cc`, `--linker`
and `--sysroot` control emission/tool selection. `--interpret` uses the portable
interpreter. The current native driver locates Bedrock, Foundation and runtime.c
in its build-time source checkout; it is not yet an installed relocatable SDK.
The browser includes already-built runtime packs; the native driver compiles its
runtime with Clang and invokes the selected linker/compiler driver. Windows linking
can use the small `build/targets/kernel32.lib` import library without a full SDK.
General native libraries can require a matching SDK/sysroot and additional inputs.

`loadLLVM(...).compile(source, {target, inputs, emit, library})` exposes the same
object/archive path to JS tools. For interpreted foreign calls or Wasm host imports,
register `imports: {name: (context, ...args) => result}` with `loadTower` or
`executeWasm`. Context provides a fresh byte-memory view, allocation and free.
Use BigInt for i64/u64. A native library cannot execute through this callback API;
it must be compiled/linked for the execution target. The C fixture tests cover
both directions, including a C function calling an exported Tower function.

`scaffolding/library/platform.tower` defines a first portable binding:
`platform_write(stream: u32, data: u8*, length: usize): i64`. Stream 1 is stdout,
2 is stderr; the result is bytes accepted or -1. Buffers are borrowed during the
call. Native runtime packs and browser hosts implement it; the playground combines
both output streams and decodes UTF-8 across writes. This is runtime I/O, not an
implicit deterministic compile-time effect. Files, clocks, networking and a
general import/module system remain future work.

`executeWasm` also accepts `imports: {name: {wasm: instance.exports.function}}`:
the exported Wasm function is bound directly without a JS function body. It may
come from `table.get(index)` as well. Pure Wasm hosts can bind imports directly
without JS. This is binding-time table selection, not source-level indirect calls;
pointers across instances need an explicit shared-memory ABI.

Foundation built-ins use ordinary call grammar: `print(42);`, `alloc(u8, 64)`,
`free(p);`, `sizeof(Type)` and `convert(Type, value)`. Functions/types/module
variables resolve forward; initialization stays in source order. Grammar rules
may refer forward while inactive, but their complete dependency closure must
resolve before activation, and outstanding references fail at module completion.
GrammarPattern and GrammarTemplate now live in Bedrock as editable contextual
token and recursive grammar definitions, using the same nodes and formatter.

Validation commands:

```sh
bash playground/scripts/test-linking.sh
bash playground/scripts/test-windows-linking.sh
node --test playground/tests/raw-memory.test.mjs
node --test playground/tests/cross-compilation.test.mjs
```

The checked-pointer prototype is preserved at commit `8571a8d`; the migration
details and safe-layer follow-ups are in the research journal.

## Compiler implementation moving into Tower

`scaffolding/compiler/utf8.tower` implements scalar decoding, encoding and source
validation. The native compiler, browser parser and both browser LLVM compilers
link its compiled object and call it directly from the lexer/parser. It uses the
ordinary Foundation grammar, shared semantic nodes, interpreter and LLVM lowering.
It needs no allocator, runtime imports or special compiler opcode.

The codec accepts Unicode scalars, rejecting overlong encodings, surrogate values,
invalid continuations, truncation and values above U+10FFFF. Decode returns bytes
consumed (zero on failure), clearing the output scalar on failure. Encoding with
a null output queries the size; insufficient capacity writes nothing. Validation
has an explicit NUL policy: source text rejects NUL, general byte buffers may
contain it. This also fixes the older raw parser decoder's permissive handling of
malformed UTF-8. Buffer lifetime/length validity remains the caller's responsibility;
the decoded output scalar must not overlap its input buffer.

`scaffolding/library/bytes.tower` now owns the compiler's source-text storage.
Parsing, replacement templates, raw UTF-8 streams and retained grammar provenance
use its byte buffers; parsing and provenance share one immutable source snapshot.
The temporary C++ `CompilerText` adapter only manages ownership and exposes views.
Growth, self-copying, NUL termination and disposal are Tower functions, with narrow
host `realloc`/`free` bindings (wasi-libc in browser compilers). No host services
are invoked from the editor thread. Source buffers remain alive while any grammar
node/cache retains them, and an allocation failure is reported before parsing.

Byte buffers grow geometrically with overflow checks. `bytes_assign_text` copies
an explicit byte span, adds a terminator outside its length, and handles overlapping
self-slices. `bytes_append` supports self-append across moving reallocation.
Failed growth/overflow/invalid self-slices leave all existing state unchanged.
Callers still own raw pointer validity, initialization and disposal. Do not duplicate
ownership by copying the struct; metadata must be separate from input/data storage.
The arena/map helpers remain in `library/storage.tower`; until imports exist,
concatenate both library files before `tests/storage.tower`, or link their objects
with matching declarations. The compiler currently uses the byte buffer, not those
arena/map helpers.

`scaffolding/library/entities.tower` now implements the compiler's actual shared
entity/component store. `TowerNode*` and `TowerComponent*` are opaque C++ views of
those same Tower allocations. Creation, reference ownership, ordered/named child
relationships, component registration, lookup/removal and type-based query indexes
run in Tower. Stable component payloads accommodate existing C++ semantic objects;
query indexes grow independently and use swap removal. Structural edits invalidate
query positions, and removal/destruction invalidates borrowed payload pointers.
This first store is single-threaded and uses sparse stable payloads, not archetype
columns, safe handles, access scopes or jobs. Ownership cycles remain invalid.

`scaffolding/compiler/parse-tree.tower` implements parser forest concatenation,
lazy capture wrappers, generated-node flattening and ownership transfer into those
entities. It preserves O(1) fragment concatenation and visits each flattened
fragment once. CMake temporarily composes it after `entities.tower`; this is not a
new import syntax. `compiler/generics.tower` uses the same entities for type-function
specialization, bindings, provenance and iterative syntax cloning.

`compiler/parser-nodes.tower` owns rule, reference, token-string, range and match
payloads, including their text and arrays through `vector(T)`. Native consumers
borrow opaque payloads through accessors; they do not mirror their field layouts.
`compiler/lexer-table.tower` owns flat DFA transition rows and performs Unicode
maximal-prefix matching. These tables are derived caches. Regex notation is now
defined in `compiler/regex-grammar.tower` using the ordinary grammar components
and parsed by the same LR engine over Unicode scalars. Its parse tree stays on
shared entities. NFA/DFA lowering, the LALR table builder, recognizer control loop, higher-level grammar/foundation
payloads, formatter and backends still contain C++ to migrate.

The remaining native node adapter binds allocation and existing C++ component
destructors. Its lifecycle registry lasts as long as static compiler caches; the
Tower store retains each type until its payload destructor has finished. Ordinary
Tower clients can use plain components with lifecycle zero, or supply the declared
`tower_entity_finalize` dispatch through the existing external-call mechanism.

The transitional native build first makes `towerc-seed` using the independent
C++ references in `scaffolding/bootstrap/`. The seed compiles the entity store,
parse-forest routines and Tower specializer. `towerc-stage1` links those components
and can then compile generic parser/lexer components using `vector(T)`; the final
compiler links those as well. The seed algorithms
are absent from normal compiler targets; tests retain them as references.
Generated objects stay in ignored build directories, and dependencies include
the compiler executable, utility source, Bedrock and Foundation.

The build scripts prepare the intermediate compiler automatically, currently requiring host Clang,
CMake/Ninja and LLVM 19 development libraries (`LLVM_CONFIG` can override the
config tool). Set `TOWER_BOOTSTRAP_COMPILER` to an existing host compiler to bypass
building those stages; it must support type functions/templates. Direct CMake
builds accept the same cache option. Bootstrap
commands pass `--bedrock file --foundation file` explicitly so an external compiler
uses this checkout's grammar modules. These driver options are also available
for normal builds; they are host loading controls, not language imports. The native
build produces `build/native/towerc`, `towerc-seed` and `towerc-stage1`.
The eventual distribution will include self-contained bootstrap Tower compiler
binaries for Windows/macOS/Linux in the repository; those binaries are not shipped
yet. General module imports and the rest of the compiler migration remain future work.

```sh
bash playground/scripts/test-bootstrap.sh
bash playground/scripts/test-native-core.sh
node --test playground/tests/compiler-utf8.test.mjs
node --test playground/tests/compiler-bytes.test.mjs
node --test playground/tests/compiler-entities.test.mjs
```

The bootstrap check compares earlier-stage and final-compiler optimized LLVM
and object bytes for Linux, Windows, macOS and Wasm. The generic parser/lexer
components use stage1 as their reference builder. UTF-8 has no runtime dependencies;
byte buffers allow only allocation/copy primitives and the Wasm stack-pointer symbol.
The entity/parser module also permits the allocation and component-lifecycle
bridges. This verifies the migrated compiler pieces, not a fully self-hosted compiler.
Parser payload tests cover ownership, aliasing, growth, default metadata and failed
allocations. Lexer tests compare the Tower matcher with the seed on 500 randomized
automata, Unicode/invalid UTF-8, every input offset and partial allocation failure.
Native tests cover every Unicode scalar, every one/two-byte input,
random malformed buffers and inaccessible-page boundaries. The C++ host/tests run
under sanitizers; generated Tower objects currently do not carry sanitizer
instrumentation. Wasm tests also compare the codec with TextEncoder/TextDecoder,
interpret it at both pointer widths and compile its canonical Foundation output.
Buffer tests force allocation movement/failure, check guards and unchanged state,
compare 20,000 operation sequences, retain source nodes across resets/destruction,
check exact allocation balance and exercise interpreter/Wasm layout agreement.

The explicit LLVM instruction-combining pass uses `no-verify-fixpoint`, matching
production O2 behavior. Its textual spelling otherwise enables a developer-only
assertion that rejects valid code needing more than one worklist iteration (first
exposed by buffer growth on LLVM 19). This does not disable IR verification:
`VerifyEach` and module validation remain enabled.

## LLVM module

`bash playground/scripts/build-llvm.sh` builds native `llvm-tblgen` from the
repository's LLVM revision, then cross-compiles the Tower LLVM backend and LLD to `build/browser-wasi-llvm/tower-llvm.wasm`. This is a considerably
larger build. Run `npm run build` afterward to include it in `dist/`.

The script keeps a revision-pinned snapshot of a clean LLVM checkout and its
intermediate build under `~/.cache/tower/`, avoiding slow Windows/WSL header I/O.
It refuses to snapshot a dirty LLVM checkout. Set `TOWER_LLVM_SOURCE_DIR` to use
local LLVM edits directly, and a separate `TOWER_LLVM_WASM_BUILD` /
`TOWER_LLVM_HOST_BUILD` for an alternative build. `TOWER_BUILD_JOBS` controls
parallel compilation (default 6). The checked-in vendor directory is preserved.

LLVM loads on demand inside the execution worker. It consumes canonical foundation text
and emits a linked executable exporting `tower_main`, with Tower's
`print`/`trap` host imports and declared foreign imports as needed. The playground supplies its built-in imports and
source/name metadata. The downloaded WASM also needs those imports when embedded
elsewhere. This ordinary execution module includes only WebAssembly. The optional
export module adds the CPU targets/linkers described above; enabling it builds
both reactors in one cache without repeatedly rebuilding LLVM for different target lists.

`src/wasi-host.mjs` is Tower's own small WASI Preview 1 adapter, with memory-backed
files, standard streams, clocks and entropy. It replaces the external browser
shim. It implements our modules' import subset, not a general WASI runtime or
OS. No host filesystem/network/environment access is exposed to WASM. Unsupported
operations fail. Files are limited to 64 MiB apiece. Tower's C++ WASI adapter also
provides LLD a heap-backed output buffer (WASI has no mmap) and substitutes worker
termination for unavailable signal-based crash recovery.

The parser module is approximately 3.9 MiB before HTTP compression. LLVM is a
separate larger download. Opening the editor only loads the parser module and
the small foundation module.

## Checks

```powershell
npm test
npx playwright install chromium
npm run test:browser
```

The WASM suite runs the existing C++ runtime/parser/syntax tests in the module,
then checks the ABI, revision-aware highlights, strings/comments, Unicode spans,
invalid grammars, atomic installation and session cleanup. Playwright checks the
actual static page in desktop and Android mobile emulation. Device emulation
does not replace testing a physical phone's keyboard/IME.

Validation on 2026-11-15: all nine WASM tests and all eight browser checks passed,
including LLVM on desktop and mobile emulation. The emitted `sum.o` was also
linked with WASI SDK's `wasm-ld --no-entry --export=mainCRTStartup` and executed;
`mainCRTStartup()` returned the expected constant `124`.

Native checks remain available through `scaffolding/tests/run.ps1 -Sanitize` and
the `TOWER_PARSER_ONLY` CMake target. Build products, screenshots and test traces
are ignored under `build/` and `playground/dist/`.

Validation on 2026-11-16: native AddressSanitizer checks, all 55 WASM/host tests
and 44 desktop/mobile browser checks pass. These include real Tower-to-LLVM
compilation/execution, interpreter comparisons, our WASI host, worker cancellation
and inline errors. Functions screenshots were visually inspected.

To profile parsing and live typing, keep the static server running and use
`npm run profile`. Results go to `build/playground-profile.json`. The script
measures WASM phases and real keyboard edits in desktop/mobile browser emulation,
including the single trailing update after continuous typing. Browser timings start at the editor
text mutation and end at the result DOM update or the next animation frame;
they do not measure physical display latency. Native timings include the ABI and
JSON transport. See [performance notes](PERFORMANCE.md) for the before/after run.

For first-page load, file selection, Tower instructions and complete execution,
run `node scripts/profile-execution.mjs ../build/execution-profile.json`.
Set `TOWER_PROFILE_URL` to compare another served build. The probe measures desktop
and mobile emulation separately, waiting for each result; it also records individual
worker phase timings and grammar-only typing. File opening executes immediately
after parsing; ordinary typing uses the same 200 ms trailing debounce as diagnostics.
Status timings list each backend's stages in pipeline order (backends run in
parallel). A `(cached)` load reports the **current run's** measured reuse time,
even when it rounds to 0.0 ms; it never substitutes an earlier cold-load measurement.
Compiler loading
uses a stripped, gzipped LLVM asset to reduce cold network transfer. Parser tracing
is guarded before evaluating debug-format arguments, so disabled tracing does no
state-dump formatting work.

Selected backends preload in their reusable workers even on syntax-only documents.
A fixed internal program warms LLVM parsing, optimization, emission and linking;
Wasm also runs that program privately. No editor source executes during warming,
and no warm output replaces the displayed program results. Real requests queue
behind initialization in the same worker; cancellation terminates that worker.
Unchecked targets do not preload. Browser performance entries named
`tower-llvm-warm` and `tower-native-warm` measure startup separately
from the current run's status-bar timings.

For native end-to-end measurements, build `towerc`, then run under Linux/WSL:
`python3 playground/scripts/profile-native.py build/native/towerc build/native-profile.json --timings`.
The CLI's `--timings` flag reports bootstrap, frontend/LLVM phases, runtime C
compilation, linking and interpreter execution to stderr. The probe also measures
process startup and the generated executable separately, checking its output.
The browser LLVM C++ library is built in Release with `-O3 -DNDEBUG` and LLVM
assertions off; Tower's development assertions and opt-in parser tracing are
separate. LLVM's O2 pass pipeline controls the generated Tower program, not the
optimization level of the compiler's own Wasm binary.

`npm run check:format` requires every current Tower file under `scaffolding`
(Bedrock, Foundation, examples, libraries and test programs) to equal its formatted
source. `npm run format:tower` updates them. The normal test suite also enforces this
and checks formatting twice is stable and parsed statement trees stay unchanged.
Historical migration fixtures intentionally retain their old spelling.

The shared formatter separates functions and structs with a blank line before
and after, groups ordinary statements, uses four-space indentation, and wraps
long grammar alternatives. Source formatting retains comments and unexpanded
replacement invocations from the original parse nodes. Replacement template text
retains its own language and trivia. This extra parse/validation pass is opt-in;
live parsing does not copy source trees for formatting. A custom grammar that
assigns different meaning to whitespace or punctuation can reject the default
layout; the formatter checks the result against the same baseline and refuses
changes that alter its parsed trees.

## Toward a Tower-written playground

JavaScript currently handles the DOM, editor input, worker scheduling and WASI
hosting. Parser decisions and highlighting come from native Tower code. The
[browser ABI](ABI.md) is intentionally independent of CodeMirror and the DOM:
Tower's own renderer, editor and highlighter can replace those adapters while
keeping the same session/source/tree boundary. A binary transport can replace
the current JSON snapshots later.

This bootstrap caches up to 64 validated compiled grammars per session and
reuses them after edits. Cache keys include the ordered token patterns, styles
and skip flags. A new structural grammar still builds a new table;
parsing itself still reads the whole document. Stable syntax identities, temporal repair,
Tower rendering and general in-language parser handlers remain future work.
The playground caps input at 128 KiB, a parse at 1,024 constructs, parser worker work at
10 seconds and the visible tree at 5,000 nodes / 120 levels. Execution runs until
completion, error, cancellation or an edit. The native tree
snapshot itself is complete. Rule/production IDs are local to a grammar table;
node IDs are lifetime identifiers, not stable identities across reparses.

Dependencies: [CodeMirror](https://codemirror.net/), LLVM/LLD,
[WASI SDK](https://github.com/WebAssembly/wasi-sdk). Bundled dependency licenses
are in `dist/THIRD-PARTY-NOTICES.txt`; versions are pinned in `package-lock.json`.
