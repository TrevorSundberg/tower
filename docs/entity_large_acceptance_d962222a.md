# B2: large reconstructed Foundation ownership acceptance

Frozen published source `d962222af10bb062a1ad18c7beb8531ed00dc7ee`, tree `a911c7fb8b00c1c1a647caa48fdda47a2d391329`.
Includes inline children `c12c2189`, B1 four-row Foundation policy, L1 pointer ordering and A2 constant-expression repair; excludes later kind-only metadata work.
Entity ABI: native descriptor208B/aligned stride224B/15 rows per page. No production or fixture source changes this task.
Linux x64/WSL2, LLVM19.1.1 Release, CPU12-23/quota12/24GiB, owned `/cache/native`, compilerjobs1/buildjobs6, public768 bootstrap/no override.
Original request972596B SHA256 `403fdc6b0b6c9cd38cbf4e9c6b20858e1cb0c64a8d3342d91f54c72501807e2e`.
Original reference4709291B SHA256 `452132b90d4a73b43ec3f19153d8b344b201955640c7e6fd0a97203f2d858218`; both supplied files verified before/after drain and untouched.
Probe SHA256 `0af6be32dfcf25bd698108be2e905862639e4c95eb1816b4d2c95965fe9688a8`; runtime object `c7249d55988f060faf1296cef573c496c38a12483704c9156ead5fb384b3506a`.
One dependency-aware six-action rebuild for backend source and two serial fault consumers:9.356710s wall/11.431656s CPU/479588KiB peak RSS.

Same frozen request/resources, wasm32 target, unoptimized import/recheck; fresh processes/warm files, one sample per worker setting, census separately enabled.

| Selection | Wall s | CPU s | Peak RSS KiB | Peak charged bytes |
| --- | ---: | ---: | ---: | ---: |
| Workers1, census off |10.403018|10.362355|2607796|2300797740|
| Workers4, census off |8.639707|11.581308|2616504|2300796964|
| Workers1, census on |11.926777|11.893010|2605992|2300797740|

All three complete outputs match the reference byte-for-byte; status compiled/resource0, final bytes/grants/lanes0, ledger metadata83886080B before disposal.
At second semantic-dispose entry:3016647 entities/3564764 components,2292858741 charged bytes/1498191 live grants/0 lanes.
Joined physical categories: child heap indexes87758744B; descriptor/name pages953297603B; all payload pages680212214B; component indexes63248608B; table indexes85096584B; instance indexes0.
Foundation is part of payload pages:452835 live rows/515360 slots/128669 pages/235866539B; four-row pages128650/235558150B, forty-row pages19/308389B. No double addition to ledger.
These are combined-current acceptance totals, not child-only gains: retained PRE-child executable is the frontend profile with older B1 policy, not a matched reconstruction probe. No before/after n2 attribution is possible.
Census wall is separately15% higher in this single control; no scaling or instrumentation-overhead precision claim. LLVM/libc/allocator retention is outside the world ledger; native storage is not Wasm storage.

PASS both complete existing serial fault modes: component physical allocation boundaries6/6/2/2; lease1/publication7. Exact Memory, every denied boundary, unchanged semantic/payload/index state, retry/finalizers and physical-owner conservation remain asserted.
PASS existing inline-fault selector. Process wall/CPU/RSSKiB: component .001229/.000134/1724; stage .000825/0/1616; inline .000732/0/1380. Zero CPU reflects timer granularity; all drain checks pass.
PASS existing manual child-transfer small1024/large1048576 rounds and containment small1024/large65536 nodes, four rounds; ordered identity/refcounts and zero-entity store disposal unchanged.
Transfer whole-process wall/CPU/RSSKiB: .000760/.000533/1336 and .011058/.010843/1080; containment .001261/.001098/1592 and .013413/.011836/22760.
Partial-memory metrics remain explicitly partial: transfer store2224B/heap child payload0; containment store2224B/heap child payload32768 or2097152B. Descriptor pages are not included in these manual metrics.
Standalone profile link first failed missing `tower_print`; retained log, fixed only the link to existing production `guest-host-library.o` (SHA256 in raw manifest). Unchanged Tower fixtures each compiled once; no conservation/expected-result edits.
Existing single-owner fault allocation transport only; no concurrent fault injection, sanitizer or new instrumentation. Manual profiles use production allocation.
Optimized recheck/Graph/Fast output0 is reused as attributed L1 evidence for this exact request in [pointer repair](backend_pointer_order_6e8001fd.md), not a B2 rerun; A2's separate second-normalization evidence remains source-bound.
Actual new-Wasm adoption, generations and hosted release remain ROOT-owned/pending. Service-blocked local verifier and instrumentation operations were not retried.

Raw Windows root `C:/Sandbox/build/codex_ecs_20261122/B2/entity_large_d962222a`, Linux `/cache/entity_large_d962222a`: source archive, retained prior/current probe, exact inputs/outputs, `build.sh`, `checks.sh` (failed link), `checks_linked.sh`, all build/fault/manual/unoptimized/census logs and SHA256 manifests.
Source archive SHA256 `e137836e124096468e532f98250135567197e6cb561f6d827438b0d2ef7e222c`; timings use existing Tower `process_profile` (whole waited process CPU, maximum process RSS, not simultaneous process-tree sum).
No runtime optimization was proposed or made; earlier frozen child-only measurements and rejected experiments remain intact. Owned jobs drained before publication.
