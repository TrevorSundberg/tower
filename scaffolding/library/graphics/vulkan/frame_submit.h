#ifndef TOWER_VULKAN_FRAME_SUBMIT_H
#define TOWER_VULKAN_FRAME_SUBMIT_H

#include <vulkan/vulkan.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Reset a non-pending primary with flags zero, then begin ONE_TIME_SUBMIT recording.
 * The caller externally synchronizes the buffer and its RESET_COMMAND_BUFFER pool. */
VkResult tower_vk_command_begin_v1(VkCommandBuffer cmd);

/* On success out borrows the supplied slots through the later queue submit.
 * Any failed end leaves every destination byte untouched. */
VkResult tower_vk_command_end_for_submit_v1(VkSubmitInfo *out, const VkCommandBuffer *commands,
    const VkSemaphore *wait, const VkPipelineStageFlags *stage, const VkSemaphore *signal);

VkResult tower_vk_queue_submit_one_v1(VkQueue queue, const VkSubmitInfo *info, VkFence fence);

#ifdef __cplusplus
}
#endif
#endif
