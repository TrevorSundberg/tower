Do NOT modify todo.txt

## Compiler direction

- Call Tower's built-in primitives and bootstrap grammar its **foundation**.
  Functions, typed parameters, calls and returns belong to the foundation;
  richer surface syntax is built above it with Tower rules and replacements.
- Hard requirement: Tower's canonical graph and foundation operations have a 1:1 semantic
  correspondence with foundation constructs and serialize to compilable
  foundation source. Every public Tower operation needs a foundation spelling;
  a pretty debug dump alone does not satisfy this. Foundation text is the only
  Tower program interchange/storage format; do not create a binary graph or
  public bytecode format. Platform object/executable output is a separate concern.
- Use the same node/entity/component model for syntax, foundation semantics and
  the nodes consumed by interpreter/LLVM lowering. Share operation definitions,
  validation and formatting rules. A compact private instruction encoding is
  allowed ONLY as an interpreter execution cache: no graph traversal, reflection
  or compiler metadata encoded into that stream and no independent language/ABI.
  Derived execution/analysis indexes must not become a separate semantic model.
- Long term, translate the needed LLVM and Binaryen machinery into Tower, trim
  unused functionality, and combine applicable optimizations on these same nodes
  augmented with instruction semantics. Preserve compilable foundation spellings,
  target/semantic contracts and provenance; do not recreate an independent public
  IR. Migrate incrementally with reference, pass, round-trip, differential and
  determinism tests. Existing upstream backends remain useful comparison points.
- The same long-term integration includes SPIR-V tooling and WGSL conversion:
  absorb/translate needed implementations into Tower and share the architecture,
  while retaining explicit target legality. Browser WebGPU consumes WGSL; plan
  direct internal-to-WGSL emission rather than requiring SPIR-V as an intermediate.
- Keep a portable interpreter path that requires no guest JIT or executable-memory
  allocation. A register interpreter with small operand indices is a candidate;
  register counts/encoding widths are performance decisions, not language limits.
- Explicit target goals include Vulkan compute shaders via SPIR-V and DirectX 12
  compute shaders via DXIL. Share foundation entities, type/layout information,
  validation and applicable transforms across CPU/WASM/GPU targets. Express
  address spaces, resources, shader entry points, synchronization and target
  capabilities explicitly; diagnose unsupported operations before backend emission.
- Foundation operations may declare target implementations and execution-context
  requirements. Infer function support transitively through calls and selected
  implementations; support compiling the same eligible code for CPU and shaders.
  Keep vectors, swizzles and shader-style math available to CPU code as well.
- Aim for CPU execution of Tower shaders, including reference emulation where
  needed. Record ocean-wave rendering plus CPU buoyancy as a motivating example.
  Derivatives, sampling and collective operations need explicit context/policies.
  Provide convenient, documented defaults (e.g. finest mip/level 0 without
  gradients, configurable zero derivatives), separately from faithful quad-based
  emulation. Include fallback and numeric policies in compilation/cache identity;
  never claim relaxed/default results are bit-identical shader emulation.
- Plan optional feature implementations and portable fallbacks (CPU SIMD and GPU
  extensions), with explicit build-time versus runtime selection. Bundled variants
  may share one executable/package; unsupported instructions/capability declarations
  must not leak into its baseline CPU path or baseline shader module. Selection
  must satisfy the operation's semantic profile, not hardware availability alone.
- Compile-time execution MUST have identical defined behavior across hosts for
  identical program, explicit inputs, semantics version and target description.
  Specify arithmetic, floating point, memory and effects; do not inherit host
  behavior accidentally. Target queries use explicit target data, not the host.
  Runtime platform-specific or relaxed behavior must be explicit, well-defined
  and included in optimization/cache assumptions; it cannot silently affect
  strict compile-time execution. LLVM lowering must preserve Tower's contract.
- Use one formatting engine and the same foundation formatting rules for source
  formatting and graph output. Require canonical source round trips preserving
  structure, bindings, types, order, effects and lifetimes. Preserve comments and
  provenance as metadata where present; generated code needs no fabricated spans.
