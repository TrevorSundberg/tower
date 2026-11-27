#include "view_check.h"

#include "../bound_image_view.h"

typedef VkResult (*BoundView)(VkDevice, VkImage, VkImageViewType, VkFormat,
    const VkImageSubresourceRange *, VkImageView *);
_Static_assert(_Generic(&tower_vk_create_bound_image_view_v1, BoundView: 1, default: 0),
    "reviewed header must match the acknowledged bound view ABI");

VkResult osd_check_view(VkDevice device, VkImage image, VkImageViewType type,
    VkFormat format, const VkImageSubresourceRange *range, VkImageView *out) {
    return tower_vk_create_bound_image_view_v1(device, image, type, format, range, out);
}
