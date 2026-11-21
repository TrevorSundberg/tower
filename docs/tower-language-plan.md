# Tower language development

Status: staged design, reviewed 2026-11-20 after the expression/import migration.
Only the implementation ledger describes implemented behavior; publication and
validation are recorded separately in the journal. Proposed syntax below is not
accepted source syntax yet.

## Architectural contract

Bedrock describes grammars. Foundation describes executable operations and their
types. Tower supplies the language people use, including compiler authors. New
implementation and functional tests are Tower source; browser transport may use
JavaScript. No new native seed or native implementation is part of this plan.

Parsing, binding, types, generated code, reflection and execution enrich the same
entities. Lowering must produce compilable Foundation with equivalent bindings,
effect order, scope and lifetime. A second semantic AST/IR is not needed. Retain
surface metadata and provenance on those entities for tools and reflection.

## Dependency order and milestones

The subsequent instruction is to complete this roadmap, not stop after the first
milestone. The shared compiler infrastructure below is a cross-cutting requirement
for all remaining stages, including parallel execution at large project sizes.

1. **Structured control flow and collection basics.** Implement statement `match`
   with braced arms, a mandatory final `_` arm, literal alternatives and exactly
   one subject evaluation. Add braced `while`. Lower both to existing Foundation
   blocks, locals, comparisons, ifs and loops. Add explicit vector pop/transfer
   operations and generic stack/queue libraries with failure-preserving APIs.
   Exercise ordinary type templates, both interpreters, raw/optimized LLVM and
   canonical Foundation round trips. This is the first implementation slice.
   Scoped C-style `for` is also implemented above Foundation, following the
   [whole-source loop audit](research/tower-loop-audit.md). It does not depend on
   the general borrowed iterator/ownership work in stage 6. Explicit scoped `defer`
   is implemented using existing Foundation blocks at structured exits; this does
   not implement implicit destruction or the future ownership system.
2. **Bindings and dependency queries.** Make a file's canonical module identity
   its namespace. Add `import "path" as alias;` and selective imports (proposed
   `import {Name, Other as Local} from "path";`). Bare filenames alone are not
   identities: two directories may contain the same basename. The API supplies
   identities and display names. Separate source visibility from foreign-symbol
   `export`; preserve explicit runtime initialization order. Track declaration,
   type, layout, body, specialization and evaluation dependencies separately.
   Unused declarations need not instantiate or execute, but syntax/grammar reads
   and ordered module effects remain dependencies. The 2026-11-20 binding slice implements module ownership, aliases, direct
   import visibility and the compiler import migration. Selective imports,
   re-exports and declaration-level dependency queries remain pending.
3. **Nominal enums and exact resolution.** `enum State: u32 { Idle, Busy = 4 }`
   should create a distinct reflected type, named members and a specified integer
   representation. `State.Idle` is a value. Reject implicit integer/enum and
   cross-enum conversions. Check discriminant overflow/duplicates, forward member
   dependencies and cycles. Decide separately whether aliases/flags are allowed.
   Preserve enum identity and member metadata in Foundation text; do not ship
   integer aliases or collections of getter functions disguised as nominal enums.
   Add finite-enum exhaustiveness and duplicate/unreachable match diagnostics.
4. **Expressions and exact overloads.** Tower now installs C/C++-style grouping
   through explicit numeric precedence on its shared grammar entities. This
   supersedes the initial layered-first proposal: eligible shift/reduce choices
   are made during table construction, without generated precedence tiers or
   a second runtime expression parser. Ordinary layered rules still work.
   Nested expressions lower into Foundation temporaries in left-to-right effect
   order, with branches for short circuit and conditional evaluation. Future
   overloads must resolve operators/calls by exact argument types, diagnose ambiguity,
   and require explicit conversions. No overload ranking or implicit promotions.
5. **Deterministic staged execution.** `comptime` requests ordinary graph
   interpreter execution after demanded dependencies resolve. It is a stage,
   not a separate expression evaluator. Accept arbitrary Tower values as staged
   arguments and results: aggregates, containers, graphs, functions and function
   pointers as well as types and scalars. Type/integer-only specialization is a
   bootstrap limitation, not the language contract. Give the evaluator explicit semantics,
   target/layout, capabilities, resource limits, dependency recorder and virtual
   inputs. A file read records canonical identity, existence and bytes (including
   failed lookup dependencies); changing byte five invalidates its consumers.
   Reject untracked clock/random/network/process/foreign effects in strict mode.
   Explicit capabilities may acquire network responses, including by opening a
   socket and waiting; record those responses as build inputs with replay and
   invalidation policies. See the arbitrary-value staging contract below.
   Materialize results as Foundation values with relocation-aware owned storage;
   a host address cannot become a constant. Current `const Name()` remains an
   ordinary function until this replacement is complete and migration is tested.
6. **Ownership, initialization and iterator protocol.** Specify move/borrow/drop
   before implicit container transfers. Owning values should transfer ownership;
   copying requires an explicit clone. Moved-from state, self-move, replacement,
   aliasing and early-exit cleanup need defined behavior. No garbage collector.
   Define one typed iterator protocol (begin/next/borrowed element), then implement
   `foreach` using it for arrays, spans, vectors, queues and maps. Evaluate the
   source once; specify invalidation and mutation rules. Add a common initializer
   protocol, struct field completeness/duplicate checks, and allocation plus
   placement initialization syntax with explicit failure/drop behavior.
   Add ordinary tagged `result(T, E)` and `option(T)` values once aggregate
   construction, return and ownership rules work; these are the error/absence
   contracts for containers, file access and compiler APIs.
