/* Independent SDK control for Draw's confirmed image_create_checked predicate. */
#include "../image_format_preflight.h"

VkResult fixture_preflight(VkPhysicalDevice physical, const VkImageCreateInfo *info,
    VkImageFormatProperties *properties, VkBool32 *supported)
{
#ifdef EXTERNAL_TOWER
    return tower_vk_image_format_preflight_v1(physical, info, properties, supported);
#else
    VkImageFormatProperties p;
    VkResult result = vkGetPhysicalDeviceImageFormatProperties(physical, info->format,
        info->imageType, info->tiling, info->usage, info->flags, &p);
    if (result != VK_SUCCESS)
        return result;
    *properties = p;
    *supported = VK_FALSE;
    if (!info->extent.width || !info->extent.height || !info->extent.depth ||
        !info->mipLevels || !info->arrayLayers)
        return VK_SUCCESS;
    if (info->extent.width > p.maxExtent.width || info->extent.height > p.maxExtent.height ||
        info->extent.depth > p.maxExtent.depth || info->mipLevels > p.maxMipLevels ||
        info->arrayLayers > p.maxArrayLayers || !(info->samples & p.sampleCounts))
        return VK_SUCCESS;
    *supported = VK_TRUE;
    return VK_SUCCESS;
#endif
}
