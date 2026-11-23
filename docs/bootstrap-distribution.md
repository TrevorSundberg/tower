# Compiler hosts and bootstrap distribution

All project-owned compiler/runtime implementation and functional fixtures are
Tower. The last 469 C/C++ lines were retired in c53a077; there is no owned native
seed or callback adapter left. A hash-pinned, Tower-built Linux x64 development
compiler is checked in under `bootstrap/` and selected automatically by the
Docker build. LLVM and platform libraries remain third-party dependencies.
Production browser linking for Wasm, Linux ELF, Windows PE and macOS Mach-O
executes in Tower. Windows x64 and macOS CLI executable defaults use the same
byte services. The Linux hosted CLI and the compiler's external-library build
still use host toolchain linking; LLVM emission and runtime-object compilation
also remain external. LLD is retained only as a test/build-tool reference, not
as a library linked into the production browser backend.

The current policy is one Linux x64 bootstrap and a documented Docker build,
usable from Windows/macOS/Linux. Native CLI packages for those hosts remain
distribution goals; separate bootstrap chains for every OS are not required now.
Audit remaining build/package scripts for removal or simplification before
translating required behavior to Tower. The external dependency closure is not
bundled as a standalone portable release.
See [the development bootstrap](../bootstrap/README.md) for runnable commands.

The retirement inventory and reproducible validation are recorded in the ongoing
project journal. Counts include blank lines and comments and exclude third-party
dependencies; they are a source inventory, not a completion percentage.
World-owned registries, sessions, syntax baselines, grammar/recognizer state,
diagnostics, formatting, host transports and node lifecycle now execute in Tower.
The legacy default-world/allocation adapter is Tower too, but remains confined
to a single coordinator. Workers use explicit worlds, pinned inputs and owned
scratch; structural publication occurs after joins. Native differential references
have been translated or retired, and historical C/C++ research is recoverable in
Git history. Builds still need the initial bundled executable; this is not a
source-only bootstrap. Portable release gates below remain explicit future work.

## Implemented host migration

`scaffolding/host/driver_options.tower` parses options and supplies help/version.
`driver_services.tower` owns resource path construction, diagnostic positions
and output-kind/default-name policy. `driver_files.tower` owns binary file
reads/writes through opaque libc file services. Failed reads close the file and
preserve the previous buffer, including allocation failures. Writes report
write/close failure; a partial output is not a successful artifact.

`driver_entry.tower`, `driver_request.tower`, `driver_compile.tower` and
`driver_execution.tower` now own the complete CLI path: grammar setup, pinned
input/module lifetimes, compilation, optimization, both interpreters, canonical
Foundation and bytecode reconstruction, output files, dependency files and linking.
`scaffolding/driver.cpp`, `core.cpp`, `core-nodes.cpp`, `core-machine.cpp` and
`llvm-engine.cpp` are retired from every consumer.

`host/syntax_baseline.tower` stores baseline transport on the owning world's
syntax component. It uses ordinary C-callable Tower APIs and the shared formatter;
no owned C++ string layouts or sret adapters remain. Each CLI request restores its
borrowed module slot and releases execution/cache/buffer storage on normal exit.
`host/legacy.tower` owns the default-world compatibility policy; the Tower runtime
artifact tool emits its small initialized target storage through LLVM C APIs.

`ide_protocol.tower` exports `tw_abi_version`, `tw_alloc` and `tw_free`,
validates IDE source, and serializes execution status/error/output/steps.
The other `host/ide_*.tower` modules own session lifetimes, grammar/tree/type
serialization, completion integration, execution and downloadable artifacts on
the existing shared entities and compiler APIs. `ide_selftest.tower` calls the
Tower node/parser/syntax fixtures through the same services.
Worker cancellation, edit/restart behavior and stale-result handling remain the
existing worker implementation; compiler services do not depend on this transport.

CLI resources now accompany each built compiler:

```text
towerc                 # towerc.exe on Windows
share/tower/bedrock.tower
share/tower/foundation.tower
share/tower/runtime-*.ll  # generated target artifacts; development CLI uses Clang
```

