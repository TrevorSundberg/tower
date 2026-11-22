# A2 shared ECS and scheduling audit

This is an **in-progress audit**, not lane acceptance or publication evidence.
Owner: A2 on KinmenA, exclusive `C:\Sandbox\tower-agent-2`, main.
Reviewed source baseline: `6282238779034442e0578d76b921ca117df819f1`;
current local `d284abce` plus the generic projection reduction includes the measured A2 changes below, on
published60741c51. Unmodified receipt rows retain the baseline reviewed identity;
later changed-file receipts state their implementation commit. Session
`01a2046f-fec2-7c71-be46-cad28f9ac147`, resumed Codex PID 15056.

The production library is `scaffolding/library`, with 25 baseline files plus
the new `work_budget.tower` (26 current files). Scope also
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
not independently validated runtime acceptance. Runtime evidence remains open.

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
| `tests/work_budget.tower` | Private owner and deterministic reference counters independent of ledger slots. Tests deliberately copy receipts to reject stale ownership. | Entire source reviewed; native passes, including optional extra lanes and bytes-only retention. OOM injection remains a separate pending case. |
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
