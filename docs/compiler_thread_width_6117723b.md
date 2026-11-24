# Higher-width production-allocator TSan gate — frozen 6117723b

**PASS: six selected / six executed / six exit0; no findings, failures, skips or unstarted cases.** This closes the requested8/12-width slice, not universal race freedom.
Compiler source `6117723b22b019e48938927ad22ce3ea8f643c63`, tree `69baf4529875dce04645e80af1a877aac85eb0e0`; checkout `a0255427` differs only outside compiler/fixture/build/bootstrap inputs. Complete source/resource hashes checked before/after; no production/test change.
Public/default31a SHA256 `31a385c616b889987d68f8eb9714020f3928aac97591a1569f905ab706f52ed6`; unchanged instrumenter/runtime/transport/sensitivity hashes reuse the accepted real-race proof. No negative repeat, private override, security change or vendor build.
One dependency-aware `tower-frontend-units-profile` build in the existing TSan cache:3 actions,5.04wall/3.40CPU seconds,237520KiB peak RSS. Only the existing profile entry was new;28 shared linked objects are byte-identical to the [accepted final syntax proof](compiler_thread_syntax_delta_6117723b.md).
Actual link29 Tower objects:26 with access hooks; three no-access registry/allocation/legacy forwarding units with initialization. Every actual object belongs to the116-row configured inventory; archive members match their objects. Profile IR contains71 instrumented definitions; the ELF initializes TSan and exports actual `work_thread_entry`.
ELF SHA256 `71431527e435cef626ced167c8f7e3e47cafb2f5df11e74e9f5610c21cd5f609`; raw proof carries source/original-IR/instrumented-IR/object/archive/tool hashes and actual link commands, not merely CXX flags.
Unprivileged Orchestral-Revng WSL2, LLVM19.1.1, Ryzen5900HX; CPU4–15 = physical cores2–7 with both SMT siblings, twelve logical CPUs. One compile process at a time,6GiB resident/swap0, unlimited virtual addresses; shared host, no isolation/speedup claim.
Exact [73cc82ab shapes](compiler_combined_performance_73cc82ab.md): single1×4096 and multi12×256, dependencies+uniform, target64/backend0, n1 each at workers1/8/12. Generator/helper blobs unchanged; existing `grammar` observer supplies joined production-worker intervals. No new harness/model.
Each process retains the300s outer guard, original world/semantic byte limits, grains, internal guards and execution/canonical/cleanup assertions. Line-buffered output, start/end timestamps and sampled actual child CPU/RSS preserve observable activity; completed observer spans establish phases, not silent stderr.

| Shape/workers | Exit | Whole-process wall s | CPU s | Peak RSS KiB | Actual distinct threads / peak overlap |
|---|---:|---:|---:|---:|---:|
| single/1 |0|41.00|40.87|2453820|1 /1|
| single/8 |0|39.99|55.18|2478212|8 /8|
| single/12 |0|40.04|63.28|2483872|12 /12|
| multi/1 |0|106.71|105.97|2410408|1 /1|
| multi/8 |0|39.03|201.47|4328456|8 /8|
| multi/12 |0|38.26|316.43|5845180|12 /12|

Single counts are semantic-dispatch intervals (312 waves each), not its one outer unit. Multi counts are distinct outer-unit threads and overlapping spans; per-world nested peaks are not added to outer peaks. Every shared reserved-lane peak equals its requested1/8/12 limit; every post-join used-lane count is0. Existing semantic observer checks each kernel against its admitted lane ceiling.
Each unit independently executes staged/imported `answer()` and ordinary loop `body_0(36)` to42:78 checked results across the six processes. Full source/import/canonical files compare byte-for-byte across widths; their hashes also exactly match the preserved73cc82ab ordinary reference manifests, not just a numeric digest.
Single source347291B/import333B/canonical4984138B; multi has12 sources21635B and12 canonicals305328B plus the same333B import. All84 retained artifacts are complete; no truncation, altered source, skipped export/mode or optimization substitution.
Single charged peak538340912/538303216/538303168B; multi564387948/853832156/1302904110B (1/8/12). Per-case retained bytes/grants, entities/components, ledger storage and inclusive phase costs are in `summary.csv`/original JSON. Pre-close retained graphs are live outputs, not claimed zero counters.
Existing lexical close cancels/drains work, closes the pool, releases stages/programs/modules/worlds, and requires successful world/borrow disposal and `work_budget_dispose` with live grants0. All six exits pass those finalizers; no invented post-close RSS-zero/global allocator claim. Stage/lease contracts and source-ordered publication remain unchanged.
Run scope peak6109188096B under6442450944B; swap/max/OOM events0. This cgroup charge is separate from per-child GNU-time RSS. Source/object/ELF/sensitivity hashes rechecked after all runs; no remaining owned scope/process. Validation costs include observer, checking, formatting and teardown; instrumented times are never speedup denominators.
The accepted [10-suite matrix](compiler_thread_integrated_fca5df98.md) and [five611 syntax/query registrations](compiler_thread_syntax_delta_6117723b.md) are preserved without reruns. This is additional native production-allocator width evidence; serial fault tests are not substituted for overlap.
No scoped repair, cap/deadline adjustment or external blocker was needed. Unsupported source-language UBSan/hosts, foreign/prebuilt LLVM code, browser/package/generation/hosted release and all possible schedules remain outside this proof; ROOT owns final integration/publication.
Raw evidence: `C:/Sandbox/build/codex_ecs_20261122/L2/thread_width_6117723b/`; complete artifacts: `/home/revng/.cache/tower/l2_thread_c8555971/width_6117723b/`. Frozen611 validation is retained through Git-equal documentation-only reconciliation.
