# Page-owned compiler worker candidate: not shipped

The page-owned MessagePort candidate passed three fresh strict f167 browser
trials, including real5/2/5 close events, zero targets and complete canonical
comparisons. Four ownership controls also passed. The shared worker-trap control
then failed to complete before the finite aggregate guard; generation retirement
was unstarted. **The required gates are incomplete, so all candidate source edits
were restored.** This receipt does not close Linux browser acceptance or establish
the cause of Chromium's retained coordinator target.

## Frozen boundary and one candidate

Started from published host main `023955e1` after the required pull, idle owned
container,924GiB cache free, CPU12–23/quota12/24GiB. No compiler build. Compared
against ROOT's retained `/cache/root_retirement_20261123_2116/report.json` and
Windows copy `C:/Sandbox/build/codex_ecs_20261122/ROOT_retirement_20261123_2116`.
That original strict run completes pool4/compiler1 with5/2 closes and zero
targets. Compiler4 completes Tower work, child close events and the retire probe,
then its coordinator target remains after30s. Reported total36.33s wall/4.44s CPU;
peak RSS was not captured. Initial ROOT setup failures remain separate.

Candidate tests use a separate copy of the preserved f167 source package, with
only candidate browser transport/test files overlaid. Exact identities:

| Input | SHA256 |
| --- | --- |
| Frozen f167 compiler | `8e7e3d637c6820c6d96204662dd4b6025722099e595ef3704f704125d7405eb4` |
| Work fixture | `6411c389b9610c293b98dcc844e00195fcfeecbf0b4e53b8c84189ef78d4e32c` |
| Serialized resources, every report | `67561156ce8afa76460323b29d96ea5400603e31dabcf9dc9c080f5cdfea264b` |
| Chromium executable | `24eb0a14de64ab0c9c2e283a5512ca817db64af8fd853cdb4d818f19a8e23b9b` |

Chromium159.0.8154.6/headless-shell1255, Playwright1.65.1, Node22.23.5, Linux
6.18.33.2 WSL2. Original `chromium.launch({headless:true})`, COOP/COEP isolation,
fixture inputs and30s retirement budget. The normal strict driver still counts
exactly capacity+1 actual workers, requires every close event and zero same-context
CDP worker targets, and compares full serial/parallel canonical and Graph/Fast
results before replacing text with hashes. No early page close, target filtering,
forced GC, alternate browser channel or cooperative-READY retirement change.

The sole candidate added a browser lifetime helper. The page created the
coordinator and all compiler-thread Workers; one control MessageChannel carried
create/terminate requests, and one direct MessageChannel per compiler thread
carried the existing ABI messages. Job traffic did not relay through the page.
The coordinator's existing `workerFactory` received port-backed worker endpoints;
Tower admission, shared memory, WorkGraph, leases and scheduling were unchanged.
The page retained native Worker handles, bounded active children to declared
capacity, closed children on coordinator error/termination and suppressed queued
messages from a closed group. Browser compiler defaults, app and language-service
creation sites, the shared fixture and strict driver used the same ownership hook.
Node transport was untouched. Production UI bundling/release was not run.

This changes native ownership from nested children to page siblings; it does not
add worker threads. Strict observation confirms the same capacity+1 actual workers.
The raw reports do not contain a live CDP parent-hierarchy snapshot: ownership
topology is established by the candidate creation path, not inferred from a
remaining target's title or OS thread names.

## Strict matched results

Each fresh process/browser ran existing pool4, compiler1 and compiler4 work once.
Original artifacts/resources and completed Tower checks match; pool spawns24,
compiler1 spawns0, compiler4 spawns785 in all three candidate reports.

| Run | Result | Process wall s | Waited-child CPU s | Peak RSS KiB |
| --- | --- | ---: | ---: | ---: |
| Candidate1 | PASS,5/2/5 closes and zero targets | 6.049525 | 1.829615 | 205996 |
| Candidate2 | PASS,5/2/5 closes and zero targets | 6.470020 | 1.952501 | 205516 |
| Candidate3 | PASS,5/2/5 closes and zero targets | 6.411205 | 1.993595 | 205648 |

Wall milliseconds include each workload before its final CDP retirement check:

| Workload | ROOT original | Candidate1 | Candidate2 | Candidate3 |
| --- | ---: | ---: | ---: | ---: |
| Pool4 | 309.137 | 313.537 | 319.714 | 345.034 |
| Compiler1 | 1035.593 | 1034.576 | 1064.787 | 1148.213 |
| Compiler4 | 2536.942 | 2592.395 | 2896.401 | 2638.686 |
| Compiler4 final target-close wait | 30011.845, FAIL | 26.802 | 0.693 | 26.565 |

