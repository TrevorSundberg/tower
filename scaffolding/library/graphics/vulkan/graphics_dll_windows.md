# Tower Vulkan library for Windows x64

`tower_graphics.dll` exports the shader-module constructor, counted indexed recording and the asynchronous
one-descriptor queue submit. Link a Windows x64 C application with
`tower_graphics.lib` and put the matching DLL beside the executable.
Use the public headers for [shaders](shader_module_c.h), [submission](frame_submit.h) and [counted recording](indexed_draw_c.h).
The application also links the Vulkan SDK import library for its own Vulkan
calls. At runtime the Tower DLL imports exactly `vkCreateShaderModule` and
`vkQueueSubmit` from `vulkan-1.dll`.

## Build from a clean checkout

From the Tower root on Linux x86-64 with Bash, GNU coreutils and LLVM 19
(`llvm-dlltool` and `lld-link` on PATH), run:

```sh
scaffolding/library/graphics/vulkan/build_graphics_dll.sh "$PWD/out"
```

The entry verifies the checked-in bootstrap, compiles the three Tower objects for
`x86_64-w64-windows-gnu`, and links the DLL and import library. The output
directory also contains the loader definition, intermediate objects and
`tower_graphics.map`. The DLL has a zero PE timestamp, zero entry point and
no CRT dependency. The original [shader-only build](shader_module_windows.md)
continues to produce its original DLL and import library.

### Build and run the external C consumer

Install Clang and LLD 19, a MinGW-w64 x64 sysroot with GCC's target runtime,
glslangValidator and the Vulkan SDK. Set these four variables to **absolute**
paths. For example, with Debian's MinGW-w64 GCC 12 POSIX runtime and a
Windows Vulkan SDK unpacked on Linux:

```sh
export MINGW_SYSROOT=/usr/x86_64-w64-mingw32
export MINGW_GCC_LIB=/usr/lib/gcc/x86_64-w64-mingw32/12-posix
export VULKAN_INCLUDE="$VULKAN_SDK/Include"
export VULKAN_IMPORT_LIB="$VULKAN_SDK/Lib/vulkan-1.lib"

scaffolding/library/graphics/vulkan/build_graphics_dll.sh "$PWD/out" --with-consumer
```

Use the SDK's actual case-sensitive paths. The receipt uses LLVM 19.1.7,
MinGW-w64 10.0, Vulkan headers 1.3.239, glslang 12.0.0 and the x64 loader
import library generated from the checksummed Khronos definition.
The command compiles the repository's fragment shader to an array of SPIR-V
words, then builds [graphics_consumer.c](graphics_consumer.c) as a separate
PE executable. Run `out\graphics_consumer.exe` with a Vulkan 1.1-capable
first adapter and a graphics queue in family zero. The observed exit was 0:

```text
shader created and destroyed; GPU event set after fence retirement
```

## C caller ownership

- Start with a null module slot and a distinct initialized `int32_t` slot.
  Pass the number of readable aligned **words**. Return 0 means local refusal.
  Return 1 means the loader ran and the signed result is in the result slot.
  Only 1 with `VK_SUCCESS` transfers a module. The caller may release the
  words on return. Destroy the module once on its creating device with a
  null allocator after its last use in pipeline creation.
- Externally synchronize the queue. Pass the original prepared
  `const VkSubmitInfo *` and fence. The library borrows the descriptor and its
  host arrays until return, calls `vkQueueSubmit(queue, 1, info, fence)` once
  and returns its signed `VkResult` unchanged. Recording, reset, submission
  failure policy and waits belong to the caller. Success admits the work.
  Keep submitted device objects live until retirement and establish memory
  visibility before reading staging. A failed submit supplies no fence
  completion to wait on.

## Host 11 validation

The checked C example creates a shader and submits a GPU event-setting
command through the same DLL. The larger counted PE imported both entries
through C and used them for compute, vertex and fragment creation and a
single real draw submission. With Wine 8, host Khronos synchronization
validation and the Quadro RTX 6000, counts 0 and 1 respectively produced
four `112233ff` and four `4080bfff` pixels. The command bytes, row padding
and guards matched the direct executable after caller fence retirement.
Both the raw and DLL semaphore tests returned with work pending and passed
after host release. All counted and gated callbacks recorded zero warnings
or errors. The negative −4 submit came from a separate recording loader.

