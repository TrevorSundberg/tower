# Tower foundation

The **foundation** comprises Tower's built-in primitives and bootstrap grammar.

## Raw memory (2026-11-17; supersedes the checked-pointer prototype)

Foundation pointers are raw address values. Address-taking, dereferencing and
stores operate on memory directly, with pointer width/alignment and struct
layout determined by an explicit target profile. Foundation pointers do not
carry cell indexes, lifetime generations or display-name IDs. Bounds, lifetime
and initialization checks are not mandatory foundation semantics. Safe pointer
types, checked collections and ownership policies will be built in Tower above
these operations. Static type checking remains part of the foundation.

The interpreter now uses target byte addresses in a byte memory space; LLVM uses
ordinary `ptr`, allocas, loads/stores and byte offsets. Both share the same type
layouts. The previous checked-cell implementation is archived at commit 8571a8d
for future safe-layer design; it is no longer the foundation implementation.

The interpreter can model target byte addresses in an execution memory space;
it need not dereference arbitrary C++ host addresses. Wasm linear-memory bounds
and host containment do not provide per-object memory safety. Uninitialized
storage does not acquire a guaranteed value or a guaranteed Tower diagnostic
under this direction. Invalid-access policy and strict compile-time execution
rules still need an explicit definition; raw pointers alone do not settle them.

The current loading boundary is C++ seed -> bedrock.tower -> foundation.tower ->
source. The seed initializes Bedrock's reader. Each completed declaration updates
the active reader for subsequent input, including within Bedrock, without mutating
the immutable seed. Its resulting rules initialize Foundation and later source.
Foundation now explicitly imports Bedrock; Tower imports Foundation, and compiler
and user modules can import Tower. The seed still initializes declaration reading.
See [modules and named values](modules.md) for import order, grammar isolation,
dependency tracking and the compatibility baseline for files without imports.

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
GrammarPattern and GrammarTemplate are ordinary Bedrock definitions: a contextual
regex token and recursive parse rules. Generic `when expected` tokens consult the
current LR ACTION table; terminal sets such as `[^'{' '}']` match ordinary tokens
other than the listed literals. The lexer/table engines, installation hooks and
Core* semantic contracts remain C++.
This is shared representation and serialization, not a self-hosted implementation
of every parser/compiler operation or a completed public ECS transformation API.
Functions, typed parameters, calls, returns, storage, operations and control flow
belong here. Tower rules and replacements build richer surface languages above it.
The Tower graph is the shared typed representation consumed by the interpreter
and the LLVM backend; LLVM does not define Tower's language semantics.

Built-ins use ordinary call grammar: `print(5)`, `alloc(u8, 100)`,
`realloc(u8, p, 200)`, `free(p)`, `copy(dst, src, count)`,
`fill(dst, byte, count)`, `sizeof(Type)`, `alignof(Type)`, `convert(Type, value)`
and `bits(Type, value)`. Statements end with `;`. These names resolve to Foundation
operations during semantic checking; they are not separate keyword productions.
A shared built-in definition table supplies operation names and arities to
validation and formatting. Their arguments remain simple operands/type spellings,
without general nested expressions or an expression-precedence grammar.

LLVM reconstruction also uses the ordinary foundation calls `label(name)`,
`jump(name)` and `trap(message, offset)`. Labels occupy a function-local label
namespace and must be direct statements in that function's body. Forward jumps
are allowed; a jump leaves any nested blocks and continues immediately after
the named label. Intermediate labeled blocks must end in a jump, return or trap
before the next label. Usual lexical name/type checking still applies; jumping
past a local initializer does not initialize it. Generated code declares its
locals before the first label and uses assignments on CFG edges for SSA merges.
`trap` accepts a nonempty NUL-terminated `u8*` message and a `u32` diagnostic offset and
terminates execution. These operations format back to compilable foundation and
are shared by both interpreters and LLVM lowering.

