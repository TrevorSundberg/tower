# Tower foundation

The **foundation** comprises Tower's built-in primitives and bootstrap grammar.

## Raw memory direction (2026-11-17; supersedes the checked-pointer prototype)

Foundation pointers are raw address values. Address-taking, dereferencing and
stores operate on memory directly, with pointer width/alignment and struct
layout determined by an explicit target profile. Foundation pointers do not
carry cell indexes, lifetime generations or display-name IDs. Bounds, lifetime
and initialization checks are not mandatory foundation semantics. Safe pointer
types, checked collections and ownership policies will be built in Tower above
these operations. Static type checking remains part of the foundation.

The existing executable still implements checked handles in both the interpreter
and LLVM backend. Its behavior and layout described below are implementation
status, not the desired permanent contract. Migration must replace value storage
and pointer lowering together; deleting guards from the cell implementation is
insufficient. Ordinary target pointers and byte-layout-compatible struct storage
are needed for direct external calls under a matching ABI.

The interpreter can model target byte addresses in an execution memory space;
it need not dereference arbitrary C++ host addresses. Wasm linear-memory bounds
and host containment do not provide per-object memory safety. Uninitialized
storage does not acquire a guaranteed value or a guaranteed Tower diagnostic
under this direction. Invalid-access policy and strict compile-time execution
rules still need an explicit definition; raw pointers alone do not settle them.

The current loading boundary is C++ seed -> bedrock.tower -> foundation.tower ->
source. The C++ seed always reads bedrock; bedrock never changes its own reader.
Its rules supply the declaration syntax used to read foundation and later source.
The host supplies this order today. Future imports should have foundation import
bedrock and user files import foundation.

Bedrock is a public vocabulary, without a reserved `__` prefix. Foundation inherits
its shared Whitespace, comment, Identifier and String definitions by reference,
and adds Number and executable grammar. Declaration-specific concepts use names
such as GrammarAssignment and GrammarSequence. Local overrides replace bindings;
they do not mutate imported entities. Parser helper names avoid source names
without imposing a reserved prefix. The provisional `as style` clause is one
highlighting metadata field, not a settled general attribute system.

Grammar declarations now carry SyntaxNode components on their actual Tower parse
nodes, alongside the CoreNode components used for executable foundation semantics.
The native seed constructs this same model. One formatter in scaffolding/format.cpp
dispatches on these components and emits compilable canonical declaration or
executable source. Definition maps contain references to these entities; tables,
lexer DFAs and repetition helpers are derived caches. A declaration's alternatives,
captures, replacement template, ordering and comments are retained for formatting.
Native scanner/installation hooks and the Core* semantic contracts remain C++.
This is shared representation and serialization, not a self-hosted implementation
of every parser/compiler operation or a completed public ECS transformation API.
Functions, typed parameters, calls, returns, storage, operations and control flow
belong here. Tower rules and replacements build richer surface languages above it.
The Tower graph is the shared typed representation consumed by the interpreter
and the LLVM backend; LLVM does not define Tower's language semantics.

## Hard requirement: foundation source and program data are the same language

The user requires this for the **canonical graph and foundation operations**,
regardless of terminology. Every public operation
and expression must correspond to a foundation construct. A function prints as
`fn foo(...): i32`, a declaration as `var a: i32`, and arithmetic as ordinary
foundation operations. The output must actually compile under the foundation;
looking similar to source is insufficient. This is Tower's assembly-like textual
form and must be usable for writing, generating and transforming programs.

Canonical foundation text and the shared in-memory program are two views of one
language and semantic node schema. **There is no public binary graph or Tower
bytecode format.** Saved/interchanged Tower programs are foundation text. The
same verifier checks programs created by parsing or transformations. LLVM and
platform object/executable output are derived backend representations.

The user's subsequent clarification supersedes the earlier plan to serialize
these nodes into binary bytecode. The sole exception is a private compact
instruction encoding for fast interpretation, described below. It is execution
data derived from the shared nodes, not an alternative AST, graph-traversal
representation, compiler interchange format or independently versioned language.

The acceptance contract is that formatting a valid foundation program and parsing
and resolving the resulting text reconstructs the same canonical semantic
structure, including declaration references, types, ordering, effects, control
flow, sharing and storage lifetimes. Equality permits fresh entity IDs and new
source coordinates, not lost bindings or changed behavior. Formatting again must
produce stable canonical text. Round trips are tested through both execution
backends, including observable output and traps; structural equality is also
checked because executing a few examples cannot establish the full contract.

