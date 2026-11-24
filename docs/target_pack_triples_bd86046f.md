# Warning-free target-runtime packaging

Freeze `bd86046fa3c1c3ce76854bbc2330a8d0c04a02df`, tree `0af8e79f4ac3e382cc01190fe7f1c8014914c59c`; only production change is five added lines in `scaffolding/tools/target_pack.tower`.
Audited [B2's frozen887f commands](browser_generations_887f2539.md) and [A1's Windows result](windows_runtime_target_5dccac4b.md). B2's three overrides occur in `package_targets` assembly, while the separate Ninja log-version reset occurs before runtime-resource configuration; it is not an assembler diagnostic.
Reproduced all three warnings using B1's current public ca1 resources and Clang19.1.1. These are a new matched IR freeze, not B2's older resource hashes relabeled.

| Bound IR target | Driver-selected frontend triple before correction | Preserved object contract |
| --- | --- | --- |
| x86_64-pc-windows-msvc | x86_64-pc-windows-msvc19.33.0 | COFF AMD64, 64-bit, existing zero timestamp |
| x86_64-apple-macos11 | x86_64-apple-macosx11.0.0 | Mach-O x86-64, macOS11.0, SDK unspecified |
| arm64-apple-macos11 | arm64-apple-macosx11.0.0 | Mach-O arm64, macOS11.0, SDK unspecified |

The exact triples already come from the established target/runtime policy; Windows version decoration and macOS spelling expansion caused the warnings. No ABI/version was guessed and no runtime IR or layout was rewritten.
`target_pack_runtime` now forwards `-Xclang -triple -Xclang triple` alongside the existing `--target=triple`. This uses the same explicit frontend boundary as A1 while retaining Clang's driver-selected optimization/ABI options.
All five profiles keep `-O2 -ffreestanding -fno-builtin -fno-stack-protector -mllvm -disable-loop-idiom-all`; Windows keeps `-mno-incremental-linker-compatible`. Every appended argument remains checked; existing cleanup, child status and staged publication are unchanged.
No warning suppression was added. A mismatched existing macOS module requested as Windows still emits the actual override error under `-Werror=override-module`, exits1 and produces no object. This negative changes no resource bytes.
Public default compiler SHA256 `44ae8f731d8991e5cd063e86512923ac5f9c1bd151943c8f235ee4025de11c44`, development manifest `aaa216923f596e534d631b335b580d36a89a8871388374df8541af8d8eaa1ade`; no bootstrap override or pin edit.
Exact Windows/macOS resource SHA256: `0e0ed5627d071094aad5d73c3f23137738f4a3d21d2a30ac9d832fe555424ffa`, `3667a86ae2ee73d3b0cc68a109f554158281437817594517e66ee2448a583c89`, `1a831d570b41d3a554d6262c7df43557f46feb4df2a474fa1cf25267f7f56e91`.
The five IR inputs and both import descriptions match their before hashes after validation. Actual IR layouts, original warnings, before/corrected frontend argv and installed cc1 help are retained; no normalized object comparison.
One dependency-aware tools-only build produced `package_targets` SHA256 `89f20f67ca6f841d24a735e124e4a40892bdc769de8c575b9df29f7bb2730c83`. Compiled candidate blob877dc74722fa8f2db7f36624b0cf04e4ed362422 and final blob3b437d8b28b78cda84a67766c7266b33c3db88b2 differ only by removing one comment adjective; executable code is identical.
Actual corrected packaging exits0 with empty stderr and seven payloads/82305B. All five runtime objects compare byte-for-byte with the original commands on identical IR, including both Linux controls; no timestamp/hash normalization was needed.
Windows object SHA256 `271a9178f4055f7e5b8c40f01a8b2ffe09d8b7ad89ebc5899461f7116225e504`; macOS x64 `67ee6666bf67d03a3d6677915ecf61b092564b00715e365fce8a83030b02e7fc`; arm64 `82f8c92232f3a2f6832dcd6d50c91f20eb6de76cfe2d29976f09f30111d48922`.
Independent llvm-readobj/llvm-nm reports retain machine, address size, macOS minimum, definitions and imports. Windows requires exactly the existing seven Kernel32 providers plus program-owned tower_main; Mac imports remain libSystem functions plus _tower_main.
`kernel32.lib` has the seven expected named COFF import members; `libSystem.tbd` equals its source bytes. Existing Tower target-pack import checks pass duplicate/unsupported definitions, symbol-count bound, invalid metadata and preserved/borrowed output ownership.
External compiler failure control uses `/usr/bin/false`: exit1 is preserved, the private stage remains inspectable, and no final runtime/import products are published.

| Validation cost, n1; seconds / peak RSS KiB | Wall | User+system CPU | Peak |
| --- | ---: | ---: | ---: |
| Five original assemblies, summed times / maximum child RSS |1.22|1.11|98832|
| Corrected complete seven-product package |1.26|1.08|98472|
| Tools-only dependency build |5.98|3.54|206692|
| Existing import fixture compile / link |0.90 /0.03|0.66 /0.01|190136 /51524|
| Import fixture execution |0.00|0.00|1308|

GNU time costs use fresh processes on warm files, Linux x64 Clang19.1.1, B1 CPU0–11/24GiB, build jobs6/compilerjobs1; coarse zero test times mean below timer resolution. Before is the five child-command sum, after includes packager work: no throughput or compiler-speed claim.
Raw `build/ecs_b1/cache/target_metadata_bd86046f/`: before.sh/build.sh/controls.sh, warnings/argv/times, source and resource hashes, actual objects/providers/import checks and retained negatives. B2's checkout/cache and all published resources remain untouched.
No LLVM vendor rebuild, compiler generations, browser suite, platform execution, sanitizer or deployment verifier ran. The general driver-link warning policy and other CMake assembly consumers are outside this demonstrated producer fix.
ROOT/B2 can adopt the tool-source correction in their next coherent package build; this task changes no runtime payload or advertised capability. Final integration boundary is recorded once in the journal.
