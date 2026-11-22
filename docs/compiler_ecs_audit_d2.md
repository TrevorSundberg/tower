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
are not interchangeable.

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
| `scaffolding/tools/tool_capture_linux.tower` | Anonymous file avoids pipe backpressure; bounded reads publish a replacement buffer only after successful process/read/close. Child joins before file teardown. Diagnostic capture and stdout capture share one implementation. | No disk-write quota; limit bounds retained bytes only. Nonzero child status preserves old output. Diagnostic relay stops on write failure; source review only. |
| `scaffolding/tools/tool_files_linux.tower` | Owned path strings plus contiguous pointer index; insertion sorting does not pack string payloads. Recursive traversal retains directory handles until child traversal returns, bounded depth 128; lexical names preserved, directory symlinks skipped. Atomic no-replace directory rename is an explicit OS boundary. | `statx` layout is Linux x64 little-endian. Partial path collection stays caller-owned on failure. Sorting cost and allocation/fragmentation not yet measured; no speculative conversion. |
| `scaffolding/tools/tool_files_posix.tower` | `tool_join` constructs a separate buffer before replacing aliased output. Paths and realpath results have explicit ownership; mkdir/lookup run in written order. This is filesystem identity protection, not module identity. | Missing output is permitted, existing symlink aliases rejected. Hard links and concurrent path replacement remain outside this protection. |
| `scaffolding/tools/tool_streams_posix.tower` | 4 KiB stack chunk and growing contiguous ByteBuffer; bounds checked before append, complete result published on success. Caller owns input stream; file wrapper closes before replacing output. No compiler world needed. | Handles error, no-progress and exact limit; maximum transient retention includes old output plus new buffer. Read tests pending. |
| `scaffolding/tools/tool_words.tower` | Contiguous vector of separately owned byte strings, never executed. Distinct shell/Make decoders preserve lexical identity; partial words close on failure; publication replaces output only after full parse. No global state. | Existing word fixtures cover quoting and malformed inputs. No subprocess or compiler graph constructed here; runtime checks pending. |
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
| `scaffolding/benchmarks/interpreter_arithmetic.tower` | Foundation scalar locals, 10,000 wrapping-u32 iterations and one output; no graph/storage ownership beyond normal execution. | Shared native/browser interpreter fixture. Sequential recurrence is intentional; comparing worker counts here alone cannot show compiler overlap. Independent expected-output check pending. |
| `scaffolding/benchmarks/interpreter_branch.tower` | Foundation scalar locals and executed branch selection, 10,000 iterations; deterministic effects. | Same shared runner; signed counts fit i32. Expected result can be derived from complete seven-element periods; pending execution. |
| `scaffolding/benchmarks/interpreter_calls.tower` | Ordinary nested calls and local frames, 3,000 iterations; callee/argument order is compiler/interpreter responsibility. | No helper body implementation duplicated in benchmark. Sum of 1 through 3,000 is independent reference; pending execution. |
| `scaffolding/benchmarks/interpreter_memory.tower` | One explicitly allocated 1,024-u32 buffer, every read follows same-iteration write, freed before final output. No safety policy added to raw Foundation. | 10,000 iterations, expected sum of 0 through 9,999. No uninitialized-read claim depends on allocator zeroing. |
| `scaffolding/benchmarks/interpreter_profile.tower` | Intentional 500,000-iteration scalar recurrence and ordinary function calls; all state belongs to one execution. | Browser CPU sampling input, not a compiler throughput benchmark or a multicore fixture. Wrapping signed arithmetic contract must be preserved by independent oracle. |
| `scaffolding/benchmarks/compiler_wide_functions.tower` | New D2 complete-file measurement wrapper: one local ByteBuffer, lexical cleanup, existing Tower stress generator and explicit Tower import. No duplicated generator, world, scheduler or IR. | Initial direct fragment compilation failed without the language import; preserved as failure. New emitted 300-function file compiles to identical objects at jobs 1/2/8 and prints independently known 299 in graph/native execution. |
| `scaffolding/tests/build_tool_budget_checks.tower` | New D2 regression invokes the real builder/compiler synchronously with borrowed argument strings; all local path/product buffers close after child reap. Invalid-budget calls must fail and leave products absent; valid budgets 1/2 must yield equal object bytes. | Public-pin compile/link and real regression pass at `6a2536b`; independent executable-byte comparison also passes. Existing tool transport/files/utility assertions; no fake compiler, alternate scheduler or generic harness modification. |

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
| `scaffolding/tests/parser_benchmark.tower` | D1 fixture/B1 parser. One legacy host-world boundary installs a fixed grammar; each accepted entity is released, session destroyed before source buffer free. Four input sizes, five discarded warmups and eleven retained samples report wall nanoseconds, allocation calls and live tracked buffers. Repeated retained counts must stabilize. Instrumented allocator and host-world use are serial measurement, not concurrent sanitizer evidence. It checks parse success/retention, not canonical tree equivalence; execution pending. |
| `scaffolding/tests/compiler_project_units.tower` | D1 fixture/L2 reserved packager dependency. Local CompilerProjectFiles owns source text, unit records and derived dependency indexes. Duplicate collection must preserve unit identity/count; exported text comes from actual depfiles. All buffers close after synchronous writes. No second semantic graph. Source review only; exported closure needs separate compilation/object comparison before equivalence is established. |
| `scaffolding/host/runtime_bind.tower` | B2-owned foreign object boundary, compiled through budgeted runtime helper. One LLVM context/module owns IR while reserved function names/types are checked and uses rewritten; module verification precedes file publication. Opaque LLVM handles are appropriate at this ABI, not an alternate Tower storage format. Error/message/module/context cleanup is explicit. Baseline native build exercised real runtime bindings; malformed-argument/ABI failure and allocator coverage remain B2-owned. |
| `scaffolding/backend/embed_runtime.tower` | B2-owned streaming target-artifact encoder. Byte-at-a-time input/output has bounded stack retention, explicit overflow/read/write/close checks, and preserves exact hex bytes plus length. No compiler world/scheduling is needed. Output publication is serial and can leave partial files on failure; same-path input/output protection is absent in this internal tool. Current callers supply distinct generated paths. Browser build execution pending. |
| `scaffolding/backend/target_registry_tool.tower` | B2-owned registry generator invoked by foreign_tool. Three bounded 1 MiB reads complete before opening output; local buffers close lexically. Configured LLVM target declarations are emitted as ordinary Tower, with no ambient type registry or runtime scheduler. Baseline native build exercised generation. Generated output and transient aggregate input retention are separate from each read bound; malformed registry checks belong to B2. |
| `scaffolding/backend/foreign_tool.tower` | B2-owned Foundation text/foreign-name bridge. Mutable input, expanded bytes and wrap-response buffers are caller-owned contiguous vectors; temporary foreign-name objects close per token, extra modules contribute wraps only. All reads/expansion finish before serial output writes, preserving source order. Native baseline exercises target expansion. Review hypothesis: expansion calls void backend_text helpers without checking retained length, unlike the input reader; allocator-failure truncation needs B2 reproduction. No independent change made. |

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
