# Joined native performance and size — frozen 73cc82ab

- Freeze `73cc82abb54ec6765619e31aea4fca6e41f29ed8`, tree `5758dac08e1805e9256c05b358e927d0c9ee04bb`: accepted import snapshot, eight-bucket pool and typed constructor cleanup. No production edit or tuning; later source is outside this evidence.
- Supplied ordinary c855 profiler verified: 2,351,792B/SHA256 `898a4ec59e668952ca4ecaedeeea176fcff17872bd0fd4016269a17e3d7d23f3`. Baseline CLI is accepted complete 0a87 package `0f9220edff0c2ec90eefab0d5814cdbc2adaa8b2bb6fdd896231fcb04e878bd0`; Git proves its compiler/resource/build closure identical to c855. Both original arms retained, not reconstructed from an observation binary.
- Current ordinary profiler SHA256 `03cc2489e2e21c26e64e0bac5e9234c5a3e7080f2f4f56f668a1ad83d9141087`, CLI `dd944af028ef81296feaad9b2418b9cca0da53c0b7d37a06ba930d3c80e0d67f`. Public31a default explicitly verified, no private override/sanitizer. One plain cache: 53 production CLI actions then 7 profiler-specific dependency actions; CLI preserved before test wrappers were enabled. No identical leaf/vendor rebuild. Build 105.05wall/150.37CPU seconds, max884452KiB process RSS; cgroup peak1841213440B.
- Same Orchestral-Revng WSL2 host, Ryzen9 5900HX,8 physical/16 logical, LLVM19.1.1 Release x64; actual affinity0–3,8–15 is six physical/twelve SMT CPUs. MemoryMax8GiB, swap0, unlimited virtual address space; shared host, warm files, fresh processes/worlds, no frequency isolation. No comparison to old KinmenA timing.
- Exact existing generator/profile unchanged: small1×16, single1×4096, multi12×256, dependencies+uniform, width64/backend0. Separate LF Git c855/current resource snapshots use equal-length paths; all five transitive language inputs are byte-identical. Forty n2 counterbalanced runs (small1/4; single/multi1/4/8/12), ten separate existing `grammar` observers: all50 complete, no skips/unstarted. Full generated sources/imports/canonical files compare byte-for-byte across every arm/width/run; ordinary interpreter42/42 checks pass.

| Shape/jobs | Frontend wall s before→current | CPU s before→current | Peak RSS MiB before→current | Charged peak MiB before→current |
|---|---:|---:|---:|---:|
| small/1 | .4163→.3928 | .416→.392 | 156.2→154.7 | 89.4→87.8 |
| small/4 | .4789→.4521 | .515→.489 | 161.1→159.2 | 89.4→87.8 |
| single/1 | 2.4134→2.0396 | 2.415→2.036 | 651.7→649.8 | 515.0→513.4 |
| single/4 | 2.1482→1.7066 | 2.924→2.463 | 658.0→656.2 | 514.9→513.4 |
| single/8 | 2.1203→1.6331 | 3.340→2.814 | 656.6→656.3 | 514.9→513.4 |
| single/12 | 2.1581→1.6605 | 3.949→3.520 | 656.8→655.0 | 514.9→513.4 |
| multi/1 | 5.9805→5.6458 | 5.969→5.637 | 664.7→640.7 | 558.9→538.2 |
| multi/4 | 2.5761→2.4148 | 9.508→8.946 | 909.3→886.3 | 743.6→721.1 |
| multi/8 | 2.4260→2.2985 | 13.598→13.230 | 1251.4→1227.1 | 852.5→821.5 |
| multi/12 | 2.5730→2.3471 | 24.027→21.914 | 1557.9→1537.1 | 1269.8→1229.7 |

