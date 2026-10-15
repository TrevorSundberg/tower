# Executable temporal API model: working contract

This is a bounded specification/validation artifact, not the Tower implementation
or a selected native ABI. The original temporal proposal remains unchanged.

## Machine

- Single-threaded deterministic structured bytecode, finite zero-initialized byte
  memory, unsigned 64-bit wrapping registers, little-endian widths 1/2/4/8.
- Out-of-bounds access, undefined registers, unsupported operations/targets,
  excessive depth or instruction budget exhaustion trap. No native undefined
  behavior is assumed. No allocation, FFI, I/O, threads, or independent child clocks.
- Program: `{functions: {name: {params: ['p'], body: [instruction, ...]}}}`.
  Program data is captured by value at creation and cannot be changed behind a
  retained trace through host aliases. Malformed bytecode is `BAD_PROGRAM`.
  Instruction IDs are unique throughout each function. IDs and function names
  match `[A-Za-z0-9_.:-]+` to prevent dynamic-key delimiter collisions. Operands are integer
  literals or `{reg: 'name'}`. Functions have ordinary local mutable registers;
  calls, branches, and loop occurrences receive distinct dynamic trace identities.
- Opcodes: `const(dst,value)`, `load(dst,addr,width)`,
  `store(addr,width,value)`, `add/sub/mul/and/xor/eq/lt(dst,a,b)`,
  `if(cond,then,else)`, `repeat(count,index,body)`,
  `call(dst,fn,args)`, `return(value)`, `mark(label)`.
  `fn` is a function-name string or an integer operand converted to a name.
  Missing explicit return returns zero. `return` exits the current function even
  inside a branch/loop. `repeat` samples its count once and supplies a U64 index.
  Counts exceeding `maxSteps` trap even for an empty body. The instruction budget
  counts external writes as well as all executed instructions; top-level calls
  start at depth 1. Calls require exact arity. Negative integer literals wrap to
  U64; Number literals must be safe integers. Zero-byte external writes are allowed.
  Memory size must be a nonnegative safe integer. Physical host allocation failure
  is not a promised recoverable condition; this model does not prove survival of
  host out-of-memory termination. The source/compiler inputs are ordinary data,
  not a sandbox against arbitrary proxies or global JavaScript intrinsic tampering.
- All executed calls and loads/stores are tracked automatically. A changed call
  target, branch, or loop count changes the executed trace. Removed stores are
  absent in the new execution; equal return values never hide changed effects.
- Logical instruction key: top-level invocation `id/name`, followed by `/ins.id`.
  Branch child prefix: `key?1` or `key?0`; iteration: `key#N`; callee: `key@name`.
  A mark denotes the gap immediately after that executed instruction.
- A load sees each addressed byte's last preceding store, or its initial value.
  Each byte's producer is recorded even if loaded numeric values remain equal.

## History and edits

The reference executor receives independently maintained input records:

```js
{
  initial: Uint8Array,
  events: [
    {kind: 'write', id: 'w1', addr: 0, bytes: Uint8Array},
    {kind: 'call', id: 'i2', fn: 'main', args: [1n]},
  ],
  patches: [
    {kind: 'write', id: 'w3', at: 'i2/main/mid', addr: 8, bytes: Uint8Array},
  ],
  maxSteps: 100000,
  maxDepth: 128,
}
```

Top-level events execute in order. Patches execute after their exact mark in array
order; another insertion at that gap appends after earlier patches. Every patch
must execute exactly once. A missing mark is `ORPHANED_POINT`, not permission to
retarget, silently discard the write, or activate it on some later resurrection.
The caller may remove an old patch in the same batch that removes its anchor.

## Model control API

These byte-oriented signatures are the low-level **test-engine/embedding**
interface, not the minimal recommended language surface. The public C-like
proposal is now [typed and by value](temporal-c-api.md). Its lowering experiment
is `temporal-minimal-api.mjs`: source addresses/byte counts and explicit histories
are private, while historical byte read/write semantics remain unchanged.

```text
temporal_create(program, {memorySize, initialMemory?, maxSteps?, maxDepth?}) -> Timeline
temporal_write(t, address, bytes) -> Write
temporal_call(t, functionName, arguments=[]) -> initial ordinary U64 result
temporal_edit(t) -> Edit
temporal_replace(edit, Write, bytes) -> void / error
temporal_store_at(edit, Point, address, bytes) -> provisional Write
temporal_remove(edit, Write) -> void / error
temporal_repair(edit) -> repair statistics / error
temporal_cancel(edit) -> void / error
temporal_points(t, label?) -> current Point[]
temporal_inspect(t) -> copied observation (memory, results, trace, marks, revision)
temporal_destroy(t) -> void / error
```

`Write` identifies an external input/intervention event, never just an address or
an ordinary computed store. Replacement preserves position, destination and size.
Payloads, initial memory and invocation arguments are captured by value. Pointer
arguments are integer addresses, NOT copies of their pointees. Inspection returns
copies, never writable aliases into tracked memory. Repaired invocation results
can be inspected; previously copied ordinary host results do not mutate.

Only one edit may be open per timeline; no append/call/second edit on that
timeline is allowed while it is open. Isolated timelines have separate batches.
Reads/inspection of the last published revision are allowed. Staging errors make
no change. Cancel invalidates provisional handles. Repair computes a private
candidate and publishes all or nothing. Failure leaves the published revision
untouched, consumes the edit, and invalidates its provisional handles.

Tokens are owner-checked, unforgeable model objects. Committed Write tokens stay
valid across revisions until their event is removed or timeline destroyed. Every
successful publication (including a no-op repair) invalidates old public Point
tokens; `temporal_points` reacquires marks in the current revision. Previously
committed patches retain internal anchors independently of public Point tokens.
Staged operations may use the same current Point until the batch is repaired.

Historical insertion changes subsequent loads, NOT register values already
computed before the gap. A later append is not a correction to an earlier write.
Nested scopes are ordinary connected execution, NOT independently revised child
runtimes. Repair requests execute at a quiescent control boundary; self-editing
the request's own occurrence and its resumption are deliberately unsupported.

## Independent reference observation schema

`referenceRun(program, history)` returns `{memory, sources, trace, marks, results}`.
`memory` is Uint8Array; `sources` is one producer string per byte, initially
`init:N`; `results` is Map(invocation ID -> U64 result). `marks` contains
`{key,label}`. `trace` contains `{key,op,value,reads,writes}` records in entry order:
`value` is U64 or null, `reads/writes` are arrays of `{addr,value,source}` with byte
values as Numbers. Arithmetic/const/load/return/call have result values;
if/repeat contain sampled condition/count; mark/store have null values.
Calls record before entering their body and fill in their returned value later.
Stores use the instruction key as source; external stores use `write:ID` and
also create an `external-store` trace record. All byte access metadata is refreshed.
`repeat` index assignment is an implicit control operation, not a separate record.

## Deliberate correctness/performance separation

The new model rebuilds byte memory in order and scans the dynamic trace, reusing
opcode result calculations when current operands/loaded bytes match. It performs
O(trace + memory) reconstruction/validation work, including unchanged stores and
loads. It is not a selective scheduler and does not establish rollback speedups.
The earlier `temporal-memory-validation.mjs` separately tests a genuine dirty-queue
scheduler, but only for a fixed instruction universe. Neither test alone, nor
their combination, proves the eventual optimized dynamic native implementation.
