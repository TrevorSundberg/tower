# Browser release candidate at fe008af5

The extracted static site passed local deployment acceptance on host 1. Seven full-file replacements over Pages commit `feb74cf2b480c1e6f91ab4aadd02f11dcbc1ce99` reproduce candidate tree **`66dcc503ee7c3e7fe3d267939a0298f7ca6682e0`**. The base tree is `62b88abfbf07f5638e0bf171efbf0a67af42e940`. The site has 105 files totaling 105,872,260 bytes. The deployment manifest SHA-256 is `09e2d38249d48e174ddc18367029c6880773cee5463b2ac19ad32e5ad65fd531`. A full tarball retained in the build workspace is 94,440,636 bytes with SHA-256 `4976a47d1030d42e80ac0e0c04c4fff0a27b8caa758b559a3628f6949d1f37ce`.

## Source and installed compiler

The candidate was built from public `fe008af50f7ad27d6f15b86927122baf9d8051a9`, tree `2e05a92e145a57c51c89280dd52417de86d7e45a`. The predecessor was built from `aeba5225efd6d19e05243b8bd99c7bf8c53b102d`. The source delta has two production changes. LR singleton lookup checks the single item or single indexed shift before allocating cores. Private stage descriptor allocation starts at eight rows, requests up to sixteen for a later page and retries at eight on capacity denial. The edited-project bundle also carries the changed Tower page-reuse fixture. The freeze contains the symbol validator and its tests from `cf0a3d38cb5772e21d64757453e395fe41024f5d` and the compile-time validator correction from `706e3e97abebf044146b795fac31d2d999a2096f`. The original validators ran directly from the freeze.

The build used the documented public default with the compiler override unset. The unchanged bootstrap tree is `3d1aec146e4cf7260dd5e756ba11c63d7887a879`. The installed executable is Git blob `5176e139feb4e34f62a54e84648612e802b8946e`, SHA-256 `77f23db6124377e49dd677714aaca147d507a80f05928a71c3cc18faa0040a0c`. All 57 payload checks passed. Its development manifest records its own source-file hashes and source baseline `c49c8b37afd39011bc7894961e16791f25c1c478`.

| Build output | Bytes | SHA-256 |
| --- | ---: | --- |
| Native Linux x64 | 2,316,904 | `f1caff1c2e399fb306da459a5caa12e79e68428ab27783d911171e2fc480ba3b` |
| Portable Wasm | 1,686,892 | `f96f6c7d1170c9b7f403c5d557bad4459c7441e7a170fbe27a641ce88374b0cc` |
| Shared Wasm | 1,800,518 | `d76237144fe2371416068a1286266f4ae143cac6fc5035da0ba1a3e35b80461e` |
| LLVM Wasm | 35,435,775 | `24cb55078605d661a6a58000983962b748e2d354e6eed7bcf41af41cb9366e3e` |
| Cross Wasm | 56,591,114 | `a9e16da42d51df03e46e871c3b3f35f739af55808e4701908e3150183c23496a` |
| Editable compiler project | 5,166,380 | `c5952b9d8235bf93c925e1f305bd4c9054bd687c656a30b4b7ca08f8de2efa6b` |

The native clean build reproduced the warm executable. Of 55 installed native resources, only `library/entity_stage.tower` changed from the warm predecessor. Nine clean-build LLVM texts differ from the warm copy only in their first-line ModuleID path. Five of the 24 release inputs changed, comprising the four compiler reactors and the project JSON. All eleven compressed compiler-support inputs, seven regenerated target-support files and the shared work-test reactor matched the predecessor. The input manifest SHA-256 is `6392dfe68eaac90e83f0be0fc1c015190f18ea2d9b5ab16b730ef9519eef3e57`. The overlay also carries the installed stage source and the deployment manifest.

LLVM `1e57ee22ca274b663eeb279fd86e7010a8441c99`, Binaryen `480f5ba352a9f89afe72779c81f8a16fd3c8ba4a`, TableGen and all 63 cached LLVM archives retained the predecessor identities. The project packager rebuilt at the freeze to identical bytes. The asset packager was reused from the predecessor after comparing its dependency sources. The release manifest records each packager's build source and binary hash.

## Executed gates

