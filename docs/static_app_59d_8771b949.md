# B2: 59d static package and four compiler-thread UI checks

PASS packaging and4/4 unchanged desktop/mobile checks; local deployment verifier remains UNSTARTED/service-blocked, not passed.
Runtime/project source `59d7dc9e995b16c785b01f40f340374dc4c73d18`, ROOT public768/no override; UI/resources/packager frozen separately at `8771b9490186d501cf11110f0eea519d733811b1`.
All32 supplied files match files.json lengths/SHA before installation and after checks:165218603B raw build snapshot. Prior d962/a06 inputs and dist preserved; no reactor rebuild.
Portable1666307B SHA256 `01bf3381b75626eee78b03e9652d8ee62c400614997d29863267ef7cc01c05b1`.
Shared1750782B SHA256 `86d64e48581048e4487342d1b22e197eaebcfaf90a8823318287aae64ece56ec`; work52525B `c0747310ee756c4e76cc37b49594513d1e516752a0e082c4aff9b2d0d5f8108a` retained as input, not exercised by a repeated shared suite.
LLVM raw SHA256 `95fc948adc9b5b9a36d90d6e9ccd22aeb9be40dc8ca8dd78410c58bfe505690c`; cross raw `207e0f214dfa619e97a48d8bd5b49e6d3bf3c2a66729254b75dc4386b1681061`.
Only existing `build-bootstrap.sh --tools package_playground_assets` refreshed through public768/owned tools cache; lazy-DEFLATE source1c919df5 is included. Tool SHA256 `3a19190f13b20012cba6c7afcc039ce3d95eccad59c419a2e878e775920fab1b`.
Existing Windows Node22.23.4/esbuild + WSL Tower tool; TOWER_REQUIRE_THREADS=1 and TOWER_REQUIRE_BACKENDS=1. No dependencies installed or production/test code edited.

| Reactor payload | Gzip transfer bytes | Decoded raw bytes | Gzip SHA256 |
| --- | ---: | ---: | --- |
| LLVM |12787386|35421073|`f50b2a33601c336041f571af98afa49e2fef95510d32d4c3f5cba81004a63736`|
| Cross |17682799|56576976|`9cc3514d131377ae8dbca5997df3f20e63b29b32fcd835be57de110aeec62ab8`|

Both gzip streams independently decode to the exact raw input hashes; neither raw LLVM nor cross duplicate remains in dist. Raw input snapshots remain intact.
Final installed dist:101 assets plus manifest,102 files,105716512B. This installed total differs from raw32-input bytes and the two compressed reactor transfers above; no combined size delta is attributed solely to compression.
Every asset hash and exact manifest membership passes. All three capabilities true; project recipe plus its ten referenced support archives/one imports file, seven target files,20 source license texts, CNAME tower-lang.org and .nojekyll verified.
Manifest SHA256 `7f6ea88decec364a6794415a8aa1bf1f63753b429f82adad85d9f3c83012200d` includes separate runtime/project and UI/resource/packager provenance, reachable published commits and input/tool hashes; Tower's original asset map is unchanged.
1401 host/resource files remain unchanged after drain. Input manifest SHA256 `ef7974fcd5792518a8a36ccfd7afea01a77bc75c885a4c86cc95e6cc7661258d`; UI source archive `39a5e92bee1723c9104c7ba20e3d294292eb9778e4f45804b62cf049a903744a`.

Only existing `playground/tests/browser/compiler-threads.spec.mjs`, desktop/mobile, one worker/zero retries/max-failures1:4 passed/0 failed/skipped/flaky, exit0.
Real service-worker isolation, shared-reactor request/actual workers, decltype/comptime execution42-newline, isolated reload and blocked-service-worker portable fallback all retain original assertions and120/90/60s test/loading/execution deadlines;540s aggregate guard did not fire.
Production page-owned transport unchanged. These four cases do not independently repeat strict zero-CDP-target retirement, complete Node/shared suites, exports/completion or full UI acceptance; earlier d962 results are not relabeled as59d acceptance.
Linux Node22.23.5/Playwright1.65.1/Chromium159.0.8154.6, CPU12-23/quota12/24GiB; one browser family, jobs drained before/after. Windows Node affinity12-23/GOMAXPROCS4; WSL tool taskset12-23/24GiB virtual-memory bound.
Wall/CPU/peak RSS KiB: packager tool refresh2.470822/1.912252/230364; Tower packaging13.033438/6.672388/108496; static suite27.837596/15.700218/407452 (Playwright24.947480s).
Whole assembly wall15.529977s; sampled Windows Node-only CPU.265625s/peak128405504B excludes esbuild/WSL. Tower wrapper includes waited child CPU; RSS is process high-water, not concurrent tree sum. Acceptance costs, not a speedup or retained-allocation claim.
Initial OS setup wrapped ConvertFrom-Json in an extra array, failing its count before mutation; direct collection handling corrected it. Original failure retained; no packaging/UI assertion failed or changed.

Automatic review previously rejected local deployment-verifier preparation/launch with **"blocked by policy"**. It remains UNSTARTED: no retry, reconstruction, rephrasing, alternate host or verifier-output preparation in this task.
ROOT owns hosted publication/public pin and later-source integrated release. No Node/shared/instrumentation/generation/static full matrix rerun, and no hosted deployment.
Evidence `C:/Sandbox/build/codex_ecs_20261122/B2/static_59d_8771b949`: immutable transferable `tested_dist/`, `prior_dist/`, `prior_inputs/`, source/input manifests, original/provenance manifests, `asset_verification.json`, `after_checks.json`, package/tool logs/metrics and `static_app.{log,json,status}`.
Working package remains `C:/Sandbox/tower-agent-2/playground/dist`; Docker execution logs `/cache/static_59d_8771b949`. Frozen identities survive publication; later incoming histories are excluded without repeating unchanged checks.
