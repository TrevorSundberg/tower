# Complete r4 development bootstrap pin

Adopts the exact [three-generation candidate](compiler_generation_3c0ccdce.md),
source `3c0ccdce9704cb2020d0a3df0b11235f10af1711`, tree
`9d3aac3ba80c99f3709d50765da73b20eb3df590`. The original development manifest,
Gen3 command/predecessor,1291 source hashes and19 host dependency entries remain
unchanged. Later test-only corrections do not change its compiler source identity.

| Member | Bytes / SHA256 |
| --- | --- |
| Compiler,0755 |2308056 / `745afa2fcb983c289d02331f9a8b77f5e6a5da1900d05a6ade13feacfd8b1cd2`|
| Complete archive |2759417 / `4b9e6959fcd30e2d7618bf953dbf45ff08cfe304641543101821affcc87cfc74`|
| Development manifest |`905326fd229445295b72e3ff2f5042cd0b8217f575690e1892e2334b1801f4aa`|
| Payload checksum list |`0e1e977742641ab65675bcb62243fa8370204bdd10808eaff628b05a8a97abdd`|

All57 payloads total11300376B; membership matches the preceding pin. ROOT checked
every installed size/hash, complete membership, untouched manifest, Linux0755,
checksums and actual help execution with empty stderr in the existing LLVM19 WSL
environment. Compiler bytes equal B1's independently built and measured current
[ordinary CLI](compiler_combined_performance_3c0ccdce.md).

D1 independently verified package/source/provenance and reconciled all39 recorded
products,57 converged payloads and77 named checks. ROOT inspected the actual five
relocated command exits/stdout/stderr/times and successful batch log: help,
interpreted42, foreign library, native link and ABI42 passed in7.01s/6.83CPU,
177620KiB peak RSS. Its container was idle after execution. D1's published
[independent receipt](native_candidate_peer_3c0ccdce.md) closes that review;
original39 product sets remain A2-owned, not peer re-executions. Raw Gen1
runtime/path and provenance differences remain preserved.

Current-source [native acceptance](native_combined_3c0ccdce.md),
[ASan53](final_asan_3c0ccdce.md), [creation-fault supplement](entity_create_faults_asan_03de36a8.md)
and [TSan29](compiler_thread_combined_r4_3c0ccdce.md) pass at their exact boundaries.
ROOT reviewed both test-only overlays; they do not alter production. No new
runtime implementation is introduced by this distribution update, so the matched
ordinary performance evidence applies without repeating the matrix.

Initial ROOT extraction guards rejected the archive's ordinary `./` root and then
a manifest lookup incorrectly assumed `linux-x64/development.json`. Both setup
errors were corrected against the actual archive layout before installation;
the manifest resides at the package root. No artifact/check was substituted.

Main is published atomically with the unchanged accepted Pagesab4 release; its
runtime remains03e and actual packager1bfe. New r4 browser publication is separate.
[B1's clean public-default adoption](bootstrap_adoption_5ebde29f.md) now passes:
all39 product hashes,21 relocated development checks and exact15/999/ABI42.
Nine rebuilt runtime ModuleID comment differences remain recorded, not normalized.
This is an LLVM19/Clang-dependent Linux x64 development bootstrap; generated other
targets and expected missing-Clang diagnostics do not prove a portable release.
ROOT raw checks/package: `C:/Sandbox/build/codex_ecs_20261122/ROOT_native_final_3c0`;
Linux extraction: `/root/.cache/tower/root_pin_3c0_transport_checked`.
