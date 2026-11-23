# LR closure scratch capacity trial: rejected

One capacity/lifetime candidate was measured on frozen
`e7558fa836b46c61bc5c46398ba672117c6a3d05`, tree
`e4bf788e58edfe3a409627a0ff4f31b05d1ebd33`. It passes the focused correctness
and ownership checks but provides no useful end-to-end improvement. The original
three source files are restored, and the rebuilt compiler and both test runners
match the baseline byte-for-byte. No runtime change, API or profiling hook ships.
The rejected frontier-order and bitmap trials and the f7 generation checkpoint
retain their original source/binary boundaries.

## Selection and ownership

The previously preserved `serial_remaining_1272/profile_iteration-cold.log`
attributes 592,066 allocations to state construction, 881,413 to lookahead and
169,602 to runtime construction. This is prior profiling evidence, not a new
profile of e7558fa8. Inspection found that `lr_items_close` initializes and
disposes temporary ranges, expanded items and two membership indexes for each
new state. This trial tests only retaining their capacities across closures.

The rejected patch gives each `LRStates` builder one private `LRClosureScratch`.
Every closure resets logical lengths, failure state and membership, rebuilding
the indexes for its current items. Local vector descriptors borrow that owner
and return on every exit; they are not independently disposed copies. Successful
builders release scratch before returning the state graph, and destruction
releases it on failure. Worker closures retain their existing private wrapper;
no shared worker state, dispatch, grain or publication order changes.

The original vector reserve/error paths and allocation ownership remain intact;
there is no new allocator, grant, cap or global cache. This experiment does not
claim to migrate legacy ordinary LR vectors into WorkBudget accounting. Existing
explicit compiler-buffer grants remain unchanged and are measured separately.
Exact range pairs, overlaps, original LIFO order, closure order and state identity
are unchanged. The patch touches only `lr_analysis.tower`, `lr_states.tower` and
the successful coordinator cleanup in `lr_state_work.tower`.

## Matched measurements

KinmenB container `tower_ecs_b1`, CPU 0-11, 24 GiB, Ubuntu 24, LLVM/Clang 19.1.1,
native x64 Release; one `/cache/native` owner. The ordinary checked-in public768
compiler is used with `TOWER_BOOTSTRAP_COMPILER` unset. Its SHA256 is
`768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`.
Before/after compilers use the same complete frozen scaffolding, paths, inputs
and flags. There is no persistent grammar cache or temporary profiling hook in
measured builds. The full source manifest is preserved.

Fresh processes, warm filesystem: n3 alternating serial pairs on the existing
16/1000-function inputs; one counterordered four-worker pair per input. CPU is
user plus system; RSS is GNU time's maximum resident set in KiB. Every object is
compared against the original frozen reference and linked/executed to exact
`15`/`999`. All 16 fixture objects and executions pass; the two production-unit
objects also match. No sample was discarded.

| Input / workers | Wall before -> candidate (s) | CPU before -> candidate (s) | Peak RSS before -> candidate (KiB) |
| --- | ---: | ---: | ---: |
| Small / 1, n3 median | 0.49 -> 0.49 | 0.42 -> 0.42 | 185712 -> 186536 |
| Large / 1, n3 median | 0.63 -> 0.63 | 0.56 -> 0.56 | 238096 -> 237952 |
| Small / 4, n1 | 0.55 -> 0.55 | 0.51 -> 0.50 | 188784 -> 186828 |
| Large / 4, n1 | 0.70 -> 0.69 | 0.66 -> 0.66 | 239764 -> 239476 |

Serial small wall samples are .49/.49/.48 before and .48/.50/.49 candidate;
large .63/.64/.62 and .63/.64/.63. Small RSS rises 824 KiB at the median without
a time benefit; the single four-worker differences do not establish a speedup.
One frozen `compiler/parser_table.tower` observation is 1.16 -> 1.15 s wall,
.79 -> .78 s CPU and 229152 -> 229320 KiB; this is not an n3 performance claim.

Existing cold observer: .41 -> .41 s wall, .35 -> .36 CPU,
169432 -> 169224 KiB. Installed observer: .49 -> .49 s wall, .42 -> .41 CPU,
172720 -> 172408 KiB. Cold table time regresses 214.21 -> 218.12 ms and nested
lookahead 134.67 -> 139.76 ms in these single observations. Counts remain
155 version builds, 123 table builds and 36 structural reuses. Nested times must
not be added. Canonical output remains 976 bytes/hash 13832670361687071853.

