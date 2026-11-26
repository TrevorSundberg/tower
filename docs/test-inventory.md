# Tower test migration inventory

This inventory records the tests, fixtures and runners present at `91b3e1f8`.
Use it when moving a check into an adjacent `_test.tower` file. Find its original
selector and keep its expected output, diagnostics, target, worker count and
failure behavior. Some files supply data to several tests. Some selectors
exercise hundreds of cases through one executable.

[Browse all 682 paths under scaffolding/tests](evidence/native_test_paths_91b3e1f8.tsv)
or [download the case and registration tables](evidence/test_inventory_91b3e1f8.tar.gz).
The path index gives the Git blob, the file's role and the proposed home for its
tests. Proposed companions can group checks that currently live in several files.

| Question | Table inside the archive | Coverage |
| --- | --- | --- |
| Which native checks use this fixture? | `native_a_m/cases.tsv`, `native_n_z/cases.tsv` | The first component below `scaffolding/tests` determines which table to open. A–M has 373 paths and 3,971 selector, generated-case and helper records. The other table has 309 paths and 820 mappings. Both include original callers and baseline commands. |
| What did the browser or editor suite check? | `playground_editor/case_index.tsv`, `matrices.tsv` and `editor.tsv` in that directory | 521 top-level Node cases, seven nested Node cases, 242 Playwright project registrations and two editor suites with 54 scope assertions. The case index records loops, hooks and assertion sites. |
| Which build configurations expose the check? | `entrypoints/registrations.tsv`, `entrypoints/ctest.tsv` and `entrypoints/visibility.tsv` | 202 distinct CTest names across inspected configurations. Rows identify the configured command, target and source. All 184 registrations in the audited native opt-in build resolved to commands after building. |
| What runs outside those directories? | `entrypoints/other-entrypoints.tsv`, `injected.tsv`, `ci.tsv` and `replay-members.tsv` in that directory | Direct tool invocations, test sources linked into executables and reactors, platform workflows and historical replay inputs. `entrypoints/tree.tsv` records all 2,027 tracked paths and submodule pins. Temporal research is identified separately. |

For example, the strongly connected components test compares the compiler's
partition against mutual reachability on 242 fixed and seeded cases. The original
registration and the refactored helper both passed. Deliberately assigning the
wrong partition to a singleton produced a partition mismatch with zero live
buffers. Running that mistake through the proposed companion's assertion body
also failed. The legacy selector stays active until the published test-mode
compiler discovers the companion, runs its helpers, and reports that same failure.

### Findings to carry into migration

- The original `layout_frontier_profile warm` failed when its zero-byte budget
  denied the first 24-byte scratch request. The repaired fixture checks the
  live scratch and worker reservations, independently calculated field offsets,
  and zero remaining reservations after teardown. The native backend and work
  test profile registers its bounded check as `tower-layout-frontier-smoke`.
- Five entries in the second native table have unresolved automatic registration:
  `narrow_foreign_library.tower`, `sanitizer_memory_probe.tower`,
  `token_text.tower`, `work_graph_scale.tower` and `work_view_invalid_dispose.tower`.
  In A–M, the nested imports diamond ran directly, and `function_values.expected`
  matched direct execution; an automated check for those exact inputs was
  unconfirmed at this revision.
- With only `TOWER_FORMAT_TESTS=ON`, the formatter binary passed when invoked
  directly, while CTest discovered zero tests. The generic-cast CTest accepted
  output `142` through its `42` regex. Exact stdout comparison rejected it.
- A companion placed beside a library was excluded from its ordinary native
  depfile but included in the editable browser compiler project. Packaging,
  test discovery and normal compilation each need a check against the shared
  companion rule.

The counts above measure inventory coverage. Execution evidence is recorded per
selector and configuration. The later `named_initialization_test.tower` and its
one- and four-worker registrations first appeared in `a01617e3`; they are outside
this frozen census.

### Follow-up on the five native paths

The native opt-in build at `6c31f333` had 188 CTest cases. The registrations
below add four cases. The original five fixture files and the browser callbacks
keep their existing behavior.

