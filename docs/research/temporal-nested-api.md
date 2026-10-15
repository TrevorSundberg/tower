# Executable temporal API: root and recursively owned histories

**Current core:** [the untyped C-like byte API](temporal-byte-api.md) supersedes
the generic write signatures below. The nested ownership/lifetime contract is
unchanged. This typed interface is preserved as a legacy test adapter over the
same byte core, not an additional required language API.

This API is implemented in [temporal-nested-api.mjs](temporal-nested-api.mjs).
It runs deterministic fake opcodes over byte memory, including parent code
that creates, advances and repairs a child which does the same to a grandchild.
The earlier [single-history proposal](temporal-c-api.md) is retained as research
history; this document describes the newer executable interface.

Run the [complete example](temporal-nested-example.mjs):

```powershell
node docs/research/temporal-nested-example.mjs
```

Output:

```text
Initially: 2
After correcting 2 -> 1: 1
Child counter is 1, not 3. Parent and child published atomically.
```

This prototype performs **full replay**, not selective incremental repair. Its
purpose is to establish runnable control/history semantics before implementing
an optimized scheduler or native compiler. Its passing tests are bounded
evidence, not a universal correctness or performance proof.

## Complete temporal-management interface

The following is the C-like spelling of the actual JavaScript methods, not a
compiled C header. `History`, `Edit`, `Point` and `Write<T>` are opaque values.
`T` comes from the compiler-tagged destination. `null` means the runtime's
default/root history, **not** whichever child happens to be executing.
`Label` is a value naming a mark, such as `"after_sum"`. `T *destination`
represents an address with compiler/runtime-known history ownership, not a
bare numeric byte offset shared ambiguously between histories.

Mutating an existing history requires its controller and a paused target:
the host controls root/host-owned histories, and tracked code controls its
immediate children. The controller may itself be tracked. Marks execute inside
tracked code; point lookup is an observation, not an edit of that history.

```c
// Outcome of a valid repair attempt; invalid API use is a checked error.
typedef enum {
    // The corrected history and its owned descendants were published.
    TEMPORAL_OK,
    // An inserted write's exact marked occurrence no longer executes.
    TEMPORAL_ORPHANED_POINT,
    // Candidate execution encountered a defined checked runtime trap.
    TEMPORAL_TRAP,
    // Candidate execution exceeded the configured execution/depth limit.
    TEMPORAL_LIMIT
} RepairStatus;

// Create a separate history. In tracked code, it is owned by the executing
// history; at the host boundary, it is an independent host-owned history.
// Start with no execution events and the runtime-configured initial memory.
// This does not fork or copy the parent's current execution/state.
History temporal_create();

// Destroy this history and its descendants; their handles become invalid.
// Only its controller may do this. Reject active histories/open batches.
// null cannot be destroyed: the root belongs to the runtime.
void temporal_destroy(History history);

// Append an amendable input write to the history owning destination.
// Capture value now and return the identity of this particular write event.
// The destination identifies its owner, so no redundant History argument.
// Ordinary assignments are tracked without calling this function.
Write<T> temporal_write<T>(T *destination, T value);

// Begin an atomic correction of history; null selects the default/root.
// Permit one batch per target; reject overlapping ancestor/descendant batches.
// Separate independent histories may each have an open batch.
// Staging does not publish; the target cannot advance until repair/cancel.
Edit temporal_edit(History history);

// Stage a new captured value for this input or inserted write.
// Preserve its destination, type and historical event position.
void temporal_replace<T>(Edit edit, Write<T> event, T value);

// Stage removal of this input or inserted write, not arbitrary bytecode.
// Ordinary stores removed by changed control flow disappear automatically.
void temporal_remove<T>(Edit edit, Write<T> event);

// Replay the candidate and its owned descendants; publish atomically on OK.
// Any non-OK status preserves the entire previous published subtree.
// A valid call consumes edit on every returned status.
// Nested success remains subject to its enclosing parent execution succeeding.
RepairStatus temporal_repair(Edit edit);

// Abandon the batch, consuming edit and invalidating provisional writes.
// No publication; existing committed handles and Points stay unchanged.
void temporal_cancel(Edit edit);

// Mark the gap immediately after this tracked instruction.
// Each dynamic occurrence is distinct; no snapshot or dependency annotation.
// Calling this from the host instead of tracked execution is a checked error.
void temporal_mark(Label label);

// Find the zero-based executed occurrence in this history's current view.
// null selects the root. Missing occurrences produce a checked error.
// Public Points expire when their history or an ancestor republishes them.
Point temporal_point(History history, Label label, size_t occurrence);

// Stage a store at the Point's exact historical gap. Capture value now.
// Do not reevaluate the supplied expression in the past.
// Edit, Point and destination must belong to the same history.
// Same-gap insertions execute in insertion order, after existing insertions.
// Return a provisional Write: committed if repair keeps and publishes it,
// invalid if removed from the batch, cancelled, or rejected by repair.
Write<T> temporal_store_at<T>(
    Edit edit, Point point, T *destination, T value);
```

