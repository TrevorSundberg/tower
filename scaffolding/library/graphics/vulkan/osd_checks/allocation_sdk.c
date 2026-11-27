#include "allocation_check.h"

/* Independent SDK control for qualification only. */
VkBool32 osd_check_allocation(VkDevice device, VkImage image, const VkMemoryType *types,
        uint32_t count, VkMemoryPropertyFlags required, VkMemoryAllocateInfo *out) {
    VkMemoryRequirements req;
    vkGetImageMemoryRequirements(device, image, &req);
    for (uint32_t i = 0; i < count; ++i) {
        if ((req.memoryTypeBits & (UINT32_C(1) << i)) && (types[i].propertyFlags & required) == required) {
            *out = (VkMemoryAllocateInfo){.sType = VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO,
                    .allocationSize = req.size, .memoryTypeIndex = i};
            return VK_TRUE;
        }
    }
    return VK_FALSE;
}
