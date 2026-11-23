# Six ordinary Node files: frozen eac artifacts, current fixture adoption

2026-11-23, A2. Five files close; `execution.test.mjs` retains one failing
leaf case. This is not a complete Node, current-compiler, browser or release gate.

## Inputs and method

- Mounted source: `bda11a9b52c59b4b3b08eab2a5cb17b8fe10c119`, tree
  `c145e3b24e4cb4b80e999f389c2c624fa5a47f9e`, plus this commit's six transport
  changes and two Tower fixtures. No production compiler changes or build.
- Compiler artifact boundary: `eac16533ad7169988c53af934ece62e083b39bad`.
  Both supplied files from `C:/Sandbox/build/codex_ecs_20261122/root_release_eac16533`
  were checked before use:
  - portable `tower.wasm`: SHA256
    `df541c16c626453fae94553cae2e6d1285b6879bfe7778be363fe537a0d8fd99`;
  - LLVM `tower-llvm.wasm`: SHA256
    `87c8fbc90a9e0e56a3399155c5d63bcab9dcd57e4de5d89996f40c0238230472`.
- Both `TOWER_TEST_WASM` and `TOWER_TEST_LLVM_WASM` point to those verified copies.
  Missing ordinary eager `build/browser-wasi` and `build/browser-wasi-llvm` files
  were supplied from the same pair. `TOWER_INTERPRETER_ONLY` is unset. The four
  files with LLVM comparisons actually ran them; execution/Fast retain their
  existing portable-only purpose. No LLVM comparison was silently substituted.
- KinmenA Windows 11 / Docker WSL2 Linux x64 6.18.54.1, Node 22.23.5,
  `tower_build:latest`, network none, CPU0-11, 24 GiB. One file per fresh process,
  `node --test --test-concurrency=1`, 360-second outer timeout, production allocator.
  Every file ran once before edits; only changed failing files were rerun.
- Durable logs, scripts, status files, per-phase SHA256 manifests and exact
  reproduction: `C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/node_six_bda11a9b`.
  `resources_{before,corrected,focused,checked_fast}.sha256` identify actual mounted
  Tower resources separately from compiler artifacts; corresponding `transport_*`
  manifests identify tests/hosts. Each phase checks its manifest again after jobs.
  Adding an unused fixture to the module catalogue does not adopt a newer compiler.

## Results

One sample per listed phase; seconds wall/CPU and peak RSS KiB are waited-child
measurements from the existing `ecs_process_profile` wrapper. They measure test
validation cost, not a compiler speedup: corrected tests execute work previously
prevented by invalid inputs. Fresh processes have no reused interpreter state;
OS file-cache state is uncontrolled. No meaningful compiler before/after or
serial/parallel performance comparison applies because production code is unchanged.

| File | Baseline pass/fail | Final pass/fail | Final log prefix | Wall / CPU s | Peak RSS KiB | Exit |
| --- | ---: | ---: | --- | ---: | ---: | ---: |
| default | 4/2 | 7/0 | focused_default | 5.716 / 5.026 | 363300 | 0 |
| defer | 5/1 | 6/0 | corrected_defer | 5.999 / 5.198 | 369044 | 0 |
| execution | 4/5 | 14/2* | focused_execution | 3.788 / 2.195 | 190948 | 1 |
| fast-interpreter | 7/6 | 13/0 | checked_fast_fast-interpreter | 5.610 / 4.147 | 212676 | 0 |
| for-loops | 4/1 | 5/0 | corrected_for-loops | 5.143 / 4.454 | 376732 | 0 |
| foreach | 6/1 | 7/0 | corrected_foreach | 7.319 / 7.859 | 403432 | 0 |

*Node counts the failed grammar parent and its single failing child: execution
has 14/15 passing leaves, six of seven malformed-grammar variants pass. Across
files, Node reports 52 pass / 2 fail (54 including that parent), or 52/53 passing
leaves. All final phases have zero skips/cancellations. Baseline total was 30/46.
Baseline wall/CPU/RSS respectively: default 5.658/4.943/372544;
defer 6.054/5.248/366340; execution 3.789/2.086/192496;
Fast 4.328/2.676/195520; for 5.498/4.633/378456;
foreach 8.143/8.815/394200. All six baseline processes exited 1.

## Changes and checked contracts

- Explicit Foundation imports repair ordinary identifiers `default`, `defer`,
  `for`, `foreach`, and execution/Fast snippets. Explicit seed-only grammar and
  empty-module cases remain seed-only; Foundation precedence/type-error cases
  retain Foundation, not Tower, grammar.
