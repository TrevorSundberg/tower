# Parser tree construction and debug output

The isolated tooling check `lld_compat_checks.tower` validates the Tower LLD
compatibility patcher against exact output and rejection fixtures, including
real file I/O. Build it as a library object and link `guest-host-library.o`; pass
an isolated writable fixture path to the resulting executable. The journal's
2026-11-21 tooling migration entry records full commands and independent Python
comparison evidence. The production browser build invokes the Tower patcher
through `build-bootstrap.sh --tools`.

`tool_archive_checks.tower` covers the Tower CRC/ZIP/Roku tools and POSIX path
protection. `deflate_checks.tower` writes a 161-member ZIP corpus plus independent
expected files; validate/extract it with a standard ZIP reader, then compare the
directories byte for byte. Both build as library objects linked with the existing
`guest-host-library.o`, with no zlib dependency. The journal's in-house archive
entry records the Docker/WSL commands, codec scope and compression tradeoff.

`tool_process_checks.tower` validates the Linux tool runner with exact child
arguments, empty strings, ordinary exits, signals, exec/redirection failures,
large binary stdout capture and unchanged output on failure. Build it as
a library object, link `guest-host-library.o`, then run it by absolute path.
The argument helper avoids the published bootstrap's duplicate-literal issue
when string literals are passed directly to inferred generic calls.

`sha256_checks.tower` checks standard SHA-256 vectors, all chunk splits, a million
`a` bytes, non-consuming finalization and rejected input. Pass a writable fixture
directory, then independently verify its 260 binary fixtures with
`sha256sum --quiet -c <directory>/checksums.txt`.
`tool_files_checks.tower` takes a new fixture directory and checks bounded reads,
resource traversal, file/directory symlink policy and atomic publication refusing
file, directory and dangling-symlink collisions. Both build as library
objects linked with `guest-host-library.o`. The journal records the independent
Python packager comparison and subsequent removal of the bootstrap archive/
installer layer in favor of directly runnable checked-in files. Reader/installer
experiments are preserved in Git history; they are not required build tooling.

The same runtime/parser now also runs in the [static WASM playground](../../playground/README.md).
Native and WASM parser builds use explicit error returns with C++ exceptions disabled.

The standalone `tower-bytes-tests` and `tower-utf8-tests` targets now run Tower
test entries. Build them in the parser configuration and run
`ctest --test-dir <build> -R 'tower-(bytes|utf8)-tests' --output-on-failure`.
The byte tests retain all 20,000 seeded reference comparisons, a Tower moving
allocator with guards and failure injection, aliasing and overflow checks. UTF-8
retains exhaustive scalar and one/two-byte comparisons, seeded malformed inputs,
and protected-page checks on Linux/macOS. Their native reference oracle seeds
remain test-only. For WASI builds, run each executable with `host-wasi.mjs`;
WASI exercises the byte guards but has no POSIX protected-page test.

`tower-lexer-tests` and `tower-entity-tests` are separate Tower entries in the
parser configuration, also executable through `host-wasi.mjs`. Lexer coverage
preserves 150 seeded NFAs against direct simulation, 500 seeded lexer tables
against the native reference, and allocation-failure sweeps. Entity coverage
uses an explicitly owned store and Tower finalizers. The browser node self-test
also runs Tower (`nodes.tower`) through the production lifecycle dispatch.

Compiler storage and the compiled Foundation entity-registry checks now execute
in Tower from the parser aggregate. For a focused native run, configure
`-DTOWER_STORAGE_TESTS=ON`, build `tower-storage-tests`, and run
`ctest --test-dir <build> -R '^tower-storage$' --output-on-failure`.
This uses the same production parser/compiler services and an instrumented
allocator; it covers UTF-8 source locations, deep copies and ownership transfers,
Foundation payloads, borrowed edges, aliasing, failure atomicity, 600-level tree
clones, 100 session resets and source provenance surviving session destruction.

