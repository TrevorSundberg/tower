# Tower modules and named values

`bedrock.tower` defines declaration syntax, `foundation.tower` imports Bedrock
and defines executable foundation syntax, and `tower.tower` imports Foundation
and adds language conveniences. Compiler, runtime, backend and user code can all
import Tower. The foreign C/C++ declaration grammar remains in
`backend/foreign_grammar.tower`; it is not part of Foundation.
Tower also supplies [match/while and generic collection libraries](tower.md).
The [language plan](tower-language-plan.md) records the staged work beyond these
features, including selective imports, dependency queries and returned errors.

## Why the compiler imports Tower

`import tower;` is an ordinary file import, equivalent to `import "tower.tower";` when no host override is selected.
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
import lib.answer;

const Expected: i32 = 42;
print(Expected());
```

Project-owned Tower files and directories use identifier names with underscores,
not hyphens, and use unquoted imports. The last dotted segment is the filename;
earlier segments are directories. Only unquoted imports infer the `.tower` suffix.
Each leading dot moves up one directory:

```tower
import foo.bar.baz;              // foo/bar/baz.tower
import .shared.helpers;         // ../shared/helpers.tower
import ..shared.helpers;        // ../../shared/helpers.tower
import "foo/bar/baz.tower";      // the same file as foo.bar.baz
import "./helpers.tower";        // force the current directory only
import "tools/file-name.tower";  // arbitrary user filenames remain supported
```

Leading-dot imports are anchored to the importing file, without library fallback.
Dots select files; use an explicit alias to bind a namespace. Backtick-escaped
identifier segments can represent names such as ``foo.`schema.v2` ``. Quoted paths
remain useful for absolute paths, assets, names containing separators or spaces,
and filenames with literal dots. Importing a file still parses Tower source;
this change does not introduce an image or other binary-asset loader.

Quoted imports specify the complete filename with its extension, if any. They
never append `.tower` or select a host builtin-name override. Directory and file
names must match case exactly, even on Windows and case-insensitive POSIX volumes.
The native loader checks directory entries; browser files use exact source keys.
Native POSIX checks require permission to enumerate the containing directories.
Windows drive letters are normalized to uppercase; UNC server/share roots retain
the platform's lookup semantics. This is not a claim to normalize Unicode names
or make platform-invalid filenames portable.

Use `/` as the portable quoted spelling. Escaped backslashes are also accepted
and formatted as slashes. Quoted `./` and `../` paths have no library fallback.
Absolute paths remain machine-specific: a Windows drive is not a Linux mount.
Paths and `..` are normalized lexically **before** file reads. Symlinks are
followed by the filesystem, but their targets are not module identities: two
symlink/hard-link aliases may load the same file twice and repeat initialization.
A symlink cycle can reach the depth limit. Lexical `link/../file` need not mean
the same file as walking that path through the filesystem. These are existing
resolver policies, not guarantees provided by the dotted spelling.

Put imports before the file's own declarations and statements. Resolution
tries the importing file's directory, then the explicitly configured library
directory. Native compilation uses the selected Foundation directory first and
the packaged resource directory as a fallback, except for explicit relative paths.
Canonical lexical paths identify modules, so dotted, quoted and separator variants
of one file share its identity and execute its effects once. Missing modules, invalid cycles,
invalid UTF-8/NUL bytes, sources above 8 MiB and nesting above 128 modules produce
diagnostics. The size limit is per source, not an aggregate graph limit.

Each imported file starts from the immutable declaration seed and imports the
grammar it needs. Dependencies run once in dependency-first order; sibling
dependencies follow import order. A diamond imports its shared dependency once.
Declarations bind across their own file and its direct imports; effects retain
that order. Two files may define the same name. Imports do not imply separate
object compilation. Declaration-only cycles are supported; a cycle containing
grammar updates or initialization effects is rejected because those operations
require an unambiguous dependency-first order. Self imports remain errors.

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

`compiler/frontend_modules.tower` owns resolution, source validation, dependency
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

## Module scopes and aliases

Both path forms accept aliases:

```tower
import tower;
import left.tools as left;
import "right/tools" as right;

print(left.helper());
print(right.helper());
var item: left.Item;
left.count = 3;
```

Each module resolves names from its own declarations and explicit imports.
An unaliased import makes that file's declarations directly visible. An aliased
import makes them available as `alias.name`, including functions, nominal types,
globals, generic functions and type constructors. For example, `types.Box(i32)`
is a qualified type application and `types.Mode.Ready` names an enum member.
Aliases do not change the imported grammar: grammar composition remains local
and incremental through the existing declaration machinery.

Own declarations take precedence over open imports. If two open imports supply
different declarations of the same name, using that name reports ambiguity;
qualify it through an alias. Importing the same file twice does not introduce
ambiguity or repeat initialization. Duplicate aliases, aliases conflicting with
own declarations, and aliases using Foundation builtin names are errors. A local
variable may shadow an alias within its lexical scope.

Imports are not implicit re-exports. Import a declaration's defining file directly;
importing an aggregator does not expose its dependencies' ordinary functions or
types. A module cannot see a sibling merely because the entry imported both.
Selective imports and explicit re-exports remain future work. `export` continues
to specify a foreign link symbol, independently of source visibility. Compatible
`extern` declarations of the same link symbol coalesce and may resolve to a
matching Tower `export`; incompatible signatures and duplicate exports fail.
Build-selected implementations use explicit interface modules for this purpose.

Module ownership and import relationships live on retained syntax entities.
Per-compilation tables are derived lookup indexes. Cached grammar import trees
are copied before acquiring compilation-specific metadata. Function bodies and
generic instantiations retain their definition module; call sites cannot silently
supply a missing dependency. Declarations remain forward-visible within a file,
while initialization retains source order.

Canonical Foundation flattens the resolved program with deterministic escaped
names for colliding bindings. It remains compilable text and preserves identity,
order and effects. Source formatting retains aliases; completion and hover use
module visibility and original source names. Separate objects, selective imports,
re-exports and declaration-level incremental dependency queries are later work.
Grammar replacements retain their existing substitution rules; this binding
milestone does not add hygienic macro bindings.

## Playground

The first Tower file is the project entry. Other files are available to imports;
they are not silently appended. Moving a file to the top changes the entry.
The library tree displays the project's actual dependency closure and refreshes
after edits. Imported bundled modules, including Tower and library modules, can
be selected, viewed, edited, restored and saved with the project. Unused bundled
modules are available to import but absent from the tree. Legacy projects without
imports show their implicit Bedrock/Foundation dependencies.

## Bootstrap requirement

Building these sources requires an **expression-capable Tower-built host compiler**:

```sh
export TOWER_BOOTSTRAP_COMPILER=/absolute/path/to/towerc
bash playground/scripts/build-native.sh
bash playground/scripts/build-wasm.sh
```

The bootstrap must support module scopes, aliases, declaration-only import cycles,
compatible foreign-declaration linking, leading-parent-dot imports and exact quoted
filenames. It must also support Tower's numeric grammar precedence annotations,
compound expressions and lazy operators. Preserve the predecessor's accompanying
`share/tower` resources when copying its executable; copying only `towerc` can load
incompatible grammar sources. A compiler from before the expression update cannot
build this revision merely by loading the new `tower.tower`. The old native seed does not implement
imports. Build scripts require an explicit previous compiler instead of trying to
extend or regenerate that seed. Historical seed
targets are excluded from default builds. This change does not publish a portable
bootstrap compiler release; distributing validated host binaries remains the
bootstrap/distribution integration dependency. The import implementation and
functional tests are Tower source.
