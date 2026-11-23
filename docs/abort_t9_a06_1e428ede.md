# Exact abort capability and current-artifact T9 acceptance

Both complete `work_access` and `work_observe` selectors pass on the unchanged a06 pair; the prior missing-import failure did not execute abort.
Compiled compiler: `a06ec4b1f9f44419882477bc1a55b6ed39e2200b`; portable SHA256 `f065757480f1b94ad4f181aadeb8e0a63bc06b781a546aed11ac12796a64a25d`.
LLVM SHA256 `8acbaf08545d0ce972f2de7db2a89fcfc7ef434f95f775feca06dde759107697`.
Host/resources freeze: `1e428ede6c33cba159b753247affd8d5cf3ed67d`, tree `6208be72f7957a47eb7cde6229a6fe52f5e963e6`, plus this host/fixture change;1251 file hashes held through T9.
No reactor, compiler, backend, allocator, scheduler, resource policy or guest ceiling changed. Mounted newer compiler sources are not reactor adoption.

`host.memory` intentionally declares `abort(): void`; allocation contract failures require termination, not a no-op or fixture import removal.
The existing shared `platformImports` now supplies that default capability; explicit caller providers retain their existing precedence, and unknown externals remain rejected.
A40-byte MVP import/export descriptor with **no code body** supplies a typed Wasm `() -> void` reference. Instantiation checks parameters **and return type**; a06 JSON signatures contain parameters only.
Its host callback throws `WebAssembly.RuntimeError('Program aborted')`. `executeWasm` stops the guest and returns its existing error result; no arbitrary error is relabeled.
Interpreter calls use the existing serialized `returnType`, passed in the foreign context, and the provider's optional validation before invocation. Both Graph/Fast reject nonvoid/parameter signatures.
The shared `invokeForeign` path remains authoritative. No second capability registry, Wasm decoder, interpreter or constant evaluator was introduced.
Staged execution still rejects external calls before reaching host callbacks (`interpreter_context::ix_has_foreign/ix_foreign`); target identity and strict evaluation policy are unchanged.

Six Tower fixtures cover unused valid import, actual invocation/effect termination, wrong parameter, wrong result, unknown external and staged denial; Node supplies transport/assertions only.
Focused abort control passes20 Graph/Fast32/64 executions, five Wasm valid/rejection cases and staged denial through both portable and LLVM entrypoints.
Separate actual invocation prints only `7\n`, reports `Program aborted`, and exits1; `print(99)` is not reached. Raw invoked-abort receipt is retained.
The small platform file also passes byte/UTF-8 output and typed Wasm/table providers, but its existing fourth test fails a canonical spelling regex expecting expanded integer_type instead of the retained i32 binding. That failure is preserved, not weakened or passed; the subsequent targeted abort control passes1 with3 exclusions.

| Complete anchored semantic-port selector |Command wall s|Actual child CPU s|Peak RSS KiB|Portable / LLVM capacity B|
| --- | ---: | ---: | ---: | ---: |
|work_access, child33548|21.6901557|43.140|1167116|510066688 /496435200|
|work_observe, child20732|34.2589938|63.515|1343152|595984384 /582418432|

Each fresh process exits0: TAP1pass/0fail/0cancelled,18 unrelated name-filter exclusions; both `complete` and final `released` phases present. No selected phase remains unstarted.
Per selector: four32/64 Graph/Fast executions, four canonical executions/byte-equality checks, four LLVM raw/optimized Foundation rechecks/reparse/Fast executions, and source+canonical wasm32 executable assertions all pass.
Outputs remain exact `0\n` and `8192\n256\n0\n`;8192/256 are fixture counts, not overlap or speedup. Both original600s test/outer guards and execution fuel remain unchanged.
KinmenA Windows11/Node21.7.3, CPU0–11, production allocation, one process at a time. CPU/peak RSS come from the actual test child at release, not its parent; linear capacity is not live ownership.
The existing artifact transport now preserves source and executable Wasm too:17 hashed artifacts per selector, including both executable outputs, canonical32/64, IR and reconstruction.
Unchanged source SHA256: work_access `2c5c6367869f93999ca98563d827b8de16c06098cf778c9162b93686ee5c883b`; work_observe `545a78644486676d0529d509b777005e4910268cf9be0906845fc875300fe659`.

Healthy equivalent platform-write input, fresh-process n3 before/after: mean command wall1.737869→1.747239s (+0.54%), child CPU2.790333→2.676s, peak RSS289513→289372KiB.
Portable93061120B/LLVM89522176B capacities and exact output are unchanged; guest handles follow existing finally destruction. No zero-world, universal race-freedom or multicore scaling claim; this boundary is synchronous.
The prior missing-import failure is not a timing baseline. All measurements are ordinary execution; no instrumentation campaign or compiler rebuild occurred.
Raw root: `C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/abort_t9_a06_1e428ede`.
See `healthy_profile.csv`, `before_*`, `after_*`, `focused*`, `invoked_abort*`, `host_resources_before.json`, and each selector's `command_metrics.json`, `exit.status`, `phases.json`, `stdout.log`, `artifacts.json` and complete `artifacts/`.
Source stashes/todo are preserved and owned jobs drained. ROOT retains integrated release; the unrelated platform spelling assertion and separate service-rejected instrumentation remain open.