Canonical output must use a specified foundation grammar/version and include the
declarations or explicit dependencies required for its names to resolve. It must
not depend on the source program's custom grammar, an unavailable C++ symbol
table or the debug viewer. Inferred types become explicit where necessary.
References print using names with preserved bindings, with an explicit policy
for generated names and any observable display names. Cycles/shared references
print as declarations and references, never recursive expansion or duplicate
evaluation. Provenance can be retained in an accompanying source map; original
source offsets and allocator identities are not executable source syntax.

### Shared entities and components

Use Tower's node/entity/component model across parsed syntax, expanded foundation
programs, transformations and the interpreter/LLVM inputs. A foundation function
node has its signature/body components; a local reference has its binding and
type components. Parsing adds syntax/source information, resolution attaches
symbol references, and type checking attaches semantic facts. A programmatically
created function uses those same components and validation paths. Foundation
nodes can retain identity through enrichment; replacement may create new nodes
with provenance. The requirement does not imply that a higher-level foreach
node must survive expansion unchanged or that editing must mutate old snapshots.

Source punctuation/comments and arbitrary language-extension syntax can live in
additional components or associated syntax nodes. They need not be executable
operations. High-level syntax and normalized foundation syntax use the same node
infrastructure with different applicable components, rather than unrelated AST
and opcode object systems.

Ownership children and graph references must be distinct. Existing TowerNode
children have one parent and moving a child reparents it. A call's callee, a
resolved variable/type and a control-flow edge must therefore be references,
not ownership children. Define reference validity/lifetime and graph-root or
arena ownership explicitly, including recursive functions. Merely adding strong
reference-counted cross-links would introduce leaks through cycles.

### Shared formatting and control flow

Use one formatting engine and the same per-construct foundation formatting rules
for the editor formatter and canonical program output. A source-aware mode can
retain comments and original spelling; canonical mode renders explicit semantic
information. Extension syntax needs its own formatting recipes in that same
system. Arbitrary parse rules alone do not specify preferred whitespace or which
alternative spelling to use. The current terminal-joining debug renderer is not
this formatter and cannot provide its round-trip guarantee.

Keep foundation `if`, `loop` and lexical scope constructs in the canonical
program. CFG successors, VM instruction addresses and scope-cleanup schedules
can be derived indexes over those nodes. This preserves the user's small
structured foundation and avoids inventing new source operations to accommodate
the current implementation. Public arbitrary jumps, SSA nodes or other new
operations would first require explicit foundation syntax and semantics. Do not
silently turn a lowered CFG into a different public language or claim that
reconstructing structured source from arbitrary jumps is always 1:1.

### Current implementation

`core_compile` retains expanded parser trees under one owned TowerNode root and
attaches `CoreNode` semantic components directly to the relevant parser entities.
Local references and calls bind to declaration/function entities. Those edges are
non-owning references within the program root; recursive calls do not create
ownership cycles. Local slot and function indexes are derived metadata.

Built-in and user-defined types occupy the same program-owned type registry.
Each entry is a Tower entity with `CoreKind::Type` metadata: name, representation,
size, alignment and field entities. Struct declarations and field declarations
enrich their actual parse nodes; member access binds to those field entities.
Struct identity is nominal, so equal layouts do not make distinct types assignable.
Recursive pointer references are non-owning edges, not ownership cycles.

The reference interpreter walks these structured components with resumable task
stacks. LLVM consumes the same components and derives its own blocks and allocas.
The independent instruction objects, debug opcode listing and binary transport
have been removed. `core_format` emits canonical foundation text, including
`var name: Type`, `fn name(arg: Type): ReturnType`, scopes, `if` and `loop`.
The isolated LLVM WASM module accepts that text, parses/resolves/checks it with
the configured foundation grammar, then lowers the same node schema. A source-map
sidecar maps diagnostics to the original program, including replacement origins.

Native tests compare semantic structure and bindings after text round trips;
WASM tests check canonical stability and interpreter/LLVM output and traps.
The formatter is the shared foundation emitter; a general editor formatting
command, extension formatting recipes, executable-source comment preservation and a public verified
node-construction/transformation API remain follow-up work. Minimal rebuild still
needs stable edit identities and correct invalidation; node components alone do
not provide those guarantees.

