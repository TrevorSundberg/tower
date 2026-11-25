# Typed ECS access for the Wasm relocation jobs

**Decision. Prototype a world-bound request that hands a named callback a typed read view and two exclusive destinations.** The coordinator says which linker it reads and which section and job it writes. The worker can then visit copy descriptors and patch bytes with ordinary Tower. The public pin accepts this interface. Adoption depends on a working admission and cleanup adapter. The example below declares that adapter as an extern so its missing implementation is visible.

## Two callers on the same path

At frozen main `ca54328765c60d6e6d7d7941f03ad704f10e9537`, `wasm_link_jobs_run` creates one ECS job per group of copies and requests its access. Its pool calls `wasm_link_job_execute`, which calls the existing relocator. Host 2's retained `fixture/link_competing.tower:23–54` feeds this path a TLS object through `wasm_link_run`. It compares the entire linked image with serial bytes, checks TLS size and alignment, then checks peak admission with four and two children held. The frontend regression in `lr_budget.tower:230–239` is a separate owner of worker capacity. A frontend handle cannot grant a borrow into the linker world. [Coordinator and worker, lines 27–40 and 70–159](../scaffolding/backend/wasm_link_jobs.tower#L27) · [World-owned object payloads, lines 15–55](../scaffolding/backend/wasm_link_world.tower#L15) · [Frontend fixture](../scaffolding/tests/lr_budget.tower#L230)