- Grammar declarations are included in the shared-node requirement: parse/token/
  skip declarations, alternatives, captures and replacements must have semantic
  components on the same node/entity model, with compilable text through the same
  formatting engine. Parser tables and lookup indexes are derived data, not a
  separate authoritative grammar model. Preserve declaration order and the
  distinction between replacing a definition (`=`) and extending it (`|=`).
- Every file starts from a grammar baseline and applies declarations incrementally
  after their terminating boundary, including Bedrock. The immutable C++ seed is
  Bedrock's initial baseline; local overrides affect all following declarations
  and tokens without mutating that seed. Foundation starts from Bedrock and user
  source starts from Foundation. Use the same update path for all files. Future
  imports should express foundation importing bedrock and user modules importing
  foundation; the current host load order is not yet a general import system.
- Bedrock rules are public, reusable definitions, not an internal `__` namespace.
  Foundation inherits shared token/skip/grammar entities from bedrock instead of
  redeclaring identical rules. Use descriptive names such as GrammarAssignment
  for declaration-specific concepts; keep Whitespace, Identifier and other common
  concepts shared. Generated parser symbols must avoid collisions without reserving
  a source-name prefix. Local overrides do not mutate an imported entity, but do
  change the current file's declaration lexer as well as its ordinary tokens.
- The current `as style` clause is provisional highlighting metadata, not a general
  attribute design or a semantic type annotation. Reconsider extensible attributes
  on the same shared nodes before expanding this syntax into unrelated semantics.
- Intended declaration syntax is `var name: Type`, parameters `name: Type`, and
  `fn name(...): ReturnType`. Type names, including i32/u32/bool, should eventually
  resolve to reflected type objects through ordinary name lookup, not reserved
  type keywords or parser-side symbol-table disambiguation. The declaration syntax
  and identifier parsing are implemented; reflected type objects remain future work.
- Treat the compiler and runtime as one Tower programming environment. Compilation
  is an explicit execution stage with dependencies, not a separate metaprogramming
  language. Keep a portable interpreted path for compiler code as well.
- The migration endpoint is pure Tower source for all project-owned compiler and
  runtime code, including bootstrap code, plus checked-in portable Tower compiler
  binaries for Windows/macOS/Linux. Only third-party implementations such as
  LLVM/SPIR-V tooling remain external/native until their separate translation.
  Retire each native seed/adapter after a validated Tower-built successor exists.
- Types should become first-class values on the shared entity/component model.
  Parameterized types use ordinary parenthesized application, e.g. vector(i32),
  with Tower functions accepting and producing types. Templates/generics should
  grow from this model; explicit specialization is a bootstrap milestone, not a
  permanent independent template language. Do not introduce angle-bracket syntax.
- Compile-time file reads and other effects should use explicit capabilities and
  tracked inputs. Preserve effect order and invalidate dependent results when
  inputs change. Shared compile-time/runtime code does not make arbitrary effects
  safe to fold or memoize, or let runtime types change existing static layouts.
  Type identity, construction, reflection and target layout require explicit
  contracts; do not infer type equality from incidental entity addresses.
- Function calls use `name(arguments)` without a `call` keyword. Parentheses
  distinguish calls under the foundation grammar; keep the existing typed call
  components and instruction-like operands rather than adding expression precedence.
- Built-in calls such as print, alloc/free, copy/fill, sizeof/alignof and
  convert/bits share the ordinary call and argument grammar. Resolve them to
  Foundation operations semantically and share names/arity with formatting.
- Module functions, types and variables bind across the file; initialization
  and effects retain source order. Block/function locals retain lexical scope.
  Grammar definitions may refer forward while unreachable from active parsing
  roots. Resolve their dependencies before activation, diagnose unresolved names
  at module completion, and reject incomplete edits to the active declaration
  reader. File order controls grammar updates, not silent LR conflict priority.
- Support future local type inference as `var name = initializer`; resolve it
  during type checking with explicit numeric literal defaults and range rules.
