# Parser tree construction and debug output

## Generic body demand fixtures

`generic_body_cases.tower` supplies the shared syntax for `generic_body_lazy.tower`
and `semantic_invalid/generic_body_demanded.tower`. Keep its 240 distinct body
statements and 32 nominal specializations: replacing them with runtime loops
would stop testing the compiler's body-copy node budget. Signature queries must
complete without copying the unused bodies; demanding every body must report the
65,536-node limit before producing output. The browser compile-time and worker
tests read these same Tower files instead of generating programs in JavaScript.

The fixed worker programs also live here: `worker_iteration.tower`,
`worker_modules/*.tower`, and `semantic_invalid/worker_*.tower`. The browser
transport retains worker-count, pointer-width, execution-engine and canonical
output comparisons. Existing declaration-cycle, alias and staged-failure files
are shared where they exercise the same case. Deliberate errors in these fixtures
test diagnostic ordering and lazy demand; do not repair them as ordinary code.

`stress_sources.tower` owns the larger generated programs: 1,024-declaration
chains, 256 generic/field dependencies, 260 body-window functions and 16 independent
ordinary/generic bodies. The `stress/*.tower` entry programs each emit one source
within the interpreter's 64 KiB output contract. Browser tests execute those Tower
producers through the shared transport; they no longer construct these programs
in JavaScript. The emitted forward initializers are checked without executing
reads before initialization. The smaller fixed fixtures remain useful for focused
compiler checks.

## Native CLI execution and package comparisons

Configure the native build with `-DTOWER_DRIVER_TESTS=ON` and build
`tower-driver-tests`. The existing runner also provides:

- `ctest --test-dir <native-build> -R '^tower-driver-native-differential$' --output-on-failure`
  compares the native fixtures with the graph interpreter, with both
  optimized and unoptimized compilation.
- `ctest --test-dir <native-build> -R '^tower-driver-package-differential$' --output-on-failure`
  compares graph/fast execution, file package loads, Foundation reconstruction,
  optimization profiles and repeated package bytes on 32/64-bit targets. It
  includes scalar idioms, conversion boundaries and imported-file diagnostics
  and dependencies.

Direct commands are `tower-driver-tests --native-differential COMPILER SCAFFOLDING`
and `tower-driver-tests --package-differential COMPILER SCAFFOLDING`; append a case
name such as `print`, `factorial` or `modules` to focus a run. Use explicit paths
and a writable working directory. Each CTest has a separate output directory;
direct runs retain sources, binaries and capture logs there for inspection.
Unknown filters fail. Child exit statuses are preserved, including abnormal
termination, with a 30-second child limit and a 20-minute CTest limit.

The native-only `backend_execution_roots` case reads its Tower fixture from
this directory and requires the independent output `45\n2\n` before comparing
raw and optimized native execution. Its direct, callback and recursive calls
share two observable effects; its uncalled type helper remains in the source.
The fixture keeps its own explicit language import, without a runner prefix.

The shared scalar-idiom JSON remains browser test data. The Tower runner reads
only its ASCII string/null table format and rejects unsupported values/escapes;
it does not duplicate that fixture corpus or require a general JSON library.

The same runner owns the CLI C-output, explicit 32/64-bit profile and captured
browser C comparisons. See [C backend validation](../../docs/c-backend.md) for
the optional CTest matrix, required Clang/GCC multilib tools, direct commands
and MSVC artifact handoff. These modes use the same raw-status capture and
30-second child limit. They keep generated sources and outputs in their working
directory; run different modes concurrently only in separate directories.

The runner also replaces the native linking and browser-export shell tests:

```sh
tower-driver-tests --linking COMPILER SCAFFOLDING CLANG LLVM_AR WASM_LD WASM_ARCHIVE LLVM_LIBRARY
tower-driver-tests --browser-exports [QEMU_AARCH64]
tower-driver-tests --windows-linking COMPILER SCAFFOLDING CLANG LLVM_AR LLD_LINK KERNEL32_LIBRARY
tower-driver-tests --target-packs COMPILER SCAFFOLDING LLVM_BIN PACK_DIRECTORY
```

These modes execute on Linux x64, using absolute compiler/tool/input paths and
the same 30-second child deadline. For `--linking`, run in `build/linking` after
`build-wasm.sh`; pass its `wasm-fixture.a` rather than rebuilding that archive.
The checks exercise archive callbacks, separate runtime linking, native/interpreter
agreement, LLVM's C API and native-to-Wasm output. They preserve
`native-compiled.wasm` for the browser test. Each newly compiled output is removed
before the command, and every command must succeed. stdout comparisons use exact
byte lengths. The last child logs remain as `driver stdout.txt`/`driver stderr.txt`.

Run `--browser-exports` in `build/cross` after the browser cross-compilation test.
It executes both x64 Linux exports and, when supplied, both ARM64 exports through
QEMU. An omitted/empty QEMU argument reports an explicit skip; a supplied but
missing/failing emulator fails. Expected text stays in Tower instead of temporary
shell-generated files. `internal.sh` builds the existing runner and invokes both
modes; no additional tool binary or CMake target is needed.

`--windows-linking` independently compiles the foreign archive and two PE programs;
its expected output is shared Tower data, with no prerequisite native test or
generated text files. `--target-packs` consumes the five runtime objects and import
descriptions produced by Tower's `package_targets` tool. It compiles and links all five target
programs, executes Linux x64, and detects `qemu-aarch64` for Linux ARM64 execution.
This separates artifact construction from validation; repeating a test does not
rebuild the packs. Run each mode in its own writable output directory.

Both modes select direct Windows execution when `cmd.exe` is found on POSIX PATH,
otherwise Wine when available; native Windows uses direct execution. Absence is
reported explicitly after successful compilation/linking. A selected transport's
failure, wrong output or child exit 77 fails the test. macOS outputs are linked
only; execution still requires a Mac. `target_runner_exit.tower` is the negative
Wine-transport fixture that returns the former shell skip code; it must fail when
selected as the runner. The journal records real WSL/Windows and QEMU trials.

Bootstrap component agreement uses the existing Tower tool instead of a shell
test: `verify_bootstrap_symbols --compare BOOTSTRAP SUCCESSOR SCAFFOLDING NATIVE_BUILD LLVM_NM OUTPUT_DIRECTORY [UNIT ...]`.
Build it through `build-bootstrap.sh --tools verify_bootstrap_symbols`. Omit
unit names for UTF-8, bytes, entities, parser nodes, host, interpreter and semantics;
otherwise supply `utf8`, `bytes`, `entities`, `parser-nodes`, `host`, `interpreter`
or `semantics`. Each selected unit checks predecessor/successor optimized IR and
object bytes on Linux x64, Wasm32, Windows x64 and macOS ARM64, plus exact symbol
policy. Only the parser/semantic Wasm units permit the indirect function table;
other targets/units and suffixed names remain rejected. The verifier consumes
prebuilt inputs, creates a fresh retained child under the output directory, and
checks explicit/missing Foundation inputs without named symbol/expected files.
It does not execute cross-target objects or establish a portable CLI release.

## Native measurements

Build the same `tower-driver-tests` target with `TOWER_DRIVER_TESTS=ON`. Run under
Linux in an otherwise empty writable artifact directory, using explicit paths:

```
tower-driver-tests --measure-compiler BEFORE AFTER SCAFFOLDING [CASE]
tower-driver-tests --measure-semantics BEFORE AFTER SCAFFOLDING [CASE]
tower-driver-tests --measure-native COMPILER SCAFFOLDING [CASE]
tower-driver-tests --measure-interpreters COMPILER SCAFFOLDING [CASE]
tower-driver-tests --measure-c COMPILER SCAFFOLDING CLANG GCC [CASE]
```

Each command writes `measurements.json` only after all selected cases succeed.
It removes an old report first and rejects missing/stale products, changed
outputs, failed processes and incomplete timing reports. Unknown filters fail.
Run measurements serially without concurrent builds/tests; they are not automatic
CTest benchmarks. The existing 30-second per-child limit applies. Keep compiler
executables, their resources and the source/grammar tree unchanged throughout.
The Linux host description comes from `/usr/bin/uname -srm`.

- `--measure-compiler`: functions, collections and templates; two warmups and
  twelve alternating before/after pairs. Every emitted object must match.
- `--measure-semantics`: `structs32`, `structs64`, `semantics32`, `semantics64`;
  two warmups and nine alternating pairs, matching interpreted stdout.
- `--measure-native`: memory and functions; five samples each of interpretation,
  native compilation, execution and object emission in that dependency order.
  Interpretation and execution must match the known fixture outputs.
- `--measure-interpreters`: arithmetic, calls, memory and branch; three warmups
  and fifteen alternating graph/fast pairs. The first warmup starts fast, and
  the first retained pair starts graph. Both modes must produce identical stdout.
  These Foundation workloads live in `scaffolding/benchmarks` and are shared by
  the browser runner. Their explicit imports and named limits replace the old
  inline strings; compare compiler versions on the same frozen source files,
  rather than treating historical compile timings as the same input.
- `--measure-c`: recurrence and memory kernels, 30 million iterations; seven
  alternating runs of LLVM O2 and raw/optimized C built by Clang/GCC O2. The
  100,000-iteration variants separately compare graph/fast O0/fast O2 and retain
  their phase timings. Clang/GCC are required here; multilib is not.

The versioned report records argv, compiler/tool/source/grammar hashes, outputs,
raw sample order and per-metric medians. Units are nanoseconds; an even median
may contain `.5`. CLI decimal milliseconds are decoded exactly without host
floating point. The `wall` metric includes process launch, capture setup and log
reads; result validation, hashing and report formatting are outside it. CLI
phases such as `compile` and `execute` exclude launch. This capture method differs
from the retired Python probes, so do not compare their wall numbers as if the
harness overhead were identical. Compare paired results from the same runner;
derive ratios from the recorded medians. The report schema replaces the retired
script-specific formats; no current downstream reader depended on them.
Artifacts/logs remain for inspection. C runtime kernels keep separate long and
short sources and per-case native/C executables.

## Tower Wasm linker

The static Wasm linker lives in `backend/wasm_link.tower`.
Its API accepts a fresh, stable `WasmLink`, explicit options, and borrowed object
bytes through its owned ECS world. Keep those input allocations immutable and
alive until `wasm_link_close`; the request is not a shallow-copyable owner.
`wasm_link_run` publishes a complete image only on success. It performs no file
access or native linker calls. Production Wasm backend dispatch and native CLI
Wasm output use it; COFF/Mach-O still use upstream linkers. Linux downloads use
the Tower ELF linker described below; dynamic native CLI linking is separate.

`elf_link_driver.tower` is a native functional runner for `backend/elf_link.tower`.
Compile with the public bootstrap, `--library --emit object`, then link with
`guest-host-library.o -pthread -ldl -Wl,--export-dynamic`; its imports provide
the existing Linux work transport and callback. Arguments are
`OUTPUT x64|arm64 WORKERS [--checks] OBJECT...`. Compile `elf_link_program.tower`
and `elf_link_library.tower` separately for each target, then pass `--checks`
followed by program object, the corresponding `build/targets/*-runtime.o`, and
library object. The Tower checks construct an indexed archive with an unused
malformed member and validate backward lazy extraction, byte-identical 1/2/4/8
worker outputs, barrier-proven overlap, deterministic worker failures, cancellation,
single-use/reset rules, truncation/overflow/target rejection and symbol policies.
Run the resulting x86-64 executable directly and ARM64 with `qemu-aarch64`;
both print `42`, `50`, `42`. Repeat with `--no-optimize` program objects and compare
execution with SDK34's `ld.lld -static -e _start`. Browser cross-compilation and
download execution checks exercise the actual production service.

