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
| `units/parser_frontend.tower` | Composes parser state, explicit frontend table/cache/world/module services, session continuation/diagnostic services and source emitters. | Reviewed at 8112320 plus current handoffs. Import closure only; B2 owns frontend behavior, and this manifest introduces no authoritative representation or scheduling claim. |
| `units/parser_modules.tower` | Adds the module-test provider to the shared parser core/frontend closure. | Full source inspected. Test-enabled build profile, not another module registry. |
| `units/parser_modules_work.tower` | Module-test closure plus existing production-allocator LR comparisons. | Full source inspected. Actual overlap comes from executed LR work tests, not this import list. |
| `units/parser_modules_checks.tower` | Module-test closure plus shared parser/replacement fixtures. | Full source inspected. Fixture imports retain their original ownership and exact-output checks. |
| `units/parser_modules_work_checks.tower` | Combines module, parser/replacement and LR work fixture closures. | Full source inspected. Separate serial failure instrumentation and real-worker link profiles remain necessary. |

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
| `parser_trace_failures.tower` | Serial-only trace allocation/attachment sweep checks no partial publication, exact buffer/reference/child ownership, allocation-free repeated toggles and caller-state restoration. Imported by serial parser and frontend failure consumers; excluded from production worker link closures. |
| `parser_integration.tower` | Incremental rule activation, ordered alternatives, captures and parse-tree provenance are compared through production services. Fixture roots and runtime tables have explicit lifetime; sequential token consumption follows grammar dependencies. A valid traced sequence exercises the formatter's length-bearing output without importing allocation-failure instrumentation. |
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

## CURRENT remaining scope — 2026-11-22 23:40 UTC

Coverage is 173/173 identified assigned or discovered Tower paths: 105 compiler,
unit-manifest and root-language resources, plus 68 parser/formatter-specific
fixtures. The census includes every current primary production family path
(100/100) and primary fixture family path (63/63), with additional dependencies
and reference oracles. Five module/frontend aggregate manifests were missing
review rows in the earlier reconciliation; they have now been read and recorded.
The new parser_trace_failures.tower is reviewed. No identified assigned path is
unreviewed. Cross-owner files are identified as dependencies, not claimed as a
complete audit of those owners' scope.

| Requirement | Current disposition and concrete remaining work |
| --- | --- |
| World/component ownership and locality | Implemented and measured: parser_nodes/syntax_nodes use world-owned stable component payloads; lr_analysis/lr_states/lr_runtime use packed derived records, not another AST. Per-page census and exact teardown pass. The 2048-declaration stress snapshot has 65 pages, 529375 requested bytes, 227936 live payload bytes and 94616 unused slot bytes. These are distinct from RSS. Stable page payloads are not claimed to be fully packed archetype columns. Preserve this lifetime/locality contract in final merged sanitizer runs. |
| Shared worker and memory admission | parser_workers.ParserAdmission reserves shared extra worker lanes and releases after joins/publication; saturated/partial-grant and caller/worker barrier checks pass. **Actual missing contract:** its zero-byte reservation does not bound parser scratch or table heap. Coordinate an explicit world-owned byte-accounting/admission contract with A2 for FIRST/state/LALR/runtime work; a Docker memory cap or lane-only ledger does not complete that requirement. |
| Between/within-unit profitable parallelism | Within-unit LR kernels and cross-unit frontend/backend streams are implemented with real-overlap evidence. LR wide-grammar latency improves at higher CPU/RSS cost; ordinary small/large compiler comparisons did not establish an LR-refinement speedup. Incremental grammar activation, ordered interning and effect publication remain serial for their documented dependencies. Final joined browser worker execution and useful scaling remain unvalidated; B2 owns outer-unit services and D2 browser transport. |
| Staging, invalidation and effects | Shared semantic producer suspension, source-root proofs, generic extension/invalidation and exact capture policy are implemented by A1/L1. Current aggregate consumer and publisher ABI is integrated together. Query failure is at interpreter_call_query.input_query_tests' observation boundary; owner correction adds an observable callee local without dropping lifetime assertions. The new aggregate source's only isolated mismatch is its empty-struct size oracle (documented size 1, fixture expected 0). Adopt owner corrections and run full lifecycle42, policy, known/aggregate, canonical and worker matrices; do not report these gates passed yet. |
| Failure/cancel/drain/stale results | Existing LR/WorkGraph comparison, failure and budget fixtures exercise ticket reuse and cleanup; entity-stage concurrency passes on earlier source closures. parser_set_debug_trace now reports failures, and parser_presentation writes actual vector lengths. The bounded serial fault sweep and valid trace pass normal parser tests. Exact new trace/fault ASan execution still needs D1's focused parser selector. Repeat affected ownership/stale/cancel stress after the joint aggregate ABI and stage join. |
| Serial CPU/RSS | A2's entity_stage_prepare/publish membership guard is implemented. B1's two matched serial pairs on canonical SHA6f2571a1 improve 6.56–7.11s to 1.85–1.94s; CPU falls and RSS remains about 209 MiB (213392–214208 KiB). Same input/resources/output, only stage implementation changed. This does not compare different hosts or prove multicore scaling. L1 still owns the original normalized-backend deadline check. |
| Canonical formatting and grammar contracts | Explicit constructor goldens, exact source spans, malformed constructors, independent LR/reference behavior and incremental grammar fixtures pass. Current normal parser matrix is 15/15, including registry/provider and storage reset ownership. Final formatter/repository and browser round trips must use the final frozen semantic/ABI closure. No second serializer or ambient grammar/type fallback was introduced. |
| Supported instrumentation and host limits | Actual ASan/LSan format/LR/query/retention pass on 8112320 plus trace tests, before the newest aggregate ABI. Earlier TSan/DRD/Memcheck receipts remain source-specific. Final affected ASan and TSan are required. Source-language UBSan is unsupported; system LLVM/uninstrumented libraries and browser hosts are outside these native instrumentation claims. TSan startup needs the documented same-image container ASLR capability; denied startup is not a test pass. |
| Bootstrap/browser/publication | Public Linux x64 predecessor builds pass without a private bootstrap override. Fresh portable IDE passed before later capture/layout joins; current native and browser generations need a coherent final refresh and full applicable checks. Shared LLVM/Binaryen builds remain coordinator-owned. Main contains checkpoints 3a18a43/8112320; later source changes remain to commit/rebase. No publication lease, atomic main/gh-pages push, or hosted verification has occurred. These are mandatory completion work. |

Documentation updates themselves add no runtime cost. The remaining implementation
and validation work above is not demoted to optional follow-up by focused passes.
## B1 parser allocation and retention inventory for A2 contract � 2026-11-22 23:51 UTC

Source review of current 8112320 + joined handoffs; these are allocation sites and ownership facts, not measured totals or an implemented memory limit. Existing raw vector capacity grows geometrically in library/vector.tower; length is not allocated bytes. compiler_buffer_allocate adds its own header; allocator usable size/RSS is a separate metric.

| Owner / exact source | Requested storage and retirement |
| --- | --- |
| parser_table_open/build/clear_runtime/destroy | ParserHostTable allocation; states capacity * sizeof(ParserHostState); each contexts capacity * sizeof(FrontendContextPosition). Retained through table/cache borrowing, retired by clear_runtime/destroy, not when LR workers join. Root/match kind can identify world before first allocation. |
| lr_grammar_create/destroy/detach | LRGrammar; name objects/text, buckets, productions/rule metadata, symbols/symbol metadata/capture text, unresolved vector. Build borrows source entities; detach retires source indexes but name/capture snapshots survive with table. Account exact field capacities and objects, not borrowed entities again. |
| lr_analysis_create/destroy, lr_analysis_compute | LRAnalysis and nonterminal_count * sizeof(LRNonterminal), each FIRST range and production-index vector. Rules/symbols are borrowed grammar buffers. Lives through table construction, retired after contexts/runtime construction. |
| lr_analysis_work (lr_first_work) | nonterminal_count arrays of LRFirstResult, vector(usize), bool; dependents, frontier/next vectors; result FIRST vectors. FIRST vectors swap with analysis.nonterminals.first after join: charge follows actual buffer, not job object. Fixed task arrays are stack; job entity payloads/WorkGraph belong to world/shared framework accounting. |
| lr_items_create/destroy and lr_items_closure (lr_analysis) | LRItems plus values/pending vectors; closure temporary ranges, expanded sets, membership/expansion hash slots. Dynamic during closure, shared by serial and worker calls; no finite accurate size from only worker count. |
| lr_states_begin/create/destroy (lr_states), lr_states_create_work | LRStates; states pointer, pending and bucket vectors; each LRState, LRItems, symbols/edges/actions. Worker result vector holds new LRItems until deterministic interning; duplicate sets destroyed, accepted sets transferred into retained build states. Analysis pointer borrowed. |
| lr_kernel_closure, lr_states_lalr_work (lr_lalr/lr_work) | Cache pointer array plus item/needed arrays; each LRKernelClosure owns state.items, state.symbols and next LRItems/vector. Memoized only for one table build. Action result vectors move to states; link vectors retire after application. Ownership transfer cannot release bytes at join. |
| lr_propagation_create/destroy + lr_propagation_work | LRPropagation, count * LRPropagationNode, per-node ranges/edges, pending; parallel incoming/result vector arrays and changed array, target queue. Range buffers swap with graph nodes at publication; retire at graph destruction. |
| lr_runtime_create[_work]/destroy | LRRuntime plus rules/states/rows vectors, each unique LRRow actions/direct index, per-state gotos. Parallel results array/buckets are temporary; unique rows/gotos transfer to runtime, duplicate rows retire after interning. Runtime survives table build and all request borrows. |
| lr_runtime_specialize / lexer_table | Optional SymbolSequence + rule.count * SymbolRange and sequence_states; LexerTable alphabet/transitions/accepting vectors for DFA consumers. Must remain charged through final runtime/table destruction, including unsuccessful optional specialization allocations. |
| parser_request_create/recognizer_destroy; lr_parser/probe/completion | Request and error vectors, LRParser stack/evidence, LRProbe frames, LRCompletion base/follow, completion path temporaries; forest entities own references through common world. Runtime/table borrowed, never double count. Retirement on request failure/cancel/close after worker drain. |
| parser_stream_create/destroy | Stream plus subtype payload; UTF8 copied source capacity, error/buffered_error vectors; buffered node ownership transfers, but node bytes belong to world/entity accounting. Source/errors can survive across reads and request return. |

Contract requested: a small explicit shared world-owned allocation/reservation API usable by generic typed buffers and vectors, with checked count * sizeof(T), actual capacity growth, failure preserving old owner/storage, retained-owner transfer/swaps, and release only on physical retirement. Must distinguish owned buffer bytes (possibly including known compiler header) from world entity slabs, allocator/RSS overhead and outer-unit reservations; same bytes must not be counted twice. Low-level standalone LR callers with no compiler world need an explicit unlimited/null boundary, while compiler table constructors propagate world ownership through every derived object and worker job. No process-global/TLS owner or counter.

Known predispatch arrays can be charged exactly before allocation and launch. Closure/FIRST/range/hash growth is data-dependent, including worker-side allocation; A2 must define gated byte-only reservation on growth versus preadmitted bounded worker arenas. B1 will adopt the agreed API throughout the above objects, preserve bounded no-wait lane admission, and test denial at allocation/growth, transfer, retained table totals, cancellation/failure and exact zero after destruction. Merely adding a byte estimate to ParserAdmission would miss serial and retained buffers and does not complete this requirement.

