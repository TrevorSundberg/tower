# Page-owned compiler group: startup prerequisite repaired

The missing transition was the fault worker's initial MessagePort delivery, not
guest failure publication. Its awaited dynamic import allowed that message to
arrive before the browser handler existed. A static import fixes the adapter;
the unchanged `wasi_thread_start` trap now propagates through shared failure state.
The same page-owned production candidate can be retained: its three original
strict passes remain byte-matched, and shared-trap, partial-startup cancellation
and old-generation retirement now pass. This is frozen f167 acceptance, not
deployment or acceptance of later compiler sources.

## What changed

- `compiler-worker-group.mjs` is the **same** candidate from the preserved
  `80daea98...` patch. The page owns the coordinator and its bounded native
  compiler threads; MessagePorts carry the existing ABI directly. Parent failure
  or cancellation closes the entire group and prevents queued old messages from
  reaching callers. Browser app/language-service creation and the strict test
  use this hook. Tower budgets, graphs, leases and scheduling are untouched.
- `compiler-failure-worker.mjs` statically imports its ordinary adapter before
  accepting messages. The injected guest exception and expected failure remain
  unchanged. No new readiness worker, timer or scheduler is added.
- Focused browser controls can be selected with `ownership:MODE,...`. Labels
  expose coordinator startup, initialization sends, ready replies, guest entry
  and error return. Temporary production-worker instrumentation was removed.
- `compiler_group_startup_worker.mjs` holds a real received port before starting
  its incoming message loop. Its acknowledgement proves a child exists while
  guest initialization remains queued. Cancellation releases the whole group;
  no sleeps, fake guest workload or Tower semantic implementation is involved.
- The retiring coordinator posts a boundary message followed by an actual
  old-generation reply. The page cancels at the first message; the second must
  never reach the caller. A separate emitted label proves the second post
  actually occurred. The control also uses the production default worker factory.

The browser helper's lifetime state belongs to its page/coordinator, not a
cross-world cache. Native worker count remains capacity+1. Node retains its
existing transport, and the separate LLVM compiler-unit pool is unchanged.
The helper/worker/caller byte comparison against the old candidate passed before
and after validation; there is no second ownership design.

## First missing transition: retained before/after proof

One instrumented repeat of only `shared-trap` used the original awaited import.
All four port messages arrived before **any** adapter-import completion:

| Boundary | Observed timestamp interval, epoch ms |
| --- | --- |
| Coordinator queues initialization slots0–3 | 1795470275866.620–1795470275867.045 |
| Fault workers receive port, handler still null | 1795470275874.675–1795470275877.770 |
| Adapter import finishes | 1795470275883.005–1795470275890.235 |

The observer reports `port=true handler=object`, the initial null handler; there
are zero adapter port-attach, initialize, ready or guest-entry events. The normal
handler was installed only afterward. Thus the dispatched bootstrap message was
lost, leaving the coordinator's initialization queued on an unattached port.
The45s diagnostic guard ended this repeat; it remains FAILED, not a retirement
pass. The earlier120s failure at08d209fa remains independently retained.

Changing only the fault adapter to a static import produces the opposite order:
handler installed → port attached → initialize slot → ready, for all four
workers. The coordinator enters the existing Tower fixture; four actual guest
entries throw the unchanged injected error, the ordinary adapter publishes shared
failure, and the coordinator returns it. All five workers close, with zero CDP
targets. The before/after instrumentation and patches are retained separately.
No fake exception in the page or weakened failure assertion is used.

## Validation and measurements

Frozen runtime source f167c444; host repository base `ba52a932` plus this scoped
transport change. Linux6.18.33.2 WSL2, Node22.23.5, Playwright1.65.1,
Chromium159.0.8154.6/headless-shell1255, unchanged `{headless:true}` launch and
cross-origin isolation. CPU12–23/quota12/24GiB, B2's existing cache;924GiB free
at start. Owned jobs drained before changes and after execution. No compiler or
reactor rebuild, browser variant, forced GC or D2 trace-driver change.

