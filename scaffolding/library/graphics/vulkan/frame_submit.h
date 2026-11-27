#ifndef TOWER_VULKAN_FRAME_SUBMIT_H
#define TOWER_VULKAN_FRAME_SUBMIT_H

#include <vulkan/vulkan.h>

#ifdef __cplusplus
extern "C" {
#endif

/* On VK_SUCCESS, info borrows command through submit. Fill optional semaphore
 * fields after return. On error every byte of info keeps its prior value. */
VkResult tower_vk_command_end_for_submit_v1(const VkCommandBuffer *command, VkSubmitInfo *info);

VkResult tower_vk_queue_submit_one_v1(VkQueue queue, const VkSubmitInfo *info, VkFence fence);

#ifdef __cplusplus
}
#endif
#endif
