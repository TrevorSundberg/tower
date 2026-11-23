# LR preparation admission trial: rejected

The held-reservation candidate passed correctness and ownership checks, but
provided no useful measured improvement. Uniform twelve-unit workers4 stayed
unchanged; workers12 regressed5.8%. The production change and its trial tests
were restored. The rejected patch and all measurements are retained.

The earlier attribution also needs correction: **the existing serial preparation
builds the same item graph**. A zero `LookaheadGraph` event count after this change
would not prove that graph construction was removed. No graph-elimination or
speedup claim is accepted from those events.

## Source, ownership and the candidate

Frozen published main `902f7c4dcbd924090e7f706260f67e4b812da7cb`, tree
`ae1a4b18501565680762d9cb0a26128ee03c13a9`. The required pull was documentation-only,
but published L1 loop-query and L2 formatter/importer inputs since the prior
3ad7 measurement required a current-source baseline build. No drafts were used.
The original3ad7 binary/resources and614da574 receipt remain unchanged, rather
than being relabeled as current measurements.

Audit covered `lr_states_lalr_parallel_result`, the closure/range fallback,
propagation/action callers, `ParserAdmission`, checked `WorkBudget` reservation,
synchronous `WorkPool` dispatch, ticket cancellation and deferred cleanup.

The candidate reserved extra lanes through existing `parser_admission_open_result`
before selecting item-graph worker preparation. Zero extras selected existing
`lr_states_lalr_owned_result`; required reservation errors returned unchanged.
An admitted receipt remained owned by the caller through preparation, both
dispatch phases, ordered joins and cleanup. Private helpers borrowed that receipt,
bounded job count by its lanes and did not reserve again. Existing callers retained
phase-local wrappers. The overlap/range fallback was unchanged. There was no lane
availability peek, forced reservation, new allocator, uncharged new worker buffer,
global cache or grammar authority.

The trial regression used the existing shared-budget fixture with full,
exhausted and partial outer grants. It checked exact ordered states/actions,
held lanes at preparation/wave boundaries, continued admitted waves and restored
lane/byte/live-grant snapshots. Existing denial/retry and failure-order tests
also passed. Its graph counter proved selection of a wrapper only; it did not
prove absence of the shared graph producer. This distinction is part of the
rejection, not a weakened acceptance criterion.

Rejected patch SHA256:
`53f3884e6d81559c7d2786ae98d2763c53ba4134d09a9fe22452bc764b079fe1`.
Only `compiler/lr_work.tower`, `tests/lr_work.tower` and `tests/lr_budget.tower`
were changed in the candidate. All three original files were copied from the
frozen input snapshot after jobs drained; their original manifest matches.

## Matched measurements

Own `tower_ecs_b1`, CPU0-11 (six physical cores/twelve SMT lanes),24GiB,
native x64, Linux6.18 WSL2, Clang/LLVM19.1.1, Release, production allocator.
Public bootstrap SHA256
`768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`, no environment
override. Initial disk113GiB free, owned jobs drained. One dependency-aware
target invocation per baseline/candidate/restoration; no duplicate leaf build.

Current baseline build:16 actions,38.25s wall/85.18s CPU/1073680KiB peak child
RSS. Candidate:5 actions,21.82s/22.46s/926712KiB. Targets were the existing
frontend profiler, native LR/units runner and focused frontend runner.

Same existing `frontend_units_profile` fixtures: `dependencies uniform`, width8,
backend0/optimized0,1x16 and12x256 at n2, plus1x4096 at n1. Inputs use the same
generated Tower source/helper bytes as the preceding receipt. Current before
and candidate use the same frozen resource path; their complete canonical bytes
match. L2's new formatter intentionally changes canonical text versus3ad7, so
the old canonical hash is not presented as a current-source expectation.

Fresh process/world, warm filesystem, observer disabled in timed samples.
Version, workload and width orders alternate; no samples discarded. Existing
outer clocks remain as in the prior measurement tool. Four separate observer
controls cover twelve-worker multi-unit and large single-unit work before/after.
Timing excludes post-join reference execution, formatting and teardown; external
whole-process user/system/wall/RSS logs are retained separately.

| Fixture | Workers | n | Before wall/CPU s | Candidate wall/CPU s | Before/candidate RSS MiB |
| --- | ---: | ---: | ---: | ---: | ---: |
|1x16|1|2|0.4193 /0.3827|0.4178 /0.3810|173.74 /173.44|
|1x16|12|2|0.5056 /0.5199|0.4963 /0.5077|176.21 /177.24|
|12x256|1|2|6.4153 /6.0746|6.5684 /6.2266|816.95 /817.30|
|12x256|4|2|4.4384 /14.1943|4.4437 /14.2466|1101.38 /1101.45|
|12x256|12|2|4.9389 /40.1303|5.2243 /42.9696|1857.76 /1854.94|
|1x4096|1|1|2.6308 /2.5919|2.2405 /2.2033|793.83 /793.46|
|1x4096|12|1|1.9797 /3.8032|2.0758 /3.9997|796.62 /796.99|

