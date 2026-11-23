# Independent Foundation type reconstruction: L1 native investigation

No current native formatter/type-binding defect was reproduced on published
`43fc7510c924217dde197a6c76543f80326aa0a2`. No production code, browser comparison,
or type-admission policy was changed. This does not declare D1's browser failures
fixed or establish the identity of the bytes used in that run.

## Exact inputs and results

`playground/tests/llvm-execution.test.mjs` reads
`scaffolding/tests/type_object_values.tower` and
`scaffolding/tests/computed_type_arguments.tower`, both with `import tower;`.
The latter also imports `library.vector`. Its LLVM request consumes
`tower.foundation(handle).source`, not the original Tower source. Both fixtures'
independent expected output is `0\n`.

The existing public-bootstrap native cache was already current: only documentation
separates its checked runtime source `3cb252c4` from `43fc7510`. Compiler SHA256:
`00d68588ffe71bb1b48bde3dac487784ad7dde3e96d92c946d7b63f4b6f4d412`.
Environment: Orchestral-Revng Ubuntu 24.04 Linux x64, LLVM19, CPU0-3 affinity,
`--jobs 1`, explicit current Bedrock/Foundation paths, warm existing cache.

For each fixture at wasm32 and wasm64 pointer profiles, separate CLI processes
passed original graph execution, canonical formatting, independent canonical graph
execution, byte-identical reformatting, raw/optimized Fast execution, raw/optimized
LLVM normalization and package encoding, package Foundation extraction, and
independent extracted-Foundation graph execution. All execution outputs are
exactly `0\n`. Both 64-bit canonical inputs also compile and execute as Linux x64
programs with that result. LLVM raw/optimized IR is retained for every package.
No Wasm executable/browser execution is claimed here.

Package profiles retain the existing contract: type objects use canonical profile
0 in both modes and widths; computed arguments use normalized profile2 and
optimized profile1. Type identity is not reconstructed from LLVM scalar indexes.
The previous accepted native source-session type-value check also exercises the
shared service's canonical-profile recheck; its unchanged inputs/evidence are
retained in `backend_acceptance_receipt.json`, not rerun as a broad backend suite.

| Canonical input | Bytes | SHA256 |
| --- | ---: | --- |
| type objects, 32/64 | 18019 | `c29e020f4f00f24392dfdc1d15a38a883c8bcb011db903cdbf4b980eae52d6ef` |
| computed arguments, 32 | 40332 | `fa944f53417a682a1e1b17209ada7ea56cf2992516329e1fd632b0dfa1eecdd3` |
| computed arguments, 64 | 40334 | `e74420d98276dcc28103898403f204eaec0771d70abfa01c17acb66ee160376c` |

The 52 baseline CLI/build/execution commands cost 39.00s wall, 36.24s CPU,
maximum child RSS614344KiB. These are validation costs, not a performance change
or concurrent aggregate memory measurement. No compiler rebuild was needed.

## Constructor and import boundary

The formatter emits `import foundation_syntax;`, full representation types,
named type declarations, nominal records and specialized function definitions.
It retains the ordinary prelude helpers, including value-position
`integer_type(width, 1)` inside `signed_integer`. In these exact canonical files,
the first such executed call begins at byte2624, line55 column44 for type objects,
and byte11908, line215 column44 for computed arguments. These coordinates are
observations of the hashed files, not constants in compiler/test code.

All four canonical inputs also recompile/reformat with a copied grammar-only
baseline. Their dependency files contain only the canonical file and the copies
of `bedrock.tower` and `foundation_syntax.tower`: no `types.tower`, `tower.tower`,
or vector module is needed. Named primitive declarations and generic instances
were preserved in the text; an ambient named-type registry is not required.
The CLI retains its usual fallback policy, so the recorded dependency files,
rather than an asserted filesystem sandbox, establish the consumed closure.

Source inspection identifies the relevant consumer gate:

- `semantic_values.sem_call` dispatches `sem_type_construct_value` before its
  sole ordinary `Unknown function '…'` failure path.
- `semantic_constructor_work` admits the existing Foundation representation
  operations and constructs `KTypeConstruct`; `semantic_types` supplies their
  representation contracts. This is existing behavior, not a new registry.
