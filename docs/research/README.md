# Temporal opcode validation artifacts

The current core is the [ten-operation API](temporal-core-api.md), its
[complete commented C declarations](temporal-core.h), and its
[runnable example](temporal-core-example.mjs). Compiler intrinsics come first
and are separate from user operations. The executable model registers actual
numeric-address globals and tracks allocation/free ownership and lifetimes;
it no longer relies on a hidden owner-carrying Address helper. It uses full replay,
not an optimized incremental scheduler or native implementation.

The [earlier byte API](temporal-byte-api.md) and
[nested-history contract](temporal-nested-api.md) remain preserved experiments.
Their public append-write operation and publication-expiring point lookup are
not part of the current ten-operation interface.

The earlier author-facing deliverable is [the single-history C-like proposal](temporal-c-api.md).
Its [full worked examples](temporal-c-examples.md) translate the original
temporal-opcode calculations using that same minimal interface.
These are general-purpose instruction/raw-memory experiments, not application
object graphs. The [original concept](../temporal-opcode.md) is unchanged.

Run all retained tests (Node.js, no dependencies):

```powershell
node docs/research/temporal-validation-all.mjs
```

## Which artifact establishes what

| Artifact | Purpose and limit |
| --- | --- |
| [Current C declarations](temporal-core.h) | Five compiler memory/lifetime intrinsics first; ten non-convenience user operations. |
| [Current core contract](temporal-core-api.md) | Explicit storage ownership, execution entry, stable Points, source capture and historical lifetime rules. |
| [Current runtime](temporal-core-runtime.mjs) | One numeric address space, allocation identities, automatic ordinary opcode tracking and atomic subtree replay. |
| [Current validation](temporal-core-validation.mjs) | Original calculations and seeded corrections compared to independent fresh numerical results, including three levels of controllers. |
| [Current adversarial tests](temporal-core-adversarial.mjs) | Attempts to break ordering, pointers, ownership, lifetimes, source capture, handles and nested atomicity. |
| [Current declaration checks](temporal-core-surface.mjs) | C-header names/arguments/order checked against actual methods; not native compilation. |
| [Current mutation tests](temporal-core-mutations.mjs) | Intentionally corrupt actual runtime source in memory; only behavioral assertion failures count as detections. |
| [Current runnable examples](temporal-core-example.mjs) | Separate globals, ordinary stores and stable historical points; accompanying C source is illustrative. |
| [Earlier byte core API](temporal-byte-api.md) | Source pointer and byte count; untyped Write, fixed-extent replacement; owner-carrying fake addresses. |
| [Byte validation](temporal-byte-validation.mjs) | Independent byte replay and nested source-copy equivalence, including recorded source reads. |
| [Byte adversarial tests](temporal-byte-adversarial.mjs) | Arbitrary extents, aliases/overlap, malformed sources, ownership and snapshot capture. |
| [Nested-history API and contract](temporal-nested-api.md) | Commented C-like spelling of implemented methods, null-root semantics and recursively owned histories. |
| [Nested runtime](temporal-nested-api.mjs) | Real API called by host and lowered opcodes; full private subtree replay with atomic publication. |
| [Nested example](temporal-nested-example.mjs) | Runnable parent loop correction: two child increments become one, not three. |
| [Nested validation](temporal-nested-validation.mjs) | Numerical memory trees compared against a separately implemented fresh interpreter. |
| [Nested independent reference](temporal-nested-reference.mjs) | No runtime imports; numerical tree oracle, not public identity or exact fuel-accounting oracle. |
| [Nested adversarial tests](temporal-nested-adversarial.mjs) | Ownership, failures, all statuses, stale handles, retained arguments and ancestor atomicity. |
| [Nested mutation tests](temporal-nested-mutations.mjs) | Selected intentional runtime defects must be caught by executable tests. |
| [Nested signature/value checks](temporal-nested-surface-validation.mjs) | Exact method arities, typed by-value capture, ownership inference, ordering and handle lifetimes. |
| [C-like API](temporal-c-api.md) | Small proposed language surface and control behavior; syntax is not an implemented compiler feature. |
| [Model contract](temporal-model-contract.md) | Exact bounded opcodes, historical byte-memory semantics, edits, identities and failure policy. |
| [Proof review](temporal-api-proof-review.md) | Conditional induction argument and remaining obligations; not machine-checked. |
| [API model](temporal-api-model.mjs) | Dynamic branches/loops/calls, byte overlap, private candidate repair and opcode-result cache. Reconstructs/scans full history. |
| [Minimal typed surface](temporal-minimal-api.mjs) | Compiler-operand/typed-to-byte mapping experiment. One by-value write form; handles are values and history is implicit. Harness bindings are not language APIs. |
| [Minimal surface validation](temporal-minimal-validation.mjs) | Typed literals/temporaries, pointer values, byte overlap, narrowing, atomic batches and implicit-context ownership against independent replay. |
| [Original worked-example validation](temporal-original-examples-validation.mjs) | Seven direct translations/contrasts from the proposal, including expected outputs, byte producers and reusable temporary results. |
| [Independent reference](temporal-api-reference.mjs) | Fresh full execution, separately implemented with explicit frames; no cache or model helpers. |
| [Differential suite](temporal-api-validation.mjs) | Independently retained input histories; directed, finite exhaustive and seeded randomized comparisons. |
| [Adversarial suite](temporal-api-adversarial.mjs) | Memory, handles, cancellation, orphaned anchors, trapping, alias escape, nested/recursive calls. |
| [Boundary regressions](temporal-api-breaks.mjs) | Reproductions of actual discovered byte-buffer alias defects. |
| [Mutation suite](temporal-api-mutations.mjs) | Deliberately breaks actual implementations in memory and requires tests to reject those variants. Does not modify repository files. |
| [Earlier selective scheduler](temporal-memory-validation.mjs) | Genuine dirty queue and memory subscriptions, but fixed instruction universe and integer cells rather than overlapping byte memory. |

The engines validate different pieces. Combining their passing reports does
not prove an optimized dynamic/native engine that has not been implemented.
Source-level C/LLVM lowering, physical reclamation/address recycling, external
effects, arbitrary live-linked independent histories and self-edit resumption
remain outside these executable models. The current core models historical
allocation/free with reserved addresses; this is not a native allocator result.
Closed-owned recursively controlled histories are covered; they are not equivalent
to arbitrary shared mutable clocks. All results and discovered defects are retained in the
[research journal](../temporal-opcode-research-journal.md).
