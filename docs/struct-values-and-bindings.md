# Struct values and inferred constant bindings

Tower supports ordinary struct copies, assignments, parameters and returns:

```tower
import tower;
struct Point { x: i32; y: i32; }
fn shifted(point: Point): Point { point.x++; return point; }
var original: Point = { x: 3, y: 4 };
var result = shifted(original); // original.x remains 3
```

Copies are fieldwise and shallow. Nested structs and array fields are copied;
pointer fields retain their addresses. Padding is unspecified. Copying does not
allocate, clone pointed-to objects, transfer ownership or dispose resources.
Keep explicit library ownership and lifetime operations. Standalone array values
still use pointers; wrapping an array in a struct gives it these value semantics.

Arguments evaluate left to right and capture a struct's value before later
arguments can mutate its source. Assignment evaluates its destination once and
snapshots the source, including self-assignment and chained assignments. Return
values are captured before deferred cleanup. Returned values support readable
field access; writing or taking the address of a temporary's fields is rejected.
Pointer-valued fields still refer to their ordinary, independently owned storage.

Named initialization and `default` can supply contextual argument/return values.
Existing complete destination reset expressions remain void. No constructors or
definite-initialization policy are implied; raw uninitialized declarations remain
legal. Stronghold can validate initialization and ownership before lowering.

The compiler retains source signature metadata on the same function entities and
lowers values to ordinary Foundation locals, field loads/stores, pointer arguments
and a result pointer. Layout dependencies precede body workers and signature
publication precedes lowering workers. Canonical Foundation remains compilable.
External/exported functions currently require explicit pointer ABIs for structs;
this does not implement platform-specific aggregate calling conventions. A struct
result consumes one of the current 64 internal parameter slots.

## Ordinary named values

Use Foundation's existing `var` declaration, with Tower's expression syntax:

```tower
var Bit: u32 = 1 << 5;
var Mask: u32 = Bit | 3;
var Limit: usize = 64;
print(comptime(Mask));
```

Immutability and compile-time availability are separate facts. Mutation or address
exposure prevents a fixed-binding proof. An unchanged binding whose initializer
has runtime effects remains runtime storage. A mutable binding can still have a
compile-time initializer, and an ordinary staged function can mutate its locals.
Only a proved fixed binding with a successfully staged value is a constant.

Eligible integer/bool initializers execute through the ordinary strict interpreter
and compilation dependency graph. Reads of other proved inputs suspend until those
inputs publish. Unsupported automatic evaluation leaves runtime behavior intact;
an explicit `comptime(...)` request still reports failures. Initialization order
and effects are retained, including reads through functions before initialization.
Automatic inference also declines pointer/integer conversions and address
comparisons: an interpreter storage address is not a relocatable runtime value.
Explicit staged execution retains its separately requested target-address policy.
Results publish after worker joins and materialize as typed Foundation literals.
Successful fixed bindings and their complete initializer computations disappear
from runtime execution. Libraries can therefore use named computed values without
requiring an implicit module initializer. Failed or mutable candidates keep their
ordinary initialization and effects.
Import cycles may contain proved fixed compile-time bindings. Parsing admits
ordinary declarations for semantic checking; any remaining runtime initialization
in the cycle is rejected, as are grammar updates and executable statements.
No separate arithmetic folder, declaration grammar, keyword or accessor function
is involved. The former `const Name: T = value` function shorthand is retired;
replace it with `var Name: T = value` and read `Name`, without parentheses.

This first inference pass handles integer/bool scalar bindings. Nominal enum
members already provide named closed sets. Pointer/aggregate constant results,
relocations, tracked external effects and type-producing ordinary staged functions
remain separate work. Ordinary staged functions can use struct values internally
when their existing strict memory operations are permitted, then return a scalar.
Automatic inference is conservative and is not a copy-elision or performance
guarantee. Canonical Foundation reconstruction preserves the lowered graph rather
than rerunning Tower's source-level inference.

Tests live in `scaffolding/tests/struct_values.tower`, `known_bindings.tower` and
their corresponding checking modules. They compare both interpreters, Foundation
round trips, explicit 32/64-bit target layouts and serial/parallel compilation.
