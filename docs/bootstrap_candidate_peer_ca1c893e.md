# Native ca1c893e candidate — independent D2 package-data review

Review freeze: published `e9be98a5668cad6a1bb27244b9005f0b90cb8d99`. Candidate source `ca1c893e0317bba4735e87450de9282e46a0ade2`, tree `f5f7cf2642c8a946a3365fe8232baf8a82d89bc9`; Git ancestry/tree independently match.
Disposition: no concrete package-data/resource-closure defect found; all checks below inspect delivered bytes/metadata, never execute the compiler or attest a build.
Archive `/home/deck/tower_coord_ecs_20261122/D2/candidate_ca1c893e.tar.gz`:2,197,556B, SHA256 `e8412cc393647f85a35c3a1ae19d346ecdbb485456a3dd9b0c4e4badddebf4e8`, independently verified before extraction.
Member inspection finds only regular files/directories, unique safe relative paths and no links/traversal. Fresh owned extraction `build/d2_ecs/candidate_peer_ca1c893e/extracted.myewTw/` preserves modes without adopting archive root ownership.
Executable:2,299,088B/0755, SHA256 `44ae8f731d8991e5cd063e86512923ac5f9c1bd151943c8f235ee4025de11c44`; the other56 payload members are0644.
development.json:153,285B, SHA256 `aaa216923f596e534d631b335b580d36a89a8871388374df8541af8d8eaa1ade`; SHA256SUMS:5,820B, SHA256 `06d5253b72a0b5e8b080f955d6439489a8f36140de6dc29df5a5913bbabd3b44`.
Both checksum-list and manifest independently verify all57 actual payload hashes; every manifest size matches stat. Recipe/manifest/checksum/physical member sets agree exactly, excluding the two metadata files from payload count.
Derived from frozen CMake/guest-runtime recipes: five root language files +40 library files +foreign_grammar +nine runtime IR files +compiler/license =57. Membership adds only the three SCC resources relative to public59d.
All46 Tower resource byte comparisons against exact Git ca1 pass, including Bedrock/Foundation/foundation_syntax/types/Tower/work_gate. No normalization, source rewriting or partial resource overlay was used.
All1,279 source_files paths equal the frozen Git inventory scoped to scaffolding, cmake and CMakeLists; each SHA256 independently matches its Git blob. No source_patch field, patch sidecar or unexplained extra archive file exists.
The manifest's generic “working changes” description does not imply a patch: these actual scoped hashes are unchanged ca1 bytes. That scope does not attest every external tool/build script or unrecorded build input.

| Changed packaged resource under scaffolding/ | Exact ca1 Git blob | Independent review / disposition |
| --- | --- | --- |
| library/graph_components.tower | `4938786b8fda460e194059fef780d476b6db1f4b` | Exact provider adopted by [L2 SCC peer review](compiler_lr_scc_peer_c934d02d.md). |
| library/graph_components_interface.tower | `2ca0519fba26b3f92801e89ed2541c95992355ef` | Same reviewed borrowed-span/owned-index API, present in package. |
| library/graph_components_types.tower | `9de8e86f15068dbdfcb8bb05e71febd674b39043` | Same reviewed layout; buffer/budget dependencies shipped. |
| backend/foreign_grammar.tower | `a214b66c9caf82c16453b5e7938382279999232d` | Exact [D2 reviewed repair](foreign_grammar_peer_b862499b.md); no foreign_reader import. |

These are the only authored resource changes from59d; previous37 library files and five preludes remain byte-identical to their frozen sources. All25 distinct explicit import names in shipped Tower resources resolve to shipped root/library files; no missing reader closure is supplied implicitly.
Nine actual target triples/layouts agree with TowerGuestRuntime: wasm32-unknown-unknown; hosted/freestanding x86_64/aarch64-unknown-linux-gnu; x86_64/aarch64-pc-windows-msvc; x86_64/arm64-apple-macos11. Wasm has32-bit pointers, other targets64-bit layouts.
Every runtime header says source_filename="Tower" and records its corresponding `/cache/b1_generation_ca1c893e/successor_build/guest-NAME-unbound.ll` ModuleID. These are generated build-path identities, not Git source filenames or an authored patch.
Runtime bytes/hashes are verified exactly as shipped; their source/target construction traces to the unchanged frozen guest-runtime recipe and hashed host sources. This is neither recompilation proof nor foreign-platform execution; no ModuleID/path normalization is performed.
ELF metadata: x86-64 PIE, interpreter `/lib64/ld-linux-x86-64.so.2`, direct libLLVM.so.19.1/libdl.so.2/libc.so.6 and RUNPATH `/usr/lib/llvm-19/lib`; symbol versions require LLVM_19.1 and up to GLIBC_2.34.
This matches the declared Linux x64 Ubuntu24/LLVM19 development host. Recorded transitive dependency paths remain builder observations, not a Deck resolution check; libraries and Clang are unbundled, and LLVM19.1.1 is manifest build metadata rather than a version personally executed here.
Payload bytes total11,288,015, separate from the compressed archive and153,285+5,820B metadata. No live/peak/process memory measurement or inference from executable size is made.
Manifest records Release/--jobs1, six outer build jobs and Gen2 as predecessor with the same44ae8f73 hash. The recorded command is provenance text, not evidence that D2 ran it or proof of the initial seed.
[B1's published generation receipt](compiler_generation_ca1c893e.md), received during reconciliation, attributes39 actual binary equalities across Gen1/2/3 and57 payloads plus SHA256SUMS equal Gen2/3; its generation sets/relocation logs are not inside this archive or independently inspected here. Gen1 used default public59d; different Gen1 runtime ModuleIDs and Gen2/3 manifest predecessor paths remain preserved differences.
The initial review freeze lacked that receipt; its now-published77 verifier checks, network-disabled relocation and native15/999 remain B1 evidence. Relocated development costs6.25s wall/6.24s CPU/190044KiB RSS, expected-missing-Clang4.67/4.72/189252; no D2 runtime rerun or promotion of ROOT's separate help check.
Checked-in public pin remains59d executable `eeb005717318086c145428edc3b6b784d4729df7ef0514c7329e0a18b76dda9c`, manifest `e2e3766ae241bd4fc83142f0124dfc3295a501a7cb48aadc66f71e5c6b1776cb`; no bootstrap copies changed.
The earlier original-package foreign_reader/mixed-root failures remain failed; this archive now contains the repaired source, but no D2 candidate execution or current browser-resource acceptance follows. Later fixtures/packagers/runtime changes are outside ca1 identity.
Raw manifest: `build/d2_ecs/candidate_peer_ca1c893e/extracted.myewTw/development.json`; raw paths/hashes/sizes/modes/Git comparisons/import census/runtime headers/ELF records under `build/d2_ecs/candidate_peer_ca1c893e/`.
Documentation/OS metadata only: runtime wall/CPU/peak-memory profiling inapplicable; no build, heavy lock, compiler/help/test, sanitizer, ldd or deployment-verifier invocation. Disk126GiB/RAM9.7GiB available at entry; ROOT owns pin/default-build/relocation/release adoption.
