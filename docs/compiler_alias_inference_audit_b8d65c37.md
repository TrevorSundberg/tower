# D2 review: alias inference and module condition queries

Reviewed implementation `b78af3aa67000baf06e985f845733b788fa34a13` against
parent `22e15d5b8e459cd63417234cf2b8198a85dc283d`, as preserved in published
freeze `b8d65c37d9dd4ef691d700d0d0a52c81e01b593a`. Review checkout:
`e6be70d5e96f8ccb86a05d679f6fd4c75e8937cf`. The nine files below and the
immediate contracts inspected have identical bytes at the freeze and checkout.
This is independent source review, not a new execution or release receipt.

No concrete production defect was found in this scoped change. Two registration
limits remain below. L1's subsequent while/for header work is excluded, as is
the separately reported mutable comptime loop-header capture limitation; these
module `if` changes do not establish a fix for that limitation.

| Reviewed file | Git blob at b8 | Disposition |
| --- | --- | --- |
| `scaffolding/compiler/semantic_call_inference.tower` | `d10938faaaf490da8b6a04c4de3098114edcc7a1` | Unsupported inverse alias constraint stays unresolved; ordinary explicit instantiation remains available. |
| `scaffolding/compiler/semantic_declarations.tower` | `38f1b34bcdaa908fe0d73f2f7b4b3d87d58ce678` | Shared module expression carries expected type through existing owned query/pump. |
| `scaffolding/compiler/semantic_statements.tower` | `ec4d246f2ba80cfdf9453e215bf5b4341b5c80c6` | Module condition consumes prepared value once; both helper callers updated. A2 capture guards preserved. |
| `scaffolding/tests/alias_type_query_checks.tower` | `9d09f391fd1614b24ba41c8b3dbbf0476ff3c245` | Exact inference diagnostic, mapped first-call position, terminal receipt, no partial program; 32/64 bits and workers 1/4. |
| `scaffolding/tests/alias_type_query_controls.tower` | `44de09b8639a865d9b87b1a1d08e2ca8d516769d` | Explicit ordinary alias body, nominal identity, lexical condition, layout readiness, contextual bool and effect controls. |
| `scaffolding/tests/semantic_invalid/alias_condition_scalar.tower` | `4aaeea0df6db7f480823a89be9abb4d7ea6c9ae5` | Minimal scalar-condition rejection; manual native receipt, no registration in the reviewed gates. |
| `scaffolding/tests/lr_work_main.tower` | `8088d8c209ae68675a6b0db69d2bf6376a5bd96c` | Alias selector and all/type-smoke/type-errors inclusion preserved alongside malformed-call selector. |
| `cmake/TowerWorkTests.cmake` | `81853168163657a12fe2580e3f6bdfafecc859a4` | Adds two positive fixtures at workers 1/4, retains previous list; output regex is not an exact-output oracle. |
| `docs/generic-call-inference.md` | `a79b5b08c48826018169d49a88d0d1fe150b3587` | Correctly distinguishes straight-return inference from ordinary execution with explicit type arguments. |

## Ownership, readiness and effects

`sem_if_begin_value` first validates both captures. Only an unprepared module
condition (`current == program.root`, no declaration-subject collection, entity
stage or query-read context) enters `sem_module_expression`. Prepared worker/body
conditions retain their existing path. Both callers agree with its added
`expected_type`: module conditions supply bool; module call/discard statements
supply null. The returned node is reused by `condition ?? sem_operand(...)`;
successful preparation does not check or emit that operand again. `sem_operand`
still applies ordinary contextual typing, including `default` and scalar rejection.

The helper saves declaration subjects/isolation with deferred restoration, saves
the lexical scope, and registers the original source entity through
`sem_expression_add_result`. The continuation copies `SemanticBodyScope`, rather
than retaining a pointer to the helper's stack local. These scope references
remain owned by the compilation; worker scratch needed by continuations transfers
through `sem_declaration_error` before the restored lexical state is consumed.
No cross-world type registry, replacement AST, or new scheduler was introduced.

`sem_declaration_state_result` attaches the continuation using the root world's
component kind. Admission requests the declaration/expression and discovery
queries, records access claims and demands discovery before dispatch. Existing
preparation records actual type/signature/layout dependencies, keeps `call_index`
and checked/inference state on that continuation, then uses `work_suspend_access`
or `work_yield`. The module helper synchronously drives the **coordinator** pumps;
it does not recursively force completion inside a worker. Declaration and shared
query pumps run to no further progress before `sem_declaration_report` selects
the dependency failure or cycle diagnostic.

The inspected unchanged dispatch contract reserves tickets/stages/leases before
running kernels, snapshots contexts, and gives workers private diagnostics,
query reads and scratch. After dispatch joins, `sem_stage_wave` publishes or
discards stages before structural continuations; the input view is passed through
the existing hold/publish/discard/close boundary. Resource failure remains sticky
and cancels the graph. This review checks reuse of that contract, not universal
race freedom or a new memory-cap guarantee.

Module statements remain source ordered. Isolated producer diagnostics stay on
their owning declaration receipts until the requesting statement reports them;
the helper clears only transient generic-context error state on exit, not the
program/resource failure or owned receipt. The final b8 merge also retains A2's
missing-capture checks and `sem_ok` guard before module call-list replacement.

## Inference failure and declaration identity

`sem_infer_parameter` finds the actual enclosing function entity before matching
its type parameter. `sem_infer_match` resolves aliases through the lexical
type-function/template tables; nominal matching requires the actual generic
definition and specialization arguments. Straight-return substitutions retain
parameter entities and outer binding chains, not just a type's display name.