Inventory refinement after reading exact low-level layouts: LRCompletion owns LRProbe `original` and embeds LRProbeBudget; each completion path owns a probe snapshot. It has no base/follow buffers. Also include regex_compile_tree's RegexLowering vectors (visits/values/patches/pending/characters) and Automaton state ranges plus automaton_compile's AutomatonWork/subsets/links/row/alphabet. These retire after token-table construction while LexerTable survives. Automaton currently repeats its 512-state storage limit in allocation/fill/add and fixed work arrays; derive the bound from a shared named semantic limit and actual extents when adopting its buffers, preserving the existing limit and diagnostics. Its finite limit is not a bound for LR state/item expansion.

## B1 focused handoff integration � 2026-11-22, current 8112320 working closure

Applied owner query observation ef0147df and aggregate v2 25e8f5ab, with all lifetime assertions and stdout0 retained. Applied focused selectors22ee/2d94, aggregate registration ec4e, and exact two address/equal diagnostic corrections3fe after independent rejection. Migrated Linux x64 reachability profiling to full standalone9f1c plus opt-in CMakef542; removed all four portable execution hooks. The README context differed, so preserved current scheduler/overlap text and inserted only the reviewed new section. Full patch check failure is not represented as an applied patch.

Public bootstrap smallest corrected query compile and 15-step native runner/compiler/standalone profile refresh pass (21.14s wall,41.17s user,6.82s system,404220KiB peak). Query-smoke and focused parser pass; parser output includes actual valid trace and bounded serial fault sweep. Focused capture-policy passes51.54s wall/52.72user/2.36system. New aggregate-capture matrix passes graph/fast,32/64-bit,Foundation and1/2/4/8 workers; combined aggregate-stages passes19.40s wall/19.74user/1.45system.

The broader known-binding run fails1 at forward initializer case `fn read():i32{return later;}var earlier=read();var later=7;print(comptime(later));`: compiler accepts a source whose fixture expects rejection. This is not an obsolete diagnostic-string mismatch. No source/oracle changed; original failure log retained (28.32s wall/28.90user/2.08system,315108KiB). Semantic owners notified. Full42 type-smoke is still active at this entry. Exact updated ASan fixture execution, fresh current-source WASI and final memory-contract adoption remain open; earlier sanitizer/browser receipts retain their old source identity.

## B1 current sanitizer and portable frontend receipt

The corrected42 lifecycle/type-smoke passes227.27s wall/232.53user/10.18system. Current18-step ASan instrumentation and links pass71.14s/90.92user/13.39system,844324KiB peak. Actual focused parser execution with ASAN_OPTIONS=detect_leaks=1:abort_on_error=1 passes0.11s (87804KiB), including valid tracing and every bounded failure prefix. Joint aggregate query serial/threaded32/64 passes0.46s (167620KiB). These are actual current-code instrumented executions; no serial allocator check is substituted for threaded coverage.

Fresh portable WASI public-bootstrap build12steps passes29.54s/58.36user/9.45system,915464KiB peak. Full IDE fixtures pass. Unchanged comptime_capture source succeeds with empty output; inference_alias_invalid rejects with Cannot infer type argument T; decltype_aggregate_operator rejects with Binary operators require scalar or pointer operands; aggregate_inferred_copy rejects with Expected Other, got Item. Fresh browser raw results at32/64 match eight independently executed native CLI observations. D1 owns browser oracle alignment; no shared browser fixture was edited. The new untracked observer is only an ignored browser ABI transport, with all input programs in Tower.

Exact wasm SHA8bcc91caea17791b89feb640b8372f7b95d6bca3ab52b4b0b7994eee595b32a2 (1549736bytes), public bootstrap9653f818, source parent8112320 plus patch80eab0be and source-file manifest670b146d. Complete resources/source/wasm/provenance/log archive B1/browser_current_receipt.tgz SHA438bceb6432f1f71706e5e215d2c3e204592e3325f929eefa433515fbc258b12. Existing old LLVM reactor was not used. This frontend receipt does not validate LLVM/Binaryen, browser worker transport, final generation or publication.

After the archive and jobs drained, adopted reviewed L1 edge tests d9827cd8: whole-empty capture with zero projections and exact immutable store/copy/fill messages. Smallest/public/native refresh, query and aggregate-stages pass; no production change. The saved browser snapshot intentionally predates these two fixture additions. Root contract review resolved the known forward-initializer mismatch as an obsolete negative oracle: optional evaluation preserves runtime order; demanded early capture must still reject. D1 owns exact original stdout7, strengthened0/7/7 and demanded-negative fixtures; no production rejection is added and original failed log remains retained. Concrete test patch still pending.

Remaining implementation: explicit world-owned memory accounting/admission for parser/LR/lexer temporary and retained buffers, using A2's agreed shared API; current ParserAdmission bounds lanes only. Final coherent memory/race/stress, clean public/bootstrap/generation/browser/backend publication evidence remains open. No publication lease has been requested and no asset has been published.

## Current memory adoption and bootstrap boundary, 2026-11-23

This entry supersedes older pending-test and known-order classifications above.
Checkpoint `60d9b24` contains the focused capture, parser, type, ASan and portable
browser results recorded above. Its tree remains `04839111` after the required
merge-preserving pull. Current memory changes are subsequent, uncommitted inputs;
the earlier sanitizer/browser receipts do not validate their layouts.

The earlier raw forward-initializer observation is not a portable correctness
oracle: Foundation permits uninitialized raw storage, whose read result is
undefined (`docs/foundation.md`, raw memory and initialization contracts). Graph
0/7/7 versus normalized 7/7/7 remains an engine-specific observation, not a proved
compiler defect. Root withdrew that classification. D1 owns an exact admission
case, demanded-before-initialization rejection and a fully initialized state/effect
comparison expecting 1/1/7. No zero-initialization policy or semantic workaround
was introduced; failed logs remain preserved.

| Reviewed path or dependency | Current ownership, evidence and disposition |
| --- | --- |
| `compiler/parser_table_types.tower`, `compiler/parser_table.tower` | Table object, state vector and each context vector retain physical WorkBuffer/WorkVector receipts. Budget derives explicitly from root or match-kind world, must outlive cached tables, and is released only on storage retirement. New type-only imports avoid pulling allocator implementation through shared layouts. |
| `tests/parser_table_budget.tower` (new) | Fills remaining ledger capacity to deny table creation and growth, verifies partial cleanup, releases capacity and retries, checks retained direct-owner subtotal/reuse and exact retirement. Public predecessor smallest compile and first-slice focused parser pass. This is a direct table/context subtotal, not the whole compiler heap. |
| `compiler/lr_runtime.tower`, `compiler/lr_runtime_work.tower`, `compiler/lexer_table.tower` | Subsequent implementation draft accounts runtime/row objects, actions, direct indexes, gotos, rules/states, row pointers, specialization sequence/ranges and result/bucket scratch. Workers carry the immutable budget pointer; dedup retires discarded rows; goto publication moves the complete receipt. Standalone construction explicitly accepts null budget. Smallest runtime unit compiles; joined runtime checks pending bootstrap aggregate repair. Other lexer, grammar, analysis and request storage remains unconverted. |
| `tests/lr_budget.tower` | Lane-saturation fixture now explicitly allows byte storage while retaining saturated/partial-lane and final zero-byte assertions; actual byte denial is a separate bounded fixture. Zero never means unlimited. Real overlap uses production transport, independently of serial fault injection. |
| `compiler/units/parser_frontend.tower`, `compiler/units/source_emitters.tower` (new) | Reviewed minimal compilation boundary: C/Roku emitters already expose source_emitter_api and share private helpers only with each other. Move their two imports into one separate unit, without changing implementation or signatures. Public predecessor compilation and D1 build registration still pending at this entry. |
| A2 WorkBuffer/WorkVector v3, L1 type split, B2 memory helpers | Reviewed shared dependencies, not a full audit of other owners' scope. Exact allocator-header size/alignment comes from the host contract. Full replacement storage is reserved before allocation, old storage survives denial, and physical free precedes grant release. Type split preserves one nominal definition and allocation-free borrowed iteration hooks. |

Assigned/discovered coverage is now 174 reviewed repository paths: the previous
173 plus `parser_table_budget.tower`. The source-emitter unit was an experimental
candidate, subsequently moved to ignored build storage when no split was needed.
New shared library
dependencies are listed separately rather than claimed as owned audit coverage.

First-slice native dependent build passes 35.04s wall/111.53s user/16.87s system,
839124KiB peak; focused parser including the new budget fixture passes 0.02s.
Initial missing private import and removed compiler_buffer_free declaration
failures were preserved and corrected with explicit imports and the existing ABI
declaration. The source export is `parser_table_memory_slice.patch`, SHA9e4d5f50.

Matched before/table-slice packages use the same complete resources, 118962-byte
canonical input SHA6f2571a1 and checked three-line result, jobs1, two warm pairs
after warmup under B2 quiet coordination. Before SHA4713e89f: wall1.85/2.00s,
user1.68/1.84, system0.10/0.09, RSS213952/213500KiB. After SHA98c4ad23:
wall1.84/1.82s, user1.68/1.66, system0.09/0.09, RSS214908/214652KiB. All six
processes and comparisons pass. These samples establish neither a speedup nor a
latency regression; peak RSS rises about1MiB. Crucially, CLI interpretation does
not bind the frontend-units budget, so this measures storage implementation cost,
not shared-gate contention. Bound caller performance remains required. A2's
synthetic per-buffer ledger contention is a separate known concern.

Second-slice smallest runtime compilation passes3.78s, but the combined parser
hits the published predecessor's65536-node expansion limit. Removing module
fixtures alone, removing all fixtures, and applying the shared type split do not
resolve the cap. Logs retain each failure. No private compiler, raised limit or
duplicate-export linker workaround was used. Separate source emitters through
their existing ABI is the current minimal candidate; build ownership is D1.

Actual retained memory accounting is still partial. Final joined native, bound
serial/parallel measurements, supported sanitizers, canonical bootstrap/browser
generation and coordinated atomic publication remain mandatory. Documentation
updates themselves have no runtime or memory performance effect.

Subsequent bootstrap result: separate emitters alone and the shared growth helper
alone still fail the aggregate expansion cap. Root authorized B1's extraction of
the non-generic growth policy into WorkBuffer; typed WorkVector keeps its exact
validation/no-growth ordering and publishes only on success. The frozen runtime
result count now uses one exactly sized WorkBuffer, matching the old fixed array
allocation instead of introducing an unnecessary vector specialization and spare
capacity. Together these changes compile the FULL ORIGINAL parser_modules_work,
including source emitters, with the public predecessor:16.93wall/13.98user/2.15sys.
The emitter manifest is restored and no build registration change is required.
Helper export SHAae819791 is incremental after the shared type/import handoffs.
Existing normal buffer, real-four-thread shared-buffer and serial allocator-fault
fixtures each pass stdout0/exit0. Final joined compiler tests are still pending.

`tests/lexer_table.tower` now checks symbol-sequence object/range budget boundaries,
exact retained bytes, failure cleanup, retirement and zero-length range storage.
The existing150 random NFA and500 DFA/reference cases also pass in0.01s. An initial
raw-array foreach attempt was rejected: the published nominal iteration protocol
does not apply to raw arrays. The corrected counted loop derives its bound from
the actual array extent. `tests/lr_budget.tower` adds a retained-byte lower-bound
denial, worker join/cleanup and retry check; its smallest public compile passes,
but it has not yet executed in the joined native runner at this entry.

B2 snapshot c654/joint6e961 and backend retention93b9 are source-integrated after
review. Input subtotals remain exact while whole-ledger tests include retained
parser ownership and a finite compilation allowance. Smallest frontend-units
compile passes; its joined native/fault checks remain pending. D2 direct nominal
type imports a4eb are preserved. A2 arena v4 is reviewed in staging only; live
parser callers do not yet use arenas or claim their contention benefits.

