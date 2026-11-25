# Development bootstrap

The checked-in `linux-x64/towerc` and its adjacent `share/tower` resources run
directly from the checkout. `build-bootstrap.sh` verifies every pinned member
with the platform `sha256sum` command and returns the compiler path. There is
no installer, unpacking step, bootstrap cache or Python dependency on this path.
`TOWER_BOOTSTRAP_COMPILER` remains an explicit development override.

The current pin includes the Tower hosted ELF linker and `--link-executable`,
world-owned compiler work, dependency scheduling and the published ECS storage
improvements, SCC provider, parser optimizations, quota diagnostics and semantic
scratch-memory repair, guarded import reuse, component-page buckets and checked
syntax reset/expansion ownership, literal-query filtering, lowering frontier,
capture-scan reuse, LR range ordering, raw-owner page savings and LR shift indexing.
The predecessor at `c49c8b37` added reachable-production grammar emission, shared
LR predictions and budgeted worker scratch that transfers to the graph after joins.
The compiler in this checkout was built from `cd77a1f7adfdf3a61ed44a465d1a5625bff29fdb`
on Ubuntu 24.04.5 with Clang/LLVM 19.1.1. The package commit is
`a77dbf9f08d7e0c72b6a5df0318f977c4aa72ce1`. Its 2,275,024-byte executable
has SHA-256 `5582c3c5e89ee8ce72306cdb612977d3ee39c24560bbba359eb5e893c6f21fc4`.
Three Ubuntu production generations matched on all 39 native products.
Generations two and three reproduced the delivered archive. The preceding public
compiler was built from `902a358f`. The [Linux install instructions](../README.md#install-the-linux-x64-development-compiler)
give each compiler its own prefix and immutable installer command.
See the [9ab581c8 pin and host verification](../docs/temporal-opcode-research-journal.md#canonical-linux-production-generations-at-9ab581c8)
and [previous generation record](../docs/compiler_generation_c49c8b37.md). Executable and
adjacent resources are hashed together in `development.json`, including the
shared graph-components library and corrected optional foreign grammar. Later
browser-project packaging and test changes retain their separate source identity.
An empty-cache successor build through the default path, without a private
bootstrap override, builds and links the compiler and its Linux helper tools
using Tower. The separate host linker argument has been removed from `build_tools`.
It also includes computed integer type arguments and array extents, staged helper
calls and immutable captures, and ordinary opaque type values with identity-preserving
Foundation output. See [computed type arguments](../docs/computed-type-arguments.md)
and [type values](../docs/type-values.md) for their scope and remaining limits.

This is a **Tower-built Linux x64 development bootstrap** for Ubuntu 24.04 with
system LLVM 19 and its runtime dependencies. All project-owned compiler/runtime
implementation is Tower; LLVM and platform libraries remain external. It is not
a standalone native Windows/macOS/Linux release. `docker/Dockerfile` supplies the
dependencies; use the explicit Linux container on other hosts:

```sh
./build.sh bash playground/scripts/build-native.sh
```

From Windows PowerShell with Docker Desktop, at the repository root:

```powershell
docker build --platform linux/amd64 -t tower_build docker
docker run --rm --platform linux/amd64 -v "${PWD}:/work" -w /work tower_build bash playground/scripts/build-native.sh
```

The documented Ubuntu/LLVM environment in WSL can run the same build directly:

```powershell
wsl -d Ubuntu -- bash playground/scripts/build-native.sh
```

These commands build `build/native/towerc` plus its complete resources without
compiling a project-owned C/C++ seed. The browser compiler at
[tower-lang.org](https://tower-lang.org/) is another host-independent route for
editing, rebuilding and downloading compiler output.

`development.json` schema 2 records the executable hash, every member's hash and
size, build provenance, source input hashes and optional source patch. Its
`directory`, `executable` and `checksums` fields describe the checked-in layout;
`sha256` now identifies the executable. `linux-x64/SHA256SUMS` is the directly
consumable verification list. The initial schema-2 migration retained the previous
compiler/resources and recorded their `archive_origin`; subsequent pins record
their own directly built executable. The checkout uses these files directly;
the one-command installer downloads the same verified package for users without
a checkout. Preserve frozen resource bytes and the compiler's executable
mode when publishing or checking out a pin.

The current pin supports signed `i8`/`i16` and unsigned `u16` in addition to `u8`,
including exact layouts, checked conversions and ordinary staged arithmetic.
See [byte and short integers](../docs/narrow-integers.md). It supports scalar
`f32`/`f64`, strict shared staged/runtime arithmetic,
and ordinary unary negation including integer `-0` and exact signed minima.
See [the floating contract](../docs/floating-point.md) for numeric and backend limits.
Typed `function(Result, Parameters...)` values and indirect calls work in the
portable interpreter and LLVM native/Wasm output, including compile-time calls,
callback inference and internal struct arguments/results. See
[function values](../docs/function-values.md) for ABI and backend limits.
It supports shared bracket grammar attributes, typed declaration attributes
constructed by ordinary staged Tower functions, and struct-valued `comptime`
results. See [attributes and staged values](../docs/attributes.md). Bedrock's
standard declarations use `[comment]`, `[contextual]` and style markers; numeric
Tower precedence uses `[precedence(level, direction)]`.
It also supports struct copies/by-value calls, named-field/default initialization,
expression operators, `for`/`defer`, borrowed `foreach`, generic call inference,
identifier module paths and exact quoted imports. Build new syntax with the
preceding pin, publish a compatible successor with complete resources, and only
then adopt the syntax in compiler/build-tool sources. Validate the final rebased
source through the default clean build before publishing.

## Tower build tools

The same environment builds the LLVM script preparer, Roku and bootstrap
packagers, and compiler/bootstrap verifiers through the public compiler and
existing runtime:

```sh
tools="$(bash playground/scripts/build-bootstrap.sh --tools)"
"$tools/package_roku" program.brs program-roku.zip
```

Pass a tool name after `--tools` to build only `prepare_llvm`, `package_roku`,
`package_bootstrap`, `package_compiler_project`, `package_targets`,
`package_playground_assets`, `verify_compiler`, `verify_bootstrap_symbols` or
`check_core`. Omitting the name builds these nine ordinary tools.

The opt-in `build-bootstrap.sh --tools instrument_llvm` entry builds A2's
Linux x64 LLVM sanitizer tool using the same public compiler, guest-library
runtime and discovered LLVM shared library. It does not rebuild the ordinary
tool set. See [actual Tower instrumentation](../docs/compiler_sanitizer_checks.md)
for supported modes, sensitivity controls and coverage limits.

Build children use CMake's `TOWER_COMPILER_JOBS` worker budget (default `1`),
independently of outer `TOWER_BUILD_JOBS`/Ninja parallelism. For a two-worker
single-object build, use `TOWER_BUILD_JOBS=1 ./build.sh bash
playground/scripts/build-native.sh -DTOWER_COMPILER_JOBS=2`. Keep the product of
outer processes and per-compiler workers within the host CPU/memory budget.
The tools bridge passes its configured value to `build_tools` as the required
`JOBS` argument after `GUEST_HOST_OBJECT`. Configure the tools cache with
`-DTOWER_COMPILER_JOBS=2` when intentionally overriding it. Nonpositive or
nondecimal CMake values fail configuration; the compiler's existing `--jobs`
parser rejects values outside its supported capacity. Direct user `towerc`
invocations retain their existing default worker policy.
The small foreign fixture compiled after the Wasm build explicitly uses one
worker; that separate shell command does not inherit CMake cache options.

`package_targets RUNTIME_RESOURCE_DIRECTORY TARGET_DESCRIPTION_DIRECTORY CLANG OUTPUT_DIRECTORY`
uses the native package's existing bound runtime IR and the repository's target
descriptions to produce five runtime objects, `kernel32.lib` and `libSystem.tbd`.
Tower writes the Windows short-import metadata and indexed archive; Clang consumes
the existing target IR with the runtime's established freestanding flags. No
`llvm-dlltool` or native CMake build directory is required for packaging.
The Windows object disables incremental-link timestamps for repeatable bytes.
The import definition subset is `LIBRARY bare.dll`, `EXPORTS`, then one bare
function name per line (up to 256); aliases, ordinals and data/visibility flags
are rejected. Packaging stages the complete set before replacing files, with
atomic replacement per file. Failed stages remain available for inspection;
concurrent consumers still need an external generation/publication lock.

`verify_bootstrap_symbols --compare` consumes an explicit predecessor, successor,
source/build directories and `llvm-nm`; it compares seven compiler components
across four targets without rebuilding the native compiler. It also verifies
custom/missing grammar inputs. See the [comparison command](../docs/bootstrap-distribution.md#whole-compiler-release-requirements).
The original single-unit symbol-file mode remains available.

`build-llvm.sh` invokes `prepare_llvm` automatically for temporary CRLF
normalization of upstream `config.guess`/`config.sub`. Files
already using LF are untouched. Its EXIT trap restores exact original bytes;
if a source has since changed or restoration fails, the tool reports and retains
the private backup directory for recovery. Each script has a 1 MiB input limit.
The Roku ZIP/CRC/DEFLATE implementation is Tower with no zlib link; see the [Roku guide](../docs/roku-backend.md)
for codec scope and device-testing limits. `package_playground_assets DIST_DIRECTORY`
uses the same codec to compress compiler reactors and writes the deployment's
SHA-256 manifest in Tower. It consumes a prepared generated directory; esbuild
and browser asset collection still use Node. `TOWER_TOOLS_BUILD` selects the tools
build directory (default `$HOME/.cache/tower/tools`), and `LLVM_CONFIG` selects
the host LLVM installation (default `llvm-config-19`). Wrapper stdout is only the
resulting directory; build output goes to stderr. A small existing CMake bridge
builds the Tower builder/runtime; Tower owns the tool compilation/link arguments.
The [distribution checks](../docs/bootstrap-distribution.md#validation-and-measurement)
use `verify_compiler` directly; the verifier and its assertions are Tower.
Its `--development-package COMPILER FIXTURE_DIRECTORY OUTPUT_DIRECTORY` mode runs
both development and expected-missing-Clang checks against the package already
copied by the native build, creating fresh reports without staging another copy.
Wider test and upstream build tooling still needs migration.

Compiler import lists, including backend, host and parser profiles, live
in `scaffolding/compiler/units/`. CMake selects the native, browser or test root
and consumes the compiler's depfile for its transitive imports. Host and parser
selection produces a one-import entry in the build directory so the bootstrap
comparator and browser packager consume the actual configured profile. Other
fixed roots are read directly. No source-member lists are generated for these
units; the browser packager preserves their existing unit/object names.

Backend selectors also import the configured LLVM target registry and, for WASI,
the generated runtime module. The existing Tower foreign build tool reads LLVM's
`Targets.def`, `AsmPrinters.def` and `Disassemblers.def` with `--llvm-targets
LLVM_CONFIG_DIRECTORY output.tower`. It preserves configured target order and
reads each file with a 1 MiB bound before opening the output. The build tracks all
three inputs explicitly. Fixed backend membership needs no CMake generator;
native builds also omit the redundant foreign expansion of import-only roots.

`scaffolding/library/gzip.tower` adds a deterministic single-member gzip envelope
to the same raw DEFLATE encoder and CRC32 implementation. It has no filename,
timestamp or host metadata, and publishes output only after the complete member
is available. It does not decode gzip. The existing fixed-Huffman encoder can
produce larger files than a dynamic-Huffman compressor. The browser compiler
packager now uses this encoder and the Tower GNU ar writer. It follows actual
Ninja/Clang recipes and compiler depfiles, preserving original support object
bytes and explicit import/export lists. `build-llvm.sh` builds and runs it only
when `TOWER_BROWSER_CROSS=ON`; it can also be invoked directly:

```sh
tools="$(bash playground/scripts/build-bootstrap.sh --tools package_compiler_project)"
"$tools/package_compiler_project" "$PWD" build/browser-wasi /path/to/llvm-build \
  build/compiler-project
```

No project-owned Python files or inline Python programs remain. Upstream LLVM's
CMake configuration still requires Python; the Docker development image retains
that upstream dependency. Tool compilation and compiler-project packaging do
not execute Python, `llvm-nm` or `llvm-ar`.

## Publishing a replacement pin

Normal builds do not need a packaging tool. For the less frequent task of
publishing a compiler built and validated in the documented Ubuntu 24.04/LLVM
19.1.1 environment, the Tower candidate packager preserves provenance and hashes:

Run the shared-release step in a Bash subshell. Set `build_command` to the
command that produced the staged compiler and use its actual predecessor.
This example assumes the ordinary default build. The output paths must be new.

```bash
(
  set -eu
  umask 022
  predecessor="$(bash playground/scripts/build-bootstrap.sh)"
  tools="$(bash playground/scripts/build-bootstrap.sh --tools package_bootstrap)"
  package=build/bootstrap_candidate
  build_command='bash playground/scripts/build-native.sh'
  "$tools/package_bootstrap" build/native/towerc "$predecessor" "$PWD" \
    "$package" "$build_command"
  (cd "$package/linux-x64" && sha256sum --check SHA256SUMS)

  members=(development.json linux-x64)
  if [[ -f $package/source-changes.patch ]]; then members+=(source-changes.patch); fi
  set -C
  tar --sort=name --mtime="@$(git log -1 --format=%ct)" \
    --owner=0 --group=0 --numeric-owner -czf - -C "$package" "${members[@]}" \
    > "$package.tar.gz"
)
```

Distribute the archive from a location readers can traverse. Its top-level
members are `development.json`, `linux-x64/` and the source patch when present.
The packager's enclosing staging directory is private (0700) and stays outside
the archive. The packager sets `towerc` to 0755 and ordinary payloads to 0644.
The release umask gives the resource directories 0755 and the checksum list,
manifest and archive file 0644, even when the source checkout or its ordinary
build install has owner-only files. An existing package destination is refused.
The user installer keeps its private installation root.

It writes a directly runnable `linux-x64/towerc`, complete resources, checksum
list, manifest and optional source patch into a new candidate directory. The
directory must not exist; publication uses atomic no-replace rename. No archive
codec or installer is required. SHA-256 is the small shared Tower implementation;
Git and ldd are explicit provenance tools, defaulting to `/usr/bin/git` and
`/usr/bin/ldd` (optional final `GIT LDD` arguments override them).

Run the packager on the native build host with the same `LLVM_CONFIG` as the
build (default `llvm-config-19`). It reads the distribution ID and major
release from `os-release` and records the selected tool's full LLVM version.

Stage new source files so Git includes them in provenance, keep the source and
compiler/resource inputs unchanged during packaging, and package the compiler
from that exact source snapshot. Native CMake COPYONLY paths must match in both
directions. For example, each direct `share/tower/library/*.tower` member
needs a tracked, byte-identical `scaffolding/library` source. A diagnostic
naming a retired copy calls for a fresh build/install directory. Other resources,
including runtime IR and custom modules outside the COPYONLY paths, are
inventoried and hashed as supplied. The build-command argument records an already
performed build; the packager does not execute or attest it. Dependency records
omit ASLR addresses but retain observed names/paths; they are not a portable
dependency closure. Resource file symlinks are copied under lexical names;
directory symlinks are skipped. Names must be portable relative UTF-8 paths
without control characters. Input data is buffered with a 1 GiB total bound,
resource traversal depth 128, and captured provenance output bound 64 MiB.

Run the candidate compiler from an unrelated directory, check execution and a
clean successor, then publish its complete `linux-x64` directory, manifest and
optional source patch together. Remove an old source patch when the new manifest
has none. Revalidate the default build without a private compiler override.
Keep only files listed by the candidate; do not merge stale resources from an
older pin. The Git history retains previous pins for comparisons and rollback.
