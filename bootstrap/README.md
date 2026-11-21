# Development bootstrap

The checked-in archive and `development.json` provide the compiler needed to build
the current source. `build-bootstrap.sh` verifies every file and installs it in a
hash-addressed cache. No download or privately saved compiler is required.
`TOWER_BOOTSTRAP_COMPILER` remains an explicit override for development comparisons.

This is a **Tower-built Linux x64 development bootstrap**, built for Ubuntu 24.04
with system LLVM 19 and its C++ runtime dependencies. All project-owned compiler
and runtime implementation in this pin is Tower; LLVM and platform libraries
remain third-party. It is not a standalone Windows/macOS/Linux release, and the
existing installation/build scripts have not yet all moved to Tower.
`docker/Dockerfile` supplies its dependencies; the
normal wrapper selects linux/amd64, including on Docker hosts using emulation:

```sh
./build.sh bash playground/scripts/build-native.sh
```

From Windows PowerShell with Docker Desktop:

```powershell
docker build --platform linux/amd64 -t tower_build docker
docker run --rm --platform linux/amd64 -v "${PWD}:/work" -w /work tower_build bash playground/scripts/build-native.sh
```

On Windows with the documented Ubuntu/LLVM environment installed in WSL, the
same build can run directly:

```powershell
wsl -d Ubuntu -- bash playground/scripts/build-native.sh
```

Run these commands from the repository root. They install the checked-in pin and
build `build/native/towerc` plus its `share/tower` resources without compiling any
project-owned C/C++ seed. Linux uses the command directly; Windows/macOS Docker
hosts use the explicit Linux container above. The resulting executable is Linux
x64, not a native Windows/macOS binary. Native per-host archives are still planned.
The [browser compiler](https://tower-lang.org/) is another host-independent route
for editing, rebuilding and downloading compiler output. An initial executable
compiler/interpreter is always needed; separate native pins for every host are
convenient distribution options, not a requirement for self-hosting.

The package includes its complete `share/tower` grammar/library resources. The
manifest records archive/member hashes, compiler dependencies, build provenance,
and the source input hashes used to produce it. Validate a relocated installation,
the operator fixtures, and a clean successor build before updating this pin.
Never migrate compiler source to unsupported syntax before the replacement
bootstrap is committed and the default clean build path has passed.

The current pin supports shallow struct copies and by-value Tower calls/returns,
ordinary scalar `var` binding inference through staged execution, and
named-field destination initialization (`{ x: 1 }`,
`init(Type) { ... }`, nested fields and explicit `..default`),
target-typed `default`/`default(Type)` initialization,
expression operators, scoped `for`/`defer`, borrowed
`foreach` with nominal iteration protocols, exact generic
call-argument inference, identifier module paths, leading parent dots, and exact
quoted filenames. Build and validate
the implementation with the preceding pin before migrating compiler sources.
The manifest records the exact source revision and input hashes, with an
accompanying `source-changes.patch` when the build includes uncommitted sources.
Revalidate the final rebased source with the default bootstrap before publishing
an updated pin.
