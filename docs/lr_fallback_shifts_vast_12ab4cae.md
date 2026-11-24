# LR fallback insertion shifts on Vast slot 5

**The guarded merge remains an experiment.** Rows with two ordered runs accounted for every fallback insertion in this workload. The merge lowered the 30-worker mean frontend wall time by 2.19%, with five of six pairs faster. At four workers the mean rose 1.21%. At eight workers the mean fell 1.43%, but one arm order favored insertion and the other favored merging. Serial 4,096 was effectively flat. The ordinary timings did not establish a reproducible general throughput gain.

## Where the bytes move

On the frozen integrated source, 12 units × 256 bodies produced 25,908 fallback rows and 819,504 successful insertions at each of 4, 8 and 30 workers. The Tower diagnostic reconstructed the lower-bound insertion position against the sorted, deduplicated prefix immediately after runtime construction. Its full length-by-distance and producer-order histograms matched across widths. The weighted distances totaled 7,695,852 action slots of 24 bytes each, exactly the 184,700,448 bytes from the previous collector instrumentation. Serial 4,096 gave 2,159 fallback rows, 68,292 insertions and 15,391,704 shifted bytes. No input duplicates occurred in these fallback rows. [Previous in-collector counters](lr_runtime_attribution_vast_12ab4cae.md)

| Row length | Rows | Insertions shifting at least one slot | Median / p90 / max positive shift in slots | Bytes shifted |
|---:|---:|---:|---:|---:|
| 106 | 612 | 33,048 | 27 / 48 / 51 | 21,635,424 |
| 107 | 3,060 | 168,300 | 28 / 49 / 51 | 111,819,744 |
| 108 | 816 | 44,880 | 28 / 49 / 51 | 29,846,016 |
| 109 | 204 | 11,628 | 29 / 49 / 51 | 7,941,312 |

These four lengths contributed 92.71% of shift bytes. All 4,692 rows had 51 ordered shifts, then an inversion at the first reduction, followed by an ordered range list from one rule. The other fallback lengths also had their sole ordering break at the shift/reduction boundary. The producer walks terminal edges first, then emits lookahead ranges for completed items. State symbol discovery uses kernel and closure item traversal. The observed ordering within the shift prefix is workload-dependent. [LALR producer](../scaffolding/compiler/lr_lalr.tower) · [State edge construction](../scaffolding/compiler/lr_states.tower)

The candidate only changed the runtime row collector. When its ordinary ordering check found a break, it checked that every prefix element was a shift and the suffix consisted entirely of strictly ordered reductions. The comparator includes target state, so those runs cannot contain an exact cross-run duplicate. A single checked reservation precedes the two-way merge and tail copy. Unordered, mixed-kind or duplicate-bearing shapes continue through the insertion oracle. The source row remains borrowed throughout. State interning and grammar conflict policy use the existing implementations. The histogram and compiler instrumentation are separate from the ordinary binaries.

## Counterbalanced ordinary controls

Each entry is the mean of six fresh processes with warmed filesystem inputs. The arrows run from frozen ordered collector to guarded merge. Times cover batch creation through frontend join. RSS is the maximum whole-process high water mark in KiB. Every pair is included.

| Workload / workers | Wall s | CPU s | Faster pairs | Pairwise wall change range | Peak Tower bytes | Peak RSS KiB |
|---|---:|---:|---:|---:|---:|---:|
| Serial 4,096 / 1 | 1.434 → 1.431 | 1.434 → 1.431 | 3/6 | −1.41% to +0.76% | 459,241,312 → 458,978,352 | 585,484 → 585,284 |
| 12×256 / 4 | 1.215 → 1.230 | 4.734 → 4.783 | 5/6 | −3.66% to +17.06% | 542,321,360 → 537,368,887 | 669,372 → 671,604 |
| 12×256 / 8 | 1.126 → 1.110 | 7.272 → 7.222 | 4/6 | −24.63% to +32.07% | 590,795,637 → 573,663,949 | 933,308 → 927,252 |
| 12×256 / 30 | 1.448 → 1.416 | 18.139 → 17.831 | 5/6 | −6.22% to +4.72% | 874,512,767 → 864,846,679 | 1,238,568 → 1,242,776 |