### Current runtime slice and measured deduplication checkpoint

The complete original parser aggregate and dependent native build now pass
(62 steps, 52.32s wall, 154.99s user, 23.46s system, 840008KiB peak RSS).
Focused parser, production-transport LR and joint frontend-unit checks pass in
0.03s, 1.80s and 18.58s respectively. The new retained-budget denial/join/retry
fixture executes in the production LR check. This supersedes the pending runtime
statements above for these exact inputs; accounting remains partial.

`lr_runtime_work.tower` previously built a direct lookup index on every private
row before deduplication. The serial constructor builds indexes only for retained
unique rows. Hashing/equality inspect actions, so the parallel coordinator now
builds the index only when publishing a unique row. A failing index remains owned
by the unpublished result and is retired by existing cleanup. Worker action and
goto construction remain private, and publication order/conflicts are unchanged.

The existing `lr_state_benchmark.tower` has an optional `runtime` mode, using a
finite synchronized world budget and the production allocator/transport. It
compares every action and goto with a serial reference outside the measured
interval, reports physical charged peak/retention and ledger storage, and checks
exact release after each table. Input grammar preparation is outside timing.
Small input has 50 states and 128 table constructions per interval; wide input
has 1538 states and one construction. Each of three alternating process pairs
per case/width contains three warmups and fifteen measured intervals.

| Input / requested workers | Before median wall / CPU ms | After median wall / CPU ms | Before / after charged peak bytes |
| --- | --- | --- | --- |
| Small / 1 | 1.948825 / 2.016332 | 1.907413 / 1.974477 | 32968 / 32968 |
| Small / 4 | 1.918748 / 1.986255 | 1.917170 / 1.980806 | 32968 / 32968 |
| Wide / 1 | 3.500081 / 3.501519 | 3.520029 / 3.521397 | 988312 / 988312 |
| Wide / 4 | 4.688037 / 7.776873 | 3.769639 / 5.982793 | 16058704 / 7571824 |

Wide/four-worker charged retention stays 952592 bytes and ledger storage falls
327680 to 163840 bytes. Peak process RSS medians are 193404/192116KiB; the input
grammar dominates RSS. Wide serial retention is 956672 bytes, with RSS medians
192364/192484KiB. Small RSS medians span 48860–49556KiB. Small requested-four uses
the serial fast path, with one admitted lane. Wide admits four lanes; admission
alone is not physical-overlap proof. CPU greater than wall supports overlap, and
the separate production transport/control-barrier checks pass. The benchmark
does not identify each worker thread. Four-worker latency improves about 19.6%
and charged peak about 52.8%, but remains about 7% slower than serial. There is
no profitable parallel-scaling claim for this input.

Frozen before executable SHA256 d1b27b0398d28d06c6ec8ec78e4fa51f8aea74015881c79519d0fc3c7a2b3cdd;
after b0b0589abd002c6e285d5525e2fa99765717f9c97567bdb7a2e7ea3d1ef6da94;
shared profile object e9d1cfeeef7139db723abddb0f81026c86ce53d3ae0a2a56b52410b3552ce62f.
All 24 child processes and independent comparisons pass. The actual interval
2026-11-23T01:12:56.2247554Z–01:13:02.2480343Z is inside the fresh sibling quiet
lease. An earlier late-start lease claim was withdrawn; sibling idle confirmation
is recorded separately and those runs are not substituted for these paired runs.

Current ASan/LSan instrumentation passes serial allocation-failure checks
(9.29s, 772160KiB), parser checks (0.11s, 87936KiB) and production LR
(21.20s wall, 26.78s user, 1.67s system, 850176KiB). The corrected defined-order
known-value gate passes natively in 50.44s. Thread instrumentation is rebuilding
at this entry. Earlier browser evidence is not evidence for these new layouts.
The shared-helper pre-change aggregate still exceeds the public expansion cap,
so no matched full-compiler helper-only timing claim is available. Additional
action preallocation is only a proposal: input actions can contain duplicates,
so reserving their count may increase retained capacity and alter bounded-memory
admission. It is not included in this checkpoint.

The current thread-instrumented dependent refresh also passes:71 steps,
69.67s wall/186.72s user/25.75s system/839360KiB peak RSS. Allocation-failure
and parser checks pass, followed by three production LR stress passes with
halt_on_error=1 and no TSan report. Each uses the same image06e0a5e3, CPUs0–11,
24GiB limit and no network; the sanitizer runtime requires the previously
documented container-local seccomp=unconfined setting. Container-inclusive
elapsed seconds are22.041/0.386 for allocation/parser and52.053/53.496/54.592
for LR; these include container startup and are not compiler performance samples.
ASan/LSan and TSan instrument Tower LLVM IR. No supported Tower arithmetic-UB
instrumentation is available in this configuration; native boundary checks are
not substituted for it. Passing stress runs do not establish universal race
freedom. All owned instrumentation children have drained.

### Joined history and next grammar-owner slice

Committed checkpoint8ee486cd contains the preceding memory/index changes. Merge
d1a23181 joins root1fec1b91, including the newer interpreter resource-failure ABI,
backend target owner, unique-module cache traversal and shared arena library.
Ten conflict paths were resolved preserving the newer owner contracts and B1's
growth helper. The54-step public native build passes53.79s/847300KiB. Query smoke
passes32/64-bit serial/worker input-storage and continuation checks; production LR,
frontend units18.81s/735464KiB, serial parser/allocation checks, storage/clone and
all four normal/shared buffer/arena tests pass. Prior sanitizer receipts remain
scoped to8ee; they do not validate this newer interpreter layout. Root3915 differs
from d1a's production/build inputs only in three comments; its three unregistered
measurement/allocator fixtures are additional unexecuted inputs.

The next grammar regression reproduces an unaccounted owner: with only the table
descriptor's physical bytes available, parser_table_open still creates its full
grammar. The baseline fixture exits1 at that assertion; its two-step build passes.
The new fixture additionally denies one byte below observed grammar retention,
checks no incomplete grammar escapes, retires partial owners and retries after
the competitor releases capacity. This is ordinary valid-input denial coverage,
not an intentional invalid-memory probe.

`lr_grammar.tower` now has a draft explicit root-world budget and physical object,
column and scratch owners. Rule and metadata counts are known from source children
plus the augmented start rule, so exact WorkBuffers replace unnecessary growing
vectors; count/overflow checks derive from record sizes. Name objects and immutable
name/capture snapshots share the validated WorkArena because they have one common
retirement boundary. The initial chunk derives from its descriptor and the shared
initial-element count times the name-record size; larger strings use checked
oversized chunks. The arena keeps string/record addresses stable. Hash/name order
and source declaration order remain derived indexes, not another semantic graph.

The first version used per-string buffers and inline name records; its aggregate
hit the public65536 expansion cap after the leaf compiled. That draft was revised,
not published. The exact-column retry and subsequent arena retry both stop at an
old frontend_table direct-field read; they have not demonstrated a second cap
failure. The initial status misattributed the former and was corrected. B2 is
coordinating the small conversion to existing grammar getters. The owned lr_tree
consumer now uses the existing generated-rule getter. No compiler cap, private
bootstrap or duplicate semantic implementation was introduced. Joined grammar
execution, profile and instrumentation remain pending at this entry.

Follow-on: root and B2 approved the narrow frontend_table getter conversion,
preserving name order and the first nonnull rule anchor. Adopted A2 arena boundary
819a9542/API archive2f16b385: the existing entities unit is the sole provider;
grammar imports declarations. llvm-nm finds exactly six arena definitions in
entities and none in parser. The smallest consumer passes15.05s/664196KiB; the
original aggregate/dependents pass7steps/24.38s/727224KiB, without a cap increase
or unit split. Sequence and captured-reference denial/cleanup/retry tests pass,
as do production LR/units, serial allocation failures and storage/clone checks.

The existing production frontend profile compares frozen beforeed857ed7 and
after46d30e30, identical resources, three units, zero or4096 extra bodies in the
last unit, and worker budgets1/4. Two alternating process pairs per case yield
16 successful processes. Timing includes batch creation, source snapshots and
compilation; reference execution and canonical hashing follow the interval.
Every canonical hash, entity/component count and independent42 result matches.
Every four-lane sample observes three distinct overlapping outer workers and
peak admitted lanes4; one-lane samples stay serial.

| Input / workers | Before wall / CPU seconds (range) | After wall / CPU seconds (range) | Before / after peak RSS KiB (range) |
| --- | --- | --- | --- |
| Small / 1 | 3.411559–3.432264 / 3.243760–3.266995 | 3.421340–3.478655 / 3.255160–3.308117 | 199104–199640 / 197692–197868 |
| Large / 1 | 4.535504–4.545909 / 4.365581–4.376456 | 4.600234–4.628534 / 4.429256–4.454459 | 677444–678012 / 675832–676444 |
| Small / 4 | 1.325823–1.343398 / 3.982712–4.048929 | 1.338657–1.361540 / 4.030496–4.080726 | 460440–468156 / 457640–464268 |
| Large / 4 | 2.154542–2.161957 / 5.323682–5.364996 | 2.175718–2.179791 / 5.401341–5.403821 | 941824–942976 / 937160–939004 |

The sample suggests roughly1–2% time cost for added physical accounting. Newly
tracked retention is exactly282912 bytes in every case; that is previously
unaccounted storage, not an equivalent increase in physical memory. One-lane
charged peak rises4044048 bytes; four-lane peak about11.3–11.6MB, depending on
overlap. Ledger storage stays5MiB/20MiB. RSS generally decreases, with overlapping
small/four-worker ranges. Additional operations are gated grants on new owners
and growth; arena snapshots remove separate name/string allocations. Two pairs
do not establish a general speed or memory improvement. Profitable between-unit
overlap is observed here; no new within-unit/all-core claim follows.

Accepted quiet interval2026-11-23T01:44:31.0101531Z–01:45:20.8570022Z starts61ms
after the fresh120-second grant. The watcher releases after all16 children drain;
binaries and inputs stay frozen. Raw JSON/time files are under
/cache/parser_memory_profile/grammar/results. Current ASan/LSan refresh includes
the joined interpreter ABI and new grammar/provider owners; execution and TSan
remain pending at this entry, distinct from8ee evidence.

Current instrumentation now passes. ASan/LSan74-step build100.87s/847688KiB;
parser0.11s/88960KiB, serial allocations8.34s/771920KiB, query0.57s/223548KiB,
productionLR19.79s/853304KiB and actual three-worker frontend9.62s/1107132KiB
all exit0 with leak detection/abort enabled. The frontend oracle and canonical
hash match; its shorter resource-root string explains the29-byte input receipt
difference from the frozen measurement path.

TSan74-step build62.86s/842676KiB also passes, followed by parser, query, real LR
and two outer-frontend stress runs. Each outer run observes three overlapping
threads, peak lanes4, the same exact output/hash/counts and5672070 retained bytes.
Measured instrumented frontend intervals are24.869/24.929s, process CPU79.493/
79.863s and peak RSS1436828/1426976KiB; these are instrumentation receipts, not
performance samples. Container-inclusive elapsed is0.470/1.353/47.368s for
parser/query/LR and25.464/25.532s for the outer runs. Same image/CPU/memory limits,
no network and the documented sanitizer-only seccomp setting; no TSan report.
All children drain before further changes. Arithmetic-UB, browser sanitizers and
universal race-freedom claims remain unsupported. Portable frontend validation
is the next host-layout check, not completed publication.

