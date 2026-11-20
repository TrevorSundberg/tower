# Compiler hosts and bootstrap distribution

The compiler is still a **hybrid development bootstrap**. No portable compiler
release is checked in. Its semantic compiler and LLVM backend algorithms are
Tower code, while frontend/session lifecycle, native transports, runtime startup
and bootstrap distribution still need migration and integration. The tooling
below keeps those release gates explicit; a module comparison does not establish
complete compiler self-hosting.

The retirement inventory and reproducible validation are recorded in the ongoing
project journal. Counts include blank lines and comments and exclude third-party
dependencies; they are a source inventory, not a completion percentage.
Syntax sessions, parser bridges, the CLI entry point, raw platform operations
and bootstrap/distribution remain meaningful retirement work. The native browser
entry point has been removed in favor of Tower IDE services.
Tower now owns generic registry lifetime, module compilation-session leasing and
CompilerWorld stores with parser/syntax/Foundation/provenance type registries.
The native parser-nodes.cpp and compiler-syntax.cpp adapters are retired.
Expansion histories and generic metadata access now execute in Tower, with
session-independent references and deferred reclamation under pinned views.
Tower also owns mutable parser streams and recognizer requests: copied input,
buffered lookahead, completion snapshots, work accounting and teardown. The
existing native callback invocation and table-specific diagnostics remain bridges.
Native SyntaxSession/grammar state and the legacy default-world handle remain.
Portable compiler release gates below are still required. The obsolete native
seed/stage1 targets and twelve unused implementation fragments have been removed.
Still-used native differential references remain. Validated builds require an
existing import-capable Tower host binary; this is not a source-only bootstrap.

## Implemented host migration

`scaffolding/host/driver_options.tower` parses options and supplies help/version.
`driver_services.tower` owns resource path construction, diagnostic positions
and output-kind/default-name policy. `driver_files.tower` owns binary file
reads/writes through opaque libc file services. Failed reads close the file and
preserve the previous buffer, including allocation failures. Writes report
write/close failure; a partial output is not a successful artifact.

`ide_protocol.tower` exports `tw_abi_version`, `tw_alloc` and `tw_free`,
validates IDE source, and serializes execution status/error/output/steps.
The other `host/ide_*.tower` modules own session lifetimes, grammar/tree/type
serialization, completion integration, execution and downloadable artifacts on
the existing shared entities and compiler APIs. `ide_syntax_wasi.tower` binds the
remaining native syntax inspection interfaces without a native IDE wrapper.
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
LLVM. Active bootstrap references remain until their Tower successors pass.

## Validation and measurement

Run from the repository root:

```sh
./build.sh bash playground/scripts/build-native.sh
./build.sh bash playground/scripts/test-compiler-distribution.sh
./build.sh bash playground/scripts/test-native-core.sh
./build.sh bash playground/scripts/test-host-runtime.sh
```

The distribution check moves the compiler and resources into a directory with
spaces. `verify-compiler.py` uses Tower fixtures for diagnostics, interpretation,
object compilation, separate library linking and executable behavior. It records
startup/compilation/execution timings, exit codes and output, and compares three
object emissions. Reports go to `build/distribution/relocated-{development,restricted}/`.

The development run permits installed tools. The restricted run searches only
the package root and its `tools` directory; the current hybrid must fail at
linking with `Cannot find tool: clang`. The transitional shell check asserts
that earlier checks succeeded and this is the specific failure. The restricted
verification itself is **not passed**. Retire this expected failure when the
Tower target runtime and bundled linker are integrated.

Run a future candidate through the strict verifier directly:

```sh
python3 playground/scripts/verify-compiler.py /relocated/package/towerc \
  --output build/distribution/candidate-verification
```

A restricted `PATH` is not an isolated OS: installed dynamic libraries can still
satisfy the loader. Release verification needs clean OS images without LLVM,
Clang or project development packages and with networking disabled. Record image,
OS, architecture, commands, dependency inspection and hashes. Inspect the entire
LLVM/linker closure, and declare the permitted OS runtime/ABI baseline explicitly.
The host file reader's 16 KiB stack buffer produces a Windows `__chkstk`
dependency under LLVM lowering; include the matching compiler-rt/platform
implementation when packaging that target. The cross-object audit permits this
symbol only for the Windows host module; it does not establish a linked runtime.

## Three-generation whole-compiler recipe

`self-build-compiler.py` prepares a candidate from an explicit, reviewed recipe.
There is deliberately no usable production recipe yet: the missing Tower
frontend/backend/runtime/host entry points must be supplied first. The script's
validation/rejection paths are exercised; complete successor execution remains
an integration gate.

