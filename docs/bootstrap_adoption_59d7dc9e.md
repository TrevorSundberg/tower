# Complete development bootstrap adoption

ROOT, 2026-11-24. The complete predecessor is frozen at published
`59d7dc9e995b16c785b01f40f340374dc4c73d18`; later SCC code is compiled by it,
not silently included in its identity. [A2 generation evidence](compiler_generation_59d7dc9e.md)
records all 38 actual binaries equal across three generations, all 54 payloads
and checksums equal across generations two/three, relocation, 75 package checks
and nine strict symbol checks. It requires documented Linux x64 LLVM19/Clang;
standalone multi-host distribution remains unaccepted.

ROOT copied archive SHA256 `eaf41e3214cec5ed7c01552373b197cf756ea0050bbcefaa8e6160fd8531cdc8`,
2,500,694 bytes, and independently verified all 54 payload hashes, manifest,
checksums, mode0755 and help from Linux extraction. Executable SHA256
`eeb005717318086c145428edc3b6b784d4729df7ef0514c7329e0a18b76dda9c`, 2,294,024 bytes.
All adjacent resources are committed, including work_gate, type prelude and
Foundation syntax; there is no one-binary/private-cache adoption.

At local pin commit `ec9114891efd538690273217d1cfb06ddfb2248b`, ROOT extracted a
fresh Git source archive and ran documented build-native.sh with an empty cache,
TOWER_BOOTSTRAP_COMPILER unset, outer jobs4/compiler jobs1, CPU8-15, LLVM19.1.1.
The verified checked-in predecessor path is recorded in CMakeCache.txt. Host:
Orchestral-Revng WSL2 Linux6.18.33.2 on LAPTOP-96JDEBNT, about16GiB guest RAM.
No private compiler, instrumentation, cap override or source changes during build.

| Phase | Exit | Wall / waited CPU seconds | Peak child/process RSS KiB |
| --- | ---: | ---: | ---: |
| Clean canonical successor, all53 actions |0|38.91 /113.48|896052|
| Public-path verify_compiler tool |0|6.21 /4.27|197680|
| Development verification, all16 checks |0|4.79 /4.90|180960|

Successor SHA256 `c181df58cad23f7fdd490544412968fcee0f793f332af0dea975fa491c4d2809`.
This successor includes published SCC provider inputs; it is not the frozen
predecessor executable. Whole source hashes remain unchanged; logs contain no
warning/error/FAILED matches. Incoming31102b64 changes only receipts, so affected
build inputs remain identical after merge. Checks include diagnostics, interpreters,
objects/libraries/linking and actual executable outputs. These n1 costs are
acceptance evidence, not a measured speedup against earlier different-source runs.

Preserved setup errors: Ubuntu was not the installed WSL distribution; inline
native-shell quoting broke two read-only metadata/log commands. File-based OS
transport and direct PowerShell log inspection corrected these; neither error
was a compiler/test pass. Raw logs/source/archive/binaries and source hash list:
`C:/Sandbox/build/codex_ecs_20261122/ROOT_pin_59d_adoption` and the matching
`/root/.cache/tower/root_pin_59d_adoption`; package checks in root_candidate_59d_verify.

No new authored compiler logic in this adoption. Current browser/shared artifacts,
new-runtime hosted release and the service-blocked instrumentation/deployment
verifier remain distinct requirements. Unchanged Pages assets retain their original
source/build provenance during this atomic main publication.