The fast interpreter's standard producer lowers the program through LLVM,
applies the documented scalar pass profile, reconstructs this same foundation
graph, then builds a compact private register cache. Optimization is enabled by
default. Debug mode disables passes but follows the same lowering/reconstruction
path. The original graph interpreter and graph view remain available. See
[the backend API](../scaffolding/backend/README.md) for the pass profile, supported
return translation and `.towerbc` envelope versions. Foundation text remains the
authoritative stored program; the envelope's cache is verified derived data.

Module functions, types and top-level variables bind across the file. Initializers
and other effects run in source order; forward lookup does not initialize storage.
Top-level variables have module storage accessible to functions, while function
and block locals retain lexical scope. Reads before initialization remain outside
the defined raw Foundation contract. Redeclaring a module variable is an error.

Grammar definitions may refer forward while unreachable from active parsing
roots. A declaration such as `parse A = B;` records a pending dependency. Defining
B resolves it before A is connected to Statement or another active root. Active
grammar closures must be complete, including optional branches; incomplete
activation reports the dependency chain. Unresolved names at module completion
are errors. The current reader parses each declaration in order, so changing the
declaration syntax affects following definitions normally; no prescan or
retroactive parsing is involved. Atomic grammar groups remain future work.

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
debug maps. Runtime state/checks needed to preserve defined language semantics
still exist; raw foundation pointers do not promise lifetime traps.

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
Current interpreter/LLVM comparison tests cover integers, bools, valid raw memory,
structs, arrays and registered external calls, with native ABI fixtures as well.
Floats and a strict compile-time effect environment remain future work. Invalid
raw memory accesses and uninitialized reads have no portable defined result or
guaranteed diagnostic; these programs are outside the differential contract.
A future strict compile-time mode must reject or instrument invalid operations
and control external effects. The ordinary raw runtime does not provide that mode.

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
registry contains i32/u32/u8/i64/u64/usize/bool/void, structs and fixed arrays as type objects.
Their metadata is inspectable through the native/host API; Tower-language
reflection operations remain future work.
Initializers stay instruction-like; this does not introduce precedence.

Initializer inference is implemented for local and module variables:
`var a = 5;` infers i32; `var a: u32 = 5;` supplies an explicit expected type.
The grammar stays independent of name/type lookup. Without an annotation, an
initializer is required. Parameters and return types remain explicitly typed.

Bare integer literals default to i32 and must fit its signed range. In a binary
operation, a typed operand constrains its literal peer; two typed operands must
agree, with no implicit widening or signed/unsigned conversion. Comparisons
produce bool. Calls supply their declared result type; address-taking and loads
preserve the pointed-to type. Strings infer u8*, null defaults to void*, and
sizeof/alignof results infer target-sized usize. Explicit annotations and the
existing literal range checks still apply. Aggregate copies remain unsupported.

Module names bind before initializer type dependencies are resolved. Forward
references are supported; initializer cycles without a known type are diagnosed
with their name chain and can be broken with an explicit annotation. This does
not initialize forward storage or reorder effects: initializers execute in source
order, and raw uninitialized reads remain undefined. Locals retain lexical scope;
an inferred declaration referring to itself is a type cycle, including when it
shadows an outer name. Later assignments do not determine an earlier declaration's
type. Inference is initializer-based, not a general bidirectional constraint solver.

Checked types attach to the existing declaration/operation nodes. Temporary
dependency state is an analysis index only. Source formatting retains omitted
annotations; canonical Foundation output spells every checked type explicitly,
preserving source-order storage allocation and bindings through round trips.

Parse the name after `:` as a type reference and resolve it during semantic
analysis. Built-in `i32` and a user-defined `Blah` should both resolve to reflected
type objects through ordinary lookup. Built-ins still need representation and
operation metadata understood by the compiler. Reflection should expose that
information, rather than treating built-in type names as reserved grammar words.

