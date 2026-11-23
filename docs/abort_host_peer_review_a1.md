# A1 peer review: exact abort host capability
Reviewed9f37944356c44042946ec74a5c0957236ec4c4f9 against parent1e428ede6c33cba159b753247affd8d5cf3ed67d, preserved byb4bd9980.
Freezeae5d34b20574dd8a9bc5cb041e2e6332e87ba0dd has identical scoped blobs. **No concrete defect found; no production/test edit.**

| Reviewed path | Exact Git blob | Contract/fixture conclusion |
| --- | --- | --- |
| playground/src/platform.mjs | c782a5e5229dd926267db6141e3cf1655ea67eb6 | Typed default abort and synchronous validator; existing write capability unchanged. |
| playground/src/foreign.mjs | 421bfca5a02f65e17128e3b04c2eeb3052d1706b | Own provider required; validate before invoking; promises still rejected. |
| playground/src/tower-host.mjs | f3d017a56cd24a62eb3ab09f85848bade0f82161 | Existing returnType added to foreign context, existing failure/cleanup path reused. |
| playground/src/llvm-host.mjs | dd311be9833e6c819e9907c65787be16ee861ecd | Typed .wasm provider bypasses JS coercion and is checked at instantiation. |
| playground/tests/platform.test.mjs | c9f2a8a2f6f989f6c7d1ca074fa439e38931a365 | Existing controls/expectations inspected; A2's separate spelling repair untouched. |
| scaffolding/tests/platform_abort.tower | 5d3895690ba3794f8dc8db3138350d841f141c20 | Prints7, aborts; exact output excludes later99. |
| scaffolding/tests/platform_abort_unused.tower | d4f3ea11cda659473fea375d4b0699a6ca4d54e7 | Exported fail keeps a valid import live; main prints42 without calling it. |
| scaffolding/tests/platform_abort_parameter.tower | 60983410ec31058298fd403aea6322a268ba21a5 | One-parameter call rejected, empty output. |
| scaffolding/tests/platform_abort_result.tower | 06df7668bb8d528f61692b4d88b068a87ef6b026 | Nonvoid result rejected before outer print; empty output. |
| scaffolding/tests/platform_abort_staged.tower | c1ff5d88eaf4510779a665d360f652f2d76d0064 | comptime stop rejects absent evaluation capability; no runtime print. |
| scaffolding/tests/platform_unknown_external.tower | 34076c3717f9b66a317fe20b33d8a246c0fe8b58 | Unknown name remains an error, no permissive fallback. |

Descriptor audit:40 bytes =8-byte header +6-byte type section +15-byte import section +11-byte export section.
It declares one0-parameter/0-result function type, imports env.abort at type0, exports function0; no code/start/memory/table.
The exported imported-function reference retains that Wasm type: wrong arity/result is a LinkError before guest execution, regardless of old parameter-only JSON.
Graph/Fast serialize the checked function's result via semantic_format_type in ide_execution::im_foreign; context.returnType plus args.length reject incompatible calls before the callback.
Both hosts merge explicit imports after defaults. Explicit providers intentionally replace default behavior/validation; no global restriction on caller-supplied capabilities is claimed.
Graph ix_ok and Fast's failed/done checks stop subsequent effects after tw_exec_fail/im_text_fail; first failure remains terminal. Wasm throw is caught by executeWasm's existing error result.
Reviewed request-buffer disposal, source-copy finally, destroyExecution map cleanup, host handle take and ide_execution_close. Guest tests always destroy in finally.
The singleton typed reference keeps its tiny wrapper instance alive, captures no guest memory/handle and creates no per-guest registry; host compiler instances live until process exit.
Staged IMExecution contexts make ix_has_foreign false and ix_foreign fail before im_foreign; no new evaluator/interpreter or staging capability was added.

[A2 receipt](abort_t9_a06_1e428ede.md) and actual raw logs reviewed:20 Graph/Fast32/64 checks,5 Wasm cases, both staged entrypoints; separate invoked abort exits1 with only7 LF.
A2 complete work_access/work_observe each pass1/0fail/18 exclusions:21.6902/34.2590s command wall,43.140/63.515s actual-child CPU,1167116/1343152KiB peak RSS.
A2 n3 healthy means1.737869->1.747239s wall,2.790333->2.676s CPU,289513->289372KiB; capacities unchanged. These are attributed costs, not an independent rerun.
Compiled sourcea06ec4b1f9f44419882477bc1a55b6ed39e2200b; exact portable/LLVM hashes remain those in A2's linked receipt, not newly built current sources.
Limits: no zero-global-owner/drain oracle from an afterEach 'released' label, no OOM sweep, no direct abort-override runtime control, no new precise abort callsite offset (reported0).
At the reviewed freeze, the full platform file had3pass/1fail on canonical spelling; targeted abort1pass/3 exclusions did not erase it.
One extra ordinary Tower enum-named-void control rejected correctly in all32/64 Graph/Fast modes with empty output; no nominal-name bypass reproduced.
Its Node child CPU1.452s/peak143800KiB, OS command0.934s; explicit guest destroy/host close. Initial missing-Foundation transport setup failed before control and is recorded.
A1 raw root:C:/Sandbox/build/codex_ecs_20261122/A1/abort_review_ae5d34b2/ (Tower input, output/counters, reviewed blob/SHA manifest, setup failure).
A2 raw root:C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/abort_t9_a06_1e428ede/ (focused, invoked, healthy CSV and complete T9 artifacts).
Documentation-only; no runtime build/profile matrix, T9 repeat, instrumentation or deployment. Todo unchanged, owned jobs drained; ROOT owns final release.

Integration:8b58fa60 merged complete e330a2c9 as b2d0928e; all10 reviewed production/fixture blobs unchanged. Later platform.test.mjs/platform_calls repair and dependency fixtures are excluded; A2's [new spelling receipt](platform_binding_a06_26f99a40.md) supersedes that historical open gate separately, without a new A1 run.
