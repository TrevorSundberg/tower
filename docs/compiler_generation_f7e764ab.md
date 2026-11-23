# Native development-bootstrap candidate at f7e764ab

Complete generations 2 and 3 match byte for byte on frozen published source
`f7e764ab0807376025700b2a3176c6f6130e34a8`, tree
`b0bbfdf8a68f2ad10b3bede4b10c71d7d83c6149` (2026-11-23).
The comparison covers all 34 actual compiler/runtime/helper objects, archive
and executables, plus four CMake configure-probe binaries. All 53 packaged
payload files and `SHA256SUMS` also match. Membership was derived from actual
outputs; nothing was normalized, omitted or rewritten to obtain equality.

This freeze includes published body/backend/KnownScan changes and both accepted
LR improvements, including range union253af949. Later compiler inputs and the
independent A1/L2 IDE/metadata repairs are outside this receipt. This is a
development-bootstrap candidate with declared Clang/LLVM dependencies, not a
final whole-project or standalone release. ROOT owns public pin adoption and
atomic hosted deployment; this task changes neither.

## Candidate and lineage

Delivery directory:
`C:\Sandbox\build\codex_ecs_20261122\B1\current_generation_f7e764ab`.
Use `generation3.tar.gz` to preserve Unix modes. The transferred archive was
SHA256-checked, extracted to a fresh Linux path containing spaces, compared
recursively with the original package, and verified there. Its compiler is
2,267,592 bytes, mode **0755**. Adjacent resources, checksum file, LLVM license
and original `development.json` are included.

Archive SHA256:
`7ee019b4a35faf1182744620d348e75fed691c50349be5db0ca4d7e5b74efde7`.

| Compiler | Executable SHA256 |
| --- | --- |
| Checked-in public predecessor | `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138` |
| Generation 1, produced by public predecessor | `a01cd156ecfa382cbb9ae5740f771c384f9dfb62b2e141ca24125449f26b5674` |
| Generation 2, produced by verified complete generation 1 | `a01cd156ecfa382cbb9ae5740f771c384f9dfb62b2e141ca24125449f26b5674` |
| Generation 3, produced by verified complete generation 2 | `a01cd156ecfa382cbb9ae5740f771c384f9dfb62b2e141ca24125449f26b5674` |

| Original manifest | SHA256 |
| --- | --- |
| gen1/development.json | `c995823bc863b9392b95423de9631d74955f7573598d2f7472c2c77a261447c2` |
| gen2/development.json | `af11c28c4f6086803fc873505227dabb6f8c08837f6f84b2e1df0d1d896430c4` |
| gen3/development.json | `ffbd4fbea2e66d7f22a806fc532c916e744f08e60b0e3c1518d39fb704f9ee7d` |
| gen1/linux-x64/SHA256SUMS | `efeb9dc731d178f6cabb6fbcb1b66b924259c0da5c15c9e11823d4705f2d247f` |
| gen2 and gen3/linux-x64/SHA256SUMS | `4adde1c84f7f407eb11c7bd4af09ff5270370b33f6a6bbabc512e5352180ebc9` |

All three source manifests identify the same clean commit and identical 1,173
source-file hashes, with no source patch. Original provenance metadata retains
its actual predecessor and command differences. Generation 1 used a different
build path; only its executable identity is asserted against later generations,
not complete package equality. Generations 2/3 used the identical build path.

## Reproduction and complete comparison

Own KinmenB Docker `tower_ecs_b1`, CPU0-11, 24GiB; Ubuntu24, LLVM19.1.1,
native x86_64-pc-linux-gnu Release, outer jobs6 and compiler jobs1. Previous jobs
were drained and main was clean/current before freezing. No sibling cache was
used. Every generation completed all 52 actions of the normal dependency target.

With `base=/cache/b1_generation_f7e764ab`, generation 1 used a fresh directory:

```sh
env -u TOWER_BOOTSTRAP_COMPILER \
  TOWER_NATIVE_BUILD=$base/gen1_build TOWER_BUILD_JOBS=6 \
  bash playground/scripts/build-native.sh -DTOWER_COMPILER_JOBS=1
```

