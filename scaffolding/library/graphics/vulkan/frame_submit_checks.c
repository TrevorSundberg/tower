#include "frame_submit.h"

/* Independent transport through the Vulkan-header ABI. */
VkResult frame_submit_from_c(VkQueue queue, const VkSubmitInfo *info, VkFence fence)
{
    return tower_vk_queue_submit_one_v1(queue, info, fence);
}

VkResult frame_end_from_c(const VkCommandBuffer *command, VkSubmitInfo *info)
{
    return tower_vk_command_end_for_submit_v1(command, info);
}

/* Vulkan-header reference for recording transport and the raw GPU lane. */
VkResult frame_end_raw(const VkCommandBuffer *command, VkSubmitInfo *info)
{
    VkResult result = vkEndCommandBuffer(*command);
    if (result == VK_SUCCESS) {
        *info = (VkSubmitInfo){ .sType = VK_STRUCTURE_TYPE_SUBMIT_INFO,
                               .commandBufferCount = 1, .pCommandBuffers = command };
    }
    return result;
}

/* Check all members in the independent native layout. Padding is unspecified. */
int frame_end_matches(const VkSubmitInfo *info, size_t size, const VkCommandBuffer *command)
{
    return size == sizeof(*info) && info->sType == VK_STRUCTURE_TYPE_SUBMIT_INFO &&
        info->pNext == NULL && info->commandBufferCount == 1 && info->pCommandBuffers == command &&
        info->waitSemaphoreCount == 0 && info->pWaitSemaphores == NULL &&
        info->pWaitDstStageMask == NULL && info->signalSemaphoreCount == 0 && info->pSignalSemaphores == NULL;
}
