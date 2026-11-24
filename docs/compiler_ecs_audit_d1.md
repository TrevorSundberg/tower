# D1 compiler ECS acceptance audit

Current source adoption: [published ec01291](#delegated-finite-source-adoption-at-ec01291-2026-11-23),551 direct paths and all51 delegated freshness actions closed by substantive review. The demonstrated budget defect and coverage limits remain explicit; earlier execution receipts retain their identities.

This is a growing review receipt, not completion or release evidence. Initial
review source: `6282238779034442e0578d76b921ca117df819f1` (2026-11-22).
The initial tracked roster contains 1,011 Tower files; D1's direct scope is
437 files: 422 under scaffolding/tests, 12 examples, two editor fixtures and
one playground fixture. Only root AGENTS.md applies. New files and rebased
changes require reconciliation. Other lanes own their production changes and
specific regression fixtures; D1 coordinates generic harness edits.

## Evidence and shared fixture contract

Rows below record source/caller review only unless they name an execution receipt.
D1 native build, pool profiles and focused body execution receipts appear below
and in the journal; browser, sanitization and publication are still pending.
The older handoff's missing-helper claim is superseded
by production IMFunctionInput/executable_functions readiness and the journal's
later type-value checkpoint. Do not count fixture presence as an executed test.

Ordinary program fixtures (P) own only guest values and explicit guest allocations;
they do not implement compiler worlds, storage indexes or schedulers. Their
bindings/ordered effects must enter the compiler's existing entities and shared
queries. Scalar/aggregate fixture storage is deliberate input, not a competing
AST. Invalid fixtures (N) must preserve the intended unsupported/error boundary.
Their expected failure and location belong in a caller assertion. Neither P nor
N proves real worker overlap, stale dispatch rejection or lifetime cleanup alone.
Canonical/serial-worker evidence comes from a harness, separately checked.
Foundation-only cases remain Foundation; uninitialized raw storage is not an
invitation to impose Stronghold policies.

Review criteria use [Flecs systems](https://www.flecs.dev/flecs/Systems.html)
for access declaration and staged publication,
[component traits](https://www.flecs.dev/flecs/ComponentTraits.html) for stable
sparse payloads versus table iteration, and
[Burst aliasing](https://docs.unity3d.com/Packages/com.unity.burst@1.8/manual/aliasing.html)
for requiring evidence before assuming disjoint access. These are design inputs,
not Tower performance evidence. An index is not packed payload storage; a worker
budget is not measured overlap.

## Negative fixture review

All rows in this section use contract N and the reviewed commit above. Disposition
is preserve intentional failure unless explicitly marked revalidate. Browser
callers include compiletime.test.mjs, semantic-port.test.mjs and
compiler-threads.test.mjs. These callers are reviewed for coverage, not adopted as
new non-Tower test logic. Execution/diagnostic receipts remain pending.

| Path | Reviewed behavior and coverage boundary |
| --- | --- |
| scaffolding/tests/semantic_invalid/aggregate_inferred_copy.tower | Distinct nominal Item/Other structs despite identical layout; initializer copy must retain exact-type rejection. Browser's old “copies not implemented” message needs revalidation. |
| scaffolding/tests/semantic_invalid/argument_type.tower | Foundation typed call rejects bool argument to i32 identity; preserves explicit low-level language import. |
| scaffolding/tests/semantic_invalid/comptime_capture.tower | Immutable module input 7 is staged; historical runtime-capture rejection may now be stale. Revalidate against current known-binding contract before editing. |
| scaffolding/tests/semantic_invalid/comptime_cycle.tower | Executed recursive explicit stage forms a true evaluation dependency cycle; no runtime escape hatch. |
| scaffolding/tests/semantic_invalid/comptime_dead_pointer.tower | Returned pointer to helper's dead local is dereferenced at compile time; tests owning-frame lifetime, not merely offset bounds. |
| scaffolding/tests/semantic_invalid/comptime_defer_cycle.tower | Stage dependency inside deferred recursive cleanup; must diagnose cycle without replaying cleanup/effects. |
| scaffolding/tests/semantic_invalid/comptime_fuel.tower | Infinite ordinary helper exhausts staged interpreter fuel; bounded failure rather than hung worker. |
| scaffolding/tests/semantic_invalid/comptime_generic_selected.tower | Taken generic argument evaluates nested division by zero; counterpart must leave untaken dependency dormant. |
| scaffolding/tests/semantic_invalid/comptime_output.tower | Executed print in staged helper requires explicit effect capability; must not leak output on failure. |
| scaffolding/tests/semantic_invalid/comptime_return.tower | Selected true branch falls through nonvoid function; flow after staging must reject missing return. |
| scaffolding/tests/semantic_invalid/comptime_uninitialized.tower | Staged local read before initialization; interpreter capability failure does not prohibit raw Foundation storage declarations. |
| scaffolding/tests/semantic_invalid/declaration_index_cycle.tower | Mutual decltype(index) declarations form identity-based inference cycle. |
| scaffolding/tests/semantic_invalid/declaration_index_type.tower | Boolean array index in unevaluated type query remains type-invalid. |
| scaffolding/tests/semantic_invalid/decltype_aggregate_operator.tower | Unsupported equality on aggregate Item in unevaluated query; old aggregate-copy diagnostic needs revalidation. |
| scaffolding/tests/semantic_invalid/decltype_body_comptime.tower | Signature-only invalid generic remains dormant until explicit stage demands its body; then missing_body_value must fail. |
| scaffolding/tests/semantic_invalid/decltype_body_runtime.tower | Wrapper runtime demand activates invalid generic after earlier decltype; caller checks outer instantiation origin. |
| scaffolding/tests/semantic_invalid/decltype_cycle.tower | Two mutually inferred type declarations; shared dependency path should be stable across workers. |
| scaffolding/tests/semantic_invalid/decltype_field_cycle.tower | Record field depends on same record's field through module value; layout/type dependency cycle. |
| scaffolding/tests/semantic_invalid/decltype_generic_header_cycle.tower | Generic return field type and nominal record declaration mutually depend; no premature empty layout publication. |
| scaffolding/tests/semantic_invalid/decltype_header_cycle.tower | Mutually inferred function return signatures; query cycle independent of body values. |
| scaffolding/tests/semantic_invalid/decltype_layout_cycle.tower | Recursive by-value struct exposed through pointer field query; nominal identity alone cannot satisfy layout. |
| scaffolding/tests/semantic_invalid/decltype_parameter_cycle.tower | Two parameters infer from each other in one signature; owning declaration matters. |
| scaffolding/tests/semantic_invalid/decltype_parameter_field_cycle.tower | Function return field and Record field query cycle through parameter; shared graph path required. |
| scaffolding/tests/semantic_invalid/decltype_type_field_cycle.tower | Generic nominal field captures seed whose type depends on instantiated field; construction/inference cycle. |
| scaffolding/tests/semantic_invalid/decltype_unknown.tower | Unknown binding remains diagnostic in unevaluated query; no evaluator needed. |
| scaffolding/tests/semantic_invalid/enum_address.tower | Enumerator value has no addressable storage; raw pointer formation still needs an lvalue. |
| scaffolding/tests/semantic_invalid/enum_duplicate.tower | Explicit duplicate numeric member is invalid under enum contract. |
| scaffolding/tests/semantic_invalid/enum_index.tower | Nominal enum cannot silently become integer array index. |
| scaffolding/tests/semantic_invalid/enum_mix.tower | Separate nominal enums with same representation cannot assign implicitly. |
| scaffolding/tests/semantic_invalid/enum_number.tower | Bare integer zero cannot initialize enum without conversion. |
| scaffolding/tests/semantic_invalid/enum_operation.tower | Enumerator addition lacks numeric protocol; no implicit representation arithmetic. |
| scaffolding/tests/semantic_invalid/enum_overflow.tower | Implicit next member overflows u8 after 255; preserve numeric fixture boundary. |
| scaffolding/tests/semantic_invalid/generic_body_demanded.tower | Calls all 32 large specializations to exhaust 65,536-node clone budget before execution; repeated calls are intentional source size, not refactorable loops. |
| scaffolding/tests/semantic_invalid/inference_alias_invalid.tower | Alias helper declares local before returning T; historical restricted-shape rejection may be superseded by general type-value execution. Revalidate. |
| scaffolding/tests/semantic_invalid/inference_cycle.tower | Foundation forward initializer cycle first/second; no runtime read before initialization needed to detect type cycle. |
| scaffolding/tests/semantic_invalid/inference_generic_cycle.tower | Mutual inferred generic-call arguments; tests delayed specialization dependency cycle. |
| scaffolding/tests/semantic_invalid/layout_cycle.tower | Foundation First/Second by-value recursive layout; stable diagnostic path, no pointer indirection. |
| scaffolding/tests/semantic_invalid/literal_range.tower | Foundation u8 value 256 tests exact range boundary; retain data. |
| scaffolding/tests/semantic_invalid/match_break.tower | Match does not grant loop break scope. |
| scaffolding/tests/semantic_invalid/match_duplicate.tower | Overlapping alternatives repeat 2; rejects duplicate match pattern. |
| scaffolding/tests/semantic_invalid/match_range.tower | u8 match subject rejects pattern 256; contextual literal range. |
| scaffolding/tests/semantic_invalid/match_scope.tower | One arm's local is inaccessible to sibling arm; declaration ownership/scoping. |
| scaffolding/tests/semantic_invalid/match_type.tower | Bool match cannot consume integer pattern; exact type policy. |
| scaffolding/tests/semantic_invalid/missing_return.tower | Foundation conditional return without else; nonvoid fallthrough rejection. |
| scaffolding/tests/semantic_invalid/template_origin.tower | Generic return bool incompatible with instantiated i32; instantiation provenance must survive failure. |
| scaffolding/tests/semantic_invalid/while_type.tower | i32 condition is not bool; no implicit truth conversion. |
| scaffolding/tests/semantic_invalid/worker_body_errors.tower | Earlier/later invalid bodies test deterministic source-order selection despite completion order. |
| scaffolding/tests/semantic_invalid/worker_field_errors.tower | Duplicate fields in two records test deterministic field/layout diagnostics. |
| scaffolding/tests/semantic_invalid/worker_first_error.tower | Earlier body resumes after generic prep and then fails; later prepared error must not win. |
| scaffolding/tests/semantic_invalid/worker_generic_errors.tower | Two demanded generic-body failures select first use; declaration/clone ownership must retain diagnostic. |
| scaffolding/tests/semantic_invalid/worker_generic_mismatch.tower | Warm u64 signature followed by mismatched explicit i32/u64 calls; no stale specialization receipt reuse. |
| scaffolding/tests/semantic_invalid/worker_index_errors.tower | Repeated invalid boolean index type queries; deterministic earliest failure. |
| scaffolding/tests/semantic_invalid/worker_later_error.tower | Earlier resumed body succeeds; later generic-argument error is then selected. |
| scaffolding/tests/semantic_invalid/worker_leaf_errors.tower | Independent unknown initializer leaves select unknownFirst. |
| scaffolding/tests/semantic_invalid/worker_operator_cycle.tower | Mutual arithmetic inference cycle needs shared query cycle path, not recursive forcing. |
| scaffolding/tests/semantic_invalid/worker_prefix_error.tower | Deferred stage plus failure during generic statement preparation; releases lexical continuation without losing earlier error. |
| scaffolding/tests/semantic_invalid/worker_suffix_error.tower | Same deferred setup but error after successful generic statement; continuation must not replay or mask suffix failure. |
| scaffolding/tests/semantic_invalid/worker_type_errors.tower | Independent unknown function parameter types select MissingFirst deterministically. |

## Positive staging/type fixture review

All rows use contract P, source review at the initial commit and pending execution.
Preserve cases as inputs to existing graph/cache/Foundation/worker comparisons.

| Path | Reviewed behavior, ownership and disposition |
| --- | --- |
| scaffolding/tests/computed_type_arguments.tower | Arithmetic extents, forward/nested/recursive/indirect/aggregate helper readiness, target widths, module/local captures and lexical shadowing. Vector owner explicitly disposed. Separate first/second capture functions exercise equal-slot/different-declaration identity. Covers skipped trap, runtime capture and helper call; no direct snapshot cancellation assertion. Preserve. |
| scaffolding/tests/type_object_values.tower | Nominal versus alias identity, ordinary local type mutation, branch/loop helpers, type-bearing metadata, shadowing and nested stages. Opaque type identity must survive canonical format/cache; no exposed integer registry. Preserve. |
| scaffolding/tests/statement_queries.tower | Foundation assignment to scalar/pointer/field waits for generic call; ordered step effects must occur exactly three times. Pointer only borrows live scalar. Preserve Foundation surface. |
| scaffolding/tests/decltype.tower | Unevaluated calls/increments must not change effects, lexical shadowing/forward declarations resolve identities; pointer borrows module element. Preserve. |
| scaffolding/tests/decltype_aggregate.tower | Unevaluated null dereference/call produces aggregate type without memory access/effects; layout and nominal copy declarations checked. No guest heap owner. Preserve. |
| scaffolding/tests/decltype_expressions.tower | Shared operator typing, conditional exact types, nested calls and unevaluated preincrement contrasted with one real effect. Pointer arithmetic result never dereferenced. Preserve. |
| scaffolding/tests/decltype_generic_headers.tower | Generic field-dependent headers through delayed seed chain; nested signature queries do not execute comptime trap. Pointer-only recursive Node avoids false layout cycle; ordered bump arguments return 12. Preserve. |
| scaffolding/tests/decltype_headers.tower | Module/header/field readiness, forward parameter types and shadowing; recursive Link requires nominal identity only. Explicit expected sizes and values. Preserve. |
| scaffolding/tests/decltype_layout.tower | Delayed Inner fields must precede outer size/array stride/layout publication; allocation freed by defer, pointer arithmetic checked against size. Preserve. |
| scaffolding/tests/decltype_lazy_body.tower | Invalid unused generic body stays uninstantiated for decltype; runtime/nested staged recursion and mutual recursion exercise demand. Canonical caller excludes unused/missing body. Preserve. |
| scaffolding/tests/decltype_type_fields.tower | Generic nested/recursive nominal fields wait for delayed seed; immediate expression-created types expose valid fields. alloc is solely inside decltype, hence must not allocate. Preserve. |
| scaffolding/tests/comptime.tower | Nested stages, lazy ternary/logical traps, dormant effectful helper and unevaluated stage; four differently sized helper runs. Exact values compared with runtime. Preserve. |
| scaffolding/tests/comptime_flow.tower | Stage-selected return/control flow, nested defer ordering, continue cleanup and runtime observation. Return value precedes cleanup mutations. Preserve. |
| scaffolding/tests/comptime_aggregates.tower | Staged aggregate includes narrow array, signed-zero float, callback identity, null pointer and enum; nested stage and deferred copy require ordinary ABI lowering. Exact bit/value assertions. Preserve. |
| scaffolding/tests/known_bindings.tower | Immutability distinct from known value; mutation/address escape/effectful initializer preserved. Runtime argument in untaken ternary/logical/pointer branches is not captured; lazy cycle is dormant. Existing module capture support contradicts old negative fixture assumption. Preserve. |
| scaffolding/tests/known_binding_library.tower | Exported entry uses inferred module/local values without module initializer; helper mutation confined to invocation. Exact constants validate static library readiness. Preserve. |
| scaffolding/tests/known_parallel_unit.tower | Exported kernel combines runtime input with inferred/staged dependency and untaken capture; suitable parallel-unit input, no overlap proof itself. Preserve. |
| scaffolding/tests/known_cycle_a.tower | Imports B and uses its initialized Base through helper; cyclic imports preserve dependency-first setup and original declaration identities. Review paired with B. Preserve. |
| scaffolding/tests/known_cycle_b.tower | Imports A but reads Increment only inside helper; Base initializer literal avoids execution cycle. Preserve paired legal cycle. |
| scaffolding/tests/known_cycle_bad_a.tower | Cyclic module has effectful observed initializer modifying count; cannot treat literal-looking storage as universally known. Negative caller required; preserve. |
| scaffolding/tests/known_cycle_bad_b.tower | Imports effectful A and exposes observed through helper; paired cycle/effect proof boundary. Preserve. |

## Pending acceptance work

Review all remaining files, reconcile full cross-lane roster, then run current
public-bootstrap repros before changing stale expectations. D2 owns initial heavy
slot; D1 has no heavy jobs. Generic query/cancellation/owner/frame coverage and
measurement harness remain under review. No production change, sanitizer claim,
release claim or runtime performance claim is made by this document.

## Examples and editor/lexer inputs

These 15 files were read completely at the initial commit. No compiler scheduler
or world is implemented here. UI syntax/parse lessons are not executable program
acceptance cases; preserve their intentional role. Current-run validation pending.

| Path | Reviewed behavior, storage and disposition |
| --- | --- |
| scaffolding/examples/collections.tower | Stack/queue own separate growing buffers, preserve failed push storage and dispose both after ordered pops. Teaching demo prints allocation failure rather than supplying process-status acceptance; runner must check expected output. Preserve. |
| scaffolding/examples/execution.tower | Increment replacement expands to ordinary ordered assignments; pointer alias mutates same total, expected 15 then 16. No separate evaluator or ownership transfer. Preserve. |
| scaffolding/examples/foreach.tower | Bedrock-only custom for/foreach grammar, replaced incrementally; explicitly parse-only without executable replacement. Not the library borrowed-iteration API and not invalid code to repair. Preserve. |
| scaffolding/examples/functions.tower | Forward recursive factorial, then pointer update of result; shared live module storage, expected 720/721. No heap allocation. Preserve. |
| scaffolding/examples/increment.tower | Foundation CoreCall extension implements pre/post increment via single pointer argument and effect order; ordinary calls, no intrinsic ++ needed. Expected 5/6/7/7/9. Preserve published lesson/import. |
| scaffolding/examples/inference.tower | Forward calls infer locals, explicit u32 result constrains literals; pointer aliases answer and mutates it from 42 to 43. Preserve exact types/effect order. |
| scaffolding/examples/match.tower | One selected arm and local scope for each body, values 0..3 produce 10/20/20/30. Small serial lesson, not scheduling evidence. Preserve. |
| scaffolding/examples/memory.tower | Raw owned byte buffer grows via realloc with overflow guard and old pointer retained until success; frees buffer once. Fixed array borrowed pointer remains live. Explicit no implicit bounds contract. Preserve. |
| scaffolding/examples/replacements.tower | Bedrock grammar transformations retain grouped/repeated capture relationships, nested foreach and twice expansion. Parse/expansion lesson, not runtime loop implementation. Preserve. |
| scaffolding/examples/structs.tower | Shallow live Pair and field aliases, pointer mutation demonstrates same storage; values 42/22/7. No clone/move implication. Preserve. |
| scaffolding/examples/templates.tower | Ordinary type-producing buffer/stack with inline fixed storage; generic inference and explicit count preconditions, no heap disposal needed. Preserve. |
| scaffolding/examples/tokens.tower | Incremental token replacement, UTF-8 identifiers, regex priority and backtick strings affect only following source. Ordered grammar declaration case, not executable numeric program. Preserve. |
| editors/tower/tests/grammar.tower | TextMate scope assertions cover grammar regex/literal/division boundaries and historical `as`/`@` spellings; not a compiler conformance fixture. Preserve offsets/annotations; potential current-grammar coverage gap belongs to editor transport owner. |
| editors/tower/tests/highlighting.tower | Scope assertions include incomplete string recovery, imports, typed declarations, guards, shifts and comment state. Deliberately incomplete/unresolvable input must not be executed as valid Tower. Preserve. |
| playground/tests/fixtures/foundation_legacy.tower | Historical saved lexer data consumed by foundation-storage.test.mjs and browser/foundation-upgrade.spec.mjs to test upgrade, persistence and preservation of edits. Its legacy `as` syntax and missing import are intentional migration input; keep exact bytes. |

## Scheduler/interpreter ownership harnesses

Source review at the initial commit, current executions pending. These tests use
shared production graph/pool/entity APIs, not another scheduler. Explicitly note
where sequential dispatch simulations or serial fault injection cannot demonstrate
concurrency. Remaining harnesses are not covered by these rows.

| Path | Reviewed storage/world/scheduling/ownership evidence and disposition |
| --- | --- |
| scaffolding/tests/interpreter_call_query.tower | Explicit one-worker world; original callee and distinct snapshot on ordinary Foundation entities. Argument mutates caller once before waiting, repeat attempt preserves steps, publication yields 43, failed publication diagnoses, disposal while pending releases world. Missing world-null guard is fatal harness setup, not recoverable compiler policy. Preserve; production producer end-to-end evidence comes from computed fixture separately. |
| scaffolding/tests/interpreter_invocation.tower | Two IMInvocation scratch states share frozen Foundation input, interleaved budgets 1/3 yield 0/42; uninitialized local, zero fuel, invalid global parameter and stage print tested. Mutations only after completed/disposed invocations. Legacy tower_node_create default-world boundary remains; interleaving is not real threads. Preserve with explicit gap. |
| scaffolding/tests/work_resume.tower | Shared WorkGraph stack owner disposed per trial; retained tickets reject old dispatch/revision after suspend/yield/reset, diamonds deduplicate producer, discovered read claims exclude writer and allow reader. Failed/cancelled producers and exact cycle paths checked; unused query not demanded. Sequential protocol test, not transport drain evidence. Preserve. |
| scaffolding/tests/work_graph.tower | 1,024-subject chain/diamond and fan-in numeric reference, profile mismatch, reverse completions, failures, cycle prefix and undemanded work. Subject arrays live until graph disposed on success. Early failure exits leave graph allocations until runner teardown; candidate cleanup improvement, not normal-path leak or real overlap evidence. |
| scaffolding/tests/work_access.tower | Explicit domain/component/range claims distinguish shared reads/disjoint writes/structural exclusion; revision mismatch, cancellation, zero/overflow ranges rejected. Coordinator-only graph mutations. Preserve. |
| scaffolding/tests/work_order.tower | 513 producers across admission windows complete in reverse; ordering only after all claims returned, then stable request order and stale dispatch rejection. D1 patch0b61eedc on4e661 adds copied revision/profile completion rejection while retaining the valid running ticket and its subsequent yield/readmission/completion. Shared native/Wasm work_pool actually imports this fixture; no new graph, allocation or owner. Deferred graph/vector cleanup. Focused native comparison and real pool overlap/drain pass; D2 independently reviews the exact patch. Integrated Wasm execution remains pending. The graph assertions themselves are serial. |
| scaffolding/tests/work_named.tower | Real named worker pool and signal barrier; per-job thread IDs distinct from coordinator and peers. Jobs/results read after receive, allocations/signals released after joins; utility_check aborts on assertion. Uses production transport, no single-owner allocator counters. Preserve; no latency/speed measurement. |
| scaffolding/tests/work_pool.tower | Real thread barrier, repeated disjoint result slots and simultaneous allocation/fill/free (8 MiB first round), thread identity assertions and capacity-limited lanes. Explicit 77 on single-lane host. Normal success drains before freeing signals; early return failures can leave admitted stack-backed jobs undrained. Candidate harness ownership fix; do not call existing pass race proof. |
| scaffolding/tests/work_instrumented.tower | Serial portable host explicitly required; owner-thread/order and repeated allocation-failure sweeps check exact live counts, allocation sequence and successful prefix. Local job remains alive through receive; deferred close. Valuable OOM evidence only, not threaded sanitization. Preserve. |
| scaffolding/tests/work_observe.tower | Observing published input preserves running ticket/exclusive claim; rejects pending/self/stale revision/profile/dispatch and deduplicates reads. Graph vectors explicitly disposed. 8192 versus 256 dependency edges is a structural micro-measurement, not compiler speedup. Preserve. |
| scaffolding/tests/work_graph_scale.tower | 64,000 subjects owned in contiguous array, chain/root dependencies deduplicate and exact completed count checked. Sequential native throughput fixture; success releases graph/subjects, failure returns retain allocations until process teardown. Coordinate measurement use with D2; no parallel claim. |
| scaffolding/tests/compiler_work_owner.tower | CompilerWork owns distinct entity subjects; bounds/cancelled receipts and every constructor allocation failure swept with exact buffer return. Single-owner allocator instrumentation, no real worker overlap. Preserve. |
| scaffolding/tests/compiler_buffer_owner.tower | Explicit captured allocator ownership/alignment for sizes 0..65 across legacy/new free APIs; overflow/OOM/null cleanup. No global compiler allocation counter substitution; harness diagnostic counter is intentionally serial. Preserve. |
| scaffolding/tests/compiler_batch.tower | Typed fixed array guarded around transformed range, independent wrapping reference/checksum and empty range. Guest shared-buffer bounds fixture; imported production kernel is sequential code input, so “parallel” name proves no overlap. Preserve. |
| scaffolding/tests/lr_work_main.tower | Native runner rejects absent production worker transport and unknown suites. Query smoke covers widths 4/8, budgets 1/4 via shared evaluation fixture; other focused suites are explicit branches. Test entry owns no worker input beyond called functions. Current query loop omits budget 2 despite SteamDeck two-lane policy; assess measured focused runner need before edits. |

## ABI, modules and transport fixtures

Source review at the initial commit; runtime/target validation pending. Unless
stated otherwise these are contract P inputs, not compiler worlds or schedulers.
Foreign pointers and callbacks obey their explicit target ABI; no alias or safety
properties are inferred from their Tower spelling.

| Path | Content, ownership and disposition |
| --- | --- |
| scaffolding/tests/attribute_cycle_a.tower | Cyclic import exports nominal attribute and staged constructor; metadata attaches to own variable/function declarations. Tests binding across module cycle; preserve paired B. |
| scaffolding/tests/attribute_cycle_b.tower | Attribute constructor imported through cycle annotates initialized Base; must preserve nominal attribute owner rather than spelling. Preserve. |
| scaffolding/tests/distribution_invalid.tower | Deliberate bool-to-i32 error after UTF-8 comment, preserving source byte/line diagnostic provenance. Preserve invalid input. |
| scaffolding/tests/distribution_library.tower | Separate exported doubling function, scalar ABI only; no runtime global initialization needed. Preserve. |
| scaffolding/tests/distribution_link.tower | Consumes separate library export and prints 42; actual link/run needed, interpretation alone cannot establish cross-object ABI. Preserve. |
| scaffolding/tests/distribution_program.tower | Shared release fixture allocates two elements, doubles 21, prints 42 and frees. Assumes successful allocation; does not test OOM. Preserve. |
| scaffolding/tests/backend_foreign_calls.tower | Quoted C++/C ABI declarations compose to 42; link against separate Tower provider. Preserve exact foreign signature spelling. |
| scaffolding/tests/backend_foreign_library.tower | Implements those exports in Tower, no native foreign logic seed. Scalar argument/result ABI. Preserve. |
| scaffolding/tests/backend_foreign_surface.tower | Optional ForeignName grammar maps unquoted ABI syntax to same declarations/calls; separators deliberately preserve lexical word boundaries. Legacy `when expected as` token spelling requires current caller validation, not mechanical rewrite. |
| scaffolding/tests/backend_import_constants.tower | Unsigned 64-bit extrema reconstructed across branches/functions, narrow wrapping loop and null pointer bits. Independent exact values prevent SSA-local constant reuse bugs. Preserve. |
| scaffolding/tests/backend_popcount.tower | Bit-pattern idiom compared against bit-by-bit reference for all bytes and repeated wide patterns; checks optimized ctpop reconstruction, zero/full-width edges. No memory ownership. Preserve. |
| scaffolding/tests/backend_stack.tower | Two escaping 64 KiB arrays force real large-frame/Windows probe behavior, observable foreign zero-length write prevents shrinking; expected zero. Host execution required. Preserve. |
| scaffolding/tests/compiler_support_program.tower | _start checks archive-selected entry/second/tail/native_needed/batch_extra against 42; abort on mismatch. Shared whole/lazy archive input, no generated instruction seed. Preserve. |
| scaffolding/tests/cross_target_program.tower | Raw buffer allocation, fixed-array alias, pointer width and pointer mutation checked with traps. Direct realloc assignment loses old owner only on fatal OOM path; not recoverable-container example. Preserve; target run, not link-only, required. |
| scaffolding/tests/elf_hosted_arrays.tower | Tower builds data-only relocatable init/fini arrays referencing real Tower functions. Independent owned byte buffers disposed with defer, ordered numeric section fixtures retained. Machine argument currently treats every non-arm64 string as x64; potential CLI strictness gap, coordinate B2. |
| scaffolding/tests/elf_hosted_program.tower | Ordered preinit/init/fini effects through argv/environment; libc allocation, unwind depth, dynamic exported callback. Raw ABI pointers are scoped to callbacks; realloc failure path loses old allocation only before process failure. Preserve target behavior, not portable interpreter claim. |
| scaffolding/tests/elf_link_library.tower | Separate exported scalar answer 42, no initializer/runtime requirement. Preserve. |
| scaffolding/tests/elf_link_program.tower | Linked callback address, module array/global init and allocate/free produce 42/50/42; covers data and function relocations. Preserve. |
| scaffolding/tests/function_foreign_client.tower | Cross-object callback argument, returned callback and signed i8 edge invoke typed signatures; prints zero on all matches. No captured environment. Preserve. |
| scaffolding/tests/function_foreign_provider.tower | Separate Tower provider returns function identity and invokes callbacks, including narrow signed ABI. Preserve. |
| scaffolding/tests/guest_windows_library.tower | Import-only test link composition for guest runtime/Windows bytes/output. No new state/scheduler; target-specific foreign boundary is deliberate. Preserve. |
| scaffolding/tests/foreign_fixture.tower | Independent provider for borrowed-buffer read/write, alias identity, struct-pointer layout, scalar widths, strings and callback to caller. Never frees caller memory; explicit count bounds. Preserve. |
| scaffolding/tests/linking.tower | Allocates shared values, sends borrowed pointers and PointerBox to foreign fixture, checks alias/layout/scalars/callback then frees once. Expected output caller required. Preserve. |
| scaffolding/tests/narrow_foreign_library.tower | i8/i16/u16 wrapping add exports test narrow extension ABI, no heap/state. Preserve numeric types. |
| scaffolding/tests/parallel_unit.tower | Dense scalar transform/checksum on borrowed array explicitly permits aliasing and avoids noalias/fast-math claim. Bounds supplied by caller; source for optimization/unit tests, not evidence of threading itself. Preserve. |
| scaffolding/tests/target_runner_exit.tower | Fake selected Wine transport returns real child status 77; must be counted as failure rather than optional-platform skip. Explicit argument-count check and output. Preserve negative transport fixture. |
| scaffolding/tests/wasm_link_program.tower | Real relocatable _start calls separate provider, checks integer/data relocations and host puts return with abort. Host only instantiates/invokes. Preserve. |
| scaffolding/tests/wasm_link_library.tower | Separate add and static-message exports preserve cross-object call/data relocations; borrowed literal lifetime module-owned. Preserve. |
| scaffolding/tests/pe_link_program.tower | Callback/global init and checked allocation combine with 64 KiB borrowed frame probe; trap on mismatch, free allocation. Windows execution requirement explicit. Preserve. |
| scaffolding/tests/pe_link_library.tower | Separate answer/probe functions force caller frame escape and last-byte access; caller owns storage. Preserve. |
| scaffolding/tests/macho_link_program.tower | Foreign callback, checked 64 KiB frame/heap storage, unwind depth and imported write address. Frees allocation; Mac execution needed, linked bytes insufficient. Preserve. |
| scaffolding/tests/macho_link_library.tower | Separate frame borrower and synchronous unwind callback owns stack count through call; opaque context cast confined to foreign API. Preserve. |
| scaffolding/tests/imports/left.tower | Imports shared module and adds one; dependency-first visible binding and grammar, no independent scheduler. Preserve import-path fixture syntax. |
| scaffolding/tests/imports/main.tower | Diamond imports left/right, reads shared constant via helpers and compares right to 42; tests single module identity/order. Preserve. |
| scaffolding/tests/imports/right.tower | Exact quoted relative filename reaches shared module and adds two; keep spelling to test exact import contract. |
| scaffolding/tests/imports/shared.tower | Supplies language grammar, initialized SharedAnswer and accessor; one shared declaration identity for import diamond. Preserve. |
| scaffolding/tests/worker_modules/left.tower | Alias-visible seed/marker, field-dependent read header and unused invalid generic body; body must remain dormant for decltype. Nominal box stamp width differs from right. Preserve. |
| scaffolding/tests/worker_modules/main.tower | Aliased modules, signature-local shadow of alias, delayed field queries and staged helper; checks separate nominal box layouts. Local Item stays alive through helper call. Preserve serial/parallel comparison input. |
| scaffolding/tests/worker_modules/right.tower | Own seed/marker/Item/box declarations, differing stamp width; lexical module identity must not merge with left by matching names. Preserve. |
| scaffolding/tests/syntax_invalid/match_default.tower | Match missing required final wildcard; deliberate parse rejection, no semantic execution. Preserve. |
| scaffolding/tests/syntax_invalid/while_braces.tower | Unbraced loop body violates Tower grammar; deliberate parse rejection. Preserve. |

## Stress producers and focused declaration inputs

Read at initial commit. Stress entry files delegate to a single Tower producer;
the generated program's compile/runtime checks belong to existing harnesses.
Changing syntax workload size to runtime loops would invalidate the intended
compiler budget/window coverage. No timing or real-overlap claim from these files.

| Path | Reviewed behavior, ownership and disposition |
| --- | --- |
| scaffolding/tests/stress_sources.tower | One owned ByteBuffer per generation, deferred dispose, explicit 64 KiB output check and checked platform write. Named depths, generic/field/body windows and wide registers; generated forward reads compiled only where uninitialized execution would be invalid. Some wide producer output omits language import because caller supplies grammar context; retain until caller audit. No compiler state duplication. Preserve. |
| scaffolding/tests/stress/annotated.tower | Emits 1,024 forward decltype declarations ending in bool; signature dependency depth, no runtime requirement. Preserve. |
| scaffolding/tests/stress/annotated_operators.tower | Same depth with arithmetic type queries and u64 terminal; shared operator inference. Preserve. |
| scaffolding/tests/stress/comment_functions.tower | Emits 128 commented functions through shared buffer; tests provenance retention/formatting. Preserve. |
| scaffolding/tests/stress/generic_explicit.tower | Emits 256 explicit generic initializer dependencies; compilation-only forward read workload. Preserve. |
| scaffolding/tests/stress/generic_inferred.tower | Same chain via inferred generic arguments; distinguishes inference admission. Preserve. |
| scaffolding/tests/stress/generic_workers.tower | Sixteen independent generic bodies with staged conversions/defer and post-barrier array layout construction; actual worker harness must prove overlap. Preserve. |
| scaffolding/tests/stress/inferred.tower | 1,024 forward initializer type dependencies; must not execute uninitialized reads as correctness evidence. Preserve. |
| scaffolding/tests/stress/inferred_operators.tower | Arithmetic inference variant terminating u64; shared query depth, same execution restriction. Preserve. |
| scaffolding/tests/stress/llvm_functions.tower | Emits 300 named functions and endpoint calls for LLVM/backend width; no guest heap owner. Preserve. |
| scaffolding/tests/stress/type_fields.tower | 256-declaration delayed seed behind generic field/nominal layout checks; unevaluated allocation must not run. Preserve. |
| scaffolding/tests/stress/wide_declarations.tower | Emits 350 independent initialized variables and final output; compilation breadth reference. Preserve. |
| scaffolding/tests/stress/wide_functions.tower | Emits 300 functions with calls to all; body-demand breadth and final result. Preserve. |
| scaffolding/tests/stress/wide_registers.tower | 64-argument nested call graph exceeds compact-register easy cases; deterministic generated order. Preserve. |
| scaffolding/tests/stress/window.tower | 260 generic-using functions cross bounded body admission windows; sum observes each call once. Preserve. |
| scaffolding/tests/stress/workers.tower | Sixteen independent bodies, local address aliases/defer/stages and typed record headers; output checks lazy nested stages and signed minimum. Preserve; transport evidence separate. |
| scaffolding/tests/generic_body_lazy.tower | Imports large fixed syntax corpus but asks only signature-derived value31; canonical output should omit unused body clones. Preserve. |
| scaffolding/tests/generic_body_budget.tower | Explicit entity store/root, shared GenericContext and instances; tests root-excluded exact/insufficient estimates, shared cached cost and no body materialization. Deep tree torn down leaf-first; verifies zero entities/components before store disposal. Preserve. |
| scaffolding/tests/declaration_continuations.tower | Nested explicit/inferred generics, unevaluated/taken argument effects, staged lazy branches and delayed field header; exact 0/2 effects and values. No heap owners. Preserve. |
| scaffolding/tests/declaration_inference.tower | Generic inference across type aliases/pointers/reordered parameters plus unevaluated and ordered calls. Pointer aliases remain live, untaken nested trap remains dormant. Preserve. |
| scaffolding/tests/declaration_operands.tower | Compound field/index/address queries, arrays and null-guarded fallback; effects must stay zero for unevaluated/untaken operands. alloc only queried, no heap leak. Nested stages/conversions checked. Preserve. |
| scaffolding/tests/enum_expressions.tower | Nominal enum ternary/guard/default/staging and full-width signed/unsigned representation boundaries, deferred conversion. Null pointers only guarded; exact bit values preserved. Preserve. |

## Entity ownership and production unit harnesses

Reviewed implementation imports and full test bodies at the initial commit. These
are source receipts; executions remain pending in D1. Store/page/table assertions
establish distinct properties: stable aligned payloads, amortized allocation and
derived archetype membership must not be conflated with fully packed SoA payloads.

| Path | Content review, evidence boundary and disposition |
| --- | --- |
| scaffolding/tests/entities.tower | Explicit store, nominal payload type, named containment and dense type-query index; verifies original payload address survives another attachment, releases owner/type and checks empty disposal. Output-driven small fixture, no concurrency. Preserve. |
| scaffolding/tests/entity_store.tower | Test-owned lifecycle callback validates payload/owner/type reverse identity; attach/detach/replacement reference transfers and ordered names, repeated component identity, finalizer lifetime. Exact serial live allocation baseline each block. Preserve; no worker-global use of instrumentation. |
| scaffolding/tests/entity_views.tower | Two stores and nested pins; structural changes blocked, existing component access allowed, bounded query unchanged on rejection. Zero-reference entities retained until last view, retain/release de-duplicates pending destruction. Query pointer array is an index, not packed payload; no payload mutual-exclusion assertion. Preserve. |
| scaffolding/tests/entity_tables.tower | Archetype signatures independent of add order, row/column component identity, disjoint ranges, cached published membership while leased private arrays grow. Publication after views, stable survivor payloads, discard, deferred destruction and reserved empty-table transition all checked. Index/layout invariants only, no cache-speed claim. Preserve. |
| scaffolding/tests/entity_pages.tower | 150 small 64-aligned payloads amortize pages, verify stride/identity and unchanged addresses after holes; 32 KiB/256-aligned payload uses sparse allocation. Distinct stage pools publish without stale pool links; discard releases private links; exact finalizer counts. Preserve; fragmentation bounds not benchmarked here. |
| scaffolding/tests/entity_stage_ownership.tower | Queued repeated references hold before closing last view, hold idempotent, published/discarded finalizers release exact ownership. Reject foreign/private references and duplicate/new existing names without partial publication. Explicit stores fully disposed. Preserve. |
| scaffolding/tests/entity_page_faults.tower | Serial allocation failure sweep across 130 attachments and page publication; retry preserves shared lengths and every earlier payload address/value, exact baseline cleanup. Amortization count <260 is bounded structural evidence, not all allocations/RSS or threaded sanitizer coverage. Preserve. |
| scaffolding/tests/entity_stage_faults.tower | Explicit compiler world tests named creation, copied syntax expansion/splice ownership and stage publish failure independently. Queued references unchanged on worker copy, held once before view close, retry does not double-retain; finalizers return exact allocation count. Serial only. Preserve. |
| scaffolding/tests/entity_table_faults.tower | Query-plan, removal transition and leased publication failures retain old membership/payload identity; retries publish complete plans/31 rows and release every allocation. Views closed before structure/publish. Serial injection, no race instrumentation. Preserve. |
| scaffolding/tests/entity_registry.tower | Legacy default-world API intentionally checks compiled Foundation components and shared registry use identical payloads; root/program release restores entity/component counts. Inline source lacks language import, requires repro against harness module setup before judging stale. No explicit-world coverage claim. |
| scaffolding/tests/body_continuation.tower | Broad ordinary source regression: nested lexical/control/query continuations, exact runtime/deferred effects, shadowed header binding, once-only condition/callee/argument evaluation, staged aggregates/signatures/arrays/types. Borrowed stack-backed vector is not disposed; heap vector owners are disposed. Raw self-address initializer is deliberate legal Foundation-level behavior. Large fixed body matrix is coverage input, not scheduler implementation or measured overlap. Preserve. |
| scaffolding/tests/evaluation_query_checks.tower | Explicit worlds with shared SemanticContext/WorkGraph and ordinary Foundation fixtures; bodies wait for headers, later window can progress, lowered root dispatch stays one, cycles only at finish/quiescence, cancellation releases borrows. Dynamic executed stage dependencies prepare once while unused stage stays unstarted, cross-phase body/declaration handoff resumes same graph. Context/workers disposed before program/root/world. Preserve; real transport verification required. |
| scaffolding/tests/frontend_units.tower | Copies caller source then destroys original, rejects NUL/config mutation after admission, verifies isolated worlds and nested budgets. Width 4/8 canonical comparison, staged answer reference, first failing unit, syntax/grammar failures and cancellation before/after dispatch. Borrowed program/interpreter/format output consumed before deferred batch close. No barrier-based overlap claim in this file alone. Preserve. |
| scaffolding/tests/editor_units.tower | Mixed compile/document batches, configuration bounds, unpublished/failed/cancelled result suppression and serial/parallel user-facing JSON comparison. Only documented numeric debug identities omitted; owned snapshots disposed, documents borrowed while batch lives. Cancellation may correctly be no-op after completion. Preserve. |
| scaffolding/tests/backend_units.tower | Explicit frontend owner/backend lease, rejects competing owner/invalid count, checks object bytes across serial/parallel and streamed budgets. Signal observer holds one frontend until distinct LLVM worker enters; timeout catches whole-phase barrier. Separate outputs hidden on failure, retry and cancel drain, backend closed before frontend. Captured observer fields read after joined steps; production allocator. Preserve. |
| scaffolding/tests/compiler_work.tower | World-owned batch entity subjects point into same WorkGraph; bounded admission/refill, revision/profile/duplicate/cancelled receipt rejection and earliest failure across reverse completion. Last case distinguishes diagnostic settled from still running work and explicitly cancels before close. Sequential protocol test; peak two is not transport concurrency. Preserve. |

## Storage, allocation and body-matrix harnesses

Source review at `6282238779034442e0578d76b921ca117df819f1`; no new execution
receipt. Failure-injection counters are deliberately single-owner. Native/wasm
allocator fixtures test the stated ABI and ownership, not general race freedom.

| Path | Content review, evidence boundary and disposition |
| --- | --- |
| scaffolding/tests/body_runs.tower | Full body matrix compares exact runtime output and canonical formatting across pointer widths 4/8 and budgets 1/2/4/8; focused type/control/body smoke selectors reduce unrelated work. Failed semantic cases check exact diagnostics at budgets 1/4. Batch/interpreter/format owners close explicitly. Root source at line 529 lacks a language import; reproduce before migration, preserve diagnostic and output contracts. |
| scaffolding/tests/storage_api.tower | Test ABI declarations expose source snapshots, component-backed parser/Foundation payloads, cloning and serial allocation counters. ByteBuffer/vector cast is explicit retained-layout boundary; opaque node/session pointers belong to legacy API, no new world or authoritative graph. Preserve. |
| scaffolding/tests/storage_main.tower | Enforces unavailable threads/capacity one before global fault injection, installs host syntax from owned DriverRequest, explicitly detaches module-cache slot for legacy no-import fixtures. Deferred cleanup keeps request alive through all suites. This setup explains entity_registry inline source; verify runtime before declaring it stale. Preserve. |
| scaffolding/tests/compiler_storage.tower | Snapshot copies survive caller mutation/reset/destruction; UTF-8 byte coordinates, embedded NUL, overflow, alias-safe name/list moves, owned vectors versus borrowed edges, stable component identity and named 600-node clone paths. Allocation sweeps check atomic failure and exact live baseline. Warm legacy registry indexes explicitly; no independent IR or threaded access. Preserve. |
| scaffolding/tests/storage.tower | Public storage example asserts self-appending bytes, bounded arena reset/address reuse and map update/miss/count through printed oracle. All successful owners disposed; borrowed aliases remain within owner lifetime. Sequential library semantics, not ECS packing evidence. Preserve. |
| scaffolding/tests/allocator_glue.tower | Actual runtime alloc/realloc overflow, one-shot failure, preserved input, zero-size behavior and target alignment checked against instrumentation ABI; host allocation deliberately bypasses counters. Separate 640,000-allocation checksum workload supports alternating implementation comparisons, not concurrent allocation evidence. Nonzero errors stop process; no admitted worker borrows. Preserve. |
| scaffolding/tests/allocator_wasi_entry.tower | Necessary Tower wrapper exports literal wasi-libc argc/argv symbol and delegates same allocator test; no duplicate allocator or state. Preserve ABI name. |
| scaffolding/tests/allocator_wasm.tower | Explicit wasm32 heap growth fixture with fixed initial/max-memory contract; verifies alignment, byte preservation, free/coalescing/reuse and failed overflow/growth leaving cursor/free-list/limits untouched. Rejects claiming another context's grown suffix. Direct memory intrinsic is target-specific by design; single context, no concurrent allocator proof. Preserve. |

## Execution, canonical reconstruction and legacy fixture boundaries

Source receipts at `6282238779034442e0578d76b921ca117df819f1`. Coordinator reports
L1 reproduced the core suite's first missing-import rejection and owns migration
of execution_cases/core_cases plus focused selector work in execution_main. D1
has not run that suite; the remaining literal-source hypotheses below are not
newly verified failures. Canonical Foundation is the semantic storage contract;
structural comparison/fingerprints below are additional test evidence only.

| Path | Content review, evidence boundary and disposition |
| --- | --- |
| scaffolding/tests/execution_support.tower | Owns no secondary graph: session helpers compare graph/fast output, exact errors/offsets and target-memory bytes; retain root to prove close releases once and is idempotent. Foreign callbacks use explicit machine, mutate only target memory, surface failure and reallocation. Session-prefix cast/opaque module pointer are retained ABI boundaries. Never insert implicit language imports here. Preserve. |
| scaffolding/tests/execution_world.tower | Two independently seeded worlds/modules compile staged generic/decltype source, compare graph/fast result, reconstruct canonical package into second world, reject mismatched environment/world, destroy first and prove second remains usable. Sessions close before modules/world; no host-global semantic identity assumption. Preserve. |
| scaffolding/tests/execution_graph.tower | Test-only ordered entity traversal replaces addresses with deterministic traversal IDs, hashes fields/edges/types/lists and asserts edges stay in owned tree. Historical scalar-registry projections are named explicitly. Linear lookup/recursive evidence cost is not compiler storage design; no alternate semantic interchange. Preserve; hash equality is supplemental, not collision-proof equivalence. |
| scaffolding/tests/execution_semantic_cases.tower | Explicit valid/invalid semantic sources, exact diagnostics/offsets, and historical integer/float/current fingerprints document binding/layout changes. Literal sources lack imports at baseline; do not weaken negatives or update fingerprints blindly. Full table reviewed; migration needs focused runtime reproduction and original diagnostic preservation. |
| scaffolding/tests/execution_semantics.tower | Ordered multi-source effects, exact invalid diagnostics/source offsets, zero effects on semantic failure, deterministic graph fields and canonical runtime roundtrip at both pointer widths. Mutual/self by-value cycles demand path diagnostics. Inline sources lack language imports; report to L1/parent before changes. Sessions close per case. |
| scaffolding/tests/execution_packages.tower | Checks canonical encode/decode/re-encode bytes and behavior at both widths; corrupt/truncated envelopes, valid-checksum but mismatched Foundation/cache and embedded NUL must not publish executable state. Literal fixtures need explicit language import migration; coordinate L1's focused package selector. Buffers/cache/session owners disposed. |
| scaffolding/tests/execution_main.tower | Validates explicit focused selector names, seeds host world with owned DriverRequest and dispatches feature suites without claiming skipped matrices passed. Deferred request outlives modules. Core runs differential then independent-world tests; all does not automatically run every separate semantic selector. L1 owns scoped selector edits; preserve coordination. |
| scaffolding/tests/execution_wasi.tower | Wasi command boundary reads bundled Foundation with checked I/O, installs syntax, owns module environment around common execution suite. Host snapshot/diagnostic cleanup explicit; no JIT. Current seed/resource initialization and literal imports require canonical browser/wasi execution evidence, not assumed host equivalence. Preserve pending repro. |
| scaffolding/tests/execution_core.tower | Canonical recompile/fixed point/execution checks plus optional structural comparison; verifies semantics enrich parser entities, generic nominal identity, target layout/inferred widths, grammar expansion and no-effects rejection. Repeated requests check steady entity count. Inline literal sources also lack imports; notify L1 beyond reserved table files. Manual close ordering sound on passing paths; fatal assertion exits intentionally. |
| scaffolding/tests/execution_cases.tower | 26 graph/fast differential fixtures cover left-to-right calls/address-before-value assignment, aliasing copy, recursive frames, foreign mutation, integer wrap/traps, invalid target pointers/free/realloc, output/step limits. Foundation raw invalid memory cases are execution-error tests, not source to sanitize mechanically. L1 owns explicit-import migration after reproduced first failure. |
| scaffolding/tests/execution_core_cases.tower | 22 fixtures cover low-level uninitialized declarations, alias writes, bounded/infinite loops, lazy bodies, name shadowing, initializer cycle, nominal layout, custom grammar and required static errors. Raw Foundation intent and invalid cases preserved. L1 owns explicit-import migration; no broad Tower syntax rewrite. |
| scaffolding/tests/execution_suite.tower | 26 cases across two pointer widths and step budgets 1/7/1000 compare ordinary graph versus private execution cache, bounded cancel for infinite loops, known reference outputs and complete target memory. Heap coalescing/reallocation checks and idempotent close supplement core/package suites. Sequential executor differential is not compiler-worker overlap. Preserve. |

## Value, control and worker-admission fixtures

Reviewed complete files at `6282238779034442e0578d76b921ca117df819f1`; expected
outputs/explicit counters are reference assertions, not newly executed evidence.
These fixtures use ordinary Tower syntax already in the public pin. Runtime
borrows/struct copies never imply ownership transfer or automatic parallelism.

| Path | Content review, evidence boundary and disposition |
| --- | --- |
| scaffolding/tests/inferred_parallel_unit.tower | Independent-unit generic arithmetic kernels receive caller-owned contiguous arrays and exact explicit bounds; inferred type specialization belongs to each compiler world. No shared entity pointers/global generic registry. Preserve for serial/parallel output comparison; file alone proves no overlap. |
| scaffolding/tests/iteration_parallel_unit.tower | Stack vector descriptors borrow external arrays without disposal, mutable foreach transforms and value foreach computes checksum. No structural mutation during borrow and no descriptor escape. Preserve independent-unit admission case. |
| scaffolding/tests/worker_iteration.tower | Two independent function bodies trigger implicit iterator protocol specialization plus comptime inside foreach despite no explicit generic calls/local parameterized type. Owned vector deferred until all calls finish; exact totals/plain result. Necessary admission regression, not runtime-parallel foreach. Preserve. |
| scaffolding/tests/default_initialization.tower | Typed/inferred/default scalar, arrays/recursive-pointer records, generic reset and borrowed assignment plus deferred cleanup and staged default. Exact zero results test worker-ready construction and shared lowering. No resources whose shallow reset would leak. Preserve. |
| scaffolding/tests/defer_scopes.tower | Observable reverse cleanup traces, return snapshot, lexical/global/parameter/record shadow binding, recursive owner frames and cloned local pointers; continue/break/update/match/module exits and skipped registration. Heap free occurs after evaluated return. No trap-unwind promise. Preserve; useful control-smoke companion. |
| scaffolding/tests/for_loops.tower | Evaluate-once initializer, repeated condition, exactly ordered update, continue/break/return/trapping initializer/label header, lexical shadow and generated-name collision. Changing bound deliberately live; pointer iteration stays within allocated owner before free. Foundation operand replacement remains valid. Preserve. |
| scaffolding/tests/language_control.tower | Match subject snapshot and left-to-right effects, alternative arms, nested match/while break and continue, typed full-width constants and definite return. Exact failures/results avoid branch-count-only claims. No shared state across concurrent tests. Preserve. |
| scaffolding/tests/null_operators.tower | Lazy coalescing/logical compound assignment and guarded field/index chains track exact effects, including index and destination once-only evaluation. Every guarded scalar has fallback; no nullable-scalar invention. Pointer owners are live module storage; logical signed shifts preserve width. Preserve. |
| scaffolding/tests/language_enums.tower | Nominal enum storage/implicit numbering, signed/narrow boundaries, generic value identity, conversion of unknown representation and match fallback; pointer/array reads retain exact nominal type. No shared mutable metadata. Preserve. |
| scaffolding/tests/function_values.tower | Typed callbacks in locals/fields/arrays/generics, callee-before-argument mutation, recursive frames, staged function relocation, pointer roundtrip and exact float/narrow/aggregate calls. Struct parameter copied; pointer arguments remain explicit borrows. L1 reports baseline C emitter failure here and owns fail-fast fix; preserve fixture. |
| scaffolding/tests/struct_values.tower | Copy/argument/return snapshots, nested arrays with shallow pointer aliases, recursive and deferred returns, staged computation, destination once-only and lazy aggregate effects. Raw partial initialization deliberately completed before copy; copies do not imply resource clone. Exact failure count. Preserve. |
| scaffolding/tests/named_initialization.tower | Forward nominal/generic constructors, source-order fields, in-place alias-observable writes and default-before-overrides, target/address once-only, nested/generic/deferred/staged construction. Byte scan checks complete zeroed padding; legal raw field writes preserved. Preserve. |

## Shared utility and guest-runtime fixtures

Complete-source receipts at `6282238779034442e0578d76b921ca117df819f1`. Runtime,
external decoder/reference checks and profiles remain pending; generated corpora
are explicitly not self-validating success claims. These are test/reference
implementations in Tower, with foreign calls confined to ABI/I/O boundaries.

| Path | Content review, evidence boundary and disposition |
| --- | --- |
| scaffolding/tests/language_collections.tower | Stack move/self-move and empty-pop preservation; queue wrap/grow/move preserves FIFO, null output/overflow rejected without mutation, pointer element remains borrowed. Successful owners disposed; nonzero assertion results expose failures. Sequential storage behavior only. Preserve. |
| scaffolding/tests/utility_checks.tower | Fail-fast abort with message, exact byte comparison and explicitly state-passed deterministic xorshift for reproducible tests. No global PRNG/scheduler or replacement production utility. Preserve. |
| scaffolding/tests/bytes_oracle.tower | Independent retained-reference byte-buffer algorithm translated to Tower, explicit capacity/growth/alias rules and identical failing/moving allocator ABI. No native seed implementation; reference lives only in tests. Preserve independence rather than refactor into production algorithm. |
| scaffolding/tests/bytes.tower | Single-owner guarded moving allocator with eight tracked slots; 20,000 seeded differential operations compare result, full capacity bytes, allocations and failure atomicity. Self-alias realloc/terminator, out-of-bounds aliases, overflow and final leak absence checked. Global test instrumentation deliberately serial; not race sanitation. Preserve. |
| scaffolding/tests/sha256_checks.tower | Published digest vectors, every split, million-a, non-consuming finish, overflow/null update rejection and 260 deterministic boundary files. Stack state/owned buffers; external sha256sum verification explicitly required beyond internal consistency. Preserve. |
| scaffolding/tests/gzip_checks.tower | Empty/text/binary/repeated-window/random plus bounded optional real corpus; deterministic output and alias/invalid-input publication checked before writing paired raw/gzip files. Deferred buffers; independent decompression required. Preserve. |
| scaffolding/tests/deflate_checks.tower | Seeded size/window/pattern corpus, stored expansion bound, deterministic/aliased compression; independent token construction spans legal RFC length/distance edges, then external ZIP decode must compare bytes. Entry vector explicitly takes three buffers by resetting former owners; finalizer frees each after archive writing. Preserve. |
| scaffolding/tests/guest_runtime_main.tower | Executes common production guest ABI test and prints status, deliberately traps on nonzero so a harness cannot mistake a printed failure for success. Preserve cross-target entry. |
| scaffolding/tests/guest_runtime_abi.tower | Production alloc/realloc overflow, target alignment, byte retention and both overlapping-copy directions over sizes 1..257; frees successful buffers. Shared native/wasm source plus reactor export, no allocator bridge. Preserve. |
| scaffolding/tests/guest_runtime_growth.tower | Wasm-only production memory-size observation proves growth for 160,000 bytes, failed large realloc retains full content, freeing permits reuse without further growth. Explicit 512 KiB host contract; single runtime context. Preserve. |
| scaffolding/tests/guest_runtime.tower | Explicit bounded guest arena tests alias-safe realloc, coalescing, overflow/state preservation and 10,000 seeded live-slot operations; source owner freed only after borrowed heap checks. Numeric formatter checks exact bytes and short-buffer no-write behavior across widths. Serial, no guest JIT or concurrency claim. Preserve. |
| scaffolding/tests/runtime_abi.tower | Production-runtime native/WASI ABI regression with alignment/overflow/content/zero-size/free and observable divide failure. Separate 640,000-allocation checksum benchmark has same mathematical work as instrumentation fixture, but distinct allocator contract. No diagnostic-counter bridge. Preserve. |
| scaffolding/tests/runtime_windows_entry.tower | Explicit UCRT-hosted Tower startup calls shared ABI test then ExitProcess; literal entry name/foreign ABI intentional. No second native startup implementation. Preserve. |
| scaffolding/tests/host_runtime.tower | Explicit memory-state counters and serial buffer failure injection, compatibility between legacy diagnostic and buffer frees, overflow-before-injection and zero-size failures. Driver option ownership/defaults/order/missing values/duplicate input and disposable failures checked before host services. No shared-worker mutation of counters. Preserve. |
| scaffolding/tests/platform.tower | Small output-ABI example verifies valid and invalid stream writes through library boundary; literal length is fixture data. Comment refers historical concatenation while actual imports are explicit. No scheduler/storage change warranted. Preserve. |

## Numeric semantics and independent references

Reviewed at `6282238779034442e0578d76b921ca117df819f1`. Exact literals are test data;
raw unaligned access, Foundation restrictions, signed-minimum negation and strict
floating signed-zero/NaN policy must survive any future migration. No execution
or cross-language performance result is claimed by these source receipts.

| Path | Content review, evidence boundary and disposition |
| --- | --- |
| scaffolding/tests/narrow_scalar.tower | Compact source-emission fixture for i8/i16/u16 wrap, division, masked shifts, widen/bits, raw unaligned store with sentinels and signed pointer index. No heap or capture; traps on failed oracle. Preserve limited-profile purpose. |
| scaffolding/tests/narrow_output.tower | Exact signed/narrow decimal/bit-pattern output reference, including remainder, arithmetic versus logical shift and wrapping negation. No scheduler state. Preserve fixture literals. |
| scaffolding/tests/narrow_foreign.tower | Real host-call boundary checks signed i8/i16 and high u16 parameters/returns; assertions in Tower, callback supplied externally. Preserve ABI-width contract. |
| scaffolding/tests/narrow_floats.tower | Truncating boundary float-to-narrow conversions, signed widening and ordinary staged conversion; exact expected values and trap-on-failure. No relaxed arithmetic assumptions. Preserve. |
| scaffolding/tests/narrow_integers.tower | Exhaustive 256 byte patterns compared with wider arithmetic; integer wrap/divide/shift/negation, nominal mixed-width struct copies, arrays, raw unaligned bytes and owned heap/vector paths. Stable borrow during foreach and explicit disposal. Preserve; threaded compilation coverage comes from harness. |
| scaffolding/tests/integer_negation.tower | Unary operation semantics for unsigned zero/wrap, grouped signed minima, inferred negatives and staged functions; floating negative-zero bits checked separately. No parser-only signed-literal shortcut. Preserve. |
| scaffolding/tests/float_bits.tower | Independent IEEE boundary bit patterns include ties-to-even, subnormal edges, signed zero, infinity, NaN canonicalization/unordered comparison and integer conversion rejection. Direct production operation calls provide numerical reference assertions, not independent implementation proof alone. Preserve. |
| scaffolding/tests/float_reference.tower | Tower emits an independent LLVM arithmetic oracle with runtime hardware operands/noinline/optnone, deterministic 1024-pair samples per width plus cancellation cases, explicit canonical NaN comparison. Owned file state and checked writes; generated LLVM is a required foreign backend reference boundary, no C++ seed. External compile/run still required. Preserve. |
| scaffolding/tests/float_text.tower | Decimal boundary/tie/subnormal/overflow/invalid cases plus 512 seeded finite bit-pattern roundtrips for both widths; exact signed zero preserved. Stack formatting buffer and local random state; trap on mismatch. Preserve. |
| scaffolding/tests/floating_output.tower | Strict deterministic print oracle for f32/f64 decimal, signed zero, infinities, NaN and smallest/largest finite values. Reference resides in caller; preserve. |
| scaffolding/tests/floating_foreign.tower | Browser/foreign addition checks native widths, f32 rounding and signed-zero argument/return bits; no inference of arbitrary foreign numeric semantics. Preserve. |
| scaffolding/tests/floating_point.tower | Typed/inferred literal peers, calls, staged arithmetic, NaN payload versus conversion canonicalization, signed zero, subnormals, modify operations and aggregate/vector storage. Successful vector owner disposed; independent expected results. Preserve. |
| scaffolding/tests/floating_oracle.tower | Historical registry-projection audit compares complete graph fields after explicit omission of newly added scalar kinds, both widths and ordered multifile sources. Not the public interchange; legacy no-import literals require baseline reproduction, and old fingerprints must not be casually refreshed. Preserve pending contract evidence. |
| scaffolding/tests/floating_checks.tower | Graph/cache target-memory differential, canonical/package re-encoding, exact decimal text and worker-budget canonical equality at 1/2/4/8. Explicit conversion traps and malformed type operations; three no-import reject literals require checking struct_value_reject's language setup before migration. Defers close sessions/buffers. Preserve. |
| scaffolding/tests/narrow_checks.tower | Two widths, graph/cache, canonical package and 1/2/4/8 worker comparisons plus exact divide-overflow/zero/conversion traps and invalid literals. Uses shared floating package helper, no duplicate evaluator. Selected no-import rejection strings are intentional Foundation candidates pending caller review. Preserve. |
| scaffolding/tests/integer_negation_checks.tower | Graph/cache/canonical equivalence across widths plus explicit Foundation negative-zero spelling and unsigned-negative rejection versus ordinary Tower wrapping. Do not prefix Tower indiscriminately: low-level language distinction is asserted. Owned sessions close before source buffer. Preserve pending missing-import reproduction. |

## Shared value/type acceptance harnesses

Reviewed at `6282238779034442e0578d76b921ca117df819f1`; executions pending. In
particular, struct_value_reject passes literal source unchanged. No-import
Foundation cases identified above therefore require explicit baseline checks;
changing them to Tower would change their contract rather than repair it.

| Path | Content review, evidence boundary and disposition |
| --- | --- |
| scaffolding/tests/struct_value_checks.tower | Source formatter fixed point, graph/cache exact result, Foundation behavior and 1/2/4/8 canonical comparison. Required nominal mismatch, aggregate equality/conversion/array/foreign ABI/location and runtime-capture rejection; deterministic earliest error via shared helper. Sessions and borrowed buffers live through consumption. Preserve. |
| scaffolding/tests/named_initialization_checks.tower | Shared syntax formatting helper owns session, releases parsed nodes; checks formatted behavior and exact canonical bytes across widths/budgets. Negative missing/duplicate/unknown fields, source order/default position, target inference and void assignment retained. Diagnostics byte-compared across workers, not just regex. Preserve. |
| scaffolding/tests/comptime_aggregate_checks.tower | Staged aggregates graph/cache/canonical comparison at two widths/all four budgets; rejects uninitialized reads, local pointer escape, output effects, recursive stage cycles and forged function reference. Ordinary interpreter/shared values, no test constant folder. Deferred cleanup. Preserve. |
| scaffolding/tests/function_checks.tower | Typed callback fixture through graph/cache/package/Foundation and workers; null call/signature mismatch traps, static wrong arity/types/foreign representation, forged staged references and invalid raw address rejected. Exact owning declarations matter beyond bits. Shared harness helpers reused. Preserve. |
| scaffolding/tests/type_bindings.tower | Forward source-defined primitive/array/function/pointer aliases and nominal struct/enum identity, computed constructors and staged aggregate values. Target sizes checked via ordinary definitions; no ambient registry or address identity. Raw arrays borrowed within frame. Preserve. |
| scaffolding/tests/type_binding_checks.tower | Both widths/engines/canonical workers; replaces tracked types/i32.tower input and proves changed source changes layout/behavior. Computed helper readiness, live-write/alias/defer/generic effects, initialization order/cycles, first-failing helper and opaque type ABI limits covered. Request-local environment disposed after sessions. Supersedes historical missing-helper claim. Preserve. |
| scaffolding/tests/declaration_attributes.tower | Ordinary type/function/variable attributes are nominal aggregate constructor results, including array and typed function reference. Program result independent of metadata storage layout; no mutable type registry. Preserve. |
| scaffolding/tests/declaration_attribute_checks.tower | Inspects metadata components/typed fields/callback declaration and re-parsed Foundation attributes; import cycle preserves known values, widths/workers deterministic. Rejects scalar/duplicate/incomplete/effectful metadata and runtime capture. Distinguishes nominal attribute from representation policy. Preserve. |
| scaffolding/tests/known_binding_checks.tower | Fixed library values leave no runtime declarations, permitted fixed import cycle versus rejected runtime cycle; alias/write/escape/effect/address and owner-frame collision negatives. Graph/cache/canonical workers plus earliest diagnostic; taken dependencies reject while positive file covers untaken. No external constant evaluator. Preserve. |
| scaffolding/tests/generic_registry.tower | Two registries in one store and a third foreign store prove scoped component kinds, specialization ancestry and bounded arguments. Component type survives registry-owner release without retaining dead context; borrowed origin declarations remain explicitly alive, all entities/types drain over 40 repeats. Derived queries are indexes, not parallel payload packing. Preserve. |

## Host/editor world and bounded diagnostic tests

Source reviewed at `6282238779034442e0578d76b921ca117df819f1`; no run receipt.
Opaque handles in these tests cross established host/compiler APIs, while
component kinds and actual semantic identities remain world-owned.

| Path | Content review, evidence boundary and disposition |
| --- | --- |
| scaffolding/tests/host_services.tower | Paths with spaces and both separators, bounded UTF-8 source positions, exact execution JSON and serial allocation failure; binary file write/read preserves embedded NUL and previous output on failure. Fixed temporary basename requires isolated cwd/no overlapping invocation. Preserve harness contract; no threaded instrumentation claim. |
| scaffolding/tests/host.tower | JSON byte escaping, maximal unsigned decimal, aliased append and fail-atomic output; typed host-handle categories reject wrong-kind/duplicate takes, wrap skips occupied IDs, disposal requires empty table. Payload is borrowed stack byte alive until all handles taken. Single-owner tests. Preserve. |
| scaffolding/tests/compiler_scans.tower | Interleaved generic definitions/arity/type arguments and quoted token names exercise instance reuse without decoded-token corruption. Distinct nominal specializations and repeated same type checked through typed pointer/output. No heap/scheduler implementation. Preserve. |
| scaffolding/tests/editor_world.tower | Explicit worlds/budgets/module bindings, selected-token inspection prevents surrounding-function false match, grammar attributes/highlights and incomplete typed completion. Rejects foreign environment/session; second world query survives first disposal, final allocation baseline. Pinned query owners consumed before close. Preserve. |
| scaffolding/tests/semantic_world.tower | Four ordinary interpreter kernels borrow two worlds with distinct component identities; bounded pool admission/drain plus explicit world budget assertions and invocation results. Stage tests keep indexes frozen, publish stable payloads after view close, reject competing leases and discard finalizers. Finite kernels, no barrier proving simultaneous execution here. Nonzero early setup/admission returns bypass resource teardown; retain as explicit failure-cleanup coverage gap for follow-up, not a passing cleanup claim. |
| scaffolding/tests/editor_observations.tower | Compares user-facing typed document/completion bytes at budgets 1/2/4/8 with explicit worlds and retained lexical scopes; transfers snapshot ownership by resetting previous buffer. Completion fixtures intentionally incomplete; two literals lack import and need actual API-contract reproduction before migration. Sessions/query owners close before world. Preserve. |

## Grammar/value examples and revision-input harnesses

Complete-source review at `6282238779034442e0578d76b921ca117df819f1`; source
properties below await runtime verification. Immutable snapshots/revisions are
shared by retain/release, and derived arrays do not replace authoritative entities.

| Path | Content review, evidence boundary and disposition |
| --- | --- |
| scaffolding/tests/forward.tower | Function body depends on later nominal field layout and module storage; assignment precedes runtime read, exact 42 output. No heap/independent graph. Preserve delayed-layout regression. |
| scaffolding/tests/operators.tower | Full precedence/associativity and lazy/left-to-right effects trace, once-only destination/index/compound writes, pointer aliasing, width-masked shifts and wrapping signed minima. Host compares graph/cache/Foundation/LLVM/native/wasm. All scalar/raw storage deliberate; preserve numeric/trace data. |
| scaffolding/tests/increment_builtin.tower | Typed helper definitions for full Tower place-aware increment; caller controls invocation. Separate from smaller teaching grammar; no alternate compiler operator logic. Preserve. |
| scaffolding/tests/increment_rules.tower | Explicit Foundation base incrementally extends CoreCall using CoreLocation capture and ordinary helper calls; return-before/after effects checked by trace. Ordered local grammar boundary matters, not global replacement. Preserve custom grammar fixture. |
| scaffolding/tests/frontend_main.tower | Focused production-API suite entry with explicit editor selector and serial allocation-cleanup baselines; does not reformat entire repository. Calls storage/ownership/world/body/LR/parser tests in order, nonzero on leaked scratch. Generic harness owner D1, B2 coordinates transport export repair. Preserve scope separation. |
| scaffolding/tests/frontend_session_inputs.tower | Explicit-world snapshot reset with owned source/document, retained old provenance, failure sweep preserves old state, pinned document rejects reset and idempotent disposal. Separate module test distinguishes owned refresh from borrowed module graph and checks lifetime after session close. Serial counters only. Preserve. |
| scaffolding/tests/frontend_revision.tower | Copies/sorts names while preserving alternative/token declaration order; immutable append/replace/overlay snapshots, undefined extensions/name conflicts/token limits, ready filtering and retain counts. Every allocating transition swept for failure; empty ready/overlay reuse owner, borrowed views survive source deletion with no per-query allocation. Explicit world drains. Preserve. |

| Path | Content review at 6282238, evidence boundary and disposition |
| --- | --- |
| scaffolding/tests/frontend_diagnostic_revision.tower | Standalone declaration-seed grammar intentionally needs no Foundation; moving a declaration across reset changes diagnostic origin line. Releases parsed roots/session and retained seed revision correctly. Preserve no-import grammar fixture. |
| scaffolding/tests/frontend_host_baseline.tower | Independent world-owned canonical seed text with no Foundation registration, cached reuse, atomic malformed/bounded/NUL baseline rejection and separate borrowed diagnostic lifetimes. Invalid input selects explicit environment without dereferencing it; pinned seed rejects clear, worlds drain independently with exact allocation baseline. Preserve. |
| scaffolding/tests/frontend_session_scan.tower | Incomplete completion parser checks accepted literal/callable tokens, then lexeme snapshot after malformed suffix preserves original cursor/revision/highlights/error. Ordered opaque string spans and snapshot styles survive session reset. Seed-defined custom grammar intentional; no implicit Tower language needed. Preserve. |

| Path | Content review at 6282238, evidence boundary and disposition |
| --- | --- |
| scaffolding/tests/frontend_session_state.tower | Highlight style interning/copy owns stable text independently of source; sweep proves old target unchanged on each failed copy. Session allocation/progress resets cursor/revision/errors/highlights/stats without allocation while preserving owned suffix and baseline pin. World destruction rejected until session released; serial allocation balance. Preserve. |
| scaffolding/tests/frontend_session_format.tower | Formatting requires parsed session, allocation failure preserves empty output, successful result owns text/spans after session death; rejects custom whitespace transformation that changes parse. Existing sessions retain old immutable baseline across invalid/replaced host baseline, while new sessions see new one. Preserve custom seed fixtures and exact diagnostics. |
| scaffolding/tests/frontend_cache.tower | 64-entry immutable grammar snapshot cache, access-sensitive eviction, retained copy after original disposal and bounded insertion-failure sweep. Derived cache references same syntax entities; no alternative grammar authority. Exact serial buffer cleanup before returning errors. Preserve. |
| scaffolding/tests/frontend_pending.tower | Bounded non-NUL names and unresolved term path retain only waiting alternatives, no allocation on repeated introspection; first missing-rule offset/path exact. Constructor failure sweep releases partial names/references; snapshot survives source mutation/deletion, empty input needs no allocation. Explicit world drains. Preserve. |
| scaffolding/tests/frontend_session_view.tower | Views borrow pinned revision arrays without allocating per access, preserve pending/token/keyword metadata and epsilon alternative order; owned highlights survive session/world death. Two worlds remain distinct and all buffers drain. Contextual-token legacy spelling needs actual installed-baseline contract check, not mechanical rewrite. Preserve pending execution. |
| scaffolding/tests/frontend_session_world.tower | Independent module environments/sessions in explicit worlds, copied module update affects only first world, failed import cycle recovers, foreign baseline/root/reset/session rejected without replacing prior source. Environment prevents premature world disposal; second world still parses after first closed. Complete serial allocation baseline. Preserve. |

| Path | Content review at 6282238, evidence boundary and disposition |
| --- | --- |
| scaffolding/tests/frontend_diagnostic_text.tower | Exact insertion/continuation/error text, ambiguous production provenance and bounded display choices; escape/EOF positions and serial allocation sweep preserve borrowed inputs. Final diagnostic ownership transferred then freed. No scheduler or grammar priority substitution. Preserve. |
| scaffolding/tests/frontend_syntax_preview.tower | World-derived syntax/match kinds and retained source provenance, UTF-8-safe preview truncation and allocation failure cleanup. 2,048-deep structural tree comparison checks text/labels/bounds and grammar-component precedence; source coordinates intentionally metadata. Shared structural evidence only, not canonical interchange replacement. Preserve. |
| scaffolding/tests/frontend_baselines.tower | Distinct world seed revisions, same-world publication, Bedrock change invalidates Foundation while old retained revision stays valid. Every publication/seed-registry failure retry retains counts and old baseline; pinned views block mutation and destruction until references close. Preserve immutable-boundary contract. |
| scaffolding/tests/frontend_template_build.tower | Actual template callback in two standalone worlds, typed captures/use counts, invalid capture diagnostic and recovery replace owned tree. Frozen inspection borrows correct source entities; temporary version owner restored before destruction by reverse defer order. Exact final allocation baseline. Preserve. |
| scaffolding/tests/frontend_replacement_owner.tower | Sorted named capture replacement, selected candidate survives later rejected destination, commit/freeze publishes stable indexed views and clears mutable host. Failure sweep/retry balances retained trees and leases; empty freeze allocation-free. Explicit world and source remain alive through derived emission/revision owners. Preserve. |

| Path | Content review at 6282238, evidence boundary and disposition |
| --- | --- |
| scaffolding/tests/frontend_table_owner.tower | Real grammar builders exercise closure/empty/conflict/missing-rule recovery and DFA eligibility. Numeric table snapshot owns names/captures after source world dies, preserves kernel/context order; all construction failure budgets retry without leaks. Derived parser table is deliberately independent of world lifetime, not second authoritative syntax. Preserve. |
| scaffolding/tests/frontend_emission.tower | World-owned grammar emission indexes repeated capture helpers, sorted names, ordered alternatives/tokens, sparse/duplicate display IDs and inherited literal snapshots. Overwrites caller arrays to prove copied ownership, validates no-allocation frozen lookups and release-order independence. Failure sweeps account honestly for retained capacity bypassing injected calls; source entities stay alive until last emission. Preserve. |
| scaffolding/tests/frontend_parser_text.tower | Resumable formatting request/reply protocol copies supplied names, rejects invalid/null unsolicited reply, preserves exact descriptions/ambiguity and remains done after completion. Actual table conflicts exercise kernel/closure selection and capped alternatives; failed allocations release partial formatting. Exact text asserts rule order never silently resolves conflict. Preserve. |
| scaffolding/tests/frontend_modules.tower | Seed-only no-import behavior, diamond identity/effect order, local override isolation, content/resolution invalidation, lexical path bounds and recovery. Cached declaration entities shared while ordinary roots/semantic components remain request-private; retiring cache preserves active leases and idle session reuse is generation-scoped. Legacy host entry intentional. Preserve. |
| scaffolding/tests/frontend_format.tower | World-specific parser kind is required; wrong-world kind produces plain nodes without mutation. Scalar UTF-8 boundaries, owned debug output after world disposal, exact deep/wide indentation and every allocation failure checked. Debug text is supplemental inspection, not Foundation serialization. Preserve. |

| Path | Reviewed behavior and coverage boundary |
| --- | --- |
| scaffolding/tests/frontend_bedrock.tower | Production grammar/table/pattern/diagnostic APIs with explicit kind bundle; allocation-budget retries must return buffer baseline after partial tables and expected-context diagnostics. Unicode/malformed UTF-8 cases keep parse contracts. Serial fault counters do not establish concurrent safety; preserve. |
| scaffolding/tests/frontend_syntax_version.tower | World-owned grammar versions retain revisions, emission, tables and pending relations; tests exact pin refcounts, idempotent/self pin operations, dispose refusal while retained and transactional cache-copy failure. Mutations occur before views/after close; unresolved Future rule remains pending until activation. Serial allocation-failure evidence only; preserve. |
| scaffolding/tests/frontend_world.tower | Separately linked production exports exercise per-world kinds, isolated Bedrock/pattern caches, pinned-view reset refusal and retained graph lifetime across clear. Legacy constructor test explicitly uses host-world boundary; other-world canonical text equality avoids entity-address identity. Warm query capacities before fault counting; no packed-payload or parallel overlap claim. Preserve. |

### D1 executed checks at f32e3c7 plus the two test edits

The clean public-bootstrap native build and pool profiles are recorded in the
journal's D1 implementation receipt. The fixed body_runs literal completed the
full bodies selector: 32/64-bit canonical/execution matrices at 1/2/4/8 workers,
serial/parallel diagnostic ordering and cycles. Exit 0, wall 279.50 s, CPU 305.85 s,
peak RSS 318,640 KiB, zero swaps, affinity CPUs 0 and 2. This is correctness
coverage; these worker-width sweeps do not establish useful speedup. The original
fixture failed before reaching these cases. Browser, actual emitted-Tower
sanitizers, merged-source generation and publication remain open.

## Formatter and IDE response ownership (reviewed at 316f62b)

These unchanged files match the initial source commit. Public response views are
borrowed test observations, not another authoritative semantic model. Listed
assertions are source evidence unless an execution receipt says otherwise.

| Path | Reviewed behavior and coverage boundary |
| --- | --- |
| scaffolding/tests/format_abi.tower | Shared FormatResult ABI and opaque session/node entry points only; no copied formatter state or scheduler. Preserve boundary. |
| scaffolding/tests/format_main.tower | Explicitly asserts single-owner transport before fault counters; owns resource request and grammar diagnostic, deliberately detaches module cache for legacy no-import session fixtures, reattaches for repository sweep. Do not blanket-prefix exact-span data. |
| scaffolding/tests/format_repository.tower | Reads sorted CMake list, configures lexical module context per file, preserves syntax_invalid rejection and requires byte-canonical/idempotent source. Local deferred source/result ownership; serial parser/formatter sweep is reference validation, not parallel performance coverage. |
| scaffolding/tests/format_suite.tower | Shared production formatter plus retained root entities, exact text/spans, sorted/unsorted comment ranges, Foundation compile-format-recompile, generated NUL/UTF-8 names and allocation-failure cleanup. Host-world APIs are explicit legacy test boundary; raw Foundation memory operations stay raw. Preserve asserted span offsets. |
| scaffolding/tests/format_wasi.tower | WASI entry loads source grammar buffers and installs world baseline through existing ABI before shared suite; deferred diagnostic/buffer ownership. No separate browser formatter implementation; no native single-owner assertion here, target transport must enforce fault-counter contract. |
| scaffolding/tests/format_expected.tower | Frozen independent legacy text/ordered-span data with explicit canonical representation/prelude updates; embedded NUL uses length rather than terminator. Numerical span fixtures are intentional, not magic IDs to rewrite. Reference historical compiler is provenance, not current runtime implementation. |
| scaffolding/tests/ide_query_support.tower | Borrowed JSON slices remain valid only until fixture response replacement; query destroyed after copied response. Fixture swaps/restores host-world module environment, frees file/text buffers and checks malformed JSON. Small reader is response oracle, not semantic state; global slot means serial coordinator use. |
| scaffolding/tests/ide_candidate_checks.tower | Graph/fast candidate checks cover exact output, multichunk completion, finite fuel, invalid flags without consuming fresh execution, reused/missing/stale handles. Deferred destroy retains handle lifetime through check. Existing two profiles do not imply thread overlap. |
| scaffolding/tests/ide_package_checks.tower | Width4/8 package graph snapshot, canonical Foundation byte equality, loaded/direct execution equivalence, bad profiles/width/source and repeated live-node/allocation baseline. Deferred owned buffers/handles; first no-import source needs actual current API repro before any fixture edit. Package rejection may otherwise mask intended coverage. |
| scaffolding/tests/ide_completion_checks.tower | Explicit imports/incomplete source test recovered scopes, named/ordered parameters, shadowing, nominal enum fields, expected argument types, incremental grammar boundaries, UTF-8 positions and repeated query ownership. Deliberate invalid holes remain inputs; sequential snapshots do not exercise stale concurrent publication. Preserve. |
| scaffolding/tests/ide_hover_checks.tower | Checks source-entity versus binding identity, imported declaration origin, exact target layout, punctuation ownership, renamed grammar, partial errors and no fabricated types after invalid layouts. Repeated document queries compare live counts; borrowed response views used within each response lifetime. Preserve canonical/diagnostic expectations pending runtime suite. |
| scaffolding/tests/ide_hover_generic_checks.tower | Symbolic definition identity stays distinct from concrete instantiations; owner-scoped parameters, imported fields, nested constructors and target widths retain metadata without invented dependent sizes. Ambiguous branch shapes and invalid operators stay unresolved. No staged-body execution proof from metadata alone; preserve. |
| scaffolding/tests/ide_hover_grammar_checks.tower | Revision-local '=' versus '|=' semantics, unresolved pending references, imported capture ownership and replacement category/roles tested through production query JSON. Earlier snapshot must survive later override; repeated live counts cover retention. Serial inspection does not prove concurrent mutation safety. |
| scaffolding/tests/ide.tower | Production tw_* integration covers separate parser/execution handles, snapshot response lifetime, stale generation rejection, graph/fast/loaded output, target width limits, step/output caps, handle capacity and repeated allocation baseline. Error returns can bypass local handle cleanup; harness exits on failure, but in-process failure cleanup remains a coverage gap. No new scheduler/state model. |

| Path | Reviewed behavior and coverage boundary |
| --- | --- |
| scaffolding/tests/backend.tower | Production LLVM/link/disassembly API checks copy input bytes before caller mutation, preserve inputs across plan reset and reject malformed code length/name paths. Each backend/link/decoder owns its buffers and closes after use. Gap: x86 custom-section branch runs only when backend_open has no error; its success message alone cannot prove that case ran. Needs explicit target-capability result, no silent skip claim. |
| scaffolding/tests/backend_main.tower | Ordinary native main forwards exact backend_tests status; no native policy or extra world. Preserve. |
| scaffolding/tests/backend_semantics.tower | P: deterministic call/destination effect order, signed minimum/wrap/division, overlapping copy and embedded NUL text, checked against interpreter and optimized/unoptimized backend expected output. Heap freed; overlapping copy deliberately forbids invented noalias. |
| scaffolding/tests/backend_source.tower | Two explicit worlds/module environments reject foreign-world and missing-world requests; retained canonical text survives other world close. Bounded source spans, NUL/length failures, profile identity and malformed-link reset preserve outputs/cleanup. Worker limits1/2 select budgets but sequential calls prove isolation, not overlap. |
| scaffolding/tests/compiler_project_compare.tower | Independent gzip transport plus exact SHA256 member multiset/count/size comparison across tower/llvm/cross support archives; intentionally ignores archive names/chunk/container metadata only. Deferred decoded/archive/hash ownership and sorted derived indexes, no semantic graph. Requires supplied reference artifacts; source review is not a new differential run. |
| scaffolding/tests/compiler_project_units.tower | Real depfile source-closure packaging deduplicates repeated unit identity, exports exact checked files through shared tools. project owns units/files until all writes finish; no compiler scheduling claims. Actual clean exported rebuild comparison remains caller evidence. |
| scaffolding/tests/compiler_support_checks.tower | Tower-built Wasm/archive fixtures cover deterministic index/long names/odd bytes, output alias preservation, physical duplicate-member identity, weak/local symbols, ordered closure waves, chunk/input limits and unrebuildable support policy. Backing byte buffers pinned before borrowed member views; independent llvm-ar extraction plus real archive mode are explicit. Final text correctly says independent link verification still required. |
| scaffolding/tests/bootstrap_symbols_checks.tower | Explicit unit/target symbol allowlists tested for exact first rejection, decoration/whitespace, unknown units and native/Wasm table-symbol boundaries. These are dependency-closure checks, not replacements for public bootstrap/resources or executable behavior. Preserve expected ABI symbols. |
| scaffolding/tests/coff_import_checks.tower | P: exact pinned SHA256 of COFF stack-probe import archive across target widths/native/Wasm; scoped vector ownership and independent pre-extraction reference bytes. Digest correctness is interoperability evidence only, not target execution. |
| scaffolding/tests/foreign_names.tower | ABI fixtures compare full Itanium/MSVC/ARM64EC decorated names against pinned LLVM/lld and upstream references, including substitutions/member pointers/calling conventions. Each result released; malformed/unknown metadata rejected. Numeric profile IDs are existing ABI fixtures; preserve, no unrelated rewrite. |

| Path | Reviewed behavior and coverage boundary |
| --- | --- |
| scaffolding/tests/link_fixture_file.tower | Bounded512MiB file read/write ABI helper; ByteBuffer caller owns content, file closes on ordinary read/write exits. No world/jobs; necessary OS boundary remains Tower policy. Preserve. |
| scaffolding/tests/elf_hosted_checks.tower | Fresh explicit linker world per1/2/4/8 budget, byte equality/single-use request, cancellation while pinned, missing export, actual malformed GNU property (synthesized if SDK omits it) and load extent/W^X checks. Inputs remain borrowed from caller throughout joins; overlap delegated to elf_check_overlap with its conditional-coverage caveat. |
| scaffolding/tests/elf_hosted_driver.tower | Loads all immutable input buffers before linking; deferred linker close precedes buffer free. Explicit target/interpreter, worker count and export policy; coordinator writes result only after successful run. Printed jobs_peak is queue evidence, separate overlap assertion is required. |
| scaffolding/tests/elf_shared_checks.tower | Owned DSO bytes outlive parsed symbol/version/name views; verifies SONAME/default GLIBC versions, wrong architecture and geometric truncations. Derived name index only; source review neither claims all binary fuzz cases nor ARM execution. |
| scaffolding/tests/elf_link_driver.tower | Byte-service runner retains source/archive storage until linker close, deliberately supplies archive before demand and compares same input order. Error path emits diagnostic/name/offset and nonzero. Width/target CLI is narrow fixture transport, not generic production argument policy. |
| scaffolding/tests/pe_link_driver.tower | Stable input/probe archive storage through explicit PE world; same import bytes exported to external reference linker. Checks run after joined success; result written only on success. Some fixture vector/input calls rely on ensuing link diagnostics; no live allocator-failure coverage claimed. |
| scaffolding/tests/macho_link_driver.tower | Frozen caller-owned object/archive/TBD bytes and explicit target world; serial transport emits comparable platform import fixture. All normal return paths close link before buffers; link job counts are not performance/overlap proof. Preserve. |
| scaffolding/tests/elf_link_checks.tower | Actual gated two-kernel barrier with private output copies, input pin, cancellation close refusal, deterministic bytes/errors, stale request, malformed/truncated inputs and demand-only archive selection. Gap: elf_check_overlap silently returns if threads/capacity/objects insufficient although enclosing message says real overlap passed. Track explicitly; PE/Mach-O counterparts require transport. No failure cleanup/universal race proof from normal barrier. |
| scaffolding/tests/pe_link_checks.tower | Required two-worker barrier/private output with byte reference; active cancellation requires released views, malformed patch variants clear artifacts, single-use tickets and1/2/4/8 equality. Pre-dispatch synthetic section/symbol edits are deliberate fixtures; source buffer remains alive. External executable/reference receipt still separate. |
| scaffolding/tests/macho_link_checks.tower | Required two-worker barrier on separate object relocations under pinned world, joined remaining serial work then canonical image/signature hash check. Cancellation drains and rejects close while pinned; duplicate/truncated/target failures publish no stale output. Direct kernel test is overlap evidence only when run, not full production lease proof. |

| Path | Reviewed behavior and coverage boundary |
| --- | --- |
| scaffolding/tests/wasm_link_exports.tower | Separate symbol/export spelling, fixed/growable table limits, empty name, collision and invalid index fixtures use ordinary world-owned object reader; immutable source bytes retained until link/output reader close. Checks coalescing and no private-name leak, no execution claim. |
| scaffolding/tests/wasm_link_fixture.tower | Minimal relocatable function byte constructors in Tower using shared encoders; local section/symbol buffers copied before disposal. Numeric Wasm magic/opcodes are explicit fixture data, not compiler graph or scheduler. |
| scaffolding/tests/wasm_link_job_checks.tower | Barrier proves two real relocation workers entered, outputs are separate byte ranges, pinned owner refuses close; serial/parallel earliest-error, cancellation-after-admission and TLS profile mutations check join-before-unpin. Nonthread hosts intentionally omit barrier and print no overlap receipt; reader success alone is not concurrency evidence. |
| scaffolding/tests/wasm_link_reactor.tower | Links actual backend reactor/support via public byte request, checks no implicit filesystem output, unsupported option fails without fallback/stale bytes, retry is byte-identical. Original request and copied image lifetimes are deferred; no host-native test policy. |
| scaffolding/tests/wasm_link_reader_native.tower | Native Linux thread/dispatch boundary selects production workers for shared Tower reader suite; abort stub rejects accidental generic kernel dispatch. No duplicated checks or seed. |
| scaffolding/tests/wasm_link_reader_threads.tower | WASI memory/thread/dispatch boundary for same reader suite; actual overlap receipt requires threaded runtime execution. Module imports alone do not prove browser scheduling. |
| scaffolding/tests/wasm_link_reader_wasi.tower | Explicit portable serial worker boundary and _start forwarding; valid reader/cancellation semantics coverage, deliberately cannot supply overlap evidence. Preserve distinct capability contract. |
| scaffolding/tests/wasm_link_shared.tower | Tower-authored stack-free atomic shared-init executable asserts cold/mutated values and completion count; profile cases verify declared features, imported/defined shared limits, passive retained data, dedicated flag alignment and reserved definitions. Its eight-worker constants are runtime expectations, not measured overlap until transport runs them. |
| scaffolding/tests/wasm_link_shared_generate.tower | Writes exact comparison object and linked shared-memory image after profile assertions; link world closes before immutable input buffer. Generator success validates bytes/profiles only; external concurrent instance run is separate. |
| scaffolding/tests/wasm_link_tls.tower | Tower-generated relocatable TLS runtime asserts per-instance base/GOT, retained template on repeated reinitialization, independent regions and atomic completion. Relocation buffers/offsets are derived test data, no duplicate compiler IR. Raw fixture addresses/strides preserve low-level memory contract. |
| scaffolding/tests/wasm_link_tls_generate.tower | One frozen TLS object linked at1/2/4 workers, exact serial-image comparison and explicit layout/grain. jobs_run/peak asserts admitted work only; independent eight-worker execution required for isolation/overlap. Input lifetime covers every link; failures emit worker/error/name/offset and nonzero. |
| scaffolding/tests/wasm_link_reader.tower | Full production reader/world suite: seeded1000 LEB round trips, all final-byte padded encodings, every minimal-object truncation, real hash collisions, owner-boundary lookups, explicit worlds/pins, lazy demanded archives/cycles/COMDAT, immutable borrow versus owned replacement, and stale request/capability/memory profiles. Known-reader comparisons can share bugs; external LLVM/browser differential receipts remain independent gate. Derived indexes are not packed payload proof. |

| Path | Reviewed behavior and coverage boundary |
| --- | --- |
| scaffolding/tests/fixture_json_rows.tower | Bounded owned ASCII string/null fixture reader accepts supported escapes, rejects NUL/non-ASCII/control/truncation and preserves explicit byte lengths. Small independent response adapter with self-checks; no compiler entities/jobs. |
| scaffolding/tests/llvm_c.tower | P: direct opaque LLVM C context/type/value calls with exact42 result and context disposal. Necessary foreign ABI fixture, no native seed or Tower-side semantic adapter. |
| scaffolding/tests/llvm_scripts_checks.tower | Isolated exclusive fixture directory verifies LF/CRLF normalization, exact recoverable originals, changed/missing source refusal, partial preparation restoration, symlink and size limits. Real upstream script is copied, not mutated; final text correctly defers CLI execution/restoration evidence. |
| scaffolding/tests/target_once.tower | Four-lane real barrier plus OS pipes controls no-argument initializer callback without shared uninitialized globals; no caller returns before publication,64calls/lane still initialize once. Explicit77 on insufficient capacity. Success drains before job storage free; assertion-abort paths are process failures, not cleanup coverage. |
| scaffolding/tests/target_pack_import_checks.tower | Supported import-definition subset, duplicate/unsafe/oversized input and exact maximum tested; failed parse preserves previous owned result. COFF construction accepts borrowed old output only after safe publication. No world/scheduler; preserve explicit unsupported metadata. |
| scaffolding/tests/target_registry_checks.tower | Exact independent generated Tower text preserves configured target/printer/disassembler ordering; malformed macros preserve output allocation/content, empty replacement and input/output alias tested. Generated declarations remain source, not ambient type registry. |
| scaffolding/tests/tool_words_checks.tower | Independent exact shell-free word/depfile/response expectations include spaces, escapes, NUL, literal command characters and cyclic response rejection preserving plan. Real Clang -### capture never compiles; optional Ninja recipe and full runtime checks are separate capabilities. Scoped buffers and response file ownership. |
| scaffolding/tests/tool_process_checks.tower | Self-spawned Tower child verifies literal argv, empty strings, ordinary127 versus exec failure, signals, redirect errno and binary stdout/stderr separation; >pipe-capacity capture checks drain/limit preservation. Child logic is Tower, OS process boundary shared; no special scheduler. |
| scaffolding/tests/tool_files_checks.tower | New isolated filesystem tree tests bounded read transactionality, explicit symlink following, lexical aliases/no directory-link traversal and no-replace publication preserving candidate/destination collisions. No arbitrary cleanup; source fixtures remain inspectable. Hardlink distinction delegated to A2's reserved helper regression. |
| scaffolding/tests/tool_archive_checks.tower | Published CRC vector plus seeded chunk property, deterministic ZIP/Roku bytes, complete size limits, invalid names/metadata, old-output alias ownership and symlink source/output rejection. Independent archive decode remains external receipt; A2 owns new hardlink alias coverage, no competing edit. |

## Driver transport, differential and measurement review (316f62b)

| Path | Reviewed behavior and coverage boundary |
| --- | --- |
| scaffolding/tests/driver_platform_api.tower | Explicit opaque file/process/platform capability contract; Windows runner availability distinct from child exit. No world ownership or scheduler. Preserve ABI boundary. |
| scaffolding/tests/driver_posix.tower | Fork/exec with alarm/wait preserves signals and raw status; separate production-command path tests no shell fallback. Relocated full resource tree and symlink executable lookup are OS fixtures. Descriptor/resource operations stay serial; exec127 not independently distinguished here unlike tool_process tests. |
| scaffolding/tests/driver_windows.tower | Quoted argv owns child launch strings, timed wait terminates and drains before handle close; Windows-only/no-POSIX capabilities explicit. Relocation/platform empty functions are unsupported coverage, not performed tests. |
| scaffolding/tests/driver_windows_unit.tower | Module closure for standalone Windows test binary; shared driver assertions plus Windows OS transport, no implementation duplication. Needs Windows execution receipt. |
| scaffolding/tests/driver_request.tower | Frozen source snapshot survives file overwrite; distinct private request worlds/module environments survive independent stage/close; borrowed legacy slot restored. Every injected open failure closed and buffer baseline asserted. Single-owner counters, not threaded sanitizer evidence. |
| scaffolding/tests/driver_units.tower | Real separate units exercise generic/type-producing import, comptime/decltype, exact42 output and depfile closure at1/4workers; earliest unit error and malformed budgets checked. Worker count/output equivalence is not actual overlap or shared-budget speedup. |
| scaffolding/tests/driver_main.tower | Native main forwards driver_tests exact status/argv without policy or extra compiler state. Preserve. |
| scaffolding/tests/driver_standalone.tower | Out-of-process compiler suite links existing provenance boundary stub because it never compiles in-process; no native adapter/seed. Stub must stay confined to standalone consumer. |
| scaffolding/tests/driver_compilation.tower | Graph/fast foreign transport exact ordered output, missing binding, source overwrite rejection, tampered bytecode-cache rejection and long grammar diagnostic ownership. Explicit source imports present; no independent constant folder. |
| scaffolding/tests/driver_differentials.tower | Bounded shell-free fresh processes compare graph/fast/package/reconstructed Foundation/native status and bytes; repeated package bytes/profile/depfile checks. Fixtures written unchanged. First-reference comparisons may share implementation errors; known independent output must complement them. No-import inline cases remain a reproducible hypothesis. |
| scaffolding/tests/driver_execution_cases.tower | Frozen numeric/effect/memory/error fixture corpus covers32/64 target conversion boundaries, exactly-once call order and selected native comparisons. Inline literals currently omit language imports despite direct file writer; preserve raw Foundation intent and error contracts until focused repro, then precise source fix rather than helper prefix. |
| scaffolding/tests/driver_formatting.tower | Deliberately impossible backend/tool flags prove syntax-only formatting; preserves source/output on failures, UTF-8/NUL and grammar-sensitive token equivalence, imports and Bedrock/Foundation canonical checks. No semantic execution requirement on unresolved names. |
| scaffolding/tests/driver_c_cases.tower | C backend fixtures test numeric boundaries, alias/unaligned raw storage, ordering, labels, comments and traps plus ordinary imported examples. Inline/generated cases omit imports; actual baseline selectors needed. Do not impose safe initialized Foundation semantics or alter expected failures. |
| scaffolding/tests/driver_c_validation.tower | Explicit4compiler/language and optimized/raw matrices compare native C to graph/LLVM references, reject mismatched target width/alignment, and publish full expectations only after success. Reads/writes caller inputs unchanged; no hidden prefix. External tools/platform availability and failures must remain explicit. |
| scaffolding/tests/driver_linking.tower | Reuses existing Wasm archive, freezes explicit runtime/library inputs and compares generated-name aliases; native/external link/interpreter reference outputs and browser exports run through bounded child capture. Optional ARM QEMU emits explicit SKIP; generic completion cannot be cited for that skipped behavior. |
| scaffolding/tests/driver_module_paths.tower | New exclusive filesystem root with recorded reverse cleanup verifies exact lexical/case/relative paths and symlink-distinct module effects. Hypothesis: copied baseline closure includes only bedrock/foundation/tower, omitting foundation_syntax/types imports now required; repro before change. Unavailable symlink reported, not actual alias coverage. |
| scaffolding/tests/driver_measure.tower | Frozen equivalent child series, alternating order, exact output/product hashes and nonempty/stable phase sets; medians sort private copies without overflow. Serial process loop is correct measurement isolation. Records wall/CLI phases only, requiring external CPU/RSS/allocation evidence; parse phase includes frontend/checking, not parser-only time. |
| scaffolding/tests/driver_measure_cases.tower | Selects representative compile/staging/native/interpreter/C recurrence-memory workloads with source/executable hashes and checked outputs; D2 owns precise measure_kernel Foundation import correction. Long/short kernels kept distinct; no general language superiority or useful core scaling inferred from unlike workloads. |
| scaffolding/tests/driver_measure_timings.tower | Integer nanosecond parser rejects overflow, duplicates, trailing reports, signed/exponent/overprecision syntax; exact boundary tests and owned metric names. Timing text is transport metadata, not semantic interchange. |
| scaffolding/tests/driver_target_cases.tower | Shared fixed expected output for native/cross-target execution, preserving numeric fixture data. No state/scheduling. |
| scaffolding/tests/driver_targets.tower | Explicit target-runtime/linker paths and immutable inputs; capability detection precedes execution and child77 is failure. Native Linux runs, Windows/Wine/QEMU skips and unavailable macOS execution reported separately. Successful link is not foreign-target execution evidence. |
| scaffolding/tests/driver_msvc.tower | Validates complete owned artifact manifest before compiler launch; bounds signed status, rejects duplicate/unknown fields/path escape, normalizes only CRLF, compares C/C++/O0/O2 status/stdout/stderr. Exact negative/error fixtures preserved; OS capability required. |
| scaffolding/tests/driver.tower | Shared argv/capture/CLI harness preserves binary mappings, raw subprocess status, owned descriptor restoration, real outputs/depfiles/packages and runtime ABI errors. Explicit selectors avoid repeated full matrices; capture uses process-wide descriptors, therefore serial coordinator only. Assertion exit bypasses defer by design; does not prove in-process error cleanup. |

| Path | Reviewed behavior and coverage boundary |
| --- | --- |
| scaffolding/tests/mt19937.tower | Independent deterministic test-input generator reproduces retired standard MT19937 draw order with first and10000th known values. Caller-owned fixed array, no global state or compiler implementation; preserve algorithm constants and fixture seeds. |
| scaffolding/tests/utf8.tower | Independent reference comparison covers every Unicode scalar, every1/2byte input,100000seeded spans, output guards, short-write atomicity and NUL policies. Stack buffers are scoped; exhaustive byte/semantic coverage is separate from real sanitizer execution. |
| scaffolding/tests/utf8_boundary.tower | OS guard-page fixture catches generated-code overread/write for every0..4byte boundary with seeded invalid spans and scalar edges. Explicit per-OS anonymous-map flag supplied by manifest; no executable-memory/JIT. Successful unmap asserted; native-only capability, not browser evidence. |
| scaffolding/tests/utf8_oracle.tower | Independent historical-seed algorithm in Tower, avoiding production decode/encode calls; bounds-before-read, scalar/surrogate and atomic short-destination policy. Test oracle provenance only, not a reintroduced bootstrap/native seed. |
| scaffolding/tests/module_paths.tower | Direct platform exact-case path test includes directory/base/extension mismatch and absent file; returns distinct nonzero status. Required case-sensitive semantic contract even on Windows; no module-cache identity substitution. |
| scaffolding/tests/layout_depth_source.tower | Tower generator emits1024deep layout chain and512field wide struct with explicit import and exact sizes/field511 result. Deliberately stresses resumable layout, not runtime nesting. Gap: vector_push and platform_write results unchecked, so generator fault can emit partial input; no failure-injection claim. |
| scaffolding/tests/semantics.tower | P: forward module binding/effect order, target-dependent record layout, nominal constructor recursion through pointer, exact generic identity and lexical early-return/signed-minimum behavior. Raw uninitialized forward storage is deliberate Foundation-compatible input, not safe-language policy. |
| scaffolding/tests/generic_body_cases.tower | P: intentionally240distinct effect statements and32nominal decltype specializations stress lazy generic body-copy budget. Replacing statements with a loop would destroy the test; unevaluated signatures must not print99 or eagerly instantiate bodies. Preserve. |

Source review continued at316f62b (unchanged LR sources; runtime comparison selectors not yet rerun by D1):

| Path | Reviewed behavior and coverage boundary |
| --- | --- |
| scaffolding/tests/lr_analysis.tower | Ordered exported aggregator runs grammar/tree/allocation/precedence then current-contract differential analysis; no scheduler or duplicate production state. Receipt depends on every child assertion completing. |
| scaffolding/tests/lr_analysis_api.tower | Explicit opaque foreign test ABI over production LR records; returned pointer/count views are borrowed from live owning handles. Boundary declarations do not establish execution, ownership transfer or packed payload coverage. |
| scaffolding/tests/lr_analysis_comparisons.tower | Independent seeded150grammar/propagation comparisons include nullable, upper-token boundary,128alternatives and finite16symbol control chain; per-trial buffer baseline checked. All input vectors survive derived analyses; deterministic serial oracle, not concurrency evidence. |
| scaffolding/tests/lr_analysis_failures.tower | Exhaustive bounded allocation-failure attempts dispose partial analysis/items/states/runtime/parser/probe graphs and assert baseline; both specialized modes and512symbol index resize retain exact identities. Single-owner fault allocator intentionally serial, not race instrumentation. |
| scaffolding/tests/lr_analysis_oracle.tower | Disposable reference nullable/FIRST/closure/goto/propagation solver uses shared immutable LR records with independent fixed-point algorithm and owned vectors. Test-only derived oracle, not second authoritative compiler graph; scoped raw pointers and reverse cleanup. |
| scaffolding/tests/lr_analysis_oracle_types.tower | Reference records/ordered range and item sets plus checked allocations keep stable separately allocated nodes while vectors grow. O(n) reference insertion is appropriate for small differential fixtures; not production locality/performance evidence. |
| scaffolding/tests/lr_control_checks.tower | Exact independent runtime actions/defaults/gotos, parser steps/frames/forest/work counters and probe clone/reset shared budgets0/1/128/8192. Specialized/ordinary, prefix, empty/incomplete/trailing/error token paths compared; bounded512step walk lacks explicit exhaustion failure, so not a termination proof. |
| scaffolding/tests/lr_control_types.tower | Named test ABI constants retain exact control-state encodings, including input/wait/invalid states. No owned storage or independent scheduler. |
| scaffolding/tests/lr_graph_checks.tower | Compares ordered FIRST/items/states/transitions/actions against independent reference; reopens sorted closure with duplicate/new seed and solves cyclic/self/duplicate propagation after mutation. Borrowed input vectors and result views stay live; single-thread fixed-point determinism only. |
| scaffolding/tests/lr_precedence_checks.tower | Independent exact assertions for left/right/nonassociativity, unequal powers, ineligible ranges, reduce/reduce and current conflict-priority policy. Historical oracle mismatch seed explicitly preserved rather than silently changing reference; allocation baseline checked. |
| scaffolding/tests/lr_tree_checks.tower | Explicit world-derived kinds; tests attached-input rejection, allocation failure before/after ownership transfer, ordinary/specialized forest assembly, named captures and preserved stable payload identity. Closes source view/releases source after grammar finish; exact node/buffer baseline, serial allocator scope. |
| scaffolding/tests/lr_grammar_fixtures.tower | Every node/kind/component derives from explicit world; parent attachment owns children after local release. Typed component casts remain at opaque test ABI, not default-world authority. |
| scaffolding/tests/lr_grammar_oracle.tower | Independent linear/rank-count reference snapshots ordered grammar entities into disposable indexes, preserving augmented duplicate names, ranges, captures and annotations. Input node pointers borrowed only during comparison; copied diagnostic strings outlive source. No production AST replacement. |
| scaffolding/tests/lr_grammar.tower |150seeded mixed-component grammars plus empty/precedence boundaries compare all production fields and ordered provenance; source-release snapshot checks and full allocation-failure sweep enforce ownership. Explicit world closes and node/buffer counts return exactly; not real worker overlap evidence. |
| scaffolding/tests/lr_states_oracle.tower | Independent kernel equality/linear interning and deterministic ordered transitions derive states from frozen LR arrays; worklist and LALR propagation are disposable reference indexes. Separately allocated states stay stable while pointer vectors grow; borrowed analysis outlives states. |
| scaffolding/tests/lr_runtime_oracle.tower | Independent sorted action rows/linear lookups preserve legacy/current conflict-policy modes explicitly; snapshots own rules and specialization sequence. Shared-row count is logical equality evidence, not packed storage or memory savings measurement. |
| scaffolding/tests/lr_parser_oracle.tower | Reference parser/probe has private frames/evidence; runtime and shared probe budget are borrowed for enclosing comparison only. Exact NeedInput/shift/reduce/error behavior, capped probe work marks incomplete; no compiler worker scheduling. |
| scaffolding/tests/lr_runtime_faults.tower | Explicitly forbids threaded transport; deterministic two-round allocation-failure sweep compares every successful/retry result to serial table including first conflict and returns world/buffer baseline. Width2 exercises work plumbing only, not concurrency/race sanitization. |
| scaffolding/tests/parser_fixture_setup.tower | Reads requested baseline bytes and installs into explicit host-boundary world with owned diagnostic cleanup. Fails on file/install error; setup assumes cwd resources. Historical no-import parser fixtures are intentional grammar installation clients. |
| scaffolding/tests/parser_main.tower | Focused selectors initialize only required grammar, preserve child statuses/diagnostics and allow whole-suite/parse/host-only entry. Main host/default kinds are legacy serial boundary. Diagnostic output write failure silently stops writing; actual underlying test failure still nonzero, not full transport reliability proof. |
| scaffolding/tests/parser_failures.tower | Explicit world/table/stream lifetime; bounded OOM sweeps for recognizer and complete diagnostic dispose each result, assert retry and exact buffer baselines. Single-owner allocation harness; no concurrent transport or cancellation claim. |
| scaffolding/tests/lexer_table.tower | Direct NFA simulation differs from production subset construction;150seeded cyclic/split/range NFAs and500random DFA/UTF8 prefix trials plus failure/retry buffers. Limit outcomes are accepted without simulation, explicitly limiting fuzz coverage; no parallel claims. |
| scaffolding/tests/lexer_table_oracle.tower | Independent nested-row DFA indexing catches production flat-offset errors, but shares UTF8 decoder (separate exhaustive UTF8 tests provide that oracle). Caller-owned source and private rows disposed; no authoritative grammar replacement. |
| scaffolding/tests/lexicon_oracle.tower | Test-only independent token/literal/context/declaration selection over borrowed tables/text, preserving maximal prefix, ordering and LR acceptance-check counts. Reuses matcher/runtime APIs so differential scope is selection only; vector ownership does not transfer referenced grammar storage. |
| scaffolding/tests/parser_benchmark.tower | Existing Linux-x64 monotonic-clock boundary measures production parse256..2048symbols,16iterations/5warmups with allocation calls/live-buffer stability and released roots. Private source/session cleanup; tracked serial allocator, wall microbenchmark only (external CPU/RSS and correctness/overlap needed). D2 reviews measurement interpretation. |
| scaffolding/tests/parser_state.tower | Source-copy overwrite/UTF8/OOM errors, interleaved independent requests sharing frozen table, completion/root surviving request destruction, buffered lookahead ownership, bounded allocation retry and exact buffer baselines. Interleaving is isolation evidence, not simultaneous workers. |
| scaffolding/tests/parser_integration.tower | Production-only ABI fixture uses explicit worlds/kinds; Unicode spans, layered same-world streams, independent worlds, prefix lookahead, diagnostics, incremental waiting/resume, transferred nodes and cancellation are checked.256..2048left/right recursion asserts linear work bounds; bounds are not measured speedup. Source-derived tables detach before source release; returned roots outlive requests. |
| scaffolding/tests/regex.tower | Explicit world-owned parsed grammar;300seeded generated/500arbitrary patterns compare independent reference and fixed known prefix results. Complexity rejection and scratch OOM leave pinned parse entities/canonical tree unchanged; exact released nodes/buffers plus cache clear, serial fault coverage. |
| scaffolding/tests/regex_oracle.tower | Independent bounded reader/Thompson NFA/subset construction with checked allocations and explicit ownership transfer; shares low-level UTF8/table container APIs only. Historical seed is test oracle provenance, not executable bootstrap adapter; derived tables never authoritative syntax. |
| scaffolding/tests/syntax_live.tower | Ordered public aggregator requires attribute, seed, replacement, revision, malformed, cache and lexical children before success receipt. Serial host-session boundary, no overlap evidence. |
| scaffolding/tests/syntax_live_support.tower | Legacy session/default-kind helpers keep retained roots and generated source alive, compare exact spans and canonical text, explicitly terminate length-delimited formatter output. Allocation snapshots cover nodes/components/memory; debug substring checks do not substitute canonical round trips. |
| scaffolding/tests/syntax_live_lexical.tower | Reset/cache hit/build/eviction bounds, exact lexical maximal prefixes,17malformed patterns and invalid override rollback. Tests preserve last published revision/token definitions; cache index reuse is correctness/retention evidence, not packed payload or timed performance. |
| scaffolding/tests/syntax_live_grammar.tower | Adjacent declaration activation and shared-prefix lookahead, nested named captures, revision/cursor boundary, sticky malformed/conflicting candidates and replacement removing old spelling. Retained trees survive session destruction; failed grammar leaves prior revision intact. |
| scaffolding/tests/syntax_live_replacements.tower | Canonical immutable Bedrock round trip then local semantic edit proves seed isolation. Chained/duplicated/empty/discarded captures preserve original/template provenance and distinct copied entity identity after session destruction; recursive expansion limit diagnosed. |
| scaffolding/tests/syntax_live_attributes.tower | Predecessor-readable activation fixture exercises bracket attributes only in supplied source; nominal syntax entities retain provenance and canonical equality. Known lexical/precedence behavior and malformed/duplicate/inapplicable attributes checked, raw Foundation policy untouched. |
| scaffolding/tests/reader_oracle.tower | Independent grammar-tree reader enriches shared cloned entities with source-bound syntax components; exact declaration order, named captures, replacement ownership and malformed spans checked. Reference parses raw grammar semantics only, not independent authoritative syntax or constant evaluation. |
| scaffolding/tests/syntax_reader.tower | Retains source/root past session destruction; compares independent cloned trees, canonical text, provenance and exact errors.1000seeded bytes, overlap decoding, overflow, malformed spans/captures and OOM preserve prior data and release buffers/nodes; host/default-world serial fixture boundary. |
| scaffolding/tests/syntax_validation_fixture.tower | Test-owned sorted index retains shared alternatives and borrows immutable seed tokens; consumed term references attach once, views freeze while validators run. Exact result/diagnostic/offset/pending-entity identity and bounded OOM cleanup, no second authoritative grammar. |
| scaffolding/tests/syntax_validation.tower | Known dependency-path activation, dormant incomplete rules, productive/unproductive cycles, nullable repetition, required declaration captures, embedded-NUL identity and1500capture duplicate cases plus600seeded graphs. Grammar validity dependencies differ from executed comptime branches; no worker overlap claim. |
| scaffolding/tests/validation_oracle.tower | Independent serial scans/fixed points over borrowed shared nodes preserve first pending cause/order and exact active dependency path. Derived analysis only, own rule vectors disposed; shared literal oracle does not independently validate lower-level bytes. |
| scaffolding/tests/syntax_nodes.tower | ABI field offsets/defaults, independent structural equality, NUL bytes and64child mutations; metadata intentionally excluded separately. Source/pattern/replacement self-assignment retains once, comment aliases survive growth/failure, payload removal releases owners; exact serial node/buffer baselines. |
| scaffolding/tests/syntax_template.tower | Bounded OOM sweep retains partial owning emission root while testing typed scalar/token/list holes and exact generated helper order/cardinality/IDs. Releases source fixture/root every attempt; numeric grammar IDs are deliberate fixture protocol. |
| scaffolding/tests/syntax_replacements.tower | Public session fixtures distinguish unique/ambiguous destinations, destination syntax mismatch, missing/spaced captures and comment preservation with exact declaration counts/error prefixes. Session destroyed before returning nonzero, no new implementation or implicit language prefix. |
| scaffolding/tests/syntax_scan.tower | Injected node/payload/text failures retain EOF/error contract; exact token/provenance plus unmatched4byte scalar advancing once. Context/kind supplied by owner; result/node/lexicon disposed each attempt and buffer baseline checked, serial fault transport. |
| scaffolding/tests/syntax_lexer.tower | Explicit world builds all patterns before pinning inputs; compares165known/seeded inputs at all offsets across6parser contexts/modes and exact work counts. Selection allocates no scratch and preserves entity counts; malformed insertion rollback and shorter accepted punctuation tested. Pins protect lifetime, no payload mutation or parallel assertion. |
| scaffolding/tests/syntax_expansion.tower | Production expander over related-world entities checks copy-versus-final-use move identity, repeated/empty captures, destination mismatch and exact provenance. Recursion256/steps4096/output65536 limits plus OOM cleanup preserve bounded failure; raw input descriptors/stack captures live through synchronous call. |
| scaffolding/tests/lr_work.tower | Explicit worlds/kinds, retained worker leases, close-before-stack-release cancellation, independent world isolation and budget rejection. Compares exact serial/parallel FIRST/state/action/unsolved graph order, cyclic/duplicate/unseeded propagation and failure with missing frozen closure. pool.peak/graph.revision prove admitted work, not simultaneous useful overlap; raw-capacity helper pool bypasses explicit world limit for test-only stress. Partial world-allocation early return can retain a successful peer; untested OOM gap. |
| scaffolding/tests/interpreter_storage.tower | Private IMState memory resize/zeroing/OOM atomicity,257unordered allocation keys,free-neighbor ordering,17frame/task/cache LIFO isolation and exact normal cleanup. Early assertion returns bypass dispose, so success baseline does not validate all failure lifetimes; no shared worker state or static constant folder. |
| scaffolding/tests/nodes.tower | Production entities/lifecycle callbacks verify parent/named ordered child ownership, replacing/detaching references and component/type validity throughout finalization; same fixture repeated in explicit independent store. Legacy/default counters and captured-owner allocation free are deliberate boundary tests, not production global policy. |
| scaffolding/tests/syntax_emission_api.tower | Opaque test ABI delegates actual emission/template lowering, with counted borrowed result records and shared world-related node construction. Overflow-checked vector append copies values but does not clone owned references; enclosing fixtures own those inputs. |
| scaffolding/tests/syntax_emission_entry.tower | Warm host-boundary context then twice invokes complete fixed/generated/template/OOM suite; second pass asserts no retained buffers/entities after cache initialization. Warm first-pass retention is explicit, no cold-memory claim or parallel scheduling. |
| scaffolding/tests/shared_entities.tower |1000aligned stable payloads, reuse without allocation, cross-store type/parent rejection, atomic named-child replacement and same Foundation payload registry.40explicit-world cycles cover all kinds, pins and retained type disposal refusal;10000deep provenance history releases iteratively. Stable sparse payload evidence is not packed archetype locality or thread safety. |
| scaffolding/tests/syntax_emission.tower | Fixed/400seeded grammar fixtures compare production with independent emitted shared-component trees, literal/helper names, ordered productions and provenance; template holes/reserved names/exclusion ranges and bounded allocation failure. Source owner retains all derived borrowed views until both results close; no parallel publication or wall-time claims. |
| scaffolding/tests/syntax_emission_oracle.tower | Independent ordered/linear name and FIRST analysis emits same entity components, with explicit retained inputs, copied names and result lifetime. Serial reference helper enumeration is observable contract; no production scheduler, alternate semantic format or native seed introduced. |

Initial-scope source audit closure: all437assigned paths reviewed; this does NOT
close execution, performance, instrumentation, new-file reconciliation or release
acceptance. Test-only reference indexes/algorithms are intentionally independent
and disposable. Early assertion-return cleanup gaps in process-exit-only fixtures
remain distinguished from the repaired active-worker lifetime bug. Invariants
claimed from real gates/canonical checks stay separate from width/queue counters.

### Incoming instrumentation fixtures (reviewed draft, not integrated scope)

The coordinator's `instrumentation_handoff.patch`, SHA256
`93cee185858581ccac9381557b057a1e641fd12db8e2d0e17c774950e1fd4331`,
contains two A2-owned deliberate negative controls. These are reviewed source
receipts against that exact draft, not additional tracked-file audit credit or
local execution claims. Reconcile their integrated commit in the full roster.

| Proposed path | Storage, ownership, scheduling and coverage disposition |
| --- | --- |
| `scaffolding/tests/sanitizer_memory_probe.tower` | Eight-byte raw heap allocation is filled, then deliberately written/read one byte beyond its extent; foreign write makes the invalid access observable. Requires an ASan heap-buffer-overflow and nonzero termination, never inclusion as an ordinary passing test. Raw Tower/Foundation remain unchecked; this probe introduces no Stronghold bounds policy. Allocation failure traps distinctly. A2 owns implementation; native Linux x64 instrumented execution only. |
| `scaffolding/tests/sanitizer_race_probe.tower` | Two production pool workers borrow coordinator stack job records and one shared counter. Both must reach entered barriers before releases, so sequential dispatch cannot pass; unsynchronized counter increments deliberately violate payload exclusivity. Normal completion receives every worker before pool/signals/stack teardown. Admission/transport errors trap rather than claim race coverage; these fatal paths do not independently demonstrate recoverable cancellation cleanup. Requires a TSan data-race diagnostic and nonzero exit; no queue-width-only or universal race-freedom claim. A2 owns implementation. |

The coordinator-supplied `A2_instrument_pool_cleanup.log` reports three ASan and
three TSan executions of the repaired D1 normal/partial/full-failure fixture.
Its source SHA256 `01a989f2b0ec41c1a023622d468419ce7777dc238917456ef5deb243a6dc0f8f`
matches the local committed fixture exactly. The receipt reports 85 instrumented
definitions and executable hashes `fe8f458d0023f1e9d432b2b076b415ee37ea5f67ef518ee322e76495127bb2a9`
(ASan) and `5a115028a7fea0507eb0641c4f329f76c25dda53502cf1c27b527a91f8c3a306`
(TSan). This is A2 execution evidence, not D1 local execution or a complete
source-tree identity receipt. The supplied sanitizer contract instruments every
linked Tower fixture/transport/runtime unit before ordinary object compilation;
only final linking adds the sanitizer runtime. Source-language UBSan and other
hosts remain unsupported. Final merged-source validation stays open.

The D2 budget handoff, source `6a2536b`, patch SHA256
`0eb43211d08bd6428916f6ed8b831c9689e66b6f55e755930a6c25af0d66de55`,
adds `scaffolding/tests/build_tool_budget_checks.tower` (61 lines reviewed).
It owns fresh output directories and bounded byte buffers; argument vectors
borrow caller text only through synchronous child completion. Five invalid
budgets must return status1 and publish neither object nor executable. Real
serial/two-worker builds must produce nonempty identical object bytes. This is
configuration/determinism coverage, not overlap or speedup evidence. Generated
artifacts intentionally survive for inspection; the test rejects reuse of an
existing output root. D2 retains implementation ownership. D2's status records
actual execution and independent executable-byte comparison; D1 has reviewed
the draft, not run or integrated it. Add its exact integrated path to the roster
when the source arrives.

Fresh D1 repaired-pool browser receipt at source `ce4527a` (fixture hash unchanged
from the A2 exact-source receipt): public-pin smallest Wasm target8/8, followed by
existing required-thread pool/failure tests2/2, skipped0. The pool completes128
normal+partial/full failure lifecycles in one host with real four-worker barriers;
worker-trap propagation also passes. Peak Node/process RSS151788KiB, runtime3.07s;
artifact SHA256 `b8a187c629a73845f19584e462034c2c9c58b65e57e80b9971b3d8901e5db67f`.
This closes the previously pending fixture-level browser repetition check. It
is not the full browser compiler matrix, live allocation accounting or final
merged-source release validation. Long balanced native normal profiles and their
remaining small-effect uncertainty are recorded in the journal.

### Additional A2 fixture review at D1 ce4527a (incoming drafts)

Reviewed the complete ten new test sources from the coordinator's five-commit
`validated_checkpoints.patch`, SHA256
`9809853d1cfe6802e0427671a7c1e6d7dcd6dc74a89bd6f1352f20885f7fe011`.
The table identifies their original implementation commit. None has been built
or run by D1, and none is added to the initial 437-file integrated scope. With
the three prior incoming test reviews, thirteen draft test sources have receipts.
The existing owners retain implementation responsibility; D1 owns generic runner
registration after coordination. No new race/invalid-memory sensitivity execution
is planned or authorized by this review.

| Path (under scaffolding/tests) | Reviewed commit | Storage, ownership, scheduling and evidence disposition |
| --- | --- | --- |
| `work_ready.tower` | `0b57994d` | One private WorkGraph and bounded private ticket array; exact FIFO after targeted yield, reverse producer completion, sorted/compacted ready positions at 2/3/33/513 tasks, stale dispatch/revision and post-cancellation rejection. Serial coordinator mutations preserve task authority; the new ready-slot field is a derived index, not packed entity storage. No timing/parallel execution claim. Fatal assertion exits are distinct from recoverable worker cancellation. |
| `work_select.tower` | `0b57994d` | Forward/reverse exact targeted admission for 32/4096/65536 independent tasks verifies identity, completion and empty ready/running state. Linux x64 clock/rusage ABI reports wall/CPU/peak RSS plus retained graph capacities; the capacity sum omits allocator overhead and other allocations. Pure scheduler microbenchmark with assertions, not useful compiler overlap or universal constant-time proof. Keep explicit measurement registration separate from timing pass criteria. |
| `work_budget.tower` | `8d8faee3` | Private ledgers and receipt array check owner/revision/generation/slot identity, duplicate/altered/stale release, busy disposal, exact lane/byte saturation and overflow/exhaustion. Seed314159 drives8192 reserve/release choices checked against independent scalar totals and a bounded entry count. Optional zero-lane retained-byte grants and snapshots preserve separate memory/lane lifetime. Declared reservations are not actual allocator/RSS limits; this is serial reference coverage. |
| `work_budget_profile.tower` | `8d8faee3` | Private ledger and zeroed receipt allocation, repeated reserve-all/release-all for1 and12 lanes; checks every grant and exact final/peak totals. Linux timing and retained entry capacity isolate ledger overhead; no threads or compiler work execute. Fixture allocation ends before ledger teardown, and no copied live ownership is treated as transferable. Measurements belong in an explicit target, with no speed threshold. |
| `work_budget_shared.tower` | `8d8faee3` | Four distinct pthreads must enter a barrier before release; shared ledger operations use the same semaphore gate and per-call errors, with private8KiB scratch, copied stale receipt rejection and locked snapshots.2048 iterations/worker assert exact completion and bounded lanes/bytes; coordinator reads job outputs after receiving all workers. Defers release blocked workers, close/drain pool, release outer permits, dispose ledger, then close signals. Allocation failure marks a failed job without retaining its grant. Fatal assertion traps are not recoverable cleanup evidence; production allocator and independent sanitizer receipt remain required. |
| `work_kernel_admission.tower` | `07246521` | Typed job array includes a nonzero kernel-member offset, distinct private results/256KiB scratch and coordinator-owned explicit lane/byte grants. Gate-protected active/caller counts and barriers prove simultaneous caller+worker admission under1/4-lane cases, including count0/1/2/8, sixteen rounds. Exact results/prefixes and distinct thread IDs checked only after dispatch joins; permits persist through verification/publication. Subsequent ordinary callback must work; a separately named callback rejects incompatible batch transport without dispatch. Fixed8-thread pool is stress coverage, not a profitable host budget/default. Requires incoming dispatcher/projection and shared-budget source, not baseline compiler APIs. |
| `work_kernel_overhead.tower` | `07246521` | Preallocated typed jobs and pointers are initialized before dispatch, reused only after joins, and every trivial arithmetic result is checked. One warm dispatch separates retained transport overhead from first use.1/2/4/8-worker cases report wall/CPU/RSS plus partial retained bytes; no barrier or independent-work duration proves useful overlap. Pool closes before borrowed arrays leave lifetime. Explicit profile target only; no speed assertion. |
| `work_kernel_profile.tower` | `07246521` | Frozen million-byte input shared read-only; each typed job owns SHA state/digest/time/thread fields. Every result matches the independent FIPS million-a vector; timestamp intervals report observed overlap and caller work across1/2/4/8 configured workers. Join precedes result reading and input release. Pairwise interval inspection is after measured dispatch; first-use transport cost remains inside measurement. Capacity sum is partial retained storage, not live allocator accounting; sample results/speedup must be measured on each host. |
| `tool_output_identity.tower` | `5911d9cc` | Unique mkstemp source plus hardlink/symlink/missing paths live through synchronous identity checks and are removed in reverse deferred cleanup. Exact alias outcomes and ten thousand repeat comparisons exercise frozen paths with shared ByteBuffers. Ordinary mode returns nonzero if hardlink is accepted; explicit measure mode can expose the old defect but is never a passing regression. Linux clock/rusage fields and buffer capacities exclude former realpath allocations. Does not claim immunity to filesystem rename races. Requires A2 statx helper prerequisite; do not register measure mode as correctness. |
| `work_signal_observe.tower` | `21c2b43d` | Valid native semaphore handoff: worker writes42, signals completion, waits before reading coordinator's84. Both blocking-wait and polling-try acquisitions must publish the same payload. Named thread is joined in a defer before stack/signals expire even on return5; initialization failures return explicit3/4. No WorkPool edges obscure the semaphore under observation. This is ordinary valid synchronization coverage, distinct from deliberate race probes; needs exported named symbol and production pthread transport. |

Registration design, not implementation: use the existing native Linux
`TOWER_WORK_TESTS`, `tower_runtime_object`, production guest runtime and
Threads/dl linkage. The common object rule compiles `--library`, while eight
incoming fixtures currently use top-level calls. A scoped entry-point adaptation
must wrap those unchanged calls in an exported main before shared registration;
`tool_output_identity` and `work_signal_observe` already export main. Five ordinary
regressions are ready/budget/shared/admission/identity; selection and three other
profiles should have explicit measurement targets with no elapsed-time oracle.
The observer's two valid modes can be registered separately. No second scheduler,
compiler implementation or test language is needed. D1 requested the entry-point
handoff before touching A2-owned sources or shared CMake registration.

### Parser retained-buffer failure: fixture contract, no root-cause claim

D2 reported a failing run of the unchanged `parser_benchmark.tower` against
production source `60741c5` and public pin `9653f818...`, cpuset0,2, normal
release compiler with the explicit serial test allocator. At256 symbols all11
measured rows retain8748 buffers/803 allocation calls; at512, six rows retain9521
buffers/1577 calls and the seventh retains9522, then the existing assertion aborts
with actual exit134.1024/2048 were not run. These are D2 status receipts pending
copied raw logs, not D1 execution evidence. GNU time's printed Exit status0 does
not override the signaled process status.

D1 reviewed `syntax_session_setup/next` and `host/memory_instrumented`: each
iteration resets the session, consumes/releases the grammar declaration outside
timing, then measures the generated statement and root release. After five
warmups it compares the single-owner allocator's live-buffer count between
identical requests. This deliberately includes retained session/world storage,
not merely live returned parse trees; it does not count bytes or every libc
allocation. The session is not advanced through EOF after the statement.
The one-buffer increase therefore violates the fixture's existing stability
contract but does not establish whether a leak, bounded index growth or another
retained allocation caused it. B1 owns production attribution. Keep assertions,
warmup count and errors unchanged; historical stable parser-port measurements
are not a correctness guarantee for the current storage implementation.

Copied raw receipts subsequently reviewed independently: diagnostic log SHA256
`a4be48f0297e93efd9a679323a9ca012daf3e2f8673e8c400076c342f9dbce60`
contains those exact18CSV rows and a core-dump report; link log SHA256
`f8906e142caafedadd3fab734d0cb1c41c20edf3790f3f63f7cefae366084745`
explicitly links `runtime-instrumented.o` and `tower_work_serial.o`. Exit134
still comes from D2's process receipt, since the CSV file lacks a status field.
This confirms the observed retained-count step and serial allocator boundary,
without resolving its cause or claiming a local rerun.

### D1 implementation receipts after f6b8267

The root-authorized entry wrappers preserve all eight incoming fixtures' ordered
checks and add exported main/return0 only. Original/public-pin executables passed
before edits; common library-mode objects and all ten registered executables
built23/23. Seven ordinary CTests passed, zero skips; four balanced before/after
pairs passed all64 fixture/profile executions. Exact output checks remain separate
from timing claims. Short SHA timing samples vary and leave a possible small
regression unresolved; see journal and registration raw logs. New linked-target
positive instrumentation and final coherent compiler validation remain open.
Registration patch identity: `d4857ed13086e23aa001628b389818dc15ad4dd100fb62729783f2dfcb1cc284`.

`integer_negation_checks.tower`, `floating_checks.tower` and `narrow_checks.tower`
now explicitly select Foundation for eight existing literal strings. Expected
expressions/rejection messages and raw-versus-Tower semantics are unchanged.
Direct original/corrected inputs at jobs1/2 prove missing-import failure becomes
zero success or the intended range/type error; diagnostics are byte-identical
across settings. Three smallest units compile. This does not claim full numeric
execution matrices or final changed-compiler bootstrap closure.

`driver_differentials.tower` now reports an unexpected negative package-emission
subprocess status before its existing success assertion, using a deferred private
ByteBuffer and shared number formatter. Other expected signals are unaffected.
Exact valid signed32 repro observes SIGALRM/-14 and remains failing. Healthy
before/after four-variant print output is identical,21.69/21.32s wall and
113244/113228KiB. This validates diagnostic behavior without changing a deadline
or claiming the slow case fixed. Smallest unit and driver target compile;
positive instrumentation of this changed path remains pending.

`parser_benchmark.tower` has a separate unvalidated oracle draft: explicit serial
world and typed private page index, exact live component ownership, real allocator
layout/byte accounting, unchanged timing window and default warmups, stable cache
identities, exact attributed buffer deltas and session/world teardown. Partial
pool lists are insufficient because full pages detach; the observer enumerates
owning entities instead. Conservative per-live-component byte bounds are not low
fragmentation guarantees. Actual requested/live/unused-slot bytes are reported
separately from RSS. No compiler payload mutation, extra authoritative model,
production allocator change or assumed noalias contract was introduced. The
original failing fixture source and logs remain available; draft compilation,
equivalent profiles and128-reset stress are pending the shared host slot.

B1's additional diagnostic `scaffolding/tests/parser_retention.tower` was reviewed
from source SHA256 `f0033081ec3a8623b01d0ecc38c4d00e3f92b436b50c6ef57a4e2cb7086c4688`.
It uses explicit or legacy host worlds, serial-counter guard, private page
identity enumeration through actual table/component owners,128resets at each
size, and exact owned-world teardown. Snapshot allocations end before the next
parse; slot capacity totals are not byte/RSS measurements. Its source preserves
the old failing assertion as an attribution companion, not a passing replacement.
B1 CSV/link/binary identities are supplied; D1 has independently read them, not
executed that diagnostic. It is a one-off experiment; avoid introducing a second
permanent benchmark when integrating the strengthened existing fixture.

### Incoming owner snapshots received 2026-11-22 21:00 UTC

These ten complete source bodies were reviewed from the coordinator's hash-verified
`audit_source_snapshots/receipt.json`. A2 HEAD is `04a877813fc4859f5f77e77524f74d1d1a54f3d8`;
B1/B2 HEAD is `60741c515b3ca40b3b39aed61fb38a82694ae9ea`. They are explicitly dirty or
untracked owner snapshots, not committed integration or local execution receipts.
All paths below are under `scaffolding/tests/`; implementation ownership stays
with the stated lane. Together with the earlier thirteen incoming test reviews
and B1 diagnostic, these add ten substantive reviews beyond the initial437;
changed bytes and remaining missing bodies still require independent receipts.

| File / owner / reviewed SHA256 | Storage, world and scheduling review | Coverage, limits and disposition |
| --- | --- | --- |
| `entity_locality.tower` / A2 / `dbdab851e48685ebc21b425cca2069aeadf2c9251beb56ca6af836469af109c7` | One explicit store/kind; component pointers remain stable through deletion. Pinned query/table views and a private copied payload snapshot are built before traversal, closed before structural mutation. Dense copy is derived, never authoritative. | Independent arithmetic sums for1024/65536 rows across owner lookup, component query, archetype column and dense-copy traversal; copy construction reported separately. Keeps one live slot per page to measure fragmentation and malloc-usable bytes; checks surviving addresses and full store teardown. Linux/glibc measurement boundary, serial traversal; no vectorization/noalias or parallel-speedup proof. Owner profile retained. |
| `layout_frontier_profile.tower` / A2 / `46bdbdee47458b658f10627e614c973da0e464b7fa8c887335442f96952a4d26` | Actual semantic entities, ordered fields and shared layout pump; explicit synchronized WorkBudget with an outer reservation and bound world. Chained versus ready branches exercise dependency-frontier admission. | Checks every reference size/alignment/field offset, completed graph and zero running workers; ledger retains only outer grant until ordered cleanup. Reports pool peak explicitly as admission, not overlap.1/2/4/8 budgets and8/1024 fields; source alone establishes neither profitable scaling nor observed concurrency. Requires A1/A2 coherent API closure. |
| `work_budget_allocation.tower` / A2 / `fe6f08420e7937439e90bad7fc8e03c407ea76a09b0d1d4e8f3d9d425352a8cd` | Existing serial allocator transport enforced. Fixed receipt array and ledger-owned vector; snapshots preserve storage pointer, generation, counts and peaks after allocation failure. | Empty grant allocates nothing; first/growth failure leaves inactive output and old receipts intact; reused slot changes generation and rejects stale copy.16 rounds return exact buffer baseline. Complements real threaded shared-budget stress; not thread sanitization. Requires extracted work_budget_types. |
| `lr_state_benchmark.tower` / B1 / `7f6df821ee1e75bacc2c25b50c5c7eeab51978ca52fafca7f66980b88f4feff3` | Immutable generated production/symbol arrays plus explicit worker-budget world/anchor. Serial reference and derived parallel LR tables disposed after use; world checks quiescent teardown. | Compares every ordered item range/origin and transition against ordinary serial LR, outside construction timing. Small/chain/wide/large bounded inputs;3warmups/15samples, repeated short cases, CPU/RSS/switch/entity counts. Retained entity/component equality checked each sample. Host worker cap checked; queue width alone is not overlap. Owner opt-in benchmark. |
| `parser_retention_observer.tower` / B1 / `6fade0fafde84305791bce383416e326be28c2cc600fbc7bc749fb9442f0b02c` | Joined/quiescent-world-only observer; enumerates actual owning components including detached full pages, uses a private vector disposed before return. Overflow-checked requested-page layout and pooled payload-byte census. | Verifies page type/live/used/capacity, summed live owners and pages≤pooled owners; compares semantic/cache counts and exact nonpage buffer remainder. Excludes individual allocations explicitly, reports requested bytes not RSS. Serial counters are not threaded instrumentation. Attribution helper, not an alternative production storage model. |
| `frontend_units_profile.tower` / B2 / `2e4b84e4bb341ef3aeaddb205aea5b91e962207762c57e08921bc5e061e63b50` | Fresh unit worlds, bounded source snapshots, per-ordinal private observer spans; nested backend closes before frontend and spans/source expire after joins. Shared ledger snapshot read only after timed completion. | Late comptime helper plus many decltype/loop bodies; executes answer42 and hashes canonical Foundation after timing. Reports timed span overlap separately from reserved lane peak, retained bytes/objects/entities/CPU/RSS. ELF envelope is not object execution; canonical hash needs cross-run comparison. Backend observer events intentionally excluded from outer span measure. Requires B2/A1/L2 coherent closure. |
| `frontend_units_memory.tower` / B2 / `008ca9d7c17074d9cde97ae12905cc0afd3a5c5c60ab547ad1973b5cf6c5e37a` | Explicit source lengths, bounded world/environment and shared reservation receipts. Private source suffix proves length handling. Batch close and world/module/interpreter disposal follow completed work. | Exact resource/source caps, overflow, embedded NUL offset, denied replacement preserving old source, successful replacement releasing previous receipt. Direct compiled bounded input executes answer42. This validates accounting and semantics, not concurrent OOM safety or RSS limits. Source reviewed; implementation/runtime receipt pending. |
| `frontend_units_allocation.tower` / B2 / `28e3e4a001fa7237a6e5c5fa8427b6582dbb80d602203c535aaf52281d276cb7` | Enforces serial fault-counter transport, primes a reusable ledger slot so failure targets two source snapshot allocations. Retains batch/source ownership across failure; root helper reads grammar into deferred vectors. | Both allocation positions reject replacement without changing used bytes/lanes/live receipts/buffers; original program then compiles and batch teardown returns exact baseline. Good focused generic frontend_main registration candidate under granted D1 ownership. Await coherent helper/import closure; no production edits transferred. |
| `module_cache_profile.tower` / B2 / `0930654a30c0845e3ca804827257385d6dabcbc1c7767985350df780471f1148` | Explicit world/environment; generated diamond module snapshots and private ByteBuffers. Parse roots/session handles are disposed each sample; shared module cache lives until environment/world teardown. |3/18 layers,1/4 budgets,4samples; checks unique module count, invalidates shared leaf, rejects old grammar and accepts new grammar through all paths. Timed operation includes parsing/cleanup and count oracle; reports CPU/RSS/entity/component retention, not exact byte census. Worker setting alone proves no overlap/speedup. |
| `foreign_tool_checks.tower` / B2 / `1ac2930becdca1e7d88ad7b1a2265e0e8609c982011112b92391dd566e4fb5d1` | Private input/output/wrap buffers, existing runtime-binder alternate entry, deliberate serial allocator profile. All owned buffers/symbols close before baseline comparison; no world or scheduler needed for text transport. | Plain/quoted/comment/backtick allocation failures preserve original bytes and release allocations; measured symbol allocation count targets later output/wrap failures. Successful expansion compares exact output and wrap flags. No new native shim; registration must preserve serial profile and alternate main binding. |

Remaining limitations: incoming source review does not validate owner algorithms,
new manifest mappings, ABI compatibility, instrumentation, or final release. The
B2 allocation helper imports work_budget_types/frontend memory definitions absent
from this checkout; do not copy only its hook and call the integration complete.
The ordinary-recursion oracle request in body_runs is pending the exact A1 failure
receipt and coherent L2 classifier; existing SelfReference/HeaderSelfReference,
layout and evaluation-query graph-cycle fixtures remain separate coverage.

### Additional constructor, lifecycle and budget snapshots

Reviewed all twelve bodies delivered in `audit_additional_tests`: eleven new paths
below and the existing work_ready update. Copied L1 HEAD
`bc4f942e72a66a41c6f5e18c1f3cfb216e23e1a5` and L2 HEAD
`0817375496d2dd6841107c1b91133058eaf12f8d` describe the source snapshot location,
not ownership transfer or clean committed bytes. Root independently verified the
remote A1 lifecycle and B2 cache helper hashes after copying. Every listed path
is `scaffolding/tests/<name>.tower`; these receipts do not claim execution here.

| Name / implementation owner / SHA256 | Substantive review and disposition |
| --- | --- |
| `driver_unit_budget` / B2 / `634777b72bdd62b06b61aef0ebf955da1e3417600d01868c45666a7a7c3fd630` | Uses actual DriverOptions parser and disposes its allocated options after each case. Checks default versus explicit retained-byte policy, missing argument, zero/negative/text/max/overflow rejection and unchanged jobs parsing. No scheduler/world needed for CLI policy parsing; does not itself measure or enforce compiler RSS. Snapshot was copied through L2, production ownership stays B2. |
| `world_budget` / B2 (A2 shared ledger) / `77802e6415f1744aa8e9cb75232387874f677eb12163460706da742e5af30b02` | Explicit fresh worlds and borrowed ledger lifetimes, bind-before-entity/type/cache-work contracts, rejects repeat/unsynchronized/undersized binding and reuse after historical identity. Distinct worlds reject wrong-owner receipt release; stale copies cannot release new grants; exhausted budget yields zero extras. World closes before ledger/gates. Synchronized ledger cases start no workers and conditional omission on unavailable transport is not concurrency coverage. |
| `lr_budget` / B1 / `32f7ab239560386550012f41476bc66134a07432717ba3ae65271638fcb2c4ef` | Uses actual shared kernel pool, one extra plus caller and a two-party barrier with serialized active counter. Checks total simultaneous participants separately from offloaded pool peak. A bound world exercises full/no/one-extra grants against competing outer reservations and retained LR pool, then exact remaining ledger ownership. Defers close pool before stack/gates expire and world before outer/budget cleanup. Transport-unavailable early return supplies no overlap proof; surrounding selector must retain capability evidence/timeouts. |
| `execution_rejection` / L1 / `e07686661970188a72d57255eb1fb0d9f662df942da0d36ef62d1daedfd3c7a9` | One reusable ExecutionSession owns machine/program/output state. Malformed short/full envelope rejects before graph allocation; step/start/fast/closed-session calls remain terminal without effects. Explicit length excludes suffix; interior NUL offset and zero-step rejection checked. Encoder rejects unsupported width/profile/overflow before reads; validates container/semantic/cache version changes. C/Roku unsupported function graph clears output and retains checked graph for answer42. Real negative input/API tests, not unsafe-memory sensitivity probes. |
| `execution_type_construction` / L1 / `a3d82ca765a10556f20ad2f722997117606e2cdcb8b87383421d1a2c6369f64c` | Mutates only owned checked Foundation entities between invocations. Both target widths execute operand callbacks once per visit, preserving left-to-right output; pending retries retain step/sequence/output identity. Producer result moves to private type table, request is consumed; capability denial, failed producer and sequence overflow terminate honestly. Fast runtime rejects reached construction after ordered effects. Direct protocol injection isolates interpreter contract and is not frontend syntax acceptance or a parallelism test. |
| `backend_type_construction` / L2+B2 / `5b09619a7d729d9c14d18d6fb50d775fd406aba1be56661d5ddcc0db960c4396` | Creates real explicit-world Foundation entities with owner attachment and target-specific descriptors, no mock IR. Native/Wasm and O0/O2 lowering must call both operands in order once before compile-capability trap, restore caller source offset, avoid type-table publication and produce valid target artifact. Private LLVM context closes before root/world. Does not execute emitted object or establish runtime construction support. Changes coordinate with both type/backend owners. |
| `type_construction_execution` / L2 / `bbc45255c61f02573a69d63c628869280a38bf754fc555c34c9b017001214071` | Ordinary source tests integer/float/pointer/array helpers, mutable local loop/branch computation, lazy untaken invalid helper, nominal box alias, self pointer, fixed array and function type identity. comptime results become ordinary local types; decltype/sizeof and values compare against concrete references, output is failure count. No new type registry or constant folder. Runtime execution path capability and nominal/function classifier acceptance still depend on owner integration. |
| `type_execution_receipts` / L2 / `2025f988cc8eaffe8eca738d3b0e6bb473fb25a82a35b228bf388534c310480d` | Explicit world/context/evaluation component, reserved WorkGraph access range and dispatch ticket before constructor request. Ten cases cover complete/semantic failure, stale revision/profile/dispatch, changed sequence/operand, wrong target/dependency and cancellation. Repeated admission shares identity; later visit must create distinct request and result. Cancels graph before context/program/world cleanup. Serial protocol test, not proof of threaded lease safety. |
| `semantic_source_proof_checks` / A1 / `847bba9ef141227d02aadbf7273b30b5b8aa3cebd4801c5e79987087626defb8` | Actual declaration and per-function scan entities in explicit world. Suspends earlier scan while a full later frontier completes; private pipeline results remain unpublished until eligible owner completes. Repeated waits reject stale ticket and release borrows (structural attach at boundary); cancellation/failure never publishes proof. Resumption verifies exact dispatch counts/no replay and retained pipeline identity, then releases context/root/world. Worker count/frontier alone is not overlap evidence; owner production instrumentation still required. |
| `semantic_lifecycle_checks` / A1 / `9e87a1162e989eeb9e91ac241a59177df6d20ceedd31c46c2ddba9398ade31cb` |23 source-level cases at widths4/8 and budgets1/4 use owned unit snapshots, completed graph publication and ordinary interpreter output references. Compares serial/worker canonical bytes or deterministic error text; serial Foundation reparse executes same expected result. Includes signature-only demand, exactly-once initializer effects, nominal aliases/recursive pointer versus by-value cycle, untaken invalid/forward/mutable reads, nested comptime, early read/capture, reused capture, escaping/mutable/parameter owner cases and single instantiation trace. Root reports known failing capture miscompile; preserve that failing oracle, do not call matrix accepted. |
| `module_cache_checks` / B2 / `5376e1d1760688db3a8910f81aa2bed474ef11528f86c524856f99596c417c7f` | Minimal exported entry delegates existing production module/cache/session regression suite, preserves its nonzero failure code and documented scaffolding working-directory requirement. Reuses parser_modules link profile, introduces no second cache test implementation. Correct wrapper alone does not validate underlying current cache behavior. |

`work_ready.tower` update SHA256
`6e8ee34e63516ba46e9f948ae3655d909a200ec8b88f7a0756a7896edfaf6aa0`
was fully reviewed against the existing fixture: moves the expected-order array
before request creation and derives both loop bounds from its element count.
Expected order1,3,4,2, stale/yield/reset/cancel assertions and sorted/compacted
selection cases remain unchanged, as does D1's exported main wrapper. Adopted
under root handoff after owned jobs drained; new source is included in the focused
instrumentation freeze. This is an updated receipt for an existing path.

### Concurrent stage lifecycle fixture at eabc88e plus authorized owner source

`scaffolding/tests/entity_stage_concurrent.tower`, A2 source SHA256
`26265ebb52427481465d0fe88101e4ccded781e356be71cc9244b84d5882f0e7`,
reviewed in full (205 lines) before unchanged adoption. Explicit EntityStore,
registered component and context own the graph. Each worker has a distinct leased
owner and private stage; WorkGraph write range and ticket precede dispatch.
The ordinary target reference is released under a pinned view, queued holds are
acquired twice to check idempotence, and only then is the view closed. Joining
does not release the stage lease. Coordinator publishes/discards each stage,
settles or rejects cancelled tickets, and releases the shared worker reservation
after publication; pool drain precedes stack/store teardown. Finalizers check
coordinator identity and release referenced targets. Exact per-trial zero entity
and component counts plus expected finalizer totals validate logical cleanup;
RSS alone does not establish allocator leak freedom.

Five outcomes (publication, cancellation, worker failure, duplicate name and
partial admission), sixteen rounds and two/four workers exercise160 trials.
Shared entry/release barriers prove simultaneous admitted kernels, distinct
pthread identities and zero unadmitted work. Four workers on this Deck's two
allowed cores are concurrency stress, not four-core speedup evidence. Type/data
payloads remain stable sparse component storage with stage-private allocation;
ordered child publication and named member index are checked independently.
There is no new authoritative IR, scheduler or noalias assumption. Thread
capacity is a required capability; missing transport fails rather than skips.
The fixture is registered in the existing Linux x64 work harness with its
required dynamic worker symbol. Actual independent execution receipts follow;
owner-reported passes are not substituted for local validation.

Independent execution at the recorded eabc88e freeze: direct native3samples,
registered native3samples plus CTest1/1, actual ASan3 and TSan3 CTest repeats all
pass with zero skips. Exact direct/registered fixture and runtime object hashes
match. Both sanitizer-linked objects contain actual instrumented code; full
commands/symbols/hashes and timings are retained with the journal receipt. This
covers valid stage lifecycle stress and leak/race detection on this host, not a
full compiler or browser milestone. The integrated scope is now462 D1 paths
once this fixture is committed; review coverage is distinct from runtime closure.

### Current execution/reachability handoff review

After all owned builds drained, reviewed all1677 lines of L1 full-base patch
c3066f54d08f05c5549655a1602aefe7ae59bb6f6259f8358f0758daaa416560 and L2
incremental3e7c7527df45d416ed0522fb6981e47d1f97dd0103eebdfef0fb30eb1d407a80.
Applied by checked three-way reconciliation atop1ff28f6; existing interpreter,
context, fast interpreter, package and tag blobs already equal owner postimages.
A1 role publishers and D1 generic registration/oracle changes remain intact.
These are updated source receipts; owner runtime reports remain separate.

| Path under scaffolding/tests | Updated substantive review/disposition |
| --- | --- |
| `execution_cases.tower` | Each existing ordinary guest source now explicitly imports Tower; numeric data, pointers, foreign side effects, recursion and error limits unchanged. Deliberate invalid guest addresses remain checked interpreter inputs, not native sanitizer sensitivity probes. Graph/fast comparison still owns reference behavior. |
| `execution_core_cases.tower` | Explicit Tower imports except Foundation grammar override fixtures11/21, preserving their raw grammar intent. Existing invalid declarations/calls/by-value cycle remain invalid with unchanged source bodies; no blanket compiler fallback. |
| `execution_core.tower` | Structural roundtrip oracle builds a private bijective source/reconstructed node correspondence, then checks actual binding targets instead of compilation-local ordinal equality. Negative test temporarily borrows matching names on distinct declarations, redirects only owned reconstructed binding, then restores all vectors/bindings before teardown and requires equality again. Shared/cyclic edges are bounded by visited pairs. Private O(n²) validation index is not authoritative IR or measured performance optimization. All sessions and scratch dispose; exact existing field/order/name checks remain. |
| `execution_semantic_cases.tower` | Ordinary imports explicit; unsigned negative literal and assignment-through-scalar cases remain Foundation contracts. Accepted ordinary type argument is replaced in negative arity row53 with genuinely excessive arguments, and the newly accepted form has positive coverage below. Opaque printing, integer-only comptime value parameters and ordinary recursion have current exact diagnostics; independent by-value/alias cycles retained. Numeric offsets adjusted narrowly for changed semantics/imports, not ignored. |
| `execution_semantics.tower` | Prefix-aware exact offsets preserve entry provenance, including separately mapped no-span recursion limit. Same-spelling multifile errors locate relative to owning declaration. Added inferred type-value argument compares graph/fast true output and canonical roundtrip at widths4/8. Full invalid table still fails fast with source/diagnostic context; no test omission. |
| `execution_packages.tower` | Explicit Tower import in original/checksummed mismatched source, length derives from exact changed source. Existing checksum, malformed header, reconstructed Foundation/cache disagreement and retained-state rejection assertions preserved. |
| `execution_main.tower` | Focused source/encoder/rejection/type-construction/core-static selectors reuse existing harness and full `all` selection. Owner-specific diagnostics remain nonzero; no new scheduler. Explicit world regression still follows semantics/core paths. Source reachability uses same modules/resource root and runtime owner. |
| `execution_rejection.tower` | New exact SHA74ab97021661479cbccd2b4dfc0f9593eef6ddf5349e8e2716e57c5d1e477d87 supersedes earlier snapshot. Added source reachability checks require C/Roku nonempty output, exported function definition and unchanged Foundation fingerprint; ordinary graph execution independently checks42/1. Reached type values must still clear output with exact capability diagnostic and leave graph executable. This does not compile/run the emitted C/Roku text. Earlier bounded-input/session/encoder checks preserved. |
| `execution_type_construction.tower` | SHAa3d82ca765a10556f20ad2f722997117606e2cdcb8b87383421d1a2c6369f64c exactly matches earlier full review. Now integrated rather than incoming. No new source or runtime acceptance inferred from adoption. |
| `source_execution_reachability.tower` | New19-line ordinary source SHA91ca378c1b914755307efe0f641777255339f36631c16e20d94ac130c0243351. Unused private integer type helper must not enter runtime derived traversal. Mutually recursive direct calls terminate at42; uncalled export remains interface root; global initializer executes once and reports42/1. Canonical declarations remain intact. No heap ownership, world or scheduling implementation in guest source. |
| `type_binding_checks.tower` | L2 SHA5c53a76316262e80908dbded2ffc1c4ef79da343c1d22b0c2e53a57da2ea3faf adds six reached/unreached/exported/indirect/recursive cases per width and byte-identical canonical before/after. Scope-private sessions/format buffers dispose. Root reports current Runtime type-value reachability assertion failure: preserve it; source review is not fulltypes acceptance. Added shadowed local `function` value forwards ordinary integer constructor and expects size2. |
| `frontend_units_allocation.tower` | Exact B2 newer SHA28e3e4a001fa7237a6e5c5fa8427b6582dbb80d602203c535aaf52281d276cb7 supplied/re-authorized by root after smallest-unit Unknown function failure. Only two imports and10-line root wrapper differ; two resource vectors outlive existing allocation test, then defer disposal. Underlying memory helper byte-identical. Generic frontend hook unchanged; smallest failed unit must rerun before larger build. |

D1 new incoming scope is three tracked paths from this handoff, of which two
already had full source reviews. Latest type reachability and lifecycle failures
remain acceptance gaps. No production semantic change authored by D1.

### Shared harness boundary refresh at e4505ba

Reviewed coherent-base changes against60741c5 after the constructor handoff;
these update existing-path receipts rather than adding files or runtime passes.

| Path under scaffolding/tests | Boundary and coverage conclusion |
| --- | --- |
| `backend.tower` | Calls owner constructor-lowering regression before existing object-format/foreign tests; dedicated nonzero failure92 preserves attribution. Uses existing backend context, no extra runtime/scheduler. |
| `backend_units.tower` | Added retained-byte admission rejection, exact target-byte threshold, denial-before-publication and output receipt retention after join. Streaming batches borrow frontend ledger; independent later targets own their ledger. Explicit early close resets batch to avoid double cleanup and must restore baseline receipts before frontend destruction. Existing timed overlap barrier remains, including its current600s outer timeout/30s internal failed receipt on owner host; root has requested isolated helper extraction without deadline changes. |
| `driver_units.tower` | Existing multi-unit inputs include decltype, comptime and generic nominal types. Added tiny retained-byte rejection and positive finite budget on the worker run. Original depfile/serial-worker executable result checks remain; CLI budget option itself is not RSS enforcement or concurrency evidence. |
| `frontend_units.tower` | Worlds remain distinct, now share one WorkBudget and use the total ceiling rather than dividing static outer lanes. Checks joined zero execution lanes with retained input grants, cancellation drains workers while inputs remain owned, and exact ledger identity per world. Source byte and world-budget tests run before existing widths/serial-worker comparisons. Peak admission remains distinct from actual overlap. |
| `evaluation_query_checks.tower` | Reuses extracted shared types/API and named SemanticQuery tags. Body pipeline identity is obtained through its owning component, admitted count through public query, preserving no-replay and later-frontier tests. Added current source-proof/type-receipt hooks; unused stages must remain unstarted and real graph cycles are retained. Initializers own complete setup before reads; structural marker still proves view release at pump boundary. |
| `semantic_world.tower` | Removes heavy implementation import cycle in favor of exact public declarations/types and external evaluation_query_tests. Existing explicit world/kind/stage checks preserved, query code linked separately by owner manifest. The split reduces import closure rather than deleting validation; whole-link validation remains pending locally. |

L2 follow-up13f3b7e1c6b61301683c9f99ebbb0d2ff8b46f94e32c751ca4d56059bf105703
updates type_binding_checks after canonical inspection: an unused local type
alias is erased from the executable graph, so that source remains a scalar-only
negative. Adds an actually returned runtime type value, indirect return and an
export whose mutable local type participates in a conditional comparison. Seven
cases per width now distinguish erased aliases from retained runtime values;
canonical before/after equality remains mandatory. Failure prints source and
wanted/actual class before aborting. No production predicate or compiler semantics
changed; owner's smallest compile passed, joined runtime remains unverified here.
The original failure is retained as evidence of the incorrect fixture assumption.

### B2 overlap isolation and editor fixture follow-up

Root-authorized B2 backend_units full source SHA
2e1774aebd81209ce801156525caac45578240512fd6f66788971e5afcabad90 was compared in
full against the current reviewed fixture before adoption. Existing streaming
loop body is extracted verbatim into backend_units_stream_trial, with identical
world/input/signal lifetime and batch drain order. Full width/budget matrix calls
that helper; new exported focused entry prepares the same independent serial
64-bit object baseline and calls budget2. Shared ledger checks, every output
byte, actual distinct worker identities and30s deadline remain. Only diagnostic
messages become directional; phase output flushes are OS diagnostics. No test
skip, timeout increase or production scheduler change. D1 lr_work_main adds one
explicit backend-overlap selector, leaving `all`/`backend` coverage unchanged and
reusing the same executable. Before/after runtime attribution remains pending.

B2 editor_observations patchf862f1a46f8870d7c9d3f6ddb38bbd89837e3e7fe1033c270478ab1eaa575eaa
only adds import tower to two completion source strings. Cursor still derives
from strlen; expected valid parameter/field labels and serial-worker snapshot
comparison unchanged. Original missing-import failure was owner-reproduced;
current independent execution remains pending. No implicit source-prefix policy
or editor-world ownership change.

### Parser retention oracle independently executed at127ca98

The earlier draft is now compiled and executed against a fresh public-bootstrap
compiler closure. Original fixture is preserved in an isolated8.3MiB source
snapshot and linked to the same production objects; it still aborts134 at512
symbols when live buffers9521 become9522 (18 measured rows emitted). GNU time
records signal6 but its trailing exit-status field is0; the saved wrapper134 is
authoritative, never a pass.

New fixture passes three default and three128-reset stress samples for
256/512/1024/2048symbols. Every component owner/type/store and per-page live count
is checked, including full pages outside partial-pool lists. Exact capacities,
strides, requested bytes, live payload and unused slot bytes follow the reviewed
allocator policy. Stable semantic/entity/component/live-byte totals and cache
pointer identities distinguish payload ownership from page fragmentation.
Buffers minus counted pages stay exact; session closure returns to its world
baseline and final world disposal returns to initial tracked-buffer count.

At the final stress iteration:35/41/49/65pages, requested302525/355063/413167/529375
bytes, live payload127584/141920/170592/227936bytes, unused71320/94616/94616/94616
bytes, two cache entries, no individual component allocations. Larger cases gain
one16223-byte page with16128bytes additional unused slots, then remain stable
through iteration127. The bound is deliberately loose: one live-owned page per
pooled component is legal, not evidence of low fragmentation/packed payloads.
No arbitrary buffer slack or extra warmups were introduced.

Default samples wall0.14/0.09/0.09s, CPU0.12/0.08/0.08, peakRSS52308/52188/52272KiB;
stress0.56/0.58/0.60, CPU0.55/0.57/0.58, RSS52308/52240/52260KiB; all zero swaps.
Same source/workload, public pin9653f818, new production compiler objects,
serial transport/world budget1 and unchanged five warmups. Before abort cost and
after completed workload are not comparable end-to-end. The old implicit world
retains two additional bookkeeping buffers; the new explicit world owns/disposes
its state. Matching-prefix parse timers/allocation outputs remain available, but
the census touches storage outside timing and can warm caches: no speedup claim.
Actual ASan of this new census remains pending; fault-allocator assertions are
not sanitizer evidence. Patch19da2e17e5c896c8d6bccd1e5629697ed7736a7ed8784eb0b9081179ea3ee75c
and raw receipt are in coordinator D1/parser_retention_receipt.

### Capture successor reviewed as an incoming draft

Read all296 lines of A1 capture_ranges8a6829e1f34e6ce37027f60b50d8eeb22f355a5971aa90eded2dbf9811bec161,
full lifecycle replacement0ceb023afed073550bad34f8facc891074a7fdda62b2bf60a74dd0c9196575df
and source-proof fixture41454429a6ec1a68094cb289bb0f81a230a2996eb7debd11fc31392eda8c927c.
No implementation applied during review. Root explicitly tracks unresolved
aggregate consumer/lifetime, terminal invariant and120-byte eager per-initializer
metadata measurement; source inspection does not close those gates.

| Incoming test path | Full review conclusion |
| --- | --- |
| `scaffolding/tests/semantic_capture_module.tower` | New5-line ordinary resource imports Tower, owns Captured=7 and read() returning that binding. Two lexical module aliases must resolve this same nominal declaration, so a write/escape via either invalidates required capture via the other. No world/scheduler/heap implementation; lifetime belongs to importing frontend session. D1 roster/A1 fixture ownership, pending integration. |
| `scaffolding/tests/semantic_lifecycle_checks.tower` | Replacement expands23 to30cases, preserving serial/four-worker32/64-bit exact canonical or diagnostic comparisons and ordinary-interpreter Foundation reconstruction. Adds nested staged array7, aliased module read14, module write/escape rejection, complex Earlier=Later+1 early-initializer rejection, returned global Pair7/8 and local aggregate capture15. Original signature-only, exactly-once initializer, nominal/cycle, untaken/mutable/owner-frame cases remain. Module inputs are snapshotted by existing frontend loader; batches/buffers outlive consumers and dispose. Expected wanted values are independent concrete references; general range acceptance remains pending. Preserve separate D1 ordinary-recursion oracle when replacing hooks. |
| `scaffolding/tests/semantic_source_proof_checks.tower` | New171-line version clears runtime root.items after requesting proof, requiring retained source identities to publish immutable declaration facts. Holds one scan while later frontier joins, rejects stale ticket, checks no view survives pump boundary, exact dispatch counts and no replay. Creates a later lexical function/local to exercise generic-extension protocol; separate Invalidate mode injects mutations only after scan join and requires error without silently rewriting an already consumed proof. Context/program/root/world close in order. Injected mutation checks publication handling, not discovery in real generic syntax: actual specialization write/alias discovery remains a requested end-to-end regression. Worker count/frontier size alone is not overlap proof. |

Range review: coordinator attaches source initializer metadata before that
function's lowering lease/view; worker writes preattached range payload, and
capture observes exact revision/profile/dispatch before cloning only that range.
Cloned declarations/bindings are remapped under an ordinary evaluation function,
not a second interpreter. The publication==0 and all-demanded-required-succeeded
checks are asserted lifecycle invariants awaiting joined evidence, not accepted
source-language restrictions. Requested persistent generic-alias-write coverage
through coordinator; no competing A1 implementation or weakened oracle.

### Current acceptance evidence boundaries

| Contract | Representative evidence and remaining gate |
| --- | --- |
| Executed/untaken staging dependencies | Lifecycle untaken forward/mutable/invalid-helper and type-construction ordinary loops/branches exist with independent expected outputs. Current source query/type/lifecycle execution remains pending; old passes retain original identities. |
| Cycles versus ordinary recursion | Genuine SelfReference/HeaderSelfReference, by-value layout and graph failure cases remain. Ordinary constructor recursion now expects interpreter call limit. Newest full type/capture matrix remains open. |
| Stale/cancelled requests and aliases | Type execution receipts cover revision/profile/dispatch/operand/sequence ownership; source-proof fixture covers suspended dispatch and cancellation. Generic syntax write discovery still needs an end-to-end case, separately from injected joined-output invalidation. |
| Stage leases and reference lifetime | Exact A2 concurrent-stage source passes direct/registered native plus3actual ASan/3TSan runs, including cancellation/partial admission/failure/collision and57792 finalizers per run. Source-specific evidence does not certify whole compiler race freedom. |
| Parser retention and fragmentation | Three normal/three128-reset stress samples pass per-page ownership census and exact session/world teardown at127ca98. Extra page16223bytes is attributed, no packed-storage or speedup claim. Actual parser census ASan pending. |
| Canonical serial/worker behavior | Existing LR tables, lifecycle canonical text, type protocols and execution binding-correspondence oracles preserve bindings/order/effects. New focused runners compile; latest joined runtime receipts are pending. |
| Scalar external callers | Explicit-language JSON10 passes published browser11checks and isolated Roku JSON test; old native signed32 timeout and separate Roku population timeout remain. Current rebuilt compiler caller validation still required. |
| Bootstrap/package/release | Clean documented native build127ca98 passes with verified42resources and no stale forwarders/private override. Final newer compiler freeze, browser/generation/full supported instrumentation and atomic published/hosted verification remain open. |

### Shared assertion output boundary at4635241 plus scoped fix

`scaffolding/tests/frontend_units.tower`: all20 direct importers reviewed for
this boundary. Failure originally wrote buffered stdout then aborted; D2 lost
its diagnostic and repeated a113.56s selector to recover it. Added only the
existing opaque libc stream ABI and `fflush(null)` between `puts` and `abort`.
No successful-branch allocation, scheduling or ownership changes. Actual
public-pin object disassembly confirms the successful test/jump/return bytes
are identical. `scaffolding/tests/parser_benchmark.tower` receives the same
failure-only change; its page census, timing, ownership and bounds are unchanged.

Two frozen scaffolding snapshots import the actual before/after helper from an
identical temporary Tower program. Three passing runs per version return0 with
identical output; all six controlled assertion failures preserve signal6/raw134.
All three old failure outputs are empty; all three new outputs retain preceding
context and the exact assertion. This is ordinary diagnostic validation, not
unsafe memory/race probing. Raw logs/objects/source hashes/disassembly are under
`build/d1_ecs/assertion_diagnostics`. Final ASan parser result remains pending.

### Additional incoming owner review during the ASan freeze

Capture ranges v2 `0d04fe88` replaces the earlier query-registration sentinel
with a program-root capture component marking successful producer drain. New
capture admission checks that marker; exact lowering revision/profile/dispatch
checks remain. Read all300 patch lines. This is review only: descendant payload
leases, late/aggregate acceptance and eager metadata measurement remain open.

B2 native identity `77df2699` adds owned lexical absolute source/root buffers,
keeps them through module/environment use, disposes after worlds, and checks a
relative plus absolute import executes one shared helper exactly once. Its
`driver_module_paths.tower` fixture retains two entry spellings, quoted paths with
spaces, exact stdout42, and deferred file/buffer cleanup. Not adopted yet.
B2 fixture-import patch `ea7bfd6a` needs reconciliation: its shared writer adds
Tower before every case although current D1 differential/C cases and scalar JSON
already deliberately import Foundation. Routed exact caller evidence to root/B2;
do not replace their explicit language contracts with blanket activation. The
separate generated `measure_kernel` source still lacks an import and may need its
own owner-scoped correction. No runtime validity is inferred from this review.

### Actual parser ASan closure at4635241 plus diagnostic-only edits

The shared address mode rebuilt the actual parser target from public pin9653f818
with one build/compiler lane in D1's LLVM19.1.1 Docker environment, CPUs0/2.
All26 direct Tower objects and all four linked memory-archive members have ASan
references; the actual link, source mappings and hashes are retained, rather than
inferring instrumentation from C flags. Build67/67 passes437.01s wall,
428.25CPU,818908KiB RSS,0swaps. Artifact SHA
a04347eea55ec97806626258e1c64b7c5982bbe0e7888b193914597fe18b4cbe.

Three normal and three128-reset stress runs pass under
ASAN_OPTIONS=detect_leaks=1:halt_on_error=1, raw0, with44/492 measured rows each.
Normal/stress ownership diagnostics are byte-identical to earlier normal native
receipts. Full session/world teardown assertions pass with no sanitizer findings.

| Samples | Wall seconds | CPU seconds | Peak RSS KiB |
| --- | --- | --- | --- |
| Normal1/2/3 | 1.55 /1.05 /0.87 | 1.50 /1.03 /0.85 | 146656 /145260 /146540 |
| Stress1/2/3 | 7.19 /6.46 /6.43 | 7.06 /6.36 /6.32 | 442596 /446804 /448708 |

All samples0swaps. To investigate high stress RSS, a separate same-input run
with only ASan quarantine reduced to16MiB passes6.59wall/6.53CPU/115240KiB and
identical ownership output. This attributes much of the RSS to sanitizer
quarantine; it does not replace default-quarantine acceptance or prove every
byte's origin. Requested component bytes/live payload stay distinct from RSS.
The observer deliberately uses serial fault-count transport, so no threaded
sanitization/scaling or UBSan coverage is claimed. Newer incoming compiler
candidates remain outside this frozen production127ca98 receipt.

Full logs, commands, source/object hashes and nm evidence:
build/d1_ecs/parser_asan_127ca98, exported to D1/parser_asan_receipt.
Every owned process drained before releasing the shared heavy slot to D2.

### Owner handoffs and registrations prepared after40768d9

Reviewed exact owner patches and new fixture sources before adoption; local
runtime validation of this newer closure is pending. Previous parser ASan
receipt does not validate these changed production units.

| Path | Reviewed identity and substantive disposition |
| --- | --- |
| scaffolding/tests/backend_execution_roots.tower | B2 fixture SHA dda143e624da801d4c6563873d72fa24d5c2fc0a0df126e5b10c4725aad43390,32lines. Explicit Tower, shared global effects, direct/callback/recursive references, unused type helper and retained uncalled export. Independent output45=21+20+4 and effects2. Registered as native-only file input without language injection. Raw/optimized output checks do not alone prove uncalled export retention; separate ABI/backend coverage remains required. |
| scaffolding/tests/semantic_layout_profile.tower | A1 v2 SHA dc299e613dc2df5648bb51af82133e74e6f6c38dab7f67ba3eb2bfd5d152dee3,191lines. World-owned type/field and observation components;11query nodes over one derived layout graph, private offsets and per-job clock/thread/call payloads. All metadata attached before dispatch. Callback invokes production kernel, exact field sizes/offsets independently checked, joins precede context/root/world disposal, synchronized shared budget returns all reservations. Two warmups/three samples, five field sizes, requested1/4 and occupied-lane case. Actual interval overlap and host-capacity cap qualify scaling; cumulative RSS and derived-vector bytes are partial memory measures. Opt-in compiler-unit target only, no default/CTest/time threshold. Current initial-frontier grant behavior is measured, not silently replaced with A1's experimental scheduler changes. |
| scaffolding/tests/driver_differentials.tower | D1 generic registration adds file snapshot helper and optional independent expected output to native path. Both callers audited: existing embedded cases pass null and preserve behavior; new file supplies45,2. Same single graph reference then raw/optimized executions, avoiding redundant compilation. ByteBuffer owners use lexical cleanup; exact file bytes including explicit Tower import remain intact. Unknown/package-only selection behavior remains explicit. |
| scaffolding/tests/driver_module_paths.tower | B2 native-identity77df2699 adds relative and absolute entry spellings importing one helper by both lexical forms. Actual helper effect42 must occur once; deferred temporary-file/buffer cleanup preserved. Host driver owns absolute lexical strings through environment lifetime; no symlink identity claim or browser-key normalization. |
| scaffolding/tests/driver_request.tower | B2 diagnostic1110c19f adds nonempty-error oracle to every failed allocation trial before close. Existing complete buffer balance, distinct worlds, stage ownership, idempotent close and missing-source/grammar messages remain. Request target now consumes existing production driver-source property, including platform path/stat definitions. B1/B2 independent sweeps pass; D1 current-source sweep pending. |
| scaffolding/tests/driver_measure_cases.tower | Exact D2 measured repair0caf05cc adds Foundation only to generated arithmetic/memory kernel text; body, output/reference and sample policy unchanged. Distinct from rejected blanket Tower writer prefix. |
| scaffolding/benchmarks/compiler_wide_functions.tower | D2-owned addition from0caf05cc,12lines reviewed as an incoming dependency, not D1 ownership credit. Reuses shared stress generator, explicit Tower import, one owned ByteBuffer and deferred disposal. Generated complete-file import is essential because every file begins with Bedrock seed. |

A1 API patchbc7525c7 only exports two existing layout functions and declares
them in the shared query API. CMake profile target reuses current compiler
sources/libraries and guest runtime property, avoiding another implementation
closure. Root explicitly authorized this registration and the one-line request
manifest correction. B2 native/backend index and diagnostic patches remain
owner implementations; D1 does not claim their full production audit or runtime
acceptance from integration.

The dd87 registrations now compile and execute. Request fault sweep1/1,
three alternating old/current native fixture pairs and all55layout trials pass
their correctness oracles. Actual layout overlap remains1/caller11 for every
requested width: this measures a scheduler admission limitation, not speedup.
The same current source passes query smoke and editor1/2/4/8. Exact timings,
source hashes and failure/retry history are in the journal and
build/d1_ecs/registration_followup. No full known/capture acceptance follows:
pre-range CLI diagnostics also reject pointer/cycle controls generically, so
no existing rejection expectation has yet changed.

### Capture v3 and standalone type profile preparation after2451cfd

The exact corrected four-path v3 patchf5d3f2bd was reviewed against v2.
Its new declaration lease is substantive: function leases are not recursive,
so each source-initializer declaration payload is leased on the already-open
lowering stage before dispatch. Metadata remains allocated before pinning and
worker writes; exact ticket/publication ordering is retained. Program-root
successful-drain marker remains the final capture-admission boundary. L1's
aggregate private-storage review and current runtime/memory/race evidence remain
required. D1 adopted only after all own jobs drained, with partial-late-capture
prerequisite immediately replaced before any build.

| Path | Current review and evidence boundary |
| --- | --- |
| scaffolding/tests/semantic_lifecycle_checks.tower | Full30-case owner replacement SHA942947e8; earlier complete v2 review remains applicable. Independent expected values, mutable/escaped/module aliases, complex early capture and global/local aggregates, serial/worker widths and canonical reconstruction retained. Current v3 runtime pending. |
| scaffolding/tests/semantic_capture_module.tower | Full5-line new resource SHA3019815e, explicit Tower and the shared Captured initializer/helper. It supplies one nominal module identity to both aliases; actual effects and mutation/escape behavior are checked by lifecycle cases, not inferred from filename. |
| scaffolding/tests/semantic_source_proof_checks.tower | Exact171-line SHA41454429. Original roots survive runtime-item clearing; later declarations/generic extension and joined invalidation covered. Invalidate explicitly injects mutation in worker output; preserve the stated gap for real source generic-write discovery. |
| scaffolding/tests/type_reachability_profile.tower | Exact153-line standalone SHA9f1c9657. Serial queries over executed fanout16/256/1000, independent output, canonical byte stability, stable entity/component counts, then checked session teardown. Three samples of256 queries after warm query; process high-water RSS includes checking/compilation. Count invariance does not measure every temporary buffer. The standalone entry reuses existing driver snapshot/grammar/environment setup with deferred cleanup and explicit resource root. CMake now gates Linuxx64 and excludes default/CTest; ordinary execution_main is unchanged. No fake unsupported-host stub or skip. |
| scaffolding/tests/parser_benchmark.tower | B1 changes only two array extents to already-existing BenchmarkCacheCapacity64, retaining all bounds, census, exact teardown and failure flushing. Prior actual ASan source receipt remains precisely identified; new smallest compile/object/normal equivalence pending. |

Neither the30-case fixture count nor exported helper visibility supplies
integrated acceptance. Body_runs hooks and the separate ordinary-recursion
diagnostic remain byte-identical. All known-binding rejection strings remain
unchanged pending actual range-successor evidence.

### Incoming owner checks reviewed after2451cfd

| Path | Review, disposition and evidence boundary |
| --- | --- |
| scaffolding/tests/backend_execution_index.tower | Full104-line B2 fixture from patchdb1807dd. One private frontend world owns the original graph; retained function bits and a deliberately mismatched caller vector are disposable derived indexes. Checks unused type omission, direct/callback/recursive/export retention, exact canonical bytes after both success/failure, serial allocation-failure cleanup and complete outer buffer baseline. No concurrent allocator or packed-payload claim. Its lowering import includes backend exports, so register the helper in the existing backend checks object, with only an extern in frontend_main; owner coordination pending before that unit edit. Runtime pending. |
| scaffolding/tests/editor_world.tower | Exact B2 hoverdffdad44 plus review5f43191c. Ordinary parameter and exact return/call token function kinds are retained assertions; all four constructors check selected-token operation kind and description. Query owns observations until disposed before world. Shared text describes ordinary array element count without imposing compile-time-only constructor policy. Current focused frontend check pending. |
| scaffolding/tests/entity_registry.tower | Exact B1 registry64d55417: explicit Foundation fixture, explicit resource root and owned module provider. Destroy provider before unchanged node/component baseline; still intentionally exercises legacy default-world registry boundary. B1 independent parser/storage pass, D1 current dependent build/runtime pending. |
| scaffolding/tests/parser_main.tower | Exact registry caller now passes its existing current-directory resource root; formatter resource argument preserved. No new runner, skipped test or changed oracle. |
| scaffolding/tests/storage_main.tower | Exact registry caller forwards existing argv resource root. Comments reflect owned module snapshots; actual counts still enforce teardown. |
| scaffolding/tests/driver_differentials.tower | Failure-only package context now records target, optimization and signed raw child status, including normal nonzero exits. Existing capture, 30-second deadline, success comparisons and failure assertion remain unchanged. No fresh pass claimed until changed-unit/target and current package run. |

The newly reported missing body root import is already fixed here in07e0a30;
exported only that original one-line hunk for B2. Its old279.50-second body
matrix remains old-source evidence. Current v3 valid global/local aggregate
captures fail in D2's independent run, and the coordinator reports incorrect
acceptance of existing address/comparison negatives. Preserve all these oracles;
only L2's separately justified two message corrections are reserved. The old
semantic_world boundary patch is already present and is not the outstanding
failure-drain fix.

At frozen cd8a30c, standalone profile and all six changed-unit builds pass;
actual target closure and opt-in exclusion are verified. Both nine-row profile
runs preserve outputs/canonical/counts; two extra current components are stable,
not a complete buffer census. Query and focused editor checks pass. Driver
failure-only context is independently exercised by an output-directory error,
with unchanged rawexit1, and the still-failing signed32 package child now exposes
its exact target/optimization/-14 status. Full package acceptance remains open.

Current storage fails before registry in unchanged compiler_storage reset input:
without a language/provider, bare print is not seed syntax. Root approved the
minimal Bedrock reset-stimulus repair and failure-only utility flush; pending
implementation/retest. This does not weaken any lifetime/failure assertion or
relabel B1's older storage pass. Detailed measurements/failures are in the journal
and capture_harness_cd8a30c logs; no full compiler release claim follows.

The reviewed7ac integration adds no new Tower path. `execution_main.tower` now
also calls the existing type-object reachability oracle in source-rejection;
it retains the standalone profile boundary without the obsolete shared Linux
import. `known_binding_checks.tower` accepts L2's exact two independently
reproduced mutable/parameter source-proof diagnostics. Address/comparison/cycle
programs and expected failures are byte-unchanged. All newer D1-side fixtures and
registrations survive the merge; new runner execution is pending, not inferred
from historical fulltypes results.

### Joint capture, stage and parser source review after453d8b1

All changes below are prepared after owned jobs drained; current local compilation
and runtime remain pending. Owners' previous measurements are distinct receipts.

| Path | Review and disposition |
| --- | --- |
| scaffolding/tests/compiler_storage.tower | Exactly three reset stimuli now use seed-valid single Bedrock declarations. Null provider,100iterations, retained original provenance pointer/text, exact EOF, injected failure diagnostic and complete buffer baseline stay unchanged. Fix follows actual cd8 assertion failure and independent root/L2 reproduction. |
| scaffolding/tests/utility_checks.tower | Add portable existing libc fflush boundary only after failed puts and before original abort.107direct importers enumerated; success branch unchanged in source. Before helper/source snapshot retained for actual success/failure output/status and generated-code comparison. Cross-host final checks still required. |
| scaffolding/tests/semantic_lifecycle_checks.tower | Exact full42 c25f9c36 retains old30 cases and adds12 executed/untaken address/effect tests, relocatable type/function values and explicit-address policy. Six new positives/six negatives; each pointer width compares workers1/4, only successful serial cases reparse. Full42 is168source trials+52canonical reparses; policy subset48+12. The added count is not acceptance. |
| scaffolding/tests/body_runs.tower | New CapturePolicy enum mode reuses existing resource buffers/defer cleanup and owner policy helper, returning before unrelated body file reads. Existing full/type/control paths retain their checks. No new scheduler or alternate expected results. |
| scaffolding/tests/lr_work_main.tower | Add only explicit capture-policy selection to existing native worker entry. Existing worker-host assertion/default/full paths and unknown-selector failure retained. |
| scaffolding/tests/execution_main.tower | Same policy selection uses supported nested else/if, correcting an uncompiled else-if draft after root review. Existing aggregate positive helper now runs once for full/types/known/aggregate-stages. No separate binary, duplicate import or removed source-rejection reachability hook. |
| scaffolding/tests/comptime_aggregate_checks.tower | Factor only the existing positive source loop by filename; preserve both engines, exact0 output, width4/8, canonical reconstruction, workers1/2/4/8 and all five negative source/oracle checks. New captured-input wrapper uses the same loop and owner source. |
| scaffolding/tests/aggregate_capture_inputs.tower | New59-line L1 fixture, corrected v2 SHA25e8f5ab: nested pair/array/type/function/null-pointer/empty fields, global and local capture, repeated nested frame reads (22x32=704), ordinary copy mutation isolated from original and another capture. Empty struct size1 follows existing semantic_layout_kernel and independent old/new compiler evidence; the prior0 expectation was wrong. Independent0-failure output remains. Ordinary Tower values, not a new host representation or graph. |
| scaffolding/tests/interpreter_call_query.tower | L1 consumer adds private-invocation, nested-frame snapshot lifetime, retained-root, cancellation/reuse, scalar store and ordinary copy/fill rejection checks with unchanged bytes. Correction ef0147df adds a local read before the nested return so storage survives an observable ix_step boundary; no original assertion is relaxed. Interleaving is not real parallel execution. Stack projections remain alive until both invocations dispose; world teardown checked. Owner query-smoke32/64 serial/threaded passes; D1 current local run pending. |
| scaffolding/tests/entity_stage_concurrent.tower | Updated exact A2 fixtureca8cf683 adds one distinct pre-leased existing payload per worker, write access reservation and stable pointer/table assertions before/after publish/discard across original outcomes. Discard does not roll back payload writes; all stage pointers/leases clear. Root/type/plain ownership and original reference finalizer counts still close exactly. Prior26265ebb receipt does not cover these added assertions. |
| scaffolding/tests/entity_tables.tower | A2 adds four modes for stable and empty leased owners: unchanged publication, mixed structural additions, duplicate-name failure and discard. Pinned view rejects publication/removal; after closing it, same payload/table identity and no pending rows remain. Repeated publication/complete store disposal checked. No claim that table indexes pack payloads. |
| scaffolding/tests/parser_integration.tower | B1 valid trace fixture owns its world/table/stream, prints bounded trace and checks span before release; it adds no fault allocator dependency to the shared production parser object. |
| scaffolding/tests/parser_trace_failures.tower | New47-line6df8c085 serial-only fixture warms trace toggles, injects every preceding allocation failure, requires no marker on rejection, checks owned marker/refcount, allocation-free repeat/remove, exact child/reference/buffer baseline and restoration of caller setting. Its success-seeking loop has no explicit bound; reported to B1 as a source-review failure-diagnostic gap, not an observed hang. |
| scaffolding/tests/parser_failures.tower | Calls that trace fault fixture before the original explicit-world parser allocation/diagnostic tests; original teardown assertions remain. |
| scaffolding/tests/parser_main.tower | Serial-only import/call of trace fault fixture; updated bool ABI detects failed trace configuration with nonzero diagnostic. Existing formatter and registry resource arguments preserved. |
| scaffolding/tests/frontend_main.tower | Minimal parser selector calls the same integration/failure suites; no new executable or default-suite omission. Backend-index selector still waits the owner helper boundary. |
| scaffolding/tests/known_binding_checks.tower | Only two address/comparison expected-message strings now match policy595 after B1 independent reproduction and root approval. Both source programs and negative checks unchanged; current local successor checks still required. |

Producer/API/consumer integration was atomic: shared projection2792, A1
publication997aa4 and L1 consumption27a71a9f after policy595/v3. Projections borrow
frozen canonical leaves, all consumer invocations dispose before producer arrays,
and frame-owned target copies reject mutation. No partial ABI build occurred.
A2 stage452c still checks views/names/overflow before its zero-membership fast
path; all ownership/lease cleanup remains. B1 tracea261 is the corrected complete
six-path handoff, never stacked with withdrawn330. Final current instrumentation,
roundtrip/matrix/performance and release evidence remain open.

### Current remaining scope — 2026-11-22 23:44 UTC

- **Implemented and measured, source-specific:** initial437/437 assigned paths
  have substantive rows; prepared additions bring direct scope to472/472 and
  repository census to1047 after staging. The baseline1011 owner ledger and14
  deleted prelude forwarders remain explicit. No newly adopted D1 path lacks a
  review; remotely inventoried unadopted owner files are separately listed,
  not counted as executed or as production-owner audit credit.
- **Ownership/locality evidence pending on current closure:**
  `entity_stage_concurrent.stage_trial`, `entity_tables` publication modes and
  `parser_benchmark.benchmark_retention` now cover stable payload addresses,
  staged membership, held references and attributed page bytes. Prior native/
  ASan/TSan receipts are real but predate current stage/trace changes. Rebuild
  the changed closure and repeat the affected normal/instrumented/stress paths;
  indexes alone do not establish packed storage or bounded allocator RSS.
- **Implemented but unvalidated:** `semantic_lifecycle_checks.lifecycle_trial`
  full42, `body_runs_capture_policy`, `aggregate_capture_tests`, and
  `interpreter_call_query.input_query_tests` need joined32/64 execution,
  serial/parallel canonical comparison, exactly-once effects and deterministic
  rejection checks. Production helper readiness is implemented; its historical
  absence is not an open gap. `semantic_source_proof_checks.source_proof_case`
  still injects a worker mutation for invalidation: real generic-extension
  source-write discovery remains an A1 production/fixture gate, not satisfied
  by the injection test.
- **Failure/cancellation/staleness:** earlier `work_pool` early-return drain and
  stale ticket checks are measured. Current aggregate input cancellation,
  immutable store/copy/fill and nested-frame observation must pass the revised
  query fixture; A1 `semantic_world` failure-drain handoff remains pending.
  B1 owns bounding `parser_trace_failure_tests` by a measured allocation count.
  Do not weaken preserved graph cycles or infer race freedom from passing tests.
- **Profitable scheduling remains unproven for affected compiler paths:**
  `semantic_layout_profile` measured overlap1 despite requested workers4;
  the root-ready layout/frontier admission gap belongs to A1. Independent
  between-unit overlap has explicit barriers in `backend_units`, but final
  coherent overlap/deadline and throughput checks remain. Two-worker whole
  compiler samples can be slower; queue width is not useful scaling. Shared
  budgets must still be measured on final sources with fast jobs1 retained.
- **Serial CPU/memory and focused harness:** cd8 type-profile large queries
  improved while tiny queries regressed; only one paired process/three inner
  samples, not isolated attribution. Signed32 bytecode still exceeds the
  original30s child deadline. Retry unchanged input/deadline on the stage/joint
  successor and preserve both outcomes; investigate remaining failure with
  backend owners. Current reset/flush/selectors/aggregate hooks need smallest
  predecessor compile and equivalent-output/time/RSS evidence. Backend-index
  fixture registration awaits B2's shared pure-helper linkage boundary.
- **Host and release limits:** Linuxx64 Docker is canonical; direct host pin lacks
  libLLVM19.1. Actual Tower-object ASan/TSan is supported in the documented scoped
  native containers; source-language UBSan and browser/Windows/macOS sanitizer
  coverage remain unsupported here, not passed. Full clean public-bootstrap,
  native/browser/generation and final affected instrumentation evidence must
  identify frozen merged inputs. Old browser JSON passes and population timeout
  do not establish current browser completion. Publication is not requested;
  coordinator named lease, atomic main+gh-pages push, workflow and exact served
  manifest/assets/behavior verification remain required.

### Post01946 harness and oracle review

Current01946 evidence is in the journal: changed units/native/links, storage,
query, policy12, aggregate and parser pass; full42 times out180s and known fails
its preserved early-read expectation. Signed32 now passes all4package variants
under the original30s child limit. Neither incomplete/fullknown is relabeled.

| Path | Reviewed postfreeze change and evidence still needed |
| --- | --- |
| scaffolding/tests/compiler_storage.tower | Exact318149b0 stronger owner variant reconciled by narrow diff: each reset/recovery activates Statement grammar, consumes/releases declaration, then tests statement;100resets/provenance pointer/text/EOF/fault diagnostics/final buffer count remain. Matches owner full source byte-for-byte. Seed-only01946 passes; stronger current compile/run pending. |
| scaffolding/tests/parser_trace_failures.tower | Owner323ae806 bounds the fault sweep by actual successful allocation count after warmup. Every prefix must fail, terminal count must succeed, and ownership/toggle baselines remain exact. Original a261 normal pass is retained; current source/sanitizer execution pending. |
| scaffolding/tests/aggregate_capture_inputs.tower | Ownerd9827cd8 adds a whole empty struct capture with zero projections, keeping exactsize1 and stdout0 oracle. Earlier25e8 matrix passes; new edge must be rerun. |
| scaffolding/tests/interpreter_call_query.tower | Same owner delta requires the exact immutable-capture diagnostic for store/copy/fill, in addition to unchanged bytes/ownership. Existing ef014 query passes; stronger message assertion unrun locally. |
| scaffolding/tests/body_runs.tower | Audited22old occurrences (definition+21calls): old helper remains a wrapper with exact0newline expected bytes; new explicit-output helper shares unchanged world/session/compiler/formatter lifetime and canonical comparison. Added length plus byte loop preserves previous0oracle and supports original7/observed0,7,7. No duplicate compiler runner or guest execution path. Compile/equivalence/timing pending. |
| scaffolding/tests/named_initialization_checks.tower | Existing callers retain width8 wrapper; explicit-width helper reuses the same worker1/2/4/8 failure selection, byte-identical diagnostics and batch/vector disposal. New demanded initializer checks use widths4/8. No broad expected-message weakening. |
| scaffolding/tests/known_binding_checks.tower | Root-authorized contract alignment follows docs and independent original/current receipts. Exact original source becomes7positive; strengthened source checks0,7,7; demanded comptime(earlier) still rejects before initialization. Both positive engines, widths4/8, canonical roundtrip and worker1/2/4/8 are checked. Graph/fast sessions close before worker worlds to avoid extra retention. All other existing negatives stay byte-identical. New529b07e0draft uncompiled; oldfailedknown receipt remains. |
| scaffolding/tests/comptime_capture_values.tower | New8-line D1 fixture SHAebf8e86a imports the untouched formerly-negative immutable-input source; checks input/result7 and exacti32 type, then prints failure count0. Explicit module identity/entry path required in native and browser transports. No world or scheduler implementation; original source remains covered through ordinary import. Current compile/runtime/freshWASI pending. |

New tracked scope will be1048Tower paths/473D1 direct paths after staging this
one new source; all473 have substantive review, distinct from runtime acceptance.
The four browser original classifications have independent native32/64 jobs1/4
receipts. Fresh same-source WASI confirmation is still required before browser
oracle validation; alias remains negative with Cannot infer type argument 'T'.
No new browser test logic is implemented outside Tower; transport changes remain
pending. Lifecycle per-case/range helper is A1-owned, generic dispatch D1-owned;
full default42/body coverage must remain, with explicit completion records.

Browser follow-up now has independent B1 current frontend evidence: immutable
receipt438bceb6 verifies all source hashes and wasm8bcc91ca, original four source
files compare byte-identically to D1. UTF16LE raw results decoded with iconv match
D1 native classifications at both widths. Production differences are layout
profile exports/API declarations, extra EOFs and ownership comments; this is not
an identical-build or LLVM/threaded-browser receipt. Narrow compiletime transport
now uses three precise diagnostics, and imports the original immutable capture
through the new positive Tower value/type oracle. Both frontend/LLVM transports
receive its real entry path. The original threaded alias negative remains correct
and unchanged. New browser test execution/full backend acceptance is pending.

### Contract correction and retained-buffer v2 review (after bab4c34)

The coordinator's newer contract correction supersedes the preceding unbuilt
known-order529b draft: Foundation325–326/365–367 excludes raw uninitialized
reads from portable differential results. Original source is retained as a
compile-admission positive at32/64, without executing its raw forward read.
The portable matrix now uses initialized state0, one incrementing call, and exact
1,1,7 output across graph/fast, canonical reparse and workers1/2/4/8. Required
comptime(earlier) still rejects before initialization. Earlier raw0/7 mismatch
receipts are investigated out-of-contract observations, not compiler defects or
new passes. Existing lifecycle EarlyRead/CaptureReuse raw observations remain
scoped to their graph engine; strict EarlyCapture negatives are not removed.
No production semantics changed to force raw zero initialization.

Incoming archive71d28d31 and allocator patch07e634dd were read completely in a
separate staging directory, then adopted after D1's jobs drained. All six added
files compare byte-identically with the owner snapshot. Review identity is
bab4c34 plus those exact source hashes; this is source review, not runtime proof.

| Path | Storage, ownership, scheduling and independent oracle audit | Disposition |
| --- | --- | --- |
| scaffolding/tests/work_buffer.tower | e08c4c2f,88lines: two explicit budgets; rejected growth preserves pointer/data/receipt; releasing outer lane leaves physical buffers charged; swapped/moved ownership survives joined publication; stale receipt, null standalone boundary, overflow, u64 alignment,257-element sum32896 and complete disposal checked. Raw descriptors are not implicitly safe copies. | D1 audit/A2 implementation; normal test registered, local compile/runtime pending. |
| scaffolding/tests/work_buffer_faults.tower | d2f6c729,46lines: single-owner ledger allocation failure precedes buffer allocation; later physical replacement failure preserves old pointer/generation/data and exact allocator baseline; successful retry and disposal return both counters to baseline. Imports host.memory directly. | Existing instrumented allocator/trap and serial transport only; no duplicate host_memory object or race claim. Link recipe confirmation and execution pending. |
| scaffolding/tests/work_buffer_shared.tower | 8d5f8a5a,105lines: four production threads enter a barrier with distinct pthread IDs and separate result descriptors; coordinator writes cancellation before releasing the barrier;512 resize cycles, denied growth, join-before-lane-release, retained bytes after cancellation/join, then buffer-before-budget cleanup. Gate outlives budget. | Normal shared-runtime registration with exported work_thread_entry. Four threads on two Deck cores are stress, not profitable scaling. Current native/ASan/TSan pending. |
| scaffolding/tests/work_buffer_profile.tower | 16821eb3,129lines: baseline and budget modes use equivalent8192 replacements plus initial allocations; checks checksum and all4096 retained bytes. Reports actual time-interval overlap, CPU/RSS, allocation count, retained payload, charged peak and separate ledger bytes. Thread IDs are recorded but not compared; distinct-thread proof belongs to shared fixture. Setup/postjoin verification/disposal excluded from timing. | Opt-in Linuxx64 profile; valid budget1 target arguments, documented baseline/budget1/2. Whole compiler budget/outer+nested lane integration and profitable scaling are not established. |
| scaffolding/library/work_buffer.tower | ccc61ca8,68lines supporting owner review: allocation and byte-only grant move together; complete replacement reserved before allocation/copy, old owner intact on failure; physical free precedes receipt release; explicit null standalone boundary; budget and immutable gate outlive every funded buffer. Header bytes included, allocator-private/RSS excluded. | A2 production ownership; exact authorized source adopted, joint owner/runtime validation pending. |
| scaffolding/library/work_vector.tower | 7e95b161,92lines supporting review: distinct nominal descriptor retains budget grant, transactional WorkBuffer borrow, alignment/size/overflow guards and geometric growth; moves/swaps transfer owners and foreach borrows structurally stable storage. No ownership claim for ordinary struct copies. | A2 production ownership; no duplicate authoritative container model, no compiler callers adopted here. |

The B2 host/memory patch factors the previous conservative allocation-size
calculation without changing admission and exports exact header-size accounting
plus the documented two-word alignment guarantee. That is an allocator boundary,
not a global memory-budget implementation. New library packaging is D2/bootstrap
owner work before compiler/tool adoption; D1 did not alter resource manifests.

The generic helper's optional command arguments preserve all old no-argument
profiles. New normal/shared fixtures use production runtime; fault composition
uses the existing instrumented runtime/trap plus serial worker library. No new
scheduler or test runner was added. Runtime, independent before/after baseline
costs, actual sanitizer hooks/stress and final coherent release remain open.
After staging these additions the census is1054tracked/477D1direct, with all477
substantively reviewed; the two production library reviews do not claim A2 audit
credit and new inventory does not imply executed coverage.

Capture-fixture correction: public predecessor rejected the initial direct
value-position decltype comparison at7:4 (build28535 exit1). After draining,
ordinary `var Captured:type=decltype(captured.result)` plus identity comparison
passed the smallest unit (22841 exit0). File is now9lines; value7 checks and
original-module import unchanged. No new syntax or production semantics.

### Drained v3 and aggregate storage measurement follow-up

Build32042 passed corrected capture/generated execution-main and native4steps,
then failed linking v2 serial faults: undefined tower_print. Normal/shared/profile
objects linked first; no runtime test ran. Exact successor archive3b03fc54 was
read as a complete delta against the already-reviewed six v2 bodies. Current
files matched v2 before replacement. The v3 fault fixture uses existing puts;
no output shim or alternate allocator is introduced. Generic registration stays
unchanged. Original failed link/status remain in corrected/targets.log.

- `library/work_vector.tower`: adds ordinary fresh-owner init, explicit-result
  push preserving denial reason and bool wrapper, plus pop with output-before-
  length update and unchanged storage charge. Raw owner initialization is not
  disposal of a live owner. All prior reservation/overflow/borrow rules remain.
- `tests/work_buffer.tower`: now110lines; adds exact zero-size header/overflow
  boundary and66 physical allocation alignment checks, retained-vector capacity
  denial, pop/reinsert result and unchanged output on empty pop. Fresh grant and
  full cleanup remain independently asserted; no scalar type registry involved.
- `tests/work_buffer_faults.tower`: now47lines, output-boundary-only puts change;
  both allocation-failure/rollback sequences unchanged. Still serial-only.
- `tests/work_buffer_profile.tower`: same129-line ownership/control flow, now
 262144 total replacements so short baseline timings are less dominated by
  dispatch/clock noise. README/target modes match; v2 timings cannot be compared
  directly with v3 as equivalent workloads. Baseline versus accounted v3 can.
- `tests/interpreter_call_query.tower`: owner test-only741b6cb4 afterd982 keeps
  all existing call/capture/cancel/immutable oracles, running8-byte and64KiB
  aggregate layouts at32/64. Last projection at extent-minus-i32 tests padded
  storage. Two private frames bound observed payload/memory/initialization
  capacities to4x input plus128 frame allowance; metadata bytes and capacity
  growth observations are reported via existing format_api, not claimed as
  allocation counts or RSS. After disposal all private vector pointers are null;
  retained-root and cancellation behavior remain. Owner3x query passes are
  source-specific external evidence; independent D1 execution pending.

No new path is added by v3/query updates:1054tracked/477direct remains. Fresh
smallest affected units, normal/fault/real-thread checks, cost profiles and
current instrumentation are still required before acceptance.

### Executed current acceptance slice at1a64007

All477 current direct-scope bodies are reviewed;1054tracked total. This review
count does not close the integrated acceptance scope. Exact evidence is in the
journal's1a64007 entry and build/d1_ecs/buffer_defined_order.

- work_buffer v3 normal/fault/shared3x pass; actual ASan normal/shared/fault and
  TSan normal/shared pass, with ten extra shared runs per mode and hook hashes.
  Equivalent262144-replacement profiles expose severe two-worker gate contention;
  no profitable budgeted scaling claim. New caller integration still pending.
- known_binding_checks defined1,1,7/full suite passes135.36s. Independent before/
  current graph/normalized-fast/native control passes. Raw uninitialized original
  is compile admission only; strict demanded rejection remains. Browser capture
 9-line fixture passes both widths and graph/cache/canonical current WASI; full
  LLVM/threaded browser remains pending.
- stronger storage, bounded parser, whole-empty aggregate and immutable-call
  diagnostics pass. Large query measures two64KiB private frames and exact vector
  disposal. Query's later physical-budget ABI handoff is not included in this
  receipt and requires complete dependent rebuild.
- numeric imports in narrow_checks/integer_negation_checks were already corrected
  atb23d6d5;36 publicpin/current CLI spot checks reconfirm intended errors/zero.
  Incoming reports from older owner snapshots do not justify duplicate changes.
- Current frontend fixture transport is explicitly serial/fault; LR/execution and
  standalone shared tests use production native work. Neither requested lanes nor
  functional comparison establishes useful scaling; measured compiler jobs2 still
  loses to jobs1 for both common inputs.

Read-only incoming review identified shared-ledger interactions: parser table
charges invalidate snapshot-only postjoin counts/tight compile caps in the
frontend handoff. Owners supplied an exact input subtotal and finite reserved
compilation allowance successor; joint runtime is pending. Type-only split also
requires explicit defining-module imports because Tower has no implicit re-export.
D1 reported missing WorkBuffer/work_vector imports before adopting the split.
No incoming production edit has been silently folded into1a64007 evidence.

### Production profile registration prepared after 4a5d872

The complete incoming `module_cache_profile.tower` body (175 lines, SHA256
0930654a) is now adopted unchanged. Its substantive review above remains current:
explicit worlds, retained module snapshots, unique diamond counts, shared-leaf
invalidation and complete teardown. It is a D1 audit path with D2 measurement
ownership, not new production parser logic. The frontend profile is now 227 lines,
SHA256 57e392d9, following D2's v2 transport guard: production threading must be
available before timing, and eligible equal-unit controls require overlapping
spans on distinct pthread IDs plus admitted lanes above one. Raw observations
remain available on failure. No timed-region or answer/canonical oracle changed.

D1's opt-in Linux x64 CMake targets reuse the production backend source/library
closure with its old main removed, matching B2 recipe 7749a2a3. Both export only
the three required work/backend callbacks, with no serial or instrumented
allocator override, extra guest runtime, or test-only named callback. The default
frontend measurement is three units/two lanes/no extra bodies; module cache has
no arguments. Neither is a default build or CTest test. Smallest source compiles
are independently reported by D2; these new registrations have not yet linked
or run locally. Actual performance, overlap and final closure remain pending.

This adds one current tracked path after staging: 1,055 Tower files and 478 D1
direct paths, all substantively reviewed. The earlier incoming-only module-cache
row was not counted as a tracked file. Documentation itself has no runtime cost;
the new executable registrations still need checked before/after measurements.

### Physical-owner integration review after fe7a660

Exact owner handoffs were applied only after D1 jobs drained: type split 7f9fa3c4,
explicit imports a4eb4477, parser 9e4d5f50 plus cfd3d2c0, frontend c65497c8 plus
6e961029, backend retention 93b99934 and interpreter 9228ea76 after 741b6cb4.
D2's additional ad306d0a imports defining WorkBuffer modules in both production
callers and IMState in the query test; no duplicate nominal definitions. The
split-added final blank was removed, without algorithm changes. These sources
are prepared, not covered by the earlier 1a64007 execution receipt.

| Path / reviewed owner artifact | Substantive conclusions and disposition |
| --- | --- |
| `scaffolding/tests/parser_table_budget.tower` / 9e4d5f50, 80 lines, source 5804dab8 | Explicit world-bound ledger; full-cap table creation denial, exact object/header receipt, construction denial with partial runtime/context cleanup, successful retry, stable reused storage and no duplicate grants. Direct table/state/context subtotal is separate from other LR/world allocations. Table and world retire before ledger; instrumented buffer baseline restored. New parser_failures call preserves existing failure suite. Local runtime pending. |
| `scaffolding/tests/frontend_units.tower` / c654 + 6e961 | Existing per-unit source snapshots and canonical/execution oracles retained. Independently computes exact physical input subtotal, checks it before dispatch and after join/cancel. Whole ledger uses justified lower bounds and peak cap because cached parser owners now coexist. Joined lanes are zero; retained inputs survive until close. Counts do not prove full memory accounting or overlap. |
| `scaffolding/tests/frontend_units_memory.tower` / 6e961 | Independent documented four-word allocation-header expectation. Finite 64 MiB compilation allowance is reserved during tight input denial/replacement checks, then released before compilation. Exact input ownership, replacement peak and invalid-span diagnostics retained; compilation may add bounded parser owners without changing inputs. No unbounded fallback or deleted denial assertion. |
| `scaffolding/tests/frontend_units_allocation.tower` / 6e961 | Deliberately serial fault allocator, separately failing first/second physical snapshot allocation after priming receipt capacity. Exact old data, input subtotal, ledger and allocation baseline survive failure; finite compilation allowance avoids conflating parser growth with snapshot capacity. Default existing frontend runner already calls its root entry. |
| `scaffolding/tests/backend_units.tower` / 93b99934 | Streaming frontend parsing now retains additional owners. Test compares exact target/object receipt release against the joined frontend baseline, while preserving input subtotal/cap, no active lanes, and separate-ledger exact baseline for later targets. Functional ELF/object comparison unchanged. Does not charge all backend heap allocations. |
| `scaffolding/tests/interpreter_call_query.tower` / 9228 + ad306 | Both target widths, small/64 KiB layouts, budgeted/unbudgeted interleaved invocations. Exact three physical buffer receipt sums per invocation, retained results charged until disposal, full-cap resize denial preserves pointer/length/capacity/generation and values. Existing owner/frame, cancellation, immutable input and no-replay checks retained. World outlives buffers; final ledger zero. Shared IMState/IMContext layout changed, so every dependent object must rebuild before execution. |
| `scaffolding/library/work_buffer_types.tower` / 7f9, 10 lines, 49cb7029 | Single nominal owner descriptor and borrowed ledger lifetime; moves complete allocation/receipt, no implicit copy ownership. A2 production audit remains separately owned. |
| `scaffolding/library/work_vector_types.tower` / 7f9, 35 lines, 035f61b3 | Single type-producing definition with its four allocation-free iteration hooks in the defining module. Stable borrow contract unchanged; generic implementation methods import this definition explicitly. No second authoritative container type. |

### Common-lifetime arena source review

Read all six new bodies from A2 archive 9c01ae65 before adopting them. Existing
buffer files were compared individually and left at the newer explicit-import
versions; the archive would otherwise remove those imports. New arena imports
have the same defining-module omission and are routed to A2 before compilation.
No current arena source/runtime/sanitizer acceptance is claimed yet.

| Path / reviewed source | Substantive conclusions and disposition |
| --- | --- |
| `scaffolding/library/work_arena_types.tower` / 3410b911, 27 lines | Private complete arena owner, linked stable physical chunks, quiescent snapshot counters; explicit borrowed WorkBudget. Shared layouts can import data without allocation methods. This is common-lifetime scratch storage, not an authoritative AST/IR or packed entity payload implementation. |
| `scaffolding/library/work_arena.tower` / bb167f82, 118 lines | Checked aligned bump path makes no gate/heap call; growth reserves a full physical chunk before publication. Denial leaves old chunks/output unchanged. Descriptor lives inside its buffer and is copied before free. Append requires joined borrowers and the same budget lifetime, transfers complete chunks without payload copies. Snapshot separates payload/used/capacity/retained. Resource destructors and borrower drains remain callers' responsibility; no implicit Stronghold safety policy. |
| `scaffolding/tests/work_arena.tower` / 6697f992, 98 lines | Two-budget rejection, same-owner append, retained grants after transfer, denied growth preserving output/data, stale disposed-owner rejection and reusable emptied owner. 128 varied aligned slices plus oversized/zero-size allocations check every byte and exact retained-header accounting; null-budget standalone boundary and final zero grants. |
| `scaffolding/tests/work_arena_faults.tower` / dee0c37c, 45 lines | Existing serial fault allocator fails first allocation and subsequent chunk growth. Output/first-last pointers/data/receipt totals and physical buffer count remain unchanged; retry succeeds and disposal restores baseline. Not concurrent allocator instrumentation. |
| `scaffolding/tests/work_arena_shared.tower` / d9423e43, 115 lines | Four distinct production pthreads stop at a barrier with private arenas. Cancellation and cap denial preserve first slices; normal work creates 2,048 values per worker. Coordinator drains/joins before complete chunk transfers, checks stable values after source disposal and exact payload/retention, then retires joined arena before budget/gate. Four threads on two Deck cores are stress, not useful speedup. |
| `scaffolding/tests/work_arena_profile.tower` / 952b6326, 165 lines | Equal 2,048/262,144 object workloads, initialized variable-size payload with all-byte reference after timing. Raw per-object allocation versus budgeted 4/16/64 KiB chunks; common pointer index is equally pre-touched, outside budget and timed allocation. Reports actual interval overlap, separate allocation/join and retirement wall/CPU, peak RSS, allocation count, payload/physical/ledger/index bytes. Chunk padding/internal fragmentation remains visible; benchmark does not establish compiler speed or allheap coverage. |

Generic registration reuses the existing fixture/runtime/sanitizer path, adds the
same dynamic callback export for arena shared/profile, and extends the existing
serial fault composition to both buffer and arena without duplicate memory code.
Profile is opt-in with valid `arena16 1 large` arguments. After staging the nine
new paths in this integration, census is 1,064 tracked / 483 D1 direct, all fully
reviewed. Link/runtime, measurements, current instrumentation and final coherent
release remain required; the coverage count is only source review.

Defining-import follow-up d167a9c6 adds only `work_buffer_types` to the arena
implementation and `work_arena_types` to its four fixtures, preserving all body
hashes described above except those single imports. Current line counts are
119/99/46/116/166 respectively. Exact draft was sent to A2/root for comparison;
no independent implementation or nominal alias was introduced. Public-predecessor
compile and current runtime checks remain pending the shared build slot.

At 02a78a7, D2 requested a focused serial snapshot-fault entry to avoid repeatedly
running the unrelated body/parser matrix. `frontend_main.tower` gains only an
`allocations` selector calling the existing root allocation test; the default call
and every assertion remain unchanged. Patch dfb232e4 includes usage/transport
documentation. The complete existing allocation fixture was reread: primed receipt
slot, first/second physical failure, exact rollback, successful original-source
compile and final allocator baseline. Smallest entry compilation and selected
runtime/cost are pending; reduced selected work is not compiler speedup.

### Executed frozen f6358ea slice

The journal records exact source/package identity, commands, all timing samples
and coverage limits. Public-predecessor smallest units, complete native11steps
and all27 linked targets pass; source freeze is verified. One basename collision
overwrote the initial library arena timing, so that unit was separately remeasured
under a unique name after drain. No compiler cache object was overwritten.

Normal/fault buffer and arena fixtures, three shared runs each, parser budget,
query buffers, snapshot allocation selector, native unit lifecycle, exact backend
objects with distinct worker overlap, aggregate capture round trips, production
frontend control and import-cache invalidation all pass. Arena actual ASan/TSan
object hooks and hashes are checked; both modes pass ten additional shared stress
runs. This is scoped API instrumentation, not complete compiler/UB/browser/race
acceptance. Earlier default/focused snapshot wrapper export was incomplete by
itself; exact historical wrapper+two imports now exported0cdc2215 alongside the
registration and selector, preserving newer B2 fixture bodies.

Equivalent arena allocation profiles show a useful serial common-lifetime cost
and retention improvement (large arena16 allocation/join4.707ms versus raw18.808;
4235328B data buffers versus12058624B, plus explicit ledger/index overhead).
Two workers lose to one despite real large-workload overlap, and small workloads
sometimes have no overlap. Large chunks waste space for small workloads. These
measured tradeoffs do not establish profitable compiler scaling or justify a
blanket scratch migration before fallible error propagation is complete.

The cache workload independently reproduces the missing B2 old fix:18-layer
warm validation277–309ms versus first35–43ms, with unchanged owner counts. Exact
unique-order validation fix was read, but is not included in f635 evidence.
All483 current D1 paths remain substantively reviewed; no new path was added by
this receipt. New resource-error/clone fixtures and the complete source union
still require fresh review/registration and coherent validation before release.

### Typed resource failures and unique import-cache validation

Reviewed after 5bfa1c6, with exact owner source handoffs deba07ac (B2),
a8ecf458/bad3e4f1 (L1), and 76e1a971 (A1). These remain paired shared-layout
changes; old f635 artifacts cannot validate the new IMState/SemanticEvaluation.

| Path | Review conclusions and disposition |
| --- | --- |
| `scaffolding/tests/interpreter_call_query.tower` | Reports actual bound-world retained and replacement-peak bytes separately from vector capacity. Denied growth keeps allocation, receipt generation and bytes while latching Capacity. Denied startup consumes the remaining budget, requires failed/null private state, then checks partial receipt retirement before world disposal. Existing owner/frame, mutable-buffer isolation and continuation assertions remain unchanged. |
| `scaffolding/tests/semantic_resource_checks.tower` | Full132-line A1 efde967a body reviewed; entry converted to127-line reusable width/worker helper. Two demanded literal producers at offsets11/29 exercise required, inferred and declaration-isolated denial. Checks both started, no running peers, first-source diagnostic, ready+failed query tickets, disposed private memory, no published value, no redispatch on another pump, and zero world/budget ownership. Known proof is explicitly complete only for capture-free inferred literals. Current1B setup targets interpreter storage; future budgeted world constructors must adapt setup without weakening these assertions. |
| `scaffolding/tests/evaluation_query_checks.tower` | Two-line import/call integrates the three cases into existing width/worker query callers. Native LR supplies32/64-bit and1/4worker combinations; semantic_world retains its existing serial/worker caller. No new scheduler, transport, CMake target or separate test runner. |
| `scaffolding/compiler/frontend_modules.tower` (B2 supporting review) | Completed dependency/cycle invariant replaces exponential cacheability path walking. Per-request validation walks retained unique graph order, checks every edge's current lexical resolution and returned bytes, reuses two local buffers, and retains root-byte checking. No persistent memo or authoritative graph added. Frozen before profile reproduced277–309ms warm18-layer traversal; independent after measurements pending. |
| `scaffolding/compiler/interpreter{,_context,_storage,_types}.tower` (L1 supporting review) | First physical-storage error from three WorkVector owners is latched in IMState separately from optional unsupported-stage failure. Success does not clear an earlier error; coordinator must preserve it before disposal. Shared layout requires dependent rebuild. |
| `scaffolding/compiler/semantic_evaluation{,_types,_work}.tower` (A1 supporting review) | Persistent result error survives invocation retirement and isolated diagnostic selection. Both failure/terminal paths distinguish resource errors from ordinary inferred fallback, finish failed tickets, and prevent alias publication after failure. Short nonnull diagnostics are reserved before dispatch. This does not complete fallible general semantic arena allocation. |

Root reports unchanged standalone efde regression failed on the before closure,
then all12cases passed at A1 source1ac577a8 after full62-step build. B2 separately
passed the coherent pair in0.018994s/51460KiB. These are owner evidence, not D1
execution. Entry conversion preserves every trial body and oracle. Local public
smallest units, paired runtime, cache profiling and current instrumentation remain
pending. Scope becomes1,065tracked/484D1direct after adding this one reviewed file.

### Six-lane source reconciliation at root 1fec1b91

Reviewed complete coordinator bundle SHA79350aa1, sole published60741
prerequisite. Merge into D1 main preserves both histories. Two conflicts are
resolved by content: newer L1 startup test covers both first-buffer and subsequent
initialization-map denial, while D1's resource helper entry preserves the same
A1 trial bodies under existing query registration. All original trial assertions
survive or are strengthened; no source was chosen by arbitrary file order.
No merged executable has run yet. These seven new direct files bring the roster
to1,074 tracked Tower paths /491 D1 direct paths, all substantively reviewed.

| New path / lines at reviewed 1fec1b91 | Ownership, coverage and disposition |
| --- | --- |
| `scaffolding/tests/compiler_buffer_contract.tower` /44 | Queries exact four-word header/overflow margin without huge allocations, checks two-word alignment and a typed u64/f64 record, initializes and frees sizes0–129. Shared native/WASI test; no concurrent allocator claim. Existing owner fixture checks fault tickets and zero buffer delta around it. |
| `scaffolding/tests/foreign_tool_checks.tower` /63 | B2 serial fault boundary for plain/quoted/comment/backtick output growth and wrap-flag allocation. Original source bytes must survive rejection; all private byte buffers and foreign names retire. Exact successful mangled output and wrap bytes independently asserted. Existing runtime binder chooses the alternate entry; no native test adapter or threaded sanitizer claim. |
| `scaffolding/tests/generic_clone_fixture.tower` /134 | L2 shared fixture builds ordered/named syntax in one explicit world via actual registry/deferred-header APIs. Each branch records source offsets, exact declaration/use provenance and named next links. Empty deferred destination is required before publication. Root release precedes checked world disposal; fixture owns no alternate clone algorithm or authoritative IR. |
| `scaffolding/tests/generic_clone_storage.tower` /100 | Serial fault trials cover wide256x1, deep1x600, node quota, first allocation and physical growth denial. Exact copied count distinguishes Memory/Capacity/None; discard restores entity/component counts and empty destination. Stage held before last view closes, publish before ready marking, scratch receipts checked before world/budget disposal. Kernel allocation count and physical peak are reported; failure injection is deliberately serial. |
| `scaffolding/tests/generic_clone_parallel.tower` /182 | Production WorkPool/CompilerKernel with explicit shared lane+byte budget, per-job tickets/access declarations, private stages and frozen inputs. Admission barrier requires distinct pthreads; measured clone intervals exclude barrier. Serial/two/up-to-four runs cover publish, cancel and failed peer, exact ordered/provenance results, stale-ticket rejection, joined stage retirement and zero ledger. Overlap assertion is not a speedup claim; four jobs are stress when available, not a host-wide budget exemption. |
| `scaffolding/tests/module_cache_checks.tower` /16 | Thin B2 entry reuses existing module/cache/session regression function and propagates exact failure code. Requires parser_modules composition and scaffolding cwd; no duplicated cache checker. Correct linking/runtime evidence belongs to that explicit composition. |
| `scaffolding/tests/token_text.tower` /27 | Ordinary Tower program independently checks backtick names, generic calls, negative signed minimum, floating negative-zero bits, exponent literal, booleans/null, escaped string bytes, comptime and decltype. Expected stdout0. No compiler owner/scheduler implementation; canonical/reparse validation must preserve value/bit semantics. |

Existing direct files were re-reviewed against the merged successor:

| Path | Changed behavior and evidence boundary |
| --- | --- |
| `scaffolding/tests/interpreter_call_query.tower` | Newer startup captures actual first-buffer retained bytes, then separately denies memory and initialization map. Both require Capacity, exact buffer-specific diagnostic, expected partial ownership, and zero residual grants after disposal. Retains D1/L1 prior growth and input isolation assertions. |
| `scaffolding/tests/semantic_world.tower` | Owned trial records route all returns through pool close/drain, invocation disposal, view close and world release. Full-slot admission failures1/3 and early stage cancellation preserve original failure codes plus cleanup failures. Stage publication/discard explicitly forgets retired owners. This closes the earlier fixture early-return ownership gap; current merged runtime/instrumentation still required. |
| `scaffolding/tests/backend_execution_index.tower` | Pure execution_functions import replaces full lowering import, eliminating duplicate backend implementations in a serial fixture client. Exact Foundation identity, retention, failure sweep and canonical-byte assertions unchanged. Prior generic registration blocker is now structurally resolved; entry wiring still pending. |
| `scaffolding/tests/backend_units.tower` | Target snapshot expectation includes allocator header via shared independent size helper; exact cap-minus-one rejection and exact-cap admission remain. Joined frontend baseline/overlap/object assertions preserved. |
| `scaffolding/tests/compiler_buffer_owner.tower` | Registers shared size/alignment contract; allocation-free boundary queries and overflow rejection must preserve the injected failure ticket. Successful retry then restores baseline. |
| `scaffolding/tests/compiler_storage.tower` | Comment clarifies explicit grammar activation from Bedrock for module-free session resets; no behavior or performance change. |
| `scaffolding/tests/driver_unit_budget.tower` | Derives argument/invalid-case bounds from actual arrays; all malformed numbers, missing value, jobs and retained-byte assertions unchanged. No source generation or policy registry. |
| `scaffolding/tests/driver_units.tower` | Adds explicit three-byte source containing interior NUL, exact filename:1:2 rejection, then restores original source before serial/four-worker builds. Expected answer42 and object checks retained. |
| `scaffolding/tests/frontend_session_format.tower` | Adds rejection of unimported ambient Statement rule, then uses self-declared grammar for old/current/reset sessions. Existing failure diagnostic/baseline-retention checks preserved; aligns immutable Bedrock contract. |
| `scaffolding/tests/frontend_session_scan.tower` | Activates grammar in each independent source before testing completion and incomplete-call recovery; no ambient baseline inheritance assumption. |
| `scaffolding/tests/frontend_units.tower` | Derives array/world count and receipt lower bounds from named source/shared snapshot quantities. Same independent42/43/44, canonical/world separation, failure/cancellation and retention assertions. |
| `scaffolding/tests/frontend_units_memory.tower` | Names three shared/two source snapshot receipts; exact byte sums, replacement overlap, rollback, source cap and finite compilation allowance unchanged. |
| `scaffolding/tests/lr_work_main.tower` | Root adds existing generic_clone_parallel_tests to query selection before width/worker evaluation checks. D1 resource helper registration remains in evaluation_query_checks, without a second main. |
| `scaffolding/tests/storage_main.tower` | Registers generic_clone_storage in existing serial fault runner before registry checks. Same caller resource root and final ownership checks. |
| `scaffolding/tests/type_execution_receipts.tower` | Complete default initialization of existing program/context precedes actual initialization; request/identity/oracle behavior unchanged. |

New backend execution_functions and benchmark reference generator remain B2/D2
production/measurement ownership. Root checkpoint contains the clone-stack
prerequisite but excludes later publicclone_result25503293 and its paired B2
service/cache handling. Do not run a half-ABI combination. Source review does not
inherit another lane's old runtime or sanitizer receipt for the integrated union.

### Focused harness continuation after merge9464bc0

Coordinator explicitly approved lifecycle selection in lr_work_main only.
The shared A1 case enum/trials/range helper remain unchanged. The new parser
accepts only decimal indices at most the last enum member, checking that bound
after every digit so arithmetic remains small; reversed ranges and wrong argument
counts return1 before resource loading. Each selected case invokes the existing
range helper with first=last, preserving both widths and serial/four-worker
comparisons/reparses. Start/completion text is flushed. Existing generic clone
query hook and every default/type-smoke/body case remain intact. No new runner.

frontend_main now imports the pure backend_execution_index client and calls it
both by focused execution-index selector and default serial suite. The original
function-index canonical/identity/fault oracles are unchanged. CMake's existing
native work-policy function conditionally registers the already supplied
module_cache_checks entry when TOWER_MODULE_TESTS is enabled, using the same
production object/library closure and callbacks. CTest uses scaffolding cwd.
This avoids rebuilding unrelated parser-only suites and does not equate profile
invalidation with full malformed/cycle/session regression coverage.

These are source-only registrations at this point. Smallest unit/link/runtime,
malformed selector cases, individual lifecycle receipts and measured common-path
cost remain pending. Added test work must not be called a compiler regression or
speedup based on differing suite sizes. No new Tower path is introduced.

### All-eight checkpoint 3915aee8 reconciliation

Verified root bundle08a0cecd and merged after own jobs drained. The sole README
append conflict retains both D1 selector/registration documentation and B1 runtime
profile documentation. New AGENTS size/count guidance was read before edits;
counts derived from actual collections are preferred, literal fixture data stays.
Six new direct paths make1,080 tracked /497 D1 direct; complete bodies reviewed.

| New path / lines at3915aee8 | Substantive review and limits |
| --- | --- |
| `scaffolding/tests/entity_locality.tower` /150 | A2 Linux x64 measurement compares per-owner lookup, pinned component query, archetype pointer columns and derived packed snapshot against exact sums. Snapshot construction separately timed; it is not authoritative storage. Keeps one stable live payload per page to expose retained fragmentation and checks final zero entities/components/pages. malloc_usable_size is a host allocator boundary; this does not establish production packed-payload implementation or multicore speedup. |
| `scaffolding/tests/layout_frontier_profile.tower` /163 | A2 actual layout pump over32branches plus leaf/sink, unique ordered fields and chained/independent ready frontiers. Exact sizes/alignments/offsets/ticket completion checked; world, pool and shared lane ledger drain. Cold/warm startup separately scoped; reported pool peak is admission, not overlap. Current sizes8/1024/4096 all fall below newer8192-field parallel threshold: this checked-in entry cannot validate that profitable branch. Route owner coverage gap; no threshold or workload rewrite inferred. |
| `scaffolding/tests/lr_state_benchmark.tower` /251 | B1 explicit Linux x64 timing/rusage over prepared grammars. Serial reference compares every LR item/transition, or every runtime action/goto/conflict, outside timed construction. Runtime mode binds finite synchronized memory budget, checks actual retained/header bytes and retirement, separates ledger/RSS, and preserves world entity/component counts. Requested workers/lanes alone prove no overlap; samples3warm+15 and repetition counts are explicit. |
| `scaffolding/tests/parser_retention.tower` /114 | B1 attribution companion keeps strict benchmark separately.128resets at four input sizes, explicit own/default-host world mode, statement/declaration release order, owner/page observations after warmups and session baseline restoration. Owned mode must release every tracked allocation. Serial fault counters only; per-page movement is explained, not hidden as a stability pass. |
| `scaffolding/tests/parser_retention_observer.tower` /94 | Quiescent derived page index validates page/type bounds, checked stride/header/capacity arithmetic, aggregate live payload and requested page bytes; temporary index dies before return. Distinguishes requested bytes from usable/RSS and explicitly lacks per-page independent live-count reconciliation. same_owners permits page-attributed buffer movement while holding entity/component/cache/live counts. |
| `scaffolding/tests/work_budget_allocation.tower` /78 | A2 serial ledger failure fixture checks empty no-allocation grant, first/growing entry Memory rejection, unchanged caller output/storage/generation/counters, allocation-free slot reuse, stale copied receipt rejection and final baseline.16repeats; explicitly rejects production threaded transport. This is ledger metadata allocation coverage, not whole compiler or new constructor coverage. |

| Updated direct path | Changed conclusions |
| --- | --- |
| `scaffolding/tests/lexer_table.tower` | Budget boundaries separately deny object/header/range storage, admit exact full physical bytes, check transitions and zero retirement, plus empty-range owner. Existing oracle/fuzz/failure sweep preserved. |
| `scaffolding/tests/lr_budget.tower` | Measures actual retained serial runtime lower bound, reserves competing bytes to force threaded construction denial, requires joined ledger restoration and successful retry of same states. Lane-saturation fixture now permits parser bytes explicitly; no bounded-allheap claim. |
| `scaffolding/tests/syntax_live_attributes.tower` | Complete Bedrock import replaces incomplete hand-copied declaration grammar, including precedence dependencies. Consumed declaration count changes3to1 to match actual import; attribute negative assertions remain. |
| `scaffolding/tests/syntax_live_replacements.tower` | Seed-only numeric grammar explicitly names available AttributeInteger; malformed replacement list bound derives from array. Actual alternatives/outputs/error cases unchanged. |
| `scaffolding/tests/syntax_live_support.tower` | Shared seed fixture likewise uses AttributeInteger instead of nonexistent ambient Number. No parser or grammar implementation added. |
| `scaffolding/tests/syntax_reader.tower` | Only extended replacement-body fixture prepends Foundation import, consumes/releases that declaration, then applies existing reader/fault assertions. Seed-only grammar/token/skip cases remain seed-only. |
| `scaffolding/tests/syntax_replacements.tower` | Same explicit seed numeric rule correction across existing replacement cases; exact malformed-output/ambiguous-destination diagnostics and successful counts preserved. |

B1 shared nongeneric growth helper and exactly-sized LR runtime results are in
this root checkpoint, alongside its runtime-table ownership migration; complete
ABI rebuild is required. A2 constructor patchfe458 and L2 public-clone API remain
separate pending work. All local execution claims still belong to prior frozen
sources until the next public build and exact runtime checks finish.

work_budget_allocation now shares the existing serial fault-target registration.
Its source does not import host.memory, so that target alone links the existing
host_memory object; buffer/arena fault fixtures keep their imported implementation.
No extra allocator, transport or test runner body. Build/runtime still pending.

### Frozen0e544ac harness execution evidence

The full497-file direct review is unchanged; no new Tower file was added.
Public smallest entries, canonical native build and eight affected targets pass
on frozen0e544ac with the public predecessor and complete saved resource package.
The new execution-index selector executes the original canonical/identity/fault
checks; ledger target executes its serial failure/rollback sweep; conditional
module-cache target links the existing parser_modules composition and CTest
executes the complete module/session regression. All pass. Query-smoke includes
both widths/workers and the resource/clone/failed-peer lifetime checks. Actual
backend worker overlap and exact serial/parallel objects, aggregate Foundation
round trips, storage, allocations and parser/LR pass. See the journal and raw
union_0e544ac receipts for source, commands, measurements and exact scope.

Eight malformed lifecycle invocations return1 before touching a deliberately
missing resource directory. The case sweep is still running; a partial case list
is not full lifecycle/type-smoke acceptance. Type-smoke's separate post-lifecycle
body/binding/declaration oracles remain a distinct gate. No broad sanitizer,
clean generation, browser or publication result is inferred from these passes.

Read-only pending-owner review does not change the tracked inventory:
A2 arena-linkage819a/2f16 supplies a declaration-only typed API, one linked
entities-unit provider and a standalone separate-object fixture covering all six
functions, alignment, capacity denial/output preservation, append ownership,
snapshot retention and zero final grants. B2 public-clone606c includes full-cache
read/write denial after successful setup, old-entry identity/count preservation,
partial-request cleanup and successful unchanged cache reuse; positive editor
checks do not exercise failed inspection allocation. These drafts are not adopted
or locally executed until their complete matching producer/layout closure arrives.

Subsequent0e544 completion: all42 lifecycle cases pass, widths32/64 and workers1/4,
explicit expected outputs/errors and successful canonical reconstructions intact.
Individual receipts bound wall10.14–17.22s and RSS209628–228464KiB. Inclusive0–1
range matches concatenated individual output. Eight malformed cases rejectbefore
resource I/O. The original180s full-type timeout remains a failed historical
receipt; post-lifecycle type negatives are still pending a focused selector.

Paired unchanged-source cache profiles and32 compiler executions plus8canonical
comparisons pass. Large warm cache validation improves sharply; small serial
compiler paths regress2.9%/3.7% and retain more RSS, while two workers remain slower
than one. These integrated-source measurements and physical-ledger attribution
are recorded without a general speedup claim. All owned jobs drained before
D2 took the next slot; complete saved source/binary/resource identity remains0e544.

### Clone-result union6b8355b review

Verified complete root bundleaa7eaf7c, exact6b8355b head and sole published60741
prerequisite. Integrated only after all0e544 jobs drained; no new Tower path,
so census remains1,080/497direct. Three changed assigned fixture bodies reviewed:

| Path / source6b8355b | Updated conclusions and evidence boundary |
| --- | --- |
| scaffolding/tests/generic_clone_storage.tower | Adds public synchronous clone outcomes: success at wide256/deep600, node quota versus first/growing stack Capacity, first allocation and later node Memory. Uses actual CloneFrame/CloneInitialFrames and compiler_buffer_allocation_size instead of magic word counts. Checks compatible wrapper, ordered/named children, source metadata, copied count, exact unchanged entity/component totals, retired frame grants and final physical buffer baseline. Staged failure indices0–4 cover frame/node/index/metadata allocations with existing hold-before-view-close and stage discard. Current owner serial evidence is separate; D1 merged run pending. Future budgeted entity constructors may change setup/grant boundaries and error classification, requiring exact fixture adaptation rather than weakened assertions. |
| scaffolding/tests/frontend_modules.tower | Existing full regression entry now includes actual full-cache clone read/write Capacity denial after successful setup, old entry identity/count preservation, repeated failed-request rejection, exact owner/ledger restoration and successful unchanged cache reuse. Graph-owned partial cleanup includes dependencies even without a returned root. Reader setup occurs after occupancy in the read branch; flagged to B2 for forthcoming constructor accounting, not an observed failure on this closure. |
| scaffolding/tests/bootstrap_symbols_checks.tower | Exact new observed physical-buffer/world-budget/callback imports are allowed only for owning compiler units; public clone-result restricted to ParserNodes/Semantics. Wrong-unit, prefix/suffix and forbidden native imports remain negative assertions. D2 owns checker policy and generation evidence. |

The producer/consumer closure includes public clone resource results, node/attach
Memory classification, matched module transaction and document-inspection null
cleanup. Inspection-denial fixture remains L2-owned next work; positive editor
checks alone are not failure coverage. README merge retained one copy of B1's
runtime-profile paragraph plus every D1 registration and ledger paragraph.
Earlier0e544 runtime receipts do not validate these new production inputs.

### Approved type-errors selector afterc2d0064

Coordinator/A1 handoff explicitly authorizes only the generic body_runs mode and
LR entry wiring. Appended TypeErrors preserves prior enum values and all existing
default/type-smoke/all/control branches. Its wrapper reuses the same body
continuation, Foundation reparse, serial/four-worker binding and declaration
negative bodies; only the already separable lifecycle call is bypassed. Success
text names this narrower suite explicitly. No new fixture or production logic.

The measured0e lifecycle cost is10.14–17.22s per case; repeated unchanged lifecycle
coverage is the iteration bottleneck this selector avoids. This is evidence reuse,
not a compiler speedup or permission to skip changed-input checks. New clone
production in6b means the old0e full42 receipt cannot serve final current release
acceptance. Smallest public entry compilation, focused new mode and equivalent
existing-entry measurements await the next D1 heavy slot; current change unrun.

### Grammar ownership union86e7ec98

Verified root bundled8a450a6, sole60741 prerequisite, and merged without conflict
after all D1 jobs drained. Two new tracked Tower files make1,082 total; one is
D1-direct, bringing substantive current review to498/498. New library arena API
remains A2 implementation ownership. This source is locally unbuilt.

| Path / source86e7ec98 | Review and disposition |
| --- | --- |
| scaffolding/tests/work_arena_linkage.tower /39lines | Separate client imports declaration-only API and host memory, requiring exactly one provider object for six exported arena functions. Exercises actual256/64alignment, initialized payloads, Capacity denial preserving output, same-budget append transfer, source retirement, two-chunk/payload/retained snapshot and finalzero grants. Uses the current documented physical header contract; no borrowed slice survives arena disposal. A2 standalone normal/ASan/TSan evidence is retained at its source. Generic reproducible target is proposed to manifest owners, not implemented or locally executed yet. |
| scaffolding/tests/parser_table_budget.tower /113lines | Existing tests now parameterize Sequence and Closure grammar shapes. After actual setup, reserve all remaining bytes to reject the table, then admit only its descriptor to reject grammar. Observe successful retained grammar size and deny one byte below it, require null unpublished grammar/error, exact partial cleanup and retry. Existing build-growth denial, unchanged owner reuse, direct-buffer accounting lower bound and final allocator/world/ledger baseline remain. The descriptor-only baseline failed before B1's fix; B1 normal/instrumented owner evidence does not validate D1's newer clone union. |

Supporting caller review confirms frontend_table uses existing rule/symbol/name
getters without changing order or first nonnull anchor; lr_tree uses generated
rule metadata through the same API. Grammar names/captures and buffers now share
explicit lifetime-bound physical owners, with public APIs and one arena provider.
These are B1/A2 production conclusions, not extra D1 primary-file audit credit.

Coordinator02:10:50 authorizes the narrow separate-arena registration. Existing
tower_work_fixture now adds one library/work_arena provider object only for the
work_arena_linkage client; every other fixture retains the same object/runtime
composition. The ordinary positive loop registers it with the existing30s bound.
No compiler entity unit, new runner, duplicate arena implementation or deliberate
probe. Ordinary sanitizer object rules cover both separate objects and runtime.
Source checks pass; smallest compilation/link, exact symbol uniqueness, positive
runtime and supported instrumentation remain pending the next D1 heavy slot.

### Exact A1 publication/cancellation joinab603725

Verified4ef71298 bundle but merged ONLY ab6037256073afd69007e2bd424a6e2317479655,
whose sole parent is reviewedb7bf916c. The advertised0e36d5c9 tip contains later
unvalidated constructor/dispatch work and was not adopted. New production helper
and one direct test bring census1,084/499direct. Every new direct body is read.

| Path / sourceab603725 | Substantive conclusions |
| --- | --- |
| scaffolding/tests/semantic_publish_checks.tower /173lines | Owns explicit world, synchronized lane/byte ledger and ordinary shared query/work pool. Three source-ordered blocks preserve literal/order metadata and null compaction marker.18 pressure cases cover32/64,1/4workers, descriptor/arena/growth denial and deterministic serial mixed success/failure. Each joined ticket records its own result; any failure suppresses all canonical replacement, repeated call preserves dispatch, private scratch retires before context/world/budget. Four pre-cancelled cases demand no query creation, no dispatch or revival, unchanged canonical storage and zero ownership. This is pre-dispatch cancellation, not an asynchronous midworker-cancel proof or measured speedup. |
| scaffolding/tests/semantic_resource_checks.tower | Adds executed nested ordinary callee frame growth after successful charged entry storage. Required helper readiness uses existing IMFunctionInput, not a new producer. Competing occupancy inside a sufficiently large configured budget now distinguishes Capacity from Invalid, persists the typed error after interpreter disposal, checks peak above occupancy for growth and exact final retirement. D1 preserves the parameterized helper and wraps its unchanged three variants in the owner's startup/growth loop,24 outer-matrix cases. No standalone main or weakened diagnostic/oracle. |
| scaffolding/tests/lr_work_main.tower | Imports the complete publication fixture and calls both noarg exports exactly once beside generic-clone checks, before the existing query width/worker loop. All22 owner cases retained without fourfold repetition or hidden width gate. Default/all/query and current TypeErrors/lifecycle selectors preserved. |

Only resource entry conflicted; trial bodies retain exact owner changes.
Resolved resource SHA14e0d6db70dde4079133788bd8d3103c5fa790daffe4cf21c6498bcadde1e694.
Generic hook49927ff7 is exported for D2's matched provider build. D1 awaits D2's
exact five provider imports before any local build; this joined source is not
runtime evidence. L2/B2 partial inspection resource recovery remains separately
open, and later constructor/dispatch drafts must not enter via advertised tip.

### D2 provider history reconciliation and overlap failure

Merged verified complete D2 bundle39f2efd5 at406d1709 into mainfc7662bc after
checking the sole60741 prerequisite. This preserves the original five-provider
commit1fa854a5 and all three D1 hooks; compiler, fixture and build inputs are
byte-identical to D1aa22 before this merge. The D1 ledger target and README
coverage remain present. Census remains1,084 tracked/499 direct reviewed files.
No local runtime acceptance follows from this history/documentation-only merge.

D2's first joined query run failed134 in generic_clone_parallel.tower's two-worker
Publish interval-overlap assertion, before semantic publication checks. Its
initial attribution to Publish was corrected using the actual fatal diagnostic
and debugger. The admission barrier precedes both production-kernel intervals;
distinct threads and simultaneous admission do not ensure a short kernel pair
will overlap after wakeup. D2's ten later successful same-binary runs establish
successful executions, not resolution of the original failure. L2 owns the
fixture correction; preserve timing outside the admission barrier and actual
work/ownership assertions. D1 has not rerun or weakened this assertion. This
follow-up qualifies the earlier generic_clone_parallel audit row; it does not
establish a production race, deadlock, speedup or reliable overlap on every run.

D1 verified D2 failure archivebb626610 and read the original failed process
receipt: signal6/status134 overrides GNUtime's trailing0. There are no actual
kernel interval timestamps to attribute why overlap was absent. D2 also reports
independent406d type-errors PASS93.18s/251372KiB and arena-linkage PASS; those
qualified receipts advance the two generic hooks' validation without validating
new full lifecycle coverage or current wholecompiler instrumentation. Root0c8b7d66
history is now merged; no new Tower path or source-byte change.

### Explicit calibrated overlap policy, B2ff030d95 plus D1 hook

Read both complete owner patches (observera08e8229 followed by calibratedff030d95)
and applied only after root's02:32:45 authorization. Existing backend_units.tower
owns private formatter/event lines and checked nonnegative/normalized monotonic
nanoseconds, including multiply/add overflow and backwards-clock rejection.
Calibration times the already-required complete four-unit serial frontend batch;
no extra compiler invocation or hidden sanitizer/environment test. Before dispatch,
the context freezes max30seconds/measured duration for frontend2's wait. Backend1's
acknowledgement and ordinary/full-suite paths keep30seconds. Exact serial objects,
original decltype/comptime workload, shared budget and distinct-worker assertions
remain. Traces precede fatal errors; private formatter allocations are disposed.
The timing-bound change is test policy, not production throughput evidence.

D1 lr_work_main adds only the authorized explicit selector/usage/admission and
call to backend_units_overlap_calibrated_tests(root). It does not alter default/all
coverage or retry failure. Patch100a1083 is exported independently for current
owner closures. Native smallest entry/link, both normal modes and instrumentation
are locally pending; root requires B2 normal runtime before instrumented adoption.
Existing old TSan134 stays failed. No new Tower path; census remains499 direct.

### Executed registration checkpoint8f46 and later policy review

Frozen8f46 passes public smallest leaves, canonical native6 steps and14 affected
target steps with fresh dependency timestamps. Complete compiler1a9476d0 plus49
resources matches D2's independent production compiler; new LR runner5e78fbed
contains the test policy. All raw evidence is in registered_8f46_receipt.tar,
SHA4fa778f6f669cbf394242ca375d36521c8f94bfaf74c8b4c46fe95f3838ef101.

| Reviewed path | Current executed evidence and remaining boundary |
| --- | --- |
| scaffolding/tests/lr_work_main.tower; body_runs.tower | type-errors passes90.52s with existing body/canonical/binding/declaration assertions. Both ordinary and calibrated overlap selectors pass, as do query/storage/parser/module/index companions. Default/all source coverage is preserved; full42 on newer production inputs is not inferred. |
| scaffolding/tests/backend_units.tower | Exact four-unit object comparison and distinct-worker handshake pass in both modes and all16 paired/control runs. Calibrated native serial baseline8.275375291s selects30s. Two-CPU median cost12.6% was not reproduced under CPU2-only control; wide ranges and placement sensitivity preclude neutrality/speedup claims. One-processor control is not multicore evidence. New wholecompiler instrumentation remains separate. |
| scaffolding/tests/work_arena_linkage.tower; work_arena_shared.tower | Ordinary separate link has exactly one provider for all six functions. Actual address/thread client/provider/runtime objects and positive runs pass, plus ten extra shared cases per mode. Instrumented objects/IR/hooks retained. This does not sanitize the compiler, system LLVM or unsupported UBSan targets. |
| scaffolding/tests/semantic_publish_checks.tower; semantic_resource_checks.tower | Current registered22 publication/24 resource cases pass. Future L1 frame/task ownership changes invalidate the growth phase assumption: peak above occupancy alone can also describe early entry failure. A1 review of a graph-gated, per-job phase receipt design remains pending; no arbitrary budget edit or successor claim. |
| scaffolding/tests/generic_clone_parallel.tower | Current query invocation passes all unchanged cases. D2's earlier workers2 interval134 remains unresolved despite subsequent successes. No dropped assertion, barrier-padded timing or universal overlap claim. |
| scaffolding/tests/bootstrap_symbols_checks.tower | After drain, D2c4aa's21 new lines cover exact owning-unit arena/buffer/publication imports, wrong unit/prefix, legacy Tower node builder, rejected check-only allocator hooks, and WASI-only indirect table with native/table-base negatives. Implementation policy remains D2-owned and observed-symbol based;12 actual production reports and scoped checker ASan are owner evidence. No new Tower path. |

All owned jobs drained and lock released02:57:06 UTC before merging D2 policy
history. Corpus remains499 direct/1,084 tracked. Final clean merged release,
current full instrumentation, browser/generation and hosted publication remain
open; these scoped passes do not complete the lane acceptance objective.

### L2 clone overlap remediation2cb32: review and before failure

Applied only the approved one-file patch2cb32a9cb07b950fdd9ca65976bbc5233fadce31a320fcc0d20da065d59c09b2
after its complete review and root03:00:50 assignment. Production remains8f46;
the full L2 bundle is deferred until its inspection fixture has matched producers.
The source now measures two fresh serial clones per candidate, uses the faster
kernel interval, and grows width256 through a finite1536 cap at unchanged depth8.
Chosen width freezes before all parallel trials. This is a workload-selection
heuristic; actual distinct-thread interval overlap remains mandatory. Intervals
exclude admission waiting. Exact copy/node/metadata/stage/cancellation/failed-peer
and final world/byte/lane assertions remain. New reports include threads, selected
shape, timestamps, duration and charged peak before an explicit FAILED message.
Pool/world/budget cleanup precedes the moved assertion; graph/signal scope defers
still require normal return and are bypassed by a fatal abort until process exit.

D1's unchanged5e78fbed baseline independently fails134 on its first requested query
trial, at the same workers2/Publish interval assertion. Only workers1 completed.
Measured1.25wall/.07CPU/53392KiB; signal6 overrides GNUtime's trailing0. Source and
binary hashes verify unchanged. Remaining before trials were not run; no retry
turns this failure into a pass. Candidate native and matching instrumented checks
are next. Extra workload cost must be reported as changed test coverage, not a
compiler speed comparison or acceptance from selected width alone.

### Frozenbf97 clone validation and successor source review

Native3/3 and ASan/LSan3/3 query runs pass onbf97; all serial calibration and real
parallel production-kernel receipts are retained in clone_calibrated_2cb32.
Native selectedwidth512, addresswidth256. Both retain output/ownership assertions;
chosen width is not a proof of overlap, speedup or future scheduling reliability.
Original baseline134 remains. Thread build/run is pending. The journal records
wall/CPU/RSS, exact runners/hooks/source identities and limits; no release claim.

Incoming source only, reviewed without mutating the active closure:

| Path at incoming reviewed identity | Substantive disposition |
| --- | --- |
| scaffolding/tests/interpreter_storage.tower at L1e68e2b2 | Four frame/task Capacity/Memory replacement cases preserve pointer, length, capacity, grant slot/generation/bytes and every queued offset. Pop/reuse keeps nested task owners across outer frame moves; final charged/live/physical buffer counts return to baseline. Injection is serial; does not establish threaded instrumentation. |
| scaffolding/tests/interpreter_call_query.tower at L1e68e2b2 | Complete owner accounting now includes frame capacity and all retained task depths. Four startup-denial boundaries derive exact prior successful owners, retain typed Capacity and precise failure text, permit only preceding buffers and no result/output. Existing suspended-call/capture/aggregate/input-storage assertions remain. |
| scaffolding/tests/generic_inspection_budget.tower at root97b10daa |98-line public editor regression, widths4/8 andworkers1/4: install real baselines, prove complete generic query, occupy measured remaining shared bytes, require null query, release pressure and prove preserved-cache recovery, then destroy environment/world/ledger with zero bytes/lanes/live. Owner native/address evidence remains distinct from a D1 execution. |
| scaffolding/tests/editor_world.tower at root97b10daa | Keeps ordinary incomplete syntax inspectable with its preceding declaration and complete:false, distinguishing valid recovery from resource-failed partial output. Query lifetime is scope owned. |
| scaffolding/tests/frontend_modules.tower at root97b10daa | Uses the public typed resource accessor for read/write clone denial; exact Capacity, repeated rejection and prior cache/world/ledger assertions remain. |
| scaffolding/tests/frontend_session_world.tower at root97b10daa | Adds direct vector import and checked NUL append before passing formatted seed bytes through the C-string baseline interface; owns formatted result until install returns. |
| scaffolding/tests/parser_table_budget.tower at root97b10daa | Adds real control/probe/completion partial construction and growth denials, unchanged source parser on probe failure, retry of the same uncommitted step, exact physical retention/restoration, session prepare/grammar denial and reset recovery. Ordinary malformed input retains None resource status. Failed setup never becomes a successful result; owner follow-up for earlier grammar/probe errors remains open. |
| scaffolding/tests/lr_work_main.tower at root97b10daa | Adds the four-case inspection test exactly once to all/editor; preserves existing calibrated-overlap selector and every previous mode. Root merge contains both registrations. |

These rows are preintegration review, not added current-path counts or runtime
acceptance. The current tracked census remains499direct/1084total until adoption.

Selected A2 snapshot8e4e2d085a55de95e73fb041929aa75d3de3a22b3ba5b5e98abc55c4cebbbc2c
source review (not adopted or executed here yet):

| Path | Storage, scheduling and ownership disposition |
| --- | --- |
| scaffolding/tests/work_constructor_budget.tower |59-line result-contract fixture derives descriptor/store/index charges from actual types and allocation-size API, distinguishes Invalid from Capacity, preserves a nonempty output owner, completes source-ordered unit tickets and requires zero grants after partial/success cleanup. No concurrent work or wholeheap census inferred. |
| scaffolding/tests/work_constructor_faults.tower |45-line bounded serial allocation sweep stops only after an observed complete construction; all preceding failures must report Memory/null output with exact physical/live baseline. Test injector is disabled before cleanup and does not claim threaded sanitizer coverage. |
| scaffolding/tests/work_dispatch_result.tower |164-line native fixture keeps callback opaque only at transport boundary and embeds typed kernel at a nonzero offset. Coordinator-only semaphore-open fault proves pre-dispatch Memory/no execution and subsequent valid retry. Busy must leave earlier borrowed work running and is followed by explicit release/drain; empty calls preserve prior receipt, named entry rejects parallel batches but allows serial work. Independent jobs own scratch and outputs; wrapper is OS test boundary. |
| scaffolding/tests/work_schedule_budget.tower |240-line graph/pool fixture checks arithmetic rejection without fabricated buffers, partial constructor cleanup, retained reset/stale ticket, unchanged live payload on denied growth, post-join terminal failure/cancel and shared synchronized budget with private graphs. Distinct threads/semaphores demonstrate simultaneous admitted owners; no timed throughput claim. Terminal cancellation settles joined tickets, not arbitrary thread termination. |
| scaffolding/tests/work_view_invalid_dispose.tower |11-line deliberate compile-negative fixture attempts ordinary vector disposal on nominal borrowed graph view. Preserve invalid operation; success would violate the ownership boundary. Rejection still needs exact selected-compiler evidence. |
| scaffolding/tests/work_vector_profile.tower |131-line Linuxx64 profile partitions fixed element counts across independent vectors and checks every value/sum, actual intervals, growth count, CPU/wall/RSS and final grants. Requested capacity is not allocator call count. Flagged duplicated accounted-header sizeof(usize)*4 for owner replacement with allocation-size API; no new benchmark results here. |
| scaffolding/tests/compiler_work_profile.tower |Existing profile rewritten as eight fixed independent metadata plans over shared WorkPool/budget, exact source-order checksum/entity/component totals and final zero grants. Timing excludes pool setup, includes dispatch/join. Charged descriptor/graph/slot buffers explicitly exclude ECS nodes/pages/index allocations; profile does not establish whole compiler scaling or packed payloads. |

Import-only fixture deltas were read for compiler_work, entities, entity_locality,
entity_pages, entity_stage_concurrent, entity_stage_ownership, entity_store,
entity_tables, entity_views, work_access, work_budget_shared, work_graph, work_graph_scale,
work_instrumented, work_kernel_admission, work_kernel_overhead, work_kernel_profile,
work_named, work_observe, work_order, work_pool, work_ready, work_resume and work_select.
Standalone allocation providers are necessary OS composition; work_named also
belongs to the LR runner and its added provider duplicates the existing one.
Root/A2 already own correction; no D1 duplicate fix. No fixture or invalid-data
rewrite proposed. Full corrected source and caller compositions must be checked
before adopting these rows into the current census.

Caller-review qualification: work_instrumented also has an established separate
host/memory object in TowerWorkPolicyTests.cmake. Its selected new import should
be removed, preserving that shared provider and the work_budget_allocation caller.
Routed source-only duplication finding to A2/D2; not yet executed or fixed here.

TSan subsequently passes3/3 on unchangedbf97, with actual six-object read/write
hooks/IR hashes, empty stderr and final source verification. All9 candidate
queries pass, preserving original134 separately. Actual selected shape differs
by instrumentation; no cross-mode throughput comparison. Clone validation scope
is now evidenced atbf97; incoming source rows and final release remain pending.

### Integrated sourcef0ed105 and D1 resource phase implementation

After allbf97 validation jobs drained, D1 merged complete root97/9b318,
L145dd and L29b histories. The frontend_modules merge kept the newer root/B2 typed
error latch and public-accessor checks exactly. Source is not yet runtime-tested
on D1. Corrected A2 source removes both work_named and work_instrumented duplicate
imports; the latter was this audit's caller finding. D2 owns actual provider/link
validation. All prior failed/successful receipts remain source-specific.

Census is now1,093 tracked Tower paths /507 D1 direct paths (495tests/editor/
playground plus12examples), all direct bodies substantively reviewed. The earlier
compiler_work_profile row described an incoming owner revision: this137-line path
is NEW to D1's tracked main, not a replacement of a previously tracked D1 file.
Root9b318 supplies the selected nominal-view/budgeted pool APIs; obsolete split
graph/pool/literal experiments remain excluded. The profile's hardcoded header
size finding remains with A2 pending its explicit correction.

D1 semantic_resource_checks now253lines: two private typed probes borrow actual
invocations, delegate production Evaluate, and retain only their own phase flag.
A named prerequisite attaches to Evaluation before sealing; ordinary preparation
must reach both owning entry frames with no failure/steps/output. Gate completion
precedes a measured all-remaining-capacity reservation. Both exact phase failures
must be observed before semantic disposal; source-ordered diagnostics, Capacity,
no value/replay and final world/pool/ledger retirement remain. Startup separately
denies invocation memory after pool/world/query setup. This replaces the weak
peak-only assertion, not the24-case matrix. Invalid preconditions produce explicit
failure messages. No independent scheduler/IR/evaluator, guessed allowance or
mutable shared diagnostic field. Configured workers1/4 alone do not prove both
resource kernels overlap; independent clone evidence demonstrates transport
overlap on the earlier exact closure only.

The existing LR runner gains resource-smoke and one extern for the same exported
resource fixture; all/query still invoke it through evaluation_query_tests exactly
once. Explicit mode covers the same24cases and isolates before/after cost from
adaptive clone shape selection. No new target or production public API. Source
patchv3SHA98356f8a0db694c3567625c811151e7968e8b988043f917f9f685421ac0e80fc
is implemented but UNCOMPILED/UNRUN while D2 owns the host slot. Atomic D1 lock
attempt returned1 before execution and preserved D2's live lock. Measurement,
current instrumentation and final release gates remain open.

### Shared semantic receipt review at421e9353 (prospective adoption)

A1 V2b255ff12 supersedes4ff9; checked applicability only, not adopted. Existing
format_suite/entity_registry/frontend_units_memory valid-source gates currently
check ordinary error text. Once the full producer ABI lands, also require the
shared typed receipt to be None; retain source-bound malformed-input offsets and
ordinary-error classification. D1 resource fixture will need typed selection and
text-clearing persistence assertions after owner integration. A1 publication/query
and L2 type-receipt fixtures remain with those owners. Historical execution_graph
hashes remain supplemental evidence; no blind oracle rebasing is proposed.
Source review cannot establish a new runtime pass or a current miscompile.

### Measured phase and provider findings on c08d6e82

The new resource fixture compiles but exposes a production source-order failure:
readiness order after shared-gate completion selects29 before11 in two immediate
nested-growth modes. Both actual denial probes and cleanup checks pass in the
first6cases; remaining18unrun after aggregate fail-fast134. A1 owns production
selection. Failure-only puts diagnostics preserve all oracles; unsupported
print-link attempt1 is retained separately. Current runtime acceptance is open.

target_once adds one host.memory import after an actual supported-target missing
compiler_buffer_free failure. Existing named lane/repeat/protocol constants and
pool.count loop bounds remain unchanged; no duplicated array-size computation.
Exact linked objects formerly lacked all three required buffer providers; after
change each has one definition. Public leaf/build and3normal runs pass with real
prepublication blocking and exact-once repeated calls. Timing below0.01s is not a
speedup result. Final scoped instrumentation and integrated release remain open.

The target provider milestone now has3native+3ASan/LSan+3TSan passes on the exact
one-import source. Real overlap/publication assertions remain unchanged. Actual
access hooks cover fixture, worker transport/dispatch and guest runtime; two
registry wrappers carry sanitizer attributes/init but no payload-access hooks.
Two overstrict evidence-script failures were corrected from inspected IR/symbols,
not ignored. No UBSan support in this TowerLLVM19 path, external libraries remain
uninstrumented, and no universal race/whole-compiler claim follows.

### ROOT72a integration and durable entity registration at a7c569cc

Tracked inventory1,095 /509 D1 direct (497tests/editor/playground+12examples),
all direct bodies reviewed. Snapshots current_a7c_all.txt/current_a7c_d1.txt in
external D1/roster. New fixture rows at reviewed root72a218b8:

| Path | Substantive review and disposition |
| --- | --- |
| scaffolding/tests/entity_create_result.tower | Typed declaration-only client with private per-call receipts. Covers null owner/output, pinned Busy before Exhausted, finite counter boundary, independent error variables, unchanged seeded store error/count/reference state, same-store unattached related entity then ordered named attachment. Releases all entities/store. Legitimate finite counter mutation avoids huge allocations; no concurrency or packed-storage claim. Owner evidence retained; new D1 normal registration implemented, unrun. |
| scaffolding/tests/entity_create_faults.tower | Existing serial allocator injects one physical denial in each creation API, resets injection before assertions, preserves identity/live buffers/references/children and counts exact attempts, then retries same next ID and returns to baseline. Distinct from production concurrent instrumentation. Declaration-only client needs shared entities/memory providers and serial allocator; new D1 fault registration implemented, unrun. |
| scaffolding/tests/entity_views.tower | Full prior view cases retained. New finalizer traps because all fixture registrations have lifecycle0; completes standalone linking without accepting unexpected finalization. No altered invalid-view oracle or lifetime guarantee. |

D1 extends only existing normal/fault CMake mechanisms, with one compiled entities
object shared across the two executables and the existing memory object once per
link. Normal guest runtime and fault runtime/serial transport remain distinct.
No new Tower implementation, allocator, entry wrapper or fixtures. Root assigned
these exact generic registrations; D2 manifest coordination sent before edits.
Current newly merged production inputs and registrations still require D1 runtime
validation; prior target_once evidence remains tied to prejoin7f84.

### Complete receipt/pages union at reviewed 2c1eec38 (ROOT75fdf)

Census is 1,104 tracked Tower files /516 D1 direct paths (504 tests/editor/
playground and12 examples). Exact sorted rosters are external
D1/roster/current_2c1e_all.txt and current_2c1e_d1.txt. Seven new direct files and
seven changed direct bodies below are substantively reviewed; prior unchanged
rows retain their original review identity. This is source coverage, not runtime
acceptance. No invalid/Foundation-only fixture was mechanically rewritten.

| Path | Storage, ownership, scheduling and evidence disposition |
| --- | --- |
| scaffolding/tests/entity_component_budget.tower | Physical pooled and oversized component receipts derive actual allocation capacity, distinguish Invalid/Busy/Capacity without consulting seeded store-wide error, and preserve stable data/backpointers. Real 2/4-lane barriers establish different worker threads and private pages; lane grants and leases precede dispatch. All cancellation flags publish before any shared semaphore wake. Workers record private references; coordinator drains, holds stages before closing the last view, then publishes/discards and verifies coordinator finalizers and zero grants. Eight named stress rounds cover publish/cancel/deny; page-fill bounds derive actual capacity. A2 owner normal/address/thread evidence is recorded in its journal, not D1 execution. No durable current CTest registration yet. |
| scaffolding/tests/entity_component_faults.tower | Single-owner allocator prefix sweep covers small/oversized, direct/staged components. Denial preserves table, stable prior payload, counts and exact budget; retry succeeds. Forced publish failure preserves stage/address/receipts, then successful publication retires ownership. Choice count derives its array; named fault limit bounds the sweep. Requires existing serial fault runtime, never threaded allocator injection. Owner evidence only; registration remains open. |
| scaffolding/tests/entity_component_layout.tower | Unchanged native/wasm32 source derives target header sizes and exact requested charges from actual types/capacities. Checks adjacent same-page payloads, alignment/backpointers, capacity denial/retry, oversized storage and pinned existing lookup; last-live removal returns charges before store disposal. Literal payload/alignment values define test data, not guessed host layout. A2 actual native/wasm32 evidence retained; no browser-thread claim or D1 runtime pass. |
| scaffolding/tests/semantic_receipt_checks.tower | Three cases exercise allocation-free typed receipt restoration with unreserved/reserved/exact-self-alias diagnostics, first-error retention and text-clearing persistence. Two target widths use real world/query ownership to test demanded cancellation versus undemanded completion; repeated failed pumps neither create entities nor invent a resource failure. Independent contexts dispose before world close. Exported main needs a callable binding in existing LR runner; no test-body rewrite required. |
| scaffolding/tests/semantic_failure_order_checks.tower |28 cases use existing Foundation entities, interpreter and shared dependency gates. Canonical producer offsets83/11 deliberately disagree with numeric order; reversed readiness and earlier pending work span pump frontiers. Earlier success, ordinary division failure, typed capacity failure and isolated demand select the proper receipt without running an unused producer. Repeated failed pumps preserve dispatch/counts and no effects; zero ledger at disposal. This already covers the proposed numeric-sort/pending regression; no duplicate test. Exported main can bind into LR runner. A1 before/after owner evidence is separate from pending D1 run. |
| scaffolding/tests/semantic_dispatch_checks.tower | Production worker dispatch with a coordinator-controlled signal-open denial, typed private receipt transfer, optional exact remaining-budget pressure and32-consumer fanout. Tests fixed first failure, cancellation/drain, diagnostic-clear reentry and zero world budget at two widths. Mutable top-level wrapper state requires ordinary-source initialization and isolated wrapper composition; importing into the shared LR transport would expose uninitialized wrapper state to unrelated tests. Existing runtime_bind can connect wrapper/real symbols. Shared helper ownership proposal sent; no second scheduler/runtime or unvalidated registration. |
| scaffolding/tests/type_object_storage.tower | Disposable TypeObjectIndex uses explicit owning ledgers; fills actual capacity, checks nominal identity and sticky failure without corrupting previous descriptors. Distinguishes Capacity/Memory/wrong owner, measures allocator prefix count, and increments disposed budget revisions before reinit. Canonical recursive records/calls exercise visited traversal and ABI semantic rejection separately from resource failure. Traversals cannot mutate/retain world entities. Existing serial storage runner hook is L2-authorized and merged; owner3-pass evidence retained, current D1 union unrun. |

| Changed path | Reviewed delta and limits |
| --- | --- |
| scaffolding/tests/entity_locality.tower | Replaces allocator-private usable-byte query with physical compiler-buffer requested size, including header. Retained page bytes remain distinct from live payload and process RSS; no packed-payload inference from an archetype index. Owner profile records real one-survivor fragmentation and8-worker regression, not universal speedup. |
| scaffolding/tests/execution_core.tower | Fixed resource receipts tested at compile/start/cache/step gates across target widths; counted diagnostics include extra trailing bytes to reject accidental C-string copying. First offset survives later reports and diagnostic clearing, no execution/effects occur, new compilation resets state. Ordinary graph/session APIs and checked cleanup retained. |
| scaffolding/tests/execution_packages.tower | Resource error with empty message refuses Foundation package encoding, clears stale output and later preserves exactly the counted diagnostic without reconstructing entities. Existing canonical roundtrip/corruption checks retained; test intentionally uses the existing host-world compatibility boundary. |
| scaffolding/tests/execution_type_construction.tower | Private world budget and post-entry pressure reach actual type interning in graph/cache and constructor-result paths. Denial preserves preceding output only, refuses fallback/replay even after capacity returns, and leaves pending constructor result unconsumed. Every request restores baseline and final world retires all grants. Existing mode literals define four graph/cache×deny/admit cases; no new interpreter/folder. |
| scaffolding/tests/interpreter_call_query.tower | Owned-byte oracle now includes invocation-private type-index reservation, in addition to memory/input/frame/task buffers. Avoids falsely attributing newly charged type storage to leakage. Earlier owner/frame alias and continuation checks unchanged. |
| scaffolding/tests/storage_main.tower | L2-owned one import/one call adds type-object storage to existing mandatory single-owner fault runner; no parallel global injection or duplicate runner. |
| scaffolding/tests/work_constructor_budget.tower | Derives physical component-page request through an actual probe and distinguishes a request larger than total allowance (Invalid) from live-owner pressure (Capacity). Failure-only numbers aid diagnosis; constructor cleanup retained. Existing ready-slot16 constant still mirrors implementation and is an explicit follow-up for owner review, not silently generalized during integration. |

Current local validation is frozen at2c1eec38 using the documented public Linux
bootstrap. Receipt/page/TypeIndex changes invalidate earlier compiler evidence;
B1 newer grammar and B2 output consumers remain outside this union. D2's genuine
Wasm-reader cancellation TSan66 remains a production failure assigned B2. Its
native provider import and passing ordinary/address runs do not repair that race.
Final merged instrumentation, bootstrap/browser/generation and leased publication
remain open. Documentation itself does not change runtime behavior, so no runtime
profile is attributed to these audit rows.

### Durable receipt/dispatch integration after 2c1eec38

The ROOT-authorized shared build helper now accepts an explicit first `SOURCE`
option, removes it before symbol bindings and selects ordinary initialization in
all three existing emission paths. Library mode remains default. This is build/
foreign-symbol orchestration, not new test logic. Native standalone before
compositions pass3each and use the existing public compiler/runtime_bind and
production providers. New durable targets preserve the same bodies/outputs;
actual symbol tables contain one main, one wrapper and one real signal provider.

`scaffolding/tests/lr_work_main.tower` adds two typed externs and one focused
receipt-smoke selector. Existing all/query call the5 receipt/cancellation plus28
owner-order cases exactly once outside width/worker iteration. Separate bound
objects avoid duplicate main and preserve each fixture's lexical ownership.
`scaffolding/tests/work_dispatch_result.tower` changes only its composition
comment: no GNU linker wrapping is needed. No assertion or workload weakened.
Native3query,3focusedreceipt,3workdispatch and3each semanticdispatch mode pass,
plus4CTest entries and an unchanged default-library budget caller. Supported
current-source address/thread runs are pending at this entry.

Focused unchanged workdispatch median wall remains.01s; native RSS median
2384->2648KiB is a264KiB process-level difference, not measured retained payload.
Semantic dispatch default median wall.04->.02s, RSS50476->50384KiB; timer/scheduling
resolution prevents speed claims. Both old/new execute identical fixture inputs,
references and cleanup assertions. Old separate receipt/order processes combine
into one LR invocation with identical concatenated stdout; this changes process
startup, so its timing is an integration cost, not compiler throughput.

Query before samples2/3 adapt clone width to1024; after3samples use512. Their
RSS/time difference therefore cannot measure registration overhead. This exact
workload mismatch is recorded rather than attributing an apparent gain to the
helper. The focused dispatch comparisons avoid adaptive inputs. Current page
and constructor/schedule fixtures still need durable registrations, and the
borrowed-view disposal fixture remains deliberately compile-negative.

The current receipt/dispatch milestone now passes3native/3ASanLSan/3TSan query
runs and all registered dispatch modes. Actual memory hooks/objects and real
clone intervals are retained; independent D2 and ROOT code review found no
blocking issue. Final post-freeze change moves a misleading profile-only comment;
no emitted recipe changes. ROOT's later owner-order fixture32case expansion is
not yet adopted here, so this exact28case checkpoint stays distinct. Pages,
constructor/schedule/borrowed-view registration work and integrated release gates
remain open; no global race-freedom or unsupported UBSan claim.

### Typed receipt at the actual phase boundary (after 9842b1f5)

`scaffolding/tests/semantic_resource_checks.tower` now also requires
SemanticProgram.resource None after successful gated entry preparation and while
an isolated declaration still owns failure selection. After the actual startup/
nested-growth denial publishes, Capacity must carry the same independently
checked first-source offset as the diagnostic. This checks the merged producer
ABI at the real phase boundary; it does not duplicate the separate setter or
message-clearing fixture. All24cases/probes/cleanup remain unchanged. Existing
9842 runner supplies the before reference; three before and three after native
runs pass on identical program inputs, public leaf/native dependent rebuild pass.
Supported focused instrumentation is pending at this entry. No production code,
new allocation, guessed storage bound or unrelated fixture rewrite.

Typed actual-phase assertions now pass3native/3address/3thread focused runs,
all24cases; logs phase_receipt_9842. Six prior-reviewed page/constructor/schedule
fixtures now have durable existingfactory registrations, with independent manual
before and targetafter outputs3each,6CTest and3address/3thread each. Normal
concurrent and serial-fault allocator profiles remain distinct; no provider/body
rewrite. `work_view_invalid_dispose.tower` stays invalid and now has current
compiler evidence: jobs1/2 both exit1, identical9:27 nominal-type diagnostic
`Expected vector(usize)*, got work_view(usize)*`, no artifact. Pending scope is
new ROOT556 stage/view tests and affected changed grammar/owner paths, not an
unresolved claim that this old borrowed-view rejection has never been run.

### Integrated stage/grammar checkpoint at reviewed44c1dc10 (ROOT556ecd52)

Complete owner history merged cleanly after bounded jobs drained and00652b2c was
committed. Exact current census1,106tracked /518D1direct (506tests/editor/
playground+12examples), external current_556 rosters. Two new bodies and12changed
Tower paths below are reviewed against556ecd52; old unchanged rows retain their
prior source identity. Workingtree compiler union is UNBUILT locally at this
entry. D2's real race repair evidence and other owner checks retain their exact
scope. D1's typed24phase assertions and six registrations survive the merge.

| Path | Current substantive review and disposition |
| --- | --- |
| scaffolding/tests/entity_stage_result.tower | Real lifecycle finalizer rejects view/stage creation while store reclaims; private output errors distinguish null/staged Invalid, Busy, finite-counter Exhausted and successful acquisition. Pinned publication fails without acquiring queued refs; explicit hold precedes last-view close, successful commit preserves payload/ordered named child. Duplicate existing/in-stage names and ID exhaustion preserve state, retry succeeds, finalizer releases one retained target. Existing lifecycle/raw pointers remain legal with explicit owners. Needs minimal existing normal registration, no separate entities/memory object because imports already define them. Owner native/wasm32/address/thread evidence is not D1 execution. |
| scaffolding/tests/entity_stage_result_faults.tower | Serial allocator denies stage/view allocation and every bounded publication prefix for mixed new and leased existing nodes. Failed publication preserves tables/IDs/stable payloads/grants and leaves held refs untouched; retry commits both and finalizers retire targets. Existing payload survives transitions; final physical-buffer/ledger baseline returns. Uses puts intentionally with serial fault runtime. Needs existing fault registration, no duplicate provider or threaded fault-injection claim. |
| scaffolding/tests/bootstrap_symbols_checks.tower | D2 adds exact per-unit admissions and negative near-name/wrong-unit cases for snapshot, typed parser-table/arena and resource-channel symbols. Narrow identity checks reject broad prefix allowances and test-only allocators. Owner exact native/WASI reports remain separate; current newly merged policy needs actual object reconciliation. |
| scaffolding/tests/frontend_main.tower | Adds grammar-resource selector through existing serial frontend runner, calling syntax-version/construction/template suites. Explicit imports reuse real fixture bodies; no competing harness or production transport change. |
| scaffolding/tests/frontend_syntax_version.tower | Real allocation-prefix sweeps require typed resource failure iff valid construction fails, preserving optional uncached success. Create-result checks Memory/Busy and independent error; ordinary pending/unproductive grammar diagnostics remain None. Invokes new world-type test through actual entry. Rules/counts and spelling lengths derive actual arrays/text. Global allocator injection remains serial. |
| scaffolding/tests/frontend_template_build.tower | Measures successful replacement allocation count then denies each prefix with fresh owner; exact typed Memory versus ordinary invalid capture, stable owner buffer baseline, world-local tree and recovery remain checked. Arrays/text derive counts; diagnostic-only dprintf reports allocation/status without changing selection. Failed owned builders destroy before checking final retained storage. |
| scaffolding/tests/frontend_world.tower | Typed world-component acquisition covers invalid world/kind, allocation rollback, existing pinned lookup, Busy for missing pinned kind, retry and complete physical cleanup. Real call is frontend_syntax_version_tests; this is not an unused helper. Existing host-world compatibility boundary remains explicit. |
| scaffolding/tests/lr_analysis_failures.tower | Full default initialization covers the newly added resource field in LRProbeBudget before allocation/clone sweep. No weakened failure oracle or undefined extra field. |
| scaffolding/tests/lr_control_checks.tower | Probe allowance/token loops derive array lengths and compare typed error alongside remaining budget, completion, stack and predecessor against existing oracle. Full initialized budget copied before both probes; no new parser oracle. |
| scaffolding/tests/parser_state.tower | Actual byte-array size replaces repeated bounds. UTF-8 allocation denial keeps typed Memory across EOF reads. Nested input/recognizer/outer stream preserve first Capacity even when later Memory/report allocation is denied; diagnostic-copy denial itself becomes Memory. Explicit destroy ordering restores allocator baseline. |
| scaffolding/tests/parser_table_budget.tower | Typed probe/completion results preserve prior stack on denial and distinguish absent offer from resource failure. Real syntax session with imported grammar latches query/snapshot Capacity until reset, then valid offer recovers and unknown offer remains None. Exact remaining-byte pressure, owner cleanup before ledger and physical baseline preserved. |
| scaffolding/tests/semantic_failure_order_checks.tower | Four real KnownClone-owner cases add to prior28, now32. Completed known-proof plus normal node-limit failure exercise direct clone selection without starting interpreters; retained text/offset selected after joined stages, ordinary component-limit diagnostic has no invented allocation receipt, repeated owner calls create no nodes. New selector distinguishes owning query frontier. Existing28 oracles retained; current D1 runtime still pending. |
| scaffolding/tests/syntax_template.tower | Successful allocation count now bounds full prefix sweep instead of guessed512. Typed hole-construction result distinguishes Memory from success; actual capture/helper/name/ID arrays derive bounds. Every successful grammar still checks expected shape/bindings and all partial owners clean up. This remains raw grammar fixture data, not language migration. |
| scaffolding/tests/wasm_link_reader_native.tower | D1-authorized D2 one memory-provider import now in complete history. Actual missing-link before and corrected native passes retained. Separate B2 three-line production cancellation fix drains before graph cancellation/parent error; D2 independently reproduced beforeTSan66 and after normal3/address3/thread10. Source import itself was never called the race fix. |

Current stage/view API preserves stable storage and reserve-before-publication,
but stage descriptors/nodes/names/count indexes remain unbudgeted per A2 audit;
there is no whole-world-cap claim. A2 also corrected its historical speculative
linear free-slot scan: the current shared budget free list is already O(1).
Measured extra grants/retention and8worker regression remain real, wait-time cause
unmeasured. Do not introduce a fictitious scan optimization. CurrentROOT556 still
excludes pending world/output constructors, declaration readers, resource pumps,
nested pool and node-cache work; final bootstrap/browser/generation/publication
remains open. Documentation-only review adds no runtime measurement requirement.

### Declaration reader result delta — reviewed 3992b634 (2026-11-23)

The complete B1 owner history was verified against sole public prerequisite60741;
this review reads all7 production and3 fixture deltas. No new D1 paths:518/518
remain substantively reviewed. These are source conclusions, not new D1 runtime
acceptance. Existing owner native/parser-reference/ASan/LSan/TSan/WASI evidence is
scoped to3992's frozen inputs; fullfrontend300s timeout remains open.

| Assigned path | Substantive delta and disposition |
| --- | --- |
| scaffolding/tests/syntax_reader.tower | Typed result variants remain compared against the independent ordinary Tower reader oracle, exact malformed bytes and provenance. A measured successful allocation count replaces guessed512 prefix bound; each denied prefix must report Memory and restore nodes/buffers. Missing syntax component under a real pinned view reports Busy, view closes before successful retry, all owners retire. Identifier arrays/alias offsets derive actual storage/text; named trial/node limits retain fixture policy. Ordinary malformed results remain None unless diagnostic storage itself fails. Existing parser runner owns execution; no parallel fault allocator claim. |
| scaffolding/tests/frontend_syntax_version.tower | Existing construction entry invokes declaration-result tests on its real revision/world. Successful measured prefix count bounds denial; partial revisions preserve source references and buffer baseline. Undefined extension remains ordinary None with exact diagnostic presence, then denied diagnostic allocation becomes Memory without bytes. No independent revision registry, fixture builder or world ownership added. |
| scaffolding/tests/parser_table_budget.tower | Existing session test deliberately supplies a foreign-owner module with diagnostic allocation denied. Requires typed Memory, static diagnostic, no next node and failed canonical formatting with no published text. Foreign module/environment/world retire in order, original valid session resets before existing completion pressure. Failure is not silently treated as malformed input or successful output. |

Production source review confirms exact read/declaration/component results,
first-cause retention with concrete diagnostic when possible, and static fallback
on denied diagnostic storage. Comment/index failures flow through the existing
session; formatter checks resource failure before publication. Remaining raw
pattern/LR buffers, pool slots and reset/legacy construction paths are explicitly
owner gaps; no whole-world memory-cap or universal race-freedom assertion. The
owner's bounded n6 editor RSS investigation retains its original n2 increase and
does not establish a regression or improvement. Documentation-only review has no
runtime change to profile.

### Durable stage/view fixture registration — frozen83800126

No new Tower paths or fixture body changes;518/518 direct paths remain reviewed.
`entity_stage_result.tower` now enters the existing normal fixture factory and
`entity_stage_result_faults.tower` the existing serial fault factory. Their full
entities/stage/memory imports supply one provider each, without the separate
entity-create provider. The existing `entity_stage_concurrent.tower` supplies
actual worker cancellation/publication coverage; serial failure-prefix execution
is not called threaded coverage. README records exact targets and distinctions.

Independent public9653 leaves and manual3each passed before registration. After
registration, native3each, two named CTest cases, address3each and thread3each pass
with exact baseline stdout and one main/allocator/provider definition. Actual
fixture/provider instrumented IR+objects and access hooks are saved. Separate
unchanged worker-stage fixture passes native3/address3/thread3, each retaining its
barrier/ownership/lifetime assertions and57792 finalizations. This supports the
checked executions, not universal race freedom or source UBSan/externalLLVM.

The current stage fault fixture's guessed StageFaultLimit96 remains an owner
follow-up: derive its sweep from a measured successful publication allocation
count, preserving rollback/retry assertions. Routed A2 via status; registration
does not silently change that specific owner fixture. Earlier constructor/schedule
array-bound proposals likewise await owner disposition.

Current838 merged native compiler/LR/frontend public build and receipt32,
resource24, query-smoke, parser and grammar-resource pass locally, distinct from
older28-case receipts. D2 exact7fb parser symbol policy was independently read:
four observed ParserNodes-only names, explicit positive/near-name/wrong-unit
cases, no speculative export allowance. Its production directories byte-match838;
full history is queued after this source freeze. New A1/L2/L1 inputs are not covered
by these results. Final clean bootstrap/browser/generation/release remains open.

### Complete world/query join — reviewed2412f872 (ROOT35127448)

Verified complete D27fb/A10beeb/L2f035/ROOT351 bundles and owner journals, including
failed experiments and pending coverage. Source merges preserve all histories,
D1's two stage registrations/README, receipt selector and typed24phase assertions.
Resolved only two older D1 fixture hunks in favor of their current checks and the
shared Stale/Exhausted message conflict in favor of A1's newer implementation.
No independently invented producer/provider or layout. Current census is520/520
direct paths (508test/editor/playground+12examples),1108 tracked Tower files.

| Assigned path | Substantive new review and disposition |
| --- | --- |
| scaffolding/tests/bootstrap_symbols_checks.tower | Complete D2 exact four-name ParserNodes-only result policy includes positive, prefix/suffix and wrong-unit rejection. No broad export permission. Independent source/receipt review completed; D2 native/WASI policies and serial instrumented checker are exact-source evidence, not wholecompiler instrumentation. |
| scaffolding/tests/semantic_query_failure_checks.tower | New234-line A1 fixture uses private Evaluate probes and real generic/interpreter producers. Gates both successfully prepared invocations, proves constructor/function suspension and completed peer, fills actual task capacity and prewarms the existing-key hash index before pressure. Three modes x32/64bits x1/4workers check Capacity, drained pool/tickets, no peer publication, repeated terminal pump without node/component growth and exact final ledger retirement. Declaration mode exercises failed empty-batch admission. Earlier fixture abort reached the wrong hash-growth phase; corrected owner before/after evidence retained. Minimal durable production-composition target authorized; no body rewrite/new scheduler. |
| scaffolding/tests/type_execution_receipts.tower | Three added cases derive graph pressure from live task/ready capacities. Registration failure leaves owning evaluation ticket running; terminal failure proves producer reached Succeeded before consumer-enqueue denial and forbids ready/result publication. Success control runs same queue pressure, sticky first receipt survives text clearing, and graph owner drains before final grants release. Existing stale revision/profile/dispatch, changed sequence/operand, unrelated dependency and cancellation cases remain. Existing query runner calls these; no additional target needed. |
| scaffolding/tests/world_constructor.tower | New73-line serial fixture calls opaque production exports, importing only shared entity types rather than a duplicate world provider/layout. Measured successful constructor bytes/allocation calls bound exact-capacity, one-byte-short and every physical denial. Requires world/store same ledger, active descriptor grants, no execution lanes, occupied output unchanged and zero partial/final ownership. Existing allocations selector registers it via frontend_units_allocation. |
| scaffolding/tests/frontend_units_allocation.tower | Adds that constructor call and derives successful compilation allowance from checked same-source reference peak plus replacement input. Prefix bound uses named actual two-snapshot contract; keeps old source through either failed replacement allocation and verifies complete retirement. No broad cap raise or removed failure assertion. |
| scaffolding/tests/frontend_units_memory.tower | Fresh reference independently executes answer42 and records constructor/live peak. Explicit input spans and four-word header oracle remain separate. Original finite import denial and new peak-minus-one semantic denial require Capacity/no output; latter is known FAIL134 (Memory) in owner and A1 repro, retained as release gate. Exact replacement high-water, old input release, NUL offsets and cleanup remain. This is neither a passing whole-unit suite nor acceptance of arbitrary Memory fallback. |
| scaffolding/tests/backend_units.tower | Under joined publication boundaries, stable borrowed CompilerWork anchor exposes real component/page grants, counting each physical allocation once. Exact equations distinguish released backend target/objects/pages from retained frontend components and measured graph growth. Actual type-size-derived pool slot/header admission preserves setup retry. No loose inequality replaces release equality, no second world layout/export. Owner real-overlap backend suite passes; matching new D1 union not yet run. |
| scaffolding/tests/editor_world.tower | Synthetic first-cause Capacity receipt then Memory after text clearing tests output suppression with allocation denied, static error presentation, no new buffers and independent fresh-query recovery. Explicitly consumer evidence, separate from physical producer denial. Existing inspection entry calls it. |
| scaffolding/tests/ide.tower | Existing IDE export invokes both actual pointer widths. Injected fixed receipt forbids execution progress/fast path, artifacts, Foundation/package publication and new handles; exact first cause/offset survives, rejected private session retires and fresh compile recovers. Bounds derive actual width array. This is browser transport consumer coverage; matching reactor remains pending, not substituted by native source compile. |

Read full corresponding producer/consumer changes. World descriptors/store and
outer CompilerWork/pool now bind budgets before allocation; legacy postconstructor
binder remains selected-buffer-only and cannot prove all memory charged. Static
borrowed fallback strings are distinct from owned output bytes. L2's current
generic stage/view/publish fallback still guesses Memory; typed-result follow-up
is pending. A1 ordinary nested pool/graph budgets and L1 cache remain separate
owner work. New union has no runtime acceptance yet. No full type/bootstrap/
browser/generation or publication claim; documentation adds no runtime cost.

Prospective regex delta reviewed atdce8b719/490d488e, fetched only during the2412
instrumentation freeze: no new path or census change. tests/regex.tower retains its
independent ordinary Tower oracle and seeded cases, derives each failure prefix
from successful lowering allocation count, and requires exact Memory plus scratch/
output retirement. Pinned input graph canonical bytes remain unchanged. Counted
embedded-NUL success, truncated span Invalid, populated output Invalid with old
acceptance retained, and ordinary nullable/reversed-range/Unicode rejection None
are distinct assertions; same-length source substitutions preserve parse spans.
tests/frontend_main.tower adds only the owner-authorized regex selector, reusing
existing import/default call to make the actual oracle reachable in supported
native instrumentation. No second harness or provider. Producer spans are counted;
legacy wrapper derives full root extent including NUL. Negative state rejection
retains semantic failure rather than inventing Memory. Owner native/address/thread
and n2 profiles apply to its earlier29source; currentROOT351/WASI remain pending.
No runtime claim follows from this read-only review or metadata fetch.

The joined2412 query-failure target is now durably registered through the existing
production provider composition, with one ordinary exported main and real worker
entry. Its unchanged twelve cases pass three native processes per selector, then
three address/leak and three thread-instrumented processes per selector. Exact
manual-before stdout, object identity, unique providers and three CTest entries
pass. D2 independently reviewed the registration. Current query-smoke also passes
three runs in each instrumented mode with real clone overlap; new world-constructor
checks pass in the serial allocations selector in native/address/thread modes.
These are scoped current2412 results. The known failing peak-minus-one units case,
newerROOT302 sources, source UBSan/external LLVM, browser/generation and integrated
publication remain outside this evidence. Detailed timing/retention and failure
logs are retained in the journal and query_failure_before/after receipt.

Follow-up review of scaffolding/tests/driver_measure_cases.tower at2412 confirms
the emitted memory kernel repeats element count4096 and byte extent16384 beside
its fixed u32 recurrence. D2 has narrow authorization to derive byte length from
one count and sizeof(u32), and use that count for indexing, preserving the workload
and independently checked outputs. Iteration/sample constants are deliberate
measurement policy and remain unchanged. This is pending implementation/evidence,
not a new passing fixture or an audit census change.

### Pool and typed-publication join — reviewed31c0dcc1 (ROOT30200761)

The complete bundle34ce0a31 merged without conflicts after3e371ebd and all owned
jobs drained. Current roster is522/522 assigned Tower files of1111 tracked:
two new assigned fixtures and one new production declaration. The declaration
moves the existing generic work structure without adding fields; tests import
that actual type rather than infer private component offsets. Existing D1
registrations and gated resource fixture are byte-unchanged. No new runtime
acceptance follows from this source merge.

| Assigned path | Substantive review and disposition |
| --- | --- |
| scaffolding/tests/semantic_pool_budget_checks.tower | New118-line fixture exercises actual sem_workers_open and declaration/layout entries with synchronized world budget. Sixteen cases cover32/64-bit targets and1/4 requested slots. Success checks exact sizeof(WorkSlot)-derived storage, physical allocator header charge, same budget owner, no lane reservation, and idempotent admission. Full remaining-byte pressure requires exact Capacity/no published slots; releasing pressure cannot revive terminal failure or grow entities/components across three retries. Context/graph/world teardown returns all grants to zero. This tests slot ownership, not actual worker overlap. Existing exported main needs only the standard production-composition registration; owner32f860 before failure and after pass/profile are distinct from forthcoming D1 evidence. |
| scaffolding/tests/generic_pump_publication.tower | New89-line actual generic receipt fixture uses real copy completion, exact width*depth, no live stage or running jobs before checking publication. Independent extra pin forces Busy after a successful copy; failure leaves the instance empty/pending and node/component counts unchanged, and removing the pin cannot restart it. Unpinned control requires graph success and structural clone oracle, then final zero budget ownership. Existing query runner calls all four32/64-bit outcomes. Its direct unbudgeted work_pool_open is a known integration gap; L2 owns replacing it with sem_workers_open and checking the physical owner, preserving Busy/copy/cleanup oracles. |
| scaffolding/tests/generic_clone_parallel.tower | Calls the new publication oracle before its existing calibrated distinct-thread overlap/cancellation/failure cases. No scheduler, calibration threshold or concurrent oracle is removed. Serial publication tests do not supply overlap evidence by themselves. |
| scaffolding/tests/semantic_failure_order_checks.tower | Opens the actual budgeted pool before applying interpreter-startup pressure. This isolates the intended failure phase after new slot accounting; all32 canonical source/clone-order cases remain. No numeric-offset sorting or broad message alternative is introduced. |
| scaffolding/tests/semantic_publish_checks.tower | Applies unchanged startup/arena/growth allowances after real input construction and pool admission. Remaining budget is measured, and postjoin grants equal the measured retained baseline plus independent pressure. Cancelled entry still creates no pool. Exact publication/no-partial-output and retry/cleanup assertions remain; owner retained initial wrong-phase failures and the null-assumption crash. |
| scaffolding/tests/regex.tower | Previously prospective490d488e review is now adopted through complete B1 history. Counted span/NUL/Invalid/semantic-None cases and measured physical allocation sweep remain as reviewed above. Earlier B1 scoped runtime receipts remain tied to their original binary; current joined native/WASI checks are pending. |
| scaffolding/tests/frontend_main.tower | Adopts B1's exact existing-import regex selector. Full default order remains; no extra provider or generic harness. B2 foreign-allocation branch is still separately owner-controlled and not present in this checkpoint. |

Read the nine A1 pool/caller production changes and L2 typed stage/view/publish
consumer. Admission precedes dispatch and sticky failure returns through owning
pumps. Publication retains failed stages for deferred cleanup, clears successful
freed stages before readiness, holds queued references before closing the last
input pin and cancels graph work only after wave cleanup. Typed producer errors
now replace the former unconditional Memory guess in this generic consumer.
This does not close other graph/capture allocation paths or the independently
known LR replacement Capacity failure. No noalias or whole-program race claim.

### Prospective stable-page reuse — reviewede28c3eb2, not yet adopted

Fetched full A2 bundlefb759496 for read-only review while D2 builds. The following
three new/eight changed assigned paths are reviewed separately from the current
522-file census. Adoption changes EntityComponentPage layout and requires coherent
providers and consumers; earlier D1 binaries cannot validate it.

| Assigned path | Substantive review and disposition |
| --- | --- |
| scaffolding/tests/entity_page_reuse.tower | New115-line fixture derives page occupancy from actual capacity, keeps a published payload stable while leasing its owner, and creates full/partial pages in two distinct stages. Publishing one transfers only its partial pool links; the other remains private. Tail reuse and exact freed-slot/address reuse require unchanged allocation generation/bytes, then private discard releases exact page grants. Reference/finalizer equations and final zero ledger/store ownership remain independent. Ordinary exported main can use the existing normal test factory. |
| scaffolding/tests/entity_page_churn.tower | New116-line Tower measurement keeps one live survivor per original page, removes/refills all other slots over four rounds, and checks stable survivors, identities, payloads, counts, references and final cleanup. Page arrays/counts and charged bytes derive from actual allocations. Reports real remove/refill times, physical grants/retention, CPU/RSS for1024/65536 rows. Raw entities/indexes/fixture arrays are explicitly outside the ledger subtotal. Keep this measurement out of default timing-sensitive correctness gates. |
| scaffolding/tests/entity_stage_reentrant.tower | New81-line callback regression publishes, leases and discards three separately owned stages while a different victim is finalizing. All parents/types/stages predate reclamation; it does not borrow or mutate the dying entity. Exact joined child/payload, survivor value, references, one finalization and zero final counts distinguish legal live-owner reentrancy from the existing dying-owner Busy case. Ordinary exported main fits the normal factory. |
| scaffolding/tests/compiler_storage.tower | Coordinator-authorized stale UTF8 diagnostic correction now requires exact Memory, fixed current text and repeated terminal EOF before unchanged cleanup. This preserves physical failure injection; no parser producer is changed and no broad message alternative is accepted. Owner retained the old failing binary and validated the corrected test with its exact CMake host composition. |
| scaffolding/tests/compiler_work_profile.tower | Eight plans remain deliberate fixture data; rounds/counts/checksum derive from the actual job array, with worker divisibility checked. Ownership comment now includes charged component pages while excluding raw nodes/membership indexes. Both profile provider builds used the same observer changes. Reported real overlap does not imply profitable eight-worker execution. |
| scaffolding/tests/entity_component_budget.tower | Joined staged publication still checks stable payload addresses and full-page detachment; a partial published page must now point to store.storage. Its parallel allocation/publication/cancellation and exact physical budget assertions remain. |
| scaffolding/tests/entity_component_faults.tower | Replaces guessed64-attempt ceiling with successful allocation-call measurement for each staged/large matrix entry. Every earlier prefix must fail; the exact count must succeed with matching allocation count. Existing rollback, payload and final ownership checks remain; serial fault allocator only. |
| scaffolding/tests/entity_pages.tower | Published tail pages now belong to the store reuse pool; stable addresses, exact query ordering and lifecycle checks remain. This follows the new pool-link contract, not permission to move live payloads. |
| scaffolding/tests/entity_stage_result_faults.tower | Replaces guessed96 sweep with measured successful publication calls, every failed prefix and exact-count success. Typed Memory, staged/new and leased rollback/retry, identities, references and zero buffer checks remain. Closes D1's specific derived-bound proposal once merged and validated. |
| scaffolding/tests/work_constructor_budget.tower | Actual initialized task-index buffer capacity supplies the physical index charge. Descriptor/store/page threshold distinctions remain exact, including Invalid versus Capacity. Removes the copied16-entry assumption without changing the constructor contract. |
| scaffolding/tests/work_schedule_budget.tower | One-task reference supplies actual initial capacities; reset/growth uses actual task capacity; shared lanes, loops and physical slot bytes derive from the four-job array. Deliberate cancelled job2/32-task workload stays fixed. Retained graph addresses, stale ticket rejection, exact denial, distinct threads and drain-before-dispose remain. |

Read all three associated library changes: only dead descriptors reuse type_index
as the free chain after finalization/index removal; living addresses do not move.
Partial private pages transfer after staged owners publish. Full detached pages
rejoin their owner's current pool on first free. This is measured stable payload
reuse, not a packed archetype claim or safe stale-pointer handle. A2's repeated
metadata regressions remain explicit: four-worker accounted wall about+5% and
eight-worker plain about+8.8%, without measured per-lock attribution. Churn gains
do not erase them. Owner24 supported sanitizer runs/WASI and unchanged reference
measurements belong to its documented02db-based inputs; current joined evidence
is pending.

Adoption update: complete ROOT9d73da0b bundle3fdea35e merged cleanly asc9f3e3f5
after the preceding read-only review. Those three new/eight changed files are now
in the direct audit:525/525 assigned of1114 tracked Tower paths. Existing D1
registrations and the gated resource fixture remain byte-identical. The incoming
journal's six Windows1252 dash bytes were repaired by ROOT with the original blob
retained; strict UTF-8 validation now passes locally. The changed page-header ABI
and pool/publication union have not yet been built in D1; no older runtime result
is relabeled. New pool/reuse/reentrant registration will follow equivalent manual
baseline measurements on these coherent sources.

### Charged interpreter cache — reviewed85c79ae1 (complete L164c15b8e)

Full bundleb5ed5358 includes ROOT9d73 and was reviewed/merged before the next
unstarted build. No census change:525 assigned files. All five producer/storage
deltas were read: invocation startup admits the existing direct-mapped cache as a
world-budgeted work_vector before execution; prevalidation reads the actual node
directly; lookup derives its mask from actual initialized length and checks the
full key. Ordinary and Fast disposal release the same physical grant. The rejected
fixed-mask optimization is absent. Private maps/function tables remain separate
owner work, so this is not whole-interpreter allocation closure.

| Assigned path | Substantive review and disposition |
| --- | --- |
| scaffolding/tests/interpreter_call_query.tower | Exact retained ownership now includes node-cache reservation. Five startup phases derive allowances from a successful invocation's actual grants and explicitly record which earlier owners may exist. Capacity denies the intended buffer, forbids partial outputs, and preserves exact text/owner bytes. Returning pressure cannot replay a failed invocation or change its steps; disposal restores the measured baseline. Existing alias/value/capture/query checks remain. |
| scaffolding/tests/interpreter_storage.tower | Adds serial physical Memory and budget Capacity denial of actual cache admission. Ledger metadata is prepared first so the physical fault hits the intended cache buffer. Failure requires null data/zero length/capacity/no grant; successful low-level storage retry owns exactly one physical grant without clearing the sticky failure. Disposal restores allocator count and zero ledger state. This is single-owner fault coverage, not threaded allocator instrumentation. |
| scaffolding/tests/semantic_resource_checks.tower | D1-authorized handoff is preserved: startup now identifies exact node-cache denial with no retained cache owner; successful gated preparation proves a nonempty cache grant owned by that invocation's budget. The separate executed nested stack-growth oracle remains exact. All24 width/worker/decltype/isolation cases,16KiB budget,8KiB nested frame and owning-program receipt assertions remain unchanged. No broad message alternative or guessed allowance increase. |

L1's controlled48-process comparison uses the same real executable path and
identical complete resources, superseding earlier code-cost attribution confounded
by executable-derived fallback roots. Three retained samples show no established
material cache regression but do not prove neutrality or general speedup; Fast
large wall1.69->1.70s remains visible. Owner5 address/5 thread gates and actual IR
hooks apply to4bef, not this newer union. D1's current eight-leaf/coherent native
baseline is running on85c79ae1; matching runtime acceptance remains pending.

### Prospective LR Capacity producer — reviewed1944d6a01/ROOT76d297c2

Complete bundle4e5e70e9 arrived during the85c79 build. Fetched/read only; no
adoption or census change. Reviewed all six corresponding producer/consumer files
and the following four assigned fixture deltas. Per-call buffer/vector errors
now flow through serial and worker-owned runtime rows; joined publication selects
source-state order, retaining earlier grammar conflicts. No shared budget-error
field is used as a cross-worker result. LR graph and retained parser pool storage
remain explicitly unbudgeted, and FIRST/state bool fallbacks remain separate work.

| Assigned path | Substantive review and disposition |
| --- | --- |
| scaffolding/tests/lr_budget.tower | Actual successful retained bytes establish pressure. Both serial and explicit-worker runtime constructors must return exact Capacity, restore original owners/lanes and retry after pressure release. Null input is exact Invalid; ordinary successful table/conflict checks remain. This tests underlying allocation outcomes rather than accepting any null result. |
| scaffolding/tests/lr_runtime_faults.tower | Existing independent action/goto/conflict reference now exercises both serial and worker-result implementations under serial fault injection. Null means exact Memory; successful grammar conflicts retain None. Two complete sweeps compare actual allocation counts and outcomes; scratch arrays derive from measured successful calls with overflow check. Clean retries and final allocator baseline remain, with no fixed1024 bound. This is not real worker overlap. |
| scaffolding/tests/lr_work.tower | Retained worker-pool collision now requires exact Busy from the typed lease API. Serial/parallel table comparison requires explicit None before comparing all rows/conflicts. Existing lifetime/thread/owner checks remain. |
| scaffolding/tests/storage_main.tower | Root-authorized runtime-faults selector calls the already imported oracle immediately after the serial-transport guard. Unknown selectors fail; default resource-root setup/order remains. No new runner, provider, or production ownership. |

Owner unchanged full-units peak-minus-one/no-output/retry oracle changes from
before134 to after pass on its503-based source. Fixed-real-path20-process profiles
preserve outputs/canonical counts/retention; n2 wall differences about-0.07% to
+1.23% do not establish neutrality or speedup. Earlier different-install-path
measurements remain historical output evidence, not isolated code costs. Current
joined address/thread/WASI and D1 acceptance remain pending. Old85c known failure
is not relabeled as fixed until this complete source is adopted and checked.

Current85c native disposition: all eight changed public leaves, coherent compiler/
LR/frontend/storage, query/resource24, regex/grammar/parser/allocation/storage
checks pass. The16 pool cases and two positive entity fixtures each pass three
manual baseline runs, then three registered runs with byte-identical objects and
stdout. All three new CTest entries pass. D2 independently reviewed patch2d03795d;
existing factory/provider ownership is preserved. Refreshed worker-stage and
component-budget fixtures each pass three native runs, separate from serial slot
admission/finalizer checks. Exact measurements and limits are in the journal.
Matching address/thread checks remain pending after the queued complete76 merge;
no obsolete instrumentation run or whole-release acceptance is claimed.

### Capture admission and real publication-pool ownership — reviewedff3a0bb4

After the85c native jobs drained, merged complete ROOT76 asb53c838a, complete
A19549559a/de8069cd and L260fc53e histories without conflicts. All owned generic
registrations remain. The previously prospective four LR rows now apply to the
current source, still awaiting D1 runtime checks. Census is526/526 assigned paths
of1115 tracked Tower files; the new capture file was read in full.

| Assigned path | Substantive review and disposition |
| --- | --- |
| scaffolding/tests/semantic_capture_admission_checks.tower | New134-line fixture owns a world/context and deliberately separate finite query-graph ledger. Sixteen cases cover32/64-bit targets and world worker budgets1/4: healthy undemanded identity, cancelled graph, measured real task-capacity denial, and existing fixed Memory receipt. Actual task/hash capacity preparation isolates graph denial before metadata creation. Same/later declaration requests after pressure release must preserve task/entity/component counts and first receipt at owning offset83 or original27, despite peer offset11. Final graph/world teardown reaches zero grants. No workers execute in these admission cases; prior Memory is injected receipt preservation, not physical ENOMEM. Standard exported main needs the existing production composition with four selectors. |
| scaffolding/tests/generic_pump_publication.tower | Replaces the earlier unbudgeted fixture pool with actual sem_workers_open. Before/after snapshots prove its world budget owns the physical slot/header bytes, extent derives from actual count*sizeof(WorkSlot), and no execution lane is reserved by storage admission. Real context disposal closes it. Every existing completed-copy/Busy/no-publication/sticky-failure/final-zero assertion remains. This closes the specifically identified fixture bypass, not all compiler graph or pool accounting. |

Read A1's production admission change: terminal contexts/graphs return before
metadata; healthy existing identities are reused; graph request/seal succeeds
before capture kinds/storage attach. Failures use the existing joined cancellation
and fixed receipt with the owning subject offset. Later component allocation and
capture/proof assertions remain open. Owner before healthy0/cancelled134/capacity134/
failed1 and after16 passes are distinct from current D1 evidence; fixed-real-path
performance and current instrumentation remain pending. L2's stronger32-process
fixed-path control supersedes isolated-cost inference from its earlier26993
different-path comparison, while preserving every original observation. New
joined native/sanitizer/public release checks are not yet run.

At ff3a, all16 capture admission cases pass three native runs after public-leaf
compilation and a coherent compiler build. The four-selector CMake registration
uses the existing production composition and unchanged Tower fixture; native after
comparison and supported instrumentation remain pending. The wider query gate
fails its measured Cancel4 overlap assertion after selecting width256. Every clone
result is correct but no intervals overlap; this is routed to L2/ROOT without
weakening the oracle. Later broad selectors did not run. Current526/526 source
audit coverage is not a claim that the current integrated runtime gates pass.

### D2 delegated generator and symbol fixtures — prospective3020df41

Reviewed the complete two assigned-file deltas in D2's3020df41, queued through
complete d799e6f9 history. No new assigned paths; current526 census is unchanged.
D1 explicitly delegated the generator extent correction; no competing edit.

| Assigned path | Substantive review and disposition |
| --- | --- |
| scaffolding/tests/driver_measure_cases.tower | The existing private ByteBuffer/defer owner now derives allocation count, fill bytes and modulus from one generator-owned element_count and sizeof(u32). Existing measure_number emits the same literal Foundation operands; no runtime mutable count, alternative constant folder, interpreter or scheduler. Both Foundation workloads, raw/optimized C, executable and fresh object are independently byte-compared against the archived original by D1. All six pairs match. The rejected runtime-count experiment remains rejected for measured large regression despite correct outputs. Append-allocation counts were not separately measured; RSS is not live heap. |
| scaffolding/tests/bootstrap_symbols_checks.tower | Extends the same borrowed-text verifier fixture with exact Semantics admission of stage-open, stage-publish and view-open result names plus prefix/suffix and wrong-provider negatives. This validates observed component linkage boundaries, not payload aliasing or worker race freedom. D2's actual native/WASI reports and supported fixture instrumentation are source-scoped to its0ce closure; newer joined policy evidence is pending. D1 read the corresponding owned tool change: only these three exact Semantics imports are allowed, without wildcard or speculative LR names. |

Receipt1fcb88fb931757d9c40b993111a0247a08295f4ab8050375b8bbefd1196dce3e
was hash-verified and six independent cmp results retained at
build/d1_ecs/d2_count_review/byte_identity.log. This review does not adopt the
queued source or relabel the owner's earlier measurements to ff3a. Runtime
profiling of these audit paragraphs is inapplicable.

Capture registration native disposition at ff3a+95f78: manual and registered
objects AND complete executables are byte-identical. All16 cases pass three
process samples per selector and all four CTest entries pass. Current resource24,
full ECS units (including the previously failing LR Capacity oracle), control,
grammar-resource, parser and storage pass independently. Exact measurements and
source identities are in the journal. Current ASan/LSan and TSan remain pending;
original Cancel4 query overlap134 remains an open owner gate.

Prospective D2 b5a740e05 adds four further cases to the already audited
scaffolding/tests/bootstrap_symbols_checks.tower: exact ParserNodes view-result
admission plus truncated/suffixed spelling and wrong-Utf8-unit rejection. Read
its corresponding one-name tool permission and verified complete bundle/receipt.
Current526 assigned paths are unchanged. This observed per-provider linkage
permission does not permit new unobserved LR APIs or prove payload safety.

### Complete D2 adoption — reviewed213c243ea

Complete b5a740e05 history merged after d916 native jobs drained. The earlier
prospective3020/b5 symbol/generator rows now describe the current source, with
526 assigned paths unchanged. D1 independently reads the retained default-selector
failure1, old fresh-WASI policy failure1, corrected group/policy0 and current
units/runtime-fault0 receipts. The archived D2 compiler is byte-identical to D1's
da9f8a4c. Both packages contain50 resources, but nine LLVM runtime texts differ
in ModuleID build-cache-path comments; all other text matches when only those
comment lines are excluded. The raw resource comparison fails1 and is retained.
Do not claim whole-package byte identity or new package/browser acceptance from
this check. Current address/thread runtime evidence and clone overlap remain open.
Documentation-only reconciliation adds no runtime profiling need.

Current213c supported instrumentation disposition: all42 planned runtime processes
pass under each of address/LSan and thread instrumentation, with actual access
hooks and unchanged source manifests. This closes the scoped e47 pool/reuse/
reentrant and d916 capture registration gap at this source. Real stage/component
worker stress is separate from admission-only cases. Original query-smoke134,
newer565 source acceptance, unsupported source UBSan/external LLVM coverage and
final integrated release remain explicit. The fixed-four caller audit above is a
future affinity-profile requirement; no worker-count oracle was weakened.

### Prospective function/scratch/grant/foreign union — reviewed565cd436e

Verified complete ROOT bundle8d838127, sole60741 prerequisite. The incoming tree
has1117 Tower files and528 assigned paths, including the unchanged12 examples
under scaffolding/examples. The first inventory filter omitted that directory;
adding its actual prefix restores the correct count. Both new files and all six
changed assigned Tower bodies/deltas below were read. Production review here is
limited to the contracts needed by these fixtures; ROOT/owners retain their full
production audits. This source is not yet accepted by D1 runtime evidence.

| Assigned path | Substantive ownership, scheduling and coverage disposition |
| --- | --- |
| scaffolding/tests/entity_node_profile.tower | New180-line Tower measurement keeps eight canonical flat/tree subtrees and publication order invariant across requested1/2/4/8 workers. Private staged nodes are authoritative; raw pointer arrays are derived check indexes. Explicit synchronized budget reserves caller/extra lanes before batch dispatch; queued stages hold references before the final input view closes. It checks IDs, ordered parents/children, references, no unexpected components, complete discard/drain and final-zero grants. Reports real interval concurrency, create/join versus serial publication/release time, CPU/RSS and charged/retained ledger fields. Descriptor byte product and ledger subtotal are not total allocator footprint or packed payload evidence; raw check indexes remain outside ledger. Requested workers must match actual pool count, so future affinity-limited runs must choose supported inputs. New measurement is owner evidence preparation, not a default passing test or claimed node-allocation fix. |
| scaffolding/tests/foreign_name_profile.tower | New56-line serial measurement links one public opaque-result fixture against frozen before/after providers, without copying private ForeignName layout. It validates ordinary and complex Itanium names byte-for-byte, checks checked decimal iteration input, tracks successful allocation-call delta and returned-owner peak buffers, closes each result and requires baseline retention. Wall/CPU/RSS come from existing process_profile. Peak returned-owner buffers exclude temporary allocation peaks; no useful worker scaling or thread instrumentation claim follows from this single-owner allocator. |
| scaffolding/tests/foreign_tool_checks.tower | Adds12 exact ABI-output cases with every physical fault prefix derived from the successful input's allocation count: ordinary/wrapped names, substitutions, templates, operators, callbacks, arrays, member pointers, constructors and alias-rich LLVM names. Denial must expose no partial symbol and release every owner, then a successful retry must reproduce the expected bytes. Two malformed/profile cases preserve a static first diagnostic cause even if prefix/suffix presentation allocation fails. Existing foreign_names oracles independently check expected bytes. This is serial fault coverage; the imported tool keeps its existing binder-selected main and providers. |
| scaffolding/tests/generic_pump_publication.tower | Adds four empty/ready scratch cases across widths4/8 after real world, pool and query admission. Exhausting the actual remaining ledger must deny the first ready-batch buffer with exact Capacity before any clone dispatch; an empty pump requires no grant. Taken tickets cancel, workers/queries drain, entities/components/body children remain unchanged, releasing pressure does not replay the failed request, and teardown returns all grants. Existing completed-copy/Busy publication cases remain. The measured ledger is the same world-owned budget; no separate scheduler or result authority is introduced. |
| scaffolding/tests/interpreter_call_query.tower | Adds five function-reference scenarios per width: successful growth, runtime initial/growth Capacity denial after exactly7 or7/8 output, and staged initial/growth denial without unsupported output effects. A preliminary completed invocation measures actual retained capacity before the immutable test graph is extended. It validates declaration ordinals, empty intervening slots, exact physical grant/header charge, unchanged pointer/extent/reservation on denial, offset73, no replay after pressure release and final world/private-owner cleanup. The new cases use a conversion statement around the function reference; ROOT explicitly reports direct-return failure publication as a remaining L1 concern, not covered by these cases. Collision/maximum-index Invalid branches and physical function-index Memory are not new direct oracles here. Only the existing query-smoke path reaches call_query_tests after clone overlap; current resource-only instrumented receipts do not cover this incoming change. |
| scaffolding/tests/work_budget.tower | New borrowed-reservation validation checks exact None/Stale/Invalid without modifying receipt, ledger counters/capacities/free list/generation/revision or prior Busy diagnostic. Wrong owner/revision/slot/generation/lanes/bytes/inactive, released/reused slots and reinitialized ledger are rejected. A live byte-only grant validates; an empty non-live grant does not. It deliberately does not manufacture an execution lane or pin lifetime. Existing seeded8192-operation reference model now derives count and budget limits from actual arrays/ledger fields. |
| scaffolding/tests/work_budget_allocation.tower | With a live receipt and the serial allocator denying its next allocation, validation must return None without advancing allocation-call count. Existing real growth-denial rollback/retry checks remain. This isolates validation's allocation-free contract and does not sanitize concurrent ledger use. |
| scaffolding/tests/work_budget_shared.tower | Workers borrow their own immutable parent receipt and repeatedly validate it and each live extra grant while the synchronized ledger may grow; released copies must become Stale. Four actual threads retain the existing gate/join checks. Array-derived participant count and named workload sizes replace duplicated extents; snapshots compare real ledger limits. Parents remain alive through join and release only afterward. This remains a deliberate four-thread scenario; D2's future affinity correction requires a separately recorded >=4-allowed-CPU profile, not a false two-lane pass. |

The relevant new contracts are world-budgeted function-index and generic batch
work_vectors, non-mutating synchronized receipt validation without lifetime
extension, and sticky foreign-name failure independent of diagnostic allocation.
Generic source-window rescan relies on clone publication changing descendants,
not function entries or body demand. Raw foreign records/strings are still
per-result owners; these tests do not establish a whole compiler memory limit.
ROOT labels565 a source union with remaining producer/return/publication work.
Current341/213 runtime receipts stay separate. Profiling this audit text is
inapplicable; owner measurements and new joined validation must retain their
actual source identities.

The prospective565 review is now adopted through full-history merge af22cfbc1,
after all213c jobs drained and their complete341 evidence was committed/exported.
Current coverage is528/528 assigned paths of1117 tracked Tower files. D1's capture
registration and all prior generic targets survive the merge; production compiler,
library, host, backend and bootstrap bytes exactly match565. New IMState, generic
scratch, borrowed validation and foreign failure inputs require coherent new
validation; the successful213c receipts are not relabeled as covering them.

### Direct return, proof publication, containment and forest review (2026-11-23)

Reviewed incoming complete bffbd3f7046984c2bcc71f28bda1b7682e723cf2, then
d3a87129547c7004df4ddb920046d60712526ad8, before adoption and with no D1 build
running. The current_typed_forest roster contains533 assigned paths of1122
tracked Tower files; five new fixtures supplement the prior528 reviewed paths.
The following are substantive delta reviews, retaining earlier full-file audits.

| Assigned path | Reviewed source and ownership/storage/scheduling conclusion | Evidence, gaps and disposition |
| --- | --- | --- |
| scaffolding/tests/interpreter_call_query.tower | bff: four staged modes replace two, adding first/growth function-reference return denial at both target widths. Return nodes reuse the actual function binding; entry result type follows that reference. Real work-vector reservation pressure must preserve original storage/generation and leave context.returned false; resumed terminal invocation cannot replay. Existing runtime output and cleanup checks remain. | L1 reproduced before134 and after14 cases plus query/core/functions/units/type checks. The ix_ok return guard is reviewed. Query-smoke reaches this after the still-open D1 clone overlap oracle; resource-smoke is insufficient. Physical function-table Memory, duplicate-index and overflow cases remain separate coverage gaps. Keep the fixture; no mechanical rewrite. |
| scaffolding/tests/semantic_source_proof_admission_checks.tower | bff: world/context and a separate finite query ledger live through joins/disposal. Six selectors across widths4/8 and budgets1/4 isolate healthy proof, query/edge/ready-growth Capacity, cancellation and prior Memory receipt. Warm-up uses actual graph capacities; consumer count derives from ready capacity. Scan/proof tickets, exact root offset83 versus prior37, cancelled dependents, repeated request stability and final zero grants are checked. | A1 before query/edge/finish134 and after24 cases/native/address/thread receipts are recorded; prior Memory is injected receipt coverage, not physical ENOMEM. Root-only proof does not establish useful overlap. Ordinary exported main can reuse the production semantic provider once. Durable D1 registration is pending. |
| scaffolding/tests/semantic_aggregate_admission_checks.tower | bff: own world/context/generic owner, Foundation aggregate/callback entities and actual lowering. Four selectors check healthy one-time ABI rewrite, prior failure, cancellation and real lowering failure before ordered signature publication. Parameter/result identity and zero running work survive repeated entry, then world disposal. | A1 before negative cases1 and after16 cases/native/address/thread passed; ordinary control-smoke supplies runtime/comptime callback and canonical/reparse reference. Full semantic imports mean this fixture REPLACES the semantic provider when linked. Four-worker budget with one eligible job is not overlap evidence. Durable D1 registration pending. |
| scaffolding/tests/world_constructor.tower | bff: serial transport guard precedes allocator instrumentation. Bounded world and actual component kind test null owners/Invalid, pinned structural Busy, next physical allocation Memory, measured remaining-byte Capacity, unchanged component counts, same-owner retry and existing payload lookup under a pin. Final buffer/ledger/owner counts return to baseline. | ROOT native exact-result tests and bff combined allocations/query/real-unit instrumentation passed on their documented host. Fault sweep remains serial, and no claim that all type kinds/foreign-owner combinations or payload mutation are covered. Keep existing allocations-runner registration. |
| scaffolding/tests/parser_table_budget.tower | bff/d3: three actual shift/empty-reduction component-page denials plus two prewarmed match cases distinguish component from forest pressure. A separate forest ledger owns descriptor/child/traversal indexes while leaves remain world entities. Actual growth is discovered under bounded128 attempts; output spans, old reservations, capture precedence, attached-node lifetime and final buffer cleanup are checked through Capacity/Memory and retry. Raw wrappers mirror only the existing opaque ABI. | B1 native/reference/parser/address/thread/WASI receipts retain their source identities. The first missing entity_create declaration compile failure and ineffective no-work target are preserved. Initial traversal denial is tested; arbitrary partial-attachment rollback and typed entity_attach error propagation are not established. Current bool attachment fallback remains explicitly open. Existing frontend registration reaches these tests. |
| scaffolding/tests/entity_attach_leases.tower | d3: owns one store and explicit external retains. A stage lease on the old parent must block moving its child; a lease on a replaced named child must block replacement. Parent/order/reference state is checked before discard and final store teardown. Before-only cleanup repairs forbidden mutation/stranded retain while retaining failed assertions. | A2 before four assertions/exit1, after native/scoped sanitizer and serial WASI pass. No actual worker dispatch or universal mutation safety claim. Adjacent replace_child/take_last_child remain separate owner work. Ordinary library fixture, portable serial transport, no extra lifecycle provider. Registration pending. |
| scaffolding/tests/entity_mutation_results.tower | d3: serial physical-fault fixture owns local stores/stages, validates null/foreign/self/overflow, old-parent pin, named reorder/replacement and reference exhaustion. Moving an existing parent hold at maximum counter transfers ownership. Stage creation rejects foreign/peer-private parents; reference queue validates whole input before append, ignores nulls and preserves aliases. A measured successful allocation count bounds each Attach/NamedStage/Queue fault sweep. Payload owning fields publish only after queue admission; idempotent hold precedes finalizers and final-zero checks. | Exact typed outcomes and rollback are supported owner evidence; global fault allocator is explicitly serial. Manual maximum counters/lengths are restored before teardown. Hold exhaustion itself remains unresolved and is not simulated as passed. Uses existing fault-runtime binding, ordinary exported main; registration pending. |
| scaffolding/tests/entity_containment_profile.tower | d3: two local roots and a derived raw node index observe four reverse-order transfers over1024/65536 authoritative entities. Root/slot extents use actual types/counts. Phase excludes creation/check/release while whole-process metrics include them. Final canonical child order, identity, two references and store disposal are checked; retained child arrays/store descriptor are reported separately from raw node ownership. | Linux x64 clock/rusage ABI and serial portable transport are explicit. A2 three-way before/typed-only/tail-check measurements identify quadratic last-child search; no compiler-wide gain is inferred. Four even transfers define the expected original order. Manual profile target only; no timing threshold or implicit default invocation. |

The matching production producer deltas were read to verify fixture contracts:
world component initialization/error forwarding, semantic proof finish/disposal,
aggregate publication guard, interpreter return health, affected-parent leases,
private staged create/reference receipts and budgeted forest storage. This is
consumer/fixture review, not a replacement for those owners' production audits.
No extra authoritative AST, registry, scheduler or alias guarantee is introduced.
Raw staged node payloads remain uncharged; an index ledger is not packed storage.
Documentation-only review changes no executable, so new runtime profiling is
inapplicable. Owner measurements and the next actual D1 coherent checks stay
distinct from adoption and from final public-bootstrap/browser/release acceptance.

### Linux affinity fixture handoff review (2026-11-23)

Complete D2 cbe00ff22d98edcf33c3a92b40e8a1d33d0f71cb and its176MiB receipt
verify against the announced hashes. The real/fault source hashes exactly match
the previously reviewed drafts; the profile guard and process fixture were read
in full. Four new assigned files bring the prospective joined count to537/1126.

| Assigned path | World/storage/scheduling/ownership review and disposition |
| --- | --- |
| scaffolding/tests/work_linux_affinity.tower | Actual libc CPU-count reference checks current-thread capacity, two derived job slots and child-only affinity restriction/restoration. Parent observes its unchanged mask while children wait; stack job/signal/pool owners survive every join, including partial submission cleanup. Fixed128-byte real-test mask is the explicit glibc fixture boundary; production grows beyond it, tested separately. Before1/after0 and restricted/unrestricted scoped sanitizer evidence retained. Register ordinary library object with existing guest runtime and worker-entry export; no overlap claim from capacity alone. |
| scaffolding/tests/work_linux_affinity_faults.tower | Ordinary SOURCE entry initializes the single borrowed stack-state pointer. Three GNU wrappers observe actual production transport and buffer allocation/free; only one heap buffer is live. Sparse high IDs, zero/full/clamped masks,64 seeded libc bit-count references, OS error, growth/physical failure/retry and pool denial check exact results and final zero bytes. Actual412 allocation attempts/544 peak underlying bytes. Bounds derive from native words/type/array. Serial injection is not thread safety evidence; overflow is reviewed rather than forced through enormous allocation. Existing SOURCE/no-bindings helper must explicitly emit object; preserve its actual duplicate-main failure before correction. |
| scaffolding/tests/work_linux_capacity_profile.tower | Reuses shared driver_unsigned_limit for positive capacity/rounds and actual usize bound. Timed loop checks every current-thread answer; pool setup/one dispatched checked result follows timing and drains through defer. Output records measured count and actual slots; no useful-overlap claim. Manual expected-capacity argument is necessary, so no hardcoded host-capacity CTest. Linux clock ABI/host-only profile remains explicit. |
| scaffolding/tests/work_linux_capacity_arguments.tower | Existing Tower process transport executes the actual profile, waits/reaps each child and checks exact status2 for eight invalid strings in each position plus one valid control. Array bounds derive from sizeof; no shell or duplicate parser. Covers signs/space/junk/zero/overflow/decimal input. Owner before accepted +1 fails1; final native plus instrumented parent/17 children per mode pass. Keep manual PROFILE_PATH/ACTUAL_CAPACITY invocation, with no invented universal capacity. |
| scaffolding/tests/work_signal_observe.tower | Existing try/wait signal ownership/oracles unchanged. Coordinated host.memory import resolves the demonstrated new compiler-buffer extern link failure after transport migration. Both modes and actual scoped address/thread runs pass; sanitizer_race_probe was not edited without a demonstrated need. Existing target retained. |

The transport snapshot is not an OS CPU lease and does not resize already-open
pools or model CPU-time quota. Its stack-first native-word probe grows through
compiler_buffer APIs, counts real allowed bits and returns0 on unavailable/error.
No global cache, invented noalias or second scheduler. D2's per-query microcost
improves, but pinned serial compiler wall medians still rise3.2%/2.2%; two useful
metadata workers overlap yet lose to serial in the final measured workload.
All fixed-four tests retain their deliberate oracle and need four allowed CPUs.
D1 original Cancel4 failure remains independent. Current union runtime/release
acceptance is pending; documentation review itself needs no runtime profiling.

The complete d3+cbe history is now adopted as fa15ea45c; exact current roster is
537/537 assigned of1126. D1's new generic targets preserve the Tower fixture
bodies and ordinary provider ownership. Source-proof/aggregate use the existing
compiler composition, with aggregate replacing only the semantic implementation.
The self-contained mutation fixture declares its existing serial transport via
the existing target property; deferred fault-runtime binding honors it, avoiding
a second provider. Other fault targets retain their explicit portable object.

Native evidence at fa15: four public leaves plus both affinity leaves pass,
canonical42-action build passes, manual40 proof/aggregate cases and four standalone
fixtures each pass three processes. Actual missing SOURCE object mode reproduces
duplicate-main/exit1. The explicit object correction produces the same object
bytes as the direct reference and the same412/544/0 fault result. Final registered
targets use existing ordered LLVM symbol bindings for the fault boundaries;
the public native linker has no GNU --wrap support. Five ordinary fixture objects
are byte-identical, all registered runtimes match before output, and14 CTests pass.
Lease/mutation/real-affinity executables also match completely; the two semantic
executables have different object ordering, so no full-image identity is claimed.
D2 independently reviewed the exact four CMake drafts with no source blocker.

The first after build passed12 actions, then an OS comparison script used the
wrong generated mutation-object name and exited2 before its runtimes. Original
logs/script remain; after drain, correcting only that filename yielded a no-work
build and successful checks. Runtime wall/CPU/RSS samples and limitations are in
the journal. Newly joined scoped instrumentation and current full-query/release
gates remain pending; incoming ROOT metadata/child-owner fixtures will require
coherent revalidation. No existing failed Cancel4 oracle was weakened or relabeled.

### Metadata/provenance consumer fixture review (2026-11-23)

Reviewed complete dba1f69970907e0f1f0bb768eaad95209f2de429 after bf093's native
checkpoint drained and exported. Only one assigned Tower path changes; the
joined roster remains537/1126. No D1 build runs during this review.

| Assigned path | Ownership/storage/scheduling review, evidence and disposition |
| --- | --- |
| scaffolding/tests/world_constructor.tower | dba adds118 lines under the existing serial-transport guard. Each trial owns a bounded world, source, destination and trace owner. Parser span/label and provenance expansion+splice intentionally alias the same immutable history through two owning fields. Successful serial/staged allocation counts bound every physical fault position. Invalid null/stage, pinned serial Busy, physical Memory and occupied-ledger staged Capacity preserve exact causes. Success checks scalar metadata, distinct owned label/splice storage, every label byte including terminator, and unchanged shared references until staged hold. Hold precedes closing the source view; discarded destination/source release their exact history retains and all final buffers/grants. Capacity retry is at the denied first component boundary, not permission to retry arbitrary incomplete destinations. Physical failures always discard their destination. ROOT's public leaves/native allocations/query/units and scoped address/thread evidence are recorded; D1 current-union execution remains pending. No actual worker dispatch in this serial fault sweep. Foreign-stage variants, self-copy, already-populated staged destination and hold exhaustion are not newly covered. Existing frontend allocations registration is retained. |

Read the two matching producer files to verify this consumer contract. Results
are private per call, preserving component and staged-reference queue causes;
raw label/splice allocations still return Memory without ledger charging. Serial
copies reject pins/leases; staged copies require a new destination owned by that
stage/world and install owning history only after queue admission succeeds.
Wrappers remain compatible; incomplete destination cleanup belongs to callers.
This is not atomic replacement of existing payloads or complete shared-counter
exhaustion handling. Source review changes no runtime, so profiling the audit is
inapplicable. ROOT's measured costs and L2's older2e3d instrumentation retain
their actual source identities; none accepts the forthcoming D1 joined release.

### Current import policy and sanitizer sensitivity review (2026-11-23)

| Assigned path | Reviewed identity and substantive disposition |
| --- | --- |
| scaffolding/tests/bootstrap_symbols_checks.tower | Complete D2 6159d78a8, exact reviewed patch0058caa6. Adds native/WASI positives and truncated/suffixed/wrong-unit negatives for exactly two ParserNodes forest results and Interpreter's world constructor/strlen. D1 actual fa15 object reports independently confirm those imports and entity providers; both interpreter/evaluation source units import the function-query fixture that requires them. Exact-string matcher and rejection of fault allocator hooks remain unchanged. Tests own only their existing private report/process buffers; no world, scheduler or storage representation changes. D2 old-checker exit1 and corrected native/three fresh WASI/fixture instrumentation evidence remain separately identified. No new assigned path; adopt complete history after current D1 jobs drain. |
| scaffolding/tests/sanitizer_race_probe.tower | Current a0 source unchanged. Deliberately invalid two-worker barrier/counter race; stack jobs/counter live through joins, and pool defers before signal teardown. Current documented fixture+full-runtime link actually fails1 on compiler_buffer_allocation_size/allocate/free after public LLVM/object compilation; it is not a sanitizer result. Adding the existing separately compiled host.memory provider establishes the reference: all three Tower units carry actual TSan access hooks,53/12/49 original functions are instrumented, and exit66 reports T1/T2 racing in work_kernel_execute. The stack symbolizer warning remains in the diagnostic. No ordinary pass/race-freedom claim, no fixture edit yet. Existing docs assign the probe to A2; narrow ROOT handoff for standalone-provider/count cleanup remains pending. Its fixed two-job pool/loop/barrier extents should derive from the actual array when touched, while preserving the intentional race. |

The bounded same-path proof timing control uses the existing fa15 before/after
executables, not recompiled current sources. Warmup plus nine alternating pairs
for healthy/query all pass; query's earlier wall increase is not sustained.
Both binary hashes remain unchanged. This resolves the need for further unchanged
timing reruns, without asserting a speedup or exact neutral cost at .01s resolution.

### Child transfer and bare-store compatibility review (2026-11-23)

Complete ROOT4b4c75ddc95f0de97ab9546320478095f2682cab verified from bundle188337cc,
then adopted after both D1 containers were idle. One new assigned path brings the
full reviewed roster to538/1127. The following four files were read substantively
alongside the actual entity and metadata producers; owner evidence is separate
from D1's forthcoming current-source checks.

| Assigned path | Storage, ownership, scheduling, evidence and disposition |
| --- | --- |
| scaffolding/tests/entity_attach_leases.tower | Adds actual displaced-child/replacement lease regressions. An ordinary store owns the ordered parent edge, stage leases freeze the affected child, and wrapper calls must preserve parent/order/reference state until discard. Cleanup explicitly repairs the old forbidden replacement outcome without hiding the failing assertion. Root's before exit1/two failures and after scoped native/address/thread checks are recorded. Existing normal registration exercises this extension; no new scheduler or concurrent mutation is introduced. |
| scaffolding/tests/entity_mutation_results.tower | Adds exact Invalid/Busy/Exhausted/None child-operation results, parent/old-child/replacement lease cases with array-derived bounds, foreign store, pinned view, named-edge preservation and unchanged failure references. Replacement at maximum reference count denies before mutation; take transfers the existing hold without incrementing it, including the exhausted boundary. Next-allocation denial verifies these operations allocate nothing, then owners/stores/counters return to baseline. Deliberate reference-field injection is single-owner fault coverage, not a legal concurrent operation or thread sanitizer substitute. Existing serial fault registration remains appropriate. |
| scaffolding/tests/world_constructor.tower | Adds bare same-store/no-world clone compatibility: two distinct copied node identities, original-derived copied/child counts, ordered name, correct parent links, no invented compiler components, foreign-store rejection and complete owner disposal. Metadata-free calls remain no-ops only for their actual store; staged world requirements are unchanged. ROOT retained first compile type-conversion failure and actual old-producer abort134 before correction. Existing allocations selector owns the fixture. D2 already routed its duplicated literal name extent5 to ROOT; no competing fixture edit here. |
| scaffolding/tests/entity_child_transfer_profile.tower | New manual observer, not a default CTest. A two-element entity array defines traversal bounds; each round replaces, takes and reattaches both children, checks exact existing-hold transfer, final ordered edge/reference state and empty-store disposal. Raw store/child arrays remain explicit low-level storage. Phase clocks/getrusage use a documented Linux x64 foreign ABI; small1024 and large1048576 rounds are workload parameters. Descriptor plus child-capacity bytes are partial retained storage, not total heap. ROOT's same-path warmup/five alternating pairs, +1.47% large phase wall and unchanged2264B measured retention are retained without a speedup claim. No worker overlap is asserted for this serial operation profile. |

The actual checked producer validates all affected leases before changing links;
replacement alone acquires a new hold, while take transfers the existing one.
A null take with None is an empty parent, distinct from failure. Raw node/label
budgeting and general queued-reference exhaustion remain separate open contracts.
Documentation review itself changes no executable path, so new runtime profiling
is inapplicable. Incoming ownership changes still require the current joined
native and positive sanitizer checks before release acceptance.

ROOT's12:14:55 coordination directive supersedes the pending negative-probe
handoff request: leave the deliberate race fixture unchanged and do not execute
it further in this milestone. The earlier actual provider link failure and
three-unit reference result remain factual historical receipts; they do not
close current standalone negative-control acceptance. Positive ownership and
concurrency instrumentation proceeds independently, with this limitation explicit.

### Prospective capture, queue-alias and late-inspection join review

Reviewed ROOT34aa7526c and its complete successor c9442c6edbc0c3f7398ee3034ebde85bd18512fc
from verified bundles04a924c5/7b28e024, without changing the active ed7 compiler
closure. Prospective roster is539 assigned of1128; current checkout remains538.

| Assigned path | Reviewed identity, substantive conclusion and disposition |
| --- | --- |
| scaffolding/tests/semantic_capture_continuation_checks.tower | New153-line fixture at34aa. One world/context owns actual capture and source-proof producers, with a separate borrowed local budget kept alive through context disposal. Healthy checks a legitimate wait, not completed initializer execution. Take exhausts dispatch; suspend/observe occupy actual edge capacity; finish derives consumer pressure from actual scratch capacity. Exact Invalid/Capacity, phase/declaration offsets, terminal cancellation, no live tickets/workers, repeated-call node/component/task stability and zero final grants are checked across widths4/8 and budgets1/4. These graph-only variants do not prove overlap. Ordinary production semantic provider/exported main and five selectors require no SOURCE/binding or alternate implementation. External registration draft28ffaa75 independently reviewed by D2; runtime/adoption pending. |
| scaffolding/tests/parser_table_budget.tower |34aa adds real forest attachment Busy under a pinned view, Invalid for self attachment and physical Memory after traversal storage is already prepared. Assertions preserve leaf ownership and parent emptiness before retry. Matching parse_tree now stores entity_attach_result's exact cause before transfer; the previous bool fallback gap is addressed by the producer. Serial fault injection remains separate from actual concurrency evidence. Existing frontend parser/default registration reaches these cases; allocations returns through a different fixture and does not cover them. |
| scaffolding/tests/world_constructor.tower |34aa replaces the copied literal name extent5 with strcmp against the actual null-terminated name, preserving the bare-store clone oracle. No competing D1 fixture edit. The prior ed7 native/ASan build still contains the earlier source and is not relabeled as validating this change. |
| scaffolding/tests/entity_mutation_results.tower |c944 adds live reference-queue slice reuse with and without growth. Array-derived pairs and actual queue capacity bound setup; spare/partially live slices are rejected before reads, and growth denial preserves data/length/capacity. Success installs owning payload fields only after admission; every queued pointer/order is checked before two idempotent holds, discard and exact reference/buffer baseline restoration. Successful measured allocation calls bound the physical fault sweep. Matching producer keeps a live-slice index across vector reserve, rebinds after growth and rejects unaligned/spare input. No extra allocation or noalias promise; raw external pointer validity remains a caller contract. Existing serial mutation registration suffices. |
| scaffolding/tests/generic_inspection_budget.tower |c944 keeps a successfully parsed/checked document alive before occupying its remaining budget and calling the actual new single-owner inspection phase. Exact Capacity and source-derived expression offset, null result after failure, no live workers/tickets, and no replay after diagnostics are cleared are asserted. World node/component counts guard against hidden second work. Context/document lifetime encloses the pressure grant and cleanup. The legacy world binder charges selected scratch rather than physical pages, explicitly retained as a limitation. Existing LR editor selector owns this fixture; no speculative import-policy permission or new scheduler is needed. |

Primary sources were revisited during this review: Flecs systems distinguish
structural staging from writes to existing component values; component traits
separate stable sparse addresses from table traversal/fragmentation; Burst's
aliasing example demonstrates that a disjointness assumption changes results
when ranges overlap. These principles support the lease and live-slice checks,
not any unmeasured storage/vectorization gain. Raw Foundation ownership remains
explicit: acyclic ownership is an existing caller precondition, not a newly
claimed checked hierarchy policy. Documentation review itself has no executable
performance path. Current merged runtime and release acceptance remains pending.

The ed7 positive execution receipt now contains55 native processes and54 ASan
processes with real stage/component concurrency and exact checked outputs. Full
ASan units first timed out at300s; supported user-space sampling identified LR
construction/sanitizer stack cost, and the unchanged binary completed a bounded
UID1000 followup in440.23s. Original timeout, UID difference and sampling overhead
remain explicit. The final separate allocation sweep passes under UID0/serial
transport. Actual43 linked objects/instrumented IR and20 required access-hook
checks are retained. This supports the ed7 scope only: prospective c944 fixtures
and current thread/whole-release acceptance are still pending. No race probe was
changed or re-executed after ROOT's directive.

After actual12:53:23 job drain and host-slot release, full D294bc and ROOTc944
histories are adopted as f41b7ef546c526cc2aecae3b22b8fd8a1be970ff. The reviewed
roster is now539/539 of1128. Two README conflicts moved existing paragraphs;
resolution preserves all content and equals ROOT's complete README. Production
and build inputs match c944 exactly. The ed7 receipt remains separately scoped.
The capture registration is still only an independently reviewed external draft:
its direct public-leaf/manual-link baseline must run before the CMake edit.

### Prospective exact Wasm Entities table policy review

D2 draft00682b68124d4d5fd2becf32b76ee62201b6006de88e8d60cfd7465ef091ba5b
changes the already assigned bootstrap_symbols_checks.tower at c801's source.
Read the actual nm/readobj reports for object307d9371, the narrow tool predicate
and existing WorkBudget enter/leave callers. The object declares an undefined
TABLE __indirect_function_table and real table-number relocations; reserve/release
contain the typed gate calls. The new exact Wasm Entities permission is a target
ABI table dependency, not permission for an external implementation.

The fixture adds two Wasm policy positives and six negatives: both native modes,
wrong unit, truncated/suffixed spelling and table_base. Full-string matching and
existing underscore normalization are unchanged; no native/table_base/inspection
provider permission is added. Actual artifact evidence is32-bit; wasm64 is policy
coverage only. Source review finds no blocker. D2 owns before/after and supported
instrumentation plus unfinished package checks; no D1 runtime/adoption claim is
made from this draft. No world/storage/scheduler or test-buffer ownership changes.

### Complete executable, LR and interpreter-map join review

Reviewed complete ROOT2252b88911802ef3db2e96750d9195d09c6c1f90 (verified bundle
3ae22ed0, sole60741 prerequisite), relative to adopted c944. Nine assigned test
paths change; the executable fixture is new. Production changes remain with
ROOT/B1/L1. Existing ordinary providers and public predecessor suffice; no syntax,
second scheduler, alternate graph or fixture-policy rewrite is proposed by D1.

| Assigned path | Substantive review at2252, evidence and disposition |
| --- | --- |
| scaffolding/tests/execution_suite.tower | Adds budgeted guest heap trials at both target widths. Actual map capacities and a real growth probe determine admission pressure, including successful first-map growth followed by second-map denial. Null guest allocation/reallocation must preserve live byte patterns, logical cursor and entries; admitted private capacity may remain owned. Free/coalescing under exhausted budget performs no metadata allocation, reuse preserves addresses, and world/session teardown releases grants. The original100 blocks remain fixture data while bounds derive from the array. Raw Foundation allocation semantics are retained. Existing core selector; incoming owner native/address/thread evidence, merged D1 execution pending. |
| scaffolding/tests/interpreter_call_query.tower | Counts reservations for all six maps and every actual frame; real graph execution locates sequencing, local-address, returned-value and string failure boundaries. Exact preceding output, Capacity at91, nonreturn, terminal no-replay and final grants are checked. A successful real probe derives unrelated cache capacity before pressure; no fabricated entries or guessed map size. Existing runtime/staged case matrices use typed array lengths. Invocation/frame ownership stays explicit. Existing functions/query callers, graph-only pressure cases do not establish overlap. |
| scaffolding/tests/interpreter_storage.tower | Six ordinary Tower setter wrappers keep the before/after oracle compatible with the changed bool ABI. Trials check failed-growth pointer/length/capacity/reservation identity, sorted existing entries, exact compiler-buffer charges, allocation-free existing-key updates, retry and sticky first cause. Each state/frame owns its work_vector; cleanup is idempotent with zero baseline grants. Serial fault transport remains separate from concurrency validation. |
| scaffolding/tests/lr_analysis_api.tower | Declares exact WorkBudgetError constructor/compute/propagation/state/LALR result APIs while preserving existing pointer/bool wrappers. This fixture ABI adds no storage or scheduling authority. Consumers below exercise exact causes instead of collapsing them into Memory. |
| scaffolding/tests/lr_analysis_failures.tower | Array-derived counts, missing arrays, overflow/slices, invalid owners and valid empty productions cover constructor boundaries. FIRST ignores an invalid reference after an untaken terminal; LR closure subsequently reaching it reports Invalid. Actual physical denials distinguish Memory and support same-object retries; propagation endpoint/seed/self-cycle cases retain the independent fixed-point oracle. Final buffer baseline is checked; serial physical faults are not threaded allocator instrumentation. |
| scaffolding/tests/lr_budget.tower | Measures actual pool storage with the shared worker capacity and denies one byte short, checks exact Capacity and no stranded grants, then retries. Retained world-owned pool storage is warmed and charged separately from temporary parser work. Shared outer reservation survives world disposal until its own release; final world/pool grant baselines avoid double disposal. No assumed slot size or total-process memory claim. |
| scaffolding/tests/lr_work.tower | Uses actual remaining-budget pressure and typed worker causes across FIRST/state/LALR. Busy lease and Capacity paths preserve cleanup and permit retry; serial/threaded canonical results remain compared. Large grammar extents, nonterminal boundary and wide-state count derive from actual arrays. Requested lane count alone is not overlap evidence; owning graph quiescence and stable world lifetime remain prerequisites. |
| scaffolding/tests/semantic_executable_admission_checks.tower | New238-line fixture imports production semantic services itself, requiring exactly one provider in its generic target. Eight selectors across widths4/8 and budgets1/4 cover healthy, request/edge/access, take/partial-take, observe and finish. Real body/lowering producers precede pressure; actual task/edge/access/scratch capacity sets denial. Exact subject17/root83 causes, unpublished ready input, discarded partial stages, cancelled consumers without dispatch, repeated terminal counts/receipts and zero final grants are asserted. Producer now admits graph/access before metadata and finishes before publishing readiness. Graph-only budget variants do not prove concurrency. Dedicated generic registration and matched direct baseline pending. |
| scaffolding/tests/semantic_resource_checks.tower | Steps the ordinary invocation to its actual queued nested KCall before pressure, preparing unrelated sequencing work without consuming the intended8KiB frame. Retains the16KiB shared budget, exact stack-growth message/offset, both peers, effect order and cleanup. No cap enlargement or alternative error oracle. Extra observed diagnostics appear only on unexpected failure. Existing24 resource cases and query caller retained. |

The IMState/IMFrame layouts change: all consumers must rebuild through actual
depfiles. L1's preserved stale-layout139 and subsequent coherent passes explain
why a no-work build cannot establish this ABI closure. Sorted maps are contiguous
work_vectors, owned by the invocation/frame, not additional semantic IR. Heap
admission reserves tracking and future free intervals before guest mutation;
partial admission retains owned capacity without committing guest ranges.

ROOT's executable32/capture20, matched32-process profile and supported156-case
per-mode receipts cover its2c454 source, not the combined2252. L1 reports real
outer peak4 and source-specific address/thread checks; its large graph and serial
unit costs remain explicit. B1 reports exact LR causes, retained pool/graph budget,
independent parser and public WASI checks at68fa. None establishes this new union
or final publication. D1 will validate the merged providers and both registrations
at the next owned slot. The stopped negative probe remains unchanged/unexecuted.

D2 independently identified the parser-table audit selector error above: parser
(or default) reaches parser_failure_tests; allocations returns earlier. Corrected
the statement, preserving earlier receipts and not adding an unnecessary matrix.
Documentation review itself has no runtime performance delta.

### Durable capture/executable registration on the complete2252 union

Complete D28cb and ROOT2252 histories merge cleanly as2ff9c7ff7. Current roster
is540/540 assigned of1129, with only the executable fixture newly added. D2's
reviewed exact Wasm Entities policy is adopted; it changes no compiler layout.
D1 changes only cmake/TowerWorkPolicyTests.cmake and the test README: five ordinary
capture-continuation cases and eight executable cases. Executable shares the
existing aggregate provider composition, excluding only the implementation it
already imports and retaining frontend/query providers. D2 independently reviews
exact wholefile832d3ea4 against both fixtures and finds no blocker.

Both public9653 leaves compile first, then20 native actions rebuild the current
IM layout consumers. The first OS wrapper fails1 before runtime because it
incorrectly expects public sem_executables_pump; actual nm identifies exactly one
private tower.fn.sem_executables_pump. Preserve the original failure, drain, and
correct the OS observation only. Continuation62959 passes39 direct processes;
registered29295 passes39 matching processes plus all13 CTests. Both leaf objects
are byte-identical, all provider hashes unchanged, outputs/errors identical and
source freezes verified. No compiler or fixture assertion is changed.

All selector samples retain GNU wall/CPU/RSS, hashes and allocation/grant cleanup
oracles. At the same installed executable paths, n3 fresh-process warm-filesystem
medians for capture healthy are .02/.02/50288 before and .03/.03/50504 after
(seconds wall/CPU, KiB RSS); executable healthy .03/.02/50688 -> .03/.03/50744;
partial take .02/.02/50716 -> .02/.01/50756. These tiny quantized runs do not show
a causal speedup or neutrality. They validate generic registration without added
storage. Each selector checks widths4/8 and budgets1/4; these are graph-pressure
cases, not real overlap measurements. Current real overlap/instrumentation is the
next separate frozen milestone. Host SteamDeck Linux x64, Docker/LLVM19.1.1,
Release/public pin, builds and these graph checks CPU0,2/jobs1. Logs retain all
39 samples per side, not only these representative rows.

The current compiler is2219891064b1d0bd8a95790e477b4baf0bebc13dcaf49eb7ed56b27b4ae96d1a
with50 complete resources. Two fixture providers are registered through existing
Tower object/build tools; no new test language, scheduler, native seed or adapter.
D1 releases its lock only after both containers are init-only, allowing D2's
short actual ParserNodes policy gate before the new instrumentation freeze.
Standalone negative-control, old restricted-host overlap, current broad native,
clean bootstrap/browser/generation and leased hosted publication remain open.

### Exact ParserNodes attachment policy review

D2 draft227bf39a7d1dc6b97cabbc245ddc5917f38ee92107fdbc8e399bc47f1e57a9b7
extends assigned bootstrap_symbols_checks.tower at2252+8cb. D1's rebuilt native
ParserNodes9928d135 has U entity_attach_result and Entitiese62f8520 has its T
provider. D2's fresh public WASI report has the same import. Reviewed the actual
lr_work_node_result caller: it retains the producer's exact error and releases
the created node on failure before returning null. This is a real cross-unit
producer dependency, unlike the prior Entities Wasm table ABI allowance.

Eight fixture cases accompany one exact ParserNodes permission: Linux/Windows/
WASI policy positives and truncation, suffix and three wrong-unit negatives.
Existing full-token normalization/matching is unchanged; no general entity_ or
result suffix permission. Windows is policy coverage, not runtime evidence.
No new ownership, storage or scheduling layer is added. D1 source review finds
no blocker; D2 owns the matched observed-report and supported instrumentation
receipt. Adoption is pending the complete history; no independent runtime pass
is inferred from reading the draft. Documentation-only review has no runtime
performance delta and does not require repeating unaffected policy matrices.

Current2f7 native boundary:92 positive processes pass before type-smoke times out
124 at300.02s with329.17CPU/235400KiB, no output/diagnostic/swaps. Prior180s timeout
and later211.11s full42 success have different frozen identities; none diagnoses
this run's cause. The current low-level interpreter_storage.tower fixture belongs
to parser-main --host-only, not tower-storage-tests. That current D1 run is still
pending; owner L1's source-specific evidence is retained separately.

ROOT's acceleration directive now defers all queued broad/current sanitizer
campaigns to stable integration, leaves the cosmetic profile-bound proposal
unapplied, and avoids repeated archives/duplicate leaf compilations. The92
completed results remain valid; deferred or timed-out gates do not become passes.
Current fixtures/production source are unchanged. Both jobs drained and own host
lock released13:43:59. The standalone negative probe remains unchanged/unexecuted.

### Bounded grammar/generic result review at b0421447

Reviewed every line of the two paths below at
`b04214474ac14588abffea1c6c27b2a0b2ebb2ed`. Both fixtures, their named producers
and the registration chain below are unchanged in the integrated D1 tree
`c3eb1b4997c7580bd75fad9b31384b7b6c15f8c3`. This is independent source review,
not a new execution receipt. No fixture regression requiring correction was found.

| Assigned path | Substantive findings and disposition |
| --- | --- |
| scaffolding/tests/grammar_builder_results.tower | All166 lines reviewed. Uses production GrammarBuilder/regex/string result APIs and explicitly owned one-lane worlds/kinds. Init failure is deliberately consumed through the sticky finish result; successful finish transfers the root, failure releases the partial tree. The test warms storage, measures actual allocation calls, sweeps denied prefixes, releases returned roots and checks node/component/buffer baselines. Busy is exercised with a real pinned root; null names/kinds and an unregistered kind exercise Invalid and first-cause retention. A separately budget-bound world reserves its actual remaining allowance, checks exact Capacity and the surviving pressure grant, then releases pressure and retries before world/budget disposal. UTF8 cases distinguish malformed/count-overflow Invalid from allocation failure, check logical rollback and a valid scalar. Array extents derive from sizeof; scalar233 and range97..122 are fixture data. Preserve without edits. |
| scaffolding/tests/generic_result_storage.tower | All243 lines reviewed. Four ordinary production operations (begin/register/eager/deferred instantiate) each use a fresh bounded world owned by GenericCloneFixture; argument/definition/root share its store. Width/depth2/2 describe fixture shape. Allocation counts and actual remaining budget determine fault sweeps/pressure; instantiate paths leave the measured CloneFrame allocation allowance. Failed operations require unchanged node/component/root-child counts, then clear the retained generic diagnostic and retry. Registration checks the actual type parameter; eager/deferred instances check body readiness and child count. A repeated specialization must return identical cached identity without allocation or another root child. Invalid ownership/arguments, pinned Busy and ID Exhausted are distinguished; Register deliberately omits exhaustion because attaching its component need not create an entity. Lifecycle cases measure actual context/registry ID demand, force each begin boundary through semantic_compile_budget at target widths4/8, and preserve an earlier Capacity receipt/offset over later Exhausted. Roots/programs retire before restoring IDs; world disposal precedes budget disposal and zero-grant/buffer assertions. Preserve without edits. |

Producer and caller review:

- `grammar_builder.tower` retains the first error, uses typed entity/component/
  attachment results, and consumes the builder root at finish. Ordered children
  and named captures remain the existing grammar entities. `regex_grammar.tower`
  uses this same builder and finalizer, including its ASCII-array bounds.
  `parser_nodes.tower::node_string_append_result` rejects count overflow before
  reserving, but reserves before decoding: malformed UTF8 rolls back logical
  length, not necessarily capacity or bytes outside the live prefix. Raw string
  vectors are not claimed fully charged to the world's physical ledger.
- `generic_registry.tower::generic_begin_result` prepares registry/type ownership
  before publishing the root context component. `generics.tower` validates store
  and admission state, attaches a completed instance before linking it into the
  context, and releases unpublished clones on failure. The specialization cache
  is a derived identity index over world-owned components, not another AST or
  global type registry. CloneStack uses the owning world budget; deferred bodies
  retain their source through the existing instance contract.
  `generic_clone_fixture.tower` explicitly takes ownership of the supplied world.
  `semantic_lifecycle.tower` disposes its context on early generic-begin failure;
  `semantic_context.tower::sem_resource_record` preserves the first cause/offset.
- `parser_failures.tower::parser_failure_tests` calls the grammar fixture. The
  `frontend_main.tower` default and `parser` selector reach it; `allocations`
  returns earlier. `cmake/TowerFrontendFocused.cmake` already registers the
  default `tower-frontend` CTest with the instrumented allocator provider.
  `generic_clone_storage.tower::generic_clone_storage_tests` calls the generic
  fixture; `storage_main.tower` default reaches it and explicitly requires the
  single-owner transport. Its `runtime-faults` selector returns earlier.
  `cmake/TowerStorageTests.cmake` already registers default `tower-storage`.
  Neither fixture needs another generic harness registration.

Coverage limits: these are serial allocation/admission/retirement oracles, not
parallel scheduling, cancellation, stale-ticket, alias/frame-capture or canonical
serial/parallel equivalence tests. Only the generic lifecycle subcases explicitly
vary target width. Neither fixture executes staged type bodies or proves branch
dependency/cycle behavior. Stable entity/component payloads and ordered links
are exercised; contiguous string/clone scratch does not demonstrate packed ECS
payloads, locality, fragmentation or useful overlap. The grammar fixture does not
compare full grammar contents/order or canonical round trips; malformed UTF8
rollback is not tested after a pre-existing live prefix. The generic failure
oracle does not assert context.copied/first/count: the producer charges attempted
clone work before a possible late failure, so cumulative-work policy needs its
own oracle before treating that counter as rollback state. These are explicit
coverage boundaries, not established regressions or reasons to rewrite fixtures.

Direct Git census, using tracked `.tower` paths and the existing D1 prefixes
`scaffolding/tests`, `scaffolding/examples`, `editors/tower/tests` and
`playground/tests/fixtures`:

| Tree | D1 assigned paths | All tracked Tower paths |
| --- | ---: | ---: |
| Prior current_executable_d1 roster | 540 | 1129 |
| ROOT b0421447 | 542 | 1131 |
| Integrated c3eb1b499 | 543 | 1132 |
| Final integration ab7dfe7fe | 543 | 1132 |

The exact additions to the prior direct roster are the two reviewed paths and,
only after b042, `scaffolding/tests/semantic_flow_checks.tower`. Thus542 of the
current543 assigned paths have D1 substantive receipts at their recorded review
identities; the flow fixture remains outside this bounded review. This does not
upgrade older receipts to current-source acceptance: post-b042 upstream also
changes execution_type_construction, execution_world and interpreter_call_query.
A2 owns cross-repository roster reconciliation; no roster is edited here.

The portable stale revision/profile test in `work_order.tower` remains identical
to committed `be0d123bb`; its focused native evidence is preserved without rerun.
Checks here are tree/set reconciliation, producer/caller inspection, unchanged
reviewed input comparison and `git diff --check`. Documentation changes no runtime
input, so runtime profiling/builds/tests are inapplicable to this edit. Integrated
instrumentation, bootstrap/browser/generation and deployment remain ROOT's
pending milestone; no old receipt is relabeled as merged runtime validation.

Final pull brought complete upstream afca69b17; ff-only again refused divergent
history, and the conflict-free merge is `ab7dfe7fe874717afd9e63511ca643cb7a7d5758`.
The grammar fixture, builder/regex producers, four generic result producers and
both registration chains remain unchanged. ParserNodes adds a typed label setter;
its reviewed counted UTF8 append is unchanged. The census and portable stale-ticket
fixture are unchanged. Other upstream edits are preserved, not authored here.

L2's1525e54ff expands `generic_result_storage.tower` to400 lines. Reviewed its
entire delta against the corresponding semantic_context/lifecycle/frontend guards
and existing `world.tower::compiler_world_component_result`. New create trials
measure allocation calls, require failed private children to retire, retry, and
reject missing owners. Attachment trials distinguish physical Capacity from
pinned structural Busy, preserve existing payload fields on an admitted write,
and retain distinct explicit custom components. A lifetime pin does not establish
exclusive payload access; this remains a single-owner test. New root-init cases
cover widths4/8, actual allocation prefixes and Capacity/Busy/Exhausted, requiring
no function-index entry on failure and complete world/budget cleanup. They invoke
both compiler entry points after failure and assert no allocation, replay or
first-cause overwrite. The original lifecycle prior-failure case now correctly
expects unchanged ID/allocation counters: semantic_compile_budget returns before
context creation, rather than reaching a second failure. Its healthy ID-boundary
oracle remains. These additions are reached by the same default storage caller;
no D1 fixture/harness change is needed. This merged source review finds no blocker;
L2's recorded runtime checks retain their own identities and were not rerun here.

### Dependency-unit integration coverage (base53d631572)

The existing `frontend_units.tower::units_trial` checks three exclusive worlds,
forward ordinary `comptime` helpers, `decltype`/generic types, known42–44 and
serial/worker canonical bytes; `units_failure` checks earliest unit selection.
`body_runs.tower::body_runs_trial_output` executes the ordinary program entry and
compares canonical output within one unit, with continuation/error-order cases.
`evaluation_query_checks.tower` tests executed stage demand, unused producers,
exactly-once preparation, body/declaration handoff and cycle diagnosis only at
quiescence. `decltype_lazy_body.tower` leaves an invalid generic body dormant.
These are complementary existing cases, not a new runtime receipt. None of these
source cases combines imported ordinary helpers, a forward staged read and an
untaken potential cycle across multiple concurrently compiling units.

| Path | Reviewed delta, ownership and disposition |
| --- | --- |
| scaffolding/tests/compiler_dependency_units.tower | New combined fixture uses the existing bounded unit API and four world-private imported-file snapshots configured before dispatch. Ordinary helper calls compute a type and known values; imported generic decltype leaves an invalid body dormant, and root bodies demand a later local helper. Independent expected answers42–45 use the existing interpreter. Untaken imported self-dependency must compile; taking it in unit2 must select that cycle before unit3's missing-name error. Serial/4-worker canonical Foundation bytes and complete selected diagnostic/offset are compared. Observer slots are ordinal-private and read only after join; timestamp intersection on distinct threads asserts actual overlap without inserting a barrier. Batch closure precedes observer/source destruction. Array extents derive from data; 4worker/2GiB limits are explicit test policies. No compiler graph, scheduler, parser or interpreter is duplicated. |
| scaffolding/tests/lr_work_main.tower | Imports the fixture and adds focused dependency-units selection, also reached by existing units/all callers. Existing CTest tower-native-units therefore owns durable registration without a new manifest/target. Requires four available native lanes and reports failure rather than silently treating unsupported overlap as passed. |

The batch exercises dependency execution inside each unit and overlapping units;
it does not establish simultaneous nested body work while all outer lanes are
occupied, shared semantic entities across units, comprehensive cancellation or
race freedom. Virtual imported files use the production module source API; this
is not filesystem watcher/invalidation coverage. B2's production unit/refill
implementation is untouched. Runtime/compiler behavior is unchanged by this
regression; measured fixture cost is acceptance overhead, not a compiler speedup.
Focused execution/build receipt follows in the journal. Broad instruments,
bootstrap/browser/generation and hosted validation remain ROOT-owned and pending.

The focused53d631572+D1 run passes known answers, canonical/diagnostic comparisons
and observed four-thread/peak4 overlap, with a serial peak1 control. Whole process
22.64wall/36.80CPU/729004KiB; query-smoke .37s/71588KiB also passes. Source hashes
verify. The journal preserves fixture compile corrections and exact scope; no
old native/type timeout or deferred instrument gate is relabeled as passed.

Final source484c05eff integrates newer parser diagnostics and lifecycle/layout/
lowering. The affected9-action rebuild and both focused cases pass again:
dependency-units20.70wall/34.69CPU/772796KiB, query-smoke .30s/71800KiB, zero swaps.
Success still observes four distinct threads/peak4, and the true-cycle variant
keeps exact error bytes/offset/order. Identical logical import names with different
private snapshots exercise environment isolation. Frozen source checks pass;
fixture commit65ff524 adds no production code. Final broad/platform/release gates
remain explicitly outside this bounded acceptance batch.

Push-race integration fae0dfa adds B2's WorkBudget/WorkPool wake layout and checked
executable admission. Both test selectors survive the caller merge. All24 affected
build actions and the same focused dependency/query checks pass on that ABI;
unit-admission also passes after the selector conflict. New fixture case counts
now derive from the actual bool input array. Final dependency cost24.02wall/
38.11CPU/870988KiB, zero swaps; actual four-thread/peak4 overlap and exact output/
error parity remain checked. Source manifest verifies; this is bounded acceptance,
not complete scheduler/race/release coverage or an attributed performance change.

Final retry source62aa28e includes checked queued stages and constructor/evaluation
admission. Unchanged D1 fixture/caller pass after the15-action affected rebuild:
dependency-units20.49wall/34.65CPU/810140KiB, query-smoke .22s, unit-admission13.59s.
All source hashes verify, stderr is empty, and zero swaps are recorded. Exact
answers/canonical/errors and actual four-thread/peak4 overlap remain checked.

Last allowed retry source84b7719 integrates the executed-stage frontier and Fast
storage changes. Seven affected actions and the same three focused gates pass;
dependency-units20.90wall/35.28CPU/788128KiB, zero swaps. Known answers, canonical/
diagnostic parity and observed four-thread/peak4 overlap remain checked. Source
hashes match; no broader Fast/platform/race acceptance is inferred.

### Current fixture adoption at published 5b05d6bb (2026-11-23)

Frozen source: `5b05d6bb5288591794d378c1802c2a790357b204`. ROOT has integrated
the entire preserved dependency batch and reports independent dependency-units,
query-smoke, unit-admission and structural-reuse validation on this union. The
earlier fetch-first blocker is resolved. Those are ROOT's execution receipts;
this batch performs source/caller and Git identity checks, with no runtime rerun.

The last complete direct census at `2ff9c7ff7` was 540/1129. The current census is
**550 D1 paths / 1144 tracked Tower paths**. D1 has ten additions, 22 modified
paths and no retirements since that review; the other 518 current D1 files retain
their unchanged source reviews. All 32 delta paths are accounted for below.
The eight new files after b042, and the current generic-result file, were read
completely. Earlier complete reviews plus all intervening changes supply the
remaining rows; unchanged fixture bodies are not mechanically rereviewed or
rewritten. Every row here binds to the frozen revision above.

| Path under scaffolding/tests/ | Current substantive finding and disposition |
| --- | --- |
| `semantic_flow_checks.tower` | Thirteen modes use actual world-owned functions, evaluation dependencies and a separate graph ledger at budgets1/4. Reversed readiness cannot select a later error; ordinary Waiting does not diagnose cycles, while the quiescent wrapper checks the exact17→41→17 path. Query/access/edge/finish denial, exhausted tickets, cancellation, repeated terminal calls and teardown are checked. Preserve; Ready dispatch counts alone do not demonstrate overlap, and component/view/vector allocation assertions in the producer are outside this fault oracle. |
| `semantic_lifecycle_frontier_checks.tower` | Five modes at1/4 use function-owned probe components and production lowering. A signal rendezvous establishes simultaneous signature and independent expression kernels; aggregate lowering must consume the published replacement body. KnownSnapshot/body gates, signature-error priority, partial admission, no premature callback ABI publication and final joins are checked. Signals outlive joins and components outlive context disposal. Preserve; forced rendezvous proves concurrency, not profitable natural scaling. |
| `semantic_staging_frontier_checks.tower` | Four modes plus a naturally ready backlog at1/4 use canonical Foundation and the ordinary interpreter. A local increment survives a nested producer wait exactly once; an untaken divide-by-zero producer is neither demanded nor started. Owner lowering gates explicit stages; inferred execution waits for the whole lowering join. Private stage errors remain hidden until lowering error priority settles. Repeated waits check frame/memory/step identity; terminal calls drain tickets. Preserve; alternating joined phases do not establish simultaneous lowering/evaluation kernels. |
| `parser_diagnostic_budget.tower` | Derives descriptor/probe/label/context allocation sweeps and footprint-minus-one pressure from an actual missing-suffix parse. Checks exact positions/options, first Capacity/Memory, retry without consuming the stream, returned lookahead text ownership and failed self-aliased replacement. A detached diagnostic remains usable after request/table/world destruction and retains its budget until destruction. Preserve; serial allocator instrumentation is not threaded sanitization. |
| `frontend_iteration_profile.tower` | Single-world synchronous observer records separate grammar phases without a compiler clock. Cold/installed paths compile the same source, independently interpret42 and report canonical hash/length, then retire observer and world. Counts derive from GrammarPhase and vectors. Preserve as an opt-in Linux timing fixture: it does not itself compare modes' canonical bytes or claim useful overlap. |
| `execution_fast_storage.tower` | Both target widths compare graph/Fast output7,6,8,78,65,true,9; added unreachable canonical labels exercise cache ownership without changing output. Exact physical descriptor/array owner sums exclude the graph scratch retired at admission. Measured generation positions drive Exhausted sweeps; actual frame/register growth denial follows argument effects and must skip callee effects/replay. Normal, suspended-close and failure teardown restore the world ledger. Preserve; generation exhaustion is not a physical allocator-failure sweep, and runtime guest-memory/output/package owners remain separate. |
| `parser_structure_reuse.tower` | Exact LR structure reuse must succeed under zero remaining capacity while keeping capture names/userdata private. Cache fork/original-table retirement, parsing with the new capture, pre-step cancellation/retry, changed terminal/mode/specialization/precedence, unresolved rule and Bedrock/world scope changes have concrete oracles. Final structure pins release all grants. Preserve; cache eviction, reference-count exhaustion and concurrent cache writers are not tested. |
| `compiler_dependency_units.tower` | Byte-identical to the preserved `e7b388b` fixture. Four private imported snapshots combine ordinary type/value helpers, forward local producers and dormant generic decltype bodies; known answers42–45, exact canonical bytes, ordinal2 cycle before ordinal3 missing-name error and complete error/offset parity remain asserted. Success requires actual four distinct threads and overlapping intervals, with serial peak1 control. Batch close precedes input/observer destruction. Preserve earlier native evidence; no shared semantic world or filesystem-invalidation claim. |
| `generic_result_storage.tower` | All756 current lines reviewed, superseding the earlier243/400-line receipts. In addition to registry/clone/root admission, real layout discovery must suspend and publish one canonical size; known-source/capture admission and joined immutable-fact publication distinguish exact failures and cannot publish captured values early. Constructor ownership retains the declaration/frame; evaluation kind pairs and prepare/clone frontiers publish only complete metadata. Widths4/8, actual allocation counts/page slots/remaining bytes, first-cause offsets and zero cleanup drive the oracle. Constructor lexical scratch is explicitly excluded from a complete Memory sweep; Begin under page pressure legitimately succeeds when only kinds are required. Preserve those limits. |
| `grammar_builder_results.tower` | Unchanged from the full b042 review above: typed first-cause builder admission, root consumption, exact pressure/retry and malformed UTF8 logical rollback. Current parser-failure caller still reaches it. Preserve; no canonical grammar roundtrip or full malformed-prefix coverage is added. |
| `backend_units.tower` | New admission fixture reserves a real nested lane, waits under the budget gate for outer Capacity, then requires the released lane to start another ready unit before its parent ends. Private worlds and three actual sources retain canonical serial/two-worker equality. Cancellation drains and hides results; grants are zero before deferred signal/pool/batch cleanup. Preserve; the nested probe intentionally synchronizes admission and is not a throughput benchmark. |
| `bootstrap_symbols_checks.tower` | New exact provider spellings cover grammar/generic/diagnostic/module/structural APIs, with truncation, suffix and wrong-unit negatives. Target-name variants check allowlist policy, not target execution. ParserNodes' world-constructor permission now reflects the observed module fixture closure. Preserve; whole policy source freshness remains D2's separate roster action. |
| `entity_stage_concurrent.tower` | Reference payloads now register cancellation before installing borrowed targets. Callback clears unheld fields so finalizers cannot release ownership never acquired; existing real-worker barriers, joins and failed-peer cleanup remain. Preserve; the callback itself supplies no synchronization. |
| `entity_stage_result.tower` | Added checked leases reject invalid/foreign/pinned/reclaiming/competing inputs without partial storage. Cumulative/aliased hold exhaustion rolls back a zero-count pinned input, preserves held prefixes, retries idempotently and cancels only unheld borrows. Combined component-type/queued ownership and exact finalizer counts are checked. Default runs new hold cases; optional argument deliberately retains the old cost workload. |
| `entity_stage_result_faults.tower` | Lease allocation sweep derives actual successful calls, requires no published lease or leaked buffer on denial, then retries and checks allocation-free repeated admission. Existing publish sweep follows. Preserve the serial instrumentation boundary. |
| `execution_main.tower` | Imports Fast storage and reaches it from all/core, before existing core execution. It does not add the heavy fixture to core-static, functions or constructor selectors. Preserve this exact registration scope. |
| `execution_type_construction.tower` | Counted constructor failure fills the actual allocated extent without a terminator, preserves producer pointer/capacity/bytes and continuation offset, and forbids operand-effect replay. Fast whole-cache admission now correctly precedes the narrower type-storage denial. Preserve both-width cases and named continuation phase contract. |
| `execution_world.tower` | Normalized source descriptors are private; capacity/foreign-world/root Busy or Invalid failures stop before frontend effects and remain terminal. Counted source buffers can be overwritten/freed after compilation because frontend owns copies; NUL preflight leaves an unbound environment unchanged. Graph/Fast worlds and widths remain independent. Preserve. |
| `frontend_main.tower` | Adds focused structure-reuse, grammar-equivalence, iteration and diagnostics selectors. Default still reaches parser failures/regex; structure reuse and iteration return only from their explicit selectors. This is a registration distinction, not evidence of default execution. |
| `frontend_modules.tower` | Checked startup snapshots a real active graph, parser lease, cached imports and source pointers before exact capacity denial. Bound, unbound and private environments must remain unchanged/retire private owners; retry reuses the preserved parser. A one-byte total unit ledger is Invalid, distinct from remaining Capacity. Default module tests reach the new case. |
| `frontend_units_profile.tower` | Private phase/ordinal slots now cover frontend/backend spans, variable body prefixes and actual host worker capacity. Checks42 through the interpreter and object exports/envelope, then reports canonical/object hashes, shared peaks, refill gaps and an explicitly qualified upper bound on vacant outer capacity. Equal-unit control asserts overlap; spread workloads only measure it. Preserve; hashed output is not an internal serial/parallel byte comparison or proof of avoidable idle time. |
| `generic_clone_fixture.tower` | New world-taking entry transfers ownership of an already budget-bound world into the same fixture; existing open delegates after construction/binding. Close remains the sole world disposer. Preserve; copying the fixture would not clone ownership. |
| `generic_clone_storage.tower` | Adds exact Busy/Exhausted/Invalid public-clone admission and physically bounded component-page denial after reserving actual clone-frame bytes. Holds stage references before closing the view, discards failed private bodies, then retries through a fresh stage. Default storage calls the expanded generic-result fixture. Preserve; existing narrow failure-index sample is not a complete clone allocation sweep. |
| `generic_pump_publication.tower` | New request admission cannot publish a query/body on typed failure. Real SyntaxOrigin/trace payloads with repeated/null splices force hold exhaustion, verifying source histories/refcounts unchanged and all joined stages discarded before teardown. Both widths retain prior scratch/publication checks. Preserve; test-only reference saturation is not ordinary overflow workload evidence. |
| `interpreter_call_query.tower` | Wide-call argument count derives from inline storage and exceeds it with the pointer argument. Weighted expected sum checks evaluation order independently; pressure is applied at the actual FinishValue continuation after argument effects. Denial preserves caller frames/stack, skips callee effects and stays terminal after pressure release in runtime/staged modes. Existing query-smoke chain reaches it. |
| `lr_work_main.tower` | Preserves dependency-units in units/all and unit-admission in all/its focused selector, including validation/usage handling. Existing tower-native-units CTest therefore reaches dependency coverage; the backend and units selectors do not reach admission. |
| `parser_failures.tower` | Imports/calls diagnostic budget and grammar-builder results before existing trace/table failures. Frontend default/parser reach this chain; earlier allocation-only selector does not. No duplicated implementation/provider. |
| `parser_table_budget.tower` | Adds whole-input/prefix request descriptor/forest/control footprint and actual allocation sweeps. Denial before allocation or mid-construction must retain exact cause and leave the stream unconsumed; retry parses the complete original span. Default parser failures reach both modes. |
| `regex.tower` | Cold constructor and cached-reader pressure preserve Capacity/Busy separately from syntax errors. Actual Memory sweep allows optional successful work only with the independently checked accepted language. Every attempt restores node/buffer/grant baselines; invalid counted pointer is explicit. Existing regex caller reaches it. |
| `semantic_executable_admission_checks.tower` | Added pinned dispatch and separate startup/metadata selectors reject Busy without canonical counts/readiness publication; released pins cannot revive a failed owner. Both widths and budgets retain repeated terminal no-allocation/query checks. Preserve; widths/budgets alone do not establish overlap. |
| `type_execution_receipts.tower` | Adds kind/component admission and canonical array/layout denial while the original evaluation ticket is suspended. Existing identity can survive without a layout query; healthy layout publishes one result, whereas failures retain the SU8 sentinel, first cause and zero running tickets. Count enum supplies iteration bound; query-smoke reaches both target widths. |
| `work_order.tower` | Exactly the committed `be0d123bb` eight-line addition: stale revision/profile cannot publish, fail or release the current dispatch. Existing yield/retry ordering remains. Preserve the focused native receipt without rerunning its matrix. |

Caller/producer cross-checks use the actual `semantic_flow` request/pump/quiescent
wrapper, `semantic_phase_work` joins and lifecycle pumps, constructor/evaluation
admission APIs, Fast call/storage owners, parser diagnostic result/destructor and
structural cache key/pin implementation. No parallel scheduler or secondary graph
is introduced by these fixtures. `TowerWorkPolicyTests.cmake` registers the three
flow/lifecycle/staging executables with one semantic provider and a60-second
timeout; its executable-admission list includes pinned/startup/metadata. Storage,
execution core, parser failures, query-smoke and generic-clone-parallel retain the
other stated callers.

**Concrete automatic-coverage gaps:** `parser_structure_reuse.tower` is only
reached by frontend's `structure-reuse` selector, absent from the default CTest
command. `backend_units_admission_tests` is reached by all/unit-admission, absent
from the registered units/backend CTest commands. ROOT's explicit focused runs
remain valid evidence; ordinary CTest coverage must not be claimed for either.
Iteration/profile entries are deliberately opt-in measurements, not missing default
regressions. No demonstrated test-code defect warrants a build in this review.

The [current shared roster](compiler_ecs_file_roster.md#frozen-adoption-reconciliation-at-5b05d6bb-2026-11-23)
reconciles every tracked path, adopts the three unchanged B1 wrapper receipts and
lists finite remaining owner-review actions. This D1 source adoption does not
upgrade other lanes' changed production sources, pinned resources or historical
validation to current acceptance. Documentation-only profiling is inapplicable;
no runtime, sanitizer, browser, bootstrap, generation or deployment gate was run.

Publication-boundary note: normal merge91397b77 preserves upstream36ad337 after
ff-only divergence. Its tree has551 D1 paths; one addition and12 modified fixtures
postdate the frozen review above. Their exact paths are in the roster's
[publication boundary](compiler_ecs_file_roster.md#publication-integration-boundary-36ad337).
They remain pending source-delta adoption, including newer inferred-stage,
retention, accounting and layout fixtures; the550-path5b05 review and preserved
native evidence are not relabeled as acceptance of those later bytes.
The final pre-push d21ba95 merge additionally changes frontend_main and
semantic_executable_admission_checks, bringing that later D1 delta to15 paths;
no additional file is added. Frozen550 review versus current551 inventory remains
explicit, with the exact final source delta recorded in the roster.

## Delegated finite source adoption at ec01291 (2026-11-23)

Reviewed published main ec01291eaf8706c29f3bec62ec85a2e7561530d4, frozen once.
ROOT delegated independent substantive adoption of all 51 paths in the preceding
roster union: 26 freshness actions plus 33 later deltas, with eight overlaps.
The table closes those source-review actions, rather than assigning them again.
Implementation ownership stays with the original lanes. Each blob prefix below
is resolved by that exact commit/path; these are source findings, not new runtime
passes. Unchanged complete reviews remain reusable.

The frozen tree has 1,146 tracked Tower paths and 551 D1 paths. The prior 550-path
D1 review plus one added fixture and fourteen changed fixtures below closes its
later delta. The exact Git path set still equals the previous reconciled owner
set. No after-freeze source is adopted here. Historical journal experiments and
45 pinned resource entries retain their provenance-only status.

### Production and provider receipts (36 paths)

All rows are independently adopted at the frozen identity. Explicit limits and
the confirmed accounting defect below remain open; adoption does not mean that
every allocation or threaded execution has been validated.

| Path | Frozen blob | Substantive finding and disposition |
| --- | --- | --- |
| scaffolding/backend/context.tower | aa91d992 | Retention policy is mutable only before source/output creation; default retains both IR texts. Null-guarded disposal handles object-only output. Observer context is borrowed through dispatch/join, not owned by LLVM. Adopted with external LLVM heap accounting still outside output grants. |
| scaffolding/backend/lowering.tower | d1823233 | Preparation/declaration/IR/verification/raw-text intervals balance through deferred exit. Verification remains unconditional; only LLVMPrintModuleToString is conditional. One private backend owns all phase writes. Adopted; phase durations are observation, not a speedup assertion. |
| scaffolding/backend/observation_types.tower | 35cd597b | Entire new enum/callback layout reviewed. Explicit ordinal and phase select private observer slots; callbacks may not mutate compiler/LLVM state. Borrowed context must outlive joins. Adopted; callback synchronization is a caller contract. |
| scaffolding/backend/pipeline.tower | 42638077 | Optimization and emission still execute their existing passes/verifier/object generation. Optional optimized text is independent of verification; deferred phase exits cover failures. Adopted with unchanged target/output ownership. |
| scaffolding/backend/units.tower | 9e5c27ca | Observer/retention configuration rejects started or finished batches; attached next() marks started before admission. Each job copies observation plus ordinal. Shared graph tickets and lane grants precede dispatch; cancel drains before grants/views close. Object-size retention is separately reserved and does not claim to bound LLVM heap. Adopted. |
| scaffolding/compiler/compiler_kernel.tower | ab78f7a7 | Joined transition checks every stage hold before closing its input view, publishes all stages before caller readiness, and cancels borrowed result buffers before discard. Earlier published structure is not rolled back after a later publish failure. Existing dispatch Busy admits no work and does not join another owner. Adopted; not a second scheduler. |
| scaffolding/compiler/frontend_compilation.tower | 106ea785 | Composed early program-resource guard prevents use of a failed semantic root. Typed module startup/finish failures retain causes; a module rejected by vector insertion is destroyed. Existing modules remain owned until final cleanup; successful imports publish dependency-first with lexical duplicate filtering. Adopted; legacy append/attachment assertions are not newly covered fault paths. |
| scaffolding/compiler/frontend_modules.tower | 932fd975 | Startup privately prepares graph, optional environment/anchor and first module before changing active graphs, source diagnostics or cache bookkeeping. Typed create/component errors survive cleanup; untracked failure does not decrement active_graphs. Completion reserves order/used storage before publication; imported-session failures remain graph-owned. Adopted. |
| scaffolding/compiler/frontend_units.tower | b72a7d1b | Typed bounded constructor propagates physical causes and closes partial worlds/modules/snapshots. Snapshot replacement reserves exact copies before commit. Shared budget wake enters the existing pool event loop, allowing nested lane returns to refill outer work. Cancel joins and settles before releasing views; wake detaches before pool destruction. Adopted; lane capacity is not observed overlap. |
| scaffolding/compiler/host_entities.tower | 2ce0fdaf | Removed compiler_work import is a provider-closure correction, not changed entity behavior. Node-based syntax lookup uses the node world; named/ordered child forwarding preserves entity ownership. Legacy host-store create/count wrappers remain explicit boundaries. Adopted against entities-unit linkage. |
| scaffolding/compiler/semantic_body_work.tower | 705784cc | Preparation failure guards stop layout/type continuation consumption. Joined wave uses shared checked stage transition; cancelled private evaluation invocations are disposed while staged payloads live. Normal publication transfers scratch owners once; failed private lists/buffers survive until pipeline cleanup. Adopted with existing lexical continuation/effect order preserved. |
| scaffolding/compiler/semantic_capture_work.tower | 304bf09b | Capture/value kinds and components retain typed admission causes; failed second kind retires the first private kind. Owner/frame proof and source initializer query remain explicit. Successful capture ticket precedes IMValueInput publication; optional known_producer is preserved. Finalization closes admission only after producer drain. Adopted; captures are not identified by offsets alone. |
| scaffolding/compiler/semantic_constructor_work.tower | 50feab39 | Checked declaration/constructor registration preserves parent lexical/current/construction ownership and rejects incomplete state. Type-returning helpers use existing executable/capture producers and ordinary evaluation, with null/failure guards before storing or consuming the result. Adopted; no global type registry or replacement evaluator. |
| scaffolding/compiler/semantic_context.tower | f818ad2d | sem_create_result returns a containment borrow, releases private allocation on failed attach, and kind registration retires an invalid kind. sem_attach_result uses the node's world and allows existing leased payload access. sem_stage_wave retains dispatch/graph or earliest producer cause, cancels graph on ownership failure. Adopted; pins alone do not authorize mutation. |
| scaffolding/compiler/semantic_declarations.tower | 921eaa5b | Result-backed state/registration admits query metadata before consumers demand it; frame access distinguishes initializer reads from body writes. Worker tickets/leases are frozen before dispatch. Both discovery/check waves join, transfer holds and publish before structural continuation; private evaluations/scratch clean up on failure. Layout/constructor/inference null results stop publication. Adopted. |
| scaffolding/compiler/semantic_evaluation.tower | 104ef2f9 | Composed typed kind/state/node admission keeps cleanup ownership before projections/query failure and validates exact subject/readiness identity. Both required and inferred calls use executable inputs; optional capture/type/effect policy stays distinct. Executed waits suspend retained invocations; late owner/signature gates precede dispatch, full lowering retains error priority. Cancellation disposes consumers before producer projection arrays. Adopted. |
| scaffolding/compiler/semantic_evaluation_work.tower | 22a8f6e5 | Composed registration validates evaluation identity, reserves checked component/access/phase edges, and advances its frontier only after success (including skipped non-inferred clones). Leased preparation/clone stages hold and publish through the shared joined boundary; worker errors stay on the owning evaluation. Adopted; existing stage/view/diagnostic reservation assertions remain narrower than total OOM recovery. |
| scaffolding/compiler/semantic_execution_work.tower | 029a37b4 | Typed executable kinds/root/input, lease/view/dispatch/hold/publication preserve canonical source causes and drain private snapshots. ROOT's signature add_result records worker Capacity at the source function, skips subsequent lowering, finishes the exact ticket failed and leaves input.ready false. Dispose owns retained diagnostics/aliases. Adopted against signature and healthy fixture receipts; no ready input on denial. |
| scaffolding/compiler/semantic_known_bindings.tower | 1abbc611 | Checked kinds/components and stage admission preserve capture versus optional producer roles. Joined whole-program write/order proof and per-subject KnownClone precede shared KnownSnapshot; failures cancel partial registration rather than replay. Producer binding publishes only after admitted evaluation/input metadata exists. Adopted; immutable binding is not automatically a known value. |
| scaffolding/compiler/semantic_known_work.tower | eb9e4782 | Coordinator reuses exact component index, validates ordinal uniqueness/count, and avoids a redundant archetype plan. Workers retain private arena/output and a pinned frozen context. Joined source-order producer cause takes precedence over later terminal graph failure; failed frontiers cannot replay. Adopted; stable indexed pointers are not packed payload storage. |
| scaffolding/compiler/semantic_layout.tower | 08adbf19 | Same-world typed payload and offset storage precede query exposure; each aggregate dependency uses that producer, not bare query creation. Graph edges/access/sealing and zero-result propagation stop partial layouts reaching callers. Existing 8,192-field dispatch threshold is retained from its original measurement, not remeasured. Adopted. |
| scaffolding/compiler/semantic_lowering_work.tower | fe555448 | Mixed signature/expression frontier refreshes body after prelude publication; own aggregate range matches own-return metadata reads, checked call types remain frozen. Capture ranges and function/parameter leases precede dispatch. Shared joined stage handling precedes observations/aliases/finish; retained signature errors precede expression errors in source order. Adopted; compatibility owner alone diagnoses quiescent waits. |
| scaffolding/compiler/semantic_phase_work.tower | a7ed504d | Entire helper reviewed: root-owned joins reference the existing function set/WorkGraph. Both staging policies wait on signatures and their own lowering; KnownProof/Clone still protect inferred snapshots. Callback records publish exactly once by ticket after signature join. Full-lowering gate controls completion/error selection, not unrelated execution. Adopted; frozen ordinary function-set boundary remains. |
| scaffolding/compiler/semantic_query_api.tower | fedd3975 | Added create/attach result, evaluation-expression and constructor declarations match their actual providers' pointer/result types and exports. No new storage, scheduler or default world. Adopted with provider-specific ownership contracts above. |
| scaffolding/compiler/semantic_source_bindings.tower | 2faff679 | Uncommitted default components are hidden by query==0. Prepare reserves all candidate payloads and checks specialization mutations before terminal proof completion; publish exposes immutable facts only after successful finish. Pipeline kinds/roots retain checked ownership and joined jobs dispose once. Adopted; ordered syntax roots remain borrowed from the program. |
| scaffolding/compiler/semantic_statements.tower | 8aa81597 | Single added sem_ok guard stops sem_run after failed source-binding root preparation, before attributes/aliases and subsequent statement execution. Existing ordered grammar/effect handling is unchanged. Adopted against source-binding producer failure contract. |
| scaffolding/compiler/semantic_support.tower | fed7a3ea | sem_node_result preserves typed world-component failure at syntax offset; fresh nodes alone increment the component limit. Legacy sem_node remains an asserting compatibility wrapper. Adopted; recovering callers must use the checked result and sem_ok, not infer universal failure recovery. |
| scaffolding/compiler/semantic_type_values.tower | 631afd55 | Integer-argument staging checks executable/capture admission, checked output-node creation and evaluation identity before registration. Retained lexical result resumes through its existing query; non-integer input remains a semantic diagnostic. Adopted; production helper readiness is present. |
| scaffolding/compiler/units/entities.tower | ca4123b3 | Entire eight-import unit reviewed. Moving library.compiler_work here gives the existing entities provider its work APIs without duplicating the host_entities closure. Existing entities, stage and arena ownership remain authoritative. Adopted; provider import is not a new allocation/accounting guarantee. |
| scaffolding/host/driver_api.tower | 41434084 | backend_retain_ir extern exactly matches backend/context's bool result and opaque backend borrow; no owned state or policy default changes here. Adopted against actual single-unit caller. |
| scaffolding/host/driver_compile.tower | b680fd78 | Root creation/semantic initialization failures release partial imported program/root before normalization. Object path opts out only when neither sidecar nor LLVM emission needs text; IR writer returns before null text access when both sidecars are absent. Ordinary lowering/optimization/emission/error cleanup remains. Adopted. |
| scaffolding/host/driver_units.tower | 2beb6a93 | Configures object-only backend before dispatch; driver_prepare rejects multi-unit interpreter/library/IR-sidecar modes, so omitted text is not a permitted requested output. Backend closes before frontend worlds and owned source buffers. Adopted with shared outer/nested budget and existing executable/link contract. |
| scaffolding/library/work_budget.tower | 748f6703 | Failed minimum-lane admission arms wake under the same gate used by release, closing the lost-notification window. Release validates owner/revision/generation then sends one nonblocking notification. Binding/detaching additionally requires owner-proven quiescent borrowers. Adopted; byte-only denial does not arm lane wake and raw allocations remain outside ledger. |
| scaffolding/library/work_budget_types.tower | 65d5f648 | Wake context/function/armed state belongs to the shared budget and is gated with admission; per-call results remain the concurrent error interface. Snapshot retained bytes explicitly expose ledger metadata. Adopted; used_lanes==0 alone does not prove context lifetime. |
| scaffolding/library/work_pool.tower | 9761377d | Existing completion signal also carries admission wake; receive_event consumes an event and may return no job. It preferentially reaps finished slots; leftover tokens become refill opportunities. Legacy receive hides wake-only events, and close drains workers before signals/storage. Adopted; sender detachment must precede close. |
| scaffolding/tools/bootstrap_symbols.tower | 4eb021fb | Full current allowlist and verify/comparison callers reviewed. Exact whitespace-token membership, target-scoped table symbols and underscore normalization retained. Semantic typed stage lease/hold/publication and ParserNodes structural cache exports compose without wildcard permission; wrong-unit/truncated/suffixed imports remain rejected. Report returns borrowed input spans deterministically and exits nonzero on rejection. Adopted; policy tests do not prove target execution or public bootstrap closure. |

### Later D1 fixture receipts (15 paths)

| Path | Frozen blob | Substantive finding, registration and limits |
| --- | --- | --- |
| scaffolding/tests/backend_units.tower | 3e9d4c0e | Added IR-policy case compiles three real sources (answer42, execution roots, aggregate call), compares retained versus discarded concatenated object bytes at requested workers1/3 under both optimization policies, checks null/nonempty text and frozen configuration, ordered invalid-target error and cancellation cleanup. Reached by lr_work all/backend-ir; not registered backend CTest. Actual overlap remains a separate fixture oracle. Adopted. |
| scaffolding/tests/bootstrap_symbols_checks.tower | c35131b0 | New semantic lease-result admission uses the shared helper: Linux/Windows/Wasm/macOS spellings accepted, truncation/suffix/wrong-unit rejected. Composed structural-cache cases retain ParserNodes-only checks. Actual producer definitions/consumers match permissions; fixture imports ordinary policy. Adopted; spelling coverage is not cross-platform execution. |
| scaffolding/tests/entity_accounting.tower | 25f74c90 | Entire new fixture reviewed. World/requested-byte census includes named children, indexes, tables, plans and cancellable private stage; 32-node/4-stage sums, 52 finalizers and zero cleanup are independent oracles. Small workload keeps pages on the non-full list; not a general full-page census. profile target passes in D2's receipt; separate cap target deliberately returns1 for the confirmed uncharged descriptor defect below. Adopted with defect open. |
| scaffolding/tests/entity_locality.tower | d88ba0fa | New bounded homogeneous/mixed modes derive counts from arrays, compare analytic sums for direct lookup and planned pointer columns, retain one survivor/page then refill without new grants or address changes. Census deduplicates live component.page pointers including full pages. Counterbalanced first/warm scans and raw descriptors are explicit; no hardware-cold or packed-SoA claim. Opt-in measurement target, old no-argument workload preserved. Adopted. |
| scaffolding/tests/entity_stage_concurrent.tower | ed20b2e7 | Four added transition cases call actual generic stage boundary: publish, exhausted hold, dispatch cause and partial publication failure. Result-cancel callback precedes any finalizer; unheld cancellation still sees live input pin; exact refcounts/publication/finalization checked. Default CTest runs these then existing real four-worker trials. No race-freedom inference. Adopted. |
| scaffolding/tests/entity_stage_result.tower | f857e37e | Opt-in queued mode checks eight rounds of 65,536 duplicate references, hold-before-last-view-close, idempotent re-hold, final release and empty world. Cancellable payload nulls unheld borrows; finalizer releases held entries. Default typed-result CTest remains; queued cost case needs explicit argument. Adopted; size constants define this workload, not inferred input lengths. |
| scaffolding/tests/execution_main.tower | cc3856de | type-staging selector composes existing type-construction, aggregate-capture, type-binding, comptime-aggregate and final known-binding suites with shared capture coverage once. Individual selector behavior remains. Uses ordinary request/module lifetime; no alternative reference implementation. Adopted; selector does not itself add a CTest registration or new runtime receipt. |
| scaffolding/tests/frontend_main.tower | ad7b6f93 | Added puts labels preserve exact default suite order and existing buffer-count/error returns. CMake default frontend entry reaches them; focused early selectors retain their own paths. Labels identify phase entry, do not prove a timeout resolved or force pipe flushing. Adopted; no compiler behavior changed. |
| scaffolding/tests/frontend_units_profile.tower | 31343d0d | Enum-derived phase slots are allocated before dispatch; each ordinal owns its cells. Observer and object-only policy freeze before shared unit pump; after join every interval is checked inside its outer span on the same thread. Existing canonical/reference checks remain outside timed work. Adopted; summed phase time is not elapsed critical-path time, and buffers are freed after backend join. |
| scaffolding/tests/lr_work_main.tower | 48d3039a | Merged dependency-units, backend-ir and lifecycle-frontier registrations coexist. CMake renames/links lifecycle fixture main into the single production provider; all/query-smoke calls it. units still includes D1 dependency fixture; backend-ir is explicit/all only. Unknown selectors fail. Adopted; no registration dropped by the merge. |
| scaffolding/tests/parser_state.tower | 21e622fb | Injected lookahead diagnostic now compares ParserDiagnosticBuffer data/length through format_equal instead of a ByteBuffer-specific helper. Stream error/read position/borrowed-node and return-lookahead assertions remain. Reached by parser_tests/default frontend. Adopted as a type-correct oracle fix, not a parser algorithm change. |
| scaffolding/tests/semantic_executable_admission_checks.tower | d3efc696 | New signature/healthy selectors use an explicit synchronized world ledger, actual aggregate signature producer and half-budget pressure derived from budget size. Denial must preserve Capacity/offset17, failed query, false readiness and no replay; healthy path requires metadata. Joins and zero ledger/world cleanup checked. All13 selectors registered by CMake; ROOT196d runtime receipt retained. Adopted. |
| scaffolding/tests/semantic_lifecycle_frontier_checks.tower | 09aadbc9 | New HoldFailure mode queues actual provenance through leased production lowering stages; saturated history references force Exhausted. Checks both kernels ran, no successful transform/callback ABI publication, no running work/views, then restores test pressure before cleanup. Existing ready/wait rendezvous retained. Standalone CTest and all/query-smoke registered. Adopted. |
| scaffolding/tests/semantic_resource_checks.tower | b8dabad9 | Growth denial now supplies actual checked IMFunctionInput for both required and inferred policies. This keeps the fault at executed nested frame growth after inferred calls adopted executable readiness; exact resource/offset/order/cleanup assertions remain. Reached by query/resource smoke. Adopted; setup correction is not threaded allocator sanitization. |
| scaffolding/tests/semantic_staging_frontier_checks.tower | 016e1883 | All extended cases reviewed: required/inferred known values42/43, actual nested call/capture owners, optional fallback, repeated waits retaining frame/memory/steps, untaken error/call with zero demand, own-owner wait, error priority/cancel and terminal idempotence. Two invocation-owned signals prove simultaneous evaluation kernels in the workers=4 trial; backlog derives from production window. Twenty trials registered as standalone staging-frontier CTest. Adopted; not a second evaluator or universal race proof. |

### Composed blobs, evidence and exact remaining limits

The original three merge exceptions are explicitly resolved by source composition:

- frontend_compilation: b21bdb2 blob f850fb0e plus the L2 early resource guard
  yields frozen106ea785; startup failure/cleanup and root guard were reviewed
  together, including frontend_units and driver callers.
- semantic_evaluation: 7cea85c blob6bfd2443 is not the reviewed current file.
  Checked L2 state/subject admission, A1 late required/inferred gates and A2
  consumer-first cancellation compose in104ef2f9; it exactly matches0a958f27.
- semantic_evaluation_work: 7cea85c blobe8a58607 plus checked registration/
  frontier advancement, phase prerequisites and checked joined ownership yields
  22a8f6e5, also exactly0a958f27. The shared lifecycle pump joins before each
  next phase and diagnoses cycles only at owning-pipeline quiescence.

Exact current-vs-last-nonmerge comparison also found three later composed files
inside the assigned set: bootstrap_symbols, bootstrap_symbols_checks and
lr_work_main (plus the already-known frontend_compilation). Their extra
structural-cache permissions/cases and dependency/lifecycle registrations were
read above, not adopted by last-commit label. The remaining47 current blobs match
their last non-merge implementation blobs. Matching bytes are identity checks;
substantive review is the table, not that count.

Owner receipts remain scoped: B2 startup b21bdb2, refill dbce8d7 and output
202d50ca; A1 known/capture5230b5d, layout0ecf31c and inferred d9112a01; L2 checked
admission2cf4154/d56c290; A2 joined stages0a958f27; ROOT signature196d93c7;
D2 accounting6b04a149/layoutf7a201e; portable consumer a862f0c and execution
selector925229c. Existing journal measurements and supported instrumentation are
not relabeled as runs of ec01291. The new review adopts the composed source only.
The prior portable stale-ticket eight-line change and focused native evidence,
D1 dependency batch and ROOT's5b05 revalidation remain unchanged.

There are **zero missing substantive adoption actions in this 51-path set**.
The concrete unresolved defect retained at this checkpoint is:

- **Whole-store finite budget bypass**, existing A2 producer
  scaffolding/library/entities.tower:68–94. With a store consuming its exact
  calibrated budget, entity_create_result allocates an uncharged Entity through
  alloc, returns None and advances next_id/entity_count. The existing
  entity_accounting cap fixture demands Capacity/no publication and fails
  nonzero after cleanup. D2's6b04a149 receipt observes limit/ledger2232 bytes and
  an additional184-byte live descriptor on Linux x64; the current producer is
  unchanged. Other raw node/index/table/view/stage storage and ledger metadata
  likewise prevent a whole-world bound; profile explicitly reports omissions.
  No new repro or broad run is needed to establish this already demonstrated
  defect, and this documentation review does not repair it.

At the ec01291 freeze, three regression-registration gaps remained (closed by
the [registration receipt below](#three-focused-ctest-registrations-2026-11-23)): parser_structure_reuse needed
frontend structure-reuse; backend_units_admission needed lr_work unit-admission;
backend_units_ir needed lr_work backend-ir. Existing focused receipts are valid
at their sources, but default frontend/units/backend CTest commands do not cover
these selectors. Queued-stage and locality/accounting measurement modes are
deliberately opt-in, not mislabeled default regressions. Legacy asserting
allocation paths and the broader release/instrumentation gates remain at their
existing documented limits; no new unexecuted hypothesis is promoted to a defect.

Checks performed here: changed hunks plus owning producer/caller/disposal
context, exact51 path/blob table equality, frozen1146 inventory equality,
three original and four current last-nonmerge composition comparisons, actual
CMake/selector lookup, whitespace and unchanged todo identity. Read-only lookup
mistakes (nonexistent scaffolding/cmake/lowercase L2 paths and a non-globbing
ls-tree pathspec) were corrected against actual paths; no zero census or missing
file was treated as evidence. Metadata stays under ignored
build/d1_ecs/review_ec01291/. Documentation-only: runtime profiling, builds,
sanitizers, bootstrap/browser/generation and deployment are inapplicable to this
delta or remain ROOT's separate pending integration gates; none ran here.

## Three focused CTest registrations (2026-11-23)

On published98d69cf plus this transport-only delta, the three gaps above are closed:
cmake/TowerFrontendFocused.cmake registers tower-frontend-structure-reuse;
cmake/TowerWorkPolicyTests.cmake registers tower-native-unit-admission and
tower-native-backend-ir. They reuse the exact existing selectors, resource root
and executable targets, with native/focused labels. Timeout60 follows focused
producer checks; timeout180 follows native unit/backend checks. No fixture,
default/all selector, compiler implementation or test runner changed.

D1 Docker configuration succeeded in native-coherent-127ca98 (Release,
native/work/backend enabled, public bootstrap, compiler jobs1). CTest JSON
discovery shows exactly these three absolute commands, resources, labels and
timeouts; Ninja target queries resolve the existing entry objects and production
providers. Before/after discovery retains every previous test. Both executable
hashes remain unchanged. Logs: build/d1_ecs/registration_three/.
Cached LR65802649 matches its older frontier receipt, but current entry/provider
hashes differ; no matching current frontend receipt is established. Neither binary
ran and neither was rebuilt. Current-source runtime acceptance remains pending
ROOT's frozen milestone. Performance/sanitizer/browser measurements are
inapplicable to registration-only configuration. The frozen51 source review,
prior execution receipts, known accounting defect and todo remain unchanged.

## Frozen integration review at c20dc56 (2026-11-23)

Independent source checkpoint: published main
`c20dc56ac5344834a95e8de1f505abe9aea515ac`, compiler tree
`42eb931b70b90c778ba1c4d0f92b1e0a1ea2ee63`, scaffolding tree
`533c8426231a39369570b308918a91f9b7b85571`, CMake tree
`71edf52d2e5b3adfcf44bd6c1a28e66b5ef0ba36`. This is the requested B1
4bc51044/ff6820e2, B2 6081ceb4/0e9db271 and D2 d9e1b348 integration review,
not a new repository census. Prior unchanged reviews remain adopted. The union
of these changes contains54 Tower paths; the following receipts identify their
exact contents by frozen commit plus path. Changed hunks were read with their
owning producers, callers, disposal/publication and dependency contracts.

Blob comparison:44 of B1's47 Tower paths exactly match4bc51044. The three
compositions are frontend_main (D2 lr-order and ROOT default progress labels),
bootstrap_symbols and its checks (Semantics-only entity_stage_lease_result).
Both B2 inference paths exactly match0e9db271; the layout fixture matches6081ceb4.
semantic_body_work additionally contains3e9ba56's checked joined completion:
a cancelled graph suppresses later query observation/alias publication/finish,
while joined scratch/evaluation ownership still transfers for cleanup. Its
stage wave completes before those publications; the layout reset remains only
at the root-body boundary, not between incomplete declaration frontiers.
D2's production sort/comparison/profile SHA256s exactly match its full-file
receipt:80ee516d379d27b4bd16c7e38dcf8062a0f83fb1c5748ebfb2b9c388c321db2a,
2af0a0246fab3fb54fa2995a563490218d6260e775731461264047b9b907d5a2,
66af3f223dbe1ffdc7e55b022edcd42e0dc19367bb49168c789d52831b8b12c2 respectively.
The composed frontend_main hash is
`dbc1a5ef6d2020d76b09049b20f62b4ccb26224b11247da33d4273ee08905f7d`;
its old D2 hash is not silently adopted. All branches/default assertions remain;
presentation-budget and lr-order are explicit selectors, not implicit all cases.

| Frozen path | Substantive disposition |
| --- | --- |
| `scaffolding/compiler/format_storage.tower` | New owner separates borrowed text/spans from WorkBuffer grants. Growth checks overflow/self-alias offsets; first failure sticks. Finish reserves the terminator before moving ownership, leaving destination unchanged on failure. |
| `scaffolding/compiler/format_types.tower` | Checked flag, budget and two receipts distinguish checked output from standalone legacy vectors; struct copies alone do not transfer ownership. |
| `scaffolding/compiler/format.tower` | Writes/repeats/spans route through checked growth; disposal follows the ownership mode and releases both grants. Retry requires fresh initialization, as documented. |
| `scaffolding/compiler/format_dependent.tower` | Temporary decoded names inherit the parent's budget; child failure propagates before emission and child storage is disposed. |
| `scaffolding/compiler/format_foundation.tower` | Original identifier scratch uses a child owner, preserves source-name matching and releases on both early-return and fallback paths. |
| `scaffolding/compiler/format_grammar.tower` | Alternative-width preview inherits budget; errors cannot become a successful empty preview, and the temporary owner is released. |
| `scaffolding/compiler/format_parser.tower` | Tree traversal uses a private checked work vector. Legacy host-text conversion still copies to compiler_buffer ownership and disposes its input; it is an explicit standalone boundary. |
| `scaffolding/compiler/format_parser_table_types.tower` | Request descriptor has its own receipt; traversal frames are private work-vector storage, table pointer remains borrowed. |
| `scaffolding/compiler/format_parser_table.tower` | Result constructor allocates descriptor before initialization; frames report exact failures. Replies copy labels synchronously. Destroy releases frames/output then the saved descriptor receipt, including cancellation. |
| `scaffolding/compiler/format_source.tower` | Token/comment ordering unchanged; request-local token scratch uses the output budget and is disposed after statement formatting. |
| `scaffolding/compiler/format_syntax_preview.tower` | Nested preview output inherits budget. Tree comparison distinguishes mismatch from typed allocation failure; private pair stack is disposed. |
| `scaffolding/compiler/syntax_nodes.tower` | Checked comparison adds buffer-backed pending pairs without changing equality/location rules. Null-budget compatibility retains vector disposal; budgeted path releases its receipt. |
| `scaffolding/compiler/syntax_types.tower` | Trace rule and ordered splice payloads become owning work vectors; immutable history identity and source coordinates remain shared. |
| `scaffolding/compiler/syntax_provenance.tower` | Copy allocates before destination replacement and retains shared traces before releasing old history. Staged copy queues cancellable references, never increments shared refcounts on workers; cancellation nulls borrowed trace slots. |
| `scaffolding/compiler/host_provenance.tower` | Result wrappers select the node's actual compiler world and preserve per-call typed errors; no ambient registry or alternate provenance model. |
| `scaffolding/compiler/syntax_expansion_types.tower` | Expansion result carries a separate resource cause alongside syntax error/root/counters; default initialization preserves None. |
| `scaffolding/compiler/syntax_expansion.tower` | Trace/copy/mark errors pass through first-cause handling; failed expansion retains the existing cleanup protocol. General expansion scratch is not claimed fully budgeted. |
| `scaffolding/compiler/syntax_emission_lexical.tower` | Into-result token labels preserve prefix/text/suffix order and avoid raw intermediate ownership for checked callers. Absent spelling remains distinguishable from failed output. |
| `scaffolding/compiler/syntax_version_presentation.tower` | Into-result description/token APIs preserve missing-description fallback. A found but failed description stays failed; it cannot be silently replaced by an empty success. Raw wrappers retain host-text disposal contract. |
| `scaffolding/compiler/syntax_version_types.tower` | Optional text_storage owns detached diagnostic bytes; text is only its view. Consumers must move/reset both together. |
| `scaffolding/compiler/syntax_version_build.tower` | Table failure text moves before table teardown; diagnostic disposal handles checked and legacy variants. Text-termination failure preserves an earlier typed cause. |
| `scaffolding/compiler/syntax_version_cache.tower` | Disposes an old detached diagnostic before reusing its descriptor; revision/cache publication ordering and owned pins remain unchanged. |
| `scaffolding/compiler/syntax_template_build.tower` | Template parsing uses the supplied world and checked session/table/diagnostic APIs. Deferred destruction releases sessions and temporary text after copying replacement errors. |
| `scaffolding/compiler/syntax_session_types.tower` | Descriptor/error have independent receipts; fallback is explicitly static. World/environment remain borrowed and must outlive session destruction. |
| `scaffolding/compiler/syntax_session_state.tower` | Allocate_result returns exact denial without partial owner. Reset clears stale fallback/cause; destroy retires completion before borrowed version, then cache/pins/error/descriptor. |
| `scaffolding/compiler/syntax_session_setup.tower` | Diagnostic transfer moves grant with bytes before producer teardown. Self-alias assignment handles growth. Null descriptor admission propagates; baseline transfer resets the source to prevent double release. |
| `scaffolding/compiler/syntax_session_next.tower` | Failed late diagnostic formatting moves the recognizer's original error without another allocation. Success moves the new grant; static failures preserve text without requiring storage. Expansion errors retain typed cause. |
| `scaffolding/compiler/syntax_session_diagnostic.tower` | Overlay, descriptions and final text complete before insertion offsets commit. Detached result can outlive session/world only while budget remains alive; compatibility-copy failure restores prior offsets. |
| `scaffolding/compiler/syntax_session_format.tower` | Retains original roots while cloning/reparsing; checked root/comment/comparison scratch is disposed. Output allocation/verification failure returns false with a cause, distinct from valid empty source; structural mismatch rejects publication. |
| `scaffolding/compiler/parser_presentation.tower` | Descriptor, frames, labels and final result share the explicit budget; callback replies copy before temporary labels die. Failed formatting never triggers successful fallback; numeric/missing-name behavior remains explicit. |
| `scaffolding/compiler/parser_integration.tower` | Buffer-result finish transfers error before failed table destruction. Existing table cause wins over presentation error; successful empty conflict text is NUL-terminated before inspection. Raw API remains a copying compatibility boundary. |
| `scaffolding/compiler/parser_state.tower` | Unexpected-input text moves into request ownership; labels are scoped until tree shift copies them. Denial marks request failure instead of asserting or borrowing freed bytes. |
| `scaffolding/compiler/frontend_world.tower` | Pattern error output binds to the actual world's budget before cached/cold construction; exact producer failure is preserved. |
| `scaffolding/compiler/frontend_pattern.tower` | Validates compiler/input/output, initializes checked diagnostics, and only supplies a formatting cause when no earlier producer error exists. |
| `scaffolding/compiler/frontend_modules.tower` | Imported and top-level session admission now guards null, records graph failure, and balances import depth. Graph errors remain sticky; retry requires a fresh graph. Idle sessions remain graph/environment-owned. |
| `scaffolding/compiler/frontend_compilation.tower` | Guards denied session before syntax_next; module is already in the cleanup owner list. Records resource cause and stops without publishing partial compilation. |
| `scaffolding/tools/bootstrap_symbols.tower` | ParserNodes/ParserFormat/TemplateBuild permissions match the changed callers exactly; composed entity_stage_lease_result remains Semantics-only. No prefix-family widening or platform execution claim. |
| `scaffolding/tests/bootstrap_symbols_checks.tower` | Checks actual names, wrong units and suffix rejection, including merged lease API; native symbol policy is distinct from running every target platform. |
| `scaffolding/tests/frontend_main.tower` | Full composed entry read: both new selectors, existing resource argument and default progress labels coexist. No double inclusion of either focused fixture in default flow. |
| `scaffolding/tests/presentation_budget.tower` | Uses production trace/session/format APIs. Capacity rollback, staged discard, measured late allocation denial, original offsets/error, retry, detached-world lifetime and final zero grants checked. Serial fault hooks are not thread sanitization. |
| `scaffolding/tests/frontend_session_format.tower` | Failure expectation now requires nonempty diagnostic and exact Memory; dispose/default before retry avoids reusing a sticky failed owner. |
| `scaffolding/tests/frontend_session_state.tower` | Error setup uses the new work-vector ABI; reset/disposal expectations preserve explicit standalone test ownership. |
| `scaffolding/tests/generic_pump_publication.tower` | Aliased/null trace slots use budgeted splice storage, retaining each real reference explicitly; existing hold-before-unpin fixture semantics preserved. |
| `scaffolding/tests/parser_table_budget.tower` | Distinguishes descriptor denial (null/Capacity) from live-session control denial/static message; retries sticky module failure with a fresh graph. |
| `scaffolding/tests/regex.tower` | Fresh FormatResult after each disposal isolates fault cases; cached/cold Capacity, Busy and allocation failures keep their existing exact checks. |
| `scaffolding/tests/syntax_live_replacements.tower` | Retained trace rule comparison uses its NUL-terminated work-vector data after session destruction; lifetime assertion remains substantive. |
| `scaffolding/tests/world_constructor.tower` | Metadata fixture charges splice setup to its actual world; existing serial/staged denial/copy/discard assertions retain their ownership intent. |
| `scaffolding/compiler/semantic_body_work.tower` | Safe module-root boundary resets the derived layout cursor only if early helpers created the pipeline. Existing sem_layout_all discovers graph queries; composed checked stage publication still precedes source-ordered continuation transfer. |
| `scaffolding/tests/generation_layout_frontier.tower` | Imports actual frontend_units producer and interprets42, covering the WorkBatch omission behind old abort134. No copied ABI or synthetic replacement; workers1/4 registered in TowerWorkTests.cmake. |
| `scaffolding/compiler/semantic_call_inference.tower` | Adds ordinary-template lookup through sem_resolve (owner/import/alias binding), restricted to type-returning wrappers. Straight-return syntax supplies constraints only; nominal identity, full substituted signature checks and ordinary execution remain authoritative. |
| `scaffolding/tests/generic_cast_inference.tower` | Actual stack/vector disposal, nested pointer wrappers and inferred type value check42; address helper must execute once. Workers1/4 registered. Does not itself cover an effectful callee expression or arbitrary inversion of type programs. |
| `scaffolding/compiler/lr_analysis.tower` | Closure-owned array sorted with unchanged rule/position/first/last comparator. Smaller-side recursion, size-derived depth and heap fallback bound work/stack; no allocation/shared mutable scratch. Sorting precedes state intern/propagation consumption, including failure return. |
| `scaffolding/tests/lr_analysis_comparisons.tower` |33 boundary/order cases use independent insertion order oracle plus existing150 grammar cases. Terminal/completed dots prevent extra closure items from obscuring sort comparison; cleanup returns allocation count to baseline. |
| `scaffolding/tests/frontend_iteration_profile.tower` | Explicit serial counter transport and pre-entity budget binding; checked answer/canonical hash, phase counts and final zero grants. Observed allocation/RSS do not imply a comprehensive world cap or worker overlap. |

B2 inference caller review includes semantic_values::sem_call_arguments/instance,
semantic_declarations::sem_declaration_infer, generic_register_result and
semantic_modules::sem_resolve_from. Query workers copy inferred types privately;
coordinator interning/specialization and ordinary parameter checking still occur.
The new lookup neither executes a helper to infer its inverse nor reclassifies
an executed wrapper as a static constructor. generic_type_result_read's supported
straight-return subset remains a limit; unsupported inference is not evidence of
lost effects. Existing argument and query checks remain, but this source review
makes no new universal callable-effect or race-freedom claim. LR caller review
includes lr_states_begin_result/intern, lr_kernel_closure_result and close-before-
advance: sorted arrays are consumed only after private construction returns.

Evidence adoption is scoped. B1's merged ff6820e2 native presentation-budget,
parser, grammar-equivalence, exact three native symbol closures and three-unit
canonical controls are recorded by c20dc56, whose only subsequent change is that
journal receipt. They therefore cover the matching frozen inputs for those cases.
Diagnostic peak597595 bytes and zero final grants are accounting evidence for
migrated owners, not total RSS. B2 6081/0e9/5b16 receipts cover saved-before
layout failure, workers1/4 fixtures, inference canonical/object equality,
negative mismatch, type-smoke and actual generation2 semantics object; they do
not establish whole generation2/3 or the later B1 union. D2 d9e/1906/577d receipts
cover sort oracle/native LR and affected merged checks; its paired cold median
2.05->1.93s (three pairs) retains its original input identity. B1's adjacent
serial sample3.34->3.51s is about5% slower (n1); the mixed merged control is not
a substitute performance comparison. Full final-source scaling remains pending.

No new confirmed production defect found in this bounded closure. The already
confirmed entity_create_result raw allocation bypass remains at this freeze:
with the store ledger exhausted, it still allocates/publishes an Entity and
returns None; D2's entity_accounting cap case fails after cleanup (6b04a149,
2232-byte ledger plus184-byte descriptor on its Linux x64 host). B1's checked
provenance uses this producer, so its text/splice budget migration cannot close
that underlying world-bound defect. General raw revision/cache/expansion and
other documented containers remain outside its scope. A2's unpushed memory work
and other unpushed body work are in progress, not adopted here.

The handoff now has a fixed twelve-row implementation/evidence/acceptance ledger.
The earlier full frontend300s timeout remains failed; ROOT's later full5b05 suite
passed328.14s under an explicit900s diagnostic deadline. Neither is a c20 full-
suite pass. Current-source sanitizer/whole-generation/browser/atomic hosted
acceptance belongs to ROOT, not this source review. The three d75 CTest
registrations remain closed as configuration, with final-source execution pending.

Validation here: exact owner-blob/composed-source comparisons, actual registration
and caller lookup, path-specific receipt coverage, whitespace, preserved todo.
Read-only path lookups initially used nonexistent semantic filenames; corrected
against the actual changed-path lists, with no missing-source inference. Metadata
is build/d1_ecs/review_c20dc56/. No compiler/test/profiling job or cache mutation;
D2's heavy resources untouched. Documentation-only runtime profiling is
inapplicable. Earlier journal/owner receipts and pinned resources stay intact.

Publication reconciliation: documentation commitbeb7822 met newer main87a5da1.
Required ff-only pull refused divergence; normal merge preserved both complete
histories without conflicts. Later ownership/scratch implementations and receipts
remain outside the c20 review. In particular, its confirmed budget defect is a
statement about c20, not a verdict on the subsequent fix. No heavy revalidation
or new census was started; final merged documentation checks retain this freeze.

### D1 exact Semantics imports and resource-root fixture correction (2026-11-23)

Source review frozen at `3dc3251ea97ef6c83557fb318bcf1021a1cd6a86` plus this
bounded delta. This does not reopen the accepted census or completion ledger.

| Changed path | Substantive receipt / disposition |
| --- | --- |
| `scaffolding/tools/bootstrap_symbols.tower` | Admit exactly `entity_stage_create_result` and `work_arena_append` for Semantics. The former is the checked stage-owned producer called by semantic_control::sem_control_node and semantic_defer::sem_defer_clone; failures retain their typed cause/source position, and failed staged nodes remain stage-owned. The latter is the existing same-budget, joined-owner chunk transfer used by semantic_support::sem_scratch_append, then body/declaration/iteration publication; it empties the source links without copying payloads or allocating grants. Both are owned Tower exports, not foreign exceptions. No prefix allowance or unrelated unit permission added. |
| `scaffolding/tests/bootstrap_symbols_checks.tower` | Reuse symbol_admission_cases for both exact names: positive Linux/Windows/Wasm/macOS policy spellings and negative truncated/suffixed/wrong-unit/Entities cases. Target strings exercise policy only, not those platforms. Existing unexpected-import and first-rejection cases preserved. |
| `scaffolding/tests/frontend_units.tower` | Factor the existing resource-path join into units_path; units_source uses it for virtual filenames. frontend_units_source snapshots the path before the local vector is disposed, so no borrowed path survives its owner. Counts derive from actual strings. No realpath/symlink resolution, filesystem identity merge or production module resolver change. |
| `scaffolding/tests/body_runs.tower` | Anchor every existing virtual body source to its RESOURCE_ROOT. A bare continuations.tower found relative tower/types from the working directory, while vector's nested import fell back to the absolute library root, loading a second lexical prelude and making i32 ambiguous. New focused case checks ordinary plus quoted same-path imports, aliased vector and distinct left/right nominal Item definitions, known output10, workers1/4 canonical equality and reparse. Removing the aliases must fail on Item for both worker counts; distinct files remain distinct. Existing continuations, cleanup, cycles and ordered-error assertions are preserved. |
| `scaffolding/tests/lr_work_main.tower` | Add explicit native resource-roots selector using the existing body fixture/interpreter/formatter. No duplicate all-selector execution, new runner or compiler implementation. Worker counts alone are not an observed-overlap/scaling receipt. |

Producer/caller trace also reads library/entity_stage, work_arena/API;
compiler/semantic_context, semantic_control, semantic_defer, semantic_support,
semantic_body_work, semantic_declarations, semantic_iteration_work, frontend_units
and frontend_modules. module_resolve searches the importing lexical directory
before library fallback; module_path normalizes lexical components, not cwd or
filesystem aliases. Thus the reproduced absolute-root failure is a fixture input
identity defect, not an unsupported RESOURCE_ROOT invocation. Explicit distinct
imports and docs/modules.md lexical identity remain intact.

Focused evidence and limitations are recorded in the matching journal entry and
`build/d1_ecs/symbol_root_3dc3251/`. The existing native compiler has a recorded
873f944 provider closure, so the rebuilt fixture is tested against that complete
verified closure. Current-source tool policy is compiled separately. No receipt
is relabeled as full 3dc3251 compiler, browser, sanitizer or generation acceptance;
ROOT retains those integrated checks and deployment.

Final focused results: absolute and relative control-smoke both pass, preserving
execution/canonical reparse/cleanup/ordered errors; resource-roots passes both
spellings with serial/four-worker aliases and the distinct-import negative.
Native exact-symbol positive and suffix negatives, existing policy cases and the
recorded cached Semantics object's undefined list pass their expected outcomes.
Original absolute exit134 remains a failed before receipt. Current scratch-object
policy verification and integrated current-compiler runs remain ROOT/B1's action.

## Final source delta at 6767cd30 (2026-11-23)

Frozen published main `6767cd301c7c0b08e6df3ff5894ba251143f0191`; compiler tree
`46499e9593bd83c4be67a94781abf843d6cfc192`, library tree
`2f95648e1bd178028f615ff5f414655f8f2ebda3`, cmake tree
`71edf52d2e5b3adfcf44bd6c1a28e66b5ef0ba36`. Scope is the actual delta from the
accepted c20dc56 review: **122 Tower paths, 7 added, 115 modified, none retired**.
No CMake/build/bootstrap pin contract changed in that interval. The two changed
browser files are explicit transport/test boundaries below. This is not another
repository census or a review of post-freeze work. Finite51/ec012/c20 and the
portable stale-ticket receipt remain historical, unchanged evidence.

Method: compare the delta and composed owner/caller/cleanup paths, then adopt the
named owner implementation and measured/test receipts with their own identities.
The table separates source findings from execution; reading a guard or a receipt
is not a new runtime pass. Repeated checked-call guards adopt L2's producer/caller
closure with inspected scratch/node contracts and representative downstream
control/lowering joins; they are not a claim to have independently retested every
allocation site. Every path below is relative to `scaffolding/`, at the frozen
Git identity above, unless explicitly identified as this turn's policy delta.

Receipt keys (journal entries preserve commands, failed experiments and complete
source/artifact manifests):

- **E**: A2 physical owners `42c1e142` (implementation fccb9131/66ab5683), strict
  cap/census/rollback/concurrent-stage checks and paired ownership costs; selected
  supported sanitizer closure in `compiler_sanitizer_checks.md`.
- **S**: L2 scratch `14ce70f7`/merged7160a10a and128deea2; node admission1137b6ce;
  actual scratch/node denial sweeps, query/control/lifecycle and small frozen
  jobs1/4 comparisons. B1 scratch-index3415d9c8/merged4bea26d6 repairs measured
  linear lookup/self-compile stall. No claims that older complete matrices ran
  again on6767.
- **M**: L2 module/inspection5b4a587b and merged97b8b1c3; storage/query/editor and
  lifecycle5/24 pass on runtime/build inputs identical to6767 (`git diff` empty).
  Control86.45s and matched module samples remain pre-merge5b4 inputs.
- **O**: L1 counted output/package f2ae81f3, first-diagnostic f353cec/f13b38f and
  merged a241935e/78d22d11; native diagnostic/core/query and shared Node package
  5/5, zero skips. Earlier paired output costs remain original-input evidence.
- **R**: B1 LR core81381afb/e2f1da83 plus D2 suffix21359923; six D2 full-file
  source hashes match this tree exactly. ROOT f72179d2 validates the composed
  native LR/oracle/failure/retry/suffix/resource-root subset. D2 pinned Deck
  paired medians cold1.65→1.60s, installed1.78→1.72s, 2,000 checked caller
  closures17.858→16.701ms, +30,656B peak ledger and unchanged final retention.
- **B**: B2 explicit object codegen f626ed9e, merged f6d1f167/35a6f64b, published
  via76c38e7a; API/backend-ir/differential/object controls and fixed matched costs.
- **P**: D1 exact policy/resource-root184b2b4/9ab43b9; original focused native
  fixture uses complete873f944 provider identity. ROOT f72179d2 supplies the later
  merged absolute/relative resource-roots pass, not a new control-smoke claim.

### Production delta and owner adoption

| Paths | Inspected contract / disposition; evidence |
| --- | --- |
| `library/entities.tower`, `library/entity_types.tower` | Entity creation admits the physical descriptor before ID/count publication. Separate `first` free-page index and `owned` full/partial-page chain make retirement/transfer complete. Small descriptor/name/query owners use4KiB pages; component payload policy remains16KiB. Independent growing indexes reserve old+new bytes before copying/committing. Dense table columns still contain pointers to stable payloads, not packed SoA. E closes the old exhausted-ledger descriptor defect. |
| `library/entity_stage.tower`, `library/entity_api.tower` | Stage node/reference/cancellation/lease vectors and descriptors have explicit owners. Hold queued references before closing views; publish transfers both pools after joins and frees the stage before releasing its anchor; discard finalizes/cancels before private-page retirement. Checked removal prepares the destination table first; checked view plans admit private query storage before use. Lease of a dying reentrant owner is Busy. E; no universal race claim. |
| `library/work_buffer.tower` | A representable allocation larger than the finite budget is Capacity; arithmetic overflow remains Invalid. Existing grant/payload survives denied replacement. E. |
| `compiler/semantic_support.tower`, `compiler/semantic_context_types.tower` | Arena-owned list descriptors and budgeted vectors replace raw scratch registries. B1 exact-pointer bit index bounds lookup by pointer width; scan fast path, read-only parent borrowing, no-allocation registration and joined transfer keep the original owner. Tables commit buckets only after entry admission. Counted names/clones/typed nodes preserve the first receipt.160MiB semantic payload policy is a logical ceiling, not a world/process cap. S plus A2 a0e0cdcd. |
| `compiler/semantic_context.tower`, `compiler/semantic_declaration_types.tower`, `compiler/semantic_lifecycle.tower` | Snapshot copies reset owned scratch while borrowing the frozen parent; dynamic kind failure retires unregistered nodes. Lifecycle drains body/layout/evaluation/executable/capture/declaration/constructor owners before scratch/world teardown. It does **not** sweep transient KnownScan jobs: defect K1 below. Owning lifecycle, not an empty worker queue, decides dependency quiescence. S. |
| `compiler/semantic_declarations.tower`, `compiler/semantic_body_work.tower` | Private checker scratch transfers after joined publication; source-scan workers dispose private scratch. Failure before block/function start no longer fabricates a resumed continuation; restored cursor/scope cleanup remains conditional on actual entry. First ordinary diagnostic stops declaration admission before a false Memory receipt. Body coordinator still has three legacy sem_create startup sites; A1 preserved batch is outside this freeze. S/O; final body adoption pending A1. |
| `compiler/semantic_known_bindings.tower`, `compiler/semantic_known_work.tower`, `compiler/semantic_known_types.tower` | Mandatory-input scan visits only select condition / lazy left operand; executed interpreter flow discovers optional dependencies. Worker scratch and candidate/storage arrays retain explicit ownership, and Publish arena moves do not clone ownership. New checked candidate append exposes K1, not covered by existing primitive push-denial tests. S, concrete open cleanup edge. |
| `compiler/semantic_source_bindings.tower`, `compiler/semantic_capture_work.tower` | Source mutation/escape facts remain conservative by declaration identity. Source scan owns scratch and transfers first resource offset on every deferred exit. Capture clones restore current/preserve flags with defer, retain owning declaration/range, and stop before publishing a null result; no offset-based alias shortcut. S. |
| `compiler/semantic_evaluation.tower`, `compiler/semantic_evaluation_aggregates.tower`, `compiler/semantic_evaluation_work.tower`, `compiler/semantic_execution_work.tower` | Executed-stage/helper readiness still uses ordinary interpreter and shared work. Private prepare context records actual subject before allocating scratch; failed clone/argument setup publishes no successful value. Synthetic evaluation node uses source-derived offset after successful admission, preserving recursion diagnostic selection. S/O, current query receipts; no new constant folder or replay. |
| `compiler/semantic_constructor_work.tower`, `compiler/semantic_type_execution.tower`, `compiler/semantic_type_values.tower` | Constructor/list/type argument creation stops on denied scratch. Type-construction diagnostic uses the request's captured budget and first-failure latch; nullable error text does not mean successful construction. Existing executed helper demand/capture rules retained. S/O. |
| `compiler/semantic_call_inference.tower`, `compiler/semantic_types.tower`, `compiler/semantic_values.tower` | Guarded collection/type-copy/binding operations preserve ordinary wrapper inference, declared aliases and exact callable signatures. Local frame/index commit follows checked registration; prepared-call kinds/components use per-call results. Type/expression entry boundaries suppress partial success after resource failure. These guards do not infer extra purity/effects. S; earlier B2 wrapper inference review reused. |
| `compiler/semantic_expressions.tower`, `compiler/semantic_expression_lowering.tower` | Source/synthetic nodes use nullable checked producers. Lowering's append/result helpers take the explicit context, stop on denial, preserve callee/argument and short-circuit execution order, and leave failed partial nodes owned by the existing stage/world. No speculative evaluation of fallback/untaken arms was added. S. |
| `compiler/semantic_aggregates.tower`, `compiler/semantic_control.tower`, `compiler/semantic_defer.tower`, `compiler/semantic_iteration.tower`, `compiler/semantic_statements.tower` | L2 checked node/name/list callers and lexical-state restoration replace assertion-dependent continuation. Aggregate/lazy control and defer clones keep normal ordered Foundation lowering; partial locals/blocks do not become successful results. Owner control/lifecycle round-trip/known-output and node-admission receipts S, not independent exhaustive fault coverage of every guard. |
| `compiler/semantic_iteration_work.tower`, `compiler/semantic_lowering_work.tower`, `compiler/semantic_layout.tower`, `compiler/semantic_flow.tower` | Private joined worker scratch uses the shared owner protocol, with error checks before follow-on lowering/layout/flow publication. Existing access/ticket/drain and phase-frontier contracts remain; no new scheduler or admission width is inferred from these ownership substitutions. S. |
| `compiler/semantic_attributes.tower`, `compiler/semantic_enums.tower` | Attribute/type/default/name collections now propagate scratch failure. Enum scratch entries persist under the transferred owner; declarations retain nominal identity and ordinary effect semantics. S. |
| `compiler/frontend_modules.tower`, `compiler/semantic_modules.tower`, `compiler/frontend_compilation.tower` | Checked reachability uses private pending/seen work vectors and distinguishes failed traversal from acyclic false. Registry kinds/scopes are constructed before root publication; metadata and checked attachment precede containment mutation. Compilation stops at first typed failure, preserving module base offsets. Raw published/input/client vectors remain outside this finite migration. M closes the old blanket module-assertion blocker. |
| `compiler/completion.tower`, `compiler/language_query.tower`, `compiler/language_grammar.tower`, `compiler/semantic_generic_info.tower` | Session allocation is typed/nullable; partial roots/entries/stages are released in owner order. Inspection saves/restores ordinary diagnostics without overwriting a resource failure. Function-type annotations use their actual leased stage; discard precedes private annotation-kind retirement. Failed inspection suppresses old output. M, not a claim that every legacy completion allocation is checked. |
| `compiler/generics.tower`, `compiler/host_metadata.tower`, `compiler/syntax_provenance.tower`, `compiler/semantic_generic_values.tower` | CloneStack carries the exact owner into metadata/provenance copies. The owned-clone API permits coordinator access only to matching leased **published** source entities; foreign leases, private staged inputs and pinned stores remain rejected. Expressions clone independently; no blanket lease bypass. M; three newly consumed external permissions were missing (P1 below). |
| `compiler/lr_analysis.tower`, `compiler/lr_first_work.tower` | Immutable suffix FIRST/nullable rows are built once after FIRST joins. Production-relative bases distinguish overlapping symbol spans with different ends; nullable suffix merges caller lookahead. Checked partial allocation rolls back; unreachable invalid suffix is diagnosed only when demanded. Borrowed worker analysis cannot free the shared index. Exact D2 hashes and R adopted. |
| `compiler/lr_states.tower`, `compiler/lr_state_work.tower` | Intern shifted cores before serial closure; close only new cores. Initial state stays distinct; worker outputs already closed are flagged and published in order. Duplicate candidate storage is destroyed. Derived indexes do not replace authoritative grammar entities. B1 R; no speculative parallel-frontier optimization shipped. |
| `library/work_text.tower`, `compiler/interpreter_text.tower`, `compiler/interpreter_context_types.tower`, `compiler/interpreter_context.tower`, `compiler/interpreter_storage.tower`, `compiler/interpreter.tower` | Counted output/error/type-construction text uses explicit request budget, checked arithmetic and terminator space. First failure latches done/error/offset even if no diagnostic bytes can be allocated; successful constructor/error transfer moves grants, not raw ownership copies. Disposal matches allocation family. O. |
| `compiler/fast_interpreter_types.tower`, `compiler/fast_interpreter.tower`, `compiler/bytecode_package.tower`, `compiler/execution_package.tower`, `compiler/execution_session.tower` | Fast pointer-width metadata appended without moving hot fields; bytecode envelope/cache validates target/profile/bounds/checksums before use. Encoding stages one complete counted owner, preserves prior output on failure, and canonical Foundation reconstructs through the ordinary pipeline. Session drops output grants before worlds. O; private cache is not a second semantic interchange. |
| `host/driver_api.tower`, `host/driver_compile.tower`, `host/invocation_execution.tower` | Counted package/diagnostic results move through explicit invocation owners; minimal checked root boundaries propagate first cause. CLI codegen choice reaches the session before emission. Host process/foreign LLVM accounting remains separate. O/B. |
| `host/ide_api.tower`, `host/ide_artifacts.tower`, `host/ide_execution.tower`, `host/ide_types.tower` | IDE package has explicit retained owner and release export; failed rebuild preserves prior complete package, caller success status selects whether it may consume it. Checked formatting distinguishes empty success from failure. Legacy VM/document/JSON owners are not newly proven fully budgeted. O. |
| `backend/codegen_types.tower`, `backend/target.tower`, `backend/session.tower`, `backend/source_session.tower`, `backend/units.tower` | Exact None0/Default2 target-machine policy freezes before compilation. Legacy open retains Default; source object optimization follows caller intent, Foundation IR-only import retains its existing contract. Each backend job keeps private mutable context/output; no new shared allocator/scheduler. B. Backend import admission work is a separate L1 pending slice. |

### Fixture, caller and build-contract delta

| Paths | Expected behavior / registration / receipt disposition |
| --- | --- |
| `tests/entity_accounting.tower`, `tests/entity_locality.tower` | Census walks all owned pages, counts standalone headers/index/query/stage buffers once, includes pool slack and asserts charged bytes equal physical requested storage. Cap denies new owners while allowing admitted slot reuse; publication/removal rollback preserves identities/membership. Locality permits newly charged index grants but requires payload-page reuse and stable survivor addresses. E; neither census is RSS or a whole compiler cap. |
| `tests/entity_component_budget.tower`, `tests/entity_component_layout.tower`, `tests/entity_page_reuse.tower` | Denial may occur at any newly charged owner, not an assumed payload-page ordinal. Layout checks actual live/stale payload grants separately from descriptor/index charges. Page reuse pre-admits independent indexes before asserting no new payload grant. E; two fixture hashes below independently matched. |
| `tests/entity_stage_reentrant.tower`, `tests/entity_stage_result.tower`, `tests/work_buffer.tower` | Dying-owner lease stays Busy; queued stress now initializes raw vector payload before reserve/finalizer and runs a two-reference default smoke. Finite buffer oversize is Capacity and retains old generation/pointer. E; original ASan crash preserved, not counted as a pass. |
| `tests/module_registry_faults.tower` | Real Begin/Scope/Record/Inspect allocation-count sweeps, finite Capacity, pin Busy, prior Exhausted/ordinary diagnostic, no-allocation retries, no partial metadata and zero final grants. Owned clone rejects absent/foreign owner and pin, permits exact leased published source. Called by storage_main default. M. |
| `tests/generic_result_storage.tower`, `tests/semantic_scratch_identity.tower` | Scratch/node tests derive allocation boundaries, preserve old list/table/frame on failure, maintain source+module offset, reject ready/index publication and drain owners.1,024-list exact-address index tests borrowed parent, self/join transfer, bounded probes, no allocation and denied registration. `storage_main scratch` explicitly runs the latter; default storage imports alone are not execution. S; these do not exercise K1's post-KnownScan collection failure. |
| `tests/semantic_diagnostic_storage.tower`, `tests/storage_main.tower` | Plain/traced messages sweep actual allocation count at widths4/8, exhaust budget and retain exact first source cause, restore lexical state, forbid retry allocation/admission, then require zero buffers/grants. Both default storage and diagnostic-faults call the fixture; scratch and runtime-faults selectors remain separately reachable. O/M. |
| `tests/semantic_failure_order_checks.tower`, `tests/semantic_resource_checks.tower` | New physical scratch can fail before interpreter start. Tests explicitly pre-admit prerequisites, deny actual remainder, check owner order83 before11, no ready publication or replay and drained queries/workers. The obsolete deferred-resource branch is removed because admission now fails earlier; ordinary deferred ordering remains. Nested-growth probe restarts only as fixture setup to reach the intended buffer denial. O/S, not evidence of production replay. |
| `tests/execution_output_storage.tower`, `tests/execution_fast_storage.tower`, `tests/execution_main.tower` | First print7 precedes capacity pressure; Graph/Fast retain exact prior bytes, fail terminally without truncation/replay, honor embedded NUL/first offset, drain grants. New fixture is called by all/core alongside Fast storage. O. |
| `tests/execution_packages.tower`, `tests/execution_rejection.tower`, `tests/execution_support.tower`, `tests/execution_world.tower`, `tests/floating_checks.tower` | Work-vector ownership/disposal matches package/session API. Canonical round-trip and invalid target/profile/cache/NUL cases preserve previous complete package on denied encode; comparison helpers use explicit counts. Floating package recompilation retains bit/strict numeric expectations. O; no weakened invalid-input success. |
| `tests/execution_core.tower`, `tests/execution_type_construction.tower`, `tests/backend_type_construction.tower`, `tests/interpreter_call_query.tower`, `tests/type_reachability_profile.tower` | Adapt callers to typed counted construction/error owners. Fully exhausted budget can leave zero diagnostic bytes while exact typed failure/frame remains; grant census includes output/error/construction buffers. Existing execution/type/backend entries retain their call chains and known-output oracles. O. |
| `tests/execution_semantics.tower`, `tests/ide.tower`, `tests/ide_package_checks.tower` | Diagnostics print program/resource offsets for actionable failure. IDE fixtures explicitly import Tower, preserve old package on bad profile/input, and verify release sets size0. O shared package receipts apply to their stated source; not a browser-wide milestone. |
| `tests/backend.tower`, `tests/frontend_units_profile.tower` | Existing backend entry tests both emission policies, known answer42, layout, exact optimized object equality and invalid-policy rejection. Profile records optimized flag and explicit transient-unit headroom; its budget change must not be mistaken for reduced memory demand. B; observed1/8-worker timings are recorded without replacing the original baseline. |
| `tests/frontend_iteration_profile.tower`, `tests/lr_analysis_comparisons.tower`, `tests/lr_analysis_failures.tower`, `tests/frontend_main.tower` | Existing lr-order calls failure oracle and150 random grammars; new nullable/overlapping-production cases and serial lr-suffix caller compare ordered results to independent existing oracle. Same-analysis denial/retry and unreachable invalid tail are intentional. New selector does not duplicate the default suite; counter measurements require serial transport. All six D2 production/test hashes match the owner full-file receipt. R. |
| `tests/frontend_units.tower`, `tests/body_runs.tower`, `tests/lr_work_main.tower` | units_path/units_source give virtual files the same RESOURCE_ROOT spelling as resources; no realpath/lexical identity collapse. resource-roots covers quoted/dotted same-file bindings, aliased distinct modules, known10, serial/four-worker canonical reparse and ambiguous unaliased Item. Native selector requires transport. P/ROOT f721; previously failed absolute control run remains historical failure, repaired fixture's older control receipt is not relabeled. |
| `tests/editor_units.tower`, `tests/generic_inspection_budget.tower` | Actual aliased cyclic modules and forwarded generic helper replace simpler editor samples. Late denial now expects the first registry/root admission, no partial nodes/components or stale output; function-type annotation exercises leased stage creation. Existing editor entry keeps normalized1/6-worker output/cancellation checks; editor-sample exposes1/4 small measurements separately. M. |
| `tools/bootstrap_symbols.tower`, `tests/bootstrap_symbols_checks.tower` | P's two earlier exact stage/arena permissions preserved. This turn adds only three missing exact Semantics imports, grounded in actual exports/consumers (P1 below). Existing negatives and new suffix/truncation/wrong-unit cases execute through the current small native policy fixture. No wildcard, foreign classification or backend-policy overlap. |

Non-Tower boundary review: `playground/src/tower-host.mjs` copies returned package
bytes into JS-owned storage and calls `tw_exec_bytecode_release` in `finally`;
`playground/tests/bytecode.test.mjs` calls the same release after copying and
preserves malformed/cache/profile cases. These necessary browser ownership
boundaries have L1's scoped Node package receipts, not current hosted evidence.

CMake/registration comparison is unchanged from c20: `TowerFrontendFocused.cmake`
registers structure-reuse (60s, native/focused), `TowerWorkPolicyTests.cmake`
registers unit-admission and backend-ir (180s, native/focused), with existing
binaries/resources. Current selectors call their fixtures; no new runner or
second all-selector inclusion. ROOT's earlier registration acceptance and B2's
focused backend-ir pass retain their identities. This turn did not configure or
execute those larger binaries. Existing registered final-source acceptance is
still ROOT's milestone; there is no new registration gap inferred merely from an
optional profiling selector.

### Exact findings, validation and final adoption handoff

**P1, corrected here.** `semantic_generic_values::generic_expression_check` calls
`compiler_clone_tree_owned_result` (export `compiler/generics.tower`, Entities
provider); `semantic_modules::sem_module_scope` calls
`frontend_module_cyclic_result` (export `compiler/frontend_modules.tower`, parser
frontend provider); `completion::completion_session` calls
`syntax_session_open_result` (export `compiler/syntax_session_setup.tower`).
Their Semantics imports were not admitted at6767. The preserved existing verifier
rejects each exact one-line undefined-symbol input with exit1/its actual name.
The policy now admits only these exact existing Tower exports for Semantics.
No additional target/foreign permissions; truncated/suffixed/wrong-unit and all
prior unexpected-import tests pass. This proves policy behavior, not the complete
new Semantics object's undefined-symbol set; ROOT's final actual-object check is
still required. Internal metadata/provenance helpers need no invented imports.

**K1, open source-confirmed cleanup edge; runtime reproduction pending L2.**
`compiler/semantic_known_bindings.tower::sem_known_infer`, line181 at6767:
`if !sem_push_checked(c, nodes, candidate.subject) { return; }` occurs after joined
KnownScan jobs have populated candidates/mutations. Denial of that scratch-list
growth exits without `sem_known_jobs_dispose(&scans)`, unlike neighboring exits.
`semantic_known_work::sem_known_kind` registers lifecycle0; its disposer frees
candidate/mutation/patch/read/storage arrays and job scratch, while
`semantic_lifecycle::sem_context_dispose` has no transient scan sweep.
`sem_query_cancel_failure` cancels graph state only, after workers have joined.
The concrete trigger is first denied collection-list growth after successful
scan/registration; a fixture should inject that exact boundary and require final
zero buffers/grants. This is not an asserted observed leak or a race report.
No concurrent L2 implementation was edited and no broad compiler rebuild was
started to manufacture a runtime receipt.

A2 sanitizer adoption is exact and limited: production library/host storage inputs
from42c1e142 are unchanged except new `work_text.tower`, which is outside its
16-object instrumented closure. Fixture SHA256 values match the published receipt:
component_layout `59669a089d025c3dcb8d3d7c43286fd823001031c5d0f546f64b45dc29fbd0ae`,
stage_result `1c35f82ad9b026f8f69c2ae527ad296c97c34e03cae6ceea79f492624131d9bc`.
The selected14 executables/26 processes per mode are adopted, not all compiler
sources; source-language UBSan/other-host coverage and the documented missing-
provider negative-control limitation remain explicit. D2's six hashes match its
full-file receipt byte-for-byte. M's runtime/build delta to6767 is empty, so its
merged checks are reusable within selection. Other older measurements are not
relabelled as current; the new resource/node/module scopes do not erase raw
client/foreign/host storage exclusions.

Local execution was only the tiny policy test: Docker `tower-d1-ecs`, Steam Deck
Linux x64, public bootstrap9653f818…, LLVM19, jobs1, existing guest-host provider;
one dependency-aware two-action fixture build, 3.77s wall/3.68s CPU/179,584KiB peak.
Native policy fixture SHA256
`d8b1c323b2f35d9241fb756c4ef5117bf02d86086d4eae14c4e1e7c734061ba4`
exits0, <0.01s/1,224KiB. Logs/commands/depfile/source hashes and three preserved
exit1 baseline rejections: `build/d1_ecs/review_6767cd30/`. D2's heavy lock/cache
were untouched. Policy table data and tests do not change compiler/runtime cost;
no production before/after performance campaign applies. No current compiler,
sanitizer, generation, browser or deployment matrix was run by D1.

Fixed remaining handoff: (1) L2 K1 cleanup plus its concurrent dependency slice;
(2) ROOT/A1 complete pin-then-body adoption, including the three startup sites;
(3) L1 exact backend-import admission and callers; (4) B1 final serial/performance
receipt with comparable memory/scaling evidence; (5) A2 final affected sanitizer
closure, reusing unchanged selected storage evidence; (6) D2 final browser/normal/
shared generation slice; (7) ROOT final complete generations, actual object symbol
policies and atomic hosted acceptance. These are exact changed-input/acceptance
owners, not claims that existing concurrency/staging functionality is absent.
The CURRENT twelve-row ledger in the handoff is authoritative for this freeze.

Publication reconciliation (same frozen review): required ff-only pull found
cbaa8c0 and refused divergence; normal merge9322f9f preserved both histories.
`git diff 4c2bd3b HEAD -- scaffolding CMakeLists.txt cmake playground/src
playground/tests` is empty. Both policy sources, all project depfile inputs and
the tested binary retain their identities; the public bootstrap changed, so the
local policy executable remains explicitly predecessor-built. No rebuild needed
to validate unchanged policy logic. New pinned resources stay provenance-only
in this review, not additional project source census paths.

Incoming evidence closes the previously pending L2 selected dependency slice on
**exact6767**: f04c3e91 records units/dependency, type-errors, control,17 lifecycle
cases and execution known; actual dependency threads/outer peak1/1 versus4/4,
known42/43/44/45, canonical/error equality and joined-lane bounds pass. K1's
injected post-scan failure is not selected by those healthy/other-denial cases.
ROOT's2013ad28/b0f507c6 publishes pin768a0cdf and passes clean canonical adoption;
B2's complete generations are frozen252b424a, before L2 module admission. These
supersede pending pin/dependency wording operationally without widening their
source/test scopes.196a2d0 preserves an actual generation1 browser completion
failure; generation2 did not run and wrapper0 is invalid evidence. A1 owns the
qualified-completion reproducers. The CURRENT ledger records these receipts,
while later A1/L1 source adoption, final instruments/performance/browser/hosted
acceptance remain explicit. No subsequent source audit or heavy run was started.

## Browser diagnostic fixture boundary (ce4f724, 2026-11-23)

Reviewed `playground/tests/diagnostics.test.mjs` against Bedrock's declaration
seed, `foundation_syntax.tower`'s Number/CoreDeclare/CoreCallStatement and
`foundation.tower`'s explicit syntax/types imports. Source freeze
ce4f7240392b283a2af9d8cf378a359b32aa7dda; execution deliberately uses D2's unchanged
2013ad28 portable IDE reactor SHA256
0b9d22e60d545e82e6079addd6c67e8e6c6ebc607036c5b4a8143ff4aca08bae.
Relevant language/type sources and Node transport are unchanged from2013.

Basic executable snippets and custom Number grammars now explicitly import
Foundation, preserving their intended original basic-language scope. Literal-only
ambiguous/shift-conflict/broad/nullable and Identifier-only custom grammars retain
the seed-only input. Imported user rules move down one line; byte gaps include
the actual import string length. The no-newline negative replaces the statement
newline, not the newly introduced import boundary. Message text, repair choices,
zero-length insertion spans, ordered conflict alternatives and Foundation rule
provenance stay intact. Reset checks additionally retain exact EOF byte positions;
deep input must reach its invalid final semicolon, closing an accidental earlier
pass on an undefined Number rule.

Reuse audit: `scaffolding/tests/frontend_diagnostic_revision.tower` already tests
native moved-rule provenance using its own Number token; frontend_diagnostic_text
covers repair/alternative text construction, and parser_structure_reuse covers
owned revision reuse. Those are compiled Tower test functions, not source-data
exports callable by this frozen reactor's Node transport. No duplicate Tower
implementation, new runner or broad migration is justified. Existing JS source
strings remain fixture data; the small added assertions check reactor byte-offset
transport/reset, with compiler diagnostic semantics/assertions retained.

Reproduced9 failures/1 pass before; final10 diagnostics plus existing Unicode
source-location control pass11/11, no skips. The first repair left the ordinary
lone-semicolon input on the seed and failed1/11; corrected that input's language
boundary without accepting its import error. All failed logs preserved. Final
Node22.23.5/Docker run2.02s wall/2.39s CPU/133468KiB peak, no swaps. No compiler
build, production speed claim or current-source compiler/runtime matrix. Aliased
IDE completion and shared worker retirement remain separate owner gates.

## Node input/transport closure at d5b65afe (2026-11-23)

Frozen source `d5b65afee426f2576d44a60f44249010a15ace1d`, scaffolding tree
`1fec5300d034693381c6e4f91a8c1cfe1ea0a56b`; no new Tower census. The complete
51-file top-level Node selection was attempted directly, excluding the separate
Tower IDE export command. Its broad acceptance remains **failed**. Preserved
logs/inputs/timings: `build/d1_ecs/node_transport_d5b65afe/`.

| Inspected/changed boundary | Finding and disposition |
| --- | --- |
| `playground/tests/bedrock.test.mjs`, `data-driven-scanners.test.mjs` | Ordinary/CoreOperand/Number source data now imports Foundation explicitly; seed-only declaration/token tests remain seed-only. Existing execution42, formatting, template captures, comments, exact input-relative spans, counters and negative assertions remain. Reset rebuilds its owned module using current explicit capabilities (`syntax_session_inputs_reset`), so the keyword case now rejects the old imported spelling and successfully reparses the new spelling; immutable seed assertions remain. All17 cases pass. |
| `playground/src/tower-host.mjs:configureBedrock` | Confirmed boundary defect: `modules.configure` published invalid candidate text before Tower validation threw. Subsequent `import foundation; print(1);` loaded the rejected Bedrock and failed with missing name/segment captures. Validate before publishing that module source. `syntax_baseline_install` already preserves the previous baseline on validation failure. Existing rejected-install/import-capture tests now exercise successful subsequent imports and unchanged live-node/allocation counts. This establishes rejection handling, not allocation-failure atomicity of every host configuration operation. |
| `playground/tests/module-resolution.test.mjs`, `module-scopes.test.mjs` | First ignored the artifact override; second prefixed an absolute override with the repository directory and failed before assertions. Existing file transport now resolves relative/absolute artifact URLs correctly and both use `TOWER_TEST_WASM`. Tower lexical import identities/aliases and all expected outputs remain unchanged. |
| Existing semantic ownership | `frontend_modules.tower:module_test_seed` already owns seed/no-ambient-language behavior; `frontend_template_build.tower` owns checked replacement/capture failures. No new JS semantic model, Tower fixture duplication or test runner. The changed JS is existing source data, test transport, or the required Wasm/module publication boundary. |

Final affected aggregate:47/49 pass,2fail,0skip. The failures are unchanged A1
qualified-completion assertions in module-scopes220/272: with the explicit
`left.tools as left` fixture, `print(left.he|);` returns `[]`, expected `helper`.
The lifetime case fails during its warm-up, so its final counters are **not**
accepted. Bedrock/scanner17, module-resolution13 and the other module-scope17
cases pass. LLVM comparisons retain their separate older artifact identity.

Broad remaining failures stay in the original logs: stale implicit-language data
in execution/fast-interpreter/formatter/precedence/replacement/etc. tests; legacy
Foundation migration expectations tied to pre-split grammar; missing compiler
project/shared frontend/LLVM license resources, optional cross/native artifacts;
older LLVM rejection of current canonical `integer_type`; and the frozen
interpreter's generic_registry request for `compiler_buffer_allocation_size`.
That provider is Tower-owned (`host/memory.tower:35`), not a new foreign policy
allowance or a proposed JS implementation. ROOT/L1/A2 must adopt the matching
provider/package; L2 owns unmatched semantic/dependency evidence. No unsupported
constructor/ABI outcome here is promoted to a current-source compiler regression.
A1 completion and D2 worker-retirement work remain separate; no expectations were
changed to accept their failures. Final generation/sanitizer/hosted gates remain
ROOT-owned. This bounded batch closes input/publication defects, not the full
Node suite or compiler completion ledger.

Publication reconciliation preserves upstream3a7f4b39 via mergefc3e0101. A1's
qualified-completion source repair5fdb4827 and native receipt are now present;
ROOT's adoption into a new browser reactor remains pending. The above failures
retain their exact old0b9 reactor identity. Node/fixture/artifact and imported
language/type/example hashes are unchanged; later compiler providers are source
data here, not new executable compiler validation.

## Four-file language fixture follow-up at e0e3530b (2026-11-23)

Source/resource freeze `e0e3530b84472be5ba1bc4e331b74bab4dba01bd`, scaffolding
`7d5345143c04e7627892e77acfa9ad0548a5e2ed`. ROOT's portable b755fdc8 and LLVM
ba517692 reactors are frozen **f7e764ab**, public768; no current-source executable
closure is implied. Baseline7/22 and final20/22 pass, zero skips, errors retained.
The entire remaining scope is these four Node files, not a new source census.

- `forward-references.test.mjs`: seed programs now **define** absent Statement
  with `=`, preserving two steps/revision1 and exact incomplete-dependency and
  conflict assertions. Only executable snippets import Foundation. CoreCallArgument
  is checked in its actual producer foundation_syntax, not the wrapper.
- `foundation-storage.test.mjs` / `src/foundation-storage.mjs`: full legacy input
  uses the preserved legacy lexical data and actual syntax declarations instead
  of slicing an absent rule out of the wrapper. Confirmed UI migration defect:
  no inline `parse` made edited lexer migration return obsolete text unchanged.
  The known split wrapper now precedes preserved local overrides, supplying its
  explicit grammar/type imports. Unknown bundles remain unchanged. The test
  checks both the wrapper import and CoreFunction in that imported resource,
  while retaining exact custom-token/comment preservation and idempotency checks.
- `inference.test.mjs`: ordinary sources have explicit Foundation boundaries;
  exact canonical expectations use the physical representation spellings already
  checked independently by `format_expected.tower`. No widths, signedness, output,
  round-trip, effect-order or target-width checks were relaxed. Reused the existing
  nominal Item/Other invalid fixture (Expected Other, got Item), replacing the
  retired assumption that all struct copies fail. Its known language prefix is
  asserted before substituting the common Foundation prefix and pre-error effect.
- `generic-inference.test.mjs`: original combined inputs/expected outputs remain;
  existing compare/round-trip/backend consumer also runs the smaller Tower cases
  below. No constructor substitution, added import workaround or compiler edit.

| New Tower path / exact blob SHA256 | Substantive disposition |
| --- | --- |
| `scaffolding/tests/inference_bindings.tower` / `c2927565316e6106188484c56dad8edf0e6260159cdfdecdcc41da48a734c3aa` | Imports the unchanged real example; observes result storage and writes unsigned_result so exact inferred-binding checks do not require retaining discarded fixed values. Expected example output42/true/43/42 unchanged; canonical reparses and both reactors pass. Shallow pointer borrow is local; no ownership transfer. |
| `scaffolding/tests/generic_stack_module.tower` / `98724503a54b2ea366cf838625f88ccb1e76708e6d4c18cb06c5c8e9855d108b` | Minimal valid-language/default-initialized stack with deferred disposal. Portable graph32 checking fails Unknown type constructor stack, instantiated by stack_dispose at5:7, before the expected42 output. Removing only defer passed the existing compare path through graph/fast32/64, canonical equality and LLVM, before the original combined source failed. Cleanup is expected exactly once; do not change it to direct disposal to hide the failure. |
| `scaffolding/tests/generic_pointer_alias.tower` / `9111cfaba48e6ca1585602cbd8f6b5098ee403db58a68dd92492db25dd677774` | Minimal preexisting straight-return pointer-alias expectation: pointer(i32)=null should print true. Portable graph32 rejects T* as a value during type-producing body checking. Exact compatibility failure retained, not replaced with a different constructor/inference shape. |

ROOT should route the two compiler cases to L2's type/generic producers with
A1's defer/call preparation context as needed. Inspected generics registration
(classifies TowerExpression returns for ordinary execution), sem_type_call /
sem_constructor_arguments (prepared result, then constructor registry lookup),
and semantic_defer's saved/restored checking context. These identify failure
paths; they do **not** establish which dependency/capture edge is wrong. The
first failing graph32 assertion prevents later64/fast/LLVM trials for those two
cases; those are pending, not passed. No changes to their production methods,
D2 LLVM tests/common wrappers, generic hover, native builds or release gates.
Exact commands/hashes/failed logs: `build/d1_ecs/language_fixtures_e0e3530b/`.

Publication merge7a1e2631 adopts complete upstreambfb47510 history. The actual
language/library/example and Node inputs for this slice still match; unrelated
new supplied compiler capabilities retain their separate owner receipts. The
frozen-reactor failures above are not claims about the later compiled result.

## Four-file grammar/transport follow-up at cc21bb4e (2026-11-23)

Frozen mounted source `cc21bb4e0df478933ffb4f9ec797020221919374`, scaffolding tree
`711cb44392daef192083059ebe33e55c988f4438`, browser host tree
`24bd709ce4b6f7c4243b00bf333264ec0f18a7c6`. ROOT's immutable portable/LLVM
reactors are built at `9d9329db3606cbe74c544271ad4b9bb1912a0eec`, SHA256
`13de39490fbdf176eac580b5dbac95daa6c8cddc1e80835fc3dacca4f2589738` /
`bd26f079e59b8807ed733f7d3da30d7b83b0a919dc8d784943e9c0ee22a210ac`.
Read-only originals and earlier f7 receipts remain unchanged. Absolute documented
overrides select own verified copies; eager default reads still have real files.
This does not relabel the reactors as cc21-compiled sources.

- `playground/tests/increment.test.mjs`: unchanged, all six cases pass including
  one-step call budgets, infinite continuation, left-to-right operands, captured
  assignment destination, static errors before effects, canonical reparse and
  LLVM execution. The example imports Foundation and defines its increment
  replacements; `tests/increment_builtin.tower` imports Tower for place-aware
  expressions. No ambient import repair is needed.
- `playground/tests/precedence.test.mjs`: explicit Bedrock import supplies the
  editable `@` grammar absent from the immutable seed. Its own numeric token
  supplies Number; no Foundation/Tower expression grammar is imported into these
  custom grammars. All six cases pass, retaining exact independent arithmetic
  answers, left/right aliases, chained equivalence, ambiguity negatives,
  nonassociativity, metadata cache reset and canonical equality. Existing JS
  tree evaluation is unchanged; no new semantic model was introduced.
- `playground/tests/replacements.test.mjs`: seed-only custom grammar retains
  Identifier/String and adds only its missing Number declaration. Revisions now
  explicitly include that successful declaration (base3, two aliases5). The
  Foundation assignment-vs-expression negative imports Foundation and expects
  revision1; its Unicode byte offset still derives from the complete actual
  source. All ten cases pass, including exact source/template/capture spans,
  shape, copied/generated counts, recursion/output/step limits and zero retained
  node/allocation deltas. The already-correct imported example is unchanged.
- New `playground/tests/fixtures/numeric_token.tower`, SHA256
  `94714b9fc6e9c64a3f0f646dcecd37937903b057d3ee54aa49825c2c7a0152bf`:
  one ordinary seed-supported `[number] token Number` declaration, transported
  unchanged by existing Node file reads into both custom grammars. No execution,
  mutable/shared owner, scheduler or hidden language import. Actual parser tests
  validate activation and replacement/template revalidation. Existing native
  `tests/syntax_replacements.tower` instead uses seed AttributeInteger and stays
  unchanged; its cases do not replace the browser expansion-span/preview checks.

`playground/tests/interpreter-invocation.test.mjs` remains **1/3 passed** on9d.
Its direct compiled Tower exports do not execute newly mounted fixture text.
Source checks compared exact9d/current blobs, not merely commit labels:

1. `tests/interpreter_invocation.tower:31` builds `interpreter_invocation_tests`:
   it pushes the parameter into `definition.parameters` but never populates
   `definition.locals`. `compiler/interpreter.tower:52` requires binding identity
   at `function.locals[local.index]`; `semantic_types.tower:913` / the parameter
   caller in `semantic_statements.tower:166` construct that registry in real
   checked functions. Thus the hand-built fixture is missing the current frame
   ownership contract. Its width4 export returns2, expected0. The uninitialized
   negative also lacks a local registry entry and currently accepts any error;
   its intended strict-storage cause is not established. ROOT/L1 should register
   both fixture locals with their actual indices and validate the exact strict
   error in a rebuilt affected test provider. No capture check should be relaxed.
2. `tests/semantic_world.tower:155` calls `evaluation_query_tests`, whose resource
   branch reaches `tests/semantic_resource_checks.tower:183-184` and requires a
   nonnull `work_signal_open()`. `host/work_portable.tower:11` deliberately returns
   null. The frozen binary independently confirms this: trap caller
   `0x14a660` in resource_trial calls `sem_require`; exported work_signal_open
   disassembles to `i32.const 0`. This is a portable-fixture capability mismatch,
   not evidence that ordinary isolated worlds fail. ROOT/L1 resource-fixture
   owner must retain all denial assertions with supported serial budget setup,
   plus the existing synchronized setup on threaded hosts. No skip/mock signal
   or compiler host-policy change was introduced here.

Both width8 loops stop before execution after their width4 assertion/trap;
subsequent combined world subcases are unrun. Stage publication test passes.
The existing Tower producers are already the exact reproductions; no redundant
JS model or untested replacement fixture was added. A diagnostic-output transport
probe preserved the same failures and emitted no extra cause; its temporary log
callback was removed. Those provider corrections require a rebuilt reactor and
remain explicit follow-up, not passed source changes in this batch.

Baseline10/25 -> final23/25, zero skips; final12.02s wall/11.05s CPU/317228KiB
peak RSS. Original and targeted failures retained under
`build/d1_ecs/browser_four_cc21bb4e`. Fixture-only changes do not alter production
cost; these are validation costs, not scaling/profile claims. No compiler build,
heavy lock, sanitizer, generation or deployment. Earlier four-file20/22 remains
historical and separate (stack/defer L2, pointer-alias L1). ROOT owns release.

## Eight-file ordinary Node follow-up at b3ac7aca (2026-11-23)

Source freeze `b3ac7aca41deca72f0944782c9f4a80526fc0256`, scaffolding tree
`f7bc350e1f7e911facc1d8d420a69267dcbafc00`; host tree before repair
`24bd709ce4b6f7c4243b00bf333264ec0f18a7c6`. Same immutable ROOT9d reactors
and hashes as the preceding entry: portable13de3949/LLVMbd26f079, public768.
Full hashes, source manifests, statuses and raw logs live in
`build/d1_ecs/browser_eight_b3ac7aca`. No compiler build, shared heavy slot or
D2 artifact change. Earlier23/25 and20/22 receipts remain separate failures.

| Path under playground/tests | Substantive finding and checked disposition |
| --- | --- |
| platform.test.mjs | Basic executable strings now import Foundation. Canonical sizeof assertion uses the exact array/pointer/integer representation, preserving dimensions, width and signedness. Existing library.platform import already supplies its grammar; left unchanged. All3 pass, including split UTF-8 bytes, foreign tables and typed argument negatives. |
| projects.test.mjs | Large source imports its language. Project-root fixture now transports the existing complete builtin collection, including foundation_syntax/types, and selects the entry by its path instead of assuming three library files. All8 pass; ZIP Unicode/order/link bytes, invalid paths, replaced FDs, file coordinates/effect order and import isolation stay strict. |
| raw-memory.test.mjs | Ordinary strings explicitly import Foundation; already-imported examples/libraries and empty allocator program stay unchanged. Graph/Fast, exact outputs/layouts, canonical types, raw LLVM IR, host byte views, target widths and allocator reuse remain checked.24pass, missing C archive1fail, preexisting absent native-Wasm1skip. No uninitialized-value, per-object bounds or lifetime guarantee was added to raw Foundation. |
| structs.test.mjs | Explicit Foundation inputs reach real checking. Primitive layouts are looked up by their actual names rather than obsolete first-four registry positions. Source-defined primitive names may be shadowed; duplicate declarations still reject. Obsolete rejection of ordinary struct copies/arguments/returns becomes concrete nominal mismatch and foreign pointer-ABI negatives, matching tests/struct_value_checks.tower. All12 pass, including exactly-once destination capture and node cleanup; no expected successful output changed. |
| templates.test.mjs | Tower imports and canonical array spelling corrected. Ordinary type values/struct arguments are supported, so the old negatives now test wrong value type and distinct nominal arguments. Exact interpreter call-depth/effect/local-struct diagnostics replace retired constructor-only wording; all no-output/zero-step assertions remain.6pass/2fail; two composed programs moved unchanged into Tower fixtures below. Following numeric negative cases are still unrun after the positive failure; their pending coverage is not passed. |
| wasm.test.mjs | Custom numeric grammar reuses numeric_token.tower; other seed-only cases retain the seed. Foreach example now has8 revisions/10 events; exact event/highlight sequences, step cursor and byte offsets remain asserted. Cache counts account for import transition; import cache is warmed before session-ownership counters, as in the existing ABI case. Foundation editing overrides the rule after its wrapper imports, pins the import before mutation, and retains invalid-candidate recovery. All15 pass, including exact shape/provenance/cache comparisons and zero warmed lifetime deltas. |
| module-scopes.test.mjs | All19 pass on9d, including qualified completion, hover and the full repeated ownership exercise previously blocked by completion. Direct LLVM loading now honors the same absolute override; baseline used older default6ec53230 for its single LLVM case, so only final matched-pair evidence adopts that case. No label, nominal or visibility assertion weakened. |
| semantic-port.test.mjs | Added only transport phase messages around existing compile/execute/reparse/LLVM boundaries. Baseline completed semantic layouts, language_control, language_collections and language_enums; the19-case file remains incomplete. The actual entity_pages source and all expected outputs remain unchanged. Details below; no skip introduced. |

The only production change is browser transport `src/tower-host.mjs:89`:
validate Foundation grammar before publishing its source to future imports.
Previously an invalid candidate threw but remained installed in the module input
map. The two existing configuration tests, repaired to use explicit imports,
reproduce failed recovery before the change and pass afterward, including pinned
sessions and the last accepted Word/call grammar. Tower's
`syntax_baseline_install` still owns parsing, diagnostics and baseline publication;
no JS grammar/semantic implementation or compiler method was added.

New Tower receipts, consumed by the existing templates compare transport:

- `scaffolding/tests/type_numeric_composition.tower`, SHA256
  `56ceefd2c94f7d9d6a5dc886a8574d817ae4d9f86d489801028067cf423295ac`:
  explicit language, two numeric nominal instances, wrapper pointer alias and
  integer-only constructor. Expected42/7/8/12/9. First graph32 check fails with
  `Compile-time expression cannot capture runtime storage: binding is mutable,
  escaped or lacks an initializer`, instantiation line1,column1. ROOT/L2 type
  preparation/capture follow-up; no capture policy workaround.
- `scaffolding/tests/type_identity_composition.tower`, SHA256
  `1086e0de7f5cac5e9b5af09bf2087e30412183d939181f0997ebfe62a5cd6e2d`:
  explicit language, pointer-valued generic call, transparent identity helper and
  nullary type helper. Expected42/7/8. First graph32 check fails with initializer
  dependency cycle `i32`. ROOT routes type/generic ownership; this is not asserted
  identical to L1's existing pointer-alias case. Later modes are unrun.

These are the smallest **demonstrated failing compositions retained here**, not
claims that their individual features fail. Four smaller controls (numeric
wrapper, integer-only constructor, local value shadowing T, identity helper)
passed existing32/64/canonical/LLVM comparisons; copies remain in the receipt
folder. Original composed assertions/outputs remain. Inspected generics.tower
registration/lookup and semantic_types preparation/interning context, but did not
prove a specific stale capture/ticket edge. No producer patch or speculative
root-cause claim. Native registration/execution of these new sources is pending
ROOT; they are registered only through the existing Node caller here.

Eight-file baseline hit its180s guard after60 completed reports; only the three
never-started files were then run (35 reports). The entity_pages follow-up had
its own60s guard, reached32-bit Graph/Fast and canonical checks, and last logged
`LLVM Foundation 32-bit optimize=false`. That phase includes LLVM reconstruction
and execution of its rebuilt Foundation; it did not return a completed receipt.
Its child reached80s observed CPU and1652696KiB observed RSS at59s. Parent GNU
 time excludes that killed/unreaped child, so its48276KiB is **not** the test's
peak. First-run sampling similarly saw1749880KiB. No deadline widening, false
success or leak diagnosis. Processes exited on the guards; dead children await
the container's reaper and hold no live compiler execution. ROOT/B2/A1 should
adopt the expensive reconstruction phase and remaining14 never-started cases
with their frozen milestone; the15 incomplete case receipts stay pending.

Final affected seven-file run:87pass/3fail/1existing skip,72.39wall/84.45CPU s,
495812KiB peak RSS,0swaps. Missing `build/linking/wasm-fixture.a` is the third
failure; missing native-compiled.wasm triggers the unchanged optional skip.
Foundation transport's equivalent two-case sample before/after:0/2 ->2/2,
1.82/2.76wall,2.25/3.05CPU s,168900/156484KiB peak, n1/fresh process. Passing
now executes the formerly blocked recovery assertions; no speedup claim. These
are validation costs, not universal scaling or current-source release evidence.
No native/compiler rebuild, sanitizer, generation or deployment was performed.

Publication reconciliation: `9b0ba0bb` merged published `f167c444` in
`4dcd13fc`, preserving both histories. The only changed recorded Node input was
D2's llvm-host artifact source-map/error-localization transport; inspected its
producer and consumer. Four affected canonical/LLVM/host-byte/alias-capture checks
passed on the merged host (17.61wall/16.60CPU s,434088KiB, no swaps). Original
seven-file aggregate and immutable9d compiler identities remain distinct. Six
recorded compiler/test resource deltas and new upstream files retain their owner
receipts; none relabels an old reactor as rebuilt. Exact manifest differences and
commands are in the journal and `browser_eight_b3ac7aca/merged*`. The two type
compositions, linking prerequisites and15 incomplete semantic-port cases remain
open; no full-suite, sanitizer or release acceptance claimed.

## Supplied-artifact adoption at bcd0e3ab (2026-11-23)

Source freeze `bcd0e3abf9bd2d970c771133b95d11990defb02c`; matching ROOTeac
portable df541c16 / LLVM87c8fbc9, full hashes and source manifests in the journal
and `build/d1_ecs/adoption_bcd0e3ab`. No compiler build. Earlier four-file20/22
and seven-file87/91 remain historical; this is focused changed-input adoption.

| Path / caller | Source review and executed evidence |
| --- | --- |
| tests/generic_stack_module.tower + generic-inference collection case | Unchanged explicit tower/library.stack input, initialized owner, deferred disposal. L2 deferred-module query preparation now reaches actual binding before checking. Complete collection case passes Graph/Fast32/64, canonical and LLVM, including vector/queue/stack cleanup and expected effects. |
| tests/generic_pointer_alias.tower + generic-inference nested case | Adopt L1 corrected pointer_type/type_value returns and explicit specialization for noninvertible representation calls. Structural T* deduction, nominal identity, two widths, operand order12, pointer size/null and combined nested wrappers all pass through existing compare. No new compiler semantics claimed. |
| forward-references/inference/foundation-storage Node callers | Exact source comparison to8b2bb2d7 retains earlier unchanged reviews. Current module forward/initializer-order cases and generic negative case pass; four Foundation storage host cases reuse identical producer/data independent of reactor. Remaining earlier compiler cases are retained historical evidence, not newly executed eac coverage. |
| raw-memory Node link tests + tests/foreign_fixture.tower/linking.tower | Real supplied Tower archive/native Wasm now execute full linkedOutput. Completion, callback export, tower-only imports, malformed archive failure and clean recovery checked. Two passes, zero skips. Corrected C title; raw Foundation memory policy unchanged. |
| tests/type_numeric_known.tower | New minimal immutable initialized usize capture; expected sizeof8 passes32/64/canonical and LLVM. SHA2560f5c0b3ef789cce402003a814c9e0ecf0dc0472ce830fae8728bd87d678f09bd. Plain declaration data, no dynamic owner escape. |
| tests/semantic_invalid/type_numeric_mutable.tower | Deliberately invalid counterpart: later write invalidates the known-size proof. Exact capture error before print123, zero steps/empty output pass. SHA2563290679e729fbe04449ba8aa99b6b788b90bd12b74f58edfd067c46ebb76f26b. |
| tests/type_numeric_negation.tower | Minimal valid -(-2) extent, expected size8; first Graph32 fails "Expected a compile-time integer argument". SHA256af6bcd0949168b4f84b3eecd6502ab35c48ab98c4b088ce5c8b942e032f81290. Source-confirmed literal admission skips staging while unary minus builds a nonconstant operation. ROOT/type-query owner repair pending; later modes unrun. |
| templates Node registration | Six numeric negatives run independently of two positive compositions. Exact type mismatch and invalid-bound/capture/effect assertions retained; no blanket alternate errors. Unsigned -1 now expects the array-bound diagnostic because negation wraps, and remains a visible failure paired with the valid negation reproducer. Existing L1-owned compositions unchanged and still fail. |

New Tower files use the ordinary compiler/interpreter through existing Node
transport only; no native registrations or executions claimed. All production
inputs and original positive fixtures are preserved. Initial focused adoption7/7;
final changed link/template selection8pass/4fail, zero skips,12.30wall/14.98CPU s,
345540KiB/0swaps. Two failures are the same newly exposed negation preparation
edge; two are the existing L1 compositions. This closes supplied-artifact and
former generic-stack/pointer fixture gates, not overall template or release
acceptance. ROOT retains semantic-port/reconstruction and final platform gates.

## Three lightweight semantic-port gates at f25799cc (2026-11-23)

Frozen `f25799ccbe62e6ab5b90f61432a7d13c1038e1bc`, supplied matching eac
portable df541c16/LLVM87c8fbc9; exact source/artifact manifests and commands in
`build/d1_ecs/semantic_light_f25799cc` and the journal. Shared Node registration
and Tower inputs untouched. Three independently anchored selections pass1/1
each, no skips/timeouts, concurrency1/fresh processes with separate180s bounds.

- `tests/semantic_invalid/{inference_cycle,layout_cycle,argument_type,literal_range,template_origin,missing_return,match_duplicate,match_range,match_type,match_scope,match_break,while_type,enum_mix,enum_number,enum_overflow,enum_duplicate,enum_operation,enum_address,enum_index}.tower`:
  reviewed actual invalid bindings/layouts/literals/control/nominal operations;
  all19 check interpreter errors at32/64 and exact LLVM-versus64-bit message/offset.
- `tests/layout_depth_source.tower`: existing ordinary Tower generator retains
  owned vector/disposal and emits the1024-dependency/512-field workload. Fast
  generation,32/64 generated execution and LLVM-produced Wasm all reach expected0;
  independent size/field checks retained. No duplicate generator or new runner.
- `tests/syntax_invalid/{match_default,while_braces}.tower`: deliberate missing
  wildcard/unbraced-body cases remain invalid under the current Tower grammar;
  both interpreter and LLVM reject both. No fixture/diagnostic relaxation.

Wall/CPU/peakKiB respectively6.62/8.30/327416,7.69/9.55/357812 and
6.01/7.40/317356;0swaps. All owned children reaped and input hashes unchanged.
These close only the three named gates on eac plus current mounted sources;
B1's heavy cases and all other unrun/release gates remain separate. Runtime
profiling is inapplicable to this documentation-only receipt; no speedup claim.

## Fixed Node execution checklist at 48db0f27 (2026-11-23)

Freeze `48db0f27b439e9d0c7bb15e6f0c4beb932650e89`. This is an execution-receipt
reconciliation, not a source census or new test run. The original shell glob
`playground/tests/*.test.mjs` still contains exactly51 files; nested Roku tests,
`test:ide`, Playwright and generation scripts are separate gates. Saved inventory
and current input hashes: `build/d1_ecs/node_inventory_48db0f27/`.

**P/F/S/U below mean passed/failed/skipped/unstarted at the named receipt only.**
No sums across overlapping selections are a clean full-suite result. New reactor,
host API or imported-resource bytes require affected adoption; a source build,
filtered test, rejected candidate or native-only success is not a Node pass.
Pure host/mock receipts may be reused where the producer, data and package lock
are unchanged. The current diff from the original run changes only compiler-build,
foundation-storage, llvm-host and tower-host among `src/*.mjs`; all other host
producers and package locks used by the host-only rows are unchanged. Compiler
receipts remain tied to their exact executable and resource manifests.

### Evidence keys and identities

Full reactor SHA256 values (short names in the tables are these identities):

| Pair | Portable | LLVM |
| --- | --- | --- |
| O, source2013ad28 plus older LLVM | `0b9d22e60d545e82e6079addd6c67e8e6c6ebc607036c5b4a8143ff4aca08bae` | `6ec53230a2d78bf49717139973682f6035174029124c4256875674708bdc50be` |
| F, sourcef7e764ab0807376025700b2a3176c6f6130e34a8 | `b755fdc8628567de5759eb0c4835c238c0cb1ab3eb2b492181a82982fbe5fc42` | `ba517692f67a9d7f53259af385d72e9f061df3bc45335e94b9db485224896543` |
| G, source9d9329db3606cbe74c544271ad4b9bb1912a0eec | `13de39490fbdf176eac580b5dbac95daa6c8cddc1e80835fc3dacca4f2589738` | `bd26f079e59b8807ed733f7d3da30d7b83b0a919dc8d784943e9c0ee22a210ac` |
| E, sourceeac16533ad7169988c53af934ece62e083b39bad | `df541c16c626453fae94553cae2e6d1285b6879bfe7778be363fe537a0d8fd99` | `87c8fbc90a9e0e56a3399155c5d63bcab9dcd57e4de5d89996f40c0238230472` |

All later pairs have ROOT's public768 provenance, not an implicit current build.
Paths below beginning `build/d1_ecs/` are preserved D1 logs/manifests; each has
actual commands/status, source identities and failed logs. The journal retains
owner commands and their external receipt locations.

| Key | Exact host/resource boundary and receipt |
| --- | --- |
| O1/O2 | `d5b65afee426f2576d44a60f44249010a15ace1d`, pairO; `node_transport_d5b65afe/before.log` (240s interruption) and `remaining.log` (completed continuation), `before_inputs.sha256`. O1 stops after three formatting cases; O2 repeats those three and completes the rest. Shared work artifact `b8a187c629a73845f19584e462034c2c9c58b65e57e80b9971b3d8901e5db67f`; no shared compiler/project/cross artifact. Module-resolution initially used portable5dfa4525, corrected in N. |
| N | Same freeze plus fc3f52da/69391085 transport/data delta, pairO; `node_transport_d5b65afe/final*`, `final_inputs.sha256`, `final_resources.sha256`, merged17-case check.47/49P,2F; module-scope alias failures not waived. |
| D | `ce4f7240392b283a2af9d8cf378a359b32aa7dda` plus explicit-import repair, portableO; `diagnostics_imports_ce4f724/`, preceding diagnostic audit above.10 diagnostics plus source-location control P. |
| F4 | `e0e3530b84472be5ba1bc4e331b74bab4dba01bd` plus8b2bb2d7 fixture/transport delta, pairF; journal “D1 four-file Node language fixtures”,20/22P. Exact unchanged forward/inference/storage blobs reused in E7; pointer source later deliberately corrected by L1. |
| G4 | `cc21bb4e0df478933ffb4f9ec797020221919374` plus499648cf/b8a14fa3, pairG; `browser_four_cc21bb4e/final*`, Node/resource/export manifests.23/25P; two export fixture failures later closed by R. |
| G8 | `b3ac7aca41deca72f0944782c9f4a80526fc0256` plus9b0ba0bb/3b3d6ee8, pairG; `browser_eight_b3ac7aca/final*`, `before.log`, final Node/resource manifests. Seven-file87P/3F/1S; four completed semantic-port cases are a separate partial receipt. Four merged transport checks P. |
| E7 | `bcd0e3abf9bd2d970c771133b95d11990defb02c` plus7f936c33/b90b6f4e, pairE; `adoption_bcd0e3ab/{adoption,final}.*`, host/resource/focused-fixture manifests.7/7 adoption P; final link/template8P/4F. Archive7a2ea4eeb2dd1ff89dcbf35292f709df7682fc75687da4531ff5fb6f2eb9d63e and native Wasmcc8387f92412874691521f841a8d38a33c1ebbe8cd6030bebf5b328cdb6e0d7e actually execute. |
| S3 | `f25799ccbe62e6ab5b90f61432a7d13c1038e1bc`, pairE; `semantic_light_f25799cc/`, c8e1d10b receipt. Three fresh selections P; host manifest a9378283a1c9fb36ba1c0a93015fc44ad80b614c71ea4786eaecd61659ebd6e1, resources65405ea53d0c8910a6a268ceced9ca645b4cc7c7fdc1dda137c0295dafc7ceb8. |
| R | ROOT merged578437af source/fixture check, portableE; journal “ROOT portable invocation/resource fixture repair and merged adoption”, ROOT_portable_fixtures_merged_578437af. Exact invocation/world/stage exports3/3P, not merely linked. |
| LL | D2 `e0e3530b` plus5ce2e0b9/9d466037, pairF; `tower-agent-2/build/d2_ecs/llvm_differential/` original8-case and remaining43-case logs plus focused repairs. Across those scoped receipts48 cases have P and3 resource cases F, not a clean51-case run. Host80be1da99218dca064251c36160d268baa4b3048a501237ff1a73ae860084671; resource manifest9c5364569020c82f028c2e66c817d52d5fccaedbc4a5ec02783ebf4d9b8a5f36. A1's later actual LLVM adoption is LA below. |
| PK | A1 full IDE/bytecode5-case P on9d source plus package-fixture repair, reactor0be1798cc07be921fb0b6da212064e4f5336fcfef1e3234915b517e7eb006130, input listf8adcaa8adaa314e94ba44a90a03d2fa1617191b257b70b0128efeaca94939bc. Later928764f3 package/map transport, mergedf6c0aec1 reactorab4f2c6c78c578bc5c2cbb982c2ef411eed7c484b8f52eb8b0d083ad55930684:6/6 bytecode gates P, actual normalized32-bit direct/reload/Memory rollback P. Actual narrow/body LLVM differential adoption is LA. |
| LA, received during publication reconciliation | A1 8de9ce72: sourcec8e1d10b7d08067deb040f3b04783f35b6555f4f plus scoped transport delta, pairE; scaffolding treec74c92ace782fa2994167848fc5d6113e4f0d043, host tree1d2209bbe79671caf9191154e5b4bd21dce5c14c, selected test SHAb6f495a509865a1d9db038be32828ed8b96ddf7148064210b64ab71b4274e779. `A1/cache/a1_llvm_cases_c8e1d10b` and journal “A1: actual paired LLVM-Wasm package gates”: narrow integers, resumable control bodies and division zero each1P/0F/0S in fresh processes. Graph/Fast, both LLVM Foundation profiles, prepared/independently loaded packages, canonical and executable LLVM assertions pass. Exact trap remains Division by zero/empty output/offset31. No whole51-case/current-compiler claim. |
| BP | D2 c8e1d10b plus145bae0a; current packaging test SHAa74681775486341c23960844b28b94415abfed6f60d2e71fbe1dedd91dcf9610 and build.mjs7da1520dfe99e3691c3f762b9e7893e1af2c64b82f88faf751badd82025266fc match. Packager9d257830c23ad71229805950a1d9aefb69ab2a9cbf6f50794f0e0be8d5ec13ef, public768. `tower-agent-2/build/d2_ecs/packaging_c8e1d10b/`:1/1P, synthetic91/78-asset bundles and five negative prerequisite paths; no real reactor execution or hosted release. |
| DL, final publication merge | D2 f7fa33c3/45db5aa9, freeze48db0f27 plus transport delta, portableE; `tower-agent-2/build/d2_ecs/dependency_language_48db0f27/`, input digest71b4555b202a4c52813c2459bfc0c912a072ebde3666169b2bde791b216422e2. Compiletime42P/3F of45 portable registrations;43 separately registered LLVM cases U on this boundary. Forward grammar3/3P plus unchanged E7 initialization case adopted. Test SHAs b0a680214e121511fc8225b6810a1063381e7c1c36c7ddff16b77c586af06b4d / a0e808f40d2c570979c6748a738d4decd9c5457ecc8fc94a0b6e56311bb91397. Portable checks deliberately use nonexistent LLVM override to verify capability separation. |

### All51 top-level files

Names below are under `playground/tests/` and end in `.test.mjs`. Original counts
come directly from O1/O2 TAP, including initialization failures rather than
invented per-case results. `T` references the finite unpassed worklist below.

| File | Original execution | Latest scoped disposition / remaining action |
| --- | --- | --- |
| backend-worlds | O1 1P | Historical export P; final changed compiler adoption only. |
| bedrock | O1 5P/9F | N14/14P, rejected-install recovery and lifetime assertions intact. |
| build-packaging | O1 setup F | BP1/1P; D2 synthetic contract closed, real packaging remains ROOT. |
| bytecode | O1 4P/1S | PK6/6P including formerly skipped export and new map-retention case; T4 distinguishes large LLVM cases. |
| c-source | O1 6F | No later Node closure located; T8. |
| comparison | O1 1P | Unchanged host-only producer/data; reuse O1. |
| compiler-bytes | O1 1P/2F | Buffer differential and reset/provenance remain unpassed; T8. |
| compiler-entities | O1 1P/3F | Entity/world-view/generic-registry execution failures; store export alone passed; T8. |
| compiler-threads | O1 2P/1F | Old work-Wasm pool/trap P; shared compiler ENOENT. New browser retirement receipt is not this Node suite; T5. |
| compiler-utf8 | O1 2P/1F | Utility interpreter/LLVM/canonical comparison unpassed; T8. |
| compiler-workers | O1 file-init F | Missing project.json, all8 registered cases U; generation success is not these assertions; T6. |
| compiletime | O1 27P/18F | DL42P/3F portable. LLVM-only c95b04a2/E receipt below:39P/4F, all43 attempted,45 portable registrations excluded. Three older-eac alias/type-body failures remain; body_continuation additionally prints1 instead of0 in emitted Wasm. Source/input-phase adoption remains ROOT/L1/L2; no full current-source file pass. |
| completion-queries | O1 4P | Unchanged mock transport producer/data; reuse O1. |
| cross-compilation | O1 7S | T7 now7/7P at84146755 plus explicit fixture imports / supplied eac cross reactor; see the source-bound T7 receipt below. Other-OS binaries emitted, not executed natively. |
| data-driven-scanners | O1 3F | N3/3P. |
| default | O1 6F | No later Node closure located; T8. |
| defer | O1 5P/1F | Foundation ordinary-identifier case unpassed; T8. |
| diagnostic-delay | O1 4P | Unchanged timer/mock boundary; reuse O1. |
| diagnostics | O1 10P | D10/10P with corrected explicit inputs/offsets; later input/host diff does not change this diagnostic transport. |
| execution | O1 4P/5F | Integer/type-error/pointer/control/edited-rule cases unpassed; T8. |
| fast-interpreter | O1 7P/6F | Example comparisons P; six inline arithmetic/storage/budget/CFG groups unpassed; T8. |
| for-loops | O1 4P/1F | Foundation ordinary-identifier case unpassed; T8. |
| foreach | O1 1P/6F | Only unsupported-protocol negative passed; T8. |
| formatter-port | O1 3F | Exact token mappings/numeric canonical/trials unpassed; T8. |
| formatting | O2 5P | Historical portableO P; O1's first3 are duplicate evidence, not extra cases. |
| forward-references | O2 4F | F4 4/4P; E7 module binding/order case adopted by DL; DL executes remaining three grammar cases on E. All four scoped P with documented input reuse, not a new combined run. |
| foundation-storage | O2 2P/2F | F4 4/4P; current producer/test/data byte-identical, reactor-independent reuse. |
| generic-inference | O2 2P/5F | F4 5P/2F; E7 closes stack/defer and corrected pointer alias in all compare modes, also deduction negatives P. Other four retain F4 receipt; no clean new7-case aggregate claimed. |
| hover | O2 6P | Historical Node transport P; real qualified/array hover also has A1 full IDE PK and G module-scopes evidence. No current missing-hover claim; final test reactor must include exports. |
| increment | O2 2P/4F | G4 6/6P. |
| inference | O2 7F | F4 7/7P; E7 module forward/effect-order case P. |
| interpreter-invocation | O2 1P/2F | G4 same failures; R closes all3 exact export groups (invocation4/8, worlds4/8, stage), portable serial capability correctly selected. |
| language-service | O2 3P | Unchanged mock worker scheduling/cancellation; reuse O2. |
| llvm-execution | O2 2P/49F | LL48 scoped P/3F; LA closes narrow/body and rechecks division zero. T3 struct remains unpassed; T4 records scoped closure, not a whole-file current-source run. |
| module-path-names | O2 2P | Current c93ddaab2/2P: actual resource paths/import availability and synthetic project upgrade checked; changed-resource gap closed at this freeze. Receipt below. |
| module-resolution | O2 13P with wrong default portable | N13/13P with verified override; new c93ddaab/47433acf13/13P with current language/module inputs. Exact case, lexical identity, relative boundaries and selected-file diagnostics retained; receipt below. |
| module-scopes | O2 file-init F | N17P/2F; G8 19/19P, qualified completion plus full repeated-lifetime case now reached, matching LLVM override. |
| operators | O2 6P | Historical pairO source/canonical/LLVM P; not relabeled current compiler evidence. |
| output-syntax | O2 8P | Unchanged display-only lexer/dependencies/data; reuse O2. |
| platform | O2 1P/2F | G8 3/3P. |
| precedence | O2 1P/5F | G4 6/6P. |
| projects | O2 6P/2F | G8 8/8P, complete explicit project-root resources. |
| raw-memory | O2 3P/22F/1S | G8 24P/1F/1S; E7 both missing-asset cases actually P with full linkedOutput, callback/export/import/recovery checks. All26 have scoped P, not one E26-case run. |
| replacements | O2 2P/8F | G4 10/10P. |
| semantic-port | O2 2P/17F | G8 first4P, interrupted at entity_pages; S3 three P. B1 four F; eight other framework groups lack matching-pair execution. T2/T9 below; no19-case pass. |
| source-location | O2 1P | D control P; unchanged host-only location/Unicode inputs. |
| structs | O2 1P/11F | G8 12/12P; separate LL large struct reconstruction still F, not the same file/gate. |
| targets | O2 25P | Unchanged host-only capability/selection mocks; reuse O2, not cross-target executable evidence. |
| templates | O2 8F | G8 6P/2F; E7 independent known/mutable/type-error negatives P. New47433acf pair closes all four T1 failures,4/4P on unchanged expectations; receipt below. Other registrations retain their previous source-bound receipts, not a new whole-file run. |
| wasi-host | O2 4P | Unchanged host ABI/memory/FS fixture data; reuse O2. |
| wasm | O2 6P/9F | G8 15/15P with exact revision/offset/provenance/cache/lifetime assertions. |

### Finite unpassed worklist and final-run commands

Use repository-root cwd and Node22.23.5-compatible test options. Before running,
freeze final host/resources and a **matching** complete artifact set, record
hashes and provide ordinary eager default paths still used by some callers.
For scoped ordinary files set absolute `TOWER_TEST_WASM` and
`TOWER_TEST_LLVM_WASM` to that pair; clear `TOWER_INTERPRETER_ONLY` so LLVM cannot
be omitted. These are commands for ROOT's final run, **not executed here**.

| ID / owner | Exact unpassed scope and next command / prerequisites |
| --- | --- |
| T1 — CLOSED four registrations on47433acf; ROOT final adoption | New matching portable/LLVM pair actually passes original numeric composition, generic binding/identity, unsigned-negative bound and nested negation,4/4 with unchanged expected outputs/diagnostics. Receipt below supersedes old unsupported-original-wrapper and unadopted-negation wording. Separate numeric-only ordinary wrapper admission remains L1-owned; the three compiletime alias/type-body residues still fail in both selected modes on this new pair. No broad type-function completion claim. |
| T2 — L2 reconstruction, ROOT | Four separate cases `entity_pages`, `entity_tables`, `work_graph`, `work_resume`. [B1 receipt](semantic_port_four_bcd0e3ab.md), bcd0e3ab+7cfb6531 transport / pairE, all fail at32-bit unoptimized LLVM Foundation with `Compiler resource request failed`, before reconstructed execution/optimized64/native stages. Original32 Graph/Fast/canonical phases P. Saved canonical input plus incomplete typed-error propagation handoff belongs to L2 now; generic error is not proven Memory/Capacity. Use the per-case command below after producer/diagnostic repair. |
| T3 — L2 reconstruction, D2 evidence | `node --test --test-concurrency=1 --test-name-pattern='^LLVM matches interpreter: struct values$' playground/tests/llvm-execution.test.mjs`. D2 full source / pairF freeze578437af remains failed/90s incomplete inside unoptimized LLVM Foundation. Small struct_reconstruction_small passes, not a full-case fix. Receipt/source/canonical hashes in journal “D2 bounded struct LLVM Foundation isolation”; input2ce1c260ebe11faeb2dc7524f1e0f239208caf8afc629962b800200e7052f285, canonical2f4602e298b100c6e93dc47798a515c118d12cf42e53da330a7faa88167c2601. |
| T4 — CLOSED on LA; ROOT final changed-input adoption | LL's narrow/body package failures are superseded by LA's actual end-to-end passes, including independent load/execute. Preserve separately scoped evidence; no extra repeat for unchanged inputs. If final reactor/caller inputs change, selectors are `--test-name-pattern='^LLVM matches interpreter: narrow integers$'` and `'^LLVM matches interpreter: resumable control bodies$'` in llvm-execution.test.mjs, retaining all original profile/output/offset/canonical assertions. |
| T5 — ROOT/B2 shared retirement and Node adoption | [f167c444 receipt](compiler_shared_browser_f167c444.md): shared compiler8e7e3d637c6820c6d96204662dd4b6025722099e595ef3704f704125d7405eb4, work6411c389b9610c293b98dcc844e00195fcfeecbf0b4e53b8c84189ef78d4e32c, resources67561156ce8afa76460323b29d96ea5400603e31dabcf9dc9c080f5cdfea264b. Strict browser retirement repeatedly fails; once-passing rejected candidates/older D2 passes do not close it. Run `TOWER_REQUIRE_THREADS=1 node playground/scripts/test-shared-compiler.mjs /absolute/shared/tower.wasm /absolute/shared/tower-work-tests.wasm REPORT.json`, then the Node compiler-threads file with real matching work/compiler bytes and no skips. Chromium/Playwright and resource manifest must match the accepted repair. |
| T6 — ROOT/B2 worker artifact adoption | `node --test --test-concurrency=1 playground/tests/compiler-workers.test.mjs`. All8 cases were unstarted at missing build/compiler-project/project.json. Supply final project manifest/resources and build/browser-wasi-llvm/tower-llvm.wasm; this file imports the raw LLVM loader and worker entry, so generic fixture overrides alone are insufficient. Two edited9d generations prove their own script, not these eight output-order/cancel/generic/iteration/vectorization cases. |
| T7 — CLOSED at84146755/eac; ROOT final artifact adoption | Seven fresh exact selections now pass with explicit Foundation imports; full receipt below. For changed final artifacts, use `env -u TOWER_TEST_LLVM_WASM -u TOWER_INTERPRETER_ONLY node --test --test-concurrency=1 playground/tests/cross-compilation.test.mjs`, supplying build/browser-wasi-llvm/tower-cross.wasm and all targetInputs files. A generic LLVM override would silently select the wrong reactor. Retain native-emission versus actual Wasm-execution distinction. |
| T8 — ROOT to assign; eleven original files without later Node closure | `node --test --test-concurrency=1 playground/tests/{c-source,compiler-bytes,compiler-entities,compiler-utf8,default,defer,execution,fast-interpreter,for-loops,foreach,formatter-port}.test.mjs`. Do **not** silently delegate this to L1/A2's unrelated fixes. Exact failed groups/counts are above and original logs remain O1. These Node files are unchanged since69391085; imported resources/providers have advanced. Observed old failures include implicit-language strings, older LLVM integer_type reconstruction and generic_registry's Tower-owned compiler_buffer_allocation_size provider. Matched-pair/resource adoption and fixture triage are required before classifying current compiler defects. Keep malformed/seed cases deliberate. Compiletime now has DL's separate disposition, not an unassigned failure. |
| T9 — ROOT framework scheduling, then relevant producer owner if failing | Eight exact semantic-port cases lack a matching-pair pass: `entity_stage_ownership`, `work_access`, `work_observe`, `compiler_work`, `compiler_batch`, `backend_popcount`, `backend_stack`, `backend_import_constants`. They failed under O's mixed artifacts; were unstarted after the G8 interruption; B1/S3 did not select them. Native fixtures and R's stage export are not these full Graph/Fast/LLVM32/64/canonical checks. Run separately with the command below. |

For each name in T2 or T9, use a separate bounded process; the example selects
only work_access and cannot enter the other framework cases:

```sh
TOWER_TEST_PHASES=1 timeout -k 5s 180s node --test --experimental-test-isolation=none --test-concurrency=1 --test-name-pattern='^Tower work_access agrees across graph, fast, LLVM and Foundation text$' playground/tests/semantic-port.test.mjs
```

For T1 the directly copyable alternation is:

```sh
node --test --test-concurrency=1 --test-name-pattern='integer type arguments preserve|generic calls bind types|negative unsigned argument|nested integer negation' playground/tests/templates.test.mjs
```

DL's three portable failures belong to ROOT/L1/L2's alias/type-body adoption,
separately from A2's numeric repair. Exact follow-ups on the final capable host:

```sh
node --test --test-concurrency=1 --test-name-pattern='^(decltype_type_fields|inference_alias_invalid|parameterized fields).*\(portable\)$' playground/tests/compiletime.test.mjs
node --test --test-concurrency=1 --test-name-pattern='^(decltype_type_fields|body_continuation|inference_alias_invalid|parameterized fields).*\(LLVM\)$' playground/tests/compiletime.test.mjs
```

DL makes LLVM/stress loading lazy without omitting default assertions. The second
command now selects only the four failures from the completed c95b04a2/E LLVM
receipt, after their repair/target-input diagnosis and matched artifacts. Exact invalid inference expectation
remains `Cannot infer type argument 'T'; pass explicit type arguments`, not the
observed general-compile-time-execution capability error. Both alias positives
still expect0; later modes were not reached after their Graph32 failure.

For the Node part of T5, use `TOWER_TEST_WORK_WASM=/absolute/shared/tower-work-tests.wasm`
and `TOWER_TEST_WASM=/absolute/shared/tower.wasm`, `TOWER_REQUIRE_THREADS=1`, then
`node --test --test-concurrency=1 playground/tests/compiler-threads.test.mjs`.
The eager build/browser-wasi-threads/tower.wasm read must also exist. A portable
ordinary override is inappropriate for that group. Keep cross/shared overrides
separate from ordinary selections; a single global pair override over all51 files
would not identify the reactors intended by those callers.

BP is **closed**, not another unassigned failure: current test/production hashes
match D2. If final packaging inputs change, its exact command is
`TOWER_PLAYGROUND_ASSET_PACKAGER=/absolute/public-built/package_playground_assets TOWER_REQUIRE_BACKENDS=1 TOWER_REQUIRE_THREADS=1 node --test --test-concurrency=1 playground/tests/build-packaging.test.mjs`.
It uses synthetic bytes/notices, never compiler execution. Actual real-asset
manifest/CNAME/provenance/hosted checks remain ROOT's release gate. Likewise PK
needs a test reactor exporting ide_package_tests; absence must not turn its
optional old skip into acceptance. Full IDE/node/build/runtime identities remain
separate. No additional test, build or profiling ran for this checklist;
documentation-only runtime performance is inapplicable.

Publication reconciliation is limited to received receipts, not a new freeze or
census. Normal full-history merge b6f6893b preserves checklist commit1cfd775c
and incoming published bda11a9b. LA closes T4; A2's native repair advances T1's
implementation status but not its browser result. Only llvm-execution.test.mjs
changed among the recorded Node/host inputs; its current hash matches LA above.
A2's separate semantic_type_values/fixture/registration deltas retain their own
native evidence and are absent from E's compiler bytes.

ROOT's351f9e9f control adds two strict Windows Chromium159/Playwright1.65.1
retirement passes with B2's exact frozen compiler/work bytes. It does not close
T5: Linux failures remain, and Windows serialized resource hash
97b3a30fdda7482932070c0c0a6b56a077a4d3c1e84efea4ccb48d91686b5bd8 differs
from B2's67561156 identity. Ordering/serialization equivalence is unproved;
ROOT's journal records exact verified archive and host boundaries. Preserve both
outcomes and the outstanding Node compiler-threads/worker gates.

Final normal merge614aaa30 also includes DL and ROOT's native generation/policy
receipt35b93404. DL supersedes the earlier twelve-file triage count: eleven remain
without later Node closure, while compiletime has the explicit partial receipt
and assigned failures above. Its two current test hashes match DL; no new D1
execution. ROOT's generation is separately source-bound and does not execute
the remaining Node groups. This finite receipt adoption ends the reconciliation.

## T7 cross-target execution at 84146755 (2026-11-23)

Frozen host/resource source84146755f49035aae60a983d6db2a682a3051201 plus the five
explicit `import foundation;` prefixes in cross-compilation.test.mjs, final SHA
`dbd4fefbe7c3610e8b87d8999617884a2c7ed656f4003f065f7a367ee47f31d4`.
Supplied cross reactor sourceeac16533 / SHA
`e860e9c59717800e416d4dc0eeeda5938be24049c7dd55a05d5efbcd3af561d1`.
Archive3ae60fc20303f8b91b8398e3eda0dd6c2939c60bdb4a6c03e5c207fec1c452a1
and all eight selected entries (cross plus seven target files) match files.json.
No default artifact was overwritten; previous portable/LLVM artifacts untouched.

Each of WebAssembly, Windows x64, Linux x64/ARM64, macOS x64/ARM64 and linker
recovery ran in a fresh process, concurrency1,120s bound. Baseline0/7: six fail
at the unimported library source after successful main/repeat emission; recovery
fails before linking. Repaired7/7, zero skips/timeouts/cancellations. All original
assertions remain: executable magic, deterministic repeated bytes, native
allocation signature/disassembly, library object/no tower_main, external answer
linking, real Wasm outputs5/84/42/4/41/42 and42, Link failed then successful compile,
unknown-target diagnostic. Existing cross_target_program.tower remains unchanged;
no compiler/semantic implementation was added. Other-OS output is emission, not
native execution there. No whole-current-compiler/browser release claim.

Logs/manifests `build/d1_ecs/cross_84146755/`; journal has exact command and per-case
costs. Final summed wall/CPU25.30/37.35s, maximum individual peak379228KiB,0swaps.
These are validation costs, not equivalent-success production performance data.
Fixture-only boundary repair has no production optimization/scaling claim. No
compiler build, repeated aggregate, generation, sanitizer or unrelated gate run.
All owned jobs drained and shared heavy lock released before publication.

Merged adoption66657986 retains all T7 test/host/artifact hashes. The only changed
existing mounted resource is A1's tests/stress/comment_functions.tower, outside
these executed imports. Its mismatch is preserved in merged_resources_check.log;
the original full-registry identity is not relabeled as a fresh merged test run.

## LLVM-only compiletime selection at c95b04a2 (2026-11-23)

Frozen sourcec95b04a2d841ff7fb951b51e77319ee4fd1acb25, unchanged test SHA
b0a680214e121511fc8225b6810a1063381e7c1c36c7ddff16b77c586af06b4d, matching
supplied eac portable/LLVM pairE. One suffix-filtered aggregate completed within
180s:39P/4F,0unstarted selected registrations,0skips/cancellations/timeouts;
45portable registrations filtered out, not executed or counted as passes.

| Selected group | P | F | Unstarted registrations |
| --- | --- | --- | --- |
| Lazy signature / demanded body negatives | 2 | 0 | 0 |
| Source + canonical execution positives | 14 | 2 | 0 |
| Stage/dependency/execution diagnostics | 23 | 1 | 0 |
| Generated parameterized-field chain | 0 | 1 | 0 |

Failures retain independent expectations: decltype_type_fields cannot complete
Graph64 canonical setup (`Unknown type constructor 'alias'`); inference_alias_invalid
gets the earlier general-compile-time-execution capability error at LLVM32;
generated type_fields fails LLVM32 alias admission. Those source-bound older-eac
results need L1/ROOT wrapper/type-body adoption, not changed diagnostics.
body_continuation completes Graph64 canonical setup but emitted Wasm returns1
instead of0. The loop does not label original versus canonical input, so the
failing iteration is unresolved. It prepares64-bit canonical then targets default
wasm32, unlike A1's already passing same-target LLVM/package case; this observable
setup difference is not yet a proven cause. ROOT owns that input/target isolation.
No memory-error inference, producer repair, expectation weakening or fixture edit.

Logs/names/manifests: build/d1_ecs/compiletime_llvm_c95b04a2/. All43 completed names
match the preflight list exactly. Only the selected type_fields stress producer
runs; other generators stay lazy.16.25wall/21.14CPU s,476656KiB peak,0swaps,
exit1. No source changes or compiler build; timing is validation cost, not a
production before/after or scaling measurement. All owned jobs drained, shared
heavy lock released. Later phases within failed cases remain unpassed as detailed
in the journal; completing registrations does not imply all their assertions ran.

Reconciliationaaf01529 preserves selected test/host/fixture inputs. L1's newer
5cb0b061 wrapper implementation and unrelated registered test additions are outside
the eac executable and measured resource identity; their source/native receipts
are not substitutes for this still-required joined-artifact adoption. No rerun.

## Changed-producer browser adoption on47433acf (2026-11-23)

Mounted source18384965d21ee5f710b05db3623f13668d68c993; supplied reactor build
47433acff17e8ca6b3fffb6ce9875a37b38aec08, portable SHA
68cd7a8afee1bce0ea6d2bc2009fbe31fc3cb3a3ef3b2e79fae9deb3661364ad and LLVM SHA
9cef90394ef441ca8bb3d1f5a24626d27d1a81437508561aa9d9740fba6570c6.
Both verified before/after; new isolated copies, old eac inputs/receipts preserved.
Unchanged templates/compiletime tests select exactly4/3/3 in fresh bounded
processes, concurrency1, no body_continuation or other file selections.

| Selection | Pass/fail/unstarted registrations | Wall/CPU seconds; peak KiB |
| --- | --- | --- |
| Four T1 templates | 4/0/0 | 6.90/8.87;350964 |
| Three portable alias/type-body residues | 0/3/0 | 3.80/4.45;212296 |
| Same three LLVM residues | 0/3/0 | 5.83/7.29;351332 |

All0skips/timeouts/swaps; excluded12 template registrations and85 per compiletime
process are not passes. T1 retains numeric output42/7/8/12/9 and one nominal
specialization, generic/effect/identity expectations, nested negation8 through
Graph32/64/canonical and actual LLVM source/canonical execution. Unsigned-1
retains exact array-bound diagnostic, empty output and0steps. No substitution of
original positive fixtures or unsupported numeric-only ordinary wrapper claim.

Remaining source-specific failures: decltype_type_fields gives Unknown type
constructor 'alias' at Graph32 portable / Graph64 LLVM canonical preparation;
parameterized-field256-chain fails Graph32 / LLVM32 compilation with the same
error. inference_alias_invalid gives the earlier general-type-body capability
error at Graph32 / LLVM32 instead of Cannot infer type argument 'T'; pass explicit
type arguments. Later Fast/64/canonical/executable modes stop at these assertions.
These now persist on the new producer pair; they cannot be dismissed solely as
older-eac failures. ROOT/L1 own exact alias/type-body admission follow-up; existing
Tower sources/hashes and full logs suffice, no duplicate producer implementation.
D2 retains the separate old-eac body-continuation investigation.

Evidence build/d1_ecs/adoption_47433acf_18384965/, exact patterns/expected names,
TAP/status/time and artifact/host/resource/fixture manifests. All names matched;
no source or expectation changes. Documentation-only runtime profiling is
inapplicable; costs above measure adoption, not compiler speedup or scaling.
Jobs drained and owned heavy lock released before reconciliation/publication.

Merge2d8a96fe leaves selected test/host/artifact and executed import hashes intact.
The sole resource delta, tests/frontend_units_profile.tower, is an unexecuted
native profiling fixture; its recorded mismatch does not relabel the earlier
full registry as rerun. Scoped4P/6F evidence reused, no further selection.

## Module-path/resource adoption at c93ddaab (2026-11-23)

Frozen sourcec93ddaabdd961c4be27d825ae4e3bf59575ec303. Fresh runs only of
module-path-names2/2 and module-resolution13/13 pass, zero skips/timeouts; no code
or fixture changes. Both matching47433acf overrides verified; path test uses no
reactor and resolution uses portable68cd7a8a only, not LLVM execution evidence.
Exact names, commands, hashes and TAP/time/status: build/d1_ecs/module_paths_c93ddaab/.

Actual inputs reviewed: path test scans1151scaffolding and3browser Tower fixture
paths, checking identifier/underscore components, dotted production imports and
local/library availability. Compared with originald5b65afe there are35added
scaffolding test files and2browser fixtures; all are included in this fresh scan.
Test/invalid import contents are deliberately excluded from the production-import
assertion. The upgrade test supplies a synthetic recipe, not generated project.json;
unchanged old names retire, edited/user files survive, active entry updates and
repeat upgrade is idempotent. Historical hyphenated user strings remain deliberate.

Resolution imports compiler-fixtures' resource data but directly uses the real
host with five root language files (bedrock,foundation,foundation_syntax,tower,
types) and explicit case modules. All1151 sources are read by the fixture loader;
they are not all configured or compiled by these cases. The five baseline files
and project-refresh implementation match the older receipt, while actual new
portable execution validates renamed grammars, capability removal/recovery,
nearest-file cache edits, cycles, lexical dotted/quoted/separator identity with
once-only effects, exact case/extension, parent boundaries, comment/alias canonical
formatting and selected errorFile values. No realpath/symlink identity collapse,
native filesystem equivalence or numeric-offset coverage is inferred.

Costs wall/CPU s/peakKiB: names0.36/0.43/62296; resolution22.76/25.22/223384;
0swaps. These are validation costs, not production profiling/scaling. Inputs
verify unchanged after runs; jobs drained and owned lock released. Other fixed
checklist gates and ROOT's final joined runtime release remain separate.

Mergedcd4f85b0 adds11numeric-wrapper fixtures. Only the affected two-case host
naming check reran:2/2P on1162scaffolding+3browser paths,0.48wall/0.55CPU s,
62272KiB,0swaps. Resolution's actual five baseline language files, functions
example, test and host bytes still match, so its13passes are reused without a
repeat. Separate merged resource manifest/receipts preserve both input boundaries;
new producer sources do not become a newly built47433acf reactor.

## Numeric-only wrapper independent review at 22e15d5b (2026-11-23)

Fixed source `22e15d5b8e459cd63417234cf2b8198a85dc283d`; implementation
`0c1d24ddb7d08795746841def2c09e06a4b1f25a`. All sixteen changed Tower files and
`cmake/TowerWorkTests.cmake` have identical blobs at those two commits. This
adopts that delta after A1's unchanged-context review at `9caa921c`, without
extending the freeze to later alias work or the pulled `fcaad5a6` source.
Disposition: no concrete defect found in the inspected producer/caller closure;
source adoption is separate from the owner execution evidence below.

Paths in the following producer table are under `scaffolding/compiler/`.

| Path / fixed blob | Substantive finding |
| --- | --- |
| `generics.tower` / `9649a3d2` | `generic_register_result` attaches parameter metadata to a successfully read single-return `CoreCall`, but returns the existing `GenericKind.Ordinary` for a numeric-only function. `sem_register_template` in `semantic_types.tower` branches on that returned kind, not metadata presence; ordinary calls remain in the function registry. Registration rejects foreign stores, stages and active views. Deferred instantiation now retains the ordinary wrapper's body source, uses the existing definition/count/argument-entity cache key, attaches the clone to the world root before registry publication, and releases the local reference. `generic_lookup` binds through the clone's defining template; no global type registry or second representation is introduced. |
| `semantic_constructor_work.tower` / `0abf6ac1` | Both known calls and body admission use `sem_constructor_wrapper_definition`. Each link resolves a declaration from its syntax/module, requires a single-return call with textual result `type`, rejects a formal callee/global value and repeated declaration, and must end at an existing type constructor. The first signature must have a source-resolved non-type parameter; the Parameters phase then checks actual integer types. General/effectful bodies and dependent/structural parameter signatures fall back to ordinary execution. `sem_constructor_arguments` binds arguments left-to-right through existing type/constant queries; unknown/written extents are not accepted as runtime layouts. Clone/Alias and ordinary Execute retain shared declaration/evaluation dependencies and prior instance errors, rather than recursively completing helpers. |
| `semantic_body_work.tower` / `7a5a8201` | `sem_body_needed` tests demand first. Only an undemanded original function with a nonpointer type result, nonempty all-integer signature and successful forwarding proof gains the new exclusion. Original exports/externs, other signatures and general bodies remain retained; generic clones retain their prior demand rule. Pruning stably compacts the function index, generated items and root items using the same predicate; it does not destroy definition entities or transfer ownership. The original declaration remains world-owned for clone provenance and nominal binding. |

Reachability trace: `semantic_values.tower:sem_call` puts the resolved ordinary
declaration or specialization in `KCall.binding`; indirect calls retain their
callee as `value`. `semantic_types.tower:sem_function_reference` and
`semantic_evaluation.tower:sem_evaluation_value` produce a `KFunctionReference`
with the actual declaration binding. `semantic_iteration.tower` likewise binds
generated protocol calls. `sem_body_collect` walks canonical owned expression
edges, including `value`, arguments, branches and bodies, collecting both kinds;
it deliberately skips definition bodies and type/back-reference edges.
`semantic_statements.tower` finishes root expressions before `sem_bodies` enables
root demand. Evaluation expressions are scanned separately. Workers use private
`body_seen`, scratch and call vectors; `sem_body_wave` uses the existing leases,
view, admitted dispatch and `semantic_context.tower:sem_stage_wave` join/stage
publication boundary before the coordinator publishes demands. Completed bodies
publish calls once; progress and the reset scan admit newly demanded earlier
functions before quiescence. Pruning follows this pump and returns immediately
on an existing semantic error. Thus the inspected reachable-reference paths
retain their original body (and its ordinary diagnostics), rather than leaving
a removed callable binding in successful output. This is source reasoning, not
an exhaustive reachability or race proof.

`semantic_modules.tower:sem_owner` follows generic origin back to the definition;
`sem_resolve` uses that module and qualified import identity. Constructor
instances retain construction owner/identity; their scope comes from the
definition, not coincident caller offsets. Proof-cycle detection only declines
the optimization; actual dependency cycles still belong to the owning shared
pipeline's quiescent failure path. No scheduler, capture evaluator or lifetime
policy changed. Existing checked scratch allocation and stage/drain machinery
are reused; this review does not add allocation-failure or cancellation execution.

Fixture/provider paths below are under `scaffolding/tests/`; each row was read,
including its imports and actual registration/consumer.

| Path | Coverage and disposition |
| --- | --- |
| `numeric_wrapper_minimal.tower` | Local numeric-only forwarding shares `buffer(i32,2)` identity; independent output remains `42 / 8 / true`. Preserve. |
| `numeric_wrapper_module.tower` | Imported `Extent` alias, direct/forwarded/nested count+1, typed-wrapper bridge and byte layout providers; consumed by positive and negative fixtures. Preserve. |
| `numeric_wrapper_known.tower` | Repeated/distinct nominal arguments, imported aliases, target-width layout, known locals and caller shadowing; staged `extent` checks ordered two effects, module initializer timing stays observable, ordinary callback has exactly one effect, untaken mutable read creates no dependency. Output remains42. Preserve. |
| `semantic_invalid/numeric_wrapper_unknown.tower` | Runtime formal extent remains unknown even when its caller passes2. Preserve rejection. |
| `semantic_invalid/numeric_wrapper_written.tower` | Later write disqualifies the local extent from known binding. Preserve rejection. |
| `semantic_invalid/numeric_wrapper_mismatch.tower` | Forwarded extent2 cannot accept a nominal extent3 pointer; expected buffer types remain distinct. Preserve exact mismatch. |
| `semantic_invalid/numeric_wrapper_order.tower` | A helper reads a later initializer while computing the earlier extent; preserve initialization-order error. |
| `semantic_invalid/numeric_wrapper_effect.tower` | Ordinary trap before returning a constant nominal type must reach the staging capability error, not the strict forwarding path. Preserve. |
| `semantic_invalid/numeric_wrapper_runtime.tower` | `var callback = runtime; callback(2)` demands the original numeric wrapper; its unbound extent must reject. This specifically exercises function-reference retention. |
| `semantic_invalid/numeric_wrapper_cycle.tower` | Extent depends on `sizeof` its own numeric wrapper; preserve actual shared query-cycle failure. |
| `numeric_wrapper_checks.tower` | Registers all seven invalid sources with their independent expected diagnostic substrings; shared checker compares complete diagnostics/offsets across width4/8 and workers1/4. Count comes from the path array. |
| `nominal_wrapper_checks.tower` | Shared checker retains the four older nominal failures, adds explicit work-budget import, requires no partial program and zero admitted lanes, then checks stable bytes/live grants and diagnostics on terminal retries. Each batch closes before its source buffers. Stable retained ownership is not zero retained memory or proof of exactly-once effects in every path. |
| `lr_work_main.tower` | Explicit `numeric-wrappers` returns after this checker; `all`, `type-smoke` and `type-errors` each invoke it once. No duplicate fixture inclusion in `all`. |

`cmake/TowerWorkTests.cmake` adds the two positive files at workers1/4 through the
existing `towerc --interpret` command with explicit Bedrock/Foundation resources;
the minimal regex preserves42/8/true, the broad fixture42. Those four registrations
are distinct from the negative runner selector and from canonical/Graph/Fast
checks reported by L1; CTest registration itself proves none of those executions.

Execution adoption: the journal's **2026-11-23 L1 — numeric-only known nominal
forwarding** receipt and its **Numeric-only L1 reconciliation** retain the exact
implementation, compiler SHA `9cc9ec7bdae3d37bf84c41d7e28743149c73fa85c8f847322b9040378ab24e7b`
and runner SHA `03f247c3a40cb9fa1acefee3610366ae042b3ce897e2f8134021fd97ea889866`.
They report both widths/workers, canonical equality/idempotent reparse and
Graph/Fast positives, four CTests,28 negative trials, query-smoke and integer
arguments; prior failed probes remain recorded. D1 verified the changed blobs
against that publication without independently authenticating L1's external raw logs. Small n1
paired samples and their256–908KiB RSS increases retain their original limits:
worker count is not measured overlap or useful scaling.

No new execution, build, performance or sanitizer campaign was run for this
documentation-only review; runtime profiling is inapplicable. Dedicated
export/extern pruning and direct-call-only numeric-wrapper regressions are not
present in this batch (guards/call paths were source-reviewed). Existing47433acf
browser artifacts predate this change, so their receipts cannot validate it.
Joined browser/backend/generation/instrumentation adoption remains ROOT's work;
the three later alias/type-body repairs remain outside this freeze. No concrete
new defect or duplicate implementation is handed to L1. Exact changed/caller
blob manifests: `build/d1_ecs/numeric_review_22e15d5b/`.

## Unpublished L2 reconstruction draft review, snapshot 2130 (2026-11-23)

This is source review of **unpublished draft data**, not adoption or a build.
ROOT's `ROOT_l2_source_review_2130` manifest freezes UTC
`2026-11-23T21:30:29.4611350Z`, published base
`779de775b227f7f9bba1bcaa35cc420a4e7f0bb7`. Archive SHA256
`0405e5479f92b734c124dfdfe81c0f2e3097eb4fbf9746e5d395bef74649455f` and manifest
SHA256 `b422e2014d8b8836900e3d88b9018891440cc2def2062af60e8e4ca40fec93ca`
verified, along with all twelve copied file hashes and lengths. Compared these
copies with `git show` of that base; later L2 edits are excluded. Local evidence:
`build/d1_ecs/l2_review_2130/{snapshot.sha256,draft.diff,base/}`. No draft source
was installed into the working compiler/import closure.

**R1 — concrete byte/text boundary defect; L2/ROOT adoption blocker.** In the
copied `backend/import_module.tower:bi_initializer` (lines21–50), every nonzero
byte run becomes `KString`. For an i8 constant array `[65,0,128,255,0]`, this emits
a string payload containing raw `80 ff` hex. `compiler/format.tower:format_escape`
escapes delimiters, slash and selected whitespace, but writes those high bytes
unchanged. The result is not UTF-8 Foundation source: the existing
`lexer_table.tower:lex_table_match` stops when `tower_utf8_decode` returns0, and
`syntax_scan.tower:scan_after_skip` marks an unmatched token invalid. Independently,
`playground/src/llvm-host.mjs:string` uses UTF-8 TextDecoder, which cannot preserve
those isolated bytes if such text reaches the host. This is a source-confirmed
failure of the arbitrary-byte case, **not an executed draft reproduction**;
no observed full frontend diagnostic/offset or browser result is claimed.

The LLVM API precondition is satisfied but insufficient for text encoding:
`LLVMIsConstantString` recognizes i8 arrays, not UTF-8 or absence of interior NULs;
`LLVMGetAsString` returns the counted raw array, including trailing NULs.
Verified against LLVM19.1 [C API implementation](https://github.com/llvm/llvm-project/blob/llvmorg-19.1.0/llvm/lib/IR/Core.cpp#L1517)
and [ConstantDataSequential contract](https://github.com/llvm/llvm-project/blob/llvmorg-19.1.0/llvm/include/llvm/IR/Constants.h).
The existing zero-run fill correctly avoids source NULs; it does not repair
non-UTF-8 nonzero runs. Small proposed **Tower** regression: in the existing
backend import test provider, construct the five-byte payload above using the
already declared `LLVMConstStringInContext` with count derived from the array
type and `no_null=1`; import it through the existing stage, format/reparse and
execute, requiring all five exact bytes and untouched surrounding sentinels.
This directly controls the constant-data-array input instead of depending on an
optimizer to synthesize it. The minimal implementation boundary is the byte-run
producer: preserve unsupported text bytes with existing numeric store/fill
operations (or another proved existing byte-preserving path), without changing
Unicode values, accepting malformed text or introducing a new bytecode format.
No concurrent repair or unrun regression was added by D1.

All paths in the table are under `scaffolding/`. SHA256 values name the copied
draft bytes, not final published inputs.

| Path / SHA256 | Source review finding |
| --- | --- |
| `backend/import_bindings.tower` — `18f945ff9842e20ff8631bd857b7dc159d21633e3f23d2e519bf223d2da2bbc9` | Three existing LLVM foreign APIs have pointer/LLVMBool/size_t shapes matching the Tower declarations. The ConstantDataArray guard precedes the sequential-array predicate and raw-string accessor. This verifies source preconditions, not link/export availability on a new reactor. |
| `backend/import_foundation.tower` — `b484d0c565270ac4e12c14a15f7667451ffec938dc2cf3322180c425dc8eb833` | `bi_result` keeps the exact-type final-temporary reuse path; otherwise it casts to the predeclared LLVM destination's full Foundation type before assignment. `bi_call` retains public nominal signatures; its older scalar cast can return an enum unchanged when scalar/pointer tags match. The new `bi_cast_type` uses nominal-aware equality, preserves target pointer metadata, and materializes a bits conversion when required. It reads the existing call-result temporary, so it does not repeat the call. Boolean handling remains the existing conversion policy; arguments and returns already use this helper. Allocation failure reaches the shared backend failure/stage discard path. |
| `backend/import_module.tower` — `c62beaa247cc7153bff781c865648a2f0efdf50ceb7ca277e9e38b7aed9880c1` | Counted zero/nonzero partitions cover each input byte once; each operation uses address+start and end-start, excluding the KString buffer's added terminator. Global startup order is retained before tower_main. Other aggregate element widths and zero aggregates retain the old recursive path. R1 prevents accepting arbitrary-byte correctness. |
| `compiler/format_types.tower` — `03b9c7db94fa9dd370d983448bcbfa75c8e6f90c7369670a693b92533c235ee1` | Adds borrowed program scope/prefix to the existing formatter context, with no global registry or owned graph. Caller initialization and synchronous owner lifetime are required. |
| `compiler/format.tower` — `cb6fe291dc39db1a93e92741ba37f87a946e0c695bd9193230f454ad7e2d5ee3` | `format_entity` now defaults the entire engine, including scope/prefix. Existing string escaping explains R1; no escape policy changed in this draft file. Checked output errors remain caller-visible. |
| `compiler/format_foundation.tower` — `be9b15d81d74ecba5a4670f764d4eded0c44ecba9dac36da73f1d0ac0ef7d942` | Postfix stars use the already supported CoreType grammar, preserving base/function/array/nominal structure and pointer depth under the same target profile. Binding reuse requires no nominal record, a prior global KType with zero pointer depth and matching scalar; it emits that declaration's actual escaped output name plus the requested stars. Prefix advances only after each declaration, avoiding self/forward reuse. Type-valued parameters disable reuse for the function header/body; local KType or type-valued KDeclare disables it for the whole block, restored on exit. No concrete binding defect found in the inspected valid-program paths. |
| `compiler/format_grammar.tower` — `1f492e959cc970cd032e06d05d0b2761673060589b3a769845321d2a34d10eef` | Child alternative probe and grammar preview explicitly default the extended engine; child output retains existing checked parent-budget/error propagation. These fragments have no borrowed program alias scope. |
| `compiler/format_source.tower` — `b6f89943bdf0f39e3fd1c7d63e7c039a32af9de1ad59284a0f33d42bbf2144ad` | Source/trivia formatter defaults its engine; no token, comment order, span or source-name policy changes. |
| `compiler/parser_presentation.tower` — `c0ef314839ab90de6f63ae8ddf781b16582defe7d8406195d385131f3eba5277` | Parser edge presentation explicitly defaults the new fields; existing immediate result/engine reset remains. No parser or grammar identity change. |
| `tests/backend_import_constants.tower` — `f0ebe6bd41259a385ad4e93c308a8c206130b436625215ee82f091009bfab11e` | Adds exported nominal enum result7 and ASCII newline/quote/backslash/z bytes plus trailing0. Existing integer-width and pointer assertions remain. Does not test embedded0, isolated128/255 or exact copy bounds; R1's proposed provider case is missing. |
| `tests/backend_source.tower` — `5ef6d8b410376243dafad84874e2b5def5762e7a13e3d082a49ce35fe98dda03` | Type-value preservation checks now require an emitted u8 binding, reuse in type_value, and explicit32-bit wide declaration under a local u32 type-value shadow. Added nominal-result case requires profile2 and explicit bits(u32,...). These compile/recheck/text assertions are not execution of returned code; exact behavioral output is covered only when the separately registered constants fixture runs. No new parameter/global-shadow or mixed pointer-shape fixture here. |
| `tests/backend_source_native.tower` — `cdae630d776d732ee55eb67943d0adb085deb04de9321316d1b68babd3921a40` | Optional census reuses the synchronous phase observer, explicit world/budget and LLVM module. Histogram capacity derives from observed parse IDs; borrowed labels live through the joined observation and work-vector storage is disposed. Linux rusage is whole-process peak, not live-world bytes. Census itself allocates/prints and is separate from production timing; parse-ID rows are not a globally unique cross-version rule identity. Explicit option validation keeps deny-recheck serial and distinct. Existing rollback/retry/final-zero-owner checks remain. |

Immediate contracts inspected at the published base: Foundation CoreType postfix
grammar; `semantic_types` type-binding classification; `semantic_modules` unique
global output names; `semantic_constructor_work` type-valued binding precedence;
`semantic_support` nominal/width equality; importer calls, offsets, text allocation
and staged publication; source-session transactional recheck; formatter entry
points and byte lexer/host transport. Ordinary scalar values do not shadow the
type namespace in these paths. Global type/value declarations receive distinct
output names; locals/parameters retain lexical names and are covered by the new
conservative guards. Record-bearing types never use scalar alias substitution.
Pointer bytes remain supplied by the compilation profile; spelling alone does
not make a64-bit graph valid under a32-bit target.

Ownership conclusion: LLVM byte storage is borrowed only during synchronous
initialization; nonzero data is copied into a stage-owned Foundation node before
LLVM teardown. The importer checks backend failure and discards its private
stage/association vectors on failure; destination payload replacement happens
only after successful stage publication. Source-session recheck keeps prior
canonical output until the candidate succeeds. No new worker/shared mutation or
allocator lifetime is introduced; this is source inspection, not failure-injection
or race evidence.

Registration: the existing `backend_source_tests_runtime` invokes both changed
service checks through native `tower-backend-source-worlds` and the existing
browser export; `tower-backend-source-recheck` retains its denial input and180s
bound. `semantic-port.test.mjs` already registers backend_import_constants for
Graph/Fast32/64, canonical and LLVM behavior. None was executed in this review.

Acceptance remains **pending L2 final source/ROOT adoption**, including R1's
repair and focused regression, exact final copied-versus-published delta,
formatter shadow/target/round-trip evidence, enum call-result execution and
source-specific failure cleanup. ROOT reports native17.32s/3.16GiB versus the
prior153s/10.6GiB failed request; the snapshot contains source, not authenticated
runtime receipts, so those are attributed progress only. Wasm2GiB fit, joined
reactors/generations, instrumentation and hosted release are unproved here.
No build/test/runtime repeat; documentation-only performance profiling is
inapplicable. Existing full-audit history and earlier acceptance scopes stand.

### 2026-11-23 D1: published scoped grammar structure reuse review

Independent source review of implementation
`54f3baab74db1c792632804160d0e0c1946173bd` against parent
`7e46f0250a790023130b05292759716eb31ce133`, frozen at merged
`05edbfb3b9c0b7db81c69a210a7ed425ae947f91`. All nine changed Tower blobs
are identical at implementation, B1's validated merge `75c15ee7`, and this
freeze. The checkout was pulled to `3ad7d5f0`; later work is not adopted here.
Read the changed methods and immediate cache/table/version/session, world,
worker and test consumers. **No new concrete defect found in this scope.**
This is source review, not D1 execution or authentication of B1's external logs.

Paths below are relative to `scaffolding/`; Git blob IDs identify the exact
reviewed contents, not just the last authoring commit.

| Path / blob | Substantive finding |
| --- | --- |
| `compiler/frontend_compilation.tower` / `05b43c94dfedc463b8dbe219d0df9cb8ce248e85` | Clears the world's surplus structural index after the synchronous parsing loop, including normal failed-parse exits, before semantic checking. Module/session versions still own their tables. It neither publishes grammar globally nor changes ordered module/root attachment. |
| `compiler/syntax_baselines.tower` / `272a5b4fe57a4633cb1aa3ac282d33872135c406` | Optional owner is a checked WorkBuffer charged to the explicit world's budget. Pinned worlds cannot construct it. Seed pointer or budget mismatch retires cache pins and the old retained seed before reset. Clear detaches the owner first, disposes pins, then frees a copied storage descriptor; baseline teardown invokes it before releasing seed/document ownership. |
| `compiler/syntax_emission.tower` / `28144a3630c83793384f291cecdb42a2a6bf9cdd` | `emission_child` records the actual `entity_attach_result` cause before dropping the local child reference. `syntax_emit_inherit_result` propagates that cause before partial emission destruction. This preserves Capacity instead of substituting the old Memory fallback; other boolean attach callers/declaration remain. |
| `compiler/syntax_session_next.tower` / `3ea6872cb727eac70c63ba6797270e5e06e585b4` | Install passes the owning world/seed's optional structural cache. Failed construction retains the prior version/revision and checked cause. `syntax_next` closes its recognizer/stream scope before import or declaration activation; candidate pins are released on both outcomes. Local overrides still create/install immutable revisions after the declaration boundary. |
| `compiler/syntax_session_setup.tower` / `a8a158eaa3e1298cc6a9006f07c4d12e9c705588` | Reset uses the same explicit world/Bedrock scope, retaining module-world checks and first resource-cause latching. The seed, session grammar, source/progress and resulting version ownership stay separate; there is no ambient Foundation/Tower activation. |
| `compiler/syntax_version_cache.tower` / `98bca71bb153461b12f94a813f424de30460baaf` | Original entry point delegates with no external cache. The new entry point retains exact full-version lookup/reset and uses the supplied cache only during a miss's synchronous construction. It stores no borrowed external cache pointer. Optional index/snapshot denial returns a usable uncached version; required table failure still returns null with its diagnostic. |
| `tests/parser_structure_reuse.tower` / `7e94c445acc9019a752d99d82d4b0cceec59484d` | Added cases distinguish same-world independent session versions sharing LR runtime from two worlds sharing one budget but never runtime. They check seed-identity invalidation, optional metadata denial/retry, live version pins after index clear, and zero final bytes/grants. Existing capture isolation, changed terminal/precedence/mode/specialization, required Capacity, unresolved grammar, cancellation/retry and imported override/reset cases remain. |
| `tests/bootstrap_symbols_checks.tower` / `9623d74305f48dca726696b7b29bbc1062b2fc0b` | New exact symbol is tested through the actual policy for four target spellings, with truncated/suffixed names and wrong ParserNodes/Entities units rejected. Existing negative unexpected-import cases remain; target spelling tests are not execution on those targets. Standalone exported main imports the real tool. |
| `tools/bootstrap_symbols.tower` / `c38c315e4441338ab3425cb5fba52475c7c2db25` | Only Semantics gains exact `syntax_world_structures_clear` admission. It is a Tower-defined cross-object extern, provided by the Parser unit's parser_frontend -> frontend_world/syntax_session -> syntax_baselines closure, not newly foreign-owned runtime logic. Exact length/token matching remains; no prefix allowance. |

Immediate ownership/identity trace: `parser_structure_same` compares ordered
production owner/begin/count/precedence/associativity, symbol ranges/nonterminals,
and ordered names. Reuse additionally requires the same world, budget, parser
mode and specialization. The shared object owns numeric LR grammar/runtime/state
storage; each table retains its own grammar entities, userdata, captures and
emission/lexicon/replacement metadata. No second authoritative syntax tree is
introduced. Seed identity resets this bounded derived index even for equivalent
seed contents. A cache hit does not bypass the version's remaining construction.

`parser_structure_publish` takes a table pin before optional cache insertion;
failure to grow that index leaves the table usable. Eviction/clear releases only
cache pins. `parser_table_clear_runtime` and `syntax_version_release` release the
table's pin before its remaining grammar/source ownership. `compiler_world_bind_budget`
forbids rebinding a populated world, so the new owner cannot silently outlive or
switch its allocation ledger. `frontend_world_clear` rejects busy/pinned worlds,
closes the pool, then clears syntax before other baselines; final world disposal
refuses remaining frontend owners/views/entities. The caller must keep the budget
alive until those releases complete.

Join trace: `lr_first_work` reserves graph tickets/access, opens its input view,
calls `compiler_kernel_dispatch_admitted_result`, then closes the view and selects
failure in frontier order. The underlying `work_pool_batch_result` defers draining
all admitted peers on success or partial submission failure while its descriptor
is alive. Table construction is synchronous and clears its construction-only
cache borrow on exit. Cache pins/refcounts remain coordinator-owned, not atomic
general-purpose sharing. These inspected callers justify the new post-parse
clear; they do not prove arbitrary concurrent cache mutation safe.

Registration and limits: `frontend_main`'s explicit `structure-reuse` selector
calls this provider; `tower-frontend-structure-reuse` retains timeout60 and
`native;focused` labels. The provider also invokes `frontend_session_world_tests`.
The new live-version check after world-index clear checks retained runtime
pointers; the older owner test actually parses after cache/table retirement.
Its cancellation case cancels before the first recognizer step, not mid-dispatch
concurrency stress. Required OS allocation failure is not newly injected here.
`tests/frontend_units_memory.tower` is byte-unchanged from the implementation's
parent: `import_allowance = 67108864` still requires the exact Capacity diagnostic,
no output and no cancellation. Passing that gate means correct finite-budget
denial, not successful compilation within64MiB.

Evidence attribution: [B1's grammar-cause receipt](compiler_grammar_cause_7e46f025.md)
records the original wrong Memory cause, restored transitive attach declaration,
wrong-cwd grammar invocation and corrected checks. It reports merged full units
13.41wall/22.79CPU seconds/815948KiB RSS, exact small/large object/execution outputs
15/999 and strict import checks at `75c15ee7`. Its paired parent/candidate timings
remain at their own frozen inputs: e.g. large serial CLI .635 -> .600s and
four-unit workers4 1.4429 -> 1.1389s. Four-worker CLI still trails serial; metadata
retention and the 205.08 -> 213.83ms observer regression remain disclosed.
Those external raw logs were not available for independent authentication here.
No D1 build, test, runtime/profile or sanitizer repeat; documentation-only
profiling is inapplicable. Final joined-source bootstrap, browser/generation,
source-specific instrumentation and hosted adoption remain ROOT's separate gate.
No production edits, race-proof claim, census expansion or new implementation
assignment results from this bounded review.

### 2026-11-23 D1: finite void-scalar consumer review

Freeze: published `d55d1c0d8c16d0485aaaed17432f1eb1c9d9be84`, clean required
pull, same D1 thread. Reviewed **26 predicate lines in16 compiler files** and
immediate consumers. `interpreter_abi:75` contains two scalar comparisons on one
line. Searched both comparison directions for `SVoid` and numeric tag3, then
cross-checked all SVoid uses and scalar/3 occurrences in `scaffolding/compiler`
and `scaffolding/library`. `foundation_tags:59` confirms `SVoid = 3`; no numeric3
predicate or additional library match occurs in this scope. Constructor/tag
assignments are not counted as comparisons. Exact search and16 blob IDs are
retained in `build/d1_ecs/void_review_d55d1c0d/{predicates,site_blobs}.txt`.

**No additional concrete void-pointer classification defect found.** ROOT's
`backend/import_instructions.tower:bi_call` finding and L2's active repair/tests
remain outside this audit; nothing here closes that importer gate. No producer,
fixture or expectation changed. These are source dispositions, not new runtime
passes, a claim about every type consumer, or proof against unrelated ABI bugs.

All paths in the table are under `scaffolding/compiler/`; line numbers refer to
the fixed commit. Each row records the actual guard or intentional classification
and its immediate use, rather than approving a filename.

| Site / method | Disposition and caller evidence |
| --- | --- |
| `completion.tower:896`, `completion_semantic_node` | Earlier nested `pointers == 0` guards the void test. `completion_table` offers pointer-returning functions in value-required contexts; exact expected-type/pointer filters remain independent. |
| `completion.tower:976`, `completion_templates` | `is_void` is ANDed with zero pointer depth before excluding a resolved generic result. `completion_symbols` uses the ordinary type resolver; unknown result annotations are not guessed. |
| `c_emitter.tower:250`, `ce_type` | Prior nonzero-pointer branch emits pointer storage and returns. `ce_abi_type`/signature/local declaration therefore never spell void-pointer results as C void. All raw pointer depths use the backend's existing byte-pointer representation. |
| `c_emitter.tower:339`, `ce_value_kind` | KCall returns true for nonzero pointer depth before comparing scalar. `ce_body` declares a temporary and `ce_prepare` assigns the call result; true void emits only the effectful call. `ce_statement` returns the prepared operand when present. |
| `interpreter_abi.tower:75`, `im_call_type_equal` | Exact type equality succeeds first; pointer or SFunction classification then returns compatibility only for two pointer classes of equal target width. Only remaining nonpointer/nonfunction mismatches reach either SVoid rejection. `im_function_signature` applies this to runtime indirect return and parameter types; staged serialization instead requests exact source equality. |
| `language_components.tower:29`, `language_function_description` | `no_result` is ANDed with zero pointer depth. `language_declaration_description`/component presentation does not describe a pointer result as absent. This is UI metadata, not executable ABI policy. |
| `semantic_definitions.tower:29`, `semantic_scalar_name` | Deliberately accepts a scalar tag, not a complete value type. `sem_type_name` and `format_type` append the retained pointer depth after choosing nominal/function/base spelling. Returning the base word void is correct. |
| `semantic_evaluation.tower:340`, `sem_evaluation_expression_impl` | Deliberate rejection of all raw-pointer staged results OR void, after the unevaluated return. `sem_comptime`, capture and type-value callers need relocatable results; this must not become a zero-pointer-only rejection. Runtime pointer calls and unevaluated type queries are different paths. Typed zero placeholder cannot escape the failed/pending query as a successful result. |
| `semantic_expression_lowering.tower:567`, `sem_lift_value` | SurfaceSelect's no-result branch requires scalar void AND zero pointer depth. Pointer selections use the result-producing lowering path; branches retain lazy evaluation. Called by initializer/return/statement lifting. |
| `semantic_expression_lowering.tower:729`, `sem_lift_value` | `discarded` starts with zero pointer depth before ANDing void. After call/aggregate argument preparation, pointer values take `sem_lift_snapshot`; true void is appended for its effect without a value temporary. |
| `semantic_expressions.tower:106`, `sem_default` | Rejects only depth-zero void; pointer default retains its type and zero bits. `sem_operand_impl` and initializer handling use this same path, including destination rules for aggregates and separate metatype rejection. |
| `semantic_expressions.tower:701`, `sem_surface` | Tests the result after decrementing a checked nonzero pointer depth. Loading void* would produce no value and is rejected; loading void** produces void* and survives. This is intentionally a pointee check. |
| `semantic_flow.tower:146`, `sem_flow_missing` | Nonzero pointer depth OR nonvoid scalar requires a result. Late flow failure selection also includes lowered aggregate result-parameter signatures. Pointer functions cannot silently fall through as void. |
| `semantic_iteration.tower:179`, `sem_iteration_state` | Requires element callback to return a pointer to an actual element: exactly one pointer to void is invalid, but a void** element address points to a stored void* value. Called by body preparation and iteration-storage preparation. |
| `semantic_iteration.tower:180`, `sem_iteration_state` | Checks the state type after validating/decrementing the protocol's single state-pointer layer. Rejects zero-sized void state, not every pointer-valued element; begin/end and next results are separately compared with exact void/bool types. |
| `semantic_statements.tower:579`, `sem_return_source` | Zero pointer depth AND void enforces no return operand. Body-query admission and immediate `sem_return_statement` share it; void*/deeper pointer functions instead require an operand and check it against the full result type. |
| `semantic_statements.tower:803`, `sem_function_finish` | Pointer depth OR nonvoid scalar plus fallthrough produces missing-return error. Body continuation calls it; delayed flow dependencies retain the later flow check rather than treating pointers as void. |
| `semantic_support.tower:217`, `semantic_size` | Pointer/SUSize/SFunction width returns before aggregate, metatype and void branches. Layout/interpreter/C consumers get the selected target pointer bytes for void* and void**, zero only for true void. |
| `semantic_type_execution.tower:247`, `sem_type_execution_pump` | Array construction rejects only zero-depth void after descriptor/target/extent checks. Pointer construction separately increments depth. The coordinator query pump preserves input record/width and performs aggregate layout waiting before interning; arrays of pointers remain legal. |
| `semantic_types.tower:506`, `sem_type_call` | `function(Result, Parameters...)` rejects only a depth-zero void parameter. It retains the full return/parameter types in the signature. `sem_type_impl` dispatches the type call; pointer parameters and pointer returns remain legal. |
| `semantic_types.tower:643`, `sem_array_length_value` | Rejects void elements only at depth zero. Type-call/postfix-array and declaration-query callers share the length/type validation; pointer elements keep their actual target size. |
| `semantic_types.tower:900`, `sem_type_fields` | Rejects a true void field after ordinary type resolution; pointer fields remain. Immediate and resumable declaration checking invoke the same field producer before layout. |
| `semantic_types.tower:1146`, `sem_declaration_type` | `step42` first requires zero pointer depth; only then evaluates void. Ordinary variables/parameters reject void while type aliases retain their separate allowance. Parameter setup and declaration pumps consume this result; inferred pointer type keeps target pointer bytes. |
| `semantic_values.tower:329`, `sem_operand_leaf` | After `sem_call`, rejects a void call as an operand only at zero pointer depth. Direct, generic and indirect calls preserve the whole result type; pointer return operands remain usable. |
| `semantic_values.tower:756`, `sem_builtin` | convert/bits rejects a void destination only at zero depth, alongside separate aggregate rejection. Source goes through `sem_operand`, which already rejects a void call as a value. Pointer bits casts retain width/function/float restrictions; ordinary convert still rejects pointer reinterpretation intentionally. |
| `type_primitives.tower:35`, `type_primitive_spelling` | Scalar-constructor spelling intentionally yields `empty_type()`. `format_type` appends the complete pointer suffix; this is not a test for a valueless expression. |

Cross-path checks: `sem_call` copies the direct/generic declaration's full type;
`sem_indirect_call` copies the signature element after checking an actual
SFunction value. Neither reduces a result to its scalar. Graph interpreter
`ix_call` saves the registered foreign result and `ix_return` saves ordinary
returns; the function-reference path uses the checked ABI above. Fast interpreter
FMCheckFunction uses the same signature predicate. Staged function results use
`interpreter_function_result(... exact=true)`, preserving nominal/source
signature identity instead of accepting the runtime representation-cast rule.
`semantic_type_equal` compares depth, scalar and nominal record (or structural
function signature), plus target width for pointers/functions/usize.

Formatter base spelling keeps nominal records and function signatures separate,
then emits all pointer stars; scalar aliases do not substitute record-bearing
types. C output is a distinct supported subset: it explicitly rejects function
values/indirect calls, rather than silently accepting or dropping their results.
Its generated `sizeof(void*)` check enforces the requested pointer width.
The byte-pointer C representation does not claim to preserve Tower source
nominality; ordinary checking precedes it. These observations do not certify
native ABI interoperability on unexecuted targets.

Contracts read: function-values runtime ABI versus exact staged relocation,
Foundation raw memory/extern-result rules, and type-value staging constraints.
No additional concrete supported trigger was found, so no speculative regression
or producer handoff was invented. Existing importer failure evidence is preserved
and remains L2/ROOT-owned. No runtime reproduction, compiler build, instrumentation
or performance run was needed for this source-only receipt; documentation-only
profiling is inapplicable. Final repaired importer/ joined-artifact execution
remains a separate acceptance action, not passed by these26 dispositions.

### 2026-11-23 D1: ledger source adoption at 7890ebd7

Frozen published main7890ebd7f3a0e1d2acbd70ee72c4629eef347ec2,
treee4a87a290cc5fa3a206fb4181a6998c603c99801,
compiler1d0ab1dbb7dabd8fc61b9238342bf30da3d3e45e,
library62350befa8df3e261fd184a23a64e6bb7263204a. The handoff now has one
[current ledger with the same twelve requirements](compiler_ecs_threading_handoff.md#current-fixed-completion-ledger--published-7890ebd7-2026-11-23);
the3ea/c20 ledgers and all earlier receipts remain historical, not rewritten.

Finite inventory: git diff3ea43517..7890ebd7 has92 authored Tower paths,
no retired path or packaged Tower change. Three CMake contracts also changed.
This is delta membership, not a new repository census or automatic semantic
approval. Exact path/blob evidence: build/d1_ecs/ledger_7890ebd7/
{delta_paths,frozen_blobs,tower_delta,exact_reviews,owner_only_pending}.txt.

| Exact independent source-review reuse | Current identity/disposition |
| --- | --- |
| [A1's42-path map](compiler_source_delta_9caa921c.md),9caa921c |33 Tower blobs unchanged. Its nine later-changed paths are backend/session; compiler/generics, semantic_constructor_work, semantic_declarations; tests/backend_source_native, bootstrap_symbols_checks, lr_work_main, nominal_wrapper_checks; tools/bootstrap_symbols. Later groups handle these; they are not silently inherited. |
| D1 numeric-wrapper review26a7f784/5caffe04,22e15d5b |15 of16 Tower blobs match: generics, semantic_body_work, semantic_constructor_work; nominal_wrapper_checks; all four numeric_wrapper positive/provider/check files and seven numeric_wrapper negatives. Shared lr_work_main and TowerWorkTests have later registrations, mapped below. |
| D1 grammar review9d1ece24/d55d1c0d,05edbfb3 |All9 Tower blobs match, including frontend_compilation, five syntax providers, parser_structure_reuse and both symbol-policy files. The unchanged64MiB Capacity-negative gate is preserved. |
| [D2 alias review](compiler_alias_inference_audit_b8d65c37.md),b8/e6be70d5 |Five Tower blobs match: semantic_call_inference, semantic_declarations, alias_type_query_checks, alias_type_query_controls, semantic_invalid/alias_condition_scalar. Later semantic_statements/lr_work_main/TowerWorkTests are excluded from that review. |
| [A1 executable-budget review](compiler_executable_budget_review_a1.md),e6be70d5 |Both semantic_execution_work and semantic_executable_admission_checks plus TowerWorkPolicyTests match exactly. The adjacent alias-publication readiness defect remains visible in the current pump; its proposed regressions are not executed tests. |
| D1 L2 draft review540f501c, copied2130 manifest |Nine exact published matches: backend/import_bindings and import_foundation; compiler/format, format_foundation, format_grammar, format_source, format_types, parser_presentation; tests/backend_source. Exact copied SHA256 comparison permits reuse of those source findings, not the changed byte-run producer or owner runtime claims. |

The73 Tower paths in those groups are disjoint at this delta boundary. D1's
902f7c4d26-predicate review is supplementary consumer evidence, not another
whole-file approval. The following **19 Tower paths and two CMake contracts**
have published owner implementation/test receipts but no matching complete
independent final-source review identified here. They are the finite pending
review set, not missing functionality or failed owner tests. Paths below are
under scaffolding/ unless prefixed with cmake/.

| Pending final-source review / owner | Exact paths, publication match and acceptance evidence |
| --- | --- |
| A1 backend fallback, ROOT adoption | backend/session.tower; tests/backend_clock_native.tower, tests/backend_response_checks.tower, tests/backend_response_native.tower; cmake/TowerBackendSourceTests.cmake. All match ba9b0ab1. Published journal describes allocation-free typed cause/offset fallback and extracted real clock; focused response/denial/healthy reconstruction receipts survive c2ce733c. Actual CMake provider imports backend_response_native and registers tower-backend-response, timeout30; source-worlds/recheck retain180. Older A1 delta review explicitly did not prove this then-missing fallback. |
| L2 final byte/census composition, ROOT adoption | backend/import_module.tower; tests/backend_import_constants.tower, tests/backend_import_fixture.tower, tests/backend_import_storage.tower, tests/backend_source_native.tower. All match340989cf. Three differ from D1's12-file draft and two fixture/storage files were outside it. Actual producer now uses ASCII-only counted copy and exact-byte fill; owner tests contain65/0/128/255/0/67 and UTF-8 byte controls. Journal d16c8f6e/1a9c3296/340989cf records4/4 focused checks, exact full compile/recheck output and zero ownership, but full execution still fails. Draft R1 is repaired at source/owner-test scope; final independent composition and L2's separately owned void* repair/actual guest fit remain pending. |
| B2 uniform profile / B1 measurement | tests/frontend_units_profile.tower, exact f0b8916c. [B1 uniform receipt](compiler_uniform_reuse_3ad7d5f0.md) binds profile SHA3fa3430d and executablef092a2aa to30 checked runs. This closes measured workload evidence, not a new independent full-file review or newer-compiler timing. |
| A2 malformed call fixture | tests/malformed_call_checks.tower, exact19eab83a. Native owner checks and D2 actual b8 malformed/reuse execution are published; final source fixture review remains distinct. Shared production guards are covered by D2's composed semantic_declarations/statements context, with statements' later loop delta below. |
| L1 loop headers and shared registrations | compiler/semantic_control.tower, compiler/semantic_statements.tower; tests/lr_work_main.tower, tests/module_loop_queries.tower, tests/module_loop_query_checks.tower, tests/semantic_invalid/module_for_condition_scalar.tower, tests/semantic_invalid/module_loop_query_cycle.tower, tests/semantic_invalid/module_loop_update_capture.tower; cmake/TowerWorkTests.cmake. All match c2af6e0f. Actual module-loop-queries selector, control-smoke call and workers1/4 positive CTests exist. Journal a2e3c7a0 reports native32/64 Graph/Fast/canonical/exact-negative/terminal ownership; df24d9fd adopts changed formatter outputs. Mutable loop-header capture and body-local forwarded annotation remain separate live defects. |

Registration discrepancy retained from D2: alias_condition_scalar has a manual
native2:4 rejection receipt but is absent from the current explicit alias/loop
runner and CMake lists inspected here. The loop negative provider covers
while_type, module_for_condition_scalar, module_loop_update_capture and
module_loop_query_cycle; these do not register the missing if-condition fixture.
The positive CTest regex0 remains a substring check; preserve independent exact
Tower/Graph/Fast output evidence. No registration was edited during this task.

Runtime reconciliation: ROOT's b8 builds are distinct from A1 T5 and Windows
browser execution; D2145b93db supplies actual portable/LLVM alias and malformed
adoption. Published B2 repair5aff643a/7890ebd7 supersedes the stale unpublished
status: helper/thread-adapter/transport/fault-adapter hashes exactly match its
receipt, which combines unchanged strict runs with newly passing trap/startup/
generation controls on **f167**, not current compiler sources. Hosted isolation
and successor adoption remain open. Public bootstrap paths are unchanged since3ea;
no new payload scan, hosted verification or instrumented operation is claimed.

Live owner-reported work excluded at this freeze: A1 failed alias-publication
readiness, A2 malformed type shapes and forwarded body-local annotation, L1
mutable loop-header capture, L2 lost void* reconstructed result/full execution/
actual Wasm fit/remaining large fixtures, B1 admission/scaling and ROOT/B2 final
successor browser adoption. Native3.16GiB RSS is not a wasm32 linear-memory
measurement. Current generations, public pin, atomic hosted release and
service-rejected instrumentation remain OPEN; no rejected operation was retried.
Documentation-only profiling is inapplicable. No build/test/profile rerun,
implementation change or new audit loop.

### 2026-11-23 D1: finite pending-source review at 1e60c511

Frozen published main **`1e60c51167c6cc0438d10fe2366614ad872fa85b`**, tree
`72820a3b863adc36e29ef382c532708c5b2b40ae`, compiler
`21b00de919403346f3f852a387a2b50b07b667d2`, library
`62350befa8df3e261fd184a23a64e6bb7263204a`. This closes the independent **review
work** for the preceding nineteen Tower paths and two CMake contracts, plus the
five explicitly requested composition deltas. It does not close runtime/release
acceptance. Final functions, immediate consumers and registrations were read;
unchanged earlier reviews remain adopted. No production or fixture edits.

Of the original nineteen, sixteen still match7890; `malformed_call_checks`,
`lr_work_main` and `module_loop_query_checks` changed. Of its two contracts,
`TowerWorkTests.cmake` changed. Those final versions are reviewed below, including
A2 ee91c300 and the already-published L1 capture registrations through4bbde387.
The five additional files adopt L2's void-result repair through74ccfb00 and A2's
shape guard. Later incoming inputs are outside this fixed review. Exact Git blobs
are recoverable at the freeze; local `build/d1_ecs/source_review_1e60c511/{paths,blobs}.txt`
records all24 Tower plus2 CMake paths. Paths in the table are under scaffolding/
except cmake/.

| Reviewed group / exact paths | Source disposition and acceptance boundary |
| --- | --- |
| A1 fallback: `backend/session.tower`; `tests/backend_clock_native.tower`, `backend_response_checks.tower`, `backend_response_native.tower`; `cmake/TowerBackendSourceTests.cmake` | `backend_session_create` reserves the fallback tail with its descriptor. Capacity covers the longest typed prefix, a conservative usize digit bound, closing brace and NUL. Failure uses that tail and a stack digit array; zero/max offsets and the first stored backend cause survive without a second allocation. Reset/close retain the original allocation owner. Tests cover all six non-None causes, four offsets, both allocation-denial boundaries, prior ordinary error, two independent sessions and recovery, then zero tracked buffers. The extracted clock is real Linux `clock_gettime`: monotonic-only WASI adapter, nonnull result, checked status and ns conversion. CMake's native/Linux guard matches its ABI; response uses the existing serial instrumented allocator and one backend provider (30s); real source-world/recheck retain guest-runtime dependency, lexical `.tower` mount and180s. Neither serial fault injection nor this review proves threaded allocation safety. |
| L2 counted initialization: `backend/import_module.tower`; `tests/backend_import_constants.tower`, `backend_import_fixture.tower`, `backend_import_storage.tower` | `bi_initializer` checks ConstantDataArray before the string API, reads counted bytes and emits maximal nonzero ASCII copies or equal-byte u8 fills. Counts exclude string terminators; explicit zero/high-byte runs and offsets preserve original initialization order. No signed-char conversion or NUL-terminated scan; ordinary aggregates keep layout-derived offsets. Partial nodes remain in the existing private import stage and fail/discard through its owner. Constants fixture preserves large/narrow/nominal results, escapes and UTF-8 byte values195/169/0. Raw fixture is exactly65/0/128/255/0/67. Storage checks admission failures, pinned Busy/Capacity, old output/comments, first cause, no-allocation terminal retry, ASCII canonical text and final world/ledger/buffer cleanup. **Limit:** the six raw bytes are imported/formatted, not independently executed/read with surrounding guard-byte assertions; existing retained-output sentinels test publication ownership, not initializer bounds. No wrong-byte producer defect found by this source review. |
| L2 native probe: `tests/backend_source_native.tower` | Final clock extraction, getrusage ABI, joined census and deny-recheck paths reviewed. Census counts actual store pages/component records; its temporary histogram is budgeted and disposed. Native RSS, charged payload, descriptor bytes and grammar labels are distinct measurements, not a universal memory census. The synchronous observer borrows its stack context/world only through the joined request; deny-recheck saves prior output, reserves the remaining budget at the second parse, releases it on exit and checks exact Capacity plus retained output before recovery. Observer removal, backend/world shutdown and resource/budget disposal preserve borrow order. Native Linux probe success does not establish wasm32 guest fit. |
| B2 profiler/B1 measurements: `tests/frontend_units_profile.tower` | `uniform` and `spread` are mutually exclusive; both source admission and saved-source/result validation derive the same per-unit body prefix. Uniform means `count × bodies`, not one shared body count. Each answer and representative ordinary body executes42; canonical/object bytes are saved/hashed after join. Backend closes before frontend; all observers/scratch outlive their joined owners. Worker slots are private by ordinal; coordinator aggregates after joins. Timed wall/CPU/RSS ends before oracle/format/save work. Optional grammar observers add separately reported collection cost; enclosing times include it. Vacancy is explicitly an outer-slot upper bound, not demonstrated idle shared capacity; requested lanes are not overlap. Equal zero-body units require observed overlap/distinct threads. Adopt [B1's source-bound measured receipt](compiler_uniform_reuse_3ad7d5f0.md), not a new timing result or proof that every generated body executes. |
| A2 required captures: `compiler/semantic_types.tower`; `tests/malformed_call_checks.tower`; shared `tests/lr_work_main.tower` | `sem_type_binding_header` requires name before publishing a type record. `sem_type_name_shape` follows the ordinary name chain, checks bare CoreTypeName only, and runs before prepared constructor/type consumption. Qualified/base alternatives, pointer types and editor holes retain their existing paths. Eight exact table cases distinguish mandatory captures from optional declaration/return/call alternatives; marker-derived source coordinates, UTF-8 moved-call control, earlier live answer42, valid override recovery and zero final grants are checked. Three-unit failed and early-cancelled batches drain, expose no program and preserve first error/offset. `malformed-call shapes` runs32 width/worker configurations; main `all` includes shapes once, while `all`/query-smoke's older call group remains distinct. Named reproductions deliberately run a smaller scope. [A2's executed receipt](compiler_malformed_shapes_ba52a932.md) is attributed evidence, not rerun here. |
| L1 loop query composition: `compiler/semantic_control.tower`, `semantic_statements.tower`; `tests/lr_work_main.tower`, `module_loop_queries.tower`, `module_loop_query_checks.tower`, `semantic_invalid/module_for_condition_scalar.tower`, `semantic_invalid/module_loop_query_cycle.tower`, `semantic_invalid/module_loop_update_capture.tower`; `cmake/TowerWorkTests.cmake` | `sem_control_expression` uses the shared module-expression query only for coordinator-owned immediate module operands; worker/prepared contexts keep ordinary private checking. `sem_module_expression` saves lexical context, demands/discovers shared producers, restores the result context and disposes its temporary subjects on exit. If/while/for preserve bool checking and value/operand/discard modes. For-header scope survives initializer suspension; condition/update bind before body shadows. Lowering retains original repeated condition/update positions, continue ordering and break omission, rather than executing a runtime condition during preparation. Positive fixture checks forward/computed types, nominal usize, exact reference trace12342342342, shadowing and lazy untaken dependencies. Three requested negatives retain bool, capture and layout-cycle diagnostics. Current checker now reads nine actual fixtures: the five added L1 capture sources and positive `module_header_capture_controls` were also read as direct registration context (update/body writes, escape, block write, shadow; immutable/type-only/untaken controls). Exact mapped offsets, no partial program, drained terminal retry/no new owners are checked32/64 ×1/4. Selector and control-smoke call the provider; workers1/4 CTests register the positives. Their regex `0` remains a substring check at this freeze; D2's separate pending registration repair is not adopted. L1's2a5477be/4bbde387 runtime receipts stay source-bound; this is not a new full capture-producer review. |
| L2 void-result composition: `backend/import_instructions.tower`; `tests/backend_source.tower`, `backend_void_returns.tower`, `driver_c_cases.tower` | `bi_call` drops a result only for SVoid **and zero pointer depth**. Direct preserved signatures and reconstructed indirect signatures keep pointer/nominal types; real values flow through checked temporary/cast and `bi_function`'s already-declared LLVM destination. True-void calls are still appended once for effects. Source-service test requires assigned opaque/forwarded calls (text assertion only). The ordinary fixture independently checks direct/exported/callback void*, deeper void**, null/non-null identity, read/store/free and exact effect count123, printing0. L2 reports actual original/reconstructed32/64 execution and the full entity_pages request execution0 at workers1/4; these are distinct from source proof and remain native evidence. **One concrete C-registration incompatibility remains below.** |

**Source-proven registration defect, not a newly executed failure — ROOT/L2:**
`tests/driver_c_cases.tower:driver_c_cases` adds `backend_void_returns` to the
Native C differential list. `driver_c_file` → `driver_c_case` → `driver_c_variant`
requires successful raw and optimized `--emit c` before comparison. However the
fixture's `select_callback` is an exported function-valued return and `apply`
contains an indirect callback. `compiler/c_emitter.tower:ce_collect` explicitly
rejects KFunctionReference, indirect KCall, or SFunction result/element with:
`This source backend does not yet implement function values; use LLVM native/Wasm output`.
The exported selector cannot be justified away as an unused private function.
This is an incompatible test registration, not another void* importer defect.
Smallest source trigger, using the fixture's existing supported constructs:

```tower
import foundation;
fn opaque(value: void*): void* { return value; }
export fn select_callback(): function(void*, void*) { return opaque; }
```

Owner reproduction command (not executed in this review):
`tower-driver-tests --c-backend TOWERC RESOURCE_ROOT clang gcc clang++ g++ backend_void_returns`.
Keep the complete LLVM callback fixture and its successful receipts. Route that
fixture through a supported LLVM execution contract; if adding C regression
coverage, use a separate direct-pointer subset or assert the intentional C
capability rejection. Do not relax the C emitter or report its positive matrix
passed. No concurrent producer/fixture change was made by D1.

The counted-byte boundary above has a smaller **coverage** follow-up: extend the
existing LLVM-owned constant fixture with executed reads of65/0/128/255/0/67
and guard bytes after Foundation reparse; it needs no second initializer model.
This is a proposed L2/ROOT regression, not a confirmed overflow or new test result.
Existing D2 regex/alias-negative registration work and A1/A2/B1 producer changes
remain separately owned. The finite requested review is complete with the
C-registration defect and these explicit acceptance limits retained. No build,
test, profiler, sanitizer or hosted operation was run; documentation-only runtime
profiling is inapplicable. Native3.2GiB RSS is not a wasm32 linear-memory result.

### 2026-11-23 D1: three correctness fixes at ea606d32

Frozen published main `ea606d329b989378df15fdc58bf5165456bb0cb7`, tree
`7f41401d3078e46331bcd55a2b58c329750cfaf0`, compiler
`306ac3a3e67ef73790eb7fdc9878534b8c5df259`, library
`62350befa8df3e261fd184a23a64e6bb7263204a`. Independent source review of A1
b78d606b/ef59b0aa, L1 3bc0a726 and D2's composition through451bea0c; no new
implementation or execution. These close the three exclusions in the preceding
finite review, not the whole compiler acceptance ledger. Unchanged context and
fixtures from that review remain adopted. Actual changed functions, immediate
consumers and final registrations were inspected; the following blobs match
those owner publications (the shared Work registration is the final composition).

| Path (under scaffolding/ except cmake/) | Reviewed Git blob |
| --- | --- |
| compiler/semantic_execution_work.tower | b3fd8b1cde1144f7e715d3f6be9d570a8d10b87b |
| tests/semantic_executable_admission_checks.tower | daeef03f1db23097800f52de8a7e04f29feb5f32 |
| cmake/TowerWorkPolicyTests.cmake | 60b1cfaea06478a381b70d62d0e133b42e344eeb |
| compiler/semantic_source_bindings.tower | beb2c036eb52e2c6a6db80ef8a4c318f58c0b4f1 |
| tests/module_header_capture_controls.tower | d33244b05a90955f428e76ad03845360f8403ee4 |
| tests/module_loop_query_checks.tower | a21dbeda2f67c733e2576fcecc70f164406792a1 |
| tests/semantic_invalid/module_header_capture_update.tower | f0cba4ed545daef1e318f63367f33c7cbe471f47 |
| tests/semantic_invalid/module_header_capture_body.tower | 6604b287e3bf0800da04192927f2a3036526a2cc |
| tests/semantic_invalid/module_header_capture_escape.tower | 87947693e11750a23b17b1482671b6d4b3a22939 |
| tests/semantic_invalid/module_block_capture_write.tower | 4dee26ea4ec0e67bf55e66b2d064b062a0e2e8d2 |
| tests/semantic_invalid/module_header_capture_shadow.tower | 38213cf7854395f25f495978b61b5f2201617370 |
| cmake/TowerTestZeroOutput.cmake | e28d422a8b4d2b6bfc67e6ff6a9bd530ba59bd65 |
| cmake/TowerWorkTests.cmake | aa5f0deabe4c1fef85bb7fa1937acc73535cc543 |
| tests/alias_type_query_checks.tower | fe98c5a3d4927632364401ee235d62f7665e43b6 |

**A1 — joined executable readiness.** `sem_executables_pump` reserves the batch,
stages/leases and lanes before synchronous dispatch. Joins precede stage holds;
holds precede closing the input view; stage publication precedes coordinator
alias mutation. The new pass validates each ticket/observed dependency, skips
aliases from a worker with a retained ordinary/resource error, and stops on
`sem_evaluation_aliases` Invalid or Memory. Only after all eligible aliases are
accepted does the completion pass set `IMFunctionInput.ready`. The interpreter
checks ready before consuming the function; the shared query pipeline returns
Failed, and declaration failure walking restores retained worker diagnostics.
Thus a worker's own malformed alias cannot replace its signature Capacity cause,
and a later rejected alias cannot expose an earlier successful ready prefix.
A valid alias prefix and published nodes may remain owned until context teardown:
this is readiness ordering, not whole-wave structural rollback. Deferred cleanup
cancels unsettled tickets, drains/returns lane ownership and disposes the charged
batch; no worker borrows the coordinator's stack context after return.

`executable_alias_trial` uses real worker-generated aliases plus a missing-producer
injection at offset17 or29. It checks no ready input/function pointer in either
failed wave, cancelled invalid tickets, no live stage/context/jobs, exact prefix
length, stable terminal retries and a fresh semantic-context recovery in the same
world with producer/original/clone identity and final zero grants. The signature
trial preserves its genuine Capacity failure ahead of its injected bad alias.
`batch-growth` derives extent from WorkBufferInitialElements, measures admitted
leases, denies replacement storage, and verifies counts/grants before recovery.
The existing provider is linked once and all17 selectors retain60s deadlines.
Source SHA256s `bc8a64e0…4591e` / `a4df18ae…9d4b` match the full hashes in
[A1's repair/merged receipt](compiler_executable_budget_review_a1.md#implemented-alias-publication-follow-up-2026-11-23).
That receipt reports17 selectors, query-smoke and lifecycle0 at c98d64f2, not a
D1 rerun. Alias-vector physical Memory denial and mid-pump stale-ticket injection
remain unexecuted there. Existing per-result `work_finish` failure semantics are
unchanged; this patch does not promise atomic completion of every graph ticket.

**L1 — module lexical capture identity.** `sem_source_scan` now binds a declaration
when `job.owner != null || c.scope.parent != null`. The private scan always starts
with a root scope; block/for/foreach scopes retain their parent and restore it on
exit. Module-top names still resolve through module-qualified globals. Header
initializers bind before test/update/body scanning, so mutation/address escape
records the actual declaration entity, not a same-named global. Body shadows get
a child scope; function scans bind their own parameters and do not recurse into
other function bodies. Candidate owner, ordinal and query identities are unchanged.
Preparation reserves metadata; proof completion precedes publishing immutability,
and capture consumers suspend/observe that proof before rejecting a mutated,
escaped or uninitialized declaration. Interpreter `ix_value_input`/`ix_local_binding`
still check owner/current-frame declaration membership, not coincident offsets.
The scan conservatively records writes; only executed staged reads demand captures,
so the lazy untaken tests do not require an eager evaluation of both branches.

Read all five new negatives and the positive controls: header update/body write,
address escape, block-local write, shadowed header versus immutable outer value,
known immutable header/block values, type-only mutable queries and untaken staged
calls. The nine-case checker retains the original four negatives, exact mapped
file/line/column and cross-width/worker error offsets, no partial program, drained
terminal retries and unchanged owner counts. Selector/control-smoke and final
positive CTests still call the existing providers. L1's journal records actual
32/64 ×1/4 checks at2a5477be, then only affected Fast canonical checks after
4bbde387's backend adoption (native `4835472a…f5d2e2`, semantics `c131e34c…309f`).
Those execution identities remain separate; no new runtime or race claim here.

**D2 — exact process and negative contracts.** The CMake wrapper supplies the
original interpreter/jobs/resources arguments, requires every input variable,
and captures stdout/stderr without stripping. It accepts only child result0,
complete stdout matching `^0\r?\n$`, and empty stderr; a nonzero/signal/launch
failure becomes a failing CMake result with the original status/output retained.
It does not return the child's numeric exit code unchanged, but cannot turn that
failure into a pass. Four fixtures ×workers1/4 now use this boundary without a
PASS_REGULAR_EXPRESSION override: decltype_type_fields, alias_type_query_controls,
module_loop_queries and module_header_capture_controls. Other successful values
and tests remain unchanged. The alias provider's extracted helper retains the
original inference-negative exact message at `read(actual)` and adds the unchanged
scalar-condition fixture's exact `An integer literal needs an integer type` at
`1 {` (2:4). Both check public source mapping, no partial program, failed count1,
stable offset and repeated nonwaiting/waiting terminal calls at32/64 ×1/4; source
and resource buffers outlive each batch. Existing `all`/type-smoke/type-errors and
explicit alias selector retain this coverage; no duplicate runner/model.

D2's journal distinguishes initial six positives and intentional output10/exit7
rejection controls from the final joined eight positives plus both negatives at
5fc375e8/eb673364 (compiler `96ed3119…94796b`, runner `e65cbdaa…6000`). Adoption
of those receipts is source-bound; filtered cases, builds and negative-control
aggregate exit8 are not additional passes. **No additional concrete defect found**
in these three deltas. Prior C-registration repair stays D2-owned. Later A2
body-local forwarding and B1/B2 performance work are excluded; no new census or
acceptance expansion. Local14-path manifest is in
`build/d1_ecs/joined_correctness_review_ea606d32/`. No build/test/profile/sanitizer
or release action was run; documentation-only profiling is inapplicable and
passing owner tests do not establish general race freedom.

### 2026-11-23 D1: module-local declaration queries at 0ffba950

Frozen published main `0ffba950ae4b7e583531f5eb88aa608c6c2bb380`, tree
`71c6bd706f5f277f3c180b6032bc7e11f5a17cfb`, compiler
`b90a997e29d4d30547a026b5b5d1481bf6a41579`, library
`62350befa8df3e261fd184a23a64e6bb7263204a`. Independent review of A2's
125efb11 repair integrated through e932b546. All six authored Tower blobs below
still match125efb11; earlier unchanged producer reviews remain adopted.
No production/fixture edits or runtime execution in this review.

| Path under scaffolding/ | Exact reviewed Git blob |
| --- | --- |
| compiler/semantic_declarations.tower | a17d92575e516952cabdd0487df0728d5c69ce73 |
| compiler/semantic_statements.tower | 9381f563d1f3175a47d8e14873105f2ece00829d |
| tests/module_body_type_minimal.tower | aef47ca51051b156c71ca65b794dacb6aba85b67 |
| tests/module_body_type_queries.tower | 336c1424856b01c3e9ad9a567eba71fc3256ecd3 |
| tests/module_body_type_checks.tower | 5f54416bafc88a7625b2d3633b6e8c80a9d36675 |
| tests/execution_main.tower | 6051438d971a4d6ae3e63641b088336fe56f28f2 |

**Boundary and ownership.** `sem_statement_impl` binds CoreDeclare once, then
selects `sem_module_declaration` only for a nonglobal local with current=root,
no active declaration frontier, no entity stage and no query-read set. Function
body/header continuations still suspend through `sem_body_run` and consume their
prepared statement; worker discovery/checking installs query_reads even when no
stage is needed, so it cannot enter this new coordinator pump. Module for-header,
loop-body and nested block locals retain their actual scope/current in the
world-owned declaration component. `sem_body_save/restore` also preserves loop,
label, defer, control-name and flow-dependency state. Queries are keyed by node
identity/kind in the existing graph, not source offsets or spelling; this change
adds no type/function registry, alias identity or cross-world storage.

The helper saves/restores declaration_subjects/isolation with defer, owns only a
temporary subject vector, and uses the existing declaration state/admission and
shared discovery/execution pumps. Registration installs declaration/type-index
access and root-body write access for local storage; discovery seals/demands its
producer. The shared pump obtains tickets/leases and lane/byte admission before
dispatch, joins and publishes stages before structural continuations, and imports
retained worker scratch through `sem_declaration_error` before restoring lexical
pointers. It yields/suspends for missing type/call/layout producers; the coordinator
alternates declaration and shared query pumps while progress exists, then reports
the owning declaration's retained failure or unresolved/cyclic dependency. The
new helper does not force completion from a worker or add recursive type checking.
Its raw subject vector retains the existing coordinator allocation contract;
this does not extend the world budget to every raw/foreign allocation.

**Storage and effects.** The helper reports type completion before initializer
admission. `sem_declaration_type` consumes prepared ordinary type results and
records completion on the declaration; inferred initializers retain their checked
`value.value`. The declaration continuation waits for constructed layouts, then
readmits storage allocation with subject/current leases and its Body write claim.
`storage_ready` prevents duplicate frame slots. Only an explicit initializer still
missing its checked value receives an Initializer expression query with an edge
to the completed declaration. After success its lexical state/value are restored;
`sem_declaration_finish` sees existing storage/value and cannot recheck that
initializer. Runtime operations stay on the same Foundation nodes at their
lexical execution positions. Unknown type and by-value cycle errors stop before
initialization; cleanup restores the outer frontier and clears temporary generic
errors without replacing the retained producer diagnostic. No additional concrete
producer defect or interleaving was found in this delta.

**Actual fixture/registration scope.** The seven-line minimal source preserves
uninitialized raw Foundation storage and takes the earlier local's address after
`box(decltype(header))` and its ordinary `forwarded` alias resolve identically.
The initialized fixture checks aliased mutation42/43, target usize layout4/8,
inner i16 shadow7/layout2, two loop entries and two `once()` effects. A separate
function/nested-scope source checks the unchanged body path. Unknown-constructor
and recursive-layout sources retain exact diagnostic text, including the existing
instantiation trace, reject Graph/Fast start with zero machine steps, and compare
raw error offsets between engines/workers within each target width.

The suite is **44 compile-session configurations**: five sources ×two widths
×two worker counts ×two engines =40, plus two width-specific canonical reparses
at workers4 ×two engines =4. Of these,28 compile/execute positives and16 exact
negative sessions; they are not44 independent processes or an overlap measure.
Each trial's two sessions close before module/world/ledger teardown; final bytes,
lanes and live grants must be zero. Per-source canonical text agrees between
engines/workers. Reparsed canonical text executes the same oracle; this does not
assert byte-idempotence against the original text. `body-type-reproduce` selects
only the minimal32-bit/one-worker Graph/Fast pair; `body-type-queries` returns
before the unrelated suite, and default `all` calls it once. Existing CMake
`tower-execution` invokes that default runner; there is no new runner/model.

Two bounded coverage limits remain explicit, without turning them into defects:

- The effect counter is incremented by an assignment's `once()` call, while the
  new explicit declaration initializer is `&original`. An effectful initializer
  taking its **own** already-allocated address is not directly exercised. A small
  proposed Tower control is `var self:decltype(header)=address_once(&self)` with
  `address_once(usize*)` incrementing an effect counter and returning the address
  bits; compare that value with `&self` and the exact loop effect count. This was
  neither added nor executed here.
- Negative mapped line/column are printed, not compared with an independent
  expected file/position in this harness. Exact text and stable offsets are
  asserted; the owner's observed1:69/1:37 locations remain log evidence. No
  negative is silently relaxed or relabeled as checking an independent location.

The [owner receipt](compiler_module_body_types_78d675c4.md) retains the original
unknown-forwarded failure and candidate44/query/type/header checks. Its merged
27fcab01 adoption reran44/query/expanded-header checks with semantics SHA256
`16f13e9f461f26947b67dca4356c08ea1a4ccf25dbc354feb64b02b00c253cee` and execution
`9a347ea2e14fce578f1e6ae9405ff137b4965c38c26473cf5794e1f62701f648`; older type-smoke
and paired measurements keep their earlier identities. Minimal/source SHA256s
6020b38c…f7df /67a2daf1…dd1 match that receipt. This review read the code and
published receipt, not inaccessible raw logs, and did not rerun those checks.
Later B1/B2 performance/browser changes, current generations and hosted release
are excluded. No build/test/profile/sanitizer or rejected operation was attempted;
documentation-only profiling is inapplicable, with no general race-freedom claim.
Local frozen six-path evidence: `build/d1_ecs/module_declaration_review_0ffba950/`.

## Module-body declaration coverage closure — 2026-11-23

Source `4354581caeaf2bc71189617c04d48cdd45750f9e`, tree
`852fe967cc7a3b2f13fe39530a170ca4fddae048`; unchanged compiler tree
`b90a997e29d4d30547a026b5b5d1481bf6a41579`, library
`62350befa8df3e261fd184a23a64e6bb7263204a`, plus the two test edits below.
This executes the two coverage controls proposed by the preceding review;
it does not replace its source proof or broaden the accepted production scope.

| Path under scaffolding/tests | Change and checked boundary |
| --- | --- |
| `module_body_type_queries.tower` | `address_once(usize*)` increments a separate counter and returns address bits. Each module-loop entry initializes `self:decltype(address)` from `&self`; it never reads uninitialized storage. Booleans check the initialized address and one new effect per entry; the final counter is2. Existing assignment effects2, aliased values42/43, usize layout4/8 and nested i16 shadow7/layout2 remain asserted. No nondeterministic address is printed. |
| `module_body_type_checks.tower` | Expected failure records pair the unchanged exact message with an independently chosen source-token marker. A counted scan of the actual ASCII source derives line/column before compilation; mapped filename must equal configured `module_body_type_input.tower`. Unknown is1:69; recursive layout is1:37. Existing instantiation trace, raw-offset consistency, rejected Graph/Fast start/zero steps, canonical equality and zero-owner teardown remain intact. |

Provider SHA256 `bec273a2f826ebaf6cc2629499df66486a1d7a8199bdb6852723ace5863d1962`;
runtime fixture `89164e03bc33971283616fb799a5955f7c14c2268d095737452984a404f920b9`.
The minimal fixture and `execution_main` registration are unchanged; the latter
remains blob SHA256 `28debac10c7ddaa3ccd325e8e331df61d87e75ff93bd2ee526e2b50cb130fd2c`.

The existing selector was executed once with final inputs: **44/44 compile-session
configurations pass**,28 positive executions and16 negatives. This is Graph/Fast,
32/64-bit target pointers, workers1/4, plus four canonical reparse sessions at
workers4, not44 independent processes or a measured-overlap claim. All owner
teardown assertions passed. Two temporary controls actually rejected bad inputs:
wrong expected token `value:unknown(...)` yielded expected1:63 versus actual1:69
and aborted at the mapped-location oracle; doubling only the runtime helper's
counter increment aborted at the exact-output/effect oracle. Each returned134;
both mutations were restored and their sources/logs retained before the final run.

Docker `tower-d1-ecs`, image `4be584fb42a6cefb921b8f8bd686f61ef6e7e721eee2393b2ab1dfce16a7f4f6`,
CPU0,2/8GiB, Release native Linux x64, jobs1; public bootstrap SHA256
`768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138` checked against
its manifest with no override. Only `tower-execution-tests` was requested. The
stale cache needed35 dependency actions; the first attempt failed on a new
file-scope string initializer (library executable-statement rejection). Moving
that filename literal into the trial fixed the provider; the next two builds
were the two-action test object/link leaf, including restoring the position oracle.
No production source or runtime semantics changed.

| Check, one sample each | Wall s | CPU s | Peak RSS KiB | Result |
| --- | ---: | ---: | ---: | --- |
| Initial execution-target build | 216.77 | 211.26 | 1082876 | failed; preserved bootstrap diagnostic |
| Corrected provider, wrong-position build | 17.94 | 17.35 | 509264 | pass |
| Wrong-position control | 7.21 | 5.64 | 183908 | expected abort134 at position oracle |
| Restored final provider build | 15.53 | 15.08 | 509452 | pass |
| Doubled initializer-count control | 5.22 | 3.75 | 183208 | expected abort134 at output oracle |
| Final44-session selection | 21.77 | 21.55 | 206252 | pass, exit0; no timeout/skip |

Command: `tower-execution-tests /home/deck/tower-agent-1/scaffolding body-type-queries`
under GNU time and a180s guard, with the same current source/resources. Final binary
SHA256 `f1e4d5e35498aac105f15651fc43942a6a39465cca1257a0b552b16e8763e8af`.
Build/run inputs were checked before and after; local evidence is
`build/d1_ecs/module_body_oracles_4354581c/` (`*.build.*`, `*.run.*`, input manifests,
restored/failing Tower variants and preserved old/new binaries). Final input
manifest SHA256 `e337bb9aa8c04f841f6685350f54a8fcfd0469a6e5f9ef7df2a6d55aee5a452b`
precedes the documentation-only README addition. The old runner was preserved,
not claimed current; the owner27fcab01 baseline retains its original identity.
These are warm-cache validation costs, not production before/after speedup or
scaling evidence. No production-performance profile is applicable to fixture-only
changes. No broad type/lifecycle/browser/generation/sanitizer/release check was
run; ROOT owns that final milestone. All owned jobs drained before releasing the
successfully acquired heavy lock; no general race-freedom claim.

**Affected merged adoption.** The first push raced with B2's published inline
component-index change. Complete upstream4a8694da was merged as
`fd8f8dac6c0258dfa9c5f8597cc6aaad8ee8f9a8`, tree
`133fcd0cf734a346753ba4faef544add59e8c900`, library
`407c47fe6a2d52c7b1ce29104e0e1b75d353e171`; compiler tree remains unchanged.
The changed `Entity` layout invalidates native dependencies, so the same target
was refreshed (nine actions,109.21wall/106.37CPU/1082524KiB, exit0), after another
successful exclusive lock acquisition. The unchanged fixture/provider selector
then passed44/44 again:19.71wall/19.46CPU/196920KiB, exit0/no skip/timeout, with
all exact positions, canonical/effect and zero-owner assertions retained.
Runner SHA256 `98e686dd2b486c0eaf5fe0a1563a75a7a80938017e0c6c4aa1d982406f91ae84`;
merged input manifest `7b644c509b65e02126d0423fae212815088693e7a120f45c3c2b71bf3727492b`
verified after execution. `merged.*` evidence retains this separate boundary.
The two unchanged oracle controls were not rerun; no broader test was launched.
Incoming browser/byte-test receipts keep their own identities. All owned jobs
drained and lock released; these n1 costs do not establish a performance change.

## Unsigned multiply-overflow review prerequisite — 2026-11-23

**Blocked before changed-source adoption.** Published main at both initial and
post-contract pulls remains `cabc2062fd67283bc78cf235981741e917671d24` (tree
`0e1a94bcd0766ba27862561f2f455c3ba374b874`). Requested L2 implementation
`a5ffb99d` is absent from this published history/local object database; the new
helper, overflow fixtures and owner receipt cannot yet be inspected. No private
branch was fetched, draft copied or unseen implementation approved. The retained
current25 entity_views failure and L2's reported repair remain owner inputs,
not independently verified execution here.

Existing immediate context was substantively traced, reusing the accepted
raw-pointer/aggregate reviews: `bi_function` preallocates instruction destinations
before block emission; `bi_edge` snapshots incoming phi values before committing
edge copies; `bi_value` reads an SSA binding instead of replaying its producer.
`bi_scalar` maps i1/bool, i8/u8, i16/u16, i32/u32 and i64/u64; intermediate widths
use a wider carrier plus `bi_mask`. Thus the new bound must use the **LLVM integer
width**, independently of host/target pointer size and carrier width. `bi_select`
materializes both supplied expression operands before its branch: division must
be constructed with a nonzero divisor or inside the guarded branch, not merely
passed as the supposedly untaken operand. Existing poison/undef values become0;
that totalization is not proof of arbitrary LLVM poison equivalence.

[LLVM19's intrinsic contract](https://releases.llvm.org/19.1.0/docs/LangRef.html#llvm-umul-with-overflow-intrinsics)
returns product plus an overflow bit; extraction indices must identify the
aggregate field. Independent proposed oracle for nonzero b is
`a > floor((2^width-1)/b)`, with a zero-operand result0/false. Width1's1*1 must be
1/false; max*2 at widths8/16/32/64 must wrap to max-1/true. These are review
criteria, not new executed assertions. Multiple extraction users, dominance,
exact index rejection and nonextract consumers still require the actual helper.

`backend_session_import` verifies the optimized module before import;
`backend_import_foundation` retains world/stage/lease ownership and publishes only
a successful private graph. `backend_source_import` formats/rechecks standalone
Foundation before replacing prior output. Existing backend source tests/registration
were read; no new overflow registration or width/control claim can be adopted
without the unpublished delta. Baseline importer blobs: instructions
`d36288ffeada7e65cf8d6349fd05f5ff993c2509`, module
`214fcd69fa0ca361b52b064279c43f2ddce3334c`, values
`7022ac6b3e7b771e97b3f1057bd4a5ab2da1884f`, Foundation helpers
`40dd310a37091c61a432a658db2327a401f96bf4`. Local finite context manifest:
`build/d1_ecs/umul_review_cabc2062/{identity,blobs,published_main}.txt`.
No new concrete defect is asserted in the unseen change. ROOT/L2 prerequisite:
publish complete implementation/fixture/receipt history, then independently
review that exact composed source. No producer/test edit or build/runtime/profile
was attempted; documentation-only profiling is inapplicable. D2's slot and all
prior failures remain untouched. This is an incomplete review, not a closed gate.

## Published unsigned multiply-overflow review — 2026-11-23

The preceding publication prerequisite is resolved. Freeze
`a06ec4b1f9f44419882477bc1a55b6ed39e2200b`, tree
`057500a4a7e8a687ecdb383825709f19c7e2b676`, backend
`e6f2cf5da2d358ddeab719d4b08098f81aa590bc`; implementation
`a5ffb99d5d9dbd341ff3574676687f456245b9ea` and fresh caller `3bc5f626` are published.
Read the composed changes with the prior importer/width/SSA/stage contracts.
This is independent **source review**, not a rerun of L2's native checks.

**R1 — admitted i1 reconstruction fails Foundation checking (source-confirmed,
not executed here).** `backend/import_instructions.tower:37` accepts i1, mapped
by `bi_scalar` to SBool. At line51, `bi_multiply_overflow` constructs `OGt` on
`b` and `limit`, both bool. `bi_binary` legalizes boolean arithmetic only for
op<8; OGt is12. `semantic_support.tower:166,175` excludes bool from numeric
operands, and `semantic_values.tower:1177` rejects the emitted comparison with
`This operation requires integer operands`. The shared formatter emits that
comparison unchanged. The arithmetic construction avoids division by zero, but
the standalone Foundation recheck cannot accept this function. No current25
program is claimed to have generated this i1 case; it is an admitted-input
boundary defect, separate from the repaired observed i32 allocation guard.

Small exact LLVM trigger for the existing **Tower-owned** import probe (retain
this verified module without O2, which may simplify i1 before import):

```llvm
declare {i1, i1} @llvm.umul.with.overflow.i1(i1, i1)
define i1 @flag(i1 %a, i1 %b) {
entry:
  %pair = call {i1, i1} @llvm.umul.with.overflow.i1(i1 %a, i1 %b)
  %overflow = extractvalue {i1, i1} %pair, 1
  ret i1 %overflow
}
define void @tower_main() {
entry:
  %value = call i1 @flag(i1 true, i1 true)
  ret void
}
```

L2 owns the producer and active fixtures. Proposed smallest Tower regression:
construct this call through the existing LLVM C API fixture, import/format/recheck,
then require the four bool input pairs to return overflow=false and product=a&b.
No new harness, parallel implementation or unrun fixture was added. This is a
source-derived expected failure phase/message, not an observed runtime offset.

| Reviewed path under scaffolding / exact Git blob | Disposition |
| --- | --- |
| `backend/import_bindings.tower` `eee01fad5654152a55ee7cdbad85c4c521d62553` | Seven LLVM foreign declarations match pointer/u32 API shapes. IsA guards precede index access; one index is required before reading element0. Uses/indices remain borrowed from an unchanged LLVM module through the synchronous import. |
| `backend/import_instructions.tower` `9d29dcbcbdf5c261f53743c268350f7931b5d6d8` | Direct intrinsic recognition, guarded unsigned division and per-extract assignment reviewed. R1 affects i1. No additional numerical defect found for unsigned carriers8/16/32/64 or other admitted widths2–64. No operand-producing call is replayed. |
| `backend/import_module.tower` `7af1cfc513546c2c2a7036253c7ea431c8f3a2d3` | Excludes only the recognized aggregate call from scalar-local creation; every scalar extract retains its distinct destination. All blocks are predeclared before instruction emission. Existing staged publication/discard and source/output ownership are unchanged. |
| `tests/backend_source.tower` `4e61066cd7c7aafba610bfa1df6a81d5d8935cf1` | Existing shared native/browser source suite calls the new u32 guard check. It asserts successful optimized import/recheck and actual intrinsic presence; it does not itself execute returned output. Session cleanup is deferred. |
| `tests/backend_source_native.tower` `a0f3d4f9093a980bea73a661783dde66c6218256` | Explicit optimized mode preserves default unoptimized/deny/census behavior, validates width4/8 and workers1/4, and saves actual optimized IR. Existing checked output, source response and world/budget teardown remain; saving text is not execution. |
| `tests/backend_unsigned_overflow.tower` `ea76fd44f9601104df57fc96954682ebdd73af21` | Twelve literal product/overflow cases for u32/u64: both zero orders, max*1, max*2, square power-of-two overflow, neighboring-factor exact max. Exported operations remain in optimized IR; original top-level constant calls may fold. |
| `tests/backend_unsigned_overflow_calls.tower` `74e4f363f8127b394be145b2afbeac628c8f82dc` | Fresh ordinary caller repeats those twelve independent expected outcomes against the unchanged reconstructed module. Required lexical mount is documented; expected0 LF0 LF includes the imported module's folded print and the fresh checks. This closes the original folded-call evidence gap. |
| `tests/driver_c_cases.tower` `a5199568130bec941f81bf4ccbc13c074a8dfd7f` | Native C-driver selection adds the original overflow fixture and preserves backend_void_returns_direct. This is registration, not execution or coverage of imported extractvalue paths. |

**Numerics and order.** The helper uses LLVMGetIntTypeWidth, not pointer width or
its wider carrier, for `2^w-1`; u64 wrapping makes the w64 computation all ones.
`bi_mask` preserves the low w product bits. A nonzero divisor is selected and
assigned before division; for a=0 the flag is false and product0, while b=0 also
compares false. The formula is mathematically equivalent to the independent
bound a<=floor(max/b) for b>0. Fixture verdicts use exact constants/factor identities:
(2^(w/2)-1)*(2^(w/2)+1)=max, while the square is2^w and max*2 wraps to max-1.
No overflow-prone wider u64 reference is assumed. Graph/Fast share scalar unsigned
arithmetic and target-aware storage; that source connection does not constitute
a newly executed Graph/Fast differential.

SSA operands resolve to earlier locals/constants; helper temporaries are emitted
once at the call's position. Each extraction has its own predeclared local, so
multiple users of either index are assigned independently before control leaves
the call. Moving pure scalar extraction assignments to the dominating call does
not move operand effects. Existing phi-edge snapshots and labels retain loop/CFG
order even when block listing order differs. LLVM use-list traversal mutates only
Foundation entities, so next-use pointers remain valid. Nonextract users fail;
some aggregate users fail even earlier in scalar predeclaration. No partial stage
is published on either path. Index>1/depth!=1 are rejected before assignment;
missing destinations become typed Invalid. Normal session import verifies LLVM
before these operand APIs; this does not authorize calling the raw importer with
malformed/unverified arity or type shapes. Existing first-error text/offset and
resource causes remain retained by backend_fail/backend_resource_fail. Source
recheck retains the prior canonical output on failure. The graph/stage/vector
owners and single-session mutation contract remain unchanged.
The helper does not update source_offset; a retained backend offset is not a new
precise source mapping for an optimization-generated intrinsic.

Supported scalar intrinsics are not permission for all LLVM aggregates: vectors,
integers>64 and other overflow families still fail. Existing poison/undef-to-zero
selection and freeze handling are unchanged; defined-input arithmetic is reviewed,
not full poison equivalence or general arbitrary-LLVM import. LLVM contracts:
[unsigned multiply overflow](https://releases.llvm.org/19.1.0/docs/LangRef.html#llvm-umul-with-overflow-intrinsics),
[use iteration and checked index API](https://github.com/llvm/llvm-project/blob/llvmorg-19.1.0/llvm/lib/IR/Core.cpp).

**Evidence adopted and finite follow-up.** L2's journal retains the original
current25 entity_views failure, native before/after controls, actual optimized IR,
and post-Entity-ABI/source-gate checks. Reconstructed u32/u64 module SHA256
`b4e571ae3aa898c4b8be1b2779212b7e0812815033bb0e203c0db90642089251`; fresh caller
SHA256 `a860f8e84a16f539d61a4f5cbe7073e2e98c3ea4191c7a604ad9375a4ad473ec` matches
published bytes. Owner reports target32/64 ×workers1/4 fresh executions with exact
0 LF0 LF and empty stderr; original folded calls are not counted as boundary
execution. CLI mode is Graph unless --fast/package is requested; the published
fresh-call receipt does not establish both engines. Source-service owner counters
are separate from CLI execution, which did not expose those counters. Existing
CTest source-worlds runs the inline compile/recheck assertion; README documents
the fresh caller, but no automatic CTest/Node registration executes that mounting
procedure. C-driver addition was not run by the owner. No external raw log was
independently authenticated here.

Required remaining edges for ROOT/L2 are finite: (1) repair/test R1 at i1;
(2) retained i8/i16 intrinsic controls, explicit product index0 plus duplicate and
cross-block extraction users; (3) direct nonextract rejection and verifier/index
negative controls preserving the first diagnostic and prior output. Owner IR
receipt explicitly mentions flag extracts and separate wrapped multiplication;
it does not prove product-extract0 coverage. Use the existing Tower import fixture
and fresh caller, with both requested Graph/Fast modes where acceptance needs it.
These are gaps, not additional asserted bugs. Reactor/current25 T8 continuation,
Wasm fit and final release remain ROOT/L2 acceptance work.

Local eight-path blobs/SHA256 manifest: `build/d1_ecs/umul_review_a06ec4b1/`.
Only audit/journal documentation changed. No build, runtime repeat, profile,
sanitizer or release operation; documentation-only profiling is inapplicable.
No blanket race-freedom claim, new census or change to another owner's code.

### D1 admitted i1 overflow repair — e637ba38 plus focused delta (2026-11-23)

This implements the concrete R1 from `8ff77438`; the preceding source-only and
L2/a06 receipts remain historical. Freeze
`e637ba384037a6305fd945dd1e7c6296f5a98635` (tree `7c436acebec71d92c46736a49f2d173f5b0524d3`),
compiler tree `1830db721a8d96a54a2e38a5d2ef20ece56561f3`, library tree
`c6fed2e3602a422e120bfcafa67d5a31f18e4a0b`, plus the following tested blobs.
L2's frozen reactor/current25 fixtures and A2's source-native census are untouched.

| Path under scaffolding | Tested blob; implementation and coverage |
| --- | --- |
| `backend/import_instructions.tower` | `057d57de2b64f1958ce1d3a0d5e82df0cd6ea025`. `bi_multiply_overflow` branches on actual LLVM width1 before constructing arithmetic: existing `bi_binary(OAnd)` and `bi_const(SBool,0)`. The shared bool binary builder legalizes AND through u8; no bool multiply/divide/ordered comparison is constructed. Wider guarded divisor/max/product path, SSA lookup, dominating call placement, per-extract locals and checked stage ownership are unchanged. |
| `tests/backend_overflow_fixture.tower` | `d5b7bde6d47c81f6a3b612dfa70862aaf34ae1c8`. LLVM C-API boundary, verified without optimization. Intrinsic operands are parameters of an ordinary called probe, so the check is not an O2-folded print. i1's four-row truth table; i8/i16/i32/i64 ten-row oracle covers both zero sides,1,max/max*1, first out-of-range products and wrapped results. Factor identities `(2^(w/2)-1)(2^(w/2)+1)=max`, `(2^(w/2))^2=2^w`, `max^2 mod 2^w=1` are independent of the importer quotient algorithm. Both/product-only/flag-only modes each have distinct extracts in entry and two successor blocks, exercising both branches and call dominance. Valid aggregate-store, vector and i128 modules reach exact rejection; no malformed LLVM/index is used to evade verification. |
| `tests/backend_import_fixture.tower` | `71ec8c886404b3124c80722e3411834cbea56389`. Imports the new exported fixture into the existing native backend-check unit; original bytes/admission fixture remains intact. No duplicate backend implementation in the storage provider. |
| `tests/backend_import_overflow.tower` | `e9b2a9694bf892228fc0dfa45767959e3d696643`. Thirty verified/imported/formatted programs, independently reparsed and executed in Graph/Fast at target32/64:60 configurations,528 dynamic probe calls. Exact `0\n` output, bounded steps and success required. Eight negative trials assert exact text/resource/offset, prior-error preservation and unchanged entity/component census/no partial stage. Original LLVM world closes before recheck; every session/world, budget grant and instrumented buffer count drains. Failed rechecks refuse both execution starts with zero steps, then cleanly return1. |
| `tests/storage_main.tower` | `39a0edc990a5e2dc3c331174476649d44a10cd14`. Existing `backend-import` selector runs its original admission/fault suite then all overflow trials once. Two narrow selectors permit i1/wider comparisons. Existing CTest `tower-storage-backend-import`, labels and120s timeout are reused; no new runner or all-selector duplication. |

Actual baseline before editing the helper: all12 i1 configurations passed LLVM
verification/import/formatting, then rejected Foundation recheck with exact
`This operation requires integer operands`; Graph/Fast could not start, owners
drained, exit1. After the fix all12 pass, including all four boolean pairs.
Wider48 configurations and eight rejection/first-error controls pass both before
and after. The final actual registered CTest also passes the original allocation
sweep (140 healthy reconstruction allocations,298595 peak budget bytes; zero
retained owners after cleanup) plus all60 configurations. No skips or timeouts.

Deck Docker `tower-d1-ecs`, CPU0,2/8GiB, Release native x64 LLVM19, canonical public
bootstrap768a0cdf, `TOWER_COMPILER_JOBS=1`; only dependency-aware
`cmake --build .../native-coherent-127ca98 --target tower-storage-tests --parallel 1`.
One fresh-process sample each; warm filesystem, no warmup, single-owner work host.
Values below are wall / user+system CPU seconds / peak RSS KiB:

| Check | Before | After |
| --- | --- | --- |
| i1 selector | 1.64 /1.60 /118268; failed recheck | 1.56 /1.54 /122372; executed successfully |
| Wider selector, same fixture/resources | 5.72 /5.67 /127000; pass | 5.65 /5.60 /126692; pass |
| Full existing backend-import CTest | not repeated as baseline | 7.91 /7.65 /127068; pass, CTest7.88s |

Candidate incremental build:12.51wall/12.23CPU/496932KiB; only backend native
object and link rebuilt. Fixture development errors (missing `strcmp`, missing
`sem_attach` import, reserved `expected` local) were drained, corrected and their
three failed build logs retained. Successful fixture/provider build17.08s;
these differing build steps are validation costs, not compiler speed comparisons.
Candidate storage executable SHA256
`219736c8770a7a0368a19f9758e4e552c680dfbfb74eab99bc6aeafacddf8020`.
Exact before/after inputs, binaries, commands, logs/time and receipt hashes are
preserved in `build/d1_ecs/umul_fix_e637ba38/`.

The wider one-sample comparison shows no material regression in this focused
path; it is not scaling evidence. The exact saved608636-byte optimized
`entity_views` request was not available in the assigned/shared paths inspected,
and its source-request runner was absent from this cache. No unrelated input or
new broad build substitutes for that serial/four-worker benchmark; ROOT/L2 retain
that integrated performance gate if needed. This importer stage is serial and
its worker admission did not change. These checks execute reconstructed Foundation
in native Graph/Fast, not LLVM machine code or Wasm. Valid indices0/1 are exercised;
invalid aggregate indices cannot pass LLVM verification. Poison/undef totalization
and other unsupported intrinsic families are unchanged, not newly validated.
Threaded instrumentation, sanitizers, final reactor/generation/hosted adoption stay
with ROOT's frozen milestone; neither old a06 nor its passing tests include this
future fix. No race-freedom or whole-compiler completion claim.

### D1 seeded dependency/cancellation interaction — 1e428ede (2026-11-23)

Initial freeze `1e428ede6c33cba159b753247affd8d5cf3ed67d` plus the following fixture delta;
no D1 compiler/library/host change. Existing unit/profile tests cover forward
imports and overlap, module-body/header fixtures cover frames, and work_observe
covers stale revision/profile tickets separately. The missing composition was
admitted cancellation followed by changed seeded inputs under identical virtual
paths, with independent body captures and imported dynamic query branches.

| Path | Tested blob and disposition |
| --- | --- |
| `scaffolding/tests/compiler_dependency_seeded.tower` | `de906ee60abdda62a9ab205285f1c11a150c358c`: fixed seeds2/17/101, three units/two bodies. Existing observer gates only cancellation; two admitted jobs drain, third remains unstarted, no cancelled result escapes. New seed/revision uses fresh worlds, not an invented in-place invalidation API. Each body combines owning-frame known capture despite shadow writes, imported nominal alias, forward type/value producers, untaken cycle and left-to-right pointer effects. Ordinary invocation answers derive from explicit small arithmetic plus trace12/returns3, independent of compiler output. Real ungated distinct-thread overlap, exact canonical/error bytes and raw offsets, earliest cycle unit2 versus invalid unit3 are asserted. Close checks lanes0 and uses production world/budget disposal assertions; no unsafe global threaded allocation counter. |
| `scaffolding/tests/lr_work_main.tower` | `6dc0d79df7ead0a9c543d46ddb921f5a62e08cba`: four explicit selectors; `all` invokes correct paired fixture once. Wrong-result control returns1 after cleanup, never suppresses a compiler diagnostic. |
| `cmake/TowerWorkPolicyTests.cmake` | `3d335340a03639abdf8be2411b0bb2de70910fcb`: two focused existing-binary registrations, normal native180s convention; only deliberate wrong-result oracle uses `WILL_FAIL`. |

Actual paired CTest:15 batches (3 cancellations,6 successful compilations,
6 deterministic cycle controls),36 independent body answers; pass29.61s.
Wrong oracle: unit1/first actual1215 versus wanted1216, logged exact seeded
sources/request/workers, checked cleanup then required nonzero result; pass2.50s.
Both registered tests pass, zero skips/timeouts. Two earlier fixture build errors
(missing direct vector/observer imports) are retained and corrected, not passed.
Deck Docker CPU0,2/8GiB, public768, LLVM19 Release jobs1; only dependency-aware
`tower-lr-work-tests` target. Successful build31.20wall/30.29CPU/453152KiB.
Equivalent fresh-process six-batch samples (warm filesystem, n1): serial
11.74wall/11.52CPU/207840KiB; two workers10.76/17.61/427952. Modest latency reduction
costs more CPU/RSS; this small functional workload is not a scaling benchmark.
Full paired+negative CTest32.13wall/39.74CPU/575096KiB; no memory pressure.
Test executable SHA256 `6622c5b0f15d03f2706b865f727f59d65434445ac833a6af20bf78e2681340ab`.
Raw commands/failures/time, source/resource hashes and preserved prior binary:
`build/d1_ecs/dependency_stress_1e428ede/`. No production change: before/after
production profiling is inapplicable. Target64 ordinary interpreter only;
32-bit/Fast/browser/sanitizer/release remain ROOT's separate frozen gates.

Final adoption at `325db64171cb1f864858b0dd0e5bac66e91792b5` includes L2's
`semantic_lowering_work` registration guard: semantics+link rebuild39.40wall/
38.35CPU/1082740KiB, same two CTests pass30.62wall/38.13CPU/574704KiB with the
same15 batches/negative1215vs1216. Binary SHA256
`93cf2e288735aa1284a45fee473caaf2ada142c1f482769880adb7069b8ab00e`;
`merged_*` logs retain this boundary; initial serial/two timings are not relabeled.

### D1 bounded lazy-DEFLATE source review — e330a2c9 (2026-11-23)

Independent source review, no new runtime run or production change. Freeze `e330a2c9f27f53a077dcf500519fd2df9c287355`, tree `b3e5bcb69bf188a085d27991c44c7db8de84d186`.
A1 implementation `1c919df5` / publication `26f99a40`; all four reviewed blobs below are unchanged at this freeze. Prior unchanged codec contracts remain adopted.

| Path under `scaffolding/` | Exact blob / substantive disposition |
| --- | --- |
| `library/deflate.tower` | `b176c1d9b3adb6cfda84cab6f535db388de64d52`: bounded short-match lookahead, index lifetime, fixed/stored emission and atomic buffer replacement reviewed below; no concrete defect found. |
| `tests/deflate_checks.tower` | `0ab873249bacfd17d1472f2b077f518d0308e019`: 56 size/pattern, 49 length and 56 distance members; deterministic/aliased output and expansion bound; independently specified lazy tokens; owned input/name/compressed buffers retained through ZIP completion then freed. |
| `tests/gzip_checks.tower` | `f7f13751fb1d2b911e908229185a81ec92014cd8`: six base plus32 seeded inputs and optional payload (39 only with payload); actual GNU decoder/exact original bytes, known CRC, all truncations, reserved block/checksum failures and recovery; failed capture preserves previous decoded bytes. |
| `tests/deflate_profile.tower` | `577aa21d73ccfc646d0e9575288d2da6bfeb69c8`: immutable bounded input, size-selected repetition count, final output/capacity and disposed null/zero checks; separate correctness decoder required, not implemented by this profiler. |

`deflate_find/fixed`: search p before inserting p; insert each eligible three-byte start exactly once. Read-only search p+1 sees p; emitting a literal carries only the match pair into the next iteration, whose start is still uninserted. A consumed match indexes starts1..advance-1; final two short-tail starts are deliberately excluded.
At p, the distance32768 candidate's ring slot is still intact. Inserting p can overwrite only that now-expired candidate for lookahead p+1. Eligible links otherwise retain their slots; candidate<p, bounded distance and strictly descending next reject future/stale/cyclic traversal. Strictly longer replacement over newest-first links retains nearest ties within the64-candidate search.
Input-remaining bounds precede three-byte hashes, bound match length258 and advances, and prevent end-index overflow. Comparing overlapping immutable input is valid for decoder forward copies; prepared matches need no retained chain pointer. One-byte lookahead applies only to lengths3..32 with a remaining successor; long matches keep the prior path.
Fixed EOS/padding and whole-input stored fallback are unchanged: Larger discards private fixed bytes before stored emission; 65535/65536 split correctly, empty input is valid. Length3..258, distance1..32768, overlapping copy and stored LEN/NLEN agree with [RFC1951 sections3.2–4](https://www.rfc-editor.org/rfc/rfc1951).

`deflate_compress`, `gzip_compress`, `bytes_*`, `zip32_write`, process/capture/streams and package callers were read. Nonempty-null and stored-size overflow reject before reading; failed allocation/build closes private buffers/arrays before publication. Source may borrow valid caller output because disposal occurs only after all reads/CRC/trailer work. Raw helpers still require valid descriptors/spans and internal policy counts.
Both match arrays remain call-owned with deferred free; prepared state adds no allocation/shared mutable index. ZIP retains original and compressed entry owners through CRC/output construction. Failed child capture closes/reaps and leaves caller output intact; gzip header/CRC/ISIZE semantics follow [RFC1952 section2.3.1](https://www.rfc-editor.org/rfc/rfc1952).
Package tools compress into staging and fail before manifest publication; this is not whole-filesystem rollback (a failed staging-file write can truncate that file). Playground/compiler-project/Roku callers use the shared codec for packaging, not a measured frontend compilation hot path.

Independent lazy oracle trace: alphabet24 + `!Y` + `abc?Y` + alphabet24 (55 bytes) must emit literal prefix26, match(3,26), `?Y`, match(24,31), EOS. At position30 greedy sees length4/distance5; lookahead31 finds length24/distance31 and must defer. The test specifies tokens independently of search, but shares symbol/bit encoders; external reference decode supplies the separate byte-format oracle.
Seeded mixed generation reads only already-written bytes; manual length/distance boundaries exercise overlap. These are standalone providers documented in `scaffolding/tests/README.md`, not newly registered/executed CTests. ZIP generation alone is not reference decoding; gzip negatives exercise GNU decode plus existing atomic capture, not a Tower inflater.

[A1 receipt](deflate_lazy_a1.md) reports old-code lazy assertion abort134, then161 independently extracted/byte-compared ZIP members,39 GNU gzip round trips and29/29 truncation rejections plus corruption/recovery. These are owner-run results, not D1 executions or independently authenticated raw logs.
Same frozen35420122-byte a06 input SHA256 `8acbaf08545d0ce972f2de7db2a89fcfc7ef434f95f775feca06dde759107697`: owner gzip13671333→12786963B; warm n2 wall2.71/2.72→3.30/3.35s, CPU1.58/1.57→2.18/2.20s, peak RSS62488/62008→60456/60456KiB (KinmenA Docker, serial codec, public768/Clang19).
Source-derived retained gzip capacity is2*(final_length-8) for this large append sequence:27342650→25573910B, distinct from payload/RSS. Scratch remains(4096+32768)*sizeof(usize)=294912B on x64; no peak-live/allocation-count measurement was added. Owner accepts added package CPU/time for884370 fewer transfer bytes; no compiler-throughput/scaling claim.

No additional concrete defect found. This source-only documentation delta needs no runtime/performance campaign; no allocation-denial sweep, independent rerun, sanitizer or race proof is claimed. Final package/current-artifact/hosted adoption remains ROOT's gate; later incoming source edits are excluded from this freeze.
Source/blob and caller manifest: `build/d1_ecs/codec_review_e330a2c9/`; owner raw logs (not accessible here): `C:/Sandbox/build/codex_ecs_20261122/A1/cache/deflate_1e428ede/`.

### D1 pointer-order reconstruction/runner peer review — 503677d9 (2026-11-23)

Source-only freeze `503677d9c8707c21bdfcfb19d20dc250ba131c31`, tree `333ed236e2e1600be71ee0454905ab8eec39ca54`; L1 implementation `015aa9ed2967fa3528852f8c0b2ee36eb101dfd3`, published through `524ad027`. All seven changed blobs remain identical to the implementation; earlier unchanged importer reviews are reused.

| Path under repository root | Exact reviewed blob / disposition |
| --- | --- |
| `scaffolding/backend/import_values.tower` | `c08aa6dc6168ddc7330bfa8a088f01a2ad36dac5`: ordered pointer comparison alone gains target-width integer operands; signed/unsigned mapping and checked temporary materialization are sound within the supported address-space0 target contract. No concrete new defect found. |
| `scaffolding/tests/backend_pointer_order.tower` | `9214cbc1ebe85cb6236791c37c7b6bc6ec105b70`: independent masks44/35/26 encode less/greater/equal; effect trace12, same-array endpoints, target-derived sign bit, equality/null without raw dereference. Covers four unsigned ordering predicates plus eq/ne, not signed ptr predicates. |
| `scaffolding/tests/backend_pointer_order_checks.tower` | `7474163db4768eea30729ec565290a311d78b538`: retained input/baselines, Graph/Fast workers1/4, exact output0/newline and canonical-byte equality; explicit100000000 fuel applies to this opt-in selector, including reduced inputs, not a size-triggered global increase. |
| `scaffolding/tests/execution_main.tower` | `e59f6ef19d090235b8c1e73db1a6c3ef747a9d01`: exact argc5 selector and width4/8 validation; existing argc2/3 dispatch/all suite unchanged. No hidden LLVM normalization in this branch. |
| `scaffolding/tests/module_body_type_checks.tower` | `55407fac4f622a6968ec631caae2b66d9ad18a55`: old signature delegates with unchanged100000 fuel; only explicit helper parameter replaces the old constant at execution_run. Negative diagnostic/location/failed-start checks and zero-owner teardown unchanged. |
| `cmake/TowerBackendSourceTests.cmake` | `37e3915eec743028a2df4861f2ba3b7df8659a40`: four Linux native optimized imports, widths4/8 × workers1/4, unique output paths, existing wasm-runtime dependency and lexical .tower mount; existing180s/native/backend/focused convention. |
| `cmake/TowerExecutionTests.cmake` | `9101e6668bd4f20ae6c4ab330641ab498f6288f4`: two explicit-width direct execution registrations using the original fixture. They do not consume the four generated import outputs or establish an automatic import→execute dependency. Owner manual reconstructed-input runs are separate evidence. |

Producer proof: `bi_instruction` obtains each SSA operand once, then `bi_compare` materializes left/right bits casts through existing locals in order. Previously emitted calls/loads are referenced, not replayed. Min/max's other caller remains integer-only. Predicates32/33 bypass the new branch;34..37 compare usize;38..41 then use existing i32 bits at32 or u64→i64 bits at64 and subtract4 to select the same ordering op. No numerical conversion loses the pointer sign bit.
These enum/semantic mappings agree with [LLVM19.1.1 Core.h](https://raw.githubusercontent.com/llvm/llvm-project/llvmorg-19.1.1/llvm/include/llvm-c/Core.h) and [LLVM19 icmp](https://releases.llvm.org/19.1.0/docs/LangRef.html#icmp-instruction). Target creation derives size_type/pointer_bytes from DataLayout, admits only the existing little-endian4/8-byte layout/alignment contract, and backend_lower rejects a Foundation-width mismatch.
`bi_node` stamps the selected target width; `bi_cast`/`bi_temp` preserve types and materialize one assignment. Foundation recheck still requires equal-width integer/pointer bits and rejects ordinary ordered pointers through semantic_numeric_binary. Graph and Fast reach shared ix_binary_scalar signed-mask comparisons. Equality, signatures/nominal/function bindings and language pointer policy are unchanged.
General nonzero/non-integral address spaces, differing address-space pointer widths and arbitrary foreign IR are not proved here: the production target constructs address-space0 pointers, and bi_compare does not independently inspect address spaces. No universal target claim.

Ownership/error closure: stage node/attachment/temporary/vector failures set the first typed backend error; following helpers short-circuit. backend_import_foundation owns work vectors and an exclusive root lease, discards its private stage on failure, publishes before replacing the destination payload. The added casts use that same ownership path, not a second graph or global error slot.
backend_source_import copies checked formatting into a private terminated candidate, closes joined imported/source programs, reparses under the same world/environment/width, and replaces session Foundation only after successful recheck/report. Old session output survives failed import/recheck. Source-session and fixture close retire backend/text, modules and world before the budget-zero assertion.
Runner ownership is one fresh world/budget/environment per width/worker trial, with separate Graph/Fast sessions sequentially inside it; it is not one world per engine. Input vectors remain alive throughout. Session close releases fast cache, interpreter/output/error storage, semantic lists and root before modules/world disposal; normal completion requires zero bytes/grants/lanes.
execution_run advances in7-step slices while below fuel; this is a bounded scheduling allowance, not an exact step-count assertion. Exhaustion without done, failed machine, failed Fast admission, wrong bytes or failed compilation cannot pass. Existing abort-on-assert semantics remain; zero-owner claims apply to completed trials, not forced process termination. No cancellation injection is added by this fixture.

[L1 receipt](backend_pointer_order_6e8001fd.md), not D1 execution: eight CTests and24 direct Graph/Fast trials, exact output/canonical bytes and zero final owners; ordinary pointer-order rejection at3:19 remains owner evidence. Original healthy n1 worker1/4 wall .57/.65→.55/.64s, CPU .51/.63→.50/.64s, RSS179264/182520→179424/182792KiB; large failure→success is not speedup evidence.
Owner final checked producer boundary `b03841daa1f91a44656e8a734ead773a4a5c465a`: large32 import4 cost3.33wall/4.18CPU/715916KiB, direct execution10.22/11.29/754784; unchanged Foundation SHA256 `57d665114dd154d942100adff395de01f65a535aa16f507cab3394585f291d96`, LLVM `d33c3ca2071793d662b4c83dae39649bd7987d01fd57f7a248e32bfa975a7149`. WSL Ubuntu24/LLVM19.1.1/Ryzen5900HX CPU0–3/24GiB; these are source-bound owner costs, not fresh Deck checks.

Open precisely: L1's actual signed ptr-icmp controls and953744-byte stage-ownership request; source reasoning above does not mark those executed. The unsigned fixture's six predicates are not all ten LLVM predicates. Later unchanged producer bytes may reuse this review, while new fixtures/results need their own adoption.
Direct canonical Fast builds an interpreter cache only. CLI Fast on the reconstructed large text performs a second LLVM normalization and still fails at53277:5 (`Unsupported LLVM value in foundation return path`); A2 now owns the separate bi_value constant-expression-add repair. No retry or inferred pass here.
No new code/runtime/build/profile/instrumentation: documentation-only performance is inapplicable; D2 lock untouched. Final browser/generation/hosted adoption stays ROOT-owned, no race proof. Local blob/caller manifest `build/d1_ecs/pointer_review_503677d9/`; owner logs unavailable here: `C:/Sandbox/build/codex_ecs_20261122/L1/entity_pages_optimized_6e8001fd/`.

### D1 inline-first-child peer review — d5c350d5 (2026-11-23)

Independent source freeze `d5c350d54f68aa7b0253e7276953ed251e8abb37`, tree `f0cb77d93179eab551c67c5f2ac866a79b475f60`; B2 implementation `c12c2189c6a957758cf2291f9da7e75e566cd064`, published through `289185f2`. Nine scoped blobs match the implementation; backend_source_native also contains the inspected B1 Foundation-page census. No production edit or runtime rerun.

| Path under `scaffolding/` | Exact reviewed blob / disposition |
| --- | --- |
| `library/entity_types.tower` | `3ae59ba39fc31512ee24798487ff7da0ef3c12aa`: separate component-pointer and child-record inline fields; every descriptor pays the added slot, including leaves/kinds. Internal ABI changes; coherent consumer rebuild required. |
| `library/entities.tower` | `d8976189951fe75f4320d08f976081b2270216d5`: checked inline→heap promotion, exact copy/commit/free distinction, unchanged ordered/name/refcount transfer and deferred reclamation; no concrete new defect found. |
| `library/entity_stage.tower` | `c1b4144cbea8f38c51d965b96972c05bd411385d`: exact-capacity preparation uses the shared helper; private discard excludes inline frees. Publication transfers stable pages and the stage's child reference, after admission/joins, without copying Entity descriptors. |
| `tests/entity_component_layout.tower` | `7468089ddc3bb0554e829ba62faa47c40b9ae03e`: first/second/fifth child transitions, view denial, promotion/growth denial+retry, ordered identities/refcounts, take/re-add, published/discarded private inline slot, exact descriptor reuse and zero owners. New helper is called from existing main/CTest. |
| `tests/entity_accounting.tower` | `080733cb2bff619edee1b78f8016b6f70e78d420`: pages include inline bytes; only heap child capacity contributes separately. Unpooled descriptors/components/names, stage vectors and tables remain counted; exact physical sum==budget unchanged. Exhausted-cap first unnamed child now correctly succeeds; second promotion must fail without link/refcount changes. |
| `tests/entity_fault_accounting.tower` | `92e1a7cda361f8c684c411d413d808ccf71d5895`: skips inline header subtraction only; every actual buffer reservation remains validated, sparse owners retained, byte and receipt equality plus zero lanes unchanged. Its serial injected callers are not newly executed here. |
| `tests/backend_source_native.tower` | `111d74ce238523081f2783db9293e31ce0bde66e`: joined child heaps exclude inline addresses; owned pages include them. Existing <=budget category check is partial, not full conservation; prints unindexed entities and separate payload categories. B1's composed page-capacity histogram remains intact. |
| `tests/entity_child_transfer_profile.tower` | `6cc55c2980102d142f845d0c36842d1f9e567524`: excludes inline edge from explicitly partial store/heap-index payload metric; exact take/replace/re-add references and final store-empty checks retained. |
| `tests/entity_containment_profile.tower` | `29996d2a569c8047c80809ebdca32babd77b17f7`: counts only heap child capacities, including retained empty indexes; ordered final parent/refcounts and teardown unchanged. This is not total physical storage. |
| `tests/frontend_units_profile.tower` | `552ceb5a02f5bc33356ff04d2755f538628747c4`: optional joined child census, live heap count/header charges, actual page capacity and size-class bytes; unindexed kind nodes excluded explicitly. No new worker-shared counters or changed output oracle. |

Promotion: inline capacity is derived from its actual array. First unnamed attach sets the self-relative pointer without allocating; second ordinary attach requests4, later full indexes double. Staged preparation requests exact total children. The heap helper validates header/count/alignment, reserves the full new allocation while old remains charged, copies live entries then frees old; inline promotion passes null/zero to that helper and copies its existing slot before installing the pointer. Failed reserve/allocation preserves pointer/capacity/edges; later name/preparation failure may retain capacity, as documented.
Names are separately owned allocations: reattaching with the existing name copies it before unlink/free. Ordered unlink shifts only live edges; replace/take transfer existing references and do not shrink/demote. Inactive inline bytes after promotion/removal are not traversed or freed as owners. Acyclic containment and raw descriptor validity remain caller contracts.
Reclaim frees child names/references, child heap if any, component index if heap, then descriptor. Stage discard clears cancellable unheld fields before finalizers, frees private descriptors individually (their borrowed parent links were never published), and requires empty private pools. Existing leases and pinned-view Busy checks remain; prepare/publication occurs after joins, not while readers borrow replaceable indexes.
Stable-storage proof: entity_storage_allocate computes full descriptor size/alignment and records its owning slot; pool transfer changes only ownership/list links, never page data. Dead-slot reuse changes the component free-link and both Entity constructors reset the complete descriptor to default. Distinct inline fields cannot overlap; either index can promote without moving the other or payload addresses.
Search of direct children/header/free consumers and whole-Entity assignments found no live descriptor copy/memcpy or foreign duplicate layout: only the two zero constructors. Apparent generic/context/backend copies are payload/record types, not Entity. Archetype rows copy Entity pointers, parser-forest children are a separate container, exported entity APIs use typed/opaque pointers. Node/profile sizeof consumers derive the changed size; old/new ABI objects must not be mixed.

Physical accounting remains scope-specific: full accounting/fault fixtures include all owned pages plus unpooled allocations and separate stage ownership, so inline slots are charged once; partial backend/child profiles do not claim total coverage. Indexed census614579 plus46 unindexed kinds is the owner's large sample, not an all-owner census; zero-child nodes with retained heap capacity are still counted as heaps. Descriptor stride classes can include names, and next_stride/next_slots are a hypothetical additional-slot model, not measured post-change capacity.
Arithmetic independently checked from x64 fields/alignment16: Entity192→208, stride align(Entity+8)208→224, component descriptor48, floor(4096/(stride+48))16→15. Receipt retained521369982−495030649=26339333B; child heaps save33700608B while size-class pages add7361459B. Those two displayed subcategories leave184B of the total delta unitemized; the ledger total is not asserted to be their exact sum. Ledger metadata40→20MiB is separate from charged storage/RSS.
Evidence wording correction for B2/ROOT: the receipt's blanket 'Observers disabled' does not describe this source literally. Optional children/grammar census can be off; main always installs units_profile_event, which records outer wall/thread CPU/thread ID. Child census runs after elapsed/getrusage capture; whole-process timing may include subsequent output/oracle work. The unchanged outer observer belongs to both matched samples, not a new storage-speedup mechanism.

[B2 receipt](entity_inline_children_5fc00c85.md), attributed only: base5fc00c85/public768, Linux LLVM19 Release CPU12–23/quota12/24GiB; one unit, target8/revision81/profile19/backend off,16/4096 bodies. Before/after executable SHA256 `1e93352a8d7f612544005a1823b919b62ad15c31730b0c52fb412d1942ad6d16` / `2cc9449b8475f23b92a58c972da52a34eef0147e14711a865cfd08375336a507`; external sample archives/logs are not independently authenticated.
Owner alternating n2 process wall/CPU/RSS KiB:16/w1 .375164/.373755/165492→.376073/.373897/162988;4096/w1 2.503750/2.502214/734054→2.387955/2.386321/696690;4096/w4 2.355054/3.088590/739494→2.212271/2.914402/703148. Preliminary noninterleaved slowdowns6.5%/1.9%/2.3% remain evidence; small-n improvement is not general scaling or a peak-live/RSS equivalence.
Owner reports24 timed checks+4 census controls, exact source/import/Foundation/known42, promotion/lease/stage/concurrency/reuse/accounting passes and zero owners; small58057B reconstruction only. Current exactlarge972596B reconstruction and directly touched child-transfer/containment manual and serial injected modes remain B2 pending. The older receipt's unavailable965691B request is a separate identity, not substituted by the new request.
No new concrete storage defect. Source-only review needs no build/runtime/profile/sanitizer/deployment; no race proof. Later A1 kind-metadata ABI and other incoming deltas are excluded; final-source/artifact/release adoption stays ROOT-owned. Local manifest/search evidence `build/d1_ecs/inline_children_review_d5c350d5/`; owner raw `C:/Sandbox/build/codex_ecs_20261122/B2/entity_children_5fc00c85` and its cache counterpart.

### D1 signed-pointer fixture peer review — cee3ef7c (2026-11-23)

Freeze `cee3ef7c9506eb8e77d124233ef6dade6e3449c5`, tree `ab9bbdb69c2bc2085d11551ed789893eac533595`; reviewed L1 `73300be3`/`c048eaf8` and immediate callers. Five authored source/contract blobs match; composed TowerExecutionTests additionally retains A2's independent constant-address registrations.
Reuse `1990c255`'s producer proof: `bi_compare` is unchanged from015aa9ed; current import_values blob `8422cd0ed9c1a9bd82d69361d2c53c4a879986aa` differs only in A2's separately owned bi_value constant-expression handling. No importer edit or new language admission here.

| Reviewed path | Exact frozen blob / disposition |
| --- | --- |
| `scaffolding/tests/backend_pointer_fixture.tower` | `50702abd9c532a22e41d8d7f11239004df32c849`: independent parameterized LLVM predicates, eight literal rows, ordered effect calls and verifier-only retention; masks correct. |
| `scaffolding/tests/backend_signed_pointer_checks.tower` | `59641617a4a214e9ddd29cacdf24d513f83e0dba`: checked import/world/output and ordinary-negative coverage; concrete counted-text/C-string boundary defect corrected below. |
| `scaffolding/tests/backend_pointer_order_checks.tower` | `a2dbba1602b777a2a219284c5022b00b9fb6eee5`: borrowed source is neither modified nor disposed; file wrapper retains its terminated ByteBuffer until return. Default callers unchanged. |
| `scaffolding/tests/execution_main.tower` | `b09a457ab054b4172772ef15b07c93ce44c77bd3`: exact argc5 selector, width4/8 validation; existing dispatch/all behavior unchanged. |
| `cmake/TowerBackend.cmake` | `442404b68e865f052439e1cfe7d414c0df77ae12`: native execution-test provider import is outside TOWER_BACKEND_TESTS; production link closure supplies its LLVM calls. |
| `cmake/TowerExecutionTests.cmake` | `46b14f4d15aee596fcb4f6037d18a2a0b24e38a0`: two explicit-width registrations, separate generated output paths, existing180s/native/backend/focused convention; A2 registrations coexist unchanged. |

Independent oracle: bits0..9 are sgt/sge/slt/sle/ugt/uge/ult/ule/eq/ne (LLVM IDs38..41/34..37/32/33). High is signed minimum, maximum is−1; high:0=572, reverse707; equal high/high and0/0=426; maximum:high and1:0=563, reverses716. These literal sums hold at both32/64; expectations do not call bi_compare or order host pointers.
backend_optimize(false) verifies and prints without LLVMRunPasses; the probe compares parameters, and the consumer requires all four signed ptr-icmp strings. b.size_type/inttoptr and selected DataLayout propagate width independently of the host. Equality remains covered alongside both signed interpretations.
LLVMBuildCall2 copies each argument list into its instruction: left observed call precedes right, then the probe. Each row resets trace and requires12; error count increments for either wrong mask or effects. Only the trace alloca is loaded/stored; high/max addresses are compared/passed, never dereferenced.
The original world closes before ordinary Foundation recheck. Unchanged module_body_type_checks blob `55407fac4f622a6968ec631caae2b66d9ad18a55` creates a fresh world/environment per worker/width trial and sequential Graph/Fast sessions; identical formatted bytes, done/nonfailed/exact `0\n`, failed-start rejection and zero bytes/grants/lanes are required. Direct Fast has no second LLVM normalization.
Explicit pointer fuel remains100000000; other callers retain100000. Ordinary `left > right` still requires the exact integer-operands diagnostic at virtual module_body_type_input.tower3:19, consistent raw offset and no Graph/Fast start/steps. Assertions abort nonzero; cleanup claims apply to completed trials, not abort paths. No new cancellation injection or address-space-general proof.

Concrete fixture defect: format_entity/format_storage_append produce counted bytes without NUL; backend_pointer_text_execute reaches strlen in module_body_type_trial_steps. compiler_buffer_allocate leaves payload uninitialized. Passing unused capacity directly could read allocator tail bytes/outside the allocation; this is a source-proved contract violation, not an observed runtime failure.
Small correction only in backend_signed_pointer_checks, resulting blob `b16012eadb031b7ae498a439cde81d372d084adb`: reserve two checked spare bytes and set255,0; existing format_storage_finish writes the terminator and moves the retained grant into WorkBuffer. Assert exact strlen/terminator/detached old view, borrow synchronously, then dispose source and remaining spans before budget-zero teardown. Canonical file bytes and all semantic expectations stay unchanged.
The deliberate nonzero tail makes the added boundary assertion independent of allocator contents; its rejecting pre-fix form and corrected runtime are **unexecuted**. No second formatter or resource owner was introduced; the budget outlives the moved output after world close.

[L1 receipt](signed_pointer_stage_503677d9.md) blob `cce5d8b2e29a565ffd4fb52929ee750fb3125618`, attributed only: two CTests,8 positive trials/64 rows/640 predicate bits/64 traces plus8 negative compiles, zero owners. Original503677d9 public768/LLVM19.1.1 WSL run cost1.91wall/1.51CPU s/139440KiB; execution binary SHA256 `c5670cb556b1b0bd314354767daeb21a97c9c4921506965ecded41ef91da562e`. Owner joined95d5916c repeats retain exact bytes; these are not D1 executions or proof against the newly found text boundary.
Owner953744B stage request and its direct original/rebuilt Graph/Fast evidence remain separately attributed; current actual Wasm entity_pages/stage/work, A2 second-normalization controls and final release are excluded. No independent authentication of external logs or race-freedom claim.
D1 validation: native CMake regeneration and git diff --check pass. The smallest execution-target build needed10 dependency actions; it was interrupted with143 after a D2 build overlapped despite D1's successfully acquired heavy.lock. Partial cost50.24wall/43.84CPU s/1084588KiB,0swaps is interrupted-build cost, not a test/profile pass; no new runtime ran. Own live jobs drained, lock released; one terminated orphan is defunct under the existing container PID1.
Pending exact check: dependency-build tower-execution-tests jobs1, then `ctest --test-dir <native-cache> -R '^tower-signed-pointer-order-(4|8)$' --output-on-failure -j1`; retain a deliberately missing-finalization nonzero control. No compiler performance change: fixture-only validation cost applies; production profiling is inapplicable. ROOT/L1 can adopt these tests after the shared slot is free, without another source census.
Local manifests/failed build: `build/d1_ecs/signed_pointer_review_cee3ef7c/`; owner raw `C:/Sandbox/build/codex_ecs_20261122/L1/signed_pointer_stage_503677d9/`. Later incoming deltas excluded; final normal-publication boundary recorded once in D1 status. No deployment or rejected instrumentation attempted.

### D1 finite post-a06 audit map — 8771b949 (2026-11-23)

Frozen published main `8771b9490186d501cf11110f0eea519d733811b1`, tree `069afb5bc48bd238d0de1eef725420036934ca97`. Scope is net authored Tower delta `a06ec4b1f9f44419882477bc1a55b6ed39e2200b..59d7dc9e995b16c785b01f40f340374dc4c73d18`, plus the signed-fixture correction published at `a80a766f`; later changes are excluded. The last pull added only L2's T9 receipt, not another source delta.
Preserve the full/finite ec012/1e60 history and [a06's43-path map](compiler_ecs_audit_d2.md#completion-ledger-delta-at-a06ec4b1-2026-11-23) as the base. This supplement does not recensus unchanged files, replace the twelve requirements, or promote owner tests into peer review.
**65 unique paths:22 additions,43 modifications,0 retirements/renames.** All are authored `scaffolding/` production/fixture/tool `.tower` files; no changed bootstrap copies or tracked generated Tower outputs. The later correction changes one already-listed path, so it adds no66th path. Reverted lifecycle-scan experiments leave semantic_lowering_work byte-identical to a06 and remain historical evidence, not a net delta.
[Exact path/blob map](compiler_ecs_audit_d1_a06_59d.tsv) records each current Git blob, owner implementation chain, receipt keys, independent-review keys and specific delta disposition. [Receipt key map](compiler_ecs_audit_d1_a06_59d_receipts.tsv) expands every key to author/commit/document and its source/execution limits; `-` explicitly means no published commit identity, not an approval token.

| Finite source state | Paths | Exact disposition |
| --- | ---: | --- |
| Published independent receipts match latest blobs |37|Git comparisons confirm each final receipt contains the current blob; composed changes retain earlier reviews plus the named later review.|
| Small unmatched fixture/caller reviewed here |1|platform_calls and its exact caller, below; source review only.|
| ROOT reports completed review; publication receipt absent |26|Exactly8471cf97's sparse-kind production, typed callers and observer/fault paths;20 original blobs plus6 composed85ab2449 blobs. Preserve ROOT's reported no-defect conclusion as task context, with published independent identity **pending**, not invented.|
| Narrow correction accepted for validation |1|backend_signed_pointer_checks: original L1 code independently reviewed by D1; D1's new termination fix has ROOT task acceptance, with published L1 runtime/adoption receipt pending.|

ROOT `2229cd1d` independently adopts seeded de906/lr_work_main6dc0/CMake3d335 and native overflow527f/623d/9e3f/CMake6028. Exact current Tower blobs match. Its older frontend_units1afe caller is now changed by sparse registration and therefore remains in the26 pending-receipt set; no blanket current-caller approval.
D2 `55b6e254` covers current i1 producer/import-selector; ROOT's later native-extension review closes changed extraction-fixture/checker blobs. D1 `1990c255` covers unchanged bi_compare, D2 `f28390f4` adds bi_value ConstantExpr; D1 `96d531b4` covers the signed registration/borrowed helper. Signed8positive/8negative owner evidence predates the termination correction and is not a corrected-test pass.
D2 `ed9ba645` native census + L2 `11d7751b` Foundation-page policy + D1 `3af13f1b` inline children + D2 `f28390f4` constant-address selector compose backend_source_native; A1's final sparse-layout read still needs ROOT's exact publication receipt. The map preserves that whole chain rather than matching only the last commit name.
Six pending paths differ from original8471: entities, entity_stage, entity_types, backend_source_native, entity_component_layout, entity_fault_accounting. Read their85ab merge deltas: child inline free/resize/slot, constant selector and child storage/census controls are preserved alongside sparse layout. All26 latest blobs match85ab/59d; these are not falsely labeled original8471 blobs or a new full storage peer review.
D2 `5cc88766` closes unchanged stage-fault and Windows fixtures. Component-fault/layout/census changes added by A1 stay pending ROOT receipt. D1 `35268d64` codec and `3af13f1b` remaining child-accounting/profile blobs match; the profile's outer timing observer is enabled even when optional census is off.
L2's page-policy review exactly matches current world.tower; its native measurements retain524ad027 inputs. Sparse Entity ABI changes require their own coherent runtime adoption and cannot inherit earlier RSS, timings or zero-owner assertions merely because world.tower is unchanged.
Inherited a06 gaps reconciled: B2 `04b2d4e5` independently closes unchanged direct-C fixture2888/driver2999; A1's package review in `1c919df5`/deflate_lazy_a1 explicitly covers03d8123d write→gzip→unlink→manifest and current packagerf4e96e64. They are no longer listed as missing peer reviews. C native16/LLVM2 and old25 packaging measurements retain their original artifact boundaries.

Small source spot-check: platform_calls blob `36dcae719045975aad3dfad6636367ffc414447b` is the same explicit-Foundation program moved from the old inline test. Identity returns usize, sizeof(i32*[3]) independently yields3×target pointer bytes, print precedes alloc/free, and uninitialized allocated pointer slots are never read. No nominal/type/effect change or defect found.
Read371ef93e's actual caller delta and current platform.test.mjs blob `e3077615ddb186b5572a038b6bd85bcad41b2cc2`: exact i32/usize bindings, signature, array/pointer shape and statement order remain asserted; source and separately parsed copied Foundation require12/24 at32/64 across Graph/Fast, with handles destroyed in finally and exact reformat identity. Both wasm32 inputs require12; all five invalid builtin cases retain error/steps0. This is D1 source review of one small delta, not another four-test execution; A2's4/4 a06-reactor receipt stays attributed.
Remaining finite source-receipt action: ROOT publish its already-performed26-path review against these exact blobs. L1 owns the two corrected signed CTests and deliberately missing-finalization negative; a80's interrupted build143 proves neither. There is no unassigned path in this net delta and no newly discovered source defect here.
Remaining known validation/registration action: D2's active sub-presence guard and reconstructed-output CTest dependencies are future work, absent at this freeze. Keep existing add-only guard and original-source CTests distinguished from manual generated-output execution. No new all-file/runtime, instrumentation, generation or hosted claim follows from this map.
Checks: Git-derived set equals65 unique TSV paths; all65 current blobs and37 latest published peer-receipt blobs match; pending set equals the exact26 authored sparse paths at their composed boundary. Each implementation/review key resolves or is explicitly pending. Existing bootstrap copies/history/todo and ROOT's current handoff ledger are unchanged.
No build/test/profile or heavy lock; source/metadata-only performance is inapplicable. Initial disk126GiB/RAM9.7GiB available. Raw Git maps/deltas/checks: `build/d1_ecs/audit_delta_a06_59d/`. One overbroad journal-history lookup was stopped and replaced with bounded receipt-file lookup; no compiler operation or rejected instrumentation was retried.
Final incoming-history/publication boundary belongs in D1 status once; these fixed source identities remain the review boundary after reconciliation. ROOT retains final integrated acceptance/release.

### D1 receipt adoption and actual compiler storage — d62d1333 (2026-11-23)

Freeze `d62d1333dcef79a1a6d547686c9b7b21ca2d9055`, tree `c2655ceb14c2d52107c9713adb9d4a07a76ed101`; compiler tree `fc34b4d96a6edde6fe36c84b6db7afc60472ac99`, library tree `388ec480b4df012a22c0db18f85527201fb33bac`. This supplements the accepted65-path map/full audit; no recensus or replacement twelve-row ledger.
[Adoption map](compiler_ecs_audit_d1_receipt_adoption_d62d.tsv) has29 unique rows:26 sparse paths, corrected signed fixture,2 changed CMake contracts. Existing historical pending rows remain readable; the new rows and appended [receipt keys](compiler_ecs_audit_d1_a06_59d_receipts.tsv) supersede only their stated boundaries.
ROOT [af32d15e review](entity_kind_review_release_59d7dc9e.md), document blob `37b711ef2d4e214d5dcb31f6a94c759feb4fbc39`, matches all26 composed59d blobs, closing all26 historical ROOT_SPARSE_PENDING entries.25 also match the frozen current files; backend_source_native adds the two-line subtraction guard (`8268a310`→`63575bd8`). No reread of those unchanged26 implementations is claimed.
Initially pending, now closed at final reconciliation: ROOT [5a04375a peer receipt](compiler_fixture_adoption_d6f7031d.md), blob `34f1a7864cd66e36f6d8975d07971c0ddad15421`, explicitly matches backend_source_native6357 and both frozen CMake contracts361c/de823. Adopt its prerequisite/failure-order/sub-presence review separately from owner dc6d1a4a runtime; no pending peer receipt remains within this29-row supplement.
L1 [signed finalization receipt](signed_finish_browser_generations_59d7dc9e.md), document blob `b2dc99cd2444c389ab8c610773d82145b85dc9d2`, exactly matches fixture blob `b16012eadb031b7ae498a439cde81d372d084adb` / SHA256 `ebc5f0a2d433806b1adc09ce72c27e6bee24cd237774680a9c15a43f770323e7`.
Adopt attributed native source8771:2/2 corrected CTests, deliberate pre-finalization exit134 before strlen, restored2/2; restored cost2.02wall/1.60CPU s/137436KiB, binary `ff1c261e57717269d2347960d2e9203dd698e06c156291fe4966149ad305b032`. This closes D1's interrupted-build runtime gap, not negative-abort cleanup or a new D1 execution.
That receipt separately records two actual edited browser generations at compiled source59d with24 objects/three reactors byte-equal, real2/4 overlap and drained workers. Preserve its exact artifacts/host delta; this is neither current runtime deployment nor a new public pin. External raw logs were not independently authenticated.

**Actual storage contract:** archetype columns are dense component-pointer indexes, not packed component payload columns. Same-kind payloads do share stable strided pages; describing them all as separate heap allocations is also wrong. No missing authoritative ECS behavior or new ownership defect was demonstrated by this bounded traversal review.

| Bulk path / exact providers and consumers under scaffolding | Current layout and authority | Ownership / locality consequence |
| --- | --- | --- |
| library/entity_types, entities, entity_stage; compiler/world | EntityTable rows are Entity** and columns EntityComponent**; kind.instances is another dense pointer index. EntityComponent.data addresses same-kind strided page slots with reusable holes, or oversized standalone allocations. EntityLayout is sparse immutable kind metadata; descriptor inline child/component slots do not pack payloads. | World/store owns kinds, tables and stable pools; stages own private pages until publication. compiler_world_create_result binds budget before allocation; Foundation private pages use4 rows. Views protect lifetime/structure; access grants/leases govern mutation. Current inline/promotion/sparse ownership reviews remain adopted. |
| compiler/syntax_emission::emission_node and sequence/first passes; grammar_builder; lr_tree/parser_state; syntax_types/parser_types/parse_tree | SyntaxNode and ParserRule/Reference/String/Range/Match payloads are authoritative shared components; items/children contain entity pointers. Traversal fetches payloads through component lookup. ParseForestStore has contiguous ParseChild/ParseVisit work vectors retaining those entities, not a second AST. | Grammar entities and lexical order stay canonical. Parser requests own the forest; attachment transfers leaf ownership and destruction releases untaken leaves. LRGrammar rules/symbols, LRRuntime action/goto arrays and ParserStructure are derived snapshots, separately pinned to their world/revision; sharing numeric tables does not share mutable parse nodes. |
| compiler/semantic_context::sem_get, semantic_layout, semantic_support, foundation_types, semantic_program_types | FoundationNode is authoritative AoS component data with scalar/type fields, pointer links and vector(void*) items/parameters/locals. FoundationType embeds scalar/pointer/target width and nominal record entity identity. Program functions/types are pointer indexes; layout walks fields and publishes offsets back to shared nodes. | Types/AST/operations use world identity, not a global type registry or copied semantic IR. Stable addresses matter to nominal references and captures. Dense function/type indexes do not make the linked payload access dense; moving it requires explicit lifetime/identity preservation. |
| compiler/semantic_flow::sem_flows_pump; semantic_lowering_work and semantic_expression_lowering | Flow reads kind.instances via entity_query_at, then orders SemanticFlow* jobs by source ordinal. Lowering walks program.functions and linked Foundation items, with per-subject result components and transient pointer batches. These are mutable authoritative work results/transforms, not frozen packed copies. | Lowering reserves ticket/capture access and stage leases before dispatch, freezes context, dispatches through the shared kernel, then sem_stage_wave joins/publishes before read-ticket/error/alias processing. Pointer pins alone do not authorize writes. No twenty-pass frozen-field reuse is established for these mutable jobs. |
| library/compiler_work/compiler_work_types/work_graph; compiler/frontend_units and semantic query callers | Unit entities and CompilerWorkUnit components retain identity/ordinal. WorkGraph owns contiguous typed WorkTask/WorkEdge/WorkAccess arrays plus ready/index/scratch buffers; subject pointers borrow canonical entities. Scheduler state is authoritative for execution, derived relative to semantic state. | Coordinator mutates the graph; workers receive tickets and private/staged results under shared budget. These arrays already avoid per-task Entity payload lookup for ready/edge scans; packing Foundation nodes cannot replace revision/profile/dispatch or drain contracts. |
| compiler/lr_analysis::lr_propagation_solve_result (lr_lalr/lr_work callers); fast_interpreter_types | LRPropagation has a contiguous node array with separate sorted range/edge vectors and pending indexes. LRGrammar/Runtime numeric arrays and Fast words/registers/constants/functions are derived acceleration data; some metadata still points to canonical nodes/types. | LR solve repeatedly unions source ranges through numeric indexes; Fast remains a target-checked execution cache of canonical Foundation. Neither is evidence of a second authoritative AST, nor entirely pointer-free storage. |

Current repeated access with measured evidence: B1 [3011 cold-LR observation](compiler_lr_scc_3011c77f.md) counts703798 edge visits/23598805 incoming ranges, including12851749 repeated noncyclic-source ranges. This is a derived-array algorithm hotspot, not measured Entity cache misses. Its SCC candidate failed the public predecessor build and shipped no production change.
A1 [combined59d profile](compiler_combined_scaling_59d7dc9e.md), n2, shows12×256 units at8 workers2.79× serial, but1×4096 at8 only1.072× with57% more CPU; small parallel is17–21% slower. Single8 observation includes parse0.630s, SemanticRun0.564s, lowering0.346s (nested/inclusive, not additive). Those phases contain the traversals above; measurements do not isolate payload indirection as their cause.
The same owner receipt retains comparable16-function CLI Tower jobs1 .465wall/.375CPU s/174922KiB versus Clang19 .030/.015/98962, with independently checked output; this is a concrete serial gap on that workload, not general cross-language superiority. [Earlier locality study](compiler_ecs_locality_d5b65afe.md) needed roughly19–21 repeated scans to amortize a frozen packed copy in synthetic cases; it did not establish that reuse in these production consumers. Later four-row/inline/sparse policies supersede its old pending storage proposals.

Ranked residuals against the original scope:
1. **Required performance acceptance remains open — B1/ROOT with affected owners.** Reduce or justify measured cold LR/coordinator work and weak within-unit/small-CLI return on parallelism; acceptance requires equivalent frozen small/large parser/import/body/staging and comparable reference outputs, wall/CPU/peak/live memory, real useful overlap and scheduling/critical-path evidence, with a preserved fast serial path. Existing multi-unit speedup closes a subset only. No particular SCC or packed-layout implementation is preapproved.
2. **Conditional optimization, not demonstrated missing ECS behavior:** pack a specific immutable hot-field/frontier cache only after a named consumer's measured reuse pays construction/retention costs versus the present stable-page/index path. Require byte-identical canonical output/errors, stable identity/leases/stage/drain behavior, exact allocation conservation and representative before/after timing/memory. Blanket SoA conversion and Stronghold safety policy are not acceptance substitutes for raw Foundation.
No new mandatory storage rewrite follows from this source evidence. The coherent component/archetype/relationship model is implemented in the inspected paths; universal packing, cache-locality superiority and race freedom are not claimed. Other final correctness/artifact/instrumentation/hosted gates remain ROOT's unchanged ledger responsibilities.
Checks here: exact Git blob comparisons,29-row unique supplement and source/caller inspection;0 builds/tests/profiles. Runtime performance/memory measurements are inapplicable to these documentation-only changes. Disk126GiB free, todo unchanged, no heavy lock or owned live compiler jobs. Git identities/selected provider blobs: `build/d1_ecs/receipt_storage_d62d1333/`; owner raw paths remain in the linked receipts.
Final reconciliation with origin31102b64 preserved full history and adopted only the matching ROOT5a receipt. Later SCC provider/solver and retained-source fixture/registration changes are excluded from this fixed d62 source review; the newly published SCC implementation is not the failed historical3011 draft described above. No production edits, rejected operations, runtime promotion or deployment.

### D1 arbitrary-graph SCC partition differential — 8f1d7e7a (2026-11-23)

Frozen main `8f1d7e7a5f3c289f3b2f2fd9eb7f0b8138b2252d`, tree `cd9dd303334645c2f693739c4766c5fe9e77a27d`, plus this fixture/registration delta. Public default compiler SHA256 `eeb005717318086c145428edc3b6b784d4729df7ef0514c7329e0a18b76dda9c`; no private override or compiler executable/reactor build. Existing frontend target dependencies were refreshed as recorded below.
Read graph_components/result/dispose and its typed interface, lr_components owner controls, lr_graph_checks propagation differential, frontend selectors and registration. Existing150 randomized grammar/propagation comparisons check exact union outputs; fixed SCC/4096-chain controls do not independently compare every arbitrary-graph pair's partition. That is the narrow new coverage, not a duplicate grammar oracle or SCC implementation.
Production unchanged: graph_components blob `4938786b8fda460e194059fef780d476b6db1f4b`, types `9de8e86f15068dbdfcb8bb05e71febd674b39043`, interface `2ca0519fba26b3f92801e89ed2541c95992355ef`.
New `scaffolding/tests/graph_components_checks.tower` blob `315d0d52e2b3fad6ab236a6b16a870282133499d`: independent Floyd-Warshall reachability over input edge multiplicities; same component iff both directions reachable. It never derives expected components from Tarjan order/lowlinks or invokes the provider to construct expectations.
Eight explicit shapes: empty, singleton, self edge, duplicate edge, disconnected cycle/isolated nodes, dense, sparse chain and linked cycles. Six fixed seeds1/7/42/31337/305419896/4294967295 ×13 node counts0–12 ×3 densities produce234 additional configurations; **242 cases** total. Existing utility_random generates only input data; dimensions derive from named bounds/types/arrays.
Each result checks nonempty component heads, in-bounds complete membership with no duplicates/cyclic member list, every pair's equivalence and the API's reverse-topological cross-component edge order. Component numbering is otherwise unconstrained. All result traversals run after checked adjacency WorkBuffer bytes are poisoned and disposed; output is then disposed and budget bytes/grants plus physical buffer baseline must return to zero. This tests synchronous borrowed-span independence, not arbitrary dangling-pointer safety.
Frontend blob `702271f270f08224d39a8e6e9727c48914d2ffef` adds graph-components/graph-components-wrong and a narrow lr-components entry for the existing owner function; normal frontend invokes the new positive fixture once. lr_components blob `d0feb8fe8bd0ea972c58252daa0c8ac8c494bc86` only adds its direct lr_types import, preserving all old assertions.
TowerFrontendFocused CMake blob `198102db31c69bcf2480f2435edf7ae867c27601` registers exactly two positive selectors with existing native/focused labels and60-second convention. The README distinguishes them from lr-order's broad150 suite. No new runner, native adapter, template-limit change or production scheduling edit.

Deck Docker Ubuntu24/Clang19.1.1, Release x86_64-pc-linux-gnu, CPUs0,2/8GiB, compiler/build jobs1; warm existing cache `native-coherent-127ca98`. Successful native runner SHA256 `4688b948a66926eb7ca73bc33d9dc2a7942294e7c4cab3508147b3281e101dee`.
Build retained failures: reserved fixture identifier `expected` (renamed wanted), then missing direct LRTokenEnd import and missing direct lr_components import at the selected caller. Each failed process drained before edits; no failing check was counted passed. Initial38-action dependency build stopped at its fixture object:144.01wall/139.12CPU s/900576KiB, exit1. Two subsequent diagnostic-only object attempts cost9.76/9.09/467356 and7.63/7.04/468044; exact logs retained.
Final two-action fixture compile/link: **14.95wall/14.22CPU s/563956KiB**, exit0. Completed dependencies were reused, not rebuilt through a separate leaf/compiler path. All measured phases report0 swaps.
Executed once: `ctest --test-dir <cache> -V --output-on-failure -j1 -R '^tower-frontend-(graph|lr)-components$'` — **2/2 PASS,0 skips/timeouts**,242 property cases/live_buffers0 and unchanged SCC ownership/retry/4096-chain checks. Aggregate validation cost **0.11wall/0.10CPU s/50336KiB**; CTest discovery independently confirms only those two registrations.
Rejecting control: same binary `RESOURCE_ROOT graph-components-wrong`,60-second guard; **exit1**, exact `seed=0 shape=1 nodes=1 phase=mutual reachability partition live_buffers=0`. It flips one reflexive oracle expectation, not provider output; cleanup precedes the failure return. Cost0.02wall/0.02CPU s/50104KiB. No source mutation/restoration or passing-case repeat was needed.
No provider counterexample found in this finite set. These native synchronous functional assertions neither prove all graphs nor race freedom; L2 independent review and B1 grammar evidence remain separately attributed. No150-grammar/failure sweep, generation, reactor, sanitizer or deployment run.
Test-only change: costs above measure validation, not production throughput or a before/after compiler speedup. Atomic heavy.lock acquisition was checked before writing owner metadata/build; only D1's drained lock was removed. Disk126GiB, todo unchanged.
Integration:04bec3b0 + published e3958206 preserves both SCC and parser-trace selectors; upstream independently added the identical lr_types import. Provider/types/interface/property fixture/public pin remain byte-identical. Changed parser/entry dependencies rebuilt in3 actions45.65wall/43.80CPU s/768464KiB; merged runner SHA256 `3070c766db5f483ac57761b439816ad837fe9a761b1ab44690ffeab51ba77282` passes the same2/2 registrations/242 cases at0.16wall/0.14CPU s/50292KiB. Original rejecting control retains its original binary identity; no unrelated parser selector or full matrix is claimed tested here.
Raw identities, commands/depfile diagnostics, discovered registrations, CTest output and time receipts: `build/d1_ecs/graph_components_8f1d7e7a/` (`build*.log/.time`, `discovery.log`, `check*.log/.time`, `wrong.log/.time/.exit`, `tested_sources.sha256`, `merged_sources.sha256`, `tested.patch`, `binary*.sha256`).

### D1 quota-diagnostic candidate peer review — 45dbdc59 (2026-11-23)

[Ten-file independent source receipt](generic_quota_peer_45dbdc59.md): immutable A2 snapshot SHA25645dbdc59, baseline31102b64/current callersb8b3be21. No introduced first-cause/publication defect found; exact typed resource priority, quota text, source trace and ownership traced through eager/deferred consumers. New malformed test covers missing instance with valid context, not arbitrary kernel payloads. Final reconciliation adopts all nine matching Tower/CMake blobs at published eb97cc45/b862499b; the tenth owner-receipt file's wildcard/integration additions were read separately. All owner runtime/performance evidence remains attributed. No builds/tests/heavy slot; docs-only profiling inapplicable, existing audits/history retained.

### D1 LR prediction-index and exact-symbol peer review — 035ad6e8 (2026-11-23)

[Source-bound receipt](lr_prediction_peer_035ad6e8.md) independently reviews49cb7c45/5038ad3a: LR(0) uniqueness and ID bounds, checked/aligned transient index, ordered reachability, failure/budget cleanup, synchronous pre-worker ownership and overlap fallback; no introduced concrete defect found. Three foreign reporter/length imports remain exact ParserNodes permissions with24 source-inspected target/negative assertions. B1 execution and n2 gains/slower4096 control stay attributed; no D1 runtime/build/heavy lock, no persistent revision cache or race claim. Existing full audit/history retained; final artifact acceptance remains ROOT/B1.

### D1 finite final Tower delta coverage — dec17663 (2026-11-23)

Freeze `dec17663ff536340094158cd0c16686edf21a6db`, tree `f558f4f75c746067ac0f0cba257e968eea783dc3`; compiler/library trees `2df71089004814bf823095e22b77e2225d48c725` / `f18cdcb636938cf35c5b89fbb3dea478c46d9d71`. This includes e6eee732; later inputs are excluded.
Base is cumulative `d62d1333dcef79a1a6d547686c9b7b21ca2d9055`: the historical full/finite audit,65-path a06→59d/signed map and its published sparse/gate receipt adoption remain intact. Their scope/invalid-fixture/Foundation-only/ownership/runtime limitations are not replaced by a file count.
[Exact delta map](compiler_ecs_audit_d1_delta_dec17663.tsv) contains **37 authored Tower paths (12 added,25 modified,0 deleted)** and **8 bootstrap copies (1 added,7 modified)**. Net diff and the union of non-merge authored history path names agree; no transient added/deleted Tower path is silently omitted. No other project directory has a Tower delta in this interval.
Every row records baseline/current Git blob, independent receipt key, full peer commit and its exact blob. Initially33 authored rows matched and4 awaited D2; final reconciliation adopted the newly published exact staging peer below, so all37 authored rows and8 copy rows now match. Matching was checked against actual receipt scope, not merely a commit containing the file.

| Receipt key / authored paths | Independent current-source coverage | Owner implementation/evidence remains separate |
| --- | --- | --- |
| SCC /10 | L2 [08c75583](compiler_lr_scc_peer_c934d02d.md): provider/interface/types, LR analysis/work, API/failure/graph tests, bootstrap comparison/project collection. Exact current blobs. | B1 [9bb394d0/69e706fe](compiler_lr_scc_provider_59d7dc9e.md);150-grammar and ownership receipts attributed. |
| SCANNER /4 | ROOT [2617bc36](parser_single_selection_peer_be6a6b66.md): syntax_scan, scan-choice fixture, frontend_session_scan and lr_work provider. | A1 [2b39093c](parser_single_selection_d62d1333.md); no new token/performance run. |
| TRACE /2 | D2 [cbedb8d1](parser_trace_peer_bdb0ed38.md): parser_trace_failures and final lr_components direct-import correction. Earlier SCC review remains for unchanged component-test logic. | B1 [5f821e89](parser_trace_ownership_c934d02d.md), A1 direct-import integration; exact denial/retry evidence attributed. |
| RETAINED /2 | L1 [d4baaf15](retained_owner_peer_review_31102b64.md): execution_main/world exact blobs. | D2 9c6ac64e/1040c73e; fresh semantic recompilation in retained owners, not persistent semantic-cache invalidation. |
| GRAPH_ORACLE /2 | D2 [b862499b](scc_oracle_symbols_peer_b8b3be21.md): graph_components_checks and final frontend_main. Preserves prior trace/scanner selectors and adopts new oracle registration composition. | D1 04bec3b0/27ab6ee8;242 configurations and wrong-oracle rejection remain owner evidence. |
| QUOTA /6 | D1 [035ad6e8](generic_quota_peer_45dbdc59.md): generic_body_types/generics/semantic_generic_body_work, generic_clone_storage/quota_checks/storage_main. | A2 [eb97cc45](generic_quota_diagnostic_31102b64.md); kernel-malformed/format-allocation limits retained. |
| FOREIGN /4 | D2 [cd776c22](foreign_grammar_peer_b862499b.md): foreign_grammar, verify_compiler and two isolated distribution fixtures. | L1 [ffd45987/1072141e](foreign_grammar_package_bdb0ed38.md); authored repair is not a repinned public resource. |
| LR_INDEX /1 | D1 [58345ee0](lr_prediction_peer_035ad6e8.md): current lr_lalr; earlier SCC item-graph review remains, new scratch-index delta independently checked. | B1 [49cb7c45](compiler_lr_prediction_index_bdb0ed38.md); gains and slower4096 control unchanged. |
| SYMBOLS_COMPOSED /2 | L2 SCC/entity-register review→D2 b862499b Wasm callbacks→D1 [58345ee0](lr_prediction_peer_035ad6e8.md) scanner foreign imports. Both final policy/checker blobs match; older peers alone are not called current. | B1/A2/B2 exact symbol closures, finally5038ad3a; no wildcard permission or inferred target execution. |
| STAGING_D2 /4 | D2 [7123b8c6](staging_extent_peer_58345ee0.md), published e9be98a5 during final pull: tests/staging_extent_checks.tower, staging_extent_helpers.tower, staging_extent_invalid.tower, lr_work_main.tower all match the original freeze. | A1 [7a0d9eff/05a23c99](staging_extent_acceptance_e3958206.md); owner tests remain separate from the new independent review. |

The lr_work_main composition is precise: its reviewed035ad6e8 blob49c0466e becomes70a730fc by one import, one explicit staging-extents selector and one query/all call. D2's incoming peer explicitly checks that joined caller, preserving quota/seeded entries; D1 read and matched the receipt without duplicating its review. Retain its limits: Graph-only acceptance, worker-relative negative offsets, controlled post-join waits rather than natural frontend suspension, and no extra canonical fixed-point assertion.
BOOTSTRAP /8 rows are resource provenance, not eight new authored implementations. D2's [08c75583 package review](bootstrap_candidate_peer_59d7dc9e.md) names all eight exact library blobs; each copy also equals its59d authored source. Existing af32 sparse,35268 codec and gate/pool reviews remain chained there. No generated compiler/test Tower files occur in this tracked delta; ignored build outputs are excluded.
Deleted-path disposition: none in this interval; earlier retired paths and their historical reviews stay retired. The known optional foreign-grammar public-resource gap remains explicit despite the authored fix; this map neither rewrites the pinned resource nor claims package execution.
**Finite closure:**all37 authored paths have matching independent current receipts; no unreviewed/unassigned path remains in this fixed delta. D2's initially live scope closed through its published peer, not owner tests. The separate B2 package-producer repair remains unpublished/absent here and needs its own future exact-blob peer. The original whole-goal/runtime/release gates and inherited baseline limitations remain separate.
Checks: frozen Git name/status/raw blobs, unique map equality, history-union equality,45 exact peer-blob matches, eight59d source/copy equalities and unchanged todo; source metadata only. Raw files: `build/d1_ecs/final_audit_dec17663/{delta.raw,delta.tsv,history_paths.txt,net_paths.txt,receipt_routes.tsv,mapped_paths.txt}` retain the initial pending classification; the committed map records adoption. Merge65e37ee5 adds only D2 documentation, with all frozen source blobs unchanged. No builds/tests/heavy lock/profile/instrumentation; runtime profiling is inapplicable. Disk126GiB; owned jobs drained. ROOT's twelve-row handoff is untouched by D1.

### D1 package-path snapshot/published peer — 847084c1 (2026-11-23)

[Three-file independent receipt](compiler_project_paths_peer_847084c1.md): baseline05a23c99, original callers7f6f3a14; exact snapshot/archive hashes verified and all three published edc724c5 blobs match through887f2539. Entire delta and package/depfile/read/dedup/generated-unit/OS ownership callers inspected; no build/test/heavy lock or runtime profiling.
**Concrete source defect, ROOT/B2:** `tool_path_relative:40–42` chooses the deepest physical-root prefix. With `source/again -> .`, required `source/again/leaf.tower` becomes `leaf.tower`, dropping the distinct lexical module; dedup can silently accept this incomplete closure. Source-level branch proof, not an executed reproduction. Existing file-symlink positives do not cover directory aliases; minimal extension to the existing Tower fixture is specified in the receipt.
Original runtime alias repair, exact required-dependency rejection, conflicting-content retention and scoped resource disposal are substantively traced; B2's positive/three-negative and 562-source/25-unit packaging checks remain attributed. Published identity comparison is closed; correctness acceptance remains open for the exact directory-alias defect and ROOT's coherent package/generations. Historical full/finite audit and failed c934 evidence remain intact; no whole-goal or hosted claim.

### D1 query-admission fixture peer — 5dccac4b (2026-11-23)

[Independent delta receipt](query_admission_peer_5dccac4b.md) and [23-path exact blob map](query_admission_peer_5dccac4b_blobs.tsv) review authored3a0dd322/publishedd28c518696 against887f2539. No introduced defect found: measured setup peak partitions the unchanged cap before owners, real Waiting/peer42/private storageNone precede new graph Capacity, declaration executing-index denial issues no running ticket, and ordered failure/no-publication/retries/zero-owner teardown remain checked. Earlier B1 observation peer is preserved at its older blob, not substituted for this delta.
A2 seven passes remain owner execution; earlier57 retain their distinct sources, yielding64 source-bound registrations rather than a new current full run. Requested-four does not prove observed overlap; pressure-retained retries and unasserted exact diagnostic positions are explicit limits. No build/test/heavy lock/profile; docs-only performance inapplicable. Later package helper repair and ROOT final artifact/sanitizer/release adoption remain separate.