`wasm_link_reader.tower` checks bounded LEB/object/archive decoding, independent
worlds and pinned disposal, symbol selection, wrapping, direct-call signature
variants versus address-only declarations, relocation bit patterns, import/weak
policies, shared-memory legality and failure without partial output.
It also checks lazy GNU archive extraction, backward references, recursive member
dependencies, cycles, weak references, exports, COMDAT alternatives, unused
malformed members, byte-only plans and deterministic retry cleanup. Memory-profile
cases cover defined/imported memory, default/custom/empty UTF-8 names, optional
maximum limits, memory re-exports and invalid requests without partial output.
Build it with the public bootstrap's `--library`, then link the object with the
existing `guest-host-library.o`, plus current `host/work_linux.tower` and
`host/work_dispatch.tower` objects using clang with `-pthread -ldl
-Wl,--export-dynamic-symbol=work_thread_entry`. `wasm_link_reader_wasi.tower` adds
the existing Tower allocator and a WASI `_start`; compile it for
`wasm32-unknown-wasi`, link against the compiler project's support archive, and
run with `node scaffolding/tests/host-wasi.mjs OUTPUT.wasm`.

`tools/wasm_link_static.tower` is the standalone experimental linker adapter;
`tools/wasm_link_audit.tower` reads and optionally resolves real support archives.
Both build as library objects with the same native runtime. The static tool
supports explicit `--whole-archive`, `--export=`, `--export-if-defined=`, `--wrap=`,
allow-undefined lists, stack/memory limits, `--import-memory[=module,name]`,
`--shared-memory`, `--threads=N` and `-o`. Its optional
`--export-if-defined-list=FILE` reads one export name per line to avoid host
command-line limits; `--debug-names` retains symbolic Wasm stack traces.
Indexed GNU archives are lazy by default; `--whole-archive` requests every member.
Thin/BSD-index archives remain unsupported. TLS64, memory64, tags, referential global initializers,
dynamic/relocatable output and DWARF/custom-section preservation
are not implemented. Requests for currently recognized unsupported profiles
fail explicitly; this is not a complete drop-in `wasm-ld` CLI.

Compile `wasm_link_program.tower` and `wasm_link_library.tower` separately with
and without `--no-optimize`. Link both objects with `--export=_start`,
`--stack-first`, and the real `support-tower-0.a` under `--whole-archive`.
Both this linker and upstream LLD must execute through `host-wasi.mjs` and print
`Tower Wasm linker execution passed`. Compiler-sized relink checks can use
`TOWER_TEST_WASM` and `TOWER_TEST_LLVM_WASM` with the existing test fixture loaders
without replacing the active build artifacts. The journal records exact local
commands, the current gates and baseline test-expectation failures.

To execute an imported-memory fixture, provide `TOWER_TEST_MEMORY_MODULE`,
`TOWER_TEST_MEMORY_NAME`, `TOWER_TEST_MEMORY_INITIAL` and
`TOWER_TEST_MEMORY_MAXIMUM` to the same host runner. Sizes are Wasm pages. This
only supplies the host memory; assertions and linking remain Tower code.

`wasm_link_shared.tower` adds shared-memory feature/limit/reserved-symbol
rejections, start/data-count/flag layout, passive segments and collected-segment
index checks. `wasm_link_shared_generate.tower` builds with the same native runtime
and accepts `fixture.o image.wasm`. It writes a stack-free executable fixture with
all assertions in Tower-authored Wasm byte fixtures. To exercise real instances,
set `TOWER_TEST_MEMORY_INITIAL=32`, `TOWER_TEST_MEMORY_MAXIMUM=32768`, and
`TOWER_TEST_INSTANCE_PHASES` to this JSON, then run the existing host runner:

```json
[{"entry":"cold","workers":8},{"entry":"mutate","workers":1},{"entry":"warm","workers":8},{"entry":"finish","workers":1}]
```

The host only supplies shared memory, worker lifetimes and exported calls, with
a 30-second worker deadline. Tower checks cold data, a second retained segment
after a collected segment, preservation of mutations across new instances, and
the exact shared atomic completion count. Compare the same object with SDK 34
`wasm-ld --no-entry --no-stack-first --shared-memory --import-memory
--initial-memory=2097152 --max-memory=2147483648 fixture.o -o reference.wasm`.
The explicit stack policy matches this fixture's deliberate absolute addresses;
newer LLD defaults to stack-first. These stack-free instances do not establish
TLS or a full threaded compiler runtime, nor prove every wait/wakeup schedule.

`wasm_link_tls_generate.tower` takes `fixture.o image.wasm [--common]`. It checks
identical TLS images at one/two/four linker workers. Run its image through the
same shared-instance transport with phases
`[{"entry":"check","workers":8},{"entry":"finish","workers":1}]`.
Tower assertions cover two aligned TLS segments, zero padding, repeated fresh
initialization, isolation, mutable GOT addresses and TLS-to-TLS pointer fixups.
`--common` omits pointer initializers for the LLD comparison: SDK 34's static
shared profile writes those fixups to the static block, not the new TLS region.
The full Tower case is additional coverage, not a claim of reference equivalence.

`wasm_link_job_checks.tower` is part of the reader suite. Two native relocation
kernels must both reach a semaphore barrier before either is released; their
bytes then match serial output. It also checks ordered errors at one/two/four
workers, cooperative cancellation, draining/unpinning, unchanged old artifacts,
TLS ABI globals, unshared segment modes and invalid TLS signatures/offsets.
Portable hosts run the same functional suite at their advertised single-lane
capacity; the native overlap probe does not claim overlap on those hosts.

`wasm_link_reader_threads.tower` supplies the existing shared-Wasm work/memory
transport. Compile with `--library --target wasm32-unknown-unknown`, then link
using the same SDK 34 arguments/runtime objects as `tower-work-tests` in
`cmake/TowerWorkTests.cmake`. Its Tower `main` is already exported; adding the
linker `--export=main` also selects wasi-libc's wrapper and causes a duplicate.
Set `TOWER_TEST_WORK_WASM` to this image and `TOWER_REQUIRE_THREADS=1`, then run
`node --test --test-name-pattern='pool overlaps' playground/tests/compiler-threads.test.mjs`.
This reuses the transport's 128 lifecycle calls; the reader's Tower assertions
require two real relocation kernels at their barrier and test ordered failure,
cancellation and TLS validation. It does not turn the isolated LLVM reactor into
a shared-memory compiler or replace wasi-libc's thread startup.

`wasm_link_exports.tower`, included in the reader suite, exercises real encoded
export-name overrides, empty names, explicit/automatic export deduplication,
collision diagnostics, invalid indexes and fixed/growable table limits.
Thread-runtime integration links the shared reader and the real threaded
portable compiler with Tower, including SDK 34's `crt1-reactor.o`, pthread/libc
and compiler-builtins archives. Preserve the build's allocator wraps, allowed
host imports, exported table, `--growable-table`, shared imported memory and
stack/memory limits. Use `--no-entry --export=_initialize` for the reactor.
Run the existing compiler-threads test transport with `TOWER_TEST_WORK_WASM`
pointing to the Tower-linked reader, `TOWER_TEST_WASM` to the Tower-linked
compiler and `TOWER_REQUIRE_THREADS=1`. It covers actual overlap, worker failure,
and compiler determinism at one/two/four/eight workers. These links still use
the third-party wasi-libc thread ABI; Tower owns job scheduling and the linker.

`backend/wasm_link_plan.tower` accepts length-delimited arguments and explicitly
named input bytes, including allow/export lists. Its keys need no NUL terminator.
`backend/linker_tower_wasm.tower` adapts the existing `BackendLink` ownership API;
each invocation uses an independent link world and publishes an owned image.
Existing reactor transports use it by default, with `tower-wasm-ld` as argument zero.
They must supply every input byte; no filesystem search or native fallback occurs.
Historical `wasm-ld` recipe names also use Tower. There is no Wasm LLD fallback.

`wasm_link_reactor.tower` is a separate WASI entry linked against the actual
backend/compiler units and support archives. It checks explicit Tower dispatch,
absence of a temporary output file, unsupported-option failure without fallback,
and byte-identical retry output. Run it through the same `host-wasi.mjs` binding.
The existing `playground/scripts/test-compiler-project.mjs` transport accepts
`TOWER_TEST_COMPILER_PROJECT` and `TOWER_TEST_COMPILER_WORKBENCH` directory URLs
(relative to the repository, with trailing `/`) plus `TOWER_TEST_LLVM_WASM`.
Package current compiler units with the existing packager into an isolated
directory and select those paths; generated recipes already use Tower and lazy
archives. Two generations with two/four workers pass for both whole and
lazy archives, including edited semantic behavior, executable compiler checks
and identical successor hashes. TLS and actual linker-kernel overlap have separate
fixtures above; compilation worker counts do not establish parallel execution
inside one link request. Actual SDK34 thread-runtime compatibility is validated;
dynamic linking, memory64 and wider object profiles remain separate work.

The obsolete LLD Wasm compatibility patcher and its fixtures are retired with
the lldWasm dependency. Earlier journal entries and Git history retain the
SDK34 first-page backport evidence. Tower handles that ABI directly.

`tool_archive_checks.tower` covers the Tower CRC/ZIP/Roku tools and POSIX path
protection. `deflate_checks.tower` writes a 161-member ZIP corpus plus independent
expected files; validate/extract it with a standard ZIP reader, then compare the
directories byte for byte. Both build as library objects linked with the existing
`guest-host-library.o`, with no zlib dependency. The journal's in-house archive
entry records the Docker/WSL commands, codec scope and compression tradeoff.

`tool_process_checks.tower` validates the Linux tool runner with exact child
arguments, empty strings, ordinary exits, signals, exec/redirection failures,
large binary stdout capture and unchanged output on failure. Build it as
a library object, link `guest-host-library.o`, then run it by absolute path.
The argument helper avoids the published bootstrap's duplicate-literal issue
when string literals are passed directly to inferred generic calls.

`sha256_checks.tower` checks standard SHA-256 vectors, all chunk splits, a million
`a` bytes, non-consuming finalization and rejected input. Pass a writable fixture
directory, then independently verify its 260 binary fixtures with
`sha256sum --quiet -c <directory>/checksums.txt`.
`tool_files_checks.tower` takes a new fixture directory and checks bounded reads,
resource traversal, file/directory symlink policy and atomic publication refusing
file, directory and dangling-symlink collisions. Both build as library
objects linked with `guest-host-library.o`. The journal records the independent
Python packager comparison and subsequent removal of the bootstrap archive/
installer layer in favor of directly runnable checked-in files. Reader/installer
experiments are preserved in Git history; they are not required build tooling.

The same runtime/parser now also runs in the [static WASM playground](../../playground/README.md).
`target_pack_import_checks.tower` checks the minimal import-definition grammar,
duplicate/unsupported declarations, the 256-symbol limit and atomic COFF output
ownership. Build/link it like the POSIX utility checks above. The portable
`coff_import_checks.tower` fingerprints the original stack-probe import archive;
run it with `run-guest-runtime.mjs COMPILER SOURCE EXPECTED_OUTPUT_FILE`, where
the expected file contains `true` followed by a newline, to cover 32/64-bit
interpretation and native/Wasm execution.

`compiler_support_checks.tower` exercises deterministic indexed GNU ar output,
archive symbol closure, duplicate member names, seed exclusion, chunk bounds and
malformed inputs. Pass a new writable fixture directory and optionally a real
Wasm archive; the optional differential checks every member with LLVM's reader.
`compiler_support_program.tower` supplies executable Tower assertions for lazy
and whole-archive links. `tool_words_checks.tower` checks distinct shell/Make
argument decoding and captured Clang diagnostics; optional build-directory and
binary arguments inspect a real final Ninja recipe. These checks link the same
guest host object as the other tooling fixtures.
`compiler_project_compare.tower OLD_DIRECTORY NEW_DIRECTORY` independently
decompresses support packs with gzip and compares every object payload hash as
a multiset. Full package validation also runs the two browser generations above.

