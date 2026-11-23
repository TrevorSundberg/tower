# Exact-range membership attempt: rejected

One graph-local membership candidate was implemented and measured on frozen
`415a54e942b4944ffa39bbda607c53c2c3a0c42f`, tree
`2938cca4a00331b5a3c72a09b2b5d0e3473e4930`. It passes functional/ownership checks
but fails the end-to-end performance gate. Production sources are restored;
the rebuilt compiler and both test runners match their original binaries byte
for byte. No new representation, API or test hook ships in this receipt.
The earlier frontier-order rejection and f7e764ab generation checkpoint remain
separate and unchanged.

## Candidate contract

The candidate added `lr_propagation_solve_indexed_result(graph, budget)` while
preserving the existing sparse API and allocation-free subset behavior. The
ordinary serial LALR caller passes its explicit budget. Three existing serial
fallback calls pass their `WorkGraph.budget`; B2 admission, grain, dispatch and
parallel wave publication are unchanged.

The index borrows the propagation graph exclusively for one synchronous call.
It builds one sorted dictionary through the existing `lr_range_merge_result`:
each exact `(first,last)` pair receives one bit. Equal starts, differing ends,
overlapping intervals and propagation/EOF sentinels remain distinct elements.
No numeric interval coverage union, world-crossing cache, persistent index,
second grammar or native implementation was introduced.

Dictionary storage is bounded by the sum of existing seed-range counts. Dense
membership is admitted only when its word count is at most the graph's actual
seed-plus-edge count; otherwise the original sparse solver runs. Node metadata
sizes derive from its type. All new storage uses `WorkBuffer` with the supplied
budget and checked arithmetic. A null budget is only the existing explicit
standalone boundary. Original graph/vector storage contracts were not migrated.

Private pending entries and queued flags reproduce the original LIFO worklist
and edge order. The solver reserves every output vector before publishing any
new range, pending length or queued flag. Capacity/Memory denial releases all
index grants and leaves original logical sets and work intact for direct retry;
any successfully expanded vector still owns its original allocation. Final
materialization follows dictionary order, so output pairs remain sorted.
Scratch expires before return, and every later solve rebuilds from current
inputs; mutation/revision cannot reuse a stale dictionary. No new asynchronous
cancellation mechanism was added; existing coordinator/join/owner contracts apply.

## Matched measurements

Own KinmenB Docker `tower_ecs_b1`, CPU0-11/24GiB, LLVM19.1.1 native x64 Release,
checked-in public768a bootstrap with no private override. Builds used one owned
native cache and the dependency target, up to6 object jobs, compiler jobs1.
No profiling hooks were present in measured builds. Original worklist order
and accepted worker-grain policy stayed fixed.

The existing exact 16/1000-function Tower/C fixtures, language resources and
production `compiler/parser_table.tower` import closure were frozen before
dispatch. CLI samples are fresh processes, warm filesystem, alternating n3
before/candidate at workers1/4. They include dictionary setup, solve, output
conversion, cleanup and the rest of ordinary object compilation.

| Input / workers | Wall median before → candidate (s) | CPU median before → candidate (s) | Peak RSS median before → candidate (KiB) |
| --- | ---: | ---: | ---: |
| Small / 1 | 0.49 → 0.53 | 0.42 → 0.46 | 186860 → 187140 |
| Large / 1 | 0.66 → 0.68 | 0.59 → 0.61 | 237768 → 238852 |
| Small / 4 | 0.55 → 0.60 | 0.50 → 0.57 | 188416 → 189700 |
| Large / 4 | 0.69 → 0.74 | 0.66 → 0.71 | 240600 → 241996 |

All original samples remain in `times.csv`. Serial small is .50/.49/.49 before
and .53/.53/.55 candidate; serial large .64/.66/.67 versus .68/.71/.66. No slow
sample was discarded. One production-unit observation is1.17→1.21s wall,
.81→.84CPU,228988→230432KiB. Its object is unchanged.