## Text, execution encoding and platform output (2026-11-16 clarification)

The intended boundaries are:

| Representation | Role |
| --- | --- |
| Foundation text | The only saved/interchanged Tower program format; compilable and readable. |
| Shared Tower nodes/components | Canonical working representation for traversal, transformation, resolution, reflection and backend input. |
| Private interpreter instructions | Compact derived execution data, allowed only to make interpretation fast. |
| Platform objects/executables | Normal target-specific compiler output, including native code or WASM. |

There is no goal of a distributable Tower virtual-machine binary format. Users
write, inspect and exchange foundation text. Binary native executables and WASM
target output remain valid; the rejection concerns a separate Tower program or
graph serialization format. The former binary program transport has been removed.

Maintain a portable interpreter so foundation code can execute without guest JIT
compilation or allocating executable memory. The interpreter engine itself must
be available on the host. Host services and foreign operations require explicit
implementations/capabilities; portability cannot silently supply unavailable OS
facilities or execute arbitrary foreign machine code.

A fast register interpreter, inspired by the user's Lua comparison, is a design
candidate. Small register/operand indices, packed instructions, constant pools,
branch targets and frame storage are execution data. AST structure, reflection
information, source provenance and compiler metadata do not belong in the hot
instruction stream. They remain on the shared entities or in optional external
debug maps. Runtime state/checks needed to preserve language semantics still
exist; omitting compiler metadata does not license dropping lifetime/type traps.

The private stream can use dispatch instructions, specialized operations or
fusion derived from foundation nodes when behavior is preserved. It is not
required to mirror the canonical node count or reconstruct a source graph. The
canonical nodes and shared formatter remain the source of compilable output.
Do not turn this optimization into a second authoring language, stable binary ABI,
graph traversal API or durable binary program asset. Initially treat it as a
discardable in-memory execution cache with explicit invalidation.

The suggested roughly 255 registers is an encoding experiment, not a language
restriction. mem2reg promotes eligible memory locals into SSA values; it does
not allocate those values into a bounded register file. Register reuse needs
liveness analysis/allocation, with a defined fallback such as wider operands or
spills for larger functions. Escaping/address-taken storage retains appropriate
memory semantics. Benchmark encoding/dispatch strategies before making promises
about speed, and keep a correct reference execution path for differential checks.

## Deterministic execution contract

Compile-time execution MUST produce identical defined observable behavior on all
supported hosts for the same program, explicit inputs, semantic version and
target description. This is a language requirement, not a property inherited
from a particular interpreter, LLVM or the host machine. It covers generated
foundation code/data, results, effects and language-defined traps. It does not
mean that x86 and ARM executables contain identical instruction bytes.

Strict compile-time execution should have explicit rules for:

- Integer widths, overflow, shifts, division, conversions and evaluation order.
- Floating-point rounding, NaN payloads, signed zero, subnormals, fused operations,
  and mathematical-library results. Software implementations/canonicalization may
  be needed where host instructions cannot meet the selected contract.
- Memory layout/endianness, allocation and pointer identity, initialization,
  aliasing and invalid accesses. Do not expose allocator addresses or arbitrary
  host memory as supposedly deterministic values.
- Collection iteration and hashing where observable; scheduling if compile-time
  parallelism is supported.
- Clocks, randomness, environment, files and other effects. These must be absent
  or explicit, reproducible inputs/capabilities. Record dependencies for rebuilds.
- Resource policies. If deterministic fuel/limits are observable, define their
  units and version them; host wall-clock timeout or out-of-memory is an execution
  environment failure, not a substitute successful language result.

During cross-compilation, type layouts and target queries must use the explicit
requested target, not the compiler host. Identical hosts compiling for different
declared targets can intentionally produce different results; different hosts
compiling for the same target and inputs must agree. Compiler-generated node IDs
and incidental map order must not affect canonical text or generated artifacts.

Runtime can expose explicit, well-defined target-dependent or relaxed behavior
where useful. The user has left the policy/option syntax open. Recommended design:
a strict portable compile-time profile plus explicitly selected runtime profiles,
with documented boundaries and conversion/interaction rules. No accidental drift
based on the host, optimizer version or ambient floating-point settings. Include
the selected semantics and target in constant-folding, optimization, interpreter
cache and minimal-rebuild assumptions. Compile-time evaluation of runtime code
must honor that code's selected semantics or decline to fold it.

