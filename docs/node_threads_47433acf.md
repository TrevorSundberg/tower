# Node shared-thread acceptance, reactor 47433acf

**T5 Node acceptance remains blocked:** two test registrations pass; the
deterministic compiler registration fails on `inference_alias_invalid` at one
worker. Workers2/4/8 and later cases are unstarted. There are no skips, timeout
extensions, reactor rebuilds or browser reruns. ROOT's separate intermittent
Linux browser retirement gate is neither a prerequisite for this run nor closed
by it.

## Frozen inputs and invocation

- Supplied reactor build source: `47433acff17e8ca6b3fffb6ce9875a37b38aec08`.
  ROOT's public-bootstrap build provenance is retained; B2 did not rebuild it.
- Host/resources frozen after pull at
  `1210dc21f3a3f76221717c85bbe6ef65f7626459`, plus the accompanying optional
  progress labels in the existing `compiler-threads.test.mjs`. These labels only
  report the current case/mode, are disabled unless `TOWER_TEST_PHASES=1`, and
  preserve all sources, assertions, execution order and30/10/120s test deadlines.
- Verified the supplied files before copying and verified the installed copies:

| Artifact | Bytes | SHA256 |
| --- | ---: | --- |
| Shared compiler | 1742632 | `50f2ba6054b38057613a8d3e6a47c6f517ee17240a9a29ed67e9e76a634625a8` |
| Shared work fixture | 52252 | `6411c389b9610c293b98dcc844e00195fcfeecbf0b4e53b8c84189ef78d4e32c` |

Source files are at
`C:/Sandbox/build/codex_ecs_20261122/root_shared_47433acf/`.
The verified copies occupy `build/browser-wasi-threads/` because this test also
eagerly reads that compiler path. Both absolute overrides select those same
shared files; no ordinary portable override was used.

The previous eager compiler/work files (SHA256 `1f7c78f69a7c66968f668c1f42b2a16144764cff487ef1ea9ea02c396302a709`
and `7aa88d845ca0f1a14b887fdc7c39fa09db50907d3b3ec52df791e01eea3cc104`)
were backed up before replacement. Old B2 f167 compiler
`8e7e3d637c6820c6d96204662dd4b6025722099e595ef3704f704125d7405eb4`
and work `6411c389...` remain unchanged in `/cache/browser-shared` and the earlier
retained archive. No cache build overlapped installation or execution.

Raw commands, exact phase-only patch, test source, imports/exports, manifests,
logs, old eager copies and status:
`C:\Sandbox\build\codex_ecs_20261122\B2\node_threads_47433acf`
(container `/cache/node_threads_47433acf`).

```sh
export TOWER_TEST_WASM=/work/build/browser-wasi-threads/tower.wasm
export TOWER_TEST_WORK_WASM=/work/build/browser-wasi-threads/tower-work-tests.wasm
export TOWER_REQUIRE_THREADS=1 TOWER_TEST_PHASES=1
NODE_DEBUG=worker /cache/process_profile \
  /usr/bin/timeout --signal=TERM --kill-after=5s 180s \
  /usr/local/bin/node --test --test-concurrency=1 --test-reporter=tap \
  playground/tests/compiler-threads.test.mjs
```

One finite aggregate; the180s outer guard did not fire. The unchanged per-test
timeouts are30s pool,10s trap and120s compiler. Run from `/work`, one test file,
with actual Node worker transport. Optional labels and built-in `NODE_DEBUG`
are observation overhead, not a compiler implementation or speed benchmark.

## Results and exact coverage

2026-11-23 21:11:19–21:11:31 UTC, Linux6.18.33.2 WSL2/Ubuntu24.04,
Node22.23.5/V8 12.4.254.21-node.57. B2 `tower-b2-work`, CPU12–23,
quota1200000/100000 (12 logical CPUs),24GiB. No owned job was active before
installation. Cache924GiB free; host roughly114GiB free.

| Registration | Result | Duration |
| --- | --- | ---: |
| Four-thread pool overlap and job reuse | PASS, all128 complete lifecycle iterations | 5.286781s |
| Injected worker trap/shared failure | PASS, expected failure reaches blocked coordinator | 0.155336s |
| Declaration/body/lowering/staging at1/2/4/8 | FAIL at capacity1, alias inference diagnostic | 6.078131s |

TAP:3 tests,2 pass,1 fail,0 skipped,0 cancelled; process exit1. Existing native
`process_profile` measures11.640358s wall,13.370040s waited-child CPU and239612KiB
peak RSS (234.0MiB). Timing includes Node loading, logging and checks; no
observer-off comparison or production speedup claim. Wasm capacity/live guest
allocation was not separately sampled and must not be inferred from RSS.

Completed before the failure in the capacity1 compiler run:

- All four existing Tower stress source producers: `workers`, `generic_workers`,
  `window`, `type_fields`.
- `lr_work_tests()` and `semantic_world_tests(4)` / `(8)` return0. Required
  exports are present; no missing-export skip or substituted fixture.
- Ordinary worker input, pointer widths4/8, Graph and Fast: exact expected
  output `504,7,42,42,0,136,-120,-2147483648`, each newline terminated;
  complete canonical equality between Graph/Fast at each width.
- Ordered first-error cases `worker_body_errors`, `worker_suffix_error`,
  `worker_prefix_error`, `worker_later_error`, `worker_first_error`.
- Body-window output33930 and implicit-protocol iteration output46/46/7,
  with their canonical baseline captured.
