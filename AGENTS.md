Do NOT modify todo.txt.

## Workflow and evidence

- Work directly on `main`; never create or use feature branches. Start every
  turn with `git pull --rebase`; preserve existing work through any rebase.
- Finish independently: commit the turn's changes, pull/rebase again, resolve
  conflicts, validate the merged result, deploy through
  [the established process](playground/README.md#checks), verify the published
  result, and push normally. This includes documentation-only turns. Report exact
  blockers; never discard others' work, force-push, or claim unfinished steps passed.
- Require deployment source/build commits to be reachable from the published
  `main`; push both refs with `git push --atomic origin main
  <deployment-commit>:refs/heads/gh-pages`, then verify the hosted result.
- Before work, read relevant entries in
  [the project journal](docs/temporal-opcode-research-journal.md) and applicable
  design/handoff docs. Maintain that journal throughout substantive work: sources,
  findings/root causes, approach, experiments (including failures), decisions,
  commands/environment, measurements, validation, limitations and next steps.
  Preserve history; explicitly distinguish proposals, implementation and evidence.
  Honor explicit read-only requests by reporting findings without writing files.
- Fail fast with actionable diagnostics and nonzero failure results. Preserve
  errors and logs; never hide a failed check, silently substitute unsupported
  behavior, or turn a skip into a pass. Drain owned jobs before releasing inputs.
- Keep changes concise and scoped. Fix measured iteration bottlenecks, remove
  redundant steps, batch related changes, and freeze inputs during builds. Reap
  failed processes before editing/restarting; do not overlap builds in one cache.
  No repository-wide cleanup or formatting sweeps.

## Tower implementation and bootstrapping

- Write all new project-owned code in `.tower`: compiler/runtime, libraries,
  tests, fixtures, tools, benchmarks, audits and temporary/one-off experiments.
  Do not add C++, Python or JavaScript implementations of logic Tower can own.
  Keep only necessary OS/foreign/browser/UI/transport boundaries outside Tower.
- Before porting a tool, audit callers and remove or simplify unnecessary work.
  Implement the smallest remaining behavior through shared Tower libraries and
  existing build/execution entry points. Prefer practical in-house libraries to
  new non-Tower dependencies; retain explicit host/target/capability contracts.
  Port touched legacy logic where useful; measure actual migration separately
  from GitHub language classification. Do not reintroduce native seeds/adapters.
- Use `tower.tower` as the main implementation language. Extend its ordinary
  rules and shared checking/lowering when useful; keep Bedrock/Foundation small.
  Audit touched code for supported expressions, loops, enums, initializers,
  `defer`, generics and containers. Preserve effects, ownership and invalid or
  Foundation-only fixtures; avoid unrelated mechanical rewrites.
- **Publish before adoption:** implement syntax using the previous language,
  build/validate a successor, publish/pin its complete executable and resources
  with hashes/provenance, then migrate compiler/build/tool sources. A private
  cache compiler is insufficient. Run a clean documented build with no private
  bootstrap override; repeat after rebasing onto changed compiler inputs.
  The checked-in Linux x64 bootstrap/Docker path is canonical; distinguish this
  development bootstrap from a validated portable release. See
  [bootstrap distribution](docs/bootstrap-distribution.md) and
  [bootstrap resources](bootstrap/README.md).
- Documentation-only deployment reuses verified runtime assets and preserves
  their build-source identity and concurrent publication receipts. Do not rebuild
  unchanged binaries or relabel old checks as validation of new compiler sources.

## ECS, dependencies and threading

- When adding a compiler pass, name the world that owns its inputs, the
  components it reads and writes, and the coordinator that publishes its
  results. Trace one entity from creation through its last reader before
  choosing storage. A persistent handle identifies an entity. A temporary
  borrow needs a live owner, stable storage and permission for that access.
- For a dependency, write down which value is missing and which query can
  produce it. Test a forward reference and an edit to that producer. The edit
  must invalidate the consumer through aliases. A read in an untaken branch
  should leave the consumer runnable. Compare the resulting Foundation,
  diagnostics and guest output at one worker and at the intended width.
  Track a binding's type separately from its value. Taking the address of a
  mutable binding can rule out capturing its value while leaving
  `decltype(binding)` available. In edit tests, record which module snapshots,
  worlds and semantic results survive between requests. See the
  [staged forward reference](scaffolding/tests/staging_aliased_type.tower)
  and the [retained import test](scaffolding/tests/execution_world.tower).
- Use the shared world-owned entity/component model wherever it fits, especially
  grammar rules, tokens/parse nodes, ASTs, types, Foundation operations, transforms,
  reflection and compiler work. Enrich those entities instead of adding another
  authoritative AST/IR. Tables, queues, parser tables and execution caches are
  derived indexes. Model ordered/named relationships and hierarchies explicitly.
- Apply Flecs-style archetypes, queries and staged structural changes. Select
  dense/cache-friendly columns for bulk traversal and sparse/stable storage where
  access patterns or lifetimes require it. Measure indirection, fragmentation,
  allocation, cache locality and false sharing; an archetype index alone is not
  packed payload storage. Use proven alias/access information for Burst-style
  vectorization; never invent `noalias` guarantees. Prefer one small, generic,
  extensible Tower framework over parallel special-purpose implementations.
- Schedule lazy type, `decltype`, layout, body, lowering, proof and evaluation
  queries through the shared dependency graph and job handles. Track declaration
  identity, aliases, writes, escapes and invalidation. Request needed producers;
  suspend/resume on new dependencies instead of blocking workers or recursively
  forcing completion. Reject stale revision/profile/dispatch tickets.
- Use resumable phase pumps with progress/waiting/completion/failure states.
  Diagnose cycles with dependency paths only after the owning pipeline exhausts
  eligible producers. Keep lexical continuations on work components; transfer
  scratch at joins without replaying checked statements, arguments or effects.
  Discover staged reads through executed control flow: untaken branches must
  not create false dependencies/cycles. Validate captures against their owning
  declaration/frame, not coincident offsets.
- Support parallelism **between compilation units and within units**, including
  independent trees/subtrees and ready dependency work, on supported native and
  browser hosts. Reuse `CompilerWork`, `WorkGraph`, `WorkPool` and
  `compiler_kernel_dispatch`. Share an explicit worker/memory budget across outer
  and nested work; refill available lanes without unnecessary batch barriers or
  oversubscription. Use all profitable available cores, preserve a fast serial
  path, and document host limits. A sequential loop or queue width proves neither
  concurrency nor speedup. Current coverage is in
  [compiler services](docs/compiler-services.md) and
  [the threading handoff](docs/compiler_ecs_threading_handoff.md).
- Pass world/session ownership explicitly; derive component kinds from that
  world. Confine default-world/global state to legacy boundaries. Workers own
  scratch, diagnostics, interpreter state and output stages; shared inputs and
  context descriptors are frozen before dispatch. Set world budgets before
  handoff; use `compiler_buffer_allocate/free`, not global allocation counters.
- Reserve tickets, component read/write ranges and exclusive leases before
  dispatch. A pinned view protects lifetime, not payload mutation. Build query
  plans before dispatch and keep cursors private. After joins, the coordinator
  publishes structural changes, interning, shared indexes and reference ownership.
  Call `entity_stage_hold` for queued references before closing the last input
  view; finalizers release discarded ownership. Joining does not release leases:
  publish affected stages before mutating entities leased by other jobs.
  Keep payload addresses stable, pools store/stage-owned, and table transitions
  reserved before commit; release private pool links before stage destruction.
- To test a pooled storage budget, keep the first entity and its payload live
  while filling the last precharged slot. Check that reuse needs zero new
  allocations. Then force physical growth, reserve the remaining bytes and
  check the exact denial. Verify the first entity, its payload, the child
  count and the budget again after retry.
- For a query that adds temporary annotations, identify every point where
  it publishes them. Exercise failure in the following phase while the source
  world is still live. Count the private kinds and components against their
  pre-query baseline before tearing down the world. If later phases need
  only private data, publish once after the last fallible phase.
- Cancellation/failure must drain workers before releasing worlds, borrows or
  contexts. Update worker admission when new syntax constructs types or invokes
  protocols implicitly; test it inside independent bodies too. Single-owner
  allocation-failure instrumentation uses serial transport; real overlap uses
  the production allocator or explicitly synchronized/per-worker instrumentation.

## Compile-time/runtime and language contracts

- Aim for ordinary Tower code and values usable at either compile time or runtime,
  including types, functions, containers and compiler graphs. Compilation is an
  explicit dependency-driven execution stage, not a separate metaprogramming
  language. Use the ordinary Tower interpreter for known values and `comptime`;
  never add a separate constant folder. Distinguish immutability from known value.
- Identical program, explicit inputs, semantic version and target description
  must give identical defined staged behavior across hosts. Share runtime/staged
  arithmetic, floating point, memory and effect semantics. Track effect capabilities
  and input invalidation; preserve effect order. Host behavior, relaxed numerics
  and fallback policies must be explicit in compilation/cache identity.
  Support only implemented staging capabilities; diagnose limits honestly.
- Foundation text is the sole semantic interchange/storage format. Every public
  operation and grammar declaration must round-trip through the shared formatter
  to compilable Foundation preserving bindings, types, order, effects, lifetimes
  and available provenance. A debug dump or independent binary graph is insufficient.
  `.towerbc` may wrap canonical Foundation plus a private versioned execution
  cache: validate bounds, versions and target/profile, reconstruct/check the graph,
  and verify the cache before running. Platform object/executable output is separate.
- Every file starts from the immutable Bedrock declaration seed and applies
  grammar declarations incrementally after their boundaries. Foundation imports
  Bedrock; Tower imports Foundation; ordinary modules import their language.
  Local overrides change following tokens/declarations without mutating imported
  entities or the seed. Share public Bedrock rules; preserve `=` versus `|=` and
  declaration order. Resolve dependencies before grammar activation and diagnose
  unresolved/incomplete active rules; never use file order as silent conflict priority.
- Keep standard types and constructors in Tower definitions imported by Foundation,
  not an ambient compiler name registry. Resolve reflected type identity through
  ordinary binding, not spelling or entity addresses. Use `var Name: type = ...`
  and parenthesized application such as `vector(i32)`; grow generics from ordinary
  type-producing functions, without a separate angle-bracket template language.
  Preserve nominal identity, target layout and explicit foreign ABI contracts.
  Include the type prelude and `foundation_syntax.tower` in all compiler packages.
  Consolidate built-in definitions and shared operator/conversion/literal policies
  in `types.tower` until its size warrants splitting. Every named primitive and
  type family must own its policy through ordinary Tower definitions and the
  shared protocol; representation constructors alone are not the endpoint.
  Complete this before fixed vectors/vectorization. Current type values, staged
  helpers and remaining constructor/ABI limits are documented in
  [type values](docs/type-values.md) and the journal's detailed continuation plan.
- Keep declaration attributes bound to nominal types, separate from type metadata;
  consumers validate their semantics. Prefer bracket grammar attributes and share
  operation classification, checking and assignment lowering. Preserve exact types,
  left-to-right/lazy effects, wrapping integers, width-masked shifts and explicit
  conversions. Unary minus stays an ordinary operation, including signed-minimum
  literals; keep floating signed zero and strict numeric behavior intact.
- Foundation remains raw and low-level: target-address pointers, explicit layout,
  legal uninitialized storage, no implicit lifetime/bounds checks or ownership
  transfer. Stronghold is the intended safe language/environment above Tower and
  eventual compiler implementation: type/memory safety, definite initialization,
  safe handles instead of exposed raw pointers, checked ownership/access and fast
  ECS/vectorized/threaded work. Keep those policies/provenance expressible on the
  same nodes and in cache identity without imposing them on all Tower programs.
- Preserve portable interpretation without guest JIT/executable-memory allocation,
  editable Tower grammar/compiler sources and cancellable browser workers that
  reject stale results. Keep execution controls uniform across source files,
  including Bedrock/Foundation. Long-term backend integration (LLVM/Binaryen,
  SPIR-V/Vulkan, DXIL and direct WGSL) shares these entities and target contracts.
  CPU shader execution, ocean rendering/buoyancy, SIMD and optional GPU features
  need explicit capability/numeric/context policies and safe baseline variants;
  default sampling/derivatives are not faithful shader-emulation guarantees.

## Writing concise Tower

- Use concrete types, typed handles/views and `function(Result, Parameters...)`
  callbacks. Keep `void*` only at genuinely opaque/untyped ABI boundaries; preserve
  ownership, lifetime and callee-before-argument order. Do not assume captures.
- Prefer ordinary struct copies, named-field construction and `default` for
  complete initialization/reset. They do not clone, dispose or transfer ownership.
  Preserve constructors, partial updates, alias/effect order and resource cleanup.
- Prefer `for` for counted loops, borrowed `foreach` for stable collections, and
  `while` for condition-driven work. Keep borrowed owners alive and structurally
  unchanged. Use lexical `defer` where exit timing/ownership fit; preserve reverse
  cleanup order, early exits and evaluate-once behavior.
- Prefer inferred locals/generic arguments when unambiguous, ordinary nested
  expressions, `!`, compound assignments and lazy `??`/guarded access. Retain
  named intermediates that explain meaning/effects. Scalar guarded results need
  a fallback; do not invent nullable scalars or use `->`.
- Use named `var` constants or nominal enum members for semantic tags, flags,
  limits and protocol values; no magic IDs, `const` keyword or constant-return
  function substitutes. Preserve stable ABI values and actual numeric fixture data.
  Use `i8/u8/i16/u16` for matching storage/ABI widths, wider intermediates as needed,
  and typed `f32/f64` for floats; use `bits` only for representation work.
- Derive sizes, lengths, element counts, loop bounds and related offsets from
  the actual collection, type or input using supported size/length operations;
  do not duplicate them as hardcoded values. Pass an explicit count with raw
  pointers; pointer size does not describe the pointed-to array. Keep literal
  values only where they define the data or contract, using named constants for
  semantic limits and protocol values.
- Project-owned Tower module/file/directory names use underscores. Prefer unquoted
  imports; each leading dot moves up one directory from the importer, with no
  library fallback. Quoted imports are exact, case-sensitive full filenames with
  no inferred extension or builtin alias. Keep lexical module identity separate
  from filesystem/symlink identity. Audit references/manifests when renaming.
- In an editor worker, install a grammar wrapper with the project's current
  files and the wrapper's own import path. Restore the active document path
  after success or failure. Check a cold request, an import edit on the same
  worker, and a missing import followed by repair. Use a sibling with the
  same name in the active document's directory to catch a wrong lookup.

Read the relevant contracts before changing syntax or migrating callers:

| Area | Contracts |
| --- | --- |
| Language, imports, plans | [Tower](docs/tower.md), [Foundation](docs/foundation.md), [modules](docs/modules.md), [language plan](docs/tower-language-plan.md) |
| Values and initialization | [struct values](docs/struct-values-and-bindings.md), [named fields](docs/named-field-initialization.md), [default](docs/default-initialization.md) |
| Calls, iteration, staging | [function values](docs/function-values.md), [borrowed iteration](docs/borrowed-iteration.md), [generic inference](docs/generic-call-inference.md), [computed types](docs/computed-type-arguments.md) |
| Numeric and declaration rules | [narrow integers](docs/narrow-integers.md), [floating point](docs/floating-point.md), [attributes](docs/attributes.md), [parser](docs/parser.md) |

## Validation and performance

- For every code change, profile the affected path before/after with frozen,
  equivalent inputs and checked outputs. Record wall/CPU time, peak memory and
  relevant allocation/retention data; investigate excessive memory or regressions.
  Measure fast single-thread execution as well as useful multi-core scaling, idle
  time, contention and scheduling overhead. Use small and large representative
  compilations, comparing similar C-like workloads/toolchains where meaningful.
  State host, compiler, target, flags, worker count, warm/cold state and samples;
  separate microbenchmarks from end-to-end claims. Documentation-only changes
  record why runtime performance/memory measurements are inapplicable.
- Validate independently against known-correct/reference behavior where possible.
  Use focused regression, differential, round-trip, malformed-input, stress and
  reproducible fuzz/property cases appropriate to the change; keep test logic in
  Tower. Compare serial/parallel canonical output and deterministic diagnostics;
  cover real overlap, aliases, dependency cycles/failures, stale results,
  cancellation and lifetime cleanup. Passing tests are evidence, not proof of
  race freedom in every execution.
- Compile the smallest changed unit first. Run `tower-lr-work-tests RESOURCE_ROOT`
  with `type-smoke` for type/query changes, `control-smoke` for lexical control,
  or `query-smoke` for scheduler/staging continuations. Inspect logs at phase
  boundaries and reuse unaffected evidence. Reserve full native/bootstrap/browser
  and compiler-generation matrices for a frozen publication milestone or changed
  ownership contracts; do not restart passing matrices for every handler.
- At final validation of code changes, run applicable supported memory/undefined-
  behavior and race/thread sanitization passes plus targeted concurrency stress.
  Fix findings; report unsupported instrumentation and remaining coverage gaps
  explicitly. Do not claim a serial allocator check sanitizes threaded Tower code.
  This replaces the former blanket sanitizer prohibition; keep expensive checks
  at the milestone boundary, without broad source cleanup or formatting sweeps.
- For a threaded sanitizer run, use the executable's link map to identify
  the allocator and worker transport it actually uses. Check the changed
  function for instrumentation and exercise it through the ordinary entry
  point. Record sanitizer startup failures separately from completed tests.
  The [LR editor check](docs/temporal-opcode-research-journal.md#native-sanitizer-coverage-for-lr-editor-completion)
  shows how the parser budget fixture and the editor use different transports.
- Reuse [Tower test/measurement tools](scaffolding/tests/README.md) and
  [browser checks/profiling](playground/README.md#checks). For ECS design research,
  consult primary [Flecs systems](https://www.flecs.dev/flecs/Systems.html),
  [component storage traits](https://www.flecs.dev/flecs/ComponentTraits.html) and
  [Burst aliasing](https://docs.unity3d.com/Packages/com.unity.burst@1.8/manual/aliasing.html)
  docs; transfer useful principles into Tower, not their implementation language
  or unmeasured performance claims.
