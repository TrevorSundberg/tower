# First lexical source-root anchor — L1

Frozen baseline: `effab4bd4fdd3fc789a877de8c3cb170e1d6acf0`, tree `a4b5f1088f3cdfbe60eecd218b0505bce296d4d3`.
Public Linux compiler SHA256 `eeb005717318086c145428edc3b6b784d4729df7ef0514c7329e0a18b76dda9c`; no override/rebuild/pin change.
Existing host runtime SHA256 `f74001da316e6d14af4f699033e8239ee70a3f597ce442675c63737f225459ff` reused unchanged.
Scope: only `tool_files_posix::tool_path_relative` and dedicated `tests/tool_path_lexical.tower`; B2's dependency/package pipeline unchanged.
Contract: [lexical module identity](modules.md), existing [package path controls](compiler_project_paths_05a23c99.md).

Before: actual native `source/root/self/module.tower`, with `self -> .`, returned `module.tower`; fixture expected `self/module.tower`, exit 1.
Backward prefix search chose the last physical-root match, collapsing distinct lexical module keys.
Repair: retain the first root anchor (direct canonical-root fast path, otherwise forward physical-prefix search); preserve internal alias names.
Normalize suffix dots/separators/parents; reject leaving that anchor, missing files, outside physical targets and paths without a directory-root anchor.
For changed spellings, verify the normalized path under the same anchor names the original physical file before publishing its key.
This rejects symlink/parent traversal that would associate different bytes with a normalized key; failures preserve the caller's prior output.
All temporary buffers/realpath results are released through existing ownership APIs; no module registry, IR, ABI or compiler semantics change.

Final dedicated fixture PASS twice, absolute root and relative `.`: 17 cases each (11 accepted, 6 rejected), 34 exact key/content/retained-output checks.
Four independently enumerated source keys remain: `module.tower`, `nested/leaf.tower`, `self/module.tower`, `self/nested/leaf.tower`.
Actual shared package lookup checks literal contents and both relative-import destinations; no second importer or execution-model oracle.
Controls cover direct/outside-root alias/internal alias/nesting, dot/parent/duplicate separators, missing/outside/escaping aliases, anchor escape/reentry and ambiguous symlink/parent traversal.
Existing `compiler_project_paths` PASS: four direct/alias-build × absolute/relative spellings, exact closure/content/generated-runtime and duplicate-retention assertions.
Its missing/outside/escape modes each still exit 1; healthy and negative stdout/stderr byte-match before/after (six paired invocations including direct/alias helper controls).
Full project recipe was not rebuilt: focused closure bytes are unchanged; B2 owns full-package adoption. These are source-map/import-text checks, not fresh compiler execution.

Linux/WSL Ubuntu24, CPU0–3, 2 GiB MemoryMax/no swap; small Tower fixtures only, public compiler jobs1 and existing runtime link.
Single focused checks: wall/CPU below GNU time's 0.01 s resolution, peak RSS 1792 KiB (one compatibility negative 1784 KiB).
Three matched healthy batches per version, each 32 sequential fresh processes/four literal mappings, byte-equal output: before wall .14/.15/.15 s, after .14/.15/.16 s; CPU .05 s each.
Batch peak RSS before 3428/3428/3340 KiB, after 3348/3336/3344 KiB; process/file overhead included, no speedup or parallel-scaling claim.
Final fixture compile/link: 2.98/.02 s wall, 2.07/.01 s CPU, 335444/51428 KiB peak RSS; final scope peak 284065792 B, OOM events 0.
Preserved draft failures: missing `puts` declaration, unsupported fixed-array foreach and predecessor `else if`; corrected with supported ordinary Tower constructs.

Provider SHA256 before `c79132da598240001141830137147fe4d1faa9daacf3b60963546e427ab11c1d`, after `d4f0c1e225009074c96be7084b03afbe73cc7605d118c0afb09a00442dde40d3`.
Final fixture SHA256 `0b077f8bf2897a50a8db94014910b5e9e02da33e7f3a7e6687bd8e469da03e87`; executable `00f4278143d613baf8a5395a63c9a2d06644227cb824318cf0e6eb85364daada`.
Compatibility executable `446d150977fc017aa82845d47555b0709754d387cda9b0ad5393c392cdef074a`; unchanged caller/fixture hashes in `final_inputs.sha256`.
Raw commands, original failure, every exit/output/time, draft sources and complete manifests: `C:/Sandbox/build/codex_ecs_20261122/L1/path_lexical_effab4bd/`.
Ignored binaries/depfiles: `build/l1_path_lexical_effab4bd/`; OS fixture: `/root/.cache/tower/l1_path_lexical_effab4bd/`; no owned jobs remain.
Limits: native POSIX paths stable across check/read, as before; no filesystem-race protection, non-POSIX runtime, full package/browser adoption or global allocation census claimed.
Integration: implementation `e82d11e9` merged published `027a87be` as `023663b5`; both actual depfile closures and tested binaries remain byte-identical (`merged_dependencies.json`).
Incoming bootstrap adoption/query-denial fixture changes are excluded from the eeb-built evidence; no passing run repeated or relabeled. ROOT/B2 retain full-package adoption.