| Fixture | Entry and expected result |
| --- | --- |
| `narrow_foreign_library.tower` | ABI support. On Linux x64 with execution tests enabled, `tower-narrow-foreign` links this provider and the unchanged `narrow_foreign.tower` caller as separate objects. The three signed-byte, signed-short and unsigned-short calls must return the values checked by the caller. Success exits 0 with empty output. The raw-memory Node test supplies its own JavaScript additions to the same caller. |
| `sanitizer_memory_probe.tower` | Manual ASan sensitivity control. The [instrumentation recipe](compiler_sanitizer_checks.md#instrument-and-run-a-fixture) expects exit 1 and a heap-buffer-overflow on the one-byte write after the eight-byte allocation. Run it separately from passing guest programs. |
| `token_text.tower` | `tower-token_text-1` and `tower-token_text-4` run the existing literal and identifier checks through the native interpreter. Each requires exit 0, exactly `0\n` on stdout and empty stderr. |
| `work_graph_scale.tower` | Manual native benchmark. Compile the source to an executable and time that executable. It requests 64,000 subjects, repeats root edges and prints zero only if every task completes. Success requires exit 0 and exactly `0\n`. The guest drains the graph serially. |
| `work_view_invalid_dispose.tower` | With POSIX driver tests enabled, `tower-work-view-invalid-dispose` invokes the real compiler in library mode. It requires normal exit 1, the exact nominal type diagnostic at 9:27, empty stdout and preservation of the prior output file. The fixture is never run as a guest. |

The optional `tower-format-repository` manifest lists all five. Its full run
aborts at `backend/bindings.tower` before reaching any of them. With each path
first in a short manifest, the same runner aborts on canonical text for the
narrow provider, the ASan probe and the token fixture. It passes the scale
and borrowed-view files, including the second formatting pass. The Node
module-path test also checks the spellings of all five paths.

### UTF-8 codec and the public Wasm boundary

At `3ae475c2`, `playground/tests/compiler-utf8.test.mjs` registered three suites.
All three still run. The native command `towerc --test scaffolding/compiler/utf8.tower`
and direct selection of `scaffolding/compiler/utf8_test.tower` now run the same
two waves of codec inputs. The native work-test configuration registers
`tower-utf8-companion-1` and `tower-utf8-companion-4`.

| Original Node suite (line at 3ae475c2) | Portable coverage in Tower | Observations retained at the JS boundary |
| --- | --- | --- |
| Linked browser codec and malformed sources (49) | The adjacent companion checks the returned width, decoded scalar, three NUL policies, size query, capacities 0–4 and all seven destination/guard bytes against the independent Tower reference in `tests/utf8_oracle.tower`. | The test still writes into the linked reactor's exported memory and compares its codec with fatal `TextDecoder` and `TextEncoder`. Five rejected source buffers go through `tw_create`, followed by a fresh memory view for the diagnostic and a successful Unicode grammar session. |
| Standalone codec recompiled by LLVM (70) | The shared visitor in `tests/utf8_cases.tower` replays the fixed rows and continues the random stream for the second codec. The native companion checks that stream too. | LLVM compiles the actual codec, the module has zero imports, and its exports run against the same JS oracle. Three truncated reads at the end of linear memory, the one-past-end empty read, and byte-identical recompilation remain in JS. |
| Interpreter, LLVM and canonical Foundation (91) | `tests/utf8_roundtrip.tower` replaces generated Tower statements. Its 430-line expected file contains the original JS oracle's output for the bounded corpus. | The host runs the source and reparsed Foundation through interpretation and LLVM/Wasm, comparing complete output on all four paths. The interpreter step allowance remains 1,000,000. |

Each wave visits 82 bounded byte inputs (12 explicit, 38 boundary prefixes and
32 seeded) and 17 scalar boundaries, plus 10,000 random byte inputs and 10,000
random scalars. The seed is `0x1ba72983`. The intermediate and final xorshift32
states are 629074146 and 863989070. The test-only Wasm module
`tests/utf8_wasm_cases.tower` passes each borrowed byte span or unsigned scalar
to JS synchronously. It compiles separately from the import-free codec under test.
The existing native exhaustive and protected-page UTF-8 CTest remains active.

### WorkGraph suspension cases on the native CLI

From the repository root, the development compiler from `3ae475c2` runs all
eight cases with either command. Use `--jobs 4` to exercise the other
registered compiler width.

```sh
towerc --test scaffolding/library/work_graph.tower --test-details --jobs 1
towerc --test scaffolding/library/work_graph_test.tower --test-details --jobs 1
```

The native CTest names are `tower-work-resume-owner-{1,4}` and
`tower-work-resume-direct-{1,4}`. The [184-site map](evidence/work_resume_check_map.tsv)
pairs each legacy check with its companion assertion. This includes the nonzero
task ID check in the shared request helper. On success the legacy
`scaffolding/tests/work_resume.tower` script prints a zero failure count. The
companion writes empty guest stdout and reports its eight locations on stderr.
The original `work_resume` browser registration still exercises its backend
matrix. Run the CLI commands against the source checkout so the companion can
import `scaffolding/host/memory.tower`.

### Parser precedence

Run `towerc --test scaffolding/compiler/lr_runtime.tower --jobs 1 --test-details`
and repeat with `--jobs 4`. The companion reads named values initialized by
the [fixture grammars](../scaffolding/tests/precedence_inputs). The binary
productions use the expression node and capture names understood by Tower's
checker. The linked browser parser reads those same files and exposes their
capture roles and spans on each statement event.

| Original assertion in `playground/tests/precedence.test.mjs` at 5a134705 | Current coverage |
| --- | --- |
| Lines 34, 41–45. Completed parse, numeric values, normalized direction, identical values after formatting and byte-stable second format | The companion expects 4/6 for subtraction, 14 for the mixed operators and 20 for the grouped sum in all four spellings. The browser checks successful completion, the exact capture spans for both parses, the normalized direction and the second format. |
| Line 53. Ordinary layered grammar | The companion reads 4, 14 and 20 from the separate atom, product and sum productions. |
| Lines 56, 58. Nonassociative subtraction | The companion expects 4 and 6 for explicit grouping. The linked parser rejects the second minus of the bare chain. |
| Lines 64–66. Conflicts and invalid levels | The browser checks the error event and diagnostic for each of five files. Unannotated and partially annotated productions yield shift/reduce, competing reductions yield reduce/reduce, and levels 0 and 4294967296 have distinct diagnostics. All six rejecting fixtures, including the bare chain, also run directly under native `--test` as expected-failure checks. Each fails during parsing, before a test body can run. |
| Lines 74, 76. Edit, restore, cache hit | The browser resets the same handle left, right and left, checks the three captured expression trees after each reset and inspects its grammar-cache hit count. |
| Lines 87–88. Completed execution and exact output | The companion checks the captured replacement value 25. Integer division also distinguishes twice-before-division (5) from applying twice to the quotient (4). The execution host checks completion and the exact bytes `25\n`. |

The existing `tower-parser-tests --suite lr-analysis` registration calls
`lr_analysis_precedence_tests`. It owns left reduction, right shift,
nonassociative action removal, unequal powers, ineligible shift/reduce pairs,
duplicate reductions, exact conflict priority and buffer release. The companion
exercises the source reader and resulting grouping without rebuilding that
synthetic table oracle. Parser reset, inspect, format and error events require
the linked host API. The ordinary native test interpreter exposes no guest
binding for those handles.

### Stack and queue cases

`scaffolding/library/stack_test.tower` checks empty-pop output and LIFO order
after growth, self-move and replacement of a populated destination.
`scaffolding/library/queue_test.tower` checks FIFO order across wraparound,
growth and moves, rejected pops and reserve, and borrowed pointer elements.
The [case map](evidence/language_collections_checks.tsv) pairs all 25 failure
codes in `language_collections.tower` with their adjacent assertions.
The browser suite continues to run the original script, which prints zero
across its interpreter, Foundation round-trip and LLVM comparisons.

### Struct values, reflected fields and source handles

Run `towerc --test scaffolding/compiler/semantic_values.tower --test-details`
to select the four field-access declarations through their owner. Select
`semantic_values_test.tower` directly to run just those four. They exercise
a nested copy and borrow, assignment through a pointer redirected by the RHS,
forward and recursive pointer identity, and target-sized layout. The native
CTest registrations are `tower-struct-field-values-{1,4}`.

`node --test playground/tests/structs.test.mjs` retains all 12 original
selectors. Nine read a source and its stdout oracle. Each runs the portable
compiler, recompiles its canonical Foundation, compares the complete type
registry, and checks emitted LLVM/Wasm execution including mapped diagnostics
and output truncation. An LLVM skip is visible in the test report.
[Guest sources and expected files](../scaffolding/tests/struct_cases)

| Original selector | Guest input |
| --- | --- |
| Milestone example | Existing `examples/structs.tower`, with `milestone.expected` |
| Nested inline structs | `nested.tower` |
| Recursive pointer fields | `recursive.tower` |
| Forward types and functions | `forward.tower` |
| Field destination captured before a call redirects its pointer | `redirect.tower` |
| Pointer stored in a field aliases a scalar | `scalar_alias.tower` |
| Field pointers before initialization | `field_address.tower` |
| Empty structs still have distinct storage | `empty.tower` |
| Quoted type and field names | `quoted.tower` |
| Deterministic layout and fields | `layout.tower` and `browser/layout.tower` check the four primitives, both aggregate layouts and the entire recursive link field record |
| Invalid structs and field operations | `browser/diagnostics.tower` selects 19 named inputs under `invalid/`, requiring the diagnostic before any steps or printed bytes, then checks the 4 MiB storage and field path limits |
| Struct/type node release | `browser/release.tower` measures live nodes across 20 repetitions of the milestone, self-field and missing-field compile/execute/reflect/destroy sequence |

The browser probes run as Tower tests in a second Wasm instance. This keeps
the assertion program's own compiler allocations outside the measured node
count. The release-only selector uses the same initial standalone compiler
state as the original `--test-name-pattern='struct/type nodes'` invocation.