- Wall/CPU are n2 means; memory is maximum, never summed. Current serial gains small5.64%, single15.49%, multi5.60%; single8 gains22.98% and multi8 gains5.26% versus their matched baselines. No paired end-to-end regression observed; n2/shared-host evidence is not statistical certainty or additive attribution to individual changes.
- Best current means are serial small, eight single/multi:1.249×/2.456× serial respectively. Small4 costs15.09% wall versus serial. Multi12 costs2.12% wall,65.63% CPU and25.27% RSS over8; full width is not automatically profitable. No scheduling policy changed.
- Retained single serial460728183→458914349B/285504→283676 grants; multi serial515835924→494068684B/349991→328055 grants. Small serial16406760→14468741B/13163→11336 grants. Parallel exact values in CSV; ledger storage unchanged: small5MiB, single20MiB, multi20/40/40/80MiB. These are live pre-disposal reservations, not leaks. All snapshots joined lanes0; existing close drains workers, clears/disposes every world and requires zero live grants before budget disposal. Exit0 validates those finalizers; no invented post-close RSS-zero claim.
- Observer evidence: actual single semantic peak/distinct threads1/8/12, multi outer peak/distinct threads1/8/12; reserved lanes never exceed the shared limit. Multi1/8/12 refills11/4/0; ready-outer vacancy <0.01% capacity-time, not OS CPU idle. Per-world nested peaks are not added to outer peaks.
- Single8 observer wall1.6395s: parse631.7ms, SemanticRun514.2ms, lowering195.8ms; inclusive/nested phases are not summed. Dispatch231.5ms,8 actual threads,95.94% time with a kernel and90.61% admitted lane-time kernel-covered; observer13.97ms. Serial preparation limits scaling. Small1/4 build361.9/390.5ms dominates its few milliseconds of semantic work. Baseline/current serial phase records retained; these explain limits without speculative tuning.

| CLI functions/jobs | Tower before→current wall/CPU s; current max RSS KiB | Clang19 wall/CPU s; max RSS KiB |
|---|---|---|
|16/1|.435/.425→.410/.405;171912|.020/.020;99668|
|16/4|.480/.500→.445/.465;175668|same n2 C control|
|1000/1|.645/.625→.600/.595;191400|.105/.100;110156|
|1000/4|.675/.700→.640/.670;197192|same n2 C control|

- Exact retained16/1000 Tower/C inputs and independent15/999 reference bytes, n2 counterbalanced:20 compiles/native executions complete; all16 Tower objects match original reference objects. Tower default optimization/`--timings --emit object --target x86_64-unknown-linux-gnu`; Clang `-std=c11 -m64 -O2 -fwrapv -c`. Link/run excluded from compilation costs. First Clang link genuinely failed: OS recipe included Tower runtime with a second `main`; original log retained, C-only link corrected, compiled object and four passed Tower cases reused. No language/test assertion changed; no failed-before speed claim.
- Whole40-process matrix including reference execution/format/write/teardown:98.09wall/266.22CPU seconds, max1595296KiB process RSS; cgroup1695170560B, zero OOM/max events/swap. Observer cgroup1626755072B, corrected CLI cgroup346419200B. Frontend timings above exclude post-compile work; service-manager summary peaks are not substituted for sampled cgroup `memory.peak`.
- Native executable2299088→2299216B (+128); profiler2351792→2351712B. Complete required resources46 Tower+9 runtime files:8973963→8974935B; ELF+55 resources11273051→11274151B (+1100). Raw resource manifests retain source and runtime ModuleID/path differences; no normalization/package/relocation claim. Linked LLVM128938904B separate. Temporary build37834913B, full timed artifacts157549737B, observers37067864B; no Wasm-capacity or compressed-release comparison.
- Evidence `C:/Sandbox/build/codex_ecs_20261122/L1/combined_performance_73cc82ab/`: scripts, all exit/diagnostic/time records, source/binary/resource/input hashes, `summary.csv`, `samples.csv`, `whole_process.csv`, `phases.csv`, `observers.csv`, `cli_summary.csv`; full artifacts/arms in `/root/.cache/tower/l1_combined_73cc82ab/`. Sources and both arms reverified after drain;88GiB Windows/921GiB WSL free. No production fix, correctness/sanitizer/generation/browser rerun or public adoption. ROOT owns final release; later merged inputs remain outside this frozen runtime evidence.
