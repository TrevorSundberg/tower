# A1: bounded lazy DEFLATE matching and package review
Source baseline1e428ede6c33cba159b753247affd8d5cf3ed67d; one shared-codec improvement.
Package review:03d8123d (preserved by6b74889b) only switches the LLVM dist staging copy to post-gzip removal.
Reviewed compress/write/unlink/manifest callers, build.mjs resource/support copying, execution/target workers and fetchBytes.
Raw build inputs stay; browser consumers request .wasm.gz. A failed write/unlink returns failure before manifest publication.
Editable sources, type/Foundation resources, support archives and optional/required capability checks are unchanged.
No deployment-verification operation, package gate or hosted check was executed; D2's prior evidence retains its own boundary.

Implementation: short matches (at most32 bytes) get one bounded next-byte search through the existing index.
A longer continuation emits one literal and reuses the prepared match; each start is indexed exactly once.
The64-candidate cap,32KiB window, nearest tie breaking, fixed Huffman and whole-input stored fallback remain.
No new heap scratch, block format, loader capability, package-only codec, external production dependency or worker pool.
Dynamic Huffman coding would require buffering tokens/tree metadata; this batch deliberately takes the smaller measured improvement.
Input/output aliasing, failure-before-publication and call-owned cleanup remain; tested null/overflow failures preserve prior bytes.

Exact a06 LLVM input35420122B, SHA8acbaf08545d0ce972f2de7db2a89fcfc7ef434f95f775feca06dde759107697.
Gzip13671333 ->12786963B: **884370B /6.47% smaller**, not the older25 input or a claim about raw LLVM size.
Output SHA before fb50b766be8997f0c71a440e8b71bb720516328f604a0a1bb72be5bd2e35f544;
after43e8034f985286841fd83b58b8c6b4691e8d66b1afbad1742ea21ee6293785e7.
Matched final n2, warm filesystem, serial encoder, KinmenA Linux Docker CPU12-23/24GiB, GNU time; stdout/file I/O included.
Public bootstrap768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138, verified complete SHA256SUMS.
Only focused providers/tests compiled, jobs1, x86_64-unknown-linux-gnu, --library, depfiles, existing guest-host-library.o/Clang19.

| Input / compressions per process | Bytes before -> after | Wall s before -> after (n2) | CPU s before -> after (n2) | Peak RSS KiB before -> after |
| --- | --- | --- | --- | --- |
| LLVM /1 | 13671333 ->12786963 | 2.71/2.72 ->3.30/3.35 | 1.58/1.57 ->2.18/2.20 | 62488/62008 ->60456/60456 |
| Text13B /10000 | 33 ->33 | .02/.02 ->.02/.02 | .02/.01 ->.01/.01 | 1560/1576 ->1592/1560 |
| Seeded random131073B /100 | 131106 ->131106 | .60/.58 ->.59/.59 | .57/.57 ->.58/.58 | 2376/2328 ->2380/2388 |

Accepted the extra~0.61s wall/~0.62s CPU for package generation; no compiler-throughput or multicore claim.
Initial text100-repeat samples were below clock resolution; logs remain and final matched samples use10000.
Match arrays remain(4096+32768)*sizeof(usize)=294912B on this target; no extra allocation sites.
Retained LLVM gzip output capacity27342650 ->25573910B; final profiler checks both buffers reset to null/zero after disposal.
Global allocation-count/peak-live instrumentation was not added; source bounds/output capacities are distinct from process RSS.
161 ZIP members independently decoded with the existing Python standard-library ZIP CLI and byte-compared, all pass.
Tower gzip checks:39 inputs including real LLVM, empty/small/all-byte/repeated/window/random and32 seeded mixed cases.
All deterministic/aliased publications and Tower-owned GNU gzip round trips pass; no Tower inflate implementation is claimed.
Known CRC-32 vector/trailer, all29 truncations of its29-byte member, reserved block type, checksum corruption and recovery pass.
Fixed literal/length/distance code boundaries and32KiB/65535-byte block edges remain covered by the ZIP corpus.
Independent lazy token recipe: old codec abort134 with the exact assertion; repaired codec passes and reference-decodes.
CRC/ZIP/Roku checks pass. Three fixture-only compile mistakes (array foreach, sizeof expression, reserved expected) are preserved and corrected.
Raw logs, failures, binaries, depfiles, inputs, n2 outputs/hashes and manifests: C:/Sandbox/build/codex_ecs_20261122/A1/cache/deflate_1e428ede/.
README documents existing build entries/reference dependency and new profile fixture. No reactor/generation/browser/sanitizer matrix.
ROOT owns integrated instrumentation/release and deployment. Jobs drained; todo preserved; final reconciliation retains the frozen evidence.
