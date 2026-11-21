# Tower IDE ABI, version 3

`scaffolding/host/ide_*.tower` owns the reusable session, query, execution and
artifact services behind ordinary C exports. The current WASI build uses wasm32
integers/pointers. Instantiate with WASI Preview 1 imports and
`env.tw_foreign_call(handle, request)` for foreign execution, then call `_initialize`
exactly once before calling any Tower export. Load `bedrock.tower` through
`tw_set_bedrock`, then `foundation.tower` through `tw_set_bootstrap` before
creating sessions. The provided JavaScript adapter
is `src/tower-host.mjs`, usable from both browser workers and Node tests.

The adapter accepts the preceding `tower_host.call` import as well, so it can
load either generation during deployment. Compiler services remain independent
of this JSON transport. Each host instance owns its IDE state component on the
existing entity registry; session handles own their parse/semantic roots and
interpreter storage. No separate AST, graph registry or semantic IR is created.
Calls into one instance are serialized. Separate worker instances own separate
worlds; shared graph mutation is not claimed thread-safe. Cancellation terminates
the owning worker, and request generations continue to reject stale results.

Syntax inspection, baseline installation and seed formatting use shared Tower
views and diagnostics on every target. `host/syntax_baseline.tower` owns the
legacy entry points' buffers and borrowed module context in a component on their
compiler world. `frontend_world_clear` releases that state after readers and
workers join. The explicit-world session/baseline APIs remain independent of the
IDE transport; no C++ string or vector layouts cross this boundary.

Focused fixtures are implemented in `scaffolding/tests/ide.tower`. Configure the
WASI build with `-DTOWER_IDE_TESTS=ON`, rebuild, then run
`node playground/scripts/test-ide.mjs path/to/tower.wasm`. Production builds leave
that option off. The test runner supplies normal module inputs and calls Tower;
all assertions and lifetime/execution fixtures are Tower code.

| Export | Contract |
| --- | --- |
| `tw_abi_version() -> u32` | Currently `3`; the runtime-loaded bootstrap is required. |
| `tw_alloc(bytes) -> pointer` | Caller-owned input storage; zero indicates failure. |
| `tw_free(pointer)` | Release storage returned by `tw_alloc`. |
| `tw_set_bedrock(pointer, byteLength) -> pointer` | Read bedrock with the immutable native grammar and atomically install its downstream declaration grammar. Same source is idempotent. A changed bedrock requires reloading foundation; existing sessions keep their old modules. Same diagnostic/64 KiB contract as `tw_set_bootstrap`. |
| `tw_bedrock_seed() -> pointer` | Borrowed canonical text produced by the common formatter from the native seed's actual grammar entities. |
| `tw_create_bedrock(pointer, byteLength) -> u32` | Create a module-inspection session pinned to the immutable native reader. Validate the collected downstream grammar at end of input; never replace its own reader while reading. |
| `tw_format(handle) -> pointer` | For a completed, valid source document, return `{source, spans}` using the common formatter on original parse nodes before replacement. Comments and replacement invocations are retained. Reparse with the same baseline must preserve its trees; otherwise return `{error}`. Source maps use `{begin,end,source}` byte offsets. |
| `tw_set_bootstrap(pointer, byteLength) -> pointer` | Parse token/skip/parse declarations over the installed bedrock definitions and atomically install the baseline for new sessions. Identical source is idempotent. Returns a borrowed, NUL-terminated diagnostic: empty means success. Read before another call. Maximum 64 KiB; NUL bytes are rejected. |
| `tw_create_foundation(pointer, byteLength) -> handle` | Inspect foundation using the installed bedrock reader, without importing the previous foundation. Only declarations are allowed. Reset pins this reader and mode. |
| `tw_create(pointer, byteLength) -> handle` | Copies valid UTF-8 source, without NUL bytes, into a new session. Zero indicates failure. No input terminator required. |
| `tw_reset(handle, pointer, byteLength) -> int` | Copies edited source and restarts at revision zero, retaining compiled grammar tables. Returns 1 on success, 0 on error. Invalid input/handle leaves the existing session unchanged. |
| `tw_last_error() -> pointer` | Borrowed, NUL-terminated UTF-8 create/reset diagnostic. Read before another create/reset. |
| `tw_step(handle) -> pointer` | Parse/install exactly one construct and return a JSON snapshot. |
| `tw_inspect(handle) -> pointer` | Return current grammar/highlights without advancing parsing or installing declarations. |
| `tw_complete(source, byteLength, cursor, mode, filePointers, fileLengths, fileCount) -> pointer` | Completion query at a UTF-8 byte boundary. Mode is 0 for ordinary source, 1 for Foundation over Bedrock, 2 for Bedrock over the immutable seed. Other files contribute module declarations, not their locals. Returns borrowed `{from,to,options:[{label,type,detail}]}` or `{error}` JSON until the next completion call. Inputs share an 8 MiB limit; at most 1,024 additional files. |
| `tw_destroy(handle)` | Release a session. An unknown/already destroyed handle is harmless. |
| `tw_self_test() -> int` | Run the existing C++ suites; zero on success, invariant failure traps. |
| `tw_live_nodes()`, `tw_live_allocations()` | Test counters for Tower-managed allocations (not all libc++ memory). |

