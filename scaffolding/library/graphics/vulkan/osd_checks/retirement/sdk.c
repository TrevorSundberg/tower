#include "../../image_retirement.h"

typedef void Retire(VkDevice, VkImageView, VkImage, VkDeviceMemory);
_Static_assert(_Generic(&tower_vk_destroy_retired_image_v1, Retire *: 1, default: 0),
               "retirement signature differs from Vulkan SDK handle types");
_Static_assert(sizeof(VkDevice) == 8 && sizeof(VkImageView) == 8 &&
               sizeof(VkImage) == 8 && sizeof(VkDeviceMemory) == 8, "x64 handles required");

void osd_destroy_retired_image(VkDevice device, VkImageView view, VkImage image, VkDeviceMemory memory) {
    if (view) vkDestroyImageView(device, view, NULL);
    if (image) vkDestroyImage(device, image, NULL);
    if (memory) vkFreeMemory(device, memory, NULL);
}
