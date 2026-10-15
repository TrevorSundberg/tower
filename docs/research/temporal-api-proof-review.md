# Temporal API: independent correctness review and proof obligations

Date: 2026-09-05.

This review concerns the opcode/raw-memory proposal in `../temporal-opcode.md` and journal Entries 17–21. It does not substitute object-, query-, ECS-, or application-level dependencies for memory accesses. Tower remains a general-purpose language. The proposed validation model is a deliberately smaller deterministic machine, not an LLVM implementation.

## What can honestly be established

Three different claims must remain separate:

1. **A mathematical argument for a specified algorithm.** Below is an induction argument for forward historical reconstruction with value-validated opcode-result reuse. It is conditional on the listed premises and is not a machine-checked proof.
2. **Executable evidence about an implementation.** Differential tests against a separate full-replay interpreter can find violations, including violations of this argument's premises. Passing a finite suite does not prove every program, memory layout, or edit sequence correct. The actual executable and its reported test results are documented separately; this review does not invent a test count.
3. **A production-language guarantee.** That additionally requires verified or thoroughly validated lowering, runtime implementation, operation coverage, memory-lifetime rules, and external-effect semantics. Neither the argument nor a JavaScript interpreter establishes native performance.

The initial target is a solid, explicit contract for historical byte writes and automatic tracking through ordinary nested code. The corresponding executable contract is `temporal-model-contract.md`; its explicit decisions are incorporated below. Independently revisioned child engines, self-editing execution, dynamic allocation, and concurrent memory require further contracts.

## Bounded machine and reference meaning

Let:

- `P` be immutable program code in the supported structured opcode language;
- `M0` be a finite array of initialized bytes with fixed address identity and lifetime;
- `E` be an ordered sequence of external write events and scheduled root invocations;
- `J` be persistent constant-byte interventions attached to marked dynamic occurrences;
- `K` be the currently committed cache/trace, which is an optimization artifact;
- `F` be completion of the same finite scheduled root-invocation sequence, not an old source instruction that might disappear.

The reference evaluator begins from `M0`, applies `E` in order, executes every program opcode normally, and applies each intervention in `J` when its anchor is encountered. A repaired result must match this evaluator on the revised `E` and `J`:

```text
Repair(P, M0, E, J, K) = Replay(P, M0, E, J)
```

The equality covers all final logical bytes, revised root results, and the semantic trace/marker observations exposed by the API. It does not require identical optimization counters, physical cache allocations, or opaque token bit patterns. At minimum, every public token must refer to the corresponding semantic event/occurrence and have the correct validity status.

This is a single-threaded, terminating-execution claim. Arithmetic widths, overflow, byte order, bounds checks, and trap behavior must be defined. Raw memory does not mean undefined behavior: a small model can use fixed live storage, integer addresses, explicit access widths, and deterministic traps without first implementing a borrow checker or ECS.

### Memory reads are historical byte reads

For a load of byte address `a` at execution position `q`:

```text
value(q, a) = the byte from the latest covering store before q,
              or M0[a] if no such store exists.
```

A multi-byte load applies this rule independently to each byte, then decodes according to the specified byte order. A store of width four and a store of width two can overlap without sharing a base address; comparing only pointer equality is insufficient. Access width, range, and address-producing operands are part of the operation's meaning.

Forward reconstruction implements this rule simply: start with `M0` and perform every revised preceding store on scratch logical memory before examining a load. The physical committed present-day heap is not an acceptable historical lookup source.

## Induction argument for a conservative repair algorithm

The algorithm walks the newly determined execution in forward order, reconstructing memory. For scalar opcodes, it may reuse an old result only after checking a sufficient validity predicate against the current opcode and current inputs. It does not skip a call or block merely because its last returned scalar is unchanged.

The induction invariant immediately before each revised execution step is:

1. Scratch logical memory equals the reference evaluator's memory at that step.
2. Every live operand/activation value used by the next instruction equals its reference value.
3. The next instruction and structured control context equal those of the reference evaluation.
4. The rebuilt trace describes the revised prefix, including current read ranges, write effects, and dependency provenance. Obsolete suffix records have not been treated as current effects.