Native and WASM parser builds use explicit error returns with C++ exceptions disabled.

The standalone `tower-bytes-tests` and `tower-utf8-tests` targets now run Tower
test entries. Build them in the parser configuration and run
`ctest --test-dir <build> -R 'tower-(bytes|utf8)-tests' --output-on-failure`.
The byte tests retain all 20,000 seeded reference comparisons, a Tower moving
allocator with guards and failure injection, aliasing and overflow checks. UTF-8
retains exhaustive scalar and one/two-byte comparisons, seeded malformed inputs,
and protected-page checks on Linux/macOS. Their native reference oracle seeds
remain test-only. For WASI builds, run each executable with `host-wasi.mjs`;
WASI exercises the byte guards but has no POSIX protected-page test.

`tower-lexer-tests` and `tower-entity-tests` are separate Tower entries in the
parser configuration, also executable through `host-wasi.mjs`. Lexer coverage
preserves 150 seeded NFAs against direct simulation, 500 seeded lexer tables
against the native reference, and allocation-failure sweeps. Entity coverage
uses an explicitly owned store and Tower finalizers. The browser node self-test
also runs Tower (`nodes.tower`) through the production lifecycle dispatch.

Compiler storage and the compiled Foundation entity-registry checks now execute
in Tower from the parser aggregate. For a focused native run, configure
`-DTOWER_STORAGE_TESTS=ON`, build `tower-storage-tests`, and run
`ctest --test-dir <build> -R '^tower-storage$' --output-on-failure`.
This uses the same production parser/compiler services and an instrumented
allocator; it covers UTF-8 source locations, deep copies and ownership transfers,
Foundation payloads, borrowed edges, aliasing, failure atomicity, 600-level tree
clones, 100 session resets and source provenance surviving session destruction.

`tower-storage-tests RESOURCE_ROOT runtime-faults` selects the existing LR runtime
allocation oracle without installing unrelated grammar baselines. It checks
serial and worker-result construction, exact `Memory` versus ordinary grammar
conflicts, deterministic allocation failures, unchanged reference rows and clean
retry. Sweep bounds and retained test arrays derive from each successful run's
allocation count. This uses the single-owner fault allocator; real concurrency
is checked separately by `tower-lr-work-tests RESOURCE_ROOT lr` and unit profiles.

`tower-storage-tests RESOURCE_ROOT diagnostic-faults` selects the diagnostic
construction oracle with the same single-owner allocator. At both target widths
it denies every observed allocation boundary for plain and generic-trace
diagnostics, checks physical budget denial, preserves the explicit source offset
when generated spans differ, and verifies private current/scope restoration.
Retained semantic and resource failures reject later declaration admission without
another allocation or diagnostic. This selector needs no grammar bootstrap run.

Formatter fixtures now run in Tower. Configure the native build with
`-DTOWER_FORMAT_TESTS=ON`, build `tower-format-tests`, and run
`ctest --test-dir <build> -R '^tower-format$' --output-on-failure`.
The WASI parser configuration provides the same standalone target, executable
through `host-wasi.mjs`. The parser aggregate also calls the focused suite.
Sixteen frozen fixtures preserve exact UTF-8 text and ordered source-span triples
independently verified against the unchanged former native formatter on Linux
and WASI before its retirement. Coverage includes source and Foundation round
trips, generated names/literals containing NUL, comment order, 32 source-layout
allocation failures and 32 Foundation-result failures with empty published
output and complete cleanup. The temporary syntax-result ABI is explicitly
restricted to Linux x86_64/libstdc++ and WASI SDK 34/libc++.

The broad repository formatting check remains available as the separate native
`-DTOWER_FORMAT_SWEEP=ON` / `tower-format-repository` CTest. It checks canonical
source, idempotence, filename-relative modules, Bedrock/Foundation baselines and
invalid syntax fixtures. It is off by default and was not run during this
migration; a two-file check exercised its valid/invalid file-list path. The
scoped native `--emit source` / `--check-format` commands remain available.

`tower-parser-tests --suite nodes` selects the focused native/WASI payload suite.
It retains the native syntax-payload suite's independent equality traversal,
all 17 exported field offsets, NUL-containing fields/comments, retained
source/pattern/replacement ownership, 64-child comparisons and allocation-failure
atomicity. The parser aggregate calls the same Tower cases.

`tower-parser-tests --suite reader` runs declaration-reader coverage against an
independent Tower oracle verified against the retired native reference. It preserves
all 1,000 seeded identifier/literal byte cases,
in-place/aliased decoding, eight declaration fixtures, exact malformed-tree
diagnostics, shared source provenance, canonical declaration output and allocation
failures. Native CTest sets its working directory to the grammar resources.
The parser aggregate calls the same cases.

`tower-parser-tests --suite validation` checks grammar validation against the
independent Tower oracle on Linux and WASI. It compares exact result/error/offset/pending-term
identity and order, required declaration captures, nullable/productive rules,
forward references, NUL-containing names, 1,500 captures, 600 seeded dependency
graphs and allocation-failure cleanup. It uses the same grammar setup and runner
conventions as the focused reader suite.
The reference was translated from the frozen native seed with SHA-256
`094f9e736b6ab469a30630a7effd81ddb9b706f9af6d85df6d870a4168eb8850`.
Native/Tower-reference/production three-way comparisons passed on both targets
before removing the native seed; the permanent tests keep the independent
reference comparison. Its sorted borrowed views and reference dependency scan
do not reuse the production validator's indexes or checking policy.

`tower-parser-tests --suite live` runs the migrated live-session suite independently
on native and WASI: sequential grammar installation, replacement provenance and
ownership, LR boundaries, rejected edits, cache reuse and lexical definitions.
Its separate Tower object also supplies `syntax_tests` through the existing
parser interface. The aggregate entry and `--trace`, `--host-only`, `--parse`
dispatch live in `parser_main.tower`; the command preserves failure exit codes
and grammar revision/tree output. `nodes.tower` retains attachment, named-member,
reference-count and payload-lifetime assertions. A Tower lifecycle ID replaces
the unused native callback registry; the fixture checks userdata/owner/type,
exactly-once finalization, independent-store ownership and allocation balance.
This does not introduce general first-class function pointers.

The same command also selects `regex`, `lexicon`, `lr-grammar`, `lr-analysis`,
and `emission`. These nine focused suites replace their duplicate executables
and generated entry programs; their existing CTest names remain unchanged.
`--suite modules` additionally isolates import resolution, grammar/syntax cache
ownership, invalidation and overlapping parser-session lifetime checks.
`--suite NAME` is a separate invocation from the aggregate's other options.
Each run uses the original suite's initialization; reader/live/validation/modules
require the working directory to contain Bedrock and Foundation. The emission
suite retains its two-pass allocation/lifetime check. Fixture and oracle objects
remain separately compiled, with the shared build helper tracking their imports.

The shared WASI runner mounts the source tree and forwards command arguments:

```text
node scaffolding/tests/host-wasi.mjs path/to/tower-parser-tests --suite reader
```

The parser and interpreter suites use this same transport, including the complete
Foundation/type prelude. The `source/` aliases preserve fixture file identities.

The focused `tower-format` and `tower-storage` CTests run with `scaffolding` as
their working directory. Their independent fixture module environments resolve
the Foundation/type prelude there. Direct executable invocations need that same
working directory as well as the resource-root argument.

The isolated `cmake/TowerDriver.cmake` fragment adds CLI checks with
`-DTOWER_DRIVER_TESTS=ON` to a native compiler configuration. Build `towerc` and
`tower-driver-tests`, then run `ctest --test-dir <build> -R tower-driver
--output-on-failure`. The runner and fixtures are Tower; it launches the real CLI
and checks output/error bytes, flags, both interpreters, dependency/IR outputs,
Foundation/C/BrightScript/bytecode outputs, separate library linking and executable
results. Policy checks also cover target link arguments, timing serialization,
argument boundaries and temporary cleanup after tool failure. Fixtures stay out
of the production driver object. The standalone runner uses the Tower guest
runtime artifact for allocation, output and traps.

For browser backend service ownership checks, configure the LLVM browser build
with `-DTOWER_BACKEND_TESTS=ON`, rebuild it, then run
`TOWER_REQUIRE_BACKEND_TESTS=1 node --test playground/tests/backend-worlds.test.mjs`.
The Tower fixture checks explicit-world source compilation and optimized
Foundation reconstruction, foreign-environment rejection, retained output and
independent world cleanup. JavaScript only supplies baseline bytes and invokes it.

Windows process/quoting checks can run independently of a Windows compiler build:
cross-compile a manifest importing the driver support, timing, windows_arguments,
windows, link and prepare modules plus `tests.driver_windows` and `tests.driver`.
Separately compile `tests/driver_standalone.tower` and `library/bytes.tower`; link
the three objects with a Tower guest runtime built without its entry point, the
Windows CRT and kernel32. Run without a compiler argument for platform checks.
The standalone provenance stub is unused by these tests; actual CLI diagnostics
are checked by launching a real compiler, never by that stub.

The parser command also runs `host_runtime.tower`: CLI ordering, borrowed argument
lifetimes, link-array cleanup, allocation overflow, zero-size release and injected
allocation failures are tested in Tower. `towerc-stage1` and `towerc` use the
Tower host implementations. The obsolete native driver seed has been removed;
the current compiler still contains other native compiler adapters.

`host.tower` checks JSON byte escaping, exact unsigned 64-bit serialization,
buffer aliasing and typed browser handle ownership. `interpreter_storage.tower`
checks execution-memory growth/failure, sorted maps, frame/task storage and
disposal. Both run in the parser command, alongside the retained native
reference comparisons. Their functional cases and storage implementations are
Tower source.

The Tower `check_core wasi REPOSITORY BUILD_DIRECTORY VERIFIED_COMPILER WASI_SDK`
command (built with `build-bootstrap.sh --tools check_core`) builds and runs the complete
WASI parser and interpreter differential commands. The bootstrap comparison
script also compares six Tower modules across Linux x64, wasm32, Windows x64
and macOS ARM64 object targets. These object comparisons are distinct from
native execution and whole-compiler self-hosting.

To run this complete command on Wasm32, configure `TOWER_PARSER_ONLY=ON` with
the WASI SDK toolchain and a host `TOWER_BOOTSTRAP_COMPILER`, build
`tower-parser-tests`, then run:

```text
node scaffolding/tests/host-wasi.mjs path/to/tower-parser-tests
```

This runner mounts the checked-out Tower fixtures in the same portable WASI host
used by the playground. CMake makes the formatter fixture's source paths relative
to that mount; the test does not require the original build machine's filesystem.

Run the native tree/parser checks without building LLVM or the WASI runtime with
`check_core native REPOSITORY BUILD_DIRECTORY VERIFIED_COMPILER`. Build this Tower
tool with `build-bootstrap.sh --tools check_core`. The documented Linux bootstrap
and Docker route also works from a Windows host; no generated PowerShell/cmd
compiler adapter is needed.

The syntax suite also checks replacement chains, named/repeated captures, empty
bodies, duplicate-use ownership, unused captures, named helper activation, atomic
template errors, recursion limits, and provenance surviving session destruction.
The WASM suite additionally checks parsed-tree shape against ordinary source,
grammar/lexer edits, source-offset changes, optional captures and deep identity
expansion without subtree copying. These exercise the production Tower modules
on native and Wasm hosts.