Existing cold observer:155 version builds/123 tables/36 reuses remain unchanged.
Table time218.96→250.69ms and complete lookahead137.89→171.43ms regress.
Whole-process cold observation .40→.44s, .35→.39CPU,168956→169056KiB.
Installed whole-process observation .48→.51s, .41→.45CPU,172420→173052KiB;
request table208.21→240.35ms and lookahead133.11→167.95ms. These are single
observer observations, separate from the n3 CLI pairs, and nested times cannot
be added. No membership-only microbenchmark is offered as acceptance evidence.

Cold allocation calls fall2144035→2090041 (-2.5%); installed2562308→2503821.
Charged live bytes stay1893528 and ledger metadata5242880; charged peak rises
58035248→58522288 (+487040). Retained buffers stay36677 cold/48979 installed;
both versions require zero grants/buffer leaks after teardown. This ledger is
not process RSS and does not cover all independent/system allocations.

The representation is rejected: fewer allocation calls do not compensate for
the measured setup/solve/conversion cost. These observations do not isolate
which indexed subphase dominates, and no second representation or tuning sweep
was attempted. Dictionary construction also precedes the dense-size decision;
this candidate provides a linear storage bound, not a demonstrated sparse
high-cardinality setup-time improvement.

## Checks and retained evidence

All24 matched executions print exact15/999. All24 small/large objects and both
production-unit objects match their original references. Canonical observer
output remains976 bytes, hash13832670361687071853. The candidate passed:

- Independent150-grammar closure/state/action/control oracle and range fallback.
- Indexed/sparse solving alternated after mutations in randomized graphs.
- 129-pair word-boundary, equal-start/overlap/sentinel, duplicate/self/cycle cases.
- Capacity denial, every observed allocation failure, direct retry, idempotence,
  zero scratch grants and complete buffer cleanup.
- 257-pair sparse graph with only dictionary-sized allowance, proving the dense
  matrix is not allocated there.
- Grammar equivalence, revision/cache/owner lifetime and cancellation controls,
  parser/diagnostics,300 generated and500 arbitrary-byte regex cases, actual
  native serial/threaded LR controls and exact parser-node symbol/import policy.

One fixture build failed because `expected` is reserved in the public language.
Its original log is retained; renaming that local fixed the fixture. The provider
had compiled successfully. No failing correctness check was waived. Restored
source timestamps were explicitly advanced before the final dependency rebuild;
all three original binary comparisons and the frozen source manifest passed.

Evidence directory: `build/ecs_b1/cache/range_membership_415a`
(`/cache/range_membership_415a` in the owned container). It contains complete
before/candidate executables, frozen sources/fixtures, raw logs, manifests,
`rejected_tracked.patch` and all seven exact candidate source files in
`rejected_sources`, including the added fixture absent from that tracked diff.

Original compiler SHA256:
`3a9a6849cadc66c4a8775a6746d66d5ed4e192d4d560719dc59e5c803da19a44`.
Rejected candidate SHA256:
`e44c3e88544c5f6e8d4bc657a9191509526bc78a4c777ef39028a59d758e48c9`.
Object hashes and exact fixture hashes are in `pair_manifest.sha256`.

The task ends with this measured rejection and restored production behavior.
No public pin, broad native-generation/browser/sanitizer matrix, hosted release
or later-source acceptance is claimed; ROOT retains final release ownership.

Publication reconciliation preserves incoming1a5241cb through complete-history
merge41ee303a9bf4da926ed4fbff64c36e98c10ac0c3. The LR implementation is unchanged;
incoming semantic/defer, pool, observer and fixture changes retain their owners'
evidence. B1 contributes only this receipt and journal. The retained compiler,
functional checks and timings remain exactly at415a54e9; they do not validate
those later compiler inputs or claim a rebuilt latest-main runtime.