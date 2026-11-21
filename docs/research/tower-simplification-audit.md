# Next simplification milestone

## After default initialization (2026-11-21)

Recommendation: **named-field struct initialization**, followed by aggregate
value/return semantics and then `result(T, E)` / `option(T)` propagation. This
extends the implemented in-place `default` initialization without making implicit
owning copies part of the first slice.

The inventory at `6fcad397a10797b879011755a838e8a9c916779f` covers 572 Tower files,
554 importing Tower directly. Production compiler/backend/host/library code has
227 consecutive field-assignment runs containing 972 assignments across 102
files. Of these, 39 runs / 189 assignments in 27 files immediately follow a typed
local declaration, optionally initialized with `default`. These are lexical
opportunities, not verified rewrite counts or promised line savings. There are
300 runs / 1,271 assignments when examples and tests are included.

Concrete construction sites include `SyntaxDiagnosticInput` in
`compiler/syntax_session_diagnostic.tower`, `SyntaxEmissionInput` in
`compiler/syntax_version_build.tower`, and `SemanticCallInference` in
`compiler/semantic_call_inference.tower`. Named fields would express each complete
construction in one operation and diagnose missing, repeated or unknown fields.
Allow omitted zero fields only through an explicit default policy. Preserve
written evaluation order, exact field types, one destination evaluation and
target layout; initially lower directly to existing Foundation storage and field
writes on the shared ECS entities. Query dependencies, worker-local scratch and
coordinator publication still follow the current compiler contracts.

Do not blindly convert the larger runs: `sem_body_save/restore` transfer borrowed
scope state and vector ownership, and `semantic_lowering_kernel` deliberately
copies a context then replaces worker-local scratch. CLI option defaults are
another initialization protocol, rather than evidence that arbitrary replacement
of live records is safe. Readable initializers may keep one line per field; the
benefit is less repeated destination/setup code and checked completeness, not
necessarily hundreds of removed physical lines.

Error propagation has a larger eventual reach: the supplemental lexical count
finds 1,087 single-return false/null guards in 162 production files, and 146 copy
calls containing sizeof. Those counts include legitimate absence, predicates,
partial storage and explicit ownership transfers. They are not counts of valid
`try` replacements or value copies. Stage 6 of the language plan correctly puts
aggregate construction/returns and move/drop rules before tagged result values
and propagation syntax. Method-call sugar would shorten spelling but would not
remove these construction and failure protocols.

The counts above were collected with the existing Python inventory and a
disposable supplemental scanner before the user's Tower-only tooling direction.
The supplemental scanner was removed. Future audit logic belongs in Tower;
existing `.tower` file I/O, byte buffers, vectors and compiler services already
support native audit tools. Missing standard-library convenience and a uniform
small-tool runner are tooling work, not a reason to add new Python/C++ logic.

## Follow-up after iteration (2026-11-20)

The new inventory at `c91bc8c` covers 538 Tower files (520 direct Tower importers).
It finds 506 sizeof-based zero fills, including 271 in production compiler,
backend, host and library code. There are also 275 field-assignment runs containing
1,173 assignments. These are opportunities, not a safe mechanical rewrite count.
The original expression/inference/iteration milestones below are now published.

The next bounded language feature is target-typed `default` initialization and
reset, plus explicit `default(Type)`. It removes repeated address/type/size
information using existing Foundation constants, conversions, address, sizeof and
fill operations. Complete struct/array storage is initialized in place, including
padding, with a single destination evaluation. It introduces no aggregate copies,
constructor calls, allocation or ownership transfer. This makes the safe portion
of the observed zero-fill boilerplate directly expressible without preempting the
stage-6 move/drop and named-field initializer contracts.

Audit complete typed destinations only. Keep allocation batches, raw byte ranges,
partial layouts, nonzero patterns, aliases with different byte extents and reset
helpers whose public contract intentionally describes bytes. Preserve explicit
library initialization when zero state does not establish its invariant. Validate
the successor/bootstrap before adoption and keep negative/ABI fixtures explicit.

