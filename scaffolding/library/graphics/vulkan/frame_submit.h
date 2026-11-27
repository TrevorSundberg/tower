#ifndef TOWER_VULKAN_FRAME_SUBMIT_H
#define TOWER_VULKAN_FRAME_SUBMIT_H

#include <vulkan/vulkan.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Reset a non-pending primary with flags zero, then begin ONE_TIME_SUBMIT recording.
 * The caller externally synchronizes the buffer and its RESET_COMMAND_BUFFER pool. */
VkResult tower_vk_command_begin_v1(VkCommandBuffer cmd);

/* End one recording primary, submit without a fence, then wait for queue idle.
 * Borrow both handles under caller synchronization. On a failed wait, keep the
 * pool, primary and referenced resources live until retirement is established. */
VkResult tower_vk_command_finish_v1(VkQueue queue, VkCommandBuffer cmd);

/* On success out borrows the supplied slots through the later queue submit.
 * Any failed end leaves every destination byte untouched. */
VkResult tower_vk_command_end_for_submit_v1(VkSubmitInfo *out, const VkCommandBuffer *commands,
    const VkSemaphore *wait, const VkPipelineStageFlags *stage, const VkSemaphore *signal);

VkResult tower_vk_queue_submit_one_v1(VkQueue queue, const VkSubmitInfo *info, VkFence fence);

#ifdef __cplusplus
}
#endif
#endif
