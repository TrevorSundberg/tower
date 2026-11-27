# Ending one primary command buffer for a later submit

The Linux x86-64 library exposes the end of Draw's
`command_end_for_submit` operation at `draw.c:1862`, used by
`render_frame` at `draw.c:6898` in Draw
`30b66f597b33c6f88964779f0ab1b87e847dc839`. The Tower source base is
`08a30b04956d0443c74ee9a3dbbc1acbeff23ba6`. Build `command_end.tower`
as the library entry for both exports. Include `frame_submit.h` in C.

```c
VkResult tower_vk_command_end_for_submit_v1(const VkCommandBuffer *command,
                                           VkSubmitInfo *info);
```

Pass a readable, caller-owned slot holding a valid recording primary command
buffer and a distinct, writable, suitably aligned `VkSubmitInfo`. Provide the
host synchronization Vulkan requires for recording. The function reads the
slot, calls `vkEndCommandBuffer(*command)` once and returns its signed result.
On `VK_SUCCESS` it replaces every named field of `*info` as follows.

| Field | Value after successful end |
| --- | --- |
| `sType`, `pNext` | `VK_STRUCTURE_TYPE_SUBMIT_INFO`, NULL |
| `commandBufferCount`, `pCommandBuffers` | 1, the exact input slot address |
| `waitSemaphoreCount`, `pWaitSemaphores`, `pWaitDstStageMask` | 0, NULL, NULL |
| `signalSemaphoreCount`, `pSignalSemaphores` | 0, NULL |

Padding has no success-value contract. On every non-success result the output
retains all its original bytes, including padding. Propagate the error and
stop before submit. The operation never writes the command handle slot.

The descriptor, slot, and any arrays or extensions the caller attaches must
remain live and stable until the later queue-submit call returns. Keep the
submitted Vulkan objects live until their respective uses retire. Completion
and presentation semaphore reuse follow the existing queue and image lifetime
rules. [Asynchronous submission and frame ownership](frame_submit_v1.md)

## Calling from C

This example uses the frame owner's command slot and adds its binary semaphore
configuration after end. The stage and handle slots are valid through the later
submit. Offscreen callers omit the optional fields.

```c
#include "frame_submit.h"

VkResult finish_frame(VkQueue queue, const VkCommandBuffer *primary, VkFence fence,
                      const VkSemaphore *acquired, const VkSemaphore *present_ready)
{
    VkSubmitInfo info;
    VkResult result = tower_vk_command_end_for_submit_v1(primary, &info);
    if (result != VK_SUCCESS)
        return result;

    VkPipelineStageFlags stage = VK_PIPELINE_STAGE_ALL_COMMANDS_BIT;
    if (acquired) { /* Display caller supplies both binary semaphore slots. */
        info.waitSemaphoreCount = 1;
        info.pWaitSemaphores = acquired;
        info.pWaitDstStageMask = &stage;
        info.signalSemaphoreCount = 1;
        info.pSignalSemaphores = present_ready;
    }
    return tower_vk_queue_submit_one_v1(queue, &info, fence);
}
```

The worker mapped Draw's successful end to an empty one-primary descriptor.
The exact Draw-local signature, field-fill order and failure-destination
behavior await the Draw-side source comparison. An adapter whose caller
preloads optional fields must preserve those inputs separately and attach
them after success. Draw's ordinary fence reset stays before recording. Its
guarded-clear reset stays between successful end and queue submit.

## Shaderless and counted Tower callers

The frame owner allocates `cmd` and `submit`. Its recording helper borrows
`&cmd` and `&submit`, records through `*command`, and finishes with
`tower_vk_command_end_for_submit_v1(command, submit)`. After that returns,
the owner creates the fence and passes `&submit` to
`vk_submit_prepared_and_wait`. Only a successful fence wait permits mapping.
The command-only entry `vk_submit_and_wait` still accepts an already
executable command. Both entries use the same queue submit and retirement
implementation. [Synchronous failure handling, staging visibility and CPU oracle](readback_v1.md)

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
| Recording loader | Native C raw, separately linked Tower, and Vulkan-header C through the shared object each returned success and signed −4 from one end call. The C layout check inspected every success field. Failure preserved the byte sentinel. A later, separate submit observed the original slot and optional binary handles and stage. |
| Offscreen, direct base and integrated callers | On the discrete RTX 3090, 10de:2204, NVIDIA 565.57.01, Vulkan 1.3.289, each command ended once and was the single primary submitted. Each wait observed the submission fence signaled. Khronos synchronization validation reported zero warnings/errors. |
| Readback | All four shaderless and count-zero pixels were `112233ff`. Count one returned four `4080bfff` pixels. Each complete 32-byte caller allocation matched the reference, including the `a5` guards and padding around the loan at offset 4, span 24, pitch 12. Both 24-byte count/indirect records matched. |
| Binary semaphores | Raw and shared end/submit lanes returned with the subject fence pending. Host release of the timeline gate allowed the subject and binary consumer fences to signal. Both observed the GPU event and zero validation warnings/errors. |
| Injected failures | In both ordinary callers, end −4 exited 1 before fence creation or submit. Submit OOM exited 1. Injected wait failure after a real submit drained the queue and exited 1 without mapping. Synthetic terminal drain failure aborted with resources live (134). The standalone synchronous matrix exited 0 and its terminal control 134. |

Draw linked against this library, displayed WSI, real device loss, other ABIs
and noncoherent visibility remain open. Hardware timings in the journal cover
independent offscreen processes after byte validation. This fixture has no
measured frame loop.
