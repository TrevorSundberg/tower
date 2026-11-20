# Tower modules and named values

`bedrock.tower` defines declaration syntax, `foundation.tower` imports Bedrock
and defines executable foundation syntax, and `tower.tower` imports Foundation
and adds language conveniences. Compiler, runtime, backend and user code can all
import Tower. The foreign C/C++ declaration grammar remains in
`backend/foreign-grammar.tower`; it is not part of Foundation.
Tower also supplies [match/while and generic collection libraries](tower.md).
The [language plan](tower-language-plan.md) records the staged work beyond these
features, including file namespaces and returned errors.

## Why the compiler imports Tower

`import tower;` is an ordinary file import, equivalent to `import "tower";`.
The name is not reserved and does not refer to `tower.wasm`, a compiler service,
or the entire compiler project. It resolves `tower.tower` using the same search
rules as every other module. That file defines surface syntax such as `const`,
`match` and `while`. Its dependency chain is:

```text
compiler source -> tower.tower -> foundation.tower -> bedrock.tower
```

The Tower Compiler playground project includes all three as ordinary editable
files and sets its library directory to the project root. Nested compiler files
therefore find that project's `tower.tower`. Other playground projects normally
find the bundled copy in `.tower/`; the **library** badge describes where the
source came from, not special import semantics. A nearer file shadows it, a
missing file is an import error, and renaming the files and updating their
imports works. Imported grammar edits invalidate dependent parses normally.

There is no circular build: the **already running compiler** reads these source
files and emits the **next compiler**. After that successor passes validation,
it can compile the following generation. Importing a language's syntax while
implementing its compiler is an ordinary dependency on source definitions.

Some bootstrap machinery still is special. The immutable declaration seed reads
the first grammar declarations and imports. Hosts install a compatibility
Foundation baseline for files without imports, and native `--bedrock` and
`--foundation` explicitly override module paths. Native runtime/adapters and
LLVM/LLD also remain in the compiler's link support. None of these make `tower`
a special import or make the compiler fully standalone today.

Continue toward standalone builds by porting the remaining project-owned native
code into imported Tower modules, replacing the native declaration seed after a
validated Tower successor exists, and moving host-selected grammar setup into
explicit entry dependencies. Keep bootstrap executables as the previous compiler
generation, not as magic modules. Each step must retain source dependency tracking,
round trips and successive-generation checks. These are remaining migration
steps; ordinary `import tower;` resolution is already implemented.

## Import rules

```tower
import tower;
import library.vector;
import "lib/answer";

const Expected: i32 = 42;
print(Expected());
```

Imports omit `.tower`. Use dotted identifiers for ordinary module names and
strings for relative paths or filenames that are not identifiers:

```tower
import foo.bar.baz;          // foo/bar/baz.tower
import "foo/bar/baz";        // the same file
import "../shared/helpers";  // relative to this importing file
import "tools/file-name";    // filenames outside the identifier spelling
```

The last dotted segment is the filename; earlier segments are directories.
Dots select files and do not yet create namespace bindings, aliases or qualified
function names. All imported declarations still bind across the resolved program.
Keep literal dots in filenames inside strings, such as `"tools/schema.v2"`;
escaped identifier segments are also preserved by formatting.

Use `/` as the portable source spelling. Quoted strings also accept escaped
backslashes (`"..\\shared\\helpers"`); the loader normalizes them to `/`, and
the formatter emits that canonical spelling. `.` and `..` are resolved lexically.
Paths beginning with `./` or `../` stay relative to the importing file, with no
library fallback. Absolute paths remain machine-specific; normalization does
not translate a Windows drive into a Linux mount point. Symlinks are not resolved.

Put imports before the file's own declarations and statements. Resolution
tries the importing file's directory, then the explicitly configured library
directory. Native compilation uses the selected Foundation directory first and
the packaged resource directory as a fallback, except for explicit relative paths.
Canonical lexical paths identify modules, so dotted, quoted and separator variants
of one file share its identity and execute its effects once. Missing modules, cycles,
invalid UTF-8/NUL bytes, sources above 8 MiB and nesting above 128 modules produce
diagnostics. The size limit is per source, not an aggregate graph limit.

Each imported file starts from the immutable declaration seed and imports the
grammar it needs. Dependencies run once in dependency-first order; sibling
dependencies follow import order. A diamond imports its shared dependency once.
Declarations bind across the resulting program; effects retain that order.
There are no namespaces or import aliases yet, and duplicate bindings still
produce semantic errors. Imports do not imply separate object compilation.

Grammar updates are local to the file being parsed. Importing a module applies
its dependencies and local declaration changes, preserving `=` versus `|=`.
Overriding a rule in one sibling does not change the grammar used to parse another
sibling. Files without explicit imports retain the installed Foundation baseline
for compatibility. Small grammar examples can import Bedrock alone.

`const Name: Type = value;` is a Tower rule that expands into an ordinary
zero-argument function. Read it with `Name()`. `export const` exports that
function. This supplies named values without adding a special constant evaluator,
memoization contract or new Foundation operation. It is not enum syntax, implicit
expression substitution, or a promise that every call is folded. The same
ordinary Tower execution semantics apply. Foundation kind/opcode/scalar tags and
foreign ABI profiles now use these named values.

