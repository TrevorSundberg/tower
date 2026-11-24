# Charged LR propagation in the shared browser

Both focused runners execute the same Tower export, `lr_bounded_propagation_tests`. The [original browser run](shared_browser_c49c8b37.md) used an unbound world. Its result and saved reactors remain available at their original identities.

Base `943201fe93d1351521cb770c6fd300edd5e21087` includes c49 production LR blob `5386b9bd3939ae0b7c581bd333ab49406bf826d3`. The merged LR fixture changes from `a20e2c1b0ad4ab9c717485b02ba87b4517d82f35` to `49ebff403460816407b7ed66113ca54a3f5e3c29`. The charged entry is in `tests/lr_budget.tower` blob `fc6f71992bdefbba72f47024410cf8a2e9817211`. Both peer-owned denial/reuse helper bodies byte-compare equal to the base.

- The export first requires two host lanes. The existing caller/worker barrier releases only after both participants enter. Each allocates, grows and verifies its own propagation result.
- A separate synchronized ledger has two lanes and a 64 MiB byte limit. The calling lane is reserved before world construction. The root resolves to the exact ledger passed to `compiler_world_create_result`.
- The borrowed-result check must succeed first. The caller initializes a local Boolean to false. Only the seeded, charged branch can set it, immediately after the direct worker denial helper passes its first-chunk and partial-chunk Capacity, release, literal-row and retry assertions. Both the full propagation trial and this Boolean must succeed.
- The wide solve compares every row with serial results and checks parallel admission and independent-row retirement. The root, world and caller reservation retire in that order. A snapshot then requires the original used bytes, live grants and used lanes, all zero. Both peak lanes and the full competing byte reservation must have been observed. The 64 MiB charged peak includes this deliberate reservation.
- The existing unbound LR export still passes a null witness in its two original trials. The default shared compiler trial invokes the additional export at parallel capacity. The `lr-bounded` selector runs just that export on both hosts.

| Actual selection | Wall s | CPU s (user + system) | Peak RSS KiB |
| --- | ---: | ---: | ---: |
| Build shared compiler, 3 actions | 43.38 | 45.27 | 792424 |
| Chromium 159, two guest workers, 1/1 passed | 5.81 | 4.54 | 214740 |
| Build native LR test target, 39 actions | 223.07 | 421.01 | 817900 |
| Native Linux x64, two host CPUs, 1/1 passed | 0.05 | 0.04 | 56480 |

Chromium ran the charged phase in 40.045 ms, with 60 thread spawns. Wasm linear capacity grew from 27,262,976 to 33,357,824 B. Both nested workers and the coordinator emitted close and CDP found zero remaining targets. The fresh browser cgroup measured 5.983 s wall, 4.080 s CPU, 249,516,032 B peak and zero swap or OOM events. The native runner returned 0 with empty stdout and stderr. Both retained the 180 s guard and the browser retained its single 30 s retirement deadline. Both families drained under CPUs 0–1, quota 2, 3 GiB, swap 0.

The 1,786,131 B browser compiler SHA256 is `1d7710c194c9b80abd55cbde821c5e869205e764fe72e1e4455df42dc51a23ff`. The native runner is `cec38561cc844bcd49eca5be1a6b2adf5ffed0c6bcfef393c65c48055f49d37d`. Public bootstrap 745afa2f and the checked SDK34/LLVM19 paths built both targets. The prior c49 compilers, work reactor and browser reports were preserved. The focused browser report contains one LR phase and zero source-language trials.

Raw Deck evidence in [build/d1_ecs/lr_browser_budget_943201fe](../build/d1_ecs/lr_browser_budget_943201fe/) includes `ready.json`, `overlay-blobs.tsv`, `overlay.diff`, input/tool/provider hashes, saved binaries, build logs, timers, `native.sh`, `browser-check.sh`, `browser.json`, cgroup and drain records. The previous coverage gap remains documented in the c49 receipt. This run had zero build or fixture failures. One intermediate process listing omitted Docker's required PID column and was corrected for the drain check. These timings measure test cost. The production source, generation, site and instrumentation evidence retain their original boundaries.
