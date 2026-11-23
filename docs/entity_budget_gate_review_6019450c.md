# Independent Entity and WorkBudget gate review

Reviewed joined `6019450c23be2453987351d4847de37a78fab7b9`, containing B2
`f9565c463effdc82c54eeede6cc703ba041ea31a` and B1
`05780abb953c63fe7dfd7805ed0d71dedb486cf5`. No production defect was found in the
traced delta/caller closure. One concrete documentation defect was corrected:
B2's descriptor-page derivation used8-byte alignment instead of the actual x64
16-byte allocator contract. This is source review, not a new runtime/race proof.

## Exact sources

The external L1 `logs/entity_gate_review_6019450c/source_manifest.json` records66
reviewed definitions, callers, fixtures and build contracts by full Git blob and
SHA256; manifest SHA256
`98c7a7fde605a352bfc12d3c79334ef1d2ba5e9a1787343b3a7d46eb9dda5d39`.

| Changed producer | Git blob |
| --- | --- |
| library/entity_types.tower | `8ed4cd05f8f2315b5286d978db6f2fdf0ed82b3c` |
| library/entities.tower | `62e837e9e17fa3bfb8d6aa916a30768469b10be1` |
| library/entity_stage.tower | `e4355db14049c532d44ddd2eab3062bfe233d53c` |
| library/work_gate.tower | `8f33a5643ea370687a436963b755bc5077194c39` |
| compiler/frontend_units.tower | `1afe4ad522a5f14632c43dcc50bc2b2a63db7b59` |
| host/work_linux.tower | `f0ce4bf3cfc01517357337076691460f139de391` |
| host/work_windows.tower | `de6689717db20efbc3de18f81eab16365b1de88b` |
| host/work_macos.tower | `8ed800b7dd609a7b11e6027a3fe3d7d7f5057ada` |
| host/work_wasi.tower | `d83e935c37f5fc0b42e02ae0d69867a24eb9f889` |
| host/work_portable.tower | `31593dbd7e9a74587d0e1f62e15fa43fb5a87ff1` |

## Entity lifetime and accounting

- `entity_create_result` and `entity_stage_create_result` default-initialize the
  complete descriptor, including reused pool slots. The first add binds its own
  inline cell. No whole-Entity copy/move caller was found. Page ownership transfer
  changes links, not descriptor/payload addresses; the self-pointer stays valid.
- `entity_component_add_result` keeps the inline index authoritative while a
  private four-entry pending array, payload and table are prepared. Its defer
  frees pending storage on failure. Successful preparation commits the pointer,
  capacity, count, type index and table in order, with no fallible work remaining.
  A failed first add may retain an empty initialized inline index; later heap
  growth/type-instance preparation may retain capacity, not partial membership.
- Inline bytes are already charged with the descriptor page. Promotion reserves
  the whole new heap buffer while that page remains owned. Later replacement
  admits old+new through `entity_buffer_resize_result`/`work_buffer_resize`, then
  copies and releases old storage. Payload addresses are independent of indexes.
  The generic heap helper is not inline-aware: production branches protect it.
  The three fixture prewarm callers use empty descriptors; accounting's possibly
  initialized inline index takes the no-growth return, never a heap-header read.
- Removal prepares the destination table before compacting live entries and
  disposing the component/type reference. It does not demote/shrink. A cancelled
  lease disposes only appended payloads, restores the original live count and
  retains a promoted heap index under the surviving entity's budget ownership.
  Slots beyond count may be stale and are never live lookup entries.
- Stage preparation reserves shared child/type/table capacity and reference
  holds before publication. Failure unprepares pending tables; publication
  transfers both owned page lists after joins. Discard cancels unowned references
  before finalizers, then frees private components/indexes/descriptors. Ordinary
  reclaim and private-node discard are the two component-index destruction paths;
  both use `entity_components_free`, so inline storage never reaches heap free.
  The physical page is freed only when its last slot dies; free-list reuse does
  not move surviving objects. Leased survivors do not retain a stage-pool pointer.
- Views pin structure/lifetime, not writable component lists. New leases require
  coordinator exclusivity before pinning; direct add/remove on unleased pinned
  owners returns Busy. Existing-component lookup remains a borrow, not permission
  to mutate its payload. Stage workers own private pools and leased append paths;
  shared interning/index/table publication remains coordinator work.