Formatter fixtures now run in Tower. Configure the native build with
`-DTOWER_FORMAT_TESTS=ON`, build `tower-format-tests`, and run
`ctest --test-dir <build> -R '^tower-format$' --output-on-failure`.
The WASI parser configuration provides the same standalone target, executable
through `host-wasi.mjs`. The parser aggregate also calls the focused suite.
Sixteen frozen fixtures preserve exact UTF-8 text and ordered source-span triples
independently verified against the unchanged former native formatter on Linux
and WASI before its retirement. Coverage includes source and Foundation round
trips, generated names/literals containing NUL, comment order, 32 source-layout
allocation failures and 32 Foundation-result failures with empty published
output and complete cleanup. The temporary syntax-result ABI is explicitly
restricted to Linux x86_64/libstdc++ and WASI SDK 34/libc++.

The broad repository formatting check remains available as the separate native
`-DTOWER_FORMAT_SWEEP=ON` / `tower-format-repository` CTest. It checks canonical
source, idempotence, filename-relative modules, Bedrock/Foundation baselines and
invalid syntax fixtures. It is off by default and was not run during this
migration; a two-file check exercised its valid/invalid file-list path. The
existing playground formatting tools remain available.

`tower-syntax-nodes-tests` is a focused native/WASI parser-configuration target.
It retains the native syntax-payload suite's independent equality traversal,
all 17 exported field offsets, NUL-containing fields/comments, retained
source/pattern/replacement ownership, 64-child comparisons and allocation-failure
atomicity. The parser aggregate calls the same Tower cases. Run the native binary
or pass the WASI binary to `host-wasi.mjs`.

`tower-reader-tests` runs declaration-reader coverage against an independent Tower
oracle verified against the retired native reference. It preserves all 1,000 seeded identifier/literal byte cases,
in-place/aliased decoding, eight declaration fixtures, exact malformed-tree
diagnostics, shared source provenance, canonical declaration output and allocation
failures. Native CTest sets its working directory to the grammar resources;
WASI uses `host-wasi.mjs`. The parser aggregate calls the same cases.

`tower-validation-tests` checks grammar validation against the independent Tower
oracle on Linux and WASI. It compares exact result/error/offset/pending-term
identity and order, required declaration captures, nullable/productive rules,
forward references, NUL-containing names, 1,500 captures, 600 seeded dependency
graphs and allocation-failure cleanup. It uses the same grammar setup and runner
conventions as `tower-reader-tests`.
The reference was translated from the frozen native seed with SHA-256
`094f9e736b6ab469a30630a7effd81ddb9b706f9af6d85df6d870a4168eb8850`.
Native/Tower-reference/production three-way comparisons passed on both targets
before removing the native seed; the permanent tests keep the independent
reference comparison. Its sorted borrowed views and reference dependency scan
do not reuse the production validator's indexes or checking policy.

`tower-live-syntax-tests` runs the migrated live-session suite independently on
native and WASI: sequential grammar installation, replacement provenance and
ownership, LR boundaries, rejected edits, cache reuse and lexical definitions.
Its separate Tower object also supplies `syntax_tests` through the existing
parser interface. The aggregate entry and `--trace`, `--host-only`, `--parse`
dispatch live in `parser_main.tower`; the command preserves failure exit codes
and grammar revision/tree output. `nodes.tower` retains attachment, named-member,
reference-count and payload-lifetime assertions. A Tower lifecycle ID replaces
the unused native callback registry; the fixture checks userdata/owner/type,
exactly-once finalization, independent-store ownership and allocation balance.
This does not introduce general first-class function pointers.

The isolated `cmake/TowerDriver.cmake` fragment adds CLI checks with
`-DTOWER_DRIVER_TESTS=ON` to a native compiler configuration. Build `towerc` and
`tower-driver-tests`, then run `ctest --test-dir <build> -R tower-driver
--output-on-failure`. The runner and fixtures are Tower; it launches the real CLI
and checks output/error bytes, flags, both interpreters, dependency/IR outputs,
Foundation/C/BrightScript/bytecode outputs, separate library linking and executable
results. Policy checks also cover target link arguments, timing serialization,
argument boundaries and temporary cleanup after tool failure. Fixtures stay out
of the production driver object. The standalone runner uses the Tower guest
runtime artifact for allocation, output and traps.

For browser backend service ownership checks, configure the LLVM browser build
with `-DTOWER_BACKEND_TESTS=ON`, rebuild it, then run
`TOWER_REQUIRE_BACKEND_TESTS=1 node --test playground/tests/backend-worlds.test.mjs`.
The Tower fixture checks explicit-world source compilation and optimized
Foundation reconstruction, foreign-environment rejection, retained output and
independent world cleanup. JavaScript only supplies baseline bytes and invokes it.

