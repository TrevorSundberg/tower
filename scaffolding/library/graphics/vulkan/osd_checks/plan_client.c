#include "../image_allocation_plan.h"

/* Link the same SDK call site into the recorder and the hardware fixture. */
VkBool32 osd_plan(VkDevice device, VkImage image, const VkMemoryType *types,
                  uint32_t count, VkMemoryPropertyFlags required, VkMemoryAllocateInfo *out) {
#ifdef OSD_RAW_SDK
    VkMemoryRequirements req;
    vkGetImageMemoryRequirements(device, image, &req);
    uint32_t allowed = req.memoryTypeBits;
    for (uint32_t i = 0; i < count; ++i, allowed >>= 1) {
        if ((allowed & 1u) && !(required & ~types[i].propertyFlags)) {
            *out = (VkMemoryAllocateInfo){VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO, NULL, req.size, i};
            return VK_TRUE;
        }
    }
    return VK_FALSE;
#else
    return tower_vk_plan_image_allocation_v1(device, image, types, count, required, out);
#endif
}