The corrected minimal derivation is: `alignment=16`,
`stride=align_up(sizeof(Entity)+8,16)`,
`capacity=min(32,4096/(stride+48))`, and physical page bytes
`184 + capacity*(stride+48) + 8 + 15 + 32` on x64. Thus Entity184→192 means
stride192→208, capacity17→16 and bytes4319→4335. A private size class holding33
descriptors needs8638→13005 bytes. This corrects only the source-derived paragraph
in [B2's receipt](entity_inline_component_70e77b60.md); measured tables remain intact.
The derivation uses unchanged `host/memory.tower` blob
`4e29c37f03565a18c21e40fa610f02aeb9a26405`, not a new census.

`entity_accounting`/`entity_locality` correctly count the inline cell through
`sizeof(Entity)` and skip its heap header/index charge. Actual page capacities,
strides and physical grants must be counted from owners, once per page.
`frontend_storage_profile` reports logical descriptor bytes separately from page
and ledger metadata. Receipt count is not allocation-call count; neither logical
payload nor budget bytes equal RSS. A single logical pointer slot does not imply
one fewer physical allocation when a payload/descriptor page must also grow.
Entity ABI consumers must rebuild coherently; current API providers import the
shared type or pass opaque pointers. Old reactor/bootstrap layouts are separate.

## Gate ABI, callbacks and lock ordering

The host gate is a stable opaque owner; allocation is the existing raw foreign
transport policy, outside compiler-buffer grants. Counting start/finished/
completion/claim signals are unchanged. No WorkBudget field or ledger algorithm
changed. `TowerWorkHost.cmake` selects one platform provider; single-owner fault
executables bind the separate portable transport.

| Host | Allocation/initialization/destruction review |
| --- | --- |
| Linux LP64 |48 bytes as six aligned u64 words cover local glibc x64 mutex40 and [AArch64 mutex48](https://raw.githubusercontent.com/bminor/glibc/glibc-2.39/sysdeps/aarch64/nptl/bits/pthreadtypes-arch.h). Null-attribute initialization; failed init frees without publication. Destroy must succeed before free. Entry/leave errors trap. No recursion or arbitrary Linux ABI claim. |
| Windows x64/ARM64 |One usize, initialized by InitializeSRWLock, exclusive operations only. [Microsoft's contract](https://learn.microsoft.com/en-us/windows/win32/sync/slim-reader-writer--srw--locks) requires nonrecursive use. [Stable ownership and drained destruction](https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-initializesrwlock) match the caller contract. A1 owns actual runtime acceptance. |
| macOS |One zeroed u32 matches [Apple's opaque lock and zero initializer](https://raw.githubusercontent.com/apple-oss-distributions/libplatform/main/include/os/lock.h); stable allocation, same-thread leave, free only after drain. Requires macOS10.12+; runtime unvalidated here. |
| Shared WASI |Existing sem_t allocation/initialization plus one initial permit; enter retains timed waits and work_host_check. Close retains sem_destroy. No counting-signal behavior is repurposed. New joined browser runtime acceptance is not inferred from older25dddd04 tests. |
| Portable |Open returns null; enter/leave trap. Existing host-capacity clamping and fast serial frontend remain unchanged; this provider supplies no parallel lock. |

Every callback/entry path in the frozen closure was traced:

- WorkBudget's five gate-taking APIs are set_wake, snapshot, reserve_result,
  release_result and validate_result. Each enters once and defers leave; locked
  helpers call only locked helpers, not those public entry points. Ledger growth
  uses raw vector/realloc, not budgeted WorkBuffer recursion.
- The sole production wake binding posts the pool completion signal. The only
  custom wake, `budget_gate_wake`, increments its private count and posts a signal.
  Neither reserves, waits, closes, snapshots or reenters a budget. Byte-only release
  does not wake denied lane admission; lane release disarms before notification.
- `backend_units::unit_admission_nested` is the sole extra manual budget.enter
  caller: it reads the Capacity predicate and leaves before sleeping or executing
  grammar work. Other synchronization bindings still use wait/post counting
  signals, with no custom reentrant callback introduced by this delta.
- `work_batch_execute` releases its claim semaphore before observer/kernel calls.
  Reserve/validate complete before dispatch/join; WorkBuffer allocation/free occurs
  outside the ledger critical section. Worlds borrow the same frozen ledger and
  do not add another lock. No current pool-claim→budget→claim cycle or simultaneously
  held pair of world-budget gates was found. Arbitrary future callbacks are not
  licensed to reenter or acquire another budget under this gate.
- Frontend binds the gate before pool/world allocation and dispatch. Partial pool
  construction closes initialized signals/threads and its buffer. Every frontend
  error uses the same owner close. Normal/cancel close drains work, detaches wake,
  joins/closes pool, releases worlds and snapshots, disposes the zero-live ledger,
  then closes the gate. Zero used lanes alone is not used as proof of quiescence.
- All changed gate-owning fixtures (budget/buffer/arena shared, schedule budget,
  and buffer/arena/vector profiles) close/join pools before releasing retained
  grants, disposing budgets and closing gates. The budget reuse test changes
  revision only after detach/dispose; its stale receipts cannot revive ownership.

## Evidence and remaining limits

Existing evidence is attributed, not rerun: [B2](entity_inline_component_70e77b60.md)
reports inline transitions/old+new denial/cancellation, serial injected promotion
boundaries, page reuse, accounting and real production-allocator stage overlap.
Its two default fault suites already failed before the delta and remain pending
B2's separate work; they are not accepted by the inline selector. Its matched
performance pairs exclude B1's gate.

[B1](compiler_budget_gate_70e77b60.md) reports four real threads×2048 shared-budget
rounds, exact wake/revision controls, shared buffer/arena/schedule cleanup, native
LR/units and nine strict symbol closures. The later joined ba8816e4 adoption
explicitly includes Entity's ABI refresh and repeats affected LR/units/symbol and
small1/multi4 canonical/cleanup controls. These support the composition; they do
not combine the two separate performance studies into one speedup claim.

NonLinux host-object compilation is not host execution. Windows runtime belongs
to A1; macOS, Linux ARM64, joined shared-Wasm runtime and integrated instrumentation
remain unaccepted here. No new sanitizer, full census, bootstrap or test matrix was
run. This documentation-only review needs no runtime profile. ROOT owns release.
