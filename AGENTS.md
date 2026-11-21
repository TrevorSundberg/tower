Do NOT modify todo.txt

## Turn workflow

- Work directly on `main`; do not create or use feature branches.
- At the beginning of every turn, run `git pull --rebase` before starting work so
  the checkout includes the latest upstream changes. Preserve any existing local
  work and resolve rebase conflicts without discarding it.
- At the end of every turn, commit the turn's changes, run `git pull --rebase`
  again, resolve any conflicts and run the appropriate validation, then deploy
  and push the commits. Follow this workflow for documentation-only turns too.
- Use the established deployment process and verify the published result. If a
  pull, rebase, deployment or push is blocked, report the specific blocker;
  never claim an unfinished step succeeded or force-push to bypass it.
- Never push compiler sources that require a newer bootstrap unless that bootstrap
  is already available through the repository's documented build path. Implement
  new syntax using the previous language first, build and validate a successor,
  publish/pin its complete executable and resources (with hashes/provenance), and
  only then migrate compiler sources to the new syntax. A compiler saved in an
  agent's local cache does not satisfy this requirement. Test a clean build with
  no private bootstrap environment variable before pushing a migration. Clearly
  distinguish a platform-specific development bootstrap from a portable release.
  Repeat that clean successor build after rebasing onto source changes; a bootstrap
  validated before a rebase may not support newly merged import or syntax changes.

## Module names and imports

- Project-owned Tower module, library, file and directory names use identifiers
  with underscores, never hyphens. Audit references, build manifests, browser
  packaging, tests and docs when renaming them. User files need not follow this rule.
- Prefer unquoted imports for all project-owned Tower sources: `import library.vector;`.
  The last segment is the filename with `.tower` omitted. Each leading dot moves
  up one directory: `import .compiler.syntax_types;` means
  `../compiler/syntax_types.tower`, and `..foo` means `../../foo.tower`.
- Leading-dot imports are anchored to their importing file, without library
  fallback. Bare names search the importing directory and configured libraries.
- Quoted imports remain supported for arbitrary filenames and explicit paths.
  They name the complete file, including `.tower` when present, and match directory
  and filename case exactly on every host, including Windows. Do not infer an
  extension or apply builtin-name aliases to a quoted path. Assets may keep quoted
  relative paths; string-import tests intentionally exercise this syntax.
- Keep lexical module identity distinct from filesystem identity: symlinks are
  followed by file reads but are not canonicalized into one module identity.
  Do not claim symlink aliases execute once or that lexical `..` resolves symlinks.

## Writing Tower code

- Use the existing ECS entities/components and compilation-local scratch for new
  checking/lowering. Independent units use CompilerWork's isolated workers and
  deterministic publication; never share mutable entity pointers or iteration
  state across workers. A sequential loop is not a parallel scheduling contract.
- Prefer `foreach (var item in &values)` for stable, finite collection traversal.
  Use `foreach (var &item in &values)` for element writes or aggregate borrows;
  the latter binds an element pointer. Keep the owner alive and structurally
  unchanged through the loop, including indirect calls. Growth/disposal/reordering
  invalidates these raw borrows. Keep counted loops for changing bounds, index
  coordination or later counter use. Custom nominal types associate ordinary
  `<declaration>_iterate_begin/next/element/end` functions in their own module;
  see docs/borrowed-iteration.md. Publish the compatible bootstrap before adoption.
- Prefer inferred generic call arguments when typed operands determine them,
  e.g. `vector_push(&values, item)`. Keep explicit arguments for unresolved type
  parameters or when they explain an otherwise ambiguous call. Omit all type
  arguments together; partial omission is not supported. Deduction uses exact
  types and nominal specialization metadata, follows straight-return type aliases,
  and introduces no implicit conversions. Typed peers constrain integer literals;
  a bare unconstrained integer uses the existing i32 default, and null alone
  cannot determine a type. Publish a compatible bootstrap before migrating calls.
- Implement Tower language features, checking and lowering in `.tower`. Do not
  introduce C/C++ implementations or native helper code for these features; use
  the existing compiler/formatter tools to validate them.
- Use `for (var i: usize = 0; i < count; i++) { ... }` for counted traversal
  when initialization, condition and update describe one loop. Its initializer
  has loop scope; condition and update bind outside the body's scope. `continue`
  executes the update, while `break`/`return` skip it. Keep `while` for sentinel
  tests, queue draining and other condition-driven work. When migrating old loops,
  preserve dynamic bounds, counter visibility, effects and skipped updates; an
  old `continue` may intentionally bypass a trailing increment. General collection
  `foreach` follows the finite borrowed-view contract described above.
- Use `defer cleanup(resource);` or `defer { ... }` for explicit cleanup that
  belongs to a lexical scope, especially repeated early-return cleanup. Register
  it after successful initialization. Cleanups run in reverse registration order
  on fallthrough, return, break and continue; return values are evaluated first.
  Names bind where defer is written, but values and call arguments are evaluated
  at scope exit. Preserve ownership transfers, cleanup order and prompt release;
  use a smaller block when a resource must be released before later work. Keep
  explicit cleanup when those conditions do not match. This is not automatic
  destruction or trap unwinding. Deferred code may use its own loops but cannot
  return or jump out; functions combining defer with explicit labels are rejected.