The changed `generic_type_result_read` call is a read-only syntax inspection.
Its errors describe bodies outside that invertible subset (including locals or
control flow); it neither executes a body nor reports allocation failures. Leaving
this constraint unresolved therefore does not suppress a resource failure or
invent a binding. `sem_infer_finish` still diagnoses the first missing parameter
at `inference.use`: `Cannot infer type argument 'T'; pass explicit type arguments`.
If another operand supplies the type, ordinary instantiation still checks the
body. Full explicit arguments bypass omission inference and preserve execution.

`sem_declaration_infer` publishes `inference_ready` only on success; kernel errors
retain their source offset on the producer. `sem_declaration_failure` follows
failed dependency receipts rather than replacing them with an unfinished-query
message. The negative fixture retains two `read(actual)` calls: its native check
derives the first location from the actual bytes, checks line/column and stable
semantic offset across profiles, then checks the same terminal result again.

## Evidence and registration limits

- **L1 native evidence, adopted as L1's receipt:** journal entries “original
  alias/type-body acceptance gates” and “L1 alias merged acceptance”, the latter
  at `2848983552272c754d122f0df3ff2de17a53bbef`. Short and generated 256-chain
  fixtures plus the new positive controls passed 32/64-bit, workers 1/4,
  Graph/canonical Fast, worker canonical equality and idempotent round trips.
  Exact inference failure was byte 146, line 5, column 11. Scalar-condition
  rejection retained its predecessor diagnostic and position 2:4. These runs
  were not repeated or independently executed by D2 in this review.
- **D2 execution evidence:** published `145b93db4e45d2b26e245b5c04a39381633a6331`,
  logs `build/d2_ecs/adopt_b8d65c37_08d209fa`, reactor source b8, mounted source
  `08d209fa6f357ba4c220f1e39673de0e7aef1151`. Portable SHA256
  `42fc1cf42ac296d3f17ae0300848a59d71e942d565fd8e75e4214c0b45e149b9`;
  LLVM `1c1b72fb9d0080d850ddd067476e6f8aeec1181ef06aac67cf4b2626b98b9c76`.
  Three alias/type-body registrations passed in each mode. Short: Graph/Fast
  canonical at 32/64, actual LLVM wasm32 source and matching canonical both
  output `0\n`. Generated 256-chain: Graph/Fast 32/64 and actual LLVM wasm32
  output `0\n`; that existing LLVM registration has no separate canonical run.
  Negative: required diagnostic phrase at 32/64 in both entry points; exact
  byte/line/column assertions belong to the native fixture above. This receipt
  does not execute the new `alias_type_query_controls` fixture in the browser.
- **Inputs retained:** short SHA256
  `8b2cf17a518ae80ec6294b703301756310abd744829af2e112a521d5b7185b72`,
  stress generator `bba0710135bc3615240fec55bf997ecf788c06e91d1e4eaf3e9ea294708618c8`,
  negative `7a0e0f543d287bb868cf0d96456c1cb6dffff49e293362c5574359860d3eb0a9`.
  `StressFieldDepth = 256` produces the same final module `sizeof(alias(u64))`
  condition behind the longer chain. Both short/long positives reach the newly
  prepared module condition, not merely an unrelated nominal declaration.
- **Registration review:** parent-to-implementation diff removes no relevant
  case or expected diagnostic. CMake adds four registrations (two inputs times
  workers 1/4), not a 32/64 matrix; the latter comes from the native receipts.
  Its `PASS_REGULAR_EXPRESSION "0"` checks a substring, not exact output. ROOT/D1
  should retain the exact Tower/Graph/Fast checks when adopting this coverage.
  `alias_condition_scalar` is not in the reviewed explicit CMake/runner/Node
  lists. The smallest missing automated negative is already that two-line
  Tower fixture (`import tower;` then `if 1 { print(123); }`); L1/D1 can register
  its existing rejection and position without changing the producer. No new
  failure or missing native execution is inferred from that registration gap.

Source review commands were bounded `git diff`, `git show`, `rg`, and reads of
the named paths and immediate query/operand/lexical contracts; SHA manifests
are retained in `build/d2_ecs/alias_review_b8d65c37`. No build, runtime sweep,
sanitizer or concurrency measurement was run. Runtime before/after profiling is
inapplicable to this documentation-only change. Requested workers do not prove
overlap. ROOT owns later joined-source, sanitizer and release acceptance; L1
owns the excluded loop-header/capture follow-up.

Publication reconciliation: merge `a391753c1eb448f967b1a383f0b49ca2add9ac40`
retains complete upstream `344139e9` history. That advance includes L1's later
loop-header batch. Three scoped paths now differ from b8: `semantic_statements`,
`lr_work_main` and `TowerWorkTests.cmake`; the other six still match the recorded
SHA manifest. The expected three nonmatching checks are retained in
`merged_sources_check.log` (exit 1). This audit remains at b8 and does not adopt,
reject or runtime-validate the newly merged headers/registrations or unrelated
backend/formatter changes. No additional tests were run on the advancing sources.

Follow-up implementation (D2, source `7890ebd7` plus the focused gate patch): both
registration gaps above are now closed. The existing alias selector includes the
scalar negative at 32/64 bits, workers 1/4; three positive CTest fixtures use an
exit-preserving exact-zero process boundary. The journal entry “close alias
scalar rejection and exact-zero CTest gaps” records the passing native cases and
actual rejection of Tower output `10` and `0` with exit 7. This supersedes only
those two coverage gaps; the original b8 source review and exclusions remain.
