# Native execution and module cache test selection

The reference is Linux x64 public main `10271859ca2aad1c7b7ff9b1ab056ed4204725e0`.
The execution suite keeps both body-type selectors, the aggregate and its
signed and canonical pointer consumers. The separate `retained-sources`
selector checks the model through an alias on the same retained execution
session. The module cache executable and parser selector continue to use the
original exported functions. The test runner adds its normal per-test reports
on stderr.

## Original predicates and their owners

All line numbers in this table refer to the frozen sources. The packet includes
a line-by-line map of the unchanged predicate bodies, with their exact text
and destination lines.

| Frozen source and lines | Selected predicate owner | Observations |
| --- | --- | --- |
| module_body_type_checks 27–107, 109–148 | module_body_type_checks_test | Graph/Fast output, fuel, exact mapped diagnostics, immobile failed machine, canonical bytes across engines and workers, Foundation reparse and final budget. Both CLI modes read the original fixtures. |
| execution_world 242–527 | retained_sources_test | One live environment and session per width of the worker pool. Real provider and alias edits, distinct nominal fields, invalid leaf and repair, suspended Fast machine, alternating 4/8-byte targets, overlap and final cleanup. |
| frontend_modules 47–71, 76–102, 104–220 | module_cache_suite_test and admission_test | Diamond order, seed diagnostic, isolated roots, exact graph counts after edits, import cycle, missing and invalid input, successful recovery, relative shadowing, builtin/fallback and absolute path cases. |
| frontend_modules 467–507 | module_cache_suite_test | Private component 17, two distinct request roots, shared declaration, reset with surviving requests. |
| frontend_modules 509–585 | admission_test and module_cache_suite_test | Session steps, 820–842 failure codes, two environments, interleaving, live reset, retirement, idle reuse and final destruction. |
| frontend_modules 233–301 | admission_test | Cached declaration identity, unchanged and invalid baseline publication, actual changed source, current and previous generation, world clear, final grants. |
| frontend_modules 303–396 | admission_test | Checked startup and rejection with prior state intact, bound/unbound/private ownership, exact Capacity, successful retry, entity and component counts. |
| frontend_modules 398–465 | admission_test | Both deny-store and deny-clone paths on a full cache, pointer-for-pointer cache entries, resource reason, counts and charges, retry and zero owners. |
| frontend_modules 587–741 | leases_test | Literal source ranges, seed and declaration identities, idle document references 2→1, live old reader cursor and generation, root and sibling capture ownership after retirement. |
| frontend_modules 743–844 | leases_test | Ordered grammar and tokens, exact pin grant/refusal/retry, miss through a different resolved path, lender eviction, aliased provider edit, old and new parse results, closed ledger. |
| test_file_rule_checks 12–101 | discovery_test | In-memory owner and suffix, frozen selection keys, actual companion count before and after an edit, refused replacement preserves the current key. |

Lines 221–231 of frontend_modules still coordinate the remaining tests in the
original order and return the original failure codes. The exported lease tests
still precede this call in the standalone. The selected module suite runs nine
declarations directly. The discovered selection also runs five budget, eight
graph, four LR and five formatter cases. The formatter cases use their existing
native file provider.

## Reproduction