- In files that import `tower`, prefer its normal expression syntax: nested
  calls, parentheses, arithmetic/comparison/bitwise operators, `!`/`~`, `&&`/`||`,
  `?:`, and prefix/postfix `++`/`--`. Use clear expressions instead of generated
  single-use temporaries or empty `if ok {} else { ... }` success branches.
  Keep named intermediates when they explain a concept or make effects clearer.
- Prefer compound assignments for updates to the same place, including `&&=`,
  `||=`, and `??=`. They share the underlying binary operator semantics and
  capture the destination exactly once. Logical/null compounds evaluate their
  right side only when needed; preserve that behavior when simplifying code.
- Use `??` for lazy pointer fallbacks and `?.`/`?[]` for guarded access. Pointer
  results can remain null; scalar guarded results currently require a `??`
  fallback. Do not pretend an absent scalar is zero or invent nullable scalar
  storage. `is null`/`is not null` are available; `.` handles struct pointers,
  and Tower has no `->` operator. `>>>`/`>>>=` perform logical right shift.
- Use named constants for operation tags, flags and sentinels. Prefer a typed
  complement such as `~convert(u64, 0)` when expressing an all-ones mask. Do not
  replace meaningful numeric data or stable external ABI values blindly.
- Operators retain Tower's exact typing, left-to-right evaluation, wrapping
  arithmetic and explicit conversions. Shift counts are masked by width minus
  one; `>>` extends signed values and `>>>` zero-fills. Signed-minimum literals
  must keep their exact magnitude until range checking; never overflow a signed
  host intermediate or add interpreter-only arithmetic behavior.
- Parentheses determine grouping and are transparent to semantic type inference.
  Use the common operand-unwrapping helper for literal/type queries, while keeping
  source grouping and provenance for formatting. Typed peers constrain literals;
  incompatible typed values require explicit conversions.
- Keep this syntax in `tower.tower` and its shared-node checking/lowering above
  Foundation. Numeric grammar annotations (`@ N left/right/nonassoc`, including
  `L>R`/`R<L`) resolve eligible conflicts during table construction; ordinary
  recursive precedence rules remain supported. Associativity does not authorize
  commuting/reordering effects. Foundation and Bedrock stay small.
- When adding an operator, reuse the common operation classification, type
  rules and compound-assignment lowering. Grammar may list separate `op=`
  tokens; avoid duplicating each operator's semantics for its assignment form.
  Validate sequencing, aliasing, lazy effects, canonical Foundation round trips,
  both interpreters and LLVM/Wasm. Audit eligible existing Tower code too, while
  preserving Foundation-only examples and intentionally invalid test fixtures.

## Compiler ECS and threading

- Put syntax/AST/parse and semantic data on the same world-owned entities and
  components. Tables, queues and execution caches are derived indexes, never a
  second authoritative graph. Preserve compilable Foundation round trips.
- Pass world/session ownership explicitly; keep mutable globals and default-world
  access confined to legacy adapters. Workers own their scratch, diagnostics and
  interpreter state; shared inputs must remain immutable during dispatch.
- Schedule compiler queries through the shared dependency graph. Request only
  needed type/body/layout/evaluation work; suspend on newly discovered dependencies
  rather than blocking a worker or recursively forcing completion. Diagnose cycles
  and reject stale revision/profile/dispatch tickets. Known-value evaluation uses
  the ordinary Tower interpreter, never a separate pre-LLVM folding evaluator.
- Declare component read/write ranges and exclusive ownership before dispatch.
  A pinned view is not a payload lock. Publish structural changes, type interning,
  shared indexes and reference ownership on the coordinator after joins, using
  stages/leases. Cancellation must drain work before releasing its inputs.
  New syntax must update worker admission when its lowering can construct types
  or instantiate implicit protocol calls; test it inside independent bodies too.
- Validate relevant changes against serial execution: canonical output and
  diagnostics must be deterministic across worker counts. Exercise real overlap,
  dependency failures/cycles, cancellation and lifetime cleanup; queue width alone
  is not proof of threading. Measure useful batch sizes before claiming speedups.

## Compiler direction

- Call Tower's built-in primitives and bootstrap grammar its **foundation**.
  Functions, typed parameters, calls and returns belong to the foundation;
  richer surface syntax is built above it with Tower rules and replacements.
- Hard requirement: Tower's canonical graph and foundation operations have a 1:1 semantic
  correspondence with foundation constructs and serialize to compilable
  foundation source. Every public Tower operation needs a foundation spelling;
  a pretty debug dump alone does not satisfy this. Foundation text is the only
  Tower program semantic interchange/storage format; do not create an independent
  binary graph or public instruction ABI. The explicitly requested `.towerbc`
  distribution envelope may contain canonical foundation plus a versioned compact
  execution cache. Validate versions, target/semantic profile and section bounds,
  reconstruct/check the foundation graph, and verify the cache before execution.
  Its foundation reconstruction must remain compilable and reversible. Platform
  object/executable output is a separate concern.
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
  Constant evaluation invokes ordinary Tower code under this same contract;
  share runtime operation semantics rather than creating a host-dependent
  constant evaluator. This is a primary reason for the deterministic runtime.
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
  and tokens without mutating that seed. Use the same update path for all files.
  Explicit modules start from the declaration seed and import the grammar they
  need: Foundation imports Bedrock, Tower imports Foundation, and user modules
  import these ordinary files. The host-installed Foundation baseline remains a
  compatibility path for files without imports, separate from module resolution.
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