Implemented and published the feature in `18ff584`, then published its complete
development bootstrap in `a68920b` before compiler adoption. The bounded audit
selects 202 replacements across 101 production files: 99 declaration/fill pairs,
51 allocation destinations and 52 resets. This removes 99 source lines and the
repeated byte-count/type spelling at every selected site. The two additional
sites since the initial 200-site inventory come from the merged Tower template
port. Existing library initialization and disposal order are preserved.

See [default initialization](../default-initialization.md) for the implemented
contract. Named-field construction, move/drop behavior and general aggregate
staging remain separate work; this milestone does not supply those contracts.

Baseline: `0987aa5c0d1577d00264f6498fbdfcd4b6a981bc`, 2026-11-20.

**Recommendation: finish adopting Tower expressions throughout the compiler;
then add inference of generic call arguments as the next language feature.**
Use that foundation for a typed, borrowed iterator protocol and `foreach`.
The largest immediate reduction comes from removing old expression scaffolding.
Generic inference removes repeated information from calls and advances the exact
resolution/type-value goals without requiring another grammar hierarchy.

This is an audit and implementation recommendation, not a shipped feature or an
applied source migration. No compiler, Foundation, Bedrock or todo.txt edits are
part of it.

## Reproduction and scope

```sh
python3 docs/research/audit_tower_simplification.py --revision 0987aa5 --output audit.json
```

The script is read-only. Without `--revision` it inventories the working tree.
It records candidate filenames, functions and line numbers. It scans all 397
tracked project-owned `.tower` files: 77,128 lines, with 379 direct Tower importers
containing 76,725 lines. The other 18 files include bootstrap grammar, forwarding
modules and grammar/negative fixtures; importing Tower into them is not a cleanup
recommendation. Third-party code, comments and quoted text do not contribute
executable patterns. Function-local use counts are lexical, with repeated local
declaration names excluded from single-use candidates; this is not full binding,
effect or liveness analysis.

The 18 other files were reviewed separately. `compiler/services.tower` forwards
imports without executable bodies. Three import fixtures inherit Tower through
their dependencies and contain a few simple return/test locals; adding direct
imports would change their import-coverage purpose. Keep the Foundation increment
replacement example, custom grammars and intentionally invalid programs intact.

Historical and working-tree totals agree at this baseline. Eight inventory
checks cover strings/comments, duplicate local names, overlapping categories,
Foundation-only input, extra index uses and multiple indexed storage bases.

## Measured opportunities

| Opportunity | Observed sites | Interpretation |
| --- | ---: | --- |
| Single-use condition local immediately followed by its `if` | 2,977 | Often becomes `if condition` or `if !condition`; retain names that explain a useful concept. |
| Single-use generated local (`stepN`, `returned_N`, `*_conditionN`) | 1,206 | 1,183 feed the next statement; evaluation order and literal typing still need checking. |
| Union of those local categories | **3,625** | Distinct candidate bindings, not 4,183 and not a guaranteed deleted-line count. |
| Guarded assignments to a boolean | 143 | Candidates for existing `&&=` / `||=` and larger short-circuit expressions. |
| Empty success branch followed by `else` | 41 | Candidates for existing `!`, often overlapping the condition-local category. |
| `vector_*`, `stack_*`, `queue_*` calls | **862** | Generic argument inference can remove repeated element types; most calls already occupy one line. |
| Counted loops with indexed uses | 400 | A broad iteration signal. |
| Loops whose body uses the counter only as an index | **316** | Still includes multiple arrays, nested scopes, mutation and external counter lifetimes. |
| Those loops using one syntactic storage base | 274 | An upper-bound starting set for borrowed iteration review. |
| Fresh zero-based header, one `data[i]` base and matching `length` bound | 58 | Narrow lexical shape only; calls and aliases can still invalidate storage. |
| Consecutive runs of at least three assignments to one receiver's fields | 190 runs / 766 assignments | Potential initializer ergonomics; does not prove fresh storage, complete initialization or ownership. |
| Zero-fill calls involving `sizeof` | 280 | Includes legitimate resets and raw storage operations, not just constructors. |

Do not add the rows: many overlap. These counts measure source opportunities, not
runtime speedups. Several thousand source lines are a reasonable investigation
target for the expression pass; only a reviewed, validated diff can establish
actual savings. Initializer fields often remain separate lines in readable code,
and `foreach` headers replace already compact `for` headers.

