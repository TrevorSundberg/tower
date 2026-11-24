# Signed pointer and stage-ownership native acceptance

Frozen published source: `503677d9c8707c21bdfcfb19d20dc250ba131c31`, including pointer repair015aa9ed, Foundation page policy and the reverted lowering guard. Production compiler/importer sources are unchanged in this batch; A2's `bi_value` work is separate.
Ubuntu24 WSL, LLVM19.1.1, public768 bootstrap, existing `l1_ecs_native` cache, CPU0–3/24GiB scope, max4 build jobs/compilerjobs1. No compiler/reactor generation build.
Raw evidence `E`: `C:/Sandbox/build/codex_ecs_20261122/L1/signed_pointer_stage_503677d9`; commands: adjacent `signed_pointer_stage_checks.sh`. Source/producers and binary/payload SHA256 manifests: `source.txt`, `frozen_producers.sha256`, `selected_sources.sha256`, `artifacts.sha256`.

## Signed predicates

[LLVM19 icmp](https://releases.llvm.org/19.1.0/docs/LangRef.html#icmp-instruction) defines signed relational predicates and pointer comparison as integer comparison. Coverage is default integral pointers under explicit wasm32/wasm64 target profiles; other address spaces/nonintegral pointers are untested.
The Tower-owned LLVM fixture uses the established verifier-only construction boundary with independent pointer parameters. No optimizer can fold its comparisons before reconstruction. Retained IR actually contains `icmp sgt/sge/slt/sle ptr` at lines18/22/26/30 in both `E/signed_pointer_{4,8}.tower.ll`; the test requires all four forms.
Eight literal truth-table rows per profile cover high-bit versus zero in both directions, high-bit/zero equality, maximum versus high-bit, and positive versus zero. Ten predicates include signed, unsigned and equality, with independent expected masks. Ordered operand helper calls must leave trace12 on every row; raw extreme addresses are never dereferenced.
Existing checked world/import/formatter/execution APIs provide fresh Foundation parse, Graph/Fast and workers1/4, output `0\n`, canonical equality and zero final world-budget bytes/grants/lanes. The existing direct-execution helper now also accepts borrowed text; no second execution model.
Two new CTests passed: `tower-signed-pointer-order-4` and `-8`: eight successful engine/worker/profile trials, 64 literal rows (640 predicate bits plus64 effect traces). Eight ordinary-invalid-pointer compilations retain exact integer-operands error at3:19, no execution and zero owners.
The fixture provider is explicitly included only for native execution-test builds, independent of the broader backend-test option. No production ABI or language admission changes.

## Second original failed request

Read L2's preserved `ROOT_handoff.txt` and [T9 receipt](t9_stage_work_a06ec4b1.md). Original a06 browser failure: exit1,341.424963s, integer-operands error1274972; native predecessor error1291590/resourceNone/zero owners. Its optimized IR has the same `icmp ugt ptr` at12576 in `entity_stage_references_record_result`, not an i1 overflow failure. Original artifacts/failures remain unchanged.
Exact input: `L2/semantic_port_a06ec4b1_a9760a9b/entity_stage_ownership_artifacts/entity_stage_ownership_32_canonical.tower`,953744B, SHA256 `f6166fc85d90df0983122f761f6472235bbb76a625e8c523d496dc8767c1e7e9`, reverified before execution.
Current optimized32 source/recheck passes at workers1/4, resourceNone. Both output files are byte-identical:1323476B, SHA256 `302e18e24847973a60c9d583280c509f900152e8e00301e7a9f05c2a823a451d`; LLVM SHA256 `5046a5bb3e8264de7678219c727115114cf2c9ad34273625f3cdc2cb561f7d3a`.
Exact original source and reconstructed Foundation each pass direct Graph/Fast × workers1/4: eight further executions, full output0, canonical equality and zero final owners. No second LLVM optimization was invoked.
Import peak charged bytes554710012/554709236; retained ledger metadata41943040 before disposal; final bytes/grants/lanes all0. Direct execution also checks final world/budget release.

| Validation cost, one process per row | Wall s | CPU s | Peak RSS KiB |
| --- | ---: | ---: | ---: |
| Signed two-CTest selection |1.91|1.51|139440|
| Exact stage import, worker1 |3.80|3.77|702064|
| Exact stage import, workers4 |3.16|4.00|713112|
| Original direct Graph/Fast1/4 |3.29|3.76|404092|
| Rebuilt direct Graph/Fast1/4 |8.33|9.30|753492|

GNU time measures the actual native test process/threads and child CPU, with max-child RSS rather than summed simultaneous process-tree memory. These test-only costs imply no production speedup; no before/after throughput experiment is needed.
Execution binary SHA256 `c5670cb556b1b0bd314354767daeb21a97c9c4921506965ecded41ef91da562e`; unchanged source probe `8312a6eeef90b8ad784ec94f419b17ca69a012eb08c04bb05dd08e2fd9e7351c`. Signed IR hashes:32 `dd93b8539afcdfc949a322b5e6950dd4511e3354d57370fc711a496a5d01b51e`,64 `bf6fff894e2e193e27e892710db9ef8f235b38dcda2501727e3d143a25130317`.
Two failed test-authoring builds are preserved (`draft_*`, `width_draft_*`): reserved field spelling/missing explicit world declaration, then required u32/usize conversion. Corrected through supported Tower constructs; no failed runtime test. Final dependency build14.49wall/8.59CPU s/503784KiB reuses the successfully compiled execution leaf.
Accepted entity_pages/eight prior CTests/24 prior trials were not rerun. A2 owns second normalization; ROOT owns current-reactor T9 adoption, unstarted compiler_work/64/executable phases and release. No broad matrix, sanitizer, pin or deployment claim.
