#pragma once
#include <vulkan/vulkan.h>

/* The external C owner's two call sites. The SDK control writes directly
 * through out, just like the original Draw owner. */
typedef VkResult AllocateImageMemory(VkDevice, const VkMemoryAllocateInfo *, VkDeviceMemory *);
typedef VkResult BindImageMemory(VkDevice, VkImage, VkDeviceMemory);
AllocateImageMemory memory_allocate;
BindImageMemory memory_bind;

typedef struct {
    VkDeviceSize allocation_bytes, live, peak;
    unsigned count;
} MemoryAccount;

/* Fixture owns one sampled image at a time. Charge only a successful
 * allocation. Keep the charge across bind and reverse it after vkFreeMemory. */
static inline void memory_acquired(MemoryAccount *a, VkDeviceSize size) {
    a->allocation_bytes = size;
    a->live += size;
    if (a->live > a->peak) a->peak = a->live;
    ++a->count;
}
static inline void memory_released(MemoryAccount *a) {
    a->live -= a->allocation_bytes;
    --a->count;
    a->allocation_bytes = 0;
}
