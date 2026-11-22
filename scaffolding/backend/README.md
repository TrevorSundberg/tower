# Tower backend API

The graph backend consumes existing validated Foundation entities through
`sem_get`. LLVM remains upstream. Wasm, static Linux ELF, Windows x64 PE and
macOS x64/ARM64 Mach-O download linking are Tower. Windows/macOS CLI defaults
use the same byte services; Linux hosted and SDK build linkers remain separate
dependencies. The Tower source service in
`source_session.tower` calls the existing frontend and formatter on these same
entities; it does not define another semantic representation. The browser worker
exports live in `host/llvm_worker.tower`. The native LLVM engine/worker adapters
have been retired; browser reactors no longer link CoreProgram adapters.

`backend_source_create(runtime, length)` owns a backend session and reconstructed
Foundation buffer; `backend_source_close` releases both. Call
`backend_source_compile(source, text, length, flags, environment, foundation_error)`
with a pinned module environment and the diagnostic from installing the requested
Foundation grammar (null/empty means success). Source spans need not end in NUL.
The service validates/copies the span, compiles it through `SemanticProgram`, and
releases every temporary shared graph after lowering. Import mode formats the
reconstructed graph and recompiles it before reporting success. Results belong
to the explicit session; independent sessions do not share result buffers.

The worker's entity component holds its transport session for the worker lifetime,
as the IDE does. This does not make concurrent mutation of a session safe. Callers
serialize requests or use separate sessions/worlds. The source API is independent
of the worker exports and CLI. A Tower build tool, `embed_runtime.tower`, emits the
runtime object as hex in compilable Tower source included in the actual backend unit,
so browser successor builds reconstruct it without a native embedding wrapper.

## Interpreter program optimization

Fast source execution and `.towerbc` generation use the standard path:
foundation graph → LLVM → upstream scalar passes → foundation graph → private
execution cache. `backend_optimize_interpreter` uses explicit 32/64-bit VM
layout and `function(sroa,mem2reg),default<O2>,function(lower-switch)`, with
verification and loop/SLP vectorization disabled. LLVM 19/20's `default<O2>`
parser resets vectorization options, so this profile also marks its private
functions `noimplicitfloat` to prevent implicit SIMD. Native target emission
keeps its separate vectorizing pipeline. The pass manager receives no
host target machine. `--no-optimize` and the web
optimization control disable passes while retaining exactly the same bridge.

`backend_import_foundation(backend, output_root)` creates ordinary entities with
the shared FoundationNode components. The caller formats and validates them
with the existing compiler. LLVM phi edges use simultaneous copies; arbitrary
blocks use function-local `label(name)` and `jump(name)` calls. `trap(u8*, u32)`
preserves explicit runtime diagnostics. Scalar min/max, absolute value,
saturating add/subtract and memory intrinsics have Foundation legalizations.
Global initialization uses temporary function storage. Public function signatures
retain their original Foundation types. Unsupported LLVM types, intrinsics,
atomic/volatile operations and dynamic allocas are diagnosed. This is not a
general importer for arbitrary externally supplied LLVM modules.

Original graph execution stays available as the reference/debug path. The
internal foundation/cache encoder also remains necessary for portable package
loading and differential checks. Loading `.towerbc` needs no LLVM or executable
memory. Foundation text is authoritative; the loader rebuilds and verifies the
private cache before execution. Container revision 1 now uses semantic/cache
revisions 2; optimization profile 0 denotes an internal reference cache, 1 the
scalar LLVM profile, and 2 LLVM lowering/reconstruction without passes. Unknown
versions/profiles are rejected. Earlier semantic/cache revision 1 packages must
be regenerated from their foundation source.

## Object generation

Target registration uses one-time platform initialization before backend creation
or disassembly. Native Linux/macOS/Windows callers synchronize through their OS
once primitive; browser backends use one owner per isolated reactor instance.
The Tower runtime binder's `backend-registry` profile emits the required zeroed
control word. This is explicit platform object storage, separate from ordinary
Tower module initialization and uninitialized Foundation variables. Each backend
context/module still has one owner. Link services use separate request worlds.