Alternatively, use CMake directly with a verified Tower compiler and the platform
linker toolchain:

```text
cmake -S . -B build/parser-cmake -DTOWER_PARSER_ONLY=ON -DTOWER_BOOTSTRAP_COMPILER=/path/to/towerc
cmake --build build/parser-cmake --config Release
ctest --test-dir build/parser-cmake -C Release --output-on-failure
```

For a native Windows build, run these commands in the Visual Studio Developer
Command Prompt, supply a compatible Windows `towerc.exe`, and select `-G Ninja
-DCMAKE_CXX_COMPILER=cl -DTOWER_UTILITIES_TARGET=x86_64-pc-windows-msvc` at configure
time. A native Windows bootstrap is optional; the checked-in Linux bootstrap is
the canonical build path.

The executable accepts `--parse FILE` for one source and `--trace` for table
construction and shift/reduce events. Run it with `scaffolding` as the working
directory, for example `../build/parser-cmake/tower-parser-tests --trace --parse
examples/replacements.tower` (append `.exe` on Windows). These are ordinary Tower
entry-point options; they do not require a wrapper or installation step.

The test executable prints the complete tree for `1+2*3`:

```text
rule E #1 [0, 5)
  rule E #2 [0, 1)
    rule T #4 [0, 1)
      rule F #6 [0, 1)
        token '1' [0, 1)
  token '+' [1, 2)
  rule T #3 [2, 5)
    rule T #4 [2, 3)
      rule F #6 [2, 3)
        token '2' [2, 3)
    token '*' [3, 4)
    rule F #6 [4, 5)
      token '3' [4, 5)
```

`#N` is the production index, distinguishing alternatives with the same rule
name. Spans are half-open source byte ranges `[start, end)`. UTF-8 characters
can occupy multiple bytes. Empty productions have zero-length spans at the
current input gap. Generated helper rules flatten their children in order;
the start rule retains a root node even if marked generated.

## Using the API

```cpp
Recognizer* recognizer = parser_recognizer_create(table, stream);
bool running = true;
TowerNode* root = nullptr;
while (running) {
    root = parser_recognizer_step(recognizer, &running);
}
if (root) {
    parser_tree_debug_print(root);
    tower_node_release_ref(root);
} else {
    fprintf(stderr, "%s\n", parser_recognizer_get_error(recognizer));
}
parser_recognizer_destroy(recognizer);
```

The table and stream must outlive the recognizer. Acceptance transfers one
reference to the caller; the returned tree and its debug labels survive parser,
table and input destruction. Destroying an incomplete or failed recognizer releases
its partial tree and owned lookahead. Stream callbacks transfer one owned reference
for any returned node; existing components and child nodes are preserved.

`parser_tree_debug_string(root)` returns the same formatted output for tooling or
tests. Release its buffer with `tower_memory_free`. It can also inspect ordinary
nodes without `Match` components, printing `node` and walking their children.

Validation covers exact tree shape, precedence, associativity, parentheses, LALR
lookahead, nullable sequences, generated helpers, character ranges, UTF-8 spans,
escaped debug labels, token payload preservation, stream layering, invalid input,
early destruction and allocation counts. The original tree/component/table checks
also run.

## Live grammar declarations and foreach

[foreach.tower](../examples/foreach.tower) defines its own loop syntax:

```text
parse Variable = Identifier;
parse Expression = Identifier | Number;
parse Statement = Expression ';';
parse ForEach = 'for' '(' $Variable 'in' $Expression ')' '{' $Statement* '}';
parse Statement |= ForEach;

for (item in items) {
    item;
    for (child in children) { child; }
}
```

The same file later replaces `ForEach` with a rule using the keyword `foreach`,
then immediately parses that spelling. No loop syntax or keyword is hard-coded
in [the native seed](../bedrock.cpp). The seed always reads bedrock.tower; the
resulting declaration grammar reads foundation.tower and later source. Native
declaration evaluation installs their shared semantic rule nodes. This is an
executable bootstrap subset of Tower's grammar language, not yet an interpreter
for arbitrary Tower function bodies or loop execution/lowering.

Supported forms:

- `parse Name = ...;` defines or replaces a rule.
- `parse Name |= ...;` adds alternatives to an existing rule.
- Concatenation, `|` alternatives, and postfix `*`, `+`, `?` are supported.
- Single/double-quoted token literals and rule references are supported.
- `$Name` captures a reference as a named tree child. `$Name*`, `$Name+`, and
  `$Name?` produce one named container, including a container for zero matches.
- `token` and `skip` declarations define terminals and trivia. The default
  Identifier, String, whitespace and comment rules are inherited from
  [bedrock.tower](../bedrock.tower); Number is added by
  [foundation.tower](../foundation.tower). Local declarations can replace them.
  See [token syntax](../../playground/TOKENS.md).

Token literals are whole identifier-like keywords or punctuation sequences. The
lexer chooses the longest punctuation literal in the current grammar; keywords
match whole words. Mixed word/punctuation tokens, whitespace-containing literals,
quote/comment delimiter literals and grouped grammar expressions are not implemented.
Rule references must resolve when the declaration is installed (self-recursion is
allowed when productive). Bedrock's GrammarAssignment, GrammarAtom and other
rules are reusable by name. No `__` prefix is reserved; parse and token rule names
cannot collide. Generated helper names avoid all names in the active grammar.

`Statement` is the designated application entry rule. Declarations and statements
are parsed one at a time using the same LALR implementation as the tree tests.
Use `ParserTableMode::Constructs` when building a table for
`parser_recognizer_create_prefix()`. The start rule's lookaheads include EOF and
FIRST(start), checking conflicts between consecutive constructs during table
construction. Real lookahead chooses continuations: `ForEach | 'for'` accepts
both a bare `for` and the full loop. `'x' | 'x' 'x'` is rejected because `x x`
could be one construct or two. Diagnostics identify shift/reduce or reduce/reduce
conflicts and their competing actions.

States with one uniform EOF reduction can reduce without reading ahead. Otherwise
the recognizer keeps one lookahead token. When that token has no table action,
EOF reductions may finish the current construct; they run once on the real stack.
There are no copied stacks, trial parses or fallback to an earlier accepted prefix
after shifting a continuation. Unconsumed lookahead, including an owned node or
stream error, is returned to the stream. An incomplete `for(` therefore errors
rather than becoming a bare `for`.

At each declaration boundary the driver compiles a candidate table and publishes
it only if validation succeeds. It destroys the previous recognizer before swapping
tables. No parser state or lexed lookahead is carried into the next grammar revision.
Malformed declarations, unresolved references, conflicts, duplicate captures,
nullable statements and unproductive repetitions return diagnostics. A failed
installation leaves the previous grammar revision intact and stops the session.
A session caches up to 64 compiled grammars; new definitions still require table
construction. This is not temporal repair yet.

The session API is in [syntax_session_setup.tower](../compiler/syntax_session_setup.tower)
and [syntax_session_scan.tower](../compiler/syntax_session_scan.tower). `syntax_next()` transfers one
root per declaration or statement. `syntax_get_error()` distinguishes failure from
EOF. Roots, copied labels and named captures survive later declarations and session
destruction; numeric match and production IDs remain local to their original table.

Tests exercise consecutive declarations with no separating whitespace, keyword
activation, keyword replacement/removal, nested loops, empty bodies, captures,
repetition, strings/comments, atomic failure, and retained-tree lifetime. A low-level
stream test checks that self-delimiting recognition stops without reading ahead;
another checks ownership of a buffered lookahead. The syntax driver discards
uncommitted highlight spans and resumes at the accepted root's byte end, so the
next declaration or grammar revision can tokenize afresh. Work counters check
linear scaling across nesting and repetitions in both recursion directions.
CTest also parses the actual example file.

## Current boundaries

Whole-input recognition and explicit construct-prefix recognition are available.
A recognizer-backed stream still exposes one accepted root and then EOF; the syntax
session uses a separate lazy token stream. Arbitrary reduction callbacks, scoped
grammar imports, general character-range partitioning and syntax-error recovery
remain separate work. Checked table creation now reports unresolved rules and
conflicting actions; internal assertions still guard unsupported table invariants.

## Windows COFF/PE linker

`pe_link_driver.tower` is a Linux-hosted byte-service runner producing real
Windows x64 executables. Compile it with the documented bootstrap using
`--library --emit object`, link the existing guest-host-library.o with pthread/dl,
then run `pe_link_driver output.exe 4 --checks program.o runtime.o library.o kernel32.lib`.
Use `pe_link_program.tower` and `pe_link_library.tower` as Windows target objects;
repeat the program compilation with `--no-optimize`. Run both resulting EXEs on
Windows: each must print 42, 50, 42. The 64 KiB frame exercises the actual imported
OS stack probe. Compare with SDK lld-link using the same object/import inputs.

`pe_link_checks.tower` checks lazy archives (including an unused invalid member),
raw object bounds, byte API equivalence/failure/retry, target rejection, named
exports, relocation values/base-relocation generation, worker counts 1/2/4/8,
barrier-proven real overlap and cancellation while work is active. Every check
and fixture is Tower. The existing backend test covers generated input ownership
and plan reset; browser cross-compilation tests cover actual download transport.

## Typed core interpreter

The Tower execution suite (`execution_main.tower`) replaces the native
`core-tests.cpp` harness. Enable `TOWER_EXECUTION_TESTS=ON` in the documented native
build, build `tower-execution-tests`, then run `ctest --test-dir <native-build>
-R '^tower-execution$' --output-on-failure`. The test passes the repository grammar
resource directory explicitly.

It checks 156 graph/fast interpreter trials (26 fixtures, two target pointer
widths, three step budgets), exact error text/offset agreement, guest memory,
foreign calls and relocation, allocation/reallocation, output limits and
cancellation. Core fixtures preserve graph structure and bindings through
canonical Foundation round trips, generic identity, target layouts, quoted names,
and request ownership. Package trials reconstruct checked Foundation, verify its
execution cache, reproduce identical bytes, and reject checksum corruption and
truncated envelopes. These tests use the production Tower execution session used
by the CLI. The same suite runs on WASI through `execution_wasi.tower` and the
Tower `check_core wasi` path. The native interpreter
adapter, reference interpreter and semantic reference seed have been retired.
Before removal, the unmodified semantic reference suite passed at both widths.
Tower fixtures retain its 53 exact invalid-program messages and offsets, complete
semantic-field/edge fingerprints for 12 valid programs per width, multifile
bindings and effects, and canonical/execution agreement. Fingerprints are test
evidence only, not a program format. The parser aggregate links the independent
Tower storage fault-injection tests without an interpreter host adapter.

The browser/WASM suite in `playground/tests/execution.test.mjs` additionally
exercises numeric conversions and traps, binary operations, control flow,
replacement source provenance, semantic ABI syntax changes and grammar reuse.

### Focused native scheduler regressions

With `TOWER_WORK_TESTS=ON`, native Linux x64 builds register the ready-index,
reservation ledger, shared-ledger overlap, admitted kernel dispatch, tool output
identity, semaphore observer, concurrent entity-stage and retained-buffer fixtures through the
common Tower object/runtime rules. `TOWER_SANITIZER=address` or `thread` uses the same targets and production
allocator; configured object manifests alone are not execution evidence.

```sh
cmake --build "$TOWER_NATIVE_BUILD" --parallel 1 --target \
  tower-work-ready-tests tower-work-budget-tests tower-work-budget-shared-tests \
  tower-work-kernel-admission-tests tower-tool-output-identity-tests \
  tower-work-signal-observe-tests tower-entity-stage-concurrent-tests \
  tower-work-buffer-tests tower-work-buffer-shared-tests tower-work-buffer-faults-tests
ctest --test-dir "$TOWER_NATIVE_BUILD" --output-on-failure \
  -R '^tower-(work-(ready|budget|budget-shared|kernel-admission|buffer|buffer-shared|buffer-faults)-tests|tool-output-identity-tests|work-signal-observe-tests-(try|wait)|entity-stage-concurrent-tests)$'
```

