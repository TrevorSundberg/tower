#include "control.h"

static void transition(VkCommandBuffer cmd, VkImage image, uint32_t layer, uint32_t mips, int final) {
    const VkImageMemoryBarrier2 barrier = {
        .sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2,
        .srcStageMask = final ? VK_PIPELINE_STAGE_2_TRANSFER_BIT : VK_PIPELINE_STAGE_2_NONE,
        .srcAccessMask = final ? VK_ACCESS_2_TRANSFER_WRITE_BIT : 0,
        .dstStageMask = final ? VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT : VK_PIPELINE_STAGE_2_TRANSFER_BIT,
        .dstAccessMask = final ? VK_ACCESS_2_SHADER_SAMPLED_READ_BIT : VK_ACCESS_2_TRANSFER_WRITE_BIT,
        .oldLayout = final ? VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL : VK_IMAGE_LAYOUT_UNDEFINED,
        .newLayout = final ? VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL : VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
        .srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED, .dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
        .image = image, .subresourceRange = {VK_IMAGE_ASPECT_COLOR_BIT, 0, mips, layer, 1}
    };
    const VkDependencyInfo dependency = {.sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO,
        .imageMemoryBarrierCount = 1, .pImageMemoryBarriers = &barrier};
    vkCmdPipelineBarrier2(cmd, &dependency);
}

void osd_record(VkCommandBuffer cmd, VkBuffer src, VkImage dst,
                uint32_t layers, uint32_t mips, uint32_t count, const VkBufferImageCopy *regions) {
    for (uint32_t i = 0; i < layers; ++i) transition(cmd, dst, i, mips, 0);
    vkCmdCopyBufferToImage(cmd, src, dst, VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL, count, regions);
    for (uint32_t i = 0; i < layers; ++i) transition(cmd, dst, i, mips, 1);
}
