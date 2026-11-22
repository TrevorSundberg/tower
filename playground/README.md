# Tower browser playground

The real Tower node runtime, LALR parser, grammar bootstrap and lexer run in
`tower.wasm`, compiled from Tower and linked with the WASI SDK. CodeMirror 6
provides the temporary desktop/mobile editor. The JavaScript UI receives parse
trees, grammar snapshots, diagnostics and highlight spans from Tower.
Autocomplete appears while typing; Ctrl+Space opens it explicitly, arrows select,
Tab or Enter accepts, and Escape dismisses. Touch/click also accepts a suggestion.
The completion engine is `scaffolding/compiler/completion.tower`, compiled into
`tower.wasm`. It queries the same parse entities, named captures and ordered
hierarchy as the compiler, including enclosing locals/parameters, module and
project declarations, explicit struct fields, type names, built-ins and active
grammar names. Temporary recovery reparses an unfinished statement through the
ordinary parser; it does not introduce another AST or a JavaScript symbol table.
The current recovery is deliberately bounded: earlier unrelated syntax errors,
inferred receiver types, chained member access and generic specialization can
limit suggestions. Completion is advisory, not a substitute for type checking.
Reusable IDE sessions, handle ownership, transport, query integration and execution
now live in `scaffolding/host/ide_*.tower`. Query decisions, scope filtering,
prefix matching and result construction execute in Tower, including syntax
inspection and world-owned baseline transport.

Completion runs in a separate worker, coalesces edits, rejects stale replies and
has a ten-second termination limit. Browser positions are translated between
UTF-16 and Tower's UTF-8 offsets. CodeMirror owns only popup/input behavior.
Tower instruction and reconstructed Foundation panes use the same Tower lexer
and decoration engine as the source editor, with the bundled canonical grammar
for generated Foundation. They no longer maintain a separate JS keyword/type
classifier; LLVM and machine disassembly retain their own display lexers.
The immutable Tower seed initializes `bedrock.tower`; its result initializes
`foundation.tower`, which initializes user source. Every file applies declarations
incrementally to its own active grammar. Both modules are loaded at runtime.
The pattern engine, scanners, literal decoding, grammar installation and
Foundation implementations are Tower modules on the shared entities.

## Try the built page

Live playground: **https://tower-lang.org/**.

The optional **C source** target emits downloadable, syntax-highlighted C after
LLVM optimized, followed by Bytecode disassembly. Targets also contains shared
O0/O2 optimization and comment-preservation controls. See
[C output and portability](../docs/c-backend.md) for CLI commands, semantics,
compiler coverage and the explicit target profile.

The optional **Roku BrightScript** target downloads a self-contained `.brs` file
after the same LLVM-to-foundation optimization bridge used by the fast
interpreter. See [Roku output and testing](../docs/roku-backend.md) for the 32-bit
profile, exact integer tests, CLI commands and later physical-device validation.

The target picker enables **Graph interpreter**, **Fast interpreter** and
**WebAssembly** by default, plus the detected supported native profile. Both
interpreters are written in Tower. The graph runner executes shared foundation
nodes; the fast runner uses a compact register cache derived from those nodes.
Their separate output panes compare observable results with Wasm automatically.
Any runner can be disabled independently. Steps count each runner's own work and
are not comparable instruction counts. Execution stays in cancellable workers.

**Bytecode disassembly** reconstructs compilable foundation from a validated
`.towerbc` download. Version 1 contains canonical foundation, packed instructions
and constants, with container/semantics/cache versions, explicit pointer layout,
optimization profile and checksum. It preserves foundation as the semantic
authority: loading rebuilds/checks the graph and verifies that the cache matches
before execution. This adds preparation time and source bytes; it is not a
standalone unverified instruction ABI or a zero-copy loader. The current profile
does not optimize guest semantics, so reconstruction matches canonical foundation.
Future optimizing profiles must package the transformed foundation graph.
The existing **Open** button imports project ZIPs; `.towerbc` loading is available
through the native CLI and `loadTower().loadBytecode(bytes)` host API.
Configure that host API with the bundled Bedrock/Foundation when encoding or
loading packages; editor grammar overrides apply to input source. The playground
and native CLI install the canonical grammar for packaging automatically.

Native CLI examples (use the production compiler, not the bootstrap seed):

The current native build recipe is documented in
[Tower backend integration](../scaffolding/backend/README.md).

```sh
towerc program.tower --interpret
towerc program.tower --interpret-fast
towerc program.tower --target wasm32-unknown-unknown --emit bytecode -o program.towerbc
towerc program.towerbc --interpret-fast
towerc program.towerbc --emit foundation -o reconstructed.tower
```

The file's target layout controls interpretation even on a different host. The
cache uses one 32-bit opcode/three-byte-operand word for common instructions,
two words for branches, and a five-word escape for wider operands. Register and
code size do not acquire an 8-bit language limit. Constants, reusable register
frames and cold metadata use contiguous arrays. Immutable arrays are trimmed
after preparation; dynamic call buffers retain capacity for reuse. Shared scalar,
conversion, printing and memory helpers keep both runners' semantics aligned.
The graph runner also caches checked component lookups and reuses call buffers.

