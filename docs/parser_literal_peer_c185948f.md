# Independent literal-query review and native adoption

- **PASS: no concrete correctness defect found; nine focused entries passed, zero failed/skipped/unstarted.** No production/test repair was needed.
- ROOT's bounded artifact wait supplied published source `c185948f98c9becafad149be1963c34ad6d4a133`, tree `8e99e9f9828ab1619d3a721c71a182da0288f608`, patch commit `ea6fd5e0fa863894f5a3d8fe05edcc363f8609c9`, baseline `9839850d32fd3eb214438f3d700195243000159e`.
- Verified ancestry, all four supplied Git blobs and patch SHA256 `13a52226a5ea87f7004639f9c3cb048e141140955404a3d11ceae52033a19167`; finite production delta is only `syntax_lexer.tower`, plus three test/selector files. Source stayed frozen through execution.
- Reviewed whole `lexicon_choose`, prefix/acceptance helpers and immediate scan/session/completion consumers. `lr_runtime_action` reads immutable direct/action rows and copies a local result; no allocation, graph request, mutation or error latch is suppressed.
- The moved filter rejects exactly `literal.length < choice.length` or nonmatching bytes. Remaining literal order, equal-length replacement, contextual eligibility, style/skipped fields and shorter accepted declaration punctuation are unchanged; explicit token selection is untouched.
- Bounds remain `start > length`, then `count > length-start`, before loads; byte iteration cannot overflow the source extent. Literal text and DFA tables remain valid borrows from the pinned revision throughout selection, including literals now inspected before acceptance.
- `choice.checks` intentionally counts fewer actual queries. Its consumer only aggregates observed parser work, not limits/readiness. The eager oracle is Git-unchanged; exact semantic fields remain equal, queries cannot exceed it, and five literal cases independently require counts0/1/1/3/0.
- Request/lookahead destruction still precedes grammar publication; each subsequent selection receives the current pinned version/revision. No persistent cache, new grammar authority, reordered activation, ABI or worker task was introduced. Initial Foundation import-snapshot policy remains unchanged.

| Contract reviewed | Fresh existing control and independent oracle |
| --- | --- |
| Longest match, token/declaration precedence, byte boundaries, contextual eligibility | `lexicon`:165 fixed/seeded inputs, every offset through length+1, six contexts/two modes; exact winners, five query counts, pinned-entity and allocation-failure/retry conservation. |
| Ordered local rules, lexical overrides, pending/negative/incomplete grammar, malformed spans | `grammar-equivalence`: live boundary/revision/lexical/attribute/replacement fixtures; literal source spans, captures, canonical round trips, sticky failure and original offsets. |
| Source override, world/seed/revision scope, reset and cache invalidation | `structure-reuse` includes independent session worlds/import overrides/cycles; registered module-cache checks cover immutable snapshots, transitive source identity and idle/active leases. |
| Typed resource errors and diagnostic ownership | `grammar-resource`, `presentation-budget`, `parser`: unchanged denial, partial preparation, retry and zero-owner oracles; original limits derived from actual reservations retained. |
| Query/effect/canonical preservation across workers | Registered `tower-query-continuations` keeps full query-smoke at32/64 and1/4; separate `syntax-unit-controls` keeps exact42/43/44, serial/four canonical equality, liveness and final teardown. |

- Independently verified the separate test correction: `syntax_reset` records **Invalid** on a foreign-world module before diagnostic copying; reserve failure cannot replace it. The fixture still requires nonempty error, no canonical publication, successful clean retry and owner conservation; Memory was a stale expectation, not the producer's first cause.
- Public default compiler `04ae22d0e73e3674e43895ea2d1efc13da8b7a6b4704df5815369490e6fcfc47`, manifest `faba6eb45610fa8fb90fc6c2a98927138e6552042a7c546bcff25ad92be66c11`; no private override. KinmenA Linux x64/Clang19.1.1 Release, CPUs12–23/quota12/24GiB, outer4/compiler1, existing ordinary cache.
- One45-action dependency build of three targets; unchanged vendor/tool providers reused. Six frontend selectors, two original CTests and one unit command executed once; original180s per-test guards and all internal caps/oracles retained. No full native/type/browser matrix.

| Independent validation | Wall s | CPU s | Max process/child RSS KiB |
| --- | ---: | ---: | ---: |
| Three-target build |32.38|84.96|860740|
| Six frontend controls |0.99|0.84|65052|
| Query + module-cache CTests,2/2 |9.19|8.51|355936|
| 32/64 serial/four unit control |2.78|4.25|543444|

- Costs are validation, not a repeated performance experiment or aggregate-family RSS. Expected parser trace/presentation counters remain in stderr; other test/build stderr is empty. Presentation final_live0, module-cache zero ownership and query/unit drain assertions pass; final OS inventory contains only preexisting idle sleep, OOM/max events0.
- [B2's matched performance](parser_literal_queries_9839850d.md) remains attributed: public31a n2 small CLI wall improves4.14%/5.06% at1/4; large serial CLI+0.64%, large frontend serial flat. Large-four n4 whole-process wall improves~0.47% while inner frontend wall worsens~0.64% and CPU rises; neither is a general large-input speedup. Nested observer spans are not summed.
- Owner before/after hashes are preserved in ROOT's descriptor; KinmenB raw binaries/samples were not independently rehashed here. This review verifies the published finite delta, scope/arithmetic and own current-public-pin correctness, not statistical certainty or a second performance reproduction.
- Preserved setup-only failures: transient Git DNS, missing prior module-cache binary, UTF16 shell identity file and disabled existing `TOWER_MODULE_TESTS` option. Corrected transport/configuration before compilation/tests; no swallowed test failure or altered expectation.
- Exact ELF hashes,23 reviewed input blobs, dependency commands/inputs, nine results, metrics and full logs: **`C:/Sandbox/build/codex_ecs_20261122/A1/cache/parser_candidate_r3/`** (`candidate_blobs.json`, `review_inputs.csv`, `binaries.sha256`, `measurements.csv`, `registered.xml`, scripts and preserved setup evidence). All input/binary checks remained equal after drain; todo unchanged.
- Genuine source reconciliation: merged `6a338531db2096a3859fa53ebbc232256540e3d3` adds L1's `e50072cd` lowering/context-layout and lifecycle fixture delta; all23 parser-review blobs remain equal. Coherent12-action rebuild21.88wall/35.46CPU/865944KiB; affected query+module-cache2/2 pass9.27/8.56/352136, unit control pass2.77/4.25/648148, empty stderr/zero jobs/OOM0. Exact merged identities/logs under `RAW/merged/`; six unchanged grammar passes remain c185 evidence, and no combined performance claim is made.
- Final611 hosted/static/browser files and prior release evidence untouched. No fresh sanitizer/generation/browser claim for this delta; ROOT owns combined adoption. Documentation-only reconciliation reuses the frozen producer/test/build boundary without another test cycle.