Step/inspect results are borrowed UTF-8, NUL-terminated JSON. Copy a result
**before another step/inspect/reset on the same handle**, and before destruction.
Do not free borrowed results. Recreate typed-array views after any WASM call
that might grow memory. A host must pass valid pointer/length pairs; exports
are an application ABI, not a memory-safe boundary inside one WASM instance.

Completion candidates are queried in Tower from shared syntax entities and
semantic built-in definitions. The query owns disposable lists of borrowed node
handles, never a second authoritative symbol graph. Unfinished statement recovery
blanks a source range without shifting existing coordinates and closes at most
255 open braces before using the ordinary parser. Synthetic recovery is query
scratch, not saved source or executable output. Queries visit at most 50,000 nodes
per parsed construct and return at most 128 unique suggestions. Each parser session
is bounded to 1,024 constructs. Comments/strings suppress suggestions using lexical
classification independently of their display style; unstyled skip spans remain
available to tooling but are omitted from presentation snapshots.

The `loadTower(bytes, log, foundationSource, undefined, bedrockSource)` adapter
loads the modules after WASI initialization. Browser workers fetch both `.tower`
files beside the module; Node hosts can read them from `scaffolding`. Omitting
the fifth argument retains the native declaration reader for compatibility with
existing embedding callers; the playground always loads the real bedrock file.
Foundation inherits Bedrock's shared entities, then adds its own definitions.
Whitespace, comments, Identifier and String are shared defaults; Number and the
executable grammar are added by Foundation. Snapshots include inherited definitions,
but source formatting prints only the inspected document, including its statements.
Local overrides replace bindings without mutating imported entities. Existing
sessions pin both modules, including across resets. Invalid installation leaves
the previous baseline intact. The LLVM module also exports both setters, with
`malloc`/`free` for its input buffer; `src/bootstrap.mjs` handles both modules.

At most 32 sessions are open at once. Source is limited to 8 MiB. UTF-8 is
validated at creation, including overlong encodings and surrogates. Grammar
errors return data; they do not throw C++ exceptions. Invalid session step or
inspect calls return `{ "status": "error", "error": "Invalid session handle" }`.

## Responses

Common fields: `status`, `revision`, `offset`, `error`, `errorOffset`, `rules`,
`tokens` and `keywords`. `offset` is the next unread UTF-8 byte offset. `errorOffset`
identifies the offending token or the rejected declaration's beginning, and
is meaningful only with a nonempty `error`. A suggested insertion instead points
at the source gap and includes `errorLength: 0` for a caret rather than a token
underline. Diagnostic text contains no parser state IDs or byte coordinates;
hosts convert the separate UTF-8 offsets to their own line/column presentation.
Grammar context uses rule names and definition file/line/column coordinates.

