# Signed-pointer finalization and edited browser generations

L1, 2026-11-24. Native freeze: `8771b9490186d501cf11110f0eea519d733811b1`, including D1 publication `a80a766f`.
Fixture SHA256: `ebc5f0a2d433806b1adc09ce72c27e6bee24cd237774680a9c15a43f770323e7`.
Public bootstrap: `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`; no private override.
Ubuntu24/LLVM19, existing L1 native cache, CPU0–3, four build jobs, 24GiB scope; inputs drained before mutation.
One execution-target dependency refresh: 47.65s wall/121.90s CPU/1076212KiB peak child RSS.
Only `^tower-signed-pointer-order-(4|8)$`: 2/2 PASS, 2.27s wall/1.77s CPU/137328KiB peak RSS.
Each width retains eight literal signed/unsigned/equality rows, effect order, Graph/Fast1/4, canonical equality, ordinary pointer rejection and zero final owners.
Private Tower control borrows the deliberately `255,0`-tailed buffer without calling `format_storage_finish`; the new assertion rejects before `strlen`.
Exact diagnostic: `Signed pointer terminated text transfers its receipt`; actual exit134, 0.07s wall/0.01s CPU/60912KiB RSS, under30s guard.
This expected assertion abort proves the boundary guard, not graceful negative-path ownership cleanup. Core dumps were disabled.
Negative/restored leaf rebuilds: 15.07/14.93s wall, 10.47/10.47s CPU, 512768/512612KiB peak child RSS; no duplicate public-leaf build.
Exact published fixture restored; 2/2 CTests PASS again, 2.02s wall/1.60s CPU/137436KiB RSS.
Initial/restored executable SHA256 identical: `ff1c261e57717269d2347960d2e9203dd698e06c156291fe4966149ad305b032`.
D1's interrupted build is not counted. Production `bi_compare` and all Tower sources remain unchanged.

Browser project source: `59d7dc9e995b16c785b01f40f340374dc4c73d18`; all32 immutable bundle files/165218603B verified before install and after execution; all32 previous d962 files preserved.
Initial portable SHA256: `01bf3381b75626eee78b03e9652d8ee62c400614997d29863267ef7cc01c05b1`.
Initial LLVM SHA256: `95fc948adc9b5b9a36d90d6e9ccd22aeb9be40dc8ca8dd78410c58bfe505690c`.
Initial cross SHA256: `207e0f214dfa619e97a48d8bd5b49e6d3bf3c2a66729254b75dc4386b1681061`; project `dc825b46478e1895168296139b19ae6e96a0e941703e6b98670f3b1cca40196d`.
Host freeze is8771 plus this receipt's artifact-retention patch; all62 host `.mjs` hashes match before/after, distinct from compiled59d7 sources.
The existing script now saves edited inputs, candidate reactors, responses, timing records and worker exits through an optional OS artifact callback; candidate checks/adoption/hash comparison are unchanged.
Command: Node22.23.5 `--max-old-space-size=4096 playground/scripts/test-compiler-project.mjs`; only workbench location overridden, default installed project/provider used.
CPU0–3, 24GiB job limit, original600s outer guard; exit0, guard not reached, stderr empty, no skipped/unstarted generation.
Gen1/Gen2 compile24 units each with2/4 workers; 86.594/80.871s, actual compile-interval overlaps2/4; all2/4 workers exited before adoption.
Both execute `Compiler project generation says: null requires a pointer or function type`, offset31; Gen1's edited LLVM builds Gen2.
Both pass existing parser, module/visibility, completion/hover, C/Roku, Graph/Fast, raw/optimized Foundation/package, LLVM execution and native cross-object checks.
All24 object files and all3 complete reactor bytes agree across generations; six reactor files retained, without normalization.
Both portable: 1672255B, SHA256 `6081ff171e12df0c2c17d4aa83a18c1727e240b6e18a630284d57219a897b15d`.
Both LLVM: 35456340B, SHA256 `aee6c80d0077ea49da02830a6d1031c2a606b6300107a16136f4f8dd89e35bb5`.
Both cross: 56609224B, SHA256 `e27b72cdef28010e540d507670e4eecdee3b525bcf17321ec2fb060e813d4f4d`.
Actual Node PID17148 including worker threads: 168.070s wall/471.391s CPU/2133852160B retained-handle peak working set; job peak commit2950320128B; final active processes0.
These are validation costs, not a speedup claim: different predecessor compilers/workers and added evidence I/O. No separate Wasm capacity/live-grant or graphical-browser/isolation measurement; no injected cancellation campaign.
Raw commands, initial/installed/host/output manifests, private negative, failure logs, times and process accounting: `C:/Sandbox/build/codex_ecs_20261122/L1/signed_finish_generations_59d7dc9e/`.
Both successors/objects/edited sources/responses: `C:/Sandbox/tower-agent-1/build/l1_generations_59d7dc9e/`; initial immutable inputs remain in `ROOT_browser_inputs_59d7dc9e`.
Old9d generation receipts remain historical; no reactor rebuild, native full-generation, browser matrix, sanitizer, deployment or pin adoption. ROOT owns final release and later-source acceptance.
