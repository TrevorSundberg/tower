# Serial compiler test transport linkage

The instrumented allocator uses a single coordinator-owned counter/failure stream.
`TowerWorkHost.cmake` intentionally links `tower-compiler-work-serial` into those
executables. Its portable transport reports one lane and has no worker callback.
Production native executables continue to use the real threaded transport.

The Linux Tower linker rejected `tower-frontend-tests` because the semantic
library unconditionally requested an exported `work_thread_entry` that the serial
profile did not define. `tower-work-instrumented-tests` requested the same absent
export directly. The failure is a build-boundary error, not a reason to run the
single-owner allocator concurrently.

The existing final consumer-profile pass now marks serial executables with
`TOWER_SERIAL_WORK_TRANSPORT`. Semantic-library callback export options consult
that property; the explicitly serial worker test omits its unnecessary export.
The equivalent macOS/MSVC option is gated too, but execution on those hosts has
not been validated by this Linux check. No compiler or runtime algorithms change.

Initial development validation on KinmenB, Docker Ubuntu 24.04/Linux x64/LLVM 19,
public bootstrap, native work/backend/module/driver test profiles (the worktree
also contained the separately measured, unpublished import-cache change):

- Both formerly failing test targets link. Original failure remains in
  `build/b2_baseline_tests_build.log`; successful build is
  `build/b2_serial_export_build.log`.
- `tower-worker-instrumented` passes its serial allocation/cleanup checks.
- `tower-frontend-tests /work/scaffolding editor` passes explicit-world query,
  inspection and lifetime checks.
- Native frontend/backend/editor unit CTests pass, including real frontend/backend
  worker overlap. Their elapsed times were 18.45/61.76/7.35 seconds; these are
  correctness run durations, not a compiler throughput comparison.
- `llvm-nm-19 --dynamic --defined-only` confirms the production LR/unit runner
  still exports `work_thread_entry`; neither serial executable exports it.

The profile selection and generated production callback remain identical, so
runtime performance/memory comparison is inapplicable to this build-only fix.
The former link operation failed, so no before executable exists for the affected
serial targets. These allocation checks are not sanitizer evidence for threaded
Tower code. A2 (transport) and D2 (tooling) reviewed and acknowledged the narrow
correction before implementation; broader sanitizer work remains separate.

For the isolated publication check, all unrelated production/test/audit edits were
stashed. Source `274a898bfa70eaec1d974431fd0a91b649b8c8c2` contains only this
build-boundary correction and its note over main `60312d3`. CMake regenerated the
profiles, rebuilt the reverted parser object and relinked the frontend/production
unit runners; the serial worker runner already matched these inputs. The command
was `cmake --build /cache/native --target tower-frontend-tests
tower-work-instrumented-tests tower-lr-work-tests --parallel 2`. The public Linux
x64 bootstrap was used without an override; no production binary was repackaged.

`build/b2_serial_exact_build.log` records success in 17.935 seconds wall,
13.574 seconds user CPU and 2.579 seconds system CPU. The isolated editor command
passed in 21.396/11.661/1.329 seconds respectively. CTest
`^tower-(worker-instrumented|native-units|editor-units)$` passed all three in
27.023/34.639/4.179 seconds, including the production unit overlap fixture.
`build/b2_serial_exact_validation.log` also checks that only the production runner
exports `work_thread_entry`. Container lifetime peak memory was 1,133,895,680
bytes before and after; this is a cumulative cgroup upper bound, not a fresh
per-command RSS measurement. These single correctness runs are not throughput
comparisons. The container was limited to CPUs 12–23 and 24 GiB; existing generated
compiler recipes still use the public compiler's implicit host worker count.