These checks preserve explicit stale/owner receipts, independent budget totals,
actual barrier-proven overlap, typed kernel projection and valid semaphore
handoffs. Fixed four/eight worker cases are concurrency stress, not the host's
recommended compilation budget. Failures/timeouts stay failures. Neither the
historical invalid-memory probe nor the intentional-race probe is registered.

The retained-buffer checks reserve replacement storage while the old allocation
is still live, preserve owners on denial, transfer receipts with buffers, and
retain charges after joins/cancellation until disposal. The shared fixture uses
four real worker threads. The separate faults fixture uses only the existing
single-owner allocation injector and serial transport; it is not race coverage.

The declaration-only entity creation fixtures use the same registration rules:

```sh
cmake --build "$TOWER_NATIVE_BUILD" --parallel 1 --target \
  tower-entity-create-result-tests tower-entity-create-faults-tests
ctest --test-dir "$TOWER_NATIVE_BUILD" --output-on-failure \
  -R '^tower-entity-create-(result|faults)-tests$'
```

Both link the shared entities implementation and exactly one existing memory
provider. The result fixture uses the production allocator and checks private
receipts, pinned views, finite identities, ordered relations and cleanup. The
fault fixture uses the existing single-owner allocator/serial transport and checks
denied allocation, unchanged ownership and successful retry. These fixtures are
serial API checks; neither establishes worker overlap.

Five measurement targets are excluded from the default build and CTest. Request
one explicitly, with exclusive host budget and frozen inputs:

```sh
cmake --build "$TOWER_NATIVE_BUILD" --parallel 1 --target tower-measure-work-select
cmake --build "$TOWER_NATIVE_BUILD" --parallel 1 --target tower-measure-work-budget-profile
cmake --build "$TOWER_NATIVE_BUILD" --parallel 1 --target tower-measure-work-kernel-overhead
cmake --build "$TOWER_NATIVE_BUILD" --parallel 1 --target tower-measure-work-kernel-profile
cmake --build "$TOWER_NATIVE_BUILD" --parallel 1 --target tower-measure-work-buffer-profile
```

They check workload results and report timing/memory fields; no timing threshold
is a correctness oracle. The Linux x64 clock/rusage ABI and reported capacity
sums do not establish portable host coverage or total live allocator bytes.
Record exact source/artifact identity, repeats and runtime coverage alongside
results. This registration does not itself validate any incoming source bundle;
current implementation and execution receipts remain in the D1 audit/journal.

The buffer measurement target supplies `budget 1`. For equivalent baseline and
accounted runs, invoke `tower-work-buffer-profile-tests baseline 1` and
`tower-work-buffer-profile-tests budget 1` in that build directory; repeat both
with `2` for a two-lane host. Supported counts are1/2/4/8. The workload always
performs262144 replacements and checks the retained bytes independently. Its ten
fields are workers, budget mode, wall nanoseconds, CPU microseconds, peak RSS KiB,
observed interval overlap, allocation calls, retained payload bytes, peak charged
bytes and retained ledger bytes. Timing excludes pool setup and postjoin
verification/disposal. Charged bytes include the compiler header but exclude
ledger storage, allocator-private overhead and RSS; this is buffer-accounting
cost, not evidence of a complete compiler memory limit or useful core scaling.

The common-lifetime arena fixtures use the same native registration and
instrumentation rules: `tower-work-arena-tests`,
`tower-work-arena-shared-tests` and the separate serial allocator target
`tower-work-arena-faults-tests`. The shared fixture checks four distinct threads,
cancelled and denied work, stable slice addresses, retained grants after joins,
and complete chunk transfer before disposal. These checks cover explicit arena
ownership, not fallible allocation propagation throughout the compiler.

The opt-in `tower-measure-work-arena-profile` target runs `arena16 1 large`.
Its executable accepts `baseline|arena4|arena16|arena64`, worker count `1|2|4|8`,
and `small|large` (2,048 or 262,144 objects). Compare equivalent inputs using
both allocation/join and retirement measurements. It checks every initialized
byte after timing and reports observed overlap, CPU/RSS, physical allocations,
payload, retained bytes, peak charge, ledger metadata and the equally unbudgeted
pointer index. Chunk capacity includes descriptors and alignment gaps; individual
slices have no free or implicit destructor. Compiler performance requires separate
caller measurements, and requested workers alone do not prove useful scaling.

Two opt-in Linux x64 compiler measurements reuse the production LR/backend
source and library composition with `TOWER_WORK_TESTS=ON` and
`TOWER_BACKEND_TESTS=ON`. Build and run `tower-measure-frontend-units` for three
independent units with two worker lanes and no extra bodies, or
`tower-measure-module-cache` for the import-cache cases. Neither is a CTest test
or part of the default build. They exclude the serial fault allocator/transport
and export the production worker/backend callbacks.

The frontend executable takes `RESOURCE_ROOT UNIT_COUNT WORKER_BUDGET BODY_COUNT
[backend]`. Compare identical inputs with worker budgets 1/2, retaining exact
canonical hashes and the independent answer 42 check. An equal-unit control with
multiple requested lanes must actually overlap on distinct threads; failure
keeps its raw measurements and exits nonzero. Skewed body workloads report their
observed overlap without assuming a speedup. Optional backend mode checks retained
ELF output envelopes, not independent execution of those objects.

The module-cache executable takes no arguments. It measures 3/18-layer diamond
imports with fresh and reused environments, checks unique module counts, changes
a shared leaf and verifies grammar invalidation, then releases every world/cache.
Its requested worker count alone is not concurrency evidence. Both measurements
report Linux x64 wall/CPU/RSS and retained counters with no timing pass threshold;
retain source, transport, samples and actual overlap alongside performance claims.

With both `TOWER_WORK_TESTS=ON` and `TOWER_BACKEND_TESTS=ON`, the separate
Linux x64 `tower-semantic-layout-profile` executable reuses the native compiler
unit link closure and production worker transport. It is excluded from default
builds and CTest; explicitly run `tower-measure-semantic-layout` to build and
measure it. Two warmups precede three samples at32/512/2048/4096/8192 fields,
requesting one or four lanes, plus an8192-field case with the other lanes reserved.
Host capacity can reduce the actual worker count.

Each result has eleven lines: requested lanes, fields, other-lane reservation,
pump wall nanoseconds, process CPU microseconds, process peak RSS KiB, observed
overlapping job intervals, caller jobs, summed job nanoseconds, retained derived
layout-vector bytes and ledger peak lanes. Sizes, alignments, every field offset,
exactly-once job observations and complete world/budget teardown are checked.
RSS is cumulative across trials; derived vector bytes are not total live memory.
This is a layout-pump measurement, not end-to-end compilation or a speed claim.

With `TOWER_EXECUTION_TESTS=ON`, the native Linux x64 build also provides the
opt-in `tower-type-reachability-profile RESOURCE_ROOT` executable and
`tower-measure-type-reachability` target. It shares the execution runner's
compiler/interpreter link closure; its platform ABI is not imported by that
runner and it is absent from default builds and CTest.

The profile compiles16/256/1000 sequentially called functions, checks the
independent output, then reports three samples of256 serial reachability queries
as JSON lines. It checks unchanged canonical Foundation and retained entity and
component counts, then closes each session. Query wall/CPU exclude compilation,
execution and formatting. Process peak RSS includes them; entity/component
counts do not measure all temporary buffer allocations. No parallel-query or
end-to-end speedup is implied.

For a focused frontend/backend streaming check, use
`tower-lr-work-tests RESOURCE_ROOT backend-overlap` from the existing native
worker runner. It builds the independent serial64-bit object baseline, then
runs the same two-worker streaming case used by the full `backend` selector.
Exact object bytes, shared-budget limits, distinct-thread barrier assertions and
the30-second internal deadline are unchanged. Phase messages identify baseline
versus streaming work; directional deadline errors identify the waiting side.
The focused selector does not replace the full backend matrix or its failures.

The existing worker and execution runners accept `capture-policy` for the
12 address/effect policy cases in the lifecycle fixture. This reuses the same
32/64-bit, serial/worker and successful canonical reconstruction checks. The
full42-case lifecycle gate remains in `type-smoke` and the broader body suites.
The focused selector does not replace aggregate or full-suite acceptance.

`aggregate_capture_inputs.tower` runs through the existing aggregate execution
helper from the `types`, `known`, `aggregate-stages` and full execution selections.
It checks nested aggregate/array, type/function/null-pointer and empty-field
captures, repeated frame use and independent copies. Both engines, target widths,
canonical reconstruction and worker1/2/4/8 comparisons reuse the original helper;
the original aggregate rejection fixtures remain unchanged.

`tower-frontend-tests RESOURCE_ROOT allocations` runs the existing serial
frontend snapshot allocation-failure checks without the unrelated body/parser
matrix. The default frontend invocation still runs these checks. This selector
does not provide production threading or whole compiler sanitizer coverage.

`tower-frontend-tests RESOURCE_ROOT parser` runs the existing parser integration
and failure suites without the unrelated body matrix. It includes valid trace
output and serial allocation-failure/ownership checks. Use the serial frontend
target for this fault allocator; it is not a threaded allocator sanitizer.

The existing native `tower-lr-work-tests RESOURCE_ROOT query-smoke` also runs
`semantic_resource_checks.tower`: required, inferred and declaration-isolated
startup and nested-frame storage denial for32/64-bit targets and1/4 requested workers. It requires failed
query receipts, first-source diagnostic selection, joined peers, no replay or
published value, and zero retained ownership. This reuses the production query
transport; serial fault instrumentation does not establish threaded coverage.

`tower-lr-work-tests RESOURCE_ROOT resource-smoke` selects only those24 resource
cases, using the same query-checks object and production transport. Growth cases
first gate Evaluate until both owning entry frames prepare successfully, then
reserve the measured remaining capacity. Per-job callbacks delegate to the
production kernel and observe the exact growth failure before disposal. Startup
cases separately require the initial-memory failure after constructor setup.
This mode isolates phase/cleanup checks and before/after measurements from the
adaptive clone workload; all/query retain their existing resource coverage.
Each width/worker group reports wall nanoseconds through the runner's existing
checked monotonic clock, excluding report formatting. Pair these small-group
measurements with process CPU/peak-RSS receipts; configured width is not overlap
or throughput evidence.

The same query entry runs `semantic_publish_checks.tower` once before its
width/worker loop:18 pressure cases plus4 pre-cancelled cases. These check joined
resource failures, source-ordered diagnostics, atomic canonical storage changes,
stable dispatch receipts and cancellation without new work. The separate
resource helper contributes24 startup/growth trials across the outer matrix.

`tower-lr-work-tests RESOURCE_ROOT lifecycle FIRST [LAST]` selects an inclusive
range from `SemanticLifecycleCase` (currently0–41), or one case when LAST is
omitted. It rejects empty, nondecimal, out-of-range and reversed bounds. Each case
prints and flushes start/completion receipts, using the unchanged32/64-bit and
1/4-worker assertions and successful canonical reparses. Default `all`, `bodies`
and `type-smoke` coverage is unchanged. Use separate case invocations for external
wall/CPU/RSS measurements; an unfinished case has no completion receipt.

`tower-lr-work-tests RESOURCE_ROOT type-errors` runs the existing post-lifecycle
part of `type-smoke`: body continuation, canonical reparse, binding failures and
declaration/type cycles for serial/four-worker budgets. Reuse a completed
lifecycle receipt for the same compiler inputs when iterating these checks.
This selector does not replace lifecycle coverage; `type-smoke` still runs both.

