# B1 parser, syntax and formatting audit

This is an in-progress file audit at `6282238779034442e0578d76b921ca117df819f1`,
not acceptance closure. Runtime evidence and disposition are recorded separately
from source inspection. B1 owns compiler `lr*`, `parser*`, `syntax*`, `grammar*`,
lexer/token and `format*` families plus their specific tests. Cross-owner
`host_parser*`, `language_grammar`, frontend/world and unit manifests are reviewed
read-only; API changes require coordination. Discovered regex/forest dependencies
must be included in the final coverage reconciliation.

The audit uses [Flecs systems](https://www.flecs.dev/flecs/Systems.html) for staged
publication and explicit read/write dependencies,
[component traits](https://www.flecs.dev/flecs/ComponentTraits.html) for storage
and relationship choices, and [Burst aliasing](https://docs.unity3d.com/Packages/com.unity.burst@1.8/manual/aliasing.html)
for the requirement that optimization follow actual alias proofs. No external
implementation or performance claim is transferred to Tower.

## Reviewed files

All paths below are relative to `scaffolding/compiler/`. The reviewed revision
above applies to each row. A source conclusion is not a race-freedom proof.

| File | Storage, ownership, relationships and scheduling | Evidence / disposition |
| --- | --- | --- |
| `lr_types.tower` | Packed value records for disposable productions, symbols, transitions and parser stack frames. Forest indexes borrow nodes; no independent semantic authority. | Full source inspected. Preserve stable sentinel values and public record layouts. |
| `parser_types.tower` | Rule/reference/string/range/match payloads attach to ordinary entities. Variable strings/token IDs use owned vectors, so payload stability matters more than packed vector headers. | Full source inspected. Lifetime implementation is in `parser_nodes`; actual fragmentation measurement pending. |
| `parser_nodes.tower` | Payload init/dispose pair owns vector allocation; label copies outlive table/session. Mutators require exclusive owner; no thread-safety claim. UTF-8 append uses shared decoder. | Full source inspected. Existing parser fixture coverage needs rerun; no storage rewrite justified yet. |
| `grammar_types.tower` | World lends component kinds and owns Bedrock/syntax/table cache plus leased worker pool. Builder carries explicit kinds and root. | Full source inspected. Shared layout remains untouched pending owner coordination. |
| `parser_table_types.tower` | Frozen table borrows presentation owner and owns runtime/context arrays; requests cannot mutate caches/refcounts. State contexts are derived ordered indexes. | Full source inspected. Comment about missing function values is historical; enum service dispatch remains implemented. |
| `parser_diagnostic_types.tower` | Diagnostic owns option text and bounded probe storage; borrowed views expire at destruction. | Full source inspected. Follow implementation cleanup and failure fixtures before closure. |
| `lr_tree.tower` | Shifts transfer node ownership to the forest; reductions join captures in stack order and materialize shared nodes. Generated productions flatten; ordinary roots transfer on acceptance. Explicit match kind preserves world identity; legacy adapter selects default kind. | Full source inspected. Check partial transfer failures through existing forest/parser tests; no second AST introduced. |
| `parser_workers.tower` | Exclusive coordinator lease, explicit world budget grants for extra lanes, retained pool across revisions. Close drains before releasing inputs; non-world callers own local pool. | Full source inspected. Saturated/partial grants and wider retained pools preserve exact output and release receipts. Zero-byte grants cover lanes only; parser heap/RSS remains outside this accounting. |
| `lr_first_work.tower` | Packed nonterminal result vector; each frontier destination unique. Frozen previous ranges, private output, declared ranges/tickets, joined publication, revision reset. Grammar cycles are monotone fixed points. | Full source inspected. Uses capacity cap even if retained pool wider; narrow frontiers return to serial solver. Equivalent/failure checks pending. |
| `lr_state_work.tower` | Workers derive outgoing closures; coordinator interns state IDs and appends transitions in serial order. Job components and private results drain before scope exit. | Full source inspected. Lazy admission and shared extra-lane grants pass graph/retention/overlap checks. All 48 final paired runs pass: refinement improves large parallel latency at higher CPU/RSS/switch cost, retaining coarse narrow batches. Whole-compiler and final merged sanitizer/publication evidence remain open. |
| `lr_runtime_work.tower` | Packed private runtime result records, separately owned rows. Workers normalize actions and gotos; coordinator interns rows and selects earliest conflict in source-state order. | Full source inspected. Input view closes after joins; every unconsumed row/goto vector freed on failure. Equality/fault tests pending. |
| `lr_api.tower` | Separate compilation boundary borrows typed range/production records through opaque owning handles. No allocation, scheduling or competing representation. | Full source inspected. Preserve actual implementation ABI; new benchmark reuses this boundary. |
| `lr_analysis.tower` | Packed productions/symbols borrowed immutable; nonterminal FIRST/nullable/production vectors derived. Closure-local hashed membership avoids repeated expansion and sorts once; propagation tracks changed sets. Workers copy failure flags and own closure scratch. | Full source inspected. Range identity preserves overlapping actions, not interval union. Existing LR serial/thread comparison passed on baseline; bulk-range cost unmeasured. |
| `lr_states.tower` | Stable individually owned states/items behind dense pointer index; hash interning publishes deterministic IDs and transition order. Disposal releases derived vectors. | Full source inspected. Address stability needed across index growth; no packed-state/SIMD claim. Existing baseline LR comparisons passed. |
| `lr_work.tower` | Closure/link/action/propagation task components use shared graph, private contiguous output ranges, pinned inputs and joined publication. Wave reset rejects old tickets; failed admissions drain. | Full source inspected. Real baseline LR suite passed; its queue-occupancy assertions alone do not prove speedup. Wide state microbenchmark shows overhead requiring admission investigation. |
| `grammar_builder.tower` | Explicit world kinds, root-owned ordered child relationships, sticky failure and partial-document disposal. Literal vectors reuse UTF-8 decoder. | Full source inspected. Keep construction on exclusive coordinator; no duplicate grammar. |
| `grammar_attributes.tower` | Pure bounded spelling/classification helpers over borrowed vectors; nominal kind/direction values. No world mutation or storage. | Full source inspected. Bracket grammar metadata is distinct from bound declaration attribute types. |
| `syntax_types.tower` | Shared grammar/source/pattern/provenance component layouts; ordered item and attribute views point to retained entity relationships. Variable strings remain vector owned. | Full source inspected. Trace relationship ownership through builders before final closure; no replacement AST. |
| `syntax_nodes.tower` | Component lifecycle retains before releasing source/pattern/replacement; comments snapshot before growth. Iterative structural comparison ignores cache addresses and optionally includes template coordinates. | Full source inspected. Refs are coordinator-owned; no concurrent mutation. Layout-offset exports remain ABI inspection. |
| `syntax_source.tower` | Immutable copied name/text snapshot with coordinator refcount; source location scans UTF-8 bytes and clamps at EOF. | Full source inspected. Potential repeated location scan cost not yet measured; preserve Unicode-scalar column contract. |
| `syntax_revision.tower` | Immutable retained revision overlays; named views sorted, tokens retain lexical order/priority, local declarations publish only after candidate validation. Ready filtering shares underlying entity graph. | Full source inspected. Insertion sort and linear overlay scans are candidates only; B2 owns underlying frontend revision cache. |
| `syntax_version_types.tower` | World-specific kinds and retained revision owner; runtime/lexicon/emission/replacement caches are derived. Diagnostic owns text; cache retains versions. | Full source inspected. Follow version/session destructors before acceptance. |
| `syntax_view.tower` | Borrowed name-sorted rule and ordered alternative view. | Full source inspected. Lifetime belongs to retained revision, not view. |
| `format_foundation.tower` | Recursively formats authoritative components using bound names, explicit types and ordered effects; per-call engine/output. Canonical output imports foundation_syntax; summary mode preserves original names. Floating values preserve bits. | Full source inspected. Agreed constructor switch implemented; four generated shapes and four malformed shapes pass. Complete source/semantic constructor roundtrip awaits joined owner integration. |
| `parse_tree.tower` | Packed forest records own shared entity leaves and borrow table capture names. O(1) fragment concatenation, iterative flattening preserves sibling order and outer capture precedence; take transfers ownership. | Full source inspected. Forest is a disposable ownership arena, not another AST. Partial attachment leaves remaining leaves for destructor. |
| `parser_integration.tower` | Coordinator resolves names and constructs table before publication; diagnostics own compiler buffers. Explicit construction and legacy default-kind/tracing adapter are separate. | The tracing setter now returns allocation/attachment failure. Its sole caller emits a diagnostic and exits nonzero; the parser fixture sweeps actual allocation failures, checks no partial marker or leaked ownership, and restores caller state. All 15 parser tests pass; final sanitizer evidence pending. |
| `parser_table.tower` | Explicit kinds; copied name/capture snapshots and derived contexts/runtime. Ordered FIRST/state/LALR/runtime construction uses existing worker kernels. Source-node indexes detach only after successful build. | Full source inspected. Error cleanup preserves grammar for retry; context collection remains coordinator serial with stable diagnostic ordering. Profile before introducing another worker pass. |
| `parser_markers.tower` | Nominal request action/input protocol and stable terminal sentinels. | Full source inspected. No storage/scheduler; retain ABI. Sentinel-return helper is legacy style, not a reason for broad churn. |
| `parser_stream.tower` | Single writer owns buffered token/entity/error; return/poll transfer exactly one reference. UTF-8 owns copied input; layered recognizer and syntax callbacks borrow owners. | Full source inspected. Destroy discards buffered refs before freeing; empty poll is resumable. Legacy read converts empty to EOF by its pull-only contract. |
| `parser_state.tower` | Request-private recognizer, forest, lookahead/completion/error; table/runtime/stream borrowed. One-token steps and explicit waiting do not replay accepted input. Diagnostic probes own stacks/options and read table snapshots. | Full source inspected. Cancellation destroys request before stream/table; low-level constructor permits null presentation context only for clients using low-level step API. Tests pending owner link fix. |
| `format_types.tower` | Owned output text/spans; borrowed world kinds and substitution view with original entity identities. | Full source inspected. No second serializer or shared mutable formatter state. |
| `format_api.tower` | Separate unit declarations for shared output/label engine. | Full source inspected. ABI only; implementation remains in same shared formatter. |
| `format.tower` | Node-world read-only component access when kinds implicit; private text/span buffers, explicit failure bit, canonical escaping. | Full source inspected. No component registration during reads; maintain frozen inputs. Some engine entry points initialize only used fields; no unrelated rewrite. |
| `format_grammar.tower` | Emits declaration order, append/redefine, captures, attributes, token patterns, replacements and import paths from shared syntax nodes. Preview borrows same rules. | Full source inspected. Wrap probes allocate temporary output; possible cost requires measurement. Historical numeric precedence fallback remains supported compatibility spelling. |
| `format_dependent.tower` | Depth-bounded display walk uses named parser relationships and temporary substitution bindings, never mutates authoritative entities. | Full source inspected. Explicitly display fragments, not canonical semantic serialization; no fabricated concrete generic instantiation. |
| `format_diagnostic_types.tower` | Borrowed bounded diagnostic source/context/production views; output owns FormatResult. | Full source inspected. Input lifetime spans call; no mutation/scheduling. |
| `format_parser_table_types.tower` | Packed private traversal frames and resumable Name/Description requests over immutable table. | Full source inspected. Derived formatter control, not grammar storage. |
| `syntax_emission_types.tower` | Explicit kinds, ordered rule/token/literal input views; production/helper metadata indexes source entities. | Full source inspected. Stable token IDs/borrowed names belong to retained emission owner. |
| `syntax_tags.tower` | Stable public syntax component tag bindings. | Full source inspected. Duplicates initial enum values for ABI compatibility; do not renumber. |
| `source_comments.tower` | Lexer span metadata attaches to original Foundation entities. Stable temporary target sort/binary search preserves tie order; collection after optimization relocates comments to module scope. | Full source inspected. Mutation is coordinator-only; explicit node-local sem_get ownership depends on semantic owner. No new tokenizer or semantic graph. |
| `lr_grammar.tower` | Copied stable names and packed productions/symbols are derived from ordered grammar entities. Hash/name indexes are temporary; source pointers are borrowed until explicit detach. | Full source inspected. Finish and detach have separate ownership contracts; preserve unresolved-name diagnostic lifetime. |
| `lexer_table.tower` | Dense alphabet, transition and acceptance rows derive from automaton states. Bounded row growth checks allocation; UTF-8 adapter preserves longest-prefix recognition. | Full source inspected. No independent token authority or mutable shared cursor. Automaton dependency added to audit scope. |
| `lr_lalr.tower` | Dotted-production closure cache and packed propagation graph are temporary derived indexes. Sorted scatter preserves overlapping terminal containment. Worker output vectors publish deterministically; cache construction is coordinator-only. | Full source inspected. Cache entries must exist before worker reads; missing input fails instead of mutating lazily. State/action equivalence covered by existing LR suite. |
| `syntax_expansion_types.tower` | Frozen replacement/capture views borrow compiled template trees; result owns diagnostic bytes and explicitly passes the mutable root. | Full source inspected. Owner must outlive expansion; no duplicate AST. |
| `syntax_replacement_types.tower` | Preparation records own captured-source references, tree and names; use counts and categories derive from grammar. | Full source inspected. Freeze transfers immutable views, not another authoritative grammar. |
| `syntax_template_types.tower` | Template segments and capture metadata describe source/template relationships and parser preparation state. | Full source inspected. Follow actual tree ownership through preparation before acceptance. |
| `syntax_expansion.tower` | Request-private iterative traversal rewrites shared parse entities; normal-entity hash and work stacks are disposable indexes. Repeated captures clone, final use transfers; child order and provenance retained. | Full source inspected. Explicit recursion/output/step bounds; failure disposes queued scratch/traces. Ordered rewrite stays serial because later expansion observes prior tree changes. Literal protocol/limit IDs remain legacy, not a reason for mechanical churn. |
| `syntax_provenance.tower` | World-owned origin/trace components retain immutable expansion chains. Unique unpinned chains release iteratively. Staged worker copies queue references for coordinator ownership publication. | Full source inspected. Copy prepares allocations before replacement; staged target must be new/private in same world. Source pin and stage hold/join publication remain caller obligations; no payload-mutation protection inferred from pin alone. |
| `syntax_replacement_owner.tower` | Coordinator owns sorted captures/production entries and selected tree. Freeze reserves all view arrays, clears mutable host and prevents subsequent edits; destruction releases each retained capture/tree. | Full source inspected. Returned input borrows frozen owner. Callback void API records sticky allocation failure; no worker mutation or independent template graph. |
| `automaton.tower` | Bounded packed NFA records and hashed bitset DFA subsets derive from source patterns; private scratch publishes stable row IDs in traversal order. | Full source inspected. Explicit NFA/DFA/complexity/allocation/nullable failures; callers must supply valid patch indexes. No parallelism claim for bounded coordinator construction. |
| `syntax_replacements.tower` | Derived reachability and unit-parent indexes select nearest replacement destination. Per-request epoch avoids repeated traversal; ambiguity fails rather than selecting by source order. | Full source inspected. Only reachable replacements prepare; candidate ownership transfers through owner callbacks. Ordered selection and diagnostic precedence justify serial coordinator work. |
| `syntax_template.tower` | Hole grammar and source/destination lookup tables derive from retained emission owners. Private tree remap updates original match components, preserving shared helper entity identity. | Full source inspected. Both owners pinned; use counters and writes are request-private. Missing names retain explicit sentinel behavior; no second AST. |
| `format_source.tower` | Parser-leaf positions and lexer trivia form disposable formatting records. Checked sorted fast paths retain arbitrary caller-comment order fallback; output spans own their arrays. | Full source inspected. Source/tree lifetime borrowed and immutable. Reparse validation lives in session formatter. Deep recursive leaf traversal remains a stress coverage gap. |
| `format_syntax_preview.tower` | Shared formatter builds bounded diagnostic previews; iterative pair stack compares original grammar/parse nodes without mutation. | Full source inspected. UTF-8 boundaries preserved. Preview is not canonical serialization; failed comparison conservatively prevents formatting publication. |
| `format_parser.tower` | Iterative tree traversal borrows explicit kind/graph; scalar formatting has bounded scratch. Final host strings use compiler_buffer_allocate with overflow checks. | Full source inspected. Legacy debug entry resolves node kind at boundary; no global authoritative graph. Failure returns null, not partial host string. |
| `format_diagnostic.tower` | Bounded options/provenance borrowed from parser; binary search over emission production order. Repair only selected when unique; shared output owns text. | Full source inspected. Diagnostic presentation is distinct from canonical program. Redundant at_start predicate is cosmetic and left unchanged. |
| `syntax_session_types.tower` | Session exclusively owns source/document/module lease, retained revisions/versions, cache, completion and highlights. Frame userdata borrows typed session/capture storage. | Full source inspected. Borrowed world/environment must outlive session; no concurrent session writer permitted. |
| `syntax_session_pins.tower` | Every revision/version field owns a reference even when aliases; setters retain before release. | Full source inspected. Dispose clears all fields; coordinator refcounts, not cross-thread atomics. |
| `syntax_session_state.tower` | Explicit-world allocation; progress resets request-local indexes. Completion releases before borrowed table/version and source pins. | Full source inspected. Session reset/destroy requires inactive recognizer; no worker scheduler here. |
| `syntax_session_inputs.tower` | Copies source before replacing module/document, rejects foreign world modules, distinguishes borrowed and internally owned module. | Full source inspected. Failed reset records enough ownership for retry; frontend module allocation/error semantics are B2-owned and included in focused failure coverage request. |
| `syntax_version.tower` | Refcounted execution snapshot owns derived rules/table/lexicon/replacements and retained grammar/Bedrock. Partial construction releases consumers before source pins. | Full source inspected. Coordinator-only refcount; immutable snapshots may be borrowed during jobs. |
| `syntax_version_cache.tower` | Derived recency index and version pins copy transactionally. Uncached valid build survives cache-allocation failure; occupied entries always own versions. | Full source inspected. Cache is session/coordinator-owned; no sharing of mutable recency across workers. |
| `syntax_version_build.tower` | Overlay/validate/filter pending declarations before constructing derived table/lexicon/replacements. Publishes only complete version; diagnostic and intermediate ownership use lexical cleanup. | Full source inspected. Pending producer readiness remains distinct from source declaration identity. Ordered grammar activation stays serial. |
| `syntax_session_setup.tower` | Explicit world/environment setup from immutable Bedrock; module grammar selects subsequent syntax. Reset swaps owned version only after build attempt; baseline installs publish validated snapshots. | Full source inspected. Fatal diagnostic-allocation policy is explicit legacy contract. Old tests assuming ambient Foundation now fail and must migrate, not change production policy. |
| `syntax_session_next.tower` | One construct at a time; recognizer/lookahead drain before revision install. Candidate grammar validates before pin swap, and ordinary code expansion updates same parse entities. | Full source inspected. Import/grammar/effect order requires serial activation; independent sessions/units supply outer parallelism. No syntax-stage dependency pre-execution. |
| `syntax_session_format.tower` | Private session clones parse source and formatted output with replacements disabled; exact shared-tree comparison gates publication. Optional cache copy failure uses supported uncached build. | Full source inspected. Owns both session roots until comparison ends; immutable static error survives disposal. Failure sweeps pending obsolete fixture repair. |
| `syntax_session_view.tower` | Borrowed revision/rule/token/keyword views and shared formatter previews. | Full source inspected. Coordinator keeps session unchanged until reader finishes; preview epsilon spelling is presentation only. |
| `syntax_session_diagnostic.tower` | Current revision overlay supplies locations while cached table retains original declarations. Diagnostic owns candidate arrays until shared formatter completes; returned text is compiler buffer owned. | Full source inspected. Overlay and parser allocation failures rely on explicit legacy diagnostic policy; no global mutation. |
| `syntax_baselines.tower` | World-owned registry retains validated documents/revisions; immutable seed built once. Publication checks same-world components and prepares source bytes before replacing registry owner. | Full source inspected. Existing pins survive replacement; first construction/publication prohibited while world pinned. Foundation invalidated for future sessions after Bedrock replacement. |
| `syntax_scan.tower` | Request-local cursor and temporary capture lookup borrow frozen lexicon/runtime; tokens attach match data to same-world entities. | Full source inspected. Diagnostic lookahead is bounded and advances copied cursor; malformed token/allocation failures preserve errors and release partial nodes. |
| `syntax_session_scan.tower` | Explicit session/version builds stack scan descriptors; completion pins original version, comments/highlights use same lexer. | Full source inspected. Preview does not commit declarations or parse cursor; lookahead accounting is coordinator mutation. Borrowed template frame remains alive through stream destruction. |
| `syntax_highlights.tower` | Dense span rows borrow stable separately allocated style strings owned by one session. Copy prepares complete replacement before disposing target. | Full source inspected. Void callback preserves explicit fatal allocation contract; fallible push/copy exposed separately. No semantic meaning inferred from style. |
| `syntax_pending.tower` | Immutable missing-reference analysis retains original alternatives via revision owner; names/term array are derived. Empty ready path allocates nothing. | Full source inspected. Diagnostic follows bounded dependency path after validation; end-of-module unresolved declarations remain errors. |
| `syntax_version_presentation.tower` | Borrowed revision/emission maps production IDs to original declarations and helper origins; host text uses compiler buffers. | Full source inspected. Numeric IDs are derived; fallback description is presentation, not conflict priority or semantic substitution. |
| `syntax_inspection.tower` | Read-only rule/match/template/capture queries over session-pinned original entities. | Full source inspected. Bounds checked; caller retains returned entity before session advance. No copied authoritative tree. |
| `regex_grammar.tower` | Ordinary grammar builder creates regex language with named ordered relationships in explicit kinds/world. | Full source inspected. Unicode scalar terminals and contextual escape/class rules share LR engine; no second regex parser. |
| `regex_lowering.tower` | Iterative visits/fragments/patch chains borrow parse entities and build bounded disposable NFA/DFA. Copies visit fields before vector growth. | Full source inspected. UTF-8 escape/range/nesting/empty-token/complexity diagnostics preserved; all private work vectors and automaton drain on errors. |
| `utf8.tower` | Stateless scalar decoder/encoder/validator over explicit byte ranges. | Full source inspected. Rejects overlong/truncated/surrogate/out-of-range input; encode writes nothing on insufficient capacity. Output-disjointness contract explicit, not fabricated noalias. |
| `parser_presentation.tower` | Pull formatter protocol composes descriptions/names from borrowed table; compiler buffer replies freed after copying. | Trace output now consumes the formatter's actual byte length. The former null-terminated walk read beyond vector output and emitted garbage on valid input. Repeated corrected CLI traces are byte-identical; formatter failure reporting remains a legacy void boundary. |

| `lr_runtime.tower` | Packed runtime states borrow deduplicated stable action rows; private sorted/hash indexes derive from original grammar. Coordinator selects explicit precedence and earliest conflict, with no source-order conflict fallback. | Full source inspected. Finite terminal-chain specialization proves its narrow shape before use and keeps original LR state mapping; failed optional specialization retains ordinary runtime. Shared row cleanup covered by LR Memcheck. |
| `lr_parser.tower` | One request owns stack/evidence and borrows runtime; forest owns syntax nodes. Step/commit separates input readiness from mutation. Bounded completion probes clone state and never execute semantic effects. | Full source inspected. Source stream remains sequential by token/grammar dependence. Probe exhaustion is incomplete search, not proof of rejection; public completion API only promises a possible suffix. |
| `format_parser_table.tower` | Private explicit traversal frames suspend for name/description replies over a caller-pinned immutable table. Frames are copied before growth; reply text is copied immediately. | Full source inspected. Invalid indexes/replies and allocation fail sticky result; destruction supports pending replies. Presentation protocol is not Foundation serialization. |
| `syntax_emission.tower` | Original grammar entities lower into same-world parser entities. Stable name records and packed production/helper/first-set indexes are derived; pointer hashes never determine output order. Temporary input views clear before return. | Full source inspected. Coordinator-only construction preserves declaration order and deterministic helper IDs; source owners must outlive borrowed provenance. No packed-payload claim for individually allocated name entries. |
| `syntax_emission_lexical.tower` | Frozen sorted name/ID/token views borrow emission-owned storage and original compiled patterns. Private lexicon construction copies descriptors; exclusive template construction owns display holes. | Completion priority count and suffix output capacity derive from actual arrays. The named search limit defines storage once. Public predecessor objects before/after are byte-identical, so this source cleanup changes no runtime work. |
| `syntax_lexer.tower` | Immutable revision lexicon borrows pattern tables/text; each call owns choice and cursor. Longest-match, contextual admission and declaration punctuation preserve explicit lexical priority. | Full source inspected. Diagnostic peeks use identical selection; lexical ordering is a documented token rule, not grammar conflict resolution. Sequential source traversal remains justified. |
| `syntax_validation.tower` | Private rule states/reverse dependency edges, borrowed capture hash set and monotone nullable/productive fixed point derive from immutable grammar entities. | Full source inspected. Undefined dependencies propagate before active roots validate; diagnostic dependency chains lead to missing declarations. Pending inactive rules remain pending, while active incomplete or unproductive grammar fails. |
| `syntax_reader.tower` | Enriches original parse entities with grammar components, retained source provenance and ordered borrowed child indexes. Shared identifier decoder and attribute reader preserve source order and first error. | Full source inspected. Component/source mutation is exclusive coordinator work; malformed spans/captures fail. Legacy numeric spelling and source strings remain unchanged; not a second parser or AST. |
| `syntax_template_build.tower` | Coordinator owns temporary world-local revision/session/grammar/recognizer; captured source and replacement tree stay on original entities. Captures freeze before parsing and remapping. | Full source inspected. Lexical cleanup releases recognizer before stream/session/version and borrowed capture storage. Conflict is distinct from failed allocation/parse; no ambient module environment for template source. |
| `units/parser.tower` | Aggregate imports shared parser core and B2 frontend unit. | Full source inspected; manifest only, no alternate implementation. |
| `units/parser_core.tower` | Explicit implementation closure for graph, LR, regex, syntax and formatter modules. | Full source inspected. Separate unit boundary must retain dependency/import identity during package builds. |
| `units/parser_work.tower` | Core/frontend closure plus production-allocator LR work tests. | Full source inspected. Observer and measurement builds reuse these production kernels. |
| `units/parser_checks.tower` | Core/frontend plus parser case and replacement test units. | Full source inspected; serial allocation-instrumented profile is distinct from real-overlap checks. |
| `units/parser_check_cases.tower` | Explicit syntax scan/parser-state and B2 frontend fixture imports. | Full source inspected. B2 owns imported frontend test changes; no duplicate harness. |
| `units/parser_work_checks.tower` | Combined checked parser and LR work closure. | Full source inspected. Manifest alone establishes neither overlap nor instrumentation coverage. |
| `units/parser_replacement_checks.tower` | Imports expansion/replacement fixtures. | Full source inspected; tests operate on shared entities. |
| `units/template_build.tower` | Exposes template construction, inspection and session views. | Full source inspected; no second template implementation. |

Root language resources were also fully inspected at the reviewed revision:

| File | Storage, ownership, relationships and scheduling | Evidence / disposition |
| --- | --- | --- |
| `../bedrock.tower` | Immutable declaration seed specifies ordinary named grammar roles, lexical priority, append/redefine and import paths. | Full source inspected. Later GrammarDeclaration replacement preserves optional legacy precedence; seed never gains ambient executable syntax. |
| `../foundation_syntax.tower` | Imports Bedrock and incrementally defines canonical raw operations, functions, nominal enums, external symbols and attributes. | Full source inspected. Shared Core labels/captures are semantic ABI. Constructor calls reuse ordinary call syntax; no special grammar change needed. |
| `../foundation.tower` | Imports syntax then source-defined types. | Full source inspected. Minimal composition, no ambient type registry; both resources required in compiler packages. |
| `../tower.tower` | Ordinary grammar module extends Foundation through ordered replacement/append declarations for expressions/control/iteration/types. | Full source inspected. Disables old binary alternative before nested operands; borrowed foreach protocol is nominal, so raw arrays use derived counted bounds. No syntax migration in this change. |

## Reviewed parser and formatter tests

Paths here are relative to `scaffolding/tests/`. Unchanged fixtures were reviewed
at the initial revision; edited formatter/LR fixtures refer to this candidate.
Source inspection and executed evidence remain distinct.

| File | Review and evidence |
| --- | --- |
| `lr_work.tower` | Production allocator, explicit worlds, complete serial/threaded state/item/edge/action/runtime/conflict comparisons and final entity/component accounting. New narrow/128/512 cases check admission and exact output. Memcheck and DRD pass; occupancy assertions alone are not overlap proof. |
| `lr_state_benchmark.tower` | New Linux x64 boundary measures monotonic wall/process CPU, RSS, context switches and created entities over frozen cases; serial graph comparison/destruction outside timing. Checked 3 warmups/15 samples, multiple worker budgets and reversed pairs. Optional validated grammar size probes the admission boundary with the same benchmark object. |
| `lr_work_main.tower` | Selects production LR, unit, body and query suites; rejects unknown mode. Broader body fixtures are separately owned and currently fail on obsolete language-import assumptions. |
| `lr_analysis_api.tower` | Typed separate-compilation declarations match LR analysis/runtime/parser records; opaque handles only cross the ABI boundary. |
| `lr_analysis_oracle_types.tower` | Disposable reference records and linear ordered insertion deliberately differ from hashed production storage; reference allocation is checked and separate from failure-injected execution. |
| `lr_control_types.tower` | Named stable pull-protocol constants match production statuses. |
| `lr_analysis.tower` | Orchestrates grammar/tree/failure/precedence/differential checks; no independent mutable runtime. |
| `lr_grammar.tower` | Fixed and seeded 150-case grammar oracle compares exact names/rules/symbols/captures and source-release snapshots; explicit worlds and allocation sweeps. Bounds still include legacy repeated fixture constants; no broad mechanical edit. |
| `lr_grammar_fixtures.tower` | Same-world rule/reference/string/range component setup retains children via ordered entity relationships; caller owns root. |
| `lr_grammar_oracle.tower` | Linear name lookup/rank counting reference builds independent copied names/captures over shared source entities. Destructor frees each record/vector; tests release source before snapshot comparisons. |
| `lr_analysis_failures.tower` | Serial allocation injection covers construction/control/probes and 512-symbol index growth, with full cleanup and eventual-success requirement. Does not sanitize concurrent code. |
| `lr_runtime_faults.tower` | Explicitly requires serial transport; compares original tables including first conflict, retries after every injected allocation failure and checks deterministic counts/outcomes plus world disposal. |
| `parser_benchmark.tower` | Existing warm parsing measurement separates declaration setup from repeated parse; single-owner allocation counters restrict it to serial instrumentation. Lacks process CPU/RSS itself, so not sufficient for threaded performance claims. |
| `parser_retention.tower` | New diagnostic preserves the benchmark's reset/declaration/statement/release order, enumerates actual component pages and cache ownership, and checks explicit-world teardown. Reproduces the extra 56-slot page with unchanged semantic owner counts; 128 resets per input and complete buffer release pass. D1 owns the original benchmark oracle update; observed cycles are not a universal bound. |
| `parser_retention_observer.tower` | Reusable quiescent observer deduplicates actual component pages, verifies nonzero live ownership and slot bounds, derives requested bytes from actual payload/header/alignment layout, and reconciles pooled live components. Stable semantic/cache owners and buffer-minus-page counts distinguish page rollover from unexplained retention. Reports requested/live payload bytes separately; neither is RSS or allocator usable size. Exact isolated-world teardown passes. |
| `parser_main.tower` | Focused suite selection avoids duplicate executables; ordinary parse path releases returned roots and reports syntax errors. Formatter now receives explicit resource root; existing baseline paths expect scaffolding working directory. |
| `parser_fixture_setup.tower` | Shared fixture baseline setup reports diagnostics and fails clearly; baseline installation is not implicit file language activation. |
| `format_suite.tower` | Explicit language imports/resource environment; frozen exact body text/spans validated separately from derived prefix offsets. Canonical reparse, idempotence, comments, generated names, malformed constructor shapes and failure cleanup pass. |
| `format_main.tower` | Native test entry passes caller-supplied resource root to suite; keeps borrowed resource string valid for the call. |
| `format_wasi.tower` | WASI entry passes mapped current resource directory; native formatter pass does not establish browser/WASI execution evidence. |
| `format_abi.tower` | Separate-unit declarations preserve actual formatter and syntax data layouts; no replacement implementation. |
| `lr_analysis_oracle.tower` | Linear fixed-point FIRST and lookahead propagation reference differs from production frontier/index traversal; nullable cycles terminate monotonically. |
| `lr_states_oracle.tower` | Linear state interning and ordered transition/LALR reference preserve observable IDs independently of production hash indexes. |
| `lr_runtime_oracle.tower` | Insertion sorting and linear action lookup form the reference; comments distinguish current normalization from historical seed behavior. |
| `lr_parser_oracle.tower` | Independent pull/control/probe protocol model preserves frame, token and reduction accounting. |
| `lr_graph_checks.tower` | Exact FIRST/item/state/edge/action comparisons include reopened/idempotent operations and seeded propagation; lifetime cleanup remains explicit. |
| `lr_precedence_checks.tower` | Direct expected association/power answers and reproducible two-versus-six conflict cases supplement differential equality. |
| `lr_control_checks.tower` | Exact steps, frames, work budgets and token/control variants exercise bounded execution and deterministic status. |
| `lr_analysis_comparisons.tower` | Three fixed cases, narrow chains and 150 seeded grammars compare independent analysis/state/runtime results. |
| `lr_tree_checks.tower` | Explicit world transfers and allocation-failure ownership checks cover parse-tree specialization and cleanup. |
| `syntax_emission_api.tower` | Typed fixture boundary declarations and checked text helpers preserve production layouts and ownership. |
| `syntax_emission_entry.tower` | Repeated suite execution warms persistent kinds before checking retained buffers/entities; no concurrency claim from serial allocation instrumentation. |
| `syntax_emission.tower` | Shared-entity production/reference tree and metadata comparisons cover literal IDs, wrappers, helper provenance, nullable cycles, exclusions, 400 seeded grammars and allocation sweeps. Source inspection only in this phase. |
| `syntax_template.tower` | Typed scalar/token/list holes, repetition provenance and exact generated rules survive every injected allocation failure; root ownership remains live until disposal. |
| `syntax_scan.tower` | Token/EOF contracts, unmatched multibyte input, diagnostics and payload cleanup checked through allocation sweeps. |
| `syntax_replacements.tower` | Public session fixtures explicitly declare grammar and check destination ambiguity, invalid category/cardinality and capture provenance diagnostics. |
| `syntax_emission_oracle.tower` | Linear names/FIRST sets and sorted output enumeration differ from production hash/frontier indexes. Retained alternative/token entities and copied name buffers have explicit disposal; source inspection is separate from execution. |
| `syntax_reader.tower` | Independent reader comparison checks complete semantic trees, exact source provenance, canonical text and malformed-span diagnostics. Seeded 1000-byte identifier cases include overlap, NUL bytes and allocation failures. |
| `syntax_nodes.tower` | Exported size/offset ABI checks, independent iterative equality, self-assignment refcounts, aliasing comment growth and removal/recreation lifetimes. Equality intentionally excludes nonsemantic caches/comments and non-template locations. |
| `syntax_live_support.tower` | Session/test ownership helpers retain returned nodes and validate source spans; explicitly terminates length-delimited formatter output before legacy string APIs. Default-world bindings remain fixture boundaries. |
| `syntax_live_replacements.tower` | Immutable Bedrock roundtrip, semantic edit isolation and retained provenance after session destruction; replacement chains and repeated captures require distinct entities and bounded recursion diagnostics. |
| `syntax_live_grammar.tower` | Exact declaration boundaries/revisions, shared-prefix LR decisions and sticky candidate failures preserve prior grammar. Tests reject future syntax, ambiguous/nullable cycles and malformed loops without silent backtracking. |
| `syntax_live_lexical.tower` | Revision-cache reuse/churn, longest-prefix Unicode regex, contextual token overrides and invalid-candidate atomicity. Cache bounds use the configured limit; legacy fixture array counts are unchanged. |
| `syntax_live_attributes.tower` | Predecessor-readable grammar activation tests attribute entities/provenance, canonical roundtrip, lexical effects, exact precedence trees and invalid consumer semantics. |
| `syntax_live.tower` | Thin suite composition; no duplicate production grammar or runtime. |
| `syntax_lexer.tower` | Explicit world and pinned regex inputs; independent contextual lexer over 165 inputs/all offsets/six LR contexts, direct expected tie-breaking, no-allocation selection and failure cleanup. |
| `syntax_validation_fixture.tower` | Owns explicit grammar/token entities and rule views, with a separate ordered validation oracle; cleanup releases views before their source owners. |
| `syntax_validation.tower` | Compares pending causes, nullable/productive rules, required declaration captures and exact diagnostics; failure injection remains serial. |
| `validation_oracle.tower` | Independent linear lookup and fixed-point scans over borrowed grammar entities preserve reference declaration/capture order. Temporary alternative lists and records have explicit disposal. |
| `reader_oracle.tower` | Independent source-span, quoting, identifier and declaration reader writes the shared syntax components; subtraction-based span bounds precede access. No alternative authoritative AST. |
| `parser_state.tower` | Request-local pull state, checkpoints and completion probes are checked against explicit expected progress and ownership. Tests retain input owners through destruction and cover failed allocation. |
| `parser_failures.tower` | Serial allocation sweeps require eventual success and unchanged live-buffer counts; failures are checked explicitly, not treated as skipped successes. |
| `parser_integration.tower` | Incremental rule activation, ordered alternatives, captures and parse-tree provenance are compared through production services. Fixture roots and runtime tables have explicit lifetime; sequential token consumption follows grammar dependencies. |
| `syntax_expansion.tower` | Replacement captures, source remapping, recursion/ambiguity and allocation failures are exercised through shared entities. Expanded outputs remain owned until their consuming parse or cleanup completes. |
| `utf8.tower` | Exhaustive Unicode scalar encode/decode and malformed byte cases compare an independent decoder; output capacity and guard bytes are checked. |
| `utf8_boundary.tower` | Native page-protection boundary verifies decoding does not read beyond available input. Host-specific support does not imply browser memory instrumentation. |
| `utf8_oracle.tower` | Independent scalar validation and byte decoding reference; no compiler graph, allocation or worker state. |
| `regex.tower` | Fixed malformed patterns, seeded matching comparisons, complexity limits and serial allocation failures exercise production lowering against independent matching tables. |
| `regex_oracle.tower` | Test-only Thompson NFA and sorted DFA subset construction is independent of production lowering/indexes. Bounded derived tables own their vectors; failed compilation disposes partial output. |
| `lexer_table.tower` | Direct epsilon-NFA simulation and seeded nested-row DFA reference check production flat tables, longest prefixes, malformed Unicode and all input offsets. Failure sweeps verify cleanup. |
| `lexer_table_oracle.tower` | Nested row storage and independent binary alphabet search detect flat-index errors. Borrowed source stays valid for matching; each row and alphabet is disposed. |
| `lexicon_oracle.tower` | Independent lexical selection preserves longest-match and ordered tie rules over fixture definitions; reference state is disposable and not a compiler registry. |
| `format_repository.tower` | Repository sweep reads actual source, formats and reparses with explicit resources; errors preserve the failing path. Broader sweep execution remains a publication check. |
| `format_expected.tower` | Frozen literal text and ordered source-span goldens remain independent of formatter output. Canonical constructor spellings are explicit expected strings; embedded-NUL arrays use derived byte bounds. Numeric golden offsets are intentional fixture data. |
| `syntax_invalid/match_default.tower` | Missing final wildcard arm remains intentionally rejected; no migration to valid syntax. |
| `syntax_invalid/while_braces.tower` | Invalid loop syntax fixture preserves its rejection contract. |
| `lr_budget.tower` | New declaration-boundary client checks saturated/partial world grants and serial graph equality, plus a two-party barrier requiring caller/worker overlap with one extra lane. Joined native and actual ASan/leak-detection execution pass with A2's batch dispatcher. |

## Evidence and open work

Initial tree was clean and ordinary `git pull --rebase` succeeded. The public
bootstrap build runs in dedicated Docker container `tower_ecs_b1`, native cache
`build/ecs_b1/cache/native`, with one Ninja process. Its source closure is frozen
at the reviewed commit. Container budget is 12 logical CPUs / 24 GiB after the
coordinator reported the Docker VM's actual 60.6 GiB memory limit.

Frozen synthetic LR measurements show reduced setup and excessive scheduling:
at 12 workers, 128-way state construction changed from 33.64–35.74 ms to
4.20–4.36 ms; 512-way changed from about 180–184 ms to 151–157 ms. Ordered
state/item/edge comparisons and retention checks passed. These are not
end-to-end compiler results. Large peak process RSS rose from 104080 to
111452 KiB in that pair; no memory reduction is claimed. Raw `lr_grain_*.csv`
and experimental failures remain in the owned build logs and journal.

Production LR Memcheck passed with zero errors or lost allocations; 151014 bytes
remained reachable at exit. Helgrind failed on worker handoffs. Relinking the
same objects with system Clang/ld removed the custom-linker debug mapping warning
but retained 833 errors in 20 contexts. Installed Helgrind lacks a `sem_trywait`
interceptor; DRD has one and passed both system-linked and original Tower-linked
executables with zero errors. Original DRD used only built-in `drd-libc-stdio`
and `drd-ld` suppressions (31 and 70 instances); no project suppressions. The
original custom-linker mapping warning remains a symbolization limitation.
Shared owners received logs/reproduction for protocol review and independent
instrumentation. These passes do not establish universal race freedom.

Full file coverage, shared budget integration, joined constructor semantics,
representative compiler profiling, merged bootstrap/browser validation and
publication remain open. Current integration base is `60741c5`; unchanged
audited production files retain the initial reviewed revision above.

The new parser budget candidate reserves extra lanes per profitable phase and
uses the shared admitted dispatcher; retained pool size is not entitlement.
Tickets/accesses precede dispatch, joins and ordered publication precede grant
release, and zero-extra grants take serial paths. Heap byte admission is not yet
accounted by these receipts. This supersedes the earlier pending-API row notes;
the original observer/performance receipts above cover the older lazy-admission
snapshot, not this new candidate.

Owner-approved `library/vector.tower` cleanup replaces field-wise initialization
and the nested disposal-to-initialization call with complete `default` reset,
after freeing owned data. It removed a measured public-bootstrap aggregate
expansion failure without changing the generic budget. Existing compiler-storage
fixture compilation passed before/after, and the parser aggregate now compiles;
runtime/lifetime validation and equivalent valid runtime measurements remain open.

Current joined evidence supersedes the earlier compile-only notes: native LR and
query smoke pass after the batch-dispatch WorkPool layout rebuild. The complete
compiler-storage subset passes after its session reset declares its own grammar;
the enclosing executable still fails at the separately owned entity-registry
fixture's missing language import. That failure and exit134 remain recorded.
Actual ASan with leak detection passes the LR, query and work suites on the
current parser budget candidate. The LR executable links 23 direct Tower objects
and four memory archive members, with LLVM instrumentation in those recipes.
Foreign LLVM/system libraries remain outside this Tower coverage. ThreadSanitizer
execution and final merged publication checks are still pending.

Inventory reconciliation found a review row for every assigned production path
and parser/formatter-specific test path, including the discovered lexer, regex,
reader/validation oracle and root grammar resources. B2 parser frontend/module
units and unrelated bytes/floating oracles retain their assigned owners. This
reconciliation establishes review coverage, not runtime acceptance or a proof
that every access pattern is race-free.

Current formatter valid ASan/LSan suite now passes after a checked diagnostic
terminator and explicit resource-environment propagation. Original overflow and
missing-import diagnostics remain in format_address_checks.log and
format_address_diagnostic_checks_unbuffered.log; passing successor in
format_address_modules_checks.log. Current LR/query/work native, actual ASan and
actual TSan pass; source-language UBSan and final outer-unit/browser publication
remain explicit gaps. No original frozen observer snapshot was overwritten.

The later consolidated-prelude/nominal-layout/ready-index join has rebuilt all
84 requested native steps with the public predecessor. LR, query, overlap and
seven focused shared scheduler/tool checks pass. The formatter golden initially
omitted the two ordinary primitive helper functions now present in types.tower;
an independent explicit declaration table restores exact expected text and derives
the span total from fixture data. The complete formatter suite then passes,
including legacy body text/spans and canonical recompilation. These newer inputs
still need the final applicable sanitizer and publication milestone; earlier
sanitizer passes are source-specific receipts, not validation of this later join.

The clean public-pin parser cache and explicit-language fixture followups now
pass 14/15 CTest entries. Reader, live grammar/attributes, replacements, exact
formatter, LR random comparisons, allocation sweeps and entity metadata pass.
The combined test fails later at the separately owned entity_registry fixture's
missing language import; raw abort134 is preserved. This is a narrower remaining
failure, not aggregate acceptance. New paired execution-input roles and executable
lowering receipts are integrated with the reviewed runtime reachability handoff;
all dependent native clients are being refreshed before new semantic claims.

The later paired-input-role/executable join now passes current full execution
types (including source-bound primitive replacement and retained reachability),
control continuations and the 11 focused LR/query/formatter/shared checks from
their registered directories. Source-directory invocations expose fixture lexical
entry/override-key assumptions; they remain recorded separately. A five-line
early-capture program still diagnoses an unfinished query rather than source
order; A1 owns its general correction. The whole native build also has a final
request-test link gap: its generated driver source omits platform path functions.

The isolated whole-compiler small workload compares coarse/refined LR policies
with all other objects and inputs frozen. All84 invocations (2 warmups +12 pairs,
jobs1/4/12) produce byte-identical objects. Median wall seconds are1.163714/1.170591,
1.058388/1.064316 and1.066991/1.066607 respectively. The refinement's wide-grammar
microbenchmark gain does not produce a whole-compiler speedup on this429-byte
program. Explicit CPU/RSS/switch CSVs and source/binary hashes are retained.
Large generated4096-body compilation measurements are being prepared using the
same existing Tower measurement logic; no large-program claim is made yet.

The completed large workload adds 84 successful checked invocations on the same
frozen closure. Coarse/refined median wall seconds at jobs 1/4/12 are
3.103792/3.092429, 2.760552/2.750861 and 2.667037/2.671556. All object bytes match.
The source is 351269 bytes; its optimized object is 944 bytes because unused bodies
are removed. This measures checking 4096 bodies, not emitting 4096 machine-code
functions. CPU/RSS and phase receipts are recorded in the journal and exported
with exact binaries/sources. There is no established ordinary-program compiler
speedup from the LR refinement; the wide-grammar result remains an explicit
latency versus CPU/memory tradeoff. Measurement inputs precede later owner joins.

Further module checks corrected the earlier fixture-only interpretation: an
actual relative native entry beside the resource-root tower module duplicates
its identity when a dependency later imports the same lexical path absolutely.
B2's reviewed boundary fix now anchors native entries/resources without resolving
symlinks or changing virtual source keys. A regression checks exactly one imported
effect through both spellings. Its smallest public-pin compilation passes;
joined runtime and synthetic fixture identity acceptance remain separately tracked.

The new standalone entity-stage ownership fixture passes native, ASan/LSan and
TSan with 57792 finalizers and exact store teardown. TSan required an ephemeral
same-image container allowing its personality/ASLR setup; the original denied
startup and missing-time-wrapper failures remain recorded. These checks validate
the stage framework only. New source-root/request layouts and remaining compiler
owner fixes require a final coherent compiler sanitizer and publication milestone.

Subsequent joined validation passes native module identity, all thirteen focused
parser/formatter/query/work checks, source-emitter rejection/retention and the
driver-request allocation/ownership sweep after its manifest correction. The
original parser benchmark now uses D1's per-page owner census and exact teardown;
its normal and 128-reset stress runs pass. The snapshot arrays use the named cache
capacity. Actual ASan/LSan stress also passes, with the complete ownership log
byte-identical to native (SHA256 5729b5e3cf087008a376b428c208bfd4ae23ef5dfedcd550624026492014e77e).
Current formatter ASan/LSan exact text/spans, round trips and failure cleanup pass.

The fresh public-pin portable browser build succeeds, but the IDE test aborts
inside semantic_body_kernel during the first completion group. A reference link
of the same objects supplies the diagnostic stack; no browser workaround or
production linker change is introduced. A1 owns this shared editor gate. The
remaining entity-registry fixture import, general capture checks, final merged
sanitizers/generation and coordinated publication remain explicit acceptance work.
L1's identical-Foundation compiler regression is under matched hotspot analysis;
the current LR policy's serial guards alone do not attribute that old/new result.

The editor-background dependency fix now passes the complete fresh portable IDE
suite and native editor/query checks. This receipt precedes the general capture
v3 join and does not validate its changed closure. The authorized registry fixture
repair supplies an explicit Foundation import and owned module provider, closes
that provider before the original exact count oracle, and passes storage plus all
15 parser CTest entries. No lifetime or finalizer assertion was relaxed.

Capture v3 passes the original 23-case type-smoke suite (134.05s) and existing
staged aggregate suite (10.28s), including graph/fast execution, canonical
reconstruction and serial/worker comparisons. The broader known-binding suite
fails because an invalid program reports a capture restriction where its fixture
expects `Compile-time input failed`; the exact case is being isolated. The new
30-case lifecycle and source-proof extension/invalidation fixtures are now
integrated and rebuilt. Their execution, aggregate capture acceptance and final
merged sanitizer/generation/publication gates remain open.
