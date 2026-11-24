# Parser

The C++/WASM parser now supports tree replacements with `=> replace { ... }`.
The [working example](../scaffolding/examples/replacements.tower) defines expression
replacements, a nested foreach-to-loop transformation, and repeated statement
captures. The older lowering sketches below also assume core grammar and runtime
operations that are not yet implemented.

An important concept in Tower is that the features of the language are defined within the language itself, including in your own code. Tower allows the user to add new parse rules to the language and implement their behavior. A common use of this is to add new syntax sugar that when parsed, is transformed into the expanded verbose version. For example, for-each loops in Tower can be written as:

```ts
// Tower uses a familiar syntax to Extended Backus-Naur Form (EBNF)
parse ForEachLoop = "for" Identifier "in" Expression Statements => replace {
  {
    let __iterator = $Expression;
    loop {
      if (__iterator.empty()) {
        break;
      }
      let $Identifier = __iterator.next();
      $Statements
    }
  }
};
```

This allows Tower to parse for-each loops in the format:

```ts
for foo in bar {
  print(foo);
}
```

1. `foo` is parsed as an Identifier
2. `bar` is parsed as an Expression
3. `{ print(foo); }` is parsed as Statements

And transform them into:

```ts
{
  let __iterator = bar;
  loop {
    if (__iterator.empty()) {
      break;
    }
    let foo = __iterator.next();
    {
      print(foo);
    }
  }
}
```

Tower was greatly inspired by pondering why we can't write C++ style Range-based For loop in langauge:

https://en.cppreference.com/w/cpp/language/range-for.html (See Explanation and how it expands to more C++ code)


At the base of tower is a primitive SSA (Static Single Assignment) form instruction set similar to LLVM which includes basic blocks, conditional and uncoditional jumps, and primitive operations.

```ts
parse If = "if" Expression Statements => replace {
  let conditional = $Expression;
  goto_if(conditional, __if_true, __if_false);
__if_true:
  $Statements;
__if_false:
};
```

```ts
parse Loop = "loop" Statements => replace {
__loop_start:
  $Statements
__loop_continue:
  goto(__loop_start);
__loop_exit:
};
```

```ts
parse Break = "break" => replace {
  goto(__loop_exit);
};
```

```ts
parse Continue = "continue" => replace {
  goto(__loop_continue);
};
```

Just like we saw with the range based for loop, we can also write other primitive loops using the above concepts:

```ts
parse WhileLoop = "while" Expression Statements => replace {
  loop {
    if !$Expression
    {
      break;
    }
    $Statements;
  }
};
```

And with the above definitions, we could now write code like:

```ts
if isSunny {
  print("go surfing!");

  while isSunny {
    catchRadWaves();
  }
}
```


The Identifier, Expression, and Statements are simply other grammar rules defined within the standard library of Tower. Tower uses a clever technique that pre-parses transformations and performs simple Abstract Syntax Tree (AST) substitutions to keep parsing fast.

## Grammar Rule Syntax

The syntax for Tower's EBNF style grammar rules is implemented within Tower itself:

```ts
// An identifier is any letter or underscore, followed by any number of letters, numbers, or underscores
token Identifier = [a-zA-Z_][a-zA-Z0-9_]*;

// A string literal is quoted, and allows escapes
token String = '"' ([^"\\] | "\\\"" | "\\\\") '"';

// Define a new rule that is either a transform or has a code handler
parse Rule = ("token" | "parse") Identifier ("=" | "|=") RuleAlternation ("=>" RuleHandler)? ";";

// Alternation: A | B | C parses any one and only one of A, B, or C
parse RuleAlternation = RuleConcatenation ("|" RuleConcatenation)*;

// Concatenation: A B parses A first and then B
parse RuleConcatenation = RuleUnaryOperators RuleUnaryOperators*;

// Unary Operators: A*, A+, A?
parse RuleUnaryOperators = RuleValue [*+?]*;

// Character Sets: [abc], [a-z], [^abc], [abc-], etc
token RuleCharacterClass = "[" $Not("^"?) (RuleCharacterClassRange | RuleCharacterClassChar)+ "]";

// Character ranges, such as "a-z"
token RuleCharacterClassRange = RuleCharacterClassChar "-" RuleCharacterClassChar;

// Match any character except ] or \, but allow escaping \] or \\ so we can write [a-z\]]
token RuleCharacterClassChar = [^\]\\] | "\]" | "\\";

// A capture group captures all the AST nodes in a parse
parse RuleCapture = "$" Identifier "(" RuleAlternation ")"

// Values and grouped expressions
parse RuleValue = Identifier | String | RuleCharacterClassRange | RuleCapture | "(" RuleAlternation ")";

// Handle the rule in one of the following ways
parse RuleHandler =
  "replace" "(" UserCode ")"  | // Replace parsed rule with with parsed user code
  "wasm" "(" Wasm ")"         | // Run WASM code that has access to the Tower compiler API
  "run" "(" UserCode ")"      | // Run user code that has access to the Tower compiler API
  "discard"                   ; // Skip/ignore the parsed text, used to skip whitespace
```

