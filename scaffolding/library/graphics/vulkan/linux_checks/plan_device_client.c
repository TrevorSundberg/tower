/* SDK call sites for the retained Linux Tower owner. */
#include "../bound_image_view.h"
#include "../create_image.h"
#include "../image_format_preflight.h"

VkResult sdk_preflight(VkPhysicalDevice physical, const VkImageCreateInfo *info,
                       VkImageFormatProperties *limits, VkBool32 *supported) {
    return tower_vk_image_format_preflight_v1(physical, info, limits, supported);
}

VkResult sdk_create(VkDevice device, const VkImageCreateInfo *info, VkImage *image) {
    return tower_vk_create_image_v1(device, info, image);
}

VkResult sdk_view(VkDevice device, VkImage image, VkImageViewType type, VkFormat format,
                  const VkImageSubresourceRange *range, VkImageView *view) {
    return tower_vk_create_bound_image_view_v1(device, image, type, format, range, view);
}