**Before, coordinator.** Each group has a new node and a typed `WasmLinkJob` component. The following block declares its graph work. [Frozen source, lines 106–122](../scaffolding/backend/wasm_link_jobs.tower#L106)

```tower
var task = work_request(&graph, bits(void*, node), WasmLinkPatchQuery, convert(u64, jobs.length));
var begin = work.copies.data[first].offset;
var end = work.copies.data[last - 1].offset + work.copies.data[last - 1].source.length;
if task == 0 || !work_access(&graph, task, WasmLinkInputDomain, WasmLinkInputComponent, 0, link.world.objects.length, WorkAccessMode.Read)
    || !work_access(&graph, task, WasmLinkOutputDomain, WasmLinkOutputComponent, begin, end - begin, WorkAccessMode.Write)
    || !work_access(&graph, task, WasmLinkJobDomain, WasmLinkOutputComponent, jobs.length - 1, 1, WorkAccessMode.Write)
    || !work_seal(&graph, task) || !work_demand(&graph, task) {
    return wasm_link_fail(link, WasmLinkError.Input, wasm_text_bytes("linker job access graph"));
}
```

**Before, worker.** The transport gives the callback an untyped pointer. The callback recovers its job, copies the linker header into private scratch and writes its result to that job. [Frozen source, lines 27–40](../scaffolding/backend/wasm_link_jobs.tower#L27)

```tower
fn wasm_link_job_execute(payload: void*): void {
    var job = bits(WasmLinkJob*, payload);
    var local = *job.owner;
    local.error = WasmLinkError.None; local.error_name = default;
    for (var at: usize = 0; at < job.count; at++) {
        var item = &job.copies[at];
        var target: WasmBytes = { data: job.output + item.offset, length: item.source.length };
        copy(target.data, item.source.data, target.length);
        if !wasm_link_relocate(&local, item.input, item.chunk, item.original_offset, target) { break; }
    }
    job.error = local.error; job.error_name = local.error_name;
}
```

## Proposed caller interface, published Tower syntax

A world module defines a small descriptor for one operation. Named fields specify the resources, and the callback signature specifies the payloads. The caller passes the world that owns the node. The descriptor may cover ordinary owned storage such as a section buffer as well as a component. The reusable parts are the existing `work_view(T)` traversal and the runtime's graph, tickets and pool. This example gives the linker a concrete binding so an application caller does not have to supply numeric resource domains or invent a component kind.

```tower
struct PatchRead { link: WasmLink*; copies: work_view(WasmLinkCopy); }
struct PatchWrite {
    bytes: WasmBytes; origin: usize;
    error: WasmLinkError*; error_name: WasmBytes*;
}
struct PatchPlan { graph: WorkGraph*; job_kind: Entity*; }
struct PatchTerms {
    read_link: WasmLink*; write_section: ByteBuffer*; write_job: WasmLinkJob*;
}

extern fn wasm_patch_request(world: WasmLinkWorld*, plan: PatchPlan*, node: Entity*,
    ordinal: usize, terms: PatchTerms*, visit: function(void, PatchRead*, PatchWrite*)): bool;
```

**After, coordinator.** Once per section, immediately after registering the job kind at line 96, bind the private graph and that exact kind. This is one additional two-field stack initializer.

```tower
var plan: PatchPlan = { graph: &graph, job_kind: kind };
```

For each group, give the request its one-based ordinal and typed terms. The request must consume the temporary `terms` synchronously and copy the fields needed later into the job owner.

```tower
var terms: PatchTerms = { read_link: link, write_section: section, write_job: job };
if !wasm_patch_request(&link.world, &plan, node, jobs.length, &terms, patch_copies) {
    return wasm_link_fail(link, WasmLinkError.Input, wasm_text_bytes("linker job access graph"));
}
```

**After, worker.** The adapter lends the callback a slice of descriptors, a slice of destination bytes and the two private result fields. `origin` is the section-relative offset corresponding to `bytes.data[0]`. The caller can see where the permission to write ends. The loop relies on the adapter having validated every copy against that slice.

```tower
fn patch_copies(input: PatchRead*, output: PatchWrite*): void {
    var local = *input.link;
    local.error = WasmLinkError.None;
    local.error_name = default;
    foreach (var & item in &input.copies) {
        var offset = item.offset - output.origin;
        var target: WasmBytes = { data: output.bytes.data + offset, length: item.source.length };
        copy(target.data, item.source.data, target.length);
        if !wasm_link_relocate(&local, item.input, item.chunk, item.original_offset, target) { break; }
    }
    *output.error = local.error;
    *output.error_name = local.error_name;
}
```

The acceptance count is over these two source blocks on a successful group. It excludes the unchanged error formatting call. One callback invocation covers the entire group.

| Caller operation | Frozen | Sketch |
| --- | ---: | ---: |
| Explicit graph API calls per group | 6 (request, three access terms, seal, demand) | 1 typed request |
| Caller-written formulas for first and exclusive end byte | 2 | 0 |
| Read/write term fields to initialize | 0 | 3 |
| Worker casts from transport payload | 1 | 0 |
| Copy and relocation call sites per descriptor | 2 | 2 |
| ECS lookups, pins or ticket operations inside the copy loop | 0 | 0 |

Five graph call sites move out of the coordinator. The three claims, checked range arithmetic, ticket, pin, draining and component creation still cost work. In particular the coordinator's component-data cast at line 111 still exists. A library must supply the adapter and the one untyped pool trampoline, and construct two small view descriptors per callback. The proposal earns its place through a smaller ownership surface. There is no measured runtime saving.

## What the adapter must guarantee

1. **Bind to the actual owner.** The trusted coordinator constructs the plan at the successful registration site and the terms from its live job list. The plan and node must belong to the same section. A future safe binding must prevent client construction or mutation of this plan. Verify the node/store, registered job kind, ordinal and component payload against that plan. Require `&terms.read_link.world` to match the explicit world, `job.owner` to match that linker, and the output base to match the section buffer of this plan. World identity is independent of a raw entity address or an ordinal. A saved identity would need owner and incarnation checking at reacquisition.
2. **Reserve three resources.** Read the frozen link header, descriptors, source bytes, chunks, objects, layouts, symbols and reachable relocation vectors. Exclusively write the section's interval and this job's result fields. Derive the interval from the first and last descriptors in the group's ordered, nonempty range. Before dispatch establish that every source is live, all lengths fit without wrapping, each destination lies within the claimed interval and section, and sources do not overlap destinations subject to concurrent writes. Preserve single-job copy order. Normal preparation can establish these facts while appending descriptors. A dynamic or foreign input needs a checked boundary or refusal. Independently opened graphs require an exclusive outer owner or shared admission for any backing allocation they both reach. [Offset construction, lines 48–63](../scaffolding/backend/wasm_link_jobs.tower#L48) · [Relocation reads and bounds checks, lines 116–127](../scaffolding/backend/wasm_link_relocate.tower#L116)
3. **Separate declaration from execution.** Register the terms on the existing graph before sealing. Take a revision/profile/dispatch ticket and pin the frozen world before lending payloads to a worker. Register the real backing regions consistently. Two distinct domain numbers cannot establish disjoint addresses. Readers may overlap. Overlapping writes to the same region need ordering, and a write alias *within* one callback needs rejection or an explicit sequential contract. Today's conflict check compares a candidate with other executing tasks. While sealed work is outstanding, prohibit structural changes to the store and separate reallocations of borrowed vectors. [Access declaration and conflict checks, lines 434–519](../scaffolding/library/work_graph.tower#L434) · [Ticket admission, lines 660–681](../scaffolding/library/work_graph.tower#L660)
4. **Bound the callback.** Use one noncapturing `function(void, PatchRead*, PatchWrite*)` per group through a correctly typed trampoline. Keep callback binding and input descriptors stable until receive. Expose `copies` with length and capacity bounded by the group's count. The read view covers reachable input fields. The shallow local linker copy permits private header updates only. On success or failure, its borrowed error name still needs a live owner until the coordinator consumes it. For future Stronghold, check transitive effects including the relocator, callbacks, foreign calls and reentry. Code that can recover unchecked mutation through another field or import fails that check. [Function value contract](function-values.md#L3) · [View representation](../scaffolding/library/work_view_types.tower#L4)
5. **Close in the existing order.** Before dispatch, a failed request aborts construction and disposes the partial graph and created nodes. Do not leave a runnable partial task on a reusable graph. After any submission failure, stop admission and drain accepted jobs before unpinning or freeing their payloads. On cancellation, drain **before** graph cancellation and before writing an error into the shared linker header. On normal receive, finish the matching ticket, inspect private errors in source order after joining all jobs, and publish output only on success. A temporarily smaller pool uses its actual `pool.count`. A nonthreaded pool executes its admitted job inline. The explicitly serial copy path bypasses job construction. [Drain, cancellation and ordered errors, lines 125–159](../scaffolding/backend/wasm_link_jobs.tower#L125) · [Pool submission](../scaffolding/library/work_pool.tower#L216) · [Prior output and exact error oracles, lines 80–115](../scaffolding/tests/wasm_link_job_checks.tower#L80)

## What the pin checks and what Stronghold would reject

The evidence packet's `sketch/typed_patch.tower` imports the frozen linker types and real relocator. The public Linux x64 pin (SHA-256 `509557309b941160cdb55eb7ea407c1e329e6ebd8ef126340552e857208cf42f`, same Git blob as public `e06aa12e`) emitted Wasm32-target LLVM for the caller and callback. The request is an unresolved library declaration. Swapping the two nominal callback parameter types exited 1 with the expected signature diagnostic. The following well-typed Tower assignment also emitted a store in LLVM.

```tower
struct RetainedPatch { saved_bytes: u8*; }
// This record belongs to the caller and survives the section and its batch.
extern fn retained_patch(): RetainedPatch*;
export fn keep_patch_bytes(input: PatchRead*, output: PatchWrite*): void {
    var retained = retained_patch();
    retained.saved_bytes = output.bytes.data;
}
```

**Future Stronghold diagnostic at the assignment:** the section borrow expires when this callback returns. The destination field belongs to the longer-lived caller. Return an owned copy, or store an owner-bound identity and resolve it in a new scope. Naming the parameter `PatchWrite` carries no lifetime enforcement in published Tower. The first Stronghold journal entry requires checked identity, access and transitive effects. Its revision favors checking dynamic facts once on scope entry, then traversing direct payloads. [Original proposal, lines 32186–32411](temporal-opcode-research-journal.md#L32186) · [Revised cost and scope contract, lines 32423–32524](temporal-opcode-research-journal.md#L32423)

**Inner loop.** Both optimized Wasm32 LLVM fragments have a 24-byte stride over contiguous `WasmLinkCopy` descriptors and an alignment-one `llvm.memmove`. The proposed callback also subtracts the section origin. Borrowed iteration lowered to pointer arithmetic. Neither loop calls an entity lookup, scheduler or iterator helper. Following `item.chunk`, the object pointer and the relocation index still costs indirection. The input view holds a pointer, length and capacity. The output has a pointer and length, origin and private result pointers. A group descriptor and a dense array of component pointers do not establish packed object payloads. Byte bounds checks in the relocator remain. No vectorization result follows from these observations. Compare packet `sketch/frozen-ir.txt:34–44` and `sketch/optimized-ir.txt:46–62`. [Descriptor layout](../scaffolding/backend/wasm_link_jobs.tower#L13) · [Object indirection](../scaffolding/backend/wasm_link_world.tower#L10)

## Design sources

| Source | Consequence for this API |
| --- | --- |
| Flecs assigns access modes per term, including read, write, read/write and membership-only. Pipelines can use the declarations to place synchronization. | Match participation alone grants no write access. Name each destination and make shared input read-only in the contract. [Flecs query access modifiers](https://www.flecs.dev/flecs/Queries.html#access-modifiers) |
| EnTT's organizer derives resource modes from function/view parameters and can accept additional requirements for hidden resources. It builds a dependency graph. | The typed callback expresses its local permissions. The binding includes the section allocation and data reached through the linker. The Tower pool remains responsible for execution. [EnTT organizer](https://github.com/skypjack/entt/wiki/Entity-Component-System#organizer) |
| Rust scopes bound borrowed data by the lifetime of the work and join outstanding scoped threads before returning. A live exclusive borrow excludes competing reads and writes to that location. | Close every worker borrow before owner release. A borrowed field cannot be saved in longer-lived state. Keep one dynamic admission for facts outside the compiler's knowledge. [Rust scoped threads](https://doc.rust-lang.org/std/thread/fn.scope.html) · [Rust borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html) |
| Burst shows a shifted copy whose scalar result changes if a vectorizer assumes distinct input and output. | Require a backing-region proof for any optimizer alias promise. A pin, different component names and two typed pointers supply no such proof. [Unity Burst memory aliasing](https://docs.unity3d.com/Packages/com.unity.burst@1.8/manual/aliasing.html) |

The eight historical lanes constrain this proposal. A1 follows world-local kinds and explicit accesses. A2 describes the actual linker descriptor layout. B1 records the difference between a requested width and a shared grant. B2 and D2 document a real cancellation race when the owner header was written before the reader drained. L1 ties a borrowed input's lifetime to its owning call. L2 identifies the owner behind an otherwise unprotected worker record. D1 supplies range-conflict and stale-ticket controls. These are source-bound reviews and experiments. [A1 lines 43–48](compiler_ecs_audit_a1.md#L43) · [A2 line 585](compiler_ecs_audit_a2.md#L585) · [B1 line 32](compiler_ecs_audit_b1.md#L32) · [B2 line 296](compiler_ecs_audit_b2.md#L296) · [L1 lines 52–59](compiler_ecs_audit_L1.md#L52) · [L2 lines 51–52](compiler_ecs_audit_L2.md#L51) · [D1 line 185](compiler_ecs_audit_d1.md#L185) · [D2 lines 2137–2138](compiler_ecs_audit_d2.md#L2137)

## Evidence and remaining decision

On host 2, the retained TLS linker ran the serial reference, four requested with all four children held (peak one), and four requested with two held (peak two). All three produced the same image and TLS size/alignment 16/16. The linker case closed its workers. The separate frontend positive at `8b7878c8` returned 42/43 and 142/143. Cancelling either active owner suppressed its own two programs. A failed peer exposed ordinal 2, cause None, offset 19174 and the exact unknown-local diagnostic. The serial and four-slot outputs and diagnostics matched. Earlier `a65e1331` and `bbb01f5e` controls detected the fifth spawn before wait with four occupied slots. The permanent four-child regression belongs to `1c2cc042`. The linker and owner controls are complementary. The frontend cancellation runs do not exercise cancellation inside the proposed adapter. [Host 2 journal and source identities](temporal-opcode-research-journal.md#L100929) · [Handoff acceptance boundaries](openhands_ecs_cloud_handoff_2026_11_24.md#L25)

The packet retains the verified archived inputs' hashes, the extracted host 2 fixtures, and the actual compiler inputs and IR. From its `host2-c5a158a4` directory, `bash check.sh independent/runs` rechecked the old before-wait refusal, stock byte and diagnostic parity, both cancellations, observed spare-lane overlap, linker and lifecycle oracles. It exited 0 without starting a browser. The retained transport timings used two pairs per configuration on Ryzen 5 3600 CPUs 0–3, quota 11.52, fresh processes and warm files. For example, the 128-function four-slot request medians were 2005/2073 ms old/new, renderer CPU 4.565/4.720 s and maximum renderer RSS 244036/243084 KiB. The peer was released before timing. Those sixteen samples compare two transport versions.

**Open runtime gate.** There is no linked implementation of the proposed request, so the proposed API has no execution, matched wall/CPU/RSS, allocator, overlap or sanitizer measurements. For a prototype, substitute the binding at the two cited caller sites and run the *same* TLS control on the dedicated executor with `job_grain = 1`. Require byte equality, peaks one/two and worker retirement, plus the existing cancellation and ordered-failure checks (old output `keep`, zero live views). Try a foreign-world job and overlapping destination claims before admitting callbacks. Keep the source-order and fifth-spawn controls sensitive. Packet `REPLAY.md` gives the offline and original executor commands and oracles. Until a candidate passes those gates, the evidence supports the API design and its compiled loop shape only.
