#ifndef TOWER_VULKAN_FRAME_SUBMIT_H
#define TOWER_VULKAN_FRAME_SUBMIT_H

#include <vulkan/vulkan.h>

#ifdef __cplusplus
extern "C" {
#endif

enum { TOWER_VK_COMMAND_STEP_OK = 0, TOWER_VK_COMMAND_STEP_RESET = 1, TOWER_VK_COMMAND_STEP_BEGIN = 2 };

/* Borrow an externally synchronized non-pending primary from a RESET_COMMAND_BUFFER pool.
 * failed_step is a required writable slot. Both flag words belong to the caller. */
VkResult tower_vk_command_reset_begin_v1(VkCommandBuffer command, VkCommandBufferResetFlags reset_flags,
    VkCommandBufferUsageFlags usage, uint32_t *failed_step);

/* On success out borrows the supplied slots through the later queue submit.
 * Any failed end leaves every destination byte untouched. */
VkResult tower_vk_command_end_for_submit_v1(VkSubmitInfo *out, const VkCommandBuffer *commands,
    const VkSemaphore *wait, const VkPipelineStageFlags *stage, const VkSemaphore *signal);

VkResult tower_vk_queue_submit_one_v1(VkQueue queue, const VkSubmitInfo *info, VkFence fence);

#ifdef __cplusplus
}
#endif
#endif
