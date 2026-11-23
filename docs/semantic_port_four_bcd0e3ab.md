# Four ECS semantic-port cases: blocked at LLVM Foundation

The four requested cases were each run once in a fresh KinmenB process. All
returned `Compiler resource request failed` during 32-bit LLVM Foundation
reconstruction with `optimize=false`. None exhausted its 180-second observation.
This closes the bounded investigation, **not the four acceptance gates**.
Original expectations and later modes remain intact and unpassed.

## Exact boundary and transport

Current host/resources/fixtures: `bcd0e3abf9bd2d970c771133b95d11990defb02c`,
tree `b949eaa1c9a06c4128452c97c558e7f430546636`, plus the preserved transport-only
patch to `playground/tests/semantic-port.test.mjs`. The patch respects explicit
reactor overrides without eagerly reading default binaries, separates phase
labels, and optionally saves returned canonical/LLVM text. No assertion, output,
pointer width, optimization profile, fixture logic, compiler or Wasm cap changes.
Its measured SHA256 is
`ebe611510dfcced1ad5d57a0151b3af336b8746cdcf331c4b8a2a0f221088b82`.

Reactors are ROOT's independently frozen `eac16533ad7169988c53af934ece62e083b39bad`
pair from `C:/Sandbox/build/codex_ecs_20261122/root_release_eac16533`:

- Portable: `df541c16c626453fae94553cae2e6d1285b6879bfe7778be363fe537a0d8fd99`.
- LLVM: `87c8fbc90a9e0e56a3399155c5d63bcab9dcd57e4de5d89996f40c0238230472`.

Source and copied bytes were verified independently. Explicit overrides point
to `/cache/semantic_port_bcd0/reactors/tower.wasm` and `tower-llvm.wasm` in B1's
container. Existing default copies were not replaced. No rebuild or public pin
change was needed. The full current resource/host manifest is separate from the
reactor identity and passed its post-run check. Relevant backend/session/worker
sources inspected below are identical between eac16533 and this freeze.

KinmenB: Linux x64/WSL2, Ubuntu 24.04.5, Node v22.23.5, CPU 0-11, 24 GiB,
one owned `tower_ecs_b1` container. Each command uses
`--test --experimental-test-isolation=none --test-concurrency=1 --test-reporter=tap`
and the anchored selector
`^Tower CASE agrees across graph, fast, LLVM and Foundation text$`.
Each TAP result confirms exactly one test, one failure, zero skipped/cancelled;
phase logs name only that selected case. Unselected tests are not passed.

`/usr/bin/time -v timeout --signal=TERM --kill-after=5s 180s node ...` measures the
whole fresh process, including V8 workers. Single-process test isolation avoids
the earlier killed-child accounting limitation. CPU is user plus system, so it
can exceed wall time despite test concurrency one. No swaps were observed.
The bounded 180-second KinmenB observations do not retroactively pass Deck's
60-second guard. These are n1 acceptance costs, not performance comparisons.

## Results

| Case | Wall s | CPU s | Peak RSS KiB | Exit / final attempted phase |
| --- | ---: | ---: | ---: | --- |
| entity_pages | 50.06 | 100.38 | 2826728 | 1 / LLVM Foundation 32, optimize=false |
| entity_tables | 50.41 | 101.02 | 2847968 | 1 / LLVM Foundation 32, optimize=false |
| work_graph | 36.04 | 73.21 | 2353568 | 1 / LLVM Foundation 32, optimize=false |
| work_resume | 30.67 | 66.34 | 2321244 | 1 / LLVM Foundation 32, optimize=false |

For each case, the preceding 32-bit Graph and Fast executions returned exact
`0\n`; both canonical reparses executed with the same output and reformatted to
identical canonical bytes. The next LLVM call returned status `error`, failing
the unchanged `compiled` assertion. It did not reach the new Foundation-reparse
phase label. No reconstructed Foundation or LLVM text was returned through that
error path, so no reconstruction-size or LLVM-internal timing claim is made.

Pending after each failure: execution of LLVM-reconstructed Foundation,
`optimize=true`, every 64-bit check, and executable LLVM for source/canonical32.
Other semantic-port cases, full Node/browser, generations and sanitizers were
not run. This receipt is neither an OOM diagnosis nor proof of a leak.

## One isolated request and source inspection

Inspected entity_pages' saved canonical text once: it is 1,101,861 bytes versus
the 5,471-byte fixture and includes the imported ECS types/functions. This
expansion is real but does not alone identify the failing allocation. Other
canonical sizes are entity_tables 1,157,063, work_graph 437,566 and work_resume
446,684 bytes; all exact files/hashes are retained.

One reduced **request sequence**, not a claimed minimal Tower program, then
loaded only a fresh LLVM reactor and passed that exact entity_pages canonical
Tower text directly to the same API with the same entry, resources, wasm32 target
and `emit:'foundation', optimize:false`. There was no portable reactor or prior
Graph/Fast/canonical execution. Its separate 180-second guard was unchanged.
It also failed: 49.33 s wall, 78.50 CPU, 2110560 KiB peak RSS, exit 1. Thus prior
Graph/Fast retention is not required for this failure. No second reduction or
deadline extension was attempted.

The complete returned diagnostic is retained, including its transport mapping:

```json
{"status":"error","error":"Compiler resource request failed","errorFile":".tower/tests/entity_pages.tower","errorOffset":4998499}
```

There is no `resourceError` category in this response. The offset exceeds the
submitted canonical length and must not be treated as a proven culprit location.
`moduleDiagnostic` can substitute the module source-map error location; the
raw session fallback itself has no offset.

Concrete owner handoff: `backend/source_session.tower:67` calls
`backend_session_resource_failure` when `program.resource.error` is set, but does
not transfer that error/offset. `backend/session.tower:140` chooses its typed
fallback from the separate `s.backend.resource_error`; the default is precisely
the generic message above. The response-allocation failure path also uses this
fallback. Initial frontend compilation and reconstructed-source validation both
call `backend_source_error`, so this evidence does not distinguish those internal
stages or establish Memory versus Capacity. ROOT/L1 should close that immediate
error propagation boundary and route the preserved failing request to the actual
producer; D2's independent Foundation reconstruction investigation remains
separate. No shared backend, semantic, entity-page or scheduling method was edited.

## Reproduction and evidence

Full evidence: `build/ecs_b1/cache/semantic_port_bcd0` (container
`/cache/semantic_port_bcd0`). `source_files.sha256`, `reactors.sha256`, exact
commands, phase logs, GNU-time reports, exit statuses and canonical inputs are
preserved. OS runners are `build/ecs_b1/semantic_port_case.sh` and
`semantic_port_isolated.sh`; `isolated_request.mjs` is only the existing Wasm API
transport for the retained Tower input. The four original Tower fixtures and all
expected outputs are unchanged. No private artifact is a repository input.

The isolated canonical request SHA256 is
`7db91392a90c5d3a85e23899dc4b05c6836635bbc0160de6d79f4c453ed06fbd`.
Current compiler-fixtures loader SHA256 is
`495cb14e25e700c8b41710a79423d75310a361039e7486f24c5f0f9a212605fd`;
portable host `8b743c3d6955326ee0e7097385725fc7c5e9f0d3fa3f47740056c47b80fea60a`;
LLVM host `80be1da99218dca064251c36160d268baa4b3048a501237ff1a73ae860084671`.
Node syntax validation and diff checks pass. Owned test processes are drained.
ROOT retains final composition/publication and all still-unpassed gates.
