# b8 browser adoption with page-owned compiler workers

PASS: three fresh Linux strict shared-browser trials and all four existing
desktop/mobile static-app tests. No implementation change was needed. This
adopts the supplied b8 binaries into the published page-owned transport; it does
not validate a compiler built from the later host checkout or deploy the site.

## Frozen inputs

- Host, fixtures and mounted resources: published
  `78d675c441cabba99f05276656717e53d01ead6f`, after the required pull.
- All 32 supplied artifacts matched ROOT's `files.json` sizes and SHA256 values
  before use and after installation. Their compiler/build source remains
  `b8d65c37d9dd4ef691d700d0d0a52c81e01b593a`, public bootstrap768.
  `SOURCE.txt`, the original manifest and complete compiler-project recipe were
  retained. Later producer changes are excluded from that binary identity.
- Linux6.18.33.2 WSL2; Node22.23.5; Playwright1.65.1;
  Chromium159.0.8154.6/headless-shell1255, unchanged headless launch.
  B2 container: CPU12–23, quota12,24GiB, one browser worker at a time.
  Cache924GiB/host113GiB free initially; owned jobs drained between stages.

| Input | SHA256 |
| --- | --- |
| Shared compiler | `d2e7a2ae4bcfba916b684321b56aca96c2b2385c976523ece7b3f09899785e7c` |
| Work fixture | `6411c389b9610c293b98dcc844e00195fcfeecbf0b4e53b8c84189ef78d4e32c` |
| Portable compiler | `42fc1cf42ac296d3f17ae0300848a59d71e942d565fd8e75e4214c0b45e149b9` |
| LLVM reactor | `1c1b72fb9d0080d850ddd067476e6f8aeec1181ef06aac67cf4b2626b98b9c76` |
| Cross reactor | `5bd9fb046f911d6afded5f6e0a183907df0ff962adbe5defa2056d805d3a83cd` |
| Browser resource JSON | `a2e1902e21edc9d3046d4949485060297e2b038e90f3c059bec06f89323aac18` |
| Host-file hash manifest | `31299645d7889f528e22aa5d0d0a28c04484e0dba291fc0bede4cd05ec4c8ded` |
| Tower-resource hash manifest | `225268082bdc7a3533806d54345a621d9535393bed43ac721ddfaf2fa3f68583` |
| Chromium executable | `24eb0a14de64ab0c9c2e283a5512ca817db64af8fd853cdb4d818f19a8e23b9b` |
| Compiler-project recipe | `adf2e0e1a45ff74d9411c4b46a71c4d728772dde7b5b8cca4dafafc8974bd53c` |

## Strict shared-browser evidence

Ran the unchanged normal selection of `test-shared-compiler.mjs` three times
against the matching shared/work binaries, each in a fresh browser context.
`TOWER_REQUIRE_THREADS=1`; original assertions and 30s retirement budget;
finite210s outer guard per run, never reached. Every run observed **5/2/5 actual
close events and zero same-context CDP worker targets** for pool4/compiler1/
compiler4. Full serial/parallel canonical text, Graph/Fast output, query,
world/budget, cancellation, stale-ticket and real work-overlap checks passed.

| Run | Wall s | Waited-child CPU s | Peak RSS KiB | Compiler4 retirement ms |
| --- | ---: | ---: | ---: | ---: |
| 1 | 6.534888 | 2.028553 | 206128 | 27.335 |
| 2 | 6.289145 | 1.933816 | 215664 | 27.343 |
| 3 | 6.254412 | 1.905027 | 206816 | 27.134 |

All runs retain24/0/785 spawn counts and peak Wasm capacities33947648/
90701824/97779712 bytes. Capacity is not retained allocation or aggregate RSS.
Cold initialization and additional parallel-only fixture work differ between
modes: these timings are acceptance costs, not a scaling comparison. The
existing physical-buffer observations remain in the raw reports; no new
allocator census or sanitizer claim is made.

All relevant production and control files byte-match the accepted
[7890ebd7 prerequisite receipt](browser_page_worker_repair_ba52a932.md), including
the static-import fault adapter, partial-startup and old-generation controls.
The injected work fixture is unchanged. Reuse its seven controls; no redundant
fault campaign or relabeling of the earlier f167 retirement failures.

## Actual static application

Preserved the previous dist and replaced only ignored artifact inputs, backing
up each previous file. Ran the existing `build.mjs` with both
`TOWER_REQUIRE_THREADS=1` and `TOWER_REQUIRE_BACKENDS=1`; all capabilities are true.
Used installed Windows esbuild and the documented existing Tower asset-packager
override through WSL. No compiler/reactor/tool rebuild or dependency installation.
The absent local libc++ license was copied from the existing LLVM source at
`C:/Sandbox/tower/third_party/llvm-project/libcxx/LICENSE.TXT`.

Packager SHA `ec920939bc0a0a97485cf6213a78de487cffaa04873b0707f792a604d4d6493b`;
license SHA `539dd7aed86e8a4f12cbdd0e6c50c189c7d74847e4fecc64ce2c6ee3a01da38b`.
Windows Node affinity12–23 was set before releasing a stdin start gate,
GOMAXPROCS4; WSL packager used taskset12–23 and a24GiB virtual-memory bound.
Packaging took16.850564s wall; Node-only CPU0.265625s, peak working set unavailable.
The separately measured Tower packager took14.040751s wall/5.867843s CPU/
111744KiB RSS. Those partial process metrics are not a complete packaging-tree
CPU/RSS measurement.

Verified all101 packaged asset hashes. Package manifest SHA:
`fd79fc4b26fd5e73781b17304a14dc64035af37218b45b46c5532dcab00427de`.
The frozen source and working checkout's host/resource manifests also match,
so the static bundle and direct harness use the recorded resource bytes.

Ran **only** existing `tests/browser/compiler-threads.spec.mjs`, desktop and
mobile, one worker, zero retries, original120s test/90s loading/60s execution
deadlines; finite540s aggregate guard, not reached. Result: **4 passed,0 skipped,
0 failed,0 flaky**. Both projects establish real service-worker isolation, fetch
the shared reactor, observe multiple actual compiler workers, execute the
decltype/comptime program as `42\n`, and reload while isolated. Both also pass
the blocked-service-worker portable fallback with no shared-reactor request or
compiler-thread workers. No test assertion was changed.

Static-suite cost:28.482123s wall/14.817796s waited-child CPU/401212KiB peak RSS;
Playwright test duration24.909623s. The ordinary static server supplies no
isolation headers: isolation comes from the production service worker.

## Retained evidence and limits

`C:/Sandbox/build/codex_ecs_20261122/B2/browser_adoption_b8_78d675c4` contains the
frozen source archive, original artifact manifest/provenance, commands, all
strict logs/reports, control-byte comparison, packaging logs, static-app JSON,
hash manifests and complete tested `dist/`. `prior_dist/` and `prior_inputs/`
preserve replaced outputs; old f167 snapshots remain untouched. The Linux
snapshot and reports are also under `/cache/browser_adoption_b8_78d675c4`.

Static report SHA `fb58274ec73e1a158ca95558b7a9b55fa24f15916d21756ba2b0a83fb7563eee`;
source archive SHA `dd949a7b5d4496b1c96cf6305c9a5070c31ae98bef7984705da23dd760cff805`.
All owned jobs drained. No new failure, runtime edit, broad Node/browser matrix,
generation run or hosted deployment. These checks cover the b8 UI adoption with
this frozen host; ROOT retains later-source generation and final release gates.