7. **Properties, constraints and reflection.** Keep free functions and explicit
   receiver parameters, e.g. `get_length(this: Vector*)`. A property groups those
   functions as metadata; sugar supplies the receiver once. If dot calls are
   added, `value.f(x)` means `f(&value, x)` only when an exact viable receiver
   binding exists. Static constraints describe required signatures/operations on
   type values. Optional runtime interfaces are explicit borrowed object + table
   pairs, with no class hierarchy, GC, or hidden object header. Reflection queries
   shared type/field/function/property/attribute entities. Emit only requested
   runtime descriptors; determinism and stable identity cannot use host addresses.
8. **Code evaluation and attributes.** `eval` consumes text, an explicit grammar,
   scope/module environment, target and capabilities through the compiler API.
   Runtime evaluation uses the portable interpreter; compile-time evaluation
   uses the same pipeline/stage contract. Generated source becomes a tracked
   input with useful provenance. Attributes such as `[Attribute(arguments)]` are
   typed compile-time values attached to the following declaration, not another
   use of provisional grammar `as style` metadata. Attribute evaluation also
   participates in dependency queries and cycle diagnostics.
9. **Adopt throughout the compiler.** Migrate one subsystem at a time, using the
   same Tower imports, containers, enums and expressions as applications. Keep
   before/after behavior, canonical text, deterministic outputs and performance
   measurements. Replace foundational numeric tags only after preserving their
   transitional foreign ABI. Remove superseded helpers when the successor works.
10. **Unified asynchronous completion and jobs.** Provide very low overhead
    coroutines/async execution, native thread joining and compiler/job-group
    joining through a common typed completion protocol. Develop it with the
    shared work graph and ownership/result model below. This is a language and
    runtime goal, not a claim that async/await or thread creation currently works.

## Next slice after expressions: compile-time execution and type queries

Recommendation from the 2026-11-20 source/journal/TODO audit: implement a
dependency-backed `decltype(expression)` query first, then ordinary deterministic
`comptime` execution on the same query infrastructure. The user confirms that
`for`/`foreach` are being implemented separately; iteration and container migration
are outside this slice. Exact overloads remain open, but do not require a complete
overload system to deliver type queries. These are proposed implementation steps,
not features added by this assessment.

The existing `var name = initializer` inference, nominal enums, match/while,
parenthesized type specialization and vector/stack/queue libraries already work.
`const Name: T = value;` still expands to a function called as `Name()`; it is not
a staged constant. `examples/foreach.tower` demonstrates grammar captures and
local grammar replacement, not executable collection iteration.

### 1. Unevaluated type queries and shared dependency resolution

Proposed `decltype(expr)` returns the existing semantic type entity after name
and expression-type dependencies finish. It must work in annotations and ordinary
parenthesized type arguments. For example, `decltype(values.data[0])` can supply
an element type without reading element zero, even when the vector is empty.
`decltype(make_value())` determines the call's result type without executing the
call. This is distinct from `comptime make_value()`, which explicitly executes it.

Reuse the normal expression checker and resolved type components; introduce an
unevaluated query mode rather than executing an expression and throwing away its
result. Check names, exact operand types, scopes and dependent specializations.
Do not load storage, increment a variable, allocate a runtime object or call a
foreign function just to discover its type. A dependency may itself demand a
staged type constructor; that is a separate evaluation query with its own effects.
An explicit function signature need not demand its body or the returned type's
layout. Inferred/dependent signatures can demand the dependencies that determine
them. Ambiguous expressions such as an unconstrained null need explicit rules.

Use Tower's existing type and place model. Parentheses preserve grouping and
provenance without changing the result type. C++'s lvalue/rvalue reference rules
are not implied by borrowing its `decltype` spelling; Tower has no such reference
type contract today. Resolve surface uses to concrete Foundation types, retaining
source/query metadata on the same entities. General first-class type values later
need their own compilable Foundation representation and identity contract, not
numeric host/entity addresses exposed as language type IDs.

Replace separate recursive declaration/type state with queries for binding,
expression type, function signature/body, specialization, layout and evaluation.
Keep type identity separate from layout so pointer-recursive declarations remain
legal. Record actual dependency chains, including qualified lookup and completed
scope membership; a name miss must depend on the scope/module revision too.
Keep module-wide forward binding, lexical local scope, ordered initialization and
incremental grammar activation. A ready type is not permission to run its initializer.

The initial audit identified serial layout kernels, recursive declaration
inference, a shared mutable semantic context and no running-query suspension.
The current checkout now has real native worker kernels for layout, staged
execution, declaration dependency discovery and member-readiness scans; it has
read/write claims, dynamic suspension/yield, stale dispatch rejection and cycle
paths. The 1,024-entry module inference/decltype chains no longer use recursive
inference. Function signatures and record fields participate in declaration
ordering. Eligible body checking and expression lowering now have worker kernels.
Ordinary statement runs now resume on workers across nested lexical blocks,
if/else branches and Foundation loop bodies. The body query suspends on each
construction receipt; a structural if condition prepares only its header before
its branches resume. Lexical/control cursors, defer state and scratch ownership
survive on the existing ECS work component, and source-window diagnostics remain
independent of worker count. Surface while/for/foreach/match/defer handlers,
individual structural expressions, type interning and within-world editor
observation still need further continuation work. Explicit-world completion/inspection services now run
as independent native unit jobs with the same ECS recipes, joins and budget
policy. This is not yet a fully parallel semantic pipeline.

The graph is still scoped to one compilation (revision `1`, pointer width as its
initial profile). That is not a persistent incremental cache key. Reusable queries
need world/module/declaration identity, revision, query kind and exact arguments
plus target/semantics/effect policy. Cross-instance reuse needs stable identities
and reconstruction, not transported entity pointers. Missing-name dependencies
must include scope membership and its revision.

### 2. A real within-unit parallel consumer

