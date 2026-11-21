# Named-field initialization

Import `tower` to initialize a struct directly in its destination:

```tower
import tower;
struct Point { x: i32; y: i32; }
struct Segment { start: Point; end: Point; }

var origin: Point = default;
var point: Point = { x: 3, y: 4 };
var inferred = init(Point) { y: 4, x: 3 };
var segment: Segment = { start: { x: 1, ..default }, end: default };
point = { x: 8, ..default };
```

Field names bind to the ordinary reflected struct fields. Each field must appear
exactly once unless a final `..default` explicitly supplies a zero baseline.
Unknown and duplicate fields are errors. Nested initializers inherit their field's
type; ordinary exact typing, numeric range rules and generic type applications
apply. `init(Type)` supplies an explicit type for inference. Parentheses are
transparent and trailing commas are allowed. An empty struct can use `init(Empty)
{}` or `default`; bare `{}` remains an ordinary block.

This is in-place construction. The destination is evaluated once, then field
expressions and their writes execute in written order. Later fields can observe
earlier writes through aliases. With `..default`, the entire target storage is
zeroed **before** any field expression executes, including nested storage and
padding. Without it, only the specified fields are written; padding is unspecified.
For example, `point = { x: point.y + 1, ..default };` reads the newly zeroed `y`
and sets `x` to 1. Preserve this ordering when migrating existing assignments.

Declarations, dereferenced pointers, indexed destinations and nested fields are
supported. Reset expressions have void type. Aggregate values, copies, arguments,
returns and chained construction are not introduced by this feature. Pass a
pointer and initialize its destination when a helper needs to construct a struct.
Arrays can use `default` as a field value; named array elements are not supported.

There are no implicit constructors, allocation, disposal, move or clone operations.
Keep library initialization functions when their invariants require them; release
owned resources before resetting. A plain `var value: Type;` still permits raw
uninitialized storage. Foundation pointer behavior is unchanged. See also
[default initialization](default-initialization.md).

Complete explicit fields lower to ordinary addresses and stores, so eligible
stack-local construction also works in ordinary strict compile-time execution.
`..default` and aggregate `default` lower to fill, which currently requires a staged
storage/value capability. Neither path adds a separate evaluator or bypasses
effect checks.

Checking enriches the existing syntax entities with field bindings and ordered
initializer components. Declaration queries track field types and layouts before
worker dispatch; generic construction uses the existing coordinator preparation
and continuation path. Lowering runs through the existing ECS jobs and removes
surface classifications. The canonical program uses compilable Foundation address,
field, assignment, sizeof and fill operations, with no new public operation ABI.

## Future stricter language policies

Stronghold can reject raw uninitialized declarations and enforce definite
initialization as a separate validation policy over these same typed entities.
Validate source declarations and initializer coverage before surface lowering;
then use field-sensitive control-flow analysis of ordinary reads/writes for
read-before-initialization, branch joins, loops and returns. Calls, aliases and
pointer escapes need explicit summaries or conservative rejection. A grammar
restriction alone cannot prove those properties.

Preserve source provenance and distinguish generated temporaries from user
declarations. Treat policy identity/version as part of compilation and cache
identity, so a Foundation-legal graph cannot bypass Stronghold validation through
an imported/cached result. Explicit unsafe boundaries can retain low-level raw
operations without weakening the surrounding policy. These are extension
requirements, not an implemented Stronghold validator. Initialization checking
and storage lowering are separate now; Foundation semantics need not change to
add the stricter policy.
