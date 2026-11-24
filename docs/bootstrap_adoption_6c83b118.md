# Scratch-inclusive public bootstrap adoption

ROOT adopts the complete [A2 development candidate](compiler_generation_6c83b118.md),
source `6c83b1189f6931359126102103b74b5ba1e80ff5`, including the semantic scratch
repair. The executable remains 2,299,088 bytes, SHA256
`31a385c616b889987d68f8eb9714020f3928aac97591a1569f905ab706f52ed6`.
The previous ca1c/44ae pin remains in history; later optimization proposals are excluded.

ROOT independently verified archive SHA256
`8a32761f348680dc4ad5d550045ace6d86ce3ca3ddc1452e811a1c1a33d9b17a`,
all57 payload checksums, executable0755 mode and actual help with empty stderr.
The58-member installed set includes SHA256SUMS and exactly matches the prior
package's path set. Complete resources/provenance were copied without relabeling
source identity: development.json `d104f4fb`, checksum file `6ca96a20`.

Pin commit `268079064356c5a3f4b9687568dbd02608c4289a` was archived through Git
into a fresh Linux directory with no private bootstrap override or existing cache.
The documented default selector returned that archive's `bootstrap/linux-x64/towerc`;
CMake records that exact compiler. Its successor is byte-identical to the pin.

| Independent clean phase | Wall seconds | User + system CPU seconds | Peak child RSS KiB |
| --- | ---: | ---: | ---: |
| Native successor,53 dependency actions |39.48|113.47|881080|
| Existing verify_compiler tool |6.54|4.52|199324|
| Development acceptance,21 checks |8.36|8.65|191452|

All three exit0. Checks include actual interpretation, foreign/library linking and
executable outputs; no failed, skipped or substituted check. Build/tool/verification
logs contain no warning/error/FAILED diagnostics. The post-run source hash census
is unchanged. A malformed WSL log-scan command was corrected through direct file
access; it was a transport error after successful validation, not a compiler pass.

Host: local Windows/WSL2 Orchestral-Revng, Linux x64/LLVM19, CPU8-15,
outer4/compiler1,4GiB per-process address-space guard; actual guest15GiB.
These n1 adoption costs are not speedup, scaling or whole-family memory claims.
This pin changes no authored runtime logic; source-bound scratch performance is
recorded separately in [the matched profile](semantic_scratch_profile_bd86046f.md).

Raw verification: `/root/.cache/tower/root_candidate_6c83_verify`; clean build:
`/root/.cache/tower/root_pin_6c83_adoption`, including commands, hashes, individual
check logs, timings and exit status. Local archive and launcher scripts are under
`C:/Sandbox/build/codex_ecs_20261122/ROOT_pin_6c83_adoption_source.tar` and siblings.
This is an LLVM-dependent Linux development bootstrap, not a standalone portable
release. New static/hosted acceptance and current instrumentation remain separate.