For a complete type/staging checkpoint without duplicate suites, run
`tower-lr-work-tests RESOURCE_ROOT lifecycle 0 41` followed by `type-errors`.
Together these select the existing `type-smoke` cases; do not additionally run
`type-smoke` or its `capture-policy` subset on the same frozen inputs.
`tower-execution-tests RESOURCE_ROOT type-staging` then selects the existing
constructor protocol, type binding/computed argument/type object/constructor,
known binding and staged aggregate suites. Their shared aggregate capture fixture
runs once. Individual `types`, `known`, `aggregate-stages` and `type-construction`
selectors retain their standalone coverage and need not run again.
These fixtures compare known outputs and canonical Foundation reconstruction at
32/64-bit target widths, using the graph and cached interpreters and requested
worker counts 1/2/4/8. Negative-case widths follow their existing helpers.
Use the existing lifecycle/staging-frontier tests for barrier-backed worker
overlap and scheduling contracts; a requested worker count by itself is not
overlap or throughput evidence. Retain the exact source and binary identities.

The serial `tower-frontend-tests RESOURCE_ROOT execution-index` selector runs the
existing executable-function index fixture, including exact canonical preservation,
declaration identity and allocation-failure cleanup. The default frontend suite
also runs it. Its pure backend helper avoids importing the full lowering unit.

For full native module/cache/session regressions, configure the existing native
work/backend test build with `-DTOWER_MODULE_TESTS=ON`, build
`tower-module-cache-tests`, then run it with `scaffolding` as the working directory
or select CTest `tower-module-cache-regressions`. This uses the existing
`parser_modules_work` composition and `module_cache_checks.tower` entry with
production transport. The separate cache profile's invalidation check does not
replace these malformed-input, cycle, resolution and session regressions.

The Linux x64 `tests/lr_state_benchmark.tower` measurement entry accepts an
optional final `runtime` argument. It measures runtime-table construction over
already prepared LR states, binds a finite synchronized world budget, and checks
every action/goto against a serial reference outside each interval. Reported
peak/current bytes include actual owned buffer headers; ledger metadata and
process peak RSS are separate columns. Each table must return its grants on
destruction. Requested workers and reserved lanes do not prove physical overlap.

`tower-work-budget-allocation-tests` runs the existing ledger metadata failure
fixture through the serial fault allocator. It checks rollback, output and receipt
preservation, slot reuse and stale releases. The registration reuses the host
memory object and instrumented runtime; it does not sanitize concurrent workers.

`tower-work-arena-linkage-tests` links the declaration-only arena client with one
separately compiled implementation and the ordinary guest runtime. It exercises
all six exported operations, physical retention, alignment, denial and ownership
transfer. The existing native work-test object rules apply supported sanitizer
instrumentation to both client and provider; no compiler entity unit is linked.

`tower-frontend-tests RESOURCE_ROOT grammar-resource` selects the existing syntax
version construction, cache and captured-replacement allocation-failure sweeps.
It checks typed resource denial, ordinary grammar diagnostics, optional uncached
success, pinned type admission and exact cleanup.
It uses the serial fault allocator; it does not test production worker overlap.

The same parser selector checks forest descriptor, child-index and traversal
storage: exact Capacity/Memory results, observed growth boundaries, preserved
receipts and entity ownership, then successful retries and final cleanup.
Attachment trials also require exact Busy for pinned owners, Invalid for self
attachment, and Memory from a real relationship allocation denial after the
traversal stack has been prepared, preserving the leaf through every retry.
Prewarmed match storage exercises forest growth through ordinary and specialized
recognizers without duplicating a vector's capacity policy.

`tower-frontend-tests RESOURCE_ROOT parser` also checks real match-component page
denial during ordinary shifts, specialized shifts and empty reductions. Each
world binds its ledger before construction; the fixture occupies the actual
remaining bytes after creating the table and request. It requires exact
`Capacity`, unchanged prior owners, successful same-input retry and full cleanup.

`tower-frontend-tests RESOURCE_ROOT regex` runs the existing independent regex
oracle, including 300 generated patterns, 500 arbitrary byte patterns, counted
NUL input, invalid source spans and output-table state, semantic rejection, and
an allocation-failure sweep bounded by the successful allocation count. Use the
native address/thread instrumentation profiles for this selector; parser-only
builds do not support those profiles. The fault sweep is serial, so use the
separate frontend-unit checks for real worker overlap.

The `parser` selector also runs `parser_diagnostic_budget.tower`: measured required
allocation failures, zero-byte and partial-footprint denial, exact result causes,
cleanup/retry, original syntax text and deterministic options, detached contexts
after request/table/world destruction, and allocator-aware stream error transfer.
It checks syntax-session first-failure propagation and aliased stream replacement.
`tower-frontend-tests RESOURCE_ROOT diagnostics` runs the existing diagnostic
revision/location fixture without the complete frontend suite. These are focused
native checks; integrated sanitizer and hosted release acceptance are separate.

The native work/backend configuration (`TOWER_NATIVE`, `TOWER_BACKEND_TESTS` and
`TOWER_WORK_TESTS` enabled) also registers these existing focused selectors:

| CTest name | Existing binary and selector | Timeout |
| --- | --- | --- |
| `tower-frontend-structure-reuse` | `tower-frontend-tests RESOURCE_ROOT structure-reuse` | 60 s |
| `tower-native-unit-admission` | `tower-lr-work-tests RESOURCE_ROOT unit-admission` | 180 s |
| `tower-native-backend-ir` | `tower-lr-work-tests RESOURCE_ROOT backend-ir` | 180 s |

All three carry `native;focused` labels and use the configured source tree's
`scaffolding` resource root. The 60-second bound follows focused producer checks;
180 seconds matches existing native unit/backend integration checks. Existing
default and `all` selectors are unchanged. CTest does not build these binaries:
refresh the existing `tower-frontend-tests` and `tower-lr-work-tests` targets as
part of the frozen integrated build before running:

```sh
ctest --test-dir "$TOWER_NATIVE_BUILD" --output-on-failure -j 1 \
  -R '^tower-(frontend-structure-reuse|native-unit-admission|native-backend-ir)$'
```

Registration/configuration discovery is validated separately from execution.
Current-source runtime results for these registrations remain pending ROOT's
integrated milestone; older explicit-selector receipts keep their source identity.

`tower-lr-work-tests RESOURCE_ROOT backend-overlap-calibrated` uses the same
four-unit serial baseline, source programs, exact object comparison and distinct
worker overlap assertions as `backend-overlap`. It measures the existing serial
frontend batch once and freezes `max(30 seconds, measured batch duration)` for
frontend unit2 awaiting backend unit1; the backend acknowledgement stays30seconds.
It prints the calibration and monotonic event timeline. Ordinary `backend-overlap`
and the full backend suite retain their30-second bound. Name the selected variant
in instrumentation receipts; a successful calibrated run does not erase an older
ordinary timeout or establish a performance improvement.

`tower-lr-work-tests RESOURCE_ROOT backend-ir` compares exact object bytes from
default text-retaining serial batches and object-only parallel batches, with and
without optimization. It covers one/small function sets, calls, function values,
recursion, record types, globals, frozen-policy rejection, ordered target errors
and cancellation drain. The streaming overlap selectors also omit text in their
parallel batch and retain the default text policy in the serial reference.

`tower-lr-work-tests RESOURCE_ROOT unit-admission` holds the first of three
uneven units live while a real nested grammar job releases a lane from the same
two-worker budget. The next ready unit must enter on another thread before that
parent can finish. The observer waits for actual denied admission under the
budget gate, reports release-to-entry latency, compares serial/parallel canonical
Foundation, and checks cancellation drain and peak lane/byte bounds. Its bounded
observer waits are test-only; production refill uses the existing pool completion
signal, armed once by denied lane admission. Run `backend-overlap-calibrated` for
the accompanying immediate backend handoff and exact object comparison.

`tower-frontend-units-profile RESOURCE_ROOT UNITS WORKERS BODIES [backend] [spread] [optimized] [dependencies] [artifacts DIRECTORY]`
uses the production native compiler closure. `spread` repeats four body counts
from one quarter through the requested maximum across units; without it, only
the final unit has the extra bodies. `backend` exports the generated functions
and emits unoptimized x86_64-pc-linux-gnu library objects; `optimized` selects
the existing O2 pipeline and default code-generation policy as a control. The older backend
workload did not export its functions and could emit empty objects; those
measurements are not useful code-generation evidence. The profile checks exported
names, known interpreter results (answer and loop body return42), canonical
Foundation and object hashes. Compare each workload's hashes across worker counts.
`dependencies` reuses the imported helper input from `dependency-units`: forward
`decltype`, type-producing calls, generics, staged calls and an untaken cyclic
branch. `artifacts` writes each generated source, complete canonical Foundation
and object after the timed join into an existing directory. Link one saved object
with `frontend_units_profile_result.tower` through `towerc --link` to check native
answers42/42 independently of the interpreter. Units deliberately export the
same names, so link them separately. The `dependency-scaling` selector compares
the existing four-unit success/cycle cases against serial at4/8/12 workers within
host capacity; four units alone cannot demonstrate eight or twelve outer workers.
Its explicit byte ceiling is `(UNITS + UnitsProfileTransientUnits) * DriverUnitRetainedByteLimit`
(four transient units accommodate tracked scratch for4096 bodies); the
production driver's configured ceiling is unchanged. Up to32 units/4096 bodies
are supported, with workers bounded by the current host transport capacity.

Backend profiling uses the native CLI's object-only text policy. Its
`backend_phase_ns` array sums per-unit phase intervals in `BackendPhase` order:
setup, preparation/reachability, declarations, body IR, verification, raw text,
optimization/verification, optimized text, emission. Disabled text phases remain
present with only observer overhead. Intervals are checked against the owning
backend kernel and thread; sums across concurrent units are not wall time. The
frontend-only profile reports an empty phase array. These observations preserve
the existing known-result and canonical/object hash checks.

For a12-logical-CPU allocation, representative commands use `16 1 32 backend
spread`, then workers4/12, and repeat with1024 bodies. `1 WORKERS 4096 backend`
isolates one unit with many independent bodies. Use one warmup and a retained
sample at each configuration; fresh processes/worlds with warm filesystem caches
are different from reused parser sessions. Timing includes snapshot/configuration
and frontend/backend compilation, excluding postjoin reference execution and
formatting. JSON retains phase0/frontend and phase1/backend spans with thread IDs.
Each outer span also records its thread CPU time; `outer_cpu_ns` sums these
intervals. Process CPU minus that sum includes nested workers and unobserved
coordinator/setup overhead, not exclusively useful nested work. Linux rusage
context-switch counts accompany wall/CPU/RSS. Live per-thread OS samples can
supplement these counters; threads active during a sampling interval are not an
instantaneous concurrency count. See the frozen
[KinmenB partition receipt](../../docs/compiler_partition_utilization_b0f507c6.md).
`kernel_peak` counts overlapping **outer** frontend/backend kernels; nested lane
limits and `reserved_peak_lanes` are admission ceilings/observations, not measured
nested leaf execution. `refill_*` measures same-thread reuse before a ready
frontend starts. `ready_outer_vacancy_ns` integrates unoccupied outer slots only
while frontend inputs remain unstarted: nested work can occupy those shared lanes,
so this is an upper bound, not a claim of avoidable idle time. Tail time begins at
the final frontend start; no single timing or queue width proves useful scaling.

