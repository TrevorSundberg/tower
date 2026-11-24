# A1 historical staging extent acceptance

- Frozen production/mounted source: `e3958206f7d086e6bd0378b5a9d7381ce00f86d2`; this batch changes fixtures/registration/docs only.
- Public predecessor: default checked-in Linux x64 `eeb005717318086c145428edc3b6b784d4729df7ef0514c7329e0a18b76dda9c` (compiled59d); no private compiler.
- Linux x64 in KinmenA `tower-a1-environment`, CPU12–23/24GiB; LLVM19 Release native target, compiler `--jobs 1`.
- Current fixture execution uses newly linked production providers, not the predecessor's runtime as evidence for current source.

| Historical case | Actual current disposition and oracle |
| --- | --- |
| `u8[combine(increment(&count),increment(&count))]` inside an ordinary helper | Exact source retained in `staging_extent_invalid.tower`, including `comptime(ordinary_helper())`. Rejected at both widths/workers by the documented mutable/escaped capture policy; no program, stable first error/offset on terminal retry. Calling the outer helper at compile time does not make its captured local eligible for a static annotation. This is a language limit, not evidence of a missing callee continuation. |
| `u8[identity(i32,3)]` | New exact expression in `staging_extent_helpers.tower`; `sizeof(decltype(generic)) == 3`, complete program result0, canonical recompile/execution. Previous `generic_capture` alone did not establish this expression. |
| Aggregate extent helper | Existing `computed_type_arguments.tower` already calls `measured(5)`, returns an aggregate and reads its field. Reused unchanged; new helper additionally passes the aggregate result into another ordinary helper, expected extent5. |
| Indirect callback | Existing `u8[indirect(&twice,3)]` already proves typed indirect staged execution, extent6. Reused unchanged; new imported-module helper retains the same independent6 oracle. |

- Existing fixture blob `159c91cdf8c7544b73dae60e55d89c7ed12948ae`; b90b6f4e integer-argument receipt is historical context, not current acceptance.
- Supported mutation form is `u8[ordered_extent()]`: two increments belong to the staged invocation's local frame; combine must see1 then2, final counter2 and extent12. Reversal gives21; replay fails the counter/result oracle.
- Compiled ordinary `ordered_extent`/`increment`/`combine` functions also exercise real `IMFunctionInput`: keep combine pending after both arguments, step three times with unchanged steps/frame count/memory, publish, resume to12. Four trials,12 repeated waits; invocation closes before input components/kind retire.
- That publication delay is controlled **after source compilation joins**. It is not a claim that each frontend compile naturally suspended at this exact call; existing query-smoke separately exercises real pumps, waiting/cycles/cancellation and failed snapshot publication.
- Ordinary module import `tests.staging_extent_helpers` plus single-unit helper text both compile/run. This is one unit's module graph, not independent outer jobs presented as shared cross-file query caching.
- Forward helper bodies, generic/type/layout construction, aggregate arguments/results, module capture4, local capture9/shadow2, and untaken recursive call (extent7) all retain literal oracles.
- Serial/four full canonical bytes agree separately per target32/64 for new single/module sources and unchanged computed fixture. New single/module Foundation outputs reparse and execute to0 at both widths.
- `staging-extents` is registered in `tower-lr-work-tests` and included in `query-smoke`/all;24 compilations:20 successes and4 expected capture denials, none skipped.
- Four observed module compilations: semantic threads/peak1/1 serial and4/4 with workers4 at both widths,571 kernel events each. Counters are synchronized observer evidence, not requested queue width or throughput.
- Joined module worlds retain15,993,554B/12,676 owners serial and15,990,730B/12,677 owners four before close; lanes0. Terminal retries preserve bytes/owners and dispatch count. Existing close checks world/ledger disposal; no allocator instrumentation or universal race-freedom claim.
- Exact capture diagnostic: `Compile-time expression cannot capture runtime storage: binding is mutable, escaped or lacks an initializer`.

Validation (wall / user+system CPU / peak RSS KiB, n1 validation costs; fresh processes, warm filesystem):
- Dependency-aware `tower-lr-work-tests` build: initial unset CMake bootstrap path rejected before build; explicit documented public path restored. First build95.28/68.11/894628 failed missing fixture `pthread_self` declaration; subsequent missing `entity_create` declaration also retained. Explicit imports corrected; final target succeeds.
- `cd scaffolding; tower-lr-work-tests /work/scaffolding query-smoke`: exit0,10.13/9.91/386616; includes new24 compilations and existing failure/continuation/cancel/overlap checks.
- After adding explicit terminal dispatch-count assertion/named fixture bounds, affected `staging-extents`: exit0,7.77/7.22/212916; same four-thread/peak observations and all24 compilations pass. Unchanged query checks reused.
- Frozen runner SHA256 `6331ca2175cba3a7301e33aab3deb96e742b33ca3a2967b82ed1121162ca6f15`; first query runner `fc176fab34913b4bcb4228585d7eb9cca22d096a650c7d51d59b66fa367f1960`.
- Raw logs/times, fixture patch and input/binary hashes: `C:/Sandbox/build/codex_ecs_20261122/A1/cache/staging_gaps_e3958206/` (`build*`, `query.*`, `staging_final.*`, `inputs.txt`).
- No production change: before/after performance profiling is inapplicable; costs above measure validation only. No browser/reactor/generation/full type/control/sanitizer/local verifier run or release claim.
- Owned jobs drained; todo unchanged;313GiB free. ROOT retains final integrated release ownership.
- Final integration: fixture commit `7a0d9eff` plus complete origin `ca1c893e` preserved as `6aa2d8994e383ed1407a96bcb869d17ff9da26e1`. Incoming LR prediction index/quota diagnostics rebuilt via the same target (57.26wall/34.87CPU/892588KiB, exit0); merged query-smoke passes10.56/10.32/405912, including unchanged24 extent trials and actual threads/peak4. Runner SHA256 `7347fc9e9b34ac1652076c30e38d75fde7f0e6d854c577a962df49f533a04b9a`; `build_merged.*`/`query_merged.*` retain exact evidence. No expanded platform acceptance.
