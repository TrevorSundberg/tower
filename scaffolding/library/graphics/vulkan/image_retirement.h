#ifndef TOWER_VULKAN_IMAGE_RETIREMENT_H
#define TOWER_VULKAN_IMAGE_RETIREMENT_H

#include <vulkan/vulkan.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Consumes the supplied owned handles in view, image, memory order.
 * The creating device stays live. The caller must first complete all uses,
 * retire other dependent views and ensure the memory can be freed. */
void tower_vk_destroy_retired_image_v1(VkDevice device, VkImageView ownedView,
                                       VkImage ownedImage, VkDeviceMemory ownedMemory);

#ifdef __cplusplus
}
#endif
#endif
