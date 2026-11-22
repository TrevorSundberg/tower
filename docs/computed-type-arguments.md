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

This first milestone supports closed expressions and bound numeric type
parameters. Ordinary `var` captures and executed function calls during type
construction remain unsupported. A runtime binding's initializer alone is not
proof that the binding is immutable. The next milestone must make ordinary body
checking, binding proofs and input evaluation available as suspended dependencies
of type construction; it must not introduce a separate evaluator or recursively
force those queries on a worker. Functions returning arbitrary computed type
values and runtime metatype storage are separate later work.

Expression checking and preparation use existing ECS query components and
isolated workers. The coordinator seals dependencies before demand, publishes
results after joins and interns the resulting types. A nested explicit stage in
a type argument depends on its own expression, rather than the unfinished body
whose declaration needs that type.

Compiler/build sources must continue using predecessor-compatible syntax until
a complete compatible bootstrap is published through the documented build path.
