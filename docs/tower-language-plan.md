# Tower language development

Status: staged design, 2026-11-19. Only the implementation ledger below describes
shipped behavior. The rest is a plan, not accepted source syntax yet.

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

Proposed order, strongest first: postfix call/index/member; unary; multiplicative;
additive; shifts; relational; equality; bitwise AND/XOR/OR; short-circuit AND/OR;
conditional; assignment. Binary arithmetic groups left; unary, conditional and
assignment group right. Assignment may remain statement-only initially. No comma
operator is planned. Braces are mandatory for all control-flow bodies and create
lexical scopes (already true in Foundation).

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
  are available in that shared scheduler. Native CLI worker pools, frozen-world
  phase publication, query/storage migration and measured SIMD remain open.
  Selective imports, full expressions, automatic moves, general foreach,
  comptime/eval, properties, interfaces and attributes are not implemented yet.

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
   disposal. The production host uses one default-world handle; native sessions,
   grammar baselines, provenance metadata and default-only semantic accessors
   still need migration before complete independent compilation can use explicit worlds.
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
| Entities | Stable per-component payload allocations; dense per-type pointer indexes; owner component lists; pinned structural views | Explicit compiler-world ownership, structural publication and non-racing reference ownership |
| Syntax/grammar | Shared entity components; parser tables and session stacks are derived | Isolate mutable session/cache state; preserve incremental grammar and source/effect order |
| Semantics/layout | FoundationNode components; derived hash tables and layout work graph | Pure query inputs, declared accesses, owned result buffers, deterministic component commit |
| Interpreter/staging | Shared Foundation plus a private verified execution cache | Explicit deterministic effects/inputs and invalidation; no metadata in the cache stream |
| LLVM | Shared Foundation inputs; one mutable LLVM context/module per compiler instance | Function/query boundaries that do not concurrently mutate one LLVM module; preserve target legality |
| Link/publication | Tower plans/artifacts plus upstream LLD and filesystem interfaces | Keep LLD globals and fixed temporary names isolated/serialized; publish a candidate only after its checks |

Do not replace the sparse payload store everywhere just to resemble an ECS
library. Cached typed queries and measured hot/cold columns should preserve the
same node identities and canonical Foundation. The current worker isolation is
the safety boundary until those explicit-world and publication contracts land.