Generations 2/3 used `TOWER_NATIVE_BUILD=$base/successor_build` and explicit
successor-test overrides pointing respectively to complete verified
`/tmp/b1_generation_f7e764ab_packages/gen1/linux-x64/towerc` and `gen2/linux-x64/towerc`.
Before cleaning that path for generation 3, the entire generation-2 build was
preserved at `$base/gen2_build`, including objects, depfiles and build metadata.
Generation 1 and the final successor build remain intact in the same B1 cache.

Existing public-built Tower tools `package_bootstrap`, `verify_compiler` and
`verify_bootstrap_symbols` supplied packaging/verification. Complete predecessor
packages passed checksum and development verification before use. Actual ELF/ar
outputs were enumerated recursively, including configure probes; member lists,
SHA256 manifests and every corresponding file were compared. Recursive package
comparison included every resource and the checksum file itself. Package
provenance JSON was preserved separately, without rewriting lineage.

The handoff contains all three original packages, manifests, original commands,
tool/toolchain hashes, source-byte manifest, archive modes, raw build/verification
logs, comparison receipts and observations. Full build inputs/outputs and
depfiles remain in the B1 cache; frozen source remains reachable in main history.
No private build artifact was copied into tracked repository files.

## Checks and observed cost

The relocated `verify_compiler --development-package` passed development checks
and its expected missing-Clang negative control. Restricted standalone release
verification remains **unpassed**. All nine exact native symbol/import policies
passed against actual generation-3 LLVM `--undefined-only` reports: utf8, bytes,
entities, parser-nodes, host, interpreter, semantics, parser-format, template-build.
No wildcard exemption or policy change was made.

| Complete build | Wall seconds | CPU seconds | Peak RSS KiB |
| --- | ---: | ---: | ---: |
| Generation 1 | 44.77 | 143.75 | 1061276 |
| Generation 2 | 34.92 | 90.72 | 1060636 |
| Generation 3 | 33.53 | 95.88 | 1059996 |

GNU time accumulates child CPU; peak RSS is a child high-water mark, not the
sum of concurrent jobs' resident memory. These are one build observation each.
Development verification cost5.38s/5.81CPU/191384KiB for gen1,
5.30s/5.70CPU/191480KiB for gen2, and10.44s/11.21CPU/191584KiB for gen3's
development plus expected restricted failure.

Fresh candidate processes, warm filesystem, jobs1, packaged language/runtime
resources, LLVM19 native object target, existing frozen16/1000-function fixtures:

| Fixture | Wall seconds | CPU seconds | Peak RSS KiB | Execution |
| --- | ---: | ---: | ---: | ---: |
| Small | 0.45 | 0.44 | 186884 | 15 |
| Large | 0.60 | 0.58 | 238692 | 999 |

Both objects exactly match the original frozen references, SHA256
`cdc5a6ec0f2b12f1f7a622f45a27859e374558867df97470c8120cd81ddfb407` and
`ae9e824d75213b15baa1811f9ec4db04a2f044cce25746d291b888c7952f4e08`.
These are single observations, not replacements for the original counterbalanced
paired performance results. No runtime change or new allocation/scaling claim
is made by this release-prerequisite task.

Retained failures: a post-gen1 evidence command reported an invalid `-C` option;
absolute sha256sum/Ninja commands collected that evidence successfully without
rebuilding. Package publication failed on the Windows bind mount's atomic
directory operation; the same helper succeeded on Linux storage, followed by
archive transfer. A separate fixture-link control initially emitted Clang's
target-triple override warning and failed the diagnostic gate. Its log/object
remain intact. Only that link control was repeated with the runtime's declared
`x86_64-unknown-linux-gnu` target; it passed without diagnostics and both linked
outputs remain exact. No generation build warning/error or byte comparison failed.

Public pin adoption, later-source composition, integrated instrumentation,
browser and hosted verification remain ROOT-owned and pending. The independent
A1/L2 defects are not marked resolved by this native fixed point.
