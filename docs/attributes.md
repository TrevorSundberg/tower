# Attributes and staged values

Attributes attach typed metadata to existing declaration entities. They do not
introduce a separate syntax tree or an annotation expression evaluator. Ordinary
Tower functions construct values; the ordinary interpreter evaluates them through
the compile-time dependency graph.

```tower
import tower;

struct Representation { bytes: usize; alignment: usize; }
fn representation(width: usize): Representation {
    return { bytes: width, alignment: width };
}

[representation(4)]
struct Word { value: i32; }
```

Here `Representation` is an ordinary nominal struct. The attribute records its
value on `Word`; it does not itself change `Word`'s layout. A compiler protocol
consumer must explicitly recognize that type and define its behavior. Two
unrelated structs with the same spelling are different attribute types. The
initial implementation accepts one value of each attribute type per declaration.

Module structs, enums, functions, external/exported functions and variables accept
attributes. Attribute expressions must produce structs and satisfy the normal
strict staging rules. Uninstantiated templates and local declaration attributes
are not yet supported. Metadata on a declaration is distinct from metadata on a
referenced type; annotating a variable does not alter its type.
Attributes also leave the ordinary immutability and compile-time-value proofs
available. Fixed annotated bindings keep their declarations for metadata while
executable uses can fold normally. Declaration-only import cycles accept these
bindings under the same staged-value checks as unannotated bindings.

Values may contain nested structs, arrays, numeric/bool/enum fields, null pointers
and typed noncapturing function references. Non-null raw pointers cannot escape
staging. Function values relocate through their bound declarations. Uninitialized
fields, forbidden effects and dependency cycles are diagnosed. There is no runtime
constructor call solely to produce a declaration attribute.

Canonical Foundation stores evaluated metadata using the explicit typed spelling:

```tower
[init(Representation, { bytes: 4, alignment: 4 })]
struct Word { value: i32; }
```

Nested values use the same spelling. Arrays explicitly enumerate indexed members,
for example `init(u8[2], { 0: 3, 1: 7 })`. Every field must be supplied exactly once;
array indexes must be in order. This is the Foundation metadata reconstruction
form, separate from Tower's ordinary `init(Type){ field: value }` expression.
The formatter preserves nominal bindings and function references. Metadata remains
in Foundation text in `.towerbc`; it does not enter the private execution stream.
Attributes introduced semantics version 6 without changing cache encoding 5.
See the [current package contract](../playground/README.md) for later versions.

Compiler consumers use the same `FoundationNode` metadata entities. Lookup by the
bound attribute type is available through `foundation_attribute_get`. Entity
identity is local to a checked graph; source declarations and bindings, rather
than incidental host addresses, establish identity across reconstruction.

## Grammar attributes

Bedrock supplies the same bracket/list syntax with lexical arguments. Foundation
extends the shared `Attribute` rule to ordinary operands. Grammar declarations
continue to validate the narrow values needed by the parser:

```tower
[comment] skip HashComment = /#[^\r\n]*/;
[contextual][pattern] token Pattern = /example/;
[precedence(20, left)] parse Expression |= Expression '+' Expression;
```

Highlight markers include `comment`, `identifier`, `keyword`, `string`, `number`,
`operator`, `pattern`, `type`, `rule` and `capture`. Use `[style("custom")]` for
another style. `[contextual]` applies to tokens, not skips. Precedence is a positive
u32 binding power and `left`, `right` or `nonassoc`; quoted `"L>R"` / `"R<L"` are
also accepted. Ordinary recursive grammar chaining remains available.

The old `as style`, `when expected` and `@ level direction` forms remain accepted
for compatibility. Duplicate old/new specifications are diagnosed. Attribute
nodes retain source order, spans and canonical grammar formatting.

## Staged aggregate results

Explicit `comptime` also supports struct results outside attributes. Construction,
calls, returns, copying and arithmetic execute through the existing interpreter.
Checked local `copy`/`fill`, including `default`, are supported in strict stages.
Each scalar result field depends on its producer query. Layout is consumed after
publication; padding and interpreter addresses do not become constants. The
producer's private result frame remains alive only until field extraction.

This supplies typed metadata for the standard-type protocol migration. It does
not yet move the built-in type registry into imported standard-type modules or
make arbitrary annotations executable compiler extensions. Those consumers and
the explicit primitive bootstrap contract remain separate implementation work.
