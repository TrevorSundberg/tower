# Current shared-browser gate: retirement blocked

B2 froze published `f167c444b7a0e4b112ef20d34ffee0dd106252b2`, including
`96cd1eda`, `eac16533` and the current observer ABI. The complete shared compiler
and work fixture build passed. Actual four-thread overlap, current query/world
controls and canonical/reference results ran successfully, but repeatable worker
retirement acceptance **failed**. No runtime, transport or test change ships.
The earlier generation and lowering-rejection receipts remain unchanged.

## Build and frozen artifacts

KinmenB Docker `tower-b2-work`, Ubuntu24.04.5, Linux6.18.33.2 WSL2,
CPU12-23/quota12/24GiB; one browser at a time, no sibling cache access.
There was no configured B2 shared cache. Existing old Wasm files were preserved;
the new profile is `/cache/browser-shared`. Public bootstrap verification passed:
`768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`.
WASI SDK34 uses Clang/LLD23.1.0; the public compiler remains the LLVM19 bootstrap.
CMake3.28.3, Ninja1.11.1, Release, compiler jobs1, outer jobs4.

```sh
bash playground/scripts/build-bootstrap.sh
cmake -S /work -B /cache/browser-shared -G Ninja \
  -DCMAKE_TOOLCHAIN_FILE=/work/cmake/WasiThreads.cmake \
  -DWASI_SDK_PREFIX=/cache/wasi-sdk-34.0-x86_64-linux \
  -DCMAKE_BUILD_TYPE=Release -DTOWER_BROWSER=ON -DTOWER_BROWSER_THREADS=ON \
  -DTOWER_WORK_TESTS=ON -DTOWER_BOOTSTRAP_COMPILER=/work/bootstrap/linux-x64/towerc \
  -DTOWER_COMPILER_JOBS=1
cmake --build /cache/browser-shared --target tower-browser tower-work-tests --parallel 4
PLAYWRIGHT_BROWSERS_PATH=/cache/ms-playwright TOWER_REQUIRE_THREADS=1 \
  node playground/scripts/test-shared-compiler.mjs \
  /cache/browser-shared/tower.wasm /cache/browser-shared/tower-work-tests.wasm REPORT.json
```

The dependency-aware build completed30 actions:44.282s wall,88.808s waited-child
CPU,1097276KiB peak waited-child RSS. An initial PowerShell argument-quoting
configure failure preceded compilation; the preserved literal Bash command
resolved it. No duplicate public-leaf or native build was run.

SHA256 identities:

| Input/artifact | SHA256 |
| --- | --- |
| Shared compiler | `8e7e3d637c6820c6d96204662dd4b6025722099e595ef3704f704125d7405eb4` |
| Shared work fixture | `6411c389b9610c293b98dcc844e00195fcfeecbf0b4e53b8c84189ef78d4e32c` |
| Actual JSON module resources/builtins | `67561156ce8afa76460323b29d96ea5400603e31dabcf9dc9c080f5cdfea264b` |
| SDK archive | `b761e3a0721dbae9c09a0059e5fdb2bf917d1b4a8a7b430fb3b5aafb0984b2c4` |
| Chromium headless-shell executable | `24eb0a14de64ab0c9c2e283a5512ca817db64af8fd853cdb4d818f19a8e23b9b` |
| Full Chromium executable | `045558b2f167db04624e36d952496705418a85d87ff9b5fb55a8c40cc59201ae` |

Node22.23.5, Playwright1.65.1, both browser variants159.0.8154.6/revision1255.
The host reports12 logical CPUs, cross-origin isolation and SharedArrayBuffer.
The receipt contains Node/linker/compiler/script hashes and complete CMake inputs.

## Failure, bounded investigation and rejected changes

The unchanged strict test first failed after the standalone pool trial. All four
children emitted Playwright close notifications; the coordinator answered the
retire probe. After the unchanged30s deadline its CDP worker target still existed.
This occurred before loading the compiler Wasm, so no semantic/query producer is
implicated by this reproduction.

