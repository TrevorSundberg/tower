# Shared compiler reuse on the 512-body browser workload

Four workers added **80.00 ms** to the median unchanged repeat and **85.39 ms** to the edited repeat. Both reused the live compiler and its browser connections. The largest measured repeat cost specific to parallel execution was contention on the shared heap lock. Keep one worker for this short-body workload. The packet contains a bounded lock experiment for independent replay.

## Ordinary wall time and separate CPU measurements

Host 1 ran the 512 independent short bodies from the [previous measurement](browser_within_unit_fe008af5.md) in isolated Chromium, Graph mode, 32-bit pointers. Each fresh coordinator processed two requests. The second arrived immediately after the first execution handle was destroyed. For each repeat condition, four adjacent pairs ran in width order 1/4, 4/1, 1/4, 4/1. The first request always compiled the original. Only the edited repeat changed the return of `body_511` from `y` to `y+1`.

| Request | Compile wall ms, 1 / 4 | Four-worker cost ms | Lookup through handle destruction ms, 1 / 4 | Compile coordinator CPU ms, 1 / 4 | Compile renderer CPU ms, 1 / 4 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Fresh | 554.83 / 752.11 | +197.28 | 883.77 / 1,150.16 | 519 / 660 | 1,270–1,275 / 2,275–2,285 |
| Repeat, unchanged | 187.95 / 267.95 | +80.00 | 265.46 / 346.00 | 187 / 247 | 290–310 / 890–905 |
| Repeat, edited | 188.43 / 273.82 | +85.39 | 266.22 / 357.13 | 188 / 257 | 300–320 / 995–1,005 |

Wall entries are medians of eight fresh and four repeat requests per width. Independent CPU trials used four fresh and two repeat measurements per width and condition grouping. Chromium supplied coordinator thread CPU. Linux renderer samples bracketed compile edges with 10 ms accounting ticks and include other renderer threads. The wall trials had no kernel, allocator, wave or CPU tracing.

## Worker connections and compiler reuse

A small adapter supplied the width and timestamped connection readiness at the public `loadTower` boundary. It delegated to the release host and worker factory. A separate four-worker control used the unwrapped production host, including an edited first compile. All arms required shared memory, checked the full Foundation text and executed the guest.

| Fresh owner boundary | Median ms, 1 / 4 |
| --- | ---: |
| Launch coordinator to start of its work | 38.77 / 38.71 |
| Fetch and compile shared Wasm module | 13.14 / 13.00 |
| First connection request to last child ready | 21.63 / 37.15 |
| Last child ready to return from release host initialization | 163.41 / 204.29 |
| Full first `getTower` | 228.95 / 293.05 |
| Initial project file configuration | 52.37 / 52.01 |
| Synchronous owner close after both requests | 0.20 / 0.23 |
| Close start to last browser-observed worker closure | 4.17 / 4.69 |

Connections opened concurrently. The last close interval includes reply delivery and browser observation. Fresh host initialization encompasses parent instantiation, WASI and language setup. On the separate wave probe, parent instantiation took 1.25–2.65 ms and WASI initialization 0.15–0.29 ms across widths. The interval from WASI-ready to language configuration complete took 165–173 ms at one worker and 203–226 ms at four. These intervals are nested.

Every ordinary pair returned the same owner, `cached=false` then `true`, and produced distinct execution handles 1 and 2. Each repeat's `getTower` reconfigured the existing module inputs in about 35 ms. The production kernel trace counted 516 Body callbacks on each compile. The first four-worker compile also ran 276 LR callbacks of kinds 8, 9, 10 and 14 that disappeared on reuse. The interface exposes no count of individual grammar cache hits. All 56 ordinary worker targets closed, with zero left behind.

## Dispatch, transport and the heap

The release reactor recorded up to three child kernels active at once. On the unchanged repeat, 361 Body callbacks ran on children. The strongest contiguous group accumulated **144.84 ms of child thread CPU in 61.01 ms elapsed**. The edited repeat reached 154.67 CPU ms in 65.33 ms. Kernel tracing perturbs duration. Ordinary elapsed trials establish the slowdown.

A clean public-bootstrap build first reproduced the production Wasm byte for byte. A second build added Tower entry/exit marks around batch, submit, join and pool lifetime. The reduced probe retained exact per-wave records. Four fresh four-worker probes and four repeat probes gave the following ranges.

