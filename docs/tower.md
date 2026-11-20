# The Tower language layer

Use `import tower;` for the language above Foundation. Compiler code can use the
same layer. The [development plan](tower-language-plan.md) distinguishes shipped
features from upcoming expression syntax, compile-time
execution, result types and ownership rules.

## Compile-time value goals

The intended compile-time model accepts arbitrary Tower values: structs, buffers,
containers, trees and parse trees, shared compiler entities/graphs, functions and
function pointers, as well as types and scalar values. Any of these can be an
argument or result of ordinary staged code, including a type-producing function.
They remain usable at runtime too. The templates example currently uses type and
integer arguments because general value staging is still a bootstrap milestone.

Files and explicitly enabled network capabilities, including opening a socket
and awaiting a response, can supply tracked compile-time inputs. Recorded inputs
support dependency invalidation, deterministic evaluation and offline replay.
Persisting values into generated code requires defined ownership, canonical
Foundation construction and target relocations; host addresses and live handles
cannot simply be copied into an executable. The
[staging contract](tower-language-plan.md#arbitrary-values-at-compile-time)
describes these goals and their validation. This general capability is not yet
implemented.

## Enums

```tower
import tower;
enum State: u32 { Idle, Busy = 4, Done }
var state: State = State.Done;
```

An enum is a nominal type with an explicit built-in integer representation.
Members start at zero or follow the previous discriminant. Explicit signed
discriminants are supported; duplicate names/values and overflow are errors.
Use `State.Idle` in values and match patterns. Equality requires the same enum
type. Integer conversion is explicit; arithmetic/indexing requires conversion
to an integer first. Members are values, not addressable variables.

Foundation preserves the enum's identity, representation and members with explicit
discriminants. Tower adds omitted discriminants above that spelling. Explicit
conversion can produce an unnamed discriminant, so a final match fallback is
still required. Forward discriminant expressions, flags and closed-enum
exhaustiveness are not implemented. Editor completion offers enum types and members.

## Match and loops

```tower
import tower;

fn classify(value: i32): i32 {
    match value {
        -1 => { return 10; }
        0 | 1 => { return 20; }
        _ => { return 30; }
    }
}

var value = 0;
while value < 4 {
    print(classify(value));
    value = value + 1;
}
```

`match` is currently a statement over integers, bool or enums. Evaluate the subject
exactly once, then execute one arm. Patterns are integer/boolean literals or enum members;
`|` groups alternatives. Duplicate and out-of-range patterns are errors.
The final `_` arm is required, including for bool. Commas after braced arms are
optional. There are no guards, bindings, ranges or match expressions
yet. Patterns cannot call named-value functions or arbitrary code.

Every body requires braces and introduces a lexical scope. A match is not a loop:
`break` and `continue` inside an arm apply to an enclosing loop. `while` tests its
bool condition before each iteration; `continue` retests it. Numeric conditions
are not implicitly converted to bool. Conditions/subjects use current Foundation
values (one binary operation or an operand, including nested calls), not general
expression precedence yet.

These constructs lower to existing Foundation operations. Canonical Foundation
contains generated locals, blocks, comparisons, ifs and loops; no backend opcode
or separate interpreter is required. Generated locals avoid all source spellings,
including quoted names. Lowering validates the existing 128-level Foundation
block limit, so a very large or deeply nested match can hit that limit sooner
than its surface braces suggest. The additional arm-count ceiling is 128.

`match` and `while` are keywords in the imported Tower grammar. Existing bindings
with those names may be written as quoted identifiers, such as `` `match` ``.
Foundation alone does not import these keywords or control-flow rules.

## Collection basics

```tower
import tower;
import 'library/queue';

var work: queue(i32);
queue_init(i32, &work);
var stored = queue_push(i32, &work, 42);
if stored {
    var value: i32;
    while queue_pop(i32, &work, &value) { print(value); }
}
queue_dispose(i32, &work);
```

`library/vector`, `library/stack` and `library/queue` use ordinary Tower type
constructors with explicit type arguments. Stack is a vector policy sharing its
storage type. Queue is a growing ring buffer preserving FIFO order when wrapping
or growing. Push/pop support scalar and pointer elements; aggregate ownership,
destructors, general iterators and templated foreach are later milestones.

Initialize before use and dispose afterward. Push/reserve return bool; failure
preserves the existing collection. Pop returns false for an empty collection or
null output and preserves both collection and output. A successful pop requires
valid output storage outside the remaining live elements. Output pointers and
collection structs are raw Foundation pointers/storage, not checked handles.

`vector_move`, `stack_move` and `queue_move` explicitly replace the destination's
storage, transfer the source storage, and reset the source to empty. Self-move is
a no-op. Distinct operands must already be initialized independent owners.
Element pointers are borrowed values: disposing a collection does not free
pointees. Growth invalidates borrowed element addresses. No implicit copy, move,
element destruction, garbage collection or exceptions are introduced.

Recoverable errors will use ordinary `result(T, E)` values after tagged payload,
aggregate-return and ownership contracts exist. The proposed `try` sugar will be
normal branching and early return with specified cleanup. It is not implemented
by the current boolean collection API.

The playground has **Match** and **Collections** examples. Imported library files
appear in the builtin tree and can be opened or edited there.

## Compiler work graph

`library/work-graph` is the shared Tower dependency index for compiler execution.
It deduplicates queries over borrowed shared entities, records dependencies and
consumers, and yields ready tickets for an executor. Work states are nominal enums.
Only demanded queries run; failed inputs block their consumers. Tickets include
the explicit revision and target/semantics profile. Cancellation rejects outstanding
results. Iterative cycle diagnostics return the actual closed dependency path.

The coordinator owns this mutable index. Workers must own their scratch/results
and publish through the coordinator; this API does not make the entity store
thread safe. The current compiler uses the serial executor for type layout.
Layout dependencies are discovered once, pointer fields do not demand pointee
layout, and layout kernels consume completed dependency layouts. The former
128-level layout recursion and 256-type/field caps are removed. Compilation
node/storage budgets still apply. Semantic compilation now accepts an explicit
component-payload byte budget through `semantic_compile_budget`; the default is
64 MiB. This accounts newly attached payloads during semantic checking, not
total process memory. Existing/generated nodes, syntax expansion, runtime storage
and other resource budgets remain separate.

`work_access` declares a task's complete component access set before sealing it:
domain identity, component identity, half-open row/byte range, and nominal
`WorkAccessMode.Read`, `Write` or `Structure`. Overlapping readers and disjoint
writes can run together. A structural claim excludes all other accesses within
that domain. Conflicting work stays queued until its lease is released. Claims
do not infer semantic order: add dependency edges where write order matters.
They also do not pin entities or intercept undeclared raw-pointer writes. The
executor must preserve input lifetimes and own scratch, and the coordinator must
remain the sole writer of scheduler state.

`library/compiler-work` uses the same graph for compiler unit builds. Its Tower
API bounds active work, accepts revision/profile tickets, joins prerequisites,
selects failures in recipe order and cancels outstanding results. Browser
compiler rebuilds use isolated compiler instances on up to two real workers.
The host adapter can select 1/2/4/8 workers; Node worker threads exercise the same
transport and Tower code. Objects publish in recipe order only after all units
succeed; linking and candidate activation checks remain serial and atomic at
the project boundary. Cancelling a browser build also terminates its children.
After failure the coordinator stops admitting later units. Once all earlier
ordinals settle, its first diagnostic is final and the host terminates irrelevant
later workers before closing the coordinator.

This is parallel compilation of the compiler's import units. Layout/type/body
phases inside each unit still run serially. Native CLI worker pools, concurrent
phases over frozen shared entities, incremental invalidation, packed component
columns and measured SIMD improvements remain required work. A sparse payload
store with dense pointer indexes is not automatically vectorized storage.

## Pinned world views

`library/entities` supports separate entity stores. `entity_view_open(anchor)`
pins the anchor's store until `entity_view_close(view)`. During that interval,
creation, new component registration/addition, removal and containment changes
fail without changing the graph. Existing component lookup/registration remains
available. Releasing the final reference defers reclamation until the last nested
view closes; query indexes, component payloads and their owners stay allocated.

`entity_view_query(view, type, first, count, &query)` borrows a dense range of
component pointers with stable payload addresses. Empty ranges succeed; invalid
or cross-store ranges leave the output unchanged. The view and all query ranges
are borrowed by workers. The coordinator must join/drain them before closing the
view, and owns all retain/release/open/close operations. Payload reads and writes
still require the scheduler's access contracts; raw pointers do not enforce them.
This provides lifetime/structure pinning, not atomic refcounts or automatic SIMD.

Type-layout discovery happens before opening a view; the compiler now executes
layout kernels inside it and closes it on success or error. This applies to CLI,
browser compilation and language queries through the same Tower implementation.
The executor remains serial within each compiler unit.

The eventual compiler-service world owns module inputs, sessions, type registries,
entities, diagnostics and a revision/cancellation lifetime, like an independent
language-runtime environment. The native compiler still selects a singleton
store and has native grammar/type caches. Migrating those boundaries is required
before offering several independent compiler worlds in one native instance.
Browser worker/Wasm-instance isolation continues to provide that separation now.

Generic component registries are now program-owned Tower entities. A context
component retains its registry type, and that registry owns its template,
instance and origin type entities. Programs use distinct component identities
even when they share an underlying store. Releasing a program reclaims its
registry through ordinary entity ownership; a retained component still keeps its
own type alive. `compiler/generic-registry` provides this without a native type
cache or process-lifetime generic registry. The remaining parser/Foundation type
registries and store boundary are still native.

Module environments now lend exclusive parser-session leases to active module
graphs and retain one idle session for reuse. Cache invalidation does not destroy
an active lease. See [module lifetime rules](modules.md). These changes establish
ownership boundaries used by compilation and tooling; shared-world phases remain
serial until their remaining mutable state and publication contracts are moved.

## Validation fixtures

`scaffolding/tests/language-control.tower` and `language-collections.tower` contain
the functional assertions as failure codes. Success prints `42` then `0` for the
control fixture, and `0` for collections. The existing browser test adapter runs
them on the graph and fast interpreters at both pointer widths, round-trips
canonical Foundation, and executes browser LLVM output. Negative semantic and
syntax fixtures cover malformed control flow, types, duplicate patterns and scope.
Syntax-invalid fixtures are deliberately excluded from the source formatter.
