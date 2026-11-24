# One 4,096-body unit on Vast slot 5

At integrated commit `5b47fc9476b62c0673790640e3719a337694b14d`, two, four and eight workers finished the same frontend job faster than their adjacent one-worker controls in all 18 pairs. Four workers gave **1.187×** the serial throughput. Eight gave **1.207×**, at a higher CPU cost. The separate traces located the concurrency in semantic jobs inside the single unit. Parser action and propagation waves also overlapped, on a smaller scale. The generated x64 object matched the independent reference and printed two lines of 42 at every width. [Peer object reference](backend_execution_children_peer_4f17892b.md)

## Ordinary timings

Each cell has six fresh-process pairs on one host. Serial ran first three times and second three times, with the order of width comparisons rotated. Each width had one equivalent untimed-for-analysis warmup. The first bounded stock one/four pair, all warmups, and the diagnostic traces are retained separately. The table uses mean seconds from batch creation through frontend join and the maximum whole-process RSS across the primary samples.

| Workers | Paired serial wall / CPU s | Workers wall / CPU s | Paired speedup | Wall saving in individual pairs | Peak RSS KiB | Peak Tower bytes |
|---:|---:|---:|---:|---:|---:|---:|
| 1 (18 controls) | 1.4253 / 1.4253 | 1.4253 / 1.4253 | 1.000× | — | 585,528 | 459,241,312 |
| 2 | 1.4308 / 1.4308 | 1.3053 / 1.6695 | 1.096× | 6.20–11.14% | 591,656 | 459,219,184 |
| 4 | 1.4259 / 1.4258 | 1.2010 / 1.8450 | 1.187× | 7.16–18.50% | 592,432 | 459,219,408 |
| 8 | 1.4194 / 1.4193 | 1.1760 / 2.3272 | 1.207× | 8.97–20.39% | 592,864 | 459,219,632 |

Whole-process mean wall / CPU seconds, including reference execution, formatting, file writes and teardown, were 1.649 / 1.643, 1.542 / 1.902, 1.437 / 2.075 and 1.415 / 2.560 at one, two, four and eight workers. The frontend-only interval is the throughput measure. The ordinary Linux profiler always installs an outer callback, so the private observer-off harness suppressed that callback as well as the optional grammar observer and omitted their span fields. Its frontend driver, compiler providers, inputs, oracle, canonical formatter and teardown were the frozen implementations. The stock pair and observer-off warmups both passed the same checks. [Stock profiler](../scaffolding/tests/frontend_units_profile.tower)

A separate six-pair four/eight comparison checked the small incremental difference directly. Four averaged 1.1736 s wall / 1.7684 s CPU and eight averaged 1.1502 / 2.1816. Eight won five pairs, with one 3.29% regression. Its mean wall saving was 1.99%, with 23.4% more CPU. The mean pairwise savings for four-first and eight-first orders were 3.55% and 0.42%. This result is more sensitive to order than the comparisons with serial.

## Work that actually overlapped

One trace per width recorded one outer unit on one thread and zero ready outer vacancy. The same 312 semantic dispatches contained 41,315 jobs in every trace. These included 4,104 body-discovery jobs, 4,109 body jobs, 4,105 lowering jobs and 12,340 known-binding jobs. The trace identifies the job kind and actual thread. It establishes body-level parallel work within a unit. There is no observation here of concurrent traversal of subtrees within a single body.

| Workers | Semantic peak threads / simultaneous jobs | Semantic dispatch wall ms | Wall ms with ≥2 semantic jobs active | Wall ms at full width | LR propagation waves / peak | LR action waves / peak | Frontend parse wall / coordinator CPU ms |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 1 / 1 | 586.51 | 0 | 584.37 | 0 / 0 | 0 / 0 | 361.13 / 361.13 |
| 2 | 2 / 2 | 420.30 | 406.96 | 406.96 | 47 / 2 | 41 / 2 | 384.29 / 374.20 |
| 4 | 4 / 4 | 251.86 | 247.21 | 238.81 | 47 / 4 | 41 / 4 | 393.74 / 381.59 |
| 8 | 8 / 8 | 161.83 | 156.29 | 104.01 | 47 / 4 | 41 / 4 | 396.83 / 383.10 |

An independent replay found 104,008,917 ns covered by eight simultaneous semantic job intervals. One set of eight declaration jobs on distinct pthreads shared a 4,438 ns interval. The timestamps measure elapsed job lifetimes on the monotonic clock. They include time a thread could be descheduled. The records identify the compilation unit and job kind. Locating parallel work within a single body would require body or subtree identity.

