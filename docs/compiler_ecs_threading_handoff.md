# Compiler ECS, threading, and compile-time execution handoff

Checkpoint date: 2026-11-22. This report records the current implementation and
the next work in the same migration. It is a handoff, not a claim of completion.
Read it with [the research journal](temporal-opcode-research-journal.md),
[computed type arguments](computed-type-arguments.md), and
[compiler services](compiler-services.md).

## Status and checkpoint boundary

The overall estimate remains approximately **80–85%** of the current compiler
ECS/dependency/threading migration. This is engineering judgment about the
acceptance work, not a measured percentage of lines, elapsed time, or core
utilization. The journal's November 22 weighted audit estimated 78/100, rounded
to 80; the subsequent body-continuation and local-capture milestones improve
that baseline. Do not turn this range into an almost-finished or speedup claim.

The major published milestones relevant to this chain are:

| Source milestone | Implemented behavior |
| --- | --- |
| `6850468` | Resumable evaluation and declaration phase pumps; focused native query checks. |
| `49d75be` | Persistent body/lowering pumps and cross-phase continuation work. |
| `bf2a3e8` | Shared finite dispatcher, retained structural body preparations, and deferred-expression resumption. |
| `ecc4333` | Lazy threaded lexical binding proofs and immutable local captures in integer type arguments, including nested `comptime`. |

This checkpoint adds an **interpreter call-suspension primitive**, moves its
ordinary-Foundation fixture into interpreter compilation units, and reuses the
shared dispatcher for generic-body clone batches. The transport loop is shared;
only the typed projection from each job component to its kernel is generic.
There is no added queue allocation or new thread pool.

The primitive is deliberately separate from a production compiler producer.
`IMContext.call_inputs` supplies an optional component kind. An executed ordinary
call can return `waiting_call`, retain its finish task and cached arguments, and
resume after its `IMCallInput` becomes ready. It does not check or lower a body
on an interpreter worker. **Production type-argument evaluation does not yet
install this service**, so executed helper calls in those expressions still
receive the existing unsupported-staging diagnostic. Ordinary supported
compile-time calls elsewhere are not a new feature of this checkpoint.

An attempted producer integration was removed from the release candidate after
the public predecessor exceeded its semantic component budget. It was never
validated end to end and must not be described as implemented. Its design and
specific unresolved problems are preserved below. There is no hidden private
bootstrap prerequisite, dormant experimental producer, or separate constant
folder in this checkpoint.

## What is already real

### Shared entities, storage, and ownership

Syntax, parse metadata, Foundation operations, and semantic metadata use
world-owned entities/components. The store has stable payload storage and dense
archetype row/component-pointer columns, with sparse/derived indexes where
appropriate. This does not mean every payload is packed SoA or every traversal
is a table query. Neither condition should become a cosmetic completion gate.

Workers receive immutable published inputs and own their scratch, diagnostics,
interpreter state, and staged output. Structural writes and shared-index changes
publish after joins. Views pin input lifetimes; leases/access declarations govern
mutation. A pinned view is not a payload lock. Generic clone batches retain their
existing memory budget and acquire queued stage ownership before the last input
view closes.

### Queries and worker execution

`library/work_graph.tower` provides demand, dependency edges, suspension,
resumption, cycle discovery, access ranges, cancellation, and stale
revision/profile/dispatch-ticket rejection. Declaration, expression, array/type
construction, layout, body checking, lowering, flow, known-value analysis, and
evaluation have worker/query paths. Parser table construction has parallel
subsystems too. Native CLI unit compilation uses the production unit services,
with isolated frontend worlds and backend contexts.

`SemanticPumpResult` distinguishes progress, waiting, completion, and failure.
A phase with no ready task can yield to another producer without inventing a
cycle. Body continuations retain lexical state and structural preparation state;
they do not replay checked statements when a dependency completes. Bounded
source windows are independent of worker count and can admit later producers
while an earlier body waits.

This is useful threading, but the lifecycle still contains phase barriers.
`semantic_lifecycle.tower` calls checking, defer hygiene, known inference,
lowering, evaluation, attributes, known-value publication, module initialization,
and flow processing in order. Having worker paths inside those phases does not
make the entire lifecycle one fully interleaved scheduler.

### `decltype`, staging, and inferred values

Unevaluated type queries and computed integer type arguments use the shared
semantic model. Lazy lexical proof jobs are requested only when a type expression
needs a local binding; they are not an eager scan of every function. Facts attach
to the original declaration identity. Lexical shadowing, writes, address escapes,
deferred writes, and loop updates participate in the proof.

