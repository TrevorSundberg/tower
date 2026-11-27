/* SDK observation at the executable's loader boundary. The fixture is serial. */
#include "../image_allocation_plan.h"
#include <inttypes.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static struct {
    VkDevice device;
    VkImage image;
    const VkMemoryType *types;
    uint32_t count;
    VkMemoryPropertyFlags required;
    VkMemoryAllocateInfo *out;
    VkMemoryRequirements req;
    VkDeviceMemory memory;
    VkDeviceSize accounted;
    unsigned queries;
} source;

static void check(int condition, const char *message) {
    if (!condition) { fprintf(stderr, "source trace: %s\n", message); exit(3); }
}

void osd_watch(VkDevice device, VkImage image, const VkMemoryType *types, uint32_t count,
               VkMemoryPropertyFlags required, VkMemoryAllocateInfo *out) {
    check(!source.image && image && count <= VK_MAX_MEMORY_TYPES, "invalid source scope");
    source.device = device;
    source.image = image;
    source.types = types;
    source.count = count;
    source.required = required;
    source.out = out;
    printf("source device=%p image=%p count=%u required=%x\n", (void *)device, (void *)image, count, required);
    for (uint32_t i = 0; i < count; ++i)
        printf("type i=%u flags=%x heap=%u\n", i, types[i].propertyFlags, types[i].heapIndex);
}

extern VKAPI_ATTR void VKAPI_CALL __real_vkGetImageMemoryRequirements(VkDevice, VkImage, VkMemoryRequirements *);
void __wrap_vkGetImageMemoryRequirements(VkDevice device, VkImage image, VkMemoryRequirements *req) {
    __real_vkGetImageMemoryRequirements(device, image, req);
    if (!source.image) return;
    check(source.device == device && source.image == image, "requirements handles");
    ++source.queries;
    source.req = *req;
    printf("requirements image=%p bytes=%" PRIu64 " align=%" PRIu64 " mask=%08x\n",
           (void *)image, req->size, req->alignment, req->memoryTypeBits);
}

void osd_observe(VkBool32 result) {
    check(source.queries == 1, "query count");
    uint32_t i = 0;
    while (i < source.count && (!(source.req.memoryTypeBits & (UINT32_C(1) << i)) ||
           (source.types[i].propertyFlags & source.required) != source.required)) ++i;
    check(result == (i < source.count), "planner boolean");
    printf("plan image=%p bool=%u", (void *)source.image, result);
    if (result) {
        const VkMemoryAllocateInfo *p = source.out;
        check(!p->pNext && p->sType == VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO &&
              p->allocationSize == source.req.size && p->memoryTypeIndex == i, "allocation plan");
        printf(" info=%p index=%u bytes=%" PRIu64 " tag=%d next=%p",
               (void *)p, i, p->allocationSize, p->sType, p->pNext);
    }
    putchar('\n');
}

extern VkResult __real_vkAllocateMemory(VkDevice, const VkMemoryAllocateInfo *, const VkAllocationCallbacks *, VkDeviceMemory *);
VkResult __wrap_vkAllocateMemory(VkDevice d, const VkMemoryAllocateInfo *info, const VkAllocationCallbacks *cb, VkDeviceMemory *out) {
    if (!source.image) return __real_vkAllocateMemory(d, info, cb, out);
    check(d == source.device && info == source.out && !cb && !source.accounted, "allocation arguments");
    int inject = getenv("OSD_FAIL_PLAN_ALLOC") != NULL;
    VkResult r = inject ? VK_ERROR_OUT_OF_DEVICE_MEMORY : __real_vkAllocateMemory(d, info, cb, out);
    if (r == VK_SUCCESS) source.memory = *out;
    printf("allocate image=%p info=%p index=%u bytes=%" PRIu64 " injected=%d result=%d memory=%p accounted=%" PRIu64 "\n",
           (void *)source.image, (void *)info, info->memoryTypeIndex, info->allocationSize, inject,
           r, (void *)source.memory, source.accounted);
    return r;
}

void osd_account(VkDeviceSize bytes) {
    check(source.memory && bytes == source.req.size && !source.accounted, "accounting order");
    source.accounted = bytes;
}

extern VkResult __real_vkBindImageMemory(VkDevice, VkImage, VkDeviceMemory, VkDeviceSize);
VkResult __wrap_vkBindImageMemory(VkDevice d, VkImage image, VkDeviceMemory memory, VkDeviceSize offset) {
    if (!source.image) return __real_vkBindImageMemory(d, image, memory, offset);
    check(d == source.device && image == source.image && memory == source.memory &&
          source.accounted == source.req.size && !offset, "bind arguments or accounting");
    int inject = getenv("OSD_FAIL_PLAN_BIND") != NULL;
    VkResult r = inject ? VK_ERROR_OUT_OF_DEVICE_MEMORY : __real_vkBindImageMemory(d, image, memory, offset);
    printf("bind image=%p memory=%p offset=%" PRIu64 " injected=%d result=%d accounted=%" PRIu64 "\n",
           (void *)image, (void *)memory, offset, inject, r, source.accounted);
    return r;
}

void osd_end_watch(void) { memset(&source, 0, sizeof source); }
