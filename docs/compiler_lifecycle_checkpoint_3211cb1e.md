# Native lifecycle and dependency checkpoint

All requested checks passed on frozen published main
`3211cb1eab6a9582ab0b4ceb2c39ca4283a2532b`. This receipt covers that source,
not later compiler changes merged during publication. No production edits were
needed. Older 48d/e755 full receipts remain historical.

## Inputs and commands

Existing L1 public-bootstrap cache `/root/.cache/tower/l1_ecs_native`,
Orchestral-Revng Ubuntu24.04, Release/LLVM19, CPU0-3, 24GiB process address-space
ceiling. No private bootstrap override. Owned jobs were drained before the pull;
about111GiB was free on C and923GiB in WSL. Other-lane work was observed and left
untouched, so these are validation costs, not isolated performance comparisons.

The only dependency refresh was `cmake --build ... --target tower-lr-work-tests
--parallel 4`: one runner link, no compiler leaf rebuild. The test commands were:

```sh
tower-lr-work-tests /mnt/c/Sandbox/tower-agent-1/scaffolding lifecycle 0 41
tower-lr-work-tests /mnt/c/Sandbox/tower-agent-1/scaffolding dependency-units
```

The endpoint41 was derived from the current `SemanticLifecycleCase` enum:
42 members, `RootCall` through `LocalAggregateCapture`. Both selectors ran once,
under finite external timeout guards. No all/type-smoke/bodies duplication,
new probes, browser/LLVM/generation/sanitizer matrix or extra performance series.

## Results and cost

| Phase | Result | Wall seconds | CPU seconds | Peak RSS KiB |
| --- | --- | ---: | ---: | ---: |
| Runner dependency refresh | Exit0 | 0.84 | 0.15 | 74,428 |
| Lifecycle0-41 | 42 started,42 completed; exit0 | 101.89 | 95.61 | 236,180 |
| Dependency units | All four original trials; exit0 | 7.65 | 14.01 | 760,692 |

Lifecycle covered168 source trials:42 cases at32/64 bits and workers1/4.
The26 positive cases also performed52 serial canonical Foundation reparses and
known-output executions. The16 negative cases retained their original expected
diagnostics, no incomplete publication, and serial/worker error-byte comparisons.
Positive canonical bytes matched across worker settings within each width;
width-dependent expected layouts remained distinct. Exactly-once output and the
single instantiation-trace assertion passed. No failure or unstarted case remains.

The original dependency selector uses its64-bit profile, four units per batch,
and workers1/4 for both healthy and expected-cycle trials. Independent answers
42/43/44/45, forward decltype/comptime and ordinary type-producing helpers,
untaken cyclic reads, canonical bytes, diagnostic order and offsets all passed.
The taken imported cycle outranked the later missing-name error; failed batches
published no partial program.

| Dependency trial | Observed outer overlap / threads | Work wall seconds | Peak owned-budget bytes |
| --- | --- | ---: | ---: |
| Healthy,1 worker | 1 / 1 | 3.091491908 | 161,241,722 |
| Healthy,4 workers | 4 / 4 | 1.570332919 | 424,128,391 |
| Expected cycle,1 worker | Not reported for failures | 1.318345927 | 125,411,090 |
| Expected cycle,4 workers | Not reported for failures | 1.411510037 | 405,359,789 |

Every dependency join asserted zero used lanes and bounded peak reservations.
All220 lifecycle batches and four dependency batches returned through the
existing world/budget disposal guards, which trap if borrows or grants remain.
No cleanup trap occurred. These are actual assertion results, not sanitizer or
universal race-freedom claims. No runtime performance improvement is claimed.

## Identities and limits

- Runner: `14ee08755c22c58d06748196013b2b8129f50dcb55001b9c01138d1ea7213f52`
- Semantics object: `c131e34c69a6a8346c4fceb1ad3f8435678baff8e4d82b903a8b66c6e563309f`
- Evaluation object: `6486558075b66fbc67297e1cb086c6599c9b1fcaca830054187bba760953d31c`
- Checked-in bootstrap: `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`
- Complete Tower/CMake input manifest, identical before/after:
  `7924750dd8810e43656e11ed049c99f864eb5f33447e7654b5ef18b4732345a9`

Exact commands, all phase exits/stdout/stderr/time reports, enum members,
resource hashes and manifests are preserved in
`C:\Sandbox\build\codex_ecs_20261122\L1\logs\lifecycle_checkpoint`;
the external summary is `lifecycle_checkpoint_receipt.json` in that lane.

The focused mutable-header, loop and query results are reused at their prior
recorded boundaries, not relabeled or repeated. No independent capture-proof
regression was exposed, so no A1/A2 production work was duplicated or failure
route needed. Their separate active gates, later compiler revisions and ROOT's
portable/shared/hosted release acceptance remain outside this checkpoint.

Publication reconciliation preserved complete incoming history through merge
`1b7ba13c1d362d42ce5097475e48452a27d12dfd`. In particular, A1's executable alias
publication repair `b78d606b` and the later exact-output/alias test gates are
**excluded** from this frozen run. Their `semantic_execution_work.tower`,
admission/alias tests and CMake registration changes require their own acceptance
boundary; the lifecycle matrix was not restarted or relabeled after that merge.