- The default suite's former struct-copy and staged-struct rejection expectations
  contradicted ordinary struct-value contracts. `default_struct_values.tower`
  checks independent copied storage and a staged scalar result (`0,7,0`) through
  Graph/Fast 32/64, canonical round trips, and LLVM raw/optimized/optimized-canonical.
  Aggregate printing still fails; its exact diagnostic is now
  `print requires a scalar or pointer value`, matching `semantic_values.tower`.
  Invalid target types/conversions and void reset-value use remain errors.
- Fast/Graph agreement now also asserts the intended done/error state. Invalid
  semantic/CFG input is observed with zero steps before Fast selection; selection
  must reject it, preserving the actual diagnostic rather than hiding it behind
  the host selection exception. This is shared checking, not Fast execution of
  invalid CFGs. Successful programs still select Fast and compare observable
  output/error offsets/truncation with Graph, retaining slice/termination limits.
- Foundation's bare negative index receives usize context. Its exact rejection
  remains asserted at both widths. `interpreter_signed_index.tower` uses an
  explicit i32 negative offset and verifies `11,11` at 32/64 in both interpreters.
  The nested loop's old reserved `skip` identifier is renamed without changing
  effects. An initial new fixture used unsupported `isize`; that failed receipt
  remains in `final_fast_*`, corrected to the existing i32 contract.
- Existing loops/foreach effects, single source evaluation, explicit borrowing,
  disposal/protocol tests, nested cleanup and parallel-unit fixture outputs are
  unchanged. Wide generated fixtures now receive their required language import.
  Fast cancellation still runs 30 bounded slices and checks live nodes/allocations
  return exactly to their starting values. No caps, expected outputs, skips or
  diagnostic alternatives were widened.

## Exact residual and handoff

`execution.test.mjs` now runs all seven malformed grammar variants independently.
The remaining input is exactly:

```tower
import foundation;
parse CoreCallStatement = 'broken'; broken
```

On eac portable, `tower.compile` throws `Invalid semantic resource request`
instead of returning the normal zero-step malformed-tree diagnostic. Compilation
does not produce a handle or canonical Foundation, so no canonical input/output
is available for that case. The unchanged assertion still fails; accepting this
exception or adding it to a regex would conceal the defect.

Static trace at bda11a9b: `semantic_statements.tower:522-529` obtains the absent
`call` with `sem_member` and passes it to `sem_module_expression` before checking
shape. `semantic_declarations.tower:1808` admits it with `sem_expression_add`,
which obtains a declaration resource before ordinary call checking.
`sem_shape` in `semantic_support.tower:939` is the existing malformed-capture
diagnostic producer. The module-statement admission hunk is from `96cd1eda7` and
`semantic_statements.tower` is byte-identical between eac and bda; declaration
helpers have later changes, so current native behavior is not established here.
Required follow-up: validate the call capture before module expression admission,
preserve the first source diagnostic through failed statement normalization and
publication, and rerun this exact case plus the other six variants. Coordinate
with the owner of module declaration admission; no parallel producer repair or
private replacement reactor was introduced in this frozen-artifact task.

Newer unary numeric argument/L1/L2 producers need ROOT's joined artifact boundary;
these eac results cannot validate them. The service-rejected instrumentation gate
remains open and was not retried. No full Node51, browser, sanitizer, generation,
LLVM matrix or runtime deployment was attempted. All jobs drained; prior three
stashes, logs and todo remain untouched. ROOT retains publication ownership.

## Publication reconciliation

Implementation/receipt commit `73caf3fd` merged published `fdf4ffa7` as
`4ac85095e2031817307d2041daa3b2e6aa4dc7f7` (tree
`2669072c685014177efc376d6b1138474964fad8`). All recorded final transport hashes
match. Of 1144 recorded Tower resource hashes, exactly six changed:
`backend/session`, `backend/source_session`, `tests/backend_source_native`,
`tests/bootstrap_symbols_checks`, `tests/stress/comment_functions`, and
`tools/bootstrap_symbols` (all `.tower`). These are outside these six files'
imported program/fixture closure; the generated wide cases still use unchanged
`stress_sources`, utility checks, bytes/platform and host-text dependencies.
Compiled backend changes are excluded by the explicit eac LLVM artifact identity.
Unchanged evidence is adopted by hash without relabeling it a run of the new
compiler. The residual statement/declaration producer identities also remain
unchanged by this merge. No passing matrix was repeated for unrelated inputs.
