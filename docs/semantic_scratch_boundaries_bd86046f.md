# Semantic scratch: focused boundary and lifetime acceptance

Freeze `bd86046fa3c1c3ce76854bbc2330a8d0c04a02df`, tree `0af8e79f4ac3e382cc01190fe7f1c8014914c59c`, plus fixture/registration changes only.
Default public bootstrap SHA256 `44ae8f731d8991e5cd063e86512923ac5f9c1bd151943c8f235ee4025de11c44`; no private override, production change or allocation-policy tuning.
Orchestral-Revng/Linux x64, actual15GiB guest, CPU4–7, one modest4GiB/no-swap family, existing l2_ecs_native cache; no owned/L1 heavy process at start,98.57GB disk free.
Scope follows [the accepted memory repair](native_pages_scratch_effab4bd.md). Its full4769423B input, scratch faults, query-smoke and healthy controls are reused, not executed again.
The [A2 native64 selection](native_final_5dccac4b.md) supplies unchanged library-only evidence: WorkArena/library/arena-fixture/host allocator-worker/bootstrap blobs match5dccac4b exactly.
That library evidence covers mixed alignments through256,8193B oversized storage, invalid alignment/overflow, Capacity/Memory atomicity, multi-chunk join, four-thread cancellation/drain and zero retirement; its4096B test configuration is not relabeled as semantic1024B coverage.

| Boundary | Exact evidence and outcome |
| --- | --- |
| Actual semantic chunk and tail edges | NEW `scratch-boundaries`:12 requests,6 per semantic target32/64. Each is below/at/above either the live aligned tail or configured chunk; actual chunk prints1024, so whole-chunk requests are1023/1024/1025B. |
| Alignment/oversized/stable ownership | NEW same check: compiler alignment, all payload bytes and self-address receipts survive later growth, six private-owner transfers and child disposal;11 joined chunks/profile, peak44944 charged B/profile, final bytes/grants/lanes/buffer-count return to baseline. |
| First Memory/Capacity and retry | REUSED exact previous `scratch` producer tests: six operation families, every measured allocator failure point plus real byte pressure, source73, no partial list/table/clone, no allocation/publication on terminal retry. These are serial faults, not concurrent instrumentation. |
| Type/body/declaration admission | NEW existing three `tower-semantic-query-failure-*` modes:32/64×1/4,12 denial trials/12 calibrated setups/36 terminal retries; exact Capacity, prior ticket storage, real interpreter suspension/independent peer42 and zero graph/world/interpreter ownership. |
| Suspended lexical references/effect order | NEW unchanged `body_continuation.tower` through existing `backend-pointer-execute` runner at32/64:8 Graph/Fast×1/4 trials. Generic/decltype/comptime preparation, nested/shadowed locals, deferred calls and ordered effects all return exact `0\n`; full canonical text equal per width and final owners0. |
| Cancellation/drain and actual overlap | REUSED previous current-policy query-smoke: lifecycle/body admission cancellation and stage publication guards; imported-module semantic_threads/peak=4/4 at both widths; actual four distinct clone threads have overlapping intervals for publish and cancellation, followed by zero grants/lanes. |

Only missing direct chunk-edge coverage is new. `semantic_scratch_boundary_slice` derives requests from the actual arena and alignment, not an assertion of the1024 constant or a mock allocation model.
The check is part of existing `scratch`, also exposed alone as `scratch-boundaries` and registered as `tower-storage-scratch-boundaries` (30s). Registration inventory verified without rerunning it.
Production arena/semantic methods and all byte/fuel/time limits are unchanged. Query-denial fixture remains A2-owned and unmodified; normal synchronized pressure tests stay separate from serial fault allocation.
Fresh finite selection:6 commands/6 passes,0 failures/skips/unstarted; one new boundary command,3 existing query-denial modes,2 continuation widths. No repeated full native64/query/type/control/library/generation matrix.
Final incremental fixture build:9.01wall/4.96CPU seconds/397672KiB maximum child RSS. Two earlier fixture syntax errors (array initializer/array foreach unsupported by public language) remain in raw logs; corrected using default arrays and type-derived counted loops.
Boundary command0.01wall/<0.01CPU/51644KiB; each denial command0.01wall/0.01CPU, maximum52124KiB.
Continuation32:1.51wall/1.40CPU/198856KiB;64:1.49wall/1.39CPU/211368KiB. These are validation costs, not a throughput comparison or new performance claim.
Final family peak498868224B, memory max/OOM/OOM-kill events0. Native process RSS is separate from world charge; all selected teardown assertions pass.
Storage ELF `503477d1e1a63d86e53bc2b7da7b68c4cceef1a60cab796b6bb482cb727748ef`; query-failure `16dcb4f531c20a806cfe88e56f99b3463e285c8c59c087937c11f4b453c0f1db`; execution remains `40adcffc388304b04a827968e07c32dbc53caa61e893cbd1dd93432cfaf09abf`.
Raw E: `C:/Sandbox/build/codex_ecs_20261122/L2/scratch_boundaries_bd86046f/`: SOURCE/START, coverage_blobs, empty reused-library diff, exact reused-overlap excerpt/original path, inputs/binaries, patch, commands, errors, actual exits, GNU child metrics and cgroup counters.
The reused overlap record comes from `../pages_memory_effab4bd/merged_query_smoke.out` on tested3e4c3681/public44ae; its producer/query inputs remain identical at this freeze. Queue width alone is not used as evidence.

No new native ownership/lifecycle failure was found in this selection. Native target32 fields still use the host64 allocator; this is not actual Wasm allocator/address-space or browser-worker acceptance.
Remaining ROOT adoption: current post-scratch Wasm producer/worker cancellation and pressure retirement on B2's new bundle; no artifact polling, rejected verifier, sanitizer, browser or deployment operation occurred.
A1 healthy combined performance, D1 independent repair review and L1's18 remaining large-native pages phases keep their separate owners/receipts. No pass is inferred for those tasks.
Integration boundary: pending normal publication; frozen input evidence will not be relabeled.
