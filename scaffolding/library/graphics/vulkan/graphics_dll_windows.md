# Tower Vulkan library for Windows x64

`tower_graphics.dll` exports shader creation, counted indexed recording, reusable primary begin, end/prepare, staged buffer recording, blocking upload finish and asynchronous
one-descriptor queue submit. Link a Windows x64 C application with
`tower_graphics.lib` and put the matching DLL beside the executable.
Use the public headers for [shaders](shader_module_c.h), [submission](frame_submit.h), [counted recording](indexed_draw_c.h) and [buffer uploads](buffer_upload_record.h).
The application also links the Vulkan SDK import library for its own Vulkan
calls. At runtime the Tower DLL imports `vkCreateShaderModule`, `vkResetCommandBuffer`,
`vkBeginCommandBuffer`, `vkEndCommandBuffer`, `vkQueueSubmit`, `vkQueueWaitIdle`, `vkCmdCopyBuffer` and core `vkCmdPipelineBarrier2` from `vulkan-1.dll`.

## Build from a clean checkout

From the Tower root on Linux x86-64 with Bash, GNU coreutils and LLVM 19
(`llvm-dlltool` and `lld-link` on PATH), run:

```sh
scaffolding/library/graphics/vulkan/build_graphics_dll.sh "$PWD/out"
```

The entry verifies the checked-in bootstrap, compiles five Tower objects for
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
failure preservation and call order. Full Draw, displayed WSI and native
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
Draw assigned execution through its application to job `4c9c47bb`.
Physical Windows and displayed WSI coverage remain open.

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
