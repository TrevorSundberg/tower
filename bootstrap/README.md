# Development bootstrap

The checked-in `linux-x64/towerc` and its adjacent `share/tower` resources run
directly from the checkout. `build-bootstrap.sh` verifies every pinned member
with the platform `sha256sum` command and returns the compiler path. There is
no installer, unpacking step, bootstrap cache or Python dependency on this path.
`TOWER_BOOTSTRAP_COMPILER` remains an explicit development override.

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
their own directly built executable. The archive and installer are retired, not additional
required formats. Preserve frozen resource bytes and the compiler's executable
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
It also supports struct copies/by-value calls, named-field/default initialization,
expression operators, `for`/`defer`, borrowed `foreach`, generic call inference,
identifier module paths and exact quoted imports. Build new syntax with the
preceding pin, publish a compatible successor with complete resources, and only
then adopt the syntax in compiler/build-tool sources. Validate the final rebased
source through the default clean build before publishing.

## Tower build tools

The same environment builds the LLD compatibility patcher, Roku and bootstrap
packagers, and compiler/bootstrap verifiers through the public compiler and
existing runtime:

```sh
tools="$(bash playground/scripts/build-bootstrap.sh --tools)"
"$tools/package_roku" program.brs program-roku.zip
```

Pass a tool name after `--tools` to build only `prepare_lld_compat`, `package_roku`,
`package_bootstrap`, `verify_compiler` or `verify_bootstrap_symbols`.
Omitting the name builds all five.

`build-llvm.sh` invokes `prepare_lld_compat` automatically. The Roku ZIP/CRC/DEFLATE
implementation is Tower with no zlib link; see the [Roku guide](../docs/roku-backend.md)
for codec scope and device-testing limits. `TOWER_TOOLS_BUILD` selects the tools
build directory (default `$HOME/.cache/tower/tools`), and `LLVM_CONFIG` selects
the host LLVM installation (default `llvm-config-19`). Wrapper stdout is only the
resulting directory; build output goes to stderr. A small existing CMake bridge
builds the Tower builder/runtime; Tower owns the tool compilation/link arguments.
The [distribution checks](../docs/bootstrap-distribution.md#validation-and-measurement)
use `verify_compiler` directly; the verifier and its assertions are Tower.
Wider test and upstream build tooling still needs migration.

## Publishing a replacement pin

Normal builds do not need a packaging tool. For the less frequent task of
publishing a compiler built and validated in the documented Ubuntu 24.04/LLVM
19.1.1 environment, the Tower candidate packager preserves provenance and hashes:

```sh
predecessor="$(bash playground/scripts/build-bootstrap.sh)"
tools="$(bash playground/scripts/build-bootstrap.sh --tools)"
"$tools/package_bootstrap" build/native/towerc "$predecessor" "$PWD" \
  build/bootstrap_candidate 'bash playground/scripts/build-native.sh'
(cd build/bootstrap_candidate/linux-x64 && sha256sum --check SHA256SUMS)
```

It writes a directly runnable `linux-x64/towerc`, complete resources, checksum
list, manifest and optional source patch into a new candidate directory. The
directory must not exist; publication uses atomic no-replace rename. No archive
codec or installer is required. SHA-256 is the small shared Tower implementation;
Git and ldd are explicit provenance tools, defaulting to `/usr/bin/git` and
`/usr/bin/ldd` (optional final `GIT LDD` arguments override them).

Stage new source files so Git includes them in provenance, keep the source and
compiler/resource inputs unchanged during packaging, and package the compiler
from that exact source snapshot. The build-command argument records an already
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
