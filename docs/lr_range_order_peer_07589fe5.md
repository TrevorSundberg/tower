# Independent LR range-order acceptance, 07589fe5

- Accepted without a new production/test change: published `8aa599b746908a7c5a72ab2d1c166826c1237ef5`, frozen joined source `07589fe5964b23881f65baf0754930ec1af450ee`, tree `c6dc2ff6913cd28f737d5fb00265cf7294c870a9`.
- ROOT's finite artifact wait delivered the exact source/patch; patch SHA256 `482d1190fae8219f1b1d77fcaaf4c0a1ef8c473b44338e51503f25b4f1c6a355`. Producer/test blobs `5c673c871d`/`907db95762` match. The earlier append guard is rejected owner evidence, absent here.
- Raw identities, commands, dependency inputs, binary hashes, six outcomes and measurements: `C:/Sandbox/build/codex_ecs_20261122/A1/cache/parser_lr_candidate_r4/` (`descriptor.json`, `review_blobs.txt`, `inputs.after.sha256`, `binaries.sha256`, `measurements.csv`, logs/XML).
- Reviewed the whole insertion method, vector reserve, FIRST/suffix and LALR seed consumers, sparse/SCC/parallel publication, eager oracle and literal fixture. Only the search comparator changes; neither graph storage nor activation/cache policy changes.
- `u64(first)<<32 | u64(last)` is injective and has exactly unsigned lexicographic order over two u32 endpoints. Both conversions precede the shift; shift32 is within64, maximum key is UINT64_MAX. There is no signed comparison, pointer cast, endian assumption or wider payload load.
- Empty input reads no element. Lower-bound midpoint arithmetic remains overflow-safe; duplicate equality returns before allocation. Append/interior/prepend retain checked count/byte capacity, reserve-before-copy and unchanged sorted exact pairs, including overlapping intervals and EOF/propagation markers.
- Denied reserve returns the existing typed cause before changing length or `changed`; only successful novel insertion queues dirty work. No new allocation, budget, first-error override or partial ready publication. SCC dirty solves still rebuild their local index and preserve pending work on denial; sparse solver retry still requires its existing explicit requeue after a failed transfer.
- FIRST and parallel propagation consume joined private results only after ordered error checks. Existing leases, worker drains, cancellation and world-owned structure lifetimes remain unchanged; this scalar comparator adds no cross-revision cache or worker mutation.
- The independent oracle is unchanged: linear insertion uses two-field comparison, eager closure and independently constructed state/action/runtime records. It is not the new key algorithm duplicated in a test.
- New literal control executes seven independently specified pairs in ascending/descending/interleaved order (21 inserts), then21 duplicates under allocator denial; exact addresses/counts/pairs survive, including zero, equal starts, overlaps and UINT_MAX. Existing failures cover Memory, Capacity, retry and final zero ownership.

| Independent frozen validation | Result | Wall / CPU s | Maximum child RSS KiB |
|---|---|---:|---:|
| Dependency build, two targets /26 actions | exit0; stderr empty |39.97 /77.42|867336|
| `lr-order` | pass;150 randomized grammar/propagation trials plus fixed/SCC/denial cases |0.19 /0.17|55604|
| `grammar-equivalence` | pass; live activation/overrides/captures/nullable/conflicts/round trips |0.20 /0.13|64588|
| `grammar-resource` | pass; failed construction/versions/retry |0.66 /0.65|53136|
| `parser` | pass; original diagnostic/trace/error controls |0.04 /0.02|54280|
| Registered structure-reuse + native LR |2/2 pass; original60/180s guards |1.86 /2.33|115300|

- Total6 selected /6 executed /6 pass /0 fail /0 skip; no broad compiler/lexer/query suite. Native LR asserts real caller/worker barrier overlap, exact serial/threaded records/conflicts, pool cancellation/join, shared-budget denial and unchanged final entity/component ownership. Queue width is not the overlap oracle.
- Structure reuse checks exact grammar/profile/precedence/world/seed identities, unresolved diagnostics, changed-grammar Capacity, cancelled-request retry and lifetime pins. Grammar cases preserve source spans, revision boundaries and canonical reconstruction; no new expectation or cap was changed.
- Linux x64 LLVM19 Release, public04ae compiler/manifest unchanged, existing cache outer4/compiler1, CPU12-23/quota12/24GiB. Frontend ELF `9997bef02f60...`; LR ELF `3dd93832acd9...`; full hashes in raw manifest. Joined lowering/pool/capture inputs are compiled coherently, not relabeled as the owner's earlier timing arms.
- These are validation costs, GNU time waited-child CPU/maxRSS, not a new performance experiment or simultaneous family-memory sum. Expected suffix ledger/parser trace counters remain in stderr; all statuses0. Input/binary/public-pin/todo hashes recheck unchanged, cgroup max/OOM0, final heavy-process inventory0.
- [Owner performance and failures](lr_range_order_c185948f.md) remain attributed at c185: small serial n4 wall -5.91%, large serial +0.73%/CPU +0.87%; four-worker n2 small/large -2.06%/-2.02%, RSS changes under0.4%. Opposing results remain visible; n1 4096 controls do not establish20% speedup. Nested phase spans cannot be added.
- ROOT's descriptor supplies owner artifact hashes; KinmenB raw sample/binary directory is not local and was not independently rehashed. No second timing cohort or universal performance conclusion. This review independently validates the published source and current native behavior.
- No concrete defect or scoped repair required. Prior rejected append/counter/fixture setup failures stay in B2's receipt; no independent test failure occurred. Browser/32-bit runtime/generation/sanitizer/release acceptance is not claimed; ROOT owns combined adoption.
- All owned build/test/container descendants drained naturally; only the preexisting idle container process remains. A1 launches no further heavy work after this batch, leaving KinmenA available for A2's full-core cohort. Documentation-only reconciliation reuses this frozen boundary by Git equality.