Reproduce comparisons with `node scripts/benchmark-interpreters.mjs report.json`
from this directory, optionally setting `TOWER_BENCH_BASELINE` to an earlier
reactor path relative to the repository root. It alternates runners, validates
output, and separates compilation/preparation from execution. Wasm measurements
include module compilation/instantiation and execution, so they are end-to-end
host measurements, not isolated instruction throughput. Native comparison:
`node scaffolding/tests/benchmark-interpreters.mjs /path/to/towerc report.json`
from the repository root. `node scripts/profile-interpreters.mjs` writes separate
CPU profiles under `build/`; `TOWER_PROFILE_REACTOR` can select an unstripped
reactor for function names. See the research journal for measured results and
platform coverage; portability does not imply a measured speed guarantee on
every phone, console or CPU.

LLVM currently optimizes the Tower implementation of both interpreters. Applying
LLVM guest optimizations and translating the result back into this cache would
need an additional verified lowering/reconstruction path; it is not implemented.

From this directory:

```powershell
npm run serve
```

Open **http://127.0.0.1:4173/**. The server only serves static files; parsing runs
in a browser worker. The top-left project browser lists the bundled examples as
starter projects, with imported bundled modules above the project's folders
and marked **library**. These are ordinary source files, including `tower.tower`;
`import tower;` does not import the compiler binary. Those modules remain editable,
with edits isolated per project. **New project** starts with `main.tower`; **New file** accepts paths
such as `src/math.tower`. Rename, Delete and Earlier manage files and their
compilation order. Each file has its own undo history while the project is open.

Whole project snapshots (files, built-in overrides, order, selected file and link
inputs) save atomically to **IndexedDB** after edits. The storage indicator reports
completion or failure; it never silently claims a quota failure was saved. This
avoids localStorage's small document limit. Browser quotas and eviction still
apply. **Save** downloads the entire project as a standard `.zip`; **Open** restores
that archive as a separate project. Export uses a small dependency-free ZIP writer
with stored entries; import accepts stored or deflated entries and validates CRCs,
paths and declared sizes (256 MiB total). `.tower/project.json` holds project
metadata/order, `.tower/bedrock.tower` and `.tower/foundation.tower` hold the built-in
sources, and `.tower/links/` holds binary link inputs. Source files remain ordinary
Tower text. Saving a single editor file is no longer an operation.

Old localStorage workspaces migrate once into a **Recovered workspace** project;
the original keys remain untouched as backup. Recognized older Foundation defaults
upgrade, while custom edits remain. **Restore** replaces the selected built-in or
bundled example file; editor undo can recover the previous text.

The first `.tower` file is the entry; compilation follows its explicit imports.
Other source files are available to import and are not silently appended.
Dependencies run once in dependency-first import order, with functions, types and
module variables binding across the resulting program. Each file imports its own
grammar; local declarations do not leak into siblings. Files without imports
retain the installed Foundation baseline for compatibility. See
[module resolution and compiler bootstrapping](../docs/modules.md).
Non-`.tower` text files remain project assets. The inspector analyzes the
selected file; Execute compiles the project, except when inspecting a built-in,
which retains its ordinary standalone execution controls. Cross-file failures
identify their path instead of marking the wrong editor buffer.

Changing projects cancels active work, clears outputs/downloads and replaces link
inputs, built-in overrides and editor state. Idle parser and backend workers retain
their initialized compilers and validated grammar caches. Each request replaces
the complete project source capabilities, including removed library files; cache
validation still checks exact transitive source inputs. Active workers are terminated
on project changes, explicit cancellation and compiler-generation changes.
The frontend's WASI drive is replaced with the project's virtual files on each
compile; old paths and open file descriptors cannot survive replacement. Tower's
current browser platform API still exposes output only: mounting does not itself
introduce language file-I/O operations. Filesystem capabilities/imports and direct
OS directory synchronization remain future work. Browser directory pickers are
not required. Source compilation accepts up to 8 MiB total UTF-8, with the existing
1,024-construct and built-in 64 KiB limits; storage/import can hold larger assets.

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
Select **Error · filename.tower:line:column** in the editor footer to jump to an offscreen
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

Choose the **Tokens** project to explore lexical rules. Select the pinned
**Bedrock** or **Foundation** file to edit the declaration or ordinary grammar.
Their changes apply to the current project and all execution backends.
See [token syntax and precedence](TOKENS.md).

