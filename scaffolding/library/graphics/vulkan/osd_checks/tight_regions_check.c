// External x64 SDK client. The default arm measures the frozen ordinal-8 fixture.
// Compile with TOWER_REVIEWED_BUILDER_HEADER naming the published builder header
// to exercise the complete builder contract.
#include "control.h"
#include "../osd_texture_upload_record.h"
#include <inttypes.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef TOWER_REVIEWED_BUILDER_HEADER
#include TOWER_REVIEWED_BUILDER_HEADER
#define build tower_vk_build_tight_color_regions_v1
#else
extern uint32_t osd_regions(const OsdShape *, VkDeviceSize, VkBufferImageCopy *, uint32_t);

static uint32_t build(VkBufferImageCopy *out, uint32_t capacity, uint32_t width, uint32_t height,
                      uint32_t layers, uint32_t mips, uint32_t bytes_per_texel, VkDeviceSize bytes) {
    OsdShape shape = {width, height, layers, mips, bytes_per_texel};
    return osd_regions(&shape, bytes, out, capacity);
}
#endif

typedef VkBufferImageCopy Region;
_Static_assert(sizeof(void *) == 8 && sizeof(VkDeviceSize) == 8, "x64 device size");
_Static_assert(sizeof(Region) == 56 && _Alignof(Region) == 8, "SDK region stride and alignment");
#define FIELD_AT(field, byte) _Static_assert(offsetof(Region, field) == (byte), #field)
FIELD_AT(bufferOffset, 0);
FIELD_AT(bufferRowLength, 8);
FIELD_AT(bufferImageHeight, 12);
FIELD_AT(imageSubresource.aspectMask, 16);
FIELD_AT(imageSubresource.mipLevel, 20);
FIELD_AT(imageSubresource.baseArrayLayer, 24);
FIELD_AT(imageSubresource.layerCount, 28);
FIELD_AT(imageOffset.x, 32);
FIELD_AT(imageOffset.y, 36);
FIELD_AT(imageOffset.z, 40);
FIELD_AT(imageExtent.width, 44);
FIELD_AT(imageExtent.height, 48);
FIELD_AT(imageExtent.depth, 52);

// Each literal describes one ordered SDK region. Fixed fields are shared
// across the Draw shapes. There is no layout or byte-span algorithm here.
#define COLOR(offset, mip, layer, w, h) \
    {offset, 0, 0, {VK_IMAGE_ASPECT_COLOR_BIT, mip, layer, 1}, {0, 0, 0}, {w, h, 1}}

static const Region fonts[] = {
    COLOR(0, 0, 0, 2048, 2048), COLOR(4194304, 0, 1, 2048, 2048),
    COLOR(8388608, 0, 2, 2048, 2048), COLOR(12582912, 0, 3, 2048, 2048),
    COLOR(16777216, 0, 4, 2048, 2048), COLOR(20971520, 0, 5, 2048, 2048)
};
static const Region bitmap[] = {COLOR(0, 0, 0, 256, 352), COLOR(360448, 1, 0, 128, 176)};
static const Region firmware[] = {
    COLOR(0, 0, 0, 256, 352), COLOR(360448, 0, 1, 256, 352),
    COLOR(720896, 0, 2, 256, 352), COLOR(1081344, 0, 3, 256, 352)
};
static const Region images[] = {COLOR(0, 0, 0, 64, 64), COLOR(16384, 0, 1, 64, 64)};
static const Region wide[] = {COLOR(0, 0, 0, 65537, 65536), COLOR(UINT64_C(4295032832), 0, 1, 65537, 65536)};
static const Region mixed[] = {
    COLOR(0, 0, 0, 7, 5), COLOR(105, 1, 0, 3, 2), COLOR(123, 0, 1, 7, 5), COLOR(228, 1, 1, 3, 2)
};
#define COUNT(array) (sizeof(array) / sizeof((array)[0]))

typedef struct {
    const char *name;
    uint32_t w, h, layers, mips, bpt;
    VkDeviceSize bytes;
    const Region *expected;
    uint32_t count;
} Case;

