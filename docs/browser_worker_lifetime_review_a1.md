# A1 independent browser worker lifetime review

Frozen published source: `f0485e83c8a91d355466236a4f3105d29a9f6783`.
Reviewed implementation `5aff643a33e8cf5a0bfa3a70ca8fdac733d38c91` against its
parent `ba52a932731a099b10bd16b60c16cd6af35fbf12`, then its final callers and
controls. No production edit, browser/compiler run or instrumentation occurred.

## Finding: retired coordinator errors can stop a replacement

`src/compiler-worker-group.mjs:53` registers `close` for coordinator `error`,
but unlike the message guard at line 56 it does not stop delivery when the group was
already closed. `close` merely returns in that state. The old `onerror` still
runs. `src/app.mjs:85` and `src/language-service.mjs:39` call `this.stop()` through
their reusable consumer, without checking that the event's worker is current.
That method terminates **the current worker** and rejects its pending request.

Concrete interleaving: worker A's failed module startup queues an error on the
page; a user/selection/preemption task cancels A and starts worker B; A's queued
error then reaches its retained handler, which stops B. The HTML processing model
queues startup errors on the outside global's DOM task source; terminating a
dedicated worker clears its own task queues and the outside **port-message** queue,
not that independently queued error task. This is a source/specification finding,
not a reproduced Chromium failure in this review. See the [worker processing and
termination algorithms](https://html.spec.whatwg.org/multipage/workers.html#worker-processing-model).

The reusable caller callbacks predate this repair; the new group closes children
correctly but does not close this stale-error boundary. Most execution/build
callbacks separately check `executionId`/`compilerBuildId`, or capture the exact
worker for retirement, so the concrete unguarded consumers are Engine and
LanguageService. Child failures arriving through the control helper after closure
already stop at `fail`'s closed guard.

Smallest proposed existing-boundary regression: extend `generation-retire` in
the current page ownership control to retire A, install replacement B, and deliver
an `ErrorEvent` to A at the page EventTarget boundary. Assert that A's consumer
callback is not invoked, B remains usable and its request is not rejected. Such
transport-only event injection checks the missing guard; it must not be labeled
a native queued-error timing reproduction. Retain the active coordinator-error
and child-startup-error controls: one original failure must still reach the active
caller. In particular, `fail` intentionally closes the group **before** dispatching
its synthetic error, so blindly dropping every error when `closed` is true would
break that existing contract. ROOT owns the narrow follow-up; no concurrent edit
or new test framework was introduced here. Regression remains unrun.

## Source and caller conclusions

Paths are relative to `playground/`; complete changed methods and their immediate
entry/disposal paths were read, not just the patch or hashes.

| Source | Reviewed contract |
| --- | --- |
| `src/compiler-worker-group.mjs` | Static module evaluation installs the coordinator's owner-port listener before requests are handled. The page sends that port before returning the worker to its caller. A distinct direct MessageChannel carries each child ABI; the page never schedules Tower jobs. Child handlers are installed before port transfer. Control messages create/terminate native page-owned workers, with a Map enforcing per-group capacity and duplicate-ID rejection. `closed` is set before shutdown requests; late control creates close their transferred port. Coordinator/child/message failures close all mapped children and the coordinator idempotently. The stale-error finding above is the exception to caller isolation. |
| `src/compiler-thread-worker.mjs`, `src/compiler-threads.mjs` | The child installs its port message handler before starting it. Coordinator listeners precede initialization sends; all ready replies and callback identities are checked before synchronous Wasm starts. Port startup/workerFactory returns run in one task, so the caller installs listeners before reply delivery. Capacity remains an integer 1..256 in compilerThreads and is additionally bounded by the page owner's capacity (production default 4); this is per group, not a page-wide CPU/RSS cap. Guest failure stores shared failure bytes/status and notifies waiters, independent of coordinator JS responsiveness. Initialization failures close already-created endpoints. Close requests termination; it is not a browser join. |
| `src/app.mjs` | Rebuild, inspection Engine, target warming, native compilation and execution all use the page factory. Build/execution replies retain generation checks. Idle/settling workers retain their explicit owner; direct cancellation terminates the group, while cooperative compilation settlement preserves a warm worker intentionally. Compiler selection and project changes keep existing stop paths. No guest heap is transferred into another generation. Engine's error callback needs the guard identified above. |
| `src/language-service.mjs` | One active request/latest queued request per consumer; completion preemption and active-document cancellation terminate the old group before pumping a replacement. Reply IDs and cancelled tasks prevent stale data publication; stop clears timers/queues. The bottom-of-module static import is still evaluated before module body execution. Error callbacks lack the corresponding worker identity check. |
| `src/worker.mjs`, `language-worker.mjs`, `execution-worker.mjs`, `target-worker.mjs`, `compiler-runtime.mjs`, `tower-host.mjs` | Worker-local runtimes and handles remain owned by the coordinator. Shared compiler selection goes through compilerThreads; portable modules return without creating a thread pool. Initialization/configuration failure and close release transport endpoints. Module/revision changes retire old cached compiler instances through their existing close paths. Nothing here turns termination requests into proof that native workers have retired. |
| `src/compiler-build-worker.mjs`, `compiler-build.mjs`, `compiler-pool.mjs`, `compiler-unit.mjs`, `llvm-host.mjs` | The LLVM unit pool remains separate and unchanged: independent module instances/files, copied immutable inputs and transferred output bytes; Tower CompilerWork owns admission/order, and messages validate unit/revision/profile. LLVM uses loadLLVM, not compilerThreads. Pool close rejects pending tasks; compilation finally cancels work, awaits pool close and closes the work handle. Node terminate promises are awaited; browser terminate returns no retirement promise. These unit workers are not counted in the page group's Tower-thread capacity, and this review adds no LLVM-pool retirement evidence. |
| `scripts/build.mjs` and production worker URLs | Static imports bundle the helper into the app and affected worker entries; no separate helper asset is missing. Eight total entries include the isolation worker; seven compiler-facing entries were in B2's bundle-only receipt. Source `.mjs` transport selects the `.mjs` child, bundled `.js` transport the emitted `.js` child. Actual app tests exercise the static bundle, unlike the direct strict harness. |
| `tests/compiler-failure-worker.mjs`, `shared_compiler_worker.mjs`, `compiler_group_control.mjs`, `compiler_group_startup_worker.mjs` | The fault adapter's static import installs the handler before initial-port delivery, while the unchanged override traps actual wasi_thread_start. The shared fixture uses real Tower pool/query/staging/language work and closes endpoints in finally. Its local closed counter counts requests only. Partial-startup control acknowledges a received port while initialization stays queued. Generation control actually posts an old reply; it does not exercise a late error or an Engine/LanguageService replacement. |

The default Node worker_threads branch, direct parentPort adapter, argument
filtering and shared failure ABI are unchanged. No browser owner port is awaited
on that path. The LLVM pool, unit adapter, build-worker entry and LLVM loader are
byte-identical to the implementation parent; no new pool contract is inferred.

## Evidence identity and limits

The five production repair files, fault/shared/control fixtures, strict driver,
static-app test and build script match the published repair and B2's frozen
host `78d675c441cabba99f05276656717e53d01ead6f` at this review freeze. Direct git
comparisons show no intervening changes to these paths. The four provider SHA256s
in [the repair receipt](browser_page_worker_repair_ba52a932.md) match current bytes:
helper `356a8ca9...bcc0bc5`, child `97fb8ea3...2427774`, thread transport
`d912cd1e...1ddcb2d`, fault adapter `5bda6fe5...8e0230`.
Historical candidate-to-repair archive comparisons are B2's evidence; those remote
raw archives were not independently reopened from A1. The unchanged work fixture
identity supports reuse of its controls, not acceptance of every new compiler.

| Owner receipt | Exact scope retained |
| --- | --- |
| [f167 prerequisite repair](browser_page_worker_repair_ba52a932.md) | Compiler `8e7e3d63...05eb4`, resources `67561156...264b`, work fixture `6411c389...4e32c`. Original failed 45s/120s trap-startup attempts remain failures. Static-import trap, partial startup and generation controls pass; three normal runs and four prior controls are reused at their recorded matching bytes. |
| [b8 adoption](browser_adoption_b8_78d675c4.md) | Compiler source `b8d65c37`, shared binary `d2e7a2ae...85e7c`, resources `a2e1902e...aac18`, same work fixture. Three fresh strict runs report 5/2/5 actual closes and zero CDP targets; four desktop/mobile static-app cases pass. These are B2's executions, not independent A1 reruns or current 25dddd04 reactor acceptance. |

The strict harness requires Playwright close events **and** zero same-context CDP
worker targets within one 30s retirement budget; it checks these before finally
closing the browser. Normal trials keep the coordinator responsive through a
retire probe, compare full serial/parallel canonical text before hashing it, and
retain known Graph/Fast outputs. The ownership controls separately test startup,
held-port startup, busy cancellation, live coordinator/child failure, shared guest
trap and retired reply suppression. Their promises/counters alone are not joins.

The four static-app tests establish isolation/shared-reactor use and execution of 42,
reload, and blocked-service-worker portable fallback. Their eventual page/context
closure is cleanup, not an asserted retirement test. They do not cover the stale
error interleaving. New b8 timings/capacities are acceptance costs, not a scaling
comparison or retained-allocation/RSS equivalence. ROOT's running 25dddd04 build,
hosted publication, other browsers and later compiler resources are excluded.

Documentation-only review: no runtime profiling or build was needed. A1's cache
was idle, disk 339,785,383,936 B free initially; no jobs were started and todo was
untouched. All earlier source and execution receipts remain intact.
