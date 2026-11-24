# Browser release candidate at aeba5225

The full static site passed local acceptance on Linux x64. It was built from public `main` commit `aeba5225efd6d19e05243b8bd99c7bf8c53b102d`, tree `ab3cb7a015e27f9fcdd04b0d751102ac8ac11410`. Its candidate Pages tree is **`62b88abfbf07f5638e0bf171efbf0a67af42e940`**. The manager owns publication and hosted verification.

| Deliverable on slot 1 in `/home/agent/tower-evidence/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `aeba5225-dist.tar.gz`, full tested archive | 94,439,190 | `34e9d20a058fda8e96582cb26c8daf6be0356fd4dde8c4ddaf0a75ba3f70a36d` |
| `deployment-manifest.json` inside the archive | 11200 | `8ee9a18c9fa9bc4fad79825544a62bf1fd2f083d68ce5826ba96bdc02c0081c6` |
| `aeba5225-browser-release.tar.gz`, raw acceptance evidence and nine replacement files | 45,143,861 | `45873c479e572dc68a7ad62be0c18dbdf96ab7c51c0dfcddc8cc1f6859d9ad43` |

The installed site contains 105 files totaling 105,866,539 bytes. Extraction reproduced the assembled directory byte for byte. Applying the packet's nine full files to public c49 Pages commit `d40d4bc92f9320395915e852b6a8d76521900133` independently reproduced every file and the same Git tree. The other 96 files were identical. The numbered assignment packet contains the release packet and the original c49 provenance packet as separate archives.

## Source and toolchain

The build used a clean private checkout, fresh caches, and the checked-in Linux bootstrap with its override unset. Its executable blob was `5176e139feb4e34f62a54e84648612e802b8946e`, SHA-256 `77f23db6124377e49dd677714aaca147d507a80f05928a71c3cc18faa0040a0c`. All 57 pin payloads matched. LLVM was `1e57ee22ca274b663eeb279fd86e7010a8441c99`, Binaryen `480f5ba352a9f89afe72779c81f8a16fd3c8ba4a`. The WASI SDK 34 archive matched its pinned SHA-256 `b761e3a0721dbae9c09a0059e5fdb2bf917d1b4a8a7b430fb3b5aafb0984b2c4`. The host used Debian 12, Clang/LLVM 19.1.7, Node 24.22.3, Playwright 1.65.1 and Chromium 159.0.8154.6. Missing Chromium libraries were supplied in a private Debian sysroot.

The build ran the documented `build-native.sh`, `build-wasm.sh`, `build-threads.sh` and `TOWER_BROWSER_CROSS=ON build-llvm.sh` scripts. Both release-required flags were set for the final npm build. TableGen and the Wasm LLVM libraries came from the pinned vendor source. The cold LLVM/cross invocation took 572.15 s wall and 6,782.26 s CPU, with GNU time peak RSS 933,084 KiB, using 14 outer jobs, one compiler job and a 15.36-CPU quota. Other release preparations shared the host. The packet records the source tree, per-file hashes, SDK/tool identities, build commands, vendor archives and 24 release input hashes. That input list has SHA-256 `7fbe1d40688b5189dcf5a84f454ebd94e5a2db949a4e4e8dee8cc810f27919ec`. Assembly added provenance to the Tower-generated manifest before sealing the archive and checked equality of the complete asset mapping.

| Release reactor | SHA-256 |
| --- | --- |
| Portable | `4780476dfb15e9962cff87f9afc6ea6b8b247eba9e0fb5b78b133e6be3f2d849` |
| Shared | `c51735a156624cf91398115107ff457040b64842bd0165ce63c43db97f3022ac` |
| LLVM | `23e53596c6c02035e3db48cacc45db775bba552aca838605236a7d5479844a2b` |
| Cross | `5775f9ad30006c9d5a845de7cea7638face89fa20cd352b78523dd54f19943dc` |

## Executed gates

- All 536 authored texts in the editable compiler project matched the freeze. The project also carries 25 generated unit entries and its generated runtime. Both edited generations reported the edited null diagnostic. All 25 object pairs and three reactor pairs matched in full. The two- and four-worker groups each reached zero active workers.
- The shared Node suite passed 3/3. Shared Chromium passed 3/3 ordinary, 9/9 ownership and 1/1 bounded LR. The static isolated/fallback controls passed 4/4 across desktop and mobile with 64 observed workers created and destroyed, leaving zero targets. The separate IDE fixture passed. The direct entity-pages selection passed its 42 phases and emitted 17 retained artifacts.
- The frozen symbol checker rejected the shared ParserNodes fixture's call to `work_arena_snapshot`. Its provider is a defined symbol in the actual linked Entities object. A separate Wasm ParserNodes rule and fixture passed the real lists for all ten governed units in each native, portable and shared configuration, plus nine available LLVM configuration lists. Wrong consumer, suffix, truncation and native-target controls retained rejection. The fixture passed ASan/leak checking. The LLVM/cross link uses Evaluation in place of the portable Interpreter object.
- The original mixed Bedrock/compiletime run failed 43 missing-LLVM selections and one portable text assertion. Once LLVM was available the frozen harness passed 101/102. The remaining failure reproduced on the public c49 reactor. A test-only change checks both the emitted unsigned 64-bit binding and its use at `value0`; initialized and bare declarations are both exercised. The corrected harness passed the c49 control and 102/102 mixed selections on this release. The first oracle amendment and original failures are preserved. An initial target-pack invocation supplied a directory as its Clang argument and failed. The documented Clang executable produced all five target runtimes and both platform import files.
- The original deployment verifier ran against the extracted archive on loopback. All 104 served hashes matched. Desktop and mobile returned 42 and the expected increment sequence, with both error arrays empty. Real Linux x64 target defaults passed. The verifier exited 0 in 83.22 s wall, 52.08 s CPU, peak RSS 336,908 KiB. The packet includes its report, downloads and screenshots. These executions cover the named release gates. Public URL behavior requires the manager's post-publication check.

The first frontend-only archive and receipt remain separately available. Source and mutable caches on slot 1 are under `/home/agent/tower-browser-aeba5225`. The two reviewed validator changes have separate local commits. Later remote compiler changes, including `scaffolding/compiler/lr_states.tower`, are outside this artifact's freeze.

## Public deployment

The manager reconstructed tree `62b88abfbf07f5638e0bf171efbf0a67af42e940` from the previous public tree and nine replacements. The atomic push advanced Pages to `feb74cf2b480c1e6f91ab4aadd02f11dcbc1ce99` and main to `fe008af50f7ad27d6f15b86927122baf9d8051a9`. The manifest retains the build identities for `aeba5225`. The manager also ran the corrected forward-chain test on the packaged portable reactor and the symbol checker fixture with the public bootstrap and guest host library.

After the new manifest reached the public URL, the unmodified deployment verifier matched all 104 files, ran desktop and mobile execution and editor checks with empty browser error arrays, and confirmed the Wasm and Linux defaults in a Linux x64 browser. All three configured redirects resolved to the HTTPS apex. The hosted report SHA-256 is `6321695015ce16ebeae0851a9fc4a34c64de8123d2b0c91f8d23001949139b47`. [Public verification receipt](evidence/browser_hosted_aeba5225.json)
