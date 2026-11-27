/* External ABI test. The Vulkan PFN records arguments without accessing handles. */
#include "indexed_draw_c.h"
#include <inttypes.h>
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
    printf("%s called=%u driver_calls=%u shared=%u commands=%" PRIu64 "/%" PRIu64
           " count=%" PRIu64 "/%" PRIu64 " max=%u stride=%u\n", name, called, calls,
           (unsigned)(in.commands == in.count), in.command_offset, in.command_bytes,
           in.count_offset, in.count_bytes, in.max_draws, in.stride);
}

/* Both spans of a shared VkBuffer use the same logical extent. */
static void check_shared(const char *name, Inputs in, VkDeviceSize size, uint32_t want)
{
    in.count = in.commands;
    in.command_bytes = in.count_bytes = size;
    check(name, in, record, want);
}

static void check_draw_layouts(Inputs draw, VkBuffer scene_count)
{
    Inputs nuclear = draw;
    nuclear.command_offset = 2560; nuclear.count_offset = 3584;
    nuclear.max_draws = 32; nuclear.stride = 32;
    check_shared("nuclear particles", nuclear, 3624, 1);
    check_shared("nuclear count ends at logical end", nuclear, 3588, 1);
    check_shared("nuclear commands fit but count is short", nuclear, 3587, 0);
    /* Give the count its own buffer to isolate the final 20-byte record. */
    nuclear.count = scene_count; nuclear.count_bytes = 3588;
    nuclear.command_bytes = 3572;
    check("nuclear separate count, exact command span", nuclear, record, 1);
    nuclear.command_bytes--;
    check("nuclear separate count, short command span", nuclear, record, 0);

    const VkDeviceSize osd_bytes = 1088;
    Inputs osd = draw;
    osd.max_draws = 1; osd.stride = 20;
    osd.command_offset = 0; osd.count_offset = 20;
    check_shared("OSD encoder pass 0", osd, osd_bytes, 1);
    osd.command_offset = 24; osd.count_offset = 44;
    check_shared("OSD encoder pass 1", osd, osd_bytes, 1);
    check_shared("OSD pass 1 exact fit", osd, 48, 1);
    check_shared("OSD count short", osd, 47, 0);

    const uint32_t pool_chunk_count = 3;
    Inputs water = draw;
    water.command_offset = 1032; water.count_offset = 4;
    water.max_draws = pool_chunk_count;
    check_shared("water three chunks", water, 1092, 1);
    check_shared("water final record short", water, 1091, 0);
    water.max_draws = 0;
    check_shared("water zero chunks at logical end", water, 1032, 1);
    check_shared("water zero chunks past logical end", water, 1031, 0);

    const uint32_t bucket = 23;
    Inputs scene = draw;
    scene.count = scene_count; scene.count_bytes = 128; scene.count_offset = 32 + bucket * 4;
    scene.command_offset = (VkDeviceSize)bucket * scene.max_draws * 20;
    scene.command_bytes = 7864320;
    check("scene last count word", scene, record, 1);
    scene.count_bytes--;
    check("scene count buffer short", scene, record, 0);
    scene.count_bytes = 128;
    scene.command_bytes--;
    check("scene command buffer short", scene, record, 0);

    /* Synthetic frame info[0] makes even the first product exceed u32. */
    scene.max_draws = UINT32_C(1) << 28;
    scene.command_offset = (VkDeviceSize)bucket * scene.max_draws * 20;
    scene.command_bytes = UINT64_C(128849018880);
    check("scene wide bucket offset", scene, record, 1);
    scene.command_bytes--;
    check("scene wide final record short", scene, record, 0);
}

int main(void)
{
    char primary, counter;
    struct { VkDeviceSize size, allocationBytes; } gpu = { 327684, 327936 };
    VkBuffer stream = (VkBuffer)(void *)&gpu;
    Inputs draw = { .cmd = (VkCommandBuffer)(void *)&primary, .commands = stream,
        .count = stream, .command_bytes = gpu.size, .command_offset = 4,
        .count_bytes = gpu.size, .count_offset = 0, .max_draws = 16384, .stride = 20 };
    check("Draw shared stream", draw, record, 1);
    check("null function", draw, NULL, 0);

    if (gpu.allocationBytes <= gpu.size) {
        fputs("GPU check fixture requires allocation padding\n", stderr);
        return EXIT_FAILURE;
    }
    gpu.size--;
    check_shared("GPU check one byte short with allocation padding", draw, gpu.size, 0);
    check_draw_layouts(draw, (VkBuffer)(void *)&counter);

    Inputs in = draw; in.cmd = VK_NULL_HANDLE;
    check("null command buffer", in, record, 0);
    in = draw; in.commands = VK_NULL_HANDLE;
    check("null commands", in, record, 0);
    in = draw; in.count = VK_NULL_HANDLE;
    check("null count", in, record, 0);

    Inputs padded = draw;
    padded.count = (VkBuffer)(void *)&counter;
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
