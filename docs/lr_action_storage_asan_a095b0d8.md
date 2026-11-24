# Native ASan acceptance of LR action replacement

**Passed on Linux x64.** The ordinary `lr` selector ran twice, first on the published fixture and then with a regression for failure after partial worker allocation. Both exited 0 under the original 180-second guard, with exact expected stdout, empty stderr and no ASan or leak finding.

The production freeze was `a095b0d84cd0a1d3029e314cad58d792dda45292`, tree `546232665d410b548ad3c3290ddfb8c5a9ebb64d`. The LR work, state and LALR blobs were `a3b0df48`, `da3c1a9a` and `262f2a13`. The published test blob was `6e413d01`. Checkout `6e82dd82` added one test change outside the selected dependencies. The second run used test blob `0ec893f599227158b006ca8d8f112da896cbbd3d` with the same production inputs.

The new regression reserves competing bytes immediately before production action dispatch and inspects grants after join, before the coordinator retires the private arenas. The two passes leave room for zero chunks and for exactly the charge of one existing chunk. The joined grant count and byte total prove that the latter pass acquired one chunk before the rebuild returned `Capacity`.

Both refusals preserved the prior arena endpoints, an independent row and a borrowed row at their original addresses, and every item, edge and action compared with the serial reference. The workers drained and bytes, grants and lanes returned to their pre-call values. A retry with the same inputs succeeded and retired the independent owner. A separate direct action-kernel check rejected transfer into an arena with an incompatible budget before transferring to the proper owner.

The selector also checked repeated publication with equal retained and payload bytes, null-ledger and charged collection, serial reuse of the published 65–67 shift, conflicts and runtime tables. Its shared-budget barrier required two simultaneous participants and zero active participants after join. The charged world closed with zero bytes and released its last caller grant. The coordinated refusal checks used the production allocator. The barrier measures overlap separately from the number of failed action jobs.

| Scope | Wall s | CPU s | Peak process RSS KiB | Cgroup peak B |
|---|---:|---:|---:|---:|
| Public compiler rebuild of parser provider and runner | 162.35 | 226.85 | 816,452 | 2,019,180,544 |
| Published fixture | 11.48 | 20.79 | 1,283,716 | 1,672,945,664 |
| Final fixture rebuild and relink | 53.35 | 45.94 | 754,172 | 735,477,760 |
| Extended fixture | 10.91 | 20.28 | 1,283,576 | 1,673,981,952 |

Run cgroups include closure checking and evidence copies. Both reported zero swap and OOM events. Orchestral-Revng used LLVM 19.1.1, CPUs 0–3, quota 4, 4 GiB resident, swap disabled and unlimited virtual address space. Builds used outer 2/compiler 1. Timings are validation costs.

The public default compiler `77f23db6124377e49dd677714aaca147d507a80f05928a71c3cc18faa0040a0c` and all 57 payload checks passed. Verbose commands record fresh emission. The executed ELFs were `78681653c009e0ee450345b4cf2875940af3883a4551f6ee0af22995d3814251` and `ec1600b1f094d858c98334442a085af228c70508acbcde7abc3fb8284a57c4d1`. The final link contained 32 verified Tower objects, 6,095 original definitions, ASan initialization in all 32 and memory-access hooks in 29. Depfiles, actual archive members, action-function IR and linked symbols are retained.

The rebuilt instrumenter, host/work objects and compiler-rt matched the public745 evidence. The probe's original IR also matched. Its address-pass output embedded the new file path, so sensitivity was rerun with the executable host entry and `detect_leaks=1:halt_on_error=1`. It exited 1 with the expected one-byte write past an eight-byte allocation. The initial missing-`main` probe link and two fixture compilation errors are retained. The fixture now uses supported branch syntax and the old chunk's actual reservation. [Prior instrumented fixture](lr_lifetime_asan_587d2b36.md)

The gate covers physical backing allocations and the asserted logical ownership boundaries. General pooled-subslot poisoning, source-language UBSan, race detection and browser execution remain outside its scope. All owned processes drained. [Commands, costs, depfiles and hashes](C:/Sandbox/build/codex_ecs_20261122/L1/lr_action_asan_a095b0d8/manifest.sha256) · 131 entries · SHA256 `b66e4db8ee6ad086987642510fc721257eff27c1de92f64d744ef8493f5357d2`.

At merge `6283362e`, frontend and backend inputs changed. A dependency rebuild preserved the instrumented parser-provider object byte for byte. The merged runner `9bfd8864` passed the extended selector with exact stdout and empty stderr in 11.39 s wall, 20.67 s CPU and 1,283,288 KiB peak RSS. The build and run group peaked at 1,890,689,024 B with zero OOM events. [Merged runner hashes and adjacent logs](C:/Sandbox/build/codex_ecs_20261122/L1/lr_action_asan_a095b0d8_merge_6283362e/runner.sha256).