Portable frontend follow-up: the public bootstrap/WASI SDK34 build passes all28
steps (44.65wall/88.01user/13.99system seconds,920828KiB peak RSS). Current
build/browser-wasi/tower.wasm is1593977 bytes, SHA256
9ffa385cce88915ef844081b0bbfab60d4fd6ff7dfc55fd5b45f4c352e914893.
Full existing Tower IDE fixtures pass; a confirmation invocation has captured
exit0 in grammar_memory_wasi_ide_confirm.log. Existing browser ABI observation
transport also exits0: at both target pointer widths4/8, comptime_capture
completes with empty output; inference_alias_invalid rejects at146 with Cannot
infer type argument 'T'; decltype_aggregate_operator rejects at95 with Binary
operators require scalar or pointer operands; aggregate_inferred_copy rejects
at103 with Expected Other, got Item. Raw diagnostics remain in
build/ecs_b1/logs/grammar_memory_wasi_observe.log. This is portable32-bit-host
frontend/IDE coverage of this grammar/provider slice and joined1fec ABI, not
new LLVM backend, threaded-browser, public-clone-v2 or release acceptance.
The existing LLVM Wasm asset was deliberately not used as current evidence.
All owned children are drained; next is the source checkpoint and coordinated
root6b8355 clone/caller union. Remaining LR analysis/state/automata/request
storage and shared world/store/constructor accounting stay explicitly open.

B1 current control storage implementation: LRParser owns its physical object,
frame WorkVector and sequence byte evidence. LRProbe and LRCompletion own their
objects; concrete probe-frame and bounded completion-path views use WorkBuffer's
shared checked element-growth helper, with capacity derived from buffer bytes
and element type. There is no independent allocator or growth policy. Runtime
and its physical ledger outlive all readers. Probe operation quotas remain
separate; allocation denial marks incomplete. Named policy variables preserve
existing128/8192/65536/512 limits, and EOF uses the shared token sentinel.

The initial all-WorkVector candidate and provider-only retry hit the public
65536 expansion cap. A concrete completion-path buffer moves the failure later
to dispatch; the concrete probe-frame view clears it. The original aggregate
and dependent executables now pass5steps,18.66wall/14.61user/2.39system seconds.
No compiler cap change, private bootstrap, second provider or new unit. Existing
compiler_work export definitions remain in the established entities provider.

New parser_table_budget checks reproduce old unaccounted control creation under
an exhausted world ledger, then pass after this implementation. They cover full
and one-byte-below-retention denial, initial-frame cleanup, probe clone denial,
probe growth/incomplete/retry without real-parser mutation, completion creation
and query denial/retry, ordinary LR frame growth and finite-sequence evidence
growth with unchanged uncommitted state, exact final ledger/allocator retirement.
Input lengths come from actual strings; no duplicated array bound. These are
serial deterministic allocation-denial checks, not threaded sanitization.
Current production LR, frontend units, query-smoke, editor, serial allocation
failures and full module/cache tests pass. All children drain. Existing reference
control/sequence and completion suffix checks remain active in the parser suite.
The prior corrected clone-union storage test also passes0.26s/97076KiB and module
suite0.06s/54420KiB; the original missing-argument abort remains preserved.

Frozen frontend profile before85649b4320ca311f40d98fba2ef760b796fac8c13c1cea17b0750d1f8fbbb2b9
comes from70239e41. Current after executable and identical resources are frozen
under /cache/parser_memory_profile/control. Matched profiling and current
supported sanitizer/WASI evidence are pending at this entry. The broader FIRST,
items/states/propagation, requests/streams/forest and world/store/page ownership
work remains open; this control slice is not full memory or release acceptance.

Control caller audit found syntax_next dereferencing an unchecked recognizer.
Added stream/recognizer guards, then a typed resource outcome requested by B2:
LR control constructors preserve per-call WorkBudgetError, commit growth latches
its exact error, request failures expose it, and SyntaxSession retains it through
syntax_session_resource_error until reset. Grammar/table construction now uses
result constructors, preserves exact WorkBuffer/WorkVector/arena denial, and
carries it through ParserHostTable, parser_table_finish_result and
SyntaxVersionDiagnostic into the session. Missing names/conflicts remain
ordinary grammar diagnostics. Legacy FIRST/state/runtime boolean construction
failures retain a coarse Memory classification when no precise buffer result is
available; their finer per-phase allocation/dispatch outcomes remain open.
No reader consults the shared ledger's mutable last-error field or classifies
diagnostic strings. Version validation/lexical/replacement resource outcomes
outside this table path are not claimed fully typed by this slice.

The first session retry fixture used raw `base` without a language import; after
fixing setup it correctly reports the established language-import diagnostic.
Use the existing positive `import shared; hello` fixture, without weakening the
allocation denial, cleanup or retry assertions. Both grammar setup denied before
session construction and later LR control denial are exercised. An incomplete
`import ;` after reset must remain an ordinary syntax error with no resource tag.

A separate real test-helper bug explains the earlier nondeterministic baseline
failure. world_session_prepare passed length-delimited FormatResult.text to the
NUL-terminated baseline API. FormatResult never supplies that terminator; the
production host explicitly does. Native trace read garbage beyond the formatted
seed; ASan confirms a one-byte heap-buffer-overflow at the end of its3520-byte
allocation, syntax_text_length -> syntax_baseline_install -> world_session_install
-> world_session_prepare -> parser_session_budget_test. Allocation originates in
bytes_append/format_write/format_entity. Logcontrol_memory_typed_address_parser
retains the full report and exit134. This is an ordinary valid-input regression,
not an intentional invalid-memory sensitivity probe. B2 explicitly approved the
narrow helper fix: direct vector import and checked push of the NUL terminator.
The provisional typed-ABI-corruption hypothesis is rejected by this evidence.
Temporary Tower tracing is removed after draining. Failed trace builds (imports
after declarations, unavailable tower_print transport) remain preserved too.

Smallest typed parser_state passes15.25s/669696KiB and syntax_version_build
15.23s/669860KiB. The prior typed-control aggregate passes10steps22.88s but its
runtime failed in that unterminated helper; no pass is claimed. The complete
current table/version/session closure and corrected fixture await aggregate and
runtime checks. Earlier ASan/control results and frozen after profile executable
are superseded for validation by these new inputs; no quiet timing has run.

B1 control resource checkpoint, 2026-11-23 02:51 UTC (implementation and evidence):
The complete typed grammar/table/version/session/recognizer closure now passes
the public predecessor's original aggregate and dependent native build:16 steps,
26.53 s wall,64.66 s user,9.41 s system,842056 KiB peak RSS. Compiler input edits
were freshly materialized; the build log records regeneration of the affected
parser, template, syntax-host, live/format, frontend and semantics objects.
The focused parser test passes with both denied grammar construction and denied
LR control creation, exact typed Capacity, cleanup, successful same-session
retry with the existing valid imported grammar, and ordinary syntax rejection
without a resource tag. Source/helper NUL fix is included in these results.

The following current native checks also pass, each with exit0: query-smoke
0.09 s/61444 KiB; LR1.81 s/115924 KiB; production frontend units18.94 s/805904 KiB;
editor6.15 s/970368 KiB; serial allocation failures1.17 s/170576 KiB; full module
cache/session checks0.06 s/54312 KiB. Their logs are
build/ecs_b1/logs/control_memory_full_typed_{parser,query-smoke,lr,units,editor,
allocations,modules}.log. These are functional checks, not quiet performance
measurements. The sequential orchestration reached its final executable-copy
step only after all checks exited0. Frozen current after-profile executable
SHA256 b1e34f4b859726181aa9b855aea97c8c52e1bcf77d24ed80ecd16ef311ca6def
supersedes the earlier partial-control after executable.

Whole source closure handed to B2/root as B1/control_memory_typed_slice.patch,
SHA25665074438f9f574f3b7f9de764d95d2716329b5e238d65757acd2ad1661809464,
18 code/test paths relative to70239e41; reverse applicability passes. The new
SyntaxSession, SyntaxVersionDiagnostic and ParserHostTable layouts require all
consumers to rebuild together. Copying only the getter is not valid adoption.
B2 owns the completion/inspection consumer and independent denial reproduction.
Current ASan revalidation of the actual helper overread, TSan, 32-bit WASI and
paired performance remain pending. Earlier instrumented passes predate these
changes and are not current acceptance. Full lane/release completion remains open.

B1 control ownership paired measurement, 2026-11-23 02:54 UTC:
Timing ran entirely inside the fresh sibling quiet lease: grant02:51:57.8988944Z,
automatic launch02:51:58.0146563Z, all16 processes drained with exit0 and release
02:52:48.7506702Z. No competing B1 build ran; B2 explicitly stayed source-only.
Two alternating before/after pairs used identical archived70239e41 resources,
three units, requested workers1/4 and small0/large4096 generated bodies. Every
fresh process checks its Tower execution oracle and exact canonical output;
paired hashes, entity/component counts and expected real outer overlap match.
Before executable85649b43, afterb1e34f4b (full SHA receipts above). Public pinned
Linux x64 bootstrap, Release/native Clang19.1.1, Ryzen AI MAX+395, container
CPU0-11/24GiB, warm filesystem/fresh worlds. Raw JSON and GNU time receipts:
build/ecs_b1/cache/parser_memory_profile/control/results. No LLVM backend work.

Mean measured frontend intervals over the two samples (milliseconds):

| bodies | workers | before wall / CPU | after wall / CPU |
| --- | --- | --- | --- |
| 0 | 1 | 3573.02 / 3370.21 | 3458.46 / 3258.92 |
| 4096 | 1 | 4727.52 / 4526.59 | 4546.42 / 4345.42 |
| 0 | 4 | 1382.51 / 4154.87 | 1365.02 / 4076.31 |
| 4096 | 4 | 2204.95 / 5522.06 | 2202.14 / 5426.13 |

After requested4 observes three concurrent outer units, not just admission.
After serial/parallel wall ratios are2.53x small and2.06x large; CPU is higher
with parallel scheduling. Outer interval coverage is99.1%/73.7% of three-lane
wall capacity; the large remainder includes coordinator/other work, so this is
not a direct measured worker-idle or contention attribution. No isolated shared
ledger-contention conclusion is justified. Two samples indicate no regression
for this closure; serial reduction3.2%/3.8% and parallel1.3%/0.1% are observations,
not a general speedup claim or independently attributed optimization.

Peak process RSS before->after ranges (KiB): small serial197476-198156 ->
197592-197804; large serial675616-676368 ->675840-676484; small parallel
461120-462856 ->456200-461304; large parallel938128-938832 ->930172-938532.
Final retained ownership grows72 bytes per batch (new typed diagnostic fields);
tracked serial peaks grow592 bytes, small62893338->62893930 and large
63240388->63240980. Parallel peak variation overlaps: small175923450 before,
175925082-176057058 after; large176197124-176850244 before,
176272132-176769004 after. Ledger metadata remains5242880 serial and20971520
parallel. New ephemeral parser/probe receipts do not imply these high-water
batch values isolate their total allocation traffic. Final buffers retire via
the unchanged profile/fixture cleanup oracles. Whole parser/store accounting is
still incomplete; this measurement does not establish all memory is charged.

B1 current ASan/LSan validation, 2026-11-23 02:57 UTC:
All owned children drained with exit0. Public-bootstrap dependent rebuild27steps
passes81.81 s wall/134.54 user/19.04 system,848536 KiB RSS. Actual generated Tower
LLVM IR is instrumented; ASAN_OPTIONS=detect_leaks=1:abort_on_error=1. Current
parser0.23 s/137056 KiB, serial allocation failures8.55 s/771236 KiB,
query-smoke0.59 s/225632 KiB, native editor44.30 s/1169096 KiB, and actual3-outer
unit run9.88 s whole-process/1119888 KiB all pass without ASan/LSan findings.
The same focused parser suite exercises the valid-input world_session_prepare
path that previously produced the3520-byte-end overread; the checked terminator
fix is now validated. The original failure log remains preserved, not relabeled.

