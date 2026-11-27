# Tower Vulkan library for Windows x64

`tower_graphics.dll` exports the shader-module constructor and the asynchronous
one-descriptor queue submit. Link a Windows x64 C application with
`tower_graphics.lib` and put the matching DLL beside the executable.
Include [shader_module_c.h](shader_module_c.h) and [frame_submit.h](frame_submit.h).
The application also links the Vulkan SDK import library for its own Vulkan
calls. At runtime the Tower DLL imports exactly `vkCreateShaderModule` and
`vkQueueSubmit` from `vulkan-1.dll`.

## Build from a clean checkout

From the Tower root on Linux x86-64 with Bash, GNU coreutils and LLVM 19
(`llvm-dlltool` and `lld-link` on PATH), run:

```sh
scaffolding/library/graphics/vulkan/build_graphics_dll.sh "$PWD/out"
```

The entry verifies the checked-in bootstrap, compiles both Tower objects for
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

## Draw application with the two-export DLL

Draw's manager reviewed job `4c9c47bb` and reported local integration at
`525a105`. It rehashed 331 files and the 177-file predecessor package.
The Win64 Draw OSD executable (digest prefix `c2810e92`) used the shader
and submit DLL at Tower `1db528e8505d4cd416f1c5f8aa6edf798b944e07`.
Rendering matched its release and packaged DLL copies to SHA-256
`d29a2d9345e7dae3c8894f5c6db4058f68d4c59fb26357c57b1470f7e96359e4`.

On the RTX 3060 under Wine, Draw reported exit 0 for the functional frame
run. The first submission remained pending until the wait. On resize, all
96 created shader modules were retired. Draw also verified the shaderless
clear and matching resize RGB, HUD and camera results. Stock validated
Wine runs exited 1.

Draw rehashed both 4,096,004-byte counted raster streams. Each started
with little-endian count 16384 and contained 1,024,000 uniform RGBA
pixels. Rendering independently reconstructed these expected stream
digests from the count and reported pixels.

| Shader | RGBA pixel | Expected SHA-256 including count |
| --- | --- | --- |
| Original | `407fbfff` | `4eddbebef0549f4d642a7c2363778c47e76973c8a3912f89883b6575d32b8a7f` |
| Corrected | `4080bfff` | `78ee87c63b6022644debc6d4b2563e4a9f1d9d92e566084886855141484fa411` |

Draw assigned live five-export testing to `97a65c6b`. The six-export
release has its own review. Physical Windows and displayed WSI remain open.