Immutability and known value are independent facts. Eligible captured initializers
become ordinary interpreter jobs. Executed reads demand their producers; merely
mentioning a capture in an untaken branch does not force its value or create a
cycle. Nested explicit stage expressions retain the same behavior. Snapshot
receipts protect inferred initializers before runtime lowering changes them.

No pre-LLVM arithmetic folding implementation was introduced. Known-value
execution uses the ordinary Tower interpreter and its target/semantic contract.
This remains a hard requirement for future inference and specialization.

## Immediate next milestone: executed helpers in integer type arguments

Start here before broad legacy-adapter cleanup or another feature.

### 1. Remove the bootstrap unit-size bottleneck

The checked-in predecessor currently allows 128 MiB of Foundation semantic
components. This is a resource policy, not total process memory or a language
limit. The attempted helper producer pushed `compiler/units/semantics_checks.tower`
past that policy. Initial failure appeared in `tests/semantic_world.tower`; after
moving the new interpreter-only fixture, it appeared in generated vector code.
The location is where the allowance runs out, not proof of a bug in that function.

Moving an implementation to another file does not partition its transitive import
closure. Importing the same semantic implementation into two object units also
duplicates exported definitions; that failure already occurred earlier in this
chain. Audit the object and browser compiler-project manifests before splitting.

Prefer a genuine boundary between production semantic code and test construction,
or another existing unit boundary with a narrow exported interface. Keep shared
types in one authoritative Tower definition; do not copy `SemanticContext` or
component layouts into a test ABI. Retain meaningful scheduler coverage. The
interpreter-only fixture separation in this checkpoint is a useful small step,
but did not by itself make the experimental producer fit.

If a larger-budget successor is actually needed, build it using the public
predecessor and publish its complete executable/resources with hashes/provenance
through the documented bootstrap path before relying on it. Then repeat a clean
build without a private bootstrap override. A local cache binary is insufficient.
Do not silently alter tests to use a private compiler.

### 2. Add a function-owned executable-readiness query

The intended dependency path is:

```text
integer type argument
  -> ordinary evaluation (suspends at an executed call)
  -> staged executable snapshot of the called function
  -> checked body
  -> signature / lexical expression / layout / other value queries
```

Use a component on the original function entity for the work ticket, stage,
source ordinal, snapshot handle, diagnostic, query-read log, and evaluation
aliases. Register its readiness in `IMCallInput`. The graph owns scheduling;
the component owns continuation/result state. Do not add another semantic graph.

The consumer may request a Body identity before body admission. Admission must
attach the producer to that existing Building query instead of treating every
existing query as completed work. Request only bodies needed by executed calls
for early stages; an untaken branch must not acquire an evaluation dependency.
Keep ordinary runtime reachability requirements distinct from early staged demand.

### 3. Prepare a canonical executable snapshot

Preserve the checked source body for later binding proofs and runtime lowering.
Clone its ordinary Foundation nodes into a worker-owned stage, remap parameter
and local declaration identities, assign independent frame slots, and invoke the
existing aggregate, expression, and defer lowering. Publish all stages after
joining, then publish call-input readiness. Query/read observations and nested
evaluation aliases publish on the coordinator too.

The attempted implementation used `sem_defer_clone`, a shared clone map, ordinary
aggregate metadata, `sem_lift_block`, and `sem_defer_depth`. Reuse is plausible,
but this combination was **not executed successfully**. Verify that every helper
is valid before the normal lowering phase and only mutates the private snapshot.
Do not assume existing phase-local helpers are safe at an earlier lifecycle point.

Particular care is needed for aggregate parameters/returns and indirect function
calls. The source function identity/signature must remain suitable for type and
function-reference checks while execution selects the lowered snapshot. Do not
rewrite shared callback/type metadata on a worker. A derived executable snapshot
is allowed; an independent public IR or instruction ABI is not.

### 4. Interleave producers through the pumps

When declaration/evaluation work waits on a body, service ready body, binding
proof, layout, and executable-preparation work on the same graph. Preserve the
caller's declaration-subject list, `declaration_isolated`, lexical ownership,
and any early-demand policy across each pump. A pump must return with no active
worker borrow. Avoid recursive phase draining and worker-blocking waits.

