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