`var` makes declaration recognition independent of whether a name already denotes
a type. The same approach extends to pointers, named aggregates, aliases and
parameterized types without requiring parser-side type-name lookup. Parameterized
types use parenthesized application, such as `vector(i32)`, rather than angle
brackets. The full reflection interface remains to be designed.

## Combined compiler/runtime and type-producing functions

The intended model is ordinary Tower code running at explicit stages. The
compiler belongs to the runtime: code can parse, inspect shared entities, create
types, generate more Tower code, compile it and execute it. Keep interpretation
available without executable memory. This is the user's original direction,
reaffirmed on 2026-11-18, with Zig-like type-producing functions as inspiration;
it is not a commitment to Zig's syntax or complete semantics.

Types should be first-class values represented by the same entities/components
as syntax, grammar and foundation operations. Built-in type names resolve like
other names. A call such as `vector(i32)` should ultimately be an ordinary Tower
function accepting a type and returning a type. Generic functions can accept
compile-time type arguments that determine their other parameter/result types.
Template metaprogramming becomes Tower programming, rather than another language.
Explicit specialization can provide an initial implementation without closing
off general type-producing execution later.

Compile-time and runtime share language operations, with explicit execution
contexts and effects. Compile-time file reads are intended: expose permitted
files through a host capability or virtual filesystem, track the observed inputs,
and invalidate affected computations when those inputs change. Observed absence
or directory contents are dependencies too when they influence results. Identical
program, inputs, semantic profile and target must still produce identical defined
results. Effectful calls cannot be folded, reordered or cached merely because
their arguments are known. Browser access uses supplied files/capabilities, not
unrestricted host filesystem access.

Distinguish static type construction from runtime reflection. A type required for
a compiled layout or function signature must be available at that stage. Runtime
type values can support reflection, dynamic storage or later compilation; they do
not change the static layout of already compiled storage. Nominal identity,
structural equivalence, repeated type construction, forward dependencies and
mutation/finalization rules need explicit contracts. Existing notes explore
alternatives and do not establish that every equal-looking type is identical.

This records direction, not implemented arbitrary compile-time evaluation, file
I/O during compilation, or general first-class type values. The original notes
are in [todo.txt](../todo.txt) at lines 10, 311-322, 2030-2064, 2534-2537,
3533-3571, 5555-5562 and 7334-7433; that file remains unmodified.

## Explicit type functions and templates (initial implementation)

```tower
fn box(T: type): type {
    struct Result {
        value: T;
    }
    return Result;
}

fn identity(T: type, value: T): T {
    return value;
}

var value: box(i32);
value.value = identity(i32, 42);
```

This bounded milestone supports explicit type parameters in any parameter
position, dependent parameter/result types, forward references, recursive
functions/types, nested type calls, pointers and fixed-array type arguments.
Type arguments are resolved before checking value arguments and disappear from
the concrete runtime signature. They are not runtime arguments and do not imply
argument inference. Generic exports/extern declarations require a concrete
wrapper. Existing restrictions on aggregate by-value calls still apply.

A type-producing function currently accepts only type parameters and contains
either one local struct followed by returning that struct, or a return of an
existing type/type-producing call. General control flow, value parameters,
compile-time file access, mutable type variables and runtime reflection are not
implemented by this evaluator. `type` is recognized semantically in parameter
and result annotations, not as a lexer keyword. This is a path toward the fuller
combined compiler/runtime model, not its completion.

[generics.tower](../scaffolding/compiler/generics.tower) implements parameter
discovery, instance lookup/publication, binding lookup, syntax cloning and the
bounded type-function evaluator. It is compiled together with the existing
Entity store and parser forest. Definitions, instances and origin information
are components on those actual entities. The `semantic-*.tower` modules now supply
semantic checking, name/type resolution and target layouts; C++ retains parser
loading and narrow component/query adapters.
The nongeneric bootstrap seed compiles `generics.tower` but cannot itself
instantiate templates. Stage1 can then build the semantic modules. No duplicate
C++ specializer is maintained.

