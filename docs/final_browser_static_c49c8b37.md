# c49 browser and static release candidate

The frozen compiler, project, UI and resources are `c49c8b37afd39011bc7894961e16791f25c1c478`, tree `4bea985b8248e7f2bc29e310787a6ec8d0a89e9a`. All 1,949 regular source blobs matched the delivered LF archive. The build used the checked-in Linux x64 predecessor `745afa2fcb983c289d02331f9a8b77f5e6a5da1900d05a6ade13feacfd8b1cd2` with private overrides unset. The later `77f23db6` pin has its own adoption history.

| Check on frozen inputs | Observed result | Wall s | CPU s | Max process RSS KiB |
|---|---|---:|---:|---:|
| Native build | 16/1,000-body objects matched independent references and executed 15/999 | 47.575 | 67.996 | 815,592 |
| Portable provider + remaining target | Linked portable reactor and foreign link fixture | 54.282 | 47.614 | 876,820 |
| LLVM/cross build | Both reactors linked using the 76 verified vendor archives | 50.638 | 65.953 | 877,632 |
| Shared build | Shared compiler and work fixture linked | 42.006 | 49.735 | 876,272 |
| Compiler project | 25 units, 562 source texts, generated runtime and decoded support verified | 26.167 | 10.518 | 316,564 |
| Node | 3/3, 571 phase records, 128 lifecycles, injected trap, four distinct barrier workers, 23/23 worker IDs ended | 100.236 | 169.714 | 1,054,216 |
| Browser normal + ownership | 3/3 + 9/9, normal closes 5/2/5, zero remaining CDP targets in every case | 11.792 | 5.246 | 265,292 |
| Edited generations | Gen1 LLVM built Gen2, changed diagnostic executed, 25 objects and three reactors identical, 6/6 worker IDs ended | 63.867 | 188.476 | 2,309,696 |
| Current entity_pages | 42 phases, 14 known-zero outputs, both widths and executable Wasm paths, 17 Foundation/IR/Wasm files retained | 66.560 | 107.940 | 2,690,796 |
| Static package | 105 files, 105,828,220 installed bytes, 58 authored Tower files matched | 5.739 | 5.203 | 168,816 |
| Static desktop/mobile | 4/4, staged 42, reload and isolation fallback, 72 created/72 retired, zero retries or skips | 25.570 | 14.960 | 466,844 |
| Full local verifier on extracted archive | 104 served hashes, desktop/mobile backend and type checks, real Linux x64 defaults, zero page errors | 47.986 | 30.475 | 253,252 |

The original strict checker rejected ParserNodes' `work_arena_append`. All three object profiles import that exact symbol and Entities defines it. Validator `e35075ae` passed wrong-consumer and near-name negatives and all 30 actual object checks. Merge `63fd9206` retains A2's independently published admission and fixture from `d38396bb`. The merged fixture passed, the rebuilt checker was byte-identical, and all 30 retained symbol lists passed again. Only the validator changed. The original rejection and both fixtures are retained.

Node checked serial/parallel canonical and effect ordering at widths 1/2/4/8. Browser ownership close counts were 1/5/5/5/5/5/5/5/10. Startup, busy cancellation, worker errors, stale replies and retired errors drained. Charged LR denial/retry remains native evidence because the frozen Wasm fixture supplies a null ledger. D1's seven strict controls retain their separate identity. [Native arena peer](lr_arena_peer_c49c8b37.md) · [D1 browser evidence](shared_browser_c49c8b37.md)

The 24 input files total 164,016,901 bytes. Project/target packaging used the c49 recipe and native runtime IR. Static asset packaging reused the dependency-equal `1bfe0657` tool, SHA `d5eee8bc73135eefeaa844db72e5b22c8c2c526c8c017cf450e3e9a76a4199ea`. All 13 gzip streams passed, totaling 93,730,791 compressed and 292,942,477 decoded bytes. LLVM and cross decoded to their original reactor hashes. Both copies of the transferred archives matched their checksums.

CPU 12–23, quota 12, 12 GiB, swap zero, outer 2/compiler 1. The fresh build cgroup peaked at 1,839,575,040 B. The reused browser cgroup's historical peak stayed at 7,325,859,840 B. Both recorded zero max/OOM events. Pages' observed linear capacities peaked at 1,254,096,896 B portable and 1,254,162,432 B LLVM. All owned jobs drained. The existing CMake CMP0116 deprecation is retained. ROOT owns public deployment.

**Peer handoff** is `C:/Sandbox/build/codex_ecs_20261122/B2/final_browser_c49_r6`. Static archive `static/tested_dist.tar.gz` is 94,427,784 B, SHA `82baf7e60716ab52b2e608cae07ccb7a2415cb2779c288e3058018912838444f`. Static manifest SHA `f85eef5134f06f91b4a8f48a91754dc19a211500d52192179b86834e5478078f`. The handoff indexes the source, 24-member bundle, complete peer archive, original generation binaries, merged fixture and raw reports. [Handoff and hashes](<C:/Sandbox/build/codex_ecs_20261122/B2/final_browser_c49_r6/handoff.json>) · [Phase costs](<C:/Sandbox/build/codex_ecs_20261122/B2/final_browser_c49_r6/costs.json>)
