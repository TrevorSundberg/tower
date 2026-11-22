# Temporal opcode validation artifacts

Historical research: the C/C++ experiment and its native-only build/check helpers were retired on 2026-11-21. Sources and reproduction commands remain available at [revision abf427e](https://github.com/TrevorSundberg/tower/tree/abf427ed2b3073cac31fafb3c4cb8ff590064d3f/docs/research). The descriptions and recorded measurements below are historical; they are not linked into the current compiler.

The [native LLVM experiment](native-temporal/README.md) now adds compiled x64
write tracking, selective past-input repair, snapshot/undo comparisons, and a
file-backed history that can be reopened in another process. Its
[storage model and measured costs](temporal-native-model.md) cover game rollback
and long-lived editor histories. This is a fixed-shape, aligned-word, region-level
subset of the current API, not the full dynamic core running natively.

The current core is the [ten-operation API](temporal-core-api.md), its
[complete commented C declarations](https://github.com/TrevorSundberg/tower/blob/abf427ed2b3073cac31fafb3c4cb8ff590064d3f/docs/research/temporal-core.h), and its
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
| [Native proof and benchmark](native-temporal/README.md) | Real LLVM objects, agreed C API subset, all generated state stores tracked, fixed-shape region repair, independent historical-value oracle and disk remapping. |
| [Native model and measurements](temporal-native-model.md) | Concrete arena layout, read/write tradeoffs, raw performance evidence, retention and cold-history design; no universal minimum-overhead claim. |
| [Current C declarations](https://github.com/TrevorSundberg/tower/blob/abf427ed2b3073cac31fafb3c4cb8ff590064d3f/docs/research/temporal-core.h) | Five compiler memory/lifetime intrinsics first; ten non-convenience user operations. |
| [Current core contract](temporal-core-api.md) | Explicit storage ownership, execution entry, stable Points, source capture and historical lifetime rules. |
| [Current runtime](temporal-core-runtime.mjs) | One numeric address space, allocation identities, automatic ordinary opcode tracking and atomic subtree replay. |
| [Current validation](temporal-core-validation.mjs) | Original calculations and seeded corrections compared to independent fresh numerical results, including three levels of controllers. |
| [Current adversarial tests](temporal-core-adversarial.mjs) | Attempts to break ordering, pointers, ownership, lifetimes, source capture, handles and nested atomicity. |
| [Current declaration checks](https://github.com/TrevorSundberg/tower/blob/abf427ed2b3073cac31fafb3c4cb8ff590064d3f/docs/research/temporal-core-surface.mjs) | C-header names/arguments/order checked against actual methods; not native compilation. |
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
not prove a general optimized dynamic/native engine. The native experiment has
the narrower scope described above and does not close the following obligations.
Source-level C/LLVM lowering, physical reclamation/address recycling, external
effects, arbitrary live-linked independent histories and self-edit resumption
remain outside these executable models. The current core models historical
allocation/free with reserved addresses; this is not a native allocator result.
Closed-owned recursively controlled histories are covered; they are not equivalent
to arbitrary shared mutable clocks. All results and discovered defects are retained in the
[research journal](../temporal-opcode-research-journal.md).

## Replacement composition experiment

This separate bounded model was retired on 2026-11-22; it was never part of the
production expander or the temporal models retained above. Its
[implementation](https://github.com/TrevorSundberg/tower/blob/cf6b2049c40df5fb0df4fca892a699098c43ba97/docs/research/replacement-shortcuts.mjs)
and [tests](https://github.com/TrevorSundberg/tower/blob/cf6b2049c40df5fb0df4fca892a699098c43ba97/docs/research/replacement-shortcuts.test.mjs)
remain available in Git history. The experiment compared guarded rule-chain
composition with an independent expander and examined rule edits, effects, cycles,
precedence and conflicts. The journal's 2026-11-16 entry retains the literature,
soundness conditions, operation counts and omitted semantics. Reproduction uses
that archived checkout and its matching WASM parser; these results do not establish
an optimization guarantee for the current Tower implementation.
