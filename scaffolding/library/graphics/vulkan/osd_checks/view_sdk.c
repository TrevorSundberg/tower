#include "view_check.h"

/* Independent SDK control, linked only into the test executable. */
VkResult osd_check_view(VkDevice device, VkImage image, VkImageViewType type,
    VkFormat format, const VkImageSubresourceRange *range, VkImageView *out) {
    VkImageViewCreateInfo info = {
        .sType = VK_STRUCTURE_TYPE_IMAGE_VIEW_CREATE_INFO,
        .image = image, .viewType = type, .format = format,
        .components = {VK_COMPONENT_SWIZZLE_IDENTITY, VK_COMPONENT_SWIZZLE_IDENTITY,
                       VK_COMPONENT_SWIZZLE_IDENTITY, VK_COMPONENT_SWIZZLE_IDENTITY},
        .subresourceRange = *range
    };
    VkImageView view = VK_NULL_HANDLE;
    VkResult result = vkCreateImageView(device, &info, NULL, &view);
    if (result == VK_SUCCESS) *out = view;
    return result;
}
