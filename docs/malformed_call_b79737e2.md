# Missing call capture: native reproduction and repair

A2, 2026-11-23. Frozen input `b79737e252b51faab83750e9fb3df34bf95f267e`,
tree `979bfe96238a14b0d45a2668b26ccd28791032b6`, plus this scoped batch.
This repairs the producer behind the remaining T8 case; it does not adopt the
repair into ROOT's already-frozen `47433acf` build or the old eac reactors.

## Reproduction and boundary

The exact source from the previous receipt was compiled by rebuilt current
native producers, not the eac Wasm artifact:

```tower
import foundation;
parse CoreCallStatement = 'broken'; broken
```

Before production edits, the current native process exited **139** during that
compilation. A fixture trace confirms a healthy program had compiled and executed
42 in the same world, then compilation entered the exact malformed source and
did not return. The traced failure was 0.398432 wall / 0.192260 CPU seconds,
105156 KiB peak RSS. The earlier untraced failure also exits139. Both logs remain.
The attempted bounded debugger command found no `gdb` provider; no backtrace or
exact machine fault instruction is claimed. No security configuration changed.

Source trace:

1. Foundation normally declares `CoreCallStatement = $call:CoreCall ';'`.
   An override activates for subsequent input and may parse a statement without
   that capture. Its grammar entities and parsed statement are valid inputs to
   semantic validation; grammar activation itself should not invent a capture.
2. `sem_statement` formerly obtained `sem_member(n, "call")` and sent null into
   module expression admission. `sem_expression_add_result` then reached
   `sem_declaration_state_result`, which attempts component ownership on the
   supplied node. That is a real Invalid resource operation, caused here by
   missing semantic shape validation, not by memory exhaustion.
3. `sem_run` also replaced the failed statement with its missing call child.
   That wrote null into the structural statement vector despite the failure.

Only `semantic_statements.tower` changes in production. It uses existing
`sem_shape` before module operand-query admission and when consuming a call
statement in a body. Failed module statements retain their original node; only
successful call statements are normalized to their call child. The ordinary
shape diagnostic is now **`Malformed CoreCallStatement tree: missing capture 'call'`**.
Real diagnostic-allocation/resource failures retain the existing resource path;
there is no Invalid-to-syntax relabeling, JavaScript catch, new evaluator, resource
override, grammar mutation or default capture. Generic constructor, module
admission, parse-memory and backend owner methods are untouched.

## Focused regression evidence

`malformed_call_checks.tower` is registered as
`tower-lr-work-tests RESOURCE_ROOT malformed-call reproduce|all`, and in existing
`query-smoke`/`all`. It uses the production allocator, shared frontend, explicit
worlds and synchronized 2 GiB ledger, without allocation injection.

- Exact malformed override produces a semantic error with resource status None;
  the successful regression runner exit0 means it checked that rejection, not
  that the malformed program compiled successfully.
- Six independent malformed controls (`CoreIf`, `CoreAssign`, `CoreAddress`,
  `CoreLoad`, `CoreCall`, `CoreFunction`) check exact complete messages.
- A valid `invoke $call:CoreCall` override compiles after failures and its answer
  executes42. An older successful program stays alive in the same world and
  still executes42 after the failures/recovery. This is retained program-owner
  evidence, not permission to mutate payloads through a pinned query view.
- The public source-location map checks the original filename/line/column,
  including a moved invocation after a UTF-8 comment. SemanticProgram offsets
  address concatenated imports internally; the test does not mislabel them as
  local byte offsets. Body error offsets compare exactly between worker counts.
- Three-unit batches combine a malformed function body with two independent
  healthy siblings. Failed and separately cancelled batches publish no program;
  all worker lanes return before close. Cancellation after failure preserves its
  original diagnostic. These exercise the actual production worker transport;
  no measured overlap/scaling claim follows just from the configured lanes.
- All above run at32/64 bits and workers1/4. Four explicit worlds release every
  byte/lane/live grant and dispose their ledgers after retained programs,
  modules and grammar caches close. This is scoped owner accounting, not a claim
  about foreign allocations or universal leak/race freedom.

Standalone focused checks: 3.903273 wall / 5.389753 CPU s,411952 KiB, exit0.
Registered query smoke (including the new checks): 4.316661 / 6.016955 s,
434612 KiB, exit0. Existing `receipt-smoke` first-cause/cancelled-capture checks:
0.044125 / 0.029967 s,51852 KiB, exit0. Exact repaired reproduction:
0.230044 / 0.163607 s,105192 KiB, exit0, with normal diagnostic and zero teardown.

Failures preserved: initial fixture imports were incomplete; pointer-valued
top-level fixtures were invalid library initializers; pointer subtraction is not
an accepted Foundation operation here. Those fixture-only build failures were
corrected without language changes. An initial offset assertion compared a
concatenated semantic offset with local bytes; it failed and was replaced by the
existing public source map plus exact expected coordinates. No diagnostic was
weakened. Production was compiled once after batching the three repair hunks;
subsequent corrections/registration rebuilt only the test entry.

## Matched healthy cost and identities

KinmenA Windows11/WSL2 Linux x64, LLVM19 Release/native production transport,
CPU0-11/24GiB, one owned cache, build parallelism2. Public predecessor SHA256
`768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`;
ordinary public-pin CMake commands, no bootstrap override. The unchanged
`tower-frontend-storage-profile` generates eight independent bodies plus imported
and staged dependencies, observer disabled. Fresh processes/warm filesystem;
paired n3, order reversed for pair2. All12 processes check answer42, identical
source/import/canonical hashes and zero final byte/lane/live grants.

| Workers | Median wall ms before / after | Median CPU ms before / after | Median peak RSS KiB before / after |
| ---: | ---: | ---: | ---: |
| 1 | 498.576 / 494.071 | 441.408 / 437.340 | 176988 / 176460 |
| 4 | 584.514 / 579.242 | 578.543 / 572.842 | 178936 / 179092 |

Wall differences about-0.90%, CPU-0.92%/-0.99%; no material observed regression
and no speedup claim from this small sample. Four workers remain slower on this
small workload. Peak charged bytes remain108202107 (one worker) /108151819 (four).
Canonical bytes13848/hash14243253176332855356, source hash10240961210026777659,
import hash9841053087281335157 (existing Tower profile hashes, not SHA256).

Durable evidence directory:
`C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/malformed_call_b79737e2`.
It contains baseline/crash/fixture-failure logs, scripts, exit statuses, build/link
commands, paired raw measurements,77 test-entry and368 profile input SHA256 entries.
Final SHA256 identities:

| Artifact | SHA256 |
| --- | --- |
| native test entry | `2e4d053839c8e87b783b75bf2df75e3e8d49b28b49336545814f26011d510946` |
| repaired profile | `37679ed62b79437d23177af930b8fb5492d76fd25f0033e4618fc187dace660a` |
| repaired semantics object | `e3e581c478018a6cd8d6be1b5b9f95eb9e66c62c8dfe4a90ebf2515929be6b7c` |
| preserved baseline profile | `84ff429e690c10cb5d9bc015597f63ae7eb0260fbe81eff95f57524066e0c9fa` |
| current-source baseline semantics | `bffe99fbb9afa801ebad9248126189670d46d674a7f7a8f09a767ffc1356dca9` |

The six-file Node batch was not repeated or relabeled passed. ROOT must adopt this
later source in its next joined artifacts and check the existing transport
assertion there. Browser/generation/release gates and the separately service-blocked
instrumentation requirement remain open; none was run here. All old stashes and
todo are preserved. No deployment is part of this source repair.
