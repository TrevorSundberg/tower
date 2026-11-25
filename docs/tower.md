# The Tower language layer

Use `import tower;` for the language above Foundation. Compiler code can use the
same layer. The [development plan](tower-language-plan.md) distinguishes shipped
features and implementation work from upcoming overloads, general compile-time
values, result types and ownership rules.

## Module tests

A module importing Tower can declare a test with an empty parameter list.

```tower
import tower;
fn answer(): i32 { return 42; }
test() { print(answer()); }
```

Ordinary compilation parses the block and excludes it from semantic binding and
execution. A test request uses the same module resolver, lexical scopes and body
checker. It retains module declarations and global initializers and executes the
selected bodies after initialization, in dependency order and then source order.
Each body is a private zero-argument function returning `void`. A `return;`
finishes that test. An interpreter failure stops the request at the first failure.
The ordinary module script and its exported `main` keep their own entry behavior
when compiled normally.

The native host can call `execution_session_compile_tests(execution, text, length,
width, modules)` with an import-only entry naming the owners and sidecar modules.
After a successful compile, `execution.program.test_count` gives the number of
selected bodies. Start and step that same session through the ordinary interpreter.
An adjacent `owner_test.tower` can import `owner` and declare its own helpers.
Test selection follows the supplied entry's import closure.

## Function values

Use `function(Result, Parameters...)` for typed noncapturing callbacks. They work
in locals, fields, arrays, arguments and results, including struct copies/returns.
Function names and `&name` produce values; `callback(x)`, `factory()(x)` and
`(*slot)(x)` invoke them. Nullable callbacks support `??` and `??=`. Callees are
evaluated once before arguments. See [function values](function-values.md) for
staging, exact typing, target/foreign contracts and the remaining limitations.

## Type queries and compile-time execution

The published compiler accepts `decltype(expression)` and `comptime(expression)`
above Foundation. This is the scalar staging implementation described below;
general compile-time values and compiler-wide threading remain incomplete.

```tower
import tower;
fn twice(value: u64): decltype(value) { return value * 2; }
var answer: decltype(twice(21)) = comptime(twice(21));
```

`decltype` checks an expression's ordinary type without executing it. It supports
locations, pointers, fields, calls and concrete type arguments. Module declarations
and function signatures resolve through dependency queries, including forward
references. Signature parameter names shadow module names; return annotations can
inspect parameter types and fields. Cycles are reported as dependency paths.
Block locals retain their ordinary lexical scope.

`comptime` currently produces numeric, bool or noncapturing function values by invoking the ordinary
Foundation interpreter with explicit target data. Evaluation may suspend on a
pending staged value; nested values are demanded only when execution reaches them.
It does not run module initialization. Runtime captures, global storage, heap
allocation, output and foreign calls are rejected by the current strict execution
policy. Local storage and loops work, with initialization/lifetime checks and an
execution budget. This bounded scalar implementation precedes the general value
and capability model below.

Canonical Foundation contains the checked types, evaluated scalar constants and
bound function references;
it needs no `decltype` or `comptime` syntax. Declaration dependency discovery,
layout, eligible body checking, expression lowering, evaluation and dependent
return-path validation use Tower ECS queries and worker pools. Deferred cleanup
copies retain their staged-value dependencies. Generic/type construction,
legacy session adapters and remaining parser/backend phases still need work;
these features do not imply a completely threaded compiler yet.

## Compile-time value goals

The intended compile-time model accepts arbitrary Tower values: structs, buffers,
containers, trees and parse trees, shared compiler entities/graphs, functions and
function pointers, as well as types and scalar values. Any of these can be an
argument or result of ordinary staged code, including a type-producing function.
They remain usable at runtime too. The templates example currently uses type and
integer arguments because general value staging is still a bootstrap milestone.

The intended default also infers available compile-time values without requiring
a constant annotation. Results must come from ordinary execution through the
shared interpreter, including literal and arithmetic operations, rather than a
separate pre-LLVM folding pass. `comptime` requires evaluation at that stage;
inferred execution preserves work and effects that must occur at runtime. This
general inferred-execution facility is not yet implemented.

### Proposed separation of staging and specialization

The desired general specialization facility is adjacent to compile-time
evaluation. These are separate, composable contracts; this section is design
direction, not a claim that the APIs or general residualizer are implemented.

