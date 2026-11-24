# D1 — independent r5 native package acceptance

Accepted for ROOT's development pin decision; no candidate package/source defect found. Frozen published source `bf9429d900c6679724cb3c2c4c8960bcf306e83b`, tree `9fa65da4d4d4ad697b4a97e56bb894021076d106`, owner publication `aa00d424b1a3414f8c72d694b099a6fdd3836e6c` are reachable from published main.
Reused the [r4 verifier/contracts](native_candidate_peer_3c0ccdce.md): packaging, CMake resource construction, verifier and three smoke fixtures have unchanged blobs. Read the ready descriptor once; no waiter, compiler build, pin or deployment. Original r4/LR/ABI/grammar evidence and the intentionally stopped idle wait remain intact.
Raw evidence: [acceptance directory](../build/d1_ecs/native_candidate_r5_peer/acceptance/), including `release-input.json`, `inputs/DELIVERY.json`, complete membership/blob maps and [verification coverage](../build/d1_ecs/native_candidate_r5_peer/acceptance/coverage.tsv).

| Independently verified artifact | Bytes / SHA256 |
| --- | --- |
| Generation3 archive |2953202 / `2666f2c224ac49aa6ec59e08438323a04ec5d5330f39d024c1727fe3cc1bc8ff`|
| Canonical LF source archive |37007360 / `c44a6f8156dd1dba5a0e397a1bb909032cda6bc82640a04a75103c212769f114`|
| Complete metadata archive |777102 / `8e4a824ed99b89a9663d290705c2bf759f55ce4ce335001e205e0c8be56c8cd0`|
| Compiler,0755 |2312440 / `ea78d246d1c020b53a61d09bc7c30a017825290e0bcb3d2426466de32028e8f3`|

Safe relative paths, duplicate rejection, regular-file/directory types and permissions were checked before fresh extraction. Derived full archive inventory:193 files/13991389B; payload inventory:57 files/11305123B (compiler,46 Tower resources,nine runtime IRs,license). Every delivered file/mode/size/hash matches the complete manifest; package and relocated copy remain unchanged afterward.
All1942 source files exactly match published Git blobs/membership; all1292 provenance inputs exactly cover frozen CMakeLists/cmake/scaffolding. Empty before/after source patches, source_base_revision and public745 predecessor agree. Manifest SHA `1e47f56d82a6f97d50be43c693769a03a205d5fdf50374191405e5114cb2d152`; SUMS SHA `60a446fabe3fc9a0bac05236b8c91f2c1f1ef5367a6acfd3092a974dc1b182e9`.
The current CMake-derived resource set includes types/Foundation syntax/Bedrock/Tower/foreign grammar and every shared library, including accounting buffers/vectors. Nine runtime files match recorded Gen3 generated guest/resource hashes and expected triples; exact layouts are retained in `runtime-closure.tsv`. This is resource provenance, not other-target execution acceptance.
Owner scripts and actual53-action build logs/commands/statuses agree: Gen1 uses public745 with override unset; Gen2/3 use verified complete predecessors at the same successor path, with113 outputs cleaned before Gen3. All39 unique product records agree across generations; all57 payloads plus SUMS agree Gen2/3. The67 reused-tool dependency records reduce to29 matching frozen path/blob pairs.
Gen1/2 differences are exactly nine runtime ModuleID paths and their hashes (36 raw changed lines); Gen2/3 provenance differs only in the predecessor command. Raw differences remain preserved, without normalizing binaries into equality. Compact metadata lacks the39 generated binary sets: full owner comparisons are verified records, not D1 local object comparisons.
All77 owner package checks reconcile by actual names/commands/status/process-kind/errno and exact stdout/stderr:63 development plus14 expected-missing-Clang. Ten actual symbol closures/current policy fixture, reference-object hashes/native15/999 and imported-grammar Graph/Fast/nativeABI42 records agree. These are attributed to [A2's execution](compiler_generation_bf9429d9.md), not rerun here.
Four additional owner canonical controls have status0: actual input equals distribution_program; emission/re-emission bytes match SHA `a641fe4fdb1cfa7d7a7130376b4ebdf99543bcb59c079fda14c8b8c6a5bdf867`; Graph/Fast output exactly42, stderr empty. Owner final container exited0/no OOM/no live PID. The historical package-only metadata hash b06f7499 names an archive not transferred; the delivered complete8e4a archive binds these added records.
Original75f CRLF precompile rejection/exit1 is preserved; canonical LF source equals Git without rewriting candidate bytes. Local verifier lookup failures (host time/container jq) and an overly broad initial Gen1 payload comparison are retained; installed container time/host jq and explicit source-only identity comparison resolved them, with full Gen2/3 payload equality still required.

| D1 actual checks, CPU0–1/3GiB/swap0, existing LLVM19 container | Wall / CPU seconds / peak RSS KiB |
| --- | --- |
| Safe extraction; complete file/source hashes; recorded-check reconciliation |1.73/1.80/4988;1.10/1.06/10944;0.40/0.36/4912|
| Help; interpreted42 |0.06/0.05/49992;1.11/1.06/147920|
| Foreign library; quoted-caller native link; actualABI42 |1.59/1.54/161624;2.40/2.33/149448;0.00/0.00/1544|
| Complete five-command smoke envelope |5.27/5.10/161624|

All five ran once from a fresh path with spaces, cwd `/tmp`, env-i, no resource/bootstrap override and original30s guards. Help matches exact owner bytes; answers are `42\n`, other stdout/stderr empty, exits0, both expected C/C++ symbols present. [Commands](../build/d1_ecs/native_candidate_r5_peer/acceptance/smoke-commands.txt), outputs/statuses/times, `verify-*.log`, source/payload maps and final rehash/drain preserve evidence; supplementary JSON checks used host jq after the recorded container lookup failure.
Owned process family drained to idle container init; lock released,118GiB free,todo/public745 unchanged. Verification costs are not performance/scaling results. Integration started at4d4dd73c; later docs do not change the frozen candidate identity. LLVM19/Clang remain Linux x64 development dependencies; portable/restricted release, final ASan/TSan/combined performance and ROOT pin/deployment remain separate. No external blocker remains for this peer.
