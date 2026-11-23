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