Step statuses: `declaration`, `statement`, `done`, `error`. `previousRevision`
is the revision used to read the construct. A successful declaration advances
`revision`; its returned grammar snapshot is the newly committed grammar.
A rejected declaration leaves the revision and installed rules unchanged and
stops the session. Repeated steps on that failed session return the error.

Successful constructs include a `nodes` array in preorder. Each node contains:

```json
{
  "id": 123,
  "parent": 0,
  "label": "Variable",
  "role": "Variable",
  "start": 341,
  "end": 345,
  "production": 18
}
```

`parent` indexes this array, or is null for its root. Children appear in source
order. `role` is the named capture, or an empty string. Null `production` means
a token; a number identifies a table-local production. Spans are half-open
UTF-8 byte ranges. Empty productions/capture lists may have zero-length spans.
Labels and roles are copied; snapshots remain usable after the session closes.
Grammar declaration nodes also expose `semantic` (`parse`, `token`, `skip`,
`alternative`, `term` or `template`), describing components on those same nodes.
Canonical grammar serialization uses the default declaration spelling. Source
formatting additionally verifies that the current file's grammar accepts the result
with the same trees; an incompatible edited dialect returns an error. Compiled
parser tables/lexer DFAs are derived caches. Published
module nodes are treated as immutable; edit a new document/version and install
its formatted source rather than mutating a live parser's cached entities.

Inspect uses `snapshot` or `error` status and adds `highlights`:

```json
{ "start": 336, "end": 339, "revision": 5, "kind": "keyword" }
```

Inspect also reports `grammarBuilds` and `grammarCacheHits` since the latest
create/reset, and `cachedGrammars` (at most 64). The cache belongs to the session
and is freed on destroy. It contains successful compiled tables keyed by the
complete structural grammar and ordered token/skip definitions, including
patterns, styles, literals, captures and repetition. A
reset clears definitions, revisions, progress, errors and highlights; cached
future grammars never activate early. Parse trees are rebuilt with current spans.

Built-in display kinds are `keyword`, `rule`, `capture`, `identifier`, `number`,
`string`, `pattern`, `operator`, `comment`, `invalid`. Token declarations may
supply another kind with `as Name`. Ranges are sorted and non-overlapping;
skip rules without a style produce no span. Parsed tokens use the revision under which they
were actually read. The unread suffix is a **lexical preview** under the last
committed revision; no declarations in that suffix are evaluated by inspect.

`rules` is an array of `{ name, definition }` with normalized readable rule
bodies. `keywords` contains all currently reserved word literals, including
the declaration keywords supplied by bedrock (normally `parse`, `token`, `skip`,
`as`, and `replace`). No application keyword
vocabulary is duplicated in JavaScript. `tokens` is an ordered array of
`{ name, pattern, kind, skip }` describing the active lexical rules. Token
declarations return the same `declaration` step status as parse declarations.

## Worker protocol

`src/worker.mjs` receives `{ id, source }` and analyzes the whole document. It returns `{ id, result: { events, end, snapshot, ms } }`
or `{ id, error }`. The worker owns one native session and resets it in place.
`events` contains successful top-level trees; `end` reports done/error. The UI
presents them as ordered children of one Document root; native stepping is an
internal parsing API, not a separate construct-history interface.

The UI schedules edits on the next animation frame, keeping one request in
flight and coalescing pending edits to the latest source. It rejects stale
replies and keeps the worker warm. A timeout or runtime failure terminates the
worker; the next reset/analyze can instantiate a fresh module. Active IME
composition postpones automatic analysis. Old decorations map through edits
until the new highlights arrive; old tree spans cannot be selected while stale.
`src/offsets.mjs` maps UTF-8 bytes to CodeMirror's UTF-16 positions, preserving
non-ASCII strings and comments. This adapter is a candidate for replacement
when Tower owns editing and rendering.

For example, another static page alongside these assets can query Tower directly:

