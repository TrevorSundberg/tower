# Joined a06 shared-Wasm adoption: B2

PASS: the unchanged complete Node compiler-thread suite (3/3), one fresh strict
browser normal selection (pool4/compiler1/compiler4), and all nine ownership
selections. Each selection ran once, in that order; no failures, skips, timeouts,
unstarted modes, implementation changes or compiler/reactor/tool builds.

## Exact inputs

Compiled artifacts remain ROOT source
`a06ec4b1f9f44419882477bc1a55b6ed39e2200b`, public768/no override, as recorded in
the supplied SOURCE/complete32-entry manifest. Only the **two selected shared
files** were supplied and verified locally; unrelated LLVM/cross payloads were
neither required nor claimed verified. Both sizes/hashes matched before use,
after installation and after all checks. Previous b8 shared files remain intact
in `prior_threads` (compiler d2e7a2ae, work6411c389).

Host, fixtures and all1190 mounted Tower resources were frozen at published
`a18d584e29b79267bc03d099e70e214e48017b36` for every run. This includes later
test-only additions, not a compiler built from that checkout. A1's published
retired-error transport is used unchanged; the a06 artifacts adopt B1's WASI
budget gate. No artifact is relabeled as a later source build.

| Input | Bytes / SHA256 |
| --- | --- |
|Shared compiler|1750203; `2288da4b1b3e14935e665e454ddfe505983713a9dad93049ff98ea170e36c793`|
|Shared work fixture|52525; `c0747310ee756c4e76cc37b49594513d1e516752a0e082c4aff9b2d0d5f8108a`|
|Resource JSON|`9467a903c169eccae55965a0f34737bc73ddce9d5f1eea27143daf2e37e8a82c`|
|1190-file Tower hash manifest|`7c33277efa4cecf65985fe5ca9a58caffafb025546863b455dbc03358f8887fd`|
|146-file host/test/script hash manifest|`9fd64f990e44fb9ee6edbbe64c75a6de45bcc586acf82d42be250df3071d891c`|
|Frozen host/resource source archive|`13aed132f86adbcff261e9ca3eedd71015b64581e8684879876e5ffaabffe3e4`|
|Chromium headless executable|`24eb0a14de64ab0c9c2e283a5512ca817db64af8fd853cdb4d818f19a8e23b9b`|
|Node executable|`2f822d544601dfff107f57d945b649d15c5bf6302595735a6bd9cdc7ee9669bd`|

Both actual Wasm modules import `env.memory`, `wasi.thread-spawn` and the
`work_host_available/capacity/entry/check/time/heap_enter/heap_leave` transport
functions. Full imports/exports are retained in `imports.json`. Positive shared
instantiation/overlap is tested, not inferred solely from those import names.

KinmenB Docker `tower-b2-work`, Linux6.18.33.2 WSL2 x64, Node22.23.5,
Playwright1.65.1, Chromium159.0.8154.6/headless-shell1255, unchanged
`chromium.launch({headless:true})`. CPU12–23/quota12/24GiB; browser reports12
hardware threads, isolation and SharedArrayBuffer. One process tree/browser at
a time; jobs drained between selections. Initial free disk923GiB cache/~110GiB
host. No sibling cache use, static packaging, deployment or alternate browser.

## Complete Node selection

```sh
cd /work
export TOWER_TEST_WASM=/work/build/browser-wasi-threads/tower.wasm
export TOWER_TEST_WORK_WASM=/work/build/browser-wasi-threads/tower-work-tests.wasm
export TOWER_REQUIRE_THREADS=1 TOWER_TEST_PHASES=1
NODE_DEBUG=worker /cache/process_profile \
  /usr/bin/timeout --signal=TERM --kill-after=5s 180s /usr/local/bin/node \
  --test --test-concurrency=1 --test-reporter=tap playground/tests/compiler-threads.test.mjs
```

Original per-test30/10/120-second guards and all assertions unchanged. Natural
exit0;3 tests,3 passes,0 failures/cancellations/skips. TAP durations:
pool5.228775s, shared trap0.163322s, full matrix103.229207s.

