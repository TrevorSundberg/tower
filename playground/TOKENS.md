# Token rules written in Tower

Choose **Token rules** in the playground's example selector. The example edits
all three default terminals, adds a new `Hex` terminal and defines `#` comments.
**Active grammar** shows token patterns alongside parse rules.

```tower
token Identifier = /[A-Za-z_][A-Za-z_0-9-]*/ as identifier;
token Number = /[0-9]+(\.[0-9]+)?/ as number;
token Hex = /0x[0-9A-Fa-f]+/ as number;
skip HashComment = /#[^\r\n]*/ as comment;

parse Value = Identifier | Number | String | Hex;
parse Statement = Value ';';
token String = /`[^`\r\n]*`/ as string;
player-name;
3.14;
`hello`;
0xff;
# This is a comment.
```

`token Name = /pattern/;` creates or replaces a terminal. `skip` creates a rule
that consumes input without passing a token to the parser. Both take effect
after their terminating semicolon, advance the grammar revision, and are cached
with the parse rules. Invalid patterns or incompatible grammar changes leave
the previous revision installed. Inspection never installs future declarations.

Names are ordinary public bindings. Bedrock's declaration grammar uses Identifier
and String; Foundation adds Number. Their patterns are Tower definitions, not C++
character tests. Other token names can be introduced normally.
A token cannot share a name with a parse rule. Replacing a referenced terminal
with a skip rule is rejected. No `__` prefix is reserved. Use `=` to replace token rules; put alternatives
inside the pattern with `|`.

`as identifier`, `as number`, `as string`, `as operator`, or `as comment` selects
the corresponding playground highlighting style. Other names are allowed and
produce a `tw-<name>` CSS class. Without `as`, tokens use the `identifier` style;
skip rules produce no highlight span. These are presentation labels, not token
matching conditions.
The `comment` label also lets source-preservation tooling retain comments. This
single style field is provisional; a general attribute system has not been designed.
Style labels do not select semantic types, numeric decoding or execution handlers.

## Pattern syntax and matching

Patterns support Unicode scalar literals, concatenation, `(...)` groups, `|`
alternatives, `*`, `+`, `?`, `[a-z]` character classes, and negated classes such
as `[^\r\n]`. `.` matches any scalar except CR/LF. Escapes include `\n`, `\r`,
`\t`, escaped punctuation, `\xHH`, and `\u{hex}`. Escape `/` outside a character
class so it does not end the pattern. Patterns cannot contain literal newlines.
For example, `/[A-Za-z_\u{80}-\u{10ffff}]+/` includes all non-ASCII scalar values;
that is broader than Unicode letters. Unicode property classes are not provided.

The scanner takes the **longest match** among active token/skip patterns and
grammar literals. A grammar literal wins an equal-length tie. Otherwise the
earliest declared token/skip rule wins; replacing a rule keeps its priority slot.
Thus `0xff` can match a new `Hex` token rather than the shorter Number `0`, while
a longer identifier such as `format` beats the literal keyword `for`. An added
`/foo/` token ties the default Identifier and loses; use the grammar literal
`'foo'` for a keyword, or adjust the competing token rules.

Matching is anchored at the current cursor and returns the longest accepted
prefix. There are no flags, anchors, counted quantifiers, lookaround,
backreferences, lazy quantifiers, or shorthand classes such as `\d` and `\w`.
Use explicit ranges. Patterns that can match empty input are rejected, including
skip patterns, so scanning always advances. Unsupported syntax produces an error.

Patterns compile through an NFA into a DFA with explicit errors and no C++
exceptions or regex backtracking. Current limits are 4,096 pattern bytes,
64 grouping levels, 512 NFA states, 1,024 DFA states, 262,144 transition cells,
and 64 token/skip rules. The existing worker timeout and source-size limit also
apply. This is a bootstrap pattern language, not a complete regular-expression API.

## The bootstrap boundary

The shared lexical defaults live in
[`scaffolding/bedrock.tower`](../scaffolding/bedrock.tower): ordinary/quoted
identifiers, quoted strings, whitespace, line comments and block comments.
[`scaffolding/foundation.tower`](../scaffolding/foundation.tower) inherits those
same entities and adds integer numbers and executable syntax, including functions,
declarations and control flow. The static page loads both files at runtime. Edit a file and
run `npm run build` to copy it into `dist/`, or edit the deployed copy directly,
then reload. No C++/WASM rebuild is needed for different default patterns.

The project browser pins **Bedrock** and **Foundation** above each project's
files; the project selector includes **ForEach** and the other examples. Bedrock edits affect shared defaults in all downstream modules. Foundation
edits change the baseline used by source parsing and both execution frontends.
Identical module source loads idempotently; changed Foundation modules are rebuilt
over Bedrock's definitions, without importing the previous Foundation,
instead of accumulating `|=` alternatives. Invalid modules block dependent runs.
Edits persist locally but do not overwrite the server's file; **Save** downloads
the whole project archive and **Restore** returns to the bundled module.

Backtick-quoted identifiers preserve names that would otherwise collide with
keywords or need an extended token pattern, for example `` `player-name` ``.
Their semantic names omit the delimiters and decode escaped backticks,
backslashes, `\n`, `\r`, and `\t`. The canonical formatter uses the same spelling
when necessary, so both execution backends retain names and bindings.

A small immutable native grammar supplies Bedrock's starting definitions. Bedrock
uses the same incremental declaration installation as every other file: changed
rules affect what follows, while the shared baseline remains unchanged. Bedrock's
GrammarDeclaration, GrammarTokenDeclaration, GrammarSkipDeclaration and supporting
rules define the declaration reader. They have public, descriptive names,
and downstream grammar can reference them, for example
`parse Statement = 'assignment' GrammarAssignment ';';`.
GrammarPattern and GrammarTemplate retain native scanner implementations. String
is shared between ordinary strings and quoted grammar literals; their interpretation
depends on the grammar using them. Grammar names and captures use the same quoted
Identifier decoding and formatting as executable code.

The declaration lexer uses the active token bindings. A local override changes
its own binding, not the imported entity, and affects subsequent declarations as
well as ordinary source. Define rules before restricting the spellings they use:

```tower
parse Statement = Identifier ';';
token Identifier = /@[a-z]+/ as identifier;
@player;
```

Identifiers after that token declaration require `@`, including names in any new
declarations. The already-installed Statement rule continues to reference the
Identifier binding. The default identifier rule does **not** require `@`.
Likewise, changing String changes the delimiters accepted for later grammar
literals, and changing Whitespace or comment patterns affects following trivia.

## Numeric production precedence

Bedrock accepts an optional numeric annotation after a declaration's alternatives
and before its replacement. It applies to every alternative in that declaration:

```tower
parse Expression = Number | '(' Expression ')';
parse Expression |= $left:Expression '+' $right:Expression @ 10 left;
parse Expression |= $left:Expression '*' $right:Expression @ 20 L>R;
parse Expression |= $left:Expression '=' $right:Expression @ 5 R<L;
```

Larger positive `u32` levels bind more tightly. `left`/`L>R` reduce equal-level
chains from the left; `right`/`R<L` associate from the right. `nonassoc` rejects
equal-level chains unless parentheses separate them. These describe grouping,
not permission to reorder operands or exploit mathematical commutativity.

Annotations are semantic components on grammar declarations and alternatives.
Canonical formatting preserves their levels and normalizes directional aliases.
They resolve only exact-token shift/reduce pairs whose participating productions
have compatible explicit metadata. Missing/inconsistent annotations and
reduce/reduce conflicts remain errors. Terminal ranges do not gain an implicit
priority. Grammar order never supplies a precedence fallback.

This is a table-construction shortcut: the ordinary LR parser executes the
resulting rows, with no runtime operator dispatch or extra semantic tree.
Traditional recursive `Expression`/`Term`/`Factor` rules still work unchanged.
The parser implementation remains shared by native and Wasm builds; current
Tower-written table construction memoizes dotted-production closures and avoids
repeating destination closures during LALR propagation.
