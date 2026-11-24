# Actual Tower object instrumentation

This is a tested Linux x64 LLVM19 validation pipeline, not full compiler
sanitizer acceptance. A2 owns `scaffolding/tools/instrument_llvm.tower` and its
deliberate negative probes; D2 owns integration into shared build recipes.
Ordinary C/C++ build flags do not instrument Tower-generated object files.

The tool adds `sanitize_address` or `sanitize_thread` to every defined LLVM
function, runs the matching LLVM passes, verifies the module and writes a target
artifact. Canonical Foundation remains the semantic interchange format. No
UBSan source-language coverage, Windows/macOS/browser sanitizer support, or
universal race freedom is implied. See the primary [ASan documentation](https://clang.llvm.org/docs/AddressSanitizer.html),
[TSan documentation](https://clang.llvm.org/docs/ThreadSanitizer.html) and
[UBSan documentation](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html).

## Shared build entry

D2 also exposes the tool through the canonical Docker/public-bootstrap entry:

```sh
tools=$(bash playground/scripts/build-bootstrap.sh --tools instrument_llvm)
"$tools/instrument_llvm" address INPUT.ll OUTPUT.ll
```

This selection supplies the configured compiler worker budget, depfile and
explicit grammar inputs. Linking reuses the normal guest-library object and
the same discovered LLVM library as `runtime_bind`; ordinary packaging does
not build the tool. D2 validated this entry independently of the manual A2
receipts below. Use a separate cache for each active build and sanitizer mode.

D2's optional Linux x64 Clang/LLVM19 mode uses this same Tower policy with the
existing native object recipes. Build the tool alone through
`bash playground/scripts/build-bootstrap.sh --tools instrument_llvm`, or use a
separate native cache with `-DTOWER_SANITIZER=address` or `thread`:

```sh
export TOWER_NATIVE_BUILD=/cache/native-address
export TOWER_BUILD_JOBS=1
bash playground/scripts/build-native.sh -DTOWER_SANITIZER=address \
  -DTOWER_COMPILER_JOBS=1 -DTOWER_WORK_TESTS=ON -DTOWER_BACKEND_TESTS=ON
cmake --build "$TOWER_NATIVE_BUILD" --target tower-work-tests tower-lr-work-tests --parallel 1
ASAN_OPTIONS=detect_leaks=1:halt_on_error=1 "$TOWER_NATIVE_BUILD/tower-work-tests"
```

For thread mode, use a separate cache, `-DTOWER_SANITIZER=thread`, and
`TSAN_OPTIONS=halt_on_error=1`. The normal empty mode retains the production
build recipes. Other modes, targets and LLVM versions fail configuration or the
object rule with a diagnostic. Keep outer build concurrency and per-compiler
jobs within the host budget. Do not share a cache between concurrent builds.

Each original module is instrumented after any required foreign-symbol binding;
Clang compiles the result without another sanitizer pass. Final executable links
supply compiler-rt. Native build-host tools remain uninstrumented to avoid a
recursive bootstrap. Distributed cross-target guest runtime resources also
remain ordinary target artifacts; this mode does not instrument programs later
compiled by the resulting compiler. Driver tests use a separate instrumented
guest library instead of the build-host tool library.

`sanitizer-objects.tsv` records configured object/Tower-source/original-IR/instrumented-IR/mode
paths. It is **not** an execution receipt: inspect the actual target link and
archive members, build logs and instrumentation references for coverage. D2's
first shared-mode checks built and ran all four Tower objects of work-pool tests
under ASan with leak detection and under TSan. Both deliberate probes produced
their required diagnostic and exit status with instrumented guest runtimes.
The full 26-object LR target also builds under TSan: all 22 direct objects and
four memory-archive members contain instrumentation references. Three LR runs
produce identical passing output, and query-smoke passes. The backend selector
timed out after 180 seconds without a diagnostic; its overlap/sanitizer acceptance
remains open. This receipt is for D2 `599e8a8`, whose production compiler sources
match published `60741c5`; it does not validate other lanes' pending changes.
No source-language UBSan coverage is implemented by this mode.

The [deferred-inventory repair](sanitizer_manifest_9aa534cd.md) collects after
all root deferred producers, sorts entries and rejects conflicting descriptions
of one object. Reconfigure an existing cache to refresh the inventory; no compiler
rebuild is needed for this metadata change. Configured but unconsumed interface
objects may have no reachable Ninja rule, so audit that distinction explicitly.

A later unchanged-source backend diagnostic used a bounded600s run after the
normal selector passed142.39s. It failed at458.83s with raw exit134 and
`frontend/backend overlap deadline`, the fixture's internal30s signal wait.
It is not a TSan pass. Supported user-space sampling identified substantial
instrumented LALR construction cost before the overlap interval; the final
producer deadline still needs owner attribution. No deadline, assertion or
instrumentation was weakened. See the D2 audit/journal for exact input hashes,
sampling limits and preserved raw status; GNU time's accompanying Exit status0
does not override its signal6 termination or the actual process134.

## Manual reproduction of the tool

Run from the frozen repository root in Linux x64. `/cache` must be an exclusively
owned writable cache. A2 used Ubuntu24.04, LLVM/Clang19.1.1
`1ubuntu1~24.04.2`, Linux6.18.54.1-microsoft-standard-WSL2, CPU affinity12-23,
24GiB container cap and one compiler lane. Public compiler SHA-256 was
`9653f8187a104ca84ab5d8601f336d7e1ed8200206544c70a81415018d623d02`.
Record the current source/runtime hashes and actual versions for each new run;
an old receipt does not validate changed inputs.

These shell commands are OS/compiler transport only; selection, test behavior
and instrumentation policy are Tower code. Do not set a private bootstrap override.

```sh
set -euo pipefail
bootstrap=$(bash playground/scripts/build-bootstrap.sh)
"$bootstrap" scaffolding/tools/instrument_llvm.tower --library --jobs 1 \
  --target x86_64-unknown-linux-gnu --bedrock scaffolding/bedrock.tower \
  --foundation scaffolding/foundation.tower -o /cache/instrument_llvm.o
llvm-extract-19 --delete --func=main --func=guest_runtime_start -S \
  bootstrap/linux-x64/share/tower/runtime-host-linux-x64.ll \
  -o /cache/guest_library.ll
clang-19 -target x86_64-unknown-linux-gnu -O1 -c /cache/guest_library.ll \
  -o /cache/guest_library.o
"$bootstrap" --link-executable /cache/instrument_llvm.o \
  /cache/guest_library.o /usr/lib/llvm-19/lib/libLLVM.so \
  -o /cache/instrument_llvm --jobs 1
```

The extracted LLVM runtime is an ordinary target artifact of the published
runtime with executable startup removed, as required by an exported `main`.
An integrated recipe should use the existing guest-library runtime directly.
The tool is not itself a replacement bootstrap or native adapter.

## Instrument and run a fixture

Top-level executable fixtures must **omit** `--library`. For example:

```sh
"$bootstrap" scaffolding/tests/work_budget_shared.tower --jobs 1 \
  --target x86_64-unknown-linux-gnu --bedrock scaffolding/bedrock.tower \
  --foundation scaffolding/foundation.tower --emit llvm -o /cache/fixture.ll
/cache/instrument_llvm address /cache/fixture.ll /cache/fixture_asan.ll
/cache/instrument_llvm address \
  bootstrap/linux-x64/share/tower/runtime-host-linux-x64.ll /cache/runtime_asan.ll
clang-19 -target x86_64-unknown-linux-gnu -O1 -c /cache/fixture_asan.ll -o /cache/fixture_asan.o
clang-19 -target x86_64-unknown-linux-gnu -O1 -c /cache/runtime_asan.ll -o /cache/runtime_asan.o
clang-19 -fsanitize=address /cache/fixture_asan.o /cache/runtime_asan.o \
  -Wl,--export-dynamic-symbol=work_thread_entry -ldl -pthread -o /cache/fixture_asan
ASAN_OPTIONS=detect_leaks=1:halt_on_error=1 /cache/fixture_asan
```

Repeat from the **original** LLVM with mode `thread`, distinct `_tsan` outputs
and final link flag `-fsanitize=thread`. Run with
`TSAN_OPTIONS=halt_on_error=1`. Compile already instrumented LLVM to objects
**without** `-fsanitize`: passing that flag while compiling the LLVM
double-instrumented an early ASan experiment and caused a shadow-memory SEGV.
The final object link flag supplies compiler-rt without rerunning the pass.

Docker's default seccomp policy denied TSan's `personality(ADDR_NO_RANDOMIZE)`
startup on this host, producing CHECK failure/exit139 before guest code.
A2's isolated container used `--security-opt seccomp=unconfined` with unchanged
CPU/memory/mount restrictions. The same binary then reported the deliberate
race correctly. Preserve startup failures; they are neither races nor passes.
Do not change host-wide ASLR/security settings for this recipe.

For separately compiled clients such as `tests/work_pool.tower`, compile with
`--library` and instrument **each** emitted unit. Its link also needs
`host/work_linux.tower`, `host/work_dispatch.tower` and the library runtime
above, all instrumented in the same mode. Do not duplicate executable `main`
from the runtime. Use the fixture's production allocator and transport, not
`runtime_instrumented` or portable serial fault injection. Instrument all linked
Tower units for a whole compiler claim, including helpers and generated runtime.

## Sensitivity and observed results

**Current address-only receipt (2026-11-24):** [40-byte component storage
ASan acceptance](storage_asan_1bfe0657.md) records the actual memory-negative and
ready-positive controls, 26 ownership runs and 17-object linked closure at
`1bfe0657`. The race-probe limitation below is not closed by this ASan run.

**Current campaign limitation (2026-11-23):** the negative race-control recipe
below is historical. After the buffer-provider changes, D1 reported that its
unchanged probe at `a0e789324` compiled but the documented link exited1 on
`compiler_buffer_allocate`, `compiler_buffer_free` and
`compiler_buffer_allocation_size`. No probe execution followed that failed link.
The coordinator subsequently directed that this probe remain unchanged and
unexecuted during the current campaign. D2 has not independently rerun it.
The earlier sensitivity receipts below retain their original inputs; positive
address/thread checks on newer compiler inputs do not close this control gap.
Supported positive Tower-object instrumentation remains available through the
shared build entry above. Source-language UBSan remains unsupported.

Use the fixture commands above with `sanitizer_memory_probe.tower` in address
mode. Expected result: exit1 and **AddressSanitizer: heap-buffer-overflow**, a
one-byte write immediately after an eight-byte heap allocation. Use
`sanitizer_race_probe.tower` in thread mode. Expected result: exit66 and
**ThreadSanitizer: data race** in `work_kernel_execute` between distinct real
pthread workers after their shared barrier. A successful process exit is a
failed sensitivity check. Preserve the full diagnostic and raw exit status.
These deliberately invalid programs do not belong in ordinary passing suites.

A2 observed both expected negatives. Initial sensitivity probes used an
uninstrumented published runtime; later positive runs instrumented runtime
definitions too. Source work_ready passes ASan. Three ASan and three TSan runs
each pass for production work_pool (16 overlap/allocation rounds, four threads)
and work_budget_shared (8,192 reservation/release/stale-copy operations across
four barrier-confirmed threads with concurrent allocation), with checked outputs.
No observed sanitizer finding is a proof of race freedom in all schedules.

Logs are under `C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs`:
`memory_probe_asan.log`, `race_probe_tsan.log` (startup failure),
`race_probe_tsan_seccomp.log`, `instrument_pool_positive.log`,
`work_pool_{asan,tsan}_{1,2,3}.log`, `budget_instrumented.log` and
`work_budget_shared_{asan,tsan}_{1,2,3}.log`. D1's cleanup regression subsequently
passes three runs in each mode, including partial/full early-error draining;
see `work_pool_cleanup_{asan,tsan}_{1,2,3}.log`. The 26-object LR closure at
main89d60388 plus recorded A2/D1/D2 patches passes three LR and one query-smoke
TSan runs (`lr_tsan_{1,2,3}.log`, `lr_tsan_query_smoke.log`). Later dispatcher/world
changes, B1's separate parser delta, execution/session/constructor paths and the
final integrated compiler require their own frozen-input checks.

## Final storage ownership receipt (2026-11-23)

The entity/store/index/view/stage producer closure at published
`42c1e1422e85f9304c422ae28a5050f27c9d7610` passes the focused LLVM19 address/leak
and thread milestone. Two fixture corrections accompany this receipt; no
production owner or allocator changed. `entity_component_layout` now validates
each payload grant's exact size and live-to-stale retirement, allowing the
separately charged descriptor/index owners. ASan also found a real SEGV in
`entity_stage_result`'s optional queued stress: its raw component payload's vector
was not initialized before reserve. The fixture now initializes it explicitly
and runs a two-reference smoke case from its normal entry point. The original
failure, binary and instrumented IR are preserved. Earlier queued-cost samples
do not establish correct initialization; the accepted compiler/storage timings
did not execute this optional queued case.

Each mode has 26 successful final process receipts over these 14 executables:

- `tower-entity-{accounting,stage-result,stage-concurrent,component-budget,component-layout,page-reuse,stage-reentrant,attach-leases}-tests`.
- `tower-work-{buffer,buffer-shared,arena,arena-shared,arena-linkage,budget-shared}-tests`.

Accounting runs both `cap` and `profile`; stage-result runs normal and `queued`.
The five concurrent fixtures (stage-concurrent, component-budget, buffer-shared,
arena-shared, budget-shared) each run three times with production allocation and
real worker transport. Their existing barriers, distinct-thread checks and
ownership oracles cover overlap, leases/pinning, cancellation and joined handoff.
Serial work-vector checks and private stage queues cover vector ownership;
serial allocation-failure transport is not used as concurrency evidence.
Both modes retain the genuine exhausted-store `Capacity` denial, exact
45,567B physical/charged census, zero omitted bytes and final zero grants.

Both actual link closures contain 16 instrumented Tower objects: 14 fixtures,
the guest runtime and the separate arena provider. Undefined memory-access
hooks (`__asan_report_load/store*` or `__tsan_read/write*`), linked sanitizer
initializers, and the five concurrent executables' dynamic `work_thread_entry`
exports were checked. Actual link commands/inputs, import depfiles, original and
instrumented IR/object/executable hashes are retained; the configured manifest
alone was not treated as execution evidence.

Evidence directory:
`C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/storage_ownership_42c1e142`.
`passing_cases.csv` selects the 26 zero-exit receipts per mode, including reused
unchanged ASan checks; failed attempts remain separate. `final_receipts.sha256`
pins the source, artifact, toolchain and case manifests. Exact source identities:

| Input | SHA256 |
| --- | --- |
| Frozen source manifest, including the two corrected fixtures | `bb38d0767dd83e09b340f7068e8bd4a9160209b7c5c0b1199ce88642408b02d3` |
| `entity_component_layout.tower` | `59669a089d025c3dcb8d3d7c43286fd823001031c5d0f546f64b45dc29fbd0ae` |
| `entity_stage_result.tower` | `1c35f82ad9b026f8f69c2ae527ad296c97c34e03cae6ceea79f492624131d9bc` |

Reused separate `native_address_joined`/`native_thread_joined` caches, public
bootstrap SHA256 `9653f8187a104ca84ab5d8601f336d7e1ed8200206544c70a81415018d623d02`,
LLVM/Clang19.1.1, CPU12–23, 24GiB, build jobs2/compiler jobs1.
`ASAN_OPTIONS=detect_leaks=1:halt_on_error=1` and `TSAN_OPTIONS=halt_on_error=1`.
The temporary TSan container used network-none and the documented per-container
seccomp accommodation with unchanged limits; no system security setting changed.
All owned jobs exited. Production code/performance is unchanged; instrumented
test costs in the journal are not production scaling measurements.

This closes the selected storage milestone, not integrated compiler/query/browser
or publication gates. ROOT may reuse it when these actual producer/test inputs
remain unchanged. The historical negative-control receipts and current missing-
provider sensitivity limitation above remain explicit: no invalid probe was
rerun. Source-language UBSan and other-host sanitizer coverage remain unsupported.
Physical allocation checks do not prove every pooled-slot lifetime or universal
race freedom.

## Authorized current thread milestone (2026-11-24)

ROOT explicitly superseded the historical race-control hold for the bounded
[c8555971 milestone](compiler_thread_milestone_c8555971.md). The thread-mode-only,
explicit `tower-sanitizer-race-control` target now links the unchanged Tower probe
with the existing instrumented buffer provider and POSIX entry runtime; it is
excluded from ordinary builds/tests. Expected exit66/data-race was observed on
two real workers under unprivileged WSL without a security override.
Five selected positives pass; current query-smoke reaches its unchanged180s
limit without a TSan report, while the one same-original-IR normal control passes.
Unit-admission/backend remain unstarted. This repairs the missing-provider
sensitivity composition, not full compiler thread-sanitizer acceptance.
