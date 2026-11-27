# Ending one primary command buffer for a later submit

The Linux x86-64 library exposes the end of Draw's
`command_end_for_submit` operation at `draw.c:1862`, used by
`render_frame` at `draw.c:6898` in Draw
`30b66f597b33c6f88964779f0ab1b87e847dc839`. The Tower source base is
`08a30b04956d0443c74ee9a3dbbc1acbeff23ba6`. Build `command_end.tower`
as the library entry for both exports. Include `frame_submit.h` in C.

```c
VkResult tower_vk_command_end_for_submit_v1(VkSubmitInfo *out, const VkCommandBuffer *commands,
    const VkSemaphore *wait, const VkPipelineStageFlags *stage, const VkSemaphore *signal);
```

Pass the caller's slot holding a valid recording primary command buffer, a
distinct writable `VkSubmitInfo`, and the optional slots described below.
Provide Vulkan's required external synchronization. The function calls
`vkEndCommandBuffer(commands[0])` exactly once, before accessing the
destination. It returns the signed result unchanged. On `VK_SUCCESS` it
initializes every named field.

| Field | Value on success |
| --- | --- |
| `sType`, `pNext` | `VK_STRUCTURE_TYPE_SUBMIT_INFO`, NULL |
| `commandBufferCount`, `pCommandBuffers` | 1, `commands` |
| `waitSemaphoreCount`, `pWaitSemaphores` | 1 if `wait != NULL`, otherwise 0. The pointer is `wait`. |
| `pWaitDstStageMask` | `stage`, independent of the wait count |
| `signalSemaphoreCount`, `pSignalSemaphores` | 1 if `signal != NULL`, otherwise 0. The pointer is `signal`. |

The caller may pass uninitialized output. Every non-success result leaves
all its bytes untouched, including padding. Success has no padding-value
contract. The operation borrows the input slots. Keep their addresses and
values stable across intervening host work until the later submit returns.
Keep the Vulkan objects live until their device uses retire. The fence
belongs to that later submit. [Queue and presentation lifetimes](frame_submit_v1.md)

## Calling from C

Draw supplies the address of its persistent primary command handle. Its
display caller uses the acquired semaphore slot, a local ALL_COMMANDS
stage mask (0x10000), and the present-ready slot indexed by the acquired
image. Both offscreen paths supply three null pointers. This example
keeps all slots live while the caller profiles and submits.

```c
#include "frame_submit.h"

VkResult finish_frame(VkQueue queue, const VkCommandBuffer *commands, VkFence fence,
                      const VkSemaphore *acquired, const VkSemaphore *present_ready,
                      void (*profile)(void))
{
    VkSubmitInfo info;
    VkPipelineStageFlags stage = VK_PIPELINE_STAGE_ALL_COMMANDS_BIT;
    VkResult result = tower_vk_command_end_for_submit_v1(&info, commands,
        acquired, acquired ? &stage : NULL, present_ready);
    if (result != VK_SUCCESS)
        return result;
    profile();
    return tower_vk_queue_submit_one_v1(queue, &info, fence);
}
```

Draw resets its render fence before command recording. Its guarded-clear
path resets the fence between successful prepare and submit. Draw reported
31 CPU cases in each of two configurations against the earlier submit
object. Draw assigned the linked Vulkan 1.4 frame test to slot 10. The
observations below cover the five-argument end export on Tower host 12.

### Link both entries on Linux x86-64

From the Tower repository root, build the end entry with its imported submit
entry. Set `vulkan_loader` to the SDK's absolute path to `libvulkan.so.1`.

```sh
v=scaffolding/library/graphics/vulkan
bootstrap/linux-x64/towerc "$v/command_end.tower" --library --jobs 1 -o frame_submit.o
x86_64-linux-gnu-ld -shared -z defs frame_submit.o "${vulkan_loader:?}" \
    -soname libtower_frame_submit.so -o libtower_frame_submit.so
```

Include `frame_submit.h` in the application and link the resulting object
once with the Vulkan loader, or link the shared library. The same object
provides both public functions. The five-argument header and binary must
match. With the Linux bootstrap SHA-256
`7430bdb39f73b285687fedb2945d370eaf51d2cc2fa289e5e0041cc15ad1b896`,
the host 12 object was 1,240 bytes and hashed to
`e6cb394beffaf44bce041603f58af6c29bf934e0edd8d408d56cd16857a9c5d1`.
The shared library hashed to
`8e50d661fdd73ccf243fa09800a79bc171d777500a3dbf997c5858b0d12662bd`.

## Shaderless and counted Tower callers

The frame owner allocates `cmd` and `submit` and lends their addresses to
the recording helper. The helper finishes with
`tower_vk_command_end_for_submit_v1(submit, command, null, null, null)`.
After return the owner creates its fence and passes `&submit` to
`vk_submit_prepared_and_wait`. The command-only entry for already executable
buffers uses the same retirement policy. Only a successful fence wait permits
mapping. [Synchronous failure handling, staging visibility and CPU oracle](readback_v1.md)

## Reproduction and observations

Receipt `74b8d178-60a7-4834-84b5-195e888fe18d` contains the header,
objects, executable hashes, SDK inputs, link maps, and local replay scripts.
With the receipt extracted and the prior complete checkout and host SDK
available, run from the receipt directory:

```bash
REPLAY=$(mktemp -d) LOCAL_TOWER=/tmp/frame-1c0e/src bash replay.sh
```

The replay runs the following positive entries. It compares full stdout from
the ordinary GPU processes and all decoded byte captures to the verified prior
receipt. The gated fixture checks both fences and its GPU event internally.

```bash
./recording
./readback_fixture 0
./counted_fixture counted-core13 shaders/produce.comp.spv shaders/triangle.vert.spv shaders/color.frag.spv
timeout -k 2 15 ./gate raw
timeout -k 2 15 ./gate shared
```

| Host 12 check | Observed result |
| --- | --- |
| Recording loader | Native C raw, separately linked Tower, and Vulkan-header C through the shared object each returned success and signed −4 from one end call. Each lane covered all eight wait, signal and later-fence combinations on success and failure, plus a stage with zero waits. The stub saw intact guarded output at end entry. Failure produced only the end event. On success the C layout check examined every field, then a profiling clock call preceded separate submit with the original slots. |
| Offscreen, direct base and integrated callers | On the discrete RTX 3090, 10de:2204, NVIDIA 565.57.01, Vulkan 1.3.289, each command ended once and was the single primary submitted. Each wait observed the submission fence signaled. Khronos synchronization validation reported zero warnings/errors. |
| Readback | All four shaderless and count-zero pixels were `112233ff`. Count one returned four `4080bfff` pixels. Each complete 32-byte caller allocation matched the reference, including the `a5` guards and padding around the loan at offset 4, span 24, pitch 12. Both 24-byte count/indirect records matched. |
| Binary semaphores | Raw and shared end/submit lanes returned with the subject fence pending. Host release of the timeline gate allowed the subject and binary consumer fences to signal. Both observed the GPU event and zero validation warnings/errors. |
| Injected failures | In both ordinary callers, end −4 exited 1 before fence creation or submit. Submit OOM exited 1. Injected wait failure after a real submit drained the queue and exited 1 without mapping. Synthetic terminal drain failure aborted with resources live (134). The standalone synchronous matrix exited 0 and its terminal control 134. |

Draw linked against this library, displayed WSI, real device loss, other ABIs
and noncoherent visibility remain open. Hardware timings in the journal cover
independent offscreen processes after byte validation. This fixture has no
measured frame loop.