Windows process/quoting checks can run independently of a Windows compiler build:
cross-compile a manifest importing the driver support, timing, windows_arguments,
windows, link and prepare modules plus `tests.driver_windows` and `tests.driver`.
Separately compile `tests/driver_standalone.tower` and `library/bytes.tower`; link
the three objects with a Tower guest runtime built without its entry point, the
Windows CRT and kernel32. Run without a compiler argument for platform checks.
The standalone provenance stub is unused by these tests; actual CLI diagnostics
are checked by launching a real compiler, never by that stub.

The parser command also runs `host_runtime.tower`: CLI ordering, borrowed argument
lifetimes, link-array cleanup, allocation overflow, zero-size release and injected
allocation failures are tested in Tower. `towerc-stage1` and `towerc` use the
Tower host implementations. The obsolete native driver seed has been removed;
the current compiler still contains other native compiler adapters.

`host.tower` checks JSON byte escaping, exact unsigned 64-bit serialization,
buffer aliasing and typed browser handle ownership. `interpreter_storage.tower`
checks execution-memory growth/failure, sorted maps, frame/task storage and
disposal. Both run in the parser command, alongside the retained native
reference comparisons. Their functional cases and storage implementations are
Tower source.

`bash playground/scripts/test-host-runtime.sh` builds and runs the complete
WASI parser and interpreter differential commands. The bootstrap comparison
script also compares six Tower modules across Linux x64, wasm32, Windows x64
and macOS ARM64 object targets. These object comparisons are distinct from
native execution and whole-compiler self-hosting.

To run this complete command on Wasm32, configure `TOWER_PARSER_ONLY=ON` with
the WASI SDK toolchain and a host `TOWER_BOOTSTRAP_COMPILER`, build
`tower-parser-tests`, then run:

```text
node scaffolding/tests/host-wasi.mjs path/to/tower-parser-tests
```

This runner mounts the checked-out Tower fixtures in the same portable WASI host
used by the playground. CMake makes the formatter fixture's source paths relative
to that mount; the test does not require the original build machine's filesystem.

Run the native tree/parser checks without building LLVM or the WASI runtime:

```powershell
./scaffolding/tests/run.ps1
./scaffolding/tests/run.ps1 -Trace
./scaffolding/tests/run.ps1 -Sanitize
./scaffolding/tests/run.ps1 -Sanitize -Optimize
./scaffolding/tests/run.ps1 -Source scaffolding/examples/foreach.tower
./scaffolding/tests/run.ps1 -Source scaffolding/examples/replacements.tower
```

The Windows script uses Visual Studio 2022 Build Tools; `-VcVars` can select a
different developer environment. `-Trace` enables table construction and individual
shift/reduce events. `-Sanitize` enables MSVC AddressSanitizer.
The script now uses CMake to compile and link the Tower-written compiler modules.
Supply a template-capable native compiler with `-BootstrapCompiler` (or
`TOWER_BOOTSTRAP_COMPILER`); otherwise it builds the intermediate host compiler in
WSL and cross-compiles those modules to Windows COFF before linking with MSVC.

The syntax suite also checks replacement chains, named/repeated captures, empty
bodies, duplicate-use ownership, unused captures, named helper activation, atomic
template errors, recursion limits, and provenance surviving session destruction.
The WASM suite additionally checks parsed-tree shape against ordinary source,
grammar/lexer edits, source-offset changes, optional captures and deep identity
expansion without subtree copying. These are production C++/WASM checks, separate
from the earlier JavaScript replacement-shortcut research model.

Alternatively, with CMake and a C++20 compiler:

```text
cmake -S . -B build/parser-cmake -DTOWER_PARSER_ONLY=ON -DTOWER_BOOTSTRAP_COMPILER=/path/to/towerc
cmake --build build/parser-cmake --config Debug
ctest --test-dir build/parser-cmake -C Debug --output-on-failure
```

The test executable prints the complete tree for `1+2*3`:

```text
rule E #1 [0, 5)
  rule E #2 [0, 1)
    rule T #4 [0, 1)
      rule F #6 [0, 1)
        token '1' [0, 1)
  token '+' [1, 2)
  rule T #3 [2, 5)
    rule T #4 [2, 3)
      rule F #6 [2, 3)
        token '2' [2, 3)
    token '*' [3, 4)
    rule F #6 [4, 5)
      token '3' [4, 5)
```