| Four-worker measure per compile | Fresh | Repeat, unchanged or edited |
| --- | ---: | ---: |
| Batches / parallel batches | 215 / 147 | 109 / 41 |
| Tower pools opened and closed / WASI pthread starts | 64 / 172 | 1 / 4 |
| Total coordinator submit, ms | 0.843–0.908 | 0.227–0.322 |
| Total coordinator join, ms | 39.28–58.67 | 2.61–3.40 |
| Total pool open / close, ms | 3.65–4.11 / 4.89–6.48 | 0.109–0.195 / 0.095–0.209 |

Each repeat averaged 5.5–7.9 µs of submit and 64–83 µs of join per parallel wave. Join includes outstanding child work. The four pthread starts reused the existing browser connections. Median post-to-child-entry latency was 145–365 µs on repeats. Width one ran all 109 repeat batches serially. In a separate release heap probe the coordinator encountered zero contended acquisitions at one worker and 12,537–13,515 at four on the repeat. The four-worker slow path accumulated 143.03–182.29 ms, with 15,720–16,761 calls to wait. These instrumented intervals include scheduling delay and overlap worker activity. They cannot be added to ordinary compile times.

## Bounded lock experiment

The private candidate tries up to 32 atomic loads before the existing wait. Successful acquisition preserves the contended state so the next unlock can wake a sleeper. Two counterbalanced stock/candidate series used the same release Wasm. Of eight adjacent four-worker pairs per repeat condition, the candidate won six unchanged and six edited. Median paired savings were 46.74 and 43.18 ms respectively. Individual changes ranged from 107.49 ms faster to 51.27 ms slower unchanged, and 121.45 ms faster to 62.39 ms slower edited. The separate CPU and wait counters varied. Four workers still had no demonstrated advantage over one. The packet retains the tested patch. An independent counterbalanced replay should check both renderer CPU and the slower pairs before adopting it.

The candidate passed three shared Chromium controls, nine ownership controls and the bounded LR control. Three Node controls passed, including blocked-coordinator recovery on worker trap. Cancellation, replacement, stale replies and cleanup were exercised. The first Node invocation lacked the relative failure-worker fixture. The first wave build rejected an unconverted Tower probe pointer. The corrected runs and both first failures are retained. The packet also preserves a superseded CPU summary that grouped measurements incorrectly. The published table uses the corrected per-request reduction.

## Frozen bytes and host

Source `fe008af50f7ad27d6f15b86927122baf9d8051a9`, source tree `2e05a92e145a57c51c89280dd52417de86d7e45a`, retained site tree `66dcc503ee7c3e7fe3d267939a0298f7ca6682e0`. Shared Wasm SHA-256 `d76237144fe2371416068a1286266f4ae143cac6fc5035da0ba1a3e35b80461e`. Mounted input set SHA-256 `311dd7f01991b23d0d2d2220bd43e77f772c27ee8a47506ced68ed6cdcdf9ccf` covers 1,232 project entries and the fixture builtins.

| Input | Source SHA-256 | Canonical Foundation SHA-256 | Bytes | Guest output lines |
| --- | --- | --- | ---: | --- |
| Original | `341e0a0964410af709672845a36885c161145b33a87e07b1f4002dde2681271d` | `894fd312431bc2e159426ad07df9fc7e807f87e6e3533285dc7669c6b74cd2c2` | 613,993 | 42, 42, 42 |
| Edited | `97c0efbe18b1153496c51885e06847f0c623fac33f2b0fc163d04ee82633c8c1` | `49f2763040cf968fc269383e1a398e6db0732c23a8f6eb341a2eb8a0796c6486` | 614,059 | 42, 42, 43 |

Debian 12, Chromium 159.0.8154.6, Playwright 1.65.1, Node 24.22.3, two eight-core Xeon Gold 6244 sockets with SMT. CPUs 0–31 were available under a 15.36-CPU quota. The cgroup memory limit was 136,709,144,576 bytes with zero swap. The ordinary renderer peaked at 437,328 KiB and the browser parent at 157,824 KiB over the series. The shared cgroup high-water mark stayed at 24,606,445,568 bytes. The 344 ordinary quota periods added zero throttle time, throttle events or OOM kills.

Evidence packet `524652ef-9c87-4d58-8c21-eba35d22adff.tar.gz`, 7,862,924 bytes, SHA-256 `9cae7b65f3b925b1a2840df352d5f0e44f45d3e9e67163d833d6ca2af4e8cbda`. A fresh extraction verified all 871 content digests, reproduced the wall and CPU tables, wave receipts, child overlap and paired lock comparisons, and reconstructed the candidate host.