`import tower;` enables nested expressions above Foundation. From tightest to
loosest, Tower provides calls/fields/indexing and postfix `++ --`; prefix
`++ -- + - ! ~ & *`; `* / %`; `+ -`; `<< >>`; `<=>`; `< <= > >=`;
`== !=`; bitwise `&`, `^`, `|`; `&&`; `||`; conditional `?:` and assignments
`= += -= *= /= %= <<= >>= &= ^= |=`; and comma sequencing. Assignment and
conditional chains associate right; ordinary binary chains associate left.
Comma expressions need parentheses in call arguments and initializers. The
conditional middle operand accepts commas. C++ alternative spellings `not`,
`compl`, `bitand`, `bitor`, `xor`, `and`, `or`, `not_eq`, `and_eq`, `xor_eq`,
and `or_eq` are accepted. There is no `->`; `.` already supports struct pointers.

Tower retains exact types and explicit conversions: logical operands are bool,
arithmetic/bitwise operands are integers, and pointer offsets are explicit
integer counts. No C integer promotions or C++ object/lifetime operators are
introduced. Existing `convert`, `bits`, `sizeof`, `alignof`, allocation and free
remain ordinary calls. Integer `<=>` produces an `i32` value of -1, 0 or 1.
Shift counts are masked by width minus one; left shifts wrap and signed right
shifts extend the sign. These are Tower contracts, including negative/large
counts, rather than C/C++ undefined behavior.

Operands evaluate left to right. Short-circuit and conditional branches evaluate
only the chosen side. An update captures its destination once before evaluating
the right operand; compound updates also read its previous value first. Postfix
updates return the old value and prefix updates return the new one. Shared ECS
nodes lower to existing Foundation locals, operations, loads/stores and branches;
the resulting text recompiles without importing Tower. Shifts currently expand
to portable Foundation loops, with no claim of single-instruction lowering.

The number token excludes a sign. Negated decimal literals retain an exact `u64`
magnitude until signed range checking, admitting `-2147483648` and
`-9223372036854775808` without an overflowing positive intermediate. Their final
typed bit patterns are identical in the interpreters, Wasm and native LLVM.
General unary negation uses Foundation subtraction. This does not introduce a
separate compile-time arithmetic evaluator or change the staged execution plan.

Null pointers support lazy `??` and `??=`, guarded member/index access `?.` and
`?[]`, and `is null` / `is not null`. Guarded chains skip subsequent field/index
work when the receiver is missing. A guarded scalar result must currently be
consumed with `??`; nullable scalar variables are not implemented. Pointer results
can remain nullable pointers. `>>>` shifts right with zero fill, and `>>>=` is its
compound form. Tower also supplies `&&=` and `||=`: they evaluate the destination
once and evaluate/store the RHS only when the logical operation needs it.

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
actual parse nodes. The declaration seed uses this same entity model; its formatter
output is the bundled bedrock file. Declaration order, `=` versus `|=`, token
styles, captures, replacement bodies and comments survive formatting/reloading.
Canonical declaration text uses the default bedrock spelling, even if an
edited input bedrock renames keywords. Templates retain their source language.
Comments within a declaration may move before it; template comments stay inside.

For example, changing `'parse'` to `'rule'` in `GrammarDeclaration` uses `parse` for
that declaration, then requires `rule` for following declarations in the same file
and downstream modules. Required semantic capture names remain part of
the current native handler contract. Grammar errors install atomically; existing
sessions pin their original module versions. Bedrock declaration-rule replacement
handlers are not implemented; ordinary source replacements remain supported.
Explicit imports now express this load order: Foundation imports Bedrock, Tower
imports Foundation, and user/compiler files import the grammar they need. Hosts
still install a compatibility baseline for source without imports.

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

On Linux x86-64, initialize the checkout's submodules, then use Docker for the
complete build and validation route:

```sh
git submodule update --init --recursive
./build.sh
# On a machine with more available memory:
TOWER_BUILD_JOBS=4 ./build.sh
```

This builds the native compiler, sanitizer harness, browser parser, LLVM/Wasm
and native-target browser compilers, and target support packs. It then runs the
bootstrap comparisons, native linking/execution, Node tests, formatting checks,
desktop/mobile Chromium tests and deployment verification against a local static
server. The first build downloads the toolchain and compiles LLVM; subsequent
builds reuse `~/.cache/tower-docker` (override with `TOWER_DOCKER_CACHE`). It does
not need an interactive terminal or delete previous compiler builds. Artifacts
are in `build/` and the complete deployable website is in `playground/dist/`.
The native compiler currently depends on the container's LLVM libraries; run it
in that environment with `./build.sh build/native/towerc
scaffolding/examples/memory.tower --interpret`. Arguments to `build.sh` select a
command inside the same container instead of running the full pipeline.
Windows executables are linked on Linux; running them requires WSL interop or
Wine and is explicitly skipped otherwise. The container tests ARM64 Linux output
with QEMU. macOS output requires a Mac for execution validation.

For a direct build without Docker, prerequisites are Node 22/npm, CMake, Ninja,
Clang/LLVM/LLD 19 development packages, Python 3, curl, Git and WASI SDK 34.
On Ubuntu 24.04, install `clang-19 llvm-19-dev lld-19 libclang-rt-19-dev cmake
ninja-build python3 curl git`, and put `/usr/lib/llvm-19/bin` on `PATH`.
Install Chromium's system dependencies with `npx playwright install-deps chromium`
from `playground/` after `npm ci`. `bash internal.sh` runs the same full pipeline.
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

