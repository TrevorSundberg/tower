#include "preflight_check.h"

/* Independent SDK control for the external C application. */
VkResult osd_check_preflight(VkPhysicalDevice physical, const VkImageCreateInfo *info,
                             VkImageFormatProperties *properties, VkBool32 *supported) {
    VkImageFormatProperties caps;
    VkResult result = vkGetPhysicalDeviceImageFormatProperties(physical, info->format, info->imageType,
        info->tiling, info->usage, info->flags, &caps);
    if (result != VK_SUCCESS) return result;
    *properties = caps;
    *supported = info->extent.width && info->extent.width <= caps.maxExtent.width &&
                 info->extent.height && info->extent.height <= caps.maxExtent.height &&
                 info->extent.depth && info->extent.depth <= caps.maxExtent.depth &&
                 info->mipLevels && info->mipLevels <= caps.maxMipLevels &&
                 info->arrayLayers && info->arrayLayers <= caps.maxArrayLayers &&
                 (info->samples & caps.sampleCounts);
    return VK_SUCCESS;
}
