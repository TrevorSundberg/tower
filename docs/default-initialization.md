# Default initialization

Import `tower` to use `default` with an expected type, or `default(Type)` with an
explicit type. Ordinary names and parenthesized type applications resolve the type.

```tower
import tower;
import library.vector;
var count: u64 = default;
var values: vector(i32) = default;
vector_push(&values, 42);
vector_dispose(&values);
var another = default(vector(i32));
```

Integer and enum values are zero, bool is false, and pointers are null. An enum
need not declare a zero member: Foundation represents that value with an explicit
conversion. Exact typing still applies; `default(u32)` does not convert to i32.
Bare `default` has no independent type. Typed arguments can constrain it during
generic inference, but `identity(default)` alone cannot determine a type argument.

A complete struct or array declaration initializer constructs its zero state in
the existing destination. `value = default;`, `*pointer = default;`, and
`values[index] = default;` reset complete aggregate storage. The destination is
evaluated exactly once. The operation zeros every byte, including nested storage
and padding, for the selected target layout. It lowers to Foundation address,
sizeof and fill operations, with no allocation or aggregate temporary. Aggregate
reset has void type; it cannot be chained or consumed as an aggregate value.
Scalar assignment retains its usual value result. Parentheses are transparent.

This is raw initialization/reset, not a constructor or ownership operation. A
zero representation may violate a library invariant; keep its initialization
function when required. Resetting an owning object does not release its resources;
dispose them first. No automatic drop, clone, move, bounds check or trap unwinding
is introduced. Byte fills of partial storage, nonzero patterns, externally sized
buffers and allocation batches remain explicit `fill` calls.

Scalar defaults work in ordinary compile-time execution. Aggregate defaults use
the same memory operations as handwritten Foundation; the current strict staged
interpreter rejects those operations without a storage/value capability. This
feature does not expand that capability contract or add a constant evaluator.

Checking uses existing declaration queries and worker-owned ECS stages. Named
types/default scalars need no structural coordinator operation; type applications
and array construction use the existing preparation/admission path. Lowering uses
the existing parallel expression jobs. Canonical Foundation contains no default
opcode or surface marker and reparses with the Foundation grammar alone.
