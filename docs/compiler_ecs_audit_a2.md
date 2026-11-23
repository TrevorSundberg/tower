# A2 shared ECS and scheduling audit

This is an **in-progress audit**, not lane acceptance or publication evidence.
Owner: A2 on KinmenA, exclusive `C:\Sandbox\tower-agent-2`, main.
Reviewed source baseline: `6282238779034442e0578d76b921ca117df819f1`;
A2 review checkpoint `a125c03e` includes the measured A2 changes below, on
published60741c51. Unmodified receipt rows retain the baseline reviewed identity;
later changed-file receipts state their implementation commit. Session
`01a2046f-fec2-7c71-be46-cad28f9ac147`, resumed Codex PID 15056.

The production library is `scaffolding/library`, with 25 baseline files plus
the new `work_budget.tower` and routed `work_budget_types.tower` (27 current files). Scope also
includes both compiler kernel files, component kinds, entity requirements,
world/worker policy, and the entities/shared-check units. Imported semantic
kernels remain A1/L2 ownership; frontend units and host transports remain B2
ownership. Their interfaces must be reviewed here without unagreed edits.
Bootstrap copied resources belong to D2's provenance audit and are not edited.

## Contracts and source interpretation

Read the completion plan, root AGENTS, threading handoff, compiler services,
the journal's newer type-value continuation, and focused test/build contracts.
Production helper readiness supersedes the handoff's historical missing-helper
claim. Foundation retains raw storage semantics; this audit does not impose
Stronghold policies.

Primary references consulted 2026-11-22:

