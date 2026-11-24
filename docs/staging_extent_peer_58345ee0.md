# Historical staging extents — independent D2 source review

Frozen published main `58345ee08049fc08210814bf7423303154c3f71a`; A1 implementation `7a0d9eff`, merge `6aa2d899`, publication `05a23c99` are ancestors.
Disposition: no concrete defect found in the new fixtures or their registration; source review closes this scoped peer gap, without rerunning A1's acceptance.

| Fully reviewed fixture / registration delta | Exact Git blob | Disposition |
| --- | --- | --- |
| `scaffolding/tests/staging_extent_checks.tower` | `8f362c43e6b32390037e60a83d6f18a7c0d126c3` | Literal execution, canonical comparison, controlled waits, observer and cleanup checked. |
| `scaffolding/tests/staging_extent_helpers.tower` | `6027c45723234115808f73ebf6dfd8c37c32cb04` | Independent layout/effect/capture oracles, ordinary forward producers. |
| `scaffolding/tests/staging_extent_invalid.tower` | `45eaac2464077cb0d66ea20aa20af7c38ac59dbf` | Exact historical escaped-local form retained as required rejection. |
| `scaffolding/tests/lr_work_main.tower` | `70a730fc8edfa1ab5a3fe80ba948391aafee72ee` | Explicit selector plus query-smoke/all; existing entries and later generic-quota selector preserved. |

Helpers require `sizeof(decltype(...))` results3/5/6/12 from generic identity, aggregate construction/unpacking, typed indirect callback and ordered mutation; this needs checked type/layout execution, not syntax acceptance alone.
`ordered_extent` independently requires count2 and decimal combination12; reversed effects yield21, replay changes count/result. Both extent construction and explicit `comptime(ordered_extent())` must agree; the runtime program returns/prints exact0.
Forward definitions remain below consumers; local9/shadow2/module4 and untaken recursive arm7 have literal checks. Unchanged computed_type_arguments blob `159c91cdf8c7544b73dae60e55d89c7ed12948ae` additionally executes aggregate/callback/recursive and cross-frame capture controls.
Each width runs two worker settings × five compilations plus two canonical recompiles:24 total,20 positives and4 expected denials. Body-run helpers compare exact `0\n` and full canonical bytes across workers within each width; new single/module canonical inputs recompile and execute0.
Canonical recompilation uses a fresh comparison vector: this establishes successful reexecution, not an additional byte-fixed-point assertion between original and reserialized text. No Fast/backend coverage is inferred from this Graph fixture.
The negative's `&count` is an address escape recognized by semantic_source_bindings; capture publication requires a proved immutable initialized declaration. This is the existing computed-type-argument contract, not a missing callee continuation or permission to use runtime layout.
Calling ordinary_helper via comptime does not make that helper's captured local eligible for its static annotation. The supported alternative mutates locals inside the staged invocation itself, without capturing another frame's runtime slot.
integer_argument_failure requires one failure, null program and exact capture diagnostic, compares worker offsets to that width's serial baseline and retries the terminal step with unchanged error. It does not independently hardcode a source-column oracle.
IMValueInput retains declaration owner/ordinal; ix_value_input/ix_local_binding compare actual declaration/frame identities, not coincident offsets. Published capture proofs retain their query owner; only executed reads request inputs, so the untaken recursion is not a value dependency.
Production sem_evaluation_start retains its invocation; waiting_function/waiting_binding route to executable/capture producers then work_suspend. Executable snapshots publish after body/lowering joins and checked tickets. This immediate contract trace is not a new full pump audit.

The four compiled-helper trials run only after frontend_units_step has joined. A fresh world-owned kind attaches ready increment/pending combine IMFunctionInput to actual compiled functions; there is no hand-built arithmetic graph or production readiness mutation.
Interpreter task scheduling evaluates callee then arguments left-to-right; pending combine requeues only InterpreterFinishValuePhase and restores the step count, preserving cached argument effects. Three repeated waits per trial require unchanged steps/frame count/memory-buffer address and the same pending function.
Those checks do not snapshot every memory byte; the independent count2/result12 oracle detects reordered/replayed increments on resume. Publication supplies the same compiled combine; bounded strict fuel and done/failed stepping must terminate successfully with result12.
Reverse defer order disposes invocation storage/error/output/input buffers, removes both function components, then releases the kind. Program/world outlive all these borrowers; no borrowed component pointer is used after removal.
Joined terminal retries require zero used lanes, equal retained bytes/live reservations and no new observer calls. frontend_units_close cancels/drains, closes pools, releases program/module/world/input owners, then requires budget.live0 before disposal; this is not a whole-process heap-leak proof.
The observer uses a work_gate around counters/thread IDs; callbacks bracket real SemanticKernel work, and reads occur after joins. Observer removal precedes world close; its gate outlives batch cleanup. Peak/count are reported observations, not a minimum-overlap assertion or speedup test.
The imported source uses one frontend_units unit and its module graph; no retained-session edits, cross-world semantic cache or independent outer-unit overlap are claimed. Existing query-smoke supplies separate real pump/cancellation/failure evidence; the controlled post-join wait is not natural frontend suspension at that call.

[A1 owner receipt](staging_extent_acceptance_e3958206.md), attributed only: production e3958206, public59d predecessor `eeb005717318086c145428edc3b6b784d4729df7ef0514c7329e0a18b76dda9c`; Linux x64 LLVM19, CPU12–23/24GiB, target32/64 workers1/4.
Reported24 compilations pass their required dispositions; four module runs report571 kernels each, threads/peak1/1 serial and4/4 threaded. Joined retained bytes/owners15,993,554/12,676 serial and15,990,730/12,677 threaded are pre-close accounting, not peak RSS.
Final fixture selection costs7.77s wall/7.22s CPU/212916KiB peak RSS; merged6aa2d899 query-smoke costs10.56/10.32/405912, exit0. Merged runner SHA256 `7347fc9e9b34ac1652076c30e38d75fde7f0e6d854c577a962df49f533a04b9a`; n1 validation, not a performance comparison.
Initial unset bootstrap-path and missing fixture declarations remain recorded failed builds; owner corrected explicit imports and rebuilt. No D2 execution, sanitizer, browser, generation or deployment acceptance is claimed.
Raw owner evidence: `C:/Sandbox/build/codex_ecs_20261122/A1/cache/staging_gaps_e3958206/` (attributed). D2 exact necessary-callee blobs/source/registration diff: `build/d2_ecs/staging_extent_peer_58345ee0/`.
Three fixture blobs are unchanged since implementation; registration's only additional delta is the separate generic-quota selector. Later unrelated source is excluded. Documentation-only runtime profiling is inapplicable; no heavy lock/build/runtime work, disk126GiB/RAM10GiB available at entry.