The JavaScript enum uses `RepairStatus.OK`, `.ORPHANED_POINT`, `.TRAP` and `.LIMIT`,
whose values are the corresponding strings above. Tracked code can compare
them and branch on the result. A failed child repair can therefore be handled
by its parent without publishing the child's rejected candidate.

Supported by-value storage types are `u8`, `u16`, `u32`, `u64` and a logical
64-bit `ptr`. A pointer value is an address, not a deep copy. Cross-history raw
pointer provenance is not proved: tagged pointer values from another history
are rejected, but numeric pointer values are accepted as logical address bits.
Their storage alone does not validate a later dereference. Aggregates and native
ABI lowering are not modeled.

## Entering execution is real, but not a wrapper around every call

The compiler/test-driver interface is also implemented:

```js
const runtime = createNestedRuntime(program, options);
const address = runtime.location(history, byteAddress, "u32");
const result = runtime.run(history, "function_name", argumentValues);
const value = runtime.read(address);
const diagnostic = runtime.inspect(history);
```

`location` stands in for a compiler-typed address; `run` starts or advances
ordinary execution in a selected history. `read` and `inspect` are debugger/host
observations, not reactive values. The compiler-equivalent `enter` instruction
does the same context entry from a tracked parent into its paused child.
Ordinary `call` instructions, including recursion and indirect calls, remain
within their executing history and need no temporal wrapper.

History entry is a real operation that must be represented by a future compiler
(for example, at a selected execution block). This prototype does not pretend
that removing the name `temporal_call` eliminates that boundary, nor does it
claim to implement future Tower source syntax. Crucially, temporal opcodes
invoke the **same API method implementations** as the JavaScript host calls.

## Recursive control and ownership

```text
host controls root A
               A controls child B
                          B controls child C
                                     C may create another child ...
```

There is no hardcoded two-level model. The executable tests include twelve
child levels; configured limits bound this particular interpreter.

The host may control `null` or a history it created itself. Tracked A may
control its immediate child B. It may not amend itself, an active ancestor,
an unrelated sibling, or a grandchild behind that child's parent. The host can
inspect a tracked descendant but cannot mutate it through an unrecorded escape.

A parent's child creation, input writes, execution entries, corrections and
destruction are retained parent instruction effects. When A is repaired, its
candidate B/C subtrees are reconstructed privately. Removed child advances do
not linger, surviving advances are not appended twice, and a later parent trap
cannot leak a successful speculative child repair into published state.

At publication, every child edit must be repaired or cancelled. Leaving a child
batch open does not silently commit it or leak a hidden lock. Separate
host-owned histories remain independent and can each have an open edit batch.

## Memory reads across the boundary

