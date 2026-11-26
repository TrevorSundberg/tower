# Roku BrightScript backend

Select **Targets → Roku BrightScript** in the playground and choose **Download
BrightScript**. The result is a self-contained `.brs` source file including its
runtime. Optimization and comment-preservation controls apply to this target.
It compiles in the cancellable target worker; selecting C alongside Roku uses
each target's own pointer layout. The browser does not execute Roku applications.

The production CLI supports:

```sh
towerc program.tower --target roku -o program.brs
towerc program.tower --emit brightscript --no-optimize -o program-o0.brs
tools="$(bash playground/scripts/build-bootstrap.sh --tools)"
"$tools/package_roku" program.brs program-roku.zip
```

Build the packager in the documented Linux x64/WSL/Docker bootstrap environment.
Its in-house Tower ZIP/CRC/DEFLATE implementation normalizes source to LF and
fixes member metadata for reproducible archives. The initial compressor uses
fixed Huffman codes with a stored-block fallback; it does not yet provide a
general zlib API or decompressor. Archives may be larger than the former Python
packager's zlib output, while extracting to the same files.

`--raw-ir` and `--optimized-ir` retain the LLVM stages for inspection. Both O0 and
O2 follow the fast interpreter's bridge: checked foundation → LLVM scalar
pipeline → reconstructed, checked foundation → BrightScript. The emitter is
`scaffolding/compiler/roku_emitter.tower`, using the same entities, type/layout
queries and operation definitions as other backends. It shares the existing
source-emission entity index; it neither reads fast bytecode nor introduces a
program storage format. The runtime text is owned by `roku_runtime.tower`.

## Execution contract

Profile 1 uses 32-bit little-endian byte addresses, natural scalar layouts, and
exact bool/u8/i32/u32/i64/u64/usize operations. Add/subtract/multiply wrap;
signed/unsigned division and remainder, comparisons, bitwise operations and
checked conversions follow Tower. Division by zero, signed division overflow
and invalid conversions throw an exception that unwinds the guest stack.
LLVM-generated shifts and scalar idioms retain the existing foundation
legalizations. No new shift/rotate syntax or public instruction ABI is added.
It requires Roku OS 9.4 or later for
[BrightScript exception handling](https://developer.roku.com/dev/docs/program-statements).

The runtime carries 64-bit patterns in LongInteger. Bounded 16-bit limbs avoid
overflowing signed arithmetic, floating division of complete integers, and
undocumented wide BrightScript shifts. Masked limb extraction uses exactly
representable Double powers-of-two scaling. Full unsigned division uses
restoring division; a bounded small-divisor path also preserves every bit.
Helper shifts/rotations/counts are tested against the pinned wasm2brs corpus.
These private runtime helpers are not additional foundation operations.

Pointers are numeric target byte addresses into a `roByteArray`, with eight-byte
aligned allocations and explicit frame lifetimes. They do not contain allocation
IDs or generations. Range checks provide VM containment, not object lifetime,
initialization or allocation bounds guarantees. The default memory resource
limit is 64 MiB; `TowerRun(output, memoryLimit)` can change it. Invalid raw access
and invalid allocator calls trap. Freed storage is reusable. No executable
memory or JIT is used.

Call `TowerRun()` from an application's `Main` or a SceneGraph Task. It creates
fresh global storage per invocation and returns the runtime state. An optional
`output` function receives text chunks; the default writes to the debug console.
`platform_write(stream, data, length)` supports stdout/stderr text, returning the
byte count, or -1 for an unsupported stream. The console combines those streams.
Arbitrary native imports, native link objects and library-only output are not
supported. Exported Tower functions use generated internal names in this complete
program target; a general BrightScript foreign/export ABI is future work.

Function arguments and temporaries use arrays, avoiding BrightScript's small
argument/local-variable tables. Large control-flow functions are diagnosed at
240 labels or 200 conditionals. Single-file output is limited to 1.9 MB and
60,000 lines, conservatively below wasm2brs's observed device limits. Splitting
oversized functions/files automatically remains future work. Recursion is
limited by the device's BrightScript stack. Floating-point types are not currently
Tower foundation types; no approximate float emulation is substituted.

## Verification and later device testing

With the current parser/LLVM reactors built and Node.js 22 or newer:

```sh
npm ci --prefix playground
npm run test:roku --prefix playground
tools="$(bash playground/scripts/build-bootstrap.sh --tools)"
"$tools/package_roku" build/roku-device/source/program.brs build/roku-conformance.zip
"$tools/package_roku" build/roku-device/integers.brs build/roku-integers.zip
```

Tests compile generated source with BrighterScript and execute it using
`brs-node`. They compare O0/O2 programs with Tower's graph interpreter, including
memory, structures, collections, recursion, forty arguments, global effects,
control-flow merges, conversions, diagnostics, comments and deterministic output.
LLVM scalar idiom and population-count fixtures also check the optimized
foundation reconstruction path with high-bit and full-width integer values.
The pinned `i32.wast`/`i64.wast` numerical assertions used by wasm2brs cover 758
return/trap cases. The integer companions generate 384 additional differential
cases with seeded Tower u64 arithmetic at the two operand widths. The integer
registrations can run alone with the frontend reactor and simulator. The
conformance package writer also needs the LLVM reactor. These checks exercise
numerical behavior in simulation.

The test run writes `build/roku-device/source/`, a manifest, `expected.txt`, and
the separate `integers.brs`/`integers-expected.txt` corpus.
The packaging command creates a ZIP with `manifest` at its root. Later, enable
Roku developer mode, sideload that ZIP with the device's developer web interface,
and capture its debug console on port 8085. Compare the text between
`TOWER_ROKU_BEGIN` and `TOWER_ROKU_END` with `expected.txt`, record the Roku model
and OS version, and run the larger integer corpus on the device as well.
For integration into a graphical channel, invoke the program in a Task and route
its output to the UI. No physical Roku was available during this implementation.

Research inputs: [wasm2brs](https://github.com/MotleyCoderDev/wasm2brs),
[Roku expressions and numeric rules](https://developer.roku.com/dev/docs/expressions-variables-types),
and [brs-engine](https://github.com/lvcabral/brs-engine).
Pinned revisions and test licensing are recorded with the fixtures.
