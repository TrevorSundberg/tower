# Revision-owned literal lookup at d38396bb

Both candidates were rejected. Both reduced prefix work and preserved token selection. Each also slowed the serial 1,000-function CLI in all three paired trials.

- Freeze `d38396bbaee55ba2e503c5b646c84173b32ca1df`, tree `a31def427a52fce814e3df1118a6194ea650f697`. The checked-in public `745afa2f` rebuilt the baseline CLI byte-for-byte to `77f23db6`. Both arms used identical build commands, Clang 19.1.1, Release x64 and the same 55 adjacent resource files (8,977,515 bytes). Each CLI was 2,312,440 bytes.
- The first candidate recorded the bounding interval for each of 64 groups of leading bytes after successful insertion. The second searched existing rows ordered by leading byte and used the full scan after unordered or empty-literal insertion. On x64 their lexicon headers grew by 1,032 and 8 bytes respectively. Both preserved row order, exact prefix matching and contextual LR queries, including the shorter-punctuation fallback.
- A serial Tower observer counted work per session and sampled token and literal sections every 16th choice. On the 4,096-body source, 208,981 choices examined 2,507,760 token entries and invoked 1,462,861 DFAs. Baseline literal rows / prefix calls / full-prefix matches were 21,733,793 / 18,762,055 / 135,226. The range version gave 1,155,572 / 1,030,496 / 135,226 and the ordered version 323,721 / 262,243 / 135,226. Ordered counts exclude navigation to the interval.
- Over 13,062 sampled large-unit calls, the baseline token section took 14.094 ms wall / 7.665 ms thread CPU. The literal section took 12.248 / 6.984 ms, then 10.830 / 5.465 and 11.254 / 6.036 ms. For 16 bodies, 901 choices tried 6,301 DFAs and made 79,627 / 4,448 / 1,123 prefix calls with 586 matches in every arm. Baseline token and literal wall / CPU totals over its 57 samples were 0.089 / 0.049 and 0.072 / 0.040 ms. These observations include counter and clock overhead.
- The actual Bedrock/Foundation seed-mode sessions made 544 choices and 2,736 DFA calls. Literal candidates fell from 14,802 to 798 with the range index. Across the complete 16-body run's 177 lexicon constructions, wall / CPU cost was 0.851 / 0.658 ms baseline, 0.931 / 0.738 ms range and 0.980 / 0.772 ms ordered. Construction alone does not account for the CLI regression.

Each row gives two counterbalanced pairs on KinmenA CPUs 0–11, quota 12, 24 GiB and zero swap, with warm files and fresh processes. The percentage uses the range candidate's own matched baseline. The other columns give ordinary baseline → ordered candidate whole-process means and maximum RSS. Raw files also contain per-phase CLI and frontend costs.

| Workload / workers | Range wall change | Ordered wall ms | Ordered CPU ms | Ordered peak KiB |
|---|---:|---:|---:|---:|
| CLI 16 / 1 | -1.53% | 329.05 → 334.50 | 219.5 → 218.8 | 149736 → 149668 |
| CLI 16 / 4 | -1.36% | 362.27 → 365.66 | 268.1 → 265.9 | 153308 → 154520 |
| CLI 1,000 / 1 | 2.26% | 436.62 → 440.49 | 325.5 → 329.9 | 158524 → 158968 |
| CLI 1,000 / 4 | 0.39% | 476.96 → 489.25 | 392.8 → 400.4 | 164556 → 164424 |
| Frontend 1×16 / 1 | 1.47% | 338.47 → 349.24 | 222.6 → 222.9 | 136220 → 136336 |
| Frontend 1×16 / 4 | -2.12% | 393.90 → 401.55 | 295.5 → 306.4 | 141704 → 140920 |
| Frontend 1×4,096 / 1 | -4.86% | 1881.84 → 1918.99 | 1736.7 → 1769.1 | 591348 → 591128 |
| Frontend 1×4,096 / 4 | -3.98% | 1793.90 → 1734.65 | 2349.6 → 2253.2 | 597588 → 598480 |
| Frontend 12×256 / 1 | -1.72% | 4146.53 → 4226.87 | 2984.1 → 3003.3 | 577640 → 577152 |
| Frontend 12×256 / 4 | -0.06% | 1905.50 → 1951.10 | 4770.1 → 4896.4 | 737816 → 737808 |

- The range candidate's one extra serial CLI pair confirmed +3.49% wall / +4.13% CPU on 1,000 functions. The ordered repeat gave +2.99% / +1.12%. Ordered multi-unit/four slowed 2.57% and 2.22% in the original pairs and improved 1.87% in the repeat. The pairs are retained separately. Shared-host variance limits the precision of these results.
- Both candidates passed all six focused selectors, `lexicon`, `grammar-equivalence`, `grammar-resource`, `structure-reuse`, `parser` and `diagnostics`. The ordered candidate ran the 165-input eager oracle in both registration orders and all 256 individual byte literals in ordered and interleaved fixtures, including duplicate, empty and EOF cases. The first range probe failed to compile at an unsupported unbraced `else if`. The raw log records the diagnostic and exit.
- Across both candidates, 80 ordinary Tower samples in the primary pairs and 14 follow-up samples passed the applicable complete object and native 15/999 or source/import/canonical and interpreter 42 checks. The separate four-worker observer saw four simultaneous kernel jobs within the single large unit and four outer units on the multi-unit input. All ordinary snapshots reported zero lanes after join. Ordered runs retained 12,944,872–446,491,878 bytes with 11,146–319,919 live grants before disposal. Peak charged storage reached 612,472,982 bytes. Serial/four ledger storage ranged from 5,242,880 to 41,943,040 bytes.
- Restored the exact source and test blobs, refreshed timestamps and rebuilt. CLI `77f23db6124377e49dd677714aaca147d507a80f05928a71c3cc18faa0040a0c` and ordinary profiler `570e1b2e60ac6ae21557abf439797563401583bf25917244adfbf9f4fb1a57df` matched byte-for-byte. Restored lexicon and full small-output controls passed. The cgroup peaked at 1,488,510,976 bytes with zero OOMs. Only the idle container process remained at shutdown.
- Raw evidence is under `C:/Sandbox/build/codex_ecs_20261122/A2/cache/lexicon_d38396bb/`. See `obs/summary.json`, `current/patch`, `samples.json`, `pairs.json` and their `ordered/` counterparts, plus `reference/`, `plain/`, `cli/`, `checks/`, `restored/`, `seal.log` and `drain.txt`. These timings belong to d38396bb. The later public pin and LR changes in `18c132d4` are outside both comparisons. Its lexer producer and fixture blobs still match the freeze.