Rules may refer to other rules by name (also called non-terminals in EBNF). To support recursion, Tower allows you to reference a rule name before it is defined. Tower will only apply new rules once all referenced rule names have been defined. It is an error Tower reaches the end of code and a rule is left undefined.

## Tokenizing and Parsing

Tower uses an incremental tokenizer and parser to allow it to pause and execute custom user code in the middle of a parse. Tower reads input in two phases, tokenization and parsing. Tokenization is the process of turning a stream of characters into individual words and symbols, as well as discarding inputs such as whitespace. Parsing is the process of taking that stream of tokens and turning it into an Abstract Syntax Tree (AST).

Whitespace for example is handled as follows:
```ts
token Whitespace = [ \t\r\n\f]+ => discard;
```

## Grammar Rule Operators

Tower's rule syntax has the following operators:

| Precedence      | Operator    | Description                                       |
|-----------------|-------------|---------------------------------------------------|
| 1               | (...)       | Grouping                                          |
|                 | $Id(...)    | Capture a group by name                           |
|                 | Id          | Reference a rule by name                          |
|                 | "abc"       | Match the sequence of characters (String)         |
|                 | [abc]       | Match any of the characters                       |
|                 | [a-z]       | Match a range of characters                       |
|                 | [^abc]      | Match anything except the characters              |
| 2               | *           | Zero or more of the previous (Kleene Closure)     |
|                 | +           | One or more of the previous (Positive Closure)    |
|                 | ?           | Optional, zero or one of the previous             |
| 3               | A B         | Concatenation                                     |
| 4               | A \| B      | Alternation                                       |


## Productions and Redefines

Tower parse and token rules uses the operator `=` to completely define a rule, and `|=` to add another alternation to it (often referred to as productions in in EBNF):
```ts
A = X;
A |= Y;
```

Is the same as:
```ts
A = X | Y;
```

Note that `|=` can be used even if the rule has never been defined before:
```ts
A |= X; // Legal, even though A was never defined
```

Using the `=` operator will redefine the rule.

```ts
A = X;
A = Y; // Now A is only Y
```

When redefining a rule, you can also use the `this` keyword to refer to a rule's previous value.

```ts
A = X;
A = Y | this; // Now A is Y | X
```

Interestingly, the only built in parse rules for Tower are BNF. Tower uses rule redefines to extend the BNF syntax to a more advanced EBNF like syntax with more operators.

## User Code

The concept of "user code" refers to code that is written within the language, according to all the parse rules currently applied. When rules are added, modified, or deleted, it changes the concept of what "user code" can be validly parsed after the rule is completed (all rule references are known) and applied.

```ts
let a = @@@; // error: invalid parse, unknown token @

// At this point, user code does not include @@@ in expressions

// Extend expressions to also parse the string @@@
parse Expression = '@@@' => replace { 123 };

// Now user code has the concept of parsing @@@

let b = @@@; // successful parse, b is now 123

// Because @@@ is now part of user code, it can be used in replacements too
parse Expression = '%%%' => replace { @@@ + 1 };

// Now user code has the concept of parsing %%%

let c = %%%; // successful parse, c is now 124
```

It is important to note that if a rule is incomplete, it will not be applied in code until all rules are resolved. For example:


```ts
let a = @bar; // error: invalid parse, unknown token @

// At this point, user code does not include @ in expressions

// Extend expressions to also parse @ with specific keywords after it
parse Expression = '@' MyKeywords => replace { 123 };

let b = @bar; // error: invalid parse, unknown token @

parse MyKeywords = "foo" | "bar" | "baz";

let c = @bar; // successful parse, c is now 123
```

## Rule Replacements

The replacement form is `=> replace { user code }` after the rule.
The template's output category is inferred from its grammar context, rather than
supplied as an extra parenthesized argument. For example:

