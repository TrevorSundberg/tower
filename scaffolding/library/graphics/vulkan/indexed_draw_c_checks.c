/* External ABI test. The Vulkan PFN records arguments without accessing handles. */
#include "indexed_draw_c.h"
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    VkCommandBuffer cmd;
    VkBuffer commands, count;
    VkDeviceSize command_bytes, command_offset, count_bytes, count_offset;
    uint32_t max_draws, stride;
} Inputs;

static Inputs expected;
static unsigned calls;
static const char *label;

static VKAPI_ATTR void VKAPI_CALL record(VkCommandBuffer cmd, VkBuffer commands,
    VkDeviceSize command_offset, VkBuffer count, VkDeviceSize count_offset,
    uint32_t max_draws, uint32_t stride)
{
    ++calls;
    if (cmd != expected.cmd || commands != expected.commands || count != expected.count ||
        command_offset != expected.command_offset || count_offset != expected.count_offset ||
        max_draws != expected.max_draws || stride != expected.stride) {
        fprintf(stderr, "%s: driver arguments changed\n", label);
        exit(EXIT_FAILURE);
    }
}

static void check(const char *name, Inputs in, PFN_vkCmdDrawIndexedIndirectCount draw, uint32_t want)
{
    label = name;
    expected = in;
    calls = 0;
    uint32_t called = tower_vk_record_indexed_indirect_count_v1(draw, in.cmd, in.commands,
        in.command_bytes, in.command_offset, in.count, in.count_bytes, in.count_offset,
        in.max_draws, in.stride);
    if (called != want || calls != want) {
        fprintf(stderr, "%s: expected %u, returned %u, driver calls %u\n", name, want, called, calls);
        exit(EXIT_FAILURE);
    }
    printf("%s called=%u driver_calls=%u\n", name, called, calls);
}

int main(void)
{
    char handles[3];
    VkBuffer stream = (VkBuffer)(void *)&handles[0];
    Inputs draw = { .cmd = (VkCommandBuffer)(void *)&handles[1], .commands = stream,
        .count = stream, .command_bytes = 327684, .command_offset = 4,
        .count_bytes = 327684, .count_offset = 0, .max_draws = 16384, .stride = 20 };
    check("Draw shared stream", draw, record, 1);
    check("null function", draw, NULL, 0);

    Inputs in = draw;
    in.command_bytes--;
    check("short final record", in, record, 0);
    in = draw; in.cmd = VK_NULL_HANDLE;
    check("null command buffer", in, record, 0);
    in = draw; in.commands = VK_NULL_HANDLE;
    check("null commands", in, record, 0);
    in = draw; in.count = VK_NULL_HANDLE;
    check("null count", in, record, 0);

    Inputs padded = draw;
    padded.count = (VkBuffer)(void *)&handles[2];
    padded.command_offset = UINT64_C(0x100000008);
    padded.count_offset = UINT64_C(0x20000000c);
    padded.command_bytes = padded.command_offset + 52;
    padded.count_bytes = padded.count_offset + 4;
    padded.max_draws = 2;
    padded.stride = 32;
    check("independent handles and high offsets, padded stride", padded, record, 1);
    in = padded; in.command_bytes--;
    check("short padded final record", in, record, 0);
    in = padded; in.count_bytes--;
    check("short count", in, record, 0);
    in = padded; in.command_offset--;
    check("misaligned commands", in, record, 0);
    in = padded; in.count_offset--;
    check("misaligned count", in, record, 0);
    in = padded; in.command_bytes = UINT64_MAX; in.command_offset = UINT64_MAX - 23;
    check("last record overflows", in, record, 0);
    in = padded; in.count_bytes = UINT64_MAX; in.count_offset = UINT64_MAX - 3;
    check("count end overflows", in, record, 0);
    in = padded; in.max_draws = UINT32_MAX; in.stride = UINT32_MAX - 3;
    check("large stride product", in, record, 0);

    Inputs empty = draw;
    empty.command_offset = empty.command_bytes;
    empty.max_draws = 0;
    check("zero maximum at end", empty, record, 1);
    in = empty; in.command_offset += 4;
    check("zero maximum past end", in, record, 0);
    in = empty; in.command_offset--;
    check("zero maximum misaligned", in, record, 0);
    in = empty; in.stride = 16;
    check("short stride", in, record, 0);
    in = empty; in.stride = 21;
    check("misaligned stride", in, record, 0);
    in = empty; in.count_bytes = 3;
    check("zero maximum short count", in, record, 0);
    return EXIT_SUCCESS;
}
