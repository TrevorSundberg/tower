#include "image_check.h"

/* Independent Vulkan SDK reference used only by the capture and ABI tests. */
VkResult osd_check_image(VkDevice device, const VkImageCreateInfo *info, VkImage *out) {
    VkImage image = VK_NULL_HANDLE;
    VkResult result = vkCreateImage(device, info, NULL, &image);
    if (result == VK_SUCCESS) *out = image;
    return result;
}