Native Windows drivers and Draw's WSI/presentation integration require
separate runs. Artifact identities, exact link inspection, hardware details
and per-call timing are in the
[project journal](../../../../docs/temporal-opcode-research-journal.md#windows-x64-combined-vulkan-library).

## Recording indexed draws from C

On Windows x64 and Linux x86-64, include `indexed_draw_c.h`. During device
setup, after checking and enabling the required features, resolve the core
command and store the typed pointer alongside that live device.

```c
PFN_vkCmdDrawIndexedIndirectCount draw_count =
    (PFN_vkCmdDrawIndexedIndirectCount)vkGetDeviceProcAddr(device, "vkCmdDrawIndexedIndirectCount");
```

In Draw's reported Vulkan 1.4 call at `7be8d020`, draw.c line 8093, the
producer writes a count word followed by up to 16,384 indexed records. Pass
the original buffer for both roles. Each 20-byte record has five 32-bit
fields, with signed vertex offset in the fourth word. The fixture binds
uint16 indices. Inside the caller's recording and error-handling code:

```c
uint32_t called = tower_vk_record_indexed_indirect_count_v1(
    draw_count, primary, stream, stream_bytes, 4, stream, stream_bytes, 0, 16384, 20);
if (called == 0) return false;
```

The full stream size is 327684 bytes. Independent buffers can use different
sizes and offsets. Both sizes and offsets use 64-bit `VkDeviceSize` on LP64
and LLP64. A one means that the supplied function ran synchronously once.
A zero leaves the command buffer untouched. The count must always fit, even
when the maximum is zero. See the [header](indexed_draw_c.h) for zero-maximum
offset and stride rules. Draw owns its Vulkan 1.4 feature gate and count limit,
producer barriers, recording primary, active rendering scope, bound pipeline
and index buffer. It submits separately and keeps resources live until
retirement. The library borrows the handles for the call and never maps the
GPU count.

### External link and recording controls

From the repository root on a Linux x86-64 host with Vulkan headers:

```sh
v=scaffolding/library/graphics/vulkan
mkdir -p out
(cd bootstrap/linux-x64 && sha256sum -c --quiet SHA256SUMS)
bootstrap/linux-x64/towerc "$v/indexed_draw_c.tower" --library --jobs 1 \
  --foundation "$PWD/scaffolding/foundation.tower" -o out/indexed_draw_c.o
cc -std=c11 -O2 -Wall -Wextra -Werror -I"$v" "$v/indexed_draw_c_checks.c" \
  out/indexed_draw_c.o -o out/indexed_draw_c_checks
./out/indexed_draw_c_checks
```

The release object is self-contained. The C control supplies a recording PFN.
A Vulkan application also links the loader for its own calls. For Windows x64,
with the cross-toolchain variables above and the DLL beside the executable:

```sh
v=scaffolding/library/graphics/vulkan
"$v/build_graphics_dll.sh" "$PWD/out"
clang --target=x86_64-w64-windows-gnu --sysroot="$MINGW_SYSROOT" \
  -idirafter "$VULKAN_INCLUDE" -I"$v" -std=c11 -O2 -Wall -Wextra -Werror \
  -fuse-ld=lld -L"$MINGW_GCC_LIB" "$v/indexed_draw_c_checks.c" \
  out/tower_graphics.lib -o out/indexed_draw_c_checks.exe
wine64 out/indexed_draw_c_checks.exe
```

Both controls print the return value and driver-call count per case, verify all
forwarded arguments, and exit 0. The release DLL exports submit at ordinal 1,
shader creation at 2 and counted recording at 3. The [host 11
receipt](../../../../docs/temporal-opcode-research-journal.md#counted-indexed-recording-through-the-external-graphics-abi)
identifies both integrated callers, their GPU captures and the clamp control.
