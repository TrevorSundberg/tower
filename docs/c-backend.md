# C output

Tower's C emitter is implemented in `scaffolding/compiler/c_emitter.tower` and
`c_runtime.tower`. It reads the same checked Foundation entities as the formatter,
interpreter and LLVM backend. C is a platform output, not a Tower storage format.

In the playground, enable **C source** under **Targets**. It is off by default.
The pane follows **LLVM optimized**, then **Bytecode disassembly**, and has its own
download link. **Optimize with LLVM (O2)** applies to native/Wasm targets, C and
the fast interpreter. Without optimization, C comes directly from Foundation;
the fast interpreter still uses its existing debug LLVM reconstruction profile.
With optimization, C and fast execution share the scalar LLVM optimization and
verified LLVM-to-Foundation reconstruction path. The graph runner remains the
unoptimized semantic reference. This is an O0/O2 choice, not arbitrary pass editing.

**Preserve source comments** controls C, Tower instructions and bytecode text.
Lexer-derived comments attach to Foundation entities. Optimized code keeps them
at module scope because deleted/reordered instructions no longer have a faithful
one-to-one comment location. Comments have no execution semantics. Formatting may
move trailing/embedded comments before the next statement, or to module scope.
C output neutralizes comment preprocessing sequences rather than allowing them
to change the generated program. Strings are emitted as exact byte escapes.

Source comments use C89-style `/* ... */` spelling. In unoptimized C, program
comments follow the generated runtime helpers; for example, `increment.tower`'s
"5: the old value" comment appears inside `main` near the print calls. The viewer
renders only the visible portion of large outputs, so browser Find may miss text
farther down. Download the C file to search its full contents. Comment preservation
is a separate setting from optimization and must remain enabled in either mode.

```sh
towerc program.tower --emit c --no-optimize -o program.c
towerc program.tower --emit c --strip-comments -o optimized.c
clang -std=c89 -pedantic -Wall -Wextra -Werror -O2 program.c -o program
g++ -x c++ -std=c++98 -pedantic -Wall -Wextra -Werror -O2 program.c -o program
cl /TC /W4 /WX /O2 program.c
cl /TP /W4 /WX /O2 program.c
```

The output uses C89 declaration/control-flow style and standard headers. Modern
compilers use `<stdint.h>`; a small fallback supports exact-width types on LP64
C89/C++98 hosts and the Microsoft/Borland `__int64` spelling. It does not require
LLVM, a Tower runtime library, or a third-party C support library when compiled.
The generated support functions use the hosted C library for allocation and I/O.
Windows uses its CRT binary-output mode to preserve output bytes. Negative
division/remainder use unsigned magnitudes to specify rounding even in C89.
Long byte strings use array initializers to avoid old string-literal limits.
An optional macro uses GCC/Clang/MSVC non-returning function annotations for
proven terminal functions; other compilers use the plain C fallback. This avoids
conflicting missing-return/unreachable-code diagnostics without disabling warnings.

The browser C profile is **64-bit little endian**. The CLI's explicit `--target`
selects 32/64-bit pointer layout before emission; compile the result for that same
layout. Width/alignment assertions and an endian check prevent an incompatible host from
silently changing Tower layouts. Raw address arithmetic goes through `uintptr_t`;
scalar memory uses `memcpy`, avoiding C aliasing/alignment assumptions. Aggregate
storage uses explicit Tower byte sizes/offsets. Unsigned bit storage implements
wrapping arithmetic, with explicit signed views, conversion checks and traps.
For example, `--target wasm32-unknown-unknown --emit c` selects the supported
32-bit profile. A Linux x86-32 test host needs `-m32 -malign-double` and C99/C++11
integer headers to satisfy its eight-byte integer alignment; the ordinary i386
ABI is rejected. The CLI also rejects an incompatible LLVM target description.

This is not a guarantee for every C compiler or microcontroller. A target needs
eight-bit bytes, exact 32/64-bit integers with two's-complement signed storage,
flat 32/64-bit pointers with zero-bit null representation, the selected layout,
and a hosted library (or supplied equivalent). Sixteen-bit pointers, Harvard
address spaces, big endian profiles and freestanding board I/O are not supported
by this profile. Borland's integer adapter is not a tested Borland toolchain
claim. External functions require concrete C ABI declarations; `cpp_name` still
works through the LLVM backend but does not turn a C compiler into a C++ ABI
lowerer. Generated support names and C/C++ keywords cannot be external link names.

