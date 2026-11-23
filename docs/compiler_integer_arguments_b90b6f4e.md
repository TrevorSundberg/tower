# Unary numeric type-argument preparation

The native reproduction confirms D1's failure and the shared admission repair.
Frozen published source `b90b6f4e4144bb934838fd6a1b6eb211b36932b1`, tree
`f894cb5f69d33e2e4c6e0522db67268653fc0e07`, plus this batch. D1's
`type_numeric_negation.tower` remains unchanged, SHA256
`af6bcd0949168b4f84b3eecd6502ab35c48ab98c4b088ce5c8b942e032f81290`.

## Confirmed producer chain and repair

A bounded temporary Tower trace on the real native input recorded:

```text
A2 native trace: TowerExpression unary literal, no generic binding; IntegerArgument skipped
A2 native trace: no prepared value; ordinary KBinary is not constant
Expected a compile-time integer argument
```

The unwrapped node has two children, no left operand, a right operand and no
generic binding. `sem_literal` deliberately accepts this shape for contextual
typing. Its other callers include inference, binary/conditional peer typing,
float-literal recognition and leased expression checking. It is not a promise
that expression checking produces a constant. Unary minus constructs ordinary
`KBinary` subtraction, including the existing unsigned-magnitude/`KBits` treatment
of signed minima. `sem_constant_value` correctly rejects that unexecuted value.

Only `semantic_type_values::sem_type_value_simple` changes in production. After
transparent/group nodes unwrap, an unbound remaining `TowerExpression` or
`TowerComma` is computed. It no longer skips `IntegerArgument`. Existing bound
generic values and bare literals retain the fast path. The same predicate serves
declaration representation-argument readiness and array-count readiness, so those
callers also wait for the prepared receipt without changes to L1's methods.

`sem_type_value_request` records the existing expression query, contextual numeric
parameter type and owning lexical capture. `sem_type_value_finish` uses the normal
evaluation query/interpreter; suspension, executed dependencies and joined literal
publication are unchanged. `sem_constant_value` consumes that prepared value,
then enforces constant/integer/exact-type constraints. Bounds remain checked after
evaluation. No new evaluator, literal folding, constant flag, recursive worker
completion, type-name registry or resource-policy change was added.

All traces were removed. `sem_literal`, signed-minimum lowering, `semantic_types`,
L1's `generics`/`semantic_declarations`, D1's numeric fixtures/browser registrations
and ROOT's invocation/resource fixtures are unchanged.

## Checks and preserved failures

The traced native baseline exits1 after closing its batch:0.494122 wall/0.438484
CPU s,176,724 KiB peak. It is a failed healthy compile, not an accepted rejection.
The repaired exact-source compile exits0:0.492709/0.436111 s,177,020 KiB. These
different outcomes are correctness evidence, not a speedup comparison.

New `integer_argument_unary.tower` and `integer_argument_checks.tower` reuse the
existing frontend, ordinary interpreter and canonical formatter. Registered in
`tower-lr-work-tests ... integer-arguments all` and `type-smoke`:

- Direct generic double-negation, direct array extent and primitive width.
- Contextual `usize` wrapping at32/64 bits; `i8` minimum and double-negation
  wrapping, accepted i32/i64 minima and exact rejection of i8 −129.
- Known immutable capture; exact rejection of a later-written capture.
- Untaken call containing print/trap: required output remains `8\n2\n0\n`.
  Ordinary runtime double-negation provides the independent arithmetic reference.
- Original `computed_type_arguments.tower` runs unchanged through the same
  producer/interpreter, including helper calls, recursive/indirect calls, captures,
  lazy branches and nested staging; required output0.
- Serial/four-worker byte-identical canonical output and exact diagnostics/offsets
  at32/64 bits, canonical unary-program re-execution, terminal failure with no
  published program and stable first diagnostic.

Negative unsigned extent now reaches the actual bound check, including provenance:
`Array length must be between 1 and 1,048,576`, followed by the exact instantiation
location for the fixture. D1's existing matcher targets that bound message.

Failures are preserved. Initial trace `print` calls introduced an unavailable
`tower_print` link provider; they were replaced with the runner's existing libc
output boundary, then removed entirely. No provider/exemption was added. Initial
type-smoke completed its old type/alias portion and valid new cases, then exited134
because our expected negative diagnostic omitted its instantiation location
(116.014 wall/109.605 CPU s,293,020 KiB). The fixture now expects the complete
message; neither compiler error nor assertion strength was weakened.

After that correction, focused22 compilation cases pass10.265/9.842 s,250,352 KiB;
query-smoke passes0.356/0.378 s,103,936 KiB; complete type-smoke including the new
cases passes123.897/117.481 s,294,628 KiB. Smallest changed production object built
in23.816/18.519 s,1,068,108 KiB; existing dependency targets linked in0.992/0.218 s,
70,776 KiB. The diagnostic-only fixture rebuild took9.275/6.328 s,426,784 KiB.

## Healthy matched cost and identities