- Generic worker input, widths4/8, Graph/Fast: exact28/36/504/504/73 output
  and canonical equality for each width.
- `worker_generic_errors`, `worker_type_errors`, `worker_leaf_errors`,
  `decltype_cycle`, `comptime_generic_selected`, `worker_generic_mismatch`.

Failed next: `inference_alias_invalid`, capacity1, default target pointer width4,
Graph diagnostic path. Error status is correctly returned, but its error text
fails the unchanged inference/continuation assertion. No cross-worker canonical
equality is established by the capacity1 results alone.

Unstarted at capacity1: `declaration_index_cycle`, `worker_index_errors`,
`worker_field_errors`; all17 dependency fixtures across widths4/8 and Graph/Fast
(`decltype_layout`, `decltype_generic_headers`, generated `type_fields`,
`decltype_aggregate`, `body_continuation`, `decltype_lazy_body`, `generic_body_lazy`,
`decltype_expressions`, `declaration_continuations`, `declaration_inference`,
`declaration_operands`, `enum_expressions`, `default_initialization`,
`named_initialization`, `struct_values`, `known_bindings`, `computed_type_arguments`);
operator/clone-budget/generic-header/layout/type-field cycle checks; imported
module modes; final closed-compiler API assertions. All capacity2/4/8 compiler
modes are unstarted. The finally-close path did execute at capacity1.

## Preserved failure and producer ownership

Exact ordinary Tower input, unchanged since `ed5281b7`:

```tower
import tower;
fn alias(T:type):type { var value:i32=1; return T; }
fn read(T:type,value:alias(T)):T { return value; }
var actual:i32=1;
var first=read(actual);
var second=read(actual);
```

File `scaffolding/tests/semantic_invalid/inference_alias_invalid.tower`, SHA256
`7a0e0f543d287bb868cf0d96456c1cb6dffff49e293362c5574359860d3eb0a9`.
Expected for this negative fixture: `Cannot infer type argument 'T'; pass
explicit type arguments`. Actual:

> Type constructors currently support a struct and return; general compile-time execution is not implemented

The first failing assertion is the diagnostic match in the continuation-error
loop (`compiler-threads.test.mjs:222` with phase labels). The last started case
is explicitly logged; the following two invalid cases have not run. The retained
log does not record an error offset, so none is invented here.

The actual message originates in `generic_type_result_read` in
`scaffolding/compiler/generics.tower`: a local value statement in a type
constructor hits the non-struct/non-return branch. The inference diagnostic is
produced by `sem_infer_finish` in `semantic_call_inference.tower` when a type
parameter remains unbound. The live alias-admission versus inference-diagnostic
ordering needs **ROOT/L1 (type-constructor admission) with L2 (inference/error
publication)**; B2 did not modify those active producers. Current L1 known
wrapper support is already in this reactor, so this is not a request to adopt
the old eac binary's missing wrapper fix. It remains the independently observed
negative-alias diagnostic gate.

No stale setup was established: exact shared imports and exports are present,
resources load, prior real cases pass, and this fixture/expectation is unchanged
at the reactor source. Do not widen the regexp, remove the local statement,
insert explicit type arguments or skip the case. No failed matrix rerun was made.

## Worker drain and identities

Node's built-in worker diagnostics record9 creations,9 termination requests
and **9 actual `hears end event` notifications**, not just requests. IDs1–4 are
the reused pool workers; IDs5–8 serve injected-failure transport; ID9 belongs
to the capacity1 compiler. ID9 ends after `compiler:close` and before the TAP
summary. Process exits naturally with assertion status1, without the outer
timeout or kill; post-run Docker inventory contains only the idle container
tail. `compilerThreads.close()` calls `terminate()` without awaiting its
promises: those promise resolutions were not observed separately. Actual end
events and process exit establish this run's drain, not general race freedom.

`imports.json` records complete actual Wasm import/export lists. Both modules
import `env.memory`, `wasi.thread-spawn` and host work/heap callbacks; the
transport instantiates shared memory and the fixture demonstrates actual
four-thread overlap. Compiler also imports `env.tw_foreign_call`; WASI imports
are retained verbatim in the inventory. No browser retirement inference follows.

Separate SHA256 identities:

| Evidence | SHA256 |
| --- | --- |
| Mounted `.tower` file manifest | `2f8e48230607f9c562db6e195cb8023426415ea419e86e8c1bfa132b7d8ddca1` |
| Host `.mjs` file manifest | `3cfa1dcfb67487cbacb966d6e2c62ab793b1d834ee54e7262cdab4b972b0c4a9` |
| Selected test/helper manifest | `01d63ff06c1b3dbe23c56d6423abaa0a1463e336c7321da9ac894f8a8094e4bf` |
| Observed test file | `b4e4f820e5a77321fd130991c73da9336e5e22b2f31940036ffe2badbaf59426` |
| Node executable | `2f822d544601dfff107f57d945b649d15c5bf6302595735a6bd9cdc7ee9669bd` |
| Complete selection log | `22750614289b583d4a52e6d5f2ed57a482a01168871e4c101c421af1581d293e` |

Compared with47433acf, the mounted tree additionally contains the profile-only
uniform/accounting fixture delta and two unrelated default/signed-index fixtures;
the selected Tower inputs and language/host implementation are unchanged. These
extra files are hashed as mounted resources, not claimed compiled reactor inputs.
Later numeric, malformed-grammar and parse-memory changes remain excluded.
ROOT retains final source adoption, browser integration and release publication.
