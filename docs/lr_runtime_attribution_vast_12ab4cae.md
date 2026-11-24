# Where LR runtime table creation spends time on Vast slot 5

Across 936 runtime-table creations, both arms processed 268,164 rows and 7,610,076 input actions. The ordered collector handled 6,790,572 actions in 242,256 bulk copies. This eliminated **344,412 physical action-vector growths** (53.1%) and **177,449,472 bytes copied during growth** (89.8%). Both arms retained 251,388 unique rows, discarded 16,776 duplicates, and executed 76,824 row-equality tests. These counts repeated exactly at 8, 12 and 30 workers.

The clearest timing attribution is at twelve workers. All 1,236 private row jobs across the 492 worker-path calls actually executed on their unit coordinators. The other 444 calls used serial construction. Caller collection CPU fell from 2.596 to 1.059 s and normalization from 0.231 to 0.226 s. Collection accounts for 92.4% of the 1.664 s caller CPU difference **in this diagnostic pair**. Physical growth replaces the old vector buffer, acquires a byte grant, allocates the replacement, copies live elements and disposes the old owner. Equal retained-row and equality-test counts rule out a reduction in the number of rows interned. The observations identify allocation and copy work without establishing a specific contended lock.

### Caller buckets

Each cell gives **thread CPU / elapsed seconds**, summed across the twelve coordinating threads. Each arm and width had one bounded run. Remainder is the enclosing interval less the five disjoint buckets. The prior column uses the matching 936-call sample recorded before inserting per-row clocks.

| Workers | Collector | Row allocation | Collection and copy | Normalization | Interning and publication | Gotos | Remainder | Whole call | Prior whole call |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 8 | Insertion | .474 / .516 | 1.120 / 1.216 | .195 / .189 | .453 / .484 | .243 / .252 | .179 / .279 | 2.664 / 2.935 | 1.783 / 2.045 |
| 8 | Ordered | .434 / .472 | .515 / .551 | .190 / .187 | .425 / .451 | .231 / .238 | .177 / .224 | 1.971 / 2.123 | .946 / 1.096 |
| 12 | Insertion | .930 / 1.055 | 2.596 / 2.948 | .231 / .222 | .883 / .989 | .395 / .426 | .226 / .231 | 5.261 / 5.872 | 4.044 / 4.654 |
| 12 | Ordered | .885 / 1.008 | 1.059 / 1.192 | .226 / .222 | .827 / .925 | .378 / .409 | .222 / .227 | 3.597 / 3.982 | 2.098 / 2.428 |
| 30 | Insertion | .656 / .751 | 1.587 / 1.817 | .135 / .130 | .979 / 1.118 | .273 / .298 | .179 / 1.109 | 3.810 / 5.222 | 3.096 / 4.609 |
| 30 | Ordered | .587 / .677 | .686 / .780 | .136 / .133 | .828 / .946 | .254 / .275 | .171 / .478 | 2.661 / 3.288 | 1.785 / 2.389 |

At eight workers the insertion/ordered builds processed 29,157/32,516 rows on peer threads. At 30 they processed 109,497/109,932 peer rows, taking 3.221/1.666 summed peer CPU seconds across the five row buckets. Both twelve-worker runs dispatched zero lookahead action waves and executed zero runtime row jobs on peers. The per-row probes increased enclosing caller CPU against the previous trace by 23–108% across the six samples. Sequential CPU and wall clock reads also have different sampling instants. These measurements locate work, with substantial timing overhead and run-to-run scheduling variation.

The ordered path still inserted **819,504 actions** individually. Both arms shifted **184,700,448 bytes** within existing buffers to open insertion slots, in addition to the growth copies above. A next diagnostic can record shift distance and the first out-of-order position by row length for just this fallback. That would distinguish long shifts in a few nearly ordered rows from widely disordered rows before considering a collector change.

## Measurement boundary

The input is twelve identical 256-body units with the dependency fixture. Every unit interprets `answer()` and `body_0(36)` as 42. The control uses individual binary-search insertions. The integrated collector bulk-copies strictly ordered action rows and falls back to insertion for others. The source freeze is `12ab4cae717d4879e393704a8d3b9a1f635bd4f2`, tree `3b9bdf81f2c56dfd792e3053af89f3e5acb5189c`. Reversing `2049a2a5`'s two production files and associated test hunk on the freeze produces control tree `280878d236a9c6380ba0d8267de233176bf224ff`. The [previous paired throughput and 936-call trace](lr_ordered_rows_vast_12ab4cae.md) provide the reference for these measurements.

