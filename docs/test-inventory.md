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

The later native kit replaces the single narrow executable gate with
`tower-selected-narrow-foreign-jobs-1` and `tower-selected-narrow-foreign-jobs-4`.
Each selects three declarations from `narrow_foreign_test.tower` through the
owner and links the same separate provider object. The Node raw-memory selector
calls the same Tower functions with JavaScript providers in the interpreter and
in compiled Wasm. The earlier counts in this table describe the original gate.

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

### Aggregate initialization

Run `towerc --test scaffolding/compiler/semantic_aggregates.tower --test-details`
to exercise aggregate initialization through its compiler owner. The two
`tower-named_initialization_test` CTest entries run the adjacent suite as a
focused root at one and four workers. Its five blocks cover positional array
order, nested initializers with side effects, compile-time initialization,
mixed-width struct fields, and assignment through an aliased destination.
The focused run also selects the imported array assertion fixture.
[Aggregate tests](../scaffolding/compiler/semantic_aggregates_test.tower)

The ordinary named-initialization and struct-value programs remain inputs to
compiler-API and browser tests. Those callers check invalid-source diagnostics,
Foundation rereads and execution through independent backends.

### Published source at `4b2685e5`

The [published inventory tables](evidence/test_inventory_4b2685e5.tar.gz) map each tracked path, native selector and registration to its source and runner.

The tree contains 2,066 tracked paths, including two submodule pins.
`scaffolding/tests` grew from 682 to 697 paths. Its 15 additions comprise six
Tower sources and nine stdout files. Across the same 20 configuration profiles,
CTest exposes 216 distinct names, including all 202 from the earlier census.
The native opt-in profile exposes 198, up from 184. The formatter-only profile
now exposes 36.

The Node source maps to 508 top-level cases in the ordinary npm selection and
13 in the separate Roku selection, plus seven nested ordinary cases. Playwright
lists 246 project registrations. The four additions exercise the Tests example
at two worker widths on desktop and mobile. The two editor suites retain 54
TextMate scope assertions.

All eight tracked `_test.tower` files have an owner. With the pinned compiler
at one worker, direct selection ran one body in each of six files. The other
two selected zero. Their Tower assertions run through compiled callers.
`execution_main.tower` calls the helpers in `execution_session_test.tower`,
and `module_cache_checks.tower` calls the helper in `test_file_rule_test.tower`.
Owner selection can also reach tests through imports. For example,
`--test semantic_iteration.tower` ran three bodies and direct selection of its
companion ran one.

The host 3 inventory receipt `3743bc35-f63e-4008-a365-8c5bd2b494fc` records
commands, path and selector tables, and the separate execution results. Its
focused `tower-narrow-foreign` CTest passed. The three ABI comparisons live in
`narrow_foreign.tower`. The linked provider supplies the additions. Suite-wide
execution status is open for this source.

### Borrowed foreach

The default filename rule pairs the existing worker unit with
`iteration_parallel_unit_test.tower`. Run the owner to execute the five
Tower tests in the table. Each fixture also has an ordinary script entry
that prints its observations. The browser suite reads those same files.
[Worker companion](../scaffolding/tests/iteration_parallel_unit_test.tower) ·
[Fixtures](../scaffolding/tests/foreach_inputs) ·
[Browser selectors](../playground/tests/foreach.test.mjs)

```sh
bootstrap/linux-x64/towerc --test scaffolding/tests/iteration_parallel_unit.tower --test-details --jobs 1
bootstrap/linux-x64/towerc --test scaffolding/tests/iteration_parallel_unit.tower --test-details --jobs 4
node --test --test-concurrency=1 playground/tests/foreach.test.mjs
```

| Fixture | Assertions shared by native and browser runs | Exact output values, each followed by LF |
| --- | --- | --- |
| `vector_values` | Empty traversal skips the body. The source is called once. A scalar copy can change independently. Element pointers double the backing values. An aggregate borrow updates each field in place, and a copied pointer reads the first record while its owner is live. | 11, 12, 13, 1, 1, 2, 4, 6, 21, 22, 21 |
| `ring_order` | Six pops and two pushes wrap the queue. Value and borrowed traversal cover both ring segments. The stack alias traverses oldest to newest. | 6, 7, 8, 9, 16, 17, 18, 19, 4, 5 |
| `protocol_cleanup` | Range begin appends 1, end appends 2 and body cleanup appends 3. Continue then break checks cleanup and shadowing. Return saves the element before cleanup. Nested and empty ranges close exactly once. Other uses a separate protocol in the same module. | 4, 1332, 99, 3, 132, 3, 1122, 12, 42 |
| `loop_targets` | Continue selects the enclosing loop, a deferred loop reads the still-live vector, and return leaves the nested loops with the first element. | 26, 1, 2, 1 |
| `worker_checksum` | The existing exported transform updates three caller-owned values through its borrowed view. The existing checksum reads back that storage. | 39 |

For each row the original browser selector checks Graph and Fast at 32 and
64 bits, the exact output after reparsing Foundation, and byte-stable
Foundation at the second emission. LLVM executes the source with optimization
off and on, and the optimized canonical Foundation. Browser Tests also
discovers the companion from the worker unit and checks the combined stream.

| Remaining original selector | Fixtures and assertions |
| --- | --- |
| Invalid programs | `scalar_source`, `missing_protocol`, `aggregate_copy`, `escaped_item`, `mismatched_state`, `scalar_element`, `void_element`, `missing_return`. Each must finish with an error, the corresponding diagnostic and empty output. The selector uses the interpreter. |
| Formatting and Foundation names | Parse and format `format_borrow` twice, require byte equality, execute the formatted text and expect 42 LF. In `foundation_identifier` the ordinary variable named `foreach` also prints 42 LF. |

Fixed-array iteration already runs through the `semantic_iteration.tower`
owner and directly through the one- and four-job fixed-array registrations.
Its companion checks the source call count, copied values, borrowed writes,
the untouched tail after a break and cleanup on return. The same owner also
executes the existing layout and generic clone checks. The compiler-thread
fixture exercises implicit protocol construction in two bodies, the
compiler-worker selector compiles the shared unit, and `body_runs.tower`
checks protocol failures during body work. The Bedrock foreach and replacement
examples teach grammar declarations. The collections example and
`language_collections.tower` cover ordinary stack and queue operations.
[Existing fixed-array companion](../scaffolding/compiler/semantic_iteration_test.tower) ·
[Borrowed iteration contract](borrowed-iteration.md)

### Gzip encoding and publication

Use `towerc --test scaffolding/library/gzip.tower --test-details` for the
owner or substitute `gzip_test.tower` for direct selection. Six fixed cases
and 32 seeded cases exercise deterministic encoding, invalid input with a
previously populated output, and an input borrowed from the output buffer.
A third declaration checks all four little-endian CRC trailer bytes for
`123456789`. The optional native registration uses the existing guest test
runtime, UTF-8 object and production allocator archive.

The inventory's standalone `gzip_checks DIRECTORY [PAYLOAD]` selector still
writes and decodes every pair, checks the decoded bytes against the input,
and rejects all 29 truncations of the known member. It also checks a reserved
block, bad checksum, retained decoder output on errors and subsequent
recovery. Both entries use the same Tower generators and publication checks.
The optional support archive remains an explicit filesystem input.

### Struct values, reflected fields and source handles

Run `towerc --test scaffolding/compiler/semantic_values.tower --test-details`
to include the four field-access declarations in the owner suite. Select
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
