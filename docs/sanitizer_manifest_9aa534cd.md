# Complete configured sanitizer inventory — D2

Base `9aa534cde4d5dc150a2b28ac4ca0c0fe3bf3613c`; only shared CMake inventory transport changes. `instrument_llvm.tower`, object commands/flags, provider bindings and work-test selection remain unchanged.
Cause: `TowerRuntime.cmake` includes `TowerSanitizers.cmake` early; its deferred manifest read preceded `tower_lr_work_policy_test` and nested deferred producers. `file(GENERATE)` postponed writing, not the already-expanded property snapshot.
Actual late LR producers are `lr-work-main` and the three `semantic-{receipt,failure_order,lifecycle_frontier}-checks` objects. `TowerWorkHost` also appends a second deferred profile pass; one extra fixed defer is not a general ordering guarantee.
Fix: schedule the single global inventory collector in the root directory; if deferred calls remain, append the collector after them. Once drained, read the property, deduplicate identical rows, sort lexically and fail on conflicting descriptions of the same exact object path.
No glob, basename collapse, path normalization, producer deletion or instrumentation change. The unchanged header explicitly says configured inventory is **not an execution receipt**. Includes are globally guarded; finite producer chains terminate before collection, including producers appended by other deferred calls.
Recipe SHA256 `706962ebed99bc78c680eb8ac14873d6e91934dc9504eb4031399a2a81d24774`; exact ten-file recipe/tool/fixture Git identities and output hashes are in raw `reviewed-inputs.git` / `results.sha256`.

Configure-only regression: `cmake/tests/sanitizer_manifest/` uses the actual object-registration function and inert tool placeholders; no placeholder/compiler/instrumenter is executed. It adds early, deferred, twice-deferred receipt and three-times-deferred probe objects, an identical duplicate, source/build paths with spaces and two distinct directories sharing a basename.
Before fix: configure0, exact-content check1; only the early object appeared. After fix: configure/check0, all four independently enumerated rows exactly once in deterministic order. These are metadata producers, not executions of LR/receipt/race probes.
`-DCONFLICT=ON` adds different source metadata for the same object: configure exits1 with `Conflicting sanitizer inventory entries`, before generation. Reset OFF in the same cache: configure/check0 and byte-identical manifest; no failed log removed.
Reproduce on Linux without LLVM: `cmake -S cmake/tests/sanitizer_manifest -B "build/manifest check" -G Ninja`, then `cmake "-DFIXTURE_BINARY_DIR=build/manifest check" -P cmake/tests/sanitizer_manifest/check.cmake`. Do not build this synthetic fixture. Conflict control uses the same configure command plus `-DCONFLICT=ON`; restore OFF afterward.

Real project configuration also ran: existing idle `tower-d2-ecs` container, CMake3.28.3/Ninja, installed Clang/LLVM19.1.1, native address mode, WORK/BACKEND_TESTS=ON, Release/jobs1, checked-in public bootstrap; no installation or Tower build/probe. The container's existing memory limit is8GiB; no resource setting changed.
Fresh isolated native cache configured successfully. Expanded CMake trace contains109 actual `TOWER_SANITIZER_OBJECTS` append records; sorted complete rows equal all109 manifest entries with zero duplicate object keys. All four formerly omitted LR entries are present.
All108 reachable Ninja instrumented-IR rules and all32 instrumented objects in `ninja -t commands tower-lr-work-tests` are represented. These tools print graph/commands only, without executing them.
Initial strict109-versus108 equality failed and is retained: `TowerBackend.cmake:105–182` configures both interface flavors, but native consumers select only `tower-backend-native`; the unconsumed `tower-backend-wasm` row correctly remains configured inventory. No missing reachable rule is accepted.
Reconfigure retains byte-identical manifest and LR commands. Whole `build.ninja` comparison initially differed only in generated PDB/debug metadata; retained diff, no blanket byte-identity claim for that file. Actual registration equality and reachable-rule subset checks pass.
Real manifest SHA256 `3c3833ab30f7f55128bee60485411208eaa66a6218e252f505fa519065f5e91a`; synthetic manifest `c847c7777109dcff328b38d362cc9cfc469ae8bc2219d16f48d1f6753fecf979`.

| GNU time validation cost, one sample | Exit | Wall s | User+system s | Peak RSS KiB |
| --- | ---: | ---: | ---: | ---: |
| Original synthetic configure / subsequent check | 0 / 1 | .06 | .04 | 20188 |
| Fixed synthetic configure / subsequent check | 0 / 0 | .07 | .05 | 20284 |
| Conflict configure / restored configure | 1 / 0 | .03 / .04 | .03 / .03 | 18680 / 20416 |
| Real configure / traced reconfigure | 0 / 0 | 3.66 / .85 | 2.89 / .76 | 93572 / 73316 |
| Integrated thread configure, metadata only | 0 | 3.33 | 2.92 | 93516 |

Times in the first two rows measure configure only, not the separate check. These are validation costs, not compiler throughput/memory improvements; CMake compiler-identification checks are not Tower instrumentation execution.
ROOT/A1/L2 adoption: in an idle existing supported cache, preserve the old TSV and command inventory, then `cmake -S SOURCE -B CACHE` with unchanged cached options; do not build solely for this manifest repair.
Compare unique TSV object/input/instrumented-IR/mode entries with `ninja -C CACHE -t targets all` and `ninja -C CACHE -t commands TARGET`; require every reachable instrumented object once, including four LR/receipt entries and any configured opt-in probe. Explain configured/unconsumed extras from their exact target consumers; do not count stale on-disk objects or assume all configured objects execute.
Reconfigure a second time only if checking determinism; TSV must match. Executed instrumentation, linked archive members, runtime reports/exit codes and deliberate-probe diagnostics remain separate owner obligations. L2's pending opt-in race-target composition was absent at this freeze and is untouched here.
Integration `d6db5468c135a20fc720fa987bf307fee9f1ee7d` brought L2's thread-only target without changing the repaired recipe. Configure-only thread adoption now checks111 actual append records against111 exact manifest entries, all110 reachable Ninja rules and all three probe-closure objects (probe, host memory, guest runtime). No build/probe command was executed; the same unused wasm interface explains the extra row. Raw `integration.git`, `integration.sha256`, `thread-*` and `probe-*` retain this separate boundary; earlier address evidence is reused unchanged.
Raw `build/d2_ecs/sanitizer_manifest_9aa534cd/`: original/fixed TSVs, negative logs, configure times/trace, Ninja target/command inventories, exact comparison failures and hashes. Original A1/L2 omission failures remain historical; no sanitizer runtime acceptance, timeout change, deployment or public-pin claim.
