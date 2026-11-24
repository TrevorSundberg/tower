# D2 independent capture-scan review and execution

- **Source review and five focused selections PASS; no producer/fixture defect found.** This supersedes the provisional missing-candidate status below in journal history; no production edits or assertion changes were needed.
- Actual repair `6479007de2f4cc1e445a95b243cbe75973eea7bc`, published `611f6106d0f5e8d8f35418bd77850f8a3cdb6c62`, tree `25d6f28bac4352666fbdd4bd8d99fbafff4aee13`; compiled source boundary `28937e407f38d62a76d3337bbfbf62aa91c4fb30`. Later documentation is not a new runtime identity.
- The original single2700s artifact wait expired with exit1. Delivery arrived during reconciliation; the scoped blob check stopped publication of the provisional receipt when the actual patch appeared. No wait restart, source guessing or rejected-candidate revival.
- This is the **context scan-owner reuse** candidate, distinct from historical absent-edge rejection `b306c53dc`. `sem_known_edges` remains byte-unchanged, including null edges; the producer only borrows `c.scan`/`scan_storage`, requires empty healthy entry and clears length with lexical defer.
- Exact patch/fixture/registration blobs match ROOT's descriptor;23 reviewed producer/caller/test/build blobs are in `final_reviewed_blobs.tsv`. Related lowering cursor/pool changes are preserved as joined inputs, not reimplemented or independently performance-approved here.
- Required order remains left/right/value/target/body/otherwise/items pushes and reverse LIFO visitation; Function/Type/Label stop descent. Duplicate/shared real edges keep their occurrences; no deduplication, ordinal change, recursive function lease or eager branch evaluation is introduced.
- Sole production caller `sem_lower_frontier` prepares synchronously before function lease, view and dispatch. Component/kind/name lookup, stage leasing and error fallback do not collect tokens, resolve source or call semantic work; byte-only WorkBuffer grants cannot trigger lane wakeups.
- `sem_collect`/`sem_token_text` clear the scan before return; their returned result/text has a separate owner. Worker snapshots call `sem_scratch_private`, clearing scan/storage ownership. No borrowed entries escape to a worker, suspension or callback.
- `sem_push_checked` explicitly recognizes `&c.scan`, avoiding scratch-index search. WorkBuffer growth reserves old+new physical bytes transactionally; denial leaves the previous pointer/capacity/grant intact. Cleared slots are nonowning, outside length, and context teardown releases retained storage after drain.
- Per-declaration leases remain separate from function leases/pinning. Capture range begin/end, current owning function, exact revision/profile/dispatch, source-binding owner/ordinal and late-producer suspend/observe/finish checks remain unchanged; aliases and frame identity are not inferred from offsets.
- Structural discovery does not demand an untaken staged read/effect. Original proof, executed-control-flow, required/optional input ownership and final producer-drain closure remain authoritative; no replay or early lease release is added.
- New `semantic_capture_scan.tower` is an independent physical-owner oracle: real selected ticket/stage, literal42 initializer, real competing declaration lease→Busy, pointer/grant-generation/allocation-count reuse checks, and geometry-derived growth beyond actual capacity.
- Capacity uses remaining ledger bytes; Memory uses actual allocator denial after warming nonempty grant slots; prior Busy retains offset29 versus growth offset73. Failure cannot update the expected retained pointer/capacity/charge. Retries allocate nothing; fresh success grows and finishes; stage/context/program/world teardown requires zero bytes/lanes/grants/buffers. Eight trials are serial32/64; they do not prove threaded fault injection.
- Delivery hashes verified: patch425e1646…, binary archive268e53dd…, source archivee4570e31…; safe relative regular-file extraction. Supplied storage/query ELF hashes matched4d77960c…/a218d602… but were **not executed** because source-manifest verification failed.
- Source archive has1,245 members; all1,230 Tower files match published Git bytes. Its15 non-Tower CRLF differences were retained and shown to be outside selected controls, with no source normalization.
- Supplied `merged_source.sha256` mismatches nine Tower files. Three match exact CRLF variants; six remain unexplained: semantic_attributes, semantic_defer, semantic_enums, semantic_iteration_work, semantic_known_bindings, semantic_values. Original failed logs/hashes preserved; no checksum rewrite or inferred binary/source equivalence.
- Recovery: built only `tower-storage-tests` and `tower-lr-work-tests` in the existing drained D2 native cache, with exact published scaffolding/CMake/bootstrap equality and public/default bootstrap SHA `04ae22d0e73e3674e43895ea2d1efc13da8b7a6b4704df5815369490e6fcfc47`. No install/vendor/reactor build or private compiler override.
- Fresh local ELFs: storage `a94b9a2104525c7402c93655e630bf8be7ee95b27340447653ccbcb7de3e2aad`; query `1ae9a31bc7e688a824027e99b2f2804331caf8e43a2e5b3c34b95b449ef2d8e1`. Source and binaries rechecked after execution; no changed input during the one dependency-aware build.
- Host: existing `tower-d2-ecs`, Release/LLVM19, affinity0,2/quota2, resident+swap cap3GiB (swap0), compilerjobs1/outer1, ordinary non-sanitized runners. No unrelated cache/job was touched;124GiB disk remained free.
- **CTest capture-scan1/1** selected and passed, its original30s timeout; retained CTest output explicitly reports8 serial trials and zero owners. Other CLI guards remain180s, fresh process per selection, no skip/retry/timeout or alternate oracle.
- **query-smoke PASS:** cancellation/ordered failure, staged extents/owning frames, mixed frontier, clone/publication, lazy evaluation and continuation checks. Actual module observation is one thread serial and **two distinct threads/peak2** for requested4 at both widths on this host, not four-core scaling.
- **capture-policy28–39 PASS:** executed versus untaken address/comparison/effect cases, function/type values and exact diagnostics. **lifecycle11–22 PASS:** aliases/shadowing/local type/nesting/forward reads/reuse/early/mutable/escaped/parameter/untaken captures. **lifecycle24–27 PASS:** module capture/write/escape/complex-capture controls.
- The16 explicit lifecycle case completions cover64 original32/64/requested1/4 trials; selected positives retain interpreter literal output plus serial Foundation reparse and serial/worker canonical equality. Original failure-publication, diagnostic and final ownership assertions remain intact; no additional Fast-mode claim inferred from a Graph-only helper.

