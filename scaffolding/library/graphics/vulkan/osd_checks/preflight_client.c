#include "preflight_check.h"
#ifdef OSD_PREFLIGHT_PROVIDER_HEADER
#include OSD_PREFLIGHT_PROVIDER_HEADER
#else
/* Confirmed consumer declaration while the portable provider is in review. */
extern VkResult tower_vk_image_format_preflight_v1(VkPhysicalDevice, const VkImageCreateInfo *,
                                                   VkImageFormatProperties *, VkBool32 *);
#endif

VkResult osd_check_preflight(VkPhysicalDevice physical, const VkImageCreateInfo *info,
                             VkImageFormatProperties *properties, VkBool32 *supported) {
    return tower_vk_image_format_preflight_v1(physical, info, properties, supported);
}
