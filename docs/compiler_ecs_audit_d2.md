# D2 tools, benchmarks and build iteration audit

This is an in-progress review, not campaign acceptance. Initial reviewed source:
`6282238779034442e0578d76b921ca117df819f1` (2026-11-22). The assigned directories
contain 32 tool modules and five benchmark modules. Additional measurement
modules under tests are reviewed with D1 coordination; they remain D1-owned.
New files and subsequent changed-source receipts will be recorded explicitly.
Coverage now includes 37 initial tool/benchmark source reviews, three shared
measurement modules, 45 provenance-only resource reviews, the new complete
wide-function benchmark wrapper, the tool-budget regression, and six additional
shared build/measurement entry points reviewed below. These categories
are not interchangeable. The subsequently handed-off sanitizer tool and two
negative probes add three source reviews; A2 retains their ownership. The shared
stress-source generator adds one further caller review. The new independent
Tower/C input producer brings coverage to 98 paths. Two existing D1-owned
tooling caller fixtures were subsequently reviewed/executed as supplemental
evidence; their receipts below do not transfer harness ownership. Incoming
draft reviews remain separate from integrated local coverage.

## Contracts and method

Read the root AGENTS.md, campaign plan, compiler services, threading handoff and
the journal's later type-value continuation. Production staged-helper readiness
already exists; the handoff's earlier missing-helper experiment is historical.
No nested AGENTS.md was found in this checkout. File review considers callers,
actual payload storage, world/state ownership, ordered effects, scheduling,
borrows, failure cleanup and evidence gaps. A filename list is not a receipt.

