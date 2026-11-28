# Tower Vulkan library for Windows x64

`tower_graphics.dll` exports retirement of owned image handles, allocation and zero-offset binding, image allocation planning, image-format preflight, image, bound-image view and shader creation, counted indexed recording, reusable primary begin, end/prepare, tight color region construction, staged buffer and OSD texture recording, blocking upload finish and asynchronous
one-descriptor queue submit. Link a Windows x64 C application with
`tower_graphics.lib` and put the matching DLL beside the executable.
Use the public headers for [retirement](image_retirement.h), [allocation and binding](image_memory.h), [allocation planning](image_allocation_plan.h), [preflight](image_format_preflight.h), [image creation](create_image.h), [bound-image views](bound_image_view.h), [shaders](shader_module_c.h), [submission](frame_submit.h), [counted recording](indexed_draw_c.h), [buffer uploads](buffer_upload_record.h) and [OSD texture uploads](osd_texture_upload_record.h).
The application also links the Vulkan SDK import library for its own Vulkan
calls. At runtime the Tower DLL imports `vkDestroyImageView`, `vkDestroyImage`, `vkFreeMemory`, `vkAllocateMemory`, `vkBindImageMemory`, `vkGetImageMemoryRequirements`, `vkGetPhysicalDeviceImageFormatProperties`, `vkCreateImage`, `vkCreateImageView`, `vkCreateShaderModule`, `vkResetCommandBuffer`,
`vkBeginCommandBuffer`, `vkEndCommandBuffer`, `vkQueueSubmit`, `vkQueueWaitIdle`, `vkCmdCopyBuffer`, `vkCmdCopyBufferToImage` and core `vkCmdPipelineBarrier2` from `vulkan-1.dll`.

See the [external Tower image application](graphics_so_linux.md) for a two-target build, Win64 executable link and Linux CPU recording check.

## Build from a clean checkout

From the Tower root on Linux x86-64 with Bash, GNU coreutils and LLVM 19
(`llvm-dlltool` and `lld-link` on PATH), run:

```sh
scaffolding/library/graphics/vulkan/build_graphics_dll.sh "$PWD/out"
```

The entry verifies the checked-in bootstrap, compiles the Tower objects for
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
PE executable. Run `out\graphics_consumer.exe` with a Vulkan loader exporting the core 1.3 names, a Vulkan 1.1-capable
first adapter and a graphics queue in family zero. The observed exit was 0:

```text
shader created and destroyed; GPU event set after each of three fence retirements
```

## C caller ownership

- Start with a null module slot and a distinct initialized `int32_t` slot.
  Pass the number of readable aligned **words**. Return 0 means local refusal.
  Return 1 means the loader ran and the signed result is in the result slot.
  Only 1 with `VK_SUCCESS` transfers a module. The caller may release the
  words on return. Destroy the module once on its creating device with a
  null allocator after its last use in pipeline creation.
- Use direct begin on a fresh primary. For reuse, establish retirement and
  synchronize host access to the primary and its individually resettable pool.
  Pass the handle by value to `tower_vk_command_begin_v1`. It resets with flags
  zero, then begins with ONE_TIME_SUBMIT. Any nonzero reset result stops the
  sequence. The signed result identifies success or failure.
- To end a recording primary, pass a writable `VkSubmitInfo` and the address of
  its command handle to `tower_vk_command_end_for_submit_v1`. Supply a wait
  semaphore and its stage mask together for a wait. The signal slot is optional
  independently. A nonzero end result preserves every byte of the descriptor.
  Success stores the original command, wait, stage and signal pointers. Keep
  their slots live and stable until the separate submit returns.
- Externally synchronize the queue. Pass the original prepared
  `const VkSubmitInfo *` and fence. The library borrows the descriptor and its
  host arrays until return, calls `vkQueueSubmit(queue, 1, info, fence)` once
  and returns its signed `VkResult` unchanged. Fence reset, frame history, swapchain operations, submission
  failure policy and waits belong to the caller. Success admits the work.
  Keep submitted device objects live until retirement and establish memory
  visibility before reading staging. A failed submit supplies no fence
  completion to wait on.

## Blocking staged uploads

With the queue externally synchronized, pass a recording primary allocated
from a compatible pool. The C caller includes `frame_submit.h` and uses the
same import library and Vulkan SDK link command as above.

```c
VkResult result = tower_vk_command_finish_v1(queue, cmd);
```

Finish ends the primary, submits its handle in one descriptor with zero
semaphores and a null fence, then calls `vkQueueWaitIdle(queue)`. Each
operation returns immediately on the first nonzero signed result. On
success the caller can reuse the retired primary and release staging.
The caller owns recording, memory visibility, external synchronization
and all resource lifetimes. A failed idle follows an accepted submit.
Keep the pool, primary, buffers and memory live until a separate owner
drain establishes retirement or the caller applies its device-loss policy.
The existing asynchronous frame submission still returns after submit.

The six-export release added finish at ordinal 6. The aggregate `command_finish.obj`
defines finish, end/prepare (5) and queue submit (1) once each. The PE
imports six Vulkan loader calls. The 4,096-byte DLL has SHA-256
`b5a46d778883c9c34dfc2921374c4fa3212c4b5d9e0cde6056480d388d5af222`.
The matching `tower_graphics.lib` has SHA-256
`a97e7d790373b11a1cef6a88c131f83ea3bf184250c8bee65900ee4c929a99e7`.
The linked upload test PE imports `tower_vk_command_finish_v1` from the
DLL. Its SHA-256 is `eb0fe711aefe7753edeb4380993e18d2ba911899a8b997f1321a0ba5fed2b812`.
The raw Vulkan control used the same workload object.