| Validation (wall / user+system CPU seconds / peak RSS KiB) | Result |
|---|---|
| One focused build:186.64 /177.90 /873984 | exit0 |
| capture-scan:0.08 /0.06 /50832; query-smoke:24.21 /24.15 /271908 | both exit0 |
| capture-policy:41.11 /40.51 /186848; lifecycle11–22:44.47 /43.80 /187732 | both exit0 |
| lifecycle24–27:13.72 /13.50 /187088 | exit0 |

- These are independent validation costs, not D2 speedup samples; GNU time records process-tree CPU/max-process RSS. No OOM event; the container's historical memory.peak predates this cap and is not reported as current test peak. Owned locks/jobs drained; todo unchanged.
- [L2 performance](compiler_capture_scan_c185948f.md) remains attributed at c185948f:32 timed samples, small n4 wall+1.19/+1.14%, single serial−2.78%/CPU−3.12%, large/eight effectively flat; retention equal. The extra-small subset is not the aggregate. No universal win, race freedom or new instrumentation/browser/release adoption is claimed.
- Raw `build/d2_ecs/capture_candidate_peer_r3/`: descriptor, borrow proof references, patch/blobs, source/ELF verification failures, local build/ELF identities, five checked logs/times/exits and drained jobs. ROOT/L2 still own resolving six supplied-manifest discrepancies; they do not block the independently rebuilt published-source correctness result. ROOT owns final release.

ROOT provenance resolution after this peer run: all nine physical Tower differences
are CRLF/LF placement only, including six mixed-ending files. Each original
physical file matches its recorded merged build SHA and its Git-filtered blob
matches28937e40. The exact files/proof remain in the source supplement named in
the current handoff. D2's recorded failed verification and independent rebuild
are preserved; supplied binaries were not retrospectively counted as executed.
