# Cold grammar validation queue — rejected, A2, 2026-11-24

No production optimization remains. Frozen source **bf9429d900c6679724cb3c2c4c8960bcf306e83b**, tree `9fa65da4d4d4ad697b4a97e56bb894021076d106`; build checkout `4fa023c7` differs only in documentation. Public default **745afa2f**, no private override. The accepted r5 package, sources and earlier failures remain untouched.

Current small-input observation found 172 version builds/136.36ms, including 78 table builds/86.33ms. Separate validation observation measured 16.29ms, including 8.28ms of nullable/productive fixed-point scans. These are inclusive spans, not additive costs. The candidate reused validation's existing reverse dependencies and private queue as a bounded ring, with one outstanding entry per rule. No grammar authority, shared cache, worker mutation or diagnostic-order change was introduced. The final source-ordered diagnostic pass was unchanged; reserve denial retained Memory and existing cleanup.

Corrected temporary observation: rule visits **44,736→20,978**, term visits **227,442→117,886**, property span **8.28→5.45ms**, containing validation **16.29→14.26ms**. Baseline rule visits include pending-rule skips. This local reduction did not establish an ordinary latency win. The earlier candidate probe counted dependency terms too; its 174,281 count is excluded. All observed binaries/patches remain separate from ordinary 34-phase builds.

Eight focused selections passed, zero failed/skipped/unstarted: native validation, structure reuse, reachable emission400, LR-worker equivalence, module-cache regressions, grammar-resource, grammar-equivalence and lexicon. Validation includes the independent 600-graph oracle, exact pending identity/diagnostics/offsets, 1500 captures, serial allocation-failure sweeps, and two added chain/cycle/duplicate-edge/nullability regressions. Structure/resource checks retain old pins, overrides, keyword boundaries, cancellation/retry and zero final bytes/grants/lanes; serial fault transport is not threading proof. The rejected tests/registration are preserved in the patch and restored too.

Ordinary n2 counterbalanced means below; percent is candidate versus baseline. CPU is process CPU; frontend wall is the existing frontend interval, CLI wall is whole process. Full sample/process RSS/charged/retained data are in the CSVs.

| Shape / workers | Before→candidate wall ms | Wall change | CPU change |
|---|---:|---:|---:|
| CLI16 / 1 | 316.11→317.58 | +0.47% | -0.12% |
| CLI16 / 4 | 359.29→348.41 | -3.03% | -2.78% |
| CLI1000 / 1 | 420.35→416.82 | -0.84% | -0.39% |
| CLI1000 / 4 | 469.31→467.74 | -0.33% | -0.47% |
| Frontend1×16 / 1 | 282.09→277.50 | -1.63% | -1.65% |
| Frontend1×16 / 4 | 352.56→351.65 | -0.26% | -1.86% |
| Frontend1×4096 / 1 | 1590.68→1548.65 | -2.64% | -2.62% |
| Frontend1×4096 / 8 | 1350.09→1383.88 | +2.50% | +4.29% |
| Frontend12×256 / 1 | 3552.48→3559.21 | +0.19% | -0.33% |
| Frontend12×256 / 8 | 1737.27→1776.33 | +2.25% | +5.50% |

Reject: small serial CLI regressed in both pairs; both eight-worker shapes regressed in both corrected pairs. Small/single serial frontend pairs change sign (single serial +2.46/-7.30%); their means are not repeatable gains. Fewer property visits do not justify queue admission/notification overhead or these mixed end-to-end results. No favorable extra pair or cap change was used.

One measurement-configuration fault was corrected: enabling existing module-cache tests selected `parser_modules_work`, adding test exports to the first candidate profiler. Those **24 frontend samples/four overlap observations are excluded**, preserved under `plain_modules`, `ordinary_observed_modules` and `modules_*.csv`. CLI was built before that option and remains valid. Corrected `parser_work` commands match the baseline byte-for-byte (`profile_commands.diff` empty); only the affected frontend cohort/observations were rerun. Original unknown-target/module-option and temporary import-order setup failures remain logged, not passed checks.

Valid evidence: **24 frontend +16 CLI timing samples**, four separate ordinary overlap observations, four same-host Clang reference controls, 16 Graph/Fast ABI42 configurations (32/64, workers1/4, both arms), two native imported ABI42 executions, and exact complete CLI object/native15/999 references. Every source/import/canonical artifact matches before/current/across widths and the original reference. Observer-off timing denominators exclude overlap observations. Observed single-unit kernels use eight distinct threads/overlap8; multi outer overlap8, inner peaks7/6 before/candidate. Joined lanes are zero. Retained single/multi bytes are 415843086/446458376 before, +1B candidate; grants275179/319919 and ledger20971520/41943040B unchanged. These snapshots precede close; final ownership assertions come from the focused controls, not an invented post-close profile census.

Ryzen AI MAX+395, WSL2/Linux x64, affinity0–11/quota12, 24GiB/swap0, Clang19.1.1, outer2/compiler1 builds; fresh compiler/worlds, warm filesystem, shared host, no frequency isolation. Corrected frontend family50.26wall/69.32CPU s, peak983064KiB; CLI/reference8.88/6.04s, peak164348KiB; separate observers9.79/23.06s. Five CTests1.80wall/2.30CPU s, peak542624KiB; three additional selections0.50wall/0.42CPU s. Build/restoration costs and container-family peak1695600640B/OOM0 are retained separately; these are not full32-core or speedup claims.

Baseline/candidate CLI **ea78d246/282fdf4c**, both2312440B; matched profilers **5823c144/eef0215c**, both2361296B. All55 resource files are recorded:46 byte-identical, nine differ only in their original first-line LLVM ModuleID paths; no bytes normalized. Source archive SHA `c44a6f8156dd1dba5a0e397a1bb909032cda6bc82640a04a75103c212769f114`; rejected complete patch SHA `3f423be4620d2af1001695354fd0a690ab6471b83cfff85b26c395682ec37c8f`.

Restoration refreshes timestamps and rebuilds the affected closure: all six touched source/test/build/probe files equal baseline, CLI **ea78d246** and profiler **5823c144** reproduce exactly, ordinary34-phase control/full artifacts match, final status0. Final profile rebuild19.76wall/13.69CPU s; earlier complete CLI/profile restoration22.52/25.11wall s. No workload remains; stopped idle keeper exit137/PID0/OOMfalse is separate from successful build/test exits. Todo and four prior stashes are preserved. No pin, package, deployment or cross-owner code changed.

Raw immutable receipt: `C:/Sandbox/build/codex_ecs_20261122/A2/cache/cold_grammar_bf9429d9` (`/cache/cold_grammar_bf9429d9`): **RESULT.json**, `input_gate.json`, `source_before.tar`, `final_candidate.patch`, `candidate_files.tar`, `before/current` binaries/resources, `checks/`, `coarse/`, `plain/`, `cli/`, `abi/`, `ordinary_observed/`, `samples.csv`, `pairs.csv`, `cli_samples.csv`, `cli_pairs.csv`, `summary.csv`, `observers.csv`, `resource_identity.csv`, `restoration.csv`, `restored/`, commands, exits and costs. No performance claim is made for this documentation-only publication; later joined-source acceptance remains ROOT's responsibility.

Publication reconciliation includes B1's subsequent **f17fee95** LR-worker repair (`lr_work.tower` and its fixture); it is outside this frozen experiment and binary-restoration claim. All six restored input blobs still equal bf9429d9. This receipt introduces no runtime delta or new acceptance claim for that owner's change.
