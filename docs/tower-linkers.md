# Tower byte link services

Production link services for Wasm, Linux ELF, Windows PE and macOS Mach-O are
implemented in `scaffolding/backend/*.tower`. They consume object/archive/import
metadata bytes and return executable bytes and diagnostics. No service reads a
filesystem, runs a subprocess, or falls back to an external linker. LLVM remains
the external object emitter; its shared Foundation input is unchanged.

The `BackendLink` adapter retains explicit named input buffers, argument strings,
generated inputs, output and error buffers. Inputs may be owned copies or explicit
immutable borrows; borrowed storage remains caller-owned. A failed request exposes no output.
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

## Hosted Linux ELF profile

`elf_dynamic_link_open`, `elf_link_input`, `elf_dynamic_link_run` and
`elf_link_close` provide the hosted ELF64 little-endian x64/ARM64 service.
Its `ElfLink` world shares the static linker's object/archive entities and jobs;
DSO exports occupy additional request-owned components. Interpreter path, input
DSOs/startup objects, export names and optional runpath are explicit inputs.
`backend_link_tower_hosted_elf` provides the corresponding byte-plan adapter.

The service emits PIE executables with eager GOT/PLT binding, dynamic relocations,
SONAME dependencies, default GNU symbol versions, dynamic exports, SysV symbol
hashes, non-executable stacks and page-separated RELRO. It preserves preinit,
priority-ordered init/fini arrays, CRT prologues/epilogues and supported DWARF CFI,
including a sorted `.eh_frame_hdr`. GNU property notes are validated and merged;
branch-protection flags from a CRT cannot enable checks on unprotected input code.

This is the Tower hosted executable profile. It rejects unsupported relocations,
copy relocations/text relocations, local TLS/IFUNC definitions, C++ exception
personalities/LSDA, legacy constructor lists, unknown property semantics, linker
scripts and LTO inputs. TLS/IFUNC implementations inside imported shared libraries
remain the system loader's responsibility. Shared-library inputs require bounded
section headers and default export/version metadata. It does not emit DSOs.

Tower fixtures execute libc startup, arguments/environment, allocation, imported
function addresses, `dlsym` exports, stack unwinding and constructor/destructor
ordering. The same raw/optimized objects run on x64 and ARM64, with deterministic
images at 1/2/4/8 workers and checks for real overlap, cancellation and malformed
inputs. The unchanged freestanding ELF profile remains available separately.

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

The Linux GNU CLI defaults to `tower-elf-link`, using explicit SDK startup and
libc inputs found beneath its target sysroot. The driver maps file inputs read-only
and holds the mappings through worker completion; input files must not be changed
or truncated during the request. Windows/macOS use their native mapping APIs too.
No large shared library is copied merely to inspect its exports.

`towerc --link-executable first.o --link other.o --link /path/library.so -o output`
links existing Linux GNU objects directly, without compiling a source or adding a
Tower runtime. Supply the needed runtime object explicitly. It accepts `--target`,
`--sysroot`, `--jobs` and additional positional object/library paths. It supplies
the target's Scrt1/crti/crtn and libc, exports defined globals and accepts the
bounded native build flags `-ldl`, `-lm`, `-lpthread`,
`-Wl,--export-dynamic[-symbol=NAME]` and `-Wl,-rpath,PATH`. Unknown flags fail.
This command can link the complete Tower compiler against the LLVM DSO.

The build recipes still need their compatible bootstrap pin before switching
their host-link commands to this interface. LLVM/object generation and the
third-party library builds remain external toolchain responsibilities. There are
no project-owned C/C++ sources or native linker shims.
