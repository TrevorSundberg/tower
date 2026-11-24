# A2: second optimized Foundation constant-address reconstruction

Receipt root `E = C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/second_normalization_e330a2c9`.
Baseline authored source `e330a2c9f27f53a077dcf500519fd2df9c287355`; joined validation base `289185f25b0d08614ef3cb40b4c4635d57d2fc8d` plus this patch. The latter includes L1's separate pointer-order fix and other owners' storage changes; those gains are not attributed to this fix.
Host: KinmenA Windows11/Docker Linux x64 LLVM19, production allocator, CPU0–11/24GiB, one existing A2 native cache. Public `768a0cdf` bootstrap; no private compiler adoption.
Immutable ROOT input: `after_large1.tower`,1327388B,SHA256 `57d665114dd154d942100adff395de01f65a535aa16f507cab3394585f291d96`; IR608571B,SHA256 `16f262b0a661bc013a1109651e8e1d40b50770d45856d03610a2407766308c71`. All three original files remain untouched; `E/inputs_and_outputs.sha256` includes the exact error file.

## Actual cause and repair

Temporary Tower observation at `import_values::bi_value` captures LLVMValueKind10(ConstantExpr), opcode8(Add), integer type8/i32, two operands: `i32 add (i32 ptrtoint (ptr @tower.global.storage361 to i32), i32 38)`.
Its user is the first terminating-byte store in LLVM `tower_main`, IR line74. The displayed source return/offset is not the rejected operand. Native reproduces the exact ROOT IR hash before any repair.
The reduced ordinary `backend_constant_address.tower` additionally produces opcode10(Sub): `(ptrtoint(storage)+4)-1`. Both are supported integer operations represented as LLVM constants rather than instructions; see [LLVM19 constant expressions](https://releases.llvm.org/19.1.0/docs/LangRef.html#constant-expressions).
`bi_value` now reconstructs only this demonstrated add/sub pair through existing `bi_binary(OAdd/OSub)` and `bi_mask`, retaining target width, ordinary binding/address identity and the existing private publication stage. No evaluator, zero substitute, layout or language-admission change; L1's `bi_compare` remains intact.
The observation is removed; `E/diagnostic.patch`, `before_large.*`, `before_reduced.*` retain it and both failures. The initial OS measurement launch failed because it requires an absolute executable path; its logs remain separate. The intermediate add-only candidate and pre-L1 pointer recheck failures remain failures.

## Checked closure

11/11 focused CTests pass: four constant-address imports (32/64, workers1/4), two source Graph/Fast registrations, four L1 pointer imports and existing source-worlds coverage. `E/focused.log` records every registration; no skips.
Each new import runs two verifier-valid block-address rejection controls: exact unsupported diagnostic versus an earlier diagnostic/offset, resourceNone, unchanged node/component counts and no published output. Successful import then proves the same world remains usable. Final bytes/grants/lanes are zero.
24 direct Graph/Fast configurations pass with output `0\n`, canonical equality and zero owners: reduced source and reconstructed text at32/64×workers1/4×engines2, plus exact large source and reconstructed32×workers1/4×engines2. Raw `reduced_execute_*`, `input_execute.*`, `joined_large_w1_execute.*` supplement the two execution CTests.
Exact large optimized reconstruction passes workers1/4 and canonical recheck, yielding identical1235722B, SHA256 `173b21316757cb94ed4d3d66e93c92abc698ca4b3f419b9d39647f0dc3016244`. Peak charged bytes647017515/647016571; final bytes/grants/lanes0; ledger metadata20971520B before disposal.
The original CLI command (`--target wasm32-unknown-unknown --interpret-fast --optimized-ir`, exact input) also passes jobs1/4 with output0. Its second-normalization LLVM remains byte-identical to ROOT's retained IR. This is distinct from merely executing the first reconstructed text.
Commands: `E/{baseline_v2,candidate,candidate_v2,joined,paired}.sh`; exit files and per-process `.time`/`.log` are preserved. `joined_link_commands.txt`, `joined_provider_sources.sha256` and `joined_artifacts.sha256` identify actual compiled/link inputs.
Joined binaries SHA256: source probe `6d59b3d1ec6cb351adb98bab5c0a6de22830f511746ad7ecc8fea14294cd22a7`; execution runner `ff5288a237fc4014d40af6e6d31be3db6050308415af75b280e07decb12808c3`; CLI `51fb9ad9161293b0d406b10fc185603de7763d654c252d46a81b562e5eb9a4a9`.

## Costs and limits

| Request | Wall / CPU seconds / peak RSS KiB |
| --- | --- |
| Exact baseline, failed | 2.487 / 2.412 / 734388 |
| Joined exact reconstruction, workers1 /4 | 4.020 /3.937 /772716; 3.334 /4.323 /784528 |
| Joined CLI second normalization, jobs1 /4 | 3.955 /3.870 /755632; 3.325 /4.198 /768796 |
| Healthy e330 frozen n3 mean, worker1 before→after | .4402→.4437 / .3736→.3768 /178505→178628 |
| Healthy e330 paired n3 mean, workers4 before→after | .5410→.5153 / .5100→.4877 /181741→181768 |

Healthy source/output hashes and peak charged bytes98280252(serial)/98228148(four) are unchanged. The first unpaired four-worker after-run took .707s versus .502/.506s subsequently; its mean+11.4% remains in `after_w4_*`. The bounded alternating repeat uses the saved before/after e330 executables, isolating this patch from later storage changes; it establishes no repeatable regression or speedup claim.
`ecs_process_profile` measures the bounded process and waited children; RSS is maximum child usage, not simultaneous process-tree sum. LLVM/allocator internals are outside the world ledger. Focused CTests cost6.692wall/5.629CPU/187512KiB; direct large source/result execution cost7.497/8.408/687116 and6.741/7.591/647768. Failure→success is not a speedup comparison.
No reactor, Wasm, generation, deployment or instrumentation run; final artifact adoption and integrated release remain ROOT. The exact large input is wasm32; reduced32/64 coverage does not claim this large input's64-bit portability or universal race freedom. The separate service-blocked instrumentation gate stays open.
The three old stashes plus pull-conflict autostash `e9f023f0385975b5102e0309d8e308ac2706dca2` are retained. The CMake conflict preserved both owners' registrations; final publication integration is recorded once in A2 status.