```tower
parse Expression |= 'increment' '(' $Expression ')'
    => replace {
        $Expression + 1
    };
```

Here the template is parsed as an Expression because that is the rule being
extended. The outer braces delimit the template; they do not introduce a block
into the generated expression. The template is parsed using the grammar available
at grammar installation, with captures inserted as syntax trees. Named captures
use `$name:Rule`; `$Rule` is shorthand for a capture with that rule's name. Use
`$name` inside the replacement. A capture with `*`, `+`, or `?` contains a list,
including an empty list when permitted; inserting it splices the list in order.

The handler applies to every alternative in that declaration. Use a separate
`parse Expression |= ... => replace { ... };` declaration when only the new
alternative should expand. Templates are checked against the declared rule first.
A named helper can instead infer its destination through an enclosing unit rule,
such as `parse Expression |= Increment;`. Unreachable helpers remain pending;
their templates are checked before a declaration makes them reachable from
Statement. An inferred destination must also exist at the actual use site.

Captures must fit the grammar position where they are inserted. For example, in
a precedence grammar where the right operand of multiplication is Atom, write
`($value)` to place a captured Expression there using the grammar's grouping rule.
Tower does not flatten a captured expression into tokens or change its grouping.

Expansion is child-first. A captured subtree used once is moved, repeated uses
are copied, and unused captures are discarded after their children have expanded.
Named members and sibling order are preserved. Generated nodes retain template
and invocation coordinates; captured nodes retain their original input spans.
`syntax_get_origin` exposes shared expansion history after the session is gone.

Grammar and lexical changes revalidate active templates before publishing a new
revision. Failed changes preserve the prior grammar. Source coordinates are part
of the template cache key, preventing stale origins after edits. The current
reference expander has limits of 4,096 replacements and 65,536 constructed/copied
nodes per statement, plus 256 generated expansions in one ancestry chain.

The replacement engine implements structural syntax expansion. It does not itself
execute Tower code, resolve bindings or provide hygienic generated identifiers. The bundled foreach
example introduces no fresh local names. General transformation handlers and
shortcut composition remain later work.

