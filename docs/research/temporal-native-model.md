# Native temporal state storage and repair

The native experiment establishes that selective repair works with compiled LLVM
code and the agreed C API subset. It also establishes a cost: maintaining a fine
dependency history can cost much more than simply copying game state. Sparse,
expensive computations benefit most; cheap, widely connected updates often favor
snapshot replay. Disk-backed history works, but paging alone does not solve
unbounded history growth.

This is measured evidence for one implementation, **not a proven minimum runtime
overhead** or a complete native implementation of the ten-operation contract.
The [native proof and reproduction instructions](native-temporal/README.md)
define its supported subset. The [existing core API](temporal-core-api.md) remains
the semantic target, including byte producers, exact Points and nested atomicity.

## Storage model

Keep current application state in ordinary contiguous memory. Keep temporal
metadata in separate arrays so untracked reads do not fetch history fields.
Structure-of-arrays layout is suitable for game component scans; alignment belongs
at array/slab boundaries, not automatically on every small object.

The implemented native arena is 64-byte aligned and allocated once for a bounded
experiment. Arrays use 32-bit indices instead of individually allocated pointer
nodes. Recording and repair pre-reserve their buffers; no allocator runs per
load, store, scheduled region or published version.

| Record | Actual size | Purpose |
| --- | ---: | --- |
| Current cell | 8 bytes | Ordinary live value |
| Shadow entry | 4 bytes/cell | Most recent producer version |
| Version | 32 bytes | Published value, candidate value, consumer-list head, cell index, candidate generation, reserved word |
| Read | 8 bytes | Cell and exact version read |
| Consumer edge | 8 bytes | Region index and next edge index |
| Region | 32 bytes | Read/write spans, three captured arguments, counts and queued generation |
| Input lookup | 4 bytes/update | Benchmark input event identity |
| Undo-only record | 16 bytes | Cell index, padding and previous 64-bit value |

Version IDs identify **writes**, not just addresses or changing values. A load
subscribes to the version it actually observed. A subsequent independent overwrite
therefore cuts dependency on the previous version. Equal writes still receive
different IDs; equality is only used to stop value propagation during repair.

The native repair algorithm stages new values under a generation number, queues
consumers in chronological region order, runs only those native regions, and
propagates only changed outputs. All original reads and writes must keep the same
addresses/order/counts in this experiment. On success, publication visits only
the staged versions and updates current cells whose final producer changed. On
failure, staged values are ignored; no full-history copy is needed for atomicity.

For this fixed graph, the correctness argument is induction over chronological
regions: every input is either an unchanged original producer or the already
recomputed value of an earlier producer. Equal inputs imply equal deterministic
outputs. Changed outputs enqueue their consumers, and no other region needs
execution. The tests check this against an independent fresh numerical execution,
including every historical value. The argument does not cover changing memory
access topology, lifetime changes, general native continuations or parallel races.

Runtime work is approximately `O(changed edges + rerun regions * log(queue size)
+ changed versions)`, plus native computation. Batching `K` replacements currently
has `O(K²)` deduplication in a small vector; the dense-input measurement includes
this cost. A production batch needs indexed deduplication. No full-history scan
occurs on a sparse replacement. Chronological ordering assumes the original
forward dependency graph and cannot replace dynamic trace reconstruction.

## What inexpensive reads mean

There are two distinct implementation choices:

1. **Undo/snapshot tracking:** normal reads are exactly normal native reads.
   Instrument writes or take checkpoints. Reconciliation restores a checkpoint
   and reruns the affected suffix. This provides the cheapest read path here.
2. **Selective repair:** a first dependency observation must be recorded somewhere.
   In this prototype, a load also looks up its shadow producer, appends a Read and
   Edge, and changes the producer's consumer-list head. That makes a logical read
   perform metadata writes. It is not a zero-overhead load.

The second choice should eventually batch and deduplicate read dependencies at
compiler-proven region boundaries. Repeated reads of the same version in one
region need only one subscription. Pure SSA arithmetic can remain ordinary
machine code and be recomputed within the region. Larger regions reduce history
cost while increasing work per invalidation. These are optimization directions,
not savings already demonstrated by this prototype, which records six reads
including one repeated coefficient read.

