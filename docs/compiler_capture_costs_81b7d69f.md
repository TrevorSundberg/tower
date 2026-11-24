# Capture traversal versus structural preparation

No optimization ships. Temporary Tower observations are removed; all frozen input hashes and the ordinary profiler binary are restored exactly. No completed-prefix cursor, registration guard, claim-loop or block-copy experiment was adopted.
Freeze `81b7d69f47f5b0c3d83d0096cc5a05747df25935`, tree `9f6f4c99939d329a22a2d33e5a7dc263dd54a886`; public/default compiler `44ae8f731d8991e5cd063e86512923ac5f9c1bd151943c8f235ee4025de11c44`, no override. Current source differs from [the earlier grouped receipt](compiler_lowering_coordinator_e3958206.md); its 114/198ms is historical, not this baseline.
KinmenA Linux/WSL2, LLVM19.1.1 Release, CPU0-11/24GiB, one `/cache/native` build family, outer4/compiler1, production allocator. Existing `tower-frontend-units-profile /work/scaffolding 1 WORKERS BODIES dependencies uniform [grammar] artifacts DIR`; bodies16/4096, workers1/4, target8/revision81/profile19, unchanged1.25GiB world budget.
Baseline/final ELF SHA256 `67a5b2fb156a5c059cb2cf2a83df0d1292e5859b50b97779686963ed79f3d694`; census `91410273e7e6d24213d7289c2d819e1bf07374d06cf6dcf298f72c917e7e0dba`; refined spans `fa45a50187954cb561360e76f715a71b594b9a30418bc8f2d2cc5bd246db494b`.
Inputs retain the earlier exact bytes: small1559B/d7450496, large347291B/60ffa292, imported333B/f5643e35; complete canonical20738B/76849f7e and4984138B/79b43b59. Full SHA256 manifests and byte comparisons are retained, not just these prefixes.
Coordinator-only GrammarObserver callbacks surround `sem_capture_ranges`, component admission, stage opening and leases. First census uses a private world-ID vector; refined spans time contiguous traversal segments between mutations, with counters aggregated per job. Workers never write these counters; existing ordinal-private kernel observations still measure real overlap.

| Work, identical at workers1/4 | Small16 | Large4096 |
| --- | ---: | ---: |
| Lowering jobs / bounded windows |25 /1|4105 /17|
| Pending pops / appended edges, including null |2997 /2972|688437 /684332|
| Distinct live nodes / same-job revisits / cross-job revisits |497 /0 /0|110657 /0 /0|
| Null entries / capture initializers / newly added capture components |2500 /35 /35|577780 /8195 /8195|
| Stage opens / capture leases / function leases |25 /35 /25|4105 /8195 /4105|

| Refined large coordinator span | Serial wall / CPU ms | Four wall / CPU ms |
| --- | ---: | ---: |
| Pending traversal, lookup, initializer predicate and edge pushes |64.188 /59.116|64.400 /59.321|
| Capture component lookup/admission, inclusive of allocation |79.473 /76.182|88.262 /84.933|
| Component-add subset of preceding row; do not add again |71.928 /68.497|80.720 /77.313|
| Capture leases / function leases |7.682 /4.376;3.861 /2.235|8.163 /4.635;3.818 /2.200|
| Stage opening / capture-kind setup |27.711 /25.541;3.324 /1.659|88.387 /86.232;3.367 /1.668|

Capture-range inclusive wall159.568/169.084ms contains traversal, admission, capture leases, kind setup and observation. Small corresponding traversal/admission/stage-open wall .091/.071/.022ms serial and .095/.075/.021ms four. These spans do not establish unobserved exact costs; no overlapping inclusive phases are subtracted or summed into idle time.
The first per-node-clock census is deliberately retained but unsuitable for throughput attribution: large serial frontend2.697255s versus unchanged coarse-observer2.047274s (+649.981ms), ID buffers9,464,688/9,477,984B outside compiler grants. Refined census-free spans reduce that matched difference to71.791ms (+3.51% wall;78.464ms/+3.95% CPU). Ordinary unobserved baseline1.827986s and same-ELF restoration control1.915678s expose n1 host/order variability; this is no performance improvement claim.

