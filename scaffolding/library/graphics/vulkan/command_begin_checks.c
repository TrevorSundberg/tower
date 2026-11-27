#include "frame_submit.h"

/* Independent Vulkan-header transport and scalar reference for the fixture. */
VkResult begin_from_c(VkCommandBuffer command, VkCommandBufferResetFlags flags,
                      VkCommandBufferUsageFlags usage, uint32_t *step)
{
    return tower_vk_command_reset_begin_v1(command, flags, usage, step);
}

VkResult begin_raw(VkCommandBuffer command, VkCommandBufferResetFlags flags,
                   VkCommandBufferUsageFlags usage, uint32_t *step)
{
    VkResult result = vkResetCommandBuffer(command, flags);
    if (result != VK_SUCCESS) {
        *step = TOWER_VK_COMMAND_STEP_RESET;
        return result;
    }
    VkCommandBufferBeginInfo info = { .sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_BEGIN_INFO,
                                      .flags = usage };
    result = vkBeginCommandBuffer(command, &info);
    *step = result == VK_SUCCESS ? TOWER_VK_COMMAND_STEP_OK : TOWER_VK_COMMAND_STEP_BEGIN;
    return result;
}

int begin_info_matches(const VkCommandBufferBeginInfo *info, size_t size,
                       VkCommandBufferUsageFlags usage)
{
    return size == sizeof(*info) && info->sType == VK_STRUCTURE_TYPE_COMMAND_BUFFER_BEGIN_INFO
        && info->pNext == NULL && info->flags == usage && info->pInheritanceInfo == NULL;
}
