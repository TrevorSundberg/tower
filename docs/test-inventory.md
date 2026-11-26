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
