#include "../image_retirement.h"

/* Exercise the public SDK declaration from a separately compiled C caller. */
void osd_destroy_retired_image(VkDevice device, VkImageView view, VkImage image,
                               VkDeviceMemory memory) {
    tower_vk_destroy_retired_image_v1(device, view, image, memory);
}