The unchanged outer timer brackets `lr_runtime_create_parallel_result` in `parser_table.tower`. The paired diagnostic binaries subdivide exclusive caller intervals in serial construction and in private row jobs that actually execute on the caller's pthread. Peer tasks accumulate counters privately on their stacks. Only the coordinator merges them after synchronous join. Each interval records monotonic elapsed time and executing-thread CPU time. A separate inclusive dispatch interval also includes caller row work and join waits.

- **Allocate** covers creation of the row descriptor and its physical backing. The action-vector allocations occur later, in collection.
- **Collect** covers the order check, copies, insertions and their action-vector reservations and resizes. Counters record successful capacity changes, live bytes preserved during growth, and bytes shifted to make room for an insertion.
- **Normalize** covers the precedence and conflict checks and range compaction in `lr_row_normalize`.
- **Intern and publish** covers hashing, equality probes, discarded duplicates, unique-row indexes and installation of the state-to-row mapping. On the private-job path the coordinator also moves completed goto descriptors into their final states during publication.
- **Gotos** covers construction of the goto data. The unbucketed remainder includes setup, job graph/admission, time outside row intervals, waits, reporting and cleanup. Nested dispatch totals and overlapping peer intervals must be read separately from the caller partition.

## Observer-off controls and verification

These were separate fresh processes using the previously verified ordinary ELFs. Entries give control → integrated. The frontend interval includes input setup and compilation through join. Peak RSS covers the whole process, including output verification and close. The one-sample 8- and 12-worker ordinary controls took longer with the ordered collector, even though its collector bucket shortened in the diagnostic runs. The earlier four-pair measurements remain the throughput reference.

| Workers | Frontend wall s | Frontend CPU s | Peak Tower bytes | Retained bytes at join | Peak RSS KiB |
|---:|---:|---:|---:|---:|---:|
| 8 | 1.018 → 1.251 | 6.571 → 8.271 | 588,568,973 → 561,529,231 | 375,662,609 → 375,502,769 | 947,968 → 924,000 |
| 12 | 1.242 → 1.304 | 13.045 → 13.744 | 871,226,640 → 848,568,392 | 375,662,897 → 375,503,057 | 1,166,348 → 1,124,796 |
| 30 | 1.721 → 1.509 | 22.322 → 18.968 | 895,431,429 → 860,858,762 | 375,662,897 → 375,503,057 | 1,269,528 → 1,232,692 |

All six diagnostics and six controls returned 42 for both interpreter checks in every unit. Each matched all 25 saved source, import and canonical artifacts byte-for-byte. Every join held 257,735 live result grants and zero lanes. The diagnostics additionally checked zero grants, lanes and bytes immediately before and after budget disposal. Per-run process wall/user/system, peak charge and RSS, cgroup measurements, coordinator/peer counters and exit codes are in the packet.

The host was the same Ryzen 9 5900XT on Linux x64, Debian 12, kernel 6.8.0-151-generic, LLVM/Clang 19.1.7. Both CMake caches used Release and the published bootstrap `77f23db6124377e49dd677714aaca147d507a80f05928a71c3cc18faa0040a0c` with two outer jobs and one compiler job. The profile resource manifest SHA-256 was `1e162bbebf65fa770e8152f4e146921b10122f89e63a12b1c724946d08387cfc`. The effective cpuset was 0–31, the quota 3,071,999 µs per 100,000 µs, and timing affinity was 1–15,17–31. Slot management used the sibling pair 0,16 during runs. The cgroup exposed no exclusive CPU list, so external host activity remains uncontrolled. All twelve runs had zero throttling delta, with a 129,569,390,592-byte memory cap, zero swap and an unchanged lifetime cgroup peak of 9,596,116,992 bytes. There was no 32-worker run.

The first build rejected an aggregate return across the diagnostic ABI. The replacement uses an explicit output pointer. The first executable returned 42 and produced the expected artifacts, but its 960 function entries failed the required 936-call scope check. The diagnostic report now uses the existing enclosing phase depth to select the 936 parser-table calls. Each corrected run separately counted 24 entries outside that scope. The source has another production call site in `frontend_table.tower`. The failed build, rejected first trace and raw output are preserved. Only the diagnostic builds contain the private probes. The measured baseline and integrated ordinary ELFs remained byte-identical to the first packet.

Both prior cache executables were rebuilt and verified byte-for-byte against their pre-assignment enclosing-phase ELFs. The evidence packet `9fbd4916-03f4-48ca-abc4-3463cf80c79f.tar.gz` is 8,963,436 bytes, SHA-256 `61e35f311333bec71187d76c4bde60e0cc66fd190a073d0e34131ea5f0b9217a`. Every manifest entry verified after extraction. It contains the ordinary and diagnostic binaries, both arm overlays, allocation and phase counters, commands, full outputs, failures and host receipts.
