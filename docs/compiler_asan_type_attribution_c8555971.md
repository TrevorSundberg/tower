# A1 frozen ASan type attribution and independent control attempt

2026-11-24; compiler/resources remain `c8555971ff4e20c5ab6de2ea9d50da8906d7cf35`, public31a. [Original query pass/type timeout](compiler_asan_queries_c8555971.md) remains unchanged.
Original ASan ELF `8170411e3d60e5f46921e4902119d32b45c19e1470ba9da9c8f69313e0560d3a`; all32 linked-object/IR/dependency identities verified unchanged before/after this work. No repeated query/storage/sensitivity run.
Current main contains later B1 policy; none enters these binaries or resources. Exact c855 scaffolding was extracted from Git into the owned resource snapshot; RESOURCE_ROOT relocated from `/work/scaffolding`, with frozen contents.
Linux/LLVM19.1.1, existing container CPU12-23/24GiB, unlimited virtual address space, production allocator/worker transport; no security changes. Every run retains `timeout --signal=TERM --kill-after=5s 180s`.
ASan uses unchanged `detect_leaks=1:halt_on_error=1` and installed llvm-symbolizer. No ASan stdbuf/LD_PRELOAD alteration; diagnostic Tower markers call existing formatter/puts/fflush and monotonic clock.

| Single execution | Exit | Wall s | CPU s | Peak process RSS KiB |
| --- | ---: | ---: | ---: | ---: |
| Original ASan control-smoke | **124** | 180.06 | 182.36 | 826,412 |
| Matched plain original type-smoke | **0** | 130.08 | 108.29 | 236,104 |
| Diagnostic ASan full type-smoke | **124** | 180.05 | 180.66 | 817,452 |

Control stdout/stderr are empty: independent gate attempted once, still **not passed**, with no finer completed phase observable. Parent transport exits1 for both guarded failures; child124 is the authoritative timeout status.
Plain counterpart recompiles the exact32 preserved pre-ASan bound IR inputs at the same target/O1 flags, links the same provider closure without ASan, and runs the entire original selector once. Ordinary stdbuf only line-buffers this non-ASan run.
Plain ELF SHA256 `67cb01abdf4847deac73c510ea4166e02d8ec7724d09dd60c48eff53e9a9711d`; no ASan initializer. All original canonical/effect/diagnostic assertions complete, including final imported-alias and unary-argument suites; this is not instrumented acceptance.
Diagnostic ELF `c1596b982d7a5ccedb813af15479369fda39412218025a6c3c88164d0e6bd6eb`:31 identical original ASan objects plus one rebuilt test entry,274 definitions versus273. Actual ASan load/store/initialization references retained.
Only diagnostic copies of lr_work_main, body_runs and semantic_lifecycle_checks add flushed boundaries; original branches, loops, cases, result checks and cleanup order remain. Runtime fixtures use the separate unmodified resource snapshot. No production source change.
Initial diagnostic link failed for added tower_print; existing formatter/puts replaced it. A missing explicit format_api import then failed compilation and was corrected. Both errors and sources retained; no diagnostic run occurred before the successful entry-only rebuild.
Preparation attempts: exit1/1/0, wall45.50/5.88/27.69s, CPU30.26/2.07/10.82s, peak383300/312660/382560KiB. The completed plain objects were reused after the first link failure.

Observed diagnostic intervals, measured between flushed monotonic markers (not CPU attribution):
- All16 nominal-wrapper negative trials complete in42.856017s.
- All28 numeric-wrapper trials then complete in87.507860s.
- Both alias-query fixtures at32/64 workers1/4 complete in23.866160s; prefix complete at154.230038s.
- Lifecycle starts at154.240386s. RootCall, RootFailure, SignatureOnly and Initializer finish at target32, workers1 and4: **8 complete trials**, three successful serial canonical reconstructions.
- Individual lifecycle durations are2.829866–3.587751s; last completed Initializer/four trial ends at179.901819s. Mismatch/target32/one worker begins at179.902617s, immediately before the guard.
No repeated mode/width/worker tuple appears in those completed trials. Source loops intentionally enumerate42 cases × two widths × one/four workers (168 trials), with extra canonical reconstruction on successful serial cases; they do not constitute a replay bug.
This demonstrates substantial completed useful work and continuing progress near the deadline. It supports aggregate ASan validation cost exceeding180s, not a stall in observed completed phases; no concrete redundant/incorrect production loop was found. It does not rule out defects in unexecuted phases or recover the exact instruction of the original unmarked timeout.
The remaining lifecycle work, body/canonical/type-error group, imported-alias and integer-argument tails are not completed by the diagnostic ASan run. Empty sanitizer stderr is not a pass; termination prevents its final leak scan and suite-level teardown proof.
Evidence-based follow-up is an exact-preserving phase gate design by ROOT/D2, retaining every original trial, oracle, ordering dependency and later tail. No narrower union is adopted here; no timeout recommendation, case reduction or inferred full pass.
Historical plain receipts (217.24s in retained type_smoke_joint42_1;124.992s in module_body_types_78d675c4) concern other sources and are not denominators. These n1 costs, including diagnostic I/O, are validation costs rather than compiler speedups.
All jobs reaped; terminal Docker list only the preexisting sleep process, memory-limit/OOM events0. Process retirement after timeout is not semantic zero-owner or leak-scan completion. Prior query teardown and L1 sensitivity/storage evidence remain separate and unchanged.
Raw root: `C:/Sandbox/build/codex_ecs_20261122/A1/cache/asan_followup_c8555971/`: control/type `.out/.err/.time/.exit`, full marker trace, original resource archive, separate Tower diagnostic sources/patches, build failures, commands, variant hashes and terminal checks.
No full matrix, browser, generation, sanitizer-policy change, production optimization or deployment. Both original ASan type/control acceptance gates remain open; ROOT owns final integration.