`#N` is the production index, distinguishing alternatives with the same rule
name. Spans are half-open source byte ranges `[start, end)`. UTF-8 characters
can occupy multiple bytes. Empty productions have zero-length spans at the
current input gap. Generated helper rules flatten their children in order;
the start rule retains a root node even if marked generated.

## Using the API

```cpp
Recognizer* recognizer = parser_recognizer_create(table, stream);
bool running = true;
TowerNode* root = nullptr;
while (running) {
    root = parser_recognizer_step(recognizer, &running);
}
if (root) {
    parser_tree_debug_print(root);
    tower_node_release_ref(root);
} else {
    fprintf(stderr, "%s\n", parser_recognizer_get_error(recognizer));
}
parser_recognizer_destroy(recognizer);
```

The table and stream must outlive the recognizer. Acceptance transfers one
reference to the caller; the returned tree and its debug labels survive parser,
table and input destruction. Destroying an incomplete or failed recognizer releases
its partial tree and owned lookahead. Stream callbacks transfer one owned reference
for any returned node; existing components and child nodes are preserved.

`parser_tree_debug_string(root)` returns the same formatted output for tooling or
tests. Release its buffer with `tower_memory_free`. It can also inspect ordinary
nodes without `Match` components, printing `node` and walking their children.

Validation covers exact tree shape, precedence, associativity, parentheses, LALR
lookahead, nullable sequences, generated helpers, character ranges, UTF-8 spans,
escaped debug labels, token payload preservation, stream layering, invalid input,
early destruction and allocation counts. The original tree/component/table checks
also run.

## Live grammar declarations and foreach

[foreach.tower](../examples/foreach.tower) defines its own loop syntax:

```text
parse Variable = Identifier;
parse Expression = Identifier | Number;
parse Statement = Expression ';';
parse ForEach = 'for' '(' $Variable 'in' $Expression ')' '{' $Statement* '}';
parse Statement |= ForEach;

for (item in items) {
    item;
    for (child in children) { child; }
}
```

The same file later replaces `ForEach` with a rule using the keyword `foreach`,
then immediately parses that spelling. No loop syntax or keyword is hard-coded
in [the native seed](../bedrock.cpp). The seed always reads bedrock.tower; the
resulting declaration grammar reads foundation.tower and later source. Native
declaration evaluation installs their shared semantic rule nodes. This is an
executable bootstrap subset of Tower's grammar language, not yet an interpreter
for arbitrary Tower function bodies or loop execution/lowering.

Supported forms:

- `parse Name = ...;` defines or replaces a rule.
- `parse Name |= ...;` adds alternatives to an existing rule.
- Concatenation, `|` alternatives, and postfix `*`, `+`, `?` are supported.
- Single/double-quoted token literals and rule references are supported.
- `$Name` captures a reference as a named tree child. `$Name*`, `$Name+`, and
  `$Name?` produce one named container, including a container for zero matches.
- `token` and `skip` declarations define terminals and trivia. The default
  Identifier, String, whitespace and comment rules are inherited from
  [bedrock.tower](../bedrock.tower); Number is added by
  [foundation.tower](../foundation.tower). Local declarations can replace them.
  See [token syntax](../../playground/TOKENS.md).

Token literals are whole identifier-like keywords or punctuation sequences. The
lexer chooses the longest punctuation literal in the current grammar; keywords
match whole words. Mixed word/punctuation tokens, whitespace-containing literals,
quote/comment delimiter literals and grouped grammar expressions are not implemented.
Rule references must resolve when the declaration is installed (self-recursion is
allowed when productive). Bedrock's GrammarAssignment, GrammarAtom and other
rules are reusable by name. No `__` prefix is reserved; parse and token rule names
cannot collide. Generated helper names avoid all names in the active grammar.

`Statement` is the designated application entry rule. Declarations and statements
are parsed one at a time using the same LALR implementation as the tree tests.
Use `ParserTableMode::Constructs` when building a table for
`parser_recognizer_create_prefix()`. The start rule's lookaheads include EOF and
FIRST(start), checking conflicts between consecutive constructs during table
construction. Real lookahead chooses continuations: `ForEach | 'for'` accepts
both a bare `for` and the full loop. `'x' | 'x' 'x'` is rejected because `x x`
could be one construct or two. Diagnostics identify shift/reduce or reduce/reduce
conflicts and their competing actions.

