# Platform canonical binding oracle: complete small-file pass

The fourth test had a stale textual oracle. Canonical Foundation correctly retains the ordinary `i32` binding; no compiler/formatter/backend change was needed.
`docs/foundation.md` requires preserved declaration references and independently compilable, stable text; `type-values.md` permits transparent aliases without erasing nominal identity.
The actual prelude defines i32 through `signed_integer(32)` and usize through `address_type()`. Canonical output includes `var i32: type = integer_type(32, 1);` before using `i32*`.
The replacement asserts those exact i32/usize declarations, `identity(x: usize): usize`, `sizeof(array_type(i32*, 3))`, pointer allocation type and unchanged call/print/allocate/free order.
It does not broad-match away types or demand unnecessary expansion. The original positive program moved into `scaffolding/tests/platform_calls.tower`; its operations are unchanged.
At32/64 bits, Graph/Fast execute the source, retire its handle, then independently parse/recheck/execute copied Foundation in a separate host. Expected outputs are12/24 respectively.
Source Graph/Fast canonical bytes match, and every independent reformat is byte-identical. Source and canonical wasm32 executions both return exact `12\n`.
The original five invalid built-in call cases still fail before execution with steps0. Existing abort signature/capability, staged denial, UTF-8 ordering and typed Wasm/table tests are retained.

Compiled compiler: `a06ec4b1f9f44419882477bc1a55b6ed39e2200b`, unchanged pair in `root_release_a06ec4b1`:
- Portable SHA256 `f065757480f1b94ad4f181aadeb8e0a63bc06b781a546aed11ac12796a64a25d`.
- LLVM SHA256 `8acbaf08545d0ce972f2de7db2a89fcfc7ef434f95f775feca06dde759107697`.
Host/resources: `26f99a403ca30f5263dd1a5b59f1c69b43c0e6ba`, tree `2d2e9d98c1e7987a65f6e7d7bacc60993741a142`, plus this test-only change;1252 resource/host hashes match before/after.
Test SHA256 `6e622e884f632b0e9afd408112374a061cf984a69f621a505ea6c3e2d380fc1d`.
Tower fixture SHA256 `38bf8cf0a503d6a5aed657a5f8f4639fcb17c652d99d7dd634a8eb194eb3c4e7`.
Both32/64 canonical files are1083B, SHA256 `4d2a49dcd2927357275ce2b32ba1f24fb661d1ef7358d22b67db41f485b059d2`; target layout still changes execution as checked above.

Full command: `node --test --test-concurrency=1 --test-timeout=600000 playground/tests/platform.test.mjs`.
Both fixture overrides point to the exact a06 pair; `TOWER_TEST_PHASES=1` and the artifact directory preserve actual child metrics and emitted text. No name filter or alternate mode.
Result: **4 tests passed,0 failed,0 skipped,0 cancelled; actual process exit0**. The fourth registration includes eight32/64 source/independent Graph/Fast executions and two wasm32 executions.
Windows11/KinmenA, Node21.7.3, CPU0–11, production allocator, one fresh process; original600s test/outer guard unchanged and not reached.
Whole command2.1922186s; Node2.1219439s; fourth test204.4756ms. Actual child43948 at final release: CPU3.343s, peak343556KiB. Parent24584 is not compiler CPU/RSS.
Primary portable/LLVM capacities91291648/87883776B; the independent host's separate capacity is not included in those two counters, but its allocation is included in child RSS.
All guest handles use finally destruction; hosts live until process exit. No zero-world, whole-process cap or general ownership proof is claimed.
Runtime before/after profiling is inapplicable: only a fixture/oracle/transport test changed. These are check costs, not a production speedup.

The previous3pass/1failure remains source-bound in `A2/cache/logs/abort_t9_a06_1e428ede/focused.log`; it is not relabeled as a passing run.
Current raw root: `C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/platform_binding_a06_26f99a40`.
Retained: `command.json`, `command_metrics.json`, `exit.status`, `stdout.log`, `stderr.log`, `phases.json`, source/resource hashes, `artifacts.json` and both emitted Foundation files.
No T9 repetition, compiler/reactor rebuild, backend edit, sanitizer or deployment verification. L1's separate second-optimization error and ROOT's integrated release gates remain outside this task.
All owned jobs drained; prior stashes/todo preserved. Final publication integration is recorded once in lane status, without moving this evidence boundary.
