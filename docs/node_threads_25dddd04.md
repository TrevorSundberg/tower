# Node T5 adoption: joined shared reactor 25dddd04

2026-11-23, A1. **PASS3/3 in one unchanged invocation**, exit0, no skips,
cancellations, timeouts or unstarted cases. The128 pool lifecycles, injected
worker trap and complete workers1/2/4/8 dependency matrix all finish. This adopts
the supplied compiled25 reactor; it is not a browser rerun or current-source build.

## Frozen inputs and execution

ROOT supplied `root_shared_25dddd04` artifacts from compiled source `25dddd04`:

| Artifact | Bytes | SHA256 |
| --- | ---: | --- |
| `tower.wasm` | 1748245 | `671fb95d38cc1374f26c8b8563c6009806d3351f02141584a96b61bbf0fc402a` |
| `tower-work-tests.wasm` | 52252 | `6411c389b9610c293b98dcc844e00195fcfeecbf0b4e53b8c84189ef78d4e32c` |

Verified both supplied hashes before installing into this clone's ignored
`build/browser-wasi-threads/`. Preserved the entire previous eager pair in
`a1_t5_25dddd04/previous_b8`: compiler `d2e7a2ae...85e7c`, work `6411c389...4e32c`.
ROOT originals and earlier b8 logs are untouched. Both absolute overrides and
the third test's eager compiler read select the same new pair. Supplied,
installed and preserved bytes were rehashed after execution.

Mounted host/resource freeze is independently
`0fe314efe1b8d740a1be3fa829124e92d2cf1f6c`, tree
`5f01ec03a881310df6c084758fe54dce99588769`. Compiled25 includes the joined
alias-publication fix but excludes A2's125efb11 and later/in-flight B1/B2
producers. Newer mounted sources do not update the executable's providers.
The newer retired-browser-error repair is a host identity, not part of compiled25;
this run uses the default Node transport and makes no browser acceptance claim.

Exact command, from the repository root in the existing container:

```sh
cd /work
export TOWER_TEST_WASM=/work/build/browser-wasi-threads/tower.wasm
export TOWER_TEST_WORK_WASM=/work/build/browser-wasi-threads/tower-work-tests.wasm
export TOWER_REQUIRE_THREADS=1 TOWER_TEST_PHASES=1 NODE_DEBUG=worker
unset TOWER_INTERPRETER_ONLY TOWER_TEST_INTERPRETER_ONLY TOWER_TEST_PORTABLE_ONLY TOWER_TEST_LLVM_WASM NODE_OPTIONS
/usr/bin/time -v -o /cache/a1_t5_25dddd04/time.txt \
  /usr/bin/timeout --signal=TERM --kill-after=5s 180s \
  node --test --test-concurrency=1 --test-reporter=tap \
  playground/tests/compiler-threads.test.mjs
```

Original30s/10s/120s per-test deadlines, registrations and assertions remain
unchanged. No filters or shortcuts. Environment is retained; the outer180s guard
did not fire. KinmenA Windows11/WSL2 Linux6.18.54.1 x64, Node22.23.5,
`tower-a1-environment`, CPU12-23,24GiB, one process tree. Docker image remains
`sha256:ba707de6a29fd47e22b186ce711f82e51146fd0d38f7c557dadaf77f7e087156`.

## Completed cases and actual drain

| Registration | Result | TAP seconds |
| --- | --- | ---: |
| Real four-thread pool overlap/reuse | PASS; completed repetitions0-127 | 5.295210 |
| Injected shared worker trap | PASS; expected failure interrupts coordinator | 0.161854 |
| Declaration/body/lowering/staging matrix | PASS; completed capacities1,2,4,8 | 111.190725 |

Phase records show8 world checks,16 ordinary worker executions,16 generic
executions,272 dependency executions (17 fixtures,32/64 target widths,Graph/Fast,
four capacities),80 negative checks and16 imported-module executions. All four
LR/body-window/iteration checks, four source generators, compiler close phases
and closed-compiler API assertions complete. The17 dependency fixtures and exact
known/canonical/diagnostic assertions are the unchanged set detailed in the
[b8 receipt](node_threads_b8d65c37.md#actual-execution-and-drain), including lazy
and demanded generic bodies, aliases, layout/header/operator cycles, source-order
errors, cancellation ownership and imported queries. Full canonical text is
compared across modes/workers as originally registered; no LLVM or independent
canonical-reparse coverage is added by this test.

NODE_DEBUG records23 creations,23 termination requests and **23 actual end
events**, with identical worker-ID sets1-23. These are observed, not inferred
from requested lanes. Pool4/trap4/compiler1+2+4+8 explains those records. Every
compiler capacity reaches its final completion phase; Node exits naturally0.
Post-run process inventory contains no Node child and Docker returns to only
its idle `sleep infinity`. Termination requests alone are not the evidence.

GNU time: **116.80s wall,180.84s CPU** (47.51 user+133.33 system),
**518316KiB peak RSS**, zero swaps. One fresh process-tree sample, hash-warmed
files, with V8 startup/worker-debug/phase logging included. CPU covers waited
descendants; RSS is the waited process high-water mark, not summed concurrent
memory, Wasm capacity or live semantic allocations. No extra retained-owner
counter was added. The compiler matrix remains below its original120s deadline
with8.81s margin. These are adoption costs, not a throughput/scaling comparison
with the older b8 run, whose executable and mounted inputs differ.

## Receipts and limits

Raw command/environment, full phase/TAP/debug log, timing, exit, process snapshots,
phase counts, old pair and pre/post hashes:
`C:/Sandbox/build/codex_ecs_20261122/A1/cache/a1_t5_25dddd04`.
All1186 mounted Tower files,47 host modules,three selected test/helper files and
both selected artifacts revalidate unchanged after execution.

| Receipt | SHA256 |
| --- | --- |
| Tower resource manifest | `66f69f45a835d8e7e2e0c9b40eb63557874fc0346fcf6adbd2e6e62cc0326c73` |
| Host manifest | `f8e47f6c502b3d10ed550a7c05f42908ca7399aa63f3c080cf35221adc522475` |
| Selected test/helper manifest | `57400f012c9ef3d73b47b796414853005c5aeb203498ecbc4acdabd9734f6e34` |
| Unchanged test file | `b4e4f820e5a77321fd130991c73da9336e5e22b2f31940036ffe2badbaf59426` |
| Complete Node log | `a94d0425895cd5368a172c4b9785b3c7ccf4d0294db4224646dfaa15ad8c29ec` |

Free disk339099279360B before/339077795840B after; todo unchanged. No source,
fixture or assertion edit, compiler build, browser rerun, broad matrix or rejected
instrumentation. Documentation-only publication retains this exact executed
source/artifact boundary. ROOT owns newer-source builds and hosted release.