1. `backend_open(triple)` returns an owned `Backend*`. Check for null, then check
   `backend_error`; a target error still returns a disposable result.
2. Query `backend_pointer_bytes` **before semantic compilation**. The explicit
   target must match the Foundation layout. Only little-endian layouts with
   4/8-byte pointers, natural pointer alignment, i32 alignment 4 and i64 alignment
   8 are accepted, as in the previous integration.
3. `backend_lower(backend, root, functions, count, pointer_bytes, library)` borrows
   the shared root and its ordered function index. The caller must supply a
   successful semantic result. The library flag excludes the synthesized entry
   and rejects executable module statements. Lowering verifies the module and
   retains its raw LLVM text.
4. `backend_optimize(backend, enabled)` verifies again and retains the resulting
   LLVM text. With optimization enabled it runs
   `function(sroa,mem2reg,instcombine<no-verify-fixpoint>,simplifycfg),default<O2>`
   with verification at the lowering/optimization boundaries. Set the Tower
   `BackendVerifyEach` constant in `pipeline.tower` to `1` when debugging passes
   to additionally verify after every pass (including interpreter optimization).
   With optimization disabled it retains unoptimized IR.
5. `backend_emit(backend)` produces target object bytes in memory.
6. Read `backend_raw`, `backend_optimized`, `backend_bytes`, `backend_size`,
   `backend_error` and `backend_error_offset`. Call `backend_close` once.

Native `backend_units_create(frontend, count, budget, triple, library, optimize)`
extends a configured or successfully completed FrontendUnits batch. It attaches
backend recipe/result components to the same unit entities and adds dependencies
on their frontend queries under an exclusive graph lease. Attach before frontend
dispatch for streaming: ready LLVM jobs share the frontend pool and total budget,
and start after their own frontend receipt joins. Attaching after completion uses
a backend pool and supports subsequent target batches. Mid-dispatch attachment
is rejected.
Keep the frontend alive and immutable until `backend_units_close`. Each worker
owns its LLVM context, module and target machine; Foundation inputs remain pinned.
`backend_units_step(batch, wait)` refills the ready frontier as workers complete.
Only a successful whole batch exposes borrowed `Backend*` results through
`backend_units_result`; their storage belongs to the batch. Failure diagnostics
select the first unit in source order. Cancellation drains admitted jobs before
unpinning, and a cancelled graph cannot be reused. Linking remains a separate
exclusive stage. Browser LLVM compilation continues to use isolated reactors;
the native callback selection API is not a browser shared-memory LLVM backend.

Perform each stage once on a fresh result. Text and byte views remain borrowed
until close; copy them to retain downloads beyond that lifetime. The Foundation
program must remain alive through lowering and any subsequent metadata/link-plan
queries. Backend indexes contain only temporary LLVM references; they do not
alter entity ownership, operation definitions or Foundation serialization.

Local storage remains entry-block allocas. Raw loads/stores have alignment 1;
pointer arithmetic uses non-inbounds GEP. Integer overflow wraps; division,
remainder and checked conversions retain explicit Tower traps. External/exported
bool and u8 parameters/results retain zero-extension attributes, including call
sites. Assignment destinations and arguments retain their defined evaluation
order. Existing runtime names and signatures are unchanged.

`backend_disassemble(bytes, length, triple)` owns a separate decoder result.
Read `backend_disassembly_text` and release with `backend_disassembly_close`.
Wasm decoding bounds section/body/LEB reads, skips local declarations, and uses
linking/export/name metadata for function labels. Native decoding uses upstream
object/symbol/section APIs and the C instruction decoder. Display remains limited
to 2 MiB. The data is platform output, never Tower program interchange.

## Linking and backend service

