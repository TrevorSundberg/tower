# T9 work_access / work_observe: first-failure receipt

`work_access` failed once; `work_observe` was not started. Neither T9 gap is closed.
Compiled source: `a06ec4b1f9f44419882477bc1a55b6ed39e2200b`, unchanged ROOT pair:
- Portable SHA256 `f065757480f1b94ad4f181aadeb8e0a63bc06b781a546aed11ac12796a64a25d`.
- LLVM SHA256 `8acbaf08545d0ce972f2de7db2a89fcfc7ef434f95f775feca06dde759107697`.
Host/resources: `6649bbe10ac7ccadc453952f4585846078cc54a0`, tree `11d20978da83f7965d8faf3b3f7af3c3119b1cb0`, plus optional phase metrics.
All1242 recorded host/resource files and both reactors hash-match before/after.
Existing semantic-port phase logging now records child PID/CPU/peak RSS and both exported capacities, including a final test-context hook. Assertions are unchanged.
Measured test SHA256: `54c0aa49696983e09f9e3f9c9c93591289a21039b37726c1b57b775817399b78`.
Windows11/KinmenA, Node21.7.3, CPU0–11, production allocator; one fresh process, concurrency1,600s test/outer guards, neither reached.
Both exact fixture overrides, `TOWER_TEST_PHASES=1` and a fresh artifact directory were supplied; no alternate execution mode.
Command: `node --test --test-concurrency=1 --test-timeout=600000 "--test-name-pattern=^Tower work_access agrees across graph, fast, LLVM and Foundation text$" playground/tests/semantic-port.test.mjs`.

| Existing stage | Actual result |
| --- | --- |
|32/64 original Graph/Fast, four executions|All pass, exact `0\n`|
|32/64 canonical reparse/execution/byte equality, four|All pass|
|32/64 LLVM Foundation, both optimization profiles, four|Compile/recheck/reparse/Fast execution all pass, exact `0\n`|
|Source wasm32 executable|Compilation passes; import validation fails before instantiation|
|Canonical wasm32 executable; entire work_observe selector|Unstarted; expected work_observe `8192\n256\n0\n` unchanged|

First error: **`No implementation registered for external function 'abort'`**, Node `ERR_TEST_FAILURE`, `llvm-host.mjs:118`.
This is host foreign-capability validation, not a Memory/Capacity denial or evidence that the guest called abort. No typed `resourceError` is present.
The fixture imports `host.memory`, which declares/uses abort for allocator contract violations; `platformImports` supplies no abort implementation. ROOT must resolve this foreign ABI boundary without suppressing failures, then rerun the unchanged selector.
Actual exit1; TAP0pass/1fail/0cancelled,18 name-filter exclusions. Selected20.2099334s, Node20.7774462s, command20.8506912s.
Actual child21532 at final `released`: cumulative CPU42.953s, peak1169772KiB, RSS1123180544B; parent34808 is not counted as compiler CPU/RSS.
Portable capacity509804544B; LLVM496435200B. These are retained linear capacities, not live ownership or whole-process caps; no zero-owner claim.
Source2649B SHA256 `2c5c6367869f93999ca98563d827b8de16c06098cf778c9162b93686ee5c883b`.
32-bit canonical339909B SHA256 `44bd311b140dea590b1f2bfd06c3f02c4367db92c0a58d39237cb767ac6590d8`.
64-bit canonical339959B SHA256 `81ec0f3b554db6b226964b15249bc5a2d8298e8728e875c09010df521ffd92a3`.
All14 saved canonical/IR/reconstructed artifacts are hashed in `work_access/artifacts.json`; source-Wasm bytes were not saved by this existing selector. No hash is invented or rerun performed.
Raw root: `C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/work_pair_a06_6649bbe1`.
See `work_access/{stdout.log,stderr.log,phases.json,command.json,command_metrics.json,exit.status,first_failure.json,artifacts.json}`, root input manifest and `sequence.status`.
Prior7e54b96a native T9 evidence is separate. No compiler/fixture/resource policy changed; implementation before/after profiling is inapplicable to optional transport metrics.
All owned jobs drained; three prior stashes/todo preserved. ROOT retains release; full T9 acceptance and separate instrumentation remain pending.