Cold allocations fall 2144035 -> 2108324 (-35711, 1.7%); installed allocations
2562308 -> 2517503 (-44805, 1.7%). Charged live bytes remain 1893528, peak
58035248 and ledger metadata 5242880. Retained buffers remain 36677 cold and
48979 installed. Both observers require zero grants and buffer leaks after
teardown. These counters are not process RSS or accounting of all system memory.

Thus capacity reuse removes some allocation work but fails the latency gate.
The remaining measured table cost is largely lookahead construction/propagation
(134.67 ms nested within 214.21 ms table time before this trial). Existing
`lr_propagation_solve_result`/exact-range union remains the concrete costly
producer from the preceding profile; this trial provides no new safe replacement
and does not retry either rejected representation/order or begin another tune.

## Checks and restoration

One dependency-aware baseline target refresh incorporated current published
providers; each candidate/restoration build then regenerated only parser-nodes
and linked the compiler and two runners (four actions). No public-leaf duplicate
compile or full matrix was run.

Candidate checks pass: `lr-order` (allocation-denial sweep, same-analysis retry,
cleanup and independent 150-grammar closure/state/action/propagation oracle),
`grammar-equivalence`, `structure-reuse`, `parser`, `regex`, `diagnostics`, and
native `tower-lr-work-tests ... lr`. These cover nullable/recursive and overlapping
ranges, revision/cache identities, cancellation, serial/parallel equivalence,
real worker overlap and lifetime. The exact parser-nodes symbol policy passes
against its actual `llvm-nm --undefined-only` report; no policy entry changes.
No compiler or focused-check failure was hidden. The failed gate is performance.

Before restoration the complete rejected patch and three source files were
saved. Restored timestamps were advanced explicitly so Ninja could not retain
candidate objects. Rebuilding then comparing all three executables and checking
the original complete source manifest passed. Owned jobs drained; todo unchanged.
No broad sanitizer, browser, generation, pin-adoption or hosted check is claimed;
ROOT retains the final integrated milestone.

## Reproduction and artifacts

Full artifacts: `build/ecs_b1/cache/closure_scratch_e755` (`/cache/closure_scratch_e755`).
OS command scripts: `build/ecs_b1/closure_scratch_e755.sh` and
`build/ecs_b1/closure_scratch_pairs.sh`. Logs retain source/fixture hashes, commands,
original samples, before/candidate binaries, candidate sources/patch, checked
objects, nm report, observer ledgers and restoration evidence. The same `.c`
reference inputs and earlier Clang -O2 -fwrapv controls are preserved, not rerun
or relabeled as current measurements. Private artifacts are not repository inputs.

Build: `env -u TOWER_BOOTSTRAP_COMPILER cmake --build /cache/native --parallel 6
--target towerc tower-frontend-tests tower-lr-work-tests`.
Measured object command uses `--jobs 1`/`4 --emit object
--target x86_64-pc-linux-gnu --bedrock input/bedrock.tower
--foundation input/foundation.tower`, with identical absolute frozen paths.
The production unit additionally uses `--library --timings`.

SHA256 identities:

- Before/restored compiler: `8488788470d819cd6d7780dfbce41b53294eab86e325a3a958c68f11f17c0369`.
- Rejected compiler: `695c79d980ff9f0678910cc80b371b45769637dbb3196d5d1d9946be186e1a81`.
- Candidate patch: `784774048f7bea529f3b3162e041c909726b43f970b1dfa25698ca036b9d5df7`.
- Pair manifest: `96beb33abc3cda8968508820b11503f8fa2531ad27f241c451a5a7b3bcf21ec8`.
- Small object: `cdc5a6ec0f2b12f1f7a622f45a27859e374558867df97470c8120cd81ddfb407`.
- Large object: `ae9e824d75213b15baa1811f9ec4db04a2f044cce25746d291b888c7952f4e08`.
- Current frozen production-unit object: `c8831519174e410abf5116ebb6b25610696e11644bd8283ef1a15194b659fd56`.
