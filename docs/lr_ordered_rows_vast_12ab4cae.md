# Ordered LR runtime rows on Vast slot 5

On the integrated compiler, copying strictly ordered action rows saved 159,840 retained bytes for twelve 256-body units at every width tested. At 30 workers it cut mean frontend wall time by 11.23% and CPU time by 13.42% relative to insertion. Four workers gave the lowest candidate mean, 1.134 s. Increasing the budget from eight to 30 took 18.07% longer and used 2.28 times the CPU. Serial 4,096-body results overlapped. These are four paired observations per configuration on one allocation. [Earlier measurement](lr_ordered_runtime_rows_a095b0d8.md)

## Paired throughput

Fresh processes, warm filesystem, production allocator, grammar observation off. Wall and process CPU seconds cover bounded batch creation, input setup and frontend compilation through join. The existing outer timing callback remained enabled in both arms. Formatting, interpreter checks, artifact writes and teardown follow that interval. RSS is maximum whole-process GNU time RSS in KiB across the four runs. Arrows read control → integrated.

| Units × bodies | Workers | Mean wall s | Mean CPU s | Max RSS KiB | Wall change range across pairs |
|---|---:|---:|---:|---:|---:|
| 1 × 4,096 | 1 | 1.447 → 1.437 | 1.447 → 1.437 | 588,224 → 585,468 | −2.28% to +1.25% |
| 12 × 256 | 1 | 2.685 → 2.598 | 2.685 → 2.598 | 500,112 → 497,404 | −4.06% to −2.77% |
| 12 × 256 | 4 | 1.321 → 1.134 | 5.124 → 4.425 | 685,580 → 669,340 | −24.11% to −1.64% |
| 12 × 256 | 8 | 1.242 → 1.263 | 8.080 → 8.215 | 950,316 → 931,228 | −13.51% to +25.00% |
| 12 × 256 | 12 | 1.233 → 1.206 | 12.959 → 12.681 | 1,173,276 → 1,129,212 | −12.12% to +7.51% |
| 12 × 256 | 16 | 1.535 → 1.465 | 17.681 → 16.649 | 1,236,328 → 1,199,960 | −14.17% to +15.83% |
| 12 × 256 | 30 | 1.679 → 1.491 | 21.650 → 18.746 | 1,274,944 → 1,230,188 | −16.48% to −2.89% |

At 30 workers, maximum Tower charge was 908,217,807 → 869,663,777 bytes. At join, the live results held 375,662,897 → 375,503,057 bytes. Both arms held 257,735 grants. Each held zero lanes. For serial 4,096 bodies, peak charge was 461,804,648 → 459,241,312 bytes, retention was 405,508,024 → 405,494,704 bytes and both held 281,516 grants. Separate close probes in both arms checked zero grants, lanes and bytes immediately before and after budget disposal for every configuration, and emitted their success record after freeing the batch. All 14 passed. Whole-process and frontend timings, all memory counters and individual pairs are in the packet.

## Overlap and phase attribution

Each arm ran a separate grammar trace for the five configurations listed below, using the same ordinary binaries. Each simultaneous outer kernel compiled one unit. Inner peaks count simultaneously active participants within one dispatch in one world. Independent peak counts may occur at different times.

| Workload / workers | Outer peak, both | Action waves, control → integrated | Max simultaneous action participants | Max simultaneous semantic participants, control → integrated |
|---|---:|---:|---:|---:|
| 4,096 / 1 | 1 | 0 → 0 | 0 | 1 → 1 |
| 12×256 / 8 | 8 | 146 → 158 | 4 | 7 → 7 |
| 12×256 / 12 | 12 | 0 → 0 | 0 | 1 → 6 |
| 12×256 / 16 | 12 | 298 → 341 | 4 | 5 → 7 |
| 12×256 / 30 | 12 | 490 → 492 | 4 | 20 → 19 |

At twelve workers, the candidate spent 5.456 cumulative coordinator CPU seconds in 936 table builds within 6.169 seconds of parsing. At 30 it spent 5.889 seconds in table builds within 6.859 seconds of parsing. The corresponding eight-worker figures were 3.071 and 3.617 seconds. These are nested sums over units. The candidate trace recorded 194,644 voluntary switches at eight and 830,965 at 30. Four outer refills at eight fell to zero once all twelve units could start. Its parallel lookahead action kernels used 0.057 and 0.320 summed CPU seconds at eight and 30. Wave counts describe lookahead action generation. The ordered-row change runs later, as runtime tables collect those actions.

