#ifndef TOWER_VULKAN_BOUND_IMAGE_VIEW_H
#define TOWER_VULKAN_BOUND_IMAGE_VIEW_H
#include <vulkan/vulkan.h>
#ifdef __cplusplus
extern "C" {
#endif

/* The caller owns a live device and a bound image compatible with the type,
 * format and borrowed range. Supply a separate writable, initially null slot.
 * VK_SUCCESS transfers the view to the caller. Every other result preserves
 * the slot. After last use, destroy the view on device with a NULL allocator
 * before destroying the image and freeing its memory. */
VkResult tower_vk_create_bound_image_view_v1(VkDevice device, VkImage image,
    VkImageViewType view_type, VkFormat format, const VkImageSubresourceRange *range,
    VkImageView *out);

#ifdef __cplusplus
}
#endif
#endif
