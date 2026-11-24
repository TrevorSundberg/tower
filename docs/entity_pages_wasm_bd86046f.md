# Current entity_pages actual-Wasm acceptance

PASS: unchanged semantic-port/T2 selection, one test/pass1, fail/skip/cancel0, actual exit0; all42 phase records (40 work boundaries, complete, released),14 literal-output assertions and0 unstarted phases.
Compiled bundle source `bd86046fa3c1c3ce76854bbc2330a8d0c04a02df`; mounted host/tests/resources `3e747b5123d5cb8e5d26256707950f57588a0701`, tree `43d3b77e7940e73c8073c2585c67626c104f40de`.
Portable1670512B SHA256 `8558a47bd285716a1a5fb67d0ece0419585ab57f23eb8da056c055c91a15a32f`; LLVM35425351B `cdee3aaafd0b2ad14bf59d1b5f67d78a4b31cf6f26bafcbdd446b97bf228fa22`.
ROOT's immutable24-file163932330B bundle manifest SHA256 `c43893d91f2fc719c7a98f7b03af68b3c6d9da72077e55822142110c18391b31` verified before install and after drain; ROOT inputs untouched,24 replaced local ignored files preserved and reverified.
All1356 mounted Tower/host/test files and membership frozen;1240 Tower inputs match the exact nativebd860 manifest, and host/transport/source Git diff frombd860 is empty. Mounted before/after manifest SHA256 `10cc802f126374ec48e1afb2d5d10ee03654a005e5b66049b071720078731549`.
Existing Node22.23.5 x64/V8 on Windows, CPU0–3, one heavy family; shell defaultNode21 was not used. Original24GiB job cap/600s outer and test guards unchanged; artifact overrides cleared, matched default paths loaded.

```text
node --test --test-concurrency=1 --test-reporter=tap --test-timeout=600000 --test-name-pattern="^Tower entity_pages agrees across graph, fast, LLVM and Foundation text$" playground/tests/semantic-port.test.mjs
```

Original32/64 Graph/Fast:4 executions pass exact `0\n`; independent canonical parse/execute after each engine:4 outputs0 and4 full canonical equalities.
LLVM Foundation32/64, raw/optimized:4 reconstructions pass, each independently reparsed by the portable reactor, selected Fast and executed to exact0; no optimized path disabled.
Executable wasm32 source/canonical:2 complete compile/link/run controls pass exact0. Both49165B Wasm files retained, hashes `e58bf345bd954b654269d5f27c96db345ed9f0a947cc82e10aa9716cbd74a988` / `97cb8117f6d9c7abc69527c3f1f5b79167634a263d41f3ea0484a56bb2f96f49`.
Unchanged Tower assertions retain page/stage/pin/publication/discard behavior, finalizer counts200/441 and zero entity/component store counts; execution handles retire through existing finally blocks, then released phase and process-job active0.

Required native comparison: canonical32 exactly983366B/`47f43eaa4e547f5e83097c03597a22862b9d611b5ef73139fc748d650aca296c`; raw32 exactly4769423B/`a4e1eaaf5503f4f8596afe49352e74078f349938029b26f536833a0a32b51b46`; complete `fc /b` comparisons exit0.
Also byte-equal to native: canonical64 984102B/`3ea550244fa8c39b21c6da4f95910329b115bc396e9223cd45ca59494ded570a`; raw64 4783406B/`3aa17a1fda111e1dd0c444d3c963fff68b09b2d24d216970646bbd6c99219b25`.
Guest optimized Foundations retained separately:32 1295112B/`b5848fb563e7bffa9303c5b40aa2b26a5aa24be550471f652d72073e60e4b81c`;64 1282049B/`5fb991ec1b699cfe4cf788e564597912d127ac7c301447d8f6739eff748c69be`.
Those optimized bytes differ from the native provider's outputs; both independently pass the required semantics. Cross-host LLVM optimized-text identity is not an assertion of this gate; no cause is inferred or production change made.
Original native Capacity134 and older972596/4709291/a06 failures remain historical; no old passing request was substituted. No native phases, T8 views/registry, shared/generation or unrelated selections were rerun.

Actual child PID12904:191.897169wall/316.875000CPU seconds, peak working set2863439872B (2796328KiB), exit0. Parent15984 separately0.171875CPU/35590144B peak; parent-only costs are not used.
Whole Node job192.040598wall/317.046875CPU, sampled aggregate peakRSS2895085568B, peak committed4258553856B, total2processes/active0; original600s guard not hit.
Phase-observed portable linear capacity28704768→1342767104B; LLVM37027840→1343029248B. Capacity remains retained at released; it is not live payload, charged ownership, ledger metadata, process RSS or evidence of a leak.
This run exposes no compiler allocation-ledger census. Guest success is actual execution evidence, separately established from native2GiB world fit; no general leak/race/platform-fit or scaling/speedup claim.
Metrics use the existing ROOT `measure_node.ps1`, changed only to CPU0–3, explicit retained Node22 path and removal of obsolete reactor overrides. Retained handles measure actual child CPU/exit/OS peak;20ms aggregate sampling may miss brief peaks.

17 artifacts retained: source,2 canonicals,4 rebuilt Foundations,8 before/after LLVM IR files,2 executable Wasm; no error JSON. Full bytes precede hashes; `artifacts.json` SHA256 `dfc83f50cac6fb7ea1fbe4f22dfc321d8fa987c77e4813dd87dae1cd40864f42`.
`phases.json` SHA256 `49a0bc9bb4b2e814ccbdee1ab808d59419ed523696d023bda7127f26741f6626`; actual-child measurement `8c3a943e302b7fcec17453ef6a3cd239a4731db648546a06ea87027b126503ca`.
E: `C:/Sandbox/build/codex_ecs_20261122/L1/entity_pages_wasm_bd86046f/`: commands/meter/setup/postcheck, all input/output manifests, byte-comparison receipts, phase logs, child/job metrics and previous installed artifacts.
No compiler/reactor/vendor rebuild, cap/fuel/assertion change, new project logic, sanitizer or deployment. Runtime cost only; B2 shared/generations and ROOT final bundle/hosted adoption remain separate.
All owned processes drained and source/bundle/backups reverified before reconciliation; later producer changes are excluded from this frozen acceptance.
Integration: receipt `72cc18a4` joined published `66d15661` as `588532b2`; incoming scratch test/registration and target-pack producer changes are excluded. The19 selected Tower imports, transport and24 installed/ROOT bundle bytes remain exact (`merged_selected_inputs.json`); no runtime rerun or source relabeling.