```js
const worker = new Worker('./worker.js', { type: 'module' });
worker.onmessage = ({ data }) => {
  if (data.error) console.error(data.error);
  else {
    console.log(data.result.events);              // declarations and parse trees
    console.log(data.result.snapshot.highlights); // revision-aware source ranges
  }
};
worker.postMessage({
  id: 1,
  source: "parse Statement = Number ';'; 42;",
});
// Later: worker.terminate() releases the worker and its WASM instance.
```

Wait for each reply before sending the next request on one worker.

## Foundation execution (ABI version 3)

`tw_exec_create(source, bytes)` parses, expands and type-checks the entire source,
returning an execution handle. Source inherits the installed Foundation grammar
and may extend it with local declarations.
Source validation/resource failure returns zero and sets `tw_last_error`;
ordinary compilation errors remain on the machine and are returned by step.
There are at most eight machines per instance, independently of parser sessions.

`tw_exec_step(handle, budget)` runs at most `min(budget, 100000)` reference
interpreter tasks (statement/scope work and resumable expression evaluation,
not a stable instruction encoding). Nested calls obey the same budget.
Zero inspects without running. It returns JSON with `status` (`executing`, `done`
or `error`), `error`, UTF-8 `errorOffset`, `output` (only new text), `steps`
and `outputTruncated`. Output is drained on each call and capped at 65,536 bytes
over the entire run. No execution occurs after a compile error. Runtime errors
stop the machine and preserve output already produced. Step counters are JSON
numbers; exact display of counts beyond JavaScript's safe-integer range is not
promised.

`tw_exec_create_foundation(source, bytes)` accepts bare foundation source using
the installed module and reports offsets relative to that text. Both compile
entry points share that baseline; no generated grammar prefix is required.
`tw_exec_foundation(handle)` returns borrowed JSON `{ source, spans, types }`:
canonical foundation text plus UTF-8 `{ begin, end, source }` statement mappings
from canonical ranges to original locations. Failed programs return empty source.
Nested ranges use the most specific containing span for diagnostics. Copy this
result before another execution call. `tw_exec_destroy(handle)` releases the
machine and its owned tree; unknown handles are harmless to destroy.

`tw_exec_prepare_package(handle, profile)` is an optional ABI 3 extension. It
formats the input program as canonical Foundation, reconstructs and checks that
program, prepares its execution cache, and validates the encoded `.towerbc`
envelope/cache against the checked graph. Success returns a new, independently
owned execution handle, ready to run from the beginning; it does not consume or
advance the input handle. The caller destroys both handles when finished. Failure
returns zero and sets `tw_last_error`, including when no machine slot is available.
`tw_exec_bytecode_size()` and `tw_exec_bytecode_data()` expose the prepared bytes;
copy them before the next packaging call replaces that borrowed buffer.
The existing `tw_exec_bytecode_options(handle, profile)` returns only the byte
count and discards the reconstructed session. `tw_exec_load_bytecode(data, size)`
continues to validate external packages by reconstructing their Foundation and
checking their cache independently. Hosts supporting older compiler generations
can fall back to those two calls when the new export is absent.

