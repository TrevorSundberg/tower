# Optimized entity-pages pointer comparison repair

Frozen base: `6e8001fd9aaf2fa8be550fb70d4f9e052ec93fc8`; Linux/WSL Ubuntu 24, LLVM 19.1.1, Ryzen 5900HX, CPU 0–3, 24 GiB scope, existing public-bootstrap native cache. No reactor/generation rebuild.
Evidence directory: `C:/Sandbox/build/codex_ecs_20261122/L1/entity_pages_optimized_6e8001fd` (`E` below); original ROOT snapshot remains unchanged.
Exact input: `ROOT_wasm_t2_a06_a1/entity_pages.artifacts/entity_pages_32_canonical.tower`, 972596 bytes, SHA256 `403fdc6b0b6c9cd38cbf4e9c6b20858e1cb0c64a8d3342d91f54c72501807e2e`.

## Reproduction and repair

A1's browser failure remains offset 1290736. Native equivalent optimized32 reproduced the integer-operands diagnostic at offset 1305711, with no published candidate and zero final bytes/grants/lanes. These offsets are not original-input byte locations.
Captured private candidate `E/failed32_candidate.tower` (1327274 bytes, SHA256 `1e89ae940e88b07374d5220c1dee67d4ef81d3f721137ce1e4b29feea459e8ce`) fails at 52067:14: `v28876 = v28874 > argument339`, both operands `u8*`.
The operation belongs to `entity_stage_references_record_result`: source compares explicit `usize` addresses; LLVM O2 folds them to `%.not209 = icmp ugt ptr %15, %1` at optimized IR line 12835.
`import_values::bi_compare` now reconstructs ordered pointer predicates through explicit target-width integer bit casts, then existing integer comparison handling. Pointer equality and language admission remain unchanged; no layout/ABI/evaluator change.
This is distinct from D1's multiply-overflow helper: the captured IR contains an i32 overflow call, no i1 intrinsic, and the invalid operation is pointer ordering. `import_instructions.tower` and A2's `backend_source_native.tower` remain untouched.
Diagnostic capture was temporary, restored before validation; its exact patch is retained in `E/native_candidate_capture.patch`. The original source-session provider hash is preserved in `E/inputs.sha256`.

## Focused validation

Eight CTests passed: existing source-worlds/recheck, four optimized pointer-order imports (32/64 × workers 1/4), two canonical execution registrations. Logs: `E/focused_full.log`, `E/canonical_registration_full.log`.
Six direct execution selections (reduced source/reconstructed32/64; exact large source/reconstructed32) each run Graph/Fast × workers1/4: 24 trials, literal output `0\n`, canonical equality and final world-budget bytes/grants/lanes zero.
The new Tower fixture checks all six comparison predicates, unsigned high-bit addresses, null/equality and left-to-right effects. The runner reuses the existing bounded execution trial, adding an explicit fuel parameter while retaining existing callers' limit.
Large optimized32 output is byte-identical for workers1/4; LLVM is unchanged before/after: SHA256 `d33c3ca2071793d662b4c83dae39649bd7987d01fd57f7a248e32bfa975a7149`. Fixed Foundation: 1327388 bytes, SHA256 `57d665114dd154d942100adff395de01f65a535aa16f507cab3394585f291d96`.
Existing `backend-ir` passed exact serial/parallel objects, references/types/globals, optimization, error and cancellation assertions. Invalid ordinary pointer ordering still fails at 3:19 under both target widths; no language widening.
Reconstruction trials end at zero bytes/grants/lanes; large peak ledger before/after is 555188690/555803954 bytes (one worker), 555187914/555803178 (four). Ledger metadata retained before disposal is 41943040 bytes.

| Matched run (one sample) | Before wall / CPU s / peak KiB | After wall / CPU s / peak KiB |
| --- | --- | --- |
| Exact large32, worker1 | 3.97 / 3.91 / 704924, failed | 4.07 / 3.89 / 705408, passed |
| Exact large32, workers4 | 3.32 / 4.08 / 724616, failed | 3.58 / 4.47 / 727616, passed |
| Healthy reconstruction, worker1 | .57 / .51 / 179264 | .55 / .50 / 179424 |
| Healthy reconstruction, workers4 | .65 / .63 / 182520 | .64 / .64 / 182792 |

GNU time includes child CPU; peak RSS is maximum child usage, not simultaneous process-tree sum. Healthy canonical bytes match. Failure-to-success costs and one healthy sample establish no speedup/scaling claim. Six import CTests cost 3.45 wall/3.20 CPU s/183684 KiB; two execution CTests 2.43/2.18/192164. Large reconstructed direct Graph/Fast selection costs 9.86/10.92/748872.
Current backend runner SHA256 `86920f75e01c146281d30bc6e3f0a90e12b4d4aa5b7e82763030c8566b47bb52`; execution runner `6b7da1445443afb3680b7fd75f690c4d1321f418c70f9b4dff5302f4c65f2813`. Complete selected source/binary identities: `E/final_artifacts.sha256`, `E/repair_inputs.sha256`, `E/final_sources.sha256`.

## Preserved failures and limits

All failed logs remain in E: unsupported bootstrap linker-wrap option, initial unsupported `sizeof(data)` fixture, missing explicit test import, disallowed mutable library-global fuel experiment, and old-CLI Fast check. Capture hook, linker option and global mutation were removed; supported fixture syntax and explicit fuel replaced those drafts.
An extra CLI Fast invocation on already reconstructed large text performs a **second LLVM normalization**, unlike the requested direct portable-style Fast execution. It still fails `Unsupported LLVM value in foundation return path` at 53277:5. Exact input is fixed Foundation above; `E/second_normalization_capture.*` and `E/second_normalization.ll` (SHA256 `16f262b0a661bc013a1109651e8e1d40b50770d45856d03610a2407766308c71`) preserve this separate ROOT/L2 follow-up.
Direct canonical Fast passes; no second-normalization success is claimed. Full browser T2 adoption, large64/executable phases, sanitizer/generation/release acceptance remain ROOT-owned and unrun here. No pin or deployment.

Final integration: implementation `015aa9ed` merged complete published `e330a2c9` as `e480b8bee15c4323f93ab711d887704c7e1bcb59`, including D1's separate overflow repair and L2's lowering admission change. One seven-action dependency refresh (38.66 wall/57.85 CPU s/1075420 KiB) and the same eight CTests passed (5.99/5.49/192156), followed by exact large32 imports1/4, reduced rebuilt32/64 and large source/rebuilt direct Graph/Fast1/4, and backend-ir. Corrected Foundation/LLVM hashes stayed identical; all final owners zero. Merged large imports cost 4.10/4.07/705852 and 3.17/3.96/727820; these are integration costs, not a new matched benchmark. `E/merged_source.txt`, `E/merged_artifacts.sha256`, `E/merged_*.{out,err,time,exit}` preserve the final source/binary boundary; unrelated incoming platform/deflate changes have no new acceptance claim here.
