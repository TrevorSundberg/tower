# Constructor typed failures: original budget registration completed

- Result: PASS original corrected constructor-budget registration, original allocation-fault settings plus one derived page-boundary trial, unit-admission and matched serial/four controls. No budget or storage-policy change.
- Freeze `b478b68c99825f1e91feabbe7712746a05c00432`, tree `765509ff0e16c1d978f13d151a055173065e5ce6`; later Entity geometry excluded. Original oracle-repair/failure evidence remains in `work_constructor_budget_86e8d553.md`.
- Public default compiler SHA256 `31a385c616b889987d68f8eb9714020f3928aac97591a1569f905ab706f52ed6`, override unset; Linux x64/Clang19, CPU0–11/24GiB, one owned native cache,97GiB initially free and no active owned jobs.
- Preserved/re-executed before binary `67d3ff153828af15e2b70a93bce19675cbadc86c4e4fd24364d3dff10d22a461`: exact first output `3360`, `1`, `3`, `Work constructor budget regression`, exit1 (cap/wanted Capacity/actual Memory).
- Root cause: owner/kind/unit `entity_create` and `entity_attach` wrappers discarded per-call results. Cleanup read `store.resource_error`, which the checked entity APIs do not write, then substituted Memory.
- `compiler_work_create_result` now uses `entity_create_result` independently for owner, kind and each unit, returning immediately after the first failed creation. It issues no second creation after an owner failure.
- Attachment uses `entity_attach_result`; the constructor releases its local node reference before cleanup/return. Successful parent ownership is unchanged. Output remains untouched until complete construction succeeds.
- Store creation, kind registration and component creation retain their existing typed-result paths. Every failure releases partial graph/store/entity/buffer owners before returning its captured cause.
- Graph operations retain `work.graph.resource_error`; a failed graph shape without an allocation receipt maps to Invalid, not invented Memory. Zero task/join handles now stop immediately before further graph work.
- No global/store error channel, error-code change, cap increase, schema/layout alteration, allocator substitution or A2 page-storage edit. Memory remains the actual physical-allocation failure result.
- Original budget fixture is unchanged in this batch: all five Capacity caps now pass, followed by the original1MiB successful eight-unit completion, nonempty-output rejection, exact store admission/disposal and final zero bytes/grants/lanes.
- Self/store/page/index charges remain independently derived from actual types/probe allocations; all18 null-output/zero-unit/zero-worker Invalid calls run, and existing nonempty-output Invalid checks remain.
- Original constructor-fault sweep still runs8 units/4 workers/1MiB and its512-attempt bound, stopping at first success. Every denied prefix remains exact Memory/null output; cleanup restores allocator count and zero bytes/grants/lanes.
- Added only the missing unit-page allocation boundary: a real owned constructor probe supplies its Entity page capacity as the second sweep's unit count. Owner+kind+units necessarily cross that page; no guessed row count or hidden arbitrary-pointer header cast.
- Both sweeps pass with final output `0`; exact first-success prefix counts are not emitted. Physical fault injection is serial, separate from production-allocator worker overlap; no sanitizer claim.
- Unit-admission before/after passes original serial/four canonical equality, nested lane-release/refill, source ordering, cancellation/drain and ledger bounds. Observed release-to-ready intervals63933/67059ns are controls, not a throughput claim.
- Small successful workload is the existing four-unit/zero-body dependency-uniform profile, target width64/backend0, workers1/4, fresh processes/warm filesystem; n1 each arm, reversed worker order afterward. Exact source/import/canonical artifact bytes match.
- Literal42 and canonical hash11389118332386648629 remain exact; four-worker runs show four distinct threads/actual outer peak4/shared peak4, with final lanes0 and successful owner teardown.

| Matched control | Whole wall s before→after | CPU s before→after | Peak RSS KiB before→after |
| --- | ---: | ---: | ---: |
| Serial four-unit request | 1.28→1.26 | 1.13→1.12 | 198648→198372 |
| Four-worker request | .62→.62 | 1.84→1.84 | 482924→482576 |
| Unit-admission validation | 2.12→2.02 | 2.28→2.21 | 414216→415452 |

- Inner frontend wall/CPU: serial1.207086→1.189518 /1.089450→1.073723 s; four .522629→.520439 /1.776846→1.765645. Small sample, no speedup claim or material regression established.
- Retention identical: serial51046323B/41011 grants, four51035195B/41015 grants; serial charged peak130356905B, four367377628→366978964B. Ledger10/20MiB unchanged; do not add outer/inner peaks. Final disposal assertions pass.
- Failure-path budget validation before/after each <.01s wall/CPU at displayed precision, RSS1404→1380KiB; before stops on failure, after completes all caps, so these are not equivalent-throughput timings.
- Fault validation each <.01s wall/CPU, RSS1376→1628KiB; after includes the extra derived sweep. Original failed and passing logs remain preserved separately.
- One dependency-aware build:7 actions after ordinary CMake regeneration,14.47wall/6.20CPU/324216KiB. Only both constructor targets, their entities provider and required LR/profile links; no duplicate public-leaf build.
- Actual entities nm report passes unchanged exact symbol policy; existing tool/negative-fixture identities verified. Initial resource-equality check exits1 only for intentional `library/compiler_work.tower`; before/after copies match their respective producer hashes, with no other resource difference.
- After budget SHA256 `24e9f0a727f85439b6bff5676b4f653eac2999eb502682424182ca5c8d1cc11b`; fault `e69251de31fc82901a15de592beaf41b544e3f9042f83fc08001ca5d57c95b59`; LR control `9e7356f11d0b5e6dd309067e192878bc9157a18f1aa45dd5cbd9c06c31453145`.
- Raw scripts, logs, source/resource/binary manifests, depfiles and preserved executables: `build/ecs_b1/cache/constructor_results_b478b68c/`; handoff `C:/Sandbox/build/codex_ecs_20261122/B1/constructor_results_b478b68c/`.
- Scope is two Tower files: constructor result propagation and focused fault coverage. Earlier import-reuse performance sets remain unchanged; no broad native/browser/generation/profile/sanitizer/deployment work.
- This closes the demonstrated constructor registration failure at the frozen source. D1's analogous-consumer review and ROOT's final integrated acceptance/publication remain separate; no claim about later page candidates or full compiler acceptance.