## First: adopt the expression language already implemented

Of the 3,625 candidate bindings, 3,345 are in production compiler/backend/host/
library code, 278 in tests and two in examples. The compiler accounts for 2,482;
the backend 487, host 251 and libraries 125. Good first batches are:

| File | Distinct local candidates |
| --- | ---: |
| `compiler/semantic_values.tower` | 230 |
| `compiler/semantic_types.tower` | 187 |
| `compiler/semantic_statements.tower` | 154 |
| `compiler/semantic_support.tower` | 129 |
| `compiler/completion.tower` | 88 |
| `compiler/frontend_modules.tower` | 79 |

For example, `sem_header` currently builds its opening shape check through
`step2`, `step4`, `step6`, `step7`, `step10`, `step11` and `step12`, with nested
branches. Existing Tower syntax can express that same ordered check as:

```tower
var external = sem_is(n, "CoreExternal");
if !sem_shape(c, n, "name") || !sem_shape(c, n, "type") ||
   (!external && !sem_shape(c, n, "body")) {
    return;
}
```

The existing pointer-return/member/index syntax also supports expressions such
as `sem_set_name(value, sem_type_name(c, t));` and
`semantic_type_equal(&sem_get(n).type, t)`. Neither requires new operators.
The existing statement `match`, named tags, `while`, `for`, `defer`, null access
and compound assignments should be used where their current contracts fit.

Perform this as reviewed subsystem migrations, or a Tower-written source refactor
over shared syntax/semantic entities. Use resolved bindings and the existing
formatter; the inventory scanner is deliberately not a rewrite engine. Preserve
type constraints, comments, provenance, effect order and scope. In particular:

- `var saved = read(); consume(change(), saved);` must not become
  `consume(change(), read());`, even though the local has one adjacent use.
- A call or load originally evaluated unconditionally must not move into the
  conditional side of `&&`, `||`, `??` or `?:`.
- Removing a typed temporary must preserve its numeric width/range constraints;
  inference must not silently change an integer literal's type.
- Address-taken locals, values kept across mutation and useful conceptual names
  may be intentional. Retain them when the proof or readability warrants it.

Validate representative semantics, affected module/interpreter/backend suites,
Foundation reconstruction and clean self-hosting builds. Source cleanup does not
imply that generated Foundation stops using explicit temporaries, or that LLVM
machine code necessarily becomes faster.

## Next language feature: infer generic arguments from typed operands

The current call checker in `semantic_values.tower` requires the full template
argument count and explicitly resolves compile-time arguments before calling
`generic_instantiate`. Completion already has generic views and bindings in
`semantic_generic_values.tower`; those are useful shared infrastructure, not proof
that runtime-call deduction already exists.

The first change should permit this proposed spelling:

```tower
var values: vector(i32);
vector_init(&values);
vector_push(&values, 42);
vector_dispose(&values);
```

Today the calls require `vector_init(i32, &values)`,
`vector_push(i32, &values, 42)` and `vector_dispose(i32, &values)`.
The vector's exact type already supplies the repeated `i32`. Keep explicit
arguments valid. Extend the existing call/type checking and specialization path
in Tower, producing the same ordinary typed Foundation calls. No new native
implementation, Foundation operation or call grammar is needed.

A probe using the published fb1ab1f9 bootstrap executes the explicit version and
prints `true`; omitting the type arguments fails at `vector_init` with
`Wrong argument count for template 'vector_init'`. This confirms that the proposed
deduction is not already supplied by local-variable/expression inference.

Initial eligibility should be precise: uniquely resolved generic functions,
type parameters constrained by actual operand types and recognized nominal
specialization provenance, with all constraints agreeing. Do not infer by parsing
display names, invert arbitrary type-producing programs, guess conversions, or
invent overload ranking. Unresolved/ambiguous parameters need explicit arguments;
compile-time values that cannot be deduced remain explicit. Typed peers must
constrain numeric literals under the existing literal rules.

Test explicit/inferred equivalence, aliases and nominal identity, conflicting
constraints, literal boundaries, completion, deterministic specialization and
Foundation text, both interpreters and LLVM. Then pin a validated successor
before migrating calls: an old compiler can parse the new calls but still reject
their arity. Bootstrap compatibility applies to checking changes as well as tokens.

