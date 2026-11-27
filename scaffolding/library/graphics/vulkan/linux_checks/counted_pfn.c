#include "../indexed_draw_c.h"
#include <inttypes.h>
#include <stdio.h>

/* One synchronous observation per fixture thread. The callee borrows the
 * stack record only while counted_sdk_attempt is on the stack. */
struct call {
    PFN_vkCmdDrawIndexedIndirectCount device_pfn;
    VkCommandBuffer cmd;
    VkBuffer commands, count;
    VkDeviceSize command_offset, count_offset;
    uint32_t maximum, stride, forwards, matches;
};
static _Thread_local struct call *active;

static VKAPI_ATTR void VKAPI_CALL forward(VkCommandBuffer cmd, VkBuffer commands,
    VkDeviceSize command_offset, VkBuffer count, VkDeviceSize count_offset, uint32_t maximum, uint32_t stride) {
    struct call *c = active;
    ++c->forwards;
    c->matches += cmd == c->cmd && commands == c->commands && command_offset == c->command_offset &&
        count == c->count && count_offset == c->count_offset && maximum == c->maximum && stride == c->stride;
    fprintf(stderr, "forward pfn=%p cmd=%p commands=%p offset=%" PRIu64 " count=%p offset=%" PRIu64
        " max=%u stride=%u\n", (void *)c->device_pfn, (void *)cmd, (void *)commands, command_offset,
        (void *)count, count_offset, maximum, stride);
    c->device_pfn(cmd, commands, command_offset, count, count_offset, maximum, stride);
}

uint32_t counted_sdk_attempt(PFN_vkCmdDrawIndexedIndirectCount draw, VkCommandBuffer cmd,
    VkBuffer commands, VkDeviceSize command_bytes, VkDeviceSize command_offset, VkBuffer count,
    VkDeviceSize count_bytes, VkDeviceSize count_offset, uint32_t maximum, uint32_t stride,
    uint32_t accept, uint32_t *forwards, uint32_t *matches) {
    struct call observation = { draw, cmd, commands, count, command_offset, count_offset, maximum, stride, 0, 0 };
    active = &observation;
    fprintf(stderr, "attempt pfn=%p command_bytes=%" PRIu64 " count_bytes=%" PRIu64 " max=%u expect=%u\n",
        (void *)draw, command_bytes, count_bytes, maximum, accept);
#ifdef COUNTED_RAW_CONTROL
    if (accept) forward(cmd, commands, command_offset, count, count_offset, maximum, stride);
    uint32_t result = accept;
#else
    uint32_t result = tower_vk_record_indexed_indirect_count_v1(forward, cmd, commands, command_bytes,
        command_offset, count, count_bytes, count_offset, maximum, stride);
#endif
    active = NULL;
    *forwards = observation.forwards;
    *matches = observation.matches;
    return result;
}

/* GNU ld --wrap instruments this executable's lookup. Keep the validation
 * layer's device dispatch intact and return the loader's original pointer. */
PFN_vkVoidFunction __real_vkGetDeviceProcAddr(VkDevice, const char *);
PFN_vkVoidFunction __wrap_vkGetDeviceProcAddr(VkDevice device, const char *name) {
    PFN_vkVoidFunction pfn = __real_vkGetDeviceProcAddr(device, name);
    fprintf(stderr, "resolved device=%p symbol=%s pfn=%p\n", (void *)device, name, (void *)pfn);
    return pfn;
}
