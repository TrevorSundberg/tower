# Worker retirement boundary diagnosis

B2 adopted `48db0f27b439e9d0c7bb15e6f0c4beb932650e89` and ran four valid,
fresh, bounded browser controls. All retired five observed workers and reached
zero live CDP targets. The earlier intermittent gate failure was **not reproduced
under these observations and remains FAILED**. No Tower-only shutdown fault or
Chromium engine root cause is established. Runtime adapters and
`test-shared-compiler.mjs` are unchanged; ROOT owns their repair.

## Reusable reproduction and observations

`playground/scripts/diagnose-worker-retirement.mjs` runs one fresh browser trial:

```sh
export PLAYWRIGHT_BROWSERS_PATH=/cache/ms-playwright TOWER_REQUIRE_THREADS=1
node playground/scripts/diagnose-worker-retirement.mjs no-wasm \
  /cache/browser-shared/tower-work-tests.wasm no_wasm.json
node playground/scripts/diagnose-worker-retirement.mjs tower-direct \
  /cache/browser-shared/tower-work-tests.wasm tower_exact.json \
  /cache/shared_browser_f167c444/package/source
```

The no-Wasm control starts a coordinator and four nested workers, exchanges ready
messages, requests child termination, joins observed child close notifications,
exchanges the same retire probe, and calls parent `terminate()`. It contains no
compiler, pool or scheduler model. `tower-direct` uses the unchanged D2 coordinator
and actual standalone Tower work fixture, including both lifecycle invocations,
four-thread rendezvous, allocation/growth, cancellation/drain and work-order checks.
The optional source root serves frozen adapters and transfers the original
compiler-resource payload even though the pool branch does not consume it.
`tower` additionally wraps browser Worker calls for per-child event observations.

Reports retain browser-wide CDP target creation/destruction, Playwright worker
creation/close, parent terminate call/return, probe send/reply, source hashes and
OS thread snapshots. Browser `Worker.terminate()` returns **undefined**, not a
termination promise. The harness promises resolve on Playwright close events.
A coordinator-owned atomic scalar in the wrapped mode records reaching the
retire reply's microtask checkpoint; it does not claim native thread join.
If a target remains after one second, a post-termination message and bounded
inspector evaluation test responsiveness within the original30s retirement
deadline. Browser teardown occurs after the pre-teardown report; it cannot turn
a live-target failure into a pass.

The final direct trial sent the exact frozen resource JSON hash
`67561156ce8afa76460323b29d96ea5400603e31dabcf9dc9c080f5cdfea264b`, with
7993053 serialized payload bytes. It served the original frozen sources, not
later package adapters. Recorded sequence:

1. Four children emit Playwright close; the observed-close promise resolves.
2. Child CDP destruction notifications arrive through their separate session.
3. Parent sends retire probe; coordinator replies; parent calls `terminate()`.
4. `terminate()` returns undefined; coordinator emits close and CDP destruction.

The coordinator close followed its terminate call by about2.75ms; all five targets
were gone. The wrapped Tower trial also recorded the reply checkpoint as reached
before the parent terminate call. Four-thread Tower work completed with24 spawns.
These event orders are observations, not a cross-session ordering guarantee.
Additional CDP discovery/observer messages can perturb the intermittent race.

## First unsupported ownership handoff

There was **no differing failing lifecycle event** between the no-Wasm and Tower
controls in this sample. The earlier failure diverged after the retire reply and
parent termination request: the coordinator's close/destruction never arrived.
Neither that reply nor a child's close notification establishes that the parent's
native child registry has drained.