The production static Wasm implementation is Tower code in `wasm_link.tower`.
It consumes platform object/archive records on per-request ECS components and
borrows immutable input bytes until close. `wasm_link_plan` accepts argument/input
byte spans; `backend_link_tower_wasm` adapts ordinary `BackendLink` storage without
files or a native linker. Ordinary Wasm sessions, native CLI Wasm output and
reactor self-build recipes use it by default. Recipes name `tower-wasm-ld`;
the historical `wasm-ld` argument zero is also accepted by the byte service.
Unsupported options fail without fallback.
Two edited browser self-build generations pass with both whole and lazy archives,
including identical successor bytes across two/four compilation workers. The
Mach-O path now uses the same explicit byte-service contract.
See [linker checks](../tests/README.md) for supported
profiles and executable fixtures. Link requests are single use; the BackendLink
adapter creates a fresh world for each invocation. Finish or join readers before
closing input owners; a pinned view prevents structural mutation and disposal.

Linux downloads use the Tower ELF64 byte linker in `elf_link.tower` and
`linker_tower_elf.tower`; the cross reactor no longer links `lldELF`. The current
profile is static little-endian x86-64/AArch64 with ordinary object files,
indexed GNU/BSD archives, COMDAT selection, local/global/weak/common symbols,
checked relocations and static GOT entries. It emits separate read, execute and
write load segments, a non-executable stack, zero-filled BSS and a symbol table.
Input objects and archives are world-owned components. Copy/relocation jobs use
the shared WorkGraph/WorkPool with frozen symbol/layout data and exclusive output
ranges; cancellation drains jobs before releasing the world, and diagnostics
publish in input order. Default requests use one worker; explicit `--threads=N`
uses the same transport where available, with no claimed universal speedup.

This is the freestanding download profile. Native CLI links that need libc or
shared libraries still use their explicit compiler-driver path. ELF TLS, dynamic
linking/PIE, IFUNC, constructors, compressed/debug output, linker scripts,
extended section indexes and unimplemented relocation kinds are not supported.
Unsupported load semantics/options fail explicitly; non-allocated debug sections
are omitted from this executable profile. There is no silent LLD fallback.
The existing Wasm-prefixed byte views, name indexes and ar reader are shared
target-independent utilities, not a second semantic graph or Wasm translation.

`--growable-table` leaves the defined function table's maximum unspecified so
the host can append callback slots. Without it the table retains its fixed size.
Function export-section names override link-symbol spellings, including empty
names; duplicate final names are checked after that override. Link-symbol lookup
and relocations keep their original bindings.

Static wasm32 output may define memory or import it with `--import-memory`
(`env.memory`) or `--import-memory=module,name`. Both paths preserve explicit
initial/maximum limits and optional memory export. Imported memory does not make
the image relocatable: the host must dedicate its assigned static/stack ranges,
and active data segments initialize them on every instantiation.

`--shared-memory` now supports static wasm32 data initialization with defined or
imported shared memory. It requires a maximum and input `atomics`/`bulk-memory`
features, and rejects inputs that disallow `shared-mem`. Live data becomes passive;
a generated start function claims a dedicated aligned flag, initializes once,
publishes completion and wakes waiting instances. Waiters recheck after notification;
each instance then drops its own data copies. The host must initially zero the
flag and dedicate the static memory ranges to this image. Instantiation that may
wait belongs on workers. Stack globals remain instance-local, but their initial
address is identical: the runtime must assign distinct stacks before concurrent
stack-using calls. This feature does not provide a thread runtime.

TLS32 segments use an aligned contiguous layout with `__tls_base`, `__tls_size`,
`__tls_align` and `__wasm_init_tls(i32)`. Initialization clears padding, copies
retained passive templates, fixes TLS pointer initializers and refreshes mutable
TLS GOT globals for the calling instance. The caller owns a disjoint region of
at least `__tls_size` bytes aligned to `__tls_align`. The initial shared-memory
winner initializes the static TLS block; later instances must call
`__wasm_init_tls` with their own region before TLS access. Ordinary data still
initializes once. TLS offset relocations must name defined TLS symbols; shared
ordinary data/code cannot embed an absolute per-thread address. TLS64, dynamic
memory bases and memory64 remain unsupported.