A diagnostic copy retained the strict assertions and added Chromium tracing,
post-failure OS thread inventory and bounded debugger probes. It reproduced the
failure: child close flags true, coordinator false; four sleeping
`DedicatedWorker` OS threads remained. Child evaluations reported closed; the
coordinator evaluation did not settle within1s. It is not merely a stale target
label. Browser teardown drained the owned processes afterward.

One transport candidate requested cooperative retirement only for READY workers,
keeping forced termination for busy/failed/startup workers. It passed all three
trials once, then failed coordinator retirement after compiler1: one cooperative
request, zero forced requests, zero nested Wasm spawns. The entire candidate,
including its proposed Node exit observer, was rejected and archived.

A final host control selected full Chromium with `channel:'chromium'`, preserving
all assertions and Tower input bytes. It passed once, then failed retirement
after compiler4. That test-only selection was also rejected. This is not an
established headless-shell-only defect. No timeout increase, target filtering,
forced GC, page closure to obtain green, scheduler change or diagnostic weakening
was retained.

[Chromium's worker shutdown implementation](https://raw.githubusercontent.com/chromium/chromium/159.0.8154.6/third_party/blink/renderer/core/workers/worker_thread.cc)
separates shutdown preparation from final shutdown and child-thread retirement.
The internal engine cause remains unproven; an exact source-level engine fix is
not claimed. [Playwright documents the distinct full-browser headless channel](https://playwright.dev/docs/browsers#chromium-new-headless-mode).
The actionable blocked boundary is Chromium159 coordinator retirement after
observed child closure, not an unmet Tower work dependency. Further engine/host
transport diagnosis belongs in the ROOT release handoff; this receipt does not
authorize adopting these artifacts as a validated shared release.

## Results and costs

| Retained run | Result | Wall s | CPU s | Peak RSS KiB |
| --- | --- | ---: | ---: | ---: |
| Original strict | FAIL pool retirement |35.106|4.755|201080|
| Original + diagnostic probe | FAIL pool retirement |35.927|4.568|201676|
| Cooperative candidate | PASS once |8.983|2.379|206416|
| Cooperative confirmation | FAIL compiler1 retirement |35.964|3.890|204176|
| Full Chromium control | PASS once |9.472|2.867|210904|
| Full Chromium confirmation | FAIL compiler4 retirement |39.122|4.855|211460|

CPU/RSS are the existing Tower process profiler's waited-child accounting, not
aggregate live browser-tree memory/CPU. Cold browser launches, warm file cache,
same source/artifacts/resources. Tracing is separately identified. These timings
are diagnostic costs, not a speedup or serial/parallel throughput comparison.

The successful full-browser control observed actual closes5/2/5 including each
coordinator, zero remaining worker targets, nested spawns24/0/785. The pool
fixture requires four distinct simultaneous thread IDs behind a barrier and
checks allocation/growth, partial/full cancellation drain and stale work order.
Current evaluation/body query resume/cycle/cancel/resource cases, stage ownership,
LR/budget controls and independent worlds returned success. Three language
fixtures (`decltype_lazy_body`, `decltype_generic_headers`, `comptime_flow`)
executed known output `0\n` in Graph/Fast at1/4; the strict script compared full
canonical text before retaining hashes. This functional evidence does not erase
the later retirement failure or extend coverage to every invocation fixture.

Final Wasm capacities for that control: pool33947648, compiler1 90177536,
compiler4 97648640bytes. These are monotonic linear-memory capacities, not live
allocation retention or process RSS. No new allocation counters were added.
The Node follow-on remains pending because the strict browser gate is unstable.
No LLVM/UI/full Node/bootstrap/sanitizer/hosted matrix or publication is claimed.

## ROOT handoff

All reports, logs, diagnostic source/trace, rejected patches and commands are in
`C:\Sandbox\build\codex_ecs_20261122\B2\shared_browser_f167c444`.
The copyable archive `shared_browser_f167c444_blocked.tar.gz` has SHA256
`7382481192a567d0ecfdb8e019ec0ab10d9020934d12488849aa4fe9ea5e6aff`.
It contains both original Wasm artifacts, the frozen complete scaffolding/resource
tree, original browser transport/test sources, provenance and a verified per-file
SHA256 manifest. Its provenance explicitly marks the release gate BLOCKED.
Later documentation merges do not change the tested source identity.
