# Complete current native bootstrap fixed point

On 2026-11-23, complete generations 2 and 3 matched on frozen published source
`252b424ab770a0b334f31fa68eede1f1584a5acc` (tree
`14675a432d410badc6c548370b8632d506b6861e`). All 34 actual compiler/runtime/helper
objects, archive and executables match byte for byte. Every packaged payload
also matches, including the checksum file: 53 manifest payload files plus
`SHA256SUMS`, with no omitted resources or rewritten ModuleID text.

No compiler changes were needed. All three manifests identify the same clean
source and 1,166 exact source-file hashes, with no source patch. Generation
provenance differs only where it records the actual predecessor/build command.
That metadata difference is retained, not presented as payload identity.
This is the current 160 MiB development-bootstrap prerequisite; it does not
validate later A1 body batching or L2 module/inspection work. ROOT owns adoption
of the public pin, Pages and final integrated acceptance.

## Lineage and delivery

| Compiler | Producer | Executable SHA256 |
| --- | --- | --- |
| Public pin | Checked-in bootstrap | `9653f8187a104ca84ab5d8601f336d7e1ed8200206544c70a81415018d623d02` |
| Generation 1 | Public pin, no private override | `e885c76780e2e00c5e8ca80786ac87ca1f93f294276867a33923a2a0d342f65c` |
| Generation 2 | Complete verified generation 1 | `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138` |
| Generation 3 | Complete verified generation 2 | `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138` |

ROOT handoff directory:
`C:\Sandbox\build\codex_ecs_20261122\B2\current_fixed_point_252b424a`.
It contains complete `gen1`, `gen2`, `gen3` packages, original manifests,
`generation3.tar.gz`, `archive_modes.txt`, this receipt and retained logs.
Each package includes the executable, complete adjacent resources and LLVM license.

Generation 3 archive SHA256:
`94f03176cf057155b84928bf02ffb8959be496f795e803a4cc033f36b1ca1f5e`.
The tar archive preserves the original executable mode **0755**;
`linux-x64/towerc` is 2,236,032 bytes. Use the archive when transferring Unix modes.

| Manifest | SHA256 |
| --- | --- |
| gen1/development.json | `d71abf51134fd09f652d1c472c9c8ab6f53930426415b5251730bd9dc45e0a8e` |
| gen2/development.json | `adad59228318921e2bfbf6c0476c32a9584f9df2a96c3646b44e39dd366f733f` |
| gen3/development.json | `5b6f9a0fed461fcdc1640a2be948ff47cb7712e41bb80915062ae2a8735db857` |
| gen1/linux-x64/SHA256SUMS | `b7cd599e97be6c6228037cd374be14ede88bf0130429ed348e864fab00f162cc` |
| gen2 and gen3/linux-x64/SHA256SUMS | `bd4639d8b9cf9e9ed0b7052725466856b585d094841b2e54c4ec835d4646bd80` |

## Reproduction and preserved outputs

Docker `tower-b2-work`, Ubuntu24/LLVM19.1.1 on WSL2 Linux6.18.33.2,
cpuset12-23, quota12 CPUs, 24GiB. Native target x86_64-pc-linux-gnu, Release,
compilerjobs1 and outer jobs6. No sibling cache/build overlap or source changes.
Each generation ran all 52 actions of the ordinary `towerc` dependency target,
including helper executables and all runtime resources.

Generation 1 used the documented entry point with a fresh build directory:

```sh
env -u TOWER_BOOTSTRAP_COMPILER \
  TOWER_NATIVE_BUILD=/cache/b2_current_gen1_252b424a TOWER_BUILD_JOBS=6 \
  bash playground/scripts/build-native.sh -DTOWER_COMPILER_JOBS=1
```

Generations 2/3 used the same command with
`TOWER_NATIVE_BUILD=/cache/b2_current_successor_252b424a` and an explicit
`TOWER_BOOTSTRAP_COMPILER=/cache/b2_current_252b424a_genN_package/linux-x64/towerc`
where N is the verified preceding generation. These are successor-verification
overrides, not canonical public adoption. Generation 2's complete build was copied
to `/cache/b2_current_252b424a_gen2_build` before CMake clean and generation 3's
complete rebuild at the identical path. Generation 1 and all prior-task builds
remain intact. Exact Ninja commands and per-file binary SHA256 manifests are in
`logs/b2_current_gen{1,2,3}_commands.txt` and the gen2/gen3 binary manifests.

