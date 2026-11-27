#include "image_check.h"
#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Only gpu.obj's vkCreateImage relocation is redirected. The readback atlas
 * stays on the original path. The source's actual descriptor and output come
 * from the frozen Tower caller. */
VKAPI_ATTR VkResult VKAPI_CALL osd_fixture_create_image(VkDevice device, const VkImageCreateInfo *info,
        const VkAllocationCallbacks *allocator, VkImage *out) {
    if (info->format == VK_FORMAT_R8G8B8A8_UNORM)
        return vkCreateImage(device, info, allocator, out);
    unsigned char snapshot[sizeof *info];
    memcpy(snapshot, info, sizeof snapshot);
    LARGE_INTEGER start, stop, frequency;
    if (allocator || *out || !QueryPerformanceFrequency(&frequency) || !QueryPerformanceCounter(&start)) {
        fputs("unexpected source input or unavailable counter\n", stderr);
        exit(3);
    }
    VkResult result = osd_check_image(device, info, out);
    if (!QueryPerformanceCounter(&stop) || memcmp(snapshot, info, sizeof snapshot) ||
            ((*out != VK_NULL_HANDLE) != (result == VK_SUCCESS))) {
        fputs("source image publication, descriptor or performance counter failed\n", stderr);
        exit(3);
    }
    printf("source_image device=%p image=%p type=%d format=%d extent=%ux%ux%u mips=%u layers=%u usage=%u result=%d ticks=%lld hz=%lld\n",
           (void *)device, (void *)*out, info->imageType, info->format, info->extent.width, info->extent.height,
           info->extent.depth, info->mipLevels, info->arrayLayers, info->usage, result,
           stop.QuadPart - start.QuadPart, frequency.QuadPart);
    return result;
}