```sh
python3 playground/scripts/self-build-compiler.py /inputs/recipe.json \
  --bootstrap /existing/bootstrap/towerc --output /new/empty-build
```

The output directory must not exist. Recipe paths are relative to its directory.
Inputs cannot escape that root or be symlinks; hash actual dependency files,
including the platform loader if bundling it. JSON is a build recipe, not Tower
program storage. Every source unit is ordinary compilable Tower text; generated
objects/executables are platform artifacts.

| Field | Contract |
| --- | --- |
| `schema` | Integer `1`. |
| `source_revision` | Full Git commit ID; input hashes identify exact contents. |
| `target` | A host profile listed below, matching the executing OS/architecture. |
| `compiler` | `towerc` or `towerc.exe` at package root. |
| `files` | Object keyed by package-relative path; items have `sha256`, `role`, optional `executable`. |
| `files.*.role` | `tower-source`, `fixture`, `third-party`, or `license`. Project implementations and fixtures must be `.tower`. |
| Third-party items | Also require `origin`, `version`, and `licenses` naming declared license files. Include LLVM, linker and dependent libraries. |
| `units` | Ordered `{name, sources, output?}` entries; declared Tower sources become ordered imports in a generated manifest (each source declares its own dependencies). Default output: `objects/NAME.o`. |
| Runtime unit output | Use `share/tower/NAME.o` to retain the built target runtime in the candidate. |
| `compiler_units` | Names of units linked into the compiler; other units must be packaged target runtimes. |
| `link` | `{tool, args}`; tool is a declared third-party executable such as LLD. |
| Link placeholders | `{object:NAME}`, `{file:PATH}`, `{output}`, also inside arguments such as `/out:{output}`. No shell expansion. |

Required inputs include `share/tower/bedrock.tower`, `share/tower/foundation.tower`
and the four `tests/distribution-{program,library,link,invalid}.tower` fixtures
from this checkout. Do not classify project native objects as third-party inputs.
Role and revision declarations require review; they do not prove authorship or
dependency closure by themselves.

Generation N's compiler builds every unit; the declared linker links generation
N+1. The strict host verifier must pass before that successor builds the next
generation. After three builds, generations two and three must have identical
object and executable bytes. Command logs, timings and failure evidence remain
in each stage. A failed build produces no candidate. Compilers identifying
themselves as hybrid are rejected.

Candidates include source, target runtimes, dependencies, licenses, recipe and
a sorted manifest with hashes, sizes and executable bits. Total size includes
the manifest. Recipes supply relative loader paths and deterministic linker
options (including COFF timestamp policy); the script does not guess ABI policy.
Link-time library search flags and undeclared file placeholders are rejected.
No bootstrap binary, source download or C/C++ compiler is implicitly substituted.
The complete source closure, clean-environment dependency checks and the full
compiler differential/round-trip/determinism suite remain required: these few
host fixtures alone cannot establish compiler correctness.

## Remaining ownership and release gates

| Owner | Required integration before retirement |
| --- | --- |
| Frontend | Tower parser/session/bootstrap lifecycle and shared-node access replacing native `SyntaxSession` and seed registration. |
| Backend | Tower LLVM lowering/emission/linker API, explicit target contracts and third-party closure. |
| Runtime | Tower allocator/lifecycle/foreign services, raw memory semantics, platform startup and target runtimes replacing `runtime.c`. |
| Host/distribution | Complete CLI/browser orchestration over those APIs, remaining serialization, Tower test runner, composition recipes, repeated full self-build, platform execution and packaged artifacts. |

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
Tower host policies. Native compiler-result transport, complete syntax-session
ownership and an editable runtime-object build stage still need retirement.

Generate the native artifact inventory:

```sh
./build.sh python3 playground/scripts/inventory-native.py \
  --build /tmp/tower-home/.cache/tower/native \
  --output build/distribution/native-inventory.json
```

This inventories tracked project native artifacts, including `docs/research`,
and optional Ninja inputs including bootstrap dependencies. Third-party sources
are excluded. Research prototypes need explicit archival or translation; they
are not replacement compiler code. Native functional tests must move to Tower
before retirement; references stay until their comparisons can be preserved.

Candidate execution profiles: Linux x64/ARM64 (`x86_64-unknown-linux-gnu`,
`aarch64-unknown-linux-gnu`), Windows x64 (`x86_64-pc-windows-msvc`), macOS
x64/ARM64 (`x86_64-apple-macos11`, `arm64-apple-macos11`). These are verification
targets, not a claim of available binaries. Windows ARM64 is not yet included.
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
has not been performed. No hybrid executable is committed as a portable
bootstrap. Commit binaries only after the corresponding gates pass, with exact
provenance, licenses, hashes and platform verification evidence.