The existing LR query entry also calls `semantic_receipt_checks.tower` and
`semantic_failure_order_checks.tower` once each. `receipt-smoke` selects just
these unchanged fixtures: allocation-free typed receipt restoration, diagnostic
clearing and cancelled capture entry, plus32 cases of canonical failure selection
across reversed readiness, earlier pending work and differing numeric offsets.
The existing `tower-query-continuations` CTest registration includes both.

Linux x64 dispatch fixtures use ordinary-source initialization for their mutable
coordinator-only controls. Existing Tower `runtime_bind` connects each wrapper
and a separate real transport; no linker `--wrap` support is required. Build/run:

```sh
cmake --build build/native --parallel 1 --target \
  tower-work-dispatch-result-tests tower-semantic-dispatch-tests
ctest --test-dir build/native --output-on-failure \
  -R '^tower-(work-dispatch-result-tests|semantic-dispatch-(default|admission|source))$'
build/native/tower-lr-work-tests scaffolding receipt-smoke
```

The work fixture checks invalid/busy/admitted calls, actual peer draining, named
transport restrictions and exact-once results after a denied dispatch. Semantic
modes check pre-dispatch and graph-admission denial, terminal cancellation, typed
source receipts, no publication/replay and complete cleanup. Allocation and
workers use the production providers. Supported `TOWER_SANITIZER=address|thread`
builds use the same registration and symbol bindings; serial allocation-failure
fixtures remain separate. No universal race-freedom claim follows from a pass.

The existing normal/fault factories also register the constructor, scheduling
storage and physical component-page fixtures on Linux x64:

```sh
cmake --build build/native --parallel 1 --target \
  tower-work-constructor-budget-tests tower-work-constructor-faults-tests \
  tower-work-schedule-budget-tests tower-entity-component-budget-tests \
  tower-entity-component-layout-tests tower-entity-component-faults-tests
ctest --test-dir build/native --output-on-failure \
  -R '^tower-(work-constructor-(budget|faults)|work-schedule-budget|entity-component-(budget|layout|faults))-tests$'
```

The budget/schedule cases use actual worker barriers, private stages/graphs and
production allocation. Layout verifies the target's actual type sizes, aligned
payloads, physical charges and last-live cleanup. Fault cases use the existing
single-owner allocator and serial transport; their rollback coverage is separate
from real concurrency. The deliberate compile-negative
`work_view_invalid_dispose.tower` is not an executable target.

The same factories register typed stage/view admission and publication rollback:

```sh
cmake --build build/native --parallel 1 --target \
  tower-entity-stage-result-tests tower-entity-stage-result-faults-tests
ctest --test-dir build/native --output-on-failure \
  -R '^tower-entity-stage-result(-faults)?-tests$'
```

The normal fixture checks exact admission causes, queued reference ownership,
stable payloads, publication retry and finalizer cleanup. The fault fixture
denies serial allocation prefixes and checks rollback before a successful retry.
Lease admission distinguishes invalid/foreign/registered nodes, pinned or
reclaiming stores, competing stages, count overflow and allocation failure.
Repeated admission by the same stage is allocation-free; failed growth leaves
the node and lease vector unchanged, and discard permits another owner to retry.
Both import their entities and memory providers; no second provider is linked.
Real worker publication/cancellation coverage remains in
`tower-entity-stage-concurrent-tests`. Supported address/thread instrumentation
uses the same targets; the fault allocator remains single-owner.

Dependency-producer failure checks use the same production compiler providers:

```sh
cmake --build build/native --parallel 1 --target tower-semantic-query-failure-tests
ctest --test-dir build/native --output-on-failure \
  -R '^tower-semantic-query-failure-(constructor|body|declaration)$'
```

Each selector covers 32/64-bit targets and workers1/4. Constructor and body cases
prove actual interpreter suspension before denied producer admission, then require
joined peer cleanup without publication or replay. The declaration case rejects
false idle progress after failed admission. Capacity derives from the live graph
and shared budget; final ownership must return to zero. The unchanged fixture
runs with production allocation and supported address/thread instrumentation.

Capture admission uses that same compiler composition:

```sh
cmake --build build/native --parallel 1 --target tower-semantic-capture-admission-tests
ctest --test-dir build/native --output-on-failure \
  -R '^tower-semantic-capture-admission-(healthy|cancelled|capacity|failed)$'
```

The four selectors each cover 32/64-bit targets and worker budgets1/4. They check
healthy undemanded identity, cancellation, actual graph-capacity denial and an
existing failure receipt. Repeated requests must retain the owning declaration's
receipt without metadata growth, and teardown must release every graph grant.
These admission checks do not execute worker jobs; the `failed` selector preserves
an injected Memory receipt rather than simulating a physical allocation failure.

Pool ownership, stable page reuse and live-owner reentrant finalization use these
existing-composition targets:

```sh
cmake --build build/native --parallel 1 --target tower-semantic-pool-budget-tests \
  tower-entity-page-reuse-tests tower-entity-stage-reentrant-tests
ctest --test-dir build/native --output-on-failure \
  -R '^tower-(semantic-pool-budget|entity-page-reuse|entity-stage-reentrant)-tests$'
```

The sixteen pool cases check exact physical slot charges, retained-slot reuse and
terminal admission denial at 32/64-bit targets with one/four requested slots.
Page checks retain live addresses and private-stage isolation through publication,
reuse and discard. Reentrant checks use separately live owners during finalization.
These are ownership checks; actual concurrent publication remains covered by the
worker-stage fixtures. The separate page-churn measurement is not a default test.

The existing `tower-frontend-tests RESOURCE_ROOT allocations` selector also runs
the metadata-copy checks in `world_constructor.tower`. It derives every serial
and staged denial position from actual successful allocation counts, checks
exact `Memory`/`Capacity`/`Busy`/`Invalid` results and budget-pressure retry,
compares copied parser/provenance data, and checks reference and byte ownership
after discarding partial destinations. This selector requires serial allocator
transport; real parallelism is tested separately by query and unit-overlap runs.

`entity_attach_leases.tower` includes replacement/removal of leased children.
`entity_mutation_results.tower` additionally checks exact invalid, pinned/leased,
retain-overflow, empty-parent and successful ownership-transfer results. Valid
replacement/removal must succeed with the next allocation denied and leave the
allocation count unchanged. `entity_child_transfer_profile.tower` measures the
same valid replace/take/reattach sequence for small/large iteration counts, checks
ordered identity/reference counts and final disposal, and is a measurement tool
rather than a default test. Shared containment publication is serial; this
microbenchmark does not claim worker scaling or total-heap accounting.

The mutation fixture also reuses live slices of a stage's reference queue, both
with spare capacity and across growth. It checks exact growth-denial rollback,
reference order, repeated hold and finalizer cleanup; a successful allocation
count determines the denial sweep. Spare or overlong internal slices are rejected
before reads. Queued-reference counter exhaustion is a separate ownership issue.

Source-proof admission and ordered callback-signature publication have focused
production-provider targets:

```sh
cmake --build build/native --parallel 1 --target \
  tower-semantic-source-proof-admission-tests tower-semantic-aggregate-admission-tests
ctest --test-dir build/native --output-on-failure \
  -R '^tower-semantic-(source-proof|aggregate)-admission-'
```

Source-proof selectors `healthy`, `failed`, `cancelled`, `query`, `edge` and
`finish` cover query/edge admission and failure while waking dependent consumers.
Aggregate selectors `healthy`, `failed`, `cancelled` and `lowering` preserve
callback ABI identity after failure and cancellation. Each selector covers both
target widths and worker budgets1/4. The aggregate fixture supplies the semantic
implementation itself; the target retains the other production service objects
without linking that implementation twice. Budget width alone is not overlap.

Containment leases and actual Linux thread-affinity checks use:

```sh
cmake --build build/native --parallel 1 --target tower-entity-attach-leases-tests \
  tower-entity-mutation-results-tests tower-work-linux-affinity-tests \
  tower-work-linux-affinity-faults-tests
ctest --test-dir build/native --output-on-failure \
  -R '^tower-(entity-(attach-leases|mutation-results)|work-linux-affinity(-faults)?)-tests$'
```

Mutation faults use the fixture's own portable transport and single-owner
allocation instrumentation. The real affinity fixture checks child restriction,
parent isolation and restoration before joins. Its separate serial fault target
binds the actual transport and allocator through the existing Tower runtime
symbol tool, covering sparse CPU IDs, growth denial and zero retained storage.
It uses ordinary source initialization; native `SOURCE` objects explicitly select
object emission. The manual capacity profile and argument oracle require the
actual allowed capacity and are not default tests. Tests that deliberately require
four physical worker slots need at least four allowed CPUs; preserve those oracles.

`semantic_executable_admission_checks.tower` exercises the actual executable-body
producer with `healthy`, `query`, `edge`, `access`, `take`, `partial`, `observe`
and `finish` selectors. It checks exact failures and provenance, private-stage
cleanup, ready-input ordering, cancelled consumers and terminal replay at both
target widths and worker budgets1/4. Its target replaces the semantic
implementation once, as for the aggregate fixture. The capture-continuation
target uses the ordinary semantic provider and covers `healthy`, `take`,
`suspend`, `observe` and `finish`. These variants do not themselves demonstrate
overlap; capture's healthy result is a legitimate suspended query.

The executable selectors `startup`, `metadata` and `pinned` reject real pinned
admission without publishing readiness. `signature` uses the bounded world
constructor and a valid oversized metadata kind to deny its worker's aggregate
signature allocation; `signature-healthy` checks the ordinary successful path.
Both widths and worker budgets1/4 retain the owning offset, join before cleanup,
and release all world grants. These are normal-allocator capacity checks, not
thread sanitizer or overlap claims.

```sh
cmake --build build/native --parallel 1 --target tower-semantic-capture-continuation-tests \
  tower-semantic-executable-admission-tests
ctest --test-dir build/native --output-on-failure \
  -R '^tower-semantic-(capture-continuation|executable-admission)-'
```

The late lifecycle scheduling fixtures use the single production semantic provider:

```sh
cmake --build build/native --parallel 6 --target tower-semantic-staging-smoke
ctest --test-dir build/native --output-on-failure \
  -R '^tower-semantic-(flow|lifecycle-frontier|staging-frontier)-tests$'
build/native/tower-lr-work-tests scaffolding query-smoke
build/native/tower-lr-work-tests scaffolding control-smoke
```

`RESOURCE_ROOT` accepts relative and absolute directory spellings. Body fixtures
anchor their virtual source filenames to that same root through `units_source`;
using a bare filename beside an absolute library root could load relative and
absolute copies of the type prelude when the working directory was scaffolding.
The harness joins paths without resolving symlinks or merging explicit imports.
From scaffolding, run the existing native binary with `. control-smoke` and with
`"$PWD" control-smoke`. Its focused `resource-roots` selector additionally checks
aliased vector/module use, quoted/dotted identity, known output `10`, serial/four-worker
canonical reparse, and ambiguity between two distinct imported `Item` definitions.
Use both root spellings for the explicit `resource-roots` selector too.
These are fixture-path checks, not a new module-resolution policy or a scaling
claim. The D1 journal names the exact reused compiler and rebuilt fixture closure.

The flow fixture checks idempotent admission, deterministic errors, waits,
cancellation and graph failures. The lifecycle fixture includes actual mixed
signature/lowering rendezvous. The staging fixture checks required and optional
inferred work before unrelated waiting **and ready** lowering, with actual
evaluation rendezvous at four workers. It covers per-owner lowering, lazy
executable inputs, suspended nested frames, untaken calls/stages, module/local
known captures, separate required capture producers, optional fallback and
ordered required errors. Its function count follows the production window size.
All cover budgets1/4 and teardown; budget variants alone do not prove overlap.
The resource fixture supplies ready executable inputs for both policies before
denying actual nested frame growth. Known proofs/snapshots and shared signature
publication remain prerequisites. Lowering/evaluation windows still join before
cross-phase mutation, and diagnostics retain the full lowering priority.
Integrated sanitizers/platform checks remain separate release gates.

