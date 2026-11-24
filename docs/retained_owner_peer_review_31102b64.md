# Independent retained-source owner review

L1 source-only review at `31102b64a4f3748727d07d8a8337377ce1fae848`, 2026-11-24: no concrete defect found in the stated synchronous retained-owner contract.
Reviewed D2 implementation `9c6ac64e8c8b4cabb217591f11f7c0bf44ff83d5` and joined receipt `1040c73ec33842172bd00928da85e4b34c9944fd`; four primary files are unchanged from the implementation.

| Primary source | Exact Git blob |
| --- | --- |
| `scaffolding/tests/execution_world.tower` | `de5b242470a6919e178ed6e749ae7006db233b8d` |
| `scaffolding/tests/execution_main.tower` | `21a57e16f6291404d8e91ce975e3c3049695018e` |
| `cmake/TowerExecutionTests.cmake` | `2ceb2d7eb641a6f39bba7426db7018e02e98f7b5` |
| `docs/compiler-services.md` | `4c14caf7f050fff84c82615ecc7ca55b237ef22d` |

Key lifetime contracts: execution_session `edf6df398ef43a4ff10a2ad9c8c8627fdcbb7563`, frontend_modules `3e8e71b2b83619f3b58f80b672bc4dc58abedb6a`; the complete21-path direct-callee map is retained externally.
Each worker setting creates exactly one world/environment and reuses one session variable; binding refuses foreign-world reuse, and every positive root is asserted to belong to that world.
There are seven successful requests per setting (four Graph/three Fast), hence14 literal output checks; two semantic failures and two stepped unfinished Fast programs are separate controls.
First oracle: `1,1,107,11,7,7,2`; changed oracle: `3,8,207,31,13,13,2`, each value newline-delimited and compared by exact counted length/bytes.
These independently encode module effect, Item's u8/u64 layout1/8, forward comptime helper107/207, body effect11/31, returned/field values7/13 and final effect2; no serial/parallel self-agreement substitutes.
Unchanged Graph/Fast repeats, same-name edits, rejected NUL replacement, semantic failure/repair and replacement after partial Fast execution all reach those literals.
Ordering qualification: `frontend_modules_source` replaces the input snapshot BEFORE the old execution session closes. The test does not assert otherwise.
That ordering is safe here: admission transactionally copies bytes, `module_read` copies them again, and SyntaxSource/session/node references own independent immutable text; literal callers outlive every synchronous borrow.
`execution_session_compile_sources_world` closes old Fast vectors/storage, interpreter frames/memory, diagnostics/output and program/root before creating the next root; fresh-state assertions check null Fast/memory, empty output/error and zero steps.
Frontend request graphs retire on synchronous compilation return; semantic_context's deferred disposal retires evaluation/body/query state and WorkGraph. Retained parser tables/grammar snapshots intentionally survive; byte/path validation controls reuse.
Consequently this is fresh semantic recompilation in retained owners, not persistent semantic-cache invalidation or proof that every cached parse object dies at each edit.
The Missing control asserts exact `Unknown type 'Missing'`, resourceNone, done/failed, zero steps/output and refusal to start either engine; repaired input restores the first literal result. Diagnostic source offset/file is NOT asserted.
The partial Fast control requires successful Fast admission,16 steps requested, nonzero actual steps and unfinished state; the next compile invokes the same close path, and its new Fast run reaches the changed literal result.
Final checked close tests exclusive root ownership, one root release, cleared storage and idempotent close; module destruction requires no active graphs, then frontend/world disposal and bytes/grants/lanes0 are asserted.
The signal, budget and observation-gate stack owners outlive all synchronous work; observer is detached before world teardown, pool close drains/joins threads, and deferred gate/signal closes happen afterward.
Observer increments/decrements under a separate host gate around nonrecursive LookaheadKernel calls; workers2 requires peak>=2 and active0. This proves overlapping kernel intervals, not merely queue width.
Its interval spans baseline installation AND requests, so overlap is not attributed to each edit or semantic bodies; workers1 may legitimately report peak0. No race-freedom or global-allocation census follows.
The dedicated `retained-sources` branch unconditionally runs workers1 then2, with capacity failure rather than skip; target64 only. `all` does not invoke it. Its explicit CTest is Linux x64/native-only, with90s bound and nonzero failure.
Execution has100000 fuel plus terminal-state assertion; no timeout relaxation or implicit infinite-loop execution. Mid-compilation edit/cancel and restarting cancelled work graphs remain unsupported/separate contracts.

Owner-attributed runtime evidence, not rerun here: initial d6f7031d plus fixture overlay, binary `3682d618a57a80d75e5c33d7263686cba6e28350efb071a483dc36514cded9f8`,1/1 CTest,3.87wall/3.76CPU/202068KiB.
Joined SCC closure `c1b9ca8d722a8de464ab808c3fd41d01e1c0211b`, binary `2e6132082b9dd59f70750ba413ab2d98e37d971b9b6ddc0f943a4373ee643b99`,1/1,5.49wall/5.30CPU/202480KiB; same14/two/two controls, overlap2 and finalzero reported.
Both are n1 different-source validation costs: the higher merged observation is preserved, not an accepted performance regression, improvement or neutrality claim. All21 reviewed paths match that joined owner closure.
No new runtime measurement is applicable to this documentation-only peer review; no native/browser/shared/generation/instrumentation build or test was run. ROOT's release adoption remains separate.
Source/blob maps and scoped diffs: `C:/Sandbox/build/codex_ecs_20261122/L1/retained_owner_review_31102b64/`; owner raw evidence remains `build/d2_ecs/retained_sources_d6f7031d/` on Deck, referenced by the committed journal/D2 audit, not independently replayed here.