**Base case.** Both executions begin with the same initialized `M0`, revised external event schedule, captured invocation arguments, and empty activation/control context. External write payloads are copied facts, not references to mutable controller buffers.

**External write or intervention.** Both apply the same captured bytes to the same valid range at the same position. The invariant is preserved. The event's identity and ordering are separate from its destination address and payload equality.

**Pure opcode.** The opcode descriptor and its current operand values agree. If no cache entry is valid, execute the same defined deterministic operation. If a cached result is reused, its validity predicate establishes that the same deterministic operation was evaluated on equivalent relevant inputs. Its result therefore agrees with the reference. The predicate must include operation identity, width/type and other semantic parameters; scalar result equality from an unrelated instruction is not such a predicate.

**Load.** Its current address, width and historical bytes agree by the induction invariant. Decode normally, or reuse a cached decoded value only when the validity predicate establishes the same decoded result. Record the current read range and current producer relationships even when the scalar value equals the previous revision's value. Newly reached loads work by the same rule; they do not require having existed in the old trace.

**Store.** Its current destination, width and encoded bytes agree. Apply its logical effect to scratch memory, including when its operands are cache-equal. Skipping the opcode's arithmetic or byte encoding is distinct from omitting the store's effect. A physical same-byte write may be suppressed only if the logical ordering/provenance semantics remain correct.

**Branch.** Its current predicate agrees, so both evaluations choose the same branch. Recurse through that branch only. Do not retain effects from a no-longer-executed branch. Equal final branch return values are not enough to reuse arbitrary internal stores or read dependencies.

**Counted loop.** Its current iteration count and iteration operands agree. Structural induction through the finite revised iterations establishes agreement. Removed iterations contribute no stores to the reconstructed memory. Added iterations execute normally; an iteration ordinal is not a promise about the identity of a user's object.

**Ordinary call/nested scope.** Function identity, arguments and entering memory agree. Apply the same argument to the supported callee's steps, then connect its returned values and memory effects to the caller. Scope nesting does not erase memory aliasing or value dependencies. Recursive execution is covered for terminating calls within the model's resource limits; unbounded termination is not proved.

**Return/boundary.** Equal returned values enter equal caller continuations. At completion of `F`, all logical bytes and revised results agree. The candidate trace replaces the old trace only after full validation, including required intervention anchors.

This proves the algorithmic implication under these premises. It does not mechanically establish that a particular implementation satisfies each premise. A full forward walk also remains `O(revised trace length)` in validation work: reusing arithmetic results during that walk is not a proof of dependency-proportional repair time.

## API decisions that must be explicit

### Persistent write events are not addresses

Two external writes to the same byte range are distinct events. `temporal_replace` changes one event's payload while preserving its location in execution and its destination range. Initially require equal payload size. Handle validation must include owning history and event liveness; cancelled provisional IDs and destroyed-history IDs must never silently alias later events.

A `temporal_store_at` intervention is a captured constant-byte store, not an implicit historical `*p += value` computation. Its source buffer is copied when staging. Its numeric destination must designate valid storage at the historical target. This model's fixed-lifetime arena avoids, rather than solves, allocation-generation ambiguity.

### Point tokens and persistent anchors have different lifetimes

A public `Point` denotes a particular marked occurrence in a particular committed revision. The model invalidates all public Points after every successful publication, including forward append/call and a no-op repair. Already committed interventions still need their internal anchor identity retained; invalidating the public token must not erase the intervention.

This policy requires a way to obtain a fresh public Point for a surviving occurrence in the current trace. The model supplies `temporal_points(t, label?)`. The old host copy of a returned Point cannot refresh itself. Without the refresh path, a caller could not perform a second new insertion at that surviving marker after the first repair. This was a gap in the earlier rough API, now closed by the model contract.

Occurrence identity must include the dynamic control/call context, not just the source marker name. For a small immutable structured program, a root-invocation ID plus a branch/call path and loop ordinals is one definable matching rule. It must be documented as structural occurrence identity, not semantic object identity. Merely matching the next execution of the same source line is unsound.