Run from a Release build with the checked-in compiler, Linux native, backend,
work, module and execution tests enabled, LLVM 19, and compiler jobs 1. Host 7
used the native option and the installed LLVM backend CMake include recorded
in the packet's configure.sh. Run `tower-execution-tests ABSOLUTE_SCAFFOLDING
body-type-reproduce`, `body-type-queries`, and `retained-sources`. The no-mode
invocation runs the aggregate. Run `tower-module-cache-tests` from scaffolding.
The following command checks the selected counts at jobs 1 and 4.

```sh
ctest --test-dir "$build" --output-on-failure -R '^tower-(module-body-type|retained-sources|module-cache)-(owner|direct)-jobs-[14]$'
```

## Raw outcomes on host 7

The checked-in compiler hash was `7430bdb39f73b285687fedb2945d370eaf51d2cc2fa289e5e0041cc15ad1b896`.
The host had an AMD EPYC 7502 with 32 cores and SMT, a cgroup CPU quota of
3,071,999 µs per 100,000 µs and a memory ceiling of 91,586,822,144 bytes.
Measured processes had affinity 0–7. Each invocation started a new process.
The Ninja cache was new for the reference build and warm on the final no-op
build. The filesystem cache remained warm. The unchanged protocols inside
the fixtures distinguish first admissions, reuse, invalidation and retry.

| Original mode | Base wall / CPU s, RSS KiB | Final wall / CPU s, RSS KiB | Stdout |
| --- | --- | --- | --- |
| body-type-reproduce | 0.34 / 0.32, 74,772 | 0.29 / 0.28, 73,852 | 0 bytes |
| body-type-queries | 6.36 / 6.54, 86,504 | 5.81 / 6.37, 80,736 | 2,988 bytes |
| retained-sources | 3.01 / 3.09, 99,356 | 2.66 / 2.83, 99,368 | 216 bytes |
| tower-module-cache-tests | 0.08 / 0.08, 56,968 | 0.08 / 0.07, 57,020 | 209 bytes |

These are individual samples on the same host. Direct native `--test` of
the module suite, including compiling the guest, took 16.06 / 14.25 s at
jobs 1/4. The discovered selection took 18.29 / 16.49 s and peaked at
685,040 / 707,956 KiB. It compiled the additional formatter and compiler
cases. Reusing the standalone avoids that compilation on repeated invocations.
The exact commands, CPU and RSS for every selection are in `times.tsv` in
the packet. The separate jobs-four standalone build recompiles the entry
objects and parser fixture with four jobs and reuses the common release
objects. Its depfiles identify the sources of each changed object.

Ten independent mutations changed a single expected observation at a time.
The packet records the diff and output from the ordinary and selected runs.

| Changed expectation | Legacy exit | Selected exit |
| --- | ---: | ---: |
| First Graph/Fast output 42 → 41 | 134 | 1 |
| Nominal provider east → left | 1 | 1 |
| Module count following the edit 2 → 3 | 35 | 1 |
| Reused parser equal → distinct | 70 | 1 |
| Recovered clone graph size 3 → 4 | 134 | 1 |
| One-byte startup denial Capacity → Invalid | 134 | 1 |
| Changed baseline reuses the original declaration | 134 | 1 |
| Remaining idle-document references 1 → 2 | 134 | 1 |
| Newly acquired reader pins 1 → 2 | 134 | 1 |
| Selected companions after inserting mem_spec 2 → 1 | 1 | 1 |

The original result codes 803 and 838 appear as 35 and 70 in process status.
The body-output check flushes its diagnostic and aborts. The retained-model
check prints its message and exits. The native runner reports exit 1 when
those guest-side exits prevent a normal test completion record. The clone
fixture also aborts at its original unlabelled size check. The other trap and
status cases retain their original messages or the selected case location.

The complete execution aggregate returned 0 on both builds with identical
14,725-byte stdout and 2,004-byte stderr. Wall time was 96.26 / 97.09 s,
CPU was 107.83 / 109.04 s, and peak RSS was 169,844 / 171,160 KiB.
All six signed, canonical-order and constant-address pointer invocations
returned 0 at the two target widths. Their streams and the two generated
signed-pointer source files compared byte for byte.

The 12 direct and discovered invocations all returned 0. In order, the body,
retained source and module suites selected 2, 1 and 9 cases directly and
7, 6 and 31 through discovery, at both job counts. Each selected run's
stdout matched its original executable. All 14 focused CTest registrations
passed, including the original retained-source and module-cache commands.

Separate observation builds added prints immediately after the original
checks. Their four pairs of stdout and stderr matched byte for byte. The
22 body-query trials each returned their bytes, grants and lanes to zero.
On the minimal reproduction Graph took 23 steps and Fast took 61. Both
produced 2,140 bytes of canonical Foundation and empty guest output.
The retained edit sequence reached an LR overlap of two with two workers.
Peak charged bytes were 32,976,295 and 36,768,700 with one and two workers.
Both full-cache denials retained 1,244 live grants at 134,217,728 bytes.
The seed-clear case peaked at 2,737,848 bytes. The lease and clone fixtures
each closed with zero bytes, grants and lanes. The observer patches and
per-trial outputs are included so the printed values can be traced to their
original budget, execution or formatter snapshots.

## Instrumentation and repeated runs

The normal release module and retained-source commands each ran five more
times in fresh processes. All ten compared equal to the reference streams.
Every retained two-worker run observed simultaneous LR activity on two lanes.

Both CMake sanitizer profiles instrumented the changed Tower predicate code
and used the runtime allocator and production worker transport shown by
the executable link maps. The packet includes instrumentation excerpts for
the body trial, retained model, cache and worker functions. The relinks
with map output were byte-identical to the binaries under test. For each
profile all four ordinary modes returned 0, with both streams identical to
the release reference. Leak detection was enabled for the address runs.
The deliberate out-of-bounds probe produced an ASan heap-buffer-overflow
and exit 1. The worker race control produced a TSan data race and exit 66.

| Ordinary mode | ASan wall s / peak KiB | TSan wall s / peak KiB | TSan startups that failed before the test |
| --- | ---: | ---: | ---: |
| modules | 0.50 / 171,272 | 1.03 / 109,400 | 14 |
| body-type-reproduce | 2.03 / 471,676 | 5.86 / 194,848 | 42 |
| body-type-queries | 40.74 / 607,392 | 136.64 / 248,896 | 4 |
| retained-sources | 18.97 / 660,800 | 64.47 / 326,292 | 28 |

All 88 failed positive-suite startups and eight race-control startups hit
the host restriction on changing the process personality. Each attempt has
its own diagnostic, time and exit status. The profiles exercised the predicates
through the standalone commands. The selected guest launcher was exercised in
Release. The project implements address and thread instrumentation for generated
Tower IR. A UBSan profile is unavailable.

The parser-only profile with module checks enabled also built its dedicated
parser test executable. Recompiling the original parser fixture object from
the frozen source and relinking it with the same parser-only service objects
provided the comparison. Both the ordinary `--suite modules` selector and
the default parser aggregate returned 0 in both builds. Their output and
diagnostic streams compared byte for byte. The parser aggregate wrote
1,788 bytes to stdout and 193 bytes to stderr.

Host 7 started with 46,430,396,416 available filesystem bytes. Per-profile
and final disk readings are in the packet. Runtime results apply to code
commit `bc1da0921848950528db7b4524acdef1f088bf5f` on the specified public
base. The original shared checkout had unrelated unpublished work and a
rebase conflict. Its rebase was aborted, and all six implementation commits
were made on main in a separate clone. Publication belongs to the manager.
