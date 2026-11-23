# Authored Tower delta review: 3ea43517 to 9caa921c

2026-11-23, A1. Reviewed published main
`9caa921cb409f83d59a3c010e27219d4d8eb2e17` (tree
`2c8f5bd108675e4f840740e440fa0b29833da670`), frozen immediately after pull.
This covers all **42 changed authored `.tower` paths**, including whole touched
methods and immediate consumers/registrations, since
`3ea435174a3529aabbeeea8544aa640653214bb3`. It extends the fixed review in
[A2's audit](compiler_ecs_audit_a2.md); `f25799cc` was its later handoff, not a
new source baseline. Unchanged-file reviews are inherited. L1's known numeric
wrapper repair **is included**: `5cb0b061` / merged `30b45f5a` precede this freeze.

This is source review and adoption of explicitly bounded existing receipts,
not execution of the whole current compiler. No runtime changes, build, tests,
profiling or instrumentation were needed for this documentation-only task.
Bootstrap files and `host/ide_artifacts.tower` do not change in this interval.
Package source-map changes are in the existing JS host boundary; their Tower
fixtures and immediate callers are reviewed below. Generated project copies
are not additional authored providers.

## Evidence boundaries used in the map

- **P — declaration pages:** [A2's page-policy receipt](compiler_ecs_declaration_pages_5b9194e4.md),
  `f4e42223` / `0d789444`. Real 2/4-worker publish/cancel/denial checks,
  layout/reuse tests and zero-owner cleanup; 84 measured compilations. The
  512-body retained saving is 5,947,392 B; the local-heavy stream has more pages
  and only 4,224 B net saving. Neither result proves universal packing/scaling.
- **U — integer queries:** [A2's unary receipt](compiler_integer_arguments_b90b6f4e.md),
  `b84c6ba7`, and L1's merged `30b45f5a` journal receipt. Original double-negation
  failure retained; 22 focused cases, target32/64, workers1/4, canonical output,
  exact terminal errors/offsets, known/mutable captures and lazy branches pass.
  Full type-smoke belongs to the earlier A2 input; the merged focused selector
  passes in 13.26 s. These are newer native producers, absent from eac reactors.
- **W — type-return/wrappers:** journal entries “late type-return dependencies”
  (`48499b3a` / `63cb31f1`) and “known numeric nominal-wrapper composition”
  (`5cb0b061` / `30b45f5a`). Merged target32/64, workers1/4, canonical Graph/Fast,
  exact original outputs and one canonical `buffer(i32,2)` pass; 16 wrapper
  negatives, type-errors and query-smoke pass. Older numeric rejection is
  superseded for the bounded known generic wrapper, not ordinary numeric-only
  wrappers. No new allocation-denial sweep or portable wrapper acceptance.
- **B — backend transaction:** journal “backend reconstruction: real recheck
  denial and ownership boundary,” `7deeb795` / `7c10bb30`. Three focused CTests
  pass; real second-frontend Capacity preserves the prior 1,425 B output,
  fresh retry and final zero grants/bytes/lanes pass. Target32/64 workers1/4
  healthy reconstructed text executes independently to `0`. The full 9,707,075 B
  request still fails logical component capacity at offset204461 (153.52 s,
  10,660,176 KiB RSS); this is not a successful large reconstruction receipt.
- **K — packages/maps:** A1 journal receipts `928764f3` / `347a6ba4` include
  six package gates, both widths/profiles, real Memory denial, byte-preserving
  rollback, same-instance retry and zero handle/view/package/grant cleanup.
  Merged reactor `ab4f2c6c` repeated the gates and large recovery; its 2 GiB Wasm
  capacity is not live ownership or RSS. Later `f63de88f` ran actual narrow,
  resumable-body and division-by-zero LLVM gates on the eac pair; the small
  trap preserves offset31. That pair exposes production package APIs, **not**
  the new profile exports. Host metadata-allocation failure was not injected.
- **N — current fixtures on old reactors:** [A2 six-file receipt](node_six_eac_bda11a9b.md)
  (`73caf3fd` / `4ac85095`), A1 T8 `78650118` and T9 `fdf4ffa7`, and D1/D2 journal
  fixture receipts. Executables remain `eac16533`: portable SHA256
  `df541c16c626453fae94553cae2e6d1285b6879bfe7778be363fe537a0d8fd99`, LLVM
  `87c8fbc90a9e0e56a3399155c5d63bcab9dcd57e4de5d89996f40c0238230472`.
  Mounted fixtures/host sources are separate inputs. New page/unary/backend/
  wrapper producers are not tested by these binaries. Original reconstruction
  failures and the malformed `CoreCallStatement` resource exception remain open.
- **S — symbol policy:** [B1 generation/policy receipt](compiler_generation_48db0f27.md).
  Complete native gen2/3 equality is frozen at48db0f27; the subsequent policy
  fixture and all nine actual nm closures pass separately. It is not a current
  9caa generation, standalone release or public bootstrap repin.

All journal receipts above are in the
[project journal](temporal-opcode-research-journal.md). The map states stronger
independent/denial evidence explicitly; a printed value alone is not such evidence.

## Production paths

Paths are relative to the repository; every row is reviewed at the freeze above.

| Authored path | Actual review finding and immediate consumer | Existing evidence / gap |
| --- | --- | --- |
| `scaffolding/library/entity_types.tower` | Immutable `stage_page_rows` belongs to the component-kind entity in its store; zero preserves default policy. No payload relocation or second index authority. | P: native descriptor size184 retained; not an all-target ABI claim. |
| `scaffolding/library/entity_api.tower` | Checked registration extern matches the provider's owner, size, alignment, lifecycle and row-policy arguments and typed result. Used by semantic kind admission. | P; S checks actual provider closure. |
| `scaffolding/library/entities.tower` | Registration rejects invalid policy/alignment and changed or pinned admission; identical registration remains read-only. Stage allocation caps physical page rows; transfer/reuse matches type/stride, allowing published small pages without moving payloads. | P: Busy/Capacity, stable addresses, partial pages, reuse, joins and cleanup. Legacy registration preserves installed policy. |
| `scaffolding/compiler/semantic_context.tower` | `sem_kind_stage_result` uses checked world-owned create/register; failed fresh kind is detached, retaining the actual error. Ordinary `sem_kind_result` requests default policy. | P; fresh-unpinned detach assertion is structural, not a fallible allocation assertion. |
| `scaffolding/compiler/semantic_declarations.tower` | Four-row declaration kind is registered before dispatch. Newly exposed cloned named-type reads acquire producer dependencies/read access, even for already-ready producers. Query-owned calls keep ordered continuation selection. Constructor Parameters runs on coordinator; worker eligibility permits only prepared Alias. | P/W/U. Reviewed roots/waiting/admission, worker and joined continuation consumers; leases settle before structural publication/readmission. No recursive producer completion. |
| `scaffolding/compiler/semantic_type_values.tower` | Unbound unary/comma expressions no longer masquerade as literal readiness. Existing IntegerArgument query captures contextual type and lexical owner; evaluation finish waits on ordinary tickets. Array and constructor consumers use the same predicate. | U: independent runtime arithmetic, signed minima, target usize, lazy branch and deterministic rejection; no new constant folder. |
| `scaffolding/compiler/generics.tower` | Full deferred parameter binding uses definition/count/argument identities; checked clone/instance admission precedes registry linking. Return reader unwraps only unnamed wrappers, retaining named/nullary dependency identity. Call inference consumes the same read-only result/error. | W: canonical nominal reuse and negative effects/order; no general allocator-failure proof for new wrapper path. |
| `scaffolding/compiler/semantic_constructor_types.tower` | Parameters is appended to the existing phase enum, preserving earlier tags. Shared declaration continuation remains authoritative. | W; no public signature/layout extension. |
| `scaffolding/compiler/semantic_constructor_work.tower` | Identity-resolved strict single-return generic chains alone take known-wrapper admission. Parameters demands source-bound annotation types; integer arguments use existing queries, then clone/Alias readmission. General/dependent/effectful bodies retain Execute and lexical/module ownership. | W/U: originals, nested calls, shadowing, distinct nominal extents, initializer/effect order. Numeric-only ordinary wrapper remains unsupported. |
| `scaffolding/backend/source_session.tower` | Explicit world/environment and checked root; formatter uses world budget. Joined input/imported graphs and spans retire before fresh canonical recheck. Candidate text stays private until recheck and response succeed; failed requests keep previous Foundation. Descriptor reset makes deferred close safe. | B: real denial/rollback/retry and reduced retained owners. Candidate vector/LLVM allocations are not all covered by the world ledger. Large parse remains L2-owned. |
| `scaffolding/backend/session.tower` | Normal failure JSON exposes the session's first typed resource cause and source offset. Caller uses `backend_resource_fail`, which cannot replace an earlier failure. | B. Allocation-free fallback identifies Memory/Capacity/Busy but other causes become generic and offset is omitted; precise fallback serialization is not proven by the normal-response test. |
| `scaffolding/tools/bootstrap_symbols.tower` | Exact per-unit symbol membership admits four actual Tower cross-unit providers; no prefix exemption. `bootstrap_comparison` / `verify_bootstrap_symbols` consume this policy. Host metadata/parser nodes and semantic world/owner/page calls match providers. | S: native nm and wrong-unit/suffix/truncation tests; target spellings are policy tests, not target execution. |

## Tests, fixtures and measurement entry points

| Authored path | Actual review finding and registration/caller | Existing evidence / gap |
| --- | --- | --- |
| `scaffolding/tests/entity_component_layout.tower` | New policy trial checks immutable/pinned registration, actual four-slot capacity, partial admission with no published prefix, reservation release/retry and stable published addresses. Registered work-test executable. | P: typed Invalid/Busy/Capacity and exact zero owner teardown, not just output0. |
| `scaffolding/tests/entity_component_budget.tower` | Real parallel trial now uses four-slot kind; synchronize cancellation flags before releasing workers, drain pool, hold references before closing view, then publish/discard. Limits derive from actual page capacity. | P: 2/4-worker publish/cancel/denial, first Capacity and existing Stale sentinel preserved; synchronized ledger. |
| `scaffolding/tests/entity_stage_concurrent.tower` | Existing stage trial adopts four-slot kind. Distinct threads rendezvous, all admitted jobs join before holds/view closure, ticket settlement and finalizers; discard preserves writes to existing leased payloads. Registered work test. | P: real overlap/partial admission/cancel/collision/failure; not transactional rollback of payload writes or universal race freedom. |
| `scaffolding/tests/entity_page_reuse.tower` | Runs default and four-slot policy; mixed full/partial pages transfer, store allocation reuses published slots with no new grant, discarded peer stage cannot unlink survivors. Registered work test. | P: address/index/generation/finalizer/zero-ledger assertions. |
| `scaffolding/tests/frontend_storage_profile.tower` | Optional bounded locals input generates actual live bodies. Joined census separates payload/page/index/ledger storage and admission generations; output/canonical identity checked before zero-owner teardown. Existing optional storage-profile target. | P/U: checked paired samples; generation is admissions, not malloc count. RSS and foreign allocations remain separate. |
| `scaffolding/tests/integer_argument_unary.tower` | Double-negation, widths, signed minima, target-sized unsigned wrap, known local capture and untaken effects; runtime expression is arithmetic reference. Used by focused runner and type-smoke. | U: exact `8,2,0`, canonical re-execution at both widths/workers. |
| `scaffolding/tests/integer_argument_checks.tower` | Uses real body compiler/interpreter plus unchanged computed-type fixture; rejects out-of-range and mutable captures without partial program, compares first diagnostic/offset and retry stability. | U: 22 focused cases; no physical allocation injection. |
| `scaffolding/tests/lr_work_main.tower` | Adds dedicated integer-arguments selector and unary type-smoke coverage; wrapper negatives run before the type-smoke early return. Imports real providers, no duplicate implementation. | U/W merged selectors pass; earlier full type-smoke is not relabeled current. |
| `scaffolding/tests/type_return_dependencies.tower` | Named aliases/nullary helpers, lazy trap exclusion, local staged and runtime type values, integer-only nominal fields. `TowerWorkTests.cmake` registers workers1/4. | W: exact42/7/8, width32/64 canonical Graph/Fast; separate real alias-cycle diagnostic. |
| `scaffolding/tests/type_identity_composition.tower` | Keeps explicit pointer identity, named forwarding and nullary helper in original combined input. `templates.test.mjs` reads it. | W native repaired42/7/8; old-eac Node failure remains historical, not new-producer acceptance. |
| `scaffolding/tests/type_numeric_composition.tower` | Original nominal forwarding/array extent program unchanged after addition; Node templates and new workers1/4 CTests register exact42/7/8/12/9. | W repaired native canonical identity; old-eac capture failure retained. |
| `scaffolding/tests/type_numeric_known.tower` | Immutable module count supplies nominal extent; Node templates compares exact8 across execution/round-trip modes. | D1 N receipt passes on eac; no denial/worker-overlap proof from this simple output. |
| `scaffolding/tests/type_numeric_negation.tower` | Original nested-negation extent remains unchanged; Node templates requires8. | U fixes native input; old-eac rejection is retained, not waived. |
| `scaffolding/tests/semantic_invalid/type_numeric_mutable.tower` | Later-written module storage cannot become a known extent; leading print detects effects before rejection. Node templates requires empty output/zero steps and capture diagnostic. | D1 N rejection receipt; U adds current-native mutable/offset/retry coverage. |
| `scaffolding/tests/nominal_wrapper_module.tower` | Imported source-bound extent alias/static nominal constructor and nested/bool/dependent/ordinary selected helpers. Imported by known-wrapper fixture, not a standalone test. | W via positive fixture; preserves module scope against caller shadowing. |
| `scaffolding/tests/nominal_wrapper_known.tower` | Nested counts, exactly-once helpers, earlier/later initializer order, sizeof(usize), independent nominal extents and inferred/explicit calls; workers1/4 CTests. | W: both widths, canonical Graph/Fast, output42 and one specialization. |
| `scaffolding/tests/nominal_wrapper_checks.tower` | Real compiler runs four failures at two widths/two workers; requires null program/no published execution and identical error text/offset across workers. Registered type-smoke/type-errors/all. | W:16 trials; equality is not an independent hardcoded offset oracle or allocation sweep. |
| `scaffolding/tests/semantic_invalid/nominal_wrapper_runtime.tower` | Unknown ordinary formal count must not specialize a nominal extent or run preceding print. Registered wrapper negatives. | W: capture rejection/no effects. |
| `scaffolding/tests/semantic_invalid/nominal_wrapper_mismatch.tower` | Wrapper extent2 cannot accept buffer3 pointer; no spelling-based nominal collapse. Registered wrapper negatives. | W: exact type mismatch retained across profiles. |
| `scaffolding/tests/semantic_invalid/nominal_wrapper_order.tower` | Earlier initializer observing later storage cannot be treated as a valid known capture. Registered wrapper negatives. | W: rejection preserves initializer order. |
| `scaffolding/tests/semantic_invalid/nominal_wrapper_effect.tower` | Trap before nominal return keeps body on ordinary executed path; static shortcut must not erase effect/capability failure. Registered wrapper negatives. | W: failure retained; no untaken branch dependency invented. |
| `scaffolding/tests/backend_source_native.tower` | Real session/runtime plus explicit synchronized world budget. Joined observer reserves remaining capacity at second parse, saves prior output; fresh retry/teardown checks use production APIs. Linux clock is OS transport. | B: source-worlds/recheck CTests plus storage-backend-import; serial denial, healthy widths/workers. Timeout receipt has no cleanup pass. |
| `scaffolding/tests/struct_reconstruction_small.tower` | Mixed u8/u64 by-value generic copy checks initialized fields and independent copy storage, never padding. Backend recheck CTest and D2 probe input. | B native reconstructed output0 both widths/workers; earlier D2 old-reactor reconstruction failure remains distinct. |
| `scaffolding/tests/ide_package_profile.tower` | Tower-owned envelope validation/census, copied packet and independent re-load after retiring original handle; real Memory trial preserves old bytes/handle state then retries same world. Counts derive from buffers/collections. Imported by package checks; exports are optional measurement entry points. | K: large recovery and warmed retention. Census is physical pool storage, not all RSS; eac does not expose these new profile exports. |
| `scaffolding/tests/ide_package_checks.tower` | Adds direct canonical-source check only on first repeat per width. Existing first-Capacity/offset, byte-pointer-content rollback, retry, handle/live-count and release assertions remain. Reached through IDE and bytecode test export. | K: six gates without skips on measured reactor; no changing transactional preservation to clear prior successful output. |
| `playground/tests/fixtures/package_runtime_error.tower` | Division-by-zero reference consumed by bytecode test: prepared and independently loaded handles keep their own map after unrelated compilation. Width32/64 compare status/message/offset/file/output. | K: original offset derived from source `var answer`; actual LLVM caller also checks offset31. |
| `scaffolding/tests/default_struct_values.tower` | Ordinary independent struct copy and staged scalar result replace obsolete rejection assumptions. Node default suite requires0/7/0. | N: Graph/Fast32/64, canonical and raw/optimized LLVM; aggregate-print rejection remains separate. |
| `scaffolding/tests/interpreter_signed_index.tower` | Explicit i32 negative index preserves Foundation usize literal-context rejection; pointer offset and subtraction independently reach same initialized element. Node Fast suite. | N: Graph/Fast32/64 exact11/11; no LLVM claim for this portable-only suite. |
| `scaffolding/tests/stress/comment_functions.tower` | Existing Tower generator adds explicit Foundation import and calls every generated private function; count comes from StressCommentFunctions. c-source test retains exact annotated output checks. | A1 T8 N: C fixture passes; no claim of new compiler performance. |
| `scaffolding/tests/bootstrap_symbols_checks.tower` | Exact newly admitted symbol plus truncated/suffixed/wrong-unit controls; existing platform-spelling/first-error checks unchanged. Standalone policy fixture imports actual tool. | S: fixture and nine native closures; not a new browser/native runtime matrix. |

## Remaining boundaries and disposition

No new unowned production defect requiring a patch was established by this
delta review. Ownership and first-error paths above have concrete limits:
backend fallback presentation loses detail under its own allocation failure;
full reconstruction still exceeds logical capacity; numeric-only ordinary
wrapper admission remains unsupported. These remain with L2/L1 respectively,
not silently repaired or converted into passing tests here.

The unchanged T9 `entity_stage_ownership`/`compiler_work` old-eac failures after
Graph/Fast/canonical, T8 world-view/generic-registry failures, and A2 malformed
call-capture exception remain failed receipts. `compiler_batch` passes its T9
modes. None was rerun. Runtime capture is not promoted to known capture, leases
are not replaced by lifetime pins, and no payload packing/noalias claim follows
from this review. New wrapper admission has focused semantic/differential
coverage, not new cancellation or physical allocation-fault coverage.

ROOT retains current joined-artifact adoption, generations, hosted publication
and blocked instrumentation. No current all-compiler, sanitizer, browser or
release acceptance is inferred from the combined historical receipts. Later
incoming source commits are outside the fixed review, even when merged to
publish this document; the freeze will not be advanced for publication.
