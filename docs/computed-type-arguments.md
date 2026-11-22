# Computed integer type arguments

Tower accepts ordinary expressions in numeric type arguments and array extents:

```tower
import tower;

var Word: type = integer_type(4 * 8, 1);
var Bytes: type = array_type(u8, 1 << 3);

fn buffer(T: type, count: usize): type {
    struct Buffer { data: T[count + 1]; }
    return Buffer;
}

var storage: buffer(u8, 3 * 2);
var table: u8[sizeof(usize) * 2];

fn local_storage(): usize {
    var count = 5;
    var extra = count + 2;
    var bytes: u8[comptime(extra)];
    return sizeof(decltype(bytes));
}
```

These expressions execute through the ordinary Tower interpreter and dependency
graph. Integer arithmetic, conversions, shifts, target queries, lazy operators
and explicit nested `comptime(...)` retain their normal semantics. An untaken
branch does not execute a trap, access runtime storage or call a function.
Array bounds and primitive width/signedness constraints are checked after the
value publishes. Canonical Foundation contains the resulting type representation
and extent, so it does not need to repeat the computation.

A numeric generic parameter supplies its declared contextual type. Otherwise,
ordinary expression inference applies: unconstrained arithmetic uses i32, and
typed operands such as `sizeof` constrain their literal peers. Typed values still
require explicit conversions. Existing bare integer argument spellings retain
their previous contextual typing.

Expressions can call ordinary helpers, including recursive calls, typed indirect
calls and helpers using aggregate values. They can capture ordinary `var` bindings
when the compiler proves both immutability and a compile-time-known initializer.
The proof rejects later writes and address escapes, including writes in generic
definitions, deferred cleanup and loop updates. Unknown statement contracts
conservatively decline early proofs. It distinguishes shadowed declarations. Module captures retain
initializer order; reading a later initializer is an error.

Helper checking, executable snapshots, binding proofs and initializer evaluation
are suspended dependencies in the shared graph. A local capture depends on its
completed lexical prefix, so a body may use an earlier immutable local in a type
without depending on its own unfinished whole-body query. Worker stages join before
publication. The ordinary interpreter discovers executed calls and captures; a
skipped branch does not demand their evaluation.

Functions returning arbitrary computed type values and mutable metatype storage
remain separate work. This milestone extends integer inputs to type construction;
it does not yet remove the restricted return shape of type-producing functions.

Expression checking and preparation use existing ECS query components and
isolated workers. The coordinator seals dependencies before demand, publishes
results after joins and interns the resulting types. A nested explicit stage in
a type argument depends on its own expression, rather than the unfinished body
whose declaration needs that type.
Executed capture reads demand shared lexical binding proofs, including module
and generic-definition writes. Independent scans use the shared worker dispatcher;
their joined receipts permit initializer snapshots while the containing body is
suspended. Nested explicit stages use the same inputs; untaken captures add no
evaluation dependency. Cycles are diagnosed through the shared graph, without
recursively completing queries on a worker.

Compiler/build sources must continue using predecessor-compatible syntax until
a complete compatible bootstrap is published through the documented build path.
