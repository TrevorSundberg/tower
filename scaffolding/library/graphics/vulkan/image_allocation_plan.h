#ifndef TOWER_VULKAN_IMAGE_ALLOCATION_PLAN_H
#define TOWER_VULKAN_IMAGE_ALLOCATION_PLAN_H
#include <vulkan/vulkan.h>
#ifdef __cplusplus
extern "C" {
#endif

/* Borrow the device, its newly created unbound image and count readable types
 * from its physical device (count <= VK_MAX_MEMORY_TYPES). Query once.
 * On the lowest compatible type, write the separate allocation info and
 * return VK_TRUE. VK_FALSE preserves every output byte. */
VkBool32 tower_vk_plan_image_allocation_v1(
    VkDevice device, VkImage created, const VkMemoryType *types,
    uint32_t count, VkMemoryPropertyFlags required, VkMemoryAllocateInfo *out);

#ifdef __cplusplus
}
#endif
#endif