| Gate | Observed result |
| --- | --- |
| Compiler and project | 14/14 initial portable Bedrock checks, 102/102 frozen mixed checks, IDE fixtures passed. All 536 authored project texts, 25 generated unit entries, generated runtime and 13 gzip streams checked. |
| Edited generations | Both returned the edited null diagnostic. All 25 object pairs and three reactor pairs matched byte for byte. The two-worker and four-worker generations each closed every worker. |
| Strict symbols | 39 governed object lists passed across native, portable, shared and LLVM builds. The actual LLVM configuration links Evaluation in place of the portable Interpreter. The Tower policy fixture also passed its negative cases. |
| Worker and semantic checks | Shared Node 3/3. Chromium 3/3 ordinary, 9/9 ownership and 1/1 bounded LR. The entity-pages selection completed all 42 phases and retained 17 artifacts. |
| Static and local deployment | Four desktop/mobile isolated and fallback cases passed with 64 worker targets created, 64 destroyed and zero remaining. The original loopback verifier matched all 104 served assets, saw `42` and `5, 6, 7, 7, 9` on both clients with empty error lists, and selected Wasm and Linux x64 on real Linux. |

The added browser fixture imports the frozen Tower `reuse_descriptor_growth` assertions. It exhausts the actual stage budget, checks unchanged owners and grants on refusal, retries the same stage, admits the smaller page under a tight grant and verifies stable addresses and balanced teardown. Substituting only the predecessor stage source produced the expected “Dense stage descriptor page did not grow” failure. The new fixture passed portable Graph and Fast at 32 and 64 bits, browser LLVM guest execution and shared Chromium Graph/Fast at one and four workers. The four shared results had equal full canonical Foundation, SHA-256 `08b747ac32a6c802552f7509843ec43b3d3a2cebcc7a0f4dacdfe8e528c26982`. The original standalone fixture also passed natively and as Wasm in Node and Chromium. The release LLVM reactor emitted the complete fixture as a Wasm object and its linked reactor passed in Chromium. The added browser driver and fixture are validator-only, with blobs `3b57be51c2cd67447074e7dc6de990475a7a3169` and `beae89c9799a7dcd1708ac4da468b384aa719fcf`.

Native ASan with leak detection passed the complete page-reuse fixture. TSan passed the production concurrent-stage test with 57,792 finalizations and the page-reuse test after initialization. The deliberate race control produced the expected TSan data-race report and exit 66. This host intermittently denies TSan's startup personality call. All failed launches were retained. The Tower IR instrumenter supports address and thread modes. Physical allocator attempt counting is a separate serial native control published after this candidate freeze in `724e4d11`.

## Environment and first failures

Host 1 used Debian 12, an Intel Xeon Gold 6244, CPUs 0–31, 16 physical cores, 15.36 CPU quota, 136,709,144,576-byte memory limit and zero swap. The shared cgroup high-water mark reached 24,606,445,568 bytes with zero OOM kills. Clang/LLVM was 19.1.7, WASI SDK 34, Node 24.22.3, Playwright 1.65.1 and Chromium 159.0.8154.6. Individual builds used one Tower compiler worker and up to eight outer jobs. The LLVM/cross invocation used four outer jobs.

| Phase | Wall s | CPU s | GNU time peak RSS KiB |
| --- | ---: | ---: | ---: |
| First portable reactor and Bedrock | 19.09 | 25.53 | 760,748 |
| Native clean check | 22.43 | 83.91 | 790,120 |
| Warm LLVM/cross and editable package | 36.76 | 51.46 | 760,900 |
| Two edited generations | 77.25 | 257.44 | 2,342,316 |
| Mixed suite and entity-pages | 87.07 | 149.73 | 2,699,788 |
| Local deployment verifier and final hashes | 83.72 | 51.66 | 308,808 |

Sequential original and extended shared-fixture runs on the same host took 6.32 and 10.44 seconds, with peak RSS 254,616 and 262,156 KiB. All twelve common results matched across runs. The second run also executed four descriptor checks. These are single validation samples.

The first standalone WASI command linked Tower's two-argument `main` under its native spelling. The WASI startup shim trapped before reaching it. Binding the unchanged Tower body to `__main_argc_argv` with the repository's runtime binder produced the expected zero. The first input audit looked for an uncompressed support file in a directory containing compressed inputs. The corrected audit compared the compressed bytes and tested their gzip streams. For TSan, the concurrent control passed on its first launch. The page-reuse replay initialized on attempt four and the deliberate race control on attempt eight. The packet includes the original failures and the successful commands.

Independent review can reconstruct the candidate site and both edited generations from the packet. Public deployment and hosted verification are reserved for the manager.

The sealed review packet is `ad90677a-1a30-494c-8862-debd3515e6d3.tar.gz`, **71,542,868 bytes**, SHA-256 `0dc4efb12c14a794aa345077db763f0f045845aa48a3ae4e936b8524e0671feb`. A fresh extraction passed its member checks and its included reconstruction commands for the exact site, both edited reactor sets and both object sets. The packet contains the loopback downloads, screenshots, per-phase commands and resource measurements.
