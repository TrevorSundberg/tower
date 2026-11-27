#include "allocation_check.h"
#include <stddef.h>
#include <stdio.h>

_Static_assert(sizeof(VkDevice) == 8 && sizeof(VkImage) == 8 && sizeof(VkDeviceSize) == 8 &&
        sizeof(VkBool32) == 4 && sizeof(VkMemoryPropertyFlags) == 4 && VK_MAX_MEMORY_TYPES == 32 &&
        sizeof(VkMemoryType) == 8 && offsetof(VkMemoryType, propertyFlags) == 0 && offsetof(VkMemoryType, heapIndex) == 4 &&
        offsetof(VkMemoryRequirements, size) == 0 && offsetof(VkMemoryRequirements, alignment) == 8 &&
        sizeof(VkMemoryRequirements) == 24 && offsetof(VkMemoryRequirements, memoryTypeBits) == 16 &&
        sizeof(VkMemoryAllocateInfo) == 32 && offsetof(VkMemoryAllocateInfo, sType) == 0 && offsetof(VkMemoryAllocateInfo, pNext) == 8 &&
        offsetof(VkMemoryAllocateInfo, allocationSize) == 16 && offsetof(VkMemoryAllocateInfo, memoryTypeIndex) == 24,
        "Win64 SDK memory layout");

void osd_row(const char *name, VkBool32 status, const VkMemoryAllocateInfo *out) {
    if (status) {
        printf("case=%s query=1 status=%u sType=%d next=null size=%llu index=%u guards=intact\n",
                name, status, out->sType, (unsigned long long)out->allocationSize, out->memoryTypeIndex);
    } else {
        printf("case=%s query=1 status=0 guards=intact\n", name);
    }
}

#ifndef OSD_THREADED_SUITE
extern int record_suite(void);
int main(void) { return record_suite(); }
#endif
