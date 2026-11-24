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

### Independent arithmetic benchmark oracle

The earlier arithmetic result49995064 was explicitly only differential evidence.
A subsequent mathematical derivation supplies an independent oracle without
executing another implementation of the same recurrence. Write s(n) for the
value after n iterations and r(k)=s(4k) modulo32. XOR17 changes only the low five
bits. The XOR1 adjustments over four steps are +1,+1,-1,-1; their sum is zero.
Modulo32 the four XOR16 adjustments also sum to zero, hence
`r(k) = (8*k*k - 2*k) mod32`. Immediately before each XOR, the four low-five-bit
values in block k are, modulo32:

`8*k*k+2*k`, `8*k*k+6*k+18`, `8*k*k+10*k+5`, `8*k*k+14*k+23`.

Let h(k) count these four residues which are at least16. The actual integer
adjustment to the triangular sum in that block is `64-32*h(k)`. For k=0..15,
the residue counts are:

| k |0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| h(k) |2|1|3|0|0|3|1|2|2|3|1|4|4|1|3|2|

The residues repeat every16blocks (64iterations); those16counts sum32, so a
complete period contributes zero adjustment. Since10000=156*64+16, the final
four blocks contribute0+32-32+64=64. Thus the independent expected result is
`10000*9999/2+64 = 49995064`, with no u32 overflow on this input. This agrees
with all three preserved4540a08/public-pin execution results; it does not create
a new current-compiler execution receipt.

The same derivation gives the unexecuted profile fixture's expected i32 result:
500000=7812*64+32, remaining eight blocks contribute128, so
`(500000*499999/2+128) mod2^32 = 445698544`. This uses Tower's wrapping integer
contract; the final bit pattern is positive. Runtime confirmation for that
500000iteration fixture remains pending. This is documentation/independent
reasoning only, so new runtime performance or memory measurements do not apply.

### Current closure validation at a22499d

Public-pin native/focused builds pass on scaffolding33efdae1, compiler15600fe0,
runner6bceafc5. Five smallest source-proof/evaluation/LR/type/stage units pass.
The reused native cache rebuilt53steps in274.18wall/268.10CPU/782048KiB;
nine focused steps26.97/26.45/255104. All42resources equal the preservedf13
package. This is incremental evidence, not another fresh-cache build.

| Normal check | Wall / CPU / peakRSS | Result and limit |
| --- | --- | --- |
| tool-output-identity |0.18s /0.16s /1612KiB|PASS current A2 hardlink/symlink identity helper; prior old-helper gap closed for this fixture. No path-race guarantee.|
| concurrent-stage |0.09 /0.09 /2092|PASS160trials,57792finalizers, exact store teardown; normal production allocator, not sanitizer coverage.|
| query-smoke |0.20 /0.21 /61420|PASS existing1/4worker32/64bit query cases; newer source-proof successor unintegrated.|
| control-smoke |88.02 /95.44 /255664|PASS execution/canonical reparse/cleanup/ordered errors.|
| backend-overlap |20.35 /28.67 /480432|PASS independent serial objects, byte equality, shared budget, distinct-thread barrier; smaller scope than full backend, not a speedup comparison.|
| type-smoke |116.23 /123.09 /213804|FAIL134/signal6; buffered diagnostic lost.|
| same type-smoke with line buffering |113.56 /120.91 /224288|FAIL134; generic capture diagnostic violates lifecycle expectation. No test/deadline change.|

All process swap counts0. Exact EarlyCapture .tower reproduction independently
returns the wrong generic capture diagnostic (expected initialization-order text)
in5.66wall/5.47CPU/168596KiB, exit1. It also points at bedrock:1:1. The complete
input/hash/log and original/repeated failures are retained in
build/d2_ecs/current_a22499d; root/A1 notified. D1 owns the shared puts/abort
diagnostic buffering boundary; no competing harness edit.

Build-iteration review found unchanged common-input timestamps reset by the
required merge-preserving pull. A guarded fast-forward-only pull preserved both
history and mtimes; actual Ninja then reports no work in0.07wall/0.04CPU/17500KiB.
This is a validated no-op, not a measured53step saving. Dry-run's phony glob
regeneration prevents an exact dirty-object explanation here; the hypothesis
and limitations are recorded in the journal with primary Git sources. No
dependency suppression, output touching or generic build implementation change.
Current paired compiler profiles, full instrumentation and release gates remain
open. All owned jobs drained before D1 received the next host slot.

### Subsequent measurement-source handoff review

D1 parser_retention_validated patch19da2e17 updates the already-reviewed
`scaffolding/tests/parser_benchmark.tower`. Its private page index enumerates
every actual component owner, including full pages detached from free pools;
checks each page's live count/type/layout/capacity; and accounts requested/live/
unused bytes independently of RSS. It uses an explicit world with serial counter
transport. Scratch census runs outside parse timing; unchanged warmup5 and exact
session/world teardown prevent hiding accumulated ownership. Cache revision and
compiled-version pointers remain stable. The page bound is deliberately loose,
not packed-storage or low-fragmentation evidence. Adopted exact owner patch;
D1's normal/stress passes and original134 keep their own provenance. D2 runtime
and the owner's actual ASan gate remain pending, with no multicore claim.

B2's shared differential/C fixture prefix was reviewed, briefly adopted in
9aa4a43, then exactly reversed without execution after D1/root identified newer
explicit Foundation caller repairs missing from this handoff. Those owner fixes
must be reconciled directly; no blanket prefix or language-detection heuristic.
The overlapping measurement-kernel hunk was never applied because D2 already
has a validated explicit Foundation import. Its source/language/oracles stay
unchanged. Missing per-fixture language repairs remain pending here. Driver
lexical path normalization is B2-owned; D2 checked that request paths outlive
worlds and per-unit names are copied into owned module state before local disposal.

### Subsequent owner handoff updates at5d4a665

The exact D1 per-fixture Foundation repairsfd0966b3/6b575c81 are now integrated;
the preceding pending-language note describes the earlier handoff only. Numeric
and diagnostic oracles are unchanged. Failure-only assertion flushcb26ef0b
retains abort/nonzero and adds no successful-path work; D1's three paired helper
checks and identical successful helper bytes are owner evidence. D1's subsequent
parser ASan receipt at4635241 covers actual26direct objects plus four memory
archive members, three normal/three stress runs and exact teardown. Its measured
stress RSS reduction with smaller quarantine is attribution only; default-mode
samples remain the acceptance evidence. Neither receipt validates D2's newer
backend inputs automatically.

Incoming `scaffolding/tests/semantic_layout_profile.tower` is reviewed as A1
v2 source SHA dc299e613dc2df5648bb51af82133e74e6f6c38dab7f67ba3eb2bfd5d152dee3,
191lines, superseding the owner's older185line version. It constructs an explicit
world, synchronized shared budget and11dependent layout tasks; the observer
writes per-job component spans around the real production kernel. Discovery
precedes timing. Exact size/alignment/field-offset oracles, task completion,
post-join budget counts and world/budget teardown check results and ownership.
Two warmups and three reported samples cover32/512/2048/4096/8192fields, serial,
requested4workers and an occupied-budget case. Overlapping measured intervals
establish simultaneous execution when observed; requested4 alone does not.
RSS is a cumulative process high-water mark; retained bytes count layout-vector
capacity only, excluding other world storage. Thread/clock/rusage bindings are
Linux64 ABI boundaries, not portable-host evidence. Owned observer records are
read after drain; no alias guarantees are inferred. The fixed8element branch
array matches the named8branch limit. D1 owns opt-in registration; D2 source and
runtime adoption remain pending. A1's separate experimental scheduler tuning is
not part of this harmless export/measurement handoff. This is D2's first full
receipt for this incoming path, bringing supplemental incoming reviews from17
to18; D1's earlier185line review is its own evidence, not D2 coverage.

### Current paired compiler profiles,5d4a665 versusa22499d

Frozen compilerSHA50f58954 versus preserved15600fe0; same42resource bytes and
identical once-compiled runtime IR. Exact existing16/1000function Tower inputs
and15/999oracles, x86_64-unknown-linux-gnu, explicit grammar paths, object output,
separate link, --timings and --jobs1/2. Linux Docker image4be584fb, LLVM19.1.1,
physical CPU affinity0,2; one owned heavy job. One warmup plus three retained
fresh-process/warm-filesystem samples per combination; compiler and worker order
alternate. No OS-cold claim. Actual docker exec UID0 (Config.User empty), host
controllerUID1000; both compilers use the same environment. The earlier assumed
UID1000 container setting was not established by configuration. No permission or
governor changes. All32executables pass exact output; repeated and serial/parallel
objects match within each compiler. All process swap counts0, input/source hashes
unchanged. Session27463 terminates0 and all children drain.

| Input/compiler/workers | Median wall s (range) | Median CPU s | Median peak RSS KiB |
| --- | --- | --- | --- |
| small/a224/1 |2.13 (2.10–5.18)|2.11|176812|
| small/current/1 |3.38 (2.10–4.47)|3.29|176264|
| small/a224/2 |3.64 (3.42–3.66)|4.02|187520|
| small/current/2 |3.51 (3.23–3.58)|4.14|188164|
| large/a224/1 |2.42 (2.41–3.35)|2.39|202420|
| large/current/1 |2.42 (2.40–3.00)|2.39|202372|
| large/a224/2 |4.05 (3.86–4.06)|4.58|214520|
| large/current/2 |3.88 (3.43–4.46)|4.52|215096|

Two workers provide no useful speedup on these inputs and increase CPU/memory.
Small serial variance is substantial; its median difference alone cannot
establish a regression. Powersave governor and differing instantaneous CPU
frequencies were observed, with low CPU pressure and zero memory pressure;
these are potential contributors, not a measured causal attribution. Current
large serial combined parse/check median2.065s versus predecessor2.064s dominates
execution; LLVM lowering/optimization is much shorter. No worker-idle/critical-
path trace or allocation census is exposed by this ordinary CLI timing path.
Raw phase/time/context-switch/resource/output artifacts are retained under
build/d2_ecs/current_f89bfc9/paired_profiles. A host observation write there failed
because Docker-created files are root-owned; the explicit retry saved to its
host-owned parent, preserving the original transport error. Compiler samples
were unaffected. Prior independently authored Clang/GCC comparison retains its
own earlier source/host receipt; it is not new execution or a competitiveness
claim for this compiler. Backend-root fixture validation remains separate.

Current backend-root fixture source is reviewed at5d4a665 by its B2/D1 owners;
D2 independently exercises the compiler boundary. Graph/fast/raw native/optimized
native all produce45and2. Both native symbol tables retain the exported function.
Canonical Foundation retains unused_type and reparses to the same output in
0.44wall/.42CPU/104560KiB. Predecessor raw LLVM has eight definitions (including
signed_integer, unsigned_integer and unused_type); current has the five executable
entry/direct/callback/recursive/export definitions. Raw file bytes8885→6416
include different ModuleID output paths, so the difference is not an exact
normalized payload saving. Predecessor raw-native output also passes in
3.71wall/3.66CPU/174904KiB; this single observation versus current2.99s is
correctness evidence, not a statistical speedup claim. All children drain and
D2 releases the shared slot to D1 before changing further production inputs.

### Incoming type reachability microprofile and portability hold

Nineteenth supplemental incoming measurement path:
`scaffolding/tests/type_reachability_profile.tower`, L2 source
SHA05a442e8180ba30a35c0ee6d1b923259f6726215d0fbd5e1c22dac0dfa723e77,
read with L1 selector518918fa and current execution-support/build callers at
9ae2b39. Local source/output buffers and ExecutionSession own their storage;
exported parameter-dependent fanout retains16/256/1000real calls. Independent
output count checks run before timing. Three samples of256serial shared
reachability queries must retain no additional entities/components, and exact
canonical text remains unchanged. Existing execution_close_checked verifies
single-root release, cleared interpreter/output storage and repeat-close safety.
Formatter/default-kind helpers remain the existing host-session compatibility
boundary; store counts derive from the actual program's world. It does not
create another authoritative graph or scheduler.

Query timing excludes compile/execution/formatting; RSS is whole-process peak
including those earlier stages. Entity/component equality does not measure all
transient allocations or retained vector capacity. No parallel scaling or
sanitizer claim. D1 independently found that the proposed unconditional selector
import leaks a Linux getrusage ABI into the cross-platform execution runner;
D2 confirms TowerExecutionTests has no Linux64 admission guard. sizeof(usize)==8
alone does not establish that ABI, and a runtime selector does not remove an
unresolved foreign symbol at link time. Hold source/selector adoption pending
an explicit owner-approved Linux64 opt-in target or portable measurement
boundary. No stub, silent skip or competing generic manifest is introduced.
This is source/caller review; new D2 runtime measurements do not apply yet.

### Existing staged workload producers selected for the next measurement slot

Four additional D1-owned caller receipts at9ae2b39 (no edits):
`scaffolding/tests/stress/workers.tower`, `generic_workers.tower`, `window.tower`
and `type_fields.tower` in the same directory. Each complete three-line wrapper
imports Tower and the already-audited shared stress_sources, then synchronously
calls stress_emit with its typed function value. The shared helper owns and
closes the sole contiguous ByteBuffer, checks the65536byte output bound and
exact write; wrappers introduce no world, scheduler or retained graph. Existing
browser compiler-threads tests provide exact independent output oracles and
serial/parallel canonical comparisons; they are historical caller contracts,
not newly executed browser evidence.

Workers16 exercises decltype, staged generic calls, lexical defers and untaken
invalid dependencies: expected504,7,42,42,0,136,-120,-2147483648. Each returned
f(i) is9+3i (return captured before the outer defer); sum over0..15 is504.
Generic16 similarly returns9+3i for both signed32/unsigned64 and checks array
sizes28/36 plus record73. Window260 sums1..260=33930, exceeding one body batch.
Type-fields256 contains explicit independent layout/value predicates and prints
zero failures. These reuse existing Tower-generated inputs rather than adding
another generator or JS measurement logic. They extend six supplemental caller
reviews (previous two tool fixtures plus these four), separate from98original
local reviews and19incoming measurement reviews. Current native/paired staged
execution is queued after D1's owned slot; no pass or scaling claim yet.

L2's subsequent standalone profile SHA9f1c96574312e3fea1d6f018dd248b03d5583b56fbc57129048bd6c1e9bd3a0a
preserves the exact workload and adds the existing execution runner's explicit
resource setup/main. D2 reviewed the complete delta: path outlives borrowed
options, request/grammar diagnostics close before path disposal, and the legacy
host-world binding remains confined to that setup. Explicit time/usage structure
size checks supplement width8; only a Linux64 build-target guard establishes the
foreign ABI. It must link the existing production driver composition (including
paths/stat providers) with compiler units; the earlier generic selector must
remain absent. D1 owns that opt-in target. This supersedes the helper-only source
review for the same incoming path, not an extra coverage count or runtime pass.

### Staged workload and capture successor receipt, 3f49d4a

Reviewed/compiled source is scaffolding tree1eeae3489c5603963786744d87cd448c1397e039,
publicpin9653f818, current compiler c56400b17293457b7ed13927bc1b6b9af1c3e674ab0bcb4f1a939a36458988f2.
The preceding5d4 compiler50f58954 and current compiler use byte-identical42-file
runtime resources. Docker tower_build image4be584fb, LLVM19.1.1,
x86_64-unknown-linux-gnu, CPUs0/2, explicit jobs1/2, no quota; container UID0.
Each existing workers16/window260 Tower producer is generated once with the
public compiler. Inputs/oracles are hashed. Both compilers receive identical
sources and runtime object, alternating order, one warmup plus three retained
fresh-process/warm-filesystem samples. GNU time records compiler-only wall,
user+system CPU and peak RSS; link/execute are separate checked commands.

| Input/compiler/jobs | Median wall (range), seconds | Median CPU seconds | Median RSS KiB |
| --- | ---: | ---: | ---: |
| workers/before/1 |2.17 (2.14–3.21)|2.15|177952|
| workers/current/1 |2.19 (2.14–4.14)|2.17|177612|
| workers/before/2 |3.52 (3.27–3.64)|4.00|191028|
| workers/current/2 |3.33 (3.27–3.43)|3.77|190076|
| window/before/1 |2.61 (2.31–2.64)|2.57|197772|
| window/current/1 |2.34 (2.30–2.53)|2.31|198160|
| window/before/2 |3.77 (3.20–3.92)|4.44|210932|
| window/current/2 |4.01 (3.74–4.09)|4.64|211344|

All32 output checks pass, including the independent staged/defer arithmetic
oracles described above. Repeated, serial/parallel and cross-version objects
are byte-identical. Current canonical Foundation bytes match at jobs1/2, and
both reparse/execute to the original output (workers1.22wall/1.18CPU/139200KiB;
window0.96/0.94/165780). All measured process swaps are zero; source/input
manifests remain unchanged. Logs: build/d2_ecs/capture_v3_3f49d4a.

Two workers are slower and consume more CPU/RSS for both inputs; capacity is
not profitable scaling. Current combined frontend parse/check median is
1.943/2.983seconds for workers1/2 and2.046/3.441 for window1/2, dominating
the compilation. The CLI does not independently attribute parser/checker
contention or worker idle time. Window two-worker median wall grows about6%
against predecessor, CPU about4.5%, with overlapping wall ranges. Three samples
and variable powersave frequency do not isolate capture policy from the
co-integrated editor/path/layout changes. Serial window is faster in this small
sample; neither observation establishes a general improvement/regression.
Current window RSS grows388KiB serial/412KiB parallel; no excessive peak
growth appears here, but this is not live allocation/retention accounting for
the eager per-initializer capture records. Owner profiling remains necessary.

Current public-pin incremental build, actual source-proof query-smoke, request
ownership/fault sweep and editor1/2/4/8 pass. The full lifecycle gate does not:
both global and local aggregate positive probes reject runtime storage, while
two existing known-binding address negatives falsely succeed. Exact unmodified
source literals from known_binding_checks.tower produce32 andfalse, rawexit0,
where rejection is required. The independent rejection checker exits1 and
preserves raw statuses. Address2.95wall/2.92CPU/171472KiB; comparison2.36/2.34/
168228; no swaps. A1 owns capture effect/relocation policy, L1 aggregate consumer
materialization. No expected-result weakening or inferred-capability workaround.

All owned sessions terminated and children drained before the D2 heavy lock
was released to D1. Complete current package preserved at
build/d2_ecs/native_package_3f49d4a with recursive byte comparison. External
D2/staged_capture_v3_receipt/logs.tgz contains344 listed members,
SHAba999db3c1f904877ad7728e5b3d16b01f6320b56af1e9e96783ca9e7f447796.
Current full type-smoke, ASan/TSan, fresh clean/public build, browser/generation
and publication remain open. No source-specific historical pass closes them.

### Reviewed owner measurement and harness integration after 8202eb4

The coordinator7ac checkpoint is merged by ancestry, preserving all newer local
tools/build changes. The sole conflict in execution_main is resolved with its
source-rejection reachability check preserved and the obsolete Linux-profile
selector absent. The original98-path audit and19 incoming measurement reviews
remain historical coverage sets, not a sum of disjoint current paths. The two
previously reviewed incoming measurement files are now checked in:

| Path and exact reviewed source | Ownership/storage/scheduling conclusion | Disposition |
| --- | --- | --- |
| scaffolding/tests/type_reachability_profile.tower,9f1c9657 |153-line standalone L2 successor; ordinary execution session owns the checked graph, buffer/format ownership closes lexically, source and query phases are distinct. Explicit world store counts, serial read-only shared reachability, no second graph/scheduler. Linux x64 rusage144-byte ABI; RSS includes setup and counts omit transient buffers.|D1-gated existing execution link closure adopted, opt-in/no CTest. Current local build/run pending; older shared-selector evidence is source-specific.|
| scaffolding/tests/semantic_layout_profile.tower,dc299e61 |191-line A1 fixture reviewed completely. One explicit world and synchronized shared budget;11 jobs over a two-link dependency plus8branches use existing layout pump/kernel. Per-job observation component is private to that job, frozen setup and post-join span traversal. Offsets/layout independently checked; context/program/root/world/budget/signal close in ownership order. Pointer/job vectors are derived indexes, not packed node payload. |D1 existing worker link closure adopted, opt-in/Linux x64. D1 actual33 reported trials pass but all requested4-lane cases had peak1/caller11; not a speedup. D2 runtime still pending.|

Read D1 native_roots_registration1c4c5e8a completely: existing
driver_differentials.tower owns temporary source/path buffers, snapshots the
exact fixture into its existing isolated child directory, independently checks
45,2 before both native optimization variants, and retains child exit/deadline
behavior. It adds no generator, scheduler or alternate fixture language.
B2 backend_execution_roots fixture was already directly validated at5d4; newly
registered execution still needs its own build/run. No duplicate source helper.

Reviewed B1 registry64d55417 and both parser/storage callers: explicit Foundation
import matches immutable per-file seed; a private module provider lives through
compilation and is destroyed before original entity/component census. Neither
caller borrows the driver's cache for this fixture. The named parser benchmark
extents reuse existing BenchmarkCacheCapacity64, preserving previous successful
per-page counts/flush/oracles; no algorithm or retention policy changes.

Reviewed B2 hover dffdad44 plus5f43191c: checked Foundation KTypeConstruct uses
the existing nominal operation tag and shared descriptions; dependent preview
retains its existing generic protocol boundary. Borrowed descriptions require
no new world or allocation. Exact-token editor tests preserve ordinary parameter
and function identity and cover integer/floating/pointer/array constructors.
Array text does not impose a blanket compile-time-only count contract. These
owner fixes are integrated after the source freeze; previous editor-observation
passes do not validate the changed editor_world hover fixtures.

The separate104-line backend_execution_index db1807dd is fully reviewed:
one explicit frontend batch owns frozen source/program, a disposable byte map
and mismatched caller vector are derived only, canonical graph unchanged,
single-owner allocation failure injection resets before cleanup, and final
buffer census checks complete teardown. Its direct lowering implementation
import risks duplicate production exports at registration; B2/D1 own the scoped
link boundary and selector. Keep this draft unregistered/unadopted until that
handoff, not a silent skip or test pass.

### Independent joint checkpoint and measured-stage handoff

At reviewed source9ca5be6, all11 smallest public-predecessor units, canonical
native build and focused targets pass. Source-specific runtime: both original
address-derived negatives reject1 with actionable relocation diagnostics;
global/local aggregates produce7,8/15; full storage reset and exact-token hover
pass. Compiler489761dd and complete resources are preserved separately for
paired measurements. Detailed commands/identities/times are in the journal and
build/d2_ecs/joint_aggregate; no full lifecycle or sanitizer pass is inferred.

The two opt-in measurement paths reviewed above now have independent D2
execution evidence: type_reachability_profile9f1c9657 produces all9 checked
rows (11.00wall/11.35CPU/215768KiB), semantic_layout_profiledc299e61 completes
its two warmups and three retained samples per configuration
(2.33wall/2.24CPU/94920KiB). Process peak RSS includes setup and earlier trials;
stable entity/component counts do not census every temporary buffer.
Actual span overlap, caller work and ledger observations remain necessary;
a requested4-lane configuration alone proves no overlap or speedup.

Integration review after this freeze includes owner A2 stage452cfa58 and B1
tracea2618c72, plus their existing test consumers. They are outside D2 production
ownership and were applied only through coordinator-approved exact handoffs.
Stage publication now avoids redundant derived table reservations when an
append-only lease did not change membership; stable sparse payload identity,
leases and queued reference lifetime remain explicit. This does not turn an
archetype index into packed payload storage. The preserved before package and
existing frozen16/1000-function inputs will supply independent paired timings.
Owner results are supporting evidence, not a D2 measurement.

Trace output is an OS presentation boundary over canonical formatter bytes;
explicit vector length fixes that boundary without another graph/formatter.
Serial allocation-failure checks remain confined to serial consumers. Test-only
aggregate corrections ef0147df/25e8f5ab retain original semantic/lifetime
assertions, and D1 registrations reuse the existing runners. No new D2
benchmark/helper path or alternate scheduler was added in this integration.
Full current-source instrumentation/browser/generation/publication remain open.

### CURRENT remaining scope at 83ca8a6 (2026-11-22)

This supersedes historical “missing helper” and pre-handoff gap statements,
without removing their evidence. Production helper readiness is implemented.
Exact current primary census is40/40 substantively reviewed:33tools+7benchmarks.
The three additions since the initial37 are instrument_llvm,
compiler_wide_functions and compiler_reference_inputs; current primary sources
have no changes since the reviewed3f49 snapshot. Provenance-only bootstrap
census remains45/45. Original expanded local review set98/98, supplemental
caller set6/6 and incoming measurement set19/19 are separately complete for
their recorded snapshots; they overlap subsequent integrations and must not be
summed. No known newly added primary or measurement body awaits source review.
Future owner handoffs still require delta review; source coverage is not test
coverage.

| Requirement and exact locus | Current classification and next concrete work |
| --- | --- |
| Build iteration: tools/build_tools.tower build_tool; cmake/TowerRuntime.cmake and guest/backend/utility callers | Implemented+measured: explicit positive compiler budget/default1, real invalid-budget rejection and equivalent object/executable checks. Guarded merge-preserving no-op pulls retain mtimes. These solve measured nested admission/rebuild costs; current merged release build must retain those contracts. No speculative selected-tool cache introduced. |
| World/storage/locality: tools/compiler_project_files.tower compiler_project_file/unit; compiler_project_package.tower compiler_project_reactor; package_playground_assets.tower playground_asset_manifest | Source-reviewed explicit owners/stable records and derived indexes. Ordered filesystem/package publication remains serial by contract. End-to-end package allocation/peak retention and repeated reactor input loading remain unmeasured on current artifacts; measure actual final packaging before deciding on streaming/reuse. This is a measurement gap, not evidence of an ECS conversion requirement. A2 entity_locality owner snapshot distinguishes stable paged payloads from packed scan copies; not yet integrated/executed in D2. |
| Between/within-unit ready work: tests/frontend_units_profile.tower main/units_profile_event; compiler/semantic_layout.tower sem_layout_execute; tests/semantic_layout_profile.tower layout_profile_trial | Actual missing profitable scaling on measured Deck compilations: jobs2 remains slower than1. Latest layout33 retained trials ALL have overlap1/caller11, even requested4 with available lanes; existing sem_layout_execute admits once from initial narrow frontier and never refreshes the grant. A1 owns grant-refresh/grain correction; await exact measured handoff, then independently repeat checked span/idle/critical-path and small/large profiles. Existing backend barrier proves real overlap only, not speedup. |
| decltype/comptime: semantic_capture_work.tower sem_capture_pump/ranges; semantic_evaluation_work.tower semantic_evaluation_prepare_kernel; interpreter.tower ix_input_storage | Implemented and four original CLI regressions pass at9ca; corrected query/lifetime fixture and full42/policy12/aggregate32/64,1/2/4/8/canonical matrices remain unvalidated here. Run those existing selectors after public-pin compilation. No second evaluator/IR/ambient type registry. Eager capture component and private snapshot allocation/retention census remains incomplete; component-count/RSS observations do not close it. |
| Failure/cancellation/stale work: library/entity_stage.tower entity_stage_prepare/publish; tests/entity_stage_concurrent.tower stage_trial; tests/semantic_world.tower semantic_world_tests/semantic_stage_tests | Stage452 skip of unchanged membership implemented, not yet locally measured/validated. Run exact before4897/current comparison, tables and real concurrent finalizer/lease stress under normal/ASan/TSan. A1 owns semantic_world failure-path drain follow-up; preserve failures, await handoff and exercise early failure/cancel before releasing world/input storage. Existing work-pool cleanup passes are older-source evidence. |
| Tool process lifetime: tool_process_linux.tower tool_process_streams; tool_capture_linux.tower tool_capture_streams | Synchronous child reap before argv/output release is reviewed and existing valid/failing child checks pass. These tools deliberately have no asynchronous dependency scheduler; cancellation/deadline is external where required (verify_compiler GNU timeout). Do not claim universal signal/descriptor failure coverage. tool_output_distinct now has A2 statx device/inode checks including hard links; historical realpath-only limitation is superseded, concurrent path replacement remains caller-excluded. |
| Serial CPU/RSS/reference behavior: compiler_reference_inputs.tower; tests/driver_measure*.tower; stress/workers.tower and window.tower | Implemented+measured frozen independent C reference and staged workloads; Tower frontend cost and no2-worker benefit remain required performance issues. Next paired stage452 run uses unchanged16/1000 and workers/window inputs, fresh process, warmup+retained samples, CPU/RSS/output/object/canonical checks. CLI parse+check is combined; no invented separate checker idle figures. Need current-source allocation/retention evidence and representative import profile before broad performance closure. |
| Parser diagnostics/tooling: compiler/parser_integration.tower parser_set_debug_trace; parser_presentation.tower parser_trace_write; tests/parser_trace_failures.tower | Corrected tracea261 and serial-only fixture implemented but locally uncompiled/unrun. D1 parser selector enables focused normal/ASan validation without unrelated gates. B1 bounded fault-sweep follow-up pending; no actual infinite loop observed and no owner assertion weakened. New47-line fixture fully reviewed, owned by B1/D1 rather than added D2 primary scope. |
| Supported instrumentation: tools/instrument_llvm.tower main; cmake/TowerSanitizers.cmake tower_sanitizer_object; existing source/original/bound/IR receipt | LLVM19 native Linuxx64 ASan/TSan implemented and older actual Tower valid workloads passed. Current changed-source compiler/query/stage/parser instrumentation remains required; rebuild exact affected objects, verify manifest closure, run valid concurrency workloads. Historical sensitivity receipts are retained, deliberately unsafe probes will not repeat. Source-language UBSan and other host instrumentation are unsupported, explicitly not passed. |
| Canonical build/browser/publication: tools/bootstrap_comparison.tower, verify_compiler.tower, compiler_project_package.tower; playground README Checks | Latest clean public build is f13c8f6;9ca incremental public build passes. Final frozen/rebased compiler still needs clean canonical build, generations/relocation, actual native/browser/threads and asset checks, complete source/build provenance, coordinator lease, atomic main+Pages push and hosted manifest/behavior verification. No lease/request/pass yet. Public host launch lacks libLLVM19; supported Docker boundary is used. Own verified SDK34 archive is downloaded, not installed; LLVM/Binaryen/vendor/cross assets are absent. Coordinate final artifact responsibility before any duplicate large toolchain build, then validate the actual merged inputs rather than relabel old assets. |

Bounded trace follow-up323ae806 subsequently supersedes the pending-loop entry:
the serial fixture now uses measured successful allocation count, asserts every
failure prefix and mandatory terminal success, and preserves teardown. D2
source review complete; independent public-pin/native/ASan checks still open.