- [Flecs systems](https://www.flecs.dev/flecs/Systems.html): declared access,
  query-driven traversal and deferred structural publication inform review.
- [Flecs component traits](https://www.flecs.dev/flecs/ComponentTraits.html):
  storage policy and stable addresses must match component access/lifetime.
- [Burst aliasing](https://docs.unity3d.com/Packages/com.unity.burst@1.8/manual/aliasing.html):
  optimization requires an actual alias contract. A Tower lifetime pin alone
  never establishes disjoint writable ranges or `noalias`.

## File review receipts

All paths below are relative to `scaffolding/`. Reviewed means a source review,
not independently validated runtime acceptance. These baseline rows retain the
original review status; later dated receipts supersede their pending evidence.
Integrated runtime and publication acceptance remain open.

| Path | Storage, ownership and scheduling conclusion | Evidence/gap and disposition |
| --- | --- | --- |
| `library/compiler_work.tower` | World-owned coordinator store and ordered child subjects; exclusive unit ranges and join dependencies use WorkGraph. Results accept dispatch 1 only under the once-per-unit transport contract. Close relies on executor draining. | Reviewed create/accept/failure-prefix/graph-extension/cancel/close. Audit callers for terminal cancellation and stale transport receipts; preserve API pending B2 coordination. |
| `library/compiler_work_types.tower` | Shared unit/backend identities and opaque transport callback descriptor. Payload lifetime belongs to caller, execute and receive have separate roles. | Reviewed all definitions. No duplicate semantic graph or implicit capture; cross-lane changes need agreement. |
| `library/work_graph.tower` | Packed task/edge/access vectors and hash/ready indexes are derived scheduling data, borrowing subjects. One coordinator mutates; handles survive growth, pointers do not. Dispatch tickets include revision/profile/generation. Declared access claims precede execution. | Reviewed all functions. Baseline targeted take scanned the frontier; measured replacement uses a derived ready slot with unchanged task size (evidence below). Cancellation invalidates receipts but does not join transport; callers must drain. Cycle detection requires owning-pipeline quiescence. |
| `library/work_pool.tower` | Stable slot array with per-slot start/finished and shared completion semaphores. Coordinator owns busy/running and writes job/callback only before start. Finite pre-leased batches borrow a frozen pointer view and stack descriptor; a pool-owned claim gate protects the derived next index. Named callbacks reject this descriptor; normal admission restores pool.execute. Close drains and joins before destroying gates/slots. | Full source/callback-consumer review through07246521. D1 normal/early-failure fixture and full LR each pass3TSan on this protocol; the batch fixture separately passes3ASan+3TSan with production allocator/transport, nonfirst-member projection, caller overlap and pool reuse. Nine-pair useful-work and tiny-job profiles are recorded below/in the journal. False sharing and pool startup remain unmeasured. |
| `library/entity_types.tower` | Stable paged component payloads; dense archetype rows and component-pointer columns are derived membership indexes, not packed archetype payloads. Store/stage own allocation indexes. Views pin lifetime only. | Reviewed all layouts. World context explicit; locality/fragmentation microbenchmark below measures the distinction. Representative compiler phase retention remains open. |
| `library/entity_api.tower` | Typed external declarations for separately compiled clients; no alternate implementation or storage ownership. | Reviewed all declarations against implementation signatures read so far. Retained subset is intentionally narrow. |
| `library/entity_stage.tower` | Worker-private canonical nodes, lease list and component pool. Coordinator reserves all table/child/type capacity before publishing. Queued payload references are held before closing final input pin; discard runs finalizers and detaches private pools. | Reviewed full create/lease/prepare/publish/discard/names/reference/hold paths. Caller proof and failed-publication/concurrency instrumentation remain pending; no defect asserted yet. |
| `library/storage.tower` | Caller-owned fixed byte arena and open-addressed integer map; no shared mutation or world registry. Reset invalidates arena borrows; map growth relocates slots. | Reviewed complete source. Arithmetic/allocation limits and target alignment need focused reference coverage. No scheduling parallelism is implied. |
| `library/vector.tower` | Packed contiguous generic storage; growth invalidates element pointers. Move transfers allocation only; disposal does not finalize pointees. Borrowed iteration snapshots data and length. | Reviewed all functions and reserve overflow checks. Shared graph calls must not retain element addresses across growth. No new defect demonstrated. |
| `library/queue.tower` | Packed ring storage, explicit FIFO, growth copies logical order and invalidates borrows. Head/length arithmetic avoids overflow. Move transfers storage, no deep ownership. | Reviewed complete source. Owner must remain structurally unchanged during borrowed iteration. No new defect demonstrated. |
| `compiler/compiler_kernel.tower` | Generic typed projection shares the WorkPool finite batch. Explicit extras exclude the already-reserved caller; wrapper preserves the old total ceiling. Single/zero-extra/serial paths remain inline. All jobs/leases survive joins; stage publication and grant return stay with callers. Same-pool reentrant dispatch is rejected by running check. | Full source at60741c51 plus A2 batch patch reviewed. First poll/refill experiment regressed2/4/8 lanes and was rejected. Frozen FIPS workload now measures1.95/3.86/7.35x scaling versus its own serial run, with caller participation and checked outputs. Full compiler caller integration/merged validation remain open; pins do not imply noalias. |
| `compiler/compiler_kernels.tower` | Dispatches shared CompilerKernelKind to existing semantic/parser/unit payloads; evaluation advances bounded interpreter work. No second queue. | Reviewed entire dispatch. Imported implementation ownership remains other lanes; readiness must match implicit syntax/type operations. |
| `compiler/component_kinds.tower` | Named private component slots and lifecycle IDs; actual component identity is per world. These are not public Foundation operation numbers. | Reviewed entire file. Coordinate shared layout changes; avoid unrelated constant rewrites. |
| `compiler/entity_require.tower` | Infallible ownership failures abort; recoverable library operations retain bool/null failure contracts. | Reviewed entire file. Diagnostic context is supplied at higher layers; no error converted to success. |
| `compiler/worker_policy.tower` | Resolves world from node and bounds nested capacity by immutable world limit and transport capacity. Plain stores fall back to host policy. | Reviewed entire file. Outer/nested memory/worker admission contract under coordination with B2. |
| `compiler/world.tower` | Explicit store owner/context, per-world component types and grammar cache. Worker limit installed at construction. Disposal rejects active views/caches/entities before releasing kinds/pool. The routed B2 patch adds a borrowed immutable WorkBudget binding only on a fresh world and requires a gate for shared lanes. | Baseline source plus B2_world_budget.patch fully reviewed. Lazy type registration remains coordinator-owned before worker reads; budget owner must outlive the world. Binding integration exists locally but merged caller validation remains open. No hard heap/RSS cap claimed. |
| `compiler/units/entities.tower` | Composes one ECS implementation with parse-tree/generic/host entity boundaries and stages. | Reviewed entire import unit; parse-tree/generic/host implementation remains owning lanes. Manifest changes need coordination. |
| `compiler/units/shared_checks.tower` | Composes shared-entity tests against authoritative Foundation layout. | Reviewed entire import unit. Generic harness changes coordinate with D1. |

| Path | Storage, ownership and scheduling conclusion | Evidence/gap and disposition |
| --- | --- | --- |
| `library/ar_archive.tower` | Synchronous immutable member/symbol inputs, private buffers and offset vectors; GNU ar32 output replaces caller buffer only after complete construction. Ordered symbols/member names are explicit. | Complete source reviewed at baseline. Arithmetic checks bound offsets, names and allocation; no scheduler/global state. Existing archive/reference checks need milestone reuse or rerun. |
| `library/bytes.tower` | Explicit ByteBuffer owner, packed bytes and geometric growth. Self-append/assign converts interior pointer to offset before relocation. Failure preserves contents; success may invalidate borrows. | Complete source reviewed. Alias-aware operations use ordinary copy semantics; never infer noalias. Cross-buffer concurrency requires distinct owners. |
| `library/bytes_interface.tower` | Separately linked typed ByteBuffer ABI subset; implementation remains bytes.tower. | Complete declaration review, no alternative storage or hidden ownership. |
| `library/bytes_types.tower` | Three-field allocation owner with explicit lifetime/growth contract. Shallow struct copies are not clones. | Complete review; callers must move/reset ownership deliberately. |
| `library/coff_import_object.tower` | Bounded name metadata writer with local next buffer and final ownership transfer; old output may be borrowed as input until commit. | Complete review. Explicit COFF widths/endian machine fields; only by-name code imports, no data/ordinal fallback. No shared scheduler state. |
| `library/crc32.tower` | Allocation-free streaming state value, immutable input bytes and fixed wrapping integer operations. | Complete review. Caller owns data lifetime; no world needed for this pure value algorithm. Reference coverage must remain independent. |
| `library/deflate.tower` | Per-call head/ring scratch, bounded match search, fixed/stored encoders; output committed only on success. Ring entries store absolute offsets and reject stale/future links. | Complete review. Packed scratch improves locality but is not entity storage. Memory cost is per concurrent call; include in caller budget. Allocation failures do not silently substitute stored compression. |
| `library/entities.tower` | Explicit store/context, ordered named owning children, stable component pages, type-instance pointer arrays and derived exact-signature tables. Table capacity/reservations precede mutation; pinned views defer reclamation and own query plans. | Complete source review after reconciling all spans. Stable pages may retain holes until last live slot dies; published stage pages detach from stage pool. No compaction/dense payload claim. Caller ownership must be acyclic; payload aliases/leases remain external to view lifetime. Locality fixture plus pages/tables/stage-ownership pass actualASan; concurrent publication/finalizer integration remains open. |
| `library/float_bits.tower` | Strict integer-based floating representation operations with local value scratch; no allocator, shared mutation or host floating environment. | Complete review. Runtime/staging share this implementation; NaN/signed zero/width conversions retain explicit policies. Numeric validation belongs existing differential corpus, not ECS scheduling claims. |
| `library/float_text.tower` | Caller-local bounded bigint/decimal arrays and output buffer; no locale/global parsing state or per-value heap allocation. | Complete review. Digit/exponent/scratch limits are explicit; parallel callers require private output/status. Immutable type-producing helpers contain only storage bounds. |
| `library/gzip.tower` | Per-call raw compressed and envelope buffers; zero timestamp/portable OS metadata, explicit CRC and modulo-size trailer. Final output transfer supports old-output input borrow. | Complete review. No platform clock or hidden IO; concurrent compressor scratch must be budgeted by caller. |
| `library/platform.tower` | Synchronous foreign output ABI borrows bytes only during call and returns failure explicitly. | Complete review. Necessary transport boundary, no invented lifetime beyond return or scheduler synchronization. |
| `library/sha256.tower` | Caller-owned state/block/schedule arrays, explicit byte count limits, finish computes on a struct copy. No allocation, registry or platform crypto state. | Complete review. Input must be immutable/disjoint from mutable state. Reference hash checks retained; no parallel shared-state update authorized. |
| `library/stack.tower` | Thin vector policy, same packed storage/transfer/disposal and scalar-pointer element ownership. | Complete review. No separate implementation or ECS graph; wrapper preserves vector borrow limits. |
| `library/zip_archive.tower` | Immutable ordered entries, explicit compression capability and private archive buffer; bounds/name/duplicate checks precede publication. | Complete review. Duplicate-name search and repeated CRC are potential large-archive costs, not measured ECS bottlenecks; no unrelated optimization. Output ownership transfers only after exact final-size check. |

All 25 production library files and the eight assigned compiler/unit files now
have source-review receipts. This does **not** close their runtime acceptance.
New A2 fixtures `tests/work_select.tower` and `tests/work_ready.tower` are reviewed
as part of the change: first measures checked deterministic selection workloads;
second checks targeted selection after sort/compaction, FIFO yield order, stale
receipts, reset and cancellation. No generic harness registration is changed.

## Discovered scheduling boundaries and ownership routing

| Path | Reviewed interface/ownership finding | Disposition |
| --- | --- | --- |
| `compiler/parser_workers.tower` | Exclusive world-cache pool lease; close drains before returning cache ownership; portable/browser pools close between leases. Pool grows only while idle. | Complete source read, B1 production owner. Retained pool larger than a later requested capacity needs attention when dynamic budgets arrive; explicit world cap currently fixed. |
| `compiler/grammar_types.tower` | World-owned grammar/pool cache and borrowed per-world kinds. | Complete source read, B1/B2 shared boundary; no edit by A2. |
| `host/work_dispatch.tower` | One platform entry calls ordinary WorkPool loop. | Complete source read, B2 owner; necessary callback identity/export contract. |
| `host/work_linux.tower` | Pthread/semaphore handoff with checked errno/join failures, libc allocation, get_nprocs capacity capped at 256. | Complete source read, B2 owner. Docker cpuset discrepancy measured; explicit budgets required until affinity-aware host policy agreed. |
| `host/work_macos.tower` | Pthread + dispatch semaphore ABI, joined handles, explicit CPU query. | Complete source read, B2 owner. No macOS runtime verification on this host. |
| `host/work_windows.tower` | WINAPI thread/semaphore handles, checked wait/release/close and separately exported callback; capacity across processor groups. | Complete source read, B2 owner. Windows runtime stress remains a gate; source review is not execution. |
| `host/work_portable.tower` | Explicit unavailable transport and capacity one; semaphore posting/waiting traps. | Complete source read, B2 owner. Correct for serial fault injection, never concurrency evidence. |
| `host/work_wasi.tower` | Fixed browser callback, pthread/sem ABI and bounded waits checking worker traps; no thread retention between leases. | Complete source read, B2 owner. Nested capacity supplied by browser; browser cancellation/worker trap must be verified on real transport. |
| `host/work_memory_wasi.tower` | Serializes allocator entry through host lock and refreshes memory views; wraps realloc/calloc copy/fill too. | Complete source read, B2 owner. This is concurrent allocator correctness synchronization, not serial test instrumentation. Contention/performance remains unmeasured here. |
| `compiler/frontend_units.tower` | Reviewed create/admit/receive/cancel/close: immutable snapshots, isolated unit worlds, static floor budget division, graph cancellation then transport drain before unpin. | B2 owns full audit/changes. B2 proposal for shared reservation API coordinated in A2 status; no cross-lane production edit. |
| `backend/units.tower` | Reviewed callback, cancellation, input unpin and destruction boundary: drains shared/own pool before releasing Foundation views. | B2 owns full audit/changes. Backend lanes must participate in any shared worker/memory reservation. |

The caller inventory also found parser LR work files, semantic work/continuation
files, frontend-world/host entity wrappers, backend relocation-job files and CLI
unit driver. These are owned by B1/A1/L2/B2; their full per-file receipts belong
to those owners. A2 still needs integrated evidence that shared contracts hold
at those call sites; a filename match is not a review receipt or permission to
edit another lane's implementation.

## Historical first-baseline notes (superseded by later receipts)

- Initial pull failed DNS resolution; retry succeeded to `d3ec5a4f` with clean
  production tree. No preexisting edits were incorporated and todo is untouched.
- Docker affinity 12-23 reports `nproc=12` but `_NPROCESSORS_ONLN=32`; production
  transport uses `get_nprocs`. CMake object commands currently omit `--jobs`.
  Explicit direct compiler `--jobs 1` bounds the first trial. D2/B2 coordination
  requested before a full build; CPU affinity is not a logical lane budget.
- Proposed targeted-ready lookup improvement is not implemented. Added Tower
  fixture `tests/work_select.tower` freezes 32/4096/65536-task forward/reverse
  selections and checks each identity/completion, reporting wall/CPU/peak RSS
  and retained graph capacity. This is a coordinator microbenchmark, not proof
  of worker overlap or end-to-end speedup.
- First fixture compile failed at line 34: `expected` is a grammar token, not
  an accepted local identifier. It never executed. Correct that name and rerun
  before production edits. Log:
  `C:\Sandbox\build\codex_ecs_20261122\A2\cache\logs\selection_before_build.log`.
  Docker `tower-a2-baseline` exited 1, PID 0; no active workers.
- LLVM 19 lists ASan, TSan and bounds passes. This establishes tool presence
  only. Actual Tower code instrumentation needs a deliberate diagnostic probe,
  production allocator/transport, real overlap and honest unsupported limits.
- B2 frontend fault-injection link failure was reviewed: serial transport is
  intentional and lacks `work_thread_entry`; a transitive unconditional export
  is the mismatch. A2 ACKs B2's narrow conditional-export CMake correction,
  preserving separate production overlap runners. A2 does not edit B2 files.

No runtime performance claim, completed full audit, sanitizer result, clean
successor, integrated native/browser/generation gate or publication is claimed.
Documentation findings alone do not change runtime cost; performance measurements
apply to the proposed code changes once the baseline fixture compiles.

## Ready-selection implementation evidence (2026-11-22)

The initial experiment above is historical. The final derived ready-slot change
preserves88-byte WorkTask layout and FIFO/ordered/yield/stale behavior. Nine
alternating checked executions of frozen work_select: reverse65,536 median
589.948ms ->2.710ms, CPU585.373ms ->2.713ms; forward3.098ms ->2.899ms. Retained
graph bytes7,340,096 unchanged. Process peak RSS before9,096..9,508KiB,
after9,100..9,396KiB. Initial96-byte candidate's retention/forward regression
caused a layout revision; it is not accepted evidence. Exact hashes, environment,
failures and commands are in the dated journal continuation. Six focused graph
executables pass; ASan ready regression passes. Whole-compiler impact remains open.

| Newly discovered/added path | Ownership and source-review conclusion | Evidence/gap |
| --- | --- | --- |
| `tests/work_select.tower` | A2 frozen Linux x64 measurement fixture; graph state private, every receipt/output checked, OS timing ABI explicit. | Read entire source; records wall/CPU/high-water RSS and retained capacity, no actual allocation-call telemetry. Microbenchmark only. |
| `tests/work_ready.tower` | A2 focused index/order/yield/reset/stale/cancel regression. Private graph and receipts; all joins simulated through coordinator completion. | Read entire source; native and ASan pass, not worker-overlap evidence. |
| `tools/instrument_llvm.tower` | A2 utility by root agreement; LLVM opaque handles owned with lexical cleanup, every defined function selected, explicit Linux x64 target and fresh output. | Full source reviewed; deliberate ASan/TSan negatives verify checks. Existing output-path helper checks resolved paths, not hard-link inode identity. Shared helper owned by D2; final safe-output boundary review remains open. |
| `tests/sanitizer_memory_probe.tower` | Deliberately invalid heap write, expected diagnostic/nonzero, excluded from passing fixtures. | ASan heap-buffer-overflow/exit1 observed. |
| `tests/sanitizer_race_probe.tower` | Deliberate shared-payload race after real pthread barrier, production allocator/transport. Signals outlive pool drain. | TSan data-race/exit66 observed with container-only seccomp exception. Default seccomp startup fails before guest execution. |

These prove usable LLVM19 ASan/TSan instrumentation for the probes; they do not
prove universal race freedom or UBSan coverage. Production runtime/allocator and
transport positive coverage, failure paths and integrated compiler coverage are
separate pending gates. Generic harness ownership remains D1.

## Shared budget extension review (2026-11-22)

This adds one production library file, bringing the library scope to26. Reviewed
against89d60388 plus the A2 working implementation; source-level acceptance and
integrated caller acceptance remain distinct.

| Path | Storage/ownership conclusion | Evidence and disposition |
| --- | --- | --- |
| `library/work_budget.tower` | Packed derived reservation entries and free-slot index; owner never copied, receipts identify owner/revision/slot/generation. Private serial ledger or immutable caller-owned gate serializes transactions. No payload store or scheduler is introduced. Zero grant creates no live entry; bytes-only reservations retain ownership until actual release. | Entire source reviewed. Seeded reference, malformed/stale/copy/foreign/revision/overflow/disposal tests pass; production concurrent allocator/transport fixture passes3ASan+3TSan. Last-error field is serial diagnostics only; shared callers use result/snapshot APIs. Caller integration, memory-accounting completeness and contention/scaling remain open. |
| `tests/work_budget.tower` | Private owner and deterministic reference counters independent of ledger slots. Tests deliberately copy receipts to reject stale ownership. | Entire source reviewed; native passes, including optional extra lanes and bytes-only retention. The separate work_budget_allocation fixture below now covers allocation failure. |
| `tests/work_budget_shared.tower` | Four barrier-confirmed pthread jobs have private receipts/results/allocation, share only the gated ledger. Outer grants precede dispatch; joins precede outer release, ledger disposal and gate destruction. | Entire source reviewed. Checked conversion bug in initial fixture fixed with explicit byte modulo. Native and3ASan+3TSan pass; this stresses accounting, not useful nested compiler speedup. |
| `tests/work_budget_profile.tower` | Frozen Linux x64 serial ledger-cost fixture, every grant and final counter checked. Caller-private timing/receipt storage. | Entire source reviewed. Nine paired executions: one-lane+0.153ns per reserve/release pair; twelve-lane median+0.37%;320/640B retained capacities unchanged. No integrated compiler comparison yet. |

Production work_pool/runtime/transport normal paths now pass3ASan+3TSan actual
object runs. D1 failure/cancellation cleanup and final integrated compiler remain
pending. docs/compiler_sanitizer_checks.md records the reproducible recipe and
scope; deliberate diagnostic probes establish sensitivity separately.

## Routed boundaries and instrumentation continuation

| Path | Review and ownership | Evidence/disposition |
| --- | --- | --- |
| `tools/tool_files_posix.tower` | Complete source read; D2 owner with root-authorized narrow same-inode guard edit. Explicit Linux statx boundary compares followed inode+device, fixed local scratch, no default world. Paths must remain frozen through output open. | Frozen hard-link regression fails before/passes after; real compiler-project caller and instrumentation utility compile/link. Seven-pair helper median62.493ms ->47.059ms, retention204B unchanged. No concurrent-rename guarantee or unsupported OS claim. |
| `tools/tool_files_linux.tower` | Complete source read of existing statx ABI, private path storage/traversal, ordered file list and atomic no-replace directory publication. D2 owns implementation; no A2 edit. | Shared boundary reused; compatible matching extern across both imports verified. Broader tool acceptance remains D2's. |
| `tests/tool_output_identity.tower` | A2 focused OS-boundary regression/profile; mkstemp owns unique names, lexical cleanup unlinks only those names, keeps source/symlink/hard-link identities explicit. | Entire source read. Before hard-link false acceptance/exit1, after rejection/exit0. Same/symlink/missing cases checked in every execution. No content rewrite occurs in this helper fixture. |
| `tests/work_pool.tower` | D1 routed cleanup patch reviewed/applied for validation, preserving D1 authorship. Deferred helper releases blocked jobs and drains while borrowed stack/signals remain live. | Three ASan and three TSan full fixture runs pass with production allocator/transport, including partial/full early failure. Generic harness changes remain D1-owned. |

Clean public-pin native build and lr/query-smoke pass on the documented merged
working inputs. B1's Helgrind report is still unresolved; current actual-object
LR TSan build is a distinct pending check. The full lane still needs locality
measurements, integrated budget adoption/useful scaling, final merged ownership
stress, browser/generation and leased publication/served verification. No passing
fixture closes those unrun gates.

### Admitted batch and observer receipts (main60741c51 plus A2 patches)

| Added path | Review conclusion | Evidence and remaining gap |
| --- | --- | --- |
| `scaffolding/tests/work_signal_observe.tower` | One real worker and explicit publication/release semaphores; payload remains stack-owned through join. Only successful caller wait/try acquisition differs. | Native and actual TSan pass both; Helgrind wait passes but try exits98 with2errors. Demonstrates this observer gap, not universal LR safety. |
| `scaffolding/tests/work_kernel_admission.tower` | Outer/extra grants precede dispatch; independent gated active count/barrier proves caller plus workers and bounds. Private256KiB scratch, nonfirst kernel field, empty/tail/serial cases, repeated batch/ordinary reuse, named callback rejection. | Six new-protocol instrumented executions pass (3ASan+leaks/3TSan), 16 rounds each. OOM-sensitive transport creation is not covered by this concurrent fixture. |
| `scaffolding/tests/work_kernel_profile.tower` | Frozen million-byte input, every result compared with the existing FIPS SHA256 reference. Private timestamps and thread IDs expose useful overlap/caller use. Pools open before measured work. | Nine alternating original/refill/batch samples; old2/4/8 lane medians48.763/24.566/14.607ms versus fixed46.108/23.315/12.247ms. One-lane90.698/90.079ms. Retention column excludes pool metadata/gate; document additional8B+32B on Linux. No wholecompiler claim. |
| `scaffolding/tests/work_kernel_overhead.tower` | Tiny integer jobs with checked independent formula after every dispatch, frozen worker/count/round sets and warm retained pool. | Baseline/fixed executables compiled; nine-pair timing in progress. No assumed tiny-job speedup or optimal grain. |

External A2 cache experiment `kernel_profile_summary.tower` is also Tower. It
parses all labelled samples, rejects malformed/duplicate identities, sorts each
field and reports min/median/max. This is evidence processing, not production
compiler state. Reserved identifier and unsupported sizeof(value) compilation
errors were retained, then fixed before reading the profile. B1 observer snapshot
reconstruction matches supplied hashes; exact-closure TSan execution is pending.

All WorkPool consumers were searched: ordinary host/work_dispatch reads the slot
callback; tests/work_named and backend/units exported named callbacks use their
own payload protocol and therefore cannot borrow a batch descriptor. Frontend,
backend and linker open_kernel callers continue ordinary admissions with their
original callback. Parser/semantic finite helper callers require grant adoption
by B1/A1; asynchronous submit loops remain their owners' responsibility. The
new pool layout requires rebuilding every imported host and caller object together.

### Imported scheduler source review (unchanged baseline6282238)

These are source conclusions for the shared dispatch boundary. A1/L2/L1 retain
production ownership and their pipeline acceptance; A2 does not duplicate that
implementation or claim their complete semantic coverage.

| Full path | Reviewed commit | Storage/access/lifetime conclusion and disposition |
| --- | --- | --- |
| `scaffolding/compiler/semantic_layout_kernel.tower` | 6282238 | Full file. Stable result component owns offset vector/error; published type/field layouts are inputs, coordinator publishes results. No graph/index mutation from kernel. Layout arithmetic depends on predecessor-ready valid alignment. |
| `scaffolding/compiler/semantic_flow.tower` | 6282238 | Full file. Read-only canonical tree traversal, result fields private; table query built before dispatch, ordinals restore deterministic demand/error order. Query ranges declared before tickets, all jobs join before graph completion. Shared-budget adoption is A1's remaining integration. |
| `scaffolding/compiler/semantic_generic_body_work.tower` | 6282238 | Full file. Clone receipt lives on owning instance, ordinary demand covers function/type consumers. Source-window and node budget bound retained stages. Explicit stage_hold precedes final pin close; stages publish/discard in deterministic batch order before finish. Kernel is not first record field, covered by new typed-projection test. |
| `scaffolding/compiler/semantic_iteration_work.tower` | 6282238 | Full file. One role per owning body; private inferred type/order/scratch vectors, lexical context restored from that body's initialization. All receipts reserved before dispatch. Type-index reads finish before coordinator interning/signature publication. Dynamic dependency discovery belongs to the ordinary checker. |
| `scaffolding/compiler/semantic_lowering_work.tower` | 6282238 | Full file. Work-kind anchor avoids leasing its own program-root anchor; function/parameter leases precede dispatch, frozen copied context has private scratch/diagnostics. All stages publish before aliases/index bookkeeping. Asked A1 to prove strong source ownership through close-before-hold or move queued-reference hold before final pin close; no demonstrated UAF claimed. |
| `scaffolding/compiler/semantic_execution_work.tower` | 6282238 | Full file. Derived executable clones remain ordinary Foundation entities; source identity retained through IMFunctionInput. Shared graph/tickets, root lease and frozen context precede a manual submit/refill loop. Join precedes publication/readiness. A1 must cap/reserve this manual loop separately and review queued-reference hold boundary. |
| `scaffolding/compiler/semantic_evaluation_work.tower` | 6282238 | Full file. Expression work/clone components retain per-subject ordinal; expression/function leases and declared read/write domains precede dispatch. Private lowering scratch and diagnostics; every failed/successful stage publishes after joins before aliases/finish. A1 owns hold-boundary proof and admitted-budget integration. |
| `scaffolding/compiler/semantic_known_work.tower` | 6282238 | Full file. Private scan/order/proof/patch vectors over canonical Foundation, no alternate constant evaluator. Immutable proof inputs and source ordinals govern publication. Packed replacement item/local indexes transfer only on coordinator after all readers join; traversal caches are derived. Alias/escape proof completeness remains A1 acceptance. |
| `scaffolding/compiler/interpreter_context_types.tower` | 6282238 | Full file. Invocation owns IMState/IMContext scratch/error/output; dependency and value/function inputs are explicit world/component metadata. IMValueInput carries owning declaration and ordinal rather than offset identity alone. Coordinator publishes readiness; evaluator borrows it frozen. L1 owns interpreter behavior. |

`semantic_declarations.tower` and `semantic_body_work.tower` exceed2,000lines
each: A2 reviewed component definitions and dispatch/lease/publication/pump
boundaries, not their full semantic implementation. An oversized combined read
was truncated and is not a complete-file receipt. A1 owns their full audit and
is preparing defining-type imports for compiler_kernels; A2 will review that
new shared boundary when delivered. No shared scheduling file is silently
omitted because its implementation belongs to another lane.

### Storage locality evidence (main21c2b43d, unchanged entities implementation)

New `scaffolding/tests/entity_locality.tower` was fully reviewed and compiled with
the public pin. It owns an explicit store, checks each traversal against an
independent ordinal formula, preserves survivor addresses, and checks zero final
entities/components before disposal. A read-only packed snapshot is derived
measurement data, not an authoritative replacement. SHA
dbdab851e48685ebc21b425cca2069aeadf2c9251beb56ca6af836469af109c7.
Three native checked runs pass; actual ASan+leaks also passes, along with existing
entity_pages/entity_tables/entity_stage_ownership (exact output0).

65,53632-byte payloads use1,024stable pages retaining5,873,664allocator bytes
versus2,097,152live payload bytes. Keeping one survivor/page leaves32,768live
payload bytes while retaining all pages. For4,194,304 row visits, median wall:
entity lookup21.528ms, type pointer index4.318ms, archetype pointer column5.262ms,
packed snapshot1.201ms; corresponding CPU21,532/4,322/5,266/1,202us. Snapshot
construction median0.942ms adds2MiB. Fixed method order and warm traversal,
three samples, Linux x64/public pin/default optimization, one executing lane.
Whole fixture wall0.151..0.169s/user0.086..0.101s/system0.016..0.022s,
peakRSS26,600..26,884KiB. Full/free page lifecycle remains stable; this is a
worst-case retention microbenchmark, not a measured compiler memory regression.
Actual compiler phase retention is requested from B2 before changing page reuse
or payload policy. Pointer columns must not be described as packed payloads.
This result supplies no alias optimization promise.

### Shared instrumented compiler and generic projection (2026-11-22)

At d284abce plus routed D1 cleanup, D2 compiler-budget/sanitizer and B2 world
patches, D2's shared native thread mode built the full compiler and all work/LR
objects. Three work and three LR executions plus query-smoke pass actual TSan.
All four memory archive members and explicit linked test objects are covered;
system LLVM, build-host tools and distributed guest resources are outside that
instrumented execution. Full compiler binary7027fda6c2d9aad9c0296bebf823e59d610c03d69010b703da61d4800de8a843.
Valid CLI body_continuation/decltype_lazy_body/imports run with jobs1/4 under
TSan and emit byte-identical canonical Foundation. Public-pin roundtrips print
0/0 and41,42,true respectively. The original final script incorrectly expected
numeric1 for bool and failed; the corrected expectation matches preserved output.
No compiler failure is hidden and no intentional sensitivity probe was repeated.
This freeze predates semantic/parser/unit shared-budget adoption.

Root/A1 reported generic dispatcher expansion as one contributor to their public
semantic-unit128MiB cap failure. A2 reduced compiler_kernel_dispatch_admitted to
its existing guards, fixed typed member projection and nongeneric work_pool_batch.
The single/serial loop now exists once in that shared transport; there is no new
scheduler, ABI/layout change or cap override. Reviewed source hash
f2e92744bfceeeb6626959f62f08d96cba0df258ec6fb9c29ed93ea43bccc144.
The unchanged admission fixture passes native and3ASan+leaks/3TSan, including
nonzero kernel offset, grants0/1/3, caller overlap, named-entry rejection and
ordinary pool reuse. A1 must independently establish aggregate compile-cap relief.

Nine alternating frozen before/after pairs preserve useful SHA work: one job
2.824574/2.824485ms;32jobs at1/2/4/8lanes90.091604/90.250187,
45.833451/45.565585,23.234449/23.228916,12.304186/12.072851ms.
After scaling is1.98/3.89/7.48x versus own serial, actual overlap2/4/8,
caller median16/8/4 jobs. RSS before2356..2668/after2328..2668KiB;
retained job/input/slot capacities unchanged, no new allocations. Tiny single-job
100kdispatch medians348.085/409.866us(pool1),367.472/467.158us(pool8):
+0.62/+1.00ns per call, overlapping ranges, explicitly recorded overhead rather
than a speed claim. Serial32x1000 remains50.749/50.720us. Parallel tiny-job
results remain approximately unchanged and still require profitable grain sizes.
Full CPU values, identities, environments and logs are recorded in the journal.

### Routed ownership boundaries and additional full-file receipts

Reviewed at a548dfb8 plus the named coordinator handoffs, all still separate
uncommitted owner inputs. A1 WorkBudget extraction preserves every enum value,
field order and algorithm; work_budget_types source hash
faa18b85e2d7c67bfc1f8fc8bf4cfe44d13681ca9adaaf0aa53dc956f2ed32dd.
B1 vector_reset source2e5fa2c9826c2a4e0f02a3659c237080b3571209dc9b152dac2cca7b1b64f0f6
uses complete default for exactly three existing fields after free. B2v2 bundle
2a1b4d89b9e01ccce40d23c22aeb3c4f37195e2b2f45a66b0ee426c374d8b93b
and B1 parser bundle12ed8cfc76fb5f79e4f9ba07b260d72163c5c41bdbe118578d626295f3c7e469
were read completely before applying. Only defining-type imports and preservation
of the newer release-after-publication comment were reconciled. No owner
algorithm was changed by A2. The later coherent-join receipt below supersedes
this first boundary checkpoint.

| Path relative to scaffolding | Full-file review conclusion and disposition |
| --- | --- |
| `library/work_budget_types.tower` | New defining module contains only the existing ledger/receipt/error/snapshot layouts and vector declaration dependency. Lifetime, serial diagnostic field and borrowed immutable gate remain explicit. No alternative ledger or type registry. Source fully reviewed; native/reference/concurrent tests pass after extraction. |
| `compiler/parser_workers.tower` | Full routed source. ParserAdmission distinguishes host/world capacity from extra-lane grant. Zero grant succeeds without live receipt; standalone worlds explicitly use capacity. Synchronous dispatch must drain before close; close cancels unfinished logical tickets then releases the active receipt. Retained pool grows only between exclusive cache leases. Parser heap bytes remain unaccounted, not silently capped. |
| `compiler/lr_first_work.tower` | Full routed source. Stable ECS job payloads borrow a frozen frontier/analysis and write distinct nonterminal results. Each wave reserves extras and all graph ranges/tickets before dispatch; coordinator swaps result vectors and builds next frontier after joins. Legal grammar fixed points do not imply scheduler cycles. Zero extras take ordinary serial computation. Upfront scratch cost before that decision remains an unmeasured admission cost. |
| `compiler/lr_state_work.tower` | Full routed source. Job components are allocated lazily only after useful-work and grant admission. Worker-private analysis failure flag and disjoint result slots; coordinator interns states/ordered transitions after joins, then resets revision before reuse. Scope defers retain grant through result publication and cleanup. B1 owns the measured grain threshold and end-to-end performance evidence. |
| `compiler/lr_runtime_work.tower` | Full routed source. Private row/goto/conflict outputs, deterministic state-order conflict selection and coordinator hash interning. Graph ranges/tickets and grant precede dispatch. Transferred rows/vectors are detached from cleanup; all remaining scratch drains/frees on failure. Explicit work executor still constructs private jobs/pool for a zero-extra grant; its cost needs representative owner measurement before changing policy. |
| `compiler/lr_work.tower` | Full routed source, both halves read. Closure/link/action/propagation use immutable grammar inputs and disjoint derived outputs, then ordered publication after joins. Closure tickets are all taken before batch dispatch. Propagation's unique destination index proves disjoint result headers; no noalias inferred from pins. Every phase's receipt survives publication; setup failure cancels outstanding logical leases after the synchronous helper drains. Grammar cycles are monotone fixed points, not work-graph cycles. |

B2's full14-path delta preserves old snapshots/receipts until all replacement
copies succeed and reserves exact new capacities before allocation. Backend
execution receipts now release after output/graph publication; denied exposed
LLVM output is destroyed before failed publication. The finite CLI256MiB default
is provisional and covers declared snapshots/targets/exposed objects, not all
compiler/LLVM heaps or RSS. The world wrapper fixture covers null/standalone,
empty/active/stale/foreign receipts and binding after historical identities.
Smallest LR4units, LR/world budget fixtures, frontend/backend units all compile
with public pin/jobs1. Full nested runtime acceptance still needs A1 semantic
callers and the coherent linked boundary; these objects are not merged-run proof.

L1's later trace refines the earlier queued-reference note: executable/evaluation
snapshots use sem_defer_clone -> sem_control_node -> entity_stage_create, without
copying provenance metadata onto the stage queue. A2 reread these exact paths.
Generic cloning instead calls compiler_node_copy_metadata_staged and needs the
explicit hold before the last pin closes. Current snapshots borrow the strongly
owned program/declaration tree through joined publication. No missing-hold defect
is established for those snapshot paths; re-audit if generic/provenance cloning
is admitted there. Body/lowering owner proofs remain A1's responsibility.

New `tests/work_budget_allocation.tower` is a complete reviewed fixture (hash
fe6f08420e7937439e90bad7fc8e03c407ea76a09b0d1d4e8f3d9d425352a8cd).
It checks first-entry and growth failure rollback, unchanged inactive output,
live receipt validity, allocation-free empty grants/free-slot reuse, stale copied
receipts and exact final buffer ownership. Three runs of16rounds pass with the
existing serial memory_instrumented/work_portable recipe, alongside the existing
worker fault sweep. This is allocation-failure coverage, not threaded sanitation.
No production algorithm changes; runtime profiling of the added test does not
measure a production before/after change. Bash wall3..4ms/user1ms/system0ms;
no peakRSS claim for this tiny check. Production ledger/profile/concurrency
measurements are separate. D1 owns future generic harness registration.

### Coherent owner join and additional scheduler receipts

Reviewed at a548dfb8 plus the coordinator's named source handoffs. The full A1
type/query/world/frontend split, ten semantic admissions, L2 generic admission,
L1 constructor/interpreter changes, B2 lowering and current B1 formatter are now
applied. Owner patches remain separately attributed working changes; this is not
a published commit identity. The external coordinator_integration_receipt.txt
records exact bundle hashes and prerequisites. Its missing consolidated L2
prelude and pending nominal-role fixes remain acceptance gaps.

| Path relative to scaffolding | Source review and ownership conclusion | Evidence/gap |
| --- | --- | --- |
| `compiler/semantic_context_types.tower` | Full defining module reviewed. Semantic entities remain authoritative; scope/lexical continuations, observation vectors, scratch and work graph are compilation-owned indexes. Shallow copies borrow many fields and need per-kernel private replacement. | Mechanical A1 boundary; component128MiB policy is not whole-process memory. Kernel isolation needs caller-specific review. |
| `compiler/semantic_declaration_types.tower` | Full module reviewed. Stable component owns ticket, declaration/frame capture, query reads, private error/scratch/stage and resumable discovery/admission state. | Type/initializer meaning remains A1; offsets alone do not establish capture identity. |
| `compiler/semantic_evaluation_types.tower` | Full module reviewed. One world-owned evaluation retains ordinary interpreter invocation, dependency pointer, aliases and aggregate leaves across suspension. | L1/A1 jointly own invocation lifetime; no second evaluator introduced. |
| `compiler/semantic_known_types.tower` | Full module reviewed. Derived proof work holds private ordered candidates/mutations/patches, with coordinator publication after joins. | Shared semantic payloads are borrowed; pinning supplies no write permission. |
| `compiler/semantic_source_binding_types.tower` | Full module reviewed. Proof facts identify the original declaration and owning query; pipeline retains jobs across suspension. | No copied runtime frame or duplicate binding authority. Publication only after applicable proof. |
| `compiler/semantic_constructor_types.tower` | Full module reviewed. Call/clone/alias/execute/ready continuation references the ordinary instance and evaluation component. | A1/L2 own constructor/cycle correctness; current nominal cycle failure is open. |
| `compiler/semantic_query_api.tower` | Full declaration boundary reviewed. Linked clients share defining types and the single production implementation. Context/program/world survive disposal drain. | No implementation fork or new scheduler. Exact linking passes current query smoke. |
| `compiler/semantic_layout_kernel.tower` | Full source reviewed. Stable result component owns offset vector; kernel reads published type layouts and produces size/alignment/error without structural mutation. | Layout payload is sparse/stable; ordered fields remain explicit. Kernel grain may be too small for useful parallelism. |
| `compiler/semantic_layout.tower` | Full source reviewed. Dependencies/access/tickets precede dispatch; disjoint completed layouts publish before work_finish unlocks consumers while unrelated jobs may run. Source-order task ordinal selects failures after drain. | A1 owns production. Initial ready frontier determines one grant for the whole pump: initial one-ready chain can leave later fanout serial. Measurement proposed, no speculative fix. |
| `compiler/semantic_execution_work.tower` | Full source reviewed. Executable snapshots are derived Foundation entities. Frozen context is copied, mutable scratch/diagnostics replaced, root leased before dispatch; all stages publish before ready inputs/work_finish. Grant survives joins and publication. | Strong source tree ownership supplies snapshot lifetime; this clone path does not queue provenance holds. Final merged concurrent failure/cancel checks remain open. |
| `compiler/semantic_generic_body_work.tower` | Full source reviewed. One ECS clone executor handles function/type instances; node budget bounds each wave. Grants/tickets/stages precede dispatch. Queued references are held before last view closes; accepted stages publish, failures discard, then tickets finish. | L2 generic admission included explicitly. Node quota is distinct from declared-byte/RSS ledger. No second AST or clone scheduler. |

The following additional complete source reads use04a87781 plus the subsequent
nominal-identity/readiness/signature handoffs. They audit shared scheduling and
ownership; A1/L1/L2 retain production semantics and independent acceptance.

| Path relative to scaffolding | Source review and ownership conclusion | Evidence/gap |
| --- | --- | --- |
| `compiler/semantic_evaluation_work.tower` | Stable preparation component owns private scratch, aliases, diagnostics and stage. Expression/function leases and every ticket precede dispatch; frozen context copied per worker. All stages publish before observations/results finish; failed generated nodes remain program-owned for cleanup. | Full185-line source read. Current clone source roots stay strongly owned; adding staged provenance requires renewed hold audit. Final concurrent failure/cancel evidence pending. |
| `compiler/semantic_iteration_work.tower` | Protocol resolution is embedded in the owning body's stable work component. Only one role per body runs. Workers consume published source types, retain private inferred type vectors and lexical scratch; all type-index read claims finish before coordinator signature publication. | Full197-line source read. Role/ordinal, not coincident frame offset, identifies ownership. No worker interning or second protocol scheduler. |
| `compiler/semantic_lowering_work.tower` | Stable per-function results register body/snapshot/signature dependencies. Function/parameter leases precede dispatch; private generated names/errors/aliases. Every stage publishes before cross-function bookkeeping or query completion. | Full253-line source read. Compatibility wrapper finalizes only its complete phase; pipeline callers use the waiting pump. Lifetime pins are not write permission. |
| `compiler/semantic_flow.tower` | Read-only traversal of lowered canonical operations, not constant folding. Archetype pointer columns build a private source-ordinal job index before dispatch. Tickets/grants precede work; joined validation publishes deterministic diagnostics and finishes claims. | Full198-line source read. Bounded recursive depth is explicit; table rows remain derived pointer indexes. Runtime control/diagnostic matrix currently blocked by unrelated nominal fixes. |
| `compiler/semantic_known_work.tower` | World-owned analysis components contain private candidates/mutations/patches and replacement vectors. Frozen source traversal collects query observations; a retained ordered frontier admits later independent work while earlier producers wait. Coordinator alone attaches facts and swaps compacted indexes. | Full359-line source read. Graph result publication precedes grant return; later ordered patch application consumes those owned results. Program semantics stay on Foundation entities. Grain/scan allocation overhead remains unmeasured. |
| `compiler/semantic_capture_work.tower` | Coordinator continuation waits for source-binding proof and exact checked initializer producer. Captured value records retain owning declaration/frame and ordinal; ordinary interpreter evaluation supplies value. Suspension precedes producer work, and checked initialization is reused once. | Full153-line source read. Mutable/escaped/missing initializers fail explicitly. No worker blocking or offset-only capture identity. |
| `compiler/semantic_type_execution.tower` | Executed interpreter requests map to the same WorkGraph. Owner/world/sequence/revision/profile/dispatch, exact invocation request address and actual suspension edge are validated before publication. Type interning remains ordered coordinator work; layout waits suspend the continuation. | Full243-line source read. Private component stores a continuation, not another type registry/folder. Existing stale receipt tests passed in the earlier query freeze; latest ABI/resource runtime still pending. |
| `compiler/semantic_query_pipeline.tower` | Joins each phase frontier, combines progress/waiting/failure, and services cross-phase producers before the owning caller diagnoses quiescence. Layout errors remain on their owning receipts for deterministic selection. | Full53-line source read. No independent scheduler or early cycle diagnosis here. |
| `compiler/semantic_body_work.tower` | Complete current source read in contiguous spans. Stable work components own lexical/control cursors, preparation phases, frames and checked-prefix generations. Workers replace shared scratch with private buffers; suspended scopes transfer ownership after joins without replay. Tickets and leases include generated control blocks. All stages publish before observations, type identities and cross-body bookkeeping; all reader claims suspend before coordinator preparation. | A1 primary owner. Original syntax discovery chooses eligibility only; executed staged dependencies remain interpreter-driven. Ordered diagnostics wait for preceding continuations, and cycles are selected only by owning-pipeline finalization. New implicit type/signature readiness hooks require current type/control/concurrency checks; source review is not universal race proof. |
| `compiler/semantic_declarations.tower` | Complete source read in contiguous spans. Stable declaration components retain discovery and execution tickets, lexical capture identity and private scratch/stages. Every stage publishes before coordinator structural continuation; grants span graph publication and release before nested layout work. Source-order failures wait for preceding eligible producers. Nominal identity and layout completion now have separate obligations. | A1 primary owner; reviewed04a87781 plus routed nominal identity/readiness/hooks, source6083aaa709ea8e6f61be5459c6d7eb3cf98fac94ec6c494be3a81ead2a694eb9. Syntax walks choose admission; they do not authorize effects from untaken interpreter branches. The ordinary recursive constructor correctly reaches an interpreter limit; D1 owns correction of the stale graph-cycle test oracle. Genuine dependency-cycle coverage remains required. |
| `compiler/semantic_work_ids.tower` | Complete defining module read. Named query/access domains identify the same graph; fixed preparation windows bound retained private stages independently of worker capacity. Progress/waiting/complete/failed pumps explicitly require owning-pipeline quiescence before cycle diagnosis. | Source5e4b4e028e25d4f91606fed87266ae999745e79cf8174fd77492e19e78244597. A window is neither worker entitlement nor a byte/RSS limit. No second scheduler or global registry. |
| `compiler/generic_body_types.tower` | Complete defining module read. Small derived worker descriptor borrows canonical context/node and private stage, with explicit copy quota, count and success. It owns no second AST or shared mutable index. | Source716bdc88f70d7f037cf1ee869b62d86b4ec69ea3b98a1aef6f5b5f28b0e95988. Lifetime and publication follow the fully reviewed generic-body caller, including queued-reference holds. |

The first coherent build rebuilt42 affected native steps and7 work/LR steps with
the documented public pin, jobs1/outer2, CPU12-23/24GiB. Work and query smoke pass.
Type smoke aborted on a nominal constructor treated as a runtime value; the
unbuffered diagnostic is preserved. Applying the exact A1 nominal-expression
frontier compiled the smallest lifecycle and affected semantics/native link;
query smoke passes again. Control smoke now reports the known recursive nominal
identity/layout cycle in query_type_record/query_type_alias. Later suites did
not run in those fail-fast scripts. No type/control acceptance is claimed.

D1's focused_registration.patch was read and applied after jobs drained. It only
wraps existing fixture entry points and registers ordinary checks/opt-in profiles
through the existing object/runtime rules. Defining-type imports are preserved;
historical unsafe probes are not registered or rerun. Current linked execution
is recorded separately from D1's handoff evidence.

### Real parser retention attribution

B1's exact parser_retention.tower and raw host/owned-world CSV were reviewed.
At512rows, iteration10->11 adds one buffer and one56-slot component page while
entities2048/components2047/cache entries2 stay fixed. The observer enumerates
actual unique pages outside timing; its private index is disposed before the
next iteration. Full isolated-world teardown restores the initial buffer count.
Source f0033081ec3a8623b01d0ecc38c4d00e3f92b436b50c6ef57a4e2cb7086c4688,
binary2790d0c7e3b693413c2c77235fbf80014aa82d6147b34efc908fc576c18cd50d.
These are B1 serial allocation measurements, not A2 threaded sanitizer results.

The actual entities.tower allocator was reread: A=max(type alignment,pointer
size), stride=align_up(payload size+pointer size,A), slot=stride+component header,
C=min(16384/slot,64). Paging is used only for C>=2. Requested page bytes are
page header+C*slot+pointer size+(A-1). Used slots grow monotonically; a full page
detaches from the allocation pool. Every last-component release frees its page.
At joined/published/discarded quiescence each retained page has at least one live
component, hence per-type page count<=pooled live components. Store counts omit
unpublished private components, so the bound cannot blindly use store counters
while stages are live. Requested bytes also differ from allocator usable bytes.

D1 received this source-derived bound for its oracle: attribute buffer deltas
to actual page allocations, preserve stable entity/component/cache ownership,
and require exact final teardown. Flat page count or an arbitrary extra-page
allowance would not model this stable-address allocator. No production allocator
rewrite is justified by this bounded retained page alone. Documentation of this
receipt changes no runtime behavior and requires no before/after runtime profile.

## Current layout and concurrent stage evidence

The full current library inventory remains 27 files. Shared compiler filename
search finds compiler_kernel/compiler_kernels and library compiler_work/types;
the two similarly named test files are test coverage, not missing production
schedulers. Complete additional imported-pump review:

| Path relative to scaffolding | Source review and ownership conclusion | Evidence/gap |
| --- | --- | --- |
| `compiler/semantic_evaluation.tower` | All 478 lines reviewed after the required-stage handoff. Stable world-owned evaluations retain private interpreter state, aliases and errors. Tickets precede dispatch; input view survives joins; the coordinator publishes values/aliases, then finishes/suspends receipts before releasing the grant. Executed function/capture/type requests use the existing graph; optional inference retains proof/clone/body prerequisites. | Source d6a1e37119c4e57a957a49a857926b47d5bca1d10fa537690b28fa2302b60f39. A1/L1 own semantics. Query smoke passes and full constructor runs output0 at jobs1/4; control smoke currently reports an uninitialized local. No full semantic acceptance. |
| `tests/layout_frontier_profile.tower` | Own opt-in measurement invokes the actual layout pump with canonical ordered fields and one shared caller/worker ledger. Checks every field offset, size, alignment, completion and teardown. Cold and pre-opened pool modes distinguish startup from pump cost. | Source a72e2c09868f80e4290b162c34ee89d59c203d7054153f18f52644f1a981f6e9; three paired runs pass. Results below are microbenchmark evidence, not packed storage or whole-compiler speed. |
| `tests/entity_stage_concurrent.tower` | Own focused test uses the production allocator/transport, pre-dispatch graph tickets/access and exclusive entity leases. Private stages queue references to a zero-reference pinned input. Workers drain before holds/view close/publication; finalizers run on the store's explicit coordinator context. Covers publish, cancellation/stale tickets, worker failure, name collision and partial admission. | Source26265ebb52427481465d0fe88101e4ccded781e356be71cc9244b84d5882f0e7. Three native, three ASan+leak and three TSan executions pass with current regenerated guest runtime; no deliberate invalid-memory/race probe. This closes focused concurrent stage cleanup coverage, not all compiler caller lifetimes. |

Warm-pool wide-frontier medians from three samples (32 branches, same checked
input per worker comparison):

| Fields per branch | 1 lane wall / CPU ms | 2 lanes wall / CPU ms | 4 lanes wall / CPU ms | 8 lanes wall / CPU ms |
| --- | --- | --- | --- | --- |
| 8 | .005390 / .007 | .130846 / .150 | .503067 / .684 | .628629 / .891 |
| 1024 | .518945 / .521 | .630783 / .859 | .842407 / 1.417 | .909990 / 1.538 |
| 4096 | 4.593843 / 4.599 | 3.778017 / 5.723 | 2.847308 / 6.170 | 2.845794 / 7.287 |

The largest case gains about1.61x at four lanes and no useful additional wall
improvement at eight. This unusually large-record workload does not justify
parallelizing ordinary small records. The chain-to-fanout case reserves zero
extras throughout; at4096 fields/8-lane capacity it takes4.640724ms warm versus
2.845794ms for the different wide graph. That comparison identifies a candidate,
not a before/after speedup on identical input. Proposed to A1: preserve a grain
threshold and consider refreshing grants only at a joined/published frontier
when substantial newly ready field work exists. Production change awaits owner
agreement and equivalent-input measurement. Pool peak is admission only.

Process RSS for the large profile is about140,400KiB (~137MiB); it is a
high-water value including graph creation and prior cases, not live pump memory.
The profile has fixed case order and three samples; no precise allocation census
or cache-counter/false-sharing attribution. These limits prevent broader claims.

Concurrent stage runs each execute160 trials (16 rounds,2/4 workers,5 outcomes),
57,792 finalizers, distinct simultaneous worker IDs at a barrier, exact ordered
published child values and zero final store/component counts. Native wall
.102..103s, reported process CPU95.625..95.960ms, peak RSS1372..1652KiB.
ASan+leaks wall.270..277s/CPU315.022..316.082ms/RSS61236..61900KiB;
TSan wall.254..270s/CPU243.653..255.330ms/RSS25724..26184KiB. Instrumented IR
covers199 fixture/imported library/transport functions plus47 guest-runtime
functions, including the production allocator. No serial failure counter is
used. The ledger counts the coordinator plus worker permits through publication.
Source-level UBSan and universal race freedom are not established.

The first fixture build had duplicate main; --library then exposed mutable
module initializers. Both failed before execution. Corrected to the established
object/no-entry guest-runtime link and explicit store-owned StageState. Native
and instrumented runs then passed. A stale guest-runtime resource receipt was
noticed and regenerated through tower-guest-work-tests before repeating checks;
IR changed, native/instrumented object and executable bytes remained identical.
Exact commands/hashes and logs are in the journal and A2 cache. Generic harness
registration remains a D1 request. These are test additions with no production
runtime behavior change; timings characterize coverage cost, not an improvement.

Additional full source reviews completed at85aafd8e plus current owner handoffs:

| Path relative to scaffolding | Storage, scheduling and ownership conclusion | Evidence/gap |
| --- | --- | --- |
| `compiler/semantic_lifecycle.tower` | Whole module read. Explicit program/context owns graph, scratch and phase components; program vectors are derived indexes over world-owned nodes. Synchronous pumps precede disposal; body cleanup requires running0/stages null, then shared pool closes before interpreter/scratch disposal. Formatting uses its own temporary context. | Source a99398aa88b46374a5d055aaf5b89546ee80ed4384bfb8a2d8fc35b125d3fb99. Node quota bounds Foundation component count, not total memory. A1 owns semantic phase ordering. |
| `compiler/semantic_context.tower` | Whole module read. Workers append observations only to private query-read logs; coordinator attaches them after joins. Component kinds derive from node world. Legacy core/tower-node declarations are boundary APIs, not a new registry. Shared receipt helper counts extras beyond the caller and requires idle transport before admission/release. | Source3fc634dc85ac9d8f6d5ade0236429a80a701917b7e23f85386ebc5d47bad4d49. Private editor descriptors borrow lexical owners until joined publication. Capacity differs from current permits; null-ledger standalone behavior remains explicit. |
| `compiler/semantic_source_bindings.tower` | Whole module read. Conservative lexical mutation/escape proof binds original declaration identities, parameters and shadows. Unknown extensions/depth truncation cannot prove immutability. Workers own scope/scratch/candidate vectors; graph-owned proof joins them before coordinator component publication. Specialization cannot silently invalidate already-consumed facts. | Source b5c142a24f8c0e1c0ec60f4ce986bebd54288003899988d1b250c5404720407d. Scanning possible mutations in branches is conservative proof analysis, not execution of staged effects or discovery of untaken value dependencies. |
| `compiler/semantic_known_bindings.tower` | Whole module read, then paired input-role patch reviewed. Immutability, initialization order and known value are distinct facts. Joined scan/order/input/clone receipts precede lowering; optional evaluation uses the ordinary interpreter. Mandatory-input eligibility preserves lazy arms; final replacement/storage publication is coordinator-owned. Optional known input now writes only known_producer, preserving the mandatory capture role. | Current source4d8b8ec4454288b06dc93a152cb4b39b9f9c1fd36f0f5359bb4abf9f711c058b supersedes a938eceb. Paired L1 interpreter/A1 publisher ABI rebuilt; control smoke and constructor jobs1/4 pass. Early unfinished capture and full semantic gates remain open. |
| `compiler/frontend_units.tower` | All637 lines read after B2v2/source bounds and A1 API boundary. Stable coordinator components own separate unit worlds/modules, exact immutable snapshots and receipts. One synchronized ledger spans outer jobs and nested phases. Reserve before dispatch; accept joined graph result before releasing execution. Cancellation drains shared pool/continuation before input view close; close rejects active backend borrow and destroys worlds before ledger. | Source aadc2c0c434dcb0b5cfcc3378fe28025a32d98dbb189cfbc033e3b8548d96d08. Supersedes baseline static-floor-division row above. Snapshot replacement reserves both old and new bytes until commit, rejects embedded NUL at exact offset, preserves old inputs on failure. Declared bytes omit parser/semantic/foreign heap; this is not a process RSS cap. Observer synchronization belongs to its frozen callback owner. |
| `backend/units.tower` | All506 lines read. Backend jobs extend the same unit entities/WorkGraph; immutable Foundation views and private LLVM contexts/modules/results. Streaming shares frontend transport/ledger; standalone owns its ledger. Output retention and work_finish precede execution grant return. Cancellation drains, settles unused logical tickets, closes views, then releases execution; retained bytes survive until backend destruction. | Source735cc2a08bbf069139f085ce7dad0d12577d75ec76394fc414af4796b0ba0884. Old backend pass predates latest semantic freeze; D2's old-input TSan internal overlap deadline is a failure, not a sanitizer pass. LLVM internal arena capacity is unknown; object length is accounted only when foreign emission supplies it. No alias promise follows from the Foundation pin. |

## Current input-role and parser-grain join (2026-11-22)

Reviewed paired L1_value_input_roles (4de1c040), A1_input_role_publishers
(5f0842f5) and A1_executable_lowering_receipt (b4ae376f), then rebuilt the full
changed ABI closure. Required capture producer/owner/ordinal and optional known
producer coexist on one world-owned IMValueInput; they are distinct roles, not
competing authoritative values. Declaration-frame validation remains explicit.
Executable work snapshots completed prepared/lowered receipts before dispatch;
workers do not infer them by racing mutable semantic state. Existing aggregate
signature cloning remaps the result parameter and avoids a second lowering.

| Reviewed changed path | Ownership and evidence |
| --- | --- |
| `compiler/interpreter_context_types.tower` | Source485ca21df83f93f2863bf9dc3e0139aa78b32e4900e796dc240fc4cda7b394a2. One added known_producer field changes shared ABI; no stale dependent object was reused. L1 owns interpreter semantics. |
| `compiler/interpreter.tower` | Source910919c5f2bf276ab412353eb8f2a233fcf8f5a72a80c710de748df383b9d541. Changed input-role and local-frame paths reviewed against L1 handoff; this is an interface review, not a claim of full interpreter audit. |
| `compiler/semantic_capture_work.tower` | Source00bfa4b91a91207770653056328680c6e2f221ec36bbf32bce99b9fdbeb752ea. After its prior full review, checked the publisher delta: initialize only new input components, update required role fields without clearing known_producer. Publication remains after joins. |
| `compiler/semantic_execution_work.tower` | Sourceaaff4245b3e1ceb3e9ff43e949a78d5ef2eb5057524fe47cb4ced8e32d3116a6. After prior full review, checked prepared/lowered receipt snapshot, query-read recording, existing-signature cloning and result remapping. Private snapshot/lease ownership remains unchanged. |
| `compiler/lr_state_work.tower` | Sourcee3c0776fdb1cb4703cfedeefa84758cbbbc334cf20a8dfa274994dbc9b802639. Full refined owner delta reviewed after earlier whole-module audit. Coarse grain65536, refined grain32768 only with at least four coarse chunks, limited by available shared capacity. Allocate private jobs/pool only for a profitable frontier. Jobs, graph and canonical output remain authoritative; no new scheduler. |

B1_parser_budget_refined.patch (836fee7f) replaced the complete older parser
bundle. Reversal initially rejected our two defining-type import additions and
an EOF blank in lr_budget. A private patch materialization plus exact diff showed
only that whitespace difference; imports are now supplied by the new bundle.
Both full reverse-check and new apply-check passed after reconciliation. No owner
implementation or assertions were discarded. Serial-chain/medium-frontier tests
check that no hidden job entities are created; large frontiers retain actual
barrier overlap checks. Current LR suite passes. The grain change still needs
B1's equivalent-input profile receipt; this audit makes no uniform speed claim.

Current public-pin native rebuild passes53 steps; LR/formatter pass7 more steps.
Compiler35ef2ed4302a2da8de17fd20ba662487698a6f0af25510cee8170c5c0a40b305,
LR d31af4e3c6b5a4c5451f7e6cf217b7328ac201f05887444cfd9dd0b1721080a0.
Query, control, LR, unit and backend checks pass; unchanged constructor outputs0
at jobs1/4. This resolves the previously recorded control uninitialized-local
failure. Type-smoke still awaits D1's recursive-call diagnostic oracle; full
semantic/capture, current sanitizers, browser, generation and publication remain
open. These elapsed validation times are not isolated before/after performance.

Formatter replacement e51e5db8 leaves production format_foundation unchanged
(b38f850b) and adds consolidated-prelude goldens/derived extents. Exact formatter
checks pass on its intentionally serial fault-injection transport. Root then
identified that the full bundle omitted parser_main's existing resource argument.
Restored precisely those old owner hunks; checked all three callers. Aggregate
parser main was not in that passing LR/formatter run, so its compile/runtime gate
remains separate. Corrected sourceaf80689f132099908e420b369ea5bade726206d2ee201e4eeac9f12ee8855fc4.

Additional WorkPool caller discovery: all four linker job modules and the browser
LLVM transport below were read completely at85aafd8e/current handoffs. They are
B2 production ownership; no cross-owner edit was made. Their local WorkGraphs
reuse the common scheduler and are derived over explicit link-world entities.

| Path relative to scaffolding | Storage, scheduling and ownership conclusion | Evidence/gap |
| --- | --- | --- |
| `backend/elf_link_jobs.tower` | Stable component jobs borrow frozen object/DSO/symbol metadata and disjoint reserved output ranges. Graph access claims and ticket precede submit. Private errors are selected in source order after all jobs, so finishing a transport task successfully does not assert semantic relocation success. Reverse defer order drains before view/job/type/graph destruction. | Source61e803a246a46130c7f39c58aa730fe99fe9118b6a1e477824156af69ecb97e9. Standalone link.workers ceiling, no borrowed WorkBudget in this API. Pool peak measures admission. Link cancellation stops admission and drains; output publication belongs enclosing successful image construction. |
| `backend/macho_jobs.tower` | Same explicit store/job ownership and pre-dispatch ranges. Input domain covers frozen bytes/symbols/layout; job domain owns per-object compact-unwind/fixup scratch. Output claims exclude compact sections handled in the later serial unwind phase. All exits after pin drain workers before reclamation. | Sourcee07101be93fc77600997803093e387ec7a3405d8f97f8dfa05b5dbbe1f89c6a2. Private job diagnostics, source-order selection after join. Actual Mach-O host execution is not established by this source review. |
| `backend/pe_link_jobs.tower` | Frozen object/section sources and resolved symbols; private job diagnostics, disjoint section copy/relocation ranges, one stable component per object. Graph tickets precede submit. Cancellation/failure returns through drain-before-view-close defer. | Sourcefc821e38b3766aecba3453c7eacd948dde448183488559a30f44128cb0e6856c. Windows transport execution remains separate coverage; pin alone is not output exclusivity. |
| `backend/wasm_link_jobs.tower` | Coordinator collects packed copy descriptors/offsets before dispatch; their borrowed bytes, chunk metadata and section allocation stay frozen until join. Worker shallow link copy owns only private diagnostics. Cost/grain partitioning uses common WorkGraph/WorkPool, with pre-dispatch output intervals. Persistent pool may grow from serial only after an earlier run has drained. | Source5955dea0ff81f0dde0359edcc161db535a7f0112e00c018ccd540c427995d538. Serial path copies/relocates inline. Error source order and cancellation draining explicit. Pool startup, real overlap and job-grain profitability need B2's linker evidence; admission peak alone is insufficient. |
| `host/llvm_worker.tower` | Whole module read. Legacy default-world boundary attaches named llvm.transport state to its worker world. Explicit BackendSource sessions are separate. Compile borrows supplied environment or owns a temporary completion lease through synchronous compilation; returned diagnostics/output remain worker-state borrows. Runtime bytes are decoded once and retained for worker lifetime. | Sourcef723f0a83f7006c6a77937a63c3325c361f3969cfb4f24b45feeec06e93026e3. No component finalizer or explicit transport-close API in this module; whole worker/VM lifetime is the stated contract. Reusable world teardown must not be assumed without B2 proof. Browser trap/cancellation validation remains separate. |

Reviewed enclosing ELF/Mach-O/PE/Wasm link entrypoints and the unit-driver
compile-to-link boundary: driver_units waits for backend_units_step completion
and checks both frontend/backend failure before starting link. Thus this observed
caller does not overlap linker workers with its active compiler jobs. The link
APIs themselves accept a separate worker ceiling and do not borrow the session
ledger; embedding under an unrelated active pool requires an explicit caller
budget contract. This is a review limitation/request to B2, not a demonstrated
oversubscription defect or authorization for another budget framework. No new
linker performance claim is made.

| Additional measurement path | Review and limits |
| --- | --- |
| `tests/frontend_units_profile.tower` | Whole B2-owned fixture reviewed, source2e4b84e4bb341ef3aeaddb205aea5b91e962207762c57e08921bc5e061e63b50. Fresh unit worlds, immutable exact-length snapshots, one final large body unit plus small siblings, shared budget. Clock/CPU/RSS end before independent answer42 invocation and canonical hashing; retained bytes and ledger state sampled after joins. Observer spans are private per ordinal and read only after completion; outer overlap derives from recorded intervals, not queue width. Backend mode validates ELF envelope/retained byte count but does not execute every emitted body; it is not a C-toolchain superiority comparison or precise live-heap census. No new A2 execution result is attached here. |

## Current production ASan milestone

Fresh documented public-pin address-mode build completed at21:49:29Z, container
exit0/PID0. Compiler34a144cb31fe6c24a5182dd8beef7625cc2962317fe92644935d33b31e051c52,
LR c035d3894265f93aeb925177876749a43071132a7e69cd7655a4aba58a208eb2,
configured manifest8f9bde9435812eadb38c684aadce856c47bb585cb99f1b988897f3c742772949.
Eight focused checks pass, zero skips; query/control/LR/units/backend pass with
production allocator and real worker transport. Constructor outputs0 at jobs1/4.
ASAN_OPTIONS=detect_leaks=1:halt_on_error=1; no suppression or repeated unsafe
probe. Backend's actual overlap and cancellation assertions pass within unchanged
deadlines. This supersedes the older partial ASan caller coverage for this exact
input-role/refined-parser snapshot. Incoming reachability changes are not yet
covered; TSan/current full execution/browser/generation/release remain open.

Address-mode elapsed validation (one sample, not a performance comparison):
query .429s, control256.241s, LR20.003s, units147.352s, backend392.737s,
constructor jobs1/4 9.111/7.650s. Control RSS observation828024KiB and backend
1082148KiB are point samples, not process peaks/live-byte census. Shared-library
LLVM is not rebuilt with ASan; source-level UBSan and universal race freedom are
not established. Exact recipes, source hashes and limitations are in the journal.

## Runtime-index interface review after c7c30cd6

| Newly reviewed full path | Storage, world and ownership conclusion | Source/evidence |
| --- | --- | --- |
| `compiler/foundation_nodes.tower` | Whole module read. Payload init/dispose owns vector allocations; semantic edges remain world-owned graph relations. Prepend handles an interior source by preserving its offset across reserve/shift and checks its live bounds. New execution predicates select runtime roots and call/function-reference bindings for derived consumers; they do not erase canonical declarations. Attribute identity uses bound type entities. | Source7ce41fc04aaac90415ceddd508edc54c5480d9836934edb194a84caaac18e7a4. L1 owns production; smallest public-pin unit passes. No noalias guarantee or serialized address identity. |
| `compiler/type_objects.tower` | Whole module read. ABI checks walk completed signature/field producers with private pending/visited vectors; recursive nominal records are visited once. Runtime type detection shares Foundation execution predicates and tracks function cycles privately. Type-value interning copies descriptors into an invocation-owned vector; integer indexes never become global type identities. Canonical records remain borrowed from the owning graph. | Source0b09c88ad1f1e9d5cbcbcd23beceb0dcf56003df89f7542a4f13583597b4b950. L2 owns production. Visited lookup/interning remain linear; no unmeasured speed claim. Caller must keep referenced world alive and not mutate signatures during read. Current full type/reachability execution is pending at this receipt. |

L1 full bundle was applied only to16 missing paths after exact reverse-check of
five already-held production paths; full bundle now reverse-checks. L2 consumer
and retained-runtime fixture, D1 recursion oracle and derived array count followed.
Four defining work_budget_types imports remain. No other lane's changes were
committed as A2. Source changes are owner-attributed pending merged publication.

The joined native run completed21:55:13Z, exit0/PID0: full types, semantics,
core-static, query/type/control smoke and rejection suites pass. Constructor
jobs1/4 both return0 and emit identical canonical Foundation
1d52fae5eb4b8752f26af714a51fc2cd92488f9f6821391c9251be98ef26c09c;
recompiling that Foundation also returns0. This completes the previously pending
normal reachability test receipt for compilerbfaedcad0dbb6eb0ce91bab6fc18b344dc090d5303e76ffc8f8695ec9253c884.
It does not extend the older ASan snapshot to these changed traversal paths.

Validation correction: after this run, copying B2's current backend fixture
preserved an older file timestamp. The next native build did not regenerate its
LR entry object. Its passing backend result therefore does not cover that newly
copied helper. Likewise LR's editor selector runs editor_units, while the changed
editor_observations belongs to tower-execution-tests. Direct smallest-unit
compiles did pass; affected native runtime checks must be repeated using fresh
objects and the correct entrypoint. Raw earlier results are preserved. A fresh
TSan cache compiled the current LR source; its nine focused concurrency checks
and query smoke pass so far, with the other caller suites still running. No full
current TSan acceptance or publication claim follows from that partial result.

Rechecked the complete shared coordinator and kernel modules at this merged
snapshot. The exact identities and disposition below supersede the initial
caller-review gaps without changing their APIs.

| Path relative to scaffolding | Current ownership review | Source/evidence |
| --- | --- | --- |
| `library/compiler_work.tower` | Entire module reread. Ordered unit children own recipe identities; join dependencies and access ranges are reserved before taking work. Unit dispatch is exactly once, so reconstructing dispatch1 is valid only for this API. Revision/profile/duplicate/cancelled receipts are rejected. Failure settles the source-order diagnostic prefix; done does not promise later transports have drained. Close owns metadata reclamation, while executor close must drain first. | Source d75b53b62cba1773735fb73f4114cb992683f0fa8f9e88ea4eda76024f32b297. Reviewed current frontend cancel/receive/close and backend attached/standalone cleanup: invalidate, drain, settle/unpin/release, then destroy worlds/coordinator. Existing compiler_work test covers stale and failure order; compiler_work_owner exhausts constructor allocation failures on serial instrumentation. Current units/backend ASan covers actual caller transport at its separately recorded snapshot. No new defect demonstrated. |
| `library/compiler_work_types.tower` | Entire defining module reread. Stable query/domain constants are internal graph namespaces. Callback descriptor borrows a pinned payload; execute runs on its admitted worker and receive remains coordinator-owned. This split is not a transferable entity owner or resumable ticket. | Source4722bb941550f1076c0a13e8e85a14a294574dfa67e5bd8853790daf6b141572. Frontend releases execution grants only after receipt acceptance; cancellation drains without publishing stale callbacks. |
| `compiler/compiler_kernels.tower` | Entire dispatcher reread after A1's import-boundary handoff. Every tag routes to the existing semantic/parser/unit kernel; the ordinary interpreter uses a bounded1024-step quantum. Exact extern unit ABI avoids importing its implementation into semantic compilation. No admission, lease release or structural publication is hidden in this dispatcher. | Sourcece1d9d759900c1bffdfee9917499b78d055e95366ff213a0cf18508c273d96ba. Invalid kind traps; eligibility and typed payload lifetime remain the owning pump's obligations. Current native/query/type/control/units coverage and separately identified sanitizer snapshots apply; no universal race claim. |

This additional source review and correction are documentation-only. No runtime
algorithm changed, so an additional before/after runtime profile is inapplicable.

The current TSan aggregate stopped at type smoke: timeout exit124 at22:12:15Z,
600.036wall/656.452user/20.295sys, container PID0. The test log is empty, with no
sanitizer diagnostic or successful completion. A preceding observed RSS715048KiB
is only a point sample. Query and nine focused passes remain valid; control, LR,
units, backend and constructor were not run after this fail-fast termination.
CPU activity does not locate the slow case or prove absence of a deadlock in
another thread. Preserve this failure and request D1's case-level attribution
through existing fixtures; do not relax the deadline or relabel it a pass.

## Current caller failure and pending handoff review

Fresh native LR6d94c04e34b11b267f7ce938a269513be14af3da626b56c4a70501aa61600441
contains B2's new backend helper and passes the full backend suite. The correct
editor-observation runner09e015d2cd054b9f0fdace7619c69f42f43a6cc23600e0d83f94c1800e2ed126
fails134. A private Tower/Linux abort backtrace over unchanged test/compiler
objects locates semantic_body_kernel's requirement that sem_function_begin
succeed. That function legitimately rejects noncontaining editor declarations;
its admission caller needs A1/B2 investigation. This agrees with L1's independent
trace. No test oracle was weakened and no semantic production file changed here.
Exact commands, failure timings and diagnostic artifacts are in the journal.

The continuation using the same current TSan binaries passes constructor jobs1/4
(both output0) and actual threaded LR. Units/backend/control remain pending at
this receipt; type timeout remains a failure. These narrower passes do not close
the editor or complete current sanitizer gates.

| Incoming path / handoff | Review and disposition |
| --- | --- |
| `tests/parser_benchmark.tower`, D1 patch19da2e17 | Complete patch reviewed against entities.tower allocation formula. Private observer walks actual table rows/components, including full pages detached from allocation pools; validates component owner/world, page type/stride/capacity and observed live count. Samples buffer count before observer allocation, disposes scratch outside timing, keeps cache pointer identities and nonpage-buffer count stable, then requires exact session/world teardown. Requested bytes differ from usable heap/RSS; total requested/live ratio includes individual allocations. Serial instrumentation is asserted. Ready for adoption after frozen tests; D1 normal/stress passes are owner receipts, actual ASan still pending. |
| `compiler/semantic_capture_work.tower`, candidate0d04fe88 | Whole four-file candidate reviewed, not applied. Metadata is attached before input views; range records retain exact lowering revision/profile/dispatch, and final admission closes only after required producers drain. Shared payload writes to descendant declaration components still need explicit ownership. entity_stage_lease protects only the named entity, never descendants transitively. Proposed existing exact descendant leases before dispatch, or typed range results in worker-private lowering scratch followed by coordinator publication after all affected stages. A1 owns this choice and validation. |
| `compiler/semantic_expression_lowering.tower`, candidate0d04fe88 | Reviewed every added range hook: before/after indexes cover actual generated initialization in each declaration branch, using the same canonical block. Range collection must not replay effects or survive compaction without its retained lowering receipt. No candidate runtime acceptance is claimed. |
| `compiler/semantic_known_bindings.tower`, candidate0d04fe88 | Reviewed new finalize call before known-value compaction. Required producer completion and late-generic/capture admission need owner tests; program-root membership is a final boundary marker, not registration readiness. |
| `compiler/semantic_lowering_work.tower`, candidate0d04fe88 | Reviewed new coordinator range preparation after taking the ticket and before opening views. Existing function/parameter stage leases are exact entities. New descendant metadata must have an explicit mutation contract; a pin alone is insufficient. No candidate adopted before that resolution. |
| `host/driver_request.tower` and `host/driver_units.tower`, B2 patch77df2699 | Changed ownership paths reviewed: owned absolute lexical source/root buffers survive environment borrows and are freed after world/session teardown; each unit snapshots its temporary absolute path before disposal. This normalizes native lexical spelling without resolving symlinks or changing browser source-provider keys. Full CLI fault-sweep/final validation remains B2 and integrated work; no A2 production edit. |

D1's focused backend selector430d6654 preserves the full selector and existing
object/barrier/deadline checks. B2 driver fixture prefixea7bfd6a restores explicit
Tower imports without changing expected outputs. Both are reviewed and pending
adoption after the live source freeze. They do not retroactively validate earlier
binaries. The review itself changes no runtime and needs no runtime profile.

Coordinator correction after D1/D2 caller review: the blanket B2 fixture prefix
ea7bfd6a is not accepted. Their current cases already select Foundation; adding
Tower changes activation and source offsets. D2's measured kernel source repair
already adds Foundation. A2 reviewed but never applied this patch. The earlier
description of restoring Tower imports is therefore not a correctness finding
for those callers. Preserve their explicit languages and await a revised minimal
owner handoff; no heuristic import detection or competing fixture rewrite.

Additional owner receipts: D1 completed the parser census on its frozen older
127ca98/4635241 closure, three normal and three stress ASan executions, with
unchanged retention output and exact teardown. Default-quarantine stress RSS was
442–449 MiB; a separate 16 MiB quarantine diagnostic reduced it to 115240 KiB.
These distinguish retained allocator quarantine from live world ownership; they
do not validate the pending semantic capture changes. No redundant standalone
parser sanitizer matrix is needed on that unchanged source.

B2's diagnostic followup1110c19f was read in full: four lexical absolute-path
failures now call the existing request failure reporter, whose static OOM fallback
remains available. Its fault sweep requires every failed request to expose a
nonempty diagnostic and still checks exact buffer balance. The owner now reports
the request-production-source CMake correction87f875de built and independently
swept; it is no longer waiting for an unimplemented prerequisite. Both changes
remain pending local adoption until the current frozen TSan process drains.

The current TSan unit suite passed328.735wall/514.297user/18.665sys using the
production allocator and worker transport. Backend/control remain pending at
this update. The earlier type timeout and editor failure remain open.

L1's immutable same-Foundation receipt is copied into A2's own cache and every
SHA256SUMS entry verifies. Three balanced pairs use the exact118962-byte source
6f2571a1821e3d7f93a2ced1bc6433b64a685b6eb1b927fab3420858e277b3e5,
identical old adjacent resources, wasm32, graph interpreter and jobs1. Median
wall11.05→16.27s, CPU10.89→16.46s, peak RSS180024→215356KiB; compile phase
10.758351→16.105004s accounts for the regression. Bootstrap remains about116ms
and execution6–8ms. First-pair old input faults are higher, while subsequent pairs
have zero major faults, so cold input I/O does not explain the persistent gap.
These are L1 owner measurements, not an A2 isolated reproduction. Matched hotspot
samples are pending under the coordinator's shared host slot; no storage or
scheduler tuning is justified solely by this aggregate result.

The current TSan backend run subsequently hit the unchanged600s outer limit:
exit124/PID0 at22:38:08Z,600.094wall/748.965user/106.099sys, empty test log.
No sanitizer diagnostic or completed backend result was observed. This is not
D2's older internal30s assertion, and no barrier attribution follows from silence.
Control was not reached. Preserve the current constructor/LR/unit/focused passes
separately, and adopt D1's focused backend-overlap selector for direct evidence.

## Applied owner handoffs after a125c03e

After the current TSan process exited, checked and applied D1's backend selector,
parser census and failure-output flush; B2's native path ownership and diagnostic
followup; the validated driver-request production-source manifest correction;
and D1/D2's explicit Foundation fixture/measurement repairs. The rejected blanket
Tower prefix remains absent. These are coordinated owner changes, not new A2
algorithms. Their patches and exact hashes are preserved in the external status.

A1 editor_background6a6eeed6 was read with the full affected kernel and editor
context/type helpers, then applied. Current semantic_body_work source is
6cf7bb9eee192bcaf8b07c58f1d11a7c2663a3215985bb9a4c55eb817193787d.
Only a required producer outside the completion span clears its worker-private
editor pointer and observation copy. Its real body still executes; shared editor
state remains untouched. SemanticEditor contains borrowed references and scalar
observations, no owned vectors, so resetting that copy omits no disposal. The
coordinator's found guard prevents publishing its empty observation. This fixes
the identified admission mismatch without skipping dependency validation or
changing the separate descendant-capture lease contract. Independent runtime
validation is running, not yet a pass.

The public predecessor compiles the smallest changed semantic body, request and
parser benchmark units. Current request6c664c8a and parser0870e6b5 include the
reviewed owned buffers and outside-timer census respectively. Final validation
must distinguish the request's serial allocation-failure sweep from production
TSan overlap; neither substitutes for the other.

Independent current normal results now pass: execution editor at workers1/2/4/8
including retained completion scopes; query smoke; backend streaming's exact
objects/distinct-worker rendezvous; driver-request lifetime/fault sweep; real
filesystem module identity; parser owner census and exact session/world teardown.
Compilerb48bcd0e, LRb18a350a, executionbad71f50 identify this closure. The parser's
2048-symbol sample retains3582entities/3583components,65pages,529375 requested
page bytes versus227936 live payload bytes; these are current input/resource
counts, not an isolated comparison to the older B1 snapshot.

Updated TSan LRcb8509bd passes the focused backend overlap in142.877wall/
166.737user/25.819sys with the original30s rendezvous and checked exact objects.
Control remains running. This direct concurrency evidence does not turn the
earlier full backend timeout into a pass or establish system LLVM instrumentation.

Matched L1 GDB receipt9d6a861f has46 successful periodic attachments, exact target
outputs and original binaries/resources. Reliable top symbols repeatedly locate
entity_table_prepare and stage ownership. Broken deeper unwind and periodic
bias preclude caller-chain or time-share claims; debugger wall time is excluded
from speed comparisons. A2 is preparing per-store Tower diagnostic counters for
table search/reservation and stage publication. One hypothesis is repeated
unchanged lease preparation; another is exact-sized stage index growth. Neither
is a demonstrated bottleneck until the fixed-input counters and paired profiles
support it. The private observer preserves the public store prefix/API, allocates
its own diagnostic tail through the sole store constructor, and never replaces
the normal compiler used for performance acceptance.

A1's corrected capturev3 f5d3f2bd and prerequisites were read in full, pending
adoption after frozen measurements. Exact descendant leases before dispatch now
address the previous v2 ownership gap. Owned executable-edge traversal excludes
function/type/label binding backreferences; tickets retain revision/profile/
dispatch, and every affected stage publishes before work completion. Ordered
source-root borrows remain under program containment until pipeline disposal.
Aggregate clone storage, producer closure and final runtime/instrumentation gates
remain with A1/L1 and integrated validation; source review is not their pass.

Control TSan subsequently timed out at600s: exit124/PID0,22:57:58Z,
600.041wall/658.201user/20.506sys with an empty diagnostic log. It remains failed,
as does the earlier aggregate type timeout. The focused overlap pass remains
valid. D1 case-level progress/selection is requested before repeating either
large suite; no deadline or oracle has been relaxed.

The private counter/process observer now compiles and links with the public
predecessor. Initial unsupported variadic syntax and a missing explicit strlen
declaration failed before execution and were corrected only in private Tower
measurement sources; both logs are preserved. Complete normalb48 compiler,
resources and original link objects are frozen in A2's own cache. No counter or
timing run has yet occurred, and no production optimization follows from the
source hypothesis alone. Awaiting sibling quiet scheduling is separate from
publication approval.

### 2026-11-22 A2 measured unchanged stage membership (a125c03e plus candidate)

Re-reviewed `library/entity_stage.tower`, `library/entities.tower` and
`library/entity_types.tower` against the actual append-only stage contract.
`entity_component_remove` rejects leased entities; registered kinds are immutable.
Consequently an unchanged leased component count proves unchanged membership for
this API. It would not prove equality for arbitrary replaceable component sets.
The new candidate skips destination-table preparation/publication for that case,
and skips the count-map allocation when there are no new nodes/components.
Every lease still clears its stage/storage on publication. New nodes, additions,
pre-commit reservation, rollback, queued holds, pool detachment and finalizers
retain their previous ordering. No shared API/layout, identity or noalias change.

The fixed 118962-byte Foundation input6f2571a1, compiled with normalb48bcd0e,
exposed109623644 table prepare/publication calls;109452157 were unchanged.
Private per-store Tower counters show one bucket/signature probe per nonempty
lookup, so collision chains do not justify a new hash index. After the exact
three candidate hunks, prepare/publication falls to171487, with0 unchanged calls.
All109460399 leases remain, over6025 stages;8242 added components,152976 next-id,
60 created/pruned tables,0 live at teardown,23 peak tables and maximum arity5
are unchanged. A1 separately owns narrowing caller lease cardinality; these
counters do not identify every contributing caller or justify removing leases.

Table reserve growth275->271, requested capacity bytes13734048->8573088 and
explicit copied pointers715757->535428. Count-map requested bytes1331712->724224.
Instance growth stays14 requests/437368 bytes; previous reserved436984 bytes do
not establish realloc's actual copy count. Cumulative requested/copy counters
are not peak live memory or RSS. Private after observer6338edae/public-prefix
source665eaf1a produces the same expected saturation outputs and exact teardown;
its intrusive timing is excluded from speed comparisons. All original normal
objects, resources, counter sources/logs and before receipt remain preserved.

Focused owned tests now exercise payload-only full/empty leases, mixed component
additions/new children, pinned-view refusal, duplicate-name failure, discard,
repeated publication, pointer/index stability, zero pending reservations and
exact teardown. Public predecessor compiles the smallest changed library and
interprets the extended `tests/entity_tables.tower` with output0. The initial
unsupported else-if spelling failed before runtime and was rewritten using the
supported nested form; the original failure log remains.

`tests/entity_stage_concurrent.tower` adds a preexisting payload entity per job,
its explicit graph write range and pre-dispatch stage lease. Actual synchronized
workers mutate those payloads; all publication/cancellation/discard/partial
submission/name-failure outcomes check unchanged membership/pointers and cleared
leases. Existing writes are not transactionally rolled back by discard. All
original queued-reference and exact57792-finalizer assertions remain. Three
normal, three actual ASan+leak and three actual TSan runs pass, using production
allocator/transport;199 fixture/library and47 guest functions are instrumented.
Three extended table ASan+leak runs also pass,103 table+49 program-runtime
functions. Initial table linking selected the library runtime and failed missing
main; corrected only that runtime selection, retained the failure, and did not
repeat the already-passing concurrency matrix. Source UBSan/foreign LLVM and
universal race freedom remain unsupported claims. Whole compiler type/control/
full-backend TSan timeouts remain open; focused passes do not erase them.

Frozen normalb48/candidateda72 paired small/large jobs1/4 timings and canonical
roundtrip are prepared but not yet run. Performance acceptance remains pending.

Paired performance completed23:23:47Z, exit0/PID0,105.36s within the180s quiet
window; sibling containers remained idle. Host AMD Ryzen AI MAX+395, Windows11
Docker Linux x64, tower_build:latest/LLVM19, CPU12-23/24GiB cap. Public predecessor
built normalb48bcd0e and candidateda72aad4; only the entity object changes, other
objects and adjacent resources are identical. Target wasm32-unknown-unknown,
ordinary graph interpreter, --timings --jobs1/4, explicit frozen Bedrock/Foundation.
Each size/worker/version has one warmup and3 warm samples in alternating pair
order (before/after, after/before, before/after). Warm means repeated process/OS
cache use, not a retained compiler session or zero page faults; faults and
context switches are retained in every raw log. No sample crossed hibernation.

| Input / workers | Before wall / CPU seconds / peak RSS KiB | After wall / CPU seconds / peak RSS KiB |
| --- | --- | --- |
| Small ordinary42 /1 | 1.122001225 /1.052234 /168068 | 1.124235063 /1.052700 /168160 |
| Small ordinary42 /4 | 1.022195634 /1.175444 /189300 | 1.026712627 /1.181098 /187900 |
| Large staged6f257 /1 | 6.096356977 /6.040956 /213960 | 1.752030252 /1.691002 /212856 |
| Large staged6f257 /4 | 6.722258325 /6.700666 /216396 | 2.010829742 /1.985281 /216144 |

Entries are medians of each metric, not a synthetic single sample. Large wall
improves3.480x at1worker and3.343x at4, with72.0% less serial CPU. Small wall
changes+0.20%/+0.44%, so no small-input improvement is established by3 samples.
Large4worker scaling is0.871x versus1 after the fix: more lanes remain slower.
The near-single-core CPU/wall and surviving109M leases motivate A1 caller/grain
analysis, not claims that queue width proves useful overlap. Small4worker
scaling1.095x is limited by setup and adds CPU/RSS. Real overlap is separately
established by the unchanged rendezvous stress; no exact idle/critical-path
percentage or universal compiler scaling is inferred from these process totals.

All32 measured invocations match independent expected stdout. Four serial/
parallel before/after canonical emissions are byte-identical to original118962B
SHA6f2571a1821e3d7f93a2ced1bc6433b64a685b6eb1b927fab3420858e277b3e5;
the candidate reinterprets that canonical Foundation with exact saturation
output. This is a measured shared-stage improvement on two frozen workloads,
not cross-language superiority or whole-compiler release acceptance. Final
merged ownership/bootstrap/browser/generation and instrumentation gates remain.

### 2026-11-22 A2 joint capture ownership review after2ea669e9

Integrated only the coordinator-routed owner changes after all A2 jobs drained:
A1 capture policy595209af and complete42-case lifecyclec25f9c36; joint L1 API
2792eda5/A1 producer997aa4c9/L1 consumer27a71a9f; B2 hoverdffdad44+5f43191c;
B1 registry64d55417, lexical extents49ec56f5 and corrected tracea2618c72; D1
root-source9dcff8a7 and storage reset draft9685f4d3. No withdrawn capturev1/v2,
trace330/c8, or blanket import writer was applied. None of these patches is
attributed to A2; own stage optimization remains isolated45bf1d33.

Read the full shared type/interpreter/context/semantic publisher/disposal diffs.
IMValueProjection replaces the identical semantic leaf representation rather
than adding another graph. Exact producer identity, frame-owned target bytes
and frozen borrowed projections establish storage lifetime. Optional inference
keeps known_producer and cannot overwrite the required capture role/projections.
All fresh publishers use default initialization. Two-pass evaluation disposal
releases every consumer invocation before any producer leaves; semantic layout
cleanup closes the shared worker pool before evaluation disposal, and phase
pumps join/publish before returning. Strict immutable-capture write checks leave
non-strict raw Foundation behavior intact. No address-coincidence cache or
noalias promise was introduced. Entire dependent ABI closure must rebuild.

The capture policy freezes require_relocatable from the exact producer before
dispatch, so an initializer-derived captured address cannot stand in for a runtime
binding, while explicit comptime calls retain their separate capability policy.
Executed-branch effects/addresses and scalar/type/function positives remain
covered by the expanded owner fixture. The shared stage optimization does not
permit removing any of these payload leases.

Two owner test corrections arrived before runtime: ef0147df inserts a callee
local so nested storage lifetime is visible at an interpreter step boundary;
all original ownership assertions remain. Aggregate fixture25e8f5ab replaces the
old incorrect empty-layout0 expectation with existing layout1; stdout0 and all
aggregate/function/type/pointer/alias checks remain. Original old fixture was
never run here. Initial five smallest units passed, then the optional generic
CMake include cleared with an empty cache path caused configure exit1; no native
or runtime pass followed. Preserved log/recipe/manifest, removed that cache entry
with -U, and resumed only the changed query unit plus native build. Current
fully joined validation is running; final acceptance remains open.

### Current completion scope after the joined native check (2026-11-22 23:40Z)

Current core census: **29/29 paths reviewed** (27/27 `scaffolding/library/*.tower`
including compiler_work/types and both budget files, plus2/2 compiler_kernel*.tower).
The expanded scheduling/ownership boundary census is **98/98 production or
composition paths with per-file receipts**, including those29. These are the90
unique production/composition paths already named in the tables plus the8 below;
duplicates and20 earlier test/tool receipts are excluded from98. No newly
introduced core library/kernel file is unreviewed in this frozen tree. This
count does not claim a full audit of every other lane's compiler source or every
transitive non-scheduling import. New files discovered in later handoffs must be
added and reviewed before increasing the numerator.

The following complete-source reviews close missing explicit per-file rows.
Paths are relative to scaffolding; reviewed commit2ea669e9, unchanged by the
subsequent joint ABI patch except interpreter_context (27a71a9f).

| Path / source identity | Ownership/storage/scheduling conclusion | Evidence and disposition |
| --- | --- | --- |
| `compiler/semantic_constructor_work.tower`,90eb0638 | World-owned constructor components; separate syntax and instance receipts, lexical/module capture identity, immutable ready type copy. Call/Clone/Alias/Execute continuation uses declaration inputs and ordinary evaluation; waits record dependencies, nominal identity precedes layout. Coordinator registers/publishes, cloned bodies use shared staged executor. | Full source read; new42-case type/lifecycle run passes. L2/A1 production ownership; no new registry, folder or local scheduler. Final joined instrumentation remains open. |
| `compiler/host_world.tower`,ef8ca078 | Explicit world store/types behind the legacy host handle. Creation registers provenance kinds and unwinds failure; component access derives owner world from the entity. | Complete source read. B2 owns remaining legacy transport migration; no ambient default world added to new paths. |
| `compiler/frontend_world.tower`,abb4fa89 | World grammar cache owns immutable seed/pattern compiler/pool. Reset rejects pins or busy workers, clears syntax then closes pool and releases cache owners; retained parse output survives separately. | Complete source read. B1/B2 owner; ordinary storage/reset and current source lifetime checks pass, final threaded/browser invalidation remains a gate. |
| `compiler/units/parser_work.tower`,20702b7e | Composes parser core/frontend and existing LR work tests; owns no additional queue/world/payload. | Complete import unit read; B1/D1 keep manifest/link ownership. |
| `compiler/units/parser_work_checks.tower`,76aaff42 | Adds existing parser case/replacement checks to the same parser/LR closure. No execution policy or independent storage. | Complete import unit read; source composition is not a runtime receipt. |
| `compiler/units/parser_modules_work.tower`,07401df2 | Composes module ownership checks with shared parser/frontend/LR work. | Complete import unit read; module worlds remain B2, generic registration D1. |
| `compiler/units/parser_modules_work_checks.tower`,1c60dcf7 | Combines module/parser replacement checks with existing LR worker closure. | Complete import unit read; no second scheduler or changed callback identity. |
| `compiler/interpreter_context.tower`,27a71a9f delta | Invocation-owned initialization bitmap and captured input intervals. Bounds validated before writes; strict captured ranges reject scalar/copy/fill mutation. Non-strict Foundation remains raw. | Full source read after joint ABI. Current query smoke checks immutable storage, nested frame retention/disposal; final ASan/TSan execution still required. |

Remaining acceptance is substantive, not optional follow-up:

| State / requirement | Exact source or boundary | Next concrete work/evidence |
| --- | --- | --- |
| Implemented and measured: ready selection, finite dispatch, shared admissions, unchanged-stage optimization | library/work_graph.tower targeted take/ready index; work_pool.tower work_pool_batch; compiler_kernel_dispatch_admitted; work_budget*.tower; entity_stage_prepare/publish | Retain the recorded reference checks, actual overlap and paired profiles. Independently revalidate after incoming shared ABI/transport changes; do not relabel old hashes. Current normal9focused/query/fullbackend passes strengthen integration, not final release. |
| Implemented storage; production locality/retention acceptance incomplete | entities.tower entity_component_allocate/table-query columns; entity_types.tower EntityComponentPage/EntityTable | Stable payload pages and packed pointer indexes are implemented. There is no selectable packed archetype-payload policy; the private packed scratch microbenchmark is not one. Next measure a real bulk compiler phase's traversal/copy cost and page occupancy, then propose a common dense API if it pays while preserving existing stable-pointer leases. One survivor/page retention is measured and still present. No unsafe compaction or noalias inference. |
| Measured scheduling gaps remain | semantic_layout.tower sem_layout_execute; semantic_body_work.tower admitted result.nodes leases; semantic_context.tower sem_workers_admit; parser_workers/lr_state_work | A1 must narrow lease sets only with ownership proof and attribute109M leases before changing callers. Pending ready-field grain and safe joined grant refresh must fix tiny layout overhead and initial narrow-chain underadmission. Shared batch scales on useful work; end-to-end profitable1/2/4/8/12+ core use is not established, and current large4worker run is slower than1. Measure refill/idle/critical path on representative body/parser/import/staging inputs, retaining inline serial path. |
| Explicit reservations implemented; complete retained-byte accounting unvalidated | world.tower compiler_world_bind_budget; work_budget.tower; frontend_units/backend/units; semantic_support.tower sem_allocate | Ledger reservations are not allocator/RSS limits. B2 retained-output and queued-input accounting needs final mixed outer/nested stress. A1's authorized scratch compiler_buffer migration is still pending here; audit every matching owned free,32-byte header/cardinality/RSS cost and explicit owner policy before adoption. Preserve vector allocator ownership. |
| Producer model implemented; latest full instrumentation pending | semantic_query_pipeline, declaration/body/constructor/capture/evaluation pumps; interpreter ix_value_input/ix_input_storage | Current42-case lifecycle/type matrix, query, aggregate1/4 and canonical roundtrip pass. This supersedes missing-helper/aggregate-failure historical claims for this source. Preserve executed-branch effects, exact producer/frame identity, revision/profile/dispatch and owning-quiescence cycles; validate new borrowed leaves and two-pass disposal under actual concurrent ASan/TSan. No second evaluator. |
| Failure/cancellation/stale contracts implemented; host coverage incomplete | compiler_work.tower accept/cancel/close; WorkGraph tickets; entity_stage holds/discard; host/work_windows and work_wasi | Current native backend suite passes real overlap, deterministic objects/errors and cancellation. Focused stage3ASan/3TSan passes pre-joint ABI. Need current aggregate/window cancellation stress plus supported native/browser transports. Windows transport has source review but no actual A2 Windows stress; coordinate B2's necessary thread-identity boundary rather than claim tooling unavailable. |
| Serial regression partially addressed, broader costs open | stage/table measured input; parser/semantic compile and frontend world startup | Fixed input serial6.096->1.752s and lower RSS is isolated evidence; small1.122->1.124s is unchanged. L1 must repeat its original normalized backend workload/deadline with this fix. Compare equivalent small/large frozen inputs and C-like references with checked outputs, CPU/RSS/allocation retention; do not generalize microbenchmarks or debugger samples. |
| Supported instrumentation incomplete at final source | tools/instrument_llvm.tower; cmake/TowerSanitizers.cmake; current shared ABI | Run current ASan/leaks and TSan on actual production allocator/transport, including new query/aggregate paths and backend overlap. Prior full type/control/backend TSan600s failures remain exact failed receipts. New normal42-case type run is214s, so coordinate D1 case selection/progress rather than blindly repeating an oversized opaque aggregate or raising deadlines. Source-level UBSan/system LLVM and untested platforms remain explicit unsupported coverage. |
| Canonical native build passed; clean multi-target release still open | public bootstrap/build-native; playground build-wasm/build-threads/checks; generation and served manifests | Current documented public-pin native build and canonical outputs pass, but this dirty joined source is not a clean final release. Commit/rebase and validate affected inputs; acquire immutable SDK/backend dependencies into A2's own cache, build portable/threaded browser and generation checks, then request named publication lease and atomically push reachable main+gh-pages. Node/Chromium dependencies are prepared; no browser/hosted pass or publication lease yet. |

Current host limit is the coordinated12CPU/24GiB A2 Docker slot on the16-core/
32-thread123.65GiB Windows host, not a claimed compiler scalability ceiling.
No new agents, terminals, sibling caches or duplicate LLVM build were used.

Current joined native receipt: tower-a2-joined-aggregate-stage-v2 exited0/PID0
at2026-11-22T23:40:04.446Z; final full .tower SHA256 verification passed. Public
predecessor native53steps82.951wall/113.191user/8.651sys; dependent runners27steps
24.848/33.504/2.763. Compiler
c14a5a67e5c7cf608209194c36bb3980110b28f8d29a369a021d371aba380c55,
LRee1cac79d85a227c20ccbb948ab7dcda721b816c26636dfd0f742f9d359ca7f7,
execution340589f06ffd6896e4bf079bbb32bba4b0f0a85146ecff480ed21533d212fc70,
storage3c57c11f6e0fea1317cdc8ac03eda852fd980a06ea452c600e6370b056a54e78.
All9 focused/storage CTests pass with zero skips(.52s); query smoke passes.081s.
Aggregate input fixture25e8f5ab yields0 at jobs1/4(1.146/1.032s); both canonical
files SHAfe35a452a34db107976d6ea497dc2bfdb184d67fd93b425bf374abe356cb01f6,
ordinary Foundation roundtrip yields0(.270s). Full42-case lifecycle/type smoke
passes214.397/219.157/9.518, control31.807/32.839/1.506, full backend
48.634/63.081/6.399 and editor1/2/4/8 at16.263/12.833/1.118. Backend retains
actual frontend/LLVM rendezvous, deterministic objects/errors, budgets and
cancellation. These are correctness timings on the integrated source, not an
isolated before/after performance claim. Old small type smoke is not equivalent
to the new42-case run. All logs/recipes/source manifests remain A2/cache/logs.

Original configure failure remains joined_aggregate_stage_first.log: all five
smallest units pass(1.743/1.838/16.474/2.851/1.533wall), then CMake rejects an
empty generic project include as a directory. A proposed stop was issued only
after that process had already exited1; it did not cancel a running compiler.
Fixed by removing the cache entry with -U, not changing production code. Only
the newly corrected query fixture was recompiled before the successful build.
Locked npm402-package and own Chromium installation also exit0; they establish
browser dependency readiness only. No compiler browser/generation/publication
check has run on this source. A1 receives the next quiet profiling slot; A2 has
no active build during that window.

### 2026-11-22 retained-buffer draft: newly discovered owned files

Current full production/composition source-review coverage is **100/100**
(31/31 owned core, now 29 library files plus two compiler kernels). These two
new implementation files are reviewed drafts on aadf300e, not runtime-validated.
No packed Entity ABI change has been made. New focused test/profile files are
listed separately and do not inflate the production count.

| Full path relative to scaffolding | Ownership/storage conclusion | Disposition/evidence gap |
| --- | --- | --- |
| `library/work_buffer.tower` | One physical compiler buffer plus byte-only WorkReservation. Full replacement grant precedes allocation; physical free precedes release. Move/swap follows retained output through join. Null budget is explicit standalone; ledger/gate must outlive allocation. | Complete source review. Depends on B2 allocation-size export matching exact header/overflow policy. Uncompiled; denial/failure/concurrent-retention fixtures and paired overhead profile pending. |
| `library/work_vector.tower` | Distinct typed owner prevents ordinary vector deallocation from losing header/receipt. Existing geometric growth, initialized-byte copy, explicit transfer and borrowed iteration. Per-call error result preserves actionable denial versus invalid/OOM. | Complete source review. Explicit host alignment boundary pending B2 verification, including u64 on32-bit. No implicit destructor or element ownership added. Uncompiled. |
| `tests/work_buffer.tower` | Deterministic exact retained-byte/reference checks, rejection preserving old contents/receipt, moved/swapped buffers/vectors, standalone and teardown. | Own full source review; no runtime pass yet. |
| `tests/work_buffer_shared.tower` | Four real workers use production allocation plus shared gate, rendezvous, concurrent replacement, retained results after lane release, capacity denial and cancellation drain. | Own full source review; native/ASan/TSan pending. No serial fault runtime permitted. |
| `tests/work_buffer_faults.tower` | Explicit serial failure at ledger allocation and physical replacement; old pointer/contents/grant survive, final live allocation count exact. | Own full source review; serial runtime execution pending, not threaded sanitizer coverage. |
| `tests/work_buffer_profile.tower` | Frozen equal physical allocate/copy/free workload with/without ledger; fixed total8192 replacements over1/2/4/8 workers. Independent byte oracle; wall/CPU/RSS/actual overlap/allocations/retained payload/ledger metadata. | Own full source review; no timings run during A1 quiet hold. Shared-helper cost measurement only, no compiler-speed claim. |

B1's parser memory inventory requires propagating the same physical owner through
FIRST/propagation swaps and retained LR runtime rows/gotos. Reservations at join
alone are insufficient. B1/B2 own caller adoption after the common API is pinned;
A2 is not modifying their production files without agreement. All-memory/world
budget enforcement, packed payload implementation/staged transfer, and final
integrated release/instrumentation remain open.

## Retained memory and new arena review, 2026-11-23

Current core census is32/32 (30 library files and2 kernel files). Adding the
three newly explicit allocator-boundary reviews below yields104/104 disclosed
production/composition paths, with earlier unchanged rows retaining their review
commit. This is coverage, not acceptance. Tests do not inflate this count.
Reviewed aadf300e plus source hashes below; pending type-split files are not yet
adopted/counted. The preceding uncompiled-buffer receipt is historical; the
following current evidence supersedes it.

| Path relative to scaffolding / source SHA prefix | Full-source conclusion and disposition |
| --- | --- |
| library/work_buffer.tower / ccc61ca8 | Physical allocation owner plus exact byte grant. Checks overflow/owner before allocation; reserves complete replacement while old remains; transactional failure; free before receipt release; move/swap preserve sole ownership. Native/serial-fault/3ASan/3TSan and WASI32 passed. Gate contention measured below; does not cap whole-world RSS. |
| library/work_vector.tower / e59bd354 | Distinct generic owner, checked size/alignment and initialized-prefix growth; borrowed iteration requires stable owner. Existing doubling/min8 preserved; per-call result and pop preserve old state on denial/empty. Native64/WASI32 u64 alignment and1535-byte capacity edge passed. No element destructor/noalias guarantee. |
| library/work_arena.tower / bb84b958 | Private common-lifetime stable slices; physical chunk grants through WorkBuffer, checked alignment/overflow, exact retained snapshot. O(1)joined append rejects different budget; self-hosted descriptor copied before free; no copied dual ownership. Native/fault/3ASan/3TSan real4pthread and WASI32 passed. Production scratch adoption and chunk policy remain open. |
| host/memory.tower / 2db4f04f | B2-owned exact compiler header size shared with allocation, production null-state path avoids legacy globals, explicit optional diagnostic guards/owner counts. Two-word alignment documented and exercised native64/WASI32; conservative overflow policy retained. Explicit legacy instrumentation remains single-owner, not race coverage. Complete source review including checked count*size reallocation and free ownership. |
| host/memory_libc.tower / 4c5b3605 | Two typed foreign realloc/free declarations; selected target usize is size_t. Necessary libc boundary only, no hidden world state or parallel allocator policy. Complete source review, unchanged. |
| host/memory_types.tower / 460aeae9 | Two explicit optional instrumentation state records, passed by owner rather than ambient singleton. Counters are not synchronized and remain serial-only. Complete source review, unchanged. |
| tests/work_arena.tower / 6697f992 | Exact chunk cap, denied output preservation, same/different-budget append, stable aligned slices/oversized/zero/overflow, full payload checks and final zero ledger. Native/ASan/TSan/WASI32 passed. |
| tests/work_arena_shared.tower / d9423e43 | Four actual pthreads, private arenas, rendezvous and coordinator cancellation/denial; pointers retained after join/append/lane release; parent final disposal zero. Production allocator,3ASan+leaks/3TSan passed; not universal race proof. |
| tests/work_arena_faults.tower / dee0c37c | Separate serial ledger-allocation/new-chunk allocation failures preserve pointer/data/output/receipts, retry and exact live count teardown. Passed existing instrumented+trap composition, no threaded instrumentation claim. |
| tests/work_arena_profile.tower / 952b6326 | Independent deterministic byte oracle, fixed2048/262144 small-object requests and common lifetime. Equal pre-touched pointer index outside timing; individual buffers versus4/16/64KiB chunks. Records physical/payload/index/ledger bytes, actual overlap, wall/CPU/RSS and retirement. Eight correctness smokes passed; paired timing pending at this receipt. |

WorkBuffer fixtures in the earlier table are now native/fault/ASan/TSan validated;
normal work_buffer also executed WASI32. Profile total was increased from the
earlier8192 draft to262144 fixed replacements before measured samples. Same
bea8768f binary, warmup+3paired samples, all32 outputs checked. Median wallms
baseline->ledger for workers1/2/4/8:12.292->15.553,9.739->68.113,6.166->88.549,
3.789->93.704; CPU/RSS/allocation/retention values and exact recipe identities are
recorded in the journal. Real overlap is demonstrated; this per-allocation lock
workload scales poorly. It cannot establish compiler speedup or complete memory
accounting. Arena amortization is an implementation to measure, not an assumed win.

L1's proposed data-only type split7f9fa3c4 has been read: one nominal definition,
allocation-free iteration hooks stay with the generic type producer; full methods
remain in implementation modules. A2 approves this source design after current
freeze, with affected compile/runtime validation still required. Shared layout
callers must select type modules; do not multiply types or inflate compiler caps.

All prior packed-storage/scheduling/ownership and release gaps remain explicit.
The existing stable pages and dense pointer archetype columns are not packed
payload storage. Public pin execution and focused native/WASI/sanitizers above
are scoped evidence; no final integrated release or publication lease exists.

## New type modules and imported retained-storage boundaries

The core is now35/35 paths (33 library plus2 kernel files). Three single-definition
type modules and four newly explicit imported-boundary reviews bring disclosed
production/composition coverage to111/111. This extends the prior104 count by7;
new tests remain separate. Reviewed aadf300e plus exact owner patches noted here;
all counts describe reviews, not implementation or release completion.

| Path relative to scaffolding | Full-source ownership/scheduling conclusion and disposition |
| --- | --- |
| library/work_buffer_types.tower /49cb7029 | Single physical owner record and WorkReservation. Data-only import permits shared layouts without allocator methods. Same fields/lifetimes as validated v3; all callers must keep ledger/gate live and move the entire owner. Public-pin unit passes. |
| library/work_vector_types.tower /035f61b3 | Single generic nominal owner plus four allocation-free borrowed iteration hooks in its defining module. Index cursor stays private; no mutation/alias guarantees arise from borrowing. Explicit constructor import required. Public-pin unit and normal fixture pass after caller import fix. |
| library/work_arena_types.tower /3410b911 | Arena/config, self-hosted chunk descriptor and quiescent snapshot records; no allocator methods. Whole-owner transfers retain exact WorkBuffer receipts. Public-pin unit passes; source-layout policy matches A1/L2 coordination. |
| compiler/parser_table_types.tower /9e4d+cfd3 | Coordinator-owned table descriptor, budget and work_vector state/context columns; borrowed immutable runtime after build. Explicit type-only imports prevent unnecessary implementation closure. Complete source read; selected payload remains contiguous vector data, grammar/runtime ownership separately retained. |
| compiler/parser_table.tower /9e4d | All301 lines reviewed. Root/kind world selects budget, table descriptor self-hosts WorkBuffer, partial context failure cleans every initialized owner, successful runtime detaches source grammar indexes. Retry keeps grammar, rebuild/dispose require joined requests. Presentation text still a separate unbudgeted compiler_buffer owner; no whole-parser budget claim. Six-unit compile passed; current joint runtime pending. |
| compiler/interpreter_types.tower /9228 | Full record file reviewed. Invocation-private frame/task/value/address execution indexes refer to authoritative Foundation entities. Memory work_vector plus explicit borrowed root budget; other map/frame vectors retain separate ownership. Shared ABI requires full dependent rebuild, no second IR. |
| compiler/interpreter_storage.tower /9228 | All305 lines reviewed. Memory reserve preserves data/length on denial and initializes only newly extended host bytes; teardown retires WorkVector and clears borrowed budget. Ordered maps and reusable depth buffers remain derived private indexes. Existing im_storage_require abort on nonmigrated internal containers is an explicit incomplete fallible-allocation boundary; not normal cancellation acceptance. |

Previously reviewed frontend_units and interpreter/context interface deltas were
reviewed again againstc654/6e961/9228. Frontend snapshots now own physical buffers
through batch close; per-input exact subtotal excludes retained parser/interpreter
owners while whole ledger stays bounded. Interpreter memory/initialization/input
vectors retain grants to disposal; checked memory denial preserves old owner.
B2 backend test93b999 measures exact output retirement beside joined frontend
owners. These source reviews do not substitute for current joint tests or full
L1 interpreter-behavior audit. Final current ASan/TSan/native/browser gates remain.

Arena before/after profiles are now measured (journal00:47Z entry): large16KiB
serial7.6156->1.9253ms and physical12058624->4235328B; small contexts show chunk
waste and poor parallel amortization. Best large scaling is1.71x at4workers with
64KiB;8 regresses. This is not end-to-end compiler scaling. Source module splits
changed some object bytes, so refresh current owned instrumentation/profile before
claiming final API validation. Active-stage packed design is reviewed/proposed,
not implemented; all earlier full-scope acceptance gaps remain open.

Current receipt00:51Z supersedes pending runtime statements above for the frozen
owned memory/API and joint normal closure: all14 owned units independently compile;
6native fixtures,24ASan/TSan executions and actual serial WASI32 buffer/arena pass.
Joint query/units/backend-overlap/parser-fault/aggregate-stages pass, with exact
source hash verification; compiler a7a6a005, source archiveb8b0c9b7 and receipt
86b357b9. No failing check was skipped or relabeled. The first copy/import/entry
failures remain in the journal. Whole-compiler current instrumentation, isolated
post-import profile refresh, packed storage/staged transfer and integrated release
remain open. Core35/35 and expanded111/111 review counts are unchanged.

### Constructor and retained scheduler storage review, 2026-11-23

Reviewed2031d90d plus constructor patchfe458ae8 and B1 helperae819791. This is
source review and focused validation; whole-compiler integration and measured
constructor costs remain pending. The following replaces the affected allocation
conclusions in earlier rows, without changing their scheduler/identity contracts.

| Path relative to scaffolding | Ownership, storage and disposition |
| --- | --- |
| library/work_buffer.tower | B1's nongeneric element-growth helper preserves validation, checked size/alignment, minimum8/doubling and full replacement-before-retirement. No new allocator or layout cast. A typed wrapper publishes only on success. Before/after serial cost remains under investigation; do not infer zero runtime cost from equivalent source behavior. |
| library/work_vector.tower | Owner/length and no-growth checks remain in the typed wrapper; shared growth removes repeated generic implementation. Still a distinct physical owner, with no element destructor/noalias promise. Normal, real4pthread, serial faults and18 ASan/TSan executions pass after helper adoption. |
| library/work_graph.tower | All nine derived arrays now use WorkVector with one immutable borrowed budget. Handles remain ordinal; task pointers do not survive growth. Initialization allocates nothing, reset retains charged capacity, dispose retires it. First resource error survives subsequent attempts; task/access/ticket ordering is unchanged. The caller's cycle-result vector remains separate. Focused cap/reset/stale/cancellation, original scheduler and64000-task scale checks pass. |
| library/work_pool.tower | Slot allocation reserves exact physical bytes after host capacity clamp and before host handles/threads. Slots stay owned through every join; close frees them before releasing the grant and preserves the failure receipt. The three budget constructors do not double-charge execution lanes. Native thread/semaphore descriptors remain outside this subtotal. Four-worker barrier/cancellation/close-drain tests and original partial-admission fixture pass. |
| library/entity_types.tower | Store descriptor records its physical owner, immutable borrowed budget and coordinator-only fixed resource error. Existing payloads remain stable sparse allocations and archetype columns remain pointer indexes. No packed payload policy is implemented by these fields. A shared store error must never become an unsynchronized worker diagnostic sink. |
| library/entities.tower | Result constructor reserves descriptor bytes before allocation and preserves a null output on failure; dispose copies the self-hosted receipt before freeing. Entity/node/component-page/index/stage allocations still use their existing paths and are explicitly unaccounted. No postallocation binder claims constructor coverage. |
| library/compiler_work.tower | Result constructor funds its descriptor/store/graph before requesting work, then closes every partial owner on failure while returning the first fixed error. Existing ordinal/subject identity, source-ordered settlement and cancellation remain. All payload reads reacquire CompilerWorkUnit through the stable entity, supporting the reviewed future packed opt-in; it is not adopted yet. |

New owned fixtures `work_schedule_budget.tower`, `work_constructor_budget.tower`
and `work_constructor_faults.tower` test remaining-capacity denial, invalid absolute
requests, output preservation, partial cleanup, retained reset, stale tickets,
four actual simultaneous workers and joined cancellation. Serial allocation-failure
sweeps are deliberately separate from concurrent allocator/transport runs. New
`compiler_work_profile.tower` keeps eight identical plans across worker counts,
checks complete ordinal sums/identity counts and reports actual overlap. Its
ledger mode reports only charged graph/descriptor/slot requests, not all heap
allocations. `work_vector_profile.tower` checks every element and fixed total work;
ordinary realloc requests are not mislabeled allocation counts.

All five smallest production units compile with the public pin. Current focused
native cases and18 constructor/scheduler ASan/TSan executions pass, including
eight concurrent private plans sharing a synchronized budget. This does not
cover every compiler caller, source UBSan, Windows or browser threads. Five
manual-recipe/fixture failures are preserved: budget error classification,
reserved identifier, top-level library mode, guest entry and transport linkage.
They were repaired without weakening original graph/pool output oracles.

Caller review found that standalone ECS/work fixtures need the existing
compiler-buffer provider explicitly. Added `.host.memory` imports to the owned
fixtures; normal compiler linking already includes compiler memory. D1 owns any
generic target/runner adjustment; B2/D2 must verify packaged provider closure.
No new allocator or adapter is introduced. These imports and full dependent ABI
rebuild are pending validation. No new production path changes the35/111 counts.

The constructor profile now has checked before/after evidence: large metadata
plans regress about7% serial and20% at4workers, with8workers unprofitable. Small
serial is effectively unchanged in this window; its parallel dispatch overhead
dominates. These costs are not accepted as an end-to-end compiler result. Loss
of realloc reuse and repeated reserve validation are investigation candidates,
not established causal attribution. All21 explicit provider-import units compile.

The new `library/work_arena_api.tower` is a complete reviewed declaration boundary
over the SAME WorkArena/WorkBudget types. Six existing implementation functions
are exported; `compiler/units/entities.tower` is their single production provider.
No allocator or arena algorithm is duplicated. The existing four standalone
fixtures still import the implementation directly. Public units/API/provider and
separately linked ownership tests pass; nm verifies exactly one definition per
export in the provider. Original shared concurrency logic, with only import
declarations changed in a cache copy, passes three ASan and three TSan runs with
both provider and client instrumented. Linked runtime costs are real: the large
16KiB serial allocation micro is2.040->2.817ms,64KiB1.785->2.835ms. Payload,
chunk count, physical retention and checks remain identical. A1's aggregate
advances further before the predecessor component cap but still fails; no
bootstrap closure or end-to-end speedup is claimed. D2 owns package allowlists.
This one new production file brings core coverage to36/36 (34library+2kernel)
and expanded reviewed coverage to112/112. Packed payload/stage transfer, remaining
memory ownership, typed transport failure propagation and final release remain open.
