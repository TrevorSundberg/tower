# Required Foundation captures: bounded native repair

A2, 2026-11-23. Published freeze `ba52a932731a099b10bd16b60c16cd6af35fbf12`,
tree `d0e478c22f1307701e7fbb15cbe1f01bb34b750a`, plus this batch. Production
changes are confined to `scaffolding/compiler/semantic_types.tower`.

## Source audit and frozen selection

`foundation_syntax.tower` defines the Core labels/captures as the semantic ABI.
Overrides activate normally; syntactically accepted input must still satisfy its
selected Foundation operation. The eight exact override sources, expected
messages and invocation markers live in the existing
`scaffolding/tests/malformed_call_checks.tower` table. They are separate from the
seven previously adopted Node cases; no Node or reactor build was run here.

| Rule / omitted capture | Actual consumer contract | Before native result | Final result |
| --- | --- | --- | --- |
| `CoreBinary.left` | `sem_expression_impl` requires left/op/right before creating the binary result | exact shape diagnostic | same |
| `CoreBinary.op` | same; operator capture cannot be inferred from the other operands | exact shape diagnostic | same |
| `CoreBinary.right` | same | exact shape diagnostic | same |
| `CoreTypeName.name` | bare name alternative requires its identifier; base-qualified alternatives are separate | **invalid success**, token `i32` resolved despite missing capture | `Malformed CoreTypeName tree: missing capture 'name'` |
| `CoreDeclare.name` on a type binding | `sem_type_binding_header` bypassed the ordinary declaration bind/name guard | **invalid success**, unnamed type binding registered | `Malformed CoreDeclare tree: missing capture 'name'` |
| `CoreParameter.type` | `sem_parameters` requires name/type before adding a parameter | exact shape diagnostic | same |
| `CoreDeclare.type` and `.value` both absent | `sem_declaration_type` permits either, requires at least one | `Variable 'value' requires a type annotation or an initializer` | same |
| `CoreReturn.value` in a non-void function | `sem_return_source` validates function type before operand-query admission | `A non-void function must return a value` | same |

The source audit also followed ordinary declaration binding, function signatures
(name/type/body; external body excluded), field name/type checks, return operand
collection, prepared type consumption, and constructor-query entry. Optional
function parameters, call arguments, bare void returns, typed uninitialized
declarations and inferred declarations retain their existing meaning. `CoreType`
has name/base alternatives and Tower's `decltype` extension; a base without count
denotes a pointer, so a blanket required-name/count rule would be wrong.
The compound/qualified-type and other shape consumers were inspected for these
contracts, not exhaustively runtime tested. Loop headers and their active L1
producer methods/fixtures are excluded; no handoff into another owner was needed.

## Reproduced cause and repair

The native baseline built only the changed regression entry point, reusing the
verified current production provider. Each of the eight cases ran in a separate
bounded process at target width 32 / worker 1. Six passed their exact diagnostic,
valid-override recovery and zero-world-grant checks. `type-name` and
`type-binding-name` returned no compilation error/resource error, so their
regression processes exited **1**. This was wrong acceptance, not a crash or a
resource failure. Preserved costs: 0.231230 wall / 0.163770 CPU s, 105,404 KiB and
0.232819 / 0.167736 s, 105,356 KiB respectively.

`sem_type_binding_header` now invokes the same `sem_shape(..., "name")` used by
ordinary declarations, before any type record/name registration. The new small
`sem_type_name_shape` checks only a bare `CoreTypeName` reached through the existing
name resolver. `sem_type` and `sem_type_call` call it before consuming prepared or
new types; this covers the ordinary and constructor-worker entry paths. The
existing editor-symbol path and base-qualified/non-name alternatives remain
unchanged. No new type registry, token spelling identity, fallback value, global
null guard, error relabeling or alternative compiler model is introduced.
Normal failures use the existing first-cause diagnostic/resource machinery.

## Checks and ownership

Command: `tower-lr-work-tests /work/scaffolding malformed-call shapes`. Named
selectors reproduce individual table entries; `all` in the main Tower runner
also registers the new shape table. The full main-runner suite was not run.

All **8 x 32/64-bit x workers 1/4 = 32 configurations** pass. Each checks:

- Exact ordinary diagnostic with resource cause None and original file/line/
  column via the public source map and explicit invocation marker.
- An earlier owned program executes42 before and after failure; the same world
  then accepts valid custom `leave`, `let` and `ptr` overrides and executes42.
  These preserve optional void-return values, call args, declaration alternatives
  and base-only pointer forms, including legal raw uninitialized storage.
- Three-unit failure batches expose no program **before** cancellation. The
  error/offset is deterministic across worker counts and survives cancellation;
  a separate early-cancelled batch drains and publishes nothing. Lane ownership
  returns before close. Configured worker counts do not prove measured overlap.
- After failed/recovered programs, module resources and grammar caches close,
  each explicit world has zero bytes, lanes and live grants and disposes its
  ledger. This is scoped world ownership, not a universal leak/race claim.

The first complete candidate passed (25.153 wall / 39.961 CPU s, 434,428 KiB).
After adding the explicit pre-cancellation publication assertion and main-runner
registration, only the fixture target rebuilt (8.861 / 5.914 s, 439,836 KiB).
Final shapes pass **25.580 / 40.809 s, 436,576 KiB**; final `query-smoke` passes
**4.245 / 5.835 s, 407,728 KiB**, retaining existing statement/first-cause,
dependency, staging and cleanup coverage. The production dependency-aware build
was 24.737 / 18.762 s, 1,073,484 KiB, three affected actions. No allocator injection,
sanitizer, broad type suite, full generation or browser matrix was performed.