### D2 independent stage/trace/aggregate checkpoint at 1461866

Reviewed source14618665557d4091eed710bdda488811c1c07c5c, scaffolding tree
8fb09e71ab7809cf34568a6ea19fa408fff25cbe. The40primary tooling/benchmark
paths remain unchanged since their earlier receipts. This checkpoint updates
evidence, not the final completion classification. Public pin9653f818 was used
without private override in the isolated Deck Docker image4be584fb, LLVM19.1.1,
one build job/compiler job. Smallest changed units compile. Incremental native
6steps32.08wall/31.28CPU/292080KiB and focused10steps46.28/45.27/350876 pass.
Compiler598fabeddbac910bf529fcc6ff25272fa73b64c422c2117f118fba50037fb3c5
and complete resources are preserved in build/d2_ecs/native_package_1461866.
Of42resources,41match prior9ca exactly and entity_stage matches its new tracked
source. This is not a new clean-public or portable-release result.

Independent query-smoke passes32/64 serial/threaded (.20wall/.19CPU/59432KiB),
including corrected nested capture lifetime and exact immutable store/copy/fill
diagnostics. Bounded parser selector passes (.07/.06/51336); it separates real
valid trace from serial allocation-failure instrumentation. Aggregate-stages
passes53.54/60.06/338784, including whole-empty zero-projection capture and
global/local/nested/type/function/null cases, both engines32/64, canonical and
workers1/2/4/8. entity_tables standalone reports0. Three actual concurrent
stage runs each complete160trials and57792finalizers, retaining reserved access,
stable payload/table identity and publish/discard/cancel cleanup assertions.
Tool inode identity passes. These update the stage/trace/aggregate rows above;
current ASan/TSan, full42 and final release remain required.

Matched immutable package9ca/compiler489761dd versus146/compiler598fabed:
16/1000-function reference inputs and staged workers/window inputs, native
x86_64-unknown-linux-gnu, CPUs0,2, jobs1/2, fresh processes/warm filesystem,
one warmup plus three retained alternating-order samples. All64expected
outputs and repeated/cross-version/worker object identities pass. All16canonical
outputs agree per input; eight canonical reparses execute expected results.
Detailed samples/ranges and failures are in the journal and
build/d2_ecs/stage_publication_1461866. Two workers do not give useful speedup
on any measured current workload. Large serial's initial noisy+13% median was
investigated on CPU2 alone: one warmup plus five retained alternating pairs,
before/current medians2.43/2.36wall,2.40/2.34CPU,202324/202284KiB; all12objects
and expected999 executions match. No reproducible regression established;
no isolated general speedup claim. Powersave remains enabled, observed CPU2
frequency3.480–3.501GHz, zero child swaps; no affinity/frequency global change.

#### Incoming retained-buffer measurement and packaging review

Incoming measurement snapshot set is now20/20, separately from local40primary
and45bootstrap provenance. Reviewed all six API/test files in archive
71d28d31728d6792aeb65b2287bd4d86ce855cd46de610c56b65ac81f71ccc70 plus B2
memory helper07e634dd992246a171af426b7e26edf640fd71d5257cfa889277605300935df4;
these are source-only reviews, not local adoption/runtime acceptance.

| Path and reviewed SHA256 | Storage/world/scheduling/ownership and disposition |
| --- | --- |
| scaffolding/tests/work_buffer_profile.tower;16821eb3ee099d55e9f20904ede53fa8ee5521117ab2fc4927be6a8846e2ed6f | Explicit shared budget, WorkPool and worker-private buffers; real barrier/overlap measurement; baseline/budget modes alternate4/8KiB8192replacements, verify byte53/checksum and allocations8192+workers. Reports wall/CPU/RSS, retained payload, charged peak and ledger capacity. Timed region excludes pool/budget setup and postjoin checking/free. Byte-only grants isolate buffer accounting, not total nested lane budget; allocator-private overhead/RSS are not charged byte limits. Main requires baseline\|budget and worker arguments; D1 generic no-arg measure target cannot invoke it unchanged. Source accepted for owner joint testing; runtime/fault/performance and current successor deltas pending. |
| scaffolding/library/work_buffer.tower;ccc61ca8f363618fbdf55a71fb5f01442140bc8ab2f716017fc5371d53ce2412 | Physical buffer owns its reservation; replacement reserves full old+new overlap before allocation/copy; denial preserves prior owner, disposal frees before receipt release. Budget lifetime explicit; null budget is standalone contract. Move/swap transfer complete owner, ordinary copies are not ownership. No global/TLS substitute or authoritative graph. New owner followups must be reviewed before adoption. |
| scaffolding/library/work_vector.tower;7e95b16105e2158da458bc033dcbde2982ecd38f802be42d75c5fafd00f50c43 | Distinct typed vector preserves header/receipt, checks overflow/alignment, borrows transactional descriptor across resize. Ordinary vector free/realloc is invalid for this storage; borrowed iteration requires stable owner. Full source read; owner initialization/pop/push-result followups remain new snapshots, not silently included in v2 review. |
| scaffolding/tests/work_buffer.tower;e08c4c2f548e5b0731d46578776b6b3dc1c35946dc55c63c91d0132cedc9ca5 | Normal/denied/wrong-owner/overflow/growth/transfer/stale-receipt paths, exact retained bytes, typed257-element sum32896. Explicit disposal, no scheduler substitute; runtime pending A2/D1. |
| scaffolding/tests/work_buffer_shared.tower;8d5f8a5aa39b3e62692dd98e9e2be793d277a428a3da0ca33390376ec655bd15 | Four real workers/barrier with disjoint private owners and shared synchronized ledger; cancellation/denied growth keep storage charged after join until coordinator disposal. Joins do not retire reservations; no serial allocator hook in overlap. Runtime/current instrumentation pending. |
| scaffolding/tests/work_buffer_faults.tower;d2f6c72977ab76017e8d9fd406b0a0555957c36d6b12d6a950c345a7f98d53a0 | Serial injected ledger-growth/physical-allocation failures, transactional rollback and exact live allocation balance. This tests allocator failure ownership, not races. Must use existing serial/instrumented/trap composition without duplicate host_memory. |

