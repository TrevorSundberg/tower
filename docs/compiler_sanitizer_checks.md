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

## Build through the shared entry point

D2 integrates the tool as an explicit selection; ordinary packaging does not
build it. Use the canonical Docker environment and public bootstrap:

```sh
tools=$(bash playground/scripts/build-bootstrap.sh --tools instrument_llvm)
"$tools/instrument_llvm" address INPUT.ll OUTPUT.ll
```

The tool build supplies the configured compiler worker budget, depfile and
explicit grammar inputs. Its link reuses the normal guest-library object and
the same discovered LLVM library as `runtime_bind`. D2 validated this entry
with the public pin; the manual A2 evidence below is a separate receipt.

## Instrument existing native build targets

The optional CMake mode applies the same pipeline to the existing compiler and
test object recipes, including foreign-bound runtime and archive members. Use
Linux x64 with Clang/LLVM19, directly or inside the canonical Docker image:

```sh
export TOWER_NATIVE_BUILD="$HOME/.cache/tower/native-address"
export TOWER_BUILD_JOBS=1
bash playground/scripts/build-native.sh -DTOWER_SANITIZER=address \
  -DTOWER_COMPILER_JOBS=1 -DTOWER_WORK_TESTS=ON -DTOWER_BACKEND_TESTS=ON
cmake --build "$TOWER_NATIVE_BUILD" --target tower-work-tests tower-lr-work-tests \
  --parallel 1
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
`work_budget_shared_{asan,tsan}_{1,2,3}.log`. D1's failure/cancellation cleanup,
execution/session/constructor paths and full integrated compiler remain separate
pending checks. Rebuild those actual inputs before claiming coverage.
