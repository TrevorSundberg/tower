# Generic call argument inference

Tower calls can omit all parameters declared `: type` when the runtime operands
determine them. The explicit spelling remains valid and selects the same ordinary
specialization:

```tower
import tower;
import library.vector;

var values: vector(i32);
vector_init(&values);
defer vector_dispose(&values);
vector_push(&values, 42);
```

The vector supplies `i32`; `vector_push(i32, &values, 42)` remains supported.
Parameters may occur anywhere in the function signature. Calls supply either all
declared arguments or just the runtime arguments, retaining their declared order.
Partial type-argument omission and result-type-driven deduction are not supported.

Deduction collects agreeing exact constraints from operand types, pointer/array
structure and nominal specialization components on the shared entities. It follows
the existing straight-return type-alias subset, so `stack(T)` can forward to
`vector(T)`. It does not compare display names, guess conversions, rank overloads,
or invert arbitrary type-producing programs. The instantiated signature is checked
normally, including complete nominal identity and fixed array/count arguments.
Straight-return wrappers registered as ordinary executed templates participate
in the same constraint lookup as nominal type constructors. This does not turn
their execution into static alias expansion: their substituted signatures still
run through the ordinary type queries and checking.

An alias body with locals or control flow is not executed to deduce a missing
type argument. If no other operand determines that argument, the call reports
`Cannot infer type argument 'T'; pass explicit type arguments`. An explicit
argument still prepares and executes the ordinary body; its statements are kept.

Typed operands are considered before contextual integer/null literals. Thus either
argument of `choose(-9223372036854775808, an_i64)` can provide the constraint, without
first forcing the magnitude into i32. A bare type parameter constrained only by an
integer literal uses the existing i32 default and range check. Boolean and string
literals have their ordinary intrinsic types. Null alone cannot infer a type.
Conflicting constraints and unconstrained parameters require explicit arguments.

This is type checking, not runtime evaluation. Argument effects still execute once
in source order. The result contains the same typed Foundation calls and canonical
type/function entities as explicit specialization. Foundation text remains the
semantic interchange format. Compiler implementation is entirely Tower; Foundation
and Bedrock need no new grammar or operation.

Inference belongs to the existing ECS compilation world. Constraint scratch is
owned by that compilation context; registry queries use that world's component
types. Independent compiler units use the existing `CompilerWork` worker scheduler
and exchange owned artifacts. Within a unit, graph construction remains under its
single owner: these changes do not make arbitrary entity mutation thread safe or
share entity pointers between workers. Serial and parallel compilation must produce
the same objects and preserve deterministic publication order.

An older compiler may parse omitted arguments but reject their arity. The compatible
bootstrap must be published and the default clean build verified before migrating
compiler sources. This rule applies to checker changes as well as new tokens.
