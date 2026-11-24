# Complete development bootstrap pin: 6117723b

The checked-in compiler and all adjacent resources now adopt the immutable
[three-generation candidate](compiler_generation_6117723b.md), source
`6117723b22b019e48938927ad22ce3ea8f643c63`, tree
`69baf4529875dce04645e80af1a877aac85eb0e0`. The candidate's complete
`development.json` is preserved byte-for-byte, including its actual Gen3 command,
predecessor, 1,290 source hashes and 19 dynamic dependency entries.

- Compiler: 2,299,272 B; SHA256
  `04ae22d0e73e3674e43895ea2d1efc13da8b7a6b4704df5815369490e6fcfc47`.
- Archive: 2,818,813 B; SHA256
  `8a02287234966b39c166e7e9f9ff8bcadd5ac8e3fa0a28138b078c8015f1e4cc`.
- Complete 57 payloads: 11,289,402 B, plus their checksum list. Membership is
  unchanged from the preceding public package; no stale or partial resource set.
- Development manifest: SHA256
  `faba6eb45610fa8fb90fc6c2a98927138e6552042a7c546bcff25ad92be66c11`.
- Checksum list: SHA256
  `ac59fed1958c6b40b3cb2b144030334ca0b41136ab01d94281aba74435c436f9`.

ROOT checked archive/source transport hashes, every installed payload's size/hash,
exact membership, and the package in a fresh Linux filesystem extraction. All
checksums pass, archive executable mode is 0755, and actual `towerc --help` succeeds
with empty stderr in the existing Orchestral-Revng WSL LLVM19 environment. Git
retains mode 100755. Windows-mounted mode reporting is not used as archive proof.
The first inline WSL transport command failed to preserve its shell variable;
the retained explicit shell-file retry succeeded without changing the artifact.

L1 independently checked all 1,290 provenance inputs against published Git blobs
and all 57 payloads, plus 20 current CLI/reference controls with exact 15/999
execution and reference object equality. No material memory regression was found;
its source-bound timing receipt remains separate. D1 additionally owns independent
raw generation/package evidence review. A2's 77 package checks and 39-binary
convergence are attributed evidence, not ROOT reruns.

This pin changes distributed compiler/resource bytes, not compiler implementation.
The measured CLI path and existing final611 native, ASan, TSan and browser receipts
provide runtime evidence. B1's clean build using this newly published default pin
is a separate pending adoption gate; the previous public pin's clean build is not
relabeled. The original 45-minute input wait expired before publication and remains
a timeout, with its prepared source/reference inputs retained for resumption.

ROOT owns atomic main/Pages publication and exact hosted identity verification.
The pin publication reuses the previously verified hosted runtime; deploying the
final611 static artifact and full hosted behavioral acceptance are separate steps.
This remains an LLVM19-dependent Linux x64 development bootstrap, not a standalone
portable release. Native raw evidence is under
`C:/Sandbox/build/codex_ecs_20261122/ROOT_native_final_611` and
`ROOT_pin_611_candidate`; Linux transport evidence is
`/root/.cache/tower/root_pin_611_transport_checked`.