Outer Tower interval9.522801167 s wall/30.595822 s CPU, actual outer_peak3,
canonical1173729914654460811,48240 entities/55014 components, retained5672113,
peak charged175925041 and ledger20971520 bytes. This uses current live resources,
not the archived paired-profile resource set, and is instrumentation evidence,
not a performance comparison. Serial fault allocation checks do not establish
threaded allocator sanitization. System LLVM/native dependencies are not covered
by Tower IR instrumentation. Arithmetic UBSan and browser sanitizers are not
implemented in this build. Current TSan dependent build/stress is running; WASI
ABI/IDE validation remains pending. No source edits during either frozen run.

B1 TSan transport correction, 2026-11-23 02:58 UTC:
Current public predecessor TSan dependency build passes74steps,63.50 s wall,
162.99 user/24.90 system,844604 KiB RSS. First ephemeral runtime launch exits127
because immutable base image lacks /usr/bin/time (persistent build container
has it). Preserved control_memory_full_typed_thread_parser.log; no test executed.
An inline PowerShell/bash TIMEFORMAT retry exits0 but produces no expected logs:
nested native-argument quoting truncated its command, so it is INVALID execution
evidence and no test pass. Replaced only OS transport with an ignored shell
script using Bash builtin time, fail-fast commands and a final receipt. Current
parser/query/two outer stress processes run sequentially in that script, same
image/CPU/memory, no network and the established seccomp=unconfined TSan startup
capability. Production source/executables unchanged; no build repeated.

B1 current TSan and independent caller evidence, 2026-11-23 03:00 UTC:
Corrected script ran all intended children and emitted its final success receipt;
Docker exit0. Parser0.296 s wall/0.190 user/0.083 system, query-smoke1.081 s/
0.973 user/0.143 system. Two real three-unit/four-lane stress invocations report
Tower wall intervals24.649611475/25.209104369 s, CPU78.773743/80.329524 s,
peak RSS1430576/1426960 KiB, actual outer_peak3, identical canonical hash
1173729914654460811 and48240/55014 entity/component counts. Both retain5672113
bytes, peak charged175925041/175368257, ledger20971520. Bash whole-process
wall24.977/25.566 s. No TSan report. Logs usecontrol_memory_full_typed_thread_run_;
the earlier missing-time launch and ineffective inline invocation remain failures
of execution evidence, not overwritten passes. Instrumentation covers generated
Tower IR with production workers; this does not prove universal race freedom or
instrument system LLVM/browser/unsupported arithmetic-UB behavior.

Independent B2 receipt02:58:52 confirms unchanged L2 fixture8178 passes after the
whole650744 producer closure plus613ed consumer: target widths4/8 and requested
workers1/4 require null inspection on budget denial, preserved-cache recovery,
and exact zero grant/lane/live/world cleanup. Its prior134 failure is retained.
B2 also reports full17-target public ABI rebuild and native parser/cache/editor
passes; this is B2's separate source/binary identity, not a claim that B1 locally
ran its new completion consumer. Root received that exact evidence at02:57:48.
Current local WASI build/IDE checks are running. The complete history export will
follow this frozen checkpoint before broader grammar/probe error work begins.

B1 current WASI checkpoint, 2026-11-23 03:01 UTC:
Public documented build-wasm.sh with IDE_TESTS=ON and four compiler jobs passes
28steps,55.03 s wall/112.53 user/16.43 system,920800 KiB RSS. Compiler remains
checked-in bootstrap9653f8187a104ca84ab5d8601f336d7e1ed8200206544c70a81415018d623d02;
no private override or raised expansion cap. Current reactor1602131 bytes,
SHA256528202ce9ef60f61b7d1f586ecd36484524b316d466197370fffdfa519d50c33.
Node test-ide.mjs executes the actual Tower assertions and exits0 with final
Tower IDE fixtures passed receipt. The existing raw ABI observer also exits0:
both32/64 target descriptions return empty success for comptime_capture and the
expected inference-T146, nonscalar-operator95 and Item-to-Other103 rejections.
These observations agree with existing fixture oracles; raw transport success
alone is not their semantic oracle. Logs control_memory_full_typed_wasi_*.

All owned current jobs are drained. This checkpoint covers native/parser/editor,
independent B2 inspection reproduction, paired performance, generated Tower IR
ASan/LSan+TSan and frontend-only serial WASI. It does not cover final merged
root0c8 publication inputs, LLVM browser backends, threaded-browser transport,
portable release/bootstrap generations or hosted deployment. No publication
lease is held. Next: export committed full history, merge coherent root source
without discarding newer owned paths, then complete early grammar and probe
resource typing with producer diagnostics; broader memory ownership remains open.

B1 next grammar-result work, 2026-11-23 03:12 UTC (proposal/implementation split):
Full history175d2a3/tree240dec50 was exported after all owned checks drained;
B1_main_control_resource.bundle SHA0054f5b2808690fbc6b10d10bc35a76d6e66c8b3b0243aa5b0552fac53aff9c8,
sole published60741 prerequisite, verified after a clean identity-preserving
pull. B1_control_receipt_175d2a3.tgz SHA4aee27b4359d4604849dfe214e1cf7bd43c55be89d740b84881b3598d823892a
contains exact current reactor/resources/provenance and raw logs/profiles.

Merged verified root0c8 source union as e417e944702aa9ad96c7a9f133755dbf96ce0de6,
treebbeea2af36107d0ea39afd5e4968a768db96658b. README conflict retained root's
relocated B1 runtime paragraph and all new hooks exactly once. Journal automatic
merge reordered18k lines; retain root's complete journal,14 absent historical
B1 integration lines and exact285 new175d lines. Every prior nonblank line is
present; no history discarded. Owned175d source paths remain byte-identical.
Clean merge-aware pull preserves identity. New public51-step native build passes
49.37wall/145.53user/21.28system seconds,845840 KiB RSS. Current query-smoke0.10s,
parser0.04s, editor6.27s, serial ledger fault and separate arena linkage (<0.01s),
module/cache0.06s all pass and drain. New Publish/resource hooks are included in
query-smoke. This merged source has not inherited earlier sanitizer/WASI receipt
identity; those remain175d evidence. C free134.97GB decimal at03:04.

Before broader result propagation, freeze current public native profile binary
e7418959e746b4051f9d2925759150f98d5fc40815930f51d522bb32fc8a0428 and exact e417
resources under/cache/parser_memory_profile/grammar_errors. No paired new timing
yet. Root03:08 and B2 authorize strengthening existing frontend_syntax_version
construction/cache failure sweeps and retaining ordinary grammar diagnostics.
Added null-if-resource-error checks, None on pending/unproductive diagnostics;
optional successful uncached versions remain accepted. Allocation iteration
bounds already derive from actual successful calls. Touched array bounds now
use sizeof(decltype(rules))/sizeof(SyntaxRuleView), names/text use their lengths.
First leaf fails because sizeof expects a type, not an expression; second lacks
an explicit strlen declaration. Both logs preserved, corrected using existing
supported decltype syntax and a direct standard boundary declaration. Corrected
leaf passes5.03s/251476 KiB. Full current frontend entry then reproduces the new
oracle failure in0.05s: Valid grammar construction distinguishes resource denial
from syntax failure; actual process134/SIGABRT. GNU time's trailing Exit status0
after its signal line is not a passing receipt. Production was unchanged e417.

Implementation started after drain: result wrappers in syntax_validation,
syntax_revision and syntax_pending preserve their existing allocated flag,
explicit extent overflow and successful no-allocation paths; version validation
passes producer outcomes through. Grammar diagnostics do not acquire a resource
tag. Current leaf build is running; no runtime success claimed yet. Remaining
constructor/emission/lexicon/replacement/probe result paths are still unfinished.
entity_create's null also means pinned structural mutation or ID exhaustion;
requested A2's per-call producer result rather than reading shared last-error or
copying that policy into B1. D1 focused existing-entry selector request pending;
no new runner or shared main edit yet. Full lane/publication completion stays open.

B1 broader grammar/completion progress, 2026-11-23T03:33:32.0065669Z:
The existing focused parser, LR and editor checks pass with the new completion
producer latch. Public leaf17.70s/565172KiB; full native incremental20.82wall,
34.78user/5.42system,740788KiB. Parser0.04s/54012KiB, LR1.94s/116380KiB,
editor6.52s/986536KiB, all actual child exits0. Logs grammar_errors_completion_*.
The parser fixture now denies a mid-query probe and EOF completion snapshot,
requires exact Capacity, sticky session error until reset, successful reset/retry,
ordinary absent offer with None and exact buffer/world/ledger cleanup. Quota
exhaustion remains distinct from physical resource failure. LRProbeBudget layout
changed, so consumers require the complete rebuild; existing session getter ABI
is unchanged. B2 was notified to add post-call latches before final output.

Typed template preparation propagates revision/validation/emission/lexicon,
replacement-owned buffers, table and recognizer failures. Early grammar sweep
still FAILS134: latest failure-only phase text is Unable to allocate grammar
construction, followed by the valid-build typed-error assertion. GNU time's
signal receipt is not success. Constructor producer result remains pending A2;
no blanket Memory classification or mutable shared last-error is used. Next
finish holes/remap distinction and connect shared entity/world-type outcomes.
No new paired performance or sanitizer/WASI acceptance for this draft yet.
Merge-preserving pull with autostash succeeded and preserved e417e944 identity
and current work. Root9b318 selected-storage union is received but not adopted
into these frozen before/after inputs. No active job or publication lease.

B1 typed replacement and constructor continuation, 2026-11-23T03:41:57.1282017Z:
Holes/remap result wrappers preserve ordinary missing-capture mapping failure
(None), while vector/label allocation reports Memory and extent overflow Invalid.
The hole producer also preserves emission's exact entity result. Its existing
allocation sweep now measures the successful allocation count instead of using
512 as a retry ceiling; directly touched array sizes/counts derive from their
actual declared types. Successful/failed valid cases require None/Memory and
retain all production/cardinality/lifetime oracles. Public production leaf17.53s,
564956KiB and fixture leaf2.54s,183564KiB pass. An attempted native target failed
because tower-parser-tests belongs to the parser configuration, not native;
no test ran in that attempt. Existing owned /cache/parser target then rebuilt
39steps in40.95s/846820KiB and --suite emission passed0.31s/5520KiB, including
400 generated cases, template failures and repeated lifetime cleanup. Logs
retain both the failed target selection and corrected parser configuration.

A2 bundle937f8685a0ff2fd8ca7b419006ec6b0e2fd3f5e9a269f535fcf1bddc69ef9dbf
advertises559b9ecc582f3a16017d8f5416fadd80d156bad2, sole60741 prerequisite,
verified/fetched without changing main. Reviewed8219b797 implementation and its
normal/pinned/exhaustion/fault tests. Applied exact two-file entity result diff;
e417 lacks A2's later storage imports, so explicitly import work_budget_types
in entities too. This does not adopt page accounting or change EntityStore
layout, and raw entity allocation remains unbudgeted. Full owner history and
root9b318 storage union await the end of this owned profiling freeze.

