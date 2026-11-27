# Shader-module C entry on Windows x64

Use the public declaration in [shader_module_c.h](shader_module_c.h). The
Windows x64 DLL exports the undecorated name `tower_vk_try_create_shader_module`.
The implementation borrows the caller's device and SPIR-V words for one
synchronous call. Initialize the handle slot to `VK_NULL_HANDLE` and use a
separate initialized `int32_t` result slot. Only `called == 1 && result == VK_SUCCESS`
transfers a module. Release the words on return. Destroy the module once with
the creating device and a null allocator after its last use in pipeline creation.

| Windows x64 ABI | C with Vulkan headers | Tower |
| --- | --- | --- |
| Return | `uint32_t` | `u32` |
| Logical device | `VkDevice` | `VkDeviceHandle*` |
| Readable words | `const uint32_t *` | `u32*` |
| Count in words | `size_t` | `usize` |
| Empty handle slot | `VkShaderModule *` | `VkShaderModuleHandle**` |
| Driver result slot | `int32_t *` | `i32*` |

On LLP64, pointers, both Vulkan handles and the count occupy eight bytes.
C `long`, the called flag and the signed result occupy four. The Tower
declaration and the Vulkan headers agree on the 40-byte, eight-aligned
`VkShaderModuleCreateInfo`, with offsets 0, 8, 16, 24 and 32.

## Build and link

Run in an output directory with `S` set to the Tower checkout and LLVM 19
on PATH. The Vulkan SDK's x64 import library supplies the loader symbol.
The tested cross-build generated its equivalent from the one required name.

```bash
set -eu
v="$S/scaffolding/library/graphics/vulkan"
"$S/bootstrap/linux-x64/towerc" "$v/shader_module_c.tower" --library --jobs 1 \
    --target x86_64-w64-windows-gnu --foundation "$S/scaffolding/foundation.tower" \
    -o shader_module_c.obj
printf 'LIBRARY vulkan-1.dll\nEXPORTS\n  vkCreateShaderModule\n' > vulkan-1.def
llvm-dlltool -m i386:x86-64 -d vulkan-1.def -l vulkan-1.lib
lld-link /dll /noentry /nodefaultlib /machine:x64 /timestamp:0 \
    /export:tower_vk_try_create_shader_module /out:tower_shader_module.dll \
    /implib:tower_shader_module.lib shader_module_c.obj vulkan-1.lib
llvm-readobj --coff-exports --coff-imports tower_shader_module.dll
```

The DLL's sole import is `vkCreateShaderModule` from `vulkan-1.dll`.
It has no initialization routine, heap or CRT dependency. Link the caller
with `tower_shader_module.lib` and place the DLL beside the executable.
A caller invoking Vulkan directly also links its Vulkan import library.

These commands ran the existing [standalone C smoke test](counted_draw.md#calling-from-c-on-linux-x86-64)
using the extracted Debian SDK from the packet, with `SDK` set to its root.

```bash
W="$SDK/usr/x86_64-w64-mingw32/lib"
G="$SDK/usr/lib/gcc/x86_64-w64-mingw32/12-posix"
sed -n '/^#include "shader_module_c.h"/,/^}/p' "$v/counted_draw.md" > smoke.c
clang --target=x86_64-w64-windows-gnu --sysroot="$SDK/usr/x86_64-w64-mingw32" \
    -idirafter "$SDK/usr/include" -I"$v" -std=c11 -Wall -Wextra -Werror -O2 \
    -c smoke.c -o smoke.obj
ld.lld -m i386pep --no-insert-timestamp --subsystem console -o smoke.exe \
    "$W/crt2.o" smoke.obj tower_shader_module.lib -L"$W" -L"$G" \
    -lmingw32 -lgcc -lmingwex -lmsvcrt -lkernel32
wine64 ./smoke.exe
```

For explicit loading, the packet's second C consumer opens
`LoadLibraryA(".\\tower_shader_module.dll")` in the controlled test directory
and resolves `GetProcAddress(module, "tower_vk_try_create_shader_module")`.
It checks both results, copies the procedure address into a pointer with
the header's exact function type, calls it and releases the library reference.
Its PE imports the Windows loader functions and has no dependency on the Tower
import library. Module destruction uses the caller's Vulkan loader.

## Execution evidence

Host 11 ran Wine 8, the Linux Vulkan loader and the NVIDIA Quadro RTX 6000
with driver 615.71.10. The standalone C smoke, import-linked live check and
explicitly resolved live check each exited 0. Both live checks created the
SHA-256-checked fragment module, released its input words and retired it
once. Counts 0 and 4 returned called=0, result=0 and an empty slot. An
occupied slot kept its handle. In an isolated simulation the exact same DLL
received driver result −2 and a candidate handle. The caller observed
called=1, result=−2 and an empty slot.

The three-stage PE used the counted harness at `ea6ce027` with a test-only
C call after its size and digest checks. The host validation layer was
inserted. One submit signaled its fence. All four pixels were `112233ff`
for count 0 and `4080bfff` for count 1. Both command records and both
32-byte guarded caller destinations matched the independent 112-byte oracle.
The validation callback counted zero warnings or errors. Native Windows
driver execution remains open.

Assignment `ae126103-8417-471b-a3df-eba172943df8` contains the external
consumer, Tower fixtures, build and load commands, import tables, link maps,
raw captures and per-process results. The [project journal](../../../../docs/temporal-opcode-research-journal.md#windows-x64-shader-module-dll-through-wine)
records the revisions, binary identities, measurements and instrumentation limits.

For a C application that also submits work, see the
[combined Windows x64 graphics DLL and consumer](graphics_dll_windows.md).
