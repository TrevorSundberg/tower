# Parser tree construction and debug output

The same runtime/parser now also runs in the [static WASM playground](../../playground/README.md).
Native and WASM parser builds use explicit error returns with C++ exceptions disabled.

The parser command also runs `host-runtime.tower`: CLI ordering, borrowed argument
lifetimes, link-array cleanup, allocation overflow, zero-size release and injected
allocation failures are tested in Tower. `towerc-stage1` and `towerc` use the
Tower host implementations; `towerc-seed` retains the original native policies
solely to break the bootstrap cycle. None is yet a Tower-only compiler.

`host.tower` checks JSON byte escaping, exact unsigned 64-bit serialization,
buffer aliasing and typed browser handle ownership. `interpreter-storage.tower`
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

The session API is in [syntax.hpp](../syntax.hpp). `syntax_next()` transfers one
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

The native runner also loads `foundation.tower` and runs `core-tests.cpp` under the same
sanitizer configuration. It checks typed assignments, pointer aliases, expired
local lifetimes, type rejection before execution, loop exits and bounded stepping
of infinite loops. The browser/WASM suite in `playground/tests/execution.test.mjs`
additionally exercises numeric conversions and traps, all binary operation
families, nested control flow and scopes, repeated slot lifetimes, output limits,
replacement source provenance, semantic ABI syntax changes and grammar reuse.
The core tests require `foundation.tower` in the
working directory; `run.ps1` copies both automatically.