The primary [Flecs systems](https://www.flecs.dev/flecs/Systems.html) and
[component traits](https://www.flecs.dev/flecs/ComponentTraits.html) documentation
inform separation of read/write access, staged structural publication, and
stable sparse storage versus packed traversal. The
[Burst aliasing contract](https://docs.unity3d.com/Packages/com.unity.burst@1.8/manual/aliasing.html)
requires real access/alias evidence for optimization. No inferred `noalias`,
automatic parallelism or packed-payload claim follows from an index or queue.

Most tool data below is an owned, short-lived file/package buffer, not a second
compiler AST or semantic IR. Keeping that data outside ECS is appropriate where
the tool performs serial filesystem publication or synchronous child execution.
Compiler invocations use the production compiler and its shared scheduling.

## File review receipts

Unchanged-source rows refer to the initial reviewed commit above. New files and
authorized changes are identified in their rows and subsequent validation
receipts. “Source review” means inspection, not a newly executed test.

| Path | Storage, ownership, scheduling and disposition | Evidence and gaps |
| --- | --- | --- |
| `scaffolding/tools/build_tools.tower` | Local contiguous argv/path vectors borrow strings through synchronous children; `defer` releases all buffers. Child compile precedes link and outputs are checked against resolved inputs. No compiler world or private scheduler. Every invocation rebuilds selected tools even when CMake has no changed prerequisites; audit callers and measure this before introducing reuse. | Called by root CMake tools bridge and selected-tool shell wrapper. Source review only; no cancellation/deadline in this generic process helper, and output safety explicitly excludes hard-link/racing replacement guarantees. |
| `scaffolding/tools/check_core.tower` | Local command vectors and path buffers; external CMake/CTest/Node are explicit capabilities. Each child joins before args reset or buffers close. Configure/build/test order is required. Worker build count comes from environment; no competing compiler scheduler. | Native/WASI dispatch source-reviewed. Existing `CMAKE_CXX_FLAGS=` is not Tower sanitizer instrumentation. Runtime checks pending. |
| `scaffolding/tools/tool_process_linux.tower` | Explicit Linux fork/exec/wait ABI; borrowed argv remains live until reap. Close-on-exec failure pipe distinguishes launch errors from child exit; EINTR retries; read errors still drain child before returning. No global world/state and no async jobs. | Shared by tools and process fixtures. Wait failure needs honest error propagation; generic transport has no cancellation/deadline. Review does not prove all signal/descriptor combinations. |
| `scaffolding/tools/tool_capture_linux.tower` | Anonymous file avoids pipe backpressure; bounded reads publish a replacement buffer only after successful process/read/close. Child joins before file teardown. Diagnostic capture and stdout capture share one implementation. | No disk-write quota; limit bounds retained bytes only. Nonzero child status preserves old output. Real Clang diagnostic capture and failed-child output preservation pass through tool_words_checks at4540a08; this does not exhaust descriptor/write failures. |
| `scaffolding/tools/tool_files_linux.tower` | Owned path strings plus contiguous pointer index; insertion sorting does not pack string payloads. Recursive traversal retains directory handles until child traversal returns, bounded depth 128; lexical names preserved, directory symlinks skipped. Atomic no-replace directory rename is an explicit OS boundary. | `statx` layout is Linux x64 little-endian. Partial path collection stays caller-owned on failure. Sorting cost and allocation/fragmentation not yet measured; no speculative conversion. |
| `scaffolding/tools/tool_files_posix.tower` | `tool_join` constructs a separate buffer before replacing aliased output. Paths and realpath results have explicit ownership; mkdir/lookup run in written order. This is filesystem identity protection, not module identity. | Missing output is permitted, existing symlink aliases rejected. Hard links and concurrent path replacement remain outside this protection. |
| `scaffolding/tools/tool_streams_posix.tower` | 4 KiB stack chunk and growing contiguous ByteBuffer; bounds checked before append, complete result published on success. Caller owns input stream; file wrapper closes before replacing output. No compiler world needed. | Handles error, no-progress and exact limit; maximum transient retention includes old output plus new buffer. Existing tool_files_checks passes over-limit rejection preserving prior output and exact-limit successful read at4540a08. |
| `scaffolding/tools/tool_words.tower` | Contiguous vector of separately owned byte strings, never executed. Distinct shell/Make decoders preserve lexical identity; partial words close on failure; publication replaces output only after full parse. No global state. | Existing word fixture passes quoting, malformed/NUL/escape/Make-variable input, continuations, real Clang argument capture and cyclic response rejection at4540a08. Optional real WASI Ninja recipe remains unrun locally. |
| `scaffolding/tools/bootstrap_comparison.tower` | Explicit predecessor/successor/resource/native-build inputs; local buffers and synchronous children. Ordered target/unit comparisons use fresh retained directories and compare nonempty exact IR/object bytes; no extra compiler build. | Calls shared process/capture; unknown units fail. Missing-grammar check expects exit 1. No child deadline here; full comparison is a milestone check, not an iteration prerequisite. |
| `scaffolding/tools/bootstrap_symbols.tower` | Allocation-free spans borrow captured nm text. Exact per-unit/platform allowlists, deterministic first rejection, no world/global mutable registry. | Current allowlist includes shared production staged-helper dependencies. Changes require reviewing owning exports; underscore normalization is an explicit existing object-format policy. |
| `scaffolding/tools/bootstrap_package.tower` | Owned heap records and pointer index retain complete compiler/resource snapshots up to aggregate 1 GiB, then serialize hashes/provenance and atomically rename a new directory. This retention ensures publication uses the captured bytes; it is not packed ECS. | Captures tracked source hashes, patch, predecessor, dynamic dependencies. Failure removes only its private known stage paths. Source and ldd reads require frozen external inputs; whole OS closure is not established. |
| `scaffolding/tools/package_bootstrap.tower` | CLI borrows argv for synchronous package construction; explicit Git/ldd tools and output path. No hidden bootstrap/cache selection or shared state. | Errors are nonzero; successful packaging explicitly still requires relocation and clean-successor validation. |
| `scaffolding/tools/compiler_project_inputs.tower` | Bounded captured Ninja final-command words, synchronous env cwd capability, no shell execution. Decoder rejects command operators and verifies selected output before reconstructing the shared WASI recipe. | Caller simplification already uses `ninja -t commands -s`, avoiding prerequisite command graph capture. 16 MiB capture bound; no speculative port needed. |
| `scaffolding/tools/compiler_project_files.tower` | Stable individually allocated file/unit records, pointer vectors and derived name maps. Complete normalized source text is authoritative package data, not a semantic IR. Actual depfiles preserve module closure and generated-unit identity. | Initial full tree collection plus repeated per-unit dependency reads may duplicate I/O/normalization; measure before changing frozen-input behavior. Source maps intentionally keep lexical paths. Type-directory packaging coordinates with L2 consolidation. |
| `scaffolding/tools/compiler_project_package.tower` | Per-reactor owned input snapshots keep borrowed object/archive symbol spans live through selection/compression. Deferred support cleanup runs before input release. Serial recipe/product order and manifest-last publication are required effects. | Input limit 1 GiB/file, archive chunks 24 MiB; aggregate retention can exceed one chunk and needs measurement. Three reactors currently load their inputs separately. Per-file rename is not a generation lock. |
| `scaffolding/tools/compiler_project_output.tower` | Derived pointer ordering leaves stable file payloads intact; deterministic JSON copies existing source, entries and recipes. Private output stage is published in product order with project.json last. | Complete generation externally locked; failed stage retained. Insertion sort cost unmeasured, so no packed-storage/speed claim. |
| `scaffolding/tools/package_compiler_project.tower` | Validates explicit input directories and borrows them until synchronous packager returns; frees resolved names. | Called by build-llvm.sh. No alternate compiler implementation or hidden build. Runtime packaging evidence pending. |
| `scaffolding/tools/compiler_support.tower` | Pointer-stable member records and borrowed pinned bytes; name maps and request vectors derive archive reachability. Selection deliberately publishes an entire wave after selecting its providers to preserve policy; not a second compiler scheduler. | Shared Wasm object/archive readers validate definitions rather than trusting archive indexes. Duplicate physical members retain stable order. 24 MiB chunks do not bound total retained inputs; existing archive tests are relevant. |
| `scaffolding/tools/package_playground_assets.tower` | Serial deterministic gzip and sorted SHA manifest over owned buffers; manifest temporary renamed last. No compiler graph. File hashing currently retains a whole file plus the previous buffer during replacement: candidate for bounded streaming after measurement. | Build.mjs caller prepares dist; symlink output rejection and 1 GiB input bound remain explicit. Compression retains input/output separately. Manifest-only streaming would not change gzip or generation locking. |
| `scaffolding/tools/link_wasi.tower` | Uses the shared Wasm linker and its explicit world. Mapped file owners and argument buffers outlive `wasm_link_close`, which executes first under reverse defer order and drains linker work. No private linker scheduler. | Protects output against every explicit mapped input. Lifecycle/kernel abort adapters intentionally reject unsupported standalone callbacks. Actual link worker stress belongs to backend owner; tool integration still needs checks. |
| `scaffolding/tools/wasi_link_recipe.tower` | Shared native/package recipe builder; owned word vectors, bounded response recursion/bytes/count and publish-on-success. SDK/library capabilities explicit. Ordering of startup and libraries is semantic. | No shell execution; expands only supported recipe forms. Top-level startup scanning precedes response expansion, so response-contained startup switches are not equivalent to top-level switches; document/coordinate if callers need them. |
| `scaffolding/tools/wasm_link_audit.tower` | Explicit shared linker world owns moved input ByteBuffers and parsed metadata until close. Traversal uses derived object vectors; optional resolution is real shared symbol selection. | Not a final link or concurrency proof, as output states. Standalone lifecycle-zero contract aborts unexpected finalizers. Existing README names a retired wasm_link_static tool; flag to D1, no unsolicited test-doc edit. |
| `scaffolding/tools/verify_bootstrap_symbols.tower` | Thin CLI dispatch, bounded captured report owner and borrowed spans; shared comparison implementation. | Unknown unit/arguments and malformed symbol policy fail nonzero. No additional build or native adapter. |
| `scaffolding/tools/verify_compiler.tower` | Local verification context owns reports, paths and bounded logs; GNU timeout/env owns clean child cwd/environment and deadline. Synchronous process drain precedes stream closure; repeated object products removed before next invocation. | Explicit expected-missing-Clang mode is not restricted-release success. Whole-file hashing retains up to 1 GiB; monotonic clock failure returns zero rather than distinct diagnostic (measurement gap). Fresh directories prevent stale product acceptance. |
| `scaffolding/tools/llvm_scripts.tower` | Owned original/normalized/current buffers for two bounded upstream scripts; exclusive backups precede writes. Compare-before-restore refuses concurrent edits and attempts both restores. | Caller build-llvm.sh EXIT trap restores exact bytes; missing scripts and already-LF files intentionally need no work. This is not a filesystem writer lock. |
| `scaffolding/tools/prepare_llvm.tower` | Thin synchronous POSIX CLI over shared script preparer; argv lifetimes explicit, no global state. | Returns nonzero and prints retained backup directory on failure. No interpretation of argument metacharacters. |
| `scaffolding/tools/roku_package.tower` | Pure byte transform: normalized source, fixed three-entry array, owned compressed buffers. Archive entries borrow sources only while owners live. Deterministic metadata and ordered entries; no compiler world required. | Shared UTF-8/DEFLATE/ZIP libraries. Marker is a format guard, not semantic BrightScript validation. Existing archive fixtures cover format; physical device execution remains unvalidated. |
| `scaffolding/tools/package_roku.tower` | CLI owns input/archive, validates output distinctness and creates parents before serial write. | Source read uses general driver reader rather than tool bound. No current runtime/device acceptance implied by packaging success. |
| `scaffolding/tools/target_pack.tower` | Caller-owned package context, staged products and synchronous Clang calls over distributed runtime IR. Whole set prepared before sequential atomic file replacement. | Preserves target-specific flags and deterministic Windows timestamps. Failed stage retained; no generation lock. Five target outputs are serial on this modest-host path. |
| `scaffolding/tools/target_pack_imports.tower` | Bounded state machine and owned DLL/symbol buffers; archive/member spans borrow owners until synchronous write. Shared COFF and ar libraries, no registry or duplicate linker. | Strict subset rejects duplicates, aliases/ordinals/flags; at most 256 symbols. Existing malformed/import fixtures relevant. |
| `scaffolding/tools/package_targets.tower` | CLI resolves resource/description/Clang capabilities and keeps them live until package close. | Retains failed stage and exact process status. Output success does not assert target execution. |
| `scaffolding/tools/remove_const.tower` | Historical one-time migration scanner with local vectors/names; sequential inventory, validation and rewrite passes. Not a production parser/AST or dependency scheduler. | No current build/caller found. Reads are unbounded despite “bounded” header; three passes can observe changed files and direct writes are not transactional. Preserve as historical inactive tool; do not use for campaign rewrites or optimize without an active need. |
| `scaffolding/benchmarks/interpreter_arithmetic.tower` | Foundation scalar locals, 10,000 wrapping-u32 iterations and one output; no graph/storage ownership beyond normal execution. | Shared native/browser interpreter fixture. Sequential recurrence is intentional; comparing worker counts here alone cannot show compiler overlap. Graph/fast/native agree on49995064 at4540a08/public pin; differential agreement is not an independent mathematical oracle. |
| `scaffolding/benchmarks/interpreter_branch.tower` | Foundation scalar locals and executed branch selection, 10,000 iterations; deterministic effects. | Graph/fast/native equal independent-1426 oracle:1428complete seven-element periods contribute-1428, remaining four iterations contribute+2. Signed counts fit i32. |
| `scaffolding/benchmarks/interpreter_calls.tower` | Ordinary nested calls and local frames, 3,000 iterations; callee/argument order is compiler/interpreter responsibility. | No helper body implementation duplicated in benchmark. Graph/fast/native equal independent sum3000*3001/2=4501500 at4540a08/public pin. |
| `scaffolding/benchmarks/interpreter_memory.tower` | One explicitly allocated 1,024-u32 buffer, every read follows same-iteration write, freed before final output. No safety policy added to raw Foundation. | 10,000 iterations, expected sum of 0 through 9,999. No uninitialized-read claim depends on allocator zeroing. |
| `scaffolding/benchmarks/interpreter_profile.tower` | Intentional 500,000-iteration scalar recurrence and ordinary function calls; all state belongs to one execution. | Browser CPU sampling input, not a compiler throughput benchmark or a multicore fixture. Wrapping signed arithmetic contract must be preserved by independent oracle. |
| `scaffolding/benchmarks/compiler_wide_functions.tower` | New D2 complete-file measurement wrapper: one local ByteBuffer, lexical cleanup, existing Tower stress generator and explicit Tower import. No duplicated generator, world, scheduler or IR. | Initial direct fragment compilation failed without the language import; preserved as failure. New emitted 300-function file compiles to identical objects at jobs 1/2/8 and prints independently known 299 in graph/native execution. |
| `scaffolding/tests/build_tool_budget_checks.tower` | New D2 regression invokes the real builder/compiler synchronously with borrowed argument strings; all local path/product buffers close after child reap. Invalid-budget calls must fail and leave products absent; valid budgets 1/2 must yield equal object bytes. | Public-pin compile/link and real regression pass at `6a2536b`; independent executable-byte comparison also passes. Existing tool transport/files/utility assertions; no fake compiler, alternate scheduler or generic harness modification. |
| `scaffolding/tools/instrument_llvm.tower` | A2 handoff SHA `93cee185`, reviewed/applied over `3af3cea`, retained in D2 `599e8a8`. One LLVM context/module owns target IR and attribute/pass state; context, module, pass options and errors close through explicit/deferred cleanup. Sequential mutation of this foreign target artifact needs no second Tower world/AST. Only defined functions receive address/thread attributes, then LLVM passes and module verification run. | D2 shared-entry build and real work-pool ASan/TSan positives pass, with both negative controls below. Linux x64 only, no source-language UBSan coverage. Already instrumented/no-definition modules reject. LLVM file loading has no explicit byte quota; use trusted frozen generated IR. Output path guard initially excludes hardlink identity; A2 owns its follow-up. Writes may leave failed artifacts; no atomic publication claim. |
| `scaffolding/tests/sanitizer_memory_probe.tower` | A2-owned deliberate invalid fixture: one eight-byte allocation followed by out-of-bounds access. Raw Tower/Foundation policy is not changed to make it valid. The ordinary passing suite must not execute it. | D2 observes required ASan heap-buffer-overflow and exit1 with instrumented fixture/runtime. This establishes sensitivity, not a successful program run. Allocation failure traps explicitly. |
| `scaffolding/tests/sanitizer_race_probe.tower` | A2-owned deliberate shared-payload race, two production workers and real barrier signals; stack job/counter lifetime encloses pool drain, signals close after pool. The intentional unsynchronized writes are the sensitivity target, not a scheduler design. | Requires exactly two real lanes; unsupported admission traps rather than skipping as pass. D2 observes required TSan data race in work_kernel_execute and exit66 with instrumented fixture/runtime, never ordinary-suite acceptance. |

## Environment and evidence

### Shared measurement dependencies

| Path | Reviewed ownership/storage and evidence disposition |
| --- | --- |
| `scaffolding/tests/driver_measure.tower` | D1-owned harness, D2 source review at initial commit. Each serial sample owns captured logs, fresh product and parsed phase vectors; series/metrics are stable heap records indexed by vectors, closed after reporting. Alternating samples and median copies preserve raw order. Monotonic checks and exact output/product comparisons fail fast. Only two root grammar hashes are recorded, so full imported resources must be frozen separately. No worker-budget option, per-child CPU/RSS or overlap event metrics here; augment external evidence without claiming those fields exist. |
| `scaffolding/tests/driver_measure_cases.tower` | D1 owns generic API; parent grants D2 only the generated kernel import fix. Configures fixed sample counts and shared benchmark paths; runtime C comparison uses the same emitted kernels across LLVM/Clang/GCC. Reproduced missing-language-import failure before changing the generator. Added `import foundation;`, leaving iterations/output checks unchanged; both C cases and short interpreter variants pass. This baseline rejection has no meaningful speedup ratio. |
| `scaffolding/tests/driver_measure_timings.tower` | D1-owned, read-only audit. Local vectors own names/values; exact decimal-ms to ns conversion rejects overflow, excess precision, duplicates and incomplete reports. No floats or process-global state. Fixture edge cases run through the existing runner; CLI timings provide phases, not worker idle/critical-path telemetry. |

### Remaining shared build/measurement entry points

These six read-only reviews are at `5a5cda4` (their source bytes are unchanged
from `6282238`). They extend D2 caller coverage without transferring the named
owner's production responsibility.

| Path | Storage, ownership, scheduling and evidence disposition |
| --- | --- |
| `scaffolding/tests/parser_benchmark.tower` | D1 fixture/B1 parser. One legacy host-world boundary installs a fixed grammar; each accepted entity is released, session destroyed before source buffer free. Four input sizes, five discarded warmups and eleven retained samples report wall nanoseconds, allocation calls and live tracked buffers. Repeated retained counts must stabilize. Instrumented allocator and host-world use are serial measurement, not concurrent sanitizer evidence. It checks parse success/retention, not canonical tree equivalence. Current run aborts at size512 when retained buffers rise9521→9522; sizes1024/2048 are unrun. B1 attribution pending; no assertion/warmup change. |
| `scaffolding/tests/compiler_project_units.tower` | D1 fixture/L2 reserved packager dependency. Local CompilerProjectFiles owns source text, unit records and derived dependency indexes. Duplicate collection must preserve unit identity/count; exported text comes from actual depfiles. All buffers close after synchronous writes. No second semantic graph. Source review only; exported closure needs separate compilation/object comparison before equivalence is established. |
| `scaffolding/host/runtime_bind.tower` | B2-owned foreign object boundary, compiled through budgeted runtime helper. One LLVM context/module owns IR while reserved function names/types are checked and uses rewritten; module verification precedes file publication. Opaque LLVM handles are appropriate at this ABI, not an alternate Tower storage format. Error/message/module/context cleanup is explicit. Baseline native build exercised real runtime bindings; malformed-argument/ABI failure and allocator coverage remain B2-owned. |
| `scaffolding/backend/embed_runtime.tower` | B2-owned streaming target-artifact encoder. Byte-at-a-time input/output has bounded stack retention, explicit overflow/read/write/close checks, and preserves exact hex bytes plus length. No compiler world/scheduling is needed. Output publication is serial and can leave partial files on failure; same-path input/output protection is absent in this internal tool. Current callers supply distinct generated paths. Browser build execution pending. |
| `scaffolding/backend/target_registry_tool.tower` | B2-owned registry generator invoked by foreign_tool. Three bounded 1 MiB reads complete before opening output; local buffers close lexically. Configured LLVM target declarations are emitted as ordinary Tower, with no ambient type registry or runtime scheduler. Baseline native build exercised generation. Generated output and transient aggregate input retention are separate from each read bound; malformed registry checks belong to B2. |
| `scaffolding/backend/foreign_tool.tower` | B2-owned Foundation text/foreign-name bridge. Mutable input, expanded bytes and wrap-response buffers are caller-owned contiguous vectors; temporary foreign-name objects close per token, extra modules contribute wraps only. All reads/expansion finish before serial output writes, preserving source order. Native baseline exercises target expansion. Review hypothesis: expansion calls void backend_text helpers without checking retained length, unlike the input reader; allocator-failure truncation needs B2 reproduction. No independent change made. |

An additional caller review at `599e8a8` covers
`scaffolding/tests/stress_sources.tower` (unchanged from the initial baseline,
D1-owned). Its 169 lines append deterministic text into one caller-owned
contiguous ByteBuffer; named sizes and enum cases describe syntax workloads.
The emit wrappers dispose buffers after synchronous output, and publication
requires an exact write within the 65536-byte interpreter output limit. Allocation
failure traps through the shared test assertions. There is no extra compiler
world, semantic graph or scheduler; generated program text becomes normal input
to the real compiler. Chain/field/worker generators include `import tower`, while
wide-function/declaration/register fragments intentionally depend on their
caller to supply a language. D2's complete benchmark wrapper supplies that
boundary. Existing 300-function generation and checked graph/native output299
exercise that branch; other generator branches retain D1's independent test
responsibility. Mutable size variables permit larger frozen experiments without
copying generator logic, but the output bound remains mandatory.

`scaffolding/benchmarks/compiler_reference_inputs.tower` is a new D2 source
reviewed over `4aef575`, SHA256
`86eb23867a65a06381622898a094f1696ab26f0f477014eb006b12aaaf628381`.
It reuses parameterized `stress_functions` and shared number/text/path/file
helpers, with caller-owned contiguous buffers and lexical cleanup after ordered
writes. One call-list loop supplies both languages; no imported mutable state,
compiler world or scheduler is introduced. Fresh-directory creation prevents
reuse of prior products, and failed directories are retained. Its C11 template
is an independently authored foreign-compiler reference input, not Tower's C
backend output; it checks 32-bit `int`, avoids header expansion and uses explicit
libc output ABI. Constants/calls/results match 16/1000-function Tower inputs.
Public-pin producer compilation/generation and independent function counts pass.
At `d1b45da`, all eight initial Tower/C builds and 32 repeated builds pass known
outputs and object comparisons; the measurements below show no useful two-worker
speedup. ASan execution reproduces all six normal output files with leak detection
enabled. Three initial producer
contract failures (reserved name, missing explicit function imports, mutation of
an imported initializer under `--library`) are preserved in the journal/logs.

### Copied bootstrap resources: provenance-only review

Parent assigned these 45 copied resources to D2 for provenance/equivalence only.
They are never hand-edited independently. At the initial reviewed commit,
`sha256sum --check --status SHA256SUMS` passes, and `cmp` of **every** resource
below against the same relative path under `scaffolding/` returns equal.
Individual hashes are retained in `build/d2_ecs/bootstrap_resources.sha256`.
The manifest's source revision `98ade8ccde255c445797ad51a1a2def0b41c85fb`
is reachable from reviewed main. Semantics/storage review belongs to the source
owner named below; equality proves copying identity, not that owner's acceptance.
All paths in the table start with `bootstrap/linux-x64/share/tower/`.

| Copied path | Source contract / owner; receipt disposition |
| --- | --- |
| `backend/foreign_grammar.tower` | Foreign declaration grammar, B2; exact source bytes, preserve ABI boundary. |
| `bedrock.tower` | Immutable declaration seed, B1; exact source bytes, do not activate new syntax through private copies. |
| `foundation.tower` | Foundation imports/grammar, B1; exact source bytes, canonical interchange unchanged. |
| `foundation_syntax.tower` | Low-level syntax declarations, B1; exact source bytes and package presence verified. |
| `library/ar_archive.tower` | Archive layout/borrowed members, A2; exact source bytes, no separate packaged implementation. |
| `library/bytes.tower` | Owned growable bytes, A2; exact source bytes, runtime allocator boundary retained. |
| `library/bytes_interface.tower` | Byte API declarations, A2; exact source bytes and import identity. |
| `library/bytes_types.tower` | Buffer ownership layout, A2; exact source bytes, no copied type divergence. |
| `library/coff_import_object.tower` | COFF import byte encoding, A2; exact source bytes, explicit target format. |
| `library/compiler_work.tower` | Shared compiler-query service, A2; exact source bytes, no bootstrap-only scheduler. |
| `library/compiler_work_types.tower` | Query/ticket layouts, A2; exact source bytes, revision/profile contract retained. |
| `library/crc32.tower` | CRC representation algorithm, A2; exact source bytes. |
| `library/deflate.tower` | Shared compression state, A2; exact source bytes, no host codec substitution. |
| `library/entities.tower` | Shared entity-store entry, A2; exact source bytes, no alternate graph. |
| `library/entity_api.tower` | Entity API/ownership declarations, A2; exact source bytes. |
| `library/entity_stage.tower` | Structural staging API, A2; exact source bytes, no private bootstrap lifetime policy. |
| `library/entity_types.tower` | Entity/component layouts, A2; exact source bytes, world ownership remains source-owned. |
| `library/float_bits.tower` | Explicit floating representation, A2; exact source bytes. |
| `library/float_text.tower` | Shared numeric text policy, A2; exact source bytes. |
| `library/gzip.tower` | Deterministic gzip envelope, A2; exact source bytes. |
| `library/platform.tower` | Platform capability declarations, A2; exact source bytes, host implementation remains external. |
| `library/queue.tower` | Owned FIFO storage, A2; exact source bytes, queue width is not concurrency. |
| `library/sha256.tower` | Pure fixed-width hash state, A2; exact source bytes. |
| `library/stack.tower` | Shared vector-backed stack, A2; exact source bytes. |
| `library/storage.tower` | Allocation/storage utilities, A2; exact source bytes, raw ownership contract unchanged. |
| `library/vector.tower` | Contiguous container/borrow API, A2; exact source bytes, no inferred alias exclusion. |
| `library/work_graph.tower` | Dependency graph entry, A2; exact source bytes, shared scheduling protocol. |
| `library/work_pool.tower` | Shared pool/admission API, A2; exact source bytes, no private pool implementation. |
| `library/zip_archive.tower` | Archive byte/member representation, A2; exact source bytes. |
| `tower.tower` | Ordinary language grammar, B1; exact source bytes, publish-before-adoption required. |
| `types.tower` | Prelude import entry, L2; exact source bytes, consolidation reservation honored. |
| `types/bool.tower` | Named bool definition, L2; exact source bytes, source policy continuation remains L2-owned. |
| `types/f32.tower` | Named binary32 definition, L2; exact source bytes. |
| `types/f64.tower` | Named binary64 definition, L2; exact source bytes. |
| `types/i16.tower` | Named signed-16 definition, L2; exact source bytes. |
| `types/i32.tower` | Named signed-32 definition, L2; exact source bytes, altered-source binding test must survive consolidation. |
| `types/i64.tower` | Named signed-64 definition, L2; exact source bytes. |
| `types/i8.tower` | Named signed-8 definition, L2; exact source bytes. |
| `types/integer.tower` | Shared integer constructors, L2; exact source bytes, executed-constructor gaps not erased by packaging. |
| `types/u16.tower` | Named unsigned-16 definition, L2; exact source bytes. |
| `types/u32.tower` | Named unsigned-32 definition, L2; exact source bytes. |
| `types/u64.tower` | Named unsigned-64 definition, L2; exact source bytes. |
| `types/u8.tower` | Named byte definition, L2; exact source bytes. |
| `types/usize.tower` | Target-size type definition, L2; exact source bytes, target layout not host inference. |
| `types/void.tower` | Named void definition, L2; exact source bytes. |

D2 uses only `/home/deck/tower-agent-2` on `main` and cache
`/home/deck/.cache/tower-d2-ecs-20261122`. Private Docker container
`tower-d2-ecs` restricts execution to CPUs 0 and 2 (different physical cores),
with one build command/job at a time under the external D1/D2 heavy lock.
Initial host: SteamDeck, 14.8 GiB RAM, 9.6 GiB available, existing 5.6 GiB swap
usage, 142 GiB free on `/home`. Existing unrelated containers/caches are untouched.
Image identity: `sha256:4be584fb42a6cefb921b8f8bd686f61ef6e7e721eee2393b2ab1dfce16a7f4f6`.
Clang is Ubuntu 19.1.1; the image initially lacked GCC and external GNU time.
Those OS measurement dependencies were installed only in the private container.

Logs are under ignored `build/d2_ecs/`. The first native launch prerequisite
probe returned 1 because `/usr/bin/time` was not installed yet; it did not run
or validate a build. Installation completed before retry. The actual clean
native build uses `build-native.sh -DTOWER_DRIVER_TESTS=ON`, the default public
bootstrap with no override, `TOWER_BUILD_JOBS=1`, and GNU time. All 51 steps pass.
The import closure remained unchanged during the build. Documentation edits
cannot affect runtime performance; they require no before/after runtime profile.

The native build took 288.99 s wall, 302.85 s user, 20.75 s system, and
829632 KiB peak RSS, zero reported swaps. One cold-cache sample, source
`62822387`, scaffolding tree `9703a7c0264660e42831a41636fd6fe457dce1b0`.
Public compiler hash:
`9653f8187a104ca84ab5d8601f336d7e1ed8200206544c70a81415018d623d02`.
Built compiler hash:
`b9555aff99e132d85f86c5f4531fc229be8ce21761f17f22e738378416e72520`.
This is native build closure, not a complete browser/generation release receipt.
GNU time peak RSS is a process/child high-water observation, not summed
simultaneous memory or live component allocation counts.

### Explicit worker baseline

The clean build's compiler recipes omit `--jobs`; Linux `get_nprocs` ignores
the Docker affinity cap. One Ninja job and two allowed cores therefore do not
mean two admitted compiler workers. The following direct measurements explicitly
set `--jobs 1`, `2`, or `8`, using the unchanged public compiler/resources,
x86_64 Linux target, default optimization, fresh processes and warm filesystem
inputs. They run serially under the heavy lock. Each invokes
`towerc SOURCE --jobs N --timings --emit object -o OUTPUT` under GNU time and
180-second timeout. Three samples in repeated 1/2/8 order, no discarded warmup.
All 18 objects match exactly within each workload. Raw samples and phase logs:
`build/d2_ecs/worker_complete/`.

| Input / workers | Median wall s | Median CPU s (user + system) | Median peak RSS KiB |
| --- | ---: | ---: | ---: |
| `examples/functions.tower`, 1 | 2.36 | 2.31 | 180320 |
| Same, 2 | 3.12 | 3.59 | 188908 |
| Same, 8 | 3.05 | 3.57 | 194684 |
| Generated 300 functions, 1 | 4.37 | 4.23 | 177512 |
| Same, 2 | 3.07 | 3.58 | 194520 |
| Same, 8 | 3.17 | 3.70 | 202896 |

The wide-input serial samples are **6.33, 2.21, 4.37 s**: excessive variance
prevents a dependable speedup claim from this sequence. The host uses the
`powersave` governor; one observation showed CPU0 at 1.078 GHz and CPU2 at
2.425 GHz. This is a possible confounder, not a demonstrated root cause; no host
power settings were changed. Parallel CPU/wall exceeds one, showing concurrent
CPU consumption, but does not by itself prove useful body overlap. Small-input
phase logs are dominated by the CLI's `parse` interval (first pair 1.911 vs
2.461 s). Source inspection shows that interval includes frontend compilation
and checking, not just parsing; it does not expose worker idle/critical paths.
More workers cost memory and CPU on that input. GNU time also records median
voluntary/involuntary context switches of 880/137 at jobs1, 3591/723 at jobs2,
and 4044/863 at jobs8. The wide input has 881/319, 5314/1714 and 5592/1109.
These process scheduling observations support investigating coordination cost;
they do not isolate lock contention or quantify worker idle time. Actual producer
overlap and stable scaling remain validation work.

The new wrapper reuses `tests/stress_sources.tower` and generates complete source
SHA-256 `d94fdd197f616fa09a8ad46f61e06bb0427a7ae9d788dbf3321aa3c25c8c2a03`.
The historical fragment runner initially failed at line 1 for missing import;
its rejected run remains in `worker_baseline/`. The complete source independently
prints 299 in both the graph interpreter and native executable. Staging fixture
`computed_type_arguments.tower` prints 0 at jobs 1/2; import fixture
`worker_modules/main.tower` prints `9,10,9,17,8,16` at both budgets.
Single-sample staging wall/CPU/RSS: 3.32 s / 3.24 s / 172188 KiB versus
3.10 s / 3.58 s / 192376 KiB. Imports: 2.30 s / 2.26 s / 172436 KiB versus
2.94 s / 3.40 s / 182268 KiB. These are baselines, not scaling conclusions.

### C reference and failed evidence

The existing `tower-driver-tests --measure-c` command failed before the
authorized generator fix, reporting a missing language import and withholding
`measurements.json`. After prepending `import foundation;`, recurrence and memory
pass for LLVM O2, raw/optimized emitted C under Clang/GCC O2 (seven runs), and
the 100,000-iteration graph/fast-O0/fast-O2 variants. Long results are
3202183599 and 2492321792; short results 1167989999 and 3197601747. Complete
runner: 24.38 s wall, 20.72 s user, 2.39 s system, 123000 KiB peak RSS.
Report `measure_c_fixed/measurements.json` SHA-256:
`cf4ff8a4033fff92f3291e54bee1744b1cb2c38366083a3b7240fab346ac2310`.

Separate three-sample object compilation of the same recurrence semantics:

| Compiler/input | Median wall s | Median CPU s | Median peak RSS KiB |
| --- | ---: | ---: | ---: |
| Public Tower, `--jobs 1 --emit object`, 204-byte Foundation source | 0.78 | 0.73 | 111364 |
| Clang 19.1.1, raw emitted 10350-byte C | 0.17 | 0.15 | 103992 |
| GCC 13.3.0, same C | 0.21 | 0.18 | 27772 |

C flags: `-x c -std=c89 -pedantic -Wall -Wextra -Werror -O2 -c`.
The recurrence, iteration count, integer widths and checked runtime results
match. Frontend inputs differ: Tower loads language/type resources and lowers
Foundation; C contains generated helpers/hosted headers. Object emission excludes
linking and runtime. This is an explicit implementation cost comparison for
equivalent behavior, not a cross-language superiority claim. Raw C/LLVM share
Tower semantic checking, so they are not independent frontend semantics oracles.

`measure_native_overlapped/` passed expected memory/function outputs, but its
timings and `tools_baseline_build.time` are **invalid for performance**: D2
accidentally overlapped them. The tool build finished before attempted
cancellation; both jobs drained. No overlapped times enter the tables above.

The initial heavy lock was released only after every D2 child was terminal;
container init/sleep are idle. No broad cleanup or sibling-cache access occurred.
Build-budget plumbing is implemented after owner handoff and awaits executable
validation. Whole-file hash
retention and unconditional tool rebuilding are reviewed candidates, not claimed
fixes. A2 owns actual Tower IR/object instrumentation; no unsupported CXX flag or
serial allocation check is counted as thread sanitization. Integrated release,
publication lease, atomic source/Pages push and hosted verification remain open.

### Explicit build-budget implementation and measurements

Source `6a2536b` implements the owner-approved `TOWER_COMPILER_JOBS` CMake setting,
default 1, before the project hook and all generated command expansion. All direct
CMake compiler/linker commands and the existing Tower builder forward the value.
The small sequential post-Wasm foreign fixture explicitly uses jobs 1 and does not
inherit CMake cache values. Outer Ninja parallelism and ordinary CLI behavior are
unchanged; callers still budget their product of processes and inner workers.
No new scheduler or numeric option parser was added. CMake rejects zero, negative
and nondecimal values; the existing CLI rejects unsupported capacity/overflow.

The real regression passes five invalid budgets without publishing products,
then compares nonempty objects at jobs 1/2. Independent executable comparison also
passes. Aggregate 14.00 s wall/14.44 s CPU/213972 KiB peak RSS, zero swaps. The smallest
builder and regression units compiled first through the public pin, with no
private bootstrap override. These are correctness run durations.

The unchanged `package_roku` source, public compiler/resources and guest host
object are then compiled/linked through the retained old builder and new builder.
Three samples each in repeated old/new1/new2 order, fresh processes/output paths,
warm filesystem; all nine object and executable outputs match byte-for-byte.

| Builder budget | Wall samples s | Median CPU s | Median peak RSS KiB | Median voluntary/involuntary switches |
| --- | --- | ---: | ---: | --- |
| Old implicit host default (up to 8 on two allowed cores) | 6.57 / 5.16 / 5.49 | 6.24 | 223256 | 6591 / 1624 |
| New explicit 1 | 3.77 / 4.50 / 4.94 | 4.39 | 193460 | 1375 / 221 |
| New explicit 2 | 5.12 / 5.04 / 5.49 | 5.91 | 213512 | 5860 / 1644 |

The modest-host selected-tool median improves from 5.49 s to 4.50 s with lower CPU,
peak RSS and scheduling counts. Variance and fixed sample order limit broader
claims; no universal serial superiority or compiler scaling claim follows.
Raw commands, stdout/stderr and GNU time counters are retained under
`build/d2_ecs/budget_after/{before,serial,parallel}_{1,2,3}/`. No swaps occurred.
The argv addition borrows strings and keeps compile argv within capacity 16
(14 entries before, 16 after); link argv reuses it. This source-level allocation
accounting is distinct from measured allocator/live-component instrumentation.

The clean default-budget native build passes all 51 steps in the separate
`native-budget` cache: 294.59 s wall, 285.20 s CPU, 777296 KiB peak RSS, zero swaps.
Compared with the original single observation, wall is 1.94% higher, CPU and RSS
lower; no whole-build speedup claim. Both build caches started empty, without
filesystem cache flushing. The generated cache records 1 and all 43 direct
bootstrap custom-command lines contain jobs 1. The compiler executable exactly
matches baseline SHA-256 `b9555aff99e132d85f86c5f4531fc229be8ce21761f17f22e738378416e72520`.
Nine runtime `.ll` files differ solely in first-line ModuleID cache-path comments;
the raw diff is retained, and excluding only those comments makes complete share
trees equal. The full resource packages are therefore not byte-identical.

Canonical `build-bootstrap.sh --tools package_roku` passes with the default
jobs 1 cache and a separate explicitly configured jobs 2 cache. Both selected
objects/executables equal the regression reference. The rebuilt native compiler
interprets the wide source to 299, matching saved graph/native outputs. The first
comparison referenced a nonexistent `wide_graph.stdout` and failed after successful
execution; the corrected comparisons use the existing `wide_checked.stdout` and
`wide_native.stdout`, without rerunning the compiler or hiding the failed command.
The original runtime publication identity remains unchanged. Allocation/retention,
actual compiler overlap, supported instrumentation, applicable generation/browser
release checks and coordinated publication remain outstanding.

## Optional native object sanitizer integration

Root assigned D2 the shared CMake transport for A2's Tower policy tool. The
ordinary empty mode preserves the validated production recipes. Address/thread
mode emits original LLVM, applies existing foreign bindings, instruments every
owned linked module, compiles with plain Clang-O1 and links compiler-rt only at
the final executable. Build-host tools and distributed cross-target runtime
resources are explicitly excluded. Driver tests receive a separate instrumented
guest library; the serial allocator fixture keeps its existing serial transport.
No alternate manifest parser, compiler graph, scheduler or `noalias` was added.

At checkpoint `599e8a8`, both four-object work-pool targets pass ASan/TSan; the
heap-overflow/race probes report the required errors with exit1/66. The TSan LR
target builds through existing CMake recipes: its22 direct objects and all4
memory archive members contain instrumentation references. Three LR runs pass
with identical output; query-smoke passes32/64-bit,1/4-worker cases. Exact
commands, per-object symbols/hashes and GNU-time logs are retained under
`build/d2_ecs/sanitizers`. System LLVM/libc/compiler-rt are foreign dependencies,
not instrumented Tower modules. Source-language UBSan is unsupported.

The backend selector fails its180s timeout, exit124:180.06s wall,178.04s CPU,
564220KiB RSS,0swaps, no diagnostic. At the late snapshot only the main thread
was busy, alongside TSan's sleeping maintenance thread. This does not establish
backend overlap or diagnose a race. Follow-up needs a normal-mode baseline and
longer bounded instrumented run; neither existing assertions nor timeout evidence
were erased. D1's next heavy slot precedes that investigation. Full address-mode
compiler checks, changed-builder instrumentation, configuration rejection tests
and final integrated publication remain pending.

The configured TSV initially recorded object/original-IR/instrumented-IR/mode;
a subsequent metadata-only refinement adds each recipe's actual Tower source
path. Generated source and original/bound LLVM remain distinct. This is a
configuration inventory, never a claim that every configured target was built.

### Matched independent frontend inputs and modest-host measurements

Frozen source `d1b45da` and the public compiler/resources identified above produce
16-function (558-byte Tower/806-byte C) and 1000-function (37699/45819-byte)
inputs. Both languages contain the same constant-return functions and ordered
calls; the only printed results are independently known15/999. The C is authored
by the Tower input producer, not emitted by Tower's compiler. Its static functions,
32-bit-int assertion and explicit libc declaration avoid header expansion.
Tower loads its editable language/type prelude. These are deliberately simple
body/front-end workloads, not representative of every compiler subsystem.

Inside the same isolated image/CPU0,2 allocation, Tower uses `--jobs 1|2
--target x86_64-unknown-linux-gnu --bedrock scaffolding/bedrock.tower
--foundation scaffolding/foundation.tower --timings --emit object`; Clang19.1.1
and GCC13.3 use `-std=c11 -m64 -O2 -fwrapv -c`. Tower's ordinary optimized pipeline
and C `-O2` are not identical optimization algorithms. Each object is linked in a
separate timed invocation; Tower uses its public runtime IR compiled once, C the
matching compiler driver/system runtime. The runtime build is separately recorded
(1.51s wall/1.42s CPU/95988KiB), not charged again to each Tower sample.

All eight initial compiler/input combinations pass15/999. Four subsequent fresh
process samples per combination pass again, including exact object equality to
the initial reference and Tower1/2-worker equality. These are warm-filesystem
runs after the initial correctness set, not OS-cold caches. Worker order is1,2
for samples1/4 and2,1 for2/3; small then large cases, C after Tower. C phase-report
flags are used only on the initial diagnostic set, excluded from this throughput
table. Raw logs retain commands, phase output, wall/user/system/RSS, switches,
zero swaps, object hashes and checked program output.

| Input/compiler | Wall samples s | Median wall s | Median CPU s | Median peak RSS KiB |
| --- | --- | ---: | ---: | ---: |
| Small Tower1 | 6.03 / 2.32 / 3.09 / 2.15 | 2.705 | 2.645 | 177186 |
| Small Tower2 | 3.17 / 2.73 / 3.02 / 2.74 | 2.880 | 3.410 | 186596 |
| Small Clang | 0.04 / 0.04 / 0.07 / 0.07 | 0.055 | 0.040 | 97676 |
| Small GCC | 0.02 / 0.02 / 0.02 / 0.03 | 0.020 | 0.010 | 21310 |
| Large Tower1 | 6.49 / 2.39 / 2.37 / 3.32 | 2.855 | 2.810 | 193786 |
| Large Tower2 | 3.12 / 3.13 / 3.21 / 3.32 | 3.170 | 3.730 | 218074 |
| Large Clang | 0.35 / 0.17 / 0.35 / 0.23 | 0.290 | 0.270 | 108232 |
| Large GCC | 0.16 / 0.16 / 0.08 / 0.13 | 0.145 | 0.130 | 32646 |

Four-sample medians average the central pair; extra displayed digits do not
improve GNU time's0.01s resolution. Serial first samples have severe CPU/wall
variation and are retained. The powersave governor and variable clocks were
observed, but their causal contribution is unproven. No robust two-worker speedup
or general competitiveness claim follows. Clang/GCC are substantially faster on
these matched minimal bodies. Tower2 adds CPU/RSS; no critical-path/idle attribution
was measured by these aggregate timers. Actual useful overlap is independently
asserted by the normal backend suite, not inferred from worker count.

Separate link wall medians small/large: Tower1 0.04/0.03s, Tower2 0.04/0.04s,
Clang0.06/0.08s and GCC0.035/0.035s. Link CPU/RSS and exact commands remain in raw
receipts. Sample2 Tower phase measurements illustrate where the cost lies:

| Input/workers | Bootstrap ms | Frontend parse+check ms | LLVM lowering ms | Optimization ms | Object emission ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Small1 | 342.584 | 1922.592 | 1.284 | 2.764 | 1.999 |
| Small2 | 261.125 | 2412.508 | 1.156 | 2.762 | 1.820 |
| Large1 | 174.157 | 2032.044 | 13.176 | 114.242 | 2.163 |
| Large2 | 278.412 | 2629.847 | 13.835 | 112.547 | 2.314 |

The CLI `parse` interval encloses `driver_compile_program`/`driver_execution_compile`
and combines parsing with checking. `before`/`after` mean LLVM lowering/optimization;
these are not separately sampled frontend medians. Root accepts this current
combined timer while B2 owns finer attribution. GCC's initial large diagnostic
sample reports0.05s parsing/0.26s optimization-and-generation; Clang's named
front-end timer includes its compiler action and must not be compared as a pure
parser timer. Logs: `build/d2_ecs/reference_checks`, `reference_profiles`, and
`reference_checks/inputs.sha256`. Cold-cache frontend, realistic larger bodies,
and profitable multi-unit scaling remain distinct gaps.

### Valid workload instrumentation and retention follow-up

At the unchanged production closure, three100-process samples of each normal,
address and thread work-pool executable all pass,900 valid lifecycles total.
Each mode retains the test's barrier/thread assertions; every sample's stdout
matches the normal reference. Address mode enables leak detection, both modes
halt on errors. Median100-run wall/CPU/peakRSS are normal1.14s/1.42s/34012KiB,
address4.24s/4.74s/63588KiB and thread11.41s/17.21s/122332KiB. These include process
startup, runtime and optimization-mode differences; they are not isolated
instrumentation pass overhead. There are no new sensitivity runs after root's
steering. Existing sensitivity receipts remain historical evidence only.

The normal backend selector passes in142.39s wall/184.57s CPU/1142808KiB, with
actual barrier-confirmed frontend/LLVM overlap, deterministic output/errors,
budgets and cancellation assertions. The earlier instrumented180s timeout is
still failed evidence. A justified bounded follow-up and profiling are pending;
no timeout increase, omission or normal result has converted it into a sanitizer
pass. Foreign LLVM/libc remain outside Tower object coverage.

The current parser allocation/retention run aborts134: eleven256-symbol samples
remain at803 allocation calls/live8748; size512 has1577 allocations/live9521 for
six reported samples, then live9522. Sizes1024/2048 never run. This violates the
existing repeated-input stability assertion but does not yet distinguish retained
capacity from a leak. Unbuffered diagnostics and exact serial allocator link are
preserved. GNU time's misleading Exit status0 accompanies signal6 and does not
override raw134. B1/D1 own attribution; no assertion or warmup weakening occurred.

Valid ASan build_tools/budget-regression execution passes five invalid-option
rejections without products plus real1/2-worker object checks,12.01s wall/12.61s
CPU/213924KiB including uninstrumented public compiler children. The paired source
producer passes ASan and emits all six byte-identical files (0.02s/25128KiB).
These cover the changed tools and guest runtime, not child compiler code. Full
address-mode compiler coverage and source-language UBSan remain unclaimed.

All owned processes drained before releasing the D2 host slot. Final resource
snapshot:141GiB free,9.9GiB RAM available,5.8GiB preexisting swap use; measured
commands report zero swaps. No generated-data cleanup was needed. Compilation
and ownership fixes still require integration with other lanes, exact-source
release validation and leased publication before campaign acceptance.

### Incoming measurement companion (reviewed draft, not integrated coverage)

B1's `scaffolding/tests/parser_retention.tower` is delivered externally with
SHA256`f0033081ec3a8623b01d0ecc38c4d00e3f92b436b50c6ef57a4e2cb7086c4688`.
It is additional source review, separate from the98tracked-path count. A private
vector deduplicates component-page pointers reached through all live entity-table
rows, including full pages detached from the open-page list. This is a derived
observer, not another owner or authoritative graph. Allocation counts are sampled
before observer allocation and the vector is disposed after every snapshot.
Serial transport is asserted; the observer does not mutate payloads or outlive
its world/session. The original reset/declaration/statement/release sequence is
preserved. An explicit owned-world path requires frontend cleanup, world disposal
and exact allocator-baseline restoration.

Independently inspected B1 host/owned CSVs (128resets for each of four sizes)
attribute the reported increase to component-page churn with stable entity,
component and revision-cache counts. Host session teardown returns4546tracked
buffers; owned-world teardown returns its exact initial count. This is B1 runtime
evidence, not a D2 execution. A2's source-derived page/byte bound and D1's precise
benchmark oracle remain integration prerequisites; finite observations alone
cannot justify an arbitrarygrowth allowance. No B1 experiment is copied into the
production build or independently modified by D2.

Four additional A2/D1 measurement drafts are reviewed from
`validated_checkpoints.patch` and D1's entry-point-only `focused_registration.patch`.
They remain outside the98locally tracked paths until integrated. D1's seven
CTest passes and64balanced fixture/profile executions are cross-lane evidence;
D2 has not run this incoming closure. Existing shared CMake object/runtime rules
and opt-in measurement targets avoid a second harness or compiler manifest.

| Incoming measurement path | Reviewed identity and storage/world/scheduling/ownership disposition | Evidence limits |
| --- | --- | --- |
| `scaffolding/tests/work_select.tower` | A2`0b57994d`, blob`dfc04fbf`, then D1 exported-main wrapper. One local WorkGraph owns contiguous derived task/ready/index/scratch vectors, disposed after the trial; no new world or semantic graph. Timed setup plus forward/reverse targeted admission/finish checks use shared tickets at32/4096/65536tasks, require empty ready/running state. | Monotonic/getrusage failures trap. Reported capacity sum covers the named graph vectors in this no-edge workload, not all process memory. Serial ready selection is deliberately not parallel speedup evidence. |
| `scaffolding/tests/work_budget_profile.tower` | A2`8d8faee3`, blob`3791624a`, then D1 wrapper. Local budget and initialized receipt array survive all reserve/reverse-release operations; receipts close before budget disposal. Every grant and final/peak accounting is checked. No global world or alternate scheduler. | One/twelve ledger lanes are reservation workload sizes, not actual concurrent workers. Measures ledger overhead; reported retained ledger capacity excludes separate receipt storage. |
| `scaffolding/tests/work_kernel_overhead.tower` | A2`07246521`, blob`5650b1ca`, then D1 wrapper. Contiguous jobs plus borrowed pointer index use production pool/typed kernel projection. One warm dispatch precedes timed1/32/1024-job repetitions; each arithmetic result checked. Synchronous dispatch must drain before returning and before job buffers free; later pool close releases idle transport. | Worker1/2/4/8 are explicit stress cases, not host recommendations. Capacity accounting omits opaque semaphore/thread-stack storage; peak RSS is process-wide. No lease/alias permission is inferred from pointer adjacency. |
| `scaffolding/tests/work_kernel_profile.tower` | A2`07246521`, blob`af0c348d`, then D1 wrapper. One immutable million-byte input is borrowed by independent per-job SHA states/results/timestamps. Job array and pointer index outlive pool close; all trials finish before input free. Shared dispatch and actual pthread identities are used, with independent million-a SHA oracle. | Reports overlapping job intervals/caller count and cold batch setup, not a barrier proving simultaneous CPU execution or compiler end-to-end scaling. Capacity sum omits opaque transport/stack memory; rusage high-water carries across cases. Raw timing/output remains necessary. |

The root integration receipt requires current dispatcher batch/projection,
budget-types, vector-reset and owning compiler/type handoffs. It explicitly
supersedes older bundle versions. D2 has reviewed the relevant boundaries but
has not assembled an incomplete mixed-ABI compiler, rerun discarded fixtures or
attributed existing checks to these pending source changes.

`scaffolding/tests/tool_output_identity.tower` is a sixth incoming measurement/
regression draft, reviewed at A2`5911d9cc`, blob`5c1d8ed3`. Four owned path buffers
and one closed mkstemp file establish same-path/symlink/hardlink/missing-output
cases. Deferred unlink runs while path owners remain live, and measured loops
only query identity; they never overwrite the aliased input. Normal mode requires
hardlink rejection; explicit `measure` mode can report the old defect without
claiming regression success. Linux x64 clock/rusage errors trap. The reported
path-capacity sum intentionally excludes old realpath allocations and OS state.
Existing library helper owns the inode/device policy; there is no file identity
registry, new world, compiler scheduler or claim against concurrent renames.
D1's shared ordinary/sanitized target registration is preferred over a second
standalone build path. Local execution awaits the coherent owner handoff.

Additional inspection of the same frozen reference receipts (no rerun) finds
median voluntary/involuntary context switches of101/130.5 for small Tower1,
2823.5/730 for small Tower2,100.5/95.5 for large Tower1 and9810/3198 for large
Tower2. All16Tower object compilations report zero major faults and filesystem
input blocks. More switches and CPU at two workers identify scheduling cost to
investigate; they do not quantify worker idle time or prove a particular lock is
responsible. The slow first serial samples consumed correspondingly more CPU,
so these counters alone do not establish an I/O-wait explanation. B2 receives
this attribution lead with the original unmodified raw logs.

### Bounded backend TSan follow-up: assertion failure, not acceptance

After the normal142.39s result, root approved one unchanged-source600s diagnostic.
The exact26-object executable (`dcc43b7c6959e4ab7efea7a4b3e929d813c683d9efb86e73ac4a30e2a8ea7787`)
aborts at458.83s with `frontend/backend overlap deadline`, raw exit134/signal6.
CPU483.80s, peakRSS820556KiB,0swaps. It hits `unit_stream_wait`'s internal30s
signal-wait assertion before the outer limit. GNU time's Exit status0 is
misleading beside signal6; the tool's raw134 is authoritative. No TSan diagnostic
preceded the assertion. Both this failure and the earlier180s timeout are retained;
neither constitutes sanitizer acceptance or a test deadline fix.

Host perf6.15-3 supports user-space sampling without changing host policy.
Three20s/49Hz windows retain963/976/966samples with zero lost. Early self-cost
is79.86% TSan unaligned read/write4/8 hooks. The later two DWARF windows show
inclusive LALR construction73.57% and59.83%, with closure/item-index work prominent.
These inclusive shares overlap. Frame-pointer chains were incomplete;8192-byte
DWARF stack capture recovers useful callers but may truncate deep roots. Exact
owned-cache symbols resolve through a local symfs link; foreign-library symbols
are incomplete. Main-thread snapshots remain busy while TSan maintenance sleeps.
The final overlap interval was not sampled, so the producer that missed its
30s deadline remains unattributed. Sampling also precludes a clean timing ratio.

Root/B1/A2/B2/D1 receive reports, hashes and final raw failure through
`D2/backend_profile_handoff/`. All sampling/test jobs drained before the shared
host lock was released. No guessed alignment, alias guarantees, ignored memory
accesses, private compiler caps or weaker assertions were introduced. This is
old60741c5 production-source evidence, not validation of the incoming budget/type/
parser changes. Full changed-source compiler sanitizer/release gates remain open.

Root's live inventory adds10pending measurement/tool-check reviews requiring
owner source delivery: A2`tests/entity_locality.tower`, `layout_frontier_profile.tower`,
`work_budget_allocation.tower`; B1`tests/lr_state_benchmark.tower`,
`parser_retention_observer.tower`; B2`tests/frontend_units_profile.tower`,
`frontend_units_memory.tower`, `frontend_units_allocation.tower`,
`module_cache_profile.tower`, `foreign_tool_checks.tower`. These names receive no
substantive-review credit yet. Their authors and D1 retain implementation/harness
ownership; D2 will review actual measurement/caller contracts at supplied hashes.

### Ten additional owner snapshots reviewed

The ten pending bodies above were delivered and read in full. Receipt
`audit_source_snapshots/receipt.json` was verified2026-11-22T21:00:19Z. A2's
clone HEAD is`04a877813fc4859f5f77e77524f74d1d1a54f3d8`; B1/B2 HEAD is
`60741c515b3ca40b3b39aed61fb38a82694ae9ea`. These HEADs identify working-tree
provenance, **not** committed content: exact dirty/untracked bytes are identified
below, and every local SHA matches the supplied owner receipt. No bodies were
applied to D2 or executed here. Coverage is98locally tracked paths plus16incoming
draft source reviews, not114integrated passing files.

| Path / exact SHA-256 | Ownership, world/storage/scheduling and measurement disposition |
| --- | --- |
| `scaffolding/tests/entity_locality.tower` — `dbdab851e48685ebc21b425cca2069aeadf2c9251beb56ca6af836469af109c7` | A2. One explicit entity store/kind owns stable paged32-byte payloads. Owner lookup, component query, table-column pointers and a read-only packed snapshot check the same algebraic sum. Views close before removal; surviving addresses remain unchanged, one live component pins each original page, all owners/kind/store then release. This directly exposes payload indirection and fragmentation, rather than equating archetype columns with packed payloads. Snapshot copy time excludes its allocation and query/view setup; steady scans exclude construction. Linux/glibc malloc_usable_size measures those page allocations, not all store/RSS bytes. No thread scaling claim. |
| `scaffolding/tests/layout_frontier_profile.tower` — `46bdbdee47458b658f10627e614c973da0e464b7fa8c887335442f96952a4d26` | A2. Real world-owned semantic records/fields feed the existing layout dependency pump; independent/chained frontiers have algebraically checked sizes/ordered offsets. Shared synchronized budget includes the caller reservation; context/workers drain before program/world disposal and grant release. No second scheduler or layout evaluator. Timed pump excludes graph construction and checking; pool peak is admitted slots, explicitly not overlap. Byte budget0 does not supply a retained-memory bound. Fixed1/2/4/8worker profiles require host budgeting. |
| `scaffolding/tests/work_budget_allocation.tower` — `fe6f08420e7937439e90bad7fc8e03c407ea76a09b0d1d4e8f3d9d425352a8cd` | A2. Explicit serial transport guards global allocation-failure counters. Local ledger/receipt array checks empty grants, first/growing allocation rollback, unchanged inactive output, exact pointer/generation/accounting preservation, allocation-free slot reuse, stale-copy rejection and final baseline restoration over16trials. Original live grants remain releasable. This is allocator/receipt ownership coverage, not threaded sanitizer evidence or a throughput benchmark. |
| `scaffolding/tests/lr_state_benchmark.tower` — `7f6df821ee1e75bacc2c25b50c5c7eeab51978ca52fafca7f66980b88f4feff3` | B1. Owned grammar arrays/analysis and serial reference remain frozen while explicit world/anchor drives shared LR construction. Every ordered item/range/origin/transition is compared, then results destroyed; retained entity/component counts must recover and world drain succeeds. Three warmups/15samples, repeated small/chain work, bounded cases/worker admission. Wall and process-CPU timers cover construction only; switch deltas also include untimed equality/destruction. RSS is process high-water including reference/setup. Equality is differential against shared serial implementation, not an independent grammar algorithm; worker count alone proves no overlap. |
| `scaffolding/tests/parser_retention_observer.tower` — `6fade0fafde84305791bce383416e326be28c2cc600fbc7bc749fb9442f0b02c` | B1. Quiescent joined-world observer deduplicates pages through owner components; private vector closes before return, counter captured before observer allocations. Overflow-checked requested-page/live-payload bytes use actual layouts; large individual allocations are excluded. It checks aggregate pooled references equal summed page.live, not a separate observed-owner count for each page despite its stronger comment. D1's oracle adds that per-page census. Same-owner comparison covers totals/cache count/nonpage buffers, not cache pointer identity. This helper is measurement evidence, not independent proof of every page's ownership or total heap. |
| `scaffolding/tests/frontend_units_profile.tower` — `2e4b84e4bb341ef3aeaddb205aea5b91e962207762c57e08921bc5e061e63b50` | B2. Frozen source/grammar buffers and unique per-ordinal observer spans outlive owned frontend/backend batches; reverse cleanup closes backend before frontend, spans and inputs. Ordinary generated bodies include decltype/comptime and a skewed final unit; no alternate compiler. Timed interval covers batch creation/snapshot/compile, excludes answer42 interpretation and canonical formatting/hash. Reports real event intervals/thread IDs and ledger/source/object bytes, distinct from total RSS; outer span sums omit nested idle/critical-path detail. Optional backend checks ELF envelope only; object equality/execution needs separate tests. Adjacent spans may share cache lines; no measured false-sharing claim. |
| `scaffolding/tests/frontend_units_memory.tower` — `008ca9d7c17074d9cde97ae12905cc0afd3a5c5c60ab547ad1973b5cf6c5e37a` | B2. Explicit worlds/module environments/program roots and ordinary interpreter validate source-length boundaries, embedded-NUL offsets, exact snapshot caps, overflow rejection and rollback/commit receipt accounting. Denied replacement preserves the prior compilable input; successful replacement excludes an invalid suffix and releases only the old grant. Program/root/environment/world cleanup order is explicit. Budget bytes describe charged snapshots, not all compiler allocations/RSS. Malformed inputs remain bounded valid API tests, not deliberate invalid-memory probes. |
| `scaffolding/tests/frontend_units_allocation.tower` — `28e3e4a001fa7237a6e5c5fa8427b6582dbb80d602203c535aaf52281d276cb7` | B2. Serial fault injector is asserted. A primed ledger slot isolates first/second snapshot-allocation failure from ledger growth; failed replacements preserve buffers/receipts and the previous valid source still compiles. Batch closes before exact baseline count, borrowed grammar vectors close afterward. Exports a root helper for D1's existing generic runner, without an alternate main/scheduler. No concurrent sanitizer coverage follows from these counters. |
| `scaffolding/tests/module_cache_profile.tower` — `0930654a30c0845e3ca804827257385d6dabcbc1c7767985350df780471f1148` | B2. Explicit world/environment owns copied diamond-module sources; serial publication order is intentional. Each parse releases accepted entities and destroys its module wrapper, verifies unique module count; shared-leaf grammar replacement must reject the old terminal and accept the new terminal. Environment/world caches clear and dispose. Four samples distinguish first use from warm cache; timed parse includes finish/wrapper destruction. Counts/RSS are observations, not a stable-buffer oracle; world4workers alone proves no useful concurrency. Linux x64 ABI is checked. |
| `scaffolding/tests/foreign_tool_checks.tower` — `1ac2930becdca1e7d88ad7b1a2265e0e8609c982011112b92391dd566e4fb5d1` | B2. Local input/output/wrap buffers test plain/quoted/comment/backtick and mangled-wrap allocation failures, requiring rejection, unchanged input and baseline restoration. Successful wrapper bytes/flags are checked exactly. Existing runtime binder selects the exported check entry because imported foreign_tool owns main; no native shim or duplicate recipe. Serial allocator link is an explicit caller requirement, not concurrent instrumentation. This is the owner's regression for D2's earlier foreign-output OOM hypothesis; production-fix validation and local execution remain separate receipts. |

Source-review findings were routed to owners: qualify the B1 observer's per-page
ownership claim; distinguish locality snapshot copy from allocation/query setup;
keep LR switch counters separate from construction-only timers; retain B2 ledger
and object-envelope coverage limits. No speculative production edit or performance
claim was made from source inspection.

### Prelude/resource handoff review

L2's exact`c8c9eadb518f9ff96edd9b4a63bd1c15f106492fdc67e4e7ac4693164c8a9fc6`
resource patch consolidates primitive definitions in types.tower, removes14helper
files and adjusts native/browser/compiler-project enumeration. D2 reviewed its
resource/caller scope; own worker-budget/sanitizer settings and A1 object maps
must survive integration. The checked-in public predecessor package and all its
adjacent resources remain untouched and complete. After integration, provenance
comparison must use that package's original build-source tree, not falsely require
old copied resources to equal a newly consolidated main prelude. New clean public
build, source-bound i32 override checks, resource hashes and successor pin remain
separate gates. This review neither applies a partial type/ABI closure nor validates
pending constructor/nominal/function-signature fixes.

### Incoming CLI byte-budget fixture

`scaffolding/tests/driver_unit_budget.tower` was read in full from the coordinator's
additional source snapshots. SHA-256 is
`634777b72bdd62b06b61aef0ebf955da1e3417600d01868c45666a7a7c3fd630`;
the delivery receipt identifies L2 clone HEAD
`0817375496d2dd6841107c1b91133058eaf12f8d` with possible uncommitted handoffs,
not a committed B2 implementation identity. B2 owns the driver contract and D1
owns generic registration. This is the seventeenth incoming review, separate
from98local tracked-path reviews and runtime acceptance.

The fixture borrows stack argument arrays and literal text through synchronous
`driver_parse`, then disposes each options object before reuse. It checks the
default retained-byte policy, explicit65536-byte policy with one extra unit,
missing value, six malformed/overflow values, and unchanged valid/invalid jobs
parsing. No compiler world, work queue, lease or payload mutation is constructed
by this CLI-only test. It verifies option identity and diagnostics, not actual
snapshot memory admission, allocation rollback or threaded execution; those are
covered separately by the owner's frontend-unit fixtures. The local driver lacks
the new option fields, so the draft is not applied or compiled against a partial
API closure. Existing D2 compiler-job plumbing remains a distinct policy from
this retained-source byte limit.

### Existing tooling fixtures and benchmark outputs validated

Frozen clean source4540a0841ea67dea65a006d35f4450f35deea065,
scaffolding tree421342a1a6b8a9d4427b9715dc25dd70faab9123; compiler/library/type
production sources still match60741c5. The original public pin9653f818 and every
listed public resource passed SHA256SUMS verification. D2's existing own guest
host object is`f74001da316e6d14af4f699033e8239ee70a3f597ce442675c63737f225459ff`.
No compiler rebuild, private bootstrap override or source change was needed.

| Existing caller fixture / SHA-256 | World/storage/ownership and result |
| --- | --- |
| `scaffolding/tests/tool_files_checks.tower` — `fa1187967fd0abfd9797967ee56d5f8bf166ceb636488c1dc2e9dabad63d5609` | D1-owned, full source read. Fresh isolated filesystem tree, lexical deferred ownership of path/data/name vectors; local aliases remain valid until replacement. Real bounded reads preserve old destination on rejection. Symlink-follow/traversal policy and atomic publication collision cases check both candidate and existing destination. Serial filesystem side effects need no compiler world or worker queue. PASS through documented public compile/link with own guest object; no hardlink/racing-path coverage inferred. |
| `scaffolding/tests/tool_words_checks.tower` — `fd486c019b561c4f4a2b67e54303769892f1f7c0a6a8e904fe0c6f29eb6557c3` | D1-owned, full source read. Local owned word/buffer vectors close after synchronous capture; borrowed argv stays live until child reap. Exact literal oracles test shell/Make parsing, malformed inputs, preservation on failure, actual Clang diagnostics and bounded cyclic response expansion. Scratch response file is removed on exit within a new owned cwd. PASS without optional real-build arguments; real WASI Ninja/linker integration remains separate. No command string is executed as a shell program by the parser under test. |

Same SteamDeck image/affinity as above, jobs1, Linux x64; one sample per command,
warm filesystem/fresh process. Exact GNUtime commands, stdout/stderr, raw statuses
and input hashes are in`build/d2_ecs/tool_validation_4540a08`. Files/words compile
wall4.66/5.78s, CPU4.53/5.66s, RSS188864/310592KiB. Links wall0.04/0.02s,
CPU0.03/0.01s,RSS50912/51012KiB. Runs wall<0.01/0.04s,CPU<0.01/0.02s,
RSS1608/73176KiB. All raw statuses0 and swaps0. Word-run RSS includes its real
Clang child; this is not retained Tower allocation or whole-lifetime leak evidence.

Four unchanged benchmark sources also pass graph/fast/native byte-equal stdout
with explicit jobs1 and default optimization. Branch-1426, calls4501500 and
memory49995000 match independent algebraic results; memory is9999*10000/2.
Arithmetic49995064 is differential evidence only. No new reference implementation
or alternate interpreter was introduced. Per-mode diagnostic samples are:

| Fixture | Graph wall / CPU / RSS | Fast wall / CPU / RSS | Native compile+link wall / CPU / RSS |
| --- | --- | --- | --- |
| branch |1.10s /1.02s /104012KiB|0.68s /0.65s /114040KiB|1.18s /1.12s /113308KiB|
| calls |1.09s /1.02s /104104KiB|1.04s /0.98s /113832KiB|2.11s /2.00s /111012KiB|
| memory |0.84s /0.79s /104308KiB|0.70s /0.66s /115012KiB|1.82s /1.72s /113180KiB|
| arithmetic |0.86s /0.79s /104164KiB|1.04s /0.98s /113880KiB|1.24s /1.18s /112408KiB|

Native execution is below GNUtime's0.01s reporting resolution, RSS1484–1612KiB.
These one-sample correctness checks do not establish throughput differences,
speedup, cold-cache behavior or useful multicore scaling. CLI phase logs remain
available. No source or runtime was changed, so before/after optimization claims
would be inappropriate. All jobs drained before the D2 lock was released;
140GiB disk free,9.8GiB RAM available,5.9GiB host swap used at final observation,
with zero swaps reported by the measured processes. These checks do not validate
the incoming capture/snapshot, prelude, budget or hardlink-helper changes.

### Coherent integration and affected D2 source review

Merge43f2354 retains incoming owner checkpoint0817375 and all earlier D2 work.
Followup a3dbf2a applies the required continuation, paired input-role ABI,
lowering receipt, lifecycle, parser/formatter replacements and approved D1
fixture updates. It preserves both journals and the newer D2 sanitizer source
column. Plain pull/rebase tried to flatten the merge; its uncommitted attempt
was aborted, then `git pull --rebase=merges --autostash` completed with the same
HEAD/tree and0817375 still reachable. No source work was discarded. Runtime
results above retain their earlier source identities.

Two assigned tool modules changed through owner integration:

| Path / integrated SHA-256 | Review and disposition |
| --- | --- |
| `scaffolding/tools/tool_files_posix.tower` — `dfb5eaec963944eadbf711d4ef76ab8c950009aa634fc85320e4e023fcb50fd5` | A2's previously reviewed identity handoff is now integrated. Two fixed stack statx buffers, explicit Linux device/inode fields and required inode-valid mask reject same inode through hardlinks/symlinks. Only ENOENT permits a new output; no path-race guarantee. No heap storage/world/scheduler added. Actual local runtime validation of these new bytes remains pending; earlier tool_files_checks used the old helper. build_tools' comment now matches the shared helper, without changing builder logic. |
| `scaffolding/tools/compiler_project_files.tower` — `fe687948292be4eb2263f0268989604bdf6365aaca29c78d2f71de6f2262e236` | L2 removes enumeration of deleted type forwarders; root types.tower and foundation_syntax remain included. A1 maps the new frontend-unit/query-check objects to their exact existing Tower sources, consistent with CMake INTERFACE objects. Owned buffers, synchronous resource traversal and lexical module identity remain unchanged. This is package-source mapping, not another authoritative graph. Browser/compiler-generation packaging and exact new resource closure require fresh validation. |

Parser replacement initially failed its reverse check because the checkpoint had
two additional defining-type imports. Read-only postimage comparisons verified
the exact old source after removing only those imports; the successor restores
them. Formatter replacement omitted an existing parser_main resource argument;
its exact prior caller hunk was retained and all three callers were checked.
The coordinator acknowledged that handoff correction. Four authorized EOF-only
repairs plus one stray journal CR make the default whole-base whitespace check
pass; earlier failures remain recorded.

The source-defined prelude removes14forwarders, while the public predecessor's
complete resources remain untouched. Both CMake configure_file and the native
wrapper's recursive copy can retain stale output files. Final clean validation
therefore needs a new cache **and** a fresh relocated build/native destination;
preserve the old owned package as evidence before the wrapper recreates it.
The current source integration still lacks final runtime/instrumentation/browser/
generation/hosted evidence and is not publication readiness.

### Coherent clean-build receipt

At f13c8f6916ee86fa3381291f6a508d9775176bd1 (scaffolding92ac1f33),
the public predecessor produced a fresh53step native compiler in250.64s wall,
245.03s CPU and786524KiB peakRSS,0swaps, raw0. Explicit outer/compiler jobs1;
same private Docker/LLVM19.1.1 and two-core affinity described above. This is one
empty-build-cache sample, not a same-input before/after performance comparison.
Smallest changed tool_files_posix and corrected frontend_main objects also pass
(5.90s/184224KiB and12.14s/347848KiB respectively). Runtime checks remain separate.

Compiler4736a486e6337065a52ba78be2a993348af84ca5b234899228fd94156c6b3a5f and
all42resources match between fresh cache and relocated build/native. Both omit
the entire deleted types directory; the five root language/type files equal
current scaffolding. Old inactive package is preserved in D2 build artifacts,
public bootstrap resources unchanged. This closes stale-forwarder packaging for
this native build only; browser/compiler-generation packaging is still pending.
Exact commands, raw exits, source hashes and measurements are retained under
build/d2_ecs/coherent_f13c8f6; no full-suite, sanitizer or hosted result is implied.

Incoming fixture changes after that freeze are explicitly separate: L2's
retained-runtime reachability oracle and B2's shared focused overlap helper and
editor-language imports. B1's corrected six-path formatter handoff already
matches integrated bytes. These are owner-authored tests, not new D2 tool logic;
D1 maintains their direct-scope audit and generic registration. D2 checked the
overlap helper preserves reference objects, budget accounting, actual barriers,
drain ordering and the30s deadline before adopting it. Local runtime is pending.