The post-join Tower replay swept half-open intervals, rejected duplicate simultaneous thread IDs and reproduced all 12 phase/width totals for wave count, wall, summed job wall/CPU and union coverage. At eight workers there were 124 recorded propagation jobs and 103 action jobs. Their waves occupied 7.17 and 10.31 ms, with at least two jobs active for 3.66 and 2.63 ms respectively. Zero serial waves means the serial parser used its inline path. The raw spans include entering and leaving clocks for every observed job, their thread identities and semantic kinds.

At eight workers the three disjoint dispatch categories covered 179.30 ms of 1,169.42 ms traced frontend wall. Only 2.53 ms inside semantic dispatch had no active job. The remaining 990.12 ms outside those dispatches includes coordinator work, other unobserved work and instrumentation. The outer thread accumulated 1,136.42 ms CPU in its 1,169.03 ms span. That 32.61 ms difference includes blocking and descheduling. It cannot identify the cause of a wait. Summed semantic job CPU rose from 558 ms serial to 1,062 ms at eight even as dispatch wall fell. Semantic post-join observation itself cost 15.2–16.4 ms across widths. The ordinary timing table excludes this instrumentation.

## Parser time outside grammar builds

The initial eight-worker trace spent 146.71 ms inside 89 grammar builds and 250.12 ms outside them. A follow-up on the same source and host timed four traces at each width. It charged nested grammar builds separately from their callers and excluded time spent inside the coarse recording hooks. About 95% of the remaining parser wall time went to advancing the 4,096 body declarations through `syntax_next`. [Parser call sites](../scaffolding/compiler/frontend_compilation.tower)

| Workers | Parser wall outside builds and hooks, ms | Body loop wall, ms | Body loop coordinator CPU, ms |
|---:|---:|---:|---:|
| 1 | 247.59 | 235.65 | 235.65 |
| 4 | 249.38 | 236.93 | 236.93 |
| 8 | 250.70 | 238.37 | 238.36 |

At eight workers, publishing roots and module data took 3.40 ms and module completion took 0.002 ms. All observed LR peer work fell inside grammar builds. Across the bodies the recorder counted 188,416 token reads, 188,416 shifts and zero cursor rewinds. A lighter probe attributed 3.60 of 4.03 ms across 64 bodies to recognition. Distinguishing token selection from token entity creation, and generated-rule joins from materialized reductions, requires narrower observations.

All 47 profile runs on CPUs 1–8 under a 30.72-CPU quota matched the frozen source, import and canonical Foundation. Each returned 42 twice. Peak process RSS across the runs was 595,268 KiB and peak Tower charge was 459,241,312 bytes. The ordinary CLI objects at widths 1, 4 and 8 matched the earlier reference and printed both expected lines. The Tower replay checked the disjoint clock intervals and rejected a truncated stream. The evidence packet for `7675d52f-5b35-4722-b0c0-a20fb56bc469` has SHA-256 `15fe9079e855da9696f0fe4880006caf342f8b50b8abc5ca70da5bd4d87ed2ce`.

## Outputs, release and allocation

Every one of the 60 profile processes regenerated and compared the complete raw source, import and canonical Foundation against the earlier sealed slot-5 artifacts. Each interpreted `answer()` and `body_0(36)` as 42. The raw source was 347,291 bytes, SHA-256 `60ffa29256c9463c899ffc907d9bedd9fe1611f9c8f1a406c1eb5c4dd2a5a2a9`. The 333-byte import had SHA-256 `f5643e359d8a130f384db6b9ff20a7287d36328e9fc5c39dd41b175db364d1a7`. The 4,984,138-byte canonical Foundation had SHA-256 `79b43b59b1adabbbc407fafd674ab534f33ddf70fe72c5ae4c529a010e1879ce`. [Original input receipt](lr_ordered_rows_vast_12ab4cae.md)

| Workers | Retained bytes at join | Live grants at join | Grants released by join, traced | Lifetime grants released, traced | Grants / lanes / bytes before disposal |
|---:|---:|---:|---:|---:|---:|
| 1 | 405,494,704 | 281,516 | 487,179 | 768,718 | 0 / 0 / 0 |
| 2 | 405,494,848 | 281,517 | 491,388 | 772,928 | 0 / 0 / 0 |
| 4 | 405,494,960 | 281,517 | 491,417 | 772,957 | 0 / 0 / 0 |
| 8 | 405,494,960 | 281,517 | 491,417 | 772,957 | 0 / 0 / 0 |