n2 medians are the midpoint. Serial multi-unit observations were
6.5517/6.2790s before and7.4000/5.7367s candidate: substantial variation, not a
reliable improvement. Four-worker paired directions disagree and its median
changes only+0.12%. Both twelve-worker pairs regress:4.8267->5.1809s and
5.0510->5.2678s. The large n1 serial reduction is not credited as a change to
the untouched serial fast path; its twelve-worker control regresses4.9%.
No extra sweep or second optimization was attempted.

All24 timing samples and4 observer controls pass known interpreter results42/42,
complete source/canonical comparisons for every unit, zero post-join lanes and
checked zero-grant owner destruction. Retention is identical before/candidate:
small20,180,310-20,183,134bytes; single566,920,459-566,923,283;
multi633,076,516-633,110,236. Charged peak and RSS remain bounded by the existing
fixture budgets. Production allocation-call counts were not collected. Original
source, binary, command, output and memory records are preserved.

## Why the apparent graph saving is not real

The existing code at this freeze is decisive:

- `lr_states_lalr_parallel_result` surrounds its call to
  `lr_states_propagation_items_result` with `LookaheadGraph` events.
- `lr_states_lalr_owned_result`, the requested existing serial preparation,
  also calls `lr_states_propagation_items_result` for safe grammars, then the
  serial solve/actions. That call has no `LookaheadGraph` event.
- Thus admission-aware selection skips worker owner/pool/parallel scratch
  setup, but **does not skip the common derived graph**. Avoiding that graph
  would require a different preparation strategy, outside this bounded attempt.

The separate multi12 observer consequently reports852->0 wrapper events and
zero waves in both versions. The852 calls' before CPU is1344.08ms (the previous
receipt measured1274.95ms); neither number is established removable work.
Aggregate lookahead CPU barely changes3425.60->3336.31ms, and aggregate grammar
build CPU is23055.84->23016.36ms. Both versions still build1404 tables across
twelve worlds. The apparent event deletion cannot establish graph deletion.

When lanes are available, the large single-unit controls retain71 observed
item-graph phases,39 propagation waves and67 action waves in both versions.
Actual LR peaks are4 propagation threads/3 action threads, and semantic peak12.
Multi-unit outer spans prove12 distinct simultaneous threads. Shared peaks stay
bounded; observer outer-ready vacancy is1.571->1.202lane-ms. No missed refill,
double reservation, lingering grant or scheduling starvation was demonstrated.
The candidate does not solve the dominant repeated grammar/table CPU cost.

The finite residual is common `lr_states_propagation_items_result` construction
and the surrounding version/table work across independent worlds, together with
the already-observed CPU amplification. These observations do not identify a
specific lock or license another LR/cache rewrite. Correct producer-level
observation is required before calling a graph avoidable; no new framework or
further tuning is proposed in this task.

## Validation, restoration and evidence

Candidate checks passed: native LR/reference/range/lifetime and new admission
controls; full units including original finite-budget Capacity error, retry,
ordered failures, independent worlds and cancellation/drain;150 randomized
grammar/propagation oracle; grammar equivalence; grammar resource failures.
LR was1.74s wall/2.25s CPU/116624KiB, units13.52s/22.93s/822972KiB. No compiler
or test failure was suppressed; performance and the incorrect attribution are
the reasons for rejection. No sanitizer/generation/browser matrix was run.

The restored dependency build reproduced all three original current902 baseline
binaries byte-for-byte. Restored source timestamps were refreshed to prevent
stale candidate objects from surviving; the full original source manifest also
matches. The five-action restoration took21.96s wall/22.66s CPU/922296KiB.
Restored LR passed1.78s/2.30s/118328KiB; restored full units passed
13.66s/23.18s/829972KiB. The rejected source copies, patch, candidate binaries and
logs remain separately preserved. Older source/binary identities were not changed.

| Executable | Current902 baseline SHA256 | Rejected candidate SHA256 |
| --- | --- | --- |
|frontend profile|07b0bea2f57f6f62b01e6eac042bf0c4e607e5cd33c4c755c71314d4e6b6094c|9b833aacf2ca11bc25ae8cde804c44ceec19154e32973b89eb28c4944b35f54d|
|LR/units runner|dea766f2331c604947becad4965b7d0ef9222385d5db2960e7ab2b232097371c|934fd2ac1999fa7b27818c1f316eba6f9701f1690f1cb467cff01cde7fbdf0f4|
|frontend runner|18141297cd54033ce943d18891b5f78a1da3e6591cf9949d3abe6b53112747e7|dc81f595af01f2289e43237d7dd52f28f9fd744e833fea104c132b45ebacf0b4|

Full raw evidence: `build/ecs_b1/cache/lr_admission_902f` (`/cache/lr_admission_902f`).
Concise handoff: `C:/Sandbox/build/codex_ecs_20261122/B1/lr_admission_902f7c4d`.
The preserved prior3ad7 profiler remains
`f092a2aa9ef57e926f201c863f41405f5b0b4ba279d17827410130d0d413e3b5`.
ROOT retains final adoption/publication. This task publishes a finite negative
result and attribution correction, not a production optimization.
