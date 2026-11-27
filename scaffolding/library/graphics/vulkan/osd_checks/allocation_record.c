#include "allocation_check.h"
#include <stddef.h>
#include <stdio.h>

_Static_assert(sizeof(VkBool32) == 4 && sizeof(VkMemoryType) == 8 &&
        sizeof(VkMemoryRequirements) == 24 && offsetof(VkMemoryRequirements, memoryTypeBits) == 16 &&
        sizeof(VkMemoryAllocateInfo) == 32 && offsetof(VkMemoryAllocateInfo, pNext) == 8 &&
        offsetof(VkMemoryAllocateInfo, allocationSize) == 16 && offsetof(VkMemoryAllocateInfo, memoryTypeIndex) == 24,
        "Win64 SDK memory layout");

void osd_row(const char *name, VkBool32 status, const VkMemoryAllocateInfo *out) {
    printf("case=%s query=1 status=%u", name, status);
    if (status) printf(" sType=%d next=null size=%llu index=%u", out->sType,
            (unsigned long long)out->allocationSize, out->memoryTypeIndex);
    puts(" guards=intact");
}

#ifndef OSD_THREADED_SUITE
extern int record_suite(void);
int main(void) { return record_suite(); }
#endif
