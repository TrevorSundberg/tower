# T9 stage/work: complete joined-reactor acceptance

Reactor source `d962222af10bb062a1ad18c7beb8531ed00dc7ee`, ROOT's immutable public768/no-override pair; no rebuild.
Portable1665861B SHA256 `951500a80f7d43d9a44f2beeeb5a959c57abae266e04cb2ea01e4f9b62bebdab`;
LLVM35420626B SHA256 `226e0c7740e5649b9576fbfbbb7b84980b2638f54888bb3b63b927929821ce7e`.
Both hashes verified before/after private installation in `build/l2_t9_d962222a`; old a06 artifacts/failure logs remain unchanged.
Mounted host/resources freeze `c048eaf8c2397468714049d0a2287357fc393e4b`, tree `268d2f360072fdcb1306478df04165fb14a0583c`.
Host manifest SHA256 `d6751eab2ca11742c3727fe936f6ea65ea638051a31e746ea2167c5e81e4b723`;1211-resource manifest `9a62b938731d8821e5630baccb146b48e53a411ce1ee1afbf71fd676c1c2ab43`. All hashes rechecked after drain. Later signed-pointer test resources differ from reactor source; selected fixtures/host and their imported production resources are unchanged from d962.

Exact unchanged selections in `playground/tests/semantic-port.test.mjs`, sequential fresh Node22.23.5 processes:
`^Tower entity_stage_ownership agrees across graph, fast, LLVM and Foundation text$` **PASS**;
`^Tower compiler_work agrees across graph, fast, LLVM and Foundation text$` **PASS**.
Existing actual-process measurement transport, CPU4-7 (affinity240 verified), `--test --experimental-test-isolation=none --test-concurrency=1 --test-timeout=600000`; unchanged600s OS guard, fixture fuel/caps, TOWER_TEST_PHASES=1 and fresh artifacts per case. No reduction or skipped mode.
Each actual exit0: tests1/pass1/fail0/cancelled0/skipped0, deadlineHit=false,42 phase records ending complete/released. Unrelated filtered selections are excluded, not passes. No failure or unstarted assigned case.
Each includes both32/64 Graph/Fast original execution, canonical reparse/execution with four exact reformat equalities, four unoptimized/optimized LLVM Foundation reconstructions/internal rechecks plus portable reparse/Fast execution, and source/canonical32 executable Wasm runs. All14 execution outputs per case equal `0\n`; total28 outputs/8 reconstructions/4 executable runs pass. No phase defined by these selectors was omitted; no additional package-only suite is claimed.
Guest stage holds/pinned publication/discard/finalizers/store disposal and compiler_work stale revision/profile, failure/cancel/close controls remain in the original Tower fixtures. Host execution handles retire in finally; successful complete/released records and process exits verify this scope. No compiler-wide zero-allocation census or race-freedom claim is invented.

| Actual Node test process | PID | Wall s | CPU s | Observed peak RSS bytes | Maximum logged portable / LLVM capacity bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
|entity_stage_ownership|18304|268.959643|437.265625|3321520128|1579941888 /1580204032|
|compiler_work|29320|232.700830|379.734375|2930401280|1384382464 /1380384768|

Node runs the test directly, so metrics cover actual test/JIT/host/reactor threads, not a wrapper parent or compiler-only cost. Phase maxRSS3243672/2861720KiB agrees with observed OS peaks. Samples are n1 adoption cost, not a speedup comparison or useful compiler-core proof.
Reported memory.buffer.byteLength is allocated linear capacity, not live payload, and remains allocated after handles retire. Each reactor remains below its unchanged2GiB ceiling in these complete successful cases; combined process RSS is larger. This does not establish other inputs' guest fit or a whole-process memory cap.

| Case/width | Canonical bytes / SHA256 prefix | Unoptimized rebuilt bytes / prefix | Optimized rebuilt bytes / prefix |
| --- | --- | --- | --- |
|stage32|958234 /4ed4c4f4|4633485 /2e7f5379|1320635 /2b342f59|
|stage64|958950 /72013c82|4646965 /f15eadcb|1303255 /12ba7951|
|work32|871469 /2908ceba|3968328 /b349ab58|1112663 /93ba78e2|
|work64|871899 /538c2118|3978242 /3f5374ba|1110933 /a92f19e6|

Source fixtures4285B/SHA77966b82 and3896B/SHAad486c72 unchanged. Emitted stage source/canonical Wasm49755B each, SHA16f34755/3add420a; work41195B each, SHAf6d4b6b0/5c0f4d2b. These executable bytes differ while exact outputs agree; byte equality is asserted for canonical reformatting, not these two distinct executable inputs.
Current canonical bytes include B2's mounted Entity inline-child changes; they are not relabeled as old a06 request bytes. The [a06 optimized-pointer failure](t9_stage_work_a06ec4b1.md) and7e54 native receipt remain separate. Joined pointer/i1/constant-address repairs are exercised through the original full selectors without production/test edits.
Raw [receipt directory](C:/Sandbox/build/codex_ecs_20261122/L2/semantic_port_d962222a_c048eaf8) contains source/host/resource manifests, original ROOT pair manifest, every full canonical/rebuilt/LLVM-before-after/executable file, full hashes in `*_files.sha256`, phase JSON/stdout, actual process launch/results/affinity and unchanged measurement transport reference in run_case.ps1.
No backend attribution/retry was needed. No access/observe/platform/native matrix, reactor build, sanitizer/rejected operation or deployment was run. Owned jobs drained, todo unchanged; ROOT retains shared-reactor, remaining integrated generation/hosted release gates. Publication boundary follows in the journal.
