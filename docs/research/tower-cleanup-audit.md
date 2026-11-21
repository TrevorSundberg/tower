# Explicit scoped cleanup audit

The next implemented feature after scoped `for` is `defer`, defined in
`scaffolding/tower.tower` and checked/lowered entirely in Tower. Its cleanup
expressions use the existing shared Foundation nodes and ordinary operation
semantics. It adds no native code, Foundation instruction or runtime cleanup ABI.

## Inventory and choice

This historical scanner is retired; its
[archived source](https://github.com/TrevorSundberg/tower/blob/f81f5dd/docs/research/audit_tower_cleanup.py)
and shared scanner remain in Git history. From that archived checkout,
`python3 docs/research/audit_tower_cleanup.py --revision 8290fd2` reproduces
the baseline: 64 tracked Tower functions contain 142 extra copies of identical
`free`, `*_dispose` or `*_destroy` expressions. The scanner examines all tracked
`.tower` files; it reports candidates, not ownership proofs. The tool is not a
required current build step. The loop audit's earlier 60/136 count
predated the upstream parser/CLI integration.

The language plan already calls for cleanup on early exits and defines iterator
ownership/invalidation as prerequisites for general `foreach`. Explicit `defer`
helps current vector, parser, interpreter and backend code without inventing an
implicit destructor system. It also supplies structured-exit machinery that a
future iterator protocol can use. See the ongoing journal for design trials and
the remaining iterator/type-contract work.

## Reviewed migration

| Function | Repeated cleanup copies removed | Ownership/timing preserved |
| --- | ---: | --- |
| `module_import_name` | 4 | Scope owns prefix storage until transferred into the syntax node; reset the moved vector. |
| `lr_states_intern` | 3 | Own incoming items on every path; clear the local owner after moving into a state. |
| `lr_states_create` | 7 | Destroy partial state collections on failure; clear the local owner when returning the completed collection. |
| `im_call` | 4 | Keep argument storage in an inner block so release still precedes pushing/entering the called frame. |
| `foreign_substitute` | 1 | Temporary mangling key remains local; the substitution table owns its copied key. |
| `regex_compile_tree` | 1 | Free the context after its vectors and automaton; returned diagnostic text retains its existing lifetime. |
| `syntax_pending_format` | 1 | Release formatting storage, preserving the explicit move/reset into the pending diagnostic. |

These seven functions in six production files remove 21 duplicate cleanup copies
and 23 source lines before canonical formatting. The inventory falls to 57
functions / 121 extra copies. Counts exclude feature implementation, tests and
documentation. Explicit ownership-transfer assignments remain visible.

After integrating upstream through 781c4d5, the inventory is 59 functions / 126
copies. The two added candidates were reviewed too: `execution_session_compile_sources`
releases input storage before allocating diagnostics, while the new byte-buffer
tests deliberately exercise separate lifetimes and repeated disposal. Their
explicit calls remain. This does not change the migration's 21-copy reduction.

## Intentional exceptions

- `format_parser_host_text` cleans up before `abort`; defer does not unwind abort
  or traps, so those explicit calls must remain.
- `module_path`, `completion_analyze`, `ide_parser_create`, `ide_emit` and parts
  of LR construction release buffers before later allocations, reconstruction or
  error formatting. Moving cleanup to the function exit could change peak memory
  or allocation-failure behavior. Keep their explicit release points.
- `module_cache_valid` and several host/runtime tests repeatedly dispose and
  reinitialize the same local across distinct lifetimes. Those calls are not
  duplicate obligations for one lifetime.
- `tw_complete` has cleanup dependencies whose order differs from reverse
  declaration order. Keep the explicit ordering rather than mechanically adding
  one defer after each declaration.
- LR completion/propagation code mixes local probes, transferred probes and
  prompt release. Its remaining repetitions need an ownership-oriented refactor,
  not an unconditional whole-function defer.

Defers bind names at registration and read values at exit. Return operands are
evaluated before cleanup. A migration must preserve both facts, including pointer
transfers and aliases. This audit deliberately leaves the remaining candidates
for individual review; its counts are not a claim that all can be removed safely.

## Bootstrap and validation

The implementation was built using the preceding for-capable compiler. Before
any production source adopted `defer`, the validated successor was pinned with
complete resources and source hashes. Its relocated installation executes the
defer, for, operator and null-operator fixtures in graph and fast modes. The
expanded browser checks cover both pointer widths, Foundation reconstruction,
determinism, return snapshots, shadowing, nested control flow, completion, depth
limits and raw/optimized LLVM/Wasm. Publication additionally requires a fresh
default successor build, regression tests and deployment verification; observed
results are recorded in the journal.
