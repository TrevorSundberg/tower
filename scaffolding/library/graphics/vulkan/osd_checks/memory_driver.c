/* CPU-only Vulkan SDK boundary. Each thread drives its own simulated device. */
#include "../image_memory.h"
#include <inttypes.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Ledger { uint64_t bytes, live, peak, count; };
extern int32_t memory_owner(VkDevice, VkImage, const VkMemoryAllocateInfo *, VkDeviceMemory *, struct Ledger *);

struct Case {
    VkDevice device;
    VkImage image;
    VkDeviceMemory memory;
    VkImageView view;
    VkMemoryDedicatedAllocateInfo next;
    VkMemoryAllocateInfo info;
    struct { uint64_t left; VkDeviceMemory memory; uint64_t right; } slot;
    struct Ledger ledger;
    VkDeviceSize size;
    VkResult alloc_status, bind_status;
    int verbose;
    unsigned calls;
    char events[12];
};
static _Thread_local struct Case c;

static void check(int ok, const char *detail) {
    if (!ok) { fprintf(stderr, "memory recorder failed at %s: %s\n", c.events, detail); abort(); }
}

static void event(char e) {
    check(c.calls + 1 < sizeof c.events, "event overflow");
    c.events[c.calls++] = e;
}

VKAPI_ATTR VkResult VKAPI_CALL vkAllocateMemory(VkDevice d, const VkMemoryAllocateInfo *info,
        const VkAllocationCallbacks *allocator, VkDeviceMemory *out) {
    event('A');
    check(d == c.device && info == &c.info && !allocator, "allocation arguments");
    check(info->pNext == &c.next && info->sType == VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO &&
          info->allocationSize == c.size && info->memoryTypeIndex == 31 &&
          c.next.sType == VK_STRUCTURE_TYPE_MEMORY_DEDICATED_ALLOCATE_INFO &&
          !c.next.pNext && c.next.image == c.image && !c.next.buffer, "descriptor chain");
    check(out != &c.slot.memory && !*out && !c.slot.memory, "private initial destination");
    *out = c.memory;  /* Deliberately clobber on every result. */
    check(!c.slot.memory && !c.ledger.count && !c.ledger.live && !c.ledger.bytes && !c.ledger.peak, "early publication");
    if (c.verbose) printf("allocate device=%p info=%p original=%p next=%p original_next=%p allocator=%p bytes=%"PRIu64
        " index=%u private=%p caller=%p wrote=%p public=%p injected=%d\n", (void*)d, (void*)info,
        (void*)&c.info, info->pNext, (void*)&c.next, (void*)allocator, info->allocationSize, info->memoryTypeIndex,
        (void*)out, (void*)&c.slot.memory, (void*)*out, (void*)c.slot.memory, c.alloc_status);
    return c.alloc_status;
}

VKAPI_ATTR VkResult VKAPI_CALL vkBindImageMemory(VkDevice d, VkImage i, VkDeviceMemory m, VkDeviceSize offset) {
    event('B');
    check(d == c.device && i == c.image && m == c.memory && m == c.slot.memory && !offset, "bind arguments");
    check(c.ledger.bytes == c.size && c.ledger.live == c.size && c.ledger.peak == c.size && c.ledger.count == 1,
          "ledger at bind");
    if (c.verbose) printf("bind device=%p image=%p memory=%p published=%p offset=%"PRIu64" bytes=%"PRIu64
        " live=%"PRIu64" peak=%"PRIu64" count=%"PRIu64" injected=%d\n", (void*)d, (void*)i, (void*)m,
        (void*)c.slot.memory, offset, c.ledger.bytes, c.ledger.live, c.ledger.peak, c.ledger.count, c.bind_status);
    return c.bind_status;
}

VKAPI_ATTR VkResult VKAPI_CALL vkCreateImageView(VkDevice d, const VkImageViewCreateInfo *info,
        const VkAllocationCallbacks *cb, VkImageView *out) {
    event('V'); check(d == c.device && !cb && info->image == c.image, "view");
    *out = c.view;
    return VK_SUCCESS;
}
void osd_completed(void) { event('C'); }
VKAPI_ATTR void VKAPI_CALL vkDestroyImageView(VkDevice d, VkImageView v, const VkAllocationCallbacks *cb) {
    event('v'); check(d == c.device && v == c.view && !cb, "destroy view");
}
VKAPI_ATTR void VKAPI_CALL vkDestroyImage(VkDevice d, VkImage i, const VkAllocationCallbacks *cb) {
    event('i'); check(d == c.device && i == c.image && !cb, "destroy image");
}
VKAPI_ATTR void VKAPI_CALL vkFreeMemory(VkDevice d, VkDeviceMemory m, const VkAllocationCallbacks *cb) {
    event('f'); check(d == c.device && m == c.memory && !cb && c.ledger.live == c.size, "free");
}

int osd_memory_case(VkDeviceSize size, int32_t a, int32_t b, int32_t verbose) {
    memset(&c, 0, sizeof c);
    c.device = (VkDevice)(void*)&c.device;
    c.image = (VkImage)(void*)&c.image;
    c.memory = (VkDeviceMemory)(void*)&c.memory;
    c.view = (VkImageView)(void*)&c.view;
    c.next = (VkMemoryDedicatedAllocateInfo){VK_STRUCTURE_TYPE_MEMORY_DEDICATED_ALLOCATE_INFO, NULL, c.image, VK_NULL_HANDLE};
    c.info = (VkMemoryAllocateInfo){VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO, &c.next, size, 31};
    c.slot.left = UINT64_C(0xa5a5a5a5a5a5a5a5);
    c.slot.right = ~c.slot.left;
    unsigned char slot[sizeof c.slot], info[sizeof c.info], next[sizeof c.next];
    memcpy(slot, &c.slot, sizeof slot);
    memcpy(info, &c.info, sizeof info);
    memcpy(next, &c.next, sizeof next);
    c.size = size; c.verbose = verbose; c.alloc_status = a; c.bind_status = b;
    int32_t status = memory_owner(c.device, c.image, &c.info, &c.slot.memory, &c.ledger);
    int bound_error = !a && b;
    int ok = status == (a ? a : b) && !strcmp(c.events, a ? "A" : b ? "AB" : "ABVCvif") &&
        !memcmp(&c.info, info, sizeof info) && !memcmp(&c.next, next, sizeof next) &&
        c.slot.left == UINT64_C(0xa5a5a5a5a5a5a5a5) && c.slot.right == ~c.slot.left &&
        (bound_error ? c.slot.memory == c.memory : !memcmp(slot, &c.slot, sizeof slot)) &&
        c.ledger.bytes == (bound_error ? size : 0) && c.ledger.live == c.ledger.bytes &&
        c.ledger.count == (uint64_t)bound_error && c.ledger.peak == (a ? 0 : size);
    if (verbose || !ok) printf("return status=%d events=%s slot=%p allocation=%"PRIu64" live=%"PRIu64
        " peak=%"PRIu64" count=%"PRIu64" ok=%d\n", status, c.events, (void*)c.slot.memory,
        c.ledger.bytes, c.ledger.live, c.ledger.peak, c.ledger.count, ok);
    return ok;
}
