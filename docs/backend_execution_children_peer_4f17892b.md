# Independent LLVM object check for absent Foundation children

At `4f17892b570cc65bbda1edd8c0b27f164e2b129e`, skipping absent children preserved the complete native object, its exported symbols and its execution result on all four inputs below. The 1,000-function traversal removed 38,032 null stack entries. Every real entity visit, including the repeat visit, occupied the same position in the traversal. Every retained-function flag matched. [Original backend measurement](backend_execution_children_8df35bf8.md)

| Input | Native output, in order | Defined global symbols | Whole-object SHA-256, both arms |
| --- | --- | --- | --- |
| 16 direct functions | 15 | `tower_main` | `cdc5a6ec0f2b12f1f7a622f45a27859e374558867df97470c8120cd81ddfb407` |
| 1,000 direct functions | 999 | `tower_main` | `ae9e824d75213b15baa1811f9ec4db04a2f044cce25746d291b888c7952f4e08` |
| 4,096 loop bodies, import, export and callback | 42, 42 | `peer_loop`, `tower_main` | `a50da521e9b10eb2618d4144f13d95ae34f1a71fcbcf36e74a7b38c1983c43ac` |
| Execution roots, recursion and effects | 45, 2 | `retained_export`, `tower_main` | `408034f2890fa8916e6dcd9f956ea81330b0bb2a6306ef88a9880d776fe75600` |

The first two inputs and their independently produced reference objects came from the checked-in archive with SHA-256 `bddb94c8be403e47458ae4c1ff43c85f06d431707b0bdb40a27820a3d4db494d`. All 16 object emissions for these inputs matched the reference bytes and symbol lists. Each linked executable returned 0 with its expected line on stdout and empty stderr. [Source and reference objects](lr_state_build_05c7bae5.tar.gz)

The 4,096-body extension started after the two smaller controls passed. The existing Tower profile generated the 347,291-byte unit, its 333-byte import and canonical Foundation. All three matched the corresponding files in slot 5's sealed packet byte-for-byte. The historical backend-specific executable tail and finished object were unavailable here. A recorded 140-byte tail exports a wrapper around `body_0`, stores its function value, and prints `answer()` and the result of calling the wrapper with 36. All eight objects matched across arms, widths and rounds, and all eight executables printed 42 twice. The visit counts below describe this reconstructed variant. [Profile generator](../scaffolding/tests/frontend_units_profile.tower)

## Reachability and allocation

A separate diagnostic compiler recorded entity ID, first-seen ordinal, kind and index on every non-null pop, followed by the complete vector of retained flags. For each input the two traces compared byte-for-byte after separating the stack counters. All eight diagnostic objects matched the corresponding ordinary objects. Observer allocations and clocks are excluded from the ordinary timings.

| Input | Real pops / revisits, both | Null pops, restored → integrated | Peak pending entries | Allocated pointer slots | Flag bytes, both |
| --- | ---: | ---: | ---: | ---: | ---: |
| 16 | 115 / 1 | 640 → 0 | 61 → 31 | 64 → 32 | 19 |
| 1,000 | 6,019 / 1 | 38,032 → 0 | 1,045 → 1,015 | 2,048 → 1,024 | 1,003 |
| 4,096 reconstructed | 122 / 6 | 687 → 0 | 85 → 20 | 128 → 32 | 4,106 |
| Execution roots | 127 / 6 | 714 → 0 | 65 → 27 | 128 → 32 | 8 |

On both arms the direct `execution-index` selector checked unreachable and retained declarations, mismatched declaration identity, serial allocation refusal and recovery, stable canonical bytes and final buffer/world cleanup. CTest listed zero tests matching that selector name. Both binaries ran the selector directly and returned 0. With LLVM optimization disabled on the execution-roots input, both raw IR files and both complete objects also matched. The IR defined the module entry, direct callee, callback, recursive function and export. It omitted the unreachable type producer. Both raw objects linked and printed 45 then 2. [Tower assertions](../scaffolding/tests/backend_execution_index.tower) · [Executable fixture](../scaffolding/tests/backend_execution_roots.tower)

## Source and audit boundary

The source tree was `9ee2b8920cda23c43be81e8ad58131661d9ff669`. The control restored just `scaffolding/backend/execution_functions.tower` from the parent of `60c9396f7fbaca16eb8213837c8c414fd650da59`. Its blob `f80df50d91d4f1a1b2e6770b1c2d50a934ab1ce9` also matches c49. The integrated blob is `cc389e741d3f2cc7a397b290190b0586ec24bc10`. Both depfiles identified 57 backend provider inputs, with this single content difference. Both private arms used the verified Linux bootstrap `77f23db6`, identical 55-file resource trees, LLVM 19.1.7 and the ordinary cache's link command. Re-emitting the integrated provider and relinking reproduced the cached CLI byte-for-byte. Only the backend provider object changed between ordinary link inputs.

