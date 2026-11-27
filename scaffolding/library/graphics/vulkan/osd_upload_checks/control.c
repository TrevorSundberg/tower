#include "../osd_texture_upload_record.h"
#include "../tight_color_regions.h"

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

/* Read the caller's borrowed array with the SDK's stride and field types. */
int fixture_sdk_region(const VkBufferImageCopy *regions, uint32_t i, VkDeviceSize offset,
                       uint32_t layer, uint32_t mip, uint32_t width, uint32_t height)
{
    const VkBufferImageCopy *r = &regions[i];
    return r->bufferOffset == offset && r->bufferRowLength == 0 && r->bufferImageHeight == 0 &&
           r->imageSubresource.aspectMask == VK_IMAGE_ASPECT_COLOR_BIT &&
           r->imageSubresource.mipLevel == mip && r->imageSubresource.baseArrayLayer == layer &&
           r->imageSubresource.layerCount == 1 && r->imageOffset.x == 0 && r->imageOffset.y == 0 &&
           r->imageOffset.z == 0 && r->imageExtent.width == width &&
           r->imageExtent.height == height && r->imageExtent.depth == 1;
}

/* Independent native representation for the confirmed inventories. A VkDeviceSize
 * and twelve 32-bit fields occupy the whole SDK record on the tested target. */
_Static_assert(sizeof(VkBufferImageCopy) == sizeof(VkDeviceSize) + 12 * sizeof(uint32_t),
               "byte comparison requires the padding-free Vulkan region ABI");

int fixture_sdk_inventory(uint32_t width, uint32_t height, uint32_t raw_layers, uint32_t mips,
                          const VkDeviceSize *expected_offsets, size_t count,
                          VkBufferImageCopy *out, size_t capacity)
{
    uint32_t layers = raw_layers ? raw_layers : 1;
    if ((uint64_t)layers * mips != count || count > capacity)
        return 0;
    for (size_t i = 0; i < count; ++i) {
        uint32_t mip = (uint32_t)(i % mips);
        uint32_t divisor = UINT32_C(1) << mip; /* fixed fixture mips are 0 and 1 */
        out[i] = (VkBufferImageCopy){
            .bufferOffset = expected_offsets[i],
            .imageSubresource = {VK_IMAGE_ASPECT_COLOR_BIT, mip, (uint32_t)(i / mips), 1},
            .imageExtent = {width / divisor, height / divisor, 1}
        };
    }
    return 1;
}

/* Exercise the public header and symbol from an independently linked C caller. */
uint32_t fixture_build_regions(VkBufferImageCopy *out, uint32_t capacity, uint32_t width,
                               uint32_t height, uint32_t layers, uint32_t mips,
                               uint32_t bytes_per_texel, VkDeviceSize available_bytes)
{
    return tower_vk_build_tight_color_regions_v1(out, capacity, width, height, layers, mips,
                                                 bytes_per_texel, available_bytes);
}
