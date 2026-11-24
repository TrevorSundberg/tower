# Generic expansion quota diagnostics

The cumulative clone quota now names `GenericNodeLimit`; physical allocation and ledger denial keep their separate typed causes. No quota, valid-program behavior, query scheduling or publication order changes.
Tested base `31102b64a4f3748727d07d8a8337377ce1fae848`, tree `746fba542f7f1fa4b57492989fcc76a86cecca35`, plus this scoped patch; complete actual source hashes are retained.
Public predecessor SHA256 `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`; no diagnostic/private compiler adoption or pin change.
KinmenA Windows/WSL2 Linux x64, Clang19.1.1 Release, CPU0–11/24GiB, one A2 native cache, outer4/compiler1, production allocator except explicitly serial denial controls.

[B1's receipt](compiler_lr_scc_provider_59d7dc9e.md) establishes copied65459,419instances, remaining77/copied77/storage_error0: cumulative65536 exhaustion, not physical Memory. Its temporary diagnostic compiler was not rerun or adopted.
Independent existing `semantic_invalid/generic_body_demanded.tower` reproduces the ambiguous message on current native baseline, exit1: definition `generic_body_cases.tower:5:1`, instantiation `large(S16)` line9,column7.
`generic_clone_diagnostic` selects static text from the existing clone receipt. Synchronous instantiation and deferred body publication share it; typed resource failures still take precedence in `sem_generic_body_failure` and synchronous callers.
Missing/nonpending body requests now retain typed `Invalid`, preventing their misclassification as quota exhaustion. No counters, clone ownership or queued-reference operations changed.
Final ordinary message: `Template expansion exceeds 65536 nodes (cumulative GenericNodeLimit)` plus the original single instantiation trace. The prefix preserves existing browser assertions; no assertion was broadened.
Cause selection allocates nothing, including after denial; the existing ordinary diagnostic/trace formatter retains its original allocation and failure behavior.

| Focused check | Actual result |
| --- | --- |
| `tower-generic-quota-diagnostic` | Four configurations: 32/64 × workers1/4; exact message/location/trace, retained prior execution42, fresh recovery42, final bytes/grants/lanes0 |
| `tower-generic-quota-causes` | Nine synchronous/staged trials: success, quota, exact Capacity, actual Memory, invalid request; no failed publication, no diagnostic-selection allocation, zero retained owners |
| `type-smoke` | Passed on the identical semantic implementation before the final literal-only prefix adjustment; evidence reused |
| `query-smoke` | Final text/provider passed: ordered first errors, lifecycle, production parallel clones, publication/cancellation and 32/64 query continuations |
| Ordinary quota CLI, jobs4 | Expected exit1; exact definition/call coordinates and final message; 0.553128wall/0.520675CPU s/209156KiB RSS |

Build commands: `cmake --build /cache/native --target tower-compiler-entities.o --parallel 1`, then targets `towerc tower-lr-work-tests tower-storage-tests --parallel 4`; public768 builds the entire affected closure.
Checks: `ctest --test-dir /cache/native -R '^tower-generic-quota-(diagnostic|causes)$' --output-on-failure --stop-on-failure -j1`; `tower-lr-work-tests /work/scaffolding type-smoke` and `query-smoke`.
Final focused checks cost2.237691wall/1.993070CPU s/222268KiB; query2.770400/2.873470/321760; type114.237665/104.693786/238068. No skipped selected checks.
Healthy input `generic_pointer_alias.tower` SHA256 `17c46e6b8d8d55f78ef9c097be1e435296b4e807859769924382c680fb07c962`; explicit x86_64 target, unchanged Bedrock/Foundation, `--interpret`, exact `true\n` and internal alias/effect assertions.
Fresh processes/warm files, n3 per revision/jobs; median wall/CPU/RSSKiB: jobs1 before0.429105/0.364541/168372, final0.406109/0.345463/169112; jobs4 before0.473221/0.432282/171916, final0.467502/0.426355/172628.
No demonstrated ordinary-path regression; small n3 variation is not a speedup claim. Four workers are slower on this small input. OS RSS is distinct from the checked final zero ledger ownership.
Profiler includes waited-process CPU; RSS is maximum process/child high-water, not simultaneous build-process sum. Final build container peak1086259200B, no OOM; free disk336506060800B.
Baseline compiler SHA256 `a5d3fc63d78069e607feaf62fdd0f1160f8d0222905bfae1c8b1c0ec5237ee6d`; final `3d220b5b91f4b3a505fea0a6f515ce203bf372471581825c6208066f7e9ea130`.
Final lr-work SHA256 `75fb3cf92329ddb61a96cc48339fab37a1fb79905b0592191604dd30ade3b9cb`; storage `43746f1d3f5f18bd7d4c5d7c54b58c228d74e162e116d6a557426f0f89666acc`.
Actual file-manifest SHA256 `cb42f0818852103270e62edf61e8b8ac3ccf52ea883455ee170ec635e3d123e7`; includes the new Tower fixture. Final verification rechecks all source/binary hashes.
Preserved failures: initial bool-output oracle mistakenly expected1 instead of existingtrue; public768 rejected a top-level string initializer, reserved test identifier and missing direct imports. Corrected using supported ordinary functions/imports; no bootstrap change.
Final v5 transport lacked one shell newline after all checks/samples passed; retained exit1/log, then verified hashes and the previously unstarted CLI check in `final_verify.sh`, exit0. No successful test was silently rerun or failure relabeled.
Raw commands, patches, manifests, builds, stdout/stderr, times and statuses: `C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/generic_quota_31102b64` (`before*`, `candidate*`, `focused_final*`, `type_smoke*`, `query_final*`, `valid_{before,final}_*`, `quota_*`, `final_verify*`).
Serial allocator controls are distinct from production overlap; no sanitizer/race-freedom, new reactor/browser/generation or deployment claim. ROOT retains integrated artifact adoption and the separate service-blocked instrumentation gate. Four preserved stashes/todo untouched.
