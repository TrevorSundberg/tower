#include "frame_submit.h"

/* Independent transport through the Vulkan-header ABI. */
VkResult frame_submit_from_c(VkQueue queue, const VkSubmitInfo *info, VkFence fence)
{
    return tower_vk_queue_submit_one_v1(queue, info, fence);
}