### Entity accounting census and finite-cap gate

On the supported Linux x64 native configuration with `TOWER_WORK_TESTS=ON`:

```sh
cmake --build "$TOWER_NATIVE_BUILD" --parallel 1 --target tower-entity-accounting-tests
"$TOWER_NATIVE_BUILD/tower-entity-accounting-tests" profile
cmake --build "$TOWER_NATIVE_BUILD" --parallel 1 --target tower-check-entity-accounting-cap
```

`entity_accounting.tower` reuses the entity page/node fixtures' ownership census,
`compiler_buffer_allocation_size` and `work_budget_snapshot`. It uses the normal
allocator, one owner and no dispatch/fault counters. Each named profile record
prints the twelve fields listed in its header, one value per line. Canonical
component sums, detach/reuse, cancellable staged borrows, finalizers and complete
world/ledger disposal are checked. `tower-measure-entity-accounting` runs that
same profile. Physical ownership includes full and partial descriptor/payload
pages, individually owned buffers and their headers, and stage work vectors.
The node/child/index/table/query/stage columns describe payload categories already
included in those physical allocations; do not add them twice. Every sampled
physical total must equal the ledger's live bytes. Sampled retained peaks exclude
transient replacement overlap; the ledger peak includes it. Allocator metadata,
libc output buffers and RSS are outside this census. Ledger metadata is reported
separately and is outside the declared work-byte allowance.

The strict cap target must exit zero; it is not an expected-failure pass or a
skip. It calibrates the actual empty-store footprint, gives a fresh store exactly
that allowance, then requires entity creation to return `Capacity` without
changing identity or publishing a node. Additional finite-cap cases cover child,
component/instance index, archetype, view/query, and stage admission/growth;
replacement rollback, charged-slot reuse, cancellation, pinned retirement and
final zero grants. These use explicit budget reservations with the normal
allocator, not allocation-failure instrumentation. The separate concurrent
component-budget fixture checks synchronized grants and private stage pools with
real workers. The census must follow actual ownership representation. See the
journal's historical D2 baseline and subsequent A2 accounting receipt.

The native compiler regression `tower-generation-layout-frontier-1` (and `-4`)
imports the actual frontend unit producer through
`generation_layout_frontier.tower`, checks all its bodies and interprets the
known root result `42`. Run it with
`ctest --test-dir build/native --output-on-failure -R '^tower-generation-layout-frontier-'`.
It guards the transition from early executed type/generic helpers to ordinary
module body admission: a local construction cursor is not proof that every
unrelated nominal layout has been published. This focused regression does not
establish whole-compiler generation identity.

The registered semantic flow/lifecycle frontier fixtures also exercise checked
kind/component pin denial, world-budgeted scratch and worker-pool denial,
partial lowering lease admission, exhausted stage anchors/views, and graph
completion pressure. They require canonical error offsets, joined cleanup,
no successful ticket prefix, preserved foreign leases, stable terminal retries
and zero retained budget reservations. These focused cases are not sanitizer
or integrated bootstrap/browser evidence.

### Bounded entity layout and traversal profile

The same Linux x64 `TOWER_WORK_TESTS` configuration provides an opt-in extension
of `entity_locality.tower`, using the normal allocator and one serial owner:

```sh
cmake --build "$TOWER_NATIVE_BUILD" --parallel 1 --target tower-entity-locality-tests
"$TOWER_NATIVE_BUILD/tower-entity-locality-tests" layout homogeneous direct
"$TOWER_NATIVE_BUILD/tower-entity-locality-tests" layout homogeneous columns
"$TOWER_NATIVE_BUILD/tower-entity-locality-tests" layout mixed direct
"$TOWER_NATIVE_BUILD/tower-entity-locality-tests" layout mixed columns
```

The last argument selects which path runs first, not a worker count. Both paths
check the same live primary payloads: direct lookup visits all 2,048 owners;
planned archetype columns visit matching rows. Mixed mode adds another kind on
every second owner and a third on every sixteenth. These are dense/sparse
**membership populations**, all backed by the same stable component pages.
Each process measures initial population, one-survivor-per-primary-page removal,
and refill; primary sums are 33,550,336 / 508,096 / 33,550,336. Refill must acquire
zero new payload pages and preserve surviving payload addresses; reconstructed
archetype indexes may acquire their own charged buffers. Complete world
and ledger disposal is checked. Views close before every structural edit.
The measurement allowance is 2MiB: its 2,048-owner mixed population now charges
descriptor/index storage too, exceeding the former 1MiB payload-only allowance.
The separate accounting cap target continues to require actual denial.

Each labeled record emits its fields in order, one per line. First traversal is
after creation and planning; it is not an OS/hardware cold-cache experiment.
Warm traversal reuses the plan for 256 rounds. Reverse order in a fresh process
to expose order sensitivity. Plan and structural costs are separate; use
`/usr/bin/time -v` for whole-process wall/CPU/peak RSS. Timing has no pass threshold.
`tower-measure-entity-locality` runs mixed/direct; no arguments preserve the older
1,024/65,536-row four-path profile, including its derived packed snapshot.

The new mode has no packed snapshot. It enumerates unique live `component.page`
pointers because full pages are absent from the free-slot pool list. Occupancy,
payload bytes, physical page allocation requests, strided slot bytes, raw owner
storage, query plan storage and live allocation-owner count are reported. Those
counts are retained owners, not malloc call counts. Descriptor pages (including
full pages) and independent index buffers now contribute their actual physical
bytes and headers. Raw owner/plan payload columns overlap that physical total;
the total must equal charged live bytes. Ledger metadata and census
scratch are separate; stack arrays, allocator-private overhead and transient raw
resize peaks are outside this census. Page payloads have stable addresses and
stride/back-reference overhead; archetype columns contain component pointers,
not packed payloads. No hardware counters, parallel mutation, finite whole-world
cap acceptance or compiler-wide speedup are claimed. See the D2 layout journal
receipt and audit for measured source identity and limits.

The execution `core` selector includes `execution_output_storage.tower`: counted
first-error/output admission, no replay after capacity returns, graph/Fast parity,
producer teardown with a retained package snapshot, transactional replacement and
complete world/grant retirement at both target widths. `type-construction` covers
counted constructor-diagnostic transfer without a second allocation; `query-smoke`
observes typed capacity failures even when diagnostic storage is unavailable.

For the changed Wasm/host boundary, enable `TOWER_IDE_PACKAGE_TESTS=ON`, build only
`tower-browser`, and run `TOWER_TEST_WASM=/absolute/path/tower.wasm node --test
playground/tests/bytecode.test.mjs`. The file closes its host transport and uses the
selected artifact without requiring an unrelated default browser build. This is
package coverage, not the browser concurrency or integrated release matrix.

### Focused LR closure ordering and frontend iteration cost

The native cache's existing `tower-frontend-tests` entry accepts `lr-order` for
exact closure ordering against the independent insertion-based oracle: empty,
singleton, odd/even boundary sizes; ordered, reversed and seeded shuffled items;
then the existing 150 grammar/propagation comparisons, including reopened
closures, state/action identities and parser error/probe behavior.

```sh
cmake --build "$TOWER_NATIVE_BUILD" --parallel 1 --target tower-frontend-tests tower-lr-work-tests
cd scaffolding
"$TOWER_NATIVE_BUILD/tower-frontend-tests" "$PWD" lr-order
"$TOWER_NATIVE_BUILD/tower-frontend-tests" "$PWD" lr-suffix
"$TOWER_NATIVE_BUILD/tower-frontend-tests" "$PWD" grammar-equivalence
"$TOWER_NATIVE_BUILD/tower-frontend-tests" "$PWD" structure-reuse
"$TOWER_NATIVE_BUILD/tower-frontend-tests" "$PWD" parser
"$TOWER_NATIVE_BUILD/tower-frontend-tests" "$PWD" diagnostics
"$TOWER_NATIVE_BUILD/tower-lr-work-tests" "$PWD" lr
/usr/bin/time -v "$TOWER_NATIVE_BUILD/tower-frontend-tests" "$PWD" iteration-cold
/usr/bin/time -v "$TOWER_NATIVE_BUILD/tower-frontend-tests" "$PWD" iteration-installed
```

Use an absolute build path. Live grammar fixtures require the resource directory
as their working directory. Iteration cases compile the same `answer()` returning
42, execute it and report canonical text identity. Cold means a fresh world from
the immutable seed, not flushed OS/hardware caches; installed additionally sets
up the Bedrock/Foundation baseline before the measured source phases. Observer
Lookup/Build/Table times are nested, not additive. Whole-process time also includes
startup, resource reads, canonical formatting, checked interpretation and cleanup;
no backend/link output is timed here.

`lr-suffix` times 2,000 production closure calls against a precomputed independent
oracle, with 32 incoming lookaheads including propagation/end markers. It checks
every ordered output item outside the timed closure interval. `lr-order` also
covers nullable/nonnullable recursive suffixes, overlapping ranges and production
spans, deferred invalid tails, finite-budget denial/retry and allocation cleanup.
Use the same frozen executable/resources for comparisons; pin serial samples to
one admitted CPU if core migration dominates noise. Preserve the unpinned results
and record the affinity change. This caller microbenchmark does not measure full
compiler latency or native worker overlap.

The iteration fixture requires its existing serial instrumentation transport,
binds a 256MiB ledger before the first entity, reports charged live/peak bytes,
separate ledger metadata, allocation calls and retained buffers, then requires
zero final buffers/grants. Entity-owned descriptors and indexes are charged;
independently owned analysis allocations are not covered automatically. This is
not a whole-process cap. Installed allocation counts include ledger
startup. These counters must not be used during real overlap; the separate native
`lr` selector uses normal worker transport. Preserve exact old/new executables and
resource hashes for alternating timing pairs; requested lanes or passing oracle
checks do not measure speedup. See the D2 LR iteration journal receipt for the
measured optimization, rejected experiment and remaining cold frontend cost.

The B1 checked provenance/presentation selector uses the production native target:

```sh
cmake --build build/native --target tower-frontend-tests --parallel 6
(cd scaffolding && ../build/native/tower-frontend-tests . presentation-budget)
```

It covers splice denial/copy retry, cancelled staged reference ownership, first
formatter failure, late real-session diagnostic allocation failure with unchanged
source/insertion positions, deterministic diagnostic retry, source formatting,
regex resource errors, and detached text after world teardown. The measured last
required diagnostic allocation drives the late-failure case; no allocation index
is guessed. Printed production peaks exclude deliberately exhaustive reservations.
Every owned receipt is gone before ledger teardown. Run `parser` for immediate
request/admission callers and `grammar-equivalence` for canonical live grammar and
replacement coverage. These focused checks do not replace integrated sanitizers,
bootstrap, browser or release verification.

### Scratch identity lookup regression

`tower-storage-tests RESOURCE_ROOT scratch` runs the focused semantic scratch
allocation/denial/retry tests and a 1,024-list ownership-index regression. It
checks exact pointer identity, bounded lookup probes, ordinary-vector fallback,
private scan storage, lexical parent borrowing, allocation-free joined transfer,
failed-registration atomicity and zero grants after teardown. The optional
`sem_scratch_find` probe output is caller-owned; lookup never mutates the parent.
Run the existing native `tower-lr-work-tests . query-smoke` and `control-smoke`
from the `scaffolding` directory for the affected continuation/canonical checks.
The separately observed absolute-resource-root control diagnostic is retained in
the B1 journal; it is not a passing variant of this command.
