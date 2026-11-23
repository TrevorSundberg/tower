# A1 independent executable-budget review

Reviewed published `e6be70d5e96f8ccb86a05d679f6fd4c75e8937cf` on 2026-11-23,
including A2's `995af4d898e74a47eacb1a7a48396053efee62c6` and receipt
`a2bd29874d6df5da64880e68befad0cddd133483`. The three repair files are unchanged
between the implementation and this freeze. This is an independent source review;
no compiler, browser, T5, allocator-instrumentation or runtime test was run.

**Finding: an adjacent, pre-existing alias-publication failure can still expose
a ready executable.** The new batch accounting itself has no identified defect.
The finding below remains open for the executable/evaluation owners; this review
does not duplicate their production changes or establish full current acceptance.

## Open caller contract

In `semantic_execution_work.tower::sem_executables_pump`, line 287 calls
`sem_evaluation_aliases` after all stages publish. In `semantic_evaluation.tower`
lines 76-85, that helper records `Memory` if the destination alias vector cannot
grow, or `Invalid` if its producer is missing, then returns. `sem_scratch_error`
records the first program resource and original operation offset; it does not
cancel the graph or write `SemanticExecutable.resource`.

The pump does not check `sem_ok(c)` after that call. Its `ready` expression at
line 296 checks only the worker result. With a healthy worker result and a valid
ticket, `work_finish(..., true)` therefore succeeds and `input.ready` becomes
true despite the coordinator resource failure. The deferred `work_cancel` leaves
already-succeeded tasks succeeded. The enclosing `sem_query_pipeline_pump` does
eventually return `Failed` through its final `sem_ok` check, so this is an internal
readiness/publication inconsistency, not evidence of successful external execution
after an allocation failure. Later entries can also have their alias lists cleared
by the failed-context guard while their worker-only readiness remains true.

This path predates `995af4d8`: blame attributes the alias call to `c2c0d9621` and
the result-only readiness/checked finish to `2c454321b`. The budget patch neither
introduces nor closes it. The smallest repair belongs at this caller's joined
publication boundary: stop readiness publication on the first coordinator error,
preserve its cause/offset, and let existing terminal cleanup cancel unsettled work.
Already-published structural storage remains owned until context/world teardown;
do not attempt to discard a consumed stage or replay alias effects.

Smallest proposed Tower regression (not implemented or executed): extend
`semantic_executable_admission_checks.tower` using its existing checked-body,
request/demand and teardown setup. Before the real pump, append one
`SemanticEvaluationAlias { producer: subject, original: subject, clone: subject }`
to the requested executable's `aliases`, while that subject intentionally has no
evaluation-result component. The otherwise healthy pump must retain `Invalid` at
the fixture's owning offset 17, return `Failed`, leave `IMFunctionInput` unready,
cancel the query, and leave no stage/context or running job. Repeat the terminal
pump and check unchanged cause, offset, counts and readiness; finish with existing
zero-owner teardown. This deterministic missing-producer case exercises the same
unchecked return without a new allocator hook. A separate valid-producer case
denying the destination alias append through the existing **serial** fault allocator
is needed to execute the `Memory` arm; the current 15 selectors do neither. A2's
malformed-capture work and L2's shared evaluation ownership must be coordinated
before implementing this adjacent regression/repair.

## Reviewed ownership and error paths

Paths below are under `scaffolding/`; whole named methods and the listed immediate
callers were inspected, including success, partial failure and terminal cleanup.