static const Case draw[] = {
    {"fonts", 2048, 2048, 6, 1, 1, 25165824, fonts, COUNT(fonts)},
    {"bitmap", 256, 352, 1, 2, 4, 450560, bitmap, COUNT(bitmap)},
    {"inverted", 256, 352, 1, 2, 4, 450560, bitmap, COUNT(bitmap)},
    {"firmware", 256, 352, 4, 1, 4, 1441792, firmware, COUNT(firmware)},
    {"images", 64, 64, 2, 1, 4, 32768, images, COUNT(images)}
};
static const Case wide_case = {"wide", 65537, 65536, 2, 1, 1, UINT64_C(8590065664), wide, COUNT(wide)};
static const Case mixed_case = {"mixed", 7, 5, 2, 2, 3, 246, mixed, COUNT(mixed)};
enum { Slots = COUNT(fonts) + 1, Poison = 0xa5 };
typedef struct { Region lead, out[Slots], tail; } Buffer;

static void expect_poison(const char *name, const void *data, size_t bytes, const char *part) {
    const unsigned char *p = data;
    for (size_t i = 0; i < bytes; ++i) {
        if (p[i] != Poison) {
            fprintf(stderr, "%s %s byte %zu expected a5 observed %02x\n", name, part, i, (unsigned)p[i]);
            exit(1);
        }
    }
}

static void check(const Case *c, uint32_t capacity, VkDeviceSize available, uint32_t want, int trace) {
    Buffer buf;
    memset(&buf, Poison, sizeof(buf));
    uint32_t n = build(buf.out, capacity, c->w, c->h, c->layers, c->mips, c->bpt, available);
    if (n != want) {
        fprintf(stderr, "%s cap=%u available=%" PRIu64 " expected %u got %u\n", c->name, capacity, available, want, n);
        exit(1);
    }
    expect_poison(c->name, &buf.lead, sizeof(buf.lead), "leading guard");
    expect_poison(c->name, buf.out + n, (Slots - n) * sizeof(Region), n ? "spare slots" : "refused output");
    expect_poison(c->name, &buf.tail, sizeof(buf.tail), "trailing guard");
    for (uint32_t i = 0; i < n; ++i) {
        const Region *r = &buf.out[i];
        const Region *e = &c->expected[i];
        if (trace) printf("%s %u", c->name, i);
#define CHECK_FIELD(field) do { \
            if (r->field != e->field) { \
                fprintf(stderr, "%s[%u].%s expected %" PRId64 " observed %" PRId64 "\n", \
                        c->name, i, #field, (int64_t)e->field, (int64_t)r->field); \
                exit(1); \
            } \
            if (trace) printf(" %" PRId64, (int64_t)r->field); \
        } while (0)
        CHECK_FIELD(bufferOffset);
        CHECK_FIELD(bufferRowLength);
        CHECK_FIELD(bufferImageHeight);
        CHECK_FIELD(imageSubresource.aspectMask);
        CHECK_FIELD(imageSubresource.mipLevel);
        CHECK_FIELD(imageSubresource.baseArrayLayer);
        CHECK_FIELD(imageSubresource.layerCount);
        CHECK_FIELD(imageOffset.x);
        CHECK_FIELD(imageOffset.y);
        CHECK_FIELD(imageOffset.z);
        CHECK_FIELD(imageExtent.width);
        CHECK_FIELD(imageExtent.height);
        CHECK_FIELD(imageExtent.depth);
#undef CHECK_FIELD
        if (trace) putchar('\n');
    }
}

