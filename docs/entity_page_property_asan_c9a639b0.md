# Seeded component-page ASan adoption

Frozen source `c9a639b072c916ca7fd72f21a8132abb6243aa90`, tree `b76de256456fc4092e8896090b92bd36c619a189`: includes published bucket storage, typed constructor repair and B1's seeded property fixture. Later inputs are outside this freeze.
Default public compiler SHA256 `31a385c616b889987d68f8eb9714020f3928aac97591a1569f905ab706f52ed6`, bootstrap override unset. No production, fixture, expected value, cap or guard changes.
KinmenB Linux x64/WSL2, Clang/LLVM19.1.1, CPU0-11/24GiB ceiling, outer2/compiler1, one owned separate `/cache/native_address` cache; production allocator and real pthread transport.
Built only `tower-entity-page-property-tests` and `tower-entity-stage-concurrent-tests` through native CMake/Tower `instrument_llvm`; 12 dependency actions, no vendor/compiler-generation/browser build.

Actual links consume three distinct Tower objects: property201 definitions, concurrent265, guest runtime41, total507. Every object has address-pass IR, ASan initialization and memory-access references; both executable links contain `__asan_init`.
The concurrent executable exports real `work_thread_entry`. Actual depfiles include entities/stage/budget/buffer/libc/worker/compiler-kernel closure, with no serial fault allocator or transport substituted.
Original IR, instrumented IR, objects, executable hashes, exact commands and nm reports are retained. Configured sanitizer inventory is preserved separately and is not treated as executed coverage.
Uninstrumented build-host tools are outside the tested link closure. Foreign libc/LLVM internals and individual retired slots inside still-live pooled allocations are not universally instrumented/poisoned.
Reused L1's [existing sensitivity and positive evidence](storage_asan_1bfe0657.md): instrument tool SHA256 `2ae3dab3bf8ff7d8327a1c9783cde1226b0190534077f3e5d3f295e40f14fa12`, compiler-rt ASan archive `1050d83b513bef5d532f1a7ddca8fdb3760aa9af99228ced681ee8140ce8b600`, both exact current matches.
Git equality against that freeze also establishes unchanged runtime/grammar dependencies, instrumentation source and guest/object emission policy. Its eight-byte heap-overflow negative and ready positive are reused, not rerun or relabeled as new executions.

**Two selected executables / two executed / two passed / zero failed or unstarted runtime controls**, each with `ASAN_OPTIONS=detect_leaks=1:halt_on_error=1`, original arguments and unchanged30s process guard.
Property stdout is byte-identical to the accepted [ordinary run](entity_page_property_3693371d.md): seeds1/314159/4294967291, operations1147/1150/1141 (3438 total), finalizations556/557/558 (1671 total).
All original independent model checks execute: mixed allocation classes, dense64/64/64/51 capacities, full-to-partial transitions, untouched addresses, values/presence, held references, six publications/six discards and three typed Capacity refusals/same-cap retries.
Retained bytes125738/125898/125834 and99 grants per seed match ordinary execution; deliberate pressure reaches the original8388608B charged cap. This peak reservation is not RSS or physical page residency.
Every seed finishes with zero store entities/components and zero charged bytes/live grants/lanes, then successful disposal. No counter reset, assertion weakening or sanitizer-specific expected result.
Existing concurrent control passes160 two/four-thread outcome trials plus four transition controls; 57792 finalizers, distinct workers and simultaneous entry barrier, cancellation/drain, lease/publication and final owner/budget disposal assertions remain intact.
Both raw exits0, both sanitizer stderr files empty, normal completion reaches LeakSanitizer. No sanitizer/model/ownership defect was found; no production repair or throughput comparison is applicable.

|Validation|Wall seconds|CPU seconds|Peak process/child RSS KiB|
|---|---:|---:|---:|
|Property|0.08|0.05|14856|
|Concurrent stage|0.34|0.44|83496|
|Selected dependency build|12.43|12.41|276764|

Configure cost15.58s wall/2.12s CPU/74204KiB. These are validation costs, not a production speedup or aggregate container peak; the concurrent fixture independently reports439867 CPU microseconds/83496KiB.
First configure failed because the old cache's generic backend include and the new canonical project-specific hook both registered targets. Removed only the duplicate cache option, retained the full failed log, and reconfigured successfully; no source or capability change.
A preservation-only hash command initially named an absent `libLLVM-19.so.1`; corrected to the actual linked `libLLVM-19.so`, retaining the partial manifest and transport note. Missing remote evidence-path/read-only discovery errors did not run tests or change inputs.
Property ELF SHA256 `0f26075fb842318ed12f601889c1ac8165b699fd1bc0a7ba3223c7123e31b770`; concurrent ELF `6e6ce9f13a4d8cc7dfa84773dbb2d3f7e6f16745f76b642dddeacdfb62d9f8a6`. Frozen sources and both binaries rehashed successfully after execution.
Raw scripts, errors, exact source/tool/runtime/object manifests, depfiles, original/instrumented IR, binaries, stdout/stderr/status/time: `build/ecs_b1/cache/page_property_asan_c9a639b0/`; handoff `C:/Sandbox/build/codex_ecs_20261122/B1/page_property_asan_c9a639b0/`.
Owned jobs drained,96GiB free, todo/public pin unchanged. This closes bounded current property/concurrent ASan adoption; it does not prove exhaustive pooled-slot safety or race freedom. ROOT owns final integrated publication; broader compiler/browser/TSan/generation/deployment gates were not repeated.
