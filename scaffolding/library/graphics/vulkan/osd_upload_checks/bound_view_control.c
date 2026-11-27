#include "../bound_image_view.h"

/* Compile the same SDK caller twice to exercise the raw and linked ABI. */
VkResult fixture_bound_view(VkDevice device, VkImage image, VkImageViewType type,
                            VkFormat format, const VkImageSubresourceRange *range,
                            VkImageView *out)
{
#ifdef EXTERNAL_TOWER
    return tower_vk_create_bound_image_view_v1(device, image, type, format, range, out);
#else
    VkImageViewCreateInfo info = {
        .sType = VK_STRUCTURE_TYPE_IMAGE_VIEW_CREATE_INFO,
        .image = image, .viewType = type, .format = format, .subresourceRange = *range
    };
    VkImageView created = VK_NULL_HANDLE;
    VkResult result = vkCreateImageView(device, &info, NULL, &created);
    if (result == VK_SUCCESS)
        *out = created;
    return result;
#endif
}
