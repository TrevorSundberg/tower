#include <vulkan/vulkan.h>

/* Private fixture ABI. Both paths receive identical live owner arguments. */
#ifdef EXTERNAL_TOWER
extern void fixture_tower_copy(VkCommandBuffer, VkBuffer, VkImage, VkDeviceSize);
#endif

void fixture_copy(VkCommandBuffer cmd, VkBuffer staging, VkImage image, VkDeviceSize offset)
{
#ifdef EXTERNAL_TOWER
    fixture_tower_copy(cmd, staging, image, offset);
#else
    /* Two regions, with row two and three stored before row one. */
    VkBufferImageCopy regions[] = {
        { .bufferOffset = offset + 56, .imageSubresource = { VK_IMAGE_ASPECT_COLOR_BIT, 0, 0, 1 },
          .imageExtent = { 5, 1, 1 } },
        { .bufferOffset = offset, .bufferRowLength = 7, .bufferImageHeight = 3,
          .imageSubresource = { VK_IMAGE_ASPECT_COLOR_BIT, 0, 0, 1 },
          .imageOffset = { 0, 1, 0 }, .imageExtent = { 5, 2, 1 } }
    };
    vkCmdCopyBufferToImage(cmd, staging, image, VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
                           sizeof(regions) / sizeof(regions[0]), regions);
#endif
}