| Source / methods | Review conclusion |
| --- | --- |
| `compiler/semantic_execution_work.tower`: request, begin, kernel, pump, failure, dispose | Checked body/query/component admission precedes dispatch. The temporary `work_vector(SemanticExecutable*)` uses the root entity's explicit world ledger. Its capacity is acquired before stage opening and before workers borrow `batch.data`; no pointer-array growth occurs during dispatch. Worker scratch/error storage is private and shared indexes remain frozen. Existing prepared/lowered flags still prevent lifting already-lowered operations again. |
| Same file: temporary batch versus persistent `query_reads` | They have different owners. The batch owns only pointers and its byte receipt. Preparation/lowering provenance and worker reads append to the executable component's raw vector; allocation failure remains `Memory`. If a read append or batch push fails before insertion, the taken ticket is still cancelled and the component retains its vector for `sem_executables_dispose`. Observation clears length only after all edges succeed; failed observation retains storage for teardown. No local batch cleanup frees or transfers that persistent vector. |
| `library/work_vector.tower`, `work_buffer.tower`, `work_budget.tower`; `host/memory.tower` | Push checks length increment; growth checks element multiplication, alignment and doubling overflow. Valid descriptors derive capacity from admitted bytes. Resize reserves the entire replacement, including the compiler header, while the old allocation remains charged. Capacity denial leaves data/length/receipt unchanged; physical allocation failure releases only the new grant and returns `Memory`; successful replacement copies live bytes then frees the old owner. The returned typed cause is used directly, not the ledger's mutable diagnostic field after cleanup. |
| `compiler/world.tower`; budget identity/revision | Lookup is by root world, not a global budget. Live worlds cannot rebind their ledger. Release validates owner/revision/slot/generation and exact grant. Budget disposal rejects live grants and reuse requires a newer revision. The vector's no-growth fast path does not revalidate generation: safety here relies on the local descriptor's exclusive ownership and the immutable live world budget, not on a per-push stale check. Null-ledger standalone worlds intentionally remain uncharged. |
| `library/work_graph.tower`: filtered and targeted take, observe, finish, cancel | Both take paths use `work_take_ready`: reserve access-index storage before changing state/output, reject dispatch wrap, then issue revision/profile/dispatch tickets. Observe/finish reject cancelled or stale tickets. Cancellation invalidates outstanding tickets without freeing payloads. The pump is synchronous/coordinator-owned; workers cannot reset its graph revision. Terminal resource failure gates later requests and pumps instead of replaying work or diagnosing a cycle. |
| `compiler/compiler_kernel.tower`, `library/work_pool.tower`, `compiler/semantic_context.tower`: dispatch/admit/release | The same byte budget and nested extra-lane reservation precede dispatch. Inline and threaded batch paths borrow the same stable array. Threaded dispatch defers draining admitted peers even on partial submission failure. Busy-on-entry does not join another owner's jobs; this caller establishes an empty pool through `sem_workers_admit_result` before dispatch. Lane grants survive joins and stage publication; release requires no running workers. |
| `library/entity_stage.tower`; pump cleanup | Lease denial leaves its stage in the owned batch for discard. After dispatch joins, checked holds run before closing the input view. Hold failure preserves an earlier dispatch cause; cleanup discards still-private stages while the view remains live, then cancels tickets, returns lanes and frees batch storage. Successful publication consumes the stage and clears its pointer; later graph failure must not discard it again. Stage hold/discard retain their existing cancellable-reference contract; this patch adds no new queued payload type. |
| `compiler/semantic_support.tower`, `semantic_context.tower`, `semantic_query_pipeline.tower`, `semantic_evaluation.tower`, `semantic_declarations.tower`, `semantic_lifecycle.tower`, `semantic_layout.tower` | Resource restoration preserves the first typed receipt and canonical owner offset. A failed executable request stops its waiting evaluation; body/executable producers are pumped without blocking a worker or recursively completing it. Declaration failure walking restores the executable's retained worker cause. Context teardown closes/drains the shared pool in layout disposal before releasing executable vectors and the graph. The alias caller gap above is the exception found in joined readiness publication. |

The 256-entry window bounds pointer storage, not job payloads or total RSS.
On native x64 its maximum retained pointer allocation is 2,080 B and the
128-to-256 replacement peak is 3,136 B; target width does not change the native
host pointer size. Persistent reads/aliases, ledger metadata and foreign allocator
overhead are separate. Publication is transactional per stage, not whole-wave
structural rollback: the existing observe/finish denial tests intentionally allow
owned published nodes while forbidding that result's ready input.

## Registration and evidence boundary

`semantic_executable_admission_checks.tower` imports the real production pump.
`cmake/TowerWorkPolicyTests.cmake` removes the duplicate semantics object/library
and registers all 15 selectors with their original 60-second deadlines. Each
selector covers target pointer widths 4/8 and workers 1/4. The new `batch` case
denies initial world-ledger capacity; `batch-partial` admits the measured first
lease plus pointer allocation and denies the next stage. They check exact
Capacity/offset, no ready input, returned grants/entity counts, terminal retry,
fresh-context recovery in the same world, empty-pump retention and final zero
ownership. Other selectors cover graph growth, dispatch overflow, pin denial,
signature admission and joined observe/finish failure.

[A2's source/build-bound receipt](compiler_executable_batch_fcaad5a6.md) reports
15/15 selectors, query-smoke and lifecycle checks on merge `478353f9`, with
unchanged evidence reused through `284019bc`/`a2bd2987`. Its merged healthy n1
samples at workers 1/4 are respectively wall/CPU 0.510/0.452 s and 0.580/0.572 s,
peak RSS 176,464/179,488 KiB and zero teardown. Those are **owner measurements**;
the earlier paired n3 comparison remains attached to its original inputs. Neither
these timings nor a four-worker setting alone proves overlap or speedup.

Additional test source inspected: `tests/work_buffer.tower` covers transactional
capacity growth, wrong owner, overflow, stale copied receipt, retry and zero
grants; `work_buffer_faults.tower` covers ledger/physical `Memory` denial and
preserved allocation identity under the serial fault allocator. They are
registered in the existing work/policy harnesses. No execution receipt for this
frozen review is claimed for those helpers. The 15 executable selectors do not
directly deny an 8-to-16 batch growth, force allocator `Memory` on that batch,
inject a stale graph revision mid-pump, or cover the alias finding above. These
remain coverage limits, not passes or evidence of universal race freedom.

Reviewed repair-file SHA256:

| File | SHA256 |
| --- | --- |
| `semantic_execution_work.tower` | `6b0d3cf5285587c8c8e3796bd54611bf16de6af5d7ce4461618cbfc77e59fd95` |
| `semantic_executable_admission_checks.tower` | `60263a39cb175129f59e09118bc13a76135b3f69eb60cbe43014ff4089e61580` |
| `TowerWorkPolicyTests.cmake` | `952d814d4f7940a86ee42494f598fc0a86bbee18736a68bb5183184344f695ae` |

This turn changes documentation only, so runtime before/after profiling is
inapplicable. No owned build/test jobs were started; the initial inspection found
the cache idle and 340,414,099,456 B free. Later incoming source is outside the
freeze. ROOT retains integrated instrumentation, reactor and deployment ownership.