Single ownership avoids atomics in the measured hot path. A parallel implementation
should use worker-local append buffers and immutable published generations;
multiple workers appending to the same version head would cause contention and
cache-line bouncing. Independent arrays avoid mixing live values with history,
but metadata traffic still competes for cache capacity. No hardware cache-miss or
coherence counters were measured, and multi-core scaling has not been established.

There is a simple storage bound, not a universal cycle bound: undoing an arbitrary
overwritten 64-bit value requires retaining its information somewhere, or retaining
enough deterministic inputs/checkpoints to recompute it. With a 32-bit location
and implicit append order, an old-value log needs 12 logical bytes per such write;
this implementation uses 16 after alignment. Compression, first-write-per-epoch
coalescing, or known address patterns may reduce that. Selective repair additionally
needs dependency and replay-context information. A claim of a universal 1–2%
overhead would not be supported by these results.

## Native measurements

Measured on 2026-10-15, Windows 11 x64, Ryzen 9 5900HX, LLVM 20.1.8 through
llvmlite 0.46.0 and an optimized MSVC runtime. Raw timings, environment, hashes
and lowering audit are in [the measurement artifact](native-temporal/results/windows-x64.json).

Each history has 1,024 entities, 64 ticks, and 65,536 native region executions.
An entity has position, velocity, input and coefficient: 32 KiB of current state.
Each update makes six tracked loads and two state stores; an external captured
input adds one version. Arithmetic uses defined unsigned 64-bit wrapping.
`work` selects 0, 32 or 256 integer mixing iterations, with unchanged memory access
counts. This is a synthetic compute sweep, not a representative complete engine.

One input is corrected at tick 16. The suffix contains 49,152 updates. Independent
entities, a next-neighbor dependency, and a shared entity-zero dependency exercise
different propagation patterns. A final case corrects every entity at tick 16.

Timings are medians of 15 trials after one discarded warmup. Forward variant order
rotates. Allocation and independent verification are outside timers; recording's
first touches, repair staging/scheduling/publication, and replay's restoration are
inside. Snapshot replay restores the exact tick-16 checkpoint and rebuilds suffix
checkpoints. Undo/redo reverses every suffix write and regenerates its undo log.
Both are stronger baselines than restarting from tick zero. Repair order is fixed;
CPU frequency, affinity and OS background load are uncontrolled. Raw samples are
retained so small differences are not mistaken for guarantees.

| Dependency pattern, work | Native forward ms | Tracked forward ms | Selective repair ms | Snapshot replay ms | Undo and redo ms | Regions rerun |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Independent, 0 | 0.195 | 10.483 | 0.027 | 0.242 | 0.563 | 48 |
| Independent, 32 | 1.427 | 11.339 | 0.028 | 1.180 | 1.578 | 48 |
| Neighbor, 32 | 1.504 | 11.326 | 0.169 | 1.210 | 1.552 | 1,224 |
| Shared dependency, 32 | 1.416 | 11.354 | 5.657 | 1.211 | 1.634 | 49,152 |
| Independent, 256 | 15.679 | 23.222 | 0.037 | 11.831 | 11.485 | 48 |
| Shared dependency, 256 | 16.631 | 25.207 | 16.850 | 12.653 | 12.321 | 49,152 |
| All inputs edited, independent, 32 | 1.425 | 11.335 | 5.852 | 1.179 | 1.521 | 49,152 |

For the independent work-32 case, write-only recording is **1.679 ms**, versus
1.427 ms plain and 11.339 ms selective recording. Snapshot recording is **1.658 ms**.
Selective correction is about **43× faster than snapshot replay**, but initial
recording is about **7.9× plain execution**. With one correction, snapshot recording
plus replay totals about **2.84 ms**, versus **11.37 ms** for selective recording
plus repair. The selective strategy needs roughly nine comparable sparse corrections
to amortize its extra recording cost in this example. This estimate assumes the
same workload and propagation size; it is not a measured sequence of nine repairs.

