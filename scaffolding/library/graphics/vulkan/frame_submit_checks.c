#include "frame_submit.h"

/* Independent transport through the Vulkan-header ABI. */
VkResult frame_submit_from_c(VkQueue queue, const VkSubmitInfo *info, VkFence fence)
{
    return tower_vk_queue_submit_one_v1(queue, info, fence);
}

VkResult frame_end_from_c(VkSubmitInfo *out, const VkCommandBuffer *commands,
                          const VkSemaphore *wait, const VkPipelineStageFlags *stage,
                          const VkSemaphore *signal)
{
    return tower_vk_command_end_for_submit_v1(out, commands, wait, stage, signal);
}

/* Vulkan-header reference for recording transport and the raw GPU lane. */
VkResult frame_end_raw(VkSubmitInfo *out, const VkCommandBuffer *commands,
                       const VkSemaphore *wait, const VkPipelineStageFlags *stage,
                       const VkSemaphore *signal)
{
    VkResult result = vkEndCommandBuffer(commands[0]);
    if (result == VK_SUCCESS) {
        *out = (VkSubmitInfo){ .sType = VK_STRUCTURE_TYPE_SUBMIT_INFO,
                              .commandBufferCount = 1, .pCommandBuffers = commands,
                              .waitSemaphoreCount = wait != NULL, .pWaitSemaphores = wait,
                              .pWaitDstStageMask = stage, .signalSemaphoreCount = signal != NULL,
                              .pSignalSemaphores = signal };
    }
    return result;
}

/* Check every named member in the independent native layout. */
int frame_end_matches(const VkSubmitInfo *out, size_t size, const VkCommandBuffer *commands,
                      const VkSemaphore *wait, const VkPipelineStageFlags *stage,
                      const VkSemaphore *signal)
{
    return size == sizeof(*out) && out->sType == VK_STRUCTURE_TYPE_SUBMIT_INFO &&
        out->pNext == NULL && out->commandBufferCount == 1 && out->pCommandBuffers == commands &&
        out->waitSemaphoreCount == (uint32_t)(wait != NULL) && out->pWaitSemaphores == wait &&
        out->pWaitDstStageMask == stage && out->signalSemaphoreCount == (uint32_t)(signal != NULL) &&
        out->pSignalSemaphores == signal;
}
