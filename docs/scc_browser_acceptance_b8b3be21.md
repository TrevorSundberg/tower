# B2: c934 shared acceptance; edited generation blocked

PASS complete Node3/full matrix, strict browser normal3 and ownership9. FAIL Generation1 compilation; Generation2 and candidate adoption/checks unstarted. No retry or source/transport repair.
Immutable compiler/project source `c934d02de7709ecf236c4dbe2a1ca9ea6f92fb20`, public768; all24 members/163892055B verified before/after, manifest SHA256 `3f0cc9c3e9137ea1913a1572d25bb38af9fa4163e9a5c0dc328ff476d0ba3c1a`. SOURCE/PROVENANCE/READY preserved.
Host/fixtures/resources separately frozen `b8b3be21ec1fd59e92457913f678ac6ebc8290da`, tree `0a20bd1ebd35e3e836b2c254ae88e73a1137d129`; archive SHA256 `716e0f161bb5e147589db4b0925cd45285ba5fd35e269435f97bfa3b86093047`. Later producers are not included in c934 compiler bytes.
Shared SHA256 `b0e3e498d0280efa682086db85a77a6a995d01c04d82c8878a2b6d26d1e25476`; work `c0747310ee756c4e76cc37b49594513d1e516752a0e082c4aff9b2d0d5f8108a`.
Portable `d2e5f3bafe78198800791f2cfab5d1efc8fad6ee0df4ea2245d1eb937f58556c`; LLVM `5bf2a0cb3c9cd47f465ca7051810457f99eeee8c306490a02032b7f27f6119c4`; cross `956e15ce75d1abf550e4dd022e90c4944651bc96a19edcf00009c5ab86a7e6ea`.
Node22.23.5/Playwright1.65.1/Chromium159.0.8154.6, Linux x64/WSL2, CPU12–23/quota12/24GiB, one heavy family at a time. Actual isolated browser reports12 hardware threads and SharedArrayBuffer; same launch options, executable hashes retained.
Unchanged Node30/10/120s guards and180s outer; browser30s retirement; generation600s outer; Wasm2GiB maximum. Generation host-JS heap4096MiB matches the established command, not a reactor cap increase. No skip/fallback/guard changes.
Node128 four-thread lifecycle/reuse cycles and real injected wasi_thread_start failure pass; full1/2/4/8 declaration/body/lowering/staging matrix passes. Exact ID sets:23created/23terminate requests/23actual end events.
All571 phase records retained:128pool completions,1trap completion,4compiler loads/closures/capacity completions,16ordinary/16generic/272dependency/16module executions,80invalid checks,8world/4LR/4window/4iteration checks; four source/module setups.
Original full canonical serial/parallel, Graph/Fast, effect/query/cycle/capture/implicit protocol/stale/cancel/owner assertions remain unchanged. The Tower barrier requires four distinct live workers; requested width alone is not the evidence.
Normal pool4/compiler1/compiler4: actual browser closes5/2/5, children before coordinator retirement, zero remaining workers and CDP targets. Twelve fixture results preserve full canonical equality and literal0-newline output.
Ownership startup/partial/busy/coordinator-error/messageerror/startup-error/shared-trap/generation-retire/retired-errors all pass; actual closes1/5/5/5/5/4/5/5/10, all zero targets. Startup-error legitimately stops after four created workers under the unchanged bounded-startup assertion.
Partial startup holds one real port with zero children ready, then drains all five; shared trap reports sharedFailure:true; old-generation replies/errors stay suppressed, replacement executes real pool work. No early browser/page close or target filtering.
Observed normal linear capacities33947648/81920000/90308608B are retained Wasm capacity, not live owner bytes/RSS. No separate Node/generation linear-capacity sample or general race-freedom claim.

