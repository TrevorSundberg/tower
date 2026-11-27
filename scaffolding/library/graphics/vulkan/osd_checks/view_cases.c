#include "view_check.h"
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void osd_observe_view(PFN_vkCreateImageView);
typedef struct {
    VkImageViewType type;
    VkFormat format;
    VkImageSubresourceRange range;
} Case;
enum { Bitmap = 1 };
static const Case cases[] = {
    {VK_IMAGE_VIEW_TYPE_2D_ARRAY, VK_FORMAT_R8_UNORM,        {VK_IMAGE_ASPECT_COLOR_BIT,0,1,0,6}},
    [Bitmap] = {VK_IMAGE_VIEW_TYPE_2D,       VK_FORMAT_R8G8B8A8_SRGB, {VK_IMAGE_ASPECT_COLOR_BIT,0,2,0,1}},
    {VK_IMAGE_VIEW_TYPE_2D,       VK_FORMAT_R8G8B8A8_SRGB, {VK_IMAGE_ASPECT_COLOR_BIT,0,2,0,1}},
    {VK_IMAGE_VIEW_TYPE_2D_ARRAY, VK_FORMAT_R8G8B8A8_SRGB, {VK_IMAGE_ASPECT_COLOR_BIT,0,1,0,4}},
    {VK_IMAGE_VIEW_TYPE_2D_ARRAY, VK_FORMAT_R8G8B8A8_SRGB, {VK_IMAGE_ASPECT_COLOR_BIT,0,1,0,2}},
    {VK_IMAGE_VIEW_TYPE_2D_ARRAY, VK_FORMAT_R8G8B8A8_SRGB, {VK_IMAGE_ASPECT_COLOR_BIT,1,1,0,1}},
    {VK_IMAGE_VIEW_TYPE_2D_ARRAY, VK_FORMAT_R8_UNORM,       {VK_IMAGE_ASPECT_COLOR_BIT,0,1,2,3}},
    {VK_IMAGE_VIEW_TYPE_2D,       VK_FORMAT_D32_SFLOAT,    {VK_IMAGE_ASPECT_DEPTH_BIT,1,2,1,1}}
};
static _Thread_local struct {
    const Case *test;
    VkDevice device;
    VkImage image;
    VkImageView handle, *caller;
    VkResult result;
    unsigned calls;
} expected;

#define CHECK(x) do { if (!(x)) { fprintf(stderr, "line %d: %s\n", __LINE__, #x); exit(3); } } while (0)

static VKAPI_ATTR VkResult VKAPI_CALL record(VkDevice device, const VkImageViewCreateInfo *info,
        const VkAllocationCallbacks *allocator, VkImageView *slot) {
    const Case *c = expected.test;
    CHECK(++expected.calls == 1 && device == expected.device && allocator == NULL);
    CHECK(info && info->sType == VK_STRUCTURE_TYPE_IMAGE_VIEW_CREATE_INFO && !info->pNext && !info->flags);
    CHECK(info->image == expected.image && info->viewType == c->type && info->format == c->format);
    CHECK(info->components.r == VK_COMPONENT_SWIZZLE_IDENTITY && info->components.g == VK_COMPONENT_SWIZZLE_IDENTITY
        && info->components.b == VK_COMPONENT_SWIZZLE_IDENTITY && info->components.a == VK_COMPONENT_SWIZZLE_IDENTITY);
    CHECK(memcmp(&info->subresourceRange, &c->range, sizeof c->range) == 0);
    CHECK(slot && slot != expected.caller && *expected.caller == VK_NULL_HANDLE);
    *slot = expected.handle;
    CHECK(*expected.caller == VK_NULL_HANDLE);
    return expected.result;
}

int osd_view_suite(void) {
    const VkResult results[] = {VK_SUCCESS, VK_ERROR_OUT_OF_HOST_MEMORY, VK_ERROR_OUT_OF_DEVICE_MEMORY};
    const uint64_t fence = UINT64_C(0x5ad4398e63c10fb2);
    struct { uint32_t left; VkImageSubresourceRange value; uint32_t right; } input = {0x35ed1c08, {0}, 0x6a7b5413};
    struct { uint64_t left; VkImageView value; uint64_t right; } output = {fence, VK_NULL_HANDLE, ~fence};
    const unsigned count = sizeof cases / sizeof cases[0];
    osd_observe_view(record);
    for (unsigned i = 0; i <= count; ++i) {
        /* Replay the bitmap at the same addresses with only its requested type changed. */
        unsigned image_id = i == count ? Bitmap : i;
        Case selected = cases[image_id];
        if (i == count) selected.type = VK_IMAGE_VIEW_TYPE_2D_ARRAY;
        const Case *c = &selected;
        for (unsigned j = 0; j < sizeof results / sizeof results[0]; ++j) {
            input.value = c->range;
            output.value = VK_NULL_HANDLE;
            expected.test = c;
            expected.device = (VkDevice)(uintptr_t)(0x100 + image_id);
            expected.image = (VkImage)(uintptr_t)(0x200 + image_id);
            expected.handle = (VkImageView)(uintptr_t)(0x300 + image_id);
            expected.caller = &output.value;
            expected.result = results[j];
            expected.calls = 0;
            VkResult result = osd_check_view(expected.device, expected.image, c->type, c->format,
                                            &input.value, &output.value);
            CHECK(result == results[j] && expected.calls == 1);
            CHECK(output.value == (result == VK_SUCCESS ? expected.handle : VK_NULL_HANDLE));
            CHECK(output.left == fence && output.right == ~fence);
            CHECK(input.left == 0x35ed1c08 && input.right == 0x6a7b5413);
            CHECK(memcmp(&input.value, &c->range, sizeof c->range) == 0);
            printf("case=%u type=%d fmt=%d aspect=%u mip=%u+%u layer=%u+%u result=%d published=%u calls=%u\n",
                i, c->type, c->format, c->range.aspectMask, c->range.baseMipLevel, c->range.levelCount,
                c->range.baseArrayLayer, c->range.layerCount, result, output.value != VK_NULL_HANDLE, expected.calls);
        }
    }
    osd_observe_view(NULL);
    return 0;
}
#ifndef OSD_THREADED_SUITE
int main(void) { return osd_view_suite(); }
#endif