`WasmLink.workers` / `--threads=N` select up to 256 lanes (default one), capped
by the host's actual capacity. Code/data copy and relocation use pinned ECS
inputs, disjoint output ranges and worker-private errors; layout, symbol selection
and publication stay on the coordinator. The reusable Tower WorkPool accepts
typed noncapturing kernels. `job_grain` defaults to 262144 estimated work units
(bytes plus 64 per relocation); small workloads avoid creating threads. Results
and errors join in input order and output bytes do not depend on worker count.
`jobs_run` and `jobs_peak` count admitted batches, not measured CPU overlap.
Isolated browser LLVM workers currently report capacity one; the same kernels
also pass real overlap checks through the existing shared-Wasm worker transport.
The Tower linker also links that transport's actual SDK 34 wasi-libc thread
runtime and the shared portable compiler. Both run through the existing host;
this does not change the isolated LLVM reactor's execution model.
The browser build compiles `linker_tower_wasm.tower` as its own unit, shared by
the LLVM and cross-target reactors and included in editable self-build recipes.

An optional `cancel: function(bool, void*)` callback runs on the coordinator with
`cancel_context` at emission boundaries and between job completions. It must
only inspect its explicit cancellation state: no reentrant linking or owner/input
mutation. Cancellation drains admitted kernels before releasing pinned views
and preserves the previous output. It is cooperative; parsing/layout and a
running individual kernel are not preempted. Close/reset follows the join.

Entity layouts live in `library/entity_types.tower`; separately compiled linker
clients use the typed `entity_api.tower` declarations and link the existing Tower
ECS implementation once. These are the compiler's shared types, with unchanged
layout and lifetime rules. No private replacement entity store is introduced.

`backend_link_create`, `backend_link_add_input`, `backend_link_clear_inputs` and
`backend_link_close` own link-input storage. `backend_link_plan` receives the
target, shared function index, emitted object and target runtime object. It
prepares deterministic arguments and owns copies of generated object,
runtime and allowed-import bytes separately from caller inputs. Reset/close frees
the generated plan; caller inputs persist until cleared or closed. A failed
request exposes no previous output. Clear/reset its error before retrying the
direct byte service. Planning and linking perform no filesystem operations.
`backend_link_arguments` and `backend_link_argument_count` expose that vector.
Linux hosted CLI compiler-driver linking remains a host operation. Process creation,
package discovery and CLI options belong to the host owner; the backend does
not call a shell.

For Wasm, Linux ELF, Windows PE and macOS Mach-O, `backend_link_wasi` selects
Tower byte services. Plans retain generated inputs in memory; neither reactor
links an LLD library. Failed invocations cannot return stale bytes. Inputs retain
deterministic lexical ordering and the existing filename, size and count limits.
Independent requests own separate ECS worlds and immutable input lifetimes.
See [Tower byte link services](../../docs/tower-linkers.md) for the Mach-O API,
supported profile, worker ownership, native execution checks and CLI boundaries.

`BackendSession` composes object generation, linking, disassembly and owned JSON
results for the existing worker protocol. Create with borrowed runtime-object
bytes; set the target and inputs; call `backend_session_begin` to reset results,
validate source length/NULs and obtain the target pointer width. The caller parses
and checks the source, then calls `backend_session_compile` with the resulting
entities or `backend_session_failure` with its diagnostic. Flags retain their
existing meaning: 1 = object output, 2 = library object. Result accessors expose
the response, before/after LLVM, disassembly and downloadable bytes. Reset/close
invalidate all result views. The service contains no DOM, worker, CLI, frontend
or interpreter algorithms. Its WASI clock only measures execution; clock values
never affect compilation decisions or artifacts.

## Windows PE byte linker

`pe_link.tower` owns each request's COFF objects, archives, short imports and jobs
as ECS components. `linker_tower_pe.tower` exposes the transport-independent
`BackendLink` byte service. Windows x64 download planning no longer writes files
or calls `lldCOFF`. Jobs share WorkGraph/WorkPool with ELF and the compiler, pin
immutable inputs, declare disjoint output ranges and drain before releasing them.