| Selection | Wall s | Waited child CPU s | Peak RSS KiB | Exit |
| --- | ---: | ---: | ---: | ---: |
| Complete Node3 |102.880156|171.191553|468248|0|
| Strict browser normal3 |5.928483|1.950168|223944|0|
| Ownership9 |6.989727|3.209032|233472|0|
| Edited Generation1 attempt |26.284882|65.941602|1390208|1|

Existing process_profile reports waited child CPU and process high-water RSS, not concurrent tree-summed RSS. These differing validation workloads are not scaling comparisons; no runtime code change requiring a performance experiment.
The existing generation script receives the exact25-unit/561-source recipe and ten support archives/one imports file, with all seven target assets available. It applies the real semantic diagnostic edit; Gen1's LLVM was intended to build Gen2.
First failure: `units/backend_wasm.tower: units/backend_wasm.tower: Cannot read imported module: tower_runtime`, propagated from compiler-build.mjs:51.22of25 units dispatched; backend_linker/backend_native/backend_macho unstarted. Both generation workers actually ended, active0.
No candidate reactor or object file was retained: onObject flushes only after the complete compile group succeeds, and linking never began. No changed-diagnostic execution, candidate checks, successor adoption or object/reactor equality claim is possible; Gen2 never started.
Edited input SHA256 `569a69a52ad083912246d752f0e372bcf3d4a276c5510a2e629a339e6faef286`, exact error/dispatch list/worker receipt and empty output directories retained. A separately queued semantic result cannot be claimed completed from dispatch logs.
Root cause: package_compiler_project.tower canonicalizes the LLVM build argument with realpath, but compiler_project_files.tower:125–137 compares generated dependency paths as raw strings. Depfiles retain `/home/trevo/.cache/tower/backend-wasi/tower_runtime.tower`; the canonical expected path is `/cache/vendor_reuse_c934d02d/backend-wasi/tower_runtime.tower`.
Both paths have device/inode2112:569362,38010B and SHA256 `735256f40eec2ab755b0bca7e5a88831c43b48e1f8996223346c7327029fba9d`; the dependency exists but is silently omitted. c934 recipe has no `units/tower_runtime.tower`, while both backend units import it; the prior59d recipe contains it.
The earlier build/package receipt established linked reactors, listed unit/support closure and hashes; it did not establish complete generated-source closure. This failure narrows that claim. Do not inject an old module or relabel the immutable package as generation-ready.
Actionable next producer: normalize generated dependency filesystem identity consistently with the build argument, retain lexical packaged module identity, and fail packaging when a required generated import is unmapped; add a symlink-build-root package regression before issuing a replacement recipe. That packager/re-export work is outside this host-transport-only/no-package batch; no algorithm defect inferred.
All1217 resource/146host files remain unchanged; resource JSON SHA256 `5ce82ebaf2bd6c3042d9cacf58b208097c857f8db86502d60b84730f221097c9`. Original/copy input hashes and both102-file105716512B accepted static snapshots reverify unchanged, manifest `7f6ea88decec364a6794415a8aa1bf1f63753b429f82adad85d9f3c83012200d`.
Raw commands, reports, phase/ID sets, source/tool/artifact hashes, failure depfiles and alias evidence: `C:/Sandbox/build/codex_ecs_20261122/B2/scc_acceptance_c934_b8b3be21` and `/cache/scc_acceptance_c934_b8b3be21`; immutable bundle remains adjacent `browser_inputs_c934d02d`.
Owned jobs drained. No rebuild, package/UI/T8/T9 repeat, sanitizer, rejected operation, pin or hosted release. Local deployment verifier remains service-rejected/unstarted/untouched. ROOT owns replacement-package generations and final release; no host fix was justified.

Integration `a8c3f507` preserves published `035ad6e8` and later prediction-index/quota/foreign-package work; those producer changes are excluded from c934 reactors and the archived b8b3 host/resources. The failing package producer and selected host harness are unchanged; frozen hashes and completed evidence are reused without another matrix or failed-generation retry.
