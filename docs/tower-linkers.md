# Tower byte link services

Production link services for Wasm, Linux ELF, Windows PE and macOS Mach-O are
implemented in `scaffolding/backend/*.tower`. They consume object/archive/import
metadata bytes and return executable bytes and diagnostics. No service reads a
filesystem, runs a subprocess, or falls back to an external linker. LLVM remains
the external object emitter; its shared Foundation input is unchanged.

The `BackendLink` adapter owns explicit named input buffers, argument strings,
generated inputs, output and error buffers. A failed request exposes no output.
Request objects must not be used concurrently or restarted after dispatch;
construct a fresh request to retry. Inputs remain alive through completion and
close. CLI/browser transports supply files or downloads outside these services.

## Mach-O profile

`macho_link_open`, `macho_link_input`, `macho_link_run` and `macho_link_close`
provide the lower-level request API. Start with a default-initialized `MachoLink`,
select `MachoCpu.X64` or `MachoCpu.Arm64`, add named immutable inputs, optionally
set the worker budget/cancellation callback, then run once and close. Close must
wait for active pinned views; it reports failure rather than releasing live inputs.
The output buffer belongs to the request until moved or closed.

`backend_link_tower_macho` adapts the ordinary backend byte plan for
`x86_64-apple-macos11` and `arm64-apple-macos11`. Its accepted argument subset is
explicit: object/archive/TBD input names, `-arch`, `-e`, `-o`, `-threads`,
`-platform_version macos 11.0 11.0`, `-pie` and `-no_uuid`. Unknown options fail.
The output name is transport metadata, not permission to write a file.

The current profile includes:

- Little-endian 64-bit objects, indexed GNU/BSD archives with lazy extraction,
  and target-qualified TBD v4 imports with install-name/version metadata.
- PIE executables with executable/read-only/writable segments, stubs, GOT,
  eager dyld binds/rebases, export trie and symbol/indirect symbol tables.
- x64 and ARM64 relocations required by the emitted Tower objects, including
  paired subtraction and ARM page/GOT/address operations.
- Compact unwind and DWARF FDE references, data-in-code ranges, and deterministic
  SHA-256 ad-hoc code signatures written entirely in Tower.

This is the supported Tower executable profile, not an implementation of every
ld64 option. Unsupported semantic commands, relocations, TLS/TLV, authenticated
ARM pointers, exception personalities/LSDA and unsupported Objective-C metadata
produce diagnostics. Optional bounded linker optimization hints may be omitted
because the original instruction sequence remains valid. No unsupported semantic
metadata is silently discarded. The linker emits executables, not dylibs or
universal/fat binaries.

## Ownership and parallel work

Each link has its own entity store. Objects, archives, import libraries and work
items occupy components; lookup/layout tables are derived indexes. The coordinator
resolves symbols and freezes layout before dispatch. Relocation jobs use the shared
`WorkGraph`/`WorkPool`, immutable symbol/input views, per-object scratch and explicit
disjoint output ranges. Workers do not mutate shared symbol tables or entity
structure. Cancellation drains submitted jobs before closing views. Diagnostics
and final metadata publication follow deterministic object order.

Functional Tower checks compare exact output at 1/2/4/8 workers and exercise two
simultaneous kernels, cancellation, input lifetime, malformed inputs, archive
selection, backend retry and signature hashes. The `macho_linker.yml` workflow
executes raw/optimized Tower and LLD reference outputs on Intel and Apple Silicon
Macs, verifies strict code signatures, and exercises default CLI linking on both
Mac architectures and Windows. LLD is a differential test tool only.

## CLI and build boundaries

Windows x64 defaults to `tower-pe-link`; macOS without an explicit SDK/sysroot or
linker defaults to `tower-macho-link`. Both use the byte services with explicit OS
import metadata. Extra object/archive/TBD inputs are read by the driver and supplied
as bytes. Clang still compiles the bundled Tower-generated runtime LLVM text into
a target object. An explicitly selected external linker remains an opt-in route.

The Linux hosted CLI still uses the host compiler driver for libc startup and
shared-library linking. The existing Tower ELF byte service emits the freestanding
Linux profile; substituting it for hosted libc would change ABI and runtime behavior.
Building the compiler against LLVM and platform libraries also still uses the
host/SDK toolchain. These build dependencies are separate from production browser
link services. There are no project-owned C/C++ sources or native linker shims.