Existing `package_bootstrap COMPILER PREDECESSOR /work OUTPUT BUILD_COMMAND`
created each package. Each passed `sha256sum --check --status SHA256SUMS` and
`verify_compiler ... development` before successor use. Generation 3 used
`verify_compiler --development-package` from `/tmp`, including its restricted
negative control. That control correctly reports **missing Clang**; restricted
standalone release verification remains unpassed. Complete payloads were compared
with recursive `diff`; all actual root build objects/archive/executables with
`cmp`. Counts were derived from the produced files, not assumed from an old build.

The first process-profile invocation used bare `env`; the wrapper requires an
absolute executable path and failed before configuring anything. The retained
failed log is separate from the successful `/usr/bin/env` invocation. No compiler
diagnostic or generation comparison failed in the completed run.

## Focused controls and cost

The default `SemanticComponentBudgetBytes` is the published 167772160-byte policy.
Actual semantics-provider compilation succeeded in each complete build. An
additional generation-3 workers4 compile produced exactly the workers1 object:
`b74bac0c8dda6a40af34fba5223c63b56aff41c1134b6f18ad42fb2041923673`.
It took19.675s wall/18.382s CPU/1049612KiB peak RSS. No limit was raised here.

Current-source `verify_bootstrap_symbols` passed all nine supported native units:
utf8, bytes, entities, parser-nodes, host, interpreter, semantics, parser-format,
template-build. Reports use actual generated objects and LLVM19 `--undefined-only`;
no wildcard policy or new symbol exemption was added. The verifier was rebuilt
through the existing Tower tool builder with the public pin.

The packaged compiler passed relative-path and absolute-path source invocations.
Generic/cast inference workers1/4 and canonical re-execution each print42;
canonical outputs are byte-identical, SHA256
`67e48bee5d65bce8ed59d79a6a3425cf24e5ea5c09091f841129a051ea33bb60`.
Optimized/unoptimized backend execution controls both print45 then2. Existing
package verification covers diagnostics, interpretation, repeated object identity,
separate-library linking and executable behavior. No broad acceptance matrix ran.

| Complete build | Wall seconds | CPU seconds | Peak RSS KiB |
| --- | ---: | ---: | ---: |
| Generation 1 | 39.086 | 144.790 | 825820 |
| Generation 2 | 36.943 | 134.019 | 1011532 |
| Generation 3 | 36.032 | 132.908 | 1011920 |

CPU accumulates child CPU; peak RSS is the child peak, not simultaneous summed
memory across jobs. These are build-cost observations, not a scaling claim.
Development checks cost7.136s/8.680CPU/217208KiB for gen1 and
7.164s/8.714CPU/218208KiB for gen2; gen3 development plus restricted negative
control cost13.019s/15.930CPU/218204KiB.

Tool SHA256: Clang19
`f6d5286a52de10b1e3e8841457c9903a1ea28f222ac0f58cd616697d0dcd9db3`, LLVM19 library
`7e016cffd3eb077fa338b8ec08a7ab500e43c7460223d4b1f5c6b1bf10274b24`,
package_bootstrap `d2918ba41556d93566d244cabad7287ac570c5822bf3e353e47f1c7ff879e6fc`,
verify_compiler `add14ed9ddf97e7eb088794e532a144a25ced88a0e7eb53c691f83c07cda1906`,
current symbol verifier `4574ca28dd52e1c0e3965aef36de3db01354e68ea92f18d1c97dc1cad0ff277b`.
The package/verifier source units are unchanged from the proven earlier workflow;
the manifests record LLVM version, compiler lineage and dynamic dependencies.
CMake3.28.3 SHA256 `1c5227af4edd22d8d689def545e18ee458260c0fd579eba2187967f38817e638`,
Ninja1.11.1 `5965527e09fe2b3787772aa4f711d6a36b393e7f2fcaa744a7a96c5a4ddf59cb`,
GNU ld2.42 `e9ceb054c12207970f2726dfc07e9a66b411602748628baf27399f02a9bbb31b`.

The earlier public-predecessor/successor object mismatch remains historical
**FAILED**, as recorded in [the prior receipt](compiler_generation_identity.md).
This complete current fixed point is separate evidence, not a semantic-only waiver.
Public pin/Pages, later-source acceptance and integrated instrumentation remain
ROOT-owned. No later L2/A1 code is included in this receipt.

After the frozen run, documentation reconciliation preserved incoming histories
through ROOT's `2013ad28` publication (merge `accde9b0`). That pin identifies
source252b424a and exactly matches the generation3 executable and resource
checksum hashes above. Its complete checksum verification passes. ROOT performed
the adoption; this task did not replace the pin. Later-source acceptance, Pages
verification and integrated instrumentation remain outside this bounded proof.