- These files, `format_foundation.tower`, `type_primitives.tower`,
  `foundation_syntax.tower`, `types.tower`, and `backend/source_session.tower`
  are byte-unchanged between `f7e764ab` and the investigated source.

Thus the reported exact ASCII `Unknown function 'integer_type'` is not explained
by a missing type declaration in the exported text. It is inconsistent with the
inspected constructor dispatch if that code executes as written. Actual Wasm
provider identity, input bytes and target-specific execution remain relevant;
native success does not rule out a Wasm compiler/runtime defect.

## Small capability discriminator for D2/ROOT

The retained `foundation_constructor_capability.tower` starts with this ordinary
Foundation body, followed by a type-value equality check printing `0`:

```tower
import foundation_syntax;
fn make_integer(width: address_type()): type_type() {
    var result: type_type() = integer_type(width, 1);
    return result;
}
var actual: type_type() = type_value(integer_type(32, 1));
var same: boolean_type() = actual == type_value(integer_type(32, 1));
var failures: integer_type(32, 1) = 0;
if same {} else { failures = 1; }
print(failures);
```

It passes current graph/Fast at both widths and, at 32 bits, the public predecessor
SHA256 `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`.
A second retained 32-bit probe calls the constructor after printing its width.
Current graph/Fast and the public predecessor print `32\n`, then exit1 with
`Type construction requires compile-stage capability`. They do not fail semantic
admission with an unknown function. The current checked-in pin therefore does
not lack this capability; an arbitrary older reactor remains a different input.

The extra negative control's graph/Fast diagnostic-byte comparison FAILED:
graph reports line4:5 and Fast line4:6 of `foundation_constructor_runtime.tower`.
Both retain the same effect and failure message. That one-column normalization
location difference is preserved separately; no assertion was weakened and no
error-location fix is claimed by this canonical-admission investigation.

The browser helper independently honors `TOWER_TEST_WASM` and
`TOWER_TEST_LLVM_WASM`; absent overrides it reads two separate build directories.
It explicitly mounts all `.tower` resources, including `foundation_syntax` and
`types`. A fixture's explicit language import alone cannot certify which reactor
bytes were loaded. Preserve both resolved paths/hashes, resource hashes, and the
exact formatted bytes when comparing D2's matching frozen f7 pair.

The existing JS assertion identifies the `llvm.compile(...emit:'foundation')`
request, but does not distinguish initial frontend admission from the service's
post-format frontend recheck. `source_session.tower` has both. In particular,
canonical type-value preservation can bypass LLVM import entirely. Do not infer
an LLVM-pass failure merely from that service's name. A fresh service instance
and its retained Foundation response can distinguish these stages without
weakening the result comparison; a reused instance may retain earlier text.

Actual D1 reactor hashes/subphase were not available in this investigation.
The browser artifact/resource versus target-runtime diagnosis remains D2/ROOT's
matching-pair check. No speculative producer change, browser test edit, fresh
generation, sanitizer campaign, bootstrap pin or deployment was performed.

## Reproduction and retained evidence

External lane: `C:\Sandbox\build\codex_ecs_20261122\L1`.
`foundation_type_baseline.sh` contains all exact independent CLI commands;
`logs/foundation_type_baseline` retains inputs, canonical text, packages, LLVM IR,
stdout/stderr, actual exit statuses and GNU time measurements.
`foundation_type_capabilities.sh` and its logs preserve the failed negative
diagnostic comparison; `foundation_type_remaining.sh` completes only the pending
positive 64-bit/public checks. `foundation_type_public_runtime.sh` records the
public predecessor's real executed-constructor diagnostic. Nothing overwrites
the previous backend acceptance or 541-boundary admission receipts.

For example, use `/root/.cache/tower/l1_ecs_native/towerc`, explicit
`--bedrock /mnt/c/Sandbox/tower-agent-1/scaffolding/bedrock.tower`
and `--foundation /mnt/c/Sandbox/tower-agent-1/scaffolding/foundation.tower`:
format a fixture with `--target wasm32-unknown-unknown --emit foundation -o FILE`,
then independently consume FILE with `--interpret`, `--interpret-fast`, or
`--emit bytecode --raw-ir RAW.ll --optimized-ir OPT.ll -o PACKAGE`.
`--no-optimize` selects the raw profile; repeat with wasm64 for the other width.
