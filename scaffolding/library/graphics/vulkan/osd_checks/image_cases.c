#include "image_check.h"
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void osd_observe_image(PFN_vkCreateImage);
#define CHECK(expr) do { if (!(expr)) { fprintf(stderr, "line %d: %s\n", __LINE__, #expr); exit(3); } } while (0)

/* Snapshot whole object representations, including Win64 padding, guards and
 * the format-list payload that hangs off the pNext node. No struct copies. */
typedef struct {
    uint64_t guard0;
    VkImageCreateInfo info;
    uint64_t guard1;
    VkImageFormatListCreateInfo list;
    uint64_t guard2;
    VkFormat formats[2];
    uint64_t guard3;
    uint32_t queues[3];
    uint64_t guard4;
} Inputs;
static _Thread_local struct {
    const Inputs *input;
    unsigned char before[sizeof(Inputs)];
    VkDevice device;
    VkImage *caller, handle;
    VkResult status;
    unsigned calls;
} expected;

static VKAPI_ATTR VkResult VKAPI_CALL observe(VkDevice device, const VkImageCreateInfo *info,
        const VkAllocationCallbacks *allocator, VkImage *slot) {
    CHECK(++expected.calls == 1 && device == expected.device && !allocator);
    CHECK(info == &expected.input->info && !memcmp(expected.input, expected.before, sizeof expected.before));
    if (info->pNext) {
        CHECK(info->pNext == &expected.input->list && expected.input->list.pViewFormats == expected.input->formats);
        CHECK(info->pQueueFamilyIndices == expected.input->queues);
    }
    CHECK(slot && slot != expected.caller && !*slot && !*expected.caller);
    *slot = expected.handle;
    CHECK(!*expected.caller);
    return expected.status;
}

enum { OSD_USAGE = VK_IMAGE_USAGE_TRANSFER_SRC_BIT | VK_IMAGE_USAGE_TRANSFER_DST_BIT | VK_IMAGE_USAGE_SAMPLED_BIT };

static const struct {
    VkImageType type;
    VkFormat format;
    VkExtent3D extent;
    uint32_t mips, layers;
    VkImageCreateFlags flags;
    VkImageUsageFlags usage;
} cases[] = {
    {VK_IMAGE_TYPE_2D,VK_FORMAT_R8_UNORM,{2048,2048,1},1,6,0,OSD_USAGE},
    {VK_IMAGE_TYPE_2D,VK_FORMAT_R8G8B8A8_SRGB,{256,352,1},2,1,0,OSD_USAGE},
    {VK_IMAGE_TYPE_2D,VK_FORMAT_R8G8B8A8_SRGB,{256,352,1},2,1,0,OSD_USAGE},
    {VK_IMAGE_TYPE_2D,VK_FORMAT_R8G8B8A8_SRGB,{256,352,1},1,4,0,OSD_USAGE},
    {VK_IMAGE_TYPE_2D,VK_FORMAT_R8G8B8A8_SRGB,{64,64,1},1,2,0,OSD_USAGE},
    {VK_IMAGE_TYPE_2D,VK_FORMAT_R8G8B8A8_UNORM,{128,128,1},3,6,
        VK_IMAGE_CREATE_CUBE_COMPATIBLE_BIT | VK_IMAGE_CREATE_MUTABLE_FORMAT_BIT,OSD_USAGE},
    {VK_IMAGE_TYPE_3D,VK_FORMAT_R16_SFLOAT,{37,23,11},2,1,0,VK_IMAGE_USAGE_STORAGE_BIT | VK_IMAGE_USAGE_TRANSFER_SRC_BIT}
};

int record_suite(void) {
    const VkResult statuses[] = {VK_SUCCESS, VK_ERROR_OUT_OF_HOST_MEMORY, VK_ERROR_OUT_OF_DEVICE_MEMORY};
    const uint64_t guard = UINT64_C(0xd5a733841f2c694b);
    osd_observe_image(observe);
    for (unsigned n = 0; n < sizeof cases / sizeof cases[0]; n++) {
        Inputs input;
        memset(&input, 0xa5, sizeof input);
        VkImageCreateInfo *info = &input.info;
        info->sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO;
        info->pNext = NULL;
        info->flags = cases[n].flags;
        info->imageType = cases[n].type;
        info->format = cases[n].format;
        info->extent = cases[n].extent;
        info->mipLevels = cases[n].mips;
        info->arrayLayers = cases[n].layers;
        info->samples = VK_SAMPLE_COUNT_1_BIT;
        info->tiling = VK_IMAGE_TILING_OPTIMAL;
        info->usage = cases[n].usage;
        info->sharingMode = VK_SHARING_MODE_EXCLUSIVE;
        info->queueFamilyIndexCount = 0;
        info->pQueueFamilyIndices = NULL;
        info->initialLayout = VK_IMAGE_LAYOUT_UNDEFINED;
        if (info->flags & VK_IMAGE_CREATE_MUTABLE_FORMAT_BIT) {
            input.formats[0] = info->format;
            input.formats[1] = VK_FORMAT_R8G8B8A8_SRGB;
            input.list.sType = VK_STRUCTURE_TYPE_IMAGE_FORMAT_LIST_CREATE_INFO;
            input.list.pNext = NULL;
            input.list.viewFormatCount = sizeof input.formats / sizeof input.formats[0];
            input.list.pViewFormats = input.formats;
            info->pNext = &input.list;
            input.queues[0] = 2; input.queues[1] = 7; input.queues[2] = 5;
            info->sharingMode = VK_SHARING_MODE_CONCURRENT;
            info->queueFamilyIndexCount = sizeof input.queues / sizeof input.queues[0];
            info->pQueueFamilyIndices = input.queues;
        }
        expected.input = &input;
        memcpy(expected.before, &input, sizeof input);
        expected.device = (VkDevice)(uintptr_t)(0x100 + n);
        expected.handle = (VkImage)(uintptr_t)(0x900 + n);
        for (unsigned i = 0; i < sizeof statuses / sizeof statuses[0]; i++) {
            struct { uint64_t left; VkImage value; uint64_t right; } output = {guard, VK_NULL_HANDLE, ~guard};
            expected.caller = &output.value;
            expected.calls = 0;
            expected.status = statuses[i];
            VkResult status = osd_check_image(expected.device, info, &output.value);
            CHECK(status == statuses[i] && expected.calls == 1);
            CHECK(output.value == (status == VK_SUCCESS ? expected.handle : VK_NULL_HANDLE));
            CHECK(output.left == guard && output.right == ~guard && !memcmp(&input, expected.before, sizeof input));
            printf("case=%u type=%d extent=%ux%ux%u format=%d flags=%u usage=%u queue_count=%u chained=%u result=%d published=%u calls=%u\n",
                n, info->imageType, info->extent.width, info->extent.height, info->extent.depth,
                info->format, info->flags, info->usage, info->queueFamilyIndexCount, info->pNext != NULL, status,
                output.value != VK_NULL_HANDLE, expected.calls);
        }
    }
    osd_observe_image(NULL);
    return 0;
}
#ifndef OSD_THREADED_SUITE
int main(void) { return record_suite(); }
#endif
