# Development bootstrap

The checked-in archive and `development.json` provide the compiler needed to build
the current source. `build-bootstrap.sh` verifies every file and installs it in a
hash-addressed cache. No download or privately saved compiler is required.
`TOWER_BOOTSTRAP_COMPILER` remains an explicit override for development comparisons.

This is a **hybrid Linux x64 development bootstrap**, built for Ubuntu 24.04 with
the system LLVM 19 and C++ runtime. It is not the future standalone, pure-Tower
Windows/macOS/Linux release. `docker/Dockerfile` supplies its dependencies; the
normal wrapper selects linux/amd64, including on Docker hosts using emulation:

```sh
./build.sh bash playground/scripts/build-native.sh
```

From Windows PowerShell with Docker Desktop:

```powershell
docker build --platform linux/amd64 -t tower_build docker
docker run --rm --platform linux/amd64 -v "${PWD}:/work" -w /work tower_build bash playground/scripts/build-native.sh
```

The package includes its complete `share/tower` grammar/library resources. The
manifest records archive/member hashes, compiler dependencies, build provenance,
and the source input hashes used to produce it. Validate a relocated installation,
the operator fixtures, and a clean successor build before updating this pin.
Never migrate compiler source to unsupported syntax before the replacement
bootstrap is committed and the default clean build path has passed.

The current pin supports expression operators, scoped `for` loops and identifier
module paths, leading parent dots, and exact quoted filenames. The for-capable
compiler was built using the previous pin before migrating compiler loops;
`source-changes.patch` and the manifest retain that exact predecessor source.
Revalidate the final
rebased source with the default bootstrap before publishing an updated pin.
