# Temporal opcode research journal

Started: 2026-09-05. Last updated: 2026-11-15.

**Scope clarification from the author: Tower is a GENERAL-PURPOSE programming language. Games are an example application, not the language's intended scope. Its compiler is another intended application. Entry 14 corrects the earlier overemphasis on a game-product gap; general-purpose native incremental languages, especially CEAL, are direct comparisons.**

**Competition clarification: direct technical prior art is not the same as active product competition. CEAL's public repository and the three visible forks checked remain at a December 2011 commit. Entry 15 classifies it as dormant public research code, not an established maintained alternative to Tower.**

Status: literature and implementation-source review, bounded executable semantic models, and a restricted native LLVM selective-repair experiment (2026-10-15). No production temporal runtime, general LLVM temporal implementation, or representative compiler/game benchmark has been established. Published results, repository observations, experiments, and subsequent design proposals are distinguished below. This journal records the current assessment; it does not replace the original [temporal-opcode proposal](temporal-opcode.md). Entries 8–9 address the author's correction of the earlier framing and record the deeper validation.

Entries 10–11 add a broad language/runtime/product landscape scan and a recommendation about pursuing Tower. The scan found substantial native prior art and adjacent products, but no documented maintained game product establishing the complete proposed historical instruction/memory repair capability. That is a bounded research finding, not proof of absence.

Entry 12 continues that scan with current compiler/build evidence, a closer distinction between historical repair and bounded-history operation, and additional graphics and 2026 systems. Entry 13 turns the performance question into a concrete break-even test and separates technical opportunity from unverified adoption claims. The original proposal remains unchanged.

## Research question and constraints

Can Tower automatically retain execution history and, when an earlier input changes, repair only the affected computation while producing exactly the result of a complete replay?

This question concerns a general-purpose language's opcode/memory execution model. It does not assume application-specific runtime concepts. The game below supplies a concrete motivating workload, not a restriction on the language or the research question.

The motivating game, as described by its author:

- Clients simulate the entire world deterministically using integer arithmetic.
- The server distributes authoritative player inputs without simulating world state. Inputs are packed into approximately seven bytes per player input.
- Local inputs are known; remote inputs are predicted for a limited interval. Incorrect predictions require historical correction.
- Whole-world replay currently preserves exact agreement, but many lasers and colliders make it expensive.
- A desired improvement is to recompute the consequences of a corrected remote input while retaining unrelated players, objects, and calculations.
- Tower may use plain components and checked handles in an ECS-style storage model, including for its compiler and AST.
- The intended implementation is LLVM initially, or a custom opcode representation, with native-level performance as a goal. An interpreted prototype alone would not establish that goal.
- Dependency maintenance should ideally be automatic for Tower programmers.

These game characteristics are user-provided context, not independently measured in this repository. ECS storage and LLVM lowering are candidate directions, not decisions already implemented.

## Current assessment

The idea has merit. Its closest research area is **self-adjusting computation**, within incremental computation. Exact selective replay has a sound basis: reuse is valid when the runtime establishes that the reused computation still has the same relevant inputs and effects. The research term **from-scratch consistency** describes agreement with complete reevaluation. Implemented systems have established this property for their supported languages. [Self-Adjusting Stack Machines](https://arxiv.org/abs/1108.3265)

The butterfly effect requires following every relevant consequence of an input change. It does not require recomputing independent work. However, the affected region can become the entire world, and a sound implementation may conservatively recompute more than the theoretical minimum.

The runtime under investigation operates on dynamic instruction instances, memory addresses/ranges, historical versions, and execution order. It does not require knowledge of entities, components, spatial queries, or other application concepts. Complete tracking makes dependencies automatic; program authors influence efficiency through their ordinary algorithms and memory access patterns.

Native compilation is a plausible implementation strategy. Near-uninstrumented execution speed is a separate, unproven performance goal. Fine-grained arithmetic dependencies can be compiled into repair code and shared static descriptions; they do not require a separately allocated runtime graph object for every arithmetic instruction. Larger reusable regions are an optional performance tradeoff, not a prerequisite for correctness or native compilation. This corrects the earlier assessment's excessive emphasis on semantic replay units.

| Question | Current answer | Evidence level |
| --- | --- | --- |
| Can selective recomputation preserve exact results? | Yes, under a complete deterministic execution and dependency model. | Established for related research systems; Tower still needs its own correctness argument. |
| Can the input-only networking model remain? | Yes; selective reuse can be a local execution optimization. | Design inference, assuming all clients retain the same simulation semantics. |
| Can it run as native machine code? | Yes; it does not inherently require interpretation. | Compiler/runtime precedent and LLVM capabilities. |
| Will it be faster for this game? | Plausible when corrections affect little expensive work; currently unknown. | Requires representative game measurements. |
| Does ECS provide the temporal machinery? | It provides useful structure, but history, dependency tracking, and replay remain additional work. | Design analysis informed by Bevy's documented model. |
| Can programmers ignore it completely? | Automatic correctness is plausible within supported semantics; performance remains sensitive to program structure. | Research precedent plus engineering inference. |

## 2026-09-05 — Entry 1: Connection to existing Tower work

The original proposal already identifies several essential mechanisms:

- Its store example correctly distinguishes a memory location from a particular version of that location. An unconditional overwrite can cut the dependency on earlier contents.
- Its time-point equivalence example describes stopping propagation when a recomputed result is unchanged.
- Its allocator section correctly notices that inserting an allocation can shift unrelated addresses and create widespread downstream changes.
- Its external-call sections identify the boundary between reversible internal state and observable external effects.

Some relevant earlier notes in [todo.txt](../todo.txt), with line numbers as observed during this investigation:

| Location | Observation | Relevance |
| --- | --- | --- |
| Lines 593–603 | Record nodes traversed by a lookup, including the last existing node when a requested child is missing. | Already anticipates tracking absence, a key requirement for spatial queries. |
| Lines 6716–6757 | Explore speculative transactions, recorded reads/writes, conflict validation, and copy-on-write. | Related machinery, though transaction retry alone does not provide historical selective replay. |
| Lines 6920–6930 | Express concern about instrumenting every write. | Directly relevant to the native-performance requirement. |
| Lines 7282–7285 | Recompute dependencies after replacing a subtree, with early stopping. | Compiler-side version of the same change-propagation idea. |
| Lines 8258–8267 | Compute LLVM/Wasm/SPIR-V components on demand with automatic invalidation. | Natural candidate for semantic query caching. |

The current [node implementation](../scaffolding/tower.cpp) is a component tree with raw pointers, reference counts, per-node vectors, and separate allocations. `TowerNode` appears around line 239; node creation assigns a global incrementing ID around line 322; component lookup scans the owner's component vector around line 506. The [public API](../scaffolding/tower.hpp) already exposes nodes and components, but the inspected scaffolding is not an archetype ECS or a temporal runtime. This makes ECS-backed AST storage a continuation of existing concepts, with implementation work still needed.

## 2026-09-05 — Entry 2: Closest published work

### Self-adjusting computation for imperative programs

[Self-Adjusting Stack Machines, OOPSLA 2011](https://arxiv.org/pdf/1108.3265), by Hammer, Neis, Chen, and Acar, is the closest match found. It presents a low-level intermediate language, mutable memory, dynamic execution traces, and a compiler/runtime that reuses, reevaluates, or discards traced work. It handles historical memory operations and control structure; ordinary SSA dataflow alone is insufficient. Update-point insertion is automated, while memoization-point placement involves programmer choices.

Table 2 reports initial traced execution taking **3.4–18.4 times** conventional C across its tested algorithms. Small changes then obtain large update speedups. These are historical algorithm benchmarks, not measurements of a game or predictions of Tower's overhead. The relevant evidence is both feasibility and the substantial cost that tracing can introduce.

### Stable identity across changed executions

[Incremental Computation with Names / Nominal Adapton, OOPSLA 2015](https://arxiv.org/abs/1503.07792) makes names identify reusable allocations and computations across runs. Its named structure addresses a close relative of the proposal's `malloc` problem. It also demonstrates an incremental interpreter for an imperative language, showing how incrementality can be inherited from an implementation layer.

Names provide an optional mechanism for preserving identity across edits. A fully tracked deterministic allocator already works correctly by replaying its reads, writes, and returned addresses, even when a correction changes later addresses widely. Naming can improve reuse but is not needed to make the raw-memory model correct. If Tower adopts special allocation names, it must define their semantics, particularly when numerical pointer values are observable. Source-level application identifiers are one optional strategy and need not be built into the temporal runtime.

### Granularity and parallel execution

[Efficient Parallel Self-Adjusting Computation, SPAA 2021](https://www.cs.cmu.edu/~blelloch/papers/3409964.3461799.pdf) tracks control and data dependencies for nested parallel programs. Its C++ library requires explicit primitives and restricts each tracked modifiable to one write per run; local variables are less restricted. It is not a drop-in arbitrary imperative game runtime.

Table 9's hashing experiment on 100 million characters illustrates granularity:

| Characters per tracked chunk | Trace memory | Initial serial run | Single-character serial update |
| --- | --- | --- | --- |
| 16 | 1.85 GB | 6.8 s | 17 microseconds |
| 128 | 231.25 MB | 2.5 s | 14 microseconds |

These are published benchmark values, not Tower estimates. In this example, coarser tracking improves memory, initial execution, and update time. My application-specific inference is that minimizing the number of rerun arithmetic instructions can be a worse objective than minimizing total tracking plus replay cost.

### Optimistic simulation and unchanged outputs

[Jefferson's Virtual Time, 1985](https://worrydream.com/refs/Jefferson_1985_-_Virtual_Time.pdf) introduces Time Warp: speculative logical processes recover from late messages through rollback and cancellation of consequent messages. It is a close simulation ancestor, although its message-oriented discrete-event model differs from a typical shared-memory game loop.

In **lazy cancellation**, reexecuted events compare regenerated output messages with previous outputs; equal outputs need not cause downstream cancellation. This closely matches the proposed rule that an unchanged result stops a cascade. [Throttled Lazy Cancellation in Time Warp Parallel Simulation, 2008](https://journals.sagepub.com/doi/10.1177/0037549708090864)

[ROSS's delta-encoding documentation](https://ross-org.github.io/feature/delta-encoding.html) describes an implemented optimistic simulation system combining state deltas with reverse computation. It also calls out separate RNG reversal. This establishes practical rollback machinery, but making undo cheaper does not by itself skip forward reexecution; dependency-based reuse is an additional capability.

### Incremental compilers

[Rust's red-green query algorithm](https://rustc-dev-guide.rust-lang.org/queries/incremental-compilation.html) caches dependencies and can retain a result when its inputs remain valid. If a query must rerun but produces the same result, dependent queries can still remain valid. The documentation also explains why dependency visitation order matters when control flow changes.

This is a useful comparison for Tower's compiler, not a replacement for the proposed opcode-level runtime. Semantic queries such as resolving a symbol or emitting a function are an optional alternative or additional optimization. Tower's intended automatic mechanism can instead derive dependencies from the compiler's ordinary executed instructions and memory accesses.

### What nearby game techniques do not establish

[Unity Netcode 1.5 prediction documentation](https://docs.unity3d.com/Packages/com.unity.netcode@1.5/manual/prediction-details.html) describes selective rollback cases in which some entities replay older ticks while others remain at a later tick. It explicitly documents problematic interactions and does not promise determinism. That behavior cannot directly satisfy this game's input-only exact-agreement requirement. The comparison helps distinguish historical reuse from simply leaving some current objects untouched.

## 2026-09-05 — Entry 3: Correctness requirements for the game

The following are design implications and counterexamples, not a claim that the cited systems already implement Tower's proposed game runtime.

### Reuse historical state

Suppose the client is at tick 110 and B's corrected input belongs to tick 100. If A's simulation remains reusable, a query during replay of tick 103 must read A's valid state at tick 103. Reading A's current tick-110 position is incorrect.

Skipping A means retaining and reusing A's valid history. It does not mean freezing present-day A inside a simulation of the past. This requires historical component values or another way to reconstruct the needed versions, even for work that is not rerun.

### A missed collision is a dependency too

Consider this sequence:

1. At tick 103, A's laser queries cells X, Y, and Z and finds no target.
2. B's corrected input at tick 100 changes its trajectory.
3. B now occupies cell Y at tick 103.
4. The old laser computation must be invalidated, even though it never previously read B's collider.

In the proposed complete opcode/memory model, this works automatically: the original query executed loads of the slot, bucket head, occupancy marker, length, terminating link, or other bytes that established its result. If an insertion changes that result, the deterministic execution must encounter a changed observation. The runtime tracks those ordinary loads without knowing what the data means. No programmer-declared empty-query dependency or special spatial API is required. A specialized query representation is only an optional way to change tracking cost and precision.

There is a database analogy: a query's result can change when a previously absent row begins matching its predicate. PostgreSQL calls this a phantom read and documents predicate-based dependency tracking. [Transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)

Tower's earlier notes on failed child lookups already recognize the corresponding compiler problem.

### Repair the graph as well as values

The original dependency graph describes the original execution. Changed branches, addresses, loop lengths, entity existence, and query results can produce a different graph.

Replay must discover new reads and writes, retract vanished effects, and update the dependencies of rerun work. If an old laser blocker disappears, the recomputed query may continue farther and discover a target that was never previously examined. If a conditional store disappears, a later read may now observe an earlier store. Merely walking the old graph's descendants once is insufficient.

### Preserve within-tick ordering

A version needs enough identity to distinguish relevant writes within a tick: phase and execution order may matter as well as tick number. Reexecution must preserve the reference simulation's conflict ordering, including newly introduced interactions.

The original unconditional-store example is correct: storing 9 does not depend on the previous numeric contents. The old value saved to support undo is bookkeeping, not automatically a semantic input to the new value. Conversely, inserting or removing that store can change which version later readers observe.

A first implementation can use a deterministic serial scheduler for repair. Parallelization should follow demonstrated independence. Replacing an in-place update loop with double buffering can change game behavior, so it is not automatically a semantics-preserving optimization.

### Cut propagation at complete, equal outputs

There are two separate opportunities:

- If an authoritative simulation input equals the input actually used, no correction is needed for that input. This can be checked before any temporal graph work.
- If an input differs, rerun affected work. Propagation can stop at an output that proves equal to its prior version.

The relevant outputs include component values, entity creation/destruction, spatial membership, queued simulation events, and any state that influences future execution. Matching position alone is insufficient if velocity, health, cooldowns, or RNG state differs. Equal end-of-tick state also does not erase changed intermediate effects already consumed elsewhere.

Rerun work must refresh its dependencies even if its outputs remain equal: it might now read a different object with the same value. Exact equality is the correctness criterion. Hashes can accelerate comparison, but collision handling is necessary if absolute equivalence is required.

An unchanged downstream result can require zero reexecution of its body, but checking validity, scheduling repair, and maintaining history still take time. The goal is sound reuse with low overhead, not a guarantee of literally zero-time fast-forward or the mathematically smallest possible set of rerun instructions.

### Locality helps, but distance is not the proof

Finite-speed bullets can expand the affected region over several ticks. Hitscan lasers can connect distant regions in one tick. Joint chains or stacked contacts can spread a correction throughout a connected solver island during one step.

Spatial buckets are useful for limiting queries and invalidation. Separate physical arenas are optional; what matters is which logical versions a computation can observe. Immutable global data is safe to share. Frequently changed global totals, sequential RNG state, global allocation counters, or a single broad query dependency can spread changes widely.

The affected execution can encompass a full replay. This is not an automatic upper bound on repair cost: uncapped history maintenance and repeated invalidation can cost more than full replay plus ordinary forward tracing. A practical runtime can monitor repair cost and fall back to exact full replay; a bounded fallback policy requires its own accounting, including work already spent before switching.

## 2026-09-05 — Entry 4: LLVM and the native-performance goal

### Static analysis and runtime history solve different problems

LLVM's [MemorySSA](https://llvm.org/docs/MemorySSA.html) is an intraprocedural compiler analysis. It represents potential memory definitions and uses with a virtual SSA form; its memory definitions initially version the whole memory state, with alias-aware walking used to refine clobber relationships. It does not retain actual historical component values, dynamic invocation identities, or a game execution's readers across ticks.

LLVM's [alias and Mod/Ref analysis](https://llvm.org/docs/AliasAnalysis.html) can conservatively describe possible overlap and memory effects. This can help a Tower pass eliminate unnecessary instrumentation or summarize known accesses. It does not replace the runtime information needed to repair an actual execution.

LLVM supports [custom passes and pass plugins](https://llvm.org/docs/WritingAnLLVMNewPMPass.html). A custom temporal transformation is feasible engineering work, but the proposed complete runtime is not an existing MemorySSA feature.

LLVM's [object-code tutorial](https://llvm.org/docs/tutorial/MyFirstLanguageFrontend/LangImpl08.html) demonstrates the native-code route for a custom language frontend. Tower's own opcodes can serve as an intermediate representation before this lowering.

### Proposed lowering strategies

Retain ordinary instruction semantics, address calculations, SSA dependencies, control structure, and effects long enough to generate the incremental execution machinery. The resulting normal-execution and repair routines can both lower to native LLVM code. Application-specific identities are optional source-language/library choices.

Conceptually the runtime needs:

```text
instruction occurrence: code location plus dynamic execution context
memory observation: address/range, logical execution time, observed version/value
local observation: values supplied by other instruction occurrences
effect: historical memory write, allocation/free, or defined external operation
```

There are at least two implementation options. Fine-grained repair can compile static arithmetic def-use edges into code, dirty flags, or compact shared templates, retaining the dynamic values needed for each execution occurrence. Coarser repair can recompute an entire instruction sequence when one of its inputs changes. Both fit the proposal. The tradeoff is additional metadata versus redundant arithmetic, and should be measured rather than decided by assuming every instruction needs its own heap-allocated graph node.

An instruction's static SSA definition can execute in multiple loop iterations or calls. Sharing its static edge description does not eliminate the need to preserve or reconstruct the distinct dynamic values and memory versions. Control-dependent inputs such as `phi` operands must follow the actual executed predecessor. [LLVM phi semantics](https://llvm.org/docs/LangRef.html#phi-instruction)

Likewise, the implementation need not physically store one version counter per byte. Typed fields, objects, or ranges can be tracking units. If Tower permits overlapping raw byte accesses, the tracking scheme must correctly account for that overlap; larger units may safely trade precision for conservative recomputation.

Candidate optimizations to investigate:

- Elide or reconstruct temporary history when compiler analysis proves that doing so preserves the selected repair strategy.
- Coalesce repeated reads of an unchanged logical version and repeated writes that have no intervening observer.
- Track contiguous ranges where that is cheaper, accepting conservative invalidation.
- Compile known instruction dependencies directly; retain dynamic tracking for data-dependent addresses, memory versions, and branches.
- Store history and dependency records compactly, with bounded lifetimes and batching where useful.
- Preserve efficient dense component iteration inside native kernels.

The proof obligations matter: a local pointer is not private if it escapes; a write cannot be discarded if another computation observed it; a dynamic spatial lookup cannot be replaced by its old result after membership changes.

### Placement in the optimizer remains an open implementation question

Inserting opaque logging calls around every load and store can interfere with optimizations. Delaying all instrumentation until after lowering can lose useful SSA, lifetime, and control information. A promising design preserves the information required by the chosen repair scheme and lowers tracking through a deliberately designed pass pipeline. This needs experimentation; there is no universal recommendation to put a single pass immediately before or after `-O3`.

The runtime must also provide callable replay routines or continuations with the required inputs. Retaining a list of native instruction addresses and memory writes is not sufficient to reconstruct optimized register state and changed control flow.

### Deterministic integer semantics still need deliberate lowering

Tower should define widths, overflow, division edge cases, shifts, and observable ordering. LLVM's overflow flags and other promises must only be emitted when justified; violating flags such as `nsw` can produce poison values. [LLVM language reference](https://llvm.org/docs/LangRef.html#add-instruction)

Integer arithmetic is a useful foundation, but an ECS migration must also preserve collision order, event order, allocation identity, and RNG behavior. Unrelated edits must not silently acquire global ordering dependencies.

### What native performance can realistically mean

Native machine code is an achievable execution format. Near-native arithmetic inside regions is plausible. Near-zero overhead for recording arbitrary dynamic dependencies and retaining history is not established by the literature reviewed here.

The target should be lower total CPU cost and better correction-time latency on the real workload, while separately measuring the extra cost of normal forward ticks. A custom opcode representation can also lower to native code; its existence does not imply interpretation. Choosing LLVM versus a custom IR does not itself remove history storage, dependency maintenance, or replay scheduling costs.

## 2026-09-05 — Entry 5: ECS, handles, and the compiler

An ECS-style model is a possible way for source programs and libraries to organize memory. Plain components and checked handles provide convenient boundaries for type checking and lifetime validation. They do not independently establish memory safety: the implementation must validate bounds and handle generations, control aliasing, and prevent borrowed references from surviving invalidating structural changes. The temporal runtime itself can remain entirely unaware of this organization.

Bevy's [archetypes](https://docs.rs/bevy_ecs/latest/bevy_ecs/archetype/index.html) group entities by their component combinations. This does not automatically group nearby objects spatially. A spatial index and temporal history remain separate structures.

Bevy [entity generations](https://docs.rs/bevy_ecs/latest/bevy_ecs/entity/struct.Entity.html) distinguish reused entity slots. The raw-memory runtime instead needs correct allocation lifetimes and historical versions at addresses. A fully tracked program can use ordinary table addresses and relocation operations correctly. Such operations can cause extensive recomputation; stable application handles are an optional way to reduce that coupling.

Bevy's [change-detection example](https://github.com/bevyengine/bevy/blob/main/examples/ecs/change_detection.rs) explains that ordinary mutation tracking is triggered by mutable dereferencing and offers equality-aware updates separately. It does not provide the historical dependency graph proposed here. Its [query documentation](https://docs.rs/bevy_ecs/latest/bevy_ecs/system/struct.Query.html) also does not guarantee ordinary iteration order, so order-sensitive simulation needs an explicit deterministic policy.

The runtime can key observations on address/range, allocation lifetime where relevant, and historical write occurrence. Component insertion, deletion, presence, and query membership can be represented entirely by the source program's ordinary memory operations. No special entity/component key is required. An optional higher-level storage layer could use such keys as an optimization.

The compiler and game could share identity, dependency, equality, and version-management infrastructure without requiring identical storage or scheduling. Semantic compiler queries are often natural reusable units. AST storage alone will not make parsing, name resolution, or code generation incremental; their computations must participate in the dependency protocol.

## 2026-09-05 — Entry 6: Time, I/O, and observable effects

The original proposal suggests resampling external time or files when dependent code reruns. That can define a reactive application policy, but it is unsuitable as an implicit rule for exact game replay. Replaying tick 100 must not sample today's wall-clock value and silently inject it into the historical simulation.

Model external observations as explicit, versioned inputs with a defined logical time. RNG must likewise be reproducible: retaining stream state or deriving draws from stable identities are possible strategies. A single shared sequential stream can create real dependencies between otherwise unrelated entities.

External writes need an effect policy. Network sends cannot generally be undone. A possible game design records simulation events during prediction, reconciles presentation effects, and commits irreversible effects only after the protocol's confirmation frontier. This does not require delaying transmission of locally sampled player input; the distinction concerns side effects produced by speculative simulation.

For compiler file access, source contents and relevant directory/query results can be explicit inputs. Generated files can be managed as build outputs. Automatically reversing arbitrary foreign calls remains outside the proposed default semantics.

## 2026-09-05 — Entry 7: Performance model and verification plan

For a fixed measured interval, define:

```text
F = ordinary forward simulation cost
R = baseline whole-world correction/replay cost
H = incremental runtime's additional normal-execution/history cost
S = selective reexecution cost, including its instrumentation
B = additional correction bookkeeping and history-maintenance cost

baseline total    = F + R
incremental total = F + H + S + B
win condition    = H + S + B < R
```

This is an accounting model, not a prediction. Restore/snapshot work must be assigned consistently in both measurements. The fraction of affected work should be weighted by CPU cost, not only by entity count. Retained memory and p95/p99 frame latency are separate constraints even when average CPU improves.

Sparse local interactions are promising. A scene with many rays reading overlapping regions may both produce a large dependency graph and invalidate much of it. A stack of mutually interacting bodies can likewise reduce reuse. Frequently correct predictions can make tracing harder to amortize, because the baseline may already skip those corrections entirely.

### Native/game experiment proposed, not yet implemented

Entry 9 records a smaller raw-memory correctness experiment completed during this investigation. It does not implement this native/game experiment.

1. Use the existing full-replay simulation as the correctness reference. Feed both implementations identical initial state and authoritative input history.
2. Validate a deterministic raw-memory repair scheduler, including changed addresses and inserted/removed writes. Compare fine-grained compiled repair and grouped instruction repair when a native prototype is available; neither requires application-specific runtime objects.
3. For every correction, compare all simulation-relevant state and events at each repaired tick. Use canonical comparisons; include hidden caches if they can influence later results. Hashes may locate differences, but exact comparisons are the stronger correctness check.
4. Measure ordinary forward cost, correction CPU and tail latency, trace/history bytes, affected-work fraction, and fallback frequency. Include both zero-correction intervals and sustained corrections.
5. Exercise varied correction ages, batching, and out-of-order arrivals. Bound retained history by the protocol's confirmed frontier while preserving a valid checkpoint and any still-needed versions.
6. Use compiler-generated tracking to enforce coverage of the supported machine semantics. Any experimental grouping is a performance choice; the intended source-program contract remains automatic dependencies with no manual rollback bookkeeping.

Required adversarial cases:

| Case | What it checks |
| --- | --- |
| Correct prediction | Input equality avoids unnecessary correction. |
| Isolated player pushing a box | Locality yields actual skipped work. |
| Old laser miss becomes a hit | Empty-query dependencies are recorded. |
| Old blocker disappears | Replay extends the query and discovers new dependencies. |
| Same position, different velocity or cooldown | Equality cutoff includes future-relevant state. |
| Different source object, equal read value | Dependencies refresh even when propagation stops. |
| Long hitscan and joint chain | Large causal regions remain correct. |
| Spawn/despawn and handle reuse | Logical identity and lifetime handling remain valid. |
| Two corrections affecting overlapping history | Repair batching and ordering remain consistent. |
| Different thread counts and target platforms | The execution policy preserves deterministic semantics. |

## 2026-09-05 — Entry 8: Revalidation of the actual opcode/memory model

### Correction of scope

The author clarified that the runtime has no concepts of lasers, players, ECS components, or React components. Those were application examples, not proposed dependency-tracking primitives. The correct subject is a deterministic machine with opcode occurrences, local operands, address calculations, historical memory reads/writes, and control flow. The earlier emphasis on programmers declaring semantic query dependencies was misplaced for this model.

The original document was reread in full, including its overwrite, time-point equivalence, allocator, and external-effect sections. The overwrite and equivalence examples withstand this revalidation. The discussion below is an independent reasoning argument about that model, supported separately by published algorithms and implementation source.

### Why an empty-slot read is sufficient

**Yes: complete opcode/memory tracking automatically captures the dependency that the author described.** No special concept of absence needs to be added by the program author.

Consider a deterministic computation with the same entry control state and local operands. Suppose every load reached along its old execution still returns the same historical bytes. Induct over executed instructions:

1. Equal operands produce equal deterministic arithmetic results and address calculations.
2. Equal conditions select the same branches.
3. Equal addresses and returned bytes produce equal loaded values.
4. Equal store operands produce equal writes at the same logical point.

Consequently, that computation follows the same path with the same effects. A different result requires a first changed observation or an entry/control input derived from one. If code previously stopped after reading an empty marker, null link, length, or occupancy bit, a change that makes the lookup succeed must become observable through such an input. Repair then executes the changed path and records any newly reached loads. The runtime need not understand why the byte was read.

This is a semantic argument for complete observation, not a proof that any particular scheduler correctly maintains it. It assumes the deterministic, fully defined instruction semantics already required by the proposal, and that relevant external observations enter that model. A hypothetical insertion into memory that changes no observation of the reference program cannot change that program's answer either.

The dependency is on the value visible at the read's logical time. A write later than the read does not retroactively alter it. A newly inserted earlier write can alter it even though the old trace had no edge to that previously nonexistent write.

### Dynamic write histories are part of the mechanism

An arithmetic def-use graph alone is insufficient, but the author's versioned-memory model can account for the missing relationship:

```text
0: store(100, 0)
1: f = load(200)
2: if f != 0: store(100, 7)
3: x = load(100)
```

Changing address 200 can insert or remove the write at step 2. The load at step 3 must then use the appropriate predecessor in address 100's revised history. Its address expression did not need to change, and the old value graph need not have contained an edge from `f` to `x`.

For each affected address/range, insertion, deletion, movement, or value change of a write requires checking the later reader interval up to the next overwrite. That overwrite can shield subsequent readers. A read-modify-write can propagate a change farther through its own read operand. These are raw-memory relationships, not semantic object relationships.

An equal returned value can stop arithmetic propagation while the runtime refreshes the observation's source. For example, retargeting `load(p)` from address 100 to address 300, both currently containing 7, leaves its value unchanged but must subscribe to address 300 for subsequent corrections. Likewise, an equal-valued inserted write can change the historical producer identity without changing downstream numeric results.

### Published algorithm and actual source, not just an analogy

[Imperative Self-Adjusting Computation, POPL 2008](https://home.ttic.edu/~amal/papers/impselfadj.pdf), §5.2, maintains ordered versions and readers per mutable location. Inserting/removing a write affects readers until the following write; Fig. 13 illustrates overwrite shielding. Theorem 4.6 and Lemma 4.7 establish consistency and the connection to ordinary evaluation. Its SML prototype uses explicit primitives: this is evidence for the underlying semantics and algorithm, not an already automatic Tower compiler or a guarantee about identical numerical allocation addresses.

The CEAL arbitrary-write/arbitrary-read runtime was also inspected at pinned commit `cc67ef1ad336649b2362c39faaccdd08ba59d728`. These are actual source line numbers:

| Function | Source location | Mechanism inspected |
| --- | --- | --- |
| `event_enqueue_reads` | [L438](https://github.com/matthewhammer/ceal/blob/cc67ef1ad336649b2362c39faaccdd08ba59d728/src/lib/runtime/modref_functor_awar.c#L438) | Enqueues following readers until the next write. |
| `read_invoke_` | [L584](https://github.com/matthewhammer/ceal/blob/cc67ef1ad336649b2362c39faaccdd08ba59d728/src/lib/runtime/modref_functor_awar.c#L584) | Finds the historical predecessor and records the read. |
| `read_revinv` | [L717](https://github.com/matthewhammer/ceal/blob/cc67ef1ad336649b2362c39faaccdd08ba59d728/src/lib/runtime/modref_functor_awar.c#L717) | Replaces a read's old address subscription. |
| `write_invoke_` | [L732](https://github.com/matthewhammer/ceal/blob/cc67ef1ad336649b2362c39faaccdd08ba59d728/src/lib/runtime/modref_functor_awar.c#L732) | Inserts a write and compares values before invalidating readers. |
| `write_revoke_` | [L871](https://github.com/matthewhammer/ceal/blob/cc67ef1ad336649b2362c39faaccdd08ba59d728/src/lib/runtime/modref_functor_awar.c#L871) | Removes a write and exposes its predecessor. |

This is source inspection, not a successful local build. Its revoke-then-reinsert replacement can temporarily invalidate readers unnecessarily; it does not establish globally minimal recomputation.

[Self-Adjusting Stack Machines](https://arxiv.org/pdf/1108.3265), §7, describes historical access indexes and compiler-generated redo/undo code through C/GCC. Its consistency theorem requires compositional store agnosticism, achieved by a specified transformation. The implementation has word-alignment and foreign-memory-access restrictions. These details establish a native low-level precedent with explicit limitations, not a proof for arbitrary LLVM programs.

### N×M iteration: broad access is not automatically total invalidation

For fixed-size independent pair calculations:

```text
for i in [0, N):
    for j in [0, M):
        R[i,j] = F(load(A + i), load(B + j))
```

Changing one `B[k]` directly affects the N pairs in column k, not all N×M pairs. Changing one `A[k]` affects M pairs. If r distinct A cells and s distinct B cells change, the union of directly affected pairs contains:

```text
r*M + s*N - r*s
```

This assumes unchanged loop topology, independent pair bodies and distinct result cells; it counts direct operand dependence, not arbitrary later effects. Changed predicates that recompute to the same false value can cut propagation before stores or downstream consumers.

Changing a shared length, shifting array contents, rehashing a table, using an order-dependent accumulator, or changing control flow can affect much more. Even with sparse invalidation, initial work is still N×M, and a straightforward fine-grained implementation can retain N×M-scale history. Shared static templates can reduce metadata; sparse repair is not proof of small retained storage.

Thus the author's concern about dependency fanout is valid, but the stronger claim that any change in either list necessarily reruns everything is false. Exact opcode dependencies preserve finer distinctions than whole-loop or whole-list dirty flags.

### Three different costs often called contention

- **Invalidation fanout:** many computations read a version that changes. This spreads repair.
- **Parallel memory contention:** conflicting writes, synchronization, or cache-line sharing affect concurrent execution.
- **Tracking contention:** the runtime itself may update shared history indexes or queues even when subject-program reads do not conflict.

Two reads do not create a causal dependency on each other. An unchanged global base pointer or constant does not itself spread a correction. A changed shared allocator cursor, RNG state, length, or frequently read counter can. The programmer influences those patterns through ordinary algorithms and storage layout, without manually declaring dependencies.

### Native execution and compiler-known dependencies

The proposal does not require a dynamic heap graph node for every arithmetic operation. Static edges can be embedded in generated native repair code, dirty masks, or shared instruction templates. Distinct dynamic loop/call occurrences still require their own relevant values or a way to reconstruct them. Grouping instructions trades extra reexecution against less metadata; it is not required to introduce application semantics.

LLVM's [DataFlowSanitizer design](https://clang.llvm.org/docs/DataFlowSanitizerDesign.html) provides a limited practical comparison: compiler-generated instrumentation propagates metadata through SSA registers and byte-addressed shadow memory. It is not an incremental executor: its labels do not provide historical reader indexes, effect repair, or exact change propagation. It supports the narrower claim that native compilation and automatic low-level metadata propagation are compatible.

An ordinary deterministic allocator can itself be tracked. If its returned numerical addresses change, dependent instructions repair normally. Stable allocation names or handles are optional ways to reduce propagation. Retaining an old pointer when the defined allocator would return a different observable pointer would require explicitly different language semantics.

The subject program's memory must also be distinguished from the temporal runtime's private bookkeeping. Instrumenting the logger recursively as subject computation is not the intended machine model.

### What can and cannot be answered with certainty

| Claim | Verdict |
| --- | --- |
| Empty-slot observations are automatically dependencies under complete tracking. | Yes. |
| Exact selective repair needs application-specific entities or dependency declarations. | No. |
| The document's overwrite and equal-result cutoff examples are sound. | Yes. |
| Any changed element in a cross-product loop necessarily invalidates every pair. | No. |
| A native implementation is possible in principle. | Yes. |
| Low-level placement alone proves an implementation correct. | No; complete semantics and a correct transformation/runtime are still required. |
| Sparse corrections can make selective execution faster overall. | Yes, when avoided replay exceeds added forward and repair costs. |
| This particular game will gain performance, or normal execution will stay near uninstrumented speed. | Not established; requires a native workload benchmark. |

The core idea is sound. The uncertainty is chiefly how efficiently Tower can preserve, find, and repair the necessary dynamic history, not whether the runtime needs to recognize game objects.

## 2026-09-05 — Entry 9: Executable raw-memory validation

Implemented [temporal-memory-validation.mjs](research/temporal-memory-validation.mjs) as a bounded research diagnostic, not a production implementation. It uses only instruction instances, integer addresses, values, ordered stores, load subscribers, and SSA operand dependencies. No entities or component/query invalidation APIs participate.

Reproduction, from the repository root:

```powershell
node docs/research/temporal-memory-validation.mjs
```

Environment verified: Windows, Node `v21.7.3`. No C/C++/LLVM native benchmark was run. The diagnostic uses exact JavaScript `BigInt` values and checks supported addresses; it does not test Tower's eventual fixed-width overflow lowering.

Final tested script SHA-256: `A4AA15881D9B4235C74E7A7CACF1E0E5F23D30FDD6413944EC1095B775B91971`. The script also passes `node --check`.

### Mechanism exercised

The repair engine uses an ordered dirty queue, static operand subscribers, per-address store histories, and per-address load subscribers. It can insert/remove a conditional write effect, move a store to a different address, and retarget an indirect load. It refreshes load source identity even when the loaded value is equal. Equality stops propagation through unchanged instruction results.

Dirty-work discovery does not scan the whole instruction trace: it follows operand subscribers and affected address/time intervals. Construction and verification do scan all instructions. This property was checked by code inspection; it is not a hardware measurement. Per-address arrays can shift metadata during insertion/deletion, so selective instruction evaluation does not make bookkeeping free.

A separate reference evaluator performs ordinary sequential execution against mutable memory. Comparisons check every instruction value, each load's address and producer identity, and final memory. The reference uses the same opcode specification but maintains its own input map outside the incremental engine; updates to initial memory are checked independently as well. Directed assertions additionally check expected values and exact rerun sets.

### Results

The main agent independently reran the diagnostic after implementation and review. Result: **PASS**.

| Validation | Result |
| --- | --- |
| Directed adversarial cases | 8 passed. |
| Exhaustive bounded sequences | 2,048 three-state sequences; 4,096 update batches. |
| Seeded generated programs | 32 programs × 300 update batches = 9,600 batches. |
| Random seed | `0x5eedc0de`. |
| Total comparisons with sequential execution | 15,801, including initial evaluations. |
| Total update batches | 13,712, including no-op changes. |

The directed cases cover an empty pointer slot changing to a previously unread address, overwrite shielding, conditional write insertion/deletion, equal-valued pointer retargeting, moving a store between addresses, historical ordering, equal-valued producer replacement, and the document's batched `(3 + 5)` to `(5 + 3)` equality example.

For the last case, exactly the two loads and the addition rerun. The unchanged sum 8 prevents the downstream multiplication, store, and load from rerunning. This tests a batch: propagating the two input changes separately could do unnecessary intermediate work.

For a raw 9×13 cross-product with fixed row operands and 13 loaded column operands, changing one column value reruns **9 of 117 pair predicates**. All remain false. The engine evaluates 28 queued instructions out of 481 and reruns no result stores. This is a counterexample to unavoidable whole-N×M invalidation, not a game benchmark or a native speedup claim.

The exhaustive test is exhaustive only for its specified small program: three binary controls, four initial data-cell configurations, and all length-three control-state sequences. Random generation exercises a restricted opcode family; it does not cover every program.

### Limits and interpretation

Instruction instances and their total order are fixed. Conditional writes model changed effects, but the diagnostic does not insert arbitrary instruction traces, change loop lengths, manage allocation/free, handle overlapping byte accesses, execute concurrent instructions, or bridge foreign code. Its arithmetic model is not a native machine's finite-width arithmetic. No timing result establishes production performance.

The tests provide concrete supporting evidence for the bounded memory-history and cutoff algorithm, not a 100% proof of Tower's future compiler/runtime. Published consistency results likewise apply to their stated systems. Tower would need a precise reference machine and a proof or substantially broader differential testing of its own lowering and repair implementation.

## 2026-09-05 — Entry 10: Broad language, native-runtime, and game landscape

### Scope and classification

Question: does the existing landscape leave a worthwhile opening for a native programming language whose compiler/runtime automatically repairs changed historical execution through opcode and raw-memory dependencies?

This scan used primary papers, author-maintained project pages, official product documentation, source repositories, and public GitHub repository metadata. Search families included self-adjusting languages and compilers, automatic incrementalization, LLVM/native dependency-triggered reuse, binary-level incremental execution, differential/dataflow languages, deterministic game languages, rollback engines, and reversible native simulation. Recent 2025–2026 work was checked alongside older foundational implementations.

The comparison distinguishes:

- An actual language from a library, compiler transformation, or game SDK.
- Native generated application code from a native runtime hosting another execution model.
- Automatically discovered dependencies from explicitly constructed query/cell/dataflow graphs.
- Updating a current result from editing a historical imperative execution.
- Reusing valid forward computation from merely making snapshot/undo cheaper.
- An implemented research prototype from an available product or an unverified draft specification.

The comparison criteria describe what systems provide; they are not additional requirements being imposed on Tower. In particular, the Tower runtime remains application-agnostic. A different representation in another system does not erase its relevance as prior art or as a practical alternative.

### Actual languages and language extensions

| Language/system | Native implementation evidence | What is incremental, and important distinction |
| --- | --- | --- |
| **Skip / Skiplang** | General-purpose language with LLVM ahead-of-time compilation. | Opt-in memoized functions, compiler-enforced effect restrictions, automatic dependencies on reactive data. A serious native language precedent, not just a UI library. Its model is not unrestricted historical replay of every imperative load/store. [Language overview](https://skiplang.com/) |
| **CEAL / Self-Adjusting Stack Machines** | C-derived research language/compiler and runtime; native code via C/GCC. | Historical mutable-memory operations and dynamic trace repair make this one of the closest mechanism-level predecessors. Compiler-generated recovery points coexist with programmer memoization choices and implementation restrictions. [Paper](https://arxiv.org/pdf/1108.3265), [source](https://github.com/matthewhammer/ceal) |
| **LML** | Standard ML extension implemented using modified MLton and an MLton-generated native executable. | Changeability type annotations drive automatic incrementalization of ordinary code, including mutable references. Evaluated on lists, matrices and a ray tracer. Typed changeability differs from transparent byte-address instrumentation, but this is substantial language-level automation, not merely hand-wired dependencies. [PLDI 2012 paper](https://research.cs.queensu.ca/home/jana/papers/incr/ChenDunfieldAcar12.pdf) |
| **ΔML / Self-Adjusting SML** | Modified MLton compiler; official source and native Linux/Cygwin/macOS packages remain listed. | Adaptive computations and modifiable values participate through language primitives. A real compiler lineage, not only formal notation. Listed packages are dated 2008; compatibility with current systems was not tested. [Compiler/download page](https://home.ttic.edu/~pl/sa-sml/) |
| **AFL and SAIL** | Formal languages accompanied by ML library implementations; not verified here as independent native systems-language distributions. | AFL is foundational adaptive functional computation; SAIL extends the model to repeated writes and imperative histories. Important semantics, but distinguish the papers' languages from a ready-to-use native toolchain. [AFL](https://www.cs.cmu.edu/~rwh/papers/afp/toplas06.pdf), [SAIL](https://home.ttic.edu/~amal/papers/impselfadj.pdf) |
| **Fungi / IODyn** | Rust-embedded language implementations; native compilation of the host is not evidence of native compilation of every embedded-language program. | Named computations, persistent structures and typed reuse. Fungi is deeply embedded; its repository is archived. Relevant language research, not verified here as a supported native raw-memory compiler. [Fungi](https://github.com/Adapton/fungi-lang.rust), [IODyn](https://github.com/cuplv/iodyn-lang.rust) |
| **Differential Datalog / DDlog** | Compiler emits Rust libraries that compile to native binaries/libraries and expose other-language interfaces. | An actual incremental language, maintaining declared relations rather than ordinary host-language memory histories. The original repository is archived. [Native compilation tutorial](https://github.com/vmware-archive/differential-datalog/blob/master/doc/tutorial/tutorial.md), [repository](https://github.com/vmware-archive/differential-datalog) |
| **Feldera SQL / DBSP** | SQL compilation to Rust/native execution; current implementation and documentation available. | Automatically generated incremental stream/relational computation. DBSP's generality within its circuit model should not be confused with automatic temporal repair of arbitrary Rust instructions or UDF internals. [SQL compilation](https://docs.feldera.com/sql/intro/), [implementation](https://github.com/feldera/feldera) |
| **Easel** | A game programming language and platform targeting browser-playable games; a standalone native target was not established by the reviewed documentation. | Language-integrated deterministic multiplayer and transparent incremental snapshot/rollback. Its definition of incremental rollback concerns changed-state saving/restoration, not documented dependency-selective forward repair. Direct product competition for automatic multiplayer language design. [Rollback semantics](https://easel.games/docs/learn/multiplayer/rollback-netcode/), [product](https://easel.games/) |

### Skip is the most important general-purpose product-lineage discovery

The original Skip design tracks dependencies between memoized computations and reactive Cells. It separates a side-effect-restricted computation core from a mutator, and uses multiversion concurrency control so readers see coherent historical revisions. Mutation exists in the language, but effects cannot freely cross memoization boundaries. This is materially closer than simple argument-only memoization, while still differing from Tower's intended arbitrary ordered store-history repair. [Author's runtime explanation](https://skiplang.com/blog/2017/01/04/how-memoization-works.html)

Do not treat Skip as only a discontinued 2018 experiment. The current **SkipLabs/skip** repository includes the Skiplang toolchain, reactive-service framework and SKDB. It documents both native and Wasm runtimes, with TypeScript interfaces. A native runtime does not mean arbitrary TypeScript handlers are compiled to native temporal instructions. Its current public emphasis is backend services rather than game simulation. [Current repository](https://github.com/SkipLabs/skip)

### Additional native compiler/runtime predecessors

These are not all standalone programming languages, but omitting them would exaggerate how unoccupied the native space is.

| System | Implemented mechanism | Boundary relative to Tower |
| --- | --- | --- |
| **CDTT — Compiler-Generated Data-Triggered Threads**, HPCA 2014 | LLVM-based C/C++ transformation emits x86 code using a software runtime; identifies reusable regions and their triggers without source annotations. | Selected regions must be provably idempotent, with conservative alias/dependence restrictions. Native automatic dependency-triggered reuse already exists; arbitrary historical mutation/undo is not its documented semantics. [Paper](https://intra.engr.ucr.edu/~htseng/files/2014HPCACDTT.pdf) |
| **iThreads**, ASPLOS 2015 | Unmodified multithreaded native binaries run with a replacement pthreads implementation; page-level read tracking, byte-difference writes and memoized execution intervals. | Research implementation is 32-bit Linux. Granularity follows synchronization intervals. After the first invalid interval, later intervals in that thread are also invalidated: considerably coarser than Tower's desired selective instruction repair. [Paper](https://www.cs.purdue.edu/homes/pfonseca/papers/asplos2015-ithreads.pdf) |
| **DC — Reactive Imperative Programming with Dataflow Constraints**, 2011 | Ordinary C/C++ accesses to a reactive heap are tracked automatically through protection faults and dynamic binary patching; implemented for Linux IA-32. | Programmers register constraint functions. The runtime maintains a current-state constraint fixpoint, not arbitrary historical read-from-write relationships. A close native memory-tracking precedent nonetheless. [Paper](https://arxiv.org/pdf/1104.2293) |
| **AutoRTFM / Verse interoperability** | Epic's Clang-based compiler instruments native C++ effects for transaction rollback, including ordinary containers and their allocations. Epic documented deployment on some Fortnite servers in 2024. | Transaction abort removes effects; it does not establish dependency-based retention and repair of an old simulation's future. Shows large-scale native compiler instrumentation in a game environment and a route that does not require replacing C++. [Epic engineering article](https://www.unrealengine.com/tech-blog/bringing-verse-transactional-memory-semantics-to-c?lang=en) |
| **Backstroke** | C++ transformation generates reversible computation through incremental state saving, including use with ROSS models. | Automatic undo for simulation events is different from automatically skipping valid forward instructions. [LLNL implementation](https://github.com/LLNL/backstroke) |

These are implementation precedents, not claims that their binaries were built or benchmarked locally during this scan.

Two empirical cautions reinforce the earlier performance assessment. LML's ray-tracing evaluation includes both useful speedups and incremental slowdowns, and its timing methodology excludes garbage collection. iThreads likewise reports large wins on some benchmarks and severe losses on others. Their results are not estimates for Tower; they demonstrate why native code generation alone cannot settle profitability. [LML evaluation](https://research.cs.queensu.ca/home/jana/papers/incr/ChenDunfieldAcar12.pdf), [iThreads evaluation](https://www.cs.purdue.edu/homes/pfonseca/papers/asplos2015-ithreads.pdf)

### Native libraries and generated-code alternatives

| System | Programming interface and native route | Relevance and limit |
| --- | --- | --- |
| **Differential Dataflow / Timely** | Rust collection/dataflow operators, including iterative computations; native Rust execution. | Serious general incremental infrastructure for relations, graphs and iterations. Programs express the dataflow rather than having arbitrary host-memory instructions traced. [Differential](https://github.com/TimelyDataflow/differential-dataflow), [Timely](https://github.com/timelydataflow/timely-dataflow) |
| **PSAC++** | C++17 self-adjusting functions, calls, reads/writes and parallel primitives. | Native self-adjusting computation, but tracked modifiables are write-once per run. Not a direct implementation of arbitrary repeatedly mutated memory. [API and restrictions](https://github.com/cmuparlay/psac) |
| **Adapton in Rust** | Named cells, thunks, forcing and mutation APIs; native Rust library. | Demand-driven reuse and identity machinery. Dependency coverage requires participation through its abstractions. [Repository](https://github.com/Adapton/adapton.rust), [API](https://docs.rs/adapton/latest/adapton/engine/index.html) |
| **Jane Street Incremental** | OCaml variables, graph combinators, observers and stabilization; compatible with native OCaml compilation. | General self-adjusting computations, including finance/modeling uses, not only UI. Tracked graph nodes are explicit abstractions. [Library](https://github.com/janestreet/incremental), [author's overview](https://blog.janestreet.com/introducing-incremental/), [native backend](https://ocaml.org/docs/compiler-backend) |
| **Salsa** | Rust input/tracked structures and tracked functions. | Particularly relevant to incremental compilers; not transparent tracking of all Rust loads/stores. rust-analyzer provides a concrete integration example. [API](https://docs.rs/salsa/latest/salsa/), [rust-analyzer architecture](https://rust-analyzer.github.io/book/contributing/architecture.html) |
| **DICE / Buck2** | Rust keyed computations and registered computation-to-computation dependencies. | Versioned/equality-aware reuse in a real build system, at explicit computation boundaries. [Programming interface](https://github.com/facebook/buck2/blob/main/dice/dice/docs/writing_computations.md), [internals](https://buck2.build/docs/insights_and_knowledge/modern_dice/) |
| **DBToaster / F-IVM** | Generates native C++ incremental maintenance code from query/update descriptions. | Algebraic deltas, maintained views and factorization rather than imperative execution-history repair. [C++ interface](https://dbtoaster.github.io/docs_cpp.html), [F-IVM](https://fdbresearch.github.io/ivm.html) |
| **Live Cells C++ / C++React / Anchors** | Native C++ reactive cells, computations or graph interfaces. | Useful lighter-weight alternatives; native reactivity is not an empty space. Anchors describes itself as work in progress. None of these reviewed interfaces establishes Tower's complete historical-machine behavior. [Live Cells](https://github.com/alex-gutev/live_cells_cpp), [C++React](https://github.com/snakster/cpp.react), [Anchors](https://github.com/oluwatimilehin/anchors) |

Ordinary reactive streams, UI signals and incremental compilation should not be counted as exact substitutes. Conversely, the existence of explicit APIs should not be described as those systems failing to discover dependencies automatically within their supported scope.

### Game and simulation alternatives

**Photon Quantum** is unusually close to the author's application architecture: client-side deterministic simulation, input-only networking, a game-agnostic authoritative input server, rollback, ECS storage and a custom heap. Game logic is C#; its Qtn DSL generates data definitions, not a new general gameplay execution language. The reviewed documentation describes restoring and resimulating mispredictions, not automatic historical opcode repair. It is a substantial practical alternative for the problem domain even though the mechanism differs. [Quantum introduction](https://doc.photonengine.com/quantum/v3/quantum-intro)

Quantum's prediction culling skips selected predicted simulation work while verified frames still simulate all relevant state. Its documentation acknowledges predicted/verified differences. This is not evidence of exact dependency-proven historical reuse. [Prediction culling](https://doc.photonengine.com/quantum/v3/manual/prediction-culling)

Other relevant comparisons:

- **GGPO, GGRS and bevy_ggrs:** native C++/Rust rollback workflows, with state save/load and frame reexecution. Bevy component registration can automate snapshots, but does not automatically turn all computation into a historical memory dependency graph. [GGPO guide](https://github.com/pond3r/ggpo/blob/master/doc/DeveloperGuide.md), [Bevy integration architecture](https://github.com/gschup/bevy_ggrs/blob/main/docs/architecture.md)
- **Tomorrow Corporation's in-house language/tools:** custom development code generation, native deployment via C, and integrated time-travel tools. The author's explanation describes heap snapshots and forward resimulation. A strong integrated-tooling precedent, not a verified public SDK or selective-repair engine. [Author's explanation](https://tomorrowcorporation.com/posts/how-we-make-games-at-tomorrow-corp-our-custom-tools-tech-demo)
- **Verse:** speculative failure contexts roll back effects. That is a real game-language feature, but a transaction failure is not equivalent to editing old inputs and preserving unrelated future computation. [Speculative execution](https://dev.epicgames.com/documentation/fortnite/speculative-execution?lang=en-US)
- **ROOT-Sim / ROSS:** native optimistic simulation organized around events and logical processes. Relevant rollback/recovery infrastructure, but not documented as a universal opcode-level incrementalizer. [ROOT-Sim](https://github.com/HPDCS/ROOT-Sim), [ROSS](https://ross-org.github.io/)
- **EnTT:** native ECS storage and snapshots are building blocks, not the temporal execution engine. [Maintainer documentation](https://github.com/skypjack/entt/wiki/Entity-Component-System)

Easel is especially important strategically: even without demonstrated native selective repair, it already competes for the promise that a language makes deterministic rollback multiplayer automatic. Tower should not claim that product idea is unoccupied.

### Recent research and emerging-language watchlist

- **Incremental Computing by Differential Execution, ECOOP 2025:** imperative core language, cached differential interpreter and mechanized proofs. The implementation uses Scala 3; the reviewed work does not establish an LLVM/native raw-pointer compiler. Evidence that imperative incremental semantics remains an active research topic. [Paper and artifact links](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.ECOOP.2025.20)
- **DeCo, OOPSLA 2026:** typed first-order functional incremental calculus with generic data types and mechanized development. Different from arbitrary mutable memory and historical opcode repair. [Primary preprint](https://arxiv.org/abs/2602.20866)
- **Clef/Fidelity:** draft specification describes compiler-known incremental values and native lowering intentions. Executable incremental-feature evidence was not verified; classify as an emerging specification, not a mature competitor. [Draft](https://clef-lang.com/spec/draft/incremental-computation/), [project status](https://github.com/FidelityFramework)
- **Eshkol:** a design decision describes planned DBSP-style native incremental compilation for a supported query subset. A roadmap is not proof that the entire feature ships. [Design decision](https://github.com/tsotchke/eshkol/blob/master/docs/design/adr/0009-incremental-dataflow-dbsp.md)

### Repository status checks, not popularity estimates

Public GitHub API metadata was queried on 2026-09-05. `pushed_at` is repository activity metadata, not a release date, user count, proof of maintained support, or date of the latest substantive feature.

| Repository | Archived flag | Reported last push, UTC date |
| --- | --- | --- |
| [skiplang/skip](https://github.com/skiplang/skip) | false | 2023-09-21 |
| [SkipLabs/skip](https://github.com/SkipLabs/skip) | false | 2026-09-03 |
| [matthewhammer/ceal](https://github.com/matthewhammer/ceal) | false | 2011-12-15 |
| [vmware-archive/differential-datalog](https://github.com/vmware-archive/differential-datalog) | true | 2023-07-07 |
| [cmuparlay/psac](https://github.com/cmuparlay/psac) | false | 2021-07-05 |
| [Adapton/fungi-lang.rust](https://github.com/Adapton/fungi-lang.rust) | true | 2019-10-11 |
| [Adapton/adapton.rust](https://github.com/Adapton/adapton.rust) | false | 2022-03-24 |
| [salsa-rs/salsa](https://github.com/salsa-rs/salsa) | false | 2026-09-04 |
| [feldera/feldera](https://github.com/feldera/feldera) | false | 2026-09-05 |

The evidence justifies distinguishing older research distributions from visibly evolving repositories. It does not justify calling every old project abandoned or assuming every recently pushed project is production-ready. Public documentation, forks, private implementations and newly announced work make any claim of zero competition unjustified.

## 2026-09-05 — Entry 11: Should this be a programming language?

Scope correction: Entry 14 supersedes this entry's game-centered product positioning. The native mechanisms and performance questions remain relevant, but a missing game product is not sufficient differentiation for a general-purpose language.

### Assessment

**Recommendation: pursue a focused native temporal execution implementation as a potential flagship capability of Tower, while making a representative game benchmark the gate for a larger language/ecosystem investment.** This is an engineering/product judgment based on the scan, not a demonstrated market forecast.

The native field is not empty. CEAL and LML are close conceptual predecessors, Skip is a genuine native incremental language lineage, and native compiler transformations and binary-level approaches also exist. A new name, syntax, LLVM backend or ECS storage model would not by itself create a strong distinction.

The narrower opportunity appears comparatively underserved in the reviewed public landscape: a usable native language/toolchain that makes exact historical imperative repair automatic and profitable for demanding game simulation. The strongest potential distinction is practical execution cost, supported semantics, bounded-history operation and developer experience. It is not the invention of incremental computation, native incrementalization, memory dependency tracking, or language-integrated rollback.

No reviewed maintained game product documented the complete combination of automatic instruction/memory dependency capture, changed historical control/effects, exact selective forward repair and native game deployment. This finding must remain qualified. It also must not be manufactured into novelty by defining the comparison so narrowly that clear predecessors such as CEAL cease to count.

### Why owning the language could help

These are design inferences rather than claims that a new language is technically necessary:

1. Tower can define deterministic integer, memory, allocation, control and external-effect semantics consistently, rather than inheriting all of C/C++'s undefined-behavior and foreign-code boundaries.
2. The compiler can preserve information needed for native repair and guarantee that supported source operations participate. Programmers need not enumerate dependencies.
3. The language and libraries can expose memory layouts that make dependency fanout manageable, while the runtime remains ignorant of what those bytes represent.
4. The same semantic foundation can support simulation repair and incremental compiler execution. Their performance/storage policies may differ.
5. Diagnostics can explain expensive fanout through source locations and memory accesses, making the feature usable without exposing manual dependency bookkeeping.

Those are credible reasons for language ownership if they produce measurable benefits. Existing C/LLVM transformations show that it is not the only route. An LLVM pass, restricted native module compiler, or embeddable runtime may be a lower-cost way to validate the engine and a lower-friction way for other game developers to try it.

### What would make the opportunity convincing

The proposed product promise should be evaluated as:

> Ordinary supported imperative code, compiled natively, can revise old inputs and reuse valid future execution automatically, with exact agreement and a measured total-cost advantage on representative workloads.

This deliberately does not promise universally zero overhead or universal speedups. The reference semantics should match with temporal execution enabled or disabled.

Before making the feature the reason to build a full general-purpose ecosystem:

- Compile a narrow but real Tower instruction subset to native code, including dynamic branches, indirect accesses, inserted/deleted writes, and a defined allocation story. This is a scope limit, not a requirement that users declare application dependencies.
- Run the same representative simulation workload with temporal repair and optimized conventional rollback. Compare against the existing algorithm, not an intentionally weak whole-state-copy baseline.
- Measure zero-correction forward overhead, correction CPU, p95/p99 frame latency, retained history memory, and pruning cost. Include sparse/local corrections, dense cascades, changed loop structure, allocation churn and different correction ages.
- Preserve exact state agreement throughout the repaired history, not only a visually similar final scene.
- Test an integration boundary with an existing renderer/host. Irreversible I/O stays governed by an explicit effect policy; it is not silently omitted from tracking.

If this produces a substantial practical win while retaining the intended automatic programming model, the case for Tower as a differentiated native language becomes strong. If the engine only wins on unusually favorable examples or requires excessive retained history, additional syntax and tooling will not establish the missing performance case.

### Competition to use as baselines, not merely names to avoid

- **Mechanism and correctness:** CEAL, LML, SAIL and current imperative incremental semantics research.
- **Native compiler engineering:** CDTT, AutoRTFM and lower-level tracking approaches such as DC/iThreads.
- **Incremental language usability:** Skip and type-directed LML.
- **Game developer expectations:** Quantum, conventional GGPO/GGRS rollback, Easel's automatic multiplayer experience, and integrated time-travel tools.
- **Compiler incrementality:** Salsa, DICE and Adapton-style query engines.

Tower would also compete with ordinary native toolchains and existing game engines on adoption cost, platform support, debugging and integration. Odin's native systems/game-oriented facilities illustrate that low-level memory control and data-oriented layout alone are already available elsewhere. [Odin FAQ](https://odin-lang.org/docs/faq/)

The practical conclusion is not “there is no competition.” It is: **there is substantial prior art to learn from, and there may still be a worthwhile product gap in delivering this exact capability with game-grade cost and usability.** The user's existing demanding deterministic simulation is a useful way to test that gap directly.

## 2026-09-05 — Entry 12: Current native implementations, retained history, and additional competitors

### Skip: current native compiler evidence, not only a historical language website

The current SkipLabs repository contains a concrete native compiler pipeline. At inspected revision `1813f196b481b24a08b6f418bd4d9f03d7849333`, its compiler Makefile builds a bootstrap compiler from LLVM IR using Clang, then builds successive self-hosted stages and checks agreement between generated LLVM outputs. This is stronger evidence than simply describing the project as native. [Pinned compiler Makefile](https://github.com/SkipLabs/skip/blob/1813f196b481b24a08b6f418bd4d9f03d7849333/skiplang/compiler/Makefile)

The installation instructions specify LLVM 20 and a matching WebAssembly linker, alongside the other build dependencies. This is a current build recipe, not a build I executed in this workspace. [Pinned installation instructions](https://github.com/SkipLabs/skip/blob/1813f196b481b24a08b6f418bd4d9f03d7849333/INSTALL.md)

The historical Skip language and the current Skip framework should nevertheless be distinguished. Current framework documentation describes reactive collections and deterministic, side-effect-free mapping computations; its dependency guarantees apply to that model. A native runtime with a TypeScript-facing API does not imply that arbitrary TypeScript instructions compile to native code, or that arbitrary historical writes to raw memory are supported. [Current framework model](https://skiplabs.io/docs/introduction)

**Effect on the recommendation:** Skip is a serious language/compiler precedent, not a defunct name to dismiss. Tower needs a demonstrable advantage in its intended imperative temporal semantics and workload, not merely the claim that incremental execution can compile natively.

### CEAL: historical game inputs are expressible; rolling history is a separate engineering question

An important correction to an overly narrow comparison: a self-adjusting computation can consume a tick-indexed input history and run a simulation loop. Revising an earlier input can then propagate through the later execution. CEAL need not expose a game-specific rewind API to be relevant to this use case. This is a design inference from its supported imperative execution model, not an executed CEAL game demonstration.

The more specific product question is whether a long-running implementation can efficiently discard confirmed history while continuing to repair the unconfirmed suffix. Source inspection found that CEAL does free revoked trace nodes and allocated boxes through `ceal_free_garbage()`. Conversely, the inspected `ceal_core_reset()` contains unfinished reset/freeing work. It would be inaccurate to conclude either that CEAL has no garbage collection or that these routines establish an efficient rolling confirmation frontier. [Pinned trace runtime](https://github.com/matthewhammer/ceal/blob/cc67ef1ad336649b2362c39faaccdd08ba59d728/src/lib/runtime/trace.c)

For Tower, the distinction is between **garbage created by replacing old execution** and **still-live execution that has become too old to revise**. Both require a storage policy. My proposed acceptance condition is:

1. Materialize or retain an exact checkpoint at the oldest revisable point.
2. Preserve values and dependency information that the retained suffix still needs, including values originating in the confirmed prefix.
3. Rebase or otherwise represent those dependencies before reclaiming the old trace.
4. Verify correction equivalence while advancing the frontier repeatedly, and measure both retained bytes and pruning latency.

This is an implementation requirement for the proposed game runtime, not an impossibility result about earlier systems. Allocation lifetime, pointers into retained storage, and external-effect commitments must remain valid as the frontier advances. Confirmation may depend on every relevant input source; it is not necessarily the latest packet received from one player.

Memory management itself also has substantial prior art. Hammer and Acar's **Memory Management for Self-Adjusting Computation**, ISMM 2008, describes a C library with specialized allocation and automatic reclamation, designed to avoid traversing a large live trace just to recover a little garbage. Its reclamation reasoning uses invalidated computation; it is not a documented game-confirmation-frontier protocol. The paper's abstract and indexed primary text were accessible, but direct PDF retrieval failed during this continuation; this was not a new full-paper or artifact audit. [Author-hosted paper](https://matthewhammer.org/ismm08/ismm08.pdf)

### AutoRTFM: present-day engine integration, with a different execution contract

Current Unreal Engine documentation still exposes AutoRTFM compiler settings, verifier options and memory-redirection instrumentation. Its runtime API includes compiler-facing transaction operations and IR debugging hooks. This confirms continuing compiler/runtime integration beyond the 2024 engineering article. [Build target settings](https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-build-tool-target-reference?lang=en-US), [runtime API](https://dev.epicgames.com/documentation/unreal-engine/API/Runtime/AutoRTFM?lang=en-US)

Do not infer historical dependency repair from the words “all memory accesses” or “redirection.” Transaction instrumentation is relevant evidence for automatically covering native effects in a game codebase; it does not establish reuse of the unaffected future after correcting an earlier input. The public documentation also does not establish a standalone, drop-in temporal LLVM package suitable for Tower.

### Graphics and native-game-adjacent systems added to the scan

| System | What is actually documented | Classification for Tower |
| --- | --- | --- |
| **Aardvark / FSharp.Data.Adaptive** | Adaptive values and collections in F#, with explicit input and derived-computation APIs. Aardvark applies incremental evaluation to scene-graph rendering. | Real graphics use of self-adjusting computation; a managed-host library model, not automatic historical tracking of every ordinary machine access. [Library](https://github.com/fsprojects/FSharp.Data.Adaptive), [authors' rendering work](https://aardvark-community.github.io/ag-for-scenegraphs/) |
| **An Incremental Rendering VM**, HPG 2015 | Maintains a changing rendering command representation and incrementally generates executable machine code. The API explicitly represents changeable rendering arguments and structural edits. | Concrete precedent for incremental machinery combined with native code generation. Its specialized rendering contract is not arbitrary gameplay-memory repair. [Publisher record](https://diglib.eg.org/items/769679b7-0fff-4ca6-a6f2-59f6412e8714), [author-provided paper index](https://github.com/haraldsteinlechner/research) |
| **Citybound** | Rust actor-based simulation and incremental city-plan processing; the author describes the planning implementation as ad hoc and a more general distributed framework as intended future work. | An actual game-project use of incremental computation, not evidence that its entire simulation implements transparent opcode-level temporal repair. Current support or completion of the planned framework was not established. [Author's architecture](https://aeplay.org/citybound) |

The rendering VM's native code concerns its maintained graphics command program. Its low execution-overhead claim must not be transferred to the cost of capturing and repairing every memory operation in an arbitrary Tower program. Likewise, incremental rendering or planning is relevant prior application work without being a replacement for the user's execution model.

### Additional 2026 work: check the mechanism, not the project name

**Incr, OSDI 2026**, automatically incrementalizes unmodified shell programs. Its unit of reuse is a command/process, with filesystem, environment and stream dependencies observed by inserted probes. The paper explicitly lists ignored effects and out-of-scope behaviors, despite the broad language of the abstract. This is useful contemporary work on automatic dependency/effect discovery, but not an instruction-memory repair compiler. A public artifact exists; no local installation or benchmark was performed. [Conference page](https://www.usenix.org/conference/osdi26/presentation/xie-yizheng), [paper, especially §3–4](https://atlas.cs.brown.edu/pdf/incr:osdi:2026.pdf), [artifact](https://github.com/atlas-brown/incr)

An unrelated Rust project, **incr-compute / incr-concurrent**, exposes inputs and query functions through an explicit runtime API. It belongs with native incremental libraries, not automatically instrumented arbitrary Rust programs. Its README's microbenchmark and zero-cost claims were not independently reproduced. [Repository and examples](https://github.com/Anyesh/incr)

**Yabu** is a recent language project whose author describes a Rust/Cranelift first implementation and game-oriented origins. Its incremental-computation article describes a Salsa-style graph for compiler queries. Incremental compilation is not evidence that programs produced by the compiler get temporal execution. It is an adjacent language/tooling project, not a verified direct competitor for this feature. [Author's project account](https://dziban.net/posts/yabu/), [compiler computation graph](https://dziban.net/posts/incremental-computation-graph/)

These additions make the broad “native incremental computation has little competition” thesis less defensible. They do not remove the narrower opportunity identified in Entry 11.

### Practical research and reuse shortlist

The following is a prioritization judgment, not a claim that these projects can be combined without major engineering:

- **Study CEAL's historical access indexes and generated repair routines first** for the closest low-level mechanism. Retain its actual restrictions when comparing it with Tower.
- **Study LML's automatic transformation and evaluation** to understand how ordinary imperative code and native compilation interact with the instrumentation cost.
- **Inspect Skip's native pipeline and effect boundaries** for language-integrated implementation and usable abstractions.
- **Study AutoRTFM's compiler/runtime boundary** for native instrumentation, allocation and foreign-call handling. Transaction support is not the missing temporal engine itself.
- **Use Quantum/GGPO/GGRS-style replay as application baselines**, because they compete on the actual multiplayer problem regardless of whether they use the same algorithm.

No reviewed project has been verified here as a current off-the-shelf replacement for Tower's complete proposed feature. That does not mean all its algorithms need to be invented anew. The useful next evidence is a measured native implementation of the intended memory semantics on the user's workload, particularly its steady forward overhead and bounded retained history.

## 2026-09-05 — Entry 13: A quantitative investment gate, without invented game benchmarks

### Native compilation is an execution format; profitability is an accounting question

Entry 7 gives the general cost model. A normalized form makes the decision easier to apply. Over the same measured interval, let:

```text
F = ordinary forward simulation CPU cost, excluding corrections
r = conventional correction/replay CPU cost divided by F
h = extra temporal forward/history CPU cost divided by F
s = total temporal correction/pruning CPU cost divided by F

conventional total / F = 1 + r
temporal total / F     = 1 + h + s
temporal wins when    h + s < r
```

For an illustrative decomposition, write `s = k * a * r + b`: `a` is the fraction of baseline replay CPU work that must be redone, `k` is the cost multiplier for doing that work through the repair machinery, and `b` includes remaining correction and reclamation bookkeeping. This gives:

```text
h + b < r * (1 - k * a)
```

`a` is weighted computation cost, not an object count or merely a fraction of changed bytes. The parameters need not remain constant as workloads change: cache behavior, control changes and index costs can alter them. Measuring the original totals is preferable to pretending this decomposition is exact for every program.

For arithmetic illustration only, suppose `h = 0.50`, `k = 2`, `a = 0.05`, and `b = 0.05`. These are invented parameters, not measurements, literature averages or estimates for Tower:

| Baseline replay cost `r` | Conventional normalized cost | Temporal normalized cost | Outcome in this hypothetical model |
| --- | --- | --- | --- |
| 0.1 | 1.10 | 1.56 | About 42% slower overall |
| 1.0 | 2.00 | 1.65 | About 1.21× faster overall |
| 4.0 | 5.00 | 1.95 | About 2.56× faster overall |

The example demonstrates why both blanket claims are wrong: extra normal-execution overhead does not make the idea unprofitable, and skipping most replay does not automatically make it profitable. In this example the crossover is `r > 0.55 / 0.9`, approximately `0.611`.

Count actual baseline replay after batching corrections, not packet count multiplied by correction age. Correctly predicted inputs may require no replay at all in a well-implemented baseline. Equal-value propagation after genuinely changed input can still provide additional savings. Include restoring state, tracking writes, recording new trace, pruning and fallback costs consistently, with no charge silently omitted from either side.

Mean CPU is not sufficient. A result can satisfy the inequality and still fail the game because of p99 correction latency or memory capacity. Conversely, reducing disruptive correction spikes may be valuable even if average CPU savings are modest. These are separate reported outcomes.

### What the landscape does and does not imply about building a language

The evidence does not explain every predecessor's adoption history. Old repository activity is not proof that a concept failed; current commits are not proof of a successful market. There is no basis here for claiming that a lack of widely visible native game deployments means either impossible performance or guaranteed commercial opportunity.

A relevant first-party example is SkipLabs' July 2025 account: its engine uses its own LLVM-targeting language, while exposing the framework through TypeScript, and the team discusses correctness, cost and developer usability together. This demonstrates that owning a language internally and requiring every customer to adopt it are separate choices. It does not establish why every earlier incremental language did or did not gain users. [SkipLabs engineer interview](https://medium.com/skiplabs/discussion-with-lucas-a-skiplabs-engineer-0b535277a311)

My recommendation therefore remains **yes to investigating this as a distinguishing Tower capability; no to making “little native competition” the main investment thesis**. An embeddable native simulation module can validate the feature without first requiring a new renderer, complete engine or broad library ecosystem. That is a deployment strategy, not a retreat from automatic opcode/memory dependencies.

The highest-value missing evidence is now a profile of the existing game and a native repair benchmark against it. Further name collection has diminishing value unless a new candidate demonstrates closer semantics, a reusable implementation technique or relevant measured performance.

## 2026-09-05 — Entry 14: General-purpose Tower versus general-purpose CEAL

### Author clarification and correction of the comparison

Tower is a general-purpose programming language. The user would implement a game in it, but is not designing a game-only language. The compiler/AST use case was also present in the original request and proposal. Earlier entries and the preceding response overemphasized game products when assessing whether the language was worth pursuing.

**CEAL repository:** [matthewhammer/ceal](https://github.com/matthewhammer/ceal).

CEAL is itself general-purpose prior art. Its 2009 paper explicitly presents a general-purpose C-based imperative language for self-adjusting computation, with compilation through C. The repository describes an extended, restricted subset of C. Those source-language restrictions do not make CEAL a domain-specific game, UI or database language. [Original paper](https://home.ttic.edu/~chenyan/paper/ceal.pdf), [repository description](https://github.com/matthewhammer/ceal)

The later Self-Adjusting Stack Machines work makes the implementation-level overlap especially substantial: low-level instructions, an execution trace, imperative memory, automatic read-update points, and C/GCC native lowering. It is inaccurate to distinguish Tower merely by saying that CEAL does not work at instruction/memory level or requires programmers to hand-wire dependency edges. Programmer-selected memo points in that implementation are a separate reuse decision. [Later paper](https://arxiv.org/abs/1108.3265)

### Revised prognosis

- **Technical feasibility:** unchanged. General-purpose incremental execution has relevant native precedents; the user's model remains worth implementing and testing.
- **Conceptual novelty relative to CEAL:** weaker than the game-centered framing suggested. “General-purpose + imperative + native + automatic dependency-based recomputation” is not an unoccupied category. General-purpose scope is not a differentiator from CEAL.
- **Practical language opportunity:** still possible, but it must be established through the delivered language and implementation. Candidate advantages include well-defined deterministic semantics, supported-operation coverage, developer usability, modern integration, and better measured execution/history costs. None is automatically a unique feature or an already-proven Tower advantage.
- **Evidence from game products:** useful for the example workload, insufficient to establish a general-purpose market gap. The absence of a reviewed game product with the entire feature does not imply the absence of competing general-purpose languages or runtimes.

The meaningful comparison is not “Tower can make games; CEAL cannot,” nor “Tower is general-purpose; CEAL is specialized.” It is whether Tower can turn this class of execution semantics into a more useful, efficient and dependable general-purpose programming environment. CEAL provides both evidence of feasibility and a concrete baseline to learn from.

### How this changes the validation plan

Use multiple kinds of programs to assess a general-purpose implementation. Tower's own compiler work is a natural additional workload alongside the user's simulation. An ordinary data-transformation or analysis program could provide another, with dependencies still captured automatically from supported instructions rather than application-specific hand-written graphs.

The original proposal allows temporal execution to be disabled. Being general-purpose therefore does not require every program to benefit from enabling it, or require every execution to pay for retained history. Evaluate both ordinary native execution and enabled temporal execution, and make the boundary explicit.

The conclusion is **worth pursuing as a general-purpose language capability, but not because it is conceptually untouched by CEAL**. Competitive claims need precise feature comparisons and representative measurements. This scope correction changes the differentiation argument, not the soundness of automatic low-level dependency repair.

## 2026-09-05 — Entry 15: CEAL's dormancy changes the competitive assessment

The user correctly challenged treating a roughly fifteen-year-old research implementation as if it represented current product competition. Entry 10 recorded the repository's last-push date, but the interpretation and subsequent responses did not give that distinction enough weight.

Fresh read-only GitHub checks on 2026-09-05 found:

- The upstream default branch's latest commit is `cc67ef1ad336649b2362c39faaccdd08ba59d728`, committed **2011-12-15 13:43:33 UTC**. That is almost fifteen years before this investigation. [Commit history](https://github.com/matthewhammer/ceal/commits/master/), [specific commit](https://github.com/matthewhammer/ceal/commit/cc67ef1ad336649b2362c39faaccdd08ba59d728)
- The repository's last-push metadata is also December 2011. Its archived flag is false; that administrative flag is not evidence of ongoing maintenance. [Repository API](https://api.github.com/repos/matthewhammer/ceal)
- The three public forks returned by the fork-list API were `LongJohnCoder/ceal`, `yyuzhong/ceal`, and `crudemoon/ceal`. Their default-branch latest commits were checked individually and all matched the same upstream December 2011 commit. This check found no continuing development in those branches. It does not audit every branch, independent repository or private continuation. [Fork listing](https://api.github.com/repos/matthewhammer/ceal/forks?per_page=100)

**Current classification: dormant public research implementation.** “Dead” is understandable shorthand, but the evidence establishes prolonged public inactivity rather than a verified formal abandonment announcement.

This produces three different conclusions:

| Question | What CEAL establishes |
| --- | --- |
| Can general-purpose native self-adjusting execution be implemented? | Strong relevant technical precedent. |
| Is the broad mechanism unexplored or conceptually new? | No; CEAL remains prior art regardless of activity. |
| Is CEAL a maintained language product likely to compete for users today? | The checked public project provides little evidence of that. Do not count it as an active mature competitor. |

**Revised competitive prognosis:** more favorable against CEAL specifically than the earlier “substantial competition” wording implied. A usable, maintained general-purpose language can fill a practical gap even when its underlying mechanism has old research precedents. That opportunity does not depend on restricting Tower to games, or on being the first to discover the mechanism.

This is not a conclusion that all native incremental competition is dormant. Current projects such as Skip must be evaluated separately for actual supported semantics, usability and deployment. Nor does CEAL's inactivity prove a performance ceiling or explain why development stopped. Those would require additional evidence.

For future landscape updates, classify each candidate separately as **technical prior art**, **publicly active implementation**, and **credible current adoption alternative**. A long list of papers and old prototypes must not be presented as a crowded current language market.

## Open questions and next research updates

- What are the actual tick rate, correction-age distribution, incorrect-prediction rate, and replay-time profile of the game?
- How much collider cost is broad-phase discovery, ray traversal, narrow-phase testing, and constraint solving? Their best reuse boundaries may differ.
- Which simulation internals influence future results, including caches, solver state, creation order, and RNG?
- Can the first native prototype retain enough history without exceeding the intended memory budget?
- Is ordinary tracked allocation sufficiently local, or would explicitly defined stable allocation naming reduce measured coupling?
- How should Tower represent replayable regions and effects before LLVM lowering, and which optimization passes preserve that representation?
- Where is the measured threshold for abandoning fine-grained repair and performing an exact full replay?
- Can one dependency engine support both compiler queries and bounded game history cleanly, while allowing different storage policies?
- Which general-purpose language and runtime capabilities actually distinguish Tower from CEAL, LML and Skip, beyond syntax and backend choice?
- Can an automatically tracked Tower compiler workload demonstrate useful incremental behavior without hand-written semantic dependency graphs?

Future entries should record the date, source or experiment, result, limitations, and any change to the current assessment. A benchmark should include the code revision, build configuration, hardware, workload, and comparison baseline. No game speedup or near-native instrumentation overhead has been demonstrated in this journal yet.

## 2026-09-05 — Entry 16: Modern, demonstrably used alternatives

### Question being answered

The author asks to preserve the existing research, but focus the comparison on **modern and well-used competitors** to a general-purpose, open-source Tower language. Originality and patentability are not decision criteria for this entry. Earlier material is retained unchanged above.

For this scan, “modern” means maintained/currently developed, not necessarily recently invented. “Used” requires documented deployment or named users, not merely stars, endorsements, old papers, or a claim of production readiness. Where evidence supports substantial internal use but not broad independent adoption, that distinction is stated.

**Direct-match result:** no reviewed system was substantiated as both a broadly adopted modern general-purpose native language and an implementation of Tower's automatic historical opcode/memory repair contract. This is a bounded search result, not proof of nonexistence. The strongest demonstrably used alternatives are native libraries or specialized platforms that solve overlapping problems.

### Strongest established-use shortlist

| System | Evidence that people actually use it | Native route and difference from Tower |
| --- | --- | --- |
| **[Salsa](https://github.com/salsa-rs/salsa)** | Used by rust-analyzer and Astral's ty. These are deployed developer tools, not just sample programs. [rust-analyzer architecture](https://rust-analyzer.github.io/book/contributing/architecture.html), [ty developer guide](https://github.com/astral-sh/ruff/blob/main/crates/ty/CONTRIBUTING.md) | Rust library compiled natively. Authors declare inputs and tracked queries; the engine discovers dependencies within that model. It does not automatically repair arbitrary Rust instruction/memory histories. [Framework](https://salsa-rs.github.io/salsa/) |
| **[Jane Street Incremental](https://github.com/janestreet/incremental)** | Jane Street documents production use for financial computations and trading-system frontends. Strong internal deployment evidence; broad external organizational adoption was not quantified. [Engineering account](https://www.janestreet.com/tech-talks/seven-implementations-of-incremental/), [financial applications](https://blog.janestreet.com/one-more-talk-two-more-videos/) | OCaml library, compatible with native OCaml compilation. Users build incremental values/computations through its API; it does not instrument arbitrary host-language mutable memory. [Interface](https://github.com/janestreet/incremental/blob/master/src/incremental_intf.ml), [native backend](https://ocaml.org/docs/compiler-backend) |
| **[DICE / Buck2](https://github.com/facebook/buck2/tree/main/dice)** | Meta reported thousands of developers and millions of builds per day in its **April 2023** launch account. That is dated evidence of substantial use, not a newly measured 2026 usage figure. [Deployment account](https://engineering.fb.com/2023/04/06/open-source/buck2-open-source-large-scale-build-system/) | Native Rust incremental engine underlying Buck2. Users provide keyed computations and obtain dependencies through the engine's API. This is not general instruction-level historical execution repair. [Engine design](https://buck2.build/docs/insights_and_knowledge/modern_dice/), [Buck2 architecture](https://buck2.build/docs/about/why/) |
| **[Differential Dataflow](https://github.com/TimelyDataflow/differential-dataflow) / Materialize** | Materialize documents named production deployments, including Neo Financial's fraud-system feature store. This supports actual use of the engine through a product; it does not establish a count of direct library adopters. [Neo Financial account](https://materialize.com/customer-stories/neo-financial/) | Native Rust dataflow infrastructure. Materialize exposes SQL and maintains changing collections/views with Timely and Differential Dataflow. The computational model is dataflow, not automatic dependency capture inside arbitrary imperative code. [Product engine](https://materialize.com/docs/get-started/), [dataflow model](https://materialize.com/docs/get-started/arrangements/) |

These are credible alternatives when developers are willing to structure a program around their APIs or data model. They should not be presented as already delivering Tower's proposed language-wide execution behavior.

Jane Street also reports extensive internal adoption of Bonsai, whose current package depends on Incremental. That is additional ecosystem-use evidence, but those browser applications are not themselves evidence of native deployment. [2024 account](https://blog.janestreet.com/icfp-2024-index/), [package dependency](https://github.com/janestreet/bonsai/blob/master/bonsai.opam)

### Modern candidates that need a more qualified adoption label

**[Skip / SkipLabs](https://github.com/SkipLabs/skip): active and technically relevant, but broad adoption not established.** The native compiler/runtime is real, and the current project is developed. Its current public interface emphasizes reactive backend services using collections and mapping computations. The inspected homepage offers endorsements, but they are not evidence that the endorsers' employers deploy it. The company's account of earlier Facebook work also should not be transformed into a claim of widespread present-day Skiplang adoption. [Current model](https://skiplabs.io/docs/introduction), [project site](https://skiplabs.io/), [company timeline](https://skiplabs.io/about)

**[Feldera](https://github.com/feldera/feldera): active, with named real users, but broad adoption unquantified.** Its site includes attributable usage statements from Eviny, Oso and Solana Vibe Station. That is stronger than a list of logos, but not sufficient to characterize it as a widely adopted general-purpose language. It compiles SQL through Rust to native execution, using a specialized incremental dataflow model. [User statements](https://www.feldera.com/), [compilation pipeline](https://www.feldera.com/blog/correctness-at-feldera)

### Fresh maintenance check

The public GitHub API was queried on 2026-09-05. All repositories below had `archived = false`. These dates are **last-push metadata**, not adoption figures or a guarantee of support.

| Repository | Last push, UTC date |
| --- | --- |
| [salsa-rs/salsa](https://github.com/salsa-rs/salsa) | 2026-09-04 |
| [janestreet/incremental](https://github.com/janestreet/incremental) | 2026-07-10 |
| [facebook/buck2](https://github.com/facebook/buck2) | 2026-09-05 |
| [TimelyDataflow/differential-dataflow](https://github.com/TimelyDataflow/differential-dataflow) | 2026-09-04 |
| [MaterializeInc/materialize](https://github.com/MaterializeInc/materialize) | 2026-09-05 |
| [feldera/feldera](https://github.com/feldera/feldera) | 2026-09-05 |
| [SkipLabs/skip](https://github.com/SkipLabs/skip) | 2026-09-03 |

### Additional language check, outside the direct native-opcode shortlist

**SWI-Prolog** has language-integrated incremental tabling: declared incremental predicates participate in a dependency graph, and unchanged answer sets can stop further reevaluation. That is a real general-purpose language feature, not just an incremental compiler. However, its documented execution model uses virtual-machine code, and its incremental contract concerns predicate tables rather than arbitrary imperative loads/stores. Overall Prolog usage is also not a measure of adoption of this particular feature. It therefore does not establish a well-used direct match for Tower's native opcode model. [Incremental tabling](https://www.swi-prolog.org/pldoc/man?section=tabling-incremental), [execution model](https://www.swi-prolog.org/pldoc/man?section=runcomp)

### Practical conclusion

For the author's actual decision, the current competitive set is best described as **existing native languages plus production-used incremental libraries**, with specialized SQL/dataflow platforms for suitable workloads. A modern, widely used standalone language offering the complete proposed automatic temporal machine was not identified.

That leaves a plausible practical opening for Tower without requiring it to be a game language or an unprecedented idea. The useful comparison is the programming effort, coverage, performance and tooling a developer gets from Tower versus adopting one of the maintained alternatives above. No new native benchmark or deployment audit was performed in this entry.

## 2026-09-05 — Entry 17: What a C-like temporal control API could actually look like

### Scope and status

The author asks how a thin, C-like language over LLVM would express “go back, change something, return to the corrected present,” without first solving source-language memory safety. This entry proposes an API and its semantics; it is not an existing Tower implementation or a claim that LLVM already supplies these operations. The original temporal document was reread in full, particularly its middle-of-execution store insertion and overwrite examples. Earlier research and the original proposal are preserved.

The recommendation is **edit a retained execution history, then repair the present**. The controlling caller need not jump onto an old stack. A separate literal rewind/inspection interface can exist, but is not necessary for correction.

### The two kinds of progress

A controller receives new information and decides what history to amend. The tracked computation has its own logical instruction history. In the simplest design, the controller calls into tracked code synchronously and requests repairs between calls. The controller's stack, packet reception, edit handles and repair invocation are outside the history being repaired. This is a runtime boundary within one general-purpose program, not a requirement for two processes, a game engine or a query framework.

```text
Controller:       receive correction -> edit history -> repair() -> read corrected output
Tracked history:  unchanged prefix -> amended event -> repaired/reused remainder
```

This avoids a self-reference problem: repairing a computation does not also erase the external instruction that requested its repair. Supporting an edit request originating inside tracked code is possible as a richer language feature, but would need an explicit rule such as yielding a request to the controller; it must not be silently replayed as an ordinary application store.

### Small proposed interface

The spellings below are illustrative compiler builtins / runtime calls, not portable C declarations or existing LLVM intrinsics. Typed conveniences can lower to address-plus-byte-count primitives.

| Operation | Proposed meaning |
| --- | --- |
| `temporal_create()` | Create a tracked execution domain and retained history. |
| `temporal_call(t, fn, args...)` | Append and execute an instrumented invocation. Capture its argument values and retain its dynamic trace. Its ordinary internal calls, arithmetic and memory operations are automatically supported by the compiler. |
| `temporal_mark()` | Inside tracked execution, return an opaque handle to the gap immediately after this dynamic occurrence. Does not inherently copy the heap or stack. |
| `temporal_write(t, address, bytes, size)` | From the controller, append and apply an externally supplied raw-memory write; return a handle to that particular write event. Copy the supplied bytes into the event rather than borrowing the controller's temporary buffer. |
| `temporal_edit(t)` | Begin a correction batch against the current retained revision. No new forward execution or external observation of partially repaired state occurs during the batch. |
| `temporal_replace(e, write, bytes, size)` | Replace the payload of an externally supplied write event, preserving its address and position. |
| `temporal_store_at(e, point, address, value)` | Insert a new externally supplied typed store at the historical gap. The low-level form takes address, bytes and size; the operands are captured from the controller now. Return a write handle so a later correction can revise the same intervention. |
| `temporal_repair(e)` | Apply the batch and bring the tracked execution to its defined current boundary, reusing valid retained work. Return normally to this caller with success or a defined failure status. |

The API does not require a manually wired dependency graph. `temporal_call` establishes what is recorded; it is not the granularity of invalidation. A call containing a million independent instructions need not be treated as one indivisible recomputation. Likewise, a marker names an edit position, not a dependency bucket or a mandatory whole-state checkpoint.

There are two kinds of stores in this surface API, but ordinary program stores are not required to become explicit API calls in source code. They are instrumented automatically. The distinction here is between a computation-generated store and an outside intervention that the controller is allowed to revise.

### Exact translation of the document's middle-of-execution example

Assume `i32` has the defined arithmetic semantics chosen by Tower, and the arrays remain live for the duration of retained execution.

```c
// Compiled with automatic temporal instrumentation.
Point calculate(i32 *m, i32 *answer) {
    i32 a = m[0];
    i32 b = m[1];
    i32 c = a + b;

    Point p = temporal_mark();

    i32 d = m[2];
    i32 e = m[3];
    i32 f = d + e;
    *answer = c * f;
    return p;
}

// Controller: outside the history being repaired.
Timeline *t = temporal_create();
i32 m[4] = {3, 5, 9, 1};
i32 answer = 0;
Point p = temporal_call(t, calculate, m, &answer);
// answer == 80; calculate's ordinary native invocation has returned.

Edit edit = temporal_edit(t);
Write intervention = temporal_store_at(edit, p, &m[3], (i32)2);
temporal_repair(edit);  // Check success in a real API.
// This caller continues here; answer == 88 and m[3] == 2.
```

Its meaning is the same as a fresh execution of the calculation with `m[3] = 2` inserted immediately after the marker, under the same initial memory and other external inputs. The old computations of `a`, `b`, `c` and `d` remain valid. The load for `e`, addition for `f`, multiplication and output store change. The runtime can retain and reuse the unaffected computation instead of entering the old C frame or reexecuting the whole function. This describes the desired semantics and reuse opportunity, not a measured implementation.

The intervention persists in the revised history. A second edit can replace `intervention` with a different payload; it is not a temporary memory poke that disappears when another earlier input is repaired.

The example deliberately writes its result through tracked output memory. An ordinary integer already copied into controller memory is not magically rewritten by repair. A real interface can offer a result handle for re-reading a revised return value, or use stable tracked output storage as above.

### Translating the existing snapshot/replay controller

The user can keep frame numbers in their application. The generic runtime only sees external writes and instrumented calls:

```c
// Forward execution, repeated at each application-defined frame.
input_write[frame] = temporal_write(
    t, &input, &predicted, sizeof input);
temporal_call(t, simulate_step, &world, &input);

// Later, while the controller is at frame 110:
Edit edit = temporal_edit(t);
temporal_replace(edit, input_write[100], &actual, sizeof actual);
temporal_repair(edit);
// Still in this controller at frame 110, now observing corrected tracked state.
```

Here `input`, `predicted` and `actual` have the same representation and initialized bytes. Tracked state is initialized before its first use, stays available throughout retention, and is not independently mutated by the controller outside declared external writes. Pointer arguments refer into this tracked memory; values in the controller's packet buffers are copied into write events.

This replaces the controller's sequence “restore snapshot 100, discard future, rerun through 110” with “replace the input write at 100, repair through the retained call boundary at 110.” It does not specify that the runtime understands frames, players or world structs. All reachable supported operations inside `simulate_step` are tracked, regardless of the application's storage layout.

Each later external write to the same input buffer is a separate event and naturally bounds the visibility of the earlier input write. Later state can still change through computation-derived writes to other memory. This proposed controller schedule holds the remaining externally supplied input values fixed; if future predictions themselves should be recomputed from corrected inputs, those prediction computations must be inside tracked execution or their external values must also be revised. The runtime cannot derive dependencies through untracked controller calculations.

If the supplied bytes are exactly unchanged, the replacement need not initiate substantive repair. If multiple corrections arrive together, batching them avoids repairing intermediate combinations that will immediately be superseded.

### Store placement is the meaning, not an implementation detail

These two cases are materially different:

```c
input = predicted;
Point p = temporal_mark();
consume(input);
```

Inserting `input = actual` at `p` changes the consumed value. Inserting it before `input = predicted` does not: that later store overwrites the intervention. Replacing the original externally supplied input-write event avoids this placement mistake.

```c
i32 x = *ptr;
Point p = temporal_mark();
consume(x);
```

Inserting `*ptr = 123` at `p` does not change `x`, which was loaded earlier. To change that loaded value, insert before the load or define a separate operation that explicitly overrides an instruction result. Historical memory editing is not implicit retroactive mutation of every register that ever read that address.

Similarly, assigning `input = actual` in present-day native memory is not sufficient to identify which historical write is being corrected. The event handle or explicit timepoint supplies information the address alone cannot encode.

### What a timepoint identifies

A point is a position in a particular retained dynamic execution, not a wall-clock timestamp, frame number, source line, native instruction address or permanently fixed instruction count. A loop can execute the same source instruction thousands of times. A changed branch can add or remove occurrences. A plausible implementation uses a trace/domain identity plus an occurrence identifier, insertion side and revision/generation validation; the representation can remain opaque.

For the first implementation, explicit `temporal_mark()` sites make user-accessible locations clear. Compiler/runtime tooling could later expose arbitrary retained instruction gaps. Restricting public marks does not require coarsening all dependency tracking to marked blocks. Conversely, promising editability at every source-level operation creates an optimization/identity contract; the compiler cannot simply erase a promised edit point and pretend it remains addressable.

If a later revision deletes the branch containing an interior marker, that marker must not silently become the next execution of the same source line. A simple initial policy is to reject an edit whose anchor no longer exists, including an existing intervention made unreachable by an earlier correction. Another possible policy is to make the intervention conditional on that occurrence continuing to exist. These are alternative language contracts, not interchangeable implementation details. Persistent external input events and externally scheduled call boundaries provide much easier anchors for the common correction workflow.

### What “back to the present” means after control flow changes

The target cannot universally be “the old final instruction,” because revised execution might never execute it. For the examples above, define the present as completion of the same ordered externally scheduled invocations, with their input events amended. Internal loops, branches and calls are free to change. For an independently running tracked program, define a suspension/yield boundary or another explicit stopping rule instead.

If a corrected invocation diverges, traps, encounters an invalid intervention, or exceeds a resource limit, repair need not reach that boundary. The API must report or suspend that outcome rather than claim that every possible edit has a corrected finite present. A repair-in-progress state is not a valid published current result. Preserving the previous revision after a failed repair requires additional staging/rollback machinery; it is not free merely because the API uses an edit batch.

Two coordinates help: execution position within a history, and revision number of that history. Amending a past event produces a newer revision whose current boundary may be logically the same application frame. The controller itself always proceeds forward while revising that separate history.

### What the native runtime must actually do

The conceptual invariant for a repaired load at position `q` is: **observe the latest preceding covering store in the revised history**, or initial memory if there is none. With overlapping accesses, apply that rule to the relevant byte ranges. Blindly executing a repair load against the physical present-day heap is generally wrong, because that heap may contain later stores. The runtime needs historical memory lookup or a correctly reconstructed logical memory view for the region it executes, including newly discovered loads.

The compiler also needs a way to execute an affected computation with its logical operands after its original native frame has returned. It can emit native repair entry points with retained activation/SSA data, or reconstruct a larger region and reexecute it. Branch repair removes obsolete trace occurrences and writes, executes newly selected control flow, and reconnects valid retained work. No inverse arithmetic instruction is necessary: `undo` can mean retiring a recorded effect, not mathematically inverting its opcode.

One possible internal vocabulary, separate from the user-facing control API, is tracked load/store operations, dynamic activation/control records, markers, external-write edits and change propagation. Ordinary arithmetic can remain native arithmetic inside generated forward and repair code, with compiler-derived operand relationships. This does not require one heap graph object or one indirect function call per arithmetic opcode. The actual storage and scheduling design remains to be implemented and measured.

LLVM's coroutine documentation illustrates native lowering into entry/resume functions plus storage for values that survive suspension. That is a useful implementation analogy, not a turnkey temporal runtime: an ordinary coroutine preserves its current suspension state, not every past activation or dependency. [LLVM coroutine lowering](https://llvm.org/docs/Coroutines.html)

LLVM's `returns_twice` attribute accommodates functions such as `setjmp`; `llvm.stacksave` / `llvm.stackrestore` concern stack-allocation state. Neither supplies a retained heap history or selective change propagation. Those mechanisms should not be mistaken for the temporal engine itself. [LLVM language reference](https://llvm.org/docs/LangRef.html#function-attributes), [stack intrinsics](https://llvm.org/docs/LangRef.html#llvm-stacksave-intrinsic)

The surface can therefore be thin and C-like while the implementation is a substantial compiler transformation plus runtime. Native output is compatible with the design; near-uninstrumented performance is not established by these APIs.

### Why not use setjmp as the primary interface?

`setjmp` / `longjmp` restore a saved calling environment, not arbitrary historical object values. Accessible objects generally retain their values from the moment of `longjmp`, and some modified automatic variables become indeterminate. Jumping to an environment whose containing function has already returned is invalid. These semantics do not provide the returned-function example above. [GNU C Library documentation](https://sourceware.org/glibc/manual/latest/html_node/Non_002dLocal-Details.html)

A language can offer a stronger captured continuation, with retained state and an explicit resume operation. That is a possible surface design, not a requirement. It still needs the memory-history and repair engine, and must define what happens to the controller that requested the edit. For initial Tower development, a normal `repair()` call is easier to specify and use.

Historical inspection should also be separate: an optional `read_at(point, address, size)` can return old bytes without changing the current timeline. A literal `seek`/resume interface would additionally choose a current historical view and continuation. Neither operation has to be exposed to users who only want to correct inputs.

### Inserting more than a constant store

The same model can later support `temporal_insert_call(edit, point, compiled_fn, captured_args...)`: splice a new invocation of already instrumented code into the history and repair its consequences. This is not necessarily runtime code generation or a native instruction patch. Reads performed by that invocation observe its historical position and create ordinary tracked dependencies.

Keep these meanings distinct: `store_at(..., value)` captures bytes computed by the controller now; an inserted function that executes `*p += 1` reads the value at that historical position and should be reevaluated if that value changes in a subsequent revision. A host closure does not magically capture an old stack's locals. Old operands require an explicit historical value/activation interface or a compiled continuation whose environment the runtime retained.

Replacing an arbitrary computation-generated store's payload is also more than replacing an input: it is an intervention on the program's result. The language would need to say whether the original producer is still evaluated and whether its next reevaluation reinstates the original value. External-write replacement plus historical store insertion avoids leaving that ambiguity in the first API.

### Deferring memory safety without losing the execution contract

This prototype need not use ECS, ownership types, a borrow checker or garbage collection. Raw pointers and manually managed allocation are a possible initial surface. However, an address used in a historical edit must designate meaningful memory at that historical position; a current allocation at the same numeric address need not be the old allocation. Retained activations and allocation lifetimes still need runtime treatment, or an initial valid-program contract such as fixed live allocations throughout a test.

Separately, LLVM primitives are not a deterministic total machine by default: LLVM specifies immediate UB, poison and undef, and `freeze` can select a nondeterministic value. A research prototype can restrict correctness to supported, well-defined executions rather than first implementing a memory-safe language. If Tower continues to promise no UB for all programs, it eventually must lower unsupported corner cases to explicitly defined behavior or traps. [LLVM UB manual](https://llvm.org/docs/UndefinedBehavior.html)

For a first implementation, single-threaded tracked execution and edits at quiescent controller boundaries are a sensible narrowing. External clock/random/network/file results must be captured as inputs or otherwise given declared semantics; externally visible effects are not automatically erased when a trace is repaired. The new API does not remove those previously documented boundaries.

### Proposed implementation order and verification obligations

1. Fix the semantics of external write replacement and completion of a finite recorded call sequence. Use raw fixed-lifetime memory and supported deterministic operations initially.
2. Add marker-based insertion of historical constant stores, including write handles for later revision of an intervention.
3. Validate changed control flow, indirect and overlapping memory access, allocation history and stale-point handling before claiming unrestricted editability.
4. Add historical inspection and inserted compiled calls if useful. Literal stack-jump time travel is not required to validate the core capability.

Correctness tests should compare with fresh execution of the same initial state, external event schedule and explicit interventions. Directed cases include a store inserted before/after a load, an intervention overwritten before consumption, identical replacements, several same-address input-write events, changes to branches and allocation lifetime, invalidated edit anchors, and a repaired result whose original function already returned. Existing journal diagnostics do not implement this full API or prove its control-flow semantics.

**Outcome:** a concrete, general-purpose API can be small and unsurprising: identify a historical event or gap, amend it, and call repair while remaining in the present. The difficult work is native historical execution and trace maintenance behind that interface, not finding a magical backward jump instruction. This entry contains design analysis and checked primary-source documentation, not a new native implementation or performance result.

## 2026-09-05 — Entry 18: Rough signatures and the meaning of a Write handle

The author asks what `temporal_write` returns and requests signatures for the proposed interface. This is a clarification of the Entry 17 design, not an implemented API or a new external-research finding.

**`temporal_write` returns a `Write` handle identifying one particular externally supplied write event in the timeline.** It does not return the old value, the destination pointer or a byte count. Two calls targeting the same address produce different handles because they denote different events. The runtime's event record associates that identity with its timeline position, destination range and copied payload. The handle need not contain that information inline.

### C-shaped control interface

The integer-sized handle representations below are illustrative opaque tokens, not a settled ABI. Validation can look up timeline ownership, generation and liveness through runtime metadata. The two status values only stand in for a future detailed error model.

```c
#include <stddef.h>
#include <stdint.h>

typedef struct Timeline Timeline;
typedef struct Edit Edit;

typedef struct { uint64_t id; } Point;
typedef struct { uint64_t id; } Write;
typedef struct { uint64_t id; } Invocation;

typedef enum {
    TEMPORAL_OK,
    TEMPORAL_ERROR
} TemporalStatus;

// Controller: create/release runtime history, not ownership of user allocations.
Timeline *temporal_create(void);
void temporal_destroy(Timeline *t);

// Tracked execution only: mark the gap after this dynamic occurrence.
Point temporal_mark(void);

// Controller: append/apply an external write at the current end of execution.
// Copies 'size' bytes from 'bytes'; returns the new event's identity.
Write temporal_write(
    Timeline *t, void *address, const void *bytes, size_t size);

// Controller: begin a batch of amendments to retained history.
Edit *temporal_edit(Timeline *t);

// Stage a new payload for this existing external write event.
// Destination and historical position stay fixed; size must match initially.
TemporalStatus temporal_replace(
    Edit *edit, Write event, const void *bytes, size_t size);

// Stage an additional write at a past point, copying the payload now.
// Returns a provisional handle, invalidated if the edit is cancelled.
Write temporal_store_at(
    Edit *edit, Point point, void *address,
    const void *bytes, size_t size);

// Repair to the defined current boundary; consumes the edit on success.
TemporalStatus temporal_repair(Edit *edit);

// Discard unexecuted staged amendments and consume the edit.
void temporal_cancel(Edit *edit);
```

`temporal_mark()` implicitly uses the currently executing tracked domain; it is not callable from arbitrary controller code without such an execution. `temporal_write`, editing and repair are controller operations at quiescent boundaries. No ordinary forward execution is appended while an edit batch is open.

Allocation failure, invalid handle return representations, detailed error categories and recovery after a failed/incomplete repair remain unspecified in this rough interface. Cancellation before repair does not promise to undo partially performed repair work. Destroying the timeline invalidates its handles and releases retained runtime history; it is not an instruction to free arbitrary application memory reachable from that history.

### Typed calls are compiler builtins, not ordinary C varargs

The earlier shorthand `temporal_call(t, function, arguments...)` needs compiler knowledge of the function signature. In schematic generic notation, **not literal C syntax**:

```text
R temporal_call<R, Args...>(
    Timeline *t, R (*function)(Args...), Args... arguments);

Invocation temporal_insert_call<R, Args...>(
    Edit *edit, Point point,
    R (*function)(Args...), Args... arguments);
```

`temporal_call` immediately appends/executes a tracked invocation and returns its ordinary initial result of type `R`. `R` can be void. It retains the function identity, argument values and execution needed for repair. The previously shown `calculate` function returns `Point`, so its wrapper call also returns `Point`.

`temporal_insert_call` stages an invocation at a historical gap and returns a provisional **invocation-event handle**, not the function's `R` result. The inserted function executes during repair, so that ordinary result is not available synchronously when insertion is requested. In this minimal sketch, useful outputs can be written into tracked memory. A future observation API could expose the invocation's revised return value through the handle.

Arguments are captured by value, not by deep copy of reachable memory: pointer arguments retain pointer values, and their pointees are read/written through tracked memory when the function executes at its logical position. An ordinary result already copied into the controller does not automatically change on later repair. These signatures do not mean that a C variadic function can inspect arbitrary native calling conventions; a literal C ABI would instead require generated typed wrappers or argument/result descriptors.

### Example using the byte-oriented signatures

```c
Input input = {0};
Input predicted = /* externally supplied value */;
Input actual = /* later authoritative value */;

Write w = temporal_write(t, &input, &predicted, sizeof input);
temporal_call(t, simulate_step, &world, &input);  // typed compiler builtin

// Later, outside tracked execution:
Edit *edit = temporal_edit(t);
temporal_replace(edit, w, &actual, sizeof actual);
temporal_repair(edit);  // Check return statuses in real code.
```

For a new historical store rather than replacement:

```c
i32 replacement = 2;
Edit *edit = temporal_edit(t);
Write inserted = temporal_store_at(
    edit, p, &m[3], &replacement, sizeof replacement);
temporal_repair(edit);
```

This expands the previous typed convenience `temporal_store_at(edit, p, &m[3], (i32)2)` into an address-plus-bytes primitive. The runtime copies `replacement`'s bytes when staging the edit, so it does not borrow that local variable's storage for future repairs. The destination memory has a different lifetime requirement: it must remain meaningful in the relevant tracked history.

Handles are bound to their owning timeline and retained events. Pruning history, removing a dynamic occurrence or cancelling its staging batch can invalidate a handle; runtime tokens must not silently alias a different later event. Exact retention and repair-failure contracts remain separate implementation work.

**Outcome:** distinguish three small identity values (`Point`, `Write`, `Invocation`) from runtime-owned objects (`Timeline`, `Edit`). Most of the surface is a normal byte-oriented C API. Arbitrarily typed tracked calls and optional typed store conveniences require compiler-supported lowering, while dependency instrumentation stays automatic inside tracked code.

## 2026-09-05 — Entry 19: One implicit history and automatic tracking across every ordinary call

### Correcting an unnecessary API assumption

The author asks what multiple timelines mean and why calls would need `temporal_call`: remembering to wrap selected calls sounds easy to get wrong. This is a valid objection to the presentation. Entries 17–18 introduced an **embedding-library API** with a controller outside tracked execution; that is one possible host interface, not a requirement of the temporal-opcode model or the recommended everyday surface of a general-purpose Tower language.

For temporal-enabled Tower execution, **ordinary calls should remain ordinary calls, with automatic tracking throughout the supported application execution**. The earlier `temporal_call` wrapper was intended to enter a recorded invocation from an untracked host, not to require wrappers at every nested call. It nevertheless obscured the simpler whole-program option and left too much room to confuse user-selected call boundaries with automatic instruction coverage.

Earlier entries are preserved as the embedding design. The default language-facing recommendation is now explicit: **one implicit execution history, entered by the language runtime, with no manual wrapping of application calls**. Multiple runtime instances and explicit host entry calls can remain optional embedding features.

### Function calls are not tracking boundaries

In a program launched with temporal execution enabled:

```c
i32 read_plus_one(i32 *p) {
    return *p + 1;
}

i32 twice(i32 *p) {
    return read_plus_one(p) * 2;
}

void main(void) {
    i32 x = 10;
    i32 result = twice(&x);
    // Loads, arithmetic, calls and their consumers participate
    // in the same tracked execution. No temporal_call wrappers.
}
```

This coverage includes supported ordinary calls, recursion, function-pointer calls, callbacks into Tower, and instructions after a call returns. Inlining must preserve the temporal semantics too. A callee's access to global or aliased memory is still an access in the same tracked memory history; the system cannot restrict tracking to memory syntactically passed as function arguments.

Tracking activation is an execution/compiler-runtime mode, not an instruction to the author to identify all functions worth memoizing. The implementation still has a root entry into application execution, but the runtime can supply it when launching `main`. Compiler-generated internal calling conventions may pass a context implicitly without exposing that parameter at every source-level call.

The embedding form remains meaningful when a conventional host intentionally runs a temporal module:

```c
// Optional embedding interface, not ordinary Tower application style.
temporal_call(t, entry_function, arguments);
```

All supported code transitively executed within that invocation is tracked. If the host then uses a returned value in its own untracked calculation, that calculation is outside the repair contract. This is a real boundary, not a mechanism for automatically updating an arbitrary uninstrumented host. Whole-application tracking avoids requiring application authors to create such boundaries between their own functions.

### What a timeline instance would mean

In the earlier API, a `Timeline` denotes a retained execution history, its current execution boundary and the associated logical memory versions/dependencies. An independent instance would let an embedding host manage another independent execution. It is not intrinsically a thread, function, ECS component, bucket, subsystem or performance partition.

One timeline can contain many independent dependency regions. Sharing a history does **not** force all instructions to be redone when any value changes. Memory access patterns and actual dependencies provide selective reuse inside that history. There is no need to assign a separate timeline to each region to obtain this benefit.

Supporting several independent histories also does not automatically mean supporting alternate branches of one history. Forking a past state into two alternatives would require separately specified memory views, handle validity and branching semantics. A correction can instead replace the current history revision without exposing a multi-branch feature.

For the initial language design, use one implicit history. `temporal_create` and a `Timeline *` argument need not appear in ordinary Tower code. Timepoints and write-event handles refer to that current history automatically. This simplifies the surface without removing the runtime's internal execution context.

### Shared mutable memory prevents pretending histories are independent

Suppose one purported timeline writes `*p`, another reads it and stores a derived result, and the first later corrects that historical write. If there is no cross-history dependency and ordering mechanism, the second history's result can become stale. Merely tagging operations with two different context IDs does not make that safe.

Options for a multi-instance embedding design include isolated mutable state, truly immutable shared state, explicit versioned communication that propagates corrections, or a unified causal history. A bare pointer to mutable memory is not sufficient to establish any of those contracts. Threads sharing application memory likewise cannot be made independent merely by assigning one history per thread.

This is another reason not to introduce multiple independently editable timelines in the initial language interface. It is an optional capability with extra semantics, not a prerequisite for temporal opcodes or selective recomputation.

### The compiler/runtime must enforce supported coverage

The desired contract is not “remember to wrap every call correctly.” Within supported Tower execution, leaving a call syntactically ordinary must not disable tracking. Compiled function bodies, indirect-call targets and relevant memory operations must participate in the temporal implementation or use a declared integration mechanism.

An uninstrumented native library, inline assembly, a system call or a device-originated memory modification cannot silently be treated as an ordinary tracked application operation. A language implementation must provide appropriate lowering/adaptation, model external inputs and effects, or reject/trap the unsupported escape. An explicit unsafe escape could waive the guarantee, but then the waiver must be visible rather than an accidental consequence of forgetting a wrapper. This is a proposed enforcement requirement, not a claim that the current repository implements it.

Application-written allocators are application computations: relevant allocator state must participate in tracking. The temporal runtime's own trace-storage allocator and history-management metadata are a different implementation layer and must not recursively record their bookkeeping as application behavior.

### Whole-application tracking does not by itself settle repair control flow

There is an important limitation to the earlier “repair returns here normally” explanation. It is straightforward for an **untracked host** that waits while its tracked child execution is repaired. It is not automatically valid for an arbitrary call located inside the very application history being amended: the correction could eliminate that call occurrence, change its enclosing branch or invalidate its local operands.

For a whole-application language, the runtime can receive corrections as control requests, capture their payloads outside application history, pause at a supported boundary, repair the application and resume according to an explicit continuation policy. That control boundary can be supplied by the runtime rather than manually placed around every function. However, the exact safe-point/resumption semantics still need design; silently assuming the old source location always exists is not a solution.

The invariant is that application computation is tracked while history-management commands and their bookkeeping are not recursively treated as ordinary effects of the history they amend. External input/output boundaries also remain explicit runtime responsibilities. Eliminating `temporal_call` from user code removes a manual entry wrapper; it does not eliminate those fundamental control/effect distinctions.

**Outcome:** the user's expectation is correct: all supported ordinary application calls and memory accesses should participate automatically. Recommend one implicit tracked execution for Tower, keep explicit timelines/call wrappers only as an optional embedding API, and separately specify runtime repair/resumption and foreign-operation enforcement. This entry updates the interface recommendation; no implementation or new performance result is claimed.

## 2026-09-05 — Entry 20: Validating a repairable subsystem inside an ordinary host

### Question and scope

The author describes their existing engine: simulation state is architecturally private, outside changes enter as per-frame inputs, and only the simulation rewinds. The presentation, sound and surrounding imperative engine continue normally. The author then explicitly requests substantial research and validation. This entry records that investigation; Entry 21 handles the subsequent clarification that such boundaries must compose recursively in a **general-purpose** language.

**Finding:** the described separation is technically well-founded and directly documented in independent systems. It is one useful composition, not a required permanent division of all Tower programs. The outer host need not become another editable timeline. The inner computation can contain arbitrarily many functions and dependency regions within one history.

### Primary-source checks

The investigation read the relevant primary documentation and paper sections, including explicit limitations. The following are different kinds of evidence, not interchangeable demonstrations of Tower's complete proposed machine:

| Source inspected | What it establishes | Limit of that evidence |
| --- | --- | --- |
| [GGPO developer guide](https://github.com/pond3r/ggpo/blob/master/doc/DeveloperGuide.md), state/input definition and rendering separation | Encapsulated deterministic state, explicit inputs, simulation without rendering, and presentation-only audio/video outside rollback state. Its example uses a single state struct. It also identifies RNG, clocks and hidden static state as hazards. | Snapshot/reexecution architecture, not automatic opcode-level selective repair. |
| [Quantum: Events vs Polling](https://doc.photonengine.com/quantum/v3/concepts-and-patterns/events-vs-polling) | The ordinary Unity view reads the simulation Frame after updates. The documentation requires outside access to be read-only and distinguishes predicted from verified presentation. | A documented usage contract does not prove unsafe C# cannot violate it. |
| [Quantum: Systems](https://doc.photonengine.com/quantum/v3/manual/quantum-ecs/systems), stateless-system requirement | Mutable simulation state must belong to the Frame rather than hidden fields in system objects. | An ECS-specific way to contain state, not a requirement that Tower use ECS. |
| [Quantum: Input](https://doc.photonengine.com/quantum/v3/manual/input), Polling in Unity | Device information is collected outside and submitted as input data; commands provide another explicit ingress route. | Does not imply that keyboard inputs are the only possible external data in a general-purpose language. |
| [CEAL paper](https://home.ttic.edu/~chenyan/paper/ceal.pdf#page=3), section 2 and Figures 2–3 | Ordinary-C mutator code starts a retained core, changes its data through a supported interface, and requests propagation. Recursive core calls are ordinary calls inside the example. | A concrete host/core design, not a mandate to copy CEAL's source restrictions or to permit only two application layers. |
| [Self-Adjusting Stack Machines](https://arxiv.org/pdf/1108.3265), sections 4 and 8.1 | A specified tracing machine has conditional from-scratch consistency; mixing untraced foreign memory access requires restrictions that this implementation did not enforce. | Does not prove Tower's arbitrary LLVM coverage or proposed history-edit API. |
| [Epic AutoRTFM engineering account](https://www.unrealengine.com/tech-blog/bringing-verse-transactional-memory-semantics-to-c?lang=en), compiler/runtime sections, published March 2024 | A native compiler uses instrumented function versions throughout dynamic transaction execution, including indirect calls, and aborts when a required version is unavailable. | The described implementation records writes for rollback, not historical reads and selective forward repair. No Tower performance conclusion follows. |
| [Wasmtime security design](https://docs.wasmtime.dev/security.html) and [deterministic execution requirements](https://docs.wasmtime.dev/examples-deterministic-wasm-execution.html) | Memory isolation and mediated imports are practical runtime mechanisms. Deterministic execution additionally needs deterministic external APIs and defined handling of permitted nondeterminism. | Isolation alone is not temporal consistency. Using Wasm is not required for Tower. |

The old research papers are being used to check execution semantics, not to revive dormant projects as current competitors or make an originality argument.

### Why the subsystem boundary is sufficient in principle

The following is a design argument, not a new proof of an implemented Tower runtime. Let `P` be the supported deterministic inner program, `M0` its initial logical state, `I` its recorded input-event history, and `F` a defined execution boundary. The reference contract is:

```text
current inner state = Execute(P, M0, I, through F)
```

Correct an input to obtain `I'`. Full restore/replay computes `Execute(P, M0, I', through F)`. A correct selective repair implementation must produce the same observable logical state under the same machine/address semantics. Provided that contract is met, the host can consume the corrected result without itself being replayed. How the inner state was obtained is not part of that interface.

This relies on all influences on the inner execution being included in its state, recorded inputs, immutable data or supported runtime semantics. It also requires the host to observe a completed consistent result rather than an intermediate repair state. A replay that diverges or traps is not guaranteed to reach `F`; failure and suspension remain part of the runtime contract.

No entire-world snapshot or deep-copy export is mandated by this boundary. A host may inspect a stable read-only view at a synchronized point, or copy selected output data. A borrowed view needs a lifetime rule across subsequent execution, allocation and repair. Wasmtime's [memory API documentation](https://docs.wasmtime.dev/api/wasmtime/struct.Memory.html) provides a concrete analogous warning: reentering a guest can mutate memory, and memory growth can invalidate raw host pointers. That is a lifetime lesson, not a temporal implementation.

### Adversarial boundary checks

These are semantic counterexamples and requirements, not claimed executable tests of Tower:

| Attempt | Result under the proposed contract |
| --- | --- |
| Host reads a completed inner result for display, then later reads the repaired result | Valid. Old displayed pixels are not promised to be rewritten retroactively. |
| Host writes inner memory through an alias without creating a recorded input/intervention | Invalid escape: the write lacks a position in the retained input history. |
| Inner code reads an outer variable that can change, although it never writes outside its arena | Still an invalid escape unless that observation is explicitly captured/versioned. Write isolation alone misses this case. |
| Inner code shares genuinely immutable lookup data with the host | Compatible with the contract; changing such data requires a new declared input/version rather than pretending it stayed immutable. |
| Inner code calls another supported instrumented function, including indirectly | Must remain tracked automatically. Function boundaries are not opt-out boundaries. |
| Inner code invokes a library or device effect with no temporal integration | Must be adapted, modeled or rejected if the guarantee is to hold. |
| Host transforms an earlier speculative output into a later input | That later submitted input is a recorded external fact. Correcting its producer does not automatically revise the host's already-made decision; include that calculation in tracked execution if that is the desired behavior. |
| Two histories have disjoint write regions, but one consumes the other's changing output | The histories are causally coupled unless the observation is deliberately a fixed snapshot. Separate storage does not remove the need to account for that transfer. |

A minimal example of the read escape is `result = input * host_scale`. If a historical invocation observed `host_scale = 3`, a repaired execution must not quietly use the host's new value `7` just because it is rerunning today. The historical scale must be recorded, immutable, or part of the tracked state. The error exists even when every write stays inside the correct arena.

The same concern applies to deterministic state hidden in allocators, caches, static variables or RNGs. Merely naming a struct `State` cannot identify all actual influences. Tower's low-level tracking and enforcement should account for supported memory accesses regardless of source-language object names.

### Presentation and irreversible effects

An output boundary can export desired state or event descriptions. It does not need the temporal engine to understand those descriptions. The host interprets them and performs external actions. Repairing a description does not undo a physical sound or retract a delivered packet.

Quantum's [event documentation](https://doc.photonengine.com/quantum/v3/manual/quantum-ecs/game-events) documents duplicate suppression, predicted-event confirmation/cancellation and confirmed-only dispatch. It also warns that event payloads should not rely on earlier Frame pointers remaining valid. These are examples of explicit output reconciliation, not reversal of the outside world.

For Tower, choosing speculative output, confirmed-only publication, or compensating actions remains an application/library policy. General-purpose programs need the same distinction for files, network requests and device operations. The runtime can track a buffer containing such requests without assigning application semantics to its bytes.

### Effect on the API discussion

The previously proposed `temporal_call` makes sense as an optional host-to-tracked-execution entry. It must not require a wrapper around every nested call, nor limit repair to entire calls. A temporal module, lexical scope or long-lived runner could expose the same execution boundary instead. No particular spelling has been validated as the best ergonomic design.

The host's repair request can return normally because the host is not the history being amended. If that host is itself tracked at another level, its interactions with the child must participate in that level's history; that is the compositional case explored next. There is no implication that all surrounding code must remain forever non-temporal.

**Assessment:** the user's existing boundary is a strong example of how to host a temporal computation. Keep the boundary and substitute a correctly implemented selective repair engine for full inner replay. This conclusion validates the architecture, not near-native overhead, complete hard isolation, or the unimplemented repair algorithm. No new native benchmark or executable boundary prototype was run in this entry.

## 2026-09-05 — Entry 21: Recursive containment, relative boundaries, and nested temporal histories

### Author clarification

The author again emphasizes that Tower is a general-purpose language, not a language with a permanently non-temporal presentation layer surrounding exactly one temporal core. Their proposed generalization is recursive containment: a computation can contain another temporal computation, potentially through arbitrarily many levels.

**Correction:** the host/core arrangement in Entries 17–20 is one configuration, not a fundamental two-level restriction. “Outside” is relative to the particular execution/history being amended. A parent of one temporal computation may itself be temporally executed inside another. This entry supersedes any reading of the earlier recommendation as forbidding such composition.

### Direct validation of nested computation

[Self-Adjusting Stack Machines](https://arxiv.org/pdf/1108.3265), sections 3.4–3.5, explicitly represents recursive execution with nested subtraces. Section 5 connects callee results to caller continuations through compiler-generated tracked result storage. Its consistency result has specific trace and program conditions, addressed by its transformation. This supports nested computation and upward propagation in a coherent execution history; it does not prove arbitrary independent runtime instances compose merely by nesting their heaps.

[Adapton](https://www.cs.tufts.edu/~jfoster/papers/pldi14.pdf), sections 2 and 5, likewise uses nested reusable computations and caller/callee dependency edges. However, its calculus explicitly restricts mutation to its outer layer. It corroborates compositional dependency repair, not unrestricted nesting of independently mutating history controllers. That limitation is material and must not be hidden behind the word “compositional.”

Nested transactions offer another relevant but different precedent. [Moss's account](https://people.cs.umass.edu/~moss/papers/wmpi-2006.pdf), section II, permits multiple nesting levels and distinguishes closed child effects retained under the parent from open effects requiring a different recovery contract. It makes communication relevant to recovery coupling. These are transaction semantics, not proof of selective historical replay. They help identify which lifecycle/effect rules a nested temporal design must specify.

### Two distinct meanings of nesting

**1. Nested computation/scopes in a connected temporal execution.**

```text
A: tracked computation
├── B: tracked computation
│   └── C: tracked computation
└── D: tracked computation
```

All supported ordinary instructions and calls remain tracked. A correction inside `C` can affect `B` and then `A` through observed data or control dependencies. `D` is affected only if it has a relevant dependency in the revised execution, not merely because it is in the same tree. Equal observations can stop further propagation at any level.

This needs no fixed semantic nesting depth. It also need not instantiate a separate tracking engine at every level. One runtime can represent nested histories/scopes while maintaining the necessary causal links. Neither one coherent history nor a tree-shaped ownership structure means one indivisible recomputation unit.

**2. A computation controls a separately revisioned child execution.**

Here `B` does more than call `C`: it creates `C`, advances its private execution, revises earlier inputs or inspects particular child revisions. That is a plausible additional capability, but these child operations become effects of `B`'s own execution. Their ordering, identity, results and lifetimes must be recorded or integrated into a shared causal model.

The second case is more than ordinary nested function calls. The inspected consistency proofs do not by themselves specify independent local clocks, revision mappings, correction delivery and history reclamation across such runtime instances. Those contracts need design; that is not evidence that a general-purpose language must prohibit nesting.

### What “provided it was contained” must account for

The following are Tower design requirements inferred from the execution model, not a demand for application authors to wire graphs:

1. **Transfers preserve relevant dependency information.** If a parent reads a child's result, a correction to the historical result it observed must be able to reach the parent's consuming instructions. Copies of scalar values transfer information too; eliminating pointers does not eliminate causality. Compiler/runtime handling can make these edges automatic.
2. **Historical identity is maintained.** Correcting a child result produced earlier is not the same operation as publishing a new result later. An ordinary later write must not retroactively alter the value of an earlier parent load. Cross-scope links therefore need the appropriate event/version, not just an address or a child ID.
3. **Parent repair controls child effects it created.** If revising the parent removes an earlier child operation, that operation and its relevant effects must be revoked or revised. If the parent created a child that no longer exists in the new execution, associated handles and visible state cannot remain silently live.
4. **Reevaluation is not accidental duplication.** Reexecuting a parent occurrence that previously advanced or edited its child must reuse, replace or revoke/recreate that logical interaction, not blindly append another child input on every repair. Runtime occurrence matching is one possible mechanism; no naming implementation is selected here.
5. **Retention composes with ownership.** A child must not discard history still required by an editable parent unless the parent retains another valid way to reconstruct the needed state and effects. A child's local completion need not make its past irreversible to its ancestors.
6. **Effects cannot disappear through an untracked escape.** A child's read of changing parent state, or a write to mutable state not covered by the repair contract, must be tracked, captured as an explicit boundary observation, or disallowed. Separate arenas with write assertions alone do not cover reads, transferred outputs, calls or lifetime effects.

For an illustrative historical-value case:

```text
Original:   C produces 5 -> B consumes that result and computes 10
Correction to that production: C should have produced 9 -> B should compute 18
```

This is a dependency the runtime must preserve even if `C` and `B` use disjoint arenas. It does not require the runtime to understand what either number means. In a unified opcode-level execution, the production, transfer and consumption already have ordinary data/memory dependencies. If separate engines are introduced, their boundary must not throw those dependencies away.

If the interface explicitly imports an immutable snapshot as a new external fact, retaining the parent's old result can instead be the intended behavior. That is a different contract from a live relationship to the corrected child history. Neither policy should be selected accidentally just because a function copied a value.

### Nested control does not require infinite runtime self-recording

A parent can be temporal relative to its own parent while managing a child. The child's supported control operations can be recorded as operations in that parent's history, with semantics for amendment or revocation. This does not require an engine to trace its own trace-allocation bookkeeping recursively without end. Runtime primitives can implement those relationships directly.

There must still be an implementation layer providing the semantics, just as ordinary recursion eventually executes on a machine. That is not a source-language limit of two computation levels. The remaining difficult case is a correction whose target includes the occurrence requesting that correction; it needs explicit runtime-control and resumption rules. The ordinary host-return example does not solve that case simply by being nested.

### Recommended interpretation for Tower

Use **temporal scope/domain** to discuss a computation's state, history and controlled interfaces; reserve “independent timeline” for a genuinely separate revisioned execution. The names are provisional. General-purpose user code should remain ordinary imperative code with automatic supported-instruction tracking across calls. Optional scopes can supply ownership, isolation, retention policies or edit handles without being semantic dependency barriers.

The game architecture is then one instance: its presentation happens to be outside the simulation's repair contract. Another program may track the parent as well, and another may nest several such levels. Tower's own compiler could use nested tracked computations without declaring AST-specific dependency edges. No fixed application layering is required.

**Assessment:** recursive containment is a sound direction for the general-purpose design; a mandatory single outer/inner split would be unnecessarily restrictive. The strongest directly supported case is nested computation with preserved causal links. Separately editable child runtimes require the additional lifecycle/history protocol above. Containment is useful because it constrains effects, not because it makes all cross-boundary dependencies vanish. No fixed nesting depth, native performance guarantee, or complete proof of Tower's new APIs is claimed.

## 2026-09-05 — Entry 22: Executable byte-memory API validation and deliberate break attempts

### Deliverable and scope

The author requests custom executable validation, explicitly including memory
reads/writes and attempts to break the API. They clarify that the final deliverable
should be a small **C-like imperative API and its behavior**, not a testing report,
game-specific interface, or requirement to wrap ordinary calls with `temporal_call`.

The user-facing proposal is now [Temporal C-like API](research/temporal-c-api.md).
The experiments remain in [the research directory](research/README.md). No Tower
compiler/runtime source or original proposal was changed for this work. These are
executable specification artifacts, not a native implementation.

### Two different executable models, kept distinct

1. The existing [memory validation](research/temporal-memory-validation.mjs) has a
   genuine ordered dirty queue and per-address subscriptions. It tests selective
   repair with indirect addresses and conditional stores in a fixed instruction
   universe. It does not implement arbitrary dynamic traces or overlapping bytes.
2. The new [API model](research/temporal-api-model.mjs) implements dynamic branches,
   counted loops, ordinary calls, recursion, indirect call targets, marks, edits,
   and overlapping byte memory. It conservatively reconstructs memory and visits
   the new trace in order, caching individual opcode results. It **does not** avoid
   the whole-trace reconstruction scan. Even cache hits perform validation work;
   retained stores still have their logical effects applied.

The latter is intentionally a correctness-oriented specification against which a
future efficient engine can be checked. Passing both suites does not establish
an unimplemented combination of fully dynamic selective scheduling and native
code generation, and does not establish near-native overhead.

### Exact new machine and oracle

The [contract](research/temporal-model-contract.md) defines finite initialized byte
memory, fixed address lifetimes, little-endian widths 1/2/4/8, U64 wrapping scalar
operations, raw indirect loads/stores, structured control flow, automatically
tracked ordinary calls, and defined traps/budgets. No game, AST, query, object, or
ECS meaning is assigned to these bytes. Empty bytes are ordinary read dependencies.

An independently implemented [reference interpreter](research/temporal-api-reference.mjs)
performs fresh forward execution with mutable memory and explicit control frames.
It imports neither the API executor nor its cache helpers. Differential tests
maintain their own program/input/intervention data; they do not copy the engine's
private history into the oracle. Opaque invocation IDs are observed only to label
the independently retained input records.

Comparisons check **all final bytes, per-byte last-writer identities, the complete
executed opcode trace including each read/write range, marks, and invocation
results**. Merely comparing one final scalar would miss equal-value provenance
and removed-effect defects. Original examples produce `80 -> 88` for historical
insertion and preserve `80` after swapping equal-sum operands; a register loaded
before an inserted store retains its original value.
The small C-facing input example is also mirrored explicitly in opcodes: changing
input `4 -> 7` changes the ordinary `twice` call's stored output `8 -> 14`.
These are opcode-equivalent example tests, not C compiler execution.

### API decisions forced into the open

- External `Write` handles identify events, not addresses and not ordinary
  computed stores. Replacement preserves the event's position, destination and
  size. All byte buffers and root arguments must be captured by value; pointers
  capture addresses, not pointee snapshots.
- Only one edit is staged at once. Forward appends/calls cannot interleave with it.
  Staging errors preserve earlier valid staging. Cancellation consumes the batch.
- Repair creates a private candidate and publishes atomically. Failure consumes
  the batch, invalidates provisional tokens, and leaves the published memory,
  trace, results, revision and committed write handles unchanged.
- A public `Point` belongs to a specific current revision. Every successful
  publication, including a no-op repair, invalidates old public Point tokens.
  Current marks can be queried again; persistent intervention anchors are
  independent of those short-lived public tokens.
- If changing control flow removes a mark with a persistent intervention, the
  proposed strict policy rejects with `ORPHANED_POINT`. It does not silently move
  or discard the edit. `temporal_remove(edit, write)` permits removing that
  intervention in the same batch as the change that eliminates its mark.
- Multiple insertions at one gap preserve staging/commit order; replacing an
  earlier write does not move it after a later write.
- Ordinary nested calls cannot be skipped merely because their return value or
  explicit argument list stayed equal. Their memory effects and reads matter.
- A copied controller result stays copied. Repair does not reexecute untracked
  controller code or mutate old scalar observations. Corrected bytes/results are
  inspected after publication.

These are explicit chosen policies, not the only possible temporal language
semantics. In particular strict orphan rejection trades simplicity for a possible
need to remove an old intervention when accepting a control-flow correction.

### Actual defects found and fixed

Attempts to break the implementation found real errors, rather than only confirming
the intended examples:

| Defect | Concrete failure | Fix and retained regression |
| --- | --- | --- |
| Byte payload copy dispatched to `.slice()` | Node `Buffer` is accepted as a `Uint8Array`, but its slice aliases storage. Host mutation could change captured initial memory or input bytes without a temporal event. | Construct a fresh plain `Uint8Array`; six [boundary regressions](research/temporal-api-breaks.mjs) cover initial memory, append, replacement, insertion, subarray ranges and overridden copying. |
| Modeled calls used native JavaScript recursion | A valid 1,537-level call tree below the configured depth/step limits hit the host stack first. | Use a generator trampoline; initial execution and repair of the 4,609-record trace agree with the separate iterative oracle. This avoids a host-stack artifact, not all resource limits. |
| Invocation capture called caller-overridable `args.map` | An Array subclass returned itself from `map`; subsequent host mutation changed retained pointer arguments and redirected replayed reads/writes. | Copy into a fresh ordinary array using indexed capture; preserve an adversarial regression and a mutation that restores the defect. |
| Incomplete malformed-bytecode validation | Non-array call arguments reached execution and produced an uncoded host `TypeError`. | Validate instruction operands/containers during program capture; retain deliberate-error and failure-atomicity checks. |
| Memory size allocated before validation | Negative/nonfinite/inexact sizes produced uncoded host allocation exceptions. | Check nonnegative safe-integer sizes first; retain explicit-code rejection tests. Physical host out-of-memory survival is not promised. |

These defects are in the executable research model. They do not show that the
temporal-memory idea is inconsistent, but they do demonstrate why an API promise
such as “captured bytes” must be verified at every real implementation boundary.
Passing ordinary typed-array examples had not exposed the aliasing failures.

### Deliberately broken implementations

The [mutation suite](research/temporal-api-mutations.mjs) loads edited source
variants in memory, without rewriting repository files. Baseline examples must
pass against the correct implementation; each mutant must fail a semantic
assertion, not merely fail to import. All twelve selected mutations are detected:

1. Ignore changed historical load bytes.
2. Track only the first byte of a wide load.
3. Retain obsolete load producer metadata after an equal numeric result.
4. Omit the effect of a cached store.
5. Reconstruct from old present-day memory, leaving removed stores behind.
6. Reuse a whole call without checking its memory execution.
7. Silently drop an intervention whose anchor disappeared.
8. Accept a stale public Point.
9. Replace the first write at an address rather than the identified event.
10. Restore the actual byte-buffer alias defect.
11. Restore the actual argument-array alias defect.
12. Drop the actual read-notification enqueue in the earlier selective scheduler.

The last mutation tests a real memory-subscription mechanism, not only the new
conservative scanner. This is a selected fault set, not exhaustive mutation
coverage or proof that no other implementation error exists.

### Reproducible final results

Executed successfully with Node `v21.7.3` on this workspace:

```powershell
node docs/research/temporal-validation-all.mjs
```

| Retained suite | Result |
| --- | --- |
| Fixed-universe selective memory scheduler | 15,801 reference comparisons; 13,712 update batches. PASS. |
| New dynamic byte-memory API differential suite | 7,186 reference comparisons; 3,673 successful repairs; 221 expected rejected repairs. PASS. |
| Independent directed API attacks | 36 named cases; 297 assertions. PASS. |
| Byte-buffer alias regressions | 6 retained cases. PASS. |
| Deliberately defective implementations | 12 mutations detected; 0 selected mutants surviving. PASS. |

The new exhaustive family contains 1,024 three-state sequences: all triples of
eight specified input states for two initial-byte patterns of one dynamic program.
It is exhaustive over that finite family, not all programs. Seeded randomized
testing uses `0x74e4cafe`, sixteen program variants, and 120 actions each; these
include replacement, insertion, removal, appends and expected orphan conflicts.
Counts are not added together as if all suites measured the same property.

Additional independent oracle smoke checks were performed during development,
but the table reports the retained reproducible suites rather than inflating it
with unsaved one-off checks. No native benchmark, C-to-LLVM lowering test or new
production compiler build was performed.

### What “proven” means here

The [independent proof review](research/temporal-api-proof-review.md) gives a
conditional induction argument: equal current operands and historical memory
produce equal next steps; reconstruct every store effect, follow the revised
control flow, and refresh load provenance. This establishes an algorithmic claim
under stated premises. It is **not a machine-checked proof of the implementation**.
The tests try to falsify its premises and have found bugs that were then fixed.

Remaining obligations include an efficient dynamic worklist implementation,
compiler lowering and coverage, stack/allocation/address-reuse history, general
native memory semantics, foreign/irreversible effects, independent child-history
composition, and resumption when a correction removes its own requesting
occurrence. Finite successful testing cannot justify a 100% guarantee for those
unimplemented features.

### Consequence for the small C-like surface

`temporal_call` is **not required in ordinary Tower code**. It is a harness or
embedding entry. A compiler-supported `temporal (history) { ordinary_code(); }`
can lower to one retained invocation while automatically instrumenting all
supported calls and raw memory operations inside. Whole-program temporal mode
can supply that activation implicitly.

Same-history nesting is ordinary tracked execution, not another external event
for every nested call/block. A separately revisioned child runtime still needs
the additional protocol from Entry 21; the tests do not silently substitute an
unproven implementation of that capability. No permanent two-level application
architecture is imposed.

The new C-facing document uses a mark instruction plus current mark lookup for
the advanced insertion API. This refines the earlier `Point temporal_mark()`
sketch to make stale-token refresh explicit. Labels identify edit locations,
**not dependencies**. Normal imperative assignments require no read/write wrapper;
only external input recording and deliberate amendments need control primitives.

## 2026-09-05 — Entry 23: Replace byte-ABI plumbing with one minimal typed value API

### Author's correction

The author asks why an input value must be supplied through a source pointer,
given that Tower tracks instruction results and temporaries as well as memory.
They explicitly reject adding redundant convenience overloads: simplify the
interface, verify the result, and expose pointers only where semantically needed
or genuinely justified by performance.

**Correction:** the earlier `const void *src, size_t size` was a generic C
byte-copy embedding convention, not a dependency-tracking requirement. It should
not define the primary interface of a compiler-aware language. The canonical
[C-like API](research/temporal-c-api.md) has been rewritten, not supplemented with
a `_value` family. Earlier research and the low-level engine remain retained as
implementation/validation material.

### Reduced canonical signatures

These are schematic compiler-typed C-like signatures, not a standard-C header:

```c
Write<T> temporal_write<T>(T *destination, T value);

Edit temporal_edit();
void temporal_replace<T>(Edit edit, Write<T> event, T value);
void temporal_remove(Edit edit, Write<?> event);
RepairStatus temporal_repair(Edit edit);
void temporal_cancel(Edit edit);

// Only for programs exposing arbitrary marked historical insertion:
void temporal_mark(Label label);
Point temporal_point(Label label, size_t occurrence);
Write<T> temporal_store_at<T>(
    Edit edit, Point point, T *destination, T value);
```

The compiler infers types where possible. `Edit`, `Write<T>` and `Point` are
opaque values, not source-visible pointers to engine objects. `Label` is a
compiler-known label value, not a retained mutable C-string buffer. The current
history is supplied by temporal-enabled execution; explicit create/destroy,
registration, activation and top-level invocation belong to the runtime or an
optional embedding layer rather than every ordinary program.

The **destination** still needs a location identity. Keeping `T *destination`
and C's `&x` spelling communicates that directly. A compiler could take an
assignable lvalue instead, but exposing both spellings adds no capability and
this proposal chooses only the C-address spelling. That syntax is not claimed
to be intrinsically faster.

The source is a value and needs no address-taken temporary. `T` determines the
conversion and storage width; `Write<T>` retains the destination type on later
replacement. The public language API has no source-byte pointer or manual byte
count. Underlying byte-addressed memory history remains essential and unchanged.

### Temporaries versus captured external inputs

Ordinary tracked code still includes operand dependencies:

```c
int a = *p;
int b = a + 7;
int c = helper(b);
*q = c;
```

`b` and `c` can be register/SSA values without source-visible storage. The
source pointer in an embedding API was never what made those values trackable.
Constants likewise need no mutable-memory dependency.

For a deliberate control operation, `temporal_write(&x, expression)` evaluates
the expression now and captures its resulting value. It does not retain a
reference to its source buffer or reevaluate that external expression on repair.
Similarly, `temporal_store_at(edit, point, &x, x + 1)` stages the current result
of `x + 1`, **not** a historical read-modify-write instruction. This distinction
must not be confused with automatic propagation of ordinary computations within
tracked execution.

If the value type itself is a pointer, e.g. a write to a pointer-valued variable,
the recorded payload is the address value, not a deep copy of the pointee.
Subsequent ordinary dereferences participate in historical memory tracking.

For large aggregates, a compiler may lower a by-value operation to an indirect
ABI convention or another appropriate representation. That is an implementation
choice, not evidence that every scalar source should be a pointer or that a
second public API is necessary. Capture/lifetime semantics must still be upheld.
No new native ABI or performance measurement was made.

### What was retained, and why

Replacement, insertion and removal are different history effects. Insertion
after a load cannot substitute for replacing a write before that load. Removing
an intervention is required to accept a correction that removes its anchor under
the chosen strict orphan policy.

Atomic batches also remain meaningful. The new executable test uses a computed
address `a - b`. Changing `a:16 -> 72` alone causes an out-of-bounds read in a
64-byte arena; changing both `a:16 -> 72` and `b:0 -> 56` preserves address 16
and succeeds. Replacing batching with an immediate repair after each write would
change the supported semantics. A different batch syntax could hide these
functions, but would still need equivalent atomic grouping and failure behavior.

No broader mark-lifetime redesign was introduced just to shorten declarations.
The existing current-Point lookup and strict invalidation policy remain explicit.
This is a justified reduction of incidental interface plumbing, not a proof of
global minimality among every possible language design.

### Typed lowering experiment and independent validation

Added [temporal-minimal-api.mjs](research/temporal-minimal-api.mjs), a bounded
compiler-operand/lowering experiment over the retained byte-memory engine. Its
control surface has exactly seven methods: typed write, edit, typed replace,
typed store-at, remove, repair and cancel. The remaining harness functions bind
compiler locations, run the instrumented program, select marks and inspect
results; those are test-driver responsibilities, not additional public APIs.

The model covers unsigned 8/16/32/64-bit values and 64-bit logical pointer values.
Unsigned conversion, little-endian encoding and byte-overlap rules are explicit.
It does not claim C aggregate/padding coverage, signed arithmetic coverage,
native pointer provenance, native ABI correctness or implemented C lowering.

The [independent typed validation](research/temporal-minimal-validation.mjs)
maintains its own input/patch history and independently encodes expected bytes.
It compares complete memory, byte producers, dynamic traces, marks and results
against the existing independent full replay interpreter. It also asserts the
public method names and arities, preventing an accidental parallel byte/value
interface from being treated as the minimal surface.

Coverage includes literals, exact-once expression evaluation, temporary register
results through ordinary calls, capture at staging time, pointer-valued payloads,
equal-valued pointer retarget followed by a second edit, overlapping typed widths,
finite-width conversion, historical loads before/after insertion, batch atomicity,
cancelled/removed/forged handles and cross-context control rejection.

### A real defect exposed by removing explicit context parameters

The first typed adapter forwarded a foreign Edit to the underlying engine:
`a.api.temporal_repair(b.api.temporal_edit())` incorrectly advanced B's revision
from 0 to 1 through A's supposedly current-context interface. This was reproduced
before fixing it. Making history implicit had not automatically preserved
context authority.

The adapter now records ownership of each Edit value and checks it before every
edit-taking operation. Tests reject foreign replace, insertion, removal, repair
and cancellation, as well as foreign pointers, Points and Write handles. A
deliberate mutation restoring the missing check is detected. Hiding a pointer
from the API does not remove the runtime's ownership/liveness obligations.

### Reproducible results after simplification

Ran the aggregate command successfully with Node `v21.7.3`:

```powershell
node docs/research/temporal-validation-all.mjs
```

- New typed surface: **11 suites, 452 independent-reference comparisons, 402
  successful repairs, one expected rejected repair, and 440 rejected operations**.
  The rejection count includes repeat attempts to use consumed edits; it is not
  a count of 440 distinct discovered bugs.
- Numeric conversion family: **388 cases** across the four unsigned widths,
  including boundary values and deterministic seeded integers (`0x8e12abcd`).
- All earlier retained scheduler/API/boundary suites still pass unchanged in
  scope: 15,801 fixed-universe scheduler comparisons, 7,186 dynamic API
  comparisons, 36 directed cases/297 assertions, and six byte-alias regressions.
- The mutation suite now detects **15 selected mutations**, with zero survivors.
  The three new faults remove implicit-context edit ownership, ignore the typed
  destination width, and copy a pointee instead of a pointer-valued source.

**Assessment:** the source-pointer and size parameters are unnecessary in the
language-facing API and have been removed from its canonical form. Passing
temporaries by value preserves the tested historical-byte semantics. The
retained destination address and atomic-edit operations have identifiable
semantic jobs. Verification is bounded executable evidence plus the previous
conditional argument—not a formal proof of a native compiler or a performance
claim.

## 2026-09-05 — Entry 24: Full translations of the original temporal-opcode examples

The author requests fully written examples, primarily from the original
`temporal-opcode.md`, using the reduced typed-by-value interface. Added
[temporal-c-examples.md](research/temporal-c-examples.md), preserving the original
proposal unchanged and introducing no new API operations.

Each example contains initialized persistent state, an ordinary application
function, input events where needed, initial execution, a later edit batch and
explicit expected results. A runtime-supplied default history is assumed.
Application and control phases are identified rather than pretending an
arbitrary tracked `main` can erase its own occurrence and return normally.
Outputs are stored in tracked memory, not merely copied to an untracked caller.

The five original computational examples and two additional contrasts are:

| Example | Historical change | Verified result |
| --- | --- | --- |
| Reads / Loads | Replace the input event supplying `m[2]=9` with `6` | `(3+5)*9 = 72` becomes `48`; `a,b,c` remain reusable. |
| Writes / Stores, and Dependency Tracking | Replace earlier input `m[2]=2` with `6`; ordinary code still stores `9` before loading | Result remains `72`; current `m[2]` is `9`, not `6`. The load's producer remains the later ordinary store. |
| Rewinding & Modification | Insert `m[3]=2` immediately after the first sum and before its load | `80 -> 88`; unrelated load `d` remains reusable. |
| Independence | Same insertion with an additional separate `(3+7)` factor | `800 -> 880`; the independent factor remains `10`. |
| Time Point Merging / Equivalence | Batch-replace inputs `3,5` with `5,3` | Sum remains `8` and output remains `80`; the first sum is checked, downstream multiply result is reusable. |
| After-load contrast | Insert `m[3]=2` after loading the old `1` | Current memory becomes `2` but the loaded temporary stays `1`; output stays `80`. |
| Distinct events at one address | Two executions observe separate writes of `9` and `6`; correct only the first to `3` | Tracked output fields change from `72,48` to `24,48`; latest memory remains `6`. |

The direct [worked-example validator](research/temporal-original-examples-validation.mjs)
uses the minimal typed interface and independently maintained reference inputs
and interventions. The last case specifically includes an ordinary nested
`calculate()` return consumed by a tracked caller store into each output field.
It does not mistake an unchanged host copy for a repaired application result.

All seven examples pass: **seven repairs and 35 independent-reference comparison
checks**. The comparison count includes initial/input/execution observations and
both precomputed-candidate and published-state checks; it is not 35 distinct
programs. Comparisons cover complete bytes, per-byte producer identities, dynamic
traces, marks and results. Expected result-cache hits/misses are asserted for
unchanged loads, the masked input, independent factors and equal-sum propagation.

The example source uses nonoverflowing `uint32_t` calculations. The test
interpreter's U64 temporary arithmetic agrees on those values; no general C
integer-lowering proof is implied. Some fixtures expose additional return values
for diagnostic observation. They are opcode-equivalent examples, not execution
of a compiled native C translation unit.

The walkthrough explicitly notes that marks impose historical ordering
semantics: a compiler optimization cannot hoist, sink or merge distinguishable
loads across a mark in a way that changes a later insertion's meaning. This is
not a claim that each mark requires a hardware memory fence.

Globals, allocation, external observations and physical effects are addressed
without inventing unsupported APIs. Global placement alone does not couple all
memory. Allocation identity/lifetime, newly encountered external samples and
irreversible effects remain beyond these fixed-lifetime examples.

The new fixture is included in the aggregate runner:

```powershell
node docs/research/temporal-validation-all.mjs
```

The API model still reconstructs memory and scans the trace, including unchanged
loads/stores. Cache reuse here is not native-performance evidence or a claim of
zero repair bookkeeping. The examples establish the requested value/history
behavior within the bounded model, while retaining the prior proof limitations.

Verification completion on **2026-09-06**: the aggregate runner passed every
retained suite, including the seven new examples. The preceding aggregate attempt
reported a wall-clock `ETIMEDOUT` despite capturing a child's complete PASS report;
it did not report an assertion failure. A fresh run completed successfully without
changing the tests or their timeout policy. The cause of that delay was not
established, so it is not treated as a semantic or performance finding.

## 2026-09-06 — Entry 25: Complete commented surface and repair status

The author accepts returning a repair status and requests the complete API with
comments above each declaration. Consolidated the nine existing operations in
[temporal-c-api.md](research/temporal-c-api.md) into one commented block, with
explicit `RepairStatus` enumerators. No new operation, source-pointer overload,
history parameter or per-call wrapper was introduced. `temporal_remove<T>` uses
the same generic spelling as the other typed event operations; it does not add
an argument or a runtime type requirement.

The comments distinguish input-event handles from automatically tracked stores,
capture-by-value from inserting an expression, and an executed mark from its
revision-scoped lookup token. They also state the one-open-batch rule, consumed
edit lifetime, provisional/committed handle lifetimes and same-point insertion
ordering. Only a valid repair attempt consumes the edit on each returned status;
invalid API use remains a checked error before the operation takes effect.

The existing strict orphan policy is retained, not silently replaced by automatic
deletion of user interventions. It applies when an inserted write's dynamic mark
vanishes, not when an ordinary computed store disappears with a branch. The user
can explicitly remove the intervention in the same batch. Global variables are
still valid destinations; the earlier examples' arrays were notation, not a
requirement for a gated or contiguous source-level state region.

A separate read-only review checked the declarations and lifetime comments
against the retained executable model and contract. This is a documentation
consolidation: no interpreter behavior or test suite was changed, and the prior
passing results are not presented as a new test run. In particular, the current
research adapter returns diagnostic statistics / coded exceptions rather than
the proposed public enum. Its tests establish bounded repair outcomes and
atomicity; the native enum-returning lowering remains to be implemented. The
status enum does not promise recovery from undefined behavior, arbitrary foreign
effects or physical host out-of-memory termination.

## 2026-09-06 — Entry 26: The omitted multiple-history interface

The author asks how the one-open-batch rule permits multiple histories and
recursive temporal controllers. The previous description of the nine operations
as the complete API was too broad: they are the complete **single-history editing
surface**, not a completed interface for the author's full nested-history vision.
Updated the canonical document's title, scope notice and dedicated discussion.
No new public signatures are being declared verified through this correction.

The batch restriction is per history, not process-wide. A fresh read-only Node
probe against the raw research kernel created two isolated one-byte histories,
opened an edit in each, staged different corrections, rejected a second edit
on the first history, and repaired each independently. It asserted that repairing
the first published its changed byte while the second retained its old byte
until its own repair. **PASS.** This is evidence for isolated instances, not
parent/child composition; the aggregate suites were not rerun for this
documentation clarification.

An independent read-only review reconfirmed the distinction between ordinary
nested calls and a parent creating, advancing and amending a child history.
The latter requires creation/lifetime and execution/target-selection semantics
not exposed by the current source API. The controller's executing history and
the history targeted by its correction must not be confused: a parent can
control a paused child without moving the requesting occurrence into that child.

The review supplied a concrete low-level counterexample. A parent loop advances
a child through `acc = acc + 1` twice from zero. Correcting the parent loop count
to one must yield 1; naive reexecution appending to the child's old present yields
3. Repair must revoke vanished child advances and reuse/replace surviving logical
interactions without duplication. Parent loads/results must refer to the correct
historical child values. Child creation, destruction, corrections and retention
must likewise obey ancestor repair, and failed parent candidates must not leak
their speculative child changes. Isolated writable arenas alone do not provide
these rules. The example is a design counterexample, not a newly implemented
nested-history test.

Rechecked [Moss, Open Nested Transactions: Semantics and Support, section II](https://people.cs.umass.edu/~moss/papers/wmpi-2006.pdf):
closed nesting retains child effects under parent recovery, while open nesting
requires different recovery semantics. This supports the need to specify
parent/child effect ownership, not a correctness proof of Tower's temporal repair.
The proposed direction remains compiler/runtime-managed instruction, memory and
event/version relationships, not programmer-defined application-object dependencies.

**Assessment:** one edit per history is compatible with arbitrary finite nesting
depth, but it does not implement nesting. The full recursive-control API remains
unfinished. Preserving the default single-history convenience must not hide this
missing capability or relabel ordinary calls as separately editable histories.

## 2026-09-06 — Entry 27: Implemented API with recursively owned histories

The author explicitly requests an actual executable prototype, not additional
signature speculation, and proposes `null` for the global/default running
program. Implemented [temporal-nested-api.mjs](research/temporal-nested-api.mjs),
a new deterministic JavaScript byte-memory/opcode runtime. Existing experiments
and the original temporal-opcode document are preserved.

### Actual interface and semantics

The implementation exports all nine editing/marking methods plus
`temporal_create()` and `temporal_destroy(history)`. `temporal_edit(history)` and
`temporal_point(history, label, occurrence)` take explicit target values. `null`
means this runtime's default root, not the dynamically executing child.
`temporal_write(destination, value)` needs no redundant history argument because
its compiler-tagged destination already identifies the owning history. Sources
remain typed values, not source pointers/buffers. `RepairStatus` is now genuinely
returned by this implementation, including usable status comparisons in tracked
code, rather than merely documented over exception-based diagnostics.

The [commented API document](research/temporal-nested-api.md) describes exactly
this surface. The compiler/test driver supplies typed locations and execution
entry; ordinary calls stay ordinary automatically executed opcodes. Explicit
entry into a different history is represented by an `enter` opcode. Temporal
instructions invoke the same public method implementations as host API calls,
not a separate set of hand-simulated stubs. The runnable
[example](research/temporal-nested-example.mjs) executes the parent-loop
counterexample: changing its original count from two to one leaves the child
counter at **1, not 3**.

The concrete implemented nesting contract is **closed ownership**. Host code
controls the root and host-created independent histories. Tracked A controls its
immediate child B; B may control C and continue recursively. Each parent records
its child creation, inputs, advances, amendments and destruction as instruction
effects. Repair reconstructs candidate owned subtrees privately and publishes
them atomically. A later parent trap discards even a successful candidate child
repair. Direct unrecorded host mutation of a tracked descendant, self/ancestor
editing, and unrelated mutable cross-history access are checked rejections.

Parent reads observe a child's current revision at their parent execution
occurrence. A later parent-commanded child correction does not rewrite an earlier
parent snapshot. An ancestor correction instead reconstructs both observations
at their appropriate historical positions. This is implemented with byte reads,
writes, instruction identities and child revision state, without application-
object dependency annotations. It does not claim arbitrary independently edited
clocks with live links between them.

### Independent checks and actual defects

A separately implemented [fresh replay oracle](research/temporal-nested-reference.mjs)
imports no runtime/model helpers. It receives its own root input values and
program definitions and produces a tree of numerical byte memories. The primary
[validation suite](research/temporal-nested-validation.mjs) compares those trees
after ancestor corrections, including every count transition from 0 through 6,
160 seeded three-level corrections, twelve-level recursive containment, and
original load/overwrite/insertion/byte-overlap examples. Public handle identity
and exact shared-fuel accounting are deliberately outside that oracle and tested
by separately authored directed cases.

The adversarial work found and corrected concrete implementation issues:

- Reconstructing an unchanged parent prefix prematurely invalidated a fresh
  child Point supplied to a newly appended owner invocation. Accepted arguments
  now retain internal historical occurrence identities; new stale submissions
  still fail. This was reproduced as an actual `INVALID_POINT` test failure.
- Replaying the first of multiple child inputs pruned a later still-committed
  Write handle before its occurrence was reconstructed. A retained identity pool
  now preserves continuously surviving writes through prefix reconstruction.
- A recorded create/use/destroy sequence needs its historical capabilities even
  after their public handles have expired. Retained History, Location and Write
  operands now resolve to the reconstructed historical occurrence without
  reviving expired public handles.
- Internal retained-argument tokens exposed through diagnostic event inspection
  must not bypass freshness checks when submitted as new public arguments.
  New submissions of such internal tokens are explicitly rejected.
- Compiler-generated instruction/function identities are checked and nested
  control-event identities structurally encoded to avoid delimiter collisions
  and recursively expanding textual identities. Builtin argument arities are
  checked before lowered calls execute.

The new [mutation suite](research/temporal-nested-mutations.mjs) runs six correct
baseline scenarios, then changes one exact implementation site in each in-memory
variant. It detects missing rollback, bypassed ownership, retained removed
descendants, lost Write identity, lost Point capture and an ignored overlapping
byte. Four fail by expected-value assertions and two by checked runtime errors;
syntax/import failures are not counted as successful mutation detection.

### Scope and execution cost

This prototype performs **full subtree replay**, including on forward history
extension. It does not implement selective skipping, prove native performance,
or replace the earlier fixed-instruction incremental scheduler's separate
evidence. It exists to make the control API executable and falsifiable before
optimizing it. The model is fixed-size byte memory with unsigned 64-bit temporary
arithmetic and typed 1/2/4/8-byte stores. No native C compiler, allocator lifetime,
FFI, I/O, arbitrary shared mutable histories or self-edit continuation is claimed.

Limits are shared across an executing operation and its descendants. A child
exhausting the global step budget does not grant its parent a fresh quota.
Publishing with an unfinished descendant edit is rejected atomically. The
configured limits bound this interpreter, not a proposed language nesting depth.

All new suites are included in the retained aggregate command:

```powershell
node docs/research/temporal-validation-all.mjs
```

The first full aggregate after implementation passed all old and new suites:
the primary nested suite reported **10 cases, 288 independent oracle comparisons,
235 successful repairs and 515 directed assertions**; the then-current nested
adversarial suite passed 17 cases/99 assertions; all **six new selected mutations
were detected with zero survivors**. Additional retained-capability regression
completion is recorded below rather than silently changing that observed run.

Final aggregate rerun on **2026-09-06**: **PASS**, Node v21.7.3. All retained
earlier suites still pass unchanged. The nested primary totals remain 10 cases,
288 oracle comparisons, 235 successful repairs and 515 directed assertions.
The completed nested adversarial suite now passes **19 cases / 128 assertions**,
including four repeated ancestor repairs after a recorded child destruction and
rejection of all four extracted internal retained-argument token kinds. The six
nested mutation checks all remain detected, with zero survivors. The standalone
example was rerun and again printed the expected corrected counter of 1.

## 2026-09-06 — Entry 28: C-like translation audited against the executable API

The author requests the same API translated to C-like generic declarations with
comments, explicitly asking for careful validation and no unnecessary surface.
Rechecked the implementation and obtained two independent audits of signatures,
ownership and value/handle semantics. No runtime operation, parameter, overload,
history-pointer wrapper or source-pointer interface was added or removed.

All eleven method names and arities agree with the commented translation.
`temporal_edit` and `temporal_point` need a target History because they have no
existing event/destination identifying it. `temporal_write` derives its target
from its compiler-typed destination. `temporal_replace`, `temporal_remove` and
`temporal_store_at` have Edit/Write/Point identities that already retain ownership;
adding another History argument would be redundant. The destination pointer
identifies memory, while the source and opaque handles are passed by value.

Added [temporal-nested-surface-validation.mjs](research/temporal-nested-surface-validation.mjs):
**eight cases / 83 assertions, PASS**. It checks exact names/argument counts,
all four unsigned storage widths, literals and computed by-value sources,
shallow logical pointer capture, null/numeric pointers, owner checks, same-gap
insertion order, provisional removal, failure/cancel preservation, no-op Point
expiry and committed Write survival. The main agent independently reran it and
included it in the aggregate runner. The final aggregate passed every retained
suite, including 288 nested oracle comparisons, 19 nested adversarial cases,
six detected nested mutations and the new surface cases. Runtime behavior was
not modified during this translation audit.

Tightened comments rather than inventing additional functionality:

- A child repair returning OK remains subject to its enclosing candidate parent
  succeeding; it is not an irrevocable process-wide publication.
- The controller may itself be tracked code. Do not describe all non-mark
  operations as host-only; Point lookup is an observation and may inspect the
  current executing history or an immediate child.
- C-like `T*` represents a compiler/runtime-owned typed address, not a bare fake
  numeric byte offset that somehow independently identifies its history.
- The prototype rejects tagged pointer values from other histories, but accepts
  numeric values as logical pointer bits. Storing a pointer is not validating its
  eventual dereference or proving native pointer provenance/memory safety.
- Generic notation does not expand implemented storage beyond unsigned
  8/16/32/64-bit values and logical pointers; aggregates/native ABI remain outside
  this model.
- The eleven declarations are the complete implemented temporal-management
  interface. Actual execution-context entry remains the implemented driver
  `run` / lowered `enter` operation. This audit does not invent its future Tower
  source spelling or reintroduce a wrapper around ordinary function calls.

Updated the [commented API](research/temporal-nested-api.md) and artifact index
to record these distinctions and the new checks. Passing bounded tests and
source review support this exact interface; they do not establish that no other
language design could expose fewer operations or prove arbitrary native C code.

## 2026-09-06 — Entry 29: Untyped byte core replaces generic write signatures

The author changes their interface preference to a more C-like core and asks
whether `T` is fundamental. It is not fundamental to historical memory writes:
their identity, destination ownership, byte extent and captured bytes suffice.
`T` previously determined byte width, integer conversion and the typed facade's
logical-pointer checks. Ordinary opcode semantics still need defined widths and
operations; removing a generic write parameter does not make computation itself
typeless or erase operand dependencies.

Implemented a shared untyped core in
[temporal-nested-api.mjs](research/temporal-nested-api.mjs), exposed by
`createByteRuntime`. The canonical declarations are now:

```c
Write temporal_write(void *destination, const void *source, size_t byte_count);
void temporal_replace(Edit edit, Write event, const void *source);
Write temporal_store_at(Edit edit, Point point,
    void *destination, const void *source, size_t byte_count);
```

`Write` is no longer generic, including in `temporal_remove`. Replacement has no
redundant byte count: the event remembers its existing extent, and replacement
cannot move or resize it. The caller supplies at least that many readable bytes.
An extra count would be a caller-supplied consistency check, not necessary
temporal information. Counts for new writes/insertions must remain positive;
this change does not invent zero-byte-event semantics. No new core operation or
parallel `_value` overload was introduced.

The retained `createNestedRuntime` generic interface now acts as a legacy test
adapter over the same raw write/replace/store implementation. Its conversion
metadata is separately stored in transaction-copied adapter state, not in raw
write events. Raw events contain no type field. This preserves previous research
and its regression evidence while making the author's newly preferred core
actual executable code, not another unimplemented header.

### Source capture is also a memory read

Added a compiler/debugger `Address` value and lowered `address` opcode without a
source-language type. Ownership still identifies the relevant memory history.
Tracked source addresses are read under the controller's observation rules;
the current instruction records every source byte and its historical producer.
Source capture is not an exemption from memory dependency tracking. An ancestor
correction reexecutes that instruction and captures the appropriate new bytes.

Host byte views are copied immediately, respecting their offsets. Fake-memory
sources are snapshotted before destination changes or replay, so overlapping
copies work in either direction. Replacement copies the stored event width;
historical insertion copies the source's **current** contents, not its contents
at the old mark. Changing/releasing a source after the API returns cannot change
the retained captured payload. Source pointers themselves are not retained live.

The actual implementation avoids Buffer.slice aliases and checks true typed-array
lengths rather than trusting overridden `.length` properties. Proxy/fabricated
or detached byte views cannot fabricate captured bytes. Runtime-owned addresses
are retained/rebound through historical invocation arguments using the same
owner/lifetime principles as the earlier handle model.

### New independent and adversarial validation

[temporal-byte-validation.mjs](research/temporal-byte-validation.mjs) passes
**five cases, 138 independent replay comparisons, 133 successful repairs and
458 assertions**. Coverage includes arbitrary multi-byte writes and patches,
120 seeded fixed-width replacements, current-versus-historical source capture,
actual source-byte producer records, three-level raw controllers, and malformed
corrected counts that must leave the entire old subtree intact. Flat comparisons
use the independent byte interpreter and independently retained events/bytes.
Nested comparisons use equivalent explicit-load/by-value programs in the
separately implemented nested oracle, not production runtime frames.

[temporal-byte-adversarial.mjs](research/temporal-byte-adversarial.mjs) passes
**14 cases / 158 assertions**. It checks arbitrary sizes including 3, 17 and 64,
fixed replacement extent, invalid/zero/unsafe counts, too-short sources, staging
atomicity, Buffer/subarray offsets and aliasing, hostile byte views, overlapping
copies, defensive debug reads, stale/foreign addresses, source ownership, and
opaque pointer-looking payloads without invented type/provenance checks.

The new [runnable example](research/temporal-byte-example.mjs) reproduces the
original `(3+5)*9 = 72` changing to `(3+5)*6 = 48`, including mutation of both
caller buffers after capture. The [complete C-like byte API](research/temporal-byte-api.md)
is now the current core document; the typed document points to it and remains
preserved. The aggregate runner includes both new suites.

Final aggregate run on **2026-09-06**, Node v21.7.3: **PASS**. All previous suites,
including the selected mutation checks, still pass over their retained adapters.
The main agent independently reran the two new suites and the executable example.

### Limits retained rather than hidden

Untyped bytes cannot identify a pointer field, invoke a destructor, normalize
padding, or provide portable serialization. Destination/controller ownership
remains enforced, but the raw payload does not preserve the typed adapter's
tagged-pointer policy. A native `const void*` does not inherently carry source
allocation bounds; the C caller must satisfy the readable-source contract.
Native pointers, allocation lifetime, endianness/padding choices, external
effects and arbitrary shared mutable histories remain separate responsibilities.
The prototype still uses full replay; this change is not a native-performance
or selective-scheduler result.

## Entry 30 — TEMPORAL_LIMIT is prototype policy, not a temporal primitive (2026-09-06)

The author asked whether `TEMPORAL_LIMIT` represents a real requirement or an
unnecessary addition. It is an implemented, tested outcome, but the distinction
must be explicit: **the execution budget and its separate status were design
choices for this bounded prototype, not requirements established for Tower.**

The interpreter defaults to 100,000 instruction steps and a call/history-entry
depth of 64, with a separate structural nesting guard. Exceeding these checked
limits during repair maps to `TEMPORAL_LIMIT`. The budget covers the operation
and descendant execution; it is not a fresh quota per child. A failed repair
consumes its edit and preserves the old published subtree. It does not publish
partial progress or return a resumable repair. This status does not mean a
timepoint is too old, a dependency is untrackable, or memory allocation failure
has been comprehensively handled.

Rechecked the implementation and reran
[nested adversarial validation](research/temporal-nested-adversarial.mjs):
**19 cases / 128 assertions pass**. Specific tests correct a child workload
from 1 to 1,000 under a 40-step budget, and a recursive depth input from 1 to 10
under a depth limit of 4. Both return `LIMIT` without changing the previously
published state; recursive child entry has a corresponding rollback test.

A distinct `TEMPORAL_LIMIT` enum case is **not necessary for the minimal temporal
API**. Tower could omit this explicit budget policy or report such exhaustion
through a general runtime failure mechanism. A separate case is useful only if
callers should distinguish this policy outcome from other failed execution.
No runtime behavior or API declarations were changed for this explanatory
question; the existing implementation and evidence are preserved.

## Entry 31 — Destination ownership is metadata, not a property of void* (2026-09-06)

The author asked how `temporal_write(destination, source, byte_count)` finds
"the history owning destination." The current implementation does not infer
ownership from a bare native pointer. `address(history, offset)` creates an
opaque token with private `{ owner: node.handle, addr: offset }` metadata.
`addressInfo(destination)` retrieves that metadata, verifies the history still
exists, and supplies its node to `rawWrite`. The write then checks controller
authority, conflicting edits and byte bounds before recording the event.
This was verified directly in `temporal-nested-api.mjs`, lines 247–259 and
425–435, with an independent read-only implementation audit.

The C-like `void*` declaration leaves an important native implementation
requirement implicit: destination storage must already have an unambiguous
history association. A possible native implementation would maintain an
address-range/allocation-to-history map, with compiler/runtime registration of
tracked storage. That could preserve ordinary pointer representation without
requiring a source-language type or a fat pointer. It is an implementation
option, not an implemented or benchmarked mechanism in this prototype. Global,
stack and heap storage registration, lifetime and address reuse still need a
native contract; ordinary LLVM loads/stores alone do not establish that contract.

In a fixed single-history configuration, qualifying tracked storage could all
use the default history. Multiple histories require additional association or
an explicit target-selection rule. Adding a History argument would select a
target but would not, by itself, validate storage ownership or define shared
memory semantics. Ownership here selects a history; it does not replace
byte-level dependency tracking or imply one dependency for an entire region.

The existing tests validate metadata-based owner lookup in fake memory, not
automatic ownership discovery for arbitrary native C pointers. No allocation
API, native mapping scheme, or changed write signature was introduced for this
explanatory question.

## Entry 32 — Where the proposed tracked ranges would come from (2026-09-06)

The author correctly pressed on the missing creation step: an address-to-history
table does not explain who populates it or how ownership is chosen. The ranges
in the preceding explanation were illustrative native implementation machinery,
not ranges established by the current C-like management API.

Rechecked the actual prototype, including an independent read-only audit:
`createRuntime` captures a fixed-size initial byte template; `emptyFrame` creates
a fresh `Uint8Array(initial)`; root construction and `temporal_create` each use
`freshNode` to obtain a history with its own fake memory. Histories therefore
have separate synthetic byte spaces with offsets starting at zero.
`address(history, offset)` makes an owner-and-offset token into that already
existing fake space. It does not register a real variable, global, stack frame,
or heap allocation. There is no native tracked-address-range registry here.

In the proposed native mapping approach, compiler/runtime storage-creation
machinery would have to register storage with a chosen history. The ownership
selection rule remains unspecified: `History h = temporal_create(); int x = 0;`
does not, under the existing declarations, establish that `x` belongs to `h`.
An ordinary pointer plus its size does not supply that missing policy. Recording
memory dependencies and assigning storage to independently controlled histories
are separate concerns in the current model.

This does not establish a need for user-written region declarations or another
public allocation operation; compiler-managed ownership is also a possible
design. It does establish that the validated fake-memory core is not yet a
complete native storage/execution integration contract. No such policy or new
API was silently selected for this explanation.

## Entry 33 — Implemented the non-convenience core and explicit compiler boundary (2026-09-06)

The author required a complete minimal API, executable prototype and adversarial
validation, with compiler intrinsics named `builtin_temporal_*` and placed first.
The previous eleven-method byte API was not complete as a native-facing contract:
it hid ownership in an Address token and execution entry in a driver helper.
Its public append-write operation was a convenience, not the hook responsible
for tracking ordinary assignments. Those distinctions are now explicit.

### Current deliverables

- [Complete commented C declarations](research/temporal-core.h): compiler
  intrinsics first, followed by ten user operations.
- [Executable core](research/temporal-core-runtime.mjs): a new fake-opcode runtime
  with numeric addresses, allocation ownership/lifetimes and atomic subtree replay.
- [Written contract](research/temporal-core-api.md): storage, execution, arguments,
  points, transactions, identities, failures and evidence boundaries.
- [Runnable original examples](research/temporal-core-example.mjs) and their
  [C-like source spelling](research/temporal-core-example.c).

The earlier files are retained, not destructively rewritten. The byte document
and index identify the new core as current. No application-object/reactive
component API was introduced; this remains a general-purpose byte/opcode model.

### Removed convenience and hidden assumptions

The user operations are exactly `create`, `destroy`, `run`, `point`, `edit`,
`store_at`, `replace`, `remove`, `repair`, and `cancel`, each with the `temporal_`
prefix. There is no public `temporal_write`, mark/label lookup, extra temporal call
for ordinary functions, or `TEMPORAL_LIMIT` status.

One insertion operation covers both past and current-end writes. A Point captures
the exact current gap, including the start of an empty history and a paused tail.
It is frozen rather than following later execution. Points survive successful
repair while their producer occurrences survive; removing mark/lookup would not
have worked with the previous publication-expiring Point policy.

Replacement remains because removal plus insertion is not equivalent: replacing
the first of two overlapping same-gap writes must preserve its earlier position
and identity. A new insertion follows existing ones and can change the result.
Tests and an intentional reordering mutation establish this distinction.

The compiler hooks are `builtin_temporal_global`, `builtin_temporal_alloc`,
`builtin_temporal_free`, `builtin_temporal_load`, and `builtin_temporal_store`.
Static registration supplies the actual fake address and extent and assigns the
default root. Allocations receive their owner from the executing history, not
from proximity to a `temporal_create` call. Ordinary calls inherit execution
history; `temporal_run` explicitly enters a controlled child/root. The interpreter
also executes/traces ordinary arithmetic, temporaries, branches, loops, parameters,
calls and returns. Memory hooks alone are not represented as the whole compiler.

There is no user `bind` operation or fixed initial arena requirement in this
revision. Separate globals can have unrelated addresses. Dynamic allocation/free
are modeled instruction effects, including alignment, ownership, zero-initialized
birth and historical liveness. Destination validation happens at the insertion
gap during repair, so a currently freed allocation can still be amended at a
point where it was live. Sources are instead captured at the API call and must
be readable then. Tracked sources generate byte-read dependencies.

The simulation reserves allocation addresses rather than recycling them for
unrelated allocation occurrences. This is not a production native reclamation
algorithm. The loader/host split is explicit: temporal-module globals are root
storage; foreign controller storage is not simultaneously assumed to be root
storage and freely mutable. Source argument blobs are copied; pointees are not.
An entry returns a machine word, allowing it to return a child allocation pointer
without a hidden output/discovery API.

### Actual defects and contract counterexamples found

An independent test/audit effort ran alongside implementation and main-agent
review. Corrections included lost child allocation identities during ancestor
reconstruction, unfinished descendant edits being published by a forward entry,
non-byte typed arrays accepted as source bytes, numeric handle collisions between
runtime instances, missing checked malformed-call handling, and a depth-accounting
cleanup issue. Dependency diagnostics were expanded with parameter/call-result,
argument-capture and allocation-initialization bridges. Prototype patch traversal
was made iterative to avoid an unmodeled recursive chain of inserted gaps.

The most important design counterexample concerned permanent handle revocation.
Suppose a host runs a root entry that creates a child, receives its live handle,
then passes those handle bytes to a later retained entry that destroys the child.
A no-op root repair must replay that formerly valid earlier use. Giving the
surviving creation a fresh handle merely because the child is destroyed **now**
makes the frozen argument bytes invalid. The naive freshening change was tried,
produced `TRAP`, and was reverted.

The resulting rule is precise and consistent with temporal allocation lifetime:
**removing a producer occurrence retires its identity; undoing a later lifetime
end may restore the same surviving object.** Thus undoing destruction/free can
make the same creation live again, and undoing a tracked cancellation can commit
the same insertion occurrence. This avoids inventing type-aware rewriting of
opaque captured bytes or a second public/private capability API. The earlier
blanket "never revive" wording was an unnecessary overconstraint, not a user
requirement. Four dedicated regressions cover retained raw handle bytes,
reversible destruction, reversible cancellation, and genuinely removed creation
occurrences receiving a different identity on later reappearance.

### Final validation for this revision

All commands below were rerun by the main agent, not accepted only from agent
reports. The full retained aggregate passed on **2026-09-06**, Node **v21.7.3**.

- [Numerical validation](research/temporal-core-validation.mjs): **8 cases,
  433 independent fresh numerical comparisons, 432 successful repairs,
  875 assertions**. Includes original loads/stores, 320 seeded arithmetic
  corrections, empty-cell dependencies, historical lifetime and 96 three-level
  controller corrections. The oracle is independent numerical computation, not
  a separately implemented complete allocator/identity interpreter.
- [Adversarial validation](research/temporal-core-adversarial.mjs): **32 cases,
  302 assertions, 71 expected failures, 66 successful repairs**. Covers byte
  overlap, source capture, arbitrary write extents, stable/frozen points, insertion
  ordering, orphan rollback, allocation/free, ownership, readonly argument
  lifetimes, nested destruction/repair, raw handles and exact public method set.
- [Declaration checks](research/temporal-core-surface.mjs): **57 assertions**;
  the C header's five compiler and ten user declarations match the actual
  executable names, order, argument forms and arities. This is not native C
  compilation/linking.
- [Mutation validation](research/temporal-core-mutations.mjs): **8 baseline probes
  pass, 8 deliberate behavioral defects detected, 0 survivors**. Actual runtime
  source is changed in memory only. Syntax/import failures do not count as a
  detected behavioral defect.
- [Original runnable example](research/temporal-core-example.mjs): **PASS**,
  `72 -> 48 -> 56 -> 72`, then the middle insertion `80 -> 88`, with separate
  globals, ordinary stores and a stable saved Point.

The new numerical/adversarial/declaration checks total **1,234 assertions**;
this count excludes the additional mutation probes and example assertions.
Every earlier retained suite also passed through
[temporal-validation-all.mjs](research/temporal-validation-all.mjs).

### What this establishes, and what it does not

This is a working, tested minimal management interface for the specified
single-threaded deterministic machine and recursively controlled histories.
"Minimal" refers to distinct required responsibilities, not a theorem that no
alternative encoding could combine functions with flags or tagged commands.

The engine performs **full replay**. Its per-execution diagnostic traces are not
a persistent, version-qualified global incremental invalidation graph. Passing
tests do not establish native speed, LLVM lowering, a production dependency
scheduler, all-program correctness, native C safety, physical allocation
reclamation, external I/O/FFI replay, concurrency, arbitrary shared mutable
histories, or self-editing continuation resumption. The header and source example
are C-like specifications; the executed implementation is JavaScript/fake opcodes.

## 2026-10-15 Native LLVM storage and selective repair experiment

The next experiment addresses the distinction between the preceding Node
semantic proof and actual native execution cost. The user also raised indefinite
history growth in an editor and paging old asset-import histories to disk, and
confirmed that the current ten-operation C API above remains the target.

Artifacts:

- [Native build, scope and reproduction](research/native-temporal/README.md).
- [Storage model, measurements and editor retention design](research/temporal-native-model.md).
- [LLVM construction and load/store lowering](research/native-temporal/generate.py).
- [Native runtime, public API example, oracle and benchmark](research/native-temporal/benchmark.cpp).
- [Raw timing samples and build provenance](research/native-temporal/results/windows-x64.json).
- [Compiled mutation results](research/native-temporal/results/mutations.json).

### What is native and what is supported

LLVM 20.1.8, through llvmlite 0.46.0, verifies/optimizes generated LLVM IR and
emits Windows x64 COFF objects. MSVC compiles the runtime and links a native
executable. Python is a build/measurement driver only. The workload contains an
actual native arithmetic loop, six ordinary LLVM loads and two stores; the
lowering replaces every state load/store in the tracked variant. The resulting
audit finds zero unlowered state memory operations. Ordinary compiler spill
slots and runtime metadata are not temporal application state.

The example includes the existing `temporal-core.h`, creates an end Point,
inserts a captured input through `temporal_store_at`, runs the native entry,
and later replaces that past input through `temporal_replace`/`temporal_repair`.
Generated callbacks use the existing `builtin_temporal_load/store` signatures.
The internal `nt_*` hooks are harness/runtime plumbing, not an API revision.

This is a fixed-memory-access-shape, aligned-u64, isolated-history subset.
The repair unit is an entity update, not an individual arithmetic opcode.
Every read records its exact word producer; every ordinary state store produces
a new version. A chronological dirty queue reruns affected native regions and
cuts propagation at equal outputs. Candidate values publish only after successful
shape validation. The history arena and per-repair buffers allocate once, not
per instruction. Supported past editing is replacement of a captured input;
insertion into an older gap and removal are not implemented.

Nested histories, default-root globals, allocation/free lifetime lowering,
arbitrary byte overlap, general callbacks, internal-instruction Points, changing
trace topology, raw-pointer persistence and a production validation boundary
remain outside this native experiment. The earlier Node models remain the wider
semantic evidence. This native test does not upgrade those models' coverage
claims into a general native proof.

### Results and checks

On a Ryzen 9 5900HX, Windows 11 x64, the retained measurement uses 1,024 entities,
64 ticks, one correction at tick 16, one discarded warmup and 15 measured trials.
Snapshot replay starts at the exact correction-tick checkpoint and refreshes the
suffix checkpoints. Undo/redo reverses and re-records the suffix writes. Thus the
baseline does not unnecessarily rerun the unaffected prefix.

For 32 mixing iterations per update and independent entities, plain execution
takes 1.427 ms, write-only recording 1.679 ms, snapshot recording 1.658 ms, and
selective recording 11.339 ms. Selective repair takes 0.028 ms and reruns 48 of
65,536 updates; snapshot replay takes 1.180 ms. The sparse repair is about 43x
faster, but recording plus one correction is slower overall. With a shared
dependency, 49,152 updates rerun and selective repair takes 5.657 ms against
1.211 ms snapshot replay. For more expensive independent updates, selective
recording is about 1.48x plain execution and repair about 321x faster than
snapshot replay. Cheap updates show much higher recording overhead. These are
measurements of this implementation, not a proven minimum overhead.

Native validation passes 304 retained-history correction comparisons, plus
public API/capture/cancel/no-op/killed-write/atomic-trap cases. All versions are
checked against an independent C++ numerical oracle, not just final memory.
Four runtime mutations compile successfully and are rejected by behavioral
assertions: lost subscriptions, reading present instead of historical values,
publishing a failed repair, and scheduling unchanged values. No mutation
survives. All 18 existing Node validation suites pass unchanged.

### Memory and disk findings

For this workload, the arena consumes `228 * updates + 176 * entities + 640`
bytes, plus separately reserved scheduling scratch. The retained 64-tick history
is 14.42 MiB plus 1.03 MiB scratch for 32 KiB of current state. Snapshots consume
2 MiB; the write-only undo log consumes 3 MiB. Continuing this layout at 60 Hz
and 1,024 entities projects to approximately 47 GiB/hour before compaction.

The same arena can record directly into a file mapping. A flush/unmap/remap test
and a separate-process reopen both repair correctly and match every historical
version against fresh execution. The retained file is 15,123,072 bytes. Flushing
takes 200.249 ms in the smoke test; the post-remap repair takes 0.609 ms, and a
separate-process repair 0.379 ms. OS cache contents are not evicted, so these are
not cold-drive latency measurements. No resident-memory cap, large-history paging
benchmark, asynchronous writer, eviction policy or crash recovery is established.

The editor design retains immutable captured file versions, replaces the original
input on a watcher notification, and lets the ordinary temporal graph propagate
the change. Changing file sizes needs a fixed-size captured descriptor plus
retained blob/lifetime semantics, because replacement preserves write extent.
GPU/FFI/filesystem effects remain explicit publication boundaries. Paging is
compatible with stable Points; deleting old history silently is not. Long-running
use needs both cold storage and a defined policy for pinned history, reconstruction
from checkpoints, reachable computation caches and bounded simulation windows.

## 2026-11-15: Minimal rebuild, structural edits and automatic region tracking

### Author's motivation and desired programming model

The author clarified that minimal rebuild was an original motivation for temporal
opcodes. Their experience of unreliable compiler minimal-rebuild systems,
including Microsoft's VC++, and the burden of compiler-specific AST diffing
motivated a more general mechanism. This is the author's experience and design
motivation, not a newly verified assessment of those compilers.

The desired outcome is to write a scripting language/compiler in Tower and have
ordinary execution participate in incremental rebuilding. Its author should not
need to manually declare every pointer/global dependency or maintain a separate
invalidation implementation for every compiler pass. Tower remains a
general-purpose language; compilation is a motivating application.

The author proposed supplying a richer diff to temporal reconciliation: insertions,
moves, deletions and replacements, rather than only reporting changed bytes at
fixed addresses. They also favored compiler-selected recomputation regions, with
heuristics analogous to inlining, provided pointers, aliases and globals remain
correctly tracked.

### Feasibility and the performance distinction

**Assessment:** this is a credible design direction. Complete dependency tracking
supports correctness; stable identities and suitable recomputation granularity
determine whether small edits preserve enough work to make repair worthwhile.
The useful contract is agreement with fresh execution under the same inputs and
effect model, not an assurance of the mathematically smallest possible rebuild.

Existing native measurements illustrate the tradeoff: the independent work-32
case recorded at about 7.9x plain execution cost while sparse repair was about
43x faster than snapshot replay. The work-256 case recorded at about 1.48x plain
cost. These are previously measured synthetic, fixed-access workloads, not
compiler benchmarks or lower bounds. See [the native analysis](research/temporal-native-model.md).
Repeated edits in a persistent compiler session could amortize initial recording,
but that must be measured on a representative workload.

Related work supports both ingredients. [Traceable Data Types for Self-Adjusting
Computation](https://www.cs.cmu.edu/~guyb/papers/ABLT10.pdf) extends tracing from
individual memory operations to queries and updates on abstract data types to
reduce dependency overhead. [Incremental Computation with
Names](https://arxiv.org/abs/1503.07792) uses names to identify reusable computation
across executions and establishes from-scratch consistency for its calculus.
These are precedents, not proofs of Tower's proposed implementation.

### Structural diffs and stable identity

An insertion into a contiguous source buffer changes many subsequent addressed
bytes. A correct byte tracker may consequently invalidate most of the parser.
A diff can identify surviving text, but cannot reinterpret an old observation
of numeric offset 10 as an observation of whichever character used to be there.
The value at that offset may really have changed.

A candidate standard sequence/text representation uses stable item or piece
identities, backed by a piece table or persistent tree. Distinguish observations
of contents, adjacency/order, membership, length and current numerical position.
Inserting before a surviving piece can leave its contents unchanged while
changing its position; inserting after an item changes its successor. All these
observable facts must participate in tracking. Stable identity alone is not a
complete incremental sequence implementation.

Proposed conceptual pipeline:

```text
editor operations, or diff(old source, new source)
    -> update a sequence while preserving surviving identities
    -> repair the recorded compiler/interpreter computation
    -> publish revised results and diagnostics
```

Candidate collection operations are `insert(anchor, items)`, `delete(range)`,
`move(range, destination)` and `replace(item, contents)`. These are design sketches,
not additions to the agreed temporal C API. They can lower to tracked state
changes or use a separately specified traceable-collection implementation.
Direct editor operations should preserve correspondence when available; external
file replacement can use a diff. Ambiguous move matching can conservatively fall
back to deletion/insertion, sacrificing reuse without sacrificing correctness.

A move preserves identity, not necessarily computed meaning. Moving code into a
different scope must invalidate relevant name-resolution dependencies. Duplicate
text is not automatically the same logical object. Execution identity also needs
attention: identifying work solely by loop iteration number shifts correspondence
after insertion. Stable source items need a suitable mapping to surviving dynamic
computation and allocation occurrences.

Compiler utilities could support ordinary functions such as parsing from a source
anchor and context, resolving a syntax node in a scope, checking a declaration,
and generating code for a function. Automatic tracking and equality-based stopping
can avoid manual dependency lists. Efficient reuse still depends on representation:
fresh identities on every parse, flattened buffers and pervasive absolute offsets
can create unnecessary changes. Source-position observations should be separated
from semantic observations where appropriate. Reparsing a changed file in full
could still preserve expensive downstream work if equivalent outputs retain
usable identity/equality semantics.

Some broad invalidation is necessary: a quote or comment delimiter can alter the
rest of a file, and a shared declaration can affect many consumers. Missing-name
lookups must depend on continued absence so a newly introduced declaration is
noticed. File contents and configuration must enter as tracked inputs.

### Region boundaries do not eliminate dynamic memory instrumentation

**Clarification:** assigning dependencies to a function or region does not mean
observing memory only at entry and exit. Accesses inside the region still need
instrumentation wherever compiler analysis cannot safely remove it. The boundary
identifies the owner of those dependencies and the unit of reexecution.

For example:

```c
int calculate(Node* p) {
    int x = p->next->value;
    return x * global_scale;
}
```

The compiler knows the load instructions, but not necessarily the selected node.
At runtime the invocation depends on its argument, the observed version of
`p->next`, the selected node's value version and the global's version. Changing
`p->next` reruns the region and discovers new dependencies. Repair must update old
subscriptions. The system need not scan every object reachable through `p`.
Globals are tracked storage too; they are not inherently untrackable or forbidden.

Pointers that alias are recognized through actual storage identity and overlapping
byte ranges, rather than variable names. Allocation identity and lifetime separate
historical objects from later objects at reused numerical addresses. Ordering and
memory versions remain essential:

```c
int example(int* p, int* q) {
    int a = *p;
    *q = 7;
    int b = *p;
    return a + b;
}
```

When `p == q`, the reads observe different versions. Neither deduplicating by
address alone nor moving both observations to entry is sound. Repeated reads of
the same version within a region can share a dependency when the complete trace
and historical-observation contract permits it.

Exact pointer targets, call targets and access sets are not generally known
statically. Conservative compiler analysis can prove some accesses independent,
some state private and some values invariant. LLVM's [alias and Mod/Ref
analysis](https://llvm.org/docs/AliasAnalysis.html) supplies relevant machinery;
uncertainty must retain conservative behavior. Static analysis reduces cost,
while runtime instrumentation supplies unresolved facts.

Candidate implementation choices:

- Scalar inputs and proven private temporary state: ordinary native computation
  with dependencies/effects recorded at its external boundary.
- Predictable memory ranges: batch observations where version, ordering and
  lifetime semantics permit it.
- Dynamic addresses, aliases and calls: instrument actual accesses and supported
  callees. Unknown aliases are not permission to omit tracking.

A region's outputs include writes, allocation/lifetime changes and other modeled
effects, not only its return value. Repair must replace old historical effects,
including retracting a store when a changed branch no longer executes it. An equal
return value does not hide changed writes. Rerun must observe the corrected
historical state at its execution point, not simply the latest live memory.

### Inlining-style heuristics and legality

The author supports heuristics for choosing recomputation granularity. Candidate
policies merge tiny helpers into callers, retain expensive computations with narrow
dependencies as separate regions, and split large loops into iterations or chunks.
Profiling could identify regions that repeatedly invalidate together. Larger
regions reduce bookkeeping but redo more work on invalidation; smaller regions
offer finer reuse at higher recording/scheduling cost.

Correctness must not depend on the quality of a heuristic. First establish legal
region boundaries and transformations, then choose among them by estimated or
measured cost. A poor choice should cause extra work or storage, never stale output.
Region selection need not follow source-language function boundaries exactly.

Historical Points are observable constraints. If the API permits an intervention
inside a function, an opaque entry/exit record alone loses required behavior.
The implementation must preserve that boundary or retain sufficient information
to reconstruct its exact historical position and effects. Coalescing writes or
discarding internal records must also respect retained Points and history policy.

Automatic coverage requires all relevant execution to participate: instrumented
Tower code, supported indirect calls, bulk memory operations and lifetime events.
Foreign code, external mutations, I/O and concurrency require explicit semantics
and integration. A conservative summary that foreign code may write anything
does not capture its actual effects or make external effects reversible. The
initial reasoning here assumes deterministic, single-threaded tracked execution.

### Evidence boundary and next experiment

The native prototype already demonstrates region repair but requires unchanged
access addresses/order/counts. It does not yet implement general pointer-graph
changes, dynamic dependency reconstruction, native allocation lifetimes or internal
Points. The broader executable model specifies more semantics but uses full
replay. Neither establishes a production incremental compiler.

A proposed next experiment is a small scripting-language implementation with
stable source identities and automatic tracking. Compare every repaired result
and observable effect with fresh execution after insertions, moves, deletions,
scope changes, aliasing writes and changed pointer/call targets. Measure initial
recording cost, retained memory and repeated-edit latency separately. Exercise
dense invalidation and any fallback as well as favorable sparse edits. This is a
recommended experiment, not newly authorized implementation work.

**Outcome:** pursue automatic instrumentation with conservative static optimization
and heuristic region selection, plus structural input edits that preserve useful
identity. This entry records the discussion and checked prior sources; it adds no
runtime implementation, API revision, benchmark or correctness proof.

## 2026-11-15: Tracking LLVM execution through final code emission

The author wants incremental work to extend through opcode construction,
optimization and machine-code emission. Their ideal example is changing a literal
and changing only the corresponding immediate byte in the output executable.
They value LLVM's comprehensive existing machinery and proposed translating LLVM
into Tower rather than independently reproducing all its optimizations.

Two meanings must be distinguished. Translating an application's LLVM IR into
Tower opcodes does not import LLVM's optimization implementations. Compiling
LLVM's C++ implementation to LLVM IR and translating that implementation into
temporally instrumented Tower execution could bring the optimizer/backend itself
inside the tracked computation. Instrumented native compilation is compatible
with this direction; an interpreter is not inherently required.

```text
LLVM optimizer/backend C++ implementation
    -> compiled LLVM IR describing that implementation
    -> Tower lowering with temporal instrumentation
    -> tracked execution of optimization and code emission
```

This requires a defined supported IR/runtime boundary: memory/lifetime operations,
indirect calls, bulk memory, intrinsics and external facilities must be handled.
LLVM poison, undefined behavior and other semantic details cannot be translated
by merely matching opcode names. The [LLVM language reference](https://llvm.org/docs/LangRef.html)
defines that compatibility problem. This is a proposed route, not an implemented
LLVM importer or evidence that all LLVM code is currently supported.

The desired dependency chain includes source, syntax/semantic values, IR
construction, optimization decisions, instruction selection, encoding and output
publication. LLVM mutates intermediate representations: amend an earlier input
and repair subsequent execution rather than assuming that modifying an already
optimized module recreates its original decisions.

An illustrative fixed x86 encoding makes the author's target concrete:

```text
return 42: B8 2A 00 00 00 C3   // mov eax, 42; ret
return 43: B8 2B 00 00 00 C3   // mov eax, 43; ret
```

Only one encoded byte differs if those instructions and layout remain selected.
Compiler work can still be required to verify that previous decisions remain
valid. A one-byte output difference does not imply one operation of repair work.
Other constant changes legitimately affect folding, branches, instruction sizes,
register allocation or inlining, and can propagate into layout and relocations.
See [LLVM transformations](https://www.llvm.org/docs/Passes.html) and its
[code generator](https://llvm.org/docs/CodeGenerator.html).

Faithfully tracking LLVM also tracks incidental dependencies in allocators,
work queues, hash tables and mutation order. Translation alone does not make those
algorithms stable under small edits. First establish correctness for a selected
pipeline; then measure and improve allocation/computation identities, region
boundaries and the specific structures causing excessive invalidation.

Output publication needs its own tracked model. Unchanged-size fragments at stable
addresses permit small patches. Growth can move other fragments; reserved space,
stable placement or indirection can trade code size/quality for less disruption.
Checksums, build IDs and debug metadata can change beyond the instruction bytes.
History-dependent placement would need an explicit reproducibility policy rather
than an unqualified claim of byte-for-byte equality with a canonical fresh link.

The inspected [scaffolding](../scaffolding/main.cpp) already constructs an LLVM
module and emits object code through LLVM APIs. The current CMake configuration
enables the WebAssembly backend; an x86 experiment needs corresponding backend
configuration. A future experiment should change a literal through a small
optimization/emission pipeline and measure both rerun computation and changed
bytes, followed by instruction-size and control-flow changes. Full LLVM translation
is a later milestone, not the prerequisite for getting Tower's bootstrap working.

## 2026-11-15: In-language parser extensions and compiler in the runtime

The author reaffirmed that the parser is part of the Tower compiler, the compiler
is available in the runtime, and ordinary Tower code should extend the language.
Their notes explicitly describe optional language features such as `foreach` and
captures such as:

```text
ForEach = 'for' '(' $Variable 'in' $Expression ')' '{' $Statement+ '}'
```

See [the original notes](../todo.txt), including the feature discussion near line
1499, staged parsing near 3180, and captures near 8021. Line positions describe
the inspected version. The example's `+` requires at least one statement; accepting
an empty body would require the library's grammar to permit it.

A feature module can own its grammar, captured syntax schema, binding/type rules,
lowering and diagnostics. `foreach` can lower to ordinary control flow and calls,
then use the common optimizer/backend. Generated bindings need hygienic identity;
the collection should be evaluated with the intended frequency, and control exits,
scope and cleanup must preserve the feature's specified behavior. Source provenance
and access to trivia/text remain useful even when punctuation is omitted from
semantic captures.

Recognition, elaboration and execution may use the same runtime while retaining
distinct dependencies. Parsing need not finish type checking immediately. Extension
installation that changes subsequent syntax does need a defined activation point.
An initial rule is: parse the extension declaration under the current grammar,
compile/execute it, then activate the resulting grammar for subsequent constructs
in its scope. This supplies a finite bootstrap and avoids a declaration requiring
its own not-yet-installed syntax.

For LALR parsing, an active stack belongs to a particular table. Swapping tables
does not automatically preserve state identities. Activation requires suitable
boundaries, restart, or a defined state-migration mechanism. Grammar composition
must detect conflicts or impose sufficient compatibility restrictions; separately
valid extensions are not automatically compatible. Scoped grammar environments
avoid unrelated modules silently changing syntax.

Temporal tracking must include grammar observations, successful and unsuccessful
lookups, binding environments, and extension implementation versions. An unused
new alternative can still change tokenization or a previous parse decision.
Changing handler code is not detected solely by its old data-read dependencies.
Historical repair also needs to retract generated declarations, diagnostics and
other modeled effects when an extension's revised execution no longer produces
them. A grammar change may legitimately invalidate a large parse suffix.

Relevant precedents include Lean's [syntax/elaboration environment](https://lean-lang.org/doc/reference/latest/Elaboration-and-Compilation/)
and [hygienic macros](https://lean-lang.org/doc/reference/latest/Notations-and-Macros/Macros/),
and [ableC's language-extension composition](https://melt.cs.umn.edu/ableC/).
These establish related capabilities, not Tower's proposed temporal integration.

## 2026-11-15: Component-based compiler data and the first bootstrap milestone

### Author's direction and current repository evidence

The author wants a generic, script-traversable tree and proposes ECS-style
components whose declarations belong to the compiler module itself, eventually
written in Tower. The concern is how to reach that model before Tower can compile
its own compiler. This is an architectural discussion and journaling request;
no runtime rewrite or implementation is performed in this entry.

The existing native scaffold is C++ with a C-like interface. `TowerNode` already
has an identity, typed attached payloads, named/ordered children and generic
component/child enumeration. Component types themselves are represented by nodes.
Storage currently uses raw pointers, reference counts, per-node vectors and
separate component allocations. This is a useful component-based starting point;
it need not be discarded to adopt an ECS-style logical model.

The inspected `parser_recognizer_step` remains unfinished: reduction-child
attachment, reduction/source-span handling, callback/event delivery and the returned
tree contain TODOs; the function currently returns null. Table/stream lifetimes
also have an explicit TODO. Existing parser/table tests do not establish a complete
parse-to-script pipeline. These are source observations, not newly executed tests.
See [tree implementation](../scaffolding/tower.cpp), [tree API](../scaffolding/tower.hpp)
and [recognizer](../scaffolding/parser.cpp).

### Recommended data model

Treat a syntax node as a logical entity and compiler facts as typed components.
Candidate schemas include `SourceSpan`, `IntegerLiteral`, `BinaryExpression`,
`ForEachSyntax`, and separate derived facts such as resolved binding or inferred
type. Compiler and extension modules own those declarations; the general storage
layer understands identities, component types, layouts/lifetimes and relationships,
without knowing what a particular language construct means.

An ordinary Tower record can be registered as a component. This does not require
every Tower object or every field to become an entity. Component granularity
should group useful data; a runtime may later track individual observed fields.
Source positions should not be the identity of semantic nodes.

Generic traversal requires reflection beyond a type ID and payload byte count:
field names/types, access/layout information, and relationship roles. Distinguish
ordered syntax-child edges from semantic references to declarations, types or
control-flow blocks. The syntax hierarchy can remain a tree, while the complete
compiler data is a graph. A generic syntax walker must not recursively traverse
every entity reference or take ownership of every semantic link.

Choose one authoritative representation of child relationships. Typed accessors
and generic child enumeration should be views of that representation, or maintain
explicitly checked indexes; unrelated mutable child lists and component fields
must not silently disagree. Reflection can provide a visitor for components the
script did not know statically. Unknown components can be inspected generically;
their semantic meaning still requires the appropriate extension implementation.

Use logical identities rather than storage positions in the script-facing contract.
Initially an adapter can keep existing allocations behind opaque references.
Generational handles can detect stale reuse, but do not by themselves preserve
identity across reparsing or temporal repair. Surviving source/creation occurrences
need explicit correspondence. Retained history and current storage lifetime are
separate: freeing a current object cannot discard data still required by a Point.

An ECS-style model does not mandate archetype storage or a per-frame system loop.
Compiler passes can be ordinary dependency-tracked functions. Start with existing
storage or simple stable/sparse storage behind the contract; use measurements
before adopting moving dense layouts. Runtime registration and reflection have
precedent in [Flecs](https://www.flecs.dev/flecs/EntitiesComponents.html), but adopting
that library is not a decision made here.

Incrementality is not supplied merely by naming the storage ECS. Dependencies
include component presence/absence, fields, child ordering, query membership and
schema versions. A query for all nodes with a component must notice new matches,
not only writes to prior results. Derived facts need defined producing computations
so repair replaces obsolete facts/effects. Broad global scans can still cause
broad invalidation. Ordinary accesses should remain automatically tracked in the
eventual temporal implementation; this is not a request for manual dependency
declarations throughout compiler code.

### Bootstrap and implementation order

**Recommended first milestone:** a complete parse-to-component-tree-to-generic-visitor
path, followed immediately by a tiny Tower program using that same interface.
The first code patch should finish recognizer output using the existing node store
and a narrowly specified schema/traversal contract. A full ECS rewrite, full LLVM
translation and full temporal engine are not prerequisites for this patch.

1. Specify the small interface for node/type identity, reflected component fields,
   ordered/role-named children, semantic references and lifetimes. Define tiny
   expression schemas in a compiler bootstrap module using that interface. Add
   only the metadata needed for generic inspection and later scripted registration.
2. Complete shift/reduce tree construction, consumed spans, acceptance/root return,
   lifetime handling and useful failure reporting. Parse a small expression grammar
   and walk its typed components generically. Check actual tree structure and
   spans, including empty productions where supported; table construction alone
   is not sufficient validation.
3. Provide a minimal Tower execution path for functions, basic values, calls,
   control flow and the registration/traversal API. A small interpreter or the
   existing code-generation route is a bootstrap choice to settle with a focused
   implementation assessment. The small seed may use fixed syntax. Success is an
   actual Tower program traversing the tree and registering a component, not only
   a native callback pretending to be an in-language feature.
4. Move compiler schema declarations and one grammar/handler extension into Tower.
   Begin with a small syntax extension, then `foreach` once binding and loop
   semantics exist. Installation executes through the same interface previously
   used by the native bootstrap module. Remove duplicate native schema authority
   as each module moves across.
5. Add an edit/repair test through this pipeline against fresh execution, with
   surviving-node identities checked separately from semantic equality. Exercise
   literal changes, insertions, absent-component becoming present, and handler
   revisions. Report full replay honestly until selective work is actually measured.
   Grow the executable core until a Tower compiler can build the next compiler
   generation; then expand the tracked native backend/LLVM experiment.

The bootstrap terminates in a small native seed that knows primitive values,
type-descriptor representation, storage/access and enough execution to load the
next module. A schema is data that the seed can register before the final Tower
compiler exists. The seed does not need the final extensible language to parse
itself. Later Tower declarations generate equivalent descriptors through the
same interface. Runtime exposure of the compiler remains a goal throughout.

Component layout revisions need a defined policy: immutable/versioned descriptors,
recreation or migration of instances, and invalidation of dependent compiled code.
Do not overwrite a live descriptor and reinterpret old bytes under new offsets.
For the bootstrap, rejecting unsupported live schema replacement is adequate;
automatic migration can follow separately.

**Outcome:** retain the generic component-tree idea, make compiler schemas owned
by modules, and prioritize a working parser plus reflective traversal through a
small bootstrap. The nearest visible implementation gap is the recognizer's
unfinished tree output. This direction preserves the author's ECS-style extension
goal while providing a finite route to in-language declarations and self-hosting.

## 2026-11-15: Completed whole-input parse-tree construction and debug output

Implemented the first parser milestone in the existing native scaffold. Reductions
now attach consumed nodes in source order, record the reduced non-terminal and
specific production, compute spans from the consumed stack frames, and transfer
the accepted root to the caller. Generated helper productions flatten their
children; the start production retains a public root. Stream-supplied nodes retain
their identity, payloads and children. Destruction releases partial trees and owned
lookahead; completed trees retain copied labels independently of table lifetime.

`parser_tree_debug_print` and `parser_tree_debug_string` provide indented labels,
production indices and half-open source spans. Verbose table and shift/reduce traces
are optional. Unexpected input now terminates recognition with a diagnostic instead
of asserting. The recognizer-backed stream transfers one complete root and then
EOF, and propagates upstream errors; it is not a repeated tokenizer.

Executable tests exposed related existing table-builder issues: nullable reductions
in the initial state, lookahead through nullable suffixes, same-state empty reductions,
and successor lookup from a single kernel rather than the full LR0 state. These
were corrected along with disjoint/equal range transitions. Shared table transitions
and UTF-8 stream storage now have owning cleanup; the decoder checks end-of-input
before dereferencing the input pointer.

The retained [public-API tests](../scaffolding/parser-tree-tests.cpp) exercise exact
tree output, precedence/associativity, parentheses, an LALR-not-SLR grammar, empty
and generated productions, nullable sequences, UTF-8 byte spans, debug escaping,
node-stream payloads, layering, invalid input and early destruction. Node/component/
allocation counts return to baseline. The original scaffold checks also pass.
Validated with MSVC native debug execution, MSVC AddressSanitizer, the new standalone
CMake/CTest target (1/1 suite passed), and verbose trace execution. The full WASI/LLVM
application was not rebuilt. Reproduction and API ownership are documented in
[the parser test README](../scaffolding/tests/README.md).

This implements complete tree output for supported whole-input grammars. Repeated
tokenization, reduction callbacks, grammar-conflict recovery, general overlapping
range partitioning, script reflection and temporal instrumentation remain separate
work. No compiler self-hosting or incremental-performance result is claimed.

## 2026-11-15: In-source grammar declarations and the foreach example

Added a native bootstrap for source-level `parse Name = ...;` declarations and
`parse Name |= ...;` extensions. The declaration syntax is parsed using the same
LALR engine as application constructs. Its native evaluator registers rules;
application syntax is supplied by source, not by a native foreach special case.
[foreach.tower](../scaffolding/examples/foreach.tower) declares variables,
expressions, statements and the loop grammar, parses nested loops, then replaces
the loop keyword and parses the revised spelling later in the same file.

The bootstrap supports concatenation, alternatives, postfix repetition/optionality,
quoted token literals, rule references and named captures. Repeated captures have
one named container whose children are the captured items, including an empty
container for zero items. Primitive identifier/number/string token categories and
trivia handling remain native. Whole-word keywords and longest punctuation tokens
come from the active grammar revision. Scope is recorded in
[the usage documentation](../scaffolding/tests/README.md).

The new explicit prefix-recognition mode probes acceptance using EOF reductions
on a state-only copy before reading another token. It accepts the first nonempty
complete construct; it is intended for self-delimiting syntax. The syntax driver
destroys that recognizer before publishing the next grammar table. Consequently
the next token is lexed under the new grammar, even with no intervening whitespace.
Each declaration builds a candidate table; unresolved references, conflicting
actions and bootstrap validation errors reject installation without advancing the
published grammar revision. Checked table creation now returns diagnostics for
unresolved rules and action conflicts instead of aborting on those cases.

The [session interface](../scaffolding/syntax.hpp) exposes one tree per construct,
source position, grammar revision and errors. Earlier trees retain their labels,
captures and payloads across revision changes and session destruction. Numeric
non-terminal/production IDs are table-local, not stable semantic IDs across revisions.

Validation: native debug tests and MSVC AddressSanitizer pass. CTest passes both
the combined suite and the actual foreach example (2/2). Coverage includes immediate
keyword activation/replacement/removal, nested and empty loops, named captures,
optional/repeated forms, quoted delimiters, comments, conflicts, invalid source,
revision preservation on failure, lifetime counts, and exact stream-read boundaries
when switching tables. The full LLVM/WASI application was not rebuilt.

This implements parsing and declaration installation in a bootstrap grammar
language. It does not yet execute/lower loops, run arbitrary Tower functions as
handlers, implement scoped syntax imports or perform temporal repair. Tables are
rebuilt per declaration. The user's follow-up proposes an easy visual demonstration;
a browser playground showing source, grammar revisions and trees is under discussion.

## 2026-11-15: Static WASM playground and explicit errors

The browser playground now runs the Tower node/component runtime, parser, syntax
bootstrap and existing C++ tests in a WASI Preview 1 reactor compiled with Clang
from WASI SDK 34. The user explicitly chose Clang/WASI and then directed that we
remove C++ exceptions rather than add exception support. Grammar construction,
validation and scanning now return errors explicitly; failed declarations still
leave the prior grammar installed. Native tests and the browser module compile
with exception handling disabled. The old custom WASM exception implementation
was removed from the build and source tree.

The [playground](../playground/README.md) is a set of static files: HTML/CSS,
bundled JavaScript adapters and WASM. CodeMirror 6 supplies the current editor;
the parser runs in a worker. Reset and next-construct actions operate the actual
native session. Run reads through the rest of the source. A selectable history
shows each declaration/statement, its grammar snapshot, ordered tree nodes,
captures and source byte spans. Errors identify the stopping location. The
source can be opened, saved and edited locally, with automatic reanalysis.

Highlighting is supplied by Tower's scanner and successful parsed declarations.
Tokens record the revision under which they were read. A word can be an ordinary
identifier before a declaration, a keyword while that rule is active, then an
identifier again after replacement. Whole-word matching and longest punctuation
matching are shared with parsing. Strings and comments keep their lexical roles.
During stepping or after an error, unread source is previewed with the last
committed grammar; inspection never evaluates future declarations or consumes
the session's source. UTF-8 byte offsets are mapped to the editor's UTF-16 indices.

The versioned [C ABI](../playground/ABI.md) exposes creation/destruction, stepping,
inspection, caller-owned input buffers and borrowed JSON results. The browser
copies results before their native storage is reused. Tests cover lifetime counts
and repeated successful/failed sessions. Worker cancellation and generation IDs
prevent stale results after edits; a time limit can discard an unresponsive
instance. The page does not require a parsing server, CDN assets, shared memory,
threads or cross-origin isolation headers.

The user's longer-term direction is explicit: **the entire playground should
eventually be written in Tower, including rendering, the text editor and syntax
highlighting**. CodeMirror/DOM/JavaScript are bootstrap adapters. The session and
tree interface should survive replacing them; JSON is only the initial transport.
This does not yet implement stable identities across edits, temporal repair,
incremental table construction, loop lowering/execution or arbitrary Tower parser
handlers. Editing currently restarts parsing from the beginning.

Validation: the existing C++ suites pass inside WASM; all nine retained WASM
tests pass, including the LLVM compiler check; all eight Playwright checks pass
across desktop Chromium and Android mobile emulation. Native AddressSanitizer
passes without exceptions, and native CTest passes both tests. Desktop and mobile
screenshots were inspected. Physical mobile keyboards/IME remain a separate
device check.

The LLVM compiler experiment also builds successfully with WASI SDK 34 and
exception handling disabled. It loads on demand in a separate worker, runs the
scaffold checks, and emits a downloadable WebAssembly object into an in-memory
WASI filesystem. The emitted `sum.o` was linked with the SDK's `wasm-ld`; executing
its exported `mainCRTStartup` in WebAssembly returned the expected constant 124.
The parser module is 3,315,394 bytes and the optional LLVM module is 26,199,904
bytes before HTTP compression. Only the WebAssembly backend is included. This
validates LLVM running inside WASM; it does not compile the example's loops.

Build scripts pin and verify the SDK download, build matching native LLVM
TableGen tools, and cache a clean revision-pinned LLVM snapshot and intermediates
on the Linux filesystem for WSL. This avoids costly header access through the
Windows mount. The existing LLVM vendor checkout is unchanged. Rebuilding the
page copies the finished modules and bundles all browser dependencies locally;
the resulting `playground/dist/` can be served by an ordinary static HTTP host.

## 2026-11-16: Profiling and immediate live parsing

The user found live compilation/parsing slow and requested profiling and updates
as they type. Profiling the actual browser editor found a 450 ms trailing debounce
dominated latency. An edit also cleared visible results and could destroy a busy
worker. Native phase timings showed another avoidable cost: almost all of the
small example's parsing time rebuilt unchanged grammar tables.

Edits now schedule on the next animation frame, preserving the warm WASM worker
and coalescing pending edits to the newest source. Stale replies cannot replace
newer results. Highlight spans map through edits while the next result is pending;
the old inspector remains visible but cannot select stale source offsets. Local
storage persistence has its own debounce. Automatic analysis waits for IME
composition to finish.

Added native `syntax_reset` and C ABI `tw_reset`. Reset clears source progress,
errors, highlights, definitions and revision, while retaining at most 16 compiled
grammars in a session-owned LRU cache. Complete structural grammar definitions
are the key, including literals, captures, alternatives and repetition. Only
successful tables enter the cache. Reusing a table never activates a future
declaration early. Destruction releases the entire cache. Inspection exposes
build/hit/entry counts for profiling.

Measured desktop median edit-to-result DOM latency fell from 476.6 ms to 16.8 ms
(p95 19.6 ms); Android emulation fell from 478.4 ms to 17.4 ms (p95 19.1 ms).
Browser worker parsing is about 1 ms for the example, with no grammar rebuilds
after ordinary edits. A continuous 44-character burst now produced 44 live
updates rather than a single update after typing stopped. The Node/WASM full
example cycle fell from 24.89 ms to 1.29 ms median. The 500-loop stress case still
takes about 43 ms because parsing/tree serialization remains linear full-document
work. These are local measurements, not a guarantee for arbitrary grammars or
physical mobile hardware. [Performance notes](../playground/PERFORMANCE.md)
document methods, before/after timings and the reproducible profiler.

Validation: 10 WASM tests, 12 desktop/mobile-emulation browser checks and native
AddressSanitizer pass. Tests compare cached results with fresh parsing after
grammar edits, failures, Unicode offset changes, recovery and eviction; exercise
continuous typing and delayed replies; and verify cache lifetimes. Both parser
and LLVM WASM modules were rebuilt with exceptions still disabled. This is reuse
of compiled grammars, not yet temporal repair or stable incremental syntax trees.

## 2026-11-16: Token definitions in Tower and a minimal native bootstrap

The user requested that Identifier, Number and String become definable in Tower,
and that hardcoded C++/WASM language rules be removed where possible. They
explicitly accepted a small fixed internal reader to solve the chicken-and-egg
problem of reading the declarations that define the language.

Implemented `token Name = /pattern/ as style;` and
`skip Name = /pattern/ as style;`. Names are arbitrary; the scanner no longer has
special application branches for Identifier, Number or String. Ordinary
whitespace and comments also come from skip declarations. The default lexer is
now [syntax-bootstrap.tower](../scaffolding/foundation.tower) (since consolidated into foundation.tower), loaded as
source at runtime instead of being baked into the production scanner. Tests
successfully install a seed with a differently named `Word` terminal and no
Identifier/Number/String definitions. Changing the seed requires no WASM rebuild.

The native core retains the fixed declaration reader (names, quoted grammar
literals, token-pattern delimiters, parse/token/skip/as syntax and metadata
trivia), a bounded regular-pattern compiler, and the parser-table machinery.
This separation lets application identifiers or string delimiters change without
making subsequent declarations unreadable. The optional `@` identifier rule in
the demo applies to application token occurrences after that declaration; it is
not a new default or a requirement for declaration names. The user asked about
this distinction and confirmed understanding.

Patterns support Unicode scalar literals and ranges, negated character classes,
groups, alternatives, `*`, `+`, `?`, dot and explicit escapes. A Thompson NFA is
converted to a bounded DFA; errors are explicit and C++ exceptions remain off.
Nullable patterns, malformed patterns and excessive compilation complexity are
rejected. Matching uses longest match, grammar literals win equal ties, and
otherwise declaration order wins. Replacing a token retains its priority slot.
Lexical definitions, styles and skip flags participate in the session cache key.
Failed changes preserve the installed revision; inspection does not install
future declarations; reset restores the session's original lexical baseline.

The browser now offers ForEach, Token rules and Lexical bootstrap examples. The
grammar inspector shows active token patterns and styles. The new example parses
hyphenated/Unicode identifiers, decimals, backtick strings, a new Hex terminal,
hash comments, and a later identifier replacement in one source stream. Browser
ABI version 2 adds mandatory runtime bootstrap configuration and exposes token
snapshots. Both parser and LLVM modules use the external seed.

Validation: 13 WASM tests, 14 desktop/mobile-emulation browser checks and native
AddressSanitizer pass. Tests cover patterns, Unicode byte spans, longest match,
ties, cache reuse/invalidation, atomic failures, changing seeds, lifetime cleanup
and continued declaration parsing after token replacement. Desktop/mobile
screenshots were inspected. The original example still updates in about 17–18 ms
median, with roughly 1–2 ms of worker parsing and live updates throughout typing.
[Token documentation](../playground/TOKENS.md) records syntax, limits and the
remaining native boundary. General Tower parser functions, full self-hosting and
temporal repair remain later work.

## 2026-11-16: Inline editor diagnostics

Source errors now appear beneath their editor line, with an underlined token,
gutter marker and line/column label. End-of-input errors use a caret marker.
The editor footer jumps to offscreen errors. UTF-8 byte offsets are converted
to editor positions without splitting Unicode surrogate pairs. Edits clear old
diagnostics immediately; reset and stepping show only the current result.
File-loading and runtime failures without source positions retain a separate
message. The parser still reports its first error rather than recovering to
collect multiple diagnostics.

Desktop and mobile-emulation screenshots were captured and visually inspected.
All 20 browser checks pass, including Unicode, end-of-input, stale-error removal,
offscreen navigation, source download integrity and existing live-typing checks.
Long-file testing exposed a desktop pane sizing issue; panes now retain their
declared heights and scroll internally. No native parser or WASM changes were
needed.

The user also asked about `__` rule names. This is the bootstrap's reserved
internal prefix: names such as `__Declaration` and `__Sequence` describe the
declaration grammar, while `__repeat` and `__capture` helpers are generated.
User grammar and token definitions cannot use that prefix. Ordinary names such
as `Identifier`, `Expression` and `ForEach` remain application-defined rules;
the prefix is an implementation convention, not a requirement of Tower itself.

## 2026-11-16: LR lookahead, linear parser work and playground cleanup

The user added `ForEach | 'for'` and correctly challenged the driver's premature
acceptance of the short prefix. They requested ordinary deterministic LR behavior,
real conflict diagnostics and amortized constant parser work per token, without
searching or backtracking. A semicolon workaround did not address that requirement.

Construct tables now include FIRST(start) in the start rule's boundary lookaheads.
The normal table builder checks conflicts across consecutive constructs. `for (`
continues into ForEach; bare `for` remains valid. A genuine ambiguity such as
`'x' | 'x' 'x'` is rejected. Diagnostics name shift/reduce or reduce/reduce conflicts
and show competing actions. Failed candidates preserve the current grammar.

Removed the per-token copied-stack EOF probe. Lookahead drives table actions;
uniform default reductions allow declarations to commit without lexing ahead.
Unconsumed lookahead is buffered with its ownership/error, and the syntax driver
discards uncommitted spans before reading with the next declaration/lexer mode.
Once a continuation shifts, failure remains an error; there is no retry of a
previous shorter match. Generated child forests now concatenate in O(1), apply
captures lazily and flatten once. Browser serialization no longer searches all
siblings to retrieve each node's member name.

Native operation-count checks demonstrate linear growth for nesting and left/right
recursive repetitions. At 2,048 items the local warm repetition benchmark fell
from 95.28 ms to 9.77 ms, including tree JSON. The parser/tree work bound is O(n)
for a fixed grammar; grammar compilation and the current lexer remain separate
costs. Details and reproduction commands are in the playground performance notes.

Also completed the user's added cleanup task: removed the intro heading/subtitle,
How to explore button and help panel, automatic-parsing copy, and unused styles
and event handlers. Desktop/mobile screenshots were visually inspected. Native
AddressSanitizer, all 14 WASM checks and all 22 browser checks pass. Both parser
and LLVM modules were rebuilt with exceptions still disabled.

## 2026-11-16: Replacement templates and safe composition of expansion chains

The user proposes parsing a replacement when its rule is declared, determining
how it will collapse, and shortening chains such as C -> B -> A. Their question
is about correctness across captures, recursion, changing grammar and conflicts,
as well as preserving the parser's performance. This entry records research and
an executable experiment; production Tower replacement syntax is not implemented
by this work. `todo.txt` was read but not changed, as required by `AGENTS.md`.

### Earlier notes

Related ideas are present, but the exact transitive shortcut algorithm was not
found in the notes:

| Location in `todo.txt` | Existing idea |
| --- | --- |
| [1633](../todo.txt#L1633) | A binary operator replaces to `Lhs.add(Rhs)`, "automatically reparsed as a new tree". |
| [2291](../todo.txt#L2291) | Subrule handlers run while parsing; handlers can replace syntax or produce their own tree/AST. |
| [2420-2449](../todo.txt#L2420) | Proposed `=>` handlers include `replace`, `wasm`, `run` and `discard`. |
| [5173-5217](../todo.txt#L5173) | Transform repetition into generated productions, including generated rules inside replacements. |
| [5545-5547](../todo.txt#L5545) | Intermediate trees need not survive if transformation information and normal diagnostics do; "replacements need to be traced!" |
| [7282-7285](../todo.txt#L7282) | Replacing a subtree should trigger dependent recomputation with early stopping. |
| [8457-8461](../todo.txt#L8457) | Later preference: retain error information through transforms, use parse-tree replacements, and avoid string reparsing. |

The later tree-replacement direction fits the proposed optimization especially
well. This is an elaboration of that direction, not a claim that the notes
already specify its correctness conditions.

### Two separate optimizations

1. Parse a replacement template once, using the syntax category inferred from its
   grammar context and a known grammar revision. Captures are typed syntax holes,
   not example strings. Compile
   a tree-construction recipe that splices the actual captured subtrees at use.
2. Partially evaluate known replacement operations inside that recipe. For
   example, `C(x) -> B(Wrap(x))` and `B(y) -> A(y)` can become
   `C(x) -> A(Wrap(x))` under the conditions below. The intermediate B node and
   its rule dispatch need not happen on each use.

The first technique has a direct precedent in Lean's syntax quotations and
antiquotations: quoted syntax is parsed, holes have syntax categories, and
generated code constructs syntax while preserving inserted syntax and supplying
binding scopes/source references. It does not mean that all macro expansion is
performed at declaration time. [Lean macro reference](https://lean-lang.org/doc/reference/latest/Notations-and-Macros/Macros/)

The second technique is a form of partial evaluation: specialize a general
computation using its known inputs, leaving a residual computation for the
unknown inputs. Here the known inputs include templates and applicable rules;
captures and dynamic decisions can remain unknown. The literature supplies the
concept, not a correctness proof for Tower's future expander.
[Jones, Gomard and Sestoft](https://raspi.itu.dk/people/sestoft/pebook/pebook.html)

Pre-parsing raw text with EOF is not sufficient to certify an arbitrary splice
into a running LR parser. Entry state, lookahead and the surrounding stack can
affect reductions; reductions can pop into older states, so caching by the top
state alone is not a general solution. A more ambitious token-fragment optimizer
would need a verified summary of stack effects and applicable contexts, with
residual work where decisions remain unknown. Typed tree templates avoid much
of this problem by making the splice boundary part of the language's semantics.

### Correctness boundary

A sound optimizer can guarantee that each shortcut it accepts preserves specified
semantics, while refusing cases it cannot establish. It cannot generally discover
and fully collapse every arbitrary replacement program. Termination and confluence
are undecidable for general term rewriting; arbitrary Tower/WASM handlers add
ordinary program termination/equivalence problems too.
[Berkeley term-rewriting lecture](https://inst.eecs.berkeley.edu/~cs294-260/sp24/2024-01-22-term-rewriting)

The first semantics should specify child/parent expansion order, rule priority,
syntax categories, binding/hygiene, source provenance, identity and the rule
environment used by a particular expansion. The model below chooses child-first
expansion, consistent with the earlier subrule-handler notes. Other strategies
are possible, but the optimizer must preserve the chosen one.

| Case | Required behavior |
| --- | --- |
| Pure unconditional structural chain | Compose by substituting captures; do not infer equivalence from rule names alone. |
| Capture-dependent patterns or conditions | Keep the relevant tests and priority in residual code, or fall back. Seeing one successful sample expansion proves nothing about other captures. |
| Raw token splice versus tree splice | Preserve the declared semantics. `$x * 2` with `x = 1 + 2` means `1 + 2 * 2` under token substitution but `(1 + 2) * 2` under expression-tree substitution. |
| Grammar/rule edits | Pin an immutable environment or invalidate/recompile plans. Adding a rule where none existed is also a dependency change. |
| Handler effects, grammar mutations, fresh bindings | Preserve their order, multiplicity and scope. Do not execute them early or erase them merely because the final tree looks identical. |
| Capture duplication or erasure | Preserve expansion/evaluation order, sharing semantics and possible errors/divergence. The first optimizer can simply refuse these cases. |
| Recursive rules | Stop specialization when a proof or work budget runs out; residualize or fall back. Structural recursion may terminate and be efficient; a cycle is not proof that every use is invalid. |
| Diagnostics and reflection | Retain logical expansion history and source mappings. If intermediate allocation identity is exposed, erasing allocations needs an additional contract or virtualization. |
| Grammar conflicts | Keep LR shift/reduce and reduce/reduce validation. A cached RHS parse must not bypass conflict checking. |
| Overlapping replacement rules | Separate issue from LR conflicts. Preserve the specified priority/strategy, or prove that alternate paths join before reordering them. |

Confluence is not necessary if Tower defines a deterministic rewrite strategy and
the optimizer preserves it. It is relevant if the implementation wants freedom
to choose or reorder overlapping rewrites. Blanket rejection of all recursion or
overlaps would unnecessarily restrict the language; refusing an optimization is
different from rejecting the program.

For dynamic grammar, there are two legitimate policies: templates retain their
definition environment, or they are recompiled against the current environment
at use. This entry recommends definition-time parsing for quotation structure
and an explicit versioned expansion environment. It does not silently choose
whether a later B-rule change should affect an older C definition. That language
policy must be specified before implementing live replacement updates.

Initially, one environment epoch is a sufficient conservative cache guard. Later
Tower's automatic dependency tracking can make invalidation more precise. Reads
performed while compiling a plan must remain dependencies of that plan, including
negative rule lookups, lexical definitions and relevant scope/schema versions.
Retaining a previously generated plan without retaining those dependencies would
break minimal rebuild.

### Executable checks and their limits

Added [replacement-shortcuts.mjs](research/replacement-shortcuts.mjs) and
[its tests](research/replacement-shortcuts.test.mjs). Run from the repository root:

```powershell
node --test docs/research/replacement-shortcuts.test.mjs
```

The model uses immutable first-order trees, fixed-arity constructors, one rule per
constructor and a fixed snapshot during expansion. Its optimizer accepts only
structural templates with each capture used exactly once and an acyclic reachable
rule dependency graph, within a bounded specialization budget. Captures are
already normalized before substituting them. Other rules use the ordinary
expander. The model's holes are positional; this is not yet Tower's syntax-category
type checker, hygiene implementation or source-location system.

The conditional correctness argument is induction over the acyclic dependencies
and template structure. Holes denote normalized opaque trees. Constructors expand
their children in the reference order. Each known rule is replaced by its
normalized substituted template under the same environment. Thus substitution
commutes with this restricted normalization; the resulting tree and logical rule
sequence agree. Captured tree references are preserved. This is an explanatory
argument, not a machine-checked proof or a proof about arbitrary macro programs.

All **12 tests pass**, including:

- An independent unspecialized oracle compared against 722 bounded input trees,
  then the same 722 after adding a previously absent downstream rule.
- Changed existing rules, capture reference identity, logical traces, conditional
  handlers, effects, ordered alternatives, handler failures, cycles, conservative
  duplication/erasure refusal, and specialization-budget fallback.
- Logical expansion limits: the optimized path falls back before crossing the
  budget, preserving the exact reference trace prefix and failure.
- Deliberately bypassing the version guard or deleting a trace entry is detected
  by the independent oracle.
- A 64-rule chain across 1,000 uses: replacement-created nodes decrease from
  **64,000 to 1,000**; interpreted rule dispatches decrease from **64,000 to zero**,
  replaced by 1,000 plan uses. The logical trace is shared static data until
  requested. These are model operation counts, not native timing measurements.
- A finite acyclic family that doubles generated branches yields 1,024 leaves
  and 2,047 output nodes. Precomputation cannot remove the cost of materializing
  those nodes under this tree representation.
- Three checks use the **real existing Tower WASM parser**: tree versus token
  substitution gives different precedence, changing grammar changes the parsed
  replacement text, and shift/reduce plus reduce/reduce conflicts remain errors.

The WASM checks need the built `build/browser-wasi/tower.wasm`, the current lexical
bootstrap and installed playground dependencies. They use an ordinary `@x` test
terminal and a small arithmetic-tree adapter; they do not implement replacement
declarations in Tower. Native compiler, browser UI and existing WASM binaries
were not changed for this research.

The model does not cover bindings, source maps, intermediate public node IDs,
mutable trees, allocation failure, arbitrary grammar-changing handlers, or all
possible overlapping rewrite systems. Passing finite tests cannot establish
correctness in those omitted cases. In particular, its structural equality and
capture-identity contract deliberately excludes newly allocated node identities.

### Performance and implementation direction

Recursion is not itself a performance defect. Repeatedly reparsing unchanged
replacement text and allocating intermediate trees are avoidable costs. The
fixed-grammar LR input scan can remain linear, while total expansion work is
additional: input processing + actual dynamic rewrite work + materialized output.
No universal O(1) work per original token is possible for arbitrary handlers,
unbounded recursive expansion or growing output. For a fixed, bounded collection
of certified templates, composition can retain linear overall construction while
substantially reducing its constant factor. A compact recipe/provenance DAG and
specialization budget prevent eager composition from exploding compiler memory;
actual output size can still dominate.

Recommended first production slice: add quoted tree templates with typed capture
holes and source origins, plus an intentionally simple reference expansion path.
Infer the template's output category from its grammar context, use the existing
grammar validator, and make each expansion's environment/ordering rules explicit. Then implement
the restricted composition pass and compare it with the reference path on every
regression case. Preserve expansion traces even when intermediate nodes vanish.
Extend to conditional residual plans or raw-token parser summaries only when a
concrete example requires them. This realizes the user's shortcut idea without
requiring every replacement program to be statically decidable.

## 2026-11-16: Remove redundant replacement category syntax

The user chose `=> replace { ... }`, without a separate parenthesized category.
The earlier illustrative `replace(Expression)` annotation was redundant when
the grammar context already establishes Expression as the destination. No concrete
Tower case requiring that extra annotation was established; hypothetical standalone
syntax-construction features do not justify adding it to replacement rules.

For example, the proposed declaration is:

```tower
parse Expression |= 'increment' '(' $Expression ')'
    => replace {
        $Expression + 1
    };
```

The template is parsed as Expression because that is the rule being extended.
Its outer braces delimit the replacement template, rather than adding a block to
the generated expression. Capture category checks and source provenance still
apply. Replacements remain a proposed language feature; the current C++/WASM
parser and research model contain no category-argument syntax to remove.

## 2026-11-16: Tree replacements implemented in the native and WASM compiler

Implemented `=> replace { ... }` in the declaration bootstrap, without a category
argument. Added `$name:Rule` captures alongside existing `$Rule` shorthand. The
replacement's `$name` means a placeholder for a captured syntax tree; it is not
a new user-facing concept or a string substitution operation.

Templates compile into trees when the grammar becomes usable. Temporary template
grammars admit typed capture placeholders and repeated/optional capture lists.
Their production identities are mapped back into the active grammar. The declared
rule is tried as the destination first; named helpers may infer a destination
through the nearest unit-rule parents. Unreachable helper templates stay pending
until a declaration connects them to Statement. Conflicting or invalid candidates
fail before publishing a revision, and an incompatible inferred destination at
use is reported rather than silently leaving a replacement unexpanded.

This is a reference expander, using an explicit child-first work stack. It reads
the matched production, constructs the template's nodes, and inserts captured
subtrees directly. Already-expanded captures are not expanded again. Single-use
captures move; extra uses copy; repeated captures splice their children in order,
including empty lists. Unused captures are discarded after their children expand.
The node runtime now supports replacing a child at its existing index and taking
the final child in constant time, preserving member names and sibling order.

Generated nodes carry both invocation and template coordinates. Captured nodes
retain input spans and previous transformation history. Provenance uses shared
expansion records that survive session destruction. Browser JSON transmits a
shared expansion table, rather than repeating the entire chain on every node.
The tree inspector marks generated nodes, shows their origins, and keeps named
terminal captures visible when ordinary tokens are hidden.

Grammar or lexical changes revalidate active templates against the candidate
environment. Tests cover changing a downstream replacement within one source
stream, edited bodies, source shifts, cache reuse, and failed lexical changes.
Template source coordinates participate in cache keys to prevent stale origins;
more precise dependency-driven reuse remains future work.

The [Replacements example](../scaffolding/examples/replacements.tower) is available
in the browser selector. It demonstrates increment, an add_one-to-increment chain,
nested foreach-to-Loop tree construction and duplicated statement lists. It uses
no generated local identifiers. Structural expansion does not yet provide Tower
execution, binding resolution, hygiene or general user-code transformation
handlers. Replacement-chain shortcut composition is also not implemented yet.

Capture categories must fit the grammar position. A precedence grammar can use
its ordinary grouping rule, such as `($value)`, when placing a general Expression
in an Atom position. There is no token flattening, guessing of precedence or
runtime parser backtracking. Expansion is limited to 4,096 replacements and
65,536 generated/copied result nodes per statement, with a 256-frame generated
expansion ancestry limit. Exhaustion reports an error and releases partial trees.

Validation: native AddressSanitizer and the full native node/parser/syntax suite
pass; all **22 WASM/host tests** and **24 desktop/mobile browser checks** pass.
Tests compare expanded expression shape with ordinary parsed source, verify
distinct IDs for duplicated captures, check empty/optional/repeated lists and
source provenance, exercise failures and allocation cleanup, and expand 400
nested identity replacements with zero generated/copied result nodes. Desktop
and mobile screenshots were captured and visually inspected.

The reproducible replacement profile measured about 281 ms for the first parse
of the 15-declaration example, then 2.66 ms median and 4.60 ms maximum for warm
invocation edits including reset, expansion, JSON and inspection. Warm runs
rebuilt no grammars and hit all 16 cache entries. This is compiler/host time, not
browser input-to-paint latency; changing definitions may cost more. Run
`node scripts/profile-replacements.mjs` from `playground`; results are in
`build/replacements-profile.json`. Both WASM modules were rebuilt with exceptions
disabled. The [parser documentation](parser.md#rule-replacements) records the
implemented syntax and current limits. `todo.txt` was not modified.

## 2026-11-16: Readable expanded code in the parse tree view

Added an open-by-default, collapsible Expanded code panel above the tree. It
shows the complete selected statement after replacement expansion, using terminal
labels from the final WASM tree rather than original source spans or replacement
definitions. Nested chains, repeated captures and generated punctuation therefore
appear in the reconstructed result. The display stays independent of the Show
tokens toggle and node selection, and clears for declarations/reset.

This is a debug rendering with normalized spacing and block indentation. String
token contents are kept intact; skipped comments/whitespace are unavailable. It
is not a universal round-trip serializer for arbitrary user-defined grammars.
The bundled expression, nested loop and duplicate-body results were reparsed
with Tower and checked against the expanded tree shapes. All 22 WASM/host tests
and 24 desktop/mobile browser checks pass. Screenshots of both layouts were
visually inspected. The static page and downloadable archive were refreshed;
no native parser or WASM changes were required.

## 2026-11-16: Typed instruction core, interpreter, and LLVM direction

The user authorized a small interpreter to make the execution model concrete,
then clarified the intended base language: simple instruction-like operations,
including three-address assignments such as `a = b + c;`, with typed mutable
variables and stack storage. Do not add a precedence hierarchy or Term/Factor
expression grammar to the base. Convenient shorthand such as `a = b = 1;` is
acceptable if it follows naturally from existing machinery without expanding
the core rules. This is a preference for simplicity, not a demand for awkward
bare syntax.

Core operations need type checking, including pointer and alias semantics and
explicit conversions/reinterpretations where types are incompatible. The initial
control-flow vocabulary can use if and loop constructs. The user should not write
phi nodes. LLVM lowering can start with entry-block allocas plus loads/stores;
mem2reg introduces SSA values and phi nodes for eligible locals. Address-taking
or escaping locals are not promised promotion. The checked-in LLVM tutorial
`llvm/docs/tutorial/MyFirstLanguageFrontend/LangImpl07.rst` describes this path
and its restrictions.

The longer-term target is real LLVM declarations, compilation and execution of
Tower's operations. The existing LLVM smoke module only returns a constant and
does not meet that target. The small interpreter should establish the semantics
and provide a reference for that path, before optimization work.

The web demo must execute in a worker, asynchronously. It must show Executing
while running, allow cancellation and continued editing even for infinite loops,
and allow a new run without accepting obsolete output from the old worker.
These directions are also recorded in AGENTS.md. This entry records requirements;
implementation and validation results follow separately.

## 2026-11-16: Expressive core and explicit optimization contracts

The user wants language authors to build broadly different languages on Tower's
small core without paying for surface syntax or having to hand-optimize ordinary
local variables. Distinguish expressive completeness from efficient lowering:
the eventual core needs typed arithmetic/conversions, memory and layouts,
functions/calls/returns, and control flow. Features such as GC, atomics and
suspension need deliberate runtime/compiler support as they are added. A small
grammar can expose these operations without a built-in precedence hierarchy.

Keep language semantics visible through lowering. Generic boxed operations and
opaque runtime calls are not guaranteed to become native scalar operations.
Use the same typed core for the reference interpreter and eventual LLVM backend,
rather than expecting LLVM to optimize away an interpreter dispatch loop.
Guarantee eligible canonicalizations with tests, not globally optimal code.
Running mem2reg is guaranteed by a chosen pipeline; promotion depends on the
allocation's uses. Only emit alias/effect/overflow assumptions that Tower can
justify. LLVM frontend guidance: https://llvm.org/docs/Frontend/PerformanceTips.html
and mutable-variable tutorial:
https://llvm.org/docs/tutorial/MyFirstLanguageFrontend/LangImpl07.html .

The user additionally requests a future guarantee that large if/else chains
testing constants or ranges receive switch-like optimization, without requiring
switch statements in source. Adopt this as an eventual recognition contract for
eligible chains: a common stable discriminant, preserved priority for overlapping
ranges, and no changes to observable evaluation or effects. Canonicalize to a
dispatch representation. Select jump tables, bit tests, range tests, or decision
trees using density/cost and target information; a jump table is not an unconditional
promise for sparse or tiny cases. Chains that reload mutable storage after
effectful calls cannot simply be collapsed into one read. This is a future
optimization milestone, not part of the first interpreter implementation.

## 2026-11-16: Typed core interpreter and cancellable browser execution implemented

Added `scaffolding/core.tower`, `core.hpp` and `core.cpp`. The grammar remains
Tower source and has simple operands plus one operation per assignment, with no
precedence hierarchy. A native compiler consumes expanded parse trees directly,
resolves lexical scopes, checks the complete program before execution and emits
typed slot-based instructions. Core rule labels and capture names are the
bootstrap semantic ABI; changing keyword spellings does not require C++ changes.
New operations need native semantics or replacement into existing operations.

The first subset has i32/u32/bool, typed local pointers, arithmetic/bit operations,
comparisons, explicit checked numeric conversion and integer bit reinterpretation,
blocks, if/else, loop, break/continue and print. No user phi nodes. Add/sub/multiply
wrap modulo 2^32; zero division and signed division overflow trap. Reads of
uninitialized storage trap. Aliases share typed cells; pointers include a lifetime
generation so dereferencing an expired block local or an earlier incarnation of
a loop local traps. Scope cleanup also occurs on break and continue. This is a
checked prototype memory model, not a general byte-addressed machine or final
layout/ABI specification. Functions, call frames, heap, pointer arithmetic,
aggregate layouts and floats remain future work.

The Execution playground example appends a Tower-defined increment replacement
to the editable core grammar. Its loop sums 1 through 5 and prints 15, then an
aliased write produces 16. The UI shows the actual lowered instruction listing.
This validates replacements flowing into execution rather than executing debug
text or adding a native increment keyword. Type and runtime errors appear inline,
including source locations from generated replacement nodes/captured operands.

Added execution C ABI handles and bounded step calls. Compilation and the whole
machine run in a dedicated worker, separate from the existing live parser worker.
The UI displays Executing, supports Cancel, terminates execution on edits and
rejects obsolete worker replies. A new run starts fresh. There is no execution
time cutoff; the worker uses 10,000-instruction slices. Output is batched around
50 ms and capped at 64 KiB. Source/construct limits remain; the compiler also
bounds local slots, instruction count and block depth.

The execution example uses 22 cached grammar versions, exceeding the earlier
16-entry capacity. Raised the bounded capacity to 32 and added a regression
requiring zero grammar builds for a loop-constant edit. Measured reset + full
parse/expansion + JSON + inspection at 316 ms cold, 7.75 ms warm median and
9.95 ms warm maximum, with 22 cache hits and zero warm builds. This is WASM/host
time, not browser input-to-paint latency. Larger sources can still exceed the cache.

Validation: native parser/runtime/syntax/core checks pass under AddressSanitizer;
all 30 WASM/host tests and 32 desktop/mobile Playwright checks pass. Coverage
includes conversion/overflow behavior, type failures before any effects,
scope/loop lifetime safety, nested flow, output bounds, source provenance,
infinite execution with live editing/cancellation/restart, cancellation while
loading, and inline error recovery. Desktop/mobile screenshots were visually
inspected. Both WASM modules and the static bundle were rebuilt; dist/module
hashes match. The LLVM module remains its existing constant-return smoke test:
actual Tower-to-LLVM lowering, mem2reg and dispatch optimization are not implemented
by this milestone. The interpreter is the reference for those future passes.

## 2026-11-16: Auto execution and viewport layout

The user requested execution while typing, a default-on auto-execute option,
a page that fits the viewport, a merged header/toolbar, tighter spacing, and
removal of the bottom LLVM experiment dropdown. Implemented these in the static
playground. Auto execute is enabled unless the user has explicitly disabled it;
the preference persists in local storage. Successful full parses containing
Core* statement trees schedule execution after a 120 ms quiet period. IME
composition defers it, and incomplete syntax waits. Syntax-only examples keep
working as parser demos. Each edit immediately cancels the preceding worker and
clears obsolete output/errors. Cancel marks the current source revision handled,
preventing late parsing or re-inspection from restarting that same infinite loop;
another edit or explicit Execute may start a new run.

Combined branding, parser actions and file/example controls into one compact
toolbar, with responsive wrapping on phones. Replaced fixed pane heights and
large margins with a viewport-sized flex/grid layout. Editor/inspection panes
share the available space, the execution console has bounded height, and long
source/trees/output/instructions scroll internally. The document itself does not
scroll. Reduced spacing and corner radii, and placed output and instructions
side-by-side within the console. Run LLVM check now sits with execution controls;
its result/download appear in the console. The bottom experiment dropdown is gone.

Validation: all 38 desktop/mobile browser checks pass across the complete run
and targeted rerun. The small-screen test initially clicked the center of the
entire offscreen contenteditable rather than its visible viewport; it now clicks
visible editor coordinates and verifies editing there. Auto execution tests cover
default behavior, incomplete edits, infinite-loop cancellation/edit/restart,
manual mode persistence, runtime errors and recovery. Viewport geometry and
screenshots were checked at 1440x900, 1280x720, 1024x600, 393x851, 360x640 and
320x568, including expanded instructions and errors. Screenshots were visually
inspected. The static bundle/archive were refreshed; native code was unchanged.

## 2026-11-16: Foundation terminology and intent-first declarations

The user names Tower's built-in primitives and bootstrap grammar its foundation.
Functions, typed parameters, calls and returns belong to that foundation, alongside
storage, typed operations and control flow. Higher-level syntax is built above it.

The user prefers `var foo: i32 = 123;`, parameters `foo: i32`, and `fn name(...):
ReturnType` rather than `->`. Intent-first declarations make both human reading
and parser recognition independent of whether the leading name is a type. Keep
initializers simple; this does not request a precedence hierarchy.

Type names must eventually be ordinary names resolved to type objects, including
built-in i32/u32/bool. Reflection should expose built-in and user-defined types
through the same model. The compiler still needs primitive representation and
operation metadata, but should discover it from resolved type identity rather
than privileged source spellings. Type-name lookup belongs in semantic analysis,
not in parser decisions about whether a declaration has started.

Recorded the direction and outstanding implementation tasks in docs/foundation.md
and AGENTS.md. The current implementation retains the previous declaration and
function spelling pending that syntax change. todo.txt remains untouched under
the repository instruction.

The user also confirms future local type inference: `var a = 5;`. The annotation
is optional when an initializer determines the type; explicit annotations supply
an expected type. Specify numeric literal defaults/ranges and diagnose uninferable
declarations. This is additional semantic checking, not parser-side type lookup.
The task is recorded in docs/foundation.md and the guidelines.

## 2026-11-16: Foundation functions, Tower graph, LLVM execution and our WASI host

Implemented typed top-level functions, parameters, direct calls and returns in
Tower's foundation. Signatures are collected before bodies, allowing forward and
mutually recursive calls. Function locals are separate from entry locals; there
are no implicit captures. Calls/returns are checked before effects. Parameters
are mutable local values; pointer arguments preserve aliases into caller storage.
Returning a local's address does not extend its lifetime. Limits are 256 functions,
64 parameters, 4,096 locals per function, 65,536 instructions, 128 live call frames
including entry, and 65,536 live cells. The current grammar still uses the earlier
`fn add(i32 a, i32 b) -> i32` spelling; the declaration direction above remains an
explicit follow-up, not an implemented feature.

Split frontend compilation, graph verification/transport and interpretation into
core.cpp, core-graph.cpp and core-machine.cpp. The graph has typed instructions,
function signatures, source spans and basic blocks with successor edges. Its
versioned TWRG binary transport is bounded and verified on decode. Both consumers
use this representation; LLVM receives no source or parse trees. A new Functions
example demonstrates factorial recursion and a pointer argument, printing 720/721.

The real LLVM backend lowers ordinary locals to entry allocas and runs explicit
SROA/mem2reg, instcombine, simplifycfg and O2 with verification. LLVM emits a WASM
object and LLD links an executable exporting tower_main. The executable runs
actual compiled operations, using only Tower print/trap imports as needed.
Address-taken locals use checked generation-bearing cells; this deliberately
preserves the interpreter's alias/lifetime/error semantics. It is not a general
raw-pointer ABI. Optimization tests check ordinary allocas disappear, not a
promise that all memory disappears or the output is globally optimal. Dispatch
canonicalization and minimal/incremental compilation remain future work.

The user explicitly rejected using someone else's shim. Added our own small
WASI Preview 1 adapter in playground/src/wasi-host.mjs and removed the external
browser_wasi_shim dependency and notices. It provides the modules' actual import
subset: memory-backed files, standard streams, clocks, entropy and exit handling.
It exposes no OS filesystem/network/environment. Unsupported operations fail;
this is not a full WASI runtime. Tower's C++ WASI integration supplies LLD a
heap-backed output buffer because upstream LLVM's buffer requires unavailable
mmap, and uses disposable workers instead of signal-based crash recovery. No
C++ exceptions or language-level exception feature were introduced.

The execution worker now owns frontend compilation, LLVM loading, optimization,
linking, generated-module instantiation and execution. The UI offers Interpreter,
LLVM and Compare both. Run LLVM operates on the current program; the old smoke
worker was retired (the legacy native smoke export remains independently tested).
Instructions can show Tower graph or LLVM before/after optimization, with a linked
WASM download. Compare checks output, status, error message/location and output
truncation. Cancel/edit terminates the worker through all phases, including a
non-cooperative compiled infinite loop; stale messages are ignored. Live parsing
keeps its independent warm worker. Execution still rebuilds its program per run;
this milestone does not implement temporal repair or minimal LLVM rebuild.

Validation so far: all 55 WASM/host tests and 44 desktop/mobile Playwright checks
pass. Differential cases cover recursion, unsigned results, pointer aliases,
returned/expired locals and parameters, reused frames, destination capture across
an effectful call, initialization checks, bounded recursion/output, conversions,
integer traps, loops and replacements. Browser checks prohibit WASM compilation
on the main thread, exercise all execution choices and cancellation during load
or infinite code, verify inline errors and viewport bounds, and compare results.
Desktop/mobile screenshots were inspected. The native AddressSanitizer run is
still in progress at this entry; its final result is recorded below.

A Node/WASM timing sample for Functions measured 344 ms cold parse and 4.5-7.3 ms
warm reset/full parse/inspection after constant edits, with zero grammar builds
and 30 cache hits. Fresh frontend compilation took 327 ms, LLVM instantiation
114 ms, first graph lowering/optimization/linking 568 ms, and generated-module
instantiation/execution 0.9 ms. The executable was 927 bytes. These are local
sample timings, not browser input-to-paint or performance guarantees. They make
clear that warm parsing is fast while fresh execution compilation still needs
future reuse/incrementality work. Measurements: build/functions-profile.json.
The static dist and ZIP were refreshed; parser/LLVM module hashes match builds.

Final validation: the native runtime/parser/syntax/foundation tests passed under
MSVC AddressSanitizer, including function recursion, escaped-local lifetime
errors, type checking, graph round-trip execution, all truncated wire prefixes,
and invalid call targets/opcodes. No sanitizer findings were reported. Together
with 55 WASM/host tests and 44 browser checks, this completes the implementation
and validation of this milestone.

## 2026-11-16: Hard requirement for a unified foundation representation

The user requires Tower's graph, bytecode and opcodes to correspond 1:1 with
foundation instructions and expressions. Generated program output must be
compilable foundation source, using the ordinary fn/var/type/call constructs.
This is also Tower's assembly-like authoring format. A separate debug vocabulary
or a listing that merely resembles Tower does not satisfy the requirement.

The same node/entity/component model must serve syntax, normalized foundation
programs, transformations and interpreter/LLVM inputs. Share semantic operation
definitions, validation and formatting. Binary bytecode encodes the same
constructs and references; it must not invent a second Tower instruction language.
The editor formatter and program emitter must use the same formatting engine and
foundation rules. Extra syntax can provide formatting recipes through that system;
grammar recognition alone does not determine preferred layout. Syntax comments,
original spelling, resolved bindings/types and provenance are components or
associated metadata, allowing both source-aware and canonical rendering.

The existing code was inspected: TowerNode already supports components and an
ownership tree, but CoreProgram/CoreInstruction are currently separate objects.
core_debug is not recompilable, and explicit End/Jump/BranchFalse instructions
have no corresponding foundation source forms. The current TWRG bytecode encodes
that separate instruction set. Therefore this requirement needs an architectural
refactor, not cosmetic output changes; it is not yet implemented.

Recommended canonical representation retains foundation if/loop/scope nodes and
derives CFG/execution indexes over them. Exposing arbitrary jumps or other new
Tower operations would require foundation syntax and semantics first. Ownership
edges must remain separate from callee/symbol/type/control-flow references;
recursive functions cannot be modeled by reparenting nodes or blindly creating
strong reference-count cycles. Shared infrastructure does not require preserving
a high-level extension node unchanged after replacement, or discarding source
snapshots when enriching foundation nodes.

The acceptance criterion is a semantic structural round trip: valid program ->
canonical foundation source -> parse/resolve/check -> equivalent foundation
program, with stable reformatting and preserved types, bindings, sharing, order,
effects and lifetimes. Entity allocation IDs/source offsets can change; observed
program behavior cannot. Test binary round trips and both backends as well.
Canonical output uses a specified foundation grammar and has the declarations
or explicit dependencies needed to compile, independent of the input's custom
syntax. Source provenance may be carried by accompanying metadata.

Recorded as hard guidelines in AGENTS.md and design/implementation tasks in
docs/foundation.md. This turn is discussion and documentation; no runtime
refactor or claim of satisfying the new requirement yet. todo.txt is untouched.

## 2026-11-16: Text-only program format, private interpreter encoding and determinism

The user clarifies that Tower should not have a public/distributable binary
bytecode or graph format. Foundation text is the saved/interchanged program form.
Shared nodes/components remain the representation for traversal, transformation,
reflection and compilation. Normal emission to platform objects/executables is
still intended. This supersedes the preceding entry's plan for a binary encoding
of the canonical graph and binary round-trip requirements; it does not relax the
canonical graph/foundation source correspondence or the shared formatter.

The sole exception is a private fast-interpreter encoding. Tower must retain an
interpreter path for running foundation code without guest JIT compilation or
executable-memory allocation. A compact register interpreter, inspired by Lua,
with small operand addresses/indices and roughly 255 registers is a possible
optimization. It is guidance for research, not a fixed encoding or a language
register limit. mem2reg promotes eligible locals into SSA; bounded register reuse
requires a separate allocation/liveness step with wider operands or spills for
larger cases. Address-taken storage and aliases must preserve their semantics.

This private stream contains execution essentials only, not AST/reflection/source
metadata, and must not be used for compiler graph traversal or exchange. Keep
compiler information on shared entities and optional diagnostic mappings outside
the hot stream. Specialized/fused interpreter instructions may be derived when
they preserve behavior; canonical foundation nodes still supply source printing
and transformations. No standalone stable binary ABI or saved Tower bytecode
asset is planned. Initially treat the stream as a discardable in-memory cache.

Compile-time execution MUST be deterministic across hosts for the same program,
explicit inputs, semantic version and target description. Define integers,
floating point (including NaNs, rounding and subnormals), conversions, memory,
pointer identity, initialization, effects and observable ordering. Host clocks,
randomness, files, environment and scheduling cannot silently influence a
supposedly reproducible result. Explicit external inputs should be dependency
tracked. Cross-compilation queries must consult declared target information,
not the compiler host. Resource failures and any deterministic fuel policy need
specified handling; equal semantics is not a promise of equal host resources.

Runtime behavior may be explicitly target-dependent or selectable, as the user
suggests, but must be well-defined. Exact option/profile syntax remains open.
Recommended direction is strict portable compile-time execution with explicit
runtime profiles, documented boundaries, and profile/target included in folding,
optimization and dependency/cache assumptions. Folding runtime code at compile
time must honor its selected semantics or decline the fold. Identical execution
behavior is distinct from identical machine-code bytes across architectures.

LLVM can remain the backend under Tower's contract: do not introduce undefined
behavior, poison or relaxed floating-point assumptions where Tower specifies a
result/trap. WASM is useful inspiration, but allows some NaN variation, so it
does not by itself establish the stronger Tower requirement. Source references
and the detailed semantic checklist are in docs/foundation.md. Current tests
cover the implemented integer/bool/checked-pointer subset on the tested WASM
host; they are not a cross-platform determinism proof.

Updated AGENTS.md, the foundation design/tasks, and the ABI documentation to mark
TWRG as a temporary prototype to retire. Backends should consume shared entities
directly where possible, or foundation text across an isolated boundary. These
are recorded architectural requirements; no runtime encoding/refactor was
implemented in this discussion turn, and todo.txt remains untouched.

## 2026-11-16: Compute shader targets are explicit goals

The user explicitly wants Tower compute shaders for Vulkan and DirectX 12 and
requests that the foundation refactor account for sharing across those targets.
Vulkan shader output is SPIR-V; DirectX 12's corresponding modern shader path is
DXIL. Keep both as planned backend goals rather than treating SPIR-V as a binary
accepted by both APIs. References: the Khronos Vulkan environment for SPIR-V and
Microsoft's DirectXShaderCompiler README.

Share foundation entities, source formatting, type/layout information, validation
and applicable transformations across interpreter, native, WASM and GPU paths.
Model shader entry points/workgroup dimensions, resources/bindings, address
spaces/storage classes, vectors, synchronization/atomics and target capabilities
explicitly as those features are added. Reject unsupported target operations;
the current CPU-style recursive functions, checked-pointer runtime and host print
imports are not automatically valid GPU shader operations. GPU target output is
permitted platform output under the text-only Tower program-format requirement.

These are recorded target goals and design constraints; this refactor does not
claim to implement GPU backends yet. Future tests must include target validators
and execution of reference kernels with clearly specified floating-point and
memory behavior, while strict compile-time execution retains its own contract.

## 2026-11-16: Target declarations, shared CPU/shader code and usable emulation

The user recalls earlier notes about declaring supported targets on foundation
operations. Historical evidence in todo.txt (read only): lines 7267-7270 note
that some calls are not legal on SPIR-V/QASM; lines 7310-7317 discuss library-wide
target support, a common math library spanning SPIR-V/WASM/QASM/SMT, and inferring
support for individual parts. Lines 8243-8267 discuss per-target representations
and computing LLVM/WASM/SPIR-V components on demand. These notes establish the
direction, but do not specify a finished per-operation annotation syntax.

The intended design now is explicit foundation implementation/capability metadata
with inferred transitive support: a function can compile for both CPU and shader
targets when its reachable operations, types, effects and chosen implementations
satisfy both targets. A selected implementation can be native or emulated. Stage,
device features, address spaces and execution-context requirements matter as well
as the target name. Recursive call graphs require a fixed-point analysis; target
specialization may remove unreachable dependencies before checking eligibility.
An explicit multi-target declaration should be a checked contract, with a useful
call chain explaining a missing capability. Exact annotation syntax remains open.

Motivating example: write ocean-wave evaluation once in Tower; run it in shaders
to render the ocean and call it on the CPU for buoyancy, collision/height queries
and simulation at the same time/coordinates. Pure wave math should call naturally
on either target. Rendering-specific sampling/derivatives may require additional
context. Other examples include shared procedural noise, terrain displacement,
normal calculations and CPU-side reference tests for compute kernels.

The user wants shader code generally callable/emulatable on CPU, with broad
coverage as an explicit goal. This is primarily execution of Tower's shared
foundation semantics, not a requirement to round-trip through SPIR-V or a claim
that arbitrary third-party SPIR-V ingestion already exists. Shader targets remain
more restricted than CPU/native/interpreter targets; their restrictions should not
prevent CPU code from using vectors, swizzles, shader-style mathematical operations
and explicitly selected fast numeric implementations as language facilities.

Correct CPU execution of ddx/ddy can require a quad of neighboring invocations,
defined lane arrangement, fine/coarse derivative rules, divergence/helper-lane
behavior, and rasterization inputs. Sampling may additionally require resources,
sampler state, coordinates, gradients/LOD and filtering rules. Workgroup/subgroup
collectives and barriers require their execution context too. An ordinary scalar
CPU call does not manufacture those inputs. Allow explicit overrides or an
emulation context, and diagnose requirements for which neither is available.

The user's follow-up emphasizes ease of use: provide good defaults as well as
faithful emulation. A convenient CPU-call profile may use configurable zero
derivatives when no gradients exist, and sample the finest available mip (level 0)
when no implicit LOD can be computed. Interpret the user's "highest lod" as highest
detail, not the numerically largest/coarsest mip. Resource and sampler inputs still
need a real binding or an explicitly configured fallback. Defaults must be easy
to override, documented and inspectable; do not present them as equivalent to
quad-based shader execution. The strict profile requires the appropriate context
or an explicit implementation. Do not make users manually emulate a rasterizer
just to call ordinary wave math or intentionally use the convenient profile.

Desired long-term behavior is deterministic CPU/GPU execution under the same
selected contract and explicit inputs. Separate strict reproducible arithmetic
from permitted fast approximations, and distinguish exact reference emulation
from convenient context defaults. Fast math, texture filtering, reduction order,
NaNs/subnormals, races and hardware-defined choices need specified policies;
merely accepting a program on two targets does not prove equal results. Strict
operations may require software/reference implementations or rejection on an
unsupported target. A deterministic CPU approximation alone does not prove that
its GPU counterpart agrees. Target, semantic profile, context/fallback choices,
resource inputs and selected implementations belong in dependency/cache identity.

Research references: Microsoft's derivative specification describes 2x2 quad
semantics and stage/device requirements:
https://microsoft.github.io/DirectX-Specs/d3d/HLSL_SM_6_6_Derivatives.html
Khronos documents that Vulkan does not generally guarantee identical images
between implementations:
https://github.khronos.org/Vulkan-Site/spec/latest/appendices/invariance.html
These are design goals and follow-up tasks, not implemented GPU/emulation features.
Guidelines and foundation tasks were updated; todo.txt remains untouched.

## 2026-11-16: Optional hardware dependencies and bundled implementation variants

The user wants convenient optional dependencies for many CPU/GPU hardware features:
SSE availability is the CPU example; optional Vulkan/3D features are the GPU
example. Prefer writing one operation with alternative implementations, selecting
real hardware support where available and using portable or CPU-emulated fallbacks
where appropriate. One executable/package may contain multiple compiled paths.
Exact declaration/selection syntax is open; do not hardwire each feature as a
special case throughout the compiler or require users to hand-maintain every
permutation of backend logic.

Design direction: implementations declare required target capabilities, context,
effects and semantic contract, and may have a fallback or preference. Selection
considers what is compiled into the package, hardware support, CPU OS-state support,
GPU features/extensions actually enabled on the chosen device, context/resources,
user overrides and strict/relaxed numerical policy. Availability is not proof of
semantic equivalence. A precise portable implementation must not silently switch
to a faster approximate one under a strict contract. A relaxed implementation can
be used when the caller's selected contract permits it. Record the selected variant
for inspection/reproducibility; deterministic compile-time behavior never consults
ambient host feature detection instead of explicit target inputs.

Separate build-time specialization from runtime dispatch. Known targets can select
and discard unused alternatives while compiling. A distributed executable may
bundle baseline and SIMD CPU functions and dispatch at startup/call boundaries;
GPU alternatives can be separately compiled modules selected at device/pipeline
creation. Do not put an unsupported SPIR-V capability into a supposedly baseline
module merely because its branch is not expected to execute. Separate modules may
live in the same package/executable. Prevent optional CPU instructions from leaking
into baseline code through inlining/whole-program optimization too.

CPU emulation of a whole kernel may require moving resources and synchronizing
with GPU work. It is not generally a transparent scalar call from an executing
GPU shader into arbitrary CPU code. Make such scheduling/transfer boundaries
explicit, preserve ordering/effects, and share interfaces/layouts or validated
adapters across variants. Optional implementation build dependencies should only
be required for enabled variants; missing optional tools/libraries must not disable
a valid baseline build.

Avoid an eager Cartesian product of every independent feature: specialize reachable
code on demand, cache reusable fragments/variants, and bound variant growth. Include
feature sets, semantic policies, chosen implementations and resources in appropriate
compilation/minimal-rebuild keys. Test forced baseline/fallback selection even on
feature-rich hardware, missing enabled features, incompatible profiles and shared
CPU/GPU reference kernels. These are requirements/tasks, not implemented dispatch.

## 2026-11-16: Absorb selected LLVM and Binaryen machinery into Tower

The user explicitly sets the long-term direction: inline/translate/convert the
needed LLVM and Binaryen compiler code into Tower itself, remove what Tower does
not need, make the retained compiler deterministic and targeted to Tower's
requirements, and build extensive tests. This is architectural guidance and a
future migration; it is not an instruction to replace both upstream projects in
the current foundation/browser refactor.

Combine the useful LLVM-to-WASM machinery and Binaryen's additional optimizations
within Tower's own compiler. Crucially, Tower's graph/opcode representation uses
the SAME node/entity/component system as the parse tree and AST, augmented with
instruction/semantic information. Compiler analysis, formatting, transformations,
interpretation and target emission should share those definitions. No independent
public graph dialect or binary bytecode is introduced. Canonical operations retain
foundation spellings and semantic source round trips; target-specific analyses or
execution caches remain derived views rather than competing program semantics.
Being written in Tower also lets the compiler participate in Tower's dependency
tracking and minimal rebuild facilities as they mature.

This clarifies the preceding Binaryen discussion. Near term, use the working LLVM
backend; optionally benchmark Binaryen wasm-opt as a post-link optimization step.
The existing repo only has commented-out Binaryen integration, not a maintained
direct Tower-to-Binaryen backend. Emscripten's current optimization documentation
still describes Binaryen optimizations after LLVM/LLD, and Binaryen accepts final
WASM directly. Long term, the user wants the useful optimizations combined inside
Tower rather than permanently maintaining two opaque external pipelines:
https://emscripten.org/docs/optimizing/Optimizing-Code
https://github.com/WebAssembly/binaryen/blob/main/README.md

Translation/adaptation must preserve applicable upstream licensing and attribution.
Port only with understood preconditions and Tower's explicit semantics: upstream
assumptions about poison/undefined behavior, trapping, aliasing or fast math cannot
silently become Tower rules. Some passes operate on target-specific details that
are unavailable earlier, so combining them does not imply running every pass at
one abstraction level. Derived target views/components are compatible with shared
node infrastructure; target instructions need an explicit supported representation
if exposed as canonical Tower operations.

Testing direction: keep the reference interpreter and upstream backends as
independent comparison points during migration; test each pass before/after on
valid inputs under a stated profile. Include known regression cases, generated
and adversarial programs, bindings/types/scopes, pointer alias/lifetime behavior,
effects/traps, canonical text round trips, feature variants and forced fallbacks.
Distinguish defined deterministic Tower results from upstream unspecified behavior
when comparing. Add reproducibility checks for same program/inputs/target/profile
across hosts and repeated/incremental builds, plus performance and size benchmarks.
Bit-identical artifacts require fixed toolchain/configuration and deterministic
ordering; execution determinism alone does not imply identical emitted bytes.
These plans were added to guidelines/tasks; no migration completion is claimed.

## 2026-11-16: One shared backend architecture including SPIR-V and WGSL

The user extends the LLVM/Binaryen translation direction to SPIR-V machinery and
the SPIR-V-to-WGSL translator as well. The end goal is a broadly targeting compiler
written in Tower: absorb/translate the needed implementation code, share what is
applicable across all of it, and specialize for Tower's semantics and determinism.
"Inline SPIR-V" here means the relevant implementation/tooling (generation,
validation, transformations and conversion), not treating a specification or
binary format itself as executable compiler source. Exact upstream projects and
the boundary of code to adopt are not selected yet.

All of these paths use the same Tower node/entity/component architecture for parse
trees, ASTs and foundation instructions, with semantic/target components and
derived analyses as needed. Share types, layouts, effects, validation, transforms,
dependency tracking and formatting rules wherever their contracts align. Keep
target-specific legality and lowering explicit; sharing infrastructure does not
make every CPU operation legal in a shader or erase backend execution models.
The saved/interchanged Tower program remains compilable foundation text.

Browser WebGPU accepts WGSL source, not SPIR-V binary. Native wgpu's optional
SPIR-V input support is a separate implementation API. Therefore the future target
paths include Vulkan/SPIR-V, DirectX 12/DXIL, and browser WebGPU/WGSL:
https://gpuweb.github.io/gpuweb/#dictdef-gpushadermoduledescriptor
https://docs.rs/wgpu/latest/wgpu/enum.ShaderSource.html

Initially a suitable translator could bridge compatible SPIR-V into WGSL. The
user does not want that intermediate conversion to be permanent: translate/adapt
its useful conversion and validation machinery into Tower, then generate WGSL
directly from the shared internal representation. Avoid serializing to SPIR-V
and reparsing it merely to reach another backend when internal information is
already available. WGSL/WebGPU restrictions still require validation even when
no external translator is used. Retain relevant upstream attribution/licenses.

Apply the same incremental migration and large conformance suite as for LLVM and
Binaryen: canonical source round trips, per-pass checks, independent reference
execution, upstream comparisons on defined overlapping semantics, target validators,
actual CPU/GPU execution, forced capability/fallback variants and deterministic
build/evaluation tests. The intended "mega backend" is this unified architecture,
not a claim that the SPIR-V/WGSL paths or self-hosted translations exist today.

## 2026-11-16: Function invocation uses parentheses without a call keyword

The user asks whether the call keyword is needed, then explicitly requests its
removal. Foundation calls now use `name(arguments)`, both for value-producing
expressions (`var result: i32 = add(20, 22);`, `result = add(20, 22);`) and
standalone invocations (`increment(pointer);`). Function declarations remain
`fn name(arguments): Type`, and variable declarations retain `var name: Type`.

In the current foundation grammar, the token after a name distinguishes `(`
for calls, `=` for assignments, or an operand continuation/boundary. This does
not require precedence rules, backtracking, parser symbol lookup or an additional
runtime search algorithm. A language built above the foundation can choose its
own meaning for parenthesized forms through its rules and replacements.

The `CoreCall` parse shape/captures, semantic components, parameter checks,
callee binding, recursion and return behavior are unchanged. The grammar and
canonical formatter now share the bare-call spelling. Examples and execution,
round-trip and browser tests are being updated together. Nested call expressions,
callable values/indirect calls and general expression precedence are separate
features, not implicitly added by dropping this keyword.

## 2026-11-16: Shared foundation entities and whole-document inspection implemented

Replaced the separate CoreInstruction/operand/function/block representation and
binary graph transport. `CoreNode` semantic components are attached directly to
the retained expanded parser entities; the program owns the parse-tree roots,
while bindings/callees/semantic child links are non-owning within that lifetime.
Recursion therefore needs no ownership cycle. Derived slot/function indexes stay
metadata on those entities. The reference interpreter and LLVM lowering read
these same components; the interpreter walks structured nodes with task stacks.
LLVM derives its own blocks and retains the existing checked-pointer behavior,
local promotion/O2, verification and LLD executable output.

`core_format` emits compilable foundation text using the agreed var/colon
declarations and bare calls. The old `%slot`/block/debug-op listing and binary
serialization exports are gone. The isolated LLVM module accepts foundation text
and runs the shared parser/resolver/type checker with the configured foundation
grammar. Source-map sidecars preserve diagnostic locations, including generated
replacement operations. The browser ABI is version 3; README/ABI/foundation docs
and bundled examples were updated. Ordinary type names are identifiers resolved
through the current scalar registry, rather than grammar keywords. Reflected
types, user-defined types and local inference remain future work.

The parse inspector now presents all successful top-level trees as ordered
children of one Document root. Nested statements remain under their parents.
Select a declaration, statement, nested capture/token, or replacement trace to
highlight its source; the expanded-code preview follows the selected subtree.
Children are populated lazily. Declaration names and source snippets make the
collapsed roots identifiable. The construct timeline and Run all/Next construct/
Reset controls are removed. Active grammar shows the final installed revision.
Live parsing/highlighting still uses the warm worker; all execution and LLVM
compilation/linking remain cancellable in a separate disposable worker.

Native round-trip tests compare semantic structure, types, declaration references,
order and bindings, and assert that semantic nodes also carry parser components.
They verify ownership release after destroying machines. Differential WASM cases
cover recursion, initializers, shadowing, ordinary type/call names, aliases,
lifetimes, traps, generated-source mapping and malformed editable semantic rules.
Review also found and fixed structured-interpreter break/continue unwinding:
an enclosing loop continuation must be distinguished from an unentered sibling
loop still in the task stack. Dedicated differential cases exercise both forms.

Desktop/mobile browser checks cover document/nested-node/replacement selection,
inline errors, compilation/execution cancellation, worker-only WASM execution,
source persistence, viewport containment and continuous typing. Screenshots are
saved under build/playground-document-*, playground-foundation-* and other
playground-*.png artifacts and were visually inspected. The latest typing profile
(build/foundation-profile.json) measured desktop median warm parsing 0.9 ms,
median editor-to-result DOM update 17.1 ms (p95 19.2 ms), and emulated-mobile
median update 17.6 ms (p95 19.7 ms). Both used one parser worker; the continuous
44-character burst produced 44 updates on each. These are local measurements on
the small example, not guarantees for arbitrary grammars, real phone hardware,
cold compilation or LLVM execution.

Remaining related work includes a general editor formatting command/extension
recipes, comment preservation, generated/escaped-name policies, verified public
node-construction/transformation APIs and stable identities across edits. The
current component schema is the foundation for that work, not a completed
reflection/ECS editing system or incremental optimizing compiler.

Final validation for this implementation: 61 Node/WASM tests passed (including
real LLVM/LLD execution and the loop-unwinding regressions), all 42 Playwright
desktop/mobile tests passed, and the complete Windows native AddressSanitizer
suite passed with the bare-call grammar and shared-node round-trip checks.
The static dist was rebuilt and packaged as build/tower-playground.zip. The local
preview is http://127.0.0.1:4173/. todo.txt was not modified by this work.

## 2026-11-16 — One editable foundation module and parallel reference execution

The user asked to show the real foundation file, not a token-only example that
redeclares its own defaults, and confirmed that there should be just
`foundation.tower`. Consolidated the former lexical seed and core grammar into
`scaffolding/foundation.tower`, containing token/skip declarations followed by
the instruction-like grammar, including functions, arguments, calls and returns.
The static build copies that exact file; executable examples no longer receive
a generated grammar prefix. The native test runner uses the same file.

The native declaration reader starts from an empty environment when loading the
module. Token definitions enable ordinary tokens; later parse declarations build
the grammar. Installation is atomic and identical module source is idempotent,
so loading it again cannot accumulate duplicate `|=` alternatives. Changed source
rebuilds the module from its beginning. Existing sessions pin their baseline;
new sessions inherit both tokens and grammar. This is module-load idempotence,
not a change to the ordinary meaning of repeating an extension declaration in
one source document. This is not yet a general file-import language feature.

The Foundation button edits that shared module in the browser, with separate
source/module buffers and undo histories. The source parser and both executable
frontends use its current contents. Invalid modules remain editable, produce
inline diagnostics in the module view and block dependent source analysis/runs.
Restore reads the bundled version; Save downloads the current file. Both buffers
persist in local storage. This static page cannot write edits back into the
repository or server filesystem. The immutable compiled-grammar cache is now
bounded at 64 entries so the complete foundation declaration sequence can remain
warm without cycling through a 32-entry cache.

The user also requested fully expanded code at the replacement locations in the
tree. Removed the single shared preview. Provenance locates each replacement at
the root of its resulting subtree; nested replacements receive their own preview,
chains share their final result at one root, and duplicated captures retain
separate occurrences. Previews use the final token reconstruction and remain lazy
with the tree, independent of Show tokens. Selecting a replacement still highlights
its invocation and reports definition coordinates. Module-qualified definition
navigation remains follow-up work; definition coordinates are module-local.

### Always compare interpreter and LLVM

Removed Run LLVM, the backend selector, instruction representation selector and
the instruction expander. Each execution now starts two disposable workers in
parallel, separate from the warm live-parser worker. Interpreter and LLVM each
compile from the same source/module revision and expose independent progress and
output. Completion compares status, captured output, trap message, source location
and truncation automatically. A mismatch is visible; loading/host failures report
comparison unavailable. Cancellation terminates whichever workers remain active;
an edit cancels both and discards obsolete messages. A finished interpreter does
not prevent cancellation of a still-compiling or infinitely running LLVM program.

Five persistent columns show Tower instructions as compilable Foundation source,
LLVM before optimization, LLVM after optimization, interpreter output and LLVM
output. On phones, the three instruction columns sit above the two output columns.
All scrolling stays inside the viewport. Steps and measured timings appear at the
bottom: Tower compilation, instruction formatting, LLVM total compilation,
lowering/before IR, optimization/after IR, object emission/linking, each execution,
and module loading. Timings describe actual stages; there is no fabricated
bytecode-build timing. The interpreter still executes shared Foundation nodes;
a compact private interpreter encoding remains future work.

Comparison currently checks observable output/traps for this run, not a proof of
semantic equivalence for every input or unobserved memory state. Output remains
bounded at 64 KiB per runner. If both outputs truncate identically, the UI explicitly
says that the captured results match; it does not claim to have compared the tail.
The LLVM timings include its canonical-source frontend, lowering, verification,
optimization, emission and linking. Execution elapsed time includes guest module
initialization for LLVM and cooperative yields for the interpreter; these are
debugging timings rather than isolated backend benchmarks.

The user wants to extend this model to shader emulators and actual SPIR-V or
WebGPU/WGSL execution, including reading back results. Preserve this direction:
independent runners consume the same semantic program and explicit inputs, and
comparison uses the selected numeric/resource/context contract. GPU capability
checks, derivative/workgroup context, upload/readback and relaxed-math tolerances
must be explicit. No shader backend was implemented in this change.

### Canonical names across an edited input grammar

Testing a real module edit exposed a round-trip bug: allowing `player-name` in
Identifier worked in the interpreter but the canonical text could not be read
by LLVM's bundled foundation. Foundation now includes backtick-quoted identifiers.
The shared formatter quotes names that are not ordinary identifiers or collide
with canonical keywords. Semantic name decoding preserves backticks, backslashes,
newlines and tabs, as well as bindings and pointer display names. Plain names keep
their existing spelling. Quoting is defined by the Foundation token rule; no new
native parser branch was added. LLVM parses canonical output with the bundled
module, while both runners' input frontends use the editable module. Thus an input
keyword such as `emit` can still serialize as the canonical `print` operation.

Validation includes module installation/pinning/idempotence and invalid-module
recovery, real renamed-keyword and hyphenated-identifier execution in both backends,
quoted-name structural round trips, nested/duplicated replacement previews,
independent undo histories, deliberate mismatch injection, parallel progress and
cancellation during LLVM loading, and desktop/mobile viewport checks.

The latest local profile measured warm example parsing around 1–2 ms and median
edit-to-DOM updates of 18.0 ms desktop / 18.3 ms mobile emulation (p95 20.3 / 19.8 ms).
Both retained one parser worker and produced 44 updates for 44 continuous edits.
This is a small-program local measurement, not a guarantee for arbitrary grammar
changes, cold LLVM compilation or real phone hardware.

Final validation: all 66 Node/WASM checks passed, including real LLVM/LLD runs
with quoted/escaped names; all 50 Playwright desktop/mobile checks passed; and
the complete Windows native AddressSanitizer suite passed. Visually inspected
desktop/mobile instruction/output columns, the 320-pixel layout and inline
replacement previews. A final stale node-info cleanup was covered by targeted
tree/viewport browser checks. Rebuilt the static dist and refreshed
`build/tower-playground.zip`. Preview: http://127.0.0.1:4173/. No edits to todo.txt.

## 2026-11-16 — User-defined struct types and checked fields

The user accepted the next milestone: a common registry for built-ins and user
types, structs with deterministic layouts and typed field access, and one complete
program that passes a local struct's address into a function, mutates a field and
prints the same result in interpreter and LLVM. The implementation now includes
that program as the playground's Structs example.

Foundation syntax is `struct Pair { first: i32; second: i32; }`. Names after
`struct`, field names and names after `:` remain ordinary identifiers; the parser
does not look up types. A shared `CorePlace` rule adds `pair.first`, nested member
selection, assignment targets and `&pair.first`. Member selection also accepts
exactly one level of struct pointer, so a `Pair*` parameter uses `pair.first`.
This adds no arithmetic precedence hierarchy. Pointer-to-pointer access requires
an explicit load first. All grammar remains in the one foundation.tower module.

The program owns one type registry containing built-in and user type entities.
Built-ins carry their representation and layout metadata; user structs and fields
attach semantic components to their actual parse nodes. CoreType references a
primitive representation or nominal struct entity plus pointer depth. References
from fields and accesses are non-owning, so recursive pointers create no ownership
cycle. Field access binds to the declared field entity. Canonical formatting emits
the struct declaration and normal member syntax, preserving quoted names, forward
references and bindings. No separate public type graph or instruction format was
introduced. The host inspection result exposes the same registry's names, kinds,
sizes, alignments and fields/offsets; Tower-language reflection remains future work.

Headers register first, then fields resolve, layouts validate, function signatures
resolve and ordinary bodies type-check. This supports forward type references,
nested inline structs and recursive/mutually recursive pointers. By-value layout
cycles, duplicate types/fields, unknown fields/types and nominal pointer mismatches
are rejected before effects. A type named i32 cannot replace the existing registry
entry, just as one user type cannot redeclare another. Value variables named i32
remain legal because declaration recognition and type lookup are separate.

The initial portable value-layout profile specifies i32/u32 4-byte size/alignment,
bool 1/1, void 0/1 and checked pointers 24/8. Fields follow declaration order with
alignment padding and final struct padding. Empty structs occupy one byte and one
storage cell, preserving distinct object addresses. The checked pointer contains
a cell index, lifetime generation and display-name index; this is neither a native
address nor an external C/shader ABI. The interpreter and LLVM currently derive
scalar storage-cell indexes from the same type/field metadata and retain separate
initialization/lifetime bookkeeping. Those cells are not a packed memory image of
the reflected byte layout. External ABI profiles and GPU resource layout remain
explicit follow-up work rather than an implied property of these structs.

Each field has independent initialization state. All cells belonging to a local
share a generation, including nested fields. Field pointers alias the original
storage and expire when the owner leaves scope, returns from its frame or is
declared again on a loop iteration. A field address can be taken before that field
is initialized; reading its contents still traps. Runtime traps and source locations
agree between the interpreter and generated LLVM/WASM. If a call produces the
right-hand side of an assignment, arguments are read and the destination address
is captured before entering the callee; changing an alias inside that function
does not redirect the pending store.

For this first slice, structs are local storage and are passed/returned through
typed pointers. Whole-struct assignment, comparison, printing and by-value
parameters/returns produce explicit diagnostics. Fixed arrays, vectors, copying,
by-value ABIs and Tower-level reflection are next steps. Struct metadata and member
syntax are already shared with the formatter and both backends. Resource limits
bound types, fields, nesting and flattened storage; excessively deep member paths
or exponentially large by-value layouts fail without exhausting the native stack.

The Structs example prints 42 after a function adds two fields, 22 for its unchanged
second field, then 7 after writing through an i32 pointer to that field. It runs
automatically in both workers and appears in all existing instruction/output
columns. Browser tests exercise inline missing/uninitialized-field errors and
expired field pointers, then edit back to valid source. Desktop/mobile screenshots
were visually inspected.

Saved Foundation defaults now record their bundled baseline. If unchanged, they
upgrade when the bundled grammar changes; custom module source remains intact.
An exact SHA-256 identity also recognizes the previous bundled default, whose
older UI stored no baseline. Unrecognized legacy modules are preserved rather than
guessed to be disposable defaults. This prevents ordinary returning users from
accidentally retaining a pre-struct default while protecting grammar edits.

Validation: the complete 84-test Node/WASM suite passed, including 18 new struct
checks and real LLVM differential execution, layout inspection, canonical round
trips, pre-effect diagnostics and allocation ownership. A further storage-selection
unit test passed. All 54 desktop/mobile browser checks passed, followed by 12
targeted checks for the saved-baseline changes (including two new upgrade/preserve
cases). The complete Windows AddressSanitizer suite passed with native struct
layout, shared-node structural round-trip and field-lifetime tests. todo.txt was
not modified.

Rebuilt the static page and refreshed `build/tower-playground.zip`. The preview
remains http://127.0.0.1:4173/; refresh and select Structs to run the milestone.
The prior packaged Foundation source was also checked directly against the saved
module selector: the exact old default upgrades, while adding an edit preserves it.

## 2026-11-17 - Replacement diagnostics and bootstrap clarification

Renamed the playground's LLVM columns to LLVM raw and LLVM optimized. Replacement
template failures now explain the required syntax category and quote the invalid
template: `Replacement for Statement must produce a valid Statement.
"$name - $name;" is not a valid Statement.` The original parser cause remains
available, and the editor still underlines the offending token at its original
UTF-8 source offset. Empty templates are explicit; excerpts are bounded and do
not split UTF-8 characters. Helper-rule failures list their attempted destination
categories rather than claiming that only the helper itself is permitted.
Grammar-table failures are described as validation failures, not proof that the
template itself is invalid. Declaration installation remains atomic.

Rebuilt both WASM modules and the static playground. All 10 replacement tests
passed, including category reporting, source offsets, unknown captures and helper
destinations. Desktop and mobile browser checks passed; screenshots confirmed the
inline error fits, and correcting the assignment recovers to matching execution
in both workers. The earlier column rename also passed desktop/mobile execution
checks. No changes to todo.txt.

Clarified the current bootstrap boundary: `parse`, `token`, `skip` and declaration
names use the native seed grammar/lexer in syntax.cpp. That reader recognizes the
name `Identifier` while installing its token declaration; it does not depend on
the ordinary Identifier token being defined. Editing Identifier changes ordinary
Tower code, not grammar declaration names. The seed is part of the foundation
conceptually, but is not yet authored in foundation.tower. A starting reader is
necessary; permanently keeping the entire declaration grammar in C++ is not.
Moving more of this machinery into Tower remains future work, not a change made
as part of these diagnostics.

## 2026-11-17 - Shared grammar entities and a proposed bedrock module

The user reiterated that data-driven grammar declarations must use the same
node/entity/component architecture as parse trees, ASTs and foundation semantics,
including the eventual ECS implementation. They proposed formatting the native
declaration grammar into Tower source, possibly as bedrock.tower with
foundation.tower layered above it. Recorded the shared grammar-node/formatter
requirement in AGENTS.md; this discussion does not implement a new module loader.

Verified current identity behavior in the built WASM parser: repeating
`parse Statement = 'x';` succeeds and reuses a cached table, but still advances the
session revision. Repeating it using `|=` instead appends a duplicate alternative
and diagnoses a reduce/reduce conflict. Installing the exact same complete
foundation module through syntax_set_bootstrap returns immediately. Thus semantic
idempotence of replacing a definition, revision/provenance updates, and idempotent
module installation are separate concerns; ordinary extension is not deduplicated.

Current foundation.tower really supplies the ordinary lexer and grammar as source.
The native declaration seed still lives in syntax.cpp. Foundation execution,
validation, canonical spelling and expected Core* labels/captures still have C++
implementations/contracts. The current grammar pipeline already constructs
TowerNode rule/reference/literal components, but also copies declaration semantics
into Definitions/Sequence/Term and TokenDefinition structures. Complete shared
grammar entities and a declaration formatter are therefore work to do, not an
already completed property of the implementation.

Recommended layering: a minimal seed loads bedrock.tower (declaration syntax),
which loads foundation.tower (ordinary tokens and executable foundation grammar).
Keep irreducible scanners/grammar installation hooks explicit during migration.
Bedrock should become an actual consumed source module; a generated text display
of hardcoded rules alone would not make its edits authoritative. A bootstrap
snapshot/table may be generated from the same source, avoiding a second manually
maintained grammar. Current reserved __ names and fixed declaration dispatch mean
that simply appending a dump cannot yet replace the native seed.

The first slice should attach declaration semantics to shared nodes, extend the
common formatting engine to serialize those declarations, and verify reloads.
Format source-level grammar entities, retaining order, `=` versus `|=`, token
styles, captures, replacement templates and provenance, rather than trying to
reverse generated LR tables/repetition helpers into source. Require canonical
round trips and seed/bedrock agreement on accepted syntax, resulting rule
structure and replacement behavior before changing the bootstrap boundary.

## 2026-11-17 - Shared grammar nodes, formatter and editable bedrock implemented

Implemented the three steps above. Parse/token/skip declarations, alternatives,
terms, captures and replacement templates now carry SyntaxNode components on the
actual TowerNode parse entities. Grammar tables, token lookup and compiled patterns
are derived indexes/caches over those entities. The previous copied Term/Sequence
and token-definition semantic structures have been removed. Syntax and executable
foundation nodes use one tower_format engine; core_format delegates to it. Grammar
formatting preserves declaration order, replacement versus extension, capture names,
styles, patterns and template bodies. Declaration comments are retained, with
comments inside a declaration moved before it; template contents retain their own
text. Source spans remain metadata, and generated seed entities have no fabricated
source positions. Published grammar versions are immutable; a general verified
live entity-editing API and the eventual ECS implementation remain future work.

Added real scaffolding/bedrock.tower, generated by formatting the native grammar's
shared entities. An exact-output test prevents the bundled default and native seed
from drifting. The immutable C++ seed ALWAYS reads bedrock, even when bedrock
changes the downstream declaration keywords. Installed bedrock then reads
foundation.tower and user declarations. Named captures specify the declaration
installation contract. The remaining native scanner primitives are __Quoted,
__Pattern and __Template; installation and semantic validation also remain native.
Changing bedrock is atomic, invalidates the dependent foundation baseline, and
does not change existing sessions that retain their installed grammar versions.
Identical complete module installations return immediately. Ordinary repeated
declarations still retain the revision/extension behavior documented above.

The host loads bedrock, foundation, then the user program. This is not yet a
general import implementation: the intended future source relationship is
foundation importing bedrock and user modules importing foundation. Canonical
grammar text uses the default bedrock spelling, even if an edited bedrock accepts
different declaration keywords. Formatting requires a completed, valid declaration
document and refuses to silently discard executable statements. Bedrock's own
declaration grammar currently rejects replacement handlers; ordinary language
replacement rules remain supported. These boundaries are documented in the ABI.

The playground now fetches both actual module files. Bedrock and Foundation are
options in the editor document dropdown, as requested; their separate buttons
were removed. Each module has its own saved source and undo history, Restore and
download support, inline diagnostics, parse tree, and canonical text in the Tower
instructions column. Bedrock remains editable when its downstream foundation is
invalid. Both execution workers receive the edited modules; the LLVM canonical
source reader uses the bundled spelling. A browser test changes parse to rule in
bedrock, adapts foundation and user source, and gets matching result 42 from both
backends. Additional checks cover independent histories and invalid-edit recovery.

Validation: rebuilt the frontend and LLVM WASM modules and static page. All 92
Node/WASM tests passed, all 64 desktop/mobile Playwright checks passed, and the
complete Windows AddressSanitizer suite passed. Native checks include shared-node
ownership, immutable seed isolation, semantic round trips and formatting a changed
uninstalled entity. Visually inspected the desktop/mobile Bedrock and Foundation
screenshots after moving the modules into the dropdown. No changes to todo.txt.

The typing profile uses the real bedrock load path. For the example, browser parse
medians were 2.0 ms desktop and 1.7 ms mobile-emulated; editor update medians were
18.3 and 18.7 ms, with p95 20.9 and 21.3 ms. These are local measurements, not a
hardware-independent latency guarantee. Warm Node/WASM parsing plus inspection
was 1.54 ms median for the example and 58.47 ms for 500 loops, with zero grammar
table builds. Continuous typing reused one analysis worker and reached the final
edit on both viewport profiles. Results are in build/bedrock-profile.json. The
local preview remains http://127.0.0.1:4173/; the static package was refreshed.

## 2026-11-17 - Public Bedrock vocabulary and inherited lexical definitions

The user rejected the internal `__` naming convention: Bedrock's definitions are
meant to be used and shared. Removed that convention and the blanket prefix ban.
Concepts specific to grammar declarations now use consistent descriptive names:
GrammarDeclaration, GrammarTokenDeclaration, GrammarSkipDeclaration,
GrammarAssignment, GrammarReplacement, GrammarAlternatives, GrammarSequence,
GrammarTerm, GrammarSuffix, GrammarAtom and GrammarStyle. GrammarPattern and
GrammarTemplate name the remaining native scanner primitives. Grammar literals
now use the ordinary shared String token. Names such as __number are legal user
bindings; generated parser helpers avoid all declared names rather than reserving
a source prefix. Template helper remapping uses the shared source term entity,
so its correctness no longer depends on matching generated names.

Foundation now inherits Bedrock's token/skip and grammar entities by reference.
Whitespace, LineComment, BlockComment, Identifier and String are defined once in
bedrock.tower; Foundation adds Number and executable syntax. The duplicate
declarations have been removed from Foundation. Changing those Bedrock patterns
therefore affects both downstream declaration reading and ordinary program input.
Inherited grammar rules can be referenced, extended or replaced, for example
`parse Statement = 'assignment' GrammarAssignment ';';`. Snapshots show inherited
definitions; the common formatter serializes only the current document's own
declarations, preserving the module boundary.

Local replacement changes a binding, not the imported entity. In particular,
an application's override of Identifier does not alter the pinned Bedrock lexer
that reads its grammar declarations. This keeps the existing ability to change
application identifiers to @name while writing later declaration names normally.
Bedrock edits change the shared baseline for both uses. Bedrock itself continues
to use the immutable native seed; general imports remain future work. Existing
sessions retain their old imported entities across module changes and resets.
Inherited token priority follows declaration order, and replacing a name keeps
its slot; adding a differently named pattern does not automatically outrank an
equal-length inherited Identifier match.

The same quoted Identifier definition and semantic decoder are now used for
grammar names/captures and executable identifiers. The common formatter quotes
grammar names when needed, including names that contain spaces or coincide with
keywords. Replacement holes accept quoted capture names too. Round-trip checks
cover those names and user bindings that resemble generated parser helper names.

The editor dropdown now starts Bedrock, Foundation, ForEach, then the other
examples, with no Modules heading. The original ForEach document remains the
initial selection. Existing separate module buffers, undo histories, persistence,
Restore and download behavior are retained. Untouched saved module defaults
upgrade through their recorded baseline; customized modules remain preserved.

The user also asked about `as comment`, `as number` and `as string`, then noted
that this resembles an overly limited attribute syntax. Currently `as` supplies
one string-valued highlighting category; familiar names have editor styles,
custom names are accepted, and the comment label also supports source-comment
preservation. It does not select a semantic value type, numeric conversion or
execution handler. Recorded this syntax as provisional, rather than expanding it
into a general attribute system now. Future extensible attributes should live on
the same shared nodes and distinguish presentation hints from semantic contracts.

Rebuilt both WASM modules and the static page. All 97 Node/WASM checks passed,
including native self-tests, shared-pattern edits, rule reuse, prefix/helper-name
collisions, quoted captures, round trips and interpreter/LLVM comparisons. The
full browser run passed 63 checks and exposed three test-assumption failures:
CodeMirror's virtualized DOM is not the full serialized document, and an inline
diagnostic may be outside the mobile viewport. The corrected checks download the
actual source and reveal errors through the existing error shortcut. All eight
Bedrock checks then passed on desktop/mobile, covering the three failures and all
66 browser scenarios overall. Visually inspected Bedrock and shared Foundation
screenshots on both viewport profiles. One Bedrock edit adds tilde whitespace and
hyphenated identifiers; unchanged Foundation accepts the program and both workers
return 42.

Local warm typing measurements: parse medians 2.2 ms desktop and 2.0 ms mobile-
emulated; editor update medians 19.5 and 19.2 ms, p95 20.4 and 19.9 ms. Both
continuous-typing runs applied all 44 edits using one analysis worker. The larger
500-loop Node workload measured 84.15 ms median while the native sanitizer suite
was running, so these measurements are observations rather than a performance
guarantee or an isolated before/after comparison. Results are saved in
build/shared-bedrock-profile.json. Refreshed build/tower-playground.zip and verified
the local server responds at http://127.0.0.1:4173/. No changes to todo.txt.

The complete Windows AddressSanitizer suite also passed, including shared-node
ownership, declaration/formatter round trips, public Bedrock rule reuse and
generated-symbol collision coverage. No remaining validation failures.

Rechecked the user's requirement that Foundation must not duplicate Bedrock:
the current source and static page contain no overlapping declarations. Broadened
the existing regression check from the five shared lexical names to every parsed
token/skip/parse declaration in both bundled modules. It passes. The Active grammar
inspector intentionally includes inherited definitions; their presence there is
not a second declaration in foundation.tower. Older customized local module text
can still be retained by the editor's persistence policy.

## 2026-11-17 - Fix stale Foundation in the actual editor and publish Pages

The user's screenshot showed duplicate Whitespace/comment/Identifier/String
declarations in the Foundation editor. My prior check covered the bundled file
and a fresh browser, not the saved document the user was seeing; dismissing the
screenshot as inherited entries in Active grammar was incorrect.

Reproduced the screenshot-era Foundation as a saved local document. An older UI
could preserve that document while recording the current bundled baseline beside
it. The existing upgrade test then treated the old default as a customization;
the legacy hash check also ran only when no baseline existed. A regression using
the screenshot's old lexer and the newer baseline failed before the fix.

Known old defaults now upgrade regardless of the baseline-key mismatch. Added a
narrow, versioned migration for the known old lexical preambles: remove unchanged
definitions now inherited from Bedrock, retain actual lexical/grammar edits, and
upgrade the old lexer-only module to the complete current Foundation. Unknown
headers/syntax remain untouched. This migration matches known historical source
text; it is not an alternative Tower parser or semantic representation. Before
persisting an upgrade, the original saved text is backed up locally under
tower-playground-foundation-before-inheritance-v1. The updated document is saved
immediately so switching files or reloading cannot restore the stale copy.

All four storage checks and 16 related desktop/mobile browser tests passed. The
browser regression seeds the old module plus the incorrect newer baseline,
inspects the actual editor, downloads its complete source, verifies the backup,
executes both backends, and reloads. Desktop/mobile screenshots confirm that
Foundation starts with Number and executable grammar, without the duplicate
shared declarations. C++/WASM code was unchanged by this persistence fix.

The user explicitly requested publication to GitHub Pages, superseding their
earlier withdrawal. Published the tested static dist files and .nojekyll in the
repository's gh-pages branch at commit e69173b556cf5a87e604c18190f49391787d6331.
GitHub's pages build and deployment run 44163200362 completed successfully; Pages
serves gh-pages at / with HTTPS enforced. Live URL:
https://trevorsundberg.github.io/tower/.

Added scripts/verify-deployment.mjs and ran it against the live Pages URL. All ten
checked assets, including both WASM modules, matched local SHA-256 digests, and
WASM responses had the expected content type. Actual desktop/mobile browser runs
compiled a typed add function, got matching interpreter/LLVM output 42, displayed
raw and optimized LLVM, opened both modules, upgraded the old saved Foundation,
verified its downloaded source and backup, and stayed correct after reload.
Neither browser recorded a page error. Evidence is in build/deployment-verification
and build/deployment-online-verification.log. No changes to todo.txt.

## 2026-11-17 - Keep execution UI uniform; remove copied grammar output

The instructions column had a special module-editing path that displayed the
shared formatter's grammar text, duplicating the editor. Those declarations are
not executable instruction output. Removed that substitution and the unused
formatting request from the analysis worker. The instructions column now receives
only the execution compiler's canonical foundation operations.

The user explicitly rejected hiding execution or special editor behavior for
Bedrock/Foundation. All files retain the same execution columns and controls;
removed the module-specific execution guard, disabled button and status. The
existing content-based automatic execution policy applies to every file. Grammar
declarations alone produce no Tower instructions. Manual execution remains
available, with interpreter and LLVM both checking the same compiled program.
The compiler's required seed/Bedrock/Foundation loading boundaries remain intact.
Shared grammar entities and their formatting API remain available; sharing a
formatter does not mean grammar source belongs in runtime instruction output.

Validation: all 18 related desktop/mobile browser checks passed, including manual
execution of declaration-only Foundation, empty instruction/output panes, visible
execution controls, switching back to executable source, undo histories and saved
module upgrades. Inspected Bedrock screenshots at both viewport sizes. Rebuilt the
static package and published commit 4d794f6b18094db359e1f788b08713b201b8db22;
Pages deployment run 44165275881 succeeded. No changes to todo.txt.

Verified the live Pages deployment on desktop and mobile: ten asset hashes match
the local build, Bedrock/Foundation retain visible execution panes with no copied
grammar instructions, and executable code still returns 42 in both backends after
reload. The deployment report and screenshots were refreshed.

## 2026-11-17 - Explain empty token literals and consolidate Restore

An empty quoted grammar token previously produced the incomplete diagnostic
"Unsupported token literal:" at the start of the declaration. It now reports
"Token literal is empty. Expected at least one character between the quotes."
Literal validation uses the term's existing shared-node source location, so the
inline underline points at the quotes. Both single and double quotes are covered;
grammar rejection still preserves the last valid revision. Empty alternatives
retain their existing separate spelling and semantics.

Example and Restore duplicated the reset action for Bedrock/Foundation. Removed
Example and kept one Restore action for the selected document, including ordinary
bundled examples. The document selector loads files; Restore resets their text to
the bundled version through the same loading path and remains undoable. Updated
documentation and browser checks to use the single action.

Rebuilt both WASM modules. All 25 parser/WASM checks (including the native self-test
suite running in WASM) and 10 related desktop/mobile browser checks passed.
Inspected screenshots of the new inline error at both viewport sizes. No changes
to todo.txt.

The rebuilt LLVM suite also passed all 29 checks. Published these changes as
2631ed793d7a8ae36a143fec538abe1f92d234c0; Pages run 44168644614 succeeded. Live
verification is being combined with the following incremental Bedrock correction.

## 2026-11-17 - Every file updates its active reader incrementally

The user clarified that the seed is a starting baseline, not a frozen reader for
all of Bedrock. This supersedes the earlier whole-file immutable-reader decision.
Every successful declaration takes effect after its boundary and changes following
source, including declaration syntax and lexical rules. Bedrock, Foundation and
ordinary source use the same installation path; their initial grammar differs.
The shared C++ seed and imported entities remain immutable. Failed declarations
leave the last valid local grammar intact, and failed module loads do not publish
a partial module. Existing sessions retain their own baseline versions.

Removed Bedrock's bypass of incremental table installation and its native trivia
shortcut. Declaration names, quoted literals, whitespace, comments and capture
names now use the active version's lexical entities in every file, rather than
pinned imported lexical definitions. Native handler capture requirements are
validated before each reader update, regardless of the originating file. The
existing LR recognizer, boundary behavior and bounded grammar cache are retained;
there is no new search or backtracking. Structurally unchanged definitions can
reuse their compiled grammar through that same cache.

The reported Identifier edit to /ffff[A-Za-z_][A-Za-z0-9_]*/ now rejects the next
unprefixed String declaration name in Bedrock itself. Changing the declaration
keyword from parse to rule likewise requires rule on the following declarations
of that same file. Updated examples that redefine Identifier/String so rules using
their old spellings precede those updates; changing a lexical binding no longer
has a hidden exception for declaration text. Updated the project instructions,
API comments, token documentation and browser/module regressions accordingly.

Kept comment support. Bedrock's header now states its load order and gives one
concise line each for GrammarPattern and GrammarTemplate, in both the source file
and the native shared-node seed used by the formatter.

Both WASM builds completed and all 101 Node/WASM checks passed, including native
self-tests, immediate reader updates in all three file contexts, default-module
formatting round trips, lexical failure recovery and interpreter/LLVM comparisons.

All 70 browser tests passed across desktop and mobile, including cancellation,
typing/cache reuse, rule renaming, empty-literal diagnostics, the unified Restore
action, and the exact reported Identifier-prefix edit. Screenshots show the latter
failing at the next String declaration in Bedrock, with the execution area retained.

The full native Windows AddressSanitizer run also passed, including parser linear
work checks, ownership and grammar cache checks, and foundation execution tests.
The static package was refreshed and published as
3cbc28daa9a28849c5289537b17f32c9cd0efea0. No changes to todo.txt.

Pages deployment 44172076968 succeeded. Live desktop/mobile verification passed:
all ten checked asset hashes match the tested local build; both backends return
42; editing Bedrock's Identifier immediately errors at the following String name;
Restore recovers; the empty-token message marks its quotes; and persisted
Foundation upgrades remain correct after reload. Updated deployment screenshots
and the report in build/deployment-verification.

## 2026-11-17 - Burst-style CPU SIMD, independent iteration and shared GPU primitives

### Request, scope and status

The user requested read-only research into how Tower could support a Unity
Burst-like compiler and eventually a job system written in Tower, with emphasis
on small, independently useful primitives and simple rules for language authors.
The intended scope includes generic LLVM-friendly vectorization, CPU and GPU
execution, SPIR-V shaders/compute kernels, and the existing DXIL/WGSL goals.
The user clarified that arrays, buffers and eventual capabilities comparable to
C/LLVM are planned foundations: their current absence should not dominate the
long-term design discussion. The user also explicitly invited reading the journals.

The research turn made no repository changes. This entry and the broader journal
instruction in AGENTS.md were subsequently authorized by the user. todo.txt is
untouched. This records a design proposal and observed experiments, not an
implementation of SIMD, buffers, shader backends or jobs. Proposed API names,
annotation syntax and numerical profiles below remain provisional; requesting
that the discussion be recorded does not settle every language-design choice.

### Main recommendation and simple author rules

Make Burst-style performance emerge from ordinary Tower features: typed memory
views, explicit access permissions, independent iteration, visible function bodies
and well-defined numeric operations. Share those contracts between CPU SIMD, jobs
and GPU kernels. First solve and test the individual primitives; do not require
an integrated scheduler/GPU framework before establishing their usefulness.

The easy path for an author should be:

1. Write a function for one item using ordinary scalar or vector values.
2. Put bulk data in typed buffers with explicit read or exclusive-write access.
3. Use a standard independent iteration operation when items do not depend on
   one another.
4. Prefer contiguous access; use field arrays when processing the same fields
   across many objects.
5. Freely compose ordinary, statically known helper functions.
6. Select reduction and numerical policies explicitly where ordering affects
   results.
7. Ask the compiler to verify important performance expectations.

No special Burst-only language subset or mandatory kernel declaration is needed
for an otherwise eligible ordinary function. Explicit target declarations can
request verification of inferred eligibility. General-purpose code remains
available; an independent iteration contract applies only where its conditions
are established.

### What LLVM and a Burst-like frontend each contribute

The supplied discussion correctly separates compilation from scheduling. LLVM
provides loop/SLP vectorization and many optimization/code-generation passes.
Unity's job system distributes batches across worker cores. A frontend must still
establish memory semantics, effects, specialization, numerical behavior, target
legality and useful diagnostics. Simply emitting LLVM does not establish these
facts, and enabling a vectorizer does not promise either vectorization or speed.
See [LLVM vectorizers](https://llvm.org/docs/Vectorizers.html) and
[Unity parallel jobs](https://docs.unity3d.com/2023.1/Documentation/Manual/JobSystemParallelForJobs.html).

Comparable machine code for eligible numerical kernels is a realistic goal when
Tower communicates equivalent facts under matching semantics and target settings.
Broad production parity is a much larger engineering effort. No calendar estimate
or performance parity was established by this research.

### Local repository evidence

Inspected scaffolding/core.hpp, core-nodes.cpp, foundation.tower,
llvm-backend.cpp, relevant examples/tests/build settings, docs/foundation.md and
the journal entries on shared CPU/shader code, target implementations, optional
features, deterministic execution, backend integration and struct layout.

- CoreNode components already share foundation semantics across formatting,
  interpretation and LLVM lowering. This is the appropriate place to extend
  contracts; a second public semantic IR is unnecessary.
- The current scalar enum contains i32, u32, bool, void and structs; buffers,
  floating-point values, vectors and shader execution contracts are future work.
- LLVM lowering already uses entry-block allocas for eligible ordinary locals
  and runs function(sroa,mem2reg,instcombine,simplifycfg),default<O2>.
- The executable LLVM path inspected targets wasm32-unknown-unknown with a
  generic CPU and no explicit target-feature string. The build enables the
  WebAssembly target. Native CPU/SIMD and shader targets need explicit target
  configuration, not just a higher optimization level.
- Current pointers are checked-cell handles carrying an index, generation and
  display-name identity. Loads/stores perform initialization/lifetime checks.
  Struct reflected byte layout is separate from this execution storage.
- The backend currently has global cell/stack/depth/generation state. Concurrent
  execution needs per-execution ownership of that state or a proven alternative.
- The vendored LLVM version file identifies a 20.0.0git source tree; the independent
  llvmlite probe below used LLVM 20.1.8. They are not asserted to be the same build.

For future buffers, use contiguous typed value storage with separate validation
bookkeeping. Eligible access can then lower to ordinary LLVM memory operations
once bounds, lifetimes and permissions are established. Preserve existing
checked behavior wherever proofs do not justify removing checks. LLVM's
[frontend performance guidance](https://llvm.org/docs/Frontend/PerformanceTips.html)
also supports the existing entry-alloca/SROA/mem2reg direction.

### Memory views, permissions and aliasing

Proposed facilities, with names subject to later design:

| Facility | Contract |
| --- | --- |
| ReadView<T> | Read access to a bounded region; readers may overlap. |
| WriteView<T> | Exclusive access to a bounded region, allowing reads and writes through that view. |
| split(view, boundary) | Produce provably disjoint subviews. |
| Contiguous view | Element size and unit stride are known. |
| Strided view | Stride is explicit; contiguous access is a specialization. |

Exclusive access must prevent conflicting overlapping access through unrelated
aliases for the duration of the borrow or scheduled work. A mutable parameter
annotation alone does not prove this. An initial implementation can use scoped
access tokens, runtime region checks, allocation lifetime tracking and static
proofs for simple cases; a complete general-purpose borrow checker is not a
prerequisite to experimenting with this contract.

Read-only does not imply non-aliasing. Separate wrapper objects can refer to the
same storage. Multiple read views may overlap. In-place operations should use
one read/write view rather than pretending that their input and output regions
are disjoint. Subviews of the same allocation can still describe disjoint regions.

Emit LLVM noalias only when Tower's access rules justify its actual contract.
General overlapping-pointer programs remain supported through dependency
analysis, runtime checks or scalar execution as needed. Proven alignment,
non-escape and memory effects should likewise be communicated only when valid.
The [LLVM noalias contract](https://llvm.org/docs/LangRef.html#noalias) is stronger
than a casual optimization hint; a false promise can introduce undefined behavior.

Region information can also support job dependency checking and GPU resource
tracking, making it a general memory primitive rather than a scheduler-only rule.

### Independent iteration and ordinary functions

Illustrative future Tower code, not accepted by the current integer-only core:

```tower
fn advance(position: f32, velocity: f32, dt: f32): f32 {
    var delta: f32 = velocity * dt;
    var result: f32 = position + delta;
    return result;
}

zip_map_into(next_position, position, velocity, dt, advance);
```

The function uses simple foundation-style operands and three-address operations.
The hypothetical zip_map_into supplies corresponding input elements and a shared
dt value to a statically known function, with one output element per iteration.
It validates matching lengths, lifetimes and required non-overlap before dispatch.

| Execution choice | Implementation |
| --- | --- |
| Reference interpreter | Iterate through items. |
| Single CPU thread | Generate a conventional loop and allow LLVM to vectorize. |
| CPU jobs | Schedule chunks, each containing that optimized loop. |
| GPU compute | Map logical items to shader invocations. |

Infer eligibility through the body and its callees. Explicit multi-target
requirements should be checked assertions with an explanatory call chain.
For more flexible independent iteration, initially provide exclusive access to
the current output element and permitted read inputs. Providing every iteration
with unrestricted writable access to the full output would complicate the proof.

Keep these cases distinct: pointwise maps; stencils reading neighbors from a
separate input buffer; potentially dependent in-place stencils; reductions;
scans; scatters with possible write conflicts. Give the latter operations their
own explicit contracts. A generic parallel annotation cannot erase dependence.

### Mathematical vectors, SIMD lanes and layout

A vec3<f32> is one three-component value. CPU SIMD might process eight such values
at once; a GPU subgroup contains several invocations, each possibly holding a
vec3. Mathematical vector width, CPU SIMD width, GPU subgroup size and workgroup
size are distinct concepts. Authors should not need to pack buffers into float4
just to request automatic vectorization. Vectors and swizzles belong in ordinary
eligible CPU functions as well as shaders.

ISPC is a useful reference for shared/uniform versus per-instance values and for
layout. Borrow those concepts while initially using LLVM's loop vectorizer.
A fuller masked SPMD transformation is later work for cases that auto-vectorization
handles poorly; merely marking a function as vectorizable does not implement it.
See the [ISPC performance guide](https://ispc.github.io/perfguide.html).

Support both array-of-structures and structure-of-arrays storage:

```text
AoS: x0 y0 z0 mass0 | x1 y1 z1 mass1 | ...
SoA: x0 x1 ... | y0 y1 ... | z0 z1 ... | mass0 mass1 ...
```

Field arrays often help neighboring iterations access the same field. AoS remains
useful for operations consuming whole objects. A future generic SoA<T> container
could derive field arrays from reflected metadata and expose convenient field
access. Blocked AoSoA storage is another later option, not a mandatory language
layout or an assumption that SIMD width is fixed across targets.

An element of SoA<T> is not necessarily a contiguous T object. Taking its address
cannot silently produce an ordinary T*. Use field-access proxies, component
references or an explicit materialized value with defined copy semantics.

Keep CPU storage, GPU storage-buffer layout, uniform/constant-buffer layout and
external C ABI layout explicit. One registry can describe them without declaring
them byte-identical. Offsets, strides, padding and alignment need validation or
adapters; do not infer interoperability from host sizeof or an LLVM vector type.
See [Vulkan shader memory layout](https://docs.vulkan.org/guide/latest/shader_memory_layout.html).

### Function composition and math implementations

Extracting code into ordinary helpers should preserve vectorization when eligible.
Support specialization of statically known functions/types, visible bodies during
optimization, inferred memory/escape effects and transitive target/context
requirements. Shared math operations should select implementations suitable for
the target and numeric policy, including vector-capable math where required.

Pure alone is insufficient: an opaque scalar function can have no effects yet
lack a vector implementation. A function writing its own output element can be
suitable for independent iteration despite not being pure. Treat trapping and
execution-context requirements separately from memory effects.

Dynamic dispatch is useful at chunk/dispatch boundaries. An opaque per-element
function-pointer call makes vectorization harder. Unity's own
[Burst function-pointer guidance](https://docs.unity3d.com/Packages/com.unity.burst@1.8/manual/csharp-function-pointers.html)
recommends batching such work. Do not require authors to manually inline every
helper; preserve bodies and contracts so specialization and LLVM can do the work.

### Numerical behavior, failures and checks

Distinguish ordinary elementwise arithmetic, explicit fused multiply-add,
approximate math with stated accuracy, ordered reductions, reductions with a
specified reproducible tree and reductions permitting target-dependent
reassociation. Do not apply blanket fast math merely to enable SIMD.

A reproducible reduction tree must specify grouping independently of worker count
or SIMD width. Deterministic scheduling alone does not establish floating-point
reproducibility. Strict compile-time behavior remains a function of explicit
program/inputs/target/semantics, never ambient host features. Runtime profiles,
selected implementations and context/fallback policies belong in specialization
and cache identity. No-fast-math LLVM arithmetic alone is not a complete proof of
Tower's stronger cross-host NaN, subnormal or mathematical-library contract.

Moving a check before earlier writes can change observable behavior. A new bulk
operation may specify shape/lifetime/access validation before any work starts;
that does not permit changing existing sequential-loop trap ordering. Initially
require portable independent bodies to be non-trapping after validation, or to
return errors as data. Later parallel failure/partial-result semantics must be
explicit rather than determined accidentally by scheduling.

Checks do not categorically prevent vectorization. The experiment below found
that LLVM vectorized a safe prefix of a bounds-checked loop and retained checked
scalar execution at the boundary. Preserve checks that remain necessary, and
measure/prove elimination rather than claiming all safety overhead disappears.

### GPU execution contexts and target legality

Introduce context-sensitive primitives independently, after ordinary item maps:

| Primitive | CPU interpretation | GPU interpretation |
| --- | --- | --- |
| Logical item index | Loop index | Invocation index |
| Shared launch parameters | Values outside the loop | Shader parameters/resources |
| Workgroup storage | Storage owned by an emulated group | Workgroup/shared memory |
| Workgroup barrier | Suspend/resume group execution through phases | Target synchronization |
| Subgroup collective | Explicit group emulation or a supported implementation | Subgroup/wave operation |
| Derivative or implicit-LOD sampling | Supplied context or selected fallback | Stage-appropriate operation |

Simple maps share a body readily. Running each invocation to completion in a
scalar loop does not generally emulate barriers. Group execution must preserve
synchronization points and participating invocations. Keep scope, address space,
memory ordering and capability requirements explicit; target support is checked
before emission. Never assume that CPU atomics and every shader target expose
identical ordering facilities.

Uniformity analysis should identify which values and control flow are shared
within the relevant group. WGSL requires appropriate uniform control flow for
collectives such as workgroup barriers. Partial-workgroup handling must guard
invalid memory access while retaining required barrier participation; returning
every out-of-range invocation immediately is not universally valid. See
[WGSL uniformity](https://gpuweb.github.io/gpuweb/wgsl/#uniformity) and
[Vulkan shader execution](https://docs.vulkan.org/spec/latest/chapters/shaders.html).

Retain the ocean-wave acceptance example: ordinary wave math executes on the CPU
for buoyancy and in rendering shaders. Sampling receives resources and sampler
state. The convenient CPU-call profile can select documented zero derivatives
and level-zero sampling without gradients. Faithful derivative emulation needs
quad context; convenient defaults are not bit-identical shader emulation.

Share Tower semantics and applicable transforms, then legalize per target:
CPU/WASM through LLVM; Vulkan through Vulkan-valid SPIR-V; DirectX 12 through
DXIL; browser WebGPU through WGSL. Preserve the planned direct shared-node-to-WGSL
path. LLVM's SPIR-V backend distinguishes Vulkan and OpenCL environments;
emitting some SPIR-V is not sufficient. Prototype the pinned toolchain's coverage
before selecting it as the only shader path. Use independent target validators
and actual execution, not successful serialization alone, as acceptance evidence.

References: [LLVM SPIR-V target guide](https://llvm.org/docs/SPIRVUsage.html),
[DXC](https://github.com/microsoft/DirectXShaderCompiler), and
[SPIRV-Tools](https://github.com/KhronosGroup/SPIRV-Tools).

Optional implementations retain the earlier journal policy: select only variants
satisfying the semantic profile and enabled capabilities, keep unsupported CPU
instructions out of baseline paths and unsupported GPU capabilities out of
baseline modules, and separate build-time specialization from runtime selection.

### Eventual Tower job system

Build scheduling on the same access contracts. Initially accept a compiled chunk
function, captures and range; track read/write regions and dependencies; keep
resources alive and conflicting access excluded until completion; distribute
chunks; and provide completion, cancellation and defined failures.

Worker count, chunk size, SIMD width and GPU workgroup size remain independent.
Most scheduling policy can eventually be Tower code over a small platform layer
for threads, atomics, parking/waking and device submission. Make execution state
per execution before concurrent use of the present backend. A cancelled task must
not release resource ownership while work using those resources is still running.

GPU dispatch additionally requires explicit resource availability, transfers and
completion dependencies. A GPU implementation must not silently turn an ordinary
scalar call into hidden asynchronous work or imply that a running shader can call
arbitrary CPU fallback code. CPU and GPU scheduling can share interfaces while
preserving these execution boundaries.

### Optimization diagnostics and expectations

Make optimization evidence visible early. A useful report identifies which loop
was widened, lane width, tail handling, remaining overlap checks, helper inlining
and target eligibility. A missed optimization should explain the relevant call,
access/dependency, numerical policy or unsupported operation with provenance.
For example, report that external_noise has no available vector implementation.

Offer target-specific expectations that turn an unexpected loss of vectorization
into a build error. Scalar tails can be allowed explicitly. Successful widening
is not a promise of faster or globally optimal code, and an expectation must name
its eligibility and target rather than applying blindly to the interpreter/GPU.
Burst's [ExpectVectorized](https://docs.unity.com/en-us/engine/7000.0/script-reference/unity/burst/compilerservices/loop/expectvectorized)
is a useful precedent. LLVM vectorization hints are not substitutes for valid
memory-dependence facts or for checking the optimization result.

### Actual trials and validation limits

Ran independent code-generation probes outside the repository using the existing
build/temporal-native/venv/Scripts/python.exe with -B, llvmlite 0.46.0 and LLVM
20.1.8. The explicit target was x86_64-pc-windows-msvc, CPU haswell, O3 with loop
and SLP vectorization enabled. Parsed and verified scalar LLVM input, optimized
it, verified the result and emitted x86 assembly. No JIT/native workload execution,
GPU execution, performance timing or Tower vector lowering was tested.

| Probe | Observed optimized code |
| --- | --- |
| axpy_may_alias | 8- and 4-wide float operations; runtime vector.memcheck; vaddps/vmulps. |
| axpy_noalias | 8- and 4-wide float operations without overlap version checks. |
| axpy_opaque_call | Scalar call remained; no float vector operations, even though the declaration had memory(none), nounwind and willreturn. |
| axpy_visible_call | Always-inline helper eliminated; 8- and 4-wide float operations. |
| axpy_per_item_bounds | 8-wide safe prefix plus checked scalar boundary; vaddps/vmulps. |
| axpy_upfront_bounds | Validation before work, then 8- and 4-wide float operations. |
| sum_ordered | Scalar floating-point accumulation on this target. |
| sum_reassociate | 8- and 4-wide operations with reassoc nsz on the addition. |

AXPY used separate fmul and fadd with no fast-math flags. These results support
ordinary elementwise SIMD without blanket fast math. The reduction result is
specific to the tested target/pipeline, not a claim that all targets prohibit
ordered vector reductions. The upfront-check and per-item-check examples differ
on invalid-input partial effects; they are not claimed to be equivalent rewrites.
Raw-pointer validity and noalias are assumed in the independent probe; Tower still
needs to establish those conditions in its own implementation.

The initial exploratory Python -c invocation hit PowerShell/native argument
quoting that removed embedded string quotes. Re-running through a single-quoted
here-string passed over stdin resolved it; no compiler defect was inferred.

The raw probe files, results.json and generated .before.ll/.after.ll/.s artifacts
were written to the temporary directory:
C:/Users/trevo/AppData/Local/Temp/tower-vector-research-7f2146c0817f44448beff5a96ca2dd79.
That directory is disposable. The source is archived below so this entry does not
depend on its continued existence. To reproduce, save the archived source as
probe.py in a scratch directory, use llvmlite==0.46.0 and run python -B probe.py;
it writes generated files beside itself. This is a standalone compiler probe,
not a public Tower IR or program interchange format.

Also ran the existing suites from a temporary working directory:

```text
node --test --test-reporter=dot C:/Sandbox/tower/playground/tests/llvm-execution.test.mjs C:/Sandbox/tower/playground/tests/structs.test.mjs
```

Both suites completed with exit code zero using existing built WASM artifacts.
The inspected WASI host uses memory files, not host filesystem writes. No rebuild
was performed, so this is validation of the available artifacts against those
suites, not a fresh build of every current source file. Repository status before
and after the research was unchanged; pre-existing modifications were retained.

### Proposed independently testable milestones

| Milestone | Acceptance evidence |
| --- | --- |
| Memory views and access contracts | Overlapping readers accepted; conflicts rejected; splitting, lifetimes and canonical round trips verified. |
| Single-thread CPU bulk operations | Map, in-place map and stencil loops compared with equivalent Clang output using matching semantics/target settings. |
| Function specialization and math | Helpers preserve eligible vectorization; unsupported calls explain the failure. |
| Vector values and layout adapters | Vectors work in ordinary functions; AoS/SoA layout and address/copy semantics are checked. |
| GPU independent kernels | Corresponding map/stencil kernels validate and execute through SPIR-V and WGSL paths, with DXIL covered by its target work. |
| Reductions and cooperative execution | Ordered/reproducible/relaxed policies tested; CPU reference execution covers group context and barriers. |
| Jobs | Dependencies, resource lifetimes, cancellation and chunk execution tested independently of GPU integration. |

Prioritize a single-threaded checked buffer map producing code comparable to Clang,
including when arithmetic is factored into ordinary helpers. That tests the memory,
function and numeric primitives before requiring a scheduler. Expand benchmarks
with lengths around vector boundaries, overlap cases, alignment, branches,
read-neighbor stencils, reductions and forced baseline/fallback variants. Compare
under equivalent defined semantics; do not benchmark C undefined behavior against
Tower checks and attribute the difference to poor code generation.

For each public primitive or declared contract, require a compilable foundation
spelling, components on the existing entities, shared validation, interpreter
behavior and formatter support. Proven analyses may remain derived/recomputed;
user-selected numerical/context policies and semantic permissions must survive
canonical source round trips. Rich map/iteration/layout syntax can be Tower rules
above those operations. Do not extend the provisional as-style highlighting
clause into a general attribute design without revisiting that design explicitly.

Outstanding design work includes exact view/borrow APIs, region identity and escape
rules, parameterized types/function specialization, numeric profiles, failure
policies, explicit address spaces/resources, target legality, reflection-driven
layout adapters and performance-expectation syntax. These are follow-up choices,
not claimed implemented features. Long-term absorption of LLVM/Binaryen/SPIR-V
machinery should preserve these same contracts and retain upstream/reference
comparison tests.

### Archived standalone LLVM probe

The following is the exact probe source used for the reported code-generation
trial (UTF-8 BOM omitted). It is included for reproducibility, not as proposed
Tower foundation syntax.

<details>
<summary>Python source for the eight LLVM vectorization probes</summary>

```python
from pathlib import Path
import json, re
from llvmlite import binding as llvm

out = Path(__file__).resolve().parent
llvm.initialize_native_target()
llvm.initialize_native_asmprinter()
tm = llvm.Target.from_default_triple().create_target_machine(cpu='haswell', opt=3)
pto = llvm.create_pipeline_tuning_options(speed_level=3)
pto.loop_vectorization = True
pto.slp_vectorization = True
pb = llvm.create_pass_builder(tm, pto)

def axpy(name, noalias=False, call=None, checks=None):
    attr = 'noalias' if noalias else ''
    extra = ', i64 %len' if checks else ''
    pre = ''
    entry_target = 'header'
    if checks == 'upfront':
        pre = '''%valid = icmp ule i64 %n, %len
  br i1 %valid, label %header, label %bad
bad:
  call void @llvm.trap()
  unreachable
header:
'''
    body = '''%xp = getelementptr float, ptr %x, i64 %i
  %yp = getelementptr float, ptr %y, i64 %i
  %xv = load float, ptr %xp, align 4
  %yv = load float, ptr %yp, align 4
'''
    if call:
        body += '  %v = call float @point(float %xv, float %yv, float %a)\n'
    else:
        body += '  %product = fmul float %xv, %a\n  %v = fadd float %yv, %product\n'
    body += '  store float %v, ptr %yp, align 4\n'
    incoming = 'header' if checks == 'upfront' else 'entry'
    latch = 'work' if checks == 'per_item' else 'loop'
    check = ''
    if checks == 'per_item':
        check = '''%valid = icmp ult i64 %i, %len
  br i1 %valid, label %work, label %bad
bad:
  call void @llvm.trap()
  unreachable
work:
'''
    text = f'''define void @{name}(ptr {attr} %y, ptr {attr} %x, float %a, i64 %n{extra}) {{
entry:
  {pre}%empty = icmp eq i64 %n, 0
  br i1 %empty, label %exit, label %loop
loop:
  %i = phi i64 [0, %{incoming}], [%next, %{latch}]
  {check}{body}  %next = add i64 %i, 1
  %done = icmp eq i64 %next, %n
  br i1 %done, label %exit, label %loop
exit:
  ret void
}}
'''
    if checks:
        text += 'declare void @llvm.trap() cold noreturn nounwind\n'
    if call == 'opaque':
        text += 'declare float @point(float, float, float) nounwind willreturn memory(none)\n'
    if call == 'inline':
        text += '''define internal float @point(float %x, float %y, float %a) alwaysinline nounwind memory(none) {
  %m = fmul float %x, %a
  %r = fadd float %y, %m
  ret float %r
}
'''
    return text

def reduction(name, relaxed=False):
    flags = 'reassoc nsz ' if relaxed else ''
    return f'''define float @{name}(ptr %x, i64 %n) {{
entry:
  %empty = icmp eq i64 %n, 0
  br i1 %empty, label %exit, label %loop
loop:
  %i = phi i64 [0, %entry], [%next, %loop]
  %sum = phi float [0.0, %entry], [%r, %loop]
  %p = getelementptr float, ptr %x, i64 %i
  %v = load float, ptr %p, align 4
  %r = fadd {flags}float %sum, %v
  %next = add i64 %i, 1
  %done = icmp eq i64 %next, %n
  br i1 %done, label %exit, label %loop
exit:
  %result = phi float [0.0, %entry], [%r, %loop]
  ret float %result
}}
'''

cases = {
 'axpy_may_alias': axpy('axpy_may_alias'),
 'axpy_noalias': axpy('axpy_noalias', True),
 'axpy_opaque_call': axpy('axpy_opaque_call', True, 'opaque'),
 'axpy_visible_call': axpy('axpy_visible_call', True, 'inline'),
 'axpy_per_item_bounds': axpy('axpy_per_item_bounds', True, checks='per_item'),
 'axpy_upfront_bounds': axpy('axpy_upfront_bounds', True, checks='upfront'),
 'sum_ordered': reduction('sum_ordered'),
 'sum_reassociate': reduction('sum_reassociate', True),
}
results = []
for name, ir in cases.items():
    m = llvm.parse_assembly(ir)
    m.triple = llvm.get_default_triple()
    m.data_layout = str(tm.target_data)
    m.verify()
    (out / (name + '.before.ll')).write_text(str(m))
    pm = pb.getModulePassManager()
    pm.run(m, pb)
    m.verify()
    optimized = str(m)
    assembly = tm.emit_assembly(m)
    (out / (name + '.after.ll')).write_text(optimized)
    (out / (name + '.s')).write_text(assembly)
    widths = sorted(set(re.findall(r'<(\d+) x float>', optimized)))
    results.append(dict(case=name, float_vector_widths=widths,
        alias_version_check='vector.memcheck' in optimized,
        vector_fp_ops=len(re.findall(r'\b(?:fadd|fmul)\b[^\n]*<\d+ x float>', optimized)),
        packed_x86_ops=sorted(set(re.findall(r'\b(?:v?addps|v?mulps|vfmadd\d+ps)\b', assembly))),
        scalar_point_call=bool(re.search(r'call float @point', optimized))))
summary = dict(llvm=llvm.llvm_version_info, triple=llvm.get_default_triple(), target_cpu='haswell', optimization='O3, loop+SLP vectorization enabled', kind='code-generation probes, not performance benchmarks or Tower lowering', results=results)
(out / 'results.json').write_text(json.dumps(summary, indent=2))
print(str(out))
print(json.dumps(summary, indent=2))
```

</details>

## 2026-11-17 - Self-host Tower and retire the custom C++ implementation

The user wants all of Tower's own compiler/runtime implementation moved into
Tower, retaining LLVM and other external dependencies where still needed. This
includes compiling and linking against those libraries to produce native
executables and WebAssembly output. Treat self-hosting as the next major direction;
deleting the current implementation is the end of a verified migration, not its
first step. This entry records discussion and a proposed sequence, not newly
implemented language features or a claim that self-hosting already works.

### Current implementation and gaps

Inspected scaffolding/foundation.tower, core.hpp, tower.hpp, lex-pattern.hpp,
llvm-backend.cpp, syntax.cpp, the browser LLVM host, CMakeLists.txt and the vendored
LLVM-C/LLD headers. Functions, mutable locals, structured control flow, typed
checked pointers and nominal structs already work. Shared CoreNode/SyntaxNode
components and the common formatter are the representation to preserve.

The executable scalar set is currently i32/u32/bool/void plus structs. Dynamic
buffers, source-language strings, indexed collections, heap allocation, general
module imports, external function declarations and public language-level node
construction/reflection are missing. The existing String token is a lexical
facility, not an executable string value type. C++ collections currently provide
the compiler's growing arrays, strings, maps and ownership infrastructure.

The browser backend already lowers Tower to an object and calls lld::wasm::link
to produce executable WebAssembly. General external-library linking is not
exposed by Tower: the current host admits only print/trap imports, functions have
Tower-private calling details, and the build only enables the WebAssembly LLVM
target. Native executable output needs explicit target configuration, object/ABI
support, entry/startup handling and required runtime/system libraries.

Checked Tower pointers are allocation/cell references with lifetime metadata,
not C addresses. The reflected portable struct layout is also distinct from
checked execution storage and a target C ABI. Casting current handles to a C
pointer would be incorrect. External calls need typed signatures, explicit target
calling conventions/layout, ownership/lifetime rules and deliberate conversion
between Tower storage and foreign buffers/opaque handles.

### Recommended work sequence

1. Implement compiler-usable storage: byte values, bounded typed arrays/views,
   indexed access, dynamic allocation and release, defined initialization/copy
   behavior and lifetime checks. Use contiguous value storage with separate
   checking metadata where practical; do not make the current fixed checked-cell
   pool the permanent compiler heap. Define growth and invalidation explicitly.
   Add wider integers as required by handles, hashing and ABI sizes, without
   accidentally making strict arithmetic depend on the host pointer width.
   Build strings, growable collections and lookup tables as Tower library code.
   A complete generic/type-inference system is not a prerequisite for the first
   concrete byte and node collections. These facilities also advance the earlier
   buffer/numerical-kernel direction; they should share one implementation.

2. Add general external declarations/exports and link inputs on the same semantic
   nodes, with canonical foundation formatting. First prove scalar calls in both
   directions, then a pointer-plus-length buffer call with correct lifetimes and
   a defined mutation policy. Test an actual compiled C fixture, not just a JS
   mock. Use status/result values rather than requiring exceptions. The portable
   interpreter needs registered implementations for foreign operations; it cannot
   execute arbitrary linked machine code itself. File I/O, allocation and other
   host services need explicit interfaces and effects. Foreign calls during strict
   compile-time execution must satisfy its determinism policy or be unavailable.

3. Generalize compilation/linking to explicit targets, objects, libraries,
   symbols and entry points. First static-link matching Wasm objects/libraries
   into one module, with explicit host imports; extend native output with the
   corresponding runtime/startup dependencies. Keep compiler-host and generated-
   program targets distinct. A native LLVM library cannot be linked into a Wasm
   compiler: the dependency must itself be built for that environment. Our
   existing LLVM-in-Wasm build is a useful starting point. Linking separately
   instantiated Wasm modules also needs deliberate memory/handle boundaries;
   memory offsets do not automatically transfer between their memories.

4. Move real implementation pieces across incrementally. A byte/UTF-8 utility
   used by the existing lexer is a small first migrated slice. Follow with Tower
   containers and the shared entity/component store, then formatting, lexical
   machinery, parsing and incremental grammar installation, replacements,
   resolution/type checking, interpretation and LLVM lowering. Exact order can
   follow dependencies. Expose/import functions and compiler entities through
   a real module system; migrate the current host-only Bedrock/Foundation order
   into that model. Do not copy into a parallel Tower AST or wrap every C++
   implementation and declare that self-hosting is complete. Preserve the same
   semantic node contracts and validate each replacement against the reference.

5. Close the bootstrap loop: the current C++ compiler builds the Tower-written
   compiler (stage 1); stage 1 builds that compiler again (stage 2); stage 2 builds
   stage 3. Compare canonical structures/text, diagnostics, execution results and
   defined traps, including malformed input and live grammar changes. Compare
   artifacts under pinned target/build inputs where reproducibility is promised;
   self-hosting alone does not prove bit-identical LLVM output or eliminate
   compiler bugs. Remove custom C++ from the normal build only after these gates.
   Preserve an archived seed compiler/build recipe for bootstrap recovery. A
   platform Wasm bootstrap executable is allowed target output, not a new public
   Tower binary graph/interchange format.

The first useful acceptance target is a Tower-written byte-processing/compiler
utility built by the existing compiler, called by the existing lexer, with
matching results through interpretation and compiled execution. Implement the
storage and foreign-call tests in small steps on the way to that target. Full
reflection/ECS ergonomics, shader support, temporal minimal rebuild and backend
translations are not prerequisites for this first migration. Preserve identities,
provenance and explicit inputs so self-hosting does not obstruct those goals;
self-hosting alone does not provide dependency tracking or minimal rebuild.

### Third-party boundary and bootstrap seed

LLVM provides a C API for IR construction, passes and object emission, including
LLVMTargetMachineEmitToMemoryBuffer; the functions needed for the initial path
are present in this vendored checkout. Tower can call that API without acquiring
a complete C++ class/template ABI. LLVM does not compile arbitrary C++ source;
use Clang/the existing dependency builds to build third-party objects/libraries.
See [LLVM-C](https://llvm.org/doxygen/group__LLVMC.html) and
[target emission](https://llvm.org/doxygen/group__LLVMCTarget.html).

The current LLD entry is C++, using LLVM containers/streams. A small bridge we
own is a practical temporary external-dependency adapter; it is still custom
C++ and must not be presented as literally zero custom C++. Native builds can
alternatively invoke the linker executable; browser workers need an embedded
or imported callable linker interface. If literal removal includes all adapter
code, replace that boundary as a later explicit milestone. LLD handles native
and Wasm object linking; Wasm imports/exports/memory must be configured explicitly.
See [LLD embedding](https://lld.llvm.org/) and
[Wasm linking](https://lld.llvm.org/WebAssembly.html). Current upstream docs describe
newer versions; local headers/source were checked for the APIs discussed here.

The initial grammar is still needed after C++ disappears. Its construction,
scanner primitives and per-declaration update machinery can themselves be Tower
code compiled into the compiler, loading the same Bedrock/Foundation source.
This resolves bootstrapping through an earlier compiler; it does not remove the
need for a starting reader or introduce a hidden grammar serialization format.

Validation for this discussion: repository/header inspection and primary-source
documentation review only. No compiler behavior changed and no builds or test
suites were run. todo.txt was not modified.

### Pointer-representation clarification

The user expected ordinary address-valued pointers and asked what the checked
representation means. Verified core.hpp, CoreMachine::address/dereference and
the LLVM backend: source-level T* currently stores a cell index, lifetime
generation and display-name ID. Dereferencing resolves the indexed cell and
checks its active generation; reads also check initialization. LLVM currently
lowers this to a tower.pointer aggregate of i32/i64/i32, not a plain LLVM ptr.
This is an implementation choice in the current prototype, not evidence that
the user requested handles as Tower's permanent pointer representation. Native
TowerNode* pointers used inside the C++ compiler are a separate matter. No new
pointer design or semantic change was selected by this clarification.

## 2026-11-17 - Foundation memory is raw; safety belongs above it

The user explicitly rejected checked handles as the foundation pointer model:
the low level must provide raw pointers and raw memory access, with the eventual
safe Tower language implemented in layers above it. This supersedes the earlier
checked-pointer/field-lifetime requirements and the assumption that compiler-
usable storage must first provide mandatory runtime lifetime/initialization
checks. Updated AGENTS.md and docs/foundation.md to preserve that decision.

Foundation T* is a target address value, without a cell index, generation or
display-name payload. Address-taking, loads and stores lower to direct target
memory operations. Size/alignment and field placement come from an explicit
target layout. The current reflected 24-byte checked-pointer profile and
separate checked scalar-cell storage must both be replaced; simply removing
the guard calls would leave the wrong representation in place. Typed operands,
type resolution, explicit conversions and semantic validation remain useful
and do not require runtime memory safety.

Safe references/views, bounds checks, ownership/lifetime tracking and related
policies belong in Tower libraries/language layers over the raw foundation.
Optional diagnostic instrumentation can exist without making it the ordinary
pointer contract. An uninitialized foundation local is uninitialized storage;
the new direction does not promise either zero or the current runtime diagnostic.
No wholesale adoption of C++ undefined behavior, arithmetic changes or particular
invalid-access result was chosen. Those semantics and the strict compile-time
execution policy must be specified explicitly.

For compiled code, use ordinary target pointers. For an interpreter, raw guest
byte addresses can model the target memory space without exposing arbitrary
host C++ memory; address identity must not depend on hidden lifetime generations.
Wasm's linear-memory containment likewise is distinct from per-object bounds
or lifetime checks. A portable evaluator's explicit memory/target model remains
necessary for deterministic compile-time execution.

Inspected core.hpp, core-machine.cpp, core-nodes.cpp, llvm-backend.cpp and the
pointer/struct tests. The implementation currently checks generation, activity
and initialization and the tests explicitly require those traps. Next migration
must change interpreter storage, LLVM lowering, type/field layouts and tests
together. Validate valid aliasing, pointer-to-pointer values, pointer fields,
field offsets, captured assignment destinations and C ABI calls. Programs with
invalid raw memory use should not retain mandatory checked-handle diagnostics
as their foundation acceptance contract.

This turn changes the recorded requirements and migration tasks only; executable
behavior is still the checked prototype. No compiler build or execution tests
were run. Documentation diff checks passed; todo.txt was not modified.

## 2026-11-17 - Raw foundation memory, foreign calls and executable linking

### Scope and preserved baseline

Implemented the user's raw-pointer direction and the first three self-hosting
prerequisites: usable storage, foreign declarations/exports, and target object/
executable linking. The later request also authorizes browser-native cross
compilation. Stop before migrating existing compiler/runtime C++ into Tower.
The concrete Tower storage library is new client code exercising the primitives,
not a claim that any existing compiler subsystem has been ported.

Checkpoint commit 8571a8d preserves the complete previous checked-memory prototype
and playground before this migration. Future safe-layer research can inspect its
CoreCell/CoreSlot initialization flags, cell indexes, generations, field lifetime
logic, checked LLVM pointer aggregate, symbolic pointer printing and old tests.
Those representations/guards are removed from ordinary foundation execution.
Allocator bookkeeping and interpreter/Wasm execution-space containment remain;
neither is an implicit Tower object lifetime or bounds guarantee.

### Shared semantic model and raw storage

CoreNode components still enrich the parser entities, and the same formatting
engine emits compilable foundation code. New array/type/expression/statement
metadata lives on those entities. No binary Tower graph or public bytecode was
introduced. Native and browser LLVM compilation share llvm-engine.cpp rather
than maintaining independent lowering implementations.

Implemented u8/i64/u64/usize, fixed arrays, indexed places, raw pointer offsets,
equal-width pointer/integer reinterpretation, null, sizeof/alignof, UTF-8 string
literal data, typed alloc/realloc/free, overlap-safe byte copy and byte fill.
Integers wrap at their declared width; numeric conversion, division by zero and
signed division overflow retain explicit diagnostics/traps. Struct/array values
remain addressable aggregates; by-value copying/calling is deliberately not added.

Pointer/usize width comes from the explicit target: wasm32 uses four bytes;
the selected x64/ARM64 CPU targets use eight. Struct metadata and actual byte
storage now agree. LLVM receives ordinary ptr/alloca/load/store and byte GEPs
without inbounds assumptions; the interpreter uses unsigned target addresses
inside a byte arena. It never dereferences an arbitrary browser/host C++ address.
No slot identity/generation/name is encoded in a foundation pointer. Printing a
pointer prints its target address, which can differ between independent runners;
tests compare relationships rather than promising identical native addresses.

Uninitialized reads, dangling references, out-of-object access, invalid frees
and invalid bool representations are outside the portable valid-program contract;
there is no guaranteed result or safety diagnostic. The incidental initial zero
bytes of interpreter/Wasm memory are not language initialization semantics. A
future strict compile-time mode must define/instrument invalid access and control
foreign effects; the raw runtime does not yet provide that mode. This explicitly
limits current determinism claims rather than inheriting accidental host behavior.

### Allocation and new Tower library

Allocation overflow/failure returns null; failed realloc retains the previous
allocation. Realloc(nonnull,0) frees and returns null. Free(null) does nothing.
Successful realloc preserves the existing prefix and invalidates old views.
The Wasm runtime implements its own aligned allocator and coalescing free list;
the interpreter has independent allocation/free-list bookkeeping. Neither stores
safety metadata in pointer values. runtime.c supplies a small target runtime,
with our own WASI file/host bridge; no outside JavaScript shim was adopted.

library/storage.tower provides concrete byte buffers/string building, a resettable
16-byte-aligned arena and a growing open-addressed u32-to-i32 map. The library
checks allocation results and overflow, supports buffer self-append across realloc,
and preserves map entries during rehash. It needs explicit init/dispose and caller
ownership, has no generic collection/reflection framework or map deletion, and
does not promise automatic safety. Imports remain future work; tests concatenate
library/client source and also emit exported library objects.

### ABI, linking and browser targets

extern fn and export fn use ordinary function syntax and typed semantic nodes.
Raw scalar/pointer parameters and results use the selected C ABI. Structs cross
the boundary by pointer with target field offsets. The real C fixture exercises
integer widths, narrow/bool values, pointer identity, buffer mutation, strings,
struct-pointer layout and calls back into exported Tower. The interpreter instead
requires registered callbacks and exposes a fresh byte view to each host call;
it cannot directly execute machine-code library inputs. Cross-instance Wasm
offsets are not interchangeable. C++ classes/variadics/indirect callbacks, exception
propagation, shared-library loading and a general import system are not implemented.

towerc emits objects, LLVM raw/optimized text and linked executables; it accepts
explicit target triples, additional objects/archives, compiler/linker selection
and sysroots. Library mode omits tower_main and rejects executable top-level code.
The native driver still uses its build-time source checkout for grammar/runtime
files; it is not yet a relocatable installed SDK.

Browser exports add a disposable worker, target/output controls, local link-file
inputs and a download. Editing/cancellation terminates compilation/linking too,
and obsolete results cannot replace a new document. Regular interpreter and LLVM
Wasm execution remain parallel and independent. A larger lazy-loaded compiler
includes X86/AArch64 plus LLD ELF/COFF/MachO, while ordinary editing uses the smaller
WebAssembly-only reactor. Tiny target packs provide Linux syscall startup/memory,
Windows kernel32 imports and a macOS libSystem stub. They are not full SDKs;
third-party libraries must be built for the requested target with all needed
dependencies. Emitting/linking native code in a browser does not execute it there.

Sources checked: repository LLVM/LLD headers and test stubs;
[LLD embedding/cross-linking](https://lld.llvm.org/),
[Clang cross-compilation](https://clang.llvm.org/docs/CrossCompilation.html),
[MachO linker](https://lld.llvm.org/MachO/index.html).

### Debugging and validation during implementation

- Initial native build needed the installed LLVM version's TargetParser/Host.h
  and explicit Module include; fixed, then tested against installed LLVM 19.
- The byte layout changes the previous Outer example from 40 bytes/24-byte
  checked pointers to 20 bytes/four-byte pointers on wasm32. Updated assertions
  for the actual target layout rather than retaining checked-cell expectations.
- A malformed void-pointer index reached a node without a semantic component;
  added early error propagation in places/conversions/allocation/memory operations.
  Invalid source now reports a compile error before effects instead of aborting.
- Byte-offset trap reporting initially used expression starts; LLVM now retains
  the statement provenance used by the interpreter, restoring diagnostic parity.
- std::ofstream required fd_fdstat_set_flags in our WASI host. Implemented the
  supported append flag instead of importing a third-party shim.
- Kept a split Wasm free-list block in its original sorted position, preserving
  the allocator's coalescing invariant.
- The first macOS pack link reported missing dyld_stub_binder. Checked LLVM's
  MachO SDK fixture and added that libSystem export to our minimal description.
- Old pointer-lifetime/uninitialized trap tests were retired; valid raw aliasing,
  allocation, indexing, actual byte layouts, ABI fixtures and round trips replace
  those foundation acceptance expectations. The old implementation/tests remain
  available in the checkpoint for the future safe layer.
- 110 Node tests passed at the first integration checkpoint. The expanded raw
  storage suite then passed all 25 cases, including the Tower library, real C
  archive, separately linked Tower objects and explicit 32/64-bit compilation.
- Native Linux and Windows fixtures executed successfully, including exported
  callbacks and raw buffers. All five CPU runtime packs linked with installed
  LLD; x64 Linux/Windows and ARM64 Linux under QEMU printed 5, 84, 42. macOS
  execution is not validated here because no Mac is available.
- First full browser pass: 70/74 passed. Two assertions omitted the new Memory
  selector entry; corrected. The two long Foundation edit/reload tests hit their
  total 30-second timeout while the LLVM build saturated CPUs; raised only that
  multi-load scenario to 60 seconds, leaving per-operation expectations intact.
  Desktop/mobile export screenshots show all panes and controls within the viewport.

Environment: Windows PowerShell, WSL Ubuntu 24.04, WASI SDK 34, vendored LLVM
1e57ee22ca274b663eeb279fd86e7010a8441c99, installed clang/LLVM/LLD 19 for native
tests (target runtime C objects built with the available Clang). Reproduction
scripts are build-wasm.sh, build-llvm.sh, build-native.sh, build-targets.sh,
test-linking.sh, test-windows-linking.sh and test-target-packs.sh. Final cross-Wasm
linker validation/publication results will be recorded separately after completion.
todo.txt was not modified by this implementation task.

## 2026-11-17 - Shared calls, data-driven grammar scanners and build selection

### Direction and implementation

The user asked that Foundation operations look like function calls and share
their grammar. `print`, `alloc`, `realloc`, `free`, `copy`, `fill`, `sizeof`,
`alignof`, `convert` and `bits` now use the ordinary CoreCall/CoreArguments
productions. They are semantic built-in names, no longer literal lexer keywords.
One CoreBuiltin definition table supplies names, operation kinds and arities;
the shared formatter uses that table. Type-taking calls accept ordinary operand
syntax and pointer/array type suffixes, interpreted as types by the built-in's
signature. Both interpreters and LLVM consume the same augmented call nodes.
The old per-operation grammar spellings have been removed and examples migrated.
Built-in function names cannot currently be shadowed by a user function: allowing
that needs binding-qualified canonical spellings to preserve graph round trips.

GrammarPattern is now a contextual regex token in Bedrock, and GrammarTemplate
is an ordinary recursive grammar. The native pattern and balanced-brace scanners
and the prohibition on overriding their names were removed. Generic `when
expected` tokens consult the current LR ACTION table, without speculative parsing
or backtracking. Longest-match still applies; an eligible contextual token wins
an equal-length tie against an ordinary token that the current state cannot
accept. Ordinary keywords still win equal-length lexical ties. `[^'{' '}']` is
a generic terminal-set atom excluding those literal tokens; contextual tokens
are excluded from these sets unless explicitly referenced. GrammarCharacter is
an ordinary contextual fallback, active only where the template grammar permits.
These flags and exclusion terms are semantic components on the shared nodes and
serialize through the same formatter. Templates retain exact source envelopes,
including comments and provenance. The declaration handler currently extracts
the payload between single-character pattern/template delimiters; changing to
multi-character delimiters needs an explicit payload-capture contract.

An initial experiment emitted terminal sets as contiguous ranges. The existing
table builder treated overlapping range and singleton lookaheads as conflicting
even when they requested the same reduction. The implementation instead emits
singleton terminal alternatives at grammar-build time, using ordinary ACTION
entries at runtime. This preserves existing conflict detection and adds no
runtime search through possible grammar branches. Generic EOF diagnostics now
say `Unexpected end of input`, rather than exposing the `$` EOF notation.

The target picker is immediately left of Auto execute: Wasm enabled by default,
optional x86-64 and ARM64. Selected native architectures compile automatically in
disposable workers and show disassembly plus per-platform download links. Wasm
unchecked means no Wasm compiler/execution; the interpreter still runs. No
targets means only Tower instructions and interpreter columns. All visible lower
columns have equal widths. Native outputs are built, not executed by the browser.

The initial shared platform ABI is `platform_write(stream, data, length): i64`:
streams 1/2, bytes accepted or -1. Native runtimes and browser hosts implement the
same declaration. Browser output is a byte stream decoded across execution steps
so split UTF-8 sequences survive, with stdout/stderr combined in the playground.
Other platform services remain future work; this is not a complete OS library.
External imports can bind another instance's exported Wasm function directly
using `{wasm: function}`; a WebAssembly.Table may supply that function at binding
time. This does not implement source-level indirect/table calls. Sharing pointer
arguments across instances still requires an explicit common-memory arrangement.

### Forward declarations discussion (proposal, not implemented)

The user wants module-style forward references. Function/type name resolution
is distinct from syntax availability: known declaration grammar can parse a rule
name without knowing its definition. A future implementation could record
`parse A = B;` as unresolved, resolve it when B is encountered, and validate the
complete dependency closure before connecting A to an active parsing root.
The current implementation still rejects unresolved references immediately.

Do not prescan the remainder using a stale grammar: declarations may change the
declaration grammar itself. File order determines when definitions become active,
not an implicit tie-breaker for ambiguous LR actions. Incomplete rules may be
stored, but an active root cannot safely ignore an unresolved branch because it
could change matches or introduce conflicts. An unresolved edit to the declaration
reader must be rejected or placed in an explicit atomic grammar group read under
the previous grammar. Such groups and deferred rule resolution are proposals;
neither has been added in this change.

Validation outcomes and reproducible commands will be appended after the final
test/build/deployment runs. Earlier results describe earlier checkpoints and do
not by themselves validate these subsequent changes.

## 2026-11-17 - Forward grammar definitions and module symbol binding implemented

The user explicitly requested implementing the preceding forward-reference
proposal. This supersedes its proposal-only status above. Unreachable grammar
definitions may now refer to later parse or token definitions. A derived reverse
dependency index propagates missing names; incomplete definitions remain on the
shared semantic nodes but are omitted from executable parser tables. Once their
dependencies exist they join normal validation/table generation. Statement and
all three declaration roots must always have complete closures, including optional
branches. Activation errors show the chain, for example Statement -> A -> B.
At module completion, any remaining unresolved definition is diagnosed. A failed
activation does not publish a new grammar revision. Existing pinned sessions keep
their own definitions. Forward declarations do not weaken ambiguity, nullable
repetition, nonproductive-cycle or duplicate-capture validation.

The declaration reader continues using the grammar current at each boundary.
A test defines A using `parse`, changes GrammarDeclaration's keyword to `rule`,
then defines B and activates A using `rule`. No prescan or reparse of earlier input
is involved. Atomic grammar groups remain unimplemented. Foundation's earlier
workaround was removed: CoreCallArgument again directly lists CorePointerArgument
before its definition. Parser inspection marks unresolved definitions `(pending)`.

Module type/function headers already resolved before bodies; added complete
module variable binding before checking executable statements. Functions can
access module variables declared later. Top-level variables use module storage
(LLVM globals; explicit fixed offsets in interpreter memory), while block/function
locals retain their lexical scopes and stack allocation. Initializers/effects
still execute in source order. Forward lookup does not imply initialization;
uninitialized reads retain the raw Foundation contract. The shared declaration
node carries the storage classification, and its placement at module scope is
the canonical text spelling. Round-trip structural checks include that flag.

Tests cover indirect missing chains, later token definitions, mutual grammar
references with a productive base, replacing an unresolved definition, rejection
at activation/EOF, declaration syntax changes, explicit conflict reporting,
forward types/functions/module variables, local shadowing and initialization
order. The initial token-forward test used `/hello/`, which ties the earlier
Identifier token under existing lexical precedence; it was corrected to
`/@hello/` to test forward resolution independently of token priority. An older
negative test forbidding a function from reading a module variable was updated
to use a block-local variable, which remains correctly inaccessible.

## 2026-11-17 - Integration validation and return-capture correction

The native forward-module fixture exposed a previously untested return case:
`return state.value;` was looking up the literal name `state.value`. CoreReturn's
optional capture contains a list wrapper around CoreOperand; scalar names had
worked accidentally through concatenated token text. The compiler now extracts
exactly one CoreOperand from that capture before semantic resolution. Added
field/index returns from later module variables to interpreter, LLVM, canonical
round-trip and native sanitizer coverage. The native fixture now prints 42.

Final local validation on Windows and WSL Ubuntu 24.04:

- Rebuilt the parser reactor, both LLVM reactors and native towerc using
  `bash playground/scripts/build-wasm.sh`,
  `TOWER_BROWSER_CROSS=ON bash playground/scripts/build-llvm.sh`, and
  `bash playground/scripts/build-native.sh`; then `npm run build` in playground.
  Keep CROSS enabled in this shared cache to avoid rebuilding LLVM target headers
  when switching between the two reactor targets.
- Full Node run covered 132 tests: 130 initially passed. Two old assertions
  expected unused forward rules to fail immediately and functions to reject
  module variables. Updated them to test incomplete active roots and inaccessible
  block locals. The affected llvm-execution/wasm files then passed 36/36.
- After the return fix, `node --test --test-concurrency=2` over
  forward-references, execution, llvm-execution and cross-compilation passed
  42/42 (53.8 seconds). Cross tests check all six targets, executable signatures,
  actual disassembly, deterministic repeated linking and recovery after failures.
- `bash playground/scripts/test-native-core.sh` passed 2/2 under Linux ASan and
  UBSan (96.36 seconds), including the new module return round trips.
- `bash playground/scripts/test-linking.sh` passed: native interpreter/executable
  parity, C static archives, exported callbacks, separately linked Tower objects,
  native-to-Wasm output, storage library, actual LLVM C API, platform_write and
  forward module functions/types/variables. `test-windows-linking.sh` also passed.
- Browser-built Windows x64 and Linux x64 memory executables printed 5, 84, 42;
  the browser cross-compiler's ARM64 Linux artifact ran under qemu-aarch64 with
  those values plus its explicit eight-byte pointer-size check. macOS x64/ARM64
  link/disassembly are verified; execution still requires a Mac and is unverified.
- Full desktop/mobile Playwright run passed 66/76. Nine failures were stale
  call/diagnostic test expectations or a cold-load timeout during concurrent
  native/ASan work; one assumed the interpreter error column was horizontally
  visible on a 320-pixel screen. Updated obsolete syntax tests, used a real
  replacement when testing editable Foundation now that print is an ordinary
  call, and scrolled the equal-width result columns for the visibility assertion.
  `npx playwright test --last-failed --workers=1` passed all 10 affected cases
  (2.2 minutes); the cold-load case passed unchanged. No production workaround
  or blanket timeout increase was added for these failures.
- Viewed desktop, phone and ARM disassembly screenshots. Lower columns have equal
  widths and the page stays within the viewport; narrow screens scroll inside
  the result area. Native targets build automatically and place per-platform
  downloads beneath disassembly. Cancellation and editing reject stale results.

The final static build contains a 4,276,722-byte parser reactor,
68,153,556-byte Wasm-only LLVM reactor, and a 17,268,630-byte gzipped native-target
reactor, loaded only for native compilation. Native startup packs are separate
small assets. These sizes are this build's measurements, not size guarantees.

Publication and online verification follow as a separate entry. Existing custom
C++ compiler subsystems have not been ported to Tower; this completes the raw
storage/linking prerequisites and the subsequently requested grammar/call/module
changes. Full OS services, general imports, local type inference, indirect calls,
atomic grammar groups and strict compile-time memory/effect policy remain future
work. Concurrent ECS/bulk-analysis notes and todo.txt are outside this commit.

## 2026-11-17 - Published cross-target playground and verified online

Pushed implementation commit f3a24ac and its preserved baseline checkpoint to
master. Published the tested static build as gh-pages commit 7651ec5. GitHub's
[Pages deployment run](https://github.com/TrevorSundberg/tower/actions/runs/44197623712)
completed successfully. The live playground is
[trevorsundberg.github.io/tower](https://trevorsundberg.github.io/tower/).

Ran `node playground/scripts/verify-deployment.mjs
https://trevorsundberg.github.io/tower/` against the public site. All 19 checked
assets (compiler reactors, application/workers, grammar and target packs) match
the local build byte-for-byte by SHA-256. Desktop Chromium and Pixel 7 emulation
both passed: later function/type/module-variable bindings, a struct-field return,
interpreter/Wasm agreement, editable incremental Bedrock, empty-literal inline
errors, Foundation upgrade/persistence, Restore/reload, equal result columns,
automatic native builds and platform downloads. No browser page errors occurred.
The same script passed against the local server before publication.

Saved and visually inspected desktop/phone screenshots of the live native-target
view. Downloaded Windows x64 and Linux x64 executables in both browser profiles;
all four executed locally and printed 5, 84, 42. macOS output remains link-verified
only. Reproduction report, SHA-256 values, screenshots and downloaded outputs are
in ignored `build/deployment-verification/`; the online log is
`build/online-deployment-verification.log`. Source and deployment branches are
pushed. Existing C++ subsystems remain in place for the next migration discussion.


## 2026-11-17 — Compiler reuse, end-to-end profiling, disassembly panels and formatting contracts

Implemented after reports that initial file opening, highlighting, Tower instructions
and Wasm execution had become slow. Follow-up requests added a Wasm disassembly
column/download footer, explicit execution-column names, declaration spacing and
enforced formatting for every bundled Tower source file.

### Root cause and compiler lifetime

- The largest initialization cost was disabled parser tracing. `parser_trace`
  returned early inside its function, but C++ had already evaluated its arguments:
  LR-state `debug_str` calls, stringstreams and number/string formatting. A Node
  CPU profile of the actual parser Wasm showed these dominating initialization.
  Guarding the call site avoids all argument evaluation when tracing is disabled.
  A regression counts display-name callbacks during table construction and requires
  zero callbacks without tracing/errors. Tracing itself remains available.
- An isolated Wasm probe before the fix measured instantiate 3.55 ms, WASI init
  0.45 ms, Bedrock 46.83 ms and Foundation 1509.09 ms. With the guard, the same
  probe measured about 4, 0.48, 21.82 and 176.88 ms respectively. Foundation built
  38 grammar revisions within the 64-entry cache; this was not cache thrashing.
- Completed interpreter and LLVM/Wasm workers now retain compiler instances and
  grammar state. Optional x86/ARM workers use the same worker-local loader and
  retain their cross compiler and target runtime inputs as well. Parsing already
  had its own retained worker. There is one idle worker per enabled backend, not
  one concurrently mutated Wasm instance shared between threads. Every execution
  still gets fresh program memory; grammar edits reconfigure the retained frontend.
- Active cancellation or editing during work terminates only active workers,
  including synchronous LLVM work or compiled infinite loops. Host failures discard
  the failed worker. Unchecking a target releases its idle compiler. Normal program
  completion/error can reuse valid compiler state; stale IDs remain rejected.
- Opening a file runs immediately after parsing. Ordinary typing retains the
  intentional 120 ms coalescing delay. No parser/backtracking algorithm changed.

### Compiler optimization and transfer size

Verified the actual LLVM Wasm CMake cache: Release, `-O3 -DNDEBUG`, LLVM assertions
OFF, LTO OFF. The build script now explicitly specifies assertions OFF. This is
the optimization of LLVM's own C++ code compiled into Wasm, separate from the O2
pipeline applied to Tower programs. Tower's development assertions remain enabled.
The native compiler is Release/O3; installed LLVM 19 reports RelWithDebInfo with
assertions OFF. The browser uses the pinned LLVM source at
`1e57ee22ca274b663eeb279fd86e7010a8441c99`, WASI SDK 34.

Normal LLVM was also shipping its large name/debug sections unstripped. It now
uses llvm-strip and a gzip asset decoded in the worker (or accepts already decoded
HTTP content). Before: 68,153,556-byte raw compiler. Final compiler including Wasm
disassembly: 51,753,116 bytes raw, 15,468,564 bytes gzipped. Static hosts need no
special Content-Encoding setup. The uncompressed artifact remains available.

### Measurements and reproduction

Windows Chromium through Playwright, localhost Node static server, desktop
1440x1000 and Pixel 7 emulation (not physical-phone CPU measurements). Compare
old deployed build `gh-pages` 7651ec5 on port 4175 against the current build on
4173, using the same Node server and `profile-execution.mjs`. Each device opens
Execution, Functions and Memory once, edits a tiny print program five times, then
types comments with execution disabled. Final profile includes the new disassembly
panel and formatted files. DOM updates are measured, not physical display latency.

| Desktop phase | Before | Final |
| --- | ---: | ---: |
| Navigation to first highlighting | 1287 ms | 284 ms |
| Navigation to first Tower instructions | 2662 ms | 435 ms |
| Navigation to both backends finished/matching | 4248 ms | 944 ms |
| Open Execution: both finished | 3002 ms | 142 ms |
| Open Functions: both finished | 3150 ms | 77 ms |
| Open Memory: both finished | 2917 ms | 98 ms |
| Median edit to both finished, including debounce | 2713 ms | 154 ms |

Mobile emulation first completion went from 3874 ms to 867 ms; warm file opening
finished in 80–143 ms and median edit completion was 147 ms. The earlier matched
before/after run measured grammar-only typing around 17 ms for Memory and 26 ms
for Foundation in both builds: the major regression was initialization/repeated
compiler boot, not warm lexer updates. Warm tiny-program LLVM compile was about
8–9 ms; actual Wasm execution generally below 1 ms. Warm loads report zero or near
zero and tests assert no repeated compiler or target-pack requests across runs.

Native measurements use fresh Linux/WSL processes (Orchestral-Revng, Ubuntu 24.04),
five samples per fixture, including process creation and generated executable
execution. Before/after trace fix: Memory interpretation 1003→142 ms, executable
compilation/linking 1175→368 ms, object emission 1016→153 ms. Functions: 971→126,
1216→328 and 979→136 ms respectively. Native executable startup/execution remained
about 4 ms. The new `towerc --timings` reports bootstrap, compilation, LLVM phases,
runtime C compilation, linking and interpretation separately on stderr. Remaining
Memory costs were about 95 ms bootstrap, 30 ms frontend/LLVM, 68 ms compiling the
runtime C shim and 149 ms external linking. LLVM optimization itself was about
7 ms. No persistent native compiler daemon or target/toolchain runtime-object
cache was added; those require explicit identity/lifetime design.

Commands (from repository root unless noted):

```text
node --cpu-prof --cpu-prof-dir=build --cpu-prof-name=grammar.cpuprofile build/profile-grammar.mjs
wsl -- bash -lc 'cd /mnt/c/Sandbox/tower && bash playground/scripts/build-wasm.sh'
wsl -- bash -lc 'cd /mnt/c/Sandbox/tower && TOWER_BROWSER_CROSS=ON bash playground/scripts/build-llvm.sh'
npm run build --prefix playground
cd playground
node scripts/profile-execution.mjs ../build/perf-publish-final.json
TOWER_PROFILE_URL=http://127.0.0.1:4175/ node scripts/profile-execution.mjs ../build/perf-before-final.json
cd ..
wsl -- bash -lc 'cd /mnt/c/Sandbox/tower && bash playground/scripts/build-native.sh'
wsl -- bash -lc 'cd /mnt/c/Sandbox/tower && python3 playground/scripts/profile-native.py build/native/towerc build/perf-native-publish.json --timings'
```

The URL environment assignment above uses POSIX syntax; in PowerShell use
`$env:TOWER_PROFILE_URL = 'http://127.0.0.1:4175/'`. Profiling helpers/reports under
build are local artifacts. The reusable browser/native profiling scripts are
tracked. An initial old-build comparison using a WSL Python server was rejected:
its server/startup costs differed from the Node server. Final comparisons use the
same server implementation. Earlier cold figures measured from DOMContentLoaded;
the final table includes navigation and script loading. These are fixture-specific
measurements, not an instant-compile guarantee for arbitrary input/network/hardware.

### Wasm disassembly and controls

Wasm now has a separate equal-width disassembly column with the same download
footer layout as x86/ARM. It and Wasm Execution follow the Wasm target checkbox;
unchecking all targets leaves Tower instructions and Interpreter Execution. Names
are now exactly Interpreter Execution and Wasm Execution. Disassembly text scrolls
without wrapping instructions. Steps/timings remain in the shared bottom status area.

The existing C++ disassembler uses LLVM's Wasm object reader and instruction decoder
on the actual linked module, including runtime/link-input functions. Function-body
lengths and local declarations are not mistaken for instructions. Printed addresses
are Wasm file offsets, function labels include indices/names. The same instruction
rendering/2 MiB display limit serves native targets. Tests require all generated
Wasm instructions in the execution corpus to decode without `.byte` fallbacks.

### Shared formatter and built-in source enforcement

The common Formatter now separates functions/structs from adjacent constructs with
one blank line, keeps ordinary statements grouped and uses consistent four-space
indentation. Empty blocks use `{}`. Grammar alternatives wrap at alternative
boundaries; replacement clauses go on a continuation line. The native Bedrock seed
and checked-in bedrock.tower continue to be exact common-formatter equivalents.

Source formatting now accepts complete mixed documents, not only declarations.
It obtains original parse nodes before replacements during an opt-in pass over the
session's pinned baseline/cache, then uses the same formatting engine with parsed
token roles and lexer-derived comment spans. It does not expand foreach/macros in
the saved source or copy extra trees on the live parsing path. Comments and literal
spellings are retained; replacement template text keeps its own language/trivia.
Generated canonical executable output still omits source comments; propagating
comments onto expanded executable nodes is not implemented by this change.

Because user grammars can assign different meaning to whitespace/punctuation,
formatted source is reparsed with the same baseline, and original parse trees and
grammar semantics must match. Incompatible layouts return an explicit error rather
than silently altering the source. This validation is not a universal formatting
policy for every possible future user language. A malformed test initially tried
to use an address expression directly as a foundation call argument; it was corrected
to a named pointer, keeping the instruction-like operand rules. Earlier tests that
expected declaration-only formatting errors were updated to the implemented mixed
document behavior, not relaxed to ignore errors.

`npm run check:format --prefix playground` recursively checks every `.tower` file
under scaffolding (16 current modules/examples/test programs). Each must equal the
formatter output, formatting twice must be stable, and statement trees/final lexical
and grammar rules must survive. `npm run format:tower --prefix playground` writes
the style. The normal Node test suite enforces the same contract. Historical legacy
migration fixtures outside scaffolding intentionally keep their old spelling.

Validation before publishing: 136/136 Node tests, 78/78 desktop/mobile Playwright
tests, 2/2 ASan+UBSan native tests, native executable/object/archive linking,
native-to-Wasm, buffers/arena/map, real LLVM C API linking, platform_write and forward
module declarations. Browser tests cover retained workers/fresh program memory,
grammar reconfiguration, target-pack reuse, cancellation/stale replies, target
visibility, downloads/disassembly and viewport sizing. Final static deployment
verification and online results are recorded separately below.


### 2026-11-17 — Published and verified

Source changes pushed as `751e824`; tested static artifacts pushed to gh-pages as
`b6e4947`. GitHub Pages deployment
[44202605335](https://github.com/TrevorSundberg/tower/actions/runs/44202605335)
completed successfully. Ran:

```text
node playground/scripts/verify-deployment.mjs https://trevorsundberg.github.io/tower/
```

All 20 remote assets matched local SHA-256 hashes, including both LLVM assets,
the cross compiler and target support packs. Desktop and mobile browser checks
passed: matching execution, forward module bindings, editable/incremental grammar,
legacy-module migration, persistence, native platform downloads, equal columns and
no page errors. Screenshots/report are under build/deployment-verification.
The shared download-footer layout and non-wrapping Wasm disassembly were also
inspected in the final screenshots.

An additional real-network profile (`TOWER_PROFILE_URL` set to the public URL,
`profile-execution.mjs`) measured fresh-page completion at 7.35 seconds desktop and
3.21 seconds mobile emulation. LLVM fetch/decompress/instantiate/bootstrap accounted
for 5.86 and 2.31 seconds respectively; compile was about 152 ms on its first run.
Warm edits finished around 159/162 ms median, including the 120 ms debounce.
First example selections ranged 259–350 ms desktop and 121–175 ms mobile emulation,
including source-file fetches. This explicitly supersedes any interpretation that
the 0.94-second localhost cold result promises subsecond first visits online:
the 15.47 MB LLVM transfer remains a cold-start cost, while retained workers avoid
it on subsequent completed runs. No public-network before/after comparison was
claimed. Demand loading/smaller backend assets and optional example prefetching
are future cold-network improvements; no compiler code was moved into Tower here.

Added `*.tower text eol=lf` to .gitattributes after noticing this Windows checkout
uses core.autocrlf=true. Canonical output uses LF, so fresh checkouts must preserve
LF for byte-for-byte formatter enforcement. Checked Git's effective attributes
for Bedrock, Foundation and nested library files; this is a repository-only change
and does not alter the already verified deployed artifacts. Source formatting
retains comments; generated canonical executable instructions still omit source
comments until provenance/comment propagation is implemented.


## 2026-11-17: trailing typing debounce, stable diagnostics, document identity and honest timings

The user requested a small debounce that resets on every key, applies to errors
as well, retains current results until replacements arrive, and preserves the
recent warm-worker speedups. They also reported that reloading Execution could
show ForEach in the picker while retaining Execution's source, requested pipeline
ordering and explicit cache labels for timings, and asked for more consistent
control spacing. This entry supersedes the earlier policy of parsing every frame
during continuous typing and waiting another 120 ms before auto execution.

Research (primary sources consulted):

- Algolia recommends a 200 ms autocomplete debounce and says delays above 300 ms
  worsen perceived responsiveness:
  https://www.algolia.com/doc/ui-libraries/autocomplete/guides/debouncing-sources
- jQuery UI's autocomplete delay defaults to 300 ms:
  https://api.jqueryui.com/autocomplete/#option-delay
- CodeMirror documents 100 ms for activate-on-typing completion and 750 ms for
  linting: https://codemirror.net/docs/ref/ . Different jobs use different delays;
  these are examples, not a universal editor standard.
- Aalto's 168,000-person typing study reported a mean 52 words/minute:
  https://www.aalto.fi/en/news/the-traits-of-fast-typists-discovered-by-analysing-136-million-keystrokes
  Using five characters per word gives an approximate 231 ms character interval.
  That arithmetic is an inference, not a measured distribution of coding pauses
  or a guarantee that all typists' bursts will be coalesced.

Decision/implementation: a single **250 ms trailing debounce** gates parsing,
highlight refresh, diagnostics and automatic execution. Each edit resets the
deadline. Auto execution follows a successful analysis immediately, without a
second debounce. File selection and explicit Execute remain immediate; IME
composition still defers automatic work. The one-request-in-flight/latest-pending
parser queue and retained compiler workers are unchanged. Editing cancels active
execution immediately and rejects obsolete replies; it does not delay cancellation.

Diagnostics no longer clear on each document transaction. Their source anchors
map through edits while the existing error card widget remains visible. New parse
or execution diagnostics replace it; a successful automatic run clears it after
the runners finish. Output, instructions and downloads similarly remain until
their replacement result arrives. Each architecture retires its old download URLs
when its new build arrives. Timing spans reuse DOM nodes instead of reconstructing
the full bar for every timing message.

The first regression run exposed a real retained-decoration bug: selecting all
and replacing source after an execution error could insert the error caret's
literal `▏` into the document. A captured local-storage record was
`"\nprint(42);▏\n"`, producing "No token rule matches source" and preventing a
cancelled infinite loop from restarting. The marker now has no text content and
uses a CSS border, with contentEditable=false. Focused cancellation/recovery tests
then passed; the test now also verifies the saved source remains exact. Keeping
the decorative text glyph was rejected. The reload test initially assumed a
cursor-to-end insertion preserved a particular final blank line; it was changed
to replace the document with a known exact edited source before reloading.

Persistence root cause: the old storage saved program text without its filename
or active module. Startup therefore defaulted the selector to ForEach independently
of that text. The new document record stores source, filename and selected module
together, flushing on pagehide as well as after a short save delay. Existing
Foundation/Bedrock edits remain in their established storage keys. Legacy exact
example matches recover their original name once; unmatched edited text becomes
scratch.tower rather than being mislabeled. A local filename gets a matching
picker option. Async file requests carry a generation ticket so an older download
cannot replace a newer selection. Refresh tests cover edited Execution, Foundation
and legacy Execution text; Restore still fetches the selected bundled file.

Timing correction: an initial suggestion to retain the original cold-load cost
was explicitly rejected by the user. No original measurement or timing history is
stored for display. getTower/getCompiler measure **this request's actual elapsed
time**, separately reporting whether installed runtime state was reused. A warm
lookup may correctly display `0.0 ms (cached)`. Timing order follows each backend's
pipeline: Tower load/compile/format/interpreter, LLVM load/parse/raw/optimize/emit/
link/disassembly/compile total/run, followed by selected native builds. Tooltips
explain parallel branches and that compile total includes its detailed phases.
The execution profiler now detects an actual instructions DOM update, since merely
seeing nonempty old instructions is no longer evidence that the new compile finished.

Shared `--control-gap: 8px` now controls Targets/Auto execute/Execute/Cancel,
file controls, link controls and panel-heading controls. Removed the Auto execute
label's one-off right margin. The checkbox-to-label gap remains smaller.

Validation environment: Windows PowerShell, Node/Playwright Chromium, local static
server http://127.0.0.1:4173/, existing optimized Tower/LLVM WASM assets. Only the JS
bundle/CSS changed; no C++/LLVM rebuild was required. Commands and final results
are recorded below. One early concurrent focused/full test invocation reused the
same Playwright output directory and caused trace ENOENT failures; subsequent
focused runs used separate output directories and the final suite ran alone.

Further regression findings: removing the literal caret alone left an extra
trailing newline in the desktop full-document replacement case. The retained
underline had collapsed to zero width and was being reclassified as a new EOF
caret. Retaining whether the original diagnostic was a point, rather than
inventing a point for a deleted range, fixed exact-source preservation; both
desktop/mobile cancellation and incomplete-input recovery now assert exact saved
text. Existing EOF carets continue to track edits. Legacy persistence tests were
updated to seed genuinely legacy records and expect Foundation to remain selected
after refresh. That also caught a missing scratch-file picker option when reloading
while Foundation was selected; the picker now includes the saved local program
even while another document is active. A failed attempt to use Python for a small
CSS cleanup hit Windows' unavailable Python alias; the actual edit used Node.

The user then requested an error speech bubble whose top connector spans the
marked text, including left/right corner cases. The card and trapezoid now share
one filled SVG outline behind the normal accessible error text, measured through
CodeMirror's batched requestMeasure API. This avoids overlapping triangle borders,
transparent seams or mismatched corner backgrounds. The connector's top matches
the marked range's last visual row; its base stays inside the card's rounded
corners, including when the source text extends beyond a corner. End-of-input
errors use a small connector at the caret. Measurements refresh on diagnostics,
edits, viewport and geometry changes; no compiler work is involved. Browser tests
exercise left, right, wide and wrapped errors on desktop and phone layouts, sample
the rendered outline against the marked text and capture screenshots for review.

The user rejected the first edge treatment because clamping the connector's base
inside a rounded corner made a notched neck instead of a trapezoid. Superseding
that geometry: when the marked text reaches a corner, align that body edge with
the text and omit that upper rounded corner. The connector then has one vertical
side (`|__\` or `/__|`), with the opposite slope intact. Interior connectors keep
both slopes, and bottom corners retain rounding. The revised tests check the
vertical side at half connector height as well as full text-width alignment.
Reviewed desktop/phone screenshots of left, right, wide and wrapped errors: solid
fill, one border and no corner notch. The phone edge fixture uses a 390px viewport
so the final monospace token actually intersects the rounded-corner region;
393px left it just outside that region, correctly failing the original fixture's
edge assertion rather than a rendering/alignment assertion.

A final visual adjustment adds a shared 3px gap above the connector and moves the
card down by the same amount, keeping the connector just below the squiggle rather
than touching it. Its slopes, width and flattened edge corners are unchanged.

Validation and reproduction:

- `npm run build --prefix playground` rebuilt the browser assets.
- `npm test --prefix playground`: 136/136 Node/WASM/host tests passed.
- From playground, `npx playwright test --workers=2`: the debounce/persistence/
  timing build passed all 86 desktop/mobile tests before the bubble addition.
- `node scripts/profile-execution.mjs ../build/debounce-execution-profile.json`:
  cold complete execution was 1,102 ms desktop / 1,022 ms phone emulation locally.
  Warm file opening completed in 81–143 ms desktop and 81–141 ms phone; edits
  including the intentional 250 ms delay completed in 296–304 / 281–300 ms.
  Highlighting was ready in 273–287 / 266–282 ms after edits. Cached LLVM reuse
  measured 0.0–0.1 ms on those runs, separately flagged as cached. These are local
  browser-emulation DOM timings, not physical-device input-to-display latency.
  Profile logs/JSON are under build/debounce-execution-profile.*.
- The bubble corner checks passed on desktop and 390x844 phone emulation,
  including source preservation, full marked-width alignment and both vertical
  edge sides. Screenshots are build/error-bubble-{left,right,wide,wrapped}-{desktop,mobile}.png.
- Other desktop/phone screenshots verified refreshed Execution selection,
  current-run cached timing labels and shared 8px gaps, including 320px controls.
  No native/compiler semantic files changed, so this task did not rerun a native
  C++ rebuild or sanitizer suite.
- With the bubble, the full suite passed **88/88** desktop/mobile checks
  (build/playground-final-browser.log). After the final 3px gap adjustment, all
  **10/10** relevant bubble, viewport, Unicode/EOF, saved-source and infinite-loop
  recovery checks passed (build/bubble-gap-tests.log). The final build was rebuilt
  and its 20 static deployment assets matched the local server by SHA-256.


## 2026-11-17: verified debounce and error-bubble publication

Pushed source commit `850156e` to master and published the tested static assets as
gh-pages commit `186e3a7`. GitHub Pages build/deployment run `44207146030` completed
successfully: https://github.com/TrevorSundberg/tower/actions/runs/44207146030 .

Ran `node playground/scripts/verify-deployment.mjs https://trevorsundberg.github.io/tower/`.
All 20 public assets matched the final local build by SHA-256. Real Chromium
desktop and phone-emulation checks passed online: interpreter/Wasm agreement,
module bindings, editable grammar and the connected error bubble, selected-file
refresh persistence, current-run cached load labels, source restore, native
compilation/downloads and equal result columns. No page errors were observed.
The same verification passed against http://127.0.0.1:4173/ after the final 3px
gap adjustment. Logs: build/playground-online-deployment.log and
build/playground-final-local-deployment.log; report/screenshots under
build/deployment-verification/. Earlier unrelated working documentation and
todo.txt edits were left out of these commits.

### 2026-11-17 — Grammar-derived diagnostics, bounded insertion hints, and earlier diagnostic updates

The user reported `Unexpected 'var' at byte 464 in state(264, ')')` after a
missing semicolon and requested consistent, concise errors with expectations,
rule names and definition provenance. They clarified that automatic generation
matters more than author-supplied messages, and allowed heuristics if measurement
shows they are needed. They also requested slightly faster typing updates and
clearing diagnostics when their relevant phase succeeds rather than waiting for
execution to finish.

Root causes:

- The native recognizer emitted its debug state/byte text as the diagnostic.
  The editor then attempted to strip that suffix with `state\([^)]*\)`. A quoted
  `')'` inside the state label defeated this regex. Thus identical parser failures
  could display different amounts of implementation detail. Messages now originate
  without that suffix; no frontend diagnostic-text regex remains.
- The previous debounce implementation deliberately retained every diagnostic
  until automatic execution finished. That also retained already-corrected syntax
  errors, and a subsequent infinite program could keep an old semantic error
  visible indefinitely.

Research consulted:

- GNU Bison, error reporting and LAC:
  https://www.gnu.org/software/bison/manual/html_node/Error-Reporting-Function.html
  and https://www.gnu.org/software/bison/manual/html_node/LAC.html . Expected
  terminals from a merged LR state alone can be misleading; following reductions
  on a temporary state stack checks whether a terminal really reaches a shift or
  acceptance. Tower applies a bounded version only after failure, not as a change
  to ordinary parsing.
- Clinton L. Jeffery, *Generating LR Syntax Error Messages from Examples*:
  https://www.cs.tufts.edu/~nr/cs257/archive/clinton-jefferey/lr-error-messages.pdf .
  Example-driven diagnostic mappings are possible without exposing numeric states,
  but introduce authored diagnostic data and invalidation concerns for changing
  grammars. They are not implemented here.

Rejected/superseded local trials:

- Initially sketched/locally added an optional `expected 'message'` grammar-term
  annotation on shared nodes. The user clarified their priority, so all of that
  syntax, seed, formatter and metadata work was removed before committing. There
  is no new `expected` clause; the existing `when expected` lexical syntax is
  unchanged.
- An initial filter only tried non-word literals. Removed after the user asked
  whether punctuation was hardcoded. Candidates now come from the active grammar,
  including custom keywords. Token patterns are valid expectations but do not
  provide invented names/numeric values for insertion.
- Checking only the offending token left `42` followed by `print(...)` ambiguous
  with inserting a binary operator. Trials now inspect up to three real tokens.
  The same lexer uses each temporary parser stack for contextual token choices,
  including re-lexing the offending position. Prefix acceptance must return to
  the initial state and consume the same next token; an early trial failed to do
  this and lost valid semicolon hints. Regression tests cover this boundary.

Implemented:

- Error-only lookahead correction and single-literal insertion trials copy state
  pointers, never parse trees or source. They do not execute semantic actions,
  install declarations, modify the real recognizer or alter highlights. Successful
  input follows the existing shift/reduce path. Derived LR positions are retained
  in tables for diagnostics, not as another grammar semantic model.
- Limits: 64 expected terminal candidates, 128 actions per probe, 8,192 actions
  per diagnostic, an initial 4,096-state stack limit, three real continuation
  tokens and 32 skipped tokens per speculative read. Uncertain/budget-limited
  searches suppress definite repair hints. This is local guidance, not proof that
  the rest of a file is valid. There is no deletion/substitution/multi-insertion
  search or multi-error resynchronization, and invalid programs are not executed.
- A unique viable grammar literal produces e.g. `Missing ';' before 'var'.`,
  with a caret at the preceding token's end. Ambiguous candidates produce checked
  expected alternatives. Lexical failures retain their lexical explanation and
  add expectations. Replacement-template errors gain checked expectations but
  do not guess insertions around typed holes.
- `SyntaxSource` provenance lives on shared grammar entities. Rule excerpts use
  the existing formatter. Messages cite named rules and definition file/line/
  column, including Foundation/Bedrock and local declarations. Runtime diagnostic
  positions resolve through current bindings rather than cached source nodes;
  moving a rule through comments preserves a table cache hit but updates its line.
- Shift/reduce errors describe continuing versus finishing competing productions;
  reduce/reduce errors describe the competing completed productions. Both cite
  their definitions. Generated repetition/capture conflicts describe the public
  source term instead of a generated numeric helper. Numeric state IDs remain
  available only in explicit parser traces/debug output.
- Browser syntax responses optionally include `errorLength: 0` for insertion
  carets. UTF-8 offsets remain transport data. The native driver now renders
  filename:line:column for compilation/interpreter failures instead of byte offsets.
- Typing debounce changed from 250 to 200 ms, retaining trailing/reset behavior.
  Parse errors clear on successful analysis. With automatic execution, old
  semantic/runtime diagnostics clear on the successful Foundation compilation
  message rather than waiting for both executions. Existing diagnostics stay
  visible during debounce; stale worker replies remain rejected.

Environment and reproducible checks:

- Windows workspace `C:\Sandbox\tower`; WSL `Orchestral-Revng`; WASI SDK 34,
  Release builds without C++ exceptions. `cmake --build build/browser-wasi
  --parallel 4` builds the parser/interpreter reactor. `TOWER_BROWSER_CROSS=ON
  TOWER_BUILD_JOBS=4 bash playground/scripts/build-llvm.sh` rebuilds both optimized
  LLVM reactors. An initial direct build of `build/browser-wasi-llvm` failed during
  regeneration on the checkout's CRLF `config.guess`; that is an old build tree.
  The maintained script uses the Linux source/build cache and completed correctly.
- `bash playground/scripts/test-native-core.sh` passes both native ASan/UBSan
  suites. The first run exposed an old test requiring the word `byte`; updated it
  to require a human error, checked expectations and unchanged recognizer work
  counters. The native `towerc` was rebuilt from `/root/.cache/tower/native`.
- `towerc build/diagnostics-native.tower --interpret` reports
  `build/diagnostics-native.tower:2:10: Missing ';' before 'var'.`, followed by
  `CoreCallStatement` and its Foundation location. The fixture includes Unicode
  on the preceding line.
- `node --test playground/tests/*.test.mjs`: 143/143 pass. New tests include
  punctuation and keyword insertion, contextual lexing, ambiguous/no valid repair,
  two-token omissions, grammar conflicts, cached provenance, broad expected sets
  and 4,200 nested delimiters. `npm run check:format` passes all 16 bundled Tower
  files unchanged; no grammar spelling or format changes were introduced.
- The initial full Playwright run passed 88/92 checks. Two desktop/mobile cases
  expected the old lexical-only text (restored that useful cause while adding
  expectations), and two expected EOF on a trailing blank line (updated to the
  correct insertion gap after the preceding number). New checks hold all execution
  requests to verify parsing alone clears a parse error, and replace a semantic
  error with an infinite loop to verify compilation clears it before execution ends.
- Final full Playwright run: 92/92 pass on the rebuilt parser, LLVM and cross
  reactors. The final Node run passes 143/143 and native ASan/UBSan passes 2/2.
- Screenshots `build/diagnostics-semicolon-{desktop,mobile}.png` were inspected:
  the caret/bubble connects after `print(42)`, the location is Ln 1, Col 10, and
  the rule definition wraps within the card without horizontal overflow.

Performance trial:

`node playground/scripts/profile-diagnostics.mjs build/pages-deploy/tower.wasm`
compared the previous published reactor with this implementation. Each case uses
eight warmups plus 40 warm reset/parse/JSON samples; module loading is excluded.
Results are in `build/diagnostics-profile.json` (Node running the real Wasm, not
physical mobile-device latency). Median milliseconds before/after: valid program
0.795/0.625; missing semicolon 0.217/0.298; number followed by a call 0.181/0.241;
custom missing keyword 0.431/0.469; ambiguous repair 0.520/0.489; deeply invalid
input 4.329/3.947. After-change p95 is 0.672 ms for the semicolon and 0.419 ms for
number/call. Treat the lower valid/deep medians as measurement variation, not an
optimization claim. The measured extra work is small enough that a punctuation
heuristic is unnecessary. The 200 ms intentional debounce still dominates typical
interactive latency.

Remaining limitations: suggestions validate only a short continuation under the
current grammar; they cannot anticipate later declarations changing that grammar.
Long or very ambiguous failures use bounded fallback expectations. Local rule
locations are labeled `this file` (the editor/CLI already supplies the current
filename); imported baselines identify their module. Full multi-error recovery,
deletion/replacement fixes and machine-applicable fix actions remain future work.

### 2026-11-17 — Diagnostics deployment and final browser timings

- Implementation pushed on master as `1824862`; Pages artifacts pushed as
  `499e5fe`. GitHub Pages run `44211307058` completed successfully:
  https://github.com/TrevorSundberg/tower/actions/runs/44211307058 .
- `node playground/scripts/verify-deployment.mjs` passed against both the local
  server and https://trevorsundberg.github.io/tower/ . All 20 published assets
  match local SHA-256 digests, including the parser/interpreter and both rebuilt
  LLVM reactors. Desktop/mobile checks include the missing-semicolon wording,
  Foundation rule location, insertion caret at Ln 1, Col 10, backend agreement,
  editable grammar, persistence, native downloads and equal columns. Online
  artifacts/screenshots are in `build/deployment-verification/`; logs are
  `build/diagnostics-{local,online}-deployment.log`.
- `node scripts/profile-execution.mjs ../build/diagnostics-execution-profile.json`
  measured desktop/mobile browser emulation on the local server after the final
  build. Complete edits took 236–258 ms desktop and 233–250 ms mobile emulation,
  including the intentional 200 ms quiet period. Highlight updates took 214–234
  ms and 218–231 ms respectively. Warm file opens took 91–168/92–163 ms; complete
  cold runs took 1,185/1,194 ms. These are DOM timings on this machine, not physical
  mobile latency or a controlled before/after cold-start regression comparison.
- Final source-format check passed all 16 bundled Tower files. Full tests:
  143 Node/Wasm checks, 92 Playwright desktop/mobile checks, and 2 native sanitizer
  suites. Other-thread changes to AGENTS.md, docs/foundation.md and earlier journal
  notes were left unstaged; todo.txt was not modified or staged by this task.

### 2026-11-17 — Prefix/postfix increment as Tower syntax: feasibility probe

The user asked whether grammar replacements can implement increment, including
value-returning helpers which LLVM inlines like ordinary compiled code. This was
an investigation, not a change to the shipped grammar or compiler.

Verified using the existing optimized Wasm parser/interpreter and LLVM reactor:
`node build/probe-increment.mjs` from C:\Sandbox\tower. The ignored probe saves
source, expanded Foundation, raw LLVM and optimized LLVM as
`build/increment-{statements,values}*`. No rebuild was needed.

- Statement rules capturing CorePlace and expanding `x++;` / `++x;` into
  `x = x + 1;` already work for identifiers, struct fields and array elements.
  Interpreter and LLVM-generated Wasm both printed 7, 11, 21 in the probe.
- Typed pointer helpers already implement the value distinction: postfix loads
  the old value, stores old + 1, returns old; prefix stores and returns the new
  value. Grammar-only CoreValue extensions for `(*p)++` and `++*p` expanded into
  `postinc_i32(p)` and `preinc_i32(p)`. Starting at 5, both backends printed
  old=5, new=7, final=7.
- An exported function with an unknown pointer argument calls both helpers and
  returns the sum of their results. LLVM O2 removed both calls and all helper
  temporaries. Its body has one load, add 2, one store, an addition of old/new,
  and return. This tests actual inlining without relying on a constant input.
- Existing semantic checking rejected u32* passed to the i32* helper with
  `Expected i32*, got u32*; use an explicit conversion`, and rejected loading
  an i32 as a pointer with `Load requires a pointer`. Foundation already has
  typed addressable places and raw-pointer load/store validation; these are
  compile-time type checks, not restored runtime safe handles.

Limits and next steps: direct `postinc_i32(&x)` is currently rejected because
call arguments are CoreOperand/type spellings, not arbitrary CoreValue trees;
the native call checker also consumes operands. Merely extending its grammar
would not implement evaluation of nested values. General `y = x++` composition
therefore needs address-valued arguments or a lowering step which introduces a
pointer temporary and call. Broader expressions need deterministic sequencing,
exactly-once evaluation of an address (especially future side-effectful indexes),
and hygienic bindings for generated temporaries and helper references. Current
templates are structural and not hygienic. The duplicate-place statement demo
is suitable for today's restricted places, not a general effectful-expression
translation. Generic typed helpers/overload selection also remain future work;
the tested value helpers specifically operate on i32.

No new increment-specific Foundation opcode is required for ordinary scalar
increments. Existing load/add/store/call/return operations suffice; richer syntax
can stay above the instruction-like Foundation without adding precedence there.
LLVM currently runs function(sroa,mem2reg,instcombine,simplifycfg),default<O2>.
Inlining here is observed, not a universal guarantee or a Clang equivalence
proof. Tower's wrapping arithmetic and conservatively aligned raw accesses are
not necessarily identical to C's optimization assumptions. Preserve the selected
semantics instead of promising identical IR for every source expression.

References checked: https://llvm.org/docs/Passes.html (inlining and promotion),
https://llvm.org/docs/LangRef.html#add-instruction (modular addition versus
nsw/nuw poison contracts). This task did not modify todo.txt or unrelated work.

### 2026-11-17 — Correct misleading rule context; add the Increment example

The user's `var alias: i32*;;` screenshot exposed a diagnostic regression:
`Required by CoreCall` / `CorePlace` described possible future rules, although
the previous declaration was complete and no call had begun. The LR closure
contains those items because an identifier can begin the next statement; they
were incorrectly presented as an explanation for the unexpected semicolon.

The error-only probe now distinguishes an unstarted parse from a partly read
rule, filters position-zero closure items, and carries a consumed-source bit
through speculative reductions. Empty prefixes do not establish user context.
At a new top-level boundary, the message is now:
`Unexpected ';'. Expected a statement or grammar declaration.` No punctuation
allowlist, semicolon exception, deletion repair or normal parse-path change was
added. Defining `parse Statement |= ';';` still permits empty statements.

For an in-progress rule, unique context is introduced as `In rule ...` with
source provenance, not `Required by`. If alternatives of one rule remain viable,
name that rule at its definition rather than selecting an arbitrary alternative.
If multiple different rules remain possible, do not present one as the user's
intent. Existing missing-literal suggestions and conflict provenance remain.
Tests cover the exact screenshot, start-of-file, call/function boundaries,
nested blocks, nullable prefixes, user-enabled empty statements and a missing
semicolon which still correctly identifies CoreCallStatement.

Added `scaffolding/examples/increment.tower` and an Increment dropdown option.
Its Tower rules translate `(* pointer) ++` and `++ * pointer` into typed helper
calls. Outputs are 5, 6, 7, 7, showing old/new results and the updated variable.
An independent LLVM test uses an exported function with an unknown pointer
argument: both calls inline, leaving one load, one store and arithmetic, with
no alloca or helper call. No Foundation opcode or parser special case was added.
The example follows the existing canonical formatter: arbitrary custom operators
receive generic spacing, and output comments precede statements. Initial tight
operator spelling and trailing comments failed the canonical-source check; the
example was adjusted rather than introducing increment-specific formatting.

Reproduction/validation (Windows checkout, WSL Orchestral-Revng, WASI SDK 34):
- Rebuilt `build/browser-wasi` and both optimized LLVM reactors using
  `TOWER_BROWSER_CROSS=ON TOWER_BUILD_JOBS=4 bash playground/scripts/build-llvm.sh`.
- `node --test playground/tests/*.test.mjs`: 146/146 pass.
- `bash playground/scripts/test-native-core.sh`: 2/2 ASan/UBSan suites pass.
- `npm run check:format --prefix playground`: all 17 Tower sources pass.
- Full Playwright run: existing 92 checks passed; two new desktop/mobile checks
  initially expected column 16 instead of the actual second semicolon's column
  17. Corrected the test expectation; both focused checks then passed. The
  screenshots were visually inspected on desktop/mobile, including the bubble,
  marked extra token, wrapping and Increment execution columns.
- `node playground/scripts/verify-deployment.mjs http://127.0.0.1:4173/` passed:
  21 asset hashes and desktop/mobile workflows, including the new error/example.
  Logs/artifacts: `build/context-{node-tests,native-tests,browser-tests,
  focused-browser,local-deployment,llvm-build}.log`,
  `build/extra-semicolon-{desktop,mobile}.png`, `build/increment-desktop.png`.
- An initial timing trial overlapped builds/tests and was discarded as a useful
  comparison. After they finished, `node playground/scripts/profile-diagnostics.mjs
  build/pages-deploy/tower.wasm` compared the previous deployment with this build:
  missing-semicolon median 0.182 -> 0.187 ms (p95 0.290 -> 0.293), valid source
  0.505 -> 0.530 ms, deep invalid 3.580 -> 3.719 ms. Forty warm samples follow
  eight warmups; includes reset/parse/JSON, excludes module loading. No material
  latency regression observed; this is not an optimization claim.

Source and Pages publication follow these local checks. Preserve unrelated
AGENTS.md/foundation notes and earlier journal edits; do not modify todo.txt.

### 2026-11-17 — Grammar context and Increment published and verified

- Source pushed as `d27b978`; Pages artifacts pushed as `0673a28`.
- GitHub Pages deployment `44213690901` succeeded:
  https://github.com/TrevorSundberg/tower/actions/runs/44213690901 .
- `node playground/scripts/verify-deployment.mjs https://trevorsundberg.github.io/tower/`
  passed all 21 local/published asset SHA-256 comparisons and desktop/mobile
  workflows. The online extra-semicolon message has no unrelated call context;
  Increment is selectable and both executions print 5, 6, 7, 7. Persistence,
  editable grammar, native downloads and equal columns also passed.
- Logs: `build/context-{online-deployment,pages-workflow}.log`; online screenshots
  and report: `build/deployment-verification/`. The source tree retains only the
  unrelated pre-existing AGENTS.md, foundation/journal notes and todo.txt changes.

### 2026-11-17 — Ordinary increment places and composable call operands

The user's `value++;` failed because the previous Increment demo deliberately
matched only `(*pointer)++` / `++*pointer` as CoreValue, not a standalone call
statement. That was too narrow for the intended demonstration. This entry
supersedes that example and the earlier limitation on direct address arguments.
The accidentally posted explosion-rendering request was explicitly withdrawn;
no graphics project or rendering work was performed.

Increment now has just two Tower rules extending CoreCall: postfix captures
`$place:CorePlace '++'`, prefix captures `'++' $place:CorePlace`. Each replacement
passes `&$place` to an ordinary typed helper. Captured places cover variables,
fields, indexed elements, quoted names and fields through struct pointers. No
native increment opcode, keyword, special-case evaluator or temporary-name
generation was added. The helpers remain i32-specific, not generic functions.

To support the requested general composition, CoreCall, CoreAddress and CoreLoad
are now CoreOperand alternatives. CoreValue is CoreOperand or CoreBinary, so
there is no duplicate call parse path. Calls compose in arguments, returns,
conditions, array indices and binary operands. Binary syntax still has only two
operands and one operator; no Term/Factor hierarchy, arithmetic precedence or
arbitrary parenthesized expression syntax was introduced. The original pointer
type-argument grammar remains shared. Foundation text still serializes these
same enriched nodes, including nested calls and addresses; round trips retain
their types and bindings. Types, void results and expression nesting (128) are
checked before any execution.

Semantic lowering now shares address/load checking between assignment values
and operands. Re-visiting a call for comparison type inference reuses its typed
components; it must not append a second argument list. This was caught during
review and covered by a comparison of two calls with increment arguments.

Evaluation is defined left to right: binary operands, call arguments, and the
base/index of a place. An assignment captures its target address before its
right side is evaluated. The LLVM backend follows that order explicitly. In
the interpreter, expressions containing user/foreign calls or allocation effects
use resumable value/address tasks, with per-statement scalar-result caches and a
derived node dependency index. These are execution state, not another semantic
graph, public instruction format or pointer metadata. Cached results freeze
earlier reads before later argument effects and prevent repeated index/address
evaluation. Each callee has its own frame/cache; returning resumes its parent's
expression. Unselected branches remain unevaluated. Pure expressions keep the
direct path. Task budgeting includes the new phases (documented in ABI.md), and
an infinite nested call still yields with a one-task budget and is cancellable
by the browser worker. Raw pointer semantics and containment are unchanged.

The example prints 5, 6, 7, 7, 9 and demonstrates assigned results, discarded
results, and `print(value++)`. Tests additionally exercise `value++ + ++value`,
nested identity calls, returns/conditions, `array[index++]++`, struct fields,
argument snapshots, assignment address capture and unsupported types/void calls.
For a runtime pointer parameter, LLVM O2 still removes both helpers and leaves
one load, one store and arithmetic. C++ does not know the increment spelling.

A diagnostic assumption changed with the grammar: after `var x: i32 = 42` and
a newline followed by `print(x);`, inserting an arithmetic operator now also
parses, because calls can be operands. The full suite first reported 151/152
passing for this reason. We kept the bounded grammar-only insertion search and
added a conservative newline heuristic: if exactly one viable candidate also
completes the current construct, report `Possible missing ...`. Completion is
probed from the table; no punctuation list or semicolon-specific rule is used.
Other repairs remain possible, so this is not phrased as a definite requirement.
Same-line ambiguities remain expected alternatives. New tests prove that both
the suggested terminator and an operator parse, and that the hint is qualified.

Validation/environment: Windows checkout C:\Sandbox\tower, WSL Orchestral-Revng,
WASI SDK 34. Rebuilt parser/interpreter and both optimized LLVM reactors with
`cmake --build build/browser-wasi --parallel 4` and
`TOWER_BROWSER_CROSS=ON TOWER_BUILD_JOBS=4 bash playground/scripts/build-llvm.sh`.
- Final `node --test playground/tests/*.test.mjs`: 153/153 pass, including all
  cross targets and repeat output determinism, canonical round trips, nested
  evaluation with one-task budgets and differential interpreter/LLVM cases.
- `bash playground/scripts/test-native-core.sh`: 2/2 ASan/UBSan suites pass;
  includes nested increment calls, direct address arguments to foreign calls,
  structure-preserving text round trips and node release accounting.
- Full browser suite: 94/94 desktop/mobile checks pass, including entering
  `value++;` without spaces, composed print calls, and cancellation/recovery
  from `print(forever())`. The final newline-hint UI check is run separately
  after rebuilding the diagnostic change. Screenshots were visually inspected.
- All 17 bundled Tower sources equal their canonical formatting.
- Browser-hosted LLVM emitted Windows x64 and Linux x64 executables containing
  `print(increment(&value))`. Running build/cross/windows.exe directly and
  build/cross/linux.elf through WSL both printed 5, 84, 42, 8, 41, 42.
- Logs: build/increment-{composition,final}-{node,browser,native,llvm}*.log;
  focused tests in playground/tests/increment.test.mjs. Parser-only development
  trials can use TOWER_INTERPRETER_ONLY=1; final tests did not use that shortcut.

Performance trial: `node build/profile-composed-calls.mjs`, 8 warmups and 24
samples, each runtime using its own shipped Foundation, prior Pages module
versus the new build. Median compilation was 10.842 -> 11.073 ms for the tiny
program and 11.253 -> 11.376 ms for a 5,000-call loop. Tiny execution was
0.077 -> 0.067 ms; 5,000 ordinary calls 8.736 -> 14.170 ms; 5,000 pure iterations
4.571 -> 5.281 ms. Explicit sequencing adds interpreter overhead, particularly
for calls; do not claim it is free. Compilation remained close in this trial.
The recorded artifact is build/increment-composition-runtime-profile.json.
Further interpreter scheduling/cache optimization is separate work; the LLVM
inlining check already removes the tested runtime helper overhead.

Limitations: full type-generic functions/overload resolution, hygienic generated
bindings, richer surface arithmetic and additional addressable-place syntax
remain future work. Existing edited documents are preserved; Restore loads the
updated Increment example. Publication and online verification follow local
checks. Unrelated AGENTS.md/foundation/journal edits and todo.txt stay unstaged.

### 2026-11-17 — Composable increments published and verified online

- Source pushed as `ede26bb`; Pages artifacts pushed as `f0b89ef`.
- GitHub Pages run `44218065299` succeeded:
  https://github.com/TrevorSundberg/tower/actions/runs/44218065299 .
- Final focused desktop/mobile tests passed after the newline-suggestion change,
  including a caret for `Possible missing ';'`, normal increment statements,
  print arguments, and infinite nested-call cancellation/recovery.
- Local and online deployment verification both passed all 21 asset hashes and
  desktop/mobile flows. The published Increment example compiles to
  `post_increment(&value)` and both executions print 5, 6, 7, 7, 9. Editable
  grammar, saved-document recovery, native downloads and equal columns passed.
- Artifacts: build/increment-{final-browser,final-local,online-deployment,
  pages-workflow}.log and build/deployment-verification/. No unrelated working
  changes or todo.txt were staged. Refresh and Restore are needed to replace a
  previously edited Increment document with the revised bundled source.

### 2026-11-17 - Format prefix/postfix syntax without operand spaces

The parser already accepted `++value` and `value++`. The shared source formatter
treated a user-defined operator like an ordinary separated token, and the bundled
Increment example had been made canonical as `++ value` / `value ++`. That style
was unwanted; it is superseded here.

The formatter now recognizes a two-child matched production with one symbolic
operator leaf and one operand as prefix/postfix syntax. This derives attachment
from the existing parse nodes, without hardcoding increment names or adding an
increment operation. Conventional symbolic operator characters are a formatting
heuristic, not a new lexical restriction. Binary productions retain spaces,
comments remain intact, and adjacent operator tokens remain separated in the
new attachment path to avoid merging their spellings. The existing reparse and
tree-equivalence guard still refuses output that changes custom lexical meaning.
Arbitrary multi-part syntax and configurable formatting metadata remain separate
future work; this is a small default style for directly expressed affix rules.

The Increment example now uses `++value`, `value++`, and `print(value++)`.
Tests cover assigned/standalone increments, fields, indexed elements, binary
operands, intervening comments, custom `~~`/`!!` affixes and `%%` infix syntax,
format idempotence, and canonical equality of all 17 bundled Tower files.

Validation: Windows C:\Sandbox\tower, WSL Orchestral-Revng, WASI SDK 34.
- Rebuilt `build/browser-wasi` and both optimized LLVM reactors with
  `TOWER_BROWSER_CROSS=ON TOWER_BUILD_JOBS=4 bash playground/scripts/build-llvm.sh`.
- `node --test playground/tests/*.test.mjs`: 155/155 pass, including differential
  interpreter/LLVM execution and canonical source checks.
- `bash playground/scripts/test-native-core.sh`: 2/2 ASan/UBSan suites pass.
- `npm run build --prefix playground` and the focused Playwright `extra semicolons`
  test: both desktop/mobile pass. The test asserts tight example spelling and
  matching interpreter/Wasm output, and checks cancellation/recovery as before.
  Inspected build/increment-desktop.png: the editor visibly shows both spellings.
- Logs: build/increment-spacing-{llvm,native,tests}.log; browser results in
  build/increment-spacing-browser/. Publication follows these local checks.

Unrelated AGENTS.md, foundation documentation, journal work and todo.txt are
preserved. Only this entry is staged from the shared journal.

### 2026-11-17 - Tight increment formatting published

Source `82d57d3` and Pages artifacts `d5bec63` were pushed. GitHub Pages run
`44221781915` completed successfully:
https://github.com/TrevorSundberg/tower/actions/runs/44221781915 .
`node playground/scripts/verify-deployment.mjs https://trevorsundberg.github.io/tower/`
passed all 21 deployed asset hashes and desktop/mobile workflows, including the
Increment example's matching interpreter/Wasm results. Online log:
build/increment-spacing-online.log; screenshots/report: build/deployment-verification/.
Saved edited documents stay intact; refresh and Increment -> Restore loads the
updated bundled spellings. Unrelated working changes remain unstaged.

### 2026-11-17 - Rename CorePlace to CoreLocation

Renamed the public Foundation rule to `CoreLocation`: it describes a storage
location (a variable, field or indexed element) used for reads, writes and
address-taking. Increment rules now capture `$target:CoreLocation`, matching
the operation's role. The compiler's shared-node label checks, internal location
helper, malformed-tree diagnostic, native/browser tests and current parser docs
use the new name. Existing journal entries retain the historical name; this
entry supersedes that terminology. Syntax, pointer behavior and execution order
are unchanged. No compatibility alias was added: custom rules using CorePlace
must change that reference to CoreLocation; Restore reloads bundled examples.

Trial correction: an initial mechanical helper rename also changed two C++
`emplace` calls. The first Wasm build caught that compile error immediately;
those calls were restored before the successful builds and tests below.

Validation on Windows C:\Sandbox\tower / WSL Orchestral-Revng / WASI SDK 34:
- Rebuilt parser/interpreter with `cmake --build build/browser-wasi --parallel 4`
  and both optimized LLVM reactors with `TOWER_BROWSER_CROSS=ON TOWER_BUILD_JOBS=4
  bash playground/scripts/build-llvm.sh`.
- `node --test playground/tests/*.test.mjs`: 155/155 pass, including all 17
  bundled canonical formatting checks, location type checking, field/index
  operations and differential interpreter/LLVM increment execution.
- `bash playground/scripts/test-native-core.sh`: 2/2 ASan/UBSan suites pass.
- Built the static playground. Focused Playwright `extra semicolons` tests pass
  on desktop/mobile, including updated Increment execution and cancellation.
- Repository search finds the old name only in historical journal entries
  (excluding generated/build/vendor files and the untouched todo.txt).
  Logs: build/core-location-{llvm,native,tests}.log; browser artifacts:
  build/core-location-browser/. Publication follows local validation.

Unrelated working changes remain untouched; only this entry is staged from
the shared journal. The new spelling is the current grammar/semantic ABI.

### 2026-11-17 - CoreLocation rename published and verified

Source `e41fd4c` and Pages artifacts `94c9afa` were pushed. GitHub Pages run
`44231224306` succeeded:
https://github.com/TrevorSundberg/tower/actions/runs/44231224306 .
`node playground/scripts/verify-deployment.mjs https://trevorsundberg.github.io/tower/`
passed all 21 asset hashes and desktop/mobile workflows, including matching
interpreter/Wasm results for the updated Increment example and native downloads.
Logs/artifacts: build/core-location-online.log, build/core-location-pages.log,
build/deployment-verification/. Old saved custom rules require the new name;
refresh and Restore loads the revised bundled examples. Unrelated changes remain
unstaged, including all pre-existing journal work and todo.txt.

### 2026-11-17 - Initializer type inference implemented

The user requested the next item from the project list. Reviewed the self-hosting
sequence, completed storage/linking work, Foundation checklist and recent journal.
Selected the explicitly listed `var name = initializer` feature as a bounded
Foundation improvement. This does not port a compiler algorithm out of C++;
the earlier boundary to discuss that migration remains intact. Module imports,
public node/reflection APIs and the Tower-written store remain later work.

Implemented one additional CoreDeclare alternative in foundation.tower. Type
checking enriches the same declaration and operation entities used by both
backends. An annotation supplies the expected type; without one, the initializer
supplies it. Bare integers default to signed i32 and retain range diagnostics.
Typed binary operands constrain literal peers, without widening incompatible
typed operands. Comparisons yield bool; calls, addresses, loads, indexing and
built-ins supply their ordinary result types. String/null defaults are u8*/void*;
sizeof/alignof use explicit target-sized usize. Parameters and returns remain
explicit. There is no added expression precedence or aggregate-copy behavior.

Module names register first, then initializer type dependencies resolve. A
temporary visiting/resolved index detects cycles and reports their name chain
with an annotation suggestion. Inference is bounded (128 active declaration
dependencies, alongside the existing expression limit). It neither executes
initializers nor uses later assignments to solve types. Storage allocation and
effects keep source order even if a dependency is checked early. Locals retain
lexical scope and their existing self-shadowing rule; self-referential inferred
locals are diagnosed. Raw uninitialized reads remain outside the defined contract.

Canonical Foundation output always spells checked types; source formatting keeps
omitted annotations and comments. Native structural round trips check bindings
and storage order, in addition to result comparisons. Inferred declaration types
carry the selected pointer width even when their scalar initializer's type does
not otherwise depend on width: taking its address must work on both 32/64-bit
targets. Dedicated checks cover inferred integer/bool locations and their pointers.

Added an Inference playground example with matching output 42, true, 43, 42.
Updated Foundation docs/checklist and playground docs. No todo.txt edits. Only
this task's Foundation doc changes are staged, preserving concurrent notes.

Trials/corrections: an early test expected a double-quoted canonical string;
the shared formatter correctly emits single quotes, so the assertion was fixed.
The first full suite passed 160/162: an old diagnostic assumed a missing colon
was unique in `var answer i32;`, and another fixed a Foundation source line number.
With inference, both ':' and '=' are syntactically valid repairs, since i32 is an
ordinary identifier. Tests now verify both alternatives and derive the definition
line from the source. Parser heuristics were not weakened. The browser suite's
only failures were its exact dropdown list omitting the new Inference option;
the expected list was updated and both affected cases rerun successfully.

Validation/environment: C:\Sandbox\tower, Windows / WSL Orchestral-Revng,
WASI SDK 34, existing optimized LLVM/LLD Wasm and native sanitizer configurations.
- Rebuilt `build/browser-wasi` and both LLVM reactors via
  `TOWER_BROWSER_CROSS=ON TOWER_BUILD_JOBS=4 bash playground/scripts/build-llvm.sh`.
- `node --test playground/tests/*.test.mjs`: final 163/163 pass. Tests directly
  compile inferred source and canonical text with LLVM, compare execution,
  check all 18 bundled canonical files, invalid input before any effects,
  forward inference, cycle limits, mixed widths, replacements and literal limits.
- `bash playground/scripts/test-native-core.sh`: 2/2 ASan/UBSan suites pass,
  including structural round trips and released-node accounting.
- `npm run build --prefix playground`; full Playwright run 94/96 passed initially,
  then corrected dropdown assertions passed 2/2 on desktop/mobile. All 96 cases
  are verified. New tests cover inference output, canonical types, inline cycles
  and recovery. Inspected build/inference-desktop.png and inference-cycle-mobile.png.
- Cross-target suite builds/repeats all supported targets. The generated
  build/cross/windows.exe and linux.elf (via WSL) both ran and printed
  5, 84, 42, 8, 41, 42, exercising inferred locals and target-sized values.
- Logs: build/inference-{llvm,native,tests-final,browser}.log; focused browser
  rerun artifacts in build/inference-browser-final/.

Timing trial: `node build/profile-inference.mjs`, 8 warmups + 24 samples, median,
previous Pages compiler versus new compiler, each with its own Foundation.
Tiny compilation 4.512 -> 4.913 ms, 5,000-call program compilation 4.863 -> 5.297 ms,
pure-loop compilation 4.662 -> 5.097 ms. Execution samples respectively
0.030 -> 0.031 ms, 5.696 -> 6.009 ms, and 2.208 -> 2.337 ms. This is a local
sequential trial, not a controlled cross-platform benchmark or proof of zero cost.
No interpreter scheduling/runtime changes were made. Recorded at
build/inference-runtime-profile.json and build/inference-profile.log.

Publication and live verification follow. This is initializer-based inference,
not a general bidirectional constraint solver, inferred function signatures or
generic specialization. Those require their own semantic and diagnostic design.

### 2026-11-17 - Initializer inference published and verified online

Source `4415776` and Pages artifacts `6974c9d` were pushed. GitHub Pages run
`44233871190` completed successfully:
https://github.com/TrevorSundberg/tower/actions/runs/44233871190 .
`node playground/scripts/verify-deployment.mjs https://trevorsundberg.github.io/tower/`
passed all 22 asset hashes and desktop/mobile workflows. The new Inference
document produces 42, true, 43, 42 in both runners; canonical instructions show
explicit i32/bool/pointer types. Native build/download checks and saved-module
behavior still pass. Logs/artifacts: build/inference-online.log,
build/inference-pages.log and build/deployment-verification/.
Refresh the published page and choose Inference. The Foundation inference task
is marked complete. Unrelated AGENTS.md, Foundation/journal notes and todo.txt
remain unstaged and preserved.

## 2026-11-17: First compiler utility migration and eventual bootstrap binaries

The user explicitly authorized beginning the compiler implementation migration:
write the byte/UTF-8 utility previously proposed here in Tower and call its
compiled functions from the real compiler. This supersedes the earlier request
to stop before moving custom C++ algorithms. The migration remains incremental;
it does not authorize replacing the shared entity model with a parallel AST.

The user also specified the eventual bootstrap distribution: commit self-contained,
dependency-free portable Tower compiler binaries for Windows, macOS and Linux to
the repository, so a fresh checkout can compile Tower itself without first
installing C++, LLVM or other compiler toolchains. Include the required backend
and linker machinery in those binaries as needed; ordinary operating-system
requirements and supported architectures must be explicit. These are platform
executables, permitted separately from Foundation text as Tower's only program
interchange format. This is an eventual goal, not a claim that today's native
driver is dependency-free (it currently links installed LLVM). Version, provenance,
hashes and reproducible stage comparisons will be required when packaging them.

Implementation and verification of the first utility are in progress. Initial
inspection found duplicate UTF-8 decoders in lex-pattern.cpp, parser.cpp and browser.cpp.
The older raw parser decoder accepted malformed continuation bytes, overlong
sequences and surrogate code points that the ordinary lexer already rejected;
the migrated shared codec will use the stricter Unicode scalar contract.

## 2026-11-17: Tower-written UTF-8 is now part of the compiler

Implemented `scaffolding/compiler/utf8.tower`: ordinary exported Foundation
functions for decoding one scalar, encoding one scalar and validating a byte
span. The real lexer, raw parser streams/debug string encoder and browser source
validation call these compiled functions. Removed their duplicate C++ algorithms;
only small C ABI adapters remain. No new opcode, special Tower parser behavior,
alternate AST or runtime interpretation callback was introduced. The same source
uses existing shared nodes, type checking, canonical formatting and LLVM lowering.

Decode returns 1–4 bytes consumed, or zero with a cleared result on failure. The
output scalar is writable storage disjoint from the input. Encode accepts scalar
values, returns zero without modifying an undersized output, and supports a null
output size query. Validation accepts empty spans and has an explicit reject-NUL
option; browser source enables it. Both native and Wasm use target-sized usize,
raw pointers and a narrow C ABI. Overlong sequences, bad continuation bytes,
surrogates, out-of-range scalars and truncation are rejected consistently. This
corrects the earlier raw parser codec; its failure-as-end stream interface is
otherwise unchanged. Buffer validity/lifetime still belongs to the caller.

### Build path and bootstrap boundary

Native CMake shares the existing C++ compiler objects between `towerc-seed` and
`towerc`. The seed links only the independent codec in `bootstrap/utf8-seed.cpp`;
the normal compiler links the object compiled from `compiler/utf8.tower`. Browser
parser, Wasm LLVM and CPU-cross LLVM reactors link that same source compiled for
wasm32. Parser test targets likewise use the Tower object, with the C++ reference
linked under different names only into the dedicated differential test.

`cmake/TowerCompilerUtilities.cmake` records dependencies on source, bootstrap
compiler and both grammar modules. `build-bootstrap.sh` builds the transitional
host seed, or accepts an explicit TOWER_BOOTSTRAP_COMPILER. All normal build
scripts prepare it, and generated objects remain ignored platform artifacts.
This presently adds a host LLVM development-library requirement to a clean Wasm
build unless a suitable bootstrap executable is supplied. It is not yet the
dependency-free binary distribution requested in the preceding journal entry.

Added native driver `--bedrock file` / `--foundation file` inputs and passed them
explicitly during bootstrap. An external compiler must read the current checkout's
grammar, not silently use its original checkout's compiled-in paths. These are
host load controls, not a new language import system. The override test installs
a temporary grammar rule and interprets it, and checks a missing module failure.

### Trials, corrections and validation

- An early manual trial used the stale native compiler from before initializer
  inference and failed on a missing CoreDeclare type capture. Rebuilding the
  native compiler fixed this; the automated bootstrap now builds its own seed.
- The first production native link exposed an encoder narrowing check that O2
  could not discharge through the loop, leaving a tower_trap dependency. Masking
  the final byte explicitly before checked conversion made the byte range local
  and provable. No runtime shim was added. The bootstrap gate uses llvm-nm to
  require zero undefined symbols for all four generated object targets.
- The initial JS test oracle incorrectly passed ordinary arrays to TextDecoder
  (its TypeError looked like invalid input), and incorrectly expected library=true
  to return linked Wasm rather than the documented object. Corrected the oracle
  to Uint8Array and tested a linked module. These were test harness failures.
- `bash playground/scripts/test-native-core.sh`: **3/3** pass, including the
  existing ASan/UBSan parser/core tests and new exhaustive codec tests. Every
  Unicode scalar and surrogate, every one/two-byte input, 100,000 deterministic
  random spans and 50,000 page-boundary probes are covered. Generated Tower
  objects are not sanitizer-instrumented; inaccessible-page inputs/outputs and
  unchanged-buffer checks explicitly test their boundaries instead.
- `bash playground/scripts/test-bootstrap.sh`: byte-identical optimized LLVM and
  objects from seed versus the compiler using Tower utilities for
  x86_64-pc-linux-gnu, wasm32-unknown-unknown, x86_64-pc-windows-msvc and
  aarch64-apple-darwin. No undefined symbols. Explicit grammar inputs pass.
  Native execution is tested on Linux; macOS object agreement does not claim
  execution on a Mac or a fully self-hosted compiler.
- `node --test playground/tests/*.test.mjs`: **166/166** pass. New tests compare
  TextEncoder/TextDecoder, direct compiler exports, real source rejection, Unicode
  token rules, a recompiled standalone codec with no host imports, deterministic
  repeated Wasm emission, memory-end truncation, both interpreter pointer widths,
  compiled execution and canonical Foundation round trips.
- `npm run check:format --prefix playground`: **19** Tower files match their
  canonical formatting, with idempotence and parse-tree preservation.
- `npx playwright test` in playground: **96/96**, desktop and mobile, pass in
  2.7 minutes. Rebuilt final artifacts after host/build changes; all three Wasm
  modules exactly match the bytes exercised by those tests.

Environment: Windows Node v21.7.3; WSL Orchestral-Revng, host Clang/LLVM 19,
WASI SDK 34, Release/O3 browser compiler builds with LLVM assertions off and no
exceptions. Commands and logs are under ignored `build/utf8-*`; rebuild LLVM with
`TOWER_BROWSER_CROSS=ON TOWER_BUILD_JOBS=4 bash playground/scripts/build-llvm.sh`.

### Performance and next slice

Paired Wasm trials (`build/profile-utf8.mjs`, 12 warmups + 40 alternating samples)
measured compile plus canonical output, medians in ms: small 5.648→5.670,
inference example 5.902→6.022, 104 KiB ASCII comment 6.646→6.782,
99 KiB Unicode comment 6.290→6.336, 500 declarations 13.680→13.864.
This local trial found no material latency regression; it is not a cross-device
performance guarantee. JSON: build/utf8-performance.json.

Fresh-process native trials (`build/profile-utf8-native.py`, 3 warmups + 20 paired
samples) compare the C++ seed and Tower-codec compiler: inference total
118.020→117.182 ms, utility source 123.269→121.693 ms. Bootstrap grammar startup
is approximately 96–100 ms in both; no persistent native runtime was introduced.
JSON: build/utf8-native-performance.json.

Next: integrate the existing Tower ByteBuffer/arena helpers into a real owned
compiler buffer, with explicit allocator bindings, failure/ownership rules and
the same differential gates. Real module imports and Tower entity/component
storage remain larger prerequisites for broader migration. Most compiler code
is still C++; this is the first implemented compiler algorithm slice in Tower.

## 2026-11-17: Compiler utility migration published and verified online

Pushed implementation `3f69c08` after the 166 compiler/backend tests, 96 browser
tests, three native suites, formatting and bootstrap agreement checks passed.
Published the tested compiler artifacts as gh-pages `5c7b962`; Pages workflow
[44239063813](https://github.com/TrevorSundberg/tower/actions/runs/44239063813)
completed successfully.

`node playground/scripts/verify-deployment.mjs https://trevorsundberg.github.io/tower/`
verified all **22** deployed asset hashes against the tested local build and
passed both desktop and mobile flows: interpreter/Wasm agreement, forward module
bindings, editable grammar, persistence, native compilation/downloads and equal
columns. Logs are `build/utf8-online.log` and `build/utf8-pages.log`; reports and
screenshots are in `build/deployment-verification/`. The live lexer/parser now
uses the Tower-written codec. Other working notes and todo.txt were left untouched.

## 2026-11-18: Tower-owned compiler source buffers

Continued the authorized migration following the UTF-8 utility. The real parser
now owns active source text, replacement-template input, raw UTF-8 stream input
and retained grammar source snapshots using Tower byte-buffer functions. Extracted
the existing ByteBuffer library into `scaffolding/library/bytes.tower`; arena/map
helpers remain in storage.tower. There is one authoritative Tower buffer
implementation, shared with ordinary programs, not a second compiler-only buffer.
Current clients/build scripts explicitly concatenate/link those files until actual
module imports exist; splitting them does not claim to implement imports.

### Ownership and contracts

Added `bytes_assign_text`, which copies a byte span with a trailing NUL excluded
from length, including overlapping self-slices and growth that moves the source.
Embedded NUL bytes are preserved by this generic operation; source validation is
separate. Append and text assignment reject self-slices outside live bytes, check
size overflow before allocation, and preserve pointer/length/capacity/content on
failure. Zero-length append permits null input without copying or allocating.
Reserve grows geometrically, starts at 16 bytes and handles doubling overflow.
Raw pointer validity, metadata/data separation and exclusive ownership remain
caller obligations. No foundation handles, hidden bounds policy or new opcode.

`CompilerText` is a temporary move-only C++ ownership/view adapter over the Tower
ByteBuffer C ABI. Its metadata layout is checked against Tower's type registry at
32/64-bit widths. `SyntaxSource` retains this buffer on the existing metadata
object. SyntaxSession reads a view into it, removing the previous independent
session/provenance string copies. Existing grammar nodes and caches pin immutable
snapshots across resets and session destruction. This preserves the shared node
model, source spans, grammar order and formatter semantics. Token spellings,
other strings/containers and the rest of the compiler remain C++ for now.

Host allocation primitives in compiler-memory.cpp bind Foundation realloc/free
to libc/wasi-libc, with multiplication-overflow handling. They do not link the
guest program's allocator into the host compiler. Allocation/growth/copy policy
lives in Tower. Failed source-buffer allocation produces an error before parsing;
replacement/stream creation has equivalent explicit error handling. Existing C++
object allocation can still abort on OOM; this is not a general recovery guarantee.
Test-only fault/count instrumentation is excluded from production targets.

The seed uses an independent bootstrap/bytes-seed.cpp reference to break the build
cycle. Normal native and browser targets link the Tower object instead. CMake now
compiles both utility sources, retaining explicit grammar/compiler dependencies.
The eventual checked-in self-contained bootstrap binary goal still applies; the
current host seed continues to require installed LLVM development libraries.

### LLVM investigation and correction

The first native bytes.tower build failed with `Instruction Combining did not
reach a fixpoint after 1 iterations`. Reproduced independently from unoptimized
emitted IR using opt-19 with the same pipeline and debug-pass-manager; the first
explicit InstCombinePass on bytes_reserve failed. Raw LLVM passes verification.
The installed LLVM 19 InstCombineOptions default VerifyFixpoint=false, but the
textual pass parser enables it. The vendored PassBuilder.cpp
parseInstCombineOptions likewise explicitly sets VerifyFixpoint(true).

Changed the explicit spelling to `instcombine<no-verify-fixpoint>`, matching the
bounded production pass rather than demanding convergence after one iteration.
Kept VerifyEach and module verification. The same opt-19 command with this option
and -verify-each succeeded; normal native/browser O2 compilation and behavior
checks succeeded. Did not remove Tower overflow checks, lower optimization levels,
disable IR validation or patch upstream LLVM. Reproducible local artifacts:
build/bytes.raw.ll, bytes-opt-trial.sh, bytes-opt-trial2.sh and bytes-opt.log.

An initial JS fixture put binary comparisons directly inside print arguments,
which Foundation intentionally does not accept. Updated the test to use ordinary
three-address temporaries; no expression precedence or base syntax was added.

### Validation

- `bash playground/scripts/test-native-core.sh`: **4/4** native suites pass with
  host ASan/UBSan. New tests compare 20,000 deterministic operation sequences with
  the independent seed while forcing every successful reallocation to move,
  injecting failures, checking guard bytes and unchanged state, and testing
  overflow/self-slice rejection. A dedicated full-buffer text assignment forces
  movement when adding the NUL terminator. Generated Tower objects remain
  uninstrumented; guards, differential tests and fault injection cover them.
- Compiler integration tests overwrite caller-owned input, retain source nodes
  through 100 resets and session destruction, require exactly one source-buffer
  allocation per initial session, balance live buffer counts, inject failures
  into source reset/UTF-8 stream creation and verify recovery. Move assignment
  releases its prior buffer and transfers ownership once.
- `bash playground/scripts/test-bootstrap.sh`: seed versus compiler-using-Tower
  produces identical optimized LLVM and object bytes for both utilities across
  Linux x86-64, Windows x86-64, macOS ARM64 and wasm32. UTF-8 has no undefined
  symbols; buffer symbols are restricted to allocation/copy primitives and the
  Wasm stack-pointer linker symbol. Explicit grammar-input checks still pass.
- `bash playground/scripts/test-linking.sh`: native execution, C archive callbacks,
  raw memory, native-to-Wasm output, split buffer/storage libraries, real LLVM C
  API linkage, platform I/O and forward module bindings all pass.
- `node --test playground/tests/*.test.mjs`: **169/169** pass. Buffer tests cover
  interpreter and LLVM results, canonical text, both layout widths, real browser
  compiler exports, failed growth, source resets and formatting.
- `npm run check:format --prefix playground`: **20** Tower files match formatting,
  idempotence and parse-tree preservation. `npx playwright test`: **96/96** pass
  on desktop/mobile, including editable grammar, diagnostics, cancellation,
  persistence, native targets and shared warm workers.

Environment: Windows Node v21.7.3; WSL Orchestral-Revng; host Clang/LLVM 19,
WASI SDK 34; optimized LLVM reactors built with TOWER_BROWSER_CROSS=ON and four
build jobs, no exceptions or LLVM assertions. Logs: build/bytes-native-tests.log,
bytes-bootstrap.log, bytes-linking.log, bytes-all-node-tests.log and
bytes-browser-tests.log. Unrelated notes and todo.txt were not modified.

### Performance and remaining migration

Paired Wasm trial, 12 warmups + 40 alternating samples, compile plus canonical
output medians (ms): small 5.318→5.303; inference example 5.572→5.628;
104 KiB ASCII source 6.486→6.330; 99 KiB Unicode source 6.086→6.042;
500 declarations 12.974→12.838. Fresh native process trial, 3 warmups + 20 paired
samples: inference total 110.381→105.764 ms; UTF-8 utility source
110.733→105.779 ms. Compared with the saved prior compiler; these local trials
show no material regression, not a universal speed guarantee. Scripts/reports:
build/profile-bytes.mjs, profile-bytes-native.py, bytes-performance.json and
bytes-native-performance.json.

Next candidates are Tower-owned interned strings/typed collections needed by the
shared entity store, and a real module/import boundary to compose these files.
The arena/map library is not yet compiler infrastructure, source snapshot sharing
still uses the existing C++ metadata owner, and parsing/type checking/backend
algorithms remain to be migrated. No full self-hosting claim is made.

## 2026-11-18 - Tower compiler buffers deployed and verified

Implementation commit 5650e0b uses Tower byte buffers for compiler-owned source
text in native and browser builds. The final ABI-header split rebuilt cleanly;
all three resulting Wasm binaries exactly match the binaries used in the full
169-test compiler and 96-test desktop/mobile runs. The final native sanitizer
rerun passed all four suites (10.21 s).

Published Pages commit ee01705; workflow 44331877497 completed successfully.
`node playground/scripts/verify-deployment.mjs https://trevorsundberg.github.io/tower/`
then verified all 22 deployed asset hashes against the tested local build and
passed desktop/mobile execution agreement, forward bindings, editable grammar,
persistence, native builds/downloads and equal-column checks. Logs and screenshots
are in build/bytes-pages.log, build/bytes-online.log and
build/deployment-verification/. Public playground: https://trevorsundberg.github.io/tower/.

The build still reports the existing LLVM CreateGlobalStringPtr deprecation;
this migration does not change that call. GitHub's managed Pages workflow also
reports action/runtime migration notices, but deployment completed successfully.

## 2026-11-18 - Tower entity store, parser tree assembly and background LLVM warmup

### Direction and implemented boundary

The user clarified that self-hosting work must move the actual parser/compiler,
not remain a sequence of small C++ utility replacements. They then selected the
Tower-written Flecs-style entity/component substrate as the prerequisite, using
the existing foundation/ECS journal decisions. All custom compiler code remains
the eventual migration goal; external backend libraries may remain during it.

Reviewed the earlier ECS/access-scope and bulk-analysis entries and the shared
entity requirements in docs/foundation.md. Implemented an original small store
in scaffolding/library/entities.tower; no Flecs code or dependency was added.
Production native and browser compilers now allocate their actual TowerNode and
TowerComponent objects through that Tower code. The C++ API sees opaque pointers,
not a parallel native entity layout or a copied AST. Syntax, grammar declarations,
reflected program types and foundation operations still enrich those same nodes.

The store implements:

- Per-store monotonic identities, reference ownership and explicit disposal.
- Ordered child containment, owned names, named replacement, in-place child
  replacement and transfer of the last child's existing reference.
- Ordinary entities as component types, with consistent registered byte size,
  alignment and lifecycle. Payloads are raw/uninitialized until constructed.
- Stable aligned payloads, an owner component list and a per-type dense query
  index. Removing a component swaps the final query entry into its index slot;
  payloads themselves never move. Lookup is O(components on that entity), and
  type iteration visits matching components directly. Named child lookup/removal
  remains linear, as in the previous implementation.
- Retention of the type through payload finalization. Same-store ownership is
  required; failed allocation leaves semantic membership/links unchanged, though
  a successful preparatory reserve may change internal capacity.

Stable sparse payloads are deliberate for this first integration: C++ SyntaxNode,
CoreNode and Match payloads contain nontrivial native objects and existing callers
retain their addresses. Dense archetypes/relocation, multi-component query planning,
safe handles, scoped access, pinning, jobs and edit-stable identities remain future
work. This is not a claim of full Flecs behavior or a completed safe Tower layer.
Foundation pointers stay raw. Query positions are invalidated by structural edits;
payload pointers are invalidated by removal/destruction. Ownership cycles must be
avoided or broken explicitly, and the current store is single-threaded.

### Actual parser algorithm migrated

scaffolding/compiler/parse-tree.tower now assembles the recognizer's trees:
forest leaves own shared entities, generated fragments concatenate in O(1),
capture wrappers apply lazily, outer captures win, flattening attaches into real
entity relationships, and acceptance transfers the existing root reference.
Work counters still record each fragment visit, preserving the existing linear
scaling checks. Accepted roots retain their own names/components after the parser
table and work arena are destroyed. Borrowed capture names are safe only because
the parser's immutable table outlives that arena; attachment copies owned names.

The forest is transient derived parser work, not another semantic node model.
The LALR table builder, shift/reduce control, declaration reader, token-pattern
compiler, semantic payloads/type checking, formatter and lowering still have C++
code. The next substantial parser slice can move recognizer control and its
Match/state access onto this store, followed by table construction and grammar
installation. General imports will replace the temporary source composition.

The transitional seed keeps the old C++ node implementation in
bootstrap/nodes-seed.cpp and the previous forest algorithm in
bootstrap/parse-tree-seed.cpp. Normal compilers do not link these implementations.
CMake composes entities.tower plus parse-tree.tower, compiles that Foundation text
with the seed and links the object into the normal native compiler and all three
browser reactors. This is ordinary platform object output, not binary Tower IR.
Existing node tests moved unchanged into tests/nodes.cpp so both paths retain them.

### Failures and corrections during integration

- An initial Tower spelling used a comparison directly after `if`; the foundation
  correctly rejected it. Kept comparisons in explicit boolean locals, preserving
  the instruction-like grammar rather than expanding the language for the port.
- The first sanitizer run found a real shutdown use-after-free in the C++ lifecycle
  adapter. Its function-local callback vector was destroyed before static grammar
  caches released their nodes. Symbolized with addr2line against core-asan's
  tower-parser-tests; the fault was tower_entity_finalize. The registry now has
  process lifetime, like the compiler's seed type entities, so late cache teardown
  can invoke valid destructors. Both native parser suites then passed.
- Component header and aligned payload now share one allocation. Named attachment
  copies a possibly borrowed name before unlinking its old relationship. Ownership
  transfers retain the old parent's reference directly during reparenting, avoiding
  an unnecessary retain/release pair in the parser's hot attachment path.
- Allocation instrumentation now covers entity storage as well as text buffers;
  the old test asserting one *total* host allocation for source creation was no
  longer meaningful. It still checks owned input/provenance lifetimes and balanced
  disposal, while the source buffer continues to be shared by parsing/provenance.
- Tower-generated object code is not sanitizer-instrumented. C++ adapters/tests
  run under ASan/UBSan; native payload/value/alignment/lifetime checks, fault injection,
  interpreter/Wasm agreement and seed/compiler output comparisons remain necessary.

### LLVM preload request and implementation

The user observed that a syntax-only document deferred the first LLVM load until
an executable file was selected. Confirmed: scheduleAutoExecution returns for
syntax-only source and no execution worker existed to initialize LLVM.

Selected Wasm/x86/ARM backends now create their reusable workers at startup and
when enabled. A fixed internal `var warm: i32 = 42; print(warm);` program primes
LLVM parsing, optimization, code emission and linking. Wasm also instantiates and
runs that small module privately; native backends preload their target runtime
objects and link a sample for each selected platform. No editor text executes as
part of warmup, and its output/diagnostics never replace editor program results.

Worker requests are serialized behind initialization so one reactor is not entered
concurrently. An execution already queued behind warmup remains cancellable by
worker termination. Disabling a target terminates its idle/preloading worker;
unchecked targets do not fetch their compiler. Failed preload promises are evicted
so a later real request can retry. Current-run cached load timings still measure
the current wait/reuse operation, not a saved startup number. Separate browser
performance measures tower-llvm-warm/tower-x86-warm/tower-arm-warm record warmup.

The first broad browser run exposed one presentation bug: native requests queued
behind warmup showed Ready until the worker began handling them. They now show
Loading immediately. It also exposed test assumptions that the first created
worker was the parser and the first LLVM load was cold. Tests now locate the
parser by its worker URL; two independently measured cached loads may both round
to 0.0 ms. The initial run had 90/100 passes; the final rerun is recorded below.

### Measured performance

Saved previous compiler binaries as build/entities-before-tower.wasm and
build/entities-before-towerc before editing. Paired Wasm measurements used 12
warmups plus 40 alternating-order samples of compile plus canonical Foundation
output. Medians before/after, ms: small 5.362/5.660; inference 5.741/5.943;
104 KiB ASCII source 6.553/6.654; 99 KiB Unicode source 6.069/6.351;
500 declarations 13.236/13.820. This first entity store has a small measured
Wasm frontend cost, roughly 0.1-0.6 ms on these fixtures; do not call it zero cost.
An earlier trial before the attachment ownership simplification showed a similar
few-percent difference. Scripts/reports: build/profile-entities.mjs and
build/entities-performance.json.

Fresh native processes, 3 warmups plus 20 paired alternating samples: inference
total 112.376/110.364 ms; UTF-8 utility source 112.655/111.240 ms. Script/report:
build/profile-entities-native.py and build/entities-native-performance.json.

A local browser A/B probe suppressed only warm commands for the comparison arm,
opened Foundation, then switched to Functions. Desktop completion was 840.2 ms
without warmup versus 328.1 ms after warmup; mobile emulation 842.8 versus 328.0 ms.
The switch made one LLVM fetch in the lazy arm and zero in the warmed arm.
Current-run LLVM load was 389.6/0.1 ms desktop and 393.9/0.0 ms mobile; warmup itself
took about 585/582 ms beforehand. This moves startup work earlier rather than
eliminating it. This is one local sample per arm/device, not a statistical claim
or a physical mobile benchmark. Reproduce with build/profile-entities-warm.mjs;
results are in build/entities-warm-profile.json.

### Final validation

Environment: Windows Node v21.7.3, WSL Orchestral-Revng, host Clang/LLVM 19,
WASI SDK 34; Release browser compilers with optimized LLVM, no exceptions,
TOWER_BROWSER_CROSS=ON and four build jobs. Commands/results:

- `bash playground/scripts/build-native.sh` builds the independent seed and the
  normal compiler using the Tower entity/parser module.
- `TOWER_BOOTSTRAP_COMPILER=/root/.cache/tower/native/towerc-seed bash playground/scripts/test-native-core.sh`:
  all **4/4** ASan/UBSan suites pass (10.08 s in the final run). New checks grow
  1,000 component instances, verify 128-byte alignment and fixed payload addresses,
  query after swap removal, reject cross-store attachment, inject failed growth,
  reuse borrowed names, test type/destructor lifetimes and find real compiled
  program entities through the new type query API. Existing parser tree/capture,
  cleanup, diagnostics and scaling checks pass with Tower forest assembly.
- `node --test playground/tests/*.test.mjs`: **171/171** pass, including the entity
  library running with both 32-bit and 64-bit interpreter layouts, canonical text
  round trips, LLVM/Wasm execution and direct use of the real browser compiler's
  entity exports. Browser-compiler query tests grow/remove 300 instances.
- `npm run check:format --prefix playground`: all **23** Tower files equal their
  canonical formatting, including the new library, parser code and client fixture.
- `bash playground/scripts/test-bootstrap.sh`: all **12** module/target pairs
  produce byte-identical optimized LLVM and object files between the C++ seed and
  the compiler already using Tower nodes/tree assembly. Includes the composed
  entity/parser source on Linux x86-64, Windows x86-64, macOS ARM64 and Wasm32.
  Undefined-symbol allowlists and explicit grammar-input checks pass.
- `bash playground/scripts/test-linking.sh`: native executable/archive callbacks,
  memory/storage, native-to-Wasm compilation, real LLVM C API linkage, platform
  I/O and forward module bindings all pass.
- `npx playwright test`: final **100/100** desktop/mobile tests pass (2.5 min),
  including automatic LLVM preload on syntax-only documents, first-program worker
  reuse, disabled-target behavior, native-target warming/cancellation, current-run
  timings, typing debounce, inline diagnostics and parse-worker reuse.

Logs: build/entities-native-final-tests.log, entities-node-final-tests.log,
entities-format-check.log, entities-bootstrap-final.log, entities-linking.log and
entities-browser-final-tests.log. Earlier failed browser/sanitizer runs and their
causes are retained above rather than represented as uninterrupted success.
The existing LLVM CreateGlobalStringPtr deprecation remains unrelated to this port.
Unrelated working notes and todo.txt were not modified.

## 2026-11-18 - Entity/parser migration and preload published

Pushed implementation 0f09230. Pages commit 3bd85bf deployed the tested compiler
binaries and worker/UI bundles; workflow 44340239269 completed successfully.
Before publishing, all three built Wasm reactors were compared byte-for-byte with
the local dist assets used by the passing final 100-test browser run.

`node playground/scripts/verify-deployment.mjs https://trevorsundberg.github.io/tower/`
then confirmed all 22 remote asset hashes match that local build and verified
desktop/mobile execution agreement, editable grammar, persistence, forward module
bindings, native builds/downloads and equal columns. Logs are
build/entities-pages.log and build/entities-online.log; the report/screenshots
are in build/deployment-verification/. Live playground:
https://trevorsundberg.github.io/tower/.

The next parser migration is recognizer control/Match access and then LR table
construction and grammar installation on the Tower entity store. The production
node/forest algorithms have moved; the remaining C++ adapters and semantic/compiler
algorithms are still explicitly tracked work, not a completed self-hosting claim.

## 2026-11-18 - Generics bootstrapping after the entity-store migration

The user asked whether generics should come next and whether bootstrapping would
require implementing their semantics in C++. This entry records a recommendation,
not implemented generic syntax or authorization to start that implementation.

Inspected foundation.tower, core.cpp's type/header/layout and compilation paths,
core.hpp's shared semantic components, and the new entity-store ABI. Tower has
ordinary functions, structs, raw allocation, pointer arrays, external calls and
shared entity storage sufficient to express a specialization algorithm. It does
not yet expose a complete Tower-facing compiler transformation/type API, a generic
instantiation stage, first-class source-language Type values, or general user
compile-time execution. Much semantic metadata is still C++ strings/vectors in
CoreNode/SyntaxNode components; access to the entity store alone does not expose
those payloads safely or make generic calls resolve automatically.

Recommended next milestone: a small Tower compiler-transformation API followed by
explicit type-parameter specialization and one reusable typed growable vector.
Start with scalar/pointer elements already supported by ordinary function calls.
Aggregate by-value copying, ownership/copy/destruction policies, constraints,
generic argument inference and general compile-time metaprogramming need separate
contracts; generics must not silently invent them. This would support the parser
port rather than replace the goal of moving actual compiler algorithms into Tower.

The bootstrap can remain acyclic:

1. Write the first specializer using only today's nongeneric Tower constructs.
2. Compile it with the existing compiler into a native/Wasm object and link it
   into the next compiler, just as entities.tower and parse-tree.tower are linked.
3. Add a narrow host bridge for syntax/component access, type identity/resolution,
   diagnostics and invocation at the appropriate semantic stage. The old seed
   only needs to compile the nongeneric implementation; it need not implement
   generic specialization itself. An unsupported-generic diagnostic/seed adapter
   or an explicitly supplied prior bootstrap executable can preserve that boundary.
4. Once the new compiler supports generics, migrate compiler collections to them.
   Do not make the first specializer depend on its own not-yet-built feature;
   later checked-in bootstrap compiler binaries can remove that restriction.

Generic syntax can use Tower grammar declarations, while semantic specialization
operates on the existing shared entities. It must substitute bound type parameters,
clone/remap local bindings correctly, preserve definition/use provenance, and
produce ordinary concrete Foundation structs/functions for current checking and
lowering. Name-string replacement alone is insufficient. Cache instantiated
definitions by template identity and semantic arguments within an explicit target/
semantics context; recursive instantiation needs in-progress entries and bounded,
useful diagnostics. Generic symbol lookup can remain module-style without changing
the ordered activation of parse declarations.

This proposal is compiler code written in Tower and called by the compiler; it
does not require arbitrary source programs to execute compile-time code against
host pointers. A portable interpreted compiler-pass path will need explicit APIs
or shared target-memory representation rather than passing native pointers into
the current guest-memory interpreter. No independent public IR or binary format
is proposed: specialized output remains shared nodes with compilable Foundation
text. No generics code, syntax choice or runtime behavior changed in this discussion.

## 2026-11-18 - Original type-function notes and the combined compiler/runtime

The user requests parenthesized type application (`vector(int)`, `Vector(i32)`),
eventual first-class types, and implementation of templates followed by more
compiler migration into Tower. They explicitly require the existing generic
entity/component representation for templates, AST/parser nodes, foundation
operations and rules. No alternative authoritative IR is permitted.

Read the original todo.txt without changing it. Relevant earlier notes:

- Line 10 combines compiler/runtime and executes Tower during compilation to
  generate more Tower instead of introducing a separate template language.
- Lines 311-322 propose compile(expression), compile-stage WASI hooks, access to
  the compilation directory plus explicitly supplied folders, and compilation
  as stages that can resume with more data. This supports compile-time file I/O
  as an intended direction, not a claim that it is implemented today.
- Lines 2030-2064 explicitly show container(i32) and a function receiving a
  compile-time type/typeid and returning another type usable in annotations.
- Lines 2534-2537 explore dependent parameter types, including a type parameter
  appearing after the value whose type depends on it.
- Lines 3533-3571 explore type declarations as syntax over compile-time type
  values and type-producing functions, with static-member behavior left open.
- Lines 5555-5562 say a generated type is a component tree with type information,
  not a separate bound-type representation. Lines 7334-7433 explore extensible
  type behavior, type variables and unresolved/forward dependencies.
- These are exploratory notes: lines 1488-1497 prefer shared generic code for
  rapid development with optional later specialization; lines 2135-2142 discuss
  nominal versus structural identity, and 7047-7052 revisit sharing/cloning and
  optional runtime type information. They do not settle one universal identity
  rule or promise free code generation/performance.

Correction/clarification to the preceding generics-bootstrap entry: its explicit
specializer is a possible first implementation step, not the desired permanent
language model. The user has now authorized implementation. Preserve the path
to ordinary Tower functions accepting and returning first-class types, with
parentheses, and ordinary Tower control flow for eventual metaprogramming.
The user describes this as Zig-like in spirit; no Zig compatibility or finalized
comptime syntax has been specified.

Reconcile compile-time I/O with the existing deterministic-execution requirement:
use explicit inputs/capabilities, track file contents and any other observable
filesystem facts, and invalidate dependent work on change. Do not accidentally
memoize or reorder effectful calls, use ambient host state for target queries,
or expose native pointers to the guest interpreter. Runtime type values can
support reflection/dynamic storage/later compilation, but cannot retroactively
change an already compiled static layout. Keep type identity, finalization,
recursive dependencies, target layout and effect policies explicit.

Updated AGENTS.md and docs/foundation.md with this direction and outstanding
tasks. This entry is design/source research; no generic implementation, general
compile-time evaluation or compile-time filesystem API is claimed here. Next:
implement a bounded type-function/specialization milestone in Tower, with shared
node components and reference/round-trip/backend tests, then move further parser
metadata/control over that same substrate.

## 2026-11-18 - Tower type functions, specialization and shared syntax copying

Implemented parenthesized type application with the existing Foundation call
and type rules: fn box(T: type): type can return a local struct, and
fn identity(T: type, value: T): T specializes through identity(i32, 42).
Type parameters may occur after dependent value parameters. No angle brackets,
precedence hierarchy, separate template expression language or public IR was added.

compiler/generics.tower is real compiler code compiled by the nongeneric seed
and linked into native, browser frontend, LLVM-Wasm and CPU-cross reactors. It is
composed with library/entities.tower and compiler/parse-tree.tower, and uses their
actual Entity pointers/storage/relationships directly. GenericTemplate,
GenericInstance, GenericOrigin and GenericContext are components on shared nodes.
The context's instance chain is a derived index scoped to one program/target.
The pass discovers parameters, creates/reuses instances by definition and semantic
type arguments, binds parameters and evaluates the bounded type-function form.
Instances publish before field/body checking so recursive references share them.

C++ integration still resolves types, checks/lowers concrete nodes, interns
semantic type arguments and supplies access to remaining C++ payloads. Type
bindings are attached to instance scope and consulted in type positions; identifiers
in value positions are not textually replaced. Original definition/use nodes and
existing replacement history survive cloning. Errors retain source spans and a
bounded instantiation chain in line/column terms. Concrete definitions serialize
through the existing formatter to re-compilable Foundation with collision-checked
quoted names, e.g. `box(i32)`. Source formatting retains the original template.

The initial type-function evaluator deliberately accepts only type arguments and
one optional local struct followed by return, or returning an existing type/type
call. Arbitrary staged control flow, first-class runtime type values, compile-time
value arguments/inference and compile-time filesystem capabilities remain planned.
Exported/foreign templates require a concrete wrapper; aggregate by-value calls
remain rejected. Bounds: 64 parameters, 256 instances, 65,536 copied syntax nodes
and 128 nested type-resolution steps, plus existing Foundation resource limits.

Added library/vector.tower: raw typed storage, explicit init/reserve/push/dispose,
geometric growth, overflow checks and failure preserving storage. Scalar/pointer
push is supported; aggregate copy/destruction policies are not invented. The new
Templates playground example demonstrates two scalar instances, nesting and a
type argument declared after its dependent pointer parameter. Both existing
workers compile/execute the same source automatically.

Also moved the parser replacement expander's actual subtree copying into Tower.
The shared copier preserves ordered/named children, Match metadata and replacement
provenance; it is not an arbitrary component bitwise copier. The C++ expander still
maintains its derived normalized-node set and most rewrite control. A first recursive
Tower copier trial imposed a new depth bound; replaced it with an explicit growing
work stack to retain deep-tree behavior. A 600-level native test, partial-copy
failure and allocator-failure cleanup now cover that path.

Findings/fixes from trials:
- Constructor-local struct names must resolve lexically inside their own fields;
  the first test rejected Node* while constructing list(i32). Fixed self binding.
- Types instantiated after the module's initial layout pass need layout before
  field offsets/pointer strides are consumed, plus final layout validation.
- Array interning by display name let a user struct named `i32[2]` collide with
  the fixed array i32[2]. Composite identity now uses element type and length;
  templates preserve both distinct nominal and composite identities.
- Removed per-function template component allocation when no template is present.
- Bootstrap dependency checks initially rejected Wasm __memory_base (relocatable
  literal data) and Darwin bzero (backend zero-fill lowering). These are linker/
  system-runtime dependencies, not an added Tower shim; the allowed-symbol check
  now records them explicitly. Other unexpected dependencies still fail.

Validation on Windows/WSL Orchestral-Revng, clang/LLVM 19 native, WASI SDK 34,
Release browser LLVM with assertions disabled:
- node --test playground/tests/*.test.mjs: 177/177 pass, including interpreter
  layouts 4/8, LLVM-Wasm differential results, canonical round trips, recursion,
  forward names, nominal distinctions, shadowing, effect counts and failures.
- npx playwright test in playground: 102/102 desktop/mobile pass. Inspected
  build/templates-desktop.png; both execution columns agree. Worker cancellation,
  preload, debouncing and existing grammar/error UI checks continue passing.
- TOWER_BOOTSTRAP_COMPILER=/root/.cache/tower/native/towerc-seed
  bash playground/scripts/test-native-core.sh: 4/4 ASan/UBSan suites pass.
  The C++ tests/bridge are instrumented; the generated Tower objects are not
  claimed to have received an independent full memory-safety proof.
- bash playground/scripts/test-bootstrap.sh: all 12 utility/target pairs have
  identical seed/full optimized LLVM and object output, now including the
  specializer in the composed entities module. Explicit grammar-input checks pass.
- bash playground/scripts/test-linking.sh: native executable/object/archive,
  raw memory, storage helpers, LLVM C API, platform ABI and forward bindings pass.
- npm run check:format --prefix playground: all 26 Tower sources are canonical.
- build/generics-target-check.sh: Templates prints 42 / 9000000000 / 7 natively;
  emits Wasm, Windows x64 COFF, macOS ARM64 Mach-O and Linux ARM64 ELF objects.
  Initial --library trial correctly rejected its top-level effects; --emit object
  is the appropriate mode for a program object containing tower_main.

Logs: build/generics-{native-final,wasm-final,llvm-final,asan-final,node-tests,
browser-tests,bootstrap,linking,format-check,targets}.log. Reproduce normal builds
with playground/scripts/build-native.sh, build-wasm.sh and build-llvm.sh (the
latter with TOWER_BROWSER_CROSS=ON and the explicit native bootstrap path).
build/profile-generics.mjs alternates published 3bd85bf and current runtimes with
their own Foundation modules: 12 warmups, 40 samples of compile plus formatting.
Median before/after milliseconds: small 6.387/6.500, inference 6.494/7.034,
replacement example 27.376/27.719, 500 declarations 22.441/23.096. Recorded in
build/generics-performance.json; modest measured overhead, not an instant-time
or universal performance guarantee.

The user further makes the endpoint explicit: no project-owned C++ or C remains,
including bootstrap sources; keep portable Tower compiler binaries for supported
Windows/macOS/Linux hosts and pure Tower sources, with LLVM/SPIR-V and other
third-party libraries remaining external until their separate translation.
Do not delete the last working seed before a tested Tower-built successor exists.
Next migration: basic parser payloads (Rule, Reference, String, Range, Match), then
remaining syntax/type/operation components, containers, parser/table construction,
semantic checking, formatting, interpreter, platform/driver/browser interfaces
and backend adapters. Each continues using the same shared entity model and
canonical Foundation semantics. This entry does not claim that full migration
or the portable self-hosting binary distribution is complete.

## 2026-11-18 — Deterministic runtime rationale and templates deployment

The user clarified that deterministic execution is essential because the compiler
will invoke ordinary Tower code when evaluating constants. This strengthens the
combined compiler/runtime direction: constant evaluation is an execution stage of
the same language, with shared operation semantics, not a second host-dependent
evaluator. Identical code, explicit inputs, semantics version and selected target
description must give identical defined results on Windows, macOS, Linux and Wasm.
Target sizes/layouts come from that explicit target; file reads and other effects
must be declared/tracked inputs. Relaxed runtime policies cannot silently affect
constant evaluation. General ordinary-function constant evaluation and complete
strict floating-point/effect policies remain work to implement and test; the
initial type-function evaluator is deliberately bounded, not that entire facility.

Published the templates milestone ea3d6bd as gh-pages commit 35826d9. GitHub Pages
workflow 44354419779 succeeded. Ran `node playground/scripts/verify-deployment.mjs
https://trevorsundberg.github.io/tower/`: all 23 deployed assets match the local
build; desktop and mobile verify backend agreement, forward module bindings,
editable grammar, persistence, native builds/downloads and equal columns. The
Templates example is included. Log: build/generics-online.log.

Continuing migration with parser component payloads (rule, reference, token string,
range and match). These must use the existing generic entity/component store and
Tower-owned vector storage; the native adapter is temporary. Do not delete the
last working seed before validating its successor. The final endpoint remains
pure Tower project-owned source and portable compiler binaries, not a permanent
C++ bootstrap.

## 2026-11-18 — Ordinary execution for constants; selectable determinism profiles

User clarification: `5 + 5` during compilation means running Tower's own addition
operation. Constant evaluation must not be a separate arithmetic mini-language or
an independently implemented folding semantics. Optimizers may simplify ordinary
execution when they preserve that execution's contract. Extend the same principle
to ordinary user functions invoked during compilation.

The user wants normal runtime execution to run as natively and efficiently as the
platform allows; a strict cross-host execution mode should be explicit. For
cross-compilation and compile-time computation, select an execution/semantic
profile that fixes primitive behavior across hosts. A proposed profile could model
PC x86-64-like little-endian primitives, executing directly where equivalent and
wrapping, sanitizing or emulating differing operations elsewhere. Architecture
names alone are insufficient: define integer widths and overflow, floating-point
rounding/NaNs/contraction/subnormals, byte order, pointer/address observations,
layouts, invalid accesses and effects. Do not accidentally inherit C++ undefined
behavior, LLVM poison or the host's floating-point environment.

Keep compiler host, output target description and execution semantics profile
distinct, explicit inputs. Compile-time target queries use the selected output
target, even when evaluation uses a portable strict execution profile. A program
may declare required/supported execution profiles, similarly to supported target
capabilities. Runtime native/relaxed behavior remains defined by its selected
profile; native speed does not implicitly authorize unrelated fast-math changes.
Include profile/version, target and tracked effects in dependency/cache identity.

Optimized LLVM/native code is a valid future execution engine for strict evaluation
IF all operations obey the chosen profile. The interpreter is a portable reference
path, not the only allowed engine. Direct native instructions require an established
equivalence; wrappers/emulation handle operations that differ. Differential tests
must compare interpreter, optimized execution and hosts for both values and defined
effects. These profiles and general compile-time function execution remain design
direction; the current bounded type-function evaluator does not implement them.

## 2026-11-18 — Shared character grammars versus specialized token matching

The user asked whether regex compilation already uses Tower parsing tables and
whether token recognition should use the same parser. Inspection corrected a
potentially misleading description: token/skip declarations and their pattern
text are parsed through Tower's declaration grammar, but lex-pattern.cpp contains
a separate hand-written recursive-descent regex compiler (Thompson-style NFA
construction and subset construction). It is not std::regex or a third-party regex
library, and it does not currently parse regex syntax with Tower's LR tables.
Its history was already present in checkpoint 8571a8d; the inspected history does
not establish which person originally wrote it. The current migration moves DFA
storage and matching into Tower, not that entire regex compiler yet.

Tower's raw UTF-8 stream and character-range grammar symbols already demonstrate
that LR terminal symbols can be characters. A fixed conflict-free LR grammar can
recognize character input in linear time with amortized constant work per input
symbol. This does not imply the same instruction count as DFA scanning: stack
operations, reductions and optional node construction add costs. Do not allocate
an AST node for every identifier character merely to unify grammar descriptions.
Grammar construction/update cost is separate from steady-state recognition cost.

Research supports sharing lexical and context-free syntax descriptions, but also
highlights disambiguation. Longest token matching, keyword boundaries, whitespace,
overlapping definitions and capture behavior need explicit semantics. Combining
grammars can introduce conflicts; generalized LR is not a free way to retain
Tower's deterministic/linear recognition contract. Similarly, repeated longest-
prefix scans with arbitrarily long failed lookahead need a separate work bound;
one linear automaton scan does not prove an entire tokenizer is linear.

Proposed direction (not implemented by this payload migration): parse regex
notation with ordinary Tower rules; represent its character grammar on the same
entities; specialize proven eligible regular regions to DFA tables while using
the general parser for richer structure. Preserve token-selection semantics,
captures, provenance and errors. Tables are derived caches, not a competing
authoritative grammar. Benchmark against both reference character parsing and
the existing matcher before promising equivalent speed; report conflicts rather
than silently changing parsing algorithms.

Primary sources consulted:
- van den Brand, Scheerder, Vinju and Visser, Disambiguation filters for
  scannerless generalized LR parsers: https://ir.cwi.nl/pub/4306
  (integrated lexical/context-free syntax and explicit ambiguity filters).
- GNU Bison calling convention: https://www.gnu.org/software/bison/manual/html_node/Calling-Convention.html
  (character codes may be terminals).
- Flex matching: https://westes.github.io/flex/manual/Matching.html
  (longest match and equal-length rule priority).
- Flex performance: https://westes.github.io/flex/manual/Performance.html
  (small scanning loop, backup/trailing-context costs).

## 2026-11-18 — Approved: one symbol-stream grammar with proven DFA specialization

The user approved implementing shared grammars for character and token streams,
with regex notation as shorthand for grammar rules over characters. Both stream
kinds supply integer symbol IDs (plus positions/optional existing entities); input
decoding and tokenization are adapters, not a second grammar semantic model.

DFA specialization should apply to eligible token rules too. Example: the token
sequence `'for' 'each' 'do' 'not' ';'` is a finite-state chain. Alternatives and
repetitions also qualify when their semantics can be represented by finite state.
Recursion alone is not a disqualifier: right-linear `A = 'x' A | empty` is regular.
Unbounded balanced nesting requires stack state. Eligibility analysis must be
conservative; do not promise to decide regularity for every context-free grammar.

LR already combines finite-state control with a stack. The intended optimization
removes provably unnecessary stack work, not merely renaming LR states as a DFA.
Preserve the same accepted input, selected production, captures, replacements,
entity structure, source spans, errors and surrounding lookahead decisions.
Suppressing character-level nodes is only legal where those nodes are not part of
the declared result. Complexity includes required output size. A standalone rule
being regular does not authorize greedy consumption that changes its caller's
parse. No silent GLR/backtracking fallback for grammars outside the deterministic
contract. Keep LR available for ineligible rules and as a differential reference.

Implementation sequence: finish/publish the current Tower payload and matcher
migration; unify regex syntax/lowering with shared grammar nodes; add bounded,
proven character/token DFA cases with LR equivalence tests (including overlapping
prefixes, captures and error boundaries); expand eligibility based on evidence.
This approval adds to the ongoing full self-hosting migration and does not replace
it. As of this entry, the unified regex grammar and generic parser specialization
are authorized work, not completed features.

## 2026-11-18 — Tower-owned parser payloads and lexer matching

Moved Rule, Reference, String, Range and Match component fields/ownership from
parser.cpp into compiler/parser-nodes.tower. They remain components of the actual
shared entity store. Names, capture labels and decoded token IDs use the new
vector(T) library; the native adapter holds no duplicate payload layout. Consumers
use opaque accessors. Creation on an existing component now preserves its payload
instead of placement-constructing over live owned strings (a pre-existing leak
hazard); the seed reference has the same corrected behavior. Allocation failure
returns from Tower setters leave prior values intact; the existing native API
still treats unrecoverable setter allocation failure as fatal.

Moved compiled lexer alphabet/transition/acceptance storage and the maximal-prefix
matcher into compiler/lexer-table.tower. Transition rows are contiguous. Unicode
decoding uses the existing Tower codec; binary alphabet lookup and longest accepted
prefix behavior match the reference. Table append failure preserves logical rows,
even if an earlier reserve has already increased capacity. Regex syntax parsing
and NFA/DFA construction remain native for now, as corrected in the earlier
scannerless journal entry. This is not yet the approved shared-regex grammar work.

The build now has an acyclic intermediate stage: towerc-seed compiles the Tower
entity store, parse forest and generic specializer; towerc-stage1 uses them and can
compile generic parser/lexer payloads; towerc links the resulting objects. The
explicit host-bootstrap option must name a template-capable compiler for those
modules. Old payload/matcher implementations live only in bootstrap references,
not the production targets. Final deletion of all project-owned native code,
including seeds/adapters, still depends on validated self-hosted successors and
the requested portable binary distribution. We have not reached that endpoint.

Repaired the older Windows parser test script, which manually listed native
sources and omitted the migrated Tower objects. It now uses the same CMake graph,
accepts a native bootstrap compiler, or bridges to the WSL intermediate compiler
to emit Windows COFF modules before MSVC links the native test executable.
Initial trials exposed WSL shell handling of Windows backslashes and Windows
PowerShell interpreting ordinary native stderr status lines as terminating errors;
use `wsl --exec`, normalize paths, and explicitly check the exit status. The first
payload extraction also needed a UTF-8 wrapper declaration in the seed. The
dependency audit initially rejected tower_allocate after adding the table object;
it is the expected allocator primitive and is now explicitly allowed.

Validation (Windows host, WSL Orchestral-Revng, LLVM 19, WASI SDK 34):
- `bash playground/scripts/build-native.sh`, `build-wasm.sh`, and
  `TOWER_BROWSER_CROSS=ON TOWER_BUILD_JOBS=3 ... build-llvm.sh` passed. Cross builds
  used TOWER_BOOTSTRAP_COMPILER=/root/.cache/tower/native/towerc-stage1.
- `bash playground/scripts/test-native-core.sh`: 4/4 ASan/UBSan suites passed.
  Native C++ is instrumented; generated Tower objects do not yet carry sanitizer
  instrumentation. Payload tests cover defaults, self/subspan assignment,
  removal/recreation, growth, overflow and injected allocation failures.
- `scaffolding/tests/run.ps1 -Optimize`: MSVC native parser/core/storage/entity
  tests passed using the cross-compiled Tower objects.
- Lexer differential test: 500 randomized automata, 20 inputs each, every byte
  offset including EOF/beyond EOF, Unicode, embedded NUL and malformed/truncated
  UTF-8; compare against the seed. Test both first and second reserve failures.
- `bash playground/scripts/test-bootstrap.sh`: all 16 module/target pairs have
  identical optimized LLVM and object bytes (Linux x64, Windows x64, macOS ARM64,
  Wasm). Generic payloads/matcher compare stage1 versus final compiler.
- `node --test playground/tests/*.test.mjs`: 177/177; Playwright: 102/102 desktop
  and mobile. All 28 Tower source files satisfy canonical formatting.
- Paired Wasm profile against published ea3d6bd/Pages 35826d9: 12 warmups and 40
  alternating compile+format samples. Median milliseconds: small 6.066 -> 5.961;
  inference 6.806 -> 7.058; replacements 22.425 -> 22.408; 500 declarations
  15.479 -> 16.382. This does not establish a general speedup; the largest measured
  overhead here is about 0.9 ms. build/profile-parser-payload.mjs and
  build/parser-payload-performance.json reproduce/record the trial. An earlier
  exploratory invocation reused an old baseline label; this dedicated report
  records the actual deployed baseline correctly.

Logs: build/parser-payload-{native,wasm,llvm,asan,windows,node-tests,bootstrap,
browser,format-check}.log. Next: shared regex grammar and safe symbol-stream DFA
specialization, alongside continued migration of native semantic payloads and
parser algorithms. Higher-level grammar/foundation components, LR construction/
control, formatter, interpreter, backend/driver and native adapters remain to port.

## 2026-11-18 — Regex syntax now uses Tower's ordinary character parser

Implemented the first shared-grammar step. compiler/regex-grammar.tower builds
ordinary Rule/Reference/String/Range entities for regex notation; production
lex_pattern_compile parses with the existing LR engine and raw Unicode-scalar
stream. The grammar handles sequences, choices, grouping, suffix operators,
character classes and escapes. The resulting parse tree is retained on the same
entity model by the compiled pattern; DFA arrays remain derived caches. A narrow
compiler-grammar.cpp construction ABI bridges the current native API. The old
hand-written reader moved to bootstrap/lex-pattern-seed.cpp for seed builds and
differential tests. NFA/DFA lowering still lives in C++ and reads the parsed nodes;
this does not yet finish the broader regular-rule compiler or all native migration.

The class grammar intentionally exposes dash entries; semantic range grouping
preserves escaped dashes, leading/trailing dashes and cases such as [a-b-c]. The
lowerer is iterative over the shared tree, with the existing 64 group-depth bound.
Empty fragments need no artificial epsilon node until a choice requires one.
Invalid pattern diagnostics use character positions. A source-wide UTF-8 check
prevents the raw stream's EOF-on-invalid-input convention from accepting a valid
prefix of a malformed pattern.

This exposed real LR-table bugs, not an ambiguity to resolve by priority:
- LALR lookahead unions contained overlapping ranges selecting the SAME reduction;
  conflict checking incorrectly called them reduce/reduce conflicts. Normalize
  overlapping/adjacent ranges with identical actions before table sharing/checking.
- StateBuilderEdge's ordering read the left reduction index when comparing the
  right edge. Correct it so different reductions remain distinct and real
  conflicts cannot be silently discarded. Tests check ordering, identical-action
  range unions, and genuine reduce/reduce conflicts.

Initial failures included a namespace collision between the parser Range payload
and the NFA range alias (rename ScalarRange), and a temporary source-generation
escape mistake (fixed before validation). A seed-token assertion was disabled in
release builds, allowing a failed immutable token definition to cause a later null
matcher crash; seed initialization now reports its error and aborts immediately.
The initial foreach CLI execution probe was the wrong fixture because that file
contains parse-only syntax; templates.tower correctly prints 42, 9000000000, 7.

Validation: native/WasM/LLVM+cross reactors build; 4/4 ASan/UBSan suites, optimized
Windows MSVC suite, 177/177 Node tests, 102/102 desktop/mobile browser tests and
all 16 bootstrap module/target pairs pass. The bootstrap output is identical in
optimized LLVM and object bytes. Added regex differential checks against the old
reader: 300 generated patterns, 500 randomized syntax strings, explicit escape/
class/nullability cases, embedded NUL and invalid UTF-8. Successful patterns match
the same byte lengths at every offset in generated Unicode/malformed inputs.
All 29 Tower source files pass canonical formatting. Logs: build/regex-shared-*.log.

Profile against published 478cbd4: 12 warmups plus 40 alternating warm compile+
format samples, median ms small 6.419 -> 6.127, inference 6.308 -> 6.267,
replacements 25.774 -> 23.812, 500 declarations 20.664 -> 21.078. The latter p95
was 25.422 -> 37.069, so these samples do not establish a universal speedup or
identical tail latency. Fresh-instance loads with Wasm code precompiled had
medians about 124.5 -> 121.1 ms (six measured pairs, with outliers on both sides).
Scripts/reports: build/profile-regex-shared.mjs, build/profile-regex-load.mjs,
build/regex-shared-performance.json, build/regex-shared-load.json.

Separately, the prior payload/matcher checkpoint 478cbd4 was deployed as cc985fe;
Pages workflow 44360016473 succeeded. verify-deployment.mjs confirmed all 23 assets
and desktop/mobile behavior online (build/parser-payload-online.log).

Next implementation: a conservative finite-state specialization for fixed terminal
sequences on either character or token streams, preserving captures/entities and
error context with LR as reference. Broader regular alternatives, recursive token
grammars and in-context regular subrule specialization remain authorized work;
do not describe the entire DFA direction or pure-Tower endpoint as complete.

## 2026-11-18 — Tower-owned symbol automata and the first parser DFA specialization

The user reaffirmed both ongoing tasks: finish moving project-owned native code
into Tower (including the bootstrap), and continue DFA specialization/sharing.
The endpoint remains checked-in portable Tower compiler executables per platform
which rebuild pure Tower sources. We are not self-hosted yet, and this entry does
not claim portable standalone compiler binaries have been delivered.

Implemented `compiler/automaton.tower`: derived NFA states/ranges, epsilon closure,
alphabet partitioning, deterministic subset construction, hashed subset lookup,
and bounded DFA emission. These operate on integer symbol IDs; UTF-8 decoding is
an adapter over the shared `lex_table_step` transition engine. Regex lowering now
uses these Tower-owned automata instead of the production C++ NFA containers and
subset builder. The original implementation remains an independent bootstrap/test
reference. The authoritative regex grammar/tree stays on shared entities; these
automata are disposable derived caches, not another public language or node model.

Parser tables also recognize a deliberately narrow proven case: a single nonempty
root production consisting entirely of terminals/ranges, at most 4096 symbols.
A Tower finite-state chain consumes character or token IDs without an LR stack
frame per symbol. Shared shift/reduction helpers preserve incoming entity identity,
payloads, captures, spans, root production and ownership. The equivalent LR states
are retained in the table for the existing diagnostic probes; the runner retains
one consumed-span bit per symbol for contextual errors. Prefix mode finishes at
the terminating boundary without lexing under the next grammar revision. Ordinary
LR remains available as a forced reference path and handles every other grammar.
Alternatives and right-linear recursion are regular in principle but are not yet
selected by this first specialization. We do not silently choose between LR
conflicts, add backtracking, or claim all regular subregions are recognized.

Significant trials and fixes:

- The first Tower chain returned a binary expression directly; Foundation returns
  operands, so it now binds the comparison result before returning it.
- Checked usize-to-i32 conversions initially left unresolved `tower_trap` imports.
  The bounded state-count checks were equality checks, and one conversion reloaded
  a count after allocation calls. Explicit upper bounds and retaining the proven
  local index let LLVM prove the conversions safe; no extra runtime dependency or
  unchecked reinterpretation was introduced.
- Work counters now report actual popped LR frames: zero in the finite chain,
  versus one per consumed terminal in the reference runner.
- Allocation injection was extended to fail each individual allocation in a DFA
  compilation. Every tested failure frees owned buffers; a partially emitted
  output table is discarded by the caller.

Validation so far (Windows host; WSL Orchestral-Revng, LLVM 19/native and WASI SDK
34): `build-native.sh`, `build-wasm.sh`, and `TOWER_BROWSER_CROSS=ON build-llvm.sh`
build successfully. `test-native-core.sh` plus the final CMake rebuild/ctest pass
4/4 with the native ASan/UBSan harness; `scaffolding/tests/run.ps1 -Optimize` passes
on MSVC. Tower-generated objects are not themselves automatically ASan-instrumented.
Tests compare fixed-chain trees/captures/errors with forced LR for character/token
streams, gaps and zero-length spans, early EOF, mismatches and extra suffixes in
both whole-input and prefix modes. Direct NFA simulation agrees with 150 generated
integer-symbol NFAs, including epsilon cycles, complement ranges, and symbols
outside Unicode. Existing regex differential tests (300 generated patterns, 500
syntax strings, Unicode/malformed inputs) pass. All 177 Node tests pass. All 16
bootstrap pairs produce identical optimized LLVM and platform object bytes across
Linux x64, Windows x64, macOS ARM64 and Wasm. All 30 Tower files satisfy canonical
format round trips. Browser UI tests are running; deployment will be verified after
the final build. Logs: `build/automaton-{native,asan-final,windows,wasm,llvm,node-tests,
bootstrap,format-check,browser}.log` (the successful native rebuild is also in the
ASan/bootstrap logs).

Remaining: port regex tree-to-automaton lowering and LR analysis/control; support
character grammar lowering beyond regex shorthand and recursive token rules;
extend output-preserving specialization to more proven regular regions. Semantics,
type checking, formatting, interpreter/driver/backend bridges and native bootstrap
stages also remain to migrate. Do not confuse a shared regex-syntax reader with
completed arbitrary scannerless/recursive lexical grammar support.

## 2026-11-18 — Regex tree lowering is now Tower code; bootstrap retirement remains the endpoint

Continued the user-requested migration after the symbol-automaton checkpoint
`f03f1e9`. `compiler/regex-lowering.tower` now implements traversal, alternatives,
concatenation, repetition, character classes/ranges, escaped scalar decoding,
fragment patching and lowering diagnostics. It reads the actual shared entities
and Tower-defined ParserMatchData through the entity API; it does not copy the
tree into another semantic representation. An iterative borrowed-node visit stack
and fragment/patch arenas replace the old native unordered_map of fragments.
The derived automaton is then compiled by `compiler/automaton.tower`.

Production `lex-pattern.cpp` is reduced to a temporary wrapper for the still-native
parser entry points, grammar caching, source validation and diagnostic string
formatting. Its regex semantic traversal and NFA/DFA algorithms are no longer C++.
The reference seed remains intentionally independent until the complete compiler
has a validated Tower-built successor. There are no new native semantic adapters:
the lowering module imports existing Tower entity APIs and receives the shared
Match component type from its caller. Its source remains canonical Foundation text.

An initial edit attempt used the Windows `python` app alias, which has no installed
interpreter in this environment; it made no source change. The native-wrapper edit
was then applied with PowerShell. The initial compile-only test had consequently
linked the new Tower module without calling it; validation was repeated after
switching the production wrapper. This distinction matters: a linked, unused port
is not evidence that the port executes.

The native tests now inject failures at every allocation during a complete regex
lowering/compilation and verify no live-buffer increase. The retained input entity
tree's full debug representation is unchanged after all failures and success.
Existing randomized regex/reference and integer-symbol automaton comparisons also
exercise the actual Tower implementation. The signed accepting-state conversion
has an explicit local nonnegative proof, preserving checked-conversion semantics
without introducing a trap runtime dependency in compiler modules.

Migration order remains to port LR grammar analysis/table generation and parser
control, incremental grammar application, semantic/type components and checking,
formatting, interpreter/compilation control, backend/FFI integration and the CLI.
The precise split can follow prerequisites, but it must not leave an owned C++
adapter or seed behind at the endpoint. LLVM and other external libraries can
remain native; their interfaces must be callable from Tower (e.g. existing C APIs
where available, explicitly supported ABI where needed). Do not relabel our own
wrappers as third-party code to satisfy the goal superficially.

Portable checked-in compiler binaries are still future work. Before replacing the
bootstrap sources, require self-rebuild/stage agreement and execution tests on each
supported platform, reproducible explicit target/profile inputs, a bootstrap
manifest/provenance, and dependency checks showing no undeclared LLVM/SDK/runtime
installation is required. Current WSL native development binaries dynamically use
the installed LLVM library and are not the promised dependency-free distribution.
No last-known-working bootstrap is removed before that successor is validated.

This stage does not complete arbitrary recursive character/token grammar support
or the optimizer for all regular parser regions. The new shared integer-symbol
automaton engine and fixed-terminal-root specialization are implemented; extending
their eligibility must preserve captures, node outputs, conflicts, source context
and grammar revision boundaries, with ordinary LR as the reference.

Validation of the active port: 4/4 native ASan/UBSan-harness tests, optimized MSVC
tests, 177/177 Node tests, 102/102 desktop/mobile Playwright tests, 31 canonical
Tower source round trips, and all 16 optimized-LLVM/object bootstrap comparisons
pass. The browser parser, LLVM reactor and cross-target reactor were rebuilt.
Commands: `test-native-core.sh`, `scaffolding/tests/run.ps1 -Optimize`,
`build-wasm.sh`, `TOWER_BROWSER_CROSS=ON build-llvm.sh`, `node --test
playground/tests/*.test.mjs`, `npm run check:format --prefix playground`,
`npm run build --prefix playground`, `npx --prefix playground playwright test
--config playground/playwright.config.mjs`, and `test-bootstrap.sh`.
Logs are `build/regex-lowering-{asan-final,windows,wasm,llvm,node-tests,format-check,
browser,bootstrap}.log`.

Measured performance, not a speedup guarantee:

- Paired warm Wasm compile+format versus published `4ecb3bd`, 12 warmups/40 pairs:
  median milliseconds small 5.607 -> 5.504; inference 5.906 -> 5.885;
  replacements 19.897 -> 20.466; 500 declarations 22.544 -> 21.875.
- Native optimized Linux x64: rebuilt the C++ regex-lowering file from `f03f1e9`
  and relinked it against the same remaining current objects, isolating this port.
  Four warmups/24 alternating pairs, including process launch, LLVM/module load,
  compilation and interpretation: small median 132.587 -> 128.739 ms; 50 new
  token declarations 542.991 -> 536.199 ms. The latter p95 went 564.064 ->
  579.961 ms, so these data support broadly comparable performance, not a universal
  improvement. `build/profile-regex-port-native.py` reproduces the reference link
  and samples; results are `build/regex-port-native-performance.json`.
- Fresh Wasm instances with code precompiled (2 warmups/8 alternating samples),
  versus `4ecb3bd`: upper-median module/grammar load 229.053 -> 238.158 ms;
  compiling/formatting 50 new token patterns 768.371 -> 785.282 ms. Fresh-load
  samples have substantial GC/runtime variance; the playground retains warm workers.
  See `build/profile-regex-port-load.mjs` / `build/regex-port-load.json` and
  `build/profile-regex-lowering.mjs` / `build/regex-lowering-performance.json`.
  The first native stress fixture attempted 100 new token declarations and correctly
  hit the existing 64-token-rule budget; it was reduced to 50 for a valid workload.

The previous regex-parser deployment (`4ecb3bd`, Pages `8435d16`) was verified
online before these new changes: all 23 assets matched and desktop/mobile checks
passed. This new checkpoint will be published and independently verified next.

## 2026-11-18 — Regex/automaton migration checkpoint published and verified

Pushed `f03f1e9` (Tower automata plus fixed terminal parser specialization) and
`afdb920` (Tower regex tree lowering) to master. Published the tested static build
as Pages commit `ae484e8`; GitHub Pages workflow
https://github.com/TrevorSundberg/tower/actions/runs/44369897453 completed successfully.
Ran `node playground/scripts/verify-deployment.mjs https://trevorsundberg.github.io/tower/`:
all 23 deployed assets matched the local build, and desktop/mobile checks confirmed
matching interpreter/Wasm execution, forward module bindings, editable grammar,
persistence, native downloads and equal output columns. Log:
`build/regex-lowering-online.log`.

The complete no-owned-C++ endpoint is still unfinished. The next major migration
is LR grammar/table construction and recognizer control, continuing to share
entities and proven DFA specializations. Keep the remaining semantic/type pipeline,
formatter/interpreter, backend/CLI adapters and bootstrap retirement in scope.
Portable per-platform bootstrap executables are not delivered by this checkpoint.
Existing unrelated working edits, including todo.txt, were preserved.

## 2026-11-18 — Tower-owned LR analysis, states and LALR actions

Continued the requested removal of project-owned C++, including the eventual
bootstrap, alongside shared character/token parsing and DFA specialization. This
entry supersedes the earlier status that LR table construction was entirely
native. It does **not** claim that the compiler is now wholly self-hosted or that
portable release bootstrap executables exist.

Implemented:

- `compiler/lr-analysis.tower` owns FIRST/nullable fixed points, sorted LR item
  sets, LR(0)/LR(1) closure, GOTO, and a queued lookahead propagation graph.
  Nullable suffixes include the originating lookahead only when the whole suffix
  is nullable. Self/cyclic propagation converges without recursive host calls.
- `compiler/lr-states.tower` owns LR(0) state discovery, kernel hashing/interning,
  geometrically resized hash buckets and transition construction. State numbering
  follows deterministic discovery order; hash iteration never determines it.
- `compiler/lr-lalr.tower` constructs lookahead dependencies from kernel closures,
  handles epsilon reductions in the current state, propagates spontaneous and
  inherited lookaheads, and emits shift/reduce actions. Construct-mode FIRST
  lookaheads still participate in ordinary conflict checking. No shift bias,
  speculative recognition, backtracking or grammar-order conflict priority was
  introduced.
- FIRST and lookahead sets reuse the existing `SymbolRange` type from the DFA
  module. Characters and token IDs follow the same algorithms, including IDs
  above Unicode. The existing fixed-terminal-root DFA shortcut still runs after
  LR construction/conflict checks. This does not expand DFA eligibility to all
  regular subgrammars or implement arbitrary recursive lexical rules.
- Removed 917 lines from production `parser.cpp`, adding 70 lines of adaptation.
  The Tower APIs consume a disposable numeric view of the existing entity-backed
  grammar. Production/symbol indices retain original rule/capture/provenance
  associations; these are analysis indexes, not a second authoritative AST or a
  public program/bytecode format. Successful table construction frees the analysis
  and borrowed-array adapters rather than retaining them for execution.
- `bootstrap/lr-analysis-seed.cpp` is an independent transitional C++ reference
  for seed/stage1 and differential tests. Production links the Tower definitions.
  CMake composition includes the three new modules for Linux, Windows and Wasm
  compiler builds and four-target bootstrap comparisons. This seed is still our
  own C++, and must eventually be retired along with the other bootstrap code.

Important trials and corrections:

1. The first compile used C-style boolean `||`/`&&`; Foundation intentionally
   does not have them. Integer bitwise operators are not boolean substitutes.
   Rewrote the conditions using ordinary `if`, without enlarging the grammar.
2. Kernel bucket modulo initially retained a `tower_trap` dependency because LLVM
   could not prove a loaded bucket count nonzero across calls. Guarding the local
   count before modulo proved the invariant and kept the existing import contract.
   No unchecked division semantics or new trap runtime was introduced.
3. An initial comparison adapter propagated through every full-state transition.
   Randomized action comparison failed: a partially overlapping range from another
   kernel is not the current closure's exact transition. Restored exact symbol/
   range identity in the reference, matching the prior production algorithm.
   The Tower implementation already used the closure's own symbol set. Real
   conflicting ranges remain for the ordinary conflict diagnostic, not silently
   partitioned or prioritized by this port.
4. The initial port regressed Wasm timings. Warm small-program medians went from
   5.247 to 6.330 ms, replacements from 17.967 to 21.739 ms; compiling 50 newly
   declared token patterns in fresh instances went from 480.886 to 874.395 ms.
   Tower's sorted insertions were shifting elements with individual struct copies,
   whereas C++ vectors used bulk moves. Replaced three element-shifting loops
   (ranges, LR items and symbol indices) with overlap-safe Foundation `copy`.
   Verified the contract in both `core-machine.cpp` (`memmove`) and LLVM lowering
   (`CreateMemMove`). The final measurements below include this correction.
   Initial measurements remain in `build/lr-wasm-performance-initial.json` and
   `build/lr-wasm-load-initial.json`, rather than being discarded.

Validation environment: Windows PowerShell, WSL Orchestral-Revng, optimized native
Clang/LLVM 19 build, WASI SDK 34, Node v21.7.3, optimized MSVC harness. Commands from
the repository root:

```text
wsl -- bash -lc 'cd /mnt/c/Sandbox/tower && bash playground/scripts/build-native.sh'
wsl -- bash -lc 'cd /mnt/c/Sandbox/tower && bash playground/scripts/test-native-core.sh'
wsl -- bash -lc 'cmake --build /root/.cache/tower/core-asan --parallel 3 && ctest --test-dir /root/.cache/tower/core-asan --output-on-failure'
.\scaffolding\tests\run.ps1 -Optimize -BootstrapCompiler C:\Sandbox\tower\build\parser-tests\host-bootstrap.cmd
wsl -- bash -lc 'cd /mnt/c/Sandbox/tower && TOWER_BOOTSTRAP_COMPILER=/root/.cache/tower/native/towerc-stage1 bash playground/scripts/build-wasm.sh'
wsl -- bash -lc 'cd /mnt/c/Sandbox/tower && TOWER_BOOTSTRAP_COMPILER=/root/.cache/tower/native/towerc-stage1 TOWER_BROWSER_CROSS=ON TOWER_BUILD_JOBS=3 bash playground/scripts/build-llvm.sh'
node --test playground/tests/*.test.mjs
npm run check:format --prefix playground
npm run build --prefix playground
npx --prefix playground playwright test --config playground/playwright.config.mjs
wsl -- bash -lc 'cd /mnt/c/Sandbox/tower && bash playground/scripts/test-bootstrap.sh'
```

The new native checks compare 150 randomized grammars' FIRST/nullable sets,
closure, GOTO, state numbering, transitions and LALR actions with the independent
reference. They also compare 150 cyclic propagation graphs across three rounds
of added dependencies/seeds, test all injected allocation failures in a complete
analysis/state/action-building fixture for leaks, and build a 512-symbol token
sequence to force hash-table resizing. Existing parse-tree ownership, captures,
nullable productions, conflicts, grammar revisions/boundaries, lexical patterns,
error repair, DFA/LR differential and linear recognition-work checks still run.
The ASan/UBSan harness instruments native code; the ordinary Tower-generated
object is not automatically sanitizer-instrumented. Allocation-failure and
differential tests exercise that code directly.

Final Wasm measurements against published `afdb920` / Pages `ae484e8`:
`node build/profile-lr-wasm.mjs`, 12 warmups plus 40 alternating paired samples,
compile plus Foundation formatting, median milliseconds:

| Fixture | Before | Tower LR |
| --- | ---: | ---: |
| Small program | 5.033 | 4.739 |
| Inference example | 5.420 | 5.135 |
| Replacements example | 17.984 | 16.611 |
| 500 declarations | 13.367 | 12.940 |

`node build/profile-lr-wasm-load.mjs` uses fresh instances with Wasm code already
compiled, two warmups and eight alternating samples (upper median). Load plus
baseline grammar installation: 172.992 to 156.887 ms. Compile/format 50 new token
patterns: 474.677 to 470.170 ms. These are measured fixtures, not a general speedup
guarantee. Results/scripts live under `build/lr-wasm-*` and `build/profile-lr-*`.

Native comparison used `wsl -- bash -lc 'cd /mnt/c/Sandbox/tower && python3
build/profile-lr-native.py'`: rebuild `01cb987:scaffolding/parser.cpp` using
`clang++ -std=c++20 -O3 -DNDEBUG -fno-exceptions -Iscaffolding`, then replace only
`CMakeFiles/tower-native-compiler.dir/scaffolding/parser.cpp.o` in the current
Ninja `towerc` link command. All other linked objects remain identical. Invoke
both binaries with `--interpret --bedrock scaffolding/bedrock.tower --foundation
scaffolding/foundation.tower`, four warmups plus 24 alternating paired samples.
The timed operation includes process launch, module/grammar loading, compilation
and execution. Median milliseconds:

| Fixture | Previous C++ parser | Tower LR |
| --- | ---: | ---: |
| `print(42);` | 117.747 | 106.630 |
| 50 new token patterns | 491.343 | 470.654 |
| 25 new Statement alternatives | 239.444 | 227.909 |

Token fixtures declare `token BenchN = /(a|bc)+[0-9]?xyN/;` for N=0..49, then
`print(42);`; rule fixtures declare `parse Statement |= 'benchN' ';';` for
N=0..24, then `print(42);`. Every measured invocation must output `42`.
Results: `build/lr-native-performance.json`; native reference artifacts and all
three profiling scripts remain in `build/` as local experiment artifacts.

Final validation: 4/4 native harness tests, optimized Windows tests, 177/177 Node
tests, 34 canonical/idempotent Tower-source format/tree/rule round trips, and all
16 bootstrap pairs passed. For each of utf8, bytes, entities and the composed
parser modules, seed/stage1 versus production optimized LLVM and object bytes
matched for Linux x64, Wasm, Windows x64 and macOS ARM64. This demonstrates
agreement of these cross-compilations, not execution testing on a macOS host.
The final desktop/mobile Playwright result and deployment are recorded below.
Logs: `build/lr-bulk-{native,wasm,llvm,asan,windows}.log` (Wasm is
`lr-bulk-wasm.log`), `lr-final-{node,format,bootstrap,web-build,browser}.log`.

Final desktop/mobile Playwright validation passed **102/102** tests in 2.3 minutes
against the build containing the bulk-copy fix. This includes live Bedrock and
Foundation edits, forward references, inline diagnostics and recovery, typed
operations, replacements, interpreter/LLVM agreement, cancellation and stale
result rejection, target downloads, and reused worker/runtime behavior. Publication
and online verification will be recorded separately after deployment completes.

Remaining ownership boundary: C++ still adapts shared grammar entities into the
numeric view, packs/shares runtime transition tables, normalizes action ranges
and formats conflict diagnostics. Stream ownership, recognizer stack/control and
diagnostic probing remain native as well. Next, move that runtime table/control
boundary into Tower while preserving grammar-revision boundaries, node ownership,
source spans, error contexts and amortized recognition work. Continue with the
incremental syntax pipeline, semantic/type components, formatter, interpreter,
backend interfaces and driver. Only after a Tower-built successor rebuilds and
passes the platform/reproducibility/dependency checks should the remaining native
seed be replaced by checked-in portable Windows/macOS/Linux executables. Current
development executables still rely on external native dependencies and are not
those portable distributions. No new public binary representation was added.

### LR migration deployment verified; next steering

Committed/pushed the LR migration as `9a1f5cb`; published the tested static build
as Pages commit `56e4c79`. GitHub Pages workflow `44377259487` succeeded:
https://github.com/TrevorSundberg/tower/actions/runs/44377259487.
`node playground/scripts/verify-deployment.mjs https://trevorsundberg.github.io/tower/`
passed: all 23 deployed assets matched the tested local bytes, and desktop/mobile
checks verified interpreter/LLVM agreement, forward bindings, editable grammar,
persistence, native compilation/downloads and equal result columns. Log:
`build/lr-online.log`; screenshots/report: `build/deployment-verification/`.

New user steering while verification completed: simplify the Templates example,
remove the incidental identity demonstration, and demonstrate a fixed-size
container with type and constant-integer size arguments plus a short `stack(T)`
with push/pop. Continue the compiler migration after that; the requested endpoint
remains zero project-owned C++ (including bootstrap), not merely LR construction.
The existing type constructor implementation currently rejects value parameters;
implement that missing capability rather than hardcoding an example's size in C++.

## 2026-11-18 — Short Templates example with integer type arguments

Implemented the requested example as `buffer(T, size)` containing `data: T[size]`,
then `stack(T)` containing a four-element buffer and a count. Generic `push` and
`pop` demonstrate real storage and print 20 then 10. Removed the identity and
other unrelated demonstrations from the example, retaining their regression tests.
The example deliberately assumes sufficient capacity/nonempty pop, consistent
with raw Foundation access; it is not a checked container library.

This needed integer arguments to type constructors, not just a cosmetic example
edit. Foundation's shared grammar now accepts numeric type arguments and named
array lengths. The Tower generic component binds all arguments of type-returning
functions and caches instances by their canonical argument entities. The existing
C++ semantic adapter interns typed integer constants on the shared node model,
checks the declared integer type/range, and resolves forwarded size parameters.
Ordinary generic functions still bind only their type parameters at specialization;
their ordinary value parameters remain runtime arguments. Concrete Foundation
output includes compilable struct names such as `buffer(i32, 4)`.

Limits: this is the existing explicit-specialization bootstrap extended to typed
integer literals/forwarded arguments. It is not arbitrary compile-time execution,
a separate constant-expression evaluator, or the final first-class type system.
Type constructors still use the existing optional local struct plus returned type
form. Array lengths retain the 1..1048576 and target storage limits. The C++ semantic
adapter is project-owned migration debt, not an exempt external library.

Validation on Windows/WSL Orchestral-Revng: optimized native and Wasm/LLVM builds;
native sanitizer harness 4/4; Windows optimized parser suite; Node 178/178;
Playwright 102/102 desktop/mobile; 34 canonical formatting/round-trip fixtures;
16 bootstrap comparisons (optimized LLVM and object bytes across Linux x64,
Windows x64, macOS ARM64, and Wasm). New tests cover reused/distinct lengths,
forwarded typed constants, 32/64-bit layouts, source/LLVM round trips, invalid
sizes and argument kinds. The final Templates suite is 7/7, also testing saved
older CoreTypeArguments grammar wrappers. Logs: build/template-values-*.log.
Commands: build-native.sh, build-wasm.sh, build-llvm.sh, test-bootstrap.sh,
scaffolding/tests/run.ps1 -Optimize, node --test playground/tests/*.test.mjs,
npm run check:format --prefix playground, and the full Playwright config.

Next: move runtime LR table normalization, action/goto lookup and parser control
into Tower. Full project-owned C++ removal and portable bootstrap executables
remain unfinished; this example does not change that endpoint.

## 2026-11-18 — Runtime LR rows and lookups are Tower-owned

Added compiler/lr-runtime.tower: sorted action normalization, overlap/conflict
detection, hash-interned shared rows, singleton-token hash lookup, range lookup,
sparse nonterminal GOTO lookup, and safe default reductions. These are disposable
indexes derived from the same grammar entities, not a new authoritative grammar
or public representation. Conflicts retain both alternatives for the existing
human diagnostic adapter; order does not choose a winning action.

Removed the native StateBuilder/StateTransitions implementations and their STL
action/GOTO maps (420 lines removed, 105 adapter lines added in parser.cpp).
Runtime action results are returned by value, avoiding a mutable temporary-pointer
cache. A default reduction still requires an explicit singleton EOF reduction and
every populated action to reduce the same rule, preserving grammar-revision
boundaries. Full-range arithmetic uses u64 so the u32 maximum does not wrap when
checking adjacent intervals. Singleton hash tables retain spare capacity so a
missing token terminates probing. Sparse range/GOTO lookup remains logarithmic
in grammar-table size, independent of source length.

The old-style implementation remains only as a transitional independent C++ seed
and test reference, using standard sorting/maps and linear reference lookup.
It is still project-owned migration debt and must ultimately be retired with the
portable bootstrap binaries. Recognizer stack/control, streams and diagnostic
presentation are the next parser pieces to move.

Validation: native optimized and Wasm/LLVM/cross builds; native ASan/UBSan harness
4/4; Windows optimized parser suite; Node 178/178; 35 canonical Tower source
format/parse round trips; 16 bootstrap pairs with identical optimized LLVM and
object bytes on Linux x64, Windows x64, macOS ARM64 and Wasm. Tower objects are
not themselves instrumented by the C++ sanitizer flags; allocation-failure and
ownership checks also run explicitly. Runtime differential tests compare both
whole-input and incremental modes on 150 random grammars, plus empty productions,
u32 boundary ranges, 128 deliberate hash collisions and shared rows. Every action
endpoint and its neighbors, missing GOTOs, defaults, conflict pairs and row counts
are compared. Allocation failures are injected through the complete LR pipeline.
Logs: build/lr-runtime-{native,wasm,llvm,asan,windows,node,format-check,bootstrap}.log.
Commands use the existing build-native/build-wasm/build-llvm/test-bootstrap scripts,
test-native-core.sh, scaffolding/tests/run.ps1 -Optimize, Node tests, and check:format.

The prior template change (3156273) is also published as gh-pages eb89110, Pages
workflow 44380620133 succeeded. verify-deployment.mjs verified all 23 online assets
and desktop/mobile compilation, execution agreement, edits and downloads; log
build/template-values-online.log. All custom C++ removal remains unfinished.

## 2026-11-18 — Tower recognizer control and finite-sequence specialization

compiler/lr-parser.tower now owns the recognizer stack, shift/reduce selection,
prefix completion, consumed-input tracking, reduction spans and work counters.
It uses a pull protocol: request input, shift, reduce, accept or report failure.
The remaining native wrapper supplies stream input and attaches shared entity
forests; it no longer implements the LR decision loop. Frames contain disposable
state/forest indexes and spans, never a second authoritative tree representation.

Moved the existing proven terminal-sequence eligibility check and LR-state mapping
into lr-runtime.tower, and its execution into the Tower control module. The DFA
path still avoids a per-token LR stack; it keeps compact consumed-input evidence
for error context and joins captured forests as symbols arrive. Whole-input mode
checks EOF, while prefix mode finishes at the declaration boundary without reading
the next grammar revision. Ordinary LR prefix fallback performs EOF reductions on
the current stack once; there is no speculative parse, rewind or retry.

The native parser.cpp change removes 193 lines and adds 91 lines of pull/forest
adaptation. The transitional C++ reference/seed remains independently implemented
with vectors and straightforward control, and is still migration debt. Stream
callbacks, diagnostic presentation/probes, grammar entity indexing, syntax and
semantic/compiler pipeline code remain to move. This is not the full C++ removal
or the portable-bootstrap-binary endpoint.

Validation: native optimized and Windows optimized suites; native sanitizer harness
4/4; Node 178/178; Playwright 102/102 desktop/mobile; 36 canonical Tower formatting
and parse round trips; 16 bootstrap pairs with identical optimized LLVM and object
bytes on Linux x64, Windows x64, macOS ARM64 and Wasm. The existing DFA-versus-LR
tests verify trees, custom payloads, captures, spans, diagnostics at every prefix,
no extra stream reads and lower action/stack work. Added direct reference-control
comparisons (bounded to 512 decisions per generated trace) for both modes, complete,
incomplete, trailing and stream-error inputs, comparing frames, spans and counters.
Injected allocation failures cover stack/evidence growth and runtime specialization;
optional specialization failure falls back to LR without changing acceptance.
Logs: build/lr-control-{native,wasm,llvm,windows,asan-final,node,browser,bootstrap,
format-check}.log. Commands are the existing build/test scripts and full suites.

Performance measurements, not universal guarantees: table-only migration c251eee
versus 3156273, native optimized process startup/module load/compile/interpret,
4 warmups plus 24 alternating pairs, median milliseconds: small 123.221 -> 110.355,
50 token declarations 521.557 -> 492.241, 25 parse extensions 275.442 -> 245.518.
The native reference binary replaces only parser.cpp's object, keeping other objects
identical. Warm Wasm table-only compile plus Foundation formatting (12 warmups,
40 alternating pairs) improved all four fixtures by roughly 6–8% in that run.
With Tower control included, the same Wasm method versus deployed 3156273 measured:
small 5.164 -> 4.768, inference 5.435 -> 5.108, replacements 18.040 -> 16.616,
500 declarations 17.411 -> 16.820 ms. Absolute times vary between runs. Scripts and
full p50/p95 results: build/profile-lr-{runtime,control}-{native,wasm}.* and matching
build/lr-*-performance.json files. Source-length complexity and grammar conflicts
are unchanged; these measurements do not imply every grammar becomes faster.

## 2026-11-18 — Grammar entity indexing moved into Tower

compiler/lr-grammar.tower now reads the shared Rule/Reference/String/Range entity
components, groups productions by name, binds forward nonterminal references,
expands literal sequences, normalizes ranges, snapshots capture/name text, and
produces the disposable LR inputs. Names use hash lookup and a deterministic
lexical heap sort; hash bucket placement does not determine semantic order.
The augmented start label is not inserted into source-name bindings. Unresolved
terminal names are returned in source order to the remaining host resolver callback.
Declaration/update semantics and conflict handling are unchanged.

parser.cpp now borrows display/tree views from this Tower-owned index, removing
187 native lines and adding 51 adapter lines. Name/capture snapshots survive edits
or release of the source entities; numeric construction inputs are released after
the runtime table has copied what it needs. The independent C++ seed/reference in
bootstrap/lr-grammar-seed.cpp is temporary migration debt, not a production fallback.
These indexes are derived from grammar entities, not a separate grammar language.

The first composed build failed with 'Foundation function limit is 256' while
instantiating vector cleanup helpers. Inspection found this was an arbitrary
prototype guard: function indexes already use size_t and calls bind to entities.
Removed that guard (without changing parameter/type/expansion limits in this step)
and added a 300-function regression that calls function 299 and function 0, checks
Foundation round trips, and compares interpreter and LLVM results (299 then 0).
This unblocks the growing Tower compiler; a private encoding width must not become
a Foundation function-count limit. Initial failure: build/lr-grammar-initial.log.

Validation: native optimized, Wasm parser/LLVM/cross reactors, Windows optimized
parser suite; ASan/UBSan harness 4/4; Node 179/179; Playwright 102/102 desktop/mobile;
37 canonical formatting/tree/rule round trips; 16 bootstrap comparisons with equal
optimized LLVM and object bytes across Linux x64, Windows x64, macOS ARM64, Wasm.
Added 150 randomized entity-grammar comparisons plus forward/duplicate/empty/Unicode
names, the augmented-label collision, captures, mixed symbol components, reversed
and maximal u32 ranges, unresolved tokens, retained snapshots and allocation failure
at every allocation. Logs: build/lr-grammar-{native,wasm,llvm,windows,asan,node,
browser,bootstrap,format-check}.log, using the established build/test scripts.

Paired performance against f99abc3: native startup/load/compile/interpret medians
(4 warmups, 24 alternating pairs, only parser.cpp reference object replaced):
small 121.975 -> 113.337, 50 token declarations 492.198 -> 478.441, 25 parse
extensions 242.219 -> 227.546 ms. Warm Wasm compile plus Foundation formatting
(12 warmups, 40 alternating pairs): small 4.848 -> 4.780, inference 5.211 -> 5.027,
replacements 17.191 -> 16.917, 500 declarations 13.624 -> 13.449 ms. Full methods
and p95s are in build/profile-lr-grammar-{native,wasm}.* and matching JSON results.
These are measured fixtures, not universal speedup guarantees.

Follow-up on the preceding control stage: native medians versus c251eee were
120.503 -> 112.585, 513.892 -> 512.256, and 240.014 -> 233.933 ms respectively.
Its Pages deployment ac49e67, workflow 44383932298, succeeded; online verification
matched all 23 assets and passed desktop/mobile checks (build/lr-control-online.log).

Status clarified to the user: parser algorithm migration is well advanced; full
C++ removal is still substantial work. Remaining project-owned code includes
stream/diagnostic/tree adapters, incremental syntax and replacements, semantic
components/type checking, formatting, interpretation, driver/backend/linking glue,
and all native seeds. The endpoint is still pure Tower plus verified portable
compiler binaries and third-party implementations. Adapters/seeds do count as our
C++; current successful stages do not mean the full compiler is self-hosted.

## 2026-11-18 — Correction to the grammar migration source cleanup

After the grammar migration's successful builds/tests, a PowerShell EOF cleanup
read parser.cpp without an explicit UTF-8 encoding and rewrote four Unicode test
literals as mojibake. The next native sanitizer build caught invalid multi-character
Unicode literals. The earlier tests and deployed Wasm assets had been built before
this accidental edit; the pushed source in dc51620 nevertheless contained it.
Restored the exact literals from f99abc3 using Node's explicit UTF-8 file I/O and
staged only that correction while retaining the ongoing diagnostic-probe migration.
Future scripted source rewrites must use explicit encoding. This supersedes any
implication that the post-cleanup dc51620 source itself had passed the native build.

## 2026-11-18 — Bounded diagnostic table probes moved into Tower

lr-parser.tower now also owns the isolated stacks used to test expected tokens
and insertion continuations after an error. Probes retain consumed-input evidence,
perform reductions/GOTOs without semantic actions, and share the existing 8192-action
budget with a 128-action limit per probe. They never mutate the real recognizer,
execute replacements or consume source input. Candidate selection, source callbacks
and human wording remain in the native diagnostic adapter for now.

Allocation failure in probe creation/cloning/growth marks the diagnostic incomplete
instead of asserting a repair. The ordinary parsing path is unaffected. The native
reference remains independent and compares probe stacks, acceptance, origin states
and exact budget consumption for zero, one, 128 and 8192-action budgets across the
existing randomized/control fixtures. Failure injection now includes probe creation,
cloning and reduction work. Existing missing-semicolon, provenance and error-repair
tests exercise the integrated result, including desktop/mobile inline diagnostics.

Validation: native sanitizer harness 4/4, Windows optimized suite, Node 179/179,
Playwright 102/102, 37 canonical formatting checks at this stage, and 16 bootstrap
LLVM/object comparisons. Wasm parser/LLVM/cross builds passed. Logs are
build/lr-probe-{asan,windows,wasm,llvm,node,browser,bootstrap,format-check}.log.
The corrected Unicode test literals from 54fa990 were included in these successful
native/Windows builds. The earlier failure is retained in the encoding-correction
entry; successful pre-cleanup checks were not treated as validation of bad source.

The grammar-indexing deployment 8f120d4 succeeded in Pages workflow 44386814676;
verify-deployment.mjs matched all 23 assets and passed desktop/mobile checks
(build/lr-grammar-online.log). Next substantive compiler work is moving Foundation
semantic component storage into Tower so checking, formatting, interpretation and
LLVM can progressively consume Tower-defined payloads on the same shared entities.
The remaining native bridges/seeds and compiler stages still count toward full
C++ removal; portable self-hosted compiler binaries are not completed.

## 2026-11-18 — Foundation component storage in Tower; honest migration status

The user's question about continued `parser.cpp` edits is justified: the project
is not close enough to claim that only third-party C++ remains. Tower now runs
the entity/component store, parse-forest operations, explicit template
specialization, regex grammar/lowering and automata, grammar indexing, LR
analysis/state construction/LALR actions, runtime table lookup, recognizer
control and bounded diagnostic probes. Between `3156273` and `7ebcb41`,
`parser.cpp` removed 807 lines and added 236 integration lines. That is a useful
concrete change, not a percentage of the remaining migration.

Still native: stream adapters, tree assembly and diagnostic presentation,
incremental grammar revisions and replacements, substantial type checking and
type/layout registry logic, formatting, interpretation, compiler driver and
backend/linker integration. Our native seeds, allocation hooks, ABI adapters and
LLVM integration code count as our own C++, not third-party exemptions. A
portable self-building Tower compiler for Windows/macOS/Linux has not been
produced. Matching compiled utility objects is narrower than that endpoint.

### Implemented in this stage

- `compiler/foundation-nodes.tower` defines `FoundationType` and the Foundation
  semantic component fields. Production native/Wasm builds use Tower for
  component initialization/disposal and owned node-list storage. The component
  remains attached to the existing expanded parse entity; checker, formatter,
  interpreter and LLVM read this same payload. No second graph or public binary
  format was introduced.
- Replaced `CoreNode`'s C++ string/vector ownership with temporary passive native
  views (`foundation-values.hpp`) of Tower buffers. Names retain length-aware
  strings, including embedded NUL bytes; byte assignment uses the existing Tower
  byte-buffer implementation. Tower owns list growth, erasure and prepend,
  including overlapping self-slices and allocation-failure preservation. Edges
  remain borrowed; component disposal does not release their target entities.
- Existing native passes still assign/read these fields. Their logic and the
  private operation-tag definitions have NOT been ported merely by changing
  storage. The checked ABI view is transitional migration work, not a new
  independent semantic representation.
- Added a native reference seed for the new storage exports so clean builds
  retain an acyclic seed → stage1 → production dependency. This seed must also
  disappear once the portable Tower-built bootstrap is available.

### Trials and validation

The first native build exposed two hidden `std::vector` uses (template filtering
and generated-declaration prepend), plus LLVM APIs requiring explicit string
views. Those were connected to Tower list operations and length-aware views;
the LLVM string-literal path must not truncate embedded NULs.

New storage tests compare all 29 component field offsets and total size with
the actual compiled Tower layout, check initialization and component reuse,
deep name assignment/self-slices/NULs, growing self-prepend, removal, borrowed
edges, cleanup and injected allocation failures. Native Linux sanitizer tests
passed 4/4; optimized Windows tests passed. The sanitizer instruments the C++
harness/adapters, not every instruction in the separately Tower-produced object;
explicit allocation tracking and behavioral comparisons cover those routines.

Also corrected the LR allocation-failure test loop: successful LR fallback after
an optional DFA-cache allocation failure previously ended the sweep too early.
The sweep now continues until the specialized route itself completes, exercising
later evidence/probe allocations as well. This is a coverage correction, not a
claim that the old run exercised every specialized allocation.

Validation commands (PowerShell from `C:\Sandbox\tower`, WSL Orchestral-Revng,
LLVM 19 for native, WASI SDK 34 for browser reactors):

```
wsl -- bash -lc 'cd /mnt/c/Sandbox/tower && bash playground/scripts/test-native-core.sh'
.\scaffolding\tests\run.ps1 -Optimize -BootstrapCompiler C:\Sandbox\tower\build\parser-tests\host-bootstrap.cmd
# In WSL, with TOWER_BOOTSTRAP_COMPILER=/root/.cache/tower/native/towerc-stage1:
bash playground/scripts/build-wasm.sh
TOWER_BROWSER_CROSS=ON TOWER_BUILD_JOBS=3 bash playground/scripts/build-llvm.sh
npm run format:tower --prefix playground
npm run check:format --prefix playground
node --test playground/tests/*.test.mjs
npm run build --prefix playground
npx --prefix playground playwright test --config playground/playwright.config.mjs
bash playground/scripts/test-bootstrap.sh
```

All 179 Node tests, 102 desktop/mobile browser tests, 38 formatted Tower files
and 16 bootstrap comparisons passed. The bootstrap checks compare optimized IR
and object bytes for Linux x64, Windows x64, Wasm32 and macOS ARM64, including the
new component code inside the composed compiler module. Logs are in
`build/foundation-nodes-{asan,windows,wasm,llvm,node,browser,bootstrap,format-check}.log`.

Next migration work remains native syntax/replacement and semantic passes on
these shared entities, then formatter/interpreter, driver/platform integration
and the complete bootstrap replacement. Storage ownership moving is a necessary
step; it does not mean those passes have already moved.

Performance comparison after the test builds finished: `build/profile-foundation-nodes-native.py`
uses complete optimized compilers (baseline `7ebcb41` in an isolated worktree,
`TOWER_NATIVE_BUILD=/root/.cache/tower/foundation-baseline`) and 4 warmups plus 24
alternating paired process runs. Median milliseconds before → after were:
small 109.887 → 113.035, 500 declarations 118.167 → 115.390, templates
113.176 → 113.668, 50 token definitions 507.362 → 512.128.
`node build/profile-foundation-nodes-wasm.mjs` uses Node 21.7.3 hosting Wasm,
12 warmups plus 40 alternating pairs of compile + canonical formatting. Against
published `dc51620`/Pages `8f120d4`, medians were small 4.444 → 4.436,
inference 4.599 → 4.664, replacements 15.330 → 15.496, 500 declarations
12.658 → 12.944 ms. The latter comparison also includes the diagnostic-probe
migration since that deployment. Full p50/p95 results and fixture definitions
are in the corresponding scripts and `build/foundation-nodes-{native,wasm}-performance.json`.
These samples show roughly preserved performance, not a speedup claim or a
statistical guarantee; Node-hosted Wasm timing is not browser UI latency.

## 2026-11-18 — Tree assembly follows LR control into Tower

Continued the requested removal of all project-owned native compiler code.
`compiler/lr-tree.tower` now assembles shifts and reductions into the same shared
entities used by syntax, Foundation and the backends. It handles stream nodes
with existing metadata, missing match components, captured forest joins,
flattening generated productions, materializing the root, source extents and
final ownership transfer for both LR and finite-sequence execution. Native
`parser.cpp` now delegates this work; this stage removes 75 lines there and adds
12 integration lines. Stream callbacks, diagnostics and other remaining native
parts are still migration debt.

The runtime borrows rule-generated flags, names and capture snapshots from its
Tower grammar index. `lr_grammar_finish` keeps the flags needed for assembly and
clears construction-only entity addresses, so the original grammar tree can be
released without leaving callable accessors to stale source nodes. These are
derived indexes over the grammar entities, not another authoritative grammar.
One temporary `compiler_parse_match` bridge creates/registers the match component;
all of its data and disposal already live in Tower. The native reference assembly
is retained only for seed/reference targets and must be retired with the bootstrap.

Two build findings: the native seed exposes `parser_match_set_label`, not the
Tower payload export `node_match_set_label`; the reference uses its existing API.
An unconstrained usize-to-u32 conversion introduced a `tower_trap` dependency in
the standalone object. Masking the ID to the parser's existing 32-bit encoding
before conversion preserves the old native cast and lets LLVM prove that the
conversion cannot fail. The object dependency check remains enforced.

New direct tests cover attached-node rejection, preserving supplied payloads,
source-grammar release before parsing, root construction/captures/spans in both
execution modes, allocation failure before forest ownership transfer, and failure
in DFA evidence growth after transfer. The latter must leave the caller's input
null and release the node exactly once when the forest is destroyed. Existing
generated-rule, nullable, prefix, tree-shape and DFA/LR comparisons also pass.

Validation: native Linux sanitizer suite 4/4, optimized Windows suite, Wasm and
LLVM/cross reactors, 179 Node tests, 102 desktop/mobile browser tests, canonical
formatting (39 Tower files at this stage), and all 16 seed/production optimized-IR
and object comparisons for Linux/Windows/Wasm/macOS. Commands are the same native,
Wasm, Windows, Node, Playwright and bootstrap commands recorded immediately above;
the logs are `build/lr-tree-{asan,windows,wasm,llvm,node,browser,bootstrap,format}.log`.
As before, native sanitizers instrument the C++ harness/adapters; explicit failure
and ownership assertions test the separately Tower-compiled routines.

Next: token selection, contextual tokens and declaration-boundary detection from
`syntax.cpp`, followed by the remaining syntax/replacement and compiler pipeline.
This is another running Tower subsystem, not completion of the full migration.

## 2026-11-18 — Tower selects tokens and declaration boundaries

`compiler/syntax-lexer.tower` now runs the lexical selection previously in
`syntax.cpp`: maximal match and declaration-order ties, contextual-token
eligibility/ties, literal preference, skip-rule selection, capture-name matching
and intent-keyword boundaries. The native code still manages source sessions,
grammar revisions and highlighting output; it calls this Tower implementation
for decisions. Removed the duplicate native `Choice` representation so scanning
consumes the same `LexiconChoice` view directly.

Each immutable grammar revision owns a disposable lexicon index. Entries borrow
the compiled DFA and stable text/style storage from that revision's declaration
entities/maps. Construction finishes before use; destruction precedes release of
those owners. Declaration entities remain authoritative. Replacement-template
versions build the same index after their own rules/holes have been installed.
This is not a new grammar interchange or semantic node model.

Normal parsing and bounded diagnostic peeks now pass an explicit borrowed LR
runtime/current-state pair to the same Tower chooser instead of invoking native
acceptance callbacks. Ordinary parser-action counters retain the number of token
acceptance queries; diagnostic speculation does not inflate normal work counts.
Native grammar views also no longer copy generated flags/captures that became
unused when tree assembly moved to Tower.

Build trials caught a missing lexer-table header in the independent seed and
the use of reserved `skip`/`token` spellings as unquoted Tower field/local names.
The implementation uses `skipped` and `entry`; no bootstrap grammar exception was
added. The native selection implementation is now seed/reference-only and still
counts toward the eventual C++ removal requirement.

New native comparisons use the old independent C++ selection logic with the
same DFA tables and multiple parser acceptance states. They cover explicit tie,
contextual, prefix and declaration cases; all byte offsets in 150 deterministic
generated byte strings (including malformed/truncated UTF-8); Unicode literals;
skips; identifier lookup; and exact acceptance-query counts. Allocation-failure
tests check failed lexicon creation/insertion and preservation of existing
entries. Input bounds are tested through the lexer interfaces; valid borrowed LR
state indexes remain an internal caller precondition.

Validation passed: Linux native sanitizer suite 4/4, optimized Windows suite,
Wasm/LLVM/cross-reactor builds, 179 Node tests, 102 desktop/mobile browser tests,
canonical formatting for 40 Tower files, and all 16 bootstrap optimized-IR/object
comparisons across Linux x64, Windows x64, Wasm32 and macOS ARM64. Commands match
the prior entries (`test-native-core.sh`, `tests/run.ps1`, `build-wasm.sh`,
`build-llvm.sh` with cross targets, `check:format`, Node, Playwright and
`test-bootstrap.sh`). Logs are `build/syntax-lexer-{asan,windows,wasm,llvm,node,browser,bootstrap,format}.log`.

Performance: an isolated complete optimized `7b268d6` checkout/build in
`build/lexer-baseline` and `/root/.cache/tower/lexer-baseline` is the native
baseline. `python3 build/profile-syntax-lexer-native.py` uses 4 warmups plus 24
alternating paired process runs, including module load, compilation and
interpretation. Median milliseconds before → after: small 113.795 → 113.130;
500 declarations 126.106 → 123.436; templates 120.929 → 121.825; 50 token
definitions 504.396 → 501.080. These are roughly unchanged at this sampling scale.

`node build/profile-syntax-lexer-wasm.mjs` uses Node 21.7.3, 12 warmups and 40
alternating paired compile/format samples. Against the published `dc51620`/Pages
`8f120d4`, medians were small 4.544 → 4.512, inference 4.881 → 4.823,
replacements 15.825 → 15.672, and 500 declarations 12.222 → 10.191 ms. The last
fixture improves about 17%; the smaller fixtures are roughly unchanged. This
comparison also includes diagnostic probes, Foundation storage and tree assembly
since that deployment. Full p50/p95 results are in
`build/syntax-lexer-{native,wasm}-performance.json`. This is not a universal
speedup claim, and Node-hosted Wasm measurements are not UI latency measurements.

Next remains syntax component ownership, rule processing/replacements and the
remaining compiler/runtime passes. The compiler still requires our native seeds
and adapters; the all-Tower portable bootstrap endpoint remains unfinished.

### 2026-11-18 — Tower source snapshots and coordinate lookup

Moved immutable source-name/text allocation, reference counting, disposal and
UTF-8 source-coordinate lookup into `compiler/syntax-source.tower`. Syntax
sessions and declaration provenance share the same Tower-owned snapshot through
a temporary native reference adapter. This preserves source text when a session
is reset or destroyed; the counter follows the existing single-threaded compiler
runtime, not a newly promised concurrent ownership contract. The native seed
remains transitional project-owned code, not an external-library exemption.

Native build and sanitizer suites pass (`build/syntax-source-native.log` and
`build/syntax-source-asan.log`; `build-native.sh` and `test-native-core.sh`, 4/4).
Added ABI-size, copied-input, embedded-NUL, Unicode/newline/EOF coordinate,
reference-copy/move, and allocation-failure cleanup checks. Existing integration
coverage retains declaration provenance across 100 session resets and destruction.
Cross-target/browser validation will accompany the following syntax-component
migration; it has not yet been rerun for this snapshot change alone.

Also verified the preceding lexer/tree migration online: Pages commit `110b5a3`,
workflow `44398225183` succeeded. `node playground/scripts/verify-deployment.mjs
https://trevorsundberg.github.io/tower/` matched all 23 deployed assets and passed
desktop/mobile execution agreement, forward bindings, editable grammar,
persistence, native downloads and equal-column checks. Log:
`build/syntax-lexer-online.log`. This deployed build corresponds to source commit
`61f93cc`, before the source-snapshot migration.

Next: migrate syntax-component storage/lifetime and structural comparison,
including retained lexer caches and comment storage. Type checking, formatting,
interpretation, driver/backend integration and the native bootstrap still need
porting; this is continued progress, not completion of C++ removal.

### 2026-11-18 — Tower grammar-component ownership and comparison

`compiler/syntax-nodes.tower` now defines and owns the grammar semantic component:
names, text, captures, highlighting style, ordered borrowed child edges, owned
replacement references, retained source snapshots, comments and retained derived
lexer caches. These remain components on the existing parse entities; there is no
new semantic graph or serialization format. The native `SyntaxNode` is a passive
ABI view with a Tower finalizer. Source/replacement/cache setters retain before
releasing, including self-assignment. Native lexer-cache `shared_ptr` ownership
was replaced by Tower reference counting; the regex parse tree remains retained
with the derived DFA. The native reference wrappers are still migration debt.

Structural grammar comparison now runs in Tower using an explicit work vector.
It compares semantic fields and ordered children/replacements, ignores comments,
source identity and cache addresses, and optionally compares template coordinates
exactly as before. Allocation failure has a separate result from unequal nodes;
the current native caller retains its fail-fast allocation policy. Comment copies
are transactional and support embedded NULs and sources borrowed from existing
comments during list growth. The bootstrap still has an independent native seed;
this is not the endpoint where project-owned native code can be deleted.

Initial native compilation found two decoder calls requiring mutable C++ strings.
Those calls now decode into a temporary and assign the Tower-owned text. Decoding
and declaration interpretation themselves are still native and are a subsequent
port, not functionality claimed to have moved in this step.

Tests verify every syntax-field ABI offset, payload/cache sizes, all semantic
comparison fields, metadata exclusions, template coordinates, 64-child trees,
borrowed versus owned edges, component removal/reuse, cache/source/reference
self-assignment and moves, embedded-NUL comments, and allocation failures during
comment copying/growth, cache construction and comparison-stack growth. A native
reference comparison is exercised alongside Tower. Leak counters return to the
baseline. Native sanitizers instrument the C++ harness/bridges, not all generated
Tower instructions; the ownership/allocation tests run the actual Tower code.

Validation passed in this Windows/WSL checkout: native sanitizer suite 4/4,
optimized Windows suite, Wasm/LLVM/cross-reactor builds, 179 Node tests, 102
desktop/mobile Playwright tests, canonical formatting for 42 Tower files, and all
16 bootstrap optimized-IR/object comparisons across Linux x64, Windows x64,
Wasm32 and macOS ARM64. These include the preceding source-snapshot change.
Commands: `build-native.sh`, existing sanitizer CMake build plus CTest,
`tests/run.ps1 -Optimize -BootstrapCompiler .../host-bootstrap.cmd`,
`build-wasm.sh`, `build-llvm.sh` with `TOWER_BROWSER_CROSS=ON`, `check:format`,
Node tests, `npm run build`, Playwright and `test-bootstrap.sh`. Logs:
`build/syntax-nodes-{native,asan,windows,wasm,llvm,node,browser,format,bootstrap}.log`.

Warm Wasm comparison (`node build/profile-syntax-nodes-wasm.mjs`, Node 21.7.3,
12 warmups and 40 alternating pairs, compile plus canonical formatting) against
the published `61f93cc`/Pages `110b5a3`: median milliseconds before -> after:
small 5.121 -> 5.236; inference 5.164 -> 5.107; replacements 16.004 -> 16.120;
500 declarations 11.015 -> 11.394. These are close, with a small increase on three
fixtures; no speedup is claimed. Full p50/p95 values are in
`build/syntax-nodes-wasm-performance.json`. This is Node-hosted Wasm, not an
end-to-end UI latency measurement.

Remaining work is substantive: declaration/rule interpretation and replacements,
type checking, formatting, execution, driver/backend integration, and removal of
the native seeds/adapters in favor of portable compiler binaries. Existing ABI
bridges and bootstrap code still count as project-owned C++.


## 2026-11-18 - Explicit playground target profiles and highlighted output

Request: replace architecture-group checkboxes with real supported platform
profiles, separate disassembly/download panes, choose useful browser defaults,
and highlight foundation instructions, raw/optimized LLVM and disassembly.

Implemented in the playground (compiler semantics unchanged):

- The executable catalog in playground/src/targets.mjs remains six validated
  profiles: wasm32 browser modules; Windows x64/MSVC; Linux x64 and AArch64;
  macOS x64 and ARM64 at the existing macOS 11 baseline. The picker shows native
  triples; each profile has a separate disassembly pane/footer. No unsupported
  LLVM triple is presented as a working executable target. Wasm's actual triple
  remains explicit in the compiler catalog, despite the simplified UI label.
- Replaced x86/ARM worker grouping with one native worker receiving explicit
  selected keys. It compiles those profiles sequentially and shares its LLVM
  instance and runtime cache. Target-prefixed uploads remain isolated. This avoids
  allocating a complete compiler instance for every selected platform. Generation
  IDs, worker cancellation, stale-result rejection, source-order effects and
  foundation formatting remain unchanged. Native results are never executed by
  the browser UI. Target input selection no longer equates 32-bit with Wasm.
- Browser defaults use independently inferred OS/architecture. Client hints
  override legacy UA signals; queries time out after 200 ms or fall back when
  denied. macOS with hidden architecture defaults to ARM64; Windows/Linux to x64;
  a fully unknown client defaults to Windows x64. These are chosen heuristics,
  not measured population statistics. Known unsupported combinations select Wasm.
  Wasm stays enabled initially, and saved v2 selections (including all-off) win.
  Legacy architecture selections expand into their corresponding concrete keys.
  Detection is local and never changes an explicit profile's target semantics.
- Read-only CodeMirror views retain complete plain-text output but virtualize
  rendered lines. StreamLanguage display lexers cover foundation, LLVM, x86,
  ARM64 and decoded Wasm. Incremental/background parsing is supplied by CodeMirror;
  unchanged text is skipped during phase/timing updates. These lexers are visual
  classification only, not an authoritative grammar or a new semantic model.
  Compiler foundation text is still produced by the shared formatting engine.
  Empty output destroys its view. Text is never interpolated as HTML.
- Tests reading/copying full output now inspect the CodeMirror document through
  a centralized test-only DOM bridge, since DOM text contains just the viewport.
  Existing language browser tests seed their historical Wasm-only selection;
  new detection tests explicitly use empty storage.

Research and scope decisions:

- Chromium documents platform, architecture, bitness and WoW64 client hints and
  the asynchronous getHighEntropyValues API:
  https://developer.chrome.com/docs/privacy-security/user-agent-client-hints
  The client-hints specification permits missing/fictitious values:
  https://wicg.github.io/ua-client-hints/
  Therefore this is a configurable suggestion, not a hardware capability check.
  No GPU fingerprint, timing benchmark or network inference was added.
- 32-bit embedded support remains useful. Arm/Keil describes STM32 as a family of
  32-bit Cortex-M microcontrollers:
  https://www.keil.arm.com/vendors/stmicroelectronics/devices/
  Raspberry Pi documents RP2350's Cortex-M33/Hazard3 alternatives:
  https://www.raspberrypi.com/documentation/microcontrollers/microcontroller-chips.html
  Its datasheet explicitly identifies Hazard3's RV32I base:
  https://pip-assets.raspberrypi.com/categories/1214-rp2350/documents/RP-008373-DS-3-rp2350-datasheet.pdf
  Proposed next native profiles are Cortex-M (thumbv6m-none-eabi and
  thumbv7em-none-eabi candidates) and riscv32-unknown-elf with explicit ISA/ABI.
  They are not implemented here. Backend inclusion, board startup/linker scripts,
  memory/layout validation and runtime/effect contracts must precede downloads.
  Existing browser cross binaries include X86/AArch64/WebAssembly, not ARM/RISCV.
  Windows ARM64 is also not yet supported: the native linker adapter currently
  hardcodes /machine:x64 and the import pack is x64. No checkbox falsely aliases
  Windows ARM to its x64 binary. Mobile/GPU ABI work remains separate.

Trials, failures and fixes:

- Local environment: Windows PowerShell, Node 21.7.3, npm 10.5.0, Playwright 1.65.1
  with Chromium 159.0.8154.6; checkout began at 8d5030c. No build directory, native
  compiler, Clang, or Linux WSL distribution was present (only docker-desktop).
  Ran npm ci and installed the Playwright Chromium browser. Used published assets
  from https://trevorsundberg.github.io/tower/ for unchanged compiler integration:
  tower.wasm (4,310,927 bytes), tower-llvm.wasm.gz (15,480,501 bytes),
  tower-cross.wasm.gz (17,296,753 bytes), five runtime objects, kernel32.lib and
  libSystem.tbd. Decompressed LLVM files into build/browser-wasi-llvm and stored
  runtime packs in build/targets. Verified deployed Bedrock/Foundation source
  matches checkout text after CRLF normalization. This validates UI against the
  published compiler; it is not a fresh native/bootstrap rebuild claim.
- First detection unit run caught conflicting UA and client-hint platform strings:
  combined matching let the UA's Windows text win over a Linux hint. Changed OS
  inference to prioritize the explicit platform independently of architecture.
- Browser regression testing exposed a real touch-device heuristic bug. This
  Windows test machine reports maxTouchPoints=10 even for desktop Chromium. A Mac
  platform simulation with explicit macOS/ARM64 hints was misclassified as iPad.
  The iPad desktop-UA heuristic now runs only without an explicit client-hint OS.
  Added a regression for this case. Another test incorrectly redefined a
  nonconfigurable navigator mock across reloads; replaced that test setup with
  one URL-dependent initialization script (not an application defect).
- The expanded picker initially kept its right edge attached to the Targets
  button on narrow screens, putting checkboxes left of the viewport. Mobile
  screenshot/interaction failures revealed this; it now anchors to the full
  execution heading. This preserves menu access without horizontal page overflow.
- Initial desktop smoke run: six existing browser checks passed, including all
  five native executable signatures, per-target filenames, warm worker reuse,
  cancellation, and canonical struct source copied back into the editor.
- Initial full Node run: 208 tests, 206 passed, one skipped and one environment
  failure. The unrelated C-archive integration test requires the absent
  build/linking/wasm-fixture.a (built by playground/scripts/build-wasm.sh or
  test-linking.sh); native-compiled Wasm integration was skipped without its
  optional artifact. No compiler source was changed to accommodate missing tools.

Validation commands/logs and final results follow below. Future work: validate
new ABI/runtime profiles before adding catalog entries, keep display lexers in
step with emitted spellings, and replace UI display token tables with compiler
metadata if/when shared output highlighting metadata is exposed.


Final validation for this change:

Commands from C:/Sandbox/tower (npm/npx browser commands run from playground):

    npm ci --prefix playground
    npm run build --prefix playground
    node --test playground/tests/targets.test.mjs playground/tests/output-syntax.test.mjs playground/tests/cross-compilation.test.mjs
    cd playground
    npx playwright test
    npx playwright test tests/browser/output-highlighting.spec.mjs --output=../build/targets-highlighting-final

- 38 focused Node tests passed with no skips, including all six compiler targets,
  deterministic repeated executable output, library linking, browser inference,
  legacy selection migration, denied/stalled hints, target-specific link inputs,
  and literal-safe lexical highlighting. Log: build/targets-focused-node.log.
- All 112 desktop/mobile browser tests passed in 1.9 minutes after the detection
  and mobile-menu corrections. Log: build/targets-browser-final.log. The earlier
  failed exploratory run is retained as build/targets-browser-tests.log; it was
  stopped after its already-open mobile picker test remained outside the viewport.
  The separate corrected target/default/export run passed all 12 tests (14.3 s),
  recorded in build/targets-browser-focused.log.
- After adding highlighting for usize/isize and prefixed x86 mnemonics, rebuilt
  dist and reran all four desktop/mobile output-highlighting cases: passed.
  Log: build/targets-highlighting-final.log. The 50,000-line stress case holds
  more than 2 MB of output, creates fewer than 200 rendered lines before/after
  jumping to the final instruction, preserves readonly behavior, and does not
  interpret embedded HTML. This is a DOM-size/responsiveness check, not a promise
  about every browser's latency or complete background-parse duration.
- PowerShell log redirection also records Node's NO_COLOR/FORCE_COLOR warning as
  NativeCommandError; the Playwright summaries above report the actual cases.
- Full Node-suite limitation remains the absent external C archive fixture
  described above (build/targets-node-tests.log); native integration was not
  rebuilt on this machine. All six published cross-compiler targets were exercised.
- Inspected the desktop native-pane screenshot at build/targets-arm-desktop.png;
  all five panes have their own title, highlighted assembly and matching download
  footer. Desktop/mobile tests verify equal pane widths and viewport containment.
- git diff --check passed. todo.txt was not modified. No deployment was performed.


## 2026-11-18 - Deploy target picker and output highlighting

User authorized publishing the reviewed playground update. The repository uses
GitHub Pages from gh-pages at /, https://trevorsundberg.github.io/tower/.
Fetched origin/master bff7a0c and gh-pages 110b5a3 before preparing deployment;
upstream contains newer compiler migrations, which must be preserved. Reusing the
current gh-pages compiler binaries/runtime packs, integrating source changes onto
the updated master, and updating verify-deployment.mjs for the concrete target
checkboxes and virtualized output before publication. No changes to todo.txt.

Deployment preparation completed: rebased UI source as 67302b1 on bff7a0c,
resolving only the append-only journal conflict and retaining both histories.
All three compiler binaries were refreshed from gh-pages 110b5a3; final Pages
diff changes only seven UI/notice assets and preserves compiler/runtime bytes.
Rebuilt with npm run build --prefix playground. The 38 focused Node tests passed
against these published artifacts (build/target-deploy-node.log). Updated local
verification passed all 23 asset hashes and desktop/mobile grammar, persistence,
execution and all five native profile downloads (build/target-deploy-local.log).
Pushed master 67302b1 and gh-pages 8ed473f with ordinary fast-forward pushes.
GitHub Pages run 44400330324 was then observed building the new deployment.

Deployment succeeded: https://github.com/TrevorSundberg/tower/actions/runs/44400330324
completed successfully for gh-pages 8ed473f. Live verification command:

    node playground/scripts/verify-deployment.mjs https://trevorsundberg.github.io/tower/

All 23 deployed assets match SHA-256 hashes of the tested build. Desktop and
mobile checks passed execution/comparison, migrations, diagnostics, persistence,
all five native downloads, highlighted disassembly and equal pane widths, with
zero page errors. Logs: build/target-deploy-live.log and
build/deployment-verification/report.json; screenshots/downloads share that
verification directory. Public URL: https://trevorsundberg.github.io/tower/.


## 2026-11-18 - Correct initial target selection and simplify detection label

User reported all platform checkboxes selected after deployment despite requesting
one detected target, and supplied a screenshot showing Windows x64 was correctly
inferred but overridden by "Saved choices restored". They reported previously
using Wasm and x86 only. Correction to the initial diagnosis: old x86 flags explain
selection of Windows/Linux/macOS x64, but do not explain ARM64 being checked.
We did not inspect the user's actual localStorage, so the exact historical origin
of the ARM64 selections is unknown. The verified defect is that persisted v1/v2
state could override the intended initial detection, plus fresh defaults added
Wasm alongside the native target without the user requesting that.

Implementation supersedes the earlier migration/default policy above:
- Initial selection now contains exactly one detected target, or one fallback.
  Wasm is selected initially only when it is the fallback profile.
- Ignore pre-correction v1 and v2 target settings. Only explicit checkbox changes
  made with this corrected picker persist in v3; manual additions remain possible.
  No browser-storage access is required for the one-target default.
- Remove the requested diagnostic paragraph entirely, including the temporary
  detecting message. Append only "(detected)" to the matching target's name when
  both OS and architecture are explicit (reported architecture or client hints
  with bitness). Guessed OS/architecture defaults and unsupported-host Wasm
  fallbacks receive no marker. The marker describes detection, not selection.
- Add unit/browser regressions for legacy Wasm+x86 and v2 all-target state,
  repeated reloads, one-target defaults, strong-match marking and unmarked
  fallbacks. Keep the language-test fixture's deliberate Wasm selection in v3.

Validation so far: npm run build --prefix playground succeeded; all 25 tests in
playground/tests/targets.test.mjs passed (build/target-default-fix-node.log).
Full desktop/mobile regression tests and deployment verification follow.
No changes to todo.txt.

Correction validation: all 114 desktop/mobile browser tests passed in 2.5 minutes
(build/target-default-fix-browser.log). The updated deployment verifier also passed
locally, including 23 matching assets, both execution backends, five native
downloads, ignored old v1/v2 state, single Windows/default-Wasm selection and
strong-match-only markers (build/target-default-fix-local.log). Inspected the
desktop-target-default.png screenshot: only Windows x64 (detected) is checked;
no explanatory paragraph remains. Rebased source onto new upstream e58672e,
preserving its compiler migration and journal entries; correction source is
f59cd6c. Published UI-only artifacts as gh-pages 3acf0fe. Compiler/runtime
artifacts remain unchanged from the preceding verified deployment.

Correction deployment verified live: GitHub Pages run 44402478329 succeeded
(https://github.com/TrevorSundberg/tower/actions/runs/44402478329). Ran
node playground/scripts/verify-deployment.mjs https://trevorsundberg.github.io/tower/
against the public site. All 23 asset hashes match. Desktop/mobile execution,
native downloads and old-state override regression checks passed with zero page
errors: Windows x64 alone with (detected), Android fallback Wasm alone without
the marker, and no diagnostic paragraph. Live log: build/target-default-fix-live.log;
report/screenshots: build/deployment-verification/.

### 2026-11-18 — Integrating the syntax migration with concurrent playground work

Source commits `bff7a0c` and `bb98324` contain the Tower snapshot/component
migrations. Publishing encountered concurrent source/Pages updates, first
`67302b1`/`c81058e` and then `f59cd6c`/`dd7a363`. Normal pushes rejected the
outdated branch tips; no force push was used. Merged the target profiles,
virtualized highlighted output, and subsequent single-target defaults rather
than overwriting them. Journal conflicts were append-only and retained both
entries. Unrelated local journal notes were restored after each merge; the
existing AGENTS/foundation notes and todo.txt changes were not included.

The first merged build passed 210 Node tests. The browser run passed 110 cases
and failed the two large-output fixture cases because their esbuild import
resolved against `process.cwd()` and the command ran from the repository root.
Changed that test fixture to resolve from its own module URL; all four
output-highlighting cases then passed from the same root invocation. This is a
test path correction, not a product rendering failure. Logs:
`build/syntax-merged-{node,browser,highlighting}.log`.

After the follow-up target-default change, rebuilt the combined static site and
passed all 211 Node tests plus the 44 affected desktop/mobile target-default,
execution and highlighting cases. Logs: `build/syntax-final-{node,browser}.log`.
The compiler code is unchanged from the fully checked syntax migration, so the
native/Windows/Wasm/format/bootstrap results in the preceding entry still apply.
Retained the performance baseline assets from Pages `110b5a3` in
`build/syntax-nodes-baseline`; the profiling script now reads that immutable local
snapshot instead of the deployment checkout which necessarily changes.

Published the combined artifacts as Pages commit `d664f8f`; workflow
`44403119583` succeeded. Online verification matched all 23 assets to the local
build and passed desktop/mobile backend agreement, forward bindings, editable
grammar, persistence, native downloads, equal columns, legacy-selection reset,
single-target defaults and detection markers. Command:
`node playground/scripts/verify-deployment.mjs https://trevorsundberg.github.io/tower/`.
Logs: `build/syntax-nodes-pages.log`, `build/syntax-nodes-online.log`.

## 2026-11-18 — Browser projects, virtual drives and independent source files

Implemented the requested project workspace in `playground`, without changing
`todo.txt` or adding a package dependency. The old document dropdown is gone.
The left browser has a project selector, pinned Bedrock/Foundation entries with
built-in badges, collapsible folders, file creation/rename/delete and explicit
file reordering. Every previous example is a seeded project. Built-in edits are
project-local environment overrides; switching projects terminates all parser,
interpreter and backend workers and drops outputs, downloads and link inputs.
Within a project, editor states preserve separate file undo histories.

Storage is whole-project IndexedDB transactions, not source in localStorage.
Old source/module/localStorage records migrate once to a recovered project;
original records remain untouched as backup. Known Foundation baseline upgrades
still use the existing migration rules. Save/Open now export/import the complete
project as ZIP: ordinary source files, `.tower/bedrock.tower`,
`.tower/foundation.tower`, `.tower/project.json` (order/metadata/baselines) and
`.tower/links/` inputs. The small writer uses standard stored ZIP records and
CRC32, with no library; the reader also supports Deflate through the browser
DecompressionStream. It rejects duplicate/traversal/conflicting paths, bad CRCs,
unsupported compression/encryption and oversized contents. Storage handles text
assets larger than localStorage's practical limit; a >7 MB Unicode archive and
>8 MB browser project were exercised. Archive allocation remains bounded at
256 MiB; source compilation is separately bounded at 8 MiB combined, with the
existing 1,024 construct and 64 KiB bootstrap module limits. This is not an
unbounded-file-size guarantee.

Research/choices:

- [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
  documents transactional structured storage including larger files/blobs.
  [Storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
  distinguishes browser-managed IndexedDB quotas from the small Web Storage
  limit. Quota errors are surfaced in the UI; browser data can still be evicted.
- [MDN directory picker](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker)
  still documents limited browser availability and secure-context requirements.
  Direct directory synchronization was considered and deferred; ZIP plus virtual
  files works without making that API a prerequisite.
- ZIP records follow [PKWARE APPNOTE 6.3.10](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT).
  Stored output avoids a compression package; Python `zipfile.testzip()` and
  Python-produced ZIP_DEFLATED input independently verified interoperability.
  Foundation text stays the program interchange; ZIP is just a file container.

Project compilation is an explicit ordered list, not a concatenating JS parser
or a new Tower import language. `core_compile_files` starts a syntax session from
Foundation for every source, attaches those same parsed executable entities to
one program and runs existing binding/type-checking/formatting/lowering. Module
bindings span that compilation unit while initialization and effects retain file
order. A derived source-base index maps source-local spans (including generated
template instances) to project diagnostic coordinates; workers map these to
path/byte positions. Canonical Foundation text remains the backend boundary.
The additive `tw_exec_create_files` host ABI and `compileFiles` adapter use the
existing execution handle model. Both interpreter and LLVM branches consume the
same checked project. Ordinary parser inspection remains file-local. Built-in
inspection retains its ordinary execution area and controls.

`TowerWASI.mountFiles` atomically replaces the frontend virtual file tree and
invalidates opened guest file descriptors. Invalid mounts preserve the previous
tree. This is filesystem plumbing for the compiler host; the Tower browser
platform API still only exposes output and does not gain guest file-I/O functions
or capability semantics from this change. General Tower imports, effect-tracked
file reads and native-directory synchronization remain follow-up work.

Debugging/trials:

- The clean Windows checkout had no build products, node_modules, WASI SDK or
  installed LLVM development package. Installed pinned npm dependencies,
  Playwright Chromium, WASI SDK 34 and Ubuntu LLVM 19 development files; built the
  native bootstrap and actual frontend reactor through the repository scripts.
  The PowerShell `python` alias was unavailable; Python scripting used WSL
  Ubuntu's python3 instead.
- The first browser launch found one residual `example-kind` reference in the
  control enablement list; removing it restored startup. Browser tests now use
  file-tree clicks/project selection and read whole-project archives/IndexedDB.
- A delayed save could report an old transaction as current after selecting a
  different file. Save generations now prevent that. Immediate-reload regression
  additionally demonstrated that relying on a debounced write plus pagehide can
  lose edits: transactions now start on each edit, and the UI only reports Saved
  when the matching transaction commits. This favors durable edits over a small
  debounce optimization, at the cost of snapshot cloning for large projects.
- Async link-file reads used to act on whichever global input map was current
  when the read completed. They now capture the owning project and discard a
  result after a project switch. Project import already has a supersession token.
- Old tests expected execution workers to survive changing examples. Examples are
  now projects, so those expectations were changed to require environment
  replacement and continue testing worker reuse for edits inside that environment.
- First broad browser trial: 100/108 passed, with failures identifying the reload
  save issue, stale selector/worker-lifetime expectations and narrow mobile
  editor virtualization. The mobile sidebar was given the full workspace height
  to make project files visible, while keeping parser inspection available.

Environment and reproducible checks (PowerShell, repository root unless noted):

```
npm ci --prefix playground
wsl -d Ubuntu -- bash playground/scripts/setup-wasi.sh
wsl -d Ubuntu -- bash playground/scripts/build-wasm.sh
node --test playground/tests/*.test.mjs
npm run build --prefix playground
npx --prefix playground playwright test --config playground/playwright.config.mjs
wsl -d Ubuntu -- bash playground/scripts/test-native-core.sh
```

The frontend reactor was rebuilt from this checkout. For independent backend
comparison, the unchanged LLVM/cross reactors and target runtime packs were
fetched from the project's published `https://trevorsundberg.github.io/tower/`
into ignored `build/` directories; these backend binaries were not rebuilt in
this trial and are not claimed as fresh backend builds. Node validation after
that setup: 185 passed, zero failed, one skipped (optional native-produced Wasm
fixture absent). This includes multi-file binding/order, isolated grammars,
Unicode diagnostics, specialization, Foundation round trips, large-file ZIP,
invalid mounts and path validation. Final browser/native outcomes follow below.

Final validation: the full desktop/mobile run passed 113 of 116 checks. The
remaining three were mobile viewport assumptions in tests, not missing semantic
results: CodeMirror did not render offscreen source/error widgets. Tests now
read the complete IndexedDB source, navigate to the error, or scroll to the
highlighted tokens. The focused rerun passed all 22 checks, including all three
previous failures, both device profiles, project CRUD/order, large archives,
quota failure/download recovery, pending link input isolation and cancellation.
No unresolved test failure remains. Native ASan/UBSan CTest passed 4/4 suites;
Node passed 185 with one optional fixture skip. The final ZIP bounds/date cleanup
also passed all seven project Node tests and the 22 focused browser checks.
ZIP output has a deterministic valid 1980-01-01 DOS date. Python's independent
stored/deflated ZIP interoperability checks passed. `git diff --check` passed.

Logs: `build/project-node-final.log`, `build/project-browser-final.log`,
`build/project-browser-focused.log`, and `build/project-native-tests.log`.
The README, TOKENS guide and browser ABI now document project behavior and its
limits. No runtime dependency or web framework was added; no website deployment
was performed. Next: language-level imports and tracked filesystem capabilities,
then optional directory synchronization if useful, without making those APIs
required for the portable browser workspace.

### 2026-11-18: project workspace integration and deployment preparation

The user authorized pulling, rebasing, pushing and deploying the project browser.
Fetched ten newer source commits through `b90810d` and rebased the project work
as `1da2831`. Resolved overlapping worker, UI, style, test and journal edits while
retaining the upstream Tower syntax migration, individual native target profiles,
single detected default and virtualized highlighted compiler output. Worker
messages now carry project files/drives alongside the newer target-key selection.
No force push is needed. `todo.txt` remains untouched.

Rebuilt the frontend reactor with `wsl -d Ubuntu -- bash
playground/scripts/build-wasm.sh` using WASI SDK 34, ran `npm ci --prefix
playground`, then `npm run build --prefix playground`. Reused LLVM/cross reactors
and target packs from the latest published `gh-pages` tree `d664f8f` via the ignored
`build/pages-deploy` worktree; they are byte-identical to that deployment, not
fresh backend builds. The frontend includes the rebased native/Tower components.

Adapted deployment verification to the hierarchy, IndexedDB snapshots and ZIP
saves. Legacy localStorage is retained as backup while the migrated project owns
the current Foundation. Cached-load checks now repeat execution inside a project,
because switching projects intentionally replaces the worker environment. Output
checks read CodeMirror documents rather than assuming an empty DOM. The verifier
also imports a project with two Tower files and a text asset, compiles a forward
cross-file function call, reloads from IndexedDB and checks whole-project export.
It retains all five native profile downloads, target detection and mobile checks.

Validation so far: `npm test` passed 217 tests with one optional native-produced
Wasm fixture skipped (218 total). Rebuilt `/home/trevo/.cache/tower/core-asan`
and ran CTest: all four ASan/UBSan suites passed. Logs are
`build/projects-rebased-node.log`, `build/projects-rebased-native.log`, and
`build/projects-rebased-wasm.log`. Browser and publication results follow below.

Combined validation completed: all 128 desktop/mobile Playwright checks passed
in 2.4 minutes (`npm run test:browser`, log
`build/projects-rebased-browser.log`). The updated local deployment verifier
passed both device profiles, all 23 asset hashes, two-file project execution,
ZIP/IndexedDB round trips, legacy migration and all five native outputs
(`node scripts/verify-deployment.mjs`, log
`build/projects-deployment-local.log`). `git diff --check` passed. No unresolved
failure remains before publication.

Publication completed: source `79c9729` (project implementation `1da2831`) was
pushed normally to `master` after a final `git pull --rebase origin master`.
Static artifacts were committed as `41f35ca` and pushed normally to `gh-pages`.
GitHub Pages run https://github.com/TrevorSundberg/tower/actions/runs/44405306250
completed successfully. No upstream commits were overwritten.

Live verification command, from `playground`:
`node scripts/verify-deployment.mjs https://trevorsundberg.github.io/tower/`.
All 23 fetched assets matched the tested local build by SHA-256. Desktop and
mobile both passed multi-file compilation, whole-project ZIP import/export,
IndexedDB reload persistence, built-in migration/editing, interpreter/Wasm
agreement, five native builds/downloads, output highlighting and target defaults.
No browser page errors were reported. Results: `build/projects-deployment-live.log`
and `build/deployment-verification/report.json` (ignored local artifacts).
The previous entry's statement that no deployment was performed applies only to
the earlier implementation trial; this entry records the authorized publication.

### 2026-11-18 — Requested sync and Tower declaration interpretation

Performed the requested pull/rebase/push against master. The upstream project
workspace changes through `7262584` were a fast-forward. Used a clean detached
sync worktree for `git pull --rebase --no-recurse-submodules origin master`, then
pushed normally and advanced the working checkout while retaining its unrelated
notes. The journal stash conflicted where upstream had accidentally decoded UTF-8
punctuation as Windows-1252. Preserved the local research entry and repaired 30
verified damaged lines using exact text from `b90810d`; committed/pushed that
repair as `a3d09ff`. The 1,045 unrelated journal additions remain unstaged.
todo.txt was never changed: before/after SHA-256 was
`4DD43451D390112F0AA9FE2168982A7F837E5B37C3D0B5F17BF94EEE79659BC8`.

Added `compiler/syntax-reader.tower` and routed production declaration reading
through it. Tower now interprets parse-rule alternatives, sequence ordering,
captures, references, repetitions, token-exclusion sets, assignment/extension
flags, token/skip patterns, contextual/style metadata and replacement bodies.
The semantic fields are attached directly to the existing parse entities. There
is no second declaration AST. Source is retained on those components, now also
on replacement templates, and template coordinates exclude the enclosing braces.
Grammar version installation, environment validation/caches, replacement-template
compilation/expansion and the remaining compiler pipeline are still native.

Literal classification and identifier decoding moved into Tower as well.
Formatting/name lookup use the same decoder. Review found that an initial native
adapter created an unnecessary Tower heap buffer for each decoded name; added an
in-place Tower entry point so it reuses the caller's existing string storage.
The copying entry point still supports overlapping input via the shared Tower
byte-buffer implementation. This avoided introducing that allocation before final
profiling; no before/after speedup for the initial adapter is claimed.

The reader attaches registered components directly through the Tower entity
store and reports allocation failures instead of entering the native fail-fast
constructor. A small native lifecycle-registration adapter remains. The seed
store retains its old per-component registration convention; the independent
native declaration-reader seed remains bootstrap/reference debt. Those files are
not exempt from the final no-project-owned-C++ goal.

Reader contracts: consume fresh declaration parse entities; caller retains tree
and source and commits a grammar revision only after success. Failed partial
components are owned/reclaimed by the input tree. Missing captures, invalid source
spans and too-short replacement/token envelopes produce diagnostics. An allocation
failure while constructing a diagnostic returns an empty error buffer for the
native adapter's allocation-error fallback. For malformed token declarations,
structural declaration validation now precedes the environment's name-collision
check; valid declaration semantics and incremental installation order are intact.

Tests compare Tower against the independent native reader on alternatives,
nullable sequences, capture/repetition forms, exclusions, escaped names,
extensions/replacements and token/skip variants. They compare shared semantic
structure and canonical formatting, retain provenance after session destruction,
check malformed spans/envelopes, and inject every allocation failure through
representative rule/token/skip construction paths until success. Partial-tree
cleanup returns entity/buffer counts to baseline. Added 1,000 deterministic random
identifier/literal cases, in-place/copying agreement, embedded-byte handling,
overlapping input and failed-growth preservation. The native sanitizer harness
does not instrument every generated Tower instruction; these tests execute the
actual Tower implementations and inspect their effects/lifetime counters.

Validation passed: native build; Linux sanitizer suite 4/4; optimized Windows
suite; Wasm, LLVM and cross-target reactor builds; canonical formatting for 43
Tower files; 218 Node tests; 128 desktop/mobile browser cases including the pulled
multi-file project/ZIP/IndexedDB features; and all 16 bootstrap optimized-IR/object
comparisons across Linux x64, Windows x64, Wasm32 and macOS ARM64. The Node suite
was repeated after all reactor builds finished to ensure it used matching final
artifacts. Commands follow the preceding migration entries: `build-native.sh`,
sanitizer CMake build/CTest, `tests/run.ps1 -Optimize`, `build-wasm.sh`,
`build-llvm.sh` with cross targets, `check:format`, Node, Playwright and
`test-bootstrap.sh`. Logs are `build/syntax-reader-{native,asan,windows,wasm,llvm,
format,node-final,browser,bootstrap}.log`.

Warm Wasm comparison against Pages `41f35ca` (source `79c9729`), with baseline
assets saved in `build/syntax-reader-baseline`: Node 21.7.3, 12 warmups and 40
alternating pairs, compile plus canonical formatting. Median milliseconds before
-> after: small 6.248 -> 6.362; inference 6.134 -> 6.109; replacements
21.188 -> 21.258; 500 declarations 14.493 -> 14.418. These are essentially
unchanged at this scale. Reproducer `node build/profile-syntax-reader.mjs` saves
the baseline and prepares `build/profile-syntax-reader-wasm.mjs`; run the latter
for the measurements. Full p50/p95 values are in
`build/syntax-reader-wasm-performance.json`. Node-hosted Wasm measurements are
not a browser UI latency claim.

Next: migrate grammar environment/revision validation and replacement processing,
then continue semantic checking, formatting, interpretation, backend/driver and
bootstrap retirement. Removing the active declaration-reading implementation from
syntax.cpp does not mean all parser/frontend ownership or compiler control is
already Tower code.

### 2026-11-18: browser Wasm execution enabled alongside native defaults

The user requested that browser targets always start with WebAssembly checked
for execution and comparison with the interpreter, followed by push/deployment.
The previous single detected default could select only a native profile and hide
Wasm execution. Browser initialization and detected defaults now include Wasm;
restored v3 preferences also enable it while preserving native selections. A
manual session toggle remains available, but reopening/reloading enables Wasm
again. This supersedes the earlier single-default policy without changing target
ABI inference or introducing additional native defaults.

Updated existing target unit/browser checks and deployment verification to cover
Wasm plus the detected native profile, mobile Wasm-only fallback, native preference
preservation, reload after disabling Wasm, syntax-only compiler warming, and real
interpreter/Wasm output agreement alongside a native build. On Windows, `npm run
build --prefix playground` succeeded and `npm test --prefix playground` passed
217 tests with one optional fixture skipped (218 total); log:
`build/wasm-default-node.log`. Browser validation and publication results follow.
Fetched upstream compiler migration `b1a38d6` before publication; integration and
artifact validation remain required. `todo.txt` is untouched.

Integrated `b1a38d6` by rebase, preserving both appended journal entries in the
only conflict. Rebuilt the frontend with `wsl -d Ubuntu -- bash
playground/scripts/build-wasm.sh` (`build/wasm-default-rebuild.log`). An attempted
`TOWER_BROWSER_CROSS=ON bash playground/scripts/build-llvm.sh` began configuring
a fresh LLVM tablegen tree because this environment lacks the backend build cache;
stopped it before compiling LLVM. This deployment retains the previously published
LLVM/cross reactors and target packs, as the preceding deployment did. In particular,
the retained LLVM reactor SHA-256 matches Pages `41f35ca`; the rebuilt frontend
contains the new Tower declaration reader, while the retained backend reactors do
not include that internal migration. No new backend rebuild is claimed.

The initial browser run passed 126/128 checks; both failures were the same stale
test selector counting the now-visible Wasm disassembly pane as a native pane
because both use `.native-column`. Narrowed that assertion to exclude
`#wasm-disassembly-column`, keeping the actual Linux runtime request, worker and
output checks. Rebuilt the final static package and repeated Node tests: 217
passed, one optional fixture skipped (`build/wasm-default-node-final.log`). Final
browser and deployment checks use that rebuilt package.

Final validation passed: all 128 desktop/mobile Playwright cases in 2.4 minutes
(`build/wasm-default-browser-final.log`). Local `node
scripts/verify-deployment.mjs` passed both device profiles, all 23 asset hashes,
interpreter/Wasm comparison, project persistence/import/export, and all five
native targets (`build/wasm-default-deployment-local.log`). `git diff --check`
passed; source and static artifacts are ready for the authorized normal pushes.

Publication completed: source `986fb0a` (implementation `5d31b45`) was pushed
normally to master, and static artifacts `bbe018e` to gh-pages. Pages run
https://github.com/TrevorSundberg/tower/actions/runs/44413572192 succeeded.
Live verification from `playground`, `node scripts/verify-deployment.mjs
https://trevorsundberg.github.io/tower/`, passed: all 23 asset SHA-256 hashes match
the tested build; desktop and mobile both verify Wasm plus detected defaults,
matching interpreter/Wasm execution, persistence, project archives, grammar edits,
and all five native outputs. No browser page errors were reported. Log:
`build/wasm-default-deployment-live.log`; report:
`build/deployment-verification/report.json`. Both worktrees were clean after the
pushes; this final journal record is the only subsequent source change.

### 2026-11-18 — Grammar revision validation moves into Tower

Added `compiler/syntax-validation.tower` and routed the production compiler's
grammar validation through it. Tower now checks token/rule name collisions,
literal validity, duplicate captures and the declaration reader's required
capture roles. It resolves forward-reference dependencies, propagates pending
rules through reverse edges, rejects incomplete active roots, computes nullable
and productive rules, and rejects nullable Statement/repetition or unproductive
grammar. Diagnostic selection, text and source offsets agree with the preceding
native implementation, including which missing-reference chain is reported.

The validator reads the existing SyntaxNode components through the entity store.
Its borrowed, sorted rule/alternative view, reverse dependency lists, queue and
nullable/productive flags are disposable analysis indexes, not an authoritative
grammar copy or another public IR. Nodes, comments, templates and provenance are
not mutated. Pending slots point to the actual source terms responsible for the
unresolved dependency. Only a successful executable revision filters those rules;
their original declaration entities remain available for later resolution.
Capture checks reuse a length-aware borrowed-name hash set; rule lookup uses a
binary search of the current revision's sorted names. This changes no source
recognition algorithm or parser complexity contract.

Removed the active native validation algorithms from syntax.cpp (103 removed
lines and 22 adapter lines added). The previous algorithms are retained in
`bootstrap/syntax-validation-seed.cpp` for the transitional native seed/stage1
and an independently named differential-test target. This is a production-code
migration, not a claim that total project-owned C++ has vanished: that seed and
the borrowed-view adapter must also be retired when the Tower-built bootstrap
replaces them. No third-party implementations were changed.

Allocation failures return false, dispose all temporary indexes and any partial
diagnostic, and clear all pending outputs. The caller supplies the generic
allocation-error message when the diagnostic buffer is empty. Ordinary invalid
grammar retains its diagnostic and pending information. Source entities are
borrowed for the duration of the call; the ABI requires unique, bytewise-sorted
names and valid shared alternative/term components, and does not accept arbitrary
untrusted native pointers as a serialization format.

Implementation trials: the first compile rejected a comparison directly after
return, because Foundation return accepts an operand; changed it to a named
boolean. The next link exposed an accidental `tower_trap` dependency from the
capture hash modulo's potentially zero divisor. Added an explicit nonzero-table
guard before modulo, as the existing LR hash index already does. This allows
lowering to prove the divisor is valid without adding a new host runtime import.
Both issues were fixed before the final builds; no language semantics or trap
contract was weakened to make the link succeed.

Added tests against the preceding native validator on 600 deterministic random
dependency graphs (seed 0x56414c49), including cycles, multiple unresolved names,
alternatives, empty productions, repetitions and active roots. Tests compare
acceptance, exact diagnostic bytes, offsets and the identity of pending source
terms. Explicit cases cover reactivation after a forward name resolves, skip
versus token references, declaration-role edits, capture/name bytes containing
NUL, 1,500 distinct captures and duplicate detection. Allocation-failure sweeps
exercise success, pending and diagnostic paths; entity and buffer counts return
to baseline. Native ASan/UBSan instruments the harness/adapters, not every
generated Tower instruction; the tests execute the actual Tower validator.

Validation passed: native compiler build; Linux ASan/UBSan CTest 4/4;
optimized Windows parser/compiler suite; Wasm plus LLVM/cross-target reactors;
canonical formatting for all 44 Tower files; all 218 Node tests; all 16 bootstrap
optimized-IR/object comparisons across Linux x64, Windows x64, Wasm32 and macOS
ARM64, plus explicit-grammar-input checks; all 128 desktop/mobile browser cases
(3.3 minutes).
Commands from the repository root:
`bash playground/scripts/build-native.sh` in WSL;
`cmake --build /root/.cache/tower/core-asan --parallel 3` and CTest;
`scaffolding/tests/run.ps1 -Optimize -BootstrapCompiler build/parser-tests/host-bootstrap.cmd`;
`build-wasm.sh` and `build-llvm.sh` with
`TOWER_BOOTSTRAP_COMPILER=/root/.cache/tower/native/towerc-stage1`,
`TOWER_BROWSER_CROSS=ON`, `TOWER_BUILD_JOBS=3`;
`npm run check:format --prefix playground`;
`node --test playground/tests/*.test.mjs`;
`npm run build --prefix playground`;
`npx --prefix playground playwright test --config playground/playwright.config.mjs`;
and `bash playground/scripts/test-bootstrap.sh` in WSL.
Logs are `build/syntax-validation-{native,asan,windows,wasm,llvm,format,node,
dist,browser,bootstrap}.log`.

Performance check: saved the previously built b1a38d6 Wasm and grammar inputs in
`build/syntax-validation-baseline` before rebuilding. Ran
`node build/profile-syntax-validation.mjs` with Node 21.7.3, 12 warmups and 40
alternating paired samples of compilation plus canonical Foundation formatting.
Median milliseconds before -> after: small 4.896 -> 4.746; inference
5.191 -> 5.101; replacements 17.050 -> 16.457; 500 variable declarations
11.828 -> 11.948; 50 grammar declarations 450.464 -> 437.893. No meaningful
regression was observed in these fixtures; the small differences do not establish
a general speedup. Full p50/p95 results are in
`build/syntax-validation-performance.json`. These are Node-hosted Wasm compiler
measurements, not end-to-end browser typing latency. The grammar fixture still
rebuilds derived tables as declarations change; this port is not incremental
table construction optimization.

Remaining native work includes revision/environment ownership, grammar emission
and declaration-start analysis, template compilation/expansion, end-of-module
pending-message presentation, semantic checking, formatting, interpretation,
backend/driver orchestration and bootstrap/adapters. The next coherent migration
is grammar revision construction or replacement processing over these same
shared nodes. Checked-in portable Tower compiler binaries remain unfinished.
Unrelated working notes and todo.txt were left untouched.

Integration follow-up: rebased this port over upstream `5d31b45`, `986fb0a` and
the deployment-note commit `99f28a5`. The upstream change enables Wasm alongside
detected/saved native browser targets. Used a clean detached worktree for the
rebase and reconciled the append-only journal conflict by preserving the upstream
entries followed by this migration entry. Restored the working checkout with
`git reset --keep` after stashing only its unrelated journal additions, then
restored that stash. All 1,045 unrelated journal additions remain unstaged;
todo.txt and the other local notes were not edited or staged by this work.

Compiler/build sources are byte-identical to the versions validated before the
rebase (`git diff 3ef45db HEAD -- CMakeLists.txt cmake scaffolding` is empty).
Rebuilt the combined static playground and repeated the affected integration
suites: 218 Node tests and 128 desktop/mobile tests passed, the latter in 3.3
minutes. Logs: `build/syntax-validation-combined-{dist,node,browser}.log`.
The local playground contains the new compiler. This task pushes source to
master; it does not republish the gh-pages artifacts.
### 2026-11-18: shared playground output panes

The output area had static instruction/LLVM/Wasm panes, separate execution markup,
and dynamically built native panes with a dedicated status footer. Introduced
OutputPane for a shared heading, scrolling body, optional diagnostics and optional
download footer. Active/cancelled/failed statuses share the heading; successful
pane statuses clear, leaving the single overall execution/comparison summary.
Wasm and native artifacts now share blob URL replacement/revocation, byte counts,
and source/target download naming. Removed the native-only status bar and styles.

Initial Windows validation found stale local build/browser-wasi/tower.wasm:
execution failed with "tw_exec_create_files is not a function". This is an artifact
mismatch with the existing project UI, before compilation reaches the pane changes.
The first focused Playwright run was stopped; fetch found newer compiler and target
default work on origin/master. Rebase and reuse of the corresponding published
compiler artifacts precede further validation. Python and Ubuntu WSL are absent
on this host; Node is available at the local nvm v21.7.3 path (added to command PATH).
Validation and publication results follow. todo.txt remains untouched.


Rebased onto origin/master 99f28a5, preserving the newer Wasm-plus-native defaults
and both journal histories. Resolved overlapping pane initialization and target
selection assertions. Reused compiler binaries and target packs from published
gh-pages bbe018e; the frontend SHA-256 is
cab8f1c28b4d634e2784a92137d019c75c71e8f9be6ef409fbd7b4bc3bb97afc.
No compiler/backend rebuild is claimed for this UI change.

Validation: npm run build --prefix playground succeeded; npx playwright test
--reporter=line from playground passed all 128 desktop/mobile checks in 3.5 minutes
(build/shared-panes-browser.log). Existing export/cancellation checks now assert
shared pane bodies, hidden successful phases, heading cancellation and download
footers. Inspected desktop and mobile target screenshots; code remains scrollable
and downloads stay below the content without a native status row.

npm test completed with 216 passes, one optional native-output fixture skipped,
and one environment failure: the C-linking check cannot open the absent
build/linking/wasm-fixture.a (build/shared-panes-node.log). Windows has neither the
previous Ubuntu WSL distribution nor a local Clang/llvm-ar toolchain available;
this unrelated fixture was not fabricated or the test weakened. Browser execution
and native artifact generation are covered by the passing browser suite.
git diff --check passed. README documents the shared presentation contract.


Publication: the local deployment verifier passed both device profiles, all 23
asset hashes and all five native downloads (build/shared-panes-deployment-local.log).
A final pull/rebase included f034216's grammar-validation source migration; only
journal append conflicts required resolution. git diff b95053d HEAD -- playground
was empty after the rebase, confirming the tested playground sources were unchanged.
The deployment intentionally retains bbe018e's published compiler binaries and
does not claim to include f034216's newer internal compiler migration.

Source cda5425 (implementation 2f80d01) was pushed normally to master. Static output
2038bba was pushed normally to gh-pages, changing only app.js/map, index.html,
style.css and target-worker.js/map. GitHub Pages run
https://github.com/TrevorSundberg/tower/actions/runs/44415313097 succeeded.
Live command from playground: node scripts/verify-deployment.mjs
https://trevorsundberg.github.io/tower/ . All 23 fetched assets matched the local
build by SHA-256; desktop and mobile verified execution agreement, project
persistence, editable grammar, native builds/downloads, equal columns and defaults.
No browser page errors were reported. Log: build/shared-panes-deployment-live.log;
report/screenshots: build/deployment-verification/. todo.txt was not modified.

### 2026-11-18: execution panes before LLVM views

Pulled master with `git pull --ff-only` to a887bfc before editing. Reordered
the shared OutputPane initialization in playground/src/app.mjs so the horizontal
order is Tower instructions, Interpreter Execution, Wasm Execution, LLVM raw,
LLVM optimized, followed by the existing disassembly panes. DOM order supplies
both desktop and mobile grid order; target visibility logic remains unchanged.

Validation on Windows with Node and Chromium: `npm run build --prefix playground`
and `git diff --check` passed. From playground, `npx playwright test
tests/browser/export.spec.mjs --grep 'target selection controls' --reporter=line`
passed both desktop/mobile checks, including target toggles and equal widths.
A separate Playwright DOM/geometry probe confirmed the first five headings and
strictly increasing x coordinates on desktop (9, 246, 483, 720, 957) and mobile
(7, 147, 287, 427, 567). Deployment updates only app.js and its source map from
this build on top of gh-pages 2038bba, preserving the published compiler assets;
no compiler rebuild is claimed. todo.txt remains untouched.

Published artifacts as gh-pages 62c74e8 and pushed source 66b9bdd to master.
GitHub Pages run 44415999332 succeeded. The live app.js SHA-256 matches the local
build: a342681dfdeac43fee137ecaa0da145f2b774df940c2a52fcecbdb804cd0bbd7.
Live Playwright checks confirmed the requested heading/geometry order on desktop
and mobile, plus matching interpreter/Wasm output of 42 for `print(42);`.
The first ad-hoc execution probe incorrectly expected execution from the default
syntax-only example; a follow-up also exposed PowerShell pipe encoding replacing
the status separator with `?`. Corrected the probe with explicit executable source
and an ASCII regex for the status separator; both device checks then passed.

## 2026-11-18 — Native Linux return: build and deployment audit

Environment: SteamOS x86-64 on Steam Deck, kernel 6.16.12, 14 GiB RAM and
Docker 28.3.3. The host had Node 21.7.3 but no CMake, Ninja or native C/C++
compiler. The checkout was initially clean at `8d5030c`. The root Docker entry
point still deleted build directories, built an unrelated full host LLVM and
used an old pthread WASI SDK path, bypassing the current seed → stage1 → Tower
utilities build. It also required a TTY and assumed UID/GID 1000.

Replaced that route with an Ubuntu 24.04 container supplying LLVM/Clang/LLD 19,
CMake/Ninja, Node 22, Chromium system dependencies and qemu-user. The normal
scripts retain their pinned/checksummed WASI SDK 34 installer. The wrapper uses
the caller's IDs, preserves the source checkout path, persists caches and limits
parallel compilation (default two jobs). `internal.sh` now runs current native,
sanitizer, bootstrap, WASI, both browser compiler and linking checks, followed by
Node/browser/formatting and static deployment verification. This is containerized
native Linux validation, not a claim that Ubuntu-linked compiler binaries form
the future portable compiler distribution.

Inspection found that target-pack and Windows linking tests unconditionally ran
PE files, assuming WSL interop. Linux now still compiles/links those artifacts,
executes them with WSL/Wine when available, and reports execution unavailable
otherwise. ARM64 Linux execution uses QEMU when installed; macOS execution still
requires a Mac. Missing execution support is not counted as an execution pass.

Packaging previously left stale optional LLVM/cross assets in `dist/`, and the
broad cross-backend ENOENT handler could hide missing target support files.
Builds now clear generated output, require all declared inputs when a cross
compiler exists, support `TOWER_REQUIRE_BACKENDS=1` for full deployments, and
write `.nojekyll` plus a SHA-256 manifest. The verifier checks every published
file (excluding the hosting-only dotfile) against the local manifest before its
existing desktop/mobile interaction checks. A new isolated packaging regression
covers full→parser-only rebuilds, incomplete support packs and required-backend
failure; `node --test playground/tests/build-packaging.test.mjs` passed.

Reproduction started with `TOWER_BUILD_JOBS=3 ./build.sh`, with output retained
in `build/linux-validation/full.log`; image setup is also recorded in
`build/linux-validation/docker.log`. Full compiler/browser/deployment results
will be appended after completion; these changes are not yet all validated.

Before publishing, a remote-ref check found two newer compiler migrations already
published (`origin/master` at `61f93cc`, Pages at `110b5a3`). Stopped the initial
LLVM build, preserved these Linux changes, fast-forwarded the clean base, and
restored the changes. The journal append conflict was resolved by retaining both
complete entries. Initial `8d5030c` validation had passed native sanitizer 4/4,
16 bootstrap comparisons, and the browser parser build; those results do not
stand in for validation of the newly fetched compiler. Re-running the pipeline
on `61f93cc` uses the existing completed LLVM object cache; its log is
`build/linux-validation/current.log`. No older site was published.

Current-checkout checkpoint: `TOWER_BUILD_JOBS=4 ./build.sh` on `61f93cc` has
rebuilt the native compiler and browser parser and passed sanitizer CTest 4/4,
all 16 bootstrap comparisons, and explicit grammar-input checks. The cold
LLVM/WASI build is still running. Tool versions in this image are Clang 19.1.1,
CMake 3.28.3, Ninja 1.11.1, Node 22.23.5 and QEMU 8.2.2; Chromium is Playwright's
pinned build 1255. Root scripts now also have LF checkout attributes. Added a
post-Node check that executes the browser-produced Linux x64/ARM64 programs and
separately linked library fixtures; this new end-to-end check is pending the
browser compiler build. `build.sh` also accepts a command to run in the same
container, so its LLVM-dependent native compiler is usable without installing
LLVM into SteamOS. The memory-example invocation produced `5`, `84`, `42` in
the initial checkout check (`build/linux-validation/container-cli.log`).

Container permission audit during the LLVM build found that Docker creates the
parent `/tmp/tower-home` as root even though its mounted `.cache` directory is
owned by the caller. npm's default `$HOME/.npm` would therefore be unwritable.
The wrapper now explicitly sets `npm_config_cache=/tmp/tower-home/.cache/npm`.
A fresh wrapper invocation reports that path (`build/linux-validation/npm-cache.log`),
and `npm cache verify` succeeds as UID 1000. For the already-running container,
an ephemeral root-owned `.npmrc` supplies the identical cache setting so the long
compiler build need not restart. The host npm configuration was not changed.
Also verified the LLVM submodule's pinned commit can be fetched from its configured
upstream URL with a shallow, blob-filtered fetch into an ignored temporary bare
repository (`build/linux-validation/submodule-fetch.log`); documentation now
explicitly initializes submodules before a fresh build.

Final integration checkpoint: all three vendored LLVM code-generation libraries
(WebAssembly, X86, AArch64) and all four LLD libraries (Wasm, ELF, COFF, Mach-O)
built successfully from a cold cache. Paused before finishing the now-superseded
Tower reactors, fetched concurrent project work, and fast-forwarded to `cda5425`
(shared output panes plus grammar revision validation). Preserved both journal
histories and the newer deployment verifier's project/UI checks while retaining
the full asset manifest check. No third-party revision, AGENTS.md or todo.txt
changed in this update; `sha256sum -c build/linux-validation/todo.sha256` passed.
The complete validation pipeline now runs on this integrated snapshot with
`TOWER_BUILD_JOBS=4 ./build.sh`, logged to `build/linux-validation/final.log`.
The native/parser/bootstrap checks are deliberately repeated because the compiler
and UI changed; the expensive third-party compilation is reused. This snapshot,
not the initial checkout or `61f93cc`, is the release candidate for this audit.

The full integrated compiler build completed, native linking and Linux x64/ARM64
execution passed (ARM64 under QEMU), all 219 Node tests passed with zero skips,
and canonical formatting passed. Windows/macOS outputs linked; Windows execution
was explicitly skipped without Wine/WSL. Browser tests were progressing when a
final remote check found the execution-pane ordering update (`42e2349`). Its
only executable-source change moves four pane-creation statements in app.mjs.
Preserved that update, retained the unchanged compiler/Node validation, and restarted
the browser/deployment checks on the rebuilt bundle rather than rerunning unrelated
compiler builds. This supersedes cda5425 as the final UI snapshot. The remaining
checks are logged in `build/linux-validation/web-final.log`.

The first final-UI browser run exposed a test-helper race on desktop in the
invalid-Bedrock reload case. The trace shows reload completing, then
`selectDocument`'s instantaneous `entry.count()` returning zero before asynchronous
project hydration completed. The helper incorrectly selected `example:bedrock`,
which is not a project option, and waited until the 30-second test timeout.
The page snapshot showed the persisted invalid grammar and expected diagnostic;
the product was not frozen. Preserved the trace/screenshot/context under
`build/linux-validation/bedrock-timeout/` (original log: `web-final.log`).

The helper now awaits a visible file-tree entry before deciding whether to click
an existing file or switch examples. The regression reload now waits only for
navigation commit, deliberately exercising selection during startup. No global
timeout increase or retry was added. Restarted all 128 desktop/mobile checks plus
the local deployment verifier; final results go to `web-verified.log`. Compiler,
Node and emitted-binary checks are unchanged by this test-only synchronization fix.

Final local results: all **128/128 desktop/mobile Playwright tests passed** in
5.3 minutes with the hydration synchronization fix, followed by successful local
deployment verification. All 36 HTTP assets (manifest plus its non-dotfile entries)
matched the tested bundle byte-for-byte; desktop/mobile compilation, execution,
project import/export, editable grammar, persistence, downloads and layout checks
passed. Added an unsimulated Linux Chromium context to the verifier: it selected
WebAssembly plus Linux x64 automatically. The local report is preserved at
`build/linux-validation/local-deployment-report.json`; combined output is in
`build/linux-validation/web-verified.log`.

Across this audit, final compiler validation passed sanitizer CTest 4/4, all 16
bootstrap comparisons, native and browser compiler builds, native/archive linking,
all target-pack links, Linux x64 execution and Linux ARM64 execution under QEMU,
219/219 Node tests with no skips, browser-produced native executables and linked
library fixtures, and canonical formatting. Windows PE execution remains explicitly
unverified without Wine/WSL, and macOS execution requires a Mac; successful linking
does not establish execution on those systems. Final shell syntax, diff whitespace
and `todo.txt` checksum checks passed. No Tower semantic model or compiler
operation was changed by the Linux infrastructure fixes.

Published the validated `42e2349` UI/compiler snapshot from a dedicated Pages
worktree after confirming the remote still pointed to the corresponding release
`62c74e8`. Verified every staged asset against the local manifest, then made a
normal fast-forward push to `gh-pages`: deployment commit
`bd3a8566b4b861b9e0c006f09b011900041111a1`. The first commit attempt lacked local
Git identity; retried with the repository's existing author identity scoped to
that command, without changing global Git configuration. GitHub Pages reports
this commit as `built` with no error. Source infrastructure changes remain in
the working tree for review; the published branch contains generated site assets.

Live verification passed with:
`./build.sh node playground/scripts/verify-deployment.mjs https://trevorsundberg.github.io/tower/`.
All 36 hosted assets matched the local build, all desktop/mobile interaction and
target-selection checks passed, and real Linux Chromium again selected Wasm plus
Linux x64. Evidence is in `build/linux-validation/online.log` and
`build/linux-validation/online-deployment-report.json`. The generated deployment
manifest is checked in on `gh-pages`. The audit is complete for Linux x64 and
ARM64-under-QEMU execution, browser execution and the live Pages deployment;
Windows/macOS native execution and portable standalone compiler distribution
remain outside the verified results. Re-run `./build.sh` for the complete local
pipeline; publishing remains an explicit separate action.

### 2026-11-18 — Grammar production construction and its tests move to Tower

Scope agreed with the user: this task owns grammar construction; independent
tasks own formatting and interpretation. Those implementations were not edited.
The user also made measured performance an acceptance criterion and asked that
new tests be written in Tower rather than adding more C++ to translate. This
supersedes the first draft's native test fixture: that uncommitted C++ test file
was removed, and the fixtures/checks now live in `scaffolding/tests/syntax-emission.tower`.

Implemented `compiler/syntax-emission.tower` and switched production `syntax.cpp`
to it for both ordinary revisions and replacement-template parser construction.
Tower now assigns literal IDs, avoids generated-name collisions (including names
of pending definitions), emits ordinary/repeated/captured productions and token
exclusions, builds template token wrappers, and computes declaration reachability
and leading token/literal sets. Production order, generated flags, capture roles,
and user-alternative/provenance mappings preserve the previous implementation.
Template hole insertion, template checking/expansion and session/environment
ownership remain native; this port does not claim those stages are complete.

Construction directly creates the existing shared Rule/Reference/String/Range
entities, using Tower's entity/component APIs and existing payload definitions.
There is no second AST, serialized instruction stream or authoritative grammar
model. Hash tables, FIRST sets, provenance/name views and queues are disposable
revision indexes. A small `entity_create_related` primitive allocates in the
existing entity's store. Parser component types now register their existing Tower
payload size/finalizer when first requested; the native creation adapter uses
that same finalizer, so Tower can create the components directly without hidden
native grammar-building algorithms. The `SyntaxEmissionInput` ABI borrows shared
source entities; source declarations are not modified. A failed emission frees
its indexes, leaves partial output children owned by its output root, and the
caller discards that root. Existing revisions remain usable.

Performance-related choices: intern names in a hash index, use one monotonically
increasing helper ordinal with exact collision checks, and mark token exclusions
through that index instead of comparing every literal with every exclusion.
The exclusion mark identifies the immutable source term, so repeated emission
of the same term needs neither a global clear nor an overflowing generation
counter. Removed duplicate native reservations of every rule/token name; Tower
already reserves them and supplies the complete used-name index back to the
temporary native revision adapter. This is construction-time work only; source
recognition retains the existing LR/DFA control and does not gain a search or
backtracking path. Rebuilding tables after successive grammar edits is still a
separate optimization opportunity.

Bootstrap accounting: `bootstrap/syntax-emission-seed.cpp` retains the prior C++
algorithm as the seed/stage1 and separately renamed differential reference.
It is not an additional production implementation or a third-party exemption.
Its native ABI adaptation, the production borrowed-view adapter, native test
runner and component registration remain migration debt. New functional test
logic is Tower: the existing native runner merely supplies component type IDs,
invokes the Tower test entry and reports its failure index. Test-only Tower code
is appended only for `TOWER_PARSER_ONLY`, not shipped in browser/compiler builds.
An eventual validated portable Tower compiler distribution must replace the
owned bootstrap sources; that endpoint has not been reached by this port.

Validation and trials (Windows/PowerShell, WSL Orchestral-Revng, LLVM 19,
WASI SDK 34, Node 21.7.3):

- Tower fixtures compare exact shared parser component trees, token IDs,
  generated flags, captures, production indexes, helper origins, literal/name
  metadata, declaration starts and template wrapper names against the retained
  native algorithm. Cases include Bedrock, absent Statement, empty alternatives,
  collisions with generated spellings, skipped/contextual tokens, cyclic and
  nullable references, all repetition kinds, captures and large exclusions.
- 400 deterministic generated graphs are checked in ordinary and template modes.
  The Tower test generator uses an explicit u32 LCG (seed 1162692948), replacing
  the draft's native mt19937 fixture. The 512-literal exclusion fixture exercises
  multiple repeated sets. Failure injection sweeps every allocation until
  success on representative ordinary/template inputs and checks live allocation
  counts after disposing partial roots. The earlier native fixture also passed
  before being removed, but it is not the maintained test implementation.
- Linux CTest with ASan/UBSan passed 4/4; optimized Windows parser/compiler checks
  passed. The sanitizers instrument the native harness/adapters, not every
  instruction in generated Tower objects. The failure/parity suites execute the
  production Tower implementation on both targets.
- Native compiler, Wasm frontend and Wasm LLVM/cross reactors built successfully.
  The canonical formatter check covers 46 Tower files, including this new
  implementation and the new Tower tests.
- Early compilation failures identified reserved names (`token`, `skip`,
  `expected`) used as internal identifiers, unsupported member access directly
  on a returned call, and bool bitwise expressions in test scaffolding. These
  were rewritten using ordinary Foundation declarations/operands; no special
  grammar or semantic features were added for the port.
- Narrowing computed terminal ordinals generated an unwanted `tower_trap`
  dependency. Explicit width masks preserve the previous uint32 truncation
  semantics and allow the backend to prove the conversions safe. Test-generated
  ASCII ordinals use explicit masks as well. No trap import was added.
- One early four-target bootstrap comparison saw different source revisions
  because the exclusion-index edit rebuilt the composed module during the run
  (72-byte versus 80-byte name entries in the IR). This was an invalid trial,
  not evidence of host nondeterminism. Final comparisons must run with inputs
  frozen for the entire seed/Tower pair.

Reproduction commands and logs use the `build/syntax-emission-*` prefix:

```text
wsl -- bash -lc 'cd /mnt/c/Sandbox/tower && bash playground/scripts/build-native.sh'
wsl -- bash -lc 'cd /mnt/c/Sandbox/tower && cmake --build /root/.cache/tower/core-asan --parallel 3 && ctest --test-dir /root/.cache/tower/core-asan --output-on-failure'
.\scaffolding\tests\run.ps1 -Optimize -BootstrapCompiler C:\Sandbox\tower\build\parser-tests\host-bootstrap.cmd
TOWER_BOOTSTRAP_COMPILER=/root/.cache/tower/native/towerc-stage1 bash playground/scripts/build-wasm.sh
TOWER_BOOTSTRAP_COMPILER=/root/.cache/tower/native/towerc-stage1 TOWER_BROWSER_CROSS=ON TOWER_BUILD_JOBS=3 bash playground/scripts/build-llvm.sh
npm run check:format --prefix playground
node --test playground/tests/*.test.mjs
npm run build --prefix playground
npx --prefix playground playwright test --config playground/playwright.config.mjs
bash playground/scripts/test-bootstrap.sh
```

Paired benchmarks are now reproducible checked-in scripts rather than new C++
test programs. Save an f034216 Wasm build before rebuilding the frontend, and
build the baseline native compiler in its own clean checkout/cache. This run
used detached 5ce6497 (compiler/build sources identical to f034216) and
`/root/.cache/tower/emission-baseline`; comparisons explicitly pass the same
Bedrock/Foundation files to both native binaries. The Wasm baseline is
`build/syntax-emission-baseline/tower.wasm`. Commands:

```text
python3 playground/scripts/profile-grammar-port-native.py /root/.cache/tower/emission-baseline/towerc /root/.cache/tower/native/towerc build/syntax-emission-native-performance-final.json
node playground/scripts/profile-grammar-port.mjs build/syntax-emission-baseline/tower.wasm build/syntax-emission-performance-final.json
```

Native measurements use 4 warmups and 30 alternating paired fresh processes;
Wasm uses 12 warmups and 40 alternating paired samples in initialized runtimes.
The reports retain raw samples and p50/p95. Native output and Wasm canonical
Foundation results are checked for agreement. Native CLI `compile` includes
interpreter-machine construction; it is not an isolated front-end timer.
Wasm timings include compilation and canonical Foundation formatting, not
browser UI latency or LLVM optimization. Some exploratory runs overlapped other
build/test work and are retained as exploratory logs, not clean speed guarantees.

Final paired medians (milliseconds, native total includes bootstrap/compile/execute):

| Fixture | Native before | Native Tower | Wasm before | Wasm Tower |
| --- | ---: | ---: | ---: | ---: |
| small | 102.173 | 99.215 | 4.735 | 4.633 |
| inference | 103.475 | 100.596 | 5.169 | 5.041 |
| replacements | 111.377 | 107.853 | 16.223 | 15.766 |
| declarations500 | 107.753 | 104.332 | 12.717 | 12.818 |
| grammar50 | 486.796 | 482.211 | 434.105 | 425.073 |

The final native compilation-phase medians also improved for all five fixtures.
The Wasm declaration-only fixture was 0.101 ms (about 0.8%) slower in this
run; earlier paired runs changed direction by similarly small amounts. Treat
that workload as approximately unchanged, not a verified speedup. Grammar-edit
and replacement-heavy fixtures improved. These modest measured gains are not
a guarantee that every input, host or percentile gets faster. Tail timings
were noisy; the reports retain them and raw paired samples. Final benchmark
scripts ran sequentially after our builds completed; this is still a shared
developer machine, not exclusive benchmark hardware. The frontend Wasm shrank
from 4,312,645 bytes to 4,287,221 bytes before the final redundant-registration
cleanup (artifact sizes are measurements, not semantic requirements).

Before upstream UI integration, the browser integration suites passed 218 Node
tests and 128 desktop/mobile Playwright tests. Final frozen-input bootstrap
and combined UI integration results are recorded in the follow-up entry.


Remaining native migration work includes grammar revision/session ownership,
replacement template checking/expansion, diagnostics/presentation, semantic
checking, formatter/interpreter (separate assigned tasks), backend/driver
orchestration and the owned seeds/adapters. No production formatter/interpreter
source was changed here. Unrelated local notes and todo.txt were not edited or
staged by this task. Source pushes and Pages publication are separate; this
task does not republish Pages.

Grammar-construction integration follow-up: rebased `020888e` onto upstream
`42e2349` (shared output panes and execution-pane ordering) in a separate detached
worktree. The only conflict was append-only journal text; retained all upstream
entries followed by this migration entry. Stashed only the unrelated working
journal notes during `reset --keep`, then restored them. All 1,045 unrelated
journal additions remain unstaged, along with the pre-existing AGENTS.md,
docs/foundation.md and todo.txt edits. Compiler/build sources are unchanged by
this rebase (`git diff 020888e HEAD -- scaffolding CMakeLists.txt cmake` is empty).

Final validation on the combined checkout: 46 canonical Tower files, 218 Node
tests, 128 desktop/mobile Playwright tests (3.2 minutes), and all 16 optimized-IR
plus object comparisons across Linux x64, Wasm32, Windows x64 and macOS ARM64.
Explicit bootstrap grammar-path checks also passed. The final bootstrap run kept
the composed source frozen across each native-reference/Tower pair. Logs are
`build/syntax-emission-{format,node,dist,browser,bootstrap}-final.log`; native,
ASan/UBSan and Windows checks are in the corresponding non-final log names.
The static playground was rebuilt with the combined code. Source is pushed;
Pages publication is separate and was not performed here.

Clarification: the failure-injection sweep covers Tower allocator calls,
including shared entity/component allocation. It does not inject failures into
the remaining native std::map/std::vector adapter allocations. Final frontend
Wasm size after removing redundant native reservations is 4,286,924 bytes
(baseline 4,312,645). New functional test logic remains entirely Tower; the
remaining native seed/reference and thin ABI/test-runner wiring are still owned
migration debt, not exceptions to the eventual C++-removal goal.

Final concurrent-work integration: the first push was rejected because upstream
`235cdbe` added Linux build/deployment validation while this task was testing.
Rebased again with the same journal-only conflict resolution and preservation of
local notes. No compiler/build-definition source changed (`git diff 35a4231 HEAD
-- scaffolding CMakeLists.txt cmake` was empty before this note). The port was
successfully pushed as `60f1653` over that upstream commit.

Validated the combined packaging changes rather than overwriting them: a full
static build with `TOWER_REQUIRE_BACKENDS=1` contains both LLVM reactors and all
declared target support files; 219 Node tests (including the new packaging test)
and 128 desktop/mobile browser tests (3.5 minutes) passed. The new
`node playground/scripts/verify-local.mjs` also passed: all 36 manifest assets
matched, and desktop/mobile checks verified matching execution, forward module
bindings, editable grammar, persistence, target defaults and native downloads.
That verification served the local bundle on an ephemeral HTTP port; it was not
a GitHub Pages deployment. Logs: `build/syntax-emission-packaging-{dist,node,
browser,verify}.log`. The earlier final native, sanitizer, formatter and
four-target bootstrap results still apply to these unchanged compiler sources.

## 2026-11-18: require synchronization, deployment and push every turn

The user requested a standing start/end workflow, including publishing this
instruction change. AGENTS.md had no such rule. Added a Turn workflow section:
start with `git pull --rebase`; finish by committing, pulling with rebase again,
resolving conflicts, validating, deploying and pushing, including documentation-only
turns. Preserve local work and report blocked steps accurately without force pushes.

On Windows/PowerShell in C:\Sandbox\tower, the initial working tree was clean at
`a887bfc`. `git pull --rebase` fast-forwarded master to `60f1653`. The existing
GitHub Pages configuration publishes the root of `gh-pages`; its latest successful
deployment is `9c52b59`, from the separate formatter worktree. This documentation
change requires no new website assets, so redeploy that current published snapshot
through the established Pages build API. This does not claim the latest master
compiler sources have been rebuilt or published. Deployment verification and final
source synchronization results follow below. todo.txt is outside this change.

The end-of-turn `git pull --rebase` picked up `fa3bc51` and conflicted only where
both commits appended journal entries. Kept the upstream integration notes and
this entry, then `git -c core.editor=true rebase --continue` succeeded. Only
AGENTS.md and this journal differ from upstream; `git diff --check` passed.

`gh api --method POST repos/TrevorSundberg/tower/pages/builds` redeployed `9c52b59`.
Pages run https://github.com/TrevorSundberg/tower/actions/runs/44423963639 completed
successfully; the Pages build API reports `built` with no error. A Node fetch and
SHA-256 check compared all 36 hosted assets to that commit's deployment manifest,
including the manifest itself, HTTP 200 responses and Wasm content types. All
passed; the local report is `build/turn-workflow-deployment-verification.json`.
No compiler/browser regression suite was rerun for this documentation-only change.

### 2026-11-18 — Remaining project-owned C/C++ migration audit

Status audit requested while the formatter/interpreter tasks finish on other
machines. Fetched origin and inspected source/build registration rather than
counting removed lines as completion. Local master started at fa3bc51;
origin/master is f2c9542. A clean detached audit worktree pulled/rebased onto
that head so the user's unrelated working notes and todo.txt remain intact.

The formatter port is pushed at origin/port/canonical-formatter-tower c50dfeb
(implementation e137895, registration a46cc6f). It is NOT merged into master:
its merge base with current master is 235cdbe. Its journal records verified
publication as Pages 9c52b59, including the Tower frontend formatter, with
existing LLVM reactors retained. Those are the other worker's reported checks,
not a fresh combined compiler validation here. No interpreter-port commit is
visible in fetched branches; treat the user's report of final testing as pending
integration, not locally verified completion. Neither branch was merged by
this status audit.

Assuming both assigned ports finish, remaining production work falls into:

1. Replacement template checking and expansion in syntax.cpp: typed holes,
   template token handling, capture substitution, expansion/provenance and
   errors. Grammar production construction itself is already Tower.
2. Grammar/session/parser coordination: revision ownership and caches,
   incremental declaration installation, streams, diagnostics/repair selection,
   highlighting, and Bedrock seed creation. LR/LALR analysis, table construction,
   runtime decisions, tree assembly and DFA/regex machinery already have Tower
   production implementations; the remaining parser.cpp is not evidence those
   algorithms still need their first port.
3. Semantic compilation in core.cpp and semantic queries in core-nodes.cpp:
   scopes/module bindings, types/layout, operand and operation validation,
   calls/control flow, template/type-constructor integration and diagnostics.
   Foundation component storage is Tower; semantic checking is still native.
4. Backend and host integration: our LLVM lowering, optimization/target/link
   orchestration, native CLI and browser exports/serialization. LLVM/lld remain
   third-party dependencies, but our llvm-engine.cpp/llvm-backend.cpp logic is
   owned code and must move. The strict no-owned-C++ endpoint also requires a
   callable external API boundary for any third-party C++-only interfaces.
5. Runtime/adapters/tests and bootstrap retirement: runtime.c, allocator and
   component lifecycle/registration bridges, native tests and references,
   plus the owned bootstrap seeds. Many seeds already have Tower successors;
   remove them after the Tower-built compiler can build itself without them.
   Finish with validated portable Windows/macOS/Linux compiler binaries and a
   clean-checkout build that needs no owned C/C++ sources.

Recommended next bounded port: replacement template checking/expansion, keeping
formatter and interpreter ownership separate. Semantic checking is the largest
remaining language-level task and can be separately bounded around the shared
Foundation entities and existing type/layout contract. Native seeds/adapters
are not permanent exceptions. No reliable percentage or universal speedup is
inferred from line counts; require behavioral, round-trip, deterministic build
and measured performance checks for each port.

Audit reproduction: git fetch origin; git log origin/master;
git log origin/master..origin/port/canonical-formatter-tower;
git diff origin/master...origin/port/canonical-formatter-tower --stat;
inspect CMakeLists.txt and scaffolding/{syntax,parser,core,core-nodes,
llvm-engine,driver,browser,tower}.cpp plus runtime.c. No compiler code changed;
existing implementation tests were not rerun for this documentation audit.

Audit publication check: requested a rerun of Pages run 44422938317, retaining
current published assets rather than replacing the separately published formatter
with this checkout's older frontend. GitHub still reports that rerun queued.
The latest completed deployment 44423963639 is successful for 9c52b59 and the
Pages build API reports that revision built. The read-only live hash check
(build/verify-migration-audit-pages.mjs) verified the manifest and all 35 served
assets against origin/gh-pages; report build/cpp-migration-audit-pages.json.
No new combined compiler build or browser behavior test is claimed here.