Do not add another coarse file scheduler and call this complete. Existing
`library/compiler_work.tower` schedules independent compilation units plus their
join on real unit entities with recipe/result components. Browser units retain
isolated instances; `compiler/frontend_units.tower` also dispatches native units
through the Tower kernel pool, each with an exclusive compiler world, module
cache and immutable nested worker budget. Each unit compiles its import closure.
It does not schedule declaration queries across those instances. This isolated-unit executor alone does not provide internal parallelism. The
new within-unit kernels do; remaining semantic/parser phases still need migration.

Use the same shared entities/components and derived work graph for queries both
inside one unit and across module dependencies. The coordinator owns graph edits,
reference counts, type interning and structural publication. Pin revision inputs,
preallocate outputs or return worker-owned result buffers, and dispatch cached
typed query batches with explicit read/write ranges. Merge components and
diagnostics in deterministic semantic order, then release dependent work. A frozen
entity view alone does not freeze arbitrary payloads or isolate SemanticContext.
Move scratch, diagnostics and mutable session/cache state to appropriate owners
before concurrent kernels use them. LLVM contexts/modules remain isolated or
serialized; never concurrently mutate a shared LLVM module.

Start with dependency-ready layout batches as the bounded integration consumer;
then move type/body queries and eligible staged evaluations onto that executor.
For multiple units, define one owner for a reusable query result and deduplicate
its demanded computation using complete keys. Preserve per-unit compilation/link
boundaries and module visibility. Isolated workers may transport canonical
Foundation with explicit reconstruction; this is not sharing live entity handles.
Native worker APIs and browser shared-memory deployment, if selected, need
explicit execution/memory contracts. Keep the portable serial interpreter executor.

Flecs motivates cached component queries, sliced work and declared access with
publication at synchronization boundaries. It does not infer Tower's semantic
dependencies or make arbitrary mutable state safe. A language `foreach` remains
ordered by default; parallel compiler batches require separate scheduling/access
proofs. Threading, contiguous storage and SIMD are independently measured goals.

### 3. First executable comptime slice

Scalar syntax implemented in the current checkout (publication validation is
still in progress):

```tower
fn calculate(n: i32): i32 {
    var result = n * 7;
    return result;
}
var answer = comptime(calculate(6));
var other: decltype(calculate(6));
```

`answer` receives a typed Foundation constant `42`. The type query for `other`
resolves `i32` without executing `calculate`. The same ordinary function remains
callable at runtime. Both requests reuse the existing type checker; evaluating
`answer` additionally demands the checked/lowered body and selected callees.
Forward declarations and cross-module calls must work through query dependencies,
not through a special source-order constant pass.

Evaluate ready requests through the ordinary Tower interpreter with explicit
semantics version, target/layout, recorded inputs, capabilities and resource
budgets. Begin with integer/bool arguments/results and a documented pure operation
subset: ordinary locals, arithmetic, branches, loops and eligible direct calls.
Materialize results with the existing typed Foundation literal representation.
Retain provenance and the dependency record on shared entities. Do not run a whole
module's initialization merely to invoke one staged function.

The ordinary interpreter now has an explicit, independently owned invocation
context with arguments, result, target width, error/output buffers and deterministic
fuel. Staged execution enters the selected function without module initialization.
Strict stages track local initialization/liveness, reject unsupported effects and
memory operations, and suspend on an unresolved stage query without consuming
fuel or repeating earlier execution. Result materialization follows a joined
worker batch; the checked Foundation entities remain authoritative.

Remaining work includes general tracked effect capabilities, frozen aggregate and
file-input values, type-producing ordinary functions, demand-driven body checking,
and dependency-aware invalidation. Heap/global/output/foreign capabilities are
currently rejected in strict stages, not silently folded. A registered host
callback alone does not make a function eligible for staging. Full parser/session
and semantic ownership migration remains a primary objective alongside staging.

Cache only completed eligible evaluations under their complete dependencies and
profile. `const Name()` retains its present ordinary-function meaning until an
explicitly tested migration exists. No native evaluator, special arithmetic folder,
JIT requirement, public instruction ABI or interpreter-cache metadata is needed.
Floats remain future language work and need a defined strict numeric profile;
using host floating-point or merely executing Wasm cannot establish determinism.

### 4. First-class types and arbitrary staged values

Replace the bounded type-constructor evaluator with ordinary staged Tower code
once type values have an executable Foundation spelling, stable nominal identity,
construction/finalization rules and reflection components. Today
`generic_type_result` recognizes one optional local struct followed by a return;
it does not execute an arbitrary function body. `sem_constant_argument` admits
integer literals/bound template values, not general staged expressions. Reuse
those existing shared entities while retiring these bootstrap restrictions.

This unlocks ordinary code computing type/array parameters, schema-generated
structs, lookup tables and target-derived layouts. Adopt it in a small compiler
subsystem with a before/after behavior and source-size comparison, rather than
assuming every constant helper should disappear. Types must be usable through
ordinary parenthesized application and semantic name lookup. Runtime values cannot
retroactively alter already compiled static layouts.

Extend arguments/results to aggregates, buffers/containers, graphs and functions
under the arbitrary-value contract below. Define owned storage, shared aliases,
cycles, type/function identity and relocations at stage boundaries. Retained or
pinned shared compiler entities need an explicit interpreter-access contract;
casting native entity pointers into guest addresses is not one. Target materialization
must reconstruct compilable Foundation, never persist raw host addresses.

Add tracked file inputs next, including observed absence and changed resolution;
then recorded network acquisition and other capabilities with replay policies.
These features depend on the same query/invalidation and effect-order rules, not
a separate metaprogramming runtime. A successful scalar milestone is a vertical
slice of this model, not the completed arbitrary-value compile-time feature.

### Acceptance gates for this slice