`types` reads the same program-owned type entities used for semantic checking.
Entries contain `{ name, kind, size, alignment, fields }`, with kind `scalar`,
`void` or `struct`. Fields contain `{ name, type, offset, size, alignment }`.
The table includes built-ins and user structs; rejected programs return an empty
table. Offsets describe the [portable value layout](../docs/foundation.md#struct-milestone),
not the interpreter's auxiliary checked-cell storage or a host/native ABI.
This is inspection metadata, not a second program interchange representation or
Tower-language reflection API.

`src/execution-worker.mjs` serializes `{ id, source, foundation, backend }` requests
and retains only the latest pending source revision. Backend is `interpreter`,
`fast` or `llvm`; the UI starts selected backends concurrently. Messages
include `backend` and return `{ id, foundation }`, then `{ id, result }` updates (same step fields), or
`{ id, error }` for host failures. Output updates are batched at approximately
50 ms, with a final update immediately on completion/error. Before running a
compiled program, the worker sends `{ id, ready: true }` and waits for
`{ command: 'execute', id }`. The UI grants this only to the current revision.
`{ command: 'cancel', id }` rejects a pending permission and drops that queued
revision; a newer request also invalidates the old permission. Reactor calls and
source-capability changes remain serialized. The UI rejects obsolete results,
preserves workers still compiling on automatic edits, and owns worker termination
for running programs and explicit cancellation. This
worker is distinct from `src/worker.mjs`; running code cannot stall live parsing.

LLVM work reports `{ id, phase }` and `{ id, llvm: { before, after, wasm } }` before
execution result updates. LLVM results omit interpreter step counts. The UI compares
the two terminal results: captured output, status, trap message/location and truncation.
It reports mismatches or unavailable backends explicitly. LLVM compilation, linking,
module instantiation and execution all stay in this worker. Cancellation is
worker termination rather than a cooperative interrupt or language exception.
Each message may carry `timings`: `load`, `tower`, `instructions`, `llvmLoad`,
`llvm`, `parse`, `before`, `after`, `emit`, `execute`, in milliseconds. Fast execution
also reports `optimize`, `reconstruct` and `package`; package timing includes
canonical reconstruction, cache preparation, encoding and verification. LLVM's native
clock measures source checking, lowering/unoptimized IR, optimization/optimized IR,
and emission/linking separately. Host timing includes calls and result copying.
Instruction timing is shared-node formatting, not a compact bytecode compilation.
Execution timing includes guest module initialization (LLVM) or cooperative yields
(interpreter); it is elapsed time to finish, not an isolated benchmark.

The interpreter and LLVM consume semantic components attached to retained
TowerNode parse entities. Canonical foundation text is the only Tower program
transport. The old binary graph and debug-instruction exports are removed.
See [foundation direction](../docs/foundation.md).

The separate LLVM reactor exports `tw_llvm_compile(pointer, length)` for UTF-8 foundation source
(maximum 8 MiB, no NUL). Configure its foundation module
first. It parses and checks source using the shared frontend before lowering,
returning
JSON with compilation status/error, source offset, name/error tables and byte
count. On success, `tw_llvm_before()` / `tw_llvm_after()` return LLVM IR strings;
`tw_llvm_bytes()` / `tw_llvm_size()` expose the linked module. Copy borrowed
results before another compilation. `src/llvm-host.mjs` handles allocations and
copies, and hosts the resulting module's `tower.print` / `tower.trap` imports.
Calling exported `tower_main` runs the compiled program. The WASM executable
does not contain the interpreter.

The UI defaults to auto execution after successful full parses containing Core*
statement trees. A single 200 ms quiet period, reset by each edit, precedes analysis
and auto execution; composition defers automatic work. Opening a document or
explicitly executing bypasses the delay. Diagnostics and output remain visible
until replacement results arrive. Parse errors clear with successful analysis;
semantic/runtime errors clear with successful compilation, without waiting for
execution to end. Reused runtime load timings describe the current
request and carry a separate cached flag, not a saved cold-load duration.
Syntax-only documents keep parsing without execution errors. Cancellation marks
the current document revision as handled, so a late parse/re-inspection cannot
restart it; another edit or explicit Execute can. The Auto execute toggle is
persisted independently of source text and can restore manual operation.


## Project compilation

`tw_exec_create_files(sources, lengths, count, pointer_bytes) -> handle` accepts
wasm32 arrays of source pointers and UTF-8 byte lengths (1-1,024 files, 8 MiB
combined). It copies ordinary Tower source, independently parses each file from
the installed Foundation, and checks the resulting shared nodes as one ordered
program. It returns the same execution handle used by the existing step,
foundation-format and destruction functions. No extra IR or storage encoding is
introduced. The JS adapter exposes `compileFiles([{path, text}, ...], options)`.
Paths belong to the host's project manifest. Diagnostic and formatter provenance
indices count file UTF-8 lengths plus one separator byte between files; hosts map
them back to the original path/byte position. Grammar changes remain file-local;
module declarations bind across the ordered compilation unit and effects retain
source order. This additive ABI entry point requires a rebuilt frontend reactor;
ABI version 3's existing exports retain their contracts except the raised limit.