| Concept | Requested result |
| --- | --- |
| Evaluation | Execute ordinary code with available inputs and obtain its value/effects. |
| `comptime(expression)` | Require the expression's value at the current compilation stage, subject to its effect and dependency contract. Diagnose unavailable required inputs/capabilities. |
| Specialization | Given ordinary code and known bindings, produce residual code accepting the remaining inputs. Bindings may include whole aggregates or known fields; preserve dynamic fields, aliases, ownership and effects. |
| Compilation | Translate a program to an executable artifact for an explicit target/profile, whether or not the program was specialized first. |
| Pre-initialization / snapshot | Preserve an executed prefix's state and a valid remaining entry/continuation, with explicit state ownership and effect replay rules. |
| Optimization policy | Control profitable inlining, unrolling, vectorization, code/data growth and compilation effort without changing defined program behavior. |

Evaluating a grammar builder with `comptime` produces its grammar/table value;
it does not request a new parser implementation specialized to that value.
Known results may enable ordinary optimization in consumers, but neither
`comptime` nor specialization promises branch-free code or complete unrolling.
Specialization's semantic obligation is equivalence under its fixed bindings;
how aggressively to transform the residual code is a separate bounded policy.
Uniform values shared by workers or shader invocations are not automatically
compile-stage-known values.

Prefer a typed compiler/library specialization API before adding syntax.
A specialization request can itself be evaluated with `comptime`, or executed
later when runtime inputs become known and compilation capability is available.
Its result is an owned program/artifact, not an implicitly immortal function
pointer capturing arbitrary storage. Scheduling it asynchronously uses the
shared dependency/work system; scheduling is independent of what it computes.
Optional optimization fallback and required staging failures remain distinct.
Any eventual syntax for capture selection or a lexical continuation boundary
should express those operations explicitly, not overload `comptime` with them.

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
values with Tower's expression precedence and short-circuit operators.

Counted traversal uses scoped `for`:

```tower
for (var i: usize = 0; i < items.length; i++) {
    if items.data[i] == null { continue; }
    print(i);
}
```

The initializer runs once. The bool condition is evaluated before every body
execution, and the update runs after normal completion or `continue`. `break`
and `return` skip the update. Nested loops handle their own breaks/continues.
The initializer can declare one local or be an expression; condition and update
can be comma expressions. Each clause can be omitted: `for (;;) { ... }` repeats
until an explicit exit. Braces are required.

A declared header local is visible in the condition, update and body, and ends
at the loop's closing brace. Body locals may shadow it without changing header
bindings. A bound such as `items.length` is re-read on each test; `for` does not
snapshot a container or introduce an iterator, allocation, implicit copy or move.
Ordinary pointer validity and container invalidation rules still apply.

For lowering uses the same shared Foundation entities as `while`. The usual case
appends the update after the body. If the body can continue this loop, a generated
first-entry flag lets the update run at the next loop head, before the next test.
This avoids copying effectful updates or changing nested continues. No interpreter
opcode, backend ABI, Foundation grammar or Bedrock change is needed. The same
128-level Foundation nesting limit applies.

These constructs lower to existing Foundation operations. Canonical Foundation
contains generated locals, blocks, comparisons, ifs and loops; no backend opcode
or separate interpreter is required. Generated locals avoid all source spellings,
including quoted names. Lowering validates the existing 128-level Foundation
block limit, so a very large or deeply nested match can hit that limit sooner
than its surface braces suggest. The additional arm-count ceiling is 128.

`match` and `while` are keywords in the imported Tower grammar. Existing bindings
with those names may be written as quoted identifiers, such as `` `match` ``.
Foundation alone does not import these keywords or control-flow rules.

## Scoped cleanup

```tower
fn first(): i32 {
    var data = alloc(i32, 1);
    defer free(data);
    *data = 42;
    return *data;
}
```

`defer expression;` and `defer { statements }` register explicit cleanup for the
current lexical scope. Reached registrations run in reverse order on ordinary
fallthrough, `return`, `break` and `continue`. A return value is evaluated once
before cleanup. Loop-body cleanup runs before a `for` update; breaking an inner
loop leaves outer-scope registrations pending. Module-scope cleanup runs after
all top-level program statements finish, in reverse registration order across
the entry module and its dependencies. A shared imported module registers once.

Names resolve at the registration, including locals, parameters and globals.
Values and call arguments are read when cleanup executes. Assigning a new pointer
therefore changes what `defer free(pointer);` will free; use a separate binding
when the original pointer must be retained. A registration skipped by an earlier
exit never runs. Defers in a nested block finish when that block exits.