These parser-only development builds omit the **Tower Compiler** workbench.
For that project, build both LLVM reactors with `TOWER_BROWSER_CROSS=ON` after
the parser, as described under **Editing Tower Compiler in the browser** below.
Publication with `TOWER_REQUIRE_BACKENDS=1` requires its complete recipe and packs.

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
it without a generated grammar prefix. The Tower compiler consumes the expanded
trees directly, attaches typed semantic components to those same nodes, and uses
them for interpretation and LLVM lowering. It never executes the debug token reconstruction. The current bootstrap semantic ABI recognizes the
`Core*` rule labels and their named captures. Renaming a keyword while retaining
those trees works; introducing an entirely new semantic operation still needs a
Tower compiler handler or a replacement into existing operations.

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

Highlighting starts on the next animation frame, and automatic execution starts
when the current parse is valid, without a fixed typing delay. IME composition
defers automatic work; diagnostic visibility retains its separate delay policy.
Syntax-only examples remain parser
demos. Cancel stops the current source revision until another edit or explicit
execution; re-inspecting it does not restart a cancelled infinite loop.

Compilation and execution run in **one worker per backend**, separate from live parsing.
Each column shows its own progress. **Cancel** terminates whichever workers remain.
Edits coalesce unfinished compilation in the same warm worker and reject stale
results. A worker must receive permission for the current revision before running
the program. An edit during execution discards its results and terminates it on
the next UI task unless its terminal reply is already queued; explicit Cancel,
project switches and compiler changes terminate immediately. The last output and
errors remain visible until new results arrive. Completed workers retain
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
The bottom **Details** disclosure contains parser status, steps and separate
compilation/execution timings. It opens over the workspace without resizing it.
During an edit, one **Updating…** status covers the run; each busy output heading
has a small indicator with its detailed phase available on hover. Output headings
stay on one line, and regenerated code retains its scroll anchor. Native output
and download links are replaced when their new result arrives, instead of clearing
every target as soon as the first one completes. Explicit failures still clear
the affected target's obsolete artifact. Interpreter
Execution, Fast interpreter and Wasm Execution have separate output columns. Wasm disassembly decodes
the actual linked binary using LLVM, including linked runtime functions; its addresses
are file offsets. Its download footer shares the native disassembly-column layout.

The compilation path is expanded Tower nodes enriched with typed foundation
components -> interpreter or LLVM -> linked executable WASM. Across isolated WASM
modules, the program is shared as canonical foundation text and resolved with the
same foundation grammar, node schema and verifier. The `.towerbc` envelope pairs
this text with a verified, versioned execution cache; it introduces no separate
semantic IR. LLVM lowers ordinary locals to entry allocas, runs
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

Initial selection is exactly one auto-detected target (or one fallback).
OS and architecture are inferred independently, preferring browser client hints
with a bounded 200 ms wait. When architecture is hidden, macOS defaults to ARM64
(an "Intel" UA is ambiguous), Windows/Linux to x64; completely unknown browsers
default to Windows x64. These are explicit heuristics, not measured market-share
claims or CPU capability detection. Known unsupported OS/architecture combinations
(including Android, iOS, Chrome OS, Windows ARM64 and 32-bit native hosts) default
to WebAssembly. Only an explicit OS and architecture match receives a short
"(detected)" marker next to its name; guessed defaults are not marked. There is no
diagnostic paragraph in the picker. Users can always select additional targets.
Pre-update v1/v2 saved selections are ignored so the old grouped migration and
Wasm-plus-native defaults cannot override detection. Explicit choices made with
the corrected picker persist in v3, including all-off selections. No probing or
network lookup is used, and detection never changes a target's layout or semantics.

Tower instructions, LLVM raw/optimized and x86/ARM64/Wasm disassembly use read-only
CodeMirror views with incremental display lexers and viewport rendering. Unchanged
output is not re-highlighted on phase/timing updates. Full documents remain
selectable/copyable while only visible lines create DOM nodes. These display lexers
do not parse or define Tower semantics; the compiler still supplies canonical
foundation source through its shared formatter.

