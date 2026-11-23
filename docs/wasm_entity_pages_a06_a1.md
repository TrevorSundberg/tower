# A1 a06 actual-Wasm entity-pages acceptance

Outcome: **FAILED**, one selected case, zero passes. The first failure is
32-bit **optimized LLVM Foundation reconstruction**:
`This operation requires integer operands`, offset **1290736**, returned
errorFile `.tower/tests/entity_pages.tower`. The error response is preserved
verbatim; this offset is beyond the 972596-byte request and is not asserted to
identify a position in that request. No resource cause or Memory denial was
reported. Do not relabel this as the earlier reconstruction-memory failure.

The 32-bit Graph/Fast, canonical execution and byte equality all passed.
Unoptimized LLVM emitted complete Foundation, which the portable compiler
reparsed and executed using Fast with exact `0` followed by LF. Optimized reconstruction
then failed its unchanged `status === compiled` assertion at
`semantic-port.test.mjs:81`. No optimized reparse/execution, 64-bit phases or
either actual wasm32 executable request ran. Eighteen other semantic-port
registrations were excluded by the exact name filter, not passed.
The conditional complete compiler-entities run is **UNSTARTED**. Its current
source actually registers four tests (including world views and generic
registries), despite the task's historical two-test count; none is claimed here.

## Frozen identities and invocation

Mounted source: `e637ba384037a6305fd945dd1e7c6296f5a98635`,
tree `7c436acebec71d92c46736a49f2d173f5b0524d3`.
Compiled source: `a06ec4b1f9f44419882477bc1a55b6ed39e2200b`.
ROOT's supplied SOURCE/files manifest and both actual bytes were checked:

| Reactor | SHA256 |
| --- | --- |
| tower.wasm | f065757480f1b94ad4f181aadeb8e0a63bc06b781a546aed11ac12796a64a25d |
| tower-llvm.wasm | 8acbaf08545d0ce972f2de7db2a89fcfc7ef434f95f775feca06dde759107697 |

The supplied pair is sufficient; unrelated manifest members were not required.
Both overrides point into
`C:/Sandbox/build/codex_ecs_20261122/root_release_a06ec4b1`.
`TOWER_TEST_PHASES=1`; `TOWER_TEST_ARTIFACTS` points to a new
`entity_pages.artifacts` directory. Other TOWER_TEST options, NODE_OPTIONS,
NODE_DEBUG and TOWER_REQUIRE_THREADS were removed from the child environment.

```text
node --test --test-concurrency=1 --test-reporter=tap --test-timeout=600000 --test-name-pattern="^Tower entity_pages agrees across graph, fast, LLVM and Foundation text$" playground/tests/semantic-port.test.mjs
```

Windows 11 x64 KinmenA, Node 21.7.3, CPU12-23 (mask 0xFFF000), one Windows Job
with a 24GiB committed-memory limit. Both the test timeout and outer guard
were 600s; neither fired. Existing fixtures, fuel, caps, output and assertions
were untouched. This is one fresh-process acceptance run, not a throughput
comparison. No compiler rebuild, browser run, unrelated test, sanitizer or
rejected instrumentation was used.

All 1297 mounted Tower-resource/host/test entries and both selected reactors
match before/after manifests. Manifest SHA256:
`7a735ce1ecf1bda262a7d4dfcf842546bc8703d95c38220d7dc6bd2684db956d`.
The selected tests/host and production resource closure are unchanged from
compiled a06; later source differences concern packaging, fault fixtures and
the A1 Windows entries. Mounted source does not incorporate those changes into
the reactors. Future D1 i1 changes are excluded.

## Execution and ownership evidence

| Scope | Exit | Wall seconds | CPU seconds | Peak resident bytes |
| --- | ---: | ---: | ---: | ---: |
| Actual Node test child43904 | 1 | 302.3651 | 454.2656 | 3840491520 |
| Node test runner26036 | 1 | 302.4390 | 0.0781 | 33988608 |
| OS job/launch | 1 | 302.5201 | 454.3281 | 3867820032 sampled aggregate |

Retained native handles queried GetProcessTimes, GetExitCodeProcess and
K32GetProcessMemoryInfo **after exit**, successfully for both processes.
Child peak working set is 3662.578MiB, distinct from job peak committed
memory 6117593088B (5834.191MiB) and from Wasm linear capacity. Job aggregate
RSS is sampled every 20ms and can count shared pages twice. Minor CPU scope
differences between Job and process counters are retained, not normalized.

Phase timestamps show 164.591s for unoptimized LLVM reconstruction and 127.139s
for its portable reparse. RSS at entry to those phases was 385781760B and
2173947904B; after reparse it was 3779858432B. Existing phase logging does not
expose per-phase CPU, Wasm capacity or live component/handle census, so those
are **unmeasured**, not inferred from RSS. The ordinary guest-handle finally
paths ran; no zero-live-world/allocator assertion is claimed. Job accounting
reports two processes total and **zero active** before job close. No owned
test processes remain; unrelated lanes' Node processes were left alone.

## Exact retained input and handoff

Raw files are external under
`C:/Sandbox/build/codex_ecs_20261122/A1/wasm_t2_a06_e637ba38`:
full TAP/phase stdout and stderr, OS measurement JSON/script, source identity,
before/after input/reactor manifests, selected source blobs, phases and results
manifests. Earlier failed runs are untouched.

| File under entity_pages.artifacts | Bytes | SHA256 |
| --- | ---: | --- |
| entity_pages_32_canonical.tower | 972596 | 403fdc6b0b6c9cd38cbf4e9c6b20858e1cb0c64a8d3342d91f54c72501807e2e |
| entity_pages_32_unoptimized_rebuilt.tower | 4709291 | 452132b90d4a73b43ec3f19153d8b344b201955640c7e6fd0a97203f2d858218 |
| entity_pages_32_unoptimized_before.ll / after.ll (each) | 2360186 | ccd84978e29e0ff20607058b505b6eba5d143b61026e7b9727f6fa0da3dc6375 |
| entity_pages_32_optimized_error.json | 154 | 808c7f3f020ce2360830a9058055aa1b96b8eb31753a5c28494050d0913fd942 |

The optimized request is that exact canonical input, emit=foundation,
optimize=true, target=wasm32-unknown-unknown, lexical entry
`.tower/tests/entity_pages.tower`, with the frozen mounted resources.
The public response supplies no failed optimized IR/Foundation, so none is
fabricated. This differs from A2's older isolated 965691-byte request and
4675795-byte output; that narrower receipt is not counted as this case passing.

The integer-operands failure is consistent with D1's documented i1 recheck gap
in [its audit](compiler_ecs_audit_d1.md), but this run alone does not prove the
specific intrinsic/producer responsible. ROOT/D1/L2 can consume the exact
optimized request and response; no overlapping producer edit, raised limit,
rerun or weakened expectation was made. Full T2 acceptance remains blocked.
ROOT retains release/generation/hosted ownership.
