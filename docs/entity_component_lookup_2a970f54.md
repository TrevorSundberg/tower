# Per-owner component lookup on Deck

**Rejected the small-signature fast path.** One- and two-kind tables accounted for 92.93–98.80% of published column searches. Checking the second kind first helped the medium single-unit run at two workers in all four pairs, but cost wall and CPU time on the same input at one worker and on other shapes. The original binary search ships. The retained change fixes a two-CPU prerequisite in the stage test.

Source `2a970f54e25041eb8c84e3c2fbf486381c3c1371`. The [occupancy study](compiler_ecs_occupancy_9d9329db.md) measured retained pages, and `29a77cfb` introduced published column lookup. This experiment measured calls with the existing declaration page policy. A temporary Tower observer owned a histogram per store, guarded every counted call by the store creator's pthread identity and emitted it at clean disposal. Four separate runs used one admitted worker and one CPU. Counts span world creation through output checking and disposal. No observer ran during ordinary timing.

| Units × bodies per unit | No published table | Table hits / misses | Arity 1–2 share | Second column among arity-2 hits |
| --- | ---: | ---: | ---: | ---: |
| 1 × 16 | 112,979 | 2,184,688 / 193,917 | 98.50% | 99.62% |
| 1 × 256 | 222,179 | 3,181,600 / 661,646 | 92.93% | 99.10% |
| 2 × 8 | 218,678 | 4,302,912 / 356,618 | 98.80% | 99.64% |
| 2 × 128 | 327,878 | 5,300,316 / 824,858 | 95.22% | 99.37% |

The [exact hit/miss histogram](entity_component_lookup_2a970f54.tsv) covers every observed arity (1–11) and the two early exits. Empty entities had no table. All invalid-type counts were zero. The candidate changed only `entity_table_column`: check slot 1 at arity two, then slot 0 if present, else return arity. Larger tables kept lower-bound search. This also reaches signature matching, row publication and query-plan construction. The census covers the per-owner call site only.

Each row below has four adjacent A/B pairs with balanced order and reversed shape order. A is original, B is candidate. Reported wall/CPU are arithmetic means of the existing frontend window in milliseconds. RSS is maximum whole-process KiB. Each shape/worker count retained exactly the same bytes and grants on both arms in every run.

| Units × bodies | Workers | Wall A / B ms | Change | CPU A / B ms | B faster (wall) | RSS A / B KiB | Retained bytes / grants |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 × 16 | 1 | 791.43 / 795.30 | +0.49% | 771.84 / 768.34 | 2/4 | 136116 / 136132 | 12955876 / 11148 |
| 1 × 16 | 2 | 938.46 / 987.19 | +5.19% | 963.84 / 1002.52 | 1/4 | 140892 / 142124 | 12952940 / 11149 |
| 1 × 256 | 1 | 997.39 / 1033.18 | +3.59% | 962.87 / 996.18 | 1/4 | 142260 / 142252 | 37252027 / 26681 |
| 1 × 256 | 2 | 1099.82 / 1082.16 | -1.61% | 1201.53 / 1179.34 | 4/4 | 149124 / 148812 | 37249091 / 26682 |
| 2 × 8 | 1 | 1528.30 / 1621.87 | +6.12% | 1490.44 / 1558.09 | 0/4 | 150184 / 149932 | 24348836 / 21243 |
| 2 × 8 | 2 | 1212.46 / 1180.10 | -2.67% | 2274.41 / 2229.98 | 3/4 | 225500 / 223920 | 24343020 / 21245 |
| 2 × 128 | 1 | 1700.25 / 1759.91 | +3.51% | 1649.63 / 1704.93 | 3/4 | 163184 / 163120 | 48225726 / 36773 |
| 2 × 128 | 2 | 1381.85 / 1382.05 | +0.01% | 2621.16 / 2616.56 | 3/4 | 224784 / 225016 | 48219910 / 36775 |

All 64 fresh ordinary processes used the same Release flags, public745, CPU0–1/quota2/3GiB/swap0 and frozen resources. The existing outer timing observer was enabled on both arms. The complete generated source, imported module and canonical Foundation matched byte-for-byte across arms and workers. Each unit executed `answer()` and `body_0(36)` independently against 42. Every joined snapshot had zero used lanes and disposal required all live grants to retire. Whole-process totals A/B were 41.59/42.35 s wall and 50.37/50.88 s CPU. These numbers include setup and output checks.

**Fixture repair.** The unmodified stage fixture exited 1 with `Concurrent stage ownership regression` on affinity two, before starting its two-worker barrier. It now selects supported widths from 2 and 4, keeps the job array bound explicit, and still requires at least two CPUs. The original simultaneous-entry barrier, distinct pthread identities, ticket/pin/lease assertions, 128 children, all five outcomes and 16 rounds are intact. Both the candidate and restored implementation passed 80 two-worker trials, four coordinator transition cases, 18,576 finalizers and store/ledger teardown. One CPU still failed with the exact diagnostic. Four-worker execution remains for a host with sufficient affinity.

Table membership/pinned query ranges (`entity_tables`), zero/one/five-kind layout and removal, leases and reentrant finalization passed. Restoration refreshed the production timestamp, rebuilt the provider/consumers, and reproduced the saved ordinary ELF SHA256 `0429cf98e56dc691d97a36d14268bfde778d36d9d317a2d236dcff340f785353` and entity object `bb6f5048570eb16c7c4d421668b654df36a5af7e57e663abcd212457ebc13a0c`. Baseline production source blob `fca415c441fb48deb593084f8eb07f1cdfc6a18e`. The restored two-unit, 128-body-per-unit control matched the full reference again at two workers. The repaired stage test took 0.03 s wall, 0.03 s CPU and 1,892 KiB peak RSS. The container drained to its keeper with 117 GiB disk available.

[Raw Deck evidence](../build/d1_ecs/component_lookup_2a970f54/) includes the temporary Tower observer and candidate patches, exact ELF/object hashes, all raw counts and comparison artifacts, sample order, process/phase costs, fixture failures and restore checks. The histogram decode initially used a container-owned output directory and was redirected to the lane-owned directory using the original counts. No compiler throughput improvement is claimed.