LLVM removed its original C backend in the LLVM 3.1 era. The separate
[LLVM-CBE project](https://github.com/JuliaHubOSS/llvm-cbe) currently targets LLVM
22. A direct emitter keeps source metadata and Tower's defined semantics without
adding another LLVM-version-coupled dependency. The existing Tower backend calls
the upstream LLVM C API for optimization; no new native optimizer was introduced.
See the [LLVM release notes](https://releases.llvm.org/3.1/docs/ReleaseNotes.html).

The existing Tower driver runs the differential and compiler-warning checks.
Configure the native build with `-DTOWER_DRIVER_TESTS=ON -DTOWER_C_OUTPUT_TESTS=ON`,
build `tower-driver-tests`, then run `ctest --test-dir <native-build>
-R '^tower-driver-c-' --output-on-failure`. Clang/GCC, their C++ drivers and
32-bit hosted libraries are required (`gcc-multilib g++-multilib` on Ubuntu).
The two CLI tests keep artifacts in `tower-c-backend-checks` and
`tower-c-profiles-checks`. On Linux x64 the optional native guest also runs
each mode through its direct Tower companion in a separate working directory.
Profiles generate their own inputs. Each generated fixture runs in the graph
and both fast interpreter optimization modes before its C executables are
compared with the reference. The integer fixture has an independent stdout
expectation for all five operand types.

Direct commands, run in a writable artifact directory, are:

```
tower-driver-tests --c-backend COMPILER SCAFFOLDING CLANG GCC CLANGXX GXX [CASE]
tower-driver-tests --c-profiles COMPILER SCAFFOLDING CLANG GCC CLANGXX GXX [CASE]
tower-driver-tests --c-downloads CLANG GCC CLANGXX GXX [CASE]
tower-driver-tests.exe --c-msvc CL [CASE]
```

For direct selection use the following entries under `scaffolding/tests`.

| CLI mode | Direct test source |
| --- | --- |
| `--c-backend` | `driver_c_cases_test.tower` |
| `--c-profiles` | `driver_c_validation_test.tower` |
| `--c-downloads` | `driver_c_downloads_test.tower` |

Run in a dedicated writable directory outside the source and examples trees.
Set `TOWER_C_CLANG`, `TOWER_C_GCC`, `TOWER_C_CLANGXX` and `TOWER_C_GXX`
to absolute tool paths. Backend and profiles also take `TOWER_C_COMPILER`
and `TOWER_C_LIBRARY` (the original scaffolding tree, including its tests
and examples). Set `TOWER_C_FILTER` to select one case. For downloads, copy
the four browser C inputs into the work directory before selection.

```sh
"$TOWER_C_COMPILER" --test "$TOWER_C_LIBRARY/tests/driver_c_cases_test.tower" \
  --foundation "$TOWER_C_LIBRARY/foundation.tower" --bedrock "$TOWER_C_LIBRARY/bedrock.tower" \
  --test-details --test-native-runtime "$build/guest-native-test-libc.o" \
  --link "$build/driver-posix-capture.o" --link "$build/libtower-driver-request-services.so" \
  --link "-Wl,-rpath,$build"
```

Selecting `driver_c_cases.tower` as the owner discovers all three C
companions, the formatter and SHA-256. Supply the four download files and
set `TOWER_FORMAT_COMPILER` and `TOWER_FORMAT_LIBRARY` to the same compiler
and resource root for that combined run.

Pass explicit executable and scaffolding paths. Optional case names such as
`integers`, `comments` or `signed_rounding` select focused runs; unknown names
fail. The download mode runs in the deployment verifier's artifact directory
and checks its four desktop/mobile raw/optimized C files. Backend and download
modes publish `expected.json` only after every selected check succeeds; a new
run removes stale expectations and compiled outputs. The Tower Windows runner
consumes that same JSON and generated C. Run it from the artifact directory in
a Visual Studio Developer Command Prompt, passing the full `cl.exe` path; for
example `tower-driver-tests.exe --c-msvc "%VCToolsInstallDir%bin\Hostx64\x64\cl.exe"`.
It checks C and C++ at `/Od` and `/O2` with `/W4 /WX`, including output and exit
status. No PowerShell or generated batch script is required.

The [Windows tooling workflow](../.github/workflows/windows_tooling.yml) builds
the runner from the public Linux bootstrap, links with the installed Windows
CRT and runs the checks on Windows. Download its `tower-windows-tooling` artifact
for the executable; `windows-tooling-inputs` contains the generated C/expectations
and objects. This test runner is separate from a native compiler release.
For the matching-output runtime comparison, use the Tower driver's
[`--measure-c` workload](../scaffolding/tests/README.md#native-measurements).
The research journal records measured compiler/platform coverage and performance;
backend equivalence is tested on defined programs, not inferred from matching C.
