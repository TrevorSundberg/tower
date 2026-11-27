#include "image_check.h"

#include "../create_image.h"

VkResult osd_check_image(VkDevice device, const VkImageCreateInfo *info, VkImage *out) {
    return tower_vk_create_image_v1(device, info, out);
}
