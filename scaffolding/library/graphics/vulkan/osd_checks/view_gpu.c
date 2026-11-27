/* Only the frozen GPU fixture object's two SDK references are redirected here.
 * The target has its own view. The single-thread fixture runs one shape at a time. */
#include "view_check.h"
#include <windows.h>
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

static struct {
    VkDevice device;
    VkImageView sampled, subresource, full_array;
} active;

static void require(int condition, const char *message) {
    if (!condition) { fprintf(stderr, "OSD view fixture: %s\n", message); exit(3); }
}

static VkResult checked_call(VkDevice device, VkImage image, VkImageViewType type, VkFormat format,
    VkImageSubresourceRange range, VkImageView *out) {
    struct { uint32_t left; VkImageSubresourceRange value; uint32_t right; }
        input = {0x35ed1c08, range, 0x6a7b5413};
    const uint64_t guard = UINT64_C(0xc63a9127498bd050);
    struct { uint64_t left; VkImageView value; uint64_t right; } output = {guard, VK_NULL_HANDLE, ~guard};
    LARGE_INTEGER frequency, start, stop;
    require(QueryPerformanceFrequency(&frequency) && QueryPerformanceCounter(&start), "performance counter");
    VkResult result = osd_check_view(device, image, type, format, &input.value, &output.value);
    require(QueryPerformanceCounter(&stop), "performance counter");
    require(input.left == 0x35ed1c08 && input.right == 0x6a7b5413
        && !memcmp(&input.value, &range, sizeof range), "borrowed range or guard modified");
    require(output.left == guard && output.right == ~guard, "output guard modified");
    require((output.value != VK_NULL_HANDLE) == (result == VK_SUCCESS), "view publication");
    printf("osd_view device=%p image=%p view=%p type=%d format=%d aspect=%u mip=%u+%u layer=%u+%u result=%d ticks=%lld hz=%lld\n",
        (void *)device, (void *)image, (void *)output.value, type, format, range.aspectMask, range.baseMipLevel,
        range.levelCount, range.baseArrayLayer, range.layerCount, result, stop.QuadPart-start.QuadPart, frequency.QuadPart);
    if (result == VK_SUCCESS) *out = output.value;
    return result;
}

VKAPI_ATTR VkResult VKAPI_CALL osd_fixture_create_view(VkDevice device, const VkImageViewCreateInfo *info,
        const VkAllocationCallbacks *allocator, VkImageView *out) {
    if (info->format == VK_FORMAT_R8G8B8A8_UNORM)
        return vkCreateImageView(device, info, allocator, out); /* original readback target */
    require(active.sampled == VK_NULL_HANDLE && allocator == NULL, "source lifetime or allocator");
    VkImageSubresourceRange range = info->subresourceRange;
    VkResult result = checked_call(device, info->image, info->viewType, info->format, range, out);
    if (result != VK_SUCCESS) return result;
    active.device = device;
    active.sampled = *out;
    if (range.layerCount == 6 || range.levelCount == 2) {
        /* A nonzero layer slice of the font or mip 1 of an actual one-layer bitmap. */
        if (range.levelCount == 2) { range.baseMipLevel = 1; range.levelCount = 1; }
        else { range.baseArrayLayer = 2; range.layerCount = 3; }
        result = checked_call(device, info->image, VK_IMAGE_VIEW_TYPE_2D_ARRAY, info->format,
                              range, &active.subresource);
        if (result == VK_SUCCESS && info->subresourceRange.levelCount == 2) {
            /* Same bitmap, format and full range as the sampled 2D view. */
            result = checked_call(device, info->image, VK_IMAGE_VIEW_TYPE_2D_ARRAY, info->format,
                                  info->subresourceRange, &active.full_array);
        }
        if (result != VK_SUCCESS) {
            if (active.subresource) vkDestroyImageView(device, active.subresource, NULL);
            active.subresource = VK_NULL_HANDLE;
            vkDestroyImageView(device, active.sampled, NULL);
            active.sampled = *out = VK_NULL_HANDLE;
        }
    }
    return result;
}

/* Extra test views remain with the fixture that created them. */
void osd_fixture_release_extra_views(VkDevice device, VkImageView view) {
    require(view && view == active.sampled && device == active.device, "source retirement owner");
    if (active.full_array) vkDestroyImageView(device, active.full_array, NULL);
    if (active.subresource) vkDestroyImageView(device, active.subresource, NULL);
    active.sampled = active.subresource = active.full_array = VK_NULL_HANDLE;
}

VKAPI_ATTR void VKAPI_CALL osd_fixture_destroy_view(VkDevice device, VkImageView view,
        const VkAllocationCallbacks *allocator) {
    if (view && view == active.sampled) {
        require(allocator == NULL, "source retirement allocator");
        osd_fixture_release_extra_views(device, view);
    }
    vkDestroyImageView(device, view, allocator);
}
