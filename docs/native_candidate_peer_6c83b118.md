# Independent native candidate artifact/source review — L1

No candidate discrepancy found after exact LF-source verification. This is independent file/provenance review of [A2's complete generations](compiler_generation_6c83b118.md), not another runtime or generation pass.
ROOT archive `C:/Sandbox/build/codex_ecs_20261122/ROOT_generation_candidate_6c83b118.tar.gz`:2528600B, SHA256 `8a32761f348680dc4ad5d550045ace6d86ce3ca3ddc1452e811a1c1a33d9b17a`, unchanged before/after.
Published source `6c83b1189f6931359126102103b74b5ba1e80ff5`, tree `049bfb59b5ddab77925ac05ba7969436fc3d4693`, ancestor of published main and inclusive of scratchbd860; review checkout `3fc67968`.
Fresh owned extraction `/root/.cache/tower/l1_candidate_peer_6c83b118/candidate`; ROOT/A2 inputs and public bootstrap were not modified.

Actual archive inventory:105 unique members =7 directories+98 regular files; no links/special files/path escapes, no unlisted or duplicate extracted members.
98 files comprise57 payloads, checksum file, development.json, README and38 evidence files. Payload bytes11287988; membership agrees exactly with SHA256SUMS and development.json, all hashes/sizes pass.
Compiler2299088B/mode0755/SHA256 `31a385c616b889987d68f8eb9714020f3928aac97591a1569f905ab706f52ed6`; other package payloads0644 and package directories0755. Private archive root0700; four evidence shell scripts also0755, not additional package executables.
Development SHA256 `d104f4fbf2b68d0b925162ff91dbd98f342680955658fdb3ca623f3ce6040f4c`; SHA256SUMS `6ca96a20d86d2ae7f10b976354be303e2def84395ee0ab7c1a5978bb53b0c648`; recorded package modes match actual extraction.
Derived46 Tower resources all byte-identical to their published LF source counterparts; derived9 generated runtime IRs all match Gen3 generated-input receipt hashes, with explicit target triples/layouts retained.
Mandatory type/Bedrock/Foundation/Foundation-syntax/Tower, work_gate, all three graph_components files, imported foreign_grammar and LLVM license present. License15141B/SHA256 `8d85c1057d742e597985c7d4e6320b015a9139385cff4cbae06ffc0ebe89afee` matches public source payload.

Independent source archive command: `git -c core.autocrlf=false -c core.eol=lf archive --format=tar 6c83b1189f6931359126102103b74b5ba1e80ff5`.
Its SHA256 `06304df18d491eed9c2139be8308a37bf2778dc3e09eb88a957e848f838e58ed` exactly matches A2's archive receipt. All1284 development provenance hashes and1366 broader source hashes pass against this fresh extraction.
Initial Windows Git export inherited system `core.autocrlf=true`:59 non-Tower text hashes failed,1225 passed. Raw Git CMake blob matched recorded LF hash; erroneous archive had246 extra CR bytes. Initial archive/checksum failure is preserved; no candidate bytes or receipt were normalized to pass.
Explicit LF Git export corrected that verification-input error and matched the owner's whole archive, not just selected files. Source/source_after patches are empty; source identity and all recorded bytes support an unmodified published build.

All three delivered binary inventories and hash manifests compare byte-for-byte:39 members, derived31 objects+1 archive+3 executables+4 configure probes. Every Gen2 binary hash is also present in the240-entry preserved complete-build manifest.
Audited collector scans every build file by ELF/archive magic and rejects unclassified binary extensions; configure probes are included. The supplied scripts preserve/verify complete Gen2 before clean and use the same successor directory for Gen2/3.
Gen2/3 delivered payload hash manifests are byte-identical,58 records =57 payloads+SHA256SUMS; all58 rechecked against the actual delivered Gen3 files. Gen3 development.json is byte-identical to its evidence copy.
Gen1/2 manifest differences are exactly nine runtime IRs and consequent SHA256SUMS. A2 attributes their raw differences to original ModuleID paths; delivered Gen3 headers retain successor paths. Original Gen1 runtime bytes/diff logs are not inside this archive, so that byte-level explanation remains owner-attributed.
Raw Gen2/3 development diff changes only actual predecessor command path, packages/gen1→packages/gen2; Ninja command diff also retained. Neither file was rewritten or normalized into byte equality.
Gen1 default command explicitly unsets override and records predecessor44ae8f73 (matching frozen public executable); Gen2/3 record preceding complete package paths and candidate31a385c6. Release/LLVM19.1.1/compiler jobs1/outer4 and storage-tests-OFF cache identities agree.
Original39-binary actual byte comparisons, strict10-unit symbol checks,77 verifier checks, space-path relocation/missing-Clang and native15/999/ABI42 controls remain A2-attributed. Their executables/build trees/runtime logs are not recreated or claimed independently rerun here.

Independent readelf: ELF64 x86-64, interpreter `/lib64/ld-linux-x86-64.so.2`; direct NEEDED libLLVM.so.19.1/libdl.so.2/libc.so.6 and RUNPATH `/usr/lib/llvm-19/lib` match provenance.
Version needs include LLVM_19.1 and GLIBC through2.34. Metadata records19 loader/direct/transitive entries, including system C++/compression/XML/ICU libraries; installed LLVM19/Clang and this host closure remain required.
This is a Linux x64 Ubuntu24 development bootstrap, not a standalone portable release. Readelf inspected bytes without invoking towerc or its loader; dependency availability/smoke/default-clean-build/public-pin adoption remain ROOT-owned.

E: `C:/Sandbox/build/codex_ecs_20261122/L1/candidate_peer_6c83b118/`: original and LF archives, every source/payload check, full member/mode/hash inventories, ELF records, raw provenance diffs, exact commands and retained initial failure.
All checks above are file/source inspection; runtime wall/CPU/RSS or throughput profiling is inapplicable. No behavior change, tool rebuild, relocation test, benchmark, sanitizer/race claim, rejected operation or hosted deployment.
Minor read-only truncated listing/Windows wildcard lookup errors are retained separately from the59-line-ending comparison failure; none are candidate runtime failures. Successful payload checks were not restarted as generation work.
Public44ae executable/resources and todo remain unchanged; owned file jobs drained. Later source is outside candidate6c83; ROOT alone decides coherent pin/adoption.