All instruction, disassembly and execution panes use the same output-pane layout:
a heading, scrolling content and optional download footer. Progress, cancellation
and failures appear in the heading; successful panes clear their status, leaving
one overall execution/comparison summary. Wasm and native downloads share byte
counts, source/target filenames and blob URL cleanup. Empty download footers are
hidden and never reserve space for a completion label.

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
bash playground/scripts/build-native.sh
tools="$(bash playground/scripts/build-bootstrap.sh --tools package_targets)"
"$tools/package_targets" "$PWD/build/native/share/tower" "$PWD/scaffolding/targets" "$(llvm-config-19 --bindir)/clang" "$PWD/build/targets"
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
interpreter. The native driver locates Bedrock, Foundation and generated runtime target artifacts
in the adjacent `share/tower` resource directory. Move that complete resource tree
with the executable; the development package still requires external LLVM/Clang.
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
bash playground/scripts/build-native.sh -DTOWER_DRIVER_TESTS=ON
native="${TOWER_NATIVE_BUILD:-$HOME/.cache/tower/native}"
cmake --build "$native" --target tower-driver-tests
repo="$PWD"
llvm_bin="$(llvm-config-19 --bindir)"
llvm_lib="$(llvm-config-19 --libdir)"
sdk="${WASI_SDK_PATH:-$HOME/.cache/tower/wasi-sdk/wasi-sdk-34.0-x86_64-linux}"
bash playground/scripts/build-wasm.sh
(cd build/linking && "$native/tower-driver-tests" --linking "$native/towerc" "$repo/scaffolding" \
  "$llvm_bin/clang" "$llvm_bin/llvm-ar" "$sdk/bin/wasm-ld" "$repo/build/linking/wasm-fixture.a" "$llvm_lib/libLLVM.so")
tools="$(bash playground/scripts/build-bootstrap.sh --tools package_targets)"
"$tools/package_targets" "$repo/build/native/share/tower" "$repo/scaffolding/targets" "$llvm_bin/clang" "$repo/build/targets"
mkdir -p build/target-checks
(cd build/target-checks && "$native/tower-driver-tests" --target-packs "$native/towerc" "$repo/scaffolding" "$llvm_bin" "$repo/build/targets")
(cd build/linking && "$native/tower-driver-tests" --windows-linking "$native/towerc" "$repo/scaffolding" \
  "$llvm_bin/clang" "$llvm_bin/llvm-ar" "$llvm_bin/lld-link" "$repo/build/targets/kernel32.lib")
node --test playground/tests/raw-memory.test.mjs
node --test playground/tests/cross-compilation.test.mjs
(cd build/cross && "$native/tower-driver-tests" --browser-exports "$(command -v qemu-aarch64 || true)")
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
Tower host services manage ownership and expose borrowed views.
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
The arena/map helpers remain in `library/storage.tower`; import the required
Tower modules or link their objects through matching declarations.

`scaffolding/library/entities.tower` now implements the compiler's actual shared
entity/component store. Creation, reference ownership, ordered/named child
relationships, component registration, lookup/removal and type-based query indexes
run in Tower. Component payloads have stable addresses;
query indexes grow independently and use swap removal. Structural edits invalidate
query positions, and removal/destruction invalidates borrowed payload pointers.
Store-owned pools and archetype table columns provide derived query indexes.
Workers borrow pinned inputs, own scratch and staged payloads, and declare access
ranges; coordinators publish structural changes after joins. A pin is not a
payload lock. Legacy default-world adapters remain coordinator-only. Ownership
cycles remain invalid; these low-level APIs do not provide automatic safe handles.

`scaffolding/compiler/parse_tree.tower` implements parser forest concatenation,
lazy capture wrappers, generated-node flattening and ownership transfer into those
entities. It preserves O(1) fragment concatenation and visits each flattened
fragment once. Build manifests use ordinary Tower imports.
`compiler/generics.tower` uses the same entities for type-function
specialization, bindings, provenance and iterative syntax cloning.

`compiler/parser_nodes.tower` owns rule, reference, token-string, range and match
payloads, including their text and arrays through `vector(T)`. Separate units
borrow payloads through the shared APIs and authoritative Tower layouts.
`compiler/lexer_table.tower` owns flat DFA transition rows and performs Unicode
maximal-prefix matching. These tables are derived caches. Regex notation is now
defined in `compiler/regex_grammar.tower` using the ordinary grammar components
and parsed by the same LR engine over Unicode scalars. Its parse tree stays on
shared entities. NFA/DFA lowering, LALR construction, recognition, grammar and
Foundation payloads, formatting and backend integration are all Tower.

The Tower store retains each type until its payload finalizer has finished. Ordinary
Tower clients can use plain components with lifecycle zero, or supply the declared
`tower_entity_finalize` dispatch through the existing external-call mechanism.

The native build installs the hash-pinned Linux x64 Tower compiler from
`bootstrap/`, compiles all owned implementation from `.tower`, and links with
upstream LLVM and platform libraries. No project-owned C/C++ seed, adapter or
fixture remains. Docker supplies the canonical build environment across hosts.
Generated objects stay in ignored build directories, and dependencies include
the compiler executable, utility source, Bedrock and Foundation.