## Compiler API and dependencies

`compiler/frontend-modules.tower` owns resolution, source validation, dependency
order, import grammar composition, source locations and Make-style dependency
output. Its module components retain source snapshots and actual shared syntax
entities. The semantic compiler still attaches Foundation components to those
same entities; it does not receive a separate semantic IR.

Native and browser transports create a `ModuleEnvironment`, configure an entry
path/library root, and supply explicit source inputs. Native file reads use that
environment's paths. Browser inputs come from the project snapshot. Explicit native builtin selections take precedence for their module name. Builtin
overrides retain the selected source's real path. Compilation consumes one entry
and its import closure. Canonical Foundation output flattens the resolved program
into ordinary compilable Foundation, preserving bindings and execution order.
Per-compilation source maps retain imported-file diagnostics.

Compilation parser sessions are now exclusive leases owned by their module graph.
Asking the same module for its session again preserves its cursor and grammar;
another active module gets a different session. Each environment retains at most
one idle session for parser-table reuse. A grammar reset retires the cache
generation while active requests keep their sessions; retired leases are disposed
when their graphs drain. `frontend_modules_try_destroy` rejects disposal while
request graphs remain live. Existing `frontend_modules_destroy` requires that
same drained state.

Lease bookkeeping, input changes and source/diagnostic publication remain
coordinator-owned. This is not permission to mutate an environment concurrently.
Native grammar baselines and component registries still prevent full independent
compiler worlds within one native instance; browser workers remain isolated.

Declaration-only module caches are bounded to 16 snapshots. Reuse checks source
bytes and current dependency resolution, including newly added nearer files.
The compilation environment also reuses the bounded parser-table cache. Ordinary
parse trees acquire program-specific semantic components and are never reused
across compilations. Source inputs and dependency paths are available
independently of CLI or browser transport.

`towerc entry.tower --depfile output.o.d --library -o output.o` writes the
transitive source dependencies. Build fragments generate small import manifests
and consume these depfiles rather than concatenating source or scraping native
enum declarations. `--bedrock` and `--foundation` still select builtin overrides.

## Next milestone: module scopes and aliases (planned)

File resolution now preserves canonical module identity, but semantic compilation
still collects every imported module's statements into one program-wide binding
environment. The next module task is to preserve that ownership during name
resolution. This is the bindings milestone in the
[language plan](tower-language-plan.md#dependency-order-and-milestones), not
implemented syntax yet.

Two independent files should be able to define `helper` without a duplicate-name
error. A module must also resolve its function bodies from its own declarations
and explicit imports: adding a sibling import to the entry must not silently
make that sibling's functions visible inside another module.

The first complete slice should:

1. Retain each declaration's canonical module owner and import relationships on
   the existing shared entities. Derive per-module lookup indexes from them;
   preserve forward declarations and lexical local scopes.
2. Add an alias form for either path spelling, such as the proposed
   `import left.tools as left;` and `import "right/tools" as right;`, with
   `left.helper()` and `right.helper()` resolving to distinct entities. Bind by
   canonical module identity, not filename basename or alias text.
3. Make ordinary imports establish visibility in the importing module. Audit and
   migrate compiler/library imports that currently rely on accidental transitive
   or sibling visibility. Keep source visibility separate from foreign-symbol
   `export`; explicit selective imports/re-exports can follow this slice.
4. Preserve dependency-first, once-only initialization and file-local grammar
   composition. Keep deterministic compilable Foundation output with unique
   spellings for distinct bindings, plus original names/source metadata for
   diagnostics, formatting, completion and hover.

Completion requires same-basename and same-local-name collision tests, rejection
of undeclared sibling access, alias ambiguity diagnostics, diamond effects,
forward/type/template bindings, canonical Foundation round trips, agreement
between both interpreters and LLVM/C output, and successive browser compiler
builds including activation/reset. This is a language/binding change; separate
object compilation and declaration-level incremental caching remain later work.

## Playground

The first Tower file is the project entry. Other files are available to imports;
they are not silently appended. Moving a file to the top changes the entry.
The library tree displays the project's actual dependency closure and refreshes
after edits. Imported bundled modules, including Tower and library modules, can
be selected, viewed, edited, restored and saved with the project. Unused bundled
modules are available to import but absent from the tree. Legacy projects without
imports show their implicit Bedrock/Foundation dependencies.

## Bootstrap requirement

Building these sources requires an **import-capable Tower-built host compiler**:

```sh
export TOWER_BOOTSTRAP_COMPILER=/absolute/path/to/towerc
bash playground/scripts/build-native.sh
bash playground/scripts/build-wasm.sh
```

The old native seed does not implement imports. Build scripts now report this
requirement instead of trying to extend or regenerate that seed. Historical seed
targets are excluded from default builds. This change does not publish a portable
bootstrap compiler release; distributing validated host binaries remains the
bootstrap/distribution integration dependency. The import implementation and
functional tests are Tower source.
