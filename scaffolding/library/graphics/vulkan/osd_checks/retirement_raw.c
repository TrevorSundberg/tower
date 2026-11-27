#include "../image_retirement.h"

/* SDK control for the external caller used in both recording and device runs. */
void osd_destroy_retired_image(VkDevice device, VkImageView view, VkImage image,
                               VkDeviceMemory memory) {
    if (view) vkDestroyImageView(device, view, NULL);
    if (image) vkDestroyImage(device, image, NULL);
    if (memory) vkFreeMemory(device, memory, NULL);
}
