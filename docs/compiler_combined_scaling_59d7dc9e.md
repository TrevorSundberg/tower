# Combined native scaling — A1, frozen59d7dc9e

Current59d7dc9e995b16c785b01f40f340374dc4c73d18/tree39daf612b240a06b7bff06b08a2585c138c830d5 includes Foundation page policy, inline component/child storage, sparse kind layouts and joined backend repairs. No implementation changed; future SCC work is excluded.
Baseline3011c77febe8b2c628ce0396a1446b66a99d59d5 already has Foundation policy/inline components, but lacks inline children/sparse layouts and later importer fixes. One exact git source archive359875bf9d40ffd335d4127499de4bde2039367b3ace2429c7a8d9095306413e was built here using the same public768 bootstrap and existing CMake backend/profile entry. Differences are COMBINED changes, never a sum of isolated savings.
KinmenA/WSL2 Linux6.18.54.1, LLVM/Clang19.1.1 Release x64, CPU12-23 (six physical cores/twelve SMT lanes),24GiB; shared host, one active cache/build, compilerjobs1/buildjobs6. Fresh processes/warm filesystem, no frequency/whole-host isolation. Disk337634582528→337144217600B; jobs drained.
Profile SHA256 before47f0db8105abd1b01ec4af303d95cf5da113c9c526f6e687b6081ac0a7ecaf81/current37a9175831be4403568d968c7cb93a66d58d0bc1619e184310bf777f3336bd7f; current CLI7ffe23d96a702ab9dd6ec8fa70af204be86200baa215680185581fb86ef9f344. All binary/input hashes unchanged after runs.
Existing frontend_units_profile: RESOURCE_ROOT UNITS WORKERS BODIES dependencies uniform artifacts DIRECTORY, width8/backend0/optimized0. Shapes small=1x16, single=1x4096, multi=12x256. n2 pairs: round1 shapes/widths ascending, before/current; round2 both reversed, current/before.48 retained timed processes, no warmups/discards;12 separate current grammar-observer controls. Timed frontend excludes reference execution/format/write/teardown; whole-process GNU-time records are separate.
All60 frontend processes exit0, full source/import/canonical files compare byte-for-byte per shape across versions/workers/rounds, and Tower's independent answer/body oracles return42/42. Joined lanes0 and production destructor checks require drained worlds/zero live grants before budget disposal. Full artifact sets and original failures remain available.
| Shape/workers | Frontend wall s before→current | CPU s before→current | Current compile peak RSS MiB | Current charged live/peak MiB |
|---|---:|---:|---:|---:|
|small /1|0.432→0.429|0.355→0.354|157.6|16.1/90.7|
|small /4|0.508→0.503|0.468→0.460|160.2|16.1/90.7|
|small /8|0.504→0.501|0.465→0.461|160.7|16.1/90.7|
|small /12|0.517→0.518|0.480→0.479|160.9|16.1/90.7|
|single /1|2.112→2.120|2.031→2.043|664.2|452.0/528.1|
|single /4|2.064→2.040|2.759→2.718|669.3|452.0/528.0|
|single /8|2.042→1.979|3.261→3.204|667.4|452.0/528.0|
|single /12|2.107→2.012|3.942→3.732|668.0|452.0/528.0|
|multi /1|6.147→6.030|5.293→5.181|677.3|505.6/573.5|
|multi /4|2.755→2.550|8.977→8.475|924.2|505.5/744.5|
|multi /8|2.657→2.160|13.716→11.482|1269.3|505.5/834.3|
|multi /12|2.565→2.161|22.058→19.012|1579.9|505.5/1233.7|
Times/RSS/live are n2 midpoints; charged peak is maximum of the two, not summed across jobs. Raw per-process user/system/wall/peakRSS and variability are retained. Multi8 improves18.7% versus baseline and reaches2.79x current serial; multi12 ties its wall within noise but costs65.6% more CPU and24.5% more RSS than8. Four workers give2.37x with lower memory. This is bounded useful scaling, not full saturation.
Small serial is essentially unchanged; parallel small is17–21% slower. Single4096 peaks at only1.072x at8, with57% more CPU than serial; its serial wall regresses0.4% versus baseline. No universal performance win is claimed.
Combined single4096 serial live bytes507699000→474003822, peak590004506→553734297, live grants489669→285548 and ledger storage40→20MiB. Multi8 peak959904605→874801547B; multi12 1379689361→1293576814B. Ledger metadata is separately20/40/40/80MiB for current multi1/4/8/12; these are physical grant counts, not malloc-call totals.
Observed actual outer peak/distinct threads for multi are1/1,4/4,8/8,12/12; single semantic dispatch peak/distinct threads1/1,4/4,8/8,12/12. Multi's per-world semantic peaks1/2/5/1 occur at different times; never add them to outer peaks. All shared-lane ceilings pass.
Separate single8 observation:1.955s wall, semantic dispatch0.237s (12.1%),5.3% of dispatch intervals outside any active kernel,87.9% admitted lane-time covered by kernel intervals. Parse0.630s, SemanticRun0.564s, lowering0.346s are inclusive/nested and not added. Dispatch observer overhead9.94ms is measured, not mixed into timed medians.
Multi ready-outer-vacancy bound is below0.01% of outer capacity-time in observed runs; nested work may consume those lanes, so this is not CPU idle. Single's zero ready-outer-vacancy only means its sole input already started. Serial/coordinator work and contention remain; queue width/peak counts do not establish utilization.
CLI controls reuse ROOT_reference_inputs and original compiler_reference_inputs Tower generator contracts:16/1000 functions, exact15/999. Current Tower --jobs1/4 --target x86_64-unknown-linux-gnu --emit object --timings, default optimization; Clang19 same target -std=c11 -m64 -O2 -fwrapv -c. n2 counterbalanced, fresh process/warmFS, full frontend+backend object emission; link/execute outside compile timings.
| CLI functions | Tower1 wall/CPU/RSSKiB | Tower4 wall/CPU/RSSKiB | Clang wall/CPU/RSSKiB |
|---|---:|---:|---:|
|16|0.465/0.375/174922|0.530/0.455/177152|0.030/0.015/98962|
|1000|0.610/0.510/200568|0.660/0.605/205904|0.080/0.070/110292|
All12 native executions pass; all8 Tower objects equal independent preserved cdc5a6ec/ae9e824d objects, not merely each other. Runtime47fad85ac3a9dab72a5c1aac492a5c7424d21b6e732d6c484ef43c0dd8462ca8 is the original ROOT_reference_f72179d2 entry runtime. This comparable constant-function workload shows a substantial CLI gap; it does not establish general language parity or model the dependency frontend workload.
Preserved setup failures: one DNS pull failure recovered normally; fresh baseline configuration needed the existing explicit public-bootstrap/backend include settings. First CLI object compiled successfully but library-only runtime linking lacked main; original entry runtime fixed that boundary, the same first object/timing was retained and checked. No compiler failure, timeout, skip or failed link is called a pass.
Frozen resource manifest SHA256a1982a32d35a5a21423bea1126f592e15a30e7ca47408eeb85a85f9dc4c0a8db; generated source/canonical manifests and six unchanged CLI input hashes are in input_identities.sha256/cli/inputs.sha256. Actual raw commands,48 timing logs,12 observer logs,12 CLI compile/execution logs, binaries/source archive and CSV summaries: C:/Sandbox/build/codex_ecs_20261122/A1/cache/scaling_59d7dc9e (matrix.sh,observe_cli.sh,cli_reference.sh,verify.sh,runs.txt,observed.txt,exact_outputs.log).
No implementation, reactor, generation, sanitizer or release change; ROOT retains independent layout review/current-artifact adoption. Full profitable-core scaling and the CLI serial gap remain open. Later incoming source is excluded from this frozen evidence; todo untouched.
Integration: ad7197d8 preserves the frozen evidence through the complete291af0a4 join. Incoming documentation/release receipts and backend fixture/registration changes are excluded; measured production providers/profile/generator remain byte-identical to59d. No build or matrix was repeated for this documentation-only publication.
