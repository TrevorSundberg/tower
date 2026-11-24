# Entity-pages input and admission-profile comparison

B1 source/artifact audit at `bb95346637a4de3c2e069845112b76e855a09c30`, tree `7577019e70a4894b97ac5a39d3812b97b0cf9674`; no compiler execution or production change.
Finding: the fixture is unchanged, but its imported Entity implementation changed. The old successful profiles do not establish acceptance of the current native 2 GiB execution reparse; neither harmless renaming nor a new memory regression is established by the byte difference alone.
All three delivered files were independently length/SHA256 verified and remain immutable under `C:/Sandbox/build/codex_ecs_20261122/B1/pages_input_comparison/`:
`prior_canonical.tower`: 972596 B, `403fdc6b0b6c9cd38cbf4e9c6b20858e1cb0c64a8d3342d91f54c72501807e2e`.
`prior_expanded.tower`: 4709291 B, `452132b90d4a73b43ec3f19153d8b344b201955640c7e6fd0a97203f2d858218`.
`current_expanded.tower`: 4769423 B, `a4e1eaaf5503f4f8596afe49352e74078f349938029b26f536833a0a32b51b46`.

| Source/profile boundary | Exact meaning of existing evidence |
| --- | --- |
| [Original a06 pair](wasm_entity_pages_a06_a1.md) | Reactor source `a06ec4b1f9f44419882477bc1a55b6ed39e2200b`, mounted `e637ba384037a6305fd945dd1e7c6296f5a98635`; portable32 canonical generation, unoptimized wasm32 LLVM reconstruction, then portable Fast reparse/output `0\n` passed. Subsequent optimized reconstruction failed; no whole-case pass. |
| [59d reuse](ownership_wasm_59d7dc9e.md) | Reactor `59d7dc9e995b16c785b01f40f340374dc4c73d18`, mounted `8771b9490186d501cf11110f0eea519d733811b1`; exact old972596 B input was reused, not regenerated from new Entity resources. Unoptimized wasm32/profile2 output equals old4709291 B; internal recheck passed, no additional execution claimed. |
| [Current L1 native](native_ecs_b862499b.md) | Compiled `b862499b73349b241e7e384d17a1dcab8a8c0800`/tree `68be1836e4cd573a82901c59c210cb745df278fe`, public eeb00571 predecessor. Source32 canonical/reparse and unoptimized wasm32 import/recheck passed; subsequent native execution reparse failed Capacity. |

Current compiler SHA256 is `482aa811fc7f69af4b27619d9d91c19dbae7af1e53694d3d0045a0d465af8841`; the predecessor is not the identity of that rebuilt compiler.
Current original canonical983366 B/SHA256 `47f43eaa4e547f5e83097c03597a22862b9d611b5ef73139fc748d650aca296c` is owner-attributed, not among the three delivered files. L1's external directory is unavailable locally; similarly named local `root_entity_pages_native_acceptance` contains the old403fdc6b input. No substitution or byte-level current-canonical comparison is claimed.
`tests/entity_pages.tower` has identical Git blob `55d078accf244ed8247ab45db3ec5c04da9a008a` at a06/e637/d962/b862: same pages/stages assertions, finalizer counts200/441 and expected `0\n`. Fixture equality does not freeze imports.
The 19-file source map finds three changed imported storage modules: `library/entities.tower`, `entity_types.tower`, `entity_stage.tower`; `types`, Bedrock/Foundation/Tower, host memory, vectors, checked buffers and budget definitions in that map are unchanged between a06 and b862.
Published `c12c2189` adds descriptor-owned first-child storage and checked heap promotion; `8471cf97` moves data_size/data_alignment/lifecycle into stable kind-owned `EntityLayout`, with new allocation/free and indirect field reads. These change allocation/control flow and layout declarations, not just generated names.
The current expanded text independently contains `EntityLayout` at495, `Entity.layout` at518 and `inline_children` at526; prior text instead keeps the three metadata fields directly on Entity at501–503 and has no inline child field.
Exact function-name inventories add only `entity_owned_allocate_result(EntityLayout)`, `entity_owned_free(EntityLayout)`, `entity_children_free`, `entity_children_resize_result`; initializer678 becomes693. Full original headers are retained, without renaming or normalizing operands for comparison.

| Literal text census (not AST/allocation counts) | Prior expanded | Current expanded |
| --- | ---: | ---: |
| Lines / struct declarations |174499 /36|176606 /37|
| Function definitions / exported definitions / extern declarations |179 /85 /3|183 /85 /3|
| Four-space `var` / `label(` / `jump(` lines |81999 /2750 /1337|82949 /2805 /1361|

Expanded growth is60132 B (1.277%); owner-reported canonical growth10770 B (1.107%). Expansion ratios are4.842→4.850, not a new order-of-magnitude expansion. Generated numbering makes an unnormalized line diff noisy (166898 additions/164791 removals); that diff is not a semantic change count.
Both expansions retain the same13 primitive/type declarations and address_type alias; lowered address arguments remain u32. Both profiles target wasm32, unoptimized. Foreign names/signature types remain realloc/free/abort; the checked-in host/type/operator sources above are unchanged. No target64 switch, new primitive policy or added foreign call family is evidenced; exact current runtime-object bytes were not supplied for independent comparison.
`backend_source_native.tower:266–313` uses a native 24 GiB checked world, width4/wasm32, then full internal import/recheck. Current peak2274158856 B and zero final owners are owner evidence; they are not a 2 GiB admission pass.
`backend_pointer_order_checks.tower:23–33` subsequently invokes `module_body_type_trial_steps`; `module_body_type_checks.tower:23,47–61` creates a separate native world with ModuleBodyTypeBytes2147483648, installs baselines, then recompiles expanded text before any Graph/Fast execution. Its fuel100000000 is unrelated to that byte denial.
The old59d2GiB limit was Wasm linear-memory capacity, not a native x64 byte ledger; reported capacity1577844736 B is neither native live charge nor RSS. Even [old d962 native import](entity_large_acceptance_d962222a.md) peaked2300797740 B under24GiB, already above2GiB, without claiming this same execution profile passed.
The earlier [native pointer-repair execution](backend_pointer_order_6e8001fd.md) used optimized1327388 B Foundation/SHA256 `57d665114dd154d942100adff395de01f65a535aa16f507cab3394585f291d96`; it cannot substitute for execution acceptance of either unoptimized4.7MB artifact.
Current error110976:5 is `v74981 = bits(u8*, v73804);` inside generated `entity_unlink` (starts108267), not a diagnostic proving that operation is invalid. Capacity identifies cumulative admission failure; text position alone does not identify a leaking owner or a defective operator.
L2 handoff: keep current a4e1eaaf bytes, b862 compiler/resources, native execution-world2GiB and the later execution phase together. A matched old-input/current-execution-profile control is absent; source growth cannot isolate the memory cause. Original0 output remains expected, but current expanded execution is unfinished.
Reused L1 failure cost only:17.80 s wall/9.62 CPU/2433156 KiB peak RSS, exit134 after typed Capacity and checked cleanup; not an OOM/timeout or a B1 run. No profiling/throughput claim, cap change, build, verifier, sanitizer or package mutation here; initial cache drained/105GiB free.
Raw evidence: `build/ecs_b1/pages_input_peer_bb953466/` contains hashes, literal counts/headers, source-bound import blobs, exact storage patch, unnormalized diff totals and read limits. Final reconciliation is recorded once in the journal; ROOT owns release and L2 owns memory diagnosis.
