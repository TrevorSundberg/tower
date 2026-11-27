/* Win64 SDK boundary for the retained serial ordinal-13 capture executable. */
#include "calls.h"
#include "../../image_allocation_plan.h"
#include <inttypes.h>
#include <stdio.h>
#include <stdlib.h>

static struct {
    VkDevice device;
    VkImage image;
    const VkMemoryAllocateInfo *plan;
    VkDeviceMemory memory;
    MemoryAccount account;
    unsigned retired;
} source;

static void require(int ok, const char *why) {
    if (!ok) { fprintf(stderr, "source image memory: %s\n", why); exit(3); }
}

VkBool32 memory_plan_source(VkDevice d, VkImage image, const VkMemoryType *types,
                            uint32_t count, VkMemoryPropertyFlags flags, VkMemoryAllocateInfo *out) {
    require(!source.image && !source.plan && !source.account.count && !source.account.live, "previous source live");
    VkBool32 ok = tower_vk_plan_image_allocation_v1(d, image, types, count, flags, out);
    if (ok) {
        source.device = d;
        source.image = image;
        source.plan = out;
    }
    return ok;
}

VkResult memory_allocate_source(VkDevice d, const VkMemoryAllocateInfo *info,
                                const VkAllocationCallbacks *cb, VkDeviceMemory *out) {
    if (!source.plan) return vkAllocateMemory(d, info, cb, out);
    require(info == source.plan && d == source.device && !cb && !*out, "allocation inputs");
    source.plan = NULL;
    VkResult result = memory_allocate(d, info, out);
    if (result == VK_SUCCESS) {
        require(*out != VK_NULL_HANDLE, "allocation returned null");
        source.memory = *out;
        memory_acquired(&source.account, info->allocationSize);
    }
    printf("memory allocate case=%u image=%p info=%p result=%d index=%u bytes=%" PRIu64
           " memory=%p live=%" PRIu64 " count=%u\n", source.retired, (void *)source.image,
           (void *)info, result, info->memoryTypeIndex, info->allocationSize, (void *)*out,
           source.account.live, source.account.count);
    return result;
}

VkResult memory_bind_source(VkDevice d, VkImage image, VkDeviceMemory memory, VkDeviceSize offset) {
    if (image != source.image) return vkBindImageMemory(d, image, memory, offset);
    require(d == source.device && source.memory == memory && offset == 0 && source.account.count == 1 &&
            source.account.live && source.account.live == source.account.allocation_bytes, "binding inputs/account");
    VkResult result = memory_bind(d, image, memory);
    printf("memory bind case=%u image=%p memory=%p result=%d offset=0 live=%" PRIu64
           " count=%u\n", source.retired, (void *)image, (void *)memory, result,
           source.account.live, source.account.count);
    return result;
}

void memory_free_source(VkDevice d, VkDeviceMemory memory, const VkAllocationCallbacks *cb) {
    vkFreeMemory(d, memory, cb);
    if (memory && memory == source.memory) {
        require(d == source.device && !cb && source.account.count == 1, "free inputs");
        memory_released(&source.account);
        printf("memory retired case=%u memory=%p live=%" PRIu64 " peak=%" PRIu64 " count=%u\n",
               source.retired++, (void *)memory, source.account.live, source.account.peak, source.account.count);
        source.memory = VK_NULL_HANDLE;
        source.image = VK_NULL_HANDLE;
    }
}