- Type queries: locals, fields, indexed elements, calls, imported aliases,
  forward dependencies and generic instantiations; no execution of increments,
  traps or foreign calls in operands; precise missing-name/type/cycle errors.
- Scheduler: one large unit with independent and dependent declarations, multiple
  imported modules in that unit, and multiple separate units sharing an import
  diamond. Verify actual overlap within the single unit, deduplicated requests,
  legal pointer recursion and rejected by-value/evaluation cycles.
- Staging: ordinary function execution, used-input/body changes invalidating
  consumers, unused-input stability, target/profile separation, ordered effects,
  resource failure, cancellation and rejection of stale results. Add aggregate,
  graph and recorded-I/O cases as those capabilities land.
- Across all slices: compilable Foundation round trips, graph/fast interpreter
  agreement at both pointer widths, raw/optimized LLVM, native/browser execution,
  and identical canonical output/diagnostics at 1/2/4/8 workers with adversarial
  completion order. Measure wall time, work/span, peak memory and scheduler cost;
  a synthetic SIMD kernel does not establish compiler-wide speedups.
- Bootstrap: implement new semantics in predecessor-compatible Tower first,
  validate and publish the complete successor and resources, then adopt new
  syntax in compiler sources. Recheck a clean default build after integration.

References: the [C++ decltype specification](https://eel.is/c++draft/dcl.type.decltype)
defines its operand as unevaluated; only that principle is proposed here.
[Flecs systems](https://www.flecs.dev/flecs/Systems.html#threading) and
[queries](https://www.flecs.dev/flecs/Queries.html#performance-and-caching) inform
batching and query caching. The journal's 2026-11-18 type-function discussion,
2026-11-19 language/worker/pinned-world entries, 2026-11-20 resolved-type-use and
operator entries, and the original TODO dependency/type-value/staging notes
provide the Tower-specific rationale. Historical speculative memory-safety and
identity ideas in the TODO do not supersede the current raw Foundation contract.

## Arbitrary values at compile time

The intended language accepts any Tower value as an input to, intermediate value
of, or result from compile-time execution. This includes types, every scalar kind,
whole structs and tagged values, strings, buffers, arrays and containers, trees,
parse trees, syntax/grammar entities, shared compiler graphs, functions and
function pointers. Type-producing functions and specialization use these same
ordinary values and calls. The template example's type/integer arguments describe
today's bootstrap implementation; they do not restrict the eventual language.
Values need not become compile-time-only: execution stage follows dependencies
and explicit staging, and the same eligible code and values remain usable at runtime.

Known values should also be inferred through ordinary execution. For example,
`var a = 5;` need not carry an explicit constant annotation for eligible later
uses to become known; writes and aliases determine when that knowledge remains
valid. This MUST NOT become a separate pre-LLVM constant-propagation or arithmetic
folding pass. Dependency/effect tracking supplies available inputs to the ordinary
Foundation interpreter, which executes the same value, arithmetic, call and memory
operations used at runtime. Literals participate in that contract too. Fast paths,
memoization and later native execution tiers must preserve those semantics.
Explicit `comptime` requires a result at that stage; inferred execution may leave
runtime work when inputs or authorized effects are unavailable. Knowing the
argument to `print` does not authorize performing its output during compilation.

Constant regex/DFA and grammar data are motivating cases: make as much ordinary
execution known as dependencies allow, and expose the resulting values to native
optimization without requiring users to generate code. Unknown input characters
still select transitions and unknown input lengths still require repetition.
Specialized state code and bounded-loop unrolling need finite code-size/work
policies, effect preservation and measured results; fixed tables alone do not
guarantee that LLVM generates an optimal branch layout. Explicit staged code
generation remains an additional facility on the same Foundation nodes.

A type constructor may consume a parsed configuration struct, a complete buffer
read from a file, a container of schema records, a function that transforms those
records, or a parse tree built by ordinary Tower code. Passing those objects must
not require reducing them to integers, encoding them as source strings or creating
a second metaprogramming representation. Shared syntax and Foundation graphs stay
on the existing entity/component model. Runtime data cannot retroactively change
an already compiled static layout; staged construction records which inputs fixed it.

Functions are ordinary staged values, including functions passed to other
functions or returned from them. Function pointers can be passed and invoked
under their exact signature, target and effect contracts. Represent persistent
code references through stable declaration/specialization identity and target
relocations, not the compiler process's numeric code addresses. Track the selected
function's body and dependencies when it is evaluated. Define captures and their
ownership if function values carry environments; a function value does not imply
a garbage collector, hidden object lifetime or native callback shim.

Arbitrary data graphs require explicit ownership and identity, including shared
subobjects, cycles and pointers into owned storage. A staged argument can borrow a
pinned revision or own its storage; it need not deep-copy an entire compiler world.
Track the fields, buffers, entities and revisions actually read, with ordered
writes and invalidation for mutable inputs. Define equality/identity and cache
keys per value kind; do not hash allocator addresses, uninitialized padding,
incidental container capacity or host traversal order as semantic inputs. Preserve
nominal type/function identities and alias relationships where they are observable.

External data acquisition is allowed through explicit capabilities. Ordinary
Tower code may read files, open a socket, wait for a reply and parse the returned
bytes into any of these values. A network request/response is an input acquisition
dependency, not a pure computation that can be cached without a policy. Record
request identity, ordered response bytes and observable outcomes, with explicit
refresh, pinned snapshot and offline replay behavior. Treat timeout, cancellation
and I/O failure as ordinary result data; asynchronous acquisition uses the shared
completion protocol. Track only the external observations the program uses,
including time or randomness when explicitly provided as inputs. Credentials and
live handles belong to the supplied capability, not emitted program constants.

Strict evaluation has identical defined behavior for the same program, recorded
inputs, semantics version and explicit target. A live server can provide different
inputs to a later build; that changes the dependency identity and invalidates its
consumers. Replaying the recorded inputs must not depend on the host's clock,
socket wake-up order or the availability of the original server. This permits
live network-backed compilation without silently treating arbitrary I/O as pure.

Separate values usable during staged execution from how they cross a stage or
artifact boundary. Owned data and graph edges need canonical Foundation
construction and relocations; function references need target code bindings.
A live socket or host address can be used through its capability while evaluating,
but cannot be copied numerically into a target executable. A value crossing that
boundary needs a defined target representation or an explicit reconstruction
operation. Diagnose unsupported escapes precisely instead of prohibiting whole
value categories from compile-time code. Keep Foundation as the semantic storage
format and preserve the same no-GC, no-exception ownership/result rules.

Acceptance tests must pass aggregate/container/function/graph values through
ordinary staged calls and type construction, exercise mutation and dependency
invalidation, and preserve aliases/cycles through Foundation reconstruction.
Use recorded socket transcripts to test refresh, failure, cancellation and offline
replay without relying on a public service. Compare native/browser interpreters,
worker counts and explicit target profiles; verify that changed used inputs or
function bodies invalidate consumers and unchanged inputs reproduce artifacts.
These are design and validation goals, not implemented general staging today.

## Coroutines, threads and job-group completion

The desired surface is one understandable way to wait for work and obtain its
typed result, whether that work suspends as a coroutine, completes on a native
thread, or consists of many dependency-scheduled component batches. An operation
such as `join(completion)` and optional `await completion` sugar are design
sketches, not accepted syntax. Completion types should use ordinary Tower type
construction, such as a future `task(T, E)`, rather than a parallel type system.
Keep free functions and explicit operands; a hidden receiver is not required.

Separate the completion protocol from execution policy. A coroutine suspension
does not imply creating a thread. A batch job should use a bounded worker pool;
a group join should not allocate an OS thread per task. A single result may be
joined once by its owner, or shared through an explicitly borrowed/shared handle
whose lifetime and result access are defined. Do not equate shared handles with
unrestricted mutable payload access. Decide consuming versus repeatable joins,
single versus multiple waiters, and result ownership before fixing an ABI.

Use explicit state and ordinary `result(T, E)` values, including a defined
cancellation outcome. There are no exceptions, garbage collector or implicit
unwinding runtime. State-machine storage can live in caller-owned frames, arenas
or explicit allocations when lifetimes allow; do not require a heap allocation
for every suspension, waiter or batch. Captures and borrowed component views must
remain valid until children finish or are safely drained. Define structured task
groups and explicit detachment before allowing background work to outlive scope.
Cancellation requests are distinct from completion and reclamation. Native
threads cannot be killed while retaining shared-world references or locks.

The coordinator records dependency edges, completion state and waiters in compact
derived indexes over the same shared entities. Batch notifications and group
joins should avoid repeated full scans, per-node event dispatch and one allocation
per edge. Joining from a worker must not consume the last worker needed by its
dependencies: suspend, park or help execute eligible work through a specified
policy. Detect dependency cycles; distinguish them from external pending inputs.
Keep deterministic result/diagnostic publication independent of completion order.

Coroutine lowering should produce ordinary Foundation state, branches, calls and
explicit lifetime/effect operations on the existing nodes. Canonical Foundation
must remain compilable and preserve suspended state semantics; no new public
bytecode, independent coroutine IR or native shim is permitted. Native, browser
and portable interpreted executors share these contracts. Strict compile-time
execution must use deterministic scheduling/effect rules and tracked capabilities;
an OS wake-up order, clock or arbitrary async I/O cannot affect constant values.

Burst-style jobs use the same completion/dependency handles but execute compact
typed query batches with declared reads/writes, pinned inputs and owned outputs.
Suspension/joins belong at valid lifetime/publication boundaries, not implicitly
inside every element of a vectorizable kernel. Keep alias/access facts available
to LLVM; prove them before emitting noalias or vectorization promises. Thread
distribution and SIMD remain separately measured capabilities.

Performance acceptance must measure ready/completed joins, suspend/resume,
fan-out/fan-in, cancellation/drain, allocations, peak memory, wake-up contention
and starvation across 1/2/4/8 workers and native/browser/interpreted paths. Compare
small jobs against a direct loop so scheduling overhead cannot hide behind large
tasks. Record throughput and tail latency, inspect actual vectorized IR/assembly,
and preserve outputs across worker counts and adversarial completion orders. Set
concrete budgets from these baselines; "lightning fast" is a goal to demonstrate,
not an unmeasured guarantee.

## Resolution and evaluation details

### Shared data-oriented compiler core

Use Flecs-style component queries and Burst-style compiled batches throughout
parsing, binding, type/layout resolution, specialization, compile-time evaluation,
optimization and emission. These are architectural influences, not dependencies
on Unity, managed runtimes, C++ ECS implementations, or a second compiler IR.
Result propagation is ordinary typed data/control flow on the same nodes; it does
not require dispatching an ECS event for each error.

Published inputs/components are immutable for an explicit revision. Tasks declare
their read and write sets and own scratch allocations. Matching-node lists,
reverse dependency edges and batches are derived indexes. Repeated passes should
cache queries and traverse compact typed data where measurements justify it;
avoid rediscovering the same component through per-node generic lookup in a hot
loop. Preserve entity identity if storage is packed or split into hot/cold fields.
Do not scatter the same authoritative metadata into per-backend copies.

Separate parallel computation from structural publication. A worker produces
owned changes for its task; commit them at deterministic boundaries and invalidate
the relevant query caches. Disjoint existing payload ranges may admit direct
writes once alias/read-write contracts prove isolation. Global structural edits,
entity lifetime/refcounts, allocators and mutable caches must not be raced.
Stable output/diagnostic order uses semantic source/task keys, never completion
order or host addresses. Cancellation discards unpublished work and releases its
owned storage. Externally visible effects retain their ordered execution contract.

The current EntityStore uses ordinary counters/refcounts and mutable per-type
instance arrays; query cursors are invalidated by structural changes. Its stable
payload addresses and type index are useful starting points, not a thread-safety
claim. The compiler also still has a singleton store boundary and mutable session
caches. Audit/replace those boundaries before enabling concurrent in-process
writers. Foundation atomics, memory ordering and platform worker contracts need
Tower semantics/lowering and tests; adding a native shim is not an option.

The executor must support serial interpretation, native worker pools and browser
workers through one task/dependency contract. Browser workers may begin with
isolated compilation contexts and canonical Foundation transport; shared Wasm
memory requires an explicit compatible deployment profile. Compiling a dependency
twice is not a cache strategy. Share immutable source/content identities and
bounded versioned results; deduplicate demanded work. A local queue or a parallel
map helper alone does not complete this infrastructure.

Validate with generated large module/declaration workloads and incremental edits:
throughput, peak memory, graph/index allocation, cache hit/miss reasons, work/span,
and scaling at 1/2/4/8 workers. Compare canonical Foundation, artifact bytes,
diagnostics, compile-time effects and cancellation cleanup across schedules.
Remove prototype fixed limits only with scalable storage and diagnostic/resource
budgets, not by changing a magic bound and claiming large-project support.

A query key includes entity identity, query kind, explicit arguments, target and
semantics profile. Record reads as edges; use unseen/evaluating/ready/failed states
and report the actual cycle chain. Separate type identity from layout: pointers
to recursively declared types may resolve without demanding their pointee's
layout; by-value layout cycles fail. Type aliases and compile-time calls cannot
silently break cycles by inventing placeholder results. Invalidation propagates
to consumers, and results publish only after their dependencies finish.

Compilation stages preserve effect order. Demand-driven pure resolution is not
permission to reorder or discard module initialization, capability reads, or
observable compile-time effects. Keep tracked source imports in the project tree;
later declaration-level use tracking may reduce reflection/emission without
hiding source dependencies that were actually read.

## Operators, pointers and syntax decisions

Tower now implements postfix call/index/member, unary, multiplicative, additive,
shift, comparison, equality, bitwise and short-circuit operators above Foundation,
including null coalescing, conditional, assignment and comma expressions. Binary
arithmetic groups left; unary, conditional and assignment group right. This
supersedes the earlier proposal to omit comma and keep assignment statement-only.
See tower.md for the complete implemented operator contract. Braces are mandatory
for control-flow bodies and create lexical scopes (already true in Foundation).

Associativity describes grouping, not permission to reorder evaluation.
Commutativity/algebraic reassociation are separate, proved optimization properties,
subject to overflow, floating-point and effects contracts. Overloading an operator
must not change its precedence. Short-circuit operators need control-flow lowering,
not an ordinary eager two-argument function.

Use only `.` for field/property access. Repeated pointer dereference can be
unambiguous for a typed member path, but it does not establish non-nullness,
lifetime, alignment or permission to mutate. Do not automatically take addresses
of arbitrary rvalues or silently dereference assignment/call operands: those
choices change aliasing and can create dangling references. Implement automatic
receiver borrowing only after place/lifetime rules exist. Explicit Foundation
address/load operations remain available. No `->` is necessary.

## Errors are values; no exceptions and no GC

The user's follow-up makes both constraints absolute: Tower introduces neither
garbage collection nor exception throwing/unwinding. Recoverable failures use
ordinary return values. A runtime trap diagnoses an execution failure; it is not
a catchable language exception or a replacement for a result-returning API.

Propose one first-party type constructor, `result(T, E)`, with success and error
variants, and `option(T)` for absence. The concrete value owns only its active
payload, has explicit target layout and a Foundation spelling, and supports exact
type checking and reflection. Do not depend on niche packing for semantics; that
can be a representation optimization once ABI contracts permit it. Small error
enums/records carry data without requiring allocation or exception machinery.

Start with ordinary constructors and exhaustive match. Proposed later sugar
`var file = try open(path);` checks the returned tag, yields the success payload,
or returns the error through the enclosing function's compatible result type.
It lowers to normal branches and returns. No implicit conversion of error types,
hidden throw path, or implicit runtime handler stack. Explicit conversion functions
can adapt errors. Early return runs the same specified drops as an explicit return;
do not implement sugar before that rule is sound. This is propagation, not handling.
Callers may instead match to recover, add context, or choose a fallback.

Initially require explicit error handling/propagation; a deliberately discarded
result must be explicit. Keep the surface small: one result representation,
match, and one propagation spelling. No special template/overload framework is
required to make errors work. The current scalar/pointer container APIs return
bool and leave output parameters unchanged on failure; those remain usable until
aggregate returns and tagged payload ownership support this design.

## Validation gates

Every feature needs positive and diagnostic Tower fixtures, scoped-name and
effect-order cases, Foundation serialization/reparse, graph/fast interpreter
agreement and raw/optimized LLVM agreement. Exercise both pointer widths and
browser/native builds where available. Test invalidation, cancellation and
determinism for compile-time work; failure preservation and ownership for
containers. Benchmark representative compiler workloads before migrating them.

## Research and existing findings

- The journal's 2026-11-16 replacement work explicitly lacks binding hygiene:
  text replacement with fixed temporary names cannot safely implement match or
  foreach. Generate bound Foundation entities and collision-free serialized
  local names instead.
- The 2026-11-17 operand-composition work already defines left-to-right effects,
  resumable graph evaluation and assignment-address capture. Preserve it.
- The 2026-11-18 template work supports concrete type/integer specialization,
  not arbitrary staged execution. The 2026-11-20 module scopes supersede the initially flat import bindings;
  import caching is still not declaration-level incremental resolution.
- [C# operator specification](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/expressions#1242-operator-precedence-and-associativity)
  informs the familiar grouping table. Tower's effect and integer contracts remain
  its own.
- [Rust match reference](https://doc.rust-lang.org/reference/expressions/match-expr.html)
  informs the braced arm notation and first matching arm behavior. Tower's initial
  statement form is deliberately smaller than Rust pattern matching.
- [Flecs queries](https://www.flecs.dev/flecs/Queries.html) and
  [systems](https://www.flecs.dev/flecs/Systems.html) inform cached matching and
  component access declarations. Their implementation is not being copied into
  Tower's owned native boundary.
- [Unity Burst](https://docs.unity3d.com/Packages/com.unity.burst@1.8/manual/index.html)
  informs specializing/compiling compact work batches. Batch layout, parallel
  scheduling and SIMD are distinct decisions and each needs measured evidence.

## Implementation ledger

- Before this work: Tower named-value functions, Foundation lexical block scopes,
  explicit module dependency loading and first-party type specialization exist.
- First slice implemented: structured literal match/while, generic stack/queue,
  vector pop and explicit ownership transfer. See [current syntax](tower.md).
  Backend/interpreter/round-trip and publication results are recorded in the journal.
  Nominal enums with explicit integer representation, automatic discriminants,
  enum-member match patterns and canonical Foundation identity are implemented.
  The shared Tower work graph now schedules compiler type layouts with iterative
  dependency discovery and cycle paths; it also supports demanded work, failure
  propagation, revision/profile tickets and cancellation. It is coordinator-owned;
  concurrent entity mutation remains unfinished. The compiler-unit executor now
  uses real browser/Node workers with isolated compiler worlds and the same Tower
  dependency coordinator. Component read/write ranges and structural exclusivity
  are available in that shared scheduler. Native Tower worker pools and pinned layout/evaluation publication now exist.
  Declaration discovery/readiness (including signature parameters), eligible
  function body checking, expression lowering, LR transition/kernel closures,
  FIRST/nullable frontiers, LALR dependency-link construction and lookahead
  frontiers/action ranges run through the shared pool API. Link workers use
  immutable closures/state bases and private ordered publication records; the
  coordinator merges them into the same derived graph after joining. Canonical
  generated entities are staged privately and published after worker joins;
  exclusive leases permit body workers to attach components to their own source
  entities while typed query indexes stay pinned. Ordinary indexed value access,
  local inference, decltype, stage registration and defer use this path. Bodies
  requiring generic/type construction now use resumable top-level statement runs,
  suspending on source-keyed preparation receipts and resuming on workers. Nested
  structural statements and editor observation retain a coordinator path.
  Already-instantiated generic bodies now use body workers when their immutable
  bindings and existing layouts are ready;
  conservative admission retains first consumers of pending layouts on the
  coordinator and records completed layout dependencies on body queries.
  Generic function signatures now retain a body root without copying its
  descendants. Execution demand schedules those copies on workers through the
  shared query graph; body checking depends on their published receipts. Clone
  and checking state share the existing body-work component. Stages own copied
  names and queue provenance references for coordinator transfer before unpinning.
  Type-constructor copying and structural checking still need continuations.
  Eligible operator expressions, ordinary/prepared generic calls and scalar
  comptime expressions in inferred declarations and decltype annotations are
  checked on workers after declaration/signature and layout dependencies publish.
  Prepared consumers yield for worker readmission with explicit signature reads;
  worker-created evaluations publish into the same interpreter query graph.
  Eligible generic argument deduction also runs on workers with private type
  constraints and alias diagnostics; the coordinator interns results and creates
  signatures. Role-aware declaration admission now includes value indexing and
  ordinary builtins; type arguments still exclude array/type construction.
  Field-layout readiness projects pointers, arrays and published call results.
  Computed field bases without that projection retain coordinator checking.
  Call continuations preserve enclosing evaluation depth
  so skipped nested stages remain lazy during deduction.
  Shared entities now use stable component pages, exact-signature archetype rows,
  published component columns and view-owned multi-component query plans.
  These index stable payload pointers; they do not relocate component data.
  A shared-memory
  WASI transport passes Node and isolated Chromium overlap/cancellation tests.
  Browser packaging now includes the shared reactor and nested worker; static
  hosting gains isolation headers through a service worker, with a portable
  fallback when isolation is unavailable. Local desktop loading/reload/fallback
  tests pass; the action-range checkpoint is published and hosted desktop/mobile
  verification passes. Later parser phases receive their own release checks.
  Native CLI project recipes, structural semantic phases, query/storage migration and measured
  SIMD remain open.
  Tower expressions, numeric grammar precedence, compound assignments and lazy
  logical/null operators are implemented by the 2026-11-20 expression migration.
  The checked-in Linux x64 development bootstrap supports the expression/import
  changes; this is not a portable release or evidence of browser publication.
  Scalar `comptime(expr)` and unevaluated `decltype(expr)` now have working
  implementations and focused tests; general compile-time values/effects and
  fully threaded dependency-driven checking remain in progress. Selective
  imports, exact overloads, automatic moves, properties, interfaces and general
  attributes remain pending. Scoped `for` is implemented upstream.
  Generic calls can infer omitted type arguments from exact typed operands and
  nominal specialization metadata, including straight-return aliases. See
  [generic call inference](generic-call-inference.md) for constraints and bootstrap
  compatibility; this does not add implicit conversions or overload ranking.
  Typed `foreach` now supports finite borrowed views through statically resolved
  nominal protocols, including vector/stack/queue. See
  [borrowed iteration](borrowed-iteration.md). It reuses scoped cleanup and
  Foundation nodes; checked borrowing and implicit parallel iteration remain out.
  Target-typed `default` and explicit `default(Type)` now provide scalar zeros
  and complete in-place struct/array initialization/reset. See
  [default initialization](default-initialization.md). Existing Foundation
  address/sizeof/fill operations preserve target layout and one destination
  evaluation. This does not implement named-field construction, ownership or
  aggregate staging capabilities. Its compatible bootstrap precedes adoption
  across the compiler, libraries, backend and host code.

## Next parallel/compiler milestones

1. Keep isolated unit builds as a validated executor and reference. Move native
   CLI unit dispatch onto the same Tower coordinator with platform worker APIs;
   it must not depend on a new owned C/C++ callback shim. Function-address/call
   contracts and portable interpreted execution need explicit Foundation support.
2. Replace the singleton store/session boundary with explicit compiler worlds.
   Audit node lifetimes, source references, per-type instance arrays, allocator
   ownership, caches and linker temporary paths. Freeze inputs for a revision;
   use worker-owned output components and deterministic coordinator publication.
   The first lifetime primitive is now implemented: EntityView pins one existing
   store, keeps component query ranges stable, defers zero-reference reclamation
   and rejects structural edits until the last view closes. Layout kernels use
   this boundary. This does not yet replace the singleton compiler store or make
   payload mutation/refcounts concurrent. Live compiler services must bind each
   request to a world/revision, drain work before releasing views and reject stale
   replies; worker/Wasm-instance isolation remains the present service boundary.
   Generic component registries now belong to individual programs and are
   implemented entirely in Tower. Active module graphs also own exclusive parser
   session leases; environments retain one idle cache and reject disposal with
   live requests. Tower CompilerWorld now owns stores and lazy parser/syntax/
   Foundation registries, with direct Tower payload finalizers and guarded
   disposal. Node-anchored semantic, parser-match and provenance accessors now follow a
   borrowed owner context on the entity store, and four interpreter jobs across
   two explicit worlds pass through one pool. The production host still exposes
   a default-world handle. Tower now owns grammar baseline/revision/cache records
   and parser session leases. Module environments now bind to one explicit world;
   module entities, import readers, cached declarations, session formatting and
   execution roots follow that owner. Whole-program independent-world parsing, checking, interpretation and
   canonical package reconstruction pass native validation. Native CLI requests
   own worlds and install grammar directly through Tower. The callable native
   unit executor now dispatches independent frontends in one process, with ECS
   recipes/results and bounded nested workers. Its production overlap, lazy
   evaluation/cycle, cancellation and cleanup tests pass. CLI project recipes,
   legacy IDE transport adapters and backend publication still need integration.
   Explicit completion/inspection constructors now borrow the requested world and
   environment; mixed compile/inspection jobs use the native unit executor, hide
   outputs until successful joins and pass real overlap/ownership/cleanup checks.
   Within-world editor semantic observation still follows the coordinator path;
   do not extend the isolated-job concurrency claim to that internal phase.
3. Migrate pure layout, body-analysis and lowering queries individually. Cache
   matching entity/component tuples. Preserve stable sparse payloads where
   address stability matters; introduce dense typed columns only for measured
   hot loops, with stable entity identity and explicit migration/invalidation.
4. Split dependency-ready query ranges into sufficiently large batches. Declare
   read/write ranges, pin the world and preallocate outputs before dispatch.
   Structural commands publish at a barrier. Prove alias contracts before LLVM
   noalias/vectorization attributes; ordinary Foundation raw pointers may alias.
5. Measure end-to-end and kernel speed, memory, determinism and cancellation at
   1/2/4/8 workers. Inspect optimized IR/disassembly for actual SIMD. Threaded
   dispatch, dense storage and vectorization are independent claims. Continue
   the language milestones above on these same shared entities throughout.

Current migration audit (after the isolated compiler-worker milestone):

| Area | Authoritative/shared data and present storage | Concurrency work still required |
| --- | --- | --- |
| Entities | Stable payloads, dense per-type pointer indexes, explicit worlds, pinned views, exclusive attachment leases and staged canonical creation | Complete host-world isolation and non-racing reference ownership |
| Syntax/grammar | Shared entities; world-bound module/session/baseline/revision/cache ownership; worker-owned FIRST/nullable frontiers, LR(0) transitions, LR(1) kernel closures, dependency-link construction, wide lookahead frontiers, LALR actions and runtime action/direct-index/goto rows | Native CLI project recipes, runtime sequence specialization and source/effect order; link/seed merging and row interning publish after joins |
| Semantics/layout | Shared query graph; parallel dependency discovery, layouts, eligible ordinary/instantiated-generic body checking and expression lowering | Surface loop/match/defer and expression/type-construction continuations, precise body layout dependencies, within-world editor observation and structural publication |
| Interpreter/staging | Per-invocation contexts over shared Foundation; ECS preparation/lowering dependencies, threaded lazy scalar evaluation and private execution caches | General ordinary-value execution, explicit effects/inputs and invalidation; no separate folding evaluator |
| LLVM | Shared Foundation inputs; one mutable LLVM context/module per compiler instance | Function/query boundaries that do not concurrently mutate one LLVM module; preserve target legality |
| Link/publication | Tower plans/artifacts plus upstream LLD and filesystem interfaces | Keep LLD globals and fixed temporary names isolated/serialized; publish a candidate only after its checks |

Do not replace the sparse payload store everywhere just to resemble an ECS
library. Cached typed queries and measured hot/cold columns should preserve the
same node identities and canonical Foundation. The current worker isolation is
the safety boundary until those explicit-world and publication contracts land.
