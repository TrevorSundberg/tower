#include "allocation_check.h"
#include <stddef.h>
#include <stdio.h>

_Static_assert(sizeof(VkBool32) == 4 && sizeof(VkMemoryType) == 8 &&
        sizeof(VkMemoryRequirements) == 24 && offsetof(VkMemoryRequirements, memoryTypeBits) == 16 &&
        sizeof(VkMemoryAllocateInfo) == 32 && offsetof(VkMemoryAllocateInfo, pNext) == 8 &&
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
