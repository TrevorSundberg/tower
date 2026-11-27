#include "allocation_check.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static _Thread_local struct {
    VkDevice device;
    VkImage image;
    VkMemoryRequirements req;
    const VkMemoryAllocateInfo *public_out;
    unsigned char before[sizeof(VkMemoryAllocateInfo)];
    unsigned calls;
} recording;

void osd_begin_query(VkDevice device, VkImage image, const VkMemoryRequirements *req, const VkMemoryAllocateInfo *public_out) {
    recording.device = device;
    recording.image = image;
    recording.req = *req;
    recording.public_out = public_out;
    memcpy(recording.before, public_out, sizeof recording.before);
    recording.calls = 0;
}

uint32_t osd_query_count(void) { return recording.calls; }

VKAPI_ATTR void VKAPI_CALL vkGetImageMemoryRequirements(VkDevice device, VkImage image, VkMemoryRequirements *out) {
    if (++recording.calls != 1 || recording.device != device || recording.image != image || !out ||
            memcmp(recording.public_out, recording.before, sizeof recording.before)) {
        fputs("unexpected requirements query arguments or count\n", stderr);
        exit(4);
    }
    *out = recording.req;
}

VKAPI_ATTR VkResult VKAPI_CALL vkAllocateMemory(VkDevice device, const VkMemoryAllocateInfo *info,
        const VkAllocationCallbacks *allocator, VkDeviceMemory *out) {
    (void)device; (void)info; (void)allocator; (void)out;
    fputs("allocation inside plan\n", stderr);
    exit(4);
}

VKAPI_ATTR VkResult VKAPI_CALL vkBindImageMemory(VkDevice device, VkImage image, VkDeviceMemory memory, VkDeviceSize offset) {
    (void)device; (void)image; (void)memory; (void)offset;
    fputs("bind inside plan\n", stderr);
    exit(4);
}
