# Complete native development generation at 48db0f27

Generations 2 and 3 match byte-for-byte on frozen published source
`48db0f27b439e9d0c7bb15e6f0c4beb932650e89`, tree
`2e5b2c500251119c52423b2e33a836f1e1da44d4`. The comparison covers all **34 actual
compiler/runtime/helper objects, archive and executables**, four configure-probe
binaries, and every **53 package payload files plus SHA256SUMS**. Actual output
membership also matches the complete earlier f7 inventory; no selected subset,
hash normalization, path rewriting or omitted resource establishes this result.

This freeze includes A2's immutable declaration-stage page registration and
fields (`f4e42223`) and L1's named/nullary type-producer query repair (`48499b3a`).
The earlier f7 generation is preserved, not relabeled. Later in-flight numeric,
wrapper and backend reconstruction work is outside this freeze. The four failed
ECS LLVM Foundation gates remain with L2 and were not rerun or weakened.

## Delivery and exact identities

Candidate directory:
`C:/Sandbox/build/codex_ecs_20261122/B1/current_generation_48db0f27`.
Use **generation3.tar.gz**, which includes `development.json`, the complete
`linux-x64` package, adjacent resources, checksums and LLVM license. The compiler
is 2,276,304 bytes, mode **0755**. Transfer was hash-checked and copied back to a
fresh Linux path containing spaces; every extracted byte matched the original
package, every checksum passed, and mode 0755 was verified. Modes for all package
members and generations are retained.

| Artifact | SHA256 |
| --- | --- |
| generation3.tar.gz | `841fc6e4187df718768a79c599c7edcc7f21190f7e53649d45f38256ce42dfbd` |
| gen3 development.json | `7121547f81149081fede0ddba4b52f14aacb52eb09da398d70f0eff378765ec6` |
| gen2/gen3 SHA256SUMS | `2cb987184b7982961b6656c20ee48d25bfe8a3b2106f9e70c232d5db9b33f09a` |
| gen2/gen3 binary manifest | `425666c367ddc1dde5802ff4b131bfe653d306650142e4c1ed8a95e1a52d4870` |
| gen2/gen3 full package manifest | `d8a52fdc561690723b86570e829729787ee265051483bd56ce7a754fc70fb6f1` |
| source_snapshot.tar | `43100138067e4f85f8392d9f71d6fe0ca33702e556dcc8c778bec67a08e8e36c` |

Public predecessor SHA256 remains
`768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`.
All three new compiler executables have SHA256
`0846129d944c2bacafec5ef47aae8630ca26ed5896eba872a721a0e65433d8af`.
Whole-package equality is asserted for generations 2/3 at their identical build
path, not for generation 1's differently bound runtime text. Original provenance
JSON preserves each actual predecessor/command; it is not rewritten to match.

All three package manifests identify the same frozen commit and 1,198 source
hashes. The broader build/bootstrap snapshot contains 1,276 recorded files;
extracting its archive reproduced every recorded source byte. Source hashes
were verified before/after generation work. No pull or source edit occurred
during these builds or packaging. A subsequent validation-policy correction is
explicitly separate below; it does not alter any frozen package or compiler.

## Process and complete verification

Own KinmenB `tower_ecs_b1`, CPU 0-11, 24 GiB, Ubuntu 24/LLVM 19.1.1, native x64
Release, outer jobs 6 and compiler jobs 1. Existing jobs were drained, main was
clean, and the required pull completed after one transient DNS failure recovered
with fresh per-command HTTPS resolution. No persistent network setting changed.

Reused the established f7 scripts and packaging/toolchain cache. Generation 1
used a fresh directory and the ordinary documented path:

```sh
env -u TOWER_BOOTSTRAP_COMPILER \
  TOWER_NATIVE_BUILD=/cache/b1_generation_48db0f27/gen1_build \
  TOWER_BUILD_JOBS=6 bash playground/scripts/build-native.sh -DTOWER_COMPILER_JOBS=1
```

Generations 2/3 used `/cache/b1_generation_48db0f27/successor_build`, with explicit
successor-test overrides to the complete verified gen1/gen2 packages under
`/tmp/b1_generation_48db0f27_packages`. Gen2 passed development verification and
its entire build was copied to `gen2_build` and hash-checked before cleaning the
successor path. All three generations completed 52 dependency actions; no duplicate
leaf/CMake build or sibling cache was used. Objects, depfiles, command lists,
configure probes, toolchain hashes and original full builds remain in B1's cache.

