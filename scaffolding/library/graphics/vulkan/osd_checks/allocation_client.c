#include "allocation_check.h"
#ifdef OSD_ALLOCATION_PROVIDER_HEADER
#include OSD_ALLOCATION_PROVIDER_HEADER
#endif
/* A conflicting provider declaration is a compile error. */
extern OsdAllocationPlan tower_vk_plan_image_allocation_v1;

VkBool32 osd_check_allocation(VkDevice device, VkImage image, const VkMemoryType *types,
        uint32_t count, VkMemoryPropertyFlags required, VkMemoryAllocateInfo *out) {
    return tower_vk_plan_image_allocation_v1(device, image, types, count, required, out);
}
