# Temporal opcode research journal

Started: 2026-09-05. Last updated: 2026-09-05.

**Scope clarification from the author: Tower is a GENERAL-PURPOSE programming language. Games are an example application, not the language's intended scope. Its compiler is another intended application. Entry 14 corrects the earlier overemphasis on a game-product gap; general-purpose native incremental languages, especially CEAL, are direct comparisons.**

**Competition clarification: direct technical prior art is not the same as active product competition. CEAL's public repository and the three visible forks checked remain at a December 2011 commit. Entry 15 classifies it as dormant public research code, not an established maintained alternative to Tower.**

Status: literature, implementation-source review, and a bounded executable correctness diagnostic. No production temporal runtime, LLVM implementation, or native/game performance benchmark has been implemented. Published results, repository observations, and experiments are distinguished below. This journal records the current assessment; it does not replace the original [temporal-opcode proposal](temporal-opcode.md). Entries 8–9 address the author's correction of the earlier framing and record the deeper validation.

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