## Small matched healthy profile

KinmenA Windows 11, existing Docker Linux x64/LLVM19 Release cache, CPU0-11,
24 GiB container cap, public pin `768a0cdf`, target `x86_64-pc-linux-gnu`, explicit
Bedrock/Foundation, Tower `--jobs 1`, build parallelism2, production allocator.
`frontend-storage-profile /work/scaffolding 8 WORKERS plain`, explicit 2 GiB
world budget; detailed observer disabled. Three paired fresh processes per
worker count/variant, warm caches, reversed order in pair2. All12 checked answer42,
source hash10240961210026777659, imported source9841053087281335157, canonical
14243253176332855356 /13,848bytes, and final zero bytes/lanes/live grants.

| Workers | Median wall s before -> after | Median CPU s before -> after | Median peak RSS KiB before -> after | Peak ledger bytes, unchanged |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0.497445 -> 0.493658 (-0.76%) | 0.441028 -> 0.436732 (-0.97%) | 176,744 -> 176,584 | 108,204,099 |
| 4 | 0.583832 -> 0.580621 (-0.55%) | 0.574536 -> 0.571354 (-0.55%) | 179,516 -> 179,152 | 108,153,811 |

Ledger metadata before disposal remains10,485,760B. No material regression is
demonstrated; this small sample is not an optimization/scaling claim. Four
workers remain slower on this small workload.

## Exact artifacts and limits

Logs/scripts/statuses/commands/depfile manifests and preserved baseline:
`C:\Sandbox\build\codex_ecs_20261122\A2\cache\logs\malformed_shapes_ba52a932`.
Scripts `baseline.sh`, `candidate.sh`, `checked.sh` preserve first failures and
use bounded processes with checked statuses. Input manifests contain79 fixture
and368 profile paths, verified after execution. Their SHA256 values:
`37895b324f2f39e85f1067ea541196a9affda920bbe0c9456e73e4531d7c5586` and
`0b33e0dc31f77bd7b6a56feadf165a84b7b9d675109e2b4dfefa57218a26389e`.

| Identity | SHA256 |
| --- | --- |
| Public compiler | `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138` |
| Changed `semantic_types.tower` | `7a66b335bc2a1deb2223251881032680e6d7e29ee77482a05383d95fc70eb335` |
| Final shape/query runner | `1c782f3d1e974f6684dc3f736d360172a0baa449196408ecb5f5b5a3e98c9eff` |
| Semantics object | `91759edc6be0bf85b892dd2a1e95a659c1a889ad6a92337c68c98006f4912d29` |
| Before profile | `9ea85ce2888223ff1191feda74b5da0b287c6eabbbd01a8cf4bfb43cb09a0cce` |
| After profile | `a146a8f0edad59c2e61e293c91dc1664ae57402f08ba4a8e7b9be8a3e797f7eb` |

This accepts the frozen eight-case selection and two demonstrated repairs, not
all possible user grammar shapes. Previously adopted malformed Node controls
remain D2's separate artifact evidence. ROOT owns joined reactor/release and
integrated instrumentation gates. The service-rejected instrumentation operation
was not retried. Three preserved stashes and `todo.txt` are untouched.

## Merged-source verification

Implementation `ee91c300` merged complete published `340989cf` as
`d4fc3225a6f00cac7dba686d6b3ac40aaa1a948b`, tree
`73e1e5c722c6223499304675bb5d316247d97b7e`, after the required ff-only pull
refused ordinary divergence. Own producer/fixture/registration blobs remained
identical. Incoming B1 grammar/cache and L2 formatter/reconstruction changes
really affect executed dependencies, so the 14 affected build actions were
refreshed once (44.223 wall /66.990 CPU s,1,073,348KiB).

All32 shapes pass again (19.729/29.044s,437,584KiB); query-smoke passes
(3.686/4.591s,415,056KiB). One existing RootCall lifecycle check additionally
passes exact42, serial/four-worker canonical equality at32/64 and serial
Foundation reconstruction (1.967/1.833s,223,584KiB). Two healthy profile checks
pass at workers1/4:0.464/0.407s,177,336KiB and0.536/0.521s,180,276KiB, with zero
bytes/lanes/live grants. Ledger peaks now107,430,664/107,378,560B. Their source
and imported-source hashes are unchanged; the newly published formatter
intentionally reduces canonical spelling to11,412bytes/hash13963953848021265584,
identical across workers. These checks validate that new boundary; they do not
replace or extend the earlier matched before/after comparison or attribute
upstream changes to this shape fix.

Merged runner SHA256 `1ad9e5c673533dd6cbe9bf48191bf33e4960a0bbc2fedc908686aecd99428fee`;
profile `736547c316002b00cb548cd41e7e0491f7449c201dd56d14731574db1327c59b`;
semantics object `594f54a98a4cc297b7115ef85d59ca3c4838200273885239a08471669186cf81`.
The checked79-entry fixture and368-entry profile manifests have SHA256
`df33d68c805af6739194eebbca001cc7137ff29664d8c4be14b2511ded3533bb` and
`3c5c9071dc2a46ae5142f5d079c06e6c2c3cab8bde8669cee1ff5544f1391cf5`.
`merged.sh` and all merged logs/statuses remain beside the initial receipts.
All processes drained; ROOT's runtime adoption and integrated gates remain open.
Final source publication raced docs-only ae1b75ec. Normal full-history merge
preserves D1's scoped grammar audit and L2's separate reconstructed-void-pointer
finding. All447 executed input hash entries and three own code/registration
hashes still match the tested d4fc3225 boundary. Reuse its evidence without
another runtime build; the new backend finding remains a separate owner gate.