### Missing intervention anchors need one policy

The model's strict policy is: if an earlier correction makes a required anchor unreachable, the entire repair fails with `ORPHANED_POINT` and the previous revision remains committed. Validate **all persistent interventions**, not only newly staged insertions. Do not silently drop or move the existing write.

An alternative dormant/conditional-intervention policy is conceivable, but it is a different API and needs different tests. The strict policy has an ergonomic consequence: users cannot accept a correction that removes an anchored branch until they also remove the intervention. The model therefore adds `temporal_remove(edit, Write)`, allowing removal in the same batch. This is an actual addition to the earlier rough API rather than something its original signatures already promised.

### Same-gap ordering must survive later edits

The model chooses an explicit total order for interventions at one marker: append later committed insertions after existing interventions and preserve staging order within a batch. Thus two writes of `1` then `2` to the same byte at the same gap leave `2`, and replacing the first payload does not move it after the second. Rejecting overlapping insertions would be another possible, more restrictive contract, not an implicit implementation detail.

### Failed edits must not publish partial state

For atomic failure, validation/reconstruction must happen against candidate state. A missing anchor, invalid range, invalid handle, unsupported operation, trap, or resource-limit failure leaves the previously committed memory, event payloads, trace, root results, revision and usable committed handles unchanged. Provisional handles from a consumed failed batch must be invalidated. Internal monotonically allocated token numbers may be skipped if they are opaque and never reused incorrectly.

The model specifies that a failed repair consumes the edit and invalidates provisional handles, while a staging error makes no staged change. Do not assume `cancel()` can restore in-place partially published repair unless actual rollback exists. A forward append/call must follow the same private-candidate/publication discipline on failure.

### Returned host values do not rewrite themselves

Within tracked code, normal call return values feed tracked operand dependencies automatically. A scalar copied into an untracked controller is an ordinary historical observation and remains unchanged. To obtain the repaired result, reread a result handle or tracked output bytes at the next committed boundary.

The same distinction applies to host-computed future inputs. Once submitted as copied external bytes, those inputs are facts in the event schedule. A change to an earlier tracked producer does not automatically repair the untracked controller calculation that produced them.

## Minimal adversarial byte-memory examples

These are review cases with expected semantics, not a claim that this document executed tests. All addresses are raw byte addresses. Multi-byte examples are explicitly little-endian.

| Case | Program/edit | Required result |
| --- | --- | --- |
| Latest historical writer | Initial write `x=4`; `a=load8(x)`; `store8(x,9)`; `b=load8(x)`. Replace initial event with `x=6`. | `a=6`, `b=9`, final `x=9`; not two reads of the physical present's `9`. |
| Store after a load | `a=load8(x)`; mark; use `a`. Insert `store8(x,123)` at mark. | The later memory byte changes; `a` remains its earlier loaded value. |
| Overwrite masks earlier edit | Initial write `x=4`; program `store8(x,9)` then load `x`. Replace initial write by `6`. | Loaded value remains `9`; no downstream result change is required. |
| Partial alias | Store32 at address `0` of `0x11223344`; intervene with store16 at address `1` of `0xabcd`; load32 at `0`. | Bytes `44 cd ab 11`, result `0x11abcd44`. A prior load32 remains `0x11223344`. |
| Same address, two external events | Write event `W1: x=3`; load `a`; write event `W2: x=9`; load `b`. Replace `W1` by `5`. | `a=5`, `b=9`; replacing W1 must not accidentally replace W2. |
| Pointer changes with equal loaded values | Pointer initially names byte A; A and B both contain `7`. Revise pointer to B, then in a second revision change historical B to `9`. | First result remains `7`, second becomes `9`; dependencies must follow B after the first edit. |
| Producer changes without byte change | Initial `x=7`; conditional store `x=7`; load `x`. Remove the conditional store, then revise initial x to `9`. | First result remains `7`, second becomes `9`; equal values cannot retain obsolete writer provenance. |
| Branch removes a store | Initial `flag=1,x=0`; if flag, store `x=8`; load x. Change flag to zero. | Final `x=0`, not residue `8` from the removed trace. |
| Loop removes stores | Zero bytes at `64..66`; count3 loop stores `i+1` to `64+i`. Change count to1. | Bytes become `1,0,0`, not `1,2,3`. |
| Call with constant return and changing effects | Child reads input, stores it at output, returns zero. Caller ignores return. Revise input. | Output store changes despite unchanged return value. |
| Negative/empty read | Load an occupancy byte currently zero, branch on it. Revise the covering historical write to nonzero. | That load and branch respond. Empty bytes are still read dependencies; no semantic object knowledge is required. |
| Persistent anchor disappears | Commit intervention inside true branch; later change branch condition to false. | Under strict policy, whole repair fails atomically, preserving the old committed revision. |
| Two writes at one marker | Insert x=1 then x=2; later replace first event payload by3. | Final x remains2 if insertion order is preserved. |
| Cancelled provisional handle | Stage a new write, cancel, later try replacing that handle. | Defined rejection; never replacement of an unrelated future event. |
| Copied host result | Host stores initial return value5; repair changes current invocation result to9. | Host copy stays5; explicit current result read returns9. |