At eight workers the odd/even groups averaged +6.67%/−5.48% paired wall change. At 30 they averaged −0.33%/−3.93%. Four-worker retention fell from 375,502,545 to 375,497,937 bytes, with the same 4,608-byte reduction at eight and 30. Serial retention fell by 384 bytes. Each arm produced identical input, import and canonical bytes, both interpreter results were 42 for every unit, and every join reported zero lanes. The project profile also ran its normal world and grant teardown guards.

The first bounded controls used the previously verified insertion/ordered pair. A second serial and four-worker pair checked the actual candidate against the ordered baseline before running the six rounds. Timings exclude the histogram and all sanitizers. Cgroup CPU quota was 3,071,999 µs per 100,000 µs, cpuset 0–31, memory cap 129,569,390,592 bytes and swap zero. Timing affinity 1–15,17–31 occupied 15 physical cores of the Ryzen 9 5900XT, with sibling pair 0,16 reserved for coordination. All 48 ordinary samples had zero throttling delta. The host supplied no exclusive cpuset guarantee or immutable image digest. The packet records per-run GNU time wall/user/system/RSS, frontend timings, charge, grants and cgroup peak and sampled current memory.

## Correctness, provenance and disposition

Four ordinary candidate selectors passed, including threaded LR equivalence, bounded refusal/retry with preservation of the old EOF table, the independent 150-grammar order oracle, and LR scratch-budget transactions. A separate AddressSanitizer build included a collector fixture comparing every split of a 17-entry row to individual insertions, with equal terminal ranges across kinds, private-copy ownership, both merge tail directions, exact-charge refusal/retry, unordered reductions and a duplicate-heavy input that fits a budget for only eight actions. The ASan `lr`, `lr-bounded` and `runtime-faults` executions passed. The allocation-fault fixture compared conflict results and old rows through serial and worker-result construction using single-owner fault injection. Real worker overlap used the production allocator. The first fixture build used the reserved name `expected`. Renaming that local fixed the build. Its original source and compiler diagnostic are in the packet.

The thread-instrumented collector compiled and linked, but the LLVM 19 TSan runtime exited 139 before the test began when its request for `personality(ADDR_NO_RANDOMIZE)` was denied. Race coverage for this candidate is unverified. Source-language UBSan is unsupported by the available Tower instrumentation. An independent reproduction of the 30-worker signal should use the preserved ordinary pair on an exclusive allocation. Reconsider the candidate only if that comparison also resolves the 4/8-worker variability and retains the serial result.

Frozen source `12ab4cae717d4879e393704a8d3b9a1f635bd4f2`, tree `3b9bdf81f2c56dfd792e3053af89f3e5acb5189c`. The ordinary baseline/candidate ELFs had SHA-256 `5c9b75e806f7fdf78d4c27acf2cc433c79c19d368b603f4df86e10a883fc2872` and `9ae4133d146e635a6f95b3ac16aa15f95aada2dcd9fd54998873b58cf46e0446`. Candidate collector blob `edafb7e4dcac4797c3066ef3fac4970dbe48e5bc`. Native Linux x64, Debian 12 with LLVM/Clang 19.1.7, Release, two outer build jobs and one compiler job, checked-in bootstrap `77f23db6124377e49dd677714aaca147d507a80f05928a71c3cc18faa0040a0c`. The resource manifest SHA-256 was `1e162bbebf65fa770e8152f4e146921b10122f89e63a12b1c724946d08387cfc`. The ordinary profile took `RESOURCE_ROOT UNITS WORKERS BODIES uniform dependencies artifacts OUTPUT_DIR`. Single and uniform multi canonical SHA-256 values were `79b43b59b1adabbbc407fafd674ab534f33ddf70fe72c5ae4c529a010e1879ce` and `007bb2b0e9852932d89216da4e1128c11a2d7ecfa1f1b75ae9010d786d59f183`. The packet holds the candidate patch, validation fixtures and binaries independent of the restored source.

The candidate tree was `f37756490a7e7201c4ff0d7d4e8d0c90e89c5528`. Both prior cache profile ELFs and the integrated ordinary LR runner again matched their pre-assignment hashes after restoration. The verified packet `540bbae0-cc54-48b4-b614-f9d76d206e49.tar.gz` is 25,743,390 bytes, SHA-256 `e677eaa21b292a18d4a2ffd2f88d11ec36e0f1359d7149181d2fb94943f7c4f0`. All archive members passed their manifest checks after extraction.
