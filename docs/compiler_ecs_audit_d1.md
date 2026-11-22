# D1 compiler ECS acceptance audit

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
| scaffolding/tests/work_order.tower | 513 producers across admission windows complete in reverse; ordering only after all claims returned, then stable request order and stale ticket rejection. Deferred graph/vector cleanup. Exercises ordering policy without claiming concurrent execution. Preserve. |
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