Root03:36:22 and B2 actual03:36:31 authorize narrow compiler_world_type_result
in world.tower. Implemented cached pinned success, Invalid world/kind, exact
per-call entity failure, Invalid unexpected fixed-layout registration failure,
and publication only on complete success. No shared last-error or layout change.
Legacy wrapper retained. World leaf passes2.63s. Version/build/cache/template
and emission connect those results; version construction stops at first failed
type and releases partial owners before returning. New tests cover unchanged
counts/cache on denial, pinned cached/missing types, retry and buffer cleanup;
existing constructor injection and pinned view now require Memory and Busy.
First version leaf failed because grammar_builder still uses the legacy foreign
entity_create_related declaration exposed by syntax_emission. Retained that
boundary declaration alongside its result counterpart (also existing world/type
legacy declarations); corrected leaf passes. Full current native build and
strengthened grammar-resource sweep now running; no runtime pass claimed yet.

B1 2026-11-23T03:48:46.8223865Z: full default tower-frontend-tests /work/scaffolding reached explicit300s bound, raw timeout124,286.08user/1.88system,276964KiB; NO defaultfrontend pass and queued query/units/module/parser stages did not run. During run one CPU ~96%, RSSstable267MiB; no memorygrowth claim. Installed diagnostic-only gdb15.1 in owned container; ordinary late ptrace attach rejected, preservedlog. Current bounded20second debugger CHILD run (same executable, then stack/kill/drain) will localize hotphase; nottestacceptance. Existing grammar-resource1.20s and emission0.31s passes remain separately scoped. B2 authorized templatefixture sweep03:46; implement after this diagnostic drains. No quiet profile/publication lease.

B1 replacement allocation sweep and scan/stream finding, 2026-11-23T03:59:48.3583687Z:
The corrected public constructor closure builds41steps46.39wall/134.63user/
19.63system,840884KiB; existing grammar-resource constructor/cache/world-type
checks pass1.20s/52456KiB. Those did not yet cover parsing a captured replacement.
B2 actual03:46:24 authorizes the narrow existing frontend_template_build fixture
extension. Added its existing test function to the coordinated grammar-resource
branch with direct import; the default remains unchanged. Measured allocation
count bounds a fresh-owner sweep of the same valid captured replacement, with
None for valid/ordinary missing-capture outcomes, Memory for injected failure,
and exact private buffer cleanup. Touched count/name/text extents are derived.
First leaf used reserved identifier token; renamed spelling. First diagnostic
probe used print but native test link lacks tower_print; replaced with existing
foreign dprintf-style diagnostics, retaining failed logs. No new runner/logic
implementation outside Tower.

The new sweep FAILS134 at allocation1290: resource=0/None,status=0 and diagnostic
Unable to allocate source token. Expected 'x' or $value. This is actual producer
information lost through syntax_scan -> stream -> recognizer, not an inference
from error text used in implementation. Current draft adds a typed scan result,
per-stream first-error latch and resource-aware recognizer reads. The session
retains the exact entity-create result or allocation cause before token error
formatting. UTF8 source and nested recognizer streams use the same channel.
Failed streams remain failed until replaced; static resource diagnostics do not
need another allocation. Error-copy allocation failures now return Memory through
the request/stream instead of aborting. Legacy test assignment helper remains.
This does not account raw token/stream buffers against the world ledger and
entity-component legacy bool failures still lack finer producer causes.
Smallest scan unit/full native/expanded sweep are running; not yet a pass.

Full default frontend300s timed out124 earlier; two bounded30s Tower phase traces
show all world/session/serial-allocation/execution-index/editor assertions finish
and enter body_runs_tests. This is localization, not proof of a body deadlock or
new regression. Root/L1/D1 received the scoped finding for baseline comparison.
All temporary source phase prints were removed after jobs drained. GDB15.1 was
installed only in owned diagnostic container; attach was rejected, child samples
show lr_items_close/lr_items_goto but optimized unwind is incomplete. Two attempted
breakpoint scripts failed (PowerShell list concatenation; private inlined symbol
names); preserve their logs, claim no complete stack from them. Remaining broad
matrix and publication validation stay open. No bound increase or skipped pass.

B1 SAME-SESSION RESUME 2026-11-23T07:37:22.1295822Z, Codex PID33768 (parent4164; OS probe shell18512).
First successful work: inspected surviving container processes (no owned live
compiler/test child), then required git pull --rebase=merges --autostash --ff-only
succeeded Already up to date, preserving maine417e944 and all33 modified paths.
Todo SHA256e97d67a6ad878f3714e24d34c94d61846397d1ddbc882d482e97302342405327
recorded without modification. No session/agent/model/tier change performed.
Docker VM65120415744bytes (~60.6GiB), B1 actualcpuset0-11/memory25769803776
(24GiB); B2 status read before newheavy work, separatecache remains mandatory.
Coordinator current72a218b/providerjoin has no publicationlease; localfreeze
still e417 plus owned typedgrammar/completion/streamdraft and exactA2entitydelta.
Usage-limit output establishes no build or validation progress.

Reconciled completed logs: grammar_errors_scan_result_sweep exited0,1.32wall/
1.29user/.01system,52668KiB, AFTER corrected scan/stream path. Its prior failure
allocation1290 is preserved, not pending. Corrected public scanleaf16.46s/
565936KiB and4-stepnativebuild19.31s/746004KiB passed. No current sanitizers,
paired performance, WASI or fullfrontend acceptance yet. Fullfrontend300s124
and scoped bodyphase diagnosis remain open. Next verify forwarded stream denial
and cleanup usingexistingparserfixtures, then focusedquery/units/editor andfreeze.

File-level findings: syntax_scan.tower lost token allocation cause; parser_stream
and parser_state now preserve per-call typederror through nested streams without
requiring error-string allocation. syntax_version/build/cache propagate exact
world/entity admission instead of null-with-None. syntax_template_build nowpasses
valid captured replacement allocation sweep; semantic invalidcapture remainsNone.
lr_parser completion query/suffix storage failure now reachessticky sessiongetter.
Raw token/stream/entity payloads are still not fully world-budgeted; component-add
bool failures lack finer typedcauses. These are explicit remainingaudititems.
Focused performance baseline frozenbefore frontend e7418959e746b4051f9d2925759150f98d5fc40815930f51d522bb32fc8a0428,
editor a8d813f5317668c2846013989d27071335ab3040ec6d5f43db81e746089c27a1,
exacte417resources under/cache/parser_memory_profile/grammar_errors; noafterpairs.
Prior175 slice's paired n2 frontend and actual3-unit overlap receipts stay scoped
to175, never relabeled newdraft evidence.

Historical scope/proposal messages reconciled: audit already includes rootgrammar,
lexer_table,parse_tree,regex,utf8,source_comments andparser/template units;
parser_frontend/parser_modules remainB2. Inbox37 alreadyroutes finalconstructor
canonicalACK; current formatter/classifier implementation and fixtureevidence
supersede tentative tag37 proposal. No duplicateACK or half-feature adoption.

B1 frozen native checkpoint 2026-11-23T07:39:48.4122364Z:
Smallest updated parser_state fixture passes; native affected targets rebuilt,
then parser0.04s/53724KiB, grammar-resource1.26s/52752KiB, query-smoke0.10s/
60448KiB, units18.87s/821688KiB, editor6.13s/927428KiB and module-cache0.06s/
54344KiB all exit0. Native jobs drained. Added existing-stream regression for
Capacity surviving nested recognizer forwarding under denied diagnostic allocation,
first-error preservation, fixed nonempty diagnostic, UTF8 failure stickiness,
diagnostic-copy Memory and exact teardown. Existing UTF8 fixture now reads public
error getter/typed cause instead of requiring allocated error-vector storage.
Touched input byte sizes derive from actual array. No newrunner or transportmock.
Frozen afterfrontend f01d9c5b45039b086d6d44b423215d68ffe6073ec20e5ae72d620cf4ae04f19d,
aftereditor f785f290891395552f2306ad91ca94cd7fa6e681f77f077d7f1f8bd9a6a20ac8;
before identities and exacte417resources unchanged. Prepared20process paired
profile, B2 quietgrant watcher active; no completed timing claim yet.

B1 frozen paired performance evidence 2026-11-23T07:42:11.9397168Z:
Actual B2 quietgrant2026-11-23T07:39:43.8942216Z; watcher started within1second,
automatic release07:41:00.1936164Z after all20children exit0, within120secondslot.
Same checked-in bootstrap9653, Linuxx64Release native productiontransport,
CPU0-11/24GiB container on60.6GiB DockerVM; Ryzen AI MAX+395. Exact archivede417
resources, fixed before/after binary hashes above, no build/source change during
measurement. Two alternating before/after pairs,3units,1/4workers,0/4096bodies;
four additional sameeditor mixed1/6worker equivalence/cancellation processes.
Times below are frontend in-process mean wall/CPU ms (n2 each):
0bodies/1worker3437.40/3234.91 ->3477.35/3272.05;
4096/1worker4790.60/4589.09 ->4706.54/4499.73;
0/4workers1341.06/4010.18 ->1357.51/4058.98;
4096/4workers2339.48/5603.08 ->2312.25/5638.64.
Small-path mean+~1.2%, largewall-~1.2to1.8%, mixedCPU change; n2 and overlapping
sample ranges do not establish a speedup or regression. Current4worker actual
outer_peak3 in every sample; currentwall ratio serial/parallel2.56small/2.04large
for3units is measured useful overlap, not all-core or within-unit scaling proof.
Canonical hashes1173729914654460811/4242261087906147675 and entity/component
counts48240/55014 and646269/792327 match across all16runs. Retainedbytes exact
unchanged for eachcase:5681401/6028451(serial),5672161/6019211(parallel).
Serialchargedpeak62893937/63240987 unchanged; parallel175925089small unchanged,
largepeaks176200435..176282635 overlap. RSSKiB rangesbefore->after:
smallserial197188..197940 ->197256..197300;
largeserial675956..676084 ->675228..676436;
smallparallel461528..464564 ->460472..466260;
largeparallel929936..940516 ->935432..938468. No measured retention regression.
Editor processes before6.16/6.30s wall,11.94/12.20CPU,948736/945344KiBRSS;
after6.22/6.30s,12.06/12.24CPU,919396/886632KiB. All exactinspection/cancel
oraclespass. Meanwall6.23->6.26s; no broad memory-improvement or speedup claim.
Raw JSON/time/logs retained in/cache/parser_memory_profile/grammar_errors/results.

