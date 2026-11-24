# Registry fixture ABI and native-pages boundary — independent D2 review

Frozen published `effab4bd4fdd3fc789a877de8c3cb170e1d6acf0`; five-line implementation `36dcf73e2547495feae23d0f3c7c9684e9904b2c` is present. No production edit or concurrent pages investigation.
Disposition: no concrete defect found in the fixture repair; the remaining pages Capacity failure is real and stays open with L2. Source review is not another execution receipt.

| Reviewed source | Exact Git blob | Scope / disposition |
| --- | --- | --- |
| `scaffolding/tests/generic_registry.tower` | `8dfb1fcd83151a0d822b177899123c0cc06235fc` | Full fixture read; sole delta supplies fail-fast lifecycle ABI. |
| `scaffolding/tests/entity_views.tower` | `decbfb8eb5a89d6cc0f9152429a51fd8a6d1266f` | Existing identical signature/unconditional trap is the scoped precedent. |
| `scaffolding/tests/generic_body_budget.tower` | `68369b248205d40993539fb64006aae6d24fd143` | Imported fixture also uses only registry kinds; ownership checks unchanged. |
| `scaffolding/compiler/generic_registry.tower` | `7793ca8b55495604b55fcdb3d318cff5ab638118` | Context/template/instance/origin registrations all explicitly lifecycle0. |
| `scaffolding/library/entities.tower` | `e263f6abba28c56b5643dc72a1803ab970678881` | Exact extern ABI and nonzero-only dispatch before payload/type release. |
| `scaffolding/tests/module_body_type_checks.tower` | `55407fac4f622a6968ec631caae2b66d9ad18a55` | Actual2GiB execution/reparse helper and pre-assertion cleanup traced. |

The new export is exactly `fn tower_entity_finalize(lifecycle: usize, component: EntityComponent*, data: u8*): void`; it matches entities' extern declaration, including parameter order and return type, without captures or casts.
Backend lowering emits the ordinary public name unchanged, LLVM C convention0, target-width integer plus two target pointers and void return. Plain-name foreign_symbol selects convention0; both declaration and export use the same type lowering. No non-C ABI or backend override is introduced.
The callback unconditionally traps, even if incorrectly called with0; it cannot silently accept a nonzero lifecycle. LLVM trap lowering calls tower_trap then unreachable; the ordinary native guest trap reports the error and exits1. No deliberate callback-injection execution was added or rerun.
generic_begin_result registers GenericContext with lifecycle0; generic_registry_type_result passes0 for all three kinds. Entity registration retains that layout, rejects incompatible re-registration and dispatches finalization only for nonzero IDs. Stage discard uses the same guard.
Thus ordinary zero-lifecycle destruction never invokes the callback; existing type retention after root release, cross-store rejection, body-budget checks, repeated registry creation and final zero store/component assertions remain unchanged. A future nonzero kind must supply a real lifecycle policy, not reuse this fixture trap as a destructor.
The compiler host dispatcher still handles real compiler lifecycle IDs and rejects unknown ones; the browser compiler-entities adapter still throws for unexpected plain-component finalization. The fixture completes its own native link ABI and does not replace either production contract.
Necessary dispatch/emission/adapter and pages helper blobs are retained in the raw map. Relevant production/callee bytes match L1's b862499b freeze; later unrelated source remains outside the runtime claims.

[L1 owner evidence](native_ecs_b862499b.md), attributed only: source `b862499b73349b241e7e384d17a1dcab8a8c0800`, public59d/eeb predecessor; Ubuntu24/LLVM19 CPU0–3,8GiB external cgroup/no swap on15GiB WSL.
Native compiler SHA256 `482aa811fc7f69af4b27619d9d91c19dbae7af1e53694d3d0045a0d465af8841`; execution runner `47175240c4547e4fc2449cd7152a33cfb74a2d0dda2f57c940d16334646b36bf`; fixture SHA256 `e2a6709f804288c297f372dc1b01480b67988dbf95d3cfe2cbeef940fa87c6da`.
Views and repaired registry complete32/64 worker1/4 Graph/Fast/canonical/raw-O2 reconstruction paths and Linux x64 raw/O2 native outputs0. Actual missing-symbol link remains a prior failure: `undefined ELF symbol: tower_entity_finalize` exit1,1.72s wall/1.38s CPU/179796KiB RSS; repaired link1.84/1.34/175072 then native0, with unchanged compiler binaries.
Owner total60 successful command phases includes source-world/recheck2/2;52 Graph/Fast trials, five original Graph and four native executions return0. Validation phase sums: views116.30s wall/126.31s CPU/max child RSS1766304KiB; registry188.51/200.37/1959712, not throughput comparisons.
Pages32 source/direct canonical execution and worker-equal reparse pass; raw LLVM import/recheck workers1/4 produce identical4,769,423B Foundation, resource0 and final charged bytes/grants/lanes0. Those phases do not imply subsequent reconstructed execution passed.
Raw reconstruction peak charged bytes2,274,158,856/2,274,158,080 belong to its24GiB compiler ledger, with83,886,080B ledger metadata retained until disposal. They are neither the external8GiB cap nor process RSS, and do not identify the later reparse's exact allocation site.
The subsequent execution helper compiles that expanded Foundation under2,147,483,648B; it reports `Semantic memory budget exceeded` at110976:5. sem_resource_message maps this string to WorkBudgetError.Capacity; the positive execution check remains failed.
Failing input SHA256 `a4e1eaaf5503f4f8596afe49352e74078f349938029b26f536833a0a32b51b46`; earlier983,366B canonical SHA256 `47f43eaa4e547f5e83097c03597a22862b9d611b5ef73139fc748d650aca296c` is a different phase/input.
module_body_type_trial_steps closes the failed session, destroys module inputs, clears/disposes its world and asserts budget bytes/live/lanes0 before returning false. backend_pointer_text_execute then aborts at `Pointer canonical execution`; this source ordering supports scoped cleanup before outer134, not a post-abort heap census or cleanup of every outer buffer.
Actual child723 exits134/SIGABRT,17.80s wall/9.62s CPU/2433156KiB RSS; external group peak2,908,897,280B/OOM-max events0. GNU time's printed exit-status0 is not success; shell134/signal6 govern. Existing fuel100000000 and180s guards/caps were unchanged.
Eighteen later pages phases remain unstarted: optimized32, all64-bit and native execution. Full pages/native milestone is blocked, not skipped-as-pass; L2 owns diagnosis/fix. No blanket memory/race/browser/release acceptance follows the successful families.
Owner raw logs/artifacts: `C:/Sandbox/build/codex_ecs_20261122/L1/native_ecs_b862499b/` (`fixed/`, `ROOT_handoff.txt`); prior OS launch127/cwd errors remain preserved. D2 did not inspect unavailable raw runtime sets or rerun them.
D2 exact source/callee map and five-line diff: `build/d2_ecs/registry_abi_peer_effab4bd/`. Documentation/source-only profiling inapplicable; no build, heavy lock, runtime, instrumentation or deployment action. Disk126GiB/RAM9.7GiB at entry; ROOT retains release ownership.
