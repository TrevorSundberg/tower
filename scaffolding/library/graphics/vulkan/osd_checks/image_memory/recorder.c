/* SDK ABI recording endpoints. Loader forwarding allows the same checks for
 * calls from a separately linked DLL and for calls from the raw executable. */
#include "calls.h"
#include "../../image_allocation_plan.h"
#include <inttypes.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum Case { Small, Wide, AllocationError, Clobber, BindError };
static enum Case scenario;
static int linked;
static unsigned queries, allocs, binds, views, destroyed;
static VkDeviceSize size;
static VkMemoryAllocateInfo plan;
static VkMemoryDedicatedAllocateInfo dedicated;
static MemoryAccount account;
static struct { uint64_t left; VkDeviceMemory memory; uint64_t right; } slot;
static const uint64_t guard = UINT64_C(0x2e685cae9d17f043);
static const VkDevice device = (VkDevice)(uintptr_t)0x9870;
static const VkImage image = (VkImage)(uintptr_t)0x8765;
static const VkDeviceMemory acquired = (VkDeviceMemory)(uintptr_t)UINT64_C(0x1234567887654321);
static const VkDeviceMemory scribble = (VkDeviceMemory)(uintptr_t)UINT64_C(0xbadc0ffe1357abcd);

static void require(int ok, const char *why) {
    if (!ok) { fprintf(stderr, "recording mismatch: %s\n", why); exit(3); }
}

VKAPI_ATTR void VKAPI_CALL record_requirements(VkDevice d, VkImage i, VkMemoryRequirements *out) {
    require(d == device && i == image && ++queries == 1, "requirements identity/count");
    *out = (VkMemoryRequirements){size, 1024, UINT32_C(1) << 31};
}

VKAPI_ATTR VkResult VKAPI_CALL record_allocate(VkDevice d, const VkMemoryAllocateInfo *a,
        const VkAllocationCallbacks *cb, VkDeviceMemory *out) {
    require(++allocs == 1 && !binds && !views && queries == 1 && !account.count && !account.live,
            "allocate order/count");
    require(d == device && a == &plan && a->sType == VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO &&
            a->pNext == &dedicated && dedicated.sType == VK_STRUCTURE_TYPE_MEMORY_DEDICATED_ALLOCATE_INFO &&
            !dedicated.pNext && dedicated.image == image && !dedicated.buffer &&
            a->allocationSize == size && a->memoryTypeIndex == 31 && !cb, "allocate descriptor");
    require(out && !slot.memory && (out != &slot.memory) == linked, "public/private output identity");
    if (scenario == Clobber) *out = scribble;
    else if (scenario != AllocationError) *out = acquired;
    return scenario == AllocationError || scenario == Clobber ? VK_ERROR_OUT_OF_DEVICE_MEMORY : VK_SUCCESS;
}

VKAPI_ATTR VkResult VKAPI_CALL record_bind(VkDevice d, VkImage i, VkDeviceMemory m, VkDeviceSize offset) {
    require(++binds == 1 && allocs == 1 && !views && d == device && i == image &&
            m == acquired && slot.memory == acquired && !offset, "bind identity/order/offset");
    require(account.allocation_bytes == size && account.live == size && account.peak == size &&
            account.count == 1, "account before bind");
    return scenario == BindError ? VK_ERROR_OUT_OF_DEVICE_MEMORY : VK_SUCCESS;
}

VKAPI_ATTR VkResult VKAPI_CALL record_view(VkDevice d, const VkImageViewCreateInfo *info,
        const VkAllocationCallbacks *cb, VkImageView *out) {
    require(++views == 1 && binds == 1 && allocs == 1 && d == device && info->image == image &&
            !cb && account.count == 1 && scenario <= Wide, "view after bind");
    *out = (VkImageView)(uintptr_t)0x4321;
    return VK_SUCCESS;
}

VKAPI_ATTR void VKAPI_CALL record_destroy_view(VkDevice d, VkImageView v, const VkAllocationCallbacks *cb) {
    require(!cb && d == device && v == (VkImageView)(uintptr_t)0x4321 &&
            views == 1 && destroyed++ == 0, "view release");
}
VKAPI_ATTR void VKAPI_CALL record_destroy_image(VkDevice d, VkImage i, const VkAllocationCallbacks *cb) {
    require(!cb && d == device && i == image && destroyed++ == 1, "image release");
}
VKAPI_ATTR void VKAPI_CALL record_free(VkDevice d, VkDeviceMemory m, const VkAllocationCallbacks *cb) {
    require(!cb && d == device && m == acquired && destroyed++ == 2 && slot.memory == acquired &&
            account.live == size && account.count == 1, "free before accounting reversal");
}

