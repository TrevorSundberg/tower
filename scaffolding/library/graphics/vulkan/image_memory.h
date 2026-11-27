#ifndef TOWER_VULKAN_IMAGE_MEMORY_H
#define TOWER_VULKAN_IMAGE_MEMORY_H

#include <vulkan/vulkan.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Borrow info and its chain through the call. Supply a separate, initially
 * null out. Only VK_SUCCESS transfers the allocation to the caller. */
VkResult tower_vk_allocate_memory_v1(VkDevice device, const VkMemoryAllocateInfo *info, VkDeviceMemory *out);

/* Bind at offset zero. The caller owns image and memory through return. */
VkResult tower_vk_bind_image_memory_zero_v1(VkDevice device, VkImage image, VkDeviceMemory memory);

#ifdef __cplusplus
}
#endif
#endif