For work-256, independent selective recording is about **1.48× plain**, and a
correction is about **321× faster than snapshot replay**. A widely shared dependency
still loses to snapshot replay. The cheap work-0 case pays roughly **54×** for the
dependency graph. These results rule out assuming that universal per-access
tracking is nearly free. They do not establish the minimum attainable native cost.

The validation reports 304 full-history correction comparisons, an agreed-API
example, cancellation/capture/failure cases, and four detected compiled mutations.
The 18 retained Node suites also pass. This is tested evidence, not a machine-checked
proof or coverage of arbitrary LLVM programs.

## Memory cost and a lockstep game

For `N` entities and `R = N × ticks` updates, the measured arena is:

```text
arena bytes = 228 × R + 176 × N + 640
scratch capacity bytes = 16 × R + 32 × N + 64
snapshot history bytes = 32 × N × ticks
undo history bytes = 48 × N × ticks
```

These formulas describe the actual bounded layout, including the benchmark input
lookup, spare version capacity and alignment. Scratch contains the dirty queue,
changed-version list and edit batch. They exclude allocator bookkeeping, code,
OS page tables, small handle objects and test-only oracle/baseline arrays.

For 1,024 entities and 64 ticks, current state is **32 KiB**. The selective arena
is **14.42 MiB**, plus **1.03 MiB** of reserved scratch. Snapshot history is **2 MiB**;
the undo log is **3 MiB**. Dense writes make full snapshots smaller than this log.
The model stores a version per write; it does not yet coalesce writes or reclaim
old segments. Replacements reuse the fixed graph and do not append another whole
trace, but continued forward execution would continue growing it.

At 60 ticks/second, extrapolating the 228-byte update record gives **13.36 MiB/s**,
or **46.97 GiB/hour** for 1,024 entities. This is a layout projection, not an
hour-long throughput test. An opcode-sized graph or allocation/lifetime trace
could be much larger. Whole-editor process memory is not implied by this example.

A strict lockstep game waits for agreed inputs and need not speculate. A game
using prediction/rollback should retain a bounded recent window, recorded inputs
and deterministic simulation state. Twelve ticks of snapshots for this state
take **384 KiB**; the analogous selective arena would take about **2.84 MiB**
before scratch. Keep rendering, audio, network sends and wall-clock reads outside
the replayed simulation; publish resulting state/effect intents to the host.

For this synthetic work-32 case, selective recording costs about **0.177 ms/tick**
for 1,024 entities. That is an absolute measurement of this small loop, not a game
frame budget prediction. Shared RNG state, global reductions and shared collision
data can make one corrected input affect most of a tick. An automatic runtime
should eventually choose suffix replay when invalidation becomes dense; rebuilding
the selective graph during such a fallback has its own cost and is not implemented
by the plain snapshot baseline.

## Cold history on disk

The proposed tiering is sound: keep current state, recent trace and scheduling
metadata hot; spill older trace segments, checkpoints and captured input blobs;
reload them when a correction reaches them. Ordinary access to current state
should not require fetching cold history. Paging shifts latency and capacity costs;
it cannot make old dependency traversal free.

The executable proves a first step. Its entire offset-based arena can be created
as a Windows file mapping. Recording writes directly to that mapping. It flushes
the view and file, unmaps it, remaps it, and selectively repairs a past input. A
separate process then opens the same file and successfully applies another repair.
All historical version values are checked against fresh independent execution.

The retained run used a **15,123,072-byte file**. Recording took **15.707 ms**;
explicit flushing took **200.249 ms**; remapping took **0.142 ms**; the following
48-region repair took **0.609 ms**. In a new process, mapping took **0.068 ms** and
repair **0.379 ms**. These are single smoke-test observations. The first remap uses
a warm OS cache; a process restart does not evict the system file cache. Neither
result is a cold SSD benchmark. The synchronous flush cost is precisely why this
operation should not be placed in every simulation tick.