The build scripts prepare the pinned compiler automatically, currently requiring host Clang,
CMake/Ninja and LLVM 19 development libraries (`LLVM_CONFIG` can override the
config tool). Set `TOWER_BOOTSTRAP_COMPILER` to an existing host compiler to bypass
using that pin; it must support the current language. Direct CMake
builds accept the same cache option. Bootstrap
commands pass `--bedrock file --foundation file` explicitly so an external compiler
uses this checkout's grammar modules. These driver options are also available
for normal builds; they are host loading controls, not language imports. The native
build produces `build/native/towerc`.
Move the adjacent `build/native/share/tower` resource directory with the
executable. Grammar/runtime lookup is relative to the running compiler, with
explicit grammar flags still supported. `--version` identifies the current
Tower-built development compiler. See [bootstrap distribution](../docs/bootstrap-distribution.md)
for Tower host policies, relocation checks, self-build recipes and release gates.
Native CLI packages for Windows/macOS/Linux remain distribution goals. For now,
one Linux x64 pin and Docker support bootstrapping; separate native pins are not
required. Existing build/package tooling and complete dependency bundling remain
work beyond the completed owned C/C++ source retirement.

```sh
bash playground/scripts/build-native.sh
bootstrap="$(bash playground/scripts/build-bootstrap.sh)"
tools="$(bash playground/scripts/build-bootstrap.sh --tools verify_bootstrap_symbols)"
native="${TOWER_NATIVE_BUILD:-$HOME/.cache/tower/native}"
"$tools/verify_bootstrap_symbols" --compare "$bootstrap" "$native/towerc" "$PWD/scaffolding" "$native" "$(llvm-config-19 --bindir)/llvm-nm" "$PWD/build/bootstrap-check"
bash playground/scripts/test-native-core.sh
node --test playground/tests/compiler-utf8.test.mjs
node --test playground/tests/compiler-bytes.test.mjs
node --test playground/tests/compiler-entities.test.mjs
```

The Tower bootstrap verifier consumes the already-built pinned and successor
compilers and compares optimized LLVM and object bytes for Linux, Windows, macOS
and Wasm. Append unit names to select a subset; omitted names check all seven.
Each invocation creates a fresh retained directory under the output root, checks
exact symbol policy and explicit grammar inputs, and requires nonempty matching
artifacts. It does not rebuild the native compiler or write expected-output files.
UTF-8 has no runtime dependencies;
byte buffers allow only allocation/copy primitives and the Wasm stack-pointer symbol.
The entity/parser module also permits the allocation and component-lifecycle
interfaces. These module checks are distinct from the whole-compiler successor tests.
Parser payload tests cover ownership, aliasing, growth, default metadata and failed
allocations. Lexer tests compare the Tower matcher with its Tower oracle on 500 randomized
automata, Unicode/invalid UTF-8, every input offset and partial allocation failure.
Native tests cover every Unicode scalar, every one/two-byte input,
random malformed buffers and inaccessible-page boundaries. The migration checks
do not run sanitizers or broad formatter sweeps. Wasm tests also compare the codec with TextEncoder/TextDecoder,
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
operations fail. Files are limited to 64 MiB apiece. Tower's WASI backend integration also
provides LLD a heap-backed output buffer (WASI has no mmap) and substitutes worker
termination for unavailable signal-based crash recovery.

The parser module is approximately 3.9 MiB before HTTP compression. LLVM is a
separate larger download. Opening the editor only loads the parser module and
the small foundation module.

## Checks

For compiler body/continuation development, use the existing Linux native build
with `TOWER_WORK_TESTS=ON` and `TOWER_BACKEND_TESTS=ON`. This target incrementally
builds the production worker runner and runs a short serial/four-worker check:

```bash
tower_native_build="${TOWER_NATIVE_BUILD:-$HOME/.cache/tower/native}"
cmake --build "$tower_native_build" --target tower-body-smoke --parallel 2
```

It checks runtime behavior, canonical output/recompilation, header failure and
cycle diagnostic order using the existing body fixture. It is a development
subset; the full 1/2/4/8-worker and 32/64-bit body matrix remains available through
`ctest --test-dir "$tower_native_build" -R '^tower-body-continuations$' --output-on-failure`.
LR, native-unit and editor-unit checks can likewise be selected independently as
`tower-lr-worker-equivalence`, `tower-native-units` and `tower-editor-units`.
Run broader compiler/bootstrap/browser checks at coherent release milestones or
when changed code invalidates their previous results. No sanitizer or repository
formatting sweep is part of this development path.

```powershell
npm test
npx playwright install chromium
npm run test:browser
npm run test:deployment
```

The deployment check starts its own local server, verifies every asset against
`dist/deployment-manifest.json`, and exercises desktop/mobile compilation,
execution, exports and editor interactions. Build release bundles with
`TOWER_REQUIRE_BACKENDS=1 npm run build` to reject missing LLVM/cross backends.
Bundling clears generated `dist/` contents so stale optional backends cannot
silently survive a rebuild. A present cross compiler requires all target packs.

Build the shared-memory frontend with `bash playground/scripts/build-threads.sh`
from the repository root. `TOWER_REQUIRE_THREADS=1 npm run build` checks that its
artifact is included alongside the portable frontend. The playground selects it
only in an isolated worker environment. On static hosting, a same-origin service
worker supplies COOP/COEP headers and performs one startup reload before the editor
opens; it does not cache assets or compiler results. When isolation is unavailable,
the portable frontend remains usable. Native/LLVM unit compilation and the shared
frontend are separate execution paths; packaging this reactor does not make every
compiler phase parallel. Switching compiler generations retires the old frontend's
nested workers. Cancellation terminates its owning worker and nested workers.

