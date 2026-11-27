#include "../image_allocation_plan.h"
#include <inttypes.h>
#include <stdio.h>
#include <string.h>

extern VkBool32 osd_plan(VkDevice, VkImage, const VkMemoryType *, uint32_t,
                         VkMemoryPropertyFlags, VkMemoryAllocateInfo *);
static _Thread_local struct {
    VkDevice device;
    VkImage image;
    VkMemoryRequirements requirements;
    unsigned queries, bad_handles, allocations, binds;
} record;

VKAPI_ATTR void VKAPI_CALL vkGetImageMemoryRequirements(VkDevice device, VkImage image,
                                                        VkMemoryRequirements *req) {
    ++record.queries;
    record.bad_handles += device != record.device || image != record.image;
    *req = record.requirements;
}

VKAPI_ATTR VkResult VKAPI_CALL vkAllocateMemory(VkDevice d, const VkMemoryAllocateInfo *a,
        const VkAllocationCallbacks *cb, VkDeviceMemory *m) {
    (void)d; (void)a; (void)cb; (void)m;
    ++record.allocations;
    return VK_ERROR_OUT_OF_DEVICE_MEMORY;
}

VKAPI_ATTR VkResult VKAPI_CALL vkBindImageMemory(VkDevice d, VkImage i, VkDeviceMemory m, VkDeviceSize o) {
    (void)d; (void)i; (void)m; (void)o;
    ++record.binds;
    return VK_ERROR_OUT_OF_DEVICE_MEMORY;
}

int osd_check_plan(const char *name, uint32_t mask, uint32_t count, VkMemoryPropertyFlags required,
        VkMemoryPropertyFlags low, VkMemoryPropertyFlags high, VkDeviceSize size, int expected, int verbose) {
    struct {
        uint64_t before;
        VkMemoryType types[VK_MAX_MEMORY_TYPES];
        uint64_t after;
    } table = {.before = 19, .after = 67};
    table.types[0] = (VkMemoryType){low, 3};
    table.types[31] = (VkMemoryType){high, 1};
    struct {
        uint64_t before;
        VkMemoryAllocateInfo out;
        uint64_t after;
    } slot;
    memset(&slot, 0xa5, sizeof slot);
    unsigned char frozen_table[sizeof table], frozen_slot[sizeof slot];
    memcpy(frozen_table, &table, sizeof table);
    memcpy(frozen_slot, &slot, sizeof slot);

    memset(&record, 0, sizeof record);
    record.device = (VkDevice)(void *)&table;
    record.image = (VkImage)(void *)&slot;
    record.requirements = (VkMemoryRequirements){size, 512, mask};
    VkBool32 result = osd_plan(record.device, record.image, table.types, count, required, &slot.out);
    int table_ok = !memcmp(&table, frozen_table, sizeof table);
    int unchanged = !memcmp(&slot, frozen_slot, sizeof slot);
    int guards = slot.before == UINT64_C(0xa5a5a5a5a5a5a5a5) && slot.after == slot.before;
    int ok = table_ok && guards && record.queries == 1 && !record.bad_handles && !record.allocations &&
        !record.binds && (expected < 0 ? result == VK_FALSE && unchanged :
        result == VK_TRUE && slot.out.sType == VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO &&
        !slot.out.pNext && slot.out.memoryTypeIndex == (uint32_t)expected && slot.out.allocationSize == size);
    if (verbose || !ok)
        printf("%s mask=%08x count=%u required=%x flags0=%x flags31=%x req_size=%" PRIu64
               " result=%u index=%u bytes=%" PRIu64 " queries=%u bad_handles=%u allocate=%u bind=%u"
               " table=%d guards=%d unchanged=%d ok=%d\n", name, mask, count, required, low, high, size,
               result, slot.out.memoryTypeIndex, slot.out.allocationSize, record.queries, record.bad_handles,
               record.allocations, record.binds, table_ok, guards, unchanged, ok);
    return ok;
}
