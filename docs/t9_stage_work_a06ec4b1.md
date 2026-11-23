# T9 stage/work adoption: blocked on optimized pointer comparison

Frozen reactors: **a06ec4b1f9f44419882477bc1a55b6ed39e2200b**, reused in place; no rebuild/recopy/wrapper.
Portable SHA256 `f065757480f1b94ad4f181aadeb8e0a63bc06b781a546aed11ac12796a64a25d`;
LLVM SHA256 `8acbaf08545d0ce972f2de7db2a89fcfc7ef434f95f775feca06dde759107697`.
Mounted host/resources: **a9760a9ba7db7bb86a3f3845429a2df9103cbdbf**, treeb34d69227997df7294db3231fac1859a9e5013a6.
Host manifest SHA9467ce058d048bf487fb09631f212f05dd33e6e085aadce92738cc7b0bec1467;
resource manifest SHA1603705d9354714b86daa38ab26087c35465755c9356e352ff43b789a3d73023; both reverified after drain.

`^Tower entity_stage_ownership agrees across graph, fast, LLVM and Foundation text$` **FAILS**.
`^Tower compiler_work agrees across graph, fast, LLVM and Foundation text$` is **UNSTARTED** under stop-first rule.
Unchanged semantic-port.test.mjs, Node22.23.5, fresh process PID28744, CPU4-7/no child isolation;
`--test --test-concurrency=1 --test-timeout=600000`, exact anchored pattern, original fuel/caps, existing600s OS guard.
Actual exit1, tests1/pass0/fail1/skipped0/cancelled0, deadlineHit=false; unrelated filtered tests excluded.
15 phase records: four original/canonical32 executions and two canonical equalities pass;
unoptimized32 LLVM reconstruction/internal recheck/portable reparse/Fast execution also passes (five output0 assertions total).
The second LLVM call fails optimized32; all64-bit and source/canonical executable phases remain unstarted.
Exact response: `This operation requires integer operands`, offset1274972, file`.tower/tests/entity_stage_ownership.tower`.

| Actual test process | Wall s | CPU s | Observed peak working-set bytes |
| --- | ---: | ---: | ---: |
| entity_stage_ownership | 341.424963 | 554.390625 | 3765198848 |

This measures the actual Node process/threads, including both reactors/JIT/host, not a test parent or compiler-only cost.
Observed OS peak may miss a final subsecond peak;2GiB is the unchanged per-reactor maximum, not measured live capacity.
The API exposes no LLVM linear-memory peak; this failure is semantic, not a proven memory-limit failure.
Canonical request953744B SHA`f6166fc85d90df0983122f761f6472235bbb76a625e8c523d496dc8767c1e7e9` is retained exactly.
Successful unoptimized Foundation4607266B SHA`dea7120594876060622f1440502784701040ab8d634629a4909da0b0b280dc01` is retained.
One untraced existing native source probe reproduces the error at1291590, resource=None, published output0B;
3.86wall/3.86CPU/702860KiB, peak charged551957684B, final bytes/grants/lanes0. No new build or matrix.
Two read-only debugger observations preserve failures: first ignored the sole recheck call, corrected capture saves private1323362B text.
Actual optimized IR has **no i1 overflow intrinsic**. In `entity_stage_references_record_result`, the ordinary address-range guard
(`library/entity_stage.tower:479`) becomes `icmp ugt ptr %15, %1` (`native_optimized.tower.ll:12576`).
`backend/import_values::bi_compare` emits `v28563 > argument339`, bothu8*, at private_native_recheck.tower:51452;
Foundation numeric checking rejects it. Error offsets are recorded literally, not asserted to index that private text directly.
**ROOT handoff: backend pointer-order legalization, distinct from D1's active i1 helper fix and A2 memory work. No production edits.**
Raw phase/error JSON, original/returned text, IR, private candidate, native logs, process receipt and ROOT_handoff.txt:
`C:/Sandbox/build/codex_ecs_20261122/L2/semantic_port_a06ec4b1_a9760a9b` (results manifest SHA6815f88b6c698ac458258ab4a30ad4cecabf7779a54a1ca9325dfa6a26e95682).
Prior7e54b96a native passes/old Wasm failures remain narrower separate receipts; neither assigned current T9 case is closed.
All owned jobs drained; no optimized-only substitute, cap change, other-owner edit, sanitizer or release operation.