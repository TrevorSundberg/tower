#include "../osd_texture_upload_record.h"

#ifndef EXTERNAL_TOWER
static void image_layer_barrier(VkCommandBuffer cmd, VkImage image, uint32_t layer, uint32_t mips,
                                VkImageLayout old, VkImageLayout next, VkPipelineStageFlags2 src,
                                VkAccessFlags2 read, VkPipelineStageFlags2 dst, VkAccessFlags2 write)
{
    VkImageMemoryBarrier2 image_barrier = {
        .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2,
        .srcStageMask = src, .srcAccessMask = read, .dstStageMask = dst, .dstAccessMask = write,
        .oldLayout = old, .newLayout = next,
        .srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED, .dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
        .image = image, .subresourceRange = {VK_IMAGE_ASPECT_COLOR_BIT, 0, mips, layer, 1}
    };
    VkDependencyInfo dependency = {.sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO,
                                  .imageMemoryBarrierCount = 1, .pImageMemoryBarriers = &image_barrier};
    vkCmdPipelineBarrier2(cmd, &dependency);
}
#endif

void fixture_record(VkCommandBuffer cmd, VkBuffer staging, VkImage image, uint32_t layers, uint32_t mips,
                    uint32_t count, const VkBufferImageCopy *regions)
{
#ifdef EXTERNAL_TOWER
    tower_vk_osd_texture_upload_record_v1(cmd, staging, image, layers, mips, count, regions);
#else
    for (uint32_t layer = 0; layer < layers; ++layer)
        image_layer_barrier(cmd, image, layer, mips, VK_IMAGE_LAYOUT_UNDEFINED, VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
                            VK_PIPELINE_STAGE_2_NONE, 0, VK_PIPELINE_STAGE_2_TRANSFER_BIT, VK_ACCESS_2_TRANSFER_WRITE_BIT);
    vkCmdCopyBufferToImage(cmd, staging, image, VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL, count, regions);
    for (uint32_t layer = 0; layer < layers; ++layer)
        image_layer_barrier(cmd, image, layer, mips, VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL, VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL,
                            VK_PIPELINE_STAGE_2_TRANSFER_BIT, VK_ACCESS_2_TRANSFER_WRITE_BIT,
                            VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT, VK_ACCESS_2_SHADER_SAMPLED_READ_BIT);
#endif
}
