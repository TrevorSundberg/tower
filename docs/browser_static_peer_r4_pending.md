# R4 static peer — artifact delivery blocked

No r4 artifact acceptance is claimed. The supplied single `wait_release_input.ps1 -Kind browser-candidate -TimeoutSeconds 3600` exited1: required `/home/deck/tower_coord_ecs_20261122/browser_candidate_20261124_r4.json` was not published by its deadline.
The exact exception, exit and completed finite preflight are retained in [`build/d2_ecs/browser_candidate_peer_r4/`](../build/d2_ecs/browser_candidate_peer_r4/) (`release_wait.log`, `release_wait.exit`, `preflight.txt`, `preflight_plan.txt`, `preflight_recipe_blobs.tsv`). No retry or deadline increase.
Preflight source `b86452a1e` was published main; its identity is context only, not an invented final runtime/build freeze. Reused the [03e peer contract](browser_static_peer_03e344d2.md), preserving its original archive/source/provenance and owner-held generation-binary limitation.

| Scope | Actual disposition |
|---|---|
| Finite static/resource/provenance comparison plan | Prepared; eight bounded steps, membership/counts to derive from delivered recipe |
| Artifact waiter | One invocation, exit1; original3600s deadline retained |
| R4 archive/source/hash/gzip/owner-record checks | 0 executed,0 passed; all unstarted without delivery |
| Build/browser/native/generation/instrumentation | 0 executed; none substituted from earlier evidence |

Plan requires safe unique relative membership/modes; every static length/hash and exact source blob; current builtin/support/target/notice closure; gzip/raw identity; reachable runtime and actual packager build; raw selected/executed/status/worker/canonical/local-verifier records. Generated binaries count as inspected only if supplied, otherwise explicitly owner-held.
Existing D2 container remains idle at affinity2–5/two-CPU quota/3GiB/swap0. Final disk123GiB free; no owned build/test/waiter remains. All03e/611/capture/raw-owner artifacts and todo preserved.
No validation runtime/CPU/peakRSS measurement exists because artifact checks never started; source-only preparation has no compiler performance claim. The wait's configured bound and original error are recorded, not relabeled as a test timeout/pass.
External prerequisite: ROOT/B2 must deliver the final published source/tree descriptor, complete tested static/source archives and owner provenance/evidence. No candidate bytes were repaired, normalized or published. ROOT retains pin/deployment and A1 hosted acceptance ownership.
