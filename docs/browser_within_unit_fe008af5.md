# Within-unit parallelism on the fe008af5 shared browser compiler

Use one worker for the two measured interactive workloads of short independent loop bodies. Four workers executed body checks concurrently, but increased compile-through-format time in every adjacent pair. These measurements establish the choice for these shapes on host 1. More expensive bodies need a separate crossover measurement.

## Ordinary elapsed trials

Each pair compiled one module at 32-bit pointer width with the ordinary Graph interpreter. The primary run used the isolation server block from the frozen shared Chromium check verbatim. The pairs ran consecutively in 1/4, 4/1, 1/4, 4/1 order per shape. One Chromium instance served each series. Every arm created a fresh coordinator and worker group, initialized the same mounted files, compiled and ran one untimed warmup of that shape, then measured one more invocation. The clock covered creation of the execution handle, execution through completion and retrieval of the complete Foundation text. Initialization, disposal, serialization to Node and output comparisons were outside that interval. The ordinary child module and reactor used their release bytes.

| Independent bodies | One worker median, ms | Four workers median, ms | Median paired extra time at four, ms | Median paired speedup, one / four |
| ---: | ---: | ---: | ---: | ---: |
| 64 | 42.71 | 58.07 | 15.94 | 0.745× |
| 512 | 216.20 | 317.88 | 101.68 | 0.682× |

| Bodies | Pair 1, one / four ms | Pair 2 | Pair 3 | Pair 4 |
| ---: | ---: | ---: | ---: | ---: |
| 64 | 40.29 / 50.94 | 48.11 / 62.54 | 45.13 / 62.58 | 33.19 / 53.61 |
| 512 | 219.05 / 339.60 | 211.64 / 293.10 | 218.35 / 337.01 | 214.05 / 298.75 |

The 512-body median time in the compile call alone rose from 201.36 to 300.44 ms. Graph execution took 0.16 and 0.17 ms. Formatting took 14.68 and 17.26 ms. An earlier separate series using the benchmark transport's isolation handler also favored one worker in all four pairs per shape, with median paired speedups of 0.625× and 0.599×. The packet keeps the two series separate.

## What the child threads executed

Separate traced invocations used the same inputs, Wasm and warmup protocol. Each child located the actual exported `work_kernel_execute` in its private function table, slot 5. A Tower Wasm adapter forwarded each call to that original function. The browser transport read the frozen `CompilerKernel.kind` and marked entry and return. Chromium recorded the worker thread ID, monotonic time and per-thread CPU time at both boundaries. A Tower sweep checked ordinal pairing and balanced slots within the measured compile call.

| Bodies | Child callbacks | Peak simultaneous child kernels | Wall with ≥2 child kernels, ms | Body callbacks | Wall with ≥2 Body callbacks, ms | Strongest contiguous Body group, CPU / wall ms |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 64 | 376 | 3 | 36.14 | 37 | 10.84 | 27.23 / 11.23 |
| 512 | 2,892 | 3 | 240.47 | 305 | 59.79 | 79.90 / 31.09 |

For the 512-body group, three child threads accumulated more than two CPU-seconds per wall-second inside overlapping Body callbacks. The four-worker trace also observed 317 BodyDiscovery and 341 Lower callbacks. Both width-one controls recorded zero child kernel callbacks. These counts cover child dispatches. The coordinator can execute additional work directly. Trace hooks add overhead, so the scheduling decision uses the ordinary times above. The frozen host API supplies no direct split of admission, synchronization, allocator contention and coordinator publication costs. The first decision is to keep the serial schedule for these short-body shapes, without applying a body-count cutoff to other workloads.

## Inputs, correctness and lifecycle

The native Tower `tower-frontend-units-profile` generated each module from release source `fe008af50f7ad27d6f15b86927122baf9d8051a9`, tree `2e05a92e145a57c51c89280dd52417de86d7e45a`. Each exported loop adds 0, 1, 2 and 3 to its argument. The browser driver appended ordinary Tower calls that print the staged answer, the first body's result at 36 and the last body's result at 36. Every warmup, timed arm and overlap control printed three lines of `42`. Every complete canonical string matched the first serial reference byte for byte and included all generated body names.

| Bodies | Source SHA-256 | Canonical Foundation SHA-256 | Canonical bytes |
| ---: | --- | --- | ---: |
| 64 | `23c00bd9998c277ec4d633131e59bffe2eee0c8cbd3d7f76381abecc95bda958` | `59570be2a3c38685008b2cf99ed5bb82f063d3ac8eee0e9b3970b55331033e4e` | 76,400 |
| 512 | `341e0a0964410af709672845a36885c161145b33a87e07b1f4002dde2681271d` | `894fd312431bc2e159426ad07df9fc7e807f87e6e3533285dc7669c6b74cd2c2` | 613,993 |

The shared reactor SHA-256 was `d76237144fe2371416068a1286266f4ae143cac6fc5035da0ba1a3e35b80461e`, the portable reactor was `f96f6c7d1170c9b7f403c5d557bad4459c7441e7a170fbe27a641ce88374b0cc`, and the sealed deployment manifest was `09e2d38249d48e174ddc18367029c6880773cee5463b2ac19ad32e5ad65fd531`. The 1,232 mounted files and builtins serialized to SHA-256 `311dd7f01991b23d0d2d2220bd43e77f772c27ee8a47506ced68ed6cdcdf9ccf`. The run used the retained candidate locally. Public Pages still pointed to predecessor `feb74cf2b480c1e6f91ab4aadd02f11dcbc1ce99` when the refs were recorded.

Both ordinary series observed all 56 worker targets created and closed per series, including the coordinators. Each arm verified isolation and shared memory and ended with zero targets. In the separate stock desktop fallback test, blocking service workers left the page unisolated, selected the portable reactor and created zero compiler-thread workers. All three observed fallback targets closed.

## Host and measurement limits

Host 1 ran Debian 12, Chromium 159.0.8154.6, Playwright 1.65.1 and Node 24.22.3 on two eight-core Xeon Gold 6244 sockets with SMT. Chromium saw 32 logical CPUs. Affinity was 0–31, cgroup CPU quota was 1,536,000 µs per 100,000 µs, memory limit was 136,709,144,576 bytes and swap limit was zero. The primary series crossed 288 quota periods with zero additional throttling or OOM kills. The shared cgroup memory high-water mark stayed at 24,606,445,568 bytes. The primary renderer's process-lifetime peak RSS reached 426,744 KiB. GNU time reported 285,556 KiB for the command's own accounting scope. An aggregate browser-tree RSS peak would require simultaneous process sampling. The primary 512-body measured Wasm memory capacities were 87,359,488 and 87,883,776 bytes at widths one and four.

The first generator configuration lacked the backend-test registration needed for the profile target. Enabling it produced both requested shapes. The first summary filter used a reserved jq identifier and was corrected against the preserved raw timings. Both failures and the commands that succeeded are included in the packet.

The sealed host-1 packet is `b73267b4-b792-49a9-9799-3c754e561e13.tar.gz`, 5,180,113 bytes, SHA-256 `7c528bb6b697a8260bc3c1aeccd71992f3df33e86eef258324dba4949fcc1e96`. A fresh extraction verified the 241 file checksums and reproduced both paired summaries and all four kernel interval tables.