The current profile emits deterministic PE32+ console executables, preserving
by-name code/data imports, named exports, NX permissions, ASLR base relocations,
sorted unwind records, common symbols and ANY/SAME_SIZE/associative COMDATs.
It reads GNU and Microsoft indexed archives lazily, including long member names
and Microsoft's second linker member. x64 patches include ADDR64/ADDR32,
ADDR32NB, REL32 through REL32_5, SECTION and SECREL. The special `__chkstk` ABI
remains an ordinary imported jump thunk into kernelbase.dll.

Other architectures, bigobj, weak externals, other COMDAT selection modes,
TLS/CRT constructors, directives, delay imports, ordinal imports, resources and
PDB/debug emission are not this profile; absolute-symbol RVA/PC-relative patches
and absolute exports are also rejected. Required unsupported behavior is
diagnosed, with no LLD fallback. Discardable debug/link-remove inputs are omitted.
Low-level requests are single-use and borrow inputs until close; the byte service
creates a fresh world on retry and never publishes partial or stale output.

## Upstream WASI ABI profile

C/C++ symbol declarations now use the [Tower foreign-name API and grammar](FOREIGN.md).
The pinned C++ names and linker wrap arguments are generated by Tower. Call
signatures and opaque object storage below remain explicit foreign contracts.

The remaining LLVM support C++ bindings are explicitly restricted to revision
`1e57ee22ca274b663eeb279fd86e7010a8441c99`, wasm32-wasip1 and WASI SDK 34/libc++.
The build fragment rejects a different upstream revision. This profile uses
explicit initial sret parameters. MemoryBlock is 12 bytes, aligned to 4;
libc++ error_code is 8 bytes, aligned to 4. LLD ArrayRef/stream/context bindings
and FileOutputBuffer output planning have been removed.

Tower supplies data-only LLVM memory allocation/release through link-time
`--wrap` bindings. Only
read/write data allocation with no near-address hint is supported; executable
memory is rejected. The original native output-buffer subclass is retired.
The three WASI crash hooks are Tower definitions; unrecoverable failure still
terminates the disposable worker. This is a pinned foreign ABI, not portable
C++ struct inference or a new Foundation operation. Revalidate it on SDK/upstream
changes. It is not a general JIT-memory implementation.

## Build and ownership handoff

Task 4 owns broad build/bootstrap/package integration. Opt into the isolated
fragment with a validated pre-port compiler or an existing Tower-backed compiler:

```sh
cmake -S . -B build/backend-native -G Ninja -DTOWER_NATIVE=ON \
  -DLLVM_DIR="$(llvm-config-19 --cmakedir)" -DCMAKE_BUILD_TYPE=Release \
  -DTOWER_BOOTSTRAP_COMPILER=/absolute/path/to/validated/towerc \
  -DCMAKE_PROJECT_scaffolding_INCLUDE="$PWD/cmake/TowerBackend.cmake" \
  -DTOWER_BACKEND_TESTS=ON
cmake --build build/backend-native --target towerc tower-backend-tests
build/backend-native/tower-backend-tests
```

Add the same include and bootstrap options to the existing WASI LLVM build.
The `compiler/units/backend_*.tower` roots reuse the authoritative declarations;
CMake selects a short import profile without generating its source-member list.
Native target initialization comes from the installed LLVM configuration lists;
browser modules retain their Wasm-only and Wasm/X86/AArch64 target closures.
The API test implementation and runner are Tower. The browser test build exports
`backend_tests` for invocation through its ordinary Wasm interface.

The removed C++ backend cannot build the old native seed from nothing. Task 4
must register this fragment and replace the old seed build with its validated
compiler distribution; do not add a native fallback. This work does not claim
the complete compiler/bootstrap/package migration. Task 1 still owns source
compilation, and task 3 owns runtime objects, shared entity lifetime and the
existing semantic/layout accessors. No shared layouts or operation IDs changed.

Backend fixtures include `tests/backend_semantics.tower` and its expected output,
`tests/backend.tower` for direct API/error checks, and the separately compiled
`tests/foreign_fixture.tower`. The foreign C fixture is removed. Its three former
build invocations now mechanically use the Tower compiler; broad scripts and
packaging are otherwise unchanged. Reproducible comparisons, benchmarks and
remaining platform execution limitations are recorded in the project journal.