Cleanup blocks can declare locals, use their own loops and register nested
cleanup. They cannot return or jump out of their cleanup scope. The initial
implementation rejects functions combining defer with explicit `label`/`jump`
control flow. Traps and process termination stop execution without unwinding;
a trap during cleanup stops the remaining cleanup too.

The implementation is Tower code on the shared entities. Checked cleanup is
expanded into ordinary Foundation blocks at structured exits, with fresh locals
and preserved bindings. Captured declarations receive deterministic unique
Foundation names so serialization preserves bindings across shadowing scopes.
Source formatting and editor completion retain their source names. No destructor
inference, ownership transfer rule, new Foundation opcode or backend ABI is added.
Existing component, frame-size and nesting budgets still apply.

## Collection basics

```tower
import tower;
import library.queue;

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

`library.work_graph` is the shared Tower dependency index for compiler execution.
It deduplicates queries over borrowed shared entities, records dependencies and
consumers, and yields ready tickets for an executor. Work states are nominal enums.
Only demanded queries run; failed inputs block their consumers. Tickets include
the explicit revision and target/semantics profile. Cancellation rejects outstanding
results. Iterative cycle diagnostics return the actual closed dependency path.

The coordinator owns this mutable index. Workers must own their scratch/results
and publish through the coordinator; this API does not make the entity store
thread safe. Type layout uses the Tower pool with private result components and
publication after joins. Native and shared-memory Wasm hosts supply threads;
portable Wasm uses the same scheduling contract with one execution slot.
Layout dependencies are discovered once, pointer fields do not demand pointee
layout, and layout kernels consume completed dependency layouts. The former
128-level layout recursion and 256-type/field caps are removed. Compilation
node/storage budgets still apply. Semantic compilation now accepts an explicit
component-payload byte budget through `semantic_compile_budget`; the default is
160 MiB. This accounts newly attached payloads during semantic checking, not
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

`library.compiler_work` uses the same graph for compiler unit builds. Its Tower
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
language-runtime environment. The legacy compiler still selects one default
world and has native session/grammar caches. Migrating those boundaries is required
before offering several independent compiler worlds in one native instance.
Browser worker/Wasm-instance isolation continues to provide that separation now.

Generic component registries are now program-owned Tower entities. A context
component retains its registry type, and that registry owns its template,
instance and origin type entities. Programs use distinct component identities
even when they share an underlying store. Releasing a program reclaims its
registry through ordinary entity ownership; a retained component still keeps its
own type alive. `compiler/generic-registry` provides this without a native type
cache or process-lifetime generic registry.

`compiler/world` now owns a store and its parser, syntax and Foundation component
types in Tower. `compiler_world_create` creates an independent registry;
`compiler_world_type` lazily registers a borrowed type handle, and
`compiler_world_component` creates/initializes or reuses a payload on a node in
that same world. `compiler_world_get` never creates a type. Foreign-world nodes
and invalid kinds are rejected. Allocation failure leaves the node unchanged;
a successfully registered type may remain cached for retry. Parser/syntax payload
destruction now dispatches directly in Tower, alongside Foundation destruction.

`compiler_world_dispose` succeeds only after nodes, components, pinned views and
retained type references drain. A rejected disposal leaves the world usable.
Store/type handles are borrowed; the world owns the store and callers must not
dispose it separately. Registry mutation and refcounts remain coordinator-owned.
The production host uses these APIs through one default-world handle retained
by its existing native boundary. Library objects currently reject top-level
variables, so that handle has not moved to a Tower global. Explicit registry
worlds are available, but complete independent compilation still requires moving
native sessions, grammar baselines, syntax provenance metadata and default-only
semantic accessors. The native provenance component registry is not one of the
seven primary payload kinds migrated here.

Module environments now lend exclusive parser-session leases to active module
graphs and retain one idle session for reuse. Cache invalidation does not destroy
an active lease. See [module lifetime rules](modules.md). These changes establish
ownership boundaries used by compilation and tooling; shared-world phases remain
serial until their remaining mutable state and publication contracts are moved.

## Validation fixtures

`scaffolding/tests/language_control.tower` and `language_collections.tower` contain
the functional assertions as failure codes. Success prints `42` then `0` for the
control fixture, and `0` for collections. The existing browser test adapter runs
them on the graph and fast interpreters at both pointer widths, round-trips
canonical Foundation, and executes browser LLVM output. Negative semantic and
syntax fixtures cover malformed control flow, types, duplicate patterns and scope.
Syntax-invalid fixtures are deliberately excluded from the source formatter.
