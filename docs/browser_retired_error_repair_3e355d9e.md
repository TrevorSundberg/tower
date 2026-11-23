# Retired coordinator error isolation

Fixed the event-delivery defect from the [independent review](browser_worker_lifetime_review_a1.md).
Frozen host/resources: `3e355d9e` plus this transport/fixture patch. No compiler
build, semantic change, app bundle build, broad UI suite or deployment.

## Boundary and repair

An old coordinator's `error` handler previously ran after group retirement.
Engine and LanguageService's reusable callbacks then called `stop()` on their
current replacement. The group already suppressed stale `message`, but not
`error` or raw `messageerror` delivery.

The production group's first error listener now suppresses errors if already
closed; otherwise it closes every child, control port and coordinator before
the owner receives that first error. Child/control/message failures dispatch
their synthetic error while the group is active, through the same listener.
This replaces the old close-before-dispatch ordering, which would otherwise
hide the valid first synthesized failure. The messageerror listener consumes
the raw event and forwards its first active failure through error once.
Reentrant or queued repeats see the closed state. Explicit cancellation still
closes without reporting a failure; termination requests remain asynchronous.

Both actual callers use this factory and receive the guarded Worker. No extra
Engine/LanguageService generation mechanism is needed. Default Node transport,
child ABI, shared failure state, LLVM unit pool and those callers are unchanged.
Static imports already bundle this helper into the production entrypoints;
this turn tests its served module, not rebuilt production bundles.

## Reproduction and controls

The registered `retired-errors` ownership control initializes A and its four
threads, retires A, starts B and waits for B's real start probe. It delivers two
ErrorEvents, two messageerror events and one message to A's page EventTarget.
Old callbacks deliberately model the actual reusable owner's stop of B. On the
original helper, both errors and both messageerrors reach the callbacks and stop
B: nonzero failure, six actual close events, zero remaining CDP worker targets.
The first development attempt assigned `onmessageerror`; the final control uses
an actual EventTarget listener and observes both kinds. Both failed logs remain.

With the repair, no retired event reaches its caller. B runs both existing Tower
pool lifecycle iterations (24 actual thread spawns, four opened/four closed
transport endpoints); ten actual browser workers close and CDP reports zero.
This is controlled event delivery, **not** a native queued-error timing
reproduction. It proves the generic boundary used by the callers; it does not
instantiate the full Engine or LanguageService UI.

All nine ownership controls pass in one invocation:

| Control | Actual worker closes | Owner error deliveries / specific evidence |
| --- | ---: | --- |
| startup-cancel | 1 | 0; initialization never completed |
| partial-startup-cancel | 5 | 0; held port1, ready threads0 |
| busy-cancel | 5 | 0; existing lr_work_tests progress cancellation |
| coordinator-error | 5 | 1; original uncaught coordinator failure |
| coordinator-messageerror | 5 | 1; active raw event becomes the expected error |
| startup-error | 5 | 1; original missing child startup failure |
| shared-trap | 5 | Original real guest exception and sharedFailure=true |
| generation-retire | 5 | Old reply actually posted and never delivered |
| retired-errors | 10 | No stale callbacks; successful replacement Tower work |

Active-error controls also deliver reentrant duplicate error/messageerror events
after the first callback; error count remains exactly one. Every control retains
the original 180s work/30s retirement bounds, actual close events **and** zero
same-context CDP targets before browser cleanup. No page close is a pass oracle.

## Frozen executables, measurements and scope

- Executable source `b8d65c37d9dd4ef691d700d0d0a52c81e01b593a`:
  shared compiler SHA256 `d2e7a2ae4bcfba916b684321b56aca96c2b2385c976523ece7b3f09899785e7c`;
  work fixture `6411c389b9610c293b98dcc844e00195fcfeecbf0b4e53b8c84189ef78d4e32c`.
- Mounted resource JSON hash before/after:
  `2a01c208bdc890e2e5bdb785c0752c5289d8d9e737af17fe66db332cecbc17ef`.
  This is current resource identity, not b8 compiler-source identity or acceptance
  of later producers. ROOT's 25 reactor/LLVM memory investigation is excluded.
- Windows 11/KinmenA, Node21.7.3, Playwright1.65.1, installed headless
  Chromium159.0.8154.6/build1255, binary SHA256
  `b23921f57bcff971495917b208b63df393788525120c6ce23a79c1e3e1583114`.
  Local npm installation emitted newer-Node warnings for unused dependencies;
  Playwright's own Node>=20 requirement is met. No package/lockfile changes.
- CPU12-23 inherited affinity, Windows job24GiB committed-memory cap, one process
  tree at a time. OS-only PowerShell/native job accounting records the Node and
  all inherited browser children, including exited-process CPU. Aggregate RSS
  is sampled around every20ms and can double-count shared pages; it is not an
  exact simultaneous maximum. Job peak commit is a separate kernel counter.
  Each measured job has six OS processes total and zero active at exit; browser
  workers are threads/targets, not six additional OS processes per group.

| Invocation, n1 fresh browser/warm filesystem | Result | Wall s | Job CPU s | Sampled aggregate peak RSS KiB | Peak job commit KiB |
| --- | --- | ---: | ---: | ---: | ---: |
| Original final retired-events control | FAIL, expected reproduction | 1.041469 | 1.468750 | 413464 | 357444 |
| Original healthy pool/serial/four | PASS | 4.187254 | 6.140625 | 589152 | 581852 |
| Repaired nine ownership controls | PASS9/9 | 4.966186 | 4.687500 | 556260 | 490008 |
| Repaired healthy pool/serial/four | PASS | 4.259422 | 6.031250 | 571672 | 563932 |

Healthy before/after uses identical binaries, resource/fixture hashes and checked
outputs. In each invocation the three language fixtures compare Graph/Fast known
output and full canonical Foundation at one/four workers; before/after result
records (including canonical hashes) also match. Pool/serial/four observe5/2/5
actual closes and zero targets. Serial trial1.048355 ->1.047630s; four-worker
trial2.112401 ->2.126779s. Four-worker includes extra Tower checks, so this is not
a scaling comparison. Total healthy wall cost is about1.7% higher in one sample;
no speedup or significant regression claim follows from that noise-sized delta.

Wasm capacities finish identically: pool33947648B, serial90374144B,
four97976320B. B's two replacement iterations grow8388608 ->33947648B then stay
there. These are linear-memory capacities, not retained allocations or RSS.
Endpoint counts, actual closes, zero targets and drained OS jobs establish this
lifetime boundary; no invented global allocation census or universal race proof.

Raw reports, stdout/stderr, original helper, input hashes and OS measurement
launcher: `C:/Sandbox/build/codex_ecs_20261122/A1/retired_errors_3e355d9e`.
Run `measure_browser.ps1 -Name NAME [-Selection ownership:retired-errors]`;
the recorded commands invoke the existing `test-shared-compiler.mjs` with both
absolute b8 paths. `ownership` runs all controls; no selector runs the healthy
pool/serial/four checks. The outer240s process guard never fires or changes a pass.
Source syntax checks and diff checks pass. Owned jobs are drained; todo unchanged.
ROOT retains rebuilt bundles, later reactor adoption, other browsers and release.