Ordinary loads may read their own history or observe an immediate child's
current memory. Every observed byte records its producer and owning history;
no game/entity/query semantics are involved. A child cannot freely read changing
parent/sibling memory. Pass captured input values through its controller instead.

For a parent performing these actions in order:

```text
child produces 6
parent loads child output: before = 6
parent repairs child: child now produces 10
parent loads child output: after = 10
```

`before` stays 6. That repair is a later event in the parent's execution, not a
request to rewrite its already-consumed snapshot. If an ancestor correction
instead changes an earlier parent input, replay reconstructs the appropriate
child versions and both observations at their original positions.

This is a **closed-owned hierarchy**, not arbitrary independently edited clocks
with live links between every history. Mutations that bypass the ownership rule
are explicitly rejected, not silently ignored. Shared-mutable-memory histories,
distributed histories and self-editing continuation resumption are not implemented.

## Handle lifetimes and historical arguments

Committed Write and History handles survive ancestor repair when their logical
events/creations survive continuously. If a published revision removes a child,
its old handles never become live again merely because the same source branch
later reappears. Cancelled or rejected provisional writes remain invalid.

A public Point must be fresh when supplied in a new command or execution entry.
Once accepted as an execution argument, its historical occurrence is retained
internally so replaying that already-recorded entry does not mistake it for a
new stale submission. A new attempt to pass the old public Point still fails.
An existing insertion retains its internal anchor when the public Point expires.

The same distinction applies to retained History, Location and Write arguments:
replaying an already recorded create/use/destroy sequence resolves its historical
capabilities without reviving expired public handles. Internal retained tokens
extracted from debugger observations cannot be submitted as new API arguments.

Missing insertion anchors retain the strict orphan policy: repair fails
atomically unless the insertion is removed in the same edit. No retargeting to
some other mark or resurrected occurrence is implied.

## Executable limits and evidence

The machine uses unsigned 64-bit temporary arithmetic and little-endian
1/2/4/8-byte memory operations. Program definitions, initial bytes and entry
arguments are captured. Each history starts from the configured initial image.
Memory size is fixed (at most 16 MiB per modeled history). Function/instruction
identities are restricted to safe compiler-generated names; labels remain text.

Steps are charged across all descendant replay performed by a host operation.
Depth is bounded (`maxDepth` up to 128); structural interpreter nesting also has
a separate checked limit. A child hitting the global step budget does not give
its parent a fresh budget to continue indefinitely. Physical host OOM and native
undefined behavior are not promised recoverable outcomes.

Run the implementation checks:

```powershell
node docs/research/temporal-nested-validation.mjs
node docs/research/temporal-nested-adversarial.mjs
node docs/research/temporal-nested-mutations.mjs
node docs/research/temporal-nested-surface-validation.mjs
```

The [independent oracle](temporal-nested-reference.mjs) imports no prototype
internals and rebuilds numerical memory trees from program definitions and
independently supplied root inputs. Its reference scope excludes public handle
identities and exact combined fuel accounting; directed adversarial tests check
those separately. The [primary suite](temporal-nested-validation.mjs) includes
the original read/overwrite/insertion examples, every small loop-count transition
from 0 through 6, multi-level edits and seeded correction sequences. The
[adversarial suite](temporal-nested-adversarial.mjs) checks rejected operations,
all statuses, ownership, atomicity and handle lifetime. Mutation tests deliberately
break the actual implementation in memory and require the tests to catch it.

None of this proves native speed or an optimized dependency scheduler. It does
provide a concrete API implementation that can be run, inspected and broken.

Final aggregate verification on 2026-09-06 passed: 288 independent nested replay
comparisons, 19 adversarial cases / 128 assertions, and six detected mutations
with zero survivors. The retained earlier validation suites also passed.

The subsequent C-like signature audit added eight focused surface cases with
83 assertions: exact method arities, by-value widths/pointers, owner inference,
same-gap insertion order, provisional writes and Point/Write lifetimes. No new
API operation or parameter was added by the audit.