Do not simply delete whole-body/proof/lowering prerequisites. Replace each with
a narrower readiness proof that protects the data actually read. Likewise,
guarding every `sem_layout_all` call with an early-mode flag is insufficient:
layout admission must wait for field declarations, and `layout_checked` must not
skip pending types. Existing helpers can diagnose cycles prematurely when called
outside the phase in which they were designed.

Retain failed body diagnostics on the producing receipt until the owning consumer
selects them in source order. The attempted integration could let an early helper
error escape through the coordinator's program error, or lose it when body work
was cleared. Extend dependency-failure traversal and cleanup deliberately.

Finally, separate early demand from normal body completion/pruning. Restarting a
completed admission cursor must not recheck completed functions. Normal checking
must still visit required non-generic bodies and collect root operations added
after early staging. Do not prune a signature-only instance before a later
executed dependency can demand it.

### 5. Validate this feature at its actual boundaries

Use the existing Tower fixtures and focused runners. Add coverage for:

- A callee unavailable across repeated interpreter attempts; argument mutation
  occurs exactly once. The primitive fixture in this checkpoint covers this.
- A distinct published snapshot and failed publication (primitive fixture), plus
  an indirect callee through the production producer once implemented.
- Nested helper calls and mutable local computation inside the staged invocation.
- An immutable captured initializer that calls a helper and feeds an array extent.
- Generic helpers and aggregate arguments/returns using the ordinary ABI lowering.
- A helper that needs a local type query/proof/layout before its body can finish.
- A true body/type/value cycle; a noncyclic unfinished producer; an untaken branch
  containing an unsupported call or invalid capture.
- Cancellation while waiting, discarded/published stage ownership, and cleanup
  of interpreter frames, aliases, diagnostics, and input views.
- Canonical output and source-ordered diagnostics at 1/2/4/8 workers, both target
  pointer widths, and real overlap. Queue width alone is not overlap evidence.

For the future end-to-end fixture, the attempted cases included
`u8[combine(increment(&count), increment(&count))]` inside an ordinary helper,
`u8[identity(i32, 3)]`, an aggregate extent helper, and an indirect callback.
Those cases were removed from the passing suite with the unvalidated integration;
they are acceptance ideas, not current supported syntax/behavior claims.

## Remaining chain after helper readiness

1. **Module-level captures and initialization/effect proofs.** Extend lazy proofs
   beyond function-local bindings. Account for module order, aliases, writes,
   escapes, and effects across calls. A global's unchanged spelling or an
   initializer literal alone does not establish a reusable compile-time value.
   Keep executed dependency discovery and ordinary interpreter evaluation.
2. **Lifecycle integration.** Replace remaining whole-phase barriers where
   narrower receipts permit useful overlap. Separate admission, execution,
   deterministic publication, and quiescent diagnostics. Preserve the lexical
   continuations already implemented; do not rewrite them into another scheduler.
3. **Explicit world/session coverage.** Audit legacy entry points in `host_world`,
   `frontend_world`, `frontend_modules`, `execution_session`, backend
   `source_session`, and `host/legacy`. Keep explicit production APIs and narrowly
   scoped compatibility adapters. Do not share mutable default-world state just
   because its implementation is Tower.
4. **Shared imports and revision reuse.** Unit workers currently isolate worlds
   and import caches. Reuse across units/revisions needs immutable ownership,
   grammar/source/target/policy identities, dependency invalidation, and lifetime
   cleanup. Stale-ticket checks are not a persistent semantic cache. Preserve
   lexical module identity and grammar import/update order.
5. **Measure representative scaling.** Compare serial and 1/2/4/8-worker runs on
   body-heavy, parser-heavy, multi-unit/import-heavy, and staging-heavy inputs.
   Record total time, useful overlap, total work, peak live storage, and the
   remaining critical path. Improve the measured bottleneck. Small programs and
   dependent chains will not saturate all cores merely because storage is ECS.

Ordered grammar changes, effects, type interning, and short publication sections
can legitimately remain serialized. Completion means independent eligible work
can run safely, dependencies are explicit and resumable, and results are
deterministic—not that every loop runs on multiple threads.

## Development and publication instructions

- Work on `main`; pull/rebase before work and after committing. Preserve others'
  changes. Do not edit `todo.txt` or introduce new C++/Python/JavaScript logic.
- Freeze the compiler import closure while a build or compiler-project package
  is reading it. Reap a failed build before editing/restarting. Concurrent Ninja
  processes in one cache and truncating their shared log obscure failures.