| Current execution | Result | Wall s | Waited-child CPU s | Peak RSS KiB |
| --- | --- | ---: | ---: | ---: |
| Instrumented original trap control | FAIL, missing initial-port handoff | 45.066398 | 1.518551 | 202916 |
| Static-import trap, instrumented proof | PASS | 2.487863 | 1.453777 | 202108 |
| Final shared-trap + partial-startup + generation controls | PASS3/3 | 2.938851 | 1.858478 | 205184 |
| Existing Node trap test only | PASS1/1,0skips | 0.274434 | 0.243517 | 100240 |

Final controls each observe **five actual worker close events and zero targets**:

| Control | Before retirement-check wall ms | Independent requirement |
| --- | ---: | --- |
| Shared trap | 295.629 | Expected guest error and `sharedFailure=true` |
| Partial startup cancellation | 244.033 | Actual child port acknowledged; heldCount1, readyCount0, coordinator not ready |
| Generation retirement | 246.829 | Old reply actually posted, never delivered to retired caller |

The original30s retirement budget and capacity bounds remain. No page/browser
early close is accepted as retirement. Node's10s test deadline is unchanged;
four created Node workers emit four end events and the selected test exits
naturally. The test-name selection does not rerun the blocked Node T5 alias suite.

Reused evidence from [the previous candidate receipt](browser_page_worker_candidate_023955e1.md):
three fresh strict runs, each5/2/5 closes and zero targets, full serial/parallel
canonical text and Graph/Fast/output/query/budget checks; plus its four completed
startup/busy/coordinator-error/child-startup-error controls. Exact production
helper, both thread adapters, app/language-service callers and shared fixture
bytes match those runs. The failure adapter is used only by the trap controls,
which were rerun above. No normal matrix repetition or relabeling of the old
failed control is needed.

Those normal runs took6.049525/6.470020/6.411205s wall,
1.829615/1.952501/1.993595s waited-child CPU and205996/205516/205648KiB RSS.
Their compiler4 retirement wait was26.802/.693/26.565ms versus ROOT's original
30011.845ms failure. Workload time itself was slightly higher; this is a lifetime
repair, not a compiler throughput claim. Guest capacity remains33947648B pool,
90177536B serial compiler and97648640B parallel compiler. Capacity, retained
allocation and process RSS are different measures; no new allocator census or
race/sanitizer claim is made. Observer costs are included in the diagnostic runs.

Seven browser entry points also bundle successfully with the existing native
Windows esbuild. The first Linux bundle-only attempt failed because mounted
dependencies contain `@esbuild/win32-x64`; that failure is retained. Recovery used
the already installed matching tool, CPU affinity12–23 before a stdin start gate
and GOMAXPROCS4; no dependencies were installed. This is bundle validation only,
not a full UI/packaging/release build.

## Exact identities and scope

| Input/provider | SHA256 |
| --- | --- |
| Shared compiler | `8e7e3d637c6820c6d96204662dd4b6025722099e595ef3704f704125d7405eb4` |
| Work fixture | `6411c389b9610c293b98dcc844e00195fcfeecbf0b4e53b8c84189ef78d4e32c` |
| Serialized resources, all browser reports | `67561156ce8afa76460323b29d96ea5400603e31dabcf9dc9c080f5cdfea264b` |
| Chromium executable | `24eb0a14de64ab0c9c2e283a5512ca817db64af8fd853cdb4d818f19a8e23b9b` |
| Unchanged lifetime helper | `356a8ca9ace1aa6458cffab748be424ce5cee630c32ae9df99ab9c823bcc0bc5` |
| Unchanged production thread worker | `97fb8ea39d4f74ba10f3fb2624a1eb6a560871f68736bb3898c453db72427774` |
| Unchanged production thread transport | `d912cd1e3b44114d55f9e5e74a43d8e8a572f9030ef39332aa197c1a21ddcb2d` |
| Fixed fault adapter | `5bda6fe5c03b1e371ad06d607d31e3b89371161d2e08357ed8abeaea328e0230` |

Raw before/after sources, frozen source tree, commands, reports, worker events,
bundle logs, manifests and patches:
`C:\Sandbox\build\codex_ecs_20261122\B2\page_worker_repair_ba52a932`
and `/cache/page_worker_repair_ba52a932`. Original candidate/ROOT archives remain
unchanged. Later compiler resources and current-successor acceptance, hosted
service-worker isolation, other hosts and final runtime/Pages publication remain
ROOT-owned. These checks establish the scoped f167 lifetime contract, not general
race freedom or closure of the separate Node alias gate.
