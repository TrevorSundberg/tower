# LR action storage peer review

**Correctness disposition: repaired.** At `a095b0d84cd0a1d3029e314cad58d792dda45292`, serial reconstruction of a previously published parallel table returned `Capacity` after overwriting old reductions. The independent serial copy still contained the EOF-only table. The charged, nine-alternative grammar reproduced the mismatch on Deck, exit 134. Holding the remaining ledger after solving the new lookahead isolates action materialization from earlier graph allocation.

**Release recommendation.** Accept the repaired ownership behavior. Hold the throughput claim and performance-based adoption pending representative integrated measurements. B1's final 4,096-body serial and twelve-worker multi-unit cases lost wall and CPU in both pairs. The separate multi/twelve observation admitted zero parallel action waves on either arm.

## Source and ownership

- Compact handoff SHA256 `e8f969a15777f10ddb1ce47e086496a1f2778607ca217324565c50bc8edebf94`. Its production Git blobs match published `lr_work a3b0df48`, `lr_states da3c1a9a`, `lr_lalr 262f2a13`. Its timed fixture is `78115261`; the separately recorded merged fixture SHA256 matches published blob `6e413d01`. Timing used public745; merged owner validation and this peer used public77.
- Action jobs own separate scratch arenas and disjoint contiguous output ranges. Initialization increments the cleanup count before ticket setup. Access, lane admission and the owner view precede synchronous dispatch. Partial submissions drain before the view closes. Failed tickets and job errors precede any row installation. A partially appended replacement owns only the detached chunks; each other initialized task retains its own. The parent entity outlives all these defers.
- Successful publication transfers chunks without allocation or moving payloads. The old arena and new arenas stay charged together. The coordinator disposes individually owned rows once, replaces every descriptor, then retires the old arena once. Inline rows and arena borrows have no individual release. Destruction disposes independent rows, the published arena, then the records containing the row descriptors.
- Count or lane fallback invokes the serial collector. For state-local output, the null scratch argument selects the state's records arena; both state constructors initialize that pointer even on a null ledger. Standalone output with null scratch uses its independent vector. Workers pass their own arena. The existing literal test checks an uninitialized worker arena, typed first-chunk denial/retry, and stable serial reuse. The admission, ticket and row emission functions are unchanged by this repair.
- The fix reserves growing rows in private scratch before writing any existing action. Only after all reservations succeed does the coordinator attach those chunks to the current action set and install the enlarged descriptors. Rows with sufficient capacity require no new allocation. The ordinary initial serial build retains its existing path. In the regression, refusal preserves every reference row and the ledger snapshot; retry produces the nine literal terminals and EOF in order. Parallel replacement restores every original row and the original arena retention/payload. World teardown checks bytes, lanes and grants. Repaired blobs are `lr_lalr a93806e9`, `tests/lr_budget 6a0118ed` and `tests/lr_work 502f5d8e`.

## Owner measurements

Each row compares B1's **final** two pairs. Wall and CPU are percentage changes of means. Peak charge (bytes) and process RSS (KiB) use the maximum per arm; switches sum the two samples. Retained bytes and grants matched in every pair and joined lanes were zero. The CSV contains 32 distinct raw-output paths. Complete ordinary outputs and ELFs remain on KinmenB. [Owner receipt](lr_action_arena_c49c8b37.md)

| Workload / workers | Wall % (pair 1, pair 2) | CPU % | Peak charge before / after | RSS before / after | Retained bytes / grants | Switches before / after |
|---|---:|---:|---:|---:|---:|---:|
| Small16 / 1 | −7.01 (−10.31, −3.59) | −8.36 | 76839343 / 76839375 | 136064 / 136280 | 12947675 / 11146 | 882 / 897 |
| Small16 / 4 | −3.90 (−6.82, −1.11) | −6.27 | 81290791 / 81290823 | 141156 / 143224 | 12944851 / 11147 | 2426 / 2321 |
| Single4096 / 1 | +2.22 (+2.97, +1.63) | +2.24 | 466588941 / 466589133 | 590488 / 590912 | 415845895 / 275178 | 881 / 894 |
| Single4096 / 8 | −7.93 (+3.41, −17.11) | −11.38 | 466567453 / 466567453 | 596856 / 597044 | 415843071 / 275179 | 18461 / 18131 |
| Multi12×256 / 1 | −0.66 (+3.30, −4.32) | −0.69 | 488045471 / 488045471 | 577400 / 577316 | 446491857 / 319907 | 8636 / 8642 |
| Multi12×256 / 4 | +0.18 (−0.99, +1.37) | −0.57 | 603158735 / 612468833 | 739336 / 736132 | 446458137 / 319919 | 32176 / 34221 |
| Multi12×256 / 8 | −3.27 (−1.72, −4.83) | −2.49 | 626141831 / 610966428 | 979500 / 980184 | 446458361 / 319919 | 103542 / 103032 |
| Multi12×256 / 12 | +4.26 (+6.73, +1.71) | +3.63 | 923578131 / 918660902 | 1159184 / 1158992 | 446458649 / 319919 | 267796 / 271454 |

The initial 36 samples and four interim serial samples have separate source and measurement boundaries. Multi/serial wall changed +6.26% initially, +0.33% in interim confirmation, and −0.66% in the final mixed pair. Multi/eight went from +0.61% to −3.27%. In B1's separate final multi/eight observation, action kernel CPU fell from 98.13 to 56.87 ms across different admitted wave counts (147/155). This supports a local effect. The owner timings predate the peer repair.

## Deck execution

Public compiler SHA256 `77f23db6124377e49dd677714aaca147d507a80f05928a71c3cc18faa0040a0c`, CPU0–1/quota2/3GiB/swap0. Repaired runners `112ae324` and `31519532` passed `lr`, `lr-bounded`, `lr-order` (150 grammar trials) and `lr-scratch-budget` once each. Combined 5.03 s wall, 6.48 s CPU, maximum RSS 544088 KiB. Focused rebuild 54.89 s wall, 71.86 s CPU, 732208 KiB. Injected allocator faults ran in the existing serial controls; the threaded LR selector used production allocation.

A separate unchanged Tower driver checked every reduction in the completed start row across 12 serial/parallel rebuild cycles per process. Two runs per arm and width, total wall/CPU and maximum RSS before → after: one worker 0.10/0.08 s, 50368 KiB → 0.09/0.06 s, 50340 KiB; two workers 0.10/0.08 s, 51244 KiB → 0.08/0.06 s, 51364 KiB. These short runs establish validation cost only. The first driver build used an invalid output-kind spelling; the first link omitted the named-worker entry. Both diagnostics are retained. The final pairs used one driver object and the same frozen runner-support object. Container drained; 117 GiB free.

[Raw Deck checks, failing reproduction, comparison inputs and costs](../build/d1_ecs/lr_action_peer_a095b0d8/). Final owner CSV SHA256 `f39ad822aa602d576fae37cf3227cee51f1bbbf84bfeadc21b634f5b4d812ea6`. Whole-host timing and milestone instrumentation remain with ROOT.

To reproduce on public77, build `cmake --build "$cache" --parallel 2 --target tower-lr-work-tests tower-frontend-tests`. Run `"$cache/tower-lr-work-tests" "$PWD/scaffolding" lr` for the regression and `lr-bounded` for the joined denial control. Run `"$cache/tower-frontend-tests" "$PWD/scaffolding" lr-order` and `lr-scratch-budget` for the independent oracle and fault controls. Applying just the two test-file changes over `a095b0d8` exposes the original partial table.
