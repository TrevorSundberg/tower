# L2 type and generic compiler audit

Status: implementation and acceptance work in progress. Reviewed source is
`6282238779034442e0578d76b921ca117df819f1`, unless a later receipt explicitly says
otherwise. This is a file audit, not a claim that the overall compiler is complete.

## Contracts and current architecture

Read the journal's **Remaining work after the type-value checkpoint**, type values,
computed arguments, numeric, module, generic-inference, compiler-services and
threading contracts. Production helper-body/capture readiness supersedes the older
handoff's missing-helper experiment. The next work follows that newer continuation.

Primary references reviewed: [Flecs systems](https://www.flecs.dev/flecs/Systems.html),
[storage traits](https://www.flecs.dev/flecs/ComponentTraits.html), and
[Burst aliasing](https://docs.unity3d.com/Packages/com.unity.burst@1.8/manual/aliasing.html).
Relevant principles are explicit read/write scheduling, deferred structural
publication, storage chosen for traversal/lifetime, and alias guarantees only when
proved. No borrowed implementation or unmeasured performance claim follows.

The following rows describe the complete files, including their error/cleanup
paths. Related units outside L2 ownership are reviewed as interfaces; changes need
their owner's coordination. Stable component payloads and dense pointer indexes
are not packed type payloads. The current type/generic records need stable addresses
across suspension; wholesale SoA conversion is not justified by this review.

| File under `scaffolding/` | Storage, world, scheduling and ownership finding | Disposition / evidence gap |
| --- | --- | --- |
| `types.tower` | Thirteen forwarding imports; declarations are ordinary module entities, no separate registry. Each import participates in grammar/module setup. | Consolidate with helpers; profile source/module overhead and preserve source-bound override. |
| `types/integer.tower` | Shared signed/unsigned constructors use explicit target-width inputs and structural constructor compatibility path. | Move unchanged behavior to prelude; executed local inputs remain separate unfinished work. |
| `types/i8.tower` | Ordinary signed 8-bit source binding through shared helper. No mutable worker state. | Consolidate; retain wrapping, signed minimum and exact conversion tests. |
| `types/u8.tower` | Ordinary unsigned 8-bit binding through shared helper. | Consolidate; preserve byte ABI/storage. |
| `types/i16.tower` | Ordinary signed 16-bit binding through shared helper. | Consolidate; preserve two-byte/unaligned behavior. |
| `types/u16.tower` | Ordinary unsigned 16-bit binding through shared helper. | Consolidate; preserve two-byte/unaligned behavior. |
| `types/i32.tower` | Ordinary signed 32-bit binding; existing tracked-source override proves representation follows source. | Move override to consolidated prelude without replacing other definitions. |
| `types/u32.tower` | Ordinary unsigned 32-bit binding through shared helper. | Consolidate; preserve exact typed arithmetic. |
| `types/i64.tower` | Ordinary signed 64-bit binding through shared helper. | Consolidate; preserve signed-minimum parsing/evaluation. |
| `types/u64.tower` | Ordinary unsigned 64-bit binding through shared helper. | Consolidate; preserve full unsigned range. |
| `types/f32.tower` | Source selects binary32 representation; strict arithmetic policy still compiler/runtime owned. | Consolidate; source policy migration is not yet implemented. |
| `types/f64.tower` | Source selects binary64 representation; literal default remains checker policy. | Consolidate; preserve negative zero/NaN/rounding contracts. |
| `types/bool.tower` | Ordinary boolean representation binding; no runtime storage. | Consolidate; protocol policy remains unfinished. |
| `types/void.tower` | Ordinary empty representation binding. | Consolidate; retain void parameter/field/array rejection. |
| `types/usize.tower` | Explicit target-address representation, independent of host width. | Consolidate; both pointer-width profiles required. |
| `compiler/type_primitives.tower` | Pure scalar-representation selection and canonical spellings; no world/global identity registry. Scalar tags are private execution contracts. | Preserve irreducible representation operations; named-language policy belongs in source. |
| `compiler/type_objects.tower` | Iterative owned-edge scan identifies metatype-containing programs; invocation-local vector interns descriptors by semantic equality. It never serializes addresses/index identity. | Audit transitive ABI/reconstruction consumers with owners. Linear interning needs measurement before optimization. |
| `compiler/semantic_types.tower` | Canonical aliases, nominal/array/function identities use shared Foundation entities. Type/constant indexes are compilation-owned linear vectors. Worker observations defer publication; array interning explicitly forbids a worker stage. Function signatures can be private structural equivalents. Legacy synchronous constructor/declaration fallback remains. | Measure scans; preserve ordered interner publication and nominal identity. Executed constructors and compatibility-path unification remain open. |
| `compiler/semantic_type_values.tower` | Argument queries attach to existing declaration entities. Ordinary interpreter evaluates nonliteral integer inputs; parent query waits, preserving lexical scope/current function. Pump runs evaluation/capture/body/executable producers. | Preserve untaken-dependency behavior; general representation construction needs shared suspension interface. |
| `compiler/semantic_constructor_work.tower` | Coordinator-owned receipts use Call/Clone/Alias/Execute/Ready phases on source/instance entities. Clone completion precedes nominal publication, which precedes fields; executed constructors clone checked expressions and wait on ordinary evaluation. Scope belongs to definition for instances and lexical owner for value queries. | Assigned to L2 after initial audit. Extend only with shared interpreter/evaluation agreement; retain failure receipts and recursive nominal layouts. |
| `compiler/generic_registry.tower` | Registry component belongs to root's store and owns component kinds by containment. Template/instance/origin payloads stay on actual nodes. Linked instance index is derived. Body-cost memoization is coordinator-only. Fixed arrays match current parameter bounds. | Measure locality/scan cost; no process-global state found. Existing reclamation and clone-budget tests are relevant but not yet rerun in this lane. |
| `compiler/generics.tower` | Coordinator publishes instance/header identity before recursive resolution. Explicit clone stack preserves deep trees; workers clone to their private stage, read canonical metadata, and retain provenance. Kind registration still chooses structural type constructors by body shape. | Inspect clone scratch allocator boundary; unify shape compatibility only with tested recursive identity/forward-header behavior. |
| `compiler/generic_body_types.tower` | Borrowed worker transport contains opaque context/entity/stage handles and private budget/result counters. Lifetime is provided by owner/pin and stage, not this record. | Keep typed ABI migration coordinated with dispatcher; do not claim the opaque record itself enforces leases. |
| `compiler/semantic_generic_body_work.tower` | Work component on each instance owns ticket/kernel/private stage. Registers layout/type-index reads and unique output write range before dispatch. Bounded clone budgets; shared dispatcher; holds stages before last view closes; publish/discard then finish. Dispose requires drained stages. | Validate actual overlap, failure draining and source-order diagnostics. A window/queue count is not speedup evidence. |
| `compiler/semantic_generic_info.tower` | Optional inspection components attach to original definitions/annotations; lexical tables are derived. Bounded traversal uses declaration identity; incomplete/error layouts are withheld. Single query owner mutates these components. | Retain serial per-document publication; independent documents already use exclusive worlds. Inspect error recovery with existing IDE fixtures. |
| `compiler/semantic_generic_values.tower` | Query-owned substitution views refer to existing declarations/trees. Shape cache accepts direct fixed nominal returns only. Concrete expression queries clone temporary trees, reuse ordinary checker, then release clone; no evaluator or authoritative alternate IR. | Bounded traversal may return unknown; do not present that as successful complete inference. Preserve nominal/generic hover fixtures. |

## Interface and packaging audit

`semantic_constructor_work.tower` (assigned to L2 by coordinator) owns Call/Clone/Alias/Execute/Ready receipts
and graph waits. `semantic_context`, declarations, expressions and evaluation pumps
are A1 interfaces. Executed representation constructors need L1 interpreter request
and result transport, retained evaluated arguments, and A1 coordinator publication.
An API proposal has been sent through lane coordination; implementation is pending.

`compiler_project_files.tower` explicitly scans `types/`, CMake copies its resource
glob, `build.mjs` enumerates it, and the packaging fixture copies it. Those callers
must move together before deletion. Browser recipe filters currently accept nested
type paths; keeping old recipe compatibility can be valid while new source packages
drop them. `bootstrap_package.tower` collects the complete adjacent `share` tree,
so use a clean build/package rather than preserving stale resources. The checked-in
predecessor package must remain intact until a complete successor is validated.

## Baseline and acceptance receipts

Host: WSL Orchestral-Revng, Linux 6.18.33.2 x86_64; 15.3 GiB WSL RAM and 4 GiB swap,
8 physical/16 logical host cores per lane assignment. Public pin executable SHA-256
`9653f8187a104ca84ab5d8601f336d7e1ed8200206544c70a81415018d623d02`;
default package verification passed, no bootstrap override. Filesystem C: about
128 GiB free; WSL about 931 GiB free. No sibling cache is used.

Before edits, `type_bindings`, `type_object_values`, and `computed_type_arguments`
each ran three fresh CLI processes with workers 1 and 4, explicit source Bedrock/
Foundation, `--interpret-fast --timings`. All 18 exit codes are zero and each output
is `0`. These observations are **rejected for acceptance measurements**: L1 reported
possible concurrent build overlap, and WSL subsequently removed `/tmp` before the
logs could be copied. Only tool-output fragments survive. Repeat to Windows-side
lane logs under the shared lock before edits. Fresh processes reuse OS filesystem
cache; no cold-cache claim. Allocation/retention counters and actual overlap are
not established by CLI timings. Full paired results and focused tests remain open.

The first shell-loop launch failed before compilation because WSL command transport
expanded loop variables, leaving an invalid `--jobs` argument. Logs `__.err` and
`__.time` were also lost with `/tmp`; the error text survives in tool output.
Explicit per-process arguments fixed the launch. It is not a passing sample.
All processes drained before releasing the local build lock.

No implementation, sanitizer, clean-successor, browser-generation or publication
acceptance is claimed by this initial audit. Remaining work stays active.

### Prelude candidate

The isolated repeat writes durable evidence to
`C:/Sandbox/build/codex_ecs_20261122/L2/logs/baseline`. All eighteen samples exit
zero with output zero. Median wall seconds for 1/4 workers respectively are:
type bindings 2.00/1.74, type objects 1.97/1.89, computed arguments 2.69/1.98.
There is visible run-to-run variation; report the samples and paired CPU/RSS
results before drawing performance conclusions. No allocation counter claim.

The candidate consolidates all fourteen scalar/helper modules into types.tower.
CMake, compiler-project collection, browser builtin packaging and its fixture now
use that file. Existing browser recipe filters still accept the old nested files
for compatibility with previously published compiler projects. The old bootstrap's
complete resource set remains untouched until a replacement is validated/pinned.

The source-bound i32 fixture now reads the full consolidated prelude, verifies a
unique declaration and edits only its width, preserving all other declarations.
Smallest-unit compilation passes using foundation_syntax as explicit grammar;
using foundation itself when types is the entry creates a self-import cycle and
is preserved as the failed first launch. The normal type_bindings consumer returns
zero. Native suites, after measurements and complete publication remain pending.

The clean default native build now passes all 51 steps with no private override,
two build jobs and persistent cache `/root/.cache/tower/l2_ecs_native`. Wall 94.14 s,
user 156.02 s, system 18.62 s, peak RSS 843848 KiB; this single build is a closure
observation, not a paired speedup claim. Executable SHA-256:
`37ca7ab55e4755d1158edc733277b7b7bcafc6e452e8711f41db5072dc2ffd67`.
The smallest changed test unit and both native runners compile. The full `types`
suite passes both engines, target widths, canonical reconstruction, workers
1/2/4/8, invalid inputs and the tracked-source i32 override. Smoke checks and
after profiles continue on the same frozen source; none of this is publication.

The isolated after run is complete: all eighteen samples exit zero with output
zero. Both `type-smoke` and `query-smoke` pass. Identical public executable,
fixture text, flags and target were used before/after; only source prelude
organization changed. Each cell is the median of three fresh processes, with
uncontrolled warm filesystem cache. CPU is user plus system; RSS is KiB.

| Fixture | Workers | Wall s before/after | CPU s before/after | Peak RSS before/after |
| --- | ---: | ---: | ---: | ---: |
| type_bindings | 1 | 2.00 / 1.69 | 1.65 / 1.62 | 174812 / 177836 |
| type_bindings | 4 | 1.74 / 1.50 | 1.76 / 1.80 | 192612 / 191788 |
| type_object_values | 1 | 1.97 / 1.73 | 1.66 / 1.67 | 174792 / 178012 |
| type_object_values | 4 | 1.89 / 1.49 | 1.92 / 1.77 | 193872 / 192704 |
| computed_type_arguments | 1 | 2.69 / 1.74 | 2.30 / 1.68 | 179456 / 178564 |
| computed_type_arguments | 4 | 1.98 / 1.49 | 2.03 / 1.77 | 198420 / 197720 |

Durable raw `.time`, `.out` and `.err` receipts are in lane `logs/baseline` and
`logs/after`. Wall time improves in this run, but baseline variance, cache and
host scheduling prevent attributing every difference to module consolidation.
Serial type bindings/objects retain roughly 3 MiB more peak process RSS; parallel
RSS falls slightly. This is small relative to the approximately 175 MiB process,
not evidence of a leak or proof of unchanged allocation. CLI timings expose no
allocation/retention or worker-idle counters; those measurements remain open.
The four-worker observation does not establish real overlap by itself.

## Type/operation policy ownership inventory

| Contract | Current authority and required continuation |
| --- | --- |
| Named primitive identity | Source `var Name: type` bindings; no ambient i32/f32 spelling registry. `sem_type_entity` interns resolved descriptors, excluding mutable alias producer payloads. |
| Primitive representation | Foundation constructors and `type_primitives` select private scalar tags. They are execution contracts, not complete source operator policies. |
| Nominal/structural identity | Actual struct/enum entities; structural array element/count and function signatures. Generic instance lookup uses definition plus canonical argument entities. |
| Layout/ABI | Explicit pointer width and shared semantic layout. `sem_header` rejects direct metatypes but transitive aggregate-pointer/callback rejection needs a completed-descriptor scan. A1 hook requested. Raw opaque casts cannot gain invented safety from this scan. |
| Literal defaults/construction | Checker still defaults integer/floating literals to signed32/binary64 and performs contextual exact-bit/range rules. Source policy protocol remains unfinished. |
| Operators/conversions | Semantic expression/value checking selects shared Foundation operations; strict machine semantics live in ordinary interpreter/runtime/lowering. Every named type still implicitly inherits representation policy. Full source protocol cannot be claimed. |
| Reflection/serialization | Foundation type descriptors and bound nominal entities, shared formatter; invocation-private indexes relocate through descriptors. No addresses/indexes in canonical text. |
| Executed construction | Existing integer argument and ordinary type-selection queries are real. General executed representation constructor requires agreed compiler-effect operation, invocation request, shared graph producer and canonical/backend contracts; proposal pending. |

No new type protocol is inferred from attribute spelling. Typed metadata must be
identified by its nominal binding and consumed explicitly. No fixed-vector/shader
feature or noalias guarantee is part of this work.

## Constructor/ABI candidate, pending integration validation

All four opcode/format/execution/backend owners agreed the explicit capability
contract. L1's reviewed `constructor_interpreter.patch` is integrated locally;
its smallest unit and synthetic request tests passed on L1, not the joined feature
here. A1's context/query/pipeline/ABI bridge and B1/B2 implementation are still
required. Do not interpret the following source audit as passing checks.

| Added or changed file | Candidate ownership/storage/scheduling audit | Evidence / open validation |
| --- | --- | --- |
| `compiler/semantic_type_execution.tower` | One stable ECS continuation per evaluation owner; WorkGraph key adds invocation sequence. Admission validates exact request address, ticket revision/profile/dispatch, target and world. Exclusive type-index publication and invocation range precede dispatch. Arrays wait on field/layout producers and retain one result across retries. No owned buffers: invocation owns error/result and root owns referenced entities until drain. Cancellation reports failure. | Smallest unit and joined build pass. Query smoke executes all receipt cases at both target widths. Array layout failure and inference-effect policy still need full source regression closure. |
| `compiler/semantic_constructor_types.tower` | A1's extracted single definition of the existing phase enum and constructor payload. Descriptor copies and borrowed definition/instance/syntax/argument/evaluation references keep their existing world/query owner. No new allocation, interning, scheduler or authoritative graph. | Reviewed all fields against the former in-module definition; v2 full link and query smoke pass. Constructor semantic tests remain open as described below. |
| `compiler/semantic_constructor_work.tower` | Value-position helper builds ordered ordinary operand edges and a metatype result; no worker interner. Immutable zero-argument representations remain references. Static compatibility path preserved. | Shared tags integrated; A1 call/admission wiring pending. |
| `compiler/semantic_type_values.tower` | Delegates cross-phase pumping to A1's one shared pipeline; retains existing argument continuations and owner scope. | Pending A1 pipeline source, then type/query smoke. |
| `compiler/type_objects.tower` | Pure ABI scan follows completed record/array/function descriptors, including pointer payloads. Iterative scratch/visited vectors are disposed; nominal cycles terminate. No second authoritative graph. | Smallest public-predecessor unit passes. Baseline accepts a foreign pointer to a record containing metatype, confirming the gap. Late A1 hook pending. |
| `tests/type_construction_execution.tower` | Ordinary source values exercise mutable locals, repeated constructor node executions, nested descriptor arguments, arrays/nominal identity, explicit stages and untaken invalid widths. | Corrected unsupported `i32*[3]` fixture spelling to existing nested constructors. Baseline now fails specifically on value-position integer_type; not a speed comparison. |
| `tests/type_execution_receipts.tower` | Real shared graph/components without parser overhead; stale revision/profile/dispatch/target, duplicate admission, changed sequence, repeated node results, semantic error delivery, cancellation and disposal at both target widths. No fake worker concurrency claim. | Draft, not compiled/run. |
| `tests/type_binding_checks.tower` | Extends existing graph/fast, canonical and 1/2/4/8-worker matrix; checks recursive ABI descriptors independently of declaration rejection and runtime capability after ordered effects. | Prelude-only version passed earlier; newly added constructor/ABI cases remain unvalidated. |

Baseline ABI experiment receipts: `L2/logs/abi_nested_baseline_retry.*`, exit zero,
1.61 s wall, 1.59 s user, 0.22 s system, 184708 KiB RSS. Initial BOM-bearing source
failed at 1:1; its `abi_nested_baseline.*` logs remain. Constructor baseline first
failed fixture parsing (`construction_baseline.*`); corrected retry fails with
`Unknown function 'integer_type'` at the actual executed call
(`construction_baseline_retry.*`). Neither failure is counted as a passing test.
Pure ABI helper compilation is recorded in `type_objects_unit.*`.

Optional known-value inference must not grant the compiler capability to ordinary
runtime construction and erase its required failure. A1 was asked to preserve
that distinction; the source tests include a constant-operand runtime case.
Publication, full public-bootstrap closure and actual sanitizer checks remain open.

## Joined production experiment and remaining dependency failure

The exact owner patches now supply the semantic pipeline/caller, formatter,
backend capability guard and bytecode semantic/cache versions 9/6. The correct
ABI link boundary exports the helper only from the interpreter implementation;
the semantic unit and independent ABI test use extern declarations. An initial
proposal to remove only the helper export was superseded after symbol inspection
showed every type-object export duplicated by an implementation import.

The latest receipt fixture compiles with the public predecessor (18.76 s wall,
15.70 s CPU, 729900 KiB RSS); the execution fixture with eight repeated
entity/component retention checks per width also compiles (3.34 s, 2.85 s,
223168 KiB). These are compilation observations, not runtime retention evidence.
Redundant default initialization immediately before verified full initialization
was removed from the receipt fixture. A1 owns analogous query-fixture changes
and the data-only semantic unit boundaries needed to keep the test closure within
the existing payload budget.

The production-only native build passes all 51 steps using the public pin,
without override: 89.07 s wall, 172.91 s CPU, 846964 KiB peak RSS, successor
`3b0810ab586b15fa8fe3c3475219655c899d21f4c4b62d11fbe411b2a6b8d73d`.
The build's timing is an observation, potentially overlapping the coordinator's
hosted browser verifier; it is not a speed comparison or passing test profile.

The new ordinary-call probe found that `generic_register` treated a direct
representation-return body as a static constructor, rejecting its ordinary call
even in an untaken branch. A first classification candidate fixes the minimal
probe (output 7), but is **not accepted**: the full fixture exposes a legacy
recursive `sem_declaration_type` failure while a type alias producer is suspended.
`print(sizeof(u8))` and a module alias to u8 pass; a function containing
`var r:type=u8; return r;`, used to produce another alias, fails with a false
u8 initializer cycle. This is routed to A1's body/query admission boundary.
Arbitrary wrapper chains and aliases, local type bindings, and recursive nominal
constructor identity are explicit regressions; a four-name classifier exception
alone cannot establish the ordinary function contract.

Before this production build, all 24 isolated comparison samples passed output
zero: type_bindings, type_object_values, computed_type_arguments and the larger
body_continuation, three samples each at one/four workers. The preserved compiler
is `37ca7ab55e4755d1158edc733277b7b7bcafc6e452e8711f41db5072dc2ffd67`.
Receipts in `L2/logs/constructor_before` ran 11:03:07-11:03:52 local time, before
the coordinator's disclosed browser verification starting 11:07:52. Equivalent
after measurements remain pending a corrected, validated successor.

## Refreshed unit boundary and independent regressions

A1's v2 data-module/query-unit split is integrated as one coordinated change.
The L2 receipt fixture now imports shared payloads and declaration-only APIs;
the producer exports its two entry points once. The public pin compiles the
fixture in 3.05 s wall / 2.62 s CPU / 203020 KiB RSS, and its only strong external
definition is `type_execution_receipt_tests`. This replaces the previous 18.76 s
/ 15.70 s / 729900 KiB closure observation without removing assertions. The full
linked fixture remains a required gate.

The unchanged nested-metatype foreign ABI probe now rejects with the precise
ABI diagnostic (expected exit 1), whereas the predecessor accepted it. The
joined executable used is still `3b0810ab...b8d73d`; newer A1/D2 source changes
are not attributed to that binary.

L1's supported inferred-generic/named-initializer call also crashes in that
joined executable. Batch GDB identifies `sem_lift_initialization+574`, the
dereference of `sem_get(field.binding).byte_offset`. The source and complete
diagnostic receipts are routed to A1's lowering/inference ownership. Replay
after a prior lowering cleared the binding is an investigation hypothesis.
The regression must be fixed and validated rather than hidden by a null check
or an explicit-generic workaround.

D2's native sanitizer build mode is present; valid whole-compiler workloads
remain pending. Per the latest user direction, deliberate invalid-memory and
intentional-race controls will not be repeated. Existing sensitivity receipts
are retained and are not clean-production evidence.

The new joined native executable
`0d5b242318f196f72d2003b3ebfa4abfddf18d73774953b49f7b3c7eeb7d9428`
builds from the public pin in 52 steps (105.55 s wall / 165.38 s CPU /
796204 KiB RSS), followed by five runner steps. Its query smoke passes the
serial/threaded 32/64-bit matrix, including all constructor receipt assertions.
The broader type suites remain failing: ordinary nominal-wrapper calls are
rejected in value position, and `sizeof(signed_word(16))` lacks ordinary-call
query preparation. The four-name classifier has been replaced by CoreCall shape
classification, preserving static function signatures; it is not accepted until
those compatibility cases pass. Full logs and frozen input hashes are retained
under `L2/joined_v2_*` and `L2/logs/joined_v2_*`.

A1's root-call demand fix and the shared work-budget/world/dispatcher handoffs
were applied only after that run drained. They are newer than the measured
executable. Actual grant adoption by the generic clone caller and a coherent
rebuild are pending; no budget enforcement or speedup is claimed from merely
importing these interfaces.

## Shared budget integration and current gates

The generic clone caller now reserves extra lanes from the world-owned budget
for each wave, passes the grant to the common admitted dispatcher, and releases
it after stage hold, view close, ordered publication/discard and ticket finish.
The existing clone-node limit remains; the zero-byte worker receipt does not
account for retained clone storage. The smallest unit passes with the public pin
(19.44 s wall / 16.41 s CPU / 726672 KiB RSS). A1's helper resets fresh receipt
storage before reading it and imports the shared data-only budget definitions.

The complete B2 v2 unit-service/driver handoff, B1 parser admission and updated
formatter fixtures, A2 shared dispatcher projection, and A1 initializer reuse
and semantic-world test boundary are integrated for the next coherent build.
These owner handoffs are implementation inputs, not passing runtime evidence.
The outer-unit default accounts for selected retained buffers, not process RSS
or every parser/LLVM allocation. Remaining semantic callers and ordinary type
query compatibility still require A1's coordinated changes.

The inferred initializer crash is now traced more specifically: inference checks
the explicit initializer before the concrete parameter check repeats it; the
second check appends the same field entities, and lowering clears their bindings
on the first visit. A1's reuse guard preserves checked fields/effects and still
checks the later expected type. Joined runtime validation is pending.

The linked constructor receipt tests passed in the prior query-smoke result;
the earlier statement that they awaited linking is superseded. Full source
construction, repeated compile/close retention, joined sanitizer and publication
gates remain open. The static function-signature exception in CoreCall
classification is also a known compatibility gap for ordinary helpers named
`function`; it must not be presented as general binding resolution.

## Identity and readiness join

The final classifier removes the function-spelling exception. A shared semantic
predicate resolves ordinary functions, templates and value callees before static
signature identities; A1's declaration/body consumers use that predicate. The
public-pin joined compiler is
`c7b8a53dcbc700d3270a24430e7ae188ac8cd1464cccad09e5e8e708e4a0e144`.
Its 12 native build steps pass in 63.27 s wall / 92.37 s CPU / 784148 KiB RSS;
four runner steps pass in 10.54 s / 11.77 s / 317416 KiB. The exact consolidated
resource copy is independently checked with `diff -qr` before execution.

Query smoke passes, a function returning local `u8` prints 1, and an ordinary
function named `function` prints the expected sizeof 4. The unit-service suite
passes with bounded source inputs and the current payload layouts. Type smoke
reaches an obsolete diagnostic expectation: mutually recursive ordinary helper
calls now hit the interpreter's call-stack limit, while its old oracle expects
a graph cycle. Direct jobs 1/4 runs reject with byte-identical diagnostics and
do not expose the later unrelated error. D1 owns the narrow oracle correction;
genuine declaration/capture cycle coverage must remain.

The full constructor fixture still fails on its local explicit `comptime` type
binding, through a whole-body dependency edge. A1 owns the required-stage pipeline
correction; the fixture remains unchanged. This is not type-suite acceptance.
Final retention, paired current-input performance, sanitizer, bootstrap pin and
publication gates remain open. Logs use the `identity_readiness` prefix in the
external L2 evidence directory.

## Full type gate and scalar reachability follow-up

With A1's required-stage continuation fix, compiler
`f0d2921995f9d580e43befee602127795f3336d6c5b462ab314d7d5c3ced7447`
passes the unchanged full constructor fixture, query smoke and the complete type
suite. The type suite takes 44.14 s wall / 52.03 s CPU / 395872 KiB RSS on an
exactly copied Linux resource tree. Both engines, target widths 4/8, canonical
round trips and worker counts 1/2/4/8 pass. Eight repeated compile/run/close
cycles per width return to the same entity and component counts. Source-bound
prelude overrides, nested ABI rejection, operand effects, runtime capabilities,
malformed constructors and callable shadowing all pass. This supersedes the
earlier open constructor-fixture gate for this precise source snapshot.

A separate scalar output regression remains: imported ordinary type helpers
were treated as runtime roots even when unused. L1's shared Foundation root and
reference predicates now define the policy for both source emitters and L2's
`type_object_program`. The latter retains its disposable owned-edge traversal
and adds only a function visited index for recursive calls. It neither prunes
canonical entities nor ignores reached opaque type values. The smallest unit
and six-case/two-target canonical-preservation harness compile; joined runtime
and performance evidence for this follow-up are pending.

The newest matching required/optional input-role ABI and executable-lowering
receipt handoffs are integrated after the passing freeze. They require fresh
dependent objects and do not inherit f0d292's acceptance. Early-capture failures,
source-emitter validation prerequisites, final sanitizer/stress checks, equivalent
paired profiles and the public bootstrap/deployment remain open.

## Merged reachability and input-role receipt

Compiler `0b6c90cb340929368b5fa8a3b2db878b57b2e71ae12450fb08780d8362266ae2`
now passes source rejection/reachability, the complete type suite, query/control
smoke and full semantics on a fresh exact resource copy. This includes the paired
required/optional producer ABI, executable lowering receipt and all complete L1
fixture prerequisites. The full type suite takes 44.36 s wall / 52.47 s CPU /
426188 KiB RSS; its zero-retention and worker/engine/target checks still pass.
Full semantics includes the previously failing independent-world execution case.

The six-case harness had one incorrect new oracle: an unused local type binding
is erased before runtime. Canonical output independently confirms this. Seven
corrected cases retain it as a negative and use actual returned/callback/exported
type values as positives. Both target widths pass with complete canonical text
unchanged. The production consumer did not change to accommodate the failed test.
Current owner handoff is `L2_runtime_reachability_validated.patch` (c92f7a67).

The function visited vector remains quadratic in reachable function count;
large actual-function measurement is still required before any scaling claim.
Final equivalent performance, supported sanitizer/stress, bootstrap pin and
integrated browser/publication evidence remain open. D1's narrow recursion oracle
is adopted after the passing freeze and awaits its own type-smoke execution.

## Frozen performance receipt and profile file audit

The source snapshot is now local commit 649a1c1219e0010b7788f1a44d8f20c585329c94.
D1's narrow recursion oracle subsequently passes type smoke (40.64 s wall /
45.42 s CPU / 252616 KiB). The editor-import correction exposes another actual
body-worker abort on L1's newer snapshot; editor acceptance stays open.

| New owned file | Storage, scheduling and ownership review | Evidence |
| --- | --- | --- |
| tests/type_reachability_profile.tower | Reuses execution sessions, shared type-object predicate and canonical formatter. Generated programs own their normal checked graphs; timed queries stay serial and read-only. Invocation-local source/report buffers and format results close lexically; execution_close_checked verifies request ownership. Linux x64 rusage is an explicit measurement ABI. No new graph, allocator, scheduler or all/CTest work is added. | Public-pin smallest unit passes; exact helper 05a442e passes all 16/256/1000-function output/canonical/count/close checks. Three warmed samples of 256 queries per size. |

At 16/256/1000 functions, median query wall time is 11.233/318.443/2906.145 us.
This confirms quadratic function-vector cost. Retain the small implementation at
the measured sizes; no constant-time or scalable-throughput claim is made.
All samples retain the same entity/component counts. Peak RSS includes the
checked source programs; transient allocation counts are not measured.

Four balanced before/after pairs per fixture/worker setting compare preserved
compiler 37ca7a with 0b6c90, identical complete adjacent resources, explicit
frozen grammar/source inputs and warm filesystem caches. All 80 processes
(including 16 warmups) exit zero and print the exact expected zero. Serial
binding/computed medians rise about 2.5-3%; large-body/runtime-type medians change
by under 1%. Current four-worker medians improve 1.12-1.20x over current serial
with roughly 4-7% extra CPU and 11-12% additional RSS. Maximum median RSS increase
versus the older compiler is about 2.8%. The journal records every wall/CPU/RSS
median and raw evidence paths. These integrated measurements do not isolate a
single handler or prove per-phase overlap.

The newer A1 source-root/capture-range successor is outside this frozen receipt.
Its coherent validation, supported positive sanitizer/stress checks, clean public
bootstrap, browser release and leased atomic publication remain required.

## Positive address instrumentation receipt

Frozen source 6aa8ffb (production 649a1c1) builds through the public pin with
TOWER_SANITIZER=address in a fresh own cache. Actual Tower IR/object hooks and
final compiler/runner ASan links are inspected, beyond the configured manifest.
With leak detection enabled, executed constructors, source-rejection/reachability,
query smoke and complete types all pass. The full type suite takes 410.87 s wall /
492.78 s CPU / 1033672 KiB RSS and retains target-width, canonical, 1/2/4/8-worker
and zero-retention checks. Three production pool runs also pass barrier-confirmed
overlap/allocation and early-return worker drains. The standalone instrumented
compiler passes four-worker fast type_object_values with exact stdout zero.
Hashes, commands, outputs and complete timings are in the journal and
L2/logs/sanitizer_address_*. No sanitizer finding or leak is reported.

This covers the frozen type/generic implementation, not the newer unmerged
capture/source-root/editor/backend candidates. TSan, final coherent ownership
checks and bootstrap/browser/publication remain open. Third-party LLVM and
subsequently generated target programs are outside this instrumentation receipt;
source-language UBSan/browser coverage is unsupported. No intentional fault/race
probes were rerun. Counts and passing checks do not prove universal safety.

## Joined capture v3 integration boundary

After the passing frozen ASan checkpoint, reviewed A1 capture/source-root/editor
and B2 native path/backend root changes are integrated with their exact owner
fixtures and explicit D1/D2 repairs. Public-pin smallest units, native compiler and
runners pass. The original known_bindings source and source-proof query smoke pass.
However, full known still fails an unchanged address-observation capability oracle
(actual standalone output 32), and the lifecycle gate rejects valid global/local
aggregate captures at 1:125/1:138. Two separately authorized rejection-message
expectations are corrected only after independent source reproductions; all pointer,
cycle and aggregate contracts remain intact. The journal records exact identities,
raw outcomes and timings. This coherent local checkpoint is a shared debugging base,
not a new sanitizer or release acceptance receipt. Final gates and publication stay
open while A1/L1 investigate the interpreter/producer boundary.

## Reviewed type presentation integration

The B2-owned language_generics/language_components follow-up shares constructor
descriptions between dependent previews and checked KTypeConstruct operations.
Checked presentation uses the actual operation kind, without a new spelling
registry, type identity or graph. The existing generic-preview binding rules are
preserved. Array count wording permits ordinary evaluated arguments. Focused
editor tests retain exact token/function-kind assertions and pass after the
public-pin rebuild: 14.71 s wall / 14.92 s CPU / 258300 KiB RSS. The journal records
source boundaries and binary hashes. No paired speedup is claimed from this
correctness repair; earlier failed and newer owner timings are not equivalent
successful inputs.

The concurrent registry/provider repair compiles, but the storage runner fails
earlier at the unchanged Session reset parses assertion. GDB and an unbuffered
retry identify seed-only print fixtures in compiler_storage_tests; D1/B1 own the
repair. The registry case is unrun in this process, not passed. Final integrated
capture correctness, instrumentation, bootstrap and publication remain open.

## Independent aggregate/type integration receipt

The complete shared projection ABI, required-capture relocation policy and
invocation-private snapshot storage now pass L2's independent public-pin build
and runtime checks. Type and function leaves retain canonical bindings and are
rematerialized in each consumer; no private numeric identity is transported.
Consumer disposal precedes release of every producer projection vector. Frame
cleanup, immutable scalar/copy/fill checks and cancellation pass query smoke.

Original global/local aggregate examples and three separate nominal-type,
callback and nested-array/null-pointer inputs pass at workers1/4. The combined
fixture passes both engines at workers1/4. The complete type suite passes in
44.17 s wall /52.26 s CPU /384848 KiB RSS; full42-case lifecycle/type smoke passes
in264.72 s /294.14 s /256420 KiB, preserving both widths, serial/worker canonical
equivalence, address/effect policy and failure/cycle cases. Whole storage and
three real-worker stage stress runs also pass their exact ownership/teardown
checks. The journal records compilerba48c54f, all source boundaries and raw logs.

Later focused-harness/profile portability edits are outside this frozen receipt.
Known-suite precise-message updates, final paired performance, actual updated
ASan/TSan, public-bootstrap closure and leased publication remain required.

## Portable profile and strengthened harness receipt

The Linux x64 measurement ABI now belongs only to an opt-in standalone target.
The profile still uses the same production predicate, ordinary execution session,
canonical formatter, independent output and zero-retention assertions. Its main
owns the driver request, syntax diagnostics and path buffer with lexical cleanup.
The existing native execution link closure is reused; no second runtime or new
portable foreign dependency is introduced. Actual normal execution Tower object
symbols exclude getrusage; the standalone object imports it. Smallest public-pin
compilation, runner links and all nine profile samples pass. Current1000-function
query time is approximately3.542ms; the earlier2.9ms measurement is not a matched
comparison. L1 owns balanced attribution before any regression conclusion.

Focused query/parser/aggregate/capture-policy checks pass on independent compiler
596e, execution1d94 and LR7097, exactly matching L1 artifact hashes. Whole empty
aggregate projections, exact immutable write diagnostics, target widths4/8,
worker1/2/4/8 canonical equivalence and full measured trace-failure prefix coverage
are included. The prior f6 complete type/full42 receipts retain their source
boundaries; no unnecessary full rerun substitutes for the focused additions.

The exact browser alias case remains a generic-inference error, not a newly
supported arbitrary alias inversion. Initialized immutable capture is accepted
and independently observed as7,7; aggregate operator and nominal copy errors are
preserved. The strengthened forward-read source exposes graph/normalized-fast
output differences in both older/current packages, but reads raw uninitialized
storage. Foundation explicitly excludes that operation from portable differential
results. Initial stronger defect attribution is withdrawn; direct-cache and
defined-order controls remain under owner review. No zero-initialization policy,
oracle weakening or final known-suite acceptance follows. The journal preserves
all failed comparisons and exact checked evidence. Updated ownership sanitizers,
public-bootstrap closure and leased publication remain outstanding.

## Profile attribution and private-storage follow-up

Exact old/current predicate machine-instruction sequences match after relocation
address normalization. An isolated former wrapper compiled against current shared
layouts and linked against the exact same production object closure does not
reproduce the earlier22% standalone penalty: whole-wall medians4.35/4.36s and
1000-function query medians3.537/3.456ms. An object-order-only control also fails
to support the proposed alignment fix. Preserve the original measured difference
and substantial variability; no code-padding, algorithm rewrite or generalized
speedup claim follows. The journal contains all controlled identities and limits.

The fully initialized order/effect control independently prints1,1,7 through graph,
optimized/no-opt normalized fast and native paths at the recorded widths/workers.
The raw uninitialized case remains outside portable defined-result comparison;
strict compile-time before-initialization rejection remains mandatory.

L1 query measurement741b passes independently with exact compilerd1cda8ec/LR5312e6e6
artifact identity. Small8-byte and large65536-byte layouts retain bounded private
frame snapshots, preserve captured scalar bytes and release every
measured owned vector. Counts are per-invocation capacities, not whole-heap or
concurrency proof. Proposed physical budget owners in shared semantic/interpreter
layouts still require joint API validation, coherent build and final instrumentation.
No new production type/generic code is introduced by these harness follow-ups.

## Generic frame scratch follow-up at9eb01c3 (proposed)

Reaudit generics.tower, generic_body_types.tower, generic_registry.tower,
semantic_generic_body_work.tower and the public clone callers. Ordered clone
frames are private transient scratch; one stack per body job removes the current
per-child allocation lifecycle. The existing stage, node quota, work ticket and
provenance contracts stay unchanged. Body/header failure consumers can propagate
a denied physical grant, but frontend_modules module_clone still treats a null
synchronous clone as fatal. That boundary needs its owner's fallible diagnostic
repair before world caps can be imposed. Optional generic expression inspection
already records null as truncated. No typed descriptor alone proves payload
packing or whole-compilation memory accounting.

The new tests/generic_clone_storage.tower uses real registry/kernel entry points
without copying GenericContext layout. Wide/deep syntax, exact definition/use
identity, insufficient node limits and single-owner allocation failures cover the
intended change; its initial draft is unbuilt. Production-worker transport and
before/after measurements remain separate required evidence. Root approved the
slice and coordination requests cover the two-field shared request addition and
two-line existing storage-runner hook. The journal records the frozen before
package and discovered module failure-propagation gap.

The baseline fixture now passes smallest public-pin compilation and three complete
serial storage runs. Exact shape/provenance and failed-stage teardown pass;
wide256x1 measures1038 total kernel allocation calls and deep1x600 measures2434.
Four one/eight-specialization CLI runs at workers1/4 match the independent loop
reference. Earlier import/opaque-interface fixture errors are preserved in the
journal. Production clone code remains unchanged; this is the before receipt.

## First clone stack implementation receipt

A private typed WorkVector now survives sibling branches, while each branch keeps
its ordered source/destination/index state and clears length on return. Physical
stack storage borrows the frozen root budget and returns a fixed resource error;
coordinator stage/ticket order is unchanged. Wide256node kernel allocation count
falls1038 to783; deep600 remains2434. Bound peaks416/36928 bytes include replacement
overlap. Exact denied growth, allocation failure, partial counts, no publication
and zero retained grants pass serial storage. Public-pin coherent compiler37db,
query smoke and complete type suite pass. Thirty-two paired reference-output runs
and eight canonical comparisons pass, with small/noisy end-to-end differences
recorded in the journal. These are scoped measurements, not all-core proof.

The shared data-only WorkBuffer/WorkVector definitions and four library fixtures
match A2v5 after newline normalization; the only host addition is the established
B2 allocation-size/alignment contract. No nominal type, interpreter result or
Foundation storage identity changes. The public synchronous clone helper remains
explicitly outside the first cap pending fallible module-cache propagation;
root requires closing this before acceptance. Real clone-worker overlap/cancel,
merged resource-error handling, supported compiler instrumentation and leased
public-bootstrap/deployment closure remain active work.

The added generic_clone_fixture.tower owns only synthetic input construction and
shared exact provenance checks around real production APIs. generic_clone_parallel
uses one explicit world, frozen shared byte/lane ledger, private stages and real
production allocator/worker transport. Three runs confirm distinct native threads
with overlapping kernel intervals,1/2/4lane results, all-output cancellation,
failed-peer cleanup, stale-ticket rejection and zero final grants. The extracted
serial fixture preserves783/2434 allocation counts and denial assertions. The
compiler hash remains37db021e; these test additions need final instrumented stress,
not another relabeled compiler-performance claim. Their native POSIX clock uses
the existing runner's nominal ABI; no portable execution dependency is added.

## Public clone caller closure under review

At64af7bf, re-audit generics, semantic_generic_info and semantic_generic_values
against every public clone caller. Module snapshot/cache construction asserts on
failure; optional inspection currently truncates and later clears checking errors.
The owned draft adds a world-derived budget and typed clone result, preserves the
old ABI wrapper, initializes GenericAnalysis completely, and stops recursive
inspection on latched resource failure. No new AST, registry or scheduler appears.
The query root owns the disposable inspection component even on null return.

B2 owns language_query null rejection and module/cache transaction rollback, D2
the existing allowlist. Those changes must join before bounded service acceptance.
The serial storage fixture now specifies exact public-clone output/metadata,
distinct node/resource failures and partial-output/frame/world cleanup. These
draft tests remain unbuilt. A complete37db/64af before package is preserved for
equivalent measurements; final current sanitizer and public pin closure remain
required, with retained entity payloads and other uncapped allocations explicitly
outside this frame-storage measurement.

## Current owned-file review at64af7bf plus public-clone draft

The initial table above is historical. This table reconciles every currently
tracked production file in the assigned type/generic families with the later
implementation and evidence. The removed fourteen types/ files remain covered
by the consolidation history and source-bound prelude test. No new production
file in these families is omitted. Release acceptance still requires the merged
source identity and complete public package.

| Current file under scaffolding/ | Current storage, ownership and scheduling disposition | Evidence and remaining boundary |
| --- | --- | --- |
| types.tower | Ordinary consolidated primitive bindings and helpers; file imports retain module identity, with no ambient type-name registry. | Complete types and source-bound i32 override pass; successor publication remains pending. Representation policy beyond the agreed constructor contract is not claimed migrated. |
| compiler/type_primitives.tower | Pure target representation classification; no mutable shared identity or allocation owner. | Exact numeric/width tests remain unchanged; no unrelated scalar-policy rewrite. |
| compiler/type_objects.tower | Invocation-private descriptor index and iterative ABI reachability scan; structural/nominal comparisons use actual descriptors, never serialized pointer identity. | Transitive metatype ABI negatives and canonical reconstruction pass. Temporary vectors remain separately owned, outside clone-frame grants. |
| compiler/semantic_types.tower | Canonical world entities and coordinator interning; worker-local function descriptions cannot publish array identities directly. Linear indexes remain derived from canonical entities. | Full types, both widths and worker determinism pass. Stable payload requirements remain; a dense pointer index is not packed payload storage. |
| compiler/semantic_type_values.tower | Declaration-owned argument continuation and ordinary interpreter requests; shared phase pump supplies producers without a second evaluator. | Constructor, untaken-branch and dependency regressions pass; final joined resource-error receipt must retain these results. |
| compiler/semantic_type_execution.tower | Evaluation-owned constructor receipt validates world, revision, profile, dispatch and invocation sequence; coordinator publishes under the shared type-index access contract. | Query/type/aggregate gates pass, including failure and retained result paths. L1/A1's later resource-error ABI requires a coherent rebuild. |
| compiler/semantic_constructor_types.tower | Single shared phase/payload definition with borrowed world-owned references; no duplicate constructor graph or copied scratch owner. | Checked against work consumers; full type suite passes on the current layout. |
| compiler/semantic_constructor_work.tower | Call/Clone/Alias/Execute/Ready continuation preserves ordered operand evaluation, early recursive nominal identity and ordinary execution of representation constructors. | Defined effects, aliases, nested helpers and negative ABI/constructor cases pass; final merged instrumentation remains required. |
| compiler/generic_registry.tower | Root-owned template/instance/origin components and derived linked index; fixed parameter bounds remain explicit. Body-cost memoization is coordinator-only. | Actual registry APIs create every new clone fixture. Source/origin/definition, world teardown and node-limit checks pass. Registry arrays and payloads are not included in frame-byte accounting. |
| compiler/generic_body_types.tower | Frozen borrowed WorkBudget pointer and fixed WorkBudgetError result accompany the private stage and node counters. No owned budget is copied into transport. | Actual native transport passes at1/2/4 lanes with exact failure results and zero frame grants. |
| compiler/generics.tower | One private typed frame owner per complete kernel reuses capacity across sibling branches. Synchronous/header owners dispose at return; public result derives the source-world ledger. | Wide allocations1038 to783, deep2434 unchanged; denied replacement preserves cleanup. Public helper and compatibility wrapper pass three serial denial/shape/cleanup runs; bounded service caller join remains pending. |
| compiler/semantic_generic_body_work.tower | Coordinator freezes budget/tickets/access ranges before dispatch, holds stages before closing views, publishes or discards before completion, and drains before disposal. | Distinct-thread overlapping kernels, cancelled outputs, failed peer and stale-ticket rejection pass. Final current sanitizer stress remains open. |
| compiler/semantic_generic_info.tower | Disposable components remain on original definitions and query root; one document owns mutation. Draft default-initializes the full analysis and returns null on resource failure. | Existing generic/type hover checks pass before the draft; smallest draft compiles. B2 frontend null rejection and bounded inspection regression are pending. |
| compiler/semantic_generic_values.tower | Temporary concrete expression clone uses ordinary checking; substitution views remain borrowed canonical relationships. Draft latches typed clone resource failure and stops recursive traversal without mislabeling truncation. | Existing exact type/generic presentation tests pass before the draft; smallest draft compiles. No claim that unrelated speculative checker failures have acquired full byte accounting. |

The subsequent six-lane merge preserves the owned production paths. A new serial
fault after successful ledger/frame allocation proves that node allocation was
still reported as None: the exact before receipt is0 versus expectedMemory3,
followed by SIGABRT. First/later node and attachment failure now report Memory;
quota remains None. The same public failure plus staged fault indices0..4 pass
three times with complete cleanup, alongside all existing storage cases. The
source/binary/signal receipts are in the journal. Native worker instrumentation
and bounded frontend caller acceptance remain separate; the old nonstaged fatal
metadata boundary is explicitly not changed by this classification fix.

The eight-lane3915 source join preserves those fixes. To follow the merged size
contract, generic_body_types now owns the existing CloneFrame declaration and
initial-capacity policy; the serial fixture derives its denial boundary with the
actual sizeof and allocator size function. No transport field or allocation
algorithm changes. Public-pin smallest/coherent storage+LR builds and three
storage/query pairs pass on this joined source, including real native clone
overlap, cancellation, exact allocation failures and all new interpreter storage
cases. Frame sizes/peaks and783/2434 allocator counts remain unchanged. The
journal preserves exact hashes and distinguishes these focused checks from
unfinished frontend failure propagation, full profiles and release acceptance.

## Current caller integration at6b8355b

The complete coordinator history now includes all owned018d production files and
B2's matching transactional cache/query consumers, plus D2's exact clone-result
import policy. The current owned-file table remains exhaustive; no new production
type/generic path was added by this join. Its draft/pending labels above describe
the historical checkpoint. Current public-clone storage, parser and query-smoke
checks pass on compiler7ba14c94 with the matched failure ABI and actual frame size.
The source-bound types and constructor contracts remain unchanged by this join.

New generic_inspection_budget.tower is a public-service negative in the existing
editor selector. It proves a remaining resource error is masked as a nonnull
empty partial query after successful setup; releasing the reservation restores
the same cached document, and complete cleanup passes before the rejection
assertion. B2 owns propagation through the caller. Only width4/worker1 reached
this failure; do not claim late generic-inspection denial or the remaining matrix.
The original test-import linkage failure, corrected thin ABI, exact current
hashes, timing/RSS and failed status are preserved in the journal. Final complete
source instrumentation and public pin/deployment acceptance remain open.
