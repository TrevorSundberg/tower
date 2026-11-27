#include "image_check.h"

#ifdef OSD_IMAGE_PROVIDER_HEADER
#include OSD_IMAGE_PROVIDER_HEADER
#else
/* Draw 852d5de3, contract a6ddd459. Freeze the caller before provider delivery. */
extern VkResult tower_vk_create_image_v1(VkDevice, const VkImageCreateInfo *, VkImage *);
#endif

VkResult osd_check_image(VkDevice device, const VkImageCreateInfo *info, VkImage *out) {
    return tower_vk_create_image_v1(device, info, out);
}