B1 frozen sanitizer evidence 2026-11-23T07:46:58.4608722Z : all owned ASan/LSan children drained exit0.
74-step build95.72wall/240.78user/32.75system,845008KiB; parser0.27s/148756KiB,
grammar-resource11.69s/662536KiB, mixed1/6worker editor43.61s/1187976KiB,
3unit4worker profile9.85s/1113496KiB with actualouter_peak3 and identicalcanonical
1173729914654460811. ASAN_OPTIONS=detect_leaks=1:abort_on_error=1, no findings.
These checks instrument the native host boundary/generated code, not unsupported
browser/system-LLVM internals; allocator fault tests remainserial. Fullfrontend
300s124 remains open. C free134140530688bytes. Currentroot72a notadopted while
frozen. Next ONE owned TSan build/tests in /cache/native_thread, CPU0-11/24GiB,
separatecache; existing script uses bounded180second focusedcases, no invalidprobe.
B1 TSan checkpoint 2026-11-23T07:50:08.5779580Z : build and all five frozen processes passed and drained.
Build64.04s wall/165.59s user/25.71s system,845820KiB. Parser0.358s,
grammar-resource20.035s, query-smoke1.128s, and two real3unit4worker runs
25.055/25.645s wall,79.492/81.777s processCPU,1429664/1417212KiB RSS.
Both outer_peak3, canonical1173729914654460811, entities48240/components55014,
retained5672113bytes; no findings with TSAN_OPTIONS=halt_on_error=1. Same image,
CPU0-11/24GiB, isolated network, supported seccomp=unconfined TSan invocation.
Current CMake instrumenter supports address/thread only; no standalone UBSan or
browser sanitizer result is claimed. Serial fault instrumentation does not prove
concurrent allocator safety. Parser-only affected build/emission/modules nowrun
sequentially in /cache/parser; unchanged sourcefreeze, logs grammar_errors_frozen_*.
After these checks, checkpoint this exact code and join complete root72a history
before current WASI validation, avoiding the known superseded standalone-provider
failure. Rootbundle SHA5673 verified/fetched; none of its compiler inputs adopted yet.
B1 grammar resource milestone 2026-11-23T07:51:04.3460092Z (implementation and scoped evidence).
Parser-only changed closure rebuilt in21.54s wall,27.65s user,4.27s system,
744648KiB. Emission suite passed0.33s/5540KiB, including400 generated cases,
template failures and lifetimes. Module/session suite passed0.16s/47496KiB.
All children drained before commit; diff--check clean, todo SHAe97d67a6 unchanged.
This checkpoint preserves typed failures through early version construction,
replacement preparation, completion probes and nested token streams. It includes
the authorized world-type wrapper and exact A2 entity result implementation from
8219b797, with a direct WorkBudgetError import needed on this older base. The
full A2 owner history will join through verified root72a next; no storage/page
prototype has been adopted. Existing legacy wrappers and ordinary invalid-grammar
behavior remain compatible. New fixture bounds derive from collections or the
successful allocation count, not guessed failure-sweep lengths.
Acceptance is scoped: native focused, paired performance, ASan/LSan, TSan and
parser generated/failure checks passed. Full frontend300s timeout remains open;
current WASI and final public-bootstrap/generation/publication checks are pending.
No publication lease is held. Remaining implementation includes raw payload/world
budget coverage, finer component-add errors, early declaration/read/pattern paths,
and measured scheduling/storage gaps listed in the file audit.
B1 coordinator join 2026-11-23T07:53:13.2661828Z : merged complete verified root72a onto66f985.
Only manual conflicts were entity imports and adjacent test README additions:
kept root's WorkBuffer imports and both test descriptions. entities/entity_api
now exactly match root72a, so the original A2 per-call API and constructor history
is preserved. B1 world-type helper, grammar/completion/stream layouts and tests
remain identical to66f985. The journal auto-merge retains every nonblank line from
both parents (UTF-8 exact ordinal comparison: zero missing from either parent).
Root adds the selected scheduler/store constructors, context snapshot helper,
B2 inspection/backend ordering and D2 standalone allocator providers. It does not
contain A1's new semantic receipt ABI, L1 frames or B2's new world constructor;
those remain owner drafts. No private prototype or unpublished syntax adopted.
Merged source is not yet validated: rebuild native affected closure, run focused
parser/resource/query/editor/cache/units, then documented public WASI+IDE checks.
Earlier66f985 profiles/sanitizers stay scoped to that immutable source, with the
new union requiring its own applicable checks before final publication.
B1 merged native evidence 2026-11-23T07:54:51.5502011Z : main38ca7a335e38b895412d046a6343b4a59d936616,
tree97600afede337b5e9eb68659a9de99b2388a4222. Public-bootstrap affected26-step
native build43.71wall/115.57user/17.06system,771980KiB passed. Parser0.04s/54240,
grammar-resource1.34s/52912, query0.11s/60728, editor10.86s/948236,
module-cache0.06s/54488 and nativeunits19.36s/918868 all exit0; actualmixedjobs,
nestedbudgets, deterministic output/failures and cancellation oracles retained.
Editor includes root's added physical-denial inspection fixture, so its duration
is not comparable to the older66 paired editor workload. No new performanceclaim.
All children drained. Starting documented WASI build with public pin, SDK34,
IDE_TESTS=ON, jobs4 in ownedbuild/browser-wasi; no privateoverride orcapchange.
File-level next audit: syntax_revision_declare still has untyped overlay/diagnostic
failure; syntax_reader has a storage-only syntax_reader_ok failure path and typed
receipt can be introduced without classifying text. syntax_session_next early
read/declaration and error-byte helpers remain untyped/abort on diagnostic copying.
Pattern chain crosses B2 frontend_world/frontend_pattern/frontend_table and B1
regex_lowering; requires coordinated producer result before session adoption.
B1 merged WASI evidence 2026-11-23T07:57:24.8153966Z : documented default public-bootstrap build passed
50.31wall/102.22user/15.01system,848328KiB (28 affected steps, SDK34, jobs4,
IDE_TESTS=ON). Reactor SHA12a932a792eba43698f1a23ddbcd45d1771f3f6ee3cdd55f5546062505f4a984.
Existing Tower IDE assertions passed, Node runner exit0/27.5919543s. Eight raw
portable fixture observations completed exit0/1.7512887s: comptime_capture executes,
and inference_alias_invalid/decltype_aggregate_operator/aggregate_inferred_copy
produce their expected distinct errors at offsets146/95/103 for both4/8-byte
pointer targets. Observation transport reports values, not an independent oracle.
No browser sanitizer, all-core browser scaling or hosted publication claim.
Currentroot adds shared graph/store ownership, so a matching scoped native
ASan/LSan and TSan rebuild/run will precede the next source edits. Earlier66
instrumentation remains separately identified; no relabeling old checks.
B1 merged instrumentation checkpoint (2026-11-23T08:02:44.5929691Z).
On source38ca7a33, ASan/LSan build passed in85.13s wall,203.58s user,
28.13s system and770304KiB peak RSS. Parser passed0.27s/148696KiB,
grammar resource cases11.72s/662600KiB, editor81.48s/1191280KiB and
three-unit/four-worker profile9.83s/1118212KiB. The profile observed three
simultaneous units and canonical hash1173729914654460811. No findings with
ASAN_OPTIONS=detect_leaks=1:abort_on_error=1. The editor now includes root's
physical denial case, so compare neither its wall time nor CPU directly to66.
Matching TSan build passed57.75s wall,145.13s user,21.70s system,771172KiB.
All build/ASan children drained before the B2 quiet grant at08:01:58 UTC
(use the exact grant timestamp in status). TSan runtime remains pending.

Read-only follow-on audit found that syntax_session_error and its byte variant
abort on diagnostic-copy denial. syntax_baseline_install and syntax_format_into
then gate publication by error.length alone. A nonallocating session diagnostic
must be accompanied by resource-aware checks at these consumers; replacing only
the setter would be incomplete. syntax_session_next also has explicit allocation
aborts for comments and declaration-index storage. Preserve the first existing
WorkBudgetError, stop before publication, retain ordinary source diagnostics,
and dispose every private parse tree on failure. Pattern compilation remains a
separate cross-owner result chain; B2 has the concrete proposal. No new production
changes are made while the current merged sanitizer closure remains frozen.
B1 merged TSan runtime passed (2026-11-23T08:06:52.0203006Z). All five children drained with exit0:
parser0.353s, grammar-resource19.618s, query1.123s, and two three-unit/four-worker
runs24.649/25.038s wall,77.767/79.655s processCPU,1428860/1435684KiB peak RSS.
Both observed outer_peak3 and canonical1173729914654460811 with identical
entities/components/retained bytes. No findings with halt_on_error=1, same
bounded180second cases, supported isolated container configuration. No UBSan or
browser instrumentation capability has been added. Root38 sharedownership now
has matching native focused, ASan/LSan, TSan and public WASI/IDE evidence.
A final current parser-only reader/emission run is queued after its rebuild;
the existing bounded lifecycle0..1 selector will localize the earlier fullfrontend
300second timeout without changing that deadline or claiming the fullsuite passed.
Source remains frozen. B2 quiet grant was consumed by its original watcher and
released08:03:14.8326980+00:00 after four successful children; no duplicate watcher.
B1 frozen38 closure completed (2026-11-23T08:08:38.6094171Z). Parser-only affected build passed32.99s
wall/83.52s user/11.94s system,770400KiB. Existing independent reader oracle
(1000 byte fixtures, exact trees/errors, malformed spans and failure cleanup)
passed0.20s/50096KiB; emission's400 generated/template/failure cases passed
0.30s/5540KiB. Existing lifecycle cases0 and1 both passed32/64-bit and1/4-worker
checks, including valid Foundation reconstruction and deterministic failure, in
8.67s wall/8.86s user/.54s system,224212KiB under the unchanged60second case bound.
This rules out an immediate stall in those first two cases on38; it does not
explain or erase the earlier fullfrontend300s timeout. The full lifecycle has42
cases, two target widths, two worker budgets and additional valid serial round
trips before the rest of body_runs begins. No fullsuite acceptance claim.
All children drained. Current C free134619910144bytes; todo remains untouched.

New root75fdf0bf receipt/pages union arrived only after this freeze completed.
Its semantic receipt/frame/page ownership changes have not been adopted or tested
here. Keep these38 native/sanitizer/WASI receipts immutable, publish their complete
history to the coordinator, then review/adopt the next coherent owner history
before using the new component-result API in declaration work. Do not rerun these
unchanged38 matrices or copy only new getters. Final release/publication remains
open and no publication lease has been granted.
This commit only records already-completed checks and findings; runtime inputs
are exactly source38ca7a33, so no new runtime performance measurement is applicable
to the documentation delta itself.
B1 next owner-history join (2026-11-23T08:11:16.5692744Z): verified full root75fdf0bf bundle5fe3be67
and merged it onto908318d7 without conflicts. Both parents' journal histories
retain every nonblank line (exact UTF-8 ordinal comparison, zero missing lines).
B1 world-type and parser/grammar layouts are unchanged. Shared entities/types/API
and semantic_context exactly match root75, retaining original owner commits.
Reviewed A2 entity_component_add_result: existing component succeeds while pinned;
new published mutation reports Busy, bad world/type/extents Invalid, physical page
and dedicated payload grants use the store ledger, allocation failures preserve
per-call causes and cleanup. Raw entity/index/table buffers remain explicit gaps.
This supplies the exact producer API needed by B1 reader/scan/emission follow-on,
rather than inventing a second receipt or guessing Memory from a null component.
A1's semantic receipt and L1/L2 storage changes are the complete owner union;
B2's current output-consumer/world-constructor drafts are not present here.
No claim of complete shared-world accounting or output-boundary adoption.
Next establish a matching native baseline and freeze it before new declaration
changes. Reuse prior38 receipts only for that prior source. Defer the broader
sanitizer/browser matrix to the next coherent implementation milestone so each
new handler does not restart unchanged matrices. No publication lease.
B1 declaration draft implementation (2026-11-23T08:23:21.4113756Z), baseff917910, no acceptance yet.
Before binaries/resources frozen under /cache/parser_memory_profile/declaration_errors:
frontend584faa415c3388ac42c097b0e2a6437fb8213700f3b3c864824b98e655e53765,
editor058c9fb0774a58ea6cee456f11ea85bddea0140de66ac08572e40855d5c332fc.
Base native build31.27s/774676KiB and parser/resource/query/editor passed before edits.
New syntax_reader and syntax_revision result variants preserve semanticNone versus
storageMemory and exact entity component errors. Scan/emission now consume A2's
complete component-result API. Session setters retain first failure without
allocating; baseline installation and source formatter check the typed receipt
before publishing. Comments and declaration-index allocation failures now return
through the session instead of aborting. Legacy wrappers remain compatible.
Reader/revision public leaves passed15.60s each (667176/668828KiB); later session
consumer/test edits have not compiled yet. Existing reader oracle now checks typed
None, allocation sweep derives actual successful calls (replaces512), pinned
component Busy and retry. Existing parser budget fixture covers denied diagnostic
copy/formatting suppression; own frontend_syntax_version fixture adds declaration
result/semantic/diagnostic-failure checks using its current world/revision setup.
No tests/frontend_revision edit without B2 coordination. Pattern producer chain,
reset input construction and legacy attach/highlight/module-record failure paths
remain separate explicit gaps. B2 detailed quiet window was respected and released
08:14:38.2304232+00:00 before any leaf build. First patch application failed its
emission context check atomically, no partial mutation; corrected patch applied.
B1 declaration failures and correction (2026-11-23T08:26:53.8263572Z). Reader test leaf2.71s/219792KiB
and session leaf16.14s/693156KiB passed. Budget-test leaf failed first for missing
bytes_assign_text declaration in the new revision fixture, then unavailable
lr_none in this standalone import closure; direct ABI declaration and existing
frontend_world_unlimited fixed these. Both failed logs retained; retry2 passed.
Native build passed, but parser runtime aborted(signal6) at the UNCHANGED
'Control denial retains its concrete diagnostic' assertion. No later grammar
resource test ran. The initial setter incorrectly suppressed concrete messages
whenever a typed receipt existed. Correction preserves the existing copy attempt,
retains its exact message on success, and preserves the first typed cause with a
static fallback only if no diagnostic bytes are available. Copy failure does not
abort or recursively allocate. The denied-diagnostic fixture now runs on the
fresh successfully parsed session before prior errors allocate reusable capacity;
its actual fail-after0 denial remains required. No old assertion weakened.
All children drained before correction; matching rebuild/parser/resource pending.
B1 declaration native checkpoint (2026-11-23T08:31:10.6642497Z), baseff917 +10 Tower paths; source frozen.
Corrected native rebuild20.01s/750772KiB; parser0.04s and grammar-resource1.29s
pass, including unchanged concrete control diagnostic and new failure gates.
Parser-only build24.05s/776364KiB; independent reader1000-case oracle0.21s/49872KiB,
emission400 generated cases0.30s/5520KiB, modules0.14s/47560KiB and live canonical
Bedrock/replacement grammar/formatting0.42s/47500KiB all pass. Query0.21s/87568KiB,
units18.85s/874316KiB, editor10.65s/1008500KiB and cache0.06s/54776KiB pass.
Reader measured allocation sweep, exact Busy after pinned component admission,
ordinary malformedNone, retry and lifetime assertions are now executed evidence.
Declaration tests use the existing frontend_syntax_version world/revision setup;
no edits to tests/frontend_revision or other B2-owned fixtures.

