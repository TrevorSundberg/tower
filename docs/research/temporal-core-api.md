# Temporal core: compiler intrinsics first, user operations second

The declarations are in [temporal-core.h](https://github.com/TrevorSundberg/tower/blob/abf427ed2b3073cac31fafb3c4cb8ff590064d3f/docs/research/temporal-core.h), with compiler-only
`builtin_temporal_*` declarations first. The executable fake-machine implementation
is [temporal-core-runtime.mjs](temporal-core-runtime.mjs). The header specifies the
C-like boundary; it is not a linked native implementation or an LLVM compiler.

This revision removes the public append-write operation, mark/label lookup, and
the separate interpreter-budget status. It also replaces the earlier hidden
`Address { owner, offset }` assumption with an actual allocation/ownership model.
Earlier experiments remain available for comparison, not as competing current APIs.

The later [native LLVM proof](native-temporal/README.md) links a restricted subset
of these exact declarations and measures region-level selective repair. It does
not replace this contract: nested control, arbitrary byte accesses, native
allocation lifetimes, internal Points and general dynamic traces remain outside
that experiment. See its [storage and performance analysis](temporal-native-model.md).

## Compiler responsibilities

The compiler emits ordinary arithmetic, load/store, branch, loop, call and return
instructions into instrumented execution. Their operands, control flow and memory
accesses are tracked automatically. A user assignment is an ordinary store, **not**
an invocation of `temporal_store_at` or an amendable input API.

The five named memory/lifetime intrinsics have distinct roles:

| Intrinsic | Meaning |
| --- | --- |
| `builtin_temporal_global` | Register actual static storage and its initial bytes in the default root, before execution. |
| `builtin_temporal_alloc` | Allocate zeroed storage in the executing history; retain its allocation identity. |
| `builtin_temporal_free` | End the allocation's logical lifetime; retain information needed for historical replay. |
| `builtin_temporal_load` | Read bytes, record their producers, and produce an ordinary operand value. |
| `builtin_temporal_store` | Write bytes as an ordinary instruction, retaining value/address dependencies. |

The modeled scalar load/store widths are 1, 2, 4 and 8 bytes. Larger source-language
objects can be lowered into multiple instructions. User historical writes accept
arbitrary positive byte counts; they do not require a source-language `T`.

Compiler-generated metadata includes instruction identity and dynamic call/loop
occurrence. It is not another user argument. The executable opcode grammar and
its evaluator define ordinary non-memory instructions too; the five functions
above are not a claim that tracking loads/stores alone captures all dependencies.

### Where ownership comes from

Temporal-module static objects are registered by the loader in the default root.
Registration is completed before the first user API call, including create/point.
The host/controller is outside that module's recorded execution; its own storage
is not simultaneously assumed to be root-owned. The host can supply captured
argument or intervention bytes, but cannot silently mutate registered storage.

Inside `temporal_run(h, ...)`, ordinary allocations belong to `h`. Ordinary nested
function calls inherit it. Calling `temporal_run(child, ...)` explicitly selects
the child for that entry; allocation ownership follows that selection. Creating
a History alone neither claims the next C declaration nor allocates a private
fixed-size array. A child cannot acquire a root global simply by accessing it.

The allocation table contains real fake-machine numeric addresses, extents,
owners, liveness and byte producers. There is no public address-construction
helper supplying an owner out of band. Distinct globals may be scattered.

The bounded machine uses 64-bit integer values/handle representations and
little-endian scalar memory. Root globals occupy registered addresses below
4 GiB; heap/argument allocations receive disjoint reserved virtual slots above
that range. A slot is reserved for a dynamic allocation occurrence, so a surviving
allocation may change size within the prototype's 16 MiB per-allocation bound
without colliding with another allocation. These numeric layout choices are
simulation policy, not a proposed native address-space ABI.

Addressable automatic locals require allocation/free lifetime lowering; ordinary
register temporaries do not require a user registration operation. The fake
instruction set can express these lifetimes, but translating real C stack objects,
globals and allocation calls is still a compiler implementation task.

Historical repair restores logical allocation/free effects along with memory.
Addresses are not recycled to unrelated allocation identities in this prototype;
retired storage metadata is retained. This is a conservative correctness policy,
not a demonstrated bounded-memory allocator. Pointer arithmetic and aliases do
not change an allocation's owner. Cross-boundary accesses are checked for their
entire extent, not only their first address.

## User operations and why each remains

| Operation | Distinct responsibility |
| --- | --- |
| `temporal_create` | Start an independently controlled child/host history. |
| `temporal_destroy` | End that history and descendants. |
| `temporal_run` | Append recorded execution and explicitly select its history. |
| `temporal_point` | Capture the current historical gap, including an empty start or paused end. |
| `temporal_edit` | Start a transaction containing mutually dependent corrections. |
| `temporal_store_at` | Insert a captured byte write at that gap, including the current end. |
| `temporal_replace` | Change the same insertion without changing its identity or ordering. |
| `temporal_remove` | Retract an insertion. |
| `temporal_repair` | Attempt atomic publication of the corrected execution. |
| `temporal_cancel` | Discard the transaction without publication. |

There is no separate append convenience. Capture an end Point and use
`temporal_store_at`. There is no separate mark and later label lookup: capture
the Point itself while executing. Points therefore must survive successful repair
when their exact occurrences survive, unlike the previous prototype's
publication-expiring Points.

Replacement is not equivalent to removal plus insertion. If writes A then B
overlap at one gap, replacing A keeps it before B. Removing A and inserting a new
C puts C after B. It also creates a different identity and can invalidate a Point
anchored after A. A dedicated replacement preserves the existing event.

`temporal_run` is a history-entry boundary, not a required wrapper for every call.
The C callback takes a copied immutable argument block and returns one machine
word. That word may carry a pointer to child-owned result storage, which the
controller can observe; it is not a permanently live result subscription.
Copying arguments copies embedded pointer bits, not their pointees. The argument
block itself has call-local lifetime and is not writable persistent storage.

## Control, time and failure rules

`NULL` always selects the fixed default root. It does not switch meaning inside
a child. A child may receive its own History handle in its argument bytes when
it needs to capture a Point in itself.

A tracked history controls its immediate children. The host controls host-created
histories and the default root. A controller may enter/edit/destroy only a paused
target it controls, not itself, an executing ancestor or a sibling. A history may
read its own memory or an immediate child's current snapshot; ordinary stores
target its own live writable storage. Root globals are not implicit shared mutable
memory among children.

This applies recursively: parent execution can create, enter, amend and destroy
children, and those effects are retained parent instructions. Reconstructing a
parent reconstructs the appropriate descendant execution; it must not advance
the previously published child again on top of its future. Child success remains
reversible if the enclosing operation fails.

A Point names an exact gap, not a moving cursor. The empty start, instruction gaps,
run ends and ends after inserted writes must preserve their relative order. Later
appending does not move an earlier captured Point. If the anchoring occurrence
disappears, an insertion there causes atomic `TEMPORAL_ORPHANED_POINT` failure
unless that insertion is removed in the same edit. If the identity-producing
occurrence itself disappears from a successful publication, later reappearance
gets a new identity; it does not silently refer to a different creation.

Lifetime ending is different from creation disappearing. If the same creation
survives but an ancestor repair removes its later destruction/free, the same
historical object becomes live again. Likewise, a surviving tracked insertion
can become committed if an ancestor changes its later cancellation to repair.
Handles are checked against the current historical state, not an irreversible
"ever dead" flag. This distinction is necessary for opaque copied bytes: an
argument may have captured a valid handle before its later destruction. Replay
must not silently rewrite that payload or invalidate an originally valid earlier
use by assigning a different handle to the surviving creation.

Source bytes are captured at the API call. Tracked source pointers generate byte
read dependencies in the controller. Destination lifetime is checked where the
write is inserted: an allocation may be freed now yet have been writable there.
Conversely, being live now does not make it valid before its historical allocation.

One edit may be open per history; overlapping ancestor/descendant edits conflict.
Independent controlled histories can have separate open edits. Successful repair
publishes the candidate subtree. Failed repair preserves the old subtree and
consumes the edit; cancellation also consumes it. Invalid direct API use raises
a checked prototype error. Defined corrected-execution failures return `TRAP`;
the interpreter's execution/depth guard is included there, not a separate API case.

## Evidence boundary

The implementation deliberately performs full replay. Tests can establish results,
observed dependencies, ordering, ownership/lifetime checks and atomicity for this
modeled machine; they cannot prove all possible programs correct. Native LLVM
lowering, optimized selective scheduling, native speed, physical reclamation of
retained allocations, FFI, external I/O, concurrency, arbitrary cross-history
shared mutable memory and resuming a self-edited active continuation are not
implemented by this prototype. External effects must stay in the controller or
be explicitly modeled; they cannot be silently replayed as ordinary deterministic
instructions.

The diagnostic trace records byte accesses and ordinary operand/control links,
including call-parameter and argument-copy bridges. It is not a persistent,
version-qualified global invalidation graph across every child publication.
Semantic replay tests do not establish the correctness or cost of a future
selective scheduler built from those traces.

## Running the validation

```powershell
node docs/research/temporal-core-example.mjs
node docs/research/temporal-core-validation.mjs
node docs/research/temporal-core-adversarial.mjs
node docs/research/temporal-core-mutations.mjs
```

[The C source example](https://github.com/TrevorSundberg/tower/blob/abf427ed2b3073cac31fafb3c4cb8ff590064d3f/docs/research/temporal-core-example.c) spells the original calculations
as ordinary source. Its [runnable lowering](temporal-core-example.mjs) uses the
same user operations and explicit compiler-generated registration/opcodes.
The declaration checks compare the header to actual method names, argument
forms, order and arities; they are not a substitute for compiling/linking a
native temporal runtime.
