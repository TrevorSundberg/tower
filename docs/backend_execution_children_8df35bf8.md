# Native backend preparation on 8df35bf8

The execution index now queues only present optional children. On an actual 1,000-function object compile this removed 38,032 null pushes and pops, halved pending vector capacity, and reduced first-use index CPU by 0.142 ms with one requested worker and 0.194 ms with four. The ordinary process timings do not establish a general compiler speedup.

The Foundation graph supplies six structural links and an optional bound call/function reference. Each non-null link enters the same LIFO position relative to other real links. Exported/external roots, parameters, source-ordered items, declaration identity checks and allocation-failure returns retain their existing paths. The LLVM context and publication stay single-owner. The serial walk had little duplicated real work to distribute. [Prior execution-index contract](../scaffolding/tests/backend_execution_index.tower) · [Earlier phase attribution](compiler_within_unit_e0e3530b.md)

| Actual single-unit input | Real visits / duplicate visits | Null entries before → after | Peak pending entries before → after | Capacity in pointer slots before → after | Retained flag bytes both |
| --- | ---: | ---: | ---: | ---: | ---: |
| 16 direct functions | 115 / 1 | 640 → 0 | 61 → 31 | 64 → 32 | 19 |
| 1,000 direct functions | 6,019 / 1 | 38,032 → 0 | 1,045 → 1,015 | 2,048 → 1,024 | 1,003 |
| 4,096 loop bodies with import, export and callback | 182 / 9 | 1,077 → 0 | 92 → 28 | 128 → 32 | 4,106 |

The function guard caught the sole duplicate on the 1,000-function input. Eight non-function revisits remained on the sparse 4,096-body input. Scanning its 4,105 declaration slots cost 0.495/0.303 ms median coordinator CPU at jobs 1/4. All 144 paired same-graph trials checked every retained flag. The diagnostic visit census ran separately from clocks and ordinary compilers. [Census and inputs](C:/Sandbox/build/codex_ecs_20261122/A1/backend_prepare_8df35bf8/observation/) · [Same-graph trials](C:/Sandbox/build/codex_ecs_20261122/A1/backend_prepare_8df35bf8/samegraph.csv)

At 1,000 functions the first three phase pairs gave index CPU 1.659 → 1.471 ms (one worker) and 1.706 → 1.730 ms (four). Eight additional counterbalanced first-use pairs per worker count gave 1.596 → 1.455 and 1.564 → 1.370 ms, with 5/8 and 7/8 pairs favorable. The encompassing preparation phase fell from 1.764 → 1.592 and 1.585 → 1.419 ms. In the initial observations LLVM optimization alone took 41.72/43.33 ms CPU and frontend parsing/checking took 217.8/248.4 ms wall. Those phases dominate this compile. [Separate phase records](C:/Sandbox/build/codex_ecs_20261122/A1/backend_prepare_8df35bf8/intervals.csv) · [First-use confirmation](C:/Sandbox/build/codex_ecs_20261122/A1/backend_prepare_8df35bf8/first-use.csv)

| Ordinary object compile | Jobs | Wall ms before → after | CPU ms before → after | Peak RSS KiB before → after |
| --- | ---: | ---: | ---: | ---: |
| 16 | 1 | 255.8 → 251.2 | 195 → 190 | 150,204 → 150,168 |
| 16 | 4 | 287.4 → 279.9 | 240 → 240 | 154,492 → 154,106 |
| 1,000 | 1 | 370.0 → 367.6 | 315 → 305 | 159,474 → 159,478 |
| 1,000 | 4 | 401.9 → 403.6 | 370 → 375 | 164,508 → 164,534 |
| 4,096 | 1 | 1,780.1 → 1,759.9 | 1,705 → 1,690 | 586,826 → 586,678 |
| 4,096 | 4 | 1,474.0 → 1,472.9 | 1,985 → 1,995 | 593,392 → 593,414 |

Medians of four paired rounds, fresh processes, warm files, identical x86_64-pc-linux-gnu inputs and default LLVM optimization. CPU is user plus system, recorded at 0.01 s resolution. All 48 objects matched their references byte-for-byte. The 16/1,000 controls used pre-existing independent objects and printed 15/999. The 4,096 case used the retained unit/import plus a small export and executable tail. Its paired object matched throughout and printed 42 twice. KinmenA shared the host with A2. A1 used CPUs 12–23, quota 12, 12 GiB, swap 0. The build/validation container peaked at 1,414,795,264 bytes including cache, with zero OOM events. [All ordinary samples](C:/Sandbox/build/codex_ecs_20261122/A1/backend_prepare_8df35bf8/ordinary.csv)

The real execution-index selector passed invalid function identity, serial allocation denial/recovery, identical canonical bytes and final private buffer/world cleanup. At 32/64 bits and jobs 1/4, both compilers agreed on canonical/reparsed bytes, raw and optimized LLVM, object bytes, Graph/Fast output 45 then 2, and the first reserved-symbol error at line 2 column 1. LLVM retained the external declaration, exported bridge and callback while omitting the dead body. Linux x64 raw/optimized native differential and actual raw/optimized wasm32 execution also produced 45 then 2. [Exact commands and outputs](C:/Sandbox/build/codex_ecs_20261122/A1/backend_prepare_8df35bf8/correctness/)

Frozen source `8df35bf8`, public bootstrap `77f23db6`, ordinary compiler `52b9ad58` → `25949677`, candidate source blob `cc389e74`. Integration on `18c132d4` rebuilt the changed frontend and LR inputs. Merged compiler `ede4e3b9` reproduced all six workload/worker objects, both width-specific IR/object/canonical outputs, Graph/Fast answers and both focused selectors. The backend provider remained byte-identical to the measured candidate. The first diagnostic compile required explicit usize-to-u64 conversions. All validation children exited before container stop. [Build identities, scripts and raw logs](C:/Sandbox/build/codex_ecs_20261122/A1/backend_prepare_8df35bf8/)