GitHub Pages serves the contents of `dist/` from the repository's `gh-pages`
branch. The build copies `playground/CNAME` into `dist/CNAME` and includes its
checksum in the manifest, preserving the custom domain on future publications.

The domain configuration is:

1. GitHub Pages uses `tower-lang.org` as its custom domain. To restore it, use
   `gh api --method PUT repos/TrevorSundberg/tower/pages -f cname=tower-lang.org`.
2. Cloudflare hosts these records as **DNS only** (`proxied: false`), with a
   300-second TTL. Preserve unrelated records when updating DNS.

   | Type | Name | Value |
   | --- | --- | --- |
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | AAAA | @ | 2606:50c0:8000::153 |
   | AAAA | @ | 2606:50c0:8001::153 |
   | AAAA | @ | 2606:50c0:8002::153 |
   | AAAA | @ | 2606:50c0:8003::153 |
   | CNAME | www | trevorsundberg.github.io |

3. Fetch the latest `gh-pages` commit before publishing, preserving any CNAME
   commit GitHub created. Publish the complete tested `dist/` directory, including
   `CNAME`, `.nojekyll` and the manifest, with a normal fast-forward push.
4. GitHub manages the domain certificate. Enforce HTTPS with
   `gh api --method PUT repos/TrevorSundberg/tower/pages -F https_enforced=true`.
   Check the resulting Pages state with `gh api repos/TrevorSundberg/tower/pages`.
5. Verify the exact hosted build with
   `node scripts/verify-deployment.mjs https://tower-lang.org/`, and verify that
   HTTP, `https://www.tower-lang.org/` and the old GitHub Pages URL redirect to
   the HTTPS apex.

DNS can be managed through the signed-in Cloudflare dashboard or an API token
scoped to `tower-lang.org` with **Zone:DNS:Edit** and **Zone:Zone:Read**. Keep
credentials outside the repository.

