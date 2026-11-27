#ifndef TOWER_VULKAN_FRAME_SUBMIT_H
#define TOWER_VULKAN_FRAME_SUBMIT_H

#include <vulkan/vulkan.h>

#ifdef __cplusplus
extern "C" {
#endif

/* On success out borrows the supplied slots through the later queue submit.
 * Any failed end leaves every destination byte untouched. */
VkResult tower_vk_command_end_for_submit_v1(VkSubmitInfo *out, const VkCommandBuffer *commands,
    const VkSemaphore *wait, const VkPipelineStageFlags *stage, const VkSemaphore *signal);

VkResult tower_vk_queue_submit_one_v1(VkQueue queue, const VkSubmitInfo *info, VkFence fence);

#ifdef __cplusplus
}
#endif
#endif
