# Clean default adoption of the ca1c893e development compiler

ROOT committed the complete pin as `8dec7a924d1e5a9b3b231f51fa57ffff627e27e5`
and built an untouched Git archive in a fresh cache. The documented
`playground/scripts/build-native.sh -DTOWER_COMPILER_JOBS=1` selected the
checked-in compiler with `TOWER_BOOTSTRAP_COMPILER` unset; no private override.

All53 dependency actions pass. The successor is byte-identical to the pin:
`44ae8f731d8991e5cd063e86512923ac5f9c1bd151943c8f235ee4025de11c44`.
A freshly built Tower `verify_compiler` passes all21 development host checks,
including isolated imported foreign grammar and native ABI output42.
All frozen input hashes remain unchanged; build/tool logs have no warning/error
or FAILED matches. This is current default-build acceptance, not a new browser
generation, standalone portable release, sanitizer run or hosted deployment.

| Phase | Wall seconds | CPU seconds | Peak process/child RSS KiB |
| --- | ---: | ---: | ---: |
| Default native build |44.24|131.72|894380|
| Host verifier tool build |6.41|4.36|198396|
|21 development checks |9.01|9.37|191504|

Local Windows/WSL Orchestral-Revng, Linux x64/LLVM-Clang19, CPUs8-15,
outer4/compiler1, fresh caches/warm host files,4GiB per-process address-space
guard. RSS is the waited-process high-water, not a simultaneous process-tree sum.
These are n1 validation costs, not before/after performance claims.

The complete [candidate receipt](compiler_generation_ca1c893e.md) retains39-binary
and57-payload convergence,77 host checks and isolated relocation. Independent
package review a50155bb checks57 payloads,1279 source hashes,46 Tower resources
and nine runtime identities. Executable2299088B and compressed delivery2197556B
are distinct from compilation memory and external LLVM/Clang dependencies.

Raw: `/root/.cache/tower/root_pin_ca1c_adoption` and
`C:/Sandbox/build/codex_ecs_20261122/ROOT_pin_ca1c_adoption_source.tar`;
transport `root_pin_ca1c_default_build.sh`. All owned processes exited0.
The protected user todo remains unchanged. Later fixtures/package helpers retain
separate source identities; actual compiler-input changes require a fresh build.