| Artifact SHA-256 | Restored | Integrated |
| --- | --- | --- |
| Ordinary compiler | `bde3367b216e9e5bf0d8ce2497ba68bb3bc440d2937f4a4d00fa818d86334bbf` | `1edde5f377150e3eb840247983d24c2b56850f897fb7151826773aa043aa73ee` |
| LLVM backend provider object | `fa98b30d78328d9f25e472148a73980f3429498dfc558f65e971719faba44229` | `00024a99d72b3ac398a51ef93beedb5a6c6be88c4a38dfb90dd4278d75090309` |

This closes the independent native object and reachability check for **one** of the 20 delta paths in slot 7's reconciliation. The execution indexer is path 76 in the 1,283-path Git listing and the third data row in the delta map. The prior B2 contract covers its private traversal over frozen Foundation entities. The immediate lowering caller, Foundation edge policy and existing execution-root fixtures retain their earlier blob identities. Other audit rows keep their own dispositions. [B2 audit entry](compiler_ecs_audit_b2.md) · [Finite audit baseline](compiler_ecs_reconciliation_4e7ef17b.md)

## Validation costs on Vast slot 7

Each row reports the mean wall and CPU seconds of two fresh CLI invocations per arm and the larger process RSS in KiB. The orders were restored/integrated then integrated/restored, with warm files and LLVM's default optimization. Emission used x86_64-pc-linux-gnu. Clang linked each actual measured object with the same hosted runtime. Link and run measurements are recorded separately.

| Input / jobs | Wall s, restored → integrated | CPU s, restored → integrated | Peak RSS KiB, restored → integrated |
| --- | ---: | ---: | ---: |
| 16 / 1 | .340 → .340 | .335 → .335 | 146660 → 146276 |
| 16 / 4 | .390 → .390 | .415 → .405 | 151256 → 151192 |
| 1,000 / 1 | .570 → .570 | .565 → .565 | 157568 → 158052 |
| 1,000 / 4 | .610 → .615 | .645 → .660 | 163156 → 163136 |
| 4,096 / 1 | 2.480 → 2.490 | 2.480 → 2.480 | 579496 → 579348 |
| 4,096 / 4 | 2.080 → 2.085 | 3.160 → 3.175 | 586916 → 586436 |

The AMD EPYC 7502 slot exposed CPUs 0–63 with a 3,071,999 µs quota per 100,000 µs period. Timed emissions used CPUs 4–7 on distinct physical cores. Memory was capped at 91,586,822,144 bytes and swap at zero. The read-only cgroup reported a lifetime memory peak of 11,563,081,728 bytes throughout the ordinary emissions, with zero throttled time. GNU time reported peak process RSS in KiB and CPU time at 0.01-second resolution. These runs establish the allocation change and the checked outputs. Whole-compiler speedup remains unestablished.

The final rebase included newer driver and frontend sources at parent `aeba5225efd6d19e05243b8bd99c7bf8c53b102d`. A fresh Release build reproduced the LLVM backend provider byte-for-byte. At four jobs its CLI `f02e34071b8d9950224547cbc7ee603b51664314e5a64debdd62ec5245b1d743` emitted the same complete 16-, 1,000- and 4,096-body objects. All three linked and printed the expected lines. The post-rebase directory retains this separate smoke check and its own resources. Nine generated runtime texts differ from the frozen package only in the first-line module path. The paired timings and visit counts above remain tied to `4f17892b`.

The manager packet `936bec94-d80b-4d70-a6ec-d8a91062b3b2.tar.gz` contains 1314 verified files, 13041934 bytes, SHA-256 `ba46b233899701248864f714614dd40c3b86a52f30e2126b687d47618b7a2137`. The exact historical 4,096-body tail and object would be needed to reconcile the original 182-visit census.

The manager independently checked the 28 ordinary object files and export lists and executed all 28 linked products. The manager also recompiled the 16-, 1,000- and reconstructed 4,096-body inputs with the reviewed singleton-lookup compiler at `a0a4ecdd`, jobs 1 and target `x86_64-pc-linux-gnu`. Each object matched its post-rebase counterpart byte for byte. Linking each with the packet's runtime object produced 15, 999 and two lines of 42 respectively. This replay checked output equivalence on the newer compiler.