The native platform service locates the actual running executable, and Tower
constructs the adjacent resource path independently of the current directory,
including paths with spaces. Explicit `--bedrock` and `--foundation` still
override defaults. CMake stages resources for all bootstrap generations;
`build-native.sh` copies them beside `build/native/towerc`. Copy the directory,
not just its executable. No development-checkout path is compiled into the
driver's resource policy. Debug/source metadata elsewhere is a separate concern.

The constant-return `scaffolding/main.cpp` experiment and its old default CMake
target have been removed. Real Tower compilation/linking/execution tests exercise
LLVM. No project-owned native bootstrap reference remains.

Compiler objects use the shared CMake object rule and compiler-generated depfiles.
Single-module objects compile their Tower source directly; template orchestration
uses `compiler/units/template_build.tower`. The generated host and parser profile
entries remain inputs to bootstrap comparison. Browser packaging maps direct
objects to the same Tower sources and collects their real dependency closure.
The `scaffolding/tests/compiler_project_units.tower` fixture exports that closure
from `REPOSITORY BUILD OUTPUT OBJECT ...` for independent object comparison.

Driver objects also compile directly. The Tower platform modules select the libc
`stat` call, including `stat$INODE64` on Intel macOS, without a separate LLVM
symbol-rewrite pass. The existing target-specific stat layouts remain explicit.

Plain compiler, worker, IDE and fixture objects share `tower_runtime_object`.
Its compiler-generated depfile tracks transitive Tower imports; separate source
globs and repeated compilation commands are unnecessary for those objects.
Keep explicit prerequisites for generated inputs that must exist before compilation.

## Validation and measurement

Run from the repository root:

```sh
./build.sh bash playground/scripts/build-native.sh
./build.sh bash playground/scripts/build-bootstrap.sh --tools verify_compiler
./build.sh /tmp/tower-home/.cache/tower/tools/bin/verify_compiler --development-package "$PWD/build/native/towerc" "$PWD/scaffolding/tests" "$PWD/build/distribution"
./build.sh bash playground/scripts/build-bootstrap.sh --tools check_core
./build.sh /tmp/tower-home/.cache/tower/tools/bin/check_core native "$PWD" /tmp/tower-home/.cache/tower/core "$PWD/bootstrap/linux-x64/towerc"
./build.sh /tmp/tower-home/.cache/tower/tools/bin/check_core wasi "$PWD" /tmp/tower-home/.cache/tower/host-wasi-tests "$PWD/bootstrap/linux-x64/towerc" /tmp/tower-home/.cache/tower/wasi-sdk/wasi-sdk-34.0-x86_64-linux
```

`check_core` is the Tower-owned configure/build/test entry point for the existing
native and WASI core profiles. The preceding tool build verifies the checked-in
compiler and resources. WASI mode also requires the SDK installed by the normal
setup step. CMake/CTest and Node remain external build/transport capabilities.

The native build already copies the complete compiler/resources from its cache
into `build/native`. Tower's `verify_compiler --development-package` consumes
that relocated package directly, without a second temporary copy or recursive
cleanup. It uses the existing Tower fixtures for
diagnostics, interpretation, object compilation, separate library linking and
executable behavior. It records compiler/object hashes, command arguments,
millisecond timings, exit codes and separate stdout/stderr logs, and compares
three fresh object emissions. Each run writes `checks.txt` and logs below a new
`build/distribution/relocation.XXXXXX/{development,restricted}/` directory.
There is no JSON report/parser step. The package mode creates a fresh report
directory on each invocation; single-mode verification rejects an existing output.
The journal records a real package move into a path with spaces, with the original
cache's resource directory temporarily unavailable during both environment checks.

The development run permits installed tools. The restricted run searches only
the package root and its `tools` directory; the development package must fail at
linking with `Cannot find tool: clang`. The explicit `expect_missing_clang` mode
requires all earlier checks to pass and this specific link failure; ordinary
restricted mode rejects the package. Restricted release verification itself is
**not passed**. Retire the expected failure when the Tower target runtime and
bundled linker are integrated.

Run a future candidate through the strict verifier directly:

```sh
tools="$(bash playground/scripts/build-bootstrap.sh --tools verify_compiler)"
"$tools/verify_compiler" /relocated/package/towerc scaffolding/tests \
  build/distribution/new_candidate_verification
```

