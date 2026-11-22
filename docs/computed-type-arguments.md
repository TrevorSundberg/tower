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

Closed expressions, bound numeric type parameters and proved immutable scalar
locals can supply integer type arguments. Local proofs account for writes and
address escapes throughout the containing function, including later statements,
deferred cleanup and loop updates. Shadowed declarations retain their own identity.
An initializer alone is not an immutability proof; a mutable or runtime input is
rejected only when execution reads it. Unknown statement contracts conservatively
decline early proofs. Module captures and executed helper calls during type
construction still need earlier body/global-proof scheduling. Functions returning
arbitrary computed type values and runtime metatype storage are separate work.

Expression checking and preparation use existing ECS query components and
isolated workers. The coordinator seals dependencies before demand, publishes
results after joins and interns the resulting types. A nested explicit stage in
a type argument depends on its own expression, rather than the unfinished body
whose declaration needs that type.
Local binding proofs are demanded per function and run through the shared worker
dispatcher. Their receipts permit initializer snapshots and ordinary interpreter
execution while the containing body is suspended. Nested explicit stages use the
same inputs; untaken captures add no evaluation dependency. Cycles are diagnosed
through the shared graph, without recursively completing queries on a worker.

Compiler/build sources must continue using predecessor-compatible syntax until
a complete compatible bootstrap is published through the documented build path.