In Chromium159,
[WorkerThread shutdown](https://raw.githubusercontent.com/chromium/chromium/159.0.8154.6/third_party/blink/renderer/core/workers/worker_thread.cc)
has separate preparation and final shutdown, with final shutdown gated by child
thread accounting. The
[parent messaging proxy](https://raw.githubusercontent.com/chromium/chromium/159.0.8154.6/third_party/blink/renderer/core/workers/threaded_messaging_proxy_base.cc)
handles the later child-termination callback and removal from that accounting.
External close observations and a live JavaScript message loop are insufficient
to identify which internal transition, if any, stalls. This is a contract gap in
the evidence, not proof that a specific internal Chromium counter is stuck.

Correction to the previous receipt's stronger interpretation: a retained target,
an inspector timeout and sleeping `DedicatedWorker` names prove the strict gate
failed, but do **not** prove executable JavaScript context liveness, a Tower race,
or ownership of those OS threads. Idle/reused threads must be distinguished from
live contexts. All four controls here had zero live targets, five close events
and zero such OS threads at their pre-browser-teardown snapshot; no deliberate
idle-thread reuse experiment was performed.

Action for ROOT: keep the zero-live-target and close-event assertions. Do not add
arbitrary delays, treat a retire reply as a native join, or reuse either rejected
fix. For the next failing original run, correlate native
`PrepareForShutdownOnWorkerThread`, `PerformShutdownOnWorkerThread`,
`ThreadedMessagingProxyBase::WorkerThreadTerminated` and
`ChildThreadTerminatedOnWorkerThread` with this external timeline. That separates
unfinished native child teardown from a disposed context whose inspector target
is retained. A browser-owned join/lifetime remedy needs that distinction; another
Tower scheduler change is not justified by these observations.

## Identity, costs and limits

KinmenB `tower-b2-work`, CPU12-23/quota12/24GiB; one browser at a time.
Same Chromium159.0.8154.6 headless-shell1255, Playwright1.65.1, Node22.23.5,
exact launch options `{headless:true}`, COOP/COEP isolation. No browser variant,
runtime policy, fixture assertion or retirement budget change. No compiler build.

| Identity | SHA256 |
| --- | --- |
| Existing frozen B2 work Wasm | `6411c389b9610c293b98dcc844e00195fcfeecbf0b4e53b8c84189ef78d4e32c` |
| Frozen browser executable | `24eb0a14de64ab0c9c2e283a5512ca817db64af8fd853cdb4d818f19a8e23b9b` |
| D2 strict script, unchanged | `bc41120de240a53d4fe695f5cf89348fb96af3f393175b9163bc9814e4eef548` |
| D2 coordinator, unchanged | `415a38883bb85f08f0220d91ca211e6b68e5d912ae095c0b4e858a48719cdb0d` |
| Final diagnostic driver | `e41be545507565a6b2a8d0d327121720fdbaf428bb1bcdf28ac057c2b1842c48` |
| Final boundary worker | `58b90415e1eb394e6db3c02977f887f2ded0513438d8d168f9ab54c23fcfbc52` |

Git comparison confirms the strict script, coordinator and both worker adapters
are byte-identical from `fa65b305` through the B2 freeze. D2's historical accepted
`984dc4d75ad49da9ab008f828595ea53d3c96c52` report records work SHA
`a1f9a66e310478ff2e27b650f865c2896f3cbafb92e1bfb96186f9435d4ca3b0` and shared
compiler SHA `9158d62ff1e4026a52d0ca87edc33d12534ad49aaeea37cbdf3ffaa2348743e5`.
Those are historical reported identities, not binaries rehashed or rerun here;
the D2 artifact is not in the local handoff directory. Its host was a two-core
Steam Deck partition, unlike B2's12 logical CPUs. B2's WorkPool includes the
subsequent optional observer ABI. Neither host nor artifact differences establish
causality. The actual Tower fixture source and shutdown protocol remain unchanged.

| Fresh trial | Result | Process wall s | Waited-child CPU s | Peak RSS KiB |
| --- | --- | ---: | ---: | ---: |
| No-Wasm control, initial observer | PASS |2.093|1.029|125188|
| Tower with ready observation wrapper | PASS |1.757|0.842|128676|
| Unchanged coordinator, minimal payload | PASS |1.738|0.836|125100|
| Unchanged coordinator, exact frozen payload | PASS |2.676|1.478|199696|

One additional initial Tower diagnostic was interrupted after143.444s of startup
inactivity (0.990s CPU/124716KiB). Its dynamic import could receive the start probe
before installing the fixture handler. No child worker was observed and no Tower
pool result ran. The original diagnostic/report/error are retained, not counted
as a Tower failure or pass. An explicit wrapper-ready handshake fixed that
diagnostic startup hazard. An initial observer microtask ran between event
listeners; only the corrected reply-checkpoint scalar is treated as a reply
completion observation. The final direct mode bypasses that wrapper entirely.

These are n1 diagnostic costs, not scaling results. Different observation/payload
work prevents throughput comparisons. The exact-payload Tower Wasm capacity grew
from8388608 to33947648bytes and stayed there across its two calls; capacity is not
retained allocation or RSS. CPU/RSS use the existing process profiler's waited-child
accounting, not aggregate browser-tree accounting. New failure-only liveness
probing did not trigger in successful controls. No release gate, Node follow-on,
compiler canonical matrix, sanitizer or hosted acceptance is promoted to PASS.

Raw inputs, reports, source revisions, identities and commands are in
`C:\Sandbox\build\codex_ecs_20261122\B2\worker_boundary_48db0f27`.
The original blocked archive/hash7382481192a567d0ecfdb8e019ec0ab10d9020934d12488849aa4fe9ea5e6aff
and every earlier failed/rejected receipt remain intact.

## D2 optional native-trace transport — c93ddaab source boundary

`TOWER_WORKER_TRACE=/absolute/new-file.json` now requests browser-wide CDP JSON
tracing in the existing diagnostic. It is optional; the strict acceptance script,
worker adapters, boundary worker and30s retirement deadline are unchanged.
For ROOT's next diagnostic, use a new trace/report path:

```sh
TOWER_WORKER_TRACE=/logs/retirement.trace.json \
node playground/scripts/diagnose-worker-retirement.mjs tower-direct \
  /cache/browser-shared/tower-work-tests.wasm /logs/retirement.json \
  /cache/shared_browser_f167c444/package/source
```

Capture is requested before page/worker creation. Requested categories are
`blink.worker`, `devtools.timeline`, `disabled-by-default-devtools.timeline` and
`toplevel`. The report retains the advertised category inventory, unadvertised
requested categories, actual `(category,name,count)` tuples, buffer usage,
completion/data-loss flags, byte count, SHA256 and phase-specific errors. Category
names are filters, not evidence of an observed shutdown transition. A CDP clock
sync marker is bracketed by the existing epoch-time observations; trace timestamps
must not be compared directly to epoch milliseconds without clock correlation.

The buffer is4MiB, `recordUntilFull`; streamed JSON is capped at16MiB, read in64KiB
chunks. Trace command startup and final flush each have a5s budget, separate from
and without extending retirement. Full buffers/data loss and incomplete/oversize
streams cannot establish the missing native interval. The trace uses exclusive
file creation, preserving an existing file. Stop/drain/file-close precede browser
close in the diagnostic's `finally`, including failed retirement. Trace errors
cause nonzero exit and `passed:false`, independently of `retirementPassed`.
Report writing also has browser/server cleanup in `finally`; teardown never makes
a failed retirement pass. No GC/page-close/target-filter remedy was introduced.

Source inspection used D2's previously fetched Chromium159 WorkerThread file,
SHA256 `85f07dd1bfc18c7dcf6524b5b233bd31b4ad20106d0187d2cd75c7f85851cac8`,
under `build/d2_ecs/browser_retirement/chromium_worker_thread.cc`. Its only explicit
trace call is `TRACE_EVENT0("blink.worker", "WorkerThread::InitializeWorkerContext")`.
`Terminate`, `PrepareForShutdownOnWorkerThread`, `PerformShutdownOnWorkerThread`
and `ChildThreadTerminatedOnWorkerThread` contain no explicit trace calls in that
file. Enclosing task events would not prove these methods completed. Fresh requests
for both supplied raw Chromium sources returned HTTP429 and were not retried;
no local `threaded_messaging_proxy_base.cc` copy was available. Its exact
`WorkerThreadTerminated` event instrumentation remains unverified. Do not infer
absence across the entire release binary from this one inspected source file.

**Single Deck smoke: trace acceptance FAILED, native event capture unvalidated.**
On Chromium159.0.8154.6/headless-shell1255 (executable SHA24eb0a14de64ab0c9c2e283a5512ca817db64af8fd853cdb4d818f19a8e23b9b),
Playwright1.65.1/Node22.23.5, Docker CPU0,2/8GiB, the no-Wasm control closed all five
workers and observed zero targets, with isolation true. However `getCategories`
returned an empty array before renderer creation. The first diagnostic version
incorrectly rejected that inventory and never called `Tracing.start`; it returned
exit1, saved the explicit start error and an empty trace. This is not evidence
that Chromium lacks tracing or the requested categories. The final transport
removes that admission assumption and submits the requested filters, reporting
what is actually returned. Only syntax/source review covers that correction;
no second browser launch was made under this task's one-smoke bound.

Consequently there are **zero captured native events**, no measured shutdown
transition and no new release pass. Successful trace streaming, clock marker,
size/data-loss/flush failure paths remain pending ROOT's actual trace run. The
executed failure path did preserve the error/report/file and close the browser.
The old strict Linux failure and rejected lifetime candidates remain unchanged.

One fresh process, warm installed browser/fresh context, n1:1.34wall/1.38CPU
(1.04user+.34system)s,128800KiB GNU-time peakRSS, zero swaps; report observation
wall610.053ms. This is a failed transport-validation cost, not a performance
comparison or aggregate browser-tree memory measurement. No Wasm was executed;
the existing required work-path argument was only read/hashed. Original failed
report SHA0aaa61b8614c2123a1eb78d2e55a3d83d472aca5d512ef0f50d67a0c7be8e870
and all time/status/identity files remain in `build/d2_ecs/worker_trace_c93ddaab`.
Smoke driver SHA164adb34af637ef9f7bc245f4146bc00b1da8f84eb70f126702b71195a2fdf84;
final syntax-checked driver SHA023d1deee25bffeeb5ef938dd46689319ca287ef57db2f0961472e232e96401c.
