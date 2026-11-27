#include "buffer_upload_record.h"

/* Independently express Draw's staged commands using the Vulkan SDK types. */
void fixture_record(VkCommandBuffer cmd, VkBuffer staging, VkBuffer dst, VkDeviceSize size)
{
#ifdef USE_TOWER_RECORDER
    tower_vk_buffer_upload_record_v1(cmd, staging, dst, size);
#else
    VkBufferCopy copy = { .srcOffset = 0, .dstOffset = 0, .size = size };
    vkCmdCopyBuffer(cmd, staging, dst, 1, &copy);
    VkMemoryBarrier2 memory = {
        .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2,
        .srcStageMask = VK_PIPELINE_STAGE_2_TRANSFER_BIT,
        .srcAccessMask = VK_ACCESS_2_TRANSFER_WRITE_BIT,
        .dstStageMask = VK_PIPELINE_STAGE_2_ALL_COMMANDS_BIT,
        .dstAccessMask = VK_ACCESS_2_MEMORY_READ_BIT
    };
    VkDependencyInfo dependency = {
        .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO,
        .memoryBarrierCount = 1, .pMemoryBarriers = &memory
    };
    vkCmdPipelineBarrier2(cmd, &dependency);
#endif
}
