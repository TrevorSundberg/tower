#include "image_check.h"
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static _Thread_local PFN_vkCreateImage observer;
void osd_observe_image(PFN_vkCreateImage callback) { observer = callback; }

VKAPI_ATTR VkResult VKAPI_CALL vkCreateImage(VkDevice device, const VkImageCreateInfo *info,
        const VkAllocationCallbacks *allocator, VkImage *slot) {
    if (observer) return observer(device, info, allocator, slot);
    /* Failure probe through the ordinary five-shape PE. All other Vulkan
     * symbols in this recording-only loader forward to Wine. */
    const char *fault = getenv("OSD_IMAGE_FAULT");
    if (!fault || strcmp(fault, "first") || !device || !info || allocator || !slot || *slot ||
            info->format != VK_FORMAT_R8_UNORM || info->arrayLayers != 6) {
        fputs("unexpected call to image recording loader\n", stderr);
        exit(4);
    }
    *slot = (VkImage)(uintptr_t)0xfeed1234;
    puts("first source driver slot clobbered; returning VK_ERROR_OUT_OF_DEVICE_MEMORY");
    return VK_ERROR_OUT_OF_DEVICE_MEMORY;
}
