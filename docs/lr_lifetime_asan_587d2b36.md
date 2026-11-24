# ASan acceptance of the merged LR lifetime fixture

**Passed.** One native Linux x64 `tower-lr-work-tests RESOURCE_ROOT lr` run reached the repaired graph-owned endpoint check and returned 0. One selector selected, started and passed. Stderr was empty, stdout matched the prior LR success line byte for byte, and leak detection reported no finding.

The validation source was `587d2b360d30692508f76b49127db8e04f4c6798`, tree `aba4831782dd3196f5f52787f49a157f67f361bf`. The merged fixture blob was `ba4afae04ca8d463bfe822248c9f82607a5ae491` and the production LR provider remained `5386b9bd3939ae0b7c581bd333ab49406bf826d3`. The checkout at `d38396bb` differed in two bootstrap-symbol files outside the selected dependencies. Both entry sources, the fixture and the production LR source also matched their Git blob bytes directly.

The `lr` entry calls `lr_shared_worker_budget`, which binds the synchronized budget to the world and requires `lr_propagation_budget_trial` to succeed. The merged provider calls both the borrowed-row reuse trial and the partial-chunk denial trial. The depfiles, generated IR call sites and ELF symbols identify these paths in the binary that ran.

- The reuse trial checks the initial 32–35 and 34–36 ranges, denies growth with a competing grant, retries into new storage, rejects an incompatible append and transfers to the graph. After private-arena disposal it reads every published range **and the original backing's still-live 32–35 endpoints**. D2's earlier ordinary mutation escaped the old oracle and aborted under the repaired one. Those negative results remain attributed to D2. [Ordinary oracle evidence](lr_lifetime_peer_943201fe.md)
- The partial-chunk trial checks exact retained bytes, grants and lanes at denial and after retry. The wide propagation trial checks independent row retirement, literal results against the serial solver, drained pending rows and worker admission. The synchronous denial probes use the production allocator with a competing reservation.
- In the same invocation, the two-party barrier required active peak **2** (caller and one worker), active **0** after join and one admitted extra worker. Both jobs checked 33 ranges. Their graph teardown asserted **0 charged bytes, 0 live grants, 0 lanes**. The charged-world trial separately checked zero bytes after world disposal, released its final outer grant and required successful ledger disposal.

Public bootstrap SHA256 `745afa2fcb983c289d02331f9a8b77f5e6a5da1900d05a6ade13feacfd8b1cd2` and all 57 package checksums verified. Refreshed fixture and entry timestamps produced two parser-provider actions and three runner actions including relink. The runner ELF SHA256 was `001117a25c7b36a116202ce315ef4c977e64fb955681265500e7a1437f5d526b`. Its provider and entry object hashes are in `evidence/runner.sha256`.
The actual link contained **32 Tower objects / 6,091 definitions**. All 32 had address-pass IR and ASan initialization, 29 had access hooks, and the repaired helper contains instrumented loads. Archive members and the executable's ASan runtime symbol verified. Only the provider and entry objects differed from the prior linked object evidence. The instrumenter, host/work transport and compiler-rt hashes still match the accepted sensitivity control.

| Measured operation | Wall s | CPU s | Peak process RSS KiB |
|---|---:|---:|---:|
| Provider rebuild | 55.56 | 48.02 | 745,948 |
| Runner entry and relink | 14.62 | 11.08 | 364,472 |
| Charged LR selector | 11.68 | 22.65 | 1,283,852 |

Orchestral-Revng WSL, LLVM 19.1.1, CPUs 0–3, quota 4, 4 GiB resident cgroup, swap 0, unlimited virtual address space. The guard was 180 s with `ASAN_OPTIONS=detect_leaks=1:halt_on_error=1` and the LLVM19 symbolizer. Build/run cgroup peaks were 1,273,958,400 / 1,271,926,784 bytes. Both reported zero memory-limit and OOM events. The figures measure validation cost.
The initial WSL worktree comparison exited 1 before compilation because Windows checkout conversion changed line endings. The corrected preflight compared commit trees and frozen physical input hashes. The failed setup log is preserved. Build, run and proof processes drained.
The earlier 11 ASan runs retain their c49 production and `7e436b6b` fixture identity. This supplement adds the merged fixture on the native charged path. ASan covers physical backing and instrumented accesses. Logical subslot bounds rely on the literal assertions. Browser export, race detection and general source-language UBSan are outside this run. [Previous ASan receipt](lr_arena_asan_c49c8b37.md)

Raw commands, statuses, costs, depfiles, symbols, access checks and hashes are in [the 85-entry evidence manifest](C:/Sandbox/build/codex_ecs_20261122/L1/lr_lifetime_asan_587d2b36/manifest.sha256), SHA256 `29727739fe64bb59c4e0ca7f39e171a90d13e7ef7cff3e5176a93c12a7158e02`. The executed ELF and changed IR/objects are preserved under `/root/.cache/tower/l1_lr_lifetime_587_artifacts/`.