Within a compilation/target, the same definition and semantic type arguments
reuse the same instance. Distinct nominal types remain distinct. Recursive
instances are registered before field/body resolution; invalid by-value cycles
and unbounded specialization fail with source/instantiation context. Current
bounds are 64 parameters, 256 instances, 65,536 copied nodes and 128 nested type
construction steps, alongside existing foundation limits. These are implementation
limits, not a permanent generics ABI.

The source formatter preserves template declarations. Canonical executable
foundation output contains concrete structs/functions, with quoted unique names
such as `box(i32)` when needed, and recompiles without a template engine. The
same syntax copier now serves parser replacement captures; it preserves child
order, capture names, Match metadata and replacement provenance using a Tower
work stack. It does not blindly copy arbitrary unknown component payloads.

[vector.tower](../scaffolding/library/vector.tower) provides a raw typed growable
vector with explicit initialize/reserve/push/dispose functions. Push supports
scalar and pointer values; aggregate ownership/copy policy remains future work.
Capacity growth checks overflow and preserves existing storage on failure.

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
print(pair.first);
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

Layouts use explicit little-endian target profiles: i32/u32 size/alignment 4/4,
u8/bool 1/1, i64/u64 8/8, void 0/1, and pointers/usize 4/4 for wasm32 or 8/8
for the supported 64-bit CPU targets. Fields are placed in declaration order at
the next aligned byte offset; the struct is padded to its maximum field alignment.
An empty struct has size/alignment 1/1. Actual storage matches reflected byte
layout. Pointers are raw addresses with no attached metadata. Pointer validity
remains the caller's responsibility; keeping an address does not extend a local's
lifetime. Structs cross a foreign ABI by pointer, with matching field layouts.
This is not a claim of compatibility with every C, C++ or shader ABI.

When a call supplies an assignment's value, its scalar arguments are read and
the destination address is captured before entering the callee. Redirecting a
pointer during that call cannot redirect the pending store. Errors and captured
source locations must agree across interpreter and LLVM, including these cases.

Limits are 256 user struct types, 256 fields per type, 128 nested by-value types
or member accesses, and 4 MiB per struct/function frame. The interpreter has
4 MiB of stack, 128 call frames and a 256 MiB execution-space limit. These are
implementation resource limits, not pointer safety or language ABI guarantees.

## Raw storage and foreign calls

```tower
extern fn sum(values: i32*, count: usize): i32;
export fn twice(value: i32): i32 { var result: i32 = value * 2; return result; }
var values: i32* = alloc(i32, 2);
values[0] = 20; values[1] = 22;
var result: i32 = sum(values, 2);
print(result);
free(values);
```

`T[N]` is a fixed array; `p[index]` selects an element. `p + integer` and
`p - integer` scale by the pointee size. Explicit `bits(Type, value)` permits
equal-width integer/pointer reinterpretation; `convert` checks numeric ranges.
`sizeof(Type)` and `alignof(Type)` query the selected target, not the compiler host.
Integer arithmetic wraps at the operand width; division faults still trap.

`alloc(T, count)` and `realloc(T, pointer, count)` return raw T pointers. Failed or
overflowing allocations return null. Realloc preserves the existing prefix on
success; failure leaves the old allocation intact. Realloc of a nonnull pointer
to zero frees it and returns null; allocation of zero may return nonnull storage
which must still be freed. `free(null)` is a no-op. Only allocator-owned base
addresses may be freed/reallocated. `copy(dest, source, bytes);` permits overlap;
`fill(dest, byte, bytes);` writes bytes. Neither operation is implicitly bounded.
Storage has no implicit initialization contract. Bool storage must contain 0 or 1.

