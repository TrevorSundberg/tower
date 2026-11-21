# Temporal byte core: implemented C-like interface

> Retained earlier experiment. The current interface is
> [temporal-core.h](https://github.com/TrevorSundberg/tower/blob/abf427ed2b3073cac31fafb3c4cb8ff590064d3f/docs/research/temporal-core.h), with [its contract](temporal-core-api.md).
> It separates compiler intrinsics, removes the public append convenience and
> mark/label lookup, and implements explicit allocation ownership rather than
> relying on owner-carrying fake addresses. Historical text below is preserved.

The temporal memory core does **not** require a source-language `T`. A write
retains its identity, owning history, destination, byte extent and captured
bytes. Types still determine ordinary opcode semantics, but are not required
to represent or repair a historical write.

This interface is implemented by `createByteRuntime` in
[temporal-nested-api.mjs](temporal-nested-api.mjs). The previous generic interface
is retained only as the legacy test adapter `createNestedRuntime`, delegating to
the same byte core. The new API has no typed/value overload family. Earlier
research and tests are preserved; the byte interface is now the recommended core.

## Complete declarations

These declarations assume runtime-defined opaque value handles `History`,
`Edit`, `Write` and `Point`, and a mark identifier `Label`. There is no `Write<T>`.
`null` denotes the default root History, not the currently executing child.
The native handle ABI and Tower syntax remain unspecified; this is a C-like
spelling of the real JavaScript methods, not a compiled header.

```c
// Outcome of a valid repair attempt; invalid API use is a checked error.
typedef enum {
    // The correction succeeded, subject to enclosing parent repair succeeding.
    TEMPORAL_OK,
    // An inserted write's exact marked occurrence disappeared.
    TEMPORAL_ORPHANED_POINT,
    // Corrected execution encountered a defined runtime trap.
    TEMPORAL_TRAP,
    // Corrected execution exceeded a configured execution/depth limit.
    TEMPORAL_LIMIT
} RepairStatus;

// Create a history from the runtime-configured initial memory, with no events.
// Tracked code owns the child it creates; the host owns histories it creates.
// This does not fork the parent's current state.
History temporal_create();

// Destroy this history and descendants, invalidating their public handles.
// Require its controller and no active execution/conflicting edit.
// The default root cannot be destroyed through this function.
void temporal_destroy(History history);

// Append a write of byte_count bytes at destination; byte_count must be > 0.
// Snapshot source now, before changing/replaying the destination history.
// Return this write event's identity. The destination identifies its history.
Write temporal_write(
    void *destination, const void *source, size_t byte_count);

// Begin an atomic correction batch; null selects the default root.
// Require its controller and a paused target. Reject self/ancestor edits.
// One batch per target; no overlapping ancestor/descendant batches.
Edit temporal_edit(History history);

// Stage replacement bytes for this input or inserted write.
// Read exactly the byte count recorded by the original Write.
// Preserve its destination, extent and historical position; capture source now.
void temporal_replace(Edit edit, Write event, const void *source);

// Stage removal of this input or inserted write, not arbitrary bytecode.
void temporal_remove(Edit edit, Write event);

// Repair the candidate and its descendants atomically; consume a valid edit.
// Non-OK preserves the old published subtree. Nested OK remains reversible
// if the enclosing parent execution subsequently fails.
RepairStatus temporal_repair(Edit edit);

// Consume and discard the batch; invalidate its provisional writes.
// Preserve previously committed state and handles.
void temporal_cancel(Edit edit);

// Mark the gap after this tracked instruction; not a snapshot/dependency annotation.
// Each executed occurrence is distinct, including loops and calls.
void temporal_mark(Label label);

// Find the zero-based executed occurrence in this history's current view.
// A missing occurrence is a checked error. Public Points expire when their
// history or an ancestor republishes; existing insertions keep internal anchors.
Point temporal_point(History history, Label label, size_t occurrence);

// Stage a write of byte_count > 0 bytes at this exact historical gap.
// Snapshot source NOW, not at the old Point. Overlapping ranges are allowed.
// Edit, Point and destination must belong to the same history.
// Return a provisional Write; commit only if repair keeps and publishes it.
Write temporal_store_at(
    Edit edit, Point point,
    void *destination, const void *source, size_t byte_count);
```

Only the three byte-writing operations change their argument forms. Removal now
uses the unparameterized Write handle. The remaining history/edit/mark rules are
unchanged from the [nested ownership contract](temporal-nested-api.md).

## Why replacement has no size argument

An event's byte extent is fixed. `temporal_replace` changes only its captured
contents, so its existing Write already tells the runtime how many bytes to
copy. The caller must supply at least that many readable source bytes. An extra
count could provide a caller-supplied consistency check, but is not necessary
to express replacement and is not included in this minimal interface.

This does not promise native C buffer safety. The JavaScript model can check
actual byte-view lengths and fake-memory bounds; an arbitrary native C pointer
does not inherently carry an allocation length. No source-size query operation
or parallel checked/unchecked overload was added.

## Capture and dependency rules

Source bytes are copied immediately. The source may be changed or released after
the call returns; its pointer is not retained as a live input. The source may
overlap destination in either direction because the full snapshot is obtained
before destination execution is changed. This also applies to replacement and
historical insertion.

When tracked parent code supplies a fake-memory source address, the copying
instruction records every source-byte read and its current producer. Replaying
the parent can therefore recapture changed source contents. Reading a source
buffer does not bypass memory dependencies. An untracked host buffer is instead
captured external input. A host can intentionally copy a current observation
between independent histories; that copy is not a live historical link.

Positive byte counts may be arbitrary, not only 1/2/4/8. The prototype rejects
zero, negative, fractional, unsafe or out-of-range extents rather than inventing
zero-byte event semantics. Destination ownership and nested-controller rules
remain checked independently of the bytes being written.

The core cannot recognize pointer fields, destructors, padding or serialization
rules inside opaque bytes. Copying a pointer copies its representation, not its
pointee. The legacy typed adapter's tagged-pointer check is not a raw-byte-core
guarantee. Defined opcode behavior, object lifetime and portable representation
remain separate compiler/program obligations.

## Actual prototype use

```js
const runtime = createByteRuntime(program, options);
const address = runtime.address(null, 8);
const input = runtime.api.temporal_write(address, new Uint8Array([9, 0, 0, 0]), 4);

runtime.run(null, "main");

const edit = runtime.api.temporal_edit(null);
runtime.api.temporal_replace(edit, input, new Uint8Array([6, 0, 0, 0]));
const status = runtime.api.temporal_repair(edit);
```

`address`, `run`, `read(address, count)` and `inspect` are compiler/debugger
bindings, not additional temporal management methods. The lowered `address`
opcode creates an untyped owned address, and the existing `enter` opcode selects
a child execution context. Ordinary calls, loads and stores remain ordinary
automatically executed/tracked instructions. Fake opcodes invoke the same
byte API methods as the host. The interpreter still uses full replay, not an
optimized incremental scheduler or native code.

Run the [complete original-calculation example](temporal-byte-example.mjs):

```powershell
node docs/research/temporal-byte-example.mjs
```

## Validation

[Byte validation](temporal-byte-validation.mjs) compares arbitrary-width writes,
replacements and patches against the independently implemented byte replay
oracle. Nested cases compare raw source-copy programs to equivalent explicit
load/by-value programs executed by the independent nested oracle. Source-read
producer records are checked directly, including within a three-level hierarchy.

[Byte adversarial tests](temporal-byte-adversarial.mjs) cover invalid extents,
too-short sources, Buffer/subarray aliases, hostile/detached byte views,
overlapping copies, fixed replacement width, stale/foreign addresses, source
ownership and atomic rejection. Tests assert that raw events have no type field.
All earlier tests remain active through the legacy adapter over the shared core.