States with one uniform EOF reduction can reduce without reading ahead. Otherwise
the recognizer keeps one lookahead token. When that token has no table action,
EOF reductions may finish the current construct; they run once on the real stack.
There are no copied stacks, trial parses or fallback to an earlier accepted prefix
after shifting a continuation. Unconsumed lookahead, including an owned node or
stream error, is returned to the stream. An incomplete `for(` therefore errors
rather than becoming a bare `for`.

At each declaration boundary the driver compiles a candidate table and publishes
it only if validation succeeds. It destroys the previous recognizer before swapping
tables. No parser state or lexed lookahead is carried into the next grammar revision.
Malformed declarations, unresolved references, conflicts, duplicate captures,
nullable statements and unproductive repetitions return diagnostics. A failed
installation leaves the previous grammar revision intact and stops the session.
A session caches up to 64 compiled grammars; new definitions still require table
construction. This is not temporal repair yet.

The session API is in [syntax_session_setup.tower](../compiler/syntax_session_setup.tower)
and [syntax_session_scan.tower](../compiler/syntax_session_scan.tower). `syntax_next()` transfers one
root per declaration or statement. `syntax_get_error()` distinguishes failure from
EOF. Roots, copied labels and named captures survive later declarations and session
destruction; numeric match and production IDs remain local to their original table.

Tests exercise consecutive declarations with no separating whitespace, keyword
activation, keyword replacement/removal, nested loops, empty bodies, captures,
repetition, strings/comments, atomic failure, and retained-tree lifetime. A low-level
stream test checks that self-delimiting recognition stops without reading ahead;
another checks ownership of a buffered lookahead. The syntax driver discards
uncommitted highlight spans and resumes at the accepted root's byte end, so the
next declaration or grammar revision can tokenize afresh. Work counters check
linear scaling across nesting and repetitions in both recursion directions.
CTest also parses the actual example file.

## Current boundaries

Whole-input recognition and explicit construct-prefix recognition are available.
A recognizer-backed stream still exposes one accepted root and then EOF; the syntax
session uses a separate lazy token stream. Arbitrary reduction callbacks, scoped
grammar imports, general character-range partitioning and syntax-error recovery
remain separate work. Checked table creation now reports unresolved rules and
conflicting actions; internal assertions still guard unsupported table invariants.

## Typed core interpreter

The Tower execution suite (`execution_main.tower`) replaces the native
`core-tests.cpp` harness. Enable `TOWER_EXECUTION_TESTS=ON` in the documented native
build, build `tower-execution-tests`, then run `ctest --test-dir <native-build>
-R '^tower-execution$' --output-on-failure`. The test passes the repository grammar
resource directory explicitly.

It checks 156 graph/fast interpreter trials (26 fixtures, two target pointer
widths, three step budgets), exact error text/offset agreement, guest memory,
foreign calls and relocation, allocation/reallocation, output limits and
cancellation. Core fixtures preserve graph structure and bindings through
canonical Foundation round trips, generic identity, target layouts, quoted names,
and request ownership. Package trials reconstruct checked Foundation, verify its
execution cache, reproduce identical bytes, and reject checksum corruption and
truncated envelopes. These tests use the production Tower execution session used
by the CLI. The same suite runs on WASI through `execution_wasi.tower` and the
existing `playground/scripts/test-host-runtime.sh` path. The native interpreter
adapter, reference interpreter and semantic reference seed have been retired.
Before removal, the unmodified semantic reference suite passed at both widths.
Tower fixtures retain its 53 exact invalid-program messages and offsets, complete
semantic-field/edge fingerprints for 12 valid programs per width, multifile
bindings and effects, and canonical/execution agreement. Fingerprints are test
evidence only, not a program format. The parser aggregate links the independent
Tower storage fault-injection tests without an interpreter host adapter.

The browser/WASM suite in `playground/tests/execution.test.mjs` additionally
exercises numeric conversions and traps, binary operations, control flow,
replacement source provenance, semantic ABI syntax changes and grammar reuse.
