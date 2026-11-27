#include "preflight_check.h"
#include <windows.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

extern int osd_format(VkPhysicalDevice, VkFormat, VkImageUsageFlags, uint32_t, uint32_t, uint32_t, uint32_t);
extern VkResult osd_fixture_create_image(VkDevice, const VkImageCreateInfo *, const VkAllocationCallbacks *, VkImage *);

/* The frozen, single-caller texture fixture calls format then create. Retain
 * the physical handle until the source's actual create descriptor is live. */
static VkPhysicalDevice pending;
int osd_preflight_format(VkPhysicalDevice physical, VkFormat format, VkImageUsageFlags usage,
                         uint32_t w, uint32_t h, uint32_t layers, uint32_t mips) {
    if (pending) exit(4);
    if (format == VK_FORMAT_R8G8B8A8_UNORM)
        return osd_format(physical, format, usage, w, h, layers, mips);
    VkFormatProperties features;
    vkGetPhysicalDeviceFormatProperties(physical, format, &features);
    VkFormatFeatureFlags required = VK_FORMAT_FEATURE_TRANSFER_SRC_BIT | VK_FORMAT_FEATURE_TRANSFER_DST_BIT |
                                    VK_FORMAT_FEATURE_SAMPLED_IMAGE_BIT;
    if ((features.optimalTilingFeatures & required) != required) return 0;
    pending = physical;
    return 1;
}

VkResult osd_preflight_create(VkDevice device, const VkImageCreateInfo *info,
                              const VkAllocationCallbacks *allocator, VkImage *out) {
    if (info->format == VK_FORMAT_R8G8B8A8_UNORM)
        return osd_fixture_create_image(device, info, allocator, out);
    VkPhysicalDevice physical = pending;
    pending = VK_NULL_HANDLE;
    if (!physical || allocator || *out) exit(4);
    VkImageCreateInfo probe;
    if (getenv("OSD_PREFLIGHT_ZERO_WIDTH")) {
        probe = *info;
        probe.extent.width = 0;
        info = &probe;
    }
    VkImageFormatProperties caps;
    VkBool32 supported;
    LARGE_INTEGER start, stop, hz;
    if (!QueryPerformanceFrequency(&hz) || !QueryPerformanceCounter(&start)) exit(4);
    VkResult result = osd_check_preflight(physical, info, &caps, &supported);
    if (!QueryPerformanceCounter(&stop)) exit(4);
    if (result != VK_SUCCESS) {
        fprintf(stderr, "query failed format=%d type=%d usage=%u result=%d\n",
                info->format, info->imageType, info->usage, result);
        exit(3);
    }
    printf("preflight physical=%p format=%d type=%d tiling=%d usage=%u flags=%u extent=%ux%ux%u mips=%u layers=%u "
           "samples=%u max=%ux%ux%u maxMips=%u maxLayers=%u sampleCounts=%u maxResourceSize=%llu "
           "supported=%u result=%d ticks=%lld hz=%lld\n", (void *)physical, info->format, info->imageType,
           info->tiling, info->usage, info->flags, info->extent.width, info->extent.height, info->extent.depth,
           info->mipLevels, info->arrayLayers, info->samples, caps.maxExtent.width, caps.maxExtent.height,
           caps.maxExtent.depth, caps.maxMipLevels, caps.maxArrayLayers, caps.sampleCounts,
           (unsigned long long)caps.maxResourceSize, supported, result, stop.QuadPart-start.QuadPart, hz.QuadPart);
    if (!supported) {
        fprintf(stderr, "unsupported format=%d extent=%ux%ux%u layers=%u mips=%u max=%ux%ux%u maxLayers=%u maxMips=%u\n",
                info->format, info->extent.width, info->extent.height, info->extent.depth, info->arrayLayers,
                info->mipLevels, caps.maxExtent.width, caps.maxExtent.height, caps.maxExtent.depth,
                caps.maxArrayLayers, caps.maxMipLevels);
        exit(3);
    }
    return osd_fixture_create_image(device, info, allocator, out);
}
