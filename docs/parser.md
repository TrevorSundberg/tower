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
`parse_forest_resource_error` reports the last leaf/join/attach allocation result.
The recognizer preserves those causes through its existing resource-error channel.
Entity attachment still has a separate boolean failure contract; a `None` forest
allocation result does not make a failed attachment successful. The legacy
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