- Compile the smallest changed Tower unit first. Use `query-smoke` for scheduler
  continuations, `type-smoke` for type/query changes, and `control-smoke` for
  lexical control changes. Reuse passing unaffected evidence.
- Run the complete public-bootstrap/native/browser/generation publication checks
  once per coherent milestone. Do not repeatedly restart them for each handler.
  Follow [AGENTS.md](../AGENTS.md#validation-and-performance) for profiling and
  final supported memory/race sanitization; the 2026-11-22 policy audit supersedes
  this handoff's former sanitizer prohibition. No repository-wide formatting or
  broad cleanup sweeps.
- Keep runtime build identity distinct from documentation publication identity.
  Documentation-only deploys reuse verified assets. Preserve concurrent manifest
  receipts; if a newer manifest appears, compare assets/build identity before
  adopting it. Do not call an exact-manifest mismatch a passing verification.
- Publish and verify the hosted result, then leave a clean tree and update this
  report/journal with the actual source/deployment identities and test outcomes.

The current development cache is container-local at
`/tmp/tower-home/.cache/tower/ecs-local-query-new-pin` in `tower-parser-retirement`.
`cmake --build` does not copy the executable into `build/native`; the documented
`playground/scripts/build-native.sh` does. Do not infer a current `build/native`
binary from a successful cache build. The public Linux x64 bootstrap is a
platform-specific development bootstrap, not a portable compiler release.

## Future direction that must not expand this checkpoint

Stronghold should eventually enforce ownership/access and initialization policy
over the shared nodes and ECS contracts. Tower retains explicit low-level options;
do not impose universal safe-handle overhead now. Safe handles, pinned views,
borrow scopes, and non-ECS owned allocation need a separately specified memory
model. Null-only race behavior does not by itself prove memory safety.

Compile-time parser/regex tables and ordinary interpreter-produced constants are
motivating future workloads. LLVM can optimize known data and inline eligible
code, but constant tables do not make the input stream known, guarantee full
loop unrolling, or guarantee the fastest possible DFA. Preserve that distinction.
Explicit compile-time code generation may coexist with inferred staging, with
portable interpretation and explicit effects/target/cache identities. Do not
introduce a separate pre-LLVM folding evaluator to chase that goal.

## Validation and publication receipt

The previous local-capture release `ecc4333` passed the public-bootstrap native
build and successor proof-unit compilation, native type/query checks, all three
real-browser worker checks, and two identical edited browser compiler generations.
Its native SHA-256 is
`7343162d925e0abe9a1449f5cf42028e84b30a46bb6cd53060e9284275658d68`;
project SHA-256 is
`b3a0e80ac402f1cc18c98a57bf73bc30d83c681b4d40ba20cba15f1ab2b92cfb`.
Hosted verification passed all 104 assets and desktop/mobile checks after adopting
a concurrently published documentation manifest with identical runtime identity.

Checkpoint-specific validation and deployment receipts are appended below only
after those steps complete. Failed experimental evidence remains in local
`build/language-next-audit/staged-bodies-*.log`; those ignored logs are not release
artifacts and are not guaranteed to exist in another checkout.

The checkpoint's runtime source is
`b5bc8173899d2f5daa618d9f181cdfd2902468ab`, rebased onto `9d84f04`'s verified
Bedrock/import/inspection changes. Its scaffolding tree is
`4946ca80ae2e85232c51f885e62c3201c19bc5c6`.

| Check | Result |
| --- | --- |
| Documented native build after source rebase | Pass with the private bootstrap override unset. |
| Successor compiles `semantic_binding_proofs.tower` to LLVM | Pass. |
| Native query-smoke and type-smoke | Pass, including serial/worker and 32/64-bit profiles. |
| Browser worker suite | 3/3 pass, zero skips; overlap, failure interruption, and 1/2/4/8-worker determinism. |
| Edited browser compiler generations | Both pass, with identical bytes and edited semantic behavior. |
| Reused target support | All seven hashes match upstream Pages `b40bb38`. |

The first target-pack comparison found four stale local files. Restore the exact
verified upstream files before regenerating compressed assets and their manifest;
do not represent that first comparison as passing. The runtime implementation was
not changed by this checkpoint. The resulting bundle contains all 104 assets.

Native compiler SHA-256:
`142459861bd0f5eecec96891cbf5d6d035f131e387408eabab31276883afb92a`.
Compiler-project SHA-256:
`406a401a9af04b7d0f1be8e1a7603c2317d6c4528bad0c7b606f284aa6d6c112`.
The browser/runtime build used predecessor
`18664657c3ff9142a6d59bef8ffa794fd10d12313d55f91dd47f5575141a29f9`.

Identical edited generation outputs:

| Reactor | Bytes | SHA-256 |
| --- | ---: | --- |
| Tower | 1,383,764 | `200e867b73aaa8437126cb1f7f8b153e6995649842e73ee2afcd695c76bf8a47` |
| LLVM | 35,179,281 | `3e2effc4b43f1fa2b2d8df615038cd312cc6f39f393ef273f2d4efaa68a93545` |
| Cross | 56,323,462 | `ab8bd1351e645c970a844b96619631712c8e0260d46b7767756457d3d25c5a8c` |

Local evidence is under `build/language-next-audit/staging-checkpoint-*`:
`rebased-native.log`, `rebased-successor.log`, `rebased-query.log`,
`rebased-types.log`, `browser-build.log`, `browser-workers.log`, `generations.log`,
`workbench/generation1.json`, `workbench/generation2.json`, and `targets.sha256`.
Hosted publication is recorded separately after deployment verification.

The final source rebase incorporates `60a276e`'s IDE-fixture migration and changes
the checkpoint commit to `f494e22042172ebd72ddffff8051ec0128029899`. Its scaffolding
tree is `6e3234202311e435df01ec2120389cde1e68ef6d`. The added/changed IDE fixtures
are absent from the compiler-project recipe; compiler/runtime, grammar, library,
backend, build-tool, and browser asset sources are unchanged from the frozen
build above. Repeat the documented native build and successor proof-unit compile
after this rebase: both pass, and the native compiler hash remains identical.
Reuse the unaffected browser/generation results and record the source equivalence
explicitly in the deployment manifest. Preserve upstream Pages `3937cad`'s
additional IDE-migration receipt and its unchanged target assets.

## Publication and later upstream integration

The final documentation-only rebase produced implementation commit
`cf47b568f34c39249aee8e4377d47a1c3fbeddd0` and report commit
`d51164fd60f8dd06806a5c21f57602f2bf717a0b`. Both were pushed atomically with Pages
`f1a5dd372f80d86580ad6cafa24b96ba6cbe83ea`; workflow
[45048091240](https://github.com/TrevorSundberg/tower/actions/runs/45048091240)
succeeded. The first attempted atomic push was rejected by a concurrent main
update; it published neither ref. It was rebased and retried normally.

The hosted asset check passed, but the first UI run timed out waiting five
seconds for contextual completion. An unchanged retry passed the complete desktop
checks and hit the same deadline on mobile. The language service already permits
ten-second queries, so `verify-deployment.mjs` now gives its completion-popup
assertions the same named 60-second deadline used for asynchronous compiler
responses elsewhere in that verifier. Expected counts, labels, and typed filtering
are unchanged. This is a browser validation-boundary adjustment, not a compiler
implementation or removal of a check. Keep both initial failure logs.

Concurrent publications then changed the increment example and its documentation
receipt. Compare the manifests: only `increment.tower` changed among the 104
assets, while the compiler/project/runtime identities stayed at `cf47b56`.
Preserve that published example and the newer manifest instead of overwriting
them or accepting a mismatched manifest. The exact current manifest used for the
final hosted run has SHA-256
`2264cdbfd0dc671a4404f3971be5e4552a80f3fc24267a72dff181bdadeb46f8`.

Upstream also merged the separate hosted-linker/bootstrap milestone through
`8c51600fa6160e81aa2e7efd60bbebcd7b1be39d`. The repository's **current** public
Linux x64 bootstrap now hashes to
`c59e8bab69340cfcea7f03e3fa081b339dcf12230e84fd0c51870eb766551a75`.
A fresh documented native build with the private override unset and its successor
proof-unit compilation both pass after this integration. That native executable
hashes to `f51533b17340518e00b2f5ae1f000445280df77c227770aafb7d20f19d4c3098`.
Evidence: `staging-checkpoint-linker-rebase-native.log` and
`staging-checkpoint-linker-rebase-successor.log`. This is native rebase validation;
it does not relabel the already published browser artifacts as a new linker build.

Before resuming the helper-body experiment, test the current public pin and its
unit budget again. The earlier budget failure was measured with the older
predecessor; it remains evidence of the attempted integration's failure, not a
claim that every later bootstrap must hit exactly the same limit/location.
