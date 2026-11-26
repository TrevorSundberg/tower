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