Useful mutation tests deliberately break one invariant at a time: drop load dependencies; compare only equal base addresses; fail to reconstruct removed writes; preserve old pointer-read provenance after an equal result; skip a call on equal return; retarget a missing marker; or mutate committed memory before anchor validation. The test suite should reject each broken variant, not merely exercise a correct-looking implementation.

## Recursive containment and the limit of this argument

Nested ordinary calls/scopes are covered because they are structured portions of one coherent memory execution. A child can read or write an ancestor's bytes if the machine permits it; those are still tracked accesses, not a hidden escape. If optional region ownership prohibits an access, that restriction must check reads as well as writes where appropriate, with a defined trap.

The proof does not require a permanently untracked application layer. A test harness acts as the controller of the history it tests, but that is a validation configuration, not a fixed two-level design for Tower.

A separately revisioned child engine adds operations not in this machine: create child, advance it, amend its history, observe a revision, revoke prior interactions, and reclaim child history. Parent repair must reconcile those child effects and preserve cross-history causal identity. Heap containment alone does not establish those rules. A child commit may also remain provisional relative to an editable parent.

An edit request occurring inside the very history it removes has an additional continuation problem. A normal repair call returning to its untracked test harness does not solve where such an amended tracked caller resumes. Both independent child-history composition and self-edit resumption remain explicitly outside this initial proof target.

## Production proof obligations remaining

- A sound, efficient worklist/trace-repair algorithm that discovers new dependencies and repairs only relevant regions; the conservative forward scan does not supply the desired complexity guarantee.
- Correct dynamic occurrence matching under richer loops, indirect control flow, exceptions, code changes and trace retirement.
- Historical allocation identity, allocator state, deallocation, address reuse, overlapping native accesses, stack lifetime and retained pointers.
- Defined language semantics for integer corners, floating point, poison/undef, atomics, volatile access, traps, exceptions and resource failures.
- Complete instrumentation across ordinary, recursive and indirect calls; rejected or modeled FFI/assembly/device access rather than silent untracked execution.
- A correct lowering from the specified machine to LLVM/native code, including optimization movement across externally editable markers and alias handling.
- Concurrency and its memory model, if supported; deterministic sequential replay does not prove native thread schedules equivalent.
- Historical external inputs, output publication/compensation, nested independent revisions and safe history reclamation.
- An implementation-level proof or much broader validation campaign, including independent test oracles and adversarial sequences. Shared interpreter helpers can create shared bugs, so oracle independence must be examined rather than assumed from two function names.
- Native measurements of forward overhead, repair overhead, retained-memory cost, locality, and adversarial whole-history dependency cascades.

**Bottom line:** the small API can have exact raw-memory semantics and a clear conditional correctness argument. The most useful immediate milestone is a byte-addressed executable contract whose edited runs agree with independent fresh replay, with explicit failure and handle-lifetime behavior. That milestone is evidence toward Tower, not a blanket proof of an unimplemented general-purpose native temporal language.