The current verifier runs on Linux x64 through the canonical Docker environment.
It uses existing GNU `env` and `timeout` commands for a clean child environment,
unrelated working directory and a 180-second deadline with a one-second kill
grace; process arguments are passed directly without a shell. Captured log reads
are bounded to 4 MiB each and input files to 1 GiB. These are trusted development
tools, not a disk-write sandbox. Native Windows/macOS release verification still
requires an appropriate host runner and actual execution on those systems.

A restricted `PATH` is not an isolated OS: installed dynamic libraries can still
satisfy the loader. Release verification needs clean OS images without LLVM,
Clang or project development packages and with networking disabled. Record image,
OS, architecture, commands, dependency inspection and hashes. Inspect the entire
LLVM/linker closure, and declare the permitted OS runtime/ABI baseline explicitly.
The host file reader's 16 KiB stack buffer produces a Windows `__chkstk`
dependency under LLVM lowering; include the matching compiler-rt/platform
implementation when packaging that target. The cross-object audit permits this
symbol only for Windows host/parser/semantic modules: the parallel LR builders,
semantic runner and float parser also need stack probes. This does not establish
a linked runtime.

## Whole-compiler release requirements

The speculative Python recipe builder and its mock-schema tests are retired.
There was no complete production recipe or build caller; its only executable
caller tested schema validation with a pretend linker. The
[archived builder](https://github.com/TrevorSundberg/tower/blob/f81f5dd/playground/scripts/self-build-compiler.py)
and the former schema remain in Git history. A second build-description format
is unnecessary for the current Linux/Docker route.

Use the existing build path for successors. Tower's
`verify_bootstrap_symbols --compare BOOTSTRAP SUCCESSOR SCAFFOLDING NATIVE_BUILD LLVM_NM OUTPUT_DIRECTORY [UNIT ...]`
consumes prebuilt inputs and compares selected compiler components built by the
public predecessor and its native successor. It enforces exact reviewed cross-unit
and platform dependencies from captured `llvm-nm` output before comparing nonempty
objects and LLVM IR. Omitted unit names select all seven units across four targets.
Each invocation creates a fresh retained child directory, checks explicit/missing
grammar inputs, and avoids the old script's duplicate build and expected files.
The tables live in `scaffolding/tools/bootstrap_symbols.tower`; review new imports
against their declarations/implementations rather than allowing name prefixes.
`test-compiler-project.mjs` builds two successive edited browser compilers and
compares their bytes and behavior. These are real checks with narrower scope
than a complete standalone native release. Relocation verification above remains
required too; retiring the unused recipe frontend does not satisfy release gates.

A future standalone release must still declare and verify its complete input
closure: Tower sources and fixtures, target runtimes, LLVM/linker dependencies,
licenses, hashes, executable modes, source revision and actual host/target profile.
Package-relative paths must not escape their root. Loader/linker policy must be
explicit and deterministic, without undeclared tool or library searches. Do not
classify project native objects as third-party inputs or silently substitute a
native seed. Validate on the actual host in a clean environment.

Generation N must build every compiler/runtime unit for generation N+1. Verify
each successor before using it; generations two and three must have identical
object and executable bytes. Preserve commands, timings, failure evidence and
complete candidate manifests; failed builds must not publish candidates or
overwrite prior trials. Full differential, round-trip and determinism checks
remain necessary. The standalone dependency closure and editable browser runtime
artifact stage still need integration; the removed schema tests never proved
either requirement.

Keep predecessor/successor adjacency and whole-generation fixed-point results
separate. Compiler evolution can fail the former while passing the latter;
retain the failed exact comparison, its original artifacts and diagnostics.
A native fixed-point receipt requires one frozen published source closure,
complete verified producers starting at the public pin, identical target/tools/
flags, every compiler/runtime object and executable, and complete resource hashes.
Use the same build path when comparing bound runtime LLVM text: `runtime_bind`
preserves LLVM's input-path ModuleID. Preserve the preceding build before reusing
that path; never strip names or normalize output to manufacture equality.
Passing this receipt does not pass an earlier adjacency comparison, prove semantic
equivalence to an older compiler, authorize pin adoption, or establish a portable
release. The [2026-11-23 native receipt](compiler_generation_identity.md) records
an actual complete fixed point and its remaining release limits.

## Remaining ownership and release gates

| Area | Remaining distribution work |
| --- | --- |
| Compiler | Preserve shared-node contracts and deterministic serial/worker behavior as the Tower language grows. Owned C/C++ retirement is complete. |
| Backend | Bundle and validate the upstream LLVM/linker closure for each native host release. |
| Runtime | Make the existing Tower-generated ABI artifacts rebuildable in the browser package recipe. |
| Host/distribution | Remove or simplify unnecessary build/package steps, then translate required tooling to Tower; produce and execute native host packages when native distribution is prioritized. Keep the Linux/Docker pin usable meanwhile. |

The shared-runtime cutover at `dfdf95b` supplies `TowerSharedRuntime.cmake`,
explicit semantic-component queries, `host/guest_memory.tower` and
`host/platform_output.tower`. Its build fragment is integrated. GuestHeap accepts
an explicitly committed contiguous target address range; output helpers implement
deterministic formatting and progress-aware writes. These are reusable pieces,
which now back the active guest runtime. The Tower runtime artifact tool connects
reserved runtime symbols, explicit Wasm instance storage and heap-base access,
and Linux startup/syscalls through upstream LLVM C APIs. Ordinary Foundation
foreign calls retain their spellings and the existing shared layouts.

The CLI entry now lives in `host/driver_entry.tower`: it owns argument options,
resource-location buffers and timing lifetime, calling the retained synchronous
`driver_compile` transport adapter. Linux/macOS/Windows executable lookup uses
their platform C APIs. The obsolete native driver/bootstrap branches are gone.
The production compiler allocation/reallocation/free exports and internal trap
reporting and single-owner test instrumentation are Tower modules;
`compiler-memory.cpp` and `runtime.c` have been removed.
`cmake/TowerRuntime.cmake` builds the Tower
`runtime-bind` tool against the installed upstream LLVM C library. It checks
definition/declaration and function-type compatibility, connects reserved names
in target LLVM output, verifies the module, and produces ordinary target objects.
This private artifact step does not change canonical Foundation storage or allow
reserved-symbol definitions in ordinary user programs. Browser compiler packages
retain these generated ABI objects as prebuilt support while rebuilding their
Tower host policies. Browser compiler-result transport and syntax-session
ownership are Tower; an editable runtime-object build stage remains work.

Inspect tracked owned native source with Git, and build inputs with Ninja's
existing listing. A separate inventory script/report format is unnecessary:

```sh
git ls-files -- '*.c' '*.cc' '*.cpp' '*.h' '*.hpp' '*.inc' ':(exclude)third_party/**'
ninja -C /path/to/native-build -t inputs towerc
```

The Git query excludes third-party sources; the Ninja listing includes all
target inputs and should be inspected in that build's context. The current
tracked owned C/C++ source count is zero; historical research prototypes and
native reference fixtures have been removed after preserving their results and
replacement tests. Git history remains their archive.

Candidate execution profiles: Linux x64/ARM64 (`x86_64-unknown-linux-gnu`,
`aarch64-unknown-linux-gnu`), Windows x64 (`x86_64-pc-windows-msvc`), macOS
x64/ARM64 (`x86_64-apple-macos11`, `arm64-apple-macos11`). Windows ARM64 also has
a cross-compiled CLI and guest runtime profile. These are verification targets,
not a claim of available portable compiler binaries.
Browser/WASI retains its separate worker deployment/verification process.

The operator migration additionally requires a bootstrap compiler supporting
numeric grammar annotations and Tower expression normalization. Rebuilding the
audited compiler sources with an older scope-only compiler is no longer sufficient.
Foundation's instruction-like grammar is unchanged; Bedrock adds only generic
production metadata. Keep an operator-capable compiler available while building
its successor, and validate the successor against Foundation reconstruction and
the parser/interpreter differential suites before replacing that bootstrap.
Preserve its adjacent `share/tower` grammar resources when copying a bootstrap;
a bare executable copy cannot locate its Bedrock/Foundation/Tower inputs.

At this milestone Linux x64 host behavior is tested, while a complete Tower-only
compiler and its self-build are unavailable. Windows/macOS compiler execution
has not been performed. The user-authorized Linux development artifact now fixes
the previously missing bootstrap path, with exact source/member hashes and LLVM
license material. It is explicitly not a portable bootstrap release. Publish
portable release binaries only after the corresponding gates pass, with exact
provenance, licenses, hashes and platform verification evidence.