A second pair of diagnostic binaries timed the call to `lr_runtime_create_parallel_result` inside table construction. On serial 4,096, the 78 calls took 19.15 → 13.51 ms of coordinator CPU. Across 936 calls the twelve-unit totals at 8/12/16/30 workers were 1.783 → 0.946, 4.044 → 2.098, 3.716 → 2.377 and 3.096 → 1.785 CPU seconds, respectively. At twelve the runtime creation phase remained active with zero lookahead action waves in both arms. These samples include the entire runtime construction call on each coordinating thread. CPU on other participating threads is outside this clock. The diagnostic binaries and their one sample per cell are separate from the ordinary averages.

The next attribution target is the allocation, row normalization and interning work inside runtime creation under concurrent unit worlds. The present clocks locate a cost increase with width but do not identify a contended lock. A dedicated 32-worker comparison needs 32 timing CPUs in addition to housekeeping capacity and a quota supporting their concurrent use.

## Reproduction and checks

The candidate is `12ab4cae717d4879e393704a8d3b9a1f635bd4f2`, tree `3b9bdf81f2c56dfd792e3053af89f3e5acb5189c`. The control reverses the two production files and companion test changes from `2049a2a5e2ecfd89bff59e554df977765da118f0`. The resulting tree is `280878d236a9c6380ba0d8267de233176bf224ff`. Both use the same checked Linux bootstrap `77f23db6124377e49dd677714aaca147d507a80f05928a71c3cc18faa0040a0c` and 55 packaged profile resources (SHA-256 of the relative-path manifest `1e162bbebf65fa770e8152f4e146921b10122f89e63a12b1c724946d08387cfc`). Ordinary profile ELF SHA-256 values were `1355ca9dff2cccf5486ad80053888b12eaf523eb8ae12d177622ed439cc2da21` and `5c9b75e806f7fdf78d4c27acf2cc433c79c19d368b603f4df86e10a883fc2872`.

Linux x64, Debian 12, kernel 6.8.0-151-generic, LLVM/Clang 19.1.7, Release, outer build jobs 2 and compiler jobs 1. The pre-existing native cache had work tests disabled. Each source arm used a private cache and the verified default bootstrap. The first setup attempt lacked the standalone patch tool (exit 127). The first compiler attempt without reversing the test hunk failed on the fixture's `lr_row_collect` call (exit 1). The packet retains both diagnostics. The main checkout and its existing cache supplied no build products to the measured binaries. The native target uses the installed LLVM. The workspace supplied no immutable container image digest.

The Ryzen 9 5900XT exposes 16 physical cores and 32 logical CPUs. Effective cpuset 0–31, quota 3,071,999 µs per 100,000 µs, memory cap 129,569,390,592 bytes, swap cap zero. Slot-owned agent and coordination processes were pinned to the sibling pair 0,16 during timing and restored afterward. The 56 ordinary samples used CPUs 1–15,17–31. This leaves 15 physical cores and 30 logical CPUs. The cpuset controller advertised no exclusive CPU list. Provider services and other host tenants were outside the lane's affinity controls. Per-run throttling deltas were zero. Cgroup lifetime peak stayed at its pre-timing 9,503,150,080 bytes. A 50 ms sample of whole-cgroup memory peaked at 9,437,970,432 bytes in the ordinary runs. The read-only cgroup includes infrastructure and file cache. GNU time provides a separate per-process RSS high water mark.

`build.sh` and `measure.sh` in the packet contain the build flags, run order and output checks for the following command.

```sh
taskset -c 1-15,17-31 "$profile" "$resource_root" "$units" "$workers" "$bodies" uniform dependencies artifacts "$output_dir"
```

The two initial four-body smoke runs used one unit, one worker and CPUs 1–4. Paired full-workload proofs at serial 4,096 and twelve units/eight workers preceded the 56 ordinary samples. Both arm and configuration order reversed on alternating rounds. Every run checked interpreter results of 42 for `answer()` and `body_0(36)`. Complete generated sources, import and canonical Foundation bytes compared equal against the serial or eight-worker seed for that shape. Across arms and widths, single-unit canonical SHA-256 was `79b43b59b1adabbbc407fafd674ab534f33ddf70fe72c5ae4c529a010e1879ce`. The uniform multi-unit canonical SHA-256 was `007bb2b0e9852932d89216da4e1128c11a2d7ecfa1f1b75ae9010d786d59f183` for each of the twelve units. The integrated LR worker equivalence and unit admission selectors were listed with `ctest -N` and both executed and passed (2.21 s). Their output covers serial/threaded LR comparison and nested release, refill, canonical output and cancellation drain.

The manager packet `f5c01f54-a570-45d3-83ed-2c14dcccbefb.tar.gz` is 10,713,626 bytes, SHA-256 `e63bbddcc4080d5937676a1d35f098d24c7b07e16fcf2e8368f68eaa543f2c8e`. All manifest entries verified after extraction. It includes both ordinary ELFs, both pairs of diagnostic ELFs, the LR runner, public bootstrap and resources, full artifacts, sample JSON, GNU time data, cgroup counters, probe patches and build and failure logs.
