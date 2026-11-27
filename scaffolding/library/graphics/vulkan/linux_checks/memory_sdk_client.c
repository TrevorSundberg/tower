/* External SDK client. The retained Tower fixture selects and lends the device. */
#include "../image_format_preflight.h"
#include "../create_image.h"
#include "../image_allocation_plan.h"
#include "../image_memory.h"
#include "../bound_image_view.h"
#include <inttypes.h>
#include <stdio.h>

extern int32_t with_selected_device(void);

int main(void) {
    return with_selected_device();
}

int32_t construct_sdk_image(VkPhysicalDevice physical, VkDevice device,
                            const VkMemoryType *types, uint32_t count) {
    VkImageCreateInfo info = {
        .sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO, .imageType = VK_IMAGE_TYPE_2D,
        .format = VK_FORMAT_R8G8B8A8_UNORM, .extent = {2, 2, 1},
        .mipLevels = 1, .arrayLayers = 1, .samples = VK_SAMPLE_COUNT_1_BIT,
        .usage = VK_IMAGE_USAGE_SAMPLED_BIT
    };
    VkImageFormatProperties properties;
    VkBool32 supported;
    VkResult result = tower_vk_image_format_preflight_v1(physical, &info, &properties, &supported);
    if (result != VK_SUCCESS || !supported) {
        fprintf(stderr, "preflight result=%d supported=%u\n", result, result == VK_SUCCESS && supported);
        return 1;
    }

    VkImage image = VK_NULL_HANDLE;
    VkDeviceMemory memory = VK_NULL_HANDLE;
    VkImageView view = VK_NULL_HANDLE;
    VkMemoryAllocateInfo plan;
    VkDeviceSize live = 0;
    const char *stage = "create";
    result = tower_vk_create_image_v1(device, &info, &image);
    if (result != VK_SUCCESS) goto release;
    if (!tower_vk_plan_image_allocation_v1(device, image, types, count,
                                           VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT, &plan)) {
        fprintf(stderr, "no compatible memory type\n");
        vkDestroyImage(device, image, NULL);
        return 1;
    }
    stage = "allocate";
    result = tower_vk_allocate_memory_v1(device, &plan, &memory);
    if (result != VK_SUCCESS) goto release;
    live += plan.allocationSize;
    printf("before bind live=%" PRIu64 " type=%u\n", live, plan.memoryTypeIndex);
    stage = "bind";
    result = tower_vk_bind_image_memory_zero_v1(device, image, memory);
    if (result != VK_SUCCESS) goto release;
    const VkImageSubresourceRange range = {VK_IMAGE_ASPECT_COLOR_BIT, 0, 1, 0, 1};
    stage = "view";
    result = tower_vk_create_bound_image_view_v1(device, image, VK_IMAGE_VIEW_TYPE_2D,
                                                  info.format, &range, &view);
release:
    if (result != VK_SUCCESS) fprintf(stderr, "%s result=%d\n", stage, result);
    if (view) vkDestroyImageView(device, view, NULL);
    if (image) vkDestroyImage(device, image, NULL);
    if (memory) {
        vkFreeMemory(device, memory, NULL);
        live -= plan.allocationSize;
    }
    printf("after release live=%" PRIu64 "\n", live);
    return result != VK_SUCCESS || live != 0;
}