Windows file mappings allow file pages to leave memory and be restored from disk.
The demo maps the full virtual range and lets the OS manage residency; it does
**not** enforce a RAM budget or implement an explicit segment cache. Flushing uses
both `FlushViewOfFile` and `FlushFileBuffers`, as required to flush data and file
metadata. In-process transactional publication does not provide crash-safe file
publication. [Microsoft file mapping documentation](https://learn.microsoft.com/en-us/windows/win32/memory/file-mapping),
[flush semantics](https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-flushviewoffile).

An editor-scale implementation additionally needs:

- Immutable, checksummed history segments and batched asynchronous writes, with
  bounded queues and backpressure when storage cannot keep up. The prototype's
  reverse-edge head updates dirty older pages; it is not yet a sequential append
  archive. Sealed adjacency blocks and later edge-delta runs can avoid that pattern.
- A small resident directory from versions and input IDs to segments, plus cold
  dependency indexes. Keeping every edge in RAM would defeat the point of spilling
  values. Coarse segment summaries can reject unaffected segments before paging.
- Checkpoints and replay recipes, including captured nondeterministic inputs,
  native code/module identity and allocation/lifetime information. Compiler spills
  are not a persistent continuation format. The demo binds one known native kernel
  on reopening and serializes no raw callback pointers.
- Explicit residency limits, prefetch, metrics for hard faults and repair latency,
  and large-history tests beyond physical RAM. The current test proves none of
  those operational bounds.
- Crash recovery through immutable generations plus an atomically committed
  manifest or journal. The demo mutates mapped version records in place and has
  no crash-consistency guarantee.

On disk, references should be allocation/version IDs plus offsets, not raw native
addresses. Pointer values inside arbitrary captured user bytes are a separate
relocation problem; the full core's opaque pointer semantics are not solved by
this arena's offset-only metadata. This test only persists integer application
data and index references.

## Asset watcher and long-running editor

Treat loading a file as a captured external input. The watcher captures a complete,
stable new file version, coalesces repeated notifications, and replaces the original
input Write in a batch. The runtime then reconciles computations that consumed
that version. The importing code must consume captured bytes, not call the current
filesystem again during historical replay. The temporal dependency graph can then
serve both simulation and asset recomputation; a separately maintained asset graph
is unnecessary for dependencies entirely inside instrumented deterministic code.

The current API requires `temporal_replace` to preserve the insertion's extent.
A file whose length changes therefore cannot simply replace an old fixed-size byte
write with a larger one. A future file-input boundary can use a fixed-size descriptor
for an immutable retained content blob and length, with its lifetime/ownership
modeled by the runtime. The descriptor update changes the input identity the importer
reads; replay may rebuild allocations and control flow. This native scalar/fixed-shape
proof does not implement that boundary, a watcher, variable-sized imports, or the
required dynamic trace reconstruction.

External tools, GPU uploads, renderer resources and filesystem outputs need explicit
boundaries too. Produce deterministic output/effect descriptions and publish them
after successful repair. Replaying an upload, process launch or file write as an
uncontrolled side effect would not preserve the claimed semantics. Likewise, a
past correction that removes an anchored occurrence must retain the core API's
orphaned-Point/atomic-failure behavior.

Disk does not remove the fundamental retention decision:

- **Full historical editing:** retain enough old inputs, checkpoints, code and trace
  to reconstruct any still-addressable Point. Values/edges may be discarded and
  regenerated from a checkpoint, trading storage for replay latency.
- **Current-output incremental rebuilding:** retain the reachable computation cache
  for current assets and outputs; compact superseded versions and unreachable work.
  This supports rebuilding current outputs but is not automatically equivalent to
  unlimited historical undo.
- **Recent simulation rollback:** retain a bounded tick window and reclaim older
  segments once no retained handle or dependency needs them.

Paging preserves a Point's meaning. Pruning history may not. The current ten-operation
API has no permission to silently expire a still-valid Point: a retention policy must
keep pinned history, reconstruct it, refuse compaction, or explicitly establish a
different lifetime contract. A checkpoint by itself does not preserve all old
instruction gaps or the dependencies needed for precise past edits.

The implementation direction supported by this evidence is one temporal semantic
model with different internal recording granularities and retention policies:
cheap bounded rollback for hot game ticks, retained incremental computations for
asset/import work, and cold reconstruction for deep historical edits. Native dynamic
trace repair, bounded residency and safe reclamation remain the next engineering
proofs; the current measurements should be used to constrain them.
