# Tower modules and named values

`bedrock.tower` defines declaration syntax, `foundation.tower` imports Bedrock
and defines executable foundation syntax, and `tower.tower` imports Foundation
and adds language conveniences. Compiler, runtime, backend and user code can all
import Tower. The foreign C/C++ declaration grammar remains in
`backend/foreign-grammar.tower`; it is not part of Foundation.

```tower
import tower;
import "library/vector";
import "lib/answer";

const Expected: i32 = 42;
print(Expected());
```

Imports omit `.tower`. A bare identifier or quoted path is accepted, followed by
`;`. Put imports before the file's own declarations and statements. Resolution
tries the importing file's directory, then the explicitly configured library
directory. Native compilation uses the selected Foundation directory first and
the packaged resource directory as a fallback. Quoted relative paths support `.` and `..`. Canonical lexical paths
identify modules; symlink aliases are not resolved. Missing modules, cycles,
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

## Playground

The first Tower file is the project entry. Other files are available to imports;
they are not silently appended. Moving a file to the top changes the entry.
The builtin tree displays the project's actual dependency closure and refreshes
after edits. Imported builtin modules, including Tower and library modules, can
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
