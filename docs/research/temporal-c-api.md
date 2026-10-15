# Tower temporal API: minimal typed single-history proposal

**Newer executable API:** [root and recursively owned histories](temporal-nested-api.md)
now implements explicit `History` values and `temporal_edit(null)` for the root.
This earlier single-history proposal is retained for the research record.

**Scope correction:** this is the complete editing surface for one supplied
history, not a complete interface for creating and recursively controlling
multiple histories. The latter remains an explicit design gap; see
[Multiple histories and recursive control](#multiple-histories-and-recursive-control).

See [full worked examples from the original temporal-opcode document](temporal-c-examples.md)
for complete application code, input events, historical edits and expected results.

This replaces the earlier pointer-and-byte-count language surface. It does **not**
add a second `_value` API alongside it. The byte-oriented functions retained in
the research engine are private implementation/embedding machinery, not the
recommended Tower interface.

Temporal-enabled execution has a runtime-supplied default history. Supported
ordinary calls, loads, stores and operand computations participate automatically.
There is no user-facing `temporal_call`, history pointer, create/destroy pair or
required per-function wrapper in this default language surface.

These are compiler-aware C-like signatures, not a standard-C header. Generic
types are inferred where possible; `Edit`, `Point` and `Write<T>` are opaque
**values**, not user-visible pointers to runtime structures.

## Complete commented single-history API

`Label` is a compiler-known label value (for example, an interned string literal).
All operations use the current implicit history. `temporal_mark` executes inside
ordinary tracked code; the other operations are control commands, issued at a
quiescent boundary relative to the history being amended. This is an execution
rule, not a requirement for a permanently separate outer application.

```c
// Outcome of attempting to publish an edit. Invalid API use is a separate
// checked error, not one of these candidate-execution outcomes.
typedef enum {
    // The corrected execution was published successfully.
    TEMPORAL_OK,

    // An inserted write's marked execution occurrence disappeared.
    // Remove that insertion in the same batch to permit its disappearance.
    TEMPORAL_ORPHANED_POINT,

    // The corrected execution encountered a defined runtime trap.
    TEMPORAL_TRAP,

    // Repair exceeded a configured execution/resource limit.
    TEMPORAL_LIMIT
} RepairStatus;

// Append an amendable input write at the current end of the history.
// Capture value now, store it at destination, and return this event's identity.
// Ordinary assignments are automatically tracked; they do not use this call.
Write<T> temporal_write<T>(T *destination, T value);

// Open an atomic edit batch for this history. Only one batch may be open.
// Until repaired or cancelled, no input append or forward tracked execution
// is allowed; the previously published state may still be inspected.
Edit temporal_edit();

// Stage a replacement value for an input write or inserted write.
// Capture value now; preserve the event's destination and historical position.
void temporal_replace<T>(Edit edit, Write<T> event, T value);

// Stage removal of an input write or inserted write, not an arbitrary opcode.
// The committed event is removed only if this batch publishes successfully.
void temporal_remove<T>(Edit edit, Write<T> event);

// Repair the candidate execution and atomically publish it on TEMPORAL_OK.
// Any other returned status leaves the previous revision unchanged.
// A valid call consumes edit on every returned status; retry with a new batch.
RepairStatus temporal_repair(Edit edit);

// Discard the batch without changing the published history. Consume edit
// and invalidate any provisional Write handles created by this batch.
void temporal_cancel(Edit edit);

// Mark a gap immediately after this instruction in ordinary tracked execution.
// Each executed occurrence is distinct, including loop/call occurrences.
// This is an insertion anchor, not a snapshot or dependency annotation.
void temporal_mark(Label label);

// Find the zero-based occurrence of label in the current published execution.
// A missing occurrence is a checked error. The returned Point expires on the
// next successful publication, including a forward append or no-op repair.
Point temporal_point(Label label, size_t occurrence);

// Stage a write immediately after the marked execution occurrence.
// Capture value now; do not reevaluate its expression in the past.
// Inserts at one point execute in staging order, after existing inserts.
// Return a provisional Write: committed on successful repair, invalid on
// failure/cancellation (or if removed from this same batch).
Write<T> temporal_store_at<T>(
    Edit edit, Point point, T *destination, T value);
```

`Edit`, `Point` and `Write<T>` are compiler-provided opaque value types. `T` is
inferred from the destination or event. Values may be literals, temporaries or
function results; a pointer-valued `T` captures the address, not its pointee.
Only the destination needs pointer spelling because it identifies memory.

Committed Write handles survive successful revisions until their event is
removed or the history is destroyed. Failed repair/cancellation preserves
existing committed handles and Points. A successful publication expires public
Points, but committed insertions retain their own internal anchors. An insertion
whose anchor disappears is rejected under this proposal's strict orphan policy;
ordinary computed stores in vanished branches retract automatically.

`RepairStatus` distinguishes success, an orphaned historical insertion point,
an execution trap and resource-limit failure. Invalid API use raises a checked
error before that operation takes effect. Physical host out-of-memory termination
is not promised to be recoverable. A native C embedding may choose error-code
plumbing, but that is not another language feature.

## Why the remaining pointer is there

`destination` identifies **which memory location** to write, so the C-like
spelling is `&x` or an existing pointer. It is not an input buffer to be retained:

```c
Write<int> input = temporal_write(&x, 7);
```

There is no semantic reason to pass `7` through a source address or an
address-taken temporary. A compiler builtin could instead accept an assignable
lvalue, but this proposal keeps only the familiar C address spelling above,
rather than exposing both forms.

Opaque handle arguments do not need explicit pointers. Nor does the language
need a byte size when the compiler already knows `T`.

Passing a large value indirectly may be a useful **lowering/ABI choice**, not a
reason to add another public operation. The compiler/runtime must still honor
capture semantics; retaining a mutable external source pointer is not equivalent
to capturing its value. No native performance comparison is claimed here.

If `T` itself is a pointer type, the value being recorded is legitimately an
address. That copies the pointer value, not its pointee:

```c
Write<int *> selected = temporal_write(&current_pointer, &item);
```

Later tracked dereferences read the selected memory at their historical
positions. This is different from making every source argument a pointer.

## Ordinary temporaries remain ordinary tracked values

```c
int a = *p;
int b = a + 7;
int c = helper(b);
*q = c;
```

The dependencies include the load, the arithmetic result, the ordinary callee
and the final store. `b` and `c` need not have source-visible memory addresses.
A constant has a defined value without depending on a mutable memory cell.
The typed control API does not replace the instruction/operand graph with
memory-only tracking.

Ordinary `*q = c` is automatically tracked. Do **not** replace ordinary stores
throughout a program with `temporal_write`: that builtin identifies external
input events which can subsequently be amended.

## Input-correction example

```c
// Runtime control phase: record an external value in the active history.
Write<uint32_t> input = temporal_write(&state.input, 4);

// Ordinary retained execution. No temporal_call wrapper:
state.output = twice(state.input);          // 8

// A later runtime control phase:
Edit edit = temporal_edit();
temporal_replace(edit, input, 7);
RepairStatus status = temporal_repair(edit);
// On success: state.input == 7; state.output == 14.
```

The runtime owns activation, initial memory capture and lifetime management.
The research harness explicitly binds a finite byte region and program to model
those responsibilities. That binding is not an extra public language API.

The phase comments are semantic, not an instruction to replay control requests
as ordinary application stores. These operations run at a quiescent control
boundary for the history they amend. Merely enabling default tracking does not
solve resumption if a correction removes its own requesting occurrence.
Independent child histories still require their own composition contract;
none of this mandates a permanently untracked application layer.

## Historical insertion, when that capability is needed

`Label` is a compiler-known label value, such as a string literal interned by
the compiler, not a mutable C-string pointer the runtime must retain.
`temporal_mark("after_sum")` marks a gap in tracked execution.
`temporal_point("after_sum", 0)` obtains its first currently executed occurrence.
Labels name edit locations, **not dependencies**.

```c
Point point = temporal_point("after_sum", 0);
Edit edit = temporal_edit();
Write<uint32_t> patch = temporal_store_at(edit, point, &m[3], 2);
RepairStatus status = temporal_repair(edit);
```

The inserted store contains the supplied value. This matters for expressions:

```c
temporal_store_at(edit, point, &x, x + 1);
```

It evaluates `x + 1` **now**, once, and stages that result. It does not insert a
historical `x += 1` instruction. Similarly, replacing an input with a function
result captures the current result; it does not make that input a live reference
to the function's future results. Computed dependencies inside tracked execution
remain automatically maintained.

## Why the remaining operations are not interchangeable

A Write identifies an event; a Point identifies an execution gap. A later store
at a gap is not equivalent to replacing an earlier write: prior loads may differ.
Replacement, insertion and removal therefore remain separate effects.

Atomic batching is not just ceremony. For example, changing a pointer from A to
B while enabling a guard may be valid jointly, but invalid if the pointer change
is repaired alone. Removing an old intervention and the branch containing its
anchor must likewise be one batch under the strict orphan policy. Batching also
lets equal final values stop propagation without publishing transient revisions.

Public Points are current-revision tokens and must be reacquired after successful
publication. Committed Write handles persist until removed. If an intervention's
mark disappears, repair fails atomically; remove the intervention in the same
batch to accept that control-flow change. No silent retargeting occurs.

Every load resolves each byte against its latest preceding covering store.
Typed access does not partition memory: overlapping widths, aliases, removed
stores and equal-valued pointer retargets retain the same raw-memory semantics.
Ordinary host copies of previous results do not rewrite themselves.

## Verification boundary

[Typed lowering tests](temporal-minimal-validation.mjs) exercise the single typed
surface against the independent byte-memory replay oracle. The model currently
covers unsigned 8/16/32/64-bit values and logical pointer values, not all C types,
aggregates, padding rules or native ABI choices.

The enum above specifies the proposed language-facing result representation.
The current executable research adapter still returns diagnostic statistics on
success and throws coded errors on failure; tests validate those underlying
outcomes and atomicity, not a compiled implementation of this enum-returning
signature. This consolidation changes documentation, not the execution engine.

[The validation contract](temporal-model-contract.md) and
[proof review](temporal-api-proof-review.md) state the underlying machine and
conditional correctness argument. The [journal](../temporal-opcode-research-journal.md)
records passing tests and actual defects found. This verifies bounded behaviors
and the new typed-to-byte mapping, not a native compiler, a mechanized proof,
or a proof that this is the globally smallest possible language.

## Multiple histories and recursive control

The one-open-edit rule is **per history**, not process-wide and not a nesting
depth limit. The research kernel can create isolated instances and keep one
edit open in each. The nine-operation source surface above does not expose
instance creation, lifetime or selection; its implicit default does not create
a new history for every ordinary function or block.

Nested ordinary execution in one history and a tracked parent controlling a
separately editable child are different capabilities. Supporting the latter
requires a history value, creation/lifetime rules and a way to select execution
contexts and correction targets. A controller executing in A must be able to
target a paused B without becoming part of B's execution merely by selecting
B. No final additional signatures are selected by this clarification.

Recursive containment must also give child interactions reversible historical
meaning in their parent. For example, suppose a retained parent loop advances
a child's `acc = acc + 1` twice from zero, producing 2. Correcting the parent
loop count to one must produce 1. Simply replaying one advance against the
child's existing present state produces 3. Separate memory does not prevent
this error: disappearing advances must be revoked and retained/revised advances
must not be duplicated. Parent observations must read the correct child version.

Creation, advances, amendments and observations of a child therefore need to
participate in the parent's history, with child lifetime and retained versions
subject to ancestor repair. This bookkeeping can be compiler/runtime-provided
over instruction occurrences, memory and version identities; it does not require
application-specific dependency declarations or a wrapper on every ordinary call.
Parent failure must not leak speculative child changes into published state.

That is the additional contract required for the author's recursive-control
vision. It is not established by adding a constructor and a context switch, and
the current bounded interpreter does not validate it. Editing an active ancestor
or deleting the correction request's own occurrence still needs a separate
control/resumption rule.