The existing Tower `package_bootstrap` and `verify_compiler` helpers produced
and verified complete packages. Relocated development verification passed;
the expected missing-Clang restricted control passed as a negative check.
**Restricted standalone release verification has not passed.** Clang/LLVM and
system runtime dependencies remain declared development requirements.

## Strict symbol-policy blocker and narrow correction

The original strict gate failed on the actual frozen nm reports:

- Entities: `node_match_set_label_result`, consumed by checked metadata copying
  in `host_metadata.tower`, provided by `parser_nodes.tower`.
- Semantics: `compiler_world_grammar` for the existing observer,
  `entity_component_owner` for generic stage leases, and
  `entity_register_stage_result` for immutable declaration-page registration.
  Their definitions are in the entities object's world/entity providers.

The other seven unit policies passed. Original reports, statuses and the old
validator binary are retained in `symbols_original` and `validation_policy`.
Defined-symbol reports independently confirm all four Tower providers.

After all generation/source-snapshot work completed, added only those four exact
entries to the existing per-unit policy and seven focused fixture calls. Existing
wrong-unit, truncated/suffixed symbol, first-failure and unexpected-import tests
remain intact; the new checks cover those boundaries too. Target spellings in
the fixture are string-policy checks, not target execution claims. No wildcard,
arbitrary prefix permission, external implementation or compiler API change.

Only the validator and its standalone Tower fixture were compiled through public768.
All nine actual native policies now pass; the complete existing symbol fixture
passes. The repaired validator source/patch/tool identities are separately retained
under `validation_policy`, outside the 48db0f27 generation manifest. Frozen
compiler/package hashes were checked again and are unchanged. This small tool
repair therefore requires no compiler-generation rebuild or new runtime benchmark.
No compiler warning/error or generation inequality occurred; the original strict
policy failure is preserved rather than relabeled as an initial pass.

## Observed costs and output controls

GNU time, one observation each; CPU includes children and RSS is a process/child
high-water mark, not the sum of concurrent live memory or allocator retention.

| Build | Wall s | CPU s | Peak RSS KiB |
| --- | ---: | ---: | ---: |
| Generation 1 | 43.14 | 138.03 | 1067436 |
| Generation 2 | 35.00 | 92.39 | 1061904 |
| Generation 3 | 32.26 | 92.31 | 1062568 |

Development verification: gen1 4.62 wall/4.59 CPU/190444 KiB; gen2
4.68/4.64/190568; gen3 development plus expected restricted failure
8.34/8.20/190956. Policy-tool rebuild: 2.70/1.87/226008; focused fixture compile
1.08/1.00/201760 and execution below time's .01-second resolution/1684 KiB.

Fresh candidate processes, warm filesystem, jobs1, packaged resources, native
`x86_64-pc-linux-gnu` object target and original frozen 16/1000-function inputs:

| Input | Wall s | CPU s | Peak RSS KiB | Exact execution |
| --- | ---: | ---: | ---: | ---: |
| Small | .44 | .42 | 187540 | 15 |
| Large | .58 | .56 | 238648 | 999 |

Both objects match the original reference bytes: small
`cdc5a6ec0f2b12f1f7a622f45a27859e374558867df97470c8120cd81ddfb407`, large
`ae9e824d75213b15baa1811f9ec4db04a2f044cce25746d291b888c7952f4e08`.
Clang runtime compilation uses its declared `x86_64-unknown-linux-gnu` triple;
compile/link logs have no warnings or errors. These n1 controls do not replace
earlier paired performance evidence or claim a new speedup/scaling result.

Full evidence and unchanged builds: `build/ecs_b1/cache/b1_generation_48db0f27`.
OS commands: `build/ecs_b1/generation_48db0f27`. Delivery contains all three
package archives, source snapshot, manifests, commands, logs, modes, symbol
reports, verification and control evidence. No private binary enters tracked
sources. ROOT owns public-pin adoption and atomic final composition/deployment;
later-source, browser, sanitizer, standalone and unresolved semantic gates retain
their separate owners and acceptance boundaries.

Publication reconciliation preserves complete incoming `45db5aa9` history.
Its `semantic_type_values.tower` integer-argument/numeric fix and accompanying
fixtures/browser changes are outside the frozen 48db0f27 candidate, as requested.
The policy/fixture, language/library and public predecessor inputs are unchanged;
the focused fixture and all nine frozen nm closures pass on the merged policy.
No generation or provenance was relabeled to the later source. ROOT owns adopting
and validating that later composition separately.