int main(int argc, char **argv) {
    const char *names[] = {"small", "wide", "allocate-error", "clobber", "bind-error"};
    if (argc != 3) return 2;
    for (scenario = Small; scenario <= BindError; ++scenario)
        if (!strcmp(argv[2], names[scenario])) break;
    if (scenario > BindError) return 2;
    linked = !strcmp(argv[1], "linked");
    if (!linked && strcmp(argv[1], "sdk")) return 2;
    size = scenario == Wide ? (UINT64_C(1) << 32) + 16384 : 16384;
    VkMemoryType types[VK_MAX_MEMORY_TYPES] = {0};
    types[31].propertyFlags = VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT;
    slot.left = slot.right = guard;
    require(tower_vk_plan_image_allocation_v1(device, image, types, VK_MAX_MEMORY_TYPES,
            VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT, &plan) == VK_TRUE && !plan.pNext, "planner result");
    dedicated = (VkMemoryDedicatedAllocateInfo){VK_STRUCTURE_TYPE_MEMORY_DEDICATED_ALLOCATE_INFO, NULL, image, VK_NULL_HANDLE};
    plan.pNext = &dedicated;
    unsigned char info_before[sizeof plan], next_before[sizeof dedicated];
    memcpy(info_before, &plan, sizeof plan);
    memcpy(next_before, &dedicated, sizeof dedicated);

    VkResult result = memory_allocate(device, &plan, &slot.memory);
    const char *stage = "allocate";
    VkImageView view = VK_NULL_HANDLE;
    if (result == VK_SUCCESS) {
        memory_acquired(&account, plan.allocationSize);
        stage = "bind";
        result = memory_bind(device, image, slot.memory);
        if (result == VK_SUCCESS) {
            stage = "view";
            VkImageViewCreateInfo info = {.sType=VK_STRUCTURE_TYPE_IMAGE_VIEW_CREATE_INFO, .image=image};
            result = vkCreateImageView(device, &info, NULL, &view);
        }
    }
    require(!memcmp(info_before, &plan, sizeof plan) && !memcmp(next_before, &dedicated, sizeof dedicated) &&
            slot.left == guard && slot.right == guard, "guard or borrowed descriptor modified");
    int allocated = scenario != AllocationError && scenario != Clobber;
    int success = scenario <= Wide;
    VkDeviceMemory expected = allocated ? acquired : scenario == Clobber && !linked ? scribble : VK_NULL_HANDLE;
    require(result == (success ? VK_SUCCESS : VK_ERROR_OUT_OF_DEVICE_MEMORY) &&
            slot.memory == expected && allocs == 1 && binds == (unsigned)allocated &&
            views == (unsigned)success && !!view == success && account.live == (allocated ? size : 0) &&
            account.peak == account.live && account.allocation_bytes == account.live &&
            account.count == (unsigned)allocated, "owner output/counters/result");
    printf("case=%s stage=%s result=%d size=%" PRIu64 " index=%u slot=%016" PRIxPTR
           " allocate=%u bind=%u view=%u live=%" PRIu64 " peak=%" PRIu64 " count=%u guards=ok\n",
           names[scenario], stage, result, size, plan.memoryTypeIndex, (uintptr_t)slot.memory, allocs,
           binds, views, account.live, account.peak, account.count);
    if (result != VK_SUCCESS) {
        fprintf(stderr, "source image %s failed (%d)\n", stage, result);
        return 1;
    }
    vkDestroyImageView(device, view, NULL);
    vkDestroyImage(device, image, NULL);
    vkFreeMemory(device, slot.memory, NULL);
    memory_released(&account);
    slot.memory = VK_NULL_HANDLE;
    require(destroyed == 3 && !account.count && !account.live && !account.allocation_bytes &&
            account.peak == size && slot.left == guard && slot.right == guard, "retired owner");
    printf("retired case=%s live=0 peak=%" PRIu64 " count=0 slot=null\n", names[scenario], account.peak);
    return 0;
}
