# B2: SCC browser build inputs

PASS portable, LLVM, cross, shared compiler and work-fixture builds; complete recipe-derived bundle ready for ROOT acceptance. This is build/package evidence, not runtime acceptance.
Compiler/project source `c934d02de7709ecf236c4dbe2a1ca9ea6f92fb20`, tree `98e3815e87a41bf0d9f89e2a901b36ab18cb7160`; later parser work excluded.
Public bootstrap `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`, default checked `build-bootstrap.sh`, no private override. Source archive SHA256 `f48fb7d7db229f3b13cf9547b47d5fef51e268aaeade9f4a2dcb5f67c7929e46`.
KinmenB Linux x64 container, CPU12–23/quota12/24GiB, compiler jobs1/outer jobs4, sequential builds. Host Clang19.1.1; WASI SDK34/Clang23.1.0; vendor LLVM revision `1e57ee22ca274b663eeb279fd86e7010a8441c99` (tablegen reports20.0.0git).
Portable/shared used existing `build-wasm.sh`/`build-threads.sh`; LLVM/cross used the same configured `tower-browser-llvm`/`tower-browser-cross` targets, stripping and `package_compiler_project` entry after the wrapper's host-cache prerequisite failed.
An idle WSL vendor cache was copied privately, never built in place. CMake3.28/Ninja1.11 produced a needless1788-action plan; compatible CMake4.2.3/Ninja1.13 reduced it to107, actually105 actions after restat. All76 vendor archives remain byte-identical; no WASI LLVM C++ recompilation occurred.
Retained setup failures: profiler launch with a nonabsolute executable; wrapper host cache missing `libz.so`, then `zlib.h`. The latter attempted34/278 host actions before stopping; original pinned tablegen remained byte-identical/runnable and was reused directly. No failure was counted as a passed wrapper build.
Strict checks exposed real Wasm relocation-policy omissions: entities `__table_base` for `syntax_origin_cancel_borrowed`, parser-format/template-build `__indirect_function_table` for callbacks. Only these exact Wasm/unit allowances changed; native, wrong-unit, truncated/suffixed and unsupported-table-base negatives remain enforced.
The full policy fixture passes, including16 added cases and the corrected stale entities expectation; initial rejected reports/old-expectation SIGABRT remain retained. Actual per-unit symbol checks pass30/30 across portable/shared/LLVM-cross; evaluation uses the existing interpreter policy.
Verifier-only edits occurred after reactor builds; they do not relabel reactor source or require a runtime performance claim. Exact edited blobs and verifier executable hash are in PROVENANCE/toolchain records.

| Successful phase | Wall s | Child CPU s | Peak RSS KiB | Exit |
| --- | ---: | ---: | ---: | ---: |
| Portable,29 actions |52.167820|97.650781|1105184|0|
| Shared/work,31 actions |49.606031|96.801153|1106696|0|
| LLVM/cross + project package |71.016882|136.703635|1107824|0|
| Policy regression compile/link/run |1.440153|1.130547|202416|0|
| Verifier tool +30 object checks |2.812670|2.180466|225912|0|
| Support/archive closure and identities |3.227809|2.403982|83536|0|

Validation/build costs only; no scaling claim. `phases.json` also retains configuration and failed-attempt costs; the old-expectation profiler exit was not separately captured, while child SIGABRT is logged.
Portable1670637B SHA256 `d2e5f3bafe78198800791f2cfab5d1efc8fad6ee0df4ea2245d1eb937f58556c`.
LLVM35425472B SHA256 `5bf2a0cb3c9cd47f465ca7051810457f99eeee8c306490a02032b7f27f6119c4`; cross56581367B `956e15ce75d1abf550e4dd022e90c4944651bc96a19edcf00009c5ab86a7e6ea`.
Shared1755136B SHA256 `b0e3e498d0280efa682086db85a77a6a995d01c04d82c8878a2b6d26d1e25476`; work52525B `c0747310ee756c4e76cc37b49594513d1e516752a0e082c4aff9b2d0d5f8108a`.
All three project recipes include `shared-graph-components.o`, `graph_components_result`/`graph_components_dispose`, and exact provider/types/interface source; ordinary shared linking also contains the provider. Recipe unit counts20/21/22.
Complete inputs:24 files/163892055B = five Wasm + project.json + ten support archives + one imports file + seven target-pack files. Every recipe unit/support reference resolves; gzip integrity/archive reads and allocation/trap provider presence pass.
Unlike the old raw32-file snapshot, the new bundle excludes eight unreferenced leftovers: six loose runtime objects already represented in support archives, stale `imports-tower-18.txt.gz`, and stale `support-llvm-4.a.gz`. None are current recipe inputs; originals remain preserved.
Seven target products reuse exact59d bytes: the complete host/target/package/runtime dependency source delta is empty. No target code was relabeled as newly compiled.
Immutable transfer directory: `C:/Sandbox/build/codex_ecs_20261122/B2/browser_inputs_c934d02d`; `files.json` SHA256 `3f0cc9c3e9137ea1913a1572d25bb38af9fa4163e9a5c0dc328ff476d0ba3c1a`. SOURCE/PROVENANCE/READY accompany it; READY was written only after successful builds/closure checks.
Raw commands, source1350-file manifest, original vendor cache, before inputs, failed logs, object/link metadata, relocation reports and measured phases: `C:/Sandbox/build/codex_ecs_20261122/B2/browser_build_c934d02d` and `/cache/browser_build_c934d02d`.
Warnings retained: vendor CMP0116 deprecation and optional native-host library/tool notices in failed host-cache regeneration; successful reactor/package log has no compile warnings. No compiler/runtime source repair, capacity change or provider omission.
Prior32-file ROOT59d bundle and both102-file/105716512B static dist copies remain hash-identical, manifest `7f6ea88decec364a6794415a8aa1bf1f63753b429f82adad85d9f3c83012200d`; all owned jobs drained.
Pending ROOT integration: new-artifact Node/shared/UI/edited-generation acceptance and final release/pin; algorithm peer review is separate evidence. No such suites, instrumentation or hosted deployment ran here. The service-rejected local deployment verifier remains unstarted/untouched.

Integration `bf885dfd475b60bc328204a46e37b073894c5d42` preserves published `cbedb8d1`, including later syntax-scan changes, peer receipts and public bootstrap `eeb005717318086c145428edc3b6b784d4729df7ef0514c7329e0a18b76dda9c`. Verifier delta was comment-only; retained full fixture +30reports passed again and all24artifact hashes matched. Later source/pin inputs are excluded from this c934/public768 build; unchanged evidence is reused without rebuilding or relabeling.

Subsequent [runtime acceptance](scc_browser_acceptance_b8b3be21.md) passes shared suites but exposes a missing generated runtime source in the recipe. These original build hashes remain valid; this bundle is not edited-generation-ready until its package producer is repaired.
