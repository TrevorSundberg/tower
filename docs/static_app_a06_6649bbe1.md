# a06 static application: packaging and four browser checks

PASS packaging and **4/4** unchanged desktop/mobile compiler-thread checks;
local deployment verification is **UNSTARTED/BLOCKED**, not passed.
Compiled reactors/project: `a06ec4b1f9f44419882477bc1a55b6ed39e2200b`, public768.
UI/resources/packager: `6649bbe10ac7ccadc453952f4585846078cc54a0`;
packager matches published `6b74889b0ca29f1261af0dd55f5c9b27f6ce6ccc`.
All 32 ROOT inputs verified by length/SHA before installation and again after drain;
raw snapshot totals 168,232,639 bytes. Prior inputs/dist remain preserved.
Only `build-bootstrap.sh --tools package_playground_assets` was built, with the
checked-in public bootstrap and owned tools cache; no compiler/reactor rebuild.
Tool SHA `4c3fe08016bfe610b588c94584a6bde7067f5dbc689cc7e690098547614c8a30`.
Existing Windows Node22.23.4/esbuild + WSL packager; both REQUIRE flags enabled.
101 asset hashes pass; 102 files including manifest total **110,779,134 bytes**.
All three capabilities true; complete recipe, ten referenced support archives,
one compiler imports file, seven target files, licenses and CNAME checked.
Neither raw LLVM nor cross reactor remains in dist. Gzip decodes exactly to inputs:
LLVM 13,671,333 compressed /35,420,122 raw bytes; cross 18,858,487 /56,576,025.
The 35,420,122-byte LLVM duplicate is removed; raw build snapshots are retained.
Manifest assembly metadata distinguishes a06 compiled/project from 6649 UI/resources
and packager; the Tower-generated asset/hash map is unchanged. All refs reachable.
Manifest SHA `94aa8f5b688793618401ae5b096f0abe72367fc4fc232107998a45259f3fd31b`.
Existing `compiler-threads.spec.mjs`: desktop/mobile isolation, threaded `42` execution,
reload and blocked-service-worker portable fallback; 4 pass/0 fail/0 skip, exit0.
Original assertions/deadlines, one worker/no retries; no other browser suite rerun.
Linux Node22.23.5/Chromium159.0.8154.6, CPU12-23/quota12/24GiB, one browser family.
Wall/CPU/peak RSS KiB: tool build 7.240674/6.176799/229416;
Tower packager 11.809375/5.256164/111880; static suite 28.188321/15.955930/375748.
Whole assembly wall12.223950s; sampled Windows Node-only CPU0.218750s/peak
128,438,272 bytes excludes esbuild/WSL. RSS is process high-water, not tree sum.
These are acceptance costs, not scaling or allocation-retention measurements.
An initial profiler launch used nonabsolute `bash` and failed before tool build;
its log is retained; the absolute executable correction passed.
Automatic review rejected the combined verifier-output preparation/launch command:
**"blocked by policy"**. No verifier ran; no retry, reconstruction or alternate host.
Evidence root: `C:/Sandbox/build/codex_ecs_20261122/B2/static_a06_6649bbe1`;
exact transferable dist: `tested_dist/`; working copy: `playground/dist/`.
Raw logs: `packager_build*.log`, `package.log`, `package_metrics.json`,
`static_app.{log,json,status}`, `asset_verification.json`, manifests/source archive.
Publication adopts no newer runtime; later sources are excluded once. No code edit;
runtime before/after profiling inapplicable. Local verifier/hosted release remain ROOT gates.