Frozen after frontend762d758b74f4f1daa529270d3650be2b3eaedfb4260079a6dfe0cda59ff7ded4,
editor e636445fde8060e17abad76c9c20e04578440fd32e8f277826b6b10893345860; before
hashes/resources remain ff917 as recorded. Ready20-process alternating comparison
uses identical3-unit inputs,1/4workers,0/4096bodies and two samples plus four
editor processes. Fresh180second quiet request sent; watcher68261 active600seconds,
starts only a fresh grant and releases automatically after child drain. No heavy
B1 job while waiting. No paired-performance result or current sanitizer/WASI pass
yet. Fullfrontend300s timeout and finalpublication acceptance remain open.B1 measured declaration profile (2026-11-23T08:38:22.1414466Z), frozen beforeff917/after10paths:
16 frontend JSON results preserve exact canonical hashes, entities/components and
retained bytes. Wall/CPU mean ms before->after, n2 each: small/1 3478.48/3273.95
->3495.91/3293.69; large/1 4538.26/4336.96->4550.84/4351.98;
small/4 1368.59/4065.79->1368.49/4088.95; large/4 2224.56/5418.18
->2218.27/5476.80. Actual outer_peak3 for4workers,1 forserial. No speedup or
established timing regression claimed with n2 overlapping wall ranges. RSSKiB
serial small197452-198072->197716-198176, large678492-678568->678524-678536;
parallel small457852-464400->459832-464636, large935164-936148->936528-942848.
Retained small serial5681405/parallel5672165 and large6028455/6019215 identical;
ledger storage5242880/20971520 identical; parallel peak grants vary slightly with
scheduling (small before175792149-175935589, after175925093), not retained growth.
Editor actual binary is tower-lr-work-tests with editor selector, including mixed
1/6worker inspection/cancel plus generic budget denial/recovery at4/8widths x1/4.
All assertions passed; wall11.13,11.14->11.04,11.10s and totalCPU17.06,17.18->
16.95,17.08s. PeakRSS864792,966556->933016,1024816KiB: +6.9% mean with overlapping
wide ranges; NOT claiming unchanged editor memory. Source review finds no new
success-path heap owners: reader receipt is local scratch, declaration wrappers
forward existing allocations, comments/index allocations unchanged. Existing
budget/world cleanup assertions pass; this does not alone explain RSS variation.
Plan bounded four more alternating pairs on these same frozen binaries/resources
after sanitizer jobs drain and fresh quiet grant; no fixture or allocator change.
ASan current31stepbuild85.31s/775392KiB, parser and grammar-resource passed;
editor still live, so no complete sanitizer pass yet. Parser-only instrumentation
is unsupported by checked CMake profile (requires TOWER_NATIVE, which selects
native target branch); new independent reader oracle ran native unsanitized,
while production reader paths run through instrumented frontend parser/resource.
No new build-profile workaround or shared CMake edit; coverage gap explicit.B1 declaration sanitizer completion 2026-11-23T08:42:08.6528594Z: ASan/LSan36572 exited0 after31step
build85.31s/775392KiB, parser0.28s/148448KiB, grammar-resource11.87s/660756KiB,
frontend editor99.17s/945732KiB and real3unit/4worker outer9.81s/1118512KiB.
No reports. This editor command is frontend-tests editor (explicit-world/completion
plus mixed units), distinct from the frozen LR editor performance selector.
TSan15773 exited0 after31stepbuild49.91s/775456KiB; parser0.345s, resource20.471s,
query1.161s, two outer25.464/25.534s with actualpeak3, canonical1173729914654460811,
entities48240/components55014. No reports. Supported ephemeral container uses
sameimage, no network, seccompunconfined, CPU0-11/RAM24GiB, halt_on_error=1 and
unchanged180s bound per case. Allocation-fault tests are serial, not race proof.
No standaloneUBSan/browser/systemLLVM instrumentation claim; independent parser
runner instrumentation gap recorded. Source remains frozen. Next lifecycle0..1
then documented public-bootstrap WASI/IDE, then additional bounded quiet editor
RSS pairs before final source/evidence export. No publication lease, fullfrontend
prior300s timeout remains open. Future build outer parallelism3 x compilerjobs4
bounds nominal compiler lanes to12 as well as existing hard cpuset12; this changes
build orchestration only, not the already completed runtime comparison inputs.B1 portable/lifecycle completion 2026-11-23T08:44:41.7834598Z: actual50913/71960 both exit0/drained.
Current native lifecycle0..1 covers Foundation reconstruction and failed work at
32/64bit x1/4workers,8.89s/218016KiB. Documentedpublic WASI9stepbuild38.60s/
857140KiB with outer3/compiler4, no bootstrap override. ReactorSHA
9b3a8f3ceaa28d096426d171062930cd1743b693bbf34509e695fdec6e99256b.
Tower IDE session/completion/hover/lifetime assertions PASS27.1537397s. Existing
transport observations1.750243s: capture fixture succeeds; three independent
negative fixtures report offsets146/95/103 identically across pointer widths4/8.
These raw transport observations are not a new independent semantic oracle.
Currentdraft code paths remain the same10Tower files; docs only updated during
frozen validation. Owned12path diffcheck clean; todo unchanged e97d67a6...
Native/sanitizer/WASI jobs all drained before new watcher88074 requested fresh
NEW120second editor memory slot. It owns8same-input native processes, waits600s,
starts only a fresh B2 grant and autoreleases after drain. No heavy B1 job while
waiting. Need inspect that bounded memory follow-up before committing/exporting;
all current gates are source-specific, no wholecompiler/release acceptance.B1 additional file-level admission findings 2026-11-23T08:46:14.1923940Z, read-only during frozen
editor profile: compiler/parser_workers.tower: parser_workers_open opens retained
world pool through work_pool_open, so physical slot storage still has null budget;
parser_admission_open reserves actual extra lanes but drops WorkBudgetError to
bool. This is distinct from A1's nested semantic pool and is B1-owned follow-on.
compiler/lr_first_work.tower uses private FIRST/result/frontier storage but raw
alloc/vector buffers and bool producer outcomes; entity/register/view/graph setup
failure can differ from allocation. compiler/lr_state_work.tower likewise drops
admission/type/component/graph results while preserving deterministic interning
and drain ordering. compiler/lr_work.tower has corresponding LALR closure/link/
propagation/action scratch and bool outcomes. Need exact results through these
producers, then B2 table adapters; no blanket Memory classification. Shared page
accounting alone does not account these remaining derived buffers or pool slots.
compiler/regex_lowering.tower has raw owner plus five borrowed-entity work vectors;
compiler/automaton.tower has explicit allocation/error codes that distinguish NFA/
DFA semantic limits from actual storage failure. compiler/lexer_table.tower has
raw owner/alphabet/transitions/accepting buffers, though SymbolSequence is already
budgeted. Existing APIs validate table shape before allocation, so false cannot
be blanket Memory. These records extend earlier census rows without claiming new
implementation or changing current profile inputs. Full memory acceptance remains
open. B2 accepted proposed regex per-call contract; complete production/test/public
compiler history will precede consumer adoption.B1 declaration final checkpoint review 2026-11-23T08:47:43.3021348Z: editor memory watcher88074
consumed fresh08:45:20.8229128Z grant and released08:46:50.6735643Z; all8new
processes exited0, no overlapping B1 heavy job/source edits. Combined n6 each,
RSSKiB mean929134.67->936888.67(+0.83%), median931014->921152(-1.06%), ranges
864792-992044->873032-1024816. The original n2 +6.9% increase did not persist
consistently; no established memory regression or memory improvement from these
variable native runs. Checked outputs and exact budget/world cleanup unchanged.
Wallmean11.2217->11.0883s, CPUmean17.2967->17.0800s; no speedup claim. All raw
samples and original n2 observation retained. This bounded investigation closes
that specific performance question without changing allocator or fixture policy.

Final changed production files: syntax_reader exact per-call resource results;
syntax_revision exact declaration/diagnostic/overlay outcomes; syntax_scan and
syntax_emission consume A2 component admission; syntax_session_setup keeps first
resource cause/concrete error with static fallback; syntax_session_next propagates
reader/declaration/comment/index failures; syntax_session_format rejects typed
failures before output publication. Existing syntax_reader oracle/fault/pin tests,
frontend_syntax_version declaration tests and parser_table_budget denied diagnostic
and formatting fixture cover those contracts. All new/changed project logic is
Tower. True fixture limits are named; collection/allocation counts derive from
actual inputs, and raw spans retain explicit lengths. No new syntax adoption.
Remaining reset/open, legacy attach/highlight/module-record, pattern and LR memory
paths are documented above; no fullresource/wholecompiler acceptance. Current
public-bootstrap native leaves+focused/fullownedparser suites+paired profiles+
ASanLSan+TSan+WASIIDE/lifecycle pass, with unsupported and unrun coverage explicit.
Ready to commit this complete producer/consumer/test slice and export full main
history (root75 plus prior B1 checkpoints), not signatures alone. Publication is
still unleased; earlier fullfrontend300s timeout remains open. No push or hosted
verification claimed. Documentation-only evidence additions have no runtime cost.
