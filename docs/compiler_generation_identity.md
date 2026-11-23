# Native compiler generation identity, 2026-11-23

The inference repair `0e9db271` closes the actual semantics-unit failure.
Whole generations 2/3 reach an exact native fixed point on published source
`b5b585fba041d3a464f4ab4f5567b6bdfa281fe4`: all 35 compiler/helper
object, archive and executable files match, as do all packaged payload bytes.
The package manifests contain the same 1,158 tracked source hashes.
The public pin is unchanged. This is a Linux x64 development receipt, not final
portable release acceptance or deployment.

## Inference cause and checks

The diagnostic at `semantic_source_bindings.tower:178` pointed near the failing
expression. GDB identified `stack_dispose(&context.scan)` as the actual use.
The direct vector cast and its foreach reduction both passed. A small Context
containing `stack(void*)` reproduced successor failure/public predecessor success.

Executed straight-return type wrappers now register as ordinary templates.
Inference searched only the nominal type-constructor registry. The repair also
resolves type-returning ordinary templates, then applies the existing structural
constraints and full substituted-signature checks. It changes neither execution
classification nor query/admission/layout policy. No public symbols were added.
The checked argument already had the correct nominal vector specialization;
constraint lookup failed before matching it. No additional type producer or
recursive forcing was needed.

`generic_cast_inference.tower` independently covers the original cast, aliases,
nested generic/pointer constraints, ordinary type values and once-only operand
effects. Public and repaired compilers pass at workers 1/4. The two registered
CTest cases, type-smoke, negative generic mismatch, canonical round-trip and
worker object equality pass. Complete generation 1/2/3 packages pass the existing
`verify_compiler ... development` checks before use or final acceptance.
Type-smoke ran at the inference-fix boundary; the focused CTest and canonical
checks were repeated after merging the independent LR change before freezing.

The actual entities unit retains canonical SHA256
`aede7e3953aca6f63a6385bf9dd93a010a563eee7c6c7bd6c3451c9a8b2be307`
and object SHA256
`abb98ae7c3ea19f624cf06f0221153c5411552190860ef3f9ff57a01872b09fd`
at workers 1/4 and in both complete successor builds. The public-produced object
remains `b9c03276bfa6e575c5e244182ee21cfc84f10fe763312b7af8b8a3181c965565`.
That adjacency mismatch remains failed; no llvm-diff result waives it. There is
no observed run/worker ordering instability in these retained comparisons.

## Complete lineage and artifacts

| Compiler | Producer | Executable SHA256 |
| --- | --- | --- |
| Public pin | Existing published predecessor | `9653f8187a104ca84ab5d8601f336d7e1ed8200206544c70a81415018d623d02` |
| Generation 1 | Public pin | `5224b043d163713cd273d093eb0dafa7a3372b2fdbb5090931e20a49ca2cc6fc` |
| Generation 2 | Complete verified generation 1 | `f71fd0d58bb0231c55600bd7bf2d70911147e5bba9b7ca18e44dee00ba1d5881` |
| Generation 3 | Complete verified generation 2 | `f71fd0d58bb0231c55600bd7bf2d70911147e5bba9b7ca18e44dee00ba1d5881` |

Retained host directory:
`C:\Sandbox\build\codex_ecs_20261122\B2\inference_fixed_point_b5b585fb`.
It contains complete `gen1`, `gen2`, `gen3` packages, the failing pre-repair
compiler/resources in `failed_before`, and focused logs/commands/object manifests
in `logs`. Each package has `development.json`, `linux-x64/towerc`, its complete
`share` tree, LLVM license and `SHA256SUMS` (66 payload files plus checksums).

| Manifest | SHA256 |
| --- | --- |
| gen1/development.json | `49293f14ad84054a70c0511563e2a1b67ada9ab4d7ffe3418b14b243d2c3dab0` |
| gen2/development.json | `73d90a42935ec9e791c4b9b909ea51d40aada7feec16103f210c9454f86226d8` |
| gen3/development.json | `7b766b5eac0cd6adbac0f5c0b4bb143430ceb8b8655a0c61998e7f9468342de5` |
| gen2 and gen3/linux-x64/SHA256SUMS | `d6f217595051e35838ad7dfee74634271f785bd5f271bd3795beb0f86a0e6f6b` |

Generation 1 used `/cache/native`, bootstrapped by the checked-in public pin.
Generations 2/3 used `/cache/b2_identity_gen2`; generation 2 was retained at
`/cache/b2_identity_gen2_retained` before reuse. Each successor used the preceding
immutable package through `TOWER_BOOTSTRAP_COMPILER`. CMake/Ninja target `towerc`,
Release, compiler jobs 1, build jobs 6, LLVM/Clang 19.1.1, native/module/work/backend
options enabled, and `cmake/TowerBackend.cmake` project include were unchanged.
The retained Ninja command lists contain the exact commands; each complete
successor build executed all 53 steps, including target runtime resources.