Each join had zero occupied lanes and the 1,342,177,280-byte Tower limit. The traces read the budget's monotonic nonempty-grant generation after join and at teardown. Generation minus live equals releases. All four traces checked zero before and after ledger disposal. The ordinary runs used the existing world and grant close guards. The listed `tower-native-unit-admission` CTest also executed and passed its canonical, refill and cancellation-drain checks. [Budget implementation](../scaffolding/library/work_budget.tower)

For the separate CLI check, the saved input gained a 140-byte Tower tail exporting `peer_loop`, calling it through a function value and printing both results. All four jobs 1/2/4/8 objects matched the peer's complete `a50da521e9b10eb2618d4144f13d95ae34f1a71fcbcf36e74a7b38c1983c43ac` object. Each exported `tower_main` and `peer_loop`, linked with the hosted x64 runtime and printed exactly `42\n42\n`. The independent archived 1,000-function fixture also matched its full reference object `ae9e824d75213b15baa1811f9ec4db04a2f044cce25746d291b888c7952f4e08` at all four widths and printed exactly `999\n`. All eight executions returned zero with empty stderr. The one CLI emission per width is a correctness check. [Independent large fixture and reference object](lr_state_build_05c7bae5.tar.gz)

## Reproduction

The frozen tree was `0a60c95515876dd239e7c5e4b14053fd0f3f8386`. The previous cache contained a diagnostic binary from an older tree. The integrated stock profiler and CLI came from a fresh private Ninja Release cache with the checked-in Linux x64 bootstrap `77f23db6124377e49dd677714aaca147d507a80f05928a71c3cc18faa0040a0c`, LLVM/Clang 19.1.7, two build jobs and one compiler job. The 55-file profile resource manifest SHA-256 was `1e162bbebf65fa770e8152f4e146921b10122f89e63a12b1c724946d08387cfc`. The separately built CLI resource manifest was `0a1dc2f2d4e6610e9b84db5e10e8c202063d080183ed0fbc6aeced2ece9edb69`. The first raw-trace build failed to type-check typed buffers at the POSIX write boundary. Explicit pointer conversions fixed the diagnostic build. Both failing sources and compiler messages are retained. The deliberate truncated-stream replay exited nonzero with its expected diagnostic.

| SHA-256 | Executable |
|---|---|
| `dd4c1e9237e83933dbf83c59312181884e2aea4fc9264445d47d539acc2be684` | Integrated stock frontend-units profiler |
| `c320b511109b222c027887d96db0672205f38768a842b3f8b77712b738b4155c` | Profiler with all frontend and grammar callbacks off |
| `72ef2096c56f6507bf4db4c074aa2cf0ddb8d3a6b8120bb33529435d058acbfb` | Profiler with post-join raw spans and explicit close checks |
| `d583e9e76ba03b87cad4f1ea0ffe7406aee157b46e6325f3beb5126b709bc1cb` | Integrated fixture-enabled native CLI |

The command was `PROFILE RESOURCE_ROOT 1 W 4096 uniform dependencies artifacts OUTPUT_DIR`, adding `grammar` only for each width's trace. Debian 12, Ryzen 9 5900XT, effective cpuset 0–31, quota 3,071,999 µs per 100,000 µs, cgroup memory cap 129,569,390,592 bytes and swap zero. Workloads used CPUs 1–8, eight distinct physical cores with no SMT siblings in the mask. CPUs 1–7 share one L3 and CPU 8 belongs to the other. The sampler and movable agent services used 0,16. No exclusive cpuset lease or immutable image digest was available. Each profile PID reported affinity 1–8. All 60 profiles had zero throttling and zero memory-event deltas. The primary run's sampled cgroup usage peaked at 10,691,432,448 bytes. Its shared lifetime high water remained 11,466,723,328 bytes. Individual RSS and Tower charges appear above.

Packet `d0c37a70-f76a-4b2e-8882-60a22bb54125.tar.gz` contains the raw inputs, exact commands, ordinary and trace ELFs, CLI resources, timing and cgroup samples, wave intervals and replay code, release receipts, objects, stdout, exit codes and hashes. Restoring the two private probe files reproduced the stock profiler, CLI and all ordinary compiler provider objects byte-for-byte. The repository change records evidence only. The manager owns publication.

The final pull brought in `fe008af50f7ad27d6f15b86927122baf9d8051a9`, including a change in entity-stage storage. A second fresh stock build of that parent passed the one- and four-worker 4,096-body byte, interpreter and joined-lane checks. Its four-job CLI object matched the frozen peer reference and its linked executable printed 42 twice. The packet's `joined/` directory holds these three acceptance runs. The timing and overlap tables use only the originally assigned `5b47fc94` tree.