Packaging caller audit at146: native CMakeLists85–93 CONFIGURE_DEPENDS globs
all library/*.tower; build-native copies its whole share directory. Browser
build.mjs33–41 lists/sorts all library files and builtins entries; Tower
compiler_project_sources recursively includes library with sorted names;
bootstrap_collect recursively hashes/packages adjacent share. Thus two new
top-level library resources require no hardcoded list edit. Existing runtime
host memory unit must supply both new size/alignment exports; source presence
alone does not prove linked/public resource closure. D1 registration and A2
joint runtime must verify exact helpers, then final native/browser/packages
must contain byte-identical new resources and preserve complete provenance.
Existing pin is immutable. Copying into an old populated share may preserve
stale removed resources; final package verification must compare exact sets,
as earlier type-consolidation receipts require. No speculative cleanup change.

#### Corrected raw initialization contract

The later journal/coordinator correction supersedes the earlier portable0,7,7
proposal: Foundation325–326 explicitly excludes raw uninitialized reads from
defined portable results;365–367 preserves source initialization order, and
struct-values-and-bindings28 permits raw uninitialized storage. Graph0 versus
LLVM-normalized7 for earlier=read(later) is investigated excluded-input evidence,
not a demonstrated compiler bug. No D2 production zero-initialization fix or
known-order v1/v2 adoption occurred. Preserve compile admission of the original,
strict demanded comptime(earlier) rejection, and use initialized state0 with
exactly-once read increment for portable1,1,7 output checks. D1 owns that test
update. Stronghold's future initialization policy is not imposed here.

#### Owner test alignment prepared after 58f1e309

Exact D1 storage13ef3fc8, defined known-order8ee87576 and browser9981111f
handoffs reviewed and integrated after D2 jobs drained. They change test
behavior, not production semantics; independent local compilation/runtime is
pending next Deck slot. Source checks do not inherit prior146 runtime credit.
Storage retains100resets, retained source pointer/text, explicit active grammar
declaration/statement order, fault recovery and final buffer checks.
body_runs_trial_output preserves default0 newline for all existing callers,
compares all requested bytes, retains whole program initialization and canonical
worker comparison. New known helper compares graph/fast target memory as well
as output/errors, reparses canonical, closes completed worlds before worker
runs, admits the raw original without executing it and retains strict demanded
earlier-read diagnostics at32/64 and workers1/2/4/8.

New owner fixture scaffolding/tests/comptime_capture_values.tower is reviewed:
it imports the unchanged original immutable capture fixture, checks input/result7
and reflected exacti32, prints failure count0. No storage or independent AST/
scheduler added; source/import identity and module lifetime stay with existing
compiler sessions. D1 predecessor rejected decltype directly in expression
position; matched its ordinary type-position Captured binding correction before
local build, preserving the original failure receipt/source proposal. Browser
transport uses the correct entry path in both Tower and LLVM so relative imports
resolve, updates three specific observed diagnostics, retains alias as negative
and does not alter already-correct threaded regex. Current actual browser/backend
execution still requires final assets. No false pass from source review.

#### Retained-buffer v3 integration and snapshot capacity measurement

Root supplied v3 archive3b03fc54a4d08e3b7913f29e8b9e2da563f385b54be88594343feb0f9388648e.
Reviewed every delta against six already-read v2 files and reread profile in
full. Integrated all six plus allocator helper07e634dd and exact D1 CMake
registration551edc40 after drain; no compiler caller migration yet. New local
source SHA: work_vector e59bd35405354bd1aa358502cb9d98f62c97bf02e75f799f9078e3535ca43a52,
work_buffer fixture7d2a2e8d1b61211fefe403a4be07aa2f1bdc1303395a3f49eb2869030c0a695a,
faults980b01bd1c92201023cbbf9f8b43e01f90164b0c333fe757220bc9bf034cb7a2,
profilec74c8ede4ef2358c1ebd38b90770fa22087441fee2e18b35f40be3623c6346be.
work_buffer library/shared fixture unchanged from their preceding exact rows.
No silently inherited runtime credit for the newer source.

work_vector adds explicit empty initialization, pop and status-returning push;
ordinary descriptor copies still do not transfer ownership. New tests verify
allocator size boundary,0–65byte alignment, denied1535-element capacity leaves
existing512capacity/257values, pop/push roundtrip and empty-pop output stability.
Fault fixture uses existing puts boundary, fixing D1's actual missing tower_print
link without a runtime shim. Profile now performs262144 total replacements,
preserves independent checksum/count/data assertions, same physical lifetime and
timing exclusions. D1 generic registration forwards optional arguments only for
opt-in measurement, supplies budget1, retains old no-argument profiles, exports
real shared/profile worker entry, and uses serial/trap fault composition without
duplicate host memory. README context differed from newer local layout prose;
initial check failed before changes. Reconciled only intended additions and
updated replacement count, preserving both owners' existing text.

Root reports v3 native/fault/ASan/TSan real-four-thread passes; actual WASI remains
pending. Its eight-worker shared-ledger resize stress is93.7ms versus15.6serial,
raw baseline8workers3.79ms: serious measured contention, not compiler speed.
Do not transfer every logical allocation into a global hot grant path blindly;
A2's proposed physical-chunk arena is not yet implementation/evidence here.
D2 modest1/2worker checked profile, current instrumented tests and actual caller
overhead/retention remain required. Source adoption is not acceptance closure.

| Additional incoming measurement path/snapshot | Full delta review and evidence limits |
| --- | --- |
| scaffolding/tests/interpreter_call_query.tower, source39366a255dc1924b8b740eb0b0f36882dc0bf87431d95cdebb1a44feebc974d7; handoff741b6cb425f11310211dd4853a1e9259b418091811c2eb3659e1cc6ba92c7cde | Existing explicit-world immutable snapshot query fixture now runs8/65536-byte layouts, second projection at finali32, interleaved independent invocations and nested frames. Samples invocation a's peak live snapshot bytes, memory/initialization/metadata vector capacities and observed capacity growth at executed steps; not all allocations or b's peak/RSS. Bounds include alignment/frame allowance, and completed/retained/cancelled paths retain prior value/immutability checks plus null vector teardown. Shared formatter emits numeric observations portably; no Linux ABI or new evaluator. Owner three query runs reported; local new-query/current instrumentation still pending. |

This is the21st incoming measurement snapshot review, not another primary tool
or a unique count summed with overlapping local reviews. Root now explicitly
assigns D2 frontend_units/module_cache measurement entrypoints and receipts,
B2 exact current sources/production link composition, D1 opt-in CMake wiring.
Existing source reviews stand; current self-contained recipe/hash handoff and
runtime slot are pending. No competing default heavy test or hardcoded new
compiler link architecture is introduced.

#### Actual transport audit after coordinator's B2 serial-profile finding

Read own frozen146 Ninja link recipes, generated host/serial Tower sources,
nm symbols and exact work_thread_available disassembly. Receipt
build/d2_ecs/transport_1461866 preserves source/recipe and binary hashes.
towerc598fabed, LR a399ae92, layout45294934 and execution62ec5002 use archive
host.work_dispatch+host.work_linux, actual callback/open_named implementations,
and available returns1. Frontend450332ea/storageb586f45a directly link
host.work_portable plus single-owner instrumented allocator; available returns0,
open_named is a null return. Their serial functional/parser/fault checks are
not overlap/performance evidence. This intentional boundary was previously
documented; no competing transport fix is needed.

Prior D2 CLI paired measurements use real production transport, as does the
layout profile whose actual overlap remained1. That failure to scale cannot be
explained by the serial-fixture linkage found in B2's separate16runs. D2 has not
yet executed the incoming frontend_units_profile. Its future target must reuse
production native/LR composition, report allocator/transport explicitly and
establish actual >1 admission/overlap for an eligible equal-unit control before
interpreting multiworker timings. Source6388747 API changes are not yet locally
built; this inspection is exact146 binary attribution, not new runtime credit.

#### Production frontend/import profile entrypoints

B2 delivered current native recipe7749a2a378e3b0fc98e62c9a00bc3be6d19ad9ceba8178ebf2198f7af4f02725
and README60801b9dda1af3a45bc54726a976815536c684386e50ef1942523b5c4b133a96.
It reuses LR/backend production sources/libraries, replaces lr-work-main and
exports work_thread_entry/backend_register_targets/backend_thread_entry; omits
test-only named_worker_entry and serial/instrumented allocator overrides.
Owner pilot actualouterpeak3/reserved4 confirms transport, not controlled timing.
Both source hashes match earlier full review rows: frontend2e4b, cache093.
Imported exact module_cache_profile093 into local tests; it remains Linux x64
opt-in, explicit world/module/cached grammar ownership and invalidation control,
four first/warm samples,3/18layers and1/4requested budgets, not overlap evidence.

D2 frontend delta447a277c produces sourcee925b20530fd00db3664f19428e4779c9a3d258a95d6bbb9880b223db7854981:
reject non-native thread transport before timing; after checked JSON output
require actualouterpeak>1 and reservedpeaklanes>1 for equal independent control
(count>1,budget>1,bodies0). Failed observations remain printed with nonzero
failure; skewed/serial runs still report their actual measurements. All timed
operations, answer42 and canonical checks unchanged. This prevents accidental
serial linkage being accepted as native-concurrency measurement, grounded in
B2's observed16serial runs. Local predecessor compile and paired equivalent
input profile remain pending. D1 owns opt-in CMake registration and received
exact draft/source contracts; no duplicate link implementation added.

The unexecuted frontend guard v2 supersedes447a277c: full delta939940621aedbee1a635bd89a5c9f6b9d5222e2cf5d18d62aac84144387e9841
after2e4b produces57e392d98413b07c6f8467fe09651562e3fecd8d8d1041c4585b66736b52a42e.
The existing post-timing interval scan also requires different captured pthread
IDs among overlapping spans for the equal-unit control. This strengthens actual
concurrency evidence without changing measured work or treating queue width as
overlap. D1 received replacement instructions; both versions remain unrun here.

#### Data-only buffer type import closure

Root-reviewed L1 split7f9fa3c4317a2331dc9f9981dcd2ed45a7f9832a8d7ac179a04c7923f6831412
is source-integrated after v3/drain; local execution pending. All four files
read. New library/work_buffer_types.tower contains the sole unchanged WorkBuffer
fields and budget lifetime contract. New library/work_vector_types.tower owns
the sole ordinary work_vector type producer and four allocation-free borrowed
iteration hooks (resolved in that producer's module); both old implementations
import these definitions. No duplicate nominal type, changed layout/allocator
behavior, cap increase or new language syntax. A2 remains API owner, L1 handoff
owner. Existing native/browser/project/bootstrap library discovery includes both
new files; final exact resource closure now requires46resources if nothing else
changes. Types-only clients must import *_types explicitly; full implementation
clients retain methods. Owner public-pin formerly failing semantics unit passes;
full owner/runtime and D2 predecessor/affected tests still separate open evidence.
This limits import expansion before any parser unit split; no measured local
iteration speedup yet. Removed only the extra terminal blank line introduced
by this patch after diff --check rejected it, retaining the source failure.

Split closure correction: independent public-pin normal fixture failed at76:17
Unknown type constructor work_vector (93271, raw1). Four unaffected type/profile
units passed50787. Coordinated import-only deltaa4eb4477 adds defining
work_buffer_types to implementation/four fixtures and work_vector_types to the
normal fixture; no implementation/layout/oracle change. This supersedes any
inference that importing the old implementation exposes moved types. Corrected
local compilation/runtime remains a distinct required check.

#### Joint physical-owner integration boundary

Corrected five public units pass at d672270; raw failed predecessor compile
remains recorded above. Incoming parser9e4d/cfd3, frontendc654/6e961 and backend
retention93b9 are source-reviewed/adopted together with interpreter9228; no
runtime claim until every shared-ABI dependent rebuilds. Direct WorkBuffer and
IMState users receive explicit defining imports, exported separately to owners.
New parser_table_budget80-line fixture uses explicit world-owned table/context
buffers, retained exact direct-byte subtotal, denial/retry/reuse and final zero
ledger plus serial allocator balance. It is correctness coverage, not a timing
or concurrency workload. Interpreter query measurement now also compares exact
physical reservations across interleaved invocations, width4/8 and8/65536-byte
inputs with/without budget; denied growth preserves payload and receipt. This
supersedes earlier source39366 for current builds, preserving historical
evidence. Neither change establishes a complete compiler memory cap.

D1 registration41d2bc06 inspected/applied without competing manifest logic:
production LR/backend closure, three real callback exports, Linux x64 opt-in,
no default heavy test or serial allocator. Existing frontend/cache full source
reviews remain applicable; measurement runtime/current ABI proof is pending.

Current00caeef public-pin12units/native13steps/linked21steps pass with source
hash checks. Immutable compiler07474566 has46exact resources (four new library
files versus146, old42 unchanged); source/current runtime remains separate from
next typed failure propagation and arena integration. D1-authored focused
allocations selectordfb232 adopted after all jobs drained: existing snapshot
fault cases can run without invoking the body/parser matrix, default unchanged.
This reuses the registered serial allocator and is neither parallel evidence
nor a new test implementation. Current measurements and runtime checks follow.

#### Current joint validation and additional arena measurement review

The preceding journal's D2 joint evidence section records exact00caeef compiler,
1dd7d96 runner,12 public units, native/linked build, combined runtime, no-op and
32 controlled guard samples. Production frontend/cache entrypoints now execute
with the reviewed transport. Serial-negative guard134 is intentional; original
negative-link failure1 is preserved. The128-body serial timing regression is
unresolved pending pinned-core samples; neither passing outputs nor an
outside-timer guard proves performance unchanged. Small current three-unit
1/2-worker medians6.083/4.565s show useful specific overlap with greater CPU/RSS.

The module_cache_profile093 row now has independent executed evidence:
3/18-layer counts, shared-leaf invalidation and teardown pass.18-layer warm
273–301ms versus first34–37ms exposed missing B2 unique-graph fixdeba07, not a
regression of that fix. Source review follows snapshot ownership through
module_clone/module_complete/order and revalidates every lexical edge/source.
Adopted owner fix after drain; new runtime/measurement pending. No new memo,
authoritative graph, scheduler or relaxed cache identity was introduced.

| Additional source path, reviewed v5 SHA256 prefix | Storage, scheduling, ownership and evidence disposition |
| --- | --- |
| scaffolding/library/work_arena_types.tower,3410b911 | Sole typed owner/chunk/snapshot declarations. Borrowed budget must outlive retained chunks; lists describe physical buffers, not an ECS archetype. No world singleton or hidden allocator. |
| scaffolding/library/work_arena.tower,61244195 | Explicit budget/null-standalone owner, checked power-of-two alignment/overflow, stable slices in charged physical chunks, unchanged output on growth denial. Worker-private bump path; coordinator same-budget splice only after joins. Dispose copies self-owned descriptor before release. Source-reviewed, owner native/WASI/instrumentation evidence; D2 execution pending. |
| scaffolding/tests/work_arena.tower,0bcc91fe | Exact aligned/zero/oversize payload checks, denied growth preserving previous addresses, cross-budget append rejection, complete transfer and exact grants at teardown. Standalone explicit null boundary. No concurrency proof. |
| scaffolding/tests/work_arena_faults.tower,a2f0946b | Existing serial failure allocator isolates first/growth failure, output/chunk/byte/grant invariants and final buffer baseline. Explicitly separate from real threaded allocation or sanitizer evidence. |
| scaffolding/tests/work_arena_shared.tower,e2d87102 | Four distinct pthreads at real barriers, cancellation and denied growth, checked stable first/last slices, drain/join before complete chunk transfer and disposal. Production allocator/shared ledger; tests are bounded evidence, not universal race freedom. |
| scaffolding/tests/work_arena_profile.tower,bb147b67 | Fixed2048/262144 objects with all initialized bytes independently checked after timing. Worker-private arenas share ledger only on chunk growth; raw production allocations are the baseline. Equal pre-touched pointer-index storage is unbudgeted/outside timing. Reports allocation/join and retirement wall/CPU separately, actual span overlap, payload/chunks/physical/ledger bytes and RSS. Linux x64 ABI boundary. Owner median evidence is separate; modest-host D2 profile remains pending. |

Arena profile is the22nd incoming measurement snapshot/path review; these six
source-closure rows are not summed into the40 primary tool/benchmark paths.
All40 assigned primary paths remain inventoried, no new path appeared there.
D1 owns generic registration and supplied exactb94c; no duplicate harness.
Only six new v5 bodies were copied, preserving all eight current buffer files.

#### Pinned guard followup and current bootstrap symbol closure

The six arena rows above are now committed in741de29; their source identities
remain the listed v5 hashes. D1's independent f635 receipt subsequently passes
the arena/API checks and actual ASan/TSan stress, but does not validate D2's newer
643 resource-failure ABI or the final source union. No duplicate arena matrix is
needed merely to reproduce that owner's receipt.

Pinned CPU2 followup resolves the earlier large guard timing concern only to
this measured extent: five alternating retained serial128-body samples after
warmup give before/current medians6.061068/6.139582s, CPU6.017704/6.092433s and
188880/188880KiB RSS. The earlier32% slowdown was not reproduced; the remaining
1.3% wall difference stays recorded, with overlapping ranges. All twelve runs
check answer42 and canonical11163853601021039373. Both use the same immutable
00caeef resources; its longer archived path adds43 charged bytes equally.
This is a new controlled experiment, not replacement of the original raw data.

At reviewed commit643ceb4, bootstrap_symbols, bootstrap_comparison and the
verifier caller were re-audited against all seven actual00caeef component
objects. The unchanged verifier7465f311 rejects24 exact imports:6 parser,
12 interpreter and6 semantics; utf8/bytes/entities/host pass. Definitions and
callers establish these as Tower component boundaries:

| Component | Reviewed export owners and caller contract |
| --- | --- |
| ParserNodes | world create/dispose/budget and entity-store counts. Parser table/worker buffers use the owning world's budget; frontend units and configured lr_work fixtures own separate worlds and verify cleanup. No ambient world or native implementation is introduced. |
| Interpreter | host/memory physical buffer size/alignment/allocate/free; compiler/world node-world/bind/budget; format dispose/unsigned; Foundation execution item/reference; strcmp. Interpreter storage and the configured interpreter_call_query fixture use these explicit boundaries. Diagnostic formatting remains synchronous and owned. |
| Semantics | compiler_unit_kernel dispatch, world budget/reserve/release, frontend_module_root_world_size and type_object_abi_safe. The shared kernel dispatch and semantic context use the common worker budget; source construction and foreign ABI checking call their existing component owners. |

Implementation changes only exact per-unit strings and extends existing
bootstrap_symbols_checks with wrong-unit/prefix/suffix cases. The parser and
semantic lists also admit compiler_clone_tree_result after review of exact
L2 patch25503293 and root's API coordination. Its matched service consumers
are still pending here; policy approval is not runtime acceptance. No arbitrary
prefix/native adapter, second registry, allocation or concurrent mutation was
added. All seven frozen Linux reports now pass verifier6e97faac; public-pin
smallest checker and existing boundary cases pass. Actual final cross-target
generation comparison remains required, with any new imports reviewed afresh.

The existing serial checker allocates no storage; its CLI retains the bounded
nm report unchanged. One before/after measurement per frozen component is below
GNU time's0.01s wall/CPU resolution. Interpreter peak RSS1348/1352KiB is process
startup noise, not evidence of a speed or retention improvement. There is no
parallel work in these tiny checks and no scaling claim. Exact logs, original
exit1 reports, input object hashes and source checks are retained under
build/d2_ecs/bootstrap_closure_00caeef.

D1's semantic_resource_checks fixture0751 was read fully and adopted after
owner corrected-runtime acceptance, together with its existing query-runner
import/call. Its three trials preserve explicit budget/world ownership,
source-ordered failure, matching failed tickets, drained peers, no published
value/replay and complete disposal. Only the entry changed from the original
standalone draft; no new runner or generic manifest. Independent current ABI
execution is still pending at this source checkpoint.

Current exact checker also passes actual11-definition ASan with the existing
instrumented guest boundary, leak detection and unchanged source hashes. The
first manual link/compile command reinstrumented IR and failed1; its
shadow-of-shadow disassembly and raw error are preserved. Corrected canonical
compile-without-sanitize/link-with-sanitize succeeds separately. No threaded
mutable path was added here, no race-freedom or source-level UBSan claim.

#### Integrated owner receipts at78e955c; measurement refresh

The40 primary tools/benchmarks remain33+7, with no additional primary path.
All eight owner histories from3915 plus D1 focused registration80ec are now
integrated on main78e955c. They are not a new runtime pass. Exactfa725bf
compiler8388c79a/48resources, public units/native and query/resource/units/backend
checks, fresh symbol closure and pinned cache before/after results are in the
journal's preceding D2 section. New source changes require affected validation.
The original missing parser-only target remains a failed command; D1's supported
conditional module target now supplies the necessary native composition.

These source reviews refresh earlier incoming rows at reviewed commitde3ceea
(and unchanged in78e955c); hashes distinguish changed revisions without counting
existing paths again. No additional ownership transfers or speculative rewrites.

| Path / current SHA prefix | Storage, scheduling, ownership and evidence disposition |
| --- | --- |
|scaffolding/backend/foreign_tool.tower /aa3c9300|Checked ByteBuffer appends replace the earlier unchecked text helpers; all temporary quoted-name mutations restore before failure, mangler objects close and both paths allocate before ordered writes. Shared driver file helpers replace duplicate transport. Output files can remain partial on write/close error; no atomic pair claim. B2 owner fault/reference evidence, D2 current integration unrun.|
|scaffolding/tests/foreign_tool_checks.tower /1ac2930b|Same previously reviewed serial fault fixture, now integrated. Checks exact wrapper/source bytes, rejected plain/string/comment/name/wrap allocation failures, input restoration and no retained buffers. No concurrent allocator or all-mangler OOM claim.|
|scaffolding/tests/entity_locality.tower /dbdab851|Unchanged reviewed explicit store/stable paged payloads versus derived packed copy. Setup/copy and traversal costs remain distinct; Linux usable allocation sizes are not all heap/RSS. Source integrated, no new D2 runtime evidence.|
|scaffolding/tests/layout_frontier_profile.tower /a72e2c09|Adds cold/warm pool split with separate startup interval to the existing explicit-world frontier workload. Every field offset/size and joined receipt checked. Caller reservation persists through world cleanup. Pool peak remains admission, not interval overlap;0byte budget unbounded, fixed1/2/4/8 requests need host admission. Not a replacement for the separately observed production layout profile.|
|scaffolding/tests/lr_state_benchmark.tower /4a01d179|New runtime mode retains frozen LR/LALR states and independent serial table reference, checks every action/goto outside construction timing, binds finite shared budget and reports physical retained/peak bytes separately from ledger/RSS. Table destruction returns all byte grants while caller lane stays reserved. State mode unchanged. CPU/switch timing scopes differ as documented; worker counts do not prove overlap. New union runtime unrun.|
|scaffolding/tests/parser_retention_observer.tower /ce3d2e30|Comment now accurately describes aggregate pooled-reference reconciliation, not per-page census. Joined-world observer deduplicates canonical pages, overflow-checks layout-derived bytes and frees private index. Large individual allocations excluded; exact owner/payload totals do not cover all heap.|
|scaffolding/tests/parser_retention.tower /3cb4a401|Explicit owned/legacy boundary, derived source lengths and counted raw buffers, repeated reset/declaration/statement release. Observer verifies stable owner totals and page-attributed buffer changes; owned mode requires exact teardown baseline. Serial counter transport required; attribution companion does not waive stricter parser oracle or prove threaded safety.|
|scaffolding/tests/work_budget_allocation.tower /fe6f0842|Existing serial fail allocator checks first-entry/growth denial leaves receipts, vector identity and counters unchanged; free-slot reuse allocates nothing, stale copy cannot release replacement, final exact baseline.16 rounds are fixture data, no timing/scaling claim. Root/D1 generic registration/runtime remain separate.|
|scaffolding/tests/module_cache_checks.tower /5376e1d1|Thin synchronous entry into existing frontend_modules_tests; owns no extra graph/scheduler. Nonzero detailed fixture exit retained, requires parser_modules composition and scaffolding cwd. D1 conditional target62b9 supplies that closure without a parser-only matrix. Full malformed/cycle/resolution/session run still pending here.|

The pinned cache control reports no retained-count growth and does not reproduce
initial first-load slowdown; exact3/18-layer medians and qualification are in the
journal. Its unchanged093 entry stays a single serial workload even with requested4.
The physical-buffer ledger, process RSS, canonical entity counts and true overlap
remain distinct metrics. Public clone non-stack allocation failure distinction
was routed to L2/A2/B2 with exact source paths; no competing implementation.

### Current remaining scope at 2a8646e (2026-11-23)

This update supersedes the open/implemented classifications at83ca8a6 above;
the intervening receipts and failures remain historical evidence. Primary
coverage remains40/40 paths (33tools,7benchmarks), verified against the current
directory census; bootstrap provenance remains45/45. Incoming owner API reviews
below are separate from adoption and runtime acceptance. D2 has no heavy job;
D1 owns the shared Deck slot. This source/documentation review does not change
runtime code, so new runtime performance/memory measurements are inapplicable.

| Requirement / exact locus | Current disposition and next concrete evidence |
| --- | --- |
| Iteration, tools/build_tools.tower build_tool and canonical build entry | The positive compiler budget/default1 and explicit missing-language measurement fix are implemented and measured. D1's current smallest aggregate checks cost34.05s(parser_modules_work)+30.74s(semantics_checks), then canonical native recompiles both. Future validation keeps direct changed-unit checks first and uses the required canonical build for those aggregate checks; no cache or new scheduler is needed. No claim that unexecuted recipe changes already save measured end-to-end time. |
| Packaging ownership, compiler_project_files/compiler_project_package/bootstrap_package | Explicit request-owned records and derived source/member indexes remain appropriate; ordered archive/filesystem publication is serial. Final current-artifact packaging CPU/RSS/retention still needs measurement. New work_arena_api will be collected by existing library glob/tree traversal once adopted; no manifest edit is necessary. Actual complete package, one provider and undefined/duplicate symbol checks remain required. |
| Between/within-unit ready work, semantic_layout.tower sem_layout_execute | The older missing grant-refresh claim is now superseded: current code recomputes profitable ready layouts only after running work reaches zero, with prior receipts released after publication. Threshold is8192fields. Current layout_frontier_profile selects8/1024/4096 and therefore cannot establish this worker path. Routed to A1/A2/D1; need checked at/above-threshold spans and actual useful scaling. Backend distinct-thread overlap passes atfa725bf; common Deck jobs2 benefit remains workload-dependent, not universal. |
| Serial/reference/import measurements, compiler_reference_inputs and module_cache_profile | Frozen16/1000-function and workers/window independent-reference/canonical evidence exists at1461866; current merged CLI repeat is pending. Cache fixdeba07 is independently measured atfa725bf: pinned18-layer warm median309.109ms to549.529us, exact counts/invalidation/teardown; serial cache traversal is not threading evidence. Pinned128-unit control leaves1.3% residual with equal RSS; initial uncontrolled32% slowdown was not reproduced. |
| Staging, semantic_capture_work/semantic_evaluation_work/interpreter_storage | Production helper readiness, executed-path capture policy, immutable aggregate snapshots and paired typed resource failure are implemented. fa725bf query tests cover32/64,1/4, failed tickets/no replay/drain; initialized-order and aggregate receipts are source-specific. Full42 lifecycle/current full milestone remains open; no new evaluator or Foundation safety policy is introduced. |
| Failure/stale/lifetime, entity_stage and compiler/generics | Stage membership fast path has checked native/concurrent evidence; semantic_world owner cleanup is now integrated. Exact current shared-source sanitizer/stress remains pending. Public clone-result handoff25503293 and matched B2 consumers are not adopted; non-stack null allocation can still leave CloneStack.error=None in current source, so optional inspection must not silently treat it as quota. L2/A2 own correction. |
| Physical retention/locality, work_buffer/work_arena/entity storage | Charged physical buffers and worker-private stable arena slices are implemented and measured separately from RSS. Stable paged entity payloads are not packed archetype columns; retained-count observations are not all-heap accounting. Constructor patchfe458 and matched B2 callers remain pending, and that patch explicitly excludes store pages/component payloads. A1 fallible publication/arena adoption is still owner work. |
| Instrumentation, instrument_llvm and TowerSanitizers.cmake | Actual LLVM19 Tower ASan/TSan support and earlier scoped passes exist; current exact checker ASan passes11definitions. Its failed double-instrumentation experiment is preserved. New union whole-compiler/query/stage/parser/worker validation remains open; source-level UBSan and other-host sanitizer coverage are unsupported, not passed. Do not substitute serial fault counters. |
| Canonical build/browser/publication, bootstrap_comparison/verify_compiler/playground Checks | Latest D2 compiled package isfa725bf/8388c79a+48resources, not current2a source. D1 independently built0e544 union, but its receipt is not a D2 build identity. Final frozen clean public build, generation/package closure, native/browser/threaded assets, source-reachable provenance and leased atomic main+Pages/hosted verification remain open. Direct host libLLVM19 boundary requires the supported Docker image. Root owns final vendor/backend assembly; no duplicate Deck vendor build. |

#### Arena declaration handoff and packaging closure review

Reviewed exact patch819a9542 and archive2f16b385 without adopting them. The patch
exports the existing six arena operations and adds the sole provider import to
compiler/units/entities.tower, already selected by TowerCompilerUtilities.
No algorithm, nominal layout or second scheduler is added. D2 will inspect actual
new component imports before extending exact per-unit symbol policy; no prefix
allowance or speculative catch-all is justified.

| Incoming path / SHA256 | Substantive review and disposition |
| --- | --- |
|scaffolding/library/work_arena_api.tower /5df4ac6bffab97dce2a6148216a94260179d54d813d6059475c30fba98bac656|Typed extern declarations import defining arena/budget types; clients borrow the same explicit private owner, with exactly one linked implementation. No allocation, state, world or scheduling hidden in this boundary. Source-only handoff review; joined consumers/full package remain pending.|
|scaffolding/tests/work_arena_linkage.tower /ada9e5cc4deb3c850ba194c93a49abdeeed028691509d85131bf5bd64208538e|Separate client object exercises all six provider symbols, explicit finite budget, aligned initialized slices, unchanged output on denial, same-budget transfer, retained-byte snapshot and final zero grants. No threads or overlap claim. Native/ASan/TSan receipts reported by A2, not run by D2; generic registration belongs to D1.|

CMakeLists copies top-level library Tower modules into native resources;
compiler_project_sources traverses the library tree for editable browser sources;
playground/scripts/build.mjs includes top-level library builtins; bootstrap_collect
packages the actual executable's complete share tree. These existing paths cover
the new declaration file after adoption. They do not prove a built artifact has
the new file or exactly one provider: final package hashes, source comparisons,
link and symbol checks must establish that. Prior failed read-only searches of
guessed build-file paths were corrected using the tracked inventory; no check was
run or counted as passing by those searches.

### Current provider and clone follow-up at63aaba35 (2026-11-23)

This supersedes the earlier current-table claim that public clone25503293 and
matched consumers were not adopted. Root6b includes the node/attachment Memory
correction and B2 transactional module/query cleanup. D2's exact6b public native,
query/full-module/storage/allocations/units/backend checks pass. Nonstaged metadata
allocation and separately reproduced partial inspection failure remain owner gaps;
positive editor or clone tests do not establish that missing failure behavior.

The following overlapping provider/caller rows extend the audit, not the40-file
primary tooling count. Source reviewed at63aaba35 plus D2's five import lines;
compiled leaf evidence retains5681da4+five-import identity. New owner algorithms
are reviewed here for build/lifetime composition, not reassigned to D2.

| Path | Storage/world/scheduling/ownership conclusion | Evidence and disposition |
| --- | --- | --- |
| scaffolding/compiler/units/interpreter.tower | Existing native execution owner imports the thin Publish kernel; its private arena/derived queue borrow frozen world nodes. No additional authoritative graph or global state. | Native public leaf PASS; exactly one kernel definition and external arena/semantic helpers. Actual native link/runtime pending. |
| scaffolding/compiler/units/interpreter_browser.tower | Same production provider with existing browser invocation fixtures; browser workers still own their session/input lifetimes. | Native and WASI leaf PASS; one kernel each. Browser threading/linked artifact acceptance remains separate. |
| scaffolding/compiler/units/interpreter_checks.tower | Parser-check profile selects this instead of the other interpreter entries. It adds no second provider within that artifact. | Public native leaf PASS; nm one kernel. Current full parser-check link and sanitizer closure pending. |
| scaffolding/compiler/units/evaluation.tower | Existing invocation-only alternative used by LLVM/cross and compile-only tests. Linking it alongside interpreter would duplicate core definitions, so current mutually exclusive recipes are required. | Public native/WASI leaves PASS; each one kernel. No manifest change needed; native alternate and final browser/backend link still required. |
| scaffolding/compiler/units/evaluation_checks.tower | Explicit import list, not inheritance from evaluation; requires its own same helper import for check profile. Scratch and publication ownership stay in the common helper/coordinator. | Public native leaf PASS, one kernel. No duplicate implementation introduced. |
| scaffolding/compiler/semantic_known_publish.tower | Private stable arena entries combine identity index and first-seen linked traversal; derived indexes only. Traverses owned executable edges in existing order, omits nested function/type/label bodies. Checked patches/read logs/output vectors suppress canonical publication on failure; vectors retain their older allocation ownership. | Fully reviewed b7; public provider leaves pass. No packed ECS claim, complete memory budget or fallible transport claim. A1 owns kernel;22 registered runtime cases pending locally. |
| scaffolding/compiler/semantic_known_bindings.tower | Coordinator pre-reserves diagnostics/jobs, joins before ordered publication, releases arena after join; ab603725 rejects cancelled graph before captures or dispatch. | Guard and four-case source reviewed. Owner22-case receipt is source-specific; D2 joined runtime pending. Shared dispatcher fallibility remains a later owner change. |
| scaffolding/tests/semantic_resource_checks.tower | Existing parameterized helper retains two-peer required/inferred/isolated failure semantics, exact source offset, no replay and final zero grants. Added mode loop covers successful entry allocation then nested storage denial. | Entry-only conflict resolution preserves24 trials. D1 owns generic hook; no duplicated runner or weakened budget/error oracle. |
| scaffolding/tools/bootstrap_symbols.tower; scaffolding/tests/bootstrap_symbols_checks.tower | Allocation-free exact per-unit borrowed-span policy remains appropriate. Actual6b imports reveal nine stale entries; no wildcard expansion is justified. | Seven actual object reports preserved: four pass, three fail1. Current provider imports require final emitted closure review before narrow policy update. |

Root86 grammar review confirms budgeted fixed rule columns and common-lifetime
names/captures arena are derived snapshots of immutable ordered grammar entities.
Existing getters preserve source order/first nonnull anchor; destruction releases
all buffers and arena before its descriptor. This is not evidence of packed
world payloads. B1's denied object/retained-minus-one/partial cleanup/retry fixture
and source-specific native/ASan/TSan/WASI receipts remain qualified in its journal.
D2 joined provider and grammar performance, current instrumentation and final
artifact validation are pending. No further runtime measurement is attributed to
these audit paragraphs themselves.

The provider rows above now have exact406d native link/runtime evidence: six
compiler/test executables each contain one kernel,49-resource package membership
matches source, and ten full query repetitions include22 Publish/24 resource
cases. Initial query134 remains an unresolved workers2 clone-overlap assertion
before Publish. Type-errors, arena linkage, parser/allocation/storage/module,
production units and backend overlap pass separately. Do not equate those
successful executions with resolving the initial failure or final release.

At the subsequent D2 policy change, bootstrap_symbols and its existing Tower
regression retain borrowed allocation-free spans and exact per-unit/platform
membership. Actual native/WASI owner exports justify24 additions; check-only
allocator hooks remain rejected. Seven native components plus three native/two
WASI production entry reports and all policy regressions pass;11-definition
ASan/LSan passes. Misapplied check-profile validation and earlier missing-WASI
imports remain recorded failures, not passes. New policy changes no scheduler,
world/payload ownership, supported target or source language. Common compiler
before/after profiles and final merged instrumentation/browser/generation remain
separate gates.

### Joined grammar/Publish measurements and exported units (2026-11-23)

Compared immutable6b8355b compiler509facfd/48 resources with406d1709
compiler1a9476d0/49 resources. The difference includes B1 grammar accounting,
A2 arena linkage and A1 Publish scratch; it does not isolate the five import
lines or one owner's algorithm. Same public predecessor9653, Docker base4be584fb,
SteamDeck x64, CPUs0/2, Release, explicit --jobs1/2, --emit object, --timings,
complete adjacent resources. Bedrock/Foundation/syntax/types/Tower/vector bytes
match. Inputs are frozen16/1000-function reference programs plus unchanged
known_bindings/body_continuation fixtures. Link separately using public9653 and
common runtimec4dec12e; every executable matches15/999/0/0. Warm filesystem,
fresh processes, one warmup and three alternating measured pairs; not OS-cold.
All64 compile/link/output runs, repeated objects, cross-version objects and
serial/parallel objects pass. Phase logs and full GNUtime metrics are preserved
under build/d2_ecs/publish_profiles_406d; interval02:34:24–02:38:04UTC.

Medians below are wall/CPU seconds and peak RSS KiB; each column's median is
computed independently. Keep the ranges/raw files because three samples show
substantial timing variance.

| Input | Jobs | Before wall / CPU / RSS | After wall / CPU / RSS |
| --- | ---: | --- | --- |
| small16 | 1 | 2.10 / 2.08 /184944 | 2.23 /2.20 /184120 |
| small16 | 2 | 3.54 /4.05 /196456 | 3.61 /4.11 /194948 |
| large1000 | 1 | 2.40 /2.37 /212912 | 2.45 /2.42 /210564 |
| large1000 | 2 | 3.54 /4.15 /225640 | 4.00 /4.39 /224340 |
| known_bindings | 1 | 2.13 /2.11 /186420 | 3.63 /3.53 /185032 |
| known_bindings | 2 | 3.49 /4.00 /197000 | 3.59 /4.08 /195116 |
| body_continuation | 1 | 2.37 /2.33 /198884 | 2.38 /2.35 /197664 |
| body_continuation | 2 | 3.53 /4.04 /210400 | 3.66 /4.18 /207888 |

Investigated apparent known-value regression instead of reporting the median
alone. Before serial known spans2.10–5.86s, after2.39–4.58s; the slow before
sample spends5.600s in parse/check versus1.878s in its fast sample, with CPU
5.67 versus2.07s, zero major faults/swaps and nearly identical minor faults/RSS.
Other serial inputs also have large CPU-time outliers. Powersave governor was
unchanged; an idle snapshot showed CPU0 at1.55GHz and CPU2 at3.50GHz. This suggests
host placement/frequency sensitivity but does not establish a sole cause.

A bounded follow-up pins both versions to CPU2, same immutable inputs/resources,
explicit jobs1, one warmup plus five alternating pairs. All24 new objects match
the already executed/checked references. No compiler rebuild, new oracle or
system frequency setting. Known medians become2.09/2.07s/186556KiB before and
2.15/2.13s/185072KiB after (wall ranges2.08–2.12 and2.11–2.17). Large becomes
2.40/2.38s/212968KiB versus2.45/2.42s/210576KiB (2.37–2.45 and2.41–2.47).
The apparent70% known slowdown is not reproduced; residual joint-source cost is
about2–3%, not zero. RSS falls about1.5/2.3MiB; no excessive memory growth is seen
on these inputs. Separate successful query fixtures check joined scratch/grant
retirement, but CLI RSS is not a complete allocation/retention census.

Two workers remain unprofitable on these modest single-unit workloads. The
three-sample large/two-worker median rises about13%; variability and the shared
source delta prevent sole attribution. Native production-unit/backend checks
separately establish real distinct-thread overlap; they do not turn this CLI
matrix into a useful scaling result. Earlier independent C-like reference inputs
and Clang19.1.1/GCC13.3.0 receipts remain unchanged, with their exact semantics,
flags, builtin-type/grammar and optimization differences. No cross-language
superiority, new C timing, per-worker idle/critical-path or all-core claim.

The newly merged D1 ledger target builds/runs through its existing serial fault
profile. The existing compiler_project_units fixture exports actual entities and
evaluation depfile closures. New semantic_known_publish and work_arena_api bytes
match source; recompiled exported entities/evaluation native objects and
exported evaluation WASI object match all three actual original objects exactly.
No new manifest/tool logic. Logs: provider_package_134b. Browser entry mappings
remain deliberately browser-specific; native interpreter objects were not
misrepresented as browser build recipes. This is source-closure/object evidence,
not complete reactor linking or a final generation/hosted release.

Reviewed D1's8f46c466 backend observer/calibrated selector after all D2 processes
drained, then merged as c734364b. The test uses checked monotonic nanoseconds,
private trace buffers, one already-required serial frontend baseline and a
frozen max30s/baseline frontend wait; backend acknowledgement stays30s. Ordinary
selector/default workload and object/distinct-thread oracle remain. Its new
runtime/instrumentation belongs to the current D1/B2/L1 receipt; the preserved
406d binary and normal16.26s backend result do not validate new test code.

The authorized future WorkPool serial-provider patchcdb2c027 changes only the
existing generated serial entry to import work_dispatch plus portable transport.
It remains an external draft pending the complete A2 API/constructor closure.
Separate multi-object test clients need declarations, while same-object combined
imports deduplicate normally. Exporting default-kernel pool wrappers can create
an unwanted work_kernel_execute dependency for unrelated serial fixtures; this
concrete link hazard was routed to A2/root. No dummy callback or alternate pool
was added. Final current instrumentation, clone-overlap correction, portable/
browser/generation and leased atomic publication remain open.

### Work API proposal: standalone provider review (2026-11-23)

Reviewed against clean `99a3bb44`, with no D2 build active and D1 holding the
shared heavy-process slot. A2's review patch SHA256
`dbe38d884fb84885904039573c8231b9baf4d25d1dc0a63b54e349a596061441`
applies cleanly but remains **unadopted**: its public aggregate semantics build
still fails the predecessor's component limit. The separate import-only patch
is `4627da948ed7236785007f104a51be7c5b3aa1e186ec561f3079efe109a8abdc`.
This section records source findings, not compiled or measured acceptance.

| Reviewed path or boundary | Storage/world/scheduling/ownership conclusion and disposition |
| --- | --- |
| `library/work_graph.tower`, new `work_graph_api.tower`, `work_graph_types.tower`, `work_view_types.tower` | The complete proposed graph delta retains a coordinator-owned derived index and revision/profile/dispatch tickets. Nine physical `WorkBuffer` owners back distinct nominal borrowed views; ordinary `vector` cannot dispose those views. `work_cycle` still returns a caller-owned ordinary vector. All 27 API declarations match exported operations, including `work_fail`. `units/entities` supplies the implementation in compiler artifacts; standalone clients need their own explicit provider. No new semantic authority, worker-safe mutation or alias promise is established. |
| `library/work_pool.tower`, new `work_pool_api.tower`, `work_pool_types.tower` | The complete proposed pool delta preserves nominal slots through ordinary aliases and exports both named-entry wait/complete operations. Slot storage is budgeted after host-capacity clamping; close drains before disposing it. Busy batch entry does not acquire another caller's outstanding work. However, exported default-opening wrappers reference `work_kernel_execute` from the shared provider even for callback-only or transport-only clients. Actual final link closure is required. |
| `host/work_dispatch.tower`, `cmake/TowerWorkHost.cmake` | Existing native/serial/WASI provider selection is retained. The approved serial import adds dispatch beside portable transport in the existing object, preventing native archive extraction. It also exposes the unresolved default-callback requirement. No new transport, object or dummy callback is proposed. |
| `tools/link_wasi.tower`, `cmake/TowerRuntime.cmake` | This tool compiles one standalone object and links only its guest runtime. It imports `library.entities`, not the compiler's entity unit. After the proposed backend graph API swaps, its graph calls have no implementation provider. One explicit `library.work_graph` import in this existing tool is the scoped proposed correction; pool dispatch and its existing default callback already belong to this closure. |
| `tests/work_pool.tower`, `tests/target_once.tower`, `cmake/TowerWorkTests.cmake` | Their separately linked dispatch object requires API-only clients; A2's mechanical edits do that. Shared/profile fixtures importing implementation plus dispatch in one Tower import closure do not create the same separate-object duplication. True standalone graph fixtures retain implementation imports and add their nominal types and memory boundary. |
| `tests/work_buffer_faults.tower`, `tests/work_arena_faults.tower`, `tests/work_budget_allocation.tower`, `cmake/TowerWorkPolicyTests.cmake` | All three link the serial object explicitly and define no kernel callback. Thus the proposed exported default wrappers introduce a concrete dependency risk in existing supported fixtures. Routed to A2/root for wrapper placement and actual symbol/link checks; no fabricated kernel was added. Their single-owner allocation checks remain distinct from concurrency sanitization. |
| `tests/wasm_link_reader.tower`, `wasm_link_job_checks.tower`, `wasm_link_reader_native.tower`, `wasm_link_reader_wasi.tower`, `wasm_link_reader_threads.tower` | All reach backend graph API clients through the reader's ordinary import closure and need an explicit graph provider. The job fixture still imports the pool implementation; native adds dispatch and an existing default callback, portable WASI has neither dispatch nor default callback, shared-Wasm adds dispatch but no default callback. Preserve callback-only semantics and exact native/WASI link contracts; fixture-owner changes are pending. |

The literal-boundary caller review reads the current `semantic_support` literal
classification and the full numeric literal body in `semantic_values`, alongside
the floating-point contract. A1 owns the proposed helper; D2 will only route an
accepted exact helper through the same five existing interpreter/evaluation
providers. Keep borrowed token lifetime, signed-minimum integer spelling, direct
f32/f64 rounding, signed zero, and exact Invalid/Overflow/DigitLimit diagnostics.
`FloatParseStatus` must retain its one nominal definition in `float_text`.

Existing independent checks are available: `float_text` has exact rounding/
subnormal/signed-zero/malformed oracles and 512 seeded round trips;
`floating_checks` compares ordinary and fast interpreters, canonical Foundation,
verified packages, 32/64-bit targets, worker outputs and rejected conversions.
The execution runner already selects `floating`, `floating-oracle`, `narrow` and
`negation`. `float_reference` generates independent hardware LLVM arithmetic
checks; that is an arithmetic oracle, not an independent decimal-parser oracle.
Reuse these after the exact candidate and provider closure pass, plus the frozen
small/large compilation profiles. No runtime change was made during this review,
so new performance or sanitizer measurements are inapplicable to this documentation.

The later A2 v2 patch
`3833050c5cdadc33978a84926e6843ea1f42ea05d44f1e2209d9a239bc8586d4`
supersedes the default-callback defect above: four convenience wrappers now live
in the client API and the provider exports callback-taking `work_pool_open_impl`.
Its complete delta was reviewed and apply-checked. It also changes the reader job
fixture to API-only imports, so portable WASI now needs an explicit pool provider
as well as the graph provider; native/shared-Wasm already import dispatch. Actual
links remain pending. Native resource globbing, complete bootstrap share-tree
collection and compiler-project source/depfile collection already include new
library modules; verify final packaged bytes rather than adding another manifest.

A1's later snapshot proposal `04589f9c` replaces 16 existing context copies with
one ordinary fieldwise helper in the existing semantics provider. This preserves
borrowed graph/pool ownership and each caller's private scratch replacement. Root
selected this capacity experiment over the literal split: no numeric/provider
imports were added. Its patch context includes newer checked dispatch and is not
universally applicable to root0c. D2 awaits the selected minimal passing owner
closure before provider compilation; the isolated v2 source archive is inactive,
not adopted main or a successful compiler build. A selected snapshot helper would
add an exact `sem_context_snapshot` import to separate Publish providers, subject
to actual object checks. New arithmetic-error consistency findings in graph growth
were routed to A2; no huge allocation or fabricated invalid payload test was run.

The selected owner patch is now `8e4e2d085a55de95e73fb041929aa75d3de3a22b3ba5b5e98abc55c4cebbbc2c`,
reviewed/apply-checked against `c4aa1713`. It **removes** the graph/pool API
experiment and all its extra exports/import swaps. The proposed standalone
provider fixes above are therefore historical and must not be applied to this
candidate. Original internal methods and provider membership remain. The selected
graph adds checked length increments and typed index-doubling rejection, preserving
the first resource error. The corrected snapshot-only patch `5acefe43` preserves
all 16 replacements while avoiding unrelated dispatch context. Owner parser/
semantic and focused instrumentation results are reported separately; D2 has not
compiled/adopted this candidate or relabeled earlier receipts.

Two incoming measurement files were read completely, including their selected
import composition. Both remain proposed source until the owner history is joined:

| Path, reviewed base and proposal | Substantive disposition |
| --- | --- |
| `scaffolding/tests/compiler_work_profile.tower`, c4aa +8e4e2d | Eight fixed independent plans use private `CompilerWork` owners and a synchronized shared budget; exact ordinal checksum, entities/components and final zero grants are checked. Measures descriptor/graph creation and scheduling, not compiler body throughput. Pool setup is excluded; dispatch/join included. Charged buffers explicitly exclude ECS pages/payloads. Selected imports restore full graph and native dispatch in the same object, removing the intermediate API recipe gap. |
| `scaffolding/tests/work_vector_profile.tower`, c4aa +8e4e2d | Fixed 4096/262144 elements are partitioned across private ordinary/accounted vectors; every value, sum, retained capacity and charged bytes are checked. Growth requests are not called physical allocation counts. Existing same-object native pool/dispatch and synchronized ledger remain; all vectors/grants retire after joining. Linux x64 clock/rusage layout is an explicit host boundary. Interval overlap alone establishes neither useful scaling nor per-core utilization. |

Also reviewed L2's complete clone-calibration fixture delta at `9bdbc814`, fetched
without merging its other source dependencies. The finite serial calibration uses
the faster of two fresh trials, caps width at1536, and freezes the chosen workload
before concurrent trials. Production intervals still exclude the admission
barrier; exact nodes/output, distinct threads, overlap and cleanup remain required.
Diagnostics precede the explicit failure assertion after worker/stage/world/budget
retirement. Function-scope graph/signal defers require normal return; a fatal
assertion does not establish that those remaining handles were retired. D1 owns current
independent native/instrumented validation; original D2 exit134 remains historical
failure evidence, not erased by calibration or the owner's three passing runs.

At `0c3876e8`, D2 joins the complete ROOT97 typed parser/inspection checkpoint.
Compiler, host, library, backend and CMake trees exactly match B2 `e4d3967b`;
the joined test runner and symbol policy still need validation on these inputs.
Earlier 406d measurements and provider receipts retain their original identities.
No owned build was running during the merge, and `todo.txt` is unchanged.

The selected A2 patch `8e4e2d` adds allocator imports after changing graph/pool
storage. Caller audit against `0c3876e8` found these additional link contracts:

| Path and existing target | Provider/ownership conclusion and disposition |
| --- | --- |
| `tests/work_named.tower`, LR/backend aggregate | Added `host.memory` duplicates the compiler allocator already in the aggregate. A2 observed the link failure and is removing this import. Keep one allocator implementation and the existing private worker slots. |
| `tests/work_instrumented.tower`, `TowerWorkPolicyTests.cmake` | Registration explicitly links separately compiled fixture **and** `host/memory` objects. The proposed import therefore adds a second provider. Routed to A2 to remove it, retaining serial fault allocation and exact cleanup assertions. This source finding is not a newly executed link failure or race check. |
| `tests/target_once.tower`, `TowerWorkTests.cmake` | Its changed pool needs `compiler_buffer_*`, but the target links only the fixture, target-once boundary/state, work transport/dispatch and guest runtime. The guest runtime contains no compiler-buffer provider. Routed one explicit `host.memory` import in this existing standalone fixture; no new object or scheduler is needed. Actual selected link remains unrun. |
| `tests/work_pool.tower`, `tests/work_order.tower` | Their proposed allocator imports share a single Tower compilation closure, so they do not create the separate-object duplication above. Existing native and shared-Wasm compositions still require actual checks. |
| `tests/entity_store.tower`, `TowerParserServiceTests.cmake` | Proposed direct provider coexists with a static compiler-memory archive, whose unused members need not be extracted. Do not call this a duplicate failure from filename membership alone; verify the actual selected link and allocator profile. |

This review changes documentation only; new runtime performance/memory or sanitizer
measurements are inapplicable. Corrected complete owner source, actual symbols,
native/WASI links and final coherent release validation remain required.

The coordinator's 03:24 UTC semantic-receipt proposal was checked against current
`5e0b3f36` tooling callers. Tools/benchmarks have no direct `SemanticProgram`
consumer; synchronous child status and checked products remain their boundary.
The following existing callers must consume the shared typed receipt before the
new ABI can be accepted. They belong to L1/B2, and were routed without edits:

| Caller | Concrete text-only gate and required disposition |
| --- | --- |
| `compiler/execution_session.tower`, `execution_package.tower` | Compile success and package admission use diagnostic length. CLI compilation trusts the session boolean. Typed resource failure must remain failure even when copying diagnostic text fails; stop execution/encoding and retain the owning offset. Existing aborting diagnostic-allocation paths are a separate unresolved boundary. |
| `host/ide_execution.tower`, `ide_artifacts.tower` | Execution failure, formatting, canonical package preparation and type presentation use text length. Check the typed receipt before starting the interpreter, formatting, encoding or exposing types. A failed resource query is not ordinary incomplete syntax. |
| `backend/source_session.tower` | Both original and canonically reconstructed programs enter backend lowering/reporting when ordinary diagnostic text is empty. They need the same typed admission check and allocation-independent failure presentation. |
| `compiler/frontend_units.tower`, `frontend_compilation.tower` | Worker success and source compilation/comment-publication gates use text length. Preserve worker-private program receipts and coordinator drain/source order; do not publish a failed private result or reset its receipt while clearing diagnostic text. |

This is proposal-readiness source evidence, not an executed failure or an adopted
second diagnostic system. `driver_compile_package`'s separate text-length branch
only chooses presentation after failure; it is not another success gate. Final
consumer changes must share the one owner-defined receipt and matching ABI.

### Selected storage join and standalone tool providers (2026-11-23)

D2 `bf0a5a41` joins complete ROOT `9b318706`; production scaffolding/CMake is
identical to that checkpoint before the two tool imports below. The selected
measurement files previously reviewed as proposals are now integrated unchanged.
No experimental graph/pool API modules or literal split were adopted.

| Reviewed path / source | Ownership, evidence and disposition |
| --- | --- |
| `tools/link_wasi.tower`, bf0a + explicit `host.memory` import | The existing standalone CMake recipe links this object and guest runtime only. Budgeted store/graph/pool construction now calls compiler-buffer exports; the former closure compiles but actually fails its native link on `compiler_buffer_free`. Import the existing provider in this same object. Mapped input owners still outlive joined linker work and world teardown; no new allocator, scheduler, global budget or alias promise. Fixed link and real serial/two-worker output checks pass; two requested lanes alone do not prove useful overlap. |
| `tools/wasm_link_audit.tower`, bf0a + explicit `host.memory` import | The documented standalone object/runtime recipe has the same actual missing-provider failure. One import supplies the shared allocator while preserving its request-owned linker world and input ownership. Small/large real-object reads and symbol resolution pass. The generic build-tools CLI does not register this audit name: its exit2 is retained separately, and the documented direct build supplies the actual evidence. |
| `tests/work_instrumented.tower`, ROOT9b318 | Independently reproduced the old `beb8be1c` fixture's duplicate allocator link using immutable source and matching existing target objects. Fixed target contains exactly one `compiler_buffer_free` definition and passes the existing serial fault sweep. This verifies provider composition and single-owner cleanup, not race instrumentation. |
| `tests/target_once.tower`, ROOT9b318 | Missing standalone allocator provider remains source-audited. Root assigns the actual target reproduction and one-import fix to D1; no competing D2 edit or passing runtime claim. |

Warm-cache Linux x64 Docker validation uses public bootstrap `9653f818`, LLVM19,
cpus0,2, build/compiler jobs1. Public parser/semantics units take27.44/31.02s and
722300/730996KiB peak RSS. Canonical native22-step rebuild passes198.49s,
194.39s CPU,733572KiB; configured18-target-step group69.13s,67.56s CPU,377104KiB.
Compiler `e90caced298dfb78d5df98c258f6bcdad5d4f762c7bbe98bfcfb42787b1ba6a6`
and complete resources are frozen in `build/d2_ecs/native_package_9b318`.
These are single validation observations, not clean-cache release or speed claims.

Normal worker policy, buffer/arena/budget faults, real worker pool, query, editor,
calibrated backend overlap, frontend allocation/parser, storage and module checks
pass. Query covers32/64-bit serial/threaded staging; backend checks distinct-thread
production intervals and exact objects. The historical clone134 remains separate:
this join does not include its later calibrated fixture. D2's unavailable extra
allocator-target request failed1; omitted storage argv failed134; corrected
configured targets and documented storage/module invocations pass. The original
logs remain; unrun checks at those stops were not counted as passes.

Before/after tool compile wall/CPU/peak RSS KiB (one sample each): link_wasi
17.63/17.23/463432 to16.21/15.91/468660; audit12.77/12.51/333224 to10.14/9.98/335380.
Both former links fail1; both corrected links pass. An unlinkable predecessor
provides no runtime speedup baseline, and these variable single compile samples
establish no improvement. Peak compile memory rises about5.1/2.1MiB. Small/large
post-fix audit and small link runs are below GNU time's0.01s resolution.
All measured children report zero swaps; charged-byte/retention telemetry is not
available from these tool CLIs, and RSS is not their live-allocation count.

The existing Tower library fixture produces a real relocatable Wasm object.
Tower links at requested workers1/2 produce identical bytes. LLVM19 independently
links that same input; all three modules return42 for the Tower export's input31.
Node only loads/invokes the export and writes its result; no linker/compiler/test
implementation was ported to JavaScript. A real larger evaluation object also
passes the audit. Malformed input is rejected with exit1 and no output; aliasing
the output to an input rejects without changing its hash. Both tool objects and
the fixed policy executable contain one allocator provider. No ASan/TSan run of
these new tool objects is claimed yet. Raw sources, commands, statuses, hashes,
profiles and failures are under `build/d2_ecs/storage_join_9b318`.

All D2 jobs drained before releasing its lock at03:52:35UTC for D1's phase fixture.
Current symbol-policy/native-WASI provider checks, supported instrumentation,
remaining merged compiler work and final public/bootstrap/browser/generation plus
leased atomic publication remain open. Earlier receipts keep their source identity.

### Same-session continuation and current policy boundary (2026-11-23)

Resumed the existing D2 thread after its usage limit. Guarded pull preserves the
two prepared policy/test edits and todo. Verified ROOT72a218's complete bundle
5673dc37 against sole60741, then merged as d4e721f4. Its production scaffolding
and CMake files are identical to the preceding D2 checkpoint; journal history is
preserved. This merge is not new runtime evidence. The existing goal is active.

| Reviewed path / source | Ownership, evidence and disposition |
| --- | --- |
| `tools/bootstrap_symbols.tower`, d4e721f4 plus pending policy | Actual ROOT9b318 native reports reject eight newly required exact imports. The semantics unit owns `sem_context_snapshot`; parser integration owns the two typed table-result constructors; entities owns `work_arena_allocate_result`; host owns buffer size/alignment; parser nodes owns module/session resource getters. Existing provider definitions and actual nm reports justify only these per-unit additions. The policy remains allocation-free, borrowing explicit bounded spans; no scheduler, world or ownership change. Pending regression/runtime validation is not yet acceptance. |
| `tests/bootstrap_symbols_checks.tower`, same pending change | Existing fixture adds accepted exact imports and rejected prefixes, suffixes and wrong-unit uses. Report and rejected-symbol lengths derive from `strlen`; no hardcoded span length or array bound is introduced. Check-only allocator hooks remain rejected. No generic harness modification. |
| `tools/tool_streams_posix.tower`, d4e721f4 | Caller audit confirms the verifier owns its bounded report, while this shared reader keeps a temporary buffer until successful close. Its stack chunk declaration and byte count both repeat4096. Updated instructions require deriving the read bound from the actual array type; documented `sizeof(decltype(chunk))` supplies bytes, unlike pointer size. Preserve the existing partial-read/error/over-limit and destination-preservation behavior. Before/after existing filesystem regression and public-predecessor compile are prepared, not yet run. |

The A1 V2 interface patch b255ff12 was read completely and apply-checked without
adoption. Its fixed first-error receipt and allocation-free restore require one
coherent SemanticProgram ABI rebuild. The restore derives copy length from the
owning message vector and permits its exact destination alias; interior aliases
are not vector owners. Pure query classification must follow an actual failed
operation, never ordinary waiting. No future helper is added to symbol policy
without emitted-import evidence. Producers and output consumers remain their
assigned owners' work.

All former D2 jobs are drained. The surviving D1 lock is left intact pending its
same-session reconciliation; absence of former controller PIDs does not transfer
ownership. Public/compiler receipts remain exact9b318, and the current policy,
provider/WASI and instrumentation checks remain pending. Documentation-only
review adds no runtime behavior or performance measurement claim.

### Actual policy, derived bounds and linker race evidence (2026-11-23)

After D1's explicit release, D2 acquired the shared slot at07:51:30UTC. Frozen
before sources are the complete d4e721f4 scaffolding archive97e597a7, with public
bootstrap9653f818, Linux x64 Docker/LLVM19, cpus0,2 and compiler/build jobs1. The
existing filesystem fixture and small/large real-object audit pass before edits.

| Changed path / reviewed implementation | Validation and limits |
| --- | --- |
| `tools/bootstrap_symbols.tower`; `tests/bootstrap_symbols_checks.tower`, 84e6d3e plus exact eight allowances | Existing negative/unit/prefix cases pass. Canonical public tools build produces verifiera2d1c6fd. All seven frozen9b and seven current72a native reports pass; fresh WASI parser_modules_work, semantics, interpreter, interpreter_browser and evaluation reports pass. Former verifierc03 still rejects exactly the observed interpreter/parser/semantic imports. No future API or check-only hook allowance. |
| `tools/tool_streams_posix.tower`, derived `sizeof(decltype(chunk))` | Existing public-predecessor filesystem fixture passes bounded rejection/preservation and normal reads. Its object is byte-identical to the frozen baseline. Actual array bytes determine fread's bound; no pointer-size inference, new allocation or ownership transfer. |
| `tools/wasm_link_audit.tower`, array/element-derived traversal count | Histogram traversal derives its bound from the actual array and element types. Existing extent remains the data definition. Public build, small/large real-object reads and exact stdout comparison pass; the complete tool object is byte-identical to before. No new protocol/backend definition or alias guarantee. |
| `tests/wasm_link_reader_native.tower`, D1-authorized sole `host.memory` import | Actual original standalone link fails on four compiler-buffer imports. Explicit existing memory-provider composition passes normal3/ASan3 real-barrier checks but reveals the production cancellation race below. The final one-import entry separately compiles/links with guest runtime only, has exactly one allocator definition and passes native3. Matched final instrumentation remains pending the B2 repair; no shared reader assertion or other D1 fixture changed. |

Before/after compile wall/CPU/peak RSS KiB, single samples: filesystem
4.87/4.79/188372 to3.94/3.89/187944; audit11.03/10.80/335904 to8.84/8.74/335568.
Identical emitted objects establish unchanged runtime code for those bounds;
variable compile times establish no speedup. Runtime reads/audits and per-report
symbol scans are below0.01s resolution, around1.3–1.6MiB process RSS. The symbol
policy adds constant exact membership entries, without new heap owners. No live
allocation/retention measurement is inferred from RSS. The synchronous checker
has no profitable parallel work or scaling claim.

Canonical current native rebuild9steps passes70.98wall/69.68CPU/432400KiB; entity
leaf9.05/8.87/278512. Fresh WASI entries respectively30.37/29.78/751832,
33.49/32.91/763356,9.80/9.66/346196,8.83/8.73/347648 and12.46/12.14/310324.
Query-smoke passes0.27wall/.26CPU/62872KiB. Complete native compilerde6c1330
and resources are copied/verified in native_package_72a218. This is affected
incremental evidence, not clean-cache generation/browser/release acceptance.
All measured children report zero swaps; host preexisting swap remains explicit.

Supported LLVM19 address/thread instrumentation of exact owned tool/fixture IR
passes with the matching instrumented guest runtime and actual hooks:11 symbol,
40 filesystem,400 audit and662 linker definitions. Address leak detection is on;
small/large audits and serial/two-requested-worker link products match normal
bytes. Those small inputs do not establish worker overlap. Source-level UBSan
and foreign/system-library instrumentation are not supplied by this mechanism.

The existing real-barrier linker fixture is therefore checked separately. Its
original native entry compiles18.71s, object5.87s, but link fails1 on missing
compiler_buffer_free/allocation_size/allocate/alignment. With the separately
compiled existing host/memory provider, normal3 and ASan/LSan3 pass, each printing
real relocation-kernel overlap; error-order and cancellation assertions execute.
The FIRST TSan run fails66, before the two remaining repetitions. The report
identifies a4-byte worker read in wasm_link_job_execute against a main-thread
write in wasm_link_fail called by wasm_link_jobs_run. Worker shallow-copy of
`*job.owner` reads the shared error field while the cancellation branch writes it
before its deferred drain. Proposed B2-owned correction: drain admitted workers
before changing the parent's cancellation error, retaining unconditional cleanup
and pinned inputs. No backend production edit, suppression or retry-until-pass
was performed. This is a real unresolved race, not a sanitizer setup failure.

D1 then authorized the sole native-entry allocator import. After drain, final
public IR22.03wall/21.52CPU/517480KiB, object9.53/9.23/155232, link.06s and
native3 pass, with exactly one compiler_buffer_free definition. This fixes
provider composition, not the race. Its final sanitizer rerun awaits B2's repair.
Full source/IR/objects/binaries/statuses and original failures are exported in
D2/linker_cancellation_race_receipt.tar81297fc5; minimal provider patchf2d71650.
D2 releases its drained slot08:12:41UTC and records the concrete B2 request in
status. Current coherent race acceptance and final integration/publication remain
open; earlier successful receipts are neither erased nor broadened.

### ROOT75 receipt/page union: source review only (2026-11-23)

Verified complete bundle5fe3be67/sole60741 and merged as7f09c731 after all owned
jobs drained. Assigned tools/benchmarks, policy fixture and authorized reader
entry are byte-identical to committed a6ba2e9e. Compiler/library ABI changes below
are locally unbuilt; de6c1330 receipts continue to name ROOT72a inputs.

| Supplemental path / reviewed75fdf0bf source | Ownership and measurement disposition |
| --- | --- |
| `tests/entity_locality.tower` | Page retention now reads the page-owned WorkBuffer's requested physical allocation size, including compiler header. This replaces allocator-private malloc usable bytes; old/new memory figures need distinct labels. Stable type pages still permit holes and retained pages, and packed traversal is a disposable snapshot whose construction time is reported separately. This is not proof of packed authoritative payloads or wholeheap accounting. No new D2 performance sample. |
| `tests/entity_component_layout.tower` | New target-layout/reference fixture checks shared small-payload page, exact strides/back-pointers, large aligned fallback, denied growth preserving membership, page retention until last payload and zero final grants. Sizes/offsets derive from target types and allocator capacities, so one source can run native/Wasm32. Prints are measured allocation/layout values, not a throughput benchmark. Owner receipt exists; independent D2 execution is pending. |
| `compiler/type_object_index_types.tower`, `type_object_index_api.tower` | The disposable execution index owns one accounted vector and sticky receipt, borrows canonical type descriptors, and requires its frozen budget through every call. Zero signals failure; denied growth retains prior entries/grant. Readers must drain before disposal; copying a live owner is forbidden. Existing interpreter providers own implementation, and project packaging must follow the emitted depfile closure. No new ambient registry or alternate Foundation graph. |
| `compiler/execution_session.tower`, `execution_package.tower` | These earlier routed output gates now reject the shared fixed resource receipt independently of diagnostic allocation. Counted text keeps explicit spans; failure flag/offset survives a failed presentation copy, and package failure clears output. This source closes those particular text-only admission gaps, not the still-pending B2 service/backend consumers or the whole current runtime. |

Shared SemanticProgram, interpreter indexes/frames and component-page descriptors
changed. Next builds must rebuild all affected ABI consumers and inspect actual
new native/WASI undefined symbols before any exact policy additions. B1 grammar,
B2 output/world consumers and linker cancellation repair remain later inputs.
This integration/review does not add executable logic; new performance testing
of the documentation is inapplicable, and source-union runtime acceptance remains
open. Complete prior source/tool/compiler receipts are archived as220MiB
policy_72a_receipt.tar464fdf04; no newer source identity is assigned to them.

### Independent owner cancellation repair and registration review (2026-11-23)

The earlier unresolved linker race is now independently reproduced and cleared
for its exact fixture. This does not close unrelated resource/publication work.
Source is97d934a6 (complete ROOT75 plus D2 changes), before archive5a183f1e,
after ONLY ROOT-authorized B2 patch5d8b5a62. Both sides use the final native
reader's single host.memory provider; previous separate-provider receipts remain
historical. No competing backend implementation was introduced.

| Supplemental reviewed path | Ownership, evidence and disposition |
| --- | --- |
| `backend/wasm_link_jobs.tower`,97d934a6 + B2 patch5d8b5a62 | Workers borrow the entire shared linker owner when making private snapshots. Cancellation must join before graph lease cancellation and shared error publication. The owner adds that drain; unconditional deferred drain/view close remains. Original shared inputs, private job errors/output ranges and source-order selection are unchanged. Matched current before firstTSan66 versus after normal3/address3/thread10 passes; no universal alias/race guarantee. |
| `tests/wasm_link_reader_native.tower`,a6ba2e9e | Same one-provider entry on both sides; unchanged shared reader exercises a real two-worker barrier, canonical bytes, pinned close rejection, error order with requested1/2/4 workers and cancellation1/2. Every normal and successful instrumented stdout matches. Two host CPUs do not establish useful four-core scaling. |
| `cmake/TowerRuntime.cmake`, D1 draftcb7943f5 on2c1eec38 | Necessary build boundary only: consumes explicit SOURCE before symbol bindings in sanitizer IR, direct object and bound optimized IR; default library mode and remaining binding order remain. No second runner/compiler/provider. D2 read the full patch and caller scopes; no source issue found. D1 reports actual native/address/thread checks; direct unbound SOURCE branch remains unrun. No D2 manifest edit. |
| `cmake/TowerWorkTests.cmake`, `TowerWorkPolicyTests.cmake`, same D1 draft | Existing outer scope supplies real renamed transport/dispatch objects to deferred policy registration. Receipt/order bodies join existing LR providers; mutable dispatch fixtures use ordinary-source initialization and exact runtime_bind names. Existing body assertions remain. Source review is separate from D1's runtime receipt and final coherent integration. |

SteamDeck Linux x64, Docker4be584fb, public9653, LLVM19.1.1, cpus0/2, jobs1,
normal O1 objects, warm filesystem/fresh processes. Before public IR17.55wall/
17.28CPU/518604KiB; after16.69/16.44/519648, one build each. Native3 runtime
is below.01s wall/CPU both sides, RSS2052–2064 versus2124–2128KiB. These samples
cannot establish a throughput change or meaningful allocation/retention delta.
After address3: .05–.08wall/.04–.07CPU/39468–41324KiB; thread10:
.04–.08wall/.03–.07CPU/31420–33780KiB. All measured swaps0. Before failed
TSan is not completed-throughput evidence; its exact status66/reportc8f1fbb9
remains preserved without retries. The symbolizer's missing `[stack]` filename
message does not invalidate the explicit conflicting function stacks.

Actual709 emitted definitions,341 ASan access/memory hooks and1871 TSan access
hooks, matching instrumented guest runtime and one allocator provider verified.
LSan enabled. Lifecycle assertions check drained views and preserved output;
there is no full heap-allocation census, source UBSan/system-library coverage or
per-worker idle attribution. All owned children drained before08:41:50UTC release.
Complete paired sources/IR/objects/binaries/logs/script are exported as
D2/linker_race_75_receipt.tar9f5bf0be (118MiB). Frozen hashes pass. Final whole
compiler/public-bootstrap/browser/generation and leased publication remain open.

### ROOT556 and B1 declaration joins: provider review (2026-11-23)

After draining the reader run, verified D1 full9842 history69ca7536 and both
receipt archives86cc230a/a7dd76b5; merged fddf5978. Reviewed final helper/phase/
registration deltas, preserving owner provenance and all test assertions. Actual
archived native/instrumented statuses are0; this is independent receipt review,
not a local rerun. Then verified ROOT556 bundleb47a3c0a, merged9ddf06b7, and
complete B1 declaration3992 bundle536b7436, merged53ec9830 before the next build.
All33tools/7benchmarks and owned symbol/reader fixtures retain716e bytes. Incoming
production consumers are source-reviewed; the combined compiler is unvalidated
at this paragraph's checkpoint.

| Supplemental paths / reviewed source | Ownership, provider and measurement disposition |
| --- | --- |
| `library/entity_stage.tower`, `entities.tower`, `entity_api.tower`, ROOT556 | Typed open/view/publish results preserve precise Busy/Exhausted/Invalid/Memory causes with caller-owned receipts. Publication prepares table/child/name capacity before commit and unprepares failed reservations; membership, IDs, leased payload addresses and queued holds remain unchanged on failure. Reclaiming anchors reject owning-stage admission before retain. Stage/name/side-index allocations remain raw/unbudgeted; exact errors are not a wholeheap cap. Existing entities provider owns exports, old wrappers remain. Owner9776 native/portable/stress/instrumentation/profile evidence is scoped to that input, not53ec. |
| `tests/entity_stage_result.tower`, `entity_stage_result_faults.tower`, ROOT556 | Both include entities/stage plus host.memory, so generic registration must not add duplicate entity-create/memory providers. Normal checks actual reclaim callback, queued holds before last pin, duplicate names, exhaustion, stable addresses and retry. Fault checks measured baseline owners, mixed fresh/leased publication rollback and exact zero final allocation/budget state. Fault allocator remains serial; no thread-sanitizer substitution. D1 received this composition review; D2 has not executed these new fixtures. |
| `compiler/world.tower`; `syntax_version.tower`, `syntax_version_build.tower`, `syntax_version_cache.tower`, ROOT556 | Existing entities-owned compiler_world_type_result reports the actual constructor failure to parser version callers. No separate provider or ambient registry. Inspect emitted component imports before adding an exact policy entry; source expectation alone is not permission. |
| `compiler/semantic_evaluation.tower`, `semantic_evaluation_work.tower`, `semantic_declarations.tower`, `semantic_query_api.tower`, ROOT556 | Canonical failure selection takes owning query kind. Clone-only KnownSnapshot restores KnownClone failures; evaluation pumping retains its own frontier and pending predecessors. Existing semantics provider gains clone_all export; the32-case owner fixture extends prior28 rather than relabeling their results. No new graph/index or evaluation semantics. |
| `compiler/syntax_reader.tower`, `syntax_revision.tower`, `syntax_session_next.tower`, `syntax_session_setup.tower`,3992 | Existing rule/token/declaration wrappers delegate to exact per-call result APIs. Component admission, overlay and failed diagnostic allocation preserve cause; first session failure survives missing message storage through a fixed fallback. Comments and declaration-index failure return through existing ownership cleanup. No new parser graph/provider. Actual native/WASI symbols remain the policy gate. |
| `compiler/syntax_session_format.tower`, `syntax_emission.tower`, `syntax_scan.tower`,3992 | Format admission and verification reject typed failure before canonical output publication; emission/scan use component-add results instead of losing admission cause. Ordered grammar activation remains serial. Owner source evidence does not claim remaining pattern/LR/legacy allocation paths are fully accounted. |

L2's proposed sem_generic_body_request/copies_execute exports are not yet in this
join. Current definitions belong to semantics; generic_clone_parallel is an LR
client. An export plus an LR-only extern call need not add a production-unit
allowance. Verify actual source/object consumers before modifying the policy.
Existing packaging fixture's earlier two-unit export took.02s/2236KiB; this is
not full current reactor packaging or a demonstrated repeated-loading bottleneck.
No speculative cache/rewrite follows that observation. Final current package
performance/retention and coherent release checks remain open.

### Actual53ec provider policy validation (2026-11-23)

The pending native check above completed: small stage/reader leaves pass
5.43/26.93wall seconds,206696/639116KiB RSS. Canonical public16-target native
build passes170.01wall/166.12CPU/740688KiB, zero swaps. Actual compiler
c6917748ef4a70a93b82b695409829ebb52c559e7bade80089b47f53557c7071
and all50 adjacent resources are copied and hash-verified in native_package_53ec9830.
This compiler has not yet received D2's current runtime/query/generation gates.

The old exact policy passes six actual native units but rejects ParserNodes on
four observed imports. All four definitions are present in the existing entities
object; source/callers were reviewed before editing only these two owned files:

| Path /53ec plus exact patch23980e3d | Current disposition |
| --- | --- |
| `tools/bootstrap_symbols.tower` | Adds only ParserNodes permissions for compiler_world_type_result, entity_component_add_result, entity_create_related_result and entity_create_result. Existing world/entity provider and caller-private results remain; no wildcard, second provider, storage owner or scheduler. Just-exported B1 reader/declaration helpers are not additional imports in these checked units and receive no speculative permission. |
| `tests/bootstrap_symbols_checks.tower` | Existing fixture adds the four positives and prefix/suffix/wrong-unit negatives. Smallest unit compile/link and ordinary execution pass; exact current address/thread instrumented fixture and guest pass with identical stdout/empty stderr. No generic harness change. |

Before and after scan identical frozen reports. Old native parser1 and fresh
WASI parser1 failures list the same four names; after all seven native and fresh
WASI parser reports pass. New checker66496c86 builds canonically6.64wall/6.42CPU/
196516KiB; fixture5.88/5.68/179936. WASI parser27.06/26.72/759644. Report scans
remain below.01s wall/CPU and1348–1352KiB RSS, so no throughput or retained/live
allocation claim. Fixed-string membership adds no heap owner/concurrency path.
One compile sample per input is validation timing, not a speed comparison.

Actual11 fixture definitions/4ASan/11TSan access hooks plus matching guest runtime;
LSan enabled. Address.02wall/.01CPU/13988KiB; thread.01wall/below.01CPU/27440KiB.
All swaps0. The synchronous checker has no useful worker scaling; this is scoped
memory/access instrumentation, not threaded compiler sanitation or source UBSan.
All children drained and frozen hashes pass before09:02:00UTC lock release.
Complete34MiB receipt D2/policy_53ec_receipt.tarff9a5d3f includes current source
archiveb20a5a51, two-file patch, raw failures/times/statuses, actual native objects,
WASI parser, both checkers/instrumented fixtures and complete compiler/resources.
Other current WASI consumers, runtime/query, full package measurements, clean
bootstrap/browser/generation and final integrated publication remain open.

### Current source-package execution and remaining tool budget boundary

Existing compiler_project_units on7fb8/core53ec exports current real entities/
evaluation depfiles in.02wall/.01CPU/2364KiB. Both new TypeIndex declaration
modules are present byte-for-byte. Recompiled native entities and evaluation
objects are each identical to their current originals; fresh original/exported
WASI evaluation objects are identical and pass the exact Interpreter policy.
No manual resource manifest or additional provider is necessary. This is a checked
two-unit source slice, not full reactor packaging/live-retention measurement.

Current exactc691 ordinary interpretation of known_bindings prints0 at jobs1/2,
2.34/3.57wall,2.30/3.94CPU,182956/190668KiB, one sample each. D1's independently
passing same-production query/parser/grammar/receipt tests use a different linked
query fixture object and executable; those are separate evidence. Two requested
workers and these times do not establish useful scaling or measured overlap.

Initial target request used an unbuildable CMake INTERFACE name and fails1;
original script/logs/group status remain. Actual Ninja object target names were
verified, jobs drained, and only the OS invocation corrected. Resume runs only
pending steps and passes, with sourcehash unchanged. Native export recompilation
16.26wall/15.65CPU/323320KiB (entities),14.10/13.62/323264 (evaluation); original/
export WASI8.47/8.38/320420 and9.57/9.29/319988. All measured swaps0. Slot released
09:17:19UTC after drain. Complete21MiB receipt package_7fb8_receipt.tard4323c5b
includes source, objects/depfiles, scripts/failures/results and complete compiler/
50resources. Documentation records evidence only; no new runtime logic to profile.

Remaining explicit tool-world budget gap at7fb8: link_wasi and wasm_link_audit
still call wasm_link_init ->wasm_link_world_open ->entity_store_create(), whose
standalone budget is null/unbounded. Linker work_init/work_pool_open_kernel also
lack a shared budget. Worker/grain bounds and guest maximum_memory are not host
allocation or outer/nested budget limits. Mapped owners still outlive drained
link work and teardown. The earlier provider/TSan corrections do not close this
accounting gap. Routed to B2 for one complete owned constructor/budget contract
before adapting these D2 CLI callers; no guessed cap/global ledger/competing API.
Final whole-package/runtime/generation/publication acceptance remains open.

### World/query and counted-regex integration review

Reviewed full ROOT351 and B1dce8 histories after D2 jobs drained, merged as
8db1499e6e85939d98b60f7f959a3d58a76522bd. Prior D2 policy/package receipts
remain exact7fb8/core53ec; they do not validate this changed world/semantic ABI.
The original40 assigned tools/benchmarks remain unchanged in this integration.
Supplemental consumer dispositions at8db1499e:

| Paths | Ownership/scheduling conclusion and evidence limit |
| --- | --- |
| `compiler/world.tower`; `compiler/frontend_units.tower`; `backend/units.tower` | New typed constructor charges world/store descriptors before exposing the owner; unit world, graph and pool borrow the synchronized batch ledger. Backend acquires the frontend graph only after target/pool setup succeeds. Legacy null-budget constructors remain explicit boundaries. Review finds no competing scheduler or new authoritative graph; coherent current runtime validation is pending in D2. |
| `compiler/frontend_compilation.tower`; `compiler/frontend_modules.tower`; `compiler/completion.tower`; `compiler/language_query.tower` | Preserve parser/module/program resource receipts before diagnostic allocation and skip successful publication on failure. Optional text recovery cannot clear the fixed receipt. Imported session/depth teardown remains in the owning module path; completion disposes failed private queries. |
| `host/driver_compile.tower`; `host/ide_execution.tower`; `host/ide_artifacts.tower`; `host/ide_state.tower`; `backend/session.tower`; `backend/source_session.tower` | CLI, execution, package and IDE gates consume resource state independently of text length. Static fallback text is borrowed and reset separately from owned output buffers. New synthetic receipt fixtures are consumer checks, not physical producer denial or browser-runtime proof. |
| `compiler/semantic_type_execution.tower`; `compiler/semantic_generic_body_work.tower`; `compiler/semantic_evaluation.tower` and their declaration/body/constructor consumers | Query identity and target/revision/dispatch checks remain shared. Results become ready after terminal completion; joined failure drains remaining invocations without peer publication. Generic waves hold staged references before closing input views and discard unpublished stages before releasing grants/cancelling graph. Current generic stage/view/publication boolean fallback still loses non-Memory causes; L2 owns the pending typed-result followup. |
| `compiler/regex_lowering.tower`; `tests/regex.tower`; `tests/frontend_main.tower` | Counted result validates parse spans and output-table state, separates actual Memory from semantic rejection, preserves legacy root-span wrapper and embedded NUL. Allocation sweep derives its bound from successful calls; independent regex oracle and existing selector remain. Current production callers frontend_pattern/frontend_table still use the old wrapper. No new symbol-policy allowance follows merely from exporting the new API; inspect actual native/WASI imports first. |
| `tests/semantic_query_failure_checks.tower`; proposed D1 registrationc98d06d0 | Real interpreter suspension precedes denied producer admission; joined peers are disposed without publication, repeated pumps preserve counts, final ledger ownership is zero. D2 independently reviewed the exact registration: one existing exported-main object, original compiler libraries and actual worker entry, three selectors, no provider/wrapper duplication. D1 owns runtime/instrumented registration evidence; patch is not adopted independently here. |

Newer ROOT09:23 trace corrects the historical phrase "late semantic failure":
peak-minus-one Capacity currently becomes Memory in B1 replacement preparation,
before semantic_compile, at source offset3436. The required Capacity oracle stays
failing; the earlier phase label is superseded, not its preserved failure evidence.
WasmLinkWorld remains separate from CompilerWorld: this merge does not resolve
D2's linker tool budget gap above. Full B2 contract/caller adoption is pending.
This subsection records source review and integration only; no runtime logic was
changed by D2, so before/after runtime profiling is inapplicable to this text.

### Current publication-import policy and generator extent follow-up

At reviewed0ce8c203 plus exact owned patchf412edfd, the40 primary assigned paths
remain covered. The relevant supplemental driver file is explicitly handed off
by D1; no generic harness or shared build manifest changes were made.

| Path | Current ownership/storage/scheduling disposition |
| --- | --- |
| `tools/bootstrap_symbols.tower` | Actual current native Semantics imports require three entities-owned typed stage/view/publication results. Permit exactly those names only in Semantics. Frozen report before/after and fresh WASI checks pass after correction; prefix/suffix/wrong-unit fixture negatives retain exact boundaries. Fixed-string scan has no new heap owner or useful worker scaling. |
| `tests/bootstrap_symbols_checks.tower` | Same existing fixture now exercises the three imports and invalid neighbors/units. Public smallest unit, ordinary execution and actual address/LSan plus thread instrumented fixture pass. Serial fixture instrumentation does not establish compiler concurrency or external-library/source-UB coverage. |
| `tests/driver_measure_cases.tower` | D1-authorized generator maintenance uses its existing private ByteBuffer with lexical disposal and measure_number; one element count derives allocation/fill/modulus. It adds no ECS authority, shared state or scheduler. The initially emitted runtime count is rejected for actual substantial regression despite correct outputs. Final generator-side derivation aims to preserve both original Foundation files exactly; final validation is pending, not an accepted performance fix. |

Current0ce canonical native passes8targets114.49wall/111.04CPU/748980KiB.
Old actual Semantics policy fails1 on exactly stage_open_result,
stage_publish_result and view_open_result; all seven native reports pass with
checker6c6e44b5. Fresh WASI semantics33.32/32.82/786452 and parser24.25/24.07/
762224 pass (seconds/seconds/KiB). No speculative permissions for unused exports.
The symbol fixture has11definitions,109ASan report sites and11TSan memory-access
calls; matching guest address/LSan and thread runs pass. All measured swaps0.
These measurements and full failure history are in the journal and retained
policy_0ce8c203 artifacts. This is not the newer A2/L1 ABI union or final release.

The rejected runtime-count workload preserved outputs2492321792/3197601747 but
increased seven-sample LLVM median47.624 to87.973ms and raw Clang/GCC medians
102.987/108.373 to572.581/593.103ms. Mutable divisor loads appear in emitted C;
causality is not isolated. Final literal emission through a single generator
count requires exact code/output comparisons before acceptance. The ordinary
Foundation simple-operand parse failure, wrong-directory hash wrapper failure1,
missing Docker rg127 and denied root-owned host redirect remain recorded.

### Prospective complete ABI union review (not yet adopted or executed by D2)

Complete ROOT76d297c2 bundle4e5e70e9 was verified against sole prerequisite60741
and fetched read-only during the D1 slot. It includes ROOT9d73, A2e28, L164c and
B1's typed LR result1944d6a0. Current D2 count comparison stays frozen at0ce.
This review does not relabel earlier native or instrumentation receipts.

| Reviewed paths in ROOT76 | Consumer/ownership disposition |
| --- | --- |
| `library/entities.tower`, `library/entity_types.tower`, `library/entity_stage.tower` | A2 indexes only free page slots in dead descriptors; live component addresses and type indices remain stable. Joined publication transfers partial pages from stage-private pools to the store pool after all owners publish. The first free in a full detached page relinks to its owning pool. New page header changes ABI; coherent consumers must rebuild. Churn savings do not erase measured metadata overhead. |
| `tests/entity_page_reuse.tower`, `tests/entity_stage_reentrant.tower`, `tests/entity_page_churn.tower` | Explicit target retains/finalizers, held staged references, stable live addresses, store versus other-stage page ownership and final zero grants are checked. Reentrant publication uses separately live parents/types, not the dying owner. Churn measures one survivor per actual page and derives counts from observed data, preserving independent value/finalizer oracles. Linux clock/rusage is only the measurement boundary. D1 owns durable fixture registration. |
| `tests/compiler_storage.tower`, `tests/compiler_work_profile.tower`, `tests/entity_component_budget.tower`, `tests/entity_component_faults.tower`, `tests/entity_pages.tower`, `tests/entity_stage_result_faults.tower`, `tests/work_constructor_budget.tower`, `tests/work_schedule_budget.tower` | Current parser resource receipt remains terminal on reread. Page expectations now reflect published store pools. Fault sweeps derive bounds from successful allocation counts; graph boundary cases derive actual capacity/charged allocation sizes. Shared worker-count/cancellation tests retain real pool handoff, join and zero-owner assertions. The ordinary raw nodes/membership indexes remain outside the measured page subtotal. |
| `compiler/interpreter_types.tower`, `compiler/interpreter_storage.tower`, `compiler/interpreter_abi.tower`, `compiler/interpreter.tower`, `compiler/fast_interpreter.tower` | L1 moves node-cache storage into the invocation's shared work_vector ledger and admits it before executable lookup. Full entity key validates a cache hit; the actual cache length supplies the mask. Early target check reads the checked node directly without allocating. Both graph disposal and fast takeover release cache grants. IMState layout changes; no fixed-mask optimization survives. Other raw maps and frame members remain explicit separate accounting scope. |
| `tests/interpreter_call_query.tower`, `tests/interpreter_storage.tower`, `tests/semantic_resource_checks.tower` | Startup boundary table includes actual cache bytes and checks which owners can exist at each failure. Capacity/physical Memory checks distinguish exact outcomes and final release; returning a budget cannot replay a terminal failed invocation. Existing concurrent nested-growth case stays16KiB with its8KiB frame and real gates. Serial injected failures remain distinct from production-allocator concurrency evidence. |
| `compiler/lr_api.tower`, `compiler/lr_runtime.tower`, `compiler/lr_runtime_work.tower`, `compiler/lr_work.tower`, `compiler/parser_workers.tower`, `compiler/parser_table.tower` | B1 carries per-call/per-row buffer/admission errors through serial and worker table construction. Workers write private preallocated result ranges; the coordinator consumes source order after synchronous drain, preserving an earlier grammar conflict over later failure. Legacy wrappers stay; table fallback cannot overwrite a precise typed error. Existing parser worker pools and graph remain unbudgeted paths, so this error repair does not close all parser allocation accounting. Fresh actual imports must be measured before exact policy additions. |
| `tests/lr_budget.tower`, `tests/lr_runtime_faults.tower`, `tests/lr_work.tower`, `tests/storage_main.tower` | Invalid/Capacity/Memory/None outcomes are checked independently; serial and explicit-worker paths retain complete conflict/retry/table equality checks. Fault storage derives from successful calls; the existing serial-transport guard precedes the narrow runtime-faults selector. Busy worker lease is explicit. D1/coordinator authorized registration ownership remains separate. |

Owner evidence says the previously failing peak-minus-one Capacity oracle passes
unchanged in B1's source. The historical0ce/85c failures remain source-specific;
D2 has not yet run that new union. L1's fixed-path controls supersede earlier
path-sensitive attribution. A2 reports substantial churn savings and repeated
four/eight-worker metadata regressions, both retained in the journal. This review
changes documentation only; runtime profiling of this prose is inapplicable.

Final extent disposition at0ce+f412: accepted by actual scoped checks, superseding
the pending sentence above. Existing runner passes, generated long/short Foundation,
raw/optimized C, native executable and fresh native objects all match baseline
bytes; outputs2492321792/3197601747 and canonical32/64jobs1/2 roundtrips match.
Current complete driver/standalone/bytes address+LSan/thread instrumentation passes
with matching guest, including the changed generator; child compilers remain the
public binary. Full group11.40->11.02wall,10.76->10.58CPU,122328->120284KiB is one
sample per version, not a speed claim. Seven-sample executable medians remain
noisy despite byte identity; do not attribute them to changed runtime code.
ByteBuffer is private/disposed; append-sequence allocations were not separately
counted and peak RSS is not live heap. Failed grep wrapper1 is retained; only
remaining checks resumed and passed0. All jobs drained before10:10:18slot release.

Exact D1 registration2d03795d is also independently source-reviewed: one existing
production pool main/worker entry plus two normal entity fixture factory entries,
no duplicate provider or wrapper;16slot cases and stable/reentrant oracles remain.
It is not yet part of this D2 source or its runtime receipts.

### Complete histories now adopted at dee8076e

After the0ce count/policy jobs drained, merged complete ROOT76 asd799e6f9,
A19549559a, L260fc53e and D1e47e571c asdee8076e89411d64ddb2bffb80b8924e511e4580.
Own3020df41f measured changes remain intact, todo matches, and the journal's
incoming encoding repair now passes strict UTF8. The prospective table above is
now an actual source review; runtime evidence remains explicitly0ce until the
prepared coherent build runs. No intermediate obsolete ABI build was launched.

| Additional reviewed path | Disposition at dee8076e |
| --- | --- |
| `compiler/semantic_capture_work.tower` | Query/semantic failure gates precede capture metadata creation. Reserve/seal the shared graph request first; failure restores a caller-owned cause and declaration offset without attaching a partial capture component. Existing request identity is reused. Later capture component/storage assertion paths remain outside this narrow admission fix; no claim of complete capture allocation accounting. |
| `tests/semantic_capture_admission_checks.tower` | Sixteen32/64-target,1/4-requested-worker cases exercise healthy/cancelled/Capacity/prior-Memory receipts and exactly-once metadata. Capacity pressure belongs only to the graph budget; its world is deliberately separate. No worker executes in this admission fixture, so requested width is not overlap. D1 owns its durable four-selector registration. |
| `tests/generic_pump_publication.tower` | Actual sem_workers_open replaces a fixture-only unbudgeted pool. The fixture checks physical slot bytes, owning world ledger, unchanged lane admission, and normal semantic-context disposal. Existing Busy, copy/stable-address and zero-final-owner oracles survive. This is a test correction; production is unchanged. |
| `cmake/TowerWorkPolicyTests.cmake`, `cmake/TowerWorkTests.cmake`, `tests/README.md` | D1's reviewed2d037 normal registrations are now adopted through completee47 history. They reuse existing providers, main entry and worker transport, preserve output/object checks and do not register the churn measurement as a default test. D1's85c native receipt remains separate from pending current-union instrumentation. |

Original40 assigned tools/benchmarks remain complete; these supplemental files
were reviewed because they affect consumer layouts and validation composition.
Documentation-only adoption notes require no runtime profiling of their text.
Prepared source archivec7aab05b and current-manifest checks will identify the next
actual build; no publication readiness is inferred from source integration.

Current integration gate: D1's matching ff3a query-smoke fails134 because Cancel4
has four distinct but nonoverlapping clone intervals after a2ms serial calibration.
This is not a passed concurrency case. L2 owns calibration followup; D2 preserves
the failure and advances independent native/resource/units/provider evidence.
No unchanged repeat-until-pass or oracle relaxation. D1 capture registration
95f78b31 was source-reviewed separately: original provider/main composition,
four modes, explicit graph-only/no-execution scope; not adopted during live build.

### Actual coherent evidence and final exact parser permission

Reviewed/built dee8076e plus two-file eaca3107. The prospective next-build notes
above are superseded by actual native13targets151.79wall/147.87CPU/747808KiB and
focused11targets65.41/63.58/412024 passes. Current compilerda9f8a4c and complete
resources are preserved. Correct constructor/body/declaration failures, resource24,
fullunits59.19/75.94/802532 and runtimefaults pass. The unchanged Capacity oracle
is now independently passing on this union. Original invalid wrapper selector1
is retained and only pending checks resumed. Whole query-smoke's actual Cancel4
nonoverlap remains a separate failed gate owned by L2.

| Changed owned path | Disposition and evidence |
| --- | --- |
| `tools/bootstrap_symbols.tower` | Actual ParserNodes report requires entities-owned entity_view_open_result. Add this one exact permission to its existing typed-admission list. Old native and fresh WASI reports reject1 solely this name; new all7native and freshWASI parser/semantics pass. Fixed-string serial scan remains below.01s wall/CPU,1616KiB before/after; no heap/concurrency owner or speedup claim. |
| `tests/bootstrap_symbols_checks.tower` | Adds exact positive, truncation, suffix and wrong-Utf8-unit negatives. Public smallest compile/link/normal pass. Actual current address/LSan and thread fixture checks with matching guest pass,109ASan report sites/11TSan accesses,11definitions; no full compiler/race/UBSan claim. |

Fresh WASI parser24.17wall/23.97CPU/759768KiB, semantics27.67/27.45/785280
pass. Checkerf502529a builds canonically4.94/4.81/196176. All child swaps0.
All children drained/source hashes passed before10:32:45 heavy-lock release.
No old partial-stage/header/cache receipt is relabeled as this union. Root now
owns the stopped B2 lane's remaining linker-budget contract; tool adoption waits
its complete constructor/argument-order/lifetime coverage. Final release remains
open. Documentation review/receipt additions themselves require no runtime profile.

### Linux capacity owner extension — reviewed565cd436e, implementation pending

ROOT assigns one additional host boundary to D2; the original33tools/7benchmarks
remain fully audited. This is a supplemental production audit, not a claim that
the host module is itself a tool or a new scheduler.

| Path/callers | Storage, ownership, scheduling and disposition |
| --- | --- |
| `scaffolding/host/work_linux.tower` | Existing get_nprocs observes online machine CPUs, not the calling thread's actual affinity. Own container allows0,2 but reports8 online. Semaphores and pthread handles are private host allocations; close joins before releasing the handle. Proposed capacity query owns a temporary word mask, with checked growth and no global cache, and frees it before any dispatch. Preserve public signature and shared maximum. OS/allocation errors must not admit online-count threads. Direct before/after runtime evidence pending; cgroup quota/other platforms remain explicit gaps. |
| `library/work_pool.tower`, `compiler/world.tower`, `compiler/worker_policy.tower`, `compiler/frontend_units.tower`, `backend/units.tower`, `backend/wasm_link_jobs.tower`, `host/driver_units.tower` | Reviewed all production capacity callers. Pool clamps before slots and rejects0; world rejects0/above maximum; unit ledgers reject0 after clamping. Worker policy intersects immutable world capacity; linker can stay serial. Driver default fallback still meets frontend admission. No second graph or resource registry is needed. Keeping a valid world does not make later affinity immutable; query remains per-call. Owners retain their existing drain/publication contracts. |
| `tests/work_signal_observe.tower`, `tests/sanitizer_race_probe.tower`, fixed-four shared work/entity fixtures and explicit worker profiles | D1 coordination requested before any provider or registration edit. Transport-only signal observer will need existing memory provider if capacity imports compiler_buffer APIs. Fixed-four assertions require four allowed CPUs once admission is truthful; no silent relabeling, barrier weakening or repeated-until-pass oracle. Existing two-lane cost comparisons remain two-lane. |

No code edits or runs belong to this review entry. ROOT565 changes interpreter
layout; all older current-package checks retain their old source identity.
Pending build_d2 package_b5 script is unrun/stale, not evidence. Primary Linux
ABI references and exact next measurements are in the matching journal entry.

### Affinity implementation and evidence —565cd436e plus owned patch

| Path | Current review and disposition |
| --- | --- |
| host/work_linux.tower | Current thread mask replaces online-count admission. Stack-first native-word storage grows on documented size error, with checked doubling and compiler-buffer cleanup; count uses actual extent and shared maximum. No global cache/world or new scheduler. Errors return0 to existing admission. Public leaf/native build, actual restricted per-thread behavior, serial large-mask/failure oracle and real scoped sanitizers pass. OS quota/affinity changes after snapshot and non-x64 execution remain gaps. |
| tests/work_linux_capacity_profile.tower | New D2 own profile, explicit numeric arguments, repeated checked query count and actual pool slots plus joined dispatch. Measures query interval separately from pool setup; no queue-width/overlap assertion. Public predecessor, baseline/after and paired timing pass; no new generic harness. |
| tests/work_linux_affinity.tower | New real-host regression uses independent libc count, private stack masks/jobs, inherited production workers, entered/release handoff, parent isolation and restoration before join. All loops derive actual arrays/host capacity. glibc128-byte reference mask is an explicit fixture ABI extent and fails clearly if insufficient; larger production mask behavior is covered by the separate fault fixture. Actual two-CPU case and address/thread runs pass; one/unrestricted host cases pending. |
| tests/work_linux_affinity_faults.tower | New ordinary Tower source with one single-owner borrowed local test-state pointer for foreign wrappers. Separate actual production transport uses the real compiler allocator. Sparse high IDs/64seeded libc comparisons/empty/full/shared cap/errors/allocation denial/retry/zero retained bytes pass.544B observed temporary peak. Serial counters never accompany concurrent workers. Exhaustive usize overflow/physical enormous masks are not executed. |
| tests/work_signal_observe.tower | D1-approved one-import provider correction after exact changed-transport unresolved-symbol reproduction. Private signal ownership unchanged; baseline/after try/wait and both supported instrumented profiles pass. Extra compile/link cost is a necessary provider consequence, not an optimization. |
| tests/compiler_work_profile.tower | Unchanged shared measurement entry reused for checked private graph/entity plans. Actual1/2overlap and complete owner retirement; after2workers remains slower than after1 despite overlap. Charged graph/component subtotal and variable concurrent peaks do not represent all raw-node heap storage. |
| cmake/TowerWorkTests.cmake | OwnerD1. Exact source/composition sent for review and registration, no D2 edits. Public manual fixture execution is evidence; registration and integrated release remain pending. |

Paired compiler medians, noisy serial regression and the running fixed-path
followup are preserved in the matching journal. All32paired outputs/objects pass,
all24scoped instrumented executions pass. No current whole-union/browser/generation
or publication claim. New ROOTbff input waits until current freeze drains.

Final host-fix followup: real one-CPU1/1 and unrestricted8/2 tests pass; normal/
address/thread pool stress passes actual2and4workers with complete failure drain.
Temporary full-host allowance restored0,2. Current instrumentation covers the
actual host/fixture/guest code; source UBSan/foreign-library/AArch64 and final
joined compiler/browser release remain explicit gaps.

| Additional/current path | Review/disposition |
| --- | --- |
| tests/work_linux_capacity_profile.tower and unchanged host/driver_options.tower helper | D1 malformed review led to reuse of driver_unsigned_limit: capacity bounded by shared maximum, rounds by actual usize, no signed/overflow/trailing/empty acceptance. Frozen valid inputs retain the same repeated query checks; guarded microtiming and compile cost are recorded in journal. Imported CLI declarations introduce no new global resource owner. |
| tests/work_linux_capacity_arguments.tower | New D2 process regression owns stack argv/table and borrows path/text until each existing tool_process reap. Array count derives from actual type; numeric overflow string is test data.16invalid fields+valid control; actual prior1/current0, both instrumented parent/children pass. No shell execution, new scheduler or generic harness. |

Pinned single-CPU investigation leaves+3.2%small/+2.2%large serial wall medians;
no broad speedup claim or timing-based acceptance weakening. D1 independently
reviews/registers at its next coherence boundary. These source/evidence milestones
do not close unrun final publication gates or L2's distinct calibration issue.

### Complete affinity checkpoint and current consumer review —cbe00ff22 /3c74dc193

The preceding affinity implementation is committed ascbe00ff22, with complete
source bundle89c2676a and176MiB measured/instrumented receipt9f6a4494. Its before/
after compiler identities remain565 plus the owned patch. Reviewed complete
ROOTd3/dba history is now merged as3c74dc193; it has not inherited those runtime
passes merely because the merge is clean. Primary assigned inventory remains
33tools+7benchmarks=40/40; supplemental paths below have concrete dispositions.

| Reviewed path at3c74dc193 unless specified | Ownership/scheduling conclusion and evidence/gap |
| --- | --- |
| `tools/bootstrap_symbols.tower`, `tools/verify_bootstrap_symbols.tower`, `tools/bootstrap_comparison.tower` | Exact unit policy is a derived ABI check, not another type/entity registry. Reader owns its bounded ByteBuffer until checking completes; rejected spans borrow that input. D1fa15 actual ParserNodes undefined report requires exactly parse_forest_create_result and parse_forest_resource_error, both defined in its entities object. Existing f502 checker is preserved as before oracle. Own current native/WASI before/after validation is pending; no broad namespace permission proposed. |
| `compiler/parse_tree.tower`, `compiler/parser_state.tower`, `compiler/lr_tree.tower` | Forest descriptor and traversal vectors now charge a borrowed request budget; canonical leaves remain shared entities, not a second AST. Request destroys forest before budget lifetime ends. Exact resource receipts are read immediately by the owning parser. Remaining bool entity_attach consumer can lose Busy/Invalid/Exhausted after a successful scratch push; routed to B1/ROOT and already explicit in B1 audit. New descriptor/index charging does not cover raw entity containment allocations. Source review only here. |
| `compiler/host_metadata.tower`, `compiler/syntax_provenance.tower` | New per-call WorkBudgetError copies preserve exact component/queue causes and reject serial pinned/leased mutation. Stage owns destination, strings/history remain raw separately owned allocations; queue succeeds before installing owning history. Caller must discard incomplete destination on failure and hold queued shared references before final input unpin. No transactional replacement, whole-heap cap or hold-exhaustion claim. ROOT's dba validation is owner evidence, not a D2 rerun. |
| `library/entities.tower`, `library/entity_stage.tower`, `compiler/world.tower` | Checked attach/create/reference/component producers preserve world identity, ordered/named containment and typed Invalid/Busy/Memory/Exhausted causes. Reserve before ownership transfer; worker-local stage queues do not retain shared references until coordinator hold. Raw containment/stage arrays and remaining hold/replace/take gaps are separate from charged component pages. No packed-payload claim from the archetype index. |
| `cmake/TowerRuntime.cmake`, `cmake/TowerWorkTests.cmake`, `cmake/TowerWorkPolicyTests.cmake`, `cmake/TowerWorkHost.cmake` (external D1 draft144c319d/c09a992d/14f437a5/844222b5) | Independently reviewed generic SOURCE explicit-object correction and six registrations. Five ordered existing runtime_bind mappings preserve real allocator functions before interposing the fault wrappers on separate production transport; mutation's imported portable transport is marked explicitly to avoid duplicate injection. Aggregate fixture removes only duplicate semantics implementation, preserving frontend/query providers. No D2 manifest edit; native/instrumented acceptance and complete-history adoption pending. |

Read-only audit/receipt text has no runtime profiling applicability. Actual
permission edits, when made, require checked fixed-report before/after timing,
smallest fixture compile, fresh native/WASI imports and scoped instrumentation.
No new syntax, scheduler, authoritative IR or private bootstrap is introduced.

### Current policy implementation and runtime disposition —3c74dc193 +0058caa6

| Owned/reviewed path | Evidence and disposition |
| --- | --- |
| `scaffolding/tools/bootstrap_symbols.tower` | Four exact permissions only: two forest results in ParserNodes, typed world creation and strlen in Interpreter. Actual current native and fresh WASI failures reproduced before each addition; providers and L1 fixture callers reviewed. Final all7native/3WASI reports pass. Fixed-report n3 paired measurements use identical wrappers after detecting/preserving the original wrapper mismatch; every entry's RSS median1616KiB before/after, wall/CPU below0.01s. No new heap owner, global registry or parallel schedule. |
| `scaffolding/tests/bootstrap_symbols_checks.tower` | Native/WASI positive plus truncation, suffix and wrong-unit negatives for each new name. Actual text lengths remain derived by existing helpers. Public smallest compile/link/normal and actual address/LSan/thread fixture pass with matching guest. No serial test-to-threaded race-safety inference. |
| `scaffolding/tests/interpreter_call_query.tower`, `compiler/units/interpreter.tower`, `compiler/units/evaluation.tower` | Supplemental caller audit: both mutually exclusive link entries deliberately include the existing query regression. Its new budgeted function-reference world uses entities-owned create_result and libc strlen for expected output extent. No duplicate interpreter/constant folder or ambient type registry. No D2 edits; both native/WASI closures now pass. |

Current public compiler325cd2a3/resources are captured. Query/resource/fullunits/
failure/runtime-fault gates pass at explicit full-host allowance for fixed-four
cases, restored0,2; four small/large jobs1/2 objects and outputs match retained
reference inputs. Old two-CPU Cancel4 failure remains distinct. Journal contains
exact commands/environment/profiles/failure and instrumentation scope. Primary
40/40 audit is unchanged. Current-unit ownership fixes do not close raw-allocation
coverage or final clean bootstrap/browser/generation/publication gates.

### Child-result compatibility join — reviewed4b4c75ddc, integratedcde907cbd

Complete ROOT bundle188337cc was reviewed after6159 work drained. D1bf093
registration merge9577f7401 and this subsequent join preserve all README
paragraphs; four CMake files still match D1's reviewed draft. Current runtime
validation is running separately; older325cd2a3 receipts remain at3c74 inputs.

| Supplemental path | Current ownership and evidence disposition |
| --- | --- |
| `library/entities.tower`, `library/entity_api.tower` | Replacement now checks parent, replacement and displaced-child leases plus new-retain overflow before any link change. Take checks parent/child leases, frees the owned name and transfers the parent's existing reference without retaining or allocating. Exact Invalid/Busy/Exhausted and None/null-empty results retain legacy wrappers. No storage-layout change or new scheduler; hold-counter/alias/raw-buffer gaps remain separate. |
| `compiler/host_metadata.tower`, `compiler/syntax_provenance.tower` | Serial same-store/no-world copying is a metadata-free no-op again, preserving standalone entity clone support; null/cross-store inputs fail. Staged copies continue to require the actual world. ROOT reproduced old abort134 and validated corrected behavior; this is owner evidence until the current D2 allocation run completes. |
| `tests/entity_attach_leases.tower`, `tests/entity_mutation_results.tower`, `tests/world_constructor.tower` | Reviewed new displaced-child/removal lease, exact error/overflow/empty/next-allocation-denial and distinct bare-clone identities/order/cleanup oracles. Reuse D1's registered targets and existing allocation selector. New bare-clone string comparison duplicates length5; routed to ROOT for an actual-data-derived bound, no unauthorized fixture edit. |
| `tests/entity_child_transfer_profile.tower` | Newly discovered measurement source, ROOT-owned. Private standalone store and two raw entity handles are kept alive through replace/take/reattach; iteration count selects fixed small/large workload data, inner count derives the actual handle array. Final parent/reference identities and store disposal are checked. Explicit Linux x64 clock/rusage ABI; serial manual observer only. Reported descriptor+child-array2264B is a subset, not total live heap. ROOT's warmup+5 paired samples show large phase+1.47%; no worker scaling or new D2 timing claim. |

Primary33tools/7benchmarks inventory remains40/40. The additional measurement
entry is tracked separately, with reviewed commit and ownership. Source review
and documentation have no runtime profiling applicability; current native/14CTest/
allocation and full-host query/unit checks are pending in child_join_cde. B1's
completed attachment fix is reported by ROOT but its standalone bundle is absent
here; await complete source delivery before claiming independent source review.

Current cde runtime receipt: public three leaves/native6/focused16, all14 newly
registered cases, updated allocation/bare-clone selector and7native policies pass.
Packagec0372979/all50resources captured. Explicit0-7 query/resource/fullunits/
runtime-faults pass; restored0,2 and drained before12:19:47. Fullunits883748KiB peak
is retained as a higher single-run observation, not hidden by a neutral-memory
claim; journal records scope and allocation-path/owner-profile comparison.
No fresh WASI, whole joined sanitizer, clean-cache or published-release acceptance
is claimed. Primary and supplemental source audit dispositions above remain in
force; final linker budget and integrated release work remains open.

### Capture/attachment source join and late-inspection review — 2026-11-23

Complete ROOT34aa history is integrated as6332f6658 after the preceding owned
jobs drained. The worktree and guarded pull are clean. This supersedes the earlier
statement that B1's attachment source was unavailable; it does not extend the
c037 compiler's runtime receipt to these new compiler inputs.

| Supplemental path and reviewed commit | Ownership, scheduling and evidence disposition |
| --- | --- |
| `compiler/parse_tree.tower`, `tests/parser_table_budget.tower` at34aa7526 | The existing forest records the exact entity_attach_result before transferring the leaf reference. On failure, the caller still owns the leaf; the fixture covers pinned Busy, self Invalid and allocation Memory with a retry. Traversal scratch and entity containment retain their distinct budget coverage. No new entity representation or symbol-policy permission is needed for this consumer. Source reviewed; current D2 runtime check is pending. |
| `compiler/semantic_capture_work.tower`, `tests/semantic_capture_continuation_checks.tower` at34aa7526 | Failed take, suspend, observe and finish operations use the existing query cancellation/resource path, preserving the owning declaration's receipt. Cancellation requires zero active workers. The fixture derives occupancy from actual graph capacity and checks repeated pumps do not replay work or erase failures; context/world/budget owners survive cleanup. Its healthy case demonstrates legitimate suspension, not completed initializer execution. Worker-budget variants alone demonstrate no overlap. D1's ordinary-provider, five-selector registration draft28ffaa75 was independently reviewed; no D2 harness edit or runtime pass is claimed. |
| `tests/world_constructor.tower` at34aa7526 | ROOT resolved the earlier hardcoded string extent finding using exact strcmp. Existing distinct clone identity/order/teardown checks remain. No D2 production edit; current execution is pending. |
| `compiler/language_query.tower`, `tests/generic_inspection_budget.tower` at8c4282576 (complete L2 bundle, fetched only) | The single initialized document owner invokes its existing inspection producer through language_document_inspect. A persistent resource receipt rejects replay before clearing text; the fixture fills the actual remaining scratch budget after successful checking, verifies Capacity at a source-derived expression offset, hides prior output and checks no new entities/components after pressure release. Legacy bound-budget scope excludes physical entity pages. No concurrent use of the query or separate evaluator is introduced. Source review only, awaiting complete ROOT integration and current runtime evidence. |
| `tools/bootstrap_symbols.tower`, `tools/compiler_project_files.tower`; `compiler/units/semantics.tower`, `compiler/units/semantics_checks.tower`; `tests/lr_work_main.tower` and their existing CMake recipes at6332f6658, compared with8c4282576 | The new language_document_inspect definition and ordinary call are in the same semantic provider. The only external caller is the generic_inspection_budget fixture imported by the separate LR-main object. Neither of the seven bootstrap policy units imports that fixture. Source composition therefore predicts no new permission, rather than adding the export speculatively. Actual fresh native/WASI undefined reports remain the final check. The project packager already collects this provider's real depfile closure; no second API registry/provider is proposed. |

Primary assigned coverage remains33tools+7benchmarks=40/40, with these additional
owned-producer/caller reviews recorded separately. These are read-only review and
documentation changes, so new runtime profiling is inapplicable. The prepared
package_6332 OS runner explicitly requires a matching, not-yet-built6332 native
package and its product hashes; old c037 assets cannot satisfy that gate. D1's
current ed7 instrumentation freeze is respected. Final linker budget contracts,
merged measurements/instrumentation and public-bootstrap/browser/generation/
leased atomic publication remain open.

### Current joined validation and exact Entities WASM table policy

Complete ROOTc944 is integrated as c8019dc44; its four new Tower paths match the
previously reviewed queue and inspection sources. Native/compiler packaging
validation uses this frozen source. The later ROOT2252 interpreter-layout/parser
join is queued, not covered by these receipts. Primary coverage remains40/40.

| Reviewed path at c8019dc44 plus owned patch00682b68 | Ownership and measured disposition |
| --- | --- |
| `library/entity_stage.tower`, `tests/entity_mutation_results.tower` | Complete queue-alias source matches reviewed d75ab177/0b92be42. Live-prefix bounds and rebasing preserve input addresses across reserve; no extra allocation, payload representation or scheduler. Current registered mutation and allocation tests pass. Separate hold-counter exhaustion remains open. |
| `compiler/language_query.tower`, `tests/generic_inspection_budget.tower` | Complete L2 phase is adopted. Current editor suite passes its actual late Capacity, source-offset, prior-output suppression, no-replay, recovery and teardown checks. All seven native and fresh semantics WASI policy reports pass without any new inspection-helper allowance. |
| `library/work_budget.tower`, `library/work_budget_types.tower`, `compiler/units/entities.tower` | Supplemental provider audit: the Entities closure includes budget reserve/release with typed enter/leave callbacks. Gate/callback lifetime is fixed before admission and ends after borrowers drain. Actual WASI disassembly has call_indirect and R_WASM_TABLE_NUMBER_LEB relocations to __indirect_function_table. This target table is not a new native implementation dependency or an alias guarantee. |
| `tools/bootstrap_symbols.tower`, `tools/verify_bootstrap_symbols.tower`, `tests/bootstrap_symbols_checks.tower` | Actual fresh Entities WASI policy failed1 while original/exported objects matched. Exact owned correction permits only the existing function-table name for WASM Entities; no table_base, native permission, broad prefix, new provider or inspection export. Two target-policy positives and six native/wrong-unit/truncation/suffix/table_base negatives pass. D1 independently reviewed exact patch00682b68 and actual relocation/report evidence. WASM64 is policy-string coverage, not runtime execution. |
| `tools/compiler_project_files.tower`, `tests/compiler_project_units.tower` | Existing real-depfile exporter retains source/unit ownership and duplicate unit identity. All four native and all four WASI entities/evaluation/semantics/parser original-exported object pairs are byte-identical; changed source files match their exports. Ordinary known-value interpretation and canonical Foundation re-interpretation both output0. The first package policy failure remains preserved, followed by a separate continuation; no second compiler representation or fallback parser was added. |

The new matcher condition is allocation-free and introduces no parallel work.
Matched fixed-report measurements use identical time+timeout wrappers, unchanged
report paths, three fresh-process samples per seven native and one WASI entry,
warm filesystem state and CPU allowance0,2. All48 intended statuses/output checks
pass. Wall/CPU are below0.01s resolution; every entry's peak-RSS median is1616KiB
before and after. No speedup, whole-heap or concurrent-allocation claim follows.
Expanded fixture normal/address/LeakSanitizer/thread runs pass with matching guest
runtime and actual11 definitions/109 ASan report sites/11 TSan access hooks.
This serial policy fixture does not sanitize the whole threaded compiler or add
source-language UBSan coverage.

Current compiler c3724363 and its complete50-resource tree are captured. Native
three actions48.32wall/46.79CPU/752680KiB; focused12 actions71.97/69.83/755316.
All14 registered cases, parser and allocation selectors pass. Explicit0-7
correctness query/resources/editor/units/runtime-faults pass; actual clone width256
has Cancel4 overlap1, not a resolution of the old two-CPU failure. Editor23.88wall/
36.78CPU/875940KiB and units48.94/69.42/809088 are n1 validation costs. The lower
unit RSS than the preceding883748 observation is retained without a causal
improvement claim. Timed children report zero swaps. CPU allowance restored0,2;
all owned work drained before actual13:11:39 lock release.

The two semantic leaf checks alone cost30.38+31.11s before the48.32s coherent
native rebuild. Future unchanged-closure validation should compile the smallest
changed unit first and reuse the coherent semantic-unit check, rather than repeat
both broad semantic leaf closures. This is an observed workflow cost, not a new
compiler optimization. No CMake or shared harness change was made. Final explicit
linker-world budgets, new interpreter ABI integration, complete current release
instrumentation/public-bootstrap/browser/generation and leased hosted publication
remain open.

### Next complete ABI join — source review at2252b889, integrated6e7feea51

After the prior freeze and actual13:11:39 release, verified D1's complete
1beec/7160ccfd history/receipt. Its archived missing-provider link1 and original
ASan units124/followup0 are directly inspected; no probe was executed. README
conflicts were duplicate paragraph relocations, with all complete content kept.
Moved journal metadata/affinity/policy sections remain present. Complete ROOT2252
bundle3ae22ed0 is then reviewed and merged; only D2's committed exact WASM table
policy/fixture differs from its production/build source. The c372 receipts remain
c801 evidence, not acceptance for this new interpreter ABI.

| Supplemental path/scope | Ownership and evidence disposition |
| --- | --- |
| `compiler/interpreter_types.tower`, `compiler/interpreter_storage.tower`, `compiler/interpreter.tower`, `compiler/fast_interpreter.tower` | Six sorted execution maps now use work_vector and the invocation's world budget; Foundation entities remain authoritative. Checked growth preserves prior storage and exact errors. Heap metadata is prepaid before committing a guest range so valid free/coalescing needs no allocation. All production map-set callers inspected use the new bool result; statement/address/value/return paths stop on failure rather than replay effects. Fast teardown uses matching work-vector disposal. IMFrame/IMState sizes change, requiring every actual depfile consumer to rebuild. Owner's costs/retention/instrumentation stay at6818; current joined native/browser execution is pending. Wide-call argument storage and other raw owners remain outside this change. |
| `compiler/lr_api.tower`, `compiler/lr_work.tower`, `compiler/lr_runtime_work.tower`, `compiler/parser_workers.tower`, `compiler/parser_table.tower`; current parser contract | Per-call FIRST/state/LALR failures replace guessed Memory; worker causes are read after joins in source/frontier order. Pool slot and graph buffers borrow the world's stable budget, separately from lane grants; retained pool bytes live until cache/world teardown. Partial derived products remain caller-discard-owned and raw analysis vectors are still outside this accounting. The exact new external ParserNodes call is entity_attach_result in lr_work_node_result; failed attachment releases the creator reference, success transfers containment before releasing it. Other new LR result functions are internal to that provider. Fresh native/WASI reports are required before changing the owned allowlist. |
| `compiler/semantic_context.tower`, `compiler/semantic_capture_work.tower`, `compiler/semantic_execution_work.tower`, `tests/semantic_executable_admission_checks.tower` | Shared internal sem_query_check preserves the existing first resource/cancellation/subject provenance path. Query/edge/access/seal admission precedes executable metadata, failed partial take discards undispatched private stages before cancellation, and observation/finish must succeed before ready input publication. Full238-line fixture reviewed: eight real selectors, actual graph-capacity pressure, terminal no-replay and world/ledger cleanup; budget variants are not overlap. Fixture imports production services itself and requires the existing aggregate-style provider deduplication. D1 owns the concrete registration and current validation; no D2 harness edit. Component/stage/dispatch/hold gaps remain explicitly separate. |

This is read-only source/receipt review and integration, with no new runtime
profiling claim. D1 now owns the Deck heavy slot for current leaves/native/manual
baselines and registrations. D2 awaits its actual parser/provider reports and a
free slot for fresh WASI/policy validation; no speculative API permission was
added. Final linker budget contract and integrated release gates remain open.

### Exact checked LR attachment import at9db1be18 +227bf39a

The completed primary audit remains 40/40 paths; this change updates the owned
`scaffolding/tools/bootstrap_symbols.tower` disposition and its existing
`scaffolding/tests/bootstrap_symbols_checks.tower` fixture. B1's checked
`lr_work_node_result` now imports `entity_attach_result` from the existing Entities
provider. It releases the creator on failed attachment and after successful
containment transfer. This adds no graph, allocator, world, scheduler or ABI.

D1 exported immutable reports after its current2252 native build drained: parser
object9928d135 has the exact undefined name and Entities e62f8520 exports it.
D2 independently compiled the current public-bootstrap WASI parser entry and
confirmed the same import. Before checker a19e878f rejects only that name for
both targets. Exact patch227bf39a adds that single ParserNodes permission; eight
cases cover Linux/Windows/WASI acceptance and truncation, suffix and three wrong
units. String bounds still derive from actual text, and rejected spans remain
borrowed from the captured input. Windows here is policy coverage only.

On the same Deck/image4be584fb/public9653, CPU0,2, jobs1, fresh processes with
warm filesystem, identical GNU-time/timeout wrappers and fixed report paths,
three samples per target before/after all have the expected status and exact
stdout/stderr. Wall/user/system times are below0.01s resolution; each target's
RSS median is1616KiB on both sides (raw1488 outliers retained). No measurable
speedup, regression bound, overlap or whole-heap retention claim follows. The
allocation-free permission lookup adds no live storage; tool input ownership
and serial error publication are unchanged. WASI compile is34.43wall/33.69CPU/
773060KiB, zero swaps, n1; that is validation cost, not policy runtime cost.

Smallest fixture compile/link/run, canonical selected-tool build, actual fixed
reports and scoped ASan/LSan/TSan all pass. Retained public LLVM has11 definitions,
109 ASan report sites and11 TSan access hooks, with the byte-matching guest runtime.
These serial policy checks do not sanitize the threaded compiler, prove general
race freedom or provide source UBSan coverage. New checker c8b98a2f and all raw
statuses/profiles/source manifests are in `build/d2_ecs/parser_attach_2252`.
Both controllers drained before lock release. Current joined compiler/native/
browser/generation acceptance and the linker-world budget API remain open.

At ROOT's accelerated completion boundary, D2 reuses D1's matching native
results instead of running the prepared broad ABI suite again. Browser OS
preparation is complete (pinned dependencies and actual Chromium launch), while
Tower/runtime acceptance is pending the integrated package. Existing thread
transport tests require the separate `tower-work-tests.wasm`: without it their
optional default skips the tests. Final checks must set `TOWER_REQUIRE_THREADS=1`
and retain the artifact's source identity. The shipped threaded frontend alone
does not prove four-worker barrier overlap. Existing worker tests cover object
ordering, cancellation/drain and deterministic diagnostics; full generation and
integrated runtime builds remain ROOT-owned. No new audit/test framework is added.

### Bounded publication-readiness review, 2026-11-23

Reviewed main `d8db5f3fc14aced96fadc1b57f9f8fd9715dc100`, including published
D2 `636f7f9302144ca5bfe7575111dc10f4e884a660`. The initial `f33770ba` review
was updated for L2 at `afca69b1`, then complete published `53d63157` was merged
after the final fast-forward-only pull refused divergence. This includes B2's
module startup and D1's ownership-prerequisite report, preserving all history. This is
source/receipt review, not release acceptance. No compiler build, policy test,
sanitizer or browser suite was rerun. Runtime profiling is inapplicable to these
documentation changes. ROOT owns final assets and deployment; this task pushes
only the audit and journal. Earlier open-ended waiting instructions do not apply.

Current source trees: scaffolding `9060a66dd5b88788226cbfc2eda17e1f72a119de`,
compiler `a63ffc4173a3bf3d3932e6fc3ee69aee0a5c14a4`, CMake
`88e49f4105972ad8d625a61b249213d345d17a7d`. These identify this review's inputs;
ROOT must freeze and record any later compiler/build changes before final checks.

**Checked public inputs and reusable material.** All 56 actual entries of
`bootstrap/linux-x64/SHA256SUMS` verify with `sha256sum --check --status`.
`bootstrap/development.json` is schema 2, host `linux-x64-ubuntu24-llvm19`,
source base `98ade8ccde255c445797ad51a1a2def0b41c85fb`; its 1,019 source-file
hashes also describe the accompanying changes, so the base revision alone is
not its complete source identity. Executable SHA256 is
`9653f8187a104ca84ab5d8601f336d7e1ed8200206544c70a81415018d623d02`, manifest
`cf7d84b11d025c708310827c56f3071fa69e36b010ea50dd992855ecc438e896`, checksum list
`101727e005828458bb8dee9cf0e3f072010496ee2980e1cd18ff82d087ffb461`.
Reuse this complete public predecessor, including its older scalar-module
resources; do not replace them with the new consolidated `types.tower`. Its
LLVM19/system-library dependency still prevents direct execution on this Deck
host. The supported Docker path works; this is not a standalone portable release.

Live Pages ref is `6f142bef15f58380831ed344ab5eac5c4b3c2840`. The fetched served
manifest exactly matches that ref, SHA256
`eb70f5388bee6b7ca318583eddfaa8e9a8a907c642a14a6fde85375ac8b1643c` (saved in
`build/d2_ecs/readiness_f337/served_manifest.json`). Its publication source is
`013ae550fdc186e33fdcb755ae1fbfe78bda098d`, build/project/UI source is
`98ade8ccde255c445797ad51a1a2def0b41c85fb`, compiler tree
`9703a7c0264660e42831a41636fd6fe457dce1b0`. Build provenance explicitly records
unchanged `cbcd24a9` implementation/recipe inputs at that later source. This
review fetched only the manifest, not every asset or hosted behavior. The manifest
lists 104 assets and advertises LLVM/cross/threads; those flags are not current
execution receipts. Old build source is reachable from current main.

| Reuse decision | Exact boundary |
| --- | --- |
| Public predecessor and its complete resources | Verified above; reusable as bootstrap input, not the final current-source successor. |
| Historical runtime assets | Preserve the old release and receipts. None of its four complete compiler reactors can establish current acceptance. `tower.wasm` is `5dfa4525e1bb2d8233803fadd0f60f47b8fb5e4b90bf2300a9ffa4b8569b62cd`, threads `a239e4b4503d17fd8f951ea72d2da54d2ba449dc8f07596f9b70efd0f4a4f166`, LLVM `6ec53230a2d78bf49717139973682f6035174029124c4256875674708bdc50be`, compressed cross `cf20fd0a3f4f287b0463d6dceb8659272a10cef69be492c0b0645cff855d7592`. |
| Third-party libraries, static assets and target support | `third_party`, npm lock and browser transport source have no changes from the old build source. Reuse exact cached vendor artifacts only with matching target, flags, toolchain and input hashes. Preserve CNAME. Target packs may be reused only after matching current generated runtime/support inputs and hashes; unchanged packager source alone is insufficient. Compiler support archives can contain changed Tower memory/runtime objects and must not be copied wholesale on that assumption. |
| Exact D2 policy/fixture | Unchanged since `636f7f93`: retain 24 focused cases and checker `37039cc10cd0f6c33780e7442fe97afa9fb30d0c1cb2be088f211005832b814f`. No reason to rerun those cases for this prose audit. New provider reports remain a separate requirement. |

**Unit and provider rebuild checklist.** Actual native `.o.d` files in D2's
`native-coherent-f13c8f6` cache were intersected with changed source paths. They
are dependency evidence, not fresh binaries. No other worker's cache was read.

| Comparison / units | Required action and evidence gap |
| --- | --- |
| `636f7f93` to initial `f33770ba`: ParserNodes | Seven changed producers/consumers: `frontend_pattern`, `frontend_table`, `frontend_world`, `lr_tree`, `parser_nodes`, `parser_state`, `syntax_session_next`. Of the inspected compiler depfiles, only ParserNodes intersects these paths. Refresh its actual native/WASI U/T report and resulting link/export closure. B1's focused parser/regex/query receipts are described below; they do not supply the current browser export. |
| L2 admission joined at `afca69b1` | Actual depfiles now also invalidate Semantics, Evaluation, Interpreter and query-checks. `host/driver_compile.tower` additionally requires the configured driver consumer. Reconfigure/build through the real targets and let their regenerated depfiles select transitive consumers; do not copy an old ABI object into the new package. A2/L2 contexts or declarations in a depfile can invalidate a consumer without changing its entry file. |
| B2 startup joined from `53d63157` | `frontend_compilation`, `frontend_modules`, `frontend_units` and the module fixture changed. Actual compiler depfiles intersect ParserNodes, Semantics and frontend-units. Build these consumers and the module-cache registration coherently. B2's startup checks do not provide final current WASI/export/symbol-policy acceptance. |
| Entities versus the D2 native policy receipt | No changed path intersects the saved Entities depfile. Its exact native object `030ae5b4ec3c21805e92b57a3d9be0baa9cde30fdbf1f5fe400e514d2fd4b57c` and report remain reusable within that target/flags/compiler profile. Semantics `c02fa58100e7a8b0e2d13e2f7def4257e019bce775e6519c971200fcd3001b9e` was checked at `c566caedbde305a14e7a8aa39317add3eca2d71e` and is now historical. Both full reports passed then; logs/status0 are in `generic_policy_b042/publish_retry_1`. |
| Published `98ade8cc` compiler project to current source | Rebuild the current Tower unit closure: shared `types.tower` changed, and every inspected native compiler depfile includes it. The old project's 22 units are IDE, Interpreter, ParserNodes, syntax-live-cases, parser-format/integration/fixtures, template-build, syntax-host, Semantics, Entities, shared-lifecycle, legacy, UTF8, bytes, host, work-host, Evaluation and four backend units (Wasm/linker/native/Mach-O). Changes also affect host/runtime/driver and backend composition. Unchanged leaf source is not sufficient to reuse an old object across the changed prelude or layout. |
| Current CMake/package composition | `TowerCompilerUtilities.cmake` additionally links frontend-units and, for browser/parser/work profiles, query-checks. `compiler_project_files.tower` explicitly maps those objects and reads actual depfiles. Parser roots derive from module/work/check flags; browser Interpreter and Semantics have specific entries. Export the final configured link inputs, including generated runtime/source, exact support members, imports, exports and linker arguments. Do not impose the old count of 22 on the new package. |

The served `compiler/project.json` SHA256 is
`b6afe91447cc05b0bb72a7330b3c816cacc132bb3f965f48de8d9f3c32cb5066`, version 1,
533 embedded source files, entry `units/compiler_parser_nodes.tower`. Its tower,
LLVM and cross recipes contain respectively 17/18/19 units and 1004/1046/1049
exports. None exports the four new generic-result APIs or `entity_attach_result`.
That is expected for the old package, and is concrete evidence that it cannot
stand in for the new one. Native reports observe all four generic APIs as
Semantics U / Entities T. The new WASI closure and export/support identity must
come from actual objects and link manifests, not guessed additional permissions.
Keep exact-unit, suffix and truncation rejection. Current policy already has the
measured WASM Entities table permission; the older tests README sentence saying
only parser/semantics allow it is historical prose, not the policy authority.

B2's joined `b21bdb2d` receipt reports actual new native imports
`frontend_module_root_world_size_result`, `frontend_modules_create_result` and
`frontend_modules_bind_world_result`. Current source exports them from
`frontend_modules.tower` in ParserNodes; Semantics' frontend-compilation caller
uses the first, and the separate frontend-units caller uses create/bind. The
current exact policy does not name these three. ROOT needs the complete current
undefined/defined reports, exact consumer-unit permissions only where observed,
negative policy cases and refreshed WASI exports. This audit independently
confirms the source boundary and missing names, not a newly executed nm/policy
failure. The four generic-result permissions remain present and unchanged.

D1 `53d63157` also records a production prerequisite, not just a missing test:
`syntax_origin_copy_staged_result` installs borrowed references whose ordinary
finalizer releases them. Checked hold failure needs an agreed cancellation
ownership contract before discard; skipping finalizers leaks buffers and a pin
does not own history. That protocol is proposed, not implemented. ROOT must close
the immediate provenance/hold/publication caller boundary and validate cleanup,
or explicitly leave this acceptance item open. No passing release matrix can
substitute for the missing contract. D2 makes no out-of-scope production edit.

**Receipt ledger: latest relevant scopes, not one combined pass.**

| Receipt | What it establishes / what remains missing |
| --- | --- |
| L1 `9985c385`, input manifest `76fa97e7795561cf5abee9f125c8f240533b54d39b0b84453d3ac210547c5fa6` | Native query/core/constructor passed; `L1/logs/execution_ownership_final_9985`. Later L2/B1 source union is not covered. |
| A1 `1c9f723dc701fbea2b217784949e1e781375d3f4` | 26 flow trials, query and serial/parallel comptime outputs passed; compiler `8b442c4593f17c90eb10194d2c10d16fe86e1e01583617387ed5bf4b6643e328`. Its semantic provider matches D2's `c02fa581` report. Later admission changes invalidate that provider identity. |
| B1 `ca286d12751732e60443cb424525baa3e171c08b` | Nine dependency actions, parser/regex/query passed; `pattern_result_final_merge_*`. Earlier measured units outputs and retention remain scoped to their earlier frozen source. No current WASI/parser export receipt is attached. |
| L2 `aa01512c6476ab1d7eeb6f242c0465b5275814eb` | Twelve dependency actions, storage/query passed in `semantic_admission_*` merged0. Original fixture SIG6/134 and corrected final1 remain recorded. The later union with B1 requires final coherent checks; no final type/browser/instrumentation pass is claimed. |
| B2 startup `b21bdb2d` and `b2_startup_push_merge_{build,modules}.log` | Focused module checks passed after complete A1/L1 integration and policy636, with the four scoped sources unchanged; original wrong fixture expectation134 is preserved. The receipt explicitly defers the three new module-result import policy checks. D2 reviewed this journal receipt, not remote raw binaries. |
| D2 WASI/export at `c8019dc44` plus `8cb198038` | Four native and four WASI original/exported unit pairs matched; canonical known-value roundtrip passed. Compiler `c3724363dee165211f08a3ab964fbc2ed9160941031efaa983f48e99429096b6`. Later ParserNodes attachment at `9db1be18` plus `227bf39a` has its own WASI/policy receipt. Neither is the final current-source package. |
| Supported instrumentation | ROOT executable-query `c944` address/LSan and actual TSan overlap passed; thread package `52f985ecea40a69940716d9021b62d4303cc4d983d507a86d516b19acb0f3468`. Later lease join has address/LSan/concurrency passes but thread package `9331699b552fb128ec4391672f2452321f23591f98632c33b18df91d9595731c` was built, not executed. D1 `ed7f53026` positive native/address receipt and its same-binary timeout followup retain their old scope; current `2f7` type-smoke124 and unstarted instrument campaign are not passes. These receipts do not sanitize the final union. |
| Browser/hosted | The served old manifest is verified above. D2's Node22.23.5/Playwright1.65.1 install and Chromium launch are OS readiness only. D2 has no current `build/compiler-project/project.json`, threaded test reactor or dist manifest. Current generation hashes, mandatory thread execution, local/hosted behavioral report and workflow/deployment identity remain missing. |

**Minimal final commands for ROOT, pending execution.** Run in its supported
Linux x64 LLVM19/Docker environment with frozen source, one owned build at a
time, a fresh native cache and explicit host budgets. Keep logs/raw statuses,
source/depfile/flags/public-pin/resource/object hashes. These are existing entry
points, not commands run by this documentation task. No private bootstrap
override; preserve the normal compiler package before sanitizer scripts copy
their differently instrumented output into `build/native`.

```sh
unset TOWER_BOOTSTRAP_COMPILER
export TOWER_BUILD_JOBS=1 TOWER_COMPILER_JOBS=1
export TOWER_NATIVE_BUILD=/cache/root-final-clean
test ! -e "$TOWER_NATIVE_BUILD"
bash playground/scripts/build-native.sh -DTOWER_COMPILER_JOBS=1 \
  -DTOWER_WORK_TESTS=ON -DTOWER_BACKEND_TESTS=ON
cmake --build "$TOWER_NATIVE_BUILD" --parallel 1 --target \
  tower-work-tests tower-lr-work-tests tower-frontend-tests
"$TOWER_NATIVE_BUILD/tower-work-tests"
"$TOWER_NATIVE_BUILD/tower-lr-work-tests" "$PWD/scaffolding" query-smoke
"$TOWER_NATIVE_BUILD/tower-lr-work-tests" "$PWD/scaffolding" type-smoke
ctest --test-dir "$TOWER_NATIVE_BUILD" --output-on-failure \
  -R '^tower-(lr-worker-equivalence|native-units|editor-units|body-continuations)$'
```

Use existing directly affected storage/constructor/parser/semantic registrations
for the new union as well; a full source-matched native result is still missing.
Preserve earlier timeouts and investigate any recurrence rather than weakening
assertions or counting timeouts/skips as passes. For final predecessor/successor
unit agreement, the existing `verify_bootstrap_symbols --compare BOOTSTRAP
SUCCESSOR SCAFFOLDING NATIVE_BUILD LLVM_NM OUTPUT_DIRECTORY [UNIT ...]` records
IR/object/symbol agreement on its supported targets. Its ordinary `UNIT REPORT
TARGET` mode checks an actual nm report. Export closure checks use existing
`compiler_project_units REPOSITORY BUILD OUTPUT OBJECT ...`; select objects from
the current link manifests and compare original/exported bytes and input hashes.
Cross-target object agreement is not cross-target execution.

```sh
bash playground/scripts/build-wasm.sh -DTOWER_IDE_TESTS=ON -DTOWER_COMPILER_JOBS=1
bash playground/scripts/build-threads.sh -DTOWER_COMPILER_JOBS=1
tower_llvm_revision=$(git -C third_party/llvm-project rev-parse HEAD)
export TOWER_LLVM_WASM_BUILD="${TOWER_LLVM_WASM_BUILD:-$HOME/.cache/tower/llvm-wasi-$tower_llvm_revision}"
TOWER_BROWSER_CROSS=ON bash playground/scripts/build-llvm.sh
tools=$(bash playground/scripts/build-bootstrap.sh --tools package_targets)
"$tools/package_targets" "$PWD/build/native/share/tower" "$PWD/scaffolding/targets" \
  "$(llvm-config-19 --bindir)/clang" "$PWD/build/targets"
npm run test:ide --prefix playground
TOWER_REQUIRE_THREADS=1 node --test playground/tests/*.test.mjs
bash playground/scripts/build-wasm.sh -DTOWER_IDE_TESTS=OFF -DTOWER_COMPILER_JOBS=1
# Re-export project after the release reactor/IDE export configuration changes.
tools=$(bash playground/scripts/build-bootstrap.sh --tools package_compiler_project)
"$tools/package_compiler_project" "$PWD" "$PWD/build/browser-wasi" \
  "$TOWER_LLVM_WASM_BUILD" "$PWD/build/compiler-project"
npm run test:compiler --prefix playground
TOWER_REQUIRE_BACKENDS=1 TOWER_REQUIRE_THREADS=1 npm run build --prefix playground
npm run test:browser --prefix playground
npm run test:deployment --prefix playground
```

The Node suite runs from the repository root because the thread test reads
`build/` and `scaffolding/` relative to its working directory. This executes the
two components of `npm test` once each and makes the separate
`tower-work-tests.wasm` mandatory; shipped `tower-threads.wasm` alone is insufficient.
Generation receipts must match the final project/IDE export profile.
The LLVM script exports a project automatically when cross is ON; use its actual
configured LLVM build directory for the final packager (not a guessed cache).
Confirm its cached `TOWER_COMPILER_JOBS` value before starting the LLVM build;
the script does not forward extra command-line CMake options.
Keep verified vendor libraries; rebuilding Tower-dependent reactors is required,
rebuilding unchanged LLVM itself is not. `build.mjs` rebuilds the builtin list
from current source; obsolete `types/` files must not survive into the new dist.

Supported sanitizer commands use distinct caches, after preserving normal assets:

```sh
export TOWER_NATIVE_BUILD=/cache/root-final-address
bash playground/scripts/build-native.sh -DTOWER_SANITIZER=address \
  -DTOWER_COMPILER_JOBS=1 -DTOWER_WORK_TESTS=ON -DTOWER_BACKEND_TESTS=ON
cmake --build "$TOWER_NATIVE_BUILD" --parallel 1 --target \
  tower-work-tests tower-lr-work-tests tower-entity-stage-concurrent-tests
export ASAN_OPTIONS=detect_leaks=1:halt_on_error=1
"$TOWER_NATIVE_BUILD/tower-work-tests"
"$TOWER_NATIVE_BUILD/tower-entity-stage-concurrent-tests"
"$TOWER_NATIVE_BUILD/tower-lr-work-tests" "$PWD/scaffolding" query-smoke
"$TOWER_NATIVE_BUILD/tower-lr-work-tests" "$PWD/scaffolding" units
```

Repeat that supported positive path in a separate thread cache with
`-DTOWER_SANITIZER=thread` and `TSAN_OPTIONS=halt_on_error=1` on a host permitting
TSan startup. Include affected registered ownership/admission fixtures from
`scaffolding/tests/README.md`; inspect actual linked Tower objects/runtime and
`sanitizer-objects.tsv`, not C++ flags alone. The current negative race-control
link failure on missing buffer providers remains unresolved and its execution
was explicitly deferred; do not run an altered probe or claim current sensitivity
from the historical pass. Source-language UBSan and Windows/macOS/browser
sanitization are unsupported. Serial allocation-failure cases are not threaded
sanitizer coverage. Passing positive stress tests is not universal race freedom.

Finally ROOT must retain final source/build ancestry on main, exact dist/project/
resource/test-reactor hashes, successful generation and workflow receipts, and
the latest Pages/CNAME history. Its publication command remains
`git push --atomic origin main <deployment-commit>:refs/heads/gh-pages`, followed
by `node playground/scripts/verify-deployment.mjs https://tower-lang.org/` against
that exact local dist. Verify the deployed workflow/ref and every served asset;
the old manifest check in this audit is not that final gate. Implemented portable
interpretation, target object emission and shared-Wasm transport do not establish
published acceptance of this current integrated source.

### Bounded entity accounting fixture, reviewed c7ad4f42 (2026-11-23)

User explicitly assigns D2 the focused fixture/profile and narrow registration;
A2 retains production entities/stage ownership. This is supplemental test review,
not a reassignment of D1's full test inventory or a new allocator framework.

| Path | Full review / ownership and evidence disposition |
| --- | --- |
| `scaffolding/tests/entity_accounting.tower` (new) | Actual EntityStore and paged payloads remain authoritative. Stack node arrays are borrowed test indexes; no copied AST/scheduler. One normal allocator owner creates32 nodes, checks canonical query sum528, detaches/removes alternating rows, reuses them, and creates4 staged nodes plus an existing-node lease. A cancellable borrowed payload clears before discard finalization while the input view survives. All52 payload finalizers, view/lease/store cleanup and zero ledger grants are checked. Actual capacities/type sizes drive raw ownership census, including combined table row/column storage and borrowed query columns without double count. No threaded/global allocator counter or failure injection. Profile/repeated byte equality pass; finite-cap descriptor gate deliberately fails1 after cleanup, with exact None versus required Capacity. This fixture tests one necessary cap boundary, not complete world-budget coverage. |
| `cmake/TowerWorkTests.cmake` (narrow registration) | Reuses tower_work_fixture and its normal guest runtime/object rules. Profile executable stays EXCLUDE_FROM_ALL; explicit measure target reports checked census. Separate tower-check-entity-accounting-cap propagates real nonzero exit, no WILL_FAIL or skip. No generic fixture helper/allocator/ABI change. Smallest dependency-aware target compiles and links through the public predecessor; target's baseline failure was actually run. |
| `scaffolding/tests/README.md` (caller instructions) | Documents exact targets, field order, physical requested bytes versus sampled retained peak/RSS, separate ledger metadata, and baseline nonacceptance. No passing result is assigned to the desired cap. |

Read-only producer closure for A2, at the recorded hashes in the journal:

| Producer | Omitted owner / required lifetime |
| --- | --- |
| `library/entities.tower::entity_create_result` | Raw Entity descriptor; own byte receipt until final entity_release, including pinned deferred reclamation. Baseline184bytes/node; stage_create_result has the corresponding private descriptor path. |
| `entity_attach_result`, `entity_reserve_components` | Child array/name storage lives with parent until resize/detach/destruction; component pointer array belongs to node, instance index to kind. Replacement admission must cover old+new live storage and preserve prior links/indexes on failure. |
| `entity_table_prepare_result`, `entity_table_reserve` | Table/type IDs and combined row/column block belong to store's derived archetype table until prune. Reserve replacement before freeing old block; no packed-payload claim. |
| `entity_view_open_result`, `entity_view_tables` | View and cached query/type/match/column blocks belong to input view; query match columns borrow one common allocation. Retire only after consumers drain. |
| `library/entity_stage.tower::entity_stage_open_result/create_result/lease_result/references_cancellable_result` | Stage descriptor and node/reference/cancellation/lease vectors need stage-owned receipts, transferred/disposed at joined publication/discard; private nodes must not be charged through unsynchronized global counters. Queue callbacks/context survive failure cleanup before the last input pin closes. |

No production file changed. Physical compiler-buffer peak11862B equals charged
peak; observed live world storage peaks22086B, omitting10224B from that ledger,
plus320B separate ledger metadata. This measures requested owner storage, not
allocator usable size/hidden replacement peaks or process-wide retained memory.
Native profile and exact repeat pass; finite-cap failure stays an open A2 gate.
Final instrumentation/platform/bootstrap/browser release remains ROOT-owned.

### Bounded layout extension: full fixture review (2026-11-23)

Reviewed complete `scaffolding/tests/entity_locality.tower`, including preserved
legacy functions, at base published `3bee18e2371465aa9718ca4ba5cbb2aa18cb850a`
plus fixture SHA256
`4d27a7c1b03fe651ccc41d1cb0a701dabccf08742b569bad871e66cb0ddaa18c`.
This exact source identity is the D1 adoption boundary; production entities and
types remain A2-owned and unchanged. The journal's D2 bounded layout receipt
records exact producer/compiler/binary identities and all paired measurements.

| Path | Ownership/storage/scheduling review and disposition |
| --- | --- |
| `scaffolding/tests/entity_locality.tower` | One explicit store/ledger, normal allocator, no workers/global counters. Kinds derived from that store; stack owner/address arrays borrow its entities. Both lookup and planned column traversal read the same primary payloads. Pinned views own immutable query plans and close before structural churn. Plan columns are component pointers, not packed SoA; full pages are counted through unique live component.page references rather than incomplete free-slot links. Scratch WorkBuffer is private, unbudgeted and reported separately; no second authoritative payload/index escapes. Counts/bounds derive from arrays, page/type sizes and actual capacities; fixture density periods and warm-round count define input policy. Full-file reviewed cleanup, CLI failure, deterministic sum arithmetic, page retention, free-slot refill and stable survivor addresses. Four counterbalanced serial runs pass; raw whole-world cap and parallel access acceptance are not asserted. Legacy default snapshot experiment retained without claiming a new run. |
| `cmake/TowerWorkTests.cmake` (one registration) | Adds existing `tower_work_fixture(entity_locality ON layout mixed direct)`, normal runtime, excluded from default build; shares dependency-aware compilation and optional measurement target. No helper/harness policy changed. |
| `scaffolding/tests/README.md` | Documents commands, first-pass/warm distinction, mixed membership versus storage trait, count/byte scope and missing counters; no unrun gate promoted to passed. |

Known sum33,550,336 full/refilled and508,096 fragmented matches both paths.
Homogeneous32pages retain186848B while live payload shrinks65536→1024B;
mixed50pages retain291950B while live payload shrinks102400→37888B. Refills
restore occupancy with zero new page grants and unchanged survivor addresses.
Measured world+plan storage680984B homogeneous,786654–808222B mixed, exceeds
charged buffers189080/294182B; ledger metadata2560B is separate. Complete cleanup
passes. Planned scans avoid per-owner type search; fragmented comparisons also
avoid2016 nonmatching candidates. Warm full scans256rounds cost8.868–10.105ms
direct versus2.072–3.326ms planned across the two populations; these small serial
numbers do not predict compiler throughput or hardware misses. Production choice
requires compiler workload/lifetime evidence, not a blanket dense-storage mandate.

### LR construction optimization: source-specific adoption receipt (2026-11-23)

ROOT delegated LR construction helpers for this bounded batch. Base published
main36ad33782b53e1a3c5be50860ab3eb0a7cddae67; existing component-locality evidence
is preserved. Full-file reviews below cover the final contents, not only the
edited lines. D1 can adopt these exact hashes; no roster ownership is reassigned.

| Reviewed path and SHA256 | Ownership, algorithm and evidence disposition |
| --- | --- |
| `scaffolding/compiler/lr_analysis.tower` — `80ee516d379d27b4bd16c7e38dcf8062a0f83fb1c5748ebfb2b9c388c321db2a` | Full844-line review: borrowed immutable productions/symbols, owned FIRST/nullable vectors, closure-local membership/expansion indexes, sorted item publication, raw derived propagation graph and typed failures. Only private final closure sort changes: median-of-three partitioning, insertion sort for small spans, original heapsort fallback after2×floor(log2(count)) partitions. Smaller-side recursion/tail iteration bounds stack by input size; no allocations, new authoritative representation, persistent cache, API/layout or worker scheduling changes. Pointer/count borrows stay within one closure owner, including failure-path deferred sorting. Comparator and exact rule/dot/range identities remain unchanged. Raw vectors/graphs remain outside comprehensive world-budget accounting; no new cap claim. |
| `scaffolding/tests/lr_analysis_comparisons.tower` — `2af0a0246fab3fb54fa2995a563490218d6260e775731461264047b9b907d5a2` | Full127-line review. Adds33 ordering cases over actual array bounds, including empty/odd/even spans and ordered/reversed/seeded shuffle inputs. Mutates only the fixture-owned derived item array; dots face terminals/completion, so closure adds nothing. Independent insertion oracle checks every rule/position/first/last and exact count; no heap/partition implementation copied into the oracle. Existing150 deterministic grammars continue to cover nullable/ranges, reopened closure, states, runtime actions and error/probe paths. All fixture owners dispose and serial allocation count returns to baseline. |
| `scaffolding/tests/frontend_iteration_profile.tower` — `66af3f223dbe1ffdc7e55b022edcd42e0dc19367bb49168c789d52831b8b12c2` | Full131-line review. Existing ordinary cold/installed request and grammar observer retained. Explicit one-lane ledger bound before first entity; snapshots, allocations and retained buffers reported at the same checked canonical point. Counter transport explicitly requires serial execution; never used for real overlap. World/module/resource-vector/ledger cleanup asserted. No whole-world cap claim: legacy world/store construction and raw allocations are not covered by binding. Both frozen executables use this identical fixture hash. |
| `scaffolding/tests/frontend_main.tower` — `7f7c606f2e7839e4ff66c0f0dabea3be6df555c44be9b37d0fdd91cc1af0919e` | Full112-line entry review. Adds only lr-order selector/import; existing selectors/default flow and caller resource conventions preserved. Reuses native target because parser-only executable is absent from this cache; no generic harness or manifest change. |

Checked final source: all33 ordering cases and existing150-grammar independent
oracle, structural reuse/identity/capture/lifetime, grammar activation/live syntax,
parser/error paths, diagnostics and normal native serial/threaded LR equivalence.
Measured cold median2.05→1.93s wall (three alternating pairs), LR phase median
1.761→1.586s; all185 lookups/155 builds/123 actual tables/36 reuses and canonical
976bytes/hash13832670361687071853 unchanged. No allocation/retention reduction;
see journal for all pairs, substantial outliers and rejected bottom-up experiment.
The final sort's software-sampled CPU share15.42% replaces old heap27.63%; these
are not hardware cache metrics. Native3-unit workers1/2 control observes real
outer peaks1/2, but only modest latency reduction and higher CPU/RSS; no all-host
scaling claim. Full sanitizer/bootstrap/browser/generation/deployment remain ROOT
release gates, not passed here. B1 provenance/formatter and B2 ordering untouched.

Merged adoption follow-up: complete upstream98d69cf4 was merged as1906afcd after
implementationd9e1b348. Re-reviewed the full129-line frontend_main: upstream adds
only default-suite progress labels; focused selectors/imports retain their prior
behavior. Final merged entry SHA256
`aa5b76080914f65c0c1e5edfda8e9a1ba06b9d47165cd1f47c39d866a01a1485`
supersedes its112-line hash above. The other three reviewed Tower files retain
exact hashes. Upstream A1 semantic completion changes are outside this owner
review; affected merged consumers are rebuilt/rechecked separately, and paired
performance remains tied to the stated36ad inputs rather than relabeled.

## Single-unit observation coverage — D2 2026-11-23

Scoped review at published `c20dc56ac5344834a95e8de1f505abe9aea515ac`; no
production/fixture changes. Runtime receipt deliberately remains exact1906afcd,
with unchanged relevant LR/semantic admission sources and language resources;
43 other imported-source changes prohibit claiming complete current validation.
Full-file rereview of existing profiles, for D1 adoption:

| Path and SHA256 | Ownership, scheduling and evidence disposition |
| --- | --- |
| `scaffolding/tests/frontend_units_profile.tower` — `8159ea1782b203b43f54d862a33c0bc13cbe5d007ecfbc0e1b55cadc5261ceca` (407 lines) | World-exclusive inputs through production frontend_units/shared budget; normal allocator, borrowed result lifetime through reference execution/formatting, batch close after drain. Event slots are disjoint by unit/phase. `kernel_peak` covers outer Unit/Backend queries only, not nested kernels; summed durations/outer vacancy cannot establish eligible idle. One1000-body unit workers1/2 checked42 outputs, canonical17450187450754183643 and equal162093/198371 counts. Ledger snapshot excludes uncharged storage; metadata reported separately. No fixture defect requiring a change found. |
| `scaffolding/tests/compiler_work_profile.tower` — `385bbea430f12f8127053e36a7c02e90ec7c3aeb9883e1e5873ce2ed3ce49984` (139 lines) | Eight independent CompilerWork plan rounds, worker-private graph/store/checksum, optional synchronized budget; closes owners and asserts zero grants. Overlap describes metadata plans, not semantic body readiness or ordinary compiler throughput. Reused source review only; no extra run. |
| `scaffolding/tests/frontend_iteration_profile.tower` — `66af3f223dbe1ffdc7e55b022edcd42e0dc19367bb49168c789d52831b8b12c2` (131 lines) | Explicit single-world/single-lane ledger before creation, synchronous world-owned grammar observer and complete cleanup. Allocation counters require serial transport. Lookup/Build/Table intervals nest; reused exact small-request receipts cannot supply missing large-unit phase timings. No real-overlap instrumentation claim. |

See the journal's bounded single-unit receipt for every warmup/sample, thread
identity, retained/peak memory, current/frozen source distinction and software
sampling limitation. Dominant identified cost remains LR construction, not outer
queue refill. Source-reviewed ordered grammar activation/state interning and
semantic stage publication retain their dependency/access/lifetime contracts.
The single proposed B1 follow-up is immutable per-analysis suffix FIRST/nullable
reuse with bounded storage and exact incoming lookahead handling; its gain is
unmeasured. No new D1 registration, production ownership transfer, broad audit
count, race-freedom claim or final all-core acceptance is implied.

## Suffix-FIRST implementation / D1 adoption — frozen 2e77d747

Full changed-file review, public-bootstrap dependency build and focused checks;
production sources retain B1's state-core changes. Hashes below are final before
publication reconciliation. Evidence and preserved failed/noisy experiments are
in the journal's D2 suffix-FIRST receipt and build/d2_ecs/lr_suffix.

| Changed Tower file / SHA256 | Storage, world, scheduling, ownership and disposition |
| --- | --- |
| `scaffolding/compiler/lr_analysis.tower` — `3d99bd416a81c84f3a793818e987bce0f7c89eedffb86a1e5c3daab6fd10ca3c` (988 lines) | One derived index per analysis, typed pointer and two WorkBuffers; count/alignment/overflow checked. Production bases handle overlapping spans. Partial storage rolls back, completed rows/ranges are immutable, analysis destroys owner after readers join. Exact overlapping ranges/propagation/nullable behavior and deferred Invalid preserved. Standalone null budget explicit; remaining raw LR descriptors/FIRST/scratch are outside this subtotal. Full-file review includes unchanged closure ordering/indexes and lookahead propagation; no second semantic authority or interning-order change. |
| `scaffolding/compiler/lr_first_work.tower` — `cc3cbd674bb5e923a4092b76b453cd29a54890cccedb04bde129b6c5117c71cf` (236 lines) | Narrow parallel frontiers call serial FIRST only; outer completion builds the index with the world budget after all producer joins. Existing frozen snapshots, disjoint ranges, graph tickets, lane grants, private errors, typed failures and drain order preserved. Native exact equivalence/rendezvous passes. |
| `scaffolding/tests/frontend_iteration_profile.tower` — `b7efe4418dd010afb7404494de84512c9a1cc1396e78329c7c6b8c2f80452a23` (183 lines) | Extends existing serial profile with the actual closure caller and independent oracle.32 seeds/2000 rounds define fixture data; bounds derive from arrays/types. Checks every ordered result outside timed interval, releases all owners, requires counter-safe serial transport. Cold/installed entries unchanged; no real-worker counter use. |
| `scaffolding/tests/frontend_main.tower` — `e3c7da9333576fab424c9fc1601cf5ef9a9c5731b1b7b490adaca6f0c7978e2e` (148 lines) | Adds only lr-suffix selector, preserving all B1 entries and lr-order failure checks. Reuses existing target/transport; no D1 generic harness or manifest change. Full entry/default path reviewed. |
| `scaffolding/tests/lr_analysis_comparisons.tower` — `0e153cc0989355ba78f811adf357e0a654f790b1c895151ed96e05d8b639c129` (173 lines) | Nullable/nonnullable recursive range fixtures, shared symbol spans with distinct ends, names/counts derived from data. Existing independent oracle compares full items/states/actions/probes, not queue width. B1 duplicate-core cases and150 random trials preserved; all temporary graphs/buffers retire. |
| `scaffolding/tests/lr_analysis_failures.tower` — `ea36898c5ee7d344873fa0fb233b650967907c28be88c154cf1cfbe649b72acf` (313 lines) | Finite world-budget exhaustion returns Capacity before publishing index; same-analysis retry/reuse and408-byte charged census, final zero grants/buffers. Allocation sweep now checks same-analysis recovery, and a reached invalid suffix must fail after FIRST deliberately accepted its unreachable tail. Serial instrumentation only. Unchanged runtime/control/probe failure helpers reviewed; broad control allocation sweep was not rerun in this batch. |

Pinned Deck medians cold1.65->1.60s and installed1.78->1.72s; caller17.858->16.701ms
for2000 checked closures. Peak ledger grows30656B, final retained bytes unchanged.
The initial unpinned installed regression and all outliers remain visible in the
journal. Normal native LR equivalence passes; the1000-body workers1/2 control is
only modestly faster with increased CPU, not final all-core acceptance. No ABI
export additions, persistent cache, cross-world sharing, hardware-counter claim
or universal race-freedom claim. Full integrated sanitizers/platform/bootstrap/
browser/generation/deployment remain ROOT's pending milestone.

### Distribution packaging follow-up, 2026-11-23

Full-file review at6019450c plus this scoped change:
`scaffolding/tools/package_playground_assets.tower` SHA256
0578e9bc479e7aaf67d5dd1172364403d6d39a5fff14cfa629100f332e2b9e34.
Private ByteBuffers/file traversal remain serial tool-owned; gzip must publish
before removing either raw backend staging file, all errors propagate, buffers
release via defer, checksum manifest remains last. No world/payload/scheduling
contract changed. The OS-boundary fixture `playground/tests/build-packaging.test.mjs`
SHA256 bc992af0c42cd5a7cb6f8de3d95db01303125408ac4e62a9fef58d9e6ccad850
was read completely; adds raw-absence and real fetchBytes decompression checks,
retaining synthetic-only data and all required-input/hash/lifetime assertions.
[Exact size/caller/measurement evidence](compiler_distribution_size_25dddd04.md)
records failing old-tool regression and passing final gate; ROOT hosted adoption
remains outside this review. No new Tower inventory path.

## Completion-ledger delta at a06ec4b1 (2026-11-23)

This finite review adopts compiler/library/backend source
`a06ec4b1f9f44419882477bc1a55b6ed39e2200b` (scaffolding tree
`af42e5c92e32ed384455e847627836a590a341fd`) and separately the packager at
`6b74889b0ca29f1261af0dd55f5c9b27f6ce6ccc`. The prior full Tower inventories and
[D1's finite1e60c511 review](compiler_ecs_audit_d1.md#2026-11-23-d1-finite-pending-source-review-at-1e60c511)
are the unchanged base. `git diff --name-only 1e60c511 a06ec4b1 -- '*.tower'`
derives43 authored paths; no path was inferred from an owner's summary. The map
below names every one, with final source identified by `a06ec4b1:<path>`.
Local `build/d2_ecs/ledger_a06ec4b1/{changed_tower.paths,frozen_tower.blobs}` retains
the exact inventory/blobs. This is source/receipt review, not new runtime evidence.

Review keys (implementation and owner tests alone are not independent review):

- **R1:** D1 review5b4b0303 at `ea606d329b989378df15fdc58bf5165456bb0cb7`.
  These three final files are byte-unchanged. Joined stages publish before alias
  validation; all aliases validate before any executable-ready publication.
  Typed failures retain ownership until teardown. Registered scalar-condition
  negatives retain bool location/terminal/no-program checks alongside inference.
- **R2:** D1 review6d1534a6 at `0ffba950ae4b7e583531f5eb88aa608c6c2bb380`.
  These four final files are unchanged. The module-body query helper runs only
  in its coordinator context, saves/restores lexical state and drives existing
  demand/resume pumps; worker bodies do not recursively force module completion.
  Captures, quiescent cycle diagnosis and source-ordered effects remain explicit.
- **R3:** new independent D2 review here of L1's95167e53 counted-byte addition,
  preserved through ad0a0c34. Full new fixture/provider and storage selector/CMake
  registration read; substantive result below. Owner execution is separately cited.
- **R4:** new independent D2 review here of D1's58a1fe9f oracle additions,
  final owner execution fd8f8dac/e70b8b68. Full two files and registration/callers
  read; their underlying A2 producer review is R2, not superseded.
- **G:** B1 gate05780abb through6019450c/7eaec245; [owner receipt](compiler_budget_gate_70e77b60.md).
  L1's independent review **d7635e9c/d21fb20d** arrived during publication;
  [66-path source/caller review](entity_budget_gate_review_6019450c.md) at6019450c
  covers the14 changed gate paths. All match a06. It traces nonrecursive callbacks,
  lock ordering, foreign ABI and drain-before-close; this is not a new runtime test.
- **S:** B2 inline storagef9565c46 through4a8694da/68a0b8bf;
  [owner receipt](entity_inline_component_70e77b60.md). Same **L1 d7635e9c** review
  covers the7 a06 paths, which match6019450c. It verifies stable inline ownership,
  fallible promotion/rollback and page/heap census, and corrects the receipt's
  derived alignment to16 (measured tables unchanged). Later repaired full-fault
  fixtures have their own boundary below; old failures remain recorded.
- **U:** L2 overflowa5ffb99d/3bc5f626 at a06. D1 **833657a1/8ff77438** now independently
  reviews all8 final files in the [published overflow review](compiler_ecs_audit_d1.md#published-unsigned-multiply-overflow-review--2026-11-23).
  This resolves9e481050's earlier missing-publication prerequisite, not its
  historical result. It finds an admitted i1 bool-OGt recheck defect in
  `bi_multiply_overflow` (expected integer-operands diagnostic), source-confirmed
  and unexecuted. u32/u64 owner execution does not cover this edge; L2 owns repair.
- **C:** D2 C fixture separation31bd0359, published70e77b60. Final fixture and
  selected driver callers/registration reread here; **self-review**, not independent
  adoption. D1 U now reviews the final C registration, including preservation of
  the direct subset. No matching peer review was identified for the new direct
  fixture and `driver_differentials`; ROOT peer adoption of those two remains open.

Every path below is relative to `scaffolding/`. The notes describe the changed
ownership/storage/scheduling contract or fixture role, not another filename-only
inventory. Pending review keys remain pending even where owner checks pass.

| Authored path at a06 | Review | Changed contract / disposition |
| --- | --- | --- |
| `backend/import_bindings.tower` | U | Detect unsigned multiply-overflow intrinsic; classify actual LLVM integer width, not pointer/carrier width. |
| `backend/import_instructions.tower` | U | Safe-divisor reconstruction, low-product/overflow extraction and predeclared scalar assignments; unsupported consumers diagnose. |
| `backend/import_module.tower` | U | Exclude intrinsic aggregate from scalar local preallocation; preserve extraction locals and prior counted initialization. |
| `compiler/frontend_units.tower` | G | Parallel budget gate opens before use, closes after pool/world/receipts; serial path creates none. |
| `compiler/semantic_declarations.tower` | R2 | Shared module-expression declaration query pump preserves owner captures and existing dependency states. |
| `compiler/semantic_execution_work.tower` | R1 | Joined executable alias validation precedes ready-state publication; failed staged ownership remains releasable. |
| `compiler/semantic_statements.tower` | R2 | Coordinator-only local annotation/initializer queries save/restore lexical body state; no worker forcing. |
| `host/work_linux.tower` | G | Opaque nonrecursive pthread mutex transport, fixed documented glibc LP64 storage/initialization ABI. |
| `host/work_macos.tower` | G | Unfair-lock transport; independent review and actual macOS runtime coverage absent. |
| `host/work_portable.tower` | G | Unsupported gate open/failure boundary stays explicit; not a fake portable mutex. |
| `host/work_wasi.tower` | G | One-permit semaphore-backed gate retains checked wait failure; no browser runtime adoption inferred. |
| `host/work_windows.tower` | G | SRW lock pointer-word storage; later A1 Windows x64 runtime receipt607f9ce9 uses this unchanged provider. |
| `library/entities.tower` | S | First pointer in descriptor; checked private promotion to heap; reclaim must distinguish inline ownership. |
| `library/entity_stage.tower` | S | Staged construction/discard uses same inline ownership; cancellation retains already-grown capacity. |
| `library/entity_types.tower` | S | Stable Entity descriptor gains one pointer; ABI consumers require coherent rebuild. |
| `library/work_gate.tower` | G | Explicit unlocked-owner open/enter/leave/close contract; no reentry or close with active users. |
| `tests/alias_type_query_checks.tower` | R1 | Exact scalar-bool diagnostic/location, failed terminal state/no partial program at32/64 workers1/4. |
| `tests/backend_import_bytes.tower` | R3 | Execute counted bytes/guards after original-world destruction and fresh Foundation parse; wrong-oracle controls clean up. |
| `tests/backend_import_fixture.tower` | R3 | Optional target-width raw-byte helper uses counted arrays/memmove/guards; original import-admission fixture retained. |
| `tests/backend_source.tower` | U | Existing source service gains focused overflow selection; response/recheck ownership contract remains shared. |
| `tests/backend_source_native.tower` | U | Native probe accepts the overflow selector; native process RSS is not Wasm linear-memory evidence. |
| `tests/backend_unsigned_overflow.tower` | U | Ordinary product32/64 boundary fixture preserves outputs; constant-folded top-level results alone were insufficient. |
| `tests/backend_unsigned_overflow_calls.tower` | U | Fresh imported caller retains12 actual calls into unchanged reconstructed module; no second optimizer/reference model. |
| `tests/backend_void_returns_direct.tower` | C | Direct void*/void** null/alias/effect subset has no function-value/indirect-call requirement. |
| `tests/driver_c_cases.tower` | C + U | D1 U reviews the final list: supported direct subset retained, overflow registration is not imported-path execution. |
| `tests/driver_differentials.tower` | C | Complete callback fixture remains native LLVM execution with interpreted reference and exact0 output. |
| `tests/entity_accounting.tower` | S | Census must count inline bytes within descriptor, not a second component-index allocation. |
| `tests/entity_component_faults.tower` | S | Adds focused inline promotion denial/retry; original full fault failure is retained, not replaced. |
| `tests/entity_component_layout.tower` | S | Descriptor inline address and subsequent heap promotion/layout checks. |
| `tests/entity_locality.tower` | S | Distinguishes inline/heap index accounting from stable payload-page occupancy and pointer traversal. |
| `tests/execution_main.tower` | R2 | Existing module-body selector wired to the shared execution fixture, no second scheduler. |
| `tests/module_body_type_checks.tower` | R4 | Independent marker-derived file/line/column and terminal/no-program errors; explicit session/budget cleanup. |
| `tests/module_body_type_minimal.tower` | R2 | Ordinary minimal module-body forwarding trigger retains the same declaration query. |
| `tests/module_body_type_queries.tower` | R4 | Self-address initializer executes once, checks its own storage and separate effect count. |
| `tests/semantic_executable_admission_checks.tower` | R1 | Failed alias publication/admission checks share production work ownership, not alternate execution. |
| `tests/storage_main.tower` | R3 | Counted-byte selectors execute under existing serial instrumentation guard; old selectors retained. |
| `tests/work_arena_profile.tower` | G | Profile gate setup/teardown changed; arena ownership and measurements retain existing mechanism. |
| `tests/work_arena_shared.tower` | G | Disjoint worker arena sharing uses new budget gate; completion/barriers remain counting signals. |
| `tests/work_budget_shared.tower` | G | Shared admission/release/revision/notification controls adopt nonrecursive gate. |
| `tests/work_buffer_profile.tower` | G | Budget synchronization boundary changes without redefining measured live/peak receipts. |
| `tests/work_buffer_shared.tower` | G | Joined buffer ownership/failure/cancel controls use gate, not unsynchronized fault counters. |
| `tests/work_schedule_budget.tower` | G | Lane notification/admission controls preserve shared scheduler and counting completion signals. |
| `tests/work_vector_profile.tower` | G | Vector profile adopts same explicit gate lifetime; no independent container/scheduler introduced. |

