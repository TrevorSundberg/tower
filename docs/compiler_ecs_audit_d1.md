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
No baseline execution, performance, sanitization, build or publication pass has
yet been established by D1. The older handoff's missing-helper claim is superseded
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
