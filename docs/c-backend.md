# C output

Tower's C emitter is implemented in `scaffolding/compiler/c-emitter.tower` and
`c-runtime.tower`. It reads the same checked Foundation entities as the formatter,
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

Reproduce differential and compiler-warning checks with
`python3 scaffolding/tests/c-backend.py /path/to/towerc build/c-validation` and
`powershell -File scaffolding/tests/c-backend-msvc.ps1 build/c-validation`.
`c-backend-profiles.py` adds 32/64-bit C99/C++11 checks with multilib installed.
After the playground deployment verifier, `python3 scaffolding/tests/c-downloads.py`
compiles its captured browser C output; the MSVC script can also consume
`build/deployment-verification` to check those same files.
The research journal records measured compiler/platform coverage and performance;
backend equivalence is tested on defined programs, not inferred from matching C.