static void invalid_cases(void) {
    const Case cases[] = {
        {"zero width", 0, 1, 1, 1, 1, 1, NULL, 0},
        {"zero height", 1, 0, 1, 1, 1, 1, NULL, 0},
        {"zero layers", 1, 1, 0, 1, 1, 1, NULL, 0},
        {"zero mips", 1, 1, 1, 0, 1, 1, NULL, 0},
        {"zero bpt", 1, 1, 1, 1, 0, 1, NULL, 0},
        {"zero span", 1, 1, 1, 1, 1, 0, NULL, 0},
        {"shifted width", 1, 4, 1, 2, 1, UINT64_MAX, NULL, 0},
        {"shifted height", 4, 1, 1, 2, 1, UINT64_MAX, NULL, 0},
        {"region count overflow", 2, 2, UINT32_C(0x80000001), 2, 1, UINT64_MAX, NULL, 0},
        {"region size overflow", 1U << 31, 1U << 31, 1, 1, 4, UINT64_MAX, NULL, 0},
        {"total size overflow", 1U << 31, 1U << 31, 2, 1, 2, UINT64_MAX, NULL, 0},
        {"mip span overflow", 1U << 31, UINT32_MAX, 1, 2, 2, UINT64_MAX, NULL, 0}
    };
    for (size_t i = 0; i < COUNT(cases); ++i) check(&cases[i], Slots, cases[i].bytes, 0, 0);
    check(&draw[0], 0, draw[0].bytes, 0, 0);
    if (build(NULL, 1, 1, 1, 1, 1, 1, 1) != 0) {
        fputs("accepted null output\n", stderr);
        exit(1);
    }
}

#ifdef _WIN32
#include <windows.h>

// The recording-only Vulkan loader in the ordinal-8 packet reads this
// test command-buffer layout (observe.tower). Use only with that loader.
typedef struct {
    uint32_t index, calls;
    uint8_t src, dst;
    Region *regions;
} Observation;

_Static_assert(offsetof(Observation, regions) == 16 && sizeof(Observation) == 24, "observer ABI");

static void record_shapes(void) {
    HMODULE loader = GetModuleHandleW(L"vulkan-1.dll");
    if (!loader || !GetProcAddress(loader, "vkCmdCopyBufferToImage") || GetProcAddress(loader, "vkGetInstanceProcAddr")) {
        fputs("record requires the frozen ordinal-8 recording loader\n", stderr);
        exit(2);
    }
    for (uint32_t i = 0; i < COUNT(draw); ++i) {
        const Case *c = &draw[i];
        Buffer buf;
        memset(&buf, Poison, sizeof(buf));
        Observation o = {.index = i, .regions = buf.out};
        uint32_t n = build(buf.out, Slots, c->w, c->h, c->layers, c->mips, c->bpt, c->bytes);
        if (n != c->count) {
            fprintf(stderr, "%s expected %u regions before recording, got %u\n", c->name, c->count, n);
            exit(1);
        }
        tower_vk_osd_texture_upload_record_v1((VkCommandBuffer)&o, (VkBuffer)&o.src, (VkImage)&o.dst,
                                              c->layers, c->mips, n, buf.out);
        if (o.calls != 2 * c->layers + 1) {
            fprintf(stderr, "%s expected %u recorder calls, got %u\n", c->name, 2 * c->layers + 1, o.calls);
            exit(1);
        }
        printf("%s regions=%u transitions=%u original_pointer=matched\n", c->name, n, o.calls - 1);
    }
}

#endif

int main(int argc, char **argv) {
#ifdef _WIN32
    if (argc == 2 && !strcmp(argv[1], "record")) {
        record_shapes();
        return 0;
    }
#endif
    if (argc == 2 && !strcmp(argv[1], "short-bitmap")) {
        check(&draw[1], draw[1].count, 450559, 0, 0);
        return 0;
    }
    if (argc != 2 || (strcmp(argv[1], "raw") && strcmp(argv[1], "checked"))) {
        fputs("expected raw, short-bitmap, record or checked\n", stderr);
        return 2;
    }
    int checked = !strcmp(argv[1], "checked");
    for (size_t i = 0; i < COUNT(draw); ++i) {
        const Case *c = &draw[i];
        check(c, c->count, c->bytes, c->count, 1);
        check(c, Slots, c->bytes, c->count, 0);
        check(c, c->count - 1, c->bytes, 0, 0);
        if (checked) check(c, Slots, c->bytes - 1, 0, 0);
    }
    check(&wide_case, Slots, wide_case.bytes, wide_case.count, 1);
    if (checked) {
        check(&wide_case, Slots, wide_case.bytes - 1, 0, 0);
        check(&mixed_case, Slots, mixed_case.bytes, mixed_case.count, 1);
        check(&mixed_case, Slots, UINT64_MAX, mixed_case.count, 0);
        invalid_cases();
    }
    return 0;
}
