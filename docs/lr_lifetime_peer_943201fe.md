# Native LR arena lifetime peer review

Accepted both fixture overlays with one test repair. The published helper could pass after corruption of a still-live graph-owned range. The final check reads that original range after retry, transfer and private-arena disposal. The production kernel passed throughout.

Reviewed source `943201fe93d1351521cb770c6fd300edd5e21087`, production `scaffolding/compiler/lr_work.tower` blob `5386b9bd3939ae0b7c581bd333ab49406bf826d3` from c49. Fixture blobs are L1 `7e436b6b5fd1a43f40bb6e1227bc17217b291176` at 923b12d96, B2 integrated `a20e2c1b0ad4ab9c717485b02ba87b4517d82f35` through 34a9dbcd, and D2 `ba4afae04ca8d463bfe822248c9f82607a5ae491`.

- **Independent row retirement.** L1 gives node zero its own vector before the wide solve. The last node in its seeded cycle feeds it the distinct overlapping range 34–36 beside 32–35. The first broad frontier admits workers. After synchronous join and ticket/error checks, arenas append before the changed row's independent receipt is disposed and its descriptor swapped. The fixture requires cleared ownership, drained work, literal sorted endpoints throughout all lanes and an empty unseeded cycle.
- **Partial private storage.** L1 fills the actual chunk tail, reserves the remaining ledger capacity and drops only the vector view. A fresh result returns Capacity while both earlier literal ranges, the pending count, input lengths and charged totals remain valid. Retry adds a second chunk under the same limit. Private disposal restores the pre-trial bytes, grants and lanes.
- **Reused graph storage.** B2 starts with a transferred chunk. The next kernel copies the target's one range into that borrow before denying merge growth. The task retries into another chunk. An incompatible arena rejects the append, then the compatible append and swap publish the new row. The test reads every published literal range after private disposal. The repair also checks the initial two literals, both ends of the rejected destination, and the one live range in the original slice through its graph owner's lifetime.
- **Cleanup and concurrency.** The return paths dispose private arenas, release any active competing grant and destroy the graph. The enclosing charged selector clears the world and checks its final ledger. Its separate two-party barrier requires caller/worker overlap with production allocation. The direct kernel denial/retry cases run synchronously.

All five peer executions used the ordinary native `lr` selector, public745, the same 180s guard, CPU2–5/quota2/3GiB/swap0 and outer2/compiler1. The original runner is the retained 6a6d66af executable. Each later variant rebuilt the parser provider and relinked through its actual depfile. The final executable SHA256 is `c818749e4960bba7c662780f4c7c13d6d0470f9d5384024b60b172b52457e3f3`. The final dependency check was clean.

| Executed fixture | Exit and result | Wall s | CPU s | Peak RSS KiB |
| --- | --- | ---: | ---: | ---: |
| Original L1 overlay | 0, pass | 2.66 | 4.18 | 554452 |
| Published merged overlays | 0, pass | 2.00 | 3.10 | 554624 |
| Old oracle, injected old endpoint 35 → 36 after retry | 0, corruption undetected | 2.06 | 3.17 | 553268 |
| Strengthened oracle, identical injection | 134, charged LR check rejected it | 0.73 | 0.05 | 50268 |
| Strengthened oracle, injection removed | 0, pass | 1.96 | 3.06 | 553316 |

L1's 11 ASan executions remain owner evidence. Independently verified the 11 commands/exits, expected stderr and serial/parallel artifact bytes, both provider depfile inputs, the recorded kernel/denial IR definitions and symbol/link records (38 objects, 6,820 definitions, 34 with access hooks, 38 with initialization, three executable links). All 217 delivered evidence-manifest entries matched. Of 1,354 inputs, 1,351 matched the baseline tar physically, two CMake files matched the exact Git LF bytes after comparing archive CRLF, and one matched the separately supplied L1 fixture. The original files are retained. L1's run does not cover the later fixture assertions.

Raw evidence is under `build/d2_ecs/lr_arena_test_peer_r6/`: `reviewed.blobs`, `selection.calls`, `owner.line_endings`, `owner/`, and five per-run directories with stdout, stderr, status, timing and identities. The two control patches preserve the failing input. There were no cgroup OOM events and all owned processes drained. D1 owns the separate export/browser null-ledger entry. Measurements here are native validation costs.
