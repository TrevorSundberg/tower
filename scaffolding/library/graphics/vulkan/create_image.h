#ifndef TOWER_VULKAN_CREATE_IMAGE_H
#define TOWER_VULKAN_CREATE_IMAGE_H
#include <vulkan/vulkan.h>
#ifdef __cplusplus
extern "C" {
#endif

/* Borrow info and its referenced storage through one vkCreateImage call on
 * device with a NULL allocator. Supply a separate, writable, initially null
 * out. VK_SUCCESS transfers the unbound image to the caller. Every other
 * result preserves out. The caller owns binding and eventual destruction. */
VkResult tower_vk_create_image_v1(VkDevice device, const VkImageCreateInfo *info, VkImage *out);

#ifdef __cplusplus
}
#endif
#endif