A first generation-3 build in `/cache/b2_identity_gen3` already matched all 35
binary files. Its nine runtime `.ll` assets differed only in the absolute input
path recorded by `runtime_bind` in LLVM's ModuleID comment. That failed resource
comparison is retained. Repeating the complete generation at the original path
made the complete resource tree and checksum manifest equal without rewriting
outputs. Both trials retain their own manifests; no earlier failure was relabeled.

The initial package attempt failed because this clone's LLVM submodule was not
initialized. The license was recovered from the local ROOT checkout verified at
the pinned `1e57ee22ca274b663eeb279fd86e7010a8441c99`; its SHA256 is
`8d85c1057d742e597985c7d4e6320b015a9139385cff4cbae06ffc0ebe89afee`.

## Cost and limits

Docker `tower-b2-work`: Linux WSL2, cpuset 12–23, 12 CPU quota, 24 GiB memory.
Generation 2: 38.269 s wall / 155.962 s CPU / 779708 KiB peak RSS.
Generation 3 at a distinct path: 33.340 / 141.381 / 778268.
Generation 3 at the identical path: 33.609 / 138.343 / 779440.
Build CPU is accumulated child CPU; peak RSS is the process-profile child peak,
not a simultaneous sum across compiler processes.

One warmup then one retained fixture sample, no other B2 job, identical source,
explicit grammars and interpretation flags:

| Compiler / workers | Wall s | CPU s | Peak RSS KiB |
| --- | ---: | ---: | ---: |
| Public / 1 | 1.198 | 1.114 | 171436 |
| Public / 4 | 1.127 | 1.327 | 187104 |
| Fixed point / 1 | 1.061 | 0.993 | 182632 |
| Fixed point / 4 | 0.971 | 1.110 | 201220 |

These are small correctness/cost samples across compiler generations, not an
isolated speedup attribution to the inference edit or whole-machine scaling.
The pre-repair failing compiler cannot provide a healthy baseline for this case.
ROOT retains public pin/Pages, integrated instrumentation, portable symbol-policy
and full release acceptance. Those gates are pending, not passed by this receipt.

After the frozen run, main incorporated B1 presentation and A2 accounting through
merge `43c680fe`. The affected native rebuild, workers1/4 regression, canonical
comparison and actual semantics-unit successor compilation pass on that merge.
The complete generation result above remains scoped to `b5b585fb`; ROOT's final
integrated milestone must validate later source changes independently.

The subsequent L2 scratch migration was merged through `e116e966` as
`b21c13c7d886319c1c03f943604f95479f11651e`. Its incremental native build and
inference CTest workers1/4 pass, and both inference/layout fixes remain intact.
However, latest-main self-hosting validation has a measured performance blocker:

- Identical current `compiler/units/semantics.tower`, explicit native target and
  grammars, `--jobs 1 --library`: the frozen compiler completes in
  21.693 s wall / 16.911 s CPU / 799500 KiB.
- The merged compiler, SHA256
  `039a46bbae53eb25b8f7719a10ef75e076b7e2aa2b9212045bb40f1bd4a142d9`,
  had not completed at 228.184 s wall / 223.281 s CPU / 607328 KiB. It was
  terminated explicitly (exit143); this check is incomplete, not passed.
- One bounded 45-second debugger run stopped at `sem_push_checked+83`, the
  scratch ownership linked-list traversal. Source inspection confirms that
  every push searches retained lists, even before the known `c.scan` case;
  newly created lists are appended at the tail. The sample identifies this
  concrete hot path, without claiming a statistical attribution of all runtime.

Logs `b2_inference_scratch_merged_semantics.log`,
`b2_inference_scratch_merged_bounded_trace.log`,
`b2_inference_scratch_push_asm.txt` and
`b2_inference_scratch_matched_reference.log` retain the failure and matched
reference. Attaching to the first process was unsupported; the bounded trace
used a debugger-owned child. All children were drained. The L2-owned follow-up
is to avoid the scratch-list search for known scan storage and supply an efficient
derived ownership lookup while preserving budget receipts and parent lifetimes.
No scratch ownership redesign was made in this inference task. This later-source
blocker does not alter the complete, frozen `b5b585fb` generation evidence above.

B1 scratch-lookup follow-up (`3415d9c8`, integrated with L2 admission in
`4bea26d6`): the linked-list hot-path scan is replaced by an arena-owned intrusive
address index with a pointer-width lookup bound. On identical frozen current
semantics sources/flags/path, B1's own before compiler timed out at60.04s; the
fix completes22.61s and exactly matches the frozen b5b585 compiler's object.
After merging L2 node-admission changes, current compilation completes23.88s
at workers1 and21.18s at workers4, with byte-identical objects between those
worker counts. This closes the measured lookup stall, not the entire successor
generation gate. The merged object differs from the earlier compiler's object;
that separate generation delta remains pending ROOT/B2 verification. Exact
hashes, scratch denial/lifetime checks and measurements are in the B1 journal.
