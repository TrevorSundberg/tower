# Tower backend API

The graph backend consumes existing validated Foundation entities through
`sem_get`. LLVM/lld remain upstream dependencies. The Tower source service in
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
verification and loop/SLP vectorization disabled. The pass manager receives no
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
context/module still has one owner; this does not make the LLD linker concurrent.

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

`backend_link_create`, `backend_link_add_input`, `backend_link_clear_inputs` and
`backend_link_close` own link-input storage. `backend_link_plan` receives the
target, shared function index, emitted object and target runtime object. It
prepares deterministic input files and the upstream linker argument vector.
`backend_link_arguments` and `backend_link_argument_count` expose that vector.
Native package hosts execute the corresponding bundled upstream linker, then
call `backend_link_read_output`. Process creation, package discovery and CLI
options belong to the host owner; the backend does not call a shell.

WASI uses `backend_link_wasi` to invoke the upstream library in the same worker.
It captures linker diagnostics, destroys the upstream linker context after every
invocation, and reads the linked output. Failed invocations cannot return stale
bytes. Inputs retain deterministic lexical ordering and the existing filename,
size and count limits. Use one active link operation per filesystem namespace;
parallel workers/processes must have separate namespaces.

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

## Upstream WASI ABI profile

C/C++ symbol declarations now use the [Tower foreign-name API and grammar](FOREIGN.md).
The pinned C++ names and linker wrap arguments are generated by Tower. Call
signatures and opaque object storage below remain explicit foreign contracts.

The direct C++ bindings are explicitly restricted to LLVM/lld revision
`1e57ee22ca274b663eeb279fd86e7010a8441c99`, wasm32-wasip1 and WASI SDK 34/libc++.
The build fragment rejects a different upstream revision. This profile uses
indirect ArrayRef/StringRef arguments and explicit initial sret parameters.
Upstream `raw_fd_ostream` storage is 64 bytes, aligned to 8; MemoryBlock is 12
bytes, aligned to 4; libc++ error_code is 8 bytes, aligned to 4. Upstream
constructors/destructors initialize and use the stream's opaque storage.

Tower selects upstream FileOutputBuffer's `F_no_mmap` path and supplies its
data-only allocation/release through three link-time `--wrap` bindings. Only
read/write data allocation with no near-address hint is supported; executable
memory is rejected. The original native output-buffer subclass is retired.
Upstream file writing, vtables and linker implementations are unchanged. The
three former WASI crash hooks are Tower definitions; unrecoverable failure still
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
`ComposeBackend.cmake` reuses the authoritative vector/Foundation declarations.
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
