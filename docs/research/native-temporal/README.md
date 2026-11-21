# Native temporal proof

Historical research: the C/C++ experiment and its native-only build/check helpers were retired on 2026-11-21. Sources and reproduction commands remain available at [revision abf427e](https://github.com/TrevorSundberg/tower/tree/abf427ed2b3073cac31fafb3c4cb8ff590064d3f/docs/research). The descriptions and recorded measurements below are historical; they are not linked into the current compiler.

This experiment compiles ordinary LLVM memory operations to native x64 code,
tracks every state write in that generated workload, amends a captured input in
the past, and compares selective repair with both snapshot replay and undo/redo.
It also repairs a file-backed history after unmapping it and after a process restart.

The [design and measured results](../temporal-native-model.md) explain the memory
layout, read/write costs, game implications, and disk retention model. Raw samples
and provenance are in [results/windows-x64.json](results/windows-x64.json).

## Relation to the agreed C API

The public example and repair benchmark include the existing
[temporal-core.h](https://github.com/TrevorSundberg/tower/blob/abf427ed2b3073cac31fafb3c4cb8ff590064d3f/docs/research/temporal-core.h), with its original signatures. The LLVM
lowering emits `builtin_temporal_load(address, 8)` and
`builtin_temporal_store(address, value, 8)`. The example uses
`temporal_create`, `temporal_point`, `temporal_edit`, `temporal_store_at`,
`temporal_run`, `temporal_replace`, `temporal_repair`, and `temporal_destroy`;
`temporal_cancel` is linked as well. Source bytes and run arguments are captured.
The `nt_*` declarations are internal runtime/test hooks, not a proposed user API.

This is a **restricted native implementation**, not the complete core contract:

- Explicit isolated histories; one host controller and one executing thread.
- Four aligned `uint64_t` cells per entity, one generated native entry, six loads
  followed by two stores. A region is one complete entity update. Arithmetic,
  including a native loop, runs as optimized machine code, without an opcode VM.
- Each read records the exact producing word version. Each write creates a new
  version, including writes that preserve the numeric value. No byte overlap.
- Fixed addresses and access counts per region. Repair verifies that shape and
  returns `TEMPORAL_TRAP` atomically if it changes. Native arithmetic control flow
  is not separately recorded. General branch/loop/call trace surgery is absent.
- End-gap `temporal_store_at` creates a captured input. Subsequent **past
  replacement** is implemented. Insertion at an older gap, `temporal_remove`,
  default-root globals, nested histories, allocation/free intrinsics, general
  entry functions, arbitrary bytes/pointers and internal-instruction Points are
  not implemented. Unsupported setup calls fail this harness; this is not a
  production invalid-handle or exception-safety boundary.
- The host provisions one arena before recording. This proves physical arena
  allocation, not language-level temporal allocation lifetimes/address recycling.
- Public handles stay in a history-owned pool until destruction. Benchmark input
  creation uses an internal event generator to avoid allocating 65,536 public
  handles; timed repairs use the agreed public edit/replace/repair functions.

The full dynamic semantics remain covered by the existing Node models. This
experiment neither changes their contract nor claims their full native coverage.

## Build and run on Windows x64

Requires Python 3.12, Visual Studio 2022 C++ Build Tools and a Windows SDK.
The build creates a local virtual environment under ignored `build/` and installs
the pinned llvmlite wheel. No global package installation or LLVM source build.

```powershell
./docs/research/native-temporal/build.ps1 -Python /path/to/python.exe
./build/temporal-native/temporal-native.exe --test
./build/temporal-native/venv/Scripts/python.exe docs/research/native-temporal/mutations.py
./build/temporal-native/venv/Scripts/python.exe docs/research/native-temporal/measure.py
```

Pass `-VcVars` to select another MSVC installation. `measure.py` runs all benchmarks
sequentially and writes `build/temporal-native/measurements.json`. Use `--output`
to retain another report. The native executable accepts `entities ticks trials`.

```powershell
./build/temporal-native/temporal-native.exe 1024 64 15
./build/temporal-native/temporal-native.exe --disk build/temporal-native/history.bin
./build/temporal-native/temporal-native.exe --reopen build/temporal-native/history.bin
node docs/research/temporal-validation-all.mjs
```

`--disk` overwrites the named experimental history file. `--reopen` expects that
test file, verifies its layout, makes another correction, and compares all retained
version values to fresh execution. The format is an experiment for trusted files,
not a portable, hostile-input-safe or crash-recoverable persistence format.

## What executes

`generate.py` constructs ordinary LLVM IR with llvmlite's IR builder. A small
closed-module lowering walks its actual instructions and replaces loads/stores.
Unsupported operations are rejected. LLVM verifies and optimizes each module,
then emits COFF objects. MSVC compiles the runtime and links those objects into
one native executable. Python only generates code and launches processes; no
Python callbacks, Node, interpreter dispatch, or JIT compilation enter the timer.

The build retains unoptimized IR, optimized IR, assembly, objects and
`llvm-audit.json`. The tracked IR has zero remaining raw state loads/stores;
the undo variant has zero raw stores and ordinary loads. Compiler spills and
runtime bookkeeping are outside temporal application memory. This is not a
general LLVM plugin that can safely instrument arbitrary third-party C code.

`benchmark.cpp` contains the arena runtime, independent C++ numerical oracle,
public API example, regression cases and benchmark. All timings include native
runtime callbacks. The baseline uses the same LLVM computation and function ABI.
There is no LTO across the LLVM objects and MSVC runtime.

The native tests compare **all retained versions**, not just the final state,
across randomized successive corrections, simultaneous corrections, source
capture, cancellation, no-op edits, equal-output cutoff, killed writes, and
atomic rejection of a changed access shape. Four compiled runtime mutations
must cause behavioral assertion failures; compile failures and crashes do not
count as detections. See [mutation results](results/mutations.json).