On host 11, a Win64 raw Vulkan caller and a separate C caller linked to
this DLL each completed 64 eight-byte copies on the Quadro RTX 6000
under Wine 8, NVIDIA 615.71.10. The selected adapter reported Vulkan
1.4.351 and the workload requested core 1.3. The explicit guest validation
layer request returned −6. The successful runs used the host Khronos layer
with synchronization validation and reported zero callback warnings/errors.
Each checked all 16 destination bytes through successive payload changes.
Independent E/ES/ESI controls returned −4, −1 and +1 at each step. On the
GPU, each injected idle result left the guarded first payload readable
after a separate successful queue drain. The prior frame gate, counted
pixels, staging order and C executables also passed with this DLL.
Draw's 73-byte staged uploader was checked separately with the Linux
library and a recording driver. Physical Windows and execution of this
six-export DLL inside Draw remain open. [Draw Linux recording receipt](https://github.com/TrevorSundberg/tower/blob/37809215a14090a05eb6dda968f5d8ad5d8f4278/scaffolding/library/graphics/vulkan/command_finish_v1.md#draw-staged-upload-through-the-public-entry)
[Host, build and replay evidence](../../../../docs/temporal-opcode-research-journal.md#blocking-upload-finish-in-the-windows-x64-graphics-dll)

## Draw C link against all six exports

At Draw `98c81d98e2dc017baee86ef7a24c017028ffd968`, the Draw manager
fetched Tower `b0d526fc8bae5288d6d4e74660ef646f09d935b1` and rebuilt
the DLL with the published script and LLVM 19. Both the DLL and import
library matched the hashes above. Draw then linked a separate x64 C
consumer against all six entries using the released headers. Draw
reported executable SHA-256
`d1080b337f72ab589a3ed2fc25aad59ce42b7db7782c433339dec2efc074b865`.
Its PE inspection confirmed that ordinals 1–5 retained their names,
`tower_vk_command_finish_v1` occupied ordinal 6, and the provider
imported `vkQueueWaitIdle` from `vulkan-1.dll`.

This verifies the cross-link. Draw assigned its live ordinal-6 test to
job `c2a6ad55-2db3-49ad-a666-f72249d77cf2`, dependent on the separate
five-export application test `97a65c6b`. The 64 guarded copies above
are Tower's Wine hardware runs. The 73-byte and 64 MiB Draw device
readbacks have their own Linux assignments. Physical Windows remains open.

## Staged buffer recording at ordinal 7

Include `buffer_upload_record.h` and `frame_submit.h`. For Draw's staged
branch, copy the logical payload to coherent staging and begin the primary.
At this point the caller can issue both operations through one import library.

```c
tower_vk_buffer_upload_record_v1(cmd, staging, dst, size);
VkResult result = tower_vk_command_finish_v1(queue, cmd);
```

Pass a recording transfer-capable primary outside a render pass, with core
Vulkan 1.3 synchronization2 enabled on its device. Both buffers must have
bound memory, the corresponding TRANSFER_SRC/DST usage and valid,
non-overlapping ranges for the positive logical `VkDeviceSize`. All four
arguments cross the Windows x64 C ABI by value. The recorder returns void.

The first driver call copies one region, offset zero at both ends, with
the exact size. The next calls core `vkCmdPipelineBarrier2` with one global
`VkMemoryBarrier2` from TRANSFER/TRANSFER_WRITE to ALL_COMMANDS/MEMORY_READ.
The dependency flags and unused counts are zero. Its unused pointers and
both extension-chain pointers are null. The recorder borrows handles and
uses stack descriptors. Draw's direct-mapped branch bypasses both calls.
Draw retains staging until the separate finish establishes retirement.

Build the DLL with the public command above. For an application using these
two entries, set the same SDK variables and link its own objects normally.

```sh
clang --target=x86_64-w64-windows-gnu --sysroot="$MINGW_SYSROOT" \
  -fuse-ld=lld -L"$MINGW_GCC_LIB" upload_consumer.obj \
  out/tower_graphics.lib "$VULKAN_IMPORT_LIB" -o out/upload_consumer.exe
```

The seven-export DLL is 4,096 bytes with SHA-256
`b6b7b867cb665f43376339e5e01f5ce98c10a7b1182bf4a04f4dee8223ec46a4`.
The matching import library has SHA-256
`4a72821b4e00bcf594ae6c79c1c8deebd68c404dc216e9c8c62354f217c48e71`.
The tested x64 C executable (`07d6cd055115a3171c30e3fbffc2931268ad180e3a9537d9a468e671e7350aca`)
imports the recorder and finish by name. The DLL imports eight symbols
from `vulkan-1.dll`, including core `vkCmdCopyBuffer` and
`vkCmdPipelineBarrier2`. The loader must provide both symbols at DLL
load time.

Under Wine 8, the selected Quadro RTX 6000 reported Vulkan 1.4.351 and
NVIDIA driver 615.71.10. The test requested core 1.3 and enabled
synchronization2. The explicit guest validation-layer request returned −6.
Host Khronos synchronization validation was enabled for the successful
runs, which reported zero callback warnings or errors.

| Upload size | Transfers per caller | Bytes per guarded readback | SHA-256 of the complete stream, raw and linked |
| --- | ---: | ---: | --- |
| 73 bytes | 64 | 88 | `464400b39d3b85b232fc092a41fa409846d7ad845e6383f5b69752514b98cdbe` |
| 64 MiB | 2 | 67,108,880 | `00ff1657355954087fdc48ca2cb3acc6d2bd6f0b487aaf58a081595342a4ac71` |

Both streams match the [Linux recorder fixture](https://github.com/TrevorSundberg/tower/blob/dadf38c072c6757277d4043cb358e3310af0d6a1/scaffolding/library/graphics/vulkan/buffer_upload_record_v1.md#hardware-evidence).
The Windows recording control also preserved the 64-bit byte count
4,294,967,369. The previous five-import counted PE retained its guarded
output with the new DLL. Draw application execution through ordinal 7
and physical Windows execution remain open.
[Host 11 checks and replay](../../../../docs/temporal-opcode-research-journal.md#draw-staged-buffer-recording-in-the-win64-dll)

### Draw C cross-link for the seven-export DLL

Draw fetched Tower `207f5d073c29cdce7bb794b82b173645bd3a584e` and
reproduced the DLL and import-library hashes above using the published
LLVM 19 recipe. The recorder and C header matched the Linux source at
`dadf38c072c6757277d4043cb358e3310af0d6a1`.

Draw linked a separate Win64 C executable through the released recorder
and submit headers. Its code calls the recorder and then blocking finish.
Draw reported that the PE imports all seven names and identified its
SHA-256 as `6e8b787e26b4de58bb3cb166bfd4ea0bd39c39d600b881c9e7b9a7a2c1a9111e`.
The DLL exposes the recorder at ordinal 7 and finish at ordinal 6.

This receipt covers the independent C link. Draw assigned execution in
the staged uploader to slot 9 job `24a62b15-b781-40c8-a3fc-d38bf0710359`,
dependent on six-export job `c2a6ad55-2db3-49ad-a666-f72249d77cf2`.
The guarded upload captures above came from Tower's Wine fixture.

## Five-export validation at c40dae39

The C example created a shader and retired the same event-setting primary
three times. The separate counted C-linked executable imported all five
entries from one DLL. On Wine 8 with the Quadro RTX 6000 and NVIDIA
615.71.10 it matched the direct Vulkan PE on all 336 checked bytes.
Frames 0 and 2 stored count zero before count one. Frame 1 reversed the
positions. Each count-zero image contained four `112233ff` pixels and
each count-one image contained four `4080bfff` pixels. The trace shows two
command resets on the retired primary. In the gated binary-semaphore test,
the subject fence returned VK_NOT_READY before host release. Both fences
then completed and the GPU event was set. The counted and gated callbacks
reported zero warnings or errors with host synchronization validation.

The five-export DLL exposed submit, shader creation and counted recording at
ordinals 1, 2 and 3. Begin is 4 and end/prepare is 5. The end object
supplies the single definition of submit. Recorded C controls cover signed
reset, begin, end and submit results, all optional descriptor slots,
failure preservation and call order. Displayed WSI and native
Windows driver execution remain open. [Host 11 evidence](../../../../docs/temporal-opcode-research-journal.md#win64-frame-operations-in-the-counted-graphics-dll)

The five-export DLL (3,584 bytes) has SHA-256
`89fd77ce3213b9144994097b37560fdf7cb4487d00c9c2e5c25967b2b9f94bb6`.
The direct C control and C application linked through all five exports
produced identical 336-byte guarded output. An independent capture of the
240 bytes in GPU staging verified that the two results changed positions
on the second frame. The test requested the core 1.3 profile on Wine.
The selected device reported Vulkan 1.4.351. The host Vulkan loader
inserted the Khronos validation layer. Physical Windows and the Draw
application using this five-entry DLL still require their own runs.

## Independent C link on Draw

Draw independently fetched Tower `32e6f52b2d60953c7bad1678fb7bc1786bfccc2a`
and reproduced the release DLL and its import library. The import library's
SHA-256 was `797dcd7d654df8d55e4156f12c359b0d810f0422759acc5b2fbd91b4fd604a7d`.
Draw included all three public headers in a minimal Windows x64 C executable
and linked it against that import library. It reported PE SHA-256
`9b3e010ffc5ad9bb0fcc21b044e3c2594ec2841b2ca99af81d52717b6226a2d8`.
Its import table contained all five operations, and Draw confirmed provider
ordinals 1 through 5. This receipt covers cross-compilation and inspection.

### Draw application using the five-export DLL

Draw job `97a65c6b` used application `87d4e8d094572c13c0c9beba369577b9cdf59e0d`,
tests `0a59710fafc6db481bd4e76f694679e76e5ad482` and Tower
`32e6f52b2d60953c7bad1678fb7bc1786bfccc2a`. Draw verified 433 hashes
in archive `9784a81737a60194c55488f28b803918f38da4a43e451ee477088893cda543b1`.
The shipping PE, SHA-256 `bdd9c146cd84d9594a39c946ab3e896d5c2d1381f01e47d9a6cfb4bd63743a73`,
imported the entries at ordinals 1, 2, 4 and 5. Rendering independently
rehashed the matching release DLL and import library.

The offscreen functional trial on Wine 11 selected the RTX 3060,
Vulkan 1.4.329, NVIDIA 595.99.02. Draw reported frame arguments
`--osd assets/osd/state.bin --no-hud --day-hour 12 --fixed-time 0 --size 320 180 --frames 3 --benchmark-motion --fixed-step 0.016666667`.
It exited 0. In each of the three frames, end/prepare and submit used
the same borrowed command slot and descriptor. A zero-time fence wait
returned 2 (`VK_TIMEOUT`) before later retirement and reuse. On a failed
end the 72-byte descriptor and all 32 guard bytes were preserved.

Draw checked counts of 16,384 and all 1,024,000 RGBA pixels against
each original and corrected raster control. The resized HUD layer
matched its retained digest (`26bcbccf…`). The stock validated asset
and core runs exited 1 with three registry diagnostics and a loader
warning. Physical Windows and displayed WSI remain open.

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

Here `stream_bytes` is Draw's `Buffer.size`, 327684 bytes in the GPU check.
Pass each buffer's logical size even when its backing `allocationBytes`
includes padding. Independent buffers can use different sizes and offsets.
Both sizes and offsets use 64-bit `VkDeviceSize` on LP64
and LLP64. A one means that the supplied function ran synchronously once.
A zero leaves the command buffer untouched. The count must always fit, even
when the maximum is zero. See the [header](indexed_draw_c.h) for zero-maximum
offset and stride rules. Draw owns its Vulkan 1.4 feature gate and count limit,
producer barriers, recording primary, active rendering scope, bound pipeline
and index buffer. It submits separately and keeps resources live until
retirement. The library borrows the handles for the call and never maps the
GPU count.

Draw identified 24 sites at `be2fb42065dacdb49c476efdde892ab649cfe772`
(draw.c blob prefix `84ce1a58`). The external C recording controls cover
the GPU check, nuclear particles, OSD, scene buckets and water. For a
scene bucket, widen the bucket to `VkDeviceSize` before multiplying by
`frame->info[0]` and 20. The separate count buffer has 128 logical bytes.
For water, pass `poolChunkCount` unchanged, including zero. The rendering
manager published the full [Draw caller matrix](https://github.com/TrevorSundberg/tower/blob/1556ec5bec47f3d7da1d623f1122585c2942affe/scaffolding/library/graphics/vulkan/counted_draw.md#draw-counted-record-c-contract-v1).

Draw's optional OSD encoder at `94f2d31e` uses the same 1,088-byte logical
buffer for both roles, with command/count offsets 0/20 and 24/44, maximum 1
and stride 20. Draw linked its OSD render object through a CPU recording shim and observed
one callback per pass. The production HUD binds `VK_INDEX_TYPE_UINT16`.
Water and nuclear particles bind `VK_INDEX_TYPE_UINT32`. Each draw uses
the current index binding. Draw's on-device HUD readback is pending. [Other Draw call sites](counted_draw.md#draw-counted-record-c-contract-v1)

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

## OSD texture upload at ordinal 8

Use the existing DLL build command and include `osd_texture_upload_record.h`.
On a recording graphics primary outside a render pass, pass a bound, newly
created color image in UNDEFINED layout and a populated TRANSFER_SRC
buffer. Enable core synchronization2. The region list covers all mip levels
of each layer in layer-major order, with offsets relative to this texture.

```c
uint32_t layers = raw_layers ? raw_layers : 1;
tower_vk_osd_texture_upload_record_v1(cmd, staging, image, layers, mips, count, regions);
```

The DLL records one initial barrier per layer, a single copy using the
original region pointer, and one final barrier per layer covering all mips.
Fragment sampling uses SHADER_READ_ONLY_OPTIMAL and the 64-bit
SHADER_SAMPLED_READ access mask. The caller can release the region list
on return. It owns primary end, submit and retirement, keeps staging alive
through upload completion, and retains the image and view through their last
submitted use. These requirements follow the [reviewed Linux contract](https://github.com/TrevorSundberg/tower/blob/846176abc06dfa3ac6dbb939f3f683e9380cd99e/scaffolding/library/graphics/vulkan/osd_texture_upload_record_v1.md).

The 4,608-byte DLL has SHA-256
`768ffe8d0c18caa6fded190045ad684c35c320be5773c30c2ba05ed0545400dd`.
The 3,644-byte import library has SHA-256
`f611956482a39235d02f28dbae97927ff77f2a0f752bd12fa2ff0469a4cec019`.
The C boundary and raw hardware control both produced 27,542,768 identical
guarded bytes on Wine 8 with the Quadro RTX 6000, driver 615.71.10.
See the [Win64 observations and replay](../../../../docs/temporal-opcode-research-journal.md#win64-osd-recorder-through-the-external-graphics-dll).

### Ordinal 8 release verification

The Windows build uses the Linux recorder source and public header at
Tower `846176abc06dfa3ac6dbb939f3f683e9380cd99e`. The Windows-tested
implementation is `eb6f1ce89aa0b097638a3f79de7df67a10e57153`. The Win64
C object includes the public header and imports the recorder through
`tower_graphics.dll`. Rendering checked the export and import tables
in the actual PE files, verified the seven existing ordinal/name pairs
and resolved ordinal 8 to `tower_vk_osd_texture_upload_record_v1`.

| Reviewed artifact | SHA-256 |
| --- | --- |
| Tower recorder COFF | `30924c11328f85c15448ec4e9b60dcf89b1248b157f76e674b5d2d6822430523` |
| Linked test PE | `52a98ed666c6905f47513e6dac38053f63c00bd1e7e1cfd1ad4fd2f93b038803` |
| Raw control PE | `d85c607adadc3b6db42a2571014b6fec0b4f325bec097bdeddc9bfd782bdc940` |
| Guarded readback, both paths | `5b950be5050057096468fe29f087c5a3a5186d8de1910b174f5ba233ba44c811` |

Slot 11 job `9821d998-31d1-4665-8369-27063d5d5d84` ran both PEs on
Wine 8 with the API-selected Quadro RTX 6000, Vulkan 1.4.351, driver
615.71.10, UUID `26f60f6cead65faf0253a959b2e93a2d`. The recording
control compared the original region pointer, 16 region descriptors,
five copy calls and 28 per-layer barriers. Both hardware runs exited 0.
Each released staging after queue completion. The 27,542,768-byte
capture includes 27,541,504 synthetic transfer bytes, 1,024 sampled
RGBA bytes and 240 guard bytes. Rendering independently ran the capture
verifier on the raw, linked and clean linked streams and reproduced
all 256 sampled texels and every guard.

| Deliberate sampling fault | First atlas byte | Expected | Observed | Exit |
| --- | ---: | ---: | ---: | ---: |
| Force layer zero | 64 | 37 | 0 | 3 |
| Force mip zero | 64 | 5 | 90 | 3 |
| Reverse rows | 0 | 0 | 118 | 3 |

The host loader inserted Khronos synchronization validation. Healthy
guest callbacks reported zero warnings or errors. Explicit guest layer
creation returned −6 and exited 1. Win64 C UBSan and native threaded
ASan/TSan completed. Win64 ASan/TSan and physical Windows remain open.
Draw subsequently exercised ordinal 8 in its shipping Win64 application
under Wine 11.

Rendering verified the archive's 466 manifest entries, its two previous
packets and the 170-entry sampling supplement at `c2bafc6f`. Clean replay
matched all 14 locked products. The archive SHA-256 was
`5ebcf3d0f85e27c5179cb3c4752294f8a30062a6f3ce6797b0196426e4921559`.
The packet's `build.sh`, `session.sh`, `check.sh`, `audit.sh` and `native.sh`
record the exact invocations. From its extracted location on the prepared
worker, use `D="$D" PREPARED_SDK="$PREPARED_SDK" bash "$PACKET/replay.sh"`.

### Draw cross-link of the ordinal 8 recorder

Draw fetched Tower `0d0f117b07b48a48c3897efc8559646ed928f9a6` and
independently ran the published DLL build. Its DLL and import library
matched the release sizes and hashes above. At Draw
`bd203f60b00954acd3b0405720e40a24e94ef430`, Draw cross-linked a
freestanding Win64 C PE containing the descriptor-building loop and
selected recorder call from `osd_create`. The PE SHA-256 was
`f6733d1ba086fd55f35c7f131e358866d8124f909c58d96a42d929f698a24766`.
Draw verified the consumer's eight named imports, the provider's eight
ordinals, the caller relocation for the OSD recorder and its two Vulkan
loader calls. Rendering independently rehashed the retained DLL and
import library.

Draw completed its shipping application comparison in slot 9 job
`4ff01175-385e-4039-bc8e-28e4465856f6`. On the RTX 3060 under Wine 11,
the linked recorder returned from five DLL copy calls. The active texels
and guarded readback matched Linux, and the frozen normal and resized
HUDs matched their controls. [Win64 device, command and readback](https://github.com/TrevorSundberg/tower/blob/6fdd5ad973cbaa8495de012c4f2fbbf2bcad18b3/scaffolding/library/graphics/vulkan/graphics_dll_windows.md#draw-shipping-osd-recorder-on-win64)

## Building OSD copy regions at ordinal 9

Include `tight_color_regions.h` and link `tower_graphics.lib`. Supply the
actual layer count (normalize a serialized zero to one before the call),
the texture's available payload bytes and a caller-owned array. Capacity
counts SDK `VkBufferImageCopy` elements. The return value counts initialized
elements in layer-major, mip-minor order. Zero means refusal and leaves
all output bytes untouched. Offsets start at zero for each texture.

```c
VkBufferImageCopy regions[8];
uint32_t n = tower_vk_build_tight_color_regions_v1(
    regions, sizeof regions / sizeof regions[0], width, height,
    actual_layers, mip_count, bytes_per_texel, available_bytes);
if (n == 0) return false;
tower_vk_osd_texture_upload_record_v1(
    cmd, staging, image, actual_layers, mip_count, n, regions);
```

The array can be reused as soon as the recorder returns. Staging and the
image follow the queue retirement rules above. To run the independent C
caller with the cross-toolchain environment from the build instructions:

```sh
v=scaffolding/library/graphics/vulkan
"$v/build_graphics_dll.sh" "$PWD/out"
clang --target=x86_64-w64-windows-gnu --sysroot="$MINGW_SYSROOT" \
  -idirafter "$VULKAN_INCLUDE" -std=c11 -O2 -Wall -Wextra -Werror \
  '-DTOWER_REVIEWED_BUILDER_HEADER="../tight_color_regions.h"' \
  "$v/osd_checks/tight_regions_check.c" -fuse-ld=lld -L"$MINGW_GCC_LIB" \
  out/tower_graphics.lib -Wl,--no-insert-timestamp -o out/check.exe
wine64 out/check.exe checked
```

The 5,632-byte DLL has SHA-256
`2cfb10fa35320531c01d3d8b5a042a6aba771a1c4749fad417e3aed096bef05e`.
The 3,962-byte import library has SHA-256
`a5a2c26c8adb72307ae810299695105382750b7693118df4fa037aecbf9d22b5`.
The SDK executable imports both functions by name. The DLL maps them
to ordinals 9 and 8. The checked call returns 6, 2, 2, 4 and 2 for the
five textures. The archived command trace, captures and same-host costs
are indexed in the [project journal](../../../../docs/temporal-opcode-research-journal.md#win64-tight-color-region-builder-at-ordinal-9).

### Draw Win64 cross-link of the region builder and recorder

Draw independently rebuilt Tower `3b739bb61e6cfb5caa2c037bee1a6ae3ee11ca46`
for its packed reader at `ff8da985f4a7de2ef555c48e5d666f0e544f3d55`.
Its DLL and import library matched the release sizes and hashes above.
Both projects compared the builder and recorder Tower sources and C headers
with `0e385907c24e0d465aaf5aeccb98ddeb7f4b8871` and found them identical.

Draw reports that its optimized x64 C executable imports all nine functions.
Its caller excerpt has AMD64 REL32 relocations for the builder followed by
the recorder, with a zero-count check that rejects the upload before recording.
Draw's PE SHA-256 is
`7d81f48e0c801922c3060687b8b8fa37460e355c40faaa0aaf2bab32503eac58`.

Draw queued the shipping Win64 application on slot 9 as
`53a91d0e-5c6f-4956-b5a5-a0e58506bc7f`, after the ordinal-8 recorder
evidence from `4ff01175-385e-4039-bc8e-28e4465856f6`. That run must
compare the shipped pack's GPU texel readback and frozen HUD output.
Physical Windows execution also remains open.

## Creating a view of a bound image at ordinal 10

Include `bound_image_view.h` and use the existing `tower_graphics.lib` link.
After the image is bound, pass its creating device and the caller's compatible
format, explicit view type and complete subresource range.

```c
VkImageView view = VK_NULL_HANDLE;
VkResult result = tower_vk_create_bound_image_view_v1(
    device, image, view_type, format, &range, &view);
```

On success the caller owns the returned view. On a driver failure the caller
receives its original null slot and the exact signed result. The view operation
makes one null-allocator call. Destroy the view on its creating device after
its last submitted use completes, then destroy the image and free its memory.
The [public contract](https://github.com/TrevorSundberg/tower/blob/6b39d552b312a4d79436b49337cf3fff20b9b5cc/scaffolding/library/graphics/vulkan/bound_image_view_v1.md)
identifies Draw's caller and the portable Linux evidence.

The Win64 SDK control and the external C consumer sampled all 16 subresources
on Wine 8 and the Quadro RTX 6000. On each bitmap the device created both a
2D view and a 2D-array view with the same image, format and full two-mip,
one-layer range. The guarded stream matched the nine-entry release.
The 6,656-byte DLL has SHA-256
`6c926154af173dc92ece47f2c4b5c3d2bfa278904d69167172521f8eef1f7940`.
The 4,270-byte import library has SHA-256
`39821cb5d83086f665346451b9825ea80d5430daa96f6897ecc3d47075d33afd`.
See the [per-path recording, timing and lifetime results](../../../../docs/temporal-opcode-research-journal.md#win64-ordinal-10-for-an-already-bound-osd-image).

### Win64 external C and device verification

Build from the Tower checkout with
`scaffolding/library/graphics/vulkan/build_graphics_dll.sh "$PWD/out"`.
Include `bound_image_view.h` from the Vulkan library directory and link the
C executable with `out/tower_graphics.lib`. Place the matching
`tower_graphics.dll` beside the executable.

In slot 11 job `01f5b8d5-c2f6-4a88-b80c-a248fd127cea`, the linked GPU PE
had SHA-256 `f91f8340569257e5aca768dc934bbb867e1cec05075a4ff51be38a24f4ea31df`.
Rendering decoded the DLL's ten exports and the executable's import of
`tower_vk_create_bound_image_view_v1`. The same function and header are in
the [reviewed Linux implementation](https://github.com/TrevorSundberg/tower/blob/6b39d552b312a4d79436b49337cf3fff20b9b5cc/scaffolding/library/graphics/vulkan/bound_image_view_v1.md).
An SDK recording driver returned success, −1 and −2 on nine cases. Each of
the raw SDK, direct object and DLL callers recorded exactly one driver call
per case and an empty public slot on failure.

Wine 8 selected the Quadro RTX 6000, Vulkan 1.4.351, NVIDIA 615.71.10.
The five full source views were sampled across 16 subresources. Five extra
views exercised alternate ranges or types. All ten were destroyed on their
creating device after queue retirement and before their images and memory.
The complete 27,542,768-byte synthetic capture matched the raw SDK reference,
SHA-256 `5b950be5050057096468fe29f087c5a3a5186d8de1910b174f5ba233ba44c811`.

Host synchronization validation ran, and the guest callback reported zero
warnings or errors. Explicit guest layer creation returned −6. Win64 C
trapping UBSan passed. ASan and TSan completed on the native Linux provider.
Win64 ASan/TSan, physical Windows and the shipping Draw Win64 caller remain
open. Draw's Linux owning constructors have a separate [CPU acceptance record](https://github.com/TrevorSundberg/tower/blob/4096eba0f8fa217a702c9af3a34fa411aa7f2727/scaffolding/library/graphics/vulkan/bound_image_view_v1.md#draw-constructor-adoption-on-linux).

### Draw Win64 post-bind view cross-link

Draw independently rebuilt Tower `4bcb724436879c5b2447ac9617100c989992f8be`
and reproduced the DLL and import-library sizes and hashes above. Draw linked
its post-bind helper at `a0ee83752c68f3fcff54f0128a71d8bcdc753b4b` into
the existing nine-import C probe. The resulting optimized Win64 PE SHA-256
was `20352d826d0f36b94a2568a8ff54b36e10e0dca7a3a8b46d448a139f911cd41a`.
Draw verified all ten named imports, matched the provider ordinals and found
the AMD64 REL32 relocation for the bound-view call in its actual helper.

This was a host cross-link. Draw slot 9 job
`966e83dc-85c9-4fd1-bd67-2ab72fa6f796` owns the shipping Win64 packed
texel and HUD comparison. It requires the ordinal-9 application artifact
from `53a91d0e-5c6f-4956-b5a5-a0e58506bc7f`. Draw's separate Linux
application job is `7a36cecf-5020-480c-90a9-bbecaacecc2c`.

## Creating an unbound image at ordinal 11

Include `create_image.h` and link the external C application with the
release `tower_graphics.lib`. Pass a live device, the original SDK
descriptor and a separate, initially null image slot.

```c
VkImage image = VK_NULL_HANDLE;
VkResult result = tower_vk_create_image_v1(device, &info, &image);
```

Keep the descriptor, including its chain and queue-family array, live
through return. On success the caller owns the image, queries requirements,
allocates and binds memory, and may then create a view. Retire submitted
uses before destroying the views, image and bound memory in order. An
error preserves the caller slot and returns the driver's signed result.

Build with the clean-checkout command above. The following SHA-256 digests
identify the products built with the checked-in Linux x64 bootstrap and
LLVM 19.1.7 at `d79cc78b193340ec0376ea226b2e2ca7a35ec212`.

| Product | Bytes | SHA-256 |
| --- | ---: | --- |
| `create_image.obj` | 641 | `ebe5a75947f64a847b8de4bccc3ba678f57b672a60204a0e91b62d12b0fda405` |
| `tower_graphics.dll` | 6656 | `e7524e2b14f148a37e79eb4912f9aa07bfc6e252dfd1fd45be211cd5914b7e6c` |
| `tower_graphics.lib` | 4522 | `3662deaaf18aaaf028f0653a516ecaa8f5e171a49cac48cea625eb3e5b4ae246` |
| External capture PE | 305152 | `19505a2530855043833d1f053772054171de01904d8941d6ba00b20b496274e7` |

Ordinals 1–10 retain their names. The new export imports only
`vkCreateImage`. The DLL link map identifies `create_image.obj` as its
definition. The release-linked PE imports ordinals 8–11 by name with
matching hints. The original expected.lib and the release import library
have different digests and produce identical capture executables.
The job packet contains both original controls and the release link map.

### Win64 device execution through ordinal 11

Wine 8 loaded the release DLL in the external C capture process. Vulkan
selected the Quadro RTX 6000, API 1.4.351, NVIDIA 615.71.10, queue 0/0.
The fixture called ordinal 11 for the five sampled source images and used
its raw SDK call for the five readback targets. Rendering decoded the PE
export and import tables and checked ten create, requirements, allocate and
bind sequences across the two groups. All ten submissions completed on
the same queue, and each source view was destroyed before its image and
bound memory. The 27,542,768-byte capture matched the raw SDK control byte
for byte, including 256 sampled texels and 240 guard bytes. SHA-256 was
`5b950be5050057096468fe29f087c5a3a5186d8de1910b174f5ba233ba44c811`.

Raw SDK, direct-object and DLL C callers each passed 21 recording cases.
When the fault loader wrote the private output and returned signed −2 at
the first source, the caller's output stayed null. The fixture exited 3
before memory requirements, allocation, binding, view creation or submit.
Win64 trapping UBSan passed at the C boundary. The worker reported
overlapping device timings, unavailable Win64 ASan runtime and unsupported
Win64 TSan. Physical Windows and Draw's shipping Win64 caller remain open.

### Draw Win64 cross-link for image creation

Draw independently rebuilt Tower `a639a49e0c9709117d990331361a8801ee41746a`
and matched the DLL and import-library digests above. The portable header
and source match Linux `07587159dbc5606b3e24d85fa6e3babfc2f9b6fe`.
Draw compiled the shipping C bodies of `image_create_checked` and
`draw_vk_create_unbound_image` at `c026f0fd1539187538b4b8ceec41687587ea835c`
and cross-linked them into a Win64 PE with SHA-256
`ff28fc30643410aaf2087745e794367bcd380508ce9c57c4b3d589f3c70b5141`.
Draw checked eleven named consumer imports, DLL export ordinals 1–11 and
the AMD64 REL32 relocation for the helper's call to `tower_vk_create_image_v1`.
Rendering rehashed the retained release binaries and checked the portable
source and header against the Linux tree.

The Draw evidence for this PE is static inspection. Shipping Win64
execution belongs to slot 9 job `3a6e478a-93ad-42c5-a9b1-82317fb70b48`
after the ordinal-10 bound-view job `966e83dc-85c9-4fd1-bd67-2ab72fa6f796`.
The separate Linux provider test is assigned to
`447eb373-d35d-4ab3-8fa2-5ee2b481f96e`.

## Image-format preflight at ordinal 12

Include `image_format_preflight.h` and use the import library from the
same build. The caller passes the creating physical device and the image
descriptor before attempting creation. Provide separate writable
`VkImageFormatProperties` and `VkBool32` outputs. On success use the
capacity decision to admit or reject the descriptor. A failed Vulkan query
returns its signed result and preserves every byte of both outputs.

Win64 build e2874d33 uses the unchanged provider and header from portable
ref b68b1835. The build command above produced these SHA-256 digests.

| Product | Bytes | SHA-256 |
| --- | ---: | --- |
| image_format_preflight.obj | 879 | `7eb57e6f9b5715d93c9255d773f3e24f8ed064cb64c35a38964ec47e4231fd61` |
| tower_graphics.dll | 6656 | `66117872f626339ab74f235e7e2e5806aab98a0548574cd83ea7555ab3d500c9` |
| tower_graphics.lib | 4824 | `8032146558ee27d86b7fa8144e4ca9a8fb7d14ef4d2bc913872603d720a82c1b` |

The prior eleven names and ordinals retain their bindings. The new object's
only undefined symbol is the SDK query. The DLL link map resolves the new
export to that object. The release library reproduced the two frozen external
caller PEs byte for byte. The recording caller returned all 28 SDK rows.
The hardware caller issued five preflight queries before source creation
on Quadro RTX 6000, NVIDIA 615.71.10 under Wine 8. All 27,542,768 retired
bytes matched the guarded SDK capture. A zero-width input stopped the
caller on each of two outcomes, success with insufficient capacity and
an injected query error of −11. The packet replay command and additional
compatibility results are in the project journal.

### Draw production caller cross-link

Draw independently rebuilt Tower `752a872f700803d62dead0375728a1692605c2d3`
with the pinned bootstrap and LLVM 19. Its DLL and import library matched
the two release digests above. The portable source and public header match
Linux `b68b1835c9c24171222eab85a695a77835c23e54` byte for byte.

From Draw `07d50aba02d3685e644cca16a122f5f041dd7b7a`, Draw compiled the
production `draw_vk_create_checked_image` and `image_create_checked` code
and the unbound-image creation excerpt against the SDK headers. It used
`clang --target=x86_64-w64-windows-gnu -O2 -fno-inline -ffreestanding`
and linked its existing consumer with
`lld-link /machine:x64 /nodefaultlib /entry:entry /subsystem:console`
and the release import library.

Draw reported PE SHA-256
`7dce042582cc080b7cfd678839711757c508eccbc4409a97d5b89fa1a4eb5e8f`.
It checked all twelve named imports and the AMD64 REL32 relocations for
the production calls to preflight and image creation. Repeating the link
against the eleven-entry release failed on the unresolved
`tower_vk_image_format_preflight_v1` symbol. Rendering independently
checked the release hashes and both DLL export tables. Ordinals 1–11
match across releases and ordinal 12 names the preflight entry.

This was a link-only test with diagnostic stubs. Draw assigned shipping
Win64 execution to its existing slot 9 job
`a1fbfaac-7f89-4011-8648-dadada799ec8` after the ordinal-11 application
job `3a6e478a-93ad-42c5-a9b1-82317fb70b48`.

## Image allocation planning at ordinal 13

Include `image_allocation_plan.h` and link the matching `tower_graphics.lib`.
After image creation and before binding, pass the device, image and up to
`VK_MAX_MEMORY_TYPES` entries from the creating physical device. Supply
separate writable `VkMemoryAllocateInfo` storage. The planner queries the
image once and selects the lowest eligible type with all required flags.
On `VK_FALSE`, the entire output retains its original bytes. On `VK_TRUE`,
pass the written descriptor to `vkAllocateMemory`. Account its full
`allocationSize` after success. Bind the returned memory to the same image
at offset zero and handle the signed bind result separately. The caller
owns the allocation and retires GPU use before releasing the resources.

The [Win64 allocation recorder](osd_checks/README.md#post-create-allocation-plan-on-win64)
builds a separate C consumer against the public header and release library.

### Draw Win64 cross-link of the allocation planner

Draw independently rebuilt Tower `61ebea411f92bc8e750181aaa543aca42a955818`
with the pinned bootstrap. The 6,656-byte DLL had SHA-256
`3d6fd8e03868b072fb55d16ba963f4fa2880e0d4e0c8092694c1670fa08ce30b`.
The 5,122-byte import library had SHA-256
`ed9a0e67ff7de692509398880aa68b090335f84d241e7f451e26654127e96479`.

At Draw `51d4785e6456353b9a65f49d311cb0c6925ee42d`, Draw cross-compiled
the actual `draw_vk_prepare_image_allocation` body. It reported an AMD64
REL32 relocation at offset `0x17` to `tower_vk_plan_image_allocation_v1`.
The linked consumer PE had SHA-256
`8a918f57244ec2fbbb82ef98fa196ac7ff8ae84f244eb94eb17f460d24114ffb`
and imported that name from `tower_graphics.dll` with hint 13. Rendering
independently checked the two release hashes, the preserved ordinal 1–12
mappings and hint 13 in its own retained external C consumer.

Draw's result covers cross-compilation and linking. Its slot 9 job
`304c4244-b69d-42fe-afc8-f2903aedd622` owns execution of the release
checker and the shipping packed HUD comparison after ordinal-12 job
`a1fbfaac-7f89-4011-8648-dadada799ec8`.

## Device memory allocation and zero-offset binding

Include `image_memory.h` and link the matching `tower_graphics.lib`.
Ordinal 14, `tower_vk_allocate_memory_v1`, borrows the caller's
`VkMemoryAllocateInfo`, including its extension chain. Supply a separate,
initially null memory slot. On `VK_SUCCESS` the caller owns the returned
memory and accounts the full `allocationSize`. On any other result the
slot retains its original bytes.

Ordinal 15, `tower_vk_bind_image_memory_zero_v1`, takes the device, the
original image and the acquired memory. It returns the signed Vulkan result
from binding at offset zero. A failed bind leaves the allocation and its
accounting with the caller. Create the view after a successful bind and
retire GPU work before destroying views, destroying images and freeing
bound memory. The two entries share the standalone Tower implementation.
The [external C qualification](osd_checks/image_memory/README.md#qualify-the-combined-release-from-source)
checks both link forms and runs the existing planner callers with the combined DLL.

Rendering independently rebuilt the release from worker revision
`2aac8a3e110332cbc2b353386f5a4ff53826bb83`. SHA-256 for the DLL was
`e0e69bfb058eac4007f7f3405c8bbe69499254b5855c9c7ea55261f461e46b46`;
for the import library it was
`95a262d40b48a70b22fc66728f631580a3b22a98173db154944012753acf7eb0`.
The import table names both Vulkan loader calls. The first thirteen export
ordinals matched the earlier release. The actual linked device PE in
`dll/memory/linked-regular/device/program.exe` imports both new entries.
Its SHA-256 was `bff121d7e2bed7adebce80bd930726182df54e2056a7334e8cb1e06107f21709`.

Rendering checked fourteen raw and DLL recording rows and exits, including
the clobbered allocation slot and the live allocation after bind failure.
The worker's Quadro RTX 6000 run under Wine 8 matched the 27,542,768-byte
guarded reference, SHA-256
`5b950be5050057096468fe29f087c5a3a5186d8de1910b174f5ba233ba44c811`.
Shipping Draw and physical Windows execution remain open for these entries.

## Retiring an owned image at ordinal 16

Include `image_retirement.h` and link the matching `tower_graphics.lib`.
Pass a live creating device and the owned view, image and memory handles after
all submitted uses have completed successfully. Release additional dependent
views first. The entry skips each null child independently, destroys the view
then image, and frees the allocation with a null allocator. The caller
accounts the released memory and clears its record after return. The caller
also owns swapchain and borrowed-handle policy and recovery after a failed wait.
See the [portable contract](image_retirement_v1.md).

On host 11, the retained fifteen-entry device PE and the new external C PE
both ran with the sixteen-entry DLL under Wine 8. Both validated all 256
sampled texels and 15 guards on the physical Quadro RTX 6000. The new PE
imports `tower_vk_destroy_retired_image_v1` from `tower_graphics.dll`.
The link map binds that export to `image_retirement.obj`. Its three calls
resolve through `vulkan-1.dll`. A second PE traced all five source retirements
through those DLL imports after ten successful queue completions. The
[qualification instructions and results](osd_checks/retirement/README.md)
identify the binaries and replay command.

Rendering rebuilt worker revision `8a7a10105e0d9d96bbb6ed0d6a990e3b0f7d4a84`
using the packaged Linux x64 bootstrap and LLVM 19.1.7. The release
recipe is `bash scaffolding/library/graphics/vulkan/build_graphics_dll.sh OUT`.
The reproduced DLL SHA-256 is
`8fc64f24fd5491d129494dc6645be46680b87067e2288ac45f3614f242096ed7`
and its import library is
`2d56f882882f90a67ae8a063899841b0968dc6d35476967eaf1fa53b5d0d945c`.
All fifteen previous export names kept their ordinals. Ordinal 16 starts at
RVA `0x1d70`. Rendering decoded the final PE's two calls and tail jump.

| Operation | Instruction RVA | Thunk RVA | IAT RVA in vulkan-1.dll import table |
| --- | ---: | ---: | ---: |
| vkDestroyImageView | 0x1d8b | 0x1e70 | 0x2400 |
| vkDestroyImage | 0x1d9e | 0x1e60 | 0x23f8 |
| vkFreeMemory | 0x1db8 | 0x1e90 | 0x2410 |

The release-linked device PE had SHA-256
`5fc83d0291c11507ee5b4b07470514896697bcc288d608b647a08b19a812c1a3`.
The separate observer PE had SHA-256
`abbd3b0be63126ed0d802c795b268cabd284067cdd47ab7ca6d46314c1f71de2`.
Both import the public retirement function from the packaged DLL.
Rendering compared the observer's five sets of returned view, image and
bound memory handles with the driver calls. Each set used the creating
device and a null allocator, after two successful finishes on the same
queue. Live source bytes and allocation count returned to zero after each
set.

The worker selected a Quadro RTX 6000, Vulkan 1.4.351, NVIDIA 615.71.10,
through Wine 8. Rendering compared all 27,542,768 guarded bytes with
the archived fifteen-entry reference. SHA-256 was
`5b950be5050057096468fe29f087c5a3a5186d8de1910b174f5ba233ba44c811`.
The worker verified 256 sampled texels, 15 guards and zero validation
warnings or errors. The older DLL failed to resolve the new name, and
the deliberately reversed order failed at mask 3 (process exit 4).
Win64 trapping UBSan and native Linux ASan/leak and TSan passed in their
respective fixtures. Win64 ASan and TSan were unavailable. This run covers
the Tower qualification fixture. Physical Windows and the shipping Draw
PE with ordinal 16 have their own acceptance requirements.

### Draw Win64 owner cross-link at ordinal 16

Draw commit `ad18ef06908ea1ffbd74d2a45a96f36a652794b9` used the released
Tower DLL at `8ac14905c24b806449243348591f7164e06d2d90`. Draw checked the
retirement source and header against `6aa610c9` and reproduced the DLL and
import library hashes recorded above. It cross-linked its actual
`draw.c` `image_destroy` body and 64-byte `Image` definition twice, selecting
C or Tower accounting and using link-only accounting stubs. Both compiled
callers had an AMD64 REL32 relocation for the retirement call. Both probe
PEs imported `tower_vk_destroy_retired_image_v1` by name from
`tower_graphics.dll`. Draw reported these PE hashes:

- `56370b73faf082e151c302f7362c702b9b3f5475b57337c28514cbbfc87ac606`
- `482d2ed1790f7f6ae2e9c764772d20ee70d052fa553cf56708989981ec291e58`

A separate Draw probe using temporary Tower declarations also cross-linked
all seven image-lifecycle entries in one PE, SHA-256
`b46e5c7b4e8f970d4ab2f224b31504ce1f317988dcf75150ccad394fca744674`.
Rendering rechecked the released DLL export table. Ordinals 10–16 name
bound-view creation, image creation, format preflight, allocation planning,
memory allocation, zero-offset bind and retirement, respectively.

This Draw evidence covers static linking. Draw assigned shipping device
execution through ordinal 16 to slot 9 job
`feb0c2ae-4467-44d8-b331-d0e5bc425a5f` after allocation and bind job
`83bebca9-c966-43cc-851b-868708c7d4aa`. The Linux device qualification
of Draw's partial-owner cleanup has its own worker revision.

Ordinary Tower modules can import the seven image lifecycle entries by name.
The [two-module caller and standalone ELF/COFF build](osd_checks/tower_client/README.md)
use the declarations shared with the Win64 device example.

The four `frame_submit.h` functions also have a declarations-only Tower
import. Their Win64 names and ordinals are shared with the C callers.
[Application contract and build recipe](osd_checks/tower_client/README.md#calling-the-frame-and-upload-commands)