The observed successful retirement removes the30s failure wait in these trials;
it is not a throughput speedup claim. Candidate compiler4 workload time is
slightly higher than the one original sample. There is no isolated MessagePort
microbenchmark or statistical overhead estimate. CPU/RSS use existing
`process_profile` waited-child accounting, not aggregate browser-tree sampling;
ROOT's shell CPU measurement is not a matched profiler baseline.

Wasm capacity peaks are identical before/after: pool33947648B,
compiler1 90177536B, compiler4 97648640B. Capacity is not retained allocation or
RSS. These trials retain the existing budget/world/query/stale/cancel assertions
and the three actual Tower language fixtures; no additional semantic matrix ran.

## Ownership controls and failed gate

The same helper was then exercised with browser-only ownership fault transport;
guest work remains the existing Tower fixture. The strict script gained an
`ownership` selection for these controls; normal assertions were unchanged.

| Control | Outcome | Wall ms before retirement check | Actual closes / remaining targets |
| --- | --- | ---: | --- |
| Cancel during startup creation request | PASS, no ready reply | 261.862 | 1 / 0 |
| Cancel at actual compiler `lr_work_tests` phase | PASS, no result forwarded | 487.691 | 5 / 0 |
| Uncaught coordinator failure after thread startup | PASS, expected error propagated | 243.013 | 5 / 0 |
| Child module startup failure | PASS, expected error propagated | 229.508 | 5 / 0 |
| Shared guest-thread trap propagation | FAILED to complete | aggregate guard | Not established |
| Old-generation reply suppression/retirement | UNSTARTED | — | — |

Startup cancellation observed only the coordinator, so it does not prove
cancellation of a partially initialized child. Child startup failure separately
observed all five actual workers closing. Busy cancellation uses the real LR
fixture progress boundary; no synthetic sleep or fake guest work was added.

The shared-trap control reuses `compiler-failure-worker.mjs`, the existing Node
fault adapter that replaces `wasi_thread_start` with an injected trap. No expected
shared-failure result returned. At120.073s the finite120s aggregate guard closed
the process/browser, producing `page.evaluate: Target page, context or browser
has been closed`; wrapper status1. Total2.326883s waited-child CPU,207756KiB RSS.
This forced close is **not** a passing retirement observation. The earlier four
controls completed their close/zero-target assertions before the guard fired.

The first observed uncompleted transition is delivery of the shared-trap
control's result/error. Its instrumentation does not distinguish waiting for
`compilerThreads` startup from waiting inside the guest call; no native shutdown
transition or Tower race is identified. Source review notes that the fault
adapter installs its browser handler through a top-level awaited dynamic import,
whereas the new transport sends its MessagePort at creation. Lost early port
delivery is a possible test-transport issue, **not a reproduced cause**. There
was no second control attempt, modified failure adapter or timeout extension.
Before retaining this ownership remedy, that exact failure-path handshake and
generation gate still need independent completion; three normal passes cannot
waive them. D2's optional native trace work is independent and untouched.

## Preservation and restoration

All candidate sources, initial/final patches, frozen Tower resources, scripts,
reports, logs and manifests remain at
`C:\Sandbox\build\codex_ecs_20261122\B2\page_workers_023955e1`
and `/cache/page_workers_023955e1`. ROOT's original archive/report remain intact.
Useful SHA256 identities:

| Evidence | SHA256 |
| --- | --- |
| Candidate lifetime helper | `356a8ca9ace1aa6458cffab748be424ce5cee630c32ae9df99ab9c823bcc0bc5` |
| Final rejected tracked patch | `80daea98d30b82cc5fad216dd1f0d86d3db8814b1ddd508b9d2fbfec0fb85116` |
| Ownership report | `4636385f15fe7445fbf454d6a4902b9af5622e5a25d5c4209cabb4c1e8f0f629` |
| Ownership log | `d775bac6dc56155708e07b30f846283864c6a174b6e32e74b95811313a6c8883` |

After draining the owned processes, restored exactly the six candidate-modified
tracked browser files and removed only the two new candidate files after copying
them to evidence. `git diff --exit-code HEAD -- playground/src playground/tests
playground/scripts` passed. D2 diagnostic files, compiler/Tower sources, previous
Node T5 evidence and todo remain unchanged. Final shipped change is this receipt
and journal only. No production ownership fix, hosted adoption, browser gate
closure, Node rerun, compiler generation or sanitizer claim.