- Prioritize working language features before replacement-chain optimizations.
- Keep the native parser/bootstrap and core syntax small and instruction-like:
  simple operands and three-address operations such as `a = b + c;`.
- Do not put a precedence hierarchy, Term/Factor rules, or a general expression
  language in the base rules. Richer syntax belongs in Tower rules/replacements.
- Small shorthands are welcome when they fall naturally out of existing machinery
  without growing the base grammar. Do not pursue minimalism for its own sake.
- Use mutable, typed locals and a stack initially. Lower locals to entry-block
  allocas and loads/stores for LLVM; let mem2reg introduce SSA/phi nodes when
  promotion is valid. Users should not have to write phi nodes.
- Type-check core operations, assignments and control flow. Define pointer and
  alias behavior explicitly; require explicit conversions/reinterpretations
  instead of silently mixing incompatible types. Static typing does not imply
  mandatory runtime memory safety.
- Foundation pointers are raw address values with direct memory access. Do not
  encode storage-cell indexes, lifetime generations or display-name metadata in
  a foundation pointer, or require runtime bounds/lifetime/initialization checks
  as part of its semantics. Safe pointers, checked views, ownership and related
  guarantees belong in layers built in Tower above this raw foundation. Optional
  diagnostic instrumentation is separate from the ordinary foundation contract.
  Lower pointers to target pointers with explicit target layout; the interpreter
  may model target byte addresses without exposing unchecked host C++ memory.
  Wasm/host containment is not a Tower object-lifetime or bounds guarantee.
  This supersedes the prototype's checked-handle design, archived at commit
  8571a8d. Define invalid-access and strict compile-time policies
  explicitly rather than silently inheriting C++ or LLVM behavior.
- Keep built-ins and user structs in one type-object registry. Resolve ordinary
  type names semantically; struct and field metadata enrich the shared parse nodes.
  Preserve nominal identity and deterministic layout for an explicit target
  through formatting, interpretation and LLVM lowering. Current structs pass by
  pointer; aggregate copies/by-value calls need defined semantics before adding them.
- Make reflected layouts and actual value storage agree under the selected target
  profile, including raw pointer size/alignment and struct field offsets. Retire
  the prototype's checked-cell representation and 24-byte checked-pointer layout.
  External CPU/GPU ABI profiles and layout changes must be explicit; never infer
  interoperability from the compiler host's C++ sizeof or an arbitrary LLVM type.
- Build a small interpreter to explore these operations. Keep its semantics and
  representation suitable for real LLVM declarations, compilation and execution;
  the existing constant-return LLVM smoke test is not that implementation.
- Run browser compilation/execution in workers. Execution must be cancellable,
  allow live editing/restarting, and reject stale results without blocking the UI.
- Keep the playground's execution area and controls uniform for every source file,
  including Bedrock and Foundation. Never substitute formatted grammar source for
  compiled instructions or hide execution based on the selected filename. Bootstrap
  reader selection belongs to compiler loading, not special editor presentation.
- Always maintain docs/temporal-opcode-research-journal.md as the ongoing project
  journal. Update it with substantive research and sources, debugging findings
  and root causes, experiments/trials (including failures and rejected approaches),
  choices and their rationale, implementation results, validation, limitations
  and next steps. Record enough environment, commands and observed results to
  reproduce significant trials; distinguish proposals from implemented behavior
  and verified findings from assumptions. Preserve earlier entries and record
  corrections or superseding decisions explicitly. Honor explicit read-only
  requests by reporting findings in conversation and deferring journal writes
  until authorized.
- Treat optimization guarantees as specific, testable contracts with stated
  eligibility. Eventually recognize eligible if/else constant/range dispatch
  without requiring switch syntax; preserve evaluation order and effects, and
  leave table/bit-test/range-test/decision-tree selection to the target backend.
- Preserve typed operations, layouts and proven memory effects through lowering.
  Running mem2reg is not a promise that escaping allocations disappear, and
  backend optimization is not a promise of globally optimal machine code.
