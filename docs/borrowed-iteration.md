# Borrowed collection iteration

```tower
import tower;
import library.vector;
var values: vector(i32);
vector_init(&values);
defer vector_dispose(&values);
vector_push(&values, 42);
foreach (var value in &values) { print(value); }
foreach (var &value in &values) { *value += 1; }
```

The source pointer is evaluated once. `var value` copies each scalar or pointer;
`var &value` binds a pointer to the element, supporting aggregates without a copy.
The item has loop-body scope. Each loop owns ordinary local iterator state.
`continue` requests the next element, `break` closes the iterator, and `return`
evaluates its result before closing iterators and other deferred cleanups in
reverse registration order. There is no allocation added by the loop syntax,
implicit ownership transfer, trap unwinding, or implicit parallel dispatch.

Vectors traverse their initial storage and length, queues traverse their initial
FIFO sequence (including a wrapped ring), and stack aliases inherit vector storage
order, oldest to newest. These are finite borrowed views. Keep the owner alive and
structurally stable until the loop exits; growth, disposal, insertion/removal,
reordering or direct structural field mutation invalidates the view. Element
writes through explicit borrows are supported. This is a raw-pointer caller
contract, not an enforced lifetime or race checker. Retain `for`/`while` for growing
worklists, queue draining, coordinated indices and intentional live bounds.

A nominal type declaration associates four ordinary functions in its own module.
For `struct Range`, their names are `Range_iterate_begin`, `Range_iterate_next`,
`Range_iterate_element`, and `Range_iterate_end`. For `fn vector(T: type): type`,
the prefix is `vector`. The checker reads the original declaration and existing
specialization components; it never parses display names or special-cases a
container name. Aliases inherit the returned nominal type's protocol. Multiple
nominal types in one module have independent protocols.

Each function has exactly two runtime parameters: the source pointer and a pointer
to the same concrete local state type. `begin` and `end` return `void`, `next`
returns `bool`, and `element` returns a pointer to concrete element storage.
Generic protocol parameters must be inferable from the source. `begin` initializes
state, `next` advances it and reports availability, `element` supplies the current
element address, and `end` performs cleanup. Calls use exact types, with no overload
ranking, implicit conversions, dynamic dispatch, or new Foundation opcode.
Protocols may perform their own documented effects; allocation-free library
protocols do not imply allocation-free arbitrary user protocols.

The generated graph uses existing declarations, calls, addresses, loads, blocks,
loops and scoped cleanup. Foundation reconstruction remains compilable and
reversible. Iteration cannot be combined with explicit labels/jumps in a function,
matching scoped cleanup's existing restriction. Generated nesting counts toward
the existing Foundation depth limit. Custom protocols are statically resolved;
general borrow checking, trait/attribute registration, arbitrary type-program
inversion and automatic destruction remain future work.

Compilation scratch and state belong to the existing ECS compilation context.
Independent units use CompilerWork's isolated workers; no mutable inference or
iterator state is shared across them. Deterministic serial/2/4-worker object tests
and runtime/interpreter/backend checks cover the same Tower fixture.
Within a compilation world, implicit protocol specialization currently requires
the structural coordinator. Body-worker admission recognizes `TowerForeach` and
keeps those bodies off pinned worker stages until protocol construction supports
dependency continuations. Generated item declarations use the ordinary ECS-backed
declaration query state. Shared-world tests compare iteration and staging at
1/2/4/8 workers; this does not make runtime foreach parallel.
