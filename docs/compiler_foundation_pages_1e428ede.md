# Foundation private-stage pages: accepted memory tradeoff

Freeze `1e428ede6c33cba159b753247affd8d5cf3ed67d`, tree `6208be72f7957a47eb7cde6229a6fe52f5e963e6`; production delta is Foundation-only immutable four-row stage registration in `compiler/world.tower`, through existing checked Entity storage. Dense new store pages, ParserMatch, layouts, stable payloads and publication ownership are unchanged. Registration propagates its exact typed error.
Request: 972596B, SHA256 `403fdc6b0b6c9cd38cbf4e9c6b20858e1cb0c64a8d3342d91f54c72501807e2e`; regenerated with supplied a06 portable bytes, exactly matching ROOT's newer request, not relabeled as A2's older 965691B request.
All large outputs: 4709291B, SHA256 `452132b90d4a73b43ec3f19153d8b344b201955640c7e6fd0a97203f2d858218`, identical to ROOT. Small518B input SHA256 `d08c3db30ab1ef78e6a1e9f16ed65f54e08c15cf97a4cdee2642f755500775f2`; output58057B SHA256 `45f35d6fd27696d04461a44a0f22cdee93eecfe397d16c1b951147557607aca4`.
Native before/after probe SHA256: `c898852468e6d82dec91374af8a4bfcdb5b9e181081c100e29c32e812b2f58ff` / `19ad5ce98632e2cde02c8dca473a8053ee5c2b3ce23e664a1f78482f445a2ad4`.
KinmenB Linux x64, Clang/LLVM19.1.1 Release, public768 predecessor, override unset, CPU0–11/24GiB; native probe targets wasm32, unoptimized reconstruction. Same frozen resources/runtime/path, production allocator and existing semaphore budget gate on both sides. Dependency-aware baseline/candidate builds: 18.23/16.61s wall, max6 object jobs/compilerjobs1; no reactor rebuild.

At recheck semantic-dispose entry, before: 21017 never-filled Foundation pages contain28715 rows; `used == live` on all pages, so deletion did not cause current slack. Fill-first coordinator allocation permits at most one never-filled store-origin page. Thus at least21016 are private-stage-origin. Declaration/body/generic/execution/lowering query stages independently allocate and publish stable pages; transfer does not compact them.
After: 128650 four-row pages contain452105 rows;19 ordinary forty-row pages contain730. The existing generic policy applies only when allocating a new private page; published small pages remain reusable without moving payloads.

| Joined recheck census | Before | Four-row policy |
| --- | ---: | ---: |
| Foundation live rows / payload bytes |452835 /155775240|452835 /155775240|
| Foundation page allocations / slots |31620 /1264800|128669 /515360|
| Foundation charged physical page bytes / occupancy |513224220 /35.80%|235866539 /87.87%|
| Checked live bytes / live grants |2735963879 /2680340|2458606198 /2777389|
| Peak charged bytes / retained ledger metadata |2743902878 /167772160|2466545197 /167772160|

Savings277357681B exactly match the Foundation page delta and serial peak-budget delta. ParserMatch stays3015445 rows/3015488 slots,47117 pages/348618683B (99.9986% occupied). Counts are live physical page allocations/grants, not total process allocation calls. LLVM/libc storage and allocator fragmentation remain outside this ledger; native bytes are not Wasm bytes.
Existing sparse phase observer, optional census off; n2 fresh processes/warm filesystem, before→after then after→before, both workers1/4. Table gives two-sample means, whole process CPU=user+system and peak RSS KiB; all16 exact outputs/resource0/final bytes-grants-lanes0 pass.

| Request / workers | Wall s before→after | CPU s before→after | Peak RSS KiB before→after |
| --- | ---: | ---: | ---: |
| Small /1 |0.525→0.520|0.450→0.450|178068→178306|
| Small /4 |0.585→0.580|0.560→0.550|183292→183178|
| Large /1 |10.695→10.985|10.590→10.885|2951516→2829014|
| Large /4 |9.445→9.250|12.495→12.255|2962336→2837606|

Accepted for54.04% less Foundation page storage,10.11% less peak charged storage and~4.2% less RSS. Serial large wall/CPU increase2.7%/2.8%; raw pairs11.05→10.99 and10.34→10.98 retain that variability. Four-worker wall decreases2.1%; no general throughput claim. Page count increases4.07x and live grants3.62%; ledger metadata unchanged. This is a measured memory/time tradeoff, not a speedup or full-core completion.
PASS: component layout, page reuse, component budget, stage-result and real concurrent stage publication/cancellation; exact recheck Capacity/rollback/retry; grammar-resource including new Foundation policy/duplicate-registration/world tests and existing physical Memory denial. Six CTests plus focused grammar-resource. Actual entities nm policy passes unchanged; registration provider is defined in that same unit, no new production foreign import.
Optional allocation-free census adds capacity/high-water counts only at joined boundaries; both census outputs also equal the reference. No new storage framework, parser policy, budget bypass or semantic method change.
Preserved failures: unavailable remote evidence path; initial JS transport incorrectly expected Foundation's result to have a status field, then corrected to its existing source contract and exact request hash. No compiler/test failure. No optimized pointer-defect workaround or assertion weakening.
Remaining gates: ROOT's integrated Wasm execution/optimized reconstruction, generations, sanitizers and release; none claimed here. Small canonical/reconstruction controls pass; this probe does not execute emitted programs.
Raw: `C:/Sandbox/tower-agent-1/build/ecs_b1/cache/foundation_pages_1e428ede` (`timings.txt`, every output/log/time, `*_census.log`, source/patch/provider manifests, before/after probes, commands/toolchain and focused/symbol logs). Scripts: `build/ecs_b1/foundation_{baseline,candidate,checks,measure,metadata}.sh`; request transport `foundation_request.mjs`. Prior failed LR candidates and todo remain intact.