All128 pool lifecycle completions,1/2/4/8 capacities,8 world checks,16 ordinary
worker executions,16 generic executions,272 dependency executions,16 imported
module executions and80 invalid cases finish. Existing target widths, Graph/Fast,
complete canonical comparisons, known outputs, query cycles, captures, implicit
protocols and lifetime checks remain. The genuine injected guest trap propagates
through shared failure state. Worker-debug ID sets match exactly:23 created,
23 terminated,23 actual end events. Natural process exit and idle-only container
inventory independently confirm drain; requested termination alone is not used.

## Browser normal and ownership selections

```sh
export PLAYWRIGHT_BROWSERS_PATH=/cache/ms-playwright TOWER_REQUIRE_THREADS=1
node playground/scripts/test-shared-compiler.mjs "$TOWER_TEST_WASM" "$TOWER_TEST_WORK_WASM" REPORT.json
node playground/scripts/test-shared-compiler.mjs "$TOWER_TEST_WASM" "$TOWER_TEST_WORK_WASM" OWNERSHIP.json ownership
```

Each command used a fresh browser/context, existing local isolation server and
unchanged30-second retirement budget. Finite outer guards210s normal/180s
ownership did not fire. All input hashes remain identical across both and Node.

| Normal trial | Actual close events | Live worker targets after close | Child close / coordinator close ms | Peak observed Wasm capacity bytes |
| --- | ---: | ---: | --- | ---: |
|pool4|5|0|1.439 /0.621|33947648|
|compiler1|2|0|0.251 /0.526|85065728|
|compiler4|5|0|0.579 /26.972|91947008|

The standalone Tower pool proves distinct live four-worker overlap. The compiler
controls pass budget/world/query-wait/stale-ticket/cancellation checks and compare
the full canonical Foundation and expected output for `decltype_lazy_body`,
`decltype_generic_headers` and `comptime_flow`, Graph/Fast at1/4 workers. Each
compiler trial has six checked results. Children close before the coordinator's
retire probe and termination; no target filtering, early page close, GC or longer
retirement wait satisfies these assertions.

| Ownership mode | Actual close events | Live targets |
| --- | ---: | ---: |
|startup-cancel|1|0|
|partial-startup-cancel|4|0|
|busy-cancel|5|0|
|coordinator-error|5|0|
|coordinator-messageerror|5|0|
|startup-error|3|0|
|shared-trap|5|0|
|generation-retire|5|0|
|retired-errors|10|0|

Partial startup reaches the real OS-message boundary with one port held and zero
children ready, then closes all four actually created workers. Shared-trap retains
the real `wasi_thread_start` exception and `sharedFailure:true`. Active coordinator
error/messageerror/startup error is delivered once. Generation retirement drops
the queued old reply. Retired-error replacement executes real four-thread Tower
pool work; both groups close, with zero forwarded stale messages/errors. Controlled
DOM-event injection is not claimed as reproduction of every native queued-error
race. Historical old-transport failures are not erased by this bounded acceptance.

## Cost and limits

| Selection | Wall s | Waited CPU s | Process peak RSS KiB |
| --- | ---: | ---: | ---: |
|Node complete3|108.771478|175.003445|405044|
|Browser normal3|8.560291|2.326657|206288|
|Browser ownership9|9.511546|3.563915|214212|

Existing Tower `/cache/process_profile` wraps each bounded process tree. CPU
includes waited children; RSS is a process high-water, not aggregate concurrent
memory. Browser Wasm capacities above are retained linear-memory size, separately
from RSS and live ECS ownership. The transport's configured8MiB initial/2GiB
maximum shared memory is not a measured Node peak; Node has no additional
linear-capacity sampler here. Fixture initialization/work differs across modes,
so these are acceptance costs, not throughput/scaling comparisons.

All requested selections are complete with no remaining failure in this scoped
gate. ROOT's static UI, edited-source generations, public pin and hosted release
remain separate/pending; no full platform, packaging or sanitizer acceptance is
claimed. No production/test source changed, so runtime before/after profiling is
inapplicable.

Evidence and selected input copies:
`C:/Sandbox/build/codex_ecs_20261122/B2/shared_a06_a18d584e` and
`/cache/shared_a06_a18d584e`. Includes complete supplied manifest/SOURCE, preserved
prior bundle, frozen source archive, hashes verified again after all runs, import
inventory, exact wrappers/commands, Node phases/worker IDs, TAP log, both browser
JSON reports and boundary/error events. ROOT's original supplied directory remains
unchanged; no hosted runtime publication was performed.
