# D1 — independent lowering frontier acceptance

Accepted for the reviewed native scope; no production defect found. Added one missing observable-order regression, without changing the scheduler or its bounds.
ROOT's original45-minute artifact wait completed successfully: source `82668bf424221538373f516d4895198bcca65b75`, tree `ca45e508f6f094445536bd7e9fc5cb9e3e3339da`, repair `e50072cd00492178924c8ab685f85c257369690e`.
Delivered patch SHA256 `88089463783893037744aef2544918bcb59e4155f7fa5ee16f706adee2c6a119` and all three published blobs match. Preflight `5b8468eb` and the rejected registration/transpose/old-cursor evidence remain historical.
Exact production/test/callee identities: [27-path published-versus-tested map](lowering_frontier_peer_82668bf4_blobs.tsv). Only D1's lifecycle fixture differs from that published candidate.
Production blobs: `semantic_lowering_work.tower` `2089e098b9469b0ec474fc7baa4c126e5e630b8c`; `semantic_context_types.tower` `96380a56a793c264deb70f626645b1a2d2f31a62`. Owner fixture before D1: `b415861b4bf0febff2bbc9413c51da78308771cc`.

| Reviewed boundary | Independent disposition |
| --- | --- |
| Completed-prefix identity | No supported same-revision/profile operation reopens Succeeded as Ready. Request returns the existing task; seal requires Building; yield/suspend/observe require a current Running ticket. Reset requires joined terminal tasks and different identity, which clears both positions. |
| Failure after completion | `work_fail` can mark a task Failed; that does not make it eligible again. Full `sem_lower_state`/finish scans still inspect entries below the prefix, preserve source order and Signature-before-Expression failure priority. Cancellation fails before selection. |
| Late registration and order | Full registration remains. New body/signature/append rewinds before admission; moved existing ordinals conservatively rewind. Actual function mutations are append and stable downward compaction, not arbitrary external vector edits. Existing ordinal names/subject identity remain intact. |
| Admission/publication | WorkGraph still authorizes each take and dispatch; Body/KnownSnapshot/own-signature edges remain. Block refresh consumes the published prelude. Stage holds, joins, alias/completion reservations, first typed cause and cleanup are unchanged. |
| Lifetime/memory | Derived fields contain only two positions and revision/profile, no owners or result pointers. Initialization/disposal clear them; private snapshots copy them but lowering workers do not mutate coordinator selection. The native descriptor grows32B; typed consumers rebuild, with no new heap/index or cap increase. |

New `lifecycle_first_signature` starts with completed scalar peers and an existing aggregate declaration whose body is absent. After restoring that body, its new Body query holds both transforms Waiting; repeated pumps cannot publish a prelude.
Releasing the real dependency must first publish the signature while Expression dispatch remains0, then lower exactly that new body once. Assertions retain nominal record identity, target pointer width, hidden parameter, completed-peer call counts and final zero budget bytes/grants/lanes/world ownership.
Four configurations: target32/64 × requested workers1/4, tested through both standalone and integrated entries. No assertion reads cursor fields or derives expectations from cursor positions. Original late-hole/append/reorder/revision/profile, failure/partial-take/pinned-history/denial controls remain unchanged.

| Actual independent execution | Result / whole-process wall, CPU, maximum RSS KiB |
| --- | --- |
| Exact three CTests: query-continuations, semantic-lifecycle-frontier-tests, semantic-staging-frontier-tests | 3/3 pass, zero skips/timeouts;38.16s /39.88s /291408. Original180/60/60s guards unchanged. |
| Existing1-unit16-body dependency/uniform reference, workers1 | Pass;1.57s /1.53s /157524. |
| Same reference, workers2 | Pass;1.72s /1.77s /161652. |

The reference invokes ordinary Tower interpretation of `answer()` and `body_0(36)`, requiring literal42: four checked results across two processes. All three generated source/import/Foundation files match across workers; canonical20738B SHA256 `76849f7eb1b152387a9afa31a160e20ff922940f94c4fcce6c2a74f028e04796` also matches the owner's retained baseline.
Integrated query controls retain ordinary32/64 execution/canonical, lazy dependencies, source-order diagnostics, stale receipts, cancellation and ownership assertions. Staging frontier separately covers executed/untaken producers and actual semaphore-controlled overlap. Deck affinity limits requested4 to at most2 lanes; no four/eight-core speedup claim.
Public default compiler SHA256 `04ae22d0e73e3674e43895ea2d1efc13da8b7a6b4704df5815369490e6fcfc47`; existing D1 LLVM19 container image `4be584fb42a6cefb921b8f8bd686f61ef6e7e721eee2393b2ab1dfce16a7f4f6`, CPU0–1/3GiB, Release, outer1, one cache/lock. No toolchain installation.
One dependency-aware four-target build,45 actions:330.49wall/320.60CPU/868932KiB. These and the reference timings are validation costs; D1 changed tests only, so no production before/after performance claim applies.
[A2's owner evidence](compiler_lowering_frontier_cd70e276.md) stays separately attributed:43026→4105 visits, same4105jobs/17windows; single4096/8 mean wall−2.43%, multi12×256/8+1.28%, unchanged retained ownership and variable parallel peaks. This review does not turn those tradeoffs into universal profitability.
Raw `build/d1_ecs/lowering_peer_r3/`: artifact wait/identity/patch, preflight contracts,27-path map, exact commands/selection, build/time/CTest logs, binary hashes, two reference logs/artifact directories and empty byte diff. Inputs rechecked after execution; all processes drained and lock released.
No new failure, producer repair, cap change, full compiler/generation/browser/sanitizer or deployment run. Existing failures and prior rejected experiments remain preserved. Later unrelated source inputs are excluded; matching blobs reuse this evidence. ROOT owns combined adoption and release.

Final joined validation: merge `18b06fe0ed8c7898b0cce95e109e07e3829cff30`/tree `064e6ffded4e23dc00484d8ad01bca74b47bd9e2` adds L1's published pool-range claims; only `work_pool.tower` changes in the27-path map, to `fa3657342f4dbc26abd78bb5f3df8cdd3cb9f78c`. Its bounded claim arithmetic/positive lane count and joined borrowed-batch lifetime were checked; this is not a replacement for L1's wider pool acceptance.
A necessary30-action affected rebuild passed295.11wall/285.90CPU/868120KiB. The same3/3 CTests pass36.99/38.59/292872, and the two literal-reference runs pass1.60/1.57/157468 and1.63/1.68/161848; all source/canonical bytes also equal the original boundary. `merged/` retains exact commands/results/binaries and the one-row changed-blob map. No production fix or cap change; jobs drained and lock released. The frozen candidate and owner performance evidence remain distinct.
