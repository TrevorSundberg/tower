#include "allocation_check.h"
#ifdef OSD_ALLOCATION_PROVIDER_HEADER
#include OSD_ALLOCATION_PROVIDER_HEADER
#else
#include "../image_allocation_plan.h"
#endif
_Static_assert(_Generic(&tower_vk_plan_image_allocation_v1, OsdAllocationPlan *: 1, default: 0),
        "public planner signature must match the Vulkan SDK caller");

VkBool32 osd_check_allocation(VkDevice device, VkImage image, const VkMemoryType *types,
        uint32_t count, VkMemoryPropertyFlags required, VkMemoryAllocateInfo *out) {
    return tower_vk_plan_image_allocation_v1(device, image, types, count, required, out);
}
