# Pool admission and query observation peer review

Source-only B1 review of A2 `ae4dea8d1d379b20cd9540813c79a1cef21250c6`, preserved through `24ac43dc`; no blocking defect found in these two changes.
Frozen published source `887f25392374b65234e858fbf3f94a3d824441c8`, tree `c11a726172d1f55c1161e043e19ef2653970f8e8`.
Pool fixture Git blob `9a61471778c32189689f288f26423ad96d16c95c`, SHA256 `f11387bca80c1a227fb51c06e2a7825a594792d27099376ae55afa10e98a288f`.
Query fixture Git blob `ae979ae4f792d5f661109a3bf91d71c1e560b57a`, SHA256 `16527f22ba645303ec43b48f7b93214257b78f221f26ddd41558ac5dcdc88539`.
Exact fixture deltas and 20 reviewed source/receipt identities are retained in `build/ecs_b1/pool_query_peer_887f2539/{ae4dea8d.diff.txt,reviewed_sources.tsv,freeze.txt}`.

`semantic_declarations.tower:1980–2041` creates empty checked vectors, then takes ready declaration/type tickets; only a nonempty batch opens the pool.
With neither declaration nor generic-copy work, `sem_generic_copies_execute:159` also leaves its vector empty; the pump returns Complete, not Capacity, under full pressure. Pending dependencies would instead return Waiting.
The repaired fixture checks that empty path, releases pressure, creates a real KDeclare subject/state, marks Pending and seals/demands its Declaration query. This is not undemanded padding.
It pushes that pointer into the same `work_vector(SemanticDeclaration*)` used by the pump, records `reservation.bytes`, and disposes the probe before the baseline snapshot.
`work_vector_reserve_result` delegates to `work_buffer_grow_elements/resize`: actual native element capacity plus compiler allocation header is charged, including simultaneous replacement storage; no target-width estimate or arbitrary allowance is substituted.
The pressure receipt leaves exactly that one batch charge. Pending admission avoids stage allocation; pool opening precedes finishing-vector reservation and dispatch. Thus required pool storage is the next denied boundary.
`work_pool_open_impl:123–176` clamps host capacity, reserves slot bytes before publishing slots or opening handles, and preserves typed Capacity versus physical Memory. No execution lanes are charged for retained slots.
`sem_workers_open:466` restores the actual pool error; `sem_restore_resource:818` and `sem_resource_record:33` retain the first program cause. Releasing pressure cannot clear that terminal program receipt.

All 16 configurations are accounted for: target pointer widths {4,8} × requested workers {1,4} × {Direct success, Direct denial, Declarations denial, Layout denial}.
That means four retained-pool successes, twelve denials, four full-pressure empty-declaration controls, and 36 terminal retry calls after pressure release; no successful declaration execution is claimed by this pool fixture.
Success checks require the active reservation's exact budget owner, `count * sizeof(WorkSlot)` capacity/header charge, unchanged lane usage, stable slot pointer on reopening, and unchanged bytes/live grants.
Denials require both program and pool Capacity, zero slots/running jobs/storage, original owned bytes plus pressure, exactly one additional live receipt, and unchanged lanes.
The revised byte equality is necessary: the pump's temporary batch is disposed on return, so its reserved headroom is free again. Comparing against the full cap would misclassify correct cleanup.
Retries require continued failure/Capacity with unchanged entity/component counts and no pool; context disposal closes/drains the pool before evaluation disposal, then program/root/world disposal precedes final zero bytes/lanes/live grants and budget disposal.
Budget release validates owner, revision, slot, generation and charged values. Its retained receipt-vector storage is freed by budget disposal; charged bytes are not RSS or host-handle accounting.

`semantic_query_failure_checks.tower:35–44` adds only a scalar copy of each invocation's typed `storage_error`; it does not write invocation state, allocate, change admission, or relax assertions.
Each stack probe points to a distinct stable evaluation component and stays alive through pump/teardown. The wrapper calls the real Evaluate kernel synchronously, then reads its private invocation before returning.
`compiler_kernels.tower:40` calls `interpreter_invocation_step`; disposal occurs later in coordinator `semantic_evaluation.tower:567–599`, after `compiler_kernel_dispatch_admitted` has joined.
`work_pool_batch_result:251` executes each job at most once, inline or through the claim gate, and drains admitted workers on return; slot finished signals publish worker writes before coordinator reads. This establishes the observation lifetime without a race-freedom claim beyond this contract.
The failure-only print reads copied probes after that join; reading the invocation after coordinator disposal would lose its cause because `interpreter_invocation_dispose:1824` resets it.
The retained constructor failure is real: full pressure precedes execution; reported program/interpreter Capacity with graph None and missing suspension/peer completion does not exercise the intended graph-producer denial. The observation does not identify the exact interpreter allocation.
The original suspension, peer completion, no-publication, drained-ticket, three terminal retries and final zero-owner assertions remain intact. A2 owns the admission-family repair; no implementation or fixture was edited here.

Owner evidence remains [57 passed / 1 failed / 6 unstarted](native_ecs_acceptance_1072141e.md), not full native acceptance; body/declaration query cases, three dispatch cases and retained-source updates remain unstarted in that receipt.
Reused owner merged costs only: pool pass 0.098095 s wall / 0.039607 s CPU / 51120 KiB peak RSS; constructor exit 1 at 0.031147 / 0.020051 / 51716. These are validation costs, not B1 executions or performance improvements.
Owner raw logs: `C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/native_acceptance_1072141e/{pool_*,query_observation*,merged*}`; original failed attempts remain preserved.
No build, runtime test, profiler, sanitizer, package mutation or deployment was performed. Source-only runtime profiling is inapplicable; production and test sources remain unchanged. Initial owned cache was drained with 106 GiB free.
Final integration boundary is recorded in the journal; any later A2 constructor-family changes are outside these exact reviewed blobs unless explicitly added there.
