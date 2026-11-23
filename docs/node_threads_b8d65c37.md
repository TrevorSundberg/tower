# Node T5 adoption: shared reactor b8d65c37

2026-11-23, A1. **All three registrations pass**, including the complete original
declaration/body/lowering/staging matrix at workers1/2/4/8. One invocation,
exit0, no skips/cancellations/timeouts, no unstarted cases. The earlier
[47433acf failure receipt](node_threads_47433acf.md) remains unchanged. Its
`inference_alias_invalid` stopping point now passes the unchanged diagnostic
and cross-worker offset/text assertions at every capacity.

## Inputs and command

ROOT supplied matching artifacts built from
`b8d65c37d9dd4ef691d700d0d0a52c81e01b593a`. This includes numeric-only wrappers,
malformed call guards and the alias/inference repair. It **excludes** A1's newer
backend fallback and subsequent executable-admission changes. No rebuild here.

| Artifact | Bytes | Verified SHA256 |
| --- | ---: | --- |
| `tower.wasm` | 1743519 | `d2e7a2ae4bcfba916b684321b56aca96c2b2385c976523ece7b3f09899785e7c` |
| `tower-work-tests.wasm` | 52252 | `6411c389b9610c293b98dcc844e00195fcfeecbf0b4e53b8c84189ef78d4e32c` |

Supplied files: `C:/Sandbox/build/codex_ecs_20261122/root_shared_b8d65c37`.
After confirming no surviving jobs, copied both to this clone's
`build/browser-wasi-threads/`. Both prior eager-path files were **absent**;
`previous_eager.txt` records that precondition. No old cache/artifact was deleted.
Verified supplied, installed and post-run selected bytes. The compiler's eager
read and both absolute overrides therefore select the same supplied pair.

Mounted source/host freeze is independently
`08d209fa6f357ba4c220f1e39673de0e7aef1151`, tree
`b1107d31ab3a3d6798ce88240c990237ddcdc9a4`. Loading newer source files into the
module catalogue does not update the compiled compiler providers. Selected
test/host and standard language roots are unchanged since b8d65c37.

```sh
cd /work
export TOWER_TEST_WASM=/work/build/browser-wasi-threads/tower.wasm
export TOWER_TEST_WORK_WASM=/work/build/browser-wasi-threads/tower-work-tests.wasm
export TOWER_REQUIRE_THREADS=1 TOWER_TEST_PHASES=1 NODE_DEBUG=worker
unset TOWER_INTERPRETER_ONLY TOWER_TEST_INTERPRETER_ONLY TOWER_TEST_PORTABLE_ONLY TOWER_TEST_LLVM_WASM NODE_OPTIONS
/usr/bin/time -v -o /cache/a1_t5_b8d65c37/time.txt \
  /usr/bin/timeout --signal=TERM --kill-after=5s 180s \
  node --test --test-concurrency=1 --test-reporter=tap \
  playground/tests/compiler-threads.test.mjs
```

The original30s/10s/120s per-test deadlines and every assertion remain intact;
the outer180s stuck-process guard did not fire. No selectors omit later cases.
KinmenA Windows11 / WSL2 Linux6.18.54.1 x64, Node22.23.5, own
`tower-a1-environment`, CPU12-23/24GiB, one test process tree. Docker image
`sha256:ba707de6a29fd47e22b186ce711f82e51146fd0d38f7c557dadaf77f7e087156`.

## Actual execution and drain

| Registration | Result | TAP duration |
| --- | --- | ---: |
| Four-thread pool overlap/reuse | PASS; all128 complete lifecycle repetitions | 5.446253s |
| Injected worker trap | PASS; blocked coordinator receives expected shared failure | .158164s |
| Deterministic compiler matrix | PASS; capacities1/2/4/8 all reach `capacity:completed` | 105.006575s |

The phase log confirms the full matrix: eight world checks,16 ordinary worker
executions,16 generic executions,272 dependency executions (17 fixtures × two
pointer widths × Graph/Fast × four capacities),80 negative checks, and16 imported
module executions. All four body-window and iteration cases, LR checks and final
closed-compiler API assertions complete. Known outputs and per-width canonical
text equality remain the original assertions; this is not an additional LLVM
or canonical-reparse suite.

The17 dependency fixtures are `decltype_layout`, `decltype_generic_headers`,
generated `type_fields`, `decltype_aggregate`, `body_continuation`,
`decltype_lazy_body`, `generic_body_lazy`, `decltype_expressions`,
`declaration_continuations`, `declaration_inference`, `declaration_operands`,
`enum_expressions`, `default_initialization`, `named_initialization`,
`struct_values`, `known_bindings`, and `computed_type_arguments`. Source generators,
ordered first-error cases, selected compile-time errors, alias inference,
index/operator/header/layout cycles,65536-node demanded-body rejection and
imported-query outputs all ran. No expected diagnostic/output was weakened.

Node diagnostics record **23 worker creations,23 termination requests and23 actual
`hears end event` notifications**, with matching IDs1-23: pool4, injected trap4,
then compiler1+2+4+8. Every compiler close phase completes. Node exits naturally0;
post-run process inventory has no Node children and the container returns to
only its idle `sleep infinity`. Termination promises are not separately awaited
by the existing transport; actual end events and process exit establish this
run's drain. This does not close B2's browser retirement gate or prove universal
race freedom.

GNU time: **110.75s wall,179.07s CPU** (44.34 user+134.73 system), **420932KiB
peak RSS**, zero swaps. One fresh process-tree sample, files read/hash-warmed,
V8 startup/worker debug/phase logging included. RSS is the waited-child process
high-water mark, not summed concurrent process memory, Wasm capacity or a guest
live-owner ledger. No additional Wasm allocation/retention counters were sampled.
The shared transport's2GiB-per-memory maximum is a capacity contract, not that RSS.
These are acceptance costs, not a before/after speedup or useful-core scaling claim.

## Durable evidence and limits

All commands, logs, process snapshots, exit/time, selected artifacts and1169
mounted Tower /46 host-source checksums are in
`C:/Sandbox/build/codex_ecs_20261122/A1/cache/a1_t5_b8d65c37`.
Every pre-run source/host/test/artifact checksum revalidates after execution.

| Receipt | SHA256 |
| --- | --- |
| Mounted Tower manifest | `6218c00c8c9a8f29f3edc1d9f6bd2e6cc576dfd6bcf59a9d5a9a1ab36e67d171` |
| Host manifest | `3cfa1dcfb67487cbacb966d6e2c62ab793b1d834ee54e7262cdab4b972b0c4a9` |
| Selected test/helper manifest | `01d63ff06c1b3dbe23c56d6423abaa0a1463e336c7321da9ac894f8a8094e4bf` |
| Unchanged test file | `b4e4f820e5a77321fd130991c73da9336e5e22b2f31940036ffe2badbaf59426` |
| Complete Node log | `7f36bab2f51c3c0cd3e0288c235b2601afef63b89be08d9e16eda423c8a25572` |

Free disk340487884800B before /340461453312B after. No production/test source edit,
compiler build, browser diagnostic, broad Node/native/generation/sanitizer matrix
or hosted deployment. Documentation adds no runtime profiling obligation beyond
the measured acceptance run. This closes **T5 on the stated artifact/input pair**;
ROOT retains newer-provider adoption and final integrated release. Todo unchanged.