KinmenA Windows11/WSL2 Linux x64, Ryzen AI MAX+395, LLVM19 Release/public compiler
768a0cdf. Existing native cache, one build owner, production allocator, CPU0-11/
24GiB container, shared2GiB compiler ledger; no sanitizer or allocator injection.
The preserved pure baseline profile `4ccdd459` has identical compiler/library/
bootstrap blobs to b90b6f4e; only unrelated D1 fixture/docs changed since its build.
It contains no temporary trace. Profile and generated inputs are identical across
the comparison. Fresh processes/warm filesystem, observer disabled, paired n3 with
sample2 order reversed, workers1/4. Medians: milliseconds wall/CPU, peak RSS KiB.

| Bodies / workers | Baseline process wall / CPU | Repaired process wall / CPU | RSS before → after |
| --- | ---: | ---: | ---: |
| 8 /1 | 498.654 /442.053 | 503.040 /446.121 | 176,444 →176,860 |
| 8 /4 | 579.905 /572.425 | 585.078 /577.581 | 179,348 →178,276 |
| 512 /1 | 689.773 /627.182 | 674.089 /617.997 | 254,208 →254,176 |
| 512 /4 | 745.792 /807.999 | 749.434 /814.755 | 256,548 →256,032 |

Observed wall medians −2.27%..+0.89%, CPU −1.46%..+0.92%; no material observed
regression, no statistical speedup claim. Four workers still lose on these inputs.
All24 processes preserve original source/canonical checksums, reference42 and
zero final byte/lane/live grants. Peak ledger remains108,202,107/108,151,819 B
(small1/4),178,287,382/178,237,094 B (large1/4); separate ledger metadata and
foreign/raw allocator exclusions remain unchanged. This is not new scaling proof.

Exact scripts, input/link manifests, individual samples, source patches, failures
and statuses: `C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/integer_argument_unary_b90b6f4e`.
`baseline.sh`, `candidate.sh`, `final_checks.sh`, `paired.sh` preserve commands.
Traced baseline and candidate identities are separate from the pure timing baseline.

| Artifact | SHA256 |
| --- | --- |
| Public compiler | `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138` |
| Traced baseline runner | `7e42170ae8f2f03f5f7598479cace80e6bf83a481513877d8ba9f034f30587b0` |
| Final runner | `95194f33d05be3f5596aac665def6509f50e3e97e83c28fad03b0c75fa082d0f` |
| Final semantics object | `a15be3cd732a9cc9529abae228e43d31b455572956796c643cb3639cc54244a1` |
| Baseline profile | `4ccdd459fdecc7df0874ddb54c52fd864222f5bfa63d3b8523db35e7dbe80016` |
| Repaired profile | `a48aadbeced31931429d9fbf68c442955ef1bf68f01c67d80c28e546b101cae5` |
| Production helper source | `509736c95f3b0251bccc813a1ca73c0cce6bf2c6e444f265dec9d65d7ae47243` |

Profile/fixture imported-source manifests and actual object/transport manifests
were checked after measurement. No browser/reactor/generation/deployment evidence
is claimed. D1/ROOT must adopt the changed producer in current browser artifacts;
L1's independent numeric-wrapper/nullary-alias work retains its own acceptance.
The service-rejected instrumentation gate stays open, with old stashes untouched.

## Merged-source adoption

Implementation `b84c6ba7` merged complete published `48db0f27` as
`44d4dd484703bfd19ba8d70b43cbd26af18a9858`. L1's actual named-return/nullary-call
producer and dependency admission changed; they are preserved without overlapping
edits. The helper and all A2/D1 numeric fixtures remain unchanged. Therefore
hash-only adoption was insufficient: the existing dependency targets rebuilt
entities/semantics and relinked both runners,4 actions,33.910 wall/24.453 CPU s,
1,066,336 KiB peak.

Exact-source reproduction, all22 unary/computed cases and query-smoke pass on
that merge (focused9.562/9.172 s,253,624 KiB; query0.284/0.302 s,103,420 KiB).
Four affected plain profiles also retain exact reference/canonical checksums and
zero teardown. Merged n1 wall/CPU milliseconds/RSS KiB:8/1 504.041/447.120/176812;
8/4 584.256/575.893/179112;512/1 684.894/627.374/254456;
512/4 751.145/814.531/255884. These are adoption checks, not a new paired n3
comparison. The earlier complete type-smoke and paired timing table retain their
b90-plus-b84 source boundary; ROOT owns final broader integrated gates.

Merged SHA256: runner
`2e9e7cb7a1686af9f966f932d532f8e4aa8ac15a24cfb3ea0037279dd2ac45b4`, profile
`30b58b4cc88b84f8747f202213a3dfc32431c1d62f250d6e90c59c7a814280a5`, semantics
`67ccb61220a59590eb54186b59775e870ce95db1c298da0e070e474b7ba62545`.
Expanded profile inputs manifest
`0bde1f6231880ad9c938f1c4ef3a0e6f0c2277239310f7cf24ac779a6316fbb3`;
fixture inputs manifest unchanged
`3e7f1ea00cb6df5bb699e734eca2d21be7f8e32413787b6113b64e7977ae4738`.
Exact commands/objects/statuses are in the same external receipt's `merged_*`
files. All owned jobs drained; old stashes/todo untouched. No runtime deployment.