LLVM remains usable as a backend, but lowering must preserve Tower's selected
contract. Avoid introducing poison/undefined behavior or permissive floating-point
flags where Tower defines a result or trap. Use checks, constrained operations,
canonicalization or helper routines as necessary and test cross-target results.
WebAssembly is useful inspiration, but its specification also permits some NaN
variation; choosing WASM alone does not establish Tower's stronger contract.
References: [LLVM language reference](https://llvm.org/docs/LangRef.html#fast-math-flags),
[WebAssembly nondeterminism](https://github.com/WebAssembly/design/blob/main/Nondeterminism.md).

These are requirements and research tasks, not a claim of cross-platform proof.
Current interpreter/LLVM comparison tests cover the implemented integer/bool/
checked-pointer and struct subset on the tested WASM host; floats, external ABI layouts and a
strict compile-time effect environment remain to be implemented and validated.

## Declaration direction (2026-11-16)

Prefer intent-first declarations and a consistent colon for type annotations:

```tower
fn add(a: i32, b: i32): i32 {
    var result: i32;
    result = a + b;
    return result;
}
var answer: i32 = 123;
```

This syntax is implemented, including optional simple initializers. Type spellings
are ordinary identifiers parsed independently of name lookup; the current semantic
registry contains i32/u32/bool/void and user-declared structs as type objects.
Their metadata is inspectable through the native/host API; Tower-language
reflection operations remain future work.
Initializers stay instruction-like; this does not introduce precedence.

Future local inference allows `var a = 5;`: an omitted annotation infers the type
from the initializer. An explicit `var a: u32 = 5;` supplies the expected type.
Define numeric literal defaults/ranges explicitly (i32 is a candidate default),
and diagnose declarations without either an annotation or an inferable initializer.
This is semantic analysis, not a parser dependency on inferred types.

Parse the name after `:` as a type reference and resolve it during semantic
analysis. Built-in `i32` and a user-defined `Blah` should both resolve to reflected
type objects through ordinary lookup. Built-ins still need representation and
operation metadata understood by the compiler. Reflection should expose that
information, rather than treating built-in type names as reserved grammar words.

`var` makes declaration recognition independent of whether a name already denotes
a type. The same approach extends to pointers, named aggregates, aliases and
parameterized types without requiring parser-side type-name lookup. Their precise
type-expression syntax and reflection interface remain to be designed.

## Struct milestone

```tower
struct Pair {
    first: i32;
    second: i32;
}
fn accumulate(pair: Pair*): void {
    pair.first = pair.first + pair.second;
}
var pair: Pair;
pair.first = 20;
pair.second = 22;
var pointer: Pair* = &pair;
accumulate(pointer);
print pair.first;
```

`struct` is an intent-first top-level declaration. Its name and field names are
ordinary identifiers, including quoted identifiers. Type headers are registered
before resolving fields and function signatures, allowing forward references and
recursive pointers. A by-value layout cycle is rejected before execution.

`value.field` selects a field on a struct value or dereferences exactly one level
of struct pointer. It supports nested fields and pointer fields, simple operands,
assignment targets and `&value.field`. This is address selection, not arithmetic
precedence. `Struct**` requires an explicit load into a `Struct*` local first.
Taking a field address does not read its uninitialized contents. Struct locals
start with each field uninitialized; writing one field does not initialize its
siblings. Aggregate assignment, comparison, printing, parameters and returns by
value are diagnosed for now. Pass a pointer or operate on individual fields.

Layouts follow a fixed portable profile: i32/u32 size/alignment 4/4, bool 1/1,
void 0/1, and checked pointers 24/8. Fields are placed in declaration order at
the next aligned byte offset; the struct is padded to its maximum field alignment.
An empty struct has size/alignment 1/1. The pointer layout reserves a 32-bit cell
index, 64-bit generation and 32-bit display-name index with explicit alignment
padding. It is a checked handle, not a host address or a C/shader ABI promise.

Execution derives scalar-cell indexes from those same field/type entities. The
interpreter and LLVM currently store aggregates in checked cells, with auxiliary
initialization/lifetime state; that internal storage is not a packed byte image
of the reflected value layout. All cells in one local share a lifetime generation.
Field pointers expire with their owner at block exit, frame return or the next
loop declaration. Address-taken structs currently use this checked storage even
when an optimizer might later prove that scalar promotion is safe.

When a call supplies an assignment's value, its scalar arguments are read and
the destination address is captured before entering the callee. Redirecting a
pointer during that call cannot redirect the pending store. Errors and captured
source locations must agree across interpreter and LLVM, including these cases.

Limits are 256 user struct types, 256 fields per type, 128 nested by-value types
or member accesses, and 4,096 scalar storage cells per struct/function frame.
The existing 65,536-live-cell / 128-frame runtime limits still apply.

## Follow-up tasks

- [ ] Replace checked pointer handles/cell storage with raw target pointers and
  actual byte layouts in interpreter and LLVM. Keep one shared type/layout model.
- [ ] Replace foundation tests requiring lifetime/initialization traps with tests
  for valid aliasing, direct memory operations, target layouts and external calls;
  retain safety checks only in explicitly selected higher layers/instrumentation.
- [ ] Extend the long-term unified Tower backend plan to SPIR-V tooling and WGSL
  conversion. Translate/adapt needed compiler/validator/optimizer/translator code,
  sharing entities, types, layouts, analyses and applicable transforms with the
  LLVM/Binaryen work. Emit WGSL directly from validated internal nodes when ready;
  keep per-target legality, feature requirements and conformance tests explicit.
- [ ] Long term: translate/adapt needed LLVM and Binaryen code into Tower; integrate
  useful LLVM-to-WASM and Binaryen optimizations over shared syntax/AST/foundation
  entities augmented with instruction components. Remove unnecessary machinery,
  preserve required attribution/licenses for translated code, and keep canonical
  operations expressible in foundation source. Audit pass preconditions and
  semantic differences instead of inheriting upstream undefined behavior.
- [ ] Build a migration/conformance suite: reference interpretation, per-pass
  before/after behavior, upstream backend comparisons where semantics overlap,
  generated/adversarial inputs, canonical source round trips, CPU/GPU feature and
  fallback variants, and reproducible text/artifacts for fixed targets and inputs.
  Test memory/effects/traps as well as values, and execution/build latency and size.
- [ ] Design implementation alternatives with optional target features: portable
  scalar/SIMD CPU, baseline shader, extension-specific shader, and CPU emulation.
  Distinguish build dependencies, compiled variants, device capabilities actually
  enabled, OS CPU-state support and runtime dispatch. Package alternatives together
  while keeping unsupported shader capabilities out of baseline modules. Define
  coherent resource/layout interfaces, selection diagnostics, override controls,
  cache keys and tests that force every fallback on capable development machines.
- [ ] Attach target implementations, required capabilities and execution context
  to foundation operations; infer support through the reachable call graph and
  selected implementations, including recursion and specialization. Validate
  claimed multi-target support and explain the call chain for missing support.
- [ ] Dual-compile a shared ocean-wave function for GPU rendering and CPU buoyancy
  queries using identical explicit inputs; keep vectors, swizzles and math shared.
- [ ] Define CPU shader execution profiles: faithful quad/workgroup emulation;
  explicit user overrides; and convenient documented defaults (zero derivatives
  or caller-supplied gradients, finest texture mip/level 0 without gradients).
  Specify sampler state, resource access, divergence, helper lanes and collectives;
  validate unsatisfied requirements rather than fabricating unsupported behavior.
- [ ] Define strict reproducible math versus explicitly relaxed shader-style math,
  including reference implementations, sampling/LOD rules, rounding, reduction
  order and accepted error. Test CPU/GPU agreement against the selected contract;
  target support alone does not establish bitwise equality or equal performance.
- [ ] Support Tower compute shaders for Vulkan (SPIR-V) and DirectX 12 (DXIL).
  Share canonical nodes, typing, layouts and applicable transforms; model target
  capabilities, resource bindings, workgroup entry points, address spaces,
  atomics/barriers and execution semantics explicitly. Validate emitted shaders
  with the relevant target tools and execute deterministic reference kernels.
- [x] Unify foundation syntax/semantic operation definitions and node components;
  eliminate the independent public graph/bytecode instruction vocabulary.
- [x] Keep structured scope/control-flow nodes canonical; derive CFG and execution
  indexes with source-entity mappings rather than separate semantic instructions.
- [x] Define program-root ownership and non-owning semantic reference edges.
- [x] Build the canonical foundation formatter over shared semantic components.
- [x] Preserve nonstandard and keyword-colliding identifier names in canonical
  source through quoted identifiers, including escaped characters and bindings.
- [ ] Add an editor formatting command and extension recipes, preserve comments,
  and validate programmatic transformations.
- [ ] Define stable identities/lifetimes across edits and shared program versions.
- [x] Require foundation text round trips, stable formatting, structural equivalence
  and interpreter/LLVM behavior checks, including aliases and lifetime traps.
- [x] Move interpreter/LLVM inputs to shared foundation entities and retire the
  binary graph transport. Use shared access or foundation text at
  module boundaries. Route the playground's program view
  through the shared formatter and label canonical output as compilable source.
- [ ] Specify strict compile-time semantics, explicit inputs/target data, effect
  capabilities and resource policy, then add cross-host/target conformance tests.
- [ ] Define any optional runtime semantic profiles and their boundaries; include
  them in evaluation, constant-folding, optimization and dependency/cache keys.
- [ ] Keep interpretation available without guest executable-memory allocation;
  research compact register execution as a private cache, including allocation,
  spills/wide operands, alias preservation and external debug mappings.
- [x] Change declarations to `var name: Type` with optional simple initializer.
- [x] Change parameters to `name: Type` and function returns from `->` to `:`.
- [x] Use `name(arguments)` calls without a `call` keyword in grammar and formatter.
- [ ] Add `var name = initializer` local inference, with specified literal defaults,
  explicit annotation constraints, overflow diagnostics and no silent type mixing.
- [x] Parse type names as identifiers and resolve them in the semantic type registry.
- [x] Register foundation scalars and user structs in one type-object registry;
  resolve type names there and lower by resolved representation/identity.
- [x] Add user-defined structs, deterministic layout and checked field aliases.
- [x] Test name collisions, forward type references, unknown types and shadowing;
  keep parser decisions independent of the type registry.
- [ ] Expose type/field metadata to Tower programs through reflection operations.
- [ ] Add fixed-size arrays and typed indexing with explicit bounds behavior.
- [ ] Define aggregate copying and by-value argument/return semantics before
  implementing them, including partial initialization and aliasing rules.
- [ ] Add vectors and target-specific/external ABI layout profiles; validate
  shader layout/capability contracts rather than reusing checked CPU handles.

## Shared foundation and playground comparison

- [x] Represent grammar declarations on shared parse-node components, with one
  formatter for native bedrock, parsed grammar modules and executable foundation.
- [x] Load real bedrock.tower through the immutable C++ seed, then use bedrock's
  declaration grammar for foundation and source. Validate module installation
  atomically, retain pinned sessions and test native/loaded grammar agreement.
- [x] Select Bedrock and Foundation in the editor dropdown, with independent
  buffers/undo, persistence, restore, downloads and canonical formatting previews.
- [ ] Express module relationships as imports: foundation imports bedrock; user
  modules import foundation. Keep bedrock's own reader fixed to the C++ seed.
- [x] Consolidate lexical and executable grammar into `scaffolding/foundation.tower`.
  Bootstrap its declarations in order, install atomically, reuse identical source,
  and pin existing sessions to their original baseline.
- [x] Edit the real shared module in the playground with separate source/module
  buffers and undo histories, local persistence, restore and download. Apply it
  to the parser and both runner frontends without prepending it to examples.
- [x] Show final replacement text inline at each resulting subtree, including
  chains, nested replacements and repeated captures.
- [x] Always launch interpreter and LLVM workers concurrently and compare terminal
  observable results. Show both outputs, Tower instructions, and LLVM before/after
  in persistent columns. Cancel all unfinished workers and reject obsolete replies.
- [x] Put steps and measured compilation, formatting, LLVM phase and execution
  timings at the bottom. Keep the compact interpreter encoding a future cache;
  the current interpreter executes shared Foundation nodes directly.
- [ ] Extend the runner comparison to shader reference/emulation and real GPU
  execution (SPIR-V-capable native targets or WebGPU/WGSL). Compare under explicit
  input, resource, capability and numeric contracts; account for GPU readback and
  execution context instead of assuming arbitrary shader/CPU equivalence.
- [ ] Extend provenance to module-qualified definition locations for multi-file
  replacement tooling; current definition byte coordinates are local to their module.
