# Next Tower feature: scoped counted loops

Baseline: `479962bc8ded95b64a2ff0cb8dbf6513bafb2f29`, 2026-11-20.
The audit includes every tracked `.tower` file, including compiler, backend,
runtime, libraries, examples and tests. It does not edit `todo.txt`.

Reproduce the inventory and conservative migration estimate:

```sh
python3 docs/research/audit_tower_loops.py --revision 479962b > audit.json
```

The script defaults to a read-only report. Without `--revision`, it audits the
working checkout. `--apply` performs the narrowly checked loop rewrites; review
the diff, format it and run compiler/bootstrap validation before publishing.

## Evidence and decision

There are 346 files / 70,556 lines, with 329 files directly importing Tower.
The other 17 contain no executable loops: they are bootstrap grammar, grammar
demonstrations, a forwarding module, import fixtures and negative fixtures.
Importing Tower into those files would not help this migration.

| Candidate | Observed opportunity | Decision |
| --- | --- | --- |
| Scoped `for` | 881 `loop` and 338 `while`; 842 end in a standalone local `++`/`--`, spread across 147 files | Largest immediately implementable and mechanically reviewable reduction: 515 conservative rewrites remove 1,804 lines |
| Collection `foreach` / borrowed spans | 654 of those loops index storage with the counter | Strong follow-up, but overlapping opportunity, not another 654 guaranteed rewrites; counters, changing lengths, raw pointer storage and ownership differ |
| Container call/type inference or receiver sugar | 743 `vector_*` calls | Useful reduction in repeated type/receiver arguments; needs exact generic/overload binding rules, with less demonstrated line reduction |
| Scoped cleanup / ownership | 994 free/dispose/destroy calls | Important correctness work, but calls are not necessarily redundant cleanup sites; ownership, transfer and early-exit contracts must precede implicit cleanup |

Counts are lexical indicators, not proofs of equivalence or estimates of runtime
speed. The audit excludes comments and strings and distinguishes field updates
from standalone local counter updates. The conservative rewrite handles a direct
while test, or one guard temporary followed by one break, plus a trailing update.
It skips continues, counter writes, reused guard temporaries, and scaffolding
comments that would otherwise be removed. A header declaration is moved into
loop scope only when it is adjacent, has no later use in its containing scope,
and the header/body contains no address operation. Module bindings remain at
module scope because other modules may use them. Existing counter bindings remain
outside the loop when needed afterward. Equality and dynamic-bound behavior stay
unchanged; the script does not silently replace every `!=` with `<`.

| Area | Files migrated | Loops | Lines removed |
| --- | ---: | ---: | ---: |
| Compiler | 60 | 311 | 1,285 |
| Backend | 16 | 49 | 248 |
| Host/runtime | 13 | 35 | 16 |
| Libraries | 4 | 13 | 31 |
| Tests | 29 | 106 | 223 |
| Examples | 1 | 1 | 1 |
| Total | 123 | 515 | 1,804 |

These are migration-only counts before canonical formatting and the new feature's
implementation, tests and documentation. Not every remaining loop should become
`for`: sentinels, queue draining, scanning with several advancement paths and
worklist mutation often have clearer explicit control flow.

## Relationship to the notes

`todo.txt` opens with familiar C control flow as a design goal, discusses static
iterator interfaces near line 1243, and specifically warns about vector growth
invalidating iterators near line 4581. Its `ForEach` grammar examples near line
8021, like `scaffolding/examples/foreach.tower`, demonstrate grammar extension;
they do not implement iteration semantics. The later raw-pointer contract in
AGENTS.md supersedes the old notes' implicit checked-pointer/exception sketches.

The [language plan](../tower-language-plan.md) stage 6 requires one typed iterator
protocol and explicit ownership/invalidation behavior before general `foreach`.
The journal's 2026-11-19 structured-control and collection entries deliberately
leave those open. Scoped `for` fits between those stages: it uses current locals,
pointers and collections without inventing a second container ABI or ownership
policy. A later `foreach` should evaluate its source once and define borrowing,
growth/mutation, invalidation and early-exit cleanup for vectors, spans and queues
through ordinary Tower operations on the shared nodes.

## Implementation and publication

`TowerFor` lives in `scaffolding/tower.tower`. Checking/lowering lives in Tower's
existing semantic control module, using ordinary Foundation blocks, locals,
branches, assignments and loops. Header and body scopes are separate. Tests cover
continue/break/return, nested loops, match arms, shadowing, comma and omitted
clauses, effects, pointer traversal, mutable bounds and generated-name hygiene.

The operator-capable published bootstrap builds the implementation before any
compiler source adopts `for`. Its validated successor and complete resources are
pinned in the repository before the migration. The migrated compiler must build
with no private `TOWER_BOOTSTRAP_COMPILER` override. See the ongoing journal for
commands, observed checks and publication results.