The DNS values and apex/www behavior follow
[GitHub's custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
[Cloudflare DNS-only records](https://developers.cloudflare.com/dns/proxy-status/)
send visitors directly to GitHub Pages, which continues to host the static site
and manage its certificate. DNS propagation and certificate issuance may delay
the final HTTPS checks. The build command does not push or publish.

The WASM suite runs the Tower runtime/parser/syntax tests in the module,
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
after parsing. Highlighting schedules on the next animation frame and coalesces
edits behind a running parse without throwing away the warm worker. Automatic
execution follows the valid parse immediately and coalesces pending compilation;
diagnostic visibility uses its separate delay policy. Package preparation retains
the freshly reconstructed Foundation session after validating the envelope and
matching its execution cache, so the fast runner does not parse its own package
again. Imported packages still take the full untrusted reconstruction/check path.
The Details timings list each backend's stages in pipeline order (backends run in
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

For native end-to-end measurements, build `tower-driver-tests` with
`TOWER_DRIVER_TESTS=ON`, then run in a writable artifact directory under Linux:
`tower-driver-tests --measure-native COMPILER SCAFFOLDING`.
It writes `measurements.json` with five samples of interpretation, compilation,
execution and object emission, checking the memory/functions outputs.

For compiler-source workloads, save a baseline LLVM reactor before changing the
compiler, rebuild the compiler project recipe, then run from the repository root:

```text
node playground/scripts/profile-compiler.mjs current-unstripped.wasm build/compiler-profile.json baseline.wasm
```

Use the unstripped `tower-llvm.wasm` from the LLVM build directory for readable
Tower/LLVM function names. The script measures ordinary functions, collections
and three compiler units with six warmups and sixteen alternating pairs. Both
versions receive identical current recipe inputs and must emit identical object
bytes. Reports include startup, compile/phase timings, artifact/source hashes and
a separate `.cpuprofile`; sampling runs after timing. Module-file registration,
network transfer and page rendering are outside these compile measurements.
Run without concurrent builds or tests. Omit the baseline argument for an initial
profile. `TOWER_PROFILE_CASE` and `TOWER_PROFILE_EXCLUDE` filter workload paths;
`TOWER_PROFILE_WARMUPS`, `TOWER_PROFILE_PAIRS` and `TOWER_PROFILE_REPEATS` control
the timing and sampling counts. For expensive units, start with
`TOWER_PROFILE_ONLY=1` and `TOWER_PROFILE_REPEATS=1` to sample one compilation
before selecting repetition counts. Sampling-only elapsed times include profiler
overhead and are not benchmark results. For paired native CLI measurements use
`tower-driver-tests --measure-compiler BEFORE AFTER SCAFFOLDING`
under Linux; it checks object equality and includes process startup and grammar
loading. The shared [Tower measurement runner](../scaffolding/tests/README.md#native-measurements)
also covers paired semantic compilation and C-versus-LLVM runtime workloads.
The Tower `BackendVerifyEach` constant enables extra per-pass LLVM
verification for debugging; normal compilation verifies at stage boundaries.
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
hosting. Parser decisions and highlighting come from the compiler. The
[IDE ABI](ABI.md) is independent of CodeMirror and the DOM:
Tower's own renderer, editor and highlighter can replace those adapters while
keeping the same session/source/tree boundary. A binary transport can replace
the current JSON snapshots later.

This bootstrap caches up to 64 validated compiled grammars per session and
reuses them after edits. Cache keys include the ordered token patterns, styles
and skip flags. A new structural grammar still builds a new table;
parsing itself still reads the whole document. Stable syntax identities, temporal repair,
Tower rendering and general in-language parser handlers remain future work.
The playground caps compiled input at 8 MiB, a parse at 1,024 constructs, parser worker work at
10 seconds and the visible tree at 5,000 nodes / 120 levels. Execution runs until
completion, error, cancellation or an edit. The native tree
snapshot itself is complete. Rule/production IDs are local to a grammar table;
node IDs are lifetime identifiers, not stable identities across reparses.

Dependencies: [CodeMirror](https://codemirror.net/), LLVM/LLD,
[WASI SDK](https://github.com/WebAssembly/wasi-sdk). Bundled dependency licenses
are in `dist/THIRD-PARTY-NOTICES.txt`; versions are pinned in `package-lock.json`.

## Editing Tower Compiler in the browser

The **Tower Compiler** project contains the compiler, interpreter, host and backend
Tower sources plus the real build's import-unit manifests. Edit any file to
schedule a rebuild, or choose **Rebuild compiler**. Compilation and linking run
in a cancellable worker. Each unit compiles its transitive imports; files are
never concatenated. Ordinary projects likewise compile their first Tower file's
import closure, including an entry containing only imports, and recompile when
an imported file changes.

The build links fresh parser/interpreter, LLVM/Wasm and native-target reactors.
It instantiates all candidates and checks imported execution in both interpreters,
LLVM execution and native object emission before activating the generation.
The next rebuild uses that generation. Failed, cancelled and superseded builds
cannot replace the active compiler. **Reset compiler** restores the bundled
compiler without deleting source edits. Reload also restores the original;
compiler binaries are session state, while project source persists in IndexedDB
and project ZIPs.

Compiler algorithms and host policies rebuild from Tower. Upstream LLVM/LLD,
platform libraries and small runtime ABI artifacts generated by Tower tools
remain prebuilt link support. Rebuilding those runtime artifacts in the browser
remains release work. Large compiler
builds download additional support on demand and
may take substantially longer than an ordinary program. LLVM workers permit up
to 2 GiB of linear memory for compiler linking; actual allocation grows as needed.

When adding compiler modules, add their Tower imports to the owning
`scaffolding/compiler/units/*.tower` module or remaining platform-specific
`cmake/Compose*.cmake` manifest. Entity, semantic, interpreter, evaluation,
foreign-tool, host-platform and parser-profile membership is ordinary Tower.
Host/parser builds retain a configured one-import selector; their source lists
need no generator. The Tower `package_compiler_project` tool follows those actual build
units, exposes new `.tower` files automatically, and excludes rebuilt Tower
objects from the support packs. Existing files with browser edits are preserved
when the bundled project updates; untouched files and new ports are refreshed.
The comments in the project entry and unit manifests record this migration path.
Standalone release recipes and editable production of the runtime ABI artifacts
remain required; see `docs/bootstrap-distribution.md`.

A full browser build now packages the workbench after the parser and LLVM builds:

```sh
bash playground/scripts/build-wasm.sh
TOWER_BROWSER_CROSS=ON bash playground/scripts/build-llvm.sh
npm run build --prefix playground
node playground/scripts/test-compiler-project.mjs
```

The compiler-project check edits a semantic diagnostic and builds two successive
complete sets of reactors using the browser host APIs, checking that the edit is
executed by each successor. It is separate from the quick Node test suite.

Packaging uses Tower for dependency closure, archive indexes, gzip and JSON.
It queries the final Ninja command and Clang's linker arguments without running
them, reads the existing object/archive bytes, and stages complete outputs before
publishing `project.json` last. Run packaging after its build inputs are stable;
the output directory is not a concurrent reader/writer transaction. Support
chunks target 24 MiB of object payload and must fit the 64 MiB input envelope.
The fixed-Huffman encoder can produce larger downloads than the retired Python
compressor. Python remains an upstream LLVM build requirement only.

The pinned LLVM 20 LLD needs the guarded Tower `prepare_llvm` backport to link
WASI SDK 34 libc's `__wasm_first_page_end` reference. It uses LLVM's existing
64 KiB page constant and only affects non-PIC links. The full build applies it
to cached third-party source before rebuilding LLD. Review/remove it with an
LLVM upgrade; the source checkout's submodule remains unchanged.