A string literal is a NUL-terminated UTF-8 `u8*` with program lifetime and mutable
storage. Each literal occurrence has its own storage; callers must not free it.
The [byte-buffer library](../scaffolding/library/bytes.tower) implements byte
buffers/string building and now owns source text in the real compiler. Parsing and
grammar provenance share immutable source buffers retained by their existing nodes.
The [storage library](../scaffolding/library/storage.tower) provides a resettable
arena and growing u32-to-i32 map; those are not yet used inside the compiler.
These are ordinary Tower functions, not new native collection operations.
Callers initialize/dispose containers and check allocation results.
Reallocation invalidates old views; arena reset invalidates its views. Import the library with `import library.storage;`, or link exported functions
from a separately compiled object with matching declarations. See [modules](modules.md).

Extern/export signatures support scalars, raw pointers and void returns under
the selected C ABI. Structs/arrays pass by pointer. C++ classes, variadics, indirect
function pointers, dynamic loading and exception propagation are not implemented.
The interpreter needs registered host functions; it cannot execute a native
object. Its addresses refer to its byte arena, and browser Wasm addresses refer
to that instance's linear memory. They are not interchangeable across instances.
See [building and linking](../playground/README.md#native-output-and-browser-cross-compilation).

## Follow-up tasks

- [x] Replace checked pointer handles/cell storage with raw target pointers and
  actual byte layouts in interpreter and LLVM. Keep one shared type/layout model.
- [x] Replace foundation tests requiring lifetime/initialization traps with tests
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
- [x] Add `var name = initializer` local/module inference, with specified literal defaults,
  explicit annotation constraints, overflow diagnostics and no silent type mixing.
- [x] Parse type names as identifiers and resolve them in the semantic type registry.
- [x] Register foundation scalars and user structs in one type-object registry;
  resolve type names there and lower by resolved representation/identity.
- [x] Add user-defined structs, deterministic layout and checked field aliases.
- [x] Test name collisions, forward type references, unknown types and shadowing;
  keep parser decisions independent of the type registry.
- [ ] Expose type/field metadata to Tower programs through reflection operations.
- [x] Add parenthesized type-producing calls and explicit type-parameter
  specialization in Tower over shared entities.
- [ ] Extend the bounded type-function evaluator to general staged execution/type
  construction, rather than introducing a separate template language.
- [ ] Define compile-time file/effect capabilities, dependency recording and
  invalidation, including missing files and directory observations.
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
  modules import foundation. Bedrock starts from the C++ seed and applies its
  declarations incrementally, using the same update path as every other file.
- [x] Consolidate lexical and executable grammar into `scaffolding/foundation.tower`.
  Bootstrap its declarations in order, install atomically, reuse identical source,
  and pin existing sessions to their original baseline.
- [x] Edit the real shared module in the playground with separate source/module
  buffers and undo histories, local persistence, restore and download. Apply it
  to the parser and both runner frontends without prepending it to examples.
- [x] Show final replacement text inline at each resulting subtree, including
  chains, nested replacements and repeated captures.
- [x] Always launch the interpreter; launch LLVM concurrently when Wasm is selected
  and compare terminal observable results. Selected native targets build in workers.
  Show equal-width instruction, result, LLVM raw/optimized and disassembly columns.
  Cancel all unfinished workers and reject obsolete replies.
- [x] Put steps and measured compilation, formatting, LLVM phase and execution
  timings at the bottom. Keep the compact interpreter encoding a future cache;
  the current interpreter executes shared Foundation nodes directly.
- [ ] Extend the runner comparison to shader reference/emulation and real GPU
  execution (SPIR-V-capable native targets or WebGPU/WGSL). Compare under explicit
  input, resource, capability and numeric contracts; account for GPU readback and
  execution context instead of assuming arbitrary shader/CPU equivalence.
- [ ] Extend provenance to module-qualified definition locations for multi-file
  replacement tooling; current definition byte coordinates are local to their module.

## First Tower-written entity store

The compiler now uses [entities.tower](../scaffolding/library/entities.tower) for
its actual nodes: entity creation/identity, reference ownership, ordered named
containment, component registration/storage/removal and component-type queries.
The existing C++ node API adapts opaque pointers to those same Tower allocations.
Syntax, grammar, type and foundation components keep their existing entities;
this does not introduce a second AST, graph or program serialization.

Component types are ordinary entities with registered size, alignment and
lifecycle information. Stable payload allocations let existing C++ semantic
objects survive query-index growth and unrelated structural edits. A type keeps
a dense index of matching components; deletion swaps its final index entry into
the removed position. Query positions are temporary, while payloads remain valid
until removal/destruction. Component lookup on an entity is currently linear in
its component count. Ordered containment retains children; semantic references
inside components need not own their targets.

This initial store is single-threaded. IDs are monotonic within a store, not
identities preserved across source edits. Callers own raw pointer validity and
must avoid ownership cycles; safe handles, pinning/access scopes, dense archetype
columns, general relationship queries and jobs remain planned. A small host
lifecycle bridge still invokes existing C++ payload destructors. The eventual
Tower implementation must replace that bridge as those payloads move over.

[parse_tree.tower](../scaffolding/compiler/parse_tree.tower) now performs parser
forest concatenation, lazy capture application, generated-node flattening and
ownership transfer into the same entities. Its temporary arena is a derived
parsing work structure, not an authoritative alternative tree. Concatenation is
O(1), and fragments are flattened once. CMake now generates an import manifest for these Tower modules. LR table construction, recognizer
control and formatting retain native integration. Semantic checking now runs in
Tower; the native semantic implementation remains only as a bootstrap/reference.


## Semantic compiler implementation

`scaffolding/compiler/semantic-*.tower` implements the semantic pass over the
existing expanded parser entities. `semantic_types.tower` resolves module and
local bindings, inference, types, target layouts and type constructors;
`semantic_values.tower` checks locations, operands, operations and calls;
`semantic_statements.tower` handles function headers, lexical scopes, control
flow and ordered module passes. `semantic_support.tower` supplies type queries,
diagnostics and temporary indexes. Definitions, context and lifetime management
live in the other three modules.

Resolved results are the same `FoundationNode` and `FoundationType` components
consumed by interpretation, formatting and LLVM. Node layouts, kind/operator IDs,
public C++ queries, source ordering, diagnostic offsets and nominal type identity
are preserved. Hash tables and temporary lists contain indexes into those entities;
there is no additional authoritative tree or program format. Foundation source
remains the interchange format. Temporary native adapters in `core.cpp`,
`core-nodes.cpp` and `compiler-semantic.hpp` load parser sessions, expose components,
and marshal the existing query interfaces.

CMake compiles these ordinary Tower modules to the compiler host's target using
explicit Tower imports and a supplied import-capable Tower bootstrap. The unused
native seed/stage1 targets and their unreferenced support implementations have
been retired. The native semantic reference seed and interpreter adapters have
also been retired after native/WASI Tower execution checks passed; production
native and Wasm compilers use the Tower implementation. Portable
compiler distribution is still required; this does not establish a source-only
bootstrap or a fully interpreted parser/host integration.

Before its retirement, the unmodified native semantic differential suite verified
fields, bindings, layout, order, effects and lifetime indexes at both pointer
widths. The Tower execution suite retains those fixtures, exact diagnostics and
offsets, complete semantic-field/edge fingerprints, graph/cache agreement and
canonical Foundation round trips on native and WASI. The fingerprints are test
evidence; they are not a semantic interchange format.
The Tower fixtures in `scaffolding/tests/semantics.tower` and `semantic_invalid/`
exercise valid and invalid programs; browser tests compare interpretation, LLVM,
and canonical Foundation round trips. `test-bootstrap.sh` compares optimized LLVM
and object bytes for the semantic compiler itself across four targets. The
`benchmark-semantics.py` and `.mjs` scripts accept saved before/after compilers and
report native and Wasm compilation medians, excluding startup/execution time.