The semantic compiler in `scaffolding/compiler/semantic-*.tower` consumes expanded
trees through the `scaffolding/core.cpp` loading adapter, resolves scoped locals,
type-checks operations and validates structured control flow. The existing backends
lower those shared nodes to execution or branches. `scaffolding/foundation.tower` supplies its grammar; `Core*` labels and named
captures form the bootstrap semantic ABI. The playground's Execution example
adds an `increment` replacement and executes the resulting foundation program.
Functions, typed parameters, calls, returns and structs also use those shared
semantic components. `CoreLocation` adds field selection without an arithmetic
precedence hierarchy; type names remain ordinary identifiers until semantic lookup.
Both backends consume this schema; the isolated LLVM module reparses canonical
Foundation text to reconstruct it. See
[foundation terminology and syntax direction](foundation.md). It has
no precedence grammar and no user-written phi nodes. See
[execution semantics and limits](../playground/README.md#execute-towers-foundation).

- $Expression operator
- User code
- What does it mean if the name we referencm e has more than one capture, how can I just insert that

# Grammar-driven diagnostics

Syntax errors are generated from the active LR table, without user-authored error
annotations. The diagnostic path tests expected terminals through reductions on
a temporary stack of state pointers (lookahead correction). It never runs semantic
actions, constructs trees, installs declarations or changes the recognizer stack.
Successful parsing keeps its existing shift/reduce path.

For each expected grammar literal, an insertion trial checks up to three actual
tokens, using the same lexer and the trial's parser state for contextual tokens.
Literals include custom keywords; no punctuation list or Foundation rule-name
list decides eligibility. Named token patterns are reported as expectations but
do not supply invented identifier names or values. A unique viable insertion
produces a message such as `Missing ';' before 'var'.` at the source gap. Multiple
viable insertions normally remain alternatives. Across a line break, a unique
candidate that completes the current construct can be reported as `Possible
missing ...`; this grammar-derived heuristic never claims that continuing the
expression would be impossible. This is a local suggestion, not a proof
that the rest of the file is correct, and the invalid program is never executed.

Trials are bounded: at most 64 expected terminal candidates, 128 parser actions
per probe, 8,192 actions per diagnostic, a 4,096-state copied-stack limit and 32
skipped tokens per speculative read. Exhaustion suppresses definite repair hints.
No deletion, replacement, multi-insertion search or multi-error resynchronization
is implemented. Parsing still stops at the first error.

An error at a fresh statement/declaration boundary reports that category instead
of listing arbitrary possible next tokens. Rule context is shown only when a
nonempty prefix has actually been read, never for unstarted closure items or an
empty prefix. A unique active rule is named with its definition file/line/column;
when several alternatives of that rule remain possible, only the rule name is
cited. Multiple different possible rules are not presented as requirements.
Specific rule spellings use the shared formatter. Conflict errors describe finishing versus
continuing named productions (or the two possible completed productions) and
both definition locations, without state numbers. Source provenance resides on
shared grammar nodes; cached tables retain only derived positions. Runtime error
context resolves those positions through current bindings so moving a declaration
does not retain its previous line number. A suggested insertion is exposed to
browser hosts as `errorOffset` plus `errorLength: 0`; the UI renders its location
once. Other internal UTF-8 offsets remain transport data, not diagnostic prose.

## Composable call replacements

Foundation CoreOperand includes calls, address-taking and pointer loads. The
binary form still has exactly two operands and one operator: no precedence
hierarchy is added. Calls may nest in arguments, returns, conditions, indices
and binary operands, so a replacement into CoreCall works in all those contexts
and as a standalone call statement. The Increment example defines only two
rules, capturing a CoreLocation and passing its address to an ordinary typed helper.
It does not give increment any special C++ execution semantics.

Operands and call arguments evaluate left to right. An assignment captures its
target address before evaluating the right side. This preserves exactly-once
index evaluation and the original destination even when nested calls mutate an
index or pointer. The interpreter schedules nested calls through resumable tasks
on the shared nodes. Per-statement value/address caches and a derived dependency
index are execution state only, not a second semantic graph or public encoding.
Unselected branches are not evaluated. LLVM lowering preserves the same order.
Expression nesting is limited to 128 during checking; arithmetic precedence,
type-generic helper selection and hygienic generated bindings remain separate work.

# Tasks & Dependencies

This part is still being worked out, but the concept is that an Abstract Syntax Tree is sometimes difficult to work with, and to make it easier, we take inspiration from UI frameworks like React. The idea is that React takes in values as dependencies and automatically rebuilds parts of the UI tree (React elements) when any dependency changes. This means that some nodes in the AST are somewhat ephemeral and can change or be rebuilt.

A great example of this would be how template evaluation works, we end up building out a new ephermeral tree of AST nodes based on the template definition and whatever types T we are given. However, most compilers would stop there, but to support minimal rebuild at runtime, especially when the language is being run in live mode, we should only rebuild parts of the tree when aspects of T changes, not the entire thing.

Tasks are effectively React components that define how these nodes get created and react based on the dependencies taken in.

## Tower request integration

`parser.cpp` and `parser-tree-tests.cpp` have been retired. Table construction is
in `compiler/parser_integration.tower`, request stepping and bounded diagnostic
integration in `compiler/parser_state.tower`, streams in `parser_stream.tower`,
and presentation in `parser_presentation.tower`. These reuse the existing LR,
forest, entity and formatting implementations. Parser tables are disposable
indexes over grammar entities, not a program serialization format.

Create explicit worlds and register `FrontendKinds` on the coordinator. Build a
grammar with `GrammarBuilder`, open its table with `parser_table_open`, and call
`parser_table_finish`. Keep the table, its presentation context and world alive
until all requests and completion snapshots finish. Accepted roots own their
entities and copied labels; they survive request, stream and table destruction.
Finish table construction before sharing it. Requests do not mutate table
caches or reference counts. Node materialization still requires exclusive access
to its entity store; independent worker units use independent worlds.

The request's temporary forest binds `runtime.budget` before allocating its
descriptor, child index or traversal stack. Keep that ledger alive until request
destruction. `parse_forest_create_result` reports constructor denial directly;
`parse_forest_resource_error` reports the last leaf/join/attach result.
The recognizer preserves those causes through its existing resource-error channel.
Attachment retains the entity producer's exact structural admission and allocation
result before transferring ownership, so pinned or invalid inputs remain distinct
from physical allocation failure. The legacy
`parse_forest_create` remains an explicit standalone constructor without a ledger.

UTF-8 and layered recognizer streams work through `parser_recognizer_step`.
External producers use `ParserInputService.Empty`, supply one token with
`parser_stream_return`, and call `parser_recognizer_poll`. A poll with
`waiting=true` needs another input token, including an explicit `ParserStreamEnd`
when the input is finished. `running=true` means another step can proceed;
a non-null root transfers ownership. Prefix recognition returns unused lookahead
and its error/node ownership to the stream. Cancel by destroying the request and
then the stream. Layered streams share a world so their nodes can be attached.

`parser_recognizer_diagnostic` returns an owned `ParserDiagnostic`; destroy it
with `parser_diagnostic_destroy`. Its option/context views remain valid until
then. Probes do not mutate the recognizer, stream or graph. Presentation services
are explicit enums because indirect function calls remain unimplemented. Numeric,
UTF-8 and nonterminal services are Tower implementations. Syntax presentation and
input use the syntax owner's existing C-linked services; SyntaxSession and grammar
revision ownership have not moved in this port. The old function-pointer stream
and presentation callbacks are replaced by these services and input polling.

Tracing is set before table publication. Explicit-world callers set `table.trace`;
the legacy `parser_set_debug_trace` changes only its world's coordinator setting.
Disabled requests never construct trace strings. Functional fixtures live in
`tests/parser_integration.tower` and `tests/parser_failures.tower`; the browser
self-test invokes the same production exports. The optional native measurement
target in `cmake/TowerParserBenchmark.cmake` uses `tests/parser_benchmark.tower`.
It reuses the shared Tower object rule and the frontend test's instrumented buffer
allocator. On Linux x64, configure a separate build with `TOWER_NATIVE=ON`,
`TOWER_BACKEND_TESTS=ON`, the public bootstrap and matching LLVM/Clang paths from
the documented native build. Set `CMAKE_PROJECT_INCLUDE` to the absolute path of
`cmake/TowerBackend.cmake` and `CMAKE_PROJECT_scaffolding_INCLUDE` to the absolute
path of `cmake/TowerParserBenchmark.cmake`, then build `tower-parser-benchmark`.
Run that executable without concurrent builds or tests. Its CSV rows contain input
symbols, elapsed nanoseconds, instrumented buffer allocation calls and retained
buffer count; five warmups precede eleven recorded parses at each size. This
measures the list grammar and accepted-tree release, excluding reset and grammar
construction. It does not count every host allocation or measure browser latency.

### LR phase results and physical scheduling storage

The FIRST, LR(0) state and LALR constructors expose per-call results through
`lr_analysis_create_result`, `lr_analysis_compute_result`,
`lr_analysis_compute_parallel_result`, `lr_states_create_result`,
`lr_states_create_parallel_result`, `lr_states_lalr_result` and
`lr_states_lalr_parallel_result`. Existing bool/pointer entry points remain wrappers.
Counted input/buffer overflow and invalid reached references report `Invalid`;
actual raw allocation failure reports `Memory`. Entity, pool, view, admission and
transport failures retain their own `WorkBudgetError`. A logical work-graph
failure without a storage error is `Invalid`, never an inferred allocation error.

Workers keep causes in private task/item storage. The coordinator finishes every
joined ticket, then reads results in the phase's source/frontier order before
publication. Frozen grammar/index inputs remain borrowed until that join. The
counted private closure cache validates lookup bounds. FIRST does not inspect a
reference after a nonnullable prefix; state closure can diagnose it later when
that path is actually reached. Ordinary public lookahead create/seed/edge/solve
operations also have result variants and validate their counts/endpoints.

A compiler world's retained parser pool now charges its actual clamped slot
buffer, including the shared allocator's footprint, to that world's budget.
FIRST/state/LALR/runtime work graphs charge their own temporary storage to the
same budget. These are byte-only owners, separate from extra-lane admission.
Joining releases execution grants; pool storage remains charged until its cache
closes or the world is disposed. Standalone entity stores retain the explicit
null-budget boundary. World budget binding already rejects a retained pool, so
its storage owner cannot silently change ledgers.

The table owns and discards partial derived construction on failure. FIRST can
retry after storage becomes available; a successful compute clears its failure
flag. Callers must discard incomplete LR item/state/lookahead products or restore
their documented producer state before reuse. A descriptor/cache denial that
has not modified inputs permits retry directly, as covered by the fixtures.
Raw FIRST/item/state/lookahead vectors and other request/lexer allocations remain
outside this physical-accounting change; it is not a process-memory limit or a
claim of complete parser resource coverage. Validation and measurements for this
implementation are tracked in the B1 audit and project journal.

The recognizer's private request descriptor also charges its actual allocation
footprint to the runtime's borrowed budget, before allocating. Whole-input and
prefix constructors preserve `Capacity` versus `Memory` through their existing
result APIs. Failure releases the partial descriptor, forest and LR control;
the input stream is still borrowed and unconsumed. Destroy requests before the
runtime/world budget. The descriptor's receipt is copied out before freeing the
object that contains it. Request error and lookahead text use `work_vector(u8)`
with this same budget. `parser_stream_return_owned` moves the lookahead bytes,
allocator identity and reservation to the stream without allocating. The stream
keeps them valid after request destruction and uses their owning allocator for
replacement and disposal. The existing `parser_stream_return` still accepts
ordinary Tower vectors. An inactive reservation does not identify an allocator:
standalone work buffers still require `compiler_buffer_free`, not Tower `free`.

`parser_recognizer_diagnostic_result(request, reader, source, error)` requires an
error output and borrows the reader source only during the call. It returns an
owned diagnostic with `None`, or null with the first exact `WorkBudgetError`;
allocation failure never exposes a partly populated option list. The old pointer
API remains a wrapper, with the same public `ParserDiagnostic` view layout.
Its private owner, options, labels, frontend probe and context arrays use shared
budgeted storage. LR probes already borrow that budget. Ordinary operation-quota
exhaustion remains a diagnostic with `complete=false`, not a resource failure.

Successful construction drops all live LR runtime borrows. Numeric contexts and
formatted labels belong to the returned diagnostic and remain valid after the
recognizer, stream, table and world close. The caller's explicit `WorkBudget`
must outlive the diagnostic; its live receipts prevent budget disposal until
`parser_diagnostic_destroy`. Failure cleans partial ownership without changing
the recognizer's original syntax message, position or retry state.

`syntax_session_diagnostic_result` carries the typed failure into template
construction. The existing session wrapper preserves the session's first cause;
ordinary syntax callers use the original recognizer message if diagnostic
construction fails. Label name allocation failure no longer becomes a successful
numeric fallback; legitimately unnamed tokens keep that fallback. Shared formatter
scratch, syntax descriptions and final host-text formatting retain their existing
allocation contracts. This is not a migration of every parser/formatter buffer.

### Checked grammar construction

`GrammarBuilder.resource_error` retains the first failure while its existing
`failed` flag suppresses following construction. Initialize a fresh builder with
`grammar_builder_init_result`; consume its root once through
`grammar_builder_finish_result(builder, error)`. The required error output receives
the exact cause. Failure releases the partial document; success transfers the root
to the caller. Reinitialize only after consuming the prior root. Legacy init/finish
wrappers remain available.

Related-node creation, component registration/storage and attachment retain their
producer's `WorkBudgetError`, including `Busy`, `Invalid`, `Capacity` and `Memory`.
Counted text/string helpers reject count overflow before allocation. Name inputs
retain the existing NUL-terminated contract; the storage helper receives the actual
byte count. `node_string_append_result` accepts an explicit byte count, returns
`Invalid` for malformed UTF8 and restores the original logical string length on
failure. Buffer capacity may have grown before decoding failed. The bool append
wrapper also rejects malformed input instead of silently accepting a valid prefix.

`regex_grammar_create_result(kinds, error)` constructs the same ordered ordinary
grammar entities and preserves the builder's exact cause. The ASCII exclusion
mask derives fill bytes and iteration extent from its array; ASCII extent and the
maximum Unicode scalar are named language-data limits. The downstream pattern
table remains responsible for propagating the result into its own diagnostics;
adding this producer alone does not complete that consumer or budget raw text
vectors. Validation status is recorded in the journal.

### Sparse grammar construction measurements

On the native Linux frontend test entry, `iteration-cold` and
`iteration-installed` compile the same small `import tower` source through
`frontend_compile_sources`, execute its answer and report a canonical hash.
The latter installs Bedrock/Foundation first and reports that cost separately.
`CompilerGrammarCache.observer` borrows an optional coordinator-owned callback;
set it before compilation and clear it after synchronous work drains, before
releasing its context. It observes Lookup, Build and Table spans; Table time is
nested inside Build, so these elapsed totals must not be added. The default
observer is empty and the compiler itself performs no clock reads or logging.
This observer is for a single coordinator, not a shared concurrent accumulator.

Run `tower-frontend-tests RESOURCE_ROOT grammar-equivalence` from RESOURCE_ROOT
for existing parser/live grammar checks, including boundaries, imported-rule
isolation, cache reset/churn, lexical patterns and replacement provenance.
It excludes the separate allocation-failure selector. Counts and timings alone
do not establish interchangeable versions: tables retain version userdata,
emission and replacement/provenance bindings. The journal records the measured
prerequisite and the session-owned structural reuse implementation below.

### Immutable LR structure reuse

Each `SyntaxVersionCache` now owns a bounded `ParserStructureCache`, using the
existing `FrontendCacheLimit`. The whole-version cache is scoped to its explicit
world, budget identity and retained Bedrock revision; changing any clears its
indexes. Formatting forks copy private indexes and retain immutable owners.
There is no process-wide cache or persistence between fresh worlds.

Every new grammar revision still validates pending rules, emits its ordered
grammar, resolves imported/token names and activates at the original boundary.
Only then may the structural cache reuse a completed LR runtime and diagnostic
state/context columns. Its exact field comparison covers ordered production
owners/begins/counts/precedence/associativity, ordered terminal/nonterminal ranges,
names and name order, plus read mode and specialization profile. No padding,
hash or rule-count approximation establishes equivalence. Compiler algorithm and
target are fixed by the running executable; entries are never serialized.

Ordinary version emission selects parser productions reachable from the four
declaration/import roots and `Statement`. It still validates every revision,
reserves every rule/token name and collects every literal in original order:
an unused rule can change keywords, token sets or generated helper names.
Declaration-start metadata is computed before extending its existing private
reachability scratch with `Statement`; selected productions retain their input
order. Thus an unrelated nonliteral declaration can reuse an exactly equal LR
structure while retaining a distinct version and grammar. Category/template
emission stays eager, as does the default general emission API. The independent
emission oracle checks both policies; `structure-reuse` covers newly reachable
rules, unused keywords, reserved names, reset, cancellation and zero ownership.

Bedrock and ordered imported/local revision dependencies are thus evaluated
before lookup. Their LR consequences are compared in full; their source identity,
pending diagnostics, captures, emission, replacements and provenance remain on
the new version and its own grammar snapshot. A structure hit never substitutes
another version's userdata or semantic bindings. Authoritative grammar remains
on ordinary Tower entities; these records are derived execution indexes.

`ParserStructure` pins the frozen grammar key, runtime and context columns.
Tables and cache entries own coordinator-managed references; request workers
borrow the already frozen table. Eviction, cache reset or source-table destruction
releases only its pin. The last pin destroys the shared payload. Cache entries,
owner descriptors and their payload use existing work buffers/vectors and the
same explicit budget; that budget must outlive every retained table/fork.
Borrowed table aliases must never be disposed separately or mutated. Grammar
resolve/detach/finish operations precede publication of a structural key.

Only successful conflict-free structures are indexed. Required construction
failures retain their exact result and publish nothing partial; optional cache
admission/copy may decline without invalidating a usable uncached table. The
`Reuse` observer counter reports successful reuse; its marker duration is not
saved construction time. `Table` counts only actual LR builds. Run the focused
`structure-reuse` selector for metadata separation, scope invalidation, request
cancellation/retry, Capacity cleanup and ownership-order checks.

Within each frozen LR analysis, serial state construction interns the sorted
shifted core before computing closure. Dot-zero nullable reductions and recursive
start items are derived closure data; they still participate in LALR propagation
through the existing kernel predicate. The initial state's absent origin keeps
it distinct. A matching core borrows the already owned, complete state; a miss
must finish closure before publishing a state or transition. No additional
allocation, persistent key, cross-analysis cache or lifetime owner is introduced.
Parallel closure workers retain their private outputs and ordered coordinator
join; their already completed closures are not expanded again. Grammar-version
identity, activation, emission/provenance bindings and budget contracts above are
unchanged. The `lr-order` fixture compares exact states, transitions and actions
against the independent eager-closure oracle, including nullable recursive cores
and references back to the start production, plus checked allocation failures.

After FIRST/nullable converges, each `LRAnalysis` publishes an immutable derived
index of production suffix ranges and nullability. Bases belong to productions,
so overlapping borrowed symbol spans retain their distinct ends. Closure copies
the exact sorted ranges and adds incoming lookahead only for nullable suffixes;
propagation/end markers and overlapping range identities are preserved. Invalid
unreached suffixes retain a deferred error instead of failing FIRST early.
The index and flat ranges use checked work buffers charged to the parser world's
budget (explicit null budget for standalone analysis). Failed construction
publishes nothing and permits retry; workers borrow the completed index, and the
analysis retires it after their joins. Repeated completion reuses the same owner.
This is neither a cross-world cache nor a cap on the remaining raw LR storage.

LALR construction with disjoint terminal labels now uses the existing LR(0)
items as the lookahead propagation graph. Each active item contributes its goto
edge, immutable suffix-FIRST seeds and nullable closure dependencies directly;
the existing fixed-point solver and ordered action publication remain shared.
Kernel reachability is tracked separately, so an empty nonnullable FIRST suffix
cannot activate an otherwise unreachable dot-zero production. Every kernel,
including nullable reductions and recursive start items, remains a source.

This path requires completed FIRST analysis and disjoint terminal labels in
every state. Overlapping range labels retain the established per-kernel closure
algorithm: its contained-label transitions depend on the symbols present in
that individual closure. The independent oracle checks both paths. No grammar,
version binding, priority or declaration boundary changes, and no persistent or
cross-world cache is added. The coordinator builds the graph before workers
borrow it; the existing worker solver/action joins preserve publication order.
Reachability scratch uses a checked work buffer charged to the explicit world
budget, sized from the largest state, and is released before dispatch. Failed
construction destroys the unpublished graph and permits retry. The underlying
legacy propagation vectors retain their existing allocation contract; this
change does not claim to charge all LR memory or foreign allocator metadata.

The shared FIRST/lookahead range union walks the already sorted contiguous sets,
counts missing exact ranges, reserves once, then merges backward in place. Equal
starts with different ends and overlapping ranges retain separate identities.
Empty, subset and self merges allocate nothing; a single incoming range keeps
the ordinary binary insertion path. Callers provide separate owned vectors or
the same descriptor, and denial preserves the destination and first typed error.
This adds no scratch/cache owner and keeps the vectors' existing budget contract.

### Checked provenance and presentation ownership

`SyntaxExpansion.rule` and `SyntaxOrigin.splices` own checked work vectors charged
against their explicit compiler world. Trace creation, splice growth, ordinary
copy and staged copy return `WorkBudgetError` through the result APIs. Copies
prepare storage before replacing metadata or retaining history; staged copies
keep the existing reference-hold/cancellation protocol. Source offsets, expansion
order, imported grammar identity and revision pins remain unchanged.

For compiler presentation, call `format_storage_begin(result, budget)` on an
empty result before writing. Checked `FormatResult.text` and `.spans` are borrowed
vector views of receipt-owned buffers: release them with `format_dispose`, never
with vector disposal or an unaccompanied vector move. Nested previews, formatter
traversal, source tokens and verification scratch use the same explicit budget.
`resource_error` preserves the first resource failure; a failed semantic format
without a resource cause reports `Invalid`. Dispose and initialize a fresh result
before retrying a failed request.

`format_storage_finish` transfers NUL-terminated text and its receipt into an
initialized `WorkBuffer`; failure leaves that destination unchanged. The budget
must outlive detached results, even when the originating world/session has gone.
`syntax_session_diagnostic_buffer_result` and `parser_presentation_buffer_result`
use this contract. Diagnostic insertion offsets commit only after complete
formatting; failed presentation leaves the recognizer's original diagnostic and
source position intact. Session/version consumers move checked text ownership.
`parser_table_finish_buffer_result` similarly transfers failure text before
retiring a failed table; normal successful table completion is unchanged.

Session descriptors now use checked admission through
`syntax_session_allocate_result` / `syntax_session_open_result`. A denied owner
returns null with its exact cause; immediate module/compiler callers guard it.
Existing wrappers remain callable. Static failure messages require no new text
allocation. Session reset supports ordinary request retry; a module graph's
resource failure remains sticky, so denied module admission is retried through
a fresh graph after disposing the failed owner.

Raw-pointer presentation/debug wrappers still return standalone host text freed
with `compiler_buffer_free`; default, unbound formatter results retain the legacy
vector contract. General grammar-revision/cache/semantic containers are outside
this text/splice batch. Budget receipts count migrated payload plus known compiler
allocation headers, not foreign allocator metadata, stdio, total process RSS or
the budget ledger's own retained index. These boundaries are not a global cap on
the legacy default world. Integrated memory/race/platform gates remain pending.
