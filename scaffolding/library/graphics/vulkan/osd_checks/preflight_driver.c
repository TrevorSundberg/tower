#include "preflight_check.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static _Thread_local PFN_vkGetPhysicalDeviceImageFormatProperties observer;
void osd_observe_query(PFN_vkGetPhysicalDeviceImageFormatProperties callback) { observer = callback; }

VKAPI_ATTR VkResult VKAPI_CALL vkGetPhysicalDeviceImageFormatProperties(VkPhysicalDevice physical,
    VkFormat format, VkImageType type, VkImageTiling tiling, VkImageUsageFlags usage,
    VkImageCreateFlags flags, VkImageFormatProperties *caps) {
    if (observer) return observer(physical, format, type, tiling, usage, flags, caps);
    /* Full device PE, first sampled image. Other imports forward to Wine. */
    if (!physical || format != VK_FORMAT_R8_UNORM || type != VK_IMAGE_TYPE_2D ||
        tiling != VK_IMAGE_TILING_OPTIMAL || usage != (VK_IMAGE_USAGE_TRANSFER_SRC_BIT |
        VK_IMAGE_USAGE_TRANSFER_DST_BIT | VK_IMAGE_USAGE_SAMPLED_BIT) || flags || !caps) exit(4);
    memset(caps, 0xcd, sizeof *caps);
    puts("injected query=1 clobbered temporary result=-11");
    return VK_ERROR_FORMAT_NOT_SUPPORTED;
}