| Bodies/workers | Ordinary -> refined frontend wall / CPU s | Ordinary -> refined whole-process wall / CPU s | Peak RSS KiB |
| --- | --- | --- | --- |
|16/1|.356240/.305464 -> .370220/.318482|.404834/.337320 -> .422368/.350592|160620 ->160968|
|16/4|.425786/.408038 -> .452959/.436305|.476158/.440597 -> .505992/.469409|165332 ->166124|
|4096/1|1.827986/1.777922 ->2.119065/2.064808|2.180803/2.091283 ->2.491019/2.395437|680496 ->680628|
|4096/4|1.829478/2.552076 ->2.008267/2.783321|2.208698/2.890188 ->2.399448/3.133189|686740 ->686132|

Retained bytes/grants match ordinary/refined exactly: small1/4 16,868,837/13,165 and16,866,013/13,166; large474,003,810/285,548 and474,000,986/285,549. Charged peaks small95,132,531/95,080,427B unchanged; large554,185,795/554,148,515 ->554,185,811/554,148,227B. Ledger metadata5/20MiB separate; observer buffers are not policy charges. Joined lanes0; checked close drains pools/worlds and budget disposal requires final zero bytes/grants/lanes.
All14 processes pass exact42/42 reference execution and complete source/import/Foundation equality: four ordinary, four intrusive census, four refined, one ordinary coarse control and one restored ordinary control. Refined serial/four records actual1/4 threads and peak1/4; large312 semantic dispatches are not17 lowering windows. Large four dispatch wall331.262ms, interval union319.539ms, admitted-lane integral1317.804ms, kernel CPU1074.355ms remain different quantities, not evidence of whole-compiler speedup or race freedom.
Disposition: no repeated live-node discovery occurs in these workloads. Read-only discovery is separable after body/KnownSnapshot/AggregatePrepare completion and exact ticket/body selection, but structural capture attachment and leases must remain coordinated before dispatch. The measured parallel-run preparation increase is chiefly stage opening (store-buffer allocation/anchor retain), not traversal. This does not establish an unavoidable allocator cost or justify a parallel prepass/cache.
One unimplemented follow-up: add an explicit skip-empty edge policy in `semantic_known_bindings:sem_known_edges`, enabled only by `semantic_capture_work:sem_capture_ranges`. It would remove577780 empty pushes/pops/null lookups (83.93% of pops), preserving live edge order, typed failure and non-null admission. Keep other callers unchanged: `semantic_known_work` derives capture ordinals from queue positions; `sem_known_inputs` preserves lazy arms; `sem_lift_self_reference` has its own contract. Do not globally alter `sem_push_checked`. Existing `sem_publish_push` already demonstrates null-free traversal, but its deduplication/index policy is not proposed here. Expected work removal is not a speedup estimate; a separate matched experiment and capture/order/denial controls would decide adoption.
Restoration verifies all baseline source hashes and byte-identical ELF after the necessary target rebuild23.003wall/36.945CPU/892436KiB. Initial/refined target builds20.801/23.878wall,16.047/37.423CPU; all build/profile exits0. Raw path-read/glob mistakes are transport diagnostics, not compiler failures. No other tests, optimization experiment, generation/browser/instrumentation/deployment operation; four stashes/todo intact and jobs drained.
Raw scripts, both temporary Tower source/patch sets, full command/tool/input/binary manifests,14 JSON/time/status logs, artifacts and cgroup observations: `C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/capture_costs_81b7d69f`. Final source identity stays frozen through publication; ROOT owns release and later producer adoption.

Integration: receipt1ee99c55 preserves complete publishedf10d3637 through merge5aa739c1d4d3795edda483982d29f8292917a6a0. All compiler/library/profile/build source blobs remain identical to81b7d69f; ROOT's new public31a385c6/6c83 pin and its runtime provenance comments are preserved, separately validated by ROOT, and excluded from these public44ae-built measurements. No rebuild/profile repeats after repin. Observation/build-family cgroup peak1,570,070,528B, all limit/OOM events0; final disk335.50GB.
