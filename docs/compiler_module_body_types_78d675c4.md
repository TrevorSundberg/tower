# Module-local forwarding type queries

## Boundary and repair

Frozen published base: `78d675c441cabba99f05276656717e53d01ead6f`, tree
`5fb0898bd398ac6cc1d641adb5614d7b83711152`. The ordinary native producer reproduced
the supplied seven-line source: exit1, `Unknown type constructor 'forwarded'`,
line6:14, 0.455s wall / 0.396s CPU / 177960KiB peak RSS. Failure teardown reached
zero explicit-budget owners. The source is preserved as
`scaffolding/tests/module_body_type_minimal.tower`, SHA256
`6020b38c00a621e5622dc85bc9e118f8e233a75989b75cf212b51a1a5931f7df`.

`sem_statement_impl` bound immediate module locals and called synchronous
`sem_declaration_type`. Function-body declarations instead registered a producer
with their lexical frame. Thus the direct record constructor was available while
the ordinary forwarding function had no prepared type result. This was not a
missing name registration or a target `usize` identity difference.

`sem_module_declaration` now registers the existing declaration query after
binding, saves the header/block lexical frame, and runs the shared coordinator
frontier. It reports the declaration before requesting its initializer, restores
the completed lexical state, and consumes the checked initializer once. The
initializer explicitly depends on the declaration; storage is allocated by the
existing continuation before address-taking. Normal finish sees the checked value
and cannot replay it. The caller selects this boundary only for immediate root
locals without an active declaration frontier, private stage or query-read set.
Function-body/worker continuations retain their existing suspension path.
No constructor registry, evaluator, scheduler, stage protocol or type identity was
added. L1's loop-control/capture proof and A1's executable-publication implementation
are unchanged. Header declarations use the same local declaration boundary;
condition/update/effect handling is untouched.

## Focused execution evidence

KinmenA Windows11/Docker Linux x64, LLVM19, production allocator, CPU0-11,
24GiB container limit. Existing native cache; compiler jobs1, build parallel2.
Public predecessor SHA256
`768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`.
The changed semantics object compiled first, then the existing dependency-aware
execution/query/profile targets linked it. No private compiler override.

| Check | Result | Wall / CPU seconds; peak RSS KiB |
| --- | --- | --- |
| Exact original source, Graph and Fast | exit0 | 0.519 / 0.440; 181524 |
| `body-type-queries` | 44 compilation/execution or exact-negative configurations, exit0 | 9.018 / 8.165; 236932 |
| `query-smoke` | exit0 | 3.534 / 4.479; 415076 |
| `type-smoke` | exit0 | 124.992 / 116.790; 267408 |
| Existing `module-loop-queries` | exit0, bool/capture/cycle diagnostics and offsets | 6.604 / 6.230; 228692 |

The new suite is registered in `tower-execution-tests ... all` and selectable as
`body-type-queries`. Five cases run at32/64 bits, workers1/4, with separate Graph
and Fast sessions: exact minimal source; initialized module-loop alias mutation;
function-body/nested-scope control; unknown constructor; recursive by-value layout.
Two additional width-specific canonical Foundation round trips run both engines.
Canonical bytes agree between engines/workers for each target. The initialized
case checks42/43, target-dependent4/8-byte layout, shadowed i16 value7/layout2,
and exactly two loop entries/effects. Unknown errors retain1:69; recursive errors
retain1:37 and the complete existing instantiation trace, including its existing
empty-name outer trace. Failed programs cannot start either engine. Every explicit
world reaches zero bytes, live grants and lanes after disposal. These are bounded
checks, not proof of universal race freedom or profitable overlap.

Preserved failed diagnostics: the first harness build lacked module API declarations;
the first function control accidentally tokenized `*=`; the recursive expected
message initially omitted the existing instantiation trace. All were corrected in
the new fixture without changing production diagnostics. The first profile script
selected a pre-rebase canonical receipt; its failed comparison is preserved. Final
comparisons use the actual frozen baseline's checked canonical receipt.

## Small matched healthy control

Existing `frontend_storage_profile`, eight independent bodies plus imported/staged
dependencies, plain mode (census disabled), n3 before/after alternating order, warm
resource/cache conditions, fresh processes. Baseline and candidate use identical
mounted resources and source/import hashes10240961210026777659/9841053087281335157.
All runs check answer42 and canonical hash13963953848021265584, 11412bytes.

| Workers | Median wall before → after | Median CPU before → after | Maximum peak RSS before → after | Peak charged bytes, both |
| --- | --- | --- | --- | --- |
| 1 | 0.461506 → 0.458647s (-0.62%) | 0.403442 → 0.401955s | 177960 → 177736KiB | 107430664 |
| 4 | 0.527564 → 0.523657s (-0.74%) | 0.511867 → 0.506851s | 180360 → 181020KiB | 107378560 |

Serial wall ranges: before0.457600–0.466456s, after0.455784–0.511354s;
the slow first candidate makes its serial mean2.9% higher. This small control
does not establish a speedup. Four workers remain slower for this small workload.
Every profile ends with zero live charged bytes/grants (the fixture also checks
lane teardown). Ledger metadata remains10485760bytes; raw/foreign allocations and
process RSS are separate. This is a healthy compiler regression control, not a
timing comparison of failing versus successful forwarding compilation.

## Reproducibility and remaining adoption

External logs/scripts/statuses are retained under
`C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/module_body_types_78d675c4`.
`candidate_commands.txt` contains actual compiler/link commands;
`candidate_fixture_inputs.sha256` and `candidate_profile_inputs.sha256` contain
the checked dependency hashes. Both were checked after execution. The positive
runtime input SHA256 is
`67a2daf1918932577e6fc097e1e833c7b75edd67447d8fa6c87e8acfcf9a5dd1`.

| Artifact | SHA256 |
| --- | --- |
| Preserved baseline profile | `580aa88475640b542a4f312afa56bc958fdb7b50203317119bebbe6d931d35e0` |
| Candidate semantics object | `0c8b8341068106fb113ef8b790ec36591d98aa38673f68f5e1694e655d60834f` |
| Candidate execution tests | `cec102811d94bcd0f88aea2da1e7bace36f35465a9e0587c195953530e37b37f` |
| Candidate query tests | `17bdc96212cd511a80a548784341e8076c64e0a5ef2b1375bb6ea4858cea6336` |
| Candidate healthy profile | `7bac0b730feef2e49116e0067bb90acbcb3d07899a8fd0a47b40f1d79fd933b9` |

The new suite covers this body-local annotation boundary, not L1's separate
mutable header capture proof. ROOT owns later-source adoption, portable/reactor
builds and final release. No browser, generation, sanitizer or hosted release was
run or claimed. The previously service-rejected instrumentation gate remains
open; all three pre-existing stashes are preserved. Temporary frontier vectors
retain the existing coordinator ownership model; this change does not extend the
physical memory budget to raw vectors or foreign allocations.