## Following feature: borrowed collection iteration

The [language plan](../tower-language-plan.md) puts exact calls in stage 4 and a
typed iterator/initialization contract in stage 6. Notes in `todo.txt` near 1243
want static iterator adaptation without wrapper allocation; near 4581 they
explicitly discuss vector-growth invalidation. The later raw Foundation pointer
contract means those notes are not an implemented checked-borrow guarantee.

Implement one typed, statically resolved begin/next/element protocol over ordinary
Tower functions, then `foreach` over it. Evaluate the collection once. Specify
finite-view versus live-bound behavior, scalar/pointer copies versus explicit
aggregate borrows, owner lifetime, mutation/invalidation and early-exit cleanup.
Use existing scoped `defer` and Foundation control flow; no hidden allocation,
implicit owning copy, public iterator opcode or container-name special case.
Document what is enforced and what remains a caller contract.

Many loops intentionally grow worklists, drain queues, coordinate two arrays or
reuse an index afterward. Preserve their `for`/`while` behavior. This explains why
316 index-only bodies are not 316 guaranteed conversions. Generic inference and
exact protocol resolution make this a coherent collection feature rather than
separate parser cases for each container.

Named aggregate initialization and `result(T, E)` / `option(T)` are valuable later
work. Their construction, return, move/borrow/drop and failure contracts should
come from stage 6. The observed field assignments and error guards alone do not
justify implicit copies, default initialization or an ad hoc propagation operator.

## Expression adoption milestone (2026-11-20)

The first implementation pass against main `1e50000` removes 3,989 source lines
across 198 Tower modules. It folds immediate single-use condition bindings,
inverts empty success branches, adopts lazy boolean compounds, and simplifies
generated expression chains where evaluation order and typing are preserved.
The first six semantic compiler files received additional chain review.

The current inventory includes upstream's added Tower tests (409 files rather
than the original 397). It now reports 283 distinct expression-local candidates,
including six immediate condition locals, plus five guarded assignments. These
remaining signals include intentional saved values, address uses, explicit type
constraints and long expressions; the inventory is not a mandate to inline them.
Foundation-only examples and intentionally invalid fixtures remain unchanged.

The migration preserves numeric annotations unless the destination provides the
same bool constraint. It does not move unconditional work into lazy operands or
move initializers across calls/loads/writes. Removed argument temporaries cross
only reads of unescaped local values. A source-local editing aid was used for
these bounded shapes; it is not a new public refactoring or semantic API.

Validation and publication details are recorded in the ongoing project journal.

## Generic inference and borrowed traversal (2026-11-20)

Published inference removed 809 repeated type arguments from 92 production Tower
files. Explicit generic regression fixtures still exercise the original spelling.
Both call forms use the same exact specialization entities and ordinary calls.
The iteration pass removes two further nested-vector arguments, for 811 total.

The iteration audit reviewed 114 zero-based, index-only vector traversal shapes
across production Tower code. It selected 108 loops in 51 files, including parser,
semantic compiler, formatting, backend cleanup and the existing work scheduler's
read-only/state-field traversals. Selection requires stable container structure,
including calls within the body; freeing an element's separately owned payload
does not free the vector holding that element. Existing element bindings are
retained where possible, and aggregate updates use explicit pointer borrows.

Six candidates stay counted: module graph traversal with recursive reachability,
LR input/output that may alias, FIRST-set propagation whose destination may be
its input, two externally supplied driver argument destinations, and the executing
task list's removal/swap. Other loop shapes (live worklists, reusable indices,
parallel arrays and nonzero bounds) remain outside this mechanical candidate set.
This is a source audit, not proof of arbitrary alias safety or a speed claim.
The migration follows publication of the validated iteration bootstrap; validation
and final adoption counts are recorded in the journal.

Rebasing onto the new ECS query/worker pipeline preserves 107 conversions across
the same 51 files. The remaining selected loop was replaced upstream by a layout
kernel that coordinates field/output indices, so it stays counted. Parameter
traversal now belongs to the new body query; implicit foreach protocol construction
uses its structural coordinator path and generated locals use ECS declaration state.