Outside that43-path compiler freeze, `tools/package_playground_assets.tower` at
6b74889b is **P: accepted D2 implementation/owner checks, independent peer review
not identified**. Its [full-file self-review above](#distribution-packaging-follow-up-2026-11-23)
and [size/load receipt](compiler_distribution_size_25dddd04.md) remain exact:
SHA256 `0578e9bc479e7aaf67d5dd1172364403d6d39a5fff14cfa629100f332e2b9e34`.
Gzip completes before raw LLVM dist removal, errors propagate and checksums publish
last. No compiler/provider/foreign ABI change; no fresh hosted acceptance.

### New independent fixture findings

**R3 counted bytes:** the original LLVM provider stays available without byte
execution; the opt-in branch constructs two counted arrays, explicit before/after
guards, a length-derived initialized destination and exact memmove. No trailing
NUL convention replaces counted bytes. The new fixture imports at32/64, formats
ASCII Foundation, closes LLVM/releases the old nodes/world, then parses the saved
text into a fresh frontend. Source bytes are snapshotted before their buffers and
original budget are freed. The ordinary Graph invocation must print the independent
19-value oracle, including65/0/128/255/0/67 and boundary guards. It releases the
invocation/frontend and checks buffer baseline before returning the deliberately
wrong-byte/wrong-guard result. These controls alter the oracle only after the real
oracle passed; they do not mutate producer code or accept arbitrary diagnostics.

`cmake/TowerStorageTests.cmake` retains the original120s import selector and adds
three60s byte selectors. Only the two intentional exit1 oracle controls have
`WILL_FAIL`; assertion failures use abort, which is not inverted into a successful
CTest exit. `storage_main` first requires no real thread transport and capacity1,
so global allocation-denial instrumentation stays serial. L1's95167e53 receipt
records the focused four CTests and fresh width/oracle runs; this independent
review did not rerun them. No byte/guard ownership or registration defect found.
This closes the narrower counted-byte coverage follow-up recorded by D1 at1e60,
not every initializer shape or sanitization/real-overlap coverage.

**R4 module-body oracles:** expected error location is derived independently from
an ASCII source marker, then compared with the configured module filename,
line/column and stable offset. Unknown-constructor and recursive-layout messages
remain exact; no program or executable starts after failure. Each32/64 Graph/Fast
and workers1/4 session has its own world/budget; source borrows outlive the session,
world teardown precedes final zero-budget checks, and the gate closes last.
Canonical comparisons and four canonical reparses remain. The self-address
initializer compares its stored pointer with `&self` and separately counts effects;
it is not merely reexecuting the producer's output as its reference. No removed
control or forced producer completion found. The44-session native result belongs
to D1's fd8f8dac/e70b8b68 receipt; it is neither44 concurrent jobs nor D2 runtime.

**C self-review, explicitly not independent:** the direct fixture derives122 effects
from two ordinary pointer calls, two deeper-pointer calls and notify, checks nulls,
alias mutation and deferred free, then requires0. The full callback fixture is
unchanged and still tests function returns/indirect apply via native LLVM. The
selected driver snapshots its source, first checks ordinary interpreter output
against `0\n`, then compares both raw/optimized native execution. The C list retains
all other selections and adds only the supported direct subset in place of the
callback fixture; the later U registration is separate. D2's70e77b60 receipt retains
the original intentional C function-value diagnostic,16 direct C comparisons and
both full LLVM comparisons. No C-emitter capability was extended. D1's new U
review covers the final registration; the direct fixture and differential driver
still need peer adoption. This author's reread cannot supply that role.

### Remaining source and execution boundaries

G/S/U now have the exact independent reviews above, including U's open i1 defect.
C's direct fixture/differential driver and P lack matching peer receipts. All43
frozen authored paths are accounted for; owner tests do not fill those three gaps.
The unchanged current capture helper/controls and browser error transport were
compared with their reviewed receipt freezes; no implementation adoption by name
alone. The CMake byte selectors were independently read here; prior exact-output
CTest/alias-negative changes retain D1's ea606d32 review.

Publication merge `d9e7e5c7` preserves complete e637ba38 and this audit. It introduces
seven explicitly **post-a06 fixture** paths; these are not silently covered by the
43-path source freeze or L1's earlier review:

- B2 `tests/entity_component_faults.tower`, `tests/entity_stage_result_faults.tower`,
  `tests/entity_fault_accounting.tower`: owner2f4361f6/a18d584e now passes both full
  modes using reachable physical-allocation conservation, not an arbitrary byte
  tolerance. [Receipt](entity_fault_accounting_6019450c.md) preserves both baseline
  failures and exact causes. Independent final fixture review not identified.
- A1 `tests/work_budget_shared.tower`, `tests/work_gate_windows.tower`,
  `tests/work_pool_windows.tower`, `tests/work_thread_windows.tower`, plus
  `cmake/TowerWorkTests.cmake`: owner607f9ce9/4d5baa5a actual Windows gate1/4,
  full pool/negative and plain Linux checks pass with unchanged providers.
  [Receipt](windows_budget_gate_cabc2062.md); independent final fixture/registration
  review not identified. No Tower producer is newly adopted through these tests.

Second publication merge `51ab5a02` preserves complete6649bbe1. One additional
post-a06 Tower path, A2 `tests/backend_source_native.tower`, replaces a max-ID
observer allocation with actual distinct-ID work_vector storage and adds physical
index categories; `playground/src/llvm-host.mjs` only exposes the existing memory's
byteLength. [Owner2bad3e52/5744969c](entity_pages_wasm_storage_a06ec4b1.md) records
failed sentinel admission and corrected small/large, plain/census, worker1/4
checks. This is the eighth later Tower path; its final observer and read-only
transport accessor still lack a matching independent review. D1 U above covers
the older a06 native probe, not this incoming change. No production Tower provider
differs between a06 and the reconciled source.

ROOT b520e436 records source-checked a06 portable/LLVM-cross/shared build exits0.
New [L2 full views/registry55a6a91f](compiler_entities_t8_a06ec4b1.md) and
[B2 shared e71956ab](shared_wasm_a06_a18d584e.md) receipts complete actual execution:
two full T8 cases, Node3 and strict browser3+9 selections, including actual closes
and zero worker targets. They use their own frozen resources; older25 failures
are preserved. A2's exact965691B entity_pages unoptimized request now succeeds
under the original2GiB ceiling and matches native bytes; the complete semantic-port
execution/package/optimized/remaining-target gate is still unstarted by that probe.
B1 05daa172/bcd854aa supplies the actual joined
1/4/8/12 study (matching frontend/library/host source at a06), rather than multiplying
isolated gains. Four-worker multi-unit frontend speedup2.11x contrasts with best
single-unit1.063x; parsing/ordered work remains dominant. Actual successor Wasm
success, not a native result or higher cap, supplies the new scoped acceptance.
The full entity_pages remainder, the i1 implementation defect,
finite peer gaps, supported instrumentation, generations/public pin/current UI and
atomic release remain open in the [ledger](compiler_ecs_threading_handoff.md).
No broad source cleanup, build, new runtime assertion or performance claim by D2.

## Independent fault/Windows fixture review — 6e8001fd (2026-11-23)

Freeze `6e8001fd9aaf2fa8be550fb70d4f9e052ec93fc8`; all eight blobs below match B2 `2f4361f6` / A1 `607f9ce9` unchanged.
**No defect found; these seven Tower paths and the focused CMake delta now have independent source review.** Owner execution remains attributed, not rerun.
Read complete fixtures/registration, their implementation-parent diffs and necessary allocation/stage/pool/ledger/Windows dispatch callees; L1's accepted generic review remains the base.
Paths are under `scaffolding/` unless prefixed `cmake/`; Git blobs identify the actual reviewed source, not approval by hash alone.

| Path | Git blob | Disposition |
| --- | --- | --- |
| `tests/entity_fault_accounting.tower` | `da37a9e7b7ea0d3b6d45c00d8b413de45f9f4fba` | Allocation-free census of this fixture's disjoint roots/private stage; validates every counted receipt against owner and exact allocator request. |
| `tests/entity_component_faults.tower` | `a3c6c42c3a4534db8e1094dd9b25aab9dc7de6da` | Exact retained type-index delta, unchanged identity/payload/table/inline index, retry and complete dynamic failure sweep; original inline mode retained. |
| `tests/entity_stage_result_faults.tower` | `9c7973e8f67b051a80d5ddfdce085791fdfed7f3` | Failed prepare preserves membership/references/values and zero finalizers; successful publish consumes stage; exactly-once finalizers and final zero owners. |
| `tests/work_budget_shared.tower` | `c45267c7845c50530b439632ba119b0b9a02910a` | Platform-neutral gate import; real four-thread receipts/snapshots, exact byte/lane denial, generation/revision stale rejection, one-shot wake. |
| `tests/work_gate_windows.tower` | `7ac2b2b447f773f77392ea1ddd7075863ea60e9c` | Modes1/4, eight cycles; barrier proves four distinct native threads before release; protected8192 increments or cancelled zero, three accumulated counting permits. |
| `tests/work_pool_windows.tower` | `351674315ec6e30c09a71d30726996779ced5180` | Calls unchanged full pool main, including16 rounds, partial/full failure drain and graph-order checks; forwards every nonzero result to ExitProcess. |
| `tests/work_thread_windows.tower` | `49d4f04dbba1da95c35f367822533887b517c290` | Actual GetCurrentThreadId DWORD/u32 widened to fixture usize; imports production Windows transport, no simulated POSIX thread. |
| `cmake/TowerWorkTests.cmake` | `282fdcd13fbe6be40051e89e130a856bae6ddba5` | Linux x64 shared-budget target explicitly links the already-built host_work_linux object after hardwired import removal; Threads/dispatch export/30s test remain. |

Census: store allocation and each store/stage owned page are counted once; paged descriptors/payloads/names do not add separate receipts, while oversized allocations do.
Inline component indexes stay in descriptor bytes; heap child/instance/component/table-row indexes retain their own headers. Type-instance/lease pointers are not traversed as owning entities.
Private nodes are not published children yet; leased nodes are counted through their published tree. Pool transfer removes the old owner link, and post-publish census passes null instead of dereferencing the freed stage.
Stage vectors and retained ledger metadata are distinct: allocator live count equals baseline + census receipts + the one raw ledger buffer; teardown requires zero bytes/grants/lanes and the original allocator baseline.
A failed preparation may retain reachable, charged capacity without membership. The component trial admits only its independently measured new type-instance index; stage failures retain all prior semantic/reference assertions.
Source callees reserve old+new physical storage before copy/free. This post-call census checks retained ownership, not transient peak or arbitrary-world completeness; no whole-process cap claim.
Baseline-success allocation counts still drive every injected boundary and after-last success; no test was removed. Finalizers are forbidden on failed preparation and counted once per new payload at teardown.

Windows binding follows GetProcAddress(exported work_windows_entry) → CreateThread → u32 callback returning0 after work_thread_entry; joins precede handle/free, and SRWLOCK remains pointer-sized opaque storage.
Cancellation is written only while all jobs wait on release; semaphore handoff publishes it, receive observes completed payloads, then pool close stops/joins native threads before jobs/gates/signals leave scope.
Deferred release precedes pool close; budget parent cleanup/disposal precedes gate close. Wake callback only posts, never reenters. Invalid environment traps before allocating owners; published runtime calls ExitProcess(1).
Linux gets one platform object, not a second embedded provider; Windows entries instead import host.work_windows. CMake's other longstanding selectors are not newly claimed reviewed/changed here.

Owner evidence: [B2 full faults](entity_fault_accounting_6019450c.md), binaries `b3c778e9`/`18ecb7f4`, retains original exit134 failures and passes6/6/2/2 component boundaries, one lease and five publication boundaries plus retries.
Owner default wall/CPU ms / peak KiB: component .877308/0-reported/1384; stage1.370116/1.147/1600. Zero CPU is clock resolution, not absent execution.
[A1 Windows](windows_budget_gate_cabc2062.md), gate `9e62ce7e`/pool `c4e9d21f`: modes1/4/full-pool exit0; invalid3 exit1. Wall/CPU s / peak working-set B: .0159975/.015625/3821568; .0416744/.078125/4259840; .0236705/.015625/37318656; .0152662/0/3780608.
Plain Linux shared-budget exit0: .00wall/.01CPU s/1652KiB. The accidental instrumented-cache build was **BUILD ONLY**, never executed; no instrumentation acceptance or retry here.
Full artifact hashes/raw logs remain in those receipts: B2 `entity_faults_6019450c`, A1 `cache/a1_windows_gate`; local source map `build/d2_ecs/peer_fault_windows_6e8001fd/{paths,blobs}.txt`.
No code/runtime/build/profile change; documentation-only profiling inapplicable. D1 heavy slot untouched; twelve-row ledger unchanged. Remaining peer gaps: D2 direct-C fixture/differential driver/packager and A2 later native census/LLVM capacity accessor; no other gate is closed by this review.

## Independent reconstruction observer review — 1e428ede (2026-11-23)

Freeze `1e428ede6c33cba159b753247affd8d5cf3ed67d`; both changed files remain exactly2bad3e52/6649bbe1.
**No defect found in the scoped changes; these two peer-review gaps are closed.** Read full files, changed callers and allocation/observer contracts; no production edit or runtime rerun.

| Reviewed path | Exact Git blob | Disposition |
| --- | --- | --- |
| `scaffolding/tests/backend_source_native.tower` | `5d149aeda17fca3fde6430f1539583c35011af27` | Sparse-ID histogram, joined physical categories and owner teardown reviewed against actual Entity/WorkBuffer/WorkBudget producers. |
| `playground/src/llvm-host.mjs` | `dd311be9833e6c819e9907c65787be16ee861ecd` | New read-only accessor resolves this instance's current exported memory.buffer.byteLength on each call; no cached pre-growth buffer or allocator/limit change. |

Histogram lookup scans actual groups, not numeric ID space. After a new group successfully pushes, the old length is a valid new index; the row pointer is acquired after possible relocation, never retained across pushes.
IDs, including4294967294, stay u32 data; maximum is reporting only. Checked vector growth rejects overflow/admission failure before dereference; total group counts must equal all ParserMatch instances.
Labels/child roles are borrowed only during the synchronous joined callback; the preinstalled baseline owns the ParserMatch kind until world teardown. Lookup uses type_existing, never creates component kinds.
Each nonempty entity belongs to one archetype row. Its heap component/child/instance index is counted once; inline component storage is skipped before attempting an EntityBufferAllocation header read.
Table rows and component columns share one allocation rooted at table.rows; the observer counts that full capacity/header once, not columns again. Both store owned-page lists include full and partial pages, independently of available-slot lists.
Page ownership transfers unlink the old list; component payload and descriptor/name pools are separate. Per-kind page reports filter stable type IDs and are an alternative breakdown, not additional bytes to add to pool totals.
Logical count*data_size, label capacities and entity_count*sizeof(Entity) are not physical allocations. Oversized standalone blocks, unindexed kind indexes, other scratch/owners and foreign heaps are not fully censused.
The category-sum <= live-budget assertion is a consistency bound, not by itself proof of disjointness or completeness; the actual owner layout above supplies disjointness. instance_indexes=0 does not assert absence of all type indexes.
Compiler allocator headers are included via compiler_buffer_allocation_size; allocator-private overhead/RSS are excluded. Ledger metadata is separately reported, not double charged as payload/page bytes.

Only FrontendParse/SemanticDispose boundaries inspect the world, after synchronous worker stages join; worker-kernel callbacks return without touching this census. No payload, table, page link or ownership reference is modified.
Private histogram work_vector charges the supplied budget and frees via defer after each callback; its temporary allocations can affect peak/ledger retention. Optional observation is not allocation-free or timing-neutral.
The old+new growth contract retains the previous vector on failure. A failed utility_check prints and aborts: it cannot continue into an invalid index, but this is **not recoverable observer OOM cleanup evidence**.
Normal returns and ordinary compiler-error returns clear the observer before releasing its stack context; source/session/modules/world close before final zero bytes/grants/lanes, ledger disposal and gate close.
The separate deny-recheck mode holds/releases its explicit reservation and preserves prior output; census and denial modes are exclusive. No new fault-injection coverage is inferred from the six successful census/plain runs.

The JS accessor performs no grow/allocate and returns only current linear capacity, not live bytes, a sampled peak, configured maximum, remaining allocatable space or process RSS. It does not authorize increasing the2GiB ceiling.
Current semantic-port phase logging uses distinct llvmCapacityBytes, rss and maxRssKiB fields; the loader owns the instance through its closure. The accessor is transport, not a second allocator/census implementation.

Attributed [A2 receipt](entity_pages_wasm_storage_a06ec4b1.md): native executable `0c8bdbb65f4979be4932dc5e3f291a34ac87235f1495c8a95073ff66a1c89d2a`, mounted a18d584e plus observer, public768; **six native exits0**, resource0/final owners0, unchanged small/large outputs across workers1/4 and census/plain.
Large plain1 versus census1 wall/CPU s/peak KiB:10.801937/10.698070/2933020 versus11.198066/11.099400/2934484. Sparse groups173/168 small and161 large,12288B vector capacity; original guard exit134 and compile/metadata failures remain recorded.
Exact965691B guest input SHA`fadb0568535010d954cafde4ce9559e5636829c81e181be66b14e27f187b08d5` returns native-identical4675795B on compiled a06 LLVM `8acbaf08545d0ce972f2de7db2a89fcfc7ef434f95f775feca06dde759107697`.
Isolated25→a06: exits1→0, command wall172.1796941→132.5450749s, cumulative CPU at response238.765→195.452s, peak RSS at response2028912→1862976KiB, capacity2147483648→1978990592B. Response counters are not final exit metrics; failed-versus-successful requests are not a throughput speedup.
These native/guest freezes predate later backend work; this review does not relabel them as execution of1e428ede. No new full differential, runtime, sanitizer, bootstrap or hosted claim.
Raw A2 paths remain `cache/logs/entity_pages_{25dddd04_4354581c,a06ec4b1_a18d584e}` under its receipt root; local exact map `build/d2_ecs/observer_review_1e428ede/blobs.txt`.
Documentation-only profiling is inapplicable. Twelve-row ledger unchanged; B1 page-policy work excluded. C split peer review remains B2's assignment, packager A1's; this closes no unrelated acceptance gate.

## Independent i1 overflow reconstruction review — 5fc00c85 (2026-11-23)

Freeze `5fc00c8597760ac9c21613cbd78063ddf9f4236d`; implementation `158624c70827ba5d89f4dd2a3e7e864739b74f26`, publication `1e428ede6c33cba159b753247affd8d5cf3ed67d`.
**No scoped defect found; this producer/fixture peer-review gap is closed.** Compared implementation parent `e637ba38`, read both new fixtures fully and traced immediate builders, callers, registration and cleanup. No producer edit or runtime rerun.

| Reviewed path | Exact Git blob | Disposition |
| --- | --- | --- |
| `scaffolding/backend/import_instructions.tower` | `057d57de2b64f1958ce1d3a0d5e82df0cd6ea025` | i1 branch precedes arithmetic construction; unchanged wider formula and extract dispatch reviewed. |
| `scaffolding/tests/backend_overflow_fixture.tower` | `d5b7bde6d47c81f6a3b612dfa70862aaf34ae1c8` | Independent truth/factor oracles, runtime parameters, distinct cross-block extracts and valid capability-negative IR. |
| `scaffolding/tests/backend_import_overflow.tower` | `e9b2a9694bf892228fc0dfa45767959e3d696643` | Fresh canonical recheck, both engines/target widths, exact result/error/offset, bounded execution and complete ordinary cleanup. |
| `scaffolding/tests/backend_import_fixture.tower` | `71ec8c886404b3124c80722e3411834cbea56389` | New fixture import only; original admission/count-byte provider retained. |
| `scaffolding/tests/storage_main.tower` | `39a0edc990a5e2dc3c331174476649d44a10cd14` | Existing backend-import runs original fault suite then overflow once; focused selectors return its failure code. |
| `cmake/TowerStorageTests.cmake` | `30894c794457073a4d0f1390d1d83c5ad084d35b` | Existing selected CTest invokes that chain with unchanged120s bound; no permissive output regex or WILL_FAIL on this positive gate. |

For unsigned i1, (0,0)/(0,1)/(1,0)/(1,1) give product0/0/0/1 and false overflow. `bi_binary(OAnd)` uses the existing bool→u8/masked-result→bool legalization; no bool multiply, divide or ordered comparison is constructed, including product-only/flag-only requests.
Widths2–64 retain masked modular product, max/(a!=0?a:1), and a!=0 && b>limit; selection is materialized before division. `bi_pow2(64)` wraps in u64, so subtracting1 gives the correct maximum. Scalar widths and pointer target widths remain separate; no Foundation numeric policy changed.
`bi_function` allocates a distinct local per LLVM extraction before importing blocks, excluding the aggregate call itself. The helper evaluates operands into existing SSA references, materializes shared product/flag at the dominating call and assigns each extract local there; later extracts return null instead of replaying work.
The helper bypasses final-result coalescing, so `bi_result` cannot steal a shared/existing extract binding. Module/use pointers remain borrowed during synchronous import; all new nodes belong to the same private stage, with world-budgeted disposable associations, not another IR or global cache.
Only one-index extractvalue0/1 is supported. Verified aggregate-store/vector/i128 controls preserve the exact capability diagnostics; prior error text/offset wins before import. No invalid LLVM index is presented as an executable rejection case.

The i1 oracle is exhaustive; i8/i16/i32/i64 use ten rows with zero on each side,1,max and independently derived factor/wrap identities, not the importer's division formula. Both/product/flag modes have separate extracts in entry and both successor blocks; zero/nonzero inputs take both branches.
The fixture calls `backend_optimize(false)`: verifier only, no O2 inlining/folding before reconstruction. Intrinsic operands are probe parameters and expected values are separate parameters. Calls and extraction users therefore reach import; this is not a claim that this fixture tests survival through LLVM O2 or executes emitted machine code.
Thirty fresh imported/formatted programs × Graph/Fast give60 configurations at target32/64 and528 probe calls. Each engine reparses, requires terminal success and exact `0\n`; step exhaustion fails. Failed rechecks reject both starts at zero steps and return1 after cleanup.
The LLVM world closes before canonical text enters a separate recheck world. Text's budget remains alive until format disposal; sessions, modules, worlds, ledger grants/bytes/lanes and compiler-buffer baseline drain. Rejection additionally checks unchanged entity/component census and no output payload/children.
Production stage/association cleanup remains checked and first-error preserving. Fatal fixture `utility_check` aborts on a violated setup/assertion; it is not recoverable OOM cleanup evidence. The original allocation sweep remains enabled, but does not inject failure at every new overflow-specific allocation.

Attributed [D1 receipt](compiler_ecs_audit_d1.md#d1-admitted-i1-overflow-repair--e637ba38-plus-focused-delta-2026-11-23): before, all12 i1 rechecks fail `This operation requires integer operands`; after, all60 configurations and8 rejection controls pass, with original admission sweep/registered CTest passing. This is owner execution evidence, not a D2 rerun.
D1 public768/native LLVM19 Release, Deck CPU0,2/8GiB, jobs1, single-owner host; one fresh-process warm-filesystem sample. Before→after wall/CPU s/peak KiB: i1 failure1.64/1.60/118268→success1.56/1.54/122372; wider5.72/5.67/127000→5.65/5.60/126692. Final registered check7.91/7.65/127068; no speedup or scaling inferred.
Owner binary SHA256 `219736c8770a7a0368a19f9758e4e552c680dfbfb74eab99bc6aeafacddf8020`; raw retained logs/inputs/build failures: D1 `build/d1_ecs/umul_fix_e637ba38/`. Source reconciliation at1e428ede records unchanged tested closure; current six reviewed blobs still match158624c7.
Local exact path/context map: `build/d2_ecs/umul_peer_5fc00c85/{paths,blobs}.txt`; implementation drift file is empty. Immediate contracts were traced only as needed, not a new full-file audit of all mapped callees.
Limits: widths2–7/nonstandard widths are source-reviewed, not added runtime cases; poison/undef totalization and other intrinsic families are unchanged and not newly validated. The unavailable608636B entity_views large-request comparison remains unrun; no substitute benchmark, sanitizer/threaded coverage, reactor/generation/hosted adoption claimed.
L1's separate pointer-ordering `bi_compare` repair is excluded; this helper fix does not close entity_pages/stage-ownership failures. ROOT retains integrated artifacts/release. Documentation-only profiling is inapplicable; D1's heavy slot, twelve-row ledger, todo and other owners' sources are unchanged.

## Native overflow reference extension — ae5d34b2 (2026-11-23)

Frozen published `ae5d34b20574dd8a9bc5cb041e2e6332e87ba0dd` plus this focused delta; full changed-fixture review by D2 (author review, **not independent peer approval**).

| Path | Tested Git blob | Disposition |
| --- | --- | --- |
| `scaffolding/tests/backend_overflow_fixture.tower` | `623da5f2115ad9b887163005d4055cacc9cac4c2` | Same generator/oracles; default wrong=false preserves old callers. Negative changes one expected argument. Fixture-only O2 refresh disposes its prior LLVM text; call census borrows verified module and allocates nothing. |
| `scaffolding/tests/backend_import_overflow.tower` | `9e3fcc03c0565e12f669c889989fa020094bfbe5` | Existing exact-zero entry delegates to shared expected-output checker; terminal/step/error/cleanup assertions unchanged. |
| `scaffolding/tests/backend_overflow_native.tower` | `527f21ebe0ebb78662765575b42fe3efa093d990` | New focused entry reuses generator, Backend emission, existing driver link/process/file APIs and canonical session checker. Local buffers/argv stay alive through synchronous child reap; copied link buffers are borrowed, not disposed twice. LLVM world closes before recheck; budgets and buffer baseline drain even on deliberate mismatch. |
| `cmake/TowerStorageTests.cmake` | `6028afa7f9bb7237d1521637f724a77ef506ca87` | Linux x64/backend-only sibling target reuses production providers and existing single-owner allocator/serial transport. Correct and intentional-nonzero CTests retain120s limit; other registrations unchanged. |

Existing README documents the explicit executable/resource inputs and fresh artifact cwd. GNU time and complete IR/object/canonical/stdout evidence: `build/d2_ecs/overflow_native_ae5d34b2/`; the journal's native-reference receipt records exact results/costs.
30 native raw/O2 comparisons and60 target64 Graph/Fast checks pass; direct wrong control returns1 after exact1 outputs and zero ownership delta. Both selected CTests pass; no skips. Raw machine code still calls the probe (checked i1:4, i64:10); O2 folds main to a constant print, so only raw runs establish dynamic intrinsic reference coverage.
Original D1 target32/64 verifier-only and unsupported-consumer evidence remains separately attributed; no fresh repeat or machine32 claim. No production importer, scheduler, storage or arithmetic policy changed. This extension needs peer adoption; ROOT owns integrated artifacts/instrumentation/release.

Final integration: complete289185f2 history preserved in `3c8cd4571a118006ab7841717e21b4a39c1c4cd4`, including child layout plus the earlier pointer-ordering/page-policy/lowering rollback. Reviewed test blobs unchanged; only affected providers rebuilt. Both focused CTests pass again (same30 native/60 Graph+Fast positive counts, intentional-nonzero control and zero owners),12.48wall/11.82CPU/123764KiB. Final binary `d6f8627aa82314cc4b9b09c94961ecf4a581eb3ac0f3bbd03cbc1cc4d433045d`; exact source/artifacts under `final_*`. Earlier d5f18abb14.80wall/14.06CPU/125540KiB and binary `6c7de6923093b639baf4c7ad57236dfe6eb7078c9bc3808130f63f288c01eb0a` remain under `merged_*` alongside the original evidence. This is affected-input adoption, not independent review of incoming producers.

## Independent ConstantExpr address review — d962222a (2026-11-23)

Frozen published `d962222af10bb062a1ad18c7beb8531ed00dc7ee`; implementation `13f30c25f5545064113a5d392bbd5967e4938ce4` against parent `289185f25b0d08614ef3cb40b4c4635d57d2fc8d`. All six changed source/registration blobs match publication. This is D2 source review, not a runtime rerun; later A1 metadata/B1 LR changes are excluded.

| Reviewed path | Exact Git blob | Disposition |
| --- | --- | --- |
| `scaffolding/backend/import_values.tower` | `8422cd0ed9c1a9bd82d69361d2c53c4a879986aa` | `bi_value` delta and immediate scalar/mask/cast/ownership contracts reviewed; only ConstantExpr add/sub admitted. |
| `scaffolding/tests/backend_constant_address.tower` | `778bd9fac15db3487f5c171e210f1dc37b5b8745` | Ordinary global initialization/address wrapping, exported reader, type-derived extent, independent bytes7/19 and exact error count0. |
| `scaffolding/tests/backend_constant_operand_checks.tower` | `52cd96da5bac8da1c9ded1f3fda2c9a39a28d72d` | Full fixture: verifier-valid non-entry blockaddress, first-error priority, no output payload/children, unchanged census and deferred owner release. |
| `scaffolding/tests/backend_source_native.tower` | `85d7bf03c238950597c801c40c2556e181477f28` | New selector/negative helper/IR guard and existing service/teardown traced; saves actual LLVM and reparsed Foundation. Sub guard limitation below. |
| `cmake/TowerBackendSourceTests.cmake` | `ee31238fa46206af4b881a39678b365ab323a4ba` | Four width4/8 × workers1/4 import/recheck registrations, unique outputs,90s bound and real failure exit; existing cases retained. |
| `cmake/TowerExecutionTests.cmake` | `31cd6170ac6053edcc8db141aa31bfddfc3162d0` | Two source execution registrations; each internally runs Graph/Fast × workers1/4. They do not consume the other target's generated output. |
| `scaffolding/tests/README.md` | `f24245dea0df1cd6f41a1f2533308ca799a5de11` | Existing resource/runtime, recheck and ledger limits agree with callers; no new constant-address-specific entry. CLI usage/CMake supply the selector. |
| `docs/backend_constant_address_e330a2c9.md` | `0fce2d24ef2c251830274dd7e13a8552a7cf21fe` | Attributed owner receipt, preserved failures, input/artifact identities and direct-versus-second-normalization distinction reviewed. |

`bi_value` handles ConstantExpr kind10/opcode8 or10 by reconstructing left then right exactly once per invocation, then existing `bi_binary(OAdd/OSub)`/`bi_mask`. Temporaries materialize operands/results; this adds no constant evaluator, global cache or new authoritative representation.
`bi_module` associates every global with its world-owned storage before importing initializers/functions. `bi_value(global)` produces that binding's address; ptrtoint passes through target `SUSize`, then the LLVM integer scalar. No native host address is embedded. Target32/64 wrapping follows unsigned scalar arithmetic and truncation masks; bool legalization and nonstandard-width masking remain shared, not newly broadened policies.
An earlier backend failure returns before operand work. Unsupported type detection precedes child reconstruction; a failing left prevents right-side allocation, and guarded builders preserve the first typed error/offset. Existing GEP/cast cases remain; other values/opcodes still reject. Explicit null replaces the already-failure-guarded zero-builder call, not a successful zero fallback.
Synchronous import borrows LLVM/source owners, creates private staged nodes and world-budgeted association vectors, and defers their disposal. Operand failure exits before destination attachment/publication; successful publication transfers the program payload once. This review does not establish every late-publication/allocation-failure path; the new negative is not an injected OOM sweep.
The blockaddress control branches from entry to a distinct exit and returns that exit's address, so LLVM verification genuinely precedes the unsupported-import check. Both fresh Backend instances use the same world; prior-error variant requires exact text/offset23/resourceNone. This tests same-world reuse, not resetting/retrying a failed Backend instance.
`backend_source_import` formats into a private candidate, closes imported/input graphs, reparses in the same world/environment and commits session text only after success. The later execution runner creates a new world per worker setting and separately compiles each engine; exact `0\n`, terminal success, canonical equality and zero budget bytes/grants/lanes are required.

Attributed [A2 receipt](backend_constant_address_e330a2c9.md):11/11 focused CTests (six new plus five existing), eight negative invocations,24 direct Graph/Fast configurations, and original CLI second-normalization jobs1/4 pass. A2's source probe SHA256 is `6d59b3d1ec6cb351adb98bab5c0a6de22830f511746ad7ecc8fea14294cd22a7`; companion executable/source/IR identities remain in that receipt, not remeasured here.
The reduced source produces observed add **and sub** per the retained intermediate add-only failure; committed `constant-address` checks only `" add ("` and `"ptrtoint ("`. **Coverage gap:** it would not detect a future optimizer removing every sub. A2's smallest follow-up is a sub-presence guard against the retained IR, not another arithmetic oracle.
The four importer CTests recheck generated text but do not execute it; the two execution CTests consume the original fixture. **Registration gap:** reconstructed-output execution is presently A2's retained manual evidence, not a CTest dependency on `constant_address_${width}_${workers}.tower`. No source execution is relabeled reconstructed execution.
The original CLI `--interpret-fast --optimized-ir` enters `driver_compile_normalize` (lower→optimize→import→format), then recompiles generated text. A2's identical608571B second-normalization IR and output0 address that original failure separately from direct Fast admission. The large input is target32 only; reduced32/64 coverage is not large64 evidence.
Owner Linux x64/LLVM19/public768, CPU0–11/24GiB: focused CTests6.692wall/5.629CPU s/187512KiB; exact CLI jobs1/4 respectively3.955/3.870/755632 and3.325/4.198/768796. Charged reconstruction peaks647017515/647016571B, final zero owners; RSS is measured child peak, not ledger or simultaneous process-tree sum. No speedup inferred.
Raw owner evidence: `C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/second_normalization_e330a2c9/` (`focused.log`, `reduced_execute_*`, `input_execute.*`, `joined_large_w1_execute.*`, `joined_*`, `before_*`, `candidate*`). These Windows paths were not independently executed/read on Deck; this adopts the published receipt with that limit.
Local source map/delta: `build/d2_ecs/constant_address_review_d962222a/{reviewed_blobs.txt,callee_blobs.txt,implementation.diff,publication_drift.diff}`; publication drift is empty. Callees were traced only for these contracts, not recertified as a full-file census.
Disposition: independent source review complete, no demonstrated producer defect; the two durable regression gaps above remain A2/ROOT follow-ups. Existing poison/undef policy, unrelated unsupported ConstantExpr paths, L1 pointer ordering and B2 large reconstruction are not newly validated. No build/runtime/instrumentation/hosted adoption; docs-only profiling is inapplicable and ROOT retains integrated release